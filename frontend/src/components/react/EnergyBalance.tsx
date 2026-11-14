import React from 'react';
import { computeEnergyBalance, RawTelemetry } from '../../lib/calculations/energyBalance';

export const EnergyBalance: React.FC<{ telemetry: RawTelemetry }> = ({ telemetry }) => {
    const summary = computeEnergyBalance(telemetry);

    return (
        <div className="bg-[#162231]/90 backdrop-blur-md border border-cyan-500/25 rounded-2xl p-5 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.3)] mt-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-100">Energy Balance & Flows</h3>
                <span className="text-xs text-cyan-400 font-semibold">
                    Автономність: {summary.selfSufficiencyRatio}%
                </span>
            </div>

            <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                    <span className="text-slate-400">Solar Generation</span>
                    <span className="font-semibold text-amber-300">{summary.totalGeneration} kW</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Home Consumption</span>
                    <span className="font-semibold text-cyan-300">{summary.totalConsumption} kW</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Battery Power</span>
                    <span className="font-semibold text-teal-300">
                        {summary.batteryExchange > 0 ? `+${summary.batteryExchange}` : summary.batteryExchange} kW
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Grid Exchange</span>
                    <span className="font-semibold text-rose-400">{summary.gridExchange} kW</span>
                </div>
            </div>
        </div>
    );
};