import React, { useState, useEffect } from 'react';
import { updateKeyResultValue } from '@/app/actions';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';
import { useRouter } from 'next/navigation';
import InitiativeCreator from './InitiativeCreator';
import { MeasurementDirection } from '@prisma/client';
import { calculateKRProgress, DIRECTION_CONFIG } from '@/lib/krUtils';
import { CheckCircle } from 'lucide-react';

interface HistoryRecord {
    id: string;
    oldValue: number;
    newValue: number;
    createdAt: Date;
    user?: {
        name: string;
    } | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    kr: {
        id: string;
        statement: string;
        targetValue: number;
        currentValue: number;
        metricUnit: string;
        measurementDirection: MeasurementDirection;
        numeratorValue?: number;
        denominatorValue?: number;
        numeratorLabel?: string;
        denominatorLabel?: string;
        trackingType: 'PERCENTAGE' | 'UNITS';
        updatePeriodicity?: string | null;
        updates?: HistoryRecord[];
        startYear?: number | null;
        startQuarter?: number | null;
        endYear?: number | null;
        endQuarter?: number | null;
    };
    userRole?: string;
}

export default function KeyResultProgressModal({ isOpen, onClose, kr, userRole }: Props) {
    const theme = useModuleTheme();
    const router = useRouter();

    const [numValue, setNumValue] = useState<number | string>(kr.numeratorValue ?? 0);
    const [denValue, setDenValue] = useState<number | string>(kr.denominatorValue ?? 1);
    const [numLabel, setNumLabel] = useState(kr.numeratorLabel || 'Actual');
    const [denLabel, setDenLabel] = useState(kr.denominatorLabel || 'Meta');

    const [unitCurrentValue, setUnitCurrentValue] = useState<number | string>(kr.currentValue ?? 0);
    const [periodicity, setPeriodicity] = useState<string>(kr.updatePeriodicity || '');

    const [isSaving, setIsSaving] = useState(false);

    const [startYear, setStartYear] = useState<number>(kr.startYear ?? new Date().getFullYear());
    const [startQuarter, setStartQuarter] = useState<number>(kr.startQuarter ?? 1);
    const [endYear, setEndYear] = useState<number>(kr.endYear ?? new Date().getFullYear());
    const [endQuarter, setEndQuarter] = useState<number>(kr.endQuarter ?? 4);

    const canEditDates = userRole === 'ADMIN' || userRole === 'SUPERADMIN' || userRole === 'DIRECTOR';

    if (!isOpen) return null;

    const n = typeof numValue === 'string' ? parseFloat(numValue) || 0 : numValue;
    const d = typeof denValue === 'string' ? parseFloat(denValue) || 1 : denValue;
    const currentPercentage = d === 0 ? 0 : Math.round((n / d) * 100);

    const u = typeof unitCurrentValue === 'string' ? parseFloat(unitCurrentValue) || 0 : unitCurrentValue;

    // Calculate final achievement percentage using business logic
    const achievementValue = kr.trackingType === 'PERCENTAGE' ? currentPercentage : u;
    const totalAchievement = calculateKRProgress(kr.measurementDirection, achievementValue, kr.targetValue);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const metadata = { startYear, startQuarter, endYear, endQuarter };

            if (kr.trackingType === 'PERCENTAGE') {
                await updateKeyResultValue(kr.id, currentPercentage, n, d, numLabel, denLabel, metadata);
            } else {
                await updateKeyResultValue(kr.id, u, undefined, undefined, undefined, undefined, metadata);
            }
            window.dispatchEvent(new Event('kr-updated'));
            onClose();
        } catch (error) {
            console.error('Failed to update progress', error);
        } finally {
            setIsSaving(false);
        }
    };

    const dirConfig = DIRECTION_CONFIG[kr.measurementDirection] || DIRECTION_CONFIG[MeasurementDirection.MAXIMIZE];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
            alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '2rem 1rem'
        }} onClick={onClose}>
            <div
                data-testid="progress-assistant-modal"
                style={{
                    backgroundColor: 'white', padding: '2.5rem', borderRadius: '20px', width: '100%',
                    maxWidth: '900px', color: '#1e293b', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    margin: 'auto 0', position: 'relative'
                }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: theme.color, color: 'white', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            {dirConfig.emoji}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                Asistente de Progreso
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{dirConfig.label}: {dirConfig.description}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: theme.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>{kr.metricUnit}</div>
                    <div style={{ fontSize: '1.2rem', color: '#1e293b', fontWeight: 700, lineHeight: '1.4' }}>{kr.statement}</div>
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                    gap: '2.5rem', marginBottom: '2.5rem'
                }}>
                    {/* Left Column: Capture/Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                            1. Registro de Avance
                        </div>

                        {kr.measurementDirection === MeasurementDirection.COMPLETE ? (
                            <div style={{ padding: '0.5rem 0' }}>
                                <button
                                    data-testid="progress-assistant-complete-toggle"
                                    onClick={() => setUnitCurrentValue(u === 100 ? 0 : 100)}
                                    style={{
                                        width: '100%', padding: '1.5rem', borderRadius: '16px',
                                        border: `2px solid ${u === 100 ? '#22c55e' : '#e2e8f0'}`,
                                        background: u === 100 ? '#f0fdf4' : '#f8fafc',
                                        color: u === 100 ? '#166534' : '#64748b',
                                        fontSize: '1.3rem', fontWeight: 800, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem'
                                    }}
                                >
                                    {u === 100 ? <CheckCircle size={32} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #cbd5e1' }} />}
                                    {u === 100 ? '¡Hito Completado!' : 'Pendiente de Completar'}
                                </button>
                            </div>
                        ) : kr.trackingType === 'PERCENTAGE' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <input
                                        value={numLabel}
                                        onChange={e => setNumLabel(e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px dashed #cbd5e1', background: 'none', fontSize: '0.75rem', color: '#1e293b', fontWeight: 700, textTransform: 'uppercase', width: '100%', outline: 'none', marginBottom: '0.5rem' }}
                                    />
                                    <input
                                        data-testid="progress-assistant-num-input"
                                        type="number"
                                        value={numValue}
                                        onChange={e => setNumValue(e.target.value)}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', background: '#f8fafc', color: '#1e293b' }}
                                    />
                                </div>
                                <div>
                                    <input
                                        value={denLabel}
                                        onChange={e => setDenLabel(e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px dashed #cbd5e1', background: 'none', fontSize: '0.75rem', color: '#1e293b', fontWeight: 700, textTransform: 'uppercase', width: '100%', outline: 'none', marginBottom: '0.5rem' }}
                                    />
                                    <input
                                        data-testid="progress-assistant-den-input"
                                        type="number"
                                        value={denValue}
                                        onChange={e => setDenValue(e.target.value)}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', background: '#f8fafc', color: '#1e293b' }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                    VALOR ACTUAL ({kr.metricUnit})
                                </label>
                                <input
                                    data-testid="progress-assistant-unit-input"
                                    type="number"
                                    value={unitCurrentValue}
                                    onChange={e => setUnitCurrentValue(e.target.value)}
                                    style={{ width: '100%', padding: '1.25rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '2rem', fontWeight: 800, textAlign: 'center', background: '#f8fafc', color: '#1e293b' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>AÑO</label>
                                <select
                                    value={endYear}
                                    disabled={!canEditDates}
                                    onChange={(e) => setEndYear(parseInt(e.target.value))}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: canEditDates ? 'white' : '#f8fafc', color: '#1e293b' }}
                                >
                                    {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>TRIMESTRE</label>
                                <select
                                    value={endQuarter}
                                    disabled={!canEditDates}
                                    onChange={(e) => setEndQuarter(parseInt(e.target.value))}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: canEditDates ? 'white' : '#f8fafc', color: '#1e293b' }}
                                >
                                    {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                                </select>
                            </div>
                        </div>

                        <button
                            data-testid="progress-assistant-save-btn"
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{
                                width: '100%', background: theme.color, color: 'white',
                                border: 'none', borderRadius: '12px', padding: '1.25rem',
                                fontWeight: 800, cursor: 'pointer', fontSize: '1.1rem',
                                boxShadow: `0 10px 15px -3px ${theme.color}40`, marginTop: '0.5rem'
                            }}
                        >
                            {isSaving ? 'Guardando...' : 'Confirmar Avance'}
                        </button>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                            <InitiativeCreator keyResultId={kr.id} />
                        </div>
                    </div>

                    {/* Right Column: Interpretation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                            2. Resultado del Cálculo
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>META ESTABLECIDA</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{kr.targetValue} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{kr.metricUnit}</span></div>
                            </div>
                            <div style={{ padding: '1.25rem', background: `linear-gradient(135deg, ${theme.color} 0%, ${theme.color}dd 100%)`, borderRadius: '15px', color: 'white', textAlign: 'center', boxShadow: `0 10px 15px -3px ${theme.color}40` }}>
                                <div style={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>PROGRESO TOTAL</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{totalAchievement}%</div>
                            </div>
                        </div>

                        {kr.trackingType === 'PERCENTAGE' && kr.measurementDirection && !kr.measurementDirection.includes('COMPLETE') && (
                            <div style={{ padding: '1.5rem', background: '#eff6ff', borderRadius: '15px', border: '1px solid #dbeafe', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Valor Porcentual</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e40af' }}>{currentPercentage}%</div>
                                <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, marginTop: '0.4rem' }}>({numLabel} / {denLabel}) × 100</div>
                            </div>
                        )}

                        {/* Full History Section */}
                        {kr.updates && kr.updates.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '150px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Histórico de Avances</div>
                                <div style={{ overflowY: 'auto', maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {kr.updates.map((update, idx) => (
                                        <div key={update.id} style={{ padding: '0.75rem 1rem', background: idx === 0 ? '#f0fdf4' : '#f8fafc', borderRadius: '10px', border: idx === 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: idx === 0 ? '#10b981' : '#1e293b' }}>
                                                    {update.newValue}{kr.metricUnit === '%' ? '%' : ` ${kr.metricUnit}`}
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{(update as any).user?.name || 'Sistema'}</div>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(update.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
