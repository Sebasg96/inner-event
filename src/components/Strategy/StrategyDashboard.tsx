'use client';

import React, { useState } from 'react';
import { createPurpose, createAreaPurpose, createMega, createObjective, createKeyResult, updateKeyResult, updatePurpose, updateMega, updateObjectiveTitle, createOrganizationalValue, deleteOrganizationalValue, deleteObjective, updateObjectiveOwner, updateKeyResultOwner, deleteKeyResult } from '@/app/actions';
import styles from '@/app/strategy/page.module.css';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '../NavBar';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';
import EditableText from '@/components/EditableText';
import StrategyCascade from './StrategyCascade';
import KeyResultCreator from './KeyResultCreator';
import KeyResultProgressModal from './KeyResultProgressModal';
import WeightManagement from './WeightManagement';

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
    weight: number;
    owner?: { id: string, name: string, lastName: string | null } | null;
}

interface Objective {
    id: string;
    statement: string;
    keyResults: KeyResult[];
    childObjectives?: any[];
    weight: number;
    owner?: { id: string, name: string, lastName: string | null } | null;
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
    tenantUsers?: { id: string, name: string, lastName: string | null, role: string, area: string | null }[];
};

export default function StrategyDashboard({ purpose, areaPurpose, analysisData, organizationalValues = [], tenantUsers = [] }: StrategyDashboardProps) {
    const { dict } = useLanguage();
    const router = useRouter(); // Initialize router for redirects
    // Removed manual editing state
    const theme = useModuleTheme();
    const [showAreaPurpose, setShowAreaPurpose] = useState(!!areaPurpose?.statement);
    const [selectedKR, setSelectedKR] = useState<KeyResult | null>(null);
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') === 'WEIGHTS' ? 'WEIGHTS' : 'DASHBOARD';
    const [viewMode, setViewMode] = useState<'DASHBOARD' | 'WEIGHTS'>(initialTab);
    const [expandedObjectives, setExpandedObjectives] = useState<Record<string, boolean>>({});

    const toggleObjective = (id: string) => {
        setExpandedObjectives(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Effect to open KR from URL
    React.useEffect(() => {
        const openKrId = searchParams.get('openKrId');
        if (openKrId && purpose && purpose.megas) {
            // Helper to recursively find KR in objectives
            const searchObjectives = (objs: Objective[]): KeyResult | null => {
                for (const obj of objs) {
                    if (obj.keyResults) {
                        const found = obj.keyResults.find(k => k.id === openKrId);
                        if (found) return found;
                    }
                    if (obj.childObjectives) {
                        const foundChild = searchObjectives(obj.childObjectives);
                        if (foundChild) return foundChild;
                    }
                }
                return null;
            };

            // Iterate megas to find match
            let targetKR: KeyResult | null = null;
            for (const mega of purpose.megas) {
                if (mega.objectives) {
                    targetKR = searchObjectives(mega.objectives);
                    if (targetKR) break;
                }
            }

            if (targetKR) {
                setSelectedKR(targetKR);
                // Remove the query param so it doesn't reopen on refresh
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete('openKrId');
                router.replace(`/strategy/planning?${newParams.toString()}`, { scroll: false });
            }
        }
    }, [searchParams, purpose]);

    // Sync viewMode with URL search params
    React.useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'WEIGHTS') {
            setViewMode('WEIGHTS');
        } else {
            setViewMode('DASHBOARD');
        }
    }, [searchParams]);

    // Calculate Objective Progress (Weighted)
    const calculateObjectiveProgress = (objective: Objective) => {
        if (!objective.keyResults || objective.keyResults.length === 0) return 0;

        let totalWeightedProgress = 0;
        let totalWeight = 0;

        objective.keyResults.forEach(kr => {
            const weight = kr.weight || 1;
            const progress = kr.targetValue !== 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;

            totalWeightedProgress += progress * weight;
            totalWeight += weight;
        });

        return totalWeight === 0 ? 0 : Math.round(totalWeightedProgress / totalWeight);
    };

    // Calculate Global Stats Recursive (Weighted)
    const calculateGlobalStats = () => {
        if (!purpose || !purpose.megas) return { progress: 0, objectives: 0, krs: 0 };

        let totalMegasWeightedProgress = 0;
        let megasCount = 0;
        let totalObjectives = 0;
        let totalKRs = 0;

        purpose.megas.forEach(mega => {
            let totalObjWeightedProgress = 0;
            let totalObjWeight = 0;

            mega.objectives.forEach(obj => {
                totalObjectives++;
                if (obj.keyResults) totalKRs += obj.keyResults.length;

                const weight = obj.weight || 1;
                const progress = calculateObjectiveProgress(obj);

                totalObjWeightedProgress += progress * weight;
                totalObjWeight += weight;

                // Recursive objectives if any
                if (obj.childObjectives) {
                    const traverse = (objs: Objective[]) => {
                        objs.forEach(child => {
                            totalObjectives++;
                            if (child.keyResults) totalKRs += child.keyResults.length;
                            if (child.childObjectives) traverse(child.childObjectives);
                        });
                    };
                    traverse(obj.childObjectives);
                }
            });

            const megaProgress = totalObjWeight === 0 ? 0 : totalObjWeightedProgress / totalObjWeight;
            totalMegasWeightedProgress += megaProgress;
            megasCount++;
        });

        const globalProgress = megasCount === 0 ? 0 : Math.round(totalMegasWeightedProgress / megasCount);
        return { progress: globalProgress, objectives: totalObjectives, krs: totalKRs };
    };

    const stats = calculateGlobalStats();

    // Handle tab switching
    const handleTabChange = (mode: 'DASHBOARD' | 'WEIGHTS') => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (mode === 'WEIGHTS') {
            newParams.set('tab', 'WEIGHTS');
        } else {
            newParams.delete('tab');
        }
        router.replace(`?${newParams.toString()}`, { scroll: false });
        // The useEffect will pick up the URL change and update viewMode
    };

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

                    {/* Unified Stats Container */}
                    <div style={{ marginLeft: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.6)', padding: '0.4rem 1.2rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>

                        {/* Global Progress */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ position: 'relative', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="42" height="42" viewBox="0 0 40 40">
                                    <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                                    <circle
                                        cx="20" cy="20" r="16" fill="none" stroke={theme.color} strokeWidth="4"
                                        strokeDasharray={`${2 * Math.PI * 16}`}
                                        strokeDashoffset={`${2 * Math.PI * 16 * (1 - stats.progress / 100)}`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 20 20)"
                                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                                    />
                                </svg>
                                <span style={{ position: 'absolute', fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>{stats.progress}%</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cumplimiento</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Global</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>

                        {/* Extra Stats */}
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{stats.objectives}</span>
                                <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Objetivos</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{stats.krs}</span>
                                <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>KRs</span>
                            </div>
                        </div>

                    </div>
                </div>
                <NavBar />
            </div>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => handleTabChange('DASHBOARD')}
                    style={{
                        background: 'none',
                        border: 'none',
                        borderBottom: viewMode === 'DASHBOARD' ? `2px solid ${theme.color}` : '2px solid transparent',
                        color: viewMode === 'DASHBOARD' ? theme.color : '#64748b',
                        fontWeight: 700,
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    data-testid="strategy-tab-dashboard"
                >
                    Tablero Estratégico
                </button>
                <button
                    onClick={() => handleTabChange('WEIGHTS')}
                    style={{
                        background: 'none',
                        border: 'none',
                        borderBottom: viewMode === 'WEIGHTS' ? `2px solid ${theme.color}` : '2px solid transparent',
                        color: viewMode === 'WEIGHTS' ? theme.color : '#64748b',
                        fontWeight: 700,
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    data-testid="strategy-tab-weights"
                >
                    Ponderaciones
                </button>
            </div>

            {viewMode === 'WEIGHTS' ? (
                <WeightManagement purpose={purpose as any} themeColor={theme.color} />
            ) : (
                <>
                    {/* Cascade Tree inserted here to be top-level content after header */}
                    <StrategyCascade purpose={purpose as any} />

                    {/* Purpose Section - Pragma Style */}
                    <section
                        className={styles.section}
                        style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                            padding: '2rem',
                            marginTop: '2rem',
                            borderLeft: `6px solid ${theme.color}`,
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '0.75rem' }}>
                            <div style={{
                                background: `${theme.color}15`,
                                padding: '0.5rem',
                                borderRadius: '8px',
                                color: theme.color
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                            </div>
                            <h2 className={styles.sectionTitle} style={{ color: '#0f172a', marginBottom: 0, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>PROPÓSITO</h2>
                        </div>

                        {purpose ? (
                            <div className={styles.purposeDisplay} style={{ fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.6 }}>
                                <EditableText
                                    initialValue={purpose.statement}
                                    onSave={async (val) => { await updatePurpose(purpose.id, val); }}
                                    style={{
                                        color: '#334155',
                                        background: 'transparent',
                                        padding: '0.5rem',
                                        border: '1px solid transparent'
                                    }}
                                    className="white-surface"
                                    data-testid="strategy-purpose-input"
                                    required={true}
                                />
                            </div>
                        ) : (
                            <form action={createPurpose} className={styles.formRow}>
                                <input
                                    name="statement"
                                    placeholder={dict.strategy.purpose.placeholder}
                                    style={{ flex: 1, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155' }}
                                    required
                                    data-testid="strategy-purpose-new-input"
                                />
                                <button
                                    type="submit"
                                    data-testid="strategy-purpose-submit"
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
                                    Fijar propósito
                                </button>
                            </form>
                        )}

                        {/* Secondary Action: Enable Area Purpose */}
                        {!showAreaPurpose && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
                                <button
                                    onClick={() => setShowAreaPurpose(true)}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '0.5rem 1rem',
                                        color: '#64748b',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.color; e.currentTarget.style.color = theme.color; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                                    data-testid="strategy-add-area-purpose-btn"
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
                                    data-testid="strategy-hide-area-purpose-btn"
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
                                    style={{ color: 'hsl(var(--text-main))', background: 'rgba(0,0,0,0.03)' }}
                                    data-testid="strategy-area-purpose-input"
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
                                                            <div className={styles.objectiveTitle} style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.2rem', color: '#1e293b', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>

                                                                {/* Title Section (Flex Grow) */}
                                                                <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px', minWidth: 0 }}>
                                                                    <span style={{ color: theme.color, opacity: 0.8, fontSize: '0.75rem', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>#{j + 1}</span>
                                                                    <div style={{ flex: 1 }}>
                                                                        <EditableText
                                                                            initialValue={obj.statement}
                                                                            onSave={async (val) => { await updateObjectiveTitle(obj.id, val); }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Controls Section (Keeps together) */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', marginTop: '0.1rem' }}>
                                                                    {/* Expansion Toggle */}
                                                                    <button
                                                                        onClick={() => toggleObjective(obj.id)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            color: theme.color,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '4px',
                                                                            backgroundColor: `${theme.color}08`,
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 600,
                                                                            transition: 'all 0.2s ease'
                                                                        }}
                                                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${theme.color}15`)}
                                                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${theme.color}08`)}
                                                                    >
                                                                        <span>{expandedObjectives[obj.id] ? 'Ocultar KRs' : 'Ver KRs'}</span>
                                                                        {expandedObjectives[obj.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                    </button>

                                                                    {/* Objective Progress Bar */}
                                                                    <div style={{ width: '50px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                                        {(() => {
                                                                            const progress = calculateObjectiveProgress(obj);
                                                                            return (
                                                                                <div style={{
                                                                                    width: `${Math.min(progress, 100)}%`,
                                                                                    height: '100%',
                                                                                    background: progress >= 100 ? '#10b981' : theme.color,
                                                                                    transition: 'width 0.5s ease'
                                                                                }} title={`Progreso: ${progress}%`} />
                                                                            );
                                                                        })()}
                                                                    </div>

                                                                    {/* Owner Selection Mini-UI */}
                                                                    <div style={{ position: 'relative' }}>
                                                                        <select
                                                                            value={obj.owner?.id || ""}
                                                                            onChange={async (e) => {
                                                                                const newOwnerId = e.target.value === "" ? null : e.target.value;
                                                                                await updateObjectiveOwner(obj.id, newOwnerId);
                                                                            }}
                                                                            style={{
                                                                                appearance: 'none',
                                                                                backgroundColor: obj.owner ? '#e0f2fe' : 'transparent',
                                                                                border: obj.owner ? '1px solid #7dd3fc' : '1px dashed #cbd5e1',
                                                                                borderRadius: '20px',
                                                                                padding: '2px 8px',
                                                                                paddingRight: '20px',
                                                                                fontSize: '0.75rem',
                                                                                color: obj.owner ? '#0369a1' : '#94a3b8',
                                                                                cursor: 'pointer',
                                                                                maxWidth: '120px',
                                                                                whiteSpace: 'nowrap',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                                                                backgroundRepeat: 'no-repeat',
                                                                                backgroundPosition: 'right 4px center'
                                                                            }}
                                                                            title={obj.owner ? `Responsable actual: ${obj.owner.name}` : "Asignar responsable"}
                                                                        >
                                                                            <option value="">👤 Asignar</option>
                                                                            {tenantUsers.map(u => (
                                                                                <option key={u.id} value={u.id}>
                                                                                    {u.name} {u.lastName || ''}
                                                                                </option>
                                                                            ))}
                                                                        </select>
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
                                                            </div>

                                                            <div style={{ flex: 1, display: expandedObjectives[obj.id] ? 'block' : 'none' }}>
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
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                                                <div style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', color: '#475569', fontWeight: 500, lineHeight: '1.4' }}>
                                                                                    {kr.statement}
                                                                                </div>

                                                                                {/* KR Controls Group */}
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                                                                    {/* KR Owner Selector */}
                                                                                    <div style={{ position: 'relative' }}>
                                                                                        <select
                                                                                            value={kr.owner?.id || ""}
                                                                                            onChange={async (e) => {
                                                                                                e.stopPropagation(); // Prevent drag/click conflcits
                                                                                                const newOwnerId = e.target.value === "" ? null : e.target.value;
                                                                                                await updateKeyResultOwner(kr.id, newOwnerId);
                                                                                            }}
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                            style={{
                                                                                                appearance: 'none',
                                                                                                backgroundColor: kr.owner ? '#e0f2fe' : 'transparent',
                                                                                                border: kr.owner ? '1px solid #7dd3fc' : '1px dashed #cbd5e1',
                                                                                                borderRadius: '20px',
                                                                                                padding: '1px 6px',
                                                                                                paddingRight: '16px',
                                                                                                fontSize: '0.65rem',
                                                                                                color: kr.owner ? '#0369a1' : '#94a3b8',
                                                                                                cursor: 'pointer',
                                                                                                maxWidth: '80px',
                                                                                                whiteSpace: 'nowrap',
                                                                                                overflow: 'hidden',
                                                                                                textOverflow: 'ellipsis',
                                                                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                                                                                backgroundRepeat: 'no-repeat',
                                                                                                backgroundPosition: 'right 2px center'
                                                                                            }}
                                                                                            title={kr.owner ? `Responsable actual: ${kr.owner.name}` : "Asignar responsable"}
                                                                                        >
                                                                                            <option value="">👤</option>
                                                                                            {tenantUsers.map(u => (
                                                                                                <option key={u.id} value={u.id}>
                                                                                                    {u.name} {u.lastName || ''}
                                                                                                </option>
                                                                                            ))}
                                                                                        </select>
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
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (window.confirm("¿Estás seguro de que deseas eliminar este Resultado Clave (KR)?")) {
                                                                                                deleteKeyResult(kr.id);
                                                                                            }
                                                                                        }}
                                                                                        style={{
                                                                                            background: 'none',
                                                                                            border: 'none',
                                                                                            cursor: 'pointer',
                                                                                            color: '#ef4444',
                                                                                            padding: '0 4px',
                                                                                            opacity: 0.4,
                                                                                            display: 'flex',
                                                                                            alignItems: 'center'
                                                                                        }}
                                                                                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                                                                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                                                                                        title="Eliminar KR"
                                                                                    >
                                                                                        <Trash2 size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            {/* Dual Progress Bars Container */}
                                                                            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                                                                                {/* 1. Intrinsic KR Progress */}
                                                                                <div
                                                                                    onClick={() => setSelectedKR(kr)}
                                                                                    style={{ cursor: 'pointer' }}
                                                                                    title="Clic para actualizar avance del KR"
                                                                                >
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                                                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Avance KR</span>
                                                                                        <span style={{ fontSize: '0.65rem', color: '#0ea5e9', fontWeight: 700 }}>{Math.round((kr.currentValue / kr.targetValue) * 100)}%</span>
                                                                                    </div>
                                                                                    <div style={{ height: '6px', background: '#e0f2fe', borderRadius: '3px', overflow: 'hidden' }}>
                                                                                        <div style={{
                                                                                            width: `${Math.min((kr.currentValue / kr.targetValue) * 100, 100)}%`,
                                                                                            height: '100%',
                                                                                            background: '#0ea5e9',
                                                                                            borderRadius: '3px',
                                                                                            transition: 'width 0.5s ease'
                                                                                        }} />
                                                                                    </div>
                                                                                </div>

                                                                                {/* 2. Linked Initiatives Progress */}
                                                                                <div
                                                                                    onClick={() => router.push('/strategy/execution')}
                                                                                    style={{ cursor: 'pointer' }}
                                                                                    title="Clic para ver tablero kanban"
                                                                                >
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                                                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Iniciativas</span>
                                                                                        {kr.initiatives && kr.initiatives.length > 0 && (
                                                                                            <span style={{ fontSize: '0.65rem', color: theme.color, fontWeight: 700 }}>
                                                                                                {Math.round(kr.initiatives.reduce((acc, curr) => acc + (curr.progress || 0), 0) / kr.initiatives.length)}%
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div style={{
                                                                                        height: kr.initiatives && kr.initiatives.length > 0 ? '6px' : '20px',
                                                                                        background: '#f1f5f9',
                                                                                        borderRadius: '3px',
                                                                                        overflow: 'hidden',
                                                                                        border: '1px solid #e2e8f0',
                                                                                        transition: 'height 0.2s ease'
                                                                                    }}>
                                                                                        {kr.initiatives && kr.initiatives.length > 0 ? (
                                                                                            <div style={{
                                                                                                height: '100%',
                                                                                                width: `${Math.round(kr.initiatives.reduce((acc, curr) => acc + (curr.progress || 0), 0) / kr.initiatives.length)}%`,
                                                                                                background: theme.color,
                                                                                                opacity: 0.8,
                                                                                                borderRadius: '2px',
                                                                                                transition: 'width 0.5s ease'
                                                                                            }} />
                                                                                        ) : (
                                                                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                                + Vincular
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <KeyResultCreator objectiveId={obj.id} megaDeadline={mega.deadline} />
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
                </>
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
