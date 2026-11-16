<script lang="ts">
  import type { SolarSettings } from '../../lib/calculations/solar';

  let { baseline, energyA, energyB }: {
    baseline: SolarSettings;
    energyA: number;
    energyB: number;
  } = $props();

  const format = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });
  const signed = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2, signDisplay: 'exceptZero' });
  const weather = { clear: 'ясно', cloudy: 'мінлива хмарність', overcast: 'похмуро' };
  const change = $derived(energyB - energyA);
</script>

<div class="analytics" aria-live="polite">
  <p class="baseline">Сценарій A: {format.format(baseline.capacityKw)} кВт · нахил {baseline.tilt}° · азимут {baseline.azimuth}° · {weather[baseline.weather]}</p>
  <dl>
    <div><dt>A · збережений</dt><dd>{format.format(energyA)} кВт·год</dd></div>
    <div><dt>B · поточний</dt><dd>{format.format(energyB)} кВт·год</dd></div>
    <div><dt>Різниця B − A</dt><dd>{signed.format(change)} кВт·год</dd></div>
  </dl>
</div>

<style>
  .baseline { color: #94a3b8; font-size: .8rem; margin: .75rem 0; }
  dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr)); gap: .5rem; margin: 0 0 1rem; }
  dl div { background: #0d1520; border: 1px solid #29465e; padding: .55rem .65rem; border-radius: .5rem; }
  dt { color: #94a3b8; font-size: .75rem; }
  dd { margin: .25rem 0 0; font-weight: 700; color: #e2e8f0; }
</style>
