import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 180;
const MAX_SHIFT = 18;
const KEYBOARD_SHIFT = 14;
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING = 18;
const SPRING_STEP = 1 / 120;
const FRAME = { x: 154, y: 14, width: 152, height: 152, radius: 12, overscan: 12 };
const PHOTO_URL = new URL('../assets/aesthetic-wave-01/chromatic-channel-drag-portrait/editorial-portrait-rgb-source.jpg', import.meta.url).href;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function loadImage(url) {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  return image.decode().then(() => image);
}

function checksum(pixels) {
  let value = 2166136261;
  for (let index = 0; index < pixels.length; index += 64) {
    value ^= pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7;
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function createChannelBuffers(image) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0, width, height);
  const source = sourceContext.getImageData(0, 0, width, height);
  const channelPixels = {
    red: new Uint8ClampedArray(source.data.length),
    green: new Uint8ClampedArray(source.data.length),
    blue: new Uint8ClampedArray(source.data.length),
  };
  let integrity = true;

  for (let index = 0; index < source.data.length; index += 4) {
    const red = source.data[index];
    const green = source.data[index + 1];
    const blue = source.data[index + 2];
    const alpha = source.data[index + 3];
    channelPixels.red[index] = red;
    channelPixels.red[index + 3] = alpha;
    channelPixels.green[index + 1] = green;
    channelPixels.green[index + 3] = alpha;
    channelPixels.blue[index + 2] = blue;
    channelPixels.blue[index + 3] = alpha;
    if (index % 1024 === 0) {
      integrity &&= channelPixels.red[index + 1] === 0
        && channelPixels.red[index + 2] === 0
        && channelPixels.green[index] === 0
        && channelPixels.green[index + 2] === 0
        && channelPixels.blue[index] === 0
        && channelPixels.blue[index + 1] === 0;
    }
  }

  const channels = {};
  for (const [name, pixels] of Object.entries(channelPixels)) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').putImageData(new ImageData(pixels, width, height), 0, 0);
    channels[name] = canvas;
  }

  return {
    channels,
    integrity,
    pixelCount: width * height,
    sourceChecksum: checksum(source.data),
    channelChecksums: Object.fromEntries(Object.entries(channelPixels).map(([name, pixels]) => [name, checksum(pixels)])),
  };
}

try {
  const stage = document.querySelector('.preview-stage');
  const canvas = document.querySelector('#channel-canvas');
  const shiftReadout = document.querySelector('#shift-readout');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let sketch;
  let p5Instance;
  let context;
  let resolveCanvasReady;

  const state = {
    ready: false,
    inputMode: 'idle',
    inputKind: 'none',
    inputCount: 0,
    automaticFallback: false,
    activePointerId: null,
    dragStartClientX: 0,
    dragStartShift: 0,
    targetShift: 0,
    shift: 0,
    velocity: 0,
    lastRenderTime: 0,
    keyboardLeft: false,
    keyboardRight: false,
    image: null,
    imageDecoded: false,
    sourceChecksum: 0,
    sourcePixelCount: 0,
    channelIntegrity: false,
    channelChecksums: null,
    channels: { red: null, green: null, blue: null },
    layout: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT, dpr: 1, scale: 1, offsetX: 0, offsetY: 0 },
    renders: 0,
    releases: 0,
    maxObservedShift: 0,
    listenersBound: false,
    reducedMotion: reducedMotionQuery.matches,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__CHROMATIC_CHANNEL_STATE__ = state;

  const canvasReady = new Promise(resolve => { resolveCanvasReady = resolve; });
  sketch = new p5(instance => {
    p5Instance = instance;
    instance.setup = () => {
      const width = Math.max(1, Math.round(stage.clientWidth || DESIGN_WIDTH));
      const height = Math.max(1, Math.round(stage.clientHeight || DESIGN_HEIGHT));
      const dpr = Math.min(devicePixelRatio || 1, 2);
      instance.pixelDensity(dpr);
      instance.createCanvas(width, height, instance.P2D, canvas);
      instance.noLoop();
      context = instance.drawingContext;
      resolveCanvasReady();
    };
  }, stage);

  function updateLayout() {
    const width = Math.max(1, Math.round(stage.clientWidth || DESIGN_WIDTH));
    const height = Math.max(1, Math.round(stage.clientHeight || DESIGN_HEIGHT));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (p5Instance.width !== width || p5Instance.height !== height || state.layout.dpr !== dpr) {
      if (state.layout.dpr !== dpr) p5Instance.pixelDensity(dpr);
      p5Instance.resizeCanvas(width, height, true);
      context = p5Instance.drawingContext;
    }
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    state.layout = {
      width,
      height,
      dpr,
      scale,
      offsetX: (width - DESIGN_WIDTH * scale) / 2,
      offsetY: (height - DESIGN_HEIGHT * scale) / 2,
    };
  }

  function updateAccessibility() {
    const rounded = Math.round(state.shift);
    const valueText = Math.abs(rounded) < 1
      ? 'Channels registered'
      : rounded > 0
        ? `Red left and blue right by ${Math.abs(rounded)} pixels`
        : `Red right and blue left by ${Math.abs(rounded)} pixels`;
    canvas.setAttribute('aria-valuenow', String(rounded));
    canvas.setAttribute('aria-valuetext', valueText);
    shiftReadout.textContent = `${rounded > 0 ? '+' : ''}${rounded} PX`;
    stage.dataset.inputMode = state.inputMode;
  }

  function setTarget(value, mode = state.inputMode) {
    state.inputMode = mode;
    state.targetShift = clamp(value, -MAX_SHIFT, MAX_SHIFT);
    if (state.reducedMotion) {
      state.shift = state.targetShift;
      state.velocity = 0;
    }
    state.maxObservedShift = Math.max(state.maxObservedShift, Math.abs(state.targetShift));
    updateAccessibility();
  }

  function releaseInput() {
    state.activePointerId = null;
    state.keyboardLeft = false;
    state.keyboardRight = false;
    state.releases += 1;
    setTarget(0, 'idle');
  }

  function advanceSpring(seconds) {
    const time = Number(seconds) || 0;
    if (time < state.lastRenderTime) {
      state.lastRenderTime = time;
      state.velocity = 0;
      return;
    }
    let remaining = Math.min(3, time - state.lastRenderTime);
    while (remaining > 0) {
      const step = Math.min(SPRING_STEP, remaining);
      const acceleration = SPRING_STIFFNESS * (state.targetShift - state.shift) - SPRING_DAMPING * state.velocity;
      state.velocity += acceleration * step;
      state.shift += state.velocity * step;
      remaining -= step;
    }
    state.lastRenderTime = time;
    if (state.inputMode === 'idle' && Math.abs(state.shift) < .025 && Math.abs(state.velocity) < .025) {
      state.shift = 0;
      state.velocity = 0;
    }
  }

  function drawScene(seconds) {
    if (!state.ready) return;
    updateLayout();
    advanceSpring(seconds);
    p5Instance.clear();
    p5Instance.background('#0c0a0e');
    p5Instance.push();
    p5Instance.translate(state.layout.offsetX, state.layout.offsetY);
    p5Instance.scale(state.layout.scale);

    context.save();
    context.fillStyle = '#11141a';
    context.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    const leftGlow = context.createRadialGradient(104, 90, 8, 104, 90, 120);
    leftGlow.addColorStop(0, 'rgba(120,48,78,.13)');
    leftGlow.addColorStop(1, 'rgba(12,10,14,0)');
    context.fillStyle = leftGlow;
    context.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    context.beginPath();
    context.roundRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height, FRAME.radius);
    context.clip();
    context.fillStyle = '#050609';
    context.fillRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height);
    context.globalCompositeOperation = 'screen';
    const drawX = FRAME.x - FRAME.overscan;
    const drawY = FRAME.y - FRAME.overscan;
    const drawSize = FRAME.width + FRAME.overscan * 2;
    context.drawImage(state.channels.red, drawX - state.shift, drawY, drawSize, drawSize);
    context.drawImage(state.channels.green, drawX, drawY, drawSize, drawSize);
    context.drawImage(state.channels.blue, drawX + state.shift, drawY, drawSize, drawSize);
    context.globalCompositeOperation = 'source-over';
    const shade = context.createLinearGradient(0, FRAME.y, 0, FRAME.y + FRAME.height);
    shade.addColorStop(0, 'rgba(4,7,10,0)');
    shade.addColorStop(.72, 'rgba(4,7,10,0)');
    shade.addColorStop(1, 'rgba(4,7,10,.25)');
    context.fillStyle = shade;
    context.fillRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height);
    context.restore();

    context.save();
    context.strokeStyle = state.inputMode === 'idle' ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.72)';
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(FRAME.x + .5, FRAME.y + .5, FRAME.width - 1, FRAME.height - 1, FRAME.radius);
    context.stroke();
    context.fillStyle = 'rgba(255,255,255,.7)';
    context.font = '800 6px ui-monospace, monospace';
    context.letterSpacing = '.08em';
    context.fillText(state.inputMode === 'idle' ? 'REGISTERED' : 'CHANNEL DRAG', FRAME.x + 9, FRAME.y + 14);
    context.restore();

    p5Instance.pop();
    state.renders += 1;
    updateAccessibility();
  }

  function pointerDown(event) {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    state.activePointerId = event.pointerId;
    state.inputKind = event.pointerType || 'pointer';
    state.inputCount += 1;
    state.dragStartClientX = event.clientX;
    state.dragStartShift = state.shift;
    canvas.setPointerCapture(event.pointerId);
    setTarget(state.shift, 'drag');
  }

  function pointerMove(event) {
    if (state.inputMode !== 'drag' || event.pointerId !== state.activePointerId) return;
    event.preventDefault();
    state.inputKind = event.pointerType || 'pointer';
    state.inputCount += 1;
    const delta = (event.clientX - state.dragStartClientX) / Math.max(.001, state.layout.scale);
    setTarget(state.dragStartShift + delta * .55, 'drag');
  }

  function pointerEnd(event) {
    if (event.pointerId !== state.activePointerId) return;
    releaseInput();
  }

  function keyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    state.inputKind = 'keyboard';
    state.inputCount += 1;
    if (event.key === 'Home' || event.key === 'Escape') {
      state.shift = 0;
      state.velocity = 0;
      releaseInput();
      return;
    }
    if (event.key === 'ArrowLeft') state.keyboardLeft = true;
    if (event.key === 'ArrowRight') state.keyboardRight = true;
    const direction = Number(state.keyboardRight) - Number(state.keyboardLeft);
    setTarget(direction * KEYBOARD_SHIFT, 'keyboard');
  }

  function keyUp(event) {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') state.keyboardLeft = false;
    if (event.key === 'ArrowRight') state.keyboardRight = false;
    const direction = Number(state.keyboardRight) - Number(state.keyboardLeft);
    if (direction === 0) releaseInput();
    else setTarget(direction * KEYBOARD_SHIFT, 'keyboard');
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerEnd);
  canvas.addEventListener('pointercancel', pointerEnd);
  canvas.addEventListener('lostpointercapture', pointerEnd);
  canvas.addEventListener('keydown', keyDown);
  canvas.addEventListener('keyup', keyUp);
  canvas.addEventListener('blur', releaseInput);
  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches) {
      state.shift = state.targetShift;
      state.velocity = 0;
    }
  });
  state.listenersBound = true;

  const resourcesReady = Promise.all([document.fonts.ready, loadImage(PHOTO_URL), canvasReady]).then(([, image]) => {
    const channelData = createChannelBuffers(image);
    state.image = image;
    state.imageDecoded = image.complete && image.naturalWidth === 768 && image.naturalHeight === 768;
    state.channels = channelData.channels;
    state.channelIntegrity = channelData.integrity;
    state.channelChecksums = channelData.channelChecksums;
    state.sourceChecksum = channelData.sourceChecksum;
    state.sourcePixelCount = channelData.pixelCount;
    state.ready = true;
  }, error => {
    markPreviewFailure(error);
    return new Promise(() => {});
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await resourcesReady;
    state.shift = 0;
    state.targetShift = 0;
    state.velocity = 0;
    state.lastRenderTime = 0;
    const initialRenders = state.renders;
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    for (let time = 0; time <= .6; time += 1 / 30) drawScene(time);
    const separated = state.shift > 7 && state.inputMode === 'keyboard';
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
    for (let time = .6; time <= 1.6; time += 1 / 30) drawScene(time);
    const recovered = Math.abs(state.shift) < .1 && state.inputMode === 'idle';
    state.shift = 0;
    state.targetShift = 0;
    state.velocity = 0;
    state.lastRenderTime = 0;
    drawScene(0);
    return sketch instanceof p5
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && state.automaticFallback === false
      && state.imageDecoded
      && state.sourcePixelCount === 768 * 768
      && state.sourceChecksum > 0
      && state.channelIntegrity
      && new Set(Object.values(state.channelChecksums)).size === 3
      && state.listenersBound
      && state.renders > initialRenders
      && separated
      && recovered
      && Math.abs(state.shift) < .001;
  };

  installPreviewController({
    id: 'chromatic-channel-drag-portrait',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: seconds => drawScene(seconds),
    ready: resourcesReady,
  });
} catch (error) {
  markPreviewFailure(error);
}
