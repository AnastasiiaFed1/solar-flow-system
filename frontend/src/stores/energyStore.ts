import { atom } from 'nanostores';

export interface EnergyState {
    solarPowerKW: number;
    homeConsumptionKW: number;
    gridImportKW: number;
    gridExportKW: number;
    batteryPowerKW: number;
    batterySoc: number;
}

export const $energyState = atom<EnergyState>({
    solarPowerKW: 4.8,
    homeConsumptionKW: 2.7,
    gridImportKW: 1.2,
    gridExportKW: 0,
    batteryPowerKW: 1.2,
    batterySoc: 68,
});

export function updateEnergyState(partial: Partial<EnergyState>) {
    $energyState.set({ ...$energyState.get(), ...partial });
}