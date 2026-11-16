<script lang="ts">
  import { onMount } from 'svelte';
  import { getStations, type StationSummary } from '../../lib/stationApi';

  let { onSelect }: { onSelect: (station: StationSummary) => void } = $props();
  let stations = $state<StationSummary[]>([]);
  let selected = $state<number | null>(null);
  let status = $state<'loading' | 'ready' | 'error'>('loading');
  let request: AbortController | undefined;

  async function load() {
    request?.abort();
    const controller = new AbortController();
    request = controller;
    status = 'loading';

    try {
      const result = await getStations(controller.signal);
      if (controller.signal.aborted) return;
      stations = result;
      status = 'ready';
    } catch {
      if (!controller.signal.aborted) status = 'error';
    }
  }

  function applyStation(id: number | null) {
    const station = stations.find((item) => item.id === id);
    if (station) onSelect(station);
  }

  onMount(() => {
    void load();
    return () => request?.abort();
  });
</script>

<div class="station-field">
  {#if status === 'loading'}
    <p role="status">Завантажуємо станції…</p>
  {:else if status === 'error'}
    <p role="status">Не вдалося завантажити станції. Можна ввести кути вручну.</p>
    <button type="button" onclick={load}>Спробувати ще раз</button>
  {:else if stations.length === 0}
    <p role="status">У базі ще немає станцій. Можна ввести кути вручну.</p>
  {:else}
    <label for="simulation-station">Станція з бази даних</label>
    <select id="simulation-station" bind:value={() => selected, (id) => { selected = id; applyStation(id); }}>
      <option value={null}>Вибери станцію</option>
      {#each stations as station (station.id)}
        <option value={station.id}>{station.name}</option>
      {/each}
    </select>
    <button type="button" disabled={selected === null} onclick={() => applyStation(selected)}>Відновити кути зі станції</button>
  {/if}
</div>

<style>
  .station-field { display: grid; gap: .45rem; margin-bottom: 1rem; font-size: .85rem; }
  p { margin: 0; color: #a4b9cc; }
  select, button { font: inherit; color: #e2e8f0; background: #162333; padding: .4rem .55rem; border: 1px solid #327079; border-radius: .5rem; }
  select { width: 100%; color-scheme: dark; }
  button { justify-self: start; cursor: pointer; }
  button:disabled { opacity: .55; cursor: default; }
  :is(select, button):focus-visible { outline: 2px solid #22d3ee; outline-offset: 2px; }
</style>
