import { MeasurementDirection } from '@prisma/client';

export const MEASUREMENT_UNITS = [
    {
        category: 'Porcentaje y Proporción',
        emoji: '📊',
        units: [
            { label: 'Porcentaje', symbol: '%' },
            { label: 'Puntos porcentuales', symbol: 'pp' },
            { label: 'Tasa (ratio)', symbol: 'x' },
            { label: 'Basis points', symbol: 'bps' }
        ]
    },
    {
        category: 'Cantidad Absoluta',
        emoji: '🔢',
        units: [
            { label: 'Unidades / ítems', symbol: 'u' },
            { label: 'Número entero', symbol: '#' },
            { label: 'Eventos', symbol: 'eventos' },
            { label: 'Ocurrencias', symbol: 'ocurrencias' },
            { label: 'Registros', symbol: 'registros' }
        ]
    },
    {
        category: 'Tiempo',
        emoji: '⏱️',
        units: [
            { label: 'Minutos', symbol: 'min' },
            { label: 'Horas', symbol: 'h' },
            { label: 'Días', symbol: 'días' },
            { label: 'Semanas', symbol: 'sem' },
            { label: 'Meses', symbol: 'meses' }
        ]
    },
    {
        category: 'Dinero',
        emoji: '💰',
        units: [
            { label: 'Símbolo moneda', symbol: '$' },
            { label: 'Euros', symbol: '€' },
            { label: 'Libras', symbol: '£' },
            { label: 'Yenes', symbol: '¥' },
            { label: 'Moneda personalizada', symbol: 'custom' }
        ]
    },
    {
        category: 'Índices y Scores',
        emoji: '📈',
        units: [
            { label: 'pts NPS', symbol: 'pts NPS' },
            { label: 'pts CSAT', symbol: 'pts CSAT' },
            { label: 'pts eNPS', symbol: 'pts eNPS' },
            { label: 'Puntos genéricos', symbol: 'pts' },
            { label: 'Estrellas', symbol: '★' },
            { label: 'Posición / Ranking', symbol: 'pos' }
        ]
    }
];

export const DIRECTION_CONFIG = {
    [MeasurementDirection.MAXIMIZE]: {
        emoji: '↑',
        label: 'Maximizar',
        description: 'Mientras más alto mejor (ej: ingresos, NPS)'
    },
    [MeasurementDirection.MINIMIZE]: {
        emoji: '↓',
        label: 'Minimizar',
        description: 'Mientras más bajo mejor (ej: errores, tiempos)'
    },
    [MeasurementDirection.TARGET]: {
        emoji: '🎯',
        label: 'Alcanzar exacto',
        description: 'Hay un valor target puntual (ej: ratio 2x)'
    },
    [MeasurementDirection.COMPLETE]: {
        emoji: '✅',
        label: 'Completar',
        description: 'Binario, se logra o no (ej: lanzamiento)'
    }
};

/**
 * Calcula el progreso de un KR basado en su dirección, valor actual y meta.
 * Retorna un valor entre 0 y 100 (aunque puede superar 100 si no se capea).
 */
export function calculateKRProgress(
    direction: MeasurementDirection,
    current: number,
    target: number
): number {
    if (direction === MeasurementDirection.COMPLETE) {
        return current >= target ? 100 : 0;
    }

    if (direction === MeasurementDirection.MINIMIZE) {
        if (current <= target) return 100;
        if (current === 0) return 0; // Evitar división por cero
        // Si el target es 10 y el current es 20, progreso es 50%.
        // Si el current es 5, progreso es 100% (arriba).
        // Usamos una lógica de proporción inversa.
        return Math.max(0, Math.min(100, (target / current) * 100));
    }

    if (direction === MeasurementDirection.TARGET) {
        if (target === 0) return current === 0 ? 100 : 0;
        // Precisión: mientras más cerca de 100% de cercanía al target.
        const diff = Math.abs(target - current);
        const progress = Math.max(0, 100 - (diff / target) * 100);
        return Math.round(progress);
    }

    // Default: MAXIMIZE
    if (target === 0) return current > 0 ? 100 : 0;
    return Math.max(0, (current / target) * 100);
}
