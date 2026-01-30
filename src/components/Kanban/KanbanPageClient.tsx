'use client';

// Create a Client Wrapper for the internal part or just make it Client?
// The data fetching needs to be Server.
// So Home (page.tsx) is Server, fetches, passes to HomeClient.
// Let's create `src/components/HomeClient.tsx` similar to StrategyDashboard.
// BUT, refactoring `page.tsx` is easier if I just inline the client component or split it.
// I'll create `src/components/Kanban/KanbanPageClient.tsx`.

// import KanbanBoard from '@/components/Kanban/KanbanBoard';
import NavBar from '@/components/NavBar';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';
import InitiativeCreator from '@/components/Strategy/InitiativeCreator';
import React, { useState } from 'react';


// Define types
interface TeamMember {
    user: {
        name: string;
        discProfile?: {
            color: string;
        } | null;
    };
}

interface Team {
    members: TeamMember[];
}

interface KR {
    id: string;
    statement: string;
}

interface Initiative {
    id: string;
    title: string;
    status: string;
    horizon: string;
    progress?: number;
    owner?: {
        name: string;
        lastName: string | null;
        area: string | null;
    } | null;
    team?: Team | null;
}

type Props = {
    initiatives: Initiative[];
    krs: KR[];
};

export default function KanbanPageClient({ initiatives, krs }: Props) {
    const { dict } = useLanguage();
    const [showCreator, setShowCreator] = useState(false);

    return (
        <main style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <h1 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {dict.nav.kanban}
                    </h1>
                    <button
                        onClick={() => setShowCreator(!showCreator)}
                        style={{
                            background: showCreator ? '#ef4444' : 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '0.4rem 1.2rem',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            boxShadow: showCreator ? 'none' : '0 4px 12px var(--primary-glow)'
                        }}
                    >
                        {showCreator ? 'Cancelar' : '➕ Nueva Iniciativa'}
                    </button>
                </div>
                <NavBar />
            </div>

            {showCreator && (
                <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto', width: '100%' }}>
                    <InitiativeCreator
                        krs={krs}
                        onSuccess={() => setShowCreator(false)}
                    />
                </div>
            )}

            {initiatives.length === 0 && !showCreator && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚀</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', marginBottom: '1rem' }}>No hay iniciativas activas</h2>
                    <p style={{ maxWidth: '400px', lineHeight: 1.6, marginBottom: '2rem' }}>
                        Las iniciativas son los contenedores de tareas para alcanzar tus OKRs. Empieza registrando tu primera iniciativa clave.
                    </p>
                    <button
                        onClick={() => setShowCreator(true)}
                        style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '12px',
                            background: 'white',
                            color: '#000',
                            border: 'none',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Registrar Primera Iniciativa
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {initiatives.map((initiative) => (
                    <Link
                        href={`/strategy/initiative/${initiative.id}`}
                        key={initiative.id}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div className="glass-panel" style={{ padding: '1.5rem', transition: 'transform 0.2s', cursor: 'pointer', height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{initiative.title}</h3>
                                <span style={{
                                    fontSize: '0.7em', padding: '0.2rem 0.5rem', borderRadius: '4px',
                                    background: initiative.status === 'DONE' ? 'var(--success)' : initiative.status === 'IN_PROGRESS' ? 'var(--warning)' : 'hsl(var(--surface-active))',
                                    color: '#000'
                                }}>
                                    {initiative.status}
                                </span>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem' }}>
                                {initiative.horizon}
                            </p>

                            {/* Owner Assignment */}
                            {initiative.owner && (
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>👤 Responsable:</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                                        {initiative.owner.name} {initiative.owner.lastName || ''}
                                    </span>
                                    {initiative.owner.area && (
                                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>({initiative.owner.area})</span>
                                    )}
                                </div>
                            )}

                            {/* Team Assignment */}
                            {initiative.team && (
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Team:</span>
                                    <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
                                        {initiative.team.members.map((m: TeamMember, idx: number) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    background: m.user.discProfile?.color === 'RED' ? 'var(--danger)' :
                                                        m.user.discProfile?.color === 'YELLOW' ? 'var(--warning)' :
                                                            m.user.discProfile?.color === 'GREEN' ? 'var(--success)' :
                                                                m.user.discProfile?.color === 'BLUE' ? 'var(--accent)' : '#ccc',
                                                    marginLeft: idx > 0 ? '-8px' : 0,
                                                    border: '2px solid rgba(0,0,0,0.2)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.6rem', color: '#fff', fontWeight: 'bold'
                                                }}
                                                title={m.user.name}
                                            >
                                                {m.user.name.charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                    <span>Progress</span>
                                    <span>{Math.round(initiative.progress || 0)}%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'hsl(var(--surface-active))', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${initiative.progress || 0}%`, height: '100%',
                                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </main>
    );
}
