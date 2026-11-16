import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $energyState, syncEnergyFromBackend } from '../../stores/energyStore';
import { PowerFlowDiagram } from './PowerFlowDiagram';
import { HealthMatrix } from './HealthMatrix';
import { EmergencyTimer } from './EmergencyTimer';
import { EnergyBalance } from './EnergyBalance';
import { TelemetryModal } from './TelemetryModal';

export const Dashboard: React.FC = () => {
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [isBlackout, setIsBlackout] = useState(false);
    const energy = useStore($energyState);

    useEffect(() => {
        syncEnergyFromBackend();
        const interval = setInterval(syncEnergyFromBackend, 3000);
        return () => clearInterval(interval);
    }, []);

    const netPower = Number((energy.solarPowerKW - energy.homeConsumptionKW).toFixed(2));
    const effectiveGridImport = isBlackout ? 0 : netPower < 0 ? Math.abs(netPower) : 0;
    const effectiveGridExport = isBlackout ? 0 : netPower > 0 ? netPower : 0;
    const effectiveBatteryKW = isBlackout ? netPower : energy.batteryPowerKW;

    const effectiveEnergy = {
        ...energy,
        gridImportKW: effectiveGridImport,
        gridExportKW: effectiveGridExport,
        batteryPowerKW: effectiveBatteryKW,
    };

    const inverterKW = Number(Math.max(0, effectiveEnergy.solarPowerKW - effectiveEnergy.batteryPowerKW).toFixed(2));

    const handleSolarChange = (val: number) => {
        $energyState.set({
            ...$energyState.get(),
            solarPowerKW: val,
        });
    };

    const handleBatterySocChange = (val: number) => {
        $energyState.set({
            ...$energyState.get(),
            batterySoc: val,
        });
    };

    const handleResetSimulation = () => {
        setIsBlackout(false);
        $energyState.set({
            ...$energyState.get(),
            solarPowerKW: 4.8,
            batterySoc: 82,
        });
        syncEnergyFromBackend();
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0c141f] via-[#111c2b] to-[#0e1724] text-slate-100 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
                <div className="flex items-center gap-3.5">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#162333] border border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 text-xs font-semibold transition-all cursor-pointer shrink-0"
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            <span className="text-cyan-400">SolarFlow</span>{' '}
                            <span className="text-slate-200 font-medium">/ Smart Grid System</span>
                        </h1>
                        <p className="text-xs text-slate-400">Real-time energy distribution and health matrix</p>
                    </div>
                </div>
                <div
                    className={`inline-flex items-center gap-2 bg-[#162333] border px-3.5 py-1.5 rounded-full text-xs font-medium self-start sm:self-auto ${isBlackout
                            ? 'border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                            : 'border-cyan-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        }`}
                >
                    <span
                        className={`w-2 h-2 rounded-full animate-pulse ${isBlackout ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                    />
                    {isBlackout ? 'System Status: Off-Grid / Island Mode' : 'System Status: Operational'}
                </div>
            </div>

            {/* Інтерактивна панель симулятора */}
            <div className="bg-[#162333]/90 border border-cyan-500/20 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 shadow-lg">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 flex-1">
                    <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                                Solar Generation
                            </span>
                            <span className="font-mono font-bold text-cyan-400">{energy.solarPowerKW.toFixed(1)} kW</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={8}
                            step={0.2}
                            value={energy.solarPowerKW}
                            onChange={(e) => handleSolarChange(parseFloat(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-[#0f172a] rounded-lg"
                        />
                    </div>

                    <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                                Battery Charge (SoC)
                            </span>
                            <span className="font-mono font-bold text-emerald-400">{energy.batterySoc}%</span>
                        </div>
                        <input
                            type="range"
                            min={5}
                            max={100}
                            step={1}
                            value={energy.batterySoc}
                            onChange={(e) => handleBatterySocChange(parseInt(e.target.value, 10))}
                            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-[#0f172a] rounded-lg"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end lg:self-auto">
                    <button
                        onClick={() => setIsBlackout((prev) => !prev)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${isBlackout
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                : 'bg-[#0f172a] border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-300'
                            }`}
                    >
                        {isBlackout ? '⚡ Restore Grid' : '🔌 Simulate Blackout'}
                    </button>

                    <button
                        onClick={handleResetSimulation}
                        title="Reset simulation parameters"
                        className="px-3 py-2 rounded-xl bg-[#0f172a] border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 text-xs font-medium transition-colors cursor-pointer"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <PowerFlowDiagram
                        solarKW={effectiveEnergy.solarPowerKW}
                        inverterKW={inverterKW}
                        homeKW={effectiveEnergy.homeConsumptionKW}
                        gridKW={effectiveEnergy.gridImportKW}
                        batteryKW={effectiveEnergy.batteryPowerKW}
                        onNodeClick={(id) => setSelectedDevice(id)}
                    />
                </div>
                <div className="space-y-6">
                    <EmergencyTimer
                        batterySoc={effectiveEnergy.batterySoc}
                        batteryCapacityKWh={10}
                        solarKW={effectiveEnergy.solarPowerKW}
                        homeKW={effectiveEnergy.homeConsumptionKW}
                    />
                    <EnergyBalance telemetry={effectiveEnergy} />
                </div>
            </div>

            <HealthMatrix
                inverterKW={inverterKW}
                batterySoc={effectiveEnergy.batterySoc}
                solarKW={effectiveEnergy.solarPowerKW}
                gridKW={effectiveEnergy.gridImportKW}
                onSelectDevice={(name) => setSelectedDevice(name)}
            />

            <TelemetryModal
                isOpen={Boolean(selectedDevice)}
                deviceName={selectedDevice || ''}
                isBlackout={isBlackout}
                onClose={() => setSelectedDevice(null)}
            />
        </div>
    );
};

export default Dashboard;