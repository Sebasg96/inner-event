import AnalyticsClient from './AnalyticsClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jsonModel } from '@/lib/ai/gemini';
import { getAnalyticsData } from '@/lib/analytics-data';
import { prisma } from '@/lib/prisma';
import { buildNarrativePrompt } from './analytics-actions';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        redirect('/login');
    }

    // Always fetch real metrics (lightweight, no LLM)
    const analytics = await getAnalyticsData(tenantId);

    // Check for cached snapshot
    const snapshot = await prisma.analyticsSnapshot.findUnique({
        where: { tenantId_type: { tenantId, type: 'narrative' } },
    });

    let aiNarrative;
    let generatedAt: string | null = null;

    if (snapshot) {
        // Use cached data — no LLM call
        aiNarrative = JSON.parse(snapshot.data);
        generatedAt = snapshot.updatedAt.toISOString();
    } else {
        // First visit ever — generate and cache
        const prompt = buildNarrativePrompt(analytics);

        aiNarrative = {
            executiveSummary: '',
            achievements: [] as { title: string; description: string }[],
            risks: [] as { title: string; description: string }[],
            recommendations: [] as { title: string; description: string; priority: string }[],
        };

        try {
            const aiResult = await jsonModel.generateContent(prompt);
            const responseText = aiResult.response.text();
            aiNarrative = JSON.parse(responseText);

            // Save snapshot (using upsert to be safe)
            await prisma.analyticsSnapshot.upsert({
                where: { tenantId_type: { tenantId, type: 'narrative' } },
                create: {
                    type: 'narrative',
                    data: JSON.stringify(aiNarrative),
                    tenantId,
                },
                update: {
                    data: JSON.stringify(aiNarrative),
                }
            });
            generatedAt = new Date().toISOString();
        } catch (error) {
            console.error('Error generating analytics narrative:', error);
            aiNarrative = {
                executiveSummary: `La organización cuenta con ${analytics.totalObjectives} objetivos y ${analytics.totalKRs} resultados clave. El progreso promedio de KRs es del ${analytics.avgKRProgress}%. La adherencia al seguimiento es del ${analytics.adherenceScore}%.`,
                achievements: analytics.krsComplete > 0
                    ? [{ title: 'KRs Completados', description: `${analytics.krsComplete} resultado(s) clave alcanzaron su meta.` }]
                    : [],
                risks: analytics.krsBehind > 0
                    ? [{ title: 'KRs Rezagados', description: `${analytics.krsBehind} resultado(s) clave tienen menos del 30% de progreso.` }]
                    : [],
                recommendations: [
                    { title: 'Revisar cadencia de actualización', description: 'Asegurar que los equipos registren avances según la periodicidad definida.', priority: 'alta' },
                ],
            };
        }
    }

    return (
        <AnalyticsClient
            metrics={{
                totalObjectives: analytics.totalObjectives,
                totalKRs: analytics.totalKRs,
                totalInitiatives: analytics.totalInitiatives,
                totalUsers: analytics.totalUsers,
                avgKRProgress: analytics.avgKRProgress,
                krsOnTrack: analytics.krsOnTrack,
                krsAtRisk: analytics.krsAtRisk,
                krsBehind: analytics.krsBehind,
                krsComplete: analytics.krsComplete,
                adherenceScore: analytics.adherenceScore,
                totalUpdatesThisMonth: analytics.totalUpdatesThisMonth,
                totalUpdatesLastMonth: analytics.totalUpdatesLastMonth,
                initiativesByStatus: analytics.initiativesByStatus,
                avgInitiativeProgress: analytics.avgInitiativeProgress,
            }}
            narrative={aiNarrative}
            generatedAt={generatedAt}
        />
    );
}
