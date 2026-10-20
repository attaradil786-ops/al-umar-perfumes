import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Rate limiting for reset password attempts
const failureMap = new Map<string, { count: number; blockedUntil?: number }>();

function isRateLimited(ip: string): boolean {
  const record = failureMap.get(ip);
  if (!record) return false;
  const now = Date.now();
  if (record.blockedUntil && now < record.blockedUntil) return true;
  if (record.blockedUntil && now >= record.blockedUntil) {
    failureMap.delete(ip);
    return false;
  }
  return false;
}

function recordFailure(ip: string): void {
  const record = failureMap.get(ip) || { count: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.blockedUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
  }
  failureMap.set(ip, record);
}

function clearFailure(ip: string): void {
  failureMap.delete(ip);
}

export async function POST(req: NextRequest) {
  try {
    const rawFwd = req.headers.get('x-forwarded-for');
    const fwdIp = rawFwd ? rawFwd.split(',')[0].trim() : null;
    const realIp = req.headers.get('x-real-ip');
    const clientIp = (fwdIp || realIp || '127.0.0.1').replace('::ffff:', '');

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, sportAnswer, teacherAnswer, newPassword, confirmPassword } = body;

    if (!email || !sportAnswer || !teacherAnswer || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin) {
      recordFailure(clientIp);
      return NextResponse.json(
        { success: false, error: 'Invalid email or security answers.' },
        { status: 400 }
      );
    }

    if (!admin.securitySport || !admin.securityTeacher) {
      return NextResponse.json(
        { success: false, error: 'Security questions have not been initialized for this administrator.' },
        { status: 400 }
      );
    }

    // Verify Sport Answer (case-insensitive & trimmed)
    const normSport = sportAnswer.trim().toLowerCase();
    let sportMatches = false;
    if (admin.securitySport.startsWith('$2b$') || admin.securitySport.startsWith('$2a$')) {
      sportMatches = await bcrypt.compare(normSport, admin.securitySport);
    } else {
      sportMatches = normSport === admin.securitySport.trim().toLowerCase();
    }

    // Verify Teacher Answer (case-insensitive & trimmed)
    const normTeacher = teacherAnswer.trim().toLowerCase();
    let teacherMatches = false;
    if (admin.securityTeacher.startsWith('$2b$') || admin.securityTeacher.startsWith('$2a$')) {
      teacherMatches = await bcrypt.compare(normTeacher, admin.securityTeacher);
    } else {
      teacherMatches = normTeacher === admin.securityTeacher.trim().toLowerCase();
    }

    if (!sportMatches || !teacherMatches) {
      recordFailure(clientIp);
      return NextResponse.json(
        { success: false, error: 'Security answers do not match our records.' },
        { status: 400 }
      );
    }

    // Answers match! Update password
    clearFailure(clientIp);
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: newPasswordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password successfully reset! You can now log in with your new password.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
