import { prisma } from '@/lib/prisma';
import { calculateKRProgress } from '@/lib/krUtils';
import { MeasurementDirection } from '@prisma/client';

/**
 * Analytics Data Aggregation — all queries scoped by tenantId.
 * Returns server-side computed metrics + sanitized summaries for the LLM.
 * NO IDs, emails, or personal data are included in the output.
 */

export interface ObjectiveSummary {
    name: string;
    level: string; // 'L1' | 'L2' | 'L3'
    krCount: number;
    avgProgress: number;
    axis: string | null;
}

export interface KRSummary {
    name: string;
    progress: number; // 0-100
    periodicity: string | null;
    daysSinceLastUpdate: number | null;
    updateCount: number;
    initiativeCount: number;
    status: 'on_track' | 'at_risk' | 'behind';
}

export interface InitiativeSummary {
    name: string;
    progress: number;
    status: string;
    horizon: string;
    tasksDone: number;
    tasksTotal: number;
}

export interface AnalyticsData {
    // Strategic context (sanitized)
    purposeStatement: string | null;
    megaStatement: string | null;
    megaDeadline: string | null;

    // Counts
    totalObjectives: number;
    totalKRs: number;
    totalInitiatives: number;
    totalUsers: number;

    // KR Progress (server-side)
    avgKRProgress: number;
    krsOnTrack: number;
    krsAtRisk: number;
    krsBehind: number;
    krsComplete: number;

    // Adherence / Cadence (server-side)
    adherenceScore: number;  // 0-100, updates real / updates expected
    totalUpdatesThisMonth: number;
    totalUpdatesLastMonth: number;
    avgDaysBetweenUpdates: number | null;

    // Initiatives
    initiativesByStatus: { TODO: number; IN_PROGRESS: number; DONE: number };
    initiativesByHorizon: { H1: number; H2: number; H3: number };
    avgInitiativeProgress: number;

    // Sanitized summaries for LLM
    objectiveSummaries: ObjectiveSummary[];
    krSummaries: KRSummary[];
    initiativeSummaries: InitiativeSummary[];
}

export async function getAnalyticsData(tenantId: string): Promise<AnalyticsData> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ─── Fetch all data in parallel, ALL scoped by tenantId ───
    const [
        purpose,
        mega,
        objectives,
        keyResults,
        initiatives,
        usersCount,
        updatesThisMonth,
        updatesLastMonth,
        allUpdates,
    ] = await Promise.all([
        prisma.purpose.findFirst({
            where: { tenantId, type: 'COMPANY' },
            select: { statement: true },
        }),
        prisma.mega.findFirst({
            where: { tenantId },
            select: { statement: true, deadline: true },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.objective.findMany({
            where: { tenantId },
            select: {
                statement: true,
                parentObjectiveId: true,
                megaId: true,
                weight: true,
                strategicAxis: { select: { statement: true } },
                keyResults: {
                    select: {
                        id: true,
                        statement: true,
                        currentValue: true,
                        targetValue: true,
                        trackingType: true,
                        measurementDirection: true,
                        updatePeriodicity: true,
                        initiatives: { select: { id: true } },
                        updates: {
                            select: { createdAt: true },
                            orderBy: { createdAt: 'desc' as const },
                        },
                    },
                },
            },
        }),
        prisma.keyResult.findMany({
            where: { tenantId },
            select: {
                currentValue: true,
                targetValue: true,
                trackingType: true,
                measurementDirection: true,
            },
        }),
        prisma.initiative.findMany({
            where: { tenantId },
            select: {
                title: true,
                progress: true,
                status: true,
                horizon: true,
                tasks: {
                    select: { status: true },
                },
            },
        }),
        prisma.user.count({ where: { tenantId } }),
        prisma.keyResultUpdate.count({
            where: {
                keyResult: { tenantId },
                createdAt: { gte: thisMonthStart },
            },
        }),
        prisma.keyResultUpdate.count({
            where: {
                keyResult: { tenantId },
                createdAt: { gte: lastMonthStart, lt: thisMonthStart },
            },
        }),
        prisma.keyResultUpdate.findMany({
            where: { keyResult: { tenantId } },
            select: { createdAt: true, keyResultId: true },
            orderBy: { createdAt: 'asc' },
        }),
    ]);

    // ─── KR Progress Computation ───
    const krProgressList = keyResults.map((kr) => {
        return calculateKRProgress(kr.measurementDirection as MeasurementDirection, kr.currentValue, kr.targetValue);
    });

    const avgKRProgress =
        krProgressList.length > 0
            ? Math.round(krProgressList.reduce((a, b) => a + b, 0) / krProgressList.length)
            : 0;

    const krsComplete = krProgressList.filter((p) => p >= 100).length;
    const krsOnTrack = krProgressList.filter((p) => p >= 70 && p < 100).length;
    const krsAtRisk = krProgressList.filter((p) => p >= 30 && p < 70).length;
    const krsBehind = krProgressList.filter((p) => p < 30).length;

    // ─── Adherence Score (real updates vs expected by periodicity) ───
    const periodicityToDays: Record<string, number> = {
        DAILY: 1,
        WEEKLY: 7,
        BIWEEKLY: 14,
        MONTHLY: 30,
        QUARTERLY: 90,
        YEARLY: 365,
    };

    let totalExpected = 0;
    let totalActual = 0;

    for (const obj of objectives) {
        for (const kr of obj.keyResults) {
            const periodicity = kr.updatePeriodicity;
            if (!periodicity) continue;

            const daysCycle = periodicityToDays[periodicity] || 30;
            // How many updates expected in the last 90 days?
            const expectedInWindow = Math.max(1, Math.floor(90 / daysCycle));
            const actualInWindow = kr.updates.filter(
                (u) => u.createdAt >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            ).length;

            totalExpected += expectedInWindow;
            totalActual += Math.min(actualInWindow, expectedInWindow);
        }
    }

    const adherenceScore =
        totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;

    // ─── Average days between updates ───
    let avgDaysBetweenUpdates: number | null = null;
    if (allUpdates.length >= 2) {
        // Group by KR, compute avg gap per KR, then global avg
        const byKR = new Map<string, Date[]>();
        for (const u of allUpdates) {
            if (!byKR.has(u.keyResultId)) byKR.set(u.keyResultId, []);
            byKR.get(u.keyResultId)!.push(u.createdAt);
        }

        const gaps: number[] = [];
        for (const dates of byKR.values()) {
            if (dates.length < 2) continue;
            for (let i = 1; i < dates.length; i++) {
                gaps.push(
                    (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
                );
            }
        }

        if (gaps.length > 0) {
            avgDaysBetweenUpdates = Math.round(
                gaps.reduce((a, b) => a + b, 0) / gaps.length
            );
        }
    }

    // ─── Initiative metrics ───
    const initiativesByStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const initiativesByHorizon = { H1: 0, H2: 0, H3: 0 };

    for (const ini of initiatives) {
        initiativesByStatus[ini.status as keyof typeof initiativesByStatus] =
            (initiativesByStatus[ini.status as keyof typeof initiativesByStatus] || 0) + 1;
        initiativesByHorizon[ini.horizon as keyof typeof initiativesByHorizon] =
            (initiativesByHorizon[ini.horizon as keyof typeof initiativesByHorizon] || 0) + 1;
    }

    const avgInitiativeProgress =
        initiatives.length > 0
            ? Math.round(
                initiatives.reduce((a, i) => a + i.progress, 0) / initiatives.length
            )
            : 0;

    // ─── Build sanitized summaries (NO IDs, NO emails, NO personal names) ───

    const objectiveSummaries: ObjectiveSummary[] = objectives.map((obj) => {
        const krProgresses = obj.keyResults.map((kr) =>
            calculateKRProgress(kr.measurementDirection as MeasurementDirection, kr.currentValue, kr.targetValue)
        );
        const avg =
            krProgresses.length > 0
                ? Math.round(krProgresses.reduce((a, b) => a + b, 0) / krProgresses.length)
                : 0;

        let level = 'L1';
        if (obj.parentObjectiveId && obj.megaId) level = 'L2';
        else if (obj.parentObjectiveId) level = 'L3';

        return {
            name: obj.statement,
            level,
            krCount: obj.keyResults.length,
            avgProgress: avg,
            axis: obj.strategicAxis?.statement || null,
        };
    });

    const krSummaries: KRSummary[] = objectives.flatMap((obj) =>
        obj.keyResults.map((kr) => {
            const progress = calculateKRProgress(kr.measurementDirection as MeasurementDirection, kr.currentValue, kr.targetValue);

            const lastUpdate = kr.updates.length > 0 ? kr.updates[0].createdAt : null;
            const daysSinceLastUpdate = lastUpdate
                ? Math.round(
                    (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
                )
                : null;

            let status: 'on_track' | 'at_risk' | 'behind' = 'on_track';
            if (progress < 30) status = 'behind';
            else if (progress < 70) status = 'at_risk';

            return {
                name: kr.statement,
                progress,
                periodicity: kr.updatePeriodicity,
                daysSinceLastUpdate,
                updateCount: kr.updates.length,
                initiativeCount: kr.initiatives.length,
                status,
            };
        })
    );

    const initiativeSummaries: InitiativeSummary[] = initiatives.map((ini) => ({
        name: ini.title,
        progress: ini.progress,
        status: ini.status,
        horizon: ini.horizon,
        tasksDone: ini.tasks.filter((t) => t.status === 'DONE').length,
        tasksTotal: ini.tasks.length,
    }));

    return {
        purposeStatement: purpose?.statement || null,
        megaStatement: mega?.statement || null,
        megaDeadline: mega?.deadline?.toISOString().split('T')[0] || null,

        totalObjectives: objectives.length,
        totalKRs: keyResults.length,
        totalInitiatives: initiatives.length,
        totalUsers: usersCount,

        avgKRProgress,
        krsOnTrack,
        krsAtRisk,
        krsBehind,
        krsComplete,

        adherenceScore,
        totalUpdatesThisMonth: updatesThisMonth,
        totalUpdatesLastMonth: updatesLastMonth,
        avgDaysBetweenUpdates,

        initiativesByStatus,
        initiativesByHorizon,
        avgInitiativeProgress,

        objectiveSummaries,
        krSummaries,
        initiativeSummaries,
    };
}
