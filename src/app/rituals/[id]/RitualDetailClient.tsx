'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import styles from '../Rituals.module.css';
import { updateRitual, createRitualCommitment, toggleRitualCommitmentStatus, deleteRitualCommitment, addRitualParticipant, removeRitualParticipant, updateRitualStatus, importOffTrackKRsToRitual } from '@/app/actions';
import EditableText from '@/components/EditableText';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';

interface Ritual {
    id: string;
    name: string;
    date: Date | string;
    description: string | null;
    discussionPoints: string | null;
    aiSuggestions: string | null;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
    participants: { id: string; user: { id: string; name: string; email: string; } }[];
    commitments: {
        id: string;
        description: string;
        status: 'PENDING' | 'COMPLETED';
        dueDate: Date | string | null;
        owner: { id: string; name: string; } | null;
    }[];
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface OkrSummary {
    totalObjectives: number;
    totalKRs: number;
    avgProgress: string;
}

interface Props {
    ritual: Ritual;
    okrSummary: OkrSummary;
    users: User[];
}

export default function RitualDetailClient({ ritual, okrSummary, users }: Props) {
    const [isThinking, setIsThinking] = useState(false);
    const [aiAdvice, setAiAdvice] = useState<string | null>(ritual.aiSuggestions || null);
    const [aiError, setAiError] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleConsultAI = async () => {
        setIsThinking(true);
        setAiError(null);
        try {
            // Mock AI Call for now (or real if endpoint exists)
            // In a real scenario, we'd pass the OKR summary to the LLM
            const res = await fetch('/api/ai/refine-text', {
                method: 'POST',
                body: JSON.stringify({
                    text: `Contexto: ${ritual.description}. Participantes: ${ritual.participants.length}. OKRs: ${JSON.stringify(okrSummary)}`,
                    type: 'ritual_consultant'
                })
            });
            if (!res.ok) throw new Error('Falló el análisis de la IA');
            const data = await res.json();
            setAiAdvice(data.suggestion);

            // Save automatically
            const formData = new FormData();
            formData.append('aiSuggestions', data.suggestion);
            formData.append('discussionPoints', ritual.discussionPoints || '');
            await updateRitual(ritual.id, formData);
        } catch (e: any) {
            console.error(e);
            setAiError(e.message || 'Error conectando con la IA');
        } finally {
            setIsThinking(false);
        }
    };

    const handleToggleStatus = async () => {
        const nextStatus = ritual.status === 'SCHEDULED' ? 'IN_PROGRESS' : ritual.status === 'IN_PROGRESS' ? 'COMPLETED' : 'SCHEDULED';
        await updateRitualStatus(ritual.id, nextStatus);
    };

    const handleExportPDF = async () => {
        if (!printRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Acta_Ritual_${ritual.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error(error);
            alert("Error al generar PDF");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={`glass-panel ${styles.headerContainer}`} style={{ gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 auto', minWidth: 0 }}>
                    <Link href="/rituals" style={{ fontSize: '1.5rem', textDecoration: 'none', flexShrink: 0 }}>⬅️</Link>
                    <h1 className={styles.headerTitle} style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ritual.name}>{ritual.name}</h1>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <span suppressHydrationWarning style={{
                            fontSize: '1rem',
                            padding: '0.25rem 0.75rem',
                            background: 'hsl(var(--bg-app))',
                            color: 'white',
                            borderRadius: '12px',
                            border: '1px solid hsl(var(--border-glass))',
                            whiteSpace: 'nowrap'
                        }}>
                            {new Date(ritual.date).toLocaleDateString()}
                        </span>
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.85rem',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            background: ritual.status === 'COMPLETED' ? 'hsl(var(--success))' : ritual.status === 'IN_PROGRESS' ? 'hsl(var(--warning))' : 'hsl(var(--bg-app))',
                            color: ritual.status === 'SCHEDULED' ? 'white' : '#1e293b',
                            borderRadius: '16px',
                            border: '1px solid hsl(var(--border-glass))',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }} onClick={handleToggleStatus} title="Haz clic para cambiar el estado">
                            {ritual.status === 'SCHEDULED' ? 'PROGRAMADO' : ritual.status === 'IN_PROGRESS' ? 'EN CURSO' : 'COMPLETADO'}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid hsl(var(--border-glass))',
                            color: 'white',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        {isExporting ? 'Generando...' : '📄 Exportar a PDF'}
                    </button>
                    <NavBar />
                </div>
            </div>

            <div className={styles.detailGrid}>

                {/* Main Content: Discussion & Commitments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Discussion Points */}
                    <section className="glass-panel" style={{ padding: '2rem' }}>
                        <h2 style={{ color: 'white', marginBottom: '1rem', borderBottom: '2px solid hsl(var(--accent))', paddingBottom: '0.5rem' }}>
                            🗣️ Puntos Tratados
                        </h2>
                        <EditableText
                            initialValue={ritual.discussionPoints || ''}
                            renderValue={(val) => (
                                <div className="markdown-container" style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>
                                    <ReactMarkdown>{val}</ReactMarkdown>
                                </div>
                            )}
                            onSave={async (val) => {
                                const formData = new FormData();
                                formData.append('discussionPoints', val);
                                formData.append('aiSuggestions', aiAdvice || '');
                                await updateRitual(ritual.id, formData);
                            }}
                            multiline={true}
                            placeholder="Registra aquí los temas discutidos en la sesión..."
                            style={{ minHeight: '150px', fontSize: '1.1rem' }}
                        />
                    </section>

                    {/* Structured Commitments */}
                    <section className="glass-panel" style={{ padding: '2rem' }}>
                        <h2 style={{ color: 'white', marginBottom: '1rem', borderBottom: '2px solid hsl(var(--success))', paddingBottom: '0.5rem' }}>
                            🤝 Compromisos
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {ritual.commitments?.length === 0 ? (
                                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>No hay compromisos registrados.</p>
                            ) : (
                                ritual.commitments?.map(c => (
                                    <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'hsl(var(--bg-surface) / 0.5)', borderRadius: '8px', borderLeft: c.status === 'COMPLETED' ? '4px solid hsl(var(--success))' : '4px solid hsl(var(--warning))' }}>
                                        <input
                                            type="checkbox"
                                            checked={c.status === 'COMPLETED'}
                                            onChange={(e) => toggleRitualCommitmentStatus(c.id, e.target.checked, ritual.id)}
                                            style={{ marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, textDecoration: c.status === 'COMPLETED' ? 'line-through' : 'none', color: c.status === 'COMPLETED' ? 'rgba(255, 255, 255, 0.5)' : '#ffffff' }}>
                                                {c.description}
                                            </p>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.5rem' }}>
                                                {c.owner && <span>👤 Resp: {c.owner.name}</span>}
                                                {c.dueDate && <span suppressHydrationWarning>📅 Vence: {new Date(c.dueDate).toLocaleDateString()}</span>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteRitualCommitment(c.id, ritual.id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                                            title="Eliminar compromiso"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Commitment Form */}
                        <form action={createRitualCommitment} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start', background: 'hsl(var(--bg-app) / 0.3)', padding: '1rem', borderRadius: '8px' }}>
                            <input type="hidden" name="ritualId" value={ritual.id} />
                            <input
                                name="description"
                                placeholder="Nuevo compromiso..."
                                required
                                style={{ flex: '1 1 200px', padding: '0.5rem', borderRadius: '4px', border: '1px solid hsl(var(--border-glass))', background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff' }}
                            />
                            <select
                                name="ownerId"
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid hsl(var(--border-glass))', background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff' }}
                            >
                                <option value="" style={{ color: '#000' }}>Sin responsable</option>
                                {users.map(u => <option key={u.id} value={u.id} style={{ color: '#000' }}>{u.name}</option>)}
                            </select>
                            <input
                                name="dueDate"
                                type="date"
                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid hsl(var(--border-glass))', background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff' }}
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Añadir</button>
                        </form>
                    </section>
                </div>

                {/* Sidebar: AI & Context */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* AI Consultant */}
                    <section className="glass-panel" style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
                        border: '1px solid rgba(15, 180, 168, 0.2)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>✨</span> Asistente IA
                            </h3>
                            {aiAdvice && (
                                <button
                                    onClick={handleConsultAI}
                                    disabled={isThinking}
                                    className="btn-primary"
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                >
                                    {isThinking ? 'Analizando...' : 'Re-analizar OKRs'}
                                </button>
                            )}
                        </div>

                        {aiError && (
                            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                ⚠️ {aiError}
                            </div>
                        )}

                        {aiAdvice ? (
                            <div style={{
                                fontSize: '0.95rem',
                                color: 'rgba(255, 255, 255, 0.9)',
                                lineHeight: '1.6',
                                padding: '1rem',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {aiAdvice}
                            </div>
                        ) : (
                            <div style={{
                                padding: '1.5rem 1rem',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'rgba(15, 180, 168, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    boxShadow: '0 0 20px rgba(15, 180, 168, 0.2)'
                                }}>
                                    🎯
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'white', fontWeight: 600, fontSize: '1.05rem' }}>Descubre temas clave</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.5' }}>
                                        La IA analizará el estado de los OKRs de los participantes para sugerirte puntos estratégicos importantes para esta sesión.
                                    </p>
                                </div>
                                <button
                                    onClick={handleConsultAI}
                                    disabled={isThinking}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '0.6rem' }}
                                >
                                    {isThinking ? 'Analizando OKRs...' : 'Generar Sugerencias'}
                                </button>
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                📊 Integración Estratégica
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1rem' }}>
                                Importa los KRs que requieren atención inmediata directamente a los puntos tratados.
                            </p>
                            <button
                                onClick={async () => {
                                    if (confirm('¿Deseas importar los KRs en riesgo a la agenda de este ritual?')) {
                                        const res = await importOffTrackKRsToRitual(ritual.id);
                                        if (res.success) alert(`Se importaron ${res.count} temas nuevos.`);
                                        else if (res.message) alert(res.message);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#fca5a5',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 700
                                }}
                            >
                                ⚡ Importar KRs en Riesgo
                            </button>
                        </div>
                    </section>

                    {/* Participants */}
                    <section className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ color: 'white', marginBottom: '1rem' }}>👥 Participantes</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            {ritual.participants.length > 0 ? (
                                <ul style={{ paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {ritual.participants.map((p) => (
                                        <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem', borderRadius: '4px', color: 'white', fontSize: '0.9rem' }}>
                                            <span>{p.user.name}</span>
                                            <button
                                                onClick={() => removeRitualParticipant(ritual.id, p.user.id)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                                                title="Eliminar participante"
                                            >✕</button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>Sin participantes registrados.</p>
                            )}
                        </div>

                        {/* Add Participant Form */}
                        <form action={async (formData) => {
                            const userId = formData.get('userId') as string;
                            if (userId) await addRitualParticipant(ritual.id, userId);
                        }} style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                name="userId"
                                required
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid hsl(var(--border-glass))', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                            >
                                <option value="" style={{ color: '#000' }}>Seleccionar participante...</option>
                                {users.filter(u => !ritual.participants.find(p => p.user.id === u.id)).map(u => (
                                    <option key={u.id} value={u.id} style={{ color: '#000' }}>{u.name}</option>
                                ))}
                            </select>
                            <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>+</button>
                        </form>
                    </section>

                </div>
            </div>

            {/* Hidden Print Document */}
            <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '800px' }}>
                <div ref={printRef} style={{ padding: '3rem', background: 'white', color: '#1e293b', fontFamily: 'sans-serif' }}>
                    {/* Header with Logo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #0FB4A8', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
                        <div>
                            <img
                                src="/report-logo.png"
                                alt="Pragma"
                                style={{ height: '50px', marginBottom: '1rem', objectFit: 'contain' }}
                                onError={(e) => {
                                    e.currentTarget.src = "/pragma-logo.png";
                                    e.currentTarget.style.height = '50px';
                                }}
                            />
                            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Acta de Ritual</h1>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 500, margin: 0, color: '#0FB4A8' }}>{ritual.name}</h2>
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha de la Sesión</div>
                            <div suppressHydrationWarning style={{ fontSize: '1.2rem', fontWeight: 600, color: '#334155' }}>{new Date(ritual.date).toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Meta info (Status and Participants Count) */}
                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #0FB4A8' }}>
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block' }}>Estado</span>
                            <strong style={{ color: '#0f172a' }}>{ritual.status === 'COMPLETED' ? 'Completado' : ritual.status === 'SCHEDULED' ? 'Programado' : 'En Progreso'}</strong>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block' }}>Participantes Asistentes</span>
                            <strong style={{ color: '#0f172a' }}>{ritual.participants.length}</strong>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block' }}>Total Compromisos</span>
                            <strong style={{ color: '#0f172a' }}>{ritual.commitments?.length || 0}</strong>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ borderBottom: '1px solid #e2e8f0', color: '#0FB4A8', paddingBottom: '0.5rem', fontSize: '1.3rem' }}>Puntos Tratados</h3>
                        <div style={{ lineHeight: '1.7', marginTop: '1rem', color: '#334155', fontSize: '1.05rem' }}>
                            <ReactMarkdown>{ritual.discussionPoints || 'Sin registro de puntos tratados.'}</ReactMarkdown>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ borderBottom: '1px solid #e2e8f0', color: '#0FB4A8', paddingBottom: '0.5rem', fontSize: '1.3rem' }}>Compromisos</h3>
                        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: '1.7', color: '#334155', fontSize: '1.05rem' }}>
                            {ritual.commitments?.map(c => (
                                <li key={c.id} style={{ marginBottom: '1.2rem' }}>
                                    <strong style={{ color: '#0f172a' }}>{c.description}</strong> - <span>{c.status === 'COMPLETED' ? '✅ Completado' : '⏳ Pendiente'}</span>
                                    <br />
                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                        {c.owner ? `Responsable: ${c.owner.name}` : 'Sin responsable'}
                                        {c.dueDate ? <span suppressHydrationWarning> | Vence: {new Date(c.dueDate).toLocaleDateString()}</span> : ''}
                                    </span>
                                </li>
                            ))}
                            {ritual.commitments?.length === 0 && <li>No hay compromisos registrados.</li>}
                        </ul>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ borderBottom: '1px solid #e2e8f0', color: '#0FB4A8', paddingBottom: '0.5rem', fontSize: '1.3rem' }}>Participantes</h3>
                        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', color: '#334155', fontSize: '1.05rem', lineHeight: '1.7' }}>
                            {ritual.participants.map(p => (
                                <li key={p.id} style={{ marginBottom: '0.35rem' }}><strong>{p.user.name}</strong> ({p.user.email})</li>
                            ))}
                            {ritual.participants.length === 0 && <li>Sin participantes registrados.</li>}
                        </ul>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '4rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                        Documento generado automáticamente por Inner Event Platform
                    </div>
                </div>
            </div>
        </div>
    );
}
