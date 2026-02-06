'use server';

import { prisma } from '@/lib/prisma';
import { model } from '@/lib/ai/gemini';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// Helper to get Tenant ID (Duplicated from main actions to keep this independent, or could import)
async function getTenantId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        const cookieStore = await cookies();
        const tenantId = cookieStore.get('inner_event_tenant_id')?.value;
        if (!tenantId) throw new Error('Unauthorized');
        return tenantId;
    }

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { tenantId: true }
    });

    if (!dbUser) throw new Error('User context not found');
    return dbUser.tenantId;
}

export async function generateExecutiveReport(modules: string[]) {
    try {
        const tenantId = await getTenantId();
        let contextData: any = {};

        // 1. Fetch Strategy Data (Always included if 'strategy' or 'all' is selected)
        if (modules.includes('strategy') || modules.includes('all')) {
            const purpose = await prisma.purpose.findFirst({
                where: { tenantId },
                include: {
                    megas: {
                        include: {
                            objectives: {
                                include: {
                                    keyResults: {
                                        include: {
                                            initiatives: true,
                                            owner: { select: { name: true } }
                                        },
                                    },
                                    owner: { select: { name: true } }
                                }
                            }
                        }
                    }
                }
            });
            contextData.strategy = purpose;
        }

        // 2. Fetch Capacities (Users/Teams)
        if (modules.includes('capacities') || modules.includes('all')) {
            const users = await prisma.user.findMany({
                where: { tenantId },
                select: { role: true, area: true, jobTitle: true }
            });
            contextData.capacities = {
                totalUsers: users.length,
                roles: users.reduce((acc: any, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {}),
                areas: users.reduce((acc: any, u) => { if(u.area) acc[u.area] = (acc[u.area] || 0) + 1; return acc; }, {})
            };
        }

        // 3. Construct Prompt
        const prompt = `
            **Role:** Act as a Chief Strategy Officer (CSO) for the company.
            **Goal:** Generate a high-level "Executive Strategy Report" based on the provided JSON data.
            **Tone:** Professional, insightful, concise, and action-oriented.
            **Output Format:** GitHub Flavored Markdown.
            
            **Data Context:**
            ${JSON.stringify(contextData, null, 2).substring(0, 20000)} // Limit context to avoid token limits if massive

            **Report Structure:**
            
            # 📊 Executive Strategy Report
            *Generated on ${new Date().toLocaleDateString()}*

            ## 1. high-level Summary (Resumen Ejecutivo)
            [Provide a 3-5 sentence summary of the overall strategic health. Are we on track? What is the main blocker?]

            ## 2. Strategic Progress Analysis (Análisis de Progreso)
            [Analyze the 'strategy' data. Mention specific Megas and Objectives. Highlight top performers and at-risk areas.]
            - **Wins:** [List 2-3 objectives/KRs with high progress]
            - **Risks:** [List 2-3 objectives/KRs with low progress or 'TODO' initiatives]

            ## 3. Execution Health (Salud de Ejecución)
            [Analyze the Initiatives. Do we have enough 'IN_PROGRESS'? Is there a bottleneck in 'TODO'?]
            
            ## 4. Recommendations (Recomendaciones)
            [3 bullet points with direct, actionable advice based on the data]

            **Language:** SPANISH (Español).
        `;

        // 4. Call AI
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return { success: true, report: text };

    } catch (error: any) {
        console.error("Error generating report:", error);
        return { success: false, error: "Failed to generate report. Please try again." };
    }
}
