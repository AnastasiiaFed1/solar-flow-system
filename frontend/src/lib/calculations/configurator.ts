export type BatteryChemistry = 'LiFePO4' | 'AGM/GEL';

export interface SolarConfiguratorParams {
    panelModelId: string;
    panelWatts: number;
    panelAreaM2: number;
    panelCount: number;
    tiltAngle: number;      // 0..90 градусів
    azimuthAngle: number;   // -90..+90 градусів (0 = Південь)
    batteryType: BatteryChemistry;
    batteryCapacityKwh: number;
    batteryDodPercent: number;
    cityId: string;
    cityName: string;
    latitude: number;
    longitude: number;
    specificYieldKwhPerKw: number;
    inverterModelId: string;
    inverterNominalKw: number;
    inverterEfficiencyPercent: number;
}

export interface ConfiguratorMetrics {
    totalAreaM2: number;
    peakPowerKwp: number;
    usableBatteryKwh: number;
    orientationEfficiencyPercent: number;
    estimatedAnnualGenerationKwh: number;
    estimatedDailyGenerationKwh: number;
    dcAcRatio: number;
    isInverterOverloaded: boolean;
}

export function calculateConfiguratorMetrics(
    params: SolarConfiguratorParams
): ConfiguratorMetrics {
    const totalAreaM2 = Math.round(params.panelCount * params.panelAreaM2 * 10) / 10;
    const peakPowerKwp = Math.round(((params.panelCount * params.panelWatts) / 1000) * 10) / 10;
    const usableBatteryKwh =
        Math.round(params.batteryCapacityKwh * (params.batteryDodPercent / 100) * 10) / 10;

    // Розрахунок ефективності орієнтації відносно оптимального кута для широти (~34°) та півдня (0°)
    const optimalTilt = Math.max(25, Math.min(45, params.latitude * 0.7));
    const tiltLoss = Math.pow((params.tiltAngle - optimalTilt) / 90, 2) * 0.35;
    const azimuthLoss = Math.pow(params.azimuthAngle / 90, 2) * 0.22;
    const orientationFactor = Math.max(0.55, Math.min(1, 1 - tiltLoss - azimuthLoss));
    const orientationEfficiencyPercent = Math.round(orientationFactor * 100);

    const inverterFactor = (params.inverterEfficiencyPercent || 97) / 100;
    const estimatedAnnualGenerationKwh = Math.round(
        peakPowerKwp * params.specificYieldKwhPerKw * orientationFactor * inverterFactor
    );
    const estimatedDailyGenerationKwh =
        Math.round((estimatedAnnualGenerationKwh / 365) * 10) / 10;

    const dcAcRatio =
        params.inverterNominalKw > 0
            ? Math.round((peakPowerKwp / params.inverterNominalKw) * 100) / 100
            : 0;

    return {
        totalAreaM2,
        peakPowerKwp,
        usableBatteryKwh,
        orientationEfficiencyPercent,
        estimatedAnnualGenerationKwh,
        estimatedDailyGenerationKwh,
        dcAcRatio,
        isInverterOverloaded: dcAcRatio > 1.35,
    };
}