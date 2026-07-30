import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserDiagnosticAssignments } from '@/app/actions';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageDiagnostics } from '@/lib/permissions';
import DiagnosticsUserClient from './DiagnosticsUserClient';

export const dynamic = 'force-dynamic';

export default async function DiagnosticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const cookieStore = await cookies();
    if (!cookieStore.get('inner_event_tenant_id')?.value) redirect('/login');

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        select: { role: true },
    });

    const assignments = await getUserDiagnosticAssignments();
    const isAdmin = canManageDiagnostics(dbUser?.role);

    return <DiagnosticsUserClient assignments={assignments as any} isAdmin={isAdmin} />;
}
