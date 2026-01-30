const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("Connection OK:", res);
    
    const docs = await prisma.$queryRaw`SELECT id, content FROM "documents" LIMIT 2`;
    console.log("Docs:", docs);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
