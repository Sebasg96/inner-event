const { GoogleGenerativeAI } = require("@google/generative-ai");
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const prisma = new PrismaClient();

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent("similarity search");
    const embedding = result.embedding.values;
    const vectorString = "[" + embedding.join(",") + "]";

    console.log("Searching...");
    const docs = await prisma.$queryRaw`
      SELECT id, content, 1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM documents
      ORDER BY similarity DESC
      LIMIT 1
    `;
    console.log("Found:", docs);
  } catch (err) {
    console.error("FULL ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
