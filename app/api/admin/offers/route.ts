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

    const offers = await prisma.offer.findMany({
      orderBy: [{ position: 'asc' }, { startsAt: 'desc' }],
    });

    return NextResponse.json({ success: true, count: offers.length, offers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch offers';
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
      title,
      description,
      code,
      bannerImage,
      placement = 'top_bar',
      startsAt,
      endsAt,
      isActive = true,
      position = 0,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required for an offer' },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        code: code ? code.trim().toUpperCase() : null,
        bannerImage: bannerImage ? bannerImage.trim() : null,
        placement: placement || 'top_bar',
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: Boolean(isActive),
        position: Number(position) || 0,
      },
    });

    return NextResponse.json({ success: true, message: 'Offer created successfully', offer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create offer';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
