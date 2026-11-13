import React from 'react';
import { Clock, BatteryCharging, ShieldAlert } from 'lucide-react';
import { calculateAutonomy } from '../../lib/calculations/autonomy';

interface EmergencyTimerProps {
    batterySoc: number;
    batteryCapacityKWh: number;
    solarKW: number;
    homeKW: number;
}

export const EmergencyTimer: React.FC<EmergencyTimerProps> = ({
    batterySoc = 68,
    batteryCapacityKWh = 10,
    solarKW = 4.8,
    homeKW = 2.7,
}) => {
    const autonomy = calculateAutonomy({
        batterySoc,
        batteryCapacityKWh,
        solarPowerKW: solarKW,
        homeConsumptionKW: homeKW,
        dod: 0.8,
    });

    return (
        <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold">Power Emergency Timer</h3>
                </div>
                <span className="text-xs text-zinc-400 font-mono">SOC: {batterySoc}%</span>
            </div>

            <div className="flex items-baseline justify-between my-2">
                <div>
                    <span className="text-3xl font-extrabold tracking-tight text-emerald-400">
                        {autonomy.formattedTime}
                    </span>
                    <p className="text-xs text-zinc-400 mt-1">Очікувана автономна робота</p>
                </div>
                {autonomy.status === 'charging' ? (
                    <BatteryCharging className="w-8 h-8 text-emerald-400 animate-bounce" />
                ) : (
                    <ShieldAlert className="w-8 h-8 text-amber-400" />
                )}
            </div>

            <div className="w-full bg-zinc-800 h-2.5 rounded-full mt-4 overflow-hidden">
                <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${batterySoc}%` }}
                />
            </div>
        </div>
    );
};