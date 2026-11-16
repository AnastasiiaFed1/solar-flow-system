<script lang="ts">
  import ComparisonChart from "./ComparisonChart.svelte";
  import EnergyAnalytics from "./EnergyAnalytics.svelte";
  import { dailySolarProfile, solarPowerAt, type SolarSettings } from '../../lib/calculations/solar';

  let capacityKw = $state(5);
  let tilt = $state(30);
  let azimuth = $state(180);
  let hour = $state(12);
  let weather = $state<SolarSettings['weather']>('clear');

  let baseline = $state<SolarSettings | null>(null);

  const settings = $derived({ capacityKw, tilt, azimuth, weather });
  const profile = $derived(dailySolarProfile(settings));
  const dailyEnergy = $derived(profile.reduce((total, point) => total + point.powerKw, 0));
  const baselineProfile = $derived(baseline ? dailySolarProfile(baseline) : null);
  const baselineEnergy = $derived(baselineProfile?.reduce((total, point) => total + point.powerKw, 0) ?? 0);
  const scale = $derived(Math.max(capacityKw, baseline?.capacityKw ?? 0));
  const power = $derived(solarPowerAt(hour, settings));
  const format = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });
  const time = (value: number) => `${String(value).padStart(2, '0')}:00`;
</script>

<section class="simulation" aria-labelledby="simulation-title">
  <div class="heading"><a class="back" href="/features">← До можливостей</a><div class="title-row"><h1 id="simulation-title"><span>SolarFlow</span> / Симуляція сонячної генерації</h1><span class="status" class:idle={power === 0}>{power > 0 ? "Генерація активна" : "Генерація відсутня"}</span></div>
  <p class="muted">Змінюй погоду, час та орієнтацію панелей, щоб порівняти виробіток.</p></div>

  <div class="workspace">
    <div class="controls">
      <div class="card">
      <h2>Налаштування панелей</h2>
      <label>Погода
        <select bind:value={weather}>
          <option value="clear">Ясно</option>
          <option value="cloudy">Мінлива хмарність</option>
          <option value="overcast">Похмуро</option>
        </select>
      </label>
      <label>Час доби <strong>{time(hour)}</strong>
        <input type="range" min="0" max="23" bind:value={hour} style:--progress={(hour / 23 * 100) + "%"} aria-valuetext={time(hour)} />
      </label>
      <label>Номінальна потужність <strong>{format.format(capacityKw)} кВт</strong>
        <input type="range" min="1" max="20" step="0.5" bind:value={capacityKw} style:--progress={((capacityKw - 1) / 19 * 100) + "%"} />
      </label>
    </div>
      <div class="card"><h2>Орієнтація панелей</h2>
      <label>Нахил <strong>{tilt}°</strong>
        <input type="range" min="0" max="90" bind:value={tilt} style:--progress={(tilt / 90 * 100) + "%"} />
      </label>
      <label>Азимут <strong>{azimuth}°</strong>
        <input type="range" min="0" max="359" bind:value={azimuth} style:--progress={(azimuth / 359 * 100) + "%"} />
      </label>
      <p class="muted directions">0° — північ, 90° — схід, 180° — південь, 270° — захід.</p></div>
    </div>

    <div class="results">
      <h2>Візуалізація сонячної станції</h2>
      <div class="scene">
        <img src="/solar-station.png" alt="Будинок із сонячними панелями, інвертором та акумулятором" width="1200" height="800" />
        <div class="angles"><span>Нахил <strong>{tilt}°</strong></span><span>Азимут <strong>{azimuth}°</strong></span></div>
        <div class="orientation" aria-hidden="true"><div class="panel" style:--tilt={tilt + "deg"} style:--azimuth={(azimuth - 180) + "deg"}></div></div>
      </div>
      <div class="metrics" aria-live="polite">
        <div><span>Потужність о {time(hour)}</span><strong>{format.format(power)} кВт</strong></div>
        <div><span>Енергія за добу</span><strong>{format.format(dailyEnergy)} кВт·год</strong></div>
      </div>
      <h2>Генерація за годинами</h2>
      <div class="comparison-actions">
        <button type="button" onclick={() => baseline = { ...settings }}>
          {baseline ? 'Оновити сценарій A' : 'Зберегти як сценарій A'}
        </button>
        {#if baseline}
          <button type="button" class="secondary" onclick={() => baseline = null}>Скинути порівняння</button>
        {/if}
      </div>
      {#if baseline}
        <EnergyAnalytics {baseline} energyA={baselineEnergy} energyB={dailyEnergy} />
      {:else}
        <p class="muted note comparison-help">Збережи сценарій A, а потім зміни налаштування для сценарію B.</p>
      {/if}
      <ComparisonChart current={profile} baseline={baselineProfile} {hour} {scale} />
      <p class="muted note">Оцінка для умовного дня зі сходом о 06:00 і заходом о 18:00.</p>
    </div>
  </div>
</section>

<style>
  .simulation { max-width: 1280px; margin: auto; padding: 1.5rem; color: #e2e8f0; }
  .heading { border-bottom: 1px solid #30485c; padding-bottom: 1rem; }
  .back { display: inline-block; border: 1px solid #3d5a74; border-radius: .35rem; padding: .24rem .65rem; color: #a9c4db; font-size: .82rem; text-decoration: none; margin-bottom: .8rem; }
  .back:hover { color: #67f3ec; border-color: #67f3ec; }
  h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -.025em; line-height: 1.15; margin: 0; }
  h2 { font-size: .875rem; font-weight: 700; color: #f1f5f9; margin: 0 0 .75rem; }
  .muted { color: #94a3b8; margin: .45rem 0 0; }
  .workspace { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(0, 3fr); gap: 1.5rem; margin-top: 1.5rem; }
  .controls { display: grid; align-content: start; gap: 1.5rem; }
  .card, .results { background: rgb(22 34 49 / 90%); backdrop-filter: blur(12px); border: 1px solid rgb(6 182 212 / 20%); border-radius: 1rem; padding: 1.25rem; box-shadow: 0 4px 24px rgb(0 0 0 / 30%); }
  label { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .45rem; margin-bottom: .9rem; font-size: .9rem; }
  label:last-child { margin-bottom: 0; }
  strong { color: #22d3ee; font-variant-numeric: tabular-nums; }
  input, select { width: 100%; margin: 0; accent-color: #42e1db; color-scheme: dark; }
  select { font: inherit; padding: .45rem .55rem; border: 1px solid #3b5d77; border-radius: .35rem; background: #21384e; color: inherit; }
  :is(a, input, select):focus-visible { outline: 2px solid #22d3ee; outline-offset: 3px; }
  .directions, .note { font-size: .8rem; }
  .scene { position: relative; overflow: hidden; border-radius: .45rem; background: #071220; border: 1px solid #29465e; }
  .scene img { display: block; width: 100%; height: auto; aspect-ratio: 1.85; object-fit: cover; }
  .angles { position: absolute; top: .65rem; left: .65rem; display: flex; flex-wrap: wrap; gap: .4rem; }
  .angles span { padding: .2rem .45rem; border: 1px solid #327079; border-radius: .3rem; background: #081825ed; font-size: .75rem; }
  .orientation { position: absolute; bottom: .65rem; right: .65rem; display: grid; place-items: center; width: 5.5rem; height: 4rem; perspective: 200px; background: #081825ed; border: 1px solid #327079; border-radius: .35rem; }
  .panel { width: 3.6rem; height: 2.3rem; border: 2px solid #71e4ef; border-radius: .15rem;
    background: repeating-linear-gradient(90deg, transparent 0 23%, #6db7dc 24% 25%),
      repeating-linear-gradient(0deg, #153e75 0 31%, #6db7dc 32% 33.3%);
    box-shadow: 0 0 12px #49d8f477; transform: rotateX(35deg) rotateZ(var(--azimuth)) rotateX(var(--tilt)); }
  .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin: .85rem 0 1rem; }
  .metrics div { min-width: 0; padding: .55rem .65rem; background: #0d1520; border: 1px solid #2d5368; border-radius: .4rem; }
  .metrics span, .metrics strong { display: block; }
  .metrics span { font-size: .78rem; color: #94a3b8; }
  .metrics strong { font-size: clamp(1.25rem, 3vw, 1.875rem); font-weight: 800; letter-spacing: -.025em; filter: drop-shadow(0 0 8px rgb(34 211 238 / 30%)); }
  .comparison-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  .comparison-actions button { background: #164452; color: #cffafe; border: 1px solid #327079; border-radius: .5rem; padding: .4rem .65rem; font: inherit; font-size: .8rem; cursor: pointer; }
  .comparison-actions .secondary { background: #0d1520; }
  .comparison-actions button:hover, .comparison-actions button:focus-visible { outline: 2px solid #22d3ee; outline-offset: 2px; }
  .comparison-help { margin-bottom: .65rem; }
  @media (max-width: 680px) { .workspace { grid-template-columns: 1fr; } }
  .title-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; }
  h1 span { color: #22d3ee; }
  .status { display: inline-flex; align-items: center; gap: .45rem; border-radius: 999px; background: #162333; border: 1px solid rgb(6 182 212 / 30%); padding: .375rem .875rem; color: #34d399; font-size: .75rem; font-weight: 500; }
  .status::before { content: ''; width: .5rem; height: .5rem; border-radius: 50%; background: currentColor; box-shadow: 0 0 12px rgb(16 185 129 / 35%); animation: pulse 2s ease-in-out infinite; }
  .status.idle { color: #fbbf24; }
  .status.idle::before { animation: none; }
  @keyframes pulse { 50% { opacity: .5; } }
  input[type='range'] { appearance: none; height: .625rem; border-radius: 999px; border: 1px solid rgb(6 182 212 / 20%); background: linear-gradient(to right, #06b6d4, #5eead4) left / var(--progress) 100% no-repeat #0d1520; cursor: pointer; }
  input[type='range']::-webkit-slider-thumb { appearance: none; width: 1rem; height: 1rem; border-radius: 50%; border: 2px solid #0d1520; background: #22d3ee; box-shadow: 0 0 8px rgb(34 211 238 / 35%); }
  input[type='range']::-moz-range-thumb { width: .75rem; height: .75rem; border-radius: 50%; border: 2px solid #0d1520; background: #22d3ee; box-shadow: 0 0 8px rgb(34 211 238 / 35%); }
  @media (prefers-reduced-motion: reduce) { .status::before { animation: none; } }
</style>
