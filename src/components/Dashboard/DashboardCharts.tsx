'use client';

import { motion } from 'framer-motion';
import type { GlobalDashboardData, DashboardMetric, DashboardTrafficLight } from '@/app/actions';
import { useState, useMemo } from 'react';

// --- Icons ---
const TrendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

// --- Components ---

const KPICard = ({ title, value, subtitle, icon, color }: { title: string, value: string | number, subtitle: string, icon: React.ReactNode, color: string }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center"
    >
        <div className={`p-4 rounded-full bg-opacity-10 mb-4 ${color.replace('text-', 'bg-')} ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-4xl font-bold text-slate-800 tracking-tight">{value}</h3>
            <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
        </div>
    </motion.div>
);

const RadialProgress = ({ percentage, status, size = 180 }: { percentage: number, status: DashboardTrafficLight, size?: number }) => {
    const radius = size / 2 - 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const colors = {
        GREEN: '#22c55e',
        YELLOW: '#eab308',
        RED: '#ef4444',
        GRAY: '#94a3b8'
    };

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                    fill="transparent"
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={colors[status]}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-white">
                <span className="text-4xl font-bold tracking-tighter">{Math.round(percentage)}%</span>
                <span className="text-xs uppercase tracking-widest text-slate-400 mt-1">Cumplimiento</span>
            </div>
        </div>
    );
};

const ProgressBar = ({ real, expected, status }: { real: number, expected: number, status: DashboardTrafficLight }) => {
    const colors = {
        GREEN: 'bg-emerald-500',
        YELLOW: 'bg-amber-400',
        RED: 'bg-rose-500',
        GRAY: 'bg-slate-300'
    };

    return (
        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-3">
            {/* Expected Marker (Vertical Line or Ghost Bar?) Using ghost bar style for clearer context */}
            <div
                className="absolute top-0 left-0 h-full bg-slate-200 border-r-2 border-slate-400/50 z-0"
                style={{ width: `${expected}%` }}
                title={`Esperado: ${Math.round(expected)}%`}
            />

            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${real}%` }}
                transition={{ duration: 0.8 }}
                className={`absolute top-0 left-0 h-full rounded-full z-10 shadow-sm ${colors[status]}`}
            />
        </div>
    );
};

const MegaCard = ({ mega }: { mega: DashboardMetric }) => {
    const [expanded, setExpanded] = useState(false);

    const statusColors = {
        GREEN: 'bg-emerald-500',
        YELLOW: 'bg-amber-500',
        RED: 'bg-rose-500',
        GRAY: 'bg-slate-400'
    };

    const statusBorder = {
        GREEN: 'border-emerald-200',
        YELLOW: 'border-amber-200',
        RED: 'border-rose-200',
        GRAY: 'border-slate-200'
    };

    return (
        <motion.div
            layout
            className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${statusBorder[mega.trafficLight]}`}
        >
            <div className="p-6 flex flex-col items-center text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-3 ${mega.trafficLight === 'GREEN' ? 'bg-emerald-100 text-emerald-800' :
                    mega.trafficLight === 'YELLOW' ? 'bg-amber-100 text-amber-800' :
                        mega.trafficLight === 'RED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                    MEGA
                </div>

                <h3 className="font-bold text-lg text-slate-800 leading-snug mb-4 h-14 flex items-center justify-center" title={mega.title}>
                    {mega.title}
                </h3>

                <div className="w-full mt-2">
                    <div className="flex justify-between text-sm font-medium text-slate-600 mb-1">
                        <span>Progreso Actual</span>
                        <span>{Math.round(mega.progress)}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Esperado al día de hoy</span>
                        <span>{Math.round(mega.expectedProgress)}%</span>
                    </div>

                    <ProgressBar real={mega.progress} expected={mega.expectedProgress} status={mega.trafficLight} />
                </div>
            </div>

            {/* Objectives Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center justify-between"
                >
                    <span>{mega.children?.length || 0} Objetivos Vinculados</span>
                    <span className="text-lg leading-none">{expanded ? '−' : '+'}</span>
                </button>

                {expanded && mega.children && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 space-y-4"
                    >
                        {mega.children.map(obj => (
                            <div key={obj.id} className="relative pl-3 border-l-2 border-slate-200">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-slate-700 truncate w-3/4" title={obj.title}>{obj.title}</span>
                                    <span className={`font-bold ${obj.trafficLight === 'GREEN' ? 'text-emerald-600' :
                                        obj.trafficLight === 'YELLOW' ? 'text-amber-600' :
                                            obj.trafficLight === 'RED' ? 'text-rose-600' : 'text-slate-400'
                                        }`}>{Math.round(obj.progress)}%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-200 rounded-full">
                                    <div
                                        className={`h-full rounded-full ${statusColors[obj.trafficLight]}`}
                                        style={{ width: `${obj.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default function DashboardCharts({ data }: { data: GlobalDashboardData }) {

    // Calculate Insights
    const riskyMegas = data.megas.filter(m => m.trafficLight === 'RED');
    const onTrackMegas = data.megas.filter(m => m.trafficLight === 'GREEN');

    // Find risky lower level items (Objectives/KRs)
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
        return items.sort((a, b) => a.progress - b.progress).slice(0, 5); // Top 5 worst
    }, [data]);

    return (
        <section className="space-y-8 animate-in fade-in duration-500">

            {/* 1. KPIs Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Cumplimiento Global"
                    value={`${Math.round(data.globalScore)}%`}
                    subtitle="Promedio Ponderado"
                    icon={<TrendIcon />}
                    color="text-blue-600"
                />
                <KPICard
                    title="Megas en Camino"
                    value={onTrackMegas.length}
                    subtitle={`De un total de ${data.megas.length}`}
                    icon={<CheckIcon />}
                    color="text-emerald-600"
                />
                <KPICard
                    title="Atención Requerida"
                    value={riskyMegas.length}
                    subtitle="Megas con avance crítico"
                    icon={<AlertIcon />}
                    color="text-rose-600"
                />
            </div>

            {/* 2. Global Pulse & Critical Focus */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Strategy Pulse */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl lg:col-span-1 flex flex-col items-center text-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-16 -mt-16 animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -ml-16 -mb-16 animate-blob animation-delay-2000"></div>

                    <div className="relative z-10 flex flex-col items-center justify-between h-full w-full">
                        <div className="flex flex-col items-center">
                            <h2 className="text-xl font-semibold mb-2">Pulso Estratégico</h2>
                            <p className="text-slate-400 text-sm mb-6 max-w-[200px]">Estado general basado en kpis ponderados</p>
                            <RadialProgress percentage={data.globalScore} status={data.globalTrafficLight} />
                        </div>

                        <div className="w-full mt-8 bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-300">Estado Actual</span>
                                <span className={`font-bold px-2 py-0.5 rounded ${data.globalTrafficLight === 'GREEN' ? 'bg-emerald-500/20 text-emerald-400' :
                                    data.globalTrafficLight === 'YELLOW' ? 'bg-amber-500/20 text-amber-400' :
                                        data.globalTrafficLight === 'RED' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'
                                    }`}>
                                    {data.globalTrafficLight === 'GREEN' ? 'SALUDABLE' :
                                        data.globalTrafficLight === 'YELLOW' ? 'EN RIESGO' :
                                            data.globalTrafficLight === 'RED' ? 'CRÍTICO' : 'NEUTRO'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Critical Focus List */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm lg:col-span-2">
                    <div className="flex flex-col items-center text-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Focos de Riesgo</h2>
                        <p className="text-slate-500 text-sm mb-4">Top 5 elementos que requieren atención inmediata</p>
                        <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-1.5 rounded-full transition-colors">
                            Ver reporte completo →
                        </button>
                    </div>

                    <div className="space-y-4">
                        {riskyItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50 rounded-2xl border-dashed border-2 border-slate-100">
                                <CheckIcon />
                                <span className="mt-2 text-sm font-medium">¡Todo se ve excelente! No hay riesgos críticos detectados.</span>
                            </div>
                        ) : (
                            riskyItems.map((item, idx) => (
                                <div key={item.id + idx} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-xs shrink-0">
                                        {Math.round(item.progress)}%
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-800 truncate" title={item.title}>{item.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{item.type}</span>
                                            <span>en {item.parent}</span>
                                        </div>
                                    </div>
                                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="px-3 py-1 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm text-slate-600">
                                            Gestionar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Detailed Megas Grid */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center gap-2 mb-8">
                    <span className="w-12 h-1 bg-slate-200 rounded-full"></span>
                    <h2 className="text-2xl font-bold text-slate-800">Desglose por Mega</h2>
                    <span className="w-12 h-1 bg-slate-200 rounded-full"></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                    {data.megas.map(mega => (
                        <MegaCard key={mega.id} mega={mega} />
                    ))}
                </div>
            </div>

        </section>
    );
}
