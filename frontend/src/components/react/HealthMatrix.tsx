import React from 'react';
import { HealthCard } from './HealthCard';

interface HealthMatrixProps {
    inverterKW: number;
    batterySoc: number;
    solarKW: number;
    gridKW: number;
    onSelectDevice: (deviceName: string) => void;
}

export const HealthMatrix: React.FC<HealthMatrixProps> = ({
    inverterKW,
    batterySoc,
    solarKW,
    gridKW,
    onSelectDevice,
}) => {
    return (
        <div>
            <h2 className="text-lg font-bold text-slate-100 mb-4">System Health Matrix</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <HealthCard
                    id="inverter"
                    name="Inverter Unit"
                    status="ok"
                    metrics={[
                        { label: 'Output Power', value: `${inverterKW} kW` },
                        { label: 'Efficiency', value: '97%' },
                    ]}
                    onClick={() => onSelectDevice('Inverter')}
                />
                <HealthCard
                    id="battery"
                    name="Battery Pack"
                    status="ok"
                    metrics={[
                        { label: 'SOC', value: `${batterySoc}%` },
                        { label: 'Temp', value: '32 °C' },
                    ]}
                    onClick={() => onSelectDevice('Battery')}
                />
                <HealthCard
                    id="solar"
                    name="Solar Array"
                    status="ok"
                    metrics={[
                        { label: 'Generation', value: `${solarKW} kW` },
                        { label: 'Voltage', value: '380 V' },
                    ]}
                    onClick={() => onSelectDevice('Solar Array')}
                />
                <HealthCard
                    id="grid"
                    name="Grid Tie"
                    status="warning"
                    metrics={[
                        { label: 'Grid Power', value: `${gridKW} kW` },
                        { label: 'Frequency', value: '50.0 Hz' },
                    ]}
                    onClick={() => onSelectDevice('Grid Tie')}
                />
            </div>
        </div>
    );
};