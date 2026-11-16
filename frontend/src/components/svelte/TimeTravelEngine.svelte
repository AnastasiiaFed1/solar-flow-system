<script lang="ts">
  let { hour = $bindable() }: { hour: number } = $props();
  let playing = $state(false);
  let speed = $state(1);
  const time = $derived(`${String(hour).padStart(2, '0')}:00`);

  $effect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => { hour = (hour + 1) % 24; }, 1000 / speed);
    return () => window.clearInterval(interval);
  });
</script>

<div class="clock">
  <label>Час доби <strong>{time}</strong>
    <input type="range" min="0" max="23" bind:value={hour} aria-valuetext={time} />
  </label>
  <label>Швидкість
    <select bind:value={speed}>
      <option value={1}>1×</option>
      <option value={2}>2×</option>
      <option value={4}>4×</option>
    </select>
  </label>
  <div class="actions">
    <button type="button" onclick={() => playing = !playing}>{playing ? 'Пауза' : 'Запустити'}</button>
    <button type="button" onclick={() => { playing = false; hour = 12; }}>Скинути час</button>
  </div>
</div>

<style>
  .clock { display: grid; gap: .85rem; margin: 1rem 0; font-size: .9rem; }
  label { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .4rem; align-items: center; }
  strong { color: #22d3ee; }
  input { width: 100%; accent-color: #22d3ee; color-scheme: dark; margin: 0; }
  select, button { background: #162333; color: #e2e8f0; border: 1px solid #327079; border-radius: .5rem; padding: .4rem .65rem; font: inherit; }
  button { cursor: pointer; }
  button:first-child { color: #cffafe; background: #164452; }
  .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  :is(input, select, button):focus-visible { outline: 2px solid #22d3ee; outline-offset: 2px; }
</style>
