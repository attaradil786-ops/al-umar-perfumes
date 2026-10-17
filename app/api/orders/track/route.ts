import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, phone } = body;

    if (!orderNumber || !orderNumber.trim()) {
      return NextResponse.json(
        { success: false, error: 'Order number is required.' },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required.' },
        { status: 400 }
      );
    }

    const cleanOrderNumber = orderNumber.trim();
    const cleanPhoneDigits = phone.replace(/\D/g, '');

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: {
          equals: cleanOrderNumber,
          mode: 'insensitive',
        },
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'No order found with the provided Order Number.' },
        { status: 404 }
      );
    }

    // Verify phone matches
    const orderPhoneDigits = (order.phone || '').replace(/\D/g, '');

    if (cleanPhoneDigits.length < 10 || orderPhoneDigits.length < 10) {
      return NextResponse.json(
        { success: false, error: 'A valid 10-digit phone number is required to track this order.' },
        { status: 400 }
      );
    }

    const phoneMatches = cleanPhoneDigits.slice(-10) === orderPhoneDigits.slice(-10);

    if (!phoneMatches) {
      return NextResponse.json(
        { success: false, error: 'Phone number does not match the records for this order.' },
        { status: 400 }
      );
    }

    // Status timeline mapping: Placed -> Confirmed -> Packed -> Shipped -> Delivered
    const normalizedStatus = (order.status || 'placed').toLowerCase();

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        normalizedStatus,
        paymentStatus: order.paymentStatus,
        trackingUrl: order.trackingUrl,
        awbNumber: order.awbNumber,
        shipmentId: order.shipmentId,
        createdAt: order.createdAt,
        total: order.total,
        itemsCount: order.items.length,
        items: order.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          size: i.size,
          price: i.price,
        })),
        address: `${order.city}, ${order.state}`,
      },
    });
  } catch (error) {
    console.error('POST /api/orders/track error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to look up order tracking information.' },
      { status: 500 }
    );
  }
}
