import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { triggerOrderStatusNotifications } from '@/lib/notifications';
import { createShipment } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

export async function GET(
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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Fetch existing order to check for status transitions
    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const targetStatus = body.status ? body.status.toLowerCase().trim() : existingOrder.status.toLowerCase().trim();
    const isTransitionToShipped = targetStatus === 'shipped';

    const dataToUpdate: Prisma.OrderUpdateInput = {};
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.paymentStatus !== undefined) dataToUpdate.paymentStatus = body.paymentStatus;
    if (body.awbNumber !== undefined) dataToUpdate.awbNumber = body.awbNumber;
    if (body.trackingUrl !== undefined) dataToUpdate.trackingUrl = body.trackingUrl;
    if (body.shipmentId !== undefined) dataToUpdate.shipmentId = body.shipmentId;
    if (body.courierName !== undefined) dataToUpdate.courierName = body.courierName;

    let shipmentCreatedSuccessfully = false;
    let createdAwb = existingOrder.awbNumber;
    let createdTrackingUrl = existingOrder.trackingUrl;

    // STEP 4: Automatic order push to Shiprocket when status moves to "shipped"
    if (isTransitionToShipped) {
      if (existingOrder.awbNumber) {
        console.log(`[Shiprocket] Order #${existingOrder.orderNumber} already has AWB ${existingOrder.awbNumber}. Skipping duplicate shipment creation (Idempotent).`);
      } else {
        try {
          console.log(`[Shiprocket] Pushing Order #${existingOrder.orderNumber} to Shiprocket on status transition to "shipped"...`);
          const shipment = await createShipment({
            id: existingOrder.id,
            orderNumber: existingOrder.orderNumber,
            customerName: existingOrder.customerName,
            phone: existingOrder.phone,
            email: existingOrder.email,
            address: existingOrder.address,
            city: existingOrder.city,
            state: existingOrder.state,
            pincode: existingOrder.pincode,
            subtotal: existingOrder.subtotal,
            discount: existingOrder.discount,
            shipping: existingOrder.shipping,
            codFee: existingOrder.codFee,
            total: existingOrder.total,
            paymentMethod: existingOrder.paymentMethod,
            createdAt: existingOrder.createdAt,
            items: existingOrder.items,
          });

          createdAwb = shipment.awb_number;
          createdTrackingUrl = `https://shiprocket.co/tracking/${shipment.awb_number}`;

          dataToUpdate.awbNumber = shipment.awb_number;
          dataToUpdate.shipmentId = shipment.shipment_id;
          dataToUpdate.courierName = shipment.courier_name;
          dataToUpdate.shipmentStatus = 'shipped';
          dataToUpdate.shipmentError = null;
          dataToUpdate.trackingUrl = createdTrackingUrl;
          dataToUpdate.shippedNotificationSent = true;
          shipmentCreatedSuccessfully = true;
        } catch (shipErr: any) {
          const errMsg = shipErr.message || 'Shiprocket shipment creation failed';
          console.error(`[Shiprocket Failure] Order ID: ${existingOrder.id}, Order Number: ${existingOrder.orderNumber}, Error: ${errMsg}`);
          dataToUpdate.shipmentStatus = 'failed';
          dataToUpdate.shipmentError = errMsg;
          // Keep the status change in database, but DO NOT dispatch notifications until AWB exists
        }
      }
    }

    const updated = await prisma.order.update({
      where: { id: existingOrder.id },
      data: dataToUpdate,
      include: { items: true },
    });

    // Customer notifications dispatch
    // Rule: Never send shipped notification until an AWB exists!
    if (isTransitionToShipped) {
      if (updated.awbNumber && (shipmentCreatedSuccessfully || !existingOrder.shippedNotificationSent)) {
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
            trackingUrl: updated.trackingUrl || `https://shiprocket.co/tracking/${updated.awbNumber}`,
            items: updated.items,
          },
          'shipped'
        ).catch(err => console.error('Error sending shipped notification:', err));
      }
    } else {
      const statusChanged =
        body.status !== undefined &&
        body.status.toLowerCase() !== existingOrder.status.toLowerCase();

      if (statusChanged) {
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
          body.status
        ).catch(err => console.error('Error sending status notification:', err));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
