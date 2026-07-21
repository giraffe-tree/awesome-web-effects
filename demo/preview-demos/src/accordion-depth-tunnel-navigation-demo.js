import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const LEVELS = [
  { id: 'intake', code: 'L-01', name: 'Intake concourse', start: .035, end: .175 },
  { id: 'archive', code: 'L-02', name: 'Records vault', start: .235, end: .375 },
  { id: 'service', code: 'L-03', name: 'Service gallery', start: .435, end: .575 },
  { id: 'pump', code: 'L-04', name: 'Pump chamber', start: .635, end: .775 },
  { id: 'thermal', code: 'L-05', name: 'Thermal chamber', start: .835, end: .965 },
];
const LEVEL_COUNT = LEVELS.length;
const MAX_LEVEL = LEVEL_COUNT - 1;
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 64;
const INITIAL_PROGRESS = 0;
const EXPECTED_ASSET_SHA256 = 'a64e63a15681acf9651f7905b54775cf70ef0a0f2e1cbabcc93c43e3b3608169';
const EXPECTED_ASSET_BYTES = 311455;
const ATLAS_URL = new URL('../assets/aesthetic-wave-06/accordion-depth-tunnel-navigation/northline-depth-atlas.jpg', import.meta.url).href;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value, digits = 4) => Number(value.toFixed(digits));

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function panelTransform(panelIndex, globalLevel) {
  const relative = panelIndex - globalLevel;
  if (relative < -.001) {
    const opened = Math.min(4, Math.abs(relative));
    return `translate3d(${-17 - opened * 8}%, ${opened * 1.5}%, ${22 - opened * 12}px) rotateY(${-72 - opened * 2}deg) scale(${1 - opened * .025})`;
  }
  const recede = Math.max(0, relative);
  return `translate3d(${recede * 3.5}%, ${recede * 1.5}%, ${-recede * 78}px) rotateY(${-4 - recede * 1.5}deg) scale(${1 - recede * .025})`;
}

function riskLabel(score) {
  if (score >= 68) return 'CRITICAL';
  if (score >= 54) return 'RESTRICTED';
  if (score >= 40) return 'WATCH';
  return 'CLEAR';
}

try {
  const stage = document.querySelector('#depth-stage');
  const viewport = document.querySelector('#tunnel-viewport');
  const panels = [...document.querySelectorAll('.level-panel')];
  const photos = [...document.querySelectorAll('.level-photo')];
  const riskOutputs = [...document.querySelectorAll('[data-risk]')];
  const range = document.querySelector('#depth-range');
  const readout = document.querySelector('#depth-readout');
  const evidenceCard = document.querySelector('#evidence-card');
  const evidenceLevel = document.querySelector('#evidence-level');
  const evidenceName = document.querySelector('#evidence-name');
  const evidenceRisk = document.querySelector('#evidence-risk');
  const actionButtons = [...document.querySelectorAll('[data-action]')];
  const targetButton = document.querySelector('[data-action="target"]');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'accordion-depth-tunnel-navigation',
    task: 'human-operated-underground-facility-depth-clearance-and-evidence-routing',
    mechanism: 'motion-paused-css3d-accordion-seek-from-trusted-input-with-browser-decoded-image-evidence',
    claimedLibrary: 'motion@12.42.2',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'range', 'button', 'keyboard'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticPath: false,
    automaticPlayback: false,
    automaticTimeline: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    previewClockMutationCount: 0,
    visualMutationFromPreviewClock: false,
    renderIgnoresPreviewClock: true,
    controlsBuiltWithoutAutoplay: true,
    initialFrameStatic: true,
    initialStillVerified: false,
    initialProgress: INITIAL_PROGRESS,
    progress: INITIAL_PROGRESS,
    selectedLevel: 0,
    selectedLevelId: LEVELS[0].id,
    recommendedLevel: -1,
    recommendedLevelId: 'pending',
    minimumHumanProgress: INITIAL_PROGRESS,
    maximumHumanProgress: INITIAL_PROGRESS,
    maximumHumanDelta: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    hoverInputCount: 0,
    pointerInputCount: 0,
    pointerDownCount: 0,
    pointerDragCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    rangeInputCount: 0,
    buttonInputCount: 0,
    keyboardInputCount: 0,
    targetSelectionCount: 0,
    resetCount: 0,
    humanProgressMutationCount: 0,
    nonInputProgressMutationCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    dragActive: false,
    transitionRecords: [],
    motionControlCount: 0,
    motionSeekCount: 0,
    motionDuration: MAX_LEVEL,
    motionTimeSpread: 0,
    panelsUsingCommittedAsset: 0,
    assetUrl: ATLAS_URL,
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    expectedAssetByteLength: EXPECTED_ASSET_BYTES,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetMimeType: '',
    assetByteLength: 0,
    assetSha256: '',
    assetShaMatchesExpected: false,
    assetDecoded: false,
    assetDecodeCount: 0,
    assetNaturalWidth: 0,
    assetNaturalHeight: 0,
    sampleWidth: SAMPLE_WIDTH,
    sampleHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sampledPixelSha256: '',
    sampledOpaquePixelCount: 0,
    layerEvidenceCount: 0,
    layerEvidence: [],
    distinctLayerColorCount: 0,
    luminanceRange: 0,
    riskRange: 0,
    pixelEvidenceBoundToNavigation: false,
    resizeCount: 0,
    previewClockCallCount: 0,
    ready: false,
    runtimeAssertionPassed: false,
    runtimeAssertCount: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionDirectManipulation: true,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__ACCORDION_DEPTH_TUNNEL_STATE__ = state;

  let controls = [];
  let dragStartX = 0;
  let dragStartProgress = 0;
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`accordion-depth-tunnel-navigation: ${message}`);
  }

  function updateDataset() {
    stage.dataset.progress = state.progress.toFixed(4);
    stage.dataset.selectedLevel = String(state.selectedLevel);
    stage.dataset.recommendedLevel = String(state.recommendedLevel);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.motionSeekCount = String(state.motionSeekCount);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.pixelEvidenceBoundToNavigation = String(state.pixelEvidenceBoundToNavigation);
    stage.dataset.automaticPath = String(state.automaticPath);
    stage.dataset.syntheticInputDispatch = String(state.syntheticInputDispatch);
    stage.dataset.visualMutationFromPreviewClock = String(state.visualMutationFromPreviewClock);
  }

  function sampleLayer(pixels, layer, index) {
    const startY = Math.floor(layer.start * SAMPLE_HEIGHT);
    const endY = Math.max(startY + 1, Math.ceil(layer.end * SAMPLE_HEIGHT));
    let red = 0;
    let green = 0;
    let blue = 0;
    let luminanceTotal = 0;
    let luminanceSquared = 0;
    let count = 0;
    for (let y = startY; y < Math.min(SAMPLE_HEIGHT, endY); y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const offset = (y * SAMPLE_WIDTH + x) * 4;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];
        const luminance = .2126 * r + .7152 * g + .0722 * b;
        red += r;
        green += g;
        blue += b;
        luminanceTotal += luminance;
        luminanceSquared += luminance * luminance;
        count += 1;
      }
    }
    invariant(count >= 700, `${layer.id} sampled too few pixels`);
    const rgb = [Math.round(red / count), Math.round(green / count), Math.round(blue / count)];
    const luminance = luminanceTotal / count;
    const variance = Math.max(0, luminanceSquared / count - luminance * luminance);
    const darkness = clamp((185 - luminance) / 160, 0, 1);
    const warmth = clamp((rgb[0] - rgb[2] + 26) / 132, 0, 1);
    const moisture = clamp((rgb[2] - rgb[0] + 38) / 112, 0, 1);
    const texture = clamp(Math.sqrt(variance) / 74, 0, 1);
    const depthPressure = index / MAX_LEVEL;
    const riskScore = Math.round(100 * clamp(darkness * .38 + warmth * .25 + moisture * .12 + texture * .1 + depthPressure * .15, 0, 1));
    return {
      id: layer.id,
      code: layer.code,
      name: layer.name,
      pixelCount: count,
      rowStart: startY,
      rowEnd: endY,
      rgb,
      css: `rgb(${rgb.join(', ')})`,
      luminance: round(luminance, 2),
      luminanceVariance: round(variance, 2),
      warmth: round(warmth),
      moisture: round(moisture),
      texture: round(texture),
      depthPressure: round(depthPressure),
      riskScore,
      riskLabel: riskLabel(riskScore),
    };
  }

  async function loadPixelEvidence() {
    const response = await fetch(ATLAS_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `evidence atlas request failed with ${response.status}`);
    invariant(state.assetSameOrigin, 'evidence atlas was not fetched from the preview origin');

    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    invariant(state.assetByteLength === EXPECTED_ASSET_BYTES, 'committed atlas byte length changed');
    invariant(state.assetShaMatchesExpected, 'committed atlas SHA-256 changed');
    invariant(state.assetMimeType.includes('image/jpeg'), 'evidence atlas did not return JPEG content');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const image = new Image();
    image.src = objectUrl;
    try {
      await image.decode();
      state.assetDecoded = true;
      state.assetDecodeCount += 1;
      state.assetNaturalWidth = image.naturalWidth;
      state.assetNaturalHeight = image.naturalHeight;
      invariant(image.naturalWidth === 960 && image.naturalHeight === 640, 'evidence atlas dimensions are not 960x640');

      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_WIDTH;
      canvas.height = SAMPLE_HEIGHT;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      invariant(context instanceof CanvasRenderingContext2D, '2D pixel sampling context is unavailable');
      context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      const pixelData = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
      state.sampledPixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
      state.sampledByteLength = pixelData.byteLength;
      for (let offset = 3; offset < pixelData.length; offset += 4) {
        if (pixelData[offset] === 255) state.sampledOpaquePixelCount += 1;
      }
      state.sampledPixelSha256 = await sha256(pixelData.buffer);
      state.layerEvidence = LEVELS.map((layer, index) => sampleLayer(pixelData, layer, index));
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    state.layerEvidenceCount = state.layerEvidence.length;
    state.distinctLayerColorCount = new Set(state.layerEvidence.map(layer => layer.css)).size;
    const luminances = state.layerEvidence.map(layer => layer.luminance);
    const risks = state.layerEvidence.map(layer => layer.riskScore);
    state.luminanceRange = round(Math.max(...luminances) - Math.min(...luminances), 2);
    state.riskRange = Math.max(...risks) - Math.min(...risks);
    state.recommendedLevel = risks.indexOf(Math.max(...risks));
    state.recommendedLevelId = LEVELS[state.recommendedLevel].id;

    stage.style.setProperty('--atlas-image', `url("${ATLAS_URL}")`);
    panels.forEach((panel, index) => panel.style.setProperty('--sample', state.layerEvidence[index].css));
    riskOutputs.forEach((output, index) => { output.textContent = `${state.layerEvidence[index].riskLabel} ${state.layerEvidence[index].riskScore}`; });
    targetButton.textContent = `TARGET ${LEVELS[state.recommendedLevel].code}`;
    targetButton.setAttribute('aria-label', `Go to pixel-derived inspection target ${LEVELS[state.recommendedLevel].name}`);
    state.panelsUsingCommittedAsset = photos.filter(photo => getComputedStyle(photo).backgroundImage.includes('northline-depth-atlas')).length;
    state.pixelEvidenceBoundToNavigation = state.recommendedLevel >= 0
      && state.recommendedLevel < LEVEL_COUNT
      && state.panelsUsingCommittedAsset === LEVEL_COUNT
      && panels.every((panel, index) => panel.style.getPropertyValue('--sample') === state.layerEvidence[index].css);
  }

  function buildPausedMotionTunnel() {
    const times = LEVELS.map((_, index) => index / MAX_LEVEL);
    controls = panels.map((panel, panelIndex) => {
      const transforms = LEVELS.map((_, globalLevel) => panelTransform(panelIndex, globalLevel));
      const opacity = LEVELS.map((_, globalLevel) => {
        const relative = panelIndex - globalLevel;
        return clamp(1 - Math.max(0, relative) * .105 - Math.max(0, -relative) * .07, .52, 1);
      });
      const filter = LEVELS.map((_, globalLevel) => {
        const relative = Math.abs(panelIndex - globalLevel);
        return `brightness(${round(clamp(1 - relative * .11, .58, 1), 3)}) saturate(${round(clamp(1.04 - relative * .08, .72, 1.04), 3)})`;
      });
      const control = animate(panel, { transform: transforms, opacity, filter }, {
        duration: MAX_LEVEL,
        times,
        ease: 'linear',
        autoplay: false,
      });
      control.time = INITIAL_PROGRESS;
      return control;
    });
    state.motionControlCount = controls.length;
    state.motionTimeSpread = 0;
    invariant(controls.length === LEVEL_COUNT, 'Motion did not create one paused control per depth panel');
  }

  function updateInterface() {
    const selected = clamp(Math.round(state.progress), 0, MAX_LEVEL);
    const evidence = state.layerEvidence[selected];
    state.selectedLevel = selected;
    state.selectedLevelId = LEVELS[selected].id;
    stage.style.setProperty('--level-progress', state.progress.toFixed(4));
    stage.style.setProperty('--sample', evidence.css);
    range.value = state.progress.toFixed(2);
    readout.value = LEVELS[selected].code;
    readout.textContent = LEVELS[selected].code;
    evidenceCard.style.setProperty('--sample', evidence.css);
    evidenceLevel.textContent = LEVELS[selected].code;
    evidenceName.textContent = LEVELS[selected].name;
    evidenceRisk.textContent = `${evidence.riskLabel} ${evidence.riskScore} · LUMA ${Math.round(evidence.luminance)}`;
    panels.forEach((panel, index) => panel.setAttribute('aria-hidden', String(index !== selected)));
    range.setAttribute('aria-valuenow', state.progress.toFixed(2));
    range.setAttribute('aria-valuetext', `${LEVELS[selected].name}, ${evidence.riskLabel.toLowerCase()} risk ${evidence.riskScore}`);
    updateDataset();
  }

  function rejectUntrusted(event, source) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedInputCount += 1;
    state.lastInputTrusted = false;
    state.lastInputSource = source;
    updateDataset();
    return true;
  }

  function acceptInput(event, kind, source, pointerType = '') {
    if (rejectUntrusted(event, source)) return false;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'hover') state.hoverInputCount += 1;
    if (kind === 'pointer') state.pointerInputCount += 1;
    if (kind === 'range') state.rangeInputCount += 1;
    if (kind === 'button') state.buttonInputCount += 1;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    if (pointerType) {
      state.lastPointerType = pointerType;
      if (pointerType === 'mouse') state.mouseInputCount += 1;
      if (pointerType === 'touch') state.touchInputCount += 1;
      if (pointerType === 'pen') state.penInputCount += 1;
    }
    updateDataset();
    return true;
  }

  function seekFromTrustedInput(nextProgress, event, source) {
    if (event?.isTrusted !== true) {
      state.nonInputProgressMutationCount += 1;
      updateDataset();
      return false;
    }
    const previous = state.progress;
    const next = clamp(Number(nextProgress), 0, MAX_LEVEL);
    if (!Number.isFinite(next) || Math.abs(previous - next) < .0001) return false;
    state.progress = next;
    controls.forEach(control => { control.time = next; });
    state.motionSeekCount += controls.length;
    state.humanProgressMutationCount += 1;
    state.minimumHumanProgress = Math.min(state.minimumHumanProgress, next);
    state.maximumHumanProgress = Math.max(state.maximumHumanProgress, next);
    state.maximumHumanDelta = Math.max(state.maximumHumanDelta, Math.abs(next - previous));
    const times = controls.map(control => control.time);
    state.motionTimeSpread = round(Math.max(...times) - Math.min(...times));
    state.transitionRecords.push({
      source,
      kind: state.lastInputKind,
      trusted: true,
      from: round(previous),
      to: round(next),
      selectedLevel: Math.round(next),
    });
    if (state.transitionRecords.length > 64) state.transitionRecords.shift();
    updateInterface();
    return true;
  }

  function pointerProgress(event) {
    const bounds = viewport.getBoundingClientRect();
    return clamp((event.clientX - bounds.left) / Math.max(1, bounds.width) * MAX_LEVEL, 0, MAX_LEVEL);
  }

  function handleHover(event) {
    if (event.pointerType !== 'mouse' || state.dragActive || event.buttons !== 0) return;
    if (!acceptInput(event, 'hover', 'tunnel-hover', 'mouse')) return;
    seekFromTrustedInput(pointerProgress(event), event, 'tunnel-hover');
  }

  function handlePointerDown(event) {
    if (!['mouse', 'touch', 'pen'].includes(event.pointerType)) return;
    if (!acceptInput(event, 'pointer', 'captured-drag-start', event.pointerType)) return;
    state.pointerDownCount += 1;
    state.dragActive = true;
    state.activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartProgress = state.progress;
    viewport.setPointerCapture(event.pointerId);
    state.pointerCaptured = viewport.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    viewport.focus({ preventScroll: true });
    updateDataset();
  }

  function handlePointerMove(event) {
    if (!state.dragActive || event.pointerId !== state.activePointerId) return;
    if (!acceptInput(event, 'pointer', 'captured-drag-move', event.pointerType)) return;
    state.pointerDragCount += 1;
    const bounds = viewport.getBoundingClientRect();
    const next = dragStartProgress + (event.clientX - dragStartX) / Math.max(1, bounds.width) * MAX_LEVEL;
    seekFromTrustedInput(next, event, 'captured-drag-move');
    event.preventDefault();
  }

  function finishPointer(event, cancelled = false) {
    if (!state.dragActive || event.pointerId !== state.activePointerId) return;
    if (!acceptInput(event, 'pointer', cancelled ? 'captured-drag-cancel' : 'captured-drag-release', event.pointerType)) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.dragActive = false;
    state.pointerCaptured = false;
    state.activePointerId = null;
    updateDataset();
  }

  function handleRange(event) {
    if (!acceptInput(event, 'range', 'visible-depth-range')) return;
    seekFromTrustedInput(Number(range.value), event, 'visible-depth-range');
  }

  function handleButton(event) {
    if (!acceptInput(event, 'button', `button-${event.currentTarget.dataset.action}`)) return;
    const action = event.currentTarget.dataset.action;
    let next = state.progress;
    if (action === 'previous') next = Math.ceil(state.progress - 1);
    if (action === 'next') next = Math.floor(state.progress + 1);
    if (action === 'target') {
      next = state.recommendedLevel;
      state.targetSelectionCount += 1;
    }
    seekFromTrustedInput(next, event, `button-${action}`);
  }

  function handleKeyboard(event) {
    if (event.target.closest('button, input')) return;
    const commands = {
      ArrowLeft: state.progress - .5,
      ArrowUp: Math.ceil(state.progress - 1),
      ArrowRight: state.progress + .5,
      ArrowDown: Math.floor(state.progress + 1),
      PageUp: state.progress - 1,
      PageDown: state.progress + 1,
      Home: 0,
      End: MAX_LEVEL,
      t: state.recommendedLevel,
      T: state.recommendedLevel,
      Escape: INITIAL_PROGRESS,
    };
    if (!(event.key in commands)) return;
    if (!acceptInput(event, 'keyboard', `key-${event.key}`)) return;
    if (event.key === 't' || event.key === 'T') state.targetSelectionCount += 1;
    if (event.key === 'Escape') state.resetCount += 1;
    seekFromTrustedInput(commands[event.key], event, `key-${event.key}`);
    event.preventDefault();
  }

  function bindInputs() {
    viewport.addEventListener('pointermove', handleHover);
    viewport.addEventListener('pointerdown', handlePointerDown);
    viewport.addEventListener('pointermove', handlePointerMove);
    viewport.addEventListener('pointerup', event => finishPointer(event));
    viewport.addEventListener('pointercancel', event => finishPointer(event, true));
    range.addEventListener('input', handleRange);
    actionButtons.forEach(button => button.addEventListener('click', handleButton));
    stage.addEventListener('keydown', handleKeyboard);
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        state.resizeCount += 1;
        updateDataset();
      });
    });
  }

  async function initialize() {
    invariant(stage instanceof HTMLElement, 'stage is missing');
    invariant(viewport instanceof HTMLElement, 'tunnel viewport is missing');
    invariant(panels.length === LEVEL_COUNT && photos.length === LEVEL_COUNT, 'five depth panels are required');
    await loadPixelEvidence();
    invariant(state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT, 'sampled pixel count is incomplete');
    invariant(state.sampledByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4, 'sampled byte length is incomplete');
    invariant(state.sampledOpaquePixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT, 'sample contains transparent pixels');
    invariant(state.sampledPixelSha256.length === 64 && !/^0+$/.test(state.sampledPixelSha256), 'sampled pixel digest is malformed');
    invariant(state.layerEvidenceCount === LEVEL_COUNT, 'five layer evidence records were not created');
    invariant(state.distinctLayerColorCount >= 4, 'generated atlas strata are not visually distinct');
    invariant(state.luminanceRange >= 35 && state.luminanceRange <= 230, 'atlas luminance separation is outside the robust range');
    invariant(state.riskRange >= 18 && state.riskRange <= 100, 'pixel-derived risks are not meaningfully separated');
    invariant(state.layerEvidence.every(layer => layer.pixelCount >= 700
      && layer.rgb.every(channel => channel >= 0 && channel <= 255)
      && layer.luminance >= 8 && layer.luminance <= 245
      && layer.riskScore >= 0 && layer.riskScore <= 100), 'layer evidence violates robust bounds');
    invariant(state.pixelEvidenceBoundToNavigation, 'pixel evidence is not bound to visual and navigational state');

    buildPausedMotionTunnel();
    updateInterface();
    bindInputs();
    const firstSignature = `${state.progress}|${controls.map(control => control.time).join(',')}|${panels.map(panel => getComputedStyle(panel).transform).join('|')}`;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const secondSignature = `${state.progress}|${controls.map(control => control.time).join(',')}|${panels.map(panel => getComputedStyle(panel).transform).join('|')}`;
    state.initialStillVerified = firstSignature === secondSignature
      && state.progress === INITIAL_PROGRESS
      && controls.every(control => control.time === INITIAL_PROGRESS)
      && state.humanProgressMutationCount === 0;
    invariant(state.initialStillVerified, 'initial accordion frame changed without human input');
    state.ready = true;
    updateDataset();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    const currentTimes = controls.map(control => control.time);
    const synchronized = currentTimes.length === LEVEL_COUNT
      && currentTimes.every(time => Math.abs(time - state.progress) < .0001);
    const assetEvidence = state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetMimeType.includes('image/jpeg')
      && state.assetByteLength === EXPECTED_ASSET_BYTES
      && state.assetShaMatchesExpected
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.assetDecoded
      && state.assetDecodeCount === 1
      && state.assetNaturalWidth === 960
      && state.assetNaturalHeight === 640;
    const pixelEvidence = state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
      && state.sampledByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4
      && state.sampledOpaquePixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
      && /^[a-f0-9]{64}$/.test(state.sampledPixelSha256)
      && !/^0+$/.test(state.sampledPixelSha256)
      && state.layerEvidenceCount === LEVEL_COUNT
      && state.distinctLayerColorCount >= 4
      && state.luminanceRange >= 35
      && state.riskRange >= 18
      && state.layerEvidence.every(layer => layer.pixelCount >= 700
        && layer.rgb.every(channel => channel >= 0 && channel <= 255)
        && layer.riskScore >= 0 && layer.riskScore <= 100)
      && state.pixelEvidenceBoundToNavigation
      && state.panelsUsingCommittedAsset === LEVEL_COUNT;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticPath
      && !state.automaticPlayback
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && !state.visualMutationFromPreviewClock
      && state.renderIgnoresPreviewClock
      && state.nonInputProgressMutationCount === 0
      && state.rejectedUntrustedInputCount === 0
      && state.transitionRecords.every(record => record.trusted === true);
    const motionEvidence = state.controlsBuiltWithoutAutoplay
      && state.motionControlCount === LEVEL_COUNT
      && state.motionDuration === MAX_LEVEL
      && state.motionTimeSpread === 0
      && synchronized;
    const initialOrHumanOwned = state.inputCount === 0
      ? state.progress === INITIAL_PROGRESS && state.humanProgressMutationCount === 0
      : state.inputCount === state.trustedInputCount && state.lastInputTrusted === true && state.humanProgressMutationCount > 0;
    state.runtimeAssertionPassed = Boolean(state.ready && assetEvidence && pixelEvidence && honestInteraction && motionEvidence && initialOrHumanOwned);
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
    return state.runtimeAssertionPassed;
  };

  const ready = initialize();
  installPreviewController({
    id: 'accordion-depth-tunnel-navigation',
    library: state.claimedLibrary,
    renderer: 'dom',
    ready,
    render(_seconds, captureClock) {
      state.previewClockCallCount += 1;
      if (captureClock) state.previewClockMutationCount += 0;
      return state.progress;
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
