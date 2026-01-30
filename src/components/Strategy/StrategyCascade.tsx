'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './StrategyCascade.module.css';
import AccessManager from './AccessManager';

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

    // Calculate Global Stats
    let totalObjectives = 0;
    let totalKRs = 0;
    let totalInitiatives = 0;
    let totalProgress = 0;
    let countForProgress = 0;

    const traverse = (objs: Objective[]) => {
        objs.forEach(obj => {
            totalObjectives++;
            obj.keyResults.forEach(kr => {
                totalKRs++;
                kr.initiatives?.forEach(init => {
                    totalInitiatives++;
                    totalProgress += init.progress;
                    countForProgress++;
                });
            });
            if (obj.childObjectives) traverse(obj.childObjectives);
        });
    };
    traverse(topObjectives);

    const globalProgress = countForProgress > 0 ? Math.round(totalProgress / countForProgress) : 0;

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
                                <AccessManager
                                    entityType="objective"
                                    entityId={obj.id}
                                    entityTitle={obj.statement}
                                    trigger={
                                        <div
                                            title="Compartir Objetivo (Gestionar Acceso)"
                                            className={styles.shareTrigger}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                cursor: 'pointer',
                                                marginLeft: '0.4rem',
                                                color: 'hsl(var(--text-muted))',
                                                transition: 'all 0.2s',
                                                background: 'rgba(255, 255, 255, 0.05)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.color = 'hsl(var(--primary))';
                                                e.currentTarget.style.background = 'hsl(var(--primary) / 0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = 'hsl(var(--text-muted))';
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="18" cy="5" r="3"></circle>
                                                <circle cx="6" cy="12" r="3"></circle>
                                                <circle cx="18" cy="19" r="3"></circle>
                                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                            </svg>
                                        </div>
                                    }
                                />
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
                                        backgroundColor: kr.initiatives && kr.initiatives.length > 0 ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                                        opacity: kr.initiatives && kr.initiatives.length > 0 ? 0.8 : 0.3
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
            <div className={styles.statsBar}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Cumplimiento General</span>
                    <span className={styles.statValue}>{globalProgress}%</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Objetivos Totales</span>
                    <span className={styles.statValue}>{totalObjectives}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total KRs</span>
                    <span className={styles.statValue}>{totalKRs}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Iniciativas Activas</span>
                    <span className={styles.statValue}>{totalInitiatives}</span>
                </div>
            </div>

            <h2 className={styles.title}>Árbol de Objetivos </h2>
            <div className={styles.tree}>
                {topObjectives.map(obj => (
                    <ObjectiveNode key={obj.id} obj={obj} level={1} />
                ))}
            </div>
        </div>
    );
}
