import React from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export interface HealthCardProps {
    id: string;
    name: string;
    status: 'ok' | 'warning' | 'critical';
    metrics: Array<{ label: string; value: string }>;
    onClick?: () => void;
}

export const HealthCard: React.FC<HealthCardProps> = ({ name, status, metrics, onClick }) => {
    const statusConfig = {
        ok: { label: 'OK', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30', Icon: CheckCircle },
        warning: { label: 'Warning', color: 'bg-amber-500/15 text-amber-300 border-amber-400/30', Icon: AlertTriangle },
        critical: { label: 'Critical', color: 'bg-rose-500/15 text-rose-300 border-rose-400/30', Icon: XCircle },
    };

    const currentStatus = statusConfig[status];
    const StatusIcon = currentStatus.Icon;

    return (
        <div
            onClick={onClick}
            className="bg-[#162231]/90 backdrop-blur-md border border-cyan-500/25 hover:border-cyan-400/60 hover:shadow-[0_0_18px_rgba(34,211,238,0.12)] rounded-xl p-4 cursor-pointer transition-all duration-200"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-semibold text-slate-100">{name}</h4>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border ${currentStatus.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {currentStatus.label}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
                {metrics.map((m, idx) => (
                    <div key={idx} className="bg-[#0e1724]/80 p-2 rounded-lg border border-cyan-500/15">
                        <span className="text-slate-400 block text-[10px]">{m.label}</span>
                        <span className="text-slate-100 font-semibold">{m.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};