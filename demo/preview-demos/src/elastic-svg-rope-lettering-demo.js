import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/elastic-svg-rope-lettering/rope-material-board.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = {
  bytes: 361333,
  width: 960,
  height: 640,
  sha256: '3262bccad6dfa4bfafa62ecf3cfae47592fe2ce2cfee030816736464446ee046',
};
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 64;
const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 180;
const MATERIAL_KEYS = ['gold', 'navy', 'coral', 'flax'];
const MATERIAL_LABELS = { gold: 'GOLD', navy: 'NAVY', coral: 'CORAL', flax: 'FLAX' };
const BACKGROUND_RGB = [18, 21, 18];
const BASE_POINTS = [
  [35, 63], [82, 63], [59, 63], [59, 121],
  [98, 121], [98, 63], [98, 121], [125, 121],
  [125, 121], [125, 63], [150, 63], [167, 74], [172, 91], [168, 108], [151, 121], [125, 121],
  [198, 121], [198, 63], [263, 63], [198, 63], [198, 91], [245, 91], [198, 91], [198, 121], [266, 121],
].map(([x, y]) => ({ x, y }));

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, precision = 4) => Number(value.toFixed(precision));
const distance = (first, second) => Math.hypot(first.x - second.x, first.y - second.y);

const stage = document.querySelector('#rope-stage');
const workbench = document.querySelector('#rope-workbench');
const ropePaths = [
  document.querySelector('#rope-shadow'),
  document.querySelector('#rope-core'),
  document.querySelector('#rope-twist'),
  document.querySelector('#rope-sheen'),
];
const ropeCore = document.querySelector('#rope-core');
const ropeSheen = document.querySelector('#rope-sheen');
const handleLayer = document.querySelector('#handle-layer');
const materialImage = document.querySelector('#material-image');
const materialScanOutput = document.querySelector('#material-scan-output');
const materialControls = document.querySelector('#material-controls');
const tensionButton = document.querySelector('#tension-button');
const lockButton = document.querySelector('#lock-button');
const resetButton = document.querySelector('#reset-button');
const legibilityOutput = document.querySelector('#legibility-output');
const loadOutput = document.querySelector('#load-output');
const decisionOutput = document.querySelector('#decision-output');
const statusOutput = document.querySelector('#status-output');

const state = {
  id: 'elastic-svg-rope-lettering',
  task: 'human-operated-material-aware-elastic-rope-wayfinding-lettering-proof',
  claimedLibrary: 'motion@12.42.2',
  renderer: 'svg',
  mechanism: 'browser-decoded-rope-source-pixels-drive-material-corner-radius-stroke-coupling-load-and-legibility-while-trusted-human-input-edits-svg-path-nodes',
  assetMechanismRole: 'exact-browser-decoded-source-pixels-determine-selectable-rope-materials-rendered-letterform-geometry-physical-response-and-proof-decision',
  acceptedInputs: ['trusted-mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'visible-material-buttons', 'visible-tension-button', 'visible-lock-button', 'visible-reset-button', 'keyboard'],
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
  motionControlReady: false,
  motionControlSeekCount: 0,
  motionControlTime: 0,
  ready: false,
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  tensionMode: 'soft',
  locked: false,
  selectedMaterial: 'pending',
  recommendedMaterial: 'pending',
  activeNode: 0,
  activePointerId: null,
  pointerCaptured: false,
  inputCount: 0,
  trustedInputCount: 0,
  rejectedUntrustedInputCount: 0,
  hoverInputCount: 0,
  pointerDownCount: 0,
  pointerDragCount: 0,
  pointerReleaseCount: 0,
  pointerCancelCount: 0,
  pointerCaptureCount: 0,
  pointerCaptureReleaseCount: 0,
  mouseInputCount: 0,
  touchInputCount: 0,
  penInputCount: 0,
  keyboardInputCount: 0,
  keyboardMutationCount: 0,
  buttonInputCount: 0,
  materialSelectionCount: 0,
  tensionToggleCount: 0,
  lockToggleCount: 0,
  resetCount: 0,
  shapeMutationCount: 0,
  humanVisualMutationCount: 0,
  lastInputKind: 'none',
  lastInputSource: 'none',
  lastInputTrusted: false,
  lastPointerType: 'none',
  pointerTypesSeen: [],
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
  decodedWidth: 0,
  decodedHeight: 0,
  sampledWidth: SAMPLE_WIDTH,
  sampledHeight: SAMPLE_HEIGHT,
  sampledPixelCount: 0,
  sampledPixelByteLength: 0,
  sampledPixelSha256: '',
  sampledPixelChecksum: '',
  sampledOpaquePixelCount: 0,
  distinctSampleColorCount: 0,
  sampledLumaMinimum: 255,
  sampledLumaMaximum: 0,
  sampledLumaRange: 0,
  sampledEdgeMean: 0,
  sampledSaturationMean: 0,
  classificationCounts: {},
  detectedMaterialCount: 0,
  materialProfiles: [],
  materialButtonsCreated: 0,
  pixelEvidenceBoundToLetterform: false,
  pixelDrivenCornerRadius: 0,
  pixelDrivenStrokeWidth: 0,
  pixelDrivenCoupling: 0,
  sourceContrastRatio: 0,
  basePathLength: 0,
  currentPathLength: 0,
  initialPathData: '',
  currentPathData: '',
  maximumNodeDisplacement: 0,
  averageNodeDisplacement: 0,
  maximumRecordedNodeDisplacement: 0,
  maximumDragDistance: 0,
  legibilityScore: 0,
  loadEstimate: 0,
  decision: 'analysing',
  stageWidth: 0,
  stageHeight: 0,
  signCoverageRatio: 0,
  handleCount: BASE_POINTS.length,
};

window.__PREVIEW_INTERACTION_STATE__ = state;
window.__ELASTIC_SVG_ROPE_LETTERING_STATE__ = state;

let positions = BASE_POINTS.map(point => ({ ...point }));
let sourceObjectUrl = '';
let dragStartPoint = null;
let dragStartPositions = null;
let hoverNode = 0;
let materialProfiles = new Map();
const handles = [];
const tensionMotion = animate(ropeSheen, { opacity: [.36, .96] }, {
  duration: 1,
  ease: 'linear',
  autoplay: false,
});
tensionMotion.pause();
state.motionControlReady = typeof tensionMotion.pause === 'function' && tensionMotion.duration === 1;

function syncMotionEvidence() {
  const profile = materialProfiles.get(state.selectedMaterial);
  if (!profile || !state.motionControlReady) return;
  const materialSeek = clamp((profile.stiffness - .46) / (.88 - .46), 0, 1);
  const next = clamp(materialSeek * .72 + (state.tensionMode === 'firm' ? .28 : 0), 0, 1);
  if (Math.abs(tensionMotion.time - next) > .0001) state.motionControlSeekCount += 1;
  tensionMotion.time = next;
  state.motionControlTime = rounded(tensionMotion.time, 4);
}

function invariant(condition, message) {
  if (!condition) throw new Error(`elastic-svg-rope-lettering: ${message}`);
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function pixelChecksum(pixels) {
  let signature = 2166136261;
  for (let index = 0; index < pixels.length; index += 1) {
    signature ^= pixels[index];
    signature = Math.imul(signature, 16777619) >>> 0;
  }
  return signature.toString(16).padStart(8, '0');
}

function relativeLuminance([red, green, blue]) {
  const channels = [red, green, blue].map(value => {
    const normalized = value / 255;
    return normalized <= .03928 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
  });
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}

function contrastRatio(first, second) {
  const firstLuma = relativeLuminance(first);
  const secondLuma = relativeLuminance(second);
  return (Math.max(firstLuma, secondLuma) + .05) / (Math.min(firstLuma, secondLuma) + .05);
}

function mixColor(color, target, ratio) {
  return color.map((value, index) => Math.round(value + (target[index] - value) * ratio));
}

function cssColor(color) {
  return `rgb(${color[0]} ${color[1]} ${color[2]})`;
}

function classifyMaterial(red, green, blue) {
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const luma = .2126 * red + .7152 * green + .0722 * blue;
  const saturation = maximum ? (maximum - minimum) / maximum : 0;
  if (luma < 64 && saturation < .38) return 'charcoal';
  if (blue > red * 1.18 && blue > green * 1.04 && luma < 115) return 'navy';
  if (red > 110 && red > green * 1.42 && green > blue * 1.08 && blue > 30) return 'coral';
  if (red > 105 && green > 56 && red > blue * 1.72 && green > blue * 1.45) return 'gold';
  if (luma > 156 && saturation < .27) return 'ivory';
  if (red > 92 && green > 72 && red > blue * 1.13 && green > blue * 1.05) return 'flax';
  return 'neutral';
}

function analyzePixels(pixels) {
  const categories = ['gold', 'navy', 'coral', 'flax', 'ivory', 'charcoal', 'neutral'];
  const stats = Object.fromEntries(categories.map(key => [key, {
    key,
    count: 0,
    red: 0,
    green: 0,
    blue: 0,
    edge: 0,
    edgeSamples: 0,
    saturation: 0,
  }]));
  const distinctColors = new Set();
  let lumaMinimum = 255;
  let lumaMaximum = 0;
  let edgeTotal = 0;
  let edgeSamples = 0;
  let saturationTotal = 0;

  for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
    for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
      const index = (y * SAMPLE_WIDTH + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      const luma = .2126 * red + .7152 * green + .0722 * blue;
      const maximum = Math.max(red, green, blue);
      const minimum = Math.min(red, green, blue);
      const saturation = maximum ? (maximum - minimum) / maximum : 0;
      const category = classifyMaterial(red, green, blue);
      const record = stats[category];
      record.count += 1;
      record.red += red;
      record.green += green;
      record.blue += blue;
      record.saturation += saturation;
      if (alpha === 255) state.sampledOpaquePixelCount += 1;
      lumaMinimum = Math.min(lumaMinimum, luma);
      lumaMaximum = Math.max(lumaMaximum, luma);
      saturationTotal += saturation;
      distinctColors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);

      if (x > 0) {
        const previous = index - 4;
        const edge = (
          Math.abs(red - pixels[previous])
          + Math.abs(green - pixels[previous + 1])
          + Math.abs(blue - pixels[previous + 2])
        ) / 3;
        edgeTotal += edge;
        edgeSamples += 1;
        record.edge += edge;
        record.edgeSamples += 1;
      }
    }
  }

  state.sampledPixelCount = pixels.length / 4;
  state.sampledPixelByteLength = pixels.length;
  state.sampledPixelChecksum = pixelChecksum(pixels);
  state.distinctSampleColorCount = distinctColors.size;
  state.sampledLumaMinimum = rounded(lumaMinimum, 2);
  state.sampledLumaMaximum = rounded(lumaMaximum, 2);
  state.sampledLumaRange = rounded(lumaMaximum - lumaMinimum, 2);
  state.sampledEdgeMean = rounded(edgeTotal / Math.max(1, edgeSamples), 4);
  state.sampledSaturationMean = rounded(saturationTotal / state.sampledPixelCount, 4);
  state.classificationCounts = Object.fromEntries(categories.map(key => [key, stats[key].count]));

  state.materialProfiles = MATERIAL_KEYS.map((key, index) => {
    const record = stats[key];
    invariant(record.count > 0, `${key} material has no classified pixels`);
    const rgb = [record.red, record.green, record.blue].map(total => Math.round(total / record.count));
    const materialEdge = record.edge / Math.max(1, record.edgeSamples);
    const materialSaturation = record.saturation / record.count;
    const contrast = contrastRatio(rgb, BACKGROUND_RGB);
    const stiffness = clamp(.44 + materialEdge / 115 + materialSaturation * .18, .46, .88);
    const coupling = clamp(1.55 + stiffness * 2.7 + index * .07, 2.2, 4.35);
    const strokeWidth = clamp(4.15 + materialEdge / 21 + Math.sqrt(record.count) / 180, 4.35, 6.35);
    const loadFactor = clamp(.72 + stiffness * .82 + materialSaturation * .26, .8, 1.72);
    const baseLegibility = clamp(61 + contrast * 5.5 + state.sampledLumaRange / 22, 62, 98);
    return {
      key,
      label: MATERIAL_LABELS[key],
      pixelCount: record.count,
      sampleShare: rounded(record.count / state.sampledPixelCount, 4),
      rgb,
      css: cssColor(rgb),
      lightCss: cssColor(mixColor(rgb, [255, 247, 214], .48)),
      darkCss: cssColor(mixColor(rgb, [7, 9, 8], .48)),
      edgeMean: rounded(materialEdge, 4),
      saturationMean: rounded(materialSaturation, 4),
      contrastRatio: rounded(contrast, 4),
      stiffness: rounded(stiffness, 4),
      coupling: rounded(coupling, 4),
      strokeWidth: rounded(strokeWidth, 4),
      loadFactor: rounded(loadFactor, 4),
      baseLegibility: rounded(baseLegibility, 4),
      checksum: pixelChecksum(Uint8Array.from([
        ...rgb,
        record.count & 255,
        (record.count >> 8) & 255,
        Math.round(materialEdge) & 255,
      ])),
    };
  });
  state.detectedMaterialCount = state.materialProfiles.filter(profile => profile.pixelCount >= 30).length;
  materialProfiles = new Map(state.materialProfiles.map(profile => [profile.key, profile]));
  const recommended = [...state.materialProfiles].sort((first, second) => {
    const firstScore = first.baseLegibility + first.sampleShare * 30 + first.edgeMean * .12;
    const secondScore = second.baseLegibility + second.sampleShare * 30 + second.edgeMean * .12;
    return secondScore - firstScore;
  })[0];
  state.recommendedMaterial = recommended.key;
}

function roundedPath(points, radius) {
  const commands = [`M ${rounded(points[0].x, 2)} ${rounded(points[0].y, 2)}`];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const incoming = distance(previous, current);
    const outgoing = distance(current, next);
    if (incoming < .01 || outgoing < .01) {
      commands.push(`L ${rounded(current.x, 2)} ${rounded(current.y, 2)}`);
      continue;
    }
    const bend = Math.min(radius, incoming * .28, outgoing * .28);
    const entry = {
      x: current.x + (previous.x - current.x) / incoming * bend,
      y: current.y + (previous.y - current.y) / incoming * bend,
    };
    const exit = {
      x: current.x + (next.x - current.x) / outgoing * bend,
      y: current.y + (next.y - current.y) / outgoing * bend,
    };
    commands.push(
      `L ${rounded(entry.x, 2)} ${rounded(entry.y, 2)}`,
      `Q ${rounded(current.x, 2)} ${rounded(current.y, 2)} ${rounded(exit.x, 2)} ${rounded(exit.y, 2)}`,
    );
  }
  const last = points.at(-1);
  commands.push(`L ${rounded(last.x, 2)} ${rounded(last.y, 2)}`);
  return commands.join(' ');
}

function buildHandles() {
  BASE_POINTS.forEach((_, index) => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('handle');
    group.dataset.index = String(index);
    group.innerHTML = '<circle class="handle-hit" r="6.5"/><circle class="handle-knot" r="1.55"/>';
    handleLayer.append(group);
    handles.push(group);
  });
}

function syncLayoutEvidence() {
  const stageBounds = stage.getBoundingClientRect();
  const signFrame = workbench.querySelector('.sign-frame').getBoundingClientRect();
  state.stageWidth = rounded(stageBounds.width, 2);
  state.stageHeight = rounded(stageBounds.height, 2);
  state.signCoverageRatio = rounded(
    signFrame.width * signFrame.height / Math.max(1, stageBounds.width * stageBounds.height),
  );
}

function selectedProfile() {
  return materialProfiles.get(state.selectedMaterial) || state.materialProfiles[0];
}

function updateEvidence() {
  const profile = selectedProfile();
  if (!profile) return;
  const displacements = positions.map((point, index) => distance(point, BASE_POINTS[index]));
  state.maximumNodeDisplacement = rounded(Math.max(...displacements), 3);
  state.averageNodeDisplacement = rounded(displacements.reduce((sum, value) => sum + value, 0) / displacements.length, 3);
  state.maximumRecordedNodeDisplacement = Math.max(state.maximumRecordedNodeDisplacement, state.maximumNodeDisplacement);
  const lengthStretch = state.basePathLength > 0 ? Math.abs(state.currentPathLength / state.basePathLength - 1) : 0;
  const deformationPenalty = state.averageNodeDisplacement * 1.6 + state.maximumNodeDisplacement * .28 + lengthStretch * 46;
  state.sourceContrastRatio = profile.contrastRatio;
  state.legibilityScore = Math.round(clamp(profile.baseLegibility - deformationPenalty, 28, 99));
  state.loadEstimate = rounded(state.maximumNodeDisplacement * profile.loadFactor * (state.tensionMode === 'firm' ? 1.42 : .86), 1);
  state.decision = state.legibilityScore >= 78 && profile.contrastRatio >= 3 ? 'pass' : 'refine';
  legibilityOutput.textContent = `${state.legibilityScore} / 100`;
  loadOutput.textContent = `${state.loadEstimate.toFixed(1)} N`;
  decisionOutput.textContent = state.locked
    ? state.decision === 'pass' ? 'LOCKED · PASS' : 'LOCKED · REFINE'
    : state.decision === 'pass' ? 'READY TO LOCK' : 'RESHAPE / RESELECT';
  decisionOutput.dataset.pass = String(state.decision === 'pass');
  statusOutput.textContent = `${profile.label} · ${profile.pixelCount} SOURCE PX · ${state.tensionMode.toUpperCase()} COUPLING · ${state.locked ? 'PROOF LOCKED' : 'DRAG A KNOT'}`;
  materialScanOutput.textContent = `${state.sampledPixelCount.toLocaleString()} PX / ${state.sampledEdgeMean.toFixed(1)} EDGE`;
  workbench.setAttribute('aria-label', `Editable SVG rope wordmark spelling TIDE. ${profile.label} material, ${state.legibilityScore} legibility, ${state.locked ? 'locked' : 'editable'}.`);
}

function syncDataset() {
  stage.dataset.ready = String(state.ready);
  stage.dataset.material = state.selectedMaterial;
  stage.dataset.tension = state.tensionMode;
  stage.dataset.locked = String(state.locked);
  stage.dataset.decision = state.decision;
  stage.dataset.activeNode = String(state.activeNode);
  stage.dataset.inputCount = String(state.inputCount);
  stage.dataset.trustedInputCount = String(state.trustedInputCount);
  stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
  stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
  stage.dataset.pixelEvidenceBoundToLetterform = String(state.pixelEvidenceBoundToLetterform);
  stage.dataset.automaticPlayback = String(state.automaticPlayback);
  stage.dataset.captureClockDriven = String(state.captureClockDriven);
  workbench.dataset.dragging = String(state.activePointerId !== null);
}

function renderPath() {
  const profile = selectedProfile();
  const radius = profile
    ? clamp(1.45 + state.sampledEdgeMean / 13 + profile.stiffness * .9, 2.25, 5.4)
    : 3;
  state.pixelDrivenCornerRadius = rounded(radius, 4);
  const pathData = roundedPath(positions, radius);
  ropePaths.forEach(path => path.setAttribute('d', pathData));
  state.currentPathData = pathData;
  state.currentPathLength = rounded(ropeCore.getTotalLength(), 4);
  if (!state.initialPathData && profile) {
    state.initialPathData = pathData;
    state.basePathLength = state.currentPathLength;
  }
  handles.forEach((handle, index) => {
    handle.setAttribute('transform', `translate(${rounded(positions[index].x, 2)} ${rounded(positions[index].y, 2)})`);
    handle.dataset.active = String(index === state.activeNode || index === hoverNode);
    const span = state.tensionMode === 'firm' ? 4 : 2;
    handle.dataset.neighbor = String(
      state.activePointerId !== null
      && index !== state.activeNode
      && Math.abs(index - state.activeNode) <= span
    );
  });
  updateEvidence();
  syncMotionEvidence();
  syncDataset();
}

function applyMaterial(key, humanMutation = false) {
  const profile = materialProfiles.get(key);
  if (!profile) return;
  state.selectedMaterial = key;
  state.pixelDrivenStrokeWidth = profile.strokeWidth;
  state.pixelDrivenCoupling = profile.coupling;
  stage.style.setProperty('--rope', profile.css);
  stage.style.setProperty('--rope-light', profile.lightCss);
  stage.style.setProperty('--rope-dark', profile.darkCss);
  stage.style.setProperty('--rope-width', `${profile.strokeWidth}px`);
  stage.style.setProperty('--rope-shadow-width', `${profile.strokeWidth + 2.15}px`);
  for (const button of materialControls.querySelectorAll('[data-material]')) {
    button.setAttribute('aria-pressed', String(button.dataset.material === key));
  }
  if (humanMutation) {
    state.materialSelectionCount += 1;
    state.humanVisualMutationCount += 1;
  }
  renderPath();
}

function buildMaterialControls() {
  state.materialProfiles.forEach(profile => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.material = profile.key;
    button.textContent = profile.label;
    button.style.setProperty('--swatch', profile.css);
    button.setAttribute('aria-label', `Use pixel-derived ${profile.label.toLowerCase()} rope, ${profile.contrastRatio.toFixed(1)} to one contrast`);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', event => {
      if (!acceptTrustedInput(event, `material-button-${profile.key}`, 'button')) return;
      state.buttonInputCount += 1;
      applyMaterial(profile.key, true);
    });
    materialControls.append(button);
    state.materialButtonsCreated += 1;
  });
}

function acceptTrustedInput(event, kind, source = event?.pointerType || 'keyboard') {
  if (event?.isTrusted !== true) {
    state.rejectedUntrustedInputCount += 1;
    state.lastInputTrusted = false;
    syncDataset();
    return false;
  }
  state.inputCount += 1;
  state.trustedInputCount += 1;
  state.lastInputKind = kind;
  state.lastInputSource = source;
  state.lastInputTrusted = true;
  if (event.pointerType) {
    state.lastPointerType = event.pointerType;
    if (!state.pointerTypesSeen.includes(event.pointerType)) state.pointerTypesSeen.push(event.pointerType);
    if (event.pointerType === 'mouse') state.mouseInputCount += 1;
    if (event.pointerType === 'touch') state.touchInputCount += 1;
    if (event.pointerType === 'pen') state.penInputCount += 1;
  }
  return true;
}

function eventPoint(event) {
  const svgPoint = workbench.createSVGPoint();
  svgPoint.x = event.clientX;
  svgPoint.y = event.clientY;
  const matrix = workbench.getScreenCTM();
  invariant(matrix, 'SVG screen transform is unavailable');
  const local = svgPoint.matrixTransform(matrix.inverse());
  return { x: local.x, y: local.y };
}

function nearestNode(point) {
  let candidate = 0;
  let candidateDistance = Infinity;
  positions.forEach((position, index) => {
    const currentDistance = distance(point, position);
    if (currentDistance < candidateDistance) {
      candidate = index;
      candidateDistance = currentDistance;
    }
  });
  return { index: candidate, distance: candidateDistance };
}

function setActiveNode(index) {
  state.activeNode = clamp(index, 0, positions.length - 1);
  hoverNode = state.activeNode;
  renderPath();
}

function moveSelected(deltaX, deltaY, origin = positions) {
  const profile = selectedProfile();
  if (!profile) return;
  const radius = state.tensionMode === 'firm' ? profile.coupling : Math.max(1.4, profile.coupling * .53);
  positions = origin.map((point, index) => {
    const graphDistance = Math.abs(index - state.activeNode);
    const weight = Math.exp(-(graphDistance ** 2) / (2 * radius ** 2));
    return {
      x: clamp(point.x + deltaX * weight, 30, 290),
      y: clamp(point.y + deltaY * weight, 55, 130),
    };
  });
  state.shapeMutationCount += 1;
  state.humanVisualMutationCount += 1;
  renderPath();
}

function resetProof(humanMutation = true) {
  positions = BASE_POINTS.map(point => ({ ...point }));
  state.locked = false;
  state.activeNode = 0;
  hoverNode = 0;
  lockButton.setAttribute('aria-pressed', 'false');
  lockButton.textContent = 'LOCK';
  if (humanMutation) {
    state.resetCount += 1;
    state.humanVisualMutationCount += 1;
  }
  renderPath();
}

function toggleTension(humanMutation = true) {
  state.tensionMode = state.tensionMode === 'soft' ? 'firm' : 'soft';
  tensionButton.setAttribute('aria-pressed', String(state.tensionMode === 'firm'));
  tensionButton.textContent = state.tensionMode === 'firm' ? 'SOFTEN' : 'FIRM';
  if (humanMutation) {
    state.tensionToggleCount += 1;
    state.humanVisualMutationCount += 1;
  }
  renderPath();
}

function toggleLock(humanMutation = true) {
  state.locked = !state.locked;
  lockButton.setAttribute('aria-pressed', String(state.locked));
  lockButton.textContent = state.locked ? 'UNLOCK' : 'LOCK';
  if (humanMutation) {
    state.lockToggleCount += 1;
    state.humanVisualMutationCount += 1;
  }
  renderPath();
}

workbench.addEventListener('pointermove', event => {
  if (state.activePointerId === null) {
    if (event.pointerType !== 'mouse' || state.locked) return;
    const candidate = nearestNode(eventPoint(event));
    if (candidate.index === hoverNode) return;
    if (!acceptTrustedInput(event, 'mouse-hover-node', 'mouse')) return;
    state.hoverInputCount += 1;
    hoverNode = candidate.index;
    state.activeNode = candidate.index;
    renderPath();
    return;
  }
  if (event.pointerId !== state.activePointerId || event.isTrusted !== true || !dragStartPoint || !dragStartPositions) return;
  event.preventDefault();
  if (!acceptTrustedInput(event, 'captured-pointer-drag')) return;
  state.pointerDragCount += 1;
  const point = eventPoint(event);
  const deltaX = point.x - dragStartPoint.x;
  const deltaY = point.y - dragStartPoint.y;
  state.maximumDragDistance = Math.max(state.maximumDragDistance, rounded(Math.hypot(deltaX, deltaY), 3));
  moveSelected(deltaX, deltaY, dragStartPositions);
});

workbench.addEventListener('pointerdown', event => {
  if (state.locked || !state.ready || !acceptTrustedInput(event, 'captured-pointer-down')) return;
  event.preventDefault();
  workbench.focus({ preventScroll: true });
  const point = eventPoint(event);
  const candidate = nearestNode(point);
  state.activeNode = candidate.index;
  hoverNode = candidate.index;
  state.activePointerId = event.pointerId;
  dragStartPoint = point;
  dragStartPositions = positions.map(position => ({ ...position }));
  workbench.setPointerCapture(event.pointerId);
  state.pointerCaptured = workbench.hasPointerCapture(event.pointerId);
  state.pointerCaptureCount += 1;
  state.pointerDownCount += 1;
  renderPath();
});

function finishPointer(event, cancelled = false) {
  if (state.activePointerId === null || event.pointerId !== state.activePointerId) return;
  if (!acceptTrustedInput(event, cancelled ? 'captured-pointer-cancel' : 'captured-pointer-up')) return;
  const pointerId = state.activePointerId;
  state.activePointerId = null;
  state.pointerCaptured = false;
  dragStartPoint = null;
  dragStartPositions = null;
  if (cancelled) state.pointerCancelCount += 1;
  else state.pointerReleaseCount += 1;
  if (workbench.hasPointerCapture(pointerId)) {
    workbench.releasePointerCapture(pointerId);
    state.pointerCaptureReleaseCount += 1;
  }
  renderPath();
}

workbench.addEventListener('pointerup', event => finishPointer(event));
workbench.addEventListener('pointercancel', event => finishPointer(event, true));

workbench.addEventListener('keydown', event => {
  const supported = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 't', 'T', 'Enter', 'Escape', 'r', 'R', '[', ']'];
  if (!supported.includes(event.key) || !acceptTrustedInput(event, `keyboard-${event.key.toLowerCase()}`, 'keyboard')) return;
  event.preventDefault();
  state.keyboardInputCount += 1;
  if (event.key === 't' || event.key === 'T') {
    toggleTension();
    return;
  }
  if (event.key === 'Enter') {
    toggleLock();
    return;
  }
  if (event.key === 'Escape' || event.key === 'r' || event.key === 'R') {
    resetProof();
    return;
  }
  if (event.key === '[' || event.key === ']') {
    setActiveNode(state.activeNode + (event.key === ']' ? 1 : -1));
    state.keyboardMutationCount += 1;
    return;
  }
  if (state.locked) return;
  const amount = event.shiftKey ? 4 : 1.5;
  const deltaX = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0;
  const deltaY = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
  state.keyboardMutationCount += 1;
  moveSelected(deltaX, deltaY, positions.map(point => ({ ...point })));
});

tensionButton.addEventListener('click', event => {
  if (!acceptTrustedInput(event, 'visible-tension-button', 'button')) return;
  state.buttonInputCount += 1;
  toggleTension();
});

lockButton.addEventListener('click', event => {
  if (!acceptTrustedInput(event, 'visible-lock-button', 'button')) return;
  state.buttonInputCount += 1;
  toggleLock();
});

resetButton.addEventListener('click', event => {
  if (!acceptTrustedInput(event, 'visible-reset-button', 'button')) return;
  state.buttonInputCount += 1;
  resetProof();
});

buildHandles();
renderPath();

const assetReady = (async () => {
  state.assetFetchCount += 1;
  const response = await fetch(ASSET_URL, { cache: 'no-store' });
  state.assetResponseStatus = response.status;
  state.assetMimeType = response.headers.get('content-type') || '';
  state.assetSameOrigin = new URL(response.url).origin === location.origin;
  invariant(response.ok, `rope material asset request failed with ${response.status}`);
  invariant(state.assetSameOrigin, 'rope material asset is not same-origin');
  const buffer = await response.arrayBuffer();
  state.assetByteLength = buffer.byteLength;
  state.assetSha256 = await sha256(buffer.slice(0));
  state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;
  invariant(state.assetByteLength === EXPECTED_ASSET.bytes, 'rope material asset byte length changed');
  invariant(state.assetShaMatchesExpected, 'rope material asset SHA-256 changed');
  invariant(state.assetMimeType.includes('image/jpeg'), 'rope material asset is not JPEG');

  const blob = new Blob([buffer], { type: 'image/jpeg' });
  sourceObjectUrl = URL.createObjectURL(blob);
  materialImage.src = sourceObjectUrl;
  await materialImage.decode();
  state.browserImageDecoded = true;
  state.decodedWidth = materialImage.naturalWidth;
  state.decodedHeight = materialImage.naturalHeight;
  invariant(state.decodedWidth === EXPECTED_ASSET.width && state.decodedHeight === EXPECTED_ASSET.height, 'rope material asset dimensions changed');

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = SAMPLE_WIDTH;
  sampleCanvas.height = SAMPLE_HEIGHT;
  const context = sampleCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
  invariant(context instanceof CanvasRenderingContext2D, '2D pixel sampling context is unavailable');
  context.drawImage(materialImage, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const pixels = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
  state.sampledPixelSha256 = await sha256(pixels.buffer.slice(0));
  analyzePixels(pixels);
  buildMaterialControls();
  applyMaterial(state.recommendedMaterial, false);
  state.pixelEvidenceBoundToLetterform = state.materialProfiles.length === MATERIAL_KEYS.length
    && state.materialButtonsCreated === MATERIAL_KEYS.length
    && state.pixelDrivenCornerRadius > 0
    && state.pixelDrivenStrokeWidth === selectedProfile().strokeWidth
    && state.pixelDrivenCoupling === selectedProfile().coupling
    && stage.style.getPropertyValue('--rope') === selectedProfile().css;
  await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  syncLayoutEvidence();
  state.ready = true;
  renderPath();
})();

window.addEventListener('resize', syncLayoutEvidence);
window.addEventListener('beforeunload', () => {
  if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
}, { once: true });

window.__PREVIEW_RUNTIME_ASSERT__ = () => {
  const classifiedPixelCount = Object.values(state.classificationCounts).reduce((sum, count) => sum + count, 0);
  const materialPixelCount = state.materialProfiles.reduce((sum, profile) => sum + profile.pixelCount, 0);
  const pathDataMatches = ropePaths.every(path => path.getAttribute('d') === state.currentPathData);
  const buttons = [...materialControls.querySelectorAll('[data-material]')];
  return state.ready
    && state.task === 'human-operated-material-aware-elastic-rope-wayfinding-lettering-proof'
    && state.claimedLibrary === 'motion@12.42.2'
    && state.renderer === 'svg'
    && state.mechanism === 'browser-decoded-rope-source-pixels-drive-material-corner-radius-stroke-coupling-load-and-legibility-while-trusted-human-input-edits-svg-path-nodes'
    && state.userInputRequired === true
    && state.strictTrustedInputGuard === true
    && state.initialFrameStatic === true
    && state.automaticCycle === false
    && state.automaticPlayback === false
    && state.automaticRehearsal === false
    && state.automaticFallback === false
    && state.syntheticInputDispatch === false
    && state.captureClockDriven === false
    && state.renderIgnoresPreviewClock === true
    && state.previewClockMutationCount === 0
    && state.motionControlReady === true
    && typeof tensionMotion.pause === 'function'
    && tensionMotion.duration === 1
    && state.motionControlSeekCount >= 1
    && state.motionControlTime === rounded(tensionMotion.time, 4)
    && tensionMotion.time >= 0
    && tensionMotion.time <= tensionMotion.duration
    && state.assetFetchCount === 1
    && state.assetResponseStatus === 200
    && state.assetSameOrigin === true
    && state.assetMimeType.includes('image/jpeg')
    && state.assetByteLength === EXPECTED_ASSET.bytes
    && state.assetSha256 === EXPECTED_ASSET.sha256
    && state.assetShaMatchesExpected === true
    && state.browserImageDecoded === true
    && state.decodedWidth === EXPECTED_ASSET.width
    && state.decodedHeight === EXPECTED_ASSET.height
    && materialImage.complete
    && materialImage.naturalWidth === EXPECTED_ASSET.width
    && materialImage.naturalHeight === EXPECTED_ASSET.height
    && state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
    && state.sampledPixelByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4
    && state.sampledPixelSha256.length === 64
    && !/^0+$/.test(state.sampledPixelSha256)
    && state.sampledPixelChecksum.length === 8
    && state.sampledOpaquePixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
    && classifiedPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
    && state.distinctSampleColorCount > 300
    && state.sampledLumaMinimum < 35
    && state.sampledLumaMaximum > 175
    && state.sampledLumaRange > 145
    && state.sampledEdgeMean > 4
    && state.sampledSaturationMean > .12
    && state.materialProfiles.length === MATERIAL_KEYS.length
    && materialPixelCount > 800
    && state.detectedMaterialCount === MATERIAL_KEYS.length
    && state.materialProfiles.every(profile => (
      MATERIAL_KEYS.includes(profile.key)
      && profile.pixelCount >= 30
      && profile.checksum.length === 8
      && profile.rgb.length === 3
      && profile.rgb.every(channel => channel >= 0 && channel <= 255)
      && profile.edgeMean > 0
      && profile.contrastRatio > 1
      && profile.stiffness >= .46
      && profile.stiffness <= .88
      && profile.coupling >= 2.2
      && profile.coupling <= 4.35
      && profile.strokeWidth >= 4.35
      && profile.strokeWidth <= 6.35
    ))
    && state.materialButtonsCreated === MATERIAL_KEYS.length
    && buttons.length === MATERIAL_KEYS.length
    && buttons.every(button => button.type === 'button' && MATERIAL_KEYS.includes(button.dataset.material))
    && MATERIAL_KEYS.includes(state.recommendedMaterial)
    && MATERIAL_KEYS.includes(state.selectedMaterial)
    && state.pixelEvidenceBoundToLetterform === true
    && state.pixelDrivenCornerRadius >= 2.25
    && state.pixelDrivenCornerRadius <= 5.4
    && state.pixelDrivenStrokeWidth === selectedProfile().strokeWidth
    && state.pixelDrivenCoupling === selectedProfile().coupling
    && state.initialPathData.length > 200
    && state.currentPathData.length > 200
    && pathDataMatches
    && state.basePathLength > 420
    && state.currentPathLength > 400
    && handles.length === BASE_POINTS.length
    && state.handleCount === BASE_POINTS.length
    && handles.every((handle, index) => handle.dataset.index === String(index) && handle.hasAttribute('transform'))
    && state.maximumNodeDisplacement >= 0
    && state.maximumRecordedNodeDisplacement >= state.maximumNodeDisplacement
    && state.legibilityScore >= 28
    && state.legibilityScore <= 99
    && state.loadEstimate >= 0
    && ['pass', 'refine'].includes(state.decision)
    && state.inputCount === state.trustedInputCount
    && state.rejectedUntrustedInputCount === 0
    && state.stageWidth >= 140
    && state.stageHeight >= 78
    && state.signCoverageRatio > .31
    && workbench.tabIndex === 0
    && tensionButton.type === 'button'
    && lockButton.type === 'button'
    && resetButton.type === 'button'
    && window.__PREVIEW_INTERACTION_STATE__ === state;
};

installPreviewController({
  id: 'elastic-svg-rope-lettering',
  library: state.claimedLibrary,
  renderer: 'svg',
  render: () => { state.previewRenderCount += 1; },
  ready: assetReady,
});

assetReady.catch(markPreviewFailure);
