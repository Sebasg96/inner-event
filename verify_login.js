const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkLogin() {
  try {
    console.log("🔍 Verificando sistema de login...\n");

    // 1. Verificar conexión a la DB
    console.log("1️⃣ Verificando conexión a la base de datos...");
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Conexión exitosa\n");

    // 2. Contar usuarios
    console.log("2️⃣ Contando usuarios en la base de datos...");
    const userCount = await prisma.user.count();
    console.log(`✅ Total de usuarios: ${userCount}\n`);

    if (userCount === 0) {
      console.log("⚠️  NO HAY USUARIOS EN LA BASE DE DATOS");
      console.log("   Necesitas ejecutar el seed para crear usuarios de prueba.\n");
      return;
    }

    // 3. Listar todos los usuarios
    console.log("3️⃣ Listando usuarios existentes:");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        tenant: {
          select: {
            name: true,
            domain: true
          }
        }
      }
    });

    users.forEach((user, idx) => {
      console.log(`\n   Usuario ${idx + 1}:`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Nombre: ${user.name}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   🏢 Tenant: ${user.tenant.name} (${user.tenant.domain})`);
      console.log(`   👔 Role: ${user.role}`);
    });

    // 4. Verificar credenciales de prueba específicas
    console.log("\n\n4️⃣ Verificando credenciales de prueba del login:");
    const testEmails = [
      'william.galindo@compensar.com',
      'oscar.gomez@ikusi.com'
    ];

    for (const email of testEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
      });

      if (user) {
        console.log(`\n   ✅ ${email}`);
        console.log(`      Password en DB: "${user.password}"`);
        console.log(`      Tenant: ${user.tenant.name}`);
        
        // Verificar si el password es "12345"
        if (user.password === "12345") {
          console.log(`      ✅ Password correcto (12345)`);
        } else {
          console.log(`      ❌ Password INCORRECTO (esperado: 12345, actual: ${user.password})`);
        }
      } else {
        console.log(`\n   ❌ ${email} - NO EXISTE EN LA BASE DE DATOS`);
      }
    }

    console.log("\n\n📊 RESUMEN:");
    console.log(`   Total usuarios: ${userCount}`);
    console.log(`   Credenciales de prueba encontradas: ${testEmails.filter(e => users.find(u => u.email === e)).length}/${testEmails.length}`);

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nDetalles completos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogin();
