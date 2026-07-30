'use client';

import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import { submitDiagnosticResponse } from '@/app/actions';
import styles from '@/app/strategy/page.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type QuestionType = 'TEXT' | 'YES_NO' | 'RATING' | 'MULTIPLE_CHOICE';
type Frequency = 'DAILY' | 'WEEKLY';

interface Question {
    id: string;
    text: string;
    type: QuestionType;
    options: string | null;
}

interface Response {
    id: string;
    questionId: string;
    answer: string;
}

interface Assignment {
    id: string;
    campaign: {
        id: string;
        name: string;
        description: string | null;
        frequency: Frequency;
        questionsPerPeriod: number;
        startDate: string | Date;
        endDate: string | Date | null;
        questions: { order: number; question: Question }[];
    };
    responses: Response[];
}

interface Props {
    assignments: Assignment[];
    isAdmin: boolean;
}

// ── Period helpers ────────────────────────────────────────────────────────────

function getCurrentPeriod(startDate: Date, frequency: Frequency): number {
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    if (diffMs < 0) return -1; // campaign hasn't started
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / (frequency === 'DAILY' ? 1 : 7));
}

function getPeriodDeadline(startDate: Date, frequency: Frequency, period: number): Date {
    const d = new Date(startDate);
    d.setDate(d.getDate() + (period + 1) * (frequency === 'DAILY' ? 1 : 7));
    return d;
}

function formatDate(d: Date): string {
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Question renderer ─────────────────────────────────────────────────────────

function QuestionInput({
    question,
    value,
    onChange,
}: {
    question: Question;
    value: string;
    onChange: (v: string) => void;
}) {
    if (question.type === 'YES_NO') {
        return (
            <div style={{ display: 'flex', gap: '1rem' }}>
                {['Sí', 'No'].map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '8px',
                            border: value === opt ? '2px solid hsl(var(--secondary))' : '1px solid rgba(255,255,255,0.2)',
                            background: value === opt ? 'rgba(34,131,255,0.2)' : 'rgba(255,255,255,0.05)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: value === opt ? 700 : 400,
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        );
    }

    if (question.type === 'RATING') {
        return (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(String(n))}
                        style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            border: value === String(n) ? '2px solid hsl(var(--secondary))' : '1px solid rgba(255,255,255,0.2)',
                            background: value === String(n) ? 'hsl(var(--secondary))' : 'rgba(255,255,255,0.05)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '1rem',
                        }}
                    >
                        {n}
                    </button>
                ))}
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    1 = Muy bajo · 5 = Excelente
                </span>
            </div>
        );
    }

    if (question.type === 'MULTIPLE_CHOICE' && question.options) {
        const opts = question.options.split('|').map(o => o.trim());
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {opts.map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                        <input
                            type="radio"
                            name={`q-${question.id}`}
                            value={opt}
                            checked={value === opt}
                            onChange={() => onChange(opt)}
                            style={{ accentColor: 'hsl(var(--secondary))' }}
                        />
                        <span style={{ color: 'rgba(255,255,255,0.85)' }}>{opt}</span>
                    </label>
                ))}
            </div>
        );
    }

    // TEXT (default)
    return (
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={3}
            placeholder="Escribe tu respuesta..."
            style={{ width: '100%', resize: 'vertical', minHeight: '80px' }}
        />
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DiagnosticsUserClient({ assignments, isAdmin }: Props) {
    const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    const ACCENT = 'hsl(var(--secondary))';

    function openAssignment(assignment: Assignment) {
        const initial: Record<string, string> = {};
        assignment.responses.forEach(r => { initial[r.questionId] = r.answer; });
        setAnswers(initial);
        setActiveAssignment(assignment);
        setSavedIds(new Set(assignment.responses.map(r => r.questionId)));
    }

    async function handleSave(questionId: string) {
        if (!activeAssignment || !answers[questionId]?.trim()) return;
        setSaving(true);
        try {
            await submitDiagnosticResponse(activeAssignment.id, questionId, answers[questionId]);
            setSavedIds(prev => new Set(prev).add(questionId));
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveAll() {
        if (!activeAssignment) return;
        setSaving(true);
        try {
            for (const [questionId, answer] of Object.entries(answers)) {
                if (answer.trim()) {
                    await submitDiagnosticResponse(activeAssignment.id, questionId, answer);
                    setSavedIds(prev => new Set(prev).add(questionId));
                }
            }
        } finally {
            setSaving(false);
        }
    }

    // ── Answer view ──

    if (activeAssignment) {
        const campaign = activeAssignment.campaign;
        const startDate = new Date(campaign.startDate);
        const period = getCurrentPeriod(startDate, campaign.frequency);
        const deadline = period >= 0 ? getPeriodDeadline(startDate, campaign.frequency, period) : null;

        const orderedQuestions = campaign.questions.map(cq => cq.question);
        const periodQuestions = period >= 0
            ? orderedQuestions.slice(period * campaign.questionsPerPeriod, (period + 1) * campaign.questionsPerPeriod)
            : [];

        const answeredCount = periodQuestions.filter(q => savedIds.has(q.id)).length;

        return (
            <div className={styles.container}>
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <button onClick={() => setActiveAssignment(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            ← Volver
                        </button>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: ACCENT, margin: 0 }}>{campaign.name}</h1>
                        {deadline && (
                            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                Período actual · Fecha límite: {formatDate(deadline)}
                            </p>
                        )}
                    </div>
                    <NavBar />
                </div>

                {/* Progress */}
                <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                        <span>Progreso de este período</span>
                        <span style={{ fontWeight: 600, color: 'white' }}>{answeredCount} / {periodQuestions.length} respondidas</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                        <div style={{ height: '100%', borderRadius: '4px', background: ACCENT, width: periodQuestions.length > 0 ? `${Math.round((answeredCount / periodQuestions.length) * 100)}%` : '0%', transition: 'width 0.4s' }} />
                    </div>
                </div>

                {period < 0 && (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        Esta campaña aún no ha comenzado. Inicia: {formatDate(startDate)}
                    </div>
                )}

                {period >= 0 && periodQuestions.length === 0 && (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        No hay preguntas para este período.
                    </div>
                )}

                {/* Questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {periodQuestions.map((q, i) => {
                        const answered = savedIds.has(q.id);
                        return (
                            <div key={q.id} className="glass-panel" style={{ padding: '1.75rem', borderLeft: `4px solid ${answered ? '#4ade80' : ACCENT}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                                        <span style={{ color: ACCENT, fontWeight: 700, fontSize: '1.1rem', minWidth: '1.5rem' }}>{i + 1}.</span>
                                        <p style={{ color: 'white', fontWeight: 500, margin: 0, fontSize: '1rem', lineHeight: 1.5 }}>{q.text}</p>
                                    </div>
                                    {answered && (
                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(74,222,128,0.15)', color: '#4ade80', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                                            Respondida
                                        </span>
                                    )}
                                </div>

                                <QuestionInput
                                    question={q}
                                    value={answers[q.id] ?? ''}
                                    onChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <button
                                        onClick={() => handleSave(q.id)}
                                        disabled={saving || !answers[q.id]?.trim()}
                                        className="btn-primary"
                                        style={{ background: answered ? 'rgba(74,222,128,0.2)' : ACCENT, border: answered ? '1px solid #4ade80' : 'none', fontSize: '0.875rem', padding: '0.4rem 1.25rem' }}
                                    >
                                        {saving ? 'Guardando...' : answered ? 'Actualizar' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {periodQuestions.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="btn-primary"
                            style={{ background: ACCENT, padding: '0.75rem 2.5rem' }}
                        >
                            {saving ? 'Guardando...' : 'Guardar todas las respuestas'}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ── Assignment list view ──

    return (
        <div className={styles.container}>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: ACCENT, margin: 0 }}>Mi Diagnóstico</h1>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Cuestionarios asignados para tu evaluación
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isAdmin && (
                        <a href="/diagnostics/admin" style={{ fontSize: '0.875rem', color: ACCENT, textDecoration: 'none', padding: '0.4rem 1rem', border: `1px solid ${ACCENT}`, borderRadius: '8px' }}>
                            Administrar
                        </a>
                    )}
                    <NavBar />
                </div>
            </div>

            {assignments.length === 0 && (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No tienes cuestionarios asignados por el momento.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {assignments.map(assignment => {
                    const campaign = assignment.campaign;
                    const startDate = new Date(campaign.startDate);
                    const period = getCurrentPeriod(startDate, campaign.frequency);
                    const deadline = period >= 0 ? getPeriodDeadline(startDate, campaign.frequency, period) : null;

                    const orderedQuestions = campaign.questions.map(cq => cq.question);
                    const periodQuestions = period >= 0
                        ? orderedQuestions.slice(period * campaign.questionsPerPeriod, (period + 1) * campaign.questionsPerPeriod)
                        : [];

                    const answeredThisPeriod = periodQuestions.filter(q =>
                        assignment.responses.some(r => r.questionId === q.id)
                    ).length;

                    const totalQuestions = orderedQuestions.length;
                    const totalAnswered = assignment.responses.length;
                    const overallPct = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

                    const isCompleted = period >= 0 && answeredThisPeriod === periodQuestions.length && periodQuestions.length > 0;
                    const notStarted = period < 0;

                    return (
                        <div
                            key={assignment.id}
                            className="glass-panel"
                            style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `4px solid ${isCompleted ? '#4ade80' : ACCENT}` }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '1.05rem' }}>{campaign.name}</h3>
                                <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: isCompleted ? 'rgba(74,222,128,0.15)' : notStarted ? 'rgba(255,255,255,0.08)' : 'rgba(34,131,255,0.15)', color: isCompleted ? '#4ade80' : notStarted ? 'rgba(255,255,255,0.4)' : '#60a5fa', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                                    {isCompleted ? 'Completado' : notStarted ? 'Por iniciar' : 'Pendiente'}
                                </span>
                            </div>

                            {campaign.description && (
                                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', margin: 0 }}>{campaign.description}</p>
                            )}

                            {!notStarted && deadline && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>
                                    <span>Fecha límite:</span>
                                    <span style={{ color: 'white', fontWeight: 600 }}>{formatDate(deadline)}</span>
                                    <span>·</span>
                                    <span>{answeredThisPeriod}/{periodQuestions.length} este período</span>
                                </div>
                            )}

                            {notStarted && (
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', margin: 0 }}>
                                    Inicia: {formatDate(startDate)}
                                </p>
                            )}

                            {/* Overall progress */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.35rem' }}>
                                    <span>Progreso total</span>
                                    <span>{totalAnswered}/{totalQuestions} preguntas</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', borderRadius: '3px', background: isCompleted ? '#4ade80' : ACCENT, width: `${overallPct}%`, transition: 'width 0.3s' }} />
                                </div>
                            </div>

                            <button
                                onClick={() => openAssignment(assignment)}
                                className="btn-primary"
                                disabled={notStarted}
                                style={{ background: notStarted ? 'rgba(255,255,255,0.08)' : ACCENT, color: notStarted ? 'rgba(255,255,255,0.3)' : 'white', cursor: notStarted ? 'not-allowed' : 'pointer', marginTop: 'auto' }}
                            >
                                {isCompleted ? 'Ver respuestas' : notStarted ? 'Aún no disponible' : 'Responder'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
