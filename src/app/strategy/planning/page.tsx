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
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'DIRECTOR';

    // Build objective where clause based on simple parent check
    const buildObjectiveWhere = (baseWhere: any = {}) => {
        return baseWhere;
    };

    // Fetch Purpose and full Cascade Tree (L1 -> L2 -> L3) with area filtering
    const purpose = await prisma.purpose.findFirst({
        where: { tenantId, type: 'COMPANY' }, // Always start from Company Purpose
        include: {
            megas: {
                include: {
                    objectives: {
                        where: buildObjectiveWhere({ parentObjectiveId: null }),
                        select: {
                            id: true,
                            statement: true,
                            strategicAxisId: true,
                            weight: true,
                            owner: true,
                            keyResults: {
                                select: {
                                    id: true,
                                    statement: true,
                                    targetValue: true,
                                    currentValue: true,
                                    weight: true,
                                    metricUnit: true,
                                    trackingType: true,
                                    numeratorValue: true,
                                    denominatorValue: true,
                                    numeratorLabel: true,
                                    denominatorLabel: true,
                                    updatePeriodicity: true,

                                    owner: true,
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
                                select: {
                                    id: true,
                                    statement: true,
                                    strategicAxisId: true,
                                    weight: true,
                                    owner: true,
                                    keyResults: {
                                        select: {
                                            id: true,
                                            statement: true,
                                            targetValue: true,
                                            currentValue: true,
                                            weight: true,
                                            metricUnit: true,
                                            trackingType: true,
                                            numeratorValue: true,
                                            denominatorValue: true,
                                            numeratorLabel: true,
                                            denominatorLabel: true,
                                            updatePeriodicity: true,

                                            owner: true,
                                            initiatives: { select: { id: true, progress: true, status: true, title: true } },
                                            updates: {
                                                include: { user: { select: { name: true } } },
                                                orderBy: { createdAt: 'desc' }
                                            }
                                        }
                                    },
                                    childObjectives: { // Level 3
                                        where: buildObjectiveWhere(),
                                        select: {
                                            id: true,
                                            statement: true,
                                            strategicAxisId: true,
                                            weight: true,
                                            owner: true,
                                            keyResults: {
                                                select: {
                                                    id: true,
                                                    statement: true,
                                                    targetValue: true,
                                                    currentValue: true,
                                                    weight: true,
                                                    metricUnit: true,
                                                    trackingType: true,
                                                    numeratorValue: true,
                                                    denominatorValue: true,
                                                    numeratorLabel: true,
                                                    denominatorLabel: true,
                                                    updatePeriodicity: true,

                                                    owner: true,
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

    const strategicAxes = await prisma.strategicAxis.findMany({
        where: { tenantId }
    });

    const tenantUsers = await prisma.user.findMany({
        where: { tenantId },
        select: { id: true, name: true, lastName: true, email: true, role: true, area: true }
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
                    strategicAxes={strategicAxes}
                    tenantUsers={tenantUsers}
                />
            </div>
        </div>
    );
}
