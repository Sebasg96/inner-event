'use client';

import React, { useState, useEffect } from 'react';
import styles from './KanbanBoard.module.css';
import { updateKanbanTaskStatus } from '@/app/actions';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// Types
type KanbanTask = {
    id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    assignee?: {
        name: string;
        email: string;
    } | null;
};

type Column = {
    id: 'todo' | 'doing' | 'done';
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
};

const COLUMNS: Column[] = [
    { id: 'todo', status: 'TODO' },
    { id: 'doing', status: 'IN_PROGRESS' },
    { id: 'done', status: 'DONE' },
];

export default function KanbanBoard({ tasks: initialTasks, initiativeId }: { tasks: KanbanTask[], initiativeId: string }) {
    // We use optimistic updates for immediate UI feedback
    const [tasks, setTasks] = useState(initialTasks);

    // Sync with server updates
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const { dict } = useLanguage();

    const getTasksByStatus = (status: string) => {
        return tasks.filter(t => t.status === status);
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');

        // Optimistic Update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));

        // Server Action
        await updateKanbanTaskStatus(id, status, initiativeId);
    };

    return (
        <div className={styles.board}>
            {COLUMNS.map(col => (
                <div
                    key={col.id}
                    className={styles.column}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.status)}
                >
                    <div className={styles.columnHeader}>
                        {dict.kanban[col.id]}
                        <span>{getTasksByStatus(col.status).length}</span>
                    </div>
                    <div className={styles.cardList}>
                        {getTasksByStatus(col.status).map(task => (
                            <div
                                key={task.id}
                                className={styles.card}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                            >
                                <div className={styles.cardTitle}>{task.title}</div>
                                <div className={styles.cardFooter}>
                                    <div className={styles.teamAvatars}>
                                        {task.assignee && (
                                            <div
                                                className={styles.avatar}
                                                style={{ background: 'var(--accent)' }}
                                                title={task.assignee.name}
                                            >
                                                {task.assignee.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
