import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const rawAdminPath = process.env.ADMIN_BASE_PATH || '/admin8080';
  const adminSegment = rawAdminPath.replace(/^\//, '').replace(/\/$/, '');
  const adminPrefix = `/${adminSegment}`;

  // Route /admin and /admin/* directly to the configured admin portal
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL(adminPrefix, req.url));
  }
  if (pathname.startsWith('/admin/')) {
    const sub = pathname.replace(/^\/admin/, '');
    return NextResponse.redirect(new URL(`${adminPrefix}${sub}`, req.url));
  }

  // If path does not start with the admin path, skip admin handling
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

  const isLocalRequest =
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === 'localhost' ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('10.') ||
    clientIp.startsWith('172.') ||
    req.nextUrl.hostname === 'localhost' ||
    req.nextUrl.hostname === '127.0.0.1';

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
      }).catch(() => { });
    } catch {
      // Ignore background logging errors
    }
  };

  // IP allowlist check (if non-empty and not local development)
  const allowedIpsStr = process.env.ADMIN_ALLOWED_IPS?.trim();
  if (allowedIpsStr && !isLocalRequest) {
    const allowedIps = allowedIpsStr.split(',').map(s => s.trim().replace('::ffff:', ''));
    const isAllowed = allowedIps.includes(clientIp) ||
      (clientIp === '::1' && allowedIps.includes('127.0.0.1')) ||
      (clientIp === '127.0.0.1' && allowedIps.includes('::1'));

    if (!isAllowed) {
      sendAuditLog(false);
      return NextResponse.rewrite(new URL('/not-found', req.url), { status: 404 });
    }
  }

  // Login page access: allow unauthenticated requests
  const isLoginPage = pathname === `${adminPrefix}/login` || pathname === `${adminPrefix}/login/`;
  if (isLoginPage) {
    return NextResponse.next();
  }

  // Authenticated session check
  const hasSecureCookie = req.cookies.has('__Secure-next-auth.session-token');
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: hasSecureCookie,
  });

  if (!token || !token.email) {
    sendAuditLog(false);
    const loginUrl = new URL(`${adminPrefix}/login`, req.url);
    if (pathname !== adminPrefix && pathname !== `${adminPrefix}/`) {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  sendAuditLog(true);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
