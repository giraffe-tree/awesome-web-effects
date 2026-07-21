import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-09/moire-tunnel-zoom/optical-channel-master.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = Object.freeze({
  byteLength: 270948,
  width: 960,
  height: 640,
  sha256: '08529c25ab1262a8b675f82671859c6febaa3326e7b4d199ae640b2ffd6e6eec',
});
const SOURCE_CROP = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 54;
const SAMPLE_PIXEL_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const SAMPLE_BYTE_LENGTH = SAMPLE_PIXEL_COUNT * 4;
const INITIAL_DEPTH = 8;
const CHANNEL_REGIONS = Object.freeze([
  { id: 'CH-01', label: 'Diagonal field', x0: .055, x1: .31, y0: .12, y1: .88 },
  { id: 'CH-02', label: 'Elliptic field', x0: .31, x1: .51, y0: .12, y1: .88 },
  { id: 'CH-03', label: 'Contour field', x0: .51, x1: .71, y0: .12, y1: .88 },
  { id: 'CH-04', label: 'Crosshatch field', x0: .71, x1: .945, y0: .12, y1: .88 },
]);
const APERTURE_REGION = Object.freeze({ x0: .42, x1: .62, y0: .24, y1: .72 });

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 4) => Number(value.toFixed(digits));
const mix = (from, to, progress) => from + (to - from) * progress;
const luminance = (red, green, blue) => (red * .2126 + green * .7152 + blue * .0722) / 255;

try {
  const stage = document.querySelector('#tunnel-stage');
  const surface = document.querySelector('#moire-surface');
  const sourceImage = document.querySelector('#source-image');
  const evidenceCanvas = document.querySelector('#source-evidence');
  const sourceStatus = document.querySelector('[data-source-status]');
  const channelStatus = document.querySelector('[data-channel-status]');
  const conclusionOutput = document.querySelector('[data-channel-conclusion]');
  const ringsReading = document.querySelector('[data-reading="rings"]');
  const axisReading = document.querySelector('[data-reading="axis"]');
  const riskReading = document.querySelector('[data-reading="risk"]');
  const depthReading = document.querySelector('[data-reading="depth"]');
  const depthInput = document.querySelector('#tunnel-depth');
  const depthOutput = document.querySelector('[data-depth-output]');
  const channelButtons = [...document.querySelectorAll('[data-channel]')];
  const actionButtons = [...document.querySelectorAll('[data-action]')];

  if (!stage || !surface || !sourceImage || !evidenceCanvas || !sourceStatus
    || !channelStatus || !conclusionOutput || !ringsReading || !axisReading
    || !riskReading || !depthReading || !depthInput || !depthOutput
    || channelButtons.length !== 4 || actionButtons.length !== 5) {
    throw new Error('moire-tunnel-zoom: required DOM is incomplete');
  }

  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    id: 'moire-tunnel-zoom',
    task: 'human-operated-pixel-evidenced-optical-channel-inspection',
    claimedLibrary: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'trusted-human-input-scrubs-a-finite-p5-moire-tunnel-over-a-browser-decoded-optical-master',
    assetMechanismRole: 'exact-source-pixels-determine-channel-line-density-ring-count-axis-ellipse-ratio-accent-vanishing-point-risk-and-inspection-conclusion',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-control', 'channel-buttons', 'visible-action-buttons'],
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
    channelButtonInputCount: 0,
    actionButtonInputCount: 0,
    assessmentCount: 0,
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
    dragStartX: 0,
    dragStartDepth: INITIAL_DEPTH,
    selectedChannelIndex: 0,
    selectedChannelId: 'CH-01',
    selectedChannelLabel: 'Diagonal field',
    selectedChannelConclusion: 'AWAIT',
    selectedChannelRisk: 0,
    selectedChannelRingCount: 0,
    depth: INITIAL_DEPTH,
    initialDepth: INITIAL_DEPTH,
    minimumDepth: INITIAL_DEPTH,
    maximumDepth: INITIAL_DEPTH,
    vanishingU: .52,
    vanishingV: .5,
    initialVanishingU: .52,
    initialVanishingV: .5,
    assessedChannels: [false, false, false, false],
    assessedChannelCount: 0,
    historyDepth: 0,
    sourceAssetUrl: ASSET_URL,
    sourceAssetKind: 'built-in-imagegen-fictional-optical-calibration-master',
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
    apertureRegion: { ...APERTURE_REGION },
    apertureCandidateCount: 0,
    apertureCentroidU: 0,
    apertureCentroidV: 0,
    channelProfiles: [],
    channelProfileCount: 0,
    distinctRingCountCount: 0,
    minimumChannelDensityDelta: 0,
    distinctAxisDegreeCount: 0,
    channelAxisDegreeSpan: 0,
    distinctRiskCount: 0,
    profileEvidenceChecksum: '',
    pixelEvidenceBoundToDensity: false,
    pixelEvidenceBoundToVanishingPoint: false,
    pixelEvidenceBoundToConclusion: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5NoLoop: false,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    p5EventRedrawCount: 0,
    p5SourceDrawCount: 0,
    p5TunnelRingDrawCount: 0,
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
  window.__MOIRE_TUNNEL_ZOOM_STATE__ = state;

  let browserImage;
  let sourceObjectUrl = '';
  let sampledPixels;
  let sketch;
  let initialSnapshot;
  let history = [];
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`moire-tunnel-zoom: ${message}`);
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
      checksum ^= value;
      checksum = Math.imul(checksum, 16777619);
    }
    return (checksum >>> 0).toString(16).padStart(8, '0');
  }

  function visualChecksum() {
    return fnvChecksum([
      state.selectedChannelIndex,
      state.depth,
      state.vanishingU,
      state.vanishingV,
      ...state.assessedChannels.map(Boolean),
      ...state.channelProfiles.flatMap(profile => [profile.ringCount, profile.axisDegrees, profile.ellipseRatio, profile.risk]),
    ]);
  }

  function snapshot() {
    return {
      selectedChannelIndex: state.selectedChannelIndex,
      depth: state.depth,
      vanishingU: state.vanishingU,
      vanishingV: state.vanishingV,
      assessedChannels: [...state.assessedChannels],
    };
  }

  function restore(saved) {
    state.selectedChannelIndex = saved.selectedChannelIndex;
    state.depth = saved.depth;
    state.vanishingU = saved.vanishingU;
    state.vanishingV = saved.vanishingV;
    state.assessedChannels = [...saved.assessedChannels];
    state.assessedChannelCount = state.assessedChannels.filter(Boolean).length;
  }

  function pushHistory(saved = snapshot()) {
    history.push(saved);
    if (history.length > 32) history.shift();
    state.historyDepth = history.length;
  }

  function pixelAt(x, y) {
    const sampleX = Math.max(0, Math.min(SAMPLE_WIDTH - 1, Math.floor(x)));
    const sampleY = Math.max(0, Math.min(SAMPLE_HEIGHT - 1, Math.floor(y)));
    const offset = (sampleY * SAMPLE_WIDTH + sampleX) * 4;
    return [sampledPixels[offset], sampledPixels[offset + 1], sampledPixels[offset + 2], sampledPixels[offset + 3]];
  }

  function pixelLuminance(x, y) {
    const [red, green, blue] = pixelAt(x, y);
    return luminance(red, green, blue);
  }

  function analyzeGlobalPixels() {
    const lumas = [];
    const colors = new Set();
    let saturationTotal = 0;
    let opaque = 0;
    let edgeTotal = 0;
    let edgeCount = 0;

    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const [red, green, blue, alpha] = pixelAt(x, y);
        const light = luminance(red, green, blue);
        lumas.push(light);
        colors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
        saturationTotal += (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;
        if (alpha === 255) opaque += 1;
        if (x + 1 < SAMPLE_WIDTH) {
          edgeTotal += Math.abs(light - pixelLuminance(x + 1, y));
          edgeCount += 1;
        }
        if (y + 1 < SAMPLE_HEIGHT) {
          edgeTotal += Math.abs(light - pixelLuminance(x, y + 1));
          edgeCount += 1;
        }
      }
    }

    const mean = lumas.reduce((sum, value) => sum + value, 0) / lumas.length;
    const variance = lumas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / lumas.length;
    state.sampledOpaquePixelCount = opaque;
    state.distinctSampleColorCount = colors.size;
    state.sampledLuminanceMinimum = rounded(Math.min(...lumas));
    state.sampledLuminanceMaximum = rounded(Math.max(...lumas));
    state.sampledLuminanceRange = rounded(state.sampledLuminanceMaximum - state.sampledLuminanceMinimum);
    state.sampledLuminanceMean = rounded(mean);
    state.sampledLuminanceStdDev = rounded(Math.sqrt(variance));
    state.sampledSaturationMean = rounded(saturationTotal / SAMPLE_PIXEL_COUNT);
    state.sampledEdgeMean = rounded(edgeTotal / edgeCount);
  }

  function analyzeAperture() {
    const xStart = Math.floor(APERTURE_REGION.x0 * SAMPLE_WIDTH);
    const xEnd = Math.ceil(APERTURE_REGION.x1 * SAMPLE_WIDTH);
    const yStart = Math.floor(APERTURE_REGION.y0 * SAMPLE_HEIGHT);
    const yEnd = Math.ceil(APERTURE_REGION.y1 * SAMPLE_HEIGHT);
    const candidates = [];

    for (let y = yStart; y < yEnd; y += 1) {
      for (let x = xStart; x < xEnd; x += 1) {
        const [red, green, blue] = pixelAt(x, y);
        const light = luminance(red, green, blue);
        const saturation = (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;
        const localEdge = (
          Math.abs(light - pixelLuminance(x + 1, y))
          + Math.abs(light - pixelLuminance(x, y + 1))
        ) / 2;
        candidates.push({ x, y, light, saturation, localEdge, score: light - saturation * .16 - localEdge * .08 });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const selected = candidates.slice(0, Math.max(8, Math.round(candidates.length * .075)));
    const weightTotal = selected.reduce((sum, candidate) => sum + Math.max(.01, candidate.score), 0);
    const centroidX = selected.reduce((sum, candidate) => sum + candidate.x * Math.max(.01, candidate.score), 0) / weightTotal;
    const centroidY = selected.reduce((sum, candidate) => sum + candidate.y * Math.max(.01, candidate.score), 0) / weightTotal;
    state.apertureCandidateCount = selected.length;
    state.apertureCentroidU = rounded(centroidX / (SAMPLE_WIDTH - 1));
    state.apertureCentroidV = rounded(centroidY / (SAMPLE_HEIGHT - 1));
    state.vanishingU = state.apertureCentroidU;
    state.vanishingV = state.apertureCentroidV;
    state.initialVanishingU = state.vanishingU;
    state.initialVanishingV = state.vanishingV;
  }

  function analyzeChannelRegion(region, index) {
    const xStart = Math.floor(region.x0 * SAMPLE_WIDTH);
    const xEnd = Math.ceil(region.x1 * SAMPLE_WIDTH);
    const yStart = Math.floor(region.y0 * SAMPLE_HEIGHT);
    const yEnd = Math.ceil(region.y1 * SAMPLE_HEIGHT);
    const lumas = [];
    const chromatic = [];
    let edgeXTotal = 0;
    let edgeYTotal = 0;
    let edgeCount = 0;
    let saturationTotal = 0;
    let weightedX = 0;
    let weightedY = 0;
    let weightTotal = 0;

    for (let y = yStart; y < yEnd; y += 1) {
      for (let x = xStart; x < xEnd; x += 1) {
        const [red, green, blue] = pixelAt(x, y);
        const light = luminance(red, green, blue);
        const saturation = (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;
        const edgeX = Math.abs(light - pixelLuminance(x + 1, y));
        const edgeY = Math.abs(light - pixelLuminance(x, y + 1));
        const edge = (edgeX + edgeY) / 2;
        lumas.push(light);
        chromatic.push({ red, green, blue, saturation, edge });
        saturationTotal += saturation;
        edgeXTotal += edgeX;
        edgeYTotal += edgeY;
        edgeCount += 1;
        const weight = .015 + edge;
        weightedX += x * weight;
        weightedY += y * weight;
        weightTotal += weight;
      }
    }

    const mean = lumas.reduce((sum, value) => sum + value, 0) / lumas.length;
    const stdDev = Math.sqrt(lumas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / lumas.length);
    const edgeX = edgeXTotal / edgeCount;
    const edgeY = edgeYTotal / edgeCount;
    const edgeMean = (edgeX + edgeY) / 2;
    const saturationMean = saturationTotal / edgeCount;
    const densityScore = edgeMean * 3.1 + stdDev * .92 + saturationMean * .28;
    const axisDegrees = Math.round(Math.atan2(edgeY, edgeX) * 180 / Math.PI);
    const ellipseRatio = clamp(.44 + edgeY / Math.max(.0001, edgeX + edgeY) * .32, .44, .76);
    chromatic.sort((a, b) => (b.saturation + b.edge * .7) - (a.saturation + a.edge * .7));
    const colorSet = chromatic.slice(0, Math.max(12, Math.round(chromatic.length * .22)));
    const average = colorSet.reduce((totals, sample) => [
      totals[0] + sample.red,
      totals[1] + sample.green,
      totals[2] + sample.blue,
    ], [0, 0, 0]).map(total => total / colorSet.length);
    const accentRgb = average.map(value => Math.round(mix(value, 232, .28)));

    return {
      index,
      id: region.id,
      label: region.label,
      region: { ...region },
      samplePixelCount: lumas.length,
      luminanceMean: rounded(mean),
      luminanceStdDev: rounded(stdDev),
      saturationMean: rounded(saturationMean),
      edgeX: rounded(edgeX),
      edgeY: rounded(edgeY),
      edgeMean: rounded(edgeMean),
      densityScore: rounded(densityScore),
      densityRank: 0,
      ringCount: 0,
      axisDegrees,
      ellipseRatio: rounded(ellipseRatio),
      centroidU: rounded((weightedX / weightTotal) / (SAMPLE_WIDTH - 1)),
      centroidV: rounded((weightedY / weightTotal) / (SAMPLE_HEIGHT - 1)),
      sourceRgb: average.map(value => Math.round(value)),
      accentRgb,
      risk: 0,
      conclusion: 'AWAIT',
    };
  }

  function analyzeChannels() {
    const profiles = CHANNEL_REGIONS.map(analyzeChannelRegion);
    const ranked = [...profiles].sort((a, b) => a.densityScore - b.densityScore);
    ranked.forEach((profile, rank) => {
      profile.densityRank = rank;
      profile.ringCount = 19 + rank * 7 + Math.round(clamp(profile.densityScore, 0, 1) * 3);
      profile.risk = Math.round(clamp(
        profile.densityScore * .72 + profile.luminanceStdDev * .85 + profile.saturationMean * .18,
        0,
        1,
      ) * 100);
      profile.conclusion = rank === profiles.length - 1 ? 'ISOLATE' : rank >= 1 ? 'WATCH' : 'CLEAR';
    });
    const scores = profiles.map(profile => profile.densityScore).sort((a, b) => a - b);
    const deltas = scores.slice(1).map((score, index) => score - scores[index]);
    state.channelProfiles = profiles;
    state.channelProfileCount = profiles.length;
    state.distinctRingCountCount = new Set(profiles.map(profile => profile.ringCount)).size;
    state.minimumChannelDensityDelta = rounded(Math.min(...deltas));
    const axes = profiles.map(profile => profile.axisDegrees);
    state.distinctAxisDegreeCount = new Set(axes).size;
    state.channelAxisDegreeSpan = Math.max(...axes) - Math.min(...axes);
    state.distinctRiskCount = new Set(profiles.map(profile => profile.risk)).size;
    state.profileEvidenceChecksum = fnvChecksum(profiles.flatMap(profile => [
      profile.densityScore,
      profile.axisDegrees,
      profile.ellipseRatio,
      profile.risk,
      ...profile.sourceRgb,
    ]));
    const lowestDensity = profiles.reduce((lowest, profile) => profile.densityScore < lowest.densityScore ? profile : lowest);
    const highestDensity = profiles.reduce((highest, profile) => profile.densityScore > highest.densityScore ? profile : highest);
    state.pixelEvidenceBoundToDensity = profiles.every(profile => profile.ringCount >= 19 && profile.ringCount <= 43)
      && state.minimumChannelDensityDelta > .001;
    state.pixelEvidenceBoundToVanishingPoint = Number.isFinite(state.apertureCentroidU)
      && Number.isFinite(state.apertureCentroidV)
      && state.apertureCandidateCount >= 8;
    state.pixelEvidenceBoundToConclusion = new Set(profiles.map(profile => profile.conclusion)).size >= 3
      && lowestDensity.conclusion === 'CLEAR'
      && highestDensity.conclusion === 'ISOLATE'
      && state.distinctRiskCount >= 3;
  }

  async function loadAndAnalyzeAsset() {
    state.assetFetchCount += 1;
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `asset fetch failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;
    invariant(state.assetByteLength === EXPECTED_ASSET.byteLength, 'asset byte length changed');
    invariant(state.assetShaMatchesExpected, 'asset SHA-256 changed');

    sourceObjectUrl = URL.createObjectURL(new Blob([bytes], { type: state.assetMimeType || 'image/jpeg' }));
    sourceImage.src = sourceObjectUrl;
    await sourceImage.decode();
    browserImage = sourceImage;
    state.browserImageDecoded = true;
    state.sourceNaturalWidth = browserImage.naturalWidth;
    state.sourceNaturalHeight = browserImage.naturalHeight;
    state.sourcePixelCount = browserImage.naturalWidth * browserImage.naturalHeight;
    invariant(state.sourceNaturalWidth === EXPECTED_ASSET.width && state.sourceNaturalHeight === EXPECTED_ASSET.height, 'decoded source dimensions changed');

    const evidenceContext = evidenceCanvas.getContext('2d', { willReadFrequently: true });
    invariant(Boolean(evidenceContext), '2D evidence context is unavailable');
    evidenceContext.drawImage(
      browserImage,
      SOURCE_CROP.x,
      SOURCE_CROP.y,
      SOURCE_CROP.width,
      SOURCE_CROP.height,
      0,
      0,
      SAMPLE_WIDTH,
      SAMPLE_HEIGHT,
    );
    sampledPixels = evidenceContext.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
    state.browserCanvasReadback = true;
    state.sampledPixelCount = sampledPixels.length / 4;
    state.sampledPixelByteLength = sampledPixels.byteLength;
    state.sampledPixelSha256 = await sha256(sampledPixels);
    analyzeGlobalPixels();
    analyzeAperture();
    analyzeChannels();
    sourceStatus.textContent = `Master verified · ${state.sampledPixelCount.toLocaleString()} px`;
  }

  function selectedProfile() {
    return state.channelProfiles[state.selectedChannelIndex];
  }

  function rgbCss(values, alpha = 1) {
    return alpha === 1
      ? `rgb(${values.join(' ')})`
      : `rgb(${values.join(' ')} / ${alpha})`;
  }

  function updateOutputs() {
    const profile = selectedProfile();
    if (!profile) return;
    const assessed = state.assessedChannels[state.selectedChannelIndex];
    state.selectedChannelId = profile.id;
    state.selectedChannelLabel = profile.label;
    state.selectedChannelConclusion = assessed ? profile.conclusion : 'AWAIT';
    state.selectedChannelRisk = profile.risk;
    state.selectedChannelRingCount = profile.ringCount;
    state.assessedChannelCount = state.assessedChannels.filter(Boolean).length;
    state.minimumDepth = Math.min(state.minimumDepth, state.depth);
    state.maximumDepth = Math.max(state.maximumDepth, state.depth);
    state.currentVisualStateChecksum = visualChecksum();
    state.historyDepth = history.length;

    channelStatus.textContent = assessed ? `Assessed ${state.assessedChannelCount}/4` : 'Unassessed';
    conclusionOutput.textContent = `${profile.id} / ${assessed ? profile.conclusion : 'AWAIT'}`;
    ringsReading.textContent = `Rings ${profile.ringCount}`;
    axisReading.textContent = `Axis ${profile.axisDegrees}°`;
    riskReading.textContent = `Risk ${String(profile.risk).padStart(2, '0')}`;
    depthReading.textContent = `Depth ${String(state.depth).padStart(2, '0')}`;
    depthInput.value = String(state.depth);
    depthOutput.textContent = String(state.depth).padStart(2, '0');
    stage.style.setProperty('--accent', rgbCss(profile.accentRgb));
    stage.style.setProperty('--conclusion', assessed && profile.conclusion === 'ISOLATE' ? '#ed765f' : rgbCss(profile.accentRgb));
    channelButtons.forEach((button, index) => {
      button.dataset.selected = String(index === state.selectedChannelIndex);
      button.setAttribute('aria-pressed', String(index === state.selectedChannelIndex));
    });
  }

  function requestHumanRedraw() {
    if (!sketch) return;
    state.p5EventRedrawCount += 1;
    sketch.redraw();
  }

  function recordTrustedInput(event, kind, source, changed) {
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = Boolean(event.isTrusted);
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.humanInputCausalityCount += 1;
    if (changed) {
      state.humanVisualMutationCount += 1;
      state.interactionRecords.push({
        input: state.trustedInputCount,
        kind,
        source,
        channel: state.selectedChannelIndex,
        depth: state.depth,
        vanishingU: rounded(state.vanishingU),
        vanishingV: rounded(state.vanishingV),
        checksum: visualChecksum(),
      });
      if (state.interactionRecords.length > 24) state.interactionRecords.shift();
    }
    return true;
  }

  function registerPointerType(event) {
    const pointerType = event.pointerType || 'mouse';
    state.lastPointerType = pointerType;
    if (!state.pointerTypesSeen.includes(pointerType)) state.pointerTypesSeen.push(pointerType);
    if (pointerType === 'touch') state.touchInputCount += 1;
    else if (pointerType === 'pen') state.penInputCount += 1;
    else state.mouseInputCount += 1;
  }

  function applyMutation(event, kind, source, mutate, { save = true } = {}) {
    if (!event.isTrusted) {
      recordTrustedInput(event, kind, source, false);
      return false;
    }
    const before = snapshot();
    const beforeChecksum = visualChecksum();
    mutate();
    const afterChecksum = visualChecksum();
    const changed = beforeChecksum !== afterChecksum;
    if (changed && save) pushHistory(before);
    recordTrustedInput(event, kind, source, changed);
    if (changed) {
      updateOutputs();
      requestHumanRedraw();
    }
    return changed;
  }

  function channelFromU(unitX) {
    const direct = CHANNEL_REGIONS.findIndex(region => unitX >= region.x0 && unitX < region.x1);
    if (direct >= 0) return direct;
    return CHANNEL_REGIONS.reduce((bestIndex, region, index) => {
      const center = (region.x0 + region.x1) / 2;
      const best = CHANNEL_REGIONS[bestIndex];
      const bestCenter = (best.x0 + best.x1) / 2;
      return Math.abs(unitX - center) < Math.abs(unitX - bestCenter) ? index : bestIndex;
    }, 0);
  }

  function pointerUnit(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width)),
      y: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height)),
    };
  }

  function selectChannel(index, moveAxis = true) {
    state.selectedChannelIndex = (index + state.channelProfiles.length) % state.channelProfiles.length;
    if (moveAxis) {
      const profile = selectedProfile();
      state.vanishingU = profile.centroidU;
      state.vanishingV = profile.centroidV;
    }
  }

  function shouldIgnorePointer(event) {
    return Boolean(event.target.closest('button, input, label, .tunnel-controls, .channel-rail'));
  }

  stage.addEventListener('pointermove', event => {
    if (shouldIgnorePointer(event) && !state.dragging) return;
    if (!event.isTrusted) {
      recordTrustedInput(event, state.dragging ? 'captured-pointer-drag' : 'pointer-hover', `stage-${event.pointerType || 'mouse'}`, false);
      return;
    }
    registerPointerType(event);
    state.pointerMoveCount += 1;
    const point = pointerUnit(event);
    if (state.dragging && event.pointerId === state.activePointerId) {
      state.pointerDragCount += 1;
      applyMutation(event, 'captured-pointer-drag', `stage-${event.pointerType || 'mouse'}`, () => {
        const bounds = stage.getBoundingClientRect();
        state.depth = Math.round(clamp(state.dragStartDepth + (event.clientX - state.dragStartX) / Math.max(1, bounds.width) * 125, 0, 100));
        state.vanishingU = point.x;
        state.vanishingV = point.y;
        state.selectedChannelIndex = channelFromU(point.x);
      });
      return;
    }
    if (event.pointerType === 'touch') return;
    state.hoverInputCount += 1;
    applyMutation(event, 'pointer-hover', `stage-${event.pointerType || 'mouse'}`, () => {
      state.vanishingU = point.x;
      state.vanishingV = point.y;
      state.selectedChannelIndex = channelFromU(point.x);
    });
  });

  stage.addEventListener('pointerdown', event => {
    if (shouldIgnorePointer(event)) return;
    if (!event.isTrusted) {
      recordTrustedInput(event, 'pointer-down', `stage-${event.pointerType || 'mouse'}`, false);
      return;
    }
    registerPointerType(event);
    state.pointerDownCount += 1;
    const point = pointerUnit(event);
    state.dragging = true;
    state.activePointerId = event.pointerId;
    state.dragStartX = event.clientX;
    state.dragStartDepth = state.depth;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = true;
    state.pointerCaptureCount += 1;
    applyMutation(event, 'pointer-down', `stage-${event.pointerType || 'mouse'}`, () => {
      state.vanishingU = point.x;
      state.vanishingV = point.y;
      state.selectedChannelIndex = channelFromU(point.x);
    });
    stage.focus({ preventScroll: true });
  });

  function finishPointer(event, cancelled = false) {
    if (event.pointerId !== state.activePointerId) return;
    if (!event.isTrusted) {
      recordTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-up', `stage-${event.pointerType || 'mouse'}`, false);
      return;
    }
    registerPointerType(event);
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerUpCount += 1;
    recordTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-up', `stage-${event.pointerType || 'mouse'}`, false);
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.pointerCaptured = false;
    state.dragging = false;
    state.activePointerId = null;
  }

  stage.addEventListener('pointerup', event => finishPointer(event));
  stage.addEventListener('pointercancel', event => finishPointer(event, true));

  stage.addEventListener('keydown', event => {
    if (event.target.closest('button, input')) return;
    const supported = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Home', 'Backspace', 'u', 'U'];
    if (!supported.includes(event.key)) return;
    if (!event.isTrusted) {
      recordTrustedInput(event, 'keyboard', `key-${event.key}`, false);
      return;
    }
    event.preventDefault();
    state.keyboardInputCount += 1;
    const changed = applyMutation(event, 'keyboard', `key-${event.key}`, () => {
      if (event.key === 'ArrowLeft') selectChannel(state.selectedChannelIndex - 1);
      if (event.key === 'ArrowRight') selectChannel(state.selectedChannelIndex + 1);
      if (event.key === 'ArrowUp') state.depth = Math.min(100, state.depth + 4);
      if (event.key === 'ArrowDown') state.depth = Math.max(0, state.depth - 4);
      if (event.key === 'Enter') {
        state.assessedChannels[state.selectedChannelIndex] = true;
        state.assessmentCount += 1;
      }
      if (event.key === 'Home') restore(initialSnapshot);
      if (event.key === 'Backspace' || event.key === 'u' || event.key === 'U') {
        const previous = history.pop();
        if (previous) restore(previous);
        state.undoCount += 1;
      }
    }, { save: !['Backspace', 'u', 'U'].includes(event.key) });
    if (changed) state.keyboardMutationCount += 1;
  });

  depthInput.addEventListener('input', event => {
    if (!event.isTrusted) {
      recordTrustedInput(event, 'range-input', 'depth-range', false);
      return;
    }
    state.rangeInputCount += 1;
    applyMutation(event, 'range-input', 'depth-range', () => {
      state.depth = Math.round(clamp(Number(depthInput.value), 0, 100));
    });
  });

  channelButtons.forEach((button, index) => {
    button.addEventListener('click', event => {
      if (!event.isTrusted) {
        recordTrustedInput(event, 'channel-button', `channel-${index + 1}`, false);
        return;
      }
      state.channelButtonInputCount += 1;
      applyMutation(event, 'channel-button', `channel-${index + 1}`, () => selectChannel(index));
    });
  });

  actionButtons.forEach(button => {
    button.addEventListener('click', event => {
      const action = button.dataset.action;
      if (!event.isTrusted) {
        recordTrustedInput(event, 'action-button', action, false);
        return;
      }
      state.actionButtonInputCount += 1;
      if (action === 'undo') {
        applyMutation(event, 'action-button', 'undo', () => {
          const previous = history.pop();
          if (previous) restore(previous);
          state.undoCount += 1;
        }, { save: false });
        return;
      }
      applyMutation(event, 'action-button', action, () => {
        if (action === 'previous') selectChannel(state.selectedChannelIndex - 1);
        if (action === 'next') selectChannel(state.selectedChannelIndex + 1);
        if (action === 'assess') {
          state.assessedChannels[state.selectedChannelIndex] = true;
          state.assessmentCount += 1;
        }
        if (action === 'reset') {
          restore(initialSnapshot);
          state.resetCount += 1;
        }
      });
    });
  });

  function drawSourceAndTunnel(p) {
    const profile = selectedProfile();
    if (!profile || !browserImage) return;
    const width = p.width;
    const height = p.height;
    const context = p.drawingContext;
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
    state.p5SourceDrawCount += 1;

    p.noStroke();
    p.fill(2, 11, 17, 150);
    p.rect(0, 0, width, height);
    p.fill(...profile.accentRgb, 22);
    p.rect(profile.region.x0 * width, 0, (profile.region.x1 - profile.region.x0) * width, height);
    p.stroke(...profile.accentRgb, 72);
    p.strokeWeight(Math.max(.55, width / 720));
    p.line(profile.region.x0 * width, 0, profile.region.x0 * width, height);
    p.line(profile.region.x1 * width, 0, profile.region.x1 * width, height);

    const vanishingX = state.vanishingU * width;
    const vanishingY = state.vanishingV * height;
    const maximumDiameter = Math.hypot(width, height) * (.72 + state.depth / 250);
    const depthExponent = 1.85 - state.depth * .0075;
    const axisRadians = profile.axisDegrees * Math.PI / 180;
    p.noFill();
    context.save();
    context.translate(vanishingX, vanishingY);
    context.rotate(axisRadians - Math.PI / 4);
    for (let ring = 0; ring < profile.ringCount; ring += 1) {
      const progress = (ring + 1) / (profile.ringCount + 1);
      const eased = progress ** depthExponent;
      const diameter = 5 + eased * maximumDiameter;
      const drift = Math.sin(progress * Math.PI * (2.5 + profile.densityRank))
        * (1 - progress) * width * (.012 + profile.risk / 6200);
      const verticalDrift = Math.cos(progress * Math.PI * (1.8 + profile.ellipseRatio))
        * (1 - progress) * height * .025;
      const alpha = Math.round(mix(210, 48, progress));
      const sourceBlend = ring % 2 ? profile.accentRgb : profile.sourceRgb;
      p.stroke(...sourceBlend, alpha);
      p.strokeWeight(Math.max(.65, width / 700) + (ring % 3 === 0 ? .35 : 0));
      p.ellipse(drift, verticalDrift, diameter, diameter * profile.ellipseRatio);
      if (ring % 4 === 0) {
        p.stroke(231, 226, 214, Math.round(alpha * .36));
        p.ellipse(drift + width * .003, verticalDrift, diameter * 1.012, diameter * profile.ellipseRatio * .988);
      }
      state.p5TunnelRingDrawCount += 1;
    }
    context.restore();

    p.stroke(...profile.accentRgb, 210);
    p.strokeWeight(Math.max(.8, width / 650));
    const cross = Math.max(5, Math.min(width, height) * .04);
    p.line(vanishingX - cross, vanishingY, vanishingX + cross, vanishingY);
    p.line(vanishingX, vanishingY - cross, vanishingX, vanishingY + cross);
    p.noFill();
    p.circle(vanishingX, vanishingY, cross * .7);

    if (state.assessedChannels[state.selectedChannelIndex]) {
      p.noStroke();
      p.fill(...profile.accentRgb, 22);
      p.circle(vanishingX, vanishingY, cross * 4.2);
    }
  }

  async function mountSketch() {
    await new Promise(resolve => {
      sketch = new p5(p => {
        p.setup = () => {
          const width = Math.max(1, Math.round(stage.clientWidth));
          const height = Math.max(1, Math.round(stage.clientHeight));
          p.pixelDensity(1);
          p.createCanvas(width, height).parent(surface);
          p.noLoop();
          state.p5InstanceReady = true;
          state.p5CanvasReady = Boolean(surface.querySelector('canvas')?.getContext('2d'));
          state.p5NoLoop = true;
          state.canvasWidth = width;
          state.canvasHeight = height;
          resolve();
        };
        p.draw = () => {
          state.p5DrawCount += 1;
          drawSourceAndTunnel(p);
          state.p5CompletedDrawCount += 1;
        };
        p.windowResized = () => {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(() => {
            const width = Math.max(1, Math.round(stage.clientWidth));
            const height = Math.max(1, Math.round(stage.clientHeight));
            if (width === p.width && height === p.height) return;
            state.resizeCount += 1;
            p.resizeCanvas(width, height, true);
            state.canvasWidth = width;
            state.canvasHeight = height;
            p.redraw();
          });
        };
      }, surface);
    });
  }

  function updateCoverageEvidence() {
    const stageBounds = stage.getBoundingClientRect();
    const canvas = surface.querySelector('canvas');
    const canvasBounds = canvas?.getBoundingClientRect();
    state.stageWidth = rounded(stageBounds.width, 2);
    state.stageHeight = rounded(stageBounds.height, 2);
    state.canvasWidth = canvas?.width || 0;
    state.canvasHeight = canvas?.height || 0;
    state.stageCoverageRatio = rounded((stageBounds.width * stageBounds.height) / Math.max(1, innerWidth * innerHeight));
    state.canvasCoverageRatio = canvasBounds
      ? rounded((canvasBounds.width * canvasBounds.height) / Math.max(1, stageBounds.width * stageBounds.height))
      : 0;
  }

  function runtimeAssert() {
    state.runtimeAssertCount += 1;
    updateCoverageEvidence();
    const profilePixelTotal = state.channelProfiles.reduce((sum, profile) => sum + profile.samplePixelCount, 0);
    const passed = state.claimedLibrary === 'p5@2.3.0'
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetByteLength === EXPECTED_ASSET.byteLength
      && state.assetShaMatchesExpected
      && state.browserImageDecoded
      && state.sourceNaturalWidth === EXPECTED_ASSET.width
      && state.sourceNaturalHeight === EXPECTED_ASSET.height
      && state.browserCanvasReadback
      && state.sampledPixelCount === SAMPLE_PIXEL_COUNT
      && state.sampledPixelByteLength === SAMPLE_BYTE_LENGTH
      && /^[0-9a-f]{64}$/.test(state.sampledPixelSha256)
      && state.sampledOpaquePixelCount === SAMPLE_PIXEL_COUNT
      && state.distinctSampleColorCount > 80
      && state.sampledLuminanceRange > .25
      && state.sampledLuminanceStdDev > .06
      && state.sampledEdgeMean > .008
      && state.apertureCandidateCount >= 8
      && state.apertureCentroidU >= APERTURE_REGION.x0
      && state.apertureCentroidU <= APERTURE_REGION.x1
      && state.apertureCentroidV >= APERTURE_REGION.y0
      && state.apertureCentroidV <= APERTURE_REGION.y1
      && state.channelProfileCount === CHANNEL_REGIONS.length
      && profilePixelTotal > 2600
      && state.channelProfiles.every(profile => profile.samplePixelCount > 500)
      && state.distinctRingCountCount === CHANNEL_REGIONS.length
      && state.minimumChannelDensityDelta > .001
      && state.distinctAxisDegreeCount >= 2
      && state.channelAxisDegreeSpan > 1
      && state.distinctRiskCount >= 3
      && /^[0-9a-f]{8}$/.test(state.profileEvidenceChecksum)
      && state.pixelEvidenceBoundToDensity
      && state.pixelEvidenceBoundToVanishingPoint
      && state.pixelEvidenceBoundToConclusion
      && state.p5InstanceReady
      && state.p5CanvasReady
      && state.p5NoLoop
      && state.p5CompletedDrawCount >= 1
      && state.p5SourceDrawCount >= 1
      && state.stageCoverageRatio >= .98
      && state.canvasCoverageRatio >= .98
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && state.inputCount === state.trustedInputCount
      && (state.trustedInputCount === 0
        || (state.humanInputCausalityCount > 0
          && state.humanVisualMutationCount > 0
          && state.interactionRecords.length > 0))
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.renderIgnoresPreviewClock
      && !state.visualMutationFromPreviewClock
      && state.previewClockMutationCount === 0;
    state.runtimeAssertionPassed = passed;
    return passed;
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = runtimeAssert;

  async function boot() {
    await loadAndAnalyzeAsset();
    initialSnapshot = snapshot();
    updateOutputs();
    await mountSketch();
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    updateCoverageEvidence();
    state.initialVisualStateChecksum = visualChecksum();
    state.currentVisualStateChecksum = state.initialVisualStateChecksum;
    state.initialStillVerified = state.p5CompletedDrawCount === 1
      && state.humanVisualMutationCount === 0
      && state.p5EventRedrawCount === 0;
    state.ready = true;
    invariant(runtimeAssert(), 'runtime evidence assertion failed');
  }

  const ready = boot();
  ready.catch(markPreviewFailure);
  installPreviewController({
    id: 'moire-tunnel-zoom',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render() {
      state.previewClockCallCount += 1;
      state.previewClockIgnoredCount += 1;
    },
    ready,
  });

  window.addEventListener('beforeunload', () => {
    if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
