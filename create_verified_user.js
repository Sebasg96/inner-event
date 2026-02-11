const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// IMPORTANTE: Necesitas la SERVICE_ROLE_KEY para realizar acciones administrativas
// Esta key NO debe ir en el frontend, solo en scripts backend seguros.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!serviceRoleKey) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing in your .env file.");
  console.error("Please add it to run administrative tasks.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const prisma = new PrismaClient();

async function createVerifiedUser() {
  const email = 'admin@mi-empresa.com'; // Cambia esto
  const password = 'password123';       // Cambia esto
  const name = 'Admin User';
  
  // 1. Obtener Tenant ID
  // Puedes hardcodearlo o buscarlo por dominio
  const domain = email.split('@')[1];
  let tenant = await prisma.tenant.findUnique({ where: { domain } });

  if (!tenant) {
    console.log(`Tenant for ${domain} not found. Creating one...`);
    tenant = await prisma.tenant.create({
      data: {
        name: 'My Company',
        domain: domain
      }
    });
  }

  console.log(`Creating user in Tenant: ${tenant.id}`);

  // 2. Crear usuario usando Admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirmar email
    user_metadata: {
      full_name: name,
      tenant_id: tenant.id
    }
  });

  if (error) {
    console.error("Error creating user in Supabase:", error.message);
    return;
  }

  console.log("✅ User created successfully in Supabase Auth:", data.user.id);
  console.log("   Email confirmed automatically.");
  console.log("   Metadata set correctly.");

  // 3. Verificar si el trigger creó el usuario en Prisma
  // Damos un pequeño delay para que el trigger se ejecute
  setTimeout(async () => {
    const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });
    if (dbUser) {
      console.log("✅ User found in public.User table (Sync succesful).");
    } else {
      console.error("⚠️ User NOT found in public.User table. Check your database triggers.");
    }
    await prisma.$disconnect();
  }, 2000);
}

createVerifiedUser();
