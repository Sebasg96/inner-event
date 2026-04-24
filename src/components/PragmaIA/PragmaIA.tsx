'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './PragmaIA.module.css';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export default function PragmaIA() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: '¡Hola! Soy PRAGM-AI 🪐. Estoy monitoreando tus sistemas. ¿En qué puedo ayudarte a mejorar tu estrategia hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        const updatedMessages: Message[] = [...messages, { role: 'user', content: userMsg }];

        setInput('');
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/pragma-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: updatedMessages, // Send full history
                    context: `Current Path: ${pathname}`
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.reply || data.error || 'Server connection failed');
            }

            setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);

        } catch (error: any) {
            console.error("PragmaIA Client Error:", error);
            setMessages(prev => [...prev, { role: 'ai', content: `❌ Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Only show PragmaIA if user is logged in
    if (!user) {
        return null;
    }

    return (
        <div className={styles.container}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.chatWindow}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    >
                        <div className={styles.header}>
                            <div className={styles.title}>
                                <Bot size={20} className="text-indigo-400" style={{ color: '#818cf8' }} />
                                PRAGM-AI
                            </div>
                            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.messages} ref={scrollRef}>
                            {messages.map((m, i) => (
                                <div key={i} className={`${styles.message} ${m.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
                                    {m.role === 'ai' ? (
                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                    ) : (
                                        m.content
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className={styles.aiMessage}>
                                    Thinking...
                                </div>
                            )}
                        </div>

                        <div className={styles.inputArea}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Escribe un comando..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={isLoading}
                            />
                            <button className={styles.sendBtn} onClick={handleSend} disabled={isLoading || !input.trim()}>
                                <Send size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={styles.avatarWrapper} onClick={() => setIsOpen(!isOpen)}>
                <div className={styles.ring} />
                <div className={styles.avatar}>
                    <Sparkles size={32} color="white" />
                </div>
            </div>
        </div>
    );
}
