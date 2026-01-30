const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const testModels = [
    "gemini-2.0-flash", 
    "gemini-2.0-flash-lite", 
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-2.0-flash-001"
  ];

  for (const m of testModels) {
    try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("test");
        console.log(`✅ ${m} works`);
    } catch (err) {
        console.log(`❌ ${m} failed: ${err.message}`);
    }
  }
}

main();
