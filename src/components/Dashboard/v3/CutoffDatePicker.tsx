'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CutoffDatePickerProps {
    value: string | null; // 'YYYY-MM-DD' or null
    onChange: (date: string | null) => void;
    loading?: boolean;
}

const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function pad(n: number) { return n.toString().padStart(2, '0'); }
function toDateStr(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

export default function CutoffDatePicker({ value, onChange, loading }: CutoffDatePickerProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const today = new Date();
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

    // Display month/year — default to selected date's month or today
    const selectedDate = value ? new Date(value + 'T12:00:00') : null;
    const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Calendar grid
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    let startDay = firstDayOfMonth.getDay() - 1; // Monday = 0
    if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const handleSelect = (day: number) => {
        const dateStr = toDateStr(viewYear, viewMonth, day);
        onChange(dateStr);
        setOpen(false);
    };

    const handleClear = () => {
        onChange(null);
        setOpen(false);
    };

    // Display label
    const displayLabel = value
        ? (value === todayStr ? 'Hoy' : new Date(value + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }))
        : 'Hoy';

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
            {/* Trigger */}
            <button
                onClick={() => setOpen(o => !o)}
                disabled={loading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: value && value !== todayStr ? 'hsl(174, 100%, 55%)' : 'rgba(255,255,255,0.7)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '0.03em',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(8px)',
                    opacity: loading ? 0.5 : 1,
                }}
            >
                <Calendar size={14} />
                <span>Corte: {displayLabel}</span>
                {loading && (
                    <span style={{
                        width: 14, height: 14,
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderTop: '2px solid hsl(174,100%,55%)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                )}
            </button>

            {/* Clear button when a non-today date is selected */}
            {value && value !== todayStr && !loading && (
                <button
                    onClick={handleClear}
                    title="Volver a Hoy"
                    style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'hsl(174, 100%, 35%)',
                        border: '2px solid hsl(222, 47%, 8%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        color: '#fff',
                    }}
                >
                    <X size={10} />
                </button>
            )}

            {/* Calendar dropdown */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '300px',
                    background: 'hsl(222, 60%, 12%)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    padding: '1rem',
                    zIndex: 1000,
                    animation: 'fadeSlideIn 0.2s ease',
                }}>
                    {/* Month navigation */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                    }}>
                        <button onClick={prevMonth} style={navBtnStyle}>
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.9)',
                            letterSpacing: '0.04em',
                        }}>
                            {MONTHS_ES[viewMonth]} {viewYear}
                        </span>
                        <button onClick={nextMonth} style={navBtnStyle}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '2px',
                        marginBottom: '4px',
                    }}>
                        {DAYS_ES.map(d => (
                            <div key={d} style={{
                                textAlign: 'center',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: 'rgba(255,255,255,0.35)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                padding: '4px 0',
                            }}>{d}</div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '2px',
                    }}>
                        {/* Empty cells for offset */}
                        {Array.from({ length: startDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}

                        {/* Days */}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const dateStr = toDateStr(viewYear, viewMonth, day);
                            const isToday = dateStr === todayStr;
                            const isSelected = dateStr === value;
                            const isFuture = dateStr > todayStr;

                            return (
                                <button
                                    key={day}
                                    onClick={() => !isFuture && handleSelect(day)}
                                    disabled={isFuture}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.78rem',
                                        fontWeight: isSelected || isToday ? 700 : 500,
                                        border: isToday && !isSelected ? '1px solid hsl(174, 100%, 45%)' : '1px solid transparent',
                                        borderRadius: '10px',
                                        background: isSelected
                                            ? 'hsl(174, 100%, 35%)'
                                            : 'transparent',
                                        color: isFuture
                                            ? 'rgba(255,255,255,0.15)'
                                            : isSelected
                                                ? '#fff'
                                                : isToday
                                                    ? 'hsl(174, 100%, 55%)'
                                                    : 'rgba(255,255,255,0.75)',
                                        cursor: isFuture ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.15s',
                                        padding: 0,
                                    }}
                                    onMouseEnter={e => {
                                        if (!isFuture && !isSelected) {
                                            (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) {
                                            (e.target as HTMLElement).style.background = 'transparent';
                                        }
                                    }}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick action: Hoy */}
                    <div style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        justifyContent: 'center',
                    }}>
                        <button
                            onClick={handleClear}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.4rem 1rem',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'hsl(174, 100%, 55%)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                letterSpacing: '0.05em',
                            }}
                            onMouseEnter={e => {
                                (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
                            }}
                            onMouseLeave={e => {
                                (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                            }}
                        >
                            <Calendar size={12} />
                            Ir a Hoy
                        </button>
                    </div>
                </div>
            )}

            {/* Keyframe animation styles */}
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

const navBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    padding: 0,
};
