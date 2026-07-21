import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const MAX_SPEED = 1550;
const REST_THRESHOLD = 7;
const DAMPING = 2.7;

try {
  const stage = document.querySelector('#marquee-stage');
  const track = document.querySelector('#marquee-track');
  const primarySegment = document.querySelector('#primary-segment');
  const windowElement = document.querySelector('#marquee-window');
  const meter = document.querySelector('#velocity-meter');
  const directionOutput = document.querySelector('#direction-output');
  const speedOutput = document.querySelector('#speed-output');
  const sourceOutput = document.querySelector('#source-output');
  const resetControl = document.querySelector('#reset-control');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    task: 'human-paced-arrival-board',
    acceptedInputs: ['wheel', 'mouse', 'touch', 'pen', 'keyboard', 'control'],
    userInputRequired: true,
    automaticPlayback: false,
    automaticFallback: false,
    previewClockDriven: false,
    syntheticInputDispatch: false,
    inertiaInputOwned: true,
    velocity: 0,
    offset: 0,
    segmentWidth: 0,
    motion: null,
    lastFrameAt: performance.now(),
    lastWheelAt: 0,
    pointerId: null,
    pointerX: 0,
    pointerAt: 0,
    dragging: false,
    inputCount: 0,
    wheelInputCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    dragUpdateCount: 0,
    resetCount: 0,
    positiveSampleCount: 0,
    negativeSampleCount: 0,
    directionReversalCount: 0,
    maxAbsVelocity: 0,
    inputSource: 'none',
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    lastSignedSample: 0,
    renderCount: 0,
    initialTransform: '',
    initialStable: false,
    resizeCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function formatVelocity(value) {
    const rounded = Math.round(Math.abs(value));
    const sign = value > REST_THRESHOLD ? '+' : value < -REST_THRESHOLD ? '−' : '±';
    return `${sign}${String(rounded).padStart(3, '0')} <span>px/s</span>`;
  }

  function classifyVelocity(value) {
    const speed = Math.abs(value);
    if (speed < REST_THRESHOLD) return 'At rest';
    if (speed < 260) return 'Slow scan';
    if (speed < 720) return 'Brisk browse';
    return 'Express seek';
  }

  function directionFor(value) {
    if (value < -REST_THRESHOLD) return 'next';
    if (value > REST_THRESHOLD) return 'previous';
    return 'idle';
  }

  function updateReadout() {
    const direction = directionFor(state.velocity);
    const lastDirection = directionFor(state.lastSignedSample);
    const speed = Math.abs(state.velocity);
    const speedLevel = `${Math.min(100, speed / MAX_SPEED * 100).toFixed(1)}%`;
    stage.dataset.direction = direction;
    stage.style.setProperty('--speed-level', speedLevel);
    windowElement.style.setProperty('--tilt', `${clamp(state.velocity / MAX_SPEED * -1.15, -1.15, 1.15).toFixed(2)}deg`);
    meter.innerHTML = formatVelocity(state.velocity);
    speedOutput.textContent = classifyVelocity(state.velocity);
    sourceOutput.textContent = state.inputSource === 'none'
      ? reducedMotion.matches ? 'Direct motion · no inertia' : 'No input sampled'
      : `${state.inputSource} · last ${state.lastSignedSample >= 0 ? '+' : '−'}${Math.round(Math.abs(state.lastSignedSample))} px/s`;
    directionOutput.textContent = direction === 'next'
      ? 'Next arrivals →'
      : direction === 'previous'
        ? '← Previous arrivals'
        : state.inputSource === 'reset'
          ? 'Reset · ready to browse'
          : state.inputCount
            ? lastDirection === 'next' ? 'Settled from next →' : '← Settled from previous'
          : 'At rest · input to browse';
  }

  function setTrackPosition() {
    if (!state.motion || state.segmentWidth <= 0) return;
    const phase = modulo(-state.offset, state.segmentWidth);
    state.motion.time = phase / state.segmentWidth;
  }

  function createMotionRail() {
    const width = primarySegment.getBoundingClientRect().width;
    if (!(width > 0)) throw new Error('Arrival rail has no measurable width');
    state.motion?.cancel?.();
    state.segmentWidth = width;
    state.offset = modulo(state.offset, width);
    state.motion = animate(track, { x: [0, -width] }, { duration: 1, ease: 'linear', autoplay: false });
    state.motion.pause();
    setTrackPosition();
  }

  function recordTrustedInput(kind, source, event) {
    if (!event || event.isTrusted !== true) return false;
    state.inputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'wheel') state.wheelInputCount += 1;
    else if (kind === 'keyboard') state.keyboardInputCount += 1;
    else if (kind === 'control') state.controlInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (kind === 'touch') state.touchInputCount += 1;
      if (kind === 'pen') state.penInputCount += 1;
    }
    return true;
  }

  function registerInput(sample, source, blend = 0.84, event = null, kind = source) {
    if (!recordTrustedInput(kind, source, event)) return false;
    const signedSample = clamp(sample, -MAX_SPEED, MAX_SPEED);
    const previousDirection = Math.sign(state.lastSignedSample);
    const nextDirection = Math.sign(signedSample);
    if (previousDirection && nextDirection && previousDirection !== nextDirection) state.directionReversalCount += 1;
    if (signedSample > 0) state.positiveSampleCount += 1;
    if (signedSample < 0) state.negativeSampleCount += 1;
    state.maxAbsVelocity = Math.max(state.maxAbsVelocity, Math.abs(signedSample));
    state.inputSource = source;
    state.lastSignedSample = signedSample;
    state.velocity = reducedMotion.matches
      ? 0
      : clamp(state.velocity * (1 - blend) + signedSample * blend, -MAX_SPEED, MAX_SPEED);
    updateReadout();
    return true;
  }

  function wheelPixels(event) {
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 18
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? innerHeight
        : 1;
    const dominant = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    return dominant * unit;
  }

  stage.addEventListener('wheel', event => {
    if (!event.isTrusted) return;
    event.preventDefault();
    const now = performance.now();
    const elapsed = state.lastWheelAt ? clamp(now - state.lastWheelAt, 8, 80) : 16;
    const distance = wheelPixels(event);
    const signedVelocity = clamp(-distance / elapsed * 1000, -MAX_SPEED, MAX_SPEED);
    if (reducedMotion.matches) {
      state.offset -= clamp(distance, -120, 120);
      setTrackPosition();
    }
    registerInput(signedVelocity, 'wheel', 0.84, event, 'wheel');
    state.lastWheelAt = now;
  }, { passive: false });

  stage.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest('button')) return;
    const pointerType = event.pointerType || 'mouse';
    if (!recordTrustedInput(pointerType, `pointer-${pointerType}-capture`, event)) return;
    state.pointerId = event.pointerId;
    state.pointerX = event.clientX;
    state.pointerAt = event.timeStamp;
    state.dragging = true;
    stage.dataset.dragging = 'true';
    stage.setPointerCapture?.(event.pointerId);
    state.pointerCaptureCount += 1;
  });

  stage.addEventListener('pointermove', event => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    event.preventDefault();
    const elapsed = clamp(event.timeStamp - state.pointerAt, 8, 70);
    const distance = event.clientX - state.pointerX;
    if (Math.abs(distance) < 0.25) return;
    state.offset += distance;
    setTrackPosition();
    const pointerType = event.pointerType || 'mouse';
    if (!registerInput(distance / elapsed * 1000, pointerType === 'mouse' ? 'drag' : pointerType, 0.9, event, pointerType)) return;
    state.dragUpdateCount += 1;
    state.pointerX = event.clientX;
    state.pointerAt = event.timeStamp;
  });

  function finishPointer(event) {
    if (event.pointerId !== state.pointerId) return;
    state.dragging = false;
    state.pointerId = null;
    stage.dataset.dragging = 'false';
    stage.releasePointerCapture?.(event.pointerId);
    state.pointerReleaseCount += 1;
    if (reducedMotion.matches) {
      state.velocity = 0;
      updateReadout();
    }
  }

  stage.addEventListener('pointerup', finishPointer);
  stage.addEventListener('pointercancel', finishPointer);

  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'r', 'R'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key.toLowerCase() === 'r') {
      reset(event, `keyboard-${event.key}`, 'keyboard');
      return;
    }
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    const impulse = direction * (event.shiftKey ? 980 : 430);
    if (reducedMotion.matches) {
      state.offset += direction * (event.shiftKey ? 108 : 54);
      setTrackPosition();
    }
    registerInput(impulse, 'keyboard', 0.9, event, 'keyboard');
  });

  function reset(event, source = 'control-reset', kind = 'control') {
    if (!recordTrustedInput(kind, source, event)) return;
    state.resetCount += 1;
    state.velocity = 0;
    state.offset = 0;
    state.inputSource = 'reset';
    state.lastSignedSample = 0;
    state.lastWheelAt = 0;
    state.dragging = false;
    stage.dataset.dragging = 'false';
    setTrackPosition();
    updateReadout();
  }

  resetControl.addEventListener('click', event => reset(event));
  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) state.velocity = 0;
    updateReadout();
  });

  const resizeObserver = new ResizeObserver(() => {
    if (!state.motion) return;
    state.resizeCount += 1;
    createMotionRail();
  });

  function render(_previewTime) {
    const now = performance.now();
    const deltaSeconds = clamp((now - state.lastFrameAt) / 1000, 0, 0.034);
    state.lastFrameAt = now;

    if (!reducedMotion.matches && !state.dragging && Math.abs(state.velocity) >= REST_THRESHOLD) {
      state.offset += state.velocity * deltaSeconds;
      state.velocity *= Math.exp(-DAMPING * deltaSeconds);
      if (Math.abs(state.velocity) < REST_THRESHOLD) state.velocity = 0;
      setTrackPosition();
      updateReadout();
    } else if (state.dragging) {
      setTrackPosition();
    }
    state.renderCount += 1;
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const bounds = stage.getBoundingClientRect();
    const segmentBounds = primarySegment.getBoundingClientRect();
    const duplicateSegments = track.querySelectorAll('.rail-segment');
    return (
      typeof animate === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && Boolean(state.motion)
      && typeof state.motion.pause === 'function'
      && state.motion.duration === 1
      && state.segmentWidth > 280
      && Math.abs(segmentBounds.width - state.segmentWidth) < 1
      && duplicateSegments.length === 2
      && duplicateSegments[1].getAttribute('aria-hidden') === 'true'
      && stage.dataset.previewMechanism === 'motion-signed-velocity-marquee'
      && state.task === 'human-paced-arrival-board'
      && state.acceptedInputs.join('|') === 'wheel|mouse|touch|pen|keyboard|control'
      && state.userInputRequired === true
      && state.automaticPlayback === false
      && state.automaticFallback === false
      && state.previewClockDriven === false
      && state.syntheticInputDispatch === false
      && state.inertiaInputOwned === true
      && state.inputCount === state.wheelInputCount + state.pointerInputCount + state.keyboardInputCount + state.controlInputCount
      && state.touchInputCount + state.penInputCount <= state.pointerInputCount
      && state.pointerReleaseCount <= state.pointerCaptureCount
      && stage.dataset.boundary === 'seamless-loop'
      && bounds.width >= innerWidth - 1
      && bounds.height >= innerHeight - 1
      && state.initialStable
      && Number.isFinite(state.velocity)
      && Number.isFinite(state.offset)
      && Math.abs(state.velocity) <= MAX_SPEED
      && resetControl instanceof HTMLButtonElement
      && state.renderCount > 0
    );
  };

  const ready = (async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(resolve));
    createMotionRail();
    resizeObserver.observe(primarySegment);
    state.lastFrameAt = performance.now();
    updateReadout();
    setTrackPosition();
    render(0);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const firstTransform = getComputedStyle(track).transform;
    await new Promise(resolve => requestAnimationFrame(resolve));
    const secondTransform = getComputedStyle(track).transform;
    state.initialTransform = firstTransform;
    state.initialStable = (
      firstTransform === secondTransform
      && state.velocity === 0
      && state.offset === 0
      && state.inputCount === 0
      && state.lastSignedSample === 0
    );
    if (!window.__PREVIEW_RUNTIME_ASSERT__()) throw new Error('Velocity marquee runtime contract failed');
  })();

  installPreviewController({
    id: 'velocity-reactive-marquee',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
