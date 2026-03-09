'use client';

import { AxisData, ObjectiveData } from '@/app/dashboard/actions';
import ObjectiveCard from './ObjectiveCard';

interface StrategicGridProps {
    axes: AxisData[];
    objectivesWithoutAxis: ObjectiveData[];
}

// A palette of distinct colors for each axis
const AXIS_PALETTE: { bg: string; accent: string; dot: string }[] = [
    { bg: 'rgba(59, 130, 246, 0.15)', accent: 'hsl(217, 91%, 65%)', dot: 'hsl(217, 91%, 65%)' },
    { bg: 'rgba(16, 185, 129, 0.15)', accent: 'hsl(160, 75%, 50%)', dot: 'hsl(160, 75%, 50%)' },
    { bg: 'rgba(139, 92, 246, 0.15)', accent: 'hsl(263, 80%, 70%)', dot: 'hsl(263, 80%, 70%)' },
    { bg: 'rgba(245, 158, 11, 0.15)', accent: 'hsl(38,  95%, 56%)', dot: 'hsl(38,  95%, 56%)' },
    { bg: 'rgba(236, 72, 153, 0.15)', accent: 'hsl(330, 80%, 65%)', dot: 'hsl(330, 80%, 65%)' },
    { bg: 'rgba(20, 184, 166, 0.15)', accent: 'hsl(174, 72%, 50%)', dot: 'hsl(174, 72%, 50%)' },
];

function AxisLabel({ axis, palette }: { axis: AxisData; palette: typeof AXIS_PALETTE[0] }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.9rem 1rem',
            background: palette.bg,
            border: `1px solid ${palette.accent}30`,
            borderRadius: '12px',
            minWidth: '0',
        }}>
            {/* Dot indicator */}
            <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: palette.dot, flexShrink: 0,
                boxShadow: `0 0 8px ${palette.dot}`,
            }} />
            <div style={{ minWidth: 0 }}>
                <p style={{
                    margin: 0, fontSize: '0.72rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.9)', lineHeight: 1.4,
                    overflow: 'hidden', display: '-webkit-box',
                }}>
                    {axis.statement}
                </p>
                <span style={{ fontSize: '0.6rem', color: palette.accent, fontWeight: 600 }}>
                    {axis.avgProgress}% avg
                </span>
            </div>
        </div>
    );
}

export default function StrategicGrid({ axes, objectivesWithoutAxis }: StrategicGridProps) {
    const allRows = [
        ...axes.map((axis, i) => ({
            type: 'axis' as const,
            axis,
            palette: AXIS_PALETTE[i % AXIS_PALETTE.length],
        })),
        ...(objectivesWithoutAxis.length > 0 ? [{
            type: 'noAxis' as const,
            objectives: objectivesWithoutAxis,
            palette: AXIS_PALETTE[axes.length % AXIS_PALETTE.length],
        }] : []),
    ];

    if (allRows.length === 0) {
        return (
            <div style={{
                padding: '3rem', textAlign: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '14px',
                border: '1px dashed rgba(255,255,255,0.1)',
            }}>
                No hay ejes estratégicos u objetivos configurados aún.
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
        }}>
            {/* Column headers */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr',
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: '0.5rem 1rem',
                gap: '1rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '3px', height: '14px', background: 'hsl(174,100%,45%)', borderRadius: '2px' }} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                        Ejes Estratégicos
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                        Apuestas Estratégicas — Lo que queremos lograr
                    </span>
                </div>
            </div>

            {/* Rows */}
            {allRows.map((row, rowIndex) => {
                const objectives = row.type === 'axis' ? row.axis.objectives : row.objectives;
                const label = row.type === 'axis' ? row.axis.statement : 'Sin Eje';
                const fake = row.type === 'axis' ? row.axis : null;

                return (
                    <div
                        key={rowIndex}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '200px 1fr',
                            borderBottom: rowIndex < allRows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : undefined,
                            gap: '1rem',
                            padding: '0.75rem 1rem',
                            alignItems: 'start',
                        }}
                    >
                        {/* Axis label */}
                        <div>
                            {fake ? (
                                <AxisLabel axis={fake} palette={row.palette} />
                            ) : (
                                <div style={{
                                    padding: '0.9rem 1rem',
                                    background: row.palette.bg,
                                    borderRadius: '12px',
                                    border: `1px solid ${row.palette.accent}30`,
                                }}>
                                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                                        Sin eje asignado
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Objectives grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '0.6rem',
                        }}>
                            {objectives.length === 0 ? (
                                <div style={{
                                    padding: '1rem',
                                    color: 'rgba(255,255,255,0.2)',
                                    fontSize: '0.75rem',
                                    fontStyle: 'italic',
                                }}>
                                    Sin objetivos
                                </div>
                            ) : (
                                objectives.map((obj) => (
                                    <ObjectiveCard
                                        key={obj.id}
                                        objective={obj}
                                        color={row.palette.bg}
                                        accentColor={row.palette.accent}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
