'use client';

import React, { useState, useEffect } from 'react';
import { updateKeyResultValue, updateKeyResultMetadata } from '@/app/actions';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';
import { useRouter } from 'next/navigation';
import InitiativeCreator from './InitiativeCreator';

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
    // states for calculation assistant (PERCENTAGE)
    const [numValue, setNumValue] = useState<number | string>(kr.numeratorValue ?? 0);
    const [denValue, setDenValue] = useState<number | string>(kr.denominatorValue ?? 1);
    const [numLabel, setNumLabel] = useState(kr.numeratorLabel || 'Actual');
    const [denLabel, setDenLabel] = useState(kr.denominatorLabel || 'Meta');

    // states for units-based tracking (UNITS)
    const [unitCurrentValue, setUnitCurrentValue] = useState<number | string>(kr.currentValue ?? 0);
    const [periodicity, setPeriodicity] = useState<string>(kr.updatePeriodicity || '');

    const [isSaving, setIsSaving] = useState(false);

    // Date metadata states
    const [startYear, setStartYear] = useState<number>(kr.startYear ?? new Date().getFullYear());
    const [startQuarter, setStartQuarter] = useState<number>(kr.startQuarter ?? 1);
    const [endYear, setEndYear] = useState<number>(kr.endYear ?? new Date().getFullYear());
    const [endQuarter, setEndQuarter] = useState<number>(kr.endQuarter ?? 4);

    const canEditDates = userRole === 'ADMIN' || userRole === 'SUPERADMIN' || userRole === 'DIRECTOR';

    if (!isOpen) return null;

    // Real-time calculation for PERCENTAGE
    const n = typeof numValue === 'string' ? parseFloat(numValue) || 0 : numValue;
    const d = typeof denValue === 'string' ? parseFloat(denValue) || 1 : denValue;
    const calculatedFulfillment = d === 0 ? 0 : Math.round((n / d) * 100);

    // Real-time calculation for UNITS
    const u = typeof unitCurrentValue === 'string' ? parseFloat(unitCurrentValue) || 0 : unitCurrentValue;
    const unitFulfillment = kr.targetValue === 0 ? 0 : Math.round((u / kr.targetValue) * 100);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const metadata = {
                startYear,
                startQuarter,
                endYear,
                endQuarter
            };

            if (kr.trackingType === 'PERCENTAGE') {
                await updateKeyResultValue(
                    kr.id,
                    calculatedFulfillment,
                    n,
                    d,
                    numLabel,
                    denLabel,
                    metadata
                );
            } else {
                await updateKeyResultValue(
                    kr.id,
                    u,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    metadata
                );
            }
            // Dispatch event to update notifications
            window.dispatchEvent(new Event('kr-updated'));
            onClose();
        } catch (error) {
            console.error('Failed to update progress', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'flex-start', // Change from center to start for scrolling
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            overflowY: 'auto', // Enable scrolling on the overlay
            padding: '2rem 1rem' // Add space for the modal to breathe
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'white',
                padding: '2.5rem',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '900px', // Wider for two-column desktop
                color: '#1e293b',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                margin: 'auto 0',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: theme.color, color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                            {kr.trackingType === 'PERCENTAGE' ? '%' : '#'}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            {kr.trackingType === 'PERCENTAGE' ? 'Asistente de Cumplimiento - Porcentaje' : 'Asistente de Cumplimiento - Unidades'}
                        </h3>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>&times;</button>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: theme.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Resultado Clave Seleccionado</div>
                    <div style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 600, lineHeight: '1.4' }}>{kr.statement}</div>
                </div>

                {/* Main Content Grid: Desktop 2-cols / Mobile 1-col */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                    gap: '2.5rem',
                    marginBottom: '2.5rem'
                }}>
                    {/* Left Column: Capture/Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                            1. CAPTURA DE DATOS
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>PERIODICIDAD DE ACTUALIZACIÓN</label>
                            <select
                                value={periodicity}
                                onChange={async (e) => {
                                    const val = e.target.value;
                                    setPeriodicity(val); // Optimistic update
                                    const { updateKeyResultPeriodicity } = await import('@/app/actions');
                                    await updateKeyResultPeriodicity(kr.id, val || null);
                                    router.refresh();
                                }}
                                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.6rem', fontSize: '0.85rem', color: '#334155', background: 'white', outline: 'none' }}
                            >
                                <option value="">(Sin definir)</option>
                                <option value="DAILY">Diaria</option>
                                <option value="WEEKLY">Semanal</option>
                                <option value="BIWEEKLY">Quincenal</option>
                                <option value="MONTHLY">Mensual</option>
                                <option value="QUARTERLY">Trimestral</option>
                                <option value="YEARLY">Anual</option>
                            </select>
                        </div>

                        {/* Date Metadata Section */}
                        <div style={{ padding: '1.25rem', background: '#f1f5f9', borderRadius: '12px', border: '2px solid #e2e8f0', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                📅 Metas de Tiempo (Registro Q/Año)
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>INICIO</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <select
                                            value={startQuarter}
                                            disabled={!canEditDates}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setStartQuarter(val);
                                            }}
                                            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '1rem', fontWeight: '500', color: '#0f172a', background: canEditDates ? 'white' : '#f8fafc', appearance: 'auto' }}
                                        >
                                            {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                                        </select>
                                        <select
                                            value={startYear}
                                            disabled={!canEditDates}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setStartYear(val);
                                            }}
                                            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '1rem', fontWeight: '500', color: '#0f172a', background: canEditDates ? 'white' : '#f8fafc', appearance: 'auto' }}
                                        >
                                            {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>FIN</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <select
                                            value={endQuarter}
                                            disabled={!canEditDates}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setEndQuarter(val);
                                            }}
                                            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '1rem', fontWeight: '500', color: '#0f172a', background: canEditDates ? 'white' : '#f8fafc', appearance: 'auto' }}
                                        >
                                            {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                                        </select>
                                        <select
                                            value={endYear}
                                            disabled={!canEditDates}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setEndYear(val);
                                            }}
                                            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '1rem', fontWeight: '500', color: '#0f172a', background: canEditDates ? 'white' : '#f8fafc', appearance: 'auto' }}
                                        >
                                            {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            {!canEditDates && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', fontStyle: 'italic', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                                    ℹ️ Solo administradores pueden modificar estas fechas de registro.
                                </div>
                            )}
                        </div>

                        {kr.trackingType === 'PERCENTAGE' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                        <input
                                            value={numLabel}
                                            onChange={e => setNumLabel(e.target.value)}
                                            placeholder="Etiqueta"
                                            style={{ border: 'none', borderBottom: '1px dashed #cbd5e1', background: 'none', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', width: '100%', outline: 'none', padding: '2px 0' }}
                                        />
                                        <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>✎</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={numValue}
                                        onChange={e => setNumValue(e.target.value)}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', color: '#1e293b' }}
                                    />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                        <input
                                            value={denLabel}
                                            onChange={e => setDenLabel(e.target.value)}
                                            placeholder="Etiqueta"
                                            style={{ border: 'none', borderBottom: '1px dashed #cbd5e1', background: 'none', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', width: '100%', outline: 'none', padding: '2px 0' }}
                                        />
                                        <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>✎</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={denValue}
                                        onChange={e => setDenValue(e.target.value)}
                                        style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', color: '#1e293b' }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                                    VALOR ACTUAL ({kr.metricUnit})
                                </label>
                                <input
                                    type="number"
                                    value={unitCurrentValue}
                                    onChange={e => setUnitCurrentValue(e.target.value)}
                                    style={{ width: '100%', padding: '1.25rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '2rem', fontWeight: 800, color: '#1e293b', textAlign: 'center' }}
                                />
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{
                                width: '100%',
                                background: '#0f172a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                transition: 'all 0.2s',
                                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)',
                                marginTop: '1rem'
                            }}
                        >
                            {isSaving ? 'Guardando...' : 'Confirmar y Guardar Avance'}
                        </button>

                        <button
                            onClick={() => router.push('/strategy/execution')}
                            style={{
                                width: '100%',
                                background: 'white',
                                color: '#0f172a',
                                border: '2px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '1rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s',
                                marginTop: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = theme.color;
                                e.currentTarget.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.background = 'white';
                            }}
                        >
                            <span>🚀</span> Gestión de Iniciativas
                        </button>

                        <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                            <InitiativeCreator keyResultId={kr.id} />
                        </div>
                    </div>

                    {/* Right Column: Interpretation/Results */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                            2. INTERPRETACIÓN DE LOGRO
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '15px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>META REGISTRADA</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{kr.targetValue} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{kr.metricUnit}</span></div>
                            </div>
                            <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '15px', color: 'white', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
                                <div style={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>LOGRO TOTAL</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>
                                    {kr.trackingType === 'PERCENTAGE'
                                        ? (kr.targetValue === 0 ? 0 : Math.round((calculatedFulfillment / kr.targetValue) * 100))
                                        : unitFulfillment}%
                                </div>
                            </div>
                        </div>

                        {kr.trackingType === 'PERCENTAGE' && (
                            <div style={{
                                padding: '1.5rem',
                                background: '#eff6ff',
                                borderRadius: '15px',
                                border: '1px solid #dbeafe',
                                textAlign: 'center',
                                position: 'relative'
                            }}>
                                <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase' }}>CÁLCULO DE LA FÓRMULA</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e40af' }}>{calculatedFulfillment}%</div>
                                <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, marginTop: '0.5rem' }}>({numLabel} / {denLabel}) × 100</div>
                            </div>
                        )}

                        {/* Full History Section */}
                        {kr.updates && kr.updates.length > 0 && (
                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '150px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Histórico de Avances</span>
                                    <span style={{ opacity: 0.6 }}>{kr.updates.length} Registros</span>
                                </div>
                                <div style={{
                                    overflowY: 'auto',
                                    maxHeight: '200px',
                                    paddingRight: '0.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    {kr.updates.map((update, idx) => (
                                        <div key={update.id} style={{
                                            padding: '0.75rem 1rem',
                                            background: idx === 0 ? '#f0fdf4' : '#f8fafc',
                                            borderRadius: '10px',
                                            border: idx === 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: idx === 0 ? '#10b981' : '#1e293b' }}>
                                                    {update.oldValue}{kr.trackingType === 'PERCENTAGE' ? '%' : ''} → {update.newValue}{kr.trackingType === 'PERCENTAGE' ? '%' : ` ${kr.metricUnit}`}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                                                    {(update as any).user?.name || 'Sistema'}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                                {new Date(update.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                            </div>
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
