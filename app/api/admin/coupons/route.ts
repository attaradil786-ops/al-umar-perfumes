import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({ success: true, count: coupons.length, coupons });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch coupons';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, type, value, minOrder, maxUses, expiresAt, isActive } = await request.json();

    if (!code || value === undefined) {
      return NextResponse.json({ error: 'Coupon code and discount value are required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check unique code
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json({ error: `Coupon code "${cleanCode}" already exists` }, { status: 400 });
    }

    // Normalize type: PERCENTAGE, FLAT, FREE_SHIPPING
    let normalizedType = 'PERCENTAGE';
    const typeUpper = (type || '').toUpperCase();
    if (typeUpper === 'FLAT') {
      normalizedType = 'FLAT';
    } else if (typeUpper === 'FREE_SHIPPING' || typeUpper === 'FREESHIPPING') {
      normalizedType = 'FREE_SHIPPING';
    } else {
      normalizedType = 'PERCENTAGE';
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        type: normalizedType,
        value: Number(value) || 0,
        minOrder: minOrder ? Math.max(0, Number(minOrder)) : 0,
        maxUses: maxUses ? Math.max(1, Number(maxUses)) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
