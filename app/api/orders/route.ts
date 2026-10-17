import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

interface OrderItemInput {
  productId?: string;
  id?: string;
  name?: string;
  price?: number;
  quantity: number;
  size?: string | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      items,
      couponCode,
      paymentMethod,
    } = body as {
      customerName?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      items?: OrderItemInput[];
      couponCode?: string;
      paymentMethod?: string;
    };

    if (!customerName || !phone || !address || !city || !state || !pincode || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Please fill in all required shipping and order details.' }, { status: 400 });
    }

    // Server-side product price & stock verification
    const productIds = items.map(i => i.productId || i.id).filter(Boolean) as string[];
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      size: string | null;
    }> = [];

    for (const item of items) {
      const pid = item.productId || item.id;
      if (!pid) {
        return NextResponse.json({ error: 'Product ID is required for each cart item.' }, { status: 400 });
      }

      const dbProduct = productMap.get(pid);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product is no longer active or available.` },
          { status: 400 }
        );
      }

      // Enforce quantity constraints: 1 to 100
      const rawQty = parseInt(String(item.quantity), 10);
      if (isNaN(rawQty) || rawQty < 1 || rawQty > 100) {
        return NextResponse.json(
          { error: `Invalid quantity for "${dbProduct.name}". Allowed quantity is 1 to 100.` },
          { status: 400 }
        );
      }

      if (dbProduct.stock < rawQty) {
        return NextResponse.json(
          { error: `Only ${dbProduct.stock} units of "${dbProduct.name}" available in stock.` },
          { status: 400 }
        );
      }

      // Always derive price from DB variants - NEVER trust client price
      let unitPrice = dbProduct.price;
      const opt = typeof item.size === 'string' ? item.size.trim() : null;

      const rawVariants = Array.isArray(dbProduct.variants) ? (dbProduct.variants as any[]) : [];
      const matchedVariant = opt
        ? rawVariants.find(
            (v: any) => v && typeof v === 'object' && v.label && v.label.toLowerCase() === opt.toLowerCase()
          )
        : null;

      if (matchedVariant) {
        unitPrice = Math.max(1, Math.round(Number(matchedVariant.price) || dbProduct.price));
        if (matchedVariant.stock !== undefined && matchedVariant.stock < rawQty) {
          return NextResponse.json(
            { error: `Only ${matchedVariant.stock} units of "${dbProduct.name} (${matchedVariant.label})" available in stock.` },
            { status: 400 }
          );
        }
      } else if (opt) {
        if (opt.toLowerCase().includes('12ml')) {
          unitPrice = Math.round(dbProduct.price * 1.8);
        } else if (opt.toLowerCase().includes('3ml')) {
          unitPrice = Math.round(dbProduct.price * 0.6);
        }
      }

      calculatedSubtotal += unitPrice * rawQty;
      validatedItems.push({
        productId: dbProduct.id,
        name: dbProduct.name,
        price: unitPrice,
        quantity: rawQty,
        size: opt,
      });
    }

    // Re-verify coupon strictly server-side
    let discount = 0;
    let validCouponId: string | null = null;
    let appliedCouponCode: string | null = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const cleanCode = couponCode.toUpperCase().trim();
      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (coupon && coupon.isActive && coupon.value > 0) {
        const notExpired = !coupon.expiresAt || new Date() <= coupon.expiresAt;
        const usesAvailable = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
        const minOrderMet = calculatedSubtotal >= coupon.minOrder;

        // Enforce 1 use per customer rule
        const cleanPhone = (phone || '').replace(/\D/g, '');
        const cleanPhone10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : '';
        const cleanEmail = (email || '').trim().toLowerCase();

        const orConditions: any[] = [];
        if (cleanPhone10) orConditions.push({ phone: { contains: cleanPhone10 } });
        if (cleanEmail) orConditions.push({ email: { equals: cleanEmail, mode: 'insensitive' as const } });

        let alreadyRedeemed = false;
        if (orConditions.length > 0) {
          const priorOrder = await prisma.order.findFirst({
            where: {
              couponCode: cleanCode,
              status: { not: 'Cancelled' },
              OR: orConditions,
            },
          });
          if (priorOrder) alreadyRedeemed = true;
        }

        if (alreadyRedeemed) {
          return NextResponse.json(
            { error: 'You have already redeemed this coupon code on a previous order.' },
            { status: 400 }
          );
        }

        if (notExpired && usesAvailable && minOrderMet) {
          validCouponId = coupon.id;
          appliedCouponCode = coupon.code;
          const typeUpper = (coupon.type || '').toUpperCase();
          if (typeUpper === 'PERCENTAGE' || typeUpper === 'PERCENT') {
            const pct = Math.min(100, Math.max(0, coupon.value));
            discount = Math.min(calculatedSubtotal, Math.round((calculatedSubtotal * pct) / 100));
          } else if (typeUpper === 'FREE_SHIPPING' || typeUpper === 'FREESHIPPING') {
            discount = calculatedSubtotal >= 1500 ? 0 : 100;
          } else {
            discount = Math.min(coupon.value, calculatedSubtotal);
          }
        }
      }
    }

    // Free shipping threshold ₹1500
    const initialShipping = calculatedSubtotal >= 1500 ? 0 : 100;
    const finalShipping = appliedCouponCode && appliedCouponCode.includes('FREE') ? 0 : initialShipping;
    const finalTotal = Math.max(0, calculatedSubtotal - discount + finalShipping);

    // Cryptographically random order number
    const randomNonce = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `ALU-${Date.now().toString(36).toUpperCase()}-${randomNonce}`;

    const order = await prisma.$transaction(async (tx) => {
      // Re-verify stock inside transaction
      for (const it of validatedItems) {
        const p = await tx.product.findUnique({ where: { id: it.productId }, select: { stock: true } });
        if (!p || p.stock < it.quantity) {
          throw new Error(`Insufficient stock for product ID ${it.productId}`);
        }
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: customerName.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          subtotal: calculatedSubtotal,
          discount,
          shipping: finalShipping,
          total: finalTotal,
          couponCode: appliedCouponCode,
          paymentStatus: paymentMethod === 'COD' ? 'PENDING_COD' : 'PENDING_ONLINE',
          status: 'placed',
          items: {
            create: validatedItems.map(it => ({
              productId: it.productId,
              name: it.name,
              price: it.price,
              quantity: it.quantity,
              size: it.size,
            })),
          },
        },
        include: { items: true },
      });

      // Update coupon usage atomically
      if (validCouponId) {
        await tx.coupon.update({
          where: { id: validCouponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Decrement stock atomically
      for (const item of validatedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      total: order.total,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order. Please check item availability.' }, { status: 500 });
  }
}
