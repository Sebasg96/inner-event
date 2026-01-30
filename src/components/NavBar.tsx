'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './NavBar.module.css';

export default function NavBar() {
    const { dict } = useLanguage();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = (path: string) => {
        if (path === '/strategy') return pathname.startsWith('/strategy');
        return pathname.startsWith(path);
    };

    const linkStyle = (path: string, colorVar: string) => {
        const active = isActive(path);
        return {
            color: active ? `hsl(var(${colorVar}))` : 'inherit',
            background: active ? `hsl(var(${colorVar}) / 0.1)` : 'transparent',
            border: active ? `1px solid hsl(var(${colorVar}) / 0.2)` : '1px solid transparent',
        };
    };

    const navItems = [
        { href: '/strategy', label: dict.nav.strategy, color: '--module-strategy' },
        { href: '/capacities', label: dict.nav.capacities, color: '--module-capacities' },
        { href: '/analytics', label: dict.nav.analytics || 'Analytics', color: '--module-analytics' },
        { href: '/reports', label: dict.nav.reports || 'Reports', color: '--module-reports' },
        { href: '/emergent', label: dict.nav.emergent || 'Emergent', color: '--module-emergent' },
        { href: '/rituals', label: 'Rituales', color: '--accent' }
    ];

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className={styles.navContainer}>
            {/* Logo - Always visible */}
            <Link href="/" title="Inicio">
                <img src="/pragma-logo.png" alt="Logo" style={{ height: '32px', width: 'auto' }} />
            </Link>

            {/* Default Controls: Lang Switch + Hamburger */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className={styles.desktopLangSwitch}>
                    <LanguageSwitcher />
                </div>

                <button
                    className={`${styles.mobileMenuBtn} ${styles.alwaysVisible}`}
                    onClick={toggleMenu}
                    aria-label="Toggle Menu"
                >
                    <div className={styles.hamburgerIcon} />
                </button>
            </div>

            {/* Sidebar Menu Overlay */}
            <div className={`${styles.mobileOverlay} ${isOpen ? styles.open : ''}`}>
                <button
                    className={styles.closeBtn}
                    onClick={toggleMenu}
                    aria-label="Close Menu"
                >
                    &times;
                </button>

                <div style={{ marginTop: '3rem', width: '100%' }}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={styles.mobileLink}
                            onClick={toggleMenu}
                            style={{ color: isActive(item.href) ? `hsl(var(${item.color}))` : 'hsl(var(--text-body))' }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #cbd5e1', paddingTop: '1.5rem' }}>
                    <Link
                        href="/about"
                        className={styles.mobileLink}
                        onClick={toggleMenu}
                        style={{ color: 'hsl(var(--text-muted))', fontSize: '0.95rem' }}
                    >
                        About
                    </Link>
                    <button
                        onClick={async () => {
                            const { createClient } = await import('@/lib/supabase/client');
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        }}
                        className={styles.mobileLink}
                        style={{
                            color: '#ef4444',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
