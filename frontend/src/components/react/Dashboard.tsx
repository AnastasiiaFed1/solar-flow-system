import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $energyState } from '../../stores/energyStore';
import { PowerFlowDiagram } from './PowerFlowDiagram';
import { HealthMatrix } from './HealthMatrix';
import { EmergencyTimer } from './EmergencyTimer';
import { EnergyBalance } from './EnergyBalance';
import { TelemetryModal } from './TelemetryModal';

export const Dashboard: React.FC = () => {
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const energy = useStore($energyState);

    const inverterKW = Number(Math.max(0, energy.solarPowerKW - energy.batteryPowerKW).toFixed(2));

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0c141f] via-[#111c2b] to-[#0e1724] text-slate-100 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        <span className="text-cyan-400">SolarFlow</span>{' '}
                        <span className="text-slate-200 font-medium">/ Smart Grid System</span>
                    </h1>
                    <p className="text-xs text-slate-400">Real-time energy distribution and health matrix</p>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#162333] border border-cyan-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    System Status: Operational
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <PowerFlowDiagram
                        solarKW={energy.solarPowerKW}
                        inverterKW={inverterKW}
                        homeKW={energy.homeConsumptionKW}
                        gridKW={energy.gridImportKW}
                        batteryKW={energy.batteryPowerKW}
                        onNodeClick={(id) => setSelectedDevice(id)}
                    />
                </div>
                <div>
                    <EmergencyTimer
                        batterySoc={energy.batterySoc}
                        batteryCapacityKWh={10}
                        solarKW={energy.solarPowerKW}
                        homeKW={energy.homeConsumptionKW}
                    />
                    <EnergyBalance telemetry={energy} />
                </div>
            </div>

            <HealthMatrix
                inverterKW={inverterKW}
                batterySoc={energy.batterySoc}
                solarKW={energy.solarPowerKW}
                gridKW={energy.gridImportKW}
                onSelectDevice={(name) => setSelectedDevice(name)}
            />

            <TelemetryModal
                isOpen={Boolean(selectedDevice)}
                deviceName={selectedDevice || ''}
                onClose={() => setSelectedDevice(null)}
            />
        </div>
    );
};

export default Dashboard;