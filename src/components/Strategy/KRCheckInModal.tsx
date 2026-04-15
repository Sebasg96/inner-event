import React, { useState, useEffect } from 'react';
import { updateKeyResultValue } from '@/app/actions';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X, AlertCircle, MessageSquare, CheckCircle } from 'lucide-react';
import { MeasurementDirection } from '@prisma/client';
import { calculateKRProgress, DIRECTION_CONFIG } from '@/lib/krUtils';

interface KeyResult {
    id: string;
    statement: string;
    targetValue: number;
    currentValue: number;
    metricUnit: string;
    trackingType: 'PERCENTAGE' | 'UNITS';
    measurementDirection: MeasurementDirection;
    numeratorValue?: number;
    denominatorValue?: number;
    numeratorLabel?: string;
    denominatorLabel?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    keyResults: KeyResult[];
}

export default function KRCheckInModal({ isOpen, onClose, keyResults }: Props) {
    const theme = useModuleTheme();
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);

    const kr = keyResults[currentIndex];

    const [val, setVal] = useState<number | string>(0);
    const [comment, setComment] = useState('');
    const [obstacles, setObstacles] = useState('');
    const [numValue, setNumValue] = useState<number | string>(0);
    const [denValue, setDenValue] = useState<number | string>(1);

    useEffect(() => {
        if (kr) {
            setVal(kr.currentValue);
            setNumValue(kr.numeratorValue ?? 0);
            setDenValue(kr.denominatorValue ?? 1);
            setComment('');
            setObstacles('');
        }
    }, [currentIndex, isOpen, kr]);

    if (!isOpen || !kr) return null;

    const total = keyResults.length;

    // Calculation for Percentage Tracking
    const n = typeof numValue === 'string' ? parseFloat(numValue) || 0 : numValue;
    const d = typeof denValue === 'string' ? parseFloat(denValue) || 1 : denValue;
    const rawUnitsValue = typeof val === 'string' ? parseFloat(val) || 0 : val;

    const handleNext = async () => {
        setIsSaving(true);
        try {
            let newValue = rawUnitsValue;

            // If it's percentage, we use the ratio
            if (kr.trackingType === 'PERCENTAGE') {
                newValue = d === 0 ? 0 : (n / d) * 100;
            }

            // Note: The progress calculation for display/dashboard is done via calculateKRProgress
            // but we save the "currentValue" exactly as entered (percentage or units).
            // For COMPLETE, we set it to 100 if checked.

            await updateKeyResultValue(
                kr.id,
                newValue,
                kr.trackingType === 'PERCENTAGE' ? n : undefined,
                kr.trackingType === 'PERCENTAGE' ? d : undefined,
                kr.numeratorLabel,
                kr.denominatorLabel,
                undefined,
                comment,
                obstacles
            );

            setCompletedCount(prev => prev + 1);

            if (currentIndex < total - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                window.dispatchEvent(new Event('kr-updated'));
                onClose();
                router.refresh();
            }
        } catch (error) {
            console.error('Check-in failed', error);
        } finally {
            setIsSaving(false);
        }
    };

    const dirConfig = DIRECTION_CONFIG[kr.measurementDirection] || DIRECTION_CONFIG[MeasurementDirection.MAXIMIZE];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
            alignItems: 'flex-start', justifyContent: 'center', zIndex: 1100,
            backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '2rem 1rem'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'white', borderRadius: '24px', width: '95%', maxWidth: '600px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex', flexDirection: 'column',
                animation: 'modalSlideIn 0.3s ease-out',
                margin: 'auto'
            }} data-testid="kr-checkin-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ background: theme.color, padding: '1.5rem 2rem', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
                            Check-in Semanal de OKRs
                        </span>
                        <button onClick={onClose} data-testid="kr-checkin-close" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '0.2rem' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Actualizar Avance</h2>
                        <span style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '0.2rem' }}>
                            ({currentIndex + 1} de {total})
                        </span>
                    </div>

                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', background: 'white',
                            width: `${((currentIndex + 1) / total) * 100}%`,
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>

                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* KR Statement */}
                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{dirConfig.emoji}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.4 }}>
                                    {kr.statement}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                    {dirConfig.label}: {dirConfig.description}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: theme.color, marginTop: '0.5rem', fontWeight: 700 }}>
                                    🎯 Meta: {kr.targetValue} {kr.metricUnit} | Actual: {kr.currentValue} {kr.metricUnit}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Input Value */}
                    <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                            Nuevo Valor ({kr.metricUnit})
                        </label>

                        {kr.measurementDirection === MeasurementDirection.COMPLETE ? (
                            <button
                                onClick={() => setVal(val === 100 ? 0 : 100)}
                                style={{
                                    width: '100%',
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    border: `2px solid ${val === 100 ? '#22c55e' : '#e2e8f0'}`,
                                    background: val === 100 ? '#f0fdf4' : 'white',
                                    color: val === 100 ? '#166534' : '#64748b',
                                    fontSize: '1.2rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {val === 100 ? <CheckCircle size={28} /> : <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                                {val === 100 ? '¡Completado!' : 'Marcar como completado'}
                            </button>
                        ) : kr.trackingType === 'PERCENTAGE' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>{kr.numeratorLabel || 'Actual'}</span>
                                    <input
                                        type="number"
                                        value={numValue}
                                        onChange={e => setNumValue(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center', color: '#1e293b' }}
                                    />
                                </div>
                                <span style={{ fontSize: '1.5rem', color: '#cbd5e1', paddingTop: '1rem' }}>/</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>{kr.denominatorLabel || 'Meta'}</span>
                                    <input
                                        type="number"
                                        value={denValue}
                                        onChange={e => setDenValue(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center', color: '#1e293b' }}
                                    />
                                </div>
                                <div style={{ flex: 1, padding: '0.75rem', background: '#eff6ff', borderRadius: '12px', textAlign: 'center', border: '1px solid #dbeafe', marginTop: '1rem' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e40af' }}>{d === 0 ? 0 : Math.round((n / d) * 100)}%</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    value={val}
                                    onChange={e => setVal(e.target.value)}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', color: '#1e293b' }}
                                />
                                <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem', fontWeight: 600 }}>
                                    Progreso Actual según dirección: <span style={{ color: theme.color }}>{calculateKRProgress(kr.measurementDirection, rawUnitsValue, kr.targetValue)}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comment & Obstacles */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                <MessageSquare size={14} /> Comentario
                            </label>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="¿Qué lograste?"
                                style={{ width: '100%', height: '80px', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none', fontSize: '0.9rem', outline: 'none', color: '#334155' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                <AlertCircle size={14} color="#ef4444" /> Obstáculos
                            </label>
                            <textarea
                                value={obstacles}
                                onChange={e => setObstacles(e.target.value)}
                                placeholder=" ¿Algo te detiene?"
                                style={{ width: '100%', height: '80px', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none', fontSize: '0.9rem', outline: 'none', color: '#334155' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                        disabled={currentIndex === 0 || isSaving}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: currentIndex === 0 ? '#cbd5e1' : '#64748b', cursor: 'pointer', fontWeight: 700 }}
                    >
                        <ChevronLeft size={20} /> Anterior
                    </button>

                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={isSaving}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            background: theme.color, color: 'white', border: 'none',
                            padding: '0.75rem 1.5rem', borderRadius: '12px',
                            fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                            opacity: isSaving ? 0.7 : 1
                        }}
                    >
                        {isSaving ? 'Guardando...' : (currentIndex === total - 1 ? 'Finalizar Check-in' : 'Siguiente KR')}
                        {!isSaving && <ChevronRight size={20} />}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes modalSlideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
