import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status')?.trim() || '';
    const payment = searchParams.get('payment')?.trim() || '';
    const search = searchParams.get('search')?.trim() || '';
    const startDate = searchParams.get('startDate')?.trim() || '';
    const endDate = searchParams.get('endDate')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    // Filter by status (case-flexible)
    if (status && status !== 'all') {
      where.status = {
        in: [status.toLowerCase(), status.toUpperCase(), status],
      };
    }

    // Filter by payment status (case-flexible)
    if (payment && payment !== 'all') {
      where.paymentStatus = {
        in: [payment.toLowerCase(), payment.toUpperCase(), payment],
      };
    }

    // Filter by phone or order # or customer name
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Include up to end of the selected day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [totalCount, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { items: true },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      success: true,
      count: totalCount,
      page,
      limit,
      totalPages,
      orders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
