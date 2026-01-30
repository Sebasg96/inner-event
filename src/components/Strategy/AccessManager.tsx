'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getTenantUsers, grantStrategicAccess, revokeStrategicAccess, getStrategicAccess } from '@/app/actions';

interface User {
    id: string;
    name: string;
    lastName: string | null;
    email: string;
    area: string | null;
}

interface StrategicAccess {
    id: string;
    user: User;
}

interface Props {
    entityType: 'purpose' | 'objective' | 'initiative';
    entityId: string;
    entityTitle: string;
    trigger?: React.ReactNode;
}

export default function AccessManager({ entityType, entityId, entityTitle, trigger }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [accesses, setAccesses] = useState<StrategicAccess[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    async function loadData() {
        setIsLoading(true);
        try {
            const [tenantUsers, currentAccesses] = await Promise.all([
                getTenantUsers(),
                getStrategicAccess(entityType, entityId)
            ]);
            setUsers(tenantUsers);
            setAccesses(currentAccesses as any);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleGrantAccess(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedUserId) return;

        const formData = new FormData();
        formData.append('userId', selectedUserId);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);

        try {
            await grantStrategicAccess(formData);
            setSelectedUserId('');
            await loadData();
        } catch (error) {
            console.error('Error granting access:', error);
        }
    }

    async function handleRevokeAccess(accessId: string) {
        try {
            await revokeStrategicAccess(accessId);
            await loadData();
        } catch (error) {
            console.error('Error revoking access:', error);
        }
    }

    const usersWithAccess = accesses.map(a => a.user.id);
    const availableUsers = users.filter(u => !usersWithAccess.includes(u.id));

    if (!isOpen) {
        if (trigger) {
            return <div onClick={() => setIsOpen(true)} style={{ cursor: 'pointer' }}>{trigger}</div>;
        }

        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                }}
            >
                🔐 Gestionar Acceso
            </button>
        );
    }

    // Use Portal to escape parent stacking contexts
    const modalContent = (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)', // Darker background for better focus
            backdropFilter: 'blur(5px)', // Add blur
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999, // Super high z-index
            padding: '2rem',
            animation: 'fadeIn 0.2s ease-out'
        }}
            onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget) setIsOpen(false);
            }}
        >
            <div className="glass-panel" style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '85vh',
                overflow: 'auto',
                padding: '2.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                background: '#1e293b' // Solid dark background fallback
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>
                            Gestionar Acceso
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8' }}>
                            {entityTitle}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            color: 'white',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                        ✕
                    </button>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        <div style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>⌛</div>
                        Cargando información...
                    </div>
                ) : (
                    <>
                        {/* Grant Access Form - Highlighted Section */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>👤</span>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>
                                    Agregar Nuevo Usuario
                                </h3>
                            </div>

                            <form onSubmit={handleGrantAccess}>
                                <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.9rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '1rem',
                                            background: '#f8fafc',
                                            color: '#1e293b',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">👇 Seleccionar usuario de la lista...</option>
                                        {availableUsers.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} {user.lastName || ''} — {user.area || 'Sin Área'}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="submit"
                                        disabled={!selectedUserId}
                                        style={{
                                            width: '100%',
                                            padding: '0.9rem',
                                            background: selectedUserId ? 'linear-gradient(135deg, #0FB4A8 0%, #0D9488 100%)' : '#cbd5e1',
                                            color: selectedUserId ? 'white' : '#94a3b8',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            cursor: selectedUserId ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.2s',
                                            boxShadow: selectedUserId ? '0 4px 12px rgba(15, 180, 168, 0.25)' : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        {selectedUserId ? '✨ Dar Permiso de Visualización' : 'Selecciona un usuario'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Current Accesses List */}
                        <div>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Usuarios con Acceso ({accesses.length})
                            </h3>
                            {accesses.length === 0 ? (
                                <p style={{ color: '#64748b', fontSize: '0.95rem', textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                                    No hay usuarios con acceso compartido a este elemento.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {accesses.map(access => (
                                        <div
                                            key={access.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255, 255, 255, 0.08)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                                }}>
                                                    {access.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'white' }}>
                                                        {access.user.name} {access.user.lastName || ''}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                                                        {access.user.area || 'Sin Área'} • {access.user.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeAccess(access.id)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                                }}
                                            >
                                                Revocar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    // Render Portal
    if (typeof document !== 'undefined') {
        return ReactDOM.createPortal(modalContent, document.body);
    }
    return null;
}
