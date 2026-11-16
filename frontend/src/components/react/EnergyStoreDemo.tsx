
import { useStore } from '@nanostores/react';
import { $energyState, updateEnergyState } from '../../stores/energyStore';

export default function EnergyStoreDemo() {
  const system = useStore($energyState);

  function updateDemoData() {
    updateEnergyState({
      solarPowerKW: 4.5,
      homeConsumptionKW: 2.1,
      batterySoc: 78,
    });
  }

  function resetDemoData() {
    updateEnergyState({
      solarPowerKW: 4.8,
      homeConsumptionKW: 2.7,
      gridImportKW: 1.2,
      gridExportKW: 0,
      batteryPowerKW: 1.2,
      batterySoc: 68,
    });
  }

  return (
    <section>
      <h2>Тест Nano Stores</h2>

      <p>Генерація: {system.solarPowerKW} кВт</p>
      <p>Споживання: {system.homeConsumptionKW} кВт</p>
      <p>Акумулятор: {system.batterySoc}%</p>

      <button type="button" onClick={updateDemoData}>
        Оновити тестові дані
      </button>

      <button type="button" onClick={resetDemoData}>
        Скинути
      </button>
    </section>
  );
}