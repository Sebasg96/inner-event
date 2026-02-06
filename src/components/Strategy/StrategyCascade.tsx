'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './StrategyCascade.module.css';

// Define types
interface Initiative {
    id: string;
    progress: number;
}

interface KeyResult {
    id: string;
    statement: string;
    initiatives?: Initiative[];
}

interface Objective {
    id: string;
    statement: string;
    keyResults: KeyResult[];
    childObjectives?: Objective[];
    owner?: { name: string };
}

interface Mega {
    objectives: Objective[];
}

interface Purpose {
    megas: Mega[];
}

interface Props {
    purpose: Purpose | null;
}

export default function StrategyCascade({ purpose }: Props) {
    const router = useRouter();
    if (!purpose || !purpose.megas[0]) return <div>No strategic data found.</div>;

    const mega = purpose.megas[0];
    const topObjectives = mega.objectives;

    const ObjectiveNode = ({ obj, level }: { obj: Objective; level: number }) => {
        const [isExpanded, setIsExpanded] = React.useState(false); // Default collapsed
        const hasChildren = obj.childObjectives && obj.childObjectives.length > 0;

        const handleToggle = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (hasChildren) setIsExpanded(!isExpanded);
        };

        return (
            <div className={styles.nodeWrapper}>
                <div
                    className={`${styles.node} ${styles['level' + level]}`}
                    onClick={handleToggle}
                    style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                >
                    <div className={styles.header}>
                        <span className={styles.role}>
                            {level === 1 ? 'Corporativo' : level === 2 ? 'Área' : 'Equipo'}
                        </span>
                        {/* Toggle Button */}
                        {hasChildren && (
                            <button
                                className={styles.toggleBtn}
                                title={isExpanded ? "Collapse" : "Expand"}
                            >
                                {isExpanded ? '−' : '+'}
                            </button>
                        )}
                    </div>

                    <div className={styles.content}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <h4 style={{ flex: 1 }}>{obj.statement}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {obj.keyResults.some(kr => kr.initiatives && kr.initiatives.length > 0) && (
                                    <span title="Tiene iniciativas activas" style={{ fontSize: '0.9rem' }}>🚀</span>
                                )}
                                {obj.owner && <div className={styles.ownerAvatar} title={obj.owner.name}>{obj.owner.name.charAt(0)}</div>}
                            </div>
                        </div>

                        {/* KRs Preview */}
                        <div className={styles.krs}>
                            {obj.keyResults.map(kr => (
                                <div
                                    key={kr.id}
                                    className={styles.krDot}
                                    title={`KR: ${kr.statement} (Gestionar Iniciativas)`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push('/strategy/execution');
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                        width: '8px',
                                        height: '8px',
                                        backgroundColor: kr.initiatives && kr.initiatives.length > 0 ? '#0FB4A8' : '#cbd5e1', // Primary Teal vs Slate 300
                                        opacity: 1, // Full opacity for visibility
                                        border: kr.initiatives && kr.initiatives.length > 0 ? 'none' : '1px solid #94a3b8' // Border for empty ones
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Children Recursion */}
                {
                    obj.childObjectives && obj.childObjectives.length > 0 && isExpanded && (
                        <div className={styles.children}>
                            {obj.childObjectives.map(child => (
                                <ObjectiveNode key={child.id} obj={child} level={level + 1} />
                            ))}
                        </div>
                    )
                }
                {/* Collapsed Indicator */}
                {
                    obj.childObjectives && obj.childObjectives.length > 0 && !isExpanded && (
                        <div className={styles.collapsedLine} />
                    )
                }
            </div >
        );
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Árbol de Objetivos </h2>
            <div className={styles.tree}>
                {topObjectives.map(obj => (
                    <ObjectiveNode key={obj.id} obj={obj} level={1} />
                ))}
            </div>
        </div>
    );
}
