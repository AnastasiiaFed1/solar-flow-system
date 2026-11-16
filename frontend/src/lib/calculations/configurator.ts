export interface SolarConfiguratorParams {
    panelModelId: string;
    panelWatts: number;
    panelCount: number;
    panelAreaM2: number;
    cityId: string;
    locationLabel: string;
    latitude: number;
    longitude: number;
    specificYield: number; // кВт·год на 1 kWp на рік
    tiltAngle: number; // 0..90 градусів
    azimuthAngle: number; // -180..+180 градусів (0 = Південь, 180 = Північ)
    inverterModelId: string;
    inverterNominalKw: number;
    inverterEfficiencyPercent: number; // 90..99%
    batteryType: 'LiFePO4' | 'AGM/GEL';
    batteryCapacityKwh: number;
    batteryDodPercent: number; // 40..95%
}

export interface SolarConfiguratorMetrics {
    peakPowerKwp: number;
    totalAreaM2: number;
    usableBatteryKwh: number;
    recommendedTilt: number;
    recommendedAzimuth: number;
    orientationEfficiencyPercent: number;
    estimatedAnnualGenerationKwh: number;
    estimatedDailyGenerationKwh: number;
    dcAcRatio: number;
}

/**
 * Обчислює рекомендований кут нахилу, азимут та питому сонячну генерацію
 * для довільних географічних координат на Землі.
 */
export function calculateLocationSolarProfile(latitude: number): {
    recommendedTilt: number;
    recommendedAzimuth: number;
    estimatedSpecificYield: number;
} {
    const absLat = Math.min(Math.abs(latitude), 75);

    // Астрономічна формула оптимального річного кута нахилу панелей
    const recommendedTilt = Math.round(
        Math.min(65, Math.max(10, 0.76 * absLat + 3.1))
    );

    // У Північній півкулі сонце на півдні (0°), у Південній — на півночі (180°)
    const recommendedAzimuth = latitude >= 0 ? 0 : 180;

    // Оцінка річної питомої генерації (кВт·год / kWp) залежно від широти
    const estimatedSpecificYield = Math.round(
        Math.max(850, Math.min(1720, 1680 - 0.16 * absLat * absLat - 2.2 * absLat))
    );

    return {
        recommendedTilt,
        recommendedAzimuth,
        estimatedSpecificYield,
    };
}

/**
 * Повертає найкоротшу кутову різницю між двома азимутами (0..180°)
 */
function angularDifferenceDeg(a: number, b: number): number {
    const diff = Math.abs(((a - b + 540) % 360) - 180);
    return diff;
}

/**
 * Чиста функція розрахунку параметрів СЕС.
 * Враховує реальну широту, рекомендовану орієнтацію для півкулі та відхилення від неї.
 */
export function calculateSolarSystemMetrics(
    params: SolarConfiguratorParams
): SolarConfiguratorMetrics {
    const peakPowerKwp = Number(
        ((params.panelWatts * params.panelCount) / 1000).toFixed(2)
    );
    const totalAreaM2 = Number(
        (params.panelAreaM2 * params.panelCount).toFixed(1)
    );
    const usableBatteryKwh = Number(
        ((params.batteryCapacityKwh * params.batteryDodPercent) / 100).toFixed(1)
    );

    const profile = calculateLocationSolarProfile(params.latitude);

    // Втрати від відхилення кута нахилу від рекомендованого для поточної широти
    const tiltDelta = Math.abs(params.tiltAngle - profile.recommendedTilt);
    const tiltFactor = Math.max(0.55, 1 - Math.pow(tiltDelta / 95, 2) * 0.45);

    // Втрати від відхилення азимута від оптимального напрямку (Південь або Північ)
    const azimuthDelta = angularDifferenceDeg(
        params.azimuthAngle,
        profile.recommendedAzimuth
    );
    const azimuthFactor = Math.max(0.45, 1 - Math.pow(azimuthDelta / 180, 1.65) * 0.55);

    const orientationEfficiency = tiltFactor * azimuthFactor;
    const orientationEfficiencyPercent = Math.round(orientationEfficiency * 100);

    const inverterEfficiency = params.inverterEfficiencyPercent / 100;
    const estimatedAnnualGenerationKwh = Math.round(
        peakPowerKwp *
        params.specificYield *
        orientationEfficiency *
        inverterEfficiency
    );

    const estimatedDailyGenerationKwh = Number(
        (estimatedAnnualGenerationKwh / 365).toFixed(1)
    );

    const dcAcRatio =
        params.inverterNominalKw > 0
            ? Number((peakPowerKwp / params.inverterNominalKw).toFixed(2))
            : 0;

    return {
        peakPowerKwp,
        totalAreaM2,
        usableBatteryKwh,
        recommendedTilt: profile.recommendedTilt,
        recommendedAzimuth: profile.recommendedAzimuth,
        orientationEfficiencyPercent,
        estimatedAnnualGenerationKwh,
        estimatedDailyGenerationKwh,
        dcAcRatio,
    };
}