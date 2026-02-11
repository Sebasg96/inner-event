const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Creating database function and trigger for user sync...");

  try {
    // 1. Create the Function
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public."User" ("id", "email", "name", "tenantId", "role", "createdAt", "updatedAt")
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'full_name', new.email),
          (new.raw_user_meta_data->>'tenant_id')::text,
          'USER',
          NOW(),
          NOW()
        )
        ON CONFLICT ("id") DO NOTHING;
        RETURN new;
      END;
      $$;
    `);
    console.log("Function 'public.handle_new_user' created successfully.");

    // 2. Create the Trigger
    // Drop first to allow updates
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);
    console.log("Trigger 'on_auth_user_created' created/updated successfully.");

  } catch (error) {
    console.error("Error creating trigger:", error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
