const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = [
    'Tenant',
    'User',
    'OrganizationalValue',
    'Purpose',
    'Mega',
    'Objective',
    'KeyResult',
    'Initiative'
  ];

  for (const table of tables) {
    try {
      // Use double quotes for table names in case they are case-sensitive or reserved
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      console.log(`Table "${table}" exists.`);
    } catch (e) {
      console.log(`Table "${table}" NOT found. Error: ${e.message}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
