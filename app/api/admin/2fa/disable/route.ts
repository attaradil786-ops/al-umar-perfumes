import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import bcrypt from 'bcryptjs';
import { verifySync } from 'otplib';
import { decryptSecret } from '@/lib/crypto';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password, token } = await request.json();
    if (!password || !token) {
      return NextResponse.json({ error: 'Current password and 2FA code are required to disable 2FA' }, { status: 400 });
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(password, admin.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
    }

    // Verify current 2FA code
    if (!admin.totpSecret) {
      return NextResponse.json({ error: '2FA is not currently enabled' }, { status: 400 });
    }

    const decryptedSecret = decryptSecret(admin.totpSecret);
    const verification = verifySync({
      token: token.trim(),
      secret: decryptedSecret,
    });

    if (!verification.valid) {
      return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 400 });
    }

    // Disable 2FA
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        totpSecret: null,
        totpEnabled: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: '2FA has been disabled successfully.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to disable 2FA';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
