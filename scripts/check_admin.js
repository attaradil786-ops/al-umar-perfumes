const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const admins = await p.admin.findMany({
    select: {
      id: true,
      email: true,
      totpEnabled: true,
      lastLoginAt: true,
    }
  });
  console.log('Admins in DB:', JSON.stringify(admins, null, 2));
}
main().catch(console.error).finally(() => p.$disconnect());
