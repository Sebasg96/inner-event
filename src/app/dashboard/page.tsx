import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getDashboardData } from './actions';
import DashboardClient from '@/components/Dashboard/v3/DashboardClient';
import NavBar from '@/components/NavBar';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
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

    const data = await getDashboardData();

    return (
        <>
            {/* Floating NavBar overlay */}
            <div style={{
                position: 'fixed', top: '1rem', right: '1.5rem',
                zIndex: 100,
                background: 'rgba(15,23,42,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '0.25rem 0.75rem',
            }}>
                <NavBar />
            </div>
            <DashboardClient data={data} />
        </>
    );
}
