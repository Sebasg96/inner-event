'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import styles from '@/app/strategy/page.module.css';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import StrategyCascade from '@/components/Strategy/StrategyCascade';

interface HomePageClientProps {
    purpose: any; // Using 'any' for now but explicit to satisfy no-implicit-any, or better, define it if I can import Purpose from Prisma or define locally.
    // The previous error was "implicit any". Explicit any fixes that, but better to use "Purpose" if I can.
    // I will redefine Purpose loosely to match.
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
            icon: '🎯',
            description: 'Define Purpose, Megas, OKRs, and Initiatives.',
            color: 'hsl(var(--module-strategy))'
        },
        {
            title: dict.nav.capacities,
            href: '/capacities',
            icon: '👥',
            description: 'Manage Team Composition, DISC Profiles, and Roles.',
            color: 'hsl(var(--module-capacities))'
        },
        {
            title: dict.nav.analytics || 'Analytics',
            href: '/analytics',
            icon: '📊',
            description: 'Descriptive, Diagnostic, Predictive, and Prescriptive Analysis.',
            color: 'hsl(var(--module-analytics))'
        },
        {
            title: dict.nav.reports || 'Reports',
            href: '/reports',
            icon: '📑',
            description: 'Executive Summaries, Strategy Maps, and Exports.',
            color: 'hsl(var(--module-reports))'
        },
        {
            title: dict.nav.emergent || 'Emergent',
            href: '/emergent',
            icon: '⚡',
            description: 'AI-driven "Hard Choices" and Break Point analysis.',
            color: 'hsl(var(--module-emergent))'
        },
        {
            title: 'Rituales',
            href: '/rituals',
            icon: '📅',
            description: 'Seguimiento de OKRs, puntos tratados y compromisos con IA.',
            color: 'hsl(var(--accent))'
        }
    ];

    if (isLoading || !user) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading...</div>;
    }

    return (
        <main className={styles.container} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '6rem', position: 'relative' }}>
            <div className={styles.homeUserInfo} style={{ zIndex: 10 }}>
                <div style={{ color: 'white', textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{user.tenantName}</div>
                </div>
                <LanguageSwitcher />
                <button
                    onClick={() => logout()}
                    style={{
                        fontSize: '0.8rem',
                        color: 'hsl(var(--text-muted))',
                        textDecoration: 'underline',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'inherit'
                    }}
                >
                    Logout
                </button>
            </div>

            {/* Header Section - Wrapped in White Panel for Visibility & "Tranquility" */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center', width: '100%', maxWidth: '800px', margin: '1rem auto 2rem auto', display: 'flex', justifyContent: 'center' }}>
                <Link href="/" style={{ display: 'block', width: '100%' }}>
                    <img src="/pragma-logo.png" alt="PRAGMA - Donde la estrategia pasa" style={{ maxWidth: '400px', width: '100%', height: 'auto' }} />
                </Link>
            </div>

            {/* <StrategyCascade removed from Home Page as per request /> */}

            {/* MODULE GRID */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
                maxWidth: '1200px',
                width: '100%',
                margin: '0 auto',
                paddingBottom: '4rem'
            }}>
                {modules.map((mod) => (
                    <Link
                        key={mod.href}
                        href={mod.href}
                        className="glass-panel"
                        style={{
                            padding: '2rem',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'transform 0.2s, background 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '1rem',
                            borderTop: `4px solid ${mod.color}`
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{mod.icon}</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>{mod.title}</h2>
                        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            {mod.description}
                        </p>
                        <span style={{
                            marginTop: 'auto',
                            padding: '0.5rem 1rem',
                            background: 'hsl(var(--surface-active))',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 500
                        }}>
                            Enter Module →
                        </span>
                    </Link>
                ))}
            </div>
        </main>
    );
}
