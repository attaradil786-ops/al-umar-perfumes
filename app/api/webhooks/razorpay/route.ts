import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay signature header.' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured.');
      // Reject if secret is not set
      return NextResponse.json(
        { error: 'Webhook secret is not configured.' },
        { status: 500 }
      );
    }

    // Read raw body for HMAC verification
    const rawBody = await req.text();

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const providedBuf = Buffer.from(signature, 'utf8');

    const isValid =
      expectedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, providedBuf);

    if (!isValid) {
      console.warn('Rejected invalid Razorpay webhook signature attempt.');
      return NextResponse.json(
        { error: 'Invalid webhook signature.' },
        { status: 400 }
      );
    }

    // Parse verified payload
    const event = JSON.parse(rawBody);
    const eventType = event.event;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderNumber =
        paymentEntity?.notes?.orderNumber ||
        event.payload?.order?.entity?.receipt;
      const paymentId = paymentEntity?.id;

      if (orderNumber) {
        const order = await prisma.order.findUnique({
          where: { orderNumber },
          include: { items: true },
        });

        if (order && order.paymentStatus !== 'paid') {
          // Idempotent atomic transaction
          await prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({
              where: { id: order.id },
              include: { items: true },
            });

            if (!currentOrder || currentOrder.paymentStatus === 'paid') {
              return;
            }

            // Mark paid
            await tx.order.update({
              where: { id: currentOrder.id },
              data: {
                paymentStatus: 'paid',
                paymentId: paymentId || currentOrder.paymentId,
                status: 'placed',
              },
            });

            // Decrement stock safely
            for (const item of currentOrder.items) {
              const product = await tx.product.findUnique({
                where: { id: item.productId },
                select: { stock: true },
              });
              if (product) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: Math.max(0, product.stock - item.quantity) },
                });
              }
            }

            // Increment coupon usage
            if (currentOrder.couponCode) {
              await tx.coupon.updateMany({
                where: { code: currentOrder.couponCode },
                data: { usedCount: { increment: 1 } },
              });
            }
          });
        }
      }
    }

    // Always respond with 200 OK to acknowledge verified webhook
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
