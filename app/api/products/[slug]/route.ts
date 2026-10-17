import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Product slug is required' },
        { status: 400 }
      );
    }

    // Try finding by slug, or fallback to id
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isActive: true,
      },
      include: {
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch product details';
    console.error('GET /api/products/[slug] error:', error);
    return NextResponse.json(
      { success: false, error: message, message },
      { status: 500 }
    );
  }
}
