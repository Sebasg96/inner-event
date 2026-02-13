import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getDashboardMetrics } from '@/app/actions';
import DashboardFilters from '@/components/Dashboard/DashboardFilters';
import DashboardCharts from '@/components/Dashboard/DashboardCharts';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ start?: string, end?: string }> }) {
    const params = await searchParams;
    const { start, end } = params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        redirect('/login');
    }

    const dashboardData = await getDashboardMetrics(start, end);

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="max-w-[1600px] mx-auto p-6 space-y-8">
                <header className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900">Panel de Control Estratégico</h1>
                    <p className="text-slate-500">Monitoreo de cumplimiento y salud de la estrategia.</p>
                </header>

                <DashboardFilters />
                <DashboardCharts data={dashboardData} />
            </div>
        </main>
    );
}
