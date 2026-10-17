import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const secretKey = request.headers.get('x-internal-key');
    if (secretKey !== (process.env.NEXTAUTH_SECRET || 'internal')) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    const { path, ip, userAgent, success } = await request.json();
    await prisma.loginAttempt.create({
      data: {
        email: `ROUTE_ACCESS:${path}`,
        ip: (ip || 'unknown').slice(0, 45),
        userAgent: (userAgent || 'unknown').slice(0, 255),
        success: Boolean(success),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
