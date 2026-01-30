'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import styles from '@/app/strategy/page.module.css';
import KanbanBoard from '@/components/Kanban/KanbanBoard';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import EditableText from '@/components/EditableText';
import { updateInitiative } from '@/app/actions';
import { useModuleTheme } from '@/lib/hooks/useModuleTheme';
import AccessManager from '@/components/Strategy/AccessManager';

import { KanbanStatus } from '@prisma/client';

interface Task {
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE'; // Match KanbanTask
    assigneeId?: string | null;
}

interface Props {
    initiative: {
        id: string;
        title: string;
        keyResult?: {
            statement: string;
        };
        aiExplanation?: string | null;
    };
    tasks: Task[];
    createKanbanTaskAction: (formData: FormData) => Promise<void>;
}

export default function InitiativeClient({ initiative, tasks, createKanbanTaskAction }: Props) {
    const { dict } = useLanguage();
    const theme = useModuleTheme();
    const [isAddOpen, setIsAddOpen] = useState(false);

    return (
        <main className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                <div>
                    <Link href="/strategy/execution" style={{ textDecoration: 'none', color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'inline-block' }}>← {dict.nav.kanban}</Link>
                    <h1 className={styles.header} style={{ marginTop: '0.5rem', fontSize: '2rem' }}>
                        <EditableText
                            initialValue={initiative.title}
                            onSave={async (val) => {
                                const fd = new FormData();
                                fd.append('title', val);
                                await updateInitiative(initiative.id, fd);
                            }}
                        />
                    </h1>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.5rem' }}>
                        {initiative.keyResult && (
                            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', width: 'fit-content' }}>
                                KR: {initiative.keyResult.statement}
                            </span>
                        )}
                        <p style={{ color: 'hsl(var(--text-muted))', margin: 0 }}>{initiative.aiExplanation || 'No AI explanation available.'}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                    <NavBar />
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <AccessManager
                            entityType="initiative"
                            entityId={initiative.id}
                            entityTitle={initiative.title}
                        />
                        <button
                            className="btn-primary"
                            onClick={() => setIsAddOpen(!isAddOpen)}
                            style={{
                                padding: '0.8rem 1.8rem',
                                fontSize: '1rem',
                                fontWeight: 700,
                                background: '#0FB4A8', // Pragma Teal (Solid Hex for safety)
                                color: '#0f172a',      // Dark Navy (Solid Hex for safety)
                                boxShadow: '0 4px 15px rgba(15, 180, 168, 0.4)',
                                border: 'none',
                                position: 'relative',
                                zIndex: 10,
                                cursor: 'pointer'
                            }}
                        >
                            + Add Task
                        </button>
                    </div>
                </div>
            </div>

            {isAddOpen && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <form action={createKanbanTaskAction} style={{ display: 'flex', gap: '1rem' }}>
                        <input type="hidden" name="initiativeId" value={initiative.id} />
                        <input name="title" placeholder="Task title..." required style={{ flex: 1 }} />
                        <button type="submit" className="btn-primary">Add</button>
                    </form>
                </div>
            )}

            <div style={{ flex: 1 }}>
                <KanbanBoard tasks={tasks} initiativeId={initiative.id} />
            </div>
        </main>
    );
}
