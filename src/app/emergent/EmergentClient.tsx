'use client';

import React, { useState } from 'react';
import styles from '@/app/strategy/page.module.css';
import NavBar from '@/components/NavBar';
import {
    createHardChoice,
    createStrategicConversation,
    createDistinctiveCapability,
    deleteDistinctiveCapability,
    createMarketValueMetric,
    deleteMarketValueMetric,
    createMutationLog,
    deleteMutationLog
} from '@/app/actions';

/*
  Emergent Strategy Elements:
  1. Hard Choices (Renuncias)
  2. Coalición Crítica (Conversaciones)
  3. Capacidades Distintivas
  4. Valor Creado (Market Success)
  5. Detector de Mutaciones
*/

interface HardChoice {
    id: string;
    description: string;
    reasoning: string;
    date: string | Date; // Prisma returns Date, serialized might be string
}

interface StrategicConversation {
    id: string;
    topic: string;
    conclusion: string | null;
    date: string | Date;
}

interface DistinctiveCapability {
    id: string;
    name: string;
    status: string;
    evidence: string | null;
}

interface MarketValueMetric {
    id: string;
    metricName: string;
    value: number;
    marketFeedback: string | null;
    date: string | Date;
}

interface MutationLog {
    id: string;
    observation: string;
    type: string;
    date: string | Date;
}

interface EmergentClientProps {
    hardChoices: HardChoice[];
    strategicConversations: StrategicConversation[];
    distinctiveCapabilities: DistinctiveCapability[];
    marketValueMetrics: MarketValueMetric[];
    mutationLogs: MutationLog[];
}

export default function EmergentClient({
    hardChoices,
    strategicConversations,
    distinctiveCapabilities,
    marketValueMetrics,
    mutationLogs
}: EmergentClientProps) {
    const [activeTab, setActiveTab] = useState('hardChoices');
    const [analysisResult, setAnalysisResult] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const accentColor = 'hsl(340 100% 60%)';

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/emergent/analyze', { method: 'POST' });
            const data = await res.json();
            setAnalysisResult(data.adjustments || []);
        } catch (e) {
            console.error("Analysis failed", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderHardChoices = () => (
        <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid ${accentColor}` }}>
            <h2 style={{ color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🛑 Bitácora de "Hard Choices"
            </h2>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                "Estrategia es renunciar". Registro de oportunidades rechazadas para mantener el foco.
            </p>

            <form action={createHardChoice} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Oportunidad Rechazada</label>
                    <input name="description" placeholder="Ej: Expansión a mercado asiático..." style={{ width: '100%' }} required />
                </div>
                <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Razonamiento Estratégico</label>
                    <input name="reasoning" placeholder="Por qué decimos NO ahora..." style={{ width: '100%' }} required />
                </div>
                <button type="submit" className="btn-primary" style={{ background: accentColor, height: '42px' }}>Registrar</button>
            </form>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {hardChoices.map((hc) => (
                    <div key={hc.id} style={{ padding: '1rem', background: 'hsl(var(--bg-app))', borderRadius: '8px', borderLeft: '2px solid var(--text-muted)' }}>
                        <div style={{ fontWeight: 'bold', color: 'hsl(var(--text-main))' }}>{hc.description}</div>
                        <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>{hc.reasoning}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.6 }}>{new Date(hc.date).toLocaleDateString()}</div>
                    </div>
                ))}
                {hardChoices.length === 0 && <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center' }}>No hay renuncias registradas aún.</div>}
            </div>
        </div>
    );

    const renderCoalition = () => (
        <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid ${accentColor}` }}>
            <h2 style={{ color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🧠 Panel de "Coalición Crítica"
            </h2>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem' }}>
                La mente de la organización. Documentación de conversaciones estratégicas clave.
            </p>

            <form action={createStrategicConversation} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Tema de Conversación</label>
                    <input name="topic" placeholder="Ej: Cambio en modelo de precios..." style={{ width: '100%' }} required />
                </div>
                <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Conclusión / Insight</label>
                    <input name="conclusion" placeholder="A qué llegamos..." style={{ width: '100%' }} required />
                </div>
                <button type="submit" className="btn-primary" style={{ background: accentColor, height: '42px' }}>Guardar</button>
            </form>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {strategicConversations.map((sc) => (
                    <div key={sc.id} style={{ padding: '1rem', background: 'hsl(var(--bg-app))', borderRadius: '8px', borderLeft: `2px solid ${accentColor}` }}>
                        <div style={{ fontWeight: 'bold', color: 'hsl(var(--text-main))' }}>{sc.topic}</div>
                        <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>{sc.conclusion}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.6 }}>{new Date(sc.date).toLocaleDateString()}</div>
                    </div>
                ))}
                {strategicConversations.length === 0 && <div style={{ color: 'hsl(var(--text-muted))', textAlign: 'center' }}>Sin conversaciones registradas.</div>}
            </div>
        </div>
    );

    const renderPlaceholders = (title: string, desc: string) => (
        <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid ${accentColor}`, opacity: 0.8 }}>
            <h2 style={{ color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {title}
            </h2>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem' }}>
                {desc}
            </p>
            <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed hsl(var(--border-glass))', borderRadius: '8px' }}>
                Coming Soon in Phase 2
            </div>
        </div>
    );

    const renderCapabilities = () => (
        <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid ${accentColor}` }}>
            <h2 style={{ color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🧩 Inventario de Capacidades Distintivas
            </h2>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem' }}>
                ¿Qué hacemos mejor que nadie más? Activos y habilidades difíciles de replicar.
            </p>

            <form action={createDistinctiveCapability} style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Capacidad</label>
                    <input name="name" placeholder="Ej: Algoritmo de compresión..." style={{ width: '100%' }} required />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Nivel</label>
                    <select name="status" style={{ width: '100%', height: '42px', padding: '0 0.5rem' }}>
                        <option value="Developing">En Desarrollo</option>
                        <option value="Mature">Madura</option>
                        <option value="Core">Core Business</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Evidencia / Prueba</label>
                    <input name="evidence" placeholder="¿Por qué es distintiva?..." style={{ width: '100%' }} />
                </div>
                <button type="submit" className="btn-primary" style={{ background: accentColor, height: '42px' }}>Añadir</button>
            </form>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {distinctiveCapabilities.map((cap) => (
                    <div key={cap.id} className="glass-panel" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: cap.status === 'Core' ? 'hsl(142 70% 45%)' : cap.status === 'Mature' ? 'hsl(217 90% 60%)' : 'hsl(48 95% 50%)',
                                color: 'white',
                                fontWeight: 'bold'
                            }}>
                                {cap.status}
                            </span>
                            <button onClick={() => deleteDistinctiveCapability(cap.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}>🗑️</button>
                        </div>
                        <h4 style={{ margin: '0.8rem 0 0.5rem 0', color: 'hsl(var(--text-main))' }}>{cap.name}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>{cap.evidence || 'Sin evidencia registrada'}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMarketValue = () => (
        <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid ${accentColor}` }}>
            <h2 style={{ color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💎 Indicadores de Valor Creado
            </h2>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem' }}>
                El choque con el mercado. ¿Estamos ganando tracción real?
            </p>

            <form action={createMarketValueMetric} style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Métrica de Valor</label>
                    <input name="metricName" placeholder="Ej: NPS, Retención W1..." style={{ width: '100%' }} required />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Valor (%)</label>
                    <input name="value" type="number" step="0.1" placeholder="95.5" style={{ width: '100%' }} required />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Feedback Cualitativo</label>
                    <input name="marketFeedback" placeholder="Lo que dicen los clientes..." style={{ width: '100%' }} />
                </div>
                <button type="submit" className="btn-primary" style={{ background: accentColor, height: '42px' }}>Registrar</button>
            </form>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {marketValueMetrics.map((vm) => (
                    <div key={vm.id} style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: accentColor }}>{vm.value}%</div>
                            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>VALOR</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{vm.metricName}</div>
                            <div style={{ color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>"{vm.marketFeedback}"</div>
                        </div>
                        <button onClick={() => deleteMarketValueMetric(vm.id)} className="btn-secondary" style={{ padding: '0.4rem' }}>Eliminar</button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMutations = () => (
        <div className="glass-panel" style={{ padding: '2rem', borderTop: `4px solid ${accentColor}` }}>
            <h2 style={{ color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🧬 Detector de Mutaciones
            </h2>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem' }}>
                Resultados inesperados y anomalías. La fuente de la nueva estrategia.
            </p>

            <form action={createMutationLog} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 3 }}>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Observación Inesperada</label>
                    <input name="observation" placeholder="Ej: Usuarios usan el chat para soporte técnico, no para ventas..." style={{ width: '100%' }} required />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Tipo</label>
                    <select name="type" style={{ width: '100%', height: '42px', padding: '0 0.5rem' }}>
                        <option value="POSITIVE">Oportunidad (+)</option>
                        <option value="NEGATIVE">Amenaza (-)</option>
                    </select>
                </div>
                <button type="submit" className="btn-primary" style={{ background: accentColor, height: '42px' }}>Detectar</button>
            </form>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {mutationLogs.map((ml) => (
                    <div key={ml.id} style={{
                        padding: '1.2rem',
                        background: ml.type === 'POSITIVE' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        borderRadius: '8px',
                        borderLeft: `5px solid ${ml.type === 'POSITIVE' ? '#22c55e' : '#ef4444'}`
                    }}>
                        <div style={{ fontSize: '1.1rem' }}>{ml.observation}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 'bold', color: ml.type === 'POSITIVE' ? '#22c55e' : '#ef4444' }}>
                            MUTACIÓN {ml.type === 'POSITIVE' ? 'POSITIVA' : 'NEGATIVA'} • {new Date(ml.date).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className={styles.header} style={{
                    color: accentColor,
                    marginBottom: 0
                }}>Estrategia Emergente</h1>
                <NavBar />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {[
                    { id: 'hardChoices', label: 'Hard Choices' },
                    { id: 'coalition', label: 'Coalición Crítica' },
                    { id: 'capabilities', label: 'Capacidades' },
                    { id: 'value', label: 'Valor Creado' },
                    { id: 'mutations', label: 'Mutaciones' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: activeTab === tab.id ? accentColor : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'hsl(var(--text-muted))',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'hardChoices' && renderHardChoices()}
            {activeTab === 'coalition' && renderCoalition()}
            {activeTab === 'capabilities' && renderCapabilities()}
            {activeTab === 'value' && renderMarketValue()}
            {activeTab === 'mutations' && renderMutations()}

            {/* AI Guide Section */}
            <div className="glass-panel" style={{
                marginTop: '3rem',
                padding: '1.5rem',
                background: 'linear-gradient(145deg, hsl(var(--bg-surface)), #fdf2f8)',
                border: `1px solid ${accentColor}`
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: accentColor, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🤖 GUÍA IA: Consultor de Estrategia Emergente
                    </h3>
                    <button
                        onClick={runAnalysis}
                        disabled={isAnalyzing}
                        className="btn-primary"
                        style={{
                            background: accentColor,
                            padding: '0.5rem 1rem',
                            opacity: isAnalyzing ? 0.7 : 1,
                            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    >
                        {isAnalyzing ? 'Analizando...' : '🔄 Analizar Estrategia Actual'}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, fontSize: '0.95rem', color: 'hsl(var(--text-main))', lineHeight: '1.6' }}>
                        {analysisResult.length > 0 ? (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {analysisResult.map((res, i) => (
                                    <div key={i} style={{
                                        padding: '1rem',
                                        background: 'rgba(255,255,255,0.6)',
                                        borderRadius: '8px',
                                        borderLeft: `5px solid ${res.type === 'KILL' ? '#ef4444' : res.type === 'DOUBLE_DOWN' ? '#22c55e' : '#f59e0b'}`,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                background: res.type === 'KILL' ? '#ef4444' : res.type === 'DOUBLE_DOWN' ? '#22c55e' : '#f59e0b',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}>
                                                {res.type}
                                            </span>
                                            <span style={{ fontWeight: 'bold' }}>
                                                {res.reasonCode === 'zombie' ? 'Proyecto Ineficiente' : res.reasonCode === 'resourceHog' ? 'Sobrecarga de Recursos' : 'Oportunidad de Crecimiento'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            {res.reasonCode === 'zombie' ? `${res.reasonParams.statement} tiene solo ${res.reasonParams.progress}% progreso tras el ${res.reasonParams.time}% del periodo.` :
                                                res.reasonCode === 'resourceHog' ? `La línea "${res.reasonParams.statement}" tiene ${res.reasonParams.count} iniciativas activas pero muy bajo progreso real.` :
                                                    `La iniciativa "${res.reasonParams.title}" muestra un avance excepcional (>80%) en horizontes futuros.`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: 'hsl(var(--text-muted))' }}>
                                <p><strong>Sugerencia Contextual:</strong></p>
                                {activeTab === 'hardChoices' && "He notado que las renuncias están muy enfocadas en producto. ¿Has considerado renuncias en segmentos de clientes?"}
                                {activeTab === 'coalition' && "La última conversación sobre precios no tuvo conclusión clara. Sugiero retomarla en el próximo ritual."}
                                {activeTab === 'capabilities' && "Revisa si la 'Velocidad de Entrega' es realmente una capacidad distintiva o solo un deseo."}
                                {activeTab === 'value' && "¿Cómo estás midiendo el valor más allá del revenue? Considera métricas de retención o NPS."}
                                {activeTab === 'mutations' && "Mantén los ojos abiertos a usos no esperados de tu producto por parte de los 'early adopters'."}
                                <p style={{ fontSize: '0.8rem', marginTop: '1rem', opacity: 0.7 }}>Haz clic en el botón superior para realizar un análisis profundo de los datos reales de OKRs e Iniciativas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
