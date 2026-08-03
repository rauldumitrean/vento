const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.user.count();
    console.log('Users:', count);
  } catch (error) {
    console.error('DB Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();