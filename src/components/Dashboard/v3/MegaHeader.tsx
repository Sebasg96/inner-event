'use client';

import { MegaData } from '@/app/dashboard/actions';

interface MegaHeaderProps {
    mega: MegaData;
}

function ProgressRing({ progress }: { progress: number }) {
    const r = 22;
    const circ = 2 * Math.PI * r;
    const offset = circ - (progress / 100) * circ;
    return (
        <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle
                cx="30" cy="30" r={r} fill="none"
                stroke="hsl(174, 100%, 45%)"
                strokeWidth="4"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text
                x="30" y="30"
                textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontSize="11" fontWeight="700"
                style={{ transform: 'rotate(90deg)', transformOrigin: '30px 30px' }}
            >
                {progress}%
            </text>
        </svg>
    );
}

export default function MegaHeader({ mega }: MegaHeaderProps) {
    const year = new Date(mega.deadline).getFullYear();

    return (
        <div style={{
            background: 'linear-gradient(135deg, hsl(222, 60%, 14%) 0%, hsl(220, 47%, 11%) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            padding: '1.25rem 1.75rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        }}>
            {/* Left: Label + progress ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '80px' }}>
                <ProgressRing progress={mega.overallProgress} />
                <span style={{
                    fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'hsl(174, 100%, 55%)', fontWeight: 700,
                }}>MEGA</span>
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                    Meta Estratégica
                </span>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)' }} />

            {/* Center: Statement */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{
                        background: 'hsl(174, 100%, 35%)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        letterSpacing: '0.08em',
                    }}>
                        ESTRATEGIA {year}
                    </span>
                </div>
                <p style={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: 1.5,
                    margin: 0,
                }}>
                    {mega.statement}
                </p>
            </div>
        </div>
    );
}
