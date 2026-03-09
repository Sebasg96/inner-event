'use client';

import { ObjectiveData } from '@/app/dashboard/actions';

interface ObjectiveCardProps {
    objective: ObjectiveData;
    color: string;
    accentColor: string;
}

function MiniProgressBar({ progress, color }: { progress: number; color: string }) {
    return (
        <div style={{
            width: '100%', height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px', overflow: 'hidden', marginTop: '0.5rem',
        }}>
            <div style={{
                height: '100%', width: `${progress}%`,
                background: color,
                borderRadius: '4px',
                transition: 'width 0.8s ease',
                boxShadow: `0 0 6px ${color}`,
            }} />
        </div>
    );
}

export default function ObjectiveCard({ objective, color, accentColor }: ObjectiveCardProps) {
    const statusEmoji = objective.progress >= 80 ? '✅' : objective.progress >= 50 ? '⚠️' : '🔴';

    return (
        <div style={{
            background: `${color}18`,
            border: `1px solid ${color}50`,
            borderLeft: `3px solid ${color}`,
            borderRadius: '10px',
            padding: '0.75rem 0.9rem',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            cursor: 'default',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
        }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 20px ${color}30`;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
        >
            <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <p style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1.4, margin: 0, flex: 1,
                    }}>
                        {objective.statement}
                    </p>
                    <span style={{ fontSize: '0.7rem', flexShrink: 0 }}>{statusEmoji}</span>
                </div>
            </div>

            <div>
                <MiniProgressBar progress={objective.progress} color={accentColor} />
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: '0.35rem',
                }}>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
                        {objective.keyResults.length} KR{objective.keyResults.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: accentColor }}>
                        {objective.progress}%
                    </span>
                </div>
            </div>
        </div>
    );
}
