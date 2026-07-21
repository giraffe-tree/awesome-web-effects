import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-07/spring-loaded-split-flap-counter/harbor-hall-seat-inventory.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = {
  bytes: 376201,
  width: 960,
  height: 640,
  sha256: '3d9b707b5729214ce8283a62ee67fea4ea536f95f03ca3a44d3a52cc4dbd1edf',
};
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 64;
const DIGIT_COUNT = 4;
const STEP = 10;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const rounded = value => Number(value.toFixed(4));

const stage = document.querySelector('#inventory-stage');
const counter = document.querySelector('#counter');
const proofCard = document.querySelector('#proof-card');
const proofImage = document.querySelector('#proof-image');
const scanMarker = document.querySelector('#scan-marker');
const zoneReadout = document.querySelector('#zone-readout');
const counterMeta = document.querySelector('#counter-meta');
const draftValue = document.querySelector('#draft-value');
const committedValue = document.querySelector('#committed-value');
const proofValue = document.querySelector('#proof-value');
const syncState = document.querySelector('#sync-state');
const releaseRange = document.querySelector('#release-range');
const minusButton = document.querySelector('#minus-button');
const plusButton = document.querySelector('#plus-button');
const syncButton = document.querySelector('#sync-button');
const resetButton = document.querySelector('#reset-button');
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

const categoryCopy = {
  teal: { label: 'upper · open', status: 'open' },
  mint: { label: 'center · released', status: 'released' },
  amber: { label: 'premium · held', status: 'held' },
  coral: { label: 'lower · limited', status: 'limited' },
  neutral: { label: 'aisle · no inventory', status: 'aisle' },
};

const state = {
  id: 'spring-loaded-split-flap-counter',
  task: 'human-operated-fictional-harbor-hall-seat-release-sync',
  claimedLibrary: 'motion@12.42.2',
  renderer: 'dom',
  mechanism: 'trusted-human-input-drives-paused-motion-split-flaps',
  assetMechanismRole: 'browser-decoded-source-pixels-determine-verified-seat-ceiling-zone-status-and-flap-material',
  acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'visible-buttons', 'visible-range'],
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
  previewRenderCount: 0,
  ready: false,
  reducedMotion: reducedMotionQuery.matches,
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
  sampledWidth: SAMPLE_WIDTH,
  sampledHeight: SAMPLE_HEIGHT,
  sampledPixelCount: 0,
  sampledPixelByteLength: 0,
  sampledPixelSha256: '',
  sampledPixelChecksum: '',
  sampledLumaMinimum: 255,
  sampledLumaMaximum: 0,
  sampledLumaRange: 0,
  distinctSampleColorCount: 0,
  categoryCounts: { teal: 0, mint: 0, amber: 0, coral: 0, neutral: 0 },
  categoryColors: {},
  classifiedPixelCount: 0,
  verifiedSeatCeiling: 0,
  plannedSeats: 0,
  committedSeats: 0,
  initialPlannedSeats: 0,
  selectedCategory: 'teal',
  selectedSourcePixel: [0, 0, 0, 0],
  flapMaterialSource: 'teal',
  flapMaterialColor: '',
  zoneInspectionCount: 0,
  zoneInspectionMutationCount: 0,
  distinctInspectedCategories: [],
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
  buttonActivationCount: 0,
  rangeMutationCount: 0,
  keyboardMutationCount: 0,
  buttonMutationCount: 0,
  resetCount: 0,
  commitCount: 0,
  planMutationCount: 0,
  counterTransitionCount: 0,
  completedCounterTransitionCount: 0,
  interruptedCounterTransitionCount: 0,
  motionControllerCreateCount: 0,
  motionControllerPlayCount: 0,
  activeMotionControllerCount: 0,
  maximumActiveMotionControllerCount: 0,
  controlsBuiltWithoutAutoplay: true,
  transitionGeneration: 0,
  activePointerId: null,
  pointerCaptured: false,
  lastPointerType: 'none',
  lastInputKind: 'none',
  lastInputTrusted: null,
  firstHumanValueBefore: null,
  firstHumanValueAfter: null,
  minimumPlannedSeats: Infinity,
  maximumPlannedSeats: -Infinity,
  maximumHumanDelta: 0,
  initialVisualSignature: '',
  repeatedInitialVisualSignature: '',
  initialStillVerified: false,
  stageWidth: 0,
  stageHeight: 0,
  counterCoverageRatio: 0,
  proofCoverageRatio: 0,
  responsiveResizeCount: 0,
  interactionRecords: [],
  runtimeAssertionPassed: false,
};

window.__PREVIEW_INTERACTION_STATE__ = state;
window.__SPRING_SPLIT_FLAP_STATE__ = state;

let sampledPixels = null;
let activeControls = [];
let drag = null;
let resizeFrame = 0;
const flaps = [];

function invariant(condition, message) {
  if (!condition) throw new Error(`spring-loaded-split-flap-counter: ${message}`);
}

function pixelChecksum(bytes) {
  let signature = 2166136261;
  for (let index = 0; index < bytes.length; index += 1) {
    signature ^= bytes[index];
    signature = Math.imul(signature, 16777619) >>> 0;
  }
  return signature.toString(16).padStart(8, '0');
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function classifyPixel(red, green, blue) {
  const luma = .2126 * red + .7152 * green + .0722 * blue;
  if (luma < 33) return 'neutral';
  if (red > green * 1.65 && red > blue * 2.15 && red > 72) return 'coral';
  if (red > green * 1.28 && green > blue * 1.58 && red > 68) return 'amber';
  if (green > red * 1.12 && green > blue * 1.18 && red > 42 && luma > 52) return 'mint';
  if (green > red * 1.42 && blue > red * 1.28 && green > 48 && Math.abs(green - blue) < 42) return 'teal';
  return 'neutral';
}

function averageColor(accumulator) {
  const count = Math.max(1, accumulator.count);
  return [
    Math.round(accumulator.red / count),
    Math.round(accumulator.green / count),
    Math.round(accumulator.blue / count),
  ];
}

function analyzePixels(pixels) {
  const counts = { teal: 0, mint: 0, amber: 0, coral: 0, neutral: 0 };
  const totals = Object.fromEntries(Object.keys(counts).map(key => [key, { red: 0, green: 0, blue: 0, count: 0 }]));
  const distinct = new Set();
  let lumaMinimum = 255;
  let lumaMaximum = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const category = classifyPixel(red, green, blue);
    const luma = .2126 * red + .7152 * green + .0722 * blue;
    counts[category] += 1;
    totals[category].red += red;
    totals[category].green += green;
    totals[category].blue += blue;
    totals[category].count += 1;
    distinct.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
    lumaMinimum = Math.min(lumaMinimum, luma);
    lumaMaximum = Math.max(lumaMaximum, luma);
  }
  state.categoryCounts = counts;
  state.categoryColors = Object.fromEntries(Object.entries(totals).map(([key, total]) => [key, averageColor(total)]));
  state.classifiedPixelCount = counts.teal + counts.mint + counts.amber + counts.coral;
  state.sampledPixelCount = pixels.length / 4;
  state.sampledPixelByteLength = pixels.length;
  state.sampledPixelChecksum = pixelChecksum(pixels);
  state.distinctSampleColorCount = distinct.size;
  state.sampledLumaMinimum = rounded(lumaMinimum);
  state.sampledLumaMaximum = rounded(lumaMaximum);
  state.sampledLumaRange = rounded(lumaMaximum - lumaMinimum);
  const sourceSeatEvidence = counts.teal * .28 + counts.mint * .42 + counts.amber * .06;
  state.verifiedSeatCeiling = clamp(Math.round(sourceSeatEvidence / 10) * 10, 80, 9990);
}

function formatSeatCount(value) {
  return String(Math.round(value)).padStart(DIGIT_COUNT, '0');
}

function rgbString(color) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function readableInk(color) {
  const luma = .2126 * color[0] + .7152 * color[1] + .0722 * color[2];
  return luma > 130 ? 'rgb(21, 24, 19)' : 'rgb(235, 239, 223)';
}

function applyMaterial(category, pixel = null) {
  const fallback = state.categoryColors.teal || [69, 132, 125];
  const average = state.categoryColors[category] || fallback;
  const color = category === 'neutral' && pixel ? [pixel[0], pixel[1], pixel[2]] : average;
  const signal = rgbString(color);
  const face = rgbString(color.map(channel => Math.max(21, Math.round(channel * .48))));
  stage.style.setProperty('--signal', signal);
  stage.style.setProperty('--signal-soft', `rgba(${color[0]}, ${color[1]}, ${color[2]}, .18)`);
  stage.style.setProperty('--flap-face', face);
  stage.style.setProperty('--flap-ink', readableInk(color));
  state.flapMaterialSource = category;
  state.flapMaterialColor = face;
}

function createFlaps() {
  counter.replaceChildren();
  for (let index = 0; index < DIGIT_COUNT; index += 1) {
    const cell = document.createElement('span');
    cell.className = 'flap';
    cell.dataset.column = String(index + 1);
    cell.dataset.currentDigit = '0';
    cell.dataset.targetDigit = '0';
    cell.dataset.phase = 'idle';
    cell.setAttribute('aria-hidden', 'true');
    cell.innerHTML = `
      <span class="flap-panel flap-panel-top"><b>0</b></span>
      <span class="flap-panel flap-panel-bottom"><b>0</b></span>
      <span class="flap-leaf flap-leaf-out"><b>0</b></span>
      <span class="flap-leaf flap-leaf-in"><b>0</b></span>
      <span class="flap-midline"></span>
    `;
    counter.append(cell);
    flaps.push({
      index,
      cell,
      top: cell.querySelector('.flap-panel-top b'),
      bottom: cell.querySelector('.flap-panel-bottom b'),
      outgoing: cell.querySelector('.flap-leaf-out'),
      outgoingGlyph: cell.querySelector('.flap-leaf-out b'),
      incoming: cell.querySelector('.flap-leaf-in'),
      incomingGlyph: cell.querySelector('.flap-leaf-in b'),
      current: '0',
      target: '0',
    });
  }
}

function settleFlap(flap, digit, phase = 'landed') {
  flap.current = digit;
  flap.target = digit;
  flap.cell.dataset.currentDigit = digit;
  flap.cell.dataset.targetDigit = digit;
  flap.cell.dataset.phase = phase;
  flap.top.textContent = digit;
  flap.bottom.textContent = digit;
  flap.outgoingGlyph.textContent = digit;
  flap.incomingGlyph.textContent = digit;
  flap.outgoing.style.transform = '';
  flap.outgoing.style.opacity = '';
  flap.incoming.style.transform = '';
  flap.incoming.style.opacity = '';
}

function settleCounter(value, phase = 'landed') {
  formatSeatCount(value).split('').forEach((digit, index) => settleFlap(flaps[index], digit, phase));
  counter.setAttribute('aria-label', `${Math.round(value)} planned released seats`);
}

function cancelControls() {
  if (activeControls.length > 0) {
    state.interruptedCounterTransitionCount += 1;
    activeControls.forEach(control => control.cancel());
  }
  activeControls = [];
  state.activeMotionControllerCount = 0;
}

function buildPausedControls(fromDigits, toDigits, generation) {
  cancelControls();
  const completion = [];
  activeControls = flaps.flatMap((flap, index) => {
    const from = fromDigits[index];
    const to = toDigits[index];
    flap.current = from;
    flap.target = to;
    flap.cell.dataset.currentDigit = from;
    flap.cell.dataset.targetDigit = to;
    flap.cell.dataset.phase = from === to ? 'steady' : 'queued';
    flap.top.textContent = to;
    flap.bottom.textContent = from;
    flap.outgoingGlyph.textContent = from;
    flap.incomingGlyph.textContent = to;
    const delay = index * .032;
    const outgoing = animate(flap.outgoing, { rotateX: [0, -92], opacity: [1, 1, 0] }, {
      duration: .19,
      delay,
      ease: [.36, 0, .66, 1],
      autoplay: false,
    });
    const incoming = animate(flap.incoming, { rotateX: [92, 0], opacity: [0, 1, 1] }, {
      duration: .22,
      delay: delay + .105,
      ease: [.18, .78, .28, 1],
      autoplay: false,
    });
    outgoing.pause();
    incoming.pause();
    outgoing.time = 0;
    incoming.time = 0;
    state.motionControllerCreateCount += 2;
    completion.push(incoming.finished.catch(() => undefined));
    return [outgoing, incoming];
  });
  state.activeMotionControllerCount = activeControls.length;
  state.maximumActiveMotionControllerCount = Math.max(state.maximumActiveMotionControllerCount, activeControls.length);
  return Promise.all(completion).then(() => {
    if (generation !== state.transitionGeneration) return;
    settleCounter(state.plannedSeats);
    activeControls = [];
    state.activeMotionControllerCount = 0;
    state.completedCounterTransitionCount += 1;
    syncDisplay();
  });
}

function playCounterTransition(previous, next) {
  const fromDigits = formatSeatCount(previous).split('');
  const toDigits = formatSeatCount(next).split('');
  state.transitionGeneration += 1;
  const generation = state.transitionGeneration;
  state.counterTransitionCount += 1;
  const completion = buildPausedControls(fromDigits, toDigits, generation);
  if (state.reducedMotion) {
    cancelControls();
    settleCounter(next);
    state.completedCounterTransitionCount += 1;
    return;
  }
  activeControls.forEach(control => {
    control.play();
    state.motionControllerPlayCount += 1;
  });
  completion.catch(markPreviewFailure);
}

function visualSignature() {
  return [
    flaps.map(flap => `${flap.current}:${flap.target}:${flap.cell.dataset.phase}`).join(','),
    state.plannedSeats,
    state.committedSeats,
    state.selectedCategory,
    stage.style.getPropertyValue('--flap-face'),
    syncState.textContent,
  ].join('|');
}

function syncDataset() {
  stage.dataset.ready = String(state.ready);
  stage.dataset.plannedSeats = String(state.plannedSeats);
  stage.dataset.committedSeats = String(state.committedSeats);
  stage.dataset.verifiedCeiling = String(state.verifiedSeatCeiling);
  stage.dataset.selectedCategory = state.selectedCategory;
  stage.dataset.inputCount = String(state.inputCount);
  stage.dataset.planMutationCount = String(state.planMutationCount);
  stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
  stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
  stage.dataset.automaticPlayback = String(state.automaticPlayback);
  stage.dataset.captureClockDriven = String(state.captureClockDriven);
}

function syncDisplay() {
  const ceiling = state.verifiedSeatCeiling;
  releaseRange.max = String(ceiling);
  releaseRange.value = String(state.plannedSeats);
  releaseRange.setAttribute('aria-valuetext', `${state.plannedSeats} of ${ceiling} verified seats`);
  counterMeta.textContent = `verified ceiling · ${formatSeatCount(ceiling)}`;
  draftValue.textContent = formatSeatCount(state.plannedSeats);
  committedValue.textContent = formatSeatCount(state.committedSeats);
  proofValue.textContent = `${state.classifiedPixelCount} px`;
  syncState.textContent = state.plannedSeats === state.committedSeats ? 'inventory synced' : `draft Δ ${state.plannedSeats - state.committedSeats}`;
  syncButton.textContent = state.plannedSeats === state.committedSeats ? 'Synced' : 'Sync';
  syncDataset();
}

function updateLayoutEvidence() {
  const stageBounds = stage.getBoundingClientRect();
  const counterBounds = counter.getBoundingClientRect();
  const proofBounds = proofCard.getBoundingClientRect();
  state.stageWidth = rounded(stageBounds.width);
  state.stageHeight = rounded(stageBounds.height);
  state.counterCoverageRatio = rounded(counterBounds.width * counterBounds.height / Math.max(1, stageBounds.width * stageBounds.height));
  state.proofCoverageRatio = rounded(proofBounds.width * proofBounds.height / Math.max(1, stageBounds.width * stageBounds.height));
}

function acceptTrustedInput(event, kind) {
  if (event?.isTrusted !== true) {
    state.rejectedUntrustedInputCount += 1;
    state.lastInputTrusted = false;
    syncDataset();
    return false;
  }
  state.inputCount += 1;
  state.trustedInputCount += 1;
  state.lastInputKind = kind;
  state.lastInputTrusted = true;
  if (event.pointerType) state.lastPointerType = event.pointerType;
  if (event.pointerType && !state.pointerTypesSeen.includes(event.pointerType)) {
    state.pointerTypesSeen.push(event.pointerType);
  }
  return true;
}

function recordPlanMutation(kind, before, after) {
  state.planMutationCount += 1;
  state.minimumPlannedSeats = Math.min(state.minimumPlannedSeats, before, after);
  state.maximumPlannedSeats = Math.max(state.maximumPlannedSeats, before, after);
  state.maximumHumanDelta = Math.max(state.maximumHumanDelta, Math.abs(after - before));
  if (state.firstHumanValueBefore === null) {
    state.firstHumanValueBefore = before;
    state.firstHumanValueAfter = after;
  }
  if (kind === 'range-drag') state.rangeMutationCount += 1;
  else if (kind === 'keyboard') state.keyboardMutationCount += 1;
  else if (kind === 'button-control') state.buttonMutationCount += 1;
  state.interactionRecords.push({ kind, trusted: true, before, after });
  if (state.interactionRecords.length > 64) state.interactionRecords.shift();
}

function setPlannedSeats(next, kind) {
  const bounded = clamp(Math.round(Number(next) / STEP) * STEP, 0, state.verifiedSeatCeiling);
  const before = state.plannedSeats;
  if (bounded === before) return false;
  state.plannedSeats = bounded;
  recordPlanMutation(kind, before, bounded);
  playCounterTransition(before, bounded);
  syncDisplay();
  runtimeAssert();
  return true;
}

function commitPlan(event, kind = 'button-control') {
  if (!acceptTrustedInput(event, 'commit')) return;
  const before = state.committedSeats;
  state.committedSeats = state.plannedSeats;
  state.commitCount += 1;
  state.buttonActivationCount += kind === 'button-control' ? 1 : 0;
  state.interactionRecords.push({ kind: 'commit', trusted: true, before, after: state.committedSeats });
  syncDisplay();
  runtimeAssert();
}

function resetToProof(event, kind = 'button-control') {
  if (!acceptTrustedInput(event, 'reset-proof')) return;
  const before = state.plannedSeats;
  state.resetCount += 1;
  state.buttonActivationCount += kind === 'button-control' ? 1 : 0;
  state.committedSeats = state.verifiedSeatCeiling;
  if (before !== state.verifiedSeatCeiling) {
    state.plannedSeats = state.verifiedSeatCeiling;
    recordPlanMutation(kind, before, state.plannedSeats);
    playCounterTransition(before, state.plannedSeats);
  }
  syncDisplay();
  runtimeAssert();
}

function nudge(delta, event, kind = 'button-control') {
  if (!acceptTrustedInput(event, kind)) return;
  if (kind === 'button-control') state.buttonActivationCount += 1;
  if (kind === 'keyboard') state.keyboardInputCount += 1;
  setPlannedSeats(state.plannedSeats + delta, kind);
}

function sourcePointFromEvent(event) {
  const bounds = proofCard.getBoundingClientRect();
  const elementRatio = bounds.width / Math.max(1, bounds.height);
  const imageRatio = EXPECTED_ASSET.width / EXPECTED_ASSET.height;
  let normalizedX = clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1);
  let normalizedY = clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), 0, 1);
  if (elementRatio > imageRatio) {
    const visibleHeight = imageRatio / elementRatio;
    normalizedY = clamp((normalizedY - (1 - visibleHeight) / 2) / visibleHeight, 0, 1);
  } else if (elementRatio < imageRatio) {
    const visibleWidth = elementRatio / imageRatio;
    normalizedX = clamp((normalizedX - (1 - visibleWidth) / 2) / visibleWidth, 0, 1);
  }
  const x = clamp(Math.round(normalizedX * (SAMPLE_WIDTH - 1)), 0, SAMPLE_WIDTH - 1);
  const y = clamp(Math.round(normalizedY * (SAMPLE_HEIGHT - 1)), 0, SAMPLE_HEIGHT - 1);
  return { normalizedX, normalizedY, x, y };
}

function inspectProof(event) {
  if (event.pointerType && event.pointerType !== 'mouse') return;
  if (event.buttons !== 0 || !sampledPixels) return;
  if (!acceptTrustedInput(event, 'mouse-hover')) return;
  state.hoverMoveCount += 1;
  const point = sourcePointFromEvent(event);
  const index = (point.y * SAMPLE_WIDTH + point.x) * 4;
  const pixel = [...sampledPixels.slice(index, index + 4)];
  const category = classifyPixel(pixel[0], pixel[1], pixel[2]);
  const changed = category !== state.selectedCategory;
  state.selectedCategory = category;
  state.selectedSourcePixel = pixel;
  state.zoneInspectionCount += 1;
  if (changed) state.zoneInspectionMutationCount += 1;
  if (!state.distinctInspectedCategories.includes(category)) state.distinctInspectedCategories.push(category);
  scanMarker.style.left = `${(point.normalizedX * 100).toFixed(2)}%`;
  scanMarker.style.top = `${(point.normalizedY * 100).toFixed(2)}%`;
  proofCard.dataset.scanned = 'true';
  zoneReadout.textContent = categoryCopy[category].label;
  applyMaterial(category, pixel);
  syncDataset();
}

function plannedFromPointer(event) {
  const bounds = releaseRange.getBoundingClientRect();
  const ratio = clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1);
  return ratio * state.verifiedSeatCeiling;
}

releaseRange.addEventListener('pointerdown', event => {
  if (!acceptTrustedInput(event, 'range-drag-start')) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  event.preventDefault();
  state.pointerDownCount += 1;
  state.activePointerId = event.pointerId;
  releaseRange.setPointerCapture(event.pointerId);
  state.pointerCaptureCount += 1;
  state.pointerCaptured = true;
  drag = { pointerId: event.pointerId };
  setPlannedSeats(plannedFromPointer(event), 'range-drag');
});

releaseRange.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (!acceptTrustedInput(event, 'range-drag-move')) return;
  event.preventDefault();
  state.pointerMoveCount += 1;
  setPlannedSeats(plannedFromPointer(event), 'range-drag');
});

function finishRangeDrag(event, cancelled = false) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (!acceptTrustedInput(event, cancelled ? 'range-drag-cancel' : 'range-drag-end')) return;
  if (releaseRange.hasPointerCapture(event.pointerId)) {
    releaseRange.releasePointerCapture(event.pointerId);
    state.pointerCaptureReleaseCount += 1;
  }
  state.pointerUpCount += cancelled ? 0 : 1;
  state.pointerCancelCount += cancelled ? 1 : 0;
  state.activePointerId = null;
  state.pointerCaptured = false;
  drag = null;
  syncDataset();
}

releaseRange.addEventListener('pointerup', event => finishRangeDrag(event, false));
releaseRange.addEventListener('pointercancel', event => finishRangeDrag(event, true));

releaseRange.addEventListener('keydown', event => {
  if (event.repeat) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    event.preventDefault();
    nudge(-STEP, event, 'keyboard');
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    event.preventDefault();
    nudge(STEP, event, 'keyboard');
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    if (!acceptTrustedInput(event, 'keyboard')) return;
    state.keyboardInputCount += 1;
    setPlannedSeats(event.key === 'Home' ? 0 : state.verifiedSeatCeiling, 'keyboard');
  }
});

stage.addEventListener('keydown', event => {
  if (event.repeat || event.target.closest('button, input')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    event.preventDefault();
    nudge(-STEP, event, 'keyboard');
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    event.preventDefault();
    nudge(STEP, event, 'keyboard');
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    if (!acceptTrustedInput(event, 'keyboard')) return;
    state.keyboardInputCount += 1;
    setPlannedSeats(event.key === 'Home' ? 0 : state.verifiedSeatCeiling, 'keyboard');
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    state.keyboardInputCount += 1;
    commitPlan(event, 'keyboard');
  } else if (event.key === 'Escape') {
    event.preventDefault();
    state.keyboardInputCount += 1;
    resetToProof(event, 'keyboard');
  }
});

proofCard.addEventListener('pointerenter', event => {
  if (event.pointerType === 'mouse' && acceptTrustedInput(event, 'mouse-hover-enter')) state.pointerEnterCount += 1;
});
proofCard.addEventListener('pointermove', inspectProof);
proofCard.addEventListener('pointerleave', () => { proofCard.dataset.scanned = 'false'; });

minusButton.addEventListener('click', event => nudge(-STEP, event));
plusButton.addEventListener('click', event => nudge(STEP, event));
syncButton.addEventListener('click', event => commitPlan(event));
resetButton.addEventListener('click', event => resetToProof(event));

function setupResponsiveEvidence() {
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.responsiveResizeCount += 1;
      updateLayoutEvidence();
    });
  });
  observer.observe(stage);
  window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });
}

async function loadAsset() {
  state.assetFetchCount += 1;
  const response = await fetch(ASSET_URL, { cache: 'force-cache' });
  state.assetResponseStatus = response.status;
  state.assetMimeType = response.headers.get('content-type') || '';
  state.assetSameOrigin = new URL(ASSET_URL).origin === location.origin;
  invariant(response.ok, `seat proof request failed with ${response.status}`);
  const buffer = await response.arrayBuffer();
  state.assetByteLength = buffer.byteLength;
  state.assetSha256 = await sha256(buffer);
  state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;
  invariant(state.assetShaMatchesExpected, 'source asset SHA-256 mismatch');

  const objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'image/jpeg' }));
  proofImage.src = objectUrl;
  await proofImage.decode();
  state.browserImageDecoded = true;
  state.sourceNaturalWidth = proofImage.naturalWidth;
  state.sourceNaturalHeight = proofImage.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(proofImage, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  sampledPixels = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
  state.sampledPixelSha256 = await sha256(sampledPixels);
  analyzePixels(sampledPixels);
  URL.revokeObjectURL(objectUrl);
}

function runtimeAssert() {
  const initialOrHumanState = state.inputCount > 0 || (
    state.plannedSeats === state.initialPlannedSeats
    && state.committedSeats === state.initialPlannedSeats
    && state.planMutationCount === 0
  );
  const categoryEvidence = state.categoryCounts.teal > 200
    && state.categoryCounts.mint > 25
    && state.categoryCounts.amber > 120
    && state.categoryCounts.coral > 200
    && state.classifiedPixelCount > 900;
  const structureEvidence = flaps.length === DIGIT_COUNT && flaps.every((flap, index) => (
    flap.index === index
    && Number(flap.cell.dataset.column) === index + 1
    && /^\d$/.test(flap.current)
    && /^\d$/.test(flap.target)
    && flap.cell.querySelectorAll('.flap-panel').length === 2
    && flap.cell.querySelectorAll('.flap-leaf').length === 2
    && flap.cell.querySelector('.flap-midline') instanceof HTMLElement
  ));
  const sourceEvidence = state.assetFetchCount === 1
    && state.assetResponseStatus === 200
    && state.assetSameOrigin
    && state.assetMimeType.includes('image/jpeg')
    && state.assetByteLength === EXPECTED_ASSET.bytes
    && state.assetShaMatchesExpected
    && state.assetSha256 === EXPECTED_ASSET.sha256
    && state.browserImageDecoded
    && state.sourceNaturalWidth === EXPECTED_ASSET.width
    && state.sourceNaturalHeight === EXPECTED_ASSET.height;
  const derivedEvidence = state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
    && state.sampledPixelByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4
    && /^[0-9a-f]{64}$/.test(state.sampledPixelSha256)
    && !/^0{64}$/.test(state.sampledPixelSha256)
    && /^[0-9a-f]{8}$/.test(state.sampledPixelChecksum)
    && !/^0{8}$/.test(state.sampledPixelChecksum)
    && state.distinctSampleColorCount > 90
    && state.sampledLumaRange > 60
    && categoryEvidence;
  const interactionEvidence = state.inputCount === state.trustedInputCount
    && state.rejectedUntrustedInputCount === 0
    && state.planMutationCount === state.rangeMutationCount + state.keyboardMutationCount + state.buttonMutationCount
    && state.pointerCaptureReleaseCount <= state.pointerCaptureCount
    && state.plannedSeats >= 0
    && state.plannedSeats <= state.verifiedSeatCeiling
    && state.committedSeats >= 0
    && state.committedSeats <= state.verifiedSeatCeiling;
  const motionEvidence = typeof animate === 'function'
    && state.controlsBuiltWithoutAutoplay
    && state.activeMotionControllerCount === activeControls.length
    && state.maximumActiveMotionControllerCount <= DIGIT_COUNT * 2
    && state.motionControllerPlayCount <= state.motionControllerCreateCount;
  const noAutomaticEvidence = state.userInputRequired
    && state.initialFrameStatic
    && !state.automaticCycle
    && !state.automaticPlayback
    && !state.automaticRehearsal
    && !state.automaticFallback
    && !state.syntheticInputDispatch
    && !state.captureClockDriven
    && state.renderIgnoresPreviewClock
    && state.previewClockMutationCount === 0;
  const passed = state.ready
    && stage.dataset.previewMechanism === 'motion-seat-inventory-split-flap'
    && releaseRange instanceof HTMLInputElement
    && minusButton instanceof HTMLButtonElement
    && syncButton instanceof HTMLButtonElement
    && structureEvidence
    && sourceEvidence
    && derivedEvidence
    && interactionEvidence
    && motionEvidence
    && noAutomaticEvidence
    && initialOrHumanState
    && state.verifiedSeatCeiling >= 80
    && state.verifiedSeatCeiling <= 9990
    && state.flapMaterialColor.length > 0
    && state.initialStillVerified
    && state.previewRenderCount > 0;
  state.runtimeAssertionPassed = passed;
  return passed;
}

async function initialize() {
  await loadAsset();
  createFlaps();
  state.plannedSeats = state.verifiedSeatCeiling;
  state.committedSeats = state.verifiedSeatCeiling;
  state.initialPlannedSeats = state.verifiedSeatCeiling;
  state.minimumPlannedSeats = state.verifiedSeatCeiling;
  state.maximumPlannedSeats = state.verifiedSeatCeiling;
  settleCounter(state.plannedSeats, 'idle');
  applyMaterial('teal');
  syncDisplay();
  setupResponsiveEvidence();
  updateLayoutEvidence();
  state.ready = true;
  syncDataset();
  state.initialVisualSignature = visualSignature();
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  state.repeatedInitialVisualSignature = visualSignature();
  state.initialStillVerified = state.initialVisualSignature === state.repeatedInitialVisualSignature;
  syncDataset();
}

function renderWithoutClock() {
  state.previewRenderCount += 1;
  updateLayoutEvidence();
}

try {
  const ready = initialize().catch(error => {
    markPreviewFailure(error);
    throw error;
  });
  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    return runtimeAssert();
  };
  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'dom',
    render: renderWithoutClock,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
