import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderNumber,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = body;

    if (!orderNumber || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: 'Missing required Razorpay payment verification parameters.' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    // Idempotency check: If already marked as paid, return success without duplicate stock decrements
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({
        success: true,
        orderNumber: order.orderNumber,
        message: 'Order already verified.',
      });
    }

    // Strict Razorpay HMAC-SHA256 signature verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || secret.includes('placeholderSecretKey')) {
      // In production, reject immediately if secret is not properly configured
      if (process.env.NODE_ENV === 'production') {
        console.error('RAZORPAY_KEY_SECRET is not configured in production.');
        return NextResponse.json(
          { success: false, error: 'Payment gateway configuration error.' },
          { status: 500 }
        );
      }
    }

    const verificationSecret = secret || 'placeholderSecretKey';
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', verificationSecret)
      .update(text)
      .digest('hex');

    // Use timingSafeEqual to prevent side-channel timing attacks
    const generatedBuf = Buffer.from(generatedSignature, 'utf8');
    const providedBuf = Buffer.from(razorpaySignature, 'utf8');

    const isValid =
      generatedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(generatedBuf, providedBuf);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid Razorpay payment signature.' },
        { status: 400 }
      );
    }

    // Execute atomic transaction for order update, stock decrement, and coupon usage
    await prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction to lock and prevent race conditions
      const currentOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      if (!currentOrder || currentOrder.paymentStatus === 'paid') {
        return;
      }

      // 1. Mark order as paid
      await tx.order.update({
        where: { id: currentOrder.id },
        data: {
          paymentStatus: 'paid',
          paymentId: razorpayPaymentId,
          status: 'placed',
        },
      });

      // 2. Decrement stock atomically
      for (const item of currentOrder.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });

        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });
        }
      }

      // 3. Atomically increment coupon usedCount if coupon was used
      if (currentOrder.couponCode) {
        await tx.coupon.updateMany({
          where: {
            code: currentOrder.couponCode,
          },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }
    });

    // Send confirmation email via Resend if email is provided
    if (order.email && process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder')) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const itemsListHtml = order.items
          .map(
            i => `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #E8DCC8;">${i.name} (${i.size || 'Standard'})</td>
              <td style="padding: 8px; border-bottom: 1px solid #E8DCC8; text-align: center;">${i.quantity}</td>
              <td style="padding: 8px; border-bottom: 1px solid #E8DCC8; text-align: right;">₹${i.price * i.quantity}</td>
            </tr>`
          )
          .join('');

        await resend.emails.send({
          from: 'Al Umar Perfumes <orders@alumarperfumes.com>',
          to: order.email,
          subject: `Order Confirmation #${order.orderNumber} - Al Umar Perfumes`,
          html: `
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FFF8EC; padding: 24px; border-radius: 12px; border: 1px solid #E8DCC8; color: #121212;">
              <h1 style="color: #1E6B5C; font-family: serif; font-size: 24px; margin-bottom: 8px;">Order Confirmed!</h1>
              <p style="color: #553E23; font-size: 14px;">Assalamu Alaikum <strong>${order.customerName}</strong>,</p>
              <p style="color: #553E23; font-size: 14px; line-height: 1.6;">
                Thank you for your order with Al Umar Perfumes. Your payment has been received and your artisanal fragrance parcel is being prepared at our atelier.
              </p>
              <div style="background: white; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #E8DCC8;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #553E23;">Order Details: #${order.orderNumber}</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <thead>
                    <tr style="background: #F8F4EC; color: #553E23;">
                      <th style="padding: 8px; text-align: left;">Item</th>
                      <th style="padding: 8px; text-align: center;">Qty</th>
                      <th style="padding: 8px; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>${itemsListHtml}</tbody>
                </table>
                <div style="margin-top: 16px; text-align: right; font-size: 14px; font-weight: bold; color: #1E6B5C;">
                  Total Paid: ₹${order.total.toLocaleString('en-IN')}
                </div>
              </div>
              <p style="font-size: 12px; color: #7A5B37;">
                Delivery Address: ${order.address}, ${order.city}, ${order.state} - ${order.pincode}<br/>
                Contact: ${order.phone}
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Failed to send order confirmation email via Resend:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('POST /api/checkout/verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment.' },
      { status: 500 }
    );
  }
}
