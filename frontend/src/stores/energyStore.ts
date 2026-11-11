
import { atom } from 'nanostores';

import type {
  EnergyMetrics,
  EnergySystemState,
  SystemStatus,
} from '../types/energy';

// Початковий стан енергетичної системи
const initialState: EnergySystemState = {
  metrics: {
    solarPower: 0,
    consumptionPower: 0,
    batteryLevel: 0,
    batteryPower: 0,
    gridPower: 0,
    lastUpdated: '',
  },
  status: 'offline',
};

// Спільне реактивне сховище
export const $energySystem = atom<EnergySystemState>(initialState);

// Оновлення показників енергосистеми
export function updateEnergyMetrics(metrics: Partial<EnergyMetrics>): void {
  const currentState = $energySystem.get();

  $energySystem.set({
    ...currentState,
    metrics: {
      ...currentState.metrics,
      ...metrics,
      lastUpdated: new Date().toISOString(),
    },
  });
}

// Зміна стану системи
export function updateSystemStatus(status: SystemStatus): void {
  const currentState = $energySystem.get();

  $energySystem.set({
    ...currentState,
    status,
  });
}

// Повернення до початкового стану
export function resetEnergySystem(): void {
  $energySystem.set({
    metrics: { ...initialState.metrics },
    status: initialState.status,
  });
}
