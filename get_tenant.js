const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const t = await prisma.tenant.findFirst();
    if (t) console.log(t.id);
    else console.log("No tenant found");
}
main().finally(() => prisma.$disconnect());
