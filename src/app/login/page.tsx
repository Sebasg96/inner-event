'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { verifyLogin } from '@/app/actions';
import { useRouter } from 'next/navigation';
import styles from '@/app/strategy/page.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

export default function LoginPage() {
    const { isLoading } = useAuth();
    const [error, setError] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isProcessingInvite, setIsProcessingInvite] = useState(false);
    const router = useRouter();
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        // Capturar el hash inmediatamente al montar el componente
        // Esto es crítico porque el cliente de Supabase puede limpiar el hash URL rápidamente
        const initialHash = window.location.hash;
        console.log('Login Mount with Hash:', initialHash);

        // Verificar si ya tenemos sesión (race condition)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                console.log('Session found on mount', session.user.email);
                // Si hay sesión y el hash inicial indicaba invitación, redirigir
                if (initialHash.includes('type=invite') || initialHash.includes('type=recovery')) {
                    console.log('Redirecting to update password (from initial hash)');
                    setIsProcessingInvite(true);
                    // Usar window.location.href para asegurar refresco de cookies
                    window.location.href = '/auth/update-password';
                }
            } else if (initialHash.includes('type=invite') || initialHash.includes('type=recovery')) {
                // Si no hay sesión pero hay hash de invitación, mostrar loading mientras supabase procesa
                setIsProcessingInvite(true);

                // Timeout de seguridad: si en 8 segundos no hay sesión, asumir fallo
                setTimeout(() => {
                    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
                        if (!currentSession) {
                            setIsProcessingInvite(false);
                            setInviteError('No se pudo verificar la invitación automáticamente. El enlace puede haber expirado o ya fue utilizado.');
                        }
                    });
                }, 8000);
            }
        });

        // Escuchar eventos futuros
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth Event:', event);

            if (event === 'SIGNED_IN' && session) {
                // Verificar hash capturado inicialmente o el actual si aún existe
                const currentHash = window.location.hash;
                const isInvite = initialHash.includes('type=invite') || currentHash.includes('type=invite');
                const isRecovery = initialHash.includes('type=recovery') || currentHash.includes('type=recovery');

                if (isInvite || isRecovery) {
                    console.log('Redirecting to update password (from event)');
                    setIsProcessingInvite(true);
                    // Pequeña espera para asegurar que la cookie se establezca si es necesario
                    setTimeout(() => {
                        window.location.href = '/auth/update-password';
                    }, 500);
                } else {
                    // Flujo normal: solo redirigir si NO estamos ya en el home
                    // Esto evita conflictos si el AuthContext hace refresh
                    console.log('Standard login, redirecting to home');
                    router.push('/');
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [router, supabase]);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError('');

        try {
            const result = await verifyLogin(formData);

            if (result.error) {
                setError(result.error);
                setLoading(false);
                return;
            }

            if (result.success && result.user) {
                localStorage.setItem('inner_event_user', JSON.stringify(result.user));

                // Redirigir usando window.location para asegurar un refresco total
                // y que el middleware vea las nuevas cookies inmediatamente
                window.location.href = '/';
            }
        } catch (e) {
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#04070d',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Technological Background Layers */}
            <div className="tech-grid" />

            {/* Animated Glow Orbs (Antigravity Feel) */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 8, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    top: '10%',
                    right: '15%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(174, 100, 35, 0.4) 0%, transparent 70%)',
                    filter: 'blur(80px) brightness(1.5)',
                    zIndex: 1
                }}
            />
            <motion.div
                animate={{ scale: [1.3, 1, 1.3], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 10, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    bottom: '5%',
                    left: '10%',
                    width: '700px',
                    height: '700px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0, 102, 255, 0.25) 0%, transparent 70%)',
                    filter: 'blur(100px) brightness(1.2)',
                    zIndex: 1
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="glass-panel"
                style={{
                    width: '90%',
                    maxWidth: '380px',
                    padding: '2.5rem',
                    zIndex: 10,
                    boxShadow: '0 0 60px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(10, 15, 25, 0.7)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}
                    >
                        <img src="/pragma-logo.png" alt="Pragma" style={{ height: '120px', width: 'auto', filter: 'drop-shadow(0 0 20px rgba(174,100,35,0.4))' }} />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            fontSize: '2.25rem',
                            fontWeight: 700,
                            marginBottom: '0.5rem',
                            letterSpacing: '-0.02em',
                            background: 'linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.7) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Inner Event
                    </motion.h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>Estrategia potenciada por IA</p>
                </div>

                <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="nombre@empresa.com"
                            className={styles.input}
                            data-testid="auth-login-email-input"
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: '#fff',
                                padding: '1rem',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className={styles.input}
                            data-testid="auth-login-password-input"
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: '#fff',
                                padding: '1rem',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <a href="/auth/forgot-password" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(255,77,77,0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,77,77,0.2)' }}
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        data-testid="auth-login-submit-button"
                        style={{
                            width: '100%',
                            padding: '1.1rem',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            background: 'white',
                            color: '#000',
                            borderRadius: '12px',
                            fontWeight: 600,
                            boxShadow: '0 4px 20px rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem'
                        }}
                    >
                        {loading ? 'Conectando...' : 'Iniciar Sesión'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                            ¿No tienes cuenta? Contacta a tu administrador.
                        </p>
                    </div>
                </form>



                <AnimatePresence>
                    {isProcessingInvite && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(4, 7, 13, 0.9)',
                                zIndex: 20,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid rgba(255,255,255,0.3)',
                                borderTop: '3px solid #fff',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                marginBottom: '1rem'
                            }} />
                            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Estamos preparando tu cuenta...</p>
                            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.5rem' }}>Verificando invitación segura</p>
                            <style jsx>{`
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}</style>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {inviteError && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(4, 7, 13, 0.95)',
                                zIndex: 30,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                padding: '2rem',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Enlace no verificado</h3>
                            <p style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '2rem', maxWidth: '400px' }}>
                                {inviteError}
                            </p>
                            <button
                                onClick={() => {
                                    setInviteError('');
                                    window.location.hash = ''; // Limpiar hash para evitar re-trigger
                                    window.location.reload();
                                }}
                                className="btn-primary"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'white',
                                    color: '#0f172a',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Volver al Inicio
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
