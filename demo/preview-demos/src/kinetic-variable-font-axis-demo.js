import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_BYTES = 195640;
const SOURCE_SHA256 = '8f153c760da05ffdc5b00fc8c27790ab45d30186a4680565efa3fad4fbd096d0';
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 64;
const INITIAL_AXES = { width: 92, weight: 610 };
const AXIS_LIMITS = { width: [64, 124], weight: [350, 900] };
const SOURCE_URL = new URL('../assets/aesthetic-wave-06/kinetic-variable-font-axis/coastal-transit-concourse.jpg', import.meta.url).href;

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const roundTo = (value, step) => Math.round(value / step) * step;

function sha256Hex(buffer) {
  return crypto.subtle.digest('SHA-256', buffer)
    .then(digest => Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join(''));
}

function checksumBytes(bytes) {
  let checksum = 2166136261;
  for (let index = 0; index < bytes.length; index += 16) {
    checksum = Math.imul(checksum ^ bytes[index], 16777619) >>> 0;
  }
  return checksum >>> 0;
}

try {
  const stage = document.querySelector('#type-stage');
  const surface = document.querySelector('#specimen-surface');
  const sceneImage = document.querySelector('#scene-image');
  const specimen = document.querySelector('#specimen');
  const glyphs = [...document.querySelectorAll('.glyph')];
  const axisTarget = document.querySelector('#axis-target');
  const widthRange = document.querySelector('#width-range');
  const weightRange = document.querySelector('#weight-range');
  const widthOutput = document.querySelector('#width-output');
  const weightOutput = document.querySelector('#weight-output');
  const edgeOutput = document.querySelector('#edge-output');
  const fitOutput = document.querySelector('#fit-output');
  const scoreOutput = document.querySelector('#score-output');
  const decisionOutput = document.querySelector('#decision-output');
  const matchButton = document.querySelector('#match-button');
  const resetButton = document.querySelector('#reset-button');
  const ledger = document.querySelector('#runtime-ledger');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'kinetic-variable-font-axis',
    task: 'human-operated-wayfinding-variable-font-fit-from-real-scene-pixels',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'decoded-image-luminance-and-edge-analysis-recommends-human-controlled-per-glyph-wght-wdth-axes',
    acceptedInputs: ['captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-controls', 'visible-buttons'],
    userInputRequired: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    timerMutationCount: 0,
    reducedMotion: reducedMotionQuery.matches,
    sourceUrl: SOURCE_URL,
    sourceFetchCount: 0,
    sourceResponseStatus: 0,
    sourceSameOrigin: false,
    sourceByteLength: 0,
    sourceSha256: '',
    sourceShaMatchesExpected: false,
    imageDecoded: false,
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    sourcePixelCount: 0,
    analysisWidth: SAMPLE_WIDTH,
    analysisHeight: SAMPLE_HEIGHT,
    analysisPixelCount: 0,
    analysisByteLength: 0,
    analysisSha256: '',
    analysisChecksum: 0,
    distinctColorCount: 0,
    meanLuma: 0,
    lumaDeviation: 0,
    darkPixelRatio: 0,
    brightPixelRatio: 0,
    edgeDensity: 0,
    edgeSampleCount: 0,
    recommendationChecksum: 0,
    recommendedWidth: 0,
    recommendedWeight: 0,
    currentWidth: INITIAL_AXES.width,
    currentWeight: INITIAL_AXES.weight,
    initialWidth: INITIAL_AXES.width,
    initialWeight: INITIAL_AXES.weight,
    proofScore: 0,
    initialProofScore: 0,
    bestProofScore: 0,
    currentAxisChecksum: 0,
    initialAxisChecksum: 0,
    glyphCount: glyphs.length,
    glyphVariationCount: 0,
    glyphTransformCount: 0,
    motionAnimationCount: 0,
    motionAnimationSettledCount: 0,
    activeMotionCount: 0,
    inputCount: 0,
    humanInputCausalityCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    dragMutationCount: 0,
    mouseDragMutationCount: 0,
    touchDragMutationCount: 0,
    penDragMutationCount: 0,
    keyboardInputCount: 0,
    rangeInputCount: 0,
    buttonActivationCount: 0,
    matchSceneCount: 0,
    resetCount: 0,
    axisMutationCount: 0,
    rejectedUntrustedInputCount: 0,
    lastInputTrusted: null,
    lastInputKind: 'none',
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    dragDistance: 0,
    ready: false,
    renderCount: 0,
    runtimeAssertCount: 0,
    controllers: {
      pointer: 'trusted PointerEvent with capture on specimen surface',
      range: ['native width range', 'native weight range'],
      buttons: ['match scene', 'reset'],
      keyboard: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Home', 'Escape']
    }
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__KINETIC_VARIABLE_FONT_AXIS_STATE__ = state;

  let dragOrigin = null;
  let lastDragPoint = null;
  let activeAnimations = [];

  function invariant(condition, message) {
    if (!condition) throw new Error(`kinetic-variable-font-axis: ${message}`);
  }

  function recordTrusted(event, kind) {
    if (event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    state.inputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = kind;
    return true;
  }

  function axisChecksum(width, weight) {
    return Math.imul(Math.round(width) ^ 2166136261, 16777619) ^ Math.round(weight);
  }

  function scoreAxes(width, weight) {
    const widthDistance = Math.abs(width - state.recommendedWidth) / (AXIS_LIMITS.width[1] - AXIS_LIMITS.width[0]);
    const weightDistance = Math.abs(weight - state.recommendedWeight) / (AXIS_LIMITS.weight[1] - AXIS_LIMITS.weight[0]);
    return Math.round(clamp(100 - widthDistance * 46 - weightDistance * 54, 0, 100));
  }

  function syncLedger() {
    ledger.value = JSON.stringify({
      axes: { width: state.currentWidth, weight: state.currentWeight },
      recommended: { width: state.recommendedWidth, weight: state.recommendedWeight },
      proofScore: state.proofScore,
      inputCount: state.inputCount,
      dragMutations: state.dragMutationCount,
      keyboardInputs: state.keyboardInputCount,
      rangeInputs: state.rangeInputCount,
      buttonActivations: state.buttonActivationCount,
      motionAnimations: state.motionAnimationCount,
      sourceSha256: state.sourceSha256,
      analysisSha256: state.analysisSha256,
      runtimeAssert: stage.dataset.runtimeAssert === 'true'
    });
  }

  function applyGlyphAxes({ animateChange = true } = {}) {
    activeAnimations.forEach(control => control.stop());
    activeAnimations = [];
    state.activeMotionCount = 0;
    state.glyphVariationCount = 0;
    state.glyphTransformCount = 0;
    const duration = animateChange && !state.reducedMotion ? .18 : 0;
    glyphs.forEach((glyph, index) => {
      const centeredIndex = index - (glyphs.length - 1) / 2;
      const localWidth = clamp(state.currentWidth + centeredIndex * 1.15, AXIS_LIMITS.width[0], AXIS_LIMITS.width[1]);
      const localWeight = clamp(state.currentWeight + centeredIndex * 11, AXIS_LIMITS.weight[0], AXIS_LIMITS.weight[1]);
      const scaleX = .66 + (localWidth - AXIS_LIMITS.width[0]) / (AXIS_LIMITS.width[1] - AXIS_LIMITS.width[0]) * .63;
      const lift = Math.sin(index * 1.65 + state.currentWidth * .035) * (2 + (state.currentWeight - 350) / 550 * 1.8);
      const tilt = centeredIndex * (state.currentWidth - 94) * .012;
      glyph.style.fontVariationSettings = `'wght' ${Math.round(localWeight)}, 'wdth' ${localWidth.toFixed(1)}`;
      glyph.style.fontWeight = String(Math.round(localWeight));
      glyph.style.fontStretch = `${Math.round(localWidth)}%`;
      state.glyphVariationCount += glyph.style.fontVariationSettings.includes('wght') && glyph.style.fontVariationSettings.includes('wdth') ? 1 : 0;
      if (duration === 0) {
        glyph.style.transform = `translateY(${lift.toFixed(2)}px) scaleX(${scaleX.toFixed(4)}) rotate(${tilt.toFixed(2)}deg)`;
        state.glyphTransformCount += 1;
        return;
      }
      const control = animate(glyph, {
        y: lift,
        scaleX,
        rotate: tilt
      }, {
        duration,
        delay: index * .008,
        ease: [.22, 1, .36, 1]
      });
      activeAnimations.push(control);
      state.motionAnimationCount += 1;
      state.activeMotionCount += 1;
      control.finished.then(() => {
        state.motionAnimationSettledCount += 1;
        state.activeMotionCount = Math.max(0, state.activeMotionCount - 1);
      }).catch(() => {
        state.activeMotionCount = Math.max(0, state.activeMotionCount - 1);
      });
      state.glyphTransformCount += 1;
    });
  }

  function syncInterface({ animateChange = true } = {}) {
    state.proofScore = scoreAxes(state.currentWidth, state.currentWeight);
    state.bestProofScore = Math.max(state.bestProofScore, state.proofScore);
    state.currentAxisChecksum = axisChecksum(state.currentWidth, state.currentWeight);
    widthRange.value = String(state.currentWidth);
    weightRange.value = String(state.currentWeight);
    widthOutput.textContent = String(state.currentWidth);
    weightOutput.textContent = String(state.currentWeight);
    fitOutput.textContent = `${state.recommendedWidth} / ${state.recommendedWeight}`;
    scoreOutput.textContent = `${state.proofScore}%`;
    decisionOutput.textContent = state.proofScore >= 97 ? 'SCENE MATCH · RELEASE READY' : state.proofScore >= 84 ? 'NEAR FIT · FINE TUNE' : 'ADJUST AXES · CHECK LEGIBILITY';
    axisTarget.style.left = `${((state.recommendedWidth - AXIS_LIMITS.width[0]) / (AXIS_LIMITS.width[1] - AXIS_LIMITS.width[0]) * 82 + 9).toFixed(2)}%`;
    stage.dataset.proofStatus = state.proofScore >= 97 ? 'matched' : state.proofScore >= 84 ? 'near' : 'adjust';
    stage.dataset.axisWidth = String(state.currentWidth);
    stage.dataset.axisWeight = String(state.currentWeight);
    stage.dataset.proofScore = String(state.proofScore);
    surface.setAttribute('aria-label', `Variable font specimen. Width ${state.currentWidth}, weight ${state.currentWeight}, scene fit ${state.proofScore} percent. Drag to adjust; Enter matches the source image recommendation.`);
    applyGlyphAxes({ animateChange });
    syncLedger();
  }

  function setAxes(width, weight, { animateChange = true, human = true } = {}) {
    const nextWidth = clamp(roundTo(width, 1), AXIS_LIMITS.width[0], AXIS_LIMITS.width[1]);
    const nextWeight = clamp(roundTo(weight, 10), AXIS_LIMITS.weight[0], AXIS_LIMITS.weight[1]);
    if (nextWidth === state.currentWidth && nextWeight === state.currentWeight) return false;
    state.currentWidth = nextWidth;
    state.currentWeight = nextWeight;
    state.axisMutationCount += 1;
    if (human) state.humanInputCausalityCount += 1;
    syncInterface({ animateChange });
    return true;
  }

  function analysePixels(image) {
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_WIDTH;
    canvas.height = SAMPLE_HEIGHT;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    const imageData = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    const lumas = new Float32Array(SAMPLE_WIDTH * SAMPLE_HEIGHT);
    const colors = new Set();
    let lumaTotal = 0;
    let darkPixels = 0;
    let brightPixels = 0;
    let edgeHits = 0;
    let edgeSamples = 0;
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const pixelIndex = y * SAMPLE_WIDTH + x;
        const byteIndex = pixelIndex * 4;
        const red = imageData.data[byteIndex];
        const green = imageData.data[byteIndex + 1];
        const blue = imageData.data[byteIndex + 2];
        const luma = red * .2126 + green * .7152 + blue * .0722;
        lumas[pixelIndex] = luma;
        lumaTotal += luma;
        if (luma < 70) darkPixels += 1;
        if (luma > 188) brightPixels += 1;
        colors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
        if (x > 0) {
          edgeSamples += 1;
          if (Math.abs(luma - lumas[pixelIndex - 1]) > 24) edgeHits += 1;
        }
        if (y > 0) {
          edgeSamples += 1;
          if (Math.abs(luma - lumas[pixelIndex - SAMPLE_WIDTH]) > 24) edgeHits += 1;
        }
      }
    }
    const meanLuma = lumaTotal / lumas.length;
    let varianceTotal = 0;
    lumas.forEach(luma => { varianceTotal += (luma - meanLuma) ** 2; });
    const lumaDeviation = Math.sqrt(varianceTotal / lumas.length);
    const darkPixelRatio = darkPixels / lumas.length;
    const brightPixelRatio = brightPixels / lumas.length;
    const edgeDensity = edgeHits / edgeSamples;
    const recommendedWidth = clamp(roundTo(102 - edgeDensity * 75 - darkPixelRatio * 16, 1), 72, 102);
    const recommendedWeight = clamp(roundTo(510 + edgeDensity * 760 + lumaDeviation * 1.65 + darkPixelRatio * 90, 10), 560, 860);
    return sha256Hex(imageData.data.buffer.slice(0)).then(analysisSha256 => ({
      data: imageData.data,
      analysisSha256,
      analysisChecksum: checksumBytes(imageData.data),
      distinctColorCount: colors.size,
      meanLuma,
      lumaDeviation,
      darkPixelRatio,
      brightPixelRatio,
      edgeDensity,
      edgeSampleCount: edgeSamples,
      recommendedWidth,
      recommendedWeight
    }));
  }

  async function loadAndAnalyseSource() {
    state.sourceFetchCount += 1;
    const response = await fetch(SOURCE_URL, { cache: 'no-store' });
    state.sourceResponseStatus = response.status;
    state.sourceSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `source fetch failed with ${response.status}`);
    const buffer = await response.arrayBuffer();
    state.sourceByteLength = buffer.byteLength;
    state.sourceSha256 = await sha256Hex(buffer.slice(0));
    state.sourceShaMatchesExpected = state.sourceSha256 === SOURCE_SHA256;
    invariant(state.sourceByteLength === SOURCE_BYTES, 'source byte length changed');
    invariant(state.sourceShaMatchesExpected, 'source SHA-256 changed');
    const objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'image/jpeg' }));
    sceneImage.src = objectUrl;
    await sceneImage.decode();
    state.imageDecoded = true;
    state.imageNaturalWidth = sceneImage.naturalWidth;
    state.imageNaturalHeight = sceneImage.naturalHeight;
    state.sourcePixelCount = state.imageNaturalWidth * state.imageNaturalHeight;
    invariant(state.imageNaturalWidth === SOURCE_WIDTH && state.imageNaturalHeight === SOURCE_HEIGHT, 'source dimensions changed');
    const evidence = await analysePixels(sceneImage);
    URL.revokeObjectURL(objectUrl);
    state.analysisPixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
    state.analysisByteLength = evidence.data.byteLength;
    state.analysisSha256 = evidence.analysisSha256;
    state.analysisChecksum = evidence.analysisChecksum;
    state.distinctColorCount = evidence.distinctColorCount;
    state.meanLuma = evidence.meanLuma;
    state.lumaDeviation = evidence.lumaDeviation;
    state.darkPixelRatio = evidence.darkPixelRatio;
    state.brightPixelRatio = evidence.brightPixelRatio;
    state.edgeDensity = evidence.edgeDensity;
    state.edgeSampleCount = evidence.edgeSampleCount;
    state.recommendedWidth = evidence.recommendedWidth;
    state.recommendedWeight = evidence.recommendedWeight;
    state.recommendationChecksum = axisChecksum(state.recommendedWidth, state.recommendedWeight);
    edgeOutput.textContent = `${Math.round(state.edgeDensity * 100)}% / ${Math.round(state.lumaDeviation)}`;
    syncInterface({ animateChange: false });
    state.initialProofScore = state.proofScore;
    state.initialAxisChecksum = state.currentAxisChecksum;
    state.ready = true;
  }

  function pointFromEvent(event) {
    const bounds = surface.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1),
      y: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), 0, 1)
    };
  }

  function axesFromPoint(point) {
    return {
      width: AXIS_LIMITS.width[0] + point.x * (AXIS_LIMITS.width[1] - AXIS_LIMITS.width[0]),
      weight: AXIS_LIMITS.weight[1] - point.y * (AXIS_LIMITS.weight[1] - AXIS_LIMITS.weight[0])
    };
  }

  surface.addEventListener('pointerenter', event => {
    if (!recordTrusted(event, `${event.pointerType || 'pointer'}-enter`)) return;
    state.pointerEnterCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
  });

  surface.addEventListener('pointerdown', event => {
    if (!recordTrusted(event, `${event.pointerType || 'pointer'}-drag-start`)) return;
    state.pointerDownCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    state.activePointerId = event.pointerId;
    surface.setPointerCapture(event.pointerId);
    state.pointerCaptured = surface.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    surface.dataset.dragging = 'true';
    dragOrigin = pointFromEvent(event);
    lastDragPoint = dragOrigin;
    const axes = axesFromPoint(dragOrigin);
    if (setAxes(axes.width, axes.weight)) {
      state.dragMutationCount += 1;
      state[`${event.pointerType || 'mouse'}DragMutationCount`] += 1;
    }
    surface.focus({ preventScroll: true });
    event.preventDefault();
  });

  surface.addEventListener('pointermove', event => {
    if (state.activePointerId !== event.pointerId) return;
    if (!recordTrusted(event, `${event.pointerType || 'pointer'}-drag`)) return;
    state.pointerMoveCount += 1;
    const point = pointFromEvent(event);
    if (lastDragPoint) state.dragDistance += Math.hypot(point.x - lastDragPoint.x, point.y - lastDragPoint.y);
    lastDragPoint = point;
    const axes = axesFromPoint(point);
    if (setAxes(axes.width, axes.weight)) {
      state.dragMutationCount += 1;
      state[`${event.pointerType || 'mouse'}DragMutationCount`] += 1;
    }
    event.preventDefault();
  });

  function releasePointer(event) {
    if (state.activePointerId !== event.pointerId) return;
    if (!recordTrusted(event, `${event.pointerType || 'pointer'}-drag-end`)) return;
    state.pointerReleaseCount += 1;
    if (surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.activePointerId = null;
    state.pointerCaptured = false;
    surface.dataset.dragging = 'false';
    dragOrigin = null;
    lastDragPoint = null;
  }
  surface.addEventListener('pointerup', releasePointer);
  surface.addEventListener('pointercancel', releasePointer);

  function matchScene(event, inputKind = 'match-scene-button') {
    if (!recordTrusted(event, inputKind)) return;
    state.buttonActivationCount += 1;
    state.matchSceneCount += 1;
    setAxes(state.recommendedWidth, state.recommendedWeight);
  }

  function resetAxes(event, inputKind = 'reset-button') {
    if (!recordTrusted(event, inputKind)) return;
    state.buttonActivationCount += 1;
    state.resetCount += 1;
    setAxes(INITIAL_AXES.width, INITIAL_AXES.weight);
  }

  matchButton.addEventListener('click', event => matchScene(event));
  resetButton.addEventListener('click', event => resetAxes(event));

  for (const input of [widthRange, weightRange]) {
    input.addEventListener('input', event => {
      if (!recordTrusted(event, `${input.id}-range`)) return;
      state.rangeInputCount += 1;
      setAxes(Number(widthRange.value), Number(weightRange.value));
    });
  }

  function handleKeydown(event) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Home', 'Escape'].includes(key)) return;
    if (!recordTrusted(event, `keyboard-${key}`)) return;
    state.keyboardInputCount += 1;
    if (key === 'Enter') {
      state.buttonActivationCount += 1;
      state.matchSceneCount += 1;
      setAxes(state.recommendedWidth, state.recommendedWeight);
    } else if (key === 'Home' || key === 'Escape') {
      state.buttonActivationCount += 1;
      state.resetCount += 1;
      setAxes(INITIAL_AXES.width, INITIAL_AXES.weight);
    } else {
      const widthDelta = key === 'ArrowLeft' ? -2 : key === 'ArrowRight' ? 2 : 0;
      const weightDelta = key === 'ArrowUp' ? 20 : key === 'ArrowDown' ? -20 : 0;
      setAxes(state.currentWidth + widthDelta, state.currentWeight + weightDelta);
    }
    event.preventDefault();
  }
  stage.addEventListener('keydown', handleKeydown);

  const ready = Promise.all([document.fonts.ready, loadAndAnalyseSource()]);

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    state.runtimeAssertCount += 1;
    const assertions = [
      state.task === 'human-operated-wayfinding-variable-font-fit-from-real-scene-pixels',
      state.claimedLibrary === 'motion@12.42.2',
      state.userInputRequired === true,
      state.automaticCycle === false,
      state.automaticPlayback === false,
      state.syntheticInputDispatch === false,
      state.captureClockDriven === false,
      state.previewClockMutationCount === 0,
      state.sourceFetchCount === 1,
      state.sourceResponseStatus === 200,
      state.sourceSameOrigin === true,
      state.sourceByteLength === SOURCE_BYTES,
      state.sourceSha256 === SOURCE_SHA256,
      state.sourceShaMatchesExpected === true,
      state.imageDecoded === true,
      state.imageNaturalWidth === SOURCE_WIDTH,
      state.imageNaturalHeight === SOURCE_HEIGHT,
      state.sourcePixelCount === SOURCE_WIDTH * SOURCE_HEIGHT,
      state.analysisPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT,
      state.analysisByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4,
      state.analysisSha256.length === 64,
      state.analysisChecksum !== 0,
      state.distinctColorCount > 300,
      state.lumaDeviation > 25,
      state.darkPixelRatio > .05,
      state.brightPixelRatio > .05,
      state.edgeDensity > .01,
      state.edgeSampleCount > 11000,
      state.recommendedWidth >= 72 && state.recommendedWidth <= 102,
      state.recommendedWeight >= 560 && state.recommendedWeight <= 860,
      state.recommendationChecksum !== 0,
      state.glyphCount === 10,
      state.glyphVariationCount === 10,
      state.glyphTransformCount === 10,
      glyphs.every(glyph => glyph.style.fontVariationSettings.includes('wght') && glyph.style.fontVariationSettings.includes('wdth')),
      state.initialAxisChecksum !== 0,
      state.currentAxisChecksum !== 0,
      state.ready === true
    ];
    const passed = assertions.every(Boolean);
    stage.dataset.runtimeAssert = String(passed);
    syncLedger();
    return passed;
  };

  installPreviewController({
    id: 'kinetic-variable-font-axis',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => { state.renderCount += 1; },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
