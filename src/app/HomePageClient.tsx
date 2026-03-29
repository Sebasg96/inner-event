'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import styles from '@/app/strategy/page.module.css';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { Target, Users, BarChart3, FileText, Zap, Calendar, LayoutDashboard, ArrowRight } from 'lucide-react';

interface HomePageClientProps {
    purpose: any;
}

export default function HomePageClient({ purpose }: HomePageClientProps) {
    const { dict } = useLanguage();
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);


    const modules = [
        {
            title: dict.nav.strategy,
            href: '/strategy',
            icon: Target,
            description: 'Define el Propósito, Megas, OKRs o Metas y sus Iniciativas.',
            color: 'hsl(var(--module-strategy))'
        },
        {
            title: dict.nav.capacities,
            href: '/capacities',
            icon: Users,
            description: 'Gestiona la composición de equipos, Perfiles DISC y Roles.',
            color: 'hsl(var(--module-capacities))'
        },
        {
            title: dict.nav.analytics || 'Analítica',
            href: '/analytics',
            icon: BarChart3,
            description: 'Análisis descriptivo, diagnóstico, predictivo y prescriptivo.',
            color: 'hsl(var(--module-analytics))'
        },
        {
            title: dict.nav.reports || 'Reportes',
            href: '/reports',
            icon: FileText,
            description: 'Resúmenes ejecutivos, mapas estratégicos, informes y exportaciones.',
            color: 'hsl(var(--module-reports))'
        },
        {
            title: dict.nav.emergent || 'Est. Emergente',
            href: '/emergent',
            icon: Zap,
            description: 'Afronta decisiones difíciles (Hard Choices) y breakdown asistido por IA.',
            color: 'hsl(var(--module-emergent))'
        },
        {
            title: 'Rituales',
            href: '/rituals',
            icon: Calendar,
            description: 'Seguimiento de OKRs, puntos tratados y compromisos con IA.',
            color: 'hsl(var(--accent))'
        },
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            description: 'Monitorea el cumplimiento de tus metas (KRs) y avance de las Megas.',
            color: 'hsl(var(--secondary))'
        }
    ];

    if (isLoading || !user) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading...</div>;
    }

    return (
        <main className={styles.container} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '6rem', position: 'relative', overflowX: 'hidden' }}>
            {/* Background grid for Command Center feel */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
                zIndex: 0,
            }} />

            <div className={styles.homeUserInfo} style={{ zIndex: 10 }}>
                <div style={{ color: 'white', textAlign: 'right' }}>
                    <div style={{ fontWeight: 800 }}>{user.name}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 500 }}>{user.tenantName}</div>
                </div>
                <LanguageSwitcher />
                <button
                    onClick={() => logout()}
                    style={{
                        fontSize: '0.8rem',
                        color: 'hsl(var(--text-muted))',
                        textDecoration: 'none',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        padding: '0.4rem 0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    Logout
                </button>
            </div>

            {/* Header Section */}
            <div className="glass-panel" style={{
                padding: '2rem',
                marginBottom: '3rem',
                textAlign: 'center',
                width: '100%',
                maxWidth: '800px',
                margin: '1rem auto 3rem auto',
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                borderRadius: '24px'
            }}>
                <Link href="/" style={{ display: 'block', width: '100%' }}>
                    <img src="/pragma-logo.png" alt="PRAGMA - Donde la estrategia pasa" style={{ maxWidth: '400px', width: '100%', height: 'auto', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} />
                </Link>
            </div>

            {/* MODULE GRID */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
                maxWidth: '1200px',
                width: '100%',
                margin: '0 auto',
                paddingBottom: '4rem',
                position: 'relative',
                zIndex: 1
            }}>
                {modules.map((mod) => {
                    const IconComponent = mod.icon;
                    return (
                        <Link
                            key={mod.href}
                            href={mod.href}
                            className="glass-panel module-card"
                            style={{ '--mod-color': mod.color } as React.CSSProperties}
                        >
                            <div className="module-icon-wrapper">
                                <div className="module-icon-glow"></div>
                                <IconComponent size={40} className="module-icon" strokeWidth={1.5} />
                            </div>
                            <h2 style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                margin: 0,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                color: '#fff'
                            }}>
                                {mod.title}
                            </h2>
                            <p style={{
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '0.9rem',
                                lineHeight: 1.5,
                                fontWeight: 500
                            }}>
                                {mod.description}
                            </p>
                            <span className="module-btn">
                                <span>Ingresar al módulo</span>
                                <ArrowRight size={16} className="module-arrow" />
                            </span>
                        </Link>
                    )
                })}
            </div>

            <style>{`
                .module-card {
                    padding: 2.5rem 2rem;
                    text-decoration: none;
                    color: inherit;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 1.25rem;
                    border: 1px solid rgba(255,255,255,0.05); /* Subtle border by default */
                    background: rgba(255,255,255,0.02);
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                /* Neon border and elevation on hover */
                .module-card:hover {
                    transform: translateY(-5px);
                    border-color: var(--mod-color);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2), inset 0 0 20px rgba(255,255,255,0.02);
                }

                .module-icon-wrapper {
                    position: relative;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.05);
                    transition: all 0.3s ease;
                }

                /* Radial glow that appears on hover */
                .module-icon-glow {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: var(--mod-color);
                    filter: blur(20px);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 0;
                }

                .module-card:hover .module-icon-wrapper {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.1);
                    transform: scale(1.05);
                }

                .module-card:hover .module-icon-glow {
                    opacity: 0.3; /* The glow intensity */
                }

                .module-icon {
                    position: relative;
                    z-index: 1;
                    color: var(--mod-color);
                    transition: all 0.3s ease;
                }

                .module-card:hover .module-icon {
                    filter: brightness(1.2) drop-shadow(0 0 5px var(--mod-color));
                }

                .module-btn {
                    margin-top: auto;
                    padding: 0.6rem 1.25rem;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.8);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    letter-spacing: 0.5px;
                }

                /* Button glow and arrow animation on hover */
                .module-card:hover .module-btn {
                    background: var(--mod-color);
                    color: #fff;
                    border-color: var(--mod-color);
                    box-shadow: 0 0 15px var(--mod-color);
                }

                .module-arrow {
                    transition: transform 0.3s ease;
                }

                .module-card:hover .module-arrow {
                    transform: translateX(4px);
                }
            `}</style>
        </main>
    );
}
