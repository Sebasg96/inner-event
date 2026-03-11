'use client';

import React, { useState, useRef } from 'react';
import styles from '@/app/strategy/page.module.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';

export default function AIReportGenerator() {
    const [selectedModules, setSelectedModules] = useState<string[]>(['strategy']);
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const modules = ['strategy', 'capacities', 'rituals', 'analytics', 'emergent'];

    const toggleModule = (mod: string) => {
        if (mod === 'all') {
            setSelectedModules(modules);
        } else {
            if (selectedModules.includes(mod)) {
                setSelectedModules(selectedModules.filter(m => m !== mod));
            } else {
                setSelectedModules([...selectedModules, mod]);
            }
        }
    };

    const handleGenerate = async () => {
        if (selectedModules.length === 0) return;
        setIsGenerating(true);
        setReport(null);
        try {
            const { generateExecutiveReport } = await import('@/app/reports/actions');
            const result = await generateExecutiveReport(selectedModules);

            if (result.success && result.report) {
                setReport(result.report);
            } else {
                setReport(`Error: ${result.error || "No se pudo generar el informe."}`);
            }
        } catch (error) {
            console.error(error);
            setReport("Error de conexión al generar el informe.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // Higher resolution
                backgroundColor: '#ffffff', // White background for professional document
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
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

            pdf.save('Informe_Ejecutivo_Pragma.pdf');
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error al generar el PDF. Inténtalo de nuevo.");
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🤖 Generador de Informes Inteligentes
            </h2>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem' }}>
                Selecciona los módulos para un análisis cruzado integral.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <button
                    type="button"
                    onClick={() => toggleModule('all')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: '1px solid #0FB4A8',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 600,
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    Todos
                </button>
                {modules.map((mod) => {
                    const isSelected = selectedModules.includes(mod);
                    return (
                        <button
                            key={mod}
                            type="button"
                            onClick={() => toggleModule(mod)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: isSelected ? '1px solid #0FB4A8' : '1px solid rgba(255,255,255,0.2)',
                                background: isSelected ? '#0FB4A8' : 'rgba(255,255,255,0.05)',
                                color: isSelected ? 'white' : 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s',
                                fontWeight: isSelected ? 600 : 400
                            }}
                        >
                            {mod}
                        </button>
                    );
                })}
            </div>

            <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating || selectedModules.length === 0}
                style={{
                    width: '100%',
                    maxWidth: '300px',
                    background: 'linear-gradient(135deg, #0FB4A8 0%, #0d9488 100%)', // Gradient for depth
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: isGenerating ? 'wait' : 'pointer',
                    opacity: isGenerating || selectedModules.length === 0 ? 0.7 : 1,
                    boxShadow: '0 4px 15px rgba(15, 180, 168, 0.4)', // Teal glow
                    transition: 'all 0.3s ease',
                    transform: isGenerating ? 'none' : 'scale(1)',
                    marginTop: '1rem' // Separation
                }}
                onMouseEnter={(e) => {
                    if (!isGenerating && selectedModules.length > 0) {
                        e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(15, 180, 168, 0.6)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(15, 180, 168, 0.4)';
                }}
            >
                {isGenerating ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        🤖 Analizando...
                    </span>
                ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        ✨ Generar Informe Ejecutivo
                    </span>
                )}
            </button>

            {report && (
                <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
                        <button
                            onClick={handleDownloadPDF}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '12px',
                                border: '1px solid #0FB4A8',
                                background: 'rgba(15, 180, 168, 0.2)', // Semi-transparent teal
                                color: 'white',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                backdropFilter: 'blur(5px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 10px rgba(15, 180, 168, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#0FB4A8';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(15, 180, 168, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(15, 180, 168, 0.2)';
                                e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 180, 168, 0.2)';
                            }}
                        >
                            <span style={{ fontSize: '1.2em' }}>📥</span> Descargar PDF
                        </button>
                    </div>

                    {/* Document Container - Styled for both screen and PDF */}
                    <div
                        ref={reportRef}
                        style={{
                            padding: '3rem',
                            background: 'white',
                            borderRadius: '4px',
                            color: '#1e293b',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            maxWidth: '100%',
                            margin: '0 auto',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                    >
                        {/* Header with Logo */}
                        <div style={{
                            borderBottom: '2px solid #0FB4A8',
                            paddingBottom: '1.5rem',
                            marginBottom: '2rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <img
                                    src="/report-logo.png"
                                    alt="Pragma"
                                    style={{ height: '80px', marginBottom: '1rem', objectFit: 'contain' }}
                                    onError={(e) => {
                                        e.currentTarget.src = "/pragma-logo.png";
                                        e.currentTarget.style.height = '80px';
                                    }}
                                />
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                    Informe Estratégico Ejecutivo
                                </h1>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Generado el</div>
                                <div style={{ fontWeight: 600, color: '#334155' }}>{new Date().toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Markdown Content with specialized styling */}
                        <div className="report-content" style={{ lineHeight: '1.7' }}>
                            <ReactMarkdown components={{
                                h1: ({ node, ...props }) => <h2 style={{ color: '#0FB4A8', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginTop: '2rem' }} {...props} />,
                                h2: ({ node, ...props }) => <h3 style={{ color: '#334155', marginTop: '1.5rem', fontSize: '1.2rem' }} {...props} />,
                                ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }} {...props} />,
                                li: ({ node, ...props }) => <li style={{ marginBottom: '0.5rem', color: '#475569' }} {...props} />,
                                p: ({ node, ...props }) => <p style={{ marginBottom: '1rem', color: '#475569' }} {...props} />,
                                strong: ({ node, ...props }) => <strong style={{ color: '#1e293b', fontWeight: 700 }} {...props} />
                            }}>
                                {report}
                            </ReactMarkdown>
                        </div>

                        {/* Footer */}
                        <div style={{
                            marginTop: '4rem',
                            borderTop: '1px solid #e2e8f0',
                            paddingTop: '1rem',
                            textAlign: 'center',
                            fontSize: '0.8rem',
                            color: '#94a3b8'
                        }}>
                            Generado por IA • Inner Event Platform • Confidencial
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
