import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#wipe-stage');
  const exhibitScene = document.querySelector('#exhibit-scene');
  const liveScene = document.querySelector('#live-scene');
  const liveRevealElements = [...liveScene.querySelectorAll('.live-graphic, .live-copy')];
  const blade = document.querySelector('#wipe-blade');
  const progressBar = document.querySelector('#wipe-progress');
  const readout = document.querySelector('#wipe-readout');
  const toggleButton = document.querySelector('#scene-toggle');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const sceneNames = ['exhibit', 'live'];

  const clamp = value => Math.max(0, Math.min(1, value));
  const state = {
    id: 'scene-wipe-progressive-page-swap',
    task: 'cultural-venue-day-to-live-program-switch',
    automaticFallback: false,
    automaticCycle: false,
    automaticPlayback: false,
    captureClockDriven: false,
    syntheticInputDispatch: false,
    userRequestRequired: true,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard'],
    initialFrameStatic: true,
    initialSceneIndex: 0,
    initialProgress: 0,
    initialInputCount: 0,
    currentSceneIndex: 0,
    targetSceneIndex: null,
    progress: 0,
    phase: 'idle',
    transitionActive: false,
    transitionGeneration: 0,
    sceneRequestCount: 0,
    completedTransitionCount: 0,
    interruptedTransitionCount: 0,
    ignoredRequestCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    inputCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastRequestSource: 'initial',
    maximumConcurrentTransitions: 0,
    activeTransitionCount: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionAppliedCount: 0,
    displayControlCount: 0,
    activeDriverCount: 0,
    motionPlayCallCount: 0,
    controlRebuildCount: 0,
    controlCancellationCount: 0,
    controlsBuiltWithoutAutoplay: true,
    wipeDurationSeconds: .88,
    bladeTravelPx: 0,
    clipControlProgress: 0,
    bladeControlProgress: 0,
    railControlProgress: 0,
    contentControlProgress: 0,
    layoutMeasureCount: 0,
    renderCount: 0,
    renderIgnoresPreviewClock: true,
    sceneEvidence: {
      exhibit: {
        theme: exhibitScene.dataset.theme,
        layout: exhibitScene.dataset.layout,
        graphic: exhibitScene.dataset.graphic,
        heading: exhibitScene.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(),
        svgCount: exhibitScene.querySelectorAll('svg').length
      },
      live: {
        theme: liveScene.dataset.theme,
        layout: liveScene.dataset.layout,
        graphic: liveScene.dataset.graphic,
        heading: liveScene.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(),
        svgCount: liveScene.querySelectorAll('svg').length
      }
    }
  };

  let clipControl;
  let bladeControl;
  let railControl;
  let contentControl;
  let driverControl = null;
  let latestPointerKind = 'mouse';
  let resizeFrame = 0;

  function seek(control, progress) {
    control.time = control.duration * clamp(progress);
  }

  function buildDisplayControls() {
    const preservedProgress = state.progress;
    [clipControl, bladeControl, railControl, contentControl].forEach(control => control?.cancel());
    liveScene.style.clipPath = '';
    blade.style.transform = '';
    blade.style.opacity = '';
    progressBar.style.transform = '';
    liveRevealElements.forEach(element => {
      element.style.transform = '';
      element.style.opacity = '';
    });
    state.bladeTravelPx = Number((stage.clientWidth + 4).toFixed(2));
    state.layoutMeasureCount += 1;
    clipControl = animate(liveScene, {
      clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']
    }, {
      duration: 1,
      ease: 'linear',
      autoplay: false
    });
    bladeControl = animate(blade, {
      x: [0, state.bladeTravelPx],
      opacity: [0, 1, 1, 0]
    }, {
      duration: 1,
      times: [0, .025, .975, 1],
      ease: 'linear',
      autoplay: false
    });
    railControl = animate(progressBar, {
      scaleX: [0, 1]
    }, {
      duration: 1,
      ease: 'linear',
      autoplay: false
    });
    contentControl = animate(liveRevealElements, {
      x: [18, 0],
      opacity: [.74, 1]
    }, {
      duration: 1,
      ease: [.16, .84, .3, 1],
      autoplay: false
    });
    [clipControl, bladeControl, railControl, contentControl].forEach(control => {
      control.pause();
      control.time = 0;
    });
    state.displayControlCount = 4;
    state.controlRebuildCount += 1;
    setProgress(preservedProgress);
  }

  function setProgress(value) {
    const next = Number(clamp(value).toFixed(5));
    state.progress = next;
    seek(clipControl, next);
    seek(bladeControl, next);
    seek(railControl, next);
    seek(contentControl, next);
    state.clipControlProgress = Number((clipControl.time / clipControl.duration).toFixed(5));
    state.bladeControlProgress = Number((bladeControl.time / bladeControl.duration).toFixed(5));
    state.railControlProgress = Number((railControl.time / railControl.duration).toFixed(5));
    state.contentControlProgress = Number((contentControl.time / contentControl.duration).toFixed(5));
    syncInterface();
  }

  function recordInput(kind, trusted) {
    state.inputCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = trusted;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
  }

  function sceneLabel(index) {
    return index === 1 ? "Tonight's live program" : 'Day exhibition';
  }

  function syncInterface() {
    const visibleSceneIndex = state.transitionActive
      ? state.progress >= .5 ? 1 : 0
      : state.currentSceneIndex;
    stage.dataset.scene = sceneNames[visibleSceneIndex];
    stage.dataset.phase = state.phase;
    stage.dataset.progress = state.progress.toFixed(4);
    stage.dataset.targetScene = state.targetSceneIndex === null ? 'none' : sceneNames[state.targetSceneIndex];
    stage.dataset.requestCount = String(state.sceneRequestCount);
    stage.dataset.interruptCount = String(state.interruptedTransitionCount);
    stage.dataset.lastSource = state.lastRequestSource;
    const nextIndex = state.transitionActive ? 1 - state.targetSceneIndex : 1 - state.currentSceneIndex;
    toggleButton.textContent = nextIndex === 1 ? "Tonight's program" : 'Return to exhibition';
    toggleButton.setAttribute('aria-label', nextIndex === 1 ? "Open tonight's live program" : 'Return to the daytime exhibition');
    readout.textContent = state.transitionActive
      ? `${sceneLabel(state.targetSceneIndex)} · ${Math.round(state.progress * 100)}%`
      : `${sceneLabel(state.currentSceneIndex)} · ready`;
  }

  function cancelDriver() {
    if (!driverControl) return;
    driverControl.cancel();
    state.controlCancellationCount += 1;
    state.activeDriverCount = 0;
    driverControl = null;
  }

  function finishTransition(generation, targetIndex) {
    if (generation !== state.transitionGeneration || !state.transitionActive) return;
    setProgress(targetIndex);
    state.currentSceneIndex = targetIndex;
    state.targetSceneIndex = null;
    state.transitionActive = false;
    state.activeTransitionCount = 0;
    state.activeDriverCount = 0;
    state.completedTransitionCount += 1;
    state.phase = 'settled';
    driverControl = null;
    syncInterface();
  }

  function startTransition(targetIndex) {
    if (state.transitionActive) {
      state.interruptedTransitionCount += 1;
      state.transitionGeneration += 1;
      cancelDriver();
    }
    if (!state.transitionActive && targetIndex === state.currentSceneIndex && state.progress === targetIndex) {
      state.ignoredRequestCount += 1;
      state.phase = 'settled';
      syncInterface();
      return;
    }
    state.targetSceneIndex = targetIndex;
    state.transitionActive = true;
    state.activeTransitionCount = 1;
    state.maximumConcurrentTransitions = Math.max(state.maximumConcurrentTransitions, state.activeTransitionCount);
    state.phase = targetIndex === 1 ? 'wiping-to-live' : 'wiping-to-exhibit';
    const generation = state.transitionGeneration + 1;
    state.transitionGeneration = generation;

    if (reducedMotionQuery.matches) {
      state.reducedMotionAppliedCount += 1;
      finishTransition(generation, targetIndex);
      return;
    }

    const distance = Math.abs(targetIndex - state.progress);
    const duration = Math.max(.24, state.wipeDurationSeconds * distance);
    driverControl = animate(state.progress, targetIndex, {
      duration,
      ease: [.65, 0, .2, 1],
      autoplay: false,
      onUpdate: setProgress
    });
    driverControl.pause();
    driverControl.time = 0;
    state.activeDriverCount = 1;
    driverControl.finished
      .then(() => finishTransition(generation, targetIndex))
      .catch(() => undefined);
    driverControl.play();
    state.motionPlayCallCount += 1;
    syncInterface();
  }

  function requestScene(targetIndex, source, inputKind, trusted) {
    recordInput(inputKind, trusted);
    state.sceneRequestCount += 1;
    state.lastRequestSource = source;
    startTransition(targetIndex);
  }

  function toggleScene(source, inputKind, trusted) {
    const targetIndex = state.transitionActive
      ? 1 - state.targetSceneIndex
      : 1 - state.currentSceneIndex;
    requestScene(targetIndex, source, inputKind, trusted);
  }

  function inputKindFromClick(event) {
    return event.detail === 0 ? 'keyboard' : latestPointerKind;
  }

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'mouse';
  });

  toggleButton.addEventListener('click', event => {
    toggleScene('toggle-button', inputKindFromClick(event), event.isTrusted);
  });

  stage.addEventListener('keydown', event => {
    if (event.target === toggleButton) return;
    let targetIndex = null;
    if (['Enter', ' '].includes(event.key)) targetIndex = state.transitionActive ? 1 - state.targetSceneIndex : 1 - state.currentSceneIndex;
    else if (['ArrowRight', 'End', 'l', 'L'].includes(event.key)) targetIndex = 1;
    else if (['ArrowLeft', 'Home', 'r', 'R'].includes(event.key)) targetIndex = 0;
    if (targetIndex === null) return;
    event.preventDefault();
    if (!event.repeat) requestScene(targetIndex, `keyboard-${event.key === ' ' ? 'Space' : event.key}`, 'keyboard', event.isTrusted);
  });

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.transitionActive) {
      const targetIndex = state.targetSceneIndex;
      state.transitionGeneration += 1;
      cancelDriver();
      const generation = state.transitionGeneration;
      state.reducedMotionAppliedCount += 1;
      finishTransition(generation, targetIndex);
    }
    syncInterface();
  });

  addEventListener('resize', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      buildDisplayControls();
    });
  });

  addEventListener('beforeunload', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    cancelDriver();
    [clipControl, bladeControl, railControl, contentControl].forEach(control => control?.cancel());
  }, { once: true });

  function render() {
    state.renderCount += 1;
    syncInterface();
    if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
      stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__());
    }
  }

  buildDisplayControls();
  syncInterface();

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const displayControls = [clipControl, bladeControl, railControl, contentControl];
    const mappingEvidence = displayControls.every(control => control.duration === 1)
      && Math.abs(state.clipControlProgress - state.progress) <= .0001
      && Math.abs(state.bladeControlProgress - state.progress) <= .0001
      && Math.abs(state.railControlProgress - state.progress) <= .0001
      && Math.abs(state.contentControlProgress - state.progress) <= .0001;
    const replacementEvidence = exhibitScene.dataset.theme !== liveScene.dataset.theme
      && exhibitScene.dataset.layout !== liveScene.dataset.layout
      && exhibitScene.dataset.graphic !== liveScene.dataset.graphic
      && state.sceneEvidence.exhibit.heading !== state.sceneEvidence.live.heading
      && state.sceneEvidence.exhibit.svgCount === 1
      && state.sceneEvidence.live.svgCount === 1
      && exhibitScene.querySelector('.exhibit-copy') instanceof HTMLElement
      && exhibitScene.querySelector('.exhibit-art') instanceof HTMLElement
      && liveScene.querySelector('.live-copy') instanceof HTMLElement
      && liveScene.querySelector('.live-graphic') instanceof HTMLElement;
    const transitionEvidence = !state.transitionActive || (
      state.targetSceneIndex !== null
      && state.activeTransitionCount === 1
      && state.activeDriverCount === 1
      && driverControl
      && typeof driverControl.play === 'function'
      && typeof driverControl.cancel === 'function'
    );
    const initialEvidence = state.sceneRequestCount > 0 || (
      state.currentSceneIndex === state.initialSceneIndex
      && state.progress === state.initialProgress
      && state.phase === 'idle'
      && state.inputCount === state.initialInputCount
      && state.transitionActive === false
      && driverControl === null
    );
    return typeof animate === 'function'
      && CSS.supports('clip-path', 'inset(0 50% 0 0)')
      && stage.dataset.previewMechanism === 'motion-progressive-full-scene-wipe'
      && stage.getAttribute('role') === 'group'
      && stage.tabIndex === 0
      && toggleButton instanceof HTMLButtonElement
      && toggleButton.type === 'button'
      && displayControls.length === 4
      && state.displayControlCount === 4
      && displayControls.every(control => typeof control.play === 'function' && typeof control.pause === 'function' && typeof control.cancel === 'function')
      && state.bladeTravelPx > 0
      && state.layoutMeasureCount >= 1
      && mappingEvidence
      && replacementEvidence
      && transitionEvidence
      && initialEvidence
      && state.inputCount === state.sceneRequestCount
      && state.inputCount === state.pointerInputCount + state.keyboardInputCount
      && state.maximumConcurrentTransitions <= 1
      && state.automaticFallback === false
      && state.automaticCycle === false
      && state.automaticPlayback === false
      && state.captureClockDriven === false
      && state.syntheticInputDispatch === false
      && state.userRequestRequired === true
      && state.initialFrameStatic === true
      && state.controlsBuiltWithoutAutoplay === true
      && state.renderIgnoresPreviewClock === true
      && Number.isInteger(state.sceneRequestCount)
      && Number.isInteger(state.interruptedTransitionCount)
      && Number.isInteger(state.completedTransitionCount)
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'scene-wipe-progressive-page-swap',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
