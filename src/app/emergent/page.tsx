import { prisma } from '@/lib/prisma';
import EmergentClient from './EmergentClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmergentPage() {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        redirect('/login');
    }

    const hardChoices = await prisma.hardChoice.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' }
    });

    const strategicConversations = await prisma.strategicConversation.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' }
    });

    const distinctiveCapabilities = await prisma.distinctiveCapability.findMany({
        where: { tenantId },
    });

    const marketValueMetrics = await prisma.marketValueMetric.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' }
    });

    const mutationLogs = await prisma.mutationLog.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' }
    });

    return (
        <EmergentClient
            hardChoices={hardChoices}
            strategicConversations={strategicConversations}
            distinctiveCapabilities={distinctiveCapabilities}
            marketValueMetrics={marketValueMetrics}
            mutationLogs={mutationLogs}
        />
    );
}
