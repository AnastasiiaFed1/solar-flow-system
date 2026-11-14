import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { TelemetryChart } from './TelemetryChart';

export interface TelemetryModalProps {
    isOpen: boolean;
    deviceName: string;
    onClose: () => void;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({ isOpen, deviceName, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060b12]/80 backdrop-blur-sm p-4">
            <div className="bg-[#121c29] border border-cyan-500/30 rounded-2xl w-full max-w-3xl overflow-hidden shadow-[0_0_32px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-[#162333]">
                    <div>
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            {deviceName} Details & Diagnostics
                        </h3>
                        <p className="text-xs text-slate-400">Real-time telemetry and 24h performance monitoring</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-[#1e2f44] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    <div>
                        <h4 className="text-xs font-semibold text-slate-300 mb-2">Performance Trend (Last 24h)</h4>
                        <TelemetryChart />
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-xs">
                        <div className="bg-[#172436] p-3 rounded-xl border border-cyan-500/20">
                            <span className="text-slate-400 block">DC Input Current</span>
                            <span className="text-base font-bold text-slate-100">10.2 A</span>
                        </div>
                        <div className="bg-[#172436] p-3 rounded-xl border border-cyan-500/20">
                            <span className="text-slate-400 block">AC Output Current</span>
                            <span className="text-base font-bold text-slate-100">16.8 A</span>
                        </div>
                        <div className="bg-[#172436] p-3 rounded-xl border border-cyan-500/20">
                            <span className="text-slate-400 block">Frequency</span>
                            <span className="text-base font-bold text-slate-100">50.0 Hz</span>
                        </div>
                        <div className="bg-[#172436] p-3 rounded-xl border border-cyan-500/20">
                            <span className="text-slate-400 block">Efficiency</span>
                            <span className="text-base font-bold text-cyan-400">97 %</span>
                        </div>
                    </div>

                    <div className="bg-[#162231] p-4 rounded-xl border border-cyan-500/20 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                            <span className="text-slate-300">All operating parameters within optimal range. No anomalies.</span>
                        </div>
                        <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 rounded-lg font-bold text-xs shadow-[0_0_12px_rgba(34,211,238,0.3)] transition-all">
                            Run Self-Test
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};