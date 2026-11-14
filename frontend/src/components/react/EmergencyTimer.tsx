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
        <div className="bg-[#162231]/90 backdrop-blur-md border border-cyan-500/25 rounded-2xl p-5 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold text-slate-100">Power Emergency Timer</h3>
                </div>
                <span className="text-xs text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                    SOC: {batterySoc}%
                </span>
            </div>

            <div className="flex items-baseline justify-between my-2">
                <div>
                    <span className="text-3xl font-extrabold tracking-tight text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                        {autonomy.formattedTime}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Очікувана автономна робота</p>
                </div>
                {autonomy.status === 'charging' ? (
                    <BatteryCharging className="w-8 h-8 text-cyan-400 animate-bounce" />
                ) : (
                    <ShieldAlert className="w-8 h-8 text-amber-400" />
                )}
            </div>

            <div className="w-full bg-[#0d1520] border border-cyan-500/20 h-2.5 rounded-full mt-4 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-cyan-500 to-teal-300 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    style={{ width: `${batterySoc}%` }}
                />
            </div>
        </div>
    );
};