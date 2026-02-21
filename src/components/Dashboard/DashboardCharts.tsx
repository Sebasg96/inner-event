'use client';

import { motion } from 'framer-motion';
import type { GlobalDashboardData, DashboardMetric, DashboardTrafficLight } from '@/app/actions';
import { useMemo } from 'react';

// --- Icons ---
const TrendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

// --- Components ---

const KPICard = ({ title, value, subtitle, icon, gradient }: { title: string, value: string | number, subtitle: string, icon: React.ReactNode, gradient: string }) => (
    <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        className="glass-panel p-7 relative overflow-hidden group border-white/5 shadow-2xl"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

        <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                        {icon}
                    </div>
                    <p className="text-slate-300 text-xs font-semibold tracking-wider uppercase">{title}</p>
                </div>
                <div className="space-y-1.5">
                    <h3 className="text-4xl font-extrabold text-white tracking-tight">{value}</h3>
                    <p className="text-sm text-slate-400">{subtitle}</p>
                </div>
            </div>
        </div>
    </motion.div>
);

const StrategicHeartbeat = ({ percentage, status, size = 220 }: { percentage: number, status: DashboardTrafficLight, size?: number }) => {
    const radius = size / 2 - 15;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const colors = {
        GREEN: 'var(--accent)',
        YELLOW: 'var(--warning)',
        RED: 'var(--danger)',
        GRAY: 'var(--text-muted)'
    };

    const statusGlow = {
        GREEN: '0 0 30px hsla(150, 100%, 30%, 0.5)',
        YELLOW: '0 0 30px hsla(40, 100%, 45%, 0.5)',
        RED: '0 0 30px hsla(350, 90%, 55%, 0.5)',
        GRAY: 'none'
    };

    return (
        <div className="relative flex items-center justify-center p-4" style={{ width: size + 40, height: size + 40 }}>
            {/* Outer Ring Glow */}
            <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full blur-[40px]"
                style={{ background: `hsl(${colors[status]})`, filter: 'blur(50px)' }}
            />

            <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="16"
                    fill="transparent"
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 2, ease: "circOut" }}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={`hsl(${colors[status]})`}
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(${statusGlow[status]})` }}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
                <div
                    className="text-center"
                >
                    <span className="text-5xl font-extrabold tracking-tight block">{Math.round(percentage)}%</span>
                    <span className="text-xs uppercase font-semibold tracking-widest text-slate-300 mt-2 block">Pulso Global</span>
                </div>
            </div>
        </div>
    );
};

// --- Color Maps ---
const nodeColors: Record<DashboardTrafficLight, { dot: string, text: string, bg: string, line: string, badge: string }> = {
    GREEN: { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10', line: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    YELLOW: { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10', line: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    RED: { dot: 'bg-rose-400', text: 'text-rose-400', bg: 'bg-rose-500/10', line: 'border-rose-500/30', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    GRAY: { dot: 'bg-slate-400', text: 'text-slate-400', bg: 'bg-slate-500/10', line: 'border-slate-500/30', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

// --- Hex color helpers for inline styles ---
const dotHex: Record<DashboardTrafficLight, string> = {
    GREEN: '#34d399', YELLOW: '#fbbf24', RED: '#fb7185', GRAY: '#94a3b8'
};

// --- Strategy Tree (one per Mega) ---
const StrategyTree = ({ mega, index }: { mega: DashboardMetric, index: number }) => {
    const objectives = mega.children || [];
    const mc = nodeColors[mega.trafficLight];
    const hex = dotHex[mega.trafficLight];

    return (
        <div
            className="rounded-2xl p-6 md:p-8 relative overflow-hidden border"
            style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderColor: 'rgba(148, 163, 184, 0.15)',
                boxShadow: `0 0 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
        >
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: `linear-gradient(to right, transparent, ${hex}, transparent)` }} />

            {/* === MEGA ROOT === */}
            <div className="flex items-center gap-4 pb-5 mb-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div
                    className="w-6 h-6 rounded-full shrink-0"
                    style={{ backgroundColor: hex, boxShadow: `0 0 14px ${hex}80` }}
                />
                <h3 className="text-lg font-bold text-white flex-1 leading-snug">{mega.title}</h3>
                <span
                    className="text-sm font-extrabold px-4 py-1.5 rounded-full"
                    style={{ backgroundColor: `${hex}25`, color: hex, border: `1px solid ${hex}50` }}
                >
                    {Math.round(mega.progress)}%
                </span>
            </div>

            {/* === OBJECTIVES === */}
            {objectives.length > 0 && (
                <div className="ml-3 pl-6 space-y-5" style={{ borderLeft: `3px solid rgba(255,255,255,0.12)` }}>
                    {objectives.map((obj) => {
                        const oc = nodeColors[obj.trafficLight];
                        const objHex = dotHex[obj.trafficLight];
                        const krs = obj.children || [];
                        return (
                            <div key={obj.id}>
                                {/* Objective row */}
                                <div className="flex items-center gap-3 relative py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                                    {/* Horizontal branch line */}
                                    <div className="absolute -left-6 top-1/2 w-6 h-[3px]" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
                                    <div
                                        className="w-4 h-4 rounded-full shrink-0"
                                        style={{ backgroundColor: objHex, boxShadow: `0 0 8px ${objHex}60` }}
                                    />
                                    <span className="text-sm text-slate-100 flex-1 font-medium">{obj.title}</span>
                                    <span
                                        className="text-xs font-bold px-2.5 py-0.5 rounded-md"
                                        style={{ backgroundColor: `${objHex}20`, color: objHex, border: `1px solid ${objHex}40` }}
                                    >
                                        {Math.round(obj.progress)}%
                                    </span>
                                </div>

                                {/* === KRs === */}
                                {krs.length > 0 && (
                                    <div className="ml-2 pl-5 mt-1.5 space-y-1.5" style={{ borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
                                        {krs.map((kr) => {
                                            const krHex = dotHex[kr.trafficLight];
                                            return (
                                                <div key={kr.id} className="flex items-center gap-2.5 relative py-1 px-2 rounded hover:bg-white/[0.03] transition-colors">
                                                    {/* Horizontal branch */}
                                                    <div className="absolute -left-5 top-1/2 w-5 h-[2px]" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: krHex, opacity: 0.85 }}
                                                    />
                                                    <span className="text-xs text-slate-300 flex-1">{kr.title}</span>
                                                    <span className="text-xs font-semibold" style={{ color: krHex }}>
                                                        {Math.round(kr.progress)}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-5 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /><span className="text-[11px] text-slate-400">En meta</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-[11px] text-slate-400">Advertencia</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-400" /><span className="text-[11px] text-slate-400">Crítico</span></div>
                <div className="ml-auto text-[10px] text-slate-500">
                    ● Grande = Mega &nbsp; ● Mediano = Objetivo &nbsp; ● Pequeño = KR
                </div>
            </div>
        </div>
    );
};

export default function DashboardCharts({ data }: { data: GlobalDashboardData }) {

    const riskyMegas = data.megas.filter(m => m.trafficLight === 'RED');
    const onTrackMegas = data.megas.filter(m => m.trafficLight === 'GREEN');

    const riskyItems = useMemo(() => {
        const items: { title: string, progress: number, type: string, parent: string, id: string }[] = [];
        data.megas.forEach(mega => {
            if (mega.children) {
                mega.children.forEach(obj => {
                    if (obj.trafficLight === 'RED') {
                        items.push({
                            title: obj.title,
                            progress: obj.progress,
                            type: 'Objetivo',
                            parent: mega.title,
                            id: obj.id
                        });
                    }
                    if (obj.children) {
                        obj.children.forEach(kr => {
                            if (kr.trafficLight === 'RED') {
                                items.push({
                                    title: kr.title,
                                    progress: kr.progress,
                                    type: 'KR',
                                    parent: obj.title,
                                    id: kr.id
                                });
                            }
                        });
                    }
                });
            }
        });
        return items.sort((a, b) => a.progress - b.progress).slice(0, 5);
    }, [data]);

    return (
        <section className="space-y-12 pb-8">

            {/* upper KPIs with Glassmorphism */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <KPICard
                    title="Cumplimiento Global"
                    value={`${Math.round(data.globalScore)}%`}
                    subtitle="Índice de Salud Corporativa"
                    icon={<TrendIcon />}
                    gradient="from-blue-600 to-indigo-600"
                />
                <KPICard
                    title="Operación Saludable"
                    value={onTrackMegas.length}
                    subtitle={`Megas con avance óptimo (${data.megas.length} total)`}
                    icon={<CheckIcon />}
                    gradient="from-emerald-600 to-teal-600"
                />
                <KPICard
                    title="Zonas de Riesgo"
                    value={riskyMegas.length}
                    subtitle="Intervención inmediata requerida"
                    icon={<AlertIcon />}
                    gradient="from-rose-600 to-pink-600"
                />
            </div>

            {/* Main Command Center Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left: Strategic Heartbeat Gauge */}
                <div className="lg:col-span-4 glass-panel p-10 flex flex-col items-center justify-between min-h-[500px] border-white/10 shadow-3xl text-center relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white tracking-wide uppercase">Comando Estratégico</h2>
                        <div className="h-0.5 w-10 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto" />
                    </div>

                    <StrategicHeartbeat percentage={data.globalScore} status={data.globalTrafficLight} />

                    <div className="w-full space-y-6">
                        <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
                            <span className="text-slate-300 text-xs font-semibold tracking-wider uppercase">Estatus de Red</span>
                            <span className={`font-bold px-3 py-1 rounded-full text-xs ${data.globalTrafficLight === 'GREEN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                data.globalTrafficLight === 'YELLOW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    data.globalTrafficLight === 'RED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400'
                                }`}>
                                {data.globalTrafficLight === 'GREEN' ? 'OPERA NORMAL' :
                                    data.globalTrafficLight === 'YELLOW' ? 'ADVERTENCIA' :
                                        data.globalTrafficLight === 'RED' ? 'CRÍTICO' : 'NEUTRO'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 px-4 leading-relaxed">
                            Sincronizado con base de datos en tiempo real.
                            Último escaneo completado.
                        </p>
                    </div>
                </div>

                {/* Right: Critical Risk Radar */}
                <div className="lg:col-span-8 glass-panel p-10 border-white/10 shadow-3xl min-h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Radar de Riesgos</h2>
                            <p className="text-slate-400 text-sm">Análisis de los 5 elementos más críticos de la estrategia</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs font-semibold tracking-wider border border-white/20 px-5 py-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                        >
                            Ver Reporte IA →
                        </motion.button>
                    </div>

                    <div className="flex-1 space-y-6">
                        {riskyItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white/5 rounded-3xl border-dashed border-2 border-white/10">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="mb-4 opacity-50"
                                >
                                    <CheckIcon />
                                </motion.div>
                                <span className="text-sm font-bold uppercase tracking-wider">Sistemas en Verde</span>
                                <p className="text-sm text-slate-400 mt-2">No se detectaron focos de riesgo críticos.</p>
                            </div>
                        ) : (
                            riskyItems.map((item, idx) => (
                                <motion.div
                                    key={item.id + idx}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-transparent hover:border-rose-500/30 group transition-all"
                                >
                                    <div className="relative">
                                        <svg width="60" height="60" className="transform -rotate-90">
                                            <circle cx="30" cy="30" r="25" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                                            <circle cx="30" cy="30" r="25" stroke="var(--danger)" strokeWidth="4" fill="transparent" strokeDasharray={157} strokeDashoffset={157 - (item.progress / 100) * 157} strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                            {Math.round(item.progress)}%
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">Riesgo Alto</span>
                                            <span className="text-[11px] text-slate-400 font-medium uppercase">{item.type}</span>
                                        </div>
                                        <h4 className="text-base font-semibold text-white/90 truncate group-hover:text-rose-400 transition-colors" title={item.title}>
                                            {item.title}
                                        </h4>
                                        <p className="text-xs text-slate-400">Vinculado a: {item.parent}</p>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        className="shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                    </motion.button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Strategic Tree View */}
            <div className="space-y-8">
                <div className="flex flex-col items-center text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Árbol Estratégico</h2>
                    <p className="text-slate-400 text-sm">Visualización jerárquica: Mega → Objetivos → Resultados Clave</p>
                </div>

                <div className="space-y-6">
                    {data.megas.map((mega, idx) => (
                        <StrategyTree key={mega.id} mega={mega} index={idx} />
                    ))}
                </div>
            </div>

        </section>
    );
}
