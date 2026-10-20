import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AddressFormSchema } from '@/lib/validators';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getServiceability } from '@/lib/shiprocket';
import { getShippingSettings } from '@/lib/shipping-settings';
import { triggerOrderStatusNotifications } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      items,
      couponCode,
    } = body;

    // Validate address form
    const addressValidation = AddressFormSchema.safeParse({
      name,
      phone,
      email,
      address,
      city,
      state,
      pincode,
    });

    if (!addressValidation.success) {
      const firstError = addressValidation.error.issues[0]?.message || 'Invalid address data';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Your cart is empty' }, { status: 400 });
    }

    // Server-side price & stock recalculation
    const productIds = items.map((i: any) => i.productId || i.id).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let calculatedSubtotal = 0;
    const validatedOrderItems: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      size?: string;
    }> = [];

    for (const item of items) {
      const pid = item.productId || item.id;
      const dbProduct = productMap.get(pid);

      if (!dbProduct) {
        return NextResponse.json(
          { success: false, error: `Product "${item.name || pid}" is no longer available.` },
          { status: 400 }
        );
      }

      const rawQty = parseInt(item.quantity, 10);
      if (isNaN(rawQty) || rawQty < 1 || rawQty > 100) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity for "${dbProduct.name}". Allowed quantity is 1 to 100.` },
          { status: 400 }
        );
      }
      const qty = rawQty;

      if (dbProduct.stock < qty) {
        return NextResponse.json(
          {
            success: false,
            error: `Only ${dbProduct.stock} units of "${dbProduct.name}" are available in stock.`,
          },
          { status: 400 }
        );
      }

      // Base price and size determination from DB variants
      let unitPrice = dbProduct.price;
      const opt = typeof item.size === 'string' ? item.size.trim() : '';

      const rawVariants = Array.isArray(dbProduct.variants) ? (dbProduct.variants as any[]) : [];
      const matchedVariant = rawVariants.find(
        (v: any) => v && typeof v === 'object' && v.label && v.label.toLowerCase() === opt.toLowerCase()
      );

      if (matchedVariant) {
        unitPrice = Math.max(1, Math.round(Number(matchedVariant.price) || dbProduct.price));
        if (matchedVariant.stock !== undefined && matchedVariant.stock < qty) {
          return NextResponse.json(
            {
              success: false,
              error: `Only ${matchedVariant.stock} units of "${dbProduct.name} (${matchedVariant.label})" are available in stock.`,
            },
            { status: 400 }
          );
        }
      } else {
        // Fallback for perfumes without explicit variant array
        if (opt.toLowerCase().includes('12ml')) {
          unitPrice = Math.round(dbProduct.price * 1.8);
        } else if (opt.toLowerCase().includes('3ml')) {
          unitPrice = Math.round(dbProduct.price * 0.6);
        }
      }

      calculatedSubtotal += unitPrice * qty;
      validatedOrderItems.push({
        productId: dbProduct.id,
        name: dbProduct.name,
        price: unitPrice,
        quantity: qty,
        size: opt || (dbProduct.category?.toLowerCase().includes('book') ? 'Standard' : '6ml'),
      });
    }

    // Coupon calculation (re-verified against DB)
    let discount = 0;
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
            { success: false, error: 'You have already redeemed this coupon code on a previous order.' },
            { status: 400 }
          );
        }

        if (notExpired && usesAvailable && minOrderMet) {
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

    // STEP 2: Server-side shipping calculation with Shiprocket
    const shippingSettings = await getShippingSettings();
    const cleanPincode = pincode.replace(/\D/g, '').trim();
    const isCODRequested = String(body.paymentMethod || '').toUpperCase() === 'COD';

    // Calculate total package weight
    let totalCartWeight = 0;
    for (const item of validatedOrderItems) {
      const dbProd = productMap.get(item.productId);
      const itemWeight = (dbProd && dbProd.weight) || 0.5;
      totalCartWeight += itemWeight * item.quantity;
    }
    totalCartWeight = Math.max(0.5, totalCartWeight);

    // Verify destination pincode serviceability via Shiprocket
    const serviceability = await getServiceability(
      cleanPincode,
      totalCartWeight,
      isCODRequested,
      calculatedSubtotal
    );

    if (!serviceability.serviceable) {
      return NextResponse.json(
        {
          success: false,
          error: serviceability.error || `Delivery is not serviceable to pincode ${cleanPincode}. Please choose another delivery address.`,
        },
        { status: 400 }
      );
    }

    // Server-side Shipping rate rule:
    // 1. If subtotal >= free_above, shipping = 0
    // 2. Else if shipping_mode is "live_rates", use cheapest rate from getServiceability()
    // 3. If Shiprocket fails or mode is "flat", fall back to flat_rate
    let finalShipping = 0;
    const isFreeShipping =
      calculatedSubtotal >= shippingSettings.free_above ||
      Boolean(appliedCouponCode && couponCode?.toUpperCase().includes('FREE'));

    if (!isFreeShipping) {
      if (shippingSettings.shipping_mode === 'live_rates') {
        finalShipping = serviceability.rate || shippingSettings.flat_rate;
      } else {
        finalShipping = shippingSettings.flat_rate;
      }
    }

    // COD Validation and Fee calculation
    let codFee = 0;
    let paymentMethod = 'PREPAID';

    if (isCODRequested) {
      if (!shippingSettings.cod_enabled) {
        return NextResponse.json(
          { success: false, error: 'Cash on Delivery (COD) is currently disabled.' },
          { status: 400 }
        );
      }
      paymentMethod = 'COD';
      codFee = shippingSettings.cod_fee || 0;
    }

    const finalTotal = Math.max(0, calculatedSubtotal - discount + finalShipping + codFee);

    // If client provided expected total, reject if there's any discrepancy
    if (body.clientTotal !== undefined && Math.abs(Number(body.clientTotal) - finalTotal) > 0) {
      return NextResponse.json(
        { success: false, error: 'Price or delivery fee discrepancy detected. Please review your order summary.' },
        { status: 400 }
      );
    }

    // Create cryptographically secure unpredictable order number
    const randomNonce = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `ALU-${Date.now().toString(36).toUpperCase()}-${randomNonce}`;

    // ------------------------------------------------------------------------
    // CASE 1: Cash on Delivery (COD)
    // ------------------------------------------------------------------------
    if (paymentMethod === 'COD') {
      const order = await prisma.$transaction(async (tx) => {
        // Create Order with paymentStatus="pending_cod", status="placed"
        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            customerName: name.trim(),
            phone: phone.trim(),
            email: email && email.trim() ? email.trim() : null,
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: cleanPincode,
            subtotal: calculatedSubtotal,
            discount,
            shipping: finalShipping,
            codFee,
            total: finalTotal,
            couponCode: appliedCouponCode,
            paymentMethod: 'COD',
            paymentStatus: 'pending_cod',
            status: 'placed',
            items: {
              create: validatedOrderItems.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
              })),
            },
          },
          include: { items: true },
        });

        // Decrement stock immediately for COD orders
        for (const item of validatedOrderItems) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: Math.max(0, prod.stock - item.quantity) },
            });
          }
        }

        // Increment coupon count if used
        if (appliedCouponCode) {
          await tx.coupon.updateMany({
            where: { code: appliedCouponCode },
            data: { usedCount: { increment: 1 } },
          });
        }

        return createdOrder;
      });

      // Dispatch order confirmation notifications asynchronously
      triggerOrderStatusNotifications(
        {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          phone: order.phone,
          email: order.email,
          total: order.total,
          subtotal: order.subtotal,
          discount: order.discount,
          shipping: order.shipping,
          address: order.address,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          items: order.items,
        },
        'placed'
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        isCOD: true,
        orderNumber: order.orderNumber,
        total: finalTotal,
        message: 'COD Order placed successfully!',
      });
    }

    // ------------------------------------------------------------------------
    // CASE 2: Prepaid via Razorpay
    // ------------------------------------------------------------------------
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: name.trim(),
        phone: phone.trim(),
        email: email && email.trim() ? email.trim() : null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPincode,
        subtotal: calculatedSubtotal,
        discount,
        shipping: finalShipping,
        codFee: 0,
        total: finalTotal,
        couponCode: appliedCouponCode,
        paymentMethod: 'PREPAID',
        paymentStatus: 'pending',
        status: 'placed',
        items: {
          create: validatedOrderItems.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
          })),
        },
      },
    });

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholderKeyId';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholderSecretKey';
    let razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const isLiveOrTestKey = razorpayKeyId && razorpayKeySecret && !razorpayKeyId.includes('placeholderKeyId');

    if (isLiveOrTestKey) {
      try {
        const rzp = new Razorpay({
          key_id: razorpayKeyId,
          key_secret: razorpayKeySecret,
        });

        const rzpOrder = await rzp.orders.create({
          amount: finalTotal * 100, // paise
          currency: 'INR',
          receipt: orderNumber,
          notes: {
            orderNumber,
            phone: phone.trim(),
          },
        });

        if (rzpOrder && rzpOrder.id) {
          razorpayOrderId = rzpOrder.id;
        }
      } catch (rzpErr) {
        console.error('Razorpay orders.create error, using mock orderId for test flow:', rzpErr);
      }
    }

    return NextResponse.json({
      success: true,
      isCOD: false,
      orderNumber: order.orderNumber,
      razorpayOrderId,
      amount: finalTotal * 100,
      currency: 'INR',
      key: razorpayKeyId,
    });
  } catch (error) {
    console.error('POST /api/checkout/create-order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate checkout order.' },
      { status: 500 }
    );
  }
}
