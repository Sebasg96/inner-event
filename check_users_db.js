const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Checking Prisma Users ---");
    const users = await prisma.user.findMany({
        include: { tenant: true }
    });
    
    users.forEach(u => {
        console.log(`User: ${u.email} | Name: ${u.name} | Tenant: ${u.tenant?.name || 'NONE'}`);
    });

    console.log("\n--- Connection Check ---");
    try {
        await prisma.$connect();
        console.log("Prisma connected successfully.");
    } catch (e) {
        console.error("Prisma connection failed:", e);
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
