import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { generateLabel } from '@/lib/shiprocket';

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
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.shipmentId) {
      return NextResponse.json(
        { error: 'Order has not been assigned a Shiprocket shipment ID yet.' },
        { status: 400 }
      );
    }

    if (order.labelUrl) {
      return NextResponse.json({ success: true, labelUrl: order.labelUrl });
    }

    // Call Shiprocket generate label
    const labelResult = await generateLabel(order.shipmentId);
    if (!labelResult.success || !labelResult.labelUrl) {
      return NextResponse.json(
        { success: false, error: labelResult.error || 'Failed to generate shipping label' },
        { status: 500 }
      );
    }

    // Cache on order
    await prisma.order.update({
      where: { id: order.id },
      data: { labelUrl: labelResult.labelUrl },
    });

    return NextResponse.json({ success: true, labelUrl: labelResult.labelUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
