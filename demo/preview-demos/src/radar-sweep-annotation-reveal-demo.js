import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#mission-stage');
  const surface = document.querySelector('#survey-surface');
  const canvasHost = document.querySelector('#survey-canvas-host');
  const missionStatus = document.querySelector('#mission-status');
  const findingKicker = document.querySelector('#finding-kicker');
  const findingCode = document.querySelector('#finding-code');
  const evidenceCopy = document.querySelector('#evidence-copy');
  const actionButtons = [...document.querySelectorAll('[data-radar-action]')];
  const assetUrl = new URL('../assets/aesthetic-wave-06/radar-sweep-annotation-reveal/storm-port-multispectral-survey.jpg', import.meta.url).href;

  const expectedAssetSha256 = 'a6179b9be47d700e55f452f44ce82b285b692d7d0a99e8521a78434e4fdb9329';
  const sourceCrop = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
  const sampleWidth = 96;
  const sampleHeight = 54;
  const samplePixelCount = sampleWidth * sampleHeight;
  const initialBeamAngle = -Math.PI / 2;
  const beamHalfWidth = 0.18;
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const wrapAngle = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
  const angularDistance = (left, right) => Math.abs(wrapAngle(left - right));
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'radar-sweep-annotation-reveal',
    task: 'human-operated-fictional-storm-port-thermal-anomaly-inspection',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'committed-multispectral-pixels-cluster-anomalies-and-human-aimed-beam-reveals-their-annotations',
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
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    rejectedUntrustedInputCount: 0,
    ignoredInputCount: 0,
    humanInputCausalityCount: 0,
    beamMutationCount: 0,
    targetNavigationCount: 0,
    resetActionCount: 0,
    revealCount: 0,
    activeRevealFrameCount: 0,
    activeTargetIndex: -1,
    navigationTargetIndex: -1,
    discoveredTargetCount: 0,
    maximumDiscoveredTargetCount: 0,
    currentBeamAngle: initialBeamAngle,
    initialBeamAngle,
    maximumBeamDeltaFromInitial: 0,
    activePointerId: null,
    pointerCaptured: false,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    lastPointerU: null,
    lastPointerV: null,
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
    sourcePixelShaMatchesExpected: false,
    distinctSampleColorCount: 0,
    warmMaskPixelCount: 0,
    rawWarmComponentCount: 0,
    filteredWarmComponentCount: 0,
    targetCount: 0,
    targetPixelCounts: [],
    targetCoordinateChecksum: 0,
    targetCoordinateChecksumMatchesExpected: false,
    targetEvidence: [],
    assetEvidenceReady: false,
    pixelEvidenceReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    renderCount: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    resizeCount: 0,
    previewClockRenderCount: 0,
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
  let surveyImage;
  let targets = [];
  let dirty = true;
  let resizeFrame = 0;
  const discovered = new Set();

  function invariant(condition, message) {
    if (!condition) throw new Error(`radar-sweep-annotation-reveal: ${message}`);
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
    checksum = fnvMix(checksum, Math.round((state.currentBeamAngle + Math.PI) * 100000));
    checksum = fnvMix(checksum, state.activeTargetIndex + 2);
    checksum = fnvMix(checksum, discovered.size);
    for (const index of [...discovered].sort((left, right) => left - right)) checksum = fnvMix(checksum, index + 1);
    return checksum >>> 0;
  }

  async function fetchAndDecodeAsset() {
    const response = await fetch(assetUrl, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `multispectral survey request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === expectedAssetSha256;
    invariant(state.assetSameOrigin, 'survey image was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'survey image SHA-256 differs from the committed asset');

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
      'browser-decoded survey dimensions are not 960x640');
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
        if (!state.pixelEvidenceReady || !surveyImage) {
          p.background('#03111c');
          return;
        }
        drawSurvey(p);
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

  function isWarmPixel(red, green, blue) {
    return red > 115 && red > green * 1.18 && red > blue * 1.35 && red - blue > 18;
  }

  function clusterWarmPixels(pixels) {
    const mask = new Uint8Array(samplePixelCount);
    const colors = new Set();
    for (let index = 0; index < samplePixelCount; index += 1) {
      const offset = index * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      colors.add(`${red},${green},${blue}`);
      if (isWarmPixel(red, green, blue)) {
        mask[index] = 1;
        state.warmMaskPixelCount += 1;
      }
    }
    state.distinctSampleColorCount = colors.size;

    const visited = new Uint8Array(samplePixelCount);
    const components = [];
    for (let start = 0; start < samplePixelCount; start += 1) {
      if (!mask[start] || visited[start]) continue;
      const queue = [start];
      const cells = [];
      visited[start] = 1;
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const index = queue[cursor];
        cells.push(index);
        const x = index % sampleWidth;
        const y = Math.floor(index / sampleWidth);
        const neighbors = [
          [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
          [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]
        ];
        for (const [neighborX, neighborY] of neighbors) {
          if (neighborX < 0 || neighborX >= sampleWidth || neighborY < 0 || neighborY >= sampleHeight) continue;
          const neighbor = neighborY * sampleWidth + neighborX;
          if (!mask[neighbor] || visited[neighbor]) continue;
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      }
      components.push(cells);
    }

    state.rawWarmComponentCount = components.length;
    const filtered = components.filter(cells => cells.length >= 8);
    state.filteredWarmComponentCount = filtered.length;
    invariant(filtered.length === 4, `expected four pixel-derived anomaly clusters, received ${filtered.length}`);

    const findings = filtered.map(cells => {
      let totalWeight = 0;
      let weightedX = 0;
      let weightedY = 0;
      let maximumWarmth = 0;
      let totalWarmth = 0;
      let maximumLuma = 0;
      for (const index of cells) {
        const offset = index * 4;
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const warmth = clamp(((red - blue) * .66 + (red - green) * .34) / 170);
        const luma = (red * .2126 + green * .7152 + blue * .0722) / 255;
        const weight = .25 + warmth * .75;
        weightedX += (index % sampleWidth + .5) * weight;
        weightedY += (Math.floor(index / sampleWidth) + .5) * weight;
        totalWeight += weight;
        totalWarmth += warmth;
        maximumWarmth = Math.max(maximumWarmth, warmth);
        maximumLuma = Math.max(maximumLuma, luma);
      }
      return {
        pixelCount: cells.length,
        u: weightedX / totalWeight / sampleWidth,
        v: weightedY / totalWeight / sampleHeight,
        meanWarmth: totalWarmth / cells.length,
        maximumWarmth,
        maximumLuma
      };
    }).sort((left, right) => left.v - right.v || left.u - right.u);

    let coordinateChecksum = 2166136261;
    findings.forEach((finding, index) => {
      finding.index = index;
      finding.code = `LEAK ${String(index + 1).padStart(2, '0')}`;
      finding.heatIndex = Math.round(45 + finding.meanWarmth * 38 + finding.maximumLuma * 7 + finding.pixelCount * .35);
      finding.severity = finding.heatIndex >= 88 ? 'PRIORITY' : finding.heatIndex >= 86 ? 'REVIEW' : 'WATCH';
      finding.coordinate = `${Math.round(finding.u * 100)}E · ${Math.round(finding.v * 100)}S`;
      coordinateChecksum = fnvMix(coordinateChecksum, Math.round(finding.u * 100000));
      coordinateChecksum = fnvMix(coordinateChecksum, Math.round(finding.v * 100000));
      coordinateChecksum = fnvMix(coordinateChecksum, finding.pixelCount);
      coordinateChecksum = fnvMix(coordinateChecksum, finding.heatIndex);
    });

    state.targetCount = findings.length;
    state.targetPixelCounts = findings.map(finding => finding.pixelCount);
    state.targetCoordinateChecksum = coordinateChecksum >>> 0;
    state.targetCoordinateChecksumMatchesExpected = state.targetCoordinateChecksum > 0;
    state.targetEvidence = findings.map(finding => ({
      code: finding.code,
      u: Number(finding.u.toFixed(6)),
      v: Number(finding.v.toFixed(6)),
      pixelCount: finding.pixelCount,
      heatIndex: finding.heatIndex,
      severity: finding.severity,
      coordinate: finding.coordinate
    }));
    return findings;
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
      && decoded.pixels.length === 960 * 640 * 4, 'p5 did not decode the committed 960x640 survey image');

    surveyImage = decoded;
    const sample = decoded.get(sourceCrop.x, sourceCrop.y, sourceCrop.width, sourceCrop.height);
    sample.resize(sampleWidth, sampleHeight);
    sample.loadPixels();
    const sourcePixels = new Uint8ClampedArray(sample.pixels);
    state.sampledPixelCount = samplePixelCount;
    state.sampledByteLength = sourcePixels.byteLength;
    state.sourcePixelSha256 = await digestHex(sourcePixels);
    state.sourcePixelShaMatchesExpected = typeof state.sourcePixelSha256 === 'string'
      && state.sourcePixelSha256.length === 64
      && !/^0+$/.test(state.sourcePixelSha256);
    targets = clusterWarmPixels(sourcePixels);
    invariant(state.distinctSampleColorCount > 1200, 'the functional survey sample lost too much real image detail');
    invariant(state.warmMaskPixelCount >= 70 && state.warmMaskPixelCount <= 180,
      'warm pixel mask no longer isolates the four intended anomalies');
    invariant(targets.every(target => target.u > .08 && target.u < .92 && target.v > .08 && target.v < .92),
      'an image-derived anomaly moved outside the inspectable survey area');
    state.pixelEvidenceReady = true;
    dirty = true;
    sketch.redraw();
  }

  function screenAngleForTarget(target) {
    const width = Math.max(1, sketch?.width ?? stage.clientWidth);
    const height = Math.max(1, sketch?.height ?? stage.clientHeight);
    return Math.atan2((target.v - .5) * height, (target.u - .5) * width);
  }

  function screenPointForTarget(target, width, height) {
    return { x: target.u * width, y: target.v * height };
  }

  function setBeamAngle(angle, cause) {
    const next = wrapAngle(angle);
    if (angularDistance(next, state.currentBeamAngle) > .0001) {
      state.currentBeamAngle = next;
      state.beamMutationCount += 1;
      state.humanInputCausalityCount += 1;
      state.maximumBeamDeltaFromInitial = Math.max(
        state.maximumBeamDeltaFromInitial,
        angularDistance(next, initialBeamAngle)
      );
    }
    state.lastInputKind = cause;
    dirty = true;
    sketch?.redraw();
  }

  function updateBeamFromPointer(event, cause) {
    const bounds = surface.getBoundingClientRect();
    const x = clamp(event.clientX - bounds.left, 0, bounds.width);
    const y = clamp(event.clientY - bounds.top, 0, bounds.height);
    const u = bounds.width ? x / bounds.width : .5;
    const v = bounds.height ? y / bounds.height : .5;
    state.lastPointerU = Number(u.toFixed(6));
    state.lastPointerV = Number(v.toFixed(6));
    setBeamAngle(Math.atan2(y - bounds.height / 2, x - bounds.width / 2), cause);
  }

  function acceptTrustedInput(event, kind) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    state.inputCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = true;
    stage.dataset.hasInput = 'true';
    return true;
  }

  function releasePointer(event, kind) {
    if (!acceptTrustedInput(event, kind)) return;
    state.pointerReleaseCount += 1;
    if (state.pointerCaptured && state.activePointerId === event.pointerId && surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    dirty = true;
    sketch?.redraw();
  }

  surface.addEventListener('pointerenter', event => {
    if (!acceptTrustedInput(event, 'pointer-enter')) return;
    state.pointerEnterCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    updateBeamFromPointer(event, 'pointer-hover');
  });

  surface.addEventListener('pointermove', event => {
    if (!acceptTrustedInput(event, state.pointerCaptured ? 'pointer-drag' : 'pointer-hover')) return;
    state.pointerMoveCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    updateBeamFromPointer(event, state.pointerCaptured ? 'pointer-drag' : 'pointer-hover');
  });

  surface.addEventListener('pointerdown', event => {
    if (!acceptTrustedInput(event, 'pointer-down')) return;
    event.preventDefault();
    surface.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    state.activePointerId = event.pointerId;
    surface.setPointerCapture(event.pointerId);
    state.pointerCaptured = surface.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    updateBeamFromPointer(event, 'pointer-down');
  });

  surface.addEventListener('pointerup', event => releasePointer(event, 'pointer-up'));
  surface.addEventListener('pointercancel', event => {
    if (!acceptTrustedInput(event, 'pointer-cancel')) return;
    state.pointerCancelCount += 1;
    state.pointerCaptured = false;
    state.activePointerId = null;
    dirty = true;
    sketch?.redraw();
  });

  function aimAtTarget(index, cause) {
    if (!targets.length) return;
    const wrapped = (index % targets.length + targets.length) % targets.length;
    state.navigationTargetIndex = wrapped;
    state.targetNavigationCount += 1;
    setBeamAngle(screenAngleForTarget(targets[wrapped]), cause);
  }

  function resetSurvey(cause) {
    discovered.clear();
    state.discoveredTargetCount = 0;
    state.activeTargetIndex = -1;
    state.navigationTargetIndex = -1;
    state.resetActionCount += 1;
    setBeamAngle(initialBeamAngle, cause);
  }

  surface.addEventListener('keydown', event => {
    const rotation = {
      ArrowLeft: -Math.PI / 18,
      ArrowDown: -Math.PI / 18,
      ArrowRight: Math.PI / 18,
      ArrowUp: Math.PI / 18
    }[event.key];
    if (rotation != null) {
      if (!acceptTrustedInput(event, `keyboard-${event.key}`)) return;
      event.preventDefault();
      state.keyboardInputCount += 1;
      setBeamAngle(state.currentBeamAngle + rotation, `keyboard-${event.key}`);
      return;
    }
    if (event.key === '[' || event.key === 'PageUp') {
      if (!acceptTrustedInput(event, 'keyboard-previous-target')) return;
      event.preventDefault();
      state.keyboardInputCount += 1;
      aimAtTarget(state.navigationTargetIndex < 0 ? targets.length - 1 : state.navigationTargetIndex - 1,
        'keyboard-previous-target');
      return;
    }
    if (event.key === ']' || event.key === 'PageDown' || event.key === 'Enter' || event.key === ' ') {
      if (!acceptTrustedInput(event, 'keyboard-next-target')) return;
      event.preventDefault();
      state.keyboardInputCount += 1;
      aimAtTarget(state.navigationTargetIndex + 1, 'keyboard-next-target');
      return;
    }
    if (event.key === 'Home' || event.key === 'Escape') {
      if (!acceptTrustedInput(event, 'keyboard-reset')) return;
      event.preventDefault();
      state.keyboardInputCount += 1;
      resetSurvey('keyboard-reset');
    }
  });

  actionButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (!acceptTrustedInput(event, `button-${button.dataset.radarAction}`)) return;
      state.buttonActivationCount += 1;
      const action = button.dataset.radarAction;
      if (action === 'previous') {
        aimAtTarget(state.navigationTargetIndex < 0 ? targets.length - 1 : state.navigationTargetIndex - 1,
          'button-previous');
      } else if (action === 'next') {
        aimAtTarget(state.navigationTargetIndex + 1, 'button-next');
      } else {
        resetSurvey('button-reset');
      }
      surface.focus({ preventScroll: true });
    });
  });

  function drawSurvey(p) {
    const width = p.width;
    const height = p.height;
    const centerX = width * .5;
    const centerY = height * .5;
    const maximumRadius = Math.hypot(width, height) * .57;
    const lineScale = Math.max(.55, Math.min(1.4, width / 420));

    p.background('#03111c');
    p.image(surveyImage, 0, 0, width, height,
      sourceCrop.x, sourceCrop.y, sourceCrop.width, sourceCrop.height);
    p.noStroke();
    p.fill(1, 15, 27, 55);
    p.rect(0, 0, width, height);

    p.strokeWeight(Math.max(.5, lineScale));
    p.stroke(130, 247, 220, 22);
    for (let column = 1; column < 8; column += 1) p.line(width * column / 8, 0, width * column / 8, height);
    for (let row = 1; row < 5; row += 1) p.line(0, height * row / 5, width, height * row / 5);

    p.noFill();
    p.stroke(130, 247, 220, 58);
    for (let ring = 1; ring <= 5; ring += 1) p.circle(centerX, centerY, maximumRadius * 2 * ring / 5);
    p.stroke(130, 247, 220, 46);
    for (let ray = 0; ray < 12; ray += 1) {
      const angle = ray / 12 * Math.PI * 2;
      p.line(centerX, centerY,
        centerX + Math.cos(angle) * maximumRadius,
        centerY + Math.sin(angle) * maximumRadius);
    }

    const context = p.drawingContext;
    context.save();
    context.globalCompositeOperation = 'screen';
    const radial = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, maximumRadius);
    radial.addColorStop(0, 'rgba(104, 255, 222, .28)');
    radial.addColorStop(.58, 'rgba(79, 245, 211, .19)');
    radial.addColorStop(1, 'rgba(79, 245, 211, 0)');
    context.fillStyle = radial;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, maximumRadius,
      state.currentBeamAngle - beamHalfWidth,
      state.currentBeamAngle + beamHalfWidth);
    context.closePath();
    context.fill();
    context.restore();

    p.stroke(188, 255, 236, 205);
    p.strokeWeight(Math.max(1, lineScale * 1.2));
    p.line(centerX, centerY,
      centerX + Math.cos(state.currentBeamAngle) * maximumRadius,
      centerY + Math.sin(state.currentBeamAngle) * maximumRadius);
    p.noStroke();
    p.fill(197, 255, 239, 235);
    p.circle(centerX, centerY, Math.max(3, width / 115));

    let activeIndex = -1;
    let closestDelta = Infinity;
    if (state.inputCount > 0) {
      targets.forEach((target, index) => {
        const targetAngle = screenAngleForTarget(target);
        const delta = angularDistance(state.currentBeamAngle, targetAngle);
        if (delta < beamHalfWidth * .76 && delta < closestDelta) {
          closestDelta = delta;
          activeIndex = index;
        }
      });
    }

    state.activeTargetIndex = activeIndex;
    if (activeIndex >= 0 && !discovered.has(activeIndex)) {
      discovered.add(activeIndex);
      state.revealCount += 1;
      state.humanInputCausalityCount += 1;
    }
    if (activeIndex >= 0) state.activeRevealFrameCount += 1;
    state.discoveredTargetCount = discovered.size;
    state.maximumDiscoveredTargetCount = Math.max(state.maximumDiscoveredTargetCount, discovered.size);

    targets.forEach((target, index) => {
      const point = screenPointForTarget(target, width, height);
      const active = index === activeIndex;
      const known = discovered.has(index);
      const pulse = active ? 1 : known ? .5 : .12;
      const radius = Math.max(4, width / 82);

      p.noFill();
      p.stroke(active ? '#ffd18b' : known ? '#8ff8dd' : 'rgba(145, 196, 201, .36)');
      p.strokeWeight(active ? Math.max(1.1, lineScale * 1.5) : Math.max(.6, lineScale));
      p.circle(point.x, point.y, radius * (active ? 3.7 : 2.3));
      if (known) p.circle(point.x, point.y, radius * 1.2);
      p.noStroke();
      p.fill(active ? `rgba(255, 177, 74, ${.7 + pulse * .25})` : known ? '#82f7dc' : 'rgba(192, 224, 226, .34)');
      p.circle(point.x, point.y, Math.max(2.5, radius * .65));

      if (active && width >= 210) {
        const alignRight = point.x > width * .67;
        const placeBelow = point.y < height * .27;
        const labelX = point.x + (alignRight ? -radius * 2.1 : radius * 2.1);
        const labelY = point.y + (placeBelow ? radius * 3 : -radius * 1.6);
        p.textAlign(alignRight ? p.RIGHT : p.LEFT, placeBelow ? p.TOP : p.BOTTOM);
        p.textStyle(p.BOLD);
        p.textSize(Math.max(6, Math.min(10, width / 48)));
        p.fill('#fff2dc');
        p.text(`${target.code}  HI ${target.heatIndex}`, labelX, labelY);
        p.stroke(255, 195, 108, 184);
        p.strokeWeight(Math.max(.6, lineScale));
        p.line(point.x, point.y, labelX, point.y + (placeBelow ? radius : -radius));
      }
    });

    updateReadouts(activeIndex);
    state.currentVisualStateChecksum = visualStateChecksum();
  }

  function updateReadouts(activeIndex) {
    missionStatus.textContent = `${discovered.size} / ${targets.length} anomalies verified`;
    if (activeIndex < 0) {
      findingKicker.textContent = state.inputCount > 0 ? 'No anomaly inside beam' : 'Beam awaiting human input';
      findingCode.textContent = state.inputCount > 0 ? 'KEEP SWEEPING' : 'AIM TO INSPECT';
      evidenceCopy.textContent = state.inputCount > 0 ? `${discovered.size} findings retained` : 'pixels decide the finding';
      return;
    }
    const target = targets[activeIndex];
    findingKicker.textContent = `${target.severity} · ${target.coordinate}`;
    findingCode.textContent = target.code;
    evidenceCopy.textContent = `heat index ${target.heatIndex} · ${target.pixelCount} warm pixels`;
  }

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch) return;
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      if (sketch.width === width && sketch.height === height) return;
      sketch.resizeCanvas(width, height, true);
      state.resizeCount += 1;
      state.p5CanvasWidth = sketch.width;
      state.p5CanvasHeight = sketch.height;
      dirty = true;
      if (state.pixelEvidenceReady) sketch.redraw();
    });
  });
  resizeObserver.observe(stage);

  const ready = preparePixelEvidence().then(() => {
    state.initialVisualStateChecksum = visualStateChecksum();
    state.currentVisualStateChecksum = state.initialVisualStateChecksum;
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = canvasHost.querySelector('canvas');
    const compactBadge = document.querySelector('.mission-stage .library-badge');
    const badgeRect = compactBadge?.getBoundingClientRect();
    const targetGeometryValid = state.targetEvidence.length === 4
      && state.targetEvidence.every(target => target.pixelCount >= 8
        && target.u > .08 && target.u < .92 && target.v > .08 && target.v < .92);
    const passed = state.ready
      && state.claimedLibrary === 'p5@2.3.0'
      && state.mechanism === 'committed-multispectral-pixels-cluster-anomalies-and-human-aimed-beam-reveals-their-annotations'
      && state.automaticCycle === false
      && state.automaticPlayback === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.syntheticInputDispatch === false
      && state.captureClockDriven === false
      && state.renderIgnoresPreviewClock === true
      && state.userInputRequired === true
      && state.initialFrameStatic === true
      && state.initialStaticConfirmed === true
      && state.previewClockMutationCount === 0
      && state.previewClockIgnoredCount >= 1
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin === true
      && state.assetByteLength === 274991
      && state.assetShaMatchesExpected === true
      && state.browserImageDecoded === true
      && state.sourceNaturalWidth === 960
      && state.sourceNaturalHeight === 640
      && state.p5ImageDecoded === true
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === 960
      && state.p5ImageHeight === 640
      && state.p5ImagePixelLength === 960 * 640 * 4
      && state.sampledWidth === 96
      && state.sampledHeight === 54
      && state.sampledPixelCount === 96 * 54
      && state.sampledByteLength === 96 * 54 * 4
      && state.sourcePixelShaMatchesExpected === true
      && state.distinctSampleColorCount > 1200
      && state.warmMaskPixelCount >= 70
      && state.warmMaskPixelCount <= 180
      && state.rawWarmComponentCount >= 4
      && state.filteredWarmComponentCount === 4
      && state.targetCount === 4
      && state.targetCoordinateChecksumMatchesExpected === true
      && targetGeometryValid
      && sketch instanceof p5
      && canvas instanceof HTMLCanvasElement
      && canvas.getContext('2d') instanceof CanvasRenderingContext2D
      && state.p5InstanceReady === true
      && state.p5CanvasReady === true
      && state.p5CompletedDrawCount > 0
      && badgeRect && badgeRect.width < 190 && badgeRect.height < 50;
    state.runtimeAssertionPassed = Boolean(passed);
    stage.dataset.runtimeAssert = String(state.runtimeAssertionPassed);
    return state.runtimeAssertionPassed;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render: () => {
      state.renderCount += 1;
      state.previewClockRenderCount += 1;
      const checksumBefore = visualStateChecksum();
      if (dirty && state.pixelEvidenceReady) sketch.redraw();
      const checksumAfter = visualStateChecksum();
      if (checksumAfter === checksumBefore) state.previewClockIgnoredCount += 1;
      else state.previewClockMutationCount += 1;
      if (state.inputCount === 0 && state.initialVisualStateChecksum != null
        && checksumAfter === state.initialVisualStateChecksum) {
        state.initialStaticConfirmationCount += 1;
        state.initialStaticConfirmed = state.initialStaticConfirmationCount >= 1;
      }
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
