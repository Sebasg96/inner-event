'use client';

import { useState, useTransition } from 'react';
import { DashboardData, getDashboardData } from '@/app/dashboard/actions';
import MegaHeader from './MegaHeader';
import MetasSection from './MetasSection';
import StrategicGrid from './StrategicGrid';
import CutoffDatePicker from './CutoffDatePicker';

interface DashboardClientProps {
    data: DashboardData;
}

export default function DashboardClient({ data: initialData }: DashboardClientProps) {
    const [data, setData] = useState(initialData);
    const [cutoffDate, setCutoffDate] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const { mega, axes, objectivesWithoutAxis, strategicGoals } = data;

    const handleDateChange = (date: string | null) => {
        setCutoffDate(date);
        startTransition(async () => {
            const newData = await getDashboardData(date ?? undefined);
            setData(newData);
        });
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'hsl(222, 47%, 8%)',
            color: '#fff',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            padding: '1.5rem',
            overflowX: 'hidden',
        }}>
            {/* Background grid */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
                zIndex: 0,
            }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>
                {/* Mega Header */}
                {mega ? <MegaHeader mega={mega} /> : (
                    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                        No hay Mega configurada para este tenant.
                    </div>
                )}

                {/* Cutoff date filter row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                }}>
                    <CutoffDatePicker
                        value={cutoffDate}
                        onChange={handleDateChange}
                        loading={isPending}
                    />

                    {/* Cutoff date indicator */}
                    {cutoffDate && (
                        <div style={{
                            background: 'rgba(0, 200, 150, 0.08)',
                            border: '1px solid rgba(0, 200, 150, 0.2)',
                            borderRadius: '10px',
                            padding: '0.5rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.75rem',
                            color: 'hsl(174, 100%, 55%)',
                            fontWeight: 600,
                            letterSpacing: '0.03em',
                            opacity: isPending ? 0.5 : 1,
                            transition: 'opacity 0.3s',
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>📊</span>
                            Avance a fecha de corte: {new Date(cutoffDate + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    )}
                </div>


                {/* Strategic Goals (Metas) */}
                <MetasSection metas={strategicGoals} />

                {/* Strategic Grid */}
                <StrategicGrid axes={axes} objectivesWithoutAxis={objectivesWithoutAxis} />

                {/* Footer label */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                }}>
                    <span style={{ fontSize: '0.7rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                        Resultados Clave
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
                        Son la manera en la que lo lograremos, son el camino a seguir, son &ldquo;El Cómo&rdquo;
                    </span>
                </div>
            </div>
        </div>
    );
}

