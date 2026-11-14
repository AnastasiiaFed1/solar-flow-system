
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
      <h2>РўРµСЃС‚ Nano Stores</h2>

      <p>РЎС‚Р°С‚СѓСЃ: {system.status}</p>
      <p>Р“РµРЅРµСЂР°С†С–СЏ: {system.metrics.solarPower} РєР’С‚</p>
      <p>РЎРїРѕР¶РёРІР°РЅРЅСЏ: {system.metrics.consumptionPower} РєР’С‚</p>
      <p>РђРєСѓРјСѓР»СЏС‚РѕСЂ: {system.metrics.batteryLevel}%</p>

      <button type="button" onClick={updateDemoData}>
        РћРЅРѕРІРёС‚Рё С‚РµСЃС‚РѕРІС– РґР°РЅС–
      </button>

      <button type="button" onClick={resetEnergySystem}>
        РЎРєРёРЅСѓС‚Рё
      </button>
    </section>
  );
}
