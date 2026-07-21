import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-02/gesture-sliced-image-shutters/north-quay-gate-inspection.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = {
  bytes: 316760,
  width: 960,
  height: 640,
  sha256: 'fd7fae2dc69bf2488bf1ffdce5784093380ad889b29430cee7d15100cc28bdb1',
};
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 64;
const BAND_COUNT = 8;
const BAND_WIDTH = SAMPLE_WIDTH / BAND_COUNT;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const rounded = value => Number(value.toFixed(4));

const stage = document.querySelector('#gate-stage');
const shutters = document.querySelector('#shutters');
const sliceGrid = document.querySelector('#slice-grid');
const bayMarker = document.querySelector('#bay-marker');
const seamMeter = document.querySelector('#seam-meter');
const systemState = document.querySelector('#system-state');
const evidenceHeading = document.querySelector('#evidence-heading');
const evidenceSubtitle = document.querySelector('#evidence-subtitle');
const evidenceKind = document.querySelector('#evidence-kind');
const riskScore = document.querySelector('#risk-score');
const pixelCount = document.querySelector('#pixel-count');
const disposition = document.querySelector('#disposition');
const bandStrip = document.querySelector('#band-strip');
const separationRange = document.querySelector('#separation-range');
const alignButton = document.querySelector('#align-button');
const separateButton = document.querySelector('#separate-button');
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

const evidenceCopy = {
  protected: { label: 'teal coating', color: [81, 145, 137] },
  corrosion: { label: 'active corrosion', color: [205, 125, 65] },
  salt: { label: 'salt bloom', color: [194, 197, 190] },
  waterline: { label: 'wet waterline', color: [66, 89, 91] },
  balanced: { label: 'mixed surface', color: [132, 137, 128] },
};

const state = {
  id: 'gesture-sliced-image-shutters',
  task: 'human-operated-fictional-north-quay-storm-gate-evidence-review',
  claimedLibrary: 'motion@12.42.2',
  renderer: 'dom',
  mechanism: 'trusted-human-input-scrubs-paused-motion-image-shutters',
  assetMechanismRole: 'browser-decoded-exact-source-pixels-determine-eight-shutter-profiles-evidence-metrics-critical-bay-and-final-disposition',
  acceptedInputs: ['trusted-mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'visible-range', 'visible-buttons', 'keyboard'],
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
  separation: 0,
  selectedBand: 0,
  inspectedBandCount: 0,
  inspectedBands: [],
  mode: 'aligned',
  result: 'source-sealed',
  inputCount: 0,
  trustedInputCount: 0,
  rejectedUntrustedInputCount: 0,
  mouseHoverCount: 0,
  zoneInspectionCount: 0,
  pointerCaptureCount: 0,
  capturedPointerDownCount: 0,
  capturedPointerMoveCount: 0,
  capturedPointerUpCount: 0,
  pointerSeparationMutationCount: 0,
  rangeInputCount: 0,
  rangeSeparationMutationCount: 0,
  buttonInputCount: 0,
  alignButtonCount: 0,
  separateButtonCount: 0,
  buttonSeparationMutationCount: 0,
  keyboardInputCount: 0,
  keyboardSeparationMutationCount: 0,
  separationMutationCount: 0,
  maximumSeparation: 0,
  reviewReachedCount: 0,
  alignedAfterReviewCount: 0,
  resultTransitionCount: 0,
  pointerTypesSeen: [],
  lastInputKind: 'none',
  lastInputTrusted: false,
  lastPointerType: 'none',
  activePointerId: null,
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
  distinctSampleColorCount: 0,
  sampledLumaMinimum: 255,
  sampledLumaMaximum: 0,
  sampledLumaRange: 0,
  bandProfiles: [],
  classificationCounts: {},
  criticalBand: 0,
  criticalRisk: 0,
  reviewBandCount: 0,
  motionControllerCreateCount: 0,
  motionControllerPauseCount: 0,
  motionControllerProgressSetCount: 0,
  stageWidth: 0,
  stageHeight: 0,
  shutterCoverageRatio: 0,
};
window.__PREVIEW_INTERACTION_STATE__ = state;

const slices = [];
const images = [];
const bandLabels = [];
const motionControls = [];
let dragStartX = 0;
let dragStartSeparation = 0;

function pixelChecksum(pixels) {
  let signature = 2166136261;
  for (let index = 0; index < pixels.length; index += 1) {
    signature ^= pixels[index];
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
  if (red > green * 1.22 && red > blue * 1.5 && red > 55) return 'corrosion';
  if (green > red * 1.05 && blue > red * .78 && green > 55 && green > blue * .72) return 'protected';
  if (luma > 145 && Math.max(red, green, blue) - Math.min(red, green, blue) < 38) return 'salt';
  if (luma < 55) return 'waterline';
  return 'balanced';
}

function chooseBandEvidence(counts) {
  if (counts.corrosion > 80) return 'corrosion';
  if (counts.salt > 180) return 'salt';
  if (counts.protected > 180) return 'protected';
  if (counts.waterline > 260) return 'waterline';
  return 'balanced';
}

function buildScene() {
  for (let index = 0; index < BAND_COUNT; index += 1) {
    const slice = document.createElement('span');
    slice.className = 'slice';
    slice.style.setProperty('--slice-index', index);
    slice.dataset.band = String(index + 1);
    const image = document.createElement('img');
    image.src = ASSET_URL;
    image.alt = '';
    image.draggable = false;
    slice.append(image);
    sliceGrid.append(slice);
    slices.push(slice);
    images.push(image);

    const label = document.createElement('span');
    label.className = 'band-label';
    label.textContent = String(index + 1).padStart(2, '0');
    label.dataset.selected = 'false';
    bandStrip.append(label);
    bandLabels.push(label);
  }
}

function analyzePixels(pixels) {
  const distinct = new Set();
  let lumaMinimum = 255;
  let lumaMaximum = 0;
  const profiles = [];

  for (let band = 0; band < BAND_COUNT; band += 1) {
    const counts = { protected: 0, corrosion: 0, salt: 0, waterline: 0, balanced: 0 };
    const bandBytes = [];
    let lumaTotal = 0;
    let localMinimum = 255;
    let localMaximum = 0;
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let localX = 0; localX < BAND_WIDTH; localX += 1) {
        const x = band * BAND_WIDTH + localX;
        const index = (y * SAMPLE_WIDTH + x) * 4;
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const luma = .2126 * red + .7152 * green + .0722 * blue;
        const evidence = classifyPixel(red, green, blue);
        counts[evidence] += 1;
        lumaTotal += luma;
        localMinimum = Math.min(localMinimum, luma);
        localMaximum = Math.max(localMaximum, luma);
        lumaMinimum = Math.min(lumaMinimum, luma);
        lumaMaximum = Math.max(lumaMaximum, luma);
        distinct.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
        bandBytes.push(red, green, blue, pixels[index + 3]);
      }
    }
    const evidence = chooseBandEvidence(counts);
    const risk = clamp(Math.round(
      counts.corrosion * .19
      + counts.salt * .055
      + counts.waterline * .025
      - counts.protected * .015,
    ), 0, 100);
    const contrast = localMaximum - localMinimum;
    const displacementWeight = clamp(.55 + risk / 125 + contrast / 420, .62, 1.42);
    const direction = evidence === 'salt' ? -1
      : evidence === 'corrosion' || evidence === 'waterline' ? 1
        : band % 2 === 0 ? -1 : 1;
    profiles.push({
      band: band + 1,
      counts,
      evidence,
      risk,
      luma: rounded(lumaTotal / (BAND_WIDTH * SAMPLE_HEIGHT)),
      contrast: rounded(contrast),
      displacementWeight: rounded(displacementWeight),
      direction,
      pixelCount: BAND_WIDTH * SAMPLE_HEIGHT,
      checksum: pixelChecksum(Uint8Array.from(bandBytes)),
    });
  }

  const classificationCounts = Object.fromEntries(Object.keys(evidenceCopy).map(key => [
    key,
    profiles.filter(profile => profile.evidence === key).length,
  ]));
  const critical = profiles.reduce((current, profile) => profile.risk > current.risk ? profile : current, profiles[0]);
  state.bandProfiles = profiles;
  state.classificationCounts = classificationCounts;
  state.criticalBand = critical.band;
  state.criticalRisk = critical.risk;
  state.reviewBandCount = profiles.filter(profile => ['corrosion', 'salt'].includes(profile.evidence)).length;
  state.sampledPixelCount = pixels.length / 4;
  state.sampledPixelByteLength = pixels.length;
  state.sampledPixelChecksum = pixelChecksum(pixels);
  state.distinctSampleColorCount = distinct.size;
  state.sampledLumaMinimum = rounded(lumaMinimum);
  state.sampledLumaMaximum = rounded(lumaMaximum);
  state.sampledLumaRange = rounded(lumaMaximum - lumaMinimum);
}

function rgb(color, alpha = 1) {
  return alpha === 1
    ? `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    : `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function buildMotionControllers() {
  const height = shutters.getBoundingClientRect().height;
  state.bandProfiles.forEach((profile, index) => {
    const shift = profile.direction * height * .145 * profile.displacementWeight;
    const angle = profile.direction * (.45 + profile.displacementWeight * .72);
    const control = animate(slices[index], {
      transform: [
        'translate3d(0, 0px, 0) rotateZ(0deg) scale(1)',
        `translate3d(0, ${shift.toFixed(3)}px, 0) rotateZ(${angle.toFixed(3)}deg) scale(.992)`,
      ],
    }, {
      duration: 1,
      ease: [.2, .72, .18, 1],
      autoplay: false,
    });
    control.pause();
    control.time = 0;
    motionControls.push(control);
    state.motionControllerCreateCount += 1;
    state.motionControllerPauseCount += 1;
  });
}

function updateLayoutEvidence() {
  const stageBounds = stage.getBoundingClientRect();
  const shutterBounds = shutters.getBoundingClientRect();
  state.stageWidth = rounded(stageBounds.width);
  state.stageHeight = rounded(stageBounds.height);
  state.shutterCoverageRatio = rounded(
    shutterBounds.width * shutterBounds.height / Math.max(1, stageBounds.width * stageBounds.height),
  );
}

function syncDataset() {
  stage.dataset.ready = String(state.ready);
  stage.dataset.mode = state.mode;
  stage.dataset.result = state.result;
  stage.dataset.separation = String(rounded(state.separation));
  stage.dataset.selectedBand = String(state.selectedBand);
  stage.dataset.inputCount = String(state.inputCount);
  stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
  stage.dataset.automaticPlayback = String(state.automaticPlayback);
  stage.dataset.captureClockDriven = String(state.captureClockDriven);
  shutters.dataset.inspected = String(state.inspectedBandCount > 0);
}

function syncResult() {
  const percentage = Math.round(state.separation * 100);
  let nextMode = 'aligned';
  let nextResult = 'source-sealed';
  seamMeter.textContent = `${String(percentage).padStart(2, '0')}% separated`;
  separationRange.value = String(percentage);
  if (state.separation >= .72) {
    nextMode = 'review';
    nextResult = `hold-bay-${String(state.criticalBand).padStart(2, '0')}`;
    systemState.textContent = `hold · bay ${String(state.criticalBand).padStart(2, '0')}`;
    disposition.textContent = `hold bay ${String(state.criticalBand).padStart(2, '0')}`;
    disposition.dataset.alert = 'true';
  } else if (state.separation > .02) {
    nextMode = 'separating';
    nextResult = 'evidence-in-progress';
    systemState.textContent = `evidence ${percentage}%`;
    disposition.textContent = 'reviewing';
    disposition.dataset.alert = 'false';
  } else {
    systemState.textContent = 'source verified · drag to review';
    disposition.textContent = 'source sealed';
    disposition.dataset.alert = 'false';
  }
  if (nextResult !== state.result) {
    state.resultTransitionCount += 1;
    if (nextMode === 'review') state.reviewReachedCount += 1;
    if (state.mode === 'review' && nextMode === 'aligned') state.alignedAfterReviewCount += 1;
  }
  state.mode = nextMode;
  state.result = nextResult;
  syncDataset();
}

function applySeparation(value, countMutation = true) {
  const next = clamp(value, 0, 1);
  if (countMutation && Math.abs(next - state.separation) > .0001) state.separationMutationCount += 1;
  state.separation = next;
  state.maximumSeparation = Math.max(state.maximumSeparation, next);
  motionControls.forEach(control => {
    control.time = state.reducedMotion ? (next >= .72 ? 1 : 0) : next;
    state.motionControllerProgressSetCount += 1;
  });
  syncResult();
}

function inspectBand(index, countInspection = true) {
  const profile = state.bandProfiles[index];
  if (!profile) return;
  state.selectedBand = profile.band;
  if (countInspection) {
    state.zoneInspectionCount += 1;
    if (!state.inspectedBands.includes(profile.band)) {
      state.inspectedBands.push(profile.band);
      state.inspectedBandCount = state.inspectedBands.length;
    }
  }
  const copy = evidenceCopy[profile.evidence];
  stage.style.setProperty('--signal', rgb(copy.color));
  stage.style.setProperty('--signal-soft', rgb(copy.color, .17));
  bayMarker.style.transform = `translateX(${index * 100}%)`;
  evidenceHeading.textContent = `Bay ${String(profile.band).padStart(2, '0')}`;
  evidenceSubtitle.textContent = `${profile.checksum} · luma ${Math.round(profile.luma)}`;
  evidenceKind.textContent = copy.label;
  riskScore.textContent = `${profile.risk} / 100`;
  riskScore.dataset.alert = String(profile.evidence === 'corrosion');
  pixelCount.textContent = `${profile.pixelCount} px`;
  bandLabels.forEach((label, labelIndex) => {
    label.dataset.selected = String(labelIndex === index);
  });
  syncDataset();
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
  if (event.pointerType) {
    state.lastPointerType = event.pointerType;
    if (!state.pointerTypesSeen.includes(event.pointerType)) state.pointerTypesSeen.push(event.pointerType);
  }
  return true;
}

function localBandFromEvent(event) {
  const bounds = shutters.getBoundingClientRect();
  const localX = clamp(event.clientX - bounds.left, 0, Math.max(0, bounds.width - .01));
  return clamp(Math.floor(localX / Math.max(1, bounds.width) * BAND_COUNT), 0, BAND_COUNT - 1);
}

function handleHover(event) {
  if (state.activePointerId !== null || event.pointerType !== 'mouse') return;
  const index = localBandFromEvent(event);
  if (state.selectedBand === index + 1 && state.inspectedBands.includes(index + 1)) return;
  if (!acceptTrustedInput(event, 'mouse-hover')) return;
  state.mouseHoverCount += 1;
  inspectBand(index);
}

shutters.addEventListener('pointerenter', handleHover);
shutters.addEventListener('pointermove', event => {
  if (state.activePointerId === null) {
    handleHover(event);
    return;
  }
  if (event.pointerId !== state.activePointerId || event.isTrusted !== true) return;
  event.preventDefault();
  acceptTrustedInput(event, 'captured-pointer-drag');
  state.capturedPointerMoveCount += 1;
  const distance = (event.clientX - dragStartX) / Math.max(1, shutters.clientWidth * .58);
  state.pointerSeparationMutationCount += 1;
  applySeparation(dragStartSeparation + distance);
  inspectBand(localBandFromEvent(event), false);
});

shutters.addEventListener('pointerdown', event => {
  if (!acceptTrustedInput(event, 'captured-pointer-down')) return;
  event.preventDefault();
  shutters.focus({ preventScroll: true });
  state.activePointerId = event.pointerId;
  dragStartX = event.clientX;
  dragStartSeparation = state.separation;
  shutters.setPointerCapture(event.pointerId);
  state.pointerCaptureCount += 1;
  state.capturedPointerDownCount += 1;
  inspectBand(localBandFromEvent(event));
  syncDataset();
});

function finishPointer(event) {
  if (state.activePointerId === null || event.pointerId !== state.activePointerId) return;
  if (!acceptTrustedInput(event, 'captured-pointer-up')) return;
  const pointerId = state.activePointerId;
  state.activePointerId = null;
  state.capturedPointerUpCount += 1;
  if (shutters.hasPointerCapture(pointerId)) shutters.releasePointerCapture(pointerId);
  syncDataset();
}

shutters.addEventListener('pointerup', finishPointer);
shutters.addEventListener('pointercancel', event => {
  if (event.pointerId !== state.activePointerId) return;
  state.activePointerId = null;
  syncDataset();
});

shutters.addEventListener('keydown', event => {
  const supported = ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'];
  if (!supported.includes(event.key) || !acceptTrustedInput(event, `keyboard-${event.key.toLowerCase()}`)) return;
  event.preventDefault();
  state.keyboardInputCount += 1;
  state.keyboardSeparationMutationCount += 1;
  if (event.key === 'ArrowLeft') applySeparation(state.separation - .12);
  if (event.key === 'ArrowRight') applySeparation(state.separation + .12);
  if (event.key === 'Home' || event.key === 'Escape') applySeparation(0);
  if (event.key === 'End') applySeparation(1);
});

separationRange.addEventListener('input', event => {
  if (!acceptTrustedInput(event, 'visible-range')) return;
  state.rangeInputCount += 1;
  state.rangeSeparationMutationCount += 1;
  applySeparation(Number(separationRange.value) / 100);
});

alignButton.addEventListener('click', event => {
  if (!acceptTrustedInput(event, 'visible-align-button')) return;
  state.buttonInputCount += 1;
  state.alignButtonCount += 1;
  state.buttonSeparationMutationCount += 1;
  applySeparation(0);
});

separateButton.addEventListener('click', event => {
  if (!acceptTrustedInput(event, 'visible-separate-button')) return;
  state.buttonInputCount += 1;
  state.separateButtonCount += 1;
  state.buttonSeparationMutationCount += 1;
  applySeparation(1);
});

reducedMotionQuery.addEventListener('change', event => {
  state.reducedMotion = event.matches;
  applySeparation(state.separation, false);
});

buildScene();

const assetReady = (async () => {
  state.assetFetchCount += 1;
  const response = await fetch(ASSET_URL, { cache: 'force-cache' });
  state.assetResponseStatus = response.status;
  state.assetMimeType = response.headers.get('content-type') || '';
  state.assetSameOrigin = new URL(response.url).origin === location.origin;
  if (!response.ok) throw new Error(`Inspection asset fetch failed: ${response.status}`);
  const buffer = await response.arrayBuffer();
  state.assetByteLength = buffer.byteLength;
  state.assetSha256 = await sha256(buffer);
  state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;
  const blob = new Blob([buffer], { type: state.assetMimeType || 'image/jpeg' });
  const bitmap = await createImageBitmap(blob);
  state.browserImageDecoded = true;
  state.decodedWidth = bitmap.width;
  state.decodedHeight = bitmap.height;
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  context.drawImage(bitmap, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  bitmap.close();
  const pixels = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
  state.sampledPixelSha256 = await sha256(pixels.buffer);
  analyzePixels(pixels);
  await Promise.all(images.map(image => image.decode()));
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  buildMotionControllers();
  applySeparation(0, false);
  inspectBand(state.criticalBand - 1, false);
  state.inspectedBandCount = 0;
  state.inspectedBands = [];
  shutters.dataset.inspected = 'false';
  updateLayoutEvidence();
  state.ready = true;
  syncResult();
})();

window.addEventListener('resize', updateLayoutEvidence);

window.__PREVIEW_RUNTIME_ASSERT__ = () => {
  const imageSources = new Set(images.map(image => image.currentSrc));
  const classifiedBands = Object.values(state.classificationCounts).reduce((sum, count) => sum + count, 0);
  return state.ready
    && state.task === 'human-operated-fictional-north-quay-storm-gate-evidence-review'
    && state.claimedLibrary === 'motion@12.42.2'
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
    && images.length === BAND_COUNT
    && imageSources.size === 1
    && images.every(image => image.complete && image.naturalWidth === EXPECTED_ASSET.width && image.naturalHeight === EXPECTED_ASSET.height)
    && state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
    && state.sampledPixelByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4
    && state.sampledPixelSha256.length === 64
    && !/^0+$/.test(state.sampledPixelSha256)
    && state.sampledPixelChecksum.length === 8
    && state.distinctSampleColorCount > 480
    && state.sampledLumaMinimum < 30
    && state.sampledLumaMaximum > 180
    && state.sampledLumaRange > 150
    && state.bandProfiles.length === BAND_COUNT
    && state.bandProfiles.every(profile => (
      profile.pixelCount === BAND_WIDTH * SAMPLE_HEIGHT
      && profile.checksum.length === 8
      && profile.risk >= 0
      && profile.risk <= 100
      && profile.displacementWeight >= .62
      && profile.displacementWeight <= 1.42
      && evidenceCopy[profile.evidence]
    ))
    && classifiedBands === BAND_COUNT
    && state.classificationCounts.protected >= 2
    && state.classificationCounts.corrosion >= 1
    && state.classificationCounts.salt >= 1
    && state.classificationCounts.waterline >= 1
    && state.criticalBand >= 1
    && state.criticalBand <= BAND_COUNT
    && state.criticalRisk >= 25
    && state.reviewBandCount >= 2
    && motionControls.length === BAND_COUNT
    && state.motionControllerCreateCount === BAND_COUNT
    && state.motionControllerPauseCount === BAND_COUNT
    && state.motionControllerProgressSetCount >= BAND_COUNT
    && state.separation >= 0
    && state.separation <= 1
    && state.maximumSeparation >= state.separation
    && state.reviewReachedCount >= 0
    && state.alignedAfterReviewCount >= 0
    && state.resultTransitionCount >= 0
    && ['aligned', 'separating', 'review'].includes(state.mode)
    && state.rejectedUntrustedInputCount === 0
    && state.inputCount === state.trustedInputCount
    && state.stageWidth >= 140
    && state.stageHeight >= 78
    && state.shutterCoverageRatio > .32
    && shutters.tabIndex === 0
    && separationRange.type === 'range'
    && window.__PREVIEW_INTERACTION_STATE__ === state;
};

installPreviewController({
  id: 'gesture-sliced-image-shutters',
  library: 'motion@12.42.2',
  renderer: 'dom',
  render: () => {
    state.previewRenderCount += 1;
    applySeparation(state.separation, false);
  },
  ready: Promise.all([assetReady, document.fonts.ready]),
});

assetReady.catch(markPreviewFailure);
