import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { triggerOrderStatusNotifications } from '@/lib/notifications';

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

    const dataToUpdate: Prisma.OrderUpdateInput = {};
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.paymentStatus !== undefined) dataToUpdate.paymentStatus = body.paymentStatus;
    if (body.awbNumber !== undefined) dataToUpdate.awbNumber = body.awbNumber;
    if (body.trackingUrl !== undefined) dataToUpdate.trackingUrl = body.trackingUrl;
    if (body.shipmentId !== undefined) dataToUpdate.shipmentId = body.shipmentId;

    const updated = await prisma.order.update({
      where: { id: existingOrder.id },
      data: dataToUpdate,
      include: { items: true },
    });

    // Check if status changed or if order is shipped
    const statusChanged =
      body.status !== undefined &&
      body.status.toLowerCase() !== existingOrder.status.toLowerCase();

    if (statusChanged || (body.status && body.status.toLowerCase() === 'shipped' && body.awbNumber)) {
      // Trigger notifications asynchronously
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
      ).catch(err => {
        console.error('Failed to trigger background order status notifications:', err);
      });
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
