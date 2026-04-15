'use client';

import React, { useState, useEffect } from 'react';
import { createInitiative, getTenantUsers } from '@/app/actions';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';

interface User {
    id: string;
    name: string;
    lastName: string | null;
    email: string;
    area: string | null;
    jobTitle: string | null;
}

interface Props {
    keyResultId?: string;
    krs?: { id: string; statement: string }[];
    onSuccess?: () => void;
}

export default function InitiativeCreator({ keyResultId, krs, onSuccess }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const theme = useModuleTheme();

    useEffect(() => {
        async function fetchUsers() {
            const tenantUsers = await getTenantUsers();
            setUsers(tenantUsers);
        }
        fetchUsers();
    }, []);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                data-testid="initiative-creator-toggle"
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'white',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.color;
                    e.currentTarget.style.color = theme.color;
                    e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = 'white';
                }}
            >
                <span>➕</span> Registrar Nueva Iniciativa
            </button>
        );
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        try {
            await createInitiative(formData);
            setIsOpen(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to create initiative', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            background: '#f8fafc',
            borderRadius: '16px',
            border: `1px solid ${theme.color}22`,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Nueva Iniciativa Clave
                </h4>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem' }}
                >
                    &times;
                </button>
            </div>

            <form onSubmit={handleSubmit} data-testid="initiative-creator-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {keyResultId ? (
                    <input type="hidden" name="keyResultId" value={keyResultId} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Resultado Clave (Vincular a)</label>
                        <select
                            name="keyResultId"
                            required
                            data-testid="initiative-creator-kr-select"
                            style={{
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.9rem',
                                background: 'white',
                                outline: 'none',
                                color: 'black'
                            }}
                        >
                            <option value="">Seleccionar KR...</option>
                            {krs?.map(kr => (
                                <option key={kr.id} value={kr.id}>{kr.statement}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Título de la Iniciativa</label>
                    <input
                        name="title"
                        placeholder="Ej: Lanzar campaña de referidos..."
                        required
                        data-testid="initiative-creator-title"
                        style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            color: 'black'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Horizonte (Categorización)</label>
                    <select
                        name="horizon"
                        required
                        data-testid="initiative-creator-horizon"
                        style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.9rem',
                            background: 'white',
                            outline: 'none',
                            color: 'black'
                        }}
                    >
                        <option value="H1">H1 - Core (Impacto hoy)</option>
                        <option value="H2">H2 - Emergente (Impacto cercano)</option>
                        <option value="H3">H3 - Futuro (Transformación)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Responsable (Opcional)</label>
                    <select
                        name="ownerId"
                        data-testid="initiative-creator-owner"
                        style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.9rem',
                            background: 'white',
                            outline: 'none',
                            color: 'black'
                        }}
                    >
                        <option value="">Sin asignar</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} {user.lastName || ''} {user.area ? `(${user.area})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        data-testid="initiative-creator-cancel"
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#64748b',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        data-testid="initiative-creator-submit"
                        style={{
                            flex: 2,
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: theme.color,
                            color: 'white',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: `0 4px 12px ${theme.color}33`
                        }}
                    >
                        {isSaving ? 'Guardando...' : 'Registrar Iniciativa'}
                    </button>
                </div>
            </form>
        </div>
    );
}
