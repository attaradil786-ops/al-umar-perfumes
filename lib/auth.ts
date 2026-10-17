import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { verifySync } from 'otplib';
import prisma from '@/lib/prisma';
import { decryptSecret } from '@/lib/crypto';
import { Resend } from 'resend';

// In-memory rate limiting map for login failures
// Rule: If 5 failures from same IP in 15 min -> block IP for 30 min
interface IPRateLimit {
  failures: number[];
  blockedUntil?: number;
}
const ipRateLimits = new Map<string, IPRateLimit>();

function isIpBlocked(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimits.get(ip);
  if (!entry) return false;

  if (entry.blockedUntil && now < entry.blockedUntil) {
    return true;
  }

  // Cleanup old failures (> 15 minutes)
  entry.failures = entry.failures.filter(t => now - t < 15 * 60 * 1000);
  if (entry.blockedUntil && now >= entry.blockedUntil) {
    entry.blockedUntil = undefined;
    entry.failures = [];
  }
  return false;
}

function recordIpFailure(ip: string): void {
  const now = Date.now();
  const entry = ipRateLimits.get(ip) || { failures: [] };
  entry.failures = entry.failures.filter(t => now - t < 15 * 60 * 1000);
  entry.failures.push(now);

  if (entry.failures.length >= 5) {
    entry.blockedUntil = now + 30 * 60 * 1000; // Block for 30 min
  }
  ipRateLimits.set(ip, entry);
}

function clearIpFailures(ip: string): void {
  ipRateLimits.delete(ip);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes
    updateAge: 5 * 60, // 5 minutes sliding update
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Admin Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials, req) {
        // Extract IP & User-Agent safely
        const headers = req?.headers as Record<string, string | string[] | undefined> | undefined;
        const rawFwd = headers?.['x-forwarded-for'];
        const fwdIp = Array.isArray(rawFwd) ? rawFwd[0] : rawFwd?.split(',')[0]?.trim();
        const rawReal = headers?.['x-real-ip'];
        const realIp = Array.isArray(rawReal) ? rawReal[0] : rawReal;
        const clientIp = (fwdIp || realIp || '127.0.0.1').replace('::ffff:', '');
        const userAgent = (Array.isArray(headers?.['user-agent']) ? headers['user-agent'][0] : headers?.['user-agent']) || 'Unknown';

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        const totpCode = credentials?.totpCode?.trim();

        // 1. IP Block check
        if (isIpBlocked(clientIp)) {
          await prisma.loginAttempt.create({
            data: {
              email: email || 'unknown',
              ip: clientIp,
              userAgent: `${userAgent} [BLOCKED_IP]`,
              success: false,
            },
          });
          throw new Error('Invalid credentials');
        }

        if (!email || !password) {
          recordIpFailure(clientIp);
          await prisma.loginAttempt.create({
            data: {
              email: email || 'empty',
              ip: clientIp,
              userAgent,
              success: false,
            },
          });
          throw new Error('Invalid credentials');
        }

        // 2. Fetch Admin record
        const admin = await prisma.admin.findUnique({
          where: { email },
        });

        if (!admin) {
          recordIpFailure(clientIp);
          await prisma.loginAttempt.create({
            data: {
              email,
              ip: clientIp,
              userAgent,
              success: false,
            },
          });
          throw new Error('Invalid credentials');
        }

        // 3. Verify password
        const passwordMatches = await bcrypt.compare(password, admin.password);
        if (!passwordMatches) {
          recordIpFailure(clientIp);
          await prisma.loginAttempt.create({
            data: {
              email,
              ip: clientIp,
              userAgent,
              success: false,
            },
          });
          throw new Error('Invalid credentials');
        }

        // 4. Verify 2FA if enabled
        if (admin.totpEnabled) {
          if (!totpCode || !admin.totpSecret) {
            recordIpFailure(clientIp);
            await prisma.loginAttempt.create({
              data: {
                email,
                ip: clientIp,
                userAgent: `${userAgent} [MISSING_TOTP]`,
                success: false,
              },
            });
            throw new Error('Invalid credentials');
          }

          try {
            const decryptedSecret = decryptSecret(admin.totpSecret);
            const verified = verifySync({
              token: totpCode,
              secret: decryptedSecret,
            });

            if (!verified.valid) {
              recordIpFailure(clientIp);
              await prisma.loginAttempt.create({
                data: {
                  email,
                  ip: clientIp,
                  userAgent: `${userAgent} [INVALID_TOTP]`,
                  success: false,
                },
              });
              throw new Error('Invalid credentials');
            }
          } catch {
            recordIpFailure(clientIp);
            await prisma.loginAttempt.create({
              data: {
                email,
                ip: clientIp,
                userAgent: `${userAgent} [TOTP_DECRYPT_FAIL]`,
                success: false,
              },
            });
            throw new Error('Invalid credentials');
          }
        }

        // 5. Successful login
        clearIpFailures(clientIp);

        const previousIp = admin.lastLoginIp;
        const isNewIp = previousIp && previousIp !== clientIp;

        await prisma.admin.update({
          where: { id: admin.id },
          data: {
            lastLoginAt: new Date(),
            lastLoginIp: clientIp,
          },
        });

        await prisma.loginAttempt.create({
          data: {
            email,
            ip: clientIp,
            userAgent,
            success: true,
          },
        });

        // 6. Alert on new IP via Resend (graceful if key is unconfigured)
        if (isNewIp && process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder')) {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: 'security@alumarperfumes.com',
              to: admin.email,
              subject: 'Security Alert: New Admin Login Detected',
              html: `
                <div style="font-family: serif; padding: 20px; background: #FFF8EC; color: #553E23; border: 1px solid #E8DCC8; border-radius: 8px;">
                  <h2 style="color: #1E6B5C;">Al Umar Admin Security Alert</h2>
                  <p>A new login was recorded for your admin account (<strong>${admin.email}</strong>).</p>
                  <ul>
                    <li><strong>New IP:</strong> ${clientIp}</li>
                    <li><strong>Previous IP:</strong> ${previousIp}</li>
                    <li><strong>Time:</strong> ${new Date().toISOString()}</li>
                    <li><strong>User-Agent:</strong> ${userAgent}</li>
                  </ul>
                  <p>If this was not you, please immediately update your credentials and revoke all sessions.</p>
                </div>
              `,
            });
          } catch (emailErr) {
            console.error('Failed to dispatch new-IP security alert email:', emailErr);
          }
        }

        return {
          id: admin.id,
          email: admin.email,
          totpEnabled: admin.totpEnabled,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.totpEnabled = (user as unknown as { totpEnabled?: boolean }).totpEnabled ?? false;
      }
      if (trigger === 'update' && session?.totpEnabled !== undefined) {
        token.totpEnabled = session.totpEnabled;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.totpEnabled = (token.totpEnabled as boolean) ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: `${process.env.ADMIN_BASE_PATH || '/studio-alumar-9f7x2k'}/login`,
    error: `${process.env.ADMIN_BASE_PATH || '/studio-alumar-9f7x2k'}/login`,
  },
};
