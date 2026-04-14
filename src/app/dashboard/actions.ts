'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { calculateKRProgress } from '@/lib/krUtils';
import { MeasurementDirection } from '@prisma/client';

export interface KRData {
  id: string;
  statement: string;
  progress: number; // 0-100
  trackingType: string;
  measurementDirection: MeasurementDirection;
  currentValue: number;
  targetValue: number;
  metricUnit: string;
}

export interface ObjectiveData {
  id: string;
  statement: string;
  progress: number; // 0-100 weighted
  keyResults: KRData[];
  strategicAxisId: string | null;
}

export interface AxisData {
  id: string;
  statement: string;
  objectives: ObjectiveData[];
  avgProgress: number; // average across objectives
}

export interface MegaData {
  id: string;
  statement: string;
  deadline: string;
  overallProgress: number;
}

export interface DashboardData {
  mega: MegaData | null;
  axes: AxisData[];
  objectivesWithoutAxis: ObjectiveData[];
  strategicGoals: { id: string; statement: string; targetValue: number; currentValue: number }[];
}

export interface TreeNodeData {
  id: string;
  title: string;
  type: 'mega' | 'objective' | 'kr';
  status: 'on_track' | 'at_risk' | 'behind';
  progress: number;
  weight?: number;
  children: TreeNodeData[];
}

function calcKRProgress(kr: {
  trackingType: string;
  measurementDirection: MeasurementDirection;
  currentValue: number;
  targetValue: number;
  updates: { newValue: number }[];
}): number {
  const latestValue = kr.updates.length > 0 ? kr.updates[0].newValue : kr.currentValue;
  return calculateKRProgress(kr.measurementDirection, latestValue, kr.targetValue);
}

export async function getDashboardData(cutoffDate?: string): Promise<DashboardData> {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('inner_event_tenant_id')?.value;

  if (!tenantId) {
    throw new Error('Tenant ID not found');
  }

  // Build update filter: if cutoffDate provided, only include updates up to that date
  const updateFilter = cutoffDate
    ? { createdAt: { lte: new Date(cutoffDate + 'T23:59:59.999Z') } }
    : {};

  // Get the first Mega for this tenant (or the most recent)
  const mega = await prisma.mega.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });

  // Get strategic axes with their objectives
  const axes = await prisma.strategicAxis.findMany({
    where: { tenantId },
    include: {
      objectives: {
        where: { megaId: mega?.id ?? undefined, parentObjectiveId: null },
        include: {
          keyResults: {
            include: {
              updates: {
                where: updateFilter,
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  // Get objectives NOT assigned to any axis
  const objectivesWithoutAxis = await prisma.objective.findMany({
    where: {
      tenantId,
      megaId: mega?.id ?? undefined,
      strategicAxisId: null,
      parentObjectiveId: null,
    },
    include: {
      keyResults: {
        include: {
          updates: {
            where: updateFilter,
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  function mapObjective(obj: (typeof objectivesWithoutAxis)[number]): ObjectiveData {
    const krNodes: KRData[] = obj.keyResults.map((kr) => ({
      id: kr.id,
      statement: kr.statement,
      progress: calcKRProgress(kr as any),
      trackingType: kr.trackingType,
      measurementDirection: kr.measurementDirection,
      currentValue: kr.currentValue,
      targetValue: kr.targetValue,
      metricUnit: kr.metricUnit,
    }));

    const weightSum = obj.keyResults.reduce((s, kr) => s + kr.weight, 0);
    const weightedProgress = weightSum > 0
      ? obj.keyResults.reduce((s, kr, i) => s + krNodes[i].progress * kr.weight, 0) / weightSum
      : 0;

    return {
      id: obj.id,
      statement: obj.statement,
      progress: Math.round(weightedProgress),
      keyResults: krNodes,
      strategicAxisId: obj.strategicAxisId,
    };
  }

  const axesData: AxisData[] = axes.map((axis) => {
    const mappedObjectives = axis.objectives.map(mapObjective);
    const avgProgress = mappedObjectives.length > 0
      ? Math.round(mappedObjectives.reduce((s, o) => s + o.progress, 0) / mappedObjectives.length)
      : 0;
    return {
      id: axis.id,
      statement: axis.statement,
      objectives: mappedObjectives,
      avgProgress,
    };
  });

  const mappedNoAxis = objectivesWithoutAxis.map(mapObjective);

  // Overall mega progress
  const allObjectives = [...axesData.flatMap((a) => a.objectives), ...mappedNoAxis];
  const overallProgress = allObjectives.length > 0
    ? Math.round(allObjectives.reduce((s, o) => s + o.progress, 0) / allObjectives.length)
    : 0;

  const strategicGoals = await prisma.strategicGoal.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, statement: true, targetValue: true, currentValue: true }
  });

  return {
    mega: mega
      ? {
        id: mega.id,
        statement: mega.statement,
        deadline: mega.deadline.toISOString(),
        overallProgress,
      }
      : null,
    axes: axesData,
    objectivesWithoutAxis: mappedNoAxis,
    strategicGoals,
  };
}
