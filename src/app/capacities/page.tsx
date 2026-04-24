'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import styles from '@/app/strategy/page.module.css';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';
import { Users, Puzzle, ArrowRight } from 'lucide-react';

export default function CapacitiesDashboard() {
    const { dict } = useLanguage();
    const theme = useModuleTheme();

    const sections = [
        {
            title: dict.capacities.users.title,
            href: '/capacities/users',
            icon: Users,
            description: 'Gestiona tu pool de talento, agrega colaboradores y consulta perfiles individuales.',
            color: theme.color
        },
        {
            title: dict.capacities.teams.title,
            href: '/capacities/teams',
            icon: Puzzle,
            description: 'Usa IA para sugerir equipos balanceados basados en perfiles comportamentales DISC.',
            color: theme.color
        }
    ];

    return (
        <div className={styles.container}>
            {/* Background grid */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
                zIndex: 0,
            }} />

            <div className="glass-panel" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '3rem',
                position: 'relative',
                zIndex: 1,
                padding: '1.5rem 2rem',
                borderRadius: '16px',
                borderLeft: `4px solid ${theme.color}`,
                boxShadow: theme.glow,
            }}>
                <div>
                    <h1 className={styles.header} data-testid="capacities-page-title" style={{
                        background: `linear-gradient(to right, #fff, ${theme.color})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.25rem',
                        fontSize: '2rem'
                    }}>{dict.capacities.title}</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
                        Gestión de talento, perfiles comportamentales y formación de equipos
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.color }}>2</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Módulos</div>
                    </div>
                    <NavBar />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', position: 'relative', zIndex: 1 }}>
                {sections.map((sec) => {
                    const IconComponent = sec.icon;
                    return (
                        <Link
                            key={sec.href}
                            href={sec.href}
                            className="glass-panel cap-card"
                            style={{ '--cap-color': sec.color } as React.CSSProperties}
                        >
                            <div className="cap-icon-wrapper">
                                <div className="cap-icon-glow"></div>
                                <IconComponent size={36} className="cap-icon" strokeWidth={1.5} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#fff' }}>
                                {sec.title}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>
                                {sec.description}
                            </p>
                            <span className="cap-btn">
                                <span>Ingresar</span>
                                <ArrowRight size={16} className="cap-arrow" />
                            </span>
                        </Link>
                    );
                })}
            </div>

            <style>{`
                .cap-card {
                    padding: 2.5rem 2rem;
                    text-decoration: none;
                    color: inherit;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 1.25rem;
                    border: 1px solid rgba(255,255,255,0.05);
                    background: rgba(255,255,255,0.02);
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .cap-card:hover {
                    transform: translateY(-5px);
                    border-color: var(--cap-color);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2), inset 0 0 20px rgba(255,255,255,0.02);
                }
                .cap-icon-wrapper {
                    position: relative;
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
                .cap-icon-glow {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: var(--cap-color);
                    filter: blur(20px);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 0;
                }
                .cap-card:hover .cap-icon-wrapper {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.1);
                    transform: scale(1.05);
                }
                .cap-card:hover .cap-icon-glow {
                    opacity: 0.3;
                }
                .cap-icon {
                    position: relative;
                    z-index: 1;
                    color: var(--cap-color);
                    transition: all 0.3s ease;
                }
                .cap-card:hover .cap-icon {
                    filter: brightness(1.2) drop-shadow(0 0 5px var(--cap-color));
                }
                .cap-btn {
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
                .cap-card:hover .cap-btn {
                    background: var(--cap-color);
                    color: #fff;
                    border-color: var(--cap-color);
                    box-shadow: 0 0 15px var(--cap-color);
                }
                .cap-arrow {
                    transition: transform 0.3s ease;
                }
                .cap-card:hover .cap-arrow {
                    transform: translateX(4px);
                }
            `}</style>
        </div>
    );
}
