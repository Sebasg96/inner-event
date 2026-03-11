'use client';

import React, { useTransition } from 'react';
import styles from '@/app/strategy/page.module.css';
import NavBar from '@/components/NavBar';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';
import Link from 'next/link';
import { regenerateAnalytics } from '../analytics-actions';

interface Metrics {
    adherenceScore: number;
    avgDaysBetweenUpdates: number | null;
    totalUpdatesThisMonth: number;
    totalUpdatesLastMonth: number;
    avgKRProgress: number;
    krsOnTrack: number;
    krsAtRisk: number;
    krsBehind: number;
    krsComplete: number;
    totalKRs: number;
    totalObjectives: number;
    totalInitiatives: number;
    initiativesByStatus: { TODO: number; IN_PROGRESS: number; DONE: number };
    initiativesByHorizon: { H1: number; H2: number; H3: number };
    avgInitiativeProgress: number;
}

interface BehaviorPattern {
    title: string;
    description: string;
    type: 'positive' | 'neutral' | 'negative';
}

interface ActionItem {
    action: string;
    impact: string;
    effort: string;
}

interface Insights {
    maturityLevel: number;
    maturityExplanation: string;
    behaviorPatterns: BehaviorPattern[];
    healthScore: number;
    healthBreakdown: {
        alignment: number;
        cadence: number;
        progress: number;
        execution: number;
    };
    actionItems: ActionItem[];
}

interface Props {
    metrics: Metrics;
    insights: Insights;
    generatedAt: string | null;
}

export default function MetricsClient({ metrics, insights, generatedAt }: Props) {
    const theme = useModuleTheme();
    const [isPending, startTransition] = useTransition();

    const handleRegenerate = () => {
        startTransition(async () => {
            await regenerateAnalytics('insights');
        });
    };

    const timeAgo = generatedAt ? getTimeAgo(generatedAt) : null;

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/analytics" style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--text-muted)' }}>←</Link>
                    <h1 className={styles.header} style={{
                        background: `linear-gradient(to right, #333, ${theme.color})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 0
                    }}>Analítica Profunda</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {timeAgo && (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            📅 Generado {timeAgo}
                        </span>
                    )}
                    <button
                        onClick={handleRegenerate}
                        disabled={isPending}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: isPending ? '#94a3b8' : theme.color,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s ease',
                            opacity: isPending ? 0.7 : 1,
                        }}
                    >
                        {isPending ? '⏳ Generando...' : '🔄 Nuevo Análisis'}
                    </button>
                    <NavBar />
                </div>
            </div>

            {/* Top Row: Health Score + Adherence + Maturity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                {/* Health Score Gauge */}
                <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--primary)', textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', marginTop: 0, fontSize: '1.1rem' }}>Salud Estratégica Global</h2>
                    <div style={{ position: 'relative', width: '140px', height: '140px', margin: '1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="140" height="140" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="60" fill="none" stroke="#e5e7eb" strokeWidth="14" />
                            <circle cx="70" cy="70" r="60" fill="none"
                                stroke={insights.healthScore >= 70 ? 'var(--success)' : insights.healthScore >= 40 ? 'var(--warning)' : 'var(--danger)'}
                                strokeWidth="14"
                                strokeDasharray={`${insights.healthScore * 3.77} 377`}
                                strokeLinecap="round"
                                transform="rotate(-90 70 70)" />
                        </svg>
                        <span style={{ position: 'absolute', fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{insights.healthScore}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Score calculado con datos reales</p>
                </div>

                {/* Adherence Details */}
                <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--accent)' }}>
                    <h2 style={{ color: 'var(--accent)', marginBottom: '1rem', marginTop: 0, fontSize: '1.1rem' }}>Adherencia al Seguimiento</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <MetricRow label="Score de adherencia" value={`${metrics.adherenceScore}%`}
                            color={metrics.adherenceScore >= 70 ? 'var(--success)' : metrics.adherenceScore >= 40 ? 'var(--warning)' : 'var(--danger)'} />
                        <MetricRow label="Updates este mes" value={String(metrics.totalUpdatesThisMonth)} color="var(--primary)" />
                        <MetricRow label="Updates mes anterior" value={String(metrics.totalUpdatesLastMonth)} color="var(--text-muted)" />
                        <MetricRow label="Promedio entre updates"
                            value={metrics.avgDaysBetweenUpdates !== null ? `${metrics.avgDaysBetweenUpdates} días` : 'Sin datos'}
                            color="var(--module-analytics)" />
                    </div>
                </div>

                {/* OKR Maturity */}
                <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--warning)' }}>
                    <h2 style={{ color: 'var(--warning)', marginBottom: '1rem', marginTop: 0, fontSize: '1.1rem' }}>Madurez OKR</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', margin: '1.5rem 0' }}>
                        {[1, 2, 3, 4, 5].map(level => (
                            <div key={level} style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: level <= insights.maturityLevel ? 'var(--warning)' : '#e5e7eb',
                                color: level <= insights.maturityLevel ? 'white' : '#aaa',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', fontSize: '1rem',
                                transition: 'all 0.3s ease',
                            }}>
                                {level}
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-main)' }}>Nivel {insights.maturityLevel}</div>
                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {insights.maturityExplanation}
                    </p>
                </div>
            </div>

            {/* Health Breakdown Bars */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>Desglose de Salud Estratégica</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <HealthBar label="🎯 Alineación (Obj → KRs)" value={insights.healthBreakdown.alignment} />
                    <HealthBar label="🔄 Cadencia de updates" value={insights.healthBreakdown.cadence} />
                    <HealthBar label="📈 Progreso de KRs" value={insights.healthBreakdown.progress} />
                    <HealthBar label="🚀 Ejecución (Iniciativas)" value={insights.healthBreakdown.execution} />
                </div>
            </div>

            {/* Initiatives Distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* By Status */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--module-strategy)' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Iniciativas por Estado</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <StatusBar label="Sin iniciar" value={metrics.initiativesByStatus.TODO} total={metrics.totalInitiatives} color="#94a3b8" />
                        <StatusBar label="En progreso" value={metrics.initiativesByStatus.IN_PROGRESS} total={metrics.totalInitiatives} color="var(--warning)" />
                        <StatusBar label="Completadas" value={metrics.initiativesByStatus.DONE} total={metrics.totalInitiatives} color="var(--success)" />
                    </div>
                </div>

                {/* By Horizon */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--module-emergent)' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Iniciativas por Horizonte</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <StatusBar label="H1 — Core" value={metrics.initiativesByHorizon.H1} total={metrics.totalInitiatives} color="var(--primary)" />
                        <StatusBar label="H2 — Emergente" value={metrics.initiativesByHorizon.H2} total={metrics.totalInitiatives} color="var(--warning)" />
                        <StatusBar label="H3 — Futuro" value={metrics.initiativesByHorizon.H3} total={metrics.totalInitiatives} color="var(--accent)" />
                    </div>
                </div>
            </div>

            {/* Behavior Patterns */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderTop: '4px solid var(--module-analytics)' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Patrones de Comportamiento Detectados</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {insights.behaviorPatterns.map((pattern, idx) => (
                        <div key={idx} style={{
                            padding: '1.2rem',
                            background: pattern.type === 'positive' ? 'rgba(34,197,94,0.05)' :
                                pattern.type === 'negative' ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.5)',
                            borderRadius: '10px',
                            borderLeft: `4px solid ${pattern.type === 'positive' ? 'var(--success)' : pattern.type === 'negative' ? 'var(--danger)' : 'var(--module-analytics)'}`,
                        }}>
                            <strong style={{ fontSize: '1rem' }}>{pattern.title}</strong>
                            <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{pattern.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Items */}
            <div className="glass-panel" style={{ padding: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem', color: '#0f172a' }}>💡 Plan de Acción Recomendado</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {insights.actionItems.map((item, idx) => (
                        <div key={idx} style={{
                            padding: '1.2rem',
                            background: '#ffffff',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            borderLeft: `5px solid ${item.impact === 'alto' ? '#ef4444' : item.impact === 'medio' ? '#f59e0b' : '#22c55e'}`,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}>
                            <div style={{ flex: 1 }}>
                                <strong style={{ color: '#1e293b', fontSize: '1.05rem' }}>{item.action}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{
                                    padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800,
                                    background: item.impact === 'alto' ? '#ef4444' : item.impact === 'medio' ? '#f59e0b' : '#22c55e',
                                    color: '#ffffff',
                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                    Impacto: {item.impact}
                                </span>
                                <span style={{
                                    padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800,
                                    background: '#f1f5f9', color: '#475569',
                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                    Esfuerzo: {item.effort}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ───

function getTimeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'justo ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
}

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{value}</span>
        </div>
    );
}

function HealthBar({ label, value }: { label: string; value: number }) {
    const color = value >= 70 ? 'var(--success)' : value >= 40 ? 'var(--warning)' : 'var(--danger)';
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color }}>{value}%</span>
            </div>
            <div style={{ height: '10px', borderRadius: '5px', background: '#e5e7eb', overflow: 'hidden' }}>
                <div style={{
                    width: `${value}%`, height: '100%', borderRadius: '5px',
                    background: color,
                    transition: 'width 0.5s ease',
                }} />
            </div>
        </div>
    );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{value} ({pct}%)</span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', background: '#e5e7eb', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: color }} />
            </div>
        </div>
    );
}
