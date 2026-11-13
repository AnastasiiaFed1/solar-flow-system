export interface RawTelemetry {
    solarPowerKW: number;
    homeConsumptionKW: number;
    gridImportKW: number;
    gridExportKW: number;
    batteryPowerKW: number;
    batterySoc: number;
}

export interface EnergyBalanceSummary {
    totalGeneration: number;
    totalConsumption: number;
    gridExchange: number;
    batteryExchange: number;
    selfSufficiencyRatio: number;
    flows: Array<{
        from: string;
        to: string;
        powerKW: number;
        type: 'DC' | 'AC' | 'AC (Charging)' | 'AC (Import)' | 'AC (Export)';
    }>;
}

export function computeEnergyBalance(data: RawTelemetry): EnergyBalanceSummary {
    const { solarPowerKW, homeConsumptionKW, gridImportKW, gridExportKW, batteryPowerKW } = data;

    const selfSufficiencyRatio = homeConsumptionKW > 0
        ? Math.min(100, Math.max(0, ((homeConsumptionKW - gridImportKW) / homeConsumptionKW) * 100))
        : 100;

    const flows: EnergyBalanceSummary['flows'] = [];

    if (solarPowerKW > 0) {
        flows.push({ from: 'Solar Panels', to: 'Inverter', powerKW: solarPowerKW, type: 'DC' });
    }

    const inverterOutput = Math.min(solarPowerKW, homeConsumptionKW + (batteryPowerKW > 0 ? batteryPowerKW : 0));
    if (inverterOutput > 0) {
        flows.push({ from: 'Inverter', to: 'Home', powerKW: Math.min(inverterOutput, homeConsumptionKW), type: 'AC' });
    }

    if (batteryPowerKW > 0) {
        flows.push({ from: 'Inverter', to: 'Battery', powerKW: batteryPowerKW, type: 'AC (Charging)' });
    } else if (batteryPowerKW < 0) {
        flows.push({ from: 'Battery', to: 'Inverter', powerKW: Math.abs(batteryPowerKW), type: 'AC' });
    }

    if (gridImportKW > 0) {
        flows.push({ from: 'Grid', to: 'Inverter', powerKW: gridImportKW, type: 'AC (Import)' });
    } else if (gridExportKW > 0) {
        flows.push({ from: 'Inverter', to: 'Grid', powerKW: gridExportKW, type: 'AC (Export)' });
    }

    return {
        totalGeneration: solarPowerKW,
        totalConsumption: homeConsumptionKW,
        gridExchange: gridImportKW > 0 ? gridImportKW : -gridExportKW,
        batteryExchange: batteryPowerKW,
        selfSufficiencyRatio: Math.round(selfSufficiencyRatio),
        flows,
    };
}