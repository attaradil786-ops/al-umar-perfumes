import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();

    const activeOffers = await prisma.offer.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [
          { endsAt: null },
          { endsAt: { gte: now } },
        ],
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({
      success: true,
      offers: activeOffers,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch active offers:', error);
    return NextResponse.json({ success: false, offers: [] }, { status: 500 });
  }
}
