import React from 'react';
import { computeEnergyBalance, RawTelemetry } from '../../lib/calculations/energyBalance';

export const EnergyBalance: React.FC<{ telemetry: RawTelemetry }> = ({ telemetry }) => {
    const summary = computeEnergyBalance(telemetry);

    return (
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 text-white shadow-xl mt-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">Energy Balance & Flows</h3>
                <span className="text-xs text-emerald-400 font-semibold">
                    Автономність: {summary.selfSufficiencyRatio}%
                </span>
            </div>

            <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                    <span className="text-zinc-400">Solar Generation</span>
                    <span className="font-semibold text-amber-400">{summary.totalGeneration} kW</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-400">Home Consumption</span>
                    <span className="font-semibold text-emerald-400">{summary.totalConsumption} kW</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-400">Battery Power</span>
                    <span className="font-semibold text-blue-400">
                        {summary.batteryExchange > 0 ? `+${summary.batteryExchange}` : summary.batteryExchange} kW
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-400">Grid Exchange</span>
                    <span className="font-semibold text-red-400">{summary.gridExchange} kW</span>
                </div>
            </div>
        </div>
    );
};