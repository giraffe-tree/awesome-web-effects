import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#sort-stage');
  const canvasHost = document.querySelector('#sort-canvas-host');
  const boundaryReadout = document.querySelector('#boundary-readout');
  const modeReadout = document.querySelector('#mode-readout');
  const modeButtons = [...document.querySelectorAll('[data-sort-mode]')];
  const ledger = document.querySelector('#runtime-ledger');
  const assetUrl = new URL('../assets/aesthetic-wave-05/pixel-sort-hover-wipe/relay-station.jpg', import.meta.url).href;
  const expectedAssetSha256 = '91c7edd0dbb343180c435606415ab32ecd39b4a501b8ee6e678ba4b14f351003';
  const processWidth = 480;
  const processHeight = 270;
  const clamp = value => Math.max(0, Math.min(1, value));

  const state = {
    id: 'pixel-sort-hover-wipe',
    task: 'human-operated-real-photo-column-pixel-sort-inspection',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'real-photo-pixels-sorted-within-every-column-by-luma-or-hue',
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    previewClockMutationCount: 0,
    renderIgnoresPreviewClock: true,
    userInputRequired: true,
    initialFrameStatic: true,
    initialBoundary: 0,
    boundary: 0,
    mode: 'luma',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button-control'],
    inputCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    boundaryMutationCount: 0,
    modeMutationCount: 0,
    humanInputCausalityCount: 0,
    rejectedUntrustedInputCount: 0,
    ignoredInputCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    minHumanBoundary: 0,
    maxHumanBoundary: 0,
    maxBoundaryDelta: 0,
    firstHumanInputBoundaryBefore: null,
    firstHumanInputBoundaryAfter: null,
    assetUrl,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetByteLength: 0,
    assetSha256: null,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    p5ImageDecoded: false,
    p5ImageClass: null,
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    cropSourceX: 0,
    cropSourceY: 0,
    cropSourceWidth: 0,
    cropSourceHeight: 0,
    sampledWidth: processWidth,
    sampledHeight: processHeight,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sourcePixelSha256: null,
    distinctSampleColorCount: 0,
    sourceAlphaFailureCount: 0,
    lumaSortedColumnCount: 0,
    hueSortedColumnCount: 0,
    sortedPixelWriteCount: 0,
    lumaMonotonicViolationCount: 0,
    hueMonotonicViolationCount: 0,
    lumaDifferencePixelCount: 0,
    hueDifferencePixelCount: 0,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    renderCount: 0,
    p5DrawCount: 0,
    resizeCount: 0,
    sortedColumnsRendered: 0,
    maxSortedColumnsRendered: 0,
    sortedPixelsRendered: 0,
    renderPixelSource: 'pending',
    assetEvidenceReady: false,
    sortEvidenceReady: false,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let sourceFrame;
  let lumaFrame;
  let hueFrame;
  let dirty = true;
  let resizeFrame = 0;
  let initialFrameSignature = null;
  let initialFrameRepeatSignature = null;

  function invariant(condition, message) {
    if (!condition) throw new Error(`pixel-sort-hover-wipe: ${message}`);
  }

  function digestHex(bytes) {
    return crypto.subtle.digest('SHA-256', bytes).then(buffer => [...new Uint8Array(buffer)]
      .map(value => value.toString(16).padStart(2, '0')).join(''));
  }

  function hueOf(red, green, blue) {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    if (delta === 0) return 0;
    let hue;
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    return (hue * 60 + 360) % 360;
  }

  function lumaOf(red, green, blue) {
    return red * .2126 + green * .7152 + blue * .0722;
  }

  async function fetchAndDecodeAsset() {
    const response = await fetch(assetUrl, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === expectedAssetSha256;
    invariant(state.assetSameOrigin, 'photo was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'photo SHA-256 differs from the committed asset');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const browserImage = new Image();
    browserImage.src = objectUrl;
    try {
      await browserImage.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = browserImage.naturalWidth;
      state.sourceNaturalHeight = browserImage.naturalHeight;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    invariant(state.browserImageDecoded && state.sourceNaturalWidth === 960 && state.sourceNaturalHeight === 640,
      'browser-decoded photo dimensions are not 960x640');
    state.assetEvidenceReady = true;
  }

  const assetReady = fetchAndDecodeAsset();

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(canvasHost);
          p.noLoop();
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
          state.p5CanvasWidth = p.width;
          state.p5CanvasHeight = p.height;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.p5DrawCount += 1;
        p.background('#071015');
        if (!state.sortEvidenceReady || !sourceFrame || !lumaFrame || !hueFrame) return;

        const width = p.width;
        const height = p.height;
        p.image(sourceFrame, 0, 0, width, height);
        const sortedWidth = Math.round(processWidth * state.boundary);
        const displayWidth = width * state.boundary;
        if (sortedWidth > 0 && displayWidth > 0) {
          const activeFrame = state.mode === 'hue' ? hueFrame : lumaFrame;
          p.image(activeFrame, 0, 0, displayWidth, height, 0, 0, sortedWidth, processHeight);
        }

        state.sortedColumnsRendered = sortedWidth;
        state.maxSortedColumnsRendered = Math.max(state.maxSortedColumnsRendered, sortedWidth);
        state.sortedPixelsRendered = sortedWidth * processHeight;
        state.renderPixelSource = state.mode === 'hue' ? 'hue-sorted-real-photo-buffer' : 'luma-sorted-real-photo-buffer';

        const boundaryX = Math.max(.75, Math.min(width - .75, displayWidth));
        const accent = state.mode === 'hue' ? '#72f1e6' : '#ff6840';
        p.push();
        p.stroke(accent);
        p.strokeWeight(Math.max(1, Math.min(2, width / 320 * 1.25)));
        p.line(boundaryX, 0, boundaryX, height);
        p.noStroke();
        p.fill(accent);
        const marker = Math.max(3, Math.min(7, width / 52));
        p.circle(boundaryX, height * .52, marker);
        p.pop();
      };
    }, canvasHost);
  });

  function loadP5Photo() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(assetUrl, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  function makeFrame(pixelBytes) {
    const image = sketch.createImage(processWidth, processHeight);
    image.loadPixels();
    image.pixels.set(pixelBytes);
    image.updatePixels();
    return image;
  }

  function sortColumns(sourcePixels, keyName) {
    const sorted = new Uint8ClampedArray(sourcePixels);
    let violations = 0;
    let differences = 0;
    for (let x = 0; x < processWidth; x += 1) {
      const column = [];
      for (let y = 0; y < processHeight; y += 1) {
        const offset = (y * processWidth + x) * 4;
        const red = sourcePixels[offset];
        const green = sourcePixels[offset + 1];
        const blue = sourcePixels[offset + 2];
        column.push({
          red,
          green,
          blue,
          alpha: sourcePixels[offset + 3],
          key: keyName === 'hue' ? hueOf(red, green, blue) : lumaOf(red, green, blue),
          tie: lumaOf(red, green, blue)
        });
      }
      column.sort((first, second) => first.key - second.key || first.tie - second.tie);
      for (let y = 0; y < processHeight; y += 1) {
        const pixel = column[y];
        const offset = (y * processWidth + x) * 4;
        sorted[offset] = pixel.red;
        sorted[offset + 1] = pixel.green;
        sorted[offset + 2] = pixel.blue;
        sorted[offset + 3] = pixel.alpha;
        if (y > 0 && column[y - 1].key > pixel.key + 1e-7) violations += 1;
        if (pixel.red !== sourcePixels[offset] || pixel.green !== sourcePixels[offset + 1]
          || pixel.blue !== sourcePixels[offset + 2]) differences += 1;
      }
    }
    return { sorted, violations, differences };
  }

  async function preparePixelEvidence() {
    await Promise.all([assetReady, p5Ready]);
    const decoded = await loadP5Photo();
    state.p5ImageDecoded = decoded instanceof p5.Image;
    state.p5ImageClass = decoded instanceof p5.Image ? 'p5.Image' : decoded?.constructor?.name ?? null;
    state.p5ImageWidth = decoded.width;
    state.p5ImageHeight = decoded.height;
    decoded.loadPixels();
    state.p5ImagePixelLength = decoded.pixels.length;
    invariant(state.p5ImageDecoded && decoded.width === 960 && decoded.height === 640 && decoded.pixels.length === 960 * 640 * 4,
      'p5 did not decode the committed 960x640 photograph');

    const cropWidth = 960;
    const cropHeight = 540;
    const cropX = 0;
    const cropY = 50;
    state.cropSourceX = cropX;
    state.cropSourceY = cropY;
    state.cropSourceWidth = cropWidth;
    state.cropSourceHeight = cropHeight;
    sourceFrame = decoded.get(cropX, cropY, cropWidth, cropHeight);
    sourceFrame.resize(processWidth, processHeight);
    sourceFrame.loadPixels();
    const sourcePixels = new Uint8ClampedArray(sourceFrame.pixels);
    state.sampledPixelCount = processWidth * processHeight;
    state.sampledByteLength = sourcePixels.byteLength;
    state.sourcePixelSha256 = await digestHex(sourcePixels.buffer);
    state.sourceAlphaFailureCount = 0;
    const colors = new Set();
    for (let offset = 0; offset < sourcePixels.length; offset += 4) {
      if (sourcePixels[offset + 3] !== 255) state.sourceAlphaFailureCount += 1;
      if (offset % 388 === 0) colors.add(`${sourcePixels[offset] >> 3}:${sourcePixels[offset + 1] >> 3}:${sourcePixels[offset + 2] >> 3}`);
    }
    state.distinctSampleColorCount = colors.size;

    const luma = sortColumns(sourcePixels, 'luma');
    const hue = sortColumns(sourcePixels, 'hue');
    lumaFrame = makeFrame(luma.sorted);
    hueFrame = makeFrame(hue.sorted);
    state.lumaSortedColumnCount = processWidth;
    state.hueSortedColumnCount = processWidth;
    state.sortedPixelWriteCount = processWidth * processHeight * 2;
    state.lumaMonotonicViolationCount = luma.violations;
    state.hueMonotonicViolationCount = hue.violations;
    state.lumaDifferencePixelCount = luma.differences;
    state.hueDifferencePixelCount = hue.differences;
    state.sortEvidenceReady = true;
    dirty = true;
  }

  const pixelEvidenceReady = preparePixelEvidence();

  function inputKind(event, action) {
    if (event instanceof PointerEvent) return `${event.pointerType || 'mouse'}-${action}`;
    if (event instanceof KeyboardEvent) return `keyboard-${event.key}`;
    return `button-${action}`;
  }

  function acceptTrustedInput(event, action) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.lastInputKind = inputKind(event, action);
    state.lastInputTrusted = true;
    if (event instanceof PointerEvent) state.lastPointerType = event.pointerType || 'mouse';
    return true;
  }

  function syncInterface() {
    const percentage = Math.round(state.boundary * 100);
    boundaryReadout.textContent = `${percentage}%`;
    modeReadout.textContent = state.mode === 'hue' ? 'Hue ↑' : 'Luma ↑';
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.sortMode === state.mode)));
    stage.dataset.boundary = state.boundary.toFixed(5);
    stage.dataset.activeSortMode = state.mode;
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    ledger.value = JSON.stringify({
      boundary: state.boundary,
      mode: state.mode,
      inputCount: state.inputCount,
      lastInputKind: state.lastInputKind,
      lastInputTrusted: state.lastInputTrusted,
      pointerDownCount: state.pointerDownCount,
      pointerMoveCount: state.pointerMoveCount,
      pointerReleaseCount: state.pointerReleaseCount,
      pointerCaptureCount: state.pointerCaptureCount,
      pointerReleaseCaptureCount: state.pointerReleaseCaptureCount,
      boundaryMutationCount: state.boundaryMutationCount,
      modeMutationCount: state.modeMutationCount,
      assetSha256: state.assetSha256,
      sourcePixelSha256: state.sourcePixelSha256,
      sampledPixelCount: state.sampledPixelCount,
      lumaSortedColumnCount: state.lumaSortedColumnCount,
      hueSortedColumnCount: state.hueSortedColumnCount,
      sortedColumnsRendered: state.sortedColumnsRendered,
      p5DrawCount: state.p5DrawCount,
      runtimeAssert: stage.dataset.runtimeAssert === 'true'
    });
  }

  function setBoundary(value, event, action) {
    const next = Number(clamp(value).toFixed(5));
    const before = state.boundary;
    if (next === before) {
      state.ignoredInputCount += 1;
      return;
    }
    state.boundary = next;
    state.boundaryMutationCount += 1;
    state.humanInputCausalityCount += 1;
    state.maxBoundaryDelta = Math.max(state.maxBoundaryDelta, Math.abs(next - before));
    state.minHumanBoundary = Math.min(state.minHumanBoundary, next);
    state.maxHumanBoundary = Math.max(state.maxHumanBoundary, next);
    if (state.firstHumanInputBoundaryBefore === null) {
      state.firstHumanInputBoundaryBefore = before;
      state.firstHumanInputBoundaryAfter = next;
    }
    state.lastInputKind = inputKind(event, action);
    dirty = true;
    syncInterface();
  }

  function setMode(mode, event, action) {
    if (!['luma', 'hue'].includes(mode)) return;
    if (state.mode === mode) {
      state.ignoredInputCount += 1;
      return;
    }
    state.mode = mode;
    state.modeMutationCount += 1;
    state.humanInputCausalityCount += 1;
    state.lastInputKind = inputKind(event, action);
    dirty = true;
    syncInterface();
  }

  function boundaryFromPointer(event) {
    const bounds = stage.getBoundingClientRect();
    return clamp((event.clientX - bounds.left) / Math.max(1, bounds.width));
  }

  stage.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || !acceptTrustedInput(event, 'hover')) return;
    state.pointerEnterCount += 1;
    setBoundary(boundaryFromPointer(event), event, 'hover');
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('[data-sort-mode]')) return;
    if (!acceptTrustedInput(event, 'drag-start')) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    setBoundary(boundaryFromPointer(event), event, 'drag-start');
    syncInterface();
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest('[data-sort-mode]')) return;
    const isMouseHover = event.pointerType === 'mouse' && state.activePointerId === null;
    const isActiveDrag = state.activePointerId === event.pointerId;
    if (!isMouseHover && !isActiveDrag) return;
    if (!acceptTrustedInput(event, isActiveDrag ? 'drag-move' : 'hover-move')) return;
    state.pointerMoveCount += 1;
    setBoundary(boundaryFromPointer(event), event, isActiveDrag ? 'drag-move' : 'hover-move');
  });

  function releasePointer(event, action) {
    if (state.activePointerId !== event.pointerId || !acceptTrustedInput(event, action)) return;
    state.pointerReleaseCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.activePointerId = null;
    state.pointerCaptured = false;
    syncInterface();
  }

  stage.addEventListener('pointerup', event => releasePointer(event, 'drag-end'));
  stage.addEventListener('pointercancel', event => releasePointer(event, 'drag-cancel'));

  stage.addEventListener('keydown', event => {
    const handled = ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'm', 'M', '1', '2'].includes(event.key);
    if (!handled || !acceptTrustedInput(event, 'control')) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (event.key === 'ArrowLeft') setBoundary(state.boundary - .05, event, 'step-left');
    else if (event.key === 'ArrowRight') setBoundary(state.boundary + .05, event, 'step-right');
    else if (event.key === 'Home') setBoundary(0, event, 'home');
    else if (event.key === 'End') setBoundary(1, event, 'end');
    else if (event.key === '1') setMode('luma', event, 'mode-luma');
    else if (event.key === '2') setMode('hue', event, 'mode-hue');
    else setMode(state.mode === 'luma' ? 'hue' : 'luma', event, 'mode-toggle');
  });

  modeButtons.forEach(button => button.addEventListener('click', event => {
    if (!acceptTrustedInput(event, button.dataset.sortMode)) return;
    state.buttonActivationCount += 1;
    setMode(button.dataset.sortMode, event, button.dataset.sortMode);
  }));

  function resizeCanvas() {
    if (!sketch || !state.p5InstanceReady) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    if (sketch.width === width && sketch.height === height) return;
    sketch.resizeCanvas(width, height, true);
    state.resizeCount += 1;
    state.p5CanvasWidth = sketch.width;
    state.p5CanvasHeight = sketch.height;
    dirty = true;
  }

  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resizeCanvas);
  }).observe(stage);

  function render() {
    state.renderCount += 1;
    if (!state.sortEvidenceReady || !sketch) return;
    resizeCanvas();
    if (dirty) {
      sketch.redraw();
      dirty = false;
    }
    const signature = `${state.boundary.toFixed(5)}:${state.mode}:${state.sortedColumnsRendered}`;
    if (initialFrameSignature === null && state.inputCount === 0) initialFrameSignature = signature;
    else if (state.inputCount === 0) initialFrameRepeatSignature = signature;
    syncInterface();
  }

  const ready = Promise.all([pixelEvidenceReady, document.fonts.ready]).then(() => {
    state.ready = true;
    syncInterface();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    const canvas = canvasHost.querySelector('canvas');
    const realP5 = sketch instanceof p5
      && state.p5InstanceReady
      && state.p5CanvasReady
      && canvas instanceof HTMLCanvasElement
      && sketch.drawingContext === canvas.getContext('2d')
      && sketch.width === stage.clientWidth
      && sketch.height === stage.clientHeight;
    const honestInteraction = state.task === 'human-operated-real-photo-column-pixel-sort-inspection'
      && state.userInputRequired
      && state.initialFrameStatic
      && state.initialBoundary === 0
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.renderIgnoresPreviewClock
      && state.humanInputCausalityCount === state.boundaryMutationCount + state.modeMutationCount
      && state.pointerReleaseCaptureCount <= state.pointerCaptureCount
      && state.lastInputTrusted !== false;
    const realAsset = state.assetEvidenceReady
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetByteLength > 100000
      && state.assetShaMatchesExpected
      && state.assetSha256 === expectedAssetSha256
      && state.browserImageDecoded
      && state.sourceNaturalWidth === 960
      && state.sourceNaturalHeight === 640
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === 960
      && state.p5ImageHeight === 640
      && state.p5ImagePixelLength === 960 * 640 * 4;
    const realPixelSort = state.sortEvidenceReady
      && state.sampledPixelCount === processWidth * processHeight
      && state.sampledByteLength === processWidth * processHeight * 4
      && /^[a-f0-9]{64}$/.test(state.sourcePixelSha256)
      && state.distinctSampleColorCount > 160
      && state.sourceAlphaFailureCount === 0
      && state.lumaSortedColumnCount === processWidth
      && state.hueSortedColumnCount === processWidth
      && state.sortedPixelWriteCount === processWidth * processHeight * 2
      && state.lumaMonotonicViolationCount === 0
      && state.hueMonotonicViolationCount === 0
      && state.lumaDifferencePixelCount > state.sampledPixelCount * .75
      && state.hueDifferencePixelCount > state.sampledPixelCount * .75
      && state.renderPixelSource.endsWith('sorted-real-photo-buffer')
      && state.sortedColumnsRendered === Math.round(processWidth * state.boundary);
    const staticFirstFrame = initialFrameSignature !== null
      && (initialFrameRepeatSignature === null || initialFrameRepeatSignature === initialFrameSignature);
    const result = Boolean(state.ready
      && realP5
      && honestInteraction
      && realAsset
      && realPixelSort
      && staticFirstFrame
      && window.__PREVIEW_META__?.id === state.id
      && window.__PREVIEW_META__?.library === state.claimedLibrary
      && window.__PREVIEW_META__?.renderer === 'canvas2d'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.dataset.previewMechanism === 'p5-real-photo-column-pixel-sort');
    stage.dataset.runtimeAssert = String(result);
    syncInterface();
    return result;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render: () => render(),
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
