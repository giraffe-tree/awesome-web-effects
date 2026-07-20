import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, smoothstep } from './batch-c-utils.js';

const SOURCE_A_URL = new URL('../assets/aesthetic-wave-02/depth-layer-blur-dissolve/lakeside-retreat-misty-dawn.jpg', import.meta.url).href;
const SOURCE_B_URL = new URL('../assets/aesthetic-wave-02/depth-layer-blur-dissolve/lakeside-retreat-golden-hour.jpg', import.meta.url).href;
const DEPTH_URL = new URL('../assets/aesthetic-wave-02/depth-layer-blur-dissolve/lakeside-retreat-depth-ordinal.svg', import.meta.url).href;
const SOURCE_WIDTH = 1280;
const SOURCE_HEIGHT = 720;
const DEPTH_LEVELS = [32, 96, 160, 224];
const BAND_DEFINITIONS = [
  { id: 'near', start: .04, end: .30, blur: 8, maskIndex: 3 },
  { id: 'middle', start: .22, end: .52, blur: 6, maskIndex: 2 },
  { id: 'far', start: .44, end: .74, blur: 4, maskIndex: 1 },
  { id: 'sky', start: .66, end: .94, blur: 2.5, maskIndex: 0 }
];
const DRAW_ORDER = ['sky', 'far', 'middle', 'near'];

function loadImage(url) {
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  return image.decode().then(() => image);
}

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function bandProgress(progress, band) {
  return smoothstep((progress - band.start) / (band.end - band.start));
}

function drawCover(context, image, width, height) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
    sourceX = (sourceWidth - cropWidth) / 2;
  } else {
    cropHeight = sourceWidth / targetRatio;
    sourceY = (sourceHeight - cropHeight) / 2;
  }
  context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, width, height);
}

try {
  const stage = document.querySelector('#depth-stage');
  const track = document.querySelector('#depth-track');
  const status = document.querySelector('#depth-status');
  const state = {
    automaticPath: false,
    mode: 'idle',
    progress: 0,
    targetProgress: 0,
    activeBand: 'none',
    inputKind: 'none',
    inputCount: 0,
    pointerCaptured: false,
    depthMapVisible: false,
    sourcesReady: false,
    maskReady: false,
    eventTime: 0,
    startProgress: 0,
    bandCoverage: [0, 0, 0, 0]
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sourceA;
  let sourceB;
  let depthImage;
  let bandMasks = [];
  let maskWeightError = 1;
  let maskSamples = [];
  let activePointerId = null;
  let controllerTime = 0;
  let sketch;
  let renderCount = 0;
  let rasterBandDraws = 0;
  let blendCanvas = createCanvas(1, 1);
  let layerCanvas = createCanvas(1, 1);
  let resolveCanvas;
  const canvasReady = new Promise(resolve => { resolveCanvas = resolve; });

  function createBandMasks(image) {
    const depthCanvas = createCanvas(SOURCE_WIDTH, SOURCE_HEIGHT);
    const depthContext = depthCanvas.getContext('2d', { willReadFrequently: true });
    depthContext.drawImage(image, 0, 0, SOURCE_WIDTH, SOURCE_HEIGHT);
    const pixels = depthContext.getImageData(0, 0, SOURCE_WIDTH, SOURCE_HEIGHT).data;
    const maskCanvases = DEPTH_LEVELS.map(() => createCanvas(SOURCE_WIDTH, SOURCE_HEIGHT));
    const maskImages = maskCanvases.map(canvas => canvas.getContext('2d').createImageData(SOURCE_WIDTH, SOURCE_HEIGHT));
    const coverage = [0, 0, 0, 0];
    let maximumError = 0;

    for (let pixel = 0; pixel < SOURCE_WIDTH * SOURCE_HEIGHT; pixel += 1) {
      const offset = pixel * 4;
      const depth = pixels[offset];
      const position = clamp((depth - DEPTH_LEVELS[0]) / 64, 0, 3);
      const lower = Math.min(2, Math.floor(position));
      const fraction = position >= 3 ? 1 : position - lower;
      const weights = [0, 0, 0, 0];
      if (position >= 3) {
        weights[3] = 1;
      } else {
        weights[lower] = 1 - fraction;
        weights[lower + 1] = fraction;
      }
      const sum = weights.reduce((total, value) => total + value, 0);
      maximumError = Math.max(maximumError, Math.abs(1 - sum));
      weights.forEach((weight, index) => {
        coverage[index] += weight;
        const data = maskImages[index].data;
        data[offset] = 255;
        data[offset + 1] = 255;
        data[offset + 2] = 255;
        data[offset + 3] = Math.round(weight * 255);
      });
    }

    maskCanvases.forEach((canvas, index) => canvas.getContext('2d').putImageData(maskImages[index], 0, 0));
    state.bandCoverage = coverage.map(value => value / (SOURCE_WIDTH * SOURCE_HEIGHT));
    maskWeightError = maximumError;
    const samplePoints = [[.5, .08], [.3, .35], [.25, .65], [.75, .9]];
    maskSamples = samplePoints.map(([x, y]) => {
      const offset = (Math.floor(y * SOURCE_HEIGHT) * SOURCE_WIDTH + Math.floor(x * SOURCE_WIDTH)) * 4;
      return DEPTH_LEVELS.reduce((closest, level, index) => (
        Math.abs(pixels[offset] - level) < Math.abs(pixels[offset] - DEPTH_LEVELS[closest]) ? index : closest
      ), 0);
    });
    return maskCanvases;
  }

  const assetsReady = Promise.all([
    loadImage(SOURCE_A_URL),
    loadImage(SOURCE_B_URL),
    loadImage(DEPTH_URL)
  ]).then(([misty, golden, depth]) => {
    sourceA = misty;
    sourceB = golden;
    depthImage = depth;
    bandMasks = createBandMasks(depthImage);
    state.sourcesReady = true;
    state.maskReady = true;
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  function ensureScratchSize(width, height) {
    if (blendCanvas.width === width && blendCanvas.height === height) return;
    blendCanvas = createCanvas(width, height);
    layerCanvas = createCanvas(width, height);
  }

  function activeBandFor(progress) {
    let winner = 'none';
    let highest = .04;
    for (const band of BAND_DEFINITIONS) {
      const score = Math.sin(bandProgress(progress, band) * Math.PI);
      if (score > highest) {
        highest = score;
        winner = band.id;
      }
    }
    return winner;
  }

  function updateUi() {
    state.activeBand = state.depthMapVisible ? 'none' : activeBandFor(state.progress);
    stage.dataset.activeBand = state.activeBand;
    stage.dataset.depthPeek = String(state.depthMapVisible);
    track.style.setProperty('--depth-progress', state.progress.toFixed(4));
    if (state.depthMapVisible) {
      status.textContent = 'Depth map / Space to return';
    } else if (state.activeBand !== 'none') {
      status.textContent = `${state.activeBand} / dissolving`;
    } else if (state.progress <= .001) {
      status.textContent = 'Misty dawn / ready';
    } else if (state.progress >= .999) {
      status.textContent = 'Golden hour / ready';
    } else {
      status.textContent = 'Depth handoff / ready';
    }
  }

  function renderScene(p) {
    const width = p.width;
    const height = p.height;
    const context = p.drawingContext;
    context.fillStyle = '#101a1b';
    context.fillRect(0, 0, width, height);
    if (!state.sourcesReady || !state.maskReady) return;

    if (state.depthMapVisible) {
      context.save();
      context.globalCompositeOperation = 'source-over';
      context.filter = 'none';
      drawCover(context, depthImage, width, height);
      context.restore();
      return;
    }

    ensureScratchSize(width, height);
    const blendContext = blendCanvas.getContext('2d');
    const layerContext = layerCanvas.getContext('2d');
    context.save();
    context.globalCompositeOperation = 'lighter';

    for (const id of DRAW_ORDER) {
      const band = BAND_DEFINITIONS.find(candidate => candidate.id === id);
      const local = bandProgress(state.progress, band);
      const blur = Math.sin(local * Math.PI) * band.blur * (width / 320);

      blendContext.clearRect(0, 0, width, height);
      blendContext.globalAlpha = 1;
      blendContext.globalCompositeOperation = 'source-over';
      drawCover(blendContext, sourceA, width, height);
      blendContext.globalAlpha = local;
      drawCover(blendContext, sourceB, width, height);
      blendContext.globalAlpha = 1;

      layerContext.clearRect(0, 0, width, height);
      layerContext.globalCompositeOperation = 'source-over';
      layerContext.filter = `blur(${blur.toFixed(2)}px)`;
      layerContext.drawImage(blendCanvas, 0, 0);
      layerContext.filter = 'none';
      layerContext.globalCompositeOperation = 'destination-in';
      drawCover(layerContext, bandMasks[band.maskIndex], width, height);
      layerContext.globalCompositeOperation = 'source-over';

      context.drawImage(layerCanvas, 0, 0);
      rasterBandDraws += 1;
    }
    context.restore();
  }

  function settleTo(value, inputKind) {
    state.startProgress = state.progress;
    state.targetProgress = clamp(value, 0, 1);
    state.eventTime = controllerTime;
    state.inputKind = inputKind;
    state.inputCount += 1;
    state.mode = 'settling';
  }

  function progressFromPointer(event) {
    const bounds = stage.getBoundingClientRect();
    state.progress = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    state.targetProgress = state.progress;
    state.startProgress = state.progress;
    state.inputKind = event.pointerType || 'pointer';
    state.inputCount += 1;
    state.mode = 'dragging';
  }

  function endPointer(event) {
    if (activePointerId !== null && stage.hasPointerCapture?.(activePointerId)) {
      stage.releasePointerCapture(activePointerId);
    }
    if (event?.pointerId === activePointerId || !event) activePointerId = null;
    state.pointerCaptured = false;
    if (!state.depthMapVisible) state.mode = 'idle';
  }

  stage.addEventListener('pointerdown', event => {
    event.preventDefault();
    stage.focus({ preventScroll: true });
    activePointerId = event.pointerId;
    stage.setPointerCapture?.(event.pointerId);
    state.pointerCaptured = true;
    progressFromPointer(event);
  });
  stage.addEventListener('pointermove', event => {
    if (!state.pointerCaptured || event.pointerId !== activePointerId) return;
    event.preventDefault();
    progressFromPointer(event);
  });
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('lostpointercapture', event => {
    if (event.pointerId === activePointerId) endPointer(event);
  });
  stage.addEventListener('keydown', event => {
    if (event.code === 'Space') {
      event.preventDefault();
      if (event.repeat) return;
      state.depthMapVisible = true;
      state.mode = 'depth-peek';
      state.inputKind = 'keyboard';
      state.inputCount += 1;
      return;
    }
    const movement = {
      ArrowLeft: -.04,
      ArrowRight: .04,
      Home: -1,
      End: 1
    }[event.key];
    if (movement === undefined && event.key !== 'Escape') return;
    event.preventDefault();
    if (event.key === 'Escape') {
      state.depthMapVisible = false;
      endPointer();
      settleTo(0, 'keyboard');
    } else if (event.key === 'Home') {
      settleTo(0, 'keyboard');
    } else if (event.key === 'End') {
      settleTo(1, 'keyboard');
    } else {
      settleTo(state.targetProgress + movement, 'keyboard');
    }
  });
  stage.addEventListener('keyup', event => {
    if (event.code !== 'Space') return;
    event.preventDefault();
    state.depthMapVisible = false;
    state.mode = 'idle';
  });
  stage.addEventListener('blur', () => {
    state.depthMapVisible = false;
    endPointer();
  });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(stage);
      p.noLoop();
      resolveCanvas();
    };
    p.draw = () => {
      renderCount += 1;
      renderScene(p);
      updateUi();
    };
  }, stage);

  const endpointTruth = BAND_DEFINITIONS.every(band => bandProgress(0, band) === 0 && bandProgress(1, band) === 1);
  const staggerTruth = bandProgress(.38, BAND_DEFINITIONS[0]) - bandProgress(.38, BAND_DEFINITIONS[2]) > .25
    && bandProgress(.60, BAND_DEFINITIONS[1]) - bandProgress(.60, BAND_DEFINITIONS[3]) > .25;

  window.__PREVIEW_RUNTIME_ASSERT__ = () =>
    sketch instanceof p5
    && sourceA?.naturalWidth === SOURCE_WIDTH
    && sourceA?.naturalHeight === SOURCE_HEIGHT
    && sourceB?.naturalWidth === SOURCE_WIDTH
    && sourceB?.naturalHeight === SOURCE_HEIGHT
    && depthImage?.naturalWidth === SOURCE_WIDTH
    && depthImage?.naturalHeight === SOURCE_HEIGHT
    && state.sourcesReady
    && state.maskReady
    && bandMasks.length === 4
    && bandMasks.every(mask => mask.width === SOURCE_WIDTH && mask.height === SOURCE_HEIGHT)
    && state.bandCoverage.every(value => value > .05)
    && maskWeightError < .0001
    && maskSamples.join(',') === '0,1,2,3'
    && endpointTruth
    && staggerTruth
    && state.automaticPath === false
    && ['idle', 'dragging', 'settling', 'depth-peek'].includes(state.mode)
    && state.progress >= 0
    && state.progress <= 1
    && state.targetProgress >= 0
    && state.targetProgress <= 1
    && Number.isInteger(state.inputCount)
    && typeof window.__PREVIEW_INTERACTION_STATE__ === 'object'
    && stage.tabIndex === 0
    && Boolean(stage.querySelector('canvas')?.getContext('2d'))
    && renderCount > 0
    && rasterBandDraws >= 4;

  installPreviewController({
    id: 'depth-layer-blur-dissolve',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: time => {
      controllerTime = Number(time) || 0;
      if (state.mode === 'settling') {
        const local = smoothstep((controllerTime - state.eventTime) / .22);
        state.progress = state.startProgress + (state.targetProgress - state.startProgress) * local;
        if (local >= 1) {
          state.progress = state.targetProgress;
          state.mode = 'idle';
        }
      }
      if (sketch.width !== innerWidth || sketch.height !== innerHeight) sketch.resizeCanvas(innerWidth, innerHeight, false);
      sketch.redraw();
    },
    ready: Promise.all([canvasReady, assetsReady, document.fonts.ready])
  });
} catch (error) {
  markPreviewFailure(error);
}
