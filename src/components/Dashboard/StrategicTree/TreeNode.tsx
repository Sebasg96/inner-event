import { TreeNodeData } from '@/app/dashboard/actions';
import { Target, Flag, Zap, ChevronRight, ChevronDown } from 'lucide-react';

interface TreeNodeProps {
    data: TreeNodeData;
    hasChildren?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
}

export function TreeNode({ data, hasChildren = false, isExpanded = true, onToggle }: TreeNodeProps) {
    const getColors = () => {
        switch (data.status) {
            case 'on_track': // Green
                return {
                    bg: 'bg-emerald-950/40',
                    border: 'border-emerald-500/60',
                    iconColor: 'text-emerald-400',
                    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
                    pointGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.9)]',
                    pointBg: 'bg-emerald-400',
                    dropShadow: 'drop-shadow-[0_2px_8px_rgba(16,185,129,0.8)]'
                };
            case 'at_risk': // Yellow/Orange
                return {
                    bg: 'bg-amber-950/40',
                    border: 'border-amber-500/60',
                    iconColor: 'text-amber-400',
                    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
                    pointGlow: 'shadow-[0_0_12px_rgba(245,158,11,0.9)]',
                    pointBg: 'bg-amber-400',
                    dropShadow: 'drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]'
                };
            case 'behind': // Red
            default:
                return {
                    bg: 'bg-rose-950/40',
                    border: 'border-rose-500/60',
                    iconColor: 'text-rose-400',
                    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
                    pointGlow: 'shadow-[0_0_12px_rgba(244,63,94,0.9)]',
                    pointBg: 'bg-rose-400',
                    dropShadow: 'drop-shadow-[0_2px_8px_rgba(244,63,94,0.8)]'
                };
        }
    };

    const getIcon = () => {
        switch (data.type) {
            case 'mega': return <Target className="w-5 h-5" color="#ffffff" />;
            case 'objective': return <Flag className="w-4 h-4" color="#ffffff" />;
            case 'kr': return <Zap className="w-4 h-4" color="#ffffff" />;
        }
    };

    const colors = getColors();

    // Custom sizing per type
    const isMega = data.type === 'mega';
    const width = isMega ? 'w-[350px]' : 'w-[320px]';

    return (
        <div className={`relative flex items-center group transition-all duration-300 hover:scale-[1.02] z-10 hover:z-50`}>
            {/* Connector Point (Input) */}
            {data.type !== 'mega' && (
                <div className={`absolute -left-3 w-4 h-4 rounded-full border-2 border-[#030712] ${colors.pointBg} ${colors.pointGlow} z-20`} />
            )}

            {/* Main Card */}
            {/* Main Card */}
            <div className={`
        ${width} p-6 rounded-[2rem] border backdrop-blur-xl bg-[#0a0a0a]/80
        ${colors.bg} ${colors.border} ${colors.glow}
        flex flex-col items-center text-center gap-3 overflow-hidden relative
      `}>
                {/* Full Card Weight Hover Overlay */}
                {data.weight !== undefined && (
                    <div className="absolute inset-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-3xl flex flex-col items-center justify-center rounded-[2rem] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                        <span className="text-sm uppercase tracking-widest font-bold mb-2" style={{ color: '#94a3b8' }}>Peso ponderado</span>
                        <span className={`text-6xl font-bold font-mono tracking-tight ${colors.dropShadow}`} style={{ color: '#ffffff' }}>
                            {data.weight}%
                        </span>
                    </div>
                )}

                <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-2xl bg-black/60 border border-white/10`}>
                        {getIcon()}
                    </div>
                    <div className="flex flex-col items-center">
                        <span className={`text-3xl font-bold font-mono tracking-tight ${colors.dropShadow}`} style={{ color: '#ffffff' }}>
                            {Math.round(data.progress)}%
                        </span>
                        <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#e2e8f0' }}>Progress</span>
                    </div>
                </div>

                {/* Title / Statement */}
                <h3 className="text-base font-medium line-clamp-3 mt-1 leading-relaxed drop-shadow-lg tooltip-trigger px-2 w-full break-words" title={data.title} style={{ color: '#ffffff' }}>
                    {data.title}
                </h3>

                {/* Progress Bar under card text */}
                <div className="w-full h-2 mt-2 bg-black/80 rounded-full overflow-hidden shadow-inner border border-white/10">
                    <div
                        className={`h-full ${colors.pointBg} ${colors.glow} transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.round(data.progress)}%` }}
                    />
                </div>
            </div>

            {/* Expand/Collapse Control & Output Point */}
            {hasChildren && (
                <button
                    onClick={onToggle}
                    className={`absolute -right-4 w-8 h-8 rounded-full border border-white/20 bg-black/80 flex items-center justify-center hover:scale-110 hover:border-white/50 transition-all z-30 ${colors.pointGlow} cursor-pointer text-white`}
                    title={isExpanded ? "Collapse" : "Expand"}
                >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            )}
        </div>
    );
}
