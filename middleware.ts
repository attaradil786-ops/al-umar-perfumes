import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const rawAdminPath = process.env.ADMIN_BASE_PATH || '/studio-alumar-9f7x2k';
  const adminSegment = rawAdminPath.replace(/^\//, '').replace(/\/$/, '');
  const adminPrefix = `/${adminSegment}`;

  // Block and return 404 for any generic admin discovery probes (/admin, /admin/login, /admin/products)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.rewrite(new URL('/not-found', req.url), { status: 404 });
  }

  // If path does not start with the secret admin path, skip admin handling
  if (!pathname.startsWith(adminPrefix)) {
    return NextResponse.next();
  }

  // Extract client IP and user agent
  const fwdHeader = req.headers.get('x-forwarded-for');
  const fwdIp = fwdHeader ? fwdHeader.split(',')[0].trim() : null;
  const realIp = req.headers.get('x-real-ip');
  const rawIp = fwdIp || realIp || req.ip || '127.0.0.1';
  const clientIp = rawIp.replace('::ffff:', '');
  const userAgent = req.headers.get('user-agent') || 'Unknown';

  const sendAuditLog = (success: boolean) => {
    try {
      fetch(`${req.nextUrl.origin}/api/admin/log-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': process.env.NEXTAUTH_SECRET || 'internal',
        },
        body: JSON.stringify({
          path: pathname,
          ip: clientIp,
          userAgent,
          success,
        }),
      }).catch(() => {});
    } catch {
      // Ignore background logging errors
    }
  };

  // STEP 3: IP allowlist check (if non-empty)
  const allowedIpsStr = process.env.ADMIN_ALLOWED_IPS?.trim();
  if (allowedIpsStr) {
    const allowedIps = allowedIpsStr.split(',').map(s => s.trim().replace('::ffff:', ''));
    const isAllowed = allowedIps.includes(clientIp) || 
      (clientIp === '::1' && allowedIps.includes('127.0.0.1')) ||
      (clientIp === '127.0.0.1' && allowedIps.includes('::1'));

    if (!isAllowed) {
      sendAuditLog(false);
      return NextResponse.rewrite(new URL('/not-found', req.url), { status: 404 });
    }
  }

  // STEP 2: Login page access
  const isLoginPage = pathname === `${adminPrefix}/login` || pathname === `${adminPrefix}/login/`;
  if (isLoginPage) {
    return NextResponse.next();
  }

  // STEP 2: Authenticated session check
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: req.cookies.has('__Secure-next-auth.session-token'),
  });

  if (!token || !token.email) {
    // Unauthenticated requests MUST return 404, NEVER redirect or 401
    sendAuditLog(false);
    return NextResponse.rewrite(new URL('/not-found', req.url), { status: 404 });
  }

  sendAuditLog(true);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
