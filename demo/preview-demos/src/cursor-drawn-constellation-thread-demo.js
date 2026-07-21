import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#constellation-stage');
  const canvasHost = document.querySelector('#plate-canvas-host');
  const missionStatus = document.querySelector('#mission-status');
  const routeReadout = document.querySelector('#route-readout');
  const targetCode = document.querySelector('#target-code');
  const targetEvidence = document.querySelector('#target-evidence');
  const routeStrip = document.querySelector('#route-strip');
  const actionButtons = [...document.querySelectorAll('[data-constellation-action]')];
  const confirmButton = document.querySelector('[data-constellation-action="confirm"]');
  const assetUrl = new URL('../assets/aesthetic-wave-07/cursor-drawn-constellation-thread/north-atlantic-observation-plate.jpg', import.meta.url).href;

  const expectedAssetSha256 = 'f4b2f9f14bb24fca891ca88dbc385f06d2f803516095956f6d7afb58bd596e2d';
  const sourceCrop = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
  const sampleWidth = 160;
  const sampleHeight = 90;
  const samplePixelCount = sampleWidth * sampleHeight;
  const candidateGoal = 18;
  const routeGoal = 6;
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'cursor-drawn-constellation-thread',
    task: 'human-operated-night-navigation-observation-plate-calibration',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'same-origin-generated-observation-plate-pixels-determine-connectable-stars-confidence-and-route-validity',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button-control'],
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    userInputRequired: true,
    initialFrameStatic: true,
    reducedMotion: reducedMotionQuery.matches,
    inputCount: 0,
    pointerEnterCount: 0,
    pointerMoveCount: 0,
    pointerDownCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    rejectedUntrustedInputCount: 0,
    ignoredInputCount: 0,
    humanInputCausalityCount: 0,
    routeMutationCount: 0,
    fixAcceptanceCount: 0,
    rejectedFixCount: 0,
    undoCount: 0,
    resetCount: 0,
    confirmationCount: 0,
    confirmationClearCount: 0,
    activePointerId: null,
    pointerCaptured: false,
    dragging: false,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    pointerU: null,
    pointerV: null,
    hoveredCandidateIndex: -1,
    keyboardTargetIndex: 0,
    connectedRouteIndices: [],
    connectedFixCount: 0,
    maximumConnectedFixCount: 0,
    routeComplete: false,
    confirmed: false,
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
    sourceCrop: { ...sourceCrop },
    sampledWidth: sampleWidth,
    sampledHeight: sampleHeight,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sourcePixelSha256: null,
    distinctSampleColorCount: 0,
    localMaximumCount: 0,
    candidateCount: 0,
    routeTargetCount: 0,
    minimumCandidateConfidence: 0,
    maximumCandidateConfidence: 0,
    candidateCoordinateChecksum: 0,
    routeCoordinateChecksum: 0,
    candidateEvidence: [],
    routeEvidence: [],
    assetEvidenceReady: false,
    pixelEvidenceReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    renderCount: 0,
    resizeCount: 0,
    previewClockCallCount: 0,
    previewClockIgnoredCount: 0,
    previewClockMutationCount: 0,
    initialVisualStateChecksum: null,
    currentVisualStateChecksum: null,
    initialStaticConfirmationCount: 0,
    initialStaticConfirmed: false,
    runtimeAssertionPassed: false,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let observationImage;
  let candidates = [];
  let routeTargets = [];
  let pointer = null;
  let dirty = true;
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`cursor-drawn-constellation-thread: ${message}`);
  }

  async function digestHex(bytes) {
    const buffer = bytes instanceof ArrayBuffer
      ? bytes
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function fnvMix(checksum, value) {
    return Math.imul(checksum ^ (value >>> 0), 16777619) >>> 0;
  }

  function visualStateChecksum() {
    let checksum = 2166136261;
    checksum = fnvMix(checksum, state.connectedFixCount);
    checksum = fnvMix(checksum, state.confirmed ? 1 : 0);
    checksum = fnvMix(checksum, state.keyboardTargetIndex + 1);
    checksum = fnvMix(checksum, state.hoveredCandidateIndex + 2);
    if (pointer) {
      checksum = fnvMix(checksum, Math.round(pointer.u * 10000));
      checksum = fnvMix(checksum, Math.round(pointer.v * 10000));
    }
    for (const index of state.connectedRouteIndices) checksum = fnvMix(checksum, index + 7);
    return checksum >>> 0;
  }

  async function fetchAndDecodeAsset() {
    const response = await fetch(assetUrl, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `observation plate request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === expectedAssetSha256;
    invariant(state.assetSameOrigin, 'observation plate was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'observation plate SHA-256 differs from the committed asset');

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
      'browser-decoded observation plate dimensions are not 960x640');
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
          canvas.elt.setAttribute('aria-hidden', 'true');
          p.noLoop();
          p.textFont('ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement
            && p.drawingContext instanceof CanvasRenderingContext2D;
          state.p5CanvasWidth = p.width;
          state.p5CanvasHeight = p.height;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.p5DrawCount += 1;
        if (!state.pixelEvidenceReady || !observationImage) {
          p.background('#02070e');
          return;
        }
        drawObservation(p);
        state.p5CompletedDrawCount += 1;
        dirty = false;
      };
    }, canvasHost);
  });

  function loadP5Image() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(assetUrl, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  function buildPixelCandidates(pixels) {
    const luminance = new Float32Array(samplePixelCount);
    const colors = new Set();
    for (let index = 0; index < samplePixelCount; index += 1) {
      const offset = index * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      luminance[index] = (red * .2126 + green * .7152 + blue * .0722) / 255;
      colors.add(`${red >> 3},${green >> 3},${blue >> 3}`);
    }
    state.distinctSampleColorCount = colors.size;

    const localMaxima = [];
    const skyLimit = Math.floor(sampleHeight * .82);
    for (let y = 2; y < skyLimit - 2; y += 1) {
      for (let x = 2; x < sampleWidth - 2; x += 1) {
        const index = y * sampleWidth + x;
        const center = luminance[index];
        let neighborMaximum = 0;
        let ringTotal = 0;
        let ringCount = 0;
        let isMaximum = true;
        for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
          for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
            if (offsetX === 0 && offsetY === 0) continue;
            const value = luminance[(y + offsetY) * sampleWidth + x + offsetX];
            if (Math.abs(offsetX) <= 1 && Math.abs(offsetY) <= 1) {
              neighborMaximum = Math.max(neighborMaximum, value);
              if (value > center) isMaximum = false;
            } else {
              ringTotal += value;
              ringCount += 1;
            }
          }
        }
        if (!isMaximum) continue;
        const background = ringTotal / Math.max(1, ringCount);
        const contrast = center - background;
        const peakSeparation = center - neighborMaximum;
        const score = center * .58 + Math.max(0, contrast) * 2.35 + Math.max(0, peakSeparation) * 1.4;
        if (center > .075 && contrast > .006) {
          localMaxima.push({
            sourceX: x,
            sourceY: y,
            u: (x + .5) / sampleWidth,
            v: (y + .5) / sampleHeight,
            luma: center,
            contrast,
            score
          });
        }
      }
    }
    state.localMaximumCount = localMaxima.length;
    localMaxima.sort((left, right) => right.score - left.score || left.sourceY - right.sourceY || left.sourceX - right.sourceX);

    const selected = [];
    const minimumDistance = .075;
    for (const point of localMaxima) {
      if (selected.every(existing => Math.hypot(existing.u - point.u, (existing.v - point.v) * 1.75) >= minimumDistance)) {
        selected.push(point);
      }
      if (selected.length === candidateGoal) break;
    }
    invariant(selected.length === candidateGoal, `expected ${candidateGoal} separated source peaks, received ${selected.length}`);

    const minimumScore = Math.min(...selected.map(point => point.score));
    const maximumScore = Math.max(...selected.map(point => point.score));
    selected.forEach((point, index) => {
      point.index = index;
      point.confidence = Math.round(68 + clamp((point.score - minimumScore) / Math.max(.0001, maximumScore - minimumScore)) * 31);
      point.code = `NS-${String(index + 1).padStart(2, '0')}`;
    });
    return selected;
  }

  function buildRoute(points) {
    const available = points.filter(point => point.v > .08 && point.v < .76);
    const used = new Set();
    const route = [];
    for (let slot = 0; slot < routeGoal; slot += 1) {
      const targetU = .1 + slot * (.8 / (routeGoal - 1));
      const ranked = [...available].filter(point => !used.has(point.index)).sort((left, right) => {
        const leftCost = Math.abs(left.u - targetU) * 1.7 + Math.abs(left.v - .44) * .18 - left.confidence * .0015;
        const rightCost = Math.abs(right.u - targetU) * 1.7 + Math.abs(right.v - .44) * .18 - right.confidence * .0015;
        return leftCost - rightCost || left.index - right.index;
      });
      invariant(ranked.length > 0, `no source-derived star available for route slot ${slot + 1}`);
      const selected = ranked[0];
      used.add(selected.index);
      route.push(selected);
    }
    route.sort((left, right) => left.u - right.u);
    route.forEach((point, routeIndex) => {
      point.routeIndex = routeIndex;
      point.routeCode = `FIX ${String(routeIndex + 1).padStart(2, '0')}`;
    });
    invariant(route.length === routeGoal && route.every((point, index) => index === 0 || point.u > route[index - 1].u),
      'pixel-derived route did not preserve increasing right ascension');
    return route;
  }

  async function preparePixelEvidence() {
    await Promise.all([assetReady, p5Ready]);
    const decoded = await loadP5Image();
    state.p5ImageDecoded = decoded instanceof p5.Image;
    state.p5ImageClass = decoded instanceof p5.Image ? 'p5.Image' : decoded?.constructor?.name ?? null;
    state.p5ImageWidth = decoded.width;
    state.p5ImageHeight = decoded.height;
    decoded.loadPixels();
    state.p5ImagePixelLength = decoded.pixels.length;
    invariant(state.p5ImageDecoded && decoded.width === 960 && decoded.height === 640
      && decoded.pixels.length === 960 * 640 * 4, 'p5 did not decode the committed 960x640 observation plate');

    observationImage = decoded;
    const sample = decoded.get(sourceCrop.x, sourceCrop.y, sourceCrop.width, sourceCrop.height);
    sample.resize(sampleWidth, sampleHeight);
    sample.loadPixels();
    const sourcePixels = new Uint8ClampedArray(sample.pixels);
    state.sampledPixelCount = samplePixelCount;
    state.sampledByteLength = sourcePixels.byteLength;
    state.sourcePixelSha256 = await digestHex(sourcePixels);

    candidates = buildPixelCandidates(sourcePixels);
    routeTargets = buildRoute(candidates);
    state.candidateCount = candidates.length;
    state.routeTargetCount = routeTargets.length;
    state.minimumCandidateConfidence = Math.min(...candidates.map(point => point.confidence));
    state.maximumCandidateConfidence = Math.max(...candidates.map(point => point.confidence));

    let candidateChecksum = 2166136261;
    for (const point of candidates) {
      candidateChecksum = fnvMix(candidateChecksum, point.sourceX);
      candidateChecksum = fnvMix(candidateChecksum, point.sourceY);
      candidateChecksum = fnvMix(candidateChecksum, point.confidence);
    }
    state.candidateCoordinateChecksum = candidateChecksum >>> 0;

    let routeChecksum = 2166136261;
    for (const point of routeTargets) {
      routeChecksum = fnvMix(routeChecksum, point.index + 1);
      routeChecksum = fnvMix(routeChecksum, Math.round(point.u * 100000));
      routeChecksum = fnvMix(routeChecksum, Math.round(point.v * 100000));
    }
    state.routeCoordinateChecksum = routeChecksum >>> 0;
    state.candidateEvidence = candidates.map(point => ({
      code: point.code,
      u: Number(point.u.toFixed(6)),
      v: Number(point.v.toFixed(6)),
      luma: Number(point.luma.toFixed(6)),
      localContrast: Number(point.contrast.toFixed(6)),
      confidence: point.confidence
    }));
    state.routeEvidence = routeTargets.map(point => ({
      code: point.routeCode,
      sourceCode: point.code,
      candidateIndex: point.index,
      u: Number(point.u.toFixed(6)),
      v: Number(point.v.toFixed(6)),
      confidence: point.confidence
    }));
    state.pixelEvidenceReady = true;
    state.ready = true;
    updateInterface();
    requestRender();
  }

  function drawObservation(p) {
    const width = p.width;
    const height = p.height;
    p.image(observationImage, 0, 0, width, height,
      sourceCrop.x, sourceCrop.y, sourceCrop.width, sourceCrop.height);

    const context = p.drawingContext;
    const wash = context.createLinearGradient(0, 0, width, 0);
    wash.addColorStop(0, 'rgba(1, 7, 14, .72)');
    wash.addColorStop(.34, 'rgba(1, 7, 14, .2)');
    wash.addColorStop(1, 'rgba(1, 7, 14, .12)');
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height);

    const horizonFade = context.createLinearGradient(0, height * .56, 0, height);
    horizonFade.addColorStop(0, 'rgba(1, 6, 12, 0)');
    horizonFade.addColorStop(1, 'rgba(1, 6, 12, .62)');
    context.fillStyle = horizonFade;
    context.fillRect(0, height * .56, width, height * .44);

    const scale = Math.max(.42, Math.min(1.25, width / 560));
    for (const point of candidates) {
      const x = point.u * width;
      const y = point.v * height;
      const routeIndex = routeTargets.indexOf(point);
      const completed = routeIndex >= 0 && routeIndex < state.connectedFixCount;
      const next = routeIndex === state.connectedFixCount;
      const hovered = point.index === state.hoveredCandidateIndex;
      const keyboardSelected = routeIndex === state.keyboardTargetIndex;
      const radius = (point.confidence > 90 ? 3.2 : 2.4) * scale;

      p.noStroke();
      p.fill(completed ? '#9af3e4' : routeIndex >= 0 ? '#f5f1df' : 'rgba(221, 235, 242, .62)');
      p.circle(x, y, Math.max(1.2, radius));

      if (routeIndex >= 0) {
        p.noFill();
        p.stroke(completed ? 'rgba(147, 239, 225, .9)' : next ? 'rgba(242, 183, 110, .92)' : 'rgba(220, 235, 239, .38)');
        p.strokeWeight(Math.max(.55, scale));
        p.circle(x, y, (next ? 17 : 11) * scale);
        if (next) {
          p.line(x - 11 * scale, y, x - 6 * scale, y);
          p.line(x + 6 * scale, y, x + 11 * scale, y);
          p.line(x, y - 11 * scale, x, y - 6 * scale);
          p.line(x, y + 6 * scale, x, y + 11 * scale);
        }
      }

      if (hovered || keyboardSelected) {
        p.noFill();
        p.stroke(hovered ? 'rgba(147, 239, 225, .78)' : 'rgba(242, 183, 110, .72)');
        p.strokeWeight(Math.max(.55, scale));
        p.circle(x, y, 24 * scale);
      }
    }

    if (state.connectedFixCount > 0) {
      p.noFill();
      p.stroke(state.confirmed ? 'rgba(242, 183, 110, .92)' : 'rgba(147, 239, 225, .9)');
      p.strokeWeight(Math.max(1, 1.55 * scale));
      p.beginShape();
      for (let index = 0; index < state.connectedFixCount; index += 1) {
        p.vertex(routeTargets[index].u * width, routeTargets[index].v * height);
      }
      p.endShape();
    }

    if (pointer && state.connectedFixCount < routeGoal) {
      const anchor = state.connectedFixCount > 0 ? routeTargets[state.connectedFixCount - 1] : routeTargets[0];
      p.noFill();
      p.stroke(state.dragging ? 'rgba(147, 239, 225, .62)' : 'rgba(216, 234, 238, .3)');
      p.strokeWeight(Math.max(.5, scale));
      p.line(anchor.u * width, anchor.v * height, pointer.u * width, pointer.v * height);
      p.circle(pointer.u * width, pointer.v * height, 8 * scale);
    }

    state.currentVisualStateChecksum = visualStateChecksum();
  }

  function requestRender() {
    dirty = true;
    if (state.p5CanvasReady) sketch.redraw();
  }

  function currentTarget() {
    return routeTargets[state.connectedFixCount] ?? null;
  }

  function updateInterface() {
    if (!state.pixelEvidenceReady) return;
    state.connectedFixCount = state.connectedRouteIndices.length;
    state.maximumConnectedFixCount = Math.max(state.maximumConnectedFixCount, state.connectedFixCount);
    state.routeComplete = state.connectedFixCount === routeGoal;
    confirmButton.disabled = !state.routeComplete;
    missionStatus.textContent = state.confirmed ? 'ROUTE VERIFIED' : state.routeComplete ? 'READY TO CONFIRM' : state.dragging ? 'HUMAN TRACE' : 'ACQUIRING';
    routeReadout.textContent = state.confirmed ? 'CORRIDOR ACCEPTED' : `${state.connectedFixCount} / ${routeGoal} FIXES`;

    const target = currentTarget();
    if (target) {
      targetCode.textContent = `${target.routeCode} · ${target.code}`;
      targetEvidence.textContent = `${target.confidence}% CONF · PX ${target.sourceX}:${target.sourceY}`;
    } else {
      targetCode.textContent = 'ALL FIXES ACQUIRED';
      targetEvidence.textContent = state.confirmed ? 'FIELD ROUTE SEALED' : 'CONFIRM HUMAN TRACE';
    }

    routeStrip.replaceChildren();
    for (let index = 0; index < routeGoal; index += 1) {
      if (index > 0) {
        const link = document.createElement('span');
        link.className = `route-link${index <= state.connectedFixCount - 1 ? ' is-complete' : ''}`;
        routeStrip.append(link);
      }
      const node = document.createElement('span');
      node.className = `route-node${index < state.connectedFixCount ? ' is-complete' : ''}${index === state.connectedFixCount ? ' is-next' : ''}`;
      node.textContent = String(index + 1).padStart(2, '0');
      routeStrip.append(node);
    }
  }

  function eventPoint(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      u: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width)),
      v: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height))
    };
  }

  function nearestCandidate(point) {
    let nearest = null;
    let minimumDistance = Infinity;
    for (const candidate of candidates) {
      const distance = Math.hypot(candidate.u - point.u, (candidate.v - point.v) * 1.78);
      if (distance < minimumDistance) {
        nearest = candidate;
        minimumDistance = distance;
      }
    }
    return { candidate: nearest, distance: minimumDistance };
  }

  function hitRadius() {
    return clamp(10 / Math.max(144, stage.clientWidth), .032, .07);
  }

  function acceptCurrentFix(inputKind) {
    if (!state.pixelEvidenceReady || state.routeComplete) return false;
    const index = state.connectedFixCount;
    state.connectedRouteIndices.push(index);
    state.connectedFixCount = state.connectedRouteIndices.length;
    state.maximumConnectedFixCount = Math.max(state.maximumConnectedFixCount, state.connectedFixCount);
    state.fixAcceptanceCount += 1;
    state.routeMutationCount += 1;
    state.humanInputCausalityCount += 1;
    state.lastInputKind = inputKind;
    state.keyboardTargetIndex = Math.min(routeGoal - 1, state.connectedFixCount);
    updateInterface();
    requestRender();
    return true;
  }

  function tryAcceptPoint(point, inputKind) {
    const target = currentTarget();
    if (!target) return false;
    const distance = Math.hypot(target.u - point.u, (target.v - point.v) * 1.78);
    if (distance > hitRadius()) {
      state.rejectedFixCount += 1;
      return false;
    }
    return acceptCurrentFix(inputKind);
  }

  function clearConfirmation() {
    if (!state.confirmed) return;
    state.confirmed = false;
    state.confirmationClearCount += 1;
  }

  function undo(inputKind) {
    clearConfirmation();
    if (state.connectedRouteIndices.length > 0) {
      state.connectedRouteIndices.pop();
      state.connectedFixCount = state.connectedRouteIndices.length;
      state.undoCount += 1;
      state.routeMutationCount += 1;
      state.humanInputCausalityCount += 1;
      state.lastInputKind = inputKind;
      state.keyboardTargetIndex = Math.min(routeGoal - 1, state.connectedFixCount);
      updateInterface();
      requestRender();
    }
  }

  function reset(inputKind) {
    const changed = state.connectedRouteIndices.length > 0 || state.confirmed || pointer;
    clearConfirmation();
    state.connectedRouteIndices = [];
    state.connectedFixCount = 0;
    state.routeComplete = false;
    state.keyboardTargetIndex = 0;
    state.hoveredCandidateIndex = -1;
    pointer = null;
    state.pointerU = null;
    state.pointerV = null;
    state.resetCount += 1;
    if (changed) {
      state.routeMutationCount += 1;
      state.humanInputCausalityCount += 1;
    }
    state.lastInputKind = inputKind;
    updateInterface();
    requestRender();
  }

  function confirm(inputKind) {
    if (!state.routeComplete || state.confirmed) return;
    state.confirmed = true;
    state.confirmationCount += 1;
    state.routeMutationCount += 1;
    state.humanInputCausalityCount += 1;
    state.lastInputKind = inputKind;
    updateInterface();
    requestRender();
  }

  function recordTrustedInput(event, kind) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = kind;
    if ('pointerType' in event) state.lastPointerType = event.pointerType || 'mouse';
    return true;
  }

  stage.addEventListener('pointerenter', event => {
    if (event.target.closest('button') || !recordTrustedInput(event, 'pointer-hover')) return;
    state.pointerEnterCount += 1;
    pointer = eventPoint(event);
    state.pointerU = pointer.u;
    state.pointerV = pointer.v;
    const nearest = nearestCandidate(pointer);
    state.hoveredCandidateIndex = nearest.distance <= hitRadius() * 1.55 ? nearest.candidate.index : -1;
    state.hoverMutationCount += 1;
    state.humanInputCausalityCount += 1;
    requestRender();
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest('button') || !recordTrustedInput(event, state.dragging ? 'pointer-drag' : 'pointer-hover')) return;
    state.pointerMoveCount += 1;
    pointer = eventPoint(event);
    state.pointerU = pointer.u;
    state.pointerV = pointer.v;
    const nearest = nearestCandidate(pointer);
    state.hoveredCandidateIndex = nearest.distance <= hitRadius() * 1.55 ? nearest.candidate.index : -1;
    if (state.dragging && event.pointerId === state.activePointerId) {
      state.dragMutationCount += 1;
      tryAcceptPoint(pointer, `${event.pointerType || 'mouse'}-drag`);
    } else {
      state.hoverMutationCount += 1;
      state.humanInputCausalityCount += 1;
    }
    requestRender();
  });

  stage.addEventListener('pointerleave', event => {
    if (state.dragging || event.target.closest('button')) return;
    pointer = null;
    state.pointerU = null;
    state.pointerV = null;
    state.hoveredCandidateIndex = -1;
    requestRender();
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || !recordTrustedInput(event, 'pointer-down')) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    pointer = eventPoint(event);
    state.pointerDownCount += 1;
    state.dragging = true;
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    tryAcceptPoint(pointer, `${event.pointerType || 'mouse'}-drag`);
    updateInterface();
    requestRender();
  });

  function releasePointer(event, cancelled) {
    if (state.activePointerId !== event.pointerId) return;
    if (!recordTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-release')) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (state.pointerCaptured && stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.pointerCaptured = false;
    state.dragging = false;
    state.activePointerId = null;
    updateInterface();
    requestRender();
  }

  stage.addEventListener('pointerup', event => releasePointer(event, false));
  stage.addEventListener('pointercancel', event => releasePointer(event, true));

  stage.addEventListener('keydown', event => {
    if (event.target.closest('button') || !recordTrustedInput(event, `keyboard-${event.key}`)) return;
    const handled = ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Backspace', 'Delete', 'Escape'].includes(event.key);
    if (!handled) {
      state.ignoredInputCount += 1;
      return;
    }
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (event.key === 'ArrowLeft') state.keyboardTargetIndex = Math.max(0, state.keyboardTargetIndex - 1);
    else if (event.key === 'ArrowRight') state.keyboardTargetIndex = Math.min(routeGoal - 1, state.keyboardTargetIndex + 1);
    else if (event.key === 'Home') state.keyboardTargetIndex = 0;
    else if (event.key === 'End') state.keyboardTargetIndex = routeGoal - 1;
    else if (event.key === 'Backspace' || event.key === 'Delete') undo(`keyboard-${event.key}`);
    else if (event.key === 'Escape') reset('keyboard-Escape');
    else if ((event.key === 'Enter' || event.key === ' ') && state.routeComplete) {
      confirm(`keyboard-${event.key}`);
    } else if ((event.key === 'Enter' || event.key === ' ') && state.keyboardTargetIndex === state.connectedFixCount) {
      acceptCurrentFix(`keyboard-${event.key}`);
    } else state.rejectedFixCount += 1;
    state.humanInputCausalityCount += 1;
    updateInterface();
    requestRender();
  });

  for (const button of actionButtons) {
    button.addEventListener('click', event => {
      if (!recordTrustedInput(event, `button-${button.dataset.constellationAction}`)) return;
      state.buttonActivationCount += 1;
      const action = button.dataset.constellationAction;
      if (action === 'undo') undo('button-undo');
      else if (action === 'reset') reset('button-reset');
      else if (action === 'confirm') confirm('button-confirm');
    });
  }

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch || !state.p5CanvasReady) return;
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      if (width === sketch.width && height === sketch.height) return;
      sketch.resizeCanvas(width, height, true);
      state.p5CanvasWidth = width;
      state.p5CanvasHeight = height;
      state.resizeCount += 1;
      requestRender();
    });
  });
  resizeObserver.observe(stage);

  const ready = preparePixelEvidence().then(() => document.fonts.ready).then(() => {
    invariant(state.assetEvidenceReady && state.pixelEvidenceReady, 'source pixel evidence did not become ready');
    invariant(state.assetByteLength > 100000 && state.assetByteLength < 400000, 'observation plate byte size is outside the committed evidence range');
    invariant(state.sourcePixelSha256?.length === 64 && !/^0+$/.test(state.sourcePixelSha256), 'derived pixel digest is missing');
    invariant(state.distinctSampleColorCount > 100 && state.distinctSampleColorCount < 5000,
      'observation plate lacks usable sampled color variation');
    invariant(state.localMaximumCount >= candidateGoal && state.candidateCount === candidateGoal,
      'pixel-derived candidate topology is incomplete');
    invariant(state.routeTargetCount === routeGoal && state.routeCoordinateChecksum > 0,
      'pixel-derived navigation route is incomplete');
    invariant(state.minimumCandidateConfidence >= 68 && state.maximumCandidateConfidence === 99,
      'pixel-derived confidence range is invalid');
    state.initialVisualStateChecksum = visualStateChecksum();
    state.currentVisualStateChecksum = state.initialVisualStateChecksum;
    state.initialStaticConfirmed = true;
    state.initialStaticConfirmationCount += 1;
    updateInterface();
    requestRender();
  });

  function renderFromPreviewClock() {
    state.previewClockCallCount += 1;
    state.renderCount += 1;
    state.previewClockIgnoredCount += 1;
    if (dirty && state.p5CanvasReady) sketch.redraw();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    const before = visualStateChecksum();
    renderFromPreviewClock(0);
    renderFromPreviewClock(2.75);
    const after = visualStateChecksum();
    const passed = state.ready
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetShaMatchesExpected
      && state.browserImageDecoded
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImagePixelLength === 960 * 640 * 4
      && state.sampledPixelCount === samplePixelCount
      && state.sampledByteLength === samplePixelCount * 4
      && state.sourcePixelSha256?.length === 64
      && state.distinctSampleColorCount > 100
      && state.candidateCount === candidateGoal
      && state.routeTargetCount === routeGoal
      && state.routeEvidence.length === routeGoal
      && state.candidateEvidence.length === candidateGoal
      && state.initialStaticConfirmed
      && state.previewClockMutationCount === 0
      && state.renderIgnoresPreviewClock
      && before === after
      && state.p5InstanceReady
      && state.p5CanvasReady
      && state.p5CanvasWidth === stage.clientWidth
      && state.p5CanvasHeight === stage.clientHeight;
    state.runtimeAssertionPassed = passed;
    return passed;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render: renderFromPreviewClock,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
