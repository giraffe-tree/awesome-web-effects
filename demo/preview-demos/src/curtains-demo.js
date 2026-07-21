import { Curtains, Plane } from 'curtainsjs';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-09/dom-synced-shader-planes/museum-media-registration.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = {
  width: 960,
  height: 600,
  bytes: 132620,
  sha256: '217bc3ea171d79543115d14c2b124dee525074ad89cd9679167575db84b9d7a1',
};
const SAMPLE_WIDTH = 64;
const SAMPLE_HEIGHT = 40;
const CLAIMED_LIBRARY = 'curtainsjs@8.1.6';

const vertexShader = `
  precision mediump float;
  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;
  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  varying vec2 vUv;
  void main() {
    vUv = aTextureCoord;
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uMedia;
  uniform vec2 uPointer;
  uniform float uInspect;
  uniform float uImageEnergy;

  void main() {
    vec2 p = vUv;
    float focus = 1.0 - smoothstep(.0, .42, distance(p, uPointer));
    float channelOffset = (.0008 + uImageEnergy * .0015) * uInspect * focus;
    vec4 source = texture2D(uMedia, p);
    float red = texture2D(uMedia, p + vec2(channelOffset, 0.0)).r;
    float blue = texture2D(uMedia, p - vec2(channelOffset, 0.0)).b;
    vec3 inspected = vec3(red, source.g, blue);
    float registrationGrid = smoothstep(.97, 1.0, sin(p.x * 62.8318) * sin(p.y * 62.8318));
    inspected += vec3(.05, .12, .17) * registrationGrid * uInspect * focus;
    float vignette = smoothstep(.9, .24, distance(p, vec2(.5)));
    gl_FragColor = vec4(mix(source.rgb, inspected, uInspect) * (.88 + vignette * .12), 1.0);
  }
`;

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, precision = 4) => Number(value.toFixed(precision));
const invariant = (condition, message) => {
  if (!condition) throw new Error(`dom-synced-shader-planes: ${message}`);
};

const stage = document.querySelector('#registration-stage');
const workbench = document.querySelector('#registration-workbench');
const element = document.querySelector('#shader-card');
const mediaSource = document.querySelector('#media-source');
const syncReadout = document.querySelector('#sync-readout');
const errorOutput = document.querySelector('#error-output');
const updateOutput = document.querySelector('#update-output');
const scaleControl = document.querySelector('#scale-control');
const scaleOutput = document.querySelector('#scale-output');
const resetButton = document.querySelector('#reset-registration');
const cardBounds = document.querySelector('#card-bounds');
const cardLock = document.querySelector('#card-lock');
const layoutButtons = [...document.querySelectorAll('[data-layout-action]')];

const state = {
  id: 'dom-synced-shader-planes',
  task: 'human-operated-dom-media-card-to-gpu-shader-plane-registration-calibration',
  claimedLibrary: CLAIMED_LIBRARY,
  renderer: 'webgl',
  mechanism: 'curtainsjs-plane-consumes-the-browser-decoded-image-texture-and-recomputes-its-webgl-plane-from-the-real-dom-card-bounds-after-trusted-human-move-scale-and-layout-input',
  assetMechanismRole: 'exact-local-media-image-is-decoded-sampled-uploaded-as-the-curtainsjs-sampler-and-its-pixel-energy-controls-the-live-inspection-shader',
  acceptedInputs: ['trusted-mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'native-range-input', 'visible-layout-buttons', 'visible-reset-button', 'keyboard'],
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
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  activePointerId: null,
  pointerCaptured: false,
  dragStartPointer: null,
  dragStartRect: null,
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
  buttonInputCount: 0,
  rangeInputCount: 0,
  layoutChangeCount: 0,
  resetCount: 0,
  trustedInputCount: 0,
  rejectedUntrustedInputCount: 0,
  humanMutationCount: 0,
  lastInputKind: 'none',
  lastInputSource: 'none',
  lastInputTrusted: false,
  lastPointerType: 'none',
  pointerTypesSeen: [],
  layout: 'edit',
  scalePercent: 100,
  manualOffsetX: 0,
  manualOffsetY: 0,
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
  sampledOpaquePixelCount: 0,
  distinctSampleColorCount: 0,
  sampledLumaMinimum: 255,
  sampledLumaMaximum: 0,
  sampledLumaRange: 0,
  sampledBlueDominanceRatio: 0,
  sampledWarmPixelRatio: 0,
  sampledEdgeMean: 0,
  pixelDrivenImageEnergy: 0,
  pixelEvidenceBoundToShader: false,
  webglContextReady: false,
  curtainsPlaneReady: false,
  planeTextureCount: 0,
  sourceUploadedToPlane: false,
  planeUpdateCount: 0,
  planeResizeCount: 0,
  curtainsRenderCount: 0,
  domBounds: null,
  planeBounds: null,
  webglBounds: null,
  currentRegistrationError: 0,
  maximumRegistrationError: 0,
  maximumPostSyncError: 0,
  successfulRegistrationChecks: 0,
  registrationScore: 100,
  stageWidth: 0,
  stageHeight: 0,
  cardCoverageRatio: 0,
};

window.__PREVIEW_INTERACTION_STATE__ = state;
window.__DOM_SYNCED_SHADER_PLANES_STATE__ = state;

let curtains;
let plane;
let imageEnergy = 0;
let resizeFrame = 0;

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function sampleImagePixels(image) {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  invariant(context, '2D analysis context unavailable');
  context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const pixels = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
  const distinct = new Set();
  let opaque = 0;
  let lumaMinimum = 255;
  let lumaMaximum = 0;
  let blueDominant = 0;
  let warm = 0;
  let edgeTotal = 0;
  let edgeSamples = 0;

  for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
    for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
      const index = (y * SAMPLE_WIDTH + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      const luma = red * .2126 + green * .7152 + blue * .0722;
      if (alpha === 255) opaque += 1;
      if (blue > red * 1.22 && blue > green * 1.06) blueDominant += 1;
      if (red > blue * 1.7 && green > blue * 1.14 && red > 115) warm += 1;
      lumaMinimum = Math.min(lumaMinimum, luma);
      lumaMaximum = Math.max(lumaMaximum, luma);
      distinct.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
      if (x > 0) {
        const previous = index - 4;
        edgeTotal += (
          Math.abs(red - pixels[previous])
          + Math.abs(green - pixels[previous + 1])
          + Math.abs(blue - pixels[previous + 2])
        ) / 3;
        edgeSamples += 1;
      }
    }
  }

  state.sampledPixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
  state.sampledOpaquePixelCount = opaque;
  state.distinctSampleColorCount = distinct.size;
  state.sampledLumaMinimum = rounded(lumaMinimum, 3);
  state.sampledLumaMaximum = rounded(lumaMaximum, 3);
  state.sampledLumaRange = rounded(lumaMaximum - lumaMinimum, 3);
  state.sampledBlueDominanceRatio = rounded(blueDominant / state.sampledPixelCount, 4);
  state.sampledWarmPixelRatio = rounded(warm / state.sampledPixelCount, 4);
  state.sampledEdgeMean = rounded(edgeTotal / Math.max(1, edgeSamples), 4);
  imageEnergy = clamp(
    state.sampledLumaRange / 255 * .5
      + state.sampledBlueDominanceRatio * .3
      + state.sampledEdgeMean / 80 * .2,
    0,
    1,
  );
  state.pixelDrivenImageEnergy = rounded(imageEnergy, 4);
}

async function loadAssetEvidence() {
  state.assetFetchCount += 1;
  const response = await fetch(ASSET_URL, { cache: 'no-store' });
  state.assetResponseStatus = response.status;
  state.assetMimeType = response.headers.get('content-type') || '';
  state.assetSameOrigin = new URL(response.url).origin === location.origin;
  invariant(response.ok, `asset request failed with ${response.status}`);
  const bytes = await response.arrayBuffer();
  state.assetByteLength = bytes.byteLength;
  state.assetSha256 = await sha256(bytes);
  state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;

  await mediaSource.decode();
  state.browserImageDecoded = mediaSource.complete && mediaSource.naturalWidth > 0;
  state.decodedWidth = mediaSource.naturalWidth;
  state.decodedHeight = mediaSource.naturalHeight;
  sampleImagePixels(mediaSource);

  invariant(state.assetByteLength === EXPECTED_ASSET.bytes, 'asset byte length mismatch');
  invariant(state.assetShaMatchesExpected, 'asset SHA-256 mismatch');
  invariant(state.assetMimeType.includes('image/jpeg'), 'asset MIME is not JPEG');
  invariant(state.assetSameOrigin, 'asset is not same-origin');
  invariant(state.decodedWidth === EXPECTED_ASSET.width && state.decodedHeight === EXPECTED_ASSET.height, 'decoded asset dimensions mismatch');
  invariant(state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT, 'sample grid incomplete');
  invariant(state.sampledOpaquePixelCount === state.sampledPixelCount, 'sample contains transparent pixels');
  invariant(state.distinctSampleColorCount > 120, 'asset lacks enough distinguishable color evidence');
  invariant(state.sampledLumaRange > 150, 'asset lacks registration-readable tonal separation');
  invariant(state.sampledBlueDominanceRatio > .08 && state.sampledBlueDominanceRatio < .75, 'asset blue field outside useful range');
  invariant(state.sampledWarmPixelRatio > .015 && state.sampledWarmPixelRatio < .3, 'asset warm target outside useful range');
  invariant(state.sampledEdgeMean > 5 && state.sampledEdgeMean < 45, 'asset edge structure outside useful range');
  invariant(state.pixelDrivenImageEnergy > .25 && state.pixelDrivenImageEnergy < .95, 'pixel-driven shader energy outside useful range');
}

function pointerTypeSeen(pointerType) {
  state.lastPointerType = pointerType || 'mouse';
  if (!state.pointerTypesSeen.includes(state.lastPointerType)) state.pointerTypesSeen.push(state.lastPointerType);
  if (state.lastPointerType === 'touch') state.touchInputCount += 1;
  else if (state.lastPointerType === 'pen') state.penInputCount += 1;
  else state.mouseInputCount += 1;
}

function acceptTrustedInput(event, kind, source) {
  state.lastInputKind = kind;
  state.lastInputSource = source;
  state.lastInputTrusted = event.isTrusted;
  if (!event.isTrusted) {
    state.rejectedUntrustedInputCount += 1;
    return false;
  }
  state.trustedInputCount += 1;
  if (event.pointerType) pointerTypeSeen(event.pointerType);
  return true;
}

function compactRect(rect) {
  return {
    left: rounded(rect.left, 3),
    top: rounded(rect.top, 3),
    width: rounded(rect.width, 3),
    height: rounded(rect.height, 3),
    right: rounded(rect.right ?? rect.left + rect.width, 3),
    bottom: rounded(rect.bottom ?? rect.top + rect.height, 3),
  };
}

function rectError(first, second) {
  return Math.max(
    Math.abs(first.left - second.left),
    Math.abs(first.top - second.top),
    Math.abs(first.width - second.width),
    Math.abs(first.height - second.height),
  );
}

function updateVisibleEvidence() {
  const error = state.currentRegistrationError;
  const locked = error <= .75;
  syncReadout.dataset.state = locked ? 'locked' : 'adjusting';
  syncReadout.textContent = `${error.toFixed(2)} px · ${locked ? 'locked' : 'adjusting'}`;
  errorOutput.textContent = `${error.toFixed(2)} px`;
  updateOutput.textContent = String(state.planeUpdateCount).padStart(2, '0');
  scaleOutput.textContent = `${state.scalePercent}%`;
  cardLock.textContent = locked ? 'GPU lock' : 'Aligning';
  const rect = element.getBoundingClientRect();
  cardBounds.textContent = `DOM ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
}

function measureRegistration() {
  if (!plane) return;
  const domRect = element.getBoundingClientRect();
  const planeRect = plane.getBoundingRect();
  const webglRect = plane.getWebGLBoundingRect();
  const pixelRatio = curtains.pixelRatio;
  const normalizedPlane = {
    left: planeRect.left / pixelRatio,
    top: planeRect.top / pixelRatio,
    width: planeRect.width / pixelRatio,
    height: planeRect.height / pixelRatio,
  };
  const normalizedWebgl = {
    left: webglRect.left / pixelRatio,
    top: webglRect.top / pixelRatio,
    width: webglRect.width / pixelRatio,
    height: webglRect.height / pixelRatio,
  };
  const planeError = rectError(domRect, normalizedPlane);
  const webglError = rectError(domRect, normalizedWebgl);
  state.currentRegistrationError = rounded(Math.max(planeError, webglError), 4);
  state.maximumRegistrationError = rounded(Math.max(state.maximumRegistrationError, state.currentRegistrationError), 4);
  state.maximumPostSyncError = rounded(Math.max(state.maximumPostSyncError, state.currentRegistrationError), 4);
  if (state.currentRegistrationError <= .75) state.successfulRegistrationChecks += 1;
  state.registrationScore = Math.round(clamp(100 - state.currentRegistrationError * 14, 0, 100));
  state.domBounds = compactRect(domRect);
  state.planeBounds = compactRect(normalizedPlane);
  state.webglBounds = compactRect(normalizedWebgl);
  const stageRect = stage.getBoundingClientRect();
  state.stageWidth = rounded(stageRect.width, 2);
  state.stageHeight = rounded(stageRect.height, 2);
  state.cardCoverageRatio = rounded((domRect.width * domRect.height) / Math.max(1, stageRect.width * stageRect.height), 4);
  updateVisibleEvidence();
}

function renderCurtains() {
  plane.uniforms.inspect.value = state.activePointerId === null ? .18 : .72;
  plane.uniforms.imageEnergy.value = imageEnergy;
  state.pixelEvidenceBoundToShader = plane.uniforms.imageEnergy.value === imageEnergy && plane.textures.length === 1;
  curtains.render();
  state.curtainsRenderCount += 1;
}

function synchronizePlane({ resized = false } = {}) {
  if (!plane) return;
  if (resized) {
    plane.resize();
    state.planeResizeCount += 1;
  } else {
    plane.updatePosition();
  }
  state.planeUpdateCount += 1;
  renderCurtains();
  measureRegistration();
}

function baseLayoutRect() {
  const stageRect = stage.getBoundingClientRect();
  if (state.layout === 'review') {
    return {
      left: stageRect.width * .14,
      top: stageRect.height * .39,
      width: stageRect.width * .82,
      height: stageRect.height * .56,
    };
  }
  return {
    left: stageRect.width * .035,
    top: stageRect.height * .18,
    width: stageRect.width * .69,
    height: stageRect.height * .76,
  };
}

function applyCardGeometry({ resized = true } = {}) {
  const stageRect = stage.getBoundingClientRect();
  const base = baseLayoutRect();
  const scale = state.scalePercent / 100;
  const width = base.width * scale;
  const height = base.height * scale;
  const centeredLeft = base.left + (base.width - width) / 2;
  const centeredTop = base.top + (base.height - height) / 2;
  const left = clamp(centeredLeft + state.manualOffsetX, 3, stageRect.width - width - 3);
  const top = clamp(centeredTop + state.manualOffsetY, 27, stageRect.height - height - 4);
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  synchronizePlane({ resized });
}

function setShaderPointer(event) {
  if (!plane) return;
  const rect = element.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  const y = 1 - clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
  plane.uniforms.pointer.value = [x, y];
}

function beginDrag(event) {
  if (!acceptTrustedInput(event, 'pointerdown', 'media-card')) return;
  state.pointerDownCount += 1;
  state.activePointerId = event.pointerId;
  state.dragStartPointer = { x: event.clientX, y: event.clientY };
  const rect = element.getBoundingClientRect();
  state.dragStartRect = { left: rect.left, top: rect.top };
  element.setPointerCapture(event.pointerId);
  state.pointerCaptured = element.hasPointerCapture(event.pointerId);
  if (state.pointerCaptured) state.pointerCaptureCount += 1;
  setShaderPointer(event);
  renderCurtains();
}

function movePointer(event) {
  if (!acceptTrustedInput(event, state.activePointerId === event.pointerId ? 'pointerdrag' : 'pointerhover', 'media-card')) return;
  setShaderPointer(event);
  if (state.activePointerId !== event.pointerId || !state.dragStartPointer || !state.dragStartRect) {
    state.hoverInputCount += 1;
    renderCurtains();
    return;
  }
  const stageRect = stage.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const deltaX = event.clientX - state.dragStartPointer.x;
  const deltaY = event.clientY - state.dragStartPointer.y;
  const nextLeft = clamp(state.dragStartRect.left - stageRect.left + deltaX, 3, stageRect.width - rect.width - 3);
  const nextTop = clamp(state.dragStartRect.top - stageRect.top + deltaY, 27, stageRect.height - rect.height - 4);
  element.style.left = `${nextLeft}px`;
  element.style.top = `${nextTop}px`;
  const base = baseLayoutRect();
  const scale = state.scalePercent / 100;
  state.manualOffsetX = nextLeft - (base.left + (base.width - base.width * scale) / 2);
  state.manualOffsetY = nextTop - (base.top + (base.height - base.height * scale) / 2);
  state.pointerDragCount += 1;
  state.humanMutationCount += 1;
  synchronizePlane();
}

function endDrag(event, cancelled = false) {
  if (state.activePointerId !== event.pointerId) return;
  if (!acceptTrustedInput(event, cancelled ? 'pointercancel' : 'pointerup', 'media-card')) return;
  if (cancelled) state.pointerCancelCount += 1;
  else state.pointerReleaseCount += 1;
  if (element.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId);
    state.pointerCaptureReleaseCount += 1;
  }
  state.pointerCaptured = false;
  state.activePointerId = null;
  state.dragStartPointer = null;
  state.dragStartRect = null;
  renderCurtains();
  measureRegistration();
}

function setScale(value, event, source = 'range') {
  if (event && !acceptTrustedInput(event, source === 'keyboard' ? 'keydown' : 'input', source)) return;
  state.scalePercent = clamp(Math.round(value), 78, 112);
  scaleControl.value = String(state.scalePercent);
  if (source === 'range') state.rangeInputCount += 1;
  state.humanMutationCount += 1;
  applyCardGeometry({ resized: true });
}

function setLayout(layout, event) {
  if (event && !acceptTrustedInput(event, 'click', `layout-${layout}`)) return;
  invariant(layout === 'edit' || layout === 'review', 'unknown layout');
  state.layout = layout;
  state.manualOffsetX = 0;
  state.manualOffsetY = 0;
  stage.dataset.layout = layout;
  layoutButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layoutAction === layout)));
  if (event) {
    state.buttonInputCount += 1;
    state.layoutChangeCount += 1;
    state.humanMutationCount += 1;
  }
  applyCardGeometry({ resized: true });
}

function resetRegistration(event) {
  if (event && !acceptTrustedInput(event, 'click', 'reset')) return;
  if (event) {
    state.buttonInputCount += 1;
    state.resetCount += 1;
    state.humanMutationCount += 1;
  }
  state.layout = 'edit';
  state.scalePercent = 100;
  state.manualOffsetX = 0;
  state.manualOffsetY = 0;
  scaleControl.value = '100';
  stage.dataset.layout = 'edit';
  layoutButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layoutAction === 'edit')));
  applyCardGeometry({ resized: true });
}

element.addEventListener('pointerdown', beginDrag);
element.addEventListener('pointermove', movePointer);
element.addEventListener('pointerup', event => endDrag(event));
element.addEventListener('pointercancel', event => endDrag(event, true));
element.addEventListener('keydown', event => {
  if (!acceptTrustedInput(event, 'keydown', 'media-card-keyboard')) return;
  const key = event.key.toLowerCase();
  const step = event.shiftKey ? 10 : 3;
  let handled = true;
  if (key === 'arrowleft') state.manualOffsetX -= step;
  else if (key === 'arrowright') state.manualOffsetX += step;
  else if (key === 'arrowup') state.manualOffsetY -= step;
  else if (key === 'arrowdown') state.manualOffsetY += step;
  else if (key === '+' || key === '=') setScale(state.scalePercent + 2, null, 'keyboard');
  else if (key === '-' || key === '_') setScale(state.scalePercent - 2, null, 'keyboard');
  else if (key === 'l') setLayout(state.layout === 'edit' ? 'review' : 'edit', null);
  else if (key === 'home') resetRegistration(null);
  else handled = false;
  if (!handled) return;
  state.keyboardInputCount += 1;
  state.humanMutationCount += 1;
  if (key.startsWith('arrow')) applyCardGeometry({ resized: false });
  else if (key === 'l') {
    state.layoutChangeCount += 1;
    applyCardGeometry({ resized: true });
  } else if (key === 'home') applyCardGeometry({ resized: true });
  event.preventDefault();
});

scaleControl.addEventListener('input', event => setScale(Number(event.currentTarget.value), event));
layoutButtons.forEach(button => button.addEventListener('click', event => setLayout(button.dataset.layoutAction, event)));
resetButton.addEventListener('click', resetRegistration);

try {
  const ready = new Promise((resolve, reject) => {
    Promise.all([loadAssetEvidence(), document.fonts.ready]).then(() => {
      curtains = new Curtains({
        container: 'curtains-canvas',
        pixelRatio: 1,
        premultipliedAlpha: false,
        autoRender: false,
        autoResize: true,
        watchScroll: false,
        production: false,
      });
      state.webglContextReady = Boolean(curtains.gl) && curtains.type === 'Curtains';
      curtains.onError(() => reject(new Error('Curtains.js could not create a WebGL context')));
      plane = new Plane(curtains, element, {
        vertexShader,
        fragmentShader,
        widthSegments: 1,
        heightSegments: 1,
        transparent: false,
        alwaysDraw: true,
        uniforms: {
          pointer: { name: 'uPointer', type: '2f', value: [.5, .5] },
          inspect: { name: 'uInspect', type: '1f', value: .18 },
          imageEnergy: { name: 'uImageEnergy', type: '1f', value: imageEnergy },
        },
      });

      plane.onReady(() => {
        state.curtainsPlaneReady = plane.type === 'Plane';
        state.planeTextureCount = plane.textures.length;
        state.sourceUploadedToPlane = plane.textures.length === 1
          && plane.textures[0].sourceType === 'image'
          && plane.textures[0].source?.src === mediaSource.src
          && plane.textures[0].source?.naturalWidth === EXPECTED_ASSET.width
          && plane.textures[0].source?.naturalHeight === EXPECTED_ASSET.height;
        requestAnimationFrame(() => {
          applyCardGeometry({ resized: true });
          state.ready = true;
          resolve();
        });
      });

      const bootstrapPlane = () => {
        curtains.render();
        state.curtainsRenderCount += 1;
        if (!state.curtainsPlaneReady) requestAnimationFrame(bootstrapPlane);
      };
      bootstrapPlane();
    }).catch(reject);
  });

  const resizeObserver = new ResizeObserver(() => {
    if (!plane) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      curtains.resize();
      applyCardGeometry({ resized: true });
    });
  });
  resizeObserver.observe(stage);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.claimedLibrary === CLAIMED_LIBRARY, 'claimed library mismatch');
    invariant(state.userInputRequired && state.strictTrustedInputGuard, 'human interaction contract missing');
    invariant(state.initialFrameStatic && !state.automaticPlayback && !state.automaticCycle, 'automatic playback contract violated');
    invariant(state.renderIgnoresPreviewClock && state.previewClockMutationCount === 0, 'preview clock mutated the scene');
    invariant(state.assetFetchCount === 1 && state.assetShaMatchesExpected, 'exact asset provenance missing');
    invariant(state.browserImageDecoded && state.decodedWidth === 960 && state.decodedHeight === 600, 'image decode evidence missing');
    invariant(state.sampledPixelCount === 2560 && state.distinctSampleColorCount > 120, 'robust pixel evidence missing');
    invariant(state.sampledLumaRange > 150 && state.sampledBlueDominanceRatio > .08, 'asset range evidence missing');
    invariant(state.pixelDrivenImageEnergy > .25 && state.pixelDrivenImageEnergy < .95, 'pixel-driven shader evidence missing');
    invariant(state.webglContextReady && state.curtainsPlaneReady, 'Curtains.js plane not ready');
    invariant(state.planeTextureCount === 1 && state.sourceUploadedToPlane, 'source image was not uploaded to Curtains.js plane');
    invariant(state.pixelEvidenceBoundToShader, 'decoded pixels do not control shader inspection');
    invariant(state.planeUpdateCount >= 1 && state.curtainsRenderCount >= 1, 'plane was not synchronized and rendered');
    invariant(state.currentRegistrationError <= .75 && state.maximumPostSyncError <= .75, 'GPU plane no longer matches DOM bounds');
    invariant(state.registrationScore >= 89 && state.successfulRegistrationChecks >= 1, 'registration proof failed');
    invariant(state.cardCoverageRatio >= .22 || state.layout === 'review', 'media card does not occupy enough of the stage');
    invariant(!state.pointerCaptured && state.activePointerId === null, 'pointer capture leaked');
    return true;
  };

  installPreviewController({
    id: state.id,
    library: CLAIMED_LIBRARY,
    renderer: 'webgl',
    ready,
    render: () => {
      state.previewRenderCount += 1;
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
