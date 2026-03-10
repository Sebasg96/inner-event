'use client';

import React, { useState } from 'react';
import { updateUserRole, inviteUser } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/app/strategy/page.module.css'; // Reusing existing styles for consistency

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    jobTitle: string | null;
    area: string | null;
}

export default function AdminUsersClient({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            await updateUserRole(userId, newRole as 'ADMIN' | 'DIRECTOR' | 'COLLABORATOR');
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            router.refresh();
        } catch (error) {
            alert('Failed to update role');
            console.error(error);
        }
    };

    async function handleInviteSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            const result = await inviteUser(formData);
            if (result?.error) {
                alert(result.error);
            } else {
                alert('User invited successfully!');
                setIsInviteModalOpen(false);
                router.refresh(); // This should re-fetch the users via the server component
            }
        } catch (e) {
            alert('An unexpected error occurred.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link href="/" style={{ color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                    &larr; Volver al Inicio
                </Link>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>Admin: Gestión de Usuarios</h1>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="btn-primary"
                    style={{ background: '#0f172a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                    + Invitar Usuario
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Nombre</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Email</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Cargo / Área</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Rol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 600 }}>{user.name}</td>
                                <td style={{ padding: '1rem', color: '#475569' }}>{user.email}</td>
                                <td style={{ padding: '1rem', color: '#475569' }}>
                                    {user.jobTitle || '-'} <br />
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.area || '-'}</span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            background: user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? '#eff6ff' : user.role === 'DIRECTOR' ? '#fdf4ff' : 'white',
                                            color: user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? '#1d4ed8' : user.role === 'DIRECTOR' ? '#a855f7' : '#334155',
                                            fontWeight: 500
                                        }}
                                        disabled={user.role === 'SUPERADMIN'}
                                    >
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="DIRECTOR">DIRECTOR</option>
                                        <option value="COLLABORATOR">COLLABORATOR</option>
                                        <option value="SUPERADMIN" disabled>SUPERADMIN</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#0f172a' }}>Invitar Nuevo Usuario</h2>
                        <form action={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>Email</label>
                                <input name="email" type="email" required style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', color: '#0f172a' }} placeholder="usuario@empresa.com" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>Nombre Completo</label>
                                <input name="name" type="text" required style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', color: '#0f172a' }} placeholder="Juan Pérez" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>Cargo (Job Title)</label>
                                    <input name="jobTitle" type="text" style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', color: '#0f172a' }} placeholder="Desarrollador" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>Área</label>
                                    <input name="area" type="text" style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', color: '#0f172a' }} placeholder="Tecnología" />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>Rol Inicial</label>
                                <select name="role" style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', color: '#0f172a' }}>
                                    <option value="COLLABORATOR">Collaborator (Empleado)</option>
                                    <option value="DIRECTOR">Director</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsInviteModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>Cancelar</button>
                                <button type="submit" disabled={isLoading} className="btn-primary" style={{ background: '#0f172a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 600 }}>
                                    {isLoading ? 'Enviando...' : 'Enviar Invitación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
