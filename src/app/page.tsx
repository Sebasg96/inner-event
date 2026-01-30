import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import HomePageClient from './HomePageClient';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
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

  // Fetch Purpose and full Cascade Tree (L1 -> L2 -> L3)
  // Reusing the query from Planning Page
  const purpose = await prisma.purpose.findFirst({
    where: { tenantId, type: 'COMPANY' }, // Always start from Company Purpose
    include: {
      megas: {
        include: {
          objectives: {
            where: { parentObjectiveId: null }, // Only Top Level Objectives directly under Mega
            include: {
              keyResults: {
                include: {
                  initiatives: {
                    select: { id: true, progress: true, status: true, title: true }
                  }
                }
              },
              childObjectives: { // Level 2
                include: {
                  owner: true,
                  keyResults: {
                    include: {
                      initiatives: { select: { id: true, progress: true, status: true, title: true } }
                    }
                  },
                  childObjectives: { // Level 3
                    include: {
                      owner: true,
                      keyResults: {
                        include: {
                          initiatives: { select: { id: true, progress: true, status: true, title: true } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return (
    <HomePageClient purpose={purpose} />
  );
}
