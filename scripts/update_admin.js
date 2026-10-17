const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const plainPassword = 'Admin@AlUmar2026!';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(plainPassword, salt);

  console.log('Generated hash:', hash);
  console.log('Self-verify:', bcrypt.compareSync(plainPassword, hash));

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@alumarperfumes.com' },
    update: {
      password: hash,
      totpEnabled: false,
      totpSecret: null,
    },
    create: {
      email: 'admin@alumarperfumes.com',
      password: hash,
      totpEnabled: false,
    },
  });

  console.log('Admin record successfully updated in DB:', admin.email);

  // Verify DB read
  const fresh = await prisma.admin.findUnique({ where: { email: 'admin@alumarperfumes.com' } });
  const freshMatch = bcrypt.compareSync(plainPassword, fresh.password);
  console.log('Fresh verification against DB:', freshMatch);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
