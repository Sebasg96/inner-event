const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const testModels = [
    "gemini-1.5-flash", 
    "gemini-1.5-pro", 
    "gemini-1.0-pro",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp"
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
