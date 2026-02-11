const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const targetEmail = 'sebastiangalindo09@gmail.com';

async function main() {
    console.log(`Searching for user with email: ${targetEmail}`);
    
    const user = await prisma.user.findUnique({
        where: { email: targetEmail }
    });

    if (!user) {
        console.error(`Error: User not found with email ${targetEmail}`);
        return;
    }

    console.log(`User found: ${user.name} (Current Role: ${user.role})`);

    const updatedUser = await prisma.user.update({
        where: { email: targetEmail },
        data: { role: 'ADMIN' }
    });

    console.log(`SUCCESS: User role updated to ${updatedUser.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
