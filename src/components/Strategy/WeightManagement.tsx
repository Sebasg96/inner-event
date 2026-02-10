import React, { useState, useEffect, useMemo } from 'react';
import { updateObjectiveWeight, updateKeyResultWeight, updateWeightsBatch } from '@/app/actions';
import { Scale, Target, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Save } from 'lucide-react';

interface KR {
    id: string;
    statement: string;
    weight: number;
}

interface Objective {
    id: string;
    statement: string;
    weight: number;
    keyResults: KR[];
    childObjectives?: Objective[];
}

interface Mega {
    id: string;
    statement: string;
    objectives: Objective[];
}

interface Purpose {
    id: string;
    statement: string;
    megas: Mega[];
}

interface Props {
    purpose: Purpose | null;
    themeColor: string;
}

interface ObjectiveItemProps {
    obj: Objective;
    parentId: string;
    level?: number;
    siblings?: Objective[];
    localWeights: Record<string, number | string>;
    expandedObjectives: Record<string, boolean>;
    toggleObjective: (id: string) => void;
    handleWeightChange: (id: string, value: string | number) => void;
    saveBlocked: Record<string, boolean>;
    themeColor: string;
    dbWeights: Record<string, number>;
}

const ObjectiveItem = ({
    obj,
    parentId,
    level = 0,
    siblings = [],
    localWeights,
    expandedObjectives,
    toggleObjective,
    handleWeightChange,
    saveBlocked,
    themeColor,
    dbWeights
}: ObjectiveItemProps) => {

    const calculateTotalWeight = (items: (Objective | KR)[]) => {
        return items.reduce<number>((acc, item) => {
            const val = localWeights[item.id] ?? item.weight ?? 1;
            return acc + (typeof val === 'string' ? parseFloat(val) || 0 : val);
        }, 0);
    };

    const totalKRsWeight = calculateTotalWeight(obj.keyResults || []);
    const totalChildrenWeight = calculateTotalWeight(obj.childObjectives || []);
    const isKROver100 = totalKRsWeight > 100;
    const isChildrenOver100 = totalChildrenWeight > 100;

    const currentWeight = localWeights[obj.id] ?? obj.weight ?? 1;
    const hasChanged = dbWeights[obj.id] !== undefined && parseFloat(String(currentWeight)) !== dbWeights[obj.id];

    return (
        <div style={{
            background: level === 0 ? 'rgba(255,255,255,0.5)' : 'transparent',
            borderRadius: '12px',
            marginBottom: level === 0 ? '1.5rem' : '0',
            ...(level === 0 ? {
                border: `1px solid ${isKROver100 || isChildrenOver100 ? '#ef444444' : '#e2e8f0'}`,
                padding: '1.5rem'
            } : {
                borderLeft: `2px dashed ${themeColor}33`,
                padding: '0.5rem 0',
                paddingLeft: '1.5rem'
            })
        }}>
            {/* Objective Weight Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: level === 0 || expandedObjectives[obj.id] ? '1.5rem' : '0', flexWrap: 'nowrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    {(obj.keyResults?.length > 0 || (obj.childObjectives?.length || 0) > 0) && (
                        <button
                            onClick={() => toggleObjective(obj.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: themeColor,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {expandedObjectives[obj.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>
                    )}
                    <Target size={20} color={themeColor} />
                    <span style={{ fontWeight: 600, fontSize: level === 0 ? '1rem' : '0.9rem' }}>{obj.statement}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>PESO</div>
                        {saveBlocked[obj.id] ? (
                            <div style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700 }}>BLOQUEADO (SUMA &gt; 100%)</div>
                        ) : (siblings.length > 0 && Math.abs(siblings.reduce((acc, s) => acc + (typeof (localWeights[s.id] ?? s.weight) === 'string' ? parseFloat(localWeights[s.id] as string) : (localWeights[s.id] as number ?? s.weight ?? 1)), 0) - 100) > 0.1) && (
                            <div style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700 }}>Suma Actual != 100%</div>
                        )}
                    </div>
                    <div style={{ position: 'relative', width: '90px' }}>
                        <input
                            type="number"
                            value={currentWeight}
                            onChange={(e) => handleWeightChange(obj.id, e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.4rem 0.5rem',
                                borderRadius: '8px',
                                border: `2px solid ${saveBlocked[obj.id] ? '#ef4444' : hasChanged ? themeColor : '#cbd5e1'}`,
                                fontWeight: 700,
                                textAlign: 'center',
                                color: saveBlocked[obj.id] ? '#ef4444' : '#1e293b',
                                backgroundColor: hasChanged ? `${themeColor}11` : 'white'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Expanded Content (KRs and Child Objectives) */}
            <div style={{ display: expandedObjectives[obj.id] ? 'block' : 'none' }}>
                {/* KRs Section */}
                {obj.keyResults?.length > 0 && (
                    <div style={{ marginBottom: (obj.childObjectives?.length || 0) > 0 ? '1.5rem' : '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h4 style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                Resultados Clave (Ponderación interna)
                            </h4>
                            {isKROver100 ? (
                                <div style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 700 }}>
                                    SUMA: {totalKRsWeight.toFixed(1)}% (&gt;100%)
                                </div>
                            ) : Math.abs(totalKRsWeight - 100) > 0.1 ? (
                                <div style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700 }}>
                                    SUMA: {totalKRsWeight.toFixed(1)}% (Debe ser 100%)
                                </div>
                            ) : (
                                <div style={{ color: '#22c55e', fontSize: '0.7rem', fontWeight: 700 }}>
                                    SUMA: 100%
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {obj.keyResults.map(kr => {
                                const rawWeight = localWeights[kr.id] ?? kr.weight ?? 1;
                                const krWeight = typeof rawWeight === 'string' ? parseFloat(rawWeight) || 0 : rawWeight;
                                const relevance = totalKRsWeight > 0 ? (krWeight / totalKRsWeight * 100).toFixed(1) : 0;
                                const krChanged = dbWeights[kr.id] !== undefined && parseFloat(String(krWeight)) !== dbWeights[kr.id];

                                return (
                                    <div key={kr.id} style={{
                                        background: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: `1px solid ${saveBlocked[kr.id] ? '#ef4444' : '#f1f5f9'}`
                                    }}>
                                        <span style={{ fontSize: '0.85rem', color: '#1e293b', flex: 1 }}>{kr.statement}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                                <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block' }}>RELEVANCIA</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: themeColor }}>{relevance}%</span>
                                            </div>
                                            <div style={{ position: 'relative', width: '80px' }}>
                                                <input
                                                    type="number"
                                                    value={krWeight}
                                                    onChange={(e) => handleWeightChange(kr.id, e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.3rem 0.5rem',
                                                        borderRadius: '6px',
                                                        border: `2px solid ${saveBlocked[kr.id] ? '#ef4444' : krChanged ? themeColor : '#e2e8f0'}`,
                                                        textAlign: 'center',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        color: saveBlocked[kr.id] ? '#ef4444' : '#1e293b',
                                                        backgroundColor: krChanged ? `${themeColor}11` : 'white'
                                                    }}
                                                />
                                                {saveBlocked[kr.id] && (
                                                    <div style={{ position: 'absolute', top: '-15px', right: 0, fontSize: '0.5rem', color: '#ef4444', fontWeight: 800 }}>BLOQUEADO</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Sub-Objectives recursively */}
                {obj.childObjectives?.map(child => (
                    <ObjectiveItem
                        key={child.id}
                        obj={child}
                        parentId={obj.id}
                        level={level + 1}
                        siblings={obj.childObjectives}
                        localWeights={localWeights}
                        expandedObjectives={expandedObjectives}
                        toggleObjective={toggleObjective}
                        handleWeightChange={handleWeightChange}
                        saveBlocked={saveBlocked}
                        themeColor={themeColor}
                        dbWeights={dbWeights}
                    />
                ))}
            </div>
        </div>
    );
};

export default function WeightManagement({ purpose, themeColor }: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [localWeights, setLocalWeights] = useState<Record<string, number | string>>({});
    const [dbWeights, setDbWeights] = useState<Record<string, number>>({});
    const [expandedObjectives, setExpandedObjectives] = useState<Record<string, boolean>>({});
    const [saveBlocked, setSaveBlocked] = useState<Record<string, boolean>>({});

    // Initialize local weights and tracking from purpose
    useEffect(() => {
        if (!purpose) return;
        const weights: Record<string, number | string> = {};
        const originals: Record<string, number> = {};

        const scanObj = (obj: Objective) => {
            const w = (obj.weight !== undefined && obj.weight !== null) ? obj.weight : 1;
            weights[obj.id] = w;
            originals[obj.id] = w;

            if (obj.keyResults) {
                obj.keyResults.forEach(kr => {
                    const kw = (kr.weight !== undefined && kr.weight !== null) ? kr.weight : 1;
                    weights[kr.id] = kw;
                    originals[kr.id] = kw;
                });
            }

            if (obj.childObjectives) {
                obj.childObjectives.forEach(scanObj);
            }
        };

        purpose.megas.forEach(mega => {
            mega.objectives.forEach(scanObj);
        });

        setLocalWeights(weights);
        setDbWeights(originals);
    }, [purpose]);

    if (!purpose || !purpose.megas) return <div>No hay datos estratégicos para gestionar ponderaciones.</div>;

    const toggleObjective = (id: string) => {
        setExpandedObjectives(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleWeightChange = (id: string, value: string | number) => {
        setLocalWeights(prev => ({ ...prev, [id]: value }));

        // Re-validate all groups related to this change would be complex
        // For simplicity, we re-validate the parent group in render, but here we just clear specific blocks if any
        // Ideally we should run a validation pass on the affected group
    };

    const hasChanges = useMemo(() => {
        for (const id in localWeights) {
            if (dbWeights[id] !== undefined && parseFloat(String(localWeights[id])) !== dbWeights[id]) {
                return true;
            }
        }
        return false;
    }, [localWeights, dbWeights]);

    const globalValidationErrors = useMemo(() => {
        let errors = 0;

        const validateGroup = (items: (Objective | KR)[], limit = 100) => {
            const total = items.reduce((acc, item) => {
                const val = parseFloat(String(localWeights[item.id] ?? item.weight ?? 0)) || 0;
                return acc + val;
            }, 0);
            if (total > limit) errors++;
        };

        purpose.megas.forEach(mega => {
            validateGroup(mega.objectives);
            const scan = (obj: Objective) => {
                if (obj.keyResults?.length > 0) validateGroup(obj.keyResults);
                if (obj.childObjectives?.length > 0) validateGroup(obj.childObjectives);
                obj.childObjectives?.forEach(scan);
            };
            mega.objectives.forEach(scan);
        });

        return errors;
    }, [localWeights, purpose]);

    const handleBatchSave = async () => {
        if (globalValidationErrors > 0) {
            alert("Hay grupos de ponderación que exceden el 100%. Por favor corrígelos antes de guardar.");
            return;
        }

        setIsSaving(true);
        const updates: { type: 'OBJECTIVE' | 'KR', id: string, weight: number }[] = [];

        // Traverse to find changes
        const scanObj = (obj: Objective) => {
            const currentObjW = parseFloat(String(localWeights[obj.id] ?? 0));
            if (dbWeights[obj.id] !== undefined && currentObjW !== dbWeights[obj.id]) {
                updates.push({ type: 'OBJECTIVE', id: obj.id, weight: currentObjW });
            }

            if (obj.keyResults) {
                obj.keyResults.forEach(kr => {
                    const currentKrW = parseFloat(String(localWeights[kr.id] ?? 0));
                    if (dbWeights[kr.id] !== undefined && currentKrW !== dbWeights[kr.id]) {
                        updates.push({ type: 'KR', id: kr.id, weight: currentKrW });
                    }
                });
            }

            if (obj.childObjectives) {
                obj.childObjectives.forEach(scanObj);
            }
        };

        purpose.megas.forEach(mega => {
            mega.objectives.forEach(scanObj);
        });

        if (updates.length === 0) {
            setIsSaving(false);
            return;
        }

        try {
            await updateWeightsBatch(updates);
            // Update local DB Reference
            setDbWeights(prev => {
                const next = { ...prev };
                updates.forEach(u => next[u.id] = u.weight);
                return next;
            });
            // Dispatch event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('kr-updated'));
            }
            alert("Ponderaciones guardadas exitosamente.");
        } catch (e) {
            console.error(e);
            alert("Error al guardar ponderaciones.");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to calculate total weight of children (Objectives or KRs)
    const calculateTotalWeight = (items: (Objective | KR)[]) => {
        return items.reduce<number>((acc, item) => {
            const val = localWeights[item.id] ?? item.weight ?? 1;
            return acc + (typeof val === 'string' ? parseFloat(val) || 0 : val);
        }, 0);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{
                padding: '1rem 1.5rem',
                position: 'sticky',
                top: '1rem',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: `1px solid ${themeColor}44`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Scale size={24} color={themeColor} />
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Gestión de Ponderaciones</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                            Ajusta los pesos y guarda al finalizar.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {globalValidationErrors > 0 && (
                        <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} />
                            <span>{globalValidationErrors} Errores de suma</span>
                        </div>
                    )}
                    <button
                        onClick={handleBatchSave}
                        disabled={!hasChanges || globalValidationErrors > 0 || isSaving}
                        style={{
                            background: hasChanges && globalValidationErrors === 0 ? themeColor : '#e2e8f0',
                            color: hasChanges && globalValidationErrors === 0 ? 'white' : '#94a3b8',
                            border: 'none',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            fontWeight: 700,
                            cursor: (hasChanges && globalValidationErrors === 0 && !isSaving) ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            boxShadow: (hasChanges && globalValidationErrors === 0) ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                        }}
                    >
                        {isSaving ? (
                            <>Guardando...</>
                        ) : (
                            <>
                                <Save size={18} /> Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>

            {purpose.megas.map((mega, mi) => (
                <div key={mega.id} className="glass-panel" style={{ padding: '2rem', border: `1px solid ${themeColor}22` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{
                            background: themeColor,
                            color: 'white',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.8rem'
                        }}>MEGA {mi + 1}</div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{mega.statement}</h3>
                    </div>

                    {(() => {
                        const totalMegaObjWeight = calculateTotalWeight(mega.objectives);
                        const isOver100 = totalMegaObjWeight > 100;
                        const isNot100 = Math.abs(totalMegaObjWeight - 100) > 0.1;

                        return (
                            <div style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                background: isOver100 ? '#fef2f2' : isNot100 ? '#fffbeb' : '#f0fdf4',
                                border: `1px solid ${isOver100 ? '#ef4444' : isNot100 ? '#f59e0b' : '#22c55e'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '2rem'
                            }}>
                                {isOver100 ? (
                                    <AlertCircle size={18} color="#ef4444" />
                                ) : isNot100 ? (
                                    <AlertCircle size={18} color="#f59e0b" />
                                ) : (
                                    <CheckCircle2 size={18} color="#22c55e" />
                                )}
                                <span style={{ fontSize: '0.9rem', color: isOver100 ? '#991b1b' : isNot100 ? '#92400e' : '#166534', fontWeight: 600 }}>
                                    Suma de niveles directos de MEGA: {totalMegaObjWeight.toFixed(1)}%
                                    {isOver100 ? " (Excede el máximo)" : isNot100 ? " (Debe ser 100%)" : ""}
                                </span>
                            </div>
                        );
                    })()}

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {mega.objectives.map(obj => (
                            <div key={obj.id}>
                                <ObjectiveItem
                                    obj={obj}
                                    parentId={mega.id}
                                    siblings={mega.objectives}
                                    localWeights={localWeights}
                                    expandedObjectives={expandedObjectives}
                                    toggleObjective={toggleObjective}
                                    handleWeightChange={handleWeightChange}
                                    saveBlocked={saveBlocked}
                                    themeColor={themeColor}
                                    dbWeights={dbWeights}
                                    // Removed old handlers
                                    handleUpdateObjectiveWeight={() => { }}
                                    handleUpdateKRWeight={() => { }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <style jsx>{`
                .spinner {
                    border: 2px solid rgba(0, 0, 0, 0.1);
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                    border-left-color: ${themeColor};
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
