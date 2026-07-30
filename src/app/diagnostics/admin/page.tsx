import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageDiagnostics } from '@/lib/permissions';
import { getDiagnosticCampaigns, getDiagnosticQuestions } from '@/app/actions';
import DiagnosticsAdminClient from './DiagnosticsAdminClient';

export const dynamic = 'force-dynamic';

export default async function DiagnosticsAdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        select: { role: true },
    });
    if (!dbUser || !canManageDiagnostics(dbUser.role)) redirect('/diagnostics');

    const [campaigns, questions, tenantUsers] = await Promise.all([
        getDiagnosticCampaigns(),
        getDiagnosticQuestions(),
        prisma.user.findMany({
            where: { tenant: { users: { some: { email: user.email! } } } },
            select: { id: true, name: true, email: true, jobTitle: true, area: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <DiagnosticsAdminClient
            initialCampaigns={campaigns as any}
            initialQuestions={questions}
            tenantUsers={tenantUsers}
        />
    );
}
