import { animate, clamp, easeInOut, interpolate, linear, pipe } from 'popmotion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const packet = document.querySelector('#pipeline-packet');
  const fill = document.querySelector('#pipeline-fill');
  const outputCard = document.querySelector('#output-card');
  const toggle = document.querySelector('#pipeline-toggle');
  const nodes = [...document.querySelectorAll('.pipeline-node')];
  const rawValue = document.querySelector('#raw-value');
  const clampedValue = document.querySelector('#clamped-value');
  const easedValue = document.querySelector('#eased-value');
  const mappedValue = document.querySelector('#mapped-value');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const clampUnit = value => clamp(0, 1, value);
  const normalizedPipeline = pipe(clampUnit, easeInOut);
  const mapPacketX = pipe(normalizedPipeline, interpolate([0, 1], [0, 270]));
  const mapCardX = pipe(normalizedPipeline, interpolate([0, 1], [0, 236]));
  const mapCardY = pipe(normalizedPipeline, interpolate([0, .5, 1], [0, -23, 0]));
  const mapCardRotation = pipe(normalizedPipeline, interpolate([0, .5, 1], [-7, 9, -4]));
  const mapCardScale = pipe(normalizedPipeline, interpolate([0, .5, 1], [.82, 1.18, .92]));
  const mapCardColor = pipe(normalizedPipeline, interpolate([0, .5, 1], ['#52ebff', '#8f75ff', '#ff69bd']));

  let currentRaw = 0;
  const renderPipeline = raw => {
    currentRaw = raw;
    const clamped = clampUnit(raw);
    const eased = normalizedPipeline(raw);
    const packetX = mapPacketX(raw);
    const cardX = mapCardX(raw);
    const cardY = mapCardY(raw);
    const rotation = mapCardRotation(raw);
    const scale = mapCardScale(raw);

    packet.style.transform = `translateX(${packetX}px)`;
    fill.style.transform = `scaleX(${eased})`;
    outputCard.style.transform = `translate3d(${cardX}px, ${cardY}px, 0) rotate(${rotation}deg) scale(${scale})`;
    outputCard.style.backgroundColor = mapCardColor(raw);
    rawValue.value = raw.toFixed(2);
    clampedValue.value = clamped.toFixed(2);
    easedValue.value = eased.toFixed(2);
    mappedValue.value = `${Math.round(cardX)}px`;
    nodes.forEach((node, index) => node.classList.toggle('active', eased >= index / (nodes.length - 1)));
  };

  let playback;
  let driverStep;
  let previousTime = 0;
  const manualDriver = update => {
    driverStep = update;
    return {
      start() {},
      stop() { if (driverStep === update) driverStep = null; }
    };
  };

  const resetPlayback = () => {
    playback?.stop();
    playback = animate({
      from: 0,
      to: 1,
      duration: 1100,
      ease: linear,
      repeat: Infinity,
      repeatType: 'mirror',
      driver: manualDriver,
      onUpdate: renderPipeline
    });
    driverStep?.(0);
    previousTime = 0;
  };

  let paused = false;
  toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Resume flow' : 'Pause flow';
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    resetPlayback();
    const before = currentRaw;
    driverStep?.(550);
    const after = currentRaw;
    const mapped = outputCard.style.transform;
    resetPlayback();
    return typeof animate === 'function'
      && typeof pipe === 'function'
      && typeof interpolate === 'function'
      && after > before
      && mapped.includes('translate3d');
  };

  resetPlayback();
  const render = (time, manual) => {
    if (reducedMotion.matches) {
      renderPipeline(1);
      return;
    }
    if (paused && !manual) return;
    if (time < previousTime) resetPlayback();
    const delta = Math.max(0, (time - previousTime) * 1000);
    driverStep?.(delta);
    previousTime = time;
  };

  installPreviewController({
    id: 'functional-value-pipeline',
    library: 'popmotion@11.0.5',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
