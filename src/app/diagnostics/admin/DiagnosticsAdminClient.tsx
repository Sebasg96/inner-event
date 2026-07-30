'use client';

import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import {
    createDiagnosticCampaign,
    deleteDiagnosticCampaign,
    updateDiagnosticCampaign,
    createDiagnosticQuestion,
    updateDiagnosticQuestion,
    deleteDiagnosticQuestion,
    addQuestionToCampaign,
    removeQuestionFromCampaign,
    reorderCampaignQuestions,
    assignUsersToCampaign,
    removeUserFromCampaign,
} from '@/app/actions';
import styles from '@/app/strategy/page.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type QuestionType = 'TEXT' | 'YES_NO' | 'RATING' | 'MULTIPLE_CHOICE';
type Frequency = 'DAILY' | 'WEEKLY';

interface DiagnosticQuestion {
    id: string;
    text: string;
    type: QuestionType;
    category: string | null;
    templateSet: string | null;
    options: string | null;
}

interface Assignment {
    id: string;
    userId: string;
    user: { id: string; name: string; email: string; jobTitle: string | null; area: string | null };
    responses: { id: string; questionId: string }[];
}

interface Campaign {
    id: string;
    name: string;
    description: string | null;
    frequency: Frequency;
    questionsPerPeriod: number;
    startDate: string | Date;
    endDate: string | Date | null;
    isActive: boolean;
    questions: { order: number; question: DiagnosticQuestion }[];
    assignments: Assignment[];
}

interface TenantUser {
    id: string;
    name: string;
    email: string;
    jobTitle: string | null;
    area: string | null;
}

interface Props {
    initialCampaigns: Campaign[];
    initialQuestions: DiagnosticQuestion[];
    tenantUsers: TenantUser[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCENT = 'hsl(var(--secondary))';

function periodLabel(frequency: Frequency) {
    return frequency === 'DAILY' ? 'día' : 'semana';
}

function completionPct(assignment: Assignment, totalQuestions: number) {
    if (totalQuestions === 0) return 0;
    return Math.round((assignment.responses.length / totalQuestions) * 100);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DiagnosticsAdminClient({ initialCampaigns, initialQuestions, tenantUsers }: Props) {
    const [tab, setTab] = useState<'campaigns' | 'questions'>('campaigns');
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [campaignTab, setCampaignTab] = useState<'questions' | 'users' | 'responses'>('questions');

    // Create campaign form
    const [showCreateCampaign, setShowCreateCampaign] = useState(false);
    const [campaignLoading, setCampaignLoading] = useState(false);

    // Create / edit question form
    const [showCreateQuestion, setShowCreateQuestion] = useState(false);
    const [questionLoading, setQuestionLoading] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

    const [campaigns, setCampaigns] = useState(initialCampaigns);
    const [questions, setQuestions] = useState(initialQuestions);

    // ── Campaign CRUD ──

    async function handleCreateCampaign(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setCampaignLoading(true);
        try {
            await createDiagnosticCampaign(new FormData(e.currentTarget));
            window.location.reload();
        } finally {
            setCampaignLoading(false);
        }
    }

    async function handleDeleteCampaign(id: string) {
        if (!confirm('¿Eliminar esta campaña? Se borrarán todas las asignaciones y respuestas.')) return;
        await deleteDiagnosticCampaign(id);
        setCampaigns(campaigns.filter(c => c.id !== id));
        if (selectedCampaign?.id === id) setSelectedCampaign(null);
    }

    async function handleToggleActive(campaign: Campaign) {
        const fd = new FormData();
        fd.set('name', campaign.name);
        fd.set('description', campaign.description ?? '');
        fd.set('frequency', campaign.frequency);
        fd.set('questionsPerPeriod', String(campaign.questionsPerPeriod));
        fd.set('startDate', new Date(campaign.startDate).toISOString().split('T')[0]);
        if (campaign.endDate) fd.set('endDate', new Date(campaign.endDate).toISOString().split('T')[0]);
        fd.set('isActive', String(!campaign.isActive));
        await updateDiagnosticCampaign(campaign.id, fd);
        setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, isActive: !c.isActive } : c));
        if (selectedCampaign?.id === campaign.id) setSelectedCampaign(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
    }

    // ── Question CRUD ──

    async function handleCreateQuestion(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setQuestionLoading(true);
        try {
            await createDiagnosticQuestion(new FormData(e.currentTarget));
            window.location.reload();
        } finally {
            setQuestionLoading(false);
        }
    }

    async function handleUpdateQuestion(questionId: string, e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setQuestionLoading(true);
        try {
            await updateDiagnosticQuestion(questionId, new FormData(e.currentTarget));
            setEditingQuestionId(null);
            window.location.reload();
        } finally {
            setQuestionLoading(false);
        }
    }

    async function handleDeleteQuestion(id: string) {
        if (!confirm('¿Eliminar esta pregunta?')) return;
        await deleteDiagnosticQuestion(id);
        setQuestions(questions.filter(q => q.id !== id));
    }

    // ── Campaign ↔ Question ──

    async function handleAddQuestion(questionId: string) {
        if (!selectedCampaign) return;
        const order = selectedCampaign.questions.length;
        await addQuestionToCampaign(selectedCampaign.id, questionId, order);
        window.location.reload();
    }

    async function handleRemoveQuestion(questionId: string) {
        if (!selectedCampaign) return;
        await removeQuestionFromCampaign(selectedCampaign.id, questionId);
        window.location.reload();
    }

    async function handleMoveQuestion(index: number, direction: 'up' | 'down') {
        if (!selectedCampaign) return;
        const qs = [...selectedCampaign.questions];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= qs.length) return;

        // Swap in local state immediately
        [qs[index], qs[swapIndex]] = [qs[swapIndex], qs[index]];
        setSelectedCampaign({ ...selectedCampaign, questions: qs });

        // Persist new order
        await reorderCampaignQuestions(
            selectedCampaign.id,
            qs.map(cq => cq.question.id)
        );
    }

    // ── Assignments ──

    async function handleAssignUser(userId: string) {
        if (!selectedCampaign) return;
        await assignUsersToCampaign(selectedCampaign.id, [userId]);
        window.location.reload();
    }

    async function handleRemoveUser(userId: string) {
        if (!selectedCampaign) return;
        if (!confirm('¿Retirar este usuario de la campaña?')) return;
        await removeUserFromCampaign(selectedCampaign.id, userId);
        window.location.reload();
    }

    const assignedUserIds = new Set(selectedCampaign?.assignments.map(a => a.userId) ?? []);
    const campaignQuestionIds = new Set(selectedCampaign?.questions.map(q => q.question.id) ?? []);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: ACCENT, margin: 0 }}>
                        Diagnóstico Organizacional
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Administración de campañas y preguntas
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <a href="/diagnostics" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textDecoration: 'none' }}>
                        Vista Usuario →
                    </a>
                    <NavBar />
                </div>
            </div>

            {/* Top-level tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {(['campaigns', 'questions'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => { setTab(t); setSelectedCampaign(null); }}
                        className="btn-primary"
                        style={{
                            background: tab === t ? ACCENT : 'rgba(255,255,255,0.08)',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1.25rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: tab === t ? 600 : 400,
                        }}
                    >
                        {t === 'campaigns' ? 'Campañas' : 'Banco de Preguntas'}
                    </button>
                ))}
            </div>

            {/* ── CAMPAIGNS TAB ── */}
            {tab === 'campaigns' && !selectedCampaign && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button className="btn-primary" style={{ background: ACCENT }} onClick={() => setShowCreateCampaign(v => !v)}>
                            {showCreateCampaign ? 'Cancelar' : '+ Nueva Campaña'}
                        </button>
                    </div>

                    {showCreateCampaign && (
                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderTop: `4px solid ${ACCENT}` }}>
                            <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Crear Campaña de Diagnóstico</h2>
                            <form onSubmit={handleCreateCampaign} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Nombre *</label>
                                    <input name="name" required placeholder="Ej: Diagnóstico Cultural Q3 2026" />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Descripción</label>
                                    <input name="description" placeholder="Descripción opcional" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Frecuencia</label>
                                    <select name="frequency" style={{ background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.5rem' }}>
                                        <option value="WEEKLY" style={{ background: '#1e293b', color: 'white' }}>Semanal</option>
                                        <option value="DAILY" style={{ background: '#1e293b', color: 'white' }}>Diaria</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Preguntas por período</label>
                                    <input name="questionsPerPeriod" type="number" min={1} max={50} defaultValue={5} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Fecha de inicio *</label>
                                    <input name="startDate" type="date" required />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Fecha de fin (opcional)</label>
                                    <input name="endDate" type="date" />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="btn-primary" style={{ background: ACCENT }} disabled={campaignLoading}>
                                        {campaignLoading ? 'Creando...' : 'Crear Campaña'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {campaigns.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.5)' }}>
                                No hay campañas creadas. Crea la primera campaña de diagnóstico.
                            </div>
                        )}
                        {campaigns.map(campaign => {
                            const totalAssigned = campaign.assignments.length;
                            const totalQs = campaign.questions.length;
                            const completed = campaign.assignments.filter(a => a.responses.length === totalQs && totalQs > 0).length;
                            return (
                                <div key={campaign.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${campaign.isActive ? ACCENT : 'rgba(255,255,255,0.2)'}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '0.25rem' }}>{campaign.name}</h3>
                                            {campaign.description && (
                                                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>{campaign.description}</p>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: campaign.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)', color: campaign.isActive ? '#4ade80' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                                            {campaign.isActive ? 'Activa' : 'Pausada'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                                        <span>{totalQs} preguntas</span>
                                        <span>·</span>
                                        <span>{campaign.questionsPerPeriod} / {periodLabel(campaign.frequency)}</span>
                                        <span>·</span>
                                        <span>{totalAssigned} usuarios</span>
                                    </div>

                                    {totalAssigned > 0 && (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                                                <span>Progreso general</span>
                                                <span>{completed}/{totalAssigned} completados</span>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                                                <div style={{ height: '100%', borderRadius: '3px', background: ACCENT, width: totalAssigned > 0 ? `${Math.round((completed / totalAssigned) * 100)}%` : '0%', transition: 'width 0.3s' }} />
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <button
                                            className="btn-primary"
                                            style={{ flex: 1, background: ACCENT, fontSize: '0.85rem', padding: '0.4rem' }}
                                            onClick={() => setSelectedCampaign(campaign)}
                                        >
                                            Administrar
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(campaign)}
                                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            {campaign.isActive ? 'Pausar' : 'Activar'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCampaign(campaign.id)}
                                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── CAMPAIGN DETAIL ── */}
            {tab === 'campaigns' && selectedCampaign && (
                <div>
                    <button onClick={() => setSelectedCampaign(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                        ← Volver a campañas
                    </button>

                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h2 style={{ color: 'white', fontWeight: 700, marginBottom: '0.25rem' }}>{selectedCampaign.name}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
                            {selectedCampaign.questionsPerPeriod} preguntas por {periodLabel(selectedCampaign.frequency)} · {selectedCampaign.assignments.length} usuarios asignados · {selectedCampaign.questions.length} preguntas totales
                        </p>
                    </div>

                    {/* Sub-tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {(['questions', 'users', 'responses'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setCampaignTab(t)}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: campaignTab === t ? 600 : 400, background: campaignTab === t ? ACCENT : 'rgba(255,255,255,0.08)', color: 'white' }}
                            >
                                {t === 'questions' ? `Preguntas (${selectedCampaign.questions.length})` : t === 'users' ? `Usuarios (${selectedCampaign.assignments.length})` : 'Respuestas'}
                            </button>
                        ))}
                    </div>

                    {/* Sub-tab: Questions */}
                    {campaignTab === 'questions' && (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <h3 style={{ color: 'white', marginBottom: '1rem' }}>Preguntas en esta campaña</h3>
                                {selectedCampaign.questions.length === 0 && (
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Sin preguntas añadidas aún.</p>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {selectedCampaign.questions.map((cq, i) => (
                                        <div key={cq.question.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                            {/* Order controls */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <button
                                                    onClick={() => handleMoveQuestion(i, 'up')}
                                                    disabled={i === 0}
                                                    title="Mover arriba"
                                                    style={{ background: 'none', border: 'none', color: i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', cursor: i === 0 ? 'default' : 'pointer', fontSize: '0.75rem', lineHeight: 1, padding: '2px 4px' }}
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    onClick={() => handleMoveQuestion(i, 'down')}
                                                    disabled={i === selectedCampaign.questions.length - 1}
                                                    title="Mover abajo"
                                                    style={{ background: 'none', border: 'none', color: i === selectedCampaign.questions.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', cursor: i === selectedCampaign.questions.length - 1 ? 'default' : 'pointer', fontSize: '0.75rem', lineHeight: 1, padding: '2px 4px' }}
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                            <span style={{ color: ACCENT, fontWeight: 700, minWidth: '1.5rem' }}>{i + 1}</span>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: 'white', margin: 0 }}>{cq.question.text}</p>
                                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{cq.question.type} {cq.question.category ? `· ${cq.question.category}` : ''}</span>
                                            </div>
                                            <button onClick={() => handleRemoveQuestion(cq.question.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                Quitar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <h3 style={{ color: 'white', marginBottom: '1rem' }}>Añadir del banco de preguntas</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {questions.filter(q => !campaignQuestionIds.has(q.id)).map(q => (
                                        <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.9rem' }}>{q.text}</p>
                                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{q.type} {q.category ? `· ${q.category}` : ''} {q.templateSet ? `· ${q.templateSet}` : ''}</span>
                                            </div>
                                            <button onClick={() => handleAddQuestion(q.id)} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                + Añadir
                                            </button>
                                        </div>
                                    ))}
                                    {questions.filter(q => !campaignQuestionIds.has(q.id)).length === 0 && (
                                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>
                                            Todas las preguntas del banco ya están en esta campaña.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sub-tab: Users */}
                    {campaignTab === 'users' && (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <h3 style={{ color: 'white', marginBottom: '1rem' }}>Usuarios asignados</h3>
                                {selectedCampaign.assignments.length === 0 && (
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Sin usuarios asignados aún.</p>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {selectedCampaign.assignments.map(a => {
                                        const pct = completionPct(a, selectedCampaign.questions.length);
                                        return (
                                            <div key={a.userId} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ color: 'white', margin: 0, fontWeight: 600 }}>{a.user.name}</p>
                                                    <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: '0.8rem' }}>{a.user.email} {a.user.area ? `· ${a.user.area}` : ''}</p>
                                                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                                                            <div style={{ height: '100%', borderRadius: '3px', background: ACCENT, width: `${pct}%` }} />
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{a.responses.length}/{selectedCampaign.questions.length} resp.</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemoveUser(a.userId)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    Retirar
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <h3 style={{ color: 'white', marginBottom: '1rem' }}>Asignar usuarios</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {tenantUsers.filter(u => !assignedUserIds.has(u.id)).map(u => (
                                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.9rem' }}>{u.name}</p>
                                                <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: '0.75rem' }}>{u.email} {u.area ? `· ${u.area}` : ''}</p>
                                            </div>
                                            <button onClick={() => handleAssignUser(u.id)} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                Asignar
                                            </button>
                                        </div>
                                    ))}
                                    {tenantUsers.filter(u => !assignedUserIds.has(u.id)).length === 0 && (
                                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Todos los usuarios ya están asignados.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sub-tab: Responses */}
                    {campaignTab === 'responses' && (
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Respuestas por usuario</h3>
                            {selectedCampaign.assignments.length === 0 && (
                                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Sin usuarios asignados.</p>
                            )}
                            {selectedCampaign.assignments.map(a => (
                                <div key={a.userId} style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ color: ACCENT, marginBottom: '0.75rem' }}>{a.user.name}</h4>
                                    {a.responses.length === 0 && (
                                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Sin respuestas aún.</p>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {a.responses.map(r => {
                                            const q = selectedCampaign.questions.find(cq => cq.question.id === r.questionId)?.question;
                                            return (
                                                <div key={r.id} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', borderLeft: `3px solid ${ACCENT}` }}>
                                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>{q?.text ?? 'Pregunta eliminada'}</p>
                                                    <p style={{ color: 'white', fontWeight: 600, margin: '0.4rem 0 0' }}>{r.answer}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── QUESTIONS TAB ── */}
            {tab === 'questions' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button className="btn-primary" style={{ background: ACCENT }} onClick={() => setShowCreateQuestion(v => !v)}>
                            {showCreateQuestion ? 'Cancelar' : '+ Nueva Pregunta'}
                        </button>
                    </div>

                    {showCreateQuestion && (
                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderTop: `4px solid ${ACCENT}` }}>
                            <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Crear Pregunta</h2>
                            <form onSubmit={handleCreateQuestion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Texto de la pregunta *</label>
                                    <input name="text" required placeholder="Ej: ¿Cómo evaluarías el liderazgo en tu área?" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Tipo</label>
                                    <select name="type" style={{ background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.5rem' }}>
                                        <option value="TEXT" style={{ background: '#1e293b', color: 'white' }}>Texto libre</option>
                                        <option value="YES_NO" style={{ background: '#1e293b', color: 'white' }}>Sí / No</option>
                                        <option value="RATING" style={{ background: '#1e293b', color: 'white' }}>Calificación (1-5)</option>
                                        <option value="MULTIPLE_CHOICE" style={{ background: '#1e293b', color: 'white' }}>Opción múltiple</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Categoría</label>
                                    <input name="category" placeholder="Ej: Liderazgo, Cultura, Comunicación" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Set / Plantilla</label>
                                    <input name="templateSet" placeholder="Ej: Diagnóstico Cultural, ONGs" />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Opciones (solo para opción múltiple, separar con |)</label>
                                    <input name="options" placeholder="Ej: Siempre|Casi siempre|A veces|Nunca" />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="btn-primary" style={{ background: ACCENT }} disabled={questionLoading}>
                                        {questionLoading ? 'Guardando...' : 'Guardar Pregunta'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Group by templateSet */}
                    {(() => {
                        const grouped: Record<string, DiagnosticQuestion[]> = {};
                        questions.forEach(q => {
                            const key = q.templateSet ?? 'Sin set';
                            if (!grouped[key]) grouped[key] = [];
                            grouped[key].push(q);
                        });
                        return Object.entries(grouped).map(([set, qs]) => (
                            <div key={set} style={{ marginBottom: '2rem' }}>
                                <h3 style={{ color: ACCENT, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>{set}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {qs.map(q => (
                                        <div key={q.id} className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
                                            {editingQuestionId === q.id ? (
                                                /* ── Inline edit form ── */
                                                <form onSubmit={e => handleUpdateQuestion(q.id, e)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Texto *</label>
                                                        <input name="text" required defaultValue={q.text} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Tipo</label>
                                                        <select name="type" defaultValue={q.type} style={{ background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.5rem' }}>
                                                            <option value="TEXT" style={{ background: '#1e293b', color: 'white' }}>Texto libre</option>
                                                            <option value="YES_NO" style={{ background: '#1e293b', color: 'white' }}>Sí / No</option>
                                                            <option value="RATING" style={{ background: '#1e293b', color: 'white' }}>Calificación (1-5)</option>
                                                            <option value="MULTIPLE_CHOICE" style={{ background: '#1e293b', color: 'white' }}>Opción múltiple</option>
                                                        </select>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Categoría</label>
                                                        <input name="category" defaultValue={q.category ?? ''} placeholder="Ej: Liderazgo" />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Set / Plantilla</label>
                                                        <input name="templateSet" defaultValue={q.templateSet ?? ''} placeholder="Ej: Diagnóstico Cultural" />
                                                    </div>
                                                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                        <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Opciones (separar con |)</label>
                                                        <input name="options" defaultValue={q.options ?? ''} placeholder="Ej: Siempre|Casi siempre|A veces|Nunca" />
                                                    </div>
                                                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button type="button" onClick={() => setEditingQuestionId(null)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px', padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                            Cancelar
                                                        </button>
                                                        <button type="submit" disabled={questionLoading} style={{ background: ACCENT, border: 'none', color: 'white', borderRadius: '6px', padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                                                            {questionLoading ? 'Guardando...' : 'Guardar'}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                /* ── Read-only row ── */
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ color: 'white', margin: 0 }}>{q.text}</p>
                                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{q.type}</span>
                                                            {q.category && <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{q.category}</span>}
                                                            {q.templateSet && <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>{q.templateSet}</span>}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setEditingQuestionId(q.id)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                        Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}

                    {questions.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)' }}>
                            No hay preguntas en el banco. Añade la primera.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
