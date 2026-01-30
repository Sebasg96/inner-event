const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent("test");
    console.log("✅ Embedding works!");
  } catch (err) {
    console.log("❌ Embedding failed:", err.message);
    
    // Try other embedding models if 004 fails
    const backups = ["embedding-001", "embedding-gecko-001"];
    for (const b of backups) {
        try {
            const m = genAI.getGenerativeModel({ model: b });
            await m.embedContent("test");
            console.log(`✅ Backup embedding ${b} works!`);
            break;
        } catch (e2) {
            console.log(`❌ Backup ${b} failed:`, e2.message);
        }
    }
  }
}

main();
