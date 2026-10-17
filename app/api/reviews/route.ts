import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CreateReviewSchema } from '@/lib/validators';

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>?/gm, '').trim();
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
  }

  try {
    const parsed = CreateReviewSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid review data';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { productId, name, rating, comment } = parsed.data;

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product not found or unavailable for review.' },
        { status: 404 }
      );
    }

    // Sanitize inputs to prevent stored XSS injection
    const cleanName = stripHtml(name);
    const cleanComment = stripHtml(comment);

    if (cleanName.length < 2 || cleanComment.length < 5) {
      return NextResponse.json(
        { success: false, error: 'Valid review text is required.' },
        { status: 400 }
      );
    }

    // Rate limiting: prevent duplicate review spam for the same product recently
    const recentDuplicate = await prisma.review.findFirst({
      where: {
        productId,
        name: cleanName,
        comment: cleanComment,
      },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        { success: false, error: 'A review with identical content has already been submitted.' },
        { status: 429 }
      );
    }

    // Create review with isApproved: false (requires admin moderation before public display)
    const review = await prisma.review.create({
      data: {
        productId,
        name: cleanName,
        rating,
        comment: cleanComment,
        isApproved: false,
      },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        productId: review.productId,
        rating: review.rating,
      },
      message: 'Review submitted successfully and is pending admin moderation.',
    });
  } catch (error) {
    console.error('Review submit error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 });
  }
}
