<script lang="ts">
  import { $energySystem as energySystem } from '../../stores/energyStore';
</script>

<section class="svelte-demo">
  <h2>Svelte — спільний стан</h2>

  <p>Статус: {$energySystem.status}</p>
  <p>Генерація: {$energySystem.metrics.solarPower} кВт</p>
  <p>Споживання: {$energySystem.metrics.consumptionPower} кВт</p>
  <p>Акумулятор: {$energySystem.metrics.batteryLevel}%</p>
</section>

<style>
  .svelte-demo {
    margin-top: 24px;
    padding: 24px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
  }
</style>
