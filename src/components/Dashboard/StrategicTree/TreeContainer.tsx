'use client';

import { TreeNodeData } from '@/app/dashboard/actions';
import { TreeLayout } from './TreeLayout';
import { useRef, useState } from 'react';
import { Maximize, ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';

interface TreeContainerProps {
    data: TreeNodeData[];
}

export function TreeContainer({ data }: TreeContainerProps) {
    const [scale, setScale] = useState(0.65);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4));
    const handleReset = () => setScale(0.65); // Changed reset scale to match initial

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[600px] border border-dashed border-slate-700/50 rounded-2xl bg-black/20 backdrop-blur-sm shadow-inner">
                <p className="text-slate-400 font-mono tracking-wide">No strategic data found for this tenant.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[75vh] min-h-[600px] border border-slate-800/80 rounded-2xl bg-[#030712]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
            {/* Controls & Helper */}
            <div
                className="absolute flex items-center gap-2 p-2 rounded-xl border shadow-lg z-50 flex-col sm:flex-row transition-colors"
                style={{ top: '1.5rem', right: '1.5rem', backgroundColor: '#059669', borderColor: 'rgba(52, 211, 153, 0.5)' }}
            >
                <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-5 h-5" color="#064e3b" />
                </button>
                <div className="w-full h-px sm:h-6 sm:w-px bg-emerald-900/30" />
                <button
                    onClick={handleReset} // Using handleReset as per original code
                    className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                    title="Reset Zoom"
                >
                    <Maximize className="w-5 h-5" color="#064e3b" />
                </button>
                <div className="w-full h-px sm:h-6 sm:w-px bg-emerald-900/30" />
                <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn className="w-5 h-5" color="#064e3b" />
                </button>
            </div>


            <div
                ref={containerRef}
                className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing p-24 custom-scrollbar"
            >
                <div
                    className="transition-transform duration-200 origin-top-left flex flex-col gap-32 min-w-max"
                    style={{ transform: `scale(${scale})` }}
                >
                    {data.map(mega => (
                        <TreeLayout key={mega.id} data={mega} />
                    ))}
                </div>
            </div>
        </div>
    );
}
