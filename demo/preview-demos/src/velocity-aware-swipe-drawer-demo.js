import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-b-utils.js';

try {
  const stage = document.querySelector('.route-stage');
  const map = document.querySelector('#route-map');
  const drawer = document.querySelector('#swipe-drawer');
  const drawerContent = document.querySelector('#drawer-content');
  const handle = document.querySelector('#drawer-handle');
  const overlay = document.querySelector('#drawer-overlay');
  const detailsToggle = document.querySelector('#details-toggle');
  const startRoute = document.querySelector('#start-route');
  const snapLabel = document.querySelector('#drawer-snap');
  const peekLabel = document.querySelector('#drawer-peek-label');
  const velocityReadout = document.querySelector('#velocity-readout');
  const resultCopy = document.querySelector('#result-copy');
  const routeStatus = document.querySelector('#route-status');
  const arrivalValue = document.querySelector('#arrival-value');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const snapPoints = [0, .52, 1];
  const snapNames = ['preview', 'summary', 'full route'];
  const snapValueText = ['Route preview', 'Route summary', 'Full route details'];

  const state = {
    claimedLibrary: 'motion@12.42.2',
    renderer: 'dom',
    mechanism: 'velocity-aware-responsive-drawer',
    layout: 'side',
    axis: 'x',
    openingDirection: -1,
    progress: 0,
    targetProgress: 0,
    snapIndex: 0,
    phase: 'peek',
    motionActive: false,
    dragging: false,
    dragPointerType: 'none',
    dragStartProgress: 0,
    releaseVelocity: 0,
    releaseDecision: 'ready',
    speedBand: 'steady',
    travelDistance: 0,
    inputCount: 0,
    dragCount: 0,
    releaseCount: 0,
    fastReleaseCount: 0,
    mediumReleaseCount: 0,
    steadyReleaseCount: 0,
    releaseHistory: [],
    keyboardCount: 0,
    buttonCount: 0,
    settleCount: 0,
    resultCount: 0,
    lastInput: 'idle',
    lastInputTrusted: null,
    pointerCaptured: false,
    routeState: 'planning',
    inputAdapters: ['pointer', 'touch', 'button', 'keyboard'],
    automaticPlayback: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    previewClockDrivesDrawer: false,
    reducedMotion: reducedMotionQuery.matches,
    motionControlsCreated: false,
    motionControlRebuilds: 0,
    syncCount: 0,
    initialStaticConfirmed: false,
    initialSignature: '',
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let drawerMotion = null;
  let motionFrame = 0;
  let motionToken = 0;
  let activeDrag = null;

  const overlayMotion = animate(overlay, { opacity: [0, .72] }, { duration: 1, ease: 'linear', autoplay: false });
  const mapMotion = animate(map, { scale: [1, .975] }, { duration: 1, ease: [0.22, 1, 0.36, 1], autoplay: false });
  const statusMotion = animate(routeStatus, { opacity: [0, 1], y: [-5, 0] }, { duration: 1, ease: 'easeOut', autoplay: false });
  [overlayMotion, mapMotion, statusMotion].forEach((control) => {
    control.pause();
    control.time = 0;
  });

  const recordInput = (source, event) => {
    if (!event || event.isTrusted !== true) return false;
    state.inputCount += 1;
    state.lastInput = source;
    state.lastInputTrusted = true;
    return true;
  };

  const nearestSnapIndex = (progress) => snapPoints.reduce((bestIndex, point, index) => (
    Math.abs(point - progress) < Math.abs(snapPoints[bestIndex] - progress) ? index : bestIndex
  ), 0);

  const indexForSettledProgress = (progress) => {
    const exactIndex = snapPoints.findIndex((point) => Math.abs(point - progress) < .002);
    return exactIndex === -1 ? nearestSnapIndex(progress) : exactIndex;
  };

  const speedBandFor = (velocity) => {
    const speed = Math.abs(velocity);
    if (speed >= 1.05) return 'fast';
    if (speed >= .38) return 'medium';
    return 'steady';
  };

  const chooseSnapIndex = (progress, openingVelocity) => {
    const nearestIndex = nearestSnapIndex(progress);
    if (Math.abs(openingVelocity) >= 1.05) return openingVelocity > 0 ? 2 : 0;
    if (openingVelocity >= .38) return Math.min(2, Math.max(nearestIndex + 1, snapPoints.findIndex((point) => point > progress + .035)));
    if (openingVelocity <= -.38) {
      const lowerIndices = snapPoints.map((point, index) => ({ point, index })).filter(({ point }) => point < progress - .035);
      return lowerIndices.length ? lowerIndices.at(-1).index : 0;
    }
    return nearestIndex;
  };

  const syncInterface = () => {
    const settledIndex = indexForSettledProgress(state.targetProgress);
    const expanded = state.targetProgress > 0 || state.progress > .02;
    stage.dataset.layout = state.layout;
    stage.dataset.routeState = state.routeState;
    stage.dataset.drawerPhase = state.phase;
    stage.dataset.drawerSnap = snapNames[state.snapIndex];
    stage.dataset.drawerExpanded = String(expanded);
    drawer.dataset.progress = state.progress.toFixed(4);
    drawer.dataset.snap = snapNames[state.snapIndex];
    drawer.dataset.speed = state.speedBand;
    drawer.dataset.phase = state.phase;
    drawer.dataset.lastInput = state.lastInput;
    detailsToggle.setAttribute('aria-expanded', String(expanded));
    detailsToggle.textContent = state.targetProgress === 1 && state.progress > .98 ? 'Hide details' : 'Route details';
    handle.setAttribute('aria-valuenow', String(state.snapIndex));
    handle.setAttribute('aria-valuetext', snapValueText[state.snapIndex]);
    handle.setAttribute('aria-orientation', state.layout === 'side' ? 'horizontal' : 'vertical');
    snapLabel.textContent = state.dragging ? 'Dragging' : snapNames[state.snapIndex];
    peekLabel.textContent = state.routeState === 'active' ? 'Guidance live · next turn' : `${state.snapIndex === 0 ? '18 min' : snapNames[state.snapIndex]} · pull for route`;
    startRoute.setAttribute('aria-pressed', String(state.routeState === 'active'));
    startRoute.disabled = state.targetProgress < .99;
    drawerContent.setAttribute('aria-hidden', String(!expanded));
    drawerContent.inert = !expanded;
    startRoute.textContent = state.routeState === 'active' ? 'Guidance active' : 'Start guidance';
    resultCopy.textContent = state.routeState === 'active'
      ? 'Route started · voice guidance and live turn cues are active.'
      : 'Release speed chooses preview, summary or full route.';
    routeStatus.style.pointerEvents = 'none';
    routeStatus.setAttribute('aria-hidden', String(state.routeState !== 'active'));
    routeStatus.hidden = state.routeState !== 'active';
    state.snapIndex = state.dragging || state.motionActive ? settledIndex : indexForSettledProgress(state.progress);
    state.syncCount += 1;
  };

  const applyProgress = (progress) => {
    state.progress = clamp(progress);
    if (drawerMotion) drawerMotion.time = state.progress * drawerMotion.duration;
    overlayMotion.time = state.progress * overlayMotion.duration;
    mapMotion.time = state.progress * mapMotion.duration;
    statusMotion.time = (state.routeState === 'active' ? 1 : 0) * statusMotion.duration;
    syncInterface();
  };

  const rebuildDrawerMotion = () => {
    const nextLayout = innerWidth > 520 && innerHeight > 260 ? 'side' : 'bottom';
    state.layout = nextLayout;
    state.axis = nextLayout === 'side' ? 'x' : 'y';
    stage.dataset.layout = nextLayout;
    if (drawerMotion) drawerMotion.cancel();

    const peekSize = nextLayout === 'side' ? 65 : (innerWidth <= 190 || innerHeight <= 110 ? 18 : 42);
    const drawerSize = nextLayout === 'side' ? drawer.offsetWidth : drawer.offsetHeight;
    state.travelDistance = Math.max(1, drawerSize - peekSize);
    const keyframes = nextLayout === 'side'
      ? { x: [state.travelDistance, 0], y: [0, 0] }
      : { x: [0, 0], y: [state.travelDistance, 0] };
    drawerMotion = animate(drawer, keyframes, { duration: 1, ease: 'linear', autoplay: false });
    drawerMotion.pause();
    drawerMotion.time = state.progress;
    state.motionControlsCreated = true;
    state.motionControlRebuilds += 1;
    syncInterface();
  };

  const settleAt = (snapIndex) => {
    cancelAnimationFrame(motionFrame);
    const index = clamp(Math.round(snapIndex), 0, snapPoints.length - 1);
    state.snapIndex = index;
    state.progress = snapPoints[index];
    state.targetProgress = state.progress;
    state.phase = snapNames[index];
    state.motionActive = false;
    state.dragging = false;
    state.settleCount += 1;
    applyProgress(state.progress);
  };

  const animateToSnap = (snapIndex, source) => {
    const index = clamp(Math.round(snapIndex), 0, snapPoints.length - 1);
    const target = snapPoints[index];
    motionToken += 1;
    const token = motionToken;
    cancelAnimationFrame(motionFrame);
    state.snapIndex = index;
    state.targetProgress = target;
    state.phase = 'settling';
    state.motionActive = true;
    state.dragging = false;
    syncInterface();

    if (state.reducedMotion || Math.abs(target - state.progress) < .001) {
      settleAt(index);
      return;
    }

    const from = state.progress;
    const startedAt = performance.now();
    const duration = 460 * Math.max(.45, Math.abs(target - from));
    const tick = (now) => {
      if (token !== motionToken) return;
      const linear = clamp((now - startedAt) / duration);
      const eased = 1 - ((1 - linear) ** 4);
      applyProgress(from + (target - from) * eased);
      if (linear < 1) motionFrame = requestAnimationFrame(tick);
      else settleAt(index);
    };
    motionFrame = requestAnimationFrame(tick);
  };

  const positionForEvent = (event) => state.axis === 'x' ? event.clientX : event.clientY;

  const updateDrag = (event) => {
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
    const now = performance.now();
    const position = positionForEvent(event);
    const delta = position - activeDrag.startPosition;
    const nextProgress = activeDrag.startProgress - delta / state.travelDistance;
    if (Math.abs(position - activeDrag.lastPosition) > .1) {
      const elapsed = Math.max(1, now - activeDrag.lastTime);
      const rawVelocity = (position - activeDrag.lastPosition) / elapsed;
      activeDrag.openingVelocity = -rawVelocity;
      activeDrag.lastPosition = position;
      activeDrag.lastTime = now;
    }
    state.releaseVelocity = activeDrag.openingVelocity;
    state.speedBand = speedBandFor(state.releaseVelocity);
    state.releaseDecision = `${state.speedBand} ${state.releaseVelocity >= 0 ? 'open' : 'close'}`;
    velocityReadout.textContent = `${Math.abs(state.releaseVelocity).toFixed(2)} px/ms · ${state.releaseDecision}`;
    applyProgress(nextProgress);
  };

  const finishDrag = (event, cancelled = false) => {
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
    updateDrag(event);
    const velocity = cancelled ? 0 : activeDrag.openingVelocity;
    const targetIndex = chooseSnapIndex(state.progress, velocity);
    state.releaseVelocity = velocity;
    state.speedBand = speedBandFor(velocity);
    state.releaseDecision = `${state.speedBand} → ${snapNames[targetIndex]}`;
    state.releaseCount += 1;
    state[`${state.speedBand}ReleaseCount`] += 1;
    state.releaseHistory.push({
      velocity: Number(velocity.toFixed(4)),
      speedBand: state.speedBand,
      targetIndex,
      targetName: snapNames[targetIndex],
      pointerType: event.pointerType || state.dragPointerType,
      cancelled,
      trusted: event.isTrusted === true,
    });
    if (state.releaseHistory.length > 8) state.releaseHistory.shift();
    velocityReadout.textContent = `${Math.abs(velocity).toFixed(2)} px/ms · ${state.releaseDecision}`;
    if (drawer.hasPointerCapture(event.pointerId)) drawer.releasePointerCapture(event.pointerId);
    activeDrag = null;
    state.pointerCaptured = false;
    animateToSnap(targetIndex, cancelled ? 'pointercancel' : 'pointerup');
  };

  drawer.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    if (!recordInput(event.pointerType === 'touch' ? 'touch:drag' : `pointer:${event.pointerType || 'mouse'}:drag`, event)) return;
    motionToken += 1;
    cancelAnimationFrame(motionFrame);
    state.dragging = true;
    state.motionActive = false;
    state.phase = 'dragging';
    state.dragPointerType = event.pointerType || 'mouse';
    state.dragStartProgress = state.progress;
    state.dragCount += 1;
    const position = positionForEvent(event);
    activeDrag = {
      pointerId: event.pointerId,
      startPosition: position,
      startProgress: state.progress,
      lastPosition: position,
      lastTime: performance.now(),
      openingVelocity: 0,
    };
    drawer.setPointerCapture(event.pointerId);
    state.pointerCaptured = true;
    syncInterface();
  });
  drawer.addEventListener('pointermove', updateDrag);
  drawer.addEventListener('pointerup', (event) => finishDrag(event));
  drawer.addEventListener('pointercancel', (event) => finishDrag(event, true));

  const handleKeyboard = (event) => {
    let targetIndex = null;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') targetIndex = Math.min(2, state.snapIndex + 1);
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') targetIndex = Math.max(0, state.snapIndex - 1);
    if (event.key === 'Home' || event.key === 'Escape') targetIndex = 0;
    if (event.key === 'End') targetIndex = 2;
    if (targetIndex === null) return;
    event.preventDefault();
    if (!recordInput(`keyboard:${event.key}`, event)) return;
    state.keyboardCount += 1;
    state.releaseVelocity = 0;
    state.speedBand = 'steady';
    state.releaseDecision = `keyboard → ${snapNames[targetIndex]}`;
    velocityReadout.textContent = state.releaseDecision;
    animateToSnap(targetIndex, `keyboard:${event.key}`);
  };
  handle.addEventListener('keydown', handleKeyboard);

  detailsToggle.addEventListener('click', (event) => {
    if (!recordInput(event.detail === 0 ? 'keyboard:details-button' : 'button:details', event)) return;
    state.buttonCount += 1;
    const nextIndex = state.targetProgress === 1 ? 0 : 2;
    state.releaseVelocity = 0;
    state.speedBand = 'steady';
    state.releaseDecision = `button → ${snapNames[nextIndex]}`;
    velocityReadout.textContent = state.releaseDecision;
    animateToSnap(nextIndex, state.lastInput);
  });

  startRoute.addEventListener('click', (event) => {
    if (!recordInput(event.detail === 0 ? 'keyboard:start-guidance' : 'button:start-guidance', event)) return;
    state.buttonCount += 1;
    if (state.routeState !== 'active') state.resultCount += 1;
    state.routeState = 'active';
    arrivalValue.textContent = '12:42 live';
    state.releaseDecision = 'route started → summary';
    state.speedBand = 'steady';
    velocityReadout.textContent = 'Guidance active · next turn in 220 m';
    applyProgress(state.progress);
    animateToSnap(1, state.lastInput);
  });

  const handleReducedMotionChange = (event) => {
    state.reducedMotion = event.matches;
    if (event.matches && state.motionActive) settleAt(state.snapIndex);
    else syncInterface();
  };
  if (typeof reducedMotionQuery.addEventListener === 'function') reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  else reducedMotionQuery.addListener(handleReducedMotionChange);

  const resize = () => {
    cancelAnimationFrame(motionFrame);
    state.motionActive = false;
    state.dragging = false;
    activeDrag = null;
    state.pointerCaptured = false;
    rebuildDrawerMotion();
    applyProgress(state.progress);
  };
  addEventListener('resize', resize);

  const interactionSignature = () => [
    state.layout,
    state.phase,
    state.progress.toFixed(4),
    state.targetProgress.toFixed(4),
    state.snapIndex,
    state.inputCount,
    state.routeState,
    getComputedStyle(drawer).transform,
    getComputedStyle(overlay).opacity,
  ].join('|');

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`velocity-aware-swipe-drawer: ${message}`);
    };
    const stageRect = stage.getBoundingClientRect();
    const drawerRect = drawer.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const detailsRect = detailsToggle.getBoundingClientRect();
    const visibleWidth = Math.min(stageRect.right, drawerRect.right) - Math.max(stageRect.left, drawerRect.left);
    const visibleHeight = Math.min(stageRect.bottom, drawerRect.bottom) - Math.max(stageRect.top, drawerRect.top);
    const expectedLayout = innerWidth > 520 && innerHeight > 260 ? 'side' : 'bottom';

    invariant(state.claimedLibrary === 'motion@12.42.2' && typeof animate === 'function' && state.motionControlsCreated, 'real Motion controls are missing');
    invariant(state.renderer === 'dom' && state.mechanism === 'velocity-aware-responsive-drawer', 'drawer mechanism changed');
    invariant(drawerMotion?.duration === 1 && overlayMotion.duration === 1 && mapMotion.duration === 1 && statusMotion.duration === 1, 'Motion timelines are invalid');
    invariant(snapPoints.join('|') === '0|0.52|1' && snapNames.join('|') === 'preview|summary|full route', 'semantic snap points changed');
    invariant(chooseSnapIndex(.3, 1.2) === 2 && chooseSnapIndex(.72, -1.2) === 0 && chooseSnapIndex(.49, .05) === 1, 'velocity snap resolver is invalid');
    invariant(state.layout === expectedLayout && stage.dataset.layout === state.layout && state.axis === (state.layout === 'side' ? 'x' : 'y'), 'responsive drawer axis is stale');
    invariant(state.travelDistance > 20 && state.progress >= 0 && state.progress <= 1 && state.targetProgress >= 0 && state.targetProgress <= 1, 'drawer geometry or progress is invalid');
    invariant(state.snapIndex >= 0 && state.snapIndex <= 2 && handle.getAttribute('aria-valuenow') === String(state.snapIndex) && handle.getAttribute('aria-orientation') === (state.layout === 'side' ? 'horizontal' : 'vertical'), 'drawer snap accessibility state is stale');
    invariant(drawer.dataset.progress === state.progress.toFixed(4) && drawer.dataset.phase === state.phase && drawer.dataset.speed === state.speedBand, 'drawer DOM state is stale');
    invariant(stage.dataset.drawerExpanded === String(state.targetProgress > 0 || state.progress > .02), 'drawer expanded layout state is stale');
    invariant(detailsToggle.getAttribute('aria-expanded') === String(state.targetProgress > 0 || state.progress > .02) && detailsToggle.getAttribute('aria-controls') === 'swipe-drawer', 'drawer toggle state is stale');
    invariant(drawerContent.getAttribute('aria-hidden') === String(!(state.targetProgress > 0 || state.progress > .02)) && drawerContent.inert === !(state.targetProgress > 0 || state.progress > .02), 'offscreen drawer content accessibility is stale');
    invariant(state.routeState === stage.dataset.routeState && startRoute.getAttribute('aria-pressed') === String(state.routeState === 'active'), 'route result state is stale');
    invariant(routeStatus.getAttribute('aria-hidden') === String(state.routeState !== 'active') && routeStatus.hidden === (state.routeState !== 'active'), 'route status accessibility is stale');
    invariant(startRoute.disabled === (state.targetProgress < .99), 'hidden route action focusability is stale');
    invariant(state.automaticPlayback === false && state.automaticFallback === false && state.syntheticInputDispatch === false && state.previewClockDrivesDrawer === false, 'automatic or synthetic drawer input is forbidden');
    invariant(state.inputAdapters.join('|') === 'pointer|touch|button|keyboard', 'input adapter contract changed');
    invariant(state.inputCount === state.dragCount + state.keyboardCount + state.buttonCount && state.lastInputTrusted === (state.inputCount > 0 ? true : null), 'trusted input accounting changed');
    invariant(state.releaseCount === state.fastReleaseCount + state.mediumReleaseCount + state.steadyReleaseCount && state.releaseHistory.length <= state.releaseCount, 'velocity release accounting changed');
    invariant(state.releaseHistory.every((release) => release.trusted && release.targetIndex >= 0 && release.targetIndex <= 2), 'release history contains synthetic or invalid evidence');
    invariant(state.pointerCaptured === Boolean(activeDrag), 'pointer capture state changed');
    invariant(!state.reducedMotion || !state.motionActive, 'reduced motion must settle directly');
    invariant(handle.tabIndex === 0 && handle.getAttribute('role') === 'slider' && getComputedStyle(drawer).touchAction === 'none', 'drag or keyboard accessibility changed');
    const minimumDetailsWidth = innerWidth <= 190 || innerHeight <= 110 ? 28 : 40;
    invariant(visibleWidth > 16 && visibleHeight > 16 && handleRect.width > 16 && handleRect.height > 16 && detailsRect.width > minimumDetailsWidth, 'drawer handle or controls are not visible');
    invariant(drawerRect.width <= stageRect.width + .5 && drawerRect.height <= stageRect.height + .5, 'drawer size escaped the preview');
    invariant(state.syncCount > 1 && (state.inputCount > 0 || state.initialStaticConfirmed), 'initial frame must remain static until real input');
    invariant(window.__PREVIEW_INTERACTION_STATE__ === state && window.__PREVIEW_META__?.capture === 'real-demo', 'interaction state export is missing');
    return true;
  };

  rebuildDrawerMotion();
  applyProgress(0);
  const doubleFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.resolve(document.fonts?.ready).then(async () => {
    await doubleFrame();
    const before = interactionSignature();
    await doubleFrame();
    const after = interactionSignature();
    state.initialSignature = before;
    state.initialStaticConfirmed = before === after
      && state.phase === 'peek'
      && state.progress === 0
      && state.targetProgress === 0
      && state.snapIndex === 0
      && state.inputCount === 0
      && !state.motionActive;
    if (!state.initialStaticConfirmed) throw new Error('Initial route drawer changed without user input.');
    if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial route drawer assertion failed.');
  });

  ready.catch(markPreviewFailure);

  installPreviewController({
    id: 'velocity-aware-swipe-drawer',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => {},
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
