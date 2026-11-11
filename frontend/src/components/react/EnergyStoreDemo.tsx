
import { useStore } from '@nanostores/react';

import {
  $energySystem,
  updateEnergyMetrics,
  updateSystemStatus,
  resetEnergySystem,
} from '../../stores/energyStore';

export default function EnergyStoreDemo() {
  const system = useStore($energySystem);

  function updateDemoData() {
    updateEnergyMetrics({
      solarPower: 4.5,
      consumptionPower: 2.1,
      batteryLevel: 78,
    });

    updateSystemStatus('online');
  }

  return (
    <section>
      <h2>Тест Nano Stores</h2>

      <p>Статус: {system.status}</p>
      <p>Генерація: {system.metrics.solarPower} кВт</p>
      <p>Споживання: {system.metrics.consumptionPower} кВт</p>
      <p>Акумулятор: {system.metrics.batteryLevel}%</p>

      <button type="button" onClick={updateDemoData}>
        Оновити тестові дані
      </button>

      <button type="button" onClick={resetEnergySystem}>
        Скинути
      </button>
    </section>
  );
}
