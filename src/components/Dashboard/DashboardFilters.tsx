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
            className="flex flex-col md:flex-row items-center justify-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 mb-6"
        >
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">Periodo de Análisis:</span>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400">→</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="text-xs text-slate-400">
                (Filtra KRs activos en este rango)
            </div>
        </motion.div>
    );
}
