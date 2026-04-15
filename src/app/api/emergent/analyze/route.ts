import { NextResponse } from 'next/server';
import { analyzeEmergentStrategy } from '@/lib/strategy/emergentLogic';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

        if (!tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adjustments = await analyzeEmergentStrategy(tenantId);
        return NextResponse.json({ adjustments });
    } catch (error) {
        console.error('Emergent Analysis Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
