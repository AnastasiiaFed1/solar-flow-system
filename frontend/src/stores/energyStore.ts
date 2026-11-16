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

const API_BASE_URL = 'http://localhost:5106/api';

export async function syncEnergyFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/appliances?isActive=true`);
        if (!response.ok) return;

        const activeAppliances: Array<Record<string, any>> = await response.json();

        // Підтримуємо різні варіанти назви поля потужності в ApplianceDto
        const totalConsumptionKW = activeAppliances.reduce((sum, item) => {
            const rawPower = item.powerKw ?? item.powerKW ?? item.power ?? 0;
            // Якщо потужність у базі в ватах (> 50), переводимо в кВт
            const kw = rawPower > 50 ? rawPower / 1000 : rawPower;
            return sum + Number(kw);
        }, 0);

        const current = $energyState.get();
        const roundedConsumption = Number(totalConsumptionKW.toFixed(2));
        const netPower = Number((current.solarPowerKW - roundedConsumption).toFixed(2));

        updateEnergyState({
            homeConsumptionKW: roundedConsumption,
            gridImportKW: netPower < 0 ? Math.abs(netPower) : 0,
            gridExportKW: netPower > 0 ? netPower : 0,
        });
    } catch (error) {
        console.warn('Бекенд недоступний, використовуються локальні дані:', error);
    }
}