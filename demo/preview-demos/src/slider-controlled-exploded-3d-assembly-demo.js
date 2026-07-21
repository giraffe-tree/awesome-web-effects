import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 180;
const TEXTURE_URL = new URL(
  '../assets/aesthetic-wave-06/slider-controlled-exploded-3d-assembly/basalt-composite-calibration.jpg',
  import.meta.url
).href;
const TEXTURE_SHA256 = 'f1ef3b959a2f2e0d73ff718db8a4da5ffc560adb185751f3e9c241df9b992e5a';
const TEXTURE_SIZE = 128;

const PARTS = [
  {
    id: 'front-guard',
    name: 'Front guard',
    material: 'Anodized alloy',
    order: 1,
    assembledX: -64,
    explodeX: -42,
    axis: 'X−',
  },
  {
    id: 'sealed-lens',
    name: 'Sealed lens',
    material: 'Mineral glass',
    order: 2,
    assembledX: -55,
    explodeX: -32,
    axis: 'X−',
  },
  {
    id: 'optical-reflector',
    name: 'Optical reflector',
    material: 'Vapor aluminum',
    order: 3,
    assembledX: -42,
    explodeX: -23,
    axis: 'X−',
  },
  {
    id: 'emitter-plate',
    name: 'LED emitter plate',
    material: 'Ceramic PCB',
    order: 4,
    assembledX: -27,
    explodeX: -12,
    axis: 'X−',
  },
  {
    id: 'heat-sink',
    name: 'Heat sink',
    material: 'Machined aluminum',
    order: 5,
    assembledX: -10,
    explodeX: 10,
    axis: 'X+',
  },
  {
    id: 'power-shell',
    name: 'Composite power shell',
    material: 'Basalt fiber polymer',
    order: 6,
    assembledX: 25,
    explodeX: 27,
    axis: 'X+',
    textured: true,
  },
  {
    id: 'service-latch',
    name: 'Rear service latch',
    material: 'Composite + copper',
    order: 7,
    assembledX: 52,
    explodeX: 42,
    axis: 'X+',
    textured: true,
  },
];

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const roundedPercent = value => Math.round(clamp(value) * 100);

function checksumPixels(pixels) {
  let checksum = 2166136261;
  for (let index = 0; index < pixels.length; index += 4) {
    checksum ^= pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7 + pixels[index + 3] * 11;
    checksum = Math.imul(checksum, 16777619);
  }
  return checksum >>> 0;
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function loadTextureEvidence(url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.origin !== location.origin) throw new Error('Assembly material must load from the preview origin');

  const response = await fetch(parsedUrl.href, { cache: 'no-store' });
  if (!response.ok || response.type === 'opaque') throw new Error(`Material fetch failed with ${response.status}`);
  const bytes = await response.arrayBuffer();
  const sha256 = bytesToHex(await crypto.subtle.digest('SHA-256', bytes));
  if (sha256 !== TEXTURE_SHA256) throw new Error('Assembly material SHA-256 does not match its checked-in evidence');

  const decodedImage = new Image();
  decodedImage.decoding = 'async';
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: response.headers.get('content-type') || 'image/jpeg' }));
  decodedImage.src = objectUrl;
  await decodedImage.decode();
  URL.revokeObjectURL(objectUrl);
  if (!decodedImage.complete || decodedImage.naturalWidth !== 640 || decodedImage.naturalHeight !== 640) {
    throw new Error('Assembly material decoded at an unexpected size');
  }

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = TEXTURE_SIZE;
  sampleCanvas.height = TEXTURE_SIZE;
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  sampleContext.drawImage(decodedImage, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  const sample = sampleContext.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  const luminanceBuckets = new Set();
  let chromaSamples = 0;
  for (let index = 0; index < sample.data.length; index += 4) {
    const red = sample.data[index];
    const green = sample.data[index + 1];
    const blue = sample.data[index + 2];
    luminanceBuckets.add(Math.floor((red * .2126 + green * .7152 + blue * .0722) / 8));
    if (Math.max(red, green, blue) - Math.min(red, green, blue) >= 7) chromaSamples += 1;
  }

  return {
    decodedImage,
    sample,
    sourceUrl: parsedUrl.href,
    responseUrl: response.url,
    byteLength: bytes.byteLength,
    sha256,
    width: decodedImage.naturalWidth,
    height: decodedImage.naturalHeight,
    samplePixelCount: TEXTURE_SIZE * TEXTURE_SIZE,
    sampleChecksum: checksumPixels(sample.data),
    distinctLuminanceBuckets: luminanceBuckets.size,
    chromaSamples,
  };
}

try {
  const stage = document.querySelector('#assembly-stage');
  const host = document.querySelector('#assembly-host');
  const slider = document.querySelector('#assembly-range');
  const readout = document.querySelector('#assembly-readout');
  const rangeOutput = document.querySelector('#range-output');
  const modeOutput = document.querySelector('#assembly-mode');
  const partName = document.querySelector('#part-name');
  const partSpec = document.querySelector('#part-spec');
  const materialSwatch = document.querySelector('#material-swatch');
  const libraryBadge = document.querySelector('.library-badge');
  const partControls = [...document.querySelectorAll('.part-control')];
  const resetControl = document.querySelector('#reset-control');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    task: 'inspect-fictional-field-beacon-exploded-assembly-by-human-input',
    acceptedInputs: ['range', 'mouse', 'touch', 'pen', 'keyboard', 'part-control', 'reset-control'],
    userInputRequired: true,
    automaticPlayback: false,
    automaticFallback: false,
    automaticRehearsal: false,
    previewClockDriven: false,
    previewClockMutations: 0,
    syntheticDispatch: false,
    inputPolicy: 'trusted-only',
    capturePolicy: 'horizontal-pointer-capture',
    renderer: 'p5-webgl',
    ready: false,
    initialStaticVerified: false,
    progress: 0,
    selectedPartId: null,
    inspectionMode: 'assembled',
    reducedMotion: reducedMotion.matches,
    activePointerId: null,
    pointerCaptured: false,
    pointerStartX: 0,
    pointerStartProgress: 0,
    trustedInputCount: 0,
    rejectedSyntheticInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureVerifiedCount: 0,
    rangeInputCount: 0,
    keyboardInputCount: 0,
    partControlCount: 0,
    resetControlCount: 0,
    progressMutationCount: 0,
    intermediateStopCount: 0,
    endpointStartVisits: 1,
    endpointEndVisits: 0,
    endpointMappingVerified: false,
    resetSnapshotVerified: false,
    lastInputTrusted: null,
    lastInputType: 'none',
    semanticPartCount: PARTS.length,
    partIdentitySequence: PARTS.map(part => part.id),
    partOrders: PARTS.map(part => part.order),
    assemblyAxes: PARTS.map(part => part.axis),
    assemblyOrderVerified: false,
    lastPartPositions: [],
    positionOrderVerified: false,
    assetSourceKind: 'project-local-imagegen-material',
    assetFetchCount: 0,
    assetSameOrigin: false,
    assetResponseSameOrigin: false,
    assetDecoded: false,
    assetWidth: 0,
    assetHeight: 0,
    assetByteLength: 0,
    assetSha256: '',
    assetExpectedSha256: TEXTURE_SHA256,
    assetSamplePixelCount: 0,
    assetSampleChecksum: 0,
    assetDistinctLuminanceBuckets: 0,
    assetChromaSamples: 0,
    p5TextureReady: false,
    p5TexturePixelCount: 0,
    p5TextureChecksum: 0,
    textureApplyCount: 0,
    texturedPartIds: [],
    webglRenderCount: 0,
    resizeCount: 0,
    listenersBound: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__EXPLODED_ASSEMBLY_STATE__ = state;

  let sketch = null;
  let pInstance = null;
  let materialTexture = null;
  let textureEvidence = null;
  let pointer = null;
  let resolveSketchReady;
  const sketchReady = new Promise(resolve => { resolveSketchReady = resolve; });

  function acceptTrustedInput(event, inputType) {
    if (!event.isTrusted) {
      state.rejectedSyntheticInputCount += 1;
      return false;
    }
    state.trustedInputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputType = inputType;
    stage.dataset.lastTrustedInput = inputType;
    return true;
  }

  function inspectionText(progress) {
    if (progress <= .0005) return 'Fully assembled';
    if (progress >= .9995) return 'Fully exploded';
    return `Exploded to ${roundedPercent(progress)} percent`;
  }

  function updateInterface() {
    const percent = roundedPercent(state.progress);
    slider.value = String(percent);
    readout.textContent = `${String(percent).padStart(3, '0')}%`;
    rangeOutput.textContent = String(percent).padStart(3, '0');
    host.setAttribute('aria-valuenow', String(percent));
    host.setAttribute('aria-valuetext', inspectionText(state.progress));
    host.dataset.progress = state.progress.toFixed(4);
    host.dataset.inspectionMode = state.inspectionMode;
    modeOutput.textContent = `${state.inspectionMode} · x datum`;
    partControls.forEach((control, index) => {
      control.setAttribute('aria-pressed', String(PARTS[index].id === state.selectedPartId));
    });

    const selectedPart = PARTS.find(part => part.id === state.selectedPartId);
    if (selectedPart) {
      partName.textContent = selectedPart.name;
      partSpec.textContent = `${selectedPart.axis} · step ${selectedPart.order}/7 · ${selectedPart.material}`;
    } else {
      partName.textContent = state.progress <= .0005 ? 'Assembly datum' : 'Assembly spread';
      partSpec.textContent = state.progress <= .0005
        ? '7 parts · primary axis X'
        : `manual hold · ${String(percent).padStart(3, '0')}% separation`;
    }
  }

  function scheduleRuntimeEvidence() {
    requestAnimationFrame(() => {
      if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
        stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__() === true);
      }
    });
  }

  function setProgress(nextProgress, inputType, selectedPartId = null) {
    const next = clamp(nextProgress);
    state.progress = next;
    state.selectedPartId = selectedPartId;
    state.inspectionMode = selectedPartId
      ? 'part inspection'
      : next <= .0005
        ? 'assembled'
        : next >= .9995
          ? 'full service'
          : 'manual hold';
    state.progressMutationCount += 1;
    if (next <= .0005) state.endpointStartVisits += 1;
    if (next >= .9995) state.endpointEndVisits += 1;
    state.lastInputType = inputType;
    updateInterface();
    pInstance?.redraw();
    scheduleRuntimeEvidence();
  }

  function selectPart(index, inputType) {
    const part = PARTS[index];
    if (!part) return;
    const inspectionProgress = clamp(.28 + index * .12);
    setProgress(inspectionProgress, inputType, part.id);
  }

  function resetAssembly() {
    setProgress(0, 'reset-control', null);
    state.resetSnapshotVerified = state.progress === 0
      && state.selectedPartId === null
      && state.inspectionMode === 'assembled';
  }

  function drawCylinderX(p, radius, length, detail = 28) {
    p.push();
    p.rotateZ(p.HALF_PI);
    p.cylinder(radius, length, detail, 1, false, false);
    p.pop();
  }

  function drawFrontGuard(p, selected) {
    p.ambientMaterial(selected ? '#e6ff8d' : '#53625b');
    p.push();
    p.rotateZ(p.HALF_PI);
    p.torus(27, 4.2, 28, 8);
    p.pop();
    p.ambientMaterial('#242c29');
    for (let index = 0; index < 4; index += 1) {
      p.push();
      p.rotateX(index * p.HALF_PI);
      p.translate(0, 0, 28);
      p.box(10, 4, 7, 2, 1);
      p.pop();
    }
  }

  function drawSealedLens(p, selected) {
    p.ambientMaterial(p.color(selected ? 222 : 126, selected ? 255 : 189, selected ? 189 : 181, 220));
    drawCylinderX(p, 22.5, 5, 32);
    p.emissiveMaterial(selected ? '#d9ff62' : '#8ccac1');
    drawCylinderX(p, 15, 5.4, 28);
  }

  function drawReflector(p, selected) {
    p.specularMaterial(selected ? '#f3ffbc' : '#afb7ad');
    p.shininess(32);
    p.push();
    p.rotateZ(-p.HALF_PI);
    p.cone(21, 22, 28, 1, false);
    p.pop();
    p.emissiveMaterial('#efffbd');
    p.sphere(selected ? 5 : 3.7, 16, 10);
  }

  function drawEmitterPlate(p, selected) {
    p.ambientMaterial(selected ? '#d9ff62' : '#c8874f');
    p.box(5, 35, 35, 1, 2);
    p.emissiveMaterial('#f5ffd6');
    p.push();
    p.translate(-3, 0, 0);
    drawCylinderX(p, 8.5, 2.5, 20);
    p.pop();
    p.ambientMaterial('#342e26');
    for (const [y, z] of [[-12, -12], [-12, 12], [12, -12], [12, 12]]) {
      p.push();
      p.translate(-3, y, z);
      p.sphere(1.3, 8, 5);
      p.pop();
    }
  }

  function drawHeatSink(p, selected) {
    for (let index = 0; index < 6; index += 1) {
      p.push();
      p.translate(-11 + index * 4.4, 0, 0);
      p.ambientMaterial(selected && index === 2 ? '#d9ff62' : index % 2 ? '#6d7772' : '#4c5651');
      drawCylinderX(p, 23 + (index % 2) * 1.3, 2.7, 28);
      p.pop();
    }
    p.ambientMaterial('#252c29');
    drawCylinderX(p, 17, 24, 24);
  }

  function applyCompositeTexture(p, partId) {
    p.texture(materialTexture);
    state.textureApplyCount += 1;
    if (!state.texturedPartIds.includes(partId)) state.texturedPartIds.push(partId);
  }

  function drawPowerShell(p, selected) {
    applyCompositeTexture(p, 'power-shell');
    p.tint(selected ? 233 : 186, selected ? 255 : 205, selected ? 179 : 191);
    p.box(45, 42, 40, 3, 2);
    p.noTint();
    p.ambientMaterial(selected ? '#d9ff62' : '#d09258');
    p.push();
    p.translate(0, -22, 0);
    p.box(21, 3, 18, 2, 1);
    p.pop();
    p.ambientMaterial('#151a18');
    p.push();
    p.translate(17, 0, 0);
    p.box(2, 27, 26, 1, 1);
    p.pop();
  }

  function drawServiceLatch(p, selected) {
    applyCompositeTexture(p, 'service-latch');
    p.tint(selected ? 233 : 170, selected ? 255 : 188, selected ? 179 : 176);
    p.box(11, 36, 34, 2, 2);
    p.noTint();
    p.ambientMaterial(selected ? '#d9ff62' : '#d09258');
    p.push();
    p.translate(7, 0, 0);
    p.box(4, 17, 12, 1, 1);
    p.pop();
  }

  function drawPart(p, part, selected) {
    if (part.id === 'front-guard') drawFrontGuard(p, selected);
    if (part.id === 'sealed-lens') drawSealedLens(p, selected);
    if (part.id === 'optical-reflector') drawReflector(p, selected);
    if (part.id === 'emitter-plate') drawEmitterPlate(p, selected);
    if (part.id === 'heat-sink') drawHeatSink(p, selected);
    if (part.id === 'power-shell') drawPowerShell(p, selected);
    if (part.id === 'service-latch') drawServiceLatch(p, selected);
  }

  function drawAssembly(p) {
    const scale = Math.min(p.width / DESIGN_WIDTH, p.height / DESIGN_HEIGHT) * 1.16;
    const focusIndex = PARTS.findIndex(part => part.id === state.selectedPartId);
    state.lastPartPositions = PARTS.map(part => part.assembledX + part.explodeX * state.progress);
    state.positionOrderVerified = state.lastPartPositions.every((position, index, positions) => (
      index === 0 || position > positions[index - 1]
    ));

    p.push();
    p.translate(19 * scale, 1 * scale, 0);
    p.scale(scale);
    p.rotateX(-.18);
    p.rotateY(-.48);

    p.stroke(151, 165, 151, 54);
    p.strokeWeight(.65);
    p.line(-116, 0, 0, 108, 0, 0);
    for (let tick = -100; tick <= 100; tick += 20) p.line(tick, -2.4, 0, tick, 2.4, 0);
    p.noStroke();

    PARTS.forEach((part, index) => {
      const position = state.lastPartPositions[index];
      const selected = index === focusIndex;
      const focusLift = selected ? -5 : 0;
      const focusDepth = selected ? 6 : 0;
      p.push();
      p.translate(position, focusLift, focusDepth);
      drawPart(p, part, selected);
      if (selected) {
        p.emissiveMaterial('#d9ff62');
        p.push();
        p.translate(0, -35, 0);
        p.sphere(2.2, 12, 8);
        p.pop();
      }
      p.pop();
    });
    p.pop();
  }

  function drawScene(p) {
    if (!state.ready || !materialTexture) return;
    state.webglRenderCount += 1;
    p.background('#090d0d');
    p.ortho(-p.width / 2, p.width / 2, -p.height / 2, p.height / 2, -1000, 1000);
    p.camera(0, 0, 280, 0, 0, 0, 0, 1, 0);
    p.ambientLight(64, 69, 65);
    p.directionalLight(214, 225, 202, -.45, .35, -1);
    p.pointLight(229, 150, 83, -110, -60, 120);
    p.pointLight(161, 205, 178, 105, 45, 95);
    p.noStroke();
    p.textureMode(p.NORMAL);
    drawAssembly(p);
  }

  function pointerDown(event) {
    if (!state.ready || !event.isPrimary || (event.button !== undefined && event.button !== 0)) return;
    if (!acceptTrustedInput(event, event.pointerType || 'mouse')) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    pointer = { id: event.pointerId, startX: event.clientX, startProgress: state.progress, moved: 0 };
    state.activePointerId = event.pointerId;
    state.pointerStartX = event.clientX;
    state.pointerStartProgress = state.progress;
    state.pointerDownCount += 1;
    state.pointerCaptureCount += 1;
    host.setPointerCapture(event.pointerId);
    state.pointerCaptured = host.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureVerifiedCount += 1;
    host.dataset.dragging = 'true';
  }

  function pointerMove(event) {
    if (!state.ready || !pointer || event.pointerId !== pointer.id) return;
    if (!acceptTrustedInput(event, event.pointerType || 'mouse')) return;
    event.preventDefault();
    const deltaX = event.clientX - pointer.startX;
    pointer.moved = Math.max(pointer.moved, Math.abs(deltaX));
    state.pointerMoveCount += 1;
    setProgress(pointer.startProgress + deltaX / Math.max(132, host.clientWidth * .62), event.pointerType || 'mouse');
  }

  function pointerEnd(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (event.type !== 'lostpointercapture' && !acceptTrustedInput(event, event.pointerType || 'mouse')) return;
    if (state.pointerCaptured && host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
    if (state.progress > .01 && state.progress < .99 && pointer.moved >= 2) state.intermediateStopCount += 1;
    state.pointerReleaseCount += 1;
    state.pointerCaptured = false;
    state.activePointerId = null;
    pointer = null;
    host.dataset.dragging = 'false';
    scheduleRuntimeEvidence();
  }

  function keyboardInput(event) {
    const supportedKeys = ['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', 'Escape', '1', '2', '3', '4', '5', '6', '7'];
    if (!state.ready || !supportedKeys.includes(event.key)) return;
    if (!acceptTrustedInput(event, 'keyboard')) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (/^[1-7]$/.test(event.key)) {
      selectPart(Number(event.key) - 1, 'keyboard');
      return;
    }
    if (event.key === 'Home' || event.key === 'Escape') {
      setProgress(0, 'keyboard');
      return;
    }
    if (event.key === 'End') {
      setProgress(1, 'keyboard');
      return;
    }
    const direction = event.key === 'ArrowRight' || event.key === 'PageDown' ? 1 : -1;
    const step = event.key.startsWith('Page') || event.shiftKey ? .16 : .06;
    setProgress(state.progress + direction * step, 'keyboard');
  }

  host.addEventListener('pointerdown', pointerDown);
  host.addEventListener('pointermove', pointerMove);
  host.addEventListener('pointerup', pointerEnd);
  host.addEventListener('pointercancel', pointerEnd);
  host.addEventListener('lostpointercapture', pointerEnd);
  host.addEventListener('keydown', keyboardInput);

  slider.addEventListener('input', event => {
    if (!state.ready || !acceptTrustedInput(event, 'range')) return;
    state.rangeInputCount += 1;
    setProgress(Number(slider.value) / 100, 'range');
  });

  partControls.forEach((control, index) => {
    control.addEventListener('click', event => {
      if (!state.ready || !acceptTrustedInput(event, 'part-control')) return;
      state.partControlCount += 1;
      selectPart(index, 'part-control');
    });
  });

  resetControl.addEventListener('click', event => {
    if (!state.ready || !acceptTrustedInput(event, 'reset-control')) return;
    state.resetControlCount += 1;
    resetAssembly();
  });

  reducedMotion.addEventListener?.('change', event => {
    state.reducedMotion = event.matches;
    scheduleRuntimeEvidence();
  });
  state.listenersBound = true;

  state.assemblyOrderVerified = (
    PARTS.length === 7
    && new Set(PARTS.map(part => part.id)).size === PARTS.length
    && PARTS.every((part, index) => part.order === index + 1)
    && PARTS.every(part => /^X[−+]$/.test(part.axis))
    && PARTS.every((part, index, parts) => index === 0 || part.assembledX > parts[index - 1].assembledX)
  );
  const startPositions = PARTS.map(part => part.assembledX);
  const endPositions = PARTS.map(part => part.assembledX + part.explodeX);
  state.endpointMappingVerified = (
    startPositions.every((position, index) => position === PARTS[index].assembledX)
    && endPositions.every((position, index, positions) => index === 0 || position > positions[index - 1])
    && endPositions[0] < startPositions[0]
    && endPositions.at(-1) > startPositions.at(-1)
  );

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = host.querySelector('canvas');
    const bounds = stage.getBoundingClientRect();
    const badgeBounds = libraryBadge.getBoundingClientRect();
    const badgeStyle = getComputedStyle(libraryBadge);
    const webglContext = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    const percent = roundedPercent(state.progress);
    const trustedMutationValid = state.progressMutationCount === 0 || (
      state.trustedInputCount > 0
      && state.lastInputTrusted === true
    );
    const captureValid = state.pointerCaptureCount === 0 || (
      state.pointerCaptureVerifiedCount === state.pointerCaptureCount
      && state.pointerReleaseCount <= state.pointerCaptureCount
      && state.pointerCaptured === (state.activePointerId !== null)
    );
    const selectedPartValid = state.selectedPartId === null || PARTS.some(part => part.id === state.selectedPartId);
    const badgeCompact = badgeStyle.display === 'none' || (
      badgeBounds.width * badgeBounds.height / Math.max(1, bounds.width * bounds.height) < .05
      && badgeBounds.width < bounds.width * .6
      && badgeBounds.height < 24
    );
    const textureEvidenceValid = (
      state.assetSourceKind === 'project-local-imagegen-material'
      && state.assetFetchCount === 1
      && state.assetSameOrigin
      && state.assetResponseSameOrigin
      && state.assetDecoded
      && state.assetWidth === 640
      && state.assetHeight === 640
      && state.assetByteLength > 100000
      && state.assetSha256 === TEXTURE_SHA256
      && state.assetExpectedSha256 === TEXTURE_SHA256
      && state.assetSamplePixelCount === TEXTURE_SIZE * TEXTURE_SIZE
      && state.assetSampleChecksum > 0
      && state.assetDistinctLuminanceBuckets >= 5
      && state.assetChromaSamples > 100
      && state.p5TextureReady
      && state.p5TexturePixelCount === TEXTURE_SIZE * TEXTURE_SIZE
      && state.p5TextureChecksum === state.assetSampleChecksum
      && state.textureApplyCount >= 2
      && ['power-shell', 'service-latch'].every(id => state.texturedPartIds.includes(id))
    );

    return (
      window.__PREVIEW_INTERACTION_STATE__ === state
      && window.__EXPLODED_ASSEMBLY_STATE__ === state
      && state.task === 'inspect-fictional-field-beacon-exploded-assembly-by-human-input'
      && JSON.stringify(state.acceptedInputs) === JSON.stringify(['range', 'mouse', 'touch', 'pen', 'keyboard', 'part-control', 'reset-control'])
      && state.userInputRequired === true
      && state.automaticPlayback === false
      && state.automaticFallback === false
      && state.automaticRehearsal === false
      && state.previewClockDriven === false
      && state.previewClockMutations === 0
      && state.syntheticDispatch === false
      && state.inputPolicy === 'trusted-only'
      && state.capturePolicy === 'horizontal-pointer-capture'
      && state.renderer === 'p5-webgl'
      && state.ready
      && state.initialStaticVerified
      && state.listenersBound
      && sketch instanceof p5
      && pInstance instanceof p5
      && canvas instanceof HTMLCanvasElement
      && Boolean(webglContext)
      && canvas.width === Math.round(host.clientWidth)
      && canvas.height === Math.round(host.clientHeight)
      && badgeCompact
      && state.webglRenderCount >= 1
      && state.semanticPartCount === 7
      && partControls.length === 7
      && state.partIdentitySequence.join('|') === PARTS.map(part => part.id).join('|')
      && state.partOrders.join('|') === '1|2|3|4|5|6|7'
      && state.assemblyAxes.every(axis => /^X[−+]$/.test(axis))
      && state.assemblyOrderVerified
      && state.endpointMappingVerified
      && state.endpointStartVisits >= 1
      && state.endpointEndVisits >= 0
      && state.positionOrderVerified
      && state.lastPartPositions.length === 7
      && state.progress >= 0 && state.progress <= 1
      && Number(slider.value) === percent
      && Number(host.getAttribute('aria-valuenow')) === percent
      && selectedPartValid
      && textureEvidenceValid
      && trustedMutationValid
      && captureValid
      && (state.resetControlCount === 0 || state.resetSnapshotVerified)
      && stage.dataset.previewMechanism === 'trusted-human-scrub-to-semantic-webgl-part-separation'
      && stage.dataset.inputPolicy === 'trusted-only'
      && bounds.width >= innerWidth - 1
      && bounds.height >= innerHeight - 1
    );
  };

  const ready = (async () => {
    const [, evidence] = await Promise.all([document.fonts.ready, loadTextureEvidence(TEXTURE_URL)]);
    textureEvidence = evidence;
    state.assetFetchCount = 1;
    state.assetSameOrigin = new URL(evidence.sourceUrl).origin === location.origin;
    state.assetResponseSameOrigin = new URL(evidence.responseUrl).origin === location.origin;
    state.assetDecoded = evidence.decodedImage.complete;
    state.assetWidth = evidence.width;
    state.assetHeight = evidence.height;
    state.assetByteLength = evidence.byteLength;
    state.assetSha256 = evidence.sha256;
    state.assetSamplePixelCount = evidence.samplePixelCount;
    state.assetSampleChecksum = evidence.sampleChecksum;
    state.assetDistinctLuminanceBuckets = evidence.distinctLuminanceBuckets;
    state.assetChromaSamples = evidence.chromaSamples;
    materialSwatch.style.backgroundImage = `url(${TEXTURE_URL})`;

    sketch = new p5(p => {
      pInstance = p;
      p.setup = () => {
        p.pixelDensity(1);
        p.createCanvas(Math.max(1, Math.round(host.clientWidth)), Math.max(1, Math.round(host.clientHeight)), p.WEBGL).parent(host);
        p.noLoop();
        materialTexture = p.createImage(TEXTURE_SIZE, TEXTURE_SIZE);
        materialTexture.loadPixels();
        materialTexture.pixels.set(textureEvidence.sample.data);
        materialTexture.updatePixels();
        materialTexture.loadPixels();
        state.p5TexturePixelCount = materialTexture.width * materialTexture.height;
        state.p5TextureChecksum = checksumPixels(materialTexture.pixels);
        state.p5TextureReady = state.p5TextureChecksum === textureEvidence.sampleChecksum;
        resolveSketchReady();
      };
      p.draw = () => drawScene(p);
    }, host);

    await sketchReady;
    state.ready = true;
    updateInterface();
    pInstance.redraw();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const firstProgress = state.progress;
    const firstMutationCount = state.progressMutationCount;
    const firstRenderCount = state.webglRenderCount;
    await new Promise(resolve => setTimeout(resolve, 90));
    state.initialStaticVerified = (
      firstProgress === 0
      && state.progress === 0
      && firstMutationCount === 0
      && state.progressMutationCount === 0
      && firstRenderCount === state.webglRenderCount
      && state.trustedInputCount === 0
      && state.selectedPartId === null
      && state.inspectionMode === 'assembled'
    );
    if (!window.__PREVIEW_RUNTIME_ASSERT__()) throw new Error('Exploded field beacon runtime contract failed');
    stage.dataset.runtimeAssert = 'true';
  })().catch(error => {
    markPreviewFailure(error);
    return new Promise(() => {});
  });

  window.addEventListener('resize', () => {
    if (!pInstance) return;
    pInstance.resizeCanvas(Math.max(1, Math.round(host.clientWidth)), Math.max(1, Math.round(host.clientHeight)), true);
    state.resizeCount += 1;
    pInstance.redraw();
    scheduleRuntimeEvidence();
  });

  installPreviewController({
    id: 'slider-controlled-exploded-3d-assembly',
    library: 'p5@2.3.0',
    renderer: 'webgl',
    render: () => Promise.resolve(),
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
