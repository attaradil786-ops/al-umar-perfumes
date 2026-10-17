import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface OrderItemInput {
  productId?: string;
  id?: string;
  name: string;
  price: number;
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
      customerName: string;
      phone: string;
      email?: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      items: OrderItemInput[];
      couponCode?: string;
      paymentMethod?: string;
    };

    if (!customerName || !phone || !address || !city || !state || !pincode || !items || !items.length) {
      return NextResponse.json({ error: 'Please fill in all required shipping details' }, { status: 400 });
    }

    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of items) {
      subtotal += (Number(item.price) || 0) * (Number(item.quantity) || 1);
    }

    // Coupon calculation
    let discount = 0;
    let validCouponId: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      });
      if (coupon && coupon.isActive && (!coupon.expiresAt || new Date() <= coupon.expiresAt)) {
        if (subtotal >= coupon.minOrder) {
          validCouponId = coupon.id;
          const typeUpper = (coupon.type || '').toUpperCase();
          if (typeUpper === 'PERCENTAGE' || typeUpper === 'PERCENT') {
            const pct = Math.min(100, Math.max(0, coupon.value));
            discount = Math.min(subtotal, Math.round((subtotal * pct) / 100));
          } else if (typeUpper === 'FREE_SHIPPING' || typeUpper === 'FREESHIPPING') {
            discount = subtotal >= 1500 ? 0 : 100;
          } else {
            discount = Math.min(coupon.value, subtotal);
          }
        }
      }
    }

    // Free shipping threshold ₹1500
    const shipping = subtotal >= 1500 ? 0 : 100;
    const total = Math.max(0, subtotal - discount + shipping);

    const orderNumber = `ALU-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.$transaction(async (tx) => {
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
          subtotal,
          discount,
          shipping,
          total,
          couponCode: (validCouponId && couponCode) ? couponCode.toUpperCase().trim() : null,
          paymentStatus: paymentMethod === 'COD' ? 'PENDING_COD' : 'PENDING_ONLINE',
          status: 'PENDING',
          items: {
            create: items.map((it: OrderItemInput) => ({
              productId: it.productId || it.id || '',
              name: it.name,
              price: Number(it.price),
              quantity: Number(it.quantity),
              size: it.size || null,
            })),
          },
        },
        include: { items: true },
      });

      // Update coupon usage
      if (validCouponId) {
        await tx.coupon.update({
          where: { id: validCouponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Decrement stock
      for (const item of items) {
        if (item.productId || item.id) {
          await tx.product.update({
            where: { id: item.productId || item.id },
            data: { stock: { decrement: Number(item.quantity) || 1 } },
          }).catch(() => {
            // ignore if product missing
          });
        }
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
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
