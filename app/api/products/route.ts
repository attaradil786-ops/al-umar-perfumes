import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ProductQuerySchema } from '@/lib/validators';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = ProductQuerySchema.safeParse({
      category: searchParams.get('category') || undefined,
      sort: searchParams.get('sort') || undefined,
      q: searchParams.get('q') || undefined,
      limit: searchParams.get('limit') || undefined,
      page: searchParams.get('page') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { category, sort, q, limit, page } = parsed.data;

    // Build filter
    const whereClause: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (category && category !== 'all') {
      whereClause.category = {
        equals: category,
        mode: 'insensitive',
      };
    }

    if (q && q.trim()) {
      whereClause.OR = [
        { name: { contains: q.trim(), mode: 'insensitive' } },
        { description: { contains: q.trim(), mode: 'insensitive' } },
      ];
    }

    // Build order
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price-low') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      count: products.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { success: false, error: message, message },
      { status: 500 }
    );
  }
}
