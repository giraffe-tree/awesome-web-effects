import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 180;
const MAX_SHIFT = 24;
const KEY_STEP = 2;
const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_BYTES = 187977;
const SOURCE_SHA256 = 'd6cb131901608c02b00af6c3e8c4455cf90ca963fc714910f78388e969d210de';
const PHOTO_FRAME = { x: 105, y: 7, width: 208, height: 166, radius: 5, overscanX: 19, overscanY: 11 };
const PHOTO_URL = new URL('../assets/aesthetic-wave-01/chromatic-channel-drag-portrait/press-registration-portrait.jpg', import.meta.url).href;
const CHANNELS = ['red', 'green', 'blue'];
const REFERENCE_CATEGORIES = ['red', 'green', 'blue', 'cyan', 'magenta', 'yellow'];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const cloneOffsets = offsets => Object.fromEntries(CHANNELS.map(channel => [channel, { ...offsets[channel] }]));

function sha256Hex(buffer) {
  return crypto.subtle.digest('SHA-256', buffer).then(digest => Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join(''));
}

async function loadSource(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Portrait source failed: ${response.status}`);
  const bytes = await response.arrayBuffer();
  const exactSha256 = await sha256Hex(bytes.slice(0));
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
  const image = new Image();
  image.decoding = 'async';
  image.src = objectUrl;
  await image.decode();
  URL.revokeObjectURL(objectUrl);
  return { image, bytes: bytes.byteLength, exactSha256 };
}

function sampledChecksum(pixels) {
  let value = 2166136261;
  for (let index = 0; index < pixels.length; index += 64) {
    value ^= pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7;
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function classifyReference(red, green, blue) {
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  if (maximum - minimum < 54) return null;
  if (green > 82 && blue > 112 && red < 72 && blue < green * 1.75) return 'cyan';
  if (red > 116 && blue > 52 && green < 76 && red < blue * 3.1) return 'magenta';
  if (red > 132 && green > 92 && blue < 76 && red < green * 1.8) return 'yellow';
  if (red > 138 && red > green * 1.34 && red > blue * 1.34) return 'red';
  if (green > 104 && green > red * 1.24 && green > blue * 1.12) return 'green';
  if (blue > 112 && blue > red * 1.24 && blue > green * 1.08) return 'blue';
  return null;
}

async function createPixelEvidence(image) {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0);
  const source = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const channelPixels = Object.fromEntries(CHANNELS.map(channel => [channel, new Uint8ClampedArray(source.data.length)]));
  const energy = { red: 0, green: 0, blue: 0 };
  const referenceCounts = Object.fromEntries(REFERENCE_CATEGORIES.map(category => [category, 0]));
  let edgeTotal = 0;
  let edgeSamples = 0;
  let saturatedSamples = 0;
  let analysisSamples = 0;

  for (let y = 0; y < sourceCanvas.height; y += 2) {
    for (let x = 0; x < sourceCanvas.width; x += 2) {
      const index = (y * sourceCanvas.width + x) * 4;
      const red = source.data[index];
      const green = source.data[index + 1];
      const blue = source.data[index + 2];
      energy.red += red;
      energy.green += green;
      energy.blue += blue;
      analysisSamples += 1;
      if (Math.max(red, green, blue) - Math.min(red, green, blue) > 62) saturatedSamples += 1;
      const category = classifyReference(red, green, blue);
      if (category) referenceCounts[category] += 1;
      if (x >= 2) {
        const previous = index - 8;
        edgeTotal += Math.abs(red - source.data[previous])
          + Math.abs(green - source.data[previous + 1])
          + Math.abs(blue - source.data[previous + 2]);
        edgeSamples += 3;
      }
    }
  }

  let channelIntegrity = true;
  for (let index = 0; index < source.data.length; index += 4) {
    const alpha = source.data[index + 3];
    channelPixels.red[index] = source.data[index];
    channelPixels.red[index + 3] = alpha;
    channelPixels.green[index + 1] = source.data[index + 1];
    channelPixels.green[index + 3] = alpha;
    channelPixels.blue[index + 2] = source.data[index + 2];
    channelPixels.blue[index + 3] = alpha;
    if (index % 2048 === 0) {
      channelIntegrity &&= channelPixels.red[index + 1] === 0
        && channelPixels.red[index + 2] === 0
        && channelPixels.green[index] === 0
        && channelPixels.green[index + 2] === 0
        && channelPixels.blue[index] === 0
        && channelPixels.blue[index + 1] === 0;
    }
  }

  const channels = {};
  for (const [channel, pixels] of Object.entries(channelPixels)) {
    const channelCanvas = document.createElement('canvas');
    channelCanvas.width = sourceCanvas.width;
    channelCanvas.height = sourceCanvas.height;
    channelCanvas.getContext('2d').putImageData(new ImageData(pixels, sourceCanvas.width, sourceCanvas.height), 0, 0);
    channels[channel] = channelCanvas;
  }

  const detectedReferences = REFERENCE_CATEGORIES.filter(category => referenceCounts[category] > 18);
  const derivedSha256 = await sha256Hex(source.data.buffer.slice(0));
  return {
    sourceCanvas,
    sourceContext,
    channels,
    channelIntegrity,
    pixelCount: sourceCanvas.width * sourceCanvas.height,
    analysisSamples,
    sourceChecksum: sampledChecksum(source.data),
    channelChecksums: Object.fromEntries(Object.entries(channelPixels).map(([name, pixels]) => [name, sampledChecksum(pixels)])),
    derivedSha256,
    channelEnergy: Object.fromEntries(CHANNELS.map(channel => [channel, energy[channel] / analysisSamples])),
    edgeMean: edgeTotal / Math.max(1, edgeSamples),
    saturatedRatio: saturatedSamples / analysisSamples,
    referenceCounts,
    detectedReferences,
  };
}

try {
  const stage = document.querySelector('.preview-stage');
  const canvas = document.querySelector('#channel-canvas');
  const scoreOutput = document.querySelector('#score-output');
  const sampleOutput = document.querySelector('#sample-output');
  const probeOutput = document.querySelector('#probe-output');
  const statusOutput = document.querySelector('#status-output');
  const spreadRange = document.querySelector('#spread-range');
  const alignButton = document.querySelector('#align-button');
  const channelButtons = [...document.querySelectorAll('[data-channel]')];
  let sketch;
  let p5Instance;
  let context;
  let resolveCanvasReady;

  const state = {
    ready: false,
    imageDecoded: false,
    sourceBytes: 0,
    sourceSha256: '',
    derivedSha256: '',
    sourcePixelCount: 0,
    analysisSamples: 0,
    sourceChecksum: 0,
    channelChecksums: null,
    channelIntegrity: false,
    channelEnergy: null,
    edgeMean: 0,
    saturatedRatio: 0,
    referenceCounts: null,
    detectedReferences: [],
    alignmentTolerance: 0,
    penaltySpan: 0,
    selectedChannel: 'triad',
    offsets: {
      red: { x: 0, y: 0 },
      green: { x: 0, y: 0 },
      blue: { x: 0, y: 0 },
    },
    alignmentScore: 100,
    maximumSeparation: 0,
    activePointerId: null,
    dragStartPoint: null,
    dragStartOffsets: null,
    pointerCaptured: false,
    pointerCaptureCount: 0,
    pointerEnterCount: 0,
    hoverSampleCount: 0,
    dragMutationCount: 0,
    rangeMutationCount: 0,
    buttonMutationCount: 0,
    keyboardMutationCount: 0,
    alignCount: 0,
    channelSelectionCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    humanVisualMutationCount: 0,
    inputKinds: [],
    lastInputKind: 'none',
    lastInputTrusted: null,
    probe: { active: false, designX: 0, designY: 0, sourceX: 0, sourceY: 0, red: 0, green: 0, blue: 0 },
    sourceCanvas: null,
    sourceContext: null,
    channels: { red: null, green: null, blue: null },
    layout: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT, dpr: 1, scale: 1, offsetX: 0, offsetY: 0 },
    renders: 0,
    lastRenderTime: -Infinity,
    listenersBound: false,
    automaticFallback: false,
    timerMutationCount: 0,
    previewClockMutationCount: 0,
    controllers: {
      pointer: 'trusted PointerEvent with capture',
      range: 'native range input',
      buttons: ['triad', 'red', 'green', 'blue', 'align'],
      keyboard: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'Escape', '1', '2', '3', '4'],
    },
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

  function eventPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    const canvasX = (event.clientX - bounds.left) * state.layout.width / Math.max(1, bounds.width);
    const canvasY = (event.clientY - bounds.top) * state.layout.height / Math.max(1, bounds.height);
    return {
      x: (canvasX - state.layout.offsetX) / Math.max(.0001, state.layout.scale),
      y: (canvasY - state.layout.offsetY) / Math.max(.0001, state.layout.scale),
    };
  }

  function inPhoto(point) {
    return point.x >= PHOTO_FRAME.x && point.x <= PHOTO_FRAME.x + PHOTO_FRAME.width
      && point.y >= PHOTO_FRAME.y && point.y <= PHOTO_FRAME.y + PHOTO_FRAME.height;
  }

  function recordTrusted(event, kind = event?.pointerType || 'pointer') {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = kind;
    if (!state.inputKinds.includes(kind)) state.inputKinds.push(kind);
    return true;
  }

  function pairDistance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function calculateRegistration() {
    state.maximumSeparation = Math.max(
      pairDistance(state.offsets.red, state.offsets.green),
      pairDistance(state.offsets.red, state.offsets.blue),
      pairDistance(state.offsets.green, state.offsets.blue),
    );
    const normalized = clamp(state.maximumSeparation / (MAX_SHIFT * 2), 0, 1);
    state.alignmentScore = Math.round(100 - normalized * state.penaltySpan);
  }

  function currentHorizontalOffset() {
    if (state.selectedChannel === 'triad') return Math.round((state.offsets.red.x - state.offsets.blue.x) / 2);
    return Math.round(state.offsets[state.selectedChannel].x);
  }

  function updateInterface() {
    calculateRegistration();
    const registered = state.maximumSeparation <= state.alignmentTolerance;
    const warning = !registered && state.alignmentScore >= 72;
    scoreOutput.textContent = `${state.alignmentScore}%`;
    scoreOutput.style.color = registered ? '#e7ff58' : warning ? '#ffb65f' : '#ff5470';
    sampleOutput.textContent = state.probe.active
      ? `R${state.probe.red} G${state.probe.green} B${state.probe.blue}`
      : 'HOVER TO READ';
    probeOutput.textContent = state.probe.active
      ? `PIXEL ${state.probe.sourceX},${state.probe.sourceY} · RGB ${state.probe.red}/${state.probe.green}/${state.probe.blue}`
      : 'MOVE · SAMPLE / DRAG · SEPARATE';
    statusOutput.textContent = `${registered ? 'REGISTERED' : warning ? 'CHECK PLATE' : 'MISREGISTER'} · ${state.maximumSeparation.toFixed(1)} PX · ${state.detectedReferences.length} COLOR REFERENCES`;
    spreadRange.value = String(clamp(currentHorizontalOffset(), -MAX_SHIFT, MAX_SHIFT));
    canvas.dataset.dragging = String(state.activePointerId !== null);
    canvas.setAttribute('aria-label', `RGB portrait registration workbench. ${state.selectedChannel} selected. ${state.alignmentScore} percent registered.`);
    stage.dataset.registrationStatus = registered ? 'registered' : warning ? 'check' : 'misregistered';
    stage.dataset.selectedChannel = state.selectedChannel;
    stage.dataset.alignmentScore = String(state.alignmentScore);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    for (const button of channelButtons) button.setAttribute('aria-pressed', String(button.dataset.channel === state.selectedChannel));
  }

  function coverCrop(destinationWidth, destinationHeight) {
    const destinationRatio = destinationWidth / destinationHeight;
    const sourceRatio = SOURCE_WIDTH / SOURCE_HEIGHT;
    if (sourceRatio > destinationRatio) {
      const width = SOURCE_HEIGHT * destinationRatio;
      return { x: (SOURCE_WIDTH - width) / 2, y: 0, width, height: SOURCE_HEIGHT };
    }
    const height = SOURCE_WIDTH / destinationRatio;
    return { x: 0, y: (SOURCE_HEIGHT - height) / 2, width: SOURCE_WIDTH, height };
  }

  function sampleSource(point) {
    const expandedWidth = PHOTO_FRAME.width + PHOTO_FRAME.overscanX * 2;
    const expandedHeight = PHOTO_FRAME.height + PHOTO_FRAME.overscanY * 2;
    const crop = coverCrop(expandedWidth, expandedHeight);
    const normalizedX = clamp((point.x - (PHOTO_FRAME.x - PHOTO_FRAME.overscanX)) / expandedWidth, 0, 1);
    const normalizedY = clamp((point.y - (PHOTO_FRAME.y - PHOTO_FRAME.overscanY)) / expandedHeight, 0, 1);
    const sourceX = clamp(Math.round(crop.x + normalizedX * (crop.width - 1)), 0, SOURCE_WIDTH - 1);
    const sourceY = clamp(Math.round(crop.y + normalizedY * (crop.height - 1)), 0, SOURCE_HEIGHT - 1);
    const pixel = state.sourceContext.getImageData(sourceX, sourceY, 1, 1).data;
    state.probe = {
      active: true,
      designX: clamp(point.x, PHOTO_FRAME.x, PHOTO_FRAME.x + PHOTO_FRAME.width),
      designY: clamp(point.y, PHOTO_FRAME.y, PHOTO_FRAME.y + PHOTO_FRAME.height),
      sourceX,
      sourceY,
      red: pixel[0],
      green: pixel[1],
      blue: pixel[2],
    };
  }

  function drawImagePlates() {
    const expanded = {
      x: PHOTO_FRAME.x - PHOTO_FRAME.overscanX,
      y: PHOTO_FRAME.y - PHOTO_FRAME.overscanY,
      width: PHOTO_FRAME.width + PHOTO_FRAME.overscanX * 2,
      height: PHOTO_FRAME.height + PHOTO_FRAME.overscanY * 2,
    };
    const crop = coverCrop(expanded.width, expanded.height);
    context.save();
    context.beginPath();
    context.roundRect(PHOTO_FRAME.x, PHOTO_FRAME.y, PHOTO_FRAME.width, PHOTO_FRAME.height, PHOTO_FRAME.radius);
    context.clip();
    context.fillStyle = '#050505';
    context.fillRect(PHOTO_FRAME.x, PHOTO_FRAME.y, PHOTO_FRAME.width, PHOTO_FRAME.height);
    CHANNELS.forEach((channel, index) => {
      context.globalCompositeOperation = index === 0 ? 'source-over' : 'screen';
      const offset = state.offsets[channel];
      context.drawImage(
        state.channels[channel],
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        expanded.x + offset.x,
        expanded.y + offset.y,
        expanded.width,
        expanded.height,
      );
    });
    context.globalCompositeOperation = 'source-over';
    const edgeShade = context.createLinearGradient(PHOTO_FRAME.x, 0, PHOTO_FRAME.x + 44, 0);
    edgeShade.addColorStop(0, 'rgba(18,17,14,.28)');
    edgeShade.addColorStop(1, 'rgba(18,17,14,0)');
    context.fillStyle = edgeShade;
    context.fillRect(PHOTO_FRAME.x, PHOTO_FRAME.y, 44, PHOTO_FRAME.height);
    context.restore();
  }

  function drawEvidenceOverlay() {
    const selectedColor = state.selectedChannel === 'red'
      ? '#ff4166'
      : state.selectedChannel === 'green'
        ? '#42e0ac'
        : state.selectedChannel === 'blue'
          ? '#4f79ff'
          : '#e7ff58';
    context.save();
    context.lineWidth = state.activePointerId === null ? .8 : 1.25;
    context.strokeStyle = state.activePointerId === null ? 'rgba(241,234,223,.35)' : selectedColor;
    context.beginPath();
    context.roundRect(PHOTO_FRAME.x + .5, PHOTO_FRAME.y + .5, PHOTO_FRAME.width - 1, PHOTO_FRAME.height - 1, PHOTO_FRAME.radius);
    context.stroke();

    const guideY = PHOTO_FRAME.y + 16;
    context.font = '800 5px ui-monospace, monospace';
    context.textBaseline = 'middle';
    context.letterSpacing = '.08em';
    context.fillStyle = 'rgba(24,22,18,.72)';
    context.beginPath();
    context.roundRect(PHOTO_FRAME.x + 7, PHOTO_FRAME.y + 8, 76, 16, 8);
    context.fill();
    context.fillStyle = '#f1eadf';
    context.fillText(state.maximumSeparation <= state.alignmentTolerance ? 'PLATES IN REGISTER' : `${state.selectedChannel.toUpperCase()} PLATE ACTIVE`, PHOTO_FRAME.x + 14, guideY);

    const energies = state.channelEnergy || { red: 0, green: 0, blue: 0 };
    const barX = PHOTO_FRAME.x + 9;
    const barBottom = PHOTO_FRAME.y + PHOTO_FRAME.height - 11;
    const colors = { red: '#ff315d', green: '#38d9a2', blue: '#4b74ff' };
    CHANNELS.forEach((channel, index) => {
      const height = 5 + energies[channel] / 255 * 18;
      context.fillStyle = colors[channel];
      context.fillRect(barX + index * 4, barBottom - height, 2.2, height);
    });

    if (state.probe.active) {
      const { designX: x, designY: y, red, green, blue } = state.probe;
      context.strokeStyle = '#e7ff58';
      context.lineWidth = .8;
      context.beginPath();
      context.arc(x, y, 5.5, 0, Math.PI * 2);
      context.moveTo(x - 9, y);
      context.lineTo(x - 3, y);
      context.moveTo(x + 3, y);
      context.lineTo(x + 9, y);
      context.moveTo(x, y - 9);
      context.lineTo(x, y - 3);
      context.moveTo(x, y + 3);
      context.lineTo(x, y + 9);
      context.stroke();
      context.fillStyle = `rgb(${red} ${green} ${blue})`;
      context.beginPath();
      context.arc(x, y, 2.2, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function drawScene(seconds) {
    if (!state.ready) return;
    updateLayout();
    state.lastRenderTime = Number(seconds) || 0;
    p5Instance.clear();
    p5Instance.background('#171612');
    p5Instance.push();
    p5Instance.translate(state.layout.offsetX, state.layout.offsetY);
    p5Instance.scale(state.layout.scale);
    context.save();
    context.fillStyle = '#171612';
    context.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    context.strokeStyle = 'rgba(241,234,223,.11)';
    context.lineWidth = .6;
    context.beginPath();
    context.moveTo(98.5, 7);
    context.lineTo(98.5, 173);
    context.stroke();
    drawImagePlates();
    drawEvidenceOverlay();
    context.restore();
    p5Instance.pop();
    state.renders += 1;
    updateInterface();
  }

  function alignPlates(kind = 'button') {
    state.offsets = {
      red: { x: 0, y: 0 },
      green: { x: 0, y: 0 },
      blue: { x: 0, y: 0 },
    };
    state.alignCount += 1;
    state.humanVisualMutationCount += 1;
    if (kind === 'keyboard') state.keyboardMutationCount += 1;
    else state.buttonMutationCount += 1;
    updateInterface();
  }

  function selectChannel(channel, kind = 'button') {
    if (!['triad', ...CHANNELS].includes(channel)) return;
    state.selectedChannel = channel;
    state.channelSelectionCount += 1;
    state.humanVisualMutationCount += 1;
    if (kind === 'keyboard') state.keyboardMutationCount += 1;
    else state.buttonMutationCount += 1;
    updateInterface();
  }

  function setDragOffsets(deltaX, deltaY) {
    const start = state.dragStartOffsets;
    if (state.selectedChannel === 'triad') {
      state.offsets.red = {
        x: clamp(start.red.x + deltaX, -MAX_SHIFT, MAX_SHIFT),
        y: clamp(start.red.y + deltaY * .62, -MAX_SHIFT, MAX_SHIFT),
      };
      state.offsets.green = { ...start.green };
      state.offsets.blue = {
        x: clamp(start.blue.x - deltaX, -MAX_SHIFT, MAX_SHIFT),
        y: clamp(start.blue.y - deltaY * .62, -MAX_SHIFT, MAX_SHIFT),
      };
    } else {
      state.offsets = cloneOffsets(start);
      state.offsets[state.selectedChannel] = {
        x: clamp(start[state.selectedChannel].x + deltaX, -MAX_SHIFT, MAX_SHIFT),
        y: clamp(start[state.selectedChannel].y + deltaY, -MAX_SHIFT, MAX_SHIFT),
      };
    }
  }

  function setRangeOffset(value) {
    const offset = clamp(Number(value) || 0, -MAX_SHIFT, MAX_SHIFT);
    if (state.selectedChannel === 'triad') {
      state.offsets.red = { x: offset, y: offset * .18 };
      state.offsets.green = { x: 0, y: 0 };
      state.offsets.blue = { x: -offset, y: -offset * .18 };
    } else {
      state.offsets[state.selectedChannel] = { ...state.offsets[state.selectedChannel], x: offset };
    }
  }

  function nudgeSelected(deltaX, deltaY) {
    if (state.selectedChannel === 'triad') {
      state.offsets.red.x = clamp(state.offsets.red.x + deltaX, -MAX_SHIFT, MAX_SHIFT);
      state.offsets.red.y = clamp(state.offsets.red.y + deltaY, -MAX_SHIFT, MAX_SHIFT);
      state.offsets.blue.x = clamp(state.offsets.blue.x - deltaX, -MAX_SHIFT, MAX_SHIFT);
      state.offsets.blue.y = clamp(state.offsets.blue.y - deltaY, -MAX_SHIFT, MAX_SHIFT);
    } else {
      const selected = state.offsets[state.selectedChannel];
      selected.x = clamp(selected.x + deltaX, -MAX_SHIFT, MAX_SHIFT);
      selected.y = clamp(selected.y + deltaY, -MAX_SHIFT, MAX_SHIFT);
    }
    state.keyboardMutationCount += 1;
    state.humanVisualMutationCount += 1;
    updateInterface();
  }

  function pointerEnter(event) {
    const point = eventPoint(event);
    if (!inPhoto(point) || !recordTrusted(event, event.pointerType || 'mouse')) return;
    state.pointerEnterCount += 1;
    sampleSource(point);
    state.hoverSampleCount += 1;
    state.humanVisualMutationCount += 1;
    updateInterface();
  }

  function pointerMove(event) {
    const point = eventPoint(event);
    if (state.activePointerId !== null) {
      if (event.pointerId !== state.activePointerId || !recordTrusted(event, event.pointerType || 'pointer')) return;
      event.preventDefault();
      setDragOffsets(point.x - state.dragStartPoint.x, point.y - state.dragStartPoint.y);
      sampleSource(point);
      state.dragMutationCount += 1;
      state.humanVisualMutationCount += 1;
      updateInterface();
      return;
    }
    if (!inPhoto(point) || !recordTrusted(event, event.pointerType || 'mouse')) return;
    sampleSource(point);
    state.hoverSampleCount += 1;
    state.humanVisualMutationCount += 1;
    updateInterface();
  }

  function pointerDown(event) {
    const point = eventPoint(event);
    if (!event.isPrimary || event.button !== 0 || !inPhoto(point) || !recordTrusted(event, event.pointerType || 'pointer')) return;
    event.preventDefault();
    state.activePointerId = event.pointerId;
    state.dragStartPoint = point;
    state.dragStartOffsets = cloneOffsets(state.offsets);
    state.pointerCaptureCount += 1;
    canvas.setPointerCapture(event.pointerId);
    state.pointerCaptured = canvas.hasPointerCapture(event.pointerId);
    sampleSource(point);
    updateInterface();
  }

  function pointerEnd(event) {
    if (event.pointerId !== state.activePointerId || !recordTrusted(event, event.pointerType || 'pointer')) return;
    state.activePointerId = null;
    state.dragStartPoint = null;
    state.dragStartOffsets = null;
    state.pointerCaptured = false;
    updateInterface();
  }

  function pointerLeave(event) {
    if (state.activePointerId !== null) return;
    if (!recordTrusted(event, event.pointerType || 'mouse')) return;
    state.probe.active = false;
    state.humanVisualMutationCount += 1;
    updateInterface();
  }

  function keyDown(event) {
    const channelKeys = { 1: 'triad', 2: 'red', 3: 'green', 4: 'blue' };
    if (event.repeat) return;
    if (channelKeys[event.key]) {
      if (!recordTrusted(event, 'keyboard')) return;
      event.preventDefault();
      selectChannel(channelKeys[event.key], 'keyboard');
      return;
    }
    if (event.key === 'Home' || event.key === 'Escape') {
      if (!recordTrusted(event, 'keyboard')) return;
      event.preventDefault();
      alignPlates('keyboard');
      return;
    }
    const movement = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    }[event.key];
    if (!movement || !recordTrusted(event, 'keyboard')) return;
    event.preventDefault();
    nudgeSelected(...movement);
  }

  canvas.addEventListener('pointerenter', pointerEnter);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointerup', pointerEnd);
  canvas.addEventListener('pointercancel', pointerEnd);
  canvas.addEventListener('pointerleave', pointerLeave);
  canvas.addEventListener('keydown', keyDown);

  channelButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (!recordTrusted(event, 'button')) return;
      selectChannel(button.dataset.channel, 'button');
    });
  });
  alignButton.addEventListener('click', event => {
    if (!recordTrusted(event, 'button')) return;
    alignPlates('button');
  });
  spreadRange.addEventListener('input', event => {
    if (!recordTrusted(event, 'range')) return;
    setRangeOffset(event.currentTarget.value);
    state.rangeMutationCount += 1;
    state.humanVisualMutationCount += 1;
    updateInterface();
  });
  state.listenersBound = true;

  const resourcesReady = Promise.all([document.fonts.ready, loadSource(PHOTO_URL), canvasReady])
    .then(async ([, source]) => {
      const evidence = await createPixelEvidence(source.image);
      state.imageDecoded = source.image.complete
        && source.image.naturalWidth === SOURCE_WIDTH
        && source.image.naturalHeight === SOURCE_HEIGHT;
      state.sourceBytes = source.bytes;
      state.sourceSha256 = source.exactSha256;
      state.derivedSha256 = evidence.derivedSha256;
      state.sourcePixelCount = evidence.pixelCount;
      state.analysisSamples = evidence.analysisSamples;
      state.sourceChecksum = evidence.sourceChecksum;
      state.channelChecksums = evidence.channelChecksums;
      state.channelIntegrity = evidence.channelIntegrity;
      state.channelEnergy = evidence.channelEnergy;
      state.edgeMean = evidence.edgeMean;
      state.saturatedRatio = evidence.saturatedRatio;
      state.referenceCounts = evidence.referenceCounts;
      state.detectedReferences = evidence.detectedReferences;
      state.alignmentTolerance = clamp(1.25 + evidence.edgeMean / 28 + evidence.detectedReferences.length * .08, 1.5, 3.5);
      state.penaltySpan = clamp(64 + evidence.edgeMean * .55 + evidence.saturatedRatio * 30, 68, 88);
      state.sourceCanvas = evidence.sourceCanvas;
      state.sourceContext = evidence.sourceContext;
      state.channels = evidence.channels;
      state.ready = true;
      updateInterface();
    })
    .catch(error => {
      markPreviewFailure(error);
      return new Promise(() => {});
    });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await resourcesReady;
    const channelValues = Object.values(state.channelChecksums || {});
    const energies = Object.values(state.channelEnergy || {});
    const sourceEvidence = state.imageDecoded
      && state.sourceBytes === SOURCE_BYTES
      && state.sourceSha256 === SOURCE_SHA256
      && state.sourcePixelCount === SOURCE_WIDTH * SOURCE_HEIGHT
      && state.analysisSamples === (SOURCE_WIDTH / 2) * (SOURCE_HEIGHT / 2)
      && state.sourceChecksum > 0
      && state.derivedSha256.length === 64
      && !/^0+$/.test(state.derivedSha256)
      && state.channelIntegrity
      && channelValues.length === 3
      && channelValues.every(value => value > 0)
      && new Set(channelValues).size === 3
      && energies.length === 3
      && energies.every(value => value > 25 && value < 235)
      && state.edgeMean > 1
      && state.saturatedRatio > .01
      && REFERENCE_CATEGORIES.every(category => state.detectedReferences.includes(category));
    const humanCausality = state.inputCount === state.trustedInputCount
      && state.rejectedUntrustedInputCount === 0
      && (state.humanVisualMutationCount === 0 || state.trustedInputCount > 0)
      && state.automaticFallback === false
      && state.timerMutationCount === 0
      && state.previewClockMutationCount === 0;
    const interactionSurface = state.listenersBound
      && typeof canvas.setPointerCapture === 'function'
      && getComputedStyle(canvas).touchAction === 'none'
      && state.controllers.buttons.length === 5
      && state.controllers.keyboard.length === 10;
    return sketch instanceof p5
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && state.ready
      && state.renders > 0
      && sourceEvidence
      && humanCausality
      && interactionSurface;
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
