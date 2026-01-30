const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const combinations = [
    { model: "gemini-1.5-flash", version: "v1" },
    { model: "gemini-1.5-flash", version: "v1beta" },
    { model: "gemini-2.0-flash-exp", version: "v1beta" }
  ];

  for (const combo of combinations) {
    try {
        const model = genAI.getGenerativeModel({ model: combo.model }, { apiVersion: combo.version });
        const result = await model.generateContent("test");
        console.log(`✅ ${combo.model} (${combo.version}) works`);
    } catch (err) {
        console.log(`❌ ${combo.model} (${combo.version}) failed: ${err.message}`);
    }
  }
}

main();
