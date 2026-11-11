<script setup>
import { useStore } from '@nanostores/vue';
import { $energySystem } from '../../stores/energyStore';

const system = useStore($energySystem);
</script>

<template>
  <section class="vue-demo">
    <h2>Vue — спільний стан</h2>

    <p>Статус: {{ system.status }}</p>
    <p>Генерація: {{ system.metrics.solarPower }} кВт</p>
    <p>Споживання: {{ system.metrics.consumptionPower }} кВт</p>
    <p>Акумулятор: {{ system.metrics.batteryLevel }}%</p>
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
