'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import styles from '@/app/strategy/page.module.css';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import EditUserModal from './EditUserModal';
import MyTeamModal from './MyTeamModal';
import { Pencil } from 'lucide-react';

// Define Interfaces
interface Team {
    id: string;
    name: string;
    leaderId: string;
    members: {
        id: string;
        userId: string;
        user: User;
    }[];
}

interface User {
    id: string;
    name: string;
    email: string;
    discProfile?: {
        color: string;
    } | null;
    jobRole?: string;
    ledTeams?: Team[];
    teams?: { team: Team }[];
}

export default function UsersClient({ users, createUserAction }: { users: User[], createUserAction: (formData: FormData) => Promise<void> }) {
    const { dict } = useLanguage();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingTeam, setViewingTeam] = useState<{ user: User, team: Team } | null>(null);

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className={styles.header}>{dict.capacities.users.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/capacities" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.9rem', opacity: 0.8 }}>
                        ← Volver
                    </Link>
                    <NavBar />
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 className={styles.sectionTitle}>{dict.capacities.users.add}</h2>
                <form action={createUserAction} className={styles.formRow}>
                    <input name="name" placeholder={dict.capacities.users.name} required />
                    <input name="email" type="email" placeholder={dict.capacities.users.email} required />
                    <button type="submit" className="btn-primary">{dict.capacities.users.create}</button>
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {users.map((user) => (
                    <div key={user.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
                        {/* DISC Color Indicator Strip */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '4px', bottom: 0,
                            background: user.discProfile?.color === 'RED' ? 'var(--danger)' :
                                user.discProfile?.color === 'YELLOW' ? 'var(--warning)' :
                                    user.discProfile?.color === 'GREEN' ? 'var(--success)' :
                                        user.discProfile?.color === 'BLUE' ? 'var(--accent)' : 'transparent'
                        }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{user.name}</h3>
                                <p style={{ margin: 0, color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>{user.email}</p>
                            </div>
                            <button
                                onClick={() => setEditingUser(user)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'rgba(255,255,255,0.7)', transition: 'opacity 0.2s' }}
                                title="Editar Usuario"
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                            >
                                <Pencil size={16} />
                            </button>
                        </div>

                        {/* Role Badge */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {user.jobRole === 'TEAM_LEAD' && (
                                <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Líder</span>
                            )}
                            {user.jobRole === 'MEMBER' && (
                                <span style={{ fontSize: '0.7rem', background: 'var(--border-glass)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>Miembro</span>
                            )}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                    {user.discProfile ? `${dict.capacities.users.disc}: ${user.discProfile.color}` : 'Sin DISC'}
                                </span>
                                <Link
                                    href={`/capacities/assessment/${user.id}`}
                                    style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', textDecoration: 'none' }}
                                >
                                    {dict.capacities.assessment.title} →
                                </Link>
                            </div>

                            {/* My Team Action */}
                            {user.jobRole === 'TEAM_LEAD' && (
                                <button
                                    className="btn-primary"
                                    style={{ fontSize: '0.8rem', width: '100%', marginTop: '0.5rem' }}
                                    onClick={() => setViewingTeam({
                                        user,
                                        team: user.ledTeams && user.ledTeams.length > 0 ? user.ledTeams[0] : { id: 'pending', name: 'Sin Equipo', leaderId: user.id, members: [] }
                                    })}
                                >
                                    Gestionar Mi Equipo
                                </button>
                            )}
                            {user.jobRole === 'MEMBER' && user.teams && user.teams.length > 0 && (
                                <button
                                    onClick={() => setViewingTeam({
                                        user,
                                        team: user.teams![0].team
                                    })}
                                    style={{ fontSize: '0.8rem', width: '100%', marginTop: '0.5rem', background: 'transparent', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer', padding: '0.5rem', color: 'rgba(255,255,255,0.7)' }}
                                >
                                    Ver Mi Equipo
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                />
            )}

            {viewingTeam && (
                <MyTeamModal
                    user={viewingTeam.user}
                    team={viewingTeam.team}
                    onClose={() => setViewingTeam(null)}
                />
            )}
        </div>
    );
}
