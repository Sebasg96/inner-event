'use client';

import React from 'react';
import { updateUser } from '@/app/actions';

type Props = {
    user: {
        id: string;
        name: string;
        email: string;
        jobRole?: string;
    };
    onClose: () => void;
};

export default function EditUserModal({ user, onClose }: Props) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-panel" style={{
                padding: '2rem',
                width: '400px',
                background: 'hsl(var(--bg-glass))',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsl(var(--border-glass))',
                borderRadius: '16px'
            }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>Editar Usuario</h2>
                <form action={async (formData) => {
                    await updateUser(formData);
                    onClose();
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="hidden" name="userId" value={user.id} />

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Nombre</label>
                        <input name="name" defaultValue={user.name} required style={{ width: '100%', background: 'hsl(var(--bg-app))', border: '1px solid hsl(var(--border-glass))', borderRadius: '8px', padding: '0.5rem', color: '#fff' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Email</label>
                        <input name="email" defaultValue={user.email} required style={{ width: '100%', background: 'hsl(var(--bg-app))', border: '1px solid hsl(var(--border-glass))', borderRadius: '8px', padding: '0.5rem', color: '#fff' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Rol de Equipo</label>
                        <select name="jobRole" defaultValue={user.jobRole || 'MEMBER'} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid hsl(var(--border-glass))', background: 'hsl(var(--bg-app))', color: '#fff' }}>
                            <option value="MEMBER">Miembro de Equipo</option>
                            <option value="TEAM_LEAD">Líder de Equipo</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>Cancelar</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
