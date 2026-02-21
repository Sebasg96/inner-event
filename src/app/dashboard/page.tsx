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
        <main className="min-h-screen relative overflow-hidden" style={{ background: 'hsl(var(--bg-app))' }}>
            {/* Tech Grid Background */}
            <div className="tech-grid opacity-20" />

            <div className="relative z-10 max-w-[1600px] mx-auto p-6 space-y-8">
                <header className="text-center space-y-3">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                        Panel de Control Estratégico
                    </h1>
                    <p className="text-slate-300/70 max-w-2xl mx-auto">
                        Monitoreo en tiempo real de cumplimiento, salud estratégica y focos de riesgo.
                    </p>
                </header>

                <DashboardFilters />
                <DashboardCharts data={dashboardData} />
            </div>
        </main>
    );
}
