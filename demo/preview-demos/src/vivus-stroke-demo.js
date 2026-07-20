import Vivus from 'vivus';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#route-stage');
  const routeMap = document.querySelector('#route-map');
  const lineArt = document.querySelector('#line-art');
  const traceButton = document.querySelector('#trace-route');
  const clearButton = document.querySelector('#clear-route');
  const status = document.querySelector('#route-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const routePaths = [...lineArt.querySelectorAll('path[data-route-step]')];
  const semanticOrder = routePaths.map(path => path.dataset.routeStep);
  const expectedOrder = ['origin', 'leg-one', 'waypoint', 'leg-two', 'destination', 'approval'];

  const drawing = new Vivus('line-art', {
    type: 'oneByOne',
    duration: 108,
    start: 'manual',
    forceRender: true,
    animTimingFunction: Vivus.EASE,
    pathTimingFunction: Vivus.EASE_OUT
  });
  drawing.stop().reset();

  const state = {
    id: 'svg-stroke-drawing',
    routeId: 'field-itinerary-04',
    routeStart: 'field-depot',
    routeEnd: 'basalt-headland',
    automaticFallback: false,
    automaticPlayback: false,
    automaticReplay: false,
    automaticTrigger: false,
    syntheticInputDispatch: false,
    eventOwnedTimeline: true,
    userInitiated: false,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard'],
    inputKind: 'none',
    inputCount: 0,
    lastInputTrusted: null,
    lastTriggerTarget: null,
    triggerCount: 0,
    playCount: 0,
    completionCount: 0,
    pointerTriggerCount: 0,
    keyboardTriggerCount: 0,
    resetCount: 0,
    interruptionCount: 0,
    reducedMotionDirectCount: 0,
    reducedMotionTriggerCount: 0,
    semanticOrder: [...semanticOrder],
    expectedPathCount: expectedOrder.length,
    vivusMapCount: drawing.map.length,
    routeVisible: false,
    phase: 'idle',
    isDrawing: false,
    progress: 0,
    currentFrame: drawing.currentFrame,
    frameLength: drawing.frameLength,
    initialFrameStatic: true,
    initialProgress: 0,
    initialTriggerCount: 0,
    initialPhase: 'idle',
    reducedMotion: reducedMotion.matches,
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let latestPointerKind = 'mouse';
  let runToken = 0;

  function setDataset(name, value) {
    const next = String(value);
    if (stage.dataset[name] !== next) stage.dataset[name] = next;
  }

  function recordInput(inputKind, trusted) {
    state.userInitiated = true;
    state.inputKind = inputKind;
    state.inputCount += 1;
    state.lastInputTrusted = trusted;
  }

  function syncProgress() {
    state.currentFrame = drawing.currentFrame;
    state.frameLength = drawing.frameLength;
    const progress = drawing.frameLength > 0 ? drawing.currentFrame / drawing.frameLength : 0;
    state.progress = Number(Math.max(0, Math.min(1, progress)).toFixed(3));
    state.vivusMapCount = drawing.map.length;
  }

  function syncInterface() {
    syncProgress();
    setDataset('phase', state.phase);
    setDataset('routeVisible', state.routeVisible);
    setDataset('triggerCount', state.triggerCount);
    routeMap.setAttribute('aria-pressed', String(state.routeVisible));
    clearButton.disabled = !state.routeVisible;
    const buttonLabel = state.phase === 'drawing'
      ? 'Tracing…'
      : state.routeVisible
        ? 'Trace again'
        : 'Draw route';
    if (traceButton.textContent !== buttonLabel) traceButton.textContent = buttonLabel;
    const statusLabel = state.phase === 'drawing'
      ? `Drawing itinerary · ${Math.round(state.progress * 100)}%`
      : state.phase === 'complete'
        ? 'Route approved · 74 km'
        : 'Route awaiting approval';
    if (status.textContent !== statusLabel) status.textContent = statusLabel;
  }

  function completeRoute(token) {
    if (token !== runToken) return;
    state.completionCount += 1;
    state.phase = 'complete';
    state.isDrawing = false;
    state.routeVisible = true;
    syncInterface();
  }

  function triggerRoute(inputKind, trusted, target) {
    recordInput(inputKind, trusted);
    if (state.isDrawing) state.interruptionCount += 1;
    runToken += 1;
    const token = runToken;
    drawing.stop().reset();
    state.triggerCount += 1;
    state.routeVisible = true;
    state.lastTriggerTarget = target;
    if (inputKind === 'keyboard') state.keyboardTriggerCount += 1;
    else state.pointerTriggerCount += 1;

    if (state.reducedMotion) {
      drawing.finish();
      state.reducedMotionDirectCount += 1;
      state.reducedMotionTriggerCount += 1;
      state.phase = 'complete';
      state.isDrawing = false;
      state.completionCount += 1;
      syncInterface();
      return;
    }

    state.playCount += 1;
    state.phase = 'drawing';
    state.isDrawing = true;
    syncInterface();
    drawing.play(1, () => completeRoute(token));
  }

  function resetRoute(inputKind, trusted) {
    recordInput(inputKind, trusted);
    if (state.isDrawing) state.interruptionCount += 1;
    runToken += 1;
    drawing.stop().reset();
    state.resetCount += 1;
    state.routeVisible = false;
    state.lastTriggerTarget = null;
    state.phase = 'idle';
    state.isDrawing = false;
    syncInterface();
  }

  function inputKindFromClick(event) {
    return event.detail === 0 ? 'keyboard' : latestPointerKind;
  }

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });

  traceButton.addEventListener('click', event => {
    triggerRoute(inputKindFromClick(event), event.isTrusted, 'trace-button');
  });

  clearButton.addEventListener('click', event => {
    resetRoute(inputKindFromClick(event), event.isTrusted);
  });

  routeMap.addEventListener('click', event => {
    triggerRoute(inputKindFromClick(event), event.isTrusted, 'route-map');
  });

  routeMap.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (!event.repeat) triggerRoute('keyboard', event.isTrusted, 'route-map');
  });

  stage.addEventListener('keydown', event => {
    if (!['Escape', 'r', 'R'].includes(event.key) || clearButton.disabled) return;
    event.preventDefault();
    if (!event.repeat) resetRoute('keyboard', event.isTrusted);
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.isDrawing) {
      runToken += 1;
      drawing.stop().finish();
      state.reducedMotionDirectCount += 1;
      state.completionCount += 1;
      state.phase = 'complete';
      state.isDrawing = false;
      state.routeVisible = true;
    }
    syncInterface();
  });

  function render() {
    state.renderCount += 1;
    syncInterface();
  }

  const ready = document.fonts.ready.then(() => syncInterface());

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const livePaths = [...lineArt.querySelectorAll('path[data-route-step]')];
    const liveOrder = livePaths.map(path => path.dataset.routeStep);
    const mappedOrder = drawing.map.map(item => item.el.dataset.routeStep);
    const geometryEvidence = drawing.map.every(item =>
      item.el instanceof SVGGeometryElement
      && Number.isFinite(item.length)
      && item.length > 1
    );
    const progressEvidence = drawing.frameLength > 0
      && Math.abs(state.progress - drawing.currentFrame / drawing.frameLength) <= .011;
    const idleEvidence = state.routeVisible
      ? state.phase !== 'idle' && state.lastTriggerTarget !== null
      : state.phase === 'idle'
        && state.isDrawing === false
        && drawing.currentFrame === 0
        && state.lastTriggerTarget === null;
    const countEvidence = state.triggerCount === state.playCount + state.reducedMotionTriggerCount
      && state.completionCount <= state.triggerCount
      && state.pointerTriggerCount + state.keyboardTriggerCount === state.triggerCount;
    const reducedMotionSafe = !state.reducedMotion || !state.isDrawing;
    return drawing instanceof Vivus
      && drawing.start === 'manual'
      && drawing.type === 'oneByOne'
      && drawing.map.length === expectedOrder.length
      && livePaths.length === expectedOrder.length
      && semanticOrder.join(',') === expectedOrder.join(',')
      && liveOrder.join(',') === expectedOrder.join(',')
      && mappedOrder.join(',') === expectedOrder.join(',')
      && geometryEvidence
      && progressEvidence
      && routeMap.getAttribute('role') === 'button'
      && routeMap.tabIndex === 0
      && traceButton instanceof HTMLButtonElement
      && clearButton instanceof HTMLButtonElement
      && state.initialFrameStatic
      && state.initialProgress === 0
      && state.initialTriggerCount === 0
      && state.initialPhase === 'idle'
      && state.automaticFallback === false
      && state.automaticPlayback === false
      && state.automaticReplay === false
      && state.automaticTrigger === false
      && state.syntheticInputDispatch === false
      && state.eventOwnedTimeline === true
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.triggerCount)
      && Number.isInteger(state.playCount)
      && Number.isInteger(state.completionCount)
      && countEvidence
      && idleEvidence
      && reducedMotionSafe
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'svg-stroke-drawing',
    library: 'vivus@0.4.6',
    renderer: 'svg',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
