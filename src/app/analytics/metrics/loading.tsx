import styles from '@/app/strategy/page.module.css';
import PrismaAvatar from '@/components/PrismaAvatar';
import NavBar from '@/components/NavBar';
import Link from 'next/link';

export default function MetricsLoading() {
    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/analytics" style={{ fontSize: '1.5rem', textDecoration: 'none', color: 'var(--text-muted)' }}>←</Link>
                    <div style={{ width: '250px', height: '30px', borderRadius: '4px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                </div>
                <NavBar />
            </div>

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', height: '300px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <PrismaAvatar size={90} emotion="thinking" />
                    <h2 style={{ margin: 0, animation: 'pulse 1.5s infinite', color: 'var(--text-main)', textAlign: 'center' }}>Procesando Análisis Profundo...</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
                        PRAGMA está calculando la adherencia, patrones de comportamiento y madurez de OKRs de tu equipo. Esto puede tardar unos segundos.
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes pulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
