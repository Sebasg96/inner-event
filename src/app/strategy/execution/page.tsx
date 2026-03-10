import { getKanbanBoard, getKeyResults } from '@/lib/services/kanbanService';
import KanbanPageClient from '@/components/Kanban/KanbanPageClient';
import StrategyTabs from '@/components/Strategy/StrategyTabs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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

export default async function ExecutionPage() {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        redirect('/login');
    }

    // Get current user for area-based filtering
    const currentUser = await getCurrentUser();
    const userArea = currentUser?.area;
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'DIRECTOR';

    // Fetch Real Data with area filtering
    const [rawInitiatives, krs, tenantUsers] = await Promise.all([
        getKanbanBoard(tenantId),
        getKeyResults(tenantId),
        prisma.user.findMany({
            where: { tenantId },
            select: { id: true, name: true, lastName: true, area: true }
        })
    ]);

    const initiatives = rawInitiatives.map((i: any) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        horizon: i.horizon,
        progress: i.progress,
        description: i.description,
        owner: i.owner ? {
            id: i.owner.id,
            name: i.owner.name,
            lastName: i.owner.lastName,
            area: i.owner.area
        } : null,
        team: i.team ? {
            members: i.team.members.map((m: any) => ({
                user: {
                    name: m.user.name,
                    discProfile: m.user.discProfile ? { color: m.user.discProfile.color } : null
                }
            }))
        } : null
    }));

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <StrategyTabs />
            <KanbanPageClient initiatives={initiatives} krs={krs} tenantUsers={tenantUsers} />
        </div>
    );
}
