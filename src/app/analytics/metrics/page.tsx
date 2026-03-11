import MetricsClient from './MetricsClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jsonModel } from '@/lib/ai/gemini';
import { getAnalyticsData } from '@/lib/analytics-data';
import { prisma } from '@/lib/prisma';
import { buildInsightsPrompt } from '../analytics-actions';

export const dynamic = 'force-dynamic';

export default async function MetricsPage() {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        redirect('/login');
    }

    // Always fetch real metrics (lightweight, no LLM)
    const analytics = await getAnalyticsData(tenantId);

    // Check for cached snapshot
    const snapshot = await prisma.analyticsSnapshot.findUnique({
        where: { tenantId_type: { tenantId, type: 'insights' } },
    });

    let aiInsights;
    let generatedAt: string | null = null;

    if (snapshot) {
        // Use cached data — no LLM call
        aiInsights = JSON.parse(snapshot.data);
        generatedAt = snapshot.updatedAt.toISOString();
    } else {
        // First visit ever — generate and cache
        const prompt = buildInsightsPrompt(analytics);

        try {
            const aiResult = await jsonModel.generateContent(prompt);
            const responseText = aiResult.response.text();
            aiInsights = JSON.parse(responseText);

            // Save snapshot (using upsert to be safe)
            await prisma.analyticsSnapshot.upsert({
                where: { tenantId_type: { tenantId, type: 'insights' } },
                create: {
                    type: 'insights',
                    data: JSON.stringify(aiInsights),
                    tenantId,
                },
                update: {
                    data: JSON.stringify(aiInsights),
                }
            });
            generatedAt = new Date().toISOString();
        } catch (error) {
            console.error('Error generating deep analytics:', error);
            const alignment = analytics.totalKRs > 0 ? Math.min(100, Math.round((analytics.totalObjectives / Math.max(1, analytics.totalKRs)) * 100 * 2)) : 0;
            aiInsights = {
                maturityLevel: analytics.adherenceScore >= 80 ? 5 : analytics.adherenceScore >= 60 ? 4 : analytics.adherenceScore >= 40 ? 3 : analytics.totalKRs > 0 ? 2 : 1,
                maturityExplanation: 'Evaluación calculada automáticamente basada en adherencia y progreso.',
                behaviorPatterns: [
                    { title: '📊 Estado General', description: `${analytics.totalKRs} KRs con progreso promedio del ${analytics.avgKRProgress}%.`, type: 'neutral' },
                ],
                healthScore: Math.round((analytics.avgKRProgress + analytics.adherenceScore + analytics.avgInitiativeProgress) / 3),
                healthBreakdown: { alignment, cadence: analytics.adherenceScore, progress: analytics.avgKRProgress, execution: analytics.avgInitiativeProgress },
                actionItems: [
                    { action: 'Revisar KRs sin actualización reciente', impact: 'alto', effort: 'bajo' },
                    { action: 'Definir periodicidad en KRs que no la tienen', impact: 'alto', effort: 'medio' },
                ],
            };
        }
    }

    return (
        <MetricsClient
            metrics={{
                adherenceScore: analytics.adherenceScore,
                avgDaysBetweenUpdates: analytics.avgDaysBetweenUpdates,
                totalUpdatesThisMonth: analytics.totalUpdatesThisMonth,
                totalUpdatesLastMonth: analytics.totalUpdatesLastMonth,
                avgKRProgress: analytics.avgKRProgress,
                krsOnTrack: analytics.krsOnTrack,
                krsAtRisk: analytics.krsAtRisk,
                krsBehind: analytics.krsBehind,
                krsComplete: analytics.krsComplete,
                totalKRs: analytics.totalKRs,
                totalObjectives: analytics.totalObjectives,
                totalInitiatives: analytics.totalInitiatives,
                initiativesByStatus: analytics.initiativesByStatus,
                initiativesByHorizon: analytics.initiativesByHorizon,
                avgInitiativeProgress: analytics.avgInitiativeProgress,
            }}
            insights={aiInsights}
            generatedAt={generatedAt}
        />
    );
}
