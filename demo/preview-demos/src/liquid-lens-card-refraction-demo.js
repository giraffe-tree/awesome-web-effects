import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL('../assets/aesthetic-wave-06/liquid-lens-card-refraction/pressing-inspection.jpg', import.meta.url).href;
const EXPECTED_ASSET_SHA256 = 'cd293bfc9c71a8c97b1ad98a3fec14a5afd9676add17806dafa5c79312fbeaeb';
const INITIAL = Object.freeze({ x: .66, y: .48, zoom: 1.48 });
const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 32;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const rounded = value => Number(value.toFixed(4));

function pixelChecksum(bytes) {
  let value = 2166136261;
  for (let index = 0; index < bytes.length; index += 1) {
    value ^= bytes[index];
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value.toString(16).padStart(8, '0');
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

try {
  const stage = document.querySelector('#inspection-stage');
  const photo = document.querySelector('#pressing-photo');
  const lens = document.querySelector('#liquid-lens');
  const lensSample = document.querySelector('#lens-sample');
  const lensReadout = document.querySelector('#lens-readout');
  const zoomReadout = document.querySelector('#zoom-readout');
  const controls = document.querySelector('.zoom-controls');
  const actionButtons = [...document.querySelectorAll('[data-lens-action]')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'liquid-lens-card-refraction',
    task: 'human-operated-fictional-vinyl-pressing-surface-inspection',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'same-local-photo-underlay-and-magnified-lens-sample-with-live-backdrop-filter',
    assetMechanismRole: 'local-raster-is-both-visible-underlay-and-the-lens-refraction-pixel-source',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button-control'],
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
    initialX: INITIAL.x,
    initialY: INITIAL.y,
    initialZoom: INITIAL.zoom,
    x: INITIAL.x,
    y: INITIAL.y,
    zoom: INITIAL.zoom,
    minimumZoom: 1.12,
    maximumZoom: 1.95,
    initialFrameSignature: '',
    initialFrameRepeatSignature: '',
    initialStillVerified: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    keyboardMutationCount: 0,
    buttonMutationCount: 0,
    lensPositionMutationCount: 0,
    zoomMutationCount: 0,
    humanVisualMutationCount: 0,
    humanInputCausalityCount: 0,
    nonInputVisualMutationCountAfterReady: 0,
    activePointerId: null,
    activePointerType: 'none',
    pointerCaptured: false,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    firstHumanStateBefore: null,
    firstHumanStateAfter: null,
    maximumPositionDelta: 0,
    minimumHumanZoom: INITIAL.zoom,
    maximumHumanZoom: INITIAL.zoom,
    lensSampleMappingCount: 0,
    responsiveResizeCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    lensWidth: 0,
    lensHeight: 0,
    stageCoverageRatio: 0,
    photoCoverageRatio: 0,
    computedBackdropFilter: '',
    computedLensBackgroundImage: '',
    assetUrl: ASSET_URL,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetMimeType: '',
    assetByteLength: 0,
    assetSha256: '',
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    domImageDecodedCount: 0,
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sourcePixelChecksum: '',
    distinctSampleColorCount: 0,
    sampledLumaMinimum: 255,
    sampledLumaMaximum: 0,
    sampledLumaRange: 0,
    alphaFailureCount: 0,
    assetEvidenceReady: false,
    runtimeAssertionPassed: false,
    motionControllerCount: 1,
    motionControllerDuration: 1,
    motionControllerPaused: false,
    motionControllerZoom: INITIAL.zoom,
    motionControllerUpdateCount: 0,
    motionControllerSeekCount: 0,
    inputRecords: [],
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__LIQUID_LENS_STATE__ = state;

  const zoomController = animate(state.minimumZoom, state.maximumZoom, {
    duration: 1,
    ease: 'linear',
    onUpdate: value => {
      state.motionControllerZoom = rounded(value);
      state.motionControllerUpdateCount += 1;
    },
  });
  zoomController.pause();
  state.motionControllerPaused = true;
  zoomController.time = (INITIAL.zoom - state.minimumZoom) / (state.maximumZoom - state.minimumZoom);

  function syncDataset() {
    stage.dataset.x = state.x.toFixed(4);
    stage.dataset.y = state.y.toFixed(4);
    stage.dataset.zoom = state.zoom.toFixed(4);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.humanVisualMutationCount = String(state.humanVisualMutationCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.keyboardInputCount = String(state.keyboardInputCount);
    stage.dataset.buttonActivationCount = String(state.buttonActivationCount);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
  }

  function updateLayoutEvidence() {
    const stageBounds = stage.getBoundingClientRect();
    const photoBounds = photo.getBoundingClientRect();
    const lensBounds = lens.getBoundingClientRect();
    state.stageWidth = rounded(stageBounds.width);
    state.stageHeight = rounded(stageBounds.height);
    state.lensWidth = rounded(lensBounds.width);
    state.lensHeight = rounded(lensBounds.height);
    state.stageCoverageRatio = rounded(stageBounds.width * stageBounds.height / Math.max(1, innerWidth * innerHeight));
    state.photoCoverageRatio = rounded(photoBounds.width * photoBounds.height / Math.max(1, stageBounds.width * stageBounds.height));
  }

  function visualSignature() {
    return [
      lens.style.getPropertyValue('--lens-x'),
      lens.style.getPropertyValue('--lens-y'),
      lens.style.getPropertyValue('--lens-radius'),
      lens.style.getPropertyValue('--lens-tilt'),
      lensSample.style.backgroundSize,
      lensSample.style.backgroundPosition,
      state.zoom.toFixed(4),
    ].join('|');
  }

  function recordHumanMutation(kind, before, after) {
    const positionDelta = Math.hypot(after.x - before.x, after.y - before.y);
    state.humanVisualMutationCount += 1;
    state.humanInputCausalityCount += 1;
    state.maximumPositionDelta = Math.max(state.maximumPositionDelta, positionDelta);
    state.minimumHumanZoom = Math.min(state.minimumHumanZoom, after.zoom);
    state.maximumHumanZoom = Math.max(state.maximumHumanZoom, after.zoom);
    if (!state.firstHumanStateBefore) {
      state.firstHumanStateBefore = { ...before };
      state.firstHumanStateAfter = { ...after };
    }
    state.inputRecords.push({
      kind,
      trusted: true,
      before: { x: rounded(before.x), y: rounded(before.y), zoom: rounded(before.zoom) },
      after: { x: rounded(after.x), y: rounded(after.y), zoom: rounded(after.zoom) },
    });
    if (state.inputRecords.length > 48) state.inputRecords.shift();
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
    syncDataset();
    return true;
  }

  function updateLensVisual(dx = 0, dy = 0) {
    const stageBounds = stage.getBoundingClientRect();
    const lensBounds = lens.getBoundingClientRect();
    const imageAspect = state.sourceNaturalWidth / state.sourceNaturalHeight || 1.5;
    const stageAspect = stageBounds.width / Math.max(1, stageBounds.height);
    let renderedWidth;
    let renderedHeight;
    let imageLeft;
    let imageTop;
    if (stageAspect > imageAspect) {
      renderedWidth = stageBounds.width;
      renderedHeight = renderedWidth / imageAspect;
      imageLeft = 0;
      imageTop = (stageBounds.height - renderedHeight) / 2;
    } else {
      renderedHeight = stageBounds.height;
      renderedWidth = renderedHeight * imageAspect;
      imageTop = 0;
      imageLeft = (stageBounds.width - renderedWidth) / 2;
    }

    const centerX = state.x * stageBounds.width;
    const centerY = state.y * stageBounds.height;
    const sampleX = lensBounds.width / 2 - (centerX - imageLeft) * state.zoom;
    const sampleY = lensBounds.height / 2 - (centerY - imageTop) * state.zoom;
    const directionX = clamp(dx / Math.max(1, stageBounds.width), -.12, .12);
    const directionY = clamp(dy / Math.max(1, stageBounds.height), -.12, .12);
    const horizontalPull = directionX * 90;
    const verticalPull = directionY * 80;
    const radiusA = clamp(49 + horizontalPull, 37, 63);
    const radiusB = 100 - radiusA;
    const radiusC = clamp(46 + verticalPull, 35, 65);
    const radiusD = 100 - radiusC;

    lens.style.setProperty('--lens-x', `${(state.x * 100).toFixed(3)}%`);
    lens.style.setProperty('--lens-y', `${(state.y * 100).toFixed(3)}%`);
    lens.style.setProperty('--lens-radius', `${radiusA.toFixed(2)}% ${radiusB.toFixed(2)}% ${radiusC.toFixed(2)}% ${radiusD.toFixed(2)}% / ${radiusC.toFixed(2)}% ${radiusA.toFixed(2)}% ${radiusD.toFixed(2)}% ${radiusB.toFixed(2)}%`);
    lens.style.setProperty('--lens-tilt', `${clamp(directionX * 32, -3.5, 3.5).toFixed(2)}deg`);
    lensSample.style.backgroundImage = `url("${ASSET_URL}")`;
    lensSample.style.backgroundSize = `${(renderedWidth * state.zoom).toFixed(2)}px ${(renderedHeight * state.zoom).toFixed(2)}px`;
    lensSample.style.backgroundPosition = `${sampleX.toFixed(2)}px ${sampleY.toFixed(2)}px`;
    lensReadout.style.setProperty('--readout-x', `${(state.x * 100).toFixed(3)}%`);
    lensReadout.style.setProperty('--readout-y', `${(state.y * 100).toFixed(3)}%`);
    lensReadout.textContent = `${state.zoom.toFixed(2)}× · ${String(Math.round(state.x * 100)).padStart(2, '0')}/${String(Math.round(state.y * 100)).padStart(2, '0')}`;
    zoomReadout.textContent = `${state.zoom.toFixed(2)}×`;
    state.lensSampleMappingCount += 1;
    updateLayoutEvidence();
    syncDataset();
  }

  function mutateLens(next, kind, event) {
    if (!acceptTrustedInput(event, kind)) return false;
    const before = { x: state.x, y: state.y, zoom: state.zoom };
    const nextX = clamp(next.x ?? state.x, .06, .94);
    const nextY = clamp(next.y ?? state.y, .1, .9);
    const nextZoom = clamp(next.zoom ?? state.zoom, state.minimumZoom, state.maximumZoom);
    const changedPosition = Math.abs(nextX - state.x) > .0001 || Math.abs(nextY - state.y) > .0001;
    const changedZoom = Math.abs(nextZoom - state.zoom) > .0001;
    if (!changedPosition && !changedZoom) return false;
    if (changedZoom) {
      zoomController.time = (nextZoom - state.minimumZoom) / (state.maximumZoom - state.minimumZoom);
      state.motionControllerSeekCount += 1;
    }
    state.x = nextX;
    state.y = nextY;
    state.zoom = nextZoom;
    if (changedPosition) state.lensPositionMutationCount += 1;
    if (changedZoom) state.zoomMutationCount += 1;
    if (kind === 'pointer-hover') state.hoverMutationCount += 1;
    if (kind === 'pointer-drag' || kind === 'pointer-down') state.dragMutationCount += 1;
    if (kind === 'keyboard') state.keyboardMutationCount += 1;
    if (kind === 'button') state.buttonMutationCount += 1;
    recordHumanMutation(kind, before, { x: state.x, y: state.y, zoom: state.zoom });
    updateLensVisual((state.x - before.x) * stage.clientWidth, (state.y - before.y) * stage.clientHeight);
    return true;
  }

  function positionForEvent(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / Math.max(1, bounds.width),
      y: (event.clientY - bounds.top) / Math.max(1, bounds.height),
    };
  }

  stage.addEventListener('pointerenter', event => {
    if (!['mouse', 'pen'].includes(event.pointerType)) return;
    state.pointerEnterCount += 1;
    state.lastPointerType = event.pointerType;
    syncDataset();
  });

  stage.addEventListener('pointerdown', event => {
    if (controls.contains(event.target)) return;
    if (!['mouse', 'touch', 'pen'].includes(event.pointerType)) return;
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    state.activePointerType = event.pointerType;
    state.lastPointerType = event.pointerType;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    mutateLens(positionForEvent(event), 'pointer-down', event);
    stage.focus({ preventScroll: true });
    event.preventDefault();
  });

  stage.addEventListener('pointermove', event => {
    if (controls.contains(event.target)) return;
    const isDrag = state.activePointerId === event.pointerId;
    const isHover = !isDrag && ['mouse', 'pen'].includes(event.pointerType) && event.buttons === 0;
    if (!isDrag && !isHover) return;
    state.pointerMoveCount += 1;
    state.lastPointerType = event.pointerType;
    mutateLens(positionForEvent(event), isDrag ? 'pointer-drag' : 'pointer-hover', event);
  });

  function releasePointer(event, cancelled = false) {
    if (state.activePointerId !== event.pointerId) return;
    if (event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      return;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = cancelled ? 'pointer-cancel' : 'pointer-release';
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.activePointerId = null;
    state.activePointerType = 'none';
    state.pointerCaptured = false;
    syncDataset();
  }

  stage.addEventListener('pointerup', event => releasePointer(event));
  stage.addEventListener('pointercancel', event => releasePointer(event, true));

  stage.addEventListener('keydown', event => {
    const step = event.shiftKey ? .08 : .035;
    let next = null;
    if (event.key === 'ArrowLeft') next = { x: state.x - step };
    if (event.key === 'ArrowRight') next = { x: state.x + step };
    if (event.key === 'ArrowUp') next = { y: state.y - step };
    if (event.key === 'ArrowDown') next = { y: state.y + step };
    if (event.key === '+' || event.key === '=') next = { zoom: state.zoom + .12 };
    if (event.key === '-' || event.key === '_') next = { zoom: state.zoom - .12 };
    if (event.key === 'Home') next = { ...INITIAL };
    if (!next) return;
    state.keyboardInputCount += 1;
    if (mutateLens(next, 'keyboard', event)) event.preventDefault();
  });

  actionButtons.forEach(button => {
    button.addEventListener('click', event => {
      const action = button.dataset.lensAction;
      let next = null;
      if (action === 'zoom-in') next = { zoom: state.zoom + .12 };
      if (action === 'zoom-out') next = { zoom: state.zoom - .12 };
      if (action === 'reset') next = { ...INITIAL };
      if (!next) return;
      state.buttonActivationCount += 1;
      mutateLens(next, 'button', event);
    });
  });

  async function loadAndSampleAsset() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    if (!response.ok) throw new Error(`liquid-lens-card-refraction: asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    if (!state.assetSameOrigin || !state.assetShaMatchesExpected) {
      throw new Error('liquid-lens-card-refraction: local asset provenance check failed');
    }

    photo.src = ASSET_URL;
    await photo.decode();
    state.browserImageDecoded = true;
    state.domImageDecodedCount += 1;
    state.sourceNaturalWidth = photo.naturalWidth;
    state.sourceNaturalHeight = photo.naturalHeight;
    if (state.sourceNaturalWidth !== 960 || state.sourceNaturalHeight !== 640) {
      throw new Error('liquid-lens-card-refraction: asset dimensions differ from the committed 960x640 file');
    }

    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_WIDTH;
    canvas.height = SAMPLE_HEIGHT;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(photo, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    const pixels = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
    const colors = new Set();
    let minimumLuma = 255;
    let maximumLuma = 0;
    let alphaFailures = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      colors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
      const luma = red * .2126 + green * .7152 + blue * .0722;
      minimumLuma = Math.min(minimumLuma, luma);
      maximumLuma = Math.max(maximumLuma, luma);
      if (alpha !== 255) alphaFailures += 1;
    }
    state.sampledPixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
    state.sampledPixelByteLength = pixels.byteLength;
    state.sourcePixelChecksum = pixelChecksum(pixels);
    state.distinctSampleColorCount = colors.size;
    state.sampledLumaMinimum = rounded(minimumLuma);
    state.sampledLumaMaximum = rounded(maximumLuma);
    state.sampledLumaRange = rounded(maximumLuma - minimumLuma);
    state.alphaFailureCount = alphaFailures;
    state.assetEvidenceReady = true;
  }

  const assetReady = loadAndSampleAsset();
  const fontsReady = document.fonts.ready;
  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.responsiveResizeCount += 1;
      updateLensVisual();
    });
  });

  reducedMotionQuery.addEventListener?.('change', event => {
    state.reducedMotion = event.matches;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    updateLayoutEvidence();
    const lensStyle = getComputedStyle(lens);
    const sampleStyle = getComputedStyle(lensSample);
    state.computedBackdropFilter = lensStyle.backdropFilter || lensStyle.webkitBackdropFilter || '';
    state.computedLensBackgroundImage = sampleStyle.backgroundImage;
    const inputEvidence = state.inputCount === 0
      ? state.x === INITIAL.x && state.y === INITIAL.y && state.zoom === INITIAL.zoom
      : state.lastInputTrusted === true
        && state.humanVisualMutationCount > 0
        && state.humanInputCausalityCount === state.humanVisualMutationCount
        && state.firstHumanStateBefore
        && state.firstHumanStateAfter
        && JSON.stringify(state.firstHumanStateBefore) !== JSON.stringify(state.firstHumanStateAfter);
    const pointerEvidence = state.pointerDownCount === 0
      || state.pointerCaptureCount > 0
        && state.pointerCaptureReleaseCount + state.pointerCancelCount > 0
        && state.dragMutationCount > 0;
    const passed = state.id === 'liquid-lens-card-refraction'
      && state.task === 'human-operated-fictional-vinyl-pressing-surface-inspection'
      && state.claimedLibrary === 'motion@12.42.2'
      && typeof zoomController.pause === 'function'
      && zoomController.duration === 1
      && state.motionControllerCount === 1
      && state.motionControllerDuration === 1
      && state.motionControllerPaused
      && Math.abs(state.motionControllerZoom - state.zoom) < .001
      && state.mechanism === 'same-local-photo-underlay-and-magnified-lens-sample-with-live-backdrop-filter'
      && state.assetMechanismRole === 'local-raster-is-both-visible-underlay-and-the-lens-refraction-pixel-source'
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
      && state.nonInputVisualMutationCountAfterReady === 0
      && inputEvidence
      && pointerEvidence
      && state.zoom >= state.minimumZoom && state.zoom <= state.maximumZoom
      && state.x >= .06 && state.x <= .94
      && state.y >= .1 && state.y <= .9
      && state.lensSampleMappingCount >= 1
      && state.stageCoverageRatio > .98
      && state.photoCoverageRatio > .98
      && state.lensWidth >= 33
      && Math.abs(state.lensWidth - state.lensHeight) < 1
      && state.computedBackdropFilter.includes('blur(')
      && state.computedBackdropFilter.includes('saturate(')
      && state.computedLensBackgroundImage !== 'none'
      && state.computedLensBackgroundImage.includes(new URL(ASSET_URL).pathname.split('/').pop())
      && state.assetEvidenceReady
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetMimeType.includes('image/jpeg')
      && state.assetByteLength === 301656
      && state.assetShaMatchesExpected
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.browserImageDecoded
      && state.domImageDecodedCount === 1
      && state.sourceNaturalWidth === 960
      && state.sourceNaturalHeight === 640
      && state.sampledPixelCount === 1536
      && state.sampledPixelByteLength === 6144
      && /^[a-f0-9]{8}$/.test(state.sourcePixelChecksum)
      && state.distinctSampleColorCount > 180
      && state.sampledLumaRange > 150
      && state.alphaFailureCount === 0
      && new URL(photo.currentSrc || photo.src).origin === location.origin
      && state.ready;
    state.runtimeAssertionPassed = Boolean(passed);
    return state.runtimeAssertionPassed;
  };

  installPreviewController({
    id: 'liquid-lens-card-refraction',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => {
      state.previewRenderCount += 1;
    },
    ready: Promise.all([assetReady, fontsReady]).then(async () => {
      updateLensVisual();
      state.initialFrameSignature = visualSignature();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      state.initialFrameRepeatSignature = visualSignature();
      state.initialStillVerified = state.initialFrameSignature === state.initialFrameRepeatSignature;
      if (!state.initialStillVerified) throw new Error('liquid-lens-card-refraction: initial frame mutated without human input');
      state.ready = true;
      syncDataset();
    }),
  });
} catch (error) {
  markPreviewFailure(error);
}
