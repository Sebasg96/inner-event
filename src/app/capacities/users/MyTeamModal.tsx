'use client';

import React from 'react';
import { addTeamMember, removeTeamMember } from '@/app/actions';

interface ProjectTeamMember {
    id: string;
    userId: string;
    user: {
        name: string;
        email?: string;
    };
}

interface ProjectTeam {
    id: string;
    name: string;
    leader?: {
        name: string;
        email?: string;
    };
    members: ProjectTeamMember[];
}

type Props = {
    user: {
        jobRole?: string;
    };
    team: ProjectTeam;
    onClose: () => void;
};

export default function MyTeamModal({ user, team, onClose }: Props) {
    const isLeader = user.jobRole === 'TEAM_LEAD';

    if (!team) return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-panel" style={{ padding: '2rem', background: 'hsl(var(--bg-glass))', backdropFilter: 'blur(20px)', border: '1px solid hsl(var(--border-glass))', borderRadius: '16px' }}>
                <p style={{ color: '#fff' }}>No tienes un equipo asignado aún.</p>
                <button onClick={onClose} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>Cerrar</button>
            </div>
        </div>
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-panel" style={{
                padding: '2rem',
                width: '500px',
                background: 'hsl(var(--bg-glass))',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsl(var(--border-glass))',
                borderRadius: '16px',
                maxHeight: '80vh',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: '#fff' }}>{team.name}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>×</button>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Líder</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', background: 'hsl(var(--bg-app))', borderRadius: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {team.leader?.name.charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', color: '#fff' }}>{team.leader?.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{team.leader?.email}</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Miembros del Equipo ({team.members.length})</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {team.members.map((m) => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                        {m.user.name.charAt(0)}
                                    </div>
                                    <span style={{ color: '#fff' }}>{m.user.name}</span>
                                </div>
                                {isLeader && (
                                    <form action={removeTeamMember}>
                                        <input type="hidden" name="memberId" value={m.userId} />
                                        <input type="hidden" name="teamId" value={team.id} />
                                        <button type="submit" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>

                    {isLeader && (
                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>Agregar Miembro</h4>
                            <form action={addTeamMember} style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="hidden" name="teamId" value={team.id} />
                                <input name="email" placeholder="Email del usuario..." required style={{ flex: 1, background: 'hsl(var(--bg-app))', border: '1px solid hsl(var(--border-glass))', borderRadius: '8px', padding: '0.5rem', color: '#fff' }} />
                                <button type="submit" className="btn-primary" style={{ padding: '0.5rem' }}>+</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
