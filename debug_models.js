const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Model object created");
    // Actually, let's use the listModels method if available or just try a different one
    // The library doesn't have a direct listModels on the genAI object usually, 
    // it's a separate client or part of the REST API.
    
    // Let's try gemini-1.5-flash-latest and gemini-1.5-flash-it (if it exists)
    // Actually, let's try 'gemini-1.5-flash' but with a different version if possible.
    // The library usually handles the version.
    
    const testModels = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
    for (const m of testModels) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("test");
            console.log(`✅ ${m} works`);
        } catch (err) {
            console.log(`❌ ${m} failed: ${err.message}`);
        }
    }

  } catch (error) {
    console.error("Discovery error:", error);
  }
}

main();
