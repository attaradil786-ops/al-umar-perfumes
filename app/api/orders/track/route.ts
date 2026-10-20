import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { trackOrder } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || body.orderNumber || body.awb || '').trim();
    const phone = (body.phone || '').trim();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Please enter your Order Number or AWB Tracking Number.' },
        { status: 400 }
      );
    }

    // Search by Order Number, ID, or AWB Number
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: { equals: query, mode: 'insensitive' } },
          { awbNumber: { equals: query, mode: 'insensitive' } },
          { id: { equals: query } },
        ],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'No order found matching the provided reference number.' },
        { status: 404 }
      );
    }

    // If phone number is supplied, verify it matches
    if (phone) {
      const cleanPhoneDigits = phone.replace(/\D/g, '');
      const orderPhoneDigits = (order.phone || '').replace(/\D/g, '');
      if (cleanPhoneDigits.length >= 10 && orderPhoneDigits.length >= 10) {
        const matches = cleanPhoneDigits.slice(-10) === orderPhoneDigits.slice(-10);
        if (!matches) {
          return NextResponse.json(
            { success: false, error: 'Phone number does not match the records for this order.' },
            { status: 400 }
          );
        }
      }
    }

    // Normalized status
    const normalizedStatus = (order.status || 'placed').toLowerCase();

    // Fetch live Shiprocket events if AWB exists
    let liveTrackingEvents: Array<{ date: string; status: string; activity: string; location: string }> = [];
    let liveStatusText = order.shipmentStatus || order.status;

    if (order.awbNumber) {
      try {
        const tracking = await trackOrder(order.awbNumber);
        if (tracking.success && tracking.events.length > 0) {
          liveTrackingEvents = tracking.events;
          liveStatusText = tracking.currentStatus || liveStatusText;
        }
      } catch (trackErr) {
        console.warn(`[Tracking Lookup Warning for AWB ${order.awbNumber}]:`, trackErr);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        normalizedStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        trackingUrl: order.trackingUrl || (order.awbNumber ? `https://shiprocket.co/tracking/${order.awbNumber}` : null),
        awbNumber: order.awbNumber,
        courierName: order.courierName || 'Blue Dart Express',
        shipmentStatus: order.shipmentStatus,
        liveStatusText,
        createdAt: order.createdAt,
        total: order.total,
        shipping: order.shipping,
        codFee: order.codFee,
        itemsCount: order.items.length,
        items: order.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          size: i.size,
          price: i.price,
        })),
        address: `${order.address}, ${order.city}, ${order.state} - ${order.pincode}`,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
        liveEvents: liveTrackingEvents,
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
