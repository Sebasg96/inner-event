'use client';

import React, { useState } from 'react';
import { createKeyResult } from '@/app/actions';
import styles from '@/app/strategy/page.module.css';

export default function KeyResultCreator({ objectiveId }: { objectiveId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [trackingType, setTrackingType] = useState<'PERCENTAGE' | 'UNITS'>('PERCENTAGE');
    const [metricUnit, setMetricUnit] = useState('%');

    if (!isOpen) {
        return (
            <div style={{ background: 'white', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
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

    const handleTrackingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as 'PERCENTAGE' | 'UNITS';
        setTrackingType(value);
        if (value === 'PERCENTAGE') {
            setMetricUnit('%');
        } else if (metricUnit === '%') {
            setMetricUnit(''); // Clear to encourage specific unit
        }
    };

    return (
        <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Nuevo Resultado Clave</span>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem', lineHeight: 1 }}
                    title="Cerrar"
                >
                    &times;
                </button>
            </div>

            <form action={createKeyResult} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="hidden" name="objectiveId" value={objectiveId} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <input
                        name="statement"
                        placeholder="Descripción del KR (Ej: Incrementar satisfacción del cliente)"
                        required
                        className={styles.visiblePlaceholder}
                        style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.6rem', fontSize: '0.9rem', outline: 'none', color: 'black', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 30%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>TIPO</label>
                        <select
                            name="trackingType"
                            value={trackingType}
                            onChange={handleTrackingChange}
                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.6rem', fontSize: '0.9rem', color: 'black', background: 'white', outline: 'none' }}
                        >
                            <option value="PERCENTAGE">Porcentaje (%)</option>
                            <option value="UNITS">Unidades</option>
                        </select>
                    </div>
                    <div style={{ flex: '1 1 30%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>META</label>
                        <input
                            name="targetValue"
                            type="number"
                            placeholder="Ej: 100"
                            required
                            className={styles.visiblePlaceholder}
                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.6rem', fontSize: '0.9rem', color: 'black' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 30%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>UNIDAD</label>
                        <input
                            name="metricUnit"
                            value={metricUnit}
                            onChange={(e) => setMetricUnit(e.target.value)}
                            placeholder={trackingType === 'PERCENTAGE' ? '%' : 'Ej: Clientes'}
                            required
                            readOnly={trackingType === 'PERCENTAGE'}
                            className={styles.visiblePlaceholder}
                            style={{
                                width: '100%',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '0.6rem',
                                fontSize: '0.9rem',
                                color: 'black',
                                background: trackingType === 'PERCENTAGE' ? '#f8fafc' : 'white'
                            }}
                        />
                    </div>
                    <div style={{ flex: '1 1 30%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>PERIOCIDAD</label>
                        <select
                            name="updatePeriodicity"
                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.6rem', fontSize: '0.9rem', color: 'black', background: 'white', outline: 'none' }}
                        >
                            <option value="">(Opcional)</option>
                            <option value="DAILY">Diaria</option>
                            <option value="WEEKLY">Semanal</option>
                            <option value="BIWEEKLY">Quincenal</option>
                            <option value="MONTHLY">Mensual</option>
                            <option value="QUARTERLY">Trimestral</option>
                            <option value="YEARLY">Anual</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        style={{ background: 'white', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        style={{ background: '#334155', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Guardar KR
                    </button>
                </div>
            </form>
        </div>
    );
}
