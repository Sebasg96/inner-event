'use client';

import React, { useState } from 'react';
import { createPurpose, createAreaPurpose, createMega, createObjective, createKeyResult, updateKeyResult, updatePurpose, updateMega, updateObjectiveTitle, createOrganizationalValue, deleteOrganizationalValue, createStrategicAxis, deleteStrategicAxis, deleteObjective, updateObjectiveOwner, updateObjectiveStrategicAxis, updateKeyResultOwner, deleteKeyResult, updateKeyResultValue } from '@/app/actions';
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
import KRCheckInModal from './KRCheckInModal';
import WeightManagement from './WeightManagement';
import StrategyHealthReport from './StrategyHealthReport';
import MetasSection from '@/components/Dashboard/v3/MetasSection';
import { MeasurementDirection } from '@prisma/client';
import { calculateKRProgress } from '@/lib/krUtils';

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
    measurementDirection: MeasurementDirection;
    updates?: any[];
    weight: number;
    updatePeriodicity?: string | null;
    owner?: { id: string, name: string, lastName: string | null } | null;
}

interface Objective {
    id: string;
    statement: string;
    strategicAxisId?: string | null;
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

interface StrategicAxis {
    id: string;
    statement: string;
}

type StrategyDashboardProps = {
    purpose: Purpose | null;
    areaPurpose?: AreaPurpose | null;
    analysisData?: Record<string, any>; // Keeping loose for analysis blob
    organizationalValues?: OrganizationalValue[];
    strategicAxes?: StrategicAxis[];
    tenantUsers?: { id: string, name: string, lastName: string | null, role: string, area: string | null }[];
    user?: any; // Loosening type to avoid Prisma enum/extra fields mismatches
    strategicGoals?: any[];
};

export default function StrategyDashboard({ purpose, areaPurpose, analysisData, organizationalValues = [], strategicAxes = [], tenantUsers = [], user, strategicGoals = [] }: StrategyDashboardProps) {
    const { dict } = useLanguage();
    const router = useRouter(); // Initialize router for redirects
    // Removed manual editing state
    const theme = useModuleTheme();
    const [showAreaPurpose, setShowAreaPurpose] = useState(!!areaPurpose?.statement);
    const [selectedKR, setSelectedKR] = useState<KeyResult | null>(null);
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') === 'WEIGHTS' ? 'WEIGHTS' : (searchParams.get('tab') === 'HEALTH' ? 'HEALTH' : 'DASHBOARD');
    const [viewMode, setViewMode] = useState<'DASHBOARD' | 'WEIGHTS' | 'HEALTH'>(initialTab);
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
        } else if (tab === 'HEALTH') {
            setViewMode('HEALTH');
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

            // Use centralized logic for progress calculation
            const achievementValue = kr.trackingType === 'PERCENTAGE' ? kr.currentValue : kr.currentValue;
            // Wait, for PERCENTAGE, currentValue is already the fulfillment. 
            // For UNITS, currentValue is the raw value.
            // krUtils handle this: achievementValue is the raw value (or fulfillment if PERCENTAGE)
            const progress = calculateKRProgress(kr.measurementDirection, kr.currentValue, kr.targetValue);

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
    const handleTabChange = (mode: 'DASHBOARD' | 'WEIGHTS' | 'HEALTH') => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (mode === 'WEIGHTS') {
            newParams.set('tab', 'WEIGHTS');
        } else if (mode === 'HEALTH') {
            newParams.set('tab', 'HEALTH');
        } else {
            newParams.delete('tab');
        }
        router.replace(`?${newParams.toString()}`, { scroll: false });
        // The useEffect will pick up the URL change and update viewMode
    };

    // Extract KRs owned by the current user for the Weekly Check-in
    const extractMyKRs = () => {
        if (!purpose || !purpose.megas || !user) return [];
        const result: KeyResult[] = [];

        const traverseObjectives = (objs: Objective[]) => {
            objs.forEach(obj => {
                if (obj.keyResults) {
                    obj.keyResults.forEach(kr => {
                        if (kr.owner?.id === user.id) {
                            result.push(kr);
                        }
                    });
                }
                if (obj.childObjectives) traverseObjectives(obj.childObjectives);
            });
        };

        purpose.megas.forEach(mega => traverseObjectives(mega.objectives));
        return result;
    };

    const myKRs = extractMyKRs();

    return (
        <div className={styles.container} style={{
            background: 'hsl(var(--bg-app))',
            minHeight: '100vh',
            padding: '2rem',
            '--glass-panel-shadow': '0 0 20px hsl(var(--module-strategy) / 0.3)'
        } as React.CSSProperties}>
            <div className="glass-panel" style={{ padding: '1.25rem 2rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <h1 className={styles.header} style={{
                        fontSize: '1.75rem',
                        color: '#fff',
                        fontWeight: 900,
                        margin: 0,
                        letterSpacing: '-0.5px',
                        textShadow: '0 0 20px rgba(255,255,255,0.1)'
                    }}>{dict.strategy.title}</h1>

                    {/* Unified Stats Container - Command Center Style */}
                    <div style={{ marginLeft: '1.5rem', display: 'flex', alignItems: 'center', gap: '2.5rem' }}>

                        {/* Global Progress */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div data-testid="strategy-global-progress" style={{ position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="48" height="48" viewBox="0 0 40 40">
                                    <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                                    <circle
                                        cx="20" cy="20" r="17" fill="none" stroke={theme.color} strokeWidth="4"
                                        strokeDasharray={`${2 * Math.PI * 17}`}
                                        strokeDashoffset={`${2 * Math.PI * 17 * (1 - stats.progress / 100)}`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 20 20)"
                                        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 8px ${theme.color}60)` }}
                                    />
                                </svg>
                                <span style={{ position: 'absolute', fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>{stats.progress}%</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>CUMPLIMIENTO</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>GLOBAL</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.12)' }}></div>

                        {/* Extra Stats */}
                        <div style={{ display: 'flex', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>OBJETIVOS</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{stats.objectives}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>KRs</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{stats.krs}</span>
                            </div>
                        </div>

                    </div>

                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {myKRs.length > 0 && (
                        <button
                            onClick={() => setIsCheckInOpen(true)}
                            className="premium-button"
                            data-testid="strategy-weekly-checkin-btn"
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '0.6rem 1.25rem',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>✅</span>
                            Check-in Semanal {myKRs.length > 0 && `(${myKRs.length})`}
                        </button>
                    )}
                    <NavBar />
                </div>
            </div>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '2.5rem', alignSelf: 'flex-start', backdropFilter: 'blur(10px)' }}>
                <button
                    onClick={() => handleTabChange('DASHBOARD')}
                    data-testid="strategy-tab-dashboard"
                    style={{
                        padding: '0.7rem 1.75rem',
                        borderRadius: '13px',
                        border: 'none',
                        background: viewMode === 'DASHBOARD' ? 'rgba(255,255,255,0.9)' : 'transparent',
                        color: viewMode === 'DASHBOARD' ? '#0f172a' : 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: viewMode === 'DASHBOARD' ? `0 0 20px rgba(255,255,255,0.15)` : 'none',
                        letterSpacing: '0.5px'
                    }}
                >
                    TABLERO
                </button>
                <button
                    onClick={() => handleTabChange('WEIGHTS')}
                    data-testid="strategy-tab-weights"
                    style={{
                        padding: '0.7rem 1.75rem',
                        borderRadius: '13px',
                        border: 'none',
                        background: viewMode === 'WEIGHTS' ? 'rgba(255,255,255,0.9)' : 'transparent',
                        color: viewMode === 'WEIGHTS' ? '#0f172a' : 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: viewMode === 'WEIGHTS' ? `0 0 20px rgba(255,255,255,0.15)` : 'none',
                        letterSpacing: '0.5px'
                    }}
                >
                    PONDERACIONES
                </button>
                <button
                    onClick={() => handleTabChange('HEALTH')}
                    data-testid="strategy-tab-health"
                    style={{
                        padding: '0.7rem 1.75rem',
                        borderRadius: '13px',
                        border: 'none',
                        background: viewMode === 'HEALTH' ? 'rgba(255,255,255,0.9)' : 'transparent',
                        color: viewMode === 'HEALTH' ? '#0f172a' : 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: viewMode === 'HEALTH' ? `0 0 20px rgba(255,255,255,0.15)` : 'none',
                        letterSpacing: '0.5px'
                    }}
                >
                    SALUD OKR
                </button>
            </div>

            {
                viewMode === 'DASHBOARD' && (
                    <>
                        <StrategyCascade purpose={purpose as any} />

                        <section className={`glass-panel ${styles.section}`} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', marginTop: '2rem', borderRadius: '24px', padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 className={styles.sectionTitle} style={{ marginBottom: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>PROPÓSITOS</h2>
                                {!showAreaPurpose && (
                                    <button
                                        onClick={() => setShowAreaPurpose(true)}
                                        data-testid="strategy-add-area-purpose"
                                        style={{ background: 'transparent', border: 'none', color: theme.color, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        + Agregar Propósito de Área
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                <div data-testid="strategy-purpose-org" className={styles.megaCard} style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', backdropFilter: 'blur(5px)' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: theme.color, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>🎯 Organizacional</div>
                                    <EditableText
                                        initialValue={purpose?.statement || ''}
                                        onSave={async (val) => { if (purpose) await updatePurpose(purpose.id, val); }}
                                        placeholder="Propósito organizacional..."
                                        style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}
                                    />
                                </div>

                                {showAreaPurpose && (
                                    <div data-testid="strategy-purpose-area" className={styles.megaCard} style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', backdropFilter: 'blur(5px)', position: 'relative' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: theme.color, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>🏢 de Área</div>
                                        <EditableText
                                            initialValue={areaPurpose?.statement || ''}
                                            onSave={async (val) => {
                                                if (areaPurpose) await updatePurpose(areaPurpose.id, val);
                                                else await createAreaPurpose(val);
                                            }}
                                            placeholder="Propósito de área..."
                                            style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}
                                        />
                                        {!areaPurpose && (
                                            <button onClick={() => setShowAreaPurpose(false)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>×</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className={`glass-panel ${styles.section}`} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', marginTop: '2rem', borderRadius: '24px', padding: '2rem' }}>
                            <h2 className={styles.sectionTitle} style={{ color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.1rem' }}>VALORES ORGANIZACIONALES</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                                {organizationalValues.map((value) => (
                                    <div key={value.id} style={{ background: 'rgba(0, 179, 161, 0.1)', border: '1px solid rgba(0, 179, 161, 0.3)', color: '#00b3a1', borderRadius: '20px', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 0 10px rgba(0, 179, 161, 0.1)' }}>
                                        <span>{value.statement}</span>
                                        <form action={async () => { await deleteOrganizationalValue(value.id); }}>
                                            <button type="submit" data-testid="strategy-delete-value-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00b3a1', padding: 0, fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                            {organizationalValues.length < 10 && (
                                <form action={createOrganizationalValue} style={{ display: 'flex', gap: '0.75rem', maxWidth: '400px' }}>
                                    <input name="statement" data-testid="strategy-add-value-input" placeholder="Nuevo valor..." required maxLength={50} style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                                    <button type="submit" data-testid="strategy-add-value-btn" className="btn-secondary" style={{ background: theme.color, border: 'none', borderRadius: '12px', color: '#fff', width: '40px', fontWeight: 900 }}>+</button>
                                </form>
                            )}
                        </section>

                        <section className={`glass-panel ${styles.section}`} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', marginTop: '2rem', borderRadius: '24px', padding: '2rem' }}>
                            <h2 className={styles.sectionTitle} style={{ color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.1rem' }}>EJES ESTRATÉGICOS</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                                {strategicAxes.map((axis) => (
                                    <div key={axis.id} style={{ background: 'rgba(0, 179, 161, 0.1)', border: '1px solid rgba(0, 179, 161, 0.3)', color: '#00b3a1', borderRadius: '20px', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 0 10px rgba(0, 179, 161, 0.1)' }}>
                                        <span>{axis.statement}</span>
                                        <form action={async () => { await deleteStrategicAxis(axis.id); }}>
                                            <button type="submit" data-testid="strategy-delete-axis-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00b3a1', padding: 0, fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                            {strategicAxes.length < 5 && (
                                <form action={createStrategicAxis} style={{ display: 'flex', gap: '0.75rem', maxWidth: '400px' }}>
                                    <input name="statement" data-testid="strategy-add-axis-input" placeholder="Nuevo eje..." required maxLength={100} style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
                                    <button type="submit" data-testid="strategy-add-axis-btn" className="btn-secondary" style={{ background: theme.color, border: 'none', borderRadius: '12px', color: '#fff', width: '40px', fontWeight: 900 }}>+</button>
                                </form>
                            )}
                            <MetasSection themeColor={theme.color} metas={strategicGoals} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                <h2 className={styles.sectionTitle} style={{ marginBottom: 0, color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.2rem' }}>MEGAS</h2>
                                {purpose && <MegaCreator purposeId={purpose.id} areaPurpose={areaPurpose?.statement || ''} placeholder={dict.strategy.megas.placeholder} themeColor={theme.color} />}
                            </div>
                            <div className={styles.megaGrid}>
                                {purpose?.megas.map((mega, i) => (
                                    <div key={mega.id} style={{ marginBottom: '3.5rem' }}>
                                        <div className={styles.megaCard} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: theme.color, boxShadow: `0 0 15px ${theme.color}` }}></div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 950, color: theme.color, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.25rem' }}>MEGA {i + 1}</div>
                                                <h3 style={{ margin: 0, fontWeight: 900, color: '#fff', fontSize: '1.35rem' }}><EditableText initialValue={mega.statement} onSave={async (val) => await updateMega(mega.id, val)} /></h3>
                                            </div>
                                            <button onClick={async () => { if (confirm("¿Eliminar Mega?")) (await import('@/app/actions')).deleteMega(mega.id); }} data-testid="strategy-mega-delete-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}><Trash2 size={16} /></button>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '24px', padding: '2rem', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                                <div style={{ width: '3px', height: '14px', background: theme.color, borderRadius: '2px' }} />
                                                <h3 style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.8rem' }}>
                                                    {dict.strategy.objectives.title}
                                                </h3>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                                {mega.objectives.map((obj, j) => (
                                                    <div key={obj.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '20px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s, background 0.2s', position: 'relative' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: theme.color, background: `${theme.color}20`, padding: '2px 8px', borderRadius: '6px' }}>OBJ {j + 1}</span>
                                                                </div>
                                                                <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 800, lineHeight: 1.4 }}>
                                                                    <EditableText initialValue={obj.statement} onSave={async (val) => await updateObjectiveTitle(obj.id, val)} />
                                                                </h4>
                                                            </div>
                                                            <button onClick={() => toggleObjective(obj.id)} data-testid="strategy-objective-expand-btn" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '8px', padding: '4px' }}>
                                                                {expandedObjectives[obj.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                            </button>
                                                        </div>

                                                        {expandedObjectives[obj.id] && (
                                                            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                                {obj.keyResults.map(kr => (
                                                                    <div key={kr.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', transition: 'border 0.2s' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                                                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{kr.statement}</span>
                                                                            <button
                                                                                onClick={() => setSelectedKR(kr)}
                                                                                data-testid="strategy-kr-detail-btn"
                                                                                style={{
                                                                                    background: `${theme.color}20`,
                                                                                    border: `1px solid ${theme.color}40`,
                                                                                    color: theme.color,
                                                                                    borderRadius: '8px',
                                                                                    fontSize: '0.75rem',
                                                                                    fontWeight: 900,
                                                                                    padding: '4px 8px',
                                                                                    cursor: 'pointer',
                                                                                    boxShadow: `0 0 10px ${theme.color}15`
                                                                                }}
                                                                            >
                                                                                {calculateKRProgress(kr.measurementDirection, kr.currentValue, kr.targetValue)}%
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <KeyResultCreator objectiveId={obj.id} megaDeadline={mega.deadline} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <form action={createObjective} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px' }}>
                                                    <input type="hidden" name="megaId" value={mega.id} />
                                                    <input name="statement" placeholder="Nuevo objetivo..." required style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                                                    <button type="submit" style={{ background: theme.color, color: 'white', border: 'none', borderRadius: '8px', padding: '0 1rem' }}>+</button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )
            }

            {
                viewMode === 'WEIGHTS' && (
                    <WeightManagement purpose={purpose as any} themeColor={theme.color} />
                )
            }

            {
                viewMode === 'HEALTH' && (
                    <StrategyHealthReport themeColor={theme.color} />
                )
            }

            {
                selectedKR && (
                    <KeyResultProgressModal isOpen={!!selectedKR} onClose={() => setSelectedKR(null)} kr={selectedKR} userRole={user?.role} />
                )
            }

            {
                isCheckInOpen && (
                    <KRCheckInModal isOpen={isCheckInOpen} onClose={() => setIsCheckInOpen(false)} keyResults={myKRs} />
                )
            }
        </div >
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
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                    name="statement"
                    placeholder={placeholder}
                    required
                    defaultValue={suggestion}
                    key={suggestion} // re-render on suggestion
                    style={{ minWidth: '350px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.6rem 1rem', color: '#fff' }}
                />
                <button
                    type="button"
                    onClick={handleSuggest}
                    disabled={loading}
                    className="btn-secondary"
                    data-testid="strategy-mega-suggest-btn"
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
            <input name="deadline" type="date" required style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.6rem 1rem', color: '#fff', colorScheme: 'dark' }} />
            <button
                type="submit"
                data-testid="strategy-mega-submit-btn"
                style={{
                    background: themeColor,
                    color: 'white',
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: `0 0 15px ${themeColor}30`,
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    marginLeft: '0.5rem',
                    transition: 'all 0.2s'
                }}
                title="Agregar Mega"
            >
                +
            </button>
        </form>
    );
}
