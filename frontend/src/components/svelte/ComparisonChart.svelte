<script lang="ts">
  import type { dailySolarProfile } from '../../lib/calculations/solar';

  type Profile = ReturnType<typeof dailySolarProfile>;
  let { current, baseline, hour, scale }: {
    current: Profile;
    baseline: Profile | null;
    hour: number;
    scale: number;
  } = $props();

  const format = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });
  const time = (value: number) => `${String(value).padStart(2, '0')}:00`;
</script>

{#if baseline}
  <div class="legend"><span class="saved">A · збережений</span><span class="live">B · поточний</span></div>
{/if}
<div class="plot">
  <div class="units"><span>{format.format(scale)} кВт</span><span>0</span></div>
  <div class="chart" aria-hidden="true">
    {#each current as point, index (point.hour)}
      {@const saved = baseline?.[index]}
      <div class="column" class:active={point.hour === hour}
        title={saved ? `${time(point.hour)} · A: ${format.format(saved.powerKw)} кВт · B: ${format.format(point.powerKw)} кВт` : `${time(point.hour)} · ${format.format(point.powerKw)} кВт`}>
        {#if saved}
          <div class="bar saved-bar" style:height={`${saved.powerKw / scale * 100}%`}></div>
        {/if}
        <div class="bar live-bar" style:height={`${point.powerKw / scale * 100}%`}></div>
      </div>
    {/each}
  </div>
  <div class="axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
</div>
<details>
  <summary>Погодинні значення</summary>
  <table aria-label="Погодинна потужність у кіловатах">
    <thead><tr><th scope="col">Година</th>{#if baseline}<th scope="col">A, кВт</th>{/if}<th scope="col">{baseline ? 'B, кВт' : 'Потужність, кВт'}</th></tr></thead>
    <tbody>
      {#each current as point, index (point.hour)}
        <tr><th scope="row">{time(point.hour)}</th>{#if baseline}<td>{format.format(baseline[index]?.powerKw ?? 0)}</td>{/if}<td>{format.format(point.powerKw)}</td></tr>
      {/each}
    </tbody>
  </table>
</details>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: .85rem; font-size: .8rem; margin-bottom: .6rem; }
  .legend span::before { content: ''; display: inline-block; width: .55rem; height: .55rem; margin-right: .35rem; border-radius: .15rem; background: currentColor; }
  .saved { color: #a5b4fc; }
  .live { color: #5eead4; }
  .plot { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .3rem .5rem; }
  .units { display: flex; flex-direction: column; justify-content: space-between; }
  .chart { display: grid; grid-template-columns: repeat(24, minmax(0, 1fr)); gap: clamp(1px, .45vw, 4px); height: 7rem;
    border-bottom: 1px solid #48657b; background: repeating-linear-gradient(to top, transparent 0 calc(25% - 1px), #2a4155 calc(25% - 1px) 25%); }
  .column { display: flex; align-items: end; gap: 1px; min-width: 0; }
  .column.active { background: #38e7dd20; }
  .bar { flex: 1; min-width: 0; border-radius: .15rem .15rem 0 0; transition: height 250ms ease; }
  .saved-bar { background: #a5b4fc; }
  .live-bar { background: linear-gradient(to top, #06b6d4, #5eead4); }
  .axis { grid-column: 2; display: flex; justify-content: space-between; }
  .axis, .units { color: #94a3b8; font-size: .7rem; }
  details { margin-top: .65rem; font-size: .8rem; }
  summary { color: #67e8f9; cursor: pointer; }
  table { width: 100%; border-collapse: collapse; margin-top: .5rem; text-align: right; }
  th, td { padding: .25rem .4rem; border-bottom: 1px solid #29465e; }
  th:first-child { text-align: left; }
  @media (prefers-reduced-motion: reduce) { .bar { transition: none; } }
</style>
