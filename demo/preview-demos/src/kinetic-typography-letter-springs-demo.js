import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-08/kinetic-typography-letter-springs/four-ink-tension-proof.jpg',
  import.meta.url
).href;
const EXPECTED_ASSET_SHA256 = '19742a0f7aa7a5a91f50c9ea04f285bc34017195cbdd157b9971e5ce05e73af1';
const EXPECTED_ASSET_BYTE_LENGTH = 316790;
const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_CROP = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 64;
const SAMPLE_PIXEL_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const SAMPLE_BYTE_LENGTH = SAMPLE_PIXEL_COUNT * 4;
const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 180;
const LETTERS = [...'PRESSURE'];
const INITIAL_PULL = 7;
const MAX_SEQUENCE_STEPS = 30;
const INK_ZONES = Object.freeze([
  { id: 'vermilion', x0: 4, x1: 36, y0: 3, y1: 25 },
  { id: 'cobalt', x0: 60, x1: 92, y0: 3, y1: 25 },
  { id: 'chartreuse', x0: 4, x1: 36, y0: 39, y1: 61 },
  { id: 'magenta', x0: 60, x1: 92, y0: 39, y1: 61 }
]);
const PAPER_ZONE = Object.freeze({ x0: 37, x1: 59, y0: 24, y1: 41 });
const HOMES = LETTERS.map((letter, index) => ({
  letter,
  x: 51 + index * 31.2,
  y: 101,
  angle: 0,
  scale: 1
}));

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 4) => Number(value.toFixed(digits));

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function fnvMix(checksum, value) {
  return Math.imul(checksum ^ (value >>> 0), 16777619) >>> 0;
}

function relativeLuminance([red, green, blue]) {
  const channels = [red, green, blue].map(value => {
    const normalized = value / 255;
    return normalized <= .03928 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
  });
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}

function contrastRatio(first, second) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

function rgbCss(rgb) {
  return `rgb(${rgb.join(' ')})`;
}

try {
  const stage = document.querySelector('#type-proof-stage');
  const canvasHost = document.querySelector('#type-canvas-host');
  const proofCard = document.querySelector('#proof-card');
  const decisionOutput = document.querySelector('#proof-decision');
  const scoreOutput = document.querySelector('#proof-score');
  const detailOutput = document.querySelector('#proof-detail');
  const pullRange = document.querySelector('#pull-range');
  const pullOutput = document.querySelector('#pull-output');
  const actionButtons = [...document.querySelectorAll('[data-action]')];
  const holdButton = document.querySelector('[data-action="hold"]');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'kinetic-typography-letter-springs',
    task: 'human-operated-four-ink-kinetic-title-tension-proofing',
    claimedLibrary: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'committed-proof-pixels-determine-ink-palette-spring-constants-outline-and-print-decision-while-trusted-input-drives-finite-letter-level-spring-sequences',
    assetMechanismRole: 'exact-proof-pixels-provide-four-letter-inks-paper-color-fibre-energy-contrast-safe-displacement-and-the-live-printability-conclusion',
    captureType: 'interactive',
    causality: 'trusted-human-input-starts-finite-spring-response',
    acceptedInputs: [
      'mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag',
      'keyboard', 'native-range', 'visible-buttons'
    ],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    initialStaticConfirmed: false,
    automaticCycle: false,
    automaticPlayback: false,
    automaticTimeline: false,
    automaticRehearsal: false,
    automaticFallback: false,
    automaticSequenceStartCount: 0,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockCallCount: 0,
    previewClockIgnoredCount: 0,
    previewClockMutationCount: 0,
    nonInputVisualMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    keyboardInputCount: 0,
    keyboardMutationCount: 0,
    rangeInputCount: 0,
    rangeMutationCount: 0,
    buttonActivationCount: 0,
    buttonMutationCount: 0,
    releaseCount: 0,
    holdToggleCount: 0,
    resetCount: 0,
    humanVisualMutationCount: 0,
    humanInputCausalityCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    dragging: false,
    focusActive: false,
    focusX: 160,
    focusY: 100,
    initialPull: INITIAL_PULL,
    pull: INITIAL_PULL,
    minimumHumanPull: INITIAL_PULL,
    maximumHumanPull: INITIAL_PULL,
    locked: false,
    finiteSequenceRunning: false,
    finiteSequenceStartCount: 0,
    finiteSequenceCompletionCount: 0,
    finiteSequenceCancellationCount: 0,
    finiteSequenceFrameCount: 0,
    maximumSequenceStepCount: 0,
    currentSequenceStep: 0,
    currentSequenceCause: 'none',
    currentSequenceCauseTrusted: false,
    sequenceRecords: [],
    transitionRecords: [],
    letterCount: LETTERS.length,
    currentAverageDisplacement: 0,
    currentMaximumDisplacement: 0,
    maximumHumanDisplacement: 0,
    currentSpringEnergy: 0,
    maximumHumanSpringEnergy: 0,
    currentVisualChecksum: 0,
    initialVisualChecksum: 0,
    firstHumanStateBefore: null,
    firstHumanStateAfter: null,
    proofDecision: 'READY',
    proofScore: 0,
    proofDecisionMutationCount: 0,
    assetUrl: ASSET_URL,
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    expectedAssetByteLength: EXPECTED_ASSET_BYTE_LENGTH,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetMimeType: '',
    assetSameOrigin: false,
    assetByteLength: 0,
    assetSha256: '',
    assetShaMatchesExpected: false,
    assetByteLengthMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    sourcePixelCount: 0,
    browserCanvasReadback: false,
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sampledPixelSha256: '',
    nonzeroSampleByteCount: 0,
    opaqueSamplePixelCount: 0,
    distinctQuantizedColorCount: 0,
    minimumSampleLuma: 255,
    maximumSampleLuma: 0,
    sampleLumaMean: 0,
    sampleLumaStdDev: 0,
    horizontalEdgeMean: 0,
    verticalEdgeMean: 0,
    edgeEnergyMean: 0,
    paperRgb: [0, 0, 0],
    paperLuma: 0,
    paperLumaStdDev: 0,
    paperEdgeEnergy: 0,
    inkProfiles: [],
    inkProfileCount: 0,
    inkEvidencePixelCount: 0,
    minimumInkEvidencePixelCount: 0,
    minimumInkColorDistance: 0,
    minimumInkContrast: 0,
    maximumInkContrast: 0,
    averageInkContrast: 0,
    outlineRequired: false,
    pixelDrivenSpringStiffness: 0,
    pixelDrivenDamping: 0,
    pixelDrivenSafeDisplacement: 0,
    pixelEvidenceReady: false,
    pixelEvidenceBoundToTypography: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5ImageDecoded: false,
    p5ImageClass: '',
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    resizeCount: 0,
    stageCoverageRatio: 0,
    canvasCoverageRatio: 0,
    reducedMotion: reducedMotionQuery.matches,
    ready: false,
    runtimeAssertionPassed: false,
    runtimeAssertCount: 0,
    renderCount: 0
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__KINETIC_TYPOGRAPHY_LETTER_SPRINGS_STATE__ = state;

  let sketch;
  let proofImage;
  let samplePixels = new Uint8ClampedArray(SAMPLE_BYTE_LENGTH);
  let animationFrame = 0;
  let resizeObserver;
  const letterStates = HOMES.map(home => ({
    ...home,
    vx: 0,
    vy: 0,
    angleVelocity: 0,
    scaleVelocity: 0
  }));

  function invariant(condition, message) {
    if (!condition) throw new Error(`kinetic-typography-letter-springs: ${message}`);
  }

  function updateDataset() {
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.humanVisualMutationCount = String(state.humanVisualMutationCount);
    stage.dataset.finiteSequenceStartCount = String(state.finiteSequenceStartCount);
    stage.dataset.finiteSequenceCompletionCount = String(state.finiteSequenceCompletionCount);
    stage.dataset.finiteSequenceFrameCount = String(state.finiteSequenceFrameCount);
    stage.dataset.automaticSequenceStartCount = String(state.automaticSequenceStartCount);
    stage.dataset.currentMaximumDisplacement = String(state.currentMaximumDisplacement);
    stage.dataset.maximumHumanDisplacement = String(state.maximumHumanDisplacement);
    stage.dataset.proofDecision = state.proofDecision;
    stage.dataset.proofScore = String(state.proofScore);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.sampledPixelSha256 = state.sampledPixelSha256;
    stage.dataset.distinctQuantizedColorCount = String(state.distinctQuantizedColorCount);
    stage.dataset.minimumSampleLuma = String(state.minimumSampleLuma);
    stage.dataset.maximumSampleLuma = String(state.maximumSampleLuma);
    stage.dataset.sampleLumaMean = String(state.sampleLumaMean);
    stage.dataset.sampleLumaStdDev = String(state.sampleLumaStdDev);
    stage.dataset.edgeEnergyMean = String(state.edgeEnergyMean);
    stage.dataset.paperLuma = String(state.paperLuma);
    stage.dataset.paperLumaStdDev = String(state.paperLumaStdDev);
    stage.dataset.paperEdgeEnergy = String(state.paperEdgeEnergy);
    stage.dataset.inkProfileCount = String(state.inkProfileCount);
    stage.dataset.inkEvidencePixelCount = String(state.inkEvidencePixelCount);
    stage.dataset.minimumInkEvidencePixelCount = String(state.minimumInkEvidencePixelCount);
    stage.dataset.minimumInkColorDistance = String(state.minimumInkColorDistance);
    stage.dataset.minimumInkContrast = String(state.minimumInkContrast);
    stage.dataset.maximumInkContrast = String(state.maximumInkContrast);
    stage.dataset.pixelDrivenSpringStiffness = String(state.pixelDrivenSpringStiffness);
    stage.dataset.pixelDrivenDamping = String(state.pixelDrivenDamping);
    stage.dataset.pixelDrivenSafeDisplacement = String(state.pixelDrivenSafeDisplacement);
    stage.dataset.pixelEvidenceBoundToTypography = String(state.pixelEvidenceBoundToTypography);
    stage.dataset.p5ImageClass = state.p5ImageClass;
    stage.dataset.initialStaticConfirmed = String(state.initialStaticConfirmed);
    stage.dataset.stageCoverageRatio = String(state.stageCoverageRatio);
    stage.dataset.canvasCoverageRatio = String(state.canvasCoverageRatio);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.syntheticInputDispatch = String(state.syntheticInputDispatch);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
  }

  function visualChecksum() {
    let checksum = 2166136261;
    letterStates.forEach(letter => {
      checksum = fnvMix(checksum, Math.round(letter.x * 100));
      checksum = fnvMix(checksum, Math.round(letter.y * 100));
      checksum = fnvMix(checksum, Math.round((letter.angle + 2) * 1000));
      checksum = fnvMix(checksum, Math.round(letter.scale * 1000));
    });
    checksum = fnvMix(checksum, state.focusActive ? 1 : 0);
    checksum = fnvMix(checksum, Math.round(state.focusX * 100));
    checksum = fnvMix(checksum, Math.round(state.focusY * 100));
    checksum = fnvMix(checksum, state.pull * 100);
    checksum = fnvMix(checksum, state.locked ? 1 : 0);
    checksum = fnvMix(checksum, Math.round(state.pixelDrivenSpringStiffness * 100000));
    return checksum >>> 0;
  }

  function saturation(red, green, blue) {
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    return maximum === 0 ? 0 : (maximum - minimum) / maximum;
  }

  function sampleProfile(zone) {
    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;
    let lumaTotal = 0;
    let saturationTotal = 0;
    let count = 0;
    for (let y = zone.y0; y < zone.y1; y += 1) {
      for (let x = zone.x0; x < zone.x1; x += 1) {
        const offset = (y * SAMPLE_WIDTH + x) * 4;
        const red = samplePixels[offset];
        const green = samplePixels[offset + 1];
        const blue = samplePixels[offset + 2];
        const pixelSaturation = saturation(red, green, blue);
        if (pixelSaturation <= .28) continue;
        const luma = .2126 * red + .7152 * green + .0722 * blue;
        redTotal += red;
        greenTotal += green;
        blueTotal += blue;
        lumaTotal += luma;
        saturationTotal += pixelSaturation;
        count += 1;
      }
    }
    invariant(count >= 320, `${zone.id} ink evidence is too sparse`);
    const rgb = [Math.round(redTotal / count), Math.round(greenTotal / count), Math.round(blueTotal / count)];
    return {
      id: zone.id,
      rgb,
      css: rgbCss(rgb),
      evidencePixelCount: count,
      meanLuma: rounded(lumaTotal / count, 3),
      meanSaturation: rounded(saturationTotal / count, 5)
    };
  }

  function analysePixels() {
    let lumaTotal = 0;
    let lumaSquared = 0;
    let nonzeroBytes = 0;
    let opaquePixels = 0;
    const quantizedColors = new Set();
    for (let index = 0; index < SAMPLE_PIXEL_COUNT; index += 1) {
      const offset = index * 4;
      const red = samplePixels[offset];
      const green = samplePixels[offset + 1];
      const blue = samplePixels[offset + 2];
      const alpha = samplePixels[offset + 3];
      const luma = .2126 * red + .7152 * green + .0722 * blue;
      lumaTotal += luma;
      lumaSquared += luma * luma;
      state.minimumSampleLuma = Math.min(state.minimumSampleLuma, luma);
      state.maximumSampleLuma = Math.max(state.maximumSampleLuma, luma);
      nonzeroBytes += Number(red > 0) + Number(green > 0) + Number(blue > 0) + Number(alpha > 0);
      opaquePixels += Number(alpha === 255);
      quantizedColors.add(`${red >> 3},${green >> 3},${blue >> 3}`);
    }
    state.sampleLumaMean = rounded(lumaTotal / SAMPLE_PIXEL_COUNT, 3);
    state.sampleLumaStdDev = rounded(Math.sqrt(Math.max(0, lumaSquared / SAMPLE_PIXEL_COUNT - (lumaTotal / SAMPLE_PIXEL_COUNT) ** 2)), 3);
    state.minimumSampleLuma = rounded(state.minimumSampleLuma, 3);
    state.maximumSampleLuma = rounded(state.maximumSampleLuma, 3);
    state.nonzeroSampleByteCount = nonzeroBytes;
    state.opaqueSamplePixelCount = opaquePixels;
    state.distinctQuantizedColorCount = quantizedColors.size;

    let horizontalEdgeTotal = 0;
    let horizontalEdgeCount = 0;
    let verticalEdgeTotal = 0;
    let verticalEdgeCount = 0;
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const offset = (y * SAMPLE_WIDTH + x) * 4;
        if (x < SAMPLE_WIDTH - 1) {
          const neighbour = offset + 4;
          horizontalEdgeTotal += (
            Math.abs(samplePixels[offset] - samplePixels[neighbour])
            + Math.abs(samplePixels[offset + 1] - samplePixels[neighbour + 1])
            + Math.abs(samplePixels[offset + 2] - samplePixels[neighbour + 2])
          ) / (255 * 3);
          horizontalEdgeCount += 1;
        }
        if (y < SAMPLE_HEIGHT - 1) {
          const neighbour = offset + SAMPLE_WIDTH * 4;
          verticalEdgeTotal += (
            Math.abs(samplePixels[offset] - samplePixels[neighbour])
            + Math.abs(samplePixels[offset + 1] - samplePixels[neighbour + 1])
            + Math.abs(samplePixels[offset + 2] - samplePixels[neighbour + 2])
          ) / (255 * 3);
          verticalEdgeCount += 1;
        }
      }
    }
    state.horizontalEdgeMean = rounded(horizontalEdgeTotal / horizontalEdgeCount, 6);
    state.verticalEdgeMean = rounded(verticalEdgeTotal / verticalEdgeCount, 6);
    state.edgeEnergyMean = rounded((state.horizontalEdgeMean + state.verticalEdgeMean) / 2, 6);

    let paperRed = 0;
    let paperGreen = 0;
    let paperBlue = 0;
    let paperLuma = 0;
    let paperLumaSquared = 0;
    let paperHorizontalEdge = 0;
    let paperVerticalEdge = 0;
    let paperHorizontalCount = 0;
    let paperVerticalCount = 0;
    let paperCount = 0;
    for (let y = PAPER_ZONE.y0; y < PAPER_ZONE.y1; y += 1) {
      for (let x = PAPER_ZONE.x0; x < PAPER_ZONE.x1; x += 1) {
        const offset = (y * SAMPLE_WIDTH + x) * 4;
        const red = samplePixels[offset];
        const green = samplePixels[offset + 1];
        const blue = samplePixels[offset + 2];
        const luma = .2126 * red + .7152 * green + .0722 * blue;
        paperRed += red;
        paperGreen += green;
        paperBlue += blue;
        paperLuma += luma;
        paperLumaSquared += luma * luma;
        paperCount += 1;
        if (x < PAPER_ZONE.x1 - 1) {
          const neighbour = offset + 4;
          paperHorizontalEdge += (
            Math.abs(red - samplePixels[neighbour])
            + Math.abs(green - samplePixels[neighbour + 1])
            + Math.abs(blue - samplePixels[neighbour + 2])
          ) / (255 * 3);
          paperHorizontalCount += 1;
        }
        if (y < PAPER_ZONE.y1 - 1) {
          const neighbour = offset + SAMPLE_WIDTH * 4;
          paperVerticalEdge += (
            Math.abs(red - samplePixels[neighbour])
            + Math.abs(green - samplePixels[neighbour + 1])
            + Math.abs(blue - samplePixels[neighbour + 2])
          ) / (255 * 3);
          paperVerticalCount += 1;
        }
      }
    }
    state.paperRgb = [Math.round(paperRed / paperCount), Math.round(paperGreen / paperCount), Math.round(paperBlue / paperCount)];
    state.paperLuma = rounded(paperLuma / paperCount, 3);
    state.paperLumaStdDev = rounded(Math.sqrt(Math.max(0, paperLumaSquared / paperCount - (paperLuma / paperCount) ** 2)), 4);
    state.paperEdgeEnergy = rounded(((paperHorizontalEdge / paperHorizontalCount) + (paperVerticalEdge / paperVerticalCount)) / 2, 6);

    state.inkProfiles = INK_ZONES.map(sampleProfile);
    state.inkProfileCount = state.inkProfiles.length;
    state.inkEvidencePixelCount = state.inkProfiles.reduce((total, profile) => total + profile.evidencePixelCount, 0);
    state.minimumInkEvidencePixelCount = Math.min(...state.inkProfiles.map(profile => profile.evidencePixelCount));
    const colorDistances = [];
    for (let first = 0; first < state.inkProfiles.length; first += 1) {
      for (let second = first + 1; second < state.inkProfiles.length; second += 1) {
        const a = state.inkProfiles[first].rgb;
        const b = state.inkProfiles[second].rgb;
        colorDistances.push(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
      }
    }
    state.minimumInkColorDistance = rounded(Math.min(...colorDistances), 3);
    const contrasts = state.inkProfiles.map(profile => contrastRatio(profile.rgb, state.paperRgb));
    state.minimumInkContrast = rounded(Math.min(...contrasts), 3);
    state.maximumInkContrast = rounded(Math.max(...contrasts), 3);
    state.averageInkContrast = rounded(contrasts.reduce((total, value) => total + value, 0) / contrasts.length, 3);
    state.outlineRequired = state.minimumInkContrast < 3;
    state.pixelDrivenSpringStiffness = rounded(clamp(.09 + state.edgeEnergyMean * 1.7, .1, .18), 5);
    state.pixelDrivenDamping = rounded(clamp(.72 + state.paperEdgeEnergy * 12, .72, .84), 5);
    state.pixelDrivenSafeDisplacement = rounded(clamp(13.5 + state.edgeEnergyMean * 130 + state.paperLumaStdDev * .12, 14, 21), 3);
    state.pixelEvidenceBoundToTypography = state.inkProfileCount === 4
      && state.minimumInkColorDistance > 60
      && state.pixelDrivenSpringStiffness > 0
      && state.pixelDrivenDamping > 0
      && state.pixelDrivenSafeDisplacement > 0;

    stage.style.setProperty('--paper', rgbCss(state.paperRgb));
    state.inkProfiles.forEach((profile, index) => stage.style.setProperty(`--ink-${String.fromCharCode(97 + index)}`, profile.css));
  }

  async function loadPixelEvidence() {
    state.assetFetchCount += 1;
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `asset fetch failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetByteLengthMatchesExpected = bytes.byteLength === EXPECTED_ASSET_BYTE_LENGTH;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    invariant(state.assetByteLengthMatchesExpected, 'committed asset byte length changed');
    invariant(state.assetShaMatchesExpected, 'committed asset SHA-256 changed');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: state.assetMimeType || 'image/jpeg' }));
    const image = new Image();
    image.src = objectUrl;
    try {
      await image.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = image.naturalWidth;
      state.sourceNaturalHeight = image.naturalHeight;
      state.sourcePixelCount = image.naturalWidth * image.naturalHeight;
      invariant(image.naturalWidth === SOURCE_WIDTH && image.naturalHeight === SOURCE_HEIGHT, 'source dimensions changed');
      const sampler = document.createElement('canvas');
      sampler.width = SAMPLE_WIDTH;
      sampler.height = SAMPLE_HEIGHT;
      const context = sampler.getContext('2d', { willReadFrequently: true });
      invariant(context, 'pixel sampling context is unavailable');
      context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      const imageData = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      samplePixels = new Uint8ClampedArray(imageData.data);
      state.browserCanvasReadback = true;
      state.sampledPixelCount = SAMPLE_PIXEL_COUNT;
      state.sampledPixelByteLength = samplePixels.byteLength;
      state.sampledPixelSha256 = await sha256(samplePixels.buffer.slice(0));
      analysePixels();
      state.pixelEvidenceReady = true;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    stage.style.setProperty('--proof-image', `url("${ASSET_URL}")`);
  }

  function targetFor(letter, index) {
    const home = HOMES[index];
    if (!state.focusActive) return { x: home.x, y: home.y, angle: 0, scale: 1 };
    const dx = home.x - state.focusX;
    const dy = home.y - state.focusY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const radius = 58 + state.pull * 5.2;
    const influence = clamp(1 - distance / radius, 0, 1);
    const displacement = influence * state.pull * 3.05;
    const directionX = dx / distance;
    const directionY = dy / distance;
    return {
      x: home.x + directionX * displacement,
      y: home.y + directionY * displacement * .85 - influence * 1.8,
      angle: directionX * influence * .34,
      scale: 1 + influence * .25
    };
  }

  function updateLetterMetrics() {
    const displacements = letterStates.map((letter, index) => Math.hypot(letter.x - HOMES[index].x, letter.y - HOMES[index].y));
    state.currentAverageDisplacement = rounded(displacements.reduce((total, value) => total + value, 0) / displacements.length, 3);
    state.currentMaximumDisplacement = rounded(Math.max(...displacements), 3);
    state.maximumHumanDisplacement = Math.max(state.maximumHumanDisplacement, state.currentMaximumDisplacement);
    state.currentSpringEnergy = rounded(letterStates.reduce((total, letter) => (
      total + Math.hypot(letter.vx, letter.vy) + Math.abs(letter.angleVelocity) * 12 + Math.abs(letter.scaleVelocity) * 20
    ), 0), 4);
    state.maximumHumanSpringEnergy = Math.max(state.maximumHumanSpringEnergy, state.currentSpringEnergy);
  }

  function calculateProofDecision() {
    const previous = state.proofDecision;
    const safe = state.pixelDrivenSafeDisplacement;
    if (!state.focusActive && state.currentMaximumDisplacement < .8) state.proofDecision = 'READY';
    else if (state.currentMaximumDisplacement > safe * 1.28) state.proofDecision = 'OVERSET';
    else if (state.currentMaximumDisplacement > safe * .7) state.proofDecision = 'TIGHT';
    else state.proofDecision = 'PRINTABLE';
    const contrastContribution = clamp(state.averageInkContrast * 4.2, 10, 26);
    const displacementPenalty = state.currentAverageDisplacement * 2.1 + Math.max(0, state.currentMaximumDisplacement - safe) * 3.4;
    state.proofScore = Math.round(clamp(70 + contrastContribution - displacementPenalty, 18, 98));
    if (state.ready && previous !== state.proofDecision) state.proofDecisionMutationCount += 1;
  }

  function syncInterface() {
    updateLetterMetrics();
    calculateProofDecision();
    state.currentVisualChecksum = visualChecksum();
    const statusColor = state.proofDecision === 'OVERSET'
      ? state.inkProfiles[3]?.css
      : state.proofDecision === 'TIGHT'
        ? state.inkProfiles[0]?.css
        : state.inkProfiles[1]?.css;
    proofCard.style.setProperty('--status', statusColor || '#182f7c');
    decisionOutput.textContent = state.proofDecision;
    scoreOutput.textContent = `${state.proofScore} / 100`;
    detailOutput.textContent = state.proofDecision === 'OVERSET'
      ? `${state.currentMaximumDisplacement.toFixed(1)} units exceed the pixel-derived safe range.`
      : state.proofDecision === 'TIGHT'
        ? 'Readable, but the current letter spacing is under stress.'
        : state.proofDecision === 'PRINTABLE'
          ? 'The four sampled inks remain inside the recoverable title range.'
          : 'Move through the title to test its recoverable range.';
    pullRange.value = String(state.pull);
    pullOutput.textContent = `${state.pull}×`;
    holdButton.setAttribute('aria-pressed', String(state.locked));
    holdButton.textContent = state.locked ? 'Held' : 'Hold';
    updateDataset();
  }

  function redraw() {
    syncInterface();
    if (sketch && state.p5ImageDecoded) sketch.redraw();
  }

  function integrateSpringStep() {
    let movement = 0;
    letterStates.forEach((letter, index) => {
      const target = targetFor(letter, index);
      const stiffness = state.pixelDrivenSpringStiffness;
      const damping = state.pixelDrivenDamping;
      letter.vx = (letter.vx + (target.x - letter.x) * stiffness) * damping;
      letter.vy = (letter.vy + (target.y - letter.y) * stiffness) * damping;
      letter.angleVelocity = (letter.angleVelocity + (target.angle - letter.angle) * stiffness * .82) * damping;
      letter.scaleVelocity = (letter.scaleVelocity + (target.scale - letter.scale) * stiffness * .75) * damping;
      letter.x += letter.vx;
      letter.y += letter.vy;
      letter.angle += letter.angleVelocity;
      letter.scale += letter.scaleVelocity;
      movement += Math.abs(letter.vx) + Math.abs(letter.vy) + Math.abs(letter.angleVelocity) * 8 + Math.abs(letter.scaleVelocity) * 10;
    });
    return movement;
  }

  function cancelFiniteSequence() {
    if (!state.finiteSequenceRunning) return;
    cancelAnimationFrame(animationFrame);
    state.finiteSequenceRunning = false;
    state.finiteSequenceCancellationCount += 1;
  }

  function startFiniteSequence(cause) {
    cancelFiniteSequence();
    invariant(state.lastInputTrusted === true, 'finite spring sequence requires trusted human input');
    state.finiteSequenceRunning = true;
    state.finiteSequenceStartCount += 1;
    state.currentSequenceStep = 0;
    state.currentSequenceCause = cause;
    state.currentSequenceCauseTrusted = true;
    state.sequenceRecords.push({ cause, trusted: true, maximumSteps: MAX_SEQUENCE_STEPS });
    if (state.sequenceRecords.length > 36) state.sequenceRecords.shift();

    if (state.reducedMotion) {
      for (let step = 0; step < MAX_SEQUENCE_STEPS; step += 1) integrateSpringStep();
      state.currentSequenceStep = MAX_SEQUENCE_STEPS;
      state.maximumSequenceStepCount = Math.max(state.maximumSequenceStepCount, MAX_SEQUENCE_STEPS);
      state.finiteSequenceFrameCount += MAX_SEQUENCE_STEPS;
      state.finiteSequenceRunning = false;
      state.finiteSequenceCompletionCount += 1;
      redraw();
      return;
    }

    const advance = () => {
      if (!state.finiteSequenceRunning || state.locked) return;
      state.currentSequenceStep += 1;
      state.finiteSequenceFrameCount += 1;
      const movement = integrateSpringStep();
      state.maximumSequenceStepCount = Math.max(state.maximumSequenceStepCount, state.currentSequenceStep);
      redraw();
      if (state.currentSequenceStep >= MAX_SEQUENCE_STEPS || (state.currentSequenceStep >= 10 && movement < .018)) {
        state.finiteSequenceRunning = false;
        state.finiteSequenceCompletionCount += 1;
        updateDataset();
        return;
      }
      animationFrame = requestAnimationFrame(advance);
    };
    animationFrame = requestAnimationFrame(advance);
  }

  function resetLetterStates() {
    letterStates.forEach((letter, index) => {
      const home = HOMES[index];
      letter.x = home.x;
      letter.y = home.y;
      letter.angle = 0;
      letter.scale = 1;
      letter.vx = 0;
      letter.vy = 0;
      letter.angleVelocity = 0;
      letter.scaleVelocity = 0;
    });
  }

  function applyPointerImpulse(strength = 1) {
    letterStates.forEach((letter, index) => {
      const home = HOMES[index];
      const dx = home.x - state.focusX;
      const dy = home.y - state.focusY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const influence = clamp(1 - distance / (62 + state.pull * 5), 0, 1);
      letter.vx += dx / distance * influence * strength * state.pull * .34;
      letter.vy += dy / distance * influence * strength * state.pull * .27;
      letter.angleVelocity += dx / distance * influence * strength * .018;
    });
  }

  function drawSurface() {
    if (!proofImage || !state.pixelEvidenceReady) return;
    state.p5DrawCount += 1;
    const scaleX = sketch.width / DESIGN_WIDTH;
    const scaleY = sketch.height / DESIGN_HEIGHT;
    sketch.clear();
    sketch.background(24, 24, 23);
    sketch.push();
    sketch.tint(255, 239);
    sketch.image(
      proofImage,
      0, 0, sketch.width, sketch.height,
      SOURCE_CROP.x, SOURCE_CROP.y, SOURCE_CROP.width, SOURCE_CROP.height
    );
    sketch.pop();

    sketch.push();
    sketch.scale(scaleX, scaleY);
    sketch.noFill();
    sketch.stroke(23, 23, 22, 35);
    sketch.strokeWeight(.55);
    sketch.line(39, 101, 282, 101);
    sketch.drawingContext.setLineDash([1.5, 3.2]);
    sketch.line(39, 125, 282, 125);
    sketch.drawingContext.setLineDash([]);

    letterStates.forEach((letter, index) => {
      const home = HOMES[index];
      const profile = state.inkProfiles[index % state.inkProfiles.length];
      sketch.stroke(profile.rgb[0], profile.rgb[1], profile.rgb[2], 70);
      sketch.strokeWeight(.65);
      sketch.line(home.x, home.y + 19, letter.x, letter.y + 19);
      sketch.noStroke();
      sketch.fill(23, 23, 22, 48);
      sketch.circle(home.x, home.y + 24, 1.8);

      sketch.push();
      sketch.translate(letter.x, letter.y);
      sketch.rotate(letter.angle);
      sketch.scale(letter.scale);
      sketch.textAlign(sketch.CENTER, sketch.CENTER);
      sketch.textStyle(sketch.BOLD);
      sketch.textFont('Arial Black, Arial, sans-serif');
      sketch.textSize(37);
      if (state.outlineRequired) {
        sketch.stroke(25, 24, 22, 205);
        sketch.strokeWeight(1.15);
      } else {
        sketch.noStroke();
      }
      sketch.fill(...profile.rgb);
      sketch.text(letter.letter, 0, 0);
      sketch.pop();
    });

    if (state.focusActive) {
      const activeColor = state.inkProfiles[3]?.rgb || [155, 34, 104];
      sketch.noFill();
      sketch.stroke(...activeColor, 148);
      sketch.strokeWeight(.85);
      sketch.circle(state.focusX, state.focusY, 13 + state.pull * 1.6);
      sketch.line(state.focusX - 6, state.focusY, state.focusX + 6, state.focusY);
      sketch.line(state.focusX, state.focusY - 6, state.focusX, state.focusY + 6);
      sketch.fill(...activeColor, 235);
      sketch.noStroke();
      sketch.circle(state.focusX, state.focusY, 2.6);
    }
    sketch.pop();
    state.p5CompletedDrawCount += 1;
  }

  function updateCoverageEvidence() {
    const stageRect = stage.getBoundingClientRect();
    const canvas = canvasHost.querySelector('canvas');
    const canvasRect = canvas?.getBoundingClientRect();
    const stageArea = stageRect.width * stageRect.height;
    state.stageCoverageRatio = rounded(stageArea / Math.max(1, innerWidth * innerHeight), 4);
    state.canvasCoverageRatio = rounded(canvasRect ? canvasRect.width * canvasRect.height / Math.max(1, stageArea) : 0, 4);
  }

  function createP5Runtime() {
    return new Promise((resolve, reject) => {
      sketch = new p5(instance => {
        instance.setup = () => {
          try {
            const bounds = canvasHost.getBoundingClientRect();
            const canvas = instance.createCanvas(Math.max(1, Math.round(bounds.width)), Math.max(1, Math.round(bounds.height)));
            canvas.parent(canvasHost);
            canvas.attribute('aria-hidden', 'true');
            instance.pixelDensity(1);
            instance.noLoop();
            state.p5InstanceReady = true;
            state.p5CanvasReady = true;
            state.p5CanvasWidth = instance.width;
            state.p5CanvasHeight = instance.height;
            instance.loadImage(
              ASSET_URL,
              loaded => {
                try {
                  proofImage = loaded;
                  loaded.loadPixels();
                  state.p5ImageDecoded = true;
                  state.p5ImageClass = loaded instanceof p5.Image ? 'p5.Image' : loaded.constructor?.name || '';
                  state.p5ImageWidth = loaded.width;
                  state.p5ImageHeight = loaded.height;
                  state.p5ImagePixelLength = loaded.pixels.length;
                  syncInterface();
                  instance.redraw();
                  requestAnimationFrame(() => {
                    updateCoverageEvidence();
                    resolve();
                  });
                } catch (error) {
                  reject(error);
                }
              },
              error => reject(error)
            );
          } catch (error) {
            reject(error);
          }
        };
        instance.draw = drawSurface;
      }, canvasHost);
    });
  }

  function rememberHumanTransition(kind, source, before, after) {
    state.humanVisualMutationCount += 1;
    state.humanInputCausalityCount += 1;
    if (state.firstHumanStateBefore === null) {
      state.firstHumanStateBefore = before;
      state.firstHumanStateAfter = after;
    }
    state.transitionRecords.push({ kind, source, before, after, trusted: true });
    if (state.transitionRecords.length > 48) state.transitionRecords.shift();
  }

  function acceptTrustedInput(event, kind, source) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      updateDataset();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if ('pointerType' in event) {
      const pointerType = event.pointerType || 'mouse';
      state.lastPointerType = pointerType;
      if (pointerType === 'mouse') state.mouseInputCount += 1;
      if (pointerType === 'touch') state.touchInputCount += 1;
      if (pointerType === 'pen') state.penInputCount += 1;
    }
    return true;
  }

  function setFocus(x, y, kind, source, impulse = 0) {
    const before = visualChecksum();
    state.focusActive = true;
    state.focusX = clamp(x, 0, DESIGN_WIDTH);
    state.focusY = clamp(y, 0, DESIGN_HEIGHT);
    if (state.locked) {
      state.locked = false;
      state.holdToggleCount += 1;
    }
    if (impulse > 0) applyPointerImpulse(impulse);
    const after = visualChecksum();
    if (after !== before) rememberHumanTransition(kind, source, before, after);
    startFiniteSequence(kind);
    redraw();
    return after !== before;
  }

  function pointerPosition(event) {
    const bounds = canvasHost.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1) * DESIGN_WIDTH,
      y: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), 0, 1) * DESIGN_HEIGHT
    };
  }

  function performRelease(kind, source) {
    const before = visualChecksum();
    state.focusActive = false;
    state.locked = false;
    state.releaseCount += 1;
    const after = visualChecksum();
    if (after !== before) rememberHumanTransition(kind, source, before, after);
    startFiniteSequence(kind);
    redraw();
  }

  function performReset(kind, source) {
    const before = visualChecksum();
    cancelFiniteSequence();
    state.focusActive = false;
    state.locked = false;
    state.pull = INITIAL_PULL;
    resetLetterStates();
    state.resetCount += 1;
    const after = visualChecksum();
    if (after !== before) rememberHumanTransition(kind, source, before, after);
    redraw();
  }

  function toggleHold(kind, source) {
    const before = visualChecksum();
    state.locked = !state.locked;
    state.holdToggleCount += 1;
    if (state.locked) cancelFiniteSequence();
    const after = visualChecksum();
    if (after !== before) rememberHumanTransition(kind, source, before, after);
    if (!state.locked) startFiniteSequence(kind);
    redraw();
  }

  function bindInputs() {
    canvasHost.addEventListener('pointerenter', event => {
      if (!event.isTrusted) {
        state.rejectedUntrustedInputCount += 1;
        updateDataset();
        return;
      }
      state.pointerEnterCount += 1;
      state.lastPointerType = event.pointerType || 'mouse';
      updateDataset();
    });

    canvasHost.addEventListener('pointerdown', event => {
      if (!acceptTrustedInput(event, 'pointer-down', 'title-proof')) return;
      state.pointerDownCount += 1;
      state.dragging = true;
      state.activePointerId = event.pointerId;
      canvasHost.setPointerCapture(event.pointerId);
      state.pointerCaptured = canvasHost.hasPointerCapture(event.pointerId);
      if (state.pointerCaptured) state.pointerCaptureCount += 1;
      const point = pointerPosition(event);
      setFocus(point.x, point.y, 'pointer-down', 'title-proof', 1.25);
      event.preventDefault();
    });

    canvasHost.addEventListener('pointermove', event => {
      if (!acceptTrustedInput(event, state.dragging ? 'pointer-drag' : 'pointer-hover', 'title-proof')) return;
      state.pointerMoveCount += 1;
      const point = pointerPosition(event);
      const changed = setFocus(point.x, point.y, state.dragging ? 'pointer-drag' : 'pointer-hover', 'title-proof', state.dragging ? .34 : 0);
      if (changed && state.dragging) state.dragMutationCount += 1;
      if (changed && !state.dragging) state.hoverMutationCount += 1;
      event.preventDefault();
    });

    const releasePointer = (event, cancelled) => {
      if (!acceptTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-release', 'title-proof')) return;
      if (cancelled) state.pointerCancelCount += 1;
      else state.pointerReleaseCount += 1;
      if (state.activePointerId === event.pointerId && canvasHost.hasPointerCapture(event.pointerId)) {
        canvasHost.releasePointerCapture(event.pointerId);
        state.pointerCaptureReleaseCount += 1;
      }
      state.dragging = false;
      state.pointerCaptured = false;
      state.activePointerId = null;
      updateDataset();
    };
    canvasHost.addEventListener('pointerup', event => releasePointer(event, false));
    canvasHost.addEventListener('pointercancel', event => releasePointer(event, true));

    canvasHost.addEventListener('keydown', event => {
      const supported = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Home', 'Escape'].includes(event.key);
      if (!supported || !acceptTrustedInput(event, 'keyboard', 'title-proof')) return;
      state.keyboardInputCount += 1;
      const before = visualChecksum();
      const step = event.shiftKey ? 20 : 8;
      if (event.key.startsWith('Arrow')) {
        state.focusActive = true;
        if (event.key === 'ArrowLeft') state.focusX = clamp(state.focusX - step, 0, DESIGN_WIDTH);
        if (event.key === 'ArrowRight') state.focusX = clamp(state.focusX + step, 0, DESIGN_WIDTH);
        if (event.key === 'ArrowUp') state.focusY = clamp(state.focusY - step, 0, DESIGN_HEIGHT);
        if (event.key === 'ArrowDown') state.focusY = clamp(state.focusY + step, 0, DESIGN_HEIGHT);
        if (state.locked) state.locked = false;
      }
      if (event.key === 'Enter') state.locked = !state.locked;
      if (event.key === ' ') state.focusActive = false;
      if (event.key === 'Home' || event.key === 'Escape') {
        state.focusActive = false;
        state.locked = false;
        state.pull = INITIAL_PULL;
        resetLetterStates();
        state.resetCount += 1;
      }
      const after = visualChecksum();
      if (after !== before) {
        state.keyboardMutationCount += 1;
        rememberHumanTransition('keyboard', event.key, before, after);
      }
      if (event.key === 'Enter' && state.locked) cancelFiniteSequence();
      else startFiniteSequence('keyboard');
      redraw();
      event.preventDefault();
    });

    pullRange.addEventListener('input', event => {
      if (!acceptTrustedInput(event, 'native-range', 'pull-range')) return;
      state.rangeInputCount += 1;
      const before = visualChecksum();
      state.pull = clamp(Number(pullRange.value), 3, 12);
      state.minimumHumanPull = Math.min(state.minimumHumanPull, state.pull);
      state.maximumHumanPull = Math.max(state.maximumHumanPull, state.pull);
      if (state.locked) state.locked = false;
      const after = visualChecksum();
      if (after !== before) {
        state.rangeMutationCount += 1;
        rememberHumanTransition('native-range', 'pull-range', before, after);
      }
      startFiniteSequence('native-range');
      redraw();
    });

    actionButtons.forEach(button => button.addEventListener('click', event => {
      if (!acceptTrustedInput(event, 'visible-button', button.dataset.action)) return;
      state.buttonActivationCount += 1;
      const before = visualChecksum();
      if (button.dataset.action === 'release') performRelease('visible-button', 'release');
      if (button.dataset.action === 'hold') toggleHold('visible-button', 'hold');
      if (button.dataset.action === 'reset') performReset('visible-button', 'reset');
      if (visualChecksum() !== before) state.buttonMutationCount += 1;
    }));

    resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry || !sketch || !state.p5CanvasReady) return;
      const width = Math.max(1, Math.round(entry.contentRect.width));
      const height = Math.max(1, Math.round(entry.contentRect.height));
      if (width === sketch.width && height === sketch.height) return;
      sketch.resizeCanvas(width, height, true);
      state.p5CanvasWidth = width;
      state.p5CanvasHeight = height;
      state.resizeCount += 1;
      updateCoverageEvidence();
      sketch.redraw();
    });
    resizeObserver.observe(canvasHost);
  }

  async function initialize() {
    invariant(stage instanceof HTMLElement, 'stage is missing');
    invariant(canvasHost instanceof HTMLElement, 'canvas host is missing');
    invariant(pullRange instanceof HTMLInputElement && actionButtons.length === 3, 'proof controls are incomplete');
    await loadPixelEvidence();
    invariant(state.assetFetchCount === 1 && state.assetResponseStatus === 200 && state.assetSameOrigin, 'asset fetch evidence is incomplete');
    invariant(state.assetByteLength === EXPECTED_ASSET_BYTE_LENGTH && state.assetShaMatchesExpected, 'exact committed asset is not proven');
    invariant(state.browserImageDecoded && state.sourceNaturalWidth === SOURCE_WIDTH && state.sourceNaturalHeight === SOURCE_HEIGHT, 'browser image decode is incomplete');
    invariant(state.sampledPixelCount === SAMPLE_PIXEL_COUNT && state.sampledPixelByteLength === SAMPLE_BYTE_LENGTH, 'pixel sample is incomplete');
    invariant(state.opaqueSamplePixelCount === SAMPLE_PIXEL_COUNT && state.sampledPixelSha256.length === 64, 'sample digest evidence is incomplete');
    invariant(state.distinctQuantizedColorCount >= 300 && state.sampleLumaStdDev >= 50, 'proof image lacks useful tonal evidence');
    invariant(state.inkProfileCount === 4 && state.minimumInkEvidencePixelCount >= 320, 'four ink profiles were not recovered');
    invariant(state.minimumInkColorDistance >= 60, 'sampled inks are not distinct enough');
    invariant(state.paperLuma >= 170 && state.paperLuma <= 245, 'paper stock evidence is implausible');
    invariant(state.pixelEvidenceBoundToTypography, 'proof pixels are not bound to spring typography');
    await createP5Runtime();
    invariant(state.p5InstanceReady && state.p5CanvasReady, 'p5 canvas did not initialize');
    invariant(state.p5ImageDecoded && state.p5ImageClass === 'p5.Image', 'p5 did not decode the committed proof');
    invariant(state.p5ImageWidth === SOURCE_WIDTH && state.p5ImageHeight === SOURCE_HEIGHT, 'p5 proof dimensions changed');
    invariant(state.p5ImagePixelLength === SOURCE_WIDTH * SOURCE_HEIGHT * 4, 'p5 proof pixel evidence is incomplete');
    bindInputs();
    resetLetterStates();
    syncInterface();
    sketch.redraw();
    state.initialVisualChecksum = visualChecksum();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialStaticConfirmed = state.initialVisualChecksum === visualChecksum()
      && state.inputCount === 0
      && state.finiteSequenceStartCount === 0
      && state.humanVisualMutationCount === 0
      && state.nonInputVisualMutationCount === 0;
    invariant(state.initialStaticConfirmed, 'initial title proof changed without human input');
    updateCoverageEvidence();
    invariant(state.stageCoverageRatio > .98 && state.canvasCoverageRatio > .98, 'title proof does not cover the full stage');
    state.ready = true;
    syncInterface();
  }

  function renderFromPreviewClock(_seconds, captureClock) {
    state.renderCount += 1;
    if (captureClock) {
      state.previewClockCallCount += 1;
      state.previewClockIgnoredCount += 1;
    }
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    state.runtimeAssertCount += 1;
    const before = visualChecksum();
    renderFromPreviewClock(0, true);
    renderFromPreviewClock(2.8, true);
    const after = visualChecksum();
    updateCoverageEvidence();
    const exactAssetEvidence = state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetMimeType.includes('image/jpeg')
      && state.assetByteLength === EXPECTED_ASSET_BYTE_LENGTH
      && state.assetByteLengthMatchesExpected
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.assetShaMatchesExpected
      && state.browserImageDecoded
      && state.sourceNaturalWidth === SOURCE_WIDTH
      && state.sourceNaturalHeight === SOURCE_HEIGHT;
    const sampledEvidence = state.browserCanvasReadback
      && state.sampledPixelCount === SAMPLE_PIXEL_COUNT
      && state.sampledPixelByteLength === SAMPLE_BYTE_LENGTH
      && state.sampledPixelSha256.length === 64
      && /[1-9a-f]/.test(state.sampledPixelSha256)
      && state.nonzeroSampleByteCount > SAMPLE_PIXEL_COUNT * 3
      && state.opaqueSamplePixelCount === SAMPLE_PIXEL_COUNT
      && state.distinctQuantizedColorCount >= 300
      && state.minimumSampleLuma >= 0
      && state.minimumSampleLuma < 55
      && state.maximumSampleLuma > 195
      && state.maximumSampleLuma <= 255
      && state.sampleLumaMean > 110
      && state.sampleLumaMean < 175
      && state.sampleLumaStdDev > 55
      && state.sampleLumaStdDev < 95
      && state.edgeEnergyMean > .012
      && state.edgeEnergyMean < .06;
    const functionalPixelEvidence = state.inkProfileCount === 4
      && state.inkProfiles.length === 4
      && state.inkProfiles.every(profile => profile.evidencePixelCount >= 320
        && profile.meanSaturation >= .55
        && profile.rgb.every(channel => channel >= 0 && channel <= 255))
      && state.inkEvidencePixelCount > 1500
      && state.minimumInkColorDistance >= 60
      && state.paperLuma >= 170
      && state.paperLuma <= 245
      && state.paperLumaStdDev >= .2
      && state.paperLumaStdDev <= 10
      && state.paperEdgeEnergy > .0005
      && state.paperEdgeEnergy < .02
      && state.minimumInkContrast > 1
      && state.maximumInkContrast > 3
      && state.pixelDrivenSpringStiffness >= .1
      && state.pixelDrivenSpringStiffness <= .18
      && state.pixelDrivenDamping >= .72
      && state.pixelDrivenDamping <= .84
      && state.pixelDrivenSafeDisplacement >= 14
      && state.pixelDrivenSafeDisplacement <= 21
      && state.pixelEvidenceBoundToTypography;
    const p5Evidence = state.p5InstanceReady
      && state.p5CanvasReady
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === SOURCE_WIDTH
      && state.p5ImageHeight === SOURCE_HEIGHT
      && state.p5ImagePixelLength === SOURCE_WIDTH * SOURCE_HEIGHT * 4
      && state.p5CompletedDrawCount >= 1;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStaticConfirmed
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && state.automaticSequenceStartCount === 0
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.nonInputVisualMutationCount === 0
      && state.renderIgnoresPreviewClock
      && before === after
      && state.transitionRecords.every(record => record.trusted === true)
      && state.sequenceRecords.every(record => record.trusted === true && record.maximumSteps === MAX_SEQUENCE_STEPS)
      && state.maximumSequenceStepCount <= MAX_SEQUENCE_STEPS;
    const humanOwned = state.inputCount === 0
      ? state.currentVisualChecksum === state.initialVisualChecksum
        && state.finiteSequenceStartCount === 0
        && state.humanVisualMutationCount === 0
      : state.inputCount === state.trustedInputCount
        && state.lastInputTrusted === true
        && state.humanVisualMutationCount > 0
        && state.humanInputCausalityCount > 0
        && state.finiteSequenceStartCount > 0;
    const fullStage = state.stageCoverageRatio > .98 && state.canvasCoverageRatio > .98;
    state.runtimeAssertionPassed = Boolean(
      state.ready && exactAssetEvidence && sampledEvidence && functionalPixelEvidence
      && p5Evidence && honestInteraction && humanOwned && fullStage
    );
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
    return state.runtimeAssertionPassed;
  };

  const ready = initialize();
  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: state.renderer,
    render: renderFromPreviewClock,
    ready
  });

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrame);
    resizeObserver?.disconnect();
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
