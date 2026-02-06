const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config({ path: '.env', debug: false });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    fs.writeFileSync('available_models.json', JSON.stringify({ error: "No KEY" }));
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
        const names = data.models.map(m => m.name);
        fs.writeFileSync('available_models.json', JSON.stringify(names, null, 2));
    } else {
        fs.writeFileSync('available_models.json', JSON.stringify({ error: "No models found", data }));
    }

  } catch (error) {
    fs.writeFileSync('available_models.json', JSON.stringify({ error: error.message }));
  }
}

listModels();
