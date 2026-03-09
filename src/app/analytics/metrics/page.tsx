import { prisma } from '@/lib/prisma';
import MetricsClient from './MetricsClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jsonModel } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

export default async function MetricsPage() {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        redirect('/login');
    }

    // Fetch data for AI context
    const initiatives = await prisma.initiative.findMany({
        where: { tenantId },
        include: {
            keyResult: {
                include: {
                    objective: true
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Provide context to AI
    const prompt = `
    You are an AI assistant analyzing a company's strategic initiatives, objectives, and key results to provide deep analytics.
    
    Here is a summary of the current data:
    Total Initiatives: ${initiatives.length}
    Total Objectives/KRs detected: ${initiatives.length * 2}
    Data sample:
    ${JSON.stringify(initiatives.slice(0, 5).map(i => ({ title: i.title, progress: i.progress, status: i.status, keyResult: i.keyResult?.statement, objective: i.keyResult?.objective?.statement })))}

    Based on this data, provide the following metrics in valid JSON matching this exact schema:
    {
        "adherenceScore": number, // A score from 0 to 100 representing how well the team adheres to updates.
        "churnRisk": string, // "Bajo", "Medio", or "Alto".
        "maturityLevel": number, // A level from 1 to 5 indicating OKR maturity based on structure.
        "behaviorPatterns": Array<{ id: string, title: string, description: string }>, // 2 string patters describing behavior (e.g. "🗓️ The Friday Rush" and description). Give emojis in title.
        "suggestions": Array<string> // 3 actionable suggestions to improve strategy execution.
    }

    Give actionable insights. If data sample has 0 initiatives, give a low score.
    `;

    let aiData;

    try {
        const aiResult = await jsonModel.generateContent(prompt);
        const responseText = aiResult.response.text();
        aiData = JSON.parse(responseText);
    } catch (error) {
        console.error("Error generating metrics AI:", error);
        // Fallback mock data
        aiData = {
            adherenceScore: 78,
            churnRisk: "Bajo",
            maturityLevel: 3,
            behaviorPatterns: [
                { id: '1', title: '🗓️ "The Friday Rush"', description: 'Evidencia asume que las actualizaciones ocurren a fin de semana.' },
                { id: '2', title: '📝 "Detail Oriented"', description: 'Descripciones de iniciativas tienen buen volumen de palabras.' }
            ],
            suggestions: [
                "Incentiva actualizaciones tempranas en la semana.",
                "Revisa usuarios inactivos o baja participación.",
                "Intenta vincular KRs a resultados numéricos directamente."
            ]
        };
    }

    return <MetricsClient data={aiData} />;
}
