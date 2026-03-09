'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import styles from '@/app/strategy/page.module.css';
import NavBar from '@/components/NavBar';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';
import Link from 'next/link';

interface MetricsProps {
    data: {
        adherenceScore: number;
        churnRisk: string;
        maturityLevel: number;
        behaviorPatterns: { id: string, title: string, description: string }[];
        suggestions: string[];
    }
}

export default function MetricsClient({ data }: MetricsProps) {
    const { dict } = useLanguage();
    const theme = useModuleTheme();

    const { adherenceScore, churnRisk, maturityLevel, behaviorPatterns, suggestions } = data;

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
                <NavBar />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                {/* 1. Adherence Metrics */}
                <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid var(--primary)` }}>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Métricas de Adherencia</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Frecuencia de uso y actualización del equipo.</p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginTop: '2rem' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" strokeWidth="12" />
                                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--primary)" strokeWidth="12" strokeDasharray={`${adherenceScore * 3.39} 339`} transform="rotate(-90 60 60)" />
                            </svg>
                            <span style={{ position: 'absolute', fontSize: '1.5rem', fontWeight: 'bold' }}>{adherenceScore}%</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem' }}>Score de Participación</div>
                            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Métrica Evaluada por IA</div>
                        </div>
                    </div>
                </div>

                {/* 2. Behavior Patterns */}
                <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid var(--accent)` }}>
                    <h2 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Patrones de Comportamiento</h2>
                    <p style={{ color: 'var(--text-muted)' }}>¿Cómo interactúa tu equipo con la estrategia?</p>

                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {behaviorPatterns.map(pattern => (
                            <div key={pattern.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                                <strong>{pattern.title}</strong>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{pattern.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Churn Risk */}
                <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid var(--danger)` }}>
                    <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Riesgo de Abandono</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Probabilidad de desconexión estratégica.</p>

                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: churnRisk === 'Bajo' ? 'var(--success)' : (churnRisk === 'Alto' ? 'var(--danger)' : 'var(--warning)') }}>
                            {churnRisk}
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>Evaluación algorítmica de la cadencia actual.</p>
                    </div>
                </div>

                {/* 4. OKR Maturity */}
                <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid var(--warning)` }}>
                    <h2 style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}>Madurez OKR</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Calidad de la estructura de objetivos.</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1.5rem', justifyContent: 'center' }}>
                        {[1, 2, 3, 4, 5].map(level => (
                            <div key={level} style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: level <= maturityLevel ? 'var(--warning)' : '#eee',
                                color: level <= maturityLevel ? 'white' : '#aaa',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                            }}>
                                {level}
                            </div>
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1rem', fontWeight: 'bold' }}>Nivel {maturityLevel}</div>
                    <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Analizado por PRAGMA AI basado en iniciativas y KRs.</div>
                </div>

            </div>

            {/* Suggestions */}
            <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,240,255,0.9))' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', marginBottom: '1rem' }}>💡 Sugerencias de Mejora Estratégica</h3>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
