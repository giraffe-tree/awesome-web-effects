import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-b-utils.js';

try {
  const stage = document.querySelector('#depth-stage');
  const layers = [...document.querySelectorAll('.depth-layer')];
  const route = document.querySelector('.depth-route');
  const figure = document.querySelector('.depth-figure');
  const reticle = document.querySelector('#depth-reticle');
  const readout = document.querySelector('#depth-readout');
  const depths = [.08, .32, .68, 1];
  const state = {
    automaticPath: false,
    engaged: false,
    mode: 'idle',
    x: .5,
    y: .5,
    inputKind: 'none',
    inputCount: 0,
    pointerCaptured: false
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let motionX = .5;
  let motionY = .5;
  let activePointerId = null;
  let renders = 0;
  const xControl = animate(0, 1, {
    duration: 1,
    ease: 'linear',
    onUpdate: value => { motionX = value; }
  });
  const yControl = animate(0, 1, {
    duration: 1,
    ease: 'linear',
    onUpdate: value => { motionY = value; }
  });
  xControl.pause();
  yControl.pause();

  function updatePoint(x, y, inputKind, mode) {
    state.x = clamp(x);
    state.y = clamp(y);
    state.inputKind = inputKind;
    state.mode = mode;
    state.engaged = true;
    state.inputCount += 1;
  }

  function updateFromPointer(event, mode) {
    const bounds = stage.getBoundingClientRect();
    updatePoint(
      (event.clientX - bounds.left) / Math.max(1, bounds.width),
      (event.clientY - bounds.top) / Math.max(1, bounds.height),
      event.pointerType || 'pointer',
      mode
    );
  }

  function releasePointer(event) {
    if (activePointerId !== null && stage.hasPointerCapture?.(activePointerId)) {
      stage.releasePointerCapture(activePointerId);
    }
    if (!event || event.pointerId === activePointerId) activePointerId = null;
    state.pointerCaptured = false;
    if (state.engaged) state.mode = 'pointer';
  }

  function resetView(inputKind = 'keyboard') {
    state.x = .5;
    state.y = .5;
    state.inputKind = inputKind;
    state.inputCount += 1;
    state.mode = 'idle';
    state.engaged = false;
  }

  stage.addEventListener('pointerdown', event => {
    event.preventDefault();
    stage.focus({ preventScroll: true });
    activePointerId = event.pointerId;
    stage.setPointerCapture?.(event.pointerId);
    state.pointerCaptured = true;
    updateFromPointer(event, 'dragging');
  });
  stage.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' && !state.pointerCaptured) return;
    if (state.pointerCaptured && event.pointerId !== activePointerId) return;
    updateFromPointer(event, state.pointerCaptured ? 'dragging' : 'pointer');
  });
  stage.addEventListener('pointerup', releasePointer);
  stage.addEventListener('pointercancel', releasePointer);
  stage.addEventListener('lostpointercapture', event => {
    if (event.pointerId === activePointerId) releasePointer(event);
  });
  stage.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !state.pointerCaptured) resetView('mouse');
  });
  stage.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft: [-.06, 0],
      ArrowRight: [.06, 0],
      ArrowUp: [0, -.06],
      ArrowDown: [0, .06]
    }[event.key];
    if (!movement && !['Escape', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape' || event.key === 'Home') {
      releasePointer();
      resetView('keyboard');
      return;
    }
    updatePoint(state.x + movement[0], state.y + movement[1], 'keyboard', 'keyboard');
  });
  stage.addEventListener('blur', () => {
    releasePointer();
    resetView('focus');
  });

  function applyView() {
    xControl.time = state.x;
    yControl.time = state.y;
    const x = motionX * 2 - 1;
    const y = motionY * 2 - 1;
    const widthScale = stage.clientWidth / 320;
    const heightScale = stage.clientHeight / 180;

    layers.forEach((layer, index) => {
      const depth = depths[index];
      const translateX = x * depth * 22 * widthScale;
      const translateY = y * depth * 10 * heightScale;
      const scale = 1.015 + depth * .045;
      layer.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, ${(-depth * 24).toFixed(1)}px) scale(${scale.toFixed(3)})`;
      layer.style.filter = `brightness(${(1.03 - y * depth * .08).toFixed(3)}) saturate(${(.9 + depth * .16).toFixed(3)})`;
    });

    route.style.transform = `translate3d(${(x * 14 * widthScale).toFixed(2)}px, ${(y * 6 * heightScale).toFixed(2)}px, 0)`;
    figure.style.transform = `translate3d(${(x * 28 * widthScale).toFixed(2)}px, ${(y * 16 * heightScale).toFixed(2)}px, 0) scale(${(1 + (1 - motionY) * .12).toFixed(3)})`;
    reticle.style.left = `${(motionX * 100).toFixed(2)}%`;
    reticle.style.top = `${(motionY * 100).toFixed(2)}%`;
    stage.dataset.engaged = String(state.engaged);
    readout.textContent = state.engaged
      ? `View ${x >= 0 ? '+' : ''}${Math.round(x * 50)} / ${y >= 0 ? '+' : ''}${Math.round(y * 50)} · ${state.inputKind}`
      : 'View centered / ready';
    renders += 1;
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const bounds = stage.getBoundingClientRect();
    return layers.length === 4
      && depths.length === layers.length
      && [xControl, yControl].every(control => typeof control.pause === 'function' && control.duration === 1)
      && state.automaticPath === false
      && ['idle', 'pointer', 'dragging', 'keyboard'].includes(state.mode)
      && state.x >= 0 && state.x <= 1
      && state.y >= 0 && state.y <= 1
      && Number.isInteger(state.inputCount)
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.tabIndex === 0
      && bounds.width >= innerWidth * .99
      && bounds.height >= innerHeight * .99
      && layers.every(layer => layer.style.transform.includes('translate3d'))
      && renders > 0;
  };

  installPreviewController({
    id: 'pointer-driven-multilayer-depth-stage',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => applyView(),
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
