'use client';

import React, { useState } from 'react';
import { signUpUser } from '@/app/actions';
import styles from '@/app/strategy/page.module.css';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignupPage() {
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const result = await signUpUser(formData);

            if (result.error) {
                setError(result.error);
            } else if (result.success) {
                setMessage(result.message || 'Registration successful! Check your email.');
            }
        } catch (e) {
            setError('An unexpected error occurred.');
        } finally {
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
            overflow: 'hidden',
            padding: '2rem'
        }}>
            {/* Tech Background */}
            <div className="tech-grid" />

            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 12, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '20%',
                    width: '700px',
                    height: '700px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(174, 100, 35, 0.35) 0%, transparent 70%)',
                    filter: 'blur(100px) brightness(1.3)',
                    zIndex: 1
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="glass-panel"
                style={{
                    width: '95%',
                    maxWidth: '420px',
                    padding: '2.5rem',
                    zIndex: 10,
                    border: '1px solid rgba(255,255,255,0.08)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                        <img src="/pragma-logo.png" alt="Pragma" style={{ height: '50px', width: 'auto' }} />
                    </div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                        background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.7))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Misión: Registro
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Únete a la estrategia del futuro</p>
                </div>

                <AnimatePresence mode="wait">
                    {message ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ color: '#4ade80', marginBottom: '2rem', fontSize: '1.1rem', background: 'rgba(74,222,128,0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(74,222,128,0.2)' }}>
                                {message}
                            </div>
                            <Link href="/login" className="btn-primary" style={{ width: '100%', display: 'inline-block', background: 'white', color: 'black', textDecoration: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 600 }}>
                                Ir al Login
                            </Link>
                        </motion.div>
                    ) : (
                        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Nombre Completo</label>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        placeholder="Juan Pérez"
                                        className={styles.input}
                                        data-testid="auth-signup-name-input"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '10px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Email Corporativo</label>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="usuario@empresa.com"
                                        className={styles.input}
                                        data-testid="auth-signup-email-input"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '10px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Empresa / Organización</label>
                                    <input
                                        name="companyName"
                                        type="text"
                                        placeholder="Nombre de tu Organización"
                                        className={styles.input}
                                        data-testid="auth-signup-company-input"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '10px' }}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>
                                        Detección de dominio inteligente activada.
                                    </p>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Password</label>
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className={styles.input}
                                        data-testid="auth-signup-password-input"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '10px' }}
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ff4d4d', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem', background: 'rgba(255,77,77,0.1)', borderRadius: '8px' }}>
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                data-testid="auth-signup-submit-button"
                                style={{ width: '100%', padding: '1rem', background: 'white', color: 'black', borderRadius: '12px', fontWeight: 600, marginTop: '1rem' }}
                            >
                                {loading ? 'Iniciando secuencia...' : 'Comenzar Aventura'}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>¿Ya tienes cuenta? </span>
                                <Link href="/login" style={{ color: 'white', fontWeight: '600', textDecoration: 'none' }}>Inicia Sesión</Link>
                            </div>
                        </form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
