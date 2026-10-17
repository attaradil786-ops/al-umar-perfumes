import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'connected' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database connection error';
    console.error('Health check database error:', error);
    return NextResponse.json(
      { status: 'error', db: 'disconnected', error: message },
      { status: 500 }
    );
  }
}
