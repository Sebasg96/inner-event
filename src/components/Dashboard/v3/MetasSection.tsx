'use client';

import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';

interface MetasSectionProps {
    themeColor?: string;
}

interface Meta {
    label: string;
    target: number;
    current: number;
}

// Initial mock strategic goals
const INITIAL_METAS: Meta[] = [
    { label: 'Reducir en 30%\nlos eventos adversos', target: 30, current: 18 },
    { label: 'NPS GLOBAL\n> 80%', target: 80, current: 65 },
    { label: '5 servicios nuevos\nde alta complejidad', target: 5, current: 2 },
    { label: 'Digitalización\n6 procesos críticos', target: 6, current: 3 },
    { label: 'Margen EBITDA\n>15%', target: 15, current: 9 },
    { label: 'Rotación de\npersonal crítico ≤10%', target: 10, current: 7 },
];

function DonutChart({ current, target, color }: { current: number; target: number; color: string }) {
    const progress = Math.min(100, Math.round((current / target) * 100));
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

export default function MetasSection({ themeColor }: MetasSectionProps = {}) {
    const [metas, setMetas] = useState<Meta[]>(INITIAL_METAS);
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
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
        const newMeta: Meta = {
            label: newLabel,
            target: 100,
            current: newProgress
        };
        setMetas([...metas, newMeta]);
        setNewLabel('');
        setNewProgress(50);
        setIsAdding(false);
    };

    const handleUpdateMeta = (index: number) => {
        const updatedMetas = [...metas];
        updatedMetas[index].current = editProgress;
        setMetas(updatedMetas);
        setEditingIndex(null);
    };

    const handleDeleteMeta = (index: number) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta meta?')) {
            const updatedMetas = metas.filter((_, i) => i !== index);
            setMetas(updatedMetas);
            if (editingIndex === index) setEditingIndex(null);
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
        }}>
            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '3px', height: themeColor ? '20px' : '14px', background: accentColor, borderRadius: '2px' }} />
                <span style={{ fontSize, fontWeight, letterSpacing, textTransform: 'uppercase', color: titleColor }}>
                    Metas Estratégicas
                </span>
                <span style={{
                    background: 'rgba(255,200,0,0.15)', color: 'rgba(255,200,0,0.8)',
                    fontSize: '0.55rem', padding: '0.1rem 0.4rem', borderRadius: '10px', border: '1px solid rgba(255,200,0,0.2)',
                }}>Mock</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', minWidth: 'max-content' }}>
                {metas.map((meta, i) => (
                    <div key={i} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${editingIndex === i ? accentColor : COLORS[i % COLORS.length] + '30'}`,
                        borderRadius: '12px',
                        padding: '0.75rem',
                        minWidth: '120px',
                        position: 'relative',
                        transition: 'all 0.2s',
                    }}>
                        {/* Delete Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMeta(i);
                            }}
                            style={{
                                position: 'absolute', top: '5px', right: '5px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgba(255,255,255,0.2)', padding: '4px',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                        >
                            <Trash2 size={12} />
                        </button>

                        {editingIndex === i ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff' }}>{editProgress}%</div>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={editProgress}
                                    onChange={(e) => setEditProgress(parseInt(e.target.value))}
                                    style={{ width: '80%', cursor: 'pointer', accentColor: accentColor }}
                                />
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button
                                        onClick={() => handleUpdateMeta(i)}
                                        style={{
                                            background: accentColor, color: '#fff', border: 'none',
                                            borderRadius: '4px', padding: '2px 8px', fontSize: '0.65rem',
                                            fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        OK
                                    </button>
                                    <button
                                        onClick={() => setEditingIndex(null)}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
                                            borderRadius: '4px', padding: '2px 8px', fontSize: '0.65rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => {
                                    setEditingIndex(i);
                                    setEditProgress(meta.current);
                                }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%' }}
                                title="Click para editar progreso"
                            >
                                <DonutChart current={meta.current} target={meta.target} color={COLORS[i % COLORS.length]} />
                                <p style={{
                                    fontSize: '0.6rem', color: 'rgba(255,255,255,0.65)',
                                    textAlign: 'center', margin: 0, lineHeight: 1.4,
                                    whiteSpace: 'pre-line',
                                }}>
                                    {meta.label}
                                </p>
                                <div style={{
                                    fontSize: '0.55rem', fontWeight: 600, color: accentColor,
                                    opacity: 0, transition: 'opacity 0.2s', marginTop: '2px'
                                }} className="edit-hint">Editar</div>
                            </div>
                        )}
                        <style>{`
                            div:hover .edit-hint { opacity: 0.8 !important; }
                        `}</style>
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
                                <span>Progreso</span>
                                <span>{newProgress}%</span>
                            </div>
                            <input
                                type="range"
                                min="1"
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
        </div>
    );
}
