const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Please provide an email address as an argument.');
    console.error('Usage: node scripts/fix_missing_profile.js <email>');
    process.exit(1);
  }

  console.log(`Attempting to fix profile for: ${email}`);

  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists in Prisma DB:', existingUser);
      return;
    }

    // 2. Find a default tenant
    // We'll try to find one by domain, or just pick the first one.
    const domain = email.split('@')[1];
    let tenant = await prisma.tenant.findUnique({
      where: { domain },
    });

    if (!tenant) {
      console.log(`No specific tenant found for domain ${domain}. Picking first available tenant...`);
      tenant = await prisma.tenant.findFirst();
    }

    if (!tenant) {
      // Create a fallback tenant if absolutely none exist
      console.log('No tenants found. Creating a default tenant...');
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Organization',
          domain: domain || 'default.com',
        },
      });
    }

    console.log(`Using Tenant: ${tenant.name} (${tenant.id})`);

    // 3. Create the User
    const newUser = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0], // Default name
        tenantId: tenant.id,
        role: 'USER',
        password: 'password123', // Default legacy password
      },
    });

    console.log('Successfully created user profile:', newUser);

  } catch (error) {
    console.error('Error fixing profile:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
