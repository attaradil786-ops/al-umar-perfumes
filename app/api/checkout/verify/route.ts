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

    if (!orderNumber || !razorpayPaymentId) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification credentials.' },
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

    // Verify Razorpay HMAC signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholderSecretKey';
    let isValid = false;

    if (secret && !secret.includes('placeholderSecretKey') && razorpayOrderId && razorpaySignature) {
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex');

      isValid = generatedSignature === razorpaySignature;
    } else {
      // In local testing / mock simulation mode without live credentials, accept test credentials
      isValid = Boolean(razorpayPaymentId);
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid Razorpay payment signature.' },
        { status: 400 }
      );
    }

    // Update Order: paymentStatus="paid", paymentId
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'paid',
        paymentId: razorpayPaymentId,
        status: 'placed',
      },
    });

    // Decrement stock for each item in the order
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      }).catch(err => {
        console.error(`Failed to decrement stock for product ${item.productId}:`, err);
      });
    }

    // If coupon used, increment coupon's usedCount
    if (order.couponCode) {
      await prisma.coupon.update({
        where: { code: order.couponCode },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      }).catch(err => {
        console.error(`Failed to update coupon usage for ${order.couponCode}:`, err);
      });
    }

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
