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
  <div class="heading"><a class="back" href="/features">← До можливостей</a><h1 id="simulation-title">Симуляція сонячної генерації</h1>
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
        <input type="range" min="0" max="23" bind:value={hour} aria-valuetext={time(hour)} />
      </label>
      <label>Номінальна потужність <strong>{format.format(capacityKw)} кВт</strong>
        <input type="range" min="1" max="20" step="0.5" bind:value={capacityKw} />
      </label>
    </div>
      <div class="card"><h2>Орієнтація панелей</h2>
      <label>Нахил <strong>{tilt}°</strong>
        <input type="range" min="0" max="90" bind:value={tilt} />
      </label>
      <label>Азимут <strong>{azimuth}°</strong>
        <input type="range" min="0" max="359" bind:value={azimuth} />
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
  .simulation { max-width: 1280px; margin: auto; padding: 1.25rem clamp(1rem, 3vw, 2rem) 2.5rem; color: #e3edf7; }
  .heading { border-bottom: 1px solid #30485c; padding-bottom: 1rem; }
  .back { display: inline-block; border: 1px solid #3d5a74; border-radius: .35rem; padding: .24rem .65rem; color: #a9c4db; font-size: .82rem; text-decoration: none; margin-bottom: .8rem; }
  .back:hover { color: #67f3ec; border-color: #67f3ec; }
  h1 { font-size: clamp(1.4rem, 3.5vw, 2rem); line-height: 1.15; margin: 0; }
  h2 { font-size: 1rem; margin: 0 0 .75rem; }
  .muted { color: #a4b9cc; margin: .45rem 0 0; }
  .workspace { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(0, 3fr); gap: 1rem; margin-top: 1rem; }
  .controls { display: grid; align-content: start; gap: .85rem; }
  .card, .results { background: linear-gradient(145deg, #172b3d, #111e2c 65%); border: 1px solid #2e5268; border-radius: .65rem; padding: clamp(.85rem, 2vw, 1.25rem); box-shadow: inset 0 0 12px #4ec9ff10; }
  label { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .45rem; margin-bottom: .9rem; font-size: .9rem; }
  label:last-child { margin-bottom: 0; }
  strong { color: #76f5ed; font-variant-numeric: tabular-nums; }
  input, select { width: 100%; margin: 0; accent-color: #42e1db; color-scheme: dark; }
  select { font: inherit; padding: .45rem .55rem; border: 1px solid #3b5d77; border-radius: .35rem; background: #21384e; color: inherit; }
  :is(a, input, select):focus-visible { outline: 2px solid #76f5ed; outline-offset: 3px; }
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
  .metrics div { min-width: 0; padding: .55rem .65rem; background: #0c1c2a; border: 1px solid #2d5368; border-radius: .4rem; }
  .metrics span, .metrics strong { display: block; }
  .metrics span { font-size: .78rem; color: #adc2d5; }
  .metrics strong { font-size: clamp(1rem, 2.4vw, 1.45rem); }
  .chart { display: grid; grid-template-columns: repeat(24, minmax(0, 1fr)); gap: 3px; height: 6rem;
    border-bottom: 1px solid #48657b; background: repeating-linear-gradient(to top, transparent 0 calc(25% - 1px), #2a4155 calc(25% - 1px) 25%); }
  .column { display: flex; align-items: end; min-width: 0; }
  .column.active { background: #38e7dd20; }
  .bar { width: 100%; background: linear-gradient(#58e9e0, #285ea9); border-radius: .15rem .15rem 0 0; }
  .active .bar { background: #76fff1; box-shadow: 0 0 9px #5effed80; }
  .axis { display: flex; justify-content: space-between; font-size: .7rem; color: #a4b9cc; padding-top: .3rem; }
  @media (max-width: 680px) { .workspace { grid-template-columns: 1fr; } }
</style>
