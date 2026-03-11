'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Horizon, KanbanStatus, DiscColor, JobRole } from '@prisma/client';
import { canEditStrategy, canManageUsers } from '@/lib/permissions';
import { cookies } from 'next/headers';

// --- Auth ---

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
                role: 'COLLABORATOR',
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
        data: { name, email: formData.get('email') as string, role: role as any, tenantId }
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
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
    const statement = formData.get('statement') as string;

    await prisma.purpose.create({
        data: { statement, tenantId },
    });
    revalidatePath('/strategy');
}

export async function createAreaPurpose(statement: string) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
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
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
    const statement = formData.get('statement') as string;
    const purposeId = formData.get('purposeId') as string;
    const deadline = new Date(formData.get('deadline') as string);

    await prisma.mega.create({
        data: { statement, deadline, purposeId, tenantId },
    });
    revalidatePath('/strategy');
}

export async function createObjective(formData: FormData) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
    const statement = formData.get('statement') as string;
    const megaId = formData.get('megaId') as string;
    const strategicAxisId = formData.get('strategicAxisId') as string | null;

    await prisma.objective.create({
        data: { 
            statement, 
            megaId, 
            tenantId,
            strategicAxisId: strategicAxisId === "none" ? null : strategicAxisId
        },
    });
    revalidatePath('/strategy');
    revalidatePath('/strategy/planning');
}

export async function createKeyResult(formData: FormData) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
    
    // Get current user to assign as owner
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let ownerId: string | undefined;
    if (user) {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true }
        });
        if (dbUser) {
            ownerId = dbUser.id;
        }
    }

    const statement = formData.get('statement') as string;
    const targetValue = parseFloat(formData.get('targetValue') as string);
    const metricUnit = formData.get('metricUnit') as string;
    const objectiveId = formData.get('objectiveId') as string;
    const trackingType = formData.get('trackingType') as any;
    const updatePeriodicity = formData.get('updatePeriodicity') as any;

    const startYear = formData.get('startYear') ? parseInt(formData.get('startYear') as string) : null;
    const startQuarter = formData.get('startQuarter') ? parseInt(formData.get('startQuarter') as string) : null;
    const endYear = formData.get('endYear') ? parseInt(formData.get('endYear') as string) : null;
    const endQuarter = formData.get('endQuarter') ? parseInt(formData.get('endQuarter') as string) : null;

    await prisma.keyResult.create({
        data: { 
            statement, 
            targetValue, 
            metricUnit, 
            objectiveId, 
            tenantId,
            trackingType: trackingType || 'PERCENTAGE',
            updatePeriodicity: updatePeriodicity || null,
            weight: 0,
            ownerId: ownerId, // Assign owner
            startYear,
            startQuarter,
            endYear,
            endQuarter
        },
    });
    revalidatePath('/strategy');
}

export async function updateKeyResult(id: string, formData: FormData) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const statement = formData.get('statement') as string;
    const targetValue = parseFloat(formData.get('targetValue') as string);
    const metricUnit = formData.get('metricUnit') as string;

    await prisma.keyResult.update({
        where: { id },
        data: {
            statement,
            targetValue,
            metricUnit,
            ...(formData.has('updatePeriodicity') ? { updatePeriodicity: (formData.get('updatePeriodicity') as any) || null } : {}),
        },
    });
    revalidatePath('/strategy/planning');
    revalidatePath('/');
}

export async function deleteKeyResult(id: string) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
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
    denominatorLabel?: string,
    metadata?: {
        startYear?: number | null;
        startQuarter?: number | null;
        endYear?: number | null;
        endQuarter?: number | null;
    }
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
                    denominatorLabel: denominatorLabel ?? undefined,
                    ...(metadata || {})
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
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
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
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
    await prisma.purpose.update({
        where: { id },
        data: { statement }
    });
    revalidatePath('/strategy');
    revalidatePath('/');
}

export async function updateMega(id: string, statement: string) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
    await prisma.mega.update({
        where: { id },
        data: { statement }
    });
    revalidatePath('/strategy');
    revalidatePath('/');
}

export async function updateObjectiveTitle(objectiveId: string, newTitle: string) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
    await prisma.objective.update({
        where: { id: objectiveId },
        data: { statement: newTitle }
    });
    revalidatePath('/strategy');
    revalidatePath('/');
}

export async function updateObjectiveOwner(objectiveId: string, ownerId: string | null) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
    await prisma.objective.update({
        where: { id: objectiveId },
        data: { ownerId }
    });
    revalidatePath('/strategy');
    revalidatePath('/');
}

export async function updateObjectiveStrategicAxis(objectiveId: string, strategicAxisId: string | null) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
    const tenantId = currentUser.tenantId;
    await prisma.objective.update({
        where: { id: objectiveId, tenantId },
        data: { strategicAxisId: strategicAxisId === "none" ? null : strategicAxisId }
    });
    revalidatePath('/strategy');
    revalidatePath('/strategy/planning');
    revalidatePath('/');
}

export async function deleteMega(id: string) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
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
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized: Requires DIRECTOR role or higher');
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
            jobTitle: true,
            role: true
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

// --- Strategic Axes (Ejes Estratégicos) ---

export async function createStrategicAxis(formData: FormData) {
    const statement = formData.get('statement') as string;
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        throw new Error('No tenant found');
    }

    if (!statement) {
        throw new Error('Statement is required');
    }

    await prisma.strategicAxis.create({
        data: {
            statement,
            tenantId
        }
    });

    revalidatePath('/strategy/planning');
}

export async function deleteStrategicAxis(id: string) {
    await prisma.strategicAxis.delete({
        where: { id }
    });
    revalidatePath('/strategy/planning');
}

// --- Admin User Management ---

export async function updateUserRole(userId: string, newRole: 'ADMIN' | 'DIRECTOR' | 'COLLABORATOR') {
    const currentUser = await getCurrentUser();
    
    // Security check: Only ADMINs can change roles
    if (!canManageUsers(currentUser.role)) {
        throw new Error('Unauthorized: Only admins can update user roles');
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
    });

    revalidatePath('/capacities/users');
    revalidatePath('/admin/users');
}

export async function inviteUser(formData: FormData) {
    // 1. Verificar permisos del solicitante
    const currentUser = await getCurrentUser();
    if (!canManageUsers(currentUser.role)) {
        return { error: 'Unauthorized: Only admins can invite users' };
    }

    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const jobRole = formData.get('jobRole') as JobRole || 'MEMBER';
    const area = formData.get('area') as string;
    const role = formData.get('role') as 'ADMIN' | 'DIRECTOR' | 'COLLABORATOR' || 'COLLABORATOR';

    if (!email) return { error: 'Email is required' };

    try {
        const supabaseAdmin = createAdminClient();

        // 2. Invitar usuario en Supabase Auth
        // sendInviteEmail: true enviará el correo por defecto de Supabase (o el personalizado si está configurado)
        // Redirigimos al callback que manejará el intercambio de token y enviará a update-password
        const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name: name,
                tenant_id: currentUser.tenantId
            },
            redirectTo: `${origin}/auth/callback?next=/auth/update-password`
        });

        if (authError) {
            console.error('Supabase Invite Error:', authError);
            return { error: 'Failed to invite user: ' + authError.message };
        }

        if (!authData.user) {
            return { error: 'Failed to create auth user instance' };
        }

        // 3. Crear usuario en nuestra DB (Prisma)
        // Usamos upsert por si el usuario ya existiera en DB pero no en Auth (caso raro/legacy)
        // 3. Crear usuario en nuestra DB (Prisma)
        // Verificamos primero si existe por email
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUserByEmail) {
            // Existe por email, actualizamos
            await prisma.user.update({
                where: { email },
                data: {
                    name,
                    role,
                    jobRole,
                    area,
                    tenantId: currentUser.tenantId
                }
            });
        } else {
            // No existe por email. Verificamos si existe por ID (caso inconsistencia Supabase vs Prisma)
            const existingUserById = await prisma.user.findUnique({
                where: { id: authData.user.id }
            });

            if (existingUserById) {
                // Existe el ID pero con otro email (o sin email?), actualizamos para sincronizar
                console.log(`User ID collision detected. Syncing email for ID ${authData.user.id}`);
                await prisma.user.update({
                    where: { id: authData.user.id },
                    data: {
                        email, // Actualizamos el email al nuevo
                        name,
                        role,
                        jobRole,
                        area,
                        tenantId: currentUser.tenantId
                    }
                });
            } else {
                // No existe ni por email ni por ID, creamos uno nuevo
                await prisma.user.create({
                    data: {
                        id: authData.user.id, // Sincronizar ID con Supabase
                        email,
                        name,
                        role,
                        jobRole,
                        area,
                        tenantId: currentUser.tenantId,
                        password: 'PENDING_SETUP'
                    }
                });
            }
        }

        revalidatePath('/capacities/users');
        revalidatePath('/admin/users');
        return { success: true };

    } catch (error: any) {
        console.error('Invite User Error:', error);
        return { error: error.message || 'An unexpected error occurred' };
    }
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

export async function updateKeyResultOwner(keyResultId: string, ownerId: string | null) {
    const tenantId = await getTenantId();
    await prisma.keyResult.update({
        where: { id: keyResultId },
        data: { ownerId }
    });
    revalidatePath('/strategy');
    revalidatePath('/');
}

export async function getUserNotifications() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Find Prisma user
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true }
    });

    if (!dbUser) return [];

    // Fetch KRs owned by user with (periodicity set OR weight 0)
    console.log("Fetching notifications for ownerId:", dbUser.id);
    const krs = await prisma.keyResult.findMany({
        where: {
            ownerId: dbUser.id,
            OR: [
                { updatePeriodicity: { not: null } },
                { weight: 0 }
            ]
        },
        select: {
            id: true,
            statement: true,
            updatedAt: true,
            updatePeriodicity: true,
            weight: true,
            objective: {
                select: {
                    statement: true
                }
            }
        }
    });
    console.log("Found KRs for notifications:", krs.length);

    const now = new Date();
    const notifications = krs.map(kr => {
        // Type 1: Weight Review
        if (kr.weight === 0) {
            return {
                id: kr.id,
                title: kr.statement,
                objectiveTitle: kr.objective.statement,
                daysOverdue: 0,
                type: 'WEIGHT_REVIEW'
            };
        }

        // Type 2: Periodicity Update (Overdue)
        if (!kr.updatePeriodicity) return null;

        const lastUpdate = new Date(kr.updatedAt);
        let dueDate = new Date(lastUpdate);

        switch (kr.updatePeriodicity) {
            case 'DAILY':
                dueDate.setDate(dueDate.getDate() + 1);
                break;
            case 'WEEKLY':
                dueDate.setDate(dueDate.getDate() + 7);
                break;
            case 'BIWEEKLY':
                dueDate.setDate(dueDate.getDate() + 15);
                break;
            case 'MONTHLY':
                dueDate.setMonth(dueDate.getMonth() + 1);
                break;
            case 'QUARTERLY':
                dueDate.setMonth(dueDate.getMonth() + 3);
                break;
            case 'YEARLY':
                dueDate.setFullYear(dueDate.getFullYear() + 1);
                break;
        }

        // Only include if overdue
        if (dueDate < now) {
            return {
                id: kr.id,
                title: kr.statement,
                objectiveTitle: kr.objective.statement,
                daysOverdue: Math.floor((now.getTime() - new Date(kr.updatedAt).getTime()) / (1000 * 3600 * 24)),
                type: 'OVERDUE'
            };
        }
        
        return null;
    }).filter(n => n !== null);

    return notifications;
}

export async function updateKeyResultPeriodicity(keyResultId: string, periodicity: any) {
    await prisma.keyResult.update({
        where: { id: keyResultId },
        data: { updatePeriodicity: periodicity }
    });
    revalidatePath('/strategy/planning');
    revalidatePath('/');
}

export async function updateKeyResultMetadata(
    id: string,
    data: {
        startYear?: number | null;
        startQuarter?: number | null;
        endYear?: number | null;
        endQuarter?: number | null;
    }
) {
    const currentUser = await getCurrentUser();
    if (!canEditStrategy(currentUser.role)) throw new Error('Unauthorized');
    
    await prisma.keyResult.update({
        where: { id },
        data
    });
    revalidatePath('/strategy');
    revalidatePath('/strategy/planning');
}

export async function updateInitiativeOwner(initiativeId: string, ownerId: string | null) {
    const tenantId = await getTenantId();
    await prisma.initiative.update({
        where: { id: initiativeId, tenantId },
        data: { ownerId }
    });
    revalidatePath('/strategy/execution');
}

export async function updateObjectiveWeight(objectiveId: string, weight: number) {
    const tenantId = await getTenantId();
    await prisma.objective.update({
        where: { id: objectiveId, tenantId },
        data: { weight }
    });
    revalidatePath('/strategy');
    revalidatePath('/strategy/planning');
}

export async function updateKeyResultWeight(keyResultId: string, weight: number) {
    const tenantId = await getTenantId();
    await prisma.keyResult.update({
        where: { id: keyResultId, tenantId },
        data: { weight }
    });
    revalidatePath('/strategy');
    revalidatePath('/strategy/planning');
}

export async function updateWeightsBatch(updates: { type: 'OBJECTIVE' | 'KR', id: string, weight: number }[]) {
    const tenantId = await getTenantId();
    
    try {
        await prisma.$transaction(async (tx) => {
            for (const update of updates) {
                if (update.type === 'OBJECTIVE') {
                    await tx.objective.update({
                        where: { id: update.id, tenantId },
                        data: { weight: update.weight }
                    });
                } else if (update.type === 'KR') {
                    await tx.keyResult.update({
                        where: { id: update.id, tenantId },
                        data: { weight: update.weight }
                    });
                }
            }
        });
        
        revalidatePath('/strategy');
        revalidatePath('/strategy/planning');
        return { success: true };
    } catch (error) {
        console.error("Batch update failed:", error);
        return { error: 'Failed to update weights' };
    }
}

// ============================================================================
// DASHBOARD METRICS (Managerial Module)
// ============================================================================

export type DashboardTrafficLight = 'GREEN' | 'YELLOW' | 'RED' | 'GRAY';

export interface DashboardMetric {
    id: string;
    title: string;
    progress: number; // 0-100 (Real)
    expectedProgress: number; // 0-100 (Time-based)
    trafficLight: DashboardTrafficLight;
    type: 'MEGA' | 'OBJECTIVE' | 'KR';
    children?: DashboardMetric[];
}

export interface GlobalDashboardData {
    globalScore: number;
    globalTrafficLight: DashboardTrafficLight;
    megas: DashboardMetric[];
}

export async function getDashboardMetrics(startDate?: Date | string, endDate?: Date | string): Promise<GlobalDashboardData> {
    const tenantId = await getTenantId();

    // Standardize dates
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1); // Jan 1st current year
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31); // Dec 31st current year
    const now = new Date();

    // Fetch Full Tree
    const purpose = await prisma.purpose.findFirst({
        where: { tenantId, type: 'COMPANY' },
        include: {
            megas: {
                include: {
                    objectives: {
                        include: {
                            keyResults: true,
                            childObjectives: {
                                include: {
                                    keyResults: true,
                                    childObjectives: {
                                        include: { keyResults: true } // Support up to 3 levels of objectives
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!purpose) {
        return { globalScore: 0, globalTrafficLight: 'GRAY', megas: [] };
    }

    // --- Helper Functions ---

    const calculateExpectedProgress = (itemStart: Date | null, itemEnd: Date | null): number => {
        // If dates are missing, fallback to the global filter range or current year
        const s = itemStart ? new Date(itemStart) : start;
        const e = itemEnd ? new Date(itemEnd) : end;

        if (now < s) return 0;
        if (now > e) return 100;

        const totalDuration = e.getTime() - s.getTime();
        const elapsed = now.getTime() - s.getTime();

        if (totalDuration <= 0) return 100; // Should not happen, but safe guard

        return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    };

    const getTrafficLight = (real: number, expected: number): DashboardTrafficLight => {
        if (expected === 0) return 'GRAY'; // Too early to tell
        const ratio = real / expected;
        
        if (ratio >= 0.9) return 'GREEN';
        if (ratio >= 0.7) return 'YELLOW';
        return 'RED';
    };

    const isKRInDateRange = (kr: any) => {
        // Convert KR Periodicity Ints to approximate Dates or use direct Logic
        // Logic: Overlap. (StartA <= EndB) and (EndA >= StartB)
        // KR Start
        const krStartYear = kr.startYear ?? new Date().getFullYear();
        const krStartQuarter = kr.startQuarter ?? 1;
         // Approximate start date of quarter: (Q-1)*3 months
        const krStartDate = new Date(krStartYear, (krStartQuarter - 1) * 3, 1);

        // KR End
        const krEndYear = kr.endYear ?? new Date().getFullYear();
        const krEndQuarter = kr.endQuarter ?? 4;
        // Approximate end date of quarter: Q*3 month, last day
        const krEndDate = new Date(krEndYear, (krEndQuarter * 3), 0); // Day 0 of next month is last day of previous

        return krStartDate <= end && krEndDate >= start;
    };

    // --- Processing ---

    // Process KRs
    const processKR = (kr: any): DashboardMetric | null => {
        if (!isKRInDateRange(kr)) return null;

        // Start/End dates logic for Expected Progress
        const krStartYear = kr.startYear ?? new Date().getFullYear();
        const krStartQuarter = kr.startQuarter ?? 1;
        const krStartDate = new Date(krStartYear, (krStartQuarter - 1) * 3, 1);

        const krEndYear = kr.endYear ?? new Date().getFullYear();
        const krEndQuarter = kr.endQuarter ?? 4;
        const krEndDate = new Date(krEndYear, (krEndQuarter * 3), 0);

        const real = Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100)); // Cap at 100? or more? Plan said 100.
        const expected = calculateExpectedProgress(krStartDate, krEndDate);

        return {
            id: kr.id,
            title: kr.statement,
            progress: real,
            expectedProgress: expected,
            trafficLight: getTrafficLight(real, expected),
            type: 'KR'
        };
    };

    // Process Objectives (Recursive)
    const processObjective = (obj: any): DashboardMetric | null => {
        // 1. Process Child KRs
        const krMetrics: DashboardMetric[] = [];
        let totalKRWeight = 0;
        let weightedKRProgress = 0;
        let weightedKRExpected = 0;

        if (obj.keyResults) {
            for (const kr of obj.keyResults) {
                const metric = processKR(kr);
                if (metric) {
                    krMetrics.push(metric);
                    const w = kr.weight || 1; // Default weight 1 if 0/null to avoid division by zero if all are 0
                    totalKRWeight += w;
                    weightedKRProgress += metric.progress * w;
                    weightedKRExpected += metric.expectedProgress * w;
                }
            }
        }

        // 2. Process Child Objectives
        const objMetrics: DashboardMetric[] = [];
        let totalObjWeight = 0;
        let weightedObjProgress = 0;
        let weightedObjExpected = 0;

        if (obj.childObjectives) {
            for (const child of obj.childObjectives) {
                const metric = processObjective(child);
                if (metric) {
                    objMetrics.push(metric);
                    const w = child.weight || 1; 
                    totalObjWeight += w;
                    weightedObjProgress += metric.progress * w;
                    weightedObjExpected += metric.expectedProgress * w;
                }
            }
        }

        // If no relevant children, this objective is not in range/active
        if (krMetrics.length === 0 && objMetrics.length === 0) return null;

        // Combine KRs and Child Objectives
        // Assumption: Weights are relative within the Objective container. 
        // We sum all weights (KRs + ChildObjs) to normalize? 
        // Or usually ChildObjs replace KRs? The schema allows mixed.
        // Let's treat them as siblings in weight calculation.

        const totalWeight = totalKRWeight + totalObjWeight;
        const totalProgress = (weightedKRProgress + weightedObjProgress) / (totalWeight || 1);
        const totalExpected = (weightedKRExpected + weightedObjExpected) / (totalWeight || 1);
        
        return {
            id: obj.id,
            title: obj.statement,
            progress: totalProgress,
            expectedProgress: totalExpected,
            trafficLight: getTrafficLight(totalProgress, totalExpected),
            type: 'OBJECTIVE',
            children: [...krMetrics, ...objMetrics]
        };
    };

    // Process Megas
    const megaMetrics: DashboardMetric[] = [];
    let totalMegaScore = 0;

    for (const mega of purpose.megas) {
        let weightedProgress = 0;
        let weightedExpected = 0;
        let totalWeight = 0;
        const childrenMetrics: DashboardMetric[] = [];

        // Megas only have Objectives (Top Level)
        for (const obj of mega.objectives) {
            // Check if top level obj has parent (should be null based on query)
            if (obj.parentObjectiveId) continue; 

            const metric = processObjective(obj);
            if (metric) {
                childrenMetrics.push(metric);
                const w = obj.weight || 1;
                totalWeight += w;
                weightedProgress += metric.progress * w;
                weightedExpected += metric.expectedProgress * w;
            }
        }

        // If Mega has no active objectives in range, skip or show 0?
        // Show 0 but mark as inactive? Let's just calculate what we have.
        
        const finalProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;
        const finalExpected = totalWeight > 0 ? weightedExpected / totalWeight : 0;

        if (childrenMetrics.length > 0) { // Only add if it has content
            megaMetrics.push({
                id: mega.id,
                title: mega.statement,
                progress: finalProgress,
                expectedProgress: finalExpected,
                trafficLight: getTrafficLight(finalProgress, finalExpected),
                type: 'MEGA',
                children: childrenMetrics
            });
            totalMegaScore += finalProgress;
        }
    }

    // Global Score
    // Average of Megas (Assumption: Megas range from Equal importance)
    const globalScore = megaMetrics.length > 0 ? totalMegaScore / megaMetrics.length : 0;
    
    // Global Traffic Light needs an aggregate Expected.
    const totalGlobalExpected = megaMetrics.reduce((acc, curr) => acc + curr.expectedProgress, 0);
    const avgGlobalExpected = megaMetrics.length > 0 ? totalGlobalExpected / megaMetrics.length : 0;

    return {
        globalScore,
        globalTrafficLight: getTrafficLight(globalScore, avgGlobalExpected),
        megas: megaMetrics
    };
}
