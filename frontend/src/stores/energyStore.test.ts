
import { beforeEach, describe, expect, it } from 'vitest';

import {
  $energySystem,
  resetEnergySystem,
  updateEnergyMetrics,
  updateSystemStatus,
} from './energyStore';

describe('Energy Store', () => {
  beforeEach(() => {
    resetEnergySystem();
  });

  it('РјР°С” РїРѕС‡Р°С‚РєРѕРІРёР№ СЃС‚Р°РЅ offline', () => {
    const state = $energySystem.get();

    expect(state.status).toBe('offline');
    expect(state.metrics.solarPower).toBe(0);
    expect(state.metrics.batteryLevel).toBe(0);
  });

  it('РѕРЅРѕРІР»СЋС” РїРѕРєР°Р·РЅРёРєРё РµРЅРµСЂРіРѕСЃРёСЃС‚РµРјРё', () => {
    updateEnergyMetrics({
      solarPower: 4.5,
      consumptionPower: 2.1,
      batteryLevel: 78,
    });

    const state = $energySystem.get();

    expect(state.metrics.solarPower).toBe(4.5);
    expect(state.metrics.consumptionPower).toBe(2.1);
    expect(state.metrics.batteryLevel).toBe(78);
    expect(state.metrics.gridPower).toBe(0);
    expect(state.metrics.lastUpdated).not.toBe('');
  });

  it('Р·РјС–РЅСЋС” СЃС‚Р°С‚СѓСЃ СЃРёСЃС‚РµРјРё', () => {
    updateSystemStatus('online');

    expect($energySystem.get().status).toBe('online');
  });

  it('СЃРєРёРґР°С” СЃС‚Р°РЅ РґРѕ РїРѕС‡Р°С‚РєРѕРІРёС… Р·РЅР°С‡РµРЅСЊ', () => {
    updateEnergyMetrics({
      solarPower: 5,
      batteryLevel: 90,
    });
    updateSystemStatus('online');

    resetEnergySystem();

    const state = $energySystem.get();

    expect(state.status).toBe('offline');
    expect(state.metrics.solarPower).toBe(0);
    expect(state.metrics.batteryLevel).toBe(0);
  });
});
