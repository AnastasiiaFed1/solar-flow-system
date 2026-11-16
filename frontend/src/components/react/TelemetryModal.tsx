import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { TelemetryChart } from './TelemetryChart';

export interface TelemetryModalProps {
    isOpen: boolean;
    deviceName: string;
    isBlackout?: boolean;
    onClose: () => void;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({
    isOpen,
    deviceName,
    isBlackout = false,
    onClose,
}) => {
    const [isTesting, setIsTesting] = useState(false);
    const [lastTestTime, setLastTestTime] = useState<string | null>(null);
    const [metrics, setMetrics] = useState({
        dcCurrent: '10.2 A',
        acCurrent: '16.8 A',
        frequency: '50.0 Hz',
        efficiency: '97 %',
    });

    useEffect(() => {
        if (!isOpen) return;
        setIsTesting(false);
        setLastTestTime(null);

        const normalized = deviceName.toLowerCase();
        if (normalized.includes('solar')) {
            setMetrics({ dcCurrent: '14.6 A', acCurrent: '13.9 A', frequency: '50.0 Hz', efficiency: '98 %' });
        } else if (normalized.includes('battery')) {
            setMetrics({ dcCurrent: '18.4 A', acCurrent: '16.2 A', frequency: '50.0 Hz', efficiency: '96 %' });
        } else if (normalized.includes('grid')) {
            setMetrics({
                dcCurrent: '0.0 A',
                acCurrent: isBlackout ? '0.0 A' : '8.4 A',
                frequency: isBlackout ? '0.0 Hz' : '50.0 Hz',
                efficiency: isBlackout ? '0 %' : '99 %',
            });
        } else {
            setMetrics({ dcCurrent: '10.2 A', acCurrent: '16.8 A', frequency: '50.0 Hz', efficiency: '97 %' });
        }
    }, [isOpen, deviceName, isBlackout]);

    if (!isOpen) return null;

    const handleRunSelfTest = () => {
        if (isTesting) return;
        setIsTesting(true);

        setTimeout(() => {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLastTestTime(now);
            setIsTesting(false);

            const jitter = (base: number) => (base + (Math.random() * 0.4 - 0.2)).toFixed(1);
            if (!deviceName.toLowerCase().includes('grid')) {
                setMetrics((prev) => ({
                    ...prev,
                    dcCurrent: `${jitter(parseFloat(prev.dcCurrent))} A`,
                    acCurrent: `${jitter(parseFloat(prev.acCurrent))} A`,
                }));
            }
        }, 1200);
    };

    const isGridOffline = isBlackout && deviceName.toLowerCase().includes('grid');

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

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-[#172436] p-3 rounded-xl border border-cyan-500/20">
                            <span className="text-slate-400 block">DC Input Current</span>
                            <span className="text-base font-bold text-slate-100">{metrics.dcCurrent}</span>
                        </div>
                        <div className="bg-[#172436] p-3 rounded-xl border border-cyan-500/20">
                            <span className="text-slate-400 block">AC Output Current</span>
                            <span className="text-base font-bold text-slate-100">{metrics.acCurrent}</span>
                        </div>
                        <div className="bg-[#172436] p-3 rounded-xl border border-cyan-500/20">
                            <span className="text-slate-400 block">Frequency</span>
                            <span className="text-base font-bold text-slate-100">{metrics.frequency}</span>
                        </div>
                        <div className="bg-[#172436] p-3 rounded-xl border border-cyan-500/20">
                            <span className="text-slate-400 block">Efficiency</span>
                            <span className={`text-base font-bold ${isGridOffline ? 'text-amber-400' : 'text-cyan-400'}`}>
                                {metrics.efficiency}
                            </span>
                        </div>
                    </div>

                    <div className="bg-[#162231] p-4 rounded-xl border border-cyan-500/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {isTesting ? (
                                <>
                                    <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                                    <span className="text-cyan-300">Running hardware telemetry self-test on {deviceName}...</span>
                                </>
                            ) : isGridOffline ? (
                                <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                                    <span className="text-amber-200">
                                        {lastTestTime
                                            ? `Self-test (${lastTestTime}): External grid disconnected. Island mode active.`
                                            : 'External grid disconnected. System running in autonomous island mode.'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="text-slate-300">
                                        {lastTestTime
                                            ? `Self-test passed at ${lastTestTime}. All relays & sensors within nominal range.`
                                            : 'All operating parameters within optimal range. No anomalies.'}
                                    </span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={handleRunSelfTest}
                            disabled={isTesting}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-60 text-slate-950 rounded-lg font-bold text-xs shadow-[0_0_12px_rgba(34,211,238,0.3)] transition-all shrink-0 cursor-pointer"
                        >
                            {isTesting ? 'Testing...' : 'Run Self-Test'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};