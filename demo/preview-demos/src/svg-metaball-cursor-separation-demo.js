import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#reclaim-stage');
  const svg = document.querySelector('#topology-svg');
  const topologyNodes = [...document.querySelectorAll('.topology-node')];
  const specimenNodes = [...document.querySelectorAll('.specimen-node')];
  const specimenRings = [...document.querySelectorAll('.specimen-ring')];
  const callouts = [...document.querySelectorAll('.node-callout')];
  const materialImages = [...document.querySelectorAll('.material-source')];
  const materialKeys = [...document.querySelectorAll('.material-key')];
  const topologyStatus = document.querySelector('#topology-status');
  const separationReadout = document.querySelector('#separation-readout');
  const meterFill = document.querySelector('#status-meter-fill');
  const ledger = document.querySelector('#runtime-ledger');
  const buttons = [...document.querySelectorAll('[data-sort-action]')];
  const lockButton = document.querySelector('[data-sort-action="lock"]');
  const assetUrl = new URL('../assets/aesthetic-wave-07/svg-metaball-cursor-separation/material-recovery-inspection-tray.jpg', import.meta.url).href;

  const expectedAssetSha256 = '82e14d32428c48fea6267c9a954e8696965dc6ca73a8428554291ebd0f95ac39';
  const expectedWidth = 960;
  const expectedHeight = 640;
  const sampleWidth = 96;
  const sampleHeight = 64;
  const sourcePixelCount = sampleWidth * sampleHeight;
  const initialSeparation = .18;
  const initialRotation = 0;
  const center = Object.freeze({ x: 211, y: 100 });
  const baseAngles = Object.freeze([-2.55, -.59, 2.55, .59]);
  const sampleRegions = Object.freeze([
    { x: 10, y: 5, width: 34, height: 23 },
    { x: 52, y: 5, width: 34, height: 23 },
    { x: 10, y: 35, width: 34, height: 23 },
    { x: 52, y: 35, width: 34, height: 23 }
  ]);
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'svg-metaball-cursor-separation',
    task: 'human-operated-material-recovery-batch-topology-separation',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'paused-motion-controls-seek-four-pixel-classified-svg-nodes-inside-feGaussianBlur-feColorMatrix-metaball-topology',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'visible-buttons'],
    userInputRequired: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    controlsBuiltWithoutAutoplay: true,
    reducedMotion: reducedMotionQuery.matches,
    inputCount: 0,
    humanInputCausalityCount: 0,
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
    mergeActionCount: 0,
    separateActionCount: 0,
    lockActionCount: 0,
    resetCount: 0,
    rejectedUntrustedInputCount: 0,
    ignoredInputCount: 0,
    activePointerId: null,
    pointerCaptured: false,
    dragging: false,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    separation: initialSeparation,
    maximumSeparation: initialSeparation,
    rotation: initialRotation,
    batchLocked: false,
    focusedMaterialIndex: -1,
    connectedComponentCount: 1,
    bridgeCount: 6,
    topologyState: 'fused',
    nodePositions: [],
    nodeRadii: [24, 24, 24, 24],
    initialGeometryChecksum: null,
    currentGeometryChecksum: null,
    maximumGeometryChecksum: 0,
    initialStaticConfirmed: false,
    initialStaticConfirmationCount: 0,
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
    sourcePixelWidth: sampleWidth,
    sourcePixelHeight: sampleHeight,
    sourcePixelCount: 0,
    sourcePixelByteLength: 0,
    sourcePixelSha256: null,
    distinctSampleColorCount: 0,
    materialRegionSampleCount: 0,
    materialRegionPixelCount: 0,
    materialIdentityCount: 0,
    materialClasses: [],
    materialEvidence: [],
    materialEvidenceChecksum: 0,
    materialEvidenceReady: false,
    svgRootClass: null,
    svgFilterElementCount: 0,
    gaussianBlurPrimitiveCount: 0,
    colorMatrixPrimitiveCount: 0,
    topologyNodeCount: 0,
    specimenNodeCount: 0,
    renderCount: 0,
    previewClockCallCount: 0,
    previewClockIgnoredCount: 0,
    previewClockMutationCount: 0,
    runtimeAssertionPassed: false,
    runtimeAssertCount: 0,
    motionControlCount: 0,
    motionSeekCount: 0,
    motionTimeSpread: 0,
    motionControlsPaused: false,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let materialEvidence = [];
  let motionControls = [];

  function invariant(condition, message) {
    if (!condition) throw new Error(`svg-metaball-cursor-separation: ${message}`);
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

  function fnvText(checksum, value) {
    for (let index = 0; index < value.length; index += 1) checksum = fnvMix(checksum, value.charCodeAt(index));
    return checksum;
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

  function classifyMaterial(red, green, blue, luma, saturation) {
    if (blue > red * 2.2 && blue > green * 1.75) return { className: 'Cobalt glass', shortName: 'GLASS' };
    if (green > red * 1.12 && green > blue * 1.55) return { className: 'Polymer flake', shortName: 'POLYMER' };
    if (luma > .52 && saturation < .32) return { className: 'Paper fibre', shortName: 'FIBRE' };
    if (red > green * 1.2 && red > blue * 1.8) return { className: 'Copper granulate', shortName: 'COPPER' };
    return { className: 'Manual review', shortName: 'REVIEW' };
  }

  function analyseRegion(pixels, region, regionIndex) {
    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;
    let lumaTotal = 0;
    let lumaSquaredTotal = 0;
    let colorfulnessTotal = 0;
    let pixelCount = 0;
    for (let y = region.y; y < region.y + region.height; y += 1) {
      for (let x = region.x; x < region.x + region.width; x += 1) {
        const offset = (y * sampleWidth + x) * 4;
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const luma = (red * .2126 + green * .7152 + blue * .0722) / 255;
        const maximum = Math.max(red, green, blue);
        const minimum = Math.min(red, green, blue);
        const saturation = maximum === 0 ? 0 : (maximum - minimum) / maximum;
        redTotal += red;
        greenTotal += green;
        blueTotal += blue;
        lumaTotal += luma;
        lumaSquaredTotal += luma * luma;
        colorfulnessTotal += saturation;
        pixelCount += 1;
      }
    }
    const red = redTotal / pixelCount;
    const green = greenTotal / pixelCount;
    const blue = blueTotal / pixelCount;
    const luma = lumaTotal / pixelCount;
    const lumaDeviation = Math.sqrt(Math.max(0, lumaSquaredTotal / pixelCount - luma * luma));
    const saturation = colorfulnessTotal / pixelCount;
    const identity = classifyMaterial(red, green, blue, luma, saturation);
    const confidence = Math.round(clamp(.74 + saturation * .16 + lumaDeviation * .48, .76, .98) * 100);
    const radius = clamp(22.8 + lumaDeviation * 14 + saturation * 1.8, 23.2, 26.2);
    return {
      index: regionIndex,
      code: `R-${String(regionIndex + 1).padStart(2, '0')}`,
      ...identity,
      averageRed: Number(red.toFixed(3)),
      averageGreen: Number(green.toFixed(3)),
      averageBlue: Number(blue.toFixed(3)),
      meanLuma: Number(luma.toFixed(6)),
      lumaDeviation: Number(lumaDeviation.toFixed(6)),
      meanSaturation: Number(saturation.toFixed(6)),
      confidence,
      pixelCount,
      radius: Number(radius.toFixed(4)),
      sourceRegion: { ...region }
    };
  }

  async function fetchAndAnalyseAsset() {
    const response = await fetch(assetUrl, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `material inspection tray request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === expectedAssetSha256;
    invariant(state.assetSameOrigin, 'material inspection tray was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'material inspection tray SHA-256 differs from the committed asset');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const image = new Image();
    image.src = objectUrl;
    try {
      await image.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = image.naturalWidth;
      state.sourceNaturalHeight = image.naturalHeight;
      invariant(image.naturalWidth === expectedWidth && image.naturalHeight === expectedHeight,
        `expected a ${expectedWidth}x${expectedHeight} material inspection tray`);

      const canvas = document.createElement('canvas');
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      invariant(context instanceof CanvasRenderingContext2D, '2D pixel sampling context was unavailable');
      context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
      const pixels = new Uint8ClampedArray(context.getImageData(0, 0, sampleWidth, sampleHeight).data);
      state.sourcePixelCount = sourcePixelCount;
      state.sourcePixelByteLength = pixels.byteLength;
      state.sourcePixelSha256 = await digestHex(pixels);

      const distinctColors = new Set();
      for (let offset = 0; offset < pixels.length; offset += 4) {
        distinctColors.add(`${pixels[offset] >> 3}:${pixels[offset + 1] >> 3}:${pixels[offset + 2] >> 3}`);
      }
      state.distinctSampleColorCount = distinctColors.size;

      materialEvidence = sampleRegions.map((region, index) => analyseRegion(pixels, region, index));
      state.materialRegionSampleCount = materialEvidence.length;
      state.materialRegionPixelCount = materialEvidence.reduce((sum, evidence) => sum + evidence.pixelCount, 0);
      state.materialClasses = materialEvidence.map(evidence => evidence.className);
      state.materialIdentityCount = new Set(state.materialClasses).size;
      state.nodeRadii = materialEvidence.map(evidence => evidence.radius);
      state.materialEvidence = materialEvidence.map(evidence => ({ ...evidence }));

      let checksum = 2166136261;
      for (const evidence of materialEvidence) {
        checksum = fnvText(checksum, evidence.className);
        checksum = fnvMix(checksum, Math.round(evidence.averageRed * 100));
        checksum = fnvMix(checksum, Math.round(evidence.averageGreen * 100));
        checksum = fnvMix(checksum, Math.round(evidence.averageBlue * 100));
        checksum = fnvMix(checksum, evidence.confidence);
        checksum = fnvMix(checksum, evidence.pixelCount);
      }
      state.materialEvidenceChecksum = checksum >>> 0;
      state.materialEvidenceReady = true;

      materialImages.forEach(node => node.setAttribute('href', assetUrl));
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function geometryFor(separation = state.separation, rotation = state.rotation) {
    const spread = 4 + separation * 58;
    return baseAngles.map((angle, index) => {
      const resolvedAngle = angle + rotation;
      return {
        index,
        x: center.x + Math.cos(resolvedAngle) * spread,
        y: center.y + Math.sin(resolvedAngle) * spread,
        radius: state.nodeRadii[index]
      };
    });
  }

  function connectedTopology(positions) {
    const adjacency = positions.map(() => []);
    let bridgeCount = 0;
    for (let left = 0; left < positions.length; left += 1) {
      for (let right = left + 1; right < positions.length; right += 1) {
        const distance = Math.hypot(positions[left].x - positions[right].x, positions[left].y - positions[right].y);
        const bridgeDistance = positions[left].radius + positions[right].radius + 9.5;
        if (distance <= bridgeDistance) {
          adjacency[left].push(right);
          adjacency[right].push(left);
          bridgeCount += 1;
        }
      }
    }

    const visited = new Set();
    let components = 0;
    for (let index = 0; index < positions.length; index += 1) {
      if (visited.has(index)) continue;
      components += 1;
      const pending = [index];
      while (pending.length) {
        const current = pending.pop();
        if (visited.has(current)) continue;
        visited.add(current);
        pending.push(...adjacency[current]);
      }
    }
    return { components, bridgeCount };
  }

  function geometryChecksum(positions = state.nodePositions) {
    let checksum = 2166136261;
    checksum = fnvMix(checksum, Math.round(state.separation * 100000));
    checksum = fnvMix(checksum, Math.round((state.rotation + 1) * 100000));
    checksum = fnvMix(checksum, state.batchLocked ? 1 : 0);
    checksum = fnvMix(checksum, state.connectedComponentCount);
    checksum = fnvMix(checksum, state.bridgeCount);
    for (const position of positions) {
      checksum = fnvMix(checksum, Math.round(position.x * 100));
      checksum = fnvMix(checksum, Math.round(position.y * 100));
      checksum = fnvMix(checksum, Math.round(position.radius * 100));
    }
    return checksum >>> 0;
  }

  function setCircleGeometry(node, position, radiusOffset = 0) {
    node.setAttribute('cx', position.x.toFixed(3));
    node.setAttribute('cy', position.y.toFixed(3));
    node.setAttribute('r', (position.radius + radiusOffset).toFixed(3));
  }

  function updateCallout(callout, position, evidence) {
    const line = callout.querySelector('.node-guide');
    const code = callout.querySelector('.node-code');
    const name = callout.querySelector('.node-name');
    line.setAttribute('x1', position.x.toFixed(2));
    line.setAttribute('y1', (position.y - 7).toFixed(2));
    line.setAttribute('x2', position.x.toFixed(2));
    line.setAttribute('y2', (position.y + 7).toFixed(2));
    code.setAttribute('x', position.x.toFixed(2));
    code.setAttribute('y', (position.y - 1.5).toFixed(2));
    code.setAttribute('text-anchor', 'middle');
    name.setAttribute('x', position.x.toFixed(2));
    name.setAttribute('y', (position.y + 5).toFixed(2));
    name.setAttribute('text-anchor', 'middle');
    code.textContent = evidence?.code ?? `R-${String(position.index + 1).padStart(2, '0')}`;
    name.textContent = evidence?.shortName ?? 'PIXEL SCAN';
    callout.style.opacity = String(clamp((state.separation - .34) / .28, 0, 1));
  }

  function updateInterface() {
    const percentage = Math.round(state.separation * 100);
    if (state.batchLocked) topologyStatus.textContent = state.connectedComponentCount === 4 ? 'SORT PLAN LOCKED' : 'REVIEW LOCKED';
    else if (state.connectedComponentCount === 1) topologyStatus.textContent = 'FUSED INTAKE';
    else if (state.connectedComponentCount === 4) topologyStatus.textContent = '4 STREAMS READY';
    else topologyStatus.textContent = `${state.connectedComponentCount} STREAMS BRIDGED`;
    separationReadout.textContent = `${percentage}% SEPARATED`;
    meterFill.style.width = `${percentage}%`;
    stage.dataset.locked = String(state.batchLocked);
    stage.dataset.topology = state.topologyState;
    lockButton.textContent = state.batchLocked ? 'Unlock' : 'Lock split';

    const accepted = state.connectedComponentCount === 4 && state.separation >= .88;
    stage.setAttribute('aria-label', `${accepted ? 'Four recovery streams separated' : 'Mixed material batch'} at ${percentage} percent separation. ${state.batchLocked ? 'Sorting plan locked.' : 'Move or drag horizontally to separate; arrow keys adjust; Enter locks.'}`);

    materialKeys.forEach((key, index) => {
      const evidence = materialEvidence[index];
      if (!evidence) return;
      key.querySelector('span').textContent = `${evidence.code} · ${evidence.confidence}%`;
      key.querySelector('strong').textContent = evidence.className;
      key.style.borderTopColor = `rgba(${Math.round(evidence.averageRed)}, ${Math.round(evidence.averageGreen)}, ${Math.round(evidence.averageBlue)}, .78)`;
    });

    ledger.value = JSON.stringify({
      separation: Number(state.separation.toFixed(4)),
      rotation: Number(state.rotation.toFixed(4)),
      locked: state.batchLocked,
      topology: state.topologyState,
      components: state.connectedComponentCount,
      bridges: state.bridgeCount,
      materialClasses: state.materialClasses,
      materialEvidenceChecksum: state.materialEvidenceChecksum,
      sourcePixelSha256: state.sourcePixelSha256,
      inputCount: state.inputCount,
      pointerMoves: state.pointerMoveCount,
      captures: state.pointerCaptureCount,
      releases: state.pointerReleaseCount,
      keyboardInputs: state.keyboardInputCount,
      buttonActivations: state.buttonActivationCount,
      runtimeAssert: state.runtimeAssertionPassed
    });
  }

  function renderGeometry() {
    const positions = geometryFor();
    const topology = connectedTopology(positions);
    state.nodePositions = positions.map(position => ({
      index: position.index,
      x: Number(position.x.toFixed(4)),
      y: Number(position.y.toFixed(4)),
      radius: Number(position.radius.toFixed(4))
    }));
    state.connectedComponentCount = topology.components;
    state.bridgeCount = topology.bridgeCount;
    state.topologyState = topology.components === 1 ? 'fused' : topology.components === 4 ? 'separated' : 'bridged';

    positions.forEach((position, index) => {
      setCircleGeometry(topologyNodes[index], position, 2.2);
      setCircleGeometry(specimenNodes[index], position, 0);
      setCircleGeometry(specimenRings[index], position, 2.6);
      specimenNodes[index].style.stroke = index === state.focusedMaterialIndex ? '#b9ff6a' : 'rgba(239, 255, 227, .84)';
      specimenNodes[index].style.strokeWidth = index === state.focusedMaterialIndex ? '1.45' : '.75';
      updateCallout(callouts[index], position, materialEvidence[index]);
    });

    state.currentGeometryChecksum = geometryChecksum(state.nodePositions);
    state.maximumGeometryChecksum = Math.max(state.maximumGeometryChecksum, state.currentGeometryChecksum);
    updateInterface();
  }

  function buildPausedMotionControls() {
    motionControls = topologyNodes.map(() => {
      const control = animate(0, 1, {
        duration: 1,
        ease: 'linear',
        autoplay: false
      });
      control.time = initialSeparation;
      return control;
    });
    state.motionControlCount = motionControls.length;
    state.motionControlsPaused = motionControls.every(control => control.playState !== 'running');
    invariant(state.motionControlCount === 4 && state.motionControlsPaused,
      'four paused Motion controls are required for the SVG recovery nodes');
  }

  function seekPausedMotionControls(progress) {
    motionControls.forEach(control => { control.time = progress; });
    state.motionSeekCount += motionControls.length;
    const times = motionControls.map(control => control.time);
    state.motionTimeSpread = Math.max(...times) - Math.min(...times);
    state.motionControlsPaused = motionControls.every(control => control.playState !== 'running');
  }

  function setHumanGeometry(separation, rotation, cause) {
    if (state.batchLocked && !cause.startsWith('button-lock') && !cause.startsWith('keyboard-Enter')) return false;
    const nextSeparation = clamp(separation);
    const nextRotation = clamp(rotation, -.28, .28);
    const changed = Math.abs(nextSeparation - state.separation) > .0001 || Math.abs(nextRotation - state.rotation) > .0001;
    state.separation = nextSeparation;
    state.rotation = nextRotation;
    state.maximumSeparation = Math.max(state.maximumSeparation, nextSeparation);
    if (changed) {
      state.humanInputCausalityCount += 1;
      seekPausedMotionControls(nextSeparation);
    }
    renderGeometry();
    return changed;
  }

  function eventPoint(event) {
    const rect = stage.getBoundingClientRect();
    return {
      u: clamp((event.clientX - rect.left) / Math.max(1, rect.width)),
      v: clamp((event.clientY - rect.top) / Math.max(1, rect.height))
    };
  }

  function geometryFromPoint(point, cause) {
    const separation = clamp((point.u - .31) / .64);
    const rotation = clamp((point.v - .5) * .6, -.28, .28);
    const positions = geometryFor(separation, rotation);
    let nearestIndex = -1;
    let nearestDistance = Infinity;
    const logicalPointer = { x: point.u * 320, y: point.v * 180 };
    positions.forEach((position, index) => {
      const distance = Math.hypot(position.x - logicalPointer.x, position.y - logicalPointer.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    state.focusedMaterialIndex = nearestDistance <= 42 ? nearestIndex : -1;
    return setHumanGeometry(separation, rotation, cause);
  }

  stage.addEventListener('pointerenter', event => {
    if (event.target.closest('button') || !recordTrustedInput(event, 'pointer-enter')) return;
    state.pointerEnterCount += 1;
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest('button') || !recordTrustedInput(event, state.dragging ? 'pointer-drag' : 'pointer-hover')) return;
    state.pointerMoveCount += 1;
    const changed = geometryFromPoint(eventPoint(event), state.dragging ? 'pointer-drag' : 'pointer-hover');
    if (changed) {
      if (state.dragging) state.dragMutationCount += 1;
      else state.hoverMutationCount += 1;
    }
  });

  stage.addEventListener('pointerleave', event => {
    if (state.dragging || event.target.closest('button')) return;
    state.focusedMaterialIndex = -1;
    renderGeometry();
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || !recordTrustedInput(event, 'pointer-down')) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.dragging = true;
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    geometryFromPoint(eventPoint(event), 'pointer-down');
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
    renderGeometry();
  }

  stage.addEventListener('pointerup', event => releasePointer(event, false));
  stage.addEventListener('pointercancel', event => releasePointer(event, true));

  stage.addEventListener('keydown', event => {
    if (event.target.closest('button') || !recordTrustedInput(event, `keyboard-${event.key}`)) return;
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(event.key);
    if (!handled) {
      state.ignoredInputCount += 1;
      return;
    }
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (event.key === 'ArrowLeft') setHumanGeometry(state.separation - .1, state.rotation, 'keyboard-ArrowLeft');
    else if (event.key === 'ArrowRight') setHumanGeometry(state.separation + .1, state.rotation, 'keyboard-ArrowRight');
    else if (event.key === 'ArrowUp') setHumanGeometry(state.separation, state.rotation - .055, 'keyboard-ArrowUp');
    else if (event.key === 'ArrowDown') setHumanGeometry(state.separation, state.rotation + .055, 'keyboard-ArrowDown');
    else if (event.key === 'Home') setHumanGeometry(0, 0, 'keyboard-Home');
    else if (event.key === 'End') setHumanGeometry(1, 0, 'keyboard-End');
    else if (event.key === 'Escape') {
      state.batchLocked = false;
      state.resetCount += 1;
      setHumanGeometry(initialSeparation, initialRotation, 'keyboard-Escape');
    } else {
      state.batchLocked = !state.batchLocked;
      state.lockActionCount += 1;
      state.humanInputCausalityCount += 1;
      renderGeometry();
    }
  });

  for (const button of buttons) {
    button.addEventListener('click', event => {
      if (!recordTrustedInput(event, `button-${button.dataset.sortAction}`)) return;
      state.buttonActivationCount += 1;
      const action = button.dataset.sortAction;
      if (action === 'merge') {
        state.batchLocked = false;
        state.mergeActionCount += 1;
        setHumanGeometry(.04, 0, 'button-merge');
      } else if (action === 'separate') {
        state.batchLocked = false;
        state.separateActionCount += 1;
        setHumanGeometry(.96, 0, 'button-separate');
      } else if (action === 'lock') {
        state.batchLocked = !state.batchLocked;
        state.lockActionCount += 1;
        state.humanInputCausalityCount += 1;
        renderGeometry();
      }
    });
  }

  const ready = Promise.all([fetchAndAnalyseAsset(), document.fonts.ready]).then(() => {
    state.svgRootClass = svg.constructor.name;
    state.svgFilterElementCount = svg.querySelectorAll('filter').length;
    state.gaussianBlurPrimitiveCount = svg.querySelectorAll('feGaussianBlur').length;
    state.colorMatrixPrimitiveCount = svg.querySelectorAll('feColorMatrix').length;
    state.topologyNodeCount = topologyNodes.length;
    state.specimenNodeCount = specimenNodes.length;
    invariant(state.assetByteLength > 250000 && state.assetByteLength < 500000,
      'material inspection tray byte size is outside the committed evidence range');
    invariant(state.sourcePixelCount === sourcePixelCount && state.sourcePixelByteLength === sourcePixelCount * 4,
      'material inspection tray pixel sampling is incomplete');
    invariant(state.sourcePixelSha256?.length === 64 && !/^0+$/.test(state.sourcePixelSha256),
      'derived material pixel digest is missing');
    invariant(state.distinctSampleColorCount > 400 && state.distinctSampleColorCount < sourcePixelCount,
      'material inspection tray lacks usable sampled colour variation');
    invariant(state.materialRegionSampleCount === 4 && state.materialRegionPixelCount === 3128,
      'four material regions were not fully sampled');
    invariant(state.materialIdentityCount === 4
      && state.materialClasses.includes('Cobalt glass')
      && state.materialClasses.includes('Copper granulate')
      && state.materialClasses.includes('Polymer flake')
      && state.materialClasses.includes('Paper fibre'),
    'source pixels did not resolve four distinct recovery identities');
    invariant(state.materialEvidenceChecksum > 0, 'material evidence checksum is missing');
    invariant(state.svgRootClass === 'SVGSVGElement'
      && state.gaussianBlurPrimitiveCount >= 1
      && state.colorMatrixPrimitiveCount >= 1
      && state.topologyNodeCount === 4
      && state.specimenNodeCount === 4,
    'SVG metaball mechanism is incomplete');
    buildPausedMotionControls();
    state.ready = true;
    renderGeometry();
    state.initialGeometryChecksum = state.currentGeometryChecksum;
    state.initialStaticConfirmed = true;
    state.initialStaticConfirmationCount += 1;
  });

  function renderFromPreviewClock() {
    state.previewClockCallCount += 1;
    state.previewClockIgnoredCount += 1;
    state.renderCount += 1;
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    const before = geometryChecksum();
    renderFromPreviewClock(0);
    renderFromPreviewClock(2.75);
    const after = geometryChecksum();
    state.runtimeAssertCount += 1;
    const passed = state.ready
      && state.claimedLibrary === 'motion@12.42.2'
      && state.userInputRequired
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetByteLength === 362959
      && state.assetSha256 === expectedAssetSha256
      && state.assetShaMatchesExpected
      && state.browserImageDecoded
      && state.sourceNaturalWidth === expectedWidth
      && state.sourceNaturalHeight === expectedHeight
      && state.sourcePixelCount === sourcePixelCount
      && state.sourcePixelByteLength === sourcePixelCount * 4
      && state.sourcePixelSha256?.length === 64
      && state.materialIdentityCount === 4
      && state.materialEvidence.length === 4
      && state.materialEvidenceChecksum > 0
      && state.svgRootClass === 'SVGSVGElement'
      && state.gaussianBlurPrimitiveCount >= 1
      && state.colorMatrixPrimitiveCount >= 1
      && state.topologyNodeCount === 4
      && state.specimenNodeCount === 4
      && state.motionControlCount === 4
      && state.motionControlsPaused
      && state.motionTimeSpread === 0
      && motionControls.every(control => control.playState !== 'running')
      && state.initialStaticConfirmed
      && state.previewClockMutationCount === 0
      && state.renderIgnoresPreviewClock
      && before === after;
    state.runtimeAssertionPassed = passed;
    updateInterface();
    return passed;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'svg',
    render: renderFromPreviewClock,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
