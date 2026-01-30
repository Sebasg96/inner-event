const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    console.log("Testing gemini-1.5-flash...");
    const result = await model.generateContent("Hello! Are you working?");
    console.log("Response:", result.response.text());
    console.log("✅ Success!");
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
}

test();
