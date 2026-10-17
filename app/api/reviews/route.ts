import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { productId, name, rating, comment } = await req.json();

    if (!productId || !name || !rating || !comment) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const numericRating = Math.min(5, Math.max(1, Number(rating)));

    // STEP 5: Create review with isApproved: false (pending moderation)
    const review = await prisma.review.create({
      data: {
        productId,
        name: name.trim(),
        rating: numericRating,
        comment: comment.trim(),
        isApproved: false,
      },
    });

    return NextResponse.json({
      success: true,
      review,
      message: 'Review submitted successfully and is pending admin moderation.',
    });
  } catch (error) {
    console.error('Review submit error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
