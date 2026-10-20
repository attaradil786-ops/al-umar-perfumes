const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'alumar8080@gmail.com';
  const plainPassword = 'admin8080';
  const sportAnswer = 'football';
  const teacherAnswer = 'masterji';

  const hash = bcrypt.hashSync(plainPassword, 10);
  const sportHash = bcrypt.hashSync(sportAnswer, 10);
  const teacherHash = bcrypt.hashSync(teacherAnswer, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      password: hash,
      securitySport: sportHash,
      securityTeacher: teacherHash,
      totpEnabled: false,
      totpSecret: null,
    },
    create: {
      email,
      password: hash,
      securitySport: sportHash,
      securityTeacher: teacherHash,
      totpEnabled: false,
    },
  });

  console.log('Admin record successfully updated in DB:', admin.email);

  // Verify DB read
  const fresh = await prisma.admin.findUnique({ where: { email } });
  const freshMatch = bcrypt.compareSync(plainPassword, fresh.password);
  console.log('Fresh verification against DB:', freshMatch);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
