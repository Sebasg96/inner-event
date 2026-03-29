const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('No tenant found');
      return;
    }
    const goal = await prisma.strategicGoal.create({
      data: {
        statement: 'Test Goal ' + Date.now(),
        targetValue: 100,
        currentValue: 10,
        tenantId: tenant.id
      }
    });
    console.log('Goal created:', goal);
    const all = await prisma.strategicGoal.findMany({ where: { tenantId: tenant.id } });
    console.log('All goals count:', all.length);
  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
