import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = generateSecret();
    const uri = generateURI({
      secret,
      label: admin.email,
      issuer: 'Al Umar Perfumes',
    });

    const qrCodeUrl = await QRCode.toDataURL(uri);

    return NextResponse.json({
      success: true,
      secret,
      qrCodeUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate 2FA secret';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
