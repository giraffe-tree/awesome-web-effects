import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-07/stencil-text-scanline-window/registration-proof-sheet.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = Object.freeze({
  bytes: 246388,
  width: 960,
  height: 640,
  sha256: '36471dadbf8888ddf16ae2b68156b39e587f3a4bb323f76f9b8456903c42a7e4',
});
const SAMPLE_WIDTH = 192;
const SAMPLE_HEIGHT = 128;
const SAMPLE_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const INITIAL = Object.freeze({ u: .16, v: .5 });
const INK_NAMES = ['paper', 'black', 'cyan', 'red', 'yellow', 'blue', 'neutral'];
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = value => Number(value.toFixed(5));

try {
  const stage = document.querySelector('#registration-stage');
  const proofImage = document.querySelector('#proof-image');
  const sourceState = document.querySelector('#source-state');
  const gateReadout = document.querySelector('#gate-readout');
  const defectLayer = document.querySelector('#defect-layer');
  const inkReadout = document.querySelector('#ink-readout');
  const riskReadout = document.querySelector('#risk-readout');
  const targetReadout = document.querySelector('#target-readout');
  const scanRange = document.querySelector('#scan-range');
  const actionButtons = [...document.querySelectorAll('[data-action]')];
  const ledger = document.querySelector('#runtime-ledger');

  const sampledPixels = new Uint8ClampedArray(SAMPLE_COUNT * 4);
  const inkField = new Uint8Array(SAMPLE_COUNT);
  const edgeField = new Float32Array(SAMPLE_COUNT);
  const inkCounts = new Uint32Array(INK_NAMES.length);
  const inkTotals = INK_NAMES.map(() => ({ red: 0, green: 0, blue: 0, count: 0 }));
  const inspectedTargets = new Set();
  const visitedBins = new Set();
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'stencil-text-scanline-window',
    task: 'human-operated-pixel-derived-print-registration-gate',
    claimedLibrary: 'motion@12.42.2',
    renderer: 'dom',
    mechanism: 'human-seeks-a-paused-motion-control-synchronized-to-css-clipped-stencil-window-over-browser-decoded-proof-pixels',
    assetMechanismRole: 'decoded-proof-pixels-determine-ink-palette-defect-targets-live-scan-metrics-and-approval-disposition',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'visible-range', 'visible-buttons'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    motionControlReady: false,
    motionDuration: 0,
    motionTime: INITIAL.u,
    motionProgress: INITIAL.u,
    motionSyncError: 0,
    maximumMotionSyncError: 0,
    nonInputVisualMutationCountAfterReady: 0,
    reducedMotion: reducedMotionQuery.matches,
    ready: false,
    scanU: INITIAL.u,
    scanV: INITIAL.v,
    initialScanU: INITIAL.u,
    initialScanV: INITIAL.v,
    minimumHumanU: INITIAL.u,
    maximumHumanU: INITIAL.u,
    maximumHumanTravel: 0,
    activeInkId: 0,
    activeInkName: 'paper',
    activeInkRgb: [238, 229, 209],
    localEdgeRisk: 0,
    localInkCoverage: 0,
    nearestDefectId: null,
    nearestDefectDistance: 1,
    approvalState: 'unreviewed',
    lastEvaluatedDisposition: 'none',
    sourceDisposition: 'pending',
    sourceDispositionThreshold: 71,
    evaluationCount: 0,
    incompleteEvaluationCount: 0,
    holdEvaluationCount: 0,
    passEvaluationCount: 0,
    resetCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerEnterCount: 0,
    hoverMoveCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    pointerTypesSeen: [],
    keyboardInputCount: 0,
    keyboardMutationCount: 0,
    rangeInputCount: 0,
    rangeMutationCount: 0,
    buttonActivationCount: 0,
    buttonMutationCount: 0,
    humanVisualMutationCount: 0,
    humanInputCausalityCount: 0,
    scanMetricReadCount: 0,
    scanCoverageBinCount: 0,
    maximumScanCoverageBinCount: 0,
    inspectedTargetCount: 0,
    maximumInspectedTargetCount: 0,
    inspectedTargetIds: [],
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    firstHumanStateBefore: null,
    firstHumanStateAfter: null,
    activePointerId: null,
    pointerCaptured: false,
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
    sampleWidth: SAMPLE_WIDTH,
    sampleHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sampledPixelSha256: '',
    sampledPixelChecksum: '',
    distinctQuantizedColorCount: 0,
    opaquePixelCount: 0,
    minimumLuma: 255,
    maximumLuma: 0,
    lumaRange: 0,
    inkCategoryCounts: [],
    nonEmptyInkCategoryCount: 0,
    paletteRgb: {},
    edgeMinimum: 1,
    edgeMaximum: 0,
    edgeRange: 0,
    defectTargetCount: 0,
    defectTargets: [],
    defectDetectionCandidateCount: 0,
    defectSpatialSeparationMinimum: 0,
    globalDefectSeverity: 0,
    assetEvidenceReady: false,
    pixelEvidenceReady: false,
    stageWidth: 0,
    stageHeight: 0,
    stageCoverageRatio: 0,
    proofCoverageRatio: 0,
    responsiveResizeCount: 0,
    initialVisualSignature: '',
    repeatedInitialVisualSignature: '',
    initialStillVerified: false,
    visualRenderCount: 0,
    previewRenderInvocationCount: 0,
    runtimeAssertionPassed: false,
    interactionRecords: [],
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__STENCIL_REGISTRATION_STATE__ = state;

  let dirty = true;
  let drag = null;
  let resizeFrame = 0;
  let sourceImage = null;
  let defectMarkers = [];
  const motionProbeTarget = { value: INITIAL.u };
  const scanMotion = animate(motionProbeTarget, { value: [0, 1] }, {
    duration: 1,
    ease: 'linear',
    autoplay: false,
  });
  scanMotion.pause();
  scanMotion.time = INITIAL.u;
  state.motionControlReady = typeof scanMotion.pause === 'function' && typeof scanMotion.time === 'number';
  state.motionDuration = scanMotion.duration;

  function invariant(condition, message) {
    if (!condition) throw new Error(`stencil-text-scanline-window: ${message}`);
  }

  async function digestHex(buffer) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function pixelChecksum(bytes) {
    let signature = 2166136261;
    for (let index = 0; index < bytes.length; index += 1) {
      signature ^= bytes[index];
      signature = Math.imul(signature, 16777619) >>> 0;
    }
    return signature.toString(16).padStart(8, '0');
  }

  function lumaOf(red, green, blue) {
    return red * .2126 + green * .7152 + blue * .0722;
  }

  function classifyInk(red, green, blue) {
    const luma = lumaOf(red, green, blue);
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const chroma = maximum - minimum;
    if (luma < 55) return 1;
    if (red > 145 && green > 92 && blue < 112 && red > blue * 1.62 && green > blue * 1.22) return 4;
    if (red > 124 && red > green * 1.34 && red > blue * 1.3) return 3;
    if (green > 75 && blue > 72 && red < 105 && green > red * 1.16
      && blue > red * 1.15 && Math.abs(blue - green) < 52) return 2;
    if (blue > 76 && blue > red * 1.28 && blue > green * 1.08) return 5;
    if (luma > 172 && chroma < 69) return 0;
    return 6;
  }

  function sampleIndex(x, y) {
    return Math.max(0, Math.min(SAMPLE_COUNT - 1,
      Math.max(0, Math.min(SAMPLE_HEIGHT - 1, y)) * SAMPLE_WIDTH
      + Math.max(0, Math.min(SAMPLE_WIDTH - 1, x))));
  }

  function sampledRgb(index) {
    const offset = index * 4;
    return [sampledPixels[offset], sampledPixels[offset + 1], sampledPixels[offset + 2]];
  }

  function averageRgb(total, fallback) {
    if (total.count === 0) return fallback;
    return [
      Math.round(total.red / total.count),
      Math.round(total.green / total.count),
      Math.round(total.blue / total.count),
    ];
  }

  function rgb(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }

  function analyzePixelField() {
    const distinct = new Set();
    let minimumLuma = 255;
    let maximumLuma = 0;
    let opaque = 0;

    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const [red, green, blue] = sampledRgb(index);
      const alpha = sampledPixels[index * 4 + 3];
      const ink = classifyInk(red, green, blue);
      const luma = lumaOf(red, green, blue);
      inkField[index] = ink;
      inkCounts[ink] += 1;
      inkTotals[ink].red += red;
      inkTotals[ink].green += green;
      inkTotals[ink].blue += blue;
      inkTotals[ink].count += 1;
      distinct.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
      minimumLuma = Math.min(minimumLuma, luma);
      maximumLuma = Math.max(maximumLuma, luma);
      if (alpha === 255) opaque += 1;
    }

    let edgeMinimum = 1;
    let edgeMaximum = 0;
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const index = sampleIndex(x, y);
        const [red, green, blue] = sampledRgb(index);
        const [rightRed, rightGreen, rightBlue] = sampledRgb(sampleIndex(x + 1, y));
        const [downRed, downGreen, downBlue] = sampledRgb(sampleIndex(x, y + 1));
        const horizontal = (Math.abs(red - rightRed) + Math.abs(green - rightGreen) + Math.abs(blue - rightBlue)) / 765;
        const vertical = (Math.abs(red - downRed) + Math.abs(green - downGreen) + Math.abs(blue - downBlue)) / 765;
        edgeField[index] = Math.min(1, (horizontal + vertical) * .72);
        edgeMinimum = Math.min(edgeMinimum, edgeField[index]);
        edgeMaximum = Math.max(edgeMaximum, edgeField[index]);
      }
    }

    state.sampledPixelCount = SAMPLE_COUNT;
    state.sampledPixelByteLength = sampledPixels.byteLength;
    state.sampledPixelChecksum = pixelChecksum(sampledPixels);
    state.distinctQuantizedColorCount = distinct.size;
    state.opaquePixelCount = opaque;
    state.minimumLuma = rounded(minimumLuma);
    state.maximumLuma = rounded(maximumLuma);
    state.lumaRange = rounded(maximumLuma - minimumLuma);
    state.inkCategoryCounts = [...inkCounts];
    state.nonEmptyInkCategoryCount = [...inkCounts].filter(count => count > 0).length;
    state.paletteRgb = Object.fromEntries(INK_NAMES.map((name, index) => [name, averageRgb(inkTotals[index], [128, 128, 128])]));
    state.edgeMinimum = rounded(edgeMinimum);
    state.edgeMaximum = rounded(edgeMaximum);
    state.edgeRange = rounded(edgeMaximum - edgeMinimum);
  }

  function neighborhoodScore(centerX, centerY) {
    if (inkField[sampleIndex(centerX, centerY)] !== 1) return -Infinity;
    const categories = new Set();
    let transitions = 0;
    let edgeSum = 0;
    let saturatedInkCount = 0;
    let blackCount = 0;
    let paperCount = 0;
    let samples = 0;
    const processCounts = new Uint16Array(4);
    for (let y = centerY - 6; y <= centerY + 6; y += 1) {
      for (let x = centerX - 6; x <= centerX + 6; x += 1) {
        const index = sampleIndex(x, y);
        const category = inkField[index];
        categories.add(category);
        edgeSum += edgeField[index];
        samples += 1;
        if (category >= 2 && category <= 5) {
          saturatedInkCount += 1;
          processCounts[category - 2] += 1;
        }
        if (category === 1) blackCount += 1;
        if (category === 0) paperCount += 1;
        if (x < centerX + 6 && category !== inkField[sampleIndex(x + 1, y)]) transitions += 1;
        if (y < centerY + 6 && category !== inkField[sampleIndex(x, y + 1)]) transitions += 1;
      }
    }
    const processCategoryCount = [...categories].filter(category => category >= 2 && category <= 5).length;
    const evidenceMix = Math.min(saturatedInkCount, blackCount * 2, paperCount * 2);
    if (processCategoryCount < 3 || blackCount === 0 || paperCount === 0
      || processCounts[0] < 2 || processCounts[1] < 2) return -Infinity;
    return processCategoryCount * 54
      + categories.size * 8
      + transitions * 1.35
      + edgeSum / samples * 80
      + evidenceMix * .42;
  }

  function detectDefectTargets() {
    const candidates = [];
    for (let y = 7; y < SAMPLE_HEIGHT - 3; y += 2) {
      for (let x = 7; x < SAMPLE_WIDTH - 7; x += 2) {
        candidates.push({ x, y, score: neighborhoodScore(x, y) });
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    state.defectDetectionCandidateCount = candidates.length;

    const targets = [];
    for (const candidate of candidates) {
      const farEnough = targets.every(target => Math.hypot(target.x - candidate.x, target.y - candidate.y) >= 28);
      if (!farEnough) continue;
      targets.push(candidate);
      if (targets.length === 4) break;
    }
    invariant(targets.length === 4, 'source pixels did not produce four separated registration targets');

    const maximumScore = Math.max(...targets.map(target => target.score));
    state.defectTargets = targets.map((target, index) => ({
      id: `R${index + 1}`,
      sampleX: target.x,
      sampleY: target.y,
      u: rounded(target.x / (SAMPLE_WIDTH - 1)),
      v: rounded(target.y / (SAMPLE_HEIGHT - 1)),
      rawScore: rounded(target.score),
      severity: rounded(target.score / maximumScore),
    }));
    state.defectTargetCount = state.defectTargets.length;
    state.globalDefectSeverity = rounded(
      state.defectTargets.reduce((sum, target) => sum + target.severity, 0) / state.defectTargets.length * 100,
    );
    state.sourceDisposition = state.globalDefectSeverity >= state.sourceDispositionThreshold ? 'hold' : 'pass';
    state.defectSpatialSeparationMinimum = rounded(Math.min(...state.defectTargets.flatMap((target, index) =>
      state.defectTargets.slice(index + 1).map(other => Math.hypot(target.sampleX - other.sampleX, target.sampleY - other.sampleY)))));
  }

  function buildDefectMarkers() {
    defectLayer.replaceChildren();
    defectMarkers = state.defectTargets.map(target => {
      const marker = document.createElement('span');
      marker.className = 'defect-marker';
      marker.dataset.targetId = target.id;
      marker.dataset.inspected = 'false';
      marker.innerHTML = `<small class="marker-label">${target.id}</small>`;
      defectLayer.append(marker);
      return { target, marker };
    });
  }

  function sourceToStage(target) {
    const stageWidth = Math.max(1, stage.clientWidth);
    const stageHeight = Math.max(1, stage.clientHeight);
    const scale = Math.max(stageWidth / EXPECTED_ASSET.width, stageHeight / EXPECTED_ASSET.height);
    const offsetX = (stageWidth - EXPECTED_ASSET.width * scale) / 2;
    const offsetY = (stageHeight - EXPECTED_ASSET.height * scale) / 2;
    return {
      x: offsetX + target.u * EXPECTED_ASSET.width * scale,
      y: offsetY + target.v * EXPECTED_ASSET.height * scale,
    };
  }

  function layoutDefectMarkers() {
    defectMarkers.forEach(({ target, marker }) => {
      const point = sourceToStage(target);
      marker.style.left = `${point.x}px`;
      marker.style.top = `${point.y}px`;
    });
  }

  function stagePointToSample(u, v) {
    const stageWidth = Math.max(1, stage.clientWidth);
    const stageHeight = Math.max(1, stage.clientHeight);
    const scale = Math.max(stageWidth / EXPECTED_ASSET.width, stageHeight / EXPECTED_ASSET.height);
    const offsetX = (stageWidth - EXPECTED_ASSET.width * scale) / 2;
    const offsetY = (stageHeight - EXPECTED_ASSET.height * scale) / 2;
    const sourceX = clamp((u * stageWidth - offsetX) / (EXPECTED_ASSET.width * scale));
    const sourceY = clamp((v * stageHeight - offsetY) / (EXPECTED_ASSET.height * scale));
    return {
      x: Math.round(sourceX * (SAMPLE_WIDTH - 1)),
      y: Math.round(sourceY * (SAMPLE_HEIGHT - 1)),
    };
  }

  function inspectCurrentPoint() {
    const sample = stagePointToSample(state.scanU, state.scanV);
    const centerIndex = sampleIndex(sample.x, sample.y);
    const localCounts = new Uint32Array(INK_NAMES.length);
    let edgeSum = 0;
    let samples = 0;
    for (let y = sample.y - 3; y <= sample.y + 3; y += 1) {
      for (let x = sample.x - 3; x <= sample.x + 3; x += 1) {
        const index = sampleIndex(x, y);
        localCounts[inkField[index]] += 1;
        edgeSum += edgeField[index];
        samples += 1;
      }
    }

    const activeInkId = inkField[centerIndex];
    state.activeInkId = activeInkId;
    state.activeInkName = INK_NAMES[activeInkId];
    state.activeInkRgb = sampledRgb(centerIndex);
    state.localEdgeRisk = rounded(edgeSum / samples * 100);
    state.localInkCoverage = rounded((samples - localCounts[0]) / samples * 100);
    state.scanMetricReadCount += 1;

    let nearest = null;
    let nearestDistance = Infinity;
    state.defectTargets.forEach(target => {
      const distance = Math.hypot(target.sampleX - sample.x, target.sampleY - sample.y)
        / Math.hypot(SAMPLE_WIDTH, SAMPLE_HEIGHT);
      if (distance < nearestDistance) {
        nearest = target;
        nearestDistance = distance;
      }
      const verticalGateDistance = Math.abs(target.sampleX - sample.x) / SAMPLE_WIDTH;
      if (verticalGateDistance <= .052) inspectedTargets.add(target.id);
    });
    state.nearestDefectId = nearest?.id || null;
    state.nearestDefectDistance = rounded(nearestDistance);
    state.inspectedTargetIds = [...inspectedTargets];
    state.inspectedTargetCount = inspectedTargets.size;
    visitedBins.add(Math.min(11, Math.floor(state.scanU * 12)));
    state.scanCoverageBinCount = visitedBins.size;
    state.maximumInspectedTargetCount = Math.max(state.maximumInspectedTargetCount, state.inspectedTargetCount);
    state.maximumScanCoverageBinCount = Math.max(state.maximumScanCoverageBinCount, state.scanCoverageBinCount);
  }

  function applyPixelPalette() {
    const root = stage.style;
    root.setProperty('--cyan', rgb(state.paletteRgb.cyan));
    root.setProperty('--red', rgb(state.paletteRgb.red));
    root.setProperty('--yellow', rgb(state.paletteRgb.yellow));
    root.setProperty('--blue', rgb(state.paletteRgb.blue));
    root.setProperty('--paper', rgb(state.paletteRgb.paper));
    root.setProperty('--ink', rgb(state.paletteRgb.black));
  }

  function visualSignature() {
    return [
      state.scanU.toFixed(5),
      state.scanV.toFixed(5),
      state.activeInkId,
      state.localEdgeRisk.toFixed(5),
      state.localInkCoverage.toFixed(5),
      state.approvalState,
      state.inspectedTargetIds.join(','),
    ].join('|');
  }

  function syncInterface() {
    scanMotion.time = state.scanU;
    state.motionTime = rounded(scanMotion.time);
    state.motionProgress = state.motionTime;
    state.motionSyncError = rounded(Math.abs(state.motionTime - state.scanU));
    state.maximumMotionSyncError = Math.max(state.maximumMotionSyncError, state.motionSyncError);
    const active = state.activeInkRgb;
    const readableActive = state.activeInkName === 'paper' || state.activeInkName === 'yellow'
      ? state.paletteRgb.yellow
      : active;
    stage.style.setProperty('--active-ink', rgb(readableActive));
    stage.style.setProperty('--active-soft', `rgba(${readableActive[0]}, ${readableActive[1]}, ${readableActive[2]}, .32)`);
    stage.style.setProperty('--scan-x', `${state.scanU * 100}%`);
    stage.style.setProperty('--probe-y', `${state.scanV * 100}%`);
    stage.style.setProperty('--history-right', `${(1 - state.scanU) * 100}%`);
    stage.style.setProperty('--window-left', `${clamp(state.scanU - .055) * 100}%`);
    stage.style.setProperty('--window-right', `${(1 - clamp(state.scanU + .055)) * 100}%`);
    scanRange.value = String(Math.round(state.scanU * 100));
    inkReadout.textContent = state.activeInkName;
    riskReadout.textContent = `${Math.round(state.localEdgeRisk)} / 100`;
    targetReadout.textContent = `${state.inspectedTargetCount} / ${state.defectTargetCount}`;
    sourceState.textContent = `${state.defectTargetCount} targets · source verified`;

    defectMarkers.forEach(({ target, marker }) => {
      marker.dataset.inspected = String(inspectedTargets.has(target.id));
    });

    if (state.approvalState === 'unreviewed') {
      gateReadout.innerHTML = `<b>Inspection open</b> · ${state.scanCoverageBinCount}/12 bands · scan all targets`;
    } else if (state.approvalState === 'incomplete') {
      gateReadout.innerHTML = `<b>Need more evidence</b> · ${state.inspectedTargetCount}/4 targets · continue scan`;
    } else if (state.approvalState === 'hold') {
      gateReadout.innerHTML = `<b>Hold for register</b> · pixel risk ${Math.round(state.globalDefectSeverity)} · offset found`;
    } else {
      gateReadout.innerHTML = `<b>Pass to press</b> · pixel risk ${Math.round(state.globalDefectSeverity)} · within gate`;
    }

    ledger.value = JSON.stringify({
      sourceSha256: state.assetSha256,
      sampledPixelSha256: state.sampledPixelSha256,
      palette: state.paletteRgb,
      defectTargets: state.defectTargets,
      sourceDisposition: state.sourceDisposition,
      scan: {
        u: rounded(state.scanU),
        v: rounded(state.scanV),
        activeInk: state.activeInkName,
        localEdgeRisk: state.localEdgeRisk,
        inspectedTargetIds: state.inspectedTargetIds,
        coverageBins: state.scanCoverageBinCount,
        maximumInspectedTargetCount: state.maximumInspectedTargetCount,
        maximumCoverageBins: state.maximumScanCoverageBinCount,
      },
      approvalState: state.approvalState,
      lastEvaluatedDisposition: state.lastEvaluatedDisposition,
    });
  }

  function render() {
    state.previewRenderInvocationCount += 1;
    if (!dirty || !state.pixelEvidenceReady) return;
    inspectCurrentPoint();
    syncInterface();
    state.visualRenderCount += 1;
    dirty = false;
  }

  function evaluateProof() {
    state.evaluationCount += 1;
    state.approvalState = state.inspectedTargetCount === 4 && state.scanCoverageBinCount >= 6
      ? state.sourceDisposition
      : 'incomplete';
    state.lastEvaluatedDisposition = state.approvalState;
    if (state.approvalState === 'incomplete') state.incompleteEvaluationCount += 1;
    else if (state.approvalState === 'hold') state.holdEvaluationCount += 1;
    else state.passEvaluationCount += 1;
  }

  function recordInput(kind, event, before, after) {
    state.lastInputKind = kind;
    state.lastInputTrusted = event.isTrusted;
    state.lastPointerType = event.pointerType || state.lastPointerType;
    if (event.pointerType && !state.pointerTypesSeen.includes(event.pointerType)) state.pointerTypesSeen.push(event.pointerType);
    state.interactionRecords.push({
      kind,
      pointerType: event.pointerType || null,
      trusted: event.isTrusted,
      before,
      after,
    });
    if (state.interactionRecords.length > 48) state.interactionRecords.shift();
  }

  function mutateFromTrustedInput(event, kind, mutation) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    const before = visualSignature();
    if (state.firstHumanStateBefore === null) state.firstHumanStateBefore = before;
    mutation();
    state.approvalState = 'unreviewed';
    dirty = true;
    render();
    const after = visualSignature();
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (before !== after) {
      state.humanVisualMutationCount += 1;
      state.humanInputCausalityCount += 1;
      state.minimumHumanU = Math.min(state.minimumHumanU, state.scanU);
      state.maximumHumanU = Math.max(state.maximumHumanU, state.scanU);
      state.maximumHumanTravel = Math.max(state.maximumHumanTravel, Math.abs(state.scanU - INITIAL.u));
    }
    if (state.firstHumanStateAfter === null) state.firstHumanStateAfter = after;
    recordInput(kind, event, before, after);
    return before !== after;
  }

  function pointerCoordinates(event) {
    const rect = stage.getBoundingClientRect();
    return {
      u: clamp((event.clientX - rect.left) / Math.max(1, rect.width)),
      v: clamp((event.clientY - rect.top) / Math.max(1, rect.height)),
    };
  }

  function updateFromPointer(event, kind) {
    const point = pointerCoordinates(event);
    return mutateFromTrustedInput(event, kind, () => {
      state.scanU = point.u;
      state.scanV = point.v;
    });
  }

  stage.addEventListener('pointerenter', event => {
    if (event.target.closest('.controls')) return;
    state.pointerEnterCount += 1;
    if (event.pointerType === 'mouse') updateFromPointer(event, 'pointer-hover-enter');
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest('.controls')) return;
    if (drag && drag.pointerId === event.pointerId) {
      state.pointerMoveCount += 1;
      updateFromPointer(event, `captured-${event.pointerType || 'pointer'}-drag`);
    } else if (!drag && event.pointerType === 'mouse') {
      state.hoverMoveCount += 1;
      updateFromPointer(event, 'pointer-hover-move');
    }
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('.controls') || event.button > 0) return;
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return;
    }
    state.pointerDownCount += 1;
    drag = { pointerId: event.pointerId };
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    updateFromPointer(event, `captured-${event.pointerType || 'pointer'}-down`);
  });

  function releasePointer(event, cancelled = false) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerUpCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    drag = null;
    state.activePointerId = null;
    state.pointerCaptured = false;
  }

  stage.addEventListener('pointerup', event => releasePointer(event));
  stage.addEventListener('pointercancel', event => releasePointer(event, true));

  stage.addEventListener('keydown', event => {
    if (event.target.closest('.controls')) return;
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return;
    }
    const key = event.key.toLowerCase();
    const before = visualSignature();
    if (event.key === 'ArrowLeft') state.scanU = clamp(state.scanU - .045);
    else if (event.key === 'ArrowRight') state.scanU = clamp(state.scanU + .045);
    else if (event.key === 'ArrowUp') state.scanV = clamp(state.scanV - .08);
    else if (event.key === 'ArrowDown') state.scanV = clamp(state.scanV + .08);
    else if (event.key === 'Home') state.scanU = 0;
    else if (event.key === 'End') state.scanU = 1;
    else if (key === 'r') {
      state.scanU = INITIAL.u;
      state.scanV = INITIAL.v;
      inspectedTargets.clear();
      visitedBins.clear();
      state.resetCount += 1;
    } else if (event.key === 'Enter' || event.key === ' ') {
      evaluateProof();
    } else return;

    event.preventDefault();
    state.approvalState = event.key === 'Enter' || event.key === ' ' ? state.approvalState : 'unreviewed';
    dirty = true;
    render();
    const after = visualSignature();
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.keyboardInputCount += 1;
    if (before !== after) {
      state.keyboardMutationCount += 1;
      state.humanVisualMutationCount += 1;
      state.humanInputCausalityCount += 1;
      state.minimumHumanU = Math.min(state.minimumHumanU, state.scanU);
      state.maximumHumanU = Math.max(state.maximumHumanU, state.scanU);
      state.maximumHumanTravel = Math.max(state.maximumHumanTravel, Math.abs(state.scanU - INITIAL.u));
    }
    recordInput(`keyboard-${key}`, event, before, after);
  });

  scanRange.addEventListener('input', event => {
    const changed = mutateFromTrustedInput(event, 'range-scan', () => {
      state.scanU = clamp(Number(scanRange.value) / 100);
    });
    state.rangeInputCount += 1;
    if (changed) state.rangeMutationCount += 1;
  });

  actionButtons.forEach(button => button.addEventListener('click', event => {
    const action = button.dataset.action;
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return;
    }
    const before = visualSignature();
    if (action === 'back') state.scanU = clamp(state.scanU - .08);
    else if (action === 'forward') state.scanU = clamp(state.scanU + .08);
    else if (action === 'evaluate') {
      evaluateProof();
    } else {
      state.scanU = INITIAL.u;
      state.scanV = INITIAL.v;
      inspectedTargets.clear();
      visitedBins.clear();
      state.approvalState = 'unreviewed';
      state.resetCount += 1;
    }
    dirty = true;
    render();
    const after = visualSignature();
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.buttonActivationCount += 1;
    if (before !== after) {
      state.buttonMutationCount += 1;
      state.humanVisualMutationCount += 1;
      state.humanInputCausalityCount += 1;
      state.minimumHumanU = Math.min(state.minimumHumanU, state.scanU);
      state.maximumHumanU = Math.max(state.maximumHumanU, state.scanU);
      state.maximumHumanTravel = Math.max(state.maximumHumanTravel, Math.abs(state.scanU - INITIAL.u));
    }
    recordInput(`button-${action}`, event, before, after);
    stage.focus({ preventScroll: true });
  }));

  async function loadAndAnalyzeAsset() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `registration proof request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;
    invariant(state.assetSameOrigin, 'registration proof was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'registration proof SHA-256 differs from the committed asset');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    sourceImage = new Image();
    sourceImage.src = objectUrl;
    try {
      await sourceImage.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = sourceImage.naturalWidth;
      state.sourceNaturalHeight = sourceImage.naturalHeight;
      invariant(state.sourceNaturalWidth === EXPECTED_ASSET.width && state.sourceNaturalHeight === EXPECTED_ASSET.height,
        'browser-decoded registration proof dimensions are not 960x640');

      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_WIDTH;
      canvas.height = SAMPLE_HEIGHT;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      invariant(context instanceof CanvasRenderingContext2D, '2D sample canvas is unavailable');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(sourceImage, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      sampledPixels.set(context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data);
      state.sampledPixelSha256 = await digestHex(sampledPixels);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    proofImage.src = ASSET_URL;
    await proofImage.decode();
    analyzePixelField();
    detectDefectTargets();
    buildDefectMarkers();
    applyPixelPalette();
    state.assetEvidenceReady = true;
    state.pixelEvidenceReady = true;
  }

  function measureStage() {
    const rect = stage.getBoundingClientRect();
    const proofRect = proofImage.getBoundingClientRect();
    state.stageWidth = Math.round(rect.width);
    state.stageHeight = Math.round(rect.height);
    state.stageCoverageRatio = rounded(rect.width * rect.height / Math.max(1, innerWidth * innerHeight));
    state.proofCoverageRatio = rounded(proofRect.width * proofRect.height / Math.max(1, rect.width * rect.height));
    layoutDefectMarkers();
  }

  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.responsiveResizeCount += 1;
      measureStage();
      dirty = true;
      render();
    });
  }).observe(stage);

  const ready = Promise.all([loadAndAnalyzeAsset(), document.fonts.ready]).then(() => {
    measureStage();
    dirty = true;
    render();
    state.initialVisualSignature = visualSignature();
    dirty = true;
    render();
    state.repeatedInitialVisualSignature = visualSignature();
    state.initialStillVerified = state.initialVisualSignature === state.repeatedInitialVisualSignature;
    state.ready = true;
    syncInterface();
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const categoryTotal = state.inkCategoryCounts.reduce((sum, count) => sum + count, 0);
    const realAsset = state.assetEvidenceReady
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetMimeType.includes('image/jpeg')
      && state.assetSameOrigin
      && state.assetByteLength === EXPECTED_ASSET.bytes
      && state.assetShaMatchesExpected
      && state.assetSha256 === EXPECTED_ASSET.sha256
      && state.browserImageDecoded
      && state.sourceNaturalWidth === EXPECTED_ASSET.width
      && state.sourceNaturalHeight === EXPECTED_ASSET.height
      && proofImage.complete
      && proofImage.naturalWidth === EXPECTED_ASSET.width
      && proofImage.naturalHeight === EXPECTED_ASSET.height;
    const pixelDerivedEvidence = state.pixelEvidenceReady
      && state.sampledPixelCount === SAMPLE_COUNT
      && state.sampledPixelByteLength === SAMPLE_COUNT * 4
      && typeof state.sampledPixelSha256 === 'string'
      && state.sampledPixelSha256.length === 64
      && !/^0+$/.test(state.sampledPixelSha256)
      && typeof state.sampledPixelChecksum === 'string'
      && state.sampledPixelChecksum.length === 8
      && state.opaquePixelCount === SAMPLE_COUNT
      && state.distinctQuantizedColorCount > 180
      && state.lumaRange > 175
      && categoryTotal === SAMPLE_COUNT
      && state.nonEmptyInkCategoryCount >= 6
      && state.inkCategoryCounts.slice(1, 6).every(count => count > 35)
      && state.edgeRange > .55
      && state.defectDetectionCandidateCount > 4500
      && state.defectTargetCount === 4
      && state.defectTargets.every(target => target.severity > .45 && target.rawScore > 0)
      && state.defectSpatialSeparationMinimum >= 28
      && state.globalDefectSeverity > 60
      && ['hold', 'pass'].includes(state.sourceDisposition)
      && state.paletteRgb.cyan.length === 3
      && state.paletteRgb.red.length === 3
      && state.paletteRgb.yellow.length === 3
      && state.paletteRgb.blue.length === 3;
    const honestInteraction = state.task === 'human-operated-pixel-derived-print-registration-gate'
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.renderIgnoresPreviewClock
      && state.previewClockMutationCount === 0
      && state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && state.lastInputTrusted !== false;
    const realCssMechanism = CSS.supports('clip-path', 'inset(0 20% 0 10%)')
      && CSS.supports('background-clip', 'text')
      && getComputedStyle(document.querySelector('.stencil-window')).clipPath.includes('inset')
      && getComputedStyle(document.querySelector('.stencil-history')).backgroundImage.includes('registration-proof-sheet')
      && state.motionControlReady
      && state.motionDuration === 1
      && state.motionSyncError < .0001
      && state.maximumMotionSyncError < .0001
      && stage.dataset.previewMechanism === 'css-pixel-derived-human-stencil-scanline';
    const responsive = state.stageWidth === innerWidth
      && state.stageHeight === innerHeight
      && state.stageCoverageRatio > .99
      && state.proofCoverageRatio > .99;
    const initialOrHumanDriven = state.inputCount === 0
      ? state.humanVisualMutationCount === 0
        && state.scanU === INITIAL.u
        && state.scanV === INITIAL.v
        && state.approvalState === 'unreviewed'
      : state.trustedInputCount === state.inputCount
        && state.humanVisualMutationCount > 0
        && state.humanInputCausalityCount === state.humanVisualMutationCount
        && state.scanMetricReadCount > 2
        && state.maximumHumanTravel > .001;
    const sourceDrivenApproval = state.evaluationCount === 0
      || (['unreviewed', 'incomplete', state.sourceDisposition].includes(state.approvalState)
        && ['incomplete', state.sourceDisposition].includes(state.lastEvaluatedDisposition)
        && state.holdEvaluationCount + state.passEvaluationCount + state.incompleteEvaluationCount === state.evaluationCount);
    const result = Boolean(state.ready
      && realAsset
      && pixelDerivedEvidence
      && honestInteraction
      && realCssMechanism
      && responsive
      && initialOrHumanDriven
      && sourceDrivenApproval
      && window.__PREVIEW_META__?.id === state.id
      && window.__PREVIEW_META__?.library === state.claimedLibrary
      && window.__PREVIEW_META__?.renderer === state.renderer
      && window.__PREVIEW_INTERACTION_STATE__ === state);
    state.runtimeAssertionPassed = result;
    stage.dataset.runtimeAssert = String(result);
    syncInterface();
    return result;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: state.renderer,
    render: () => render(),
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
