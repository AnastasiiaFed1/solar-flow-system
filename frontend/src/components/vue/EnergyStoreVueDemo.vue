
<script setup>
import { useStore } from '@nanostores/vue';
import { $energyState } from '../../stores/energyStore';

const system = useStore($energyState);
</script>

<template>
  <section class="vue-demo">
    <h2>Vue — спільний стан</h2>

    <p>Генерація: {{ system.solarPowerKW }} кВт</p>
    <p>Споживання: {{ system.homeConsumptionKW }} кВт</p>
    <p>Акумулятор: {{ system.batterySoC }}%</p>
    <p>Імпорт із мережі: {{ system.gridImportKW }} кВт</p>
    <p>Експорт у мережу: {{ system.gridExportKW }} кВт</p>
  </section>
</template>

<style scoped>
.vue-demo {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-top: 24px;
}
</style>