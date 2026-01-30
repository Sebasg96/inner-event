const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    console.log("Listing available models...");
    
    // Try different model names
    const modelsToTest = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-pro",
      "gemini-1.0-pro"
    ];
    
    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hi");
        console.log(`✅ ${modelName}: WORKS`);
        break; // Stop at first working model
      } catch (e) {
        console.log(`❌ ${modelName}: ${e.message.substring(0, 100)}`);
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

listModels();
