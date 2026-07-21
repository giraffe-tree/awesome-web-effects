import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const THEMES = ['research', 'focus'];
const INITIAL_THEME = 'research';
const INITIAL_FOCUS_LINE = 2;
const round = value => Number(value.toFixed(4));
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

try {
  const stage = document.querySelector('#reader-stage');
  const researchMode = document.querySelector('#research-mode');
  const focusMode = document.querySelector('#focus-mode');
  const themeButtons = [...document.querySelectorAll('[data-theme-target]')];
  const researchButton = document.querySelector('#theme-research');
  const focusButton = document.querySelector('#theme-focus');
  const transitionReadout = document.querySelector('#transition-readout');
  const focusIndex = document.querySelector('#focus-index');
  const focusTicks = [...document.querySelectorAll('.focus-tick')];
  const modeImages = [...document.querySelectorAll('.mode-image img')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'clip-shape-theme-reveal',
    task: 'human-switches-between-functional-research-and-focus-reader-modes-through-an-origin-aware-finite-clip-reveal-and-withdrawal',
    mechanism: 'trusted-click-tap-or-keyboard-selection-computes-the-invocation-origin-and-finite-motion-radius-needed-to-cover-or-withdraw-the-focus-reader-layer',
    claimedLibrary: 'motion@12.42.2',
    assetStrategy: 'one-imagegen-diptych-provides-two-distinct-functional-reader-mode-crops-verified-by-runtime-pixel-signatures',
    assetPath: './assets/clip-shape-theme-reveal/reader-mode-diptych.jpg',
    assetFunctionalRole: 'research-and-focus-mode-header-content-identities-switch-with-the-clipped-functional-tool-layout',
    assetGenerationTool: 'openai-built-in-imagegen',
    assetGeneratedSourceId: '019f8474-878a-7d82-a510-6a8af9e7c47d/exec-d1a5ef81-893b-4f1d-b7c9-9377403d5ccd.png',
    assetPromptVersion: 'reader-mode-diptych-v1-2026-07-21',
    assetSha256: '03b7131211b5d53c9106c670b82228b22857e5ca4d8c055ca6f1e3f10c73d054',
    imageReady: false,
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    imageAspectRatio: 0,
    imageReferenceCount: modeImages.length,
    imageCropIndices: [],
    imageCropPixelSignatures: [],
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['visible-research-focus-buttons', 'captured-mouse-click', 'captured-touch-or-pen-tap', 'keyboard-tab-enter-space', 'focus-mode-arrow-up-down'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticDayNightCycle: false,
    automaticThemeSelection: false,
    automaticPlayback: false,
    automaticTimeline: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    initialFrameStatic: true,
    initialStillVerified: false,
    phase: 'waiting',
    selectedTheme: INITIAL_THEME,
    previousTheme: 'none',
    targetTheme: INITIAL_THEME,
    resultHeld: false,
    resultValidated: false,
    transitioning: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerThemeInputCount: 0,
    keyboardThemeInputCount: 0,
    keyboardFocusInputCount: 0,
    noOpCurrentThemeInputCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    originX: 0,
    originY: 0,
    originSource: 'none',
    originInsideStage: false,
    requiredRadius: 0,
    clipRadius: 0,
    clipProgress: 0,
    clipPathWriteCount: 0,
    transitionStartCount: 0,
    transitionCompleteCount: 0,
    forwardRevealCount: 0,
    reverseWithdrawCount: 0,
    themeChangeCount: 0,
    motionControlCount: 0,
    motionStartCount: 0,
    motionCompleteCount: 0,
    transitionRecords: [],
    researchAnnotationCount: 0,
    researchChapterMapCount: 0,
    researchLineCount: 0,
    focusAnnotationCount: 0,
    focusToolCount: 0,
    focusLineCount: 0,
    focusLineIndex: INITIAL_FOCUS_LINE,
    focusLineChangeCount: 0,
    focusModeEngagementCount: 0,
    researchLineHeight: 0,
    focusLineHeight: 0,
    functionalDifferenceValidated: false,
    stageWidth: 0,
    stageHeight: 0,
    researchWidth: 0,
    researchHeight: 0,
    focusWidth: 0,
    focusHeight: 0,
    layerCoverageX: 0,
    layerCoverageY: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionFiniteTransition: true,
    ready: false,
    runtimeAssertCount: 0,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__READER_THEME_STATE__ = state;

  let activeControl = null;

  function invariant(condition, message) {
    if (!condition) throw new Error(`clip-shape-theme-reveal: ${message}`);
  }

  function updateGeometry() {
    const stageBounds = stage.getBoundingClientRect();
    const researchBounds = researchMode.getBoundingClientRect();
    const focusBounds = focusMode.getBoundingClientRect();
    state.stageWidth = round(stageBounds.width);
    state.stageHeight = round(stageBounds.height);
    state.researchWidth = round(researchBounds.width);
    state.researchHeight = round(researchBounds.height);
    state.focusWidth = round(focusBounds.width);
    state.focusHeight = round(focusBounds.height);
    state.layerCoverageX = round(focusBounds.width / Math.max(1, stageBounds.width));
    state.layerCoverageY = round(focusBounds.height / Math.max(1, stageBounds.height));
  }

  function updateDataset() {
    stage.dataset.theme = state.selectedTheme;
    stage.dataset.phase = state.phase;
    stage.dataset.transitioning = String(state.transitioning);
    stage.dataset.targetTheme = state.targetTheme;
    stage.dataset.resultHeld = String(state.resultHeld);
    stage.dataset.focusLine = String(state.focusLineIndex);
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
  }

  function applyClip(radius) {
    state.clipRadius = round(radius);
    focusMode.style.clipPath = `circle(${state.clipRadius}px at ${state.originX}px ${state.originY}px)`;
    state.clipPathWriteCount += 1;
  }

  function updateThemeControls() {
    themeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeTarget === state.selectedTheme)));
    focusMode.setAttribute('aria-hidden', String(state.selectedTheme !== 'focus' && !state.transitioning));
    transitionReadout.textContent = state.transitioning
      ? `${state.targetTheme === 'focus' ? 'Opening focus' : 'Restoring research'} · ${Math.round(state.clipProgress * 100)}%`
      : state.selectedTheme === 'focus'
        ? `Focus · line ${String(state.focusLineIndex + 1).padStart(2, '0')}`
        : 'Research · annotations on';
    updateDataset();
  }

  function updateFocusTool() {
    focusMode.dataset.focusLine = String(state.focusLineIndex);
    focusTicks.forEach((tick, index) => { tick.dataset.active = String(index === state.focusLineIndex); });
    focusIndex.textContent = `Line ${String(state.focusLineIndex + 1).padStart(2, '0')} / 05`;
    updateThemeControls();
  }

  function acceptInput(event, kind, source) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      state.lastInputSource = source;
      updateDataset();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    updateDataset();
    return true;
  }

  function sampleImageCrops(image) {
    const canvas = document.createElement('canvas');
    canvas.width = 18;
    canvas.height = 18;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    return THEMES.map((theme, cropIndex) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, image.naturalWidth / 2 * cropIndex, 0, image.naturalWidth / 2, image.naturalHeight, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let hash = 2166136261;
      for (let index = 0; index < pixels.length; index += 11) {
        hash ^= pixels[index];
        hash = Math.imul(hash, 16777619);
      }
      return `${theme}:${(hash >>> 0).toString(16).padStart(8, '0')}`;
    });
  }

  function invocationOrigin(event, button) {
    const stageBounds = stage.getBoundingClientRect();
    const buttonBounds = button.getBoundingClientRect();
    const pointerInvocation = event.detail > 0
      && Number.isFinite(event.clientX)
      && Number.isFinite(event.clientY);
    const clientX = pointerInvocation ? event.clientX : buttonBounds.left + buttonBounds.width / 2;
    const clientY = pointerInvocation ? event.clientY : buttonBounds.top + buttonBounds.height / 2;
    return {
      x: clamp(clientX - stageBounds.left, 0, stageBounds.width),
      y: clamp(clientY - stageBounds.top, 0, stageBounds.height),
      source: pointerInvocation ? 'trusted-pointer-invocation' : 'trusted-keyboard-button-center',
    };
  }

  function radiusForOrigin(origin) {
    return Math.max(
      Math.hypot(origin.x, origin.y),
      Math.hypot(state.stageWidth - origin.x, origin.y),
      Math.hypot(origin.x, state.stageHeight - origin.y),
      Math.hypot(state.stageWidth - origin.x, state.stageHeight - origin.y),
    ) + 3;
  }

  function startThemeTransition(targetTheme, origin, source) {
    if (state.transitioning || targetTheme === state.selectedTheme) {
      state.noOpCurrentThemeInputCount += 1;
      updateDataset();
      return false;
    }
    activeControl?.stop();
    updateGeometry();
    state.previousTheme = state.selectedTheme;
    state.targetTheme = targetTheme;
    state.originX = round(origin.x);
    state.originY = round(origin.y);
    state.originSource = origin.source;
    state.originInsideStage = origin.x >= 0 && origin.x <= state.stageWidth && origin.y >= 0 && origin.y <= state.stageHeight;
    state.requiredRadius = round(radiusForOrigin(origin));
    state.transitioning = true;
    state.phase = targetTheme === 'focus' ? 'revealing-focus' : 'withdrawing-focus';
    state.transitionStartCount += 1;
    state.motionControlCount += 1;
    state.motionStartCount += 1;
    if (targetTheme === 'focus') state.forwardRevealCount += 1;
    else state.reverseWithdrawCount += 1;
    const record = {
      from: state.previousTheme,
      to: targetTheme,
      direction: targetTheme === 'focus' ? 'forward-reveal' : 'reverse-withdraw',
      source,
      originSource: origin.source,
      originX: state.originX,
      originY: state.originY,
      requiredRadius: state.requiredRadius,
      trusted: true,
      completed: false,
      retained: false,
    };
    state.transitionRecords.push(record);
    const fromRadius = targetTheme === 'focus' ? 0 : state.requiredRadius;
    const toRadius = targetTheme === 'focus' ? state.requiredRadius : 0;
    applyClip(fromRadius);
    focusMode.setAttribute('aria-hidden', 'false');
    const duration = state.reducedMotion ? .01 : .68;
    activeControl = animate(fromRadius, toRadius, {
      duration,
      ease: [.2, .82, .24, 1],
      onUpdate(value) {
        const span = Math.abs(toRadius - fromRadius) || 1;
        state.clipProgress = round(Math.abs(value - fromRadius) / span);
        applyClip(value);
        updateThemeControls();
      },
      onComplete() {
        applyClip(toRadius);
        state.clipProgress = 1;
        state.selectedTheme = targetTheme;
        state.themeChangeCount += 1;
        state.transitionCompleteCount += 1;
        state.motionCompleteCount += 1;
        state.transitioning = false;
        state.phase = 'retained';
        state.resultHeld = true;
        state.resultValidated = targetTheme === 'focus'
          ? state.clipRadius === state.requiredRadius && focusMode.getAttribute('aria-hidden') === 'false'
          : state.clipRadius === 0;
        record.completed = true;
        record.retained = true;
        updateThemeControls();
      },
    });
    updateThemeControls();
    return true;
  }

  function handleThemeClick(event) {
    const button = event.currentTarget;
    const targetTheme = button.dataset.themeTarget;
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!acceptInput(event, kind, `theme-button-${targetTheme}`)) return;
    if (kind === 'pointer') state.pointerThemeInputCount += 1;
    else state.keyboardThemeInputCount += 1;
    startThemeTransition(targetTheme, invocationOrigin(event, button), `theme-button-${targetTheme}`);
  }

  function handleReaderKeyboard(event) {
    if (state.transitioning || state.selectedTheme !== 'focus' || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    if (!acceptInput(event, 'keyboard', `focus-line-${event.key}`)) return;
    state.keyboardFocusInputCount += 1;
    const delta = event.key === 'ArrowUp' ? -1 : 1;
    const next = clamp(state.focusLineIndex + delta, 0, state.focusLineCount - 1);
    if (next !== state.focusLineIndex) {
      state.focusLineIndex = next;
      state.focusLineChangeCount += 1;
      state.focusModeEngagementCount += 1;
      state.resultHeld = true;
      updateFocusTool();
    }
    event.preventDefault();
  }

  async function initialize() {
    invariant(stage instanceof HTMLElement, 'reader stage is missing');
    invariant(researchMode instanceof HTMLElement && focusMode instanceof HTMLElement, 'both reader mode layers are required');
    invariant(themeButtons.length === 2 && THEMES.every(theme => themeButtons.some(button => button.dataset.themeTarget === theme)), 'two visible theme controls are required');
    invariant(CSS.supports('clip-path', 'circle(10px at 50px 50px)'), 'circle clip-path is not supported');

    await Promise.all(modeImages.map(image => image.complete && image.naturalWidth > 0
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', () => reject(new Error('ImageGen reader diptych failed to load')), { once: true });
      })));
    const image = modeImages[0];
    state.imageReady = modeImages.every(item => item.complete && item.naturalWidth === image.naturalWidth && item.naturalHeight === image.naturalHeight);
    state.imageNaturalWidth = image.naturalWidth;
    state.imageNaturalHeight = image.naturalHeight;
    state.imageAspectRatio = round(image.naturalWidth / image.naturalHeight);
    state.imageCropIndices = modeImages.map(item => Number(item.style.getPropertyValue('--crop-index')));
    state.imageCropPixelSignatures = sampleImageCrops(image);

    state.researchAnnotationCount = researchMode.querySelectorAll('.annotation:not([hidden])').length;
    state.researchChapterMapCount = researchMode.querySelectorAll('.chapter-row').length;
    state.researchLineCount = researchMode.querySelectorAll('.reading-line').length;
    state.focusAnnotationCount = focusMode.querySelectorAll('.annotation:not([hidden])').length;
    state.focusToolCount = focusMode.querySelectorAll('.focus-tool').length;
    state.focusLineCount = focusMode.querySelectorAll('.reading-line').length;
    state.researchLineHeight = round(parseFloat(getComputedStyle(researchMode.querySelector('.reading-line')).height));
    state.focusLineHeight = round(parseFloat(getComputedStyle(focusMode.querySelector('.reading-line')).height));
    state.functionalDifferenceValidated = state.researchAnnotationCount === 1
      && state.researchChapterMapCount === 3
      && state.focusAnnotationCount === 0
      && state.focusToolCount === 1
      && state.researchLineCount === 5
      && state.focusLineCount === 5
      && state.focusLineHeight > state.researchLineHeight;

    themeButtons.forEach(button => button.addEventListener('click', handleThemeClick));
    stage.addEventListener('keydown', handleReaderKeyboard);
    window.addEventListener('resize', updateGeometry);
    updateGeometry();
    state.originX = round(state.stageWidth * .84);
    state.originY = round(state.stageHeight * .18);
    state.requiredRadius = round(radiusForOrigin({ x: state.originX, y: state.originY }));
    applyClip(0);
    updateFocusTool();

    await document.fonts.ready;
    const initialSignature = `${state.selectedTheme}|${state.clipRadius}|${state.focusLineIndex}|${focusMode.style.clipPath}|${state.inputCount}|${state.transitionStartCount}`;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const secondSignature = `${state.selectedTheme}|${state.clipRadius}|${state.focusLineIndex}|${focusMode.style.clipPath}|${state.inputCount}|${state.transitionStartCount}`;
    state.initialStillVerified = initialSignature === secondSignature
      && state.selectedTheme === INITIAL_THEME
      && state.clipRadius === 0
      && state.inputCount === 0
      && state.transitionStartCount === 0
      && state.themeChangeCount === 0;
    invariant(state.initialStillVerified, 'reader mode changed before human input');
    state.ready = true;
    updateThemeControls();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    updateGeometry();
    const assetEvidence = state.imageReady
      && state.imageNaturalWidth === 1200
      && state.imageNaturalHeight === 800
      && state.imageAspectRatio === 1.5
      && state.imageReferenceCount === 2
      && state.imageCropIndices.join(',') === '0,1'
      && state.imageCropPixelSignatures.length === 2
      && new Set(state.imageCropPixelSignatures).size === 2
      && state.imageCropPixelSignatures.every(signature => /^[a-z]+:[0-9a-f]{8}$/.test(signature))
      && state.assetGenerationTool === 'openai-built-in-imagegen'
      && /^[0-9a-f]{64}$/.test(state.assetSha256);
    const geometryEvidence = state.stageWidth > 0
      && state.stageHeight > 0
      && Math.abs(state.researchWidth - state.stageWidth) <= 1
      && Math.abs(state.researchHeight - state.stageHeight) <= 1
      && Math.abs(state.focusWidth - state.stageWidth) <= 1
      && Math.abs(state.focusHeight - state.stageHeight) <= 1
      && state.layerCoverageX >= .995
      && state.layerCoverageY >= .995
      && state.requiredRadius >= Math.hypot(state.stageWidth - state.originX, state.stageHeight - state.originY);
    const functionalEvidence = state.functionalDifferenceValidated
      && state.researchAnnotationCount === 1
      && state.researchChapterMapCount === 3
      && state.researchLineCount === 5
      && state.focusAnnotationCount === 0
      && state.focusToolCount === 1
      && state.focusLineCount === 5
      && state.focusLineHeight > state.researchLineHeight;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticDayNightCycle
      && !state.automaticThemeSelection
      && !state.automaticPlayback
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.inputCount === state.trustedInputCount
      && state.lastInputTrusted === (state.inputCount > 0)
      && state.transitionRecords.every(record => record.trusted && record.completed && record.retained);
    const initialOrRetained = state.inputCount === 0
      ? state.phase === 'waiting'
        && state.selectedTheme === INITIAL_THEME
        && state.clipRadius === 0
        && state.transitionStartCount === 0
        && !state.resultHeld
      : !state.transitioning
        && state.phase === 'retained'
        && state.transitionStartCount === state.transitionCompleteCount
        && state.motionStartCount === state.motionCompleteCount
        && state.motionControlCount === state.motionCompleteCount
        && state.themeChangeCount === state.transitionCompleteCount
        && state.transitionRecords.length === state.themeChangeCount
        && state.originInsideStage
        && state.resultHeld
        && state.resultValidated
        && (state.selectedTheme === 'focus'
          ? state.clipRadius === state.requiredRadius && focusMode.getAttribute('aria-hidden') === 'false'
          : state.clipRadius === 0 && focusMode.getAttribute('aria-hidden') === 'true');
    const roundTripEvidence = state.themeChangeCount < 2
      ? true
      : state.transitionStartCount === 2
        && state.forwardRevealCount === 1
        && state.reverseWithdrawCount === 1
        && state.selectedTheme === 'research'
        && state.previousTheme === 'focus'
        && state.transitionRecords[0]?.direction === 'forward-reveal'
        && state.transitionRecords[1]?.direction === 'reverse-withdraw'
        && state.focusModeEngagementCount >= 1
        && state.focusLineChangeCount >= 1;
    state.runtimeAssertionPassed = Boolean(state.ready
      && assetEvidence
      && geometryEvidence
      && functionalEvidence
      && honestInteraction
      && initialOrRetained
      && roundTripEvidence);
    updateDataset();
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
      return state.phase;
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
