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
    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';

    const where: Prisma.ProductWhereInput = {};
    if (category && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      category,
      price,
      mrp,
      stock,
      images,
      isActive,
      isBestSeller,
      isNewArrival,
      taxRate,
      hsnCode,
      unitType,
      variants,
    } = body;

    if (!name || !description || !category || price === undefined) {
      return NextResponse.json({ error: 'Missing required product fields' }, { status: 400 });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await prisma.product.findUnique({
      where: { slug: generatedSlug },
    });
    if (existing) {
      return NextResponse.json({ error: `A product with slug "${generatedSlug}" already exists.` }, { status: 400 });
    }

    let sanitizedVariants: any = Prisma.DbNull;
    if (Array.isArray(variants) && variants.length > 0) {
      const clean = variants
        .filter((v: any) => v && typeof v === 'object' && v.label)
        .map((v: any, i: number) => ({
          id: String(v.id || `var-${i + 1}-${Date.now()}`),
          label: String(v.label).trim(),
          dimensionOrSize: v.dimensionOrSize ? String(v.dimensionOrSize).trim() : undefined,
          unit: v.unit ? String(v.unit).trim() : undefined,
          price: Math.max(1, Math.round(Number(v.price) || 0)),
          mrp: v.mrp ? Math.max(Math.round(Number(v.mrp)), Math.round(Number(v.price) || 0)) : null,
          stock: Math.max(0, Math.round(Number(v.stock) || 0)),
        }));
      if (clean.length > 0) {
        sanitizedVariants = clean;
      }
    }

    // If variants exist and stock wasn't manually set, calculate total stock as sum of variants
    let totalStock = stock !== undefined ? Math.max(0, Math.round(Number(stock))) : 10;
    if (Array.isArray(sanitizedVariants) && sanitizedVariants.length > 0) {
      const variantStockSum = sanitizedVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
      if (stock === undefined || Number(stock) === 0) {
        totalStock = variantStockSum;
      }
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim(),
        category: category.toLowerCase().trim(),
        price: Math.max(1, Math.round(Number(price))),
        mrp: mrp ? Math.max(Math.round(Number(price)), Math.round(Number(mrp))) : Math.round(Number(price) * 1.25),
        stock: totalStock,
        images: Array.isArray(images) && images.length > 0 ? images : ['/images/hero-perfume.jpg'],
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        isBestSeller: Boolean(isBestSeller),
        isNewArrival: Boolean(isNewArrival),
        taxRate: taxRate ? Number(taxRate) : 18,
        hsnCode: hsnCode ? String(hsnCode) : '3303',
        unitType: unitType ? String(unitType).trim() : (category.toLowerCase().includes('quran') || category.toLowerCase().includes('book') ? 'cm' : 'ml'),
        variants: sanitizedVariants,
      },
    });

    return NextResponse.json({ success: true, message: 'Product created successfully', product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
