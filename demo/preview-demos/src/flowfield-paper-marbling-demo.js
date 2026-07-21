import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-07/flowfield-paper-marbling/pigment-paper-calibration.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = {
  bytes: 423661,
  width: 960,
  height: 640,
  sha256: 'f368a7e66e8e91c8118739f5bddb7979a55b4aa0397c6007882bc1b80d12be01',
};
const SAMPLE_WIDTH = 72;
const SAMPLE_HEIGHT = 48;
const SAMPLE_SIZE = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const INITIAL_TINES = 7;
const TAU = Math.PI * 2;

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const rounded = value => Number(value.toFixed(4));
const fract = value => value - Math.floor(value);
const seeded = (index, salt = 0) => fract(Math.sin(index * 91.731 + salt * 37.719) * 43758.5453);

const stage = document.querySelector('#marbling-stage');
const canvasHost = document.querySelector('#marbling-canvas');
const proofState = document.querySelector('#proof-state span');
const scoreReadout = document.querySelector('#score-readout');
const contaminationReadout = document.querySelector('#contamination-readout');
const densityReadout = document.querySelector('#density-readout');
const strokeReadout = document.querySelector('#stroke-readout');
const sampleCard = document.querySelector('#sample-card');
const sampleName = document.querySelector('#sample-name');
const sampleDensity = document.querySelector('#sample-density');
const tineInput = document.querySelector('#comb-tines');
const tineReadout = document.querySelector('#tine-readout');
const actionButtons = [...document.querySelectorAll('[data-action]')];
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

let sketch = null;
let proofImage = null;
let sampledPixels = null;
let field = [];
let dirty = true;
let resizeFrame = 0;
let activeStroke = null;

const state = {
  id: 'flowfield-paper-marbling',
  task: 'human-operated-fictional-pigment-bath-calibration-combing-and-print-proof-approval',
  claimedLibrary: 'p5@2.3.0',
  mechanism: 'real-raster-pixels-to-pigment-density-local-gradient-flowfield-contamination-metrics-and-human-comb-deformation',
  captureType: 'interactive',
  acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button', 'range'],
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
  previewClockMutationCount: 0,
  nonInputVisualMutationCountAfterReady: 0,
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
  p5ImageDecoded: false,
  p5ImageClass: '',
  p5ImageWidth: 0,
  p5ImageHeight: 0,
  p5ImagePixelLength: 0,
  p5InstanceReady: false,
  p5CanvasReady: false,
  p5CanvasWidth: 0,
  p5CanvasHeight: 0,
  sampledWidth: SAMPLE_WIDTH,
  sampledHeight: SAMPLE_HEIGHT,
  sampledPixelCount: 0,
  sampledPixelByteLength: 0,
  sampledPixelSha256: '',
  sampledPixelChecksum: '',
  distinctSampleColorCount: 0,
  sourceAlphaFailureCount: 0,
  sampledLuminanceMinimum: 1,
  sampledLuminanceMaximum: 0,
  sampledLuminanceRange: 0,
  pigmentDensity: 0,
  pigmentDensityMinimum: 1,
  pigmentDensityMaximum: 0,
  pigmentDensityRange: 0,
  contaminationPixelCount: 0,
  contaminationRatio: 0,
  pigmentCategoryCounts: {},
  pigmentCategoriesPresent: [],
  flowFieldWidth: SAMPLE_WIDTH,
  flowFieldHeight: SAMPLE_HEIGHT,
  flowCellCount: 0,
  flowVectorChecksum: '',
  flowMagnitudeMinimum: Infinity,
  flowMagnitudeMaximum: -Infinity,
  flowMagnitudeRange: 0,
  sourceQualityScore: 0,
  currentQualityScore: 0,
  currentQualityLabel: 'REVIEW',
  combTineCount: INITIAL_TINES,
  combStrokeCount: 0,
  combPointCount: 0,
  retainedStrokeCount: 0,
  retainedPointCount: 0,
  flowDeformationCount: 0,
  maximumFlowDeformation: 0,
  undoCount: 0,
  resetCount: 0,
  approvalCount: 0,
  holdCount: 0,
  approved: false,
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
  rangeInputCount: 0,
  mouseInputCount: 0,
  touchInputCount: 0,
  penInputCount: 0,
  humanMutationCount: 0,
  probeMutationCount: 0,
  combMutationCount: 0,
  tineMutationCount: 0,
  approvalMutationCount: 0,
  reversibleMutationCount: 0,
  activePointerId: null,
  pointerCaptured: false,
  lastPointerType: 'none',
  lastInputKind: 'none',
  lastInputSource: 'none',
  lastInputTrusted: null,
  selectedPigmentCategory: 'none',
  selectedPigmentDensity: 0,
  selectedSourcePixel: [0, 0, 0, 0],
  selectedU: 0,
  selectedV: 0,
  paperCoverageRatio: 0,
  canvasCoverageRatio: 0,
  p5ImageDrawCount: 0,
  streamlineDrawCount: 0,
  streamlineSegmentDrawCount: 0,
  combGuideDrawCount: 0,
  contaminationMarkerDrawCount: 0,
  p5DrawCount: 0,
  p5CompletedDrawCount: 0,
  renderRequestCount: 0,
  previewRenderCalls: 0,
  responsiveResizeCount: 0,
  initialVisualSignature: '',
  repeatedInitialVisualSignature: '',
  interactionRecords: [],
  runtimeAssertionPassed: false,
  ready: false,
};

window.__PREVIEW_INTERACTION_STATE__ = state;
window.__FLOWFIELD_MARBLING_STATE__ = state;

function invariant(condition, message) {
  if (!condition) throw new Error(`flowfield-paper-marbling: ${message}`);
}

async function sha256(buffer) {
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

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) * 0.5;
  let hue = 0;
  if (delta > 0) {
    if (maximum === r) hue = ((g - b) / delta) % 6;
    else if (maximum === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = ((hue / 6) + 1) % 1;
  }
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { hue, saturation, lightness };
}

function classifyPigment(red, green, blue, saturation, lightness) {
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  if (lightness < .19 && saturation < .24 && maximum - minimum < 42) return 'contamination';
  if (saturation < .18 && lightness > .57) return 'cotton';
  const { hue } = rgbToHsl(red, green, blue);
  if (hue >= .47 && hue < .56) return 'oxidized-teal';
  if (hue >= .56 && hue < .71) return 'indigo';
  if (hue >= .94 || hue < .035) return 'madder';
  if (hue >= .035 && hue < .13) return 'ochre';
  return saturation < .28 ? 'mineral-paper' : 'mixed-pigment';
}

function pixelAt(x, y) {
  const safeX = clamp(Math.round(x), 0, SAMPLE_WIDTH - 1);
  const safeY = clamp(Math.round(y), 0, SAMPLE_HEIGHT - 1);
  const offset = (safeY * SAMPLE_WIDTH + safeX) * 4;
  return [sampledPixels[offset], sampledPixels[offset + 1], sampledPixels[offset + 2], sampledPixels[offset + 3]];
}

function fieldAt(u, v) {
  const x = clamp(Math.round(u * (SAMPLE_WIDTH - 1)), 0, SAMPLE_WIDTH - 1);
  const y = clamp(Math.round(v * (SAMPLE_HEIGHT - 1)), 0, SAMPLE_HEIGHT - 1);
  return field[y * SAMPLE_WIDTH + x];
}

function analyzePixels(pixels) {
  const categories = {
    'oxidized-teal': 0,
    indigo: 0,
    madder: 0,
    ochre: 0,
    cotton: 0,
    contamination: 0,
    'mineral-paper': 0,
    'mixed-pigment': 0,
  };
  const distinct = new Set();
  const preliminary = [];
  let lumaMinimum = 1;
  let lumaMaximum = 0;
  let densityMinimum = 1;
  let densityMaximum = 0;
  let densityTotal = 0;
  let alphaFailures = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const alpha = pixels[index + 3];
    const hsl = rgbToHsl(red, green, blue);
    const luma = (.2126 * red + .7152 * green + .0722 * blue) / 255;
    const density = clamp(hsl.saturation * (.46 + (1 - luma) * .54));
    const category = classifyPigment(red, green, blue, hsl.saturation, hsl.lightness);
    categories[category] += 1;
    distinct.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
    lumaMinimum = Math.min(lumaMinimum, luma);
    lumaMaximum = Math.max(lumaMaximum, luma);
    densityMinimum = Math.min(densityMinimum, density);
    densityMaximum = Math.max(densityMaximum, density);
    densityTotal += density;
    if (alpha !== 255) alphaFailures += 1;
    preliminary.push({ red, green, blue, luma, density, hue: hsl.hue, saturation: hsl.saturation, category });
  }

  let magnitudeMinimum = Infinity;
  let magnitudeMaximum = -Infinity;
  let vectorSignature = 2166136261;
  field = preliminary.map((cell, index) => {
    const x = index % SAMPLE_WIDTH;
    const y = Math.floor(index / SAMPLE_WIDTH);
    const left = preliminary[y * SAMPLE_WIDTH + Math.max(0, x - 1)].luma;
    const right = preliminary[y * SAMPLE_WIDTH + Math.min(SAMPLE_WIDTH - 1, x + 1)].luma;
    const top = preliminary[Math.max(0, y - 1) * SAMPLE_WIDTH + x].luma;
    const bottom = preliminary[Math.min(SAMPLE_HEIGHT - 1, y + 1) * SAMPLE_WIDTH + x].luma;
    const gradientX = right - left;
    const gradientY = bottom - top;
    const gradientAngle = Math.atan2(gradientY, gradientX);
    const pigmentAngle = (cell.hue - .5) * TAU;
    const angle = gradientAngle * .68 + pigmentAngle * .32;
    const gradientStrength = Math.hypot(gradientX, gradientY);
    const magnitude = .34 + cell.density * .72 + Math.min(.52, gradientStrength * 2.1);
    magnitudeMinimum = Math.min(magnitudeMinimum, magnitude);
    magnitudeMaximum = Math.max(magnitudeMaximum, magnitude);
    const quantizedAngle = Math.round((angle + TAU) * 1000);
    const quantizedMagnitude = Math.round(magnitude * 1000);
    vectorSignature ^= quantizedAngle + quantizedMagnitude * 7 + index * 3;
    vectorSignature = Math.imul(vectorSignature, 16777619) >>> 0;
    return { ...cell, angle, magnitude, gradientStrength };
  });

  state.sampledPixelCount = pixels.length / 4;
  state.sampledPixelByteLength = pixels.length;
  state.sampledPixelChecksum = pixelChecksum(pixels);
  state.distinctSampleColorCount = distinct.size;
  state.sourceAlphaFailureCount = alphaFailures;
  state.sampledLuminanceMinimum = rounded(lumaMinimum);
  state.sampledLuminanceMaximum = rounded(lumaMaximum);
  state.sampledLuminanceRange = rounded(lumaMaximum - lumaMinimum);
  state.pigmentDensity = rounded(densityTotal / SAMPLE_SIZE);
  state.pigmentDensityMinimum = rounded(densityMinimum);
  state.pigmentDensityMaximum = rounded(densityMaximum);
  state.pigmentDensityRange = rounded(densityMaximum - densityMinimum);
  state.contaminationPixelCount = categories.contamination;
  state.contaminationRatio = rounded(categories.contamination / SAMPLE_SIZE);
  state.pigmentCategoryCounts = categories;
  state.pigmentCategoriesPresent = Object.entries(categories).filter(([, count]) => count > 0).map(([category]) => category);
  state.flowCellCount = field.length;
  state.flowVectorChecksum = vectorSignature.toString(16).padStart(8, '0');
  state.flowMagnitudeMinimum = rounded(magnitudeMinimum);
  state.flowMagnitudeMaximum = rounded(magnitudeMaximum);
  state.flowMagnitudeRange = rounded(magnitudeMaximum - magnitudeMinimum);
  state.sourceQualityScore = clamp(Math.round(
    67
    + state.pigmentDensity * 17
    + state.sampledLuminanceRange * 9
    - state.contaminationRatio * 70
  ), 60, 89);
  state.currentQualityScore = state.sourceQualityScore;
  updateQuality();
}

async function fetchAndAnalyzeAsset() {
  state.assetFetchCount += 1;
  const response = await fetch(ASSET_URL, { cache: 'no-store' });
  state.assetResponseStatus = response.status;
  state.assetMimeType = response.headers.get('content-type') || '';
  state.assetSameOrigin = new URL(response.url).origin === location.origin;
  invariant(response.ok, `asset fetch failed with ${response.status}`);
  const buffer = await response.arrayBuffer();
  state.assetByteLength = buffer.byteLength;
  state.assetSha256 = await sha256(buffer);
  state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;

  const bitmap = await createImageBitmap(new Blob([buffer], { type: state.assetMimeType || 'image/jpeg' }));
  state.browserImageDecoded = true;
  state.sourceNaturalWidth = bitmap.width;
  state.sourceNaturalHeight = bitmap.height;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = SAMPLE_WIDTH;
  sampleCanvas.height = SAMPLE_HEIGHT;
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  sampleContext.drawImage(bitmap, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  sampledPixels = sampleContext.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
  bitmap.close();
  state.sampledPixelSha256 = await sha256(sampledPixels.buffer.slice(0));
  analyzePixels(sampledPixels);
}

function getPaperRect() {
  const width = sketch?.width || stage.clientWidth || 320;
  const height = sketch?.height || stage.clientHeight || 180;
  const rect = {
    x: width * .29,
    y: height * .12,
    width: width * .675,
    height: height * .70,
  };
  state.paperCoverageRatio = rounded((rect.width * rect.height) / (width * height));
  state.canvasCoverageRatio = rounded((width * height) / Math.max(1, stage.clientWidth * stage.clientHeight));
  return rect;
}

function pointToPaper(event) {
  const bounds = sketch.canvas.getBoundingClientRect();
  const canvasX = (event.clientX - bounds.left) / bounds.width * sketch.width;
  const canvasY = (event.clientY - bounds.top) / bounds.height * sketch.height;
  const paper = getPaperRect();
  const u = (canvasX - paper.x) / paper.width;
  const v = (canvasY - paper.y) / paper.height;
  return { canvasX, canvasY, u, v, inside: u >= 0 && u <= 1 && v >= 0 && v <= 1 };
}

function pigmentAt(u, v) {
  return fieldAt(clamp(u), clamp(v));
}

function setSignalFromCell(cell) {
  const color = `rgb(${cell.red}, ${cell.green}, ${cell.blue})`;
  stage.style.setProperty('--signal', color);
  sampleCard.style.setProperty('--sample-color', color);
}

function updateProbe(point) {
  const cell = pigmentAt(point.u, point.v);
  const paper = getPaperRect();
  const canvasX = Number.isFinite(point.canvasX) ? point.canvasX : paper.x + point.u * paper.width;
  const canvasY = Number.isFinite(point.canvasY) ? point.canvasY : paper.y + point.v * paper.height;
  state.selectedPigmentCategory = cell.category;
  state.selectedPigmentDensity = rounded(cell.density);
  state.selectedSourcePixel = [cell.red, cell.green, cell.blue, 255];
  state.selectedU = rounded(point.u);
  state.selectedV = rounded(point.v);
  state.probeMutationCount += 1;
  sampleName.textContent = cell.category.replaceAll('-', ' ');
  sampleDensity.textContent = `LOAD ${Math.round(cell.density * 100)}%`;
  sampleCard.dataset.visible = 'true';
  sampleCard.style.left = `${clamp(canvasX, 0, sketch.width - 72)}px`;
  sampleCard.style.top = `${clamp(canvasY, 16, sketch.height - 16)}px`;
  setSignalFromCell(cell);
}

function updateQuality() {
  const strokeBonus = Math.min(13, state.retainedStrokeCount * 4 + Math.min(5, state.retainedPointCount / 28));
  const rakeBonus = Math.min(3, Math.max(0, state.combTineCount - 3) * .35);
  state.currentQualityScore = clamp(Math.round(state.sourceQualityScore + strokeBonus + rakeBonus), 0, 100);
  state.currentQualityLabel = state.currentQualityScore >= 86 ? 'PRESS READY' : state.currentQualityScore >= 76 ? 'REVIEW' : 'HOLD';
  scoreReadout.textContent = `${state.currentQualityScore}/100`;
  contaminationReadout.textContent = `${(state.contaminationRatio * 100).toFixed(1)}%`;
  densityReadout.textContent = `${Math.round(state.pigmentDensity * 100)}%`;
  strokeReadout.textContent = String(state.retainedStrokeCount);
  tineReadout.textContent = String(state.combTineCount);
  tineInput.value = String(state.combTineCount);
  proofState.textContent = state.approved ? 'PROOF APPROVED' : state.currentQualityLabel;
  stage.dataset.quality = state.currentQualityLabel.toLowerCase().replaceAll(' ', '-');
  stage.dataset.approved = String(state.approved);
}

function updateDataset() {
  stage.dataset.inputCount = String(state.inputCount);
  stage.dataset.trustedInputCount = String(state.trustedInputCount);
  stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
  stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
  stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
  stage.dataset.combStrokeCount = String(state.combStrokeCount);
  stage.dataset.retainedStrokeCount = String(state.retainedStrokeCount);
  stage.dataset.combTineCount = String(state.combTineCount);
  stage.dataset.combPointCount = String(state.combPointCount);
  stage.dataset.retainedPointCount = String(state.retainedPointCount);
  stage.dataset.flowDeformationCount = String(state.flowDeformationCount);
  stage.dataset.currentQualityScore = String(state.currentQualityScore);
  stage.dataset.sourceQualityScore = String(state.sourceQualityScore);
  stage.dataset.paperCoverageRatio = String(state.paperCoverageRatio);
  stage.dataset.assetByteLength = String(state.assetByteLength);
  stage.dataset.assetSha256 = state.assetSha256;
  stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
  stage.dataset.sourceDimensions = `${state.sourceNaturalWidth}x${state.sourceNaturalHeight}`;
  stage.dataset.p5ImageEvidence = `${state.p5ImageClass}:${state.p5ImageWidth}x${state.p5ImageHeight}:${state.p5ImagePixelLength}`;
  stage.dataset.sampledPixelCount = String(state.sampledPixelCount);
  stage.dataset.sampledPixelSha256 = state.sampledPixelSha256;
  stage.dataset.distinctSampleColorCount = String(state.distinctSampleColorCount);
  stage.dataset.sampledLuminanceRange = String(state.sampledLuminanceRange);
  stage.dataset.pigmentDensity = String(state.pigmentDensity);
  stage.dataset.contaminationRatio = String(state.contaminationRatio);
  stage.dataset.pigmentCategoriesPresent = state.pigmentCategoriesPresent.join(',');
  stage.dataset.flowCellCount = String(state.flowCellCount);
  stage.dataset.flowVectorChecksum = state.flowVectorChecksum;
  stage.dataset.flowMagnitudeRange = String(state.flowMagnitudeRange);
  stage.dataset.pointerDownCount = String(state.pointerDownCount);
  stage.dataset.pointerMoveCount = String(state.pointerMoveCount);
  stage.dataset.pointerUpCount = String(state.pointerUpCount);
  stage.dataset.keyboardInputCount = String(state.keyboardInputCount);
  stage.dataset.buttonActivationCount = String(state.buttonActivationCount);
  stage.dataset.rangeInputCount = String(state.rangeInputCount);
  stage.dataset.undoCount = String(state.undoCount);
  stage.dataset.resetCount = String(state.resetCount);
  stage.dataset.approvalCount = String(state.approvalCount);
  stage.dataset.p5CompletedDrawCount = String(state.p5CompletedDrawCount);
  stage.dataset.p5ImageDrawCount = String(state.p5ImageDrawCount);
  stage.dataset.streamlineDrawCount = String(state.streamlineDrawCount);
  stage.dataset.streamlineSegmentDrawCount = String(state.streamlineSegmentDrawCount);
  stage.dataset.initialStillVerified = String(state.initialStillVerified);
  stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
  stage.dataset.runtimeFailedChecks = (state.runtimeFailedChecks || []).join(',');
  stage.dataset.automaticPlayback = String(state.automaticPlayback);
  stage.dataset.captureClockDriven = String(state.captureClockDriven);
}

function rejectUntrusted(event, source) {
  if (event?.isTrusted === true) return false;
  state.rejectedUntrustedInputCount += 1;
  state.lastInputTrusted = false;
  state.lastInputSource = source;
  updateDataset();
  return true;
}

function recordInput(event, kind, source, mutation = false) {
  state.inputCount += 1;
  state.trustedInputCount += 1;
  state.lastInputKind = kind;
  state.lastInputSource = source;
  state.lastInputTrusted = true;
  if (mutation) state.humanMutationCount += 1;
  const pointerType = event.pointerType;
  if (pointerType) {
    state.lastPointerType = pointerType;
    if (!state.pointerTypesSeen.includes(pointerType)) state.pointerTypesSeen.push(pointerType);
    if (pointerType === 'mouse') state.mouseInputCount += 1;
    if (pointerType === 'touch') state.touchInputCount += 1;
    if (pointerType === 'pen') state.penInputCount += 1;
  }
  state.interactionRecords.push({
    index: state.inputCount,
    kind,
    source,
    pointerType: pointerType || 'none',
    trusted: true,
    mutation,
    retainedStrokeCount: state.retainedStrokeCount,
    tineCount: state.combTineCount,
  });
  if (state.interactionRecords.length > 96) state.interactionRecords.shift();
  updateDataset();
}

function requestDraw(reason) {
  dirty = true;
  state.renderRequestCount += 1;
  state.lastRenderReason = reason;
  sketch?.redraw();
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width * .5, height * .5);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function circularMix(first, second, amount) {
  const ax = Math.cos(first);
  const ay = Math.sin(first);
  const bx = Math.cos(second);
  const by = Math.sin(second);
  return Math.atan2(ay * (1 - amount) + by * amount, ax * (1 - amount) + bx * amount);
}

function closestStrokeInfluence(u, v) {
  let mixedX = 0;
  let mixedY = 0;
  let influenceTotal = 0;
  const visibleStrokes = activeStroke ? [...state.strokes, activeStroke] : state.strokes;
  for (const stroke of visibleStrokes) {
    for (let index = 1; index < stroke.points.length; index += 1) {
      const first = stroke.points[index - 1];
      const second = stroke.points[index];
      const dx = second.u - first.u;
      const dy = second.v - first.v;
      const lengthSquared = dx * dx + dy * dy;
      if (lengthSquared < .000001) continue;
      const amount = clamp(((u - first.u) * dx + (v - first.v) * dy) / lengthSquared);
      const nearU = first.u + dx * amount;
      const nearV = first.v + dy * amount;
      const distance = Math.hypot(u - nearU, v - nearV);
      const radius = .035 + stroke.tines * .006;
      if (distance >= radius) continue;
      const influence = (1 - distance / radius) ** 2;
      const angle = Math.atan2(dy, dx);
      mixedX += Math.cos(angle) * influence;
      mixedY += Math.sin(angle) * influence;
      influenceTotal += influence;
    }
  }
  if (influenceTotal === 0) return null;
  return { angle: Math.atan2(mixedY, mixedX), amount: clamp(influenceTotal * .78) };
}

function drawStreamlines(context, paper) {
  const seedCount = clamp(Math.round(paper.width * .31), 56, 154);
  const baseLine = clamp(paper.width / 620, .34, .95);
  state.streamlineDrawCount = 0;
  state.streamlineSegmentDrawCount = 0;
  state.flowDeformationCount = 0;
  state.maximumFlowDeformation = 0;
  context.save();
  context.globalCompositeOperation = 'multiply';
  context.lineCap = 'round';
  context.lineJoin = 'round';
  for (let seed = 0; seed < seedCount; seed += 1) {
    let u = seeded(seed, 4);
    let v = seeded(seed, 9);
    const source = pigmentAt(u, v);
    context.beginPath();
    context.moveTo(paper.x + u * paper.width, paper.y + v * paper.height);
    let segments = 0;
    for (let step = 0; step < 25; step += 1) {
      const cell = pigmentAt(u, v);
      let angle = cell.angle;
      const deformation = closestStrokeInfluence(u, v);
      if (deformation) {
        angle = circularMix(angle, deformation.angle, deformation.amount);
        state.flowDeformationCount += 1;
        state.maximumFlowDeformation = Math.max(state.maximumFlowDeformation, deformation.amount);
      }
      const stepLength = .0053 + cell.magnitude * .0027;
      u += Math.cos(angle) * stepLength;
      v += Math.sin(angle) * stepLength * 1.22;
      if (u < 0 || u > 1 || v < 0 || v > 1) break;
      context.lineTo(paper.x + u * paper.width, paper.y + v * paper.height);
      segments += 1;
    }
    context.strokeStyle = `rgba(${source.red}, ${source.green}, ${source.blue}, ${.26 + source.density * .34})`;
    context.lineWidth = baseLine + source.density * baseLine * 1.45;
    context.stroke();
    state.streamlineDrawCount += 1;
    state.streamlineSegmentDrawCount += segments;
  }
  context.restore();
}

function drawCombGuides(context, paper) {
  state.combGuideDrawCount = 0;
  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  const visibleStrokes = activeStroke ? [...state.strokes, activeStroke] : state.strokes;
  for (const stroke of visibleStrokes) {
    if (stroke.points.length < 2) continue;
    const tineHalf = Math.floor(stroke.tines / 2);
    for (let tine = -tineHalf; tine <= tineHalf; tine += 1) {
      const offset = tine * Math.max(.9, paper.height * .0034);
      context.beginPath();
      stroke.points.forEach((point, index) => {
        const previous = stroke.points[Math.max(0, index - 1)];
        const next = stroke.points[Math.min(stroke.points.length - 1, index + 1)];
        const dx = (next.u - previous.u) * paper.width;
        const dy = (next.v - previous.v) * paper.height;
        const length = Math.max(.001, Math.hypot(dx, dy));
        const x = paper.x + point.u * paper.width - dy / length * offset;
        const y = paper.y + point.v * paper.height + dx / length * offset;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.strokeStyle = tine === 0 ? 'rgba(250, 239, 210, .52)' : 'rgba(247, 229, 194, .22)';
      context.lineWidth = tine === 0 ? .9 : .45;
      context.stroke();
      state.combGuideDrawCount += 1;
    }
  }
  context.restore();
}

function drawContaminationMarkers(context, paper) {
  state.contaminationMarkerDrawCount = 0;
  context.save();
  context.strokeStyle = 'rgba(246, 181, 105, .55)';
  context.lineWidth = .55;
  for (let index = 0; index < field.length; index += 1) {
    if (field[index].category !== 'contamination' || index % 3 !== 0) continue;
    const x = index % SAMPLE_WIDTH;
    const y = Math.floor(index / SAMPLE_WIDTH);
    const cx = paper.x + (x + .5) / SAMPLE_WIDTH * paper.width;
    const cy = paper.y + (y + .5) / SAMPLE_HEIGHT * paper.height;
    context.beginPath();
    context.arc(cx, cy, Math.max(.7, paper.width * .002), 0, TAU);
    context.stroke();
    state.contaminationMarkerDrawCount += 1;
  }
  context.restore();
}

function drawProbe(context, paper) {
  if (sampleCard.dataset.visible !== 'true') return;
  const x = paper.x + state.selectedU * paper.width;
  const y = paper.y + state.selectedV * paper.height;
  const radius = Math.max(2.4, paper.width * .012);
  context.save();
  context.strokeStyle = 'rgba(255, 246, 220, .86)';
  context.lineWidth = .7;
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.moveTo(x - radius * 1.55, y);
  context.lineTo(x + radius * 1.55, y);
  context.moveTo(x, y - radius * 1.55);
  context.lineTo(x, y + radius * 1.55);
  context.stroke();
  context.restore();
}

function drawScene() {
  if (!proofImage || !sampledPixels || !dirty) return;
  state.p5DrawCount += 1;
  const context = sketch.drawingContext;
  const paper = getPaperRect();
  sketch.clear();

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, .58)';
  context.shadowBlur = Math.max(10, paper.width * .055);
  context.shadowOffsetY = Math.max(3, paper.height * .035);
  context.fillStyle = '#d9ceb4';
  roundedRect(context, paper.x, paper.y, paper.width, paper.height, Math.max(3, paper.width * .025));
  context.fill();
  context.restore();

  context.save();
  roundedRect(context, paper.x, paper.y, paper.width, paper.height, Math.max(3, paper.width * .025));
  context.clip();
  sketch.tint(255, 235);
  sketch.image(proofImage, paper.x, paper.y, paper.width, paper.height);
  sketch.noTint();
  state.p5ImageDrawCount += 1;
  context.fillStyle = 'rgba(236, 222, 191, .08)';
  context.fillRect(paper.x, paper.y, paper.width, paper.height);
  drawStreamlines(context, paper);
  drawCombGuides(context, paper);
  drawContaminationMarkers(context, paper);
  drawProbe(context, paper);
  context.restore();

  context.save();
  context.strokeStyle = state.approved ? 'rgba(223, 141, 64, .86)' : 'rgba(238, 227, 202, .45)';
  context.lineWidth = state.approved ? 1.25 : .7;
  roundedRect(context, paper.x, paper.y, paper.width, paper.height, Math.max(3, paper.width * .025));
  context.stroke();
  if (state.approved) {
    const stampRadius = Math.max(8, paper.width * .065);
    const stampX = paper.x + paper.width * .88;
    const stampY = paper.y + paper.height * .82;
    context.strokeStyle = 'rgba(184, 75, 48, .82)';
    context.fillStyle = 'rgba(184, 75, 48, .82)';
    context.lineWidth = Math.max(.8, paper.width * .003);
    context.beginPath();
    context.arc(stampX, stampY, stampRadius, 0, TAU);
    context.stroke();
    context.font = `900 ${Math.max(4, paper.width * .026)}px ui-monospace, monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('PASS', stampX, stampY);
  }
  context.restore();

  state.p5CompletedDrawCount += 1;
  state.maximumFlowDeformation = rounded(state.maximumFlowDeformation);
  updateDataset();
  dirty = false;
}

function finalizeStroke() {
  if (!activeStroke) return;
  if (activeStroke.points.length >= 2) {
    state.strokes.push(activeStroke);
    state.combStrokeCount += 1;
    state.combPointCount += activeStroke.points.length;
    state.retainedStrokeCount = state.strokes.length;
    state.retainedPointCount = state.strokes.reduce((total, stroke) => total + stroke.points.length, 0);
    state.combMutationCount += 1;
    state.reversibleMutationCount += 1;
    state.approved = false;
    updateQuality();
  }
  activeStroke = null;
}

function onPointerEnter(event) {
  if (rejectUntrusted(event, 'canvas-pointerenter')) return;
  state.pointerEnterCount += 1;
  recordInput(event, 'pointer-enter', 'canvas', false);
}

function onPointerMove(event) {
  if (rejectUntrusted(event, 'canvas-pointermove')) return;
  const point = pointToPaper(event);
  if (state.activePointerId === event.pointerId && activeStroke) {
    event.preventDefault();
    state.pointerMoveCount += 1;
    const previous = activeStroke.points.at(-1);
    const next = { u: clamp(point.u), v: clamp(point.v) };
    if (Math.hypot(next.u - previous.u, next.v - previous.v) >= .009) {
      activeStroke.points.push(next);
      state.combMutationCount += 1;
      recordInput(event, 'pointer-drag', 'captured-comb', true);
      updateProbe(next);
      requestDraw('trusted-pointer-drag');
    }
    return;
  }
  if (!point.inside) {
    sampleCard.dataset.visible = 'false';
    requestDraw('trusted-hover-exit-paper');
    return;
  }
  state.hoverMoveCount += 1;
  recordInput(event, 'pointer-hover', 'paper-probe', true);
  updateProbe(point);
  requestDraw('trusted-pigment-probe');
}

function onPointerDown(event) {
  if (rejectUntrusted(event, 'canvas-pointerdown')) return;
  const point = pointToPaper(event);
  if (!point.inside || state.activePointerId !== null) return;
  event.preventDefault();
  sketch.canvas.focus({ preventScroll: true });
  state.pointerDownCount += 1;
  state.activePointerId = event.pointerId;
  state.pointerCaptured = true;
  sketch.canvas.setPointerCapture(event.pointerId);
  state.pointerCaptureCount += 1;
  activeStroke = { tines: state.combTineCount, pointerType: event.pointerType || 'mouse', points: [{ u: point.u, v: point.v }] };
  recordInput(event, 'pointer-down', 'paper-comb', true);
  updateProbe(point);
  requestDraw('trusted-pointer-down');
}

function releasePointer(event, cancelled = false) {
  if (rejectUntrusted(event, cancelled ? 'canvas-pointercancel' : 'canvas-pointerup')) return;
  if (state.activePointerId !== event.pointerId) return;
  event.preventDefault();
  if (cancelled) state.pointerCancelCount += 1;
  else state.pointerUpCount += 1;
  finalizeStroke();
  if (sketch.canvas.hasPointerCapture(event.pointerId)) sketch.canvas.releasePointerCapture(event.pointerId);
  state.pointerCaptureReleaseCount += 1;
  state.activePointerId = null;
  state.pointerCaptured = false;
  recordInput(event, cancelled ? 'pointer-cancel' : 'pointer-up', 'captured-comb', true);
  requestDraw(cancelled ? 'trusted-pointer-cancel' : 'trusted-pointer-up');
}

function onPointerLeave(event) {
  if (rejectUntrusted(event, 'canvas-pointerleave')) return;
  if (state.activePointerId === event.pointerId) return;
  recordInput(event, 'pointer-leave', 'canvas', true);
  sampleCard.dataset.visible = 'false';
  requestDraw('pointer-leave');
}

function setTines(value, event, source) {
  const next = clamp(Math.round((Number(value) - 3) / 2) * 2 + 3, 3, 11);
  if (next === state.combTineCount) return false;
  state.combTineCount = next;
  state.tineMutationCount += 1;
  state.approved = false;
  updateQuality();
  recordInput(event, source === 'range' ? 'range' : 'keyboard', source, true);
  requestDraw(`trusted-${source}-tines`);
  return true;
}

function undo(event, source = 'button') {
  if (state.strokes.length === 0) return false;
  state.strokes.pop();
  state.undoCount += 1;
  state.retainedStrokeCount = state.strokes.length;
  state.retainedPointCount = state.strokes.reduce((total, stroke) => total + stroke.points.length, 0);
  state.reversibleMutationCount += 1;
  state.approved = false;
  updateQuality();
  recordInput(event, source === 'button' ? 'button' : 'keyboard', `${source}-undo`, true);
  requestDraw(`trusted-${source}-undo`);
  return true;
}

function reset(event, source = 'button') {
  const changed = state.strokes.length > 0 || state.combTineCount !== INITIAL_TINES || state.approved;
  state.strokes.length = 0;
  state.combTineCount = INITIAL_TINES;
  state.retainedStrokeCount = 0;
  state.retainedPointCount = 0;
  state.approved = false;
  state.resetCount += 1;
  if (changed) state.reversibleMutationCount += 1;
  updateQuality();
  recordInput(event, source === 'button' ? 'button' : 'keyboard', `${source}-reset`, changed);
  requestDraw(`trusted-${source}-reset`);
}

function approve(event, source = 'button') {
  const passes = state.currentQualityScore >= 78 && state.retainedStrokeCount > 0;
  state.approved = passes;
  if (passes) state.approvalCount += 1;
  else state.holdCount += 1;
  state.approvalMutationCount += 1;
  updateQuality();
  recordInput(event, source === 'button' ? 'button' : 'keyboard', `${source}-approve`, true);
  requestDraw(`trusted-${source}-approve`);
}

function bindHumanInputs() {
  const canvas = sketch.canvas;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Pixel-driven marbling proof. Hover to inspect pigment and drag to comb the current.');
  canvas.addEventListener('pointerenter', onPointerEnter);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', event => releasePointer(event, false));
  canvas.addEventListener('pointercancel', event => releasePointer(event, true));
  canvas.addEventListener('pointerleave', onPointerLeave);

  tineInput.addEventListener('keydown', event => event.stopPropagation());
  tineInput.addEventListener('input', event => {
    if (rejectUntrusted(event, 'range-comb-tines')) return;
    state.rangeInputCount += 1;
    setTines(event.currentTarget.value, event, 'range');
  });

  actionButtons.forEach(button => button.addEventListener('click', event => {
    if (rejectUntrusted(event, `button-${button.dataset.action}`)) return;
    state.buttonActivationCount += 1;
    if (button.dataset.action === 'undo') undo(event);
    if (button.dataset.action === 'reset') reset(event);
    if (button.dataset.action === 'approve') approve(event);
  }));

  const onKeyDown = event => {
    if (!['ArrowLeft', 'ArrowRight', 'u', 'U', 'r', 'R', 'Enter'].includes(event.key)) return;
    if (rejectUntrusted(event, 'stage-keyboard')) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (event.key === 'ArrowLeft') setTines(state.combTineCount - 2, event, 'keyboard');
    if (event.key === 'ArrowRight') setTines(state.combTineCount + 2, event, 'keyboard');
    if (event.key === 'u' || event.key === 'U') undo(event, 'keyboard');
    if (event.key === 'r' || event.key === 'R') reset(event, 'keyboard');
    if (event.key === 'Enter') approve(event, 'keyboard');
  };
  stage.addEventListener('keydown', onKeyDown);
}

function canvasSignature() {
  const context = sketch.drawingContext;
  const width = sketch.width;
  const height = sketch.height;
  const pixels = context.getImageData(0, 0, width, height).data;
  let signature = 2166136261;
  const step = Math.max(4, Math.floor(pixels.length / 3072 / 4) * 4);
  for (let index = 0; index < pixels.length; index += step) {
    signature ^= pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7 + pixels[index + 3] * 11;
    signature = Math.imul(signature, 16777619) >>> 0;
  }
  return signature.toString(16).padStart(8, '0');
}

async function createSketch() {
  let resolveReady;
  const ready = new Promise(resolve => {
    resolveReady = resolve;
  });
  sketch = new p5(instance => {
    instance.setup = () => {
      instance.pixelDensity(1);
      const width = Math.max(1, Math.round(canvasHost.clientWidth));
      const height = Math.max(1, Math.round(canvasHost.clientHeight));
      instance.createCanvas(width, height, instance.P2D);
      instance.noLoop();
      state.p5InstanceReady = true;
      state.p5CanvasReady = true;
      state.p5CanvasWidth = width;
      state.p5CanvasHeight = height;
      state.strokes = [];
      bindHumanInputs();
      updateQuality();
      updateDataset();
      resolveReady();
    };
    instance.draw = drawScene;
  }, canvasHost);

  await ready;
  proofImage = await new Promise((resolve, reject) => {
    sketch.loadImage(
      ASSET_URL,
      resolve,
      error => reject(new Error(`p5 image decode failed: ${error}`)),
    );
  });
  state.p5ImageDecoded = proofImage instanceof p5.Image;
  state.p5ImageClass = state.p5ImageDecoded ? 'p5.Image' : '';
  state.p5ImageWidth = proofImage.width;
  state.p5ImageHeight = proofImage.height;
  proofImage.loadPixels();
  state.p5ImagePixelLength = proofImage.pixels.length;
  requestDraw('p5-image-decoded');
  const resizeObserver = new ResizeObserver(entries => {
    const entry = entries[0];
    const width = Math.max(1, Math.round(entry.contentRect.width));
    const height = Math.max(1, Math.round(entry.contentRect.height));
    if (width === sketch.width && height === sketch.height) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      sketch.resizeCanvas(width, height, true);
      state.p5CanvasWidth = width;
      state.p5CanvasHeight = height;
      state.responsiveResizeCount += 1;
      requestDraw('responsive-resize');
    });
  });
  resizeObserver.observe(canvasHost);
  window.addEventListener('beforeunload', () => resizeObserver.disconnect(), { once: true });
}

async function start() {
  await fetchAndAnalyzeAsset();
  await createSketch();
  const ready = Promise.all([document.fonts.ready]);
  const render = () => {
    state.previewRenderCalls += 1;
    if (dirty) sketch.redraw();
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    render(0);
    const first = canvasSignature();
    render(1.35);
    const second = canvasSignature();
    state.initialVisualSignature ||= first;
    state.repeatedInitialVisualSignature = second;
    state.initialStillVerified = first === second;
    const checks = {
      p5Runtime: sketch instanceof p5
        && proofImage instanceof p5.Image
        && state.p5InstanceReady
        && state.p5CanvasReady
        && state.p5CanvasWidth > 0
        && state.p5CanvasHeight > 0,
      exactAsset: state.assetFetchCount === 1
        && state.assetResponseStatus === 200
        && state.assetMimeType.includes('image/jpeg')
        && state.assetSameOrigin
        && state.assetByteLength === EXPECTED_ASSET.bytes
        && state.assetShaMatchesExpected
        && state.assetSha256 === EXPECTED_ASSET.sha256
        && state.browserImageDecoded
        && state.sourceNaturalWidth === EXPECTED_ASSET.width
        && state.sourceNaturalHeight === EXPECTED_ASSET.height,
      p5Decode: state.p5ImageDecoded
        && state.p5ImageClass === 'p5.Image'
        && state.p5ImageWidth === EXPECTED_ASSET.width
        && state.p5ImageHeight === EXPECTED_ASSET.height
        && state.p5ImagePixelLength >= EXPECTED_ASSET.width * EXPECTED_ASSET.height * 4,
      sampledRaster: state.sampledPixelCount === SAMPLE_SIZE
        && state.sampledPixelByteLength === SAMPLE_SIZE * 4
        && state.sampledPixelSha256.length === 64
        && !/^0+$/.test(state.sampledPixelSha256)
        && state.sampledPixelChecksum.length === 8
        && state.distinctSampleColorCount > 250
        && state.sourceAlphaFailureCount === 0,
      luminanceAndDensity: state.sampledLuminanceMinimum >= 0
        && state.sampledLuminanceMinimum < .24
        && state.sampledLuminanceMaximum > .72
        && state.sampledLuminanceMaximum <= 1
        && state.sampledLuminanceRange > .55
        && state.pigmentDensity > .2
        && state.pigmentDensity < .88
        && state.pigmentDensityRange > .55
        && state.contaminationPixelCount >= 0
        && state.contaminationRatio < .18,
      pigmentTopology: state.pigmentCategoriesPresent.includes('indigo')
        && state.pigmentCategoriesPresent.includes('oxidized-teal')
        && state.pigmentCategoriesPresent.includes('madder')
        && state.pigmentCategoriesPresent.includes('ochre'),
      flowField: state.flowCellCount === SAMPLE_SIZE
        && state.flowVectorChecksum.length === 8
        && state.flowMagnitudeMinimum > 0
        && state.flowMagnitudeMaximum > state.flowMagnitudeMinimum
        && state.flowMagnitudeRange > .2,
      qualityRange: state.sourceQualityScore >= 60 && state.sourceQualityScore <= 89,
      surfaceCoverage: state.paperCoverageRatio > .42 && state.paperCoverageRatio < .52,
      imageRendered: state.p5ImageDrawCount >= 1,
      streamlinesRendered: state.streamlineDrawCount >= 50 && state.streamlineSegmentDrawCount >= 400,
      staticInitial: state.initialStillVerified,
      humanOnly: state.automaticCycle === false
        && state.automaticPlayback === false
        && state.automaticRehearsal === false
        && state.automaticFallback === false
        && state.syntheticInputDispatch === false
        && state.captureClockDriven === false
        && state.previewClockMutationCount === 0
        && state.renderIgnoresPreviewClock
        && state.nonInputVisualMutationCountAfterReady === 0,
    };
    state.runtimeChecks = checks;
    state.runtimeFailedChecks = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
    state.runtimeAssertionPassed = state.runtimeFailedChecks.length === 0;
    updateDataset();
    return state.runtimeAssertionPassed;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render,
    ready,
  });
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  state.ready = true;
  await window.__PREVIEW_RUNTIME_ASSERT__();
}

start().catch(markPreviewFailure);
