'use client';

import { useState, useTransition } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { createStrategicGoal, updateStrategicGoalValue, deleteStrategicGoal } from '@/app/actions';

interface Meta {
    id: string;
    statement: string;
    targetValue: number;
    currentValue: number;
}

interface MetasSectionProps {
    themeColor?: string;
    metas?: Meta[];
}

function DonutChart({ current, target, color }: { current: number; target: number; color: string }) {
    const progress = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
    const size = 72;
    const r = 28;
    const circ = 2 * Math.PI * r;
    const offset = circ - (progress / 100) * circ;

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth="6"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{progress}%</span>
            </div>
        </div>
    );
}

const COLORS = [
    'hsl(174, 100%, 45%)',
    'hsl(200, 100%, 55%)',
    'hsl(160, 80%, 50%)',
    'hsl(220, 100%, 65%)',
    'hsl(140, 70%, 50%)',
    'hsl(180, 90%, 50%)',
];

export default function MetasSection({ themeColor, metas = [] }: MetasSectionProps) {
    const [isPending, startTransition] = useTransition();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newLabel, setNewLabel] = useState('');
    const [newProgress, setNewProgress] = useState(50);
    const [editProgress, setEditProgress] = useState(50);

    const accentColor = themeColor || 'hsl(174, 100%, 45%)';
    const titleColor = themeColor ? themeColor : 'rgba(255,255,255,0.5)';
    const fontSize = themeColor ? '1.25rem' : '0.65rem';
    const fontWeight = themeColor ? 600 : 700;
    const letterSpacing = themeColor ? '1px' : '0.12em';

    const handleAddMeta = () => {
        if (!newLabel.trim()) return;
        startTransition(async () => {
            await createStrategicGoal(newLabel, 100, newProgress);
            setNewLabel('');
            setNewProgress(50);
            setIsAdding(false);
        });
    };

    const handleUpdateMeta = (id: string) => {
        startTransition(async () => {
            await updateStrategicGoalValue(id, editProgress);
            setEditingId(null);
        });
    };

    const handleDeleteMeta = (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta meta?')) {
            startTransition(async () => {
                await deleteStrategicGoal(id);
                if (editingId === id) setEditingId(null);
            });
        }
    };

    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            overflowX: 'auto',
            opacity: isPending ? 0.7 : 1,
            pointerEvents: isPending ? 'none' : 'auto',
            transition: 'opacity 0.2s'
        }}>
            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '3px', height: themeColor ? '20px' : '14px', background: accentColor, borderRadius: '2px' }} />
                <span style={{ fontSize, fontWeight, letterSpacing, textTransform: 'uppercase', color: titleColor }}>
                    Metas Estratégicas
                </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', minWidth: 'max-content' }}>
                {metas.map((meta, i) => (
                    <div key={meta.id} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${editingId === meta.id ? accentColor : COLORS[i % COLORS.length] + '30'}`,
                        borderRadius: '12px',
                        padding: '0.75rem',
                        width: '180px',
                        position: 'relative'
                    }}>
                        {editingId === meta.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff' }}>{editProgress}%</div>
                                <input
                                    type="range"
                                    min="0"
                                    max={meta.targetValue}
                                    value={editProgress}
                                    onChange={(e) => setEditProgress(parseInt(e.target.value))}
                                    style={{ width: '80%', cursor: 'pointer', accentColor: accentColor }}
                                />
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button
                                        onClick={() => handleUpdateMeta(meta.id)}
                                        style={{
                                            background: accentColor, color: '#fff', border: 'none',
                                            borderRadius: '4px', padding: '2px 8px', fontSize: '0.65rem',
                                            fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        OK
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
                                            borderRadius: '4px', padding: '2px 8px', fontSize: '0.65rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ×
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMeta(meta.id)}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none',
                                            borderRadius: '4px', padding: '2px 8px', fontSize: '0.65rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => {
                                    setEditingId(meta.id);
                                    setEditProgress(meta.currentValue);
                                }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%' }}
                                title="Click para editar progreso"
                            >
                                <DonutChart current={meta.currentValue} target={meta.targetValue} color={COLORS[i % COLORS.length]} />
                                <p style={{
                                    fontSize: '0.6rem', color: 'rgba(255,255,255,0.65)',
                                    textAlign: 'center', margin: 0, lineHeight: 1.4,
                                    whiteSpace: 'pre-line',
                                    fontWeight: 500
                                }}>
                                    {meta.statement}
                                </p>
                                <div style={{
                                    fontSize: '0.55rem', fontWeight: 600, color: accentColor,
                                    opacity: 0, transition: 'opacity 0.2s', marginTop: '2px'
                                }} className="edit-hint">Editar</div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Meta Form/Card */}
                {isAdding ? (
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.08)',
                        border: `1px dashed ${accentColor}`,
                        borderRadius: '12px',
                        padding: '0.75rem',
                        width: '180px',
                    }}>
                        <input
                            type="text"
                            placeholder="Nombre de la meta..."
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '0.4rem',
                                color: '#fff',
                                fontSize: '0.7rem'
                            }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>
                                <span>Progreso Inicial</span>
                                <span>{newProgress}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={newProgress}
                                onChange={(e) => setNewProgress(parseInt(e.target.value))}
                                style={{ width: '100%', cursor: 'pointer', accentColor: accentColor }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <button
                                onClick={handleAddMeta}
                                style={{
                                    flex: 1, background: accentColor, color: '#fff',
                                    border: 'none', borderRadius: '6px', padding: '0.35rem',
                                    fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                Guardar
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)', color: '#fff',
                                    border: 'none', borderRadius: '6px', padding: '0.35rem',
                                    paddingInline: '0.5rem',
                                    fontSize: '0.7rem', cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '0.5rem',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px dashed rgba(255,255,255,0.15)',
                            borderRadius: '12px',
                            padding: '0.75rem',
                            minWidth: '100px',
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.3)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = accentColor;
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                        }}
                    >
                        <div style={{
                            fontSize: '1.5rem', fontWeight: 300,
                            lineHeight: 1, marginTop: '-2px'
                        }}>+</div>
                        <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>Nueva Meta</span>
                    </button>
                )}
            </div>
            <style jsx>{`
                div:hover .edit-hint { opacity: 0.8 !important; }
            `}</style>
        </div>
    );
}
