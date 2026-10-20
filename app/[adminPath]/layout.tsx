import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminLayoutClient from './AdminLayoutClient';

export const metadata = {
  title: 'Al Umar Admin Portal',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { adminPath: string };
}) {
  const rawAdminPath = process.env.ADMIN_BASE_PATH || '/admin8080';
  const expectedAdminSegment = rawAdminPath.replace(/^\//, '').replace(/\/$/, '');

  // Strict route check: any segment that does not exactly equal ADMIN_BASE_PATH triggers 404
  if (params.adminPath !== expectedAdminSegment) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  let adminEmail = session?.user?.email || 'alumar8080@gmail.com';
  let totpEnabled = false;

  if (session?.user?.email) {
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
      select: { totpEnabled: true, email: true },
    });
    if (admin) {
      totpEnabled = admin.totpEnabled;
      adminEmail = admin.email;
    }
  }

  return (
    <AdminLayoutClient
      adminPath={params.adminPath}
      adminEmail={adminEmail}
      totpEnabled={totpEnabled}
    >
      {children}
    </AdminLayoutClient>
  );
}
