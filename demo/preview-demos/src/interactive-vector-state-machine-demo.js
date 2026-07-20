import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const consoleElement = document.querySelector('#vector-console');
  const core = document.querySelector('#machine-core');
  const orbit = document.querySelector('#machine-orbit');
  const rays = document.querySelector('#response-rays');
  const shape = document.querySelector('#core-shape');
  const glyph = document.querySelector('#state-glyph');
  const name = document.querySelector('#state-name');
  const description = document.querySelector('#state-description');
  const rail = [...document.querySelectorAll('.state-rail i')];
  const states = [
    { id: 'idle', label: 'Idle', description: 'A calm orbit keeps the agent available without demanding attention.', color: '#4f6cff' },
    { id: 'listening', label: 'Listening', description: 'The vector opens into a receptive aperture while signals gather.', color: '#08a67a' },
    { id: 'responding', label: 'Responding', description: 'A bright radial confirmation announces that the state has resolved.', color: '#ff6b52' }
  ];
  const coreMotion = animate(core, {
    scale: [.88, 1.06, .94, 1.13, .88],
    rotate: [0, -5, 3, 0, 0]
  }, { duration: 3, ease: 'linear' });
  const orbitMotion = animate(orbit, { rotate: [0, 360] }, { duration: 3, ease: 'linear' });
  const rayMotion = animate(rays, {
    opacity: [0, 0, 0, 1, 0],
    scale: [.72, .72, .72, 1.1, 1.28]
  }, { duration: 3, ease: 'linear' });
  [coreMotion, orbitMotion, rayMotion].forEach(control => control.pause());

  let forcedState = null;
  let lastStateIndex = -1;
  const statePaths = {
    idle: 'M60 28C79 28 94 42 94 60S79 92 60 92 26 78 26 60 41 28 60 28Z',
    listening: 'M60 21C84 21 103 39 103 60S84 99 60 99 17 81 17 60 36 21 60 21Z',
    responding: 'M60 26 69 42 88 38 84 57 100 68 81 76 80 96 63 87 48 99 43 80 23 78 35 62 24 46 44 45Z'
  };

  function applyState(index) {
    if (index === lastStateIndex) return;
    lastStateIndex = index;
    const state = states[index];
    consoleElement.dataset.state = state.id;
    consoleElement.style.setProperty('--state-color', state.color);
    name.textContent = state.label;
    description.textContent = state.description;
    shape.setAttribute('d', statePaths[state.id]);
    shape.setAttribute('stroke', state.color);
    glyph.setAttribute('fill', state.id === 'listening' ? '#073d31' : state.id === 'responding' ? '#4b1209' : '#16221b');
    rail.forEach((segment, segmentIndex) => segment.classList.toggle('active', segmentIndex === index));
  }

  function seek(control, seconds) {
    control.time = Math.max(0, Math.min(control.duration, seconds));
  }

  function advanceState() {
    forcedState = forcedState === null ? (lastStateIndex + 1) % states.length : (forcedState + 1) % states.length;
    applyState(forcedState);
  }
  consoleElement.addEventListener('click', advanceState);
  consoleElement.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    advanceState();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const controls = [coreMotion, orbitMotion, rayMotion];
    return states.length === 3
      && rail.length === 3
      && document.querySelectorAll('.vector-stage svg path').length >= 4
      && controls.every(control => typeof control.play === 'function' && typeof control.pause === 'function' && control.duration === 3);
  };

  installPreviewController({
    id: 'interactive-vector-state-machine',
    library: 'motion@12.42.2',
    renderer: 'svg',
    render: time => {
      const phase = ((Number(time) || 0) % 3 + 3) % 3;
      const stateIndex = forcedState ?? Math.min(2, Math.floor(phase));
      applyState(stateIndex);
      seek(coreMotion, phase);
      seek(orbitMotion, phase);
      seek(rayMotion, phase);
    },
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
