const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function checkQuota() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  console.log("Testing API Key with gemini-1.5-flash-latest...");
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent("Say 'OK' if you can read this.");
    const text = result.response.text();
    console.log("✅ API Response:", text);
    console.log("✅ Your API key has available quota!");
  } catch (e) {
    if (e.message.includes("429")) {
      console.error("❌ QUOTA EXCEEDED - Your API key has reached its limit");
      console.error("Visit: https://ai.google.dev/gemini-api/docs/rate-limits");
    } else if (e.message.includes("404")) {
      console.error("❌ Model not found. Trying gemini-pro...");
      
      try {
        const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result2 = await model2.generateContent("Say 'OK'");
        console.log("✅ gemini-pro works:", result2.response.text());
      } catch (e2) {
        console.error("❌ gemini-pro also failed:", e2.message);
      }
    } else {
      console.error("❌ Error:", e.message);
    }
  }
}

checkQuota();
