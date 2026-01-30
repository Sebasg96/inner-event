const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM documents LIMIT 1`;
    console.log("documents table exists");
  } catch (e) {
    console.log("documents table NOT found");
  }
  
  try {
    await prisma.$queryRaw`SELECT 1 FROM "Document" LIMIT 1`;
    console.log("Document table exists");
  } catch (e) {
    console.log("Document table NOT found");
  }

  try {
    await prisma.$queryRaw`SELECT 1 FROM \"Document\" LIMIT 1`;
     console.log("Document (quoted) exists");
  } catch (e) {
     // console.log(e);
  }
}

main().finally(() => prisma.$disconnect());
