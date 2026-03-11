'use client';

import React, { useState, useTransition } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import styles from '@/app/strategy/page.module.css';
import NavBar from '@/components/NavBar';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';
import PrismaAvatar from '@/components/PrismaAvatar';
import Link from 'next/link';
import { regenerateAnalytics } from './analytics-actions';

interface Metrics {
    totalObjectives: number;
    totalKRs: number;
    totalInitiatives: number;
    totalUsers: number;
    avgKRProgress: number;
    krsOnTrack: number;
    krsAtRisk: number;
    krsBehind: number;
    krsComplete: number;
    adherenceScore: number;
    totalUpdatesThisMonth: number;
    totalUpdatesLastMonth: number;
    initiativesByStatus: { TODO: number; IN_PROGRESS: number; DONE: number };
    avgInitiativeProgress: number;
}

interface NarrativeItem {
    title: string;
    description: string;
}

interface Recommendation extends NarrativeItem {
    priority: string;
}

interface Narrative {
    executiveSummary: string;
    achievements: NarrativeItem[];
    risks: NarrativeItem[];
    recommendations: Recommendation[];
}

interface Props {
    metrics: Metrics;
    narrative: Narrative;
    generatedAt: string | null;
}

export default function AnalyticsClient({ metrics, narrative, generatedAt }: Props) {
    const { dict } = useLanguage();
    const theme = useModuleTheme();
    const [isPending, startTransition] = useTransition();

    const handleRegenerate = () => {
        startTransition(async () => {
            await regenerateAnalytics('narrative');
        });
    };

    const timeAgo = generatedAt ? getTimeAgo(generatedAt) : null;

    const updateTrend = metrics.totalUpdatesLastMonth > 0
        ? Math.round(((metrics.totalUpdatesThisMonth - metrics.totalUpdatesLastMonth) / metrics.totalUpdatesLastMonth) * 100)
        : metrics.totalUpdatesThisMonth > 0 ? 100 : 0;

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <PrismaAvatar size={50} />
                    <h1 className={styles.header} style={{
                        background: `linear-gradient(to right, #333, ${theme.color})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 0
                    }}>Tu amigo PRAGMA</h1>
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
                        {isPending ? '⏳ Generando...' : '🔄 Nuevo Informe'}
                    </button>
                    <NavBar />
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <KPICard label="Objetivos" value={metrics.totalObjectives} icon="🎯" color="var(--primary)" />
                <KPICard label="Key Results" value={metrics.totalKRs} icon="📊" color="var(--accent)" />
                <KPICard label="Progreso KRs" value={`${metrics.avgKRProgress}%`} icon="📈" color={metrics.avgKRProgress >= 70 ? 'var(--success)' : metrics.avgKRProgress >= 30 ? 'var(--warning)' : 'var(--danger)'} />
                <KPICard label="Adherencia" value={`${metrics.adherenceScore}%`} icon="🔄" color={metrics.adherenceScore >= 70 ? 'var(--success)' : metrics.adherenceScore >= 40 ? 'var(--warning)' : 'var(--danger)'} />
                <KPICard label="Iniciativas" value={metrics.totalInitiatives} icon="🚀" color="var(--module-strategy)" />
                <KPICard
                    label="Updates (mes)"
                    value={metrics.totalUpdatesThisMonth}
                    icon="📝"
                    color="var(--module-analytics)"
                    subtext={updateTrend !== 0 ? `${updateTrend > 0 ? '↑' : '↓'} ${Math.abs(updateTrend)}% vs mes anterior` : undefined}
                />
            </div>

            {/* KR Distribution Bar */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Distribución de Key Results</h3>
                <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', height: '32px', background: '#e5e7eb' }}>
                    {metrics.krsComplete > 0 && (
                        <div style={{ width: `${(metrics.krsComplete / metrics.totalKRs) * 100}%`, background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 600 }} title="Completados">
                            {metrics.krsComplete} ✓
                        </div>
                    )}
                    {metrics.krsOnTrack > 0 && (
                        <div style={{ width: `${(metrics.krsOnTrack / metrics.totalKRs) * 100}%`, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 600 }} title="En camino (≥70%)">
                            {metrics.krsOnTrack}
                        </div>
                    )}
                    {metrics.krsAtRisk > 0 && (
                        <div style={{ width: `${(metrics.krsAtRisk / metrics.totalKRs) * 100}%`, background: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 600 }} title="En riesgo (30-69%)">
                            {metrics.krsAtRisk}
                        </div>
                    )}
                    {metrics.krsBehind > 0 && (
                        <div style={{ width: `${(metrics.krsBehind / metrics.totalKRs) * 100}%`, background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 600 }} title="Rezagados (<30%)">
                            {metrics.krsBehind}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>✅ Completados: {metrics.krsComplete}</span>
                    <span>🟢 En camino: {metrics.krsOnTrack}</span>
                    <span>🟡 En riesgo: {metrics.krsAtRisk}</span>
                    <span>🔴 Rezagados: {metrics.krsBehind}</span>
                </div>
            </div>

            {/* Executive Summary from AI */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: `5px solid ${theme.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <PrismaAvatar size={60} emotion="happy" />
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Resumen Ejecutivo</h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generado por PRAGMA AI con datos reales</span>
                    </div>
                </div>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
                    {narrative.executiveSummary}
                </p>
            </div>

            {/* Achievements & Risks Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Achievements */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--success)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', marginTop: 0 }}>
                        <span style={{ fontSize: '1.5rem' }}>🏆</span> Logros y Avances
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                        {narrative.achievements.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>La estrategia está en fase temprana. ¡Los logros vendrán pronto!</p>
                        ) : (
                            narrative.achievements.map((item, idx) => (
                                <div key={idx} style={{ padding: '0.8rem', background: 'rgba(34,197,94,0.06)', borderRadius: '8px', borderLeft: '3px solid var(--success)' }}>
                                    <strong>{item.title}</strong>
                                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{item.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Risks */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--danger)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', marginTop: 0 }}>
                        <span style={{ fontSize: '1.5rem' }}>⚠️</span> Riesgos Identificados
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                        {narrative.risks.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>¡Excelente! No se identifican riesgos inminentes.</p>
                        ) : (
                            narrative.risks.map((item, idx) => (
                                <div key={idx} style={{ padding: '0.8rem', background: 'rgba(239,68,68,0.06)', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
                                    <strong>{item.title}</strong>
                                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{item.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <PrismaAvatar size={40} emotion="thinking" />
                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>Recomendaciones de PRAGMA</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {narrative.recommendations.map((rec, idx) => (
                        <div key={idx} style={{
                            padding: '1.2rem',
                            background: '#ffffff',
                            borderRadius: '8px',
                            borderLeft: `5px solid ${rec.priority === 'alta' ? '#ef4444' : rec.priority === 'media' ? '#f59e0b' : '#22c55e'}`,
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'start',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}>
                            <span style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                background: rec.priority === 'alta' ? '#ef4444' : rec.priority === 'media' ? '#f59e0b' : '#22c55e',
                                color: '#ffffff',
                                whiteSpace: 'nowrap',
                                letterSpacing: '0.05em'
                            }}>
                                {rec.priority}
                            </span>
                            <div style={{ flex: 1 }}>
                                <strong style={{ color: '#1e293b', fontSize: '1.05rem', display: 'block', marginBottom: '0.4rem' }}>{rec.title}</strong>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>{rec.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Link to deep analytics */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link href="/analytics/metrics" className="btn-primary" style={{
                    textDecoration: 'none', padding: '0.8rem 2rem',
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '1rem', fontWeight: 600
                }}>
                    📊 Ver Analítica Profunda
                </Link>
            </div>
        </div>
    );
}

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

function KPICard({ label, value, icon, color, subtext }: {
    label: string; value: string | number; icon: string; color: string; subtext?: string;
}) {
    return (
        <div className="glass-panel" style={{
            padding: '1.2rem', textAlign: 'center',
            borderTop: `3px solid ${color}`,
        }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
            {subtext && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{subtext}</div>
            )}
        </div>
    );
}
