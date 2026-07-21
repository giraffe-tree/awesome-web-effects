import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-08/flow-field-ribbon-advection/north-atlantic-passage-current-source.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = Object.freeze({
  bytes: 266749,
  width: 960,
  height: 640,
  sha256: 'e732c36053e0657291b4846ff0e1ef2d2d484f31bc886709cf271c7329cd1b3b',
});
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 64;
const SAMPLE_PIXEL_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const INITIAL_GATE = Object.freeze({ u: .53, v: .64 });
const INITIAL_PROBE = Object.freeze({ u: .72, v: .45 });
const ROUTE_START = Object.freeze({ u: .045, v: .82 });
const ROUTE_END = Object.freeze({ u: .955, v: .17 });
const INITIAL_DRAFT = 4.2;
const ROUTE_STEPS = 56;
const STREAMLINE_COUNT = 34;
const STREAMLINE_STEPS = 44;
const TAU = Math.PI * 2;

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 4) => Number(value.toFixed(digits));
const fract = value => value - Math.floor(value);
const seeded = (index, salt = 0) => fract(Math.sin(index * 91.733 + salt * 37.117) * 43758.5453);

try {
  const stage = document.querySelector('#route-stage');
  const surface = document.querySelector('#route-surface');
  const routeState = document.querySelector('#route-state');
  const riskReadout = document.querySelector('#risk-readout');
  const assistReadout = document.querySelector('#assist-readout');
  const distanceReadout = document.querySelector('#distance-readout');
  const sampleReadout = document.querySelector('#sample-readout');
  const probeCurrent = document.querySelector('#probe-current');
  const probeRisk = document.querySelector('#probe-risk');
  const draftInput = document.querySelector('#vessel-draft');
  const draftReadout = document.querySelector('#draft-readout');
  const actionButtons = [...document.querySelectorAll('[data-route-action]')];
  const lockButton = document.querySelector('[data-route-action="lock"]');
  const runtimeLedger = document.querySelector('#runtime-ledger');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  let sketch = null;
  let surveyImage = null;
  let samplePixels = null;
  let flowField = [];
  let currentRoute = null;
  let safestRoute = null;
  let dirty = true;
  let resizeFrame = 0;

  const state = {
    id: 'flow-field-ribbon-advection',
    task: 'human-operated-north-atlantic-passage-current-and-grounding-risk-routing',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'same-origin-image-pixels-drive-p5-flow-vector-ribbons-grounding-risk-and-human-rerouted-passage',
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
    gateMutationCount: 0,
    probeMutationCount: 0,
    draftMutationCount: 0,
    routeRecomputeCount: 0,
    safestRouteActivationCount: 0,
    lockMutationCount: 0,
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
    initialGateU: INITIAL_GATE.u,
    initialGateV: INITIAL_GATE.v,
    gateU: INITIAL_GATE.u,
    gateV: INITIAL_GATE.v,
    probeU: INITIAL_PROBE.u,
    probeV: INITIAL_PROBE.v,
    initialDraft: INITIAL_DRAFT,
    vesselDraft: INITIAL_DRAFT,
    locked: false,
    routePointCount: 0,
    routeRiskScore: 0,
    routeAssistPercent: 0,
    routeDistanceNm: 0,
    routeChecksum: 0,
    initialRouteRiskScore: 0,
    minimumObservedRiskScore: 100,
    maximumObservedRiskScore: 0,
    safestGateU: 0,
    safestGateV: 0,
    safestRouteRiskScore: 100,
    routeCandidateEvaluationCount: 0,
    routePixelEvaluationCount: 0,
    probeCurrentKnots: 0,
    probeHeadingDegrees: 0,
    probeGroundingRisk: 0,
    probeRiskLabel: '—',
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
    sampledCyanSignalMinimum: 1,
    sampledCyanSignalMaximum: 0,
    sampledCyanSignalRange: 0,
    sampledWarmSignalMaximum: 0,
    flowFieldWidth: SAMPLE_WIDTH,
    flowFieldHeight: SAMPLE_HEIGHT,
    flowVectorCount: 0,
    flowVectorChecksum: 0,
    flowMagnitudeMinimum: 1,
    flowMagnitudeMaximum: 0,
    flowMagnitudeRange: 0,
    hazardMinimum: 1,
    hazardMaximum: 0,
    hazardRange: 0,
    edgeSampleEvaluationCount: 0,
    rasterDrivenEvidenceReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    p5ImageDrawCount: 0,
    streamlineDrawCount: 0,
    streamlineSegmentDrawCount: 0,
    routeSegmentDrawCount: 0,
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
  window.__FLOW_FIELD_ROUTE_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`flow-field-ribbon-advection: ${message}`);
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

  function visualStateChecksum() {
    let checksum = 2166136261;
    checksum = fnvMix(checksum, Math.round(state.gateU * 10000));
    checksum = fnvMix(checksum, Math.round(state.gateV * 10000));
    checksum = fnvMix(checksum, Math.round(state.probeU * 10000));
    checksum = fnvMix(checksum, Math.round(state.probeV * 10000));
    checksum = fnvMix(checksum, Math.round(state.vesselDraft * 100));
    checksum = fnvMix(checksum, state.locked ? 1 : 0);
    checksum = fnvMix(checksum, state.routeChecksum);
    return checksum >>> 0;
  }

  function sampleIndex(x, y) {
    const safeX = clamp(Math.round(x), 0, SAMPLE_WIDTH - 1);
    const safeY = clamp(Math.round(y), 0, SAMPLE_HEIGHT - 1);
    return safeY * SAMPLE_WIDTH + safeX;
  }

  function fieldAt(u, v) {
    return flowField[sampleIndex(u * (SAMPLE_WIDTH - 1), v * (SAMPLE_HEIGHT - 1))];
  }

  function quadraticPoint(start, gate, end, t) {
    const inverse = 1 - t;
    return {
      u: inverse * inverse * start.u + 2 * inverse * t * gate.u + t * t * end.u,
      v: inverse * inverse * start.v + 2 * inverse * t * gate.v + t * t * end.v,
    };
  }

  function computeRoute(gateU, gateV, draft, trackEvaluation = true) {
    const gate = { u: clamp(gateU, .18, .82), v: clamp(gateV, .17, .82) };
    const points = [];
    let riskTotal = 0;
    let assistTotal = 0;
    let distance = 0;
    let checksum = 2166136261;
    let previous = null;
    const draftFactor = clamp((draft - 2.4) / 4.8);

    for (let step = 0; step < ROUTE_STEPS; step += 1) {
      const t = step / (ROUTE_STEPS - 1);
      const base = quadraticPoint(ROUTE_START, gate, ROUTE_END, t);
      const local = fieldAt(base.u, base.v);
      const envelope = Math.sin(Math.PI * t);
      const crossCurrent = (local.y * .022 + local.x * .008) * envelope * local.speed;
      const u = clamp(base.u + local.x * .018 * envelope * local.speed, .018, .982);
      const v = clamp(base.v + crossCurrent, .025, .975);
      const pointField = fieldAt(u, v);
      const nextBase = quadraticPoint(ROUTE_START, gate, ROUTE_END, clamp(t + 1 / ROUTE_STEPS));
      const intendedX = nextBase.u - base.u;
      const intendedY = nextBase.v - base.v;
      const intendedLength = Math.max(.0001, Math.hypot(intendedX, intendedY));
      const alignment = (pointField.x * intendedX + pointField.y * intendedY) / intendedLength;
      const grounding = clamp(pointField.hazard * (.66 + draftFactor * .58));
      const risk = clamp(grounding * .82 + Math.max(0, -.18 - alignment) * .18);
      riskTotal += risk;
      assistTotal += clamp((alignment * pointField.speed + .45) / .9);
      if (previous) distance += Math.hypot(u - previous.u, (v - previous.v) * .72);
      points.push({ u, v, risk, speed: pointField.speed, heading: pointField.heading });
      checksum = fnvMix(checksum, Math.round(u * 10000));
      checksum = fnvMix(checksum, Math.round(v * 10000));
      checksum = fnvMix(checksum, Math.round(risk * 10000));
      previous = { u, v };
    }

    if (trackEvaluation) state.routePixelEvaluationCount += ROUTE_STEPS;
    return {
      gate,
      points,
      riskScore: Math.round(riskTotal / ROUTE_STEPS * 100),
      assistPercent: Math.round(assistTotal / ROUTE_STEPS * 100),
      distanceNm: rounded(distance * 26.4, 1),
      checksum: checksum >>> 0,
    };
  }

  function findSafestRoute() {
    let best = null;
    let candidateCount = 0;
    for (let row = 0; row < 11; row += 1) {
      for (let column = 0; column < 15; column += 1) {
        const u = .2 + column / 14 * .6;
        const v = .2 + row / 10 * .58;
        const candidate = computeRoute(u, v, state.vesselDraft, false);
        candidateCount += 1;
        if (!best || candidate.riskScore < best.riskScore
          || (candidate.riskScore === best.riskScore && candidate.assistPercent > best.assistPercent)) best = candidate;
      }
    }
    state.routeCandidateEvaluationCount += candidateCount;
    state.safestGateU = rounded(best.gate.u);
    state.safestGateV = rounded(best.gate.v);
    state.safestRouteRiskScore = best.riskScore;
    safestRoute = best;
  }

  function recomputeRoute() {
    currentRoute = computeRoute(state.gateU, state.gateV, state.vesselDraft);
    state.routeRecomputeCount += 1;
    state.routePointCount = currentRoute.points.length;
    state.routeRiskScore = currentRoute.riskScore;
    state.routeAssistPercent = currentRoute.assistPercent;
    state.routeDistanceNm = currentRoute.distanceNm;
    state.routeChecksum = currentRoute.checksum;
    state.minimumObservedRiskScore = Math.min(state.minimumObservedRiskScore, currentRoute.riskScore);
    state.maximumObservedRiskScore = Math.max(state.maximumObservedRiskScore, currentRoute.riskScore);
    findSafestRoute();
  }

  function updateProbeEvidence() {
    const local = fieldAt(state.probeU, state.probeV);
    const draftFactor = clamp((state.vesselDraft - 2.4) / 4.8);
    const risk = clamp(local.hazard * (.66 + draftFactor * .58));
    const label = risk > .66 ? 'HIGH' : risk > .36 ? 'WATCH' : 'CLEAR';
    state.probeCurrentKnots = rounded(.7 + local.speed * 4.6, 1);
    state.probeHeadingDegrees = Math.round(local.heading);
    state.probeGroundingRisk = rounded(risk);
    state.probeRiskLabel = label;
  }

  function updateInterface() {
    const riskTone = state.routeRiskScore >= 54 ? 'high' : state.routeRiskScore <= state.safestRouteRiskScore + 2 ? 'low' : 'normal';
    riskReadout.textContent = `${state.routeRiskScore} / 100`;
    riskReadout.dataset.tone = riskTone;
    assistReadout.textContent = `${state.routeAssistPercent}%`;
    assistReadout.dataset.tone = state.routeAssistPercent >= 60 ? 'low' : 'normal';
    distanceReadout.textContent = `${state.routeDistanceNm} NM`;
    sampleReadout.textContent = `${SAMPLE_WIDTH} × ${SAMPLE_HEIGHT}`;
    probeCurrent.textContent = `${state.probeCurrentKnots} KN · ${String(state.probeHeadingDegrees).padStart(3, '0')}°`;
    probeRisk.textContent = `${state.probeRiskLabel} · ${Math.round(state.probeGroundingRisk * 100)}%`;
    draftReadout.textContent = `${state.vesselDraft.toFixed(1)} m`;
    routeState.textContent = state.locked ? 'Route locked' : state.routeRiskScore <= state.safestRouteRiskScore + 1 ? 'Lowest-risk route' : 'Route editable';
    lockButton.textContent = state.locked ? 'Unlock' : 'Lock';
    lockButton.setAttribute('aria-pressed', String(state.locked));
    runtimeLedger.textContent = `raster ${state.assetShaMatchesExpected ? 'verified' : 'pending'} · ${state.flowVectorCount} vectors · route ${state.routeChecksum}`;
    stage.dataset.routeRisk = String(state.routeRiskScore);
    stage.dataset.routeAssist = String(state.routeAssistPercent);
    stage.dataset.routeChecksum = String(state.routeChecksum);
    stage.dataset.safestRouteRisk = String(state.safestRouteRiskScore);
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

  function requestRender(reason) {
    dirty = true;
    state.renderRequestCount += 1;
    state.lastRenderReason = reason;
    sketch?.redraw();
  }

  function analyzeSampledPixels() {
    const luma = new Float32Array(SAMPLE_PIXEL_COUNT);
    const cyan = new Float32Array(SAMPLE_PIXEL_COUNT);
    const warm = new Float32Array(SAMPLE_PIXEL_COUNT);
    const distinct = new Set();
    let alphaFailure = 0;
    let nonzero = 0;

    for (let index = 0; index < SAMPLE_PIXEL_COUNT; index += 1) {
      const offset = index * 4;
      const red = samplePixels[offset];
      const green = samplePixels[offset + 1];
      const blue = samplePixels[offset + 2];
      const alpha = samplePixels[offset + 3];
      const luminance = (red * .2126 + green * .7152 + blue * .0722) / 255;
      const cyanSignal = clamp((green * .6 + blue * .7 - red * .82) / 180);
      const warmSignal = clamp((red * 1.12 - green * .5 - blue * .38) / 126);
      luma[index] = luminance;
      cyan[index] = cyanSignal;
      warm[index] = warmSignal;
      state.sampledLuminanceMinimum = Math.min(state.sampledLuminanceMinimum, luminance);
      state.sampledLuminanceMaximum = Math.max(state.sampledLuminanceMaximum, luminance);
      state.sampledCyanSignalMinimum = Math.min(state.sampledCyanSignalMinimum, cyanSignal);
      state.sampledCyanSignalMaximum = Math.max(state.sampledCyanSignalMaximum, cyanSignal);
      state.sampledWarmSignalMaximum = Math.max(state.sampledWarmSignalMaximum, warmSignal);
      if (alpha !== 255) alphaFailure += 1;
      if (red || green || blue) nonzero += Number(red > 0) + Number(green > 0) + Number(blue > 0);
      distinct.add(`${red >> 3},${green >> 3},${blue >> 3}`);
    }

    let vectorChecksum = 2166136261;
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const index = y * SAMPLE_WIDTH + x;
        const left = luma[sampleIndex(x - 1, y)] + cyan[sampleIndex(x - 1, y)] * .34;
        const right = luma[sampleIndex(x + 1, y)] + cyan[sampleIndex(x + 1, y)] * .34;
        const top = luma[sampleIndex(x, y - 1)] + cyan[sampleIndex(x, y - 1)] * .34;
        const bottom = luma[sampleIndex(x, y + 1)] + cyan[sampleIndex(x, y + 1)] * .34;
        const gradientX = (right - left) * .5;
        const gradientY = (bottom - top) * .5;
        const edge = clamp(Math.hypot(gradientX, gradientY) * 3.7);
        const baseX = .91 + gradientY * 3.4;
        const baseY = -.39 - gradientX * 3.4;
        const length = Math.max(.0001, Math.hypot(baseX, baseY));
        const directionX = baseX / length;
        const directionY = baseY / length;
        const speed = clamp(.2 + cyan[index] * .62 + edge * .33, .08, 1);
        const neutralRock = clamp((.16 - Math.abs(cyan[index] - .08)) * 3.1) * clamp((luma[index] - .1) * 2.8);
        const shallow = clamp((luma[index] - .23) * 1.9) * (.35 + cyan[index] * .5);
        const hazard = clamp(warm[index] * .72 + neutralRock * .58 + edge * .21 + shallow * .26);
        const heading = (Math.atan2(directionX, -directionY) * 180 / Math.PI + 360) % 360;
        flowField.push({ x: directionX, y: directionY, speed, hazard, edge, luma: luma[index], cyan: cyan[index], warm: warm[index], heading });
        state.flowMagnitudeMinimum = Math.min(state.flowMagnitudeMinimum, speed);
        state.flowMagnitudeMaximum = Math.max(state.flowMagnitudeMaximum, speed);
        state.hazardMinimum = Math.min(state.hazardMinimum, hazard);
        state.hazardMaximum = Math.max(state.hazardMaximum, hazard);
        vectorChecksum = fnvMix(vectorChecksum, Math.round((directionX + 1) * 10000));
        vectorChecksum = fnvMix(vectorChecksum, Math.round((directionY + 1) * 10000));
        vectorChecksum = fnvMix(vectorChecksum, Math.round(speed * 10000));
        vectorChecksum = fnvMix(vectorChecksum, Math.round(hazard * 10000));
        state.edgeSampleEvaluationCount += 4;
      }
    }

    state.sourceAlphaFailureCount = alphaFailure;
    state.nonzeroSampleByteCount = nonzero;
    state.distinctSampleColorCount = distinct.size;
    state.sampledLuminanceRange = rounded(state.sampledLuminanceMaximum - state.sampledLuminanceMinimum);
    state.sampledCyanSignalRange = rounded(state.sampledCyanSignalMaximum - state.sampledCyanSignalMinimum);
    state.flowVectorCount = flowField.length;
    state.flowVectorChecksum = vectorChecksum >>> 0;
    state.flowMagnitudeRange = rounded(state.flowMagnitudeMaximum - state.flowMagnitudeMinimum);
    state.hazardRange = rounded(state.hazardMaximum - state.hazardMinimum);
    state.rasterDrivenEvidenceReady = flowField.length === SAMPLE_PIXEL_COUNT
      && state.distinctSampleColorCount > 100
      && state.sampledLuminanceRange > .2
      && state.flowMagnitudeRange > .1
      && state.hazardRange > .1
      && state.flowVectorChecksum > 0;
  }

  async function fetchDecodeAndSample() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `source asset request failed with HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;
    invariant(state.assetSameOrigin, 'source asset was not fetched from the preview origin');
    invariant(state.assetByteLength === EXPECTED_ASSET.bytes, 'source asset byte length differs from the committed evidence');
    invariant(state.assetShaMatchesExpected, 'source asset SHA-256 differs from the committed evidence');

    const sourceUrl = URL.createObjectURL(new Blob([bytes], { type: state.assetMimeType || 'image/jpeg' }));
    const browserImage = new Image();
    browserImage.decoding = 'async';
    browserImage.src = sourceUrl;
    try {
      await browserImage.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = browserImage.naturalWidth;
      state.sourceNaturalHeight = browserImage.naturalHeight;
      state.sourcePixelCount = browserImage.naturalWidth * browserImage.naturalHeight;
      invariant(browserImage.naturalWidth === EXPECTED_ASSET.width && browserImage.naturalHeight === EXPECTED_ASSET.height,
        `unexpected source dimensions ${browserImage.naturalWidth}x${browserImage.naturalHeight}`);
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = SAMPLE_WIDTH;
      sampleCanvas.height = SAMPLE_HEIGHT;
      const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
      sampleContext.drawImage(browserImage, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      const sampled = sampleContext.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      samplePixels = sampled.data;
      state.sampledPixelCount = SAMPLE_PIXEL_COUNT;
      state.sampledPixelByteLength = samplePixels.byteLength;
      state.sampledPixelSha256 = await digestHex(samplePixels.buffer);
      state.sampledPixelChecksum = checksumBytes(samplePixels);
      analyzeSampledPixels();
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }

    invariant(state.browserImageDecoded && state.sampledPixelCount === SAMPLE_PIXEL_COUNT, 'browser raster evidence is incomplete');
    invariant(state.rasterDrivenEvidenceReady, 'raster did not produce a sufficiently varied flow and hazard field');
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
      }, error => reject(new Error(`p5 source image decode failed: ${error}`)));
    });
  }

  function drawStreamlines(p) {
    const width = p.width;
    const height = p.height;
    const starts = [];
    for (let index = 0; index < STREAMLINE_COUNT; index += 1) {
      starts.push({
        u: -.04 + seeded(index, 2) * .12,
        v: .05 + index / (STREAMLINE_COUNT - 1) * .91,
        weight: .38 + seeded(index, 8) * 1.1,
      });
    }

    p.noFill();
    starts.forEach((start, index) => {
      const points = [];
      let u = start.u;
      let v = start.v;
      for (let step = 0; step < STREAMLINE_STEPS; step += 1) {
        const local = fieldAt(clamp(u), clamp(v));
        points.push({ u, v, ...local });
        const stepSize = .014 + local.speed * .009;
        u += local.x * stepSize;
        v += local.y * stepSize * .78;
        if (u > 1.05 || v < -.08 || v > 1.08) break;
      }
      if (points.length < 2) return;
      p.strokeWeight(start.weight + 2.5);
      p.stroke(2, 14, 23, 45);
      p.beginShape();
      points.forEach(point => p.vertex(point.u * width, point.v * height));
      p.endShape();
      const meanWarm = points.reduce((total, point) => total + point.warm, 0) / points.length;
      const alpha = 35 + (index % 4) * 9;
      p.strokeWeight(start.weight);
      p.stroke(meanWarm > .18 ? `rgba(239,179,79,${alpha / 100})` : `rgba(156,238,226,${alpha / 100})`);
      p.beginShape();
      points.forEach(point => p.vertex(point.u * width, point.v * height));
      p.endShape();
      state.streamlineDrawCount += 1;
      state.streamlineSegmentDrawCount += Math.max(0, points.length - 1);
    });
  }

  function drawRoute(p) {
    const width = p.width;
    const height = p.height;
    const points = currentRoute.points;
    p.noFill();
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    p.strokeWeight(Math.max(5, width * .011));
    p.stroke(2, 11, 18, 150);
    p.beginShape();
    points.forEach(point => p.vertex(point.u * width, point.v * height));
    p.endShape();
    p.strokeWeight(Math.max(1.3, width * .0028));
    p.stroke(state.locked ? '#9ceee2' : '#f7f6df');
    p.beginShape();
    points.forEach(point => p.vertex(point.u * width, point.v * height));
    p.endShape();
    state.routeSegmentDrawCount += Math.max(0, points.length - 1);

    for (let index = 6; index < points.length - 4; index += 9) {
      const point = points[index];
      const next = points[index + 1];
      const angle = Math.atan2((next.v - point.v) * height, (next.u - point.u) * width);
      const x = point.u * width;
      const y = point.v * height;
      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.noStroke();
      p.fill(point.risk > .55 ? '#efb34f' : '#edf5ee');
      p.triangle(4, 0, -3, -2.4, -3, 2.4);
      p.pop();
    }

    const gateX = state.gateU * width;
    const gateY = state.gateV * height;
    p.noFill();
    p.strokeWeight(1);
    p.stroke(239, 179, 79, state.dragging ? 255 : 190);
    p.circle(gateX, gateY, state.dragging ? 24 : 19);
    p.circle(gateX, gateY, 7);
    p.stroke(239, 179, 79, 95);
    p.line(gateX - 14, gateY, gateX + 14, gateY);
    p.line(gateX, gateY - 14, gateX, gateY + 14);

    [ROUTE_START, ROUTE_END].forEach((point, index) => {
      p.noStroke();
      p.fill(index ? '#9ceee2' : '#f7f6df');
      p.circle(point.u * width, point.v * height, 6);
      p.noFill();
      p.stroke(237, 245, 238, 120);
      p.circle(point.u * width, point.v * height, 12);
    });
  }

  function drawProbe(p) {
    const x = state.probeU * p.width;
    const y = state.probeV * p.height;
    const local = fieldAt(state.probeU, state.probeV);
    const length = 11 + local.speed * 13;
    p.push();
    p.translate(x, y);
    p.rotate(Math.atan2(local.y, local.x));
    p.stroke(156, 238, 226, 210);
    p.strokeWeight(1);
    p.line(-4, 0, length, 0);
    p.noStroke();
    p.fill('#9ceee2');
    p.triangle(length + 3, 0, length - 3, -2.5, length - 3, 2.5);
    p.pop();
    p.noFill();
    p.stroke(state.probeGroundingRisk > .55 ? '#efb34f' : 'rgba(156,238,226,.72)');
    p.circle(x, y, 9);
  }

  function inspectRenderedPixels(p) {
    const context = p.drawingContext;
    const image = context.getImageData(0, 0, p.width, p.height).data;
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
    if (!state.ready || !surveyImage || !currentRoute) {
      p.background('#03131d');
      return;
    }
    p.clear();
    p.image(surveyImage, 0, 0, p.width, p.height);
    state.p5ImageDrawCount += 1;
    p.noStroke();
    p.fill(1, 13, 22, 74);
    p.rect(0, 0, p.width, p.height);
    drawStreamlines(p);
    drawRoute(p);
    drawProbe(p);
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
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
          state.p5CanvasWidth = p.width;
          state.p5CanvasHeight = p.height;
          p.draw = () => drawScene(p);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
    }, surface);
  });

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
      gate: [rounded(state.gateU), rounded(state.gateV)],
      probe: [rounded(state.probeU), rounded(state.probeV)],
      draft: state.vesselDraft,
      risk: state.routeRiskScore,
    });
    if (state.interactionRecords.length > 48) state.interactionRecords.shift();
    return true;
  }

  function eventPosition(event) {
    const rect = stage.getBoundingClientRect();
    return {
      u: clamp((event.clientX - rect.left) / Math.max(1, rect.width), .015, .985),
      v: clamp((event.clientY - rect.top) / Math.max(1, rect.height), .025, .975),
    };
  }

  function setProbe(u, v, source) {
    const beforeChecksum = visualStateChecksum();
    const beforeU = state.probeU;
    const beforeV = state.probeV;
    state.probeU = clamp(u, .02, .98);
    state.probeV = clamp(v, .03, .97);
    if (Math.hypot(state.probeU - beforeU, state.probeV - beforeV) < .001) return false;
    state.probeMutationCount += 1;
    updateProbeEvidence();
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
    return true;
  }

  function setGate(u, v, source) {
    if (state.locked) return false;
    const beforeChecksum = visualStateChecksum();
    const beforeU = state.gateU;
    const beforeV = state.gateV;
    state.gateU = clamp(u, .18, .82);
    state.gateV = clamp(v, .17, .82);
    if (Math.hypot(state.gateU - beforeU, state.gateV - beforeV) < .001) return false;
    state.gateMutationCount += 1;
    state.reversibleMutationCount += 1;
    recomputeRoute();
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
    return true;
  }

  function setDraft(value, source) {
    const next = clamp(Math.round(Number(value) * 5) / 5, 2.4, 7.2);
    if (!Number.isFinite(next) || Math.abs(next - state.vesselDraft) < .001) return false;
    const beforeChecksum = visualStateChecksum();
    state.vesselDraft = next;
    state.draftMutationCount += 1;
    state.reversibleMutationCount += 1;
    recomputeRoute();
    updateProbeEvidence();
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
    return true;
  }

  function applySafest(source) {
    const beforeChecksum = visualStateChecksum();
    const beforeU = state.gateU;
    const beforeV = state.gateV;
    state.locked = false;
    state.gateU = safestRoute.gate.u;
    state.gateV = safestRoute.gate.v;
    state.safestRouteActivationCount += 1;
    state.gateMutationCount += Number(Math.hypot(state.gateU - beforeU, state.gateV - beforeV) >= .001);
    state.reversibleMutationCount += 1;
    recomputeRoute();
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
  }

  function toggleLock(source) {
    const beforeChecksum = visualStateChecksum();
    state.locked = !state.locked;
    state.lockMutationCount += 1;
    state.reversibleMutationCount += 1;
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
  }

  function resetRoute(source) {
    const beforeChecksum = visualStateChecksum();
    state.gateU = INITIAL_GATE.u;
    state.gateV = INITIAL_GATE.v;
    state.probeU = INITIAL_PROBE.u;
    state.probeV = INITIAL_PROBE.v;
    state.vesselDraft = INITIAL_DRAFT;
    state.locked = false;
    draftInput.value = String(INITIAL_DRAFT);
    state.resetCount += 1;
    state.reversibleMutationCount += 1;
    recomputeRoute();
    updateProbeEvidence();
    recordMutation(source, beforeChecksum);
    updateInterface();
    requestRender(source);
  }

  stage.addEventListener('pointerenter', event => {
    if (event.target.closest('button,input')) return;
    if (!acceptTrustedInput(event, 'hover', `pointer-${event.pointerType || 'mouse'}-enter`)) return;
    state.pointerEnterCount += 1;
    const point = eventPosition(event);
    setProbe(point.u, point.v, state.lastInputSource);
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
    const point = eventPosition(event);
    setProbe(point.u, point.v, state.lastInputSource);
    setGate(point.u, point.v, state.lastInputSource);
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest('button,input') && state.activePointerId === null) return;
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    if (state.activePointerId !== null && event.pointerId !== state.activePointerId) return;
    if (!acceptTrustedInput(event, state.activePointerId === null ? 'hover' : pointerType,
      `pointer-${pointerType}-${state.activePointerId === null ? 'hover' : 'drag'}`)) return;
    const point = eventPosition(event);
    state.pointerMoveCount += 1;
    if (state.activePointerId === null) {
      state.hoverMoveCount += 1;
      setProbe(point.u, point.v, state.lastInputSource);
    } else {
      event.preventDefault();
      setProbe(point.u, point.v, state.lastInputSource);
      setGate(point.u, point.v, state.lastInputSource);
    }
  });

  function finishPointer(event, cancelled = false) {
    if (event.pointerId !== state.activePointerId) return;
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    if (!acceptTrustedInput(event, pointerType, `pointer-${pointerType}-${cancelled ? 'cancel' : 'up'}`)) return;
    event.preventDefault();
    if (!cancelled) {
      const point = eventPosition(event);
      setProbe(point.u, point.v, state.lastInputSource);
      setGate(point.u, point.v, state.lastInputSource);
    }
    if (state.pointerCaptured) {
      try {
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      } catch { /* capture already released by the browser */ }
      state.pointerCaptureReleaseCount += 1;
    }
    state.pointerCaptured = false;
    state.dragging = false;
    state.activePointerId = null;
    state.activePointerType = 'none';
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    updateInterface();
    requestRender(state.lastInputSource);
  }

  stage.addEventListener('pointerup', event => finishPointer(event, false));
  stage.addEventListener('pointercancel', event => finishPointer(event, true));

  stage.addEventListener('keydown', event => {
    if (event.target.closest('button,input')) return;
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 's', 'S', 'l', 'L', 'r', 'R'].includes(event.key);
    if (!handled || !acceptTrustedInput(event, 'keyboard', `keyboard-${event.key}`)) return;
    event.preventDefault();
    if (event.key === 's' || event.key === 'S') applySafest(state.lastInputSource);
    else if (event.key === 'l' || event.key === 'L') toggleLock(state.lastInputSource);
    else if (event.key === 'r' || event.key === 'R') resetRoute(state.lastInputSource);
    else {
      const step = event.shiftKey ? .06 : .025;
      const nextU = state.gateU + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0);
      const nextV = state.gateV + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0);
      setGate(nextU, nextV, state.lastInputSource);
    }
  });

  draftInput.addEventListener('input', event => {
    if (!acceptTrustedInput(event, 'range', 'range-vessel-draft')) return;
    setDraft(event.currentTarget.value, state.lastInputSource);
  });

  actionButtons.forEach(button => button.addEventListener('click', event => {
    const action = button.dataset.routeAction;
    if (!acceptTrustedInput(event, 'button', `button-${action}`)) return;
    if (action === 'safe') applySafest(state.lastInputSource);
    else if (action === 'lock') toggleLock(state.lastInputSource);
    else if (action === 'reset') resetRoute(state.lastInputSource);
  }));

  reducedMotionQuery.addEventListener?.('change', event => { state.reducedMotion = event.matches; });

  const ready = Promise.all([document.fonts.ready, canvasReady, fetchDecodeAndSample()]).then(async () => {
    surveyImage = await loadP5Image();
    invariant(state.p5ImageDecoded && state.p5ImageClass === 'p5.Image', 'p5 image evidence is incomplete');
    invariant(state.p5ImageWidth === EXPECTED_ASSET.width && state.p5ImageHeight === EXPECTED_ASSET.height,
      'p5 image dimensions differ from the committed source');
    invariant(state.p5ImagePixelLength === EXPECTED_ASSET.width * EXPECTED_ASSET.height * 4,
      'p5 image pixel buffer length is not the decoded 960x640 RGBA source');
    recomputeRoute();
    state.initialRouteRiskScore = state.routeRiskScore;
    updateProbeEvidence();
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
      && state.sampledCyanSignalRange > .1
      && state.flowVectorCount === SAMPLE_PIXEL_COUNT
      && state.flowVectorChecksum > 0
      && state.flowMagnitudeRange > .1
      && state.hazardRange > .1
      && state.edgeSampleEvaluationCount === SAMPLE_PIXEL_COUNT * 4
      && state.rasterDrivenEvidenceReady;
    const renderEvidence = sketch instanceof p5
      && state.p5InstanceReady
      && state.p5CanvasReady
      && surface.querySelector('canvas')?.getContext('2d')
      && state.p5CompletedDrawCount > 0
      && state.p5ImageDrawCount > 0
      && state.streamlineDrawCount >= STREAMLINE_COUNT
      && state.streamlineSegmentDrawCount > 400
      && state.routeSegmentDrawCount >= ROUTE_STEPS - 1
      && state.renderedSampleCount > 1000
      && state.renderedPixelChecksum > 0
      && state.renderedLuminanceRange > 40;
    const routeEvidence = state.routePointCount === ROUTE_STEPS
      && state.routeRecomputeCount >= 1
      && state.routeCandidateEvaluationCount >= 165
      && state.routePixelEvaluationCount >= ROUTE_STEPS
      && state.routeChecksum > 0
      && state.routeRiskScore >= 0
      && state.routeRiskScore <= 100
      && state.safestRouteRiskScore >= 0
      && state.safestRouteRiskScore <= state.routeRiskScore
      && Number.isFinite(state.routeDistanceNm)
      && Number.isFinite(state.routeAssistPercent);
    state.runtimeAssertionPassed = Boolean(
      window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.dataset.previewMechanism === 'p5-raster-sampled-ocean-current-route-field'
      && state.task === 'human-operated-north-atlantic-passage-current-and-grounding-risk-routing'
      && state.claimedLibrary === 'p5@2.3.0'
      && state.mechanism === 'same-origin-image-pixels-drive-p5-flow-vector-ribbons-grounding-risk-and-human-rerouted-passage'
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
      && routeEvidence
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
