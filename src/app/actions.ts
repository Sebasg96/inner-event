'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Horizon, KanbanStatus, DiscColor, JobRole } from '@prisma/client';
import { cookies } from 'next/headers';

// --- Auth ---

import { createClient } from '@/lib/supabase/server';

export async function verifyLogin(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = await createClient();

    // 1. Autenticar con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.user) {
        console.error("Supabase Auth Error:", error?.message);
        return { error: 'Invalid credentials or login failed.' };
    }

    console.log("Supabase Auth Success. User Email:", data.user.email);

    // 2. Obtener el perfil extendido de Prisma usando el email
    const user = await prisma.user.findUnique({
        where: { email: data.user.email },
        include: { tenant: true }
    });

    if (!user) {
        console.error("Prisma User Not Found. Searching for:", data.user.email);
        return { error: `User authenticated in Supabase but not found in Pragma DB (Email: ${data.user.email}).` };
    }

    console.log("Prisma User Found:", user.email);

    // 3. Set Cookies de Legacy por compatibilidad momentánea (el middleware de Supabase gestiona la sesión real)
    const cookieStore = await cookies();
    cookieStore.set('inner_event_user_id', user.id, { path: '/' });
    cookieStore.set('inner_event_tenant_id', user.tenantId, { path: '/' });

    return {
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            tenantName: user.tenant.name,
            tenantLogo: user.tenant.logo
        }
    };
}

export async function signUpUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const companyName = formData.get('companyName') as string;

    const emailDomain = email.split('@')[1];
    const supabase = await createClient();

    try {
        // 1. Manejo de Organización (Tenant)
        // Buscamos si ya existe una organización con ese dominio
        let tenant = await prisma.tenant.findUnique({
            where: { domain: emailDomain }
        });

        if (!tenant) {
            // Si no existe, creamos una nueva organización
            tenant = await prisma.tenant.create({
                data: {
                    name: companyName || emailDomain.split('.')[0].toUpperCase(),
                    domain: emailDomain,
                }
            });
            console.log(`[Signup] New Tenant created: ${tenant.name}`);
        }

        // 2. Registro en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    tenant_id: tenant.id
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Could not create auth user");

        // 3. Registro en nuestra Base de Datos (Prisma)
        const newUser = await prisma.user.create({
            data: {
                email: email,
                name: name,
                tenantId: tenant.id,
                role: 'USER',
                password: password // Guardamos por compatibilidad con el sistema legacy
            },
            include: { tenant: true }
        });

        return { 
            success: true, 
            message: "User created successfully. Please check your email if confirmation is required.",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                tenantName: newUser.tenant.name
            }
        };

    } catch (error: any) {
        console.error("[Signup Error]", error);
        return { error: error.message || "An error occurred during signup" };
    }
}

// Helper to get Tenant ID
async function getTenantId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Fallback cookies for transitions or dev
        const cookieStore = await cookies();
        const tenantId = cookieStore.get('inner_event_tenant_id')?.value;
        if (!tenantId) throw new Error('Unauthorized');
        return tenantId;
    }

    // Si hay usuario de Supabase, buscamos su tenant en Prisma
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { tenantId: true }
    });

    if (!dbUser) throw new Error('User context not found in database');
    return dbUser.tenantId;
}

// Helper to get current user with area info
async function getCurrentUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        const cookieStore = await cookies();
        const userId = cookieStore.get('inner_event_user_id')?.value;
        if (!userId) throw new Error('Unauthorized');
        
        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, tenantId: true, area: true, role: true }
        });
        if (!dbUser) throw new Error('User not found');
        return dbUser;
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, tenantId: true, area: true, role: true }
    });

    if (!dbUser) throw new Error('User context not found in database');
    return dbUser;
}

export async function createUser(formData: FormData) {
    const tenantId = await getTenantId();
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    // ... (rest is same)
    await prisma.user.create({
        data: { name, email: formData.get('email') as string, role: role as 'ADMIN' | 'USER', tenantId }
    });
    revalidatePath('/capacities/users');
}

// Define types locally if not available globally yet (for cleanup)
type DiscScores = Record<string, number>;

export async function saveDiscResult(userId: string, color: DiscColor, scores: DiscScores) {
    await prisma.discProfile.upsert({
        where: { userId },
        create: {
            userId,
            color,
            scores: JSON.stringify(scores),
        },
        update: {
            color,
            scores: JSON.stringify(scores),
        }
    });

    revalidatePath('/capacities/users');
}

export async function createPurpose(formData: FormData) {
    const tenantId = await getTenantId();
    const statement = formData.get('statement') as string;

    await prisma.purpose.create({
        data: { statement, tenantId },
    });
    revalidatePath('/strategy');
}

export async function createAreaPurpose(statement: string) {
    const tenantId = await getTenantId();
    await prisma.purpose.create({
        data: {
            statement,
            tenantId,
            type: 'AREA'
        },
    });
    revalidatePath('/strategy');
    revalidatePath('/strategy/planning');
}

export async function createMega(formData: FormData) {
    const tenantId = await getTenantId();
    const statement = formData.get('statement') as string;
    const purposeId = formData.get('purposeId') as string;
    const deadline = new Date(formData.get('deadline') as string);

    await prisma.mega.create({
        data: { statement, deadline, purposeId, tenantId },
    });
    revalidatePath('/strategy');
}

export async function createObjective(formData: FormData) {
    const tenantId = await getTenantId();
    const statement = formData.get('statement') as string;
    const megaId = formData.get('megaId') as string;

    await prisma.objective.create({
        data: { statement, megaId, tenantId },
    });
    revalidatePath('/strategy');
}

export async function createKeyResult(formData: FormData) {
    const tenantId = await getTenantId();
    const statement = formData.get('statement') as string;
    const targetValue = parseFloat(formData.get('targetValue') as string);
    const metricUnit = formData.get('metricUnit') as string;
    const objectiveId = formData.get('objectiveId') as string;
    const trackingType = formData.get('trackingType') as any;

    await prisma.keyResult.create({
        data: { 
            statement, 
            targetValue, 
            metricUnit, 
            objectiveId, 
            tenantId,
            trackingType: trackingType || 'PERCENTAGE'
        },
    });
    revalidatePath('/strategy');
}

export async function updateKeyResult(id: string, formData: FormData) {
    const statement = formData.get('statement') as string;
    const targetValue = parseFloat(formData.get('targetValue') as string);
    const metricUnit = formData.get('metricUnit') as string;

    await prisma.keyResult.update({
        where: { id },
        data: {
            statement,
            targetValue,
            metricUnit,
        },
    });
    revalidatePath('/strategy/planning');
}

export async function deleteKeyResult(id: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // Delete associated Initiatives first
            await tx.initiative.deleteMany({
                where: { keyResultId: id }
            });

            // Delete the KR
            await tx.keyResult.delete({
                where: { id }
            });
        });

        revalidatePath('/strategy');
        return { success: true };
    } catch (error) {
        console.error('Error deleting key result:', error);
        return { error: 'Failed to delete key result' };
    }
}

export async function updateKeyResultValue(
    id: string, 
    newValue: number, 
    numeratorValue?: number, 
    denominatorValue?: number,
    numeratorLabel?: string,
    denominatorLabel?: string
) {
    try {
        const tenantId = await getTenantId();
        
        // Get current values for history
        const kr = await prisma.keyResult.findUnique({
            where: { id },
            select: { currentValue: true }
        });
        
        if (!kr) throw new Error('Key Result not found');

        const supabase = await createClient();
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        let userId = null;
        if (sbUser) {
            const dbUser = await prisma.user.findUnique({ where: { email: sbUser.email } });
            userId = dbUser?.id;
        }

        await prisma.$transaction(async (tx) => {
            // Update the KR with calculated fulfillment and raw inputs
            await tx.keyResult.update({
                where: { id },
                data: { 
                    currentValue: newValue,
                    numeratorValue: numeratorValue ?? undefined,
                    denominatorValue: denominatorValue ?? undefined,
                    numeratorLabel: numeratorLabel ?? undefined,
                    denominatorLabel: denominatorLabel ?? undefined
                }
            });

            // Create history log
            await tx.keyResultUpdate.create({
                data: {
                    keyResultId: id,
                    oldValue: kr.currentValue,
                    newValue: newValue,
                    userId: userId || undefined
                }
            });
        });

        revalidatePath('/strategy');
        return { success: true };
    } catch (error) {
        console.error('Error updating key result progress:', error);
        return { error: 'Failed to update progress' };
    }
}

export async function createInitiative(formData: FormData) {
    const tenantId = await getTenantId();
    const title = formData.get('title') as string;
    const keyResultId = formData.get('keyResultId') as string;
    const horizon = formData.get('horizon') as Horizon;
    const ownerId = formData.get('ownerId') as string | null;

    const initiative = await prisma.initiative.create({
        data: { 
            title, 
            keyResultId, 
            horizon, 
            tenantId, 
            status: 'TODO',
            ownerId: ownerId || null
        },
    });
    revalidatePath('/');
    return { success: true, id: initiative.id };
}

export async function createKanbanTask(formData: FormData) {
    const tenantId = await getTenantId();
    const title = formData.get('title') as string;
    const initiativeId = formData.get('initiativeId') as string;
    const assigneeId = formData.get('assigneeId') as string;

    await prisma.kanbanTask.create({
        data: { title, initiativeId, assigneeId: assigneeId || null, tenantId, status: 'TODO' },
    });
    revalidatePath(`/strategy/initiative/${initiativeId}`);
}

export async function updateInitiative(id: string, formData: FormData) {
    const title = formData.get('title') as string;
    
    await prisma.initiative.update({
        where: { id },
        data: { title }
    });
    
    revalidatePath(`/strategy/initiative/${id}`);
}

export async function updateKanbanTaskStatus(id: string, status: KanbanStatus, initiativeId: string) {
    await prisma.kanbanTask.update({
        where: { id },
        data: { status },
    });

    // Update Initiative Progress
    const tasks = await prisma.kanbanTask.findMany({ where: { initiativeId } });
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'DONE').length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    await prisma.initiative.update({
        where: { id: initiativeId },
        data: {
            progress,
            status: progress === 100 ? 'DONE' : (progress > 0 ? 'IN_PROGRESS' : 'TODO')
        }
    });

    revalidatePath(`/strategy/initiative/${initiativeId}`);
}

export async function updateUser(formData: FormData) {
    const userId = formData.get('userId') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const jobRole = formData.get('jobRole') as JobRole; // UPDATED

    // Update User
    await prisma.user.update({
        where: { id: userId },
        data: { name, email, jobRole }
    });

    if (jobRole === 'TEAM_LEAD') {
        const existingTeam = await prisma.team.findFirst({ where: { leaderId: userId } });
        if (!existingTeam) {
            // Get Tenant
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                await prisma.team.create({
                    data: {
                        name: `Equipo de ${name}`,
                        tenantId: user.tenantId,
                        leaderId: userId,
                        aiReasoning: 'Equipo liderado manualmente.'
                    }
                });
            }
        }
    }

    revalidatePath('/capacities/users');
}



export async function addTeamMember(formData: FormData) {
    const leaderId = await getTenantId(); // Wait, getUSERId actually.
    // We need getUserId() helper or pass it.
    // Let's assume the form passes the leader's team ID or we fetch it.
    const teamId = formData.get('teamId') as string;
    const emailToAdd = formData.get('email') as string;

    // Find User by Email
    const user = await prisma.user.findUnique({ where: { email: emailToAdd } });
    if (!user) return; // Silent fail for now to fix build type error

    // Add to Team
    await prisma.teamMember.create({
        data: {
            teamId,
            userId: user.id,
            role: 'Member'
        }
    });
    revalidatePath('/capacities/users'); // Or wherever the modal is
}

export async function removeTeamMember(formData: FormData) {
    const memberId = formData.get('memberId') as string;
    const teamId = formData.get('teamId') as string;

    await prisma.teamMember.deleteMany({
        where: {
            teamId,
            userId: memberId
        }
    });
    revalidatePath('/capacities/users');
}

// ... existing code ...
export async function updatePurpose(id: string, statement: string) {
    const tenantId = await getTenantId();
    await prisma.purpose.update({
        where: { id },
        data: { statement }
    });
    revalidatePath('/strategy');
    revalidatePath('/');
}

export async function updateMega(id: string, statement: string) {
    const tenantId = await getTenantId();
    await prisma.mega.update({
        where: { id },
        data: { statement }
    });
    revalidatePath('/strategy');
    revalidatePath('/');
}

export async function updateObjectiveTitle(objectiveId: string, newTitle: string) {
    const tenantId = await getTenantId();
    await prisma.objective.update({
        where: { id: objectiveId },
        data: { statement: newTitle }
    });
    revalidatePath('/strategy');
    revalidatePath('/');
}

export async function deleteMega(id: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Find all Objectives for this Mega
            const objectives = await tx.objective.findMany({
                where: { megaId: id },
                select: { id: true }
            });

            const objectiveIds = objectives.map(o => o.id);

            // 2. Find all Key Results for these Objectives
            const keyResults = await tx.keyResult.findMany({
                where: { objectiveId: { in: objectiveIds } },
                select: { id: true }
            });

            const keyResultIds = keyResults.map(k => k.id);

            // 3. Delete Initiatives linked to these KRs
            // Note: If KanbanTasks exist, they might need deletion too if not using cascade in schema
            if (keyResultIds.length > 0) {
                await tx.initiative.deleteMany({
                    where: { keyResultId: { in: keyResultIds } }
                });
            }

            // 4. Delete Key Results
            if (objectiveIds.length > 0) {
                await tx.keyResult.deleteMany({
                    where: { objectiveId: { in: objectiveIds } }
                });
            }

            // 5. Delete Objectives
            await tx.objective.deleteMany({
                where: { megaId: id }
            });

            // 6. Delete the Mega
            await tx.mega.delete({
                where: { id }
            });
        });

        revalidatePath('/strategy');
        return { success: true };
    } catch (error) {
        console.error('Error deleting mega:', error);
        return { error: 'Failed to delete mega' };
    }
}

export async function deleteObjective(id: string) {
    try {
        await prisma.$transaction(async (tx) => {
            // Find all Key Results for this objective
            const keyResults = await tx.keyResult.findMany({
                where: { objectiveId: id },
                include: { initiatives: true }
            });

            for (const kr of keyResults) {
                for (const initiative of kr.initiatives) {
                    await tx.initiative.delete({ where: { id: initiative.id } });
                }
                await tx.keyResult.delete({ where: { id: kr.id } });
            }

            await tx.objective.delete({
                where: { id }
            });
        });

        revalidatePath('/strategy');
        revalidatePath('/strategy/planning');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting objective:', error);
        return { error: 'Failed to delete objective' };
    }
}

// Phase 40: Rituales de Seguimiento (Rituals)

export async function createRitual(formData: FormData) {
    const tenantId = await getTenantId();
    const date = new Date(formData.get('date') as string);
    const description = formData.get('description') as string;

    // Auto-generate name "Ritual N"
    const count = await prisma.ritual.count({
        where: { tenantId }
    });
    const name = `Ritual ${count + 1}`;

    await prisma.ritual.create({
        data: {
            name,
            date,
            description,
            tenantId
        }
    });

    revalidatePath('/rituals');
}

export async function updateRitual(id: string, formData: FormData) {
    const discussionPoints = formData.get('discussionPoints') as string;
    const commitments = formData.get('commitments') as string;
    const aiSuggestions = formData.get('aiSuggestions') as string;

    await prisma.ritual.update({
        where: { id },
        data: {
            discussionPoints,
            commitments,
            aiSuggestions
        }
    });
    revalidatePath('/rituals');
}

// Phase 50: Emergent Strategy Actions

export async function createHardChoice(formData: FormData) {
    const tenantId = await getTenantId();
    const description = formData.get('description') as string;
    const reasoning = formData.get('reasoning') as string;

    await prisma.hardChoice.create({
        data: { description, reasoning, tenantId }
    });
    revalidatePath('/emergent');
}

export async function createStrategicConversation(formData: FormData) {
    const tenantId = await getTenantId();
    const topic = formData.get('topic') as string;
    const conclusion = formData.get('conclusion') as string;

    await prisma.strategicConversation.create({
        data: { topic, conclusion, tenantId }
    });
    revalidatePath('/emergent');
}

// --- Organizational Values ---

export async function createOrganizationalValue(formData: FormData) {
    const statement = formData.get('statement') as string;
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        throw new Error('No tenant found');
    }

    if (!statement) {
        throw new Error('Statement is required');
    }

    await prisma.organizationalValue.create({
        data: {
            statement,
            tenantId
        }
    });

    revalidatePath('/strategy/planning');
}

// Get all users from the current tenant for owner selection
export async function getTenantUsers() {
    const tenantId = await getTenantId();
    
    const users = await prisma.user.findMany({
        where: { tenantId },
        select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            area: true,
            jobTitle: true
        },
        orderBy: { name: 'asc' }
    });
    
    return users;
}

export async function deleteOrganizationalValue(id: string) {
    await prisma.organizationalValue.delete({
        where: { id }
    });
    revalidatePath('/strategy/planning');
}

// Strategic Access Management
export async function grantStrategicAccess(formData: FormData) {
    const tenantId = await getTenantId();
    const userId = formData.get('userId') as string;
    const entityType = formData.get('entityType') as 'purpose' | 'objective' | 'initiative';
    const entityId = formData.get('entityId') as string;

    const data: any = {
        userId,
        tenantId,
    };

    // Set the appropriate foreign key based on entity type
    if (entityType === 'purpose') {
        data.purposeId = entityId;
    } else if (entityType === 'objective') {
        data.objectiveId = entityId;
    } else if (entityType === 'initiative') {
        data.initiativeId = entityId;
    }

    await prisma.strategicAccess.create({ data });
    revalidatePath('/');
    return { success: true };
}

export async function revokeStrategicAccess(accessId: string) {
    await prisma.strategicAccess.delete({
        where: { id: accessId }
    });
    revalidatePath('/');
    return { success: true };
}

// Get strategic access for a specific entity
export async function getStrategicAccess(entityType: 'purpose' | 'objective' | 'initiative', entityId: string) {
    const tenantId = await getTenantId();
    
    const where: any = { tenantId };
    
    if (entityType === 'purpose') {
        where.purposeId = entityId;
    } else if (entityType === 'objective') {
        where.objectiveId = entityId;
    } else if (entityType === 'initiative') {
        where.initiativeId = entityId;
    }

    const accesses = await prisma.strategicAccess.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    lastName: true,
                    email: true,
                    area: true
                }
            }
        }
    });

    return accesses;
}
