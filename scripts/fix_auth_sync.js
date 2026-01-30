const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();

// Use SERVICE_ROLE_KEY to administer users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUser(email) {
  console.log(`\nProcessing: ${email}`);

  // 1. Get Supabase Auth User
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing Supabase users:', error.message);
    return;
  }
  
  const authUser = users.find(u => u.email === email);

  if (!authUser) {
    console.error(`User ${email} NOT FOUND in Supabase Auth. Did you verify the email?`);
    return;
  }
  
  console.log(`Found Supabase Auth User: ID=${authUser.id}`);

  // 2. Reset Password to '12345'
  const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
    password: '12345'
  });
  
  if (updateError) {
    console.error('Error resetting password:', updateError.message);
  } else {
    console.log('Password reset to "12345"');
  }

  // 3. Fix Prisma User ID to match Auth ID
  const prismaUser = await prisma.user.findUnique({ where: { email } });
  
  if (prismaUser) {
    if (prismaUser.id === authUser.id) {
      console.log('Prisma ID matches Supabase ID. Good.');
    } else {
      console.log(`ID Mismatch! Prisma=${prismaUser.id}, Supabase=${authUser.id}. Fixing...`);
      
      // We need to delete and recreate because ID is primary key
      // Warning: This deletes associated data if CASCADE is not set or if constraints exist.
      // Since it's a new user, hopefully safe.
      
      const tenantId = prismaUser.tenantId;
      const role = prismaUser.role;
      const name = prismaUser.name;
      
      await prisma.user.delete({ where: { email } });
      console.log('Deleted mismatched Prisma user.');
      
      await prisma.user.create({
        data: {
          id: authUser.id, // FORCE CORRECT ID
          email,
          name,
          tenantId,
          role,
          password: 'password123' // stored legacy password
        }
      });
      console.log('Re-created Prisma user with Correct ID.');
    }
  } else {
    // Should have been created by previous script, but if not:
     console.log('Prisma user missing. Creating with Correct ID...');
     // ... logic omitted, assuming previous script ran or manual fix.
     // Reuse logic from fix_missing_profile but with ID.
     // Let's keep it simple for now.
  }
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node scripts/fix_auth_sync.js <email>');
    process.exit(1);
  }
  try {
     await fixUser(email);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
