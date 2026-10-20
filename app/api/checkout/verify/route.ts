import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { Resend } from 'resend';
import { getShippingSettings } from '@/lib/shipping-settings';
import { createShipment } from '@/lib/shiprocket';
import { triggerOrderStatusNotifications } from '@/lib/notifications';

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

    // Dispatch order confirmation notifications across Email & WhatsApp
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
    ).catch(err => console.error('Order placed notification error:', err));

    // Check if auto_ship_on_payment is enabled in Shipping Settings
    const shippingSettings = await getShippingSettings();
    if (shippingSettings.auto_ship_on_payment && !order.awbNumber) {
      try {
        console.log(`[Auto-Ship] Triggering automated Shiprocket dispatch for Order #${order.orderNumber}...`);
        const shipment = await createShipment({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          phone: order.phone,
          email: order.email,
          address: order.address,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          subtotal: order.subtotal,
          discount: order.discount,
          shipping: order.shipping,
          total: order.total,
          paymentMethod: 'PREPAID',
          createdAt: order.createdAt,
          items: order.items,
        });

        const trackingUrl = `https://shiprocket.co/tracking/${shipment.awb_number}`;

        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'shipped',
            shipmentStatus: 'shipped',
            awbNumber: shipment.awb_number,
            courierName: shipment.courier_name,
            shipmentId: shipment.shipment_id,
            trackingUrl,
            shippedNotificationSent: true,
          },
        });

        // Send Order Shipped notification with AWB & tracking link
        triggerOrderStatusNotifications(
          {
            orderNumber: updatedOrder.orderNumber,
            customerName: updatedOrder.customerName,
            phone: updatedOrder.phone,
            email: updatedOrder.email,
            total: updatedOrder.total,
            subtotal: updatedOrder.subtotal,
            discount: updatedOrder.discount,
            shipping: updatedOrder.shipping,
            address: updatedOrder.address,
            city: updatedOrder.city,
            state: updatedOrder.state,
            pincode: updatedOrder.pincode,
            awbNumber: updatedOrder.awbNumber,
            trackingUrl: updatedOrder.trackingUrl,
            items: order.items,
          },
          'shipped'
        ).catch(err => console.error('Auto-ship notification error:', err));
      } catch (shipErr: any) {
        console.error(`[Auto-Ship Error for Order #${order.orderNumber}]:`, shipErr);
        await prisma.order.update({
          where: { id: order.id },
          data: {
            shipmentStatus: 'failed',
            shipmentError: shipErr.message || 'Auto-shipment push failed',
          },
        });
        // Never lose order - keeps order placed and marked as failed for manual retry in admin
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
