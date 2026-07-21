import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const MODULE_ORDER = ['base-rail', 'power-thermal', 'compute-chassis', 'network-switch', 'telemetry-cap'];
const MODULE_LABELS = ['Base rail', 'Power + thermal', 'Compute chassis', 'Network switch', 'Telemetry cap'];
const MODULE_COUNT = MODULE_ORDER.length;
const EXPECTED_ASSET_SHA256 = '133ab6080f9c43f720c1c681445b55bb3f82994a724e7910c2e38300c649c424';
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 64;
const PHOTO_URL = new URL('../assets/aesthetic-wave-06/scroll-stitched-isometric-blueprint/field-node-acceptance.jpg', import.meta.url).href;
const MATERIAL_REGIONS = [
  { id: 'base-rail', x: .27, y: .72, width: .52, height: .17 },
  { id: 'power-thermal', x: .29, y: .53, width: .52, height: .18 },
  { id: 'compute-chassis', x: .31, y: .35, width: .5, height: .17 },
  { id: 'network-switch', x: .31, y: .22, width: .5, height: .12 },
  { id: 'telemetry-cap', x: .32, y: .1, width: .48, height: .11 },
];

const clamp = value => Math.max(0, Math.min(1, value));
const round = value => Number(value.toFixed(5));

try {
  const stage = document.querySelector('#blueprint-stage');
  const assemblyField = document.querySelector('#assembly-field');
  const flights = [...document.querySelectorAll('.module-flight')];
  const ghostTargets = [...document.querySelectorAll('.target-ghost')];
  const moduleButtons = [...document.querySelectorAll('.module-button')];
  const proofWindow = document.querySelector('#proof-window');
  const proofImages = [...document.querySelectorAll('.proof-photo')];
  const materialSwatches = document.querySelector('#material-swatches');
  const assemblyStatus = document.querySelector('#assembly-status');
  const proofStatus = document.querySelector('#proof-status');
  const progressReadout = document.querySelector('#progress-readout');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'scroll-stitched-isometric-blueprint',
    task: 'human-operated-dependency-ordered-field-edge-node-assembly-and-acceptance',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'trusted-scroll-and-captured-vertical-scrub-seek-five-paused-motion-css3d-controls',
    moduleOrder: [...MODULE_ORDER],
    moduleLabels: [...MODULE_LABELS],
    moduleCount: MODULE_COUNT,
    geometryEndpoints: [],
    acceptedInputs: ['wheel', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'module-button'],
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
    renderIgnoresPreviewClock: true,
    controlsBuiltWithoutAutoplay: true,
    initialFrameStatic: true,
    initialStillVerified: false,
    initialProgress: 0,
    progress: 0,
    minHumanProgress: 0,
    maxHumanProgress: 0,
    maxHumanDelta: 0,
    progressSource: 'none',
    phase: 'staged',
    completedModuleCount: 0,
    currentModuleId: MODULE_ORDER[0],
    moduleLocalProgresses: Array(MODULE_COUNT).fill(0),
    assemblyOrderViolationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    ignoredInputCount: 0,
    wheelInputCount: 0,
    wheelConsumedCount: 0,
    wheelBoundaryReleaseCount: 0,
    pointerInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    dragSessionCount: 0,
    dragMutationCount: 0,
    keyboardInputCount: 0,
    keyboardSeekCount: 0,
    moduleButtonInputCount: 0,
    moduleSelectionCount: 0,
    progressMutationCount: 0,
    humanProgressMutationCount: 0,
    nonInputProgressMutationCount: 0,
    humanInputCausalityCount: 0,
    firstHumanInput: null,
    lastHumanInput: null,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    lastWheelDefaultPrevented: null,
    dragActive: false,
    activePointerId: null,
    pointerCaptured: false,
    motionControlCount: 0,
    controlBuildCount: 0,
    controlSeekCount: 0,
    controlTimeSpread: 0,
    fieldWidth: 0,
    fieldHeight: 0,
    resizeCount: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionDirectManipulation: true,
    assetUrl: PHOTO_URL,
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetMimeType: '',
    assetByteLength: 0,
    assetSha256: '',
    assetShaMatchesExpected: false,
    assetDecoded: false,
    assetNaturalWidth: 0,
    assetNaturalHeight: 0,
    proofImageCount: proofImages.length,
    proofImagesDecoded: 0,
    sampleWidth: SAMPLE_WIDTH,
    sampleHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sampledPixelSha256: '',
    sampledOpaquePixelCount: 0,
    materialRegionCount: MATERIAL_REGIONS.length,
    materialSamplePixelCount: 0,
    materialSamples: [],
    distinctMaterialColorCount: 0,
    materialBindingsVerified: false,
    proofReveal: 0,
    proofUsesCommittedAsset: false,
    ready: false,
    renderCount: 0,
    previewClockCallCount: 0,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__ISOMETRIC_BLUEPRINT_STATE__ = state;

  let controls = [];
  let dragStartY = 0;
  let dragStartProgress = 0;
  let latestPointerType = 'mouse';
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`scroll-stitched-isometric-blueprint: ${message}`);
  }

  async function digestHex(buffer) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function averageRegion(pixels, region) {
    const startX = Math.floor(region.x * SAMPLE_WIDTH);
    const startY = Math.floor(region.y * SAMPLE_HEIGHT);
    const endX = Math.min(SAMPLE_WIDTH, Math.ceil((region.x + region.width) * SAMPLE_WIDTH));
    const endY = Math.min(SAMPLE_HEIGHT, Math.ceil((region.y + region.height) * SAMPLE_HEIGHT));
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const offset = (y * SAMPLE_WIDTH + x) * 4;
        red += pixels[offset];
        green += pixels[offset + 1];
        blue += pixels[offset + 2];
        count += 1;
      }
    }
    invariant(count > 0, `material region ${region.id} sampled no pixels`);
    const rgb = [Math.round(red / count), Math.round(green / count), Math.round(blue / count)];
    return {
      id: region.id,
      pixelCount: count,
      rgb,
      css: `rgb(${rgb.join(', ')})`,
    };
  }

  async function loadAndSampleAsset() {
    const response = await fetch(PHOTO_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    invariant(state.assetSameOrigin, 'acceptance photo was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'acceptance photo SHA-256 differs from the committed file');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const sourceImage = new Image();
    sourceImage.src = objectUrl;
    try {
      await sourceImage.decode();
      state.assetDecoded = true;
      state.assetNaturalWidth = sourceImage.naturalWidth;
      state.assetNaturalHeight = sourceImage.naturalHeight;
      invariant(sourceImage.naturalWidth === 960 && sourceImage.naturalHeight === 640,
        'acceptance photo dimensions are not 960x640');

      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_WIDTH;
      canvas.height = SAMPLE_HEIGHT;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      invariant(context instanceof CanvasRenderingContext2D, '2D sampling context is unavailable');
      context.drawImage(sourceImage, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      const pixelData = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
      state.sampledPixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
      state.sampledByteLength = pixelData.byteLength;
      state.sampledOpaquePixelCount = 0;
      for (let offset = 3; offset < pixelData.length; offset += 4) {
        if (pixelData[offset] === 255) state.sampledOpaquePixelCount += 1;
      }
      state.sampledPixelSha256 = await digestHex(pixelData.buffer);
      state.materialSamples = MATERIAL_REGIONS.map(region => averageRegion(pixelData, region));
      state.materialSamplePixelCount = state.materialSamples.reduce((sum, sample) => sum + sample.pixelCount, 0);
      state.distinctMaterialColorCount = new Set(state.materialSamples.map(sample => sample.css)).size;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    await Promise.all(proofImages.map(async image => {
      image.src = PHOTO_URL;
      await image.decode();
      invariant(image.naturalWidth === 960 && image.naturalHeight === 640,
        'a proof image did not decode the committed 960x640 asset');
      state.proofImagesDecoded += 1;
    }));
    state.proofUsesCommittedAsset = proofImages.every(image => new URL(image.currentSrc || image.src).pathname === new URL(PHOTO_URL).pathname);
    invariant(state.proofUsesCommittedAsset, 'proof image elements are not showing the committed asset');

    materialSwatches.replaceChildren();
    state.materialSamples.forEach((sample, index) => {
      flights[index].style.setProperty('--material', sample.css);
      moduleButtons[index].style.setProperty('--sample-color', sample.css);
      const swatch = document.createElement('i');
      swatch.className = 'material-swatch';
      swatch.style.setProperty('--sample-color', sample.css);
      swatch.title = `${MODULE_LABELS[index]} sampled ${sample.css}`;
      materialSwatches.append(swatch);
    });
    state.materialBindingsVerified = flights.every((flight, index) =>
      flight.style.getPropertyValue('--material') === state.materialSamples[index].css)
      && moduleButtons.every((button, index) =>
        button.style.getPropertyValue('--sample-color') === state.materialSamples[index].css);
    invariant(state.materialBindingsVerified, 'sampled material colors were not bound to every assembly module and checkpoint');
  }

  function localProgressFor(index, progress = state.progress) {
    return clamp(progress * MODULE_COUNT - index);
  }

  function syncControlEvidence() {
    const normalizedTimes = controls.map(control => control.duration ? control.time / control.duration : 0);
    if (normalizedTimes.length) {
      state.controlTimeSpread = round(Math.max(...normalizedTimes.map((value, index) =>
        Math.abs(value - localProgressFor(index)) )));
    }
    state.moduleLocalProgresses = normalizedTimes.map(round);
    let violationCount = 0;
    for (let index = 1; index < normalizedTimes.length; index += 1) {
      if (normalizedTimes[index] > 0 && normalizedTimes[index - 1] < .999) violationCount += 1;
    }
    state.assemblyOrderViolationCount = violationCount;
  }

  function syncInterface() {
    const percentage = Math.round(state.progress * 100);
    const completed = Math.min(MODULE_COUNT, Math.floor(state.progress * MODULE_COUNT + .00001));
    const currentIndex = Math.min(MODULE_COUNT - 1, completed);
    state.completedModuleCount = completed;
    state.currentModuleId = completed === MODULE_COUNT ? 'acceptance-complete' : MODULE_ORDER[currentIndex];
    state.phase = state.progress <= 0 ? 'staged' : state.progress >= 1 ? 'online' : 'seating';
    state.proofReveal = round(state.progress);

    stage.style.setProperty('--assembly-progress', state.progress.toFixed(5));
    proofWindow.style.setProperty('--proof-inset', `${((1 - state.progress) * 100).toFixed(3)}%`);
    stage.dataset.phase = state.phase;
    stage.dataset.progress = state.progress.toFixed(5);
    stage.dataset.source = state.progressSource;
    stage.dataset.completedModules = String(completed);
    stage.dataset.currentModule = state.currentModuleId;
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    stage.setAttribute('aria-valuenow', String(percentage));
    stage.setAttribute('aria-valuetext', completed === MODULE_COUNT
      ? 'All five modules seated, field node online and acceptance verified'
      : `${completed} of 5 modules seated, next ${MODULE_LABELS[currentIndex]}`);

    progressReadout.textContent = `BUILD ${String(percentage).padStart(2, '0')}%`;
    assemblyStatus.textContent = completed === MODULE_COUNT
      ? '5 / 5 · node online'
      : `${completed} / 5 · ${completed === 0 ? 'datum open' : `${MODULE_LABELS[currentIndex]} next`}`;
    proofStatus.textContent = completed === MODULE_COUNT ? 'Verified' : `${completed} / 5 read`;

    moduleButtons.forEach((button, index) => {
      const complete = state.progress + .00001 >= Number(button.dataset.progress);
      const current = completed < MODULE_COUNT && index === currentIndex;
      button.classList.toggle('is-complete', complete);
      button.classList.toggle('is-current', current);
      button.setAttribute('aria-pressed', String(complete));
    });
    syncControlEvidence();
  }

  function seekControls() {
    controls.forEach((control, index) => {
      control.time = control.duration * localProgressFor(index);
      state.controlSeekCount += 1;
    });
  }

  function applyProgress(value, source, trustedInput = false) {
    const next = round(clamp(value));
    const before = state.progress;
    const changed = Math.abs(next - before) > .00001;
    if (changed) {
      state.progress = next;
      state.progressSource = source;
      state.progressMutationCount += 1;
      if (trustedInput) {
        state.humanProgressMutationCount += 1;
        state.humanInputCausalityCount += 1;
        state.minHumanProgress = Math.min(state.minHumanProgress, next);
        state.maxHumanProgress = Math.max(state.maxHumanProgress, next);
        state.maxHumanDelta = Math.max(state.maxHumanDelta, Math.abs(next - before));
      } else {
        state.nonInputProgressMutationCount += 1;
      }
      seekControls();
    }
    syncInterface();
    return changed;
  }

  function acceptTrustedInput(event, kind) {
    if (event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputKind = kind;
      state.lastInputTrusted = false;
      syncInterface();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = true;
    if (kind === 'wheel') state.wheelInputCount += 1;
    else if (kind === 'keyboard') state.keyboardInputCount += 1;
    else if (kind === 'module-button') state.moduleButtonInputCount += 1;
    else state.pointerInputCount += 1;
    return true;
  }

  function recordCausalInput(kind, before) {
    const record = { kind, trusted: true, before: round(before), after: round(state.progress) };
    if (!state.firstHumanInput) state.firstHumanInput = record;
    state.lastHumanInput = record;
  }

  function buildControls() {
    controls.forEach(control => control.cancel());
    controls = [];
    state.fieldWidth = assemblyField.clientWidth;
    state.fieldHeight = assemblyField.clientHeight;
    const spreadX = Math.min(118, Math.max(24, state.fieldWidth * .28));
    const liftY = Math.min(58, Math.max(12, state.fieldHeight * .2));
    const starts = [
      { x: -spreadX, y: liftY * .7 },
      { x: spreadX * .88, y: -liftY * .35 },
      { x: -spreadX * .82, y: -liftY * .72 },
      { x: spreadX * .78, y: -liftY * 1.05 },
      { x: 0, y: -liftY * 1.35 },
    ];

    state.geometryEndpoints = flights.map((flight, index) => ({
      id: flight.dataset.module,
      index: index + 1,
      startX: round(starts[index].x),
      startY: round(starts[index].y),
      endX: 0,
      endY: 0,
      finalYPercent: Number(flight.dataset.finalY),
    }));

    controls = flights.map((flight, index) => {
      const control = animate(flight, {
        x: [starts[index].x, 0],
        y: [starts[index].y, 0],
        opacity: [.34, 1],
        scale: [.84, 1],
      }, {
        duration: 1,
        ease: 'linear',
        autoplay: false,
      });
      control.pause();
      control.time = localProgressFor(index);
      return control;
    });
    state.motionControlCount = controls.length;
    state.controlBuildCount += 1;
    seekControls();
    syncInterface();
  }

  stage.addEventListener('wheel', event => {
    if (!acceptTrustedInput(event, 'wheel')) return;
    const before = state.progress;
    const delta = Math.max(-.18, Math.min(.18, event.deltaY * .0015));
    const changed = applyProgress(state.progress + delta, 'wheel', true);
    if (changed) {
      event.preventDefault();
      state.wheelConsumedCount += 1;
    } else {
      state.wheelBoundaryReleaseCount += 1;
    }
    state.lastWheelDefaultPrevented = event.defaultPrevented;
    recordCausalInput('wheel', before);
  }, { passive: false });

  assemblyField.addEventListener('pointerdown', event => {
    latestPointerType = event.pointerType || 'mouse';
    if (event.button !== 0 || !event.isPrimary) {
      state.ignoredInputCount += 1;
      return;
    }
    if (!acceptTrustedInput(event, `${latestPointerType}-drag-start`)) return;
    state.pointerDownCount += 1;
    state.dragSessionCount += 1;
    state.dragActive = true;
    state.activePointerId = event.pointerId;
    state.lastPointerType = latestPointerType;
    dragStartY = event.clientY;
    dragStartProgress = state.progress;
    assemblyField.setPointerCapture(event.pointerId);
    state.pointerCaptureCount += 1;
    state.pointerCaptured = assemblyField.hasPointerCapture(event.pointerId);
    recordCausalInput(`${latestPointerType}-drag-start`, state.progress);
    syncInterface();
  });

  assemblyField.addEventListener('pointermove', event => {
    if (!state.dragActive || event.pointerId !== state.activePointerId) return;
    if (!acceptTrustedInput(event, `${event.pointerType || latestPointerType}-drag-move`)) return;
    state.pointerMoveCount += 1;
    const before = state.progress;
    const travel = Math.max(54, assemblyField.clientHeight * .78);
    const changed = applyProgress(dragStartProgress + (dragStartY - event.clientY) / travel, 'captured-vertical-drag', true);
    if (changed) state.dragMutationCount += 1;
    recordCausalInput(`${event.pointerType || latestPointerType}-drag-move`, before);
  });

  function finishPointer(event, cancelled = false) {
    if (!state.dragActive || event.pointerId !== state.activePointerId) return;
    const kind = `${event.pointerType || latestPointerType}-${cancelled ? 'drag-cancel' : 'drag-end'}`;
    if (!acceptTrustedInput(event, kind)) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    const before = state.progress;
    if (assemblyField.hasPointerCapture(event.pointerId)) {
      assemblyField.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.dragActive = false;
    state.activePointerId = null;
    state.pointerCaptured = false;
    recordCausalInput(kind, before);
    syncInterface();
  }

  assemblyField.addEventListener('pointerup', event => finishPointer(event, false));
  assemblyField.addEventListener('pointercancel', event => finishPointer(event, true));

  stage.addEventListener('pointerdown', event => {
    latestPointerType = event.pointerType || 'mouse';
  }, { capture: true });

  moduleButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (!acceptTrustedInput(event, 'module-button')) return;
      state.moduleSelectionCount += 1;
      const before = state.progress;
      applyProgress(Number(button.dataset.progress), `module-${button.dataset.module}`, true);
      recordCausalInput('module-button', before);
      button.focus({ preventScroll: true });
    });
  });

  stage.addEventListener('keydown', event => {
    const keySteps = {
      ArrowUp: -.08,
      ArrowLeft: -.08,
      ArrowDown: .08,
      ArrowRight: .08,
      PageUp: -.2,
      PageDown: .2,
    };
    let next;
    if (event.key in keySteps) next = state.progress + keySteps[event.key];
    else if (event.key === 'Home' || event.key === '0') next = 0;
    else if (event.key === 'End') next = 1;
    else if (['1', '2', '3', '4', '5'].includes(event.key)) next = Number(event.key) / MODULE_COUNT;
    else return;
    event.preventDefault();
    if (event.repeat) {
      state.ignoredInputCount += 1;
      return;
    }
    if (!acceptTrustedInput(event, 'keyboard')) return;
    state.keyboardSeekCount += 1;
    const before = state.progress;
    applyProgress(next, `keyboard-${event.key}`, true);
    recordCausalInput(`keyboard-${event.key}`, before);
  });

  addEventListener('resize', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      state.resizeCount += 1;
      buildControls();
    });
  });

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    syncInterface();
  });

  function render() {
    state.renderCount += 1;
    state.previewClockCallCount += 1;
    syncInterface();
  }

  const ready = Promise.all([document.fonts.ready, loadAndSampleAsset()]).then(async () => {
    buildControls();
    applyProgress(0, 'none', false);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const firstSignature = `${state.progress}|${controls.map(control => control.time).join(',')}|${proofWindow.style.getPropertyValue('--proof-inset')}`;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const secondSignature = `${state.progress}|${controls.map(control => control.time).join(',')}|${proofWindow.style.getPropertyValue('--proof-inset')}`;
    state.initialStillVerified = firstSignature === secondSignature && state.progress === 0
      && controls.every(control => control.time === 0);
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    syncControlEvidence();
    const controlEvidence = controls.length === MODULE_COUNT && controls.every(control =>
      control.duration === 1
      && typeof control.play === 'function'
      && typeof control.pause === 'function'
      && typeof control.cancel === 'function');
    const moduleEvidence = flights.length === MODULE_COUNT
      && flights.map(flight => flight.dataset.module).join(',') === MODULE_ORDER.join(',')
      && flights.every((flight, index) => Number(flight.dataset.index) === index + 1
        && Number(flight.dataset.finalY) === [67, 55, 43, 31, 19][index])
      && ghostTargets.length === MODULE_COUNT
      && moduleButtons.length === MODULE_COUNT
      && moduleButtons.every((button, index) => button.dataset.module === MODULE_ORDER[index]
        && Number(button.dataset.progress) === (index + 1) / MODULE_COUNT
        && button.type === 'button'
        && button.hasAttribute('aria-label'));
    const geometryEvidence = state.geometryEndpoints.length === MODULE_COUNT
      && state.geometryEndpoints.every((endpoint, index) => endpoint.id === MODULE_ORDER[index]
        && endpoint.index === index + 1
        && endpoint.endX === 0
        && endpoint.endY === 0
        && endpoint.finalYPercent === [67, 55, 43, 31, 19][index]
        && Number.isFinite(endpoint.startX)
        && Number.isFinite(endpoint.startY));
    const progressEvidence = state.moduleLocalProgresses.length === MODULE_COUNT
      && state.moduleLocalProgresses.every((value, index) => Math.abs(value - localProgressFor(index)) <= .001)
      && state.controlTimeSpread <= .001
      && state.assemblyOrderViolationCount === 0
      && state.completedModuleCount === Math.min(MODULE_COUNT, Math.floor(state.progress * MODULE_COUNT + .00001));
    const assetEvidence = state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetMimeType.includes('image/jpeg')
      && state.assetByteLength === 162992
      && state.assetShaMatchesExpected
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.assetDecoded
      && state.assetNaturalWidth === 960
      && state.assetNaturalHeight === 640
      && state.proofImageCount === 2
      && state.proofImagesDecoded === 2
      && state.proofUsesCommittedAsset
      && proofImages.every(image => image.complete && image.naturalWidth === 960 && image.naturalHeight === 640);
    const pixelEvidence = state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
      && state.sampledByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4
      && state.sampledOpaquePixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
      && typeof state.sampledPixelSha256 === 'string'
      && state.sampledPixelSha256.length === 64
      && state.materialRegionCount === MODULE_COUNT
      && state.materialSamples.length === MODULE_COUNT
      && state.materialSamples.every((sample, index) => sample.id === MODULE_ORDER[index]
        && sample.pixelCount > 45
        && sample.rgb.length === 3
        && sample.rgb.every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255)
        && /^rgb\(\d+, \d+, \d+\)$/.test(sample.css))
      && state.materialSamplePixelCount > 500
      && state.distinctMaterialColorCount >= 4
      && state.materialBindingsVerified;
    const inputEvidence = state.inputCount === state.trustedInputCount
      && state.inputCount === state.wheelInputCount + state.pointerInputCount + state.keyboardInputCount + state.moduleButtonInputCount
      && state.humanProgressMutationCount === state.progressMutationCount
      && state.nonInputProgressMutationCount === 0
      && state.humanInputCausalityCount === state.humanProgressMutationCount
      && state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && state.dragMutationCount <= state.pointerMoveCount;
    return typeof animate === 'function'
      && stage.dataset.previewMechanism === 'motion-human-scrubbed-isometric-field-node-assembly'
      && stage.getAttribute('role') === 'slider'
      && stage.tabIndex === 0
      && stage.getAttribute('aria-valuenow') === String(Math.round(state.progress * 100))
      && state.task === 'human-operated-dependency-ordered-field-edge-node-assembly-and-acceptance'
      && state.claimedLibrary === 'motion@12.42.2'
      && state.acceptedInputs.join(',') === 'wheel,mouse-drag,touch-drag,pen-drag,keyboard,module-button'
      && state.initialFrameStatic
      && state.initialStillVerified
      && state.initialProgress === 0
      && state.controlsBuiltWithoutAutoplay
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.automaticPath === false
      && state.automaticPlayback === false
      && state.automaticTimeline === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.syntheticInputDispatch === false
      && state.captureClockDriven === false
      && state.previewClockMutationCount === 0
      && state.renderIgnoresPreviewClock
      && state.reducedMotionDirectManipulation
      && state.motionControlCount === MODULE_COUNT
      && state.controlBuildCount >= 1
      && state.controlSeekCount >= MODULE_COUNT
      && state.fieldWidth > 0
      && state.fieldHeight > 0
      && state.proofReveal === round(state.progress)
      && proofWindow.style.getPropertyValue('--proof-inset') === `${((1 - state.progress) * 100).toFixed(3)}%`
      && controlEvidence
      && moduleEvidence
      && geometryEvidence
      && progressEvidence
      && assetEvidence
      && pixelEvidence
      && inputEvidence
      && state.ready
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'scroll-stitched-isometric-blueprint',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
