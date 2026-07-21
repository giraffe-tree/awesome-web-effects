import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#preview-stage');
  const viewport = document.querySelector('#reader-viewport');
  const track = document.querySelector('#story-track');
  const navigation = document.querySelector('#fixed-nav');
  const contrastValue = document.querySelector('#contrast-value');
  const chapterValue = document.querySelector('#chapter-value');
  const sections = [...document.querySelectorAll('.story-section')];
  const sectionControls = [...document.querySelectorAll('[data-section]')];
  if (!stage || !viewport || !track || !navigation || !contrastValue || !chapterValue || sections.length !== 3 || sectionControls.length !== sections.length) {
    throw new Error('The fixed-navigation reader is missing required surfaces');
  }

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const round = (value, digits = 4) => Number(value.toFixed(digits));
  const hexToRgb = hex => {
    const value = hex.replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`Invalid section background: ${hex}`);
    return [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16));
  };
  const linearChannel = channel => {
    const value = channel / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  };
  const luminance = rgb => {
    const [red, green, blue] = rgb.map(linearChannel);
    return .2126 * red + .7152 * green + .0722 * blue;
  };
  const contrastRatio = (foregroundLuminance, backgroundLuminance) => {
    const light = Math.max(foregroundLuminance, backgroundLuminance);
    const dark = Math.min(foregroundLuminance, backgroundLuminance);
    return (light + .05) / (dark + .05);
  };
  const rgbString = rgb => `rgb(${rgb.join(', ')})`;
  const lightInk = { hex: '#f7f3e8', rgb: [247, 243, 232] };
  const darkInk = { hex: '#151c18', rgb: [21, 28, 24] };
  const lightInkLuminance = luminance(lightInk.rgb);
  const darkInkLuminance = luminance(darkInk.rgb);

  const sectionEvidence = sections.map((section, index) => {
    const source = section.dataset.background;
    const rgb = hexToRgb(source);
    const sectionLuminance = luminance(rgb);
    const lightRatio = contrastRatio(lightInkLuminance, sectionLuminance);
    const darkRatio = contrastRatio(darkInkLuminance, sectionLuminance);
    const useLightInk = lightRatio >= darkRatio;
    return {
      index,
      source,
      rgb,
      luminance: round(sectionLuminance),
      lightRatio: round(lightRatio, 2),
      darkRatio: round(darkRatio, 2),
      ink: useLightInk ? lightInk.hex : darkInk.hex,
      inkName: useLightInk ? 'LIGHT' : 'DARK',
      ratio: round(useLightInk ? lightRatio : darkRatio, 1),
      chapter: section.dataset.chapter
    };
  });

  const state = {
    id: 'self-inverting-fixed-navigation',
    task: 'human-operated-long-form-reader-with-computed-background-contrast-navigation',
    claimedLibrary: 'motion@12.42.2',
    renderer: 'dom',
    mechanism: 'paused-motion-track-seeks-only-from-trusted-human-input-while-fixed-navigation-selects-the-higher-wcag-contrast-ink-from-the-actual-section-background-underneath',
    assetStrategy: 'code-native-section-colors-and-computed-style-evidence-no-functional-raster-input-required',
    acceptedInputs: ['trusted-wheel', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'visible-section-buttons'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    progress: 0,
    initialProgress: 0,
    currentSection: 0,
    sampledSection: 0,
    activeBackground: sectionEvidence[0].source,
    chosenInk: sectionEvidence[0].inkName,
    contrastRatio: sectionEvidence[0].ratio,
    contrastPass: sectionEvidence[0].ratio >= 4.5,
    sectionCount: sections.length,
    viewportHeight: 0,
    maximumOffset: 0,
    motionDuration: 0,
    motionPaused: false,
    firstFrameStatic: true,
    initialStaticVerified: true,
    automaticPlayback: false,
    automaticCycle: false,
    automaticRehearsal: false,
    automaticFallback: false,
    captureClockDriven: false,
    syntheticInputDispatch: false,
    trustedInteractionCount: 0,
    wheelCount: 0,
    keyboardCount: 0,
    sectionClickCount: 0,
    pointerDragCount: 0,
    pointerMoveCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    pointerCaptured: false,
    activePointerId: null,
    lastInput: 'initial',
    changedByTrustedInput: false,
    everChangedByTrustedInput: false,
    resizeCount: 0,
    evidenceSource: 'computed-section-background'
  };

  let progress = 0;
  let trackMotion = null;
  let dragStartY = 0;
  let dragStartProgress = 0;

  const registerTrustedInput = (event, inputType) => {
    if (!event.isTrusted) return false;
    state.trustedInteractionCount += 1;
    state.lastInput = inputType;
    return true;
  };

  const sampleIndexUnderNavigation = offset => {
    const navigationRect = navigation.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const sampleY = clamp(navigationRect.top + navigationRect.height / 2 - viewportRect.top, 0, state.viewportHeight - 1);
    return clamp(Math.floor((offset + sampleY) / state.viewportHeight), 0, sections.length - 1);
  };

  const verifyComputedBackground = index => {
    const expected = rgbString(sectionEvidence[index].rgb);
    return getComputedStyle(sections[index]).backgroundColor === expected;
  };

  const applyView = nextProgress => {
    progress = clamp(nextProgress);
    if (!trackMotion) return;
    trackMotion.time = trackMotion.duration * progress;

    const offset = progress * state.maximumOffset;
    const currentSection = clamp(Math.round(progress * (sections.length - 1)), 0, sections.length - 1);
    const sampledSection = sampleIndexUnderNavigation(offset);
    const evidence = sectionEvidence[sampledSection];

    stage.style.setProperty('--nav-ink', evidence.ink);
    stage.style.setProperty('--nav-wash', evidence.inkName === 'LIGHT' ? 'rgba(6, 24, 29, .18)' : 'rgba(239, 233, 215, .28)');
    stage.style.setProperty('--sample-color', evidence.source);
    contrastValue.textContent = `${evidence.ratio.toFixed(1)}:1 · ${evidence.inkName}`;
    chapterValue.textContent = sectionEvidence[currentSection].chapter;
    sectionControls.forEach((button, index) => button.setAttribute('aria-current', String(index === currentSection)));

    state.progress = round(progress);
    state.currentSection = currentSection;
    state.sampledSection = sampledSection;
    state.activeBackground = evidence.source;
    state.chosenInk = evidence.inkName;
    state.contrastRatio = evidence.ratio;
    state.contrastPass = evidence.ratio >= 4.5;
    state.motionDuration = round(trackMotion.duration);
    state.motionPaused = trackMotion.state === 'paused';
    state.changedByTrustedInput = state.trustedInteractionCount > 0 && Math.abs(progress - state.initialProgress) >= .01;
    state.everChangedByTrustedInput ||= state.changedByTrustedInput;
    stage.dataset.currentSection = String(currentSection);
    stage.dataset.sampledSection = String(sampledSection);
    stage.dataset.chosenInk = evidence.inkName.toLowerCase();
    stage.dataset.lastInput = state.lastInput;
    stage.dataset.progress = state.progress.toFixed(4);
    stage.dataset.motionPaused = String(state.motionPaused);
    stage.dataset.trustedInteractionCount = String(state.trustedInteractionCount);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
  };

  const rebuildTrackMotion = () => {
    trackMotion?.stop();
    state.viewportHeight = viewport.clientHeight;
    state.maximumOffset = state.viewportHeight * (sections.length - 1);
    trackMotion = animate(track, {
      transform: ['translate3d(0, 0px, 0)', `translate3d(0, -${state.maximumOffset}px, 0)`]
    }, {
      duration: 1,
      ease: 'linear'
    });
    trackMotion.pause();
    applyView(progress);
  };

  const setProgressFromInput = (nextProgress, event, inputType) => {
    if (!registerTrustedInput(event, inputType)) return;
    applyView(nextProgress);
  };

  viewport.addEventListener('wheel', event => {
    if (!event.isTrusted) return;
    event.preventDefault();
    state.wheelCount += 1;
    setProgressFromInput(progress + event.deltaY / Math.max(360, state.viewportHeight * 4), event, 'wheel');
  }, { passive: false });

  viewport.addEventListener('keydown', event => {
    const keyTargets = {
      ArrowDown: progress + .16,
      ArrowRight: progress + .16,
      ArrowUp: progress - .16,
      ArrowLeft: progress - .16,
      PageDown: progress + .5,
      PageUp: progress - .5,
      Home: 0,
      End: 1
    };
    if (!(event.key in keyTargets) || !event.isTrusted) return;
    event.preventDefault();
    state.keyboardCount += 1;
    setProgressFromInput(keyTargets[event.key], event, `keyboard:${event.key}`);
  });

  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if (!registerTrustedInput(event, `pointer:${event.pointerType}:down`)) return;
    state.pointerDragCount += 1;
    state.activePointerId = event.pointerId;
    dragStartY = event.clientY;
    dragStartProgress = progress;
    viewport.setPointerCapture(event.pointerId);
    state.pointerCaptured = viewport.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    viewport.classList.add('is-dragging');
  });

  viewport.addEventListener('pointermove', event => {
    if (!event.isTrusted || state.activePointerId !== event.pointerId || !state.pointerCaptured) return;
    event.preventDefault();
    state.pointerMoveCount += 1;
    state.lastInput = `pointer:${event.pointerType}:drag`;
    const distance = dragStartY - event.clientY;
    applyView(dragStartProgress + distance / Math.max(1, state.viewportHeight * (sections.length - 1)));
  });

  const finishPointer = event => {
    if (!event.isTrusted || state.activePointerId !== event.pointerId) return;
    if (state.pointerCaptured && viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.lastInput = `pointer:${event.pointerType}:release`;
    viewport.classList.remove('is-dragging');
    applyView(progress);
  };

  viewport.addEventListener('pointerup', finishPointer);
  viewport.addEventListener('pointercancel', finishPointer);

  sectionControls.forEach(button => {
    button.addEventListener('click', event => {
      if (!event.isTrusted) return;
      state.sectionClickCount += 1;
      const index = Number(button.dataset.section);
      setProgressFromInput(index / (sections.length - 1), event, `section:${index + 1}`);
    });
  });

  const resizeObserver = new ResizeObserver(() => {
    state.resizeCount += 1;
    rebuildTrackMotion();
  });
  resizeObserver.observe(viewport);
  rebuildTrackMotion();

  window.__PREVIEW_STATE__ = () => ({
    ...state,
    progress: round(progress),
    transform: track.style.transform,
    sectionEvidence: sectionEvidence.map(evidence => ({ ...evidence })),
    computedBackgroundsMatch: sectionEvidence.map((_, index) => verifyComputedBackground(index)),
    controlStates: sectionControls.map(button => button.getAttribute('aria-current'))
  });
  window.__PREVIEW_INTERACTION_STATE__ = state;

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const computedBackgroundsMatch = sectionEvidence.every((_, index) => verifyComputedBackground(index));
    const inkVar = getComputedStyle(stage).getPropertyValue('--nav-ink').trim();
    const evidence = sectionEvidence[state.sampledSection];
    const transformCoversStage = state.maximumOffset === state.viewportHeight * (sections.length - 1)
      && state.viewportHeight === viewport.clientHeight
      && track.getBoundingClientRect().height >= viewport.clientHeight * 2.99;
    const trustedCausality = state.trustedInteractionCount === 0
      ? state.progress === 0 && state.lastInput === 'initial'
      : state.changedByTrustedInput || state.progress === 0;
    return state.claimedLibrary === 'motion@12.42.2'
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialStaticVerified
      && typeof trackMotion?.play === 'function'
      && typeof trackMotion?.pause === 'function'
      && trackMotion.state === 'paused'
      && state.motionPaused
      && state.sectionCount === 3
      && sectionEvidence.some(item => item.inkName === 'LIGHT')
      && sectionEvidence.some(item => item.inkName === 'DARK')
      && sectionEvidence.every(item => item.ratio >= 4.5 && Number.isFinite(item.luminance))
      && computedBackgroundsMatch
      && transformCoversStage
      && evidence.inkName === state.chosenInk
      && evidence.source === state.activeBackground
      && evidence.ratio === state.contrastRatio
      && inkVar === evidence.ink
      && state.contrastPass
      && state.firstFrameStatic
      && state.automaticPlayback === false
      && state.automaticCycle === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.captureClockDriven === false
      && state.syntheticInputDispatch === false
      && state.pointerCaptured === (state.activePointerId !== null)
      && state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && trustedCausality;
  };

  installPreviewController({
    id: 'self-inverting-fixed-navigation',
    library: state.claimedLibrary,
    renderer: 'dom',
    render: () => applyView(progress),
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
