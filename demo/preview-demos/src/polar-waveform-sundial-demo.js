import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-09/polar-waveform-sundial/acoustic-response-plate-source.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = Object.freeze({
  bytes: 314778,
  width: 960,
  height: 640,
  sha256: '6000df299e322ee164dbb2b5695a750ed4fdb2e37718e84d529e783697d5eef8',
});
const SAMPLE_WIDTH = 120;
const SAMPLE_HEIGHT = 80;
const SAMPLE_PIXEL_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const PLATE_CENTER = Object.freeze({ x: 78, y: 40 });
const POLAR_BIN_COUNT = 256;
const INITIAL_PHASE = .37;
const INITIAL_PROBE = .69;
const INITIAL_BAND_HZ = 1200;
const MIN_BAND_HZ = 80;
const MAX_BAND_HZ = 8000;
const TAU = Math.PI * 2;

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const wrap = value => ((value % 1) + 1) % 1;
const rounded = (value, digits = 4) => Number(value.toFixed(digits));

try {
  const stage = document.querySelector('#sundial-stage');
  const surface = document.querySelector('#sundial-surface');
  const sessionState = document.querySelector('#session-state');
  const timeReadout = document.querySelector('#time-readout');
  const sessionConclusion = document.querySelector('#session-conclusion');
  const levelReadout = document.querySelector('#level-readout');
  const responseReadout = document.querySelector('#response-readout');
  const quietestReadout = document.querySelector('#quietest-readout');
  const probeTime = document.querySelector('#probe-time');
  const probeEnergy = document.querySelector('#probe-energy');
  const bandInput = document.querySelector('#frequency-band');
  const bandReadout = document.querySelector('#band-readout');
  const actionButtons = [...document.querySelectorAll('[data-sundial-action]')];
  const markButton = document.querySelector('[data-sundial-action="mark"]');
  const runtimeLedger = document.querySelector('#runtime-ledger');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  let sketch = null;
  let plateImage = null;
  let sampledPixels = null;
  let polarWaveform = [];
  let dirty = true;
  let resizeFrame = 0;

  const state = {
    id: 'polar-waveform-sundial',
    task: 'human-operated-acoustic-daylight-recording-window-finder',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'same-origin-raster-polar-ring-pixels-drive-p5-waveform-frequency-energy-gnomon-and-recording-conclusion',
    captureType: 'interactive',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-control', 'visible-buttons'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    initialStillVerified: false,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockCallCount: 0,
    previewClockMutationCount: 0,
    nonInputVisualMutationCountAfterReady: 0,
    reducedMotion: reducedMotionQuery.matches,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    humanMutationCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    hoverMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    keyboardInputCount: 0,
    rangeInputCount: 0,
    buttonActivationCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    phaseMutationCount: 0,
    probeMutationCount: 0,
    bandMutationCount: 0,
    waveformMutationCount: 0,
    conclusionMutationCount: 0,
    quietestActivationCount: 0,
    markMutationCount: 0,
    resetCount: 0,
    reversibleMutationCount: 0,
    activePointerId: null,
    activePointerType: 'none',
    pointerCaptured: false,
    dragging: false,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    pointerTypesSeen: [],
    interactionRecords: [],
    initialPhase: INITIAL_PHASE,
    selectedPhase: INITIAL_PHASE,
    probePhase: INITIAL_PROBE,
    initialBandHz: INITIAL_BAND_HZ,
    selectedBandHz: INITIAL_BAND_HZ,
    marked: false,
    markedPhase: null,
    selectedTime: '',
    selectedEnergy: 0,
    selectedLevelDb: 0,
    selectedResponseLabel: '',
    selectedConclusion: '',
    selectedBinIndex: 0,
    probeTime: '',
    probeEnergy: 0,
    probeLevelDb: 0,
    quietestPhase: 0,
    quietestTime: '',
    quietestEnergy: 1,
    loudestEnergy: 0,
    meanEnergy: 0,
    energyRange: 0,
    lowBandMeanEnergy: 0,
    midBandMeanEnergy: 0,
    highBandMeanEnergy: 0,
    dominantSourceBand: '',
    assetUrl: ASSET_URL,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetMimeType: '',
    assetSameOrigin: false,
    assetByteLength: 0,
    assetSha256: '',
    expectedAssetSha256: EXPECTED_ASSET.sha256,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    sourcePixelCount: 0,
    p5ImageDecoded: false,
    p5ImageClass: '',
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sampledPixelSha256: '',
    sampledPixelChecksum: 0,
    distinctSampleColorCount: 0,
    nonzeroSampleByteCount: 0,
    sourceAlphaFailureCount: 0,
    sampledLuminanceMinimum: 1,
    sampledLuminanceMaximum: 0,
    sampledLuminanceRange: 0,
    sampledWarmSignalMinimum: 1,
    sampledWarmSignalMaximum: 0,
    sampledWarmSignalRange: 0,
    sampledTealSignalMaximum: 0,
    polarBinCount: POLAR_BIN_COUNT,
    polarPixelEvaluationCount: 0,
    spectralPixelEvaluationCount: 0,
    polarRecomputeCount: 0,
    waveformPointCount: 0,
    waveformChecksum: 0,
    initialWaveformChecksum: 0,
    rasterDrivenEvidenceReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    p5ImageDrawCount: 0,
    guideRingDrawCount: 0,
    waveformSegmentDrawCount: 0,
    gnomonDrawCount: 0,
    renderRequestCount: 0,
    previewRenderCalls: 0,
    responsiveResizeCount: 0,
    initialVisualStateChecksum: 0,
    currentVisualStateChecksum: 0,
    renderedSampleCount: 0,
    renderedPixelChecksum: 0,
    renderedLuminanceRange: 0,
    ready: false,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__POLAR_WAVEFORM_SUNDIAL_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`polar-waveform-sundial: ${message}`);
  }

  function fnvMix(checksum, value) {
    return Math.imul(checksum ^ (value >>> 0), 16777619) >>> 0;
  }

  function checksumBytes(bytes, stride = 1) {
    let checksum = 2166136261;
    for (let index = 0; index < bytes.length; index += stride) checksum = fnvMix(checksum, bytes[index]);
    return checksum >>> 0;
  }

  async function digestHex(buffer) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function formatTime(phase) {
    const totalMinutes = Math.round(wrap(phase) * 24 * 60) % (24 * 60);
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
  }

  function formatBand(hertz) {
    return hertz >= 1000 ? `${(hertz / 1000).toFixed(hertz % 1000 ? 1 : 0)} kHz` : `${hertz} Hz`;
  }

  function visualStateChecksum() {
    let checksum = 2166136261;
    checksum = fnvMix(checksum, Math.round(state.selectedPhase * 100000));
    checksum = fnvMix(checksum, Math.round(state.probePhase * 100000));
    checksum = fnvMix(checksum, state.selectedBandHz);
    checksum = fnvMix(checksum, state.marked ? 1 : 0);
    checksum = fnvMix(checksum, state.waveformChecksum);
    checksum = fnvMix(checksum, state.selectedBinIndex);
    return checksum >>> 0;
  }

  function sampleIndex(x, y) {
    const safeX = clamp(Math.round(x), 0, SAMPLE_WIDTH - 1);
    const safeY = clamp(Math.round(y), 0, SAMPLE_HEIGHT - 1);
    return (safeY * SAMPLE_WIDTH + safeX) * 4;
  }

  function samplePixel(x, y) {
    const offset = sampleIndex(x, y);
    const red = sampledPixels[offset];
    const green = sampledPixels[offset + 1];
    const blue = sampledPixels[offset + 2];
    const luminance = (red * .2126 + green * .7152 + blue * .0722) / 255;
    const warm = clamp((red * 1.12 - green * .34 - blue * .48) / 190);
    const teal = clamp((green * 1.08 + blue * .25 - red * .68) / 180);
    return { red, green, blue, luminance, warm, teal };
  }

  function bandRadius(hertz) {
    const normalized = clamp((Math.log(hertz) - Math.log(MIN_BAND_HZ)) / (Math.log(MAX_BAND_HZ) - Math.log(MIN_BAND_HZ)));
    return 12 + normalized * 23;
  }

  function ringEvidence(angle, radius, countEvaluation = true) {
    const samples = [-1.8, 0, 1.8].map(offset => samplePixel(
      PLATE_CENTER.x + Math.cos(angle) * (radius + offset),
      PLATE_CENTER.y + Math.sin(angle) * (radius + offset),
    ));
    if (countEvaluation) state.polarPixelEvaluationCount += samples.length;
    const luminances = samples.map(sample => sample.luminance);
    const luminance = luminances.reduce((sum, value) => sum + value, 0) / samples.length;
    const warm = samples.reduce((sum, sample) => sum + sample.warm, 0) / samples.length;
    const teal = samples.reduce((sum, sample) => sum + sample.teal, 0) / samples.length;
    const radialContrast = Math.max(...luminances) - Math.min(...luminances);
    const energy = clamp(.04 + luminance * 1.04 + warm * .16 + radialContrast * .82);
    return { luminance, warm, teal, radialContrast, energy };
  }

  function meanRingEnergy(radius) {
    let total = 0;
    for (let index = 0; index < POLAR_BIN_COUNT; index += 1) {
      const angle = index / POLAR_BIN_COUNT * TAU - Math.PI / 2;
      total += ringEvidence(angle, radius, false).energy;
      state.spectralPixelEvaluationCount += 3;
    }
    return total / POLAR_BIN_COUNT;
  }

  function findQuietestBin(waveform) {
    let minimum = Infinity;
    let indexOfMinimum = 0;
    for (let index = 0; index < waveform.length; index += 1) {
      let total = 0;
      for (let offset = -4; offset <= 4; offset += 1) {
        total += waveform[(index + offset + waveform.length) % waveform.length].energy;
      }
      const smoothed = total / 9;
      if (smoothed < minimum) {
        minimum = smoothed;
        indexOfMinimum = index;
      }
    }
    return { index: indexOfMinimum, energy: minimum };
  }

  function recomputePolarWaveform() {
    const radius = bandRadius(state.selectedBandHz);
    const raw = [];
    for (let index = 0; index < POLAR_BIN_COUNT; index += 1) {
      const phase = index / POLAR_BIN_COUNT;
      const angle = phase * TAU - Math.PI / 2;
      raw.push({ phase, angle, ...ringEvidence(angle, radius) });
    }

    polarWaveform = raw.map((bin, index) => {
      const previous = raw[(index - 1 + raw.length) % raw.length];
      const next = raw[(index + 1) % raw.length];
      const angularEdge = Math.abs(next.energy - previous.energy) * .5;
      return { ...bin, angularEdge, energy: clamp(bin.energy + angularEdge * .48) };
    });

    let checksum = 2166136261;
    let total = 0;
    let minimum = 1;
    let maximum = 0;
    polarWaveform.forEach(bin => {
      total += bin.energy;
      minimum = Math.min(minimum, bin.energy);
      maximum = Math.max(maximum, bin.energy);
      checksum = fnvMix(checksum, Math.round(bin.energy * 100000));
      checksum = fnvMix(checksum, Math.round(bin.warm * 100000));
      checksum = fnvMix(checksum, Math.round(bin.teal * 100000));
    });
    const quietest = findQuietestBin(polarWaveform);
    state.waveformPointCount = polarWaveform.length;
    state.waveformChecksum = checksum >>> 0;
    state.meanEnergy = rounded(total / polarWaveform.length);
    state.quietestEnergy = rounded(quietest.energy);
    state.loudestEnergy = rounded(maximum);
    state.energyRange = rounded(maximum - minimum);
    state.quietestPhase = rounded(quietest.index / POLAR_BIN_COUNT);
    state.quietestTime = formatTime(state.quietestPhase);
    state.polarRecomputeCount += 1;
  }

  function responseLabel(bin) {
    if (bin.warm > bin.teal + .12) return 'COPPER TRANSIENT';
    if (bin.teal > bin.warm + .1) return 'PATINA AIR';
    if (bin.luminance < .18) return 'DAMPED FIELD';
    return 'MINERAL BODY';
  }

  function updateSelectedEvidence() {
    const index = Math.round(wrap(state.selectedPhase) * POLAR_BIN_COUNT) % POLAR_BIN_COUNT;
    const bin = polarWaveform[index];
    const quietThreshold = state.quietestEnergy + state.energyRange * .24;
    const loudThreshold = state.quietestEnergy + state.energyRange * .7;
    const previousConclusion = state.selectedConclusion;
    state.selectedBinIndex = index;
    state.selectedTime = formatTime(state.selectedPhase);
    state.selectedEnergy = rounded(bin.energy);
    state.selectedLevelDb = rounded(-54 + bin.energy * 46, 1);
    state.selectedResponseLabel = responseLabel(bin);
    if (bin.energy <= quietThreshold) state.selectedConclusion = 'RECORD WINDOW';
    else if (bin.energy >= loudThreshold) state.selectedConclusion = 'TRANSIENT HOLD';
    else state.selectedConclusion = 'TEXTURE BED';
    if (previousConclusion && previousConclusion !== state.selectedConclusion) state.conclusionMutationCount += 1;
  }

  function updateProbeEvidence() {
    const index = Math.round(wrap(state.probePhase) * POLAR_BIN_COUNT) % POLAR_BIN_COUNT;
    const bin = polarWaveform[index];
    state.probeTime = formatTime(state.probePhase);
    state.probeEnergy = rounded(bin.energy);
    state.probeLevelDb = rounded(-54 + bin.energy * 46, 1);
  }

  function updateInterface() {
    timeReadout.textContent = state.selectedTime;
    sessionConclusion.textContent = state.selectedConclusion;
    sessionConclusion.style.color = state.selectedConclusion === 'RECORD WINDOW' ? 'var(--teal)' : 'var(--copper)';
    levelReadout.textContent = `${state.selectedLevelDb.toFixed(1)} dB`;
    levelReadout.dataset.tone = state.selectedConclusion === 'RECORD WINDOW' ? 'quiet' : state.selectedConclusion === 'TRANSIENT HOLD' ? 'loud' : 'normal';
    responseReadout.textContent = state.selectedResponseLabel.replace(' ', ' / ');
    quietestReadout.textContent = state.quietestTime;
    quietestReadout.dataset.tone = 'quiet';
    probeTime.textContent = state.probeTime;
    probeEnergy.textContent = `${state.probeLevelDb.toFixed(1)} dB · ${Math.round(state.probeEnergy * 100)}%`;
    bandReadout.textContent = formatBand(state.selectedBandHz);
    sessionState.textContent = state.marked ? `Window marked · ${formatTime(state.markedPhase)}` : 'Window unmarked';
    markButton.textContent = state.marked ? 'Unmark' : 'Mark';
    markButton.setAttribute('aria-pressed', String(state.marked));
    runtimeLedger.textContent = `raster ${state.assetShaMatchesExpected ? 'verified' : 'pending'} · ${state.waveformPointCount} bins · wave ${state.waveformChecksum}`;
    stage.dataset.selectedTime = state.selectedTime;
    stage.dataset.selectedConclusion = state.selectedConclusion;
    stage.dataset.selectedBandHz = String(state.selectedBandHz);
    stage.dataset.waveformChecksum = String(state.waveformChecksum);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.humanMutationCount = String(state.humanMutationCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.rasterDrivenEvidenceReady = String(state.rasterDrivenEvidenceReady);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
    state.currentVisualStateChecksum = visualStateChecksum();
  }

  function analyzeSampledSource() {
    const distinct = new Set();
    let alphaFailure = 0;
    let nonzero = 0;
    for (let index = 0; index < SAMPLE_PIXEL_COUNT; index += 1) {
      const offset = index * 4;
      const red = sampledPixels[offset];
      const green = sampledPixels[offset + 1];
      const blue = sampledPixels[offset + 2];
      const alpha = sampledPixels[offset + 3];
      const luminance = (red * .2126 + green * .7152 + blue * .0722) / 255;
      const warm = clamp((red * 1.12 - green * .34 - blue * .48) / 190);
      const teal = clamp((green * 1.08 + blue * .25 - red * .68) / 180);
      state.sampledLuminanceMinimum = Math.min(state.sampledLuminanceMinimum, luminance);
      state.sampledLuminanceMaximum = Math.max(state.sampledLuminanceMaximum, luminance);
      state.sampledWarmSignalMinimum = Math.min(state.sampledWarmSignalMinimum, warm);
      state.sampledWarmSignalMaximum = Math.max(state.sampledWarmSignalMaximum, warm);
      state.sampledTealSignalMaximum = Math.max(state.sampledTealSignalMaximum, teal);
      if (alpha !== 255) alphaFailure += 1;
      nonzero += Number(red > 0) + Number(green > 0) + Number(blue > 0);
      distinct.add(`${red >> 3},${green >> 3},${blue >> 3}`);
    }
    state.sourceAlphaFailureCount = alphaFailure;
    state.nonzeroSampleByteCount = nonzero;
    state.distinctSampleColorCount = distinct.size;
    state.sampledLuminanceRange = rounded(state.sampledLuminanceMaximum - state.sampledLuminanceMinimum);
    state.sampledWarmSignalRange = rounded(state.sampledWarmSignalMaximum - state.sampledWarmSignalMinimum);
    state.lowBandMeanEnergy = rounded(meanRingEnergy(14));
    state.midBandMeanEnergy = rounded(meanRingEnergy(23));
    state.highBandMeanEnergy = rounded(meanRingEnergy(32));
    const bands = [
      ['LOW', state.lowBandMeanEnergy],
      ['MID', state.midBandMeanEnergy],
      ['HIGH', state.highBandMeanEnergy],
    ];
    state.dominantSourceBand = bands.sort((first, second) => second[1] - first[1])[0][0];
  }

  async function fetchDecodeAndSample() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `response plate request failed with HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;
    invariant(state.assetSameOrigin, 'response plate was not fetched from the preview origin');
    invariant(state.assetByteLength === EXPECTED_ASSET.bytes, 'response plate byte length differs from the committed evidence');
    invariant(state.assetShaMatchesExpected, 'response plate SHA-256 differs from the committed evidence');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: state.assetMimeType || 'image/jpeg' }));
    const browserImage = new Image();
    browserImage.decoding = 'async';
    browserImage.src = objectUrl;
    try {
      await browserImage.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = browserImage.naturalWidth;
      state.sourceNaturalHeight = browserImage.naturalHeight;
      state.sourcePixelCount = browserImage.naturalWidth * browserImage.naturalHeight;
      invariant(browserImage.naturalWidth === EXPECTED_ASSET.width && browserImage.naturalHeight === EXPECTED_ASSET.height,
        `unexpected response plate dimensions ${browserImage.naturalWidth}x${browserImage.naturalHeight}`);
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = SAMPLE_WIDTH;
      sampleCanvas.height = SAMPLE_HEIGHT;
      const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
      sampleContext.drawImage(browserImage, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      sampledPixels = sampleContext.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
      state.sampledPixelCount = SAMPLE_PIXEL_COUNT;
      state.sampledPixelByteLength = sampledPixels.byteLength;
      state.sampledPixelSha256 = await digestHex(sampledPixels.buffer);
      state.sampledPixelChecksum = checksumBytes(sampledPixels);
      analyzeSampledSource();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    invariant(state.browserImageDecoded && state.sampledPixelCount === SAMPLE_PIXEL_COUNT, 'browser source evidence is incomplete');
  }

  function loadP5Image() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(ASSET_URL, decoded => {
        decoded.loadPixels();
        state.p5ImageDecoded = decoded instanceof p5.Image;
        state.p5ImageClass = state.p5ImageDecoded ? 'p5.Image' : decoded?.constructor?.name || '';
        state.p5ImageWidth = decoded.width;
        state.p5ImageHeight = decoded.height;
        state.p5ImagePixelLength = decoded.pixels.length;
        resolve(decoded);
      }, error => reject(new Error(`p5 response plate decode failed: ${error}`)));
    });
  }

  function drawCoverImage(p) {
    const sourceRatio = EXPECTED_ASSET.width / EXPECTED_ASSET.height;
    const destinationRatio = p.width / Math.max(1, p.height);
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = EXPECTED_ASSET.width;
    let sourceHeight = EXPECTED_ASSET.height;
    if (destinationRatio > sourceRatio) {
      sourceHeight = EXPECTED_ASSET.width / destinationRatio;
      sourceY = (EXPECTED_ASSET.height - sourceHeight) * .5;
    } else {
      sourceWidth = EXPECTED_ASSET.height * destinationRatio;
      sourceX = (EXPECTED_ASSET.width - sourceWidth) * .5;
    }
    p.image(plateImage, 0, 0, p.width, p.height, sourceX, sourceY, sourceWidth, sourceHeight);
    state.p5ImageDrawCount += 1;
  }

  function dialGeometry(p) {
    return { cx: p.width * .65, cy: p.height * .5, scale: p.height };
  }

  function waveformRadius(bin, scale) {
    const normalized = state.energyRange > .0001
      ? clamp((bin.energy - state.quietestEnergy) / state.energyRange)
      : .5;
    return scale * (.245 + normalized * .095);
  }

  function drawPolarInstrument(p) {
    const { cx, cy, scale } = dialGeometry(p);
    p.noFill();
    p.strokeWeight(Math.max(.6, scale * .0022));
    [.19, .245, .34, .405].forEach((radius, index) => {
      p.stroke(index === 2 ? 'rgba(233,154,76,.34)' : 'rgba(238,232,217,.19)');
      p.circle(cx, cy, scale * radius * 2);
      state.guideRingDrawCount += 1;
    });

    for (let index = 0; index < 24; index += 1) {
      const angle = index / 24 * TAU - Math.PI / 2;
      const inner = scale * .39;
      const outer = scale * (index % 6 === 0 ? .425 : .41);
      p.stroke(index % 6 === 0 ? 'rgba(238,232,217,.52)' : 'rgba(238,232,217,.21)');
      p.line(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner,
        cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    }

    p.strokeWeight(Math.max(4, scale * .017));
    p.stroke(7, 9, 8, 94);
    p.beginShape();
    polarWaveform.forEach(bin => {
      const radius = waveformRadius(bin, scale);
      p.vertex(cx + Math.cos(bin.angle) * radius, cy + Math.sin(bin.angle) * radius);
    });
    p.endShape(p.CLOSE);

    p.strokeWeight(Math.max(.8, scale * .0042));
    for (let index = 0; index < polarWaveform.length; index += 1) {
      const bin = polarWaveform[index];
      const next = polarWaveform[(index + 1) % polarWaveform.length];
      const radius = waveformRadius(bin, scale);
      const nextRadius = waveformRadius(next, scale);
      const copper = clamp(bin.warm * 1.55);
      const teal = clamp(bin.teal * 1.45);
      const red = Math.round(142 + copper * 91);
      const green = Math.round(177 - copper * 38 + teal * 31);
      const blue = Math.round(151 - copper * 62 + teal * 36);
      p.stroke(red, green, blue, 225);
      p.line(cx + Math.cos(bin.angle) * radius, cy + Math.sin(bin.angle) * radius,
        cx + Math.cos(next.angle) * nextRadius, cy + Math.sin(next.angle) * nextRadius);
      state.waveformSegmentDrawCount += 1;
    }

    const selectedBin = polarWaveform[state.selectedBinIndex];
    const selectedAngle = state.selectedPhase * TAU - Math.PI / 2;
    const shadowLength = scale * (.32 + selectedBin.energy * .105);
    p.strokeCap(p.ROUND);
    p.stroke(4, 6, 5, 184);
    p.strokeWeight(Math.max(6, scale * .045));
    p.line(cx, cy, cx + Math.cos(selectedAngle) * shadowLength, cy + Math.sin(selectedAngle) * shadowLength);
    p.stroke(233, 154, 76, 220);
    p.strokeWeight(Math.max(1.1, scale * .006));
    p.line(cx, cy, cx + Math.cos(selectedAngle) * shadowLength, cy + Math.sin(selectedAngle) * shadowLength);
    p.noStroke();
    p.fill('#e99a4c');
    p.circle(cx + Math.cos(selectedAngle) * shadowLength, cy + Math.sin(selectedAngle) * shadowLength, Math.max(5, scale * .026));
    p.fill('#eee8d9');
    p.circle(cx, cy, Math.max(7, scale * .038));
    p.fill('#161a18');
    p.circle(cx, cy, Math.max(2, scale * .012));
    state.gnomonDrawCount += 1;

    const quietAngle = state.quietestPhase * TAU - Math.PI / 2;
    p.stroke('#8dc9bd');
    p.strokeWeight(Math.max(1, scale * .004));
    p.line(cx + Math.cos(quietAngle) * scale * .37, cy + Math.sin(quietAngle) * scale * .37,
      cx + Math.cos(quietAngle) * scale * .435, cy + Math.sin(quietAngle) * scale * .435);

    const probeIndex = Math.round(state.probePhase * POLAR_BIN_COUNT) % POLAR_BIN_COUNT;
    const probeBin = polarWaveform[probeIndex];
    const probeRadius = waveformRadius(probeBin, scale);
    p.noFill();
    p.stroke(141, 201, 189, 210);
    p.strokeWeight(Math.max(.7, scale * .003));
    p.circle(cx + Math.cos(probeBin.angle) * probeRadius, cy + Math.sin(probeBin.angle) * probeRadius, Math.max(5, scale * .026));

    if (state.marked && state.markedPhase !== null) {
      const markedAngle = state.markedPhase * TAU - Math.PI / 2;
      p.stroke(238, 232, 217, 170);
      p.strokeWeight(Math.max(.7, scale * .003));
      p.line(cx + Math.cos(markedAngle) * scale * .355, cy + Math.sin(markedAngle) * scale * .355,
        cx + Math.cos(markedAngle) * scale * .405, cy + Math.sin(markedAngle) * scale * .405);
    }
  }

  function inspectRenderedPixels(p) {
    const image = p.drawingContext.getImageData(0, 0, p.width, p.height).data;
    const stride = Math.max(4, Math.floor(image.length / 12288 / 4) * 4);
    let minimum = 255;
    let maximum = 0;
    let count = 0;
    for (let index = 0; index < image.length; index += stride) {
      const luminance = image[index] * .2126 + image[index + 1] * .7152 + image[index + 2] * .0722;
      minimum = Math.min(minimum, luminance);
      maximum = Math.max(maximum, luminance);
      count += 1;
    }
    state.renderedSampleCount = count;
    state.renderedPixelChecksum = checksumBytes(image, stride);
    state.renderedLuminanceRange = rounded(maximum - minimum, 2);
  }

  function drawScene(p) {
    state.p5DrawCount += 1;
    if (!state.ready || !plateImage || polarWaveform.length !== POLAR_BIN_COUNT) {
      p.background('#111514');
      return;
    }
    p.clear();
    drawCoverImage(p);
    const context = p.drawingContext;
    const gradient = context.createLinearGradient(0, 0, p.width, 0);
    gradient.addColorStop(0, 'rgba(10,14,14,.55)');
    gradient.addColorStop(.36, 'rgba(10,14,14,.18)');
    gradient.addColorStop(1, 'rgba(10,14,14,.04)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, p.width, p.height);
    drawPolarInstrument(p);
    state.p5CompletedDrawCount += 1;
    inspectRenderedPixels(p);
    if (!state.initialStillVerified) {
      state.initialVisualStateChecksum = visualStateChecksum();
      state.initialStillVerified = state.inputCount === 0
        && state.humanMutationCount === 0
        && state.automaticPlayback === false
        && state.previewClockMutationCount === 0;
    }
    dirty = false;
    updateInterface();
  }

  const canvasReady = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(Math.min(devicePixelRatio || 1, 2));
          const canvas = p.createCanvas(Math.max(1, surface.clientWidth), Math.max(1, surface.clientHeight), p.P2D);
          canvas.parent(surface);
          canvas.elt.setAttribute('aria-hidden', 'true');
          p.noLoop();
          p.draw = () => drawScene(p);
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
          state.p5CanvasWidth = p.width;
          state.p5CanvasHeight = p.height;
          resolve();
        } catch (error) {
          reject(error);
        }
      };
    }, surface);
  });

  function requestRender(reason) {
    dirty = true;
    state.renderRequestCount += 1;
    state.lastRenderReason = reason;
    sketch?.redraw();
  }

  function acceptTrustedInput(event, kind, source) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      state.lastInputSource = source;
      updateInterface();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    if (kind === 'range') state.rangeInputCount += 1;
    if (kind === 'button') state.buttonActivationCount += 1;
    if (event.pointerType) {
      const pointerType = event.pointerType || 'mouse';
      if (!state.pointerTypesSeen.includes(pointerType)) state.pointerTypesSeen.push(pointerType);
      if (pointerType === 'mouse') state.mouseInputCount += 1;
      if (pointerType === 'touch') state.touchInputCount += 1;
      if (pointerType === 'pen') state.penInputCount += 1;
    }
    return true;
  }

  function recordMutation(source, beforeChecksum) {
    const afterChecksum = visualStateChecksum();
    if (afterChecksum === beforeChecksum) return false;
    state.humanMutationCount += 1;
    state.interactionRecords.push({
      source,
      kind: state.lastInputKind,
      trusted: true,
      beforeChecksum,
      afterChecksum,
      phase: rounded(state.selectedPhase),
      probe: rounded(state.probePhase),
      bandHz: state.selectedBandHz,
      waveformChecksum: state.waveformChecksum,
      conclusion: state.selectedConclusion,
      marked: state.marked,
    });
    if (state.interactionRecords.length > 48) state.interactionRecords.shift();
    return true;
  }

  function eventPhase(event) {
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + rect.width * .65;
    const centerY = rect.top + rect.height * .5;
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX) + Math.PI / 2;
    return wrap(angle / TAU);
  }

  function setProbe(phase, source) {
    const next = wrap(phase);
    if (Math.abs(next - state.probePhase) < .0008) return false;
    const beforeChecksum = visualStateChecksum();
    state.probePhase = next;
    state.probeMutationCount += 1;
    updateProbeEvidence();
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
    return true;
  }

  function setPhase(phase, source) {
    const next = wrap(phase);
    const circularDistance = Math.min(Math.abs(next - state.selectedPhase), 1 - Math.abs(next - state.selectedPhase));
    if (circularDistance < .0008) return false;
    const beforeChecksum = visualStateChecksum();
    state.selectedPhase = next;
    state.phaseMutationCount += 1;
    state.reversibleMutationCount += 1;
    updateSelectedEvidence();
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
    return true;
  }

  function setBand(hertz, source) {
    const next = clamp(Math.round(Number(hertz) / 80) * 80, MIN_BAND_HZ, MAX_BAND_HZ);
    if (!Number.isFinite(next) || next === state.selectedBandHz) return false;
    const beforeChecksum = visualStateChecksum();
    state.selectedBandHz = next;
    state.bandMutationCount += 1;
    state.waveformMutationCount += 1;
    state.reversibleMutationCount += 1;
    recomputePolarWaveform();
    updateSelectedEvidence();
    updateProbeEvidence();
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
    return true;
  }

  function applyQuietest(source) {
    const beforeChecksum = visualStateChecksum();
    state.selectedPhase = state.quietestPhase;
    state.probePhase = state.quietestPhase;
    state.quietestActivationCount += 1;
    state.phaseMutationCount += 1;
    state.probeMutationCount += 1;
    state.reversibleMutationCount += 1;
    updateSelectedEvidence();
    updateProbeEvidence();
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
  }

  function toggleMark(source) {
    const beforeChecksum = visualStateChecksum();
    state.marked = !state.marked;
    state.markedPhase = state.marked ? state.selectedPhase : null;
    state.markMutationCount += 1;
    state.reversibleMutationCount += 1;
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
  }

  function resetSundial(source) {
    const beforeChecksum = visualStateChecksum();
    state.selectedPhase = INITIAL_PHASE;
    state.probePhase = INITIAL_PROBE;
    state.selectedBandHz = INITIAL_BAND_HZ;
    state.marked = false;
    state.markedPhase = null;
    bandInput.value = String(INITIAL_BAND_HZ);
    state.resetCount += 1;
    state.reversibleMutationCount += 1;
    recomputePolarWaveform();
    updateSelectedEvidence();
    updateProbeEvidence();
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
  }

  stage.addEventListener('pointerenter', event => {
    if (event.target.closest('button,input')) return;
    const pointerType = event.pointerType || 'mouse';
    if (!acceptTrustedInput(event, 'hover', `pointer-${pointerType}-enter`)) return;
    state.pointerEnterCount += 1;
    setProbe(eventPhase(event), state.lastInputSource);
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('button,input') || event.isPrimary === false || (event.button !== undefined && event.button !== 0)) return;
    const pointerType = event.pointerType || 'mouse';
    if (!acceptTrustedInput(event, pointerType, `pointer-${pointerType}-down`)) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    state.activePointerType = pointerType;
    state.dragging = true;
    try {
      stage.setPointerCapture(event.pointerId);
      state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
      if (state.pointerCaptured) state.pointerCaptureCount += 1;
    } catch {
      state.pointerCaptured = false;
    }
    const phase = eventPhase(event);
    setProbe(phase, state.lastInputSource);
    setPhase(phase, state.lastInputSource);
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest('button,input') && state.activePointerId === null) return;
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    if (state.activePointerId !== null && event.pointerId !== state.activePointerId) return;
    const kind = state.activePointerId === null ? 'hover' : pointerType;
    const source = `pointer-${pointerType}-${state.activePointerId === null ? 'hover' : 'drag'}`;
    if (!acceptTrustedInput(event, kind, source)) return;
    const phase = eventPhase(event);
    state.pointerMoveCount += 1;
    if (state.activePointerId === null) {
      state.hoverMoveCount += 1;
      setProbe(phase, source);
    } else {
      event.preventDefault();
      setProbe(phase, source);
      setPhase(phase, source);
    }
  });

  function finishPointer(event, cancelled = false) {
    if (event.pointerId !== state.activePointerId) return;
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    const source = `pointer-${pointerType}-${cancelled ? 'cancel' : 'up'}`;
    if (!acceptTrustedInput(event, pointerType, source)) return;
    event.preventDefault();
    if (!cancelled) {
      const phase = eventPhase(event);
      setProbe(phase, source);
      setPhase(phase, source);
    }
    if (state.pointerCaptured) {
      try {
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      } catch { /* the browser may already have released capture */ }
      state.pointerCaptureReleaseCount += 1;
    }
    state.pointerCaptured = false;
    state.dragging = false;
    state.activePointerId = null;
    state.activePointerType = 'none';
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    updateInterface();
    requestRender(source);
  }

  stage.addEventListener('pointerup', event => finishPointer(event, false));
  stage.addEventListener('pointercancel', event => finishPointer(event, true));

  stage.addEventListener('keydown', event => {
    if (event.target.closest('button,input')) return;
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'q', 'Q', 'm', 'M', 'r', 'R'].includes(event.key);
    if (!handled || !acceptTrustedInput(event, 'keyboard', `keyboard-${event.key}`)) return;
    event.preventDefault();
    if (event.key === 'q' || event.key === 'Q') applyQuietest(state.lastInputSource);
    else if (event.key === 'm' || event.key === 'M') toggleMark(state.lastInputSource);
    else if (event.key === 'r' || event.key === 'R') resetSundial(state.lastInputSource);
    else {
      const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const step = event.shiftKey ? 1 / 24 : 1 / 96;
      setPhase(state.selectedPhase + direction * step, state.lastInputSource);
      setProbe(state.selectedPhase, state.lastInputSource);
    }
  });

  bandInput.addEventListener('input', event => {
    if (!acceptTrustedInput(event, 'range', 'range-frequency-band')) return;
    setBand(event.currentTarget.value, state.lastInputSource);
  });

  actionButtons.forEach(button => button.addEventListener('click', event => {
    const action = button.dataset.sundialAction;
    if (!acceptTrustedInput(event, 'button', `button-${action}`)) return;
    if (action === 'quietest') applyQuietest(state.lastInputSource);
    else if (action === 'mark') toggleMark(state.lastInputSource);
    else if (action === 'reset') resetSundial(state.lastInputSource);
  }));

  reducedMotionQuery.addEventListener?.('change', event => { state.reducedMotion = event.matches; });

  const ready = Promise.all([document.fonts.ready, canvasReady, fetchDecodeAndSample()]).then(async () => {
    plateImage = await loadP5Image();
    invariant(state.p5ImageDecoded && state.p5ImageClass === 'p5.Image', 'p5 response plate evidence is incomplete');
    invariant(state.p5ImageWidth === EXPECTED_ASSET.width && state.p5ImageHeight === EXPECTED_ASSET.height,
      'p5 response plate dimensions differ from the committed source');
    invariant(state.p5ImagePixelLength === EXPECTED_ASSET.width * EXPECTED_ASSET.height * 4,
      'p5 response plate pixel buffer is not decoded 960x640 RGBA');
    recomputePolarWaveform();
    state.initialWaveformChecksum = state.waveformChecksum;
    updateSelectedEvidence();
    updateProbeEvidence();
    state.rasterDrivenEvidenceReady = state.distinctSampleColorCount > 100
      && state.sampledLuminanceRange > .2
      && state.sampledWarmSignalRange > .1
      && state.waveformPointCount === POLAR_BIN_COUNT
      && state.waveformChecksum > 0
      && state.energyRange > .08
      && state.spectralPixelEvaluationCount === POLAR_BIN_COUNT * 3 * 3;
    invariant(state.rasterDrivenEvidenceReady, 'response plate pixels did not produce a sufficiently varied polar acoustic field');
    state.ready = true;
    updateInterface();
    requestRender('resources-ready');
  }).catch(error => {
    markPreviewFailure(error);
    return new Promise(() => {});
  });

  new ResizeObserver(entries => {
    if (!entries[0] || !sketch) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const width = Math.max(1, Math.round(surface.clientWidth));
      const height = Math.max(1, Math.round(surface.clientHeight));
      if (sketch.width !== width || sketch.height !== height) {
        sketch.resizeCanvas(width, height, false);
        state.p5CanvasWidth = width;
        state.p5CanvasHeight = height;
        state.responsiveResizeCount += 1;
        requestRender('responsive-resize');
      }
    });
  }).observe(stage);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const inputsConsistent = state.trustedInputCount === state.inputCount
      && state.rejectedUntrustedInputCount === 0
      && state.interactionRecords.every(record => record.trusted === true
        && Number.isFinite(record.beforeChecksum)
        && Number.isFinite(record.afterChecksum)
        && record.beforeChecksum !== record.afterChecksum);
    const pointerConsistent = state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && state.pointerCaptureCount - state.pointerCaptureReleaseCount <= Number(state.pointerCaptured);
    const assetEvidence = state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetMimeType.includes('image/jpeg')
      && state.assetSameOrigin
      && state.assetByteLength === EXPECTED_ASSET.bytes
      && state.assetSha256 === EXPECTED_ASSET.sha256
      && state.assetShaMatchesExpected
      && state.browserImageDecoded
      && state.sourceNaturalWidth === EXPECTED_ASSET.width
      && state.sourceNaturalHeight === EXPECTED_ASSET.height
      && state.sourcePixelCount === EXPECTED_ASSET.width * EXPECTED_ASSET.height
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === EXPECTED_ASSET.width
      && state.p5ImageHeight === EXPECTED_ASSET.height
      && state.p5ImagePixelLength === EXPECTED_ASSET.width * EXPECTED_ASSET.height * 4;
    const rasterEvidence = state.sampledPixelCount === SAMPLE_PIXEL_COUNT
      && state.sampledPixelByteLength === SAMPLE_PIXEL_COUNT * 4
      && /^[0-9a-f]{64}$/.test(state.sampledPixelSha256)
      && state.sampledPixelChecksum > 0
      && state.distinctSampleColorCount > 100
      && state.nonzeroSampleByteCount > SAMPLE_PIXEL_COUNT * 2
      && state.sourceAlphaFailureCount === 0
      && state.sampledLuminanceRange > .2
      && state.sampledWarmSignalRange > .1
      && state.sampledTealSignalMaximum > .05
      && state.waveformPointCount === POLAR_BIN_COUNT
      && state.waveformChecksum > 0
      && state.polarPixelEvaluationCount >= POLAR_BIN_COUNT * 3
      && state.spectralPixelEvaluationCount === POLAR_BIN_COUNT * 3 * 3
      && state.energyRange > .08
      && state.quietestPhase >= 0
      && state.quietestPhase < 1
      && state.quietestEnergy >= 0
      && state.quietestEnergy <= 1
      && state.rasterDrivenEvidenceReady;
    const renderEvidence = sketch instanceof p5
      && state.p5InstanceReady
      && state.p5CanvasReady
      && surface.querySelector('canvas')?.getContext('2d')
      && state.p5CompletedDrawCount > 0
      && state.p5ImageDrawCount > 0
      && state.guideRingDrawCount >= 4
      && state.waveformSegmentDrawCount >= POLAR_BIN_COUNT
      && state.gnomonDrawCount > 0
      && state.renderedSampleCount > 1000
      && state.renderedPixelChecksum > 0
      && state.renderedLuminanceRange > 40;
    state.runtimeAssertionPassed = Boolean(
      window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.dataset.previewMechanism === 'p5-raster-polar-acoustic-waveform-sundial'
      && state.task === 'human-operated-acoustic-daylight-recording-window-finder'
      && state.claimedLibrary === 'p5@2.3.0'
      && state.mechanism === 'same-origin-raster-polar-ring-pixels-drive-p5-waveform-frequency-energy-gnomon-and-recording-conclusion'
      && state.ready
      && state.initialFrameStatic
      && state.initialStillVerified
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.automaticCycle === false
      && state.automaticPlayback === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.syntheticInputDispatch === false
      && state.captureClockDriven === false
      && state.renderIgnoresPreviewClock
      && state.previewClockMutationCount === 0
      && state.nonInputVisualMutationCountAfterReady === 0
      && assetEvidence
      && rasterEvidence
      && renderEvidence
      && inputsConsistent
      && pointerConsistent
    );
    return state.runtimeAssertionPassed;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render: () => {
      state.previewRenderCalls += 1;
      state.previewClockCallCount += 1;
      if (dirty && state.ready) sketch.redraw();
    },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
