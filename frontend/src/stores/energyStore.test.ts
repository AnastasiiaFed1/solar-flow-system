import { describe, it, expect, beforeEach, vi } from 'vitest';
import { $energyState, updateEnergyState, syncEnergyFromBackend } from './energyStore';

describe('energyStore', () => {
    beforeEach(() => {
        $energyState.set({
            solarPowerKW: 4.8,
            homeConsumptionKW: 2.7,
            gridImportKW: 1.2,
            gridExportKW: 0,
            batteryPowerKW: 1.2,
            batterySoc: 68,
        });
        vi.restoreAllMocks();
    });

    it('should initialize with default energy state metrics', () => {
        const state = $energyState.get();
        expect(state.solarPowerKW).toBe(4.8);
        expect(state.homeConsumptionKW).toBe(2.7);
        expect(state.batterySoc).toBe(68);
    });

    it('should partially update energy state via updateEnergyState', () => {
        updateEnergyState({ solarPowerKW: 6.2, batterySoc: 85 });
        const state = $energyState.get();
        expect(state.solarPowerKW).toBe(6.2);
        expect(state.batterySoc).toBe(85);
        expect(state.homeConsumptionKW).toBe(2.7);
    });

    it('should sync consumption from backend API and calculate grid export when solar exceeds load', async () => {
        const mockAppliances = [
            { id: 1, name: 'Fridge', powerWatts: 200, power: 200, isActive: true },
            { id: 2, name: 'Boiler', powerWatts: 1800, power: 1800, isActive: true },
        ];

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockAppliances,
            })
        );

        await syncEnergyFromBackend();

        const state = $energyState.get();
        expect(state.homeConsumptionKW).toBe(2);
        expect(state.gridExportKW).toBe(2.8);
        expect(state.gridImportKW).toBe(0);
    });

    it('should calculate grid import when consumption exceeds solar generation', async () => {
        const mockAppliances = [
            { id: 1, name: 'EV Charger', powerKw: 6.5, isActive: true },
        ];

        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockAppliances,
            })
        );

        await syncEnergyFromBackend();

        const state = $energyState.get();
        expect(state.homeConsumptionKW).toBe(6.5);
        expect(state.gridImportKW).toBe(1.7);
        expect(state.gridExportKW).toBe(0);
    });
});