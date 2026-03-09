import { prisma } from '@/lib/prisma';
import AnalyticsClient from './AnalyticsClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jsonModel } from '@/lib/ai/gemini';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

    if (!tenantId) {
        redirect('/login');
    }

    // Fetch Data for Analysis
    const initiatives = await prisma.initiative.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' }
    });

    // Provide context to AI
    const prompt = `
    You are an AI assistant analyzing a company's strategic initiatives.
    Here is the list of current initiatives:
    ${JSON.stringify(initiatives.map(i => ({ id: i.id, title: i.title, description: i.description, progress: i.progress, status: i.status })))}
    
    Categorize these initiatives into the following four groups and return valid JSON matching this schema exactly:
    {
        "completedInitiatives": Array<{ id: string, title: string, progress: number }>,
        "stalledInitiatives": Array<{ id: string, title: string, progress: number }>,
        "atRiskInitiatives": Array<{ id: string, title: string, progress: number }>,
        "recentWins": Array<{ id: string, title: string, progress: number }>
    }

    Rules:
    - completedInitiatives: progress is 100 or status is DONE.
    - stalledInitiatives: in progress but hasn't moved much (e.g., progress < 30 but not recently updated, use your judgment).
    - atRiskInitiatives: progress is between 30 and 70 but seems to be lagging, or you think it's at risk.
    - recentWins: highly progressed items (>80) or recently completed.
    - Important: Do not invent IDs. Only use the IDs provided in the array.
    `;

    let data = {
        completedInitiatives: [] as any[],
        stalledInitiatives: [] as any[],
        atRiskInitiatives: [] as any[],
        recentWins: [] as any[],
        totalInitiatives: initiatives.length
    };

    if (initiatives.length > 0) {
        try {
            const aiResult = await jsonModel.generateContent(prompt);
            const responseText = await aiResult.response.text();
            const parsedData = JSON.parse(responseText);

            data = {
                ...data,
                completedInitiatives: parsedData.completedInitiatives || [],
                stalledInitiatives: parsedData.stalledInitiatives || [],
                atRiskInitiatives: parsedData.atRiskInitiatives || [],
                recentWins: parsedData.recentWins || [],
            };
        } catch (error) {
            console.error("Error analyzing initiatives with AI:", error);
            // Fallback to mock data on error so page still renders something
            data = {
                completedInitiatives: initiatives.filter(i => i.status === 'DONE' || i.progress === 100),
                stalledInitiatives: initiatives.filter(i => i.status === 'IN_PROGRESS' && i.progress < 30),
                atRiskInitiatives: initiatives.filter(i => i.status === 'IN_PROGRESS' && i.progress >= 30 && i.progress < 70),
                recentWins: initiatives.filter(i => i.progress > 80),
                totalInitiatives: initiatives.length
            };
        }
    }

    return <AnalyticsClient data={data} />;
}
