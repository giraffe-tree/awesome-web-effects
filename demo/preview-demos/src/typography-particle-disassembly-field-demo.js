import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const INITIAL_PROGRESS = 0.08;
const SAMPLE_WIDTH = 120;
const SAMPLE_HEIGHT = 80;
const MASK_WIDTH = 400;
const MASK_HEIGHT = 240;
const EXPECTED_ASSET_SHA256 = '222c86cc8eac6ed3b369dc4e14053f3c0f40d495eeb3da2672b6a74ad8ed7141';
const ASSET_URL = new URL(
  '../assets/aesthetic-wave-09/typography-particle-disassembly-field/low-tide-release-environment-source.jpg',
  import.meta.url,
).href;

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const round = (value, digits = 4) => Number(value.toFixed(digits));
const smoothstep = value => {
  const amount = clamp(value);
  return amount * amount * (3 - 2 * amount);
};

function fnv1a(values, stride = 1) {
  let checksum = 2166136261;
  for (let index = 0; index < values.length; index += stride) {
    checksum ^= Number(values[index]) & 255;
    checksum = Math.imul(checksum, 16777619) >>> 0;
  }
  return checksum >>> 0;
}

function deterministic(index, salt = 0) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function createGlyphParticles() {
  const canvas = document.createElement('canvas');
  canvas.width = MASK_WIDTH;
  canvas.height = MASK_HEIGHT;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.clearRect(0, 0, MASK_WIDTH, MASK_HEIGHT);
  context.fillStyle = '#fff';
  context.font = '950 108px Arial, Helvetica, sans-serif';
  context.textBaseline = 'alphabetic';
  context.fillText('LOW', 0, 101);
  context.fillText('TIDE', 0, 219);
  const pixels = context.getImageData(0, 0, MASK_WIDTH, MASK_HEIGHT).data;
  const particles = [];

  for (let y = 0; y < MASK_HEIGHT; y += 3) {
    for (let x = 0; x < MASK_WIDTH; x += 3) {
      const alpha = pixels[(y * MASK_WIDTH + x) * 4 + 3];
      if (alpha < 96) continue;
      const index = particles.length;
      particles.push({
        sourceX: 0.055 + (x / MASK_WIDTH) * 0.405,
        sourceY: 0.19 + (y / MASK_HEIGHT) * 0.64,
        seedA: deterministic(index, 2),
        seedB: deterministic(index, 7),
        seedC: deterministic(index, 13),
        alpha: alpha / 255,
      });
    }
  }
  return particles;
}

try {
  const stage = document.querySelector('#release-stage');
  const surface = document.querySelector('#particle-surface');
  const range = document.querySelector('#disassembly-mix');
  const mixReadout = document.querySelector('#mix-readout');
  const publishState = document.querySelector('#publish-state');
  const releaseScore = document.querySelector('#release-score');
  const releaseConclusion = document.querySelector('#release-conclusion');
  const readabilityReadout = document.querySelector('#readability-readout');
  const integrationReadout = document.querySelector('#integration-readout');
  const probeTone = document.querySelector('#probe-tone');
  const probeDensity = document.querySelector('#probe-density');
  const runtimeLedger = document.querySelector('#runtime-ledger');
  const actionButtons = [...document.querySelectorAll('[data-release-action]')];
  const glyphParticles = createGlyphParticles();
  let sourceImage;
  let verifiedObjectUrl = '';
  let p5Image;
  let sketch;
  let canvas;
  let samplePixels;
  let sampleMetrics = [];
  let targetCandidates = [];
  let dirty = true;
  let firstDrawPending = true;
  let activePointerId = null;
  let dragStartClientX = 0;
  let dragStartProgress = INITIAL_PROGRESS;

  const state = {
    id: 'typography-particle-disassembly-field',
    task: 'human-operated-music-release-title-to-environment-particle-compositor',
    claimedLibrary: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'glyph-mask-pixels-interpolate-to-same-origin-raster-edge-targets-colors-and-release-judgment',
    acceptedInputs: [
      'mouse-hover',
      'captured-mouse-drag',
      'captured-touch-drag',
      'captured-pen-drag',
      'keyboard',
      'range-control',
      'visible-buttons',
    ],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticPath: false,
    automaticPlayback: false,
    automaticFallback: false,
    rehearsalMode: false,
    syntheticInputDispatch: false,
    previewClockDriven: false,
    previewClockMutation: false,
    renderIgnoresPreviewClock: true,
    initialProgress: INITIAL_PROGRESS,
    progress: INITIAL_PROGRESS,
    approved: false,
    probeU: 0.74,
    probeV: 0.42,
    activePointerType: 'none',
    pointerCaptured: false,
    ready: false,
    listenersBound: false,
    initialStillVerified: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedCount: 0,
    hoverInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    keyboardInputCount: 0,
    rangeInputCount: 0,
    buttonActivationCount: 0,
    balanceActivationCount: 0,
    approveActivationCount: 0,
    resetActivationCount: 0,
    approvalBlockedCount: 0,
    progressMutationCount: 0,
    probeMutationCount: 0,
    approvedMutationCount: 0,
    nonInputMutationCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    interactionRecords: [],
    assetUrl: ASSET_URL,
    assetFetchCount: 0,
    assetFetchStatus: 0,
    assetMimeType: '',
    assetByteLength: 0,
    assetSha256: '',
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    assetChecksumVerified: false,
    assetDecodeCount: 0,
    assetDecoded: false,
    assetNaturalWidth: 0,
    assetNaturalHeight: 0,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sampledPixelChecksum: 0,
    sampledLuminanceRange: 0,
    sampledEdgeMean: 0,
    sampledEdgeMaximum: 0,
    sampledChromaMean: 0,
    p5ImageLoaded: false,
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    glyphParticleCount: glyphParticles.length,
    targetCandidateCount: 0,
    targetAssignmentCount: 0,
    uniqueTargetCount: 0,
    particleTargetChecksum: 0,
    targetQualityScore: 0,
    recommendedProgress: 0,
    recommendedScore: 0,
    publishScore: 0,
    readabilityScore: 0,
    integrationScore: 0,
    p5CanvasCreated: false,
    p5DrawCount: 0,
    p5ImageDrawCount: 0,
    particleDrawCount: 0,
    renderedSampleCount: 0,
    renderedPixelChecksum: 0,
    renderedLuminanceRange: 0,
    resizeCount: 0,
    redrawRequestCount: 0,
    previewRenderCalls: 0,
    previewRenderMutationCount: 0,
    lastRedrawReason: 'bootstrap',
    lastInputVisualChecksumBefore: 0,
    lastInputVisualChecksumAfter: 0,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__TYPOGRAPHY_PARTICLE_FIELD_STATE__ = state;

  function updateDataset() {
    stage.dataset.progress = state.progress.toFixed(4);
    stage.dataset.approved = String(state.approved);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.progressMutationCount = String(state.progressMutationCount);
    stage.dataset.probeMutationCount = String(state.probeMutationCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.assetChecksumVerified = String(state.assetChecksumVerified);
    stage.dataset.automaticPath = String(state.automaticPath);
    stage.dataset.previewClockMutation = String(state.previewClockMutation);
    stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__?.() === true);
    runtimeLedger.dataset.assetSha256 = state.assetSha256;
    runtimeLedger.dataset.assetByteLength = String(state.assetByteLength);
    runtimeLedger.dataset.sampledPixelChecksum = String(state.sampledPixelChecksum);
    runtimeLedger.dataset.sampledLuminanceRange = String(state.sampledLuminanceRange);
    runtimeLedger.dataset.sampledEdgeMean = String(state.sampledEdgeMean);
    runtimeLedger.dataset.sampledEdgeMaximum = String(state.sampledEdgeMaximum);
    runtimeLedger.dataset.sampledChromaMean = String(state.sampledChromaMean);
    runtimeLedger.dataset.glyphParticleCount = String(state.glyphParticleCount);
    runtimeLedger.dataset.targetCandidateCount = String(state.targetCandidateCount);
    runtimeLedger.dataset.uniqueTargetCount = String(state.uniqueTargetCount);
    runtimeLedger.dataset.particleTargetChecksum = String(state.particleTargetChecksum);
    runtimeLedger.dataset.targetQualityScore = String(state.targetQualityScore);
    runtimeLedger.dataset.recommendedProgress = String(state.recommendedProgress);
    runtimeLedger.dataset.recommendedScore = String(state.recommendedScore);
    runtimeLedger.dataset.p5ImagePixelLength = String(state.p5ImagePixelLength);
    runtimeLedger.dataset.p5DrawCount = String(state.p5DrawCount);
    runtimeLedger.dataset.renderedPixelChecksum = String(state.renderedPixelChecksum);
    runtimeLedger.dataset.renderedLuminanceRange = String(state.renderedLuminanceRange);
    runtimeLedger.dataset.previewRenderMutationCount = String(state.previewRenderMutationCount);
    runtimeLedger.dataset.nonInputMutationCount = String(state.nonInputMutationCount);
  }

  function rejectUntrusted(event, source) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedCount += 1;
    state.lastInputTrusted = false;
    state.lastInputSource = source;
    updateDataset();
    return true;
  }

  function acceptInput(event, kind, source) {
    if (rejectUntrusted(event, source)) return false;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    if (kind === 'range') state.rangeInputCount += 1;
    if (kind === 'button') state.buttonActivationCount += 1;
    updateDataset();
    return true;
  }

  function requestDraw(reason) {
    dirty = true;
    state.redrawRequestCount += 1;
    state.lastRedrawReason = reason;
    sketch?.redraw();
  }

  function recordMutation(source, property, before, after) {
    state.interactionRecords.push({
      source,
      kind: state.lastInputKind,
      trusted: true,
      property,
      before: typeof before === 'number' ? round(before) : before,
      after: typeof after === 'number' ? round(after) : after,
    });
    if (state.interactionRecords.length > 48) state.interactionRecords.shift();
  }

  function scoringAt(progress) {
    const amount = clamp(progress);
    const readability = clamp(1 - 0.76 * Math.pow(amount, 1.24));
    const integration = clamp((0.22 + amount * 0.88) * state.targetQualityScore);
    const balance = Math.sin(Math.PI * amount) * (0.78 + state.targetQualityScore * 0.22);
    const score = clamp(readability * 0.45 + integration * 0.27 + balance * 0.28);
    return {
      readability: Math.round(readability * 100),
      integration: Math.round(integration * 100),
      score: Math.round(score * 100),
    };
  }

  function computeRecommendation() {
    let best = { progress: 0, score: -1 };
    for (let step = 0; step <= 100; step += 1) {
      const progress = step / 100;
      const result = scoringAt(progress);
      if (result.score > best.score) best = { progress, score: result.score };
    }
    state.recommendedProgress = best.progress;
    state.recommendedScore = best.score;
  }

  function updateInterface() {
    const metrics = scoringAt(state.progress);
    state.publishScore = metrics.score;
    state.readabilityScore = metrics.readability;
    state.integrationScore = metrics.integration;
    const percent = Math.round(state.progress * 100);
    range.value = String(percent);
    mixReadout.value = `${percent}%`;
    mixReadout.textContent = `${percent}%`;
    releaseScore.textContent = `${metrics.score}`;
    readabilityReadout.textContent = `Read ${metrics.readability}`;
    integrationReadout.textContent = `Fit ${metrics.integration}`;

    let conclusion = 'TITLE LOCKED';
    let warning = false;
    if (state.progress > 0.82) {
      conclusion = 'TITLE LOST';
      warning = true;
    } else if (metrics.score >= 72) {
      conclusion = 'RELEASE READY';
    } else if (state.progress >= 0.24) {
      conclusion = 'ATMOSPHERE LED';
    }
    releaseConclusion.textContent = conclusion;
    releaseConclusion.dataset.tone = warning ? 'warn' : 'ok';

    const approveButton = actionButtons.find(button => button.dataset.releaseAction === 'approve');
    approveButton.setAttribute('aria-pressed', String(state.approved));
    approveButton.textContent = state.approved ? 'Reopen' : 'Approve';
    if (state.approved) publishState.textContent = 'Chapter approved';
    else if (metrics.score >= 72) publishState.textContent = 'Ready for approval';
    else publishState.textContent = 'Draft / rebalance';
    runtimeLedger.textContent = `Verified raster ${state.assetNaturalWidth}×${state.assetNaturalHeight}; ${state.targetCandidateCount} edge targets; ${state.glyphParticleCount} title particles; human mix ${percent}%.`;
    updateDataset();
  }

  function setProgressFromTrustedInput(value, source, event) {
    if (event?.isTrusted !== true) {
      state.nonInputMutationCount += 1;
      updateDataset();
      return false;
    }
    const next = clamp(value);
    const before = state.progress;
    if (Math.abs(next - before) < 0.0001) return false;
    state.lastInputVisualChecksumBefore = state.renderedPixelChecksum;
    state.progress = next;
    state.progressMutationCount += 1;
    if (state.approved) {
      const approvedBefore = state.approved;
      state.approved = false;
      state.approvedMutationCount += 1;
      recordMutation(source, 'approved', approvedBefore, false);
    }
    recordMutation(source, 'progress', before, next);
    updateInterface();
    requestDraw(`trusted-${source}`);
    return true;
  }

  function setApprovedFromTrustedInput(value, source, event) {
    if (event?.isTrusted !== true) {
      state.nonInputMutationCount += 1;
      return false;
    }
    if (value && state.publishScore < 72) {
      state.approvalBlockedCount += 1;
      publishState.textContent = 'Rebalance required';
      updateDataset();
      return false;
    }
    const before = state.approved;
    if (before === value) return false;
    state.approved = value;
    state.approvedMutationCount += 1;
    recordMutation(source, 'approved', before, value);
    updateInterface();
    requestDraw(`trusted-${source}`);
    return true;
  }

  function sampleIndexForSource(u, v) {
    const x = clamp(Math.round(u * (SAMPLE_WIDTH - 1)), 0, SAMPLE_WIDTH - 1);
    const y = clamp(Math.round(v * (SAMPLE_HEIGHT - 1)), 0, SAMPLE_HEIGHT - 1);
    return y * SAMPLE_WIDTH + x;
  }

  function updateProbeFromTrustedInput(u, v, source, event) {
    if (event?.isTrusted !== true) {
      state.nonInputMutationCount += 1;
      return false;
    }
    const nextU = clamp(u);
    const nextV = clamp(v);
    if (Math.abs(nextU - state.probeU) < 0.003 && Math.abs(nextV - state.probeV) < 0.003) return false;
    const before = `${round(state.probeU, 3)},${round(state.probeV, 3)}`;
    state.probeU = nextU;
    state.probeV = nextV;
    state.probeMutationCount += 1;
    recordMutation(source, 'probe', before, `${round(nextU, 3)},${round(nextV, 3)}`);
    const metric = sampleMetrics[sampleIndexForSource(nextU, nextV)];
    if (metric) {
      const tone = metric.warm > 0.18 ? 'AMBER ROCK' : metric.blue > 0.2 ? 'SEA GLASS' : metric.luma < 54 ? 'BASALT' : 'SEA FOAM';
      probeTone.textContent = tone;
      probeDensity.textContent = `${String(Math.round(metric.edge * 100)).padStart(2, '0')} / 100`;
    }
    updateDataset();
    requestDraw(`trusted-${source}`);
    return true;
  }

  function sourcePointForClient(clientX, clientY) {
    const bounds = stage.getBoundingClientRect();
    const displayU = clamp((clientX - bounds.left) / Math.max(1, bounds.width));
    const displayV = clamp((clientY - bounds.top) / Math.max(1, bounds.height));
    const displayAspect = bounds.width / Math.max(1, bounds.height);
    const sourceAspect = 960 / 640;
    if (displayAspect >= sourceAspect) {
      const visibleHeight = 960 / displayAspect;
      const sourceY = (640 - visibleHeight) / 2 + displayV * visibleHeight;
      return { u: displayU, v: sourceY / 640 };
    }
    const visibleWidth = 640 * displayAspect;
    const sourceX = (960 - visibleWidth) / 2 + displayU * visibleWidth;
    return { u: sourceX / 960, v: displayV };
  }

  function displayPointForSource(u, v, width, height) {
    const displayAspect = width / Math.max(1, height);
    const sourceAspect = 960 / 640;
    if (displayAspect >= sourceAspect) {
      const visibleHeight = 960 / displayAspect;
      const sourceY = (640 - visibleHeight) / 2;
      return { x: u * width, y: ((v * 640 - sourceY) / visibleHeight) * height };
    }
    const visibleWidth = 640 * displayAspect;
    const sourceX = (960 - visibleWidth) / 2;
    return { x: ((u * 960 - sourceX) / visibleWidth) * width, y: v * height };
  }

  async function loadAndAnalyzeAsset() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetFetchStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    if (!response.ok) throw new Error(`Release environment request failed: HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    state.assetByteLength = buffer.byteLength;
    state.assetSha256 = await sha256(buffer);
    state.assetChecksumVerified = state.assetSha256 === EXPECTED_ASSET_SHA256;
    if (!state.assetChecksumVerified) throw new Error('Release environment checksum does not match the recorded local asset');

    verifiedObjectUrl = URL.createObjectURL(new Blob([buffer], { type: state.assetMimeType || 'image/jpeg' }));
    const image = new Image();
    image.decoding = 'async';
    image.src = verifiedObjectUrl;
    await image.decode();
    if (!image.complete || image.naturalWidth !== 960 || image.naturalHeight !== 640) {
      throw new Error(`Unexpected release environment dimensions: ${image.naturalWidth}×${image.naturalHeight}`);
    }
    state.assetDecodeCount += 1;
    state.assetDecoded = true;
    state.assetNaturalWidth = image.naturalWidth;
    state.assetNaturalHeight = image.naturalHeight;

    const sampler = document.createElement('canvas');
    sampler.width = SAMPLE_WIDTH;
    sampler.height = SAMPLE_HEIGHT;
    const context = sampler.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    samplePixels = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
    state.sampledPixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
    state.sampledByteLength = samplePixels.byteLength;
    state.sampledPixelChecksum = fnv1a(samplePixels);

    const luminance = new Float32Array(SAMPLE_WIDTH * SAMPLE_HEIGHT);
    let minimumLuminance = 255;
    let maximumLuminance = 0;
    for (let index = 0; index < luminance.length; index += 1) {
      const offset = index * 4;
      const value = samplePixels[offset] * 0.2126 + samplePixels[offset + 1] * 0.7152 + samplePixels[offset + 2] * 0.0722;
      luminance[index] = value;
      minimumLuminance = Math.min(minimumLuminance, value);
      maximumLuminance = Math.max(maximumLuminance, value);
    }

    let edgeSum = 0;
    let edgeMaximum = 0;
    let chromaSum = 0;
    const candidates = [];
    sampleMetrics = new Array(luminance.length);
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const index = y * SAMPLE_WIDTH + x;
        const offset = index * 4;
        const r = samplePixels[offset];
        const g = samplePixels[offset + 1];
        const b = samplePixels[offset + 2];
        const left = luminance[y * SAMPLE_WIDTH + Math.max(0, x - 1)];
        const right = luminance[y * SAMPLE_WIDTH + Math.min(SAMPLE_WIDTH - 1, x + 1)];
        const top = luminance[Math.max(0, y - 1) * SAMPLE_WIDTH + x];
        const bottom = luminance[Math.min(SAMPLE_HEIGHT - 1, y + 1) * SAMPLE_WIDTH + x];
        const edge = clamp((Math.abs(right - left) + Math.abs(bottom - top)) / 160);
        const blue = clamp((b - r * 0.72) / 150);
        const warm = clamp((r - b * 0.9) / 150);
        const chroma = clamp((Math.max(r, g, b) - Math.min(r, g, b)) / 170);
        const metric = { r, g, b, luma: luminance[index], edge, blue, warm, chroma };
        sampleMetrics[index] = metric;
        edgeSum += edge;
        edgeMaximum = Math.max(edgeMaximum, edge);
        chromaSum += chroma;
        const u = (x + 0.5) / SAMPLE_WIDTH;
        const v = (y + 0.5) / SAMPLE_HEIGHT;
        if (u > 0.34 && v > 0.075 && v < 0.925) {
          const foam = clamp((metric.luma - 80) / 145);
          const score = edge * 0.57 + chroma * 0.2 + Math.max(blue, warm) * 0.14 + foam * 0.09;
          candidates.push({ u, v, r, g, b, edge, chroma, score, sampleIndex: index });
        }
      }
    }
    candidates.sort((a, b) => b.score - a.score || a.sampleIndex - b.sampleIndex);
    targetCandidates = candidates.slice(0, Math.min(candidates.length, 4300));
    state.sampledLuminanceRange = round(maximumLuminance - minimumLuminance);
    state.sampledEdgeMean = round(edgeSum / luminance.length);
    state.sampledEdgeMaximum = round(edgeMaximum);
    state.sampledChromaMean = round(chromaSum / luminance.length);
    state.targetCandidateCount = targetCandidates.length;
    state.targetQualityScore = clamp(
      0.42
        + state.sampledEdgeMean * 1.28
        + state.sampledChromaMean * 0.72
        + (state.sampledLuminanceRange / 255) * 0.18,
      0.58,
      0.96,
    );

    const usedTargets = new Set();
    const targetBytes = [];
    glyphParticles.forEach((particle, index) => {
      const targetIndex = (index * 977 + Math.floor(deterministic(index, 29) * 83)) % targetCandidates.length;
      const target = targetCandidates[targetIndex];
      particle.targetU = target.u;
      particle.targetV = target.v;
      particle.targetR = target.r;
      particle.targetG = target.g;
      particle.targetB = target.b;
      particle.targetEdge = target.edge;
      particle.targetIndex = targetIndex;
      usedTargets.add(targetIndex);
      targetBytes.push(
        Math.round(target.u * 255),
        Math.round(target.v * 255),
        target.r,
        target.g,
        target.b,
        Math.round(target.edge * 255),
      );
    });
    state.targetAssignmentCount = glyphParticles.length;
    state.uniqueTargetCount = usedTargets.size;
    state.particleTargetChecksum = fnv1a(targetBytes);
    computeRecommendation();
    return image;
  }

  function sampleRenderedCanvas() {
    if (!canvas?.width || !canvas?.height) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const stride = Math.max(4, Math.floor(pixels.length / 6000 / 4) * 4);
    let minimum = 255;
    let maximum = 0;
    let count = 0;
    for (let index = 0; index < pixels.length; index += stride) {
      const luminance = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
      minimum = Math.min(minimum, luminance);
      maximum = Math.max(maximum, luminance);
      count += 1;
    }
    const before = state.renderedPixelChecksum;
    state.renderedSampleCount = count;
    state.renderedPixelChecksum = fnv1a(pixels, stride);
    state.renderedLuminanceRange = round(maximum - minimum);
    if (!firstDrawPending && before !== state.renderedPixelChecksum && state.lastInputVisualChecksumBefore) {
      state.lastInputVisualChecksumAfter = state.renderedPixelChecksum;
    }
  }

  function drawCoverImage(p) {
    const displayAspect = p.width / Math.max(1, p.height);
    const sourceAspect = p5Image.width / p5Image.height;
    if (displayAspect >= sourceAspect) {
      const sourceHeight = p5Image.width / displayAspect;
      const sourceY = (p5Image.height - sourceHeight) / 2;
      p.image(p5Image, 0, 0, p.width, p.height, 0, sourceY, p5Image.width, sourceHeight);
    } else {
      const sourceWidth = p5Image.height * displayAspect;
      const sourceX = (p5Image.width - sourceWidth) / 2;
      p.image(p5Image, 0, 0, p.width, p.height, sourceX, 0, sourceWidth, p5Image.height);
    }
    state.p5ImageDrawCount += 1;
  }

  function drawScene() {
    if (!state.ready || !p5Image) return;
    const p = sketch;
    p.clear();
    drawCoverImage(p);

    const context = p.drawingContext;
    context.save();
    const shade = context.createLinearGradient(0, 0, p.width * 0.72, 0);
    shade.addColorStop(0, 'rgba(2,10,18,.76)');
    shade.addColorStop(0.52, 'rgba(2,10,18,.44)');
    shade.addColorStop(1, 'rgba(2,10,18,.02)');
    context.fillStyle = shade;
    context.fillRect(0, 0, p.width, p.height);
    context.restore();

    const baseSize = clamp(Math.min(p.width / 460, p.height / 250), 0.64, 1.75);
    p.noStroke();
    glyphParticles.forEach(particle => {
      const releaseThreshold = particle.seedA * 0.68;
      const localProgress = clamp((state.progress - releaseThreshold) / Math.max(0.01, 1 - releaseThreshold));
      const eased = smoothstep(Math.pow(localProgress, 1.15));
      const arc = Math.sin(Math.PI * eased);
      const target = displayPointForSource(particle.targetU, particle.targetV, p.width, p.height);
      const sourceX = particle.sourceX * p.width;
      const sourceY = particle.sourceY * p.height;
      const dx = target.x - sourceX;
      const dy = target.y - sourceY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const perpendicularX = -dy / distance;
      const perpendicularY = dx / distance;
      const arcDistance = (particle.seedA - 0.5) * p.height * 0.075 * arc;
      const scatterX = (particle.seedB - 0.5) * p.width * 0.014 * arc;
      const scatterY = (particle.seedC - 0.5) * p.height * 0.022 * arc;
      const x = sourceX + dx * eased + perpendicularX * arcDistance + scatterX;
      const y = sourceY + dy * eased + perpendicularY * arcDistance + scatterY;
      const r = 238 + (particle.targetR - 238) * eased;
      const g = 245 + (particle.targetG - 245) * eased;
      const b = 235 + (particle.targetB - 235) * eased;
      const alpha = 178 + particle.alpha * 68 - eased * 35 + particle.targetEdge * 35;
      p.fill(r, g, b, clamp(alpha, 90, 255));
      const size = baseSize * (1.22 - eased * 0.36 + particle.targetEdge * 0.52);
      p.circle(x, y, size);
    });
    state.particleDrawCount += glyphParticles.length;

    const probe = displayPointForSource(state.probeU, state.probeV, p.width, p.height);
    if (probe.x >= 0 && probe.x <= p.width && probe.y >= 0 && probe.y <= p.height) {
      const radius = clamp(Math.min(p.width, p.height) * 0.025, 3, 9);
      p.noFill();
      p.stroke(239, 165, 93, 210);
      p.strokeWeight(clamp(p.width / 720, 0.55, 1.2));
      p.circle(probe.x, probe.y, radius * 2);
      p.line(probe.x - radius * 1.45, probe.y, probe.x - radius * 0.55, probe.y);
      p.line(probe.x + radius * 0.55, probe.y, probe.x + radius * 1.45, probe.y);
    }

    state.p5DrawCount += 1;
    sampleRenderedCanvas();
    if (firstDrawPending) {
      state.initialStillVerified = state.inputCount === 0
        && state.progressMutationCount === 0
        && state.probeMutationCount === 0
        && Math.abs(state.progress - INITIAL_PROGRESS) < 0.0001
        && state.automaticPath === false;
      firstDrawPending = false;
    }
    dirty = false;
    updateDataset();
  }

  function resizeCanvas() {
    if (!sketch || !canvas) return false;
    const width = Math.max(1, Math.round(stage.clientWidth || 320));
    const height = Math.max(1, Math.round(stage.clientHeight || 180));
    if (sketch.width === width && sketch.height === height) return false;
    sketch.resizeCanvas(width, height, false);
    state.resizeCount += 1;
    return true;
  }

  function isControlTarget(target) {
    return target instanceof Element && Boolean(target.closest('.control-dock, button, input'));
  }

  function pointerDown(event) {
    if (isControlTarget(event.target) || !event.isPrimary || (event.button !== undefined && event.button !== 0)) return;
    const pointerType = event.pointerType || 'mouse';
    if (!acceptInput(event, pointerType, `pointer-${pointerType}-down`)) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    activePointerId = event.pointerId;
    state.activePointerType = pointerType;
    dragStartClientX = event.clientX;
    dragStartProgress = state.progress;
    try {
      stage.setPointerCapture(event.pointerId);
      state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
      if (state.pointerCaptured) state.pointerCaptureCount += 1;
    } catch {
      state.pointerCaptured = false;
    }
    const point = sourcePointForClient(event.clientX, event.clientY);
    updateProbeFromTrustedInput(point.u, point.v, `pointer-${pointerType}-down`, event);
  }

  function pointerMove(event) {
    if (isControlTarget(event.target) && activePointerId === null) return;
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    const point = sourcePointForClient(event.clientX, event.clientY);
    if (event.pointerId === activePointerId) {
      if (!acceptInput(event, pointerType, `pointer-${pointerType}-move`)) return;
      event.preventDefault();
      state.pointerMoveCount += 1;
      const bounds = stage.getBoundingClientRect();
      const next = dragStartProgress + (event.clientX - dragStartClientX) / Math.max(1, bounds.width * 0.72);
      setProgressFromTrustedInput(next, `pointer-${pointerType}-move`, event);
      updateProbeFromTrustedInput(point.u, point.v, `pointer-${pointerType}-move`, event);
    } else if (pointerType === 'mouse') {
      if (!acceptInput(event, 'mouse-hover', 'mouse-hover')) return;
      state.hoverInputCount += 1;
      updateProbeFromTrustedInput(point.u, point.v, 'mouse-hover', event);
    }
  }

  function finishPointer(event, cancelled = false) {
    if (event.pointerId !== activePointerId) return;
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    if (!acceptInput(event, pointerType, cancelled ? `pointer-${pointerType}-cancel` : `pointer-${pointerType}-up`)) return;
    event.preventDefault();
    if (!cancelled) {
      const bounds = stage.getBoundingClientRect();
      const next = dragStartProgress + (event.clientX - dragStartClientX) / Math.max(1, bounds.width * 0.72);
      setProgressFromTrustedInput(next, `pointer-${pointerType}-up`, event);
    }
    if (state.pointerCaptured) {
      try {
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      } catch {}
      state.pointerCaptureReleaseCount += 1;
    }
    state.pointerCaptured = false;
    activePointerId = null;
    state.activePointerType = 'none';
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    updateDataset();
  }

  function keyDown(event) {
    const acceptedKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'b', 'B', 'a', 'A', 'r', 'R'];
    if (!acceptedKeys.includes(event.key) || isControlTarget(event.target)) return;
    if (!acceptInput(event, 'keyboard', `keyboard-${event.key}`)) return;
    event.preventDefault();
    if (event.key === 'Home') setProgressFromTrustedInput(0, 'keyboard-Home', event);
    else if (event.key === 'End') setProgressFromTrustedInput(1, 'keyboard-End', event);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      setProgressFromTrustedInput(state.progress + direction * (event.shiftKey ? 0.12 : 0.04), `keyboard-${event.key}`, event);
    } else if (event.key.toLowerCase() === 'b') {
      state.balanceActivationCount += 1;
      setProgressFromTrustedInput(state.recommendedProgress, 'keyboard-balance', event);
    } else if (event.key.toLowerCase() === 'a') {
      state.approveActivationCount += 1;
      setApprovedFromTrustedInput(!state.approved, 'keyboard-approve', event);
    } else if (event.key.toLowerCase() === 'r') {
      state.resetActivationCount += 1;
      setProgressFromTrustedInput(INITIAL_PROGRESS, 'keyboard-reset', event);
      setApprovedFromTrustedInput(false, 'keyboard-reset', event);
    }
  }

  function rangeInput(event) {
    if (!acceptInput(event, 'range', 'range-control')) return;
    setProgressFromTrustedInput(Number(range.value) / 100, 'range-control', event);
  }

  function buttonClick(event) {
    const action = event.currentTarget.dataset.releaseAction;
    if (!acceptInput(event, 'button', `button-${action}`)) return;
    if (action === 'balance') {
      state.balanceActivationCount += 1;
      setProgressFromTrustedInput(state.recommendedProgress, 'button-balance', event);
    } else if (action === 'approve') {
      state.approveActivationCount += 1;
      setApprovedFromTrustedInput(!state.approved, 'button-approve', event);
    } else if (action === 'reset') {
      state.resetActivationCount += 1;
      setProgressFromTrustedInput(INITIAL_PROGRESS, 'button-reset', event);
      setApprovedFromTrustedInput(false, 'button-reset', event);
    }
  }

  stage.addEventListener('pointerdown', pointerDown);
  stage.addEventListener('pointermove', pointerMove);
  stage.addEventListener('pointerup', event => finishPointer(event, false));
  stage.addEventListener('pointercancel', event => finishPointer(event, true));
  stage.addEventListener('keydown', keyDown);
  range.addEventListener('input', rangeInput);
  actionButtons.forEach(button => button.addEventListener('click', buttonClick));
  state.listenersBound = true;

  const resourcesReady = loadAndAnalyzeAsset().then(image => {
    sourceImage = image;
    return new Promise(resolve => {
      sketch = new p5(instance => {
        instance.setup = () => {
          const width = Math.max(1, Math.round(stage.clientWidth || 320));
          const height = Math.max(1, Math.round(stage.clientHeight || 180));
          instance.pixelDensity(Math.min(devicePixelRatio || 1, 2));
          canvas = instance.createCanvas(width, height, instance.P2D).parent(surface).elt;
          canvas.setAttribute('aria-hidden', 'true');
          instance.noLoop();
          state.p5CanvasCreated = true;
          resolve();
        };
        instance.draw = drawScene;
      }, surface);
    });
  }).then(async () => {
    p5Image = await sketch.loadImage(verifiedObjectUrl);
    p5Image.loadPixels();
    state.p5ImageLoaded = p5Image instanceof p5.Image;
    state.p5ImageWidth = p5Image.width;
    state.p5ImageHeight = p5Image.height;
    state.p5ImagePixelLength = p5Image.pixels.length;
    state.ready = true;
    updateInterface();
  }).then(() => {
    requestDraw('resources-ready');
  }).catch(error => {
    markPreviewFailure(error);
    return new Promise(() => {});
  });

  new ResizeObserver(entries => {
    if (!entries[0] || !sketch) return;
    if (resizeCanvas()) requestDraw('resize');
  }).observe(stage);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const acceptedInputsExact = JSON.stringify(state.acceptedInputs) === JSON.stringify([
      'mouse-hover',
      'captured-mouse-drag',
      'captured-touch-drag',
      'captured-pen-drag',
      'keyboard',
      'range-control',
      'visible-buttons',
    ]);
    const recordsTrusted = state.interactionRecords.every(record => record.trusted === true
      && ['progress', 'probe', 'approved'].includes(record.property)
      && record.before !== record.after);
    const captureAccounting = state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && state.pointerCaptureCount - state.pointerCaptureReleaseCount <= (state.pointerCaptured ? 1 : 0);
    const assetEvidence = state.assetFetchCount === 1
      && state.assetFetchStatus === 200
      && state.assetMimeType.includes('image/jpeg')
      && state.assetByteLength === 184646
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.assetChecksumVerified
      && state.assetDecodeCount === 1
      && state.assetDecoded
      && state.assetNaturalWidth === 960
      && state.assetNaturalHeight === 640
      && state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
      && state.sampledByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4
      && state.sampledPixelChecksum > 0
      && state.sampledLuminanceRange > 100
      && state.sampledEdgeMean > 0.015
      && state.sampledEdgeMaximum > 0.2
      && state.sampledChromaMean > 0.08;
    const targetEvidence = state.glyphParticleCount > 800
      && state.targetCandidateCount > 2000
      && state.targetAssignmentCount === state.glyphParticleCount
      && state.uniqueTargetCount > 800
      && state.particleTargetChecksum > 0
      && state.targetQualityScore >= 0.58
      && state.recommendedProgress > 0.2
      && state.recommendedProgress < 0.82
      && state.recommendedScore >= 70;
    const p5Evidence = sketch instanceof p5
      && state.p5CanvasCreated
      && state.p5ImageLoaded
      && p5Image instanceof p5.Image
      && state.p5ImageWidth === 960
      && state.p5ImageHeight === 640
      && state.p5ImagePixelLength === 960 * 640 * 4
      && state.p5ImageDrawCount > 0
      && state.particleDrawCount >= state.glyphParticleCount
      && state.p5DrawCount > 0
      && state.renderedSampleCount > 1000
      && state.renderedPixelChecksum > 0
      && state.renderedLuminanceRange > 100;
    return window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.dataset.previewMechanism === 'p5-glyph-mask-to-raster-edge-particle-field'
      && state.id === 'typography-particle-disassembly-field'
      && state.task === 'human-operated-music-release-title-to-environment-particle-compositor'
      && state.claimedLibrary === 'p5@2.3.0'
      && state.renderer === 'canvas2d'
      && state.mechanism === 'glyph-mask-pixels-interpolate-to-same-origin-raster-edge-targets-colors-and-release-judgment'
      && acceptedInputsExact
      && state.ready
      && state.listenersBound
      && state.initialStillVerified
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.automaticPath === false
      && state.automaticPlayback === false
      && state.automaticFallback === false
      && state.rehearsalMode === false
      && state.syntheticInputDispatch === false
      && state.previewClockDriven === false
      && state.previewClockMutation === false
      && state.renderIgnoresPreviewClock
      && state.previewRenderMutationCount === 0
      && state.nonInputMutationCount === 0
      && state.trustedInputCount === state.inputCount
      && state.progress >= 0
      && state.progress <= 1
      && assetEvidence
      && targetEvidence
      && p5Evidence
      && recordsTrusted
      && captureAccounting;
  };

  installPreviewController({
    id: 'typography-particle-disassembly-field',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {
      state.previewRenderCalls += 1;
      if (resizeCanvas()) dirty = true;
      if (dirty) sketch?.redraw();
    },
    ready: resourcesReady,
  });

  window.addEventListener('beforeunload', () => {
    if (verifiedObjectUrl) URL.revokeObjectURL(verifiedObjectUrl);
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
