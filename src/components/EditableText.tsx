'use client';

import React, { useState, useEffect, useRef } from 'react';
import PrismaAvatar from '@/components/PrismaAvatar';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Props = {
    initialValue: string;
    onSave: (value: string) => Promise<void>;
    className?: string;
    multiline?: boolean;
    style?: React.CSSProperties;
    placeholder?: string;
};

export default function EditableText({ initialValue, onSave, className, multiline, style, placeholder }: Props) {
    const { locale } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const [isSaving, setIsSaving] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [reasoning, setReasoning] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const handleAskAI = async () => {
        if (!value) return;
        setIsLoadingAI(true);
        try {
            const res = await fetch('/api/ai/refine-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: value,
                    type: 'general',
                    language: locale // Pass current language
                })
            });
            const data = await res.json();
            if (data.suggestion) {
                setSuggestion(data.suggestion);
                setReasoning(data.reasoning);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingAI(false);
        }
    };

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (value === initialValue) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await onSave(value);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save", error);
            // Optionally revert or show error
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            handleSave();
        }
        if (e.key === 'Escape') {
            setValue(initialValue);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        if (multiline) {
            return (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className={className}
                    style={{ ...style, width: '100%', minHeight: '60px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                    disabled={isSaving}
                />
            );
        }
        return (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={className}
                style={{ ...style, width: '100%', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                disabled={isSaving}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`${className} editable-text-display group`}
            style={{
                ...style,
                cursor: 'pointer',
                border: '1px solid transparent',
                borderRadius: '4px',
                padding: '2px 4px',
                transition: 'background 0.2s',
                minWidth: '20px'
            }}
            title="Click to edit"
        >
            {value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{placeholder || 'Empty...'}</span>}
            {isSaving && <span style={{ marginLeft: '8px', fontSize: '0.8em' }}>💾</span>}

            {/* AI Guide Trigger */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    handleAskAI();
                }}
                className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity transform duration-200"
                style={{ cursor: 'pointer' }}
                title="Sugerencia IA"
            >
                <PrismaAvatar size={24} emotion={isLoadingAI ? 'thinking' : 'happy'} />
            </div>

            {/* AI Suggestion Popover */}
            {suggestion && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 100,
                    background: 'white',
                    border: '1px solid var(--primary)',
                    borderRadius: '8px',
                    padding: '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    minWidth: '250px',
                    maxWidth: '350px'
                }}>
                    <div style={{ fontWeight: 'bold', color: 'hsl(var(--primary))', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ✨ Sugerencia IA
                    </div>
                    <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontStyle: 'italic', color: 'hsl(var(--text-muted))' }}>
                        "{reasoning}"
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.75rem', fontWeight: 500 }}>
                        {suggestion}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSuggestion(null); }}
                            style={{ padding: '0.25rem 0.75rem', border: '1px solid hsl(var(--text-muted))', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setValue(suggestion); // Update local input mock
                                onSave(suggestion);   // Save immediately? or let them edit? Let's save.
                                setSuggestion(null);
                            }}
                            className="btn-primary"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .editable-text-display:hover {
                    background: rgba(0,0,0,0.05); /* Light highlight on hover */
                    border-color: var(--border-glass);
                }
            `}</style>
        </div>
    );
}
