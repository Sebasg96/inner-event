'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function DashboardFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Default to current year if not present
    const currentYear = new Date().getFullYear();
    const defaultStart = `${currentYear}-01-01`;
    const defaultEnd = `${currentYear}-12-31`;

    const [startDate, setStartDate] = useState(searchParams.get('start') || defaultStart);
    const [endDate, setEndDate] = useState(searchParams.get('end') || defaultEnd);

    // Update URL when filters change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (startDate) params.set('start', startDate);
            else params.delete('start');

            if (endDate) params.set('end', endDate);
            else params.delete('end');

            router.push(`${pathname}?${params.toString()}`);
        }, 500); // Debounce to allow typing/picking

        return () => clearTimeout(timer);
    }, [startDate, endDate, router, pathname, searchParams]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel flex flex-col md:flex-row items-center justify-center gap-6 p-4 mb-6 shadow-2xl border-white/5"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-glow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <span className="text-sm font-semibold tracking-wide text-white/90">Periodo de Análisis</span>
            </div>

            <div className="flex items-center gap-3">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                />
                <span className="text-slate-500 font-bold">→</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                />
            </div>

            <div className="px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-xs text-slate-300 font-medium">
                Filtro Dinámico de KRs
            </div>
        </motion.div>
    );
}
