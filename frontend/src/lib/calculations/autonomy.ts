export interface AutonomyParams {
    batterySoc: number;
    batteryCapacityKWh: number;
    dod: number;
    solarPowerKW: number;
    homeConsumptionKW: number;
}

export interface AutonomyResult {
    deltaPowerKW: number;
    remainingEnergyKWh: number;
    hoursRemaining: number;
    status: 'charging' | 'discharging' | 'balanced';
    formattedTime: string;
}

export function calculateAutonomy({
    batterySoc,
    batteryCapacityKWh,
    dod = 0.8,
    solarPowerKW,
    homeConsumptionKW,
}: AutonomyParams): AutonomyResult {
    const deltaPowerKW = solarPowerKW - homeConsumptionKW;
    const minAllowedSoc = (1 - dod) * 100;
    const currentAvailableSocPercentage = Math.max(0, batterySoc - minAllowedSoc);
    const remainingEnergyKWh = (batteryCapacityKWh * currentAvailableSocPercentage) / 100;

    let status: 'charging' | 'discharging' | 'balanced' = 'balanced';
    let hoursRemaining = Infinity;
    let formattedTime = 'Баланс';

    if (deltaPowerKW > 0.05) {
        status = 'charging';
        const neededEnergy = ((100 - batterySoc) * batteryCapacityKWh) / 100;
        hoursRemaining = neededEnergy / deltaPowerKW;
        const hrs = Math.floor(hoursRemaining);
        const mins = Math.round((hoursRemaining - hrs) * 60);
        formattedTime = `Заряд: ~${hrs}г ${mins}хв`;
    } else if (deltaPowerKW < -0.05) {
        status = 'discharging';
        const deficitKW = Math.abs(deltaPowerKW);
        hoursRemaining = remainingEnergyKWh / deficitKW;

        if (hoursRemaining <= 0 || Number.isNaN(hoursRemaining)) {
            formattedTime = '0 год 00 хв (Розряджено)';
        } else {
            const hrs = Math.floor(hoursRemaining);
            const mins = Math.round((hoursRemaining - hrs) * 60);
            formattedTime = `${hrs} год ${mins} хв`;
        }
    } else {
        status = 'balanced';
        formattedTime = 'Автономно (Баланс 0 kW)';
    }

    return {
        deltaPowerKW,
        remainingEnergyKWh,
        hoursRemaining,
        status,
        formattedTime,
    };
}