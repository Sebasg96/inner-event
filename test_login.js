const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log("🔐 PRUEBA DE LOGIN\n");
    console.log("=".repeat(60));
    
    // Test credentials from login page
    const testCredentials = [
      { email: 'william.galindo@compensar.com', password: '12345' },
      { email: 'oscar.gomez@ikusi.com', password: '12345' }
    ];

    for (const cred of testCredentials) {
      console.log(`\n📧 Probando: ${cred.email}`);
      console.log(`🔑 Password: ${cred.password}`);
      
      const user = await prisma.user.findUnique({
        where: { email: cred.email },
        include: { tenant: true }
      });

      if (!user) {
        console.log(`   ❌ Usuario NO ENCONTRADO en la base de datos`);
        continue;
      }

      console.log(`   ✅ Usuario encontrado en DB`);
      console.log(`   👤 Nombre: ${user.name} ${user.lastName || ''}`);
      console.log(`   🏢 Tenant: ${user.tenant.name}`);
      console.log(`   🔑 Password en DB: "${user.password}"`);
      
      // Simulate login logic from actions.ts
      if (user.password !== cred.password) {
        console.log(`   ❌ LOGIN FALLARÁ - Password no coincide`);
        console.log(`      Esperado: "${cred.password}"`);
        console.log(`      En DB: "${user.password}"`);
      } else {
        console.log(`   ✅ LOGIN EXITOSO - Credenciales válidas`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ DIAGNÓSTICO COMPLETO");
    
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
