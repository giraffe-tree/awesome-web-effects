import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  gsap.registerPlugin(ScrollTrigger);
  const scrollport = document.querySelector('#horizontal-scrollport');
  const scene = document.querySelector('#horizontal-scene');
  const stage = document.querySelector('#horizontal-stage');
  const track = document.querySelector('#horizontal-track');
  const panels = [...document.querySelectorAll('.story-panel')];
  const progressFill = document.querySelector('#scene-progress');
  const panelCounter = document.querySelector('#panel-counter');
  const sceneStatus = document.querySelector('#scene-status');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = gsap.utils.clamp(0, 1);

  if (!scrollport || !scene || !stage || !track || panels.length !== 4) {
    throw new Error('Pinned route dossier DOM is incomplete.');
  }

  const labels = [
    '01 · question scoped',
    '02 · terrain mapped',
    '03 · detour preferred',
    '04 · route approved'
  ];
  const steps = ['scope', 'observe', 'compare', 'approve'];
  const state = {
    progress: 0,
    panelIndex: 0,
    currentStep: 'scope',
    scrollTop: 0,
    triggerStart: 0,
    triggerEnd: 0,
    maxScroll: 0,
    inputCount: 0,
    wheelCount: 0,
    keyboardCount: 0,
    dragMoveCount: 0,
    boundaryReleaseCount: 0,
    lastInput: 'none',
    lastWheelConsumed: false,
    pointerCaptured: false,
    dragDistance: 0,
    automaticFallback: false,
    automaticPlayback: false,
    syntheticInputDispatch: false,
    nativeScrollLinked: true,
    pinnedElementMatches: false,
    scrollTriggerReady: false,
    wheelBoundaryPolicy: 'release-at-bounds',
    inputAdapters: ['vertical-wheel', 'vertical-drag', 'keyboard'],
    reducedMotion: reducedMotionQuery.matches,
    initialStaticConfirmed: false,
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let horizontalTrigger = null;
  const horizontalTween = gsap.to(track, {
    xPercent: -75,
    ease: 'none',
    paused: true,
    scrollTrigger: {
      trigger: scene,
      scroller: scrollport,
      start: 'top top',
      end: '+=960',
      scrub: true,
      pin: stage,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: self => updateIndicators(self.progress, self)
    }
  });
  horizontalTrigger = horizontalTween.scrollTrigger;
  let dragSession = null;

  function updateIndicators(rawProgress, trigger = horizontalTrigger) {
    const normalized = clamp(Number.isFinite(rawProgress) ? rawProgress : 0);
    const progress = normalized <= .0001 ? 0 : normalized >= .9999 ? 1 : normalized;
    const panelIndex = Math.min(3, Math.floor(progress * 3.999));
    state.progress = progress;
    state.panelIndex = panelIndex;
    state.currentStep = steps[panelIndex];
    state.scrollTop = scrollport.scrollTop;
    state.triggerStart = trigger?.start ?? 0;
    state.triggerEnd = trigger?.end ?? 0;
    state.maxScroll = Math.max(0, scrollport.scrollHeight - scrollport.clientHeight);
    state.pinnedElementMatches = trigger?.pin === stage;
    progressFill.style.transform = `scaleX(${progress})`;
    panelCounter.textContent = `${String(panelIndex + 1).padStart(2, '0')} / 04`;
    sceneStatus.textContent = labels[panelIndex];
    panels.forEach((panel, index) => {
      panel.dataset.viewportState = index < panelIndex ? 'passed' : index === panelIndex ? 'active' : 'ahead';
    });
  }

  const triggerSpan = () => Math.max(1, horizontalTrigger.end - horizontalTrigger.start);
  const setProgress = (rawProgress, source) => {
    const progress = clamp(rawProgress);
    state.lastInput = source;
    scrollport.scrollTop = horizontalTrigger.start + progress * triggerSpan();
    ScrollTrigger.update(true);
    updateIndicators(horizontalTrigger.progress);
  };
  const recordInput = source => {
    state.inputCount += 1;
    state.lastInput = source;
  };
  const wheelScale = event => {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return 16;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return Math.max(80, stage.clientHeight);
    return 1;
  };

  scrollport.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX) || Math.abs(event.deltaY) < .25) return;
    const delta = event.deltaY * wheelScale(event);
    const direction = Math.sign(delta);
    const atBoundary = (direction < 0 && state.progress <= .0001)
      || (direction > 0 && state.progress >= .9999);
    state.wheelCount += 1;
    state.lastWheelConsumed = false;
    if (atBoundary) {
      state.boundaryReleaseCount += 1;
      state.lastInput = 'wheel-boundary-release';
      return;
    }
    event.preventDefault();
    recordInput('vertical-wheel');
    state.lastWheelConsumed = true;
    setProgress(state.progress + delta / triggerSpan(), 'vertical-wheel');
  }, { passive: false });

  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    scrollport.focus({ preventScroll: true });
    stage.setPointerCapture(event.pointerId);
    dragSession = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startProgress: state.progress
    };
    state.pointerCaptured = true;
    state.dragDistance = 0;
    state.lastInput = 'vertical-drag-start';
  });
  stage.addEventListener('pointermove', event => {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;
    event.preventDefault();
    const distance = dragSession.startY - event.clientY;
    state.dragDistance = Math.max(state.dragDistance, Math.abs(distance));
    state.dragMoveCount += 1;
    recordInput('vertical-drag');
    setProgress(dragSession.startProgress + distance / Math.max(120, stage.clientHeight * 1.65), 'vertical-drag');
  });
  const finishDrag = event => {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;
    if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    dragSession = null;
    state.pointerCaptured = false;
    state.lastInput = 'vertical-drag-end';
  };
  stage.addEventListener('pointerup', finishDrag);
  stage.addEventListener('pointercancel', finishDrag);
  stage.addEventListener('lostpointercapture', event => {
    if (dragSession?.pointerId === event.pointerId) dragSession = null;
    state.pointerCaptured = false;
  });

  scrollport.addEventListener('keydown', event => {
    const increments = {
      ArrowDown: .11,
      ArrowRight: .11,
      ArrowUp: -.11,
      ArrowLeft: -.11,
      PageDown: .34,
      PageUp: -.34
    };
    let target = null;
    if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = 1;
    else if (event.key in increments) target = state.progress + increments[event.key];
    if (target === null) return;
    event.preventDefault();
    state.keyboardCount += 1;
    recordInput(`keyboard:${event.key}`);
    setProgress(target, `keyboard:${event.key}`);
  });

  scrollport.addEventListener('scroll', () => {
    ScrollTrigger.update(true);
    updateIndicators(horizontalTrigger.progress);
  }, { passive: true });

  const handleReducedMotion = event => {
    state.reducedMotion = event.matches;
    ScrollTrigger.update(true);
    updateIndicators(horizontalTrigger.progress);
  };
  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', handleReducedMotion);
  } else {
    reducedMotionQuery.addListener(handleReducedMotion);
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`pinned-horizontal-scroll-scene: ${message}`);
    };
    const uniqueSteps = new Set(panels.map(panel => panel.dataset.step));
    invariant(horizontalTrigger.animation === horizontalTween, 'ScrollTrigger must own the horizontal tween');
    invariant(horizontalTrigger.pin === stage && state.pinnedElementMatches, 'the visible stage must be the pinned element');
    invariant(horizontalTrigger.vars.scrub === true && horizontalTrigger.end > horizontalTrigger.start, 'trigger must use a nonzero scrubbed range');
    invariant(state.automaticFallback === false && state.automaticPlayback === false, 'autonomous playback must remain disabled');
    invariant(state.syntheticInputDispatch === false, 'synthetic input dispatch must remain disabled');
    invariant(state.nativeScrollLinked === true, 'the horizontal tween must remain linked to real scroll position');
    invariant(state.wheelBoundaryPolicy === 'release-at-bounds', 'wheel boundaries must release surrounding page scroll');
    invariant(state.inputAdapters.join('|') === 'vertical-wheel|vertical-drag|keyboard', 'input adapter contract changed');
    invariant(uniqueSteps.size === 4 && panels.every(panel => panel.querySelector('.story-result')), 'every panel needs a unique task and outcome');
    invariant(getComputedStyle(stage).touchAction === 'none' && typeof stage.setPointerCapture === 'function', 'drag surface must use captured pointer input');
    invariant(state.progress >= 0 && state.progress <= 1 && state.panelIndex >= 0 && state.panelIndex <= 3, 'exported progress escaped its range');
    invariant(Math.abs(horizontalTrigger.progress - state.progress) <= .015, 'ScrollTrigger progress and UI state diverged');
    invariant(state.inputCount > 0 || (state.initialStaticConfirmed && state.progress === 0), 'initial frame must remain static until human input');
    return true;
  };

  ScrollTrigger.refresh();
  updateIndicators(horizontalTrigger.progress);
  const doubleFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.resolve(document.fonts?.ready)
    .then(doubleFrame)
    .then(() => {
      ScrollTrigger.refresh();
      setProgress(0, 'initial');
      return doubleFrame().then(() => {
        const before = `${state.progress}|${state.panelIndex}|${getComputedStyle(track).transform}`;
        return doubleFrame().then(() => {
          const after = `${state.progress}|${state.panelIndex}|${getComputedStyle(track).transform}`;
          state.scrollTriggerReady = true;
          state.initialStaticConfirmed = before === after && state.progress === 0 && state.inputCount === 0;
          state.lastInput = 'none';
          if (!state.initialStaticConfirmed) throw new Error(`Initial pinned story changed without user input: ${before} -> ${after}; inputs ${state.inputCount}.`);
          if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial pinned story runtime assertion failed.');
        });
      });
    });

  ready.catch(markPreviewFailure);
  installPreviewController({
    id: 'pinned-horizontal-scroll-scene',
    library: 'gsap@3.15.0',
    renderer: 'dom',
    render: () => {
      state.renderCount += 1;
      ScrollTrigger.update(true);
      updateIndicators(horizontalTrigger.progress);
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
