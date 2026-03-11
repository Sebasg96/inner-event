'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { jsonModel } from '@/lib/ai/gemini';
import { getAnalyticsData } from '@/lib/analytics-data';

// ─── Prompt builders ───

function buildNarrativePrompt(analytics: Awaited<ReturnType<typeof getAnalyticsData>>) {
    const llmContext = {
        purpose: analytics.purposeStatement,
        mega: analytics.megaStatement,
        megaDeadline: analytics.megaDeadline,
        totalObjectives: analytics.totalObjectives,
        totalKRs: analytics.totalKRs,
        totalInitiatives: analytics.totalInitiatives,
        avgKRProgress: analytics.avgKRProgress,
        krsOnTrack: analytics.krsOnTrack,
        krsAtRisk: analytics.krsAtRisk,
        krsBehind: analytics.krsBehind,
        krsComplete: analytics.krsComplete,
        adherenceScore: analytics.adherenceScore,
        updatesThisMonth: analytics.totalUpdatesThisMonth,
        updatesLastMonth: analytics.totalUpdatesLastMonth,
        avgDaysBetweenUpdates: analytics.avgDaysBetweenUpdates,
        initiativesByStatus: analytics.initiativesByStatus,
        avgInitiativeProgress: analytics.avgInitiativeProgress,
        objectives: analytics.objectiveSummaries,
        keyResults: analytics.krSummaries,
        initiatives: analytics.initiativeSummaries,
    };

    return `
Eres PRAGMA, un coach estratégico de IA que analiza datos reales de OKR de una organización.
Genera un reporte narrativo EN ESPAÑOL basado en estos datos reales (NO inventes datos, usa solo los proporcionados):

${JSON.stringify(llmContext, null, 2)}

Responde en JSON con este esquema exacto:
{
    "executiveSummary": "string — Resumen ejecutivo de 2-3 párrafos del estado general de la estrategia. Menciona el propósito y la mega si están disponibles. Usa lenguaje profesional pero accesible.",
    "achievements": [
        { "title": "string — título corto", "description": "string — explicación de 1-2 oraciones" }
    ],
    "risks": [
        { "title": "string — título corto", "description": "string — explicación + impacto potencial" }
    ],
    "recommendations": [
        { "title": "string — acción concreta", "description": "string — cómo y por qué implementarla", "priority": "alta|media|baja" }
    ]
}

Reglas:
- Achievements: cosas positivas reales (KRs con buen progreso, iniciativas completadas, buena cadencia)
- Risks: KRs con bajo progreso, iniciativas estancadas, baja adherencia, días sin actualizar
- Recommendations: 3-5 acciones concretas priorizadas
- NO inventes métricas. Solo interpreta los datos proporcionados.
- Si hay pocos datos (ej: 0 KRs), di que la estrategia está en fase temprana.
`;
}

function buildInsightsPrompt(analytics: Awaited<ReturnType<typeof getAnalyticsData>>) {
    const llmContext = {
        adherenceScore: analytics.adherenceScore,
        avgDaysBetweenUpdates: analytics.avgDaysBetweenUpdates,
        updatesThisMonth: analytics.totalUpdatesThisMonth,
        updatesLastMonth: analytics.totalUpdatesLastMonth,
        avgKRProgress: analytics.avgKRProgress,
        krsOnTrack: analytics.krsOnTrack,
        krsAtRisk: analytics.krsAtRisk,
        krsBehind: analytics.krsBehind,
        krsComplete: analytics.krsComplete,
        totalKRs: analytics.totalKRs,
        initiativesByStatus: analytics.initiativesByStatus,
        initiativesByHorizon: analytics.initiativesByHorizon,
        avgInitiativeProgress: analytics.avgInitiativeProgress,
        totalUsers: analytics.totalUsers,
        krDetails: analytics.krSummaries.map(kr => ({
            name: kr.name, progress: kr.progress, periodicity: kr.periodicity,
            daysSinceLastUpdate: kr.daysSinceLastUpdate, updateCount: kr.updateCount, status: kr.status,
        })),
        objectiveDetails: analytics.objectiveSummaries.map(obj => ({
            name: obj.name, level: obj.level, krCount: obj.krCount, avgProgress: obj.avgProgress,
        })),
    };

    return `
Eres PRAGMA, un coach estratégico de IA que analiza datos reales de OKR.
Genera insights cualitativos profundos EN ESPAÑOL basados en estos datos reales:

${JSON.stringify(llmContext, null, 2)}

Responde en JSON con este esquema exacto:
{
    "maturityLevel": number,
    "maturityExplanation": "string — explicación de 1-2 oraciones del nivel",
    "behaviorPatterns": [
        { "title": "string — nombre del patrón con emoji", "description": "string — qué detectaste y por qué es relevante", "type": "positive|neutral|negative" }
    ],
    "healthScore": number,
    "healthBreakdown": {
        "alignment": number, "cadence": number, "progress": number, "execution": number
    },
    "actionItems": [
        { "action": "string — qué hacer", "impact": "alto|medio|bajo", "effort": "bajo|medio|alto" }
    ]
}

Reglas:
- behaviorPatterns: 2-4 patrones detectados en los datos (cadencia, distribución, tendencias)
- actionItems: 3-5 acciones concretas ordenadas por impacto/esfuerzo
- NO inventes datos. Evalúa basándote estrictamente en los valores proporcionados.
- Si hay pocos datos, refleja eso en scores bajos y explica por qué.
`;
}

// ─── Server Action: Regenerate analytics snapshot ───

export async function regenerateAnalytics(type: 'narrative' | 'insights') {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        return { error: 'No tenant found' };
    }

    const analytics = await getAnalyticsData(tenantId);
    const prompt = type === 'narrative'
        ? buildNarrativePrompt(analytics)
        : buildInsightsPrompt(analytics);

    try {
        const aiResult = await jsonModel.generateContent(prompt);
        const responseText = aiResult.response.text();
        const parsed = JSON.parse(responseText);

        // Upsert snapshot (one per tenant per type)
        await prisma.analyticsSnapshot.upsert({
            where: { tenantId_type: { tenantId, type } },
            create: {
                type,
                data: JSON.stringify(parsed),
                tenantId,
            },
            update: {
                data: JSON.stringify(parsed),
            },
        });

        // Revalidate the corresponding page
        if (type === 'narrative') {
            revalidatePath('/analytics');
        } else {
            revalidatePath('/analytics/metrics');
        }

        return { success: true };
    } catch (error) {
        console.error(`Error regenerating ${type} analytics:`, error);
        return { error: 'Failed to generate report' };
    }
}

// Re-export builders for use in page.tsx (first-time generation)
export { buildNarrativePrompt, buildInsightsPrompt };
