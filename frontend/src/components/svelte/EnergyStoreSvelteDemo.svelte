
<script lang="ts">
  import { $energyState as energyState } from '../../stores/energyStore';
</script>

<section class="svelte-demo">
  <h2>Svelte — спільний стан</h2>

  <p>Генерація: {$energyState.solarPowerKW} кВт</p>
  <p>Споживання: {$energyState.homeConsumptionKW} кВт</p>
  <p>Акумулятор: {$energyState.batterySoc}%</p>
  <p>Імпорт із мережі: {$energyState.gridImportKW} кВт</p>
  <p>Експорт у мережу: {$energyState.gridExportKW} кВт</p>
</section>

<style>
  .svelte-demo {
    margin-top: 24px;
    padding: 24px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }
</style>