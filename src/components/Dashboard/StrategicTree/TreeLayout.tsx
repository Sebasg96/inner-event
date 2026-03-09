'use client';

import { useState } from 'react';
import { TreeNodeData } from '@/app/dashboard/actions';
import { TreeNode } from './TreeNode';

interface TreeLayoutProps {
    data: TreeNodeData;
    isRoot?: boolean;
}

export function TreeLayout({ data, isRoot = true }: TreeLayoutProps) {
    // Megas and Objectives start expanded by default, or just root. Let's expand all by default initially.
    const [isExpanded, setIsExpanded] = useState(true);

    const getLineColor = (status: string) => {
        switch (status) {
            case 'on_track': return 'border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.8)]';
            case 'at_risk': return 'border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.8)]';
            case 'behind': return 'border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.8)]';
            default: return 'border-slate-500 shadow-[0_0_10px_rgba(148,163,184,0.5)]';
        }
    };

    const hasChildren = data.children && data.children.length > 0;
    const lineColor = getLineColor(data.status);

    return (
        <div className="flex items-center">
            {/* Current Node */}
            <TreeNode
                data={data}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {/* Children Container */}
            {hasChildren && isExpanded && (
                <div className="flex items-center relative pl-24 animate-in fade-in slide-in-from-left-4 duration-300">
                    {/* Main horizontal line from parent */}
                    <div className={`absolute left-0 top-1/2 -mt-[1px] w-12 h-[2px] ${lineColor} z-0`} />

                    {/* Vertical spine if multiple children */}
                    {data.children.length > 1 && (
                        <div
                            className={`absolute left-12 top-0 bottom-0 w-[2px] ${lineColor} z-0 my-auto`}
                            style={{
                                // Adjust vertical line to connect the centers of the first and last child
                                height: `calc(100% - ${100 / data.children.length}%)`
                            }}
                        />
                    )}

                    <div
                        className="flex flex-col py-8"
                        style={{ gap: data.type === 'mega' ? '12rem' : '2.5rem' }}
                    >
                        {data.children.map((child, index) => (
                            <div key={child.id} className="relative flex items-center">
                                {/* Horizontal line to child */}
                                <div className={`absolute -left-12 top-1/2 -mt-[1px] w-12 h-[2px] ${lineColor} z-0`} />
                                <TreeLayout data={child} isRoot={false} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
