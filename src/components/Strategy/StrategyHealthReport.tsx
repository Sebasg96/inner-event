'use client';

import React, { useState, useEffect } from 'react';
import { getStrategyHealthData } from '@/app/actions';
import { AlertTriangle, XCircle, Info, Target, TrendingUp, Layers, CheckCircle } from 'lucide-react';

interface Issue {
    type: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    entityName: string;
    entityId: string;
    category: string;
}

interface HealthData {
    score: number;
    issues: Issue[];
    stats: {
        totalMegas: number;
        totalObjectives: number;
        totalKRs: number;
    };
}

interface HealthReportProps {
    themeColor?: string;
}

export default function StrategyHealthReport({ themeColor = '#6366f1' }: HealthReportProps) {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await getStrategyHealthData();
                setData(res);
            } catch (error) {
                console.error('Failed to fetch health data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHealth();
    }, []);

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Analizando calidad de la estrategia...</div>;
    if (!data) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'ERROR': return <XCircle size={18} color="#ef4444" />;
            case 'WARNING': return <AlertTriangle size={18} color="#f59e0b" />;
            default: return <Info size={18} color="#3b82f6" />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>

            {/* Health Score Overview */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(250px, 1fr) 2fr',
                gap: '2.5rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '24px',
                padding: '2.5rem',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '2rem' }}>
                    <div style={{
                        width: '140px',
                        height: '140px',
                        borderRadius: '50%',
                        border: `6px solid ${getScoreColor(data.score)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                        background: `${getScoreColor(data.score)}10`,
                        boxShadow: `0 0 25px ${getScoreColor(data.score)}40`,
                        position: 'relative'
                    }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 950, color: '#fff', textShadow: `0 0 10px ${getScoreColor(data.score)}` }}>{data.score}</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>HEALTH SCORE</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                        Calidad de la arquitectura estratégica basada en OKRs.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', paddingLeft: '0.5rem' }}>
                    <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s' }}>
                        <Target size={24} color="#818cf8" />
                        <div style={{ fontSize: '2rem', fontWeight: 950, color: '#fff' }}>{data.stats.totalMegas}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Megas</div>
                    </div>
                    <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s' }}>
                        <TrendingUp size={24} color="#34d399" />
                        <div style={{ fontSize: '2rem', fontWeight: 950, color: '#fff' }}>{data.stats.totalObjectives}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Objetivos</div>
                    </div>
                    <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s' }}>
                        <Layers size={24} color="#fbbf24" />
                        <div style={{ fontSize: '2rem', fontWeight: 950, color: '#fff' }}>{data.stats.totalKRs}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Key Results</div>
                    </div>
                </div>
            </div>

            {/* Issues List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '1px' }}>
                    <span style={{ fontSize: '1.4rem' }}>🛡️</span> DIAGNÓSTICO DE CALIDAD <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>({data.issues.length})</span>
                </h3>

                {data.issues.length === 0 ? (
                    <div style={{ padding: '4rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)', backdropFilter: 'blur(5px)' }}>
                        <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 1.5rem', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.3))' }} />
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 900 }}>¡Estrategia Blindada!</h4>
                        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '1rem 0 0', fontSize: '1rem' }}>No se han detectado anti-patrones. Tu estructura es sólida y sigue las mejores prácticas.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                        {data.issues.map((issue, idx) => (
                            <div key={idx} style={{
                                padding: '1.5rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '20px',
                                border: `1px solid ${issue.type === 'ERROR' ? 'rgba(239, 68, 68, 0.2)' : issue.type === 'WARNING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.2s'
                            }}
                                className="issue-card">
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: issue.type === 'ERROR' ? '#ef4444' : issue.type === 'WARNING' ? '#f59e0b' : '#3b82f6', boxShadow: `0 0 10px ${issue.type === 'ERROR' ? '#ef4444' : issue.type === 'WARNING' ? '#f59e0b' : '#3b82f6'}40` }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        {getIcon(issue.type)}
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {issue.category.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', marginBottom: '0.6rem', lineHeight: 1.3 }}>
                                    {issue.entityName}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                                    {issue.message}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
