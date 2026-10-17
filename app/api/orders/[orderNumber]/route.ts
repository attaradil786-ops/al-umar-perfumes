import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const orderNumber = params.orderNumber;
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Order number is required.' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const admin = await getAdminSession();

    // IDOR Protection: Require either admin session or phone verification
    if (!admin && !phone) {
      return NextResponse.json(
        { success: false, error: 'Phone verification is required to view order details.' },
        { status: 401 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    // Verify phone if customer lookup
    if (!admin) {
      const cleanInputDigits = (phone || '').replace(/\D/g, '');
      const orderPhoneDigits = order.phone.replace(/\D/g, '');
      const phoneMatches =
        orderPhoneDigits === cleanInputDigits ||
        orderPhoneDigits.endsWith(cleanInputDigits) ||
        cleanInputDigits.endsWith(orderPhoneDigits);

      if (!phoneMatches) {
        return NextResponse.json(
          { success: false, error: 'Order not found or authorization failed.' },
          { status: 404 }
        );
      }

      // Return sanitized order data for customers (mask address)
      return NextResponse.json({
        success: true,
        order: {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          status: order.status,
          paymentStatus: order.paymentStatus,
          trackingUrl: order.trackingUrl,
          awbNumber: order.awbNumber,
          createdAt: order.createdAt,
          total: order.total,
          city: order.city,
          state: order.state,
          items: order.items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            size: i.size,
            price: i.price,
          })),
        },
      });
    }

    // Full order for authenticated admin
    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: unknown) {
    console.error('GET /api/orders/[orderNumber] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve order details.' },
      { status: 500 }
    );
  }
}
