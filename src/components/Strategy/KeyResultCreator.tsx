import React, { useState } from 'react';
import { createKeyResult } from '@/app/actions';
import styles from '@/app/strategy/page.module.css';
import { MeasurementDirection } from '@prisma/client';
import { DIRECTION_CONFIG, MEASUREMENT_UNITS } from '@/lib/krUtils';
import { Info } from 'lucide-react';

export default function KeyResultCreator({ objectiveId, megaDeadline }: { objectiveId: string, megaDeadline?: Date | string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [measurementDirection, setMeasurementDirection] = useState<MeasurementDirection>(MeasurementDirection.MAXIMIZE);
    const [metricUnit, setMetricUnit] = useState('%');
    const [targetValue, setTargetValue] = useState<string>('100');

    if (!isOpen) {
        return (
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.2)', borderRadius: '12px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                <button
                    onClick={() => setIsOpen(true)}
                    data-testid="kr-creator-toggle"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.6)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        justifyContent: 'center',
                        padding: '0.5rem',
                        minHeight: '40px'
                    }}
                >
                    <span style={{ fontSize: '1.2rem', fontWeight: 300, lineHeight: 1 }}>+</span> Agregar KR
                </button>
            </div>
        );
    }

    const handleDirectionChange = (dir: MeasurementDirection) => {
        setMeasurementDirection(dir);
        if (dir === MeasurementDirection.COMPLETE) {
            setTargetValue('100');
            setMetricUnit('Práctica/Hito');
        }
    };

    const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'custom') {
            setMetricUnit('');
        } else {
            setMetricUnit(val);
        }
    };

    // Calculate year range
    const currentYear = new Date().getFullYear();
    let minYear = currentYear;
    let maxYear = currentYear + 5;
    if (megaDeadline) {
        const deadlineYear = new Date(megaDeadline).getFullYear();
        maxYear = deadlineYear;
        if (maxYear < minYear) minYear = maxYear;
    }
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

    return (
        <div className="glass-panel" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Nuevo Resultado Clave</span>
                <button
                    onClick={() => setIsOpen(false)}
                    data-testid="kr-creator-close"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem', lineHeight: 1 }}
                >
                    &times;
                </button>
            </div>

            <form
                action={async (formData) => {
                    setIsSaving(true);
                    try {
                        await createKeyResult(formData);
                        setIsOpen(false);
                        window.dispatchEvent(new Event('kr-updated'));
                    } catch (error) {
                        console.error('Error creating KR:', error);
                        alert('Error al crear el KR.');
                    } finally {
                        setIsSaving(false);
                    }
                }}
                data-testid="kr-creator-form"
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
                <input type="hidden" name="objectiveId" value={objectiveId} />
                <input type="hidden" name="measurementDirection" value={measurementDirection} />
                <input type="hidden" name="trackingType" value={metricUnit === '%' ? 'PERCENTAGE' : 'UNITS'} />

                {/* Direccionalidad Selector */}
                <div
                    data-testid="kr-creator-direction-section"
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                >
                    <label
                        data-testid="kr-creator-direction-label"
                        style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                    >
                        Dirección de la Medición
                    </label>
                    <div
                        data-testid="kr-creator-direction-grid"
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}
                    >
                        {(Object.keys(DIRECTION_CONFIG) as MeasurementDirection[]).map((dir) => (
                            <button
                                key={dir}
                                type="button"
                                data-testid={`kr-creator-direction-btn-${dir.toLowerCase()}`}
                                title={DIRECTION_CONFIG[dir].description}
                                onClick={() => handleDirectionChange(dir)}
                                style={{
                                    padding: '0.6rem',
                                    borderRadius: '10px',
                                    border: '1px solid',
                                    borderColor: measurementDirection === dir ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                    background: measurementDirection === dir ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                    color: measurementDirection === dir ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                                    fontSize: '0.75rem',
                                    fontWeight: measurementDirection === dir ? 700 : 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                            >
                                <span style={{ fontSize: '1rem' }}>{DIRECTION_CONFIG[dir].emoji}</span>
                                <div style={{ textAlign: 'left', lineHeight: 1.1, flex: 1 }}>
                                    <div>{DIRECTION_CONFIG[dir].label}</div>
                                </div>
                                <div
                                    data-testid={`kr-creator-direction-help-${dir.toLowerCase()}`}
                                    style={{ opacity: 0.5, display: 'flex', alignItems: 'center' }}
                                >
                                    <Info size={14} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Descripción del KR</label>
                    <input
                        name="statement"
                        placeholder="Ej: Incrementar la cuota de mercado en el sector retail"
                        required
                        data-testid="kr-creator-statement"
                        style={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.9rem', outline: 'none', color: 'white', background: 'rgba(0,0,0,0.2)', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Unidad y Categoría */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Unidad de Medida</label>
                        <select
                            data-testid="kr-creator-unit-select"
                            onChange={handleUnitChange}
                            value={MEASUREMENT_UNITS.flatMap(c => c.units).find(u => u.symbol === metricUnit) ? metricUnit : 'custom'}
                            style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem', fontSize: '0.9rem', color: 'white', background: 'rgba(0,0,0,0.3)', outline: 'none' }}
                        >
                            {MEASUREMENT_UNITS.map(cat => (
                                <optgroup key={cat.category} label={`${cat.emoji} ${cat.category}`} style={{ background: '#1e293b' }}>
                                    {cat.units.map(u => (
                                        <option key={u.symbol} value={u.symbol}>{u.label} ({u.symbol})</option>
                                    ))}
                                </optgroup>
                            ))}
                            <option value="custom" style={{ background: '#1e293b' }}>✨ Otro (Personalizado)</option>
                        </select>
                        <input
                            name="metricUnit"
                            data-testid="kr-creator-unit-input"
                            value={metricUnit}
                            onChange={(e) => setMetricUnit(e.target.value)}
                            placeholder="Ej: Ventas, Usuarios, etc."
                            required
                            style={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.6rem', fontSize: '0.85rem', color: 'white', background: 'rgba(0,0,0,0.2)', marginTop: '0.25rem' }}
                        />
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Meta a Alcanzar</label>
                        <input
                            name="targetValue"
                            data-testid="kr-creator-target-input"
                            type="number"
                            step="any"
                            value={targetValue}
                            onChange={(e) => setTargetValue(e.target.value)}
                            disabled={measurementDirection === MeasurementDirection.COMPLETE}
                            required
                            style={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.6rem', fontSize: '0.9rem', color: 'white', background: measurementDirection === MeasurementDirection.COMPLETE ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)', width: '100%' }}
                        />
                        {measurementDirection === MeasurementDirection.COMPLETE && <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Fijo en 100 para tipo Completar</span>}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Frecuencia</label>
                        <select
                            name="updatePeriodicity"
                            data-testid="kr-creator-periodicity-select"
                            style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem', fontSize: '0.85rem', color: 'white', background: 'rgba(0,0,0,0.3)', outline: 'none' }}
                        >
                            <option value="WEEKLY" style={{ background: '#1e293b' }}>Semanal</option>
                            <option value="BIWEEKLY" style={{ background: '#1e293b' }}>Quincenal</option>
                            <option value="MONTHLY" style={{ background: '#1e293b' }}>Mensual</option>
                            <option value="QUARTERLY" style={{ background: '#1e293b' }}>Trimestral</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Meta Finalización (Año)</label>
                        <select
                            name="endYear"
                            data-testid="kr-creator-year-select"
                            style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.6rem', fontSize: '0.85rem', color: 'white', background: 'rgba(0,0,0,0.3)', outline: 'none' }}
                        >
                            {years.map(y => (
                                <option key={y} value={y} style={{ background: '#1e293b' }}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: '8px', padding: '0.5rem 1.25rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        data-testid="kr-creator-submit-btn"
                        disabled={isSaving}
                        style={{ background: isSaving ? 'rgba(255,255,255,0.2)' : 'white', color: isSaving ? 'rgba(255,255,255,0.4)' : '#0f172a', border: 'none', borderRadius: '8px', padding: '0.5rem 1.75rem', fontSize: '0.85rem', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {isSaving ? 'Guardando...' : 'Crear KR'}
                    </button>
                </div>
            </form>
        </div>
    );
}
