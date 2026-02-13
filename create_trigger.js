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
      DECLARE
        default_tenant_id text;
      BEGIN
        -- Intentar obtener tenant_id de los metadatos
        default_tenant_id := (new.raw_user_meta_data->>'tenant_id')::text;

        -- Si no hay metadatos, buscar el primer tenant disponible (Fallback para creación manual)
        IF default_tenant_id IS NULL THEN
          SELECT "id" INTO default_tenant_id FROM public."Tenant" LIMIT 1;
        END IF;

        -- Si aún es null (no existe ningun tenant), crear uno por defecto (Opcional, pero seguro)
        IF default_tenant_id IS NULL THEN
           INSERT INTO public."Tenant" ("id", "name", "domain", "updatedAt") 
           VALUES (gen_random_uuid(), 'Default Organization', 'default.com', NOW())
           RETURNING "id" INTO default_tenant_id;
        END IF;

        INSERT INTO public."User" ("id", "email", "name", "tenantId", "role", "createdAt", "updatedAt")
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          default_tenant_id,
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
