
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

  it('має початковий стан offline', () => {
    const state = $energySystem.get();

    expect(state.status).toBe('offline');
    expect(state.metrics.solarPower).toBe(0);
    expect(state.metrics.batteryLevel).toBe(0);
  });

  it('оновлює показники енергосистеми', () => {
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

  it('змінює статус системи', () => {
    updateSystemStatus('online');

    expect($energySystem.get().status).toBe('online');
  });

  it('скидає стан до початкових значень', () => {
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
