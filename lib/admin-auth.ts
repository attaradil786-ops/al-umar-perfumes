import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return null;
  }
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
  });
  return admin;
}
