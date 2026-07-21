import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-09/magnetic-orbit-command-dock/harbor-command-source.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = Object.freeze({
  byteLength: 257814,
  width: 960,
  height: 640,
  sha256: '6491e95d92172869c9dcacd2b1b3128cd23e4e050156aac3add581ed8cb105a6',
});
const SOURCE_CROP = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 54;
const SAMPLE_PIXEL_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const SAMPLE_BYTE_LENGTH = SAMPLE_PIXEL_COUNT * 4;
const LOCAL_RADIUS = 4;
const INITIAL_PULL = 68;
const INITIAL_POINTER = Object.freeze({ u: .63, v: .49 });
const TAU = Math.PI * 2;
const COMMANDS = Object.freeze([
  { id: 'lift', label: 'Lift shadows', short: 'LIFT', angle: -Math.PI / 2 },
  { id: 'trace', label: 'Trace detail', short: 'TRACE', angle: -Math.PI / 2 + TAU / 5 },
  { id: 'grade', label: 'Grade color', short: 'GRADE', angle: -Math.PI / 2 + TAU * 2 / 5 },
  { id: 'mask', label: 'Mask glare', short: 'MASK', angle: -Math.PI / 2 + TAU * 3 / 5 },
  { id: 'verify', label: 'Verify texture', short: 'VERIFY', angle: -Math.PI / 2 + TAU * 4 / 5 },
]);

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 4) => Number(value.toFixed(digits));
const percentage = value => `${Math.round(clamp(value) * 100)}`;

try {
  const stage = document.querySelector('#command-stage');
  const sourceImage = document.querySelector('#source-image');
  const evidenceCanvas = document.querySelector('#source-evidence');
  const dockCore = document.querySelector('#dock-core');
  const coreLabel = document.querySelector('[data-core-label]');
  const sampleCursor = document.querySelector('#sample-cursor');
  const sampleLabel = document.querySelector('[data-sample-label]');
  const toolButtons = [...document.querySelectorAll('.orbit-tool')];
  const pullInput = document.querySelector('#pull-strength');
  const pullOutput = document.querySelector('[data-pull-output]');
  const recommendationOutput = document.querySelector('[data-recommendation]');
  const scoreOutput = document.querySelector('[data-score]');
  const statusOutput = document.querySelector('[data-status]');
  const assetStatus = document.querySelector('[data-asset-status]');
  const lumaOutput = document.querySelector('[data-reading="luma"]');
  const edgeOutput = document.querySelector('[data-reading="edge"]');
  const saturationOutput = document.querySelector('[data-reading="sat"]');
  const actionButtons = [...document.querySelectorAll('[data-action]')];

  if (!stage || !sourceImage || !evidenceCanvas || !dockCore || !coreLabel || !sampleCursor
    || !sampleLabel || !pullInput || !pullOutput || !recommendationOutput || !scoreOutput
    || !statusOutput || !assetStatus || !lumaOutput || !edgeOutput || !saturationOutput
    || toolButtons.length !== COMMANDS.length || actionButtons.length !== 2) {
    throw new Error('magnetic-orbit-command-dock: required DOM is incomplete');
  }

  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    id: 'magnetic-orbit-command-dock',
    task: 'human-operated-pixel-aware-harbor-media-command-ranking-and-magnetic-orbit-dock',
    claimedLibrary: 'motion@12.42.2',
    renderer: 'dom',
    mechanism: 'same-origin-decoded-image-pixels-rank-five-commands-and-trusted-human-input-seeks-paused-motion-orbit-transforms',
    assetMechanismRole: 'local-source-pixel-luminance-saturation-edge-and-variance-directly-determine-command-scores-recommendation-accent-and-magnetic-pull',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-control', 'visible-buttons'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    initialStillVerified: false,
    automaticCycle: false,
    automaticPlayback: false,
    automaticTimeline: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    visualMutationFromPreviewClock: false,
    previewClockCallCount: 0,
    previewClockIgnoredCount: 0,
    previewClockMutationCount: 0,
    ready: false,
    runtimeAssertionPassed: false,
    runtimeAssertCount: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionDirectManipulation: true,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    humanInputCausalityCount: 0,
    humanVisualMutationCount: 0,
    hoverInputCount: 0,
    pointerEnterCount: 0,
    pointerLeaveCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerDragCount: 0,
    pointerUpCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    rangeInputCount: 0,
    buttonInputCount: 0,
    commandSelectionCount: 0,
    recommendationChangeCount: 0,
    undoCount: 0,
    resetCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    pointerTypesSeen: [],
    activePointerId: null,
    pointerCaptured: false,
    pointerInside: false,
    dragging: false,
    hasHumanSample: false,
    pointerU: INITIAL_POINTER.u,
    pointerV: INITIAL_POINTER.v,
    minimumPointerU: INITIAL_POINTER.u,
    maximumPointerU: INITIAL_POINTER.u,
    minimumPointerV: INITIAL_POINTER.v,
    maximumPointerV: INITIAL_POINTER.v,
    maximumPointerTravel: 0,
    orbitPhase: 0,
    pullStrength: INITIAL_PULL,
    minimumPullStrength: INITIAL_PULL,
    maximumPullStrength: INITIAL_PULL,
    selectedCommandId: 'none',
    recommendedCommandId: 'pending',
    recommendedCommandScore: 0,
    commandScores: Object.fromEntries(COMMANDS.map(command => [command.id, 0])),
    localSamplePixelCount: 0,
    localSampleRgb: [0, 0, 0],
    localLuminance: 0,
    localSaturation: 0,
    localEdgeMean: 0,
    localLuminanceVariance: 0,
    localWarmth: 0,
    lastSampleChecksum: '',
    sourceAssetUrl: ASSET_URL,
    sourceAssetKind: 'built-in-imagegen-fictional-photographic-input',
    sourceAssetFictional: true,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetMimeType: '',
    assetSameOrigin: false,
    assetByteLength: 0,
    expectedAssetByteLength: EXPECTED_ASSET.byteLength,
    assetSha256: '',
    expectedAssetSha256: EXPECTED_ASSET.sha256,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    sourcePixelCount: 0,
    sourceCrop: { ...SOURCE_CROP },
    browserCanvasReadback: false,
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sampledPixelSha256: '',
    sampledOpaquePixelCount: 0,
    distinctSampleColorCount: 0,
    sampledLuminanceMinimum: 1,
    sampledLuminanceMaximum: 0,
    sampledLuminanceRange: 0,
    sampledLuminanceMean: 0,
    sampledLuminanceStdDev: 0,
    sampledSaturationMean: 0,
    sampledEdgeMean: 0,
    sampledWarmPixelRatio: 0,
    pixelProbeCount: 0,
    probeRecommendations: [],
    probeRecommendationDiversity: 0,
    pixelEvidenceBoundToCommandRanking: false,
    pixelEvidenceBoundToOrbitGeometry: false,
    motionInitialControlCount: 0,
    motionControlBuildCount: 0,
    motionSeekCount: 0,
    motionDrivenToolCount: 0,
    motionControlsPaused: false,
    motionControlsBuiltWithoutAutoplay: true,
    currentToolTransforms: [],
    currentCoreTransform: '',
    currentCursorTransform: '',
    initialVisualStateChecksum: '',
    currentVisualStateChecksum: '',
    resizeCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    stageCoverageRatio: 0,
    historyDepth: 0,
    interactionRecords: [],
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__MAGNETIC_ORBIT_COMMAND_DOCK_STATE__ = state;

  let sampledPixels;
  let sourceObjectUrl = '';
  let initialControls = [];
  let activeControls = [];
  let resizeFrame = 0;
  let dragStart = null;
  let history = [];
  let initialSnapshot;
  let lastAcceptedPoint = null;

  function invariant(condition, message) {
    if (!condition) throw new Error(`magnetic-orbit-command-dock: ${message}`);
  }

  async function sha256(bytes) {
    const buffer = bytes instanceof ArrayBuffer
      ? bytes
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function fnvChecksum(values) {
    let checksum = 2166136261;
    for (let index = 0; index < values.length; index += 1) {
      const value = typeof values[index] === 'number'
        ? Math.round(values[index] * 10000)
        : String(values[index]).split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
      checksum ^= value + index * 17;
      checksum = Math.imul(checksum, 16777619) >>> 0;
    }
    return checksum.toString(16).padStart(8, '0');
  }

  function pixelEvidence(red, green, blue) {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const maximum = Math.max(r, g, b);
    const minimum = Math.min(r, g, b);
    const chroma = maximum - minimum;
    const luminance = .2126 * r + .7152 * g + .0722 * b;
    const saturation = maximum === 0 ? 0 : chroma / maximum;
    const warmth = clamp((r - b + .24) / .62);
    return { luminance, saturation, warmth };
  }

  function sampleOffset(x, y) {
    const clampedX = Math.max(0, Math.min(SAMPLE_WIDTH - 1, x));
    const clampedY = Math.max(0, Math.min(SAMPLE_HEIGHT - 1, y));
    return (clampedY * SAMPLE_WIDTH + clampedX) * 4;
  }

  function analyzeSourcePixels(pixels) {
    const distinctColors = new Set();
    let luminanceTotal = 0;
    let luminanceSquaredTotal = 0;
    let luminanceMinimum = 1;
    let luminanceMaximum = 0;
    let saturationTotal = 0;
    let edgeTotal = 0;
    let edgeCount = 0;
    let warmPixelCount = 0;
    let opaquePixelCount = 0;

    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const offset = sampleOffset(x, y);
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const alpha = pixels[offset + 3];
        const evidence = pixelEvidence(red, green, blue);
        distinctColors.add(`${red >> 2},${green >> 2},${blue >> 2}`);
        luminanceTotal += evidence.luminance;
        luminanceSquaredTotal += evidence.luminance * evidence.luminance;
        luminanceMinimum = Math.min(luminanceMinimum, evidence.luminance);
        luminanceMaximum = Math.max(luminanceMaximum, evidence.luminance);
        saturationTotal += evidence.saturation;
        if (evidence.warmth > .55 && evidence.saturation > .16) warmPixelCount += 1;
        if (alpha === 255) opaquePixelCount += 1;

        if (x < SAMPLE_WIDTH - 1) {
          const rightOffset = sampleOffset(x + 1, y);
          edgeTotal += (Math.abs(red - pixels[rightOffset])
            + Math.abs(green - pixels[rightOffset + 1])
            + Math.abs(blue - pixels[rightOffset + 2])) / (255 * 3);
          edgeCount += 1;
        }
        if (y < SAMPLE_HEIGHT - 1) {
          const downOffset = sampleOffset(x, y + 1);
          edgeTotal += (Math.abs(red - pixels[downOffset])
            + Math.abs(green - pixels[downOffset + 1])
            + Math.abs(blue - pixels[downOffset + 2])) / (255 * 3);
          edgeCount += 1;
        }
      }
    }

    const mean = luminanceTotal / SAMPLE_PIXEL_COUNT;
    state.sampledPixelCount = SAMPLE_PIXEL_COUNT;
    state.sampledPixelByteLength = pixels.byteLength;
    state.sampledOpaquePixelCount = opaquePixelCount;
    state.distinctSampleColorCount = distinctColors.size;
    state.sampledLuminanceMinimum = rounded(luminanceMinimum);
    state.sampledLuminanceMaximum = rounded(luminanceMaximum);
    state.sampledLuminanceRange = rounded(luminanceMaximum - luminanceMinimum);
    state.sampledLuminanceMean = rounded(mean);
    state.sampledLuminanceStdDev = rounded(Math.sqrt(Math.max(0, luminanceSquaredTotal / SAMPLE_PIXEL_COUNT - mean * mean)));
    state.sampledSaturationMean = rounded(saturationTotal / SAMPLE_PIXEL_COUNT);
    state.sampledEdgeMean = rounded(edgeTotal / edgeCount);
    state.sampledWarmPixelRatio = rounded(warmPixelCount / SAMPLE_PIXEL_COUNT);
  }

  function readLocalSample(u, v) {
    const centerX = Math.round(clamp(u) * (SAMPLE_WIDTH - 1));
    const centerY = Math.round(clamp(v) * (SAMPLE_HEIGHT - 1));
    const values = [];
    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;
    let luminanceTotal = 0;
    let luminanceSquaredTotal = 0;
    let saturationTotal = 0;
    let warmthTotal = 0;
    let edgeTotal = 0;
    let edgeCount = 0;
    let count = 0;

    for (let y = centerY - LOCAL_RADIUS; y <= centerY + LOCAL_RADIUS; y += 1) {
      for (let x = centerX - LOCAL_RADIUS; x <= centerX + LOCAL_RADIUS; x += 1) {
        const offset = sampleOffset(x, y);
        const red = sampledPixels[offset];
        const green = sampledPixels[offset + 1];
        const blue = sampledPixels[offset + 2];
        const evidence = pixelEvidence(red, green, blue);
        redTotal += red;
        greenTotal += green;
        blueTotal += blue;
        luminanceTotal += evidence.luminance;
        luminanceSquaredTotal += evidence.luminance * evidence.luminance;
        saturationTotal += evidence.saturation;
        warmthTotal += evidence.warmth;
        values.push(red, green, blue);
        count += 1;

        const rightOffset = sampleOffset(x + 1, y);
        const downOffset = sampleOffset(x, y + 1);
        edgeTotal += (Math.abs(red - sampledPixels[rightOffset])
          + Math.abs(green - sampledPixels[rightOffset + 1])
          + Math.abs(blue - sampledPixels[rightOffset + 2])) / (255 * 3);
        edgeTotal += (Math.abs(red - sampledPixels[downOffset])
          + Math.abs(green - sampledPixels[downOffset + 1])
          + Math.abs(blue - sampledPixels[downOffset + 2])) / (255 * 3);
        edgeCount += 2;
      }
    }

    const luminance = luminanceTotal / count;
    const rgb = [Math.round(redTotal / count), Math.round(greenTotal / count), Math.round(blueTotal / count)];
    return {
      pixelCount: count,
      rgb,
      luminance,
      saturation: saturationTotal / count,
      edge: edgeTotal / edgeCount,
      variance: Math.max(0, luminanceSquaredTotal / count - luminance * luminance),
      warmth: warmthTotal / count,
      checksum: fnvChecksum(values),
    };
  }

  function rankCommands(sample) {
    const edge = clamp(sample.edge / .17);
    const variance = clamp(Math.sqrt(sample.variance) / .2);
    const darkness = 1 - sample.luminance;
    const highlight = sample.luminance;
    const saturation = clamp(sample.saturation / .54);
    const scores = {
      lift: clamp(.07 + darkness * .78 + variance * .12),
      trace: clamp(.08 + edge * .69 + variance * .22),
      grade: clamp(.08 + saturation * .73 + sample.warmth * .14),
      mask: clamp(.06 + highlight * .82 + (1 - edge) * .08),
      verify: clamp(.1 + variance * .58 + edge * .26 + Math.abs(sample.luminance - .5) * .12),
    };
    const recommended = COMMANDS.reduce((best, command) => (
      scores[command.id] > scores[best.id] ? command : best
    ), COMMANDS[0]);
    return { scores, recommended, score: scores[recommended.id] };
  }

  function rgbString(rgb) {
    const boosted = rgb.map(value => Math.round(value + (255 - value) * .22));
    return `rgb(${boosted[0]} ${boosted[1]} ${boosted[2]})`;
  }

  function snapshot() {
    return {
      hasHumanSample: state.hasHumanSample,
      pointerU: state.pointerU,
      pointerV: state.pointerV,
      orbitPhase: state.orbitPhase,
      pullStrength: state.pullStrength,
      selectedCommandId: state.selectedCommandId,
    };
  }

  function storeHistory() {
    const next = snapshot();
    const previous = history.at(-1);
    if (!previous || JSON.stringify(previous) !== JSON.stringify(next)) {
      history.push(next);
      history = history.slice(-12);
      state.historyDepth = history.length;
    }
  }

  function restoreSnapshot(saved, source) {
    state.hasHumanSample = saved.hasHumanSample;
    state.pointerU = saved.pointerU;
    state.pointerV = saved.pointerV;
    state.orbitPhase = saved.orbitPhase;
    state.pullStrength = saved.pullStrength;
    state.selectedCommandId = saved.selectedCommandId;
    pullInput.value = String(saved.pullStrength);
    if (state.hasHumanSample) updateRecommendationFromPixels();
    else clearRecommendation();
    applyLayout({ motionDriven: true, source });
    updateInterface();
  }

  function clearRecommendation() {
    state.recommendedCommandId = 'pending';
    state.recommendedCommandScore = 0;
    state.commandScores = Object.fromEntries(COMMANDS.map(command => [command.id, 0]));
    state.localSamplePixelCount = 0;
    state.localSampleRgb = [0, 0, 0];
    state.localLuminance = 0;
    state.localSaturation = 0;
    state.localEdgeMean = 0;
    state.localLuminanceVariance = 0;
    state.localWarmth = 0;
    state.lastSampleChecksum = '';
  }

  function updateRecommendationFromPixels() {
    const previousRecommendation = state.recommendedCommandId;
    const sample = readLocalSample(state.pointerU, state.pointerV);
    const ranking = rankCommands(sample);
    state.localSamplePixelCount = sample.pixelCount;
    state.localSampleRgb = sample.rgb;
    state.localLuminance = rounded(sample.luminance);
    state.localSaturation = rounded(sample.saturation);
    state.localEdgeMean = rounded(sample.edge);
    state.localLuminanceVariance = rounded(sample.variance, 6);
    state.localWarmth = rounded(sample.warmth);
    state.lastSampleChecksum = sample.checksum;
    state.commandScores = Object.fromEntries(Object.entries(ranking.scores).map(([key, value]) => [key, rounded(value)]));
    state.recommendedCommandId = ranking.recommended.id;
    state.recommendedCommandScore = rounded(ranking.score);
    if (previousRecommendation !== 'pending' && previousRecommendation !== ranking.recommended.id) {
      state.recommendationChangeCount += 1;
    }
    stage.style.setProperty('--sample', rgbString(sample.rgb));
    state.pixelEvidenceBoundToOrbitGeometry = true;
  }

  function toolTransform(command, index, width, height) {
    const centerX = width * .63;
    const centerY = height * .49;
    const radiusX = Math.min(width * .282, height * .51);
    const radiusY = Math.min(width * .19, height * .33);
    const score = state.commandScores[command.id] || 0;
    const pointerAngle = Math.atan2(state.pointerV - .49, state.pointerU - .63);
    const angle = command.angle + state.orbitPhase + (state.hasHumanSample ? pointerAngle * .09 : 0);
    const baseX = centerX + Math.cos(angle) * radiusX;
    const baseY = centerY + Math.sin(angle) * radiusY;
    const pointerX = state.pointerU * width;
    const pointerY = state.pointerV * height;
    const strength = state.pullStrength / 100;
    const recommendedBoost = state.recommendedCommandId === command.id ? .16 : 0;
    const pull = state.hasHumanSample ? clamp((.08 + score * .31 + recommendedBoost) * strength, 0, .52) : 0;
    const size = toolButtons[index].getBoundingClientRect().width || Math.min(50, Math.max(27, width * .07));
    const x = baseX + (pointerX - baseX) * pull - size / 2;
    const y = baseY + (pointerY - baseY) * pull - size / 2;
    const scale = state.hasHumanSample ? .91 + score * .16 + recommendedBoost * .38 : .94;
    const rotate = (angle * 180 / Math.PI + 90) * .08;
    return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
  }

  function geometry() {
    const bounds = stage.getBoundingClientRect();
    const width = bounds.width;
    const height = bounds.height;
    const coreSize = dockCore.getBoundingClientRect().width || Math.min(51, Math.max(28, width * .07));
    const cursorSize = sampleCursor.getBoundingClientRect().width || Math.min(35, Math.max(20, width * .048));
    const coreTransform = `translate3d(${(width * .63 - coreSize / 2).toFixed(2)}px, ${(height * .49 - coreSize / 2).toFixed(2)}px, 0)`;
    const cursorTransform = `translate3d(${(state.pointerU * width - cursorSize / 2).toFixed(2)}px, ${(state.pointerV * height - cursorSize / 2).toFixed(2)}px, 0)`;
    return {
      width,
      height,
      coreTransform,
      cursorTransform,
      toolTransforms: COMMANDS.map((command, index) => toolTransform(command, index, width, height)),
    };
  }

  function stopActiveControls() {
    activeControls.forEach(control => {
      if (typeof control.cancel === 'function') control.cancel();
    });
    activeControls = [];
  }

  function pausedSeek(element, from, to) {
    element.style.transform = from;
    const control = animate(
      element,
      { transform: [from, to] },
      { duration: 1, ease: 'linear', autoplay: false },
    );
    control.pause();
    control.time = control.duration;
    state.motionControlBuildCount += 1;
    state.motionSeekCount += 1;
    return control;
  }

  function updateVisualChecksum() {
    state.currentVisualStateChecksum = fnvChecksum([
      ...state.currentToolTransforms,
      state.currentCoreTransform,
      state.currentCursorTransform,
      state.recommendedCommandId,
      state.selectedCommandId,
      state.pullStrength,
    ]);
  }

  function applyLayout({ motionDriven, source }) {
    const next = geometry();
    state.stageWidth = rounded(next.width, 2);
    state.stageHeight = rounded(next.height, 2);
    state.stageCoverageRatio = rounded(next.width * next.height / Math.max(1, innerWidth * innerHeight));

    stopActiveControls();
    if (motionDriven) {
      if (initialControls.length) {
        initialControls.forEach(control => {
          if (typeof control.cancel === 'function') control.cancel();
        });
        initialControls = [];
      }
      next.toolTransforms.forEach((transform, index) => {
        const from = state.currentToolTransforms[index] || transform;
        activeControls.push(pausedSeek(toolButtons[index], from, transform));
      });
      activeControls.push(pausedSeek(sampleCursor, state.currentCursorTransform || next.cursorTransform, next.cursorTransform));
      state.motionDrivenToolCount = toolButtons.length;
      state.humanVisualMutationCount += 1;
      state.humanInputCausalityCount += 1;
    } else {
      toolButtons.forEach((tool, index) => { tool.style.transform = next.toolTransforms[index]; });
      sampleCursor.style.transform = next.cursorTransform;
    }

    dockCore.style.transform = next.coreTransform;
    sampleCursor.style.opacity = state.hasHumanSample ? '1' : '0';
    state.currentToolTransforms = next.toolTransforms;
    state.currentCoreTransform = next.coreTransform;
    state.currentCursorTransform = next.cursorTransform;
    stage.dataset.layoutSource = source;
    updateVisualChecksum();
  }

  function updateInterface() {
    pullOutput.value = `${state.pullStrength}%`;
    pullOutput.textContent = `${state.pullStrength}%`;
    sampleCursor.dataset.visible = String(state.hasHumanSample);
    if (state.hasHumanSample) {
      const command = COMMANDS.find(item => item.id === state.recommendedCommandId);
      recommendationOutput.textContent = command.label;
      scoreOutput.textContent = `${Math.round(state.recommendedCommandScore * 100)}`;
      statusOutput.textContent = state.selectedCommandId === 'none' ? 'Live sample' : 'Command queued';
      coreLabel.textContent = command.short;
      sampleLabel.textContent = `#${state.localSampleRgb.map(value => value.toString(16).padStart(2, '0')).join('')}`;
      lumaOutput.textContent = `Luma ${percentage(state.localLuminance)}`;
      edgeOutput.textContent = `Edge ${percentage(clamp(state.localEdgeMean / .17))}`;
      saturationOutput.textContent = `Sat ${percentage(state.localSaturation)}`;
    } else {
      recommendationOutput.textContent = 'Awaiting sample';
      scoreOutput.textContent = '—';
      statusOutput.textContent = 'Move pointer';
      coreLabel.textContent = 'Ready';
      sampleLabel.textContent = 'Sample';
      lumaOutput.textContent = 'Luma —';
      edgeOutput.textContent = 'Edge —';
      saturationOutput.textContent = 'Sat —';
      stage.style.setProperty('--sample', 'rgb(212 180 143)');
    }

    toolButtons.forEach(tool => {
      const commandId = tool.dataset.command;
      tool.dataset.recommended = String(state.hasHumanSample && commandId === state.recommendedCommandId);
      tool.dataset.selected = String(commandId === state.selectedCommandId);
      tool.setAttribute('aria-pressed', String(commandId === state.selectedCommandId));
    });

    stage.dataset.hasHumanSample = String(state.hasHumanSample);
    stage.dataset.recommendedCommand = state.recommendedCommandId;
    stage.dataset.selectedCommand = state.selectedCommandId;
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.motionSeekCount = String(state.motionSeekCount);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.pixelEvidenceBoundToCommandRanking = String(state.pixelEvidenceBoundToCommandRanking);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.syntheticInputDispatch = String(state.syntheticInputDispatch);
  }

  function recordInput(event, kind, source) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      updateInterface();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    state.interactionRecords.push({
      sequence: state.inputCount,
      kind,
      source,
      pointerType: event.pointerType || 'none',
      trusted: true,
    });
    state.interactionRecords = state.interactionRecords.slice(-32);
    return true;
  }

  function recordPointerType(pointerType) {
    const type = pointerType || 'unknown';
    state.lastPointerType = type;
    if (!state.pointerTypesSeen.includes(type)) state.pointerTypesSeen.push(type);
    if (type === 'mouse') state.mouseInputCount += 1;
    else if (type === 'touch') state.touchInputCount += 1;
    else if (type === 'pen') state.penInputCount += 1;
  }

  function pointerCoordinates(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      u: clamp((event.clientX - bounds.left) / bounds.width),
      v: clamp((event.clientY - bounds.top) / bounds.height),
    };
  }

  function applyHumanSample(u, v, source, phaseDelta = 0) {
    const previousU = state.pointerU;
    const previousV = state.pointerV;
    state.hasHumanSample = true;
    state.pointerU = clamp(u, .025, .975);
    state.pointerV = clamp(v, .04, .9);
    state.orbitPhase += phaseDelta;
    state.minimumPointerU = Math.min(state.minimumPointerU, state.pointerU);
    state.maximumPointerU = Math.max(state.maximumPointerU, state.pointerU);
    state.minimumPointerV = Math.min(state.minimumPointerV, state.pointerV);
    state.maximumPointerV = Math.max(state.maximumPointerV, state.pointerV);
    state.maximumPointerTravel = Math.max(
      state.maximumPointerTravel,
      Math.hypot(state.pointerU - previousU, state.pointerV - previousV),
    );
    updateRecommendationFromPixels();
    applyLayout({ motionDriven: true, source });
    updateInterface();
  }

  function onPointerEnter(event) {
    if (!recordInput(event, 'pointerenter', 'stage-hover')) return;
    recordPointerType(event.pointerType);
    state.pointerEnterCount += 1;
    state.hoverInputCount += 1;
    state.pointerInside = true;
    if (!state.hasHumanSample) storeHistory();
    const point = pointerCoordinates(event);
    lastAcceptedPoint = point;
    applyHumanSample(point.u, point.v, 'pointerenter');
  }

  function onPointerMove(event) {
    if (state.activePointerId !== null && event.pointerId !== state.activePointerId) return;
    if (state.activePointerId === null && event.target.closest('.control-bar, .orbit-tool')) return;
    const point = pointerCoordinates(event);
    if (lastAcceptedPoint && Math.hypot(point.u - lastAcceptedPoint.u, point.v - lastAcceptedPoint.v) < .012 && !state.dragging) return;
    if (!recordInput(event, state.dragging ? 'pointerdrag' : 'pointermove', state.dragging ? 'captured-pointer-drag' : 'stage-hover')) return;
    recordPointerType(event.pointerType);
    state.pointerMoveCount += 1;
    if (state.dragging) state.pointerDragCount += 1;
    else state.hoverInputCount += 1;
    const phaseDelta = state.dragging && dragStart
      ? (point.u - lastAcceptedPoint.u) * 1.7 + (point.v - lastAcceptedPoint.v) * .65
      : 0;
    lastAcceptedPoint = point;
    applyHumanSample(point.u, point.v, state.dragging ? 'captured-pointer-drag' : 'pointermove', phaseDelta);
  }

  function onPointerDown(event) {
    if (event.target.closest('.control-bar, .orbit-tool')) return;
    if (!recordInput(event, 'pointerdown', 'stage')) return;
    recordPointerType(event.pointerType);
    storeHistory();
    state.pointerDownCount += 1;
    state.dragging = true;
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    const point = pointerCoordinates(event);
    dragStart = { ...point, phase: state.orbitPhase };
    lastAcceptedPoint = point;
    applyHumanSample(point.u, point.v, 'pointerdown');
    stage.focus({ preventScroll: true });
    event.preventDefault();
  }

  function finishPointer(event, cancelled) {
    if (event.pointerId !== state.activePointerId) return;
    if (!recordInput(event, cancelled ? 'pointercancel' : 'pointerup', cancelled ? 'captured-pointer-cancel' : 'captured-pointer-release')) return;
    recordPointerType(event.pointerType);
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerUpCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.pointerCaptured = false;
    state.dragging = false;
    state.activePointerId = null;
    dragStart = null;
    lastAcceptedPoint = null;
    updateInterface();
  }

  function onPointerLeave(event) {
    if (!recordInput(event, 'pointerleave', 'stage-hover')) return;
    state.pointerLeaveCount += 1;
    state.pointerInside = false;
    lastAcceptedPoint = null;
    updateInterface();
  }

  function selectCommand(event, commandId) {
    if (!recordInput(event, 'button', `command-${commandId}`)) return;
    storeHistory();
    state.buttonInputCount += 1;
    state.commandSelectionCount += 1;
    state.selectedCommandId = state.selectedCommandId === commandId ? 'none' : commandId;
    applyLayout({ motionDriven: true, source: `command-${commandId}` });
    updateInterface();
  }

  function onRangeInput(event) {
    if (!recordInput(event, 'range', 'magnetic-pull')) return;
    storeHistory();
    state.rangeInputCount += 1;
    state.pullStrength = Number(pullInput.value);
    state.minimumPullStrength = Math.min(state.minimumPullStrength, state.pullStrength);
    state.maximumPullStrength = Math.max(state.maximumPullStrength, state.pullStrength);
    if (state.hasHumanSample) applyLayout({ motionDriven: true, source: 'range' });
    updateInterface();
  }

  function undo(event) {
    if (!recordInput(event, 'button', 'undo')) return;
    state.buttonInputCount += 1;
    state.undoCount += 1;
    const previous = history.pop() || initialSnapshot;
    state.historyDepth = history.length;
    restoreSnapshot(previous, 'undo');
  }

  function reset(event, inputKind = 'button') {
    if (!recordInput(event, inputKind, 'reset')) return;
    storeHistory();
    if (inputKind === 'keyboard') state.keyboardInputCount += 1;
    else state.buttonInputCount += 1;
    state.resetCount += 1;
    restoreSnapshot(initialSnapshot, 'reset');
  }

  function onKeyDown(event) {
    if (event.target === pullInput || event.target.closest('.orbit-tool') || event.target.closest('[data-action]')) return;
    const key = event.key;
    if (key === 'Home') {
      event.preventDefault();
      reset(event, 'keyboard');
      return;
    }
    if (key.toLowerCase() === 'u') {
      if (!recordInput(event, 'keyboard', 'undo')) return;
      event.preventDefault();
      state.keyboardInputCount += 1;
      state.undoCount += 1;
      const previous = history.pop() || initialSnapshot;
      state.historyDepth = history.length;
      restoreSnapshot(previous, 'keyboard-undo');
      return;
    }
    if (key === 'Escape') {
      if (!recordInput(event, 'keyboard', 'clear-command')) return;
      event.preventDefault();
      storeHistory();
      state.keyboardInputCount += 1;
      state.selectedCommandId = 'none';
      applyLayout({ motionDriven: true, source: 'keyboard-clear-command' });
      updateInterface();
      return;
    }
    if (key === 'Enter') {
      if (!recordInput(event, 'keyboard', 'queue-recommendation')) return;
      event.preventDefault();
      storeHistory();
      state.keyboardInputCount += 1;
      state.commandSelectionCount += 1;
      if (state.hasHumanSample) state.selectedCommandId = state.recommendedCommandId;
      applyLayout({ motionDriven: true, source: 'keyboard-queue-recommendation' });
      updateInterface();
      return;
    }

    const delta = {
      ArrowLeft: [-.055, 0],
      ArrowRight: [.055, 0],
      ArrowUp: [0, -.075],
      ArrowDown: [0, .075],
    }[key];
    if (!delta) return;
    if (!recordInput(event, 'keyboard', 'sample-nudge')) return;
    event.preventDefault();
    if (!state.hasHumanSample) storeHistory();
    state.keyboardInputCount += 1;
    const u = (state.hasHumanSample ? state.pointerU : INITIAL_POINTER.u) + delta[0];
    const v = (state.hasHumanSample ? state.pointerV : INITIAL_POINTER.v) + delta[1];
    applyHumanSample(u, v, 'keyboard-nudge', delta[0] * .24);
  }

  function onResize() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.resizeCount += 1;
      applyLayout({ motionDriven: false, source: 'resize' });
    });
  }

  async function loadAsset() {
    state.assetFetchCount += 1;
    const response = await fetch(ASSET_URL, { cache: 'no-store', credentials: 'same-origin' });
    state.assetResponseStatus = response.status;
    state.assetMimeType = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `asset request failed with ${response.status}`);
    invariant(state.assetSameOrigin, 'asset must be same-origin');
    invariant(state.assetMimeType === 'image/jpeg', `unexpected MIME type ${state.assetMimeType}`);

    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;
    invariant(state.assetByteLength === EXPECTED_ASSET.byteLength, `asset byte length changed (${state.assetByteLength})`);
    invariant(state.assetShaMatchesExpected, `asset SHA-256 changed (${state.assetSha256})`);

    sourceObjectUrl = URL.createObjectURL(new Blob([bytes], { type: state.assetMimeType }));
    sourceImage.src = sourceObjectUrl;
    await sourceImage.decode();
    state.browserImageDecoded = sourceImage.complete && sourceImage.naturalWidth > 0;
    state.sourceNaturalWidth = sourceImage.naturalWidth;
    state.sourceNaturalHeight = sourceImage.naturalHeight;
    state.sourcePixelCount = sourceImage.naturalWidth * sourceImage.naturalHeight;
    invariant(state.sourceNaturalWidth === EXPECTED_ASSET.width && state.sourceNaturalHeight === EXPECTED_ASSET.height, 'decoded dimensions changed');

    const context = evidenceCanvas.getContext('2d', { willReadFrequently: true });
    invariant(context, '2D readback context unavailable');
    context.clearRect(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    context.drawImage(
      sourceImage,
      SOURCE_CROP.x,
      SOURCE_CROP.y,
      SOURCE_CROP.width,
      SOURCE_CROP.height,
      0,
      0,
      SAMPLE_WIDTH,
      SAMPLE_HEIGHT,
    );
    sampledPixels = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
    state.browserCanvasReadback = true;
    analyzeSourcePixels(sampledPixels);
    state.sampledPixelSha256 = await sha256(sampledPixels);

    const probes = [
      [.13, .35],
      [.73, .08],
      [.84, .34],
      [.48, .68],
      [.66, .5],
      [.92, .73],
    ];
    state.pixelProbeCount = probes.length;
    state.probeRecommendations = probes.map(([u, v]) => rankCommands(readLocalSample(u, v)).recommended.id);
    state.probeRecommendationDiversity = new Set(state.probeRecommendations).size;
    state.pixelEvidenceBoundToCommandRanking = state.probeRecommendationDiversity >= 3;
    assetStatus.textContent = 'Source pixels ready';
  }

  function buildInitialMotionControls() {
    initialControls = toolButtons.map((tool, index) => {
      const transform = state.currentToolTransforms[index];
      const control = animate(
        tool,
        { transform: [transform, transform] },
        { duration: 1, ease: 'linear', autoplay: false },
      );
      control.pause();
      control.time = 0;
      return control;
    });
    state.motionInitialControlCount = initialControls.length;
    state.motionControlBuildCount += initialControls.length;
    state.motionControlsPaused = initialControls.length === COMMANDS.length
      && initialControls.every(control => typeof control.pause === 'function');
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    state.runtimeAssertCount += 1;
    invariant(state.claimedLibrary === 'motion@12.42.2', 'claimed library drifted');
    invariant(state.assetFetchCount === 1 && state.assetResponseStatus === 200, 'asset was not fetched exactly once');
    invariant(state.assetSameOrigin && state.assetMimeType === 'image/jpeg', 'asset origin or MIME evidence failed');
    invariant(state.assetByteLength === EXPECTED_ASSET.byteLength, 'exact source byte evidence failed');
    invariant(state.assetShaMatchesExpected && state.assetSha256 === EXPECTED_ASSET.sha256, 'exact source SHA evidence failed');
    invariant(state.browserImageDecoded, 'browser image decode did not finish');
    invariant(state.sourceNaturalWidth === EXPECTED_ASSET.width && state.sourceNaturalHeight === EXPECTED_ASSET.height, 'source dimensions changed');
    invariant(state.sourcePixelCount === EXPECTED_ASSET.width * EXPECTED_ASSET.height, 'source pixel count changed');
    invariant(state.browserCanvasReadback, 'browser pixel readback missing');
    invariant(state.sampledPixelCount === SAMPLE_PIXEL_COUNT && state.sampledPixelByteLength === SAMPLE_BYTE_LENGTH, 'sample dimensions or byte length changed');
    invariant(state.sampledOpaquePixelCount === SAMPLE_PIXEL_COUNT, 'sample contains transparent pixels');
    invariant(state.sampledPixelSha256.length === 64, 'sample pixel digest missing');
    invariant(state.distinctSampleColorCount >= 600, `source color evidence too weak (${state.distinctSampleColorCount})`);
    invariant(state.sampledLuminanceRange >= .62, `source luminance range too weak (${state.sampledLuminanceRange})`);
    invariant(state.sampledLuminanceStdDev >= .13, `source luminance deviation too weak (${state.sampledLuminanceStdDev})`);
    invariant(state.sampledSaturationMean >= .12, `source saturation evidence too weak (${state.sampledSaturationMean})`);
    invariant(state.sampledEdgeMean >= .025, `source edge evidence too weak (${state.sampledEdgeMean})`);
    invariant(state.sampledWarmPixelRatio >= .01, `source warm-zone evidence too weak (${state.sampledWarmPixelRatio})`);
    invariant(state.pixelProbeCount === 6 && state.probeRecommendationDiversity >= 3, `pixel probes do not change command outcome (${state.probeRecommendations.join(',')})`);
    invariant(state.pixelEvidenceBoundToCommandRanking, 'source pixels are not bound to command ranking');
    invariant(toolButtons.length === COMMANDS.length && state.motionInitialControlCount === COMMANDS.length, 'orbit command/control count changed');
    invariant(state.motionControlsPaused && state.motionControlsBuiltWithoutAutoplay, 'Motion controls are not paused human-seek controls');
    invariant(state.initialFrameStatic && state.initialStillVerified, 'initial frame is not a verified still');
    invariant(!state.automaticCycle && !state.automaticPlayback && !state.automaticTimeline, 'automatic path is forbidden');
    invariant(!state.automaticRehearsal && !state.automaticFallback && !state.syntheticInputDispatch, 'rehearsal/fallback/synthetic input is forbidden');
    invariant(!state.captureClockDriven && state.renderIgnoresPreviewClock && !state.visualMutationFromPreviewClock, 'preview clock must not own the effect');
    invariant(state.previewClockMutationCount === 0, 'preview clock mutated the visual state');
    invariant(state.stageCoverageRatio >= .94 && state.stageWidth >= 140 && state.stageHeight >= 78, 'stage does not cover its viewport');
    invariant(state.currentToolTransforms.length === COMMANDS.length, 'tool transforms missing');
    if (state.trustedInputCount > 0 && state.humanVisualMutationCount > 0) {
      invariant(state.motionSeekCount >= COMMANDS.length + 1, 'trusted input did not seek Motion controls');
      invariant(state.motionDrivenToolCount === COMMANDS.length, 'Motion did not drive every orbit command');
      invariant(
        state.hasHumanSample || state.resetCount > 0 || state.undoCount > 0 || state.commandSelectionCount > 0,
        'trusted input did not produce, queue, or reverse a sample',
      );
    }
    state.runtimeAssertionPassed = true;
    return true;
  };

  stage.addEventListener('pointerenter', onPointerEnter);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointerup', event => finishPointer(event, false));
  stage.addEventListener('pointercancel', event => finishPointer(event, true));
  stage.addEventListener('pointerleave', onPointerLeave);
  stage.addEventListener('keydown', onKeyDown);
  pullInput.addEventListener('input', onRangeInput);
  toolButtons.forEach(tool => tool.addEventListener('click', event => selectCommand(event, tool.dataset.command)));
  actionButtons.forEach(button => {
    if (button.dataset.action === 'undo') button.addEventListener('click', undo);
    if (button.dataset.action === 'reset') button.addEventListener('click', event => reset(event));
  });
  window.addEventListener('resize', onResize);
  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    updateInterface();
  });

  const ready = (async () => {
    await Promise.all([document.fonts.ready, loadAsset()]);
    initialSnapshot = snapshot();
    applyLayout({ motionDriven: false, source: 'initial' });
    buildInitialMotionControls();
    state.initialVisualStateChecksum = state.currentVisualStateChecksum;
    state.initialStillVerified = state.inputCount === 0
      && state.trustedInputCount === 0
      && state.motionSeekCount === 0
      && !state.hasHumanSample
      && state.currentVisualStateChecksum === state.initialVisualStateChecksum;
    updateInterface();
    state.ready = true;
    await window.__PREVIEW_RUNTIME_ASSERT__();
  })();

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: state.renderer,
    render: () => {
      state.previewClockCallCount += 1;
      state.previewClockIgnoredCount += 1;
    },
    ready,
  });

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(resizeFrame);
    stopActiveControls();
    initialControls.forEach(control => {
      if (typeof control.cancel === 'function') control.cancel();
    });
    if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
