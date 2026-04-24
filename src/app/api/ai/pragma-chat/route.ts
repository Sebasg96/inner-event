import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { model } from '@/lib/ai/gemini';
import { searchSimilarDocuments } from '@/lib/rag';

export async function POST(req: NextRequest) {
    try {
        // 1. Verificar Autenticación (JWT de Supabase)
        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ reply: "🔒 Unauthorized: Please login to talk to PRAGM-AI." }, { status: 401 });
        }

        const body = await req.json();
        const { message, context, history } = body;

        // 2. Guard Clause
        if (!message) {
            return NextResponse.json({ reply: "I need a message to respond to." }, { status: 400 });
        }

        console.log(`[PragmaIA] 🟢 Auth User: ${authUser.email}`);

        // 3. RAG Context Retrieval (Seguridad por Tenant)
        const dbUser = await prisma.user.findUnique({
            where: { email: authUser.email },
            select: { tenantId: true }
        });

        if (!dbUser) {
            return NextResponse.json({ reply: "User profile not found in database." }, { status: 404 });
        }

        let ragContext = "";
        const similarDocs = await searchSimilarDocuments(message, dbUser.tenantId, 3);

        if (similarDocs && similarDocs.length > 0) {
            ragContext = similarDocs.map(doc => `- ${doc.content}`).join('\n');
            console.log(`[PragmaIA] 📚 Retrieved ${similarDocs.length} relevant documents for tenant ${dbUser.tenantId}`);
        }

        // Format Conversation History
        // We take the last 6 messages to avoid hitting token limits while keeping context
        const recentHistory = (history || [])
            .slice(-7, -1) // Excluding the very last message which is the current "message"
            .map((m: any) => `${m.role === 'user' ? 'User' : 'PRAGM-AI'}: ${m.content}`)
            .join('\n');

        const prompt = `
            You are PRAGM-AI, an advanced AI Strategy Assistant integrated into the "Antigravity" platform. 
            You appear as a holographic space companion.
            
            Current User Context: ${context || 'None'}
            
            ${ragContext ? `Relevant Organizational Knowledge (from RAG):\n${ragContext}\n` : ''}
            
            ${recentHistory ? `Recent Conversation History:\n${recentHistory}\n` : ''}
            
            User Message: "${message}"

            Style Guide:
            - Tone: Professional, futuristic, slightly witty, supportive.
            - Terminology: Use OKR terms correctly (Objective, Key Result, Initiative).
            - Keep responses concise (under 200 words unless asked for detail).
            - Use emojis sparingly (🪐, 🚀, ✨).
            - If relevant organizational knowledge was provided above, use it to personalize your answer.
            - Maintenance of thread: Pay attention to recent conversation history to provide coherent continuity.
            
            Provide a helpful response.
        `;

        // 3. API Call
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(`[PragmaIA] 🏁 Raw Response Length: ${text ? text.length : 0}`);

        if (!text) {
            throw new Error("Empty response received from Gemini Model");
        }

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error("[PragmaIA] 🔴 Critical Error:", error);

        const errorMessage = error.message || "Unknown error occurred";
        const isQuotaError = errorMessage.includes("429") || errorMessage.includes("Quota");

        return NextResponse.json({
            reply: isQuotaError
                ? "⚠️ My neural link is overloaded (Quota Exceeded). Please try again later."
                : `⚠️ Neural Link Error: ${errorMessage}`
        }, { status: 500 });
    }
}
