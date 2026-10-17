import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { PackingSlipPDF } from '@/lib/pdf/packing-slip';

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
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const pdfBuffer = await renderToBuffer(
      React.createElement(PackingSlipPDF, {
        order: {
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          customerName: order.customerName,
          phone: order.phone,
          address: order.address,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          awbNumber: order.awbNumber,
          trackingUrl: order.trackingUrl,
          items: order.items.map(i => ({
            name: i.name,
            size: i.size,
            quantity: i.quantity,
          })),
          shipping: order.shipping,
        },
      }) as any
    );

    const buffer = Buffer.from(pdfBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="PackingSlip-${order.orderNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Packing Slip Generation Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate packing slip';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
