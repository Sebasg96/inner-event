'use client';

// Create a Client Wrapper for the internal part or just make it Client?
// The data fetching needs to be Server.
// So Home (page.tsx) is Server, fetches, passes to HomeClient.
// Let's create `src/components/HomeClient.tsx` similar to StrategyDashboard.
// BUT, refactoring `page.tsx` is easier if I just inline the client component or split it.
// I'll create `src/components/Kanban/KanbanPageClient.tsx`.

import KanbanBoard from '@/components/Kanban/KanbanBoard';
import NavBar from '@/components/NavBar';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';
import InitiativeCreator from '@/components/Strategy/InitiativeCreator';
import React, { useState } from 'react';
import { updateInitiativeOwner } from '@/app/actions';


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
        id?: string; // Add ID
        name: string;
        lastName: string | null;
        area: string | null;
    } | null;
    team?: Team | null;
}

type Props = {
    initiatives: Initiative[];
    krs: KR[];
    tenantUsers: any[]; // Ideally typed
};

export default function KanbanPageClient({ initiatives, krs, tenantUsers }: Props) {
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
                    <div
                        key={initiative.id}
                        className="glass-panel"
                        style={{ padding: '1.5rem', transition: 'transform 0.2s', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <Link href={`/strategy/initiative/${initiative.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }} className="hover:text-primary">
                                    {initiative.title}
                                </h3>
                            </Link>
                            <span style={{
                                fontSize: '0.75em',
                                padding: '0.3rem 0.8rem',
                                borderRadius: '20px',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                background: initiative.status === 'DONE' ? 'hsl(var(--success))' :
                                    initiative.status === 'IN_PROGRESS' ? 'hsl(var(--primary))' :
                                        '#64748b', // Slate 500 for TODO
                                color: '#fff', // White text for all
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Consistent shadow
                                whiteSpace: 'nowrap',
                                marginLeft: '0.5rem',
                                border: 'none'
                            }}>
                                {initiative.status === 'IN_PROGRESS' ? 'En Progreso' :
                                    initiative.status === 'DONE' ? 'Completado' : 'Por Hacer'}
                            </span>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem' }}>
                            {initiative.horizon}
                        </p>

                        {/* Owner Assignment */}
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Assignee:</span>
                            <select
                                value={initiative.owner?.id || ''}
                                onChange={async (e) => {
                                    await updateInitiativeOwner(initiative.id, e.target.value || null);
                                }}
                                style={{
                                    fontSize: '0.8rem',
                                    padding: '0.2rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '4px',
                                    background: 'white',
                                    color: '#334155',
                                    maxWidth: '150px',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="">Unassigned</option>
                                {tenantUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} {u.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

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
                ))}
            </div>
        </main>
    );
}
