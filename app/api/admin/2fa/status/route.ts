import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      email: admin.email,
      totpEnabled: admin.totpEnabled,
      lastLoginAt: admin.lastLoginAt,
      lastLoginIp: admin.lastLoginIp,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch 2FA status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
