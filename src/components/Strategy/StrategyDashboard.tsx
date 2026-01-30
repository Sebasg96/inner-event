'use client';

import React, { useState } from 'react';
import { createPurpose, createAreaPurpose, createMega, createObjective, createKeyResult, updateKeyResult, updatePurpose, updateMega, updateObjectiveTitle, createOrganizationalValue, deleteOrganizationalValue, deleteObjective } from '@/app/actions';
import styles from '@/app/strategy/page.module.css';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '../NavBar';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';
import EditableText from '@/components/EditableText';
import StrategyCascade from './StrategyCascade';
import KeyResultCreator from './KeyResultCreator';
import KeyResultProgressModal from './KeyResultProgressModal';

// Define flexible interfaces for the nested strategy data
interface Initiative {
    id: string;
    title: string;
    progress: number;
    status: string;
}

interface KeyResult {
    id: string;
    statement: string;
    initiatives: Initiative[];
    targetValue: number;
    currentValue: number;
    metricUnit: string;
    numeratorValue?: number;
    denominatorValue?: number;
    numeratorLabel?: string;
    denominatorLabel?: string;
    trackingType: 'PERCENTAGE' | 'UNITS';
    updates?: any[];
}

interface Objective {
    id: string;
    statement: string;
    keyResults: KeyResult[];
    childObjectives?: any[];
    owner?: any;
}

interface Mega {
    id: string;
    statement: string;
    deadline: string | Date;
    objectives: Objective[];
}

interface Purpose {
    id: string;
    statement: string;
    megas: Mega[];
}

interface AreaPurpose {
    id: string;
    statement: string;
}

interface OrganizationalValue {
    id: string;
    statement: string;
}

type StrategyDashboardProps = {
    purpose: Purpose | null;
    areaPurpose?: AreaPurpose | null;
    analysisData?: Record<string, any>; // Keeping loose for analysis blob
    organizationalValues?: OrganizationalValue[];
};

export default function StrategyDashboard({ purpose, areaPurpose, analysisData, organizationalValues = [] }: StrategyDashboardProps) {
    const { dict } = useLanguage();
    const router = useRouter(); // Initialize router for redirects
    // Removed manual editing state
    const theme = useModuleTheme();
    const [showAreaPurpose, setShowAreaPurpose] = useState(!!areaPurpose?.statement);
    const [selectedKR, setSelectedKR] = useState<KeyResult | null>(null);

    return (
        <div className={styles.container}>
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 className={styles.header} style={{
                        fontSize: '1.5rem',
                        color: 'hsl(var(--primary))',
                        marginBottom: 0,
                        borderLeft: '1px solid hsl(var(--border-glass))',
                        paddingLeft: '1rem',
                        marginLeft: '0.5rem'
                    }}>{dict.strategy.title}</h1>
                </div>
                <NavBar />
            </div>

            {/* Cascade Tree inserted here to be top-level content after header */}
            <StrategyCascade purpose={purpose as any} />

            {/* Purpose Section */}
            <section className={`glass-panel ${styles.section}`} style={{ border: theme.border, boxShadow: theme.glow }}>
                <h2 className={styles.sectionTitle} style={{ color: theme.color }}>PROPÓSITO</h2>
                {purpose ? (
                    <div className={styles.purposeDisplay} style={{ fontSize: '1.5rem', fontWeight: 500 }}>
                        <EditableText
                            initialValue={purpose.statement}
                            onSave={async (val) => { await updatePurpose(purpose.id, val); }}
                        />
                    </div>
                ) : (
                    <form action={createPurpose} className={styles.formRow}>
                        <input
                            name="statement"
                            placeholder={dict.strategy.purpose.placeholder}
                            style={{ flex: 1 }}
                            required
                        />
                        <button type="submit" className="btn-primary">
                            {dict.strategy.purpose.button}
                        </button>
                    </form>
                )}

                {/* Secondary Action: Enable Area Purpose */}
                {!showAreaPurpose && (
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                        <button
                            onClick={() => setShowAreaPurpose(true)}
                            style={{
                                background: 'transparent',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '20px',
                                padding: '0.5rem 1rem',
                                color: '#64748b',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span>+</span> Agregar Propósito de Área
                        </button>
                    </div>
                )}
            </section>

            {/* Area Purpose Section */}
            {showAreaPurpose && (
                <section className={`glass-panel ${styles.section}`} style={{ border: theme.border, boxShadow: theme.glow, marginTop: '2rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 className={styles.sectionTitle} style={{ color: theme.color, marginBottom: 0 }}>PROPÓSITO DE ÁREA</h2>
                        <button
                            onClick={() => setShowAreaPurpose(false)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                            title="Ocultar sección"
                        >
                            Ocultar
                        </button>
                    </div>

                    <div className={styles.purposeDisplay} style={{ fontStyle: 'italic', opacity: 1, color: 'hsl(var(--text-main))' }}>
                        <EditableText
                            initialValue={areaPurpose?.statement || ''}
                            onSave={async (val) => {
                                if (areaPurpose) {
                                    await updatePurpose(areaPurpose.id, val);
                                } else {
                                    // Create new Area Purpose
                                    await createAreaPurpose(val);
                                }
                            }}
                            placeholder="Definir Propósito de Área..."
                        />
                    </div>
                </section>
            )}

            {/* Organizational Values Section */}
            <section className={`glass-panel ${styles.section}`} style={{ border: theme.border, boxShadow: theme.glow, marginTop: '2rem' }}>
                <h2 className={styles.sectionTitle} style={{ color: theme.color }}>VALORES ORGANIZACIONALES</h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    {organizationalValues.map((value) => (
                        <div key={value.id} style={{
                            background: 'rgba(255,255,255,0.8)',
                            border: `1px solid ${theme.color}`,
                            borderRadius: '20px',
                            padding: '0.5rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: 500
                        }}>
                            <span>{value.statement}</span>
                            <form action={async () => { await deleteOrganizationalValue(value.id); }}>
                                <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem', padding: 0 }}>×</button>
                            </form>
                        </div>
                    ))}
                </div>

                {organizationalValues.length < 10 && (
                    <form action={createOrganizationalValue} style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
                        <input
                            name="statement"
                            placeholder="Agregar nuevo valor..."
                            required
                            maxLength={50}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>+</button>
                    </form>
                )}
            </section>

            {/* Megas Section */}
            {purpose && (
                <section className={`glass-panel ${styles.section}`} style={{ border: theme.border, boxShadow: theme.glow, marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 className={styles.sectionTitle} style={{ marginBottom: 0, color: theme.color }}>MEGAS (Gran Destino)</h2>

                        {/* Mega Form with AI */}
                        <MegaCreator purposeId={purpose.id} areaPurpose={areaPurpose?.statement || ''} placeholder={dict.strategy.megas.placeholder} themeColor={theme.color} />
                    </div>

                    <div className={styles.megaGrid}>
                        {purpose.megas.map((mega, i) => (
                            <div key={mega.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '4rem' }}>
                                {/* Mega Content Layout */}
                                <div className={styles.megaContentWrapper}>
                                    {/* Mega Header Card */}
                                    <div className={styles.megaCard} style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        padding: '1.5rem 2rem',
                                        border: 'none',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: theme.color }}></div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                textTransform: 'uppercase',
                                                letterSpacing: '2px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                color: theme.color,
                                                marginBottom: '0.25rem',
                                                opacity: 0.8
                                            }}>
                                                MEGA {i + 1}
                                            </div>
                                            <h3 className={styles.megaTitle} style={{ marginBottom: 0, fontSize: '1.5rem', fontWeight: 700, color: 'black' }}>
                                                <EditableText
                                                    initialValue={mega.statement}
                                                    onSave={async (val) => { await updateMega(mega.id, val); }}
                                                />
                                            </h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <span style={{
                                                background: '#0f172a',
                                                color: 'white',
                                                padding: '0.4rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 500
                                            }}>
                                                Vence: {mega.deadline ? new Date(mega.deadline).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : 'Sin fecha'}
                                            </span>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("⚠️ ATENCIÓN: ¿Estás seguro de que deseas eliminar esta Mega?\n\nEsta acción eliminará TODOS los Objetivos y Resultados Clave (KRs) asociados. No se puede deshacer.")) {
                                                        const { deleteMega } = await import('@/app/actions');
                                                        await deleteMega(mega.id);
                                                    }
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: '1px solid #ef4444',
                                                    color: '#ef4444',
                                                    borderRadius: '50%',
                                                    width: '32px',
                                                    height: '32px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Eliminar Mega Completa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Objectives Grid */}
                                    <div style={{
                                        background: '#f1f5f9',
                                        borderRadius: '16px',
                                        padding: '2rem',
                                    }}>
                                        {/* Grid Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1.4rem' }}>🎯</span> OBJETIVOS ESTRATÉGICOS
                                            </h4>

                                            <form action={createObjective} style={{ display: 'flex', gap: '0.75rem', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <input type="hidden" name="megaId" value={mega.id} />
                                                <input
                                                    name="statement"
                                                    placeholder="Definir nuevo objetivo..."
                                                    required
                                                    className={styles.visiblePlaceholder}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.7rem 1rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid #cbd5e1',
                                                        background: 'white',
                                                        fontSize: '0.9rem',
                                                        minWidth: '200px',
                                                        color: 'black'
                                                    }}
                                                />
                                                <button
                                                    type="submit"
                                                    style={{
                                                        background: theme.color,
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.7rem 1.2rem',
                                                        borderRadius: '8px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                >
                                                    + Objetivo
                                                </button>
                                            </form>
                                        </div>

                                        <div className={styles.objectivesGrid}>
                                            {mega.objectives.map((obj, j) => (
                                                <div key={obj.id} style={{
                                                    background: 'white',
                                                    borderRadius: '12px',
                                                    padding: '1.5rem',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                    border: '1px solid #e2e8f0',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    height: '100%'
                                                }}>
                                                    <div className={styles.objectiveTitle} style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.2rem', color: '#1e293b', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                        <span style={{ color: theme.color, opacity: 0.8, fontSize: '0.75rem', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>#{j + 1}</span>
                                                        <div style={{ flex: 1 }}>
                                                            <EditableText
                                                                initialValue={obj.statement}
                                                                onSave={async (val) => { await updateObjectiveTitle(obj.id, val); }}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm("¿Estás seguro de que deseas eliminar este objetivo?")) {
                                                                    deleteObjective(obj.id);
                                                                }
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: '#ef4444',
                                                                opacity: 0.4,
                                                                padding: '2px'
                                                            }}
                                                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    <div style={{ flex: 1 }}>
                                                        <div className={styles.krList}>
                                                            {obj.keyResults.map((kr, k) => (
                                                                /* Simplified KR Item for Grid */
                                                                <div key={kr.id} style={{
                                                                    background: '#f8fafc',
                                                                    padding: '0.75rem',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #e2e8f0',
                                                                    marginBottom: '0.5rem'
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                        <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500, lineHeight: '1.3' }}>
                                                                            {kr.statement}
                                                                        </div>
                                                                        <div
                                                                            onClick={() => setSelectedKR(kr)}
                                                                            style={{
                                                                                fontSize: '0.7rem',
                                                                                fontWeight: 700,
                                                                                color: theme.color,
                                                                                background: 'white',
                                                                                padding: '2px 6px',
                                                                                borderRadius: '4px',
                                                                                border: '1px solid #e2e8f0',
                                                                                cursor: 'pointer',
                                                                                whiteSpace: 'nowrap',
                                                                                height: 'fit-content'
                                                                            }}
                                                                        >
                                                                            {Math.round((kr.currentValue / kr.targetValue) * 100)}%
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        onClick={() => router.push('/strategy/execution')}
                                                                        title={kr.initiatives && kr.initiatives.length > 0 ? "Ver iniciativas vinculadas" : "Crear primera iniciativa"}
                                                                        style={{
                                                                            height: '8px',
                                                                            background: '#e2e8f0',
                                                                            borderRadius: '4px',
                                                                            overflow: 'hidden',
                                                                            marginTop: '0.5rem',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s',
                                                                            position: 'relative'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 8px ${theme.color}44`}
                                                                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                                                    >
                                                                        {kr.initiatives && kr.initiatives.length > 0 ? (
                                                                            <div style={{
                                                                                height: '100%',
                                                                                width: `${Math.round(kr.initiatives.reduce((acc, curr) => acc + (curr.progress || 0), 0) / kr.initiatives.length)}%`,
                                                                                background: theme.color,
                                                                                opacity: 0.9
                                                                            }} />
                                                                        ) : (
                                                                            <div style={{
                                                                                height: '100%',
                                                                                width: '100%',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                fontSize: '0.6rem',
                                                                                color: '#94a3b8',
                                                                                fontWeight: 600,
                                                                                textTransform: 'uppercase'
                                                                            }}>
                                                                                + Iniciativas
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <KeyResultCreator objectiveId={obj.id} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Modal para actualizar progreso */}
            {selectedKR && (
                <KeyResultProgressModal
                    isOpen={!!selectedKR}
                    onClose={() => setSelectedKR(null)}
                    kr={selectedKR as any}
                />
            )}
        </div>
    );
}

function MegaCreator({ purposeId, areaPurpose, placeholder, themeColor }: { purposeId: string, areaPurpose: string, placeholder: string, themeColor: string }) {
    const [suggestion, setSuggestion] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSuggest = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai/suggest-mega', {
                method: 'POST',
                body: JSON.stringify({ purpose: `(ID: ${purposeId})`, areaPurpose }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.suggestion) {
                setSuggestion(data.suggestion);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form action={createMega} className={styles.formRow}>
            <input type="hidden" name="purposeId" value={purposeId} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                    name="statement"
                    placeholder={placeholder}
                    required
                    defaultValue={suggestion}
                    key={suggestion} // re-render on suggestion
                    style={{ minWidth: '300px' }}
                />
                <button
                    type="button"
                    onClick={handleSuggest}
                    disabled={loading}
                    className="btn-secondary"
                    style={{
                        position: 'absolute',
                        right: '5px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem'
                    }}
                    title="Pedir sugerencia a PRAGM-IA"
                >
                    {loading ? '⏳' : '✨'}
                </button>
            </div>
            <input name="deadline" type="date" required />
            <button
                type="submit"
                style={{
                    background: '#0f172a',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginLeft: '1rem'
                }}
                title="Agregar Mega"
            >
                +
            </button>
        </form>
    );
}
