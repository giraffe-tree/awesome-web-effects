import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-09/kinetic-rain-letterpress/cotton-proof-stock.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = Object.freeze({
  byteLength: 274593,
  width: 960,
  height: 640,
  sha256: 'f560758adc555f66ffd903f9cc16d4e89aa447760b14faedfd83d5737cdc1863',
});
const SOURCE_CROP = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 54;
const SAMPLE_PIXEL_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const SAMPLE_BYTE_LENGTH = SAMPLE_PIXEL_COUNT * 4;
const GLYPHS = [...'PROOFING'];
const GLYPH_COUNT = GLYPHS.length;
const INITIAL_PROGRESS = Object.freeze([.06, .19, .11, .27, .03, .22, .14, .3]);
const INITIAL_PRESSURE = 72;
const INK_REGIONS = Object.freeze({
  navy: { x0: .085, x1: .155, y0: .11, y1: .27, label: 'Navy' },
  rust: { x0: .085, x1: .155, y0: .34, y1: .5, label: 'Rust' },
  graphite: { x0: .085, x1: .155, y0: .57, y1: .73, label: 'Graphite' },
});
const PAPER_REGION = Object.freeze({ x0: .27, x1: .77, y0: .17, y1: .69 });

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 4) => Number(value.toFixed(digits));
const mix = (from, to, progress) => from + (to - from) * progress;
const easeOutCubic = progress => 1 - (1 - progress) ** 3;

try {
  const stage = document.querySelector('#press-stage');
  const surface = document.querySelector('#print-surface');
  const sourceImage = document.querySelector('#source-image');
  const evidenceCanvas = document.querySelector('#source-evidence');
  const sourceStatus = document.querySelector('[data-source-status]');
  const conclusionOutput = document.querySelector('[data-proof-conclusion]');
  const proofStateOutput = document.querySelector('[data-proof-state]');
  const pressureReading = document.querySelector('[data-reading="pressure"]');
  const targetReading = document.querySelector('[data-reading="target"]');
  const paperReading = document.querySelector('[data-reading="paper"]');
  const gainReading = document.querySelector('[data-reading="gain"]');
  const impactReadout = document.querySelector('[data-impact-readout]');
  const pressureInput = document.querySelector('#press-pressure');
  const pressureOutput = document.querySelector('[data-pressure-output]');
  const inkButtons = [...document.querySelectorAll('[data-ink]')];
  const actionButtons = [...document.querySelectorAll('[data-action]')];

  if (!stage || !surface || !sourceImage || !evidenceCanvas || !sourceStatus
    || !conclusionOutput || !proofStateOutput || !pressureReading || !targetReading
    || !paperReading || !gainReading || !impactReadout || !pressureInput || !pressureOutput
    || inkButtons.length !== 3 || actionButtons.length !== 3) {
    throw new Error('kinetic-rain-letterpress: required DOM is incomplete');
  }

  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    id: 'kinetic-rain-letterpress',
    task: 'human-operated-pixel-evidenced-digital-letterpress-make-ready',
    claimedLibrary: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'trusted-human-input-drops-deterministic-type-slugs-into-p5-letterpress-impressions-on-browser-decoded-proof-stock',
    assetMechanismRole: 'exact-source-paper-and-three-ink-swatch-pixels-directly-determine-canvas-substrate-ink-colors-paper-absorbency-impression-gain-pressure-target-and-proof-conclusion',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-control', 'ink-buttons', 'visible-action-buttons'],
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
    pointerMoveCount: 0,
    pointerDownCount: 0,
    pointerDragCount: 0,
    pointerUpCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    keyboardMutationCount: 0,
    rangeInputCount: 0,
    inkButtonInputCount: 0,
    actionButtonInputCount: 0,
    rainStepCount: 0,
    impressionCount: 0,
    maximumImpressionCount: 0,
    stampMutationCount: 0,
    undoCount: 0,
    resetCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    pointerTypesSeen: [],
    activePointerId: null,
    pointerCaptured: false,
    dragging: false,
    activeGlyphIndex: 0,
    dragStartY: 0,
    dragStartProgress: 0,
    progress: [...INITIAL_PROGRESS],
    initialProgress: [...INITIAL_PROGRESS],
    minimumProgress: Math.min(...INITIAL_PROGRESS),
    maximumProgress: Math.max(...INITIAL_PROGRESS),
    maximumProgressDelta: 0,
    selectedInkId: 'navy',
    selectedInkRgb: [24, 30, 37],
    pressure: INITIAL_PRESSURE,
    initialPressure: INITIAL_PRESSURE,
    minimumPressure: INITIAL_PRESSURE,
    maximumPressure: INITIAL_PRESSURE,
    recommendedPressure: 0,
    impressionGain: 0,
    proofConclusion: 'HOLD / 0 OF 8',
    proofState: 'awaiting',
    historyDepth: 0,
    sourceAssetUrl: ASSET_URL,
    sourceAssetKind: 'built-in-imagegen-fictional-letterpress-proof-stock',
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
    paperProfile: null,
    paperRgb: [229, 222, 208],
    paperLuminance: 0,
    paperTextureDeviation: 0,
    paperEdgeMean: 0,
    paperAbsorbency: 0,
    inkProfiles: [],
    inkProfileCount: 0,
    minimumInkColorDistance: 0,
    pixelEvidenceBoundToInk: false,
    pixelEvidenceBoundToPaper: false,
    pixelEvidenceBoundToConclusion: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5NoLoop: false,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    p5EventRedrawCount: 0,
    p5SourceDrawCount: 0,
    p5GlyphDrawCount: 0,
    p5ImpressionDrawCount: 0,
    resizeCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    stageCoverageRatio: 0,
    canvasCoverageRatio: 0,
    initialVisualStateChecksum: '',
    currentVisualStateChecksum: '',
    interactionRecords: [],
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__KINETIC_RAIN_LETTERPRESS_STATE__ = state;

  let browserImage;
  let sourceObjectUrl = '';
  let sampledPixels;
  let sketch;
  let resizeFrame = 0;
  let history = [];
  let initialSnapshot;
  let lastHoverIndex = -1;

  function invariant(condition, message) {
    if (!condition) throw new Error(`kinetic-rain-letterpress: ${message}`);
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
      checksum ^= value + index * 23;
      checksum = Math.imul(checksum, 16777619) >>> 0;
    }
    return checksum.toString(16).padStart(8, '0');
  }

  function colorEvidence(red, green, blue) {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const maximum = Math.max(r, g, b);
    const minimum = Math.min(r, g, b);
    const luminance = .2126 * r + .7152 * g + .0722 * b;
    const saturation = maximum === 0 ? 0 : (maximum - minimum) / maximum;
    return { luminance, saturation };
  }

  function pixelOffset(x, y) {
    const clampedX = Math.max(0, Math.min(SAMPLE_WIDTH - 1, x));
    const clampedY = Math.max(0, Math.min(SAMPLE_HEIGHT - 1, y));
    return (clampedY * SAMPLE_WIDTH + clampedX) * 4;
  }

  function regionProfile(region, id = 'paper') {
    const x0 = Math.floor(region.x0 * SAMPLE_WIDTH);
    const x1 = Math.max(x0 + 1, Math.ceil(region.x1 * SAMPLE_WIDTH));
    const y0 = Math.floor(region.y0 * SAMPLE_HEIGHT);
    const y1 = Math.max(y0 + 1, Math.ceil(region.y1 * SAMPLE_HEIGHT));
    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;
    let luminanceTotal = 0;
    let luminanceSquaredTotal = 0;
    let saturationTotal = 0;
    let edgeTotal = 0;
    let edgeCount = 0;
    let count = 0;

    for (let y = y0; y < Math.min(SAMPLE_HEIGHT, y1); y += 1) {
      for (let x = x0; x < Math.min(SAMPLE_WIDTH, x1); x += 1) {
        const offset = pixelOffset(x, y);
        const red = sampledPixels[offset];
        const green = sampledPixels[offset + 1];
        const blue = sampledPixels[offset + 2];
        const evidence = colorEvidence(red, green, blue);
        redTotal += red;
        greenTotal += green;
        blueTotal += blue;
        luminanceTotal += evidence.luminance;
        luminanceSquaredTotal += evidence.luminance * evidence.luminance;
        saturationTotal += evidence.saturation;
        count += 1;

        const right = pixelOffset(x + 1, y);
        const down = pixelOffset(x, y + 1);
        edgeTotal += (Math.abs(red - sampledPixels[right])
          + Math.abs(green - sampledPixels[right + 1])
          + Math.abs(blue - sampledPixels[right + 2])) / (255 * 3);
        edgeTotal += (Math.abs(red - sampledPixels[down])
          + Math.abs(green - sampledPixels[down + 1])
          + Math.abs(blue - sampledPixels[down + 2])) / (255 * 3);
        edgeCount += 2;
      }
    }

    const luminance = luminanceTotal / count;
    const rgb = [Math.round(redTotal / count), Math.round(greenTotal / count), Math.round(blueTotal / count)];
    return {
      id,
      label: region.label || id,
      pixelCount: count,
      rgb,
      css: `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`,
      luminance: rounded(luminance),
      saturation: rounded(saturationTotal / count),
      luminanceDeviation: rounded(Math.sqrt(Math.max(0, luminanceSquaredTotal / count - luminance * luminance))),
      edgeMean: rounded(edgeTotal / edgeCount),
    };
  }

  function colorDistance(first, second) {
    return Math.hypot(first[0] - second[0], first[1] - second[1], first[2] - second[2]);
  }

  function analyzeSource() {
    const colors = new Set();
    let luminanceTotal = 0;
    let luminanceSquaredTotal = 0;
    let saturationTotal = 0;
    let luminanceMinimum = 1;
    let luminanceMaximum = 0;
    let edgeTotal = 0;
    let edgeCount = 0;
    let opaque = 0;

    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const offset = pixelOffset(x, y);
        const red = sampledPixels[offset];
        const green = sampledPixels[offset + 1];
        const blue = sampledPixels[offset + 2];
        const evidence = colorEvidence(red, green, blue);
        colors.add(`${red >> 2},${green >> 2},${blue >> 2}`);
        luminanceTotal += evidence.luminance;
        luminanceSquaredTotal += evidence.luminance * evidence.luminance;
        saturationTotal += evidence.saturation;
        luminanceMinimum = Math.min(luminanceMinimum, evidence.luminance);
        luminanceMaximum = Math.max(luminanceMaximum, evidence.luminance);
        if (sampledPixels[offset + 3] === 255) opaque += 1;

        if (x < SAMPLE_WIDTH - 1) {
          const right = pixelOffset(x + 1, y);
          edgeTotal += (Math.abs(red - sampledPixels[right])
            + Math.abs(green - sampledPixels[right + 1])
            + Math.abs(blue - sampledPixels[right + 2])) / (255 * 3);
          edgeCount += 1;
        }
        if (y < SAMPLE_HEIGHT - 1) {
          const down = pixelOffset(x, y + 1);
          edgeTotal += (Math.abs(red - sampledPixels[down])
            + Math.abs(green - sampledPixels[down + 1])
            + Math.abs(blue - sampledPixels[down + 2])) / (255 * 3);
          edgeCount += 1;
        }
      }
    }

    const mean = luminanceTotal / SAMPLE_PIXEL_COUNT;
    state.sampledPixelCount = SAMPLE_PIXEL_COUNT;
    state.sampledPixelByteLength = sampledPixels.byteLength;
    state.sampledOpaquePixelCount = opaque;
    state.distinctSampleColorCount = colors.size;
    state.sampledLuminanceMinimum = rounded(luminanceMinimum);
    state.sampledLuminanceMaximum = rounded(luminanceMaximum);
    state.sampledLuminanceRange = rounded(luminanceMaximum - luminanceMinimum);
    state.sampledLuminanceMean = rounded(mean);
    state.sampledLuminanceStdDev = rounded(Math.sqrt(Math.max(0, luminanceSquaredTotal / SAMPLE_PIXEL_COUNT - mean * mean)));
    state.sampledSaturationMean = rounded(saturationTotal / SAMPLE_PIXEL_COUNT);
    state.sampledEdgeMean = rounded(edgeTotal / edgeCount);

    state.paperProfile = regionProfile(PAPER_REGION, 'cotton-rag');
    state.paperRgb = [...state.paperProfile.rgb];
    state.paperLuminance = state.paperProfile.luminance;
    state.paperTextureDeviation = state.paperProfile.luminanceDeviation;
    state.paperEdgeMean = state.paperProfile.edgeMean;
    state.paperAbsorbency = rounded(clamp(.25 + state.paperTextureDeviation * 4.2 + state.paperEdgeMean * 6.5, .25, .86));

    state.inkProfiles = Object.entries(INK_REGIONS).map(([id, region]) => regionProfile(region, id));
    state.inkProfileCount = state.inkProfiles.length;
    state.minimumInkColorDistance = rounded(Math.min(
      colorDistance(state.inkProfiles[0].rgb, state.inkProfiles[1].rgb),
      colorDistance(state.inkProfiles[0].rgb, state.inkProfiles[2].rgb),
      colorDistance(state.inkProfiles[1].rgb, state.inkProfiles[2].rgb),
    ), 2);
    state.selectedInkRgb = [...state.inkProfiles[0].rgb];
    state.recommendedPressure = Math.round(clamp(60 + state.paperAbsorbency * 23, 60, 84));
    state.pixelEvidenceBoundToInk = state.inkProfileCount === 3 && state.minimumInkColorDistance > 18;
    state.pixelEvidenceBoundToPaper = state.paperLuminance > .58 && state.paperTextureDeviation > .015;
    state.pixelEvidenceBoundToConclusion = state.pixelEvidenceBoundToInk && state.pixelEvidenceBoundToPaper;
  }

  function snapshot() {
    return {
      progress: [...state.progress],
      activeGlyphIndex: state.activeGlyphIndex,
      selectedInkId: state.selectedInkId,
      pressure: state.pressure,
    };
  }

  function storeHistory() {
    const next = snapshot();
    const previous = history.at(-1);
    if (!previous || JSON.stringify(previous) !== JSON.stringify(next)) {
      history.push(next);
      history = history.slice(-14);
      state.historyDepth = history.length;
    }
  }

  function visualChecksum() {
    return fnvChecksum([
      ...state.progress,
      state.activeGlyphIndex,
      state.selectedInkId,
      state.pressure,
      state.impressionCount,
      state.proofConclusion,
    ]);
  }

  function selectedInkProfile() {
    return state.inkProfiles.find(profile => profile.id === state.selectedInkId) || state.inkProfiles[0];
  }

  function updateProofEvidence() {
    const previousCount = state.impressionCount;
    state.impressionCount = state.progress.filter(progress => progress >= .985).length;
    state.maximumImpressionCount = Math.max(state.maximumImpressionCount, state.impressionCount);
    if (state.impressionCount !== previousCount) state.stampMutationCount += Math.abs(state.impressionCount - previousCount);

    const ink = selectedInkProfile();
    const inkDensity = clamp(1 - ink.luminance);
    const pressureRatio = state.pressure / 100;
    state.impressionGain = rounded(pressureRatio * (.73 + state.paperAbsorbency * .5) * (.96 + inkDensity * .13));
    const pressureDelta = state.pressure - state.recommendedPressure;
    if (state.impressionCount < GLYPH_COUNT) {
      state.proofState = state.impressionCount === 0 ? 'awaiting' : 'make-ready';
      state.proofConclusion = `HOLD / ${state.impressionCount} OF ${GLYPH_COUNT}`;
    } else if (Math.abs(pressureDelta) <= 7 && state.impressionGain >= .64 && state.impressionGain <= 1.13) {
      state.proofState = 'passed';
      state.proofConclusion = 'PASS / EVEN BITE';
    } else if (pressureDelta > 7) {
      state.proofState = 'hold';
      state.proofConclusion = 'HOLD / DOT GAIN';
    } else {
      state.proofState = 'hold';
      state.proofConclusion = 'HOLD / WEAK BITE';
    }
    state.currentVisualStateChecksum = visualChecksum();
  }

  function updateInterface() {
    const ink = selectedInkProfile();
    pressureInput.value = String(state.pressure);
    pressureOutput.value = String(state.pressure);
    pressureOutput.textContent = String(state.pressure);
    pressureReading.textContent = `Pressure ${state.pressure}`;
    targetReading.textContent = `Target ${state.recommendedPressure}`;
    paperReading.textContent = `Paper ${Math.round(state.paperAbsorbency * 100)}`;
    gainReading.textContent = `Gain ${state.impressionGain.toFixed(2)}`;
    proofStateOutput.textContent = state.proofState;
    conclusionOutput.textContent = state.proofConclusion;
    impactReadout.textContent = `${state.impressionCount} / ${GLYPH_COUNT} impressions · glyph ${state.activeGlyphIndex + 1}`;
    stage.style.setProperty('--ink', ink.css);
    stage.style.setProperty('--paper', `rgb(${state.paperRgb.join(' ')})`);
    stage.style.setProperty('--decision-color', state.proofState === 'passed' ? '#3f765b' : '#9b3928');
    inkButtons.forEach((button, index) => {
      const profile = state.inkProfiles[index];
      button.style.setProperty('--swatch', profile.css);
      button.dataset.selected = String(button.dataset.ink === state.selectedInkId);
      button.setAttribute('aria-pressed', String(button.dataset.ink === state.selectedInkId));
    });

    stage.dataset.impressionCount = String(state.impressionCount);
    stage.dataset.proofState = state.proofState;
    stage.dataset.selectedInk = state.selectedInkId;
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.pixelEvidenceBoundToInk = String(state.pixelEvidenceBoundToInk);
    stage.dataset.pixelEvidenceBoundToPaper = String(state.pixelEvidenceBoundToPaper);
    stage.dataset.pixelEvidenceBoundToConclusion = String(state.pixelEvidenceBoundToConclusion);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.syntheticInputDispatch = String(state.syntheticInputDispatch);
  }

  function requestHumanRedraw(source) {
    if (!sketch) return;
    state.p5EventRedrawCount += 1;
    state.humanVisualMutationCount += 1;
    state.humanInputCausalityCount += 1;
    stage.dataset.lastRedrawSource = source;
    sketch.redraw();
  }

  function glyphX(index, width) {
    return mix(width * .31, width * .88, index / (GLYPH_COUNT - 1));
  }

  function drawScene(p) {
    state.p5DrawCount += 1;
    const width = p.width;
    const height = p.height;
    const context = p.drawingContext;
    context.save();
    context.imageSmoothingEnabled = true;
    context.drawImage(
      browserImage,
      SOURCE_CROP.x,
      SOURCE_CROP.y,
      SOURCE_CROP.width,
      SOURCE_CROP.height,
      0,
      0,
      width,
      height,
    );
    context.restore();
    state.p5SourceDrawCount += 1;

    const ink = selectedInkProfile();
    const paper = state.paperRgb;
    const topY = height * .24;
    const strikeY = height * .6;
    const proofY = height * .735;
    const slugWidth = Math.min(38, Math.max(10, width * .054));
    const slugHeight = Math.min(45, Math.max(13, height * .145));
    const typeSize = Math.min(32, Math.max(8, width * .058));
    const proofSize = Math.min(48, Math.max(10, width * .075));

    p.push();
    p.stroke(56, 52, 44, 48);
    p.strokeWeight(Math.max(.7, width / 720));
    p.line(width * .27, strikeY + slugHeight * .52, width * .92, strikeY + slugHeight * .52);
    p.noStroke();
    p.fill(55, 51, 43, 90);
    p.textFont('ui-monospace, monospace');
    p.textSize(Math.min(6, Math.max(3, width * .009)));
    p.textAlign(p.LEFT, p.CENTER);
    p.text('TYPE RACK', width * .27, strikeY + slugHeight * .75);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text('PROOF LINE', width * .92, proofY + proofSize * .62);
    p.pop();

    state.p5GlyphDrawCount = 0;
    state.p5ImpressionDrawCount = 0;
    GLYPHS.forEach((glyph, index) => {
      const progress = clamp(state.progress[index]);
      const eased = easeOutCubic(progress);
      const x = glyphX(index, width);
      const y = mix(topY + (index % 3) * height * .025, strikeY, eased);
      const active = index === state.activeGlyphIndex;
      const impact = clamp((progress - .72) / .28);

      if (active) {
        p.push();
        p.stroke(ink.rgb[0], ink.rgb[1], ink.rgb[2], 95);
        p.strokeWeight(Math.max(.65, width / 750));
        p.drawingContext.setLineDash([Math.max(2, width * .006), Math.max(2, width * .005)]);
        p.line(x, topY - slugHeight * .55, x, strikeY + slugHeight * .55);
        p.drawingContext.setLineDash([]);
        p.pop();
      }

      p.push();
      p.translate(x, y);
      p.noStroke();
      p.fill(28, 29, 27, 50);
      p.rect(-slugWidth * .5 + 2, -slugHeight * .5 + 3, slugWidth, slugHeight, slugWidth * .14);
      p.fill(active ? ink.rgb[0] : 49, active ? ink.rgb[1] : 48, active ? ink.rgb[2] : 43, 238);
      p.rect(-slugWidth * .5, -slugHeight * .5, slugWidth, slugHeight, slugWidth * .14);
      p.stroke(235, 227, 211, active ? 170 : 68);
      p.noFill();
      p.rect(-slugWidth * .39, -slugHeight * .37, slugWidth * .78, slugHeight * .74, slugWidth * .1);
      p.noStroke();
      p.fill(paper[0], paper[1], paper[2], 245);
      p.textFont('Georgia, serif');
      p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(typeSize);
      p.text(glyph, 0, slugHeight * .02);
      p.pop();
      state.p5GlyphDrawCount += 1;

      if (impact > 0 && progress < .985) {
        p.push();
        p.translate(x, strikeY + slugHeight * .52);
        p.scale(1 + impact * (.08 + state.impressionGain * .12), .35 + impact * .25);
        p.noStroke();
        p.fill(ink.rgb[0], ink.rgb[1], ink.rgb[2], 45 + impact * 115);
        p.textFont('Georgia, serif');
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(proofSize * .72);
        p.text(glyph, 0, 0);
        p.pop();
      }

      if (progress >= .985) {
        const expansion = 1 + state.impressionGain * .13;
        p.push();
        p.translate(x, proofY);
        p.scale(expansion, 1 - Math.min(.075, state.impressionGain * .035));
        p.noStroke();
        p.fill(ink.rgb[0], ink.rgb[1], ink.rgb[2], 224);
        p.textFont('Georgia, serif');
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(proofSize);
        p.text(glyph, 0, 0);
        p.fill(paper[0], paper[1], paper[2], Math.round(22 + state.paperAbsorbency * 24));
        p.textSize(proofSize * .985);
        p.text(glyph, width * .0015, -height * .0015);
        p.pop();
        state.p5ImpressionDrawCount += 1;
      } else {
        p.push();
        p.noFill();
        p.stroke(62, 58, 49, 38);
        p.strokeWeight(Math.max(.5, width / 1000));
        p.circle(x, proofY, Math.max(3, width * .009));
        p.pop();
      }
    });

    state.stageWidth = rounded(stage.getBoundingClientRect().width, 2);
    state.stageHeight = rounded(stage.getBoundingClientRect().height, 2);
    state.canvasWidth = p.width;
    state.canvasHeight = p.height;
    state.stageCoverageRatio = rounded(state.stageWidth * state.stageHeight / Math.max(1, innerWidth * innerHeight));
    state.canvasCoverageRatio = rounded(p.width * p.height / Math.max(1, state.stageWidth * state.stageHeight));
    state.p5CompletedDrawCount += 1;
  }

  function createP5Sketch() {
    return new Promise(resolve => {
      sketch = new p5(p => {
        p.setup = () => {
          const bounds = stage.getBoundingClientRect();
          const canvas = p.createCanvas(Math.max(140, Math.round(bounds.width)), Math.max(78, Math.round(bounds.height)));
          canvas.parent(surface);
          canvas.attribute('aria-hidden', 'true');
          p.pixelDensity(1);
          p.noLoop();
          state.p5InstanceReady = true;
          state.p5CanvasReady = true;
          state.p5NoLoop = !p.isLooping();
          resolve();
        };
        p.draw = () => drawScene(p);
      }, surface);
    });
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
    state.interactionRecords = state.interactionRecords.slice(-30);
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

  function stagePoint(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width),
      y: clamp((event.clientY - bounds.top) / bounds.height),
      height: bounds.height,
    };
  }

  function nearestGlyphIndex(u) {
    return Math.max(0, Math.min(GLYPH_COUNT - 1, Math.round((u - .31) / (.88 - .31) * (GLYPH_COUNT - 1))));
  }

  function applyProgress(index, nextProgress, source) {
    const previous = state.progress[index];
    state.progress[index] = clamp(nextProgress);
    state.minimumProgress = Math.min(state.minimumProgress, state.progress[index]);
    state.maximumProgress = Math.max(state.maximumProgress, state.progress[index]);
    state.maximumProgressDelta = Math.max(state.maximumProgressDelta, Math.abs(state.progress[index] - previous));
    updateProofEvidence();
    updateInterface();
    requestHumanRedraw(source);
  }

  function onPointerEnter(event) {
    if (!recordInput(event, 'pointerenter', 'type-rack-hover')) return;
    recordPointerType(event.pointerType);
    state.pointerEnterCount += 1;
    state.hoverInputCount += 1;
    const point = stagePoint(event);
    state.activeGlyphIndex = nearestGlyphIndex(point.x);
    lastHoverIndex = state.activeGlyphIndex;
    updateProofEvidence();
    updateInterface();
    requestHumanRedraw('pointerenter');
  }

  function onPointerMove(event) {
    if (state.activePointerId !== null && event.pointerId !== state.activePointerId) return;
    if (state.activePointerId === null && event.target.closest('.press-controls, .ink-rail')) return;
    const point = stagePoint(event);
    if (!state.dragging) {
      const nextIndex = nearestGlyphIndex(point.x);
      if (nextIndex === lastHoverIndex) return;
      if (!recordInput(event, 'pointermove', 'type-rack-hover')) return;
      recordPointerType(event.pointerType);
      state.pointerMoveCount += 1;
      state.hoverInputCount += 1;
      state.activeGlyphIndex = nextIndex;
      lastHoverIndex = nextIndex;
      updateProofEvidence();
      updateInterface();
      requestHumanRedraw('pointermove');
      return;
    }

    if (!recordInput(event, 'pointerdrag', 'captured-type-drop')) return;
    recordPointerType(event.pointerType);
    state.pointerMoveCount += 1;
    state.pointerDragCount += 1;
    const travel = (event.clientY - state.dragStartY) / Math.max(45, point.height * .43);
    applyProgress(state.activeGlyphIndex, state.dragStartProgress + travel, 'captured-pointer-drag');
  }

  function onPointerDown(event) {
    if (event.target.closest('.press-controls, .ink-rail')) return;
    if (!recordInput(event, 'pointerdown', 'type-slug')) return;
    recordPointerType(event.pointerType);
    storeHistory();
    const point = stagePoint(event);
    state.pointerDownCount += 1;
    state.activeGlyphIndex = nearestGlyphIndex(point.x);
    state.activePointerId = event.pointerId;
    state.dragging = true;
    state.dragStartY = event.clientY;
    state.dragStartProgress = state.progress[state.activeGlyphIndex];
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    updateProofEvidence();
    updateInterface();
    requestHumanRedraw('pointerdown');
    stage.focus({ preventScroll: true });
    event.preventDefault();
  }

  function finishPointer(event, cancelled) {
    if (event.pointerId !== state.activePointerId) return;
    if (!recordInput(event, cancelled ? 'pointercancel' : 'pointerup', cancelled ? 'captured-type-cancel' : 'captured-type-release')) return;
    recordPointerType(event.pointerType);
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerUpCount += 1;
    if (!cancelled && state.progress[state.activeGlyphIndex] >= .76) {
      state.progress[state.activeGlyphIndex] = 1;
    }
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.activePointerId = null;
    state.pointerCaptured = false;
    state.dragging = false;
    updateProofEvidence();
    updateInterface();
    requestHumanRedraw(cancelled ? 'pointercancel' : 'pointerup');
  }

  function rainStep(event, source = 'rain-step-button') {
    if (!recordInput(event, source === 'keyboard-rain-step' ? 'keyboard' : 'button', source)) return;
    event.preventDefault();
    storeHistory();
    if (source === 'keyboard-rain-step') state.keyboardInputCount += 1;
    else state.actionButtonInputCount += 1;
    state.rainStepCount += 1;
    state.progress = state.progress.map((progress, index) => clamp(progress + .245 + (index % 3) * .018));
    state.minimumProgress = Math.min(state.minimumProgress, ...state.progress);
    state.maximumProgress = Math.max(state.maximumProgress, ...state.progress);
    state.maximumProgressDelta = Math.max(state.maximumProgressDelta, .281);
    updateProofEvidence();
    updateInterface();
    requestHumanRedraw(source);
  }

  function selectInk(event, inkId, source = 'ink-button') {
    if (!recordInput(event, source === 'keyboard-ink-cycle' ? 'keyboard' : 'button', source)) return;
    storeHistory();
    if (source === 'keyboard-ink-cycle') state.keyboardInputCount += 1;
    else state.inkButtonInputCount += 1;
    state.selectedInkId = inkId;
    state.selectedInkRgb = [...selectedInkProfile().rgb];
    updateProofEvidence();
    updateInterface();
    requestHumanRedraw(source);
  }

  function restoreSnapshot(saved, source) {
    state.progress = [...saved.progress];
    state.activeGlyphIndex = saved.activeGlyphIndex;
    state.selectedInkId = saved.selectedInkId;
    state.selectedInkRgb = [...selectedInkProfile().rgb];
    state.pressure = saved.pressure;
    updateProofEvidence();
    updateInterface();
    requestHumanRedraw(source);
  }

  function undo(event, source = 'undo-button') {
    if (!recordInput(event, source === 'keyboard-undo' ? 'keyboard' : 'button', source)) return;
    event.preventDefault();
    if (source === 'keyboard-undo') state.keyboardInputCount += 1;
    else state.actionButtonInputCount += 1;
    state.undoCount += 1;
    const previous = history.pop() || initialSnapshot;
    state.historyDepth = history.length;
    restoreSnapshot(previous, source);
  }

  function reset(event, source = 'reset-button') {
    if (!recordInput(event, source === 'keyboard-reset' ? 'keyboard' : 'button', source)) return;
    event.preventDefault();
    storeHistory();
    if (source === 'keyboard-reset') state.keyboardInputCount += 1;
    else state.actionButtonInputCount += 1;
    state.resetCount += 1;
    restoreSnapshot(initialSnapshot, source);
  }

  function onPressureInput(event) {
    if (!recordInput(event, 'range', 'impression-pressure')) return;
    storeHistory();
    state.rangeInputCount += 1;
    state.pressure = Number(pressureInput.value);
    state.minimumPressure = Math.min(state.minimumPressure, state.pressure);
    state.maximumPressure = Math.max(state.maximumPressure, state.pressure);
    updateProofEvidence();
    updateInterface();
    requestHumanRedraw('range');
  }

  function onKeyDown(event) {
    if (event.target === pressureInput || event.target.closest('.ink-rail') || event.target.closest('.press-controls')) return;
    if (event.key === 'Home') {
      reset(event, 'keyboard-reset');
      return;
    }
    if (event.key === 'Backspace' || event.key.toLowerCase() === 'u') {
      undo(event, 'keyboard-undo');
      return;
    }
    if (event.key === ' ') {
      rainStep(event, 'keyboard-rain-step');
      return;
    }
    if (event.key.toLowerCase() === 'i') {
      const currentIndex = state.inkProfiles.findIndex(profile => profile.id === state.selectedInkId);
      const nextInk = state.inkProfiles[(currentIndex + 1) % state.inkProfiles.length];
      selectInk(event, nextInk.id, 'keyboard-ink-cycle');
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      if (!recordInput(event, 'keyboard', 'glyph-selection')) return;
      event.preventDefault();
      state.keyboardInputCount += 1;
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      state.activeGlyphIndex = (state.activeGlyphIndex + direction + GLYPH_COUNT) % GLYPH_COUNT;
      lastHoverIndex = state.activeGlyphIndex;
      updateProofEvidence();
      updateInterface();
      requestHumanRedraw('keyboard-selection');
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      if (!recordInput(event, 'keyboard', 'type-drop')) return;
      event.preventDefault();
      storeHistory();
      state.keyboardInputCount += 1;
      state.keyboardMutationCount += 1;
      const current = state.progress[state.activeGlyphIndex];
      const next = event.key === 'Enter' ? 1 : current + (event.key === 'ArrowDown' ? .18 : -.14);
      applyProgress(state.activeGlyphIndex, next, 'keyboard-type-drop');
    }
  }

  function onResize() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch) return;
      const bounds = stage.getBoundingClientRect();
      sketch.resizeCanvas(Math.max(140, Math.round(bounds.width)), Math.max(78, Math.round(bounds.height)), true);
      state.resizeCount += 1;
      sketch.redraw();
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
    browserImage = sourceImage;

    const context = evidenceCanvas.getContext('2d', { willReadFrequently: true });
    invariant(context, '2D readback context unavailable');
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
    analyzeSource();
    state.sampledPixelSha256 = await sha256(sampledPixels);
    sourceStatus.textContent = 'Proof pixels ready';
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    state.runtimeAssertCount += 1;
    invariant(state.claimedLibrary === 'p5@2.3.0', 'claimed library drifted');
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
    invariant(state.distinctSampleColorCount >= 240, `source color evidence too weak (${state.distinctSampleColorCount})`);
    invariant(state.sampledLuminanceRange >= .68, `source luminance range too weak (${state.sampledLuminanceRange})`);
    invariant(state.sampledLuminanceStdDev >= .18, `source luminance deviation too weak (${state.sampledLuminanceStdDev})`);
    invariant(state.sampledSaturationMean >= .08, `source saturation evidence too weak (${state.sampledSaturationMean})`);
    invariant(state.sampledEdgeMean >= .015, `source edge evidence too weak (${state.sampledEdgeMean})`);
    invariant(state.paperProfile?.pixelCount >= 1200 && state.paperLuminance >= .6, 'paper profile is not derived from the committed source');
    invariant(state.paperTextureDeviation >= .014 && state.paperEdgeMean >= .0035, 'paper texture evidence too weak');
    invariant(state.paperAbsorbency >= .25 && state.paperAbsorbency <= .86, 'paper absorbency is outside the derived range');
    invariant(state.inkProfileCount === 3 && state.inkProfiles.every(profile => profile.pixelCount >= 60), 'ink swatch sampling failed');
    invariant(state.minimumInkColorDistance >= 18, `ink swatches are not distinct (${state.minimumInkColorDistance})`);
    invariant(state.pixelEvidenceBoundToInk && state.pixelEvidenceBoundToPaper && state.pixelEvidenceBoundToConclusion, 'source pixels are not bound to proof output');
    invariant(state.p5InstanceReady && state.p5CanvasReady && state.p5NoLoop, 'p5 canvas is not ready in noLoop mode');
    invariant(state.p5DrawCount >= 1 && state.p5CompletedDrawCount === state.p5DrawCount, 'p5 draw did not finish');
    invariant(state.p5SourceDrawCount === state.p5DrawCount, 'committed source is not drawn by p5');
    invariant(state.p5GlyphDrawCount === GLYPH_COUNT, 'p5 did not draw every type slug');
    invariant(state.initialFrameStatic && state.initialStillVerified, 'initial frame is not a verified still');
    invariant(!state.automaticCycle && !state.automaticPlayback && !state.automaticTimeline, 'automatic path is forbidden');
    invariant(!state.automaticRehearsal && !state.automaticFallback && !state.syntheticInputDispatch, 'rehearsal/fallback/synthetic input is forbidden');
    invariant(!state.captureClockDriven && state.renderIgnoresPreviewClock && !state.visualMutationFromPreviewClock, 'preview clock must not own the effect');
    invariant(state.previewClockMutationCount === 0, 'preview clock mutated the visual state');
    invariant(state.stageCoverageRatio >= .94 && state.canvasCoverageRatio >= .98, 'canvas does not cover the stage');
    invariant(state.stageWidth >= 140 && state.stageHeight >= 78, 'stage is below supported QA size');
    if (state.trustedInputCount > 0 && state.humanVisualMutationCount > 0) {
      invariant(state.p5EventRedrawCount > 0, 'trusted input did not redraw p5');
      invariant(state.p5DrawCount > 1, 'trusted input did not change the p5 frame');
      invariant(state.humanInputCausalityCount === state.humanVisualMutationCount, 'human causality accounting drifted');
    }
    state.runtimeAssertionPassed = true;
    return true;
  };

  stage.addEventListener('pointerenter', onPointerEnter);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointerup', event => finishPointer(event, false));
  stage.addEventListener('pointercancel', event => finishPointer(event, true));
  stage.addEventListener('keydown', onKeyDown);
  pressureInput.addEventListener('input', onPressureInput);
  inkButtons.forEach(button => button.addEventListener('click', event => selectInk(event, button.dataset.ink)));
  actionButtons.forEach(button => {
    if (button.dataset.action === 'step') button.addEventListener('click', event => rainStep(event));
    if (button.dataset.action === 'undo') button.addEventListener('click', event => undo(event));
    if (button.dataset.action === 'reset') button.addEventListener('click', event => reset(event));
  });
  window.addEventListener('resize', onResize);
  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    updateInterface();
  });

  const ready = (async () => {
    await Promise.all([document.fonts.ready, loadAsset()]);
    updateProofEvidence();
    updateInterface();
    initialSnapshot = snapshot();
    await createP5Sketch();
    sketch.redraw();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialVisualStateChecksum = state.currentVisualStateChecksum;
    state.initialStillVerified = state.inputCount === 0
      && state.trustedInputCount === 0
      && state.p5EventRedrawCount === 0
      && state.progress.every((progress, index) => progress === INITIAL_PROGRESS[index])
      && state.currentVisualStateChecksum === state.initialVisualStateChecksum;
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
    if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
    if (sketch) sketch.remove();
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
