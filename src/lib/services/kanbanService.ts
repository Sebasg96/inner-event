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

export async function getKanbanBoard(tenantId: string) {
    return await prisma.initiative.findMany({
        where: { tenantId },
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

export async function getKeyResults(tenantId: string) {
    return await prisma.keyResult.findMany({
        where: { tenantId },
        orderBy: { statement: 'asc' }
    });
}
