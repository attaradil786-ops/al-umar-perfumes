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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const isApproved =
      body.action === 'approve'
        ? true
        : body.action === 'reject'
        ? false
        : Boolean(body.isApproved);

    const updated = await prisma.review.update({
      where: { id },
      data: { isApproved },
    });

    await syncProductRating(updated.productId);

    return NextResponse.json({ success: true, review: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update review';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });
    await syncProductRating(review.productId);

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete review';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
