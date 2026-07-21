import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_DEFINITIONS = [
  {
    id: 'tidal-plate',
    label: 'Tidal plate',
    src: new URL('../assets/aesthetic-wave-01/velocity-spaced-image-trail/tidal-plate.jpg', import.meta.url).href,
  },
  {
    id: 'dune-marker',
    label: 'Dune marker',
    src: new URL('../assets/aesthetic-wave-01/velocity-spaced-image-trail/dune-marker.jpg', import.meta.url).href,
  },
  {
    id: 'signal-cloth',
    label: 'Signal cloth',
    src: new URL('../assets/aesthetic-wave-01/velocity-spaced-image-trail/signal-cloth.jpg', import.meta.url).href,
  },
  {
    id: 'fog-pavilion',
    label: 'Fog pavilion',
    src: new URL('../assets/aesthetic-wave-01/velocity-spaced-image-trail/fog-pavilion.jpg', import.meta.url).href,
  },
];

const MAX_TRAIL_ITEMS = 10;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

try {
  const stage = document.querySelector('#trail-stage');
  const host = document.querySelector('#trail-host');
  const speedOutput = document.querySelector('#speed-output');
  const gapOutput = document.querySelector('#gap-output');
  const keptOutput = document.querySelector('#kept-output');
  const interactionNote = document.querySelector('#interaction-note');
  const runtimeLedger = document.querySelector('#runtime-ledger');
  const resetControl = document.querySelector('#reset-control');
  const frameControls = [...document.querySelectorAll('[data-frame]')];
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'velocity-spaced-image-trail',
    task: 'human-paced-visual-memory-and-frame-inspection',
    mechanism: 'distance-accumulation-with-speed-mapped-spawn-gap',
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'control'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticPath: false,
    automaticPlayback: false,
    automaticFallback: false,
    previewClockDriven: false,
    previewClockMutation: false,
    syntheticInputDispatch: false,
    initialTrailItems: 0,
    initialStillVerified: false,
    reducedMotion: reducedMotionQuery.matches,
    selectedAssetIndex: 0,
    nextAssetIndex: 0,
    latestSpeed: 0,
    smoothedSpeed: 0,
    currentSpawnGap: 18,
    distanceSinceSpawn: 0,
    totalDistance: 0,
    trailItemCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerMoveCount: 0,
    keyboardMoveCount: 0,
    selectionCount: 0,
    resetCount: 0,
    speedSampleCount: 0,
    spawnCount: 0,
    assetDecodeCount: 0,
    assetDecodeFailureCount: 0,
    assetChecksums: [],
    assetChecksumsUnique: false,
    sampledPixelCount: 0,
    drawCount: 0,
    redrawRequestCount: 0,
    resizeCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    lastRejectedSource: 'none',
    pointerCaptured: false,
    activePointerId: null,
    activePointerType: 'none',
    speedSamples: [],
    spawnRecords: [],
    decodedAssets: [],
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  async function decodeAsset(definition) {
    const image = new Image();
    image.decoding = 'async';
    image.alt = '';
    image.src = definition.src;
    try {
      await image.decode();
      if (!image.complete || image.naturalWidth !== 960 || image.naturalHeight !== 640) {
        throw new Error(`Unexpected image dimensions for ${definition.id}`);
      }
      const sample = document.createElement('canvas');
      sample.width = 48;
      sample.height = 32;
      const sampleContext = sample.getContext('2d', { willReadFrequently: true });
      sampleContext.drawImage(image, 0, 0, sample.width, sample.height);
      const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
      let checksum = 2166136261;
      for (const channel of pixels) {
        checksum ^= channel;
        checksum = Math.imul(checksum, 16777619) >>> 0;
      }
      state.assetDecodeCount += 1;
      state.assetChecksums.push(checksum);
      state.sampledPixelCount += pixels.length;
      state.decodedAssets.push({
        id: definition.id,
        width: image.naturalWidth,
        height: image.naturalHeight,
        decoded: true,
      });
      return { ...definition, image };
    } catch (error) {
      state.assetDecodeFailureCount += 1;
      throw new Error(`Failed to decode required trail asset ${definition.id}: ${error.message}`);
    }
  }

  const assets = await Promise.all(ASSET_DEFINITIONS.map(decodeAsset));
  state.assetChecksumsUnique = new Set(state.assetChecksums).size === ASSET_DEFINITIONS.length;
  const trailItems = [];
  let sketch;
  let resolveFirstDraw;
  let pointerSample = null;
  let keyboardCursor = null;
  let keyboardTimestamp = 0;
  const firstDrawReady = new Promise(resolve => { resolveFirstDraw = resolve; });

  function rejectUntrusted(event, source) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedCount += 1;
    state.lastRejectedSource = source;
    state.lastInputTrusted = false;
    return true;
  }

  function recordTrustedInput(event, kind, source) {
    if (rejectUntrusted(event, source)) return false;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else if (kind === 'control') state.controlInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (kind === 'touch') state.touchInputCount += 1;
      if (kind === 'pen') state.penInputCount += 1;
    }
    return true;
  }

  function speedGap(speed) {
    const minimumDimension = Math.max(1, Math.min(host.clientWidth, host.clientHeight));
    const minimumGap = clamp(minimumDimension * .07, 8, 18);
    const maximumGap = clamp(minimumDimension * .28, 22, 70);
    const velocityMix = clamp(speed / 1400, 0, 1);
    return minimumGap + (maximumGap - minimumGap) * velocityMix;
  }

  function syncLedgerAttributes() {
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedCount = String(state.rejectedUntrustedCount);
    stage.dataset.speedSampleCount = String(state.speedSampleCount);
    stage.dataset.spawnCount = String(state.spawnCount);
    stage.dataset.assetDecodeCount = String(state.assetDecodeCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerReleaseCount = String(state.pointerReleaseCount);
    stage.dataset.keyboardMoveCount = String(state.keyboardMoveCount);
    stage.dataset.resetCount = String(state.resetCount);
    stage.dataset.strictTrustedInputGuard = String(state.strictTrustedInputGuard);
    stage.dataset.automaticPath = String(state.automaticPath);
    stage.dataset.previewClockMutation = String(state.previewClockMutation);
    if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
      stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__());
    }
    runtimeLedger.textContent = [
      `runtime ${stage.dataset.runtimeAssert || 'pending'}`,
      `trusted inputs ${state.trustedInputCount}`,
      `rejected untrusted ${state.rejectedUntrustedCount}`,
      `speed samples ${state.speedSampleCount}`,
      `spawns ${state.spawnCount}`,
      `assets decoded ${state.assetDecodeCount}`,
      `captures ${state.pointerCaptureCount}`,
      `releases ${state.pointerReleaseCount}`,
      `keyboard moves ${state.keyboardMoveCount}`,
      `resets ${state.resetCount}`,
      `automatic path ${state.automaticPath}`,
      `preview clock mutation ${state.previewClockMutation}`,
    ].join('; ');
  }

  function updateReadout() {
    speedOutput.textContent = `${String(Math.round(state.smoothedSpeed)).padStart(3, '0')} px/s`;
    gapOutput.textContent = `${Math.round(state.currentSpawnGap)} px`;
    keptOutput.textContent = `${String(trailItems.length).padStart(2, '0')} / ${MAX_TRAIL_ITEMS}`;
    state.trailItemCount = trailItems.length;
    stage.dataset.hasTrail = String(trailItems.length > 0);
    syncLedgerAttributes();
  }

  function requestRedraw(reason) {
    state.redrawRequestCount += 1;
    state.lastRedrawReason = reason;
    sketch?.redraw();
  }

  function localPoint(event) {
    const bounds = host.getBoundingClientRect();
    return {
      x: clamp(event.clientX - bounds.left, 0, bounds.width),
      y: clamp(event.clientY - bounds.top, 0, bounds.height),
    };
  }

  function spawnFrame(x, y, angle, source, speed, gap) {
    const assetIndex = state.nextAssetIndex;
    trailItems.push({
      x,
      y,
      angle: reducedMotionQuery.matches ? 0 : clamp(angle, -.14, .14),
      assetIndex,
      serial: state.spawnCount + 1,
      speed,
      gap,
    });
    if (trailItems.length > MAX_TRAIL_ITEMS) trailItems.shift();
    state.nextAssetIndex = (assetIndex + 1) % assets.length;
    state.spawnCount += 1;
    state.spawnRecords.push({
      serial: state.spawnCount,
      source,
      assetId: assets[assetIndex].id,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      speed: Number(speed.toFixed(2)),
      spawnDistance: Number(gap.toFixed(2)),
      cumulativeDistance: Number(state.totalDistance.toFixed(2)),
    });
    if (state.spawnRecords.length > 24) state.spawnRecords.shift();
  }

  function sampleMotion(previous, next, eventTimestamp, source, pointerType) {
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const distance = Math.hypot(dx, dy);
    if (distance < .25) return;

    const elapsed = clamp(eventTimestamp - previous.timestamp, 8, 220);
    const speed = clamp(distance / elapsed * 1000, 0, 2200);
    state.latestSpeed = speed;
    state.smoothedSpeed = state.speedSampleCount
      ? state.smoothedSpeed * .42 + speed * .58
      : speed;
    state.currentSpawnGap = speedGap(state.smoothedSpeed);
    state.speedSampleCount += 1;
    state.totalDistance += distance;
    state.speedSamples.push({
      source,
      pointerType,
      distance: Number(distance.toFixed(2)),
      elapsed: Number(elapsed.toFixed(2)),
      speed: Number(speed.toFixed(2)),
      smoothedSpeed: Number(state.smoothedSpeed.toFixed(2)),
      spawnGap: Number(state.currentSpawnGap.toFixed(2)),
    });
    if (state.speedSamples.length > 24) state.speedSamples.shift();

    let walked = 0;
    let remaining = distance;
    while (state.distanceSinceSpawn + remaining >= state.currentSpawnGap) {
      const needed = state.currentSpawnGap - state.distanceSinceSpawn;
      walked += needed;
      const ratio = clamp(walked / distance, 0, 1);
      const positionX = previous.x + dx * ratio;
      const positionY = previous.y + dy * ratio;
      spawnFrame(positionX, positionY, Math.atan2(dy, dx) * .12, source, state.smoothedSpeed, state.currentSpawnGap);
      remaining = Math.max(0, distance - walked);
      state.distanceSinceSpawn = 0;
    }
    state.distanceSinceSpawn += remaining;
    updateReadout();
    requestRedraw(`trusted-${source}-motion`);
  }

  function beginPointer(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const kind = event.pointerType || 'mouse';
    if (!recordTrustedInput(event, kind, `pointer-${kind}-down`)) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    state.activePointerId = event.pointerId;
    state.activePointerType = kind;
    state.distanceSinceSpawn = 0;
    pointerSample = { ...localPoint(event), timestamp: event.timeStamp };
    try {
      host.setPointerCapture(event.pointerId);
      state.pointerCaptured = host.hasPointerCapture(event.pointerId);
      if (state.pointerCaptured) state.pointerCaptureCount += 1;
    } catch {
      state.pointerCaptured = false;
    }
    interactionNote.textContent = 'TRACING · speed sets the gap';
    syncLedgerAttributes();
    requestRedraw('trusted-pointer-down');
  }

  function movePointer(event) {
    if (event.pointerId !== state.activePointerId || !pointerSample) return;
    const kind = event.pointerType || state.activePointerType || 'mouse';
    if (!recordTrustedInput(event, kind, `pointer-${kind}-move`)) return;
    event.preventDefault();
    const next = { ...localPoint(event), timestamp: event.timeStamp };
    sampleMotion(pointerSample, next, event.timeStamp, 'pointer', kind);
    pointerSample = next;
    state.pointerMoveCount += 1;
  }

  function finishPointer(event, cancelled = false) {
    if (event.pointerId !== state.activePointerId) return;
    const kind = event.pointerType || state.activePointerType || 'mouse';
    const source = cancelled ? `pointer-${kind}-cancel` : `pointer-${kind}-up`;
    if (!recordTrustedInput(event, kind, source)) return;
    if (!cancelled && pointerSample) {
      const next = { ...localPoint(event), timestamp: event.timeStamp };
      sampleMotion(pointerSample, next, event.timeStamp, 'pointer', kind);
      pointerSample = next;
    }
    if (state.pointerCaptured) {
      try {
        if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
      } catch {
        // A browser can release capture just before pointerup; the ledger still records the owned release path.
      }
      state.pointerReleaseCount += 1;
    }
    if (cancelled) state.pointerCancelCount += 1;
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.activePointerType = 'none';
    pointerSample = null;
    interactionNote.textContent = trailItems.length
      ? 'SCAN AGAIN · fast = wider spacing'
      : 'PRESS + TRACE · arrows also work';
    syncLedgerAttributes();
    requestRedraw(cancelled ? 'trusted-pointer-cancel' : 'trusted-pointer-up');
  }

  function resetTrail(event, kind, source) {
    if (!recordTrustedInput(event, kind, source)) return;
    trailItems.length = 0;
    pointerSample = null;
    keyboardCursor = null;
    keyboardTimestamp = 0;
    state.activePointerId = null;
    state.activePointerType = 'none';
    state.pointerCaptured = false;
    state.latestSpeed = 0;
    state.smoothedSpeed = 0;
    state.currentSpawnGap = speedGap(0);
    state.distanceSinceSpawn = 0;
    state.nextAssetIndex = state.selectedAssetIndex;
    state.resetCount += 1;
    interactionNote.textContent = 'RESET · press + trace when ready';
    updateReadout();
    requestRedraw('trusted-reset');
  }

  function keyboardMove(event) {
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return false;
    if (!recordTrustedInput(event, 'keyboard', `keyboard-${event.key}`)) return true;
    event.preventDefault();
    const minimumDimension = Math.max(1, Math.min(host.clientWidth, host.clientHeight));
    const step = event.shiftKey
      ? clamp(minimumDimension * .22, 18, 68)
      : clamp(minimumDimension * .095, 9, 32);
    const previous = keyboardCursor || {
      x: host.clientWidth * .56,
      y: host.clientHeight * .56,
      timestamp: event.timeStamp - 92,
    };
    const next = {
      x: clamp(previous.x + direction[0] * step, 5, Math.max(5, host.clientWidth - 5)),
      y: clamp(previous.y + direction[1] * step, 5, Math.max(5, host.clientHeight - 5)),
      timestamp: event.timeStamp,
    };
    const timestamp = keyboardTimestamp
      ? Math.max(event.timeStamp, keyboardTimestamp + 8)
      : event.timeStamp;
    next.timestamp = timestamp;
    sampleMotion(previous, next, timestamp, 'keyboard', 'keyboard');
    keyboardCursor = next;
    keyboardTimestamp = timestamp;
    state.keyboardMoveCount += 1;
    interactionNote.textContent = 'KEYBOARD TRACE · Shift = longer step';
    syncLedgerAttributes();
    return true;
  }

  host.addEventListener('pointerdown', beginPointer);
  host.addEventListener('pointermove', movePointer);
  host.addEventListener('pointerup', event => finishPointer(event, false));
  host.addEventListener('pointercancel', event => finishPointer(event, true));
  host.addEventListener('keydown', event => {
    if (keyboardMove(event)) return;
    if (event.key.toLowerCase() !== 'r') return;
    event.preventDefault();
    resetTrail(event, 'keyboard', `keyboard-${event.key}`);
  });

  resetControl.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'control';
    resetTrail(event, kind, 'reset-control');
  });

  frameControls.forEach(control => {
    control.addEventListener('click', event => {
      const kind = event.detail === 0 ? 'keyboard' : 'control';
      if (!recordTrustedInput(event, kind, `select-frame-${control.dataset.frame}`)) return;
      const assetIndex = Number(control.dataset.frame);
      state.selectedAssetIndex = assetIndex;
      state.nextAssetIndex = assetIndex;
      state.selectionCount += 1;
      frameControls.forEach(button => {
        button.setAttribute('aria-pressed', String(button === control));
      });
      interactionNote.textContent = `${assets[assetIndex].label.toUpperCase()} · sequence starts here`;
      requestRedraw('trusted-frame-selection');
    });
  });

  function drawImageCover(context, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) * .5;
    const sourceY = (image.naturalHeight - sourceHeight) * .5;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  function roundedClip(context, x, y, width, height, radius) {
    context.beginPath();
    if (typeof context.roundRect === 'function') context.roundRect(x, y, width, height, radius);
    else context.rect(x, y, width, height);
    context.clip();
  }

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      const renderer = p.createCanvas(
        Math.max(1, Math.round(host.clientWidth)),
        Math.max(1, Math.round(host.clientHeight)),
      );
      renderer.parent(host);
      renderer.elt.setAttribute('aria-hidden', 'true');
      p.noLoop();
      p.textFont('ui-monospace, SFMono-Regular, monospace');
      state.currentSpawnGap = speedGap(0);
      updateReadout();
    };

    p.draw = () => {
      state.drawCount += 1;
      const context = p.drawingContext;
      const width = p.width;
      const height = p.height;
      const panelWidth = clamp(width * .32, 58, 226);
      const cardWidth = clamp(Math.min(width, height) * .31, 38, 104);
      const cardHeight = cardWidth * .72;
      const activeImage = assets[state.selectedAssetIndex].image;

      context.save();
      drawImageCover(context, activeImage, 0, 0, width, height);
      context.restore();

      p.noStroke();
      p.fill(16, 21, 18, 34);
      p.rect(panelWidth, 0, width - panelWidth, height);
      p.fill('#e7e3d8');
      p.rect(0, 0, panelWidth, height);
      p.fill('#d2cec3');
      p.rect(panelWidth - 1, 0, 1, height);

      p.stroke(255, 255, 255, 126);
      p.strokeWeight(1);
      p.line(panelWidth + (width - panelWidth) * .5, 0, panelWidth + (width - panelWidth) * .5, height);
      p.line(panelWidth, height * .5, width, height * .5);
      p.noStroke();

      if (!trailItems.length) {
        const guideX = panelWidth + (width - panelWidth) * .56;
        const guideY = height * .58;
        const guideRadius = clamp(Math.min(width, height) * .07, 6, 23);
        p.noFill();
        p.stroke(255, 255, 255, 205);
        p.strokeWeight(1);
        p.circle(guideX, guideY, guideRadius * 2);
        p.line(guideX - guideRadius * 1.35, guideY, guideX + guideRadius * 1.35, guideY);
        p.line(guideX, guideY - guideRadius * 1.35, guideX, guideY + guideRadius * 1.35);
        p.noStroke();
        p.fill(255, 255, 255, 220);
        p.textAlign(p.CENTER, p.TOP);
        p.textStyle(p.BOLD);
        p.textSize(clamp(height * .025, 4, 8));
        p.text('START A TRACE', guideX, guideY + guideRadius * 1.55);
      }

      trailItems.forEach((item, itemIndex) => {
        const asset = assets[item.assetIndex];
        const x = clamp(item.x, cardWidth * .52, width - cardWidth * .52);
        const y = clamp(item.y, cardHeight * .62, height - cardHeight * .62);
        const rotation = reducedMotionQuery.matches ? 0 : item.angle + (itemIndex % 2 ? .015 : -.015);
        context.save();
        context.translate(x, y);
        context.rotate(rotation);
        context.shadowColor = 'rgba(8, 13, 10, .25)';
        context.shadowBlur = cardWidth * .16;
        context.shadowOffsetY = cardWidth * .06;
        context.fillStyle = '#f4f1e8';
        context.fillRect(-cardWidth / 2 - 3, -cardHeight / 2 - 3, cardWidth + 6, cardHeight + 10);
        context.shadowColor = 'transparent';
        context.save();
        roundedClip(context, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, Math.max(1, cardWidth * .025));
        drawImageCover(context, asset.image, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
        context.restore();
        context.fillStyle = '#111510';
        context.font = `800 ${clamp(cardWidth * .065, 4, 7)}px ui-monospace, SFMono-Regular, monospace`;
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.fillText(String(item.assetIndex + 1).padStart(2, '0'), -cardWidth / 2, cardHeight / 2 + 5);
        context.textAlign = 'right';
        context.fillStyle = '#62685e';
        context.fillText(`${Math.round(item.gap)}PX`, cardWidth / 2, cardHeight / 2 + 5);
        context.restore();
      });

      const cursor = pointerSample || keyboardCursor;
      if (cursor) {
        p.noFill();
        p.stroke('#ff5a36');
        p.strokeWeight(1.5);
        p.circle(cursor.x, cursor.y, clamp(Math.min(width, height) * .035, 5, 14));
        p.noStroke();
        p.fill('#ff5a36');
        p.circle(cursor.x, cursor.y, 2.5);
      }

      if (state.drawCount === 1) {
        state.initialStillVerified = (
          trailItems.length === 0
          && state.spawnCount === 0
          && state.inputCount === 0
          && pointerSample === null
          && keyboardCursor === null
        );
        syncLedgerAttributes();
        resolveFirstDraw();
      }
    };
  }, host);

  const resizeObserver = new ResizeObserver(entries => {
    const entry = entries[0];
    if (!sketch || !entry) return;
    const width = Math.max(1, Math.round(entry.contentRect.width));
    const height = Math.max(1, Math.round(entry.contentRect.height));
    if (width === sketch.width && height === sketch.height) return;
    state.resizeCount += 1;
    sketch.resizeCanvas(width, height, false);
    state.currentSpawnGap = speedGap(state.smoothedSpeed);
    updateReadout();
    requestRedraw('resize');
  });
  resizeObserver.observe(host);

  reducedMotionQuery.addEventListener?.('change', () => {
    state.reducedMotion = reducedMotionQuery.matches;
    requestRedraw('reduced-motion-change');
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = host.querySelector('canvas');
    const assetsValid = (
      assets.length === 4
      && state.assetDecodeCount === 4
      && state.assetDecodeFailureCount === 0
      && state.assetChecksums.length === 4
      && state.assetChecksums.every(checksum => Number.isInteger(checksum) && checksum > 0)
      && state.assetChecksumsUnique === true
      && state.sampledPixelCount === 24576
      && state.decodedAssets.every(asset => asset.decoded && asset.width === 960 && asset.height === 640)
    );
    const samplesValid = state.speedSamples.every(sample => (
      Number.isFinite(sample.distance)
      && sample.distance > 0
      && Number.isFinite(sample.speed)
      && sample.speed >= 0
      && Number.isFinite(sample.spawnGap)
      && sample.spawnGap >= 8
    ));
    const spawnsValid = state.spawnRecords.every(record => (
      Number.isFinite(record.x)
      && Number.isFinite(record.y)
      && Number.isFinite(record.speed)
      && Number.isFinite(record.spawnDistance)
      && record.spawnDistance >= 8
      && ASSET_DEFINITIONS.some(asset => asset.id === record.assetId)
      && ['pointer', 'keyboard'].includes(record.source)
    ));
    const trailValid = trailItems.every(item => (
      Number.isFinite(item.x)
      && Number.isFinite(item.y)
      && Number.isFinite(item.gap)
      && item.assetIndex >= 0
      && item.assetIndex < assets.length
    ));
    return (
      sketch instanceof p5
      && Boolean(canvas?.getContext('2d'))
      && stage.dataset.previewMechanism === 'p5-velocity-spaced-editorial-image-trail'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && state.task === 'human-paced-visual-memory-and-frame-inspection'
      && state.mechanism === 'distance-accumulation-with-speed-mapped-spawn-gap'
      && state.acceptedInputs.join('|') === 'mouse|touch|pen|keyboard|control'
      && state.userInputRequired === true
      && state.strictTrustedInputGuard === true
      && state.automaticPath === false
      && state.automaticPlayback === false
      && state.automaticFallback === false
      && state.previewClockDriven === false
      && state.previewClockMutation === false
      && state.syntheticInputDispatch === false
      && state.initialTrailItems === 0
      && state.initialStillVerified === true
      && state.inputCount === state.trustedInputCount
      && state.touchInputCount + state.penInputCount <= state.pointerInputCount
      && state.pointerReleaseCount <= state.pointerCaptureCount
      && state.pointerCaptured === (state.activePointerId !== null && state.pointerCaptureCount > state.pointerReleaseCount)
      && state.speedSampleCount >= state.speedSamples.length
      && state.spawnCount >= state.spawnRecords.length
      && state.trailItemCount === trailItems.length
      && trailItems.length <= MAX_TRAIL_ITEMS
      && assetsValid
      && samplesValid
      && spawnsValid
      && trailValid
      && state.drawCount > 0
    );
  };
  syncLedgerAttributes();

  installPreviewController({
    id: 'velocity-spaced-image-trail',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {},
    ready: Promise.all([document.fonts.ready, firstDrawReady]),
  });
} catch (error) {
  markPreviewFailure(error);
}
