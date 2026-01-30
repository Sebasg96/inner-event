import { prisma } from '@/lib/prisma';
import StrategyDashboard from '@/components/Strategy/StrategyDashboard';
import StrategyTabs from '@/components/Strategy/StrategyTabs';
import StrategyCascade from '@/components/Strategy/StrategyCascade';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getCurrentUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        const cookieStore = await cookies();
        const userId = cookieStore.get('inner_event_user_id')?.value;
        if (!userId) return null;

        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, tenantId: true, area: true, role: true }
        });
        return dbUser;
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, tenantId: true, area: true, role: true }
    });

    return dbUser;
}

export default async function PlanningPage() {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        redirect('/login');
    }

    // Get current user for area-based filtering
    const currentUser = await getCurrentUser();
    const userArea = currentUser?.area;
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN';

    // Build objective where clause based on area and access
    const buildObjectiveWhere = (baseWhere: any = {}) => {
        if (isAdmin) return baseWhere; // Admins see everything

        // Safety check for user ID (though redirect protects this page)
        if (!currentUser?.id) return { ...baseWhere, area: null };

        const accessCondition = {
            strategicAccess: {
                some: {
                    userId: currentUser.id
                }
            }
        };

        if (userArea) {
            return {
                ...baseWhere,
                OR: [
                    { area: null }, // Company-level
                    { area: userArea }, // User's area
                    accessCondition
                ]
            };
        }

        return {
            ...baseWhere,
            OR: [
                { area: null },
                accessCondition
            ]
        };
    };

    // Fetch Purpose and full Cascade Tree (L1 -> L2 -> L3) with area filtering
    const purpose = await prisma.purpose.findFirst({
        where: { tenantId, type: 'COMPANY' }, // Always start from Company Purpose
        include: {
            megas: {
                include: {
                    objectives: {
                        where: buildObjectiveWhere({ parentObjectiveId: null }),
                        include: {
                            keyResults: {
                                include: {
                                    initiatives: {
                                        select: { id: true, progress: true, status: true, title: true }
                                    },
                                    updates: {
                                        include: { user: { select: { name: true } } },
                                        orderBy: { createdAt: 'desc' }
                                    }
                                }
                            },
                            childObjectives: { // Level 2
                                where: buildObjectiveWhere(),
                                include: {
                                    owner: true,
                                    keyResults: {
                                        include: {
                                            initiatives: { select: { id: true, progress: true, status: true, title: true } },
                                            updates: {
                                                include: { user: { select: { name: true } } },
                                                orderBy: { createdAt: 'desc' }
                                            }
                                        }
                                    },
                                    childObjectives: { // Level 3
                                        where: buildObjectiveWhere(),
                                        include: {
                                            owner: true,
                                            keyResults: {
                                                include: {
                                                    initiatives: { select: { id: true, progress: true, status: true, title: true } },
                                                    updates: {
                                                        include: { user: { select: { name: true } } },
                                                        orderBy: { createdAt: 'desc' }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const areaPurpose = await prisma.purpose.findFirst({
        where: {
            tenantId,
            type: 'AREA',
            ...(isAdmin ? {} : { area: userArea }) // Filter area purpose by user's area unless admin
        },
        include: { megas: true }
    });

    const analysisData = {
        marketShare: 45,
        growthRate: 12,
        customerSatisfaction: 88,
        operationalEfficiency: 92
    };

    const organizationalValues = await prisma.organizationalValue.findMany({
        where: { tenantId }
    });

    return (
        <div style={{ paddingBottom: '2rem' }}>
            {/* <StrategyTabs /> Removed as per user request to focus on Purpose */}
            {/* <StrategyCascade purpose={purpose} /> Moved inside Dashboard for Header Hierarchy */}
            <div style={{ marginTop: '1rem' }}>
                <StrategyDashboard
                    purpose={purpose}
                    areaPurpose={areaPurpose}
                    analysisData={analysisData}
                    organizationalValues={organizationalValues}
                />
            </div>
        </div>
    );
}
