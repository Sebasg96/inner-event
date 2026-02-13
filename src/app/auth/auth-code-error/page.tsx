'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export default function AuthCodeError() {
    const router = useRouter();
    const [supabase] = useState(() => createClient());
    const [isRecovering, setIsRecovering] = useState(false);

    useEffect(() => {
        // Recovery Logic: Check for implicit flow hash (access_token)
        // Sometimes Supabase redirects with hash instead of code, causing the server route to fail
        // and redirect here. We can catch the hash and recover the session.
        const hash = window.location.hash;

        if (hash && (hash.includes('access_token') || hash.includes('type=invite') || hash.includes('type=recovery'))) {
            setIsRecovering(true);
            console.log('Detected detailed auth hash on error page, attempting manual parser...');

            // Función Helper para parsear el hash manualmente
            const parseHash = (hashStr: string) => {
                const params = new URLSearchParams(hashStr.replace('#', ''));
                return {
                    access_token: params.get('access_token'),
                    refresh_token: params.get('refresh_token'),
                    type: params.get('type')
                };
            };

            const parsed = parseHash(hash);
            const { access_token, refresh_token, type } = parsed;

            if (access_token && refresh_token) {
                supabase.auth.setSession({
                    access_token,
                    refresh_token
                }).then(({ data, error }) => {
                    if (error) {
                        console.error('Error setting session manually:', error);
                        setIsRecovering(false);
                    } else if (data.session) {
                        console.log('Session set manually via setSession');
                        if (type === 'invite' || type === 'recovery' || hash.includes('type=invite')) {
                            router.push('/auth/update-password');
                        } else {
                            router.push('/');
                        }
                    }
                });
            } else {
                // Fallback: Dejar que supabase intente detectar automáticamente
                console.log('Could not parse tokens manually, falling back to auto-detection');
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) {
                        console.log('Session recovered successfully (auto)!');
                        if (hash.includes('type=invite') || hash.includes('type=recovery')) {
                            router.push('/auth/update-password');
                        } else {
                            router.push('/');
                        }
                    } else {
                        // Give it a moment
                        setTimeout(() => {
                            // Re-check one last time
                            supabase.auth.getSession().then(({ data: { session: lastCheck } }) => {
                                if (!lastCheck) setIsRecovering(false);
                                else {
                                    if (hash.includes('type=invite')) router.push('/auth/update-password');
                                    else router.push('/');
                                }
                            });
                        }, 4000);
                    }
                });
            }
        }
    }, [router, supabase]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            color: 'white',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    maxWidth: '400px',
                    padding: '2rem',
                    background: '#1e293b',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                }}
            >
                {isRecovering ? (
                    <>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(255,255,255,0.3)',
                            borderTop: '3px solid #fff',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1.5rem'
                        }} />
                        <h2 style={{ marginBottom: '0.5rem' }}>Recuperando sesión...</h2>
                        <p style={{ color: '#94a3b8' }}>Detectamos credenciales válidas, te estamos redirigiendo.</p>
                        <style jsx>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ marginBottom: '0.5rem' }}>Enlace Inválido o Expirado</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                            Lo sentimos, no pudimos verificar tu invitación automáticamente. Es probable que el enlace haya expirado o ya haya sido utilizado.
                        </p>
                        <a
                            href="/login"
                            style={{
                                display: 'inline-block',
                                background: 'white',
                                color: '#0f172a',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontWeight: 600
                            }}
                        >
                            Ir al Login
                        </a>
                    </>
                )}
            </motion.div>
        </div>
    );
}
