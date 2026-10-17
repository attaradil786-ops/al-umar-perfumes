import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function syncProductRating(productId: string) {
  const approvedReviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    select: { rating: true },
  });

  const count = approvedReviews.length;
  const avgRating =
    count > 0
      ? Number((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
      : 5.0;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: avgRating,
      reviewsCount: count,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending' | 'approved' | null

    const whereClause: { isApproved?: boolean } = {};
    if (status === 'pending') {
      whereClause.isApproved = false;
    } else if (status === 'approved') {
      whereClause.isApproved = true;
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });

    const pendingCount = await prisma.review.count({ where: { isApproved: false } });
    const approvedCount = await prisma.review.count({ where: { isApproved: true } });

    return NextResponse.json({
      success: true,
      reviews,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        total: pendingCount + approvedCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reviews';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const id = body.id;
    const isApproved =
      body.action === 'approve'
        ? true
        : body.action === 'reject'
        ? false
        : Boolean(body.isApproved);

    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { isApproved },
    });

    // Recompute product rating & count
    await syncProductRating(updated.productId);

    return NextResponse.json({ success: true, review: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update review status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    // Recompute product rating & count
    await syncProductRating(review.productId);

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete review';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
