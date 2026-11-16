<script lang="ts">
  let { tilt, azimuth }: { tilt: number; azimuth: number } = $props();

  let viewAngle = $state(25);
  let elevation = $state(55);

  function resetView() {
    viewAngle = 25;
    elevation = 55;
  }
</script>

<section class="viewer" aria-labelledby="panel-title">
  <div class="header">
    <h3 id="panel-title">3D-модель панелі</h3>
    <button type="button" onclick={resetView}>Скинути ракурс</button>
  </div>

  <div class="scene" aria-hidden="true" style:--view={`${viewAngle}deg`} style:--elevation={`${elevation}deg`}>
    <div class="world">
      <div class="ground"></div>
      <div class="compass"><span>Пн</span><span>Сх</span><span>Пд</span><span>Зх</span></div>
      <div class="mount" style:--azimuth={`${azimuth - 180}deg`} style:--tilt={`${tilt}deg`}>
        <div class="direction"></div>
        <div class="panel">
          <div class="cells"></div>
          <div class="backplate"></div>
        </div>
      </div>
    </div>
  </div>

  <p class="angles">Нахил панелі <strong>{tilt}°</strong> · Азимут <strong>{azimuth}°</strong></p>
  <div class="controls">
    <label>Поворот огляду <strong>{viewAngle}°</strong>
      <input type="range" min="-180" max="180" bind:value={viewAngle} />
    </label>
    <label>Кут огляду <strong>{elevation}°</strong>
      <input type="range" min="10" max="85" bind:value={elevation} />
    </label>
  </div>
</section>

<style>
  .viewer { margin: 1rem 0; padding: .9rem; border: 1px solid #29465e; border-radius: .75rem; background: #0d1520; }
  .header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; }
  h3 { margin: 0; font-size: .9rem; }
  button { border: 1px solid #327079; border-radius: .5rem; background: #164452; color: #cffafe; padding: .35rem .6rem; font: inherit; font-size: .75rem; cursor: pointer; }
  :is(button, input):focus-visible { outline: 2px solid #22d3ee; outline-offset: 3px; }
  .scene { display: grid; place-items: center; height: 13rem; perspective: 620px; overflow: hidden; isolation: isolate; }
  .world, .mount, .panel { position: relative; transform-style: preserve-3d; }
  .world { width: 11rem; height: 11rem; transform: rotateX(calc(90deg - var(--elevation))) rotateZ(var(--view)); }
  .ground { position: absolute; inset: 0; border-radius: 50%; border: 1px solid #276779; background: radial-gradient(circle, #12344b, #0d1520 72%); }
  .compass { position: absolute; inset: 0; display: grid; place-items: center; font-size: .85rem; color: #94a3b8; }
  .compass span { position: absolute; }
  .compass span:nth-child(1) { top: 0; color: #5eead4; }
  .compass span:nth-child(2) { right: .2rem; }
  .compass span:nth-child(3) { bottom: 0; }
  .compass span:nth-child(4) { left: .2rem; }
  .mount { position: absolute; inset: 0; transform: rotateZ(var(--azimuth)); display: grid; place-items: center; }
  .direction { position: absolute; bottom: .75rem; width: .75rem; height: .9rem; background: #5eead4; clip-path: polygon(0 55%, 33% 55%, 33% 0, 67% 0, 67% 55%, 100% 55%, 50% 100%); }
  .panel { width: 7.5rem; height: 4.5rem; transform: translateZ(2.45rem) rotateX(var(--tilt)); }
  .cells, .backplate { position: absolute; inset: 0; border: 2px solid #8db9d3; border-radius: .2rem; backface-visibility: hidden; }
  .cells { background: repeating-linear-gradient(90deg, transparent 0 15.5%, #6db7dc 16% 16.67%),
    repeating-linear-gradient(0deg, transparent 0 23%, #6db7dc 24% 25%), linear-gradient(135deg, #3279cf, #102d59); box-shadow: 0 0 .65rem #22d3ee45; }
  .backplate { background: #1c3045; transform: translateZ(-3px) rotateY(180deg); }
  .angles { margin: 0 0 .65rem; font-size: .8rem; color: #94a3b8; }
  strong { color: #22d3ee; }
  .controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr)); gap: .65rem; }
  label { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .3rem; font-size: .8rem; }
  input { width: 100%; margin: 0; color-scheme: dark; accent-color: #22d3ee; cursor: pointer; }
</style>
