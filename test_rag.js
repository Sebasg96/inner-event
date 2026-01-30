const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");

require('dotenv').config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  const embedding = result.embedding;
  return embedding.values;
}

async function testRag() {
  try {
    console.log("🧪 Testing RAG Setup...");

    // 1. Create a tenant if not exists (for FK)
    const tenant = await prisma.tenant.upsert({
      where: { domain: 'rag-val.com' },
      update: {},
      create: {
        name: 'RAG Validation',
        domain: 'rag-val.com',
      }
    });

    const testContent = "Supabase with pgvector enables efficient similarity search for RAG applications.";
    console.log(`📝 Generating embedding for: "${testContent}"`);
    
    const embedding = await generateEmbedding(testContent);
    console.log(`🔹 Embedding generated (length: ${embedding.length})`);

    // 2. Insert document
    const vectorString = `[${embedding.join(',')}]`;
    const docId = await prisma.$executeRaw`
      INSERT INTO documents (id, content, "tenantId", embedding, "updatedAt")
      VALUES (gen_random_uuid(), ${testContent}, ${tenant.id}, ${vectorString}::vector, NOW())
      RETURNING id;
    `;
    console.log("✅ Document inserted.");

    // 3. Search similarity
    console.log("🔍 Searching for 'similarity search'...");
    const queryText = "efficient search";
    const queryEmbedding = await generateEmbedding(queryText);
    const queryVector = `[${queryEmbedding.join(',')}]`;

    const results = await prisma.$queryRaw`
      SELECT id, content, 1 - (embedding <=> ${queryVector}::vector) as similarity
      FROM documents
      WHERE "tenantId" = ${tenant.id}
      ORDER BY similarity DESC
      LIMIT 1;
    `;

    console.log("🎯 Search Results:", results);

    if (results.length > 0) {
      console.log("✅ RAG verification PASSED.");
    } else {
      console.error("❌ RAG verification FAILED: No results found.");
    }

  } catch (e) {
    console.error("❌ Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

testRag();
