import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const nonCancelledStatus = {
      notIn: ['CANCELLED', 'cancelled', 'FAILED', 'failed'],
    };

    const [
      revenueTodayAgg,
      revenue7dAgg,
      revenue30dAgg,
      revenueAllTimeAgg,
      totalOrdersCount,
      pendingOrdersCount,
      inTransitOrdersCount,
      deliveredThisMonthCount,
      lowStockProducts,
      recentOrders,
      ordersLast30Days,
      recentOrderItems,
    ] = await Promise.all([
      // Revenue today
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: startOfToday },
          status: nonCancelledStatus,
        },
      }),
      // Revenue 7d
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: nonCancelledStatus,
        },
      }),
      // Revenue 30d
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: nonCancelledStatus,
        },
      }),
      // Revenue all-time
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: nonCancelledStatus,
        },
      }),
      // Total orders
      prisma.order.count(),
      // Pending orders
      prisma.order.count({
        where: {
          status: {
            in: [
              'PENDING', 'pending',
              'PLACED', 'placed',
              'CONFIRMED', 'confirmed',
              'PACKED', 'packed',
              'PROCESSING', 'processing',
            ],
          },
        },
      }),
      // In transit orders (Shipped)
      prisma.order.count({
        where: {
          status: { in: ['SHIPPED', 'shipped'] },
        },
      }),
      // Delivered this month
      prisma.order.count({
        where: {
          status: { in: ['DELIVERED', 'delivered'] },
          createdAt: { gte: startOfMonth },
        },
      }),
      // Low stock list (stock < 10)
      prisma.product.findMany({
        where: { stock: { lt: 10 } },
        select: {
          id: true,
          name: true,
          stock: true,
          category: true,
          price: true,
          images: true,
        },
        orderBy: { stock: 'asc' },
        take: 15,
      }),
      // Recent 10 orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      // Orders last 30 days for daily revenue chart
      prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: nonCancelledStatus,
        },
        select: {
          createdAt: true,
          total: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      // OrderItems in last 30 days for Top 5 products
      prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: thirtyDaysAgo },
            status: nonCancelledStatus,
          },
        },
        select: {
          productId: true,
          name: true,
          price: true,
          quantity: true,
        },
      }),
    ]);

    // Aggregate Top 5 products by units sold (30d)
    const productSalesMap = new Map<
      string,
      { productId: string; name: string; unitsSold: number; totalRevenue: number }
    >();

    for (const item of recentOrderItems) {
      const key = item.productId || item.name;
      const current = productSalesMap.get(key) || {
        productId: item.productId,
        name: item.name,
        unitsSold: 0,
        totalRevenue: 0,
      };
      current.unitsSold += item.quantity;
      current.totalRevenue += item.price * item.quantity;
      productSalesMap.set(key, current);
    }

    const top5Products = Array.from(productSalesMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    // Build 30-day daily revenue map for recharts
    const dayMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dayMap.set(key, { revenue: 0, orders: 0 });
    }

    for (const o of ordersLast30Days) {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (dayMap.has(key)) {
        const entry = dayMap.get(key)!;
        entry.revenue += o.total;
        entry.orders += 1;
      }
    }

    const dailyRevenue = Array.from(dayMap.entries()).map(([dateStr, val]) => {
      const d = new Date(dateStr);
      const displayDate = d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
      return {
        date: dateStr,
        displayDate,
        revenue: val.revenue,
        orders: val.orders,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        revenue: {
          today: revenueTodayAgg._sum.total || 0,
          sevenDays: revenue7dAgg._sum.total || 0,
          thirtyDays: revenue30dAgg._sum.total || 0,
          allTime: revenueAllTimeAgg._sum.total || 0,
        },
        orders: {
          total: totalOrdersCount,
          pending: pendingOrdersCount,
          inTransit: inTransitOrdersCount,
          deliveredThisMonth: deliveredThisMonthCount,
        },
        lowStockProducts,
        lowStockCount: lowStockProducts.length,
        topProducts: top5Products,
        recentOrders,
        dailyRevenue,
      },
    });
  } catch (error: unknown) {
    console.error('Admin Stats API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch admin stats';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
