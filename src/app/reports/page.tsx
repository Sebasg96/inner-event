'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import styles from '@/app/strategy/page.module.css';
import AIReportGenerator from '@/components/Reports/AIReportGenerator';

import NavBar from '@/components/NavBar';

import { useModuleTheme } from '@/lib/hooks/useModuleTheme';

export default function ReportsPage() {
    const { dict } = useLanguage();
    const theme = useModuleTheme();

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className={styles.header} data-testid="reports-page-title" style={{
                    background: `linear-gradient(to right, #fff, ${theme.color})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Strategic Reports</h1>
                <NavBar />
            </div>

            <AIReportGenerator />
        </div>
    );
}
