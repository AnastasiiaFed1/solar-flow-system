<script lang="ts">
  import { dailySolarProfile, solarPowerAt, type SolarSettings } from '../../lib/calculations/solar';

  let capacityKw = $state(5);
  let tilt = $state(30);
  let azimuth = $state(180);
  let hour = $state(12);
  let weather = $state<SolarSettings['weather']>('clear');

  const settings = $derived({ capacityKw, tilt, azimuth, weather });
  const profile = $derived(dailySolarProfile(settings));
  const dailyEnergy = $derived(profile.reduce((total, point) => total + point.powerKw, 0));
  const power = $derived(solarPowerAt(hour, settings));
  const format = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });
  const time = (value: number) => `${String(value).padStart(2, '0')}:00`;
</script>

<section class="simulation" aria-labelledby="simulation-title">
  <h1 id="simulation-title">Симуляція сонячної генерації</h1>
  <p class="muted">Змінюй погоду, час та орієнтацію панелей, щоб порівняти виробіток.</p>

  <div class="workspace">
    <div class="controls">
      <h2>Налаштування панелей</h2>
      <label>Погода
        <select bind:value={weather}>
          <option value="clear">Ясно</option>
          <option value="cloudy">Мінлива хмарність</option>
          <option value="overcast">Похмуро</option>
        </select>
      </label>
      <label>Час доби <strong>{time(hour)}</strong>
        <input type="range" min="0" max="23" bind:value={hour} aria-valuetext={time(hour)} />
      </label>
      <label>Номінальна потужність <strong>{format.format(capacityKw)} кВт</strong>
        <input type="range" min="1" max="20" step="0.5" bind:value={capacityKw} />
      </label>
      <label>Нахил <strong>{tilt}°</strong>
        <input type="range" min="0" max="90" bind:value={tilt} />
      </label>
      <label>Азимут <strong>{azimuth}°</strong>
        <input type="range" min="0" max="359" bind:value={azimuth} />
      </label>
      <p class="muted directions">0° — північ, 90° — схід, 180° — південь, 270° — захід.</p>
    </div>

    <div class="results">
      <div class="metrics" aria-live="polite">
        <div><span>Потужність о {time(hour)}</span><strong>{format.format(power)} кВт</strong></div>
        <div><span>Енергія за добу</span><strong>{format.format(dailyEnergy)} кВт·год</strong></div>
      </div>
      <div class="orientation" aria-hidden="true">
        <div class="panel" style:--tilt={`${tilt}deg`} style:--azimuth={`${azimuth - 180}deg`}></div>
      </div>
      <h2>Генерація за годинами</h2>
      <div class="chart" aria-label="Середня потужність за кожну годину">
        {#each profile as point (point.hour)}
          <div class="column" class:active={point.hour === hour}
            title={`${time(point.hour)} — ${format.format(point.powerKw)} кВт`}>
            <div class="bar" style:height={`${(point.powerKw / capacityKw) * 100}%`}></div>
          </div>
        {/each}
      </div>
      <div class="axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
      <p class="muted note">Оцінка для умовного дня зі сходом о 06:00 і заходом о 18:00.</p>
    </div>
  </div>
</section>

<style>
  .simulation { max-width: var(--container-width); margin: auto; padding: 2rem 1rem; color: var(--color-text); }
  h1 { font-size: clamp(1.6rem, 4vw, 2.4rem); line-height: 1.15; margin: 0 0 .65rem; }
  h2 { font-size: 1.1rem; margin: 0 0 1rem; }
  .muted { color: var(--color-muted); }
  .workspace { display: grid; grid-template-columns: minmax(240px, 1fr) minmax(0, 2fr); gap: 1rem; margin-top: 1.5rem; }
  .controls, .results { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 1rem; padding: clamp(1rem, 3vw, 1.5rem); }
  label { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .4rem; margin-bottom: 1rem; }
  label strong { color: var(--color-primary); }
  input, select { width: 100%; margin: 0; accent-color: var(--color-primary); }
  select { font: inherit; padding: .55rem; border: 1px solid var(--color-border); border-radius: .45rem; background: var(--color-surface); color: inherit; }
  .directions, .note { font-size: .85rem; margin-bottom: 0; }
  .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
  .metrics div { padding: .65rem .75rem; background: #f0fdf4; border-radius: .6rem; }
  .metrics span, .metrics strong { display: block; }
  .metrics span { font-size: .85rem; }
  .metrics strong { font-size: clamp(1rem, 3vw, 1.55rem); color: var(--color-primary); }
  .orientation { display: grid; place-items: center; height: 9rem; perspective: 380px; overflow: hidden; }
  .panel { width: 8rem; height: 5rem; border: 3px solid #64748b; border-radius: .25rem;
    background: repeating-linear-gradient(90deg, transparent 0 24%, #93c5fd 24% 25%),
      repeating-linear-gradient(0deg, #1e3a5f 0 32%, #93c5fd 32% 33.3%);
    box-shadow: 0 5px 14px #1e3a5f50; transform: rotateX(35deg) rotateZ(var(--azimuth)) rotateX(var(--tilt)); }
  .chart { display: grid; grid-template-columns: repeat(24, minmax(0, 1fr)); gap: 3px; height: 8rem;
    border-bottom: 1px solid var(--color-border); background: repeating-linear-gradient(to top, transparent 0 calc(25% - 1px), var(--color-border) calc(25% - 1px) 25%); }
  .column { display: flex; align-items: end; min-width: 0; }
  .column.active { background: #dcfce7; }
  .bar { width: 100%; background: #5da779; border-radius: .2rem .2rem 0 0; }
  .active .bar { background: var(--color-primary); }
  .axis { display: flex; justify-content: space-between; font-size: .7rem; color: var(--color-muted); padding-top: .3rem; }
  @media (max-width: 680px) { .workspace { grid-template-columns: 1fr; } }
</style>
