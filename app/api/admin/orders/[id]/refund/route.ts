import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import Razorpay from 'razorpay';
import { triggerRefundNotifications } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus?.toLowerCase() === 'refunded') {
      return NextResponse.json(
        { error: 'Order is already marked as refunded.' },
        { status: 400 }
      );
    }

    let refundId: string | null = null;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isLiveOrTestKey =
      keyId &&
      keySecret &&
      !keyId.includes('placeholderKeyId') &&
      !keySecret.includes('placeholderSecretKey');

    if (isLiveOrTestKey && order.paymentId) {
      try {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const refundResponse = await razorpay.payments.refund(order.paymentId, {
          amount: order.total * 100, // paise
          notes: {
            orderNumber: order.orderNumber,
            reason: 'Admin initiated refund from dashboard',
          },
        });

        refundId = refundResponse?.id || null;
        console.log(`[Razorpay Refund] Success for Order #${order.orderNumber}:`, refundResponse);
      } catch (rzpErr) {
        console.error('[Razorpay Refund Error]:', rzpErr);
        const errMsg = rzpErr instanceof Error ? rzpErr.message : 'Razorpay gateway error';
        return NextResponse.json(
          { error: `Payment gateway refund failed: ${errMsg}` },
          { status: 502 }
        );
      }
    } else {
      // Simulation / mock flow when running with mock keys
      refundId = `rfnd_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[Razorpay Refund Mock] Order #${order.orderNumber} simulated refund ID: ${refundId}`);
    }

    // Update order status in DB
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'refunded',
        status: order.status.toLowerCase() === 'delivered' ? order.status : 'cancelled',
      },
      include: {
        items: true,
      },
    });

    // Trigger customer notification email
    await triggerRefundNotifications(
      {
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customerName,
        phone: updatedOrder.phone,
        email: updatedOrder.email,
        total: updatedOrder.total,
        address: updatedOrder.address,
        city: updatedOrder.city,
        state: updatedOrder.state,
        pincode: updatedOrder.pincode,
        items: updatedOrder.items,
      },
      updatedOrder.total,
      refundId
    );

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      refundId,
      order: updatedOrder,
    });
  } catch (error: unknown) {
    console.error('Refund Route Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process refund';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
