import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { verifySync } from 'otplib';
import { encryptSecret } from '@/lib/crypto';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { secret, token } = await request.json();
    if (!secret || !token) {
      return NextResponse.json({ error: 'Secret and token code are required' }, { status: 400 });
    }

    const verification = verifySync({
      token: token.trim(),
      secret: secret.trim(),
    });

    if (!verification.valid) {
      return NextResponse.json({ error: 'Invalid verification code. Please check your authenticator app.' }, { status: 400 });
    }

    // Encrypt secret with TOTP_ENCRYPTION_KEY and persist
    const encryptedSecret = encryptSecret(secret.trim());

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        totpSecret: encryptedSecret,
        totpEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication (2FA) successfully enabled!',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to verify 2FA token';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
