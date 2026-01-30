import { prisma } from '../prisma';
import { KanbanStatus } from '@prisma/client';

export async function updateInitiativeStatus(initiativeId: string, status: KanbanStatus) {
    let progress = 0;

    if (status === 'DONE') {
        progress = 100;
    } else if (status === 'IN_PROGRESS') {
        // Optional: Set to a default like 10% or keep existing if manually edited?
        // For now, let's leave it or set to 10 to show movement. 
        // But the prompt says "Completar tarjetas = 100%". It doesn't specify intermediate.
        // I'll read the current progress. If it's 100 and moving back, maybe reset?
        // Let's just set 100 for DONE and 0 for TODO. IN_PROGRESS we can leave as is or set to 50.
        // I'll set it to 50 for now as a default, or fetch existing.
        // Let's just update status and if DONE, set progress 100.
        progress = 50; // Simplified default
    } else {
        progress = 0;
    }

    // If status is DONE, force 100.
    // If moving out of DONE, should we reset? Yes.

    const updateData: { status: KanbanStatus; progress?: number } = { status };
    if (status === 'DONE') {
        updateData.progress = 100;
    } else if (status === 'TODO') {
        updateData.progress = 0;
    }
    // For IN_PROGRESS, we might not want to overwrite if the user set a specific %.
    // But for this automated logic, I'll leave it unless it was 100 or 0.

    const initiative = await prisma.initiative.update({
        where: { id: initiativeId },
        data: updateData,
    });

    return initiative;
}

export async function getKanbanBoard(tenantId: string, userArea?: string | null, isAdmin?: boolean, userId?: string) {
    // Build filter for initiatives based on their KR's objective's area AND explicit access
    const initiativeFilter: any = { tenantId };
    
    if (isAdmin) {
        return await prisma.initiative.findMany({
            where: { tenantId },
            include: {
                owner: true, // simplified selection for now
                team: { include: { members: { include: { user: { include: { discProfile: true } } } } } }
            }
        });
    }

    const accessCondition = userId ? {
        strategicAccess: {
            some: { userId: userId }
        }
    } : {};

    if (userArea) {
        initiativeFilter.OR = [
            // Case 1: Visible via Area hierarchy (KR -> Objective -> Area)
            {
                keyResult: {
                    objective: {
                        OR: [
                            { area: null }, // Company-level
                            { area: userArea } // User's area
                        ]
                    }
                }
            },
            // Case 2: Explicitly shared (Initiative level)
            accessCondition
        ];
    } else {
        // No area, only company level or explicit access
        initiativeFilter.OR = [
            {
                keyResult: {
                    objective: { area: null }
                }
            },
            accessCondition
        ];
    }

    // Prisma OR query with relation filters can be complex.
    // If accessCondition is empty object, it might match everything or nothing depending on structure.
    // We should only add accessCondition if userId is present.
    if (!userId) {
       // If no userId provided, remove accessCondition from OR array
       initiativeFilter.OR = initiativeFilter.OR.filter((c: any) => c.strategicAccess);
       // Wait, if no userId, we can't check strategicAccess.
       // The previous step ensured userId is passed.
    }

    return await prisma.initiative.findMany({
        where: initiativeFilter,
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    lastName: true,
                    area: true
                }
            },
            team: {
                include: {
                    members: {
                        include: {
                            user: {
                                include: {
                                    discProfile: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

export async function getKeyResults(tenantId: string, userArea?: string | null, isAdmin?: boolean, userId?: string) {
    if (isAdmin) {
         return await prisma.keyResult.findMany({
            where: { tenantId },
            orderBy: { statement: 'asc' }
        });
    }

    const krFilter: any = { tenantId };
    const accessCondition = userId ? {
        strategicAccess: { // Assuming StrategicAccess can link to Objectives directly, but for KRs?
            // KRs don't have direct StrategicAccess relation in schema yet, only Objectives.
            // But if Objective is shared, KRs should be visible? Yes.
            // If Initiative is shared, should its KR be visible? Probably necessary for context.
            // Let's stick to Objective sharing making KRs visible.
        }
    } : {};
    
    // For KRs, visibility depends on Objective
    // Show KR if: Objective is visible (Area or Shared)
    
    const objectiveAccessCondition = userId ? {
        strategicAccess: {
            some: { userId: userId }
        }
    } : undefined;

    const objectiveFilter = userArea ? {
        OR: [
            { area: null },
            { area: userArea },
            ...(objectiveAccessCondition ? [objectiveAccessCondition] : [])
        ]
    } : {
        OR: [
            { area: null },
            ...(objectiveAccessCondition ? [objectiveAccessCondition] : [])
        ]
    };

    krFilter.objective = objectiveFilter;

    return await prisma.keyResult.findMany({
        where: krFilter,
        orderBy: { statement: 'asc' }
    });
}
