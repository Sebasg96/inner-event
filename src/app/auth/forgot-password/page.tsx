'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from '@/app/strategy/page.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [supabase] = useState(() => createClient());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const origin = window.location.origin;
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${origin}/auth/callback?next=/auth/update-password&type=recovery`,
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('Si existe una cuenta con este correo, recibirás un enlace de recuperación en breve.');
            }
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error inesperado al intentar enviar el correo.');
        } finally {
            setLoading(false);
        }
    };

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
                    maxWidth: '400px',
                    padding: '2.5rem',
                    zIndex: 10,
                    boxShadow: '0 0 60px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(10, 15, 25, 0.7)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}
                    >
                        <img src="/pragma-logo.png" alt="Pragma" style={{ height: '80px', width: 'auto', filter: 'drop-shadow(0 0 20px rgba(174,100,35,0.4))' }} />
                    </motion.div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.7) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Recuperar Contraseña
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
                        Ingresa tu email para recibir un enlace de recuperación.
                    </p>
                </div>

                {!message ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={styles.input}
                                autoFocus
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
                                placeholder="nombre@empresa.com"
                            />
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
                                marginTop: '0.5rem',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Enviando...' : 'Enviar enlace'}
                        </button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', color: '#fff' }}
                    >
                        <div style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                            color: '#4ade80',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            marginBottom: '2rem'
                        }}>
                            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{message}</p>
                        </div>
                    </motion.div>
                )}

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link href="/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                        ← Volver al inicio de sesión
                    </Link>
                </div>
            </motion.div>
        </div >
    );
}
