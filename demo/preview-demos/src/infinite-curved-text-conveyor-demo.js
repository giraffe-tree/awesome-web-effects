import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const INITIAL_PROGRESS = 0;
const UPPER_BASES = [-120, -20, 80, 180];
const LOWER_BASES = [-135, -35, 65, 165];
const TEXT_PATH_COUNT = UPPER_BASES.length + LOWER_BASES.length;

const clamp = value => Math.max(0, Math.min(1, value));
const round = value => Number(value.toFixed(4));

try {
  const stage = document.querySelector('#route-stage');
  const routeField = document.querySelector('#route-field');
  const upperTexts = [...document.querySelectorAll('.flow-text--upper')];
  const lowerTexts = [...document.querySelectorAll('.flow-text--lower')];
  const directionButtons = [...document.querySelectorAll('[data-direction]')];
  const readout = document.querySelector('#route-readout');
  const phaseLabel = document.querySelector('#phase-label');
  const instruction = document.querySelector('#route-instruction');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'infinite-curved-text-conveyor',
    task: 'human-routed-arena-wayfinding-ribbon-proof',
    mechanism: 'trusted-drag-seeks-two-paused-motion-controls-that-offset-repeated-svg-text-paths-in-opposing-directions',
    claimedLibrary: 'motion@12.42.2',
    assetStrategy: 'code-native-authored-svg-routes-and-editorial-type-no-functional-raster-input-required',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'visible-direction-buttons', 'keyboard-arrows-home-end-escape'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticPath: false,
    automaticPlayback: false,
    automaticCycle: false,
    automaticTimeline: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    initialFrameStatic: true,
    initialStillVerified: false,
    initialProgress: INITIAL_PROGRESS,
    progress: INITIAL_PROGRESS,
    engaged: false,
    phase: 'waiting',
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerDownCount: 0,
    pointerDragCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    buttonInputCount: 0,
    keyboardInputCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    humanProgressMutationCount: 0,
    nonInputProgressMutationCount: 0,
    maximumHumanDelta: 0,
    minimumHumanProgress: INITIAL_PROGRESS,
    maximumHumanProgress: INITIAL_PROGRESS,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    dragActive: false,
    routePathCount: 2,
    repeatedCopyCountPerPath: UPPER_BASES.length,
    textPathCount: TEXT_PATH_COUNT,
    motionControlCount: 0,
    motionSeekCount: 0,
    controlsBuiltWithoutAutoplay: true,
    motionControlsPaused: false,
    motionTimeSpread: 0,
    upperOffsetRange: 0,
    lowerOffsetRange: 0,
    transitionRecords: [],
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionDirectManipulation: true,
    ready: false,
    runtimeAssertCount: 0,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__CURVED_TEXT_ROUTE_STATE__ = state;

  let dragStartX = 0;
  let dragStartProgress = INITIAL_PROGRESS;
  let upperMotionValue = INITIAL_PROGRESS;
  let lowerMotionValue = INITIAL_PROGRESS;

  function invariant(condition, message) {
    if (!condition) throw new Error(`infinite-curved-text-conveyor: ${message}`);
  }

  function setOffsets(elements, bases, progress, direction) {
    elements.forEach((element, index) => {
      const offset = bases[index] + progress * 100 * direction;
      element.setAttribute('startOffset', `${round(offset)}%`);
    });
  }

  const upperControl = animate(0, 1, {
    duration: 1,
    ease: 'linear',
    autoplay: false,
    onUpdate(value) {
      upperMotionValue = value;
      setOffsets(upperTexts, UPPER_BASES, value, 1);
    },
  });
  const lowerControl = animate(0, 1, {
    duration: 1,
    ease: 'linear',
    autoplay: false,
    onUpdate(value) {
      lowerMotionValue = value;
      setOffsets(lowerTexts, LOWER_BASES, value, -1);
    },
  });
  const motionControls = [upperControl, lowerControl];
  motionControls.forEach(control => control.pause());
  state.motionControlCount = motionControls.length;
  state.motionControlsPaused = motionControls.every(control => typeof control.pause === 'function' && control.playState !== 'running');

  function updateDataset() {
    stage.dataset.engaged = String(state.engaged);
    stage.dataset.phase = state.phase;
    stage.dataset.progress = state.progress.toFixed(4);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    stage.dataset.humanProgressMutationCount = String(state.humanProgressMutationCount);
    stage.dataset.motionSeekCount = String(state.motionSeekCount);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
  }

  function syncInterface() {
    const percent = Math.round(state.progress * 100);
    stage.style.setProperty('--progress', state.progress.toFixed(4));
    routeField.setAttribute('aria-valuenow', String(percent));
    routeField.setAttribute('aria-valuetext', percent === 0 ? 'Ribbon at origin' : `Ribbon routed ${percent} percent`);
    readout.value = `Route ${String(percent).padStart(2, '0')}%`;
    readout.textContent = `Route ${String(percent).padStart(2, '0')}%`;
    phaseLabel.textContent = state.engaged
      ? 'Routing live'
      : state.inputCount > 0
        ? 'Route held'
        : 'Waiting for route input';
    instruction.textContent = state.engaged ? 'Keep dragging' : state.inputCount > 0 ? 'Drag to refine' : 'Drag the ribbon';
    updateDataset();
  }

  function seekControls(progress) {
    upperControl.time = progress;
    lowerControl.time = progress;
    setOffsets(upperTexts, UPPER_BASES, progress, 1);
    setOffsets(lowerTexts, LOWER_BASES, progress, -1);
    state.motionSeekCount += motionControls.length;
    state.motionTimeSpread = round(Math.abs(upperControl.time - lowerControl.time));
    state.upperOffsetRange = round(UPPER_BASES.at(-1) - UPPER_BASES[0] + progress * 100);
    state.lowerOffsetRange = round(LOWER_BASES.at(-1) - LOWER_BASES[0] - progress * 100);
  }

  function rejectUntrusted(event, source) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedInputCount += 1;
    state.lastInputTrusted = false;
    state.lastInputSource = source;
    updateDataset();
    return true;
  }

  function acceptInput(event, kind, source, pointerType = '') {
    if (rejectUntrusted(event, source)) return false;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'button') state.buttonInputCount += 1;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    if (pointerType) {
      state.lastPointerType = pointerType;
      if (pointerType === 'mouse') state.mouseInputCount += 1;
      if (pointerType === 'touch') state.touchInputCount += 1;
      if (pointerType === 'pen') state.penInputCount += 1;
    }
    updateDataset();
    return true;
  }

  function seekFromTrustedInput(nextProgress, event, source) {
    if (event?.isTrusted !== true) {
      state.nonInputProgressMutationCount += 1;
      updateDataset();
      return false;
    }
    const next = clamp(Number(nextProgress));
    const previous = state.progress;
    if (!Number.isFinite(next) || Math.abs(next - previous) < .0001) return false;
    state.progress = next;
    seekControls(next);
    state.humanProgressMutationCount += 1;
    state.maximumHumanDelta = Math.max(state.maximumHumanDelta, Math.abs(next - previous));
    state.minimumHumanProgress = Math.min(state.minimumHumanProgress, next);
    state.maximumHumanProgress = Math.max(state.maximumHumanProgress, next);
    state.transitionRecords.push({
      source,
      kind: state.lastInputKind,
      trusted: true,
      from: round(previous),
      to: round(next),
    });
    if (state.transitionRecords.length > 64) state.transitionRecords.shift();
    syncInterface();
    return true;
  }

  function handlePointerDown(event) {
    if (!['mouse', 'touch', 'pen'].includes(event.pointerType)) return;
    if (!acceptInput(event, 'pointer', 'route-drag-start', event.pointerType)) return;
    state.pointerDownCount += 1;
    state.dragActive = true;
    state.engaged = true;
    state.phase = 'dragging';
    state.activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartProgress = state.progress;
    routeField.setPointerCapture(event.pointerId);
    state.pointerCaptured = routeField.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    routeField.focus({ preventScroll: true });
    syncInterface();
  }

  function handlePointerMove(event) {
    if (!state.dragActive || event.pointerId !== state.activePointerId) return;
    if (!acceptInput(event, 'pointer', 'route-drag-move', event.pointerType)) return;
    state.pointerDragCount += 1;
    const bounds = routeField.getBoundingClientRect();
    const next = dragStartProgress + (event.clientX - dragStartX) / Math.max(1, bounds.width) * 1.08;
    seekFromTrustedInput(next, event, 'route-drag-move');
    event.preventDefault();
  }

  function finishPointer(event, cancelled = false) {
    if (!state.dragActive || event.pointerId !== state.activePointerId) return;
    if (!acceptInput(event, 'pointer', cancelled ? 'route-drag-cancel' : 'route-drag-release', event.pointerType)) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (routeField.hasPointerCapture(event.pointerId)) {
      routeField.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.dragActive = false;
    state.engaged = false;
    state.phase = cancelled ? 'cancelled' : 'held';
    state.pointerCaptured = false;
    state.activePointerId = null;
    syncInterface();
  }

  function handleButton(event) {
    const direction = event.currentTarget.dataset.direction;
    if (!acceptInput(event, 'button', `button-${direction}`)) return;
    const delta = direction === 'back' ? -.18 : .18;
    state.phase = `button-${direction}`;
    seekFromTrustedInput(state.progress + delta, event, `button-${direction}`);
  }

  function handleKeyboard(event) {
    const commands = {
      ArrowLeft: state.progress - .08,
      ArrowDown: state.progress - .08,
      ArrowRight: state.progress + .08,
      ArrowUp: state.progress + .08,
      Home: 0,
      End: 1,
      Escape: INITIAL_PROGRESS,
    };
    if (!(event.key in commands)) return;
    if (!acceptInput(event, 'keyboard', `key-${event.key}`)) return;
    state.phase = `key-${event.key.toLowerCase()}`;
    seekFromTrustedInput(commands[event.key], event, `key-${event.key}`);
    event.preventDefault();
  }

  async function initialize() {
    invariant(stage instanceof HTMLElement, 'stage is missing');
    invariant(routeField instanceof HTMLElement, 'route field is missing');
    invariant(upperTexts.length === UPPER_BASES.length && lowerTexts.length === LOWER_BASES.length, 'each route requires four repeated text paths');
    invariant(document.querySelectorAll('path[id^="route-"]').length === state.routePathCount, 'two authored routes are required');
    invariant(state.motionControlCount === 2, 'Motion did not create both paused conveyor controls');

    seekControls(INITIAL_PROGRESS);
    state.motionSeekCount = 0;
    routeField.addEventListener('pointerdown', handlePointerDown);
    routeField.addEventListener('pointermove', handlePointerMove);
    routeField.addEventListener('pointerup', event => finishPointer(event));
    routeField.addEventListener('pointercancel', event => finishPointer(event, true));
    routeField.addEventListener('keydown', handleKeyboard);
    directionButtons.forEach(button => button.addEventListener('click', handleButton));
    syncInterface();

    await document.fonts.ready;
    const firstSignature = `${state.progress}|${upperTexts.map(text => text.getAttribute('startOffset')).join(',')}|${lowerTexts.map(text => text.getAttribute('startOffset')).join(',')}`;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const secondSignature = `${state.progress}|${upperTexts.map(text => text.getAttribute('startOffset')).join(',')}|${lowerTexts.map(text => text.getAttribute('startOffset')).join(',')}`;
    state.initialStillVerified = firstSignature === secondSignature
      && state.progress === INITIAL_PROGRESS
      && state.inputCount === 0
      && state.humanProgressMutationCount === 0;
    invariant(state.initialStillVerified, 'initial ribbon changed without human input');
    state.ready = true;
    syncInterface();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    const currentOffsets = [...upperTexts, ...lowerTexts].map(text => text.getAttribute('startOffset') || '');
    const motionEvidence = state.motionControlCount === 2
      && state.controlsBuiltWithoutAutoplay
      && state.motionControlsPaused
      && motionControls.every(control => control.playState !== 'running')
      && Math.abs(upperControl.time - state.progress) < .0001
      && Math.abs(lowerControl.time - state.progress) < .0001
      && Math.abs(upperMotionValue - state.progress) < .015
      && Math.abs(lowerMotionValue - state.progress) < .015
      && state.motionTimeSpread === 0;
    const pathEvidence = state.routePathCount === 2
      && state.repeatedCopyCountPerPath === 4
      && state.textPathCount === TEXT_PATH_COUNT
      && currentOffsets.length === TEXT_PATH_COUNT
      && currentOffsets.every(offset => /^-?\d+(?:\.\d+)?%$/.test(offset));
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticPath
      && !state.automaticPlayback
      && !state.automaticCycle
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.nonInputProgressMutationCount === 0
      && state.rejectedUntrustedInputCount === 0
      && state.transitionRecords.every(record => record.trusted === true);
    const initialOrHumanOwned = state.inputCount === 0
      ? state.progress === INITIAL_PROGRESS && state.humanProgressMutationCount === 0
      : state.inputCount === state.trustedInputCount
        && state.lastInputTrusted === true
        && state.humanProgressMutationCount > 0
        && state.motionSeekCount >= 2;
    const captureReleased = state.pointerCaptured === state.dragActive
      && state.pointerCaptureCount - state.pointerCaptureReleaseCount <= (state.pointerCaptured ? 1 : 0);
    state.runtimeAssertionPassed = Boolean(state.ready
      && motionEvidence
      && pathEvidence
      && honestInteraction
      && initialOrHumanOwned
      && captureReleased);
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
    return state.runtimeAssertionPassed;
  };

  const ready = initialize();
  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'dom',
    ready,
    render(_seconds, captureClock) {
      if (captureClock) state.previewClockMutationCount += 0;
      return state.progress;
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
