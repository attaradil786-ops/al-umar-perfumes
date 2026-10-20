import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { createShipment } from '@/lib/shiprocket';
import { triggerOrderStatusNotifications } from '@/lib/notifications';

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
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Idempotency: If AWB already exists, return current details
    if (order.awbNumber) {
      return NextResponse.json({
        success: true,
        message: 'Order already has an assigned AWB.',
        order,
      });
    }

    console.log(`[Shiprocket Manual Push] Pushing Order #${order.orderNumber} to Shiprocket...`);

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
      codFee: order.codFee,
      total: order.total,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      items: order.items,
    });

    const trackingUrl = `https://shiprocket.co/tracking/${shipment.awb_number}`;

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'shipped',
        shipmentStatus: 'shipped',
        shipmentError: null,
        awbNumber: shipment.awb_number,
        courierName: shipment.courier_name,
        shipmentId: shipment.shipment_id,
        trackingUrl,
        shippedNotificationSent: true,
      },
      include: { items: true },
    });

    // Send customer shipped notifications with AWB & tracking link
    triggerOrderStatusNotifications(
      {
        orderNumber: updated.orderNumber,
        customerName: updated.customerName,
        phone: updated.phone,
        email: updated.email,
        total: updated.total,
        subtotal: updated.subtotal,
        discount: updated.discount,
        shipping: updated.shipping,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        pincode: updated.pincode,
        awbNumber: updated.awbNumber,
        trackingUrl: updated.trackingUrl,
        items: updated.items,
      },
      'shipped'
    ).catch(err => console.error('Notification dispatch error:', err));

    return NextResponse.json({
      success: true,
      message: `Shipment pushed successfully! AWB: ${shipment.awb_number} via ${shipment.courier_name}`,
      order: updated,
    });
  } catch (error: any) {
    const errMsg = error.message || 'Failed to push shipment to Shiprocket';
    console.error(`[Manual Ship Error for Order ${params.id}]:`, error);

    // Update order with failure status and error message
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: params.id }, { orderNumber: params.id }] },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shipmentStatus: 'failed',
          shipmentError: errMsg,
        },
      });
    }

    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
