const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applySchema() {
  try {
    console.log("📜 Reading migration.sql...");
    const sqlPath = path.join(__dirname, 'migration.sql');
    
    // Attempt to read with multiple encodings or detect
    let sqlContent;
    try {
        sqlContent = fs.readFileSync(sqlPath, 'utf16le'); // PowerShell default
        if (!sqlContent.trim().startsWith('--')) {
             // Fallback if it looks wrong (e.g. was actually utf8)
             sqlContent = fs.readFileSync(sqlPath, 'utf8');
        }
    } catch (e) {
        sqlContent = fs.readFileSync(sqlPath, 'utf8');
    }

    // Remove comments to verify content briefly
    console.log(`Pre-processing SQL (Length: ${sqlContent.length})...`);

    // Split by semicolon, but handle cases roughly
    // For a generated clean SQL file, splitting by ';\n' or '; ' is usually safe enough for initial setup
    // Better: split by ";\r\n" or ";\n"
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`🚀 Executing ${statements.length} statements...`);

    for (const [i, stmt] of statements.entries()) {
      try {
        // Skip purely comment blocks if any result from split
        if (stmt.startsWith('--') && !stmt.includes('\n')) continue;
        
        await prisma.$executeRawUnsafe(stmt);
        // console.log(`✅ Stmt ${i+1} executed.`);
      } catch (err) {
        console.warn(`⚠️ Error on stmt ${i+1}: ${err.message.split('\n')[0]}`);
        // Continue? Yes, for idempotency (e.g. "already exists")
      }
    }

    console.log("✅ Schema application finished.");

  } catch (e) {
    console.error("❌ Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

applySchema();
