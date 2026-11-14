import React from 'react';
import { Handle, Position } from 'reactflow';
import { Sun, Zap, Home, Battery, Radio } from 'lucide-react';

export interface PowerFlowNodeData {
    title: string;
    subtitle?: string;
    value: string;
    type: 'solar' | 'inverter' | 'grid' | 'home' | 'battery';
    status?: 'ok' | 'warning' | 'critical';
}

const iconMap = {
    solar: Sun,
    inverter: Zap,
    grid: Radio,
    home: Home,
    battery: Battery,
};

export const PowerFlowNode: React.FC<{ data: PowerFlowNodeData }> = ({ data }) => {
    const IconComponent = iconMap[data.type] || Zap;

    return (
        <div className="bg-[#182637] border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] text-slate-100 rounded-xl p-3 min-w-[140px] shadow-lg transition-all duration-200">
            <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2.5 !h-2.5" />
            <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-2.5 !h-2.5" />

            <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 rounded-lg bg-[#0f1924] border border-cyan-500/20 text-cyan-400">
                    <IconComponent className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-xs font-medium text-slate-200">{data.title}</h4>
                    {data.subtitle && <p className="text-[10px] text-slate-400">{data.subtitle}</p>}
                </div>
            </div>

            <div className="text-sm font-bold text-cyan-300 tracking-wide mt-1">
                {data.value}
            </div>

            <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-2.5 !h-2.5" />
            <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2.5 !h-2.5" />
        </div>
    );
};