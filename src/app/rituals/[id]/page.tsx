import { prisma } from '@/lib/prisma';
import RitualDetailClient from './RitualDetailClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RitualDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        redirect('/login');
    }

    const ritual = await prisma.ritual.findUnique({
        where: { id },
        include: {
            participants: {
                include: { user: true }
            },
            commitments: {
                include: { owner: true }
            }
        }
    });

    if (!ritual) {
        return <div>Ritual not found</div>;
    }

    // Fetch all users for the tenant
    const users = await prisma.user.findMany({
        where: { tenantId },
        select: { id: true, name: true, email: true }
    });

    // Fetch OKR Summary for Context
    const objectives = await prisma.objective.findMany({
        where: { tenantId },
        include: {
            keyResults: true
        }
    });

    // Simple summary: Count of Objectives, Avg Progress (implied from KRs)
    const totalObjectives = objectives.length;
    let totalKRs = 0;
    let totalProgress = 0;

    objectives.forEach(obj => {
        obj.keyResults.forEach(kr => {
            totalKRs++;
            const p = kr.targetValue === 0 ? 0 : Math.min(100, (kr.currentValue / kr.targetValue) * 100);
            totalProgress += p;
        });
    });

    const avgProgress = totalKRs === 0 ? 0 : Math.round(totalProgress / totalKRs);
    const okrSummary = {
        totalObjectives,
        totalKRs,
        avgProgress: `${avgProgress}%`
    };

    return <RitualDetailClient ritual={ritual as any} okrSummary={okrSummary} users={users} />;
}
