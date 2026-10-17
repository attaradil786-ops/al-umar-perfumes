import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/lib/pdf/invoice';

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

    // Fetch products to retrieve specific tax rates and HSN codes (fallback to 18 and "3303")
    const productIds = order.items.map(i => i.productId).filter(Boolean);
    const [products, gstinRecord] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, taxRate: true, hsnCode: true },
      }),
      prisma.siteContent.findUnique({
        where: { key: 'gstin' },
      }),
    ]);

    const taxRateMap = new Map<string, number>(
      products.map(p => [p.id, p.taxRate ?? 18])
    );
    const hsnMap = new Map<string, string>(
      products.map(p => [p.id, p.hsnCode || '3303'])
    );

    const itemsWithTax = order.items.map(item => ({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      taxRate: taxRateMap.get(item.productId) ?? 18,
      hsnCode: hsnMap.get(item.productId) || '3303',
    }));

    const sellerGstin = gstinRecord?.value || '27ABCDE1234F1Z5';

    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDF, {
        order: {
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          customerName: order.customerName,
          phone: order.phone,
          email: order.email,
          address: order.address,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          items: itemsWithTax,
          subtotal: order.subtotal,
          discount: order.discount,
          shipping: order.shipping,
          total: order.total,
          paymentStatus: order.paymentStatus,
          paymentId: order.paymentId,
          sellerGstin,
        },
      }) as any
    );

    const buffer = Buffer.from(pdfBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice-${order.orderNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Invoice PDF Generation Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate invoice';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
