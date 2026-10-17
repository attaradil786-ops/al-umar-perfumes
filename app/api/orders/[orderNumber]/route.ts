import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const orderNumber = params.orderNumber;
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Order number is required' },
        { status: 400 }
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
        { success: false, error: `Order "${orderNumber}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve order tracking details';
    console.error('GET /api/orders/[orderNumber] error:', error);
    return NextResponse.json(
      { success: false, error: message, message },
      { status: 500 }
    );
  }
}
