'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { getUserNotifications } from '@/app/actions';

interface Notification {
    id: string;
    title: string;
    objectiveTitle: string;
    daysOverdue: number;
    type?: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getUserNotifications();
                setNotifications(data);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Listen for updates
        const handleUpdate = () => fetchNotifications();
        window.addEventListener('kr-updated', handleUpdate);
        return () => window.removeEventListener('kr-updated', handleUpdate);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) return null; // Or a skeleton

    return (
        <div className="relative" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                title={notifications.length > 0 ? `${notifications.length} actualizaciones pendientes` : "Notificaciones"}
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        minWidth: '14px',
                        height: '14px',
                        borderRadius: '7px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white'
                    }}>
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    width: '320px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    zIndex: 50,
                    overflow: 'hidden',
                    marginTop: '0.5rem'
                }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Actualizaciones Pendientes</h4>
                        {notifications.length > 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                {notifications.length}
                            </span>
                        )}
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                ¡Estas al día! No tienes KRs pendientes.
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => {
                                        setIsOpen(false);
                                        if (notif.type === 'WEIGHT_REVIEW') {
                                            router.push('/strategy/planning?tab=WEIGHTS');
                                        } else {
                                            router.push(`/strategy/planning?openKrId=${notif.id}`);
                                        }
                                    }}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.2rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', lineHeight: 1.3 }}>
                                        {notif.title}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                        {notif.objectiveTitle}
                                    </div>

                                    {notif.type === 'WEIGHT_REVIEW' ? (
                                        <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>⚖️</span> Revisar Ponderación (0%)
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 500, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>⏰</span> Vencido hace {notif.daysOverdue} días
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
