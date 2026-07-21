import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#ribbon-stage');
  const host = document.querySelector('#ribbon-host');
  const archiveState = document.querySelector('#archive-state');
  const frameNumber = document.querySelector('#frame-number');
  const frameLight = document.querySelector('#frame-light');
  const frameTitle = document.querySelector('#frame-title');
  const frameSequence = document.querySelector('#frame-sequence');
  const motionState = document.querySelector('#motion-state');
  const motionSource = document.querySelector('#motion-source');
  const inspectionBadge = document.querySelector('#inspection-badge');
  const inspectButton = document.querySelector('#inspect-button');
  const resetButton = document.querySelector('#reset-button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !host || !inspectButton || !resetButton) throw new Error('Tidal Archive ribbon DOM is incomplete.');

  const frames = [
    { title: 'Dawn approach', light: '06:12', file: '01-dawn-approach.jpg' },
    { title: 'Cobalt threshold', light: '06:37', file: '02-cobalt-threshold.jpg' },
    { title: 'Circular light well', light: '08:04', file: '03-circular-lightwell.jpg' },
    { title: 'Material junction', light: '11:26', file: '04-material-junction.jpg' },
    { title: 'Blue-hour return', light: '18:43', file: '05-blue-hour-return.jpg' },
  ].map(frame => ({
    ...frame,
    url: new URL(`../assets/bending-webgl-gallery-ribbon/${frame.file}`, import.meta.url).href,
  }));
  const DEFAULT_POSITION = 2;
  const DEFAULT_BEND = .68;
  const SEGMENTS = 18;
  const EXPECTED_WIDTH = 720;
  const EXPECTED_HEIGHT = 900;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const round = (value, digits = 5) => Number(value.toFixed(digits));

  const state = {
    id: 'bending-webgl-gallery-ribbon',
    task: 'tidal-archive-film-review',
    userInputRequired: true,
    automaticCruise: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockDriven: false,
    syntheticInputDispatch: false,
    userOwnedPosition: true,
    finiteInputInertiaOnly: true,
    firstFrameStatic: true,
    initialStaticVerified: false,
    acceptedInputs: ['wheel', 'mouse', 'touch', 'pen', 'keyboard', 'control'],
    boundaryPolicy: 'release-outward-wheel-at-first-and-last-frame',
    position: DEFAULT_POSITION,
    velocity: 0,
    bendSetting: DEFAULT_BEND,
    dynamicBend: DEFAULT_BEND,
    activeIndex: DEFAULT_POSITION,
    inspectedIndex: null,
    resultState: 'browsing',
    inputKind: 'none',
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedCount: 0,
    wheelInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    controlInputCount: 0,
    positionMutationCount: 0,
    bendMutationCount: 0,
    inspectionCount: 0,
    inspectionClearCount: 0,
    resetCount: 0,
    positiveInputCount: 0,
    negativeInputCount: 0,
    reversalCount: 0,
    lastDirection: 0,
    boundaryAttemptCount: 0,
    startBoundaryCount: 0,
    endBoundaryCount: 0,
    wheelBoundaryReleaseCount: 0,
    lastBoundary: null,
    lastWheelDefaultPrevented: null,
    pointerCaptured: false,
    activePointerId: null,
    activePointerType: null,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    dragUpdateCount: 0,
    inertiaActive: false,
    inertiaStartCount: 0,
    inertiaStepCount: 0,
    inertiaSettleCount: 0,
    inertiaBoundaryCount: 0,
    reducedMotion: reducedMotion.matches,
    reducedMotionDiscreteNavigation: true,
    assetCount: frames.length,
    assetDecodedCount: 0,
    assetDimensionsValid: false,
    assetChecksums: [],
    assetChecksumsUnique: false,
    sampledPixelCount: 0,
    textureImagesReady: false,
    p5Ready: false,
    webglReady: false,
    webglVersion: 'none',
    texturedPanelCount: 0,
    meshVertexCount: 0,
    expectedMeshVertexCount: frames.length * SEGMENTS * 4,
    lastDrawnPosition: DEFAULT_POSITION,
    lastDrawnBend: DEFAULT_BEND,
    drawCount: 0,
    redrawRequestCount: 0,
    previewRenderCount: 0,
    resizeCount: 0,
    revision: 0,
    drawnRevision: -1,
    ledger: [],
    lastLedgerEntry: null,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let decodedImages = [];
  let images = [];
  let sketch;
  let canvas;
  let gl;
  let dragSession = null;
  let latestPointerType = 'mouse';
  let lastRealtime = null;
  let resizeFrame = 0;

  function recordLedger(entry) {
    const next = {
      ...entry,
      inputCountAtEntry: state.inputCount,
      position: round(state.position),
      velocity: round(state.velocity),
      bend: round(state.dynamicBend),
      trusted: true,
    };
    state.ledger.push(next);
    if (state.ledger.length > 48) state.ledger.shift();
    state.lastLedgerEntry = next;
  }

  function recordInput(kind, event, cause) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedCount += 1;
      return false;
    }
    state.inputKind = kind;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (kind === 'wheel') state.wheelInputCount += 1;
    else if (kind === 'keyboard') state.keyboardInputCount += 1;
    else if (kind === 'control') state.controlInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (kind === 'touch') state.touchInputCount += 1;
      if (kind === 'pen') state.penInputCount += 1;
    }
    recordLedger({ type: 'input', cause, kind });
    return true;
  }

  function registerDirection(direction, cause) {
    const directionSign = Math.sign(direction);
    if (!directionSign) return;
    if (directionSign > 0) state.positiveInputCount += 1;
    else state.negativeInputCount += 1;
    if (state.lastDirection && directionSign !== state.lastDirection) state.reversalCount += 1;
    state.lastDirection = directionSign;
    recordLedger({ type: 'direction', cause, direction: directionSign });
  }

  function requestDraw(cause) {
    if (!sketch || !state.p5Ready) return;
    state.redrawRequestCount += 1;
    state.revision += 1;
    state.lastDrawCause = cause;
    sketch.redraw();
  }

  function setPosition(nextPosition, cause, trustedOrigin = true) {
    const previous = state.position;
    const next = round(clamp(nextPosition, 0, frames.length - 1));
    if (Math.abs(next - previous) <= .000001) return false;
    state.position = next;
    state.activeIndex = Math.min(frames.length - 1, Math.max(0, Math.round(next)));
    state.positionMutationCount += 1;
    state.lastBoundary = null;
    if (state.inspectedIndex !== null && state.activeIndex !== state.inspectedIndex) clearInspection(`${cause}-leave-inspected`, trustedOrigin);
    recordLedger({ type: 'position', cause, from: round(previous), to: next, trustedOrigin });
    syncInterface();
    requestDraw(cause);
    return true;
  }

  function setBend(nextBend, cause, trustedOrigin = true) {
    const previous = state.bendSetting;
    const next = round(clamp(nextBend, .34, .92));
    if (Math.abs(next - previous) <= .000001) return false;
    state.bendSetting = next;
    state.dynamicBend = next;
    state.bendMutationCount += 1;
    recordLedger({ type: 'bend', cause, from: previous, to: next, trustedOrigin });
    syncInterface();
    requestDraw(cause);
    return true;
  }

  function noteBoundary(boundary, cause, wheelReleased = false) {
    state.boundaryAttemptCount += 1;
    state.lastBoundary = boundary;
    if (boundary === 'start') state.startBoundaryCount += 1;
    else state.endBoundaryCount += 1;
    if (wheelReleased) state.wheelBoundaryReleaseCount += 1;
    recordLedger({ type: 'boundary', cause, boundary, wheelReleased });
    syncInterface();
  }

  function startInertia(velocity, cause) {
    if (reducedMotion.matches) {
      state.velocity = 0;
      state.inertiaActive = false;
      state.dynamicBend = state.bendSetting;
      return;
    }
    const next = clamp(velocity, -3.2, 3.2);
    if (Math.abs(next) < .02) return;
    state.velocity = next;
    state.inertiaActive = true;
    state.inertiaStartCount += 1;
    state.dynamicBend = clamp(state.bendSetting + Math.abs(next) * .055, .34, .98);
    recordLedger({ type: 'inertia-start', cause, initialVelocity: round(next) });
    syncInterface();
    requestDraw(cause);
  }

  function stopInertia(cause, record = true) {
    const wasActive = state.inertiaActive || Math.abs(state.velocity) > .0001;
    state.velocity = 0;
    state.inertiaActive = false;
    state.dynamicBend = state.bendSetting;
    if (wasActive && record) {
      state.inertiaSettleCount += 1;
      recordLedger({ type: 'inertia-settle', cause });
    }
    syncInterface();
    requestDraw(cause);
  }

  function clearInspection(cause, trustedOrigin = true) {
    if (state.inspectedIndex === null) return false;
    const previous = state.inspectedIndex;
    state.inspectedIndex = null;
    state.resultState = 'browsing';
    state.inspectionClearCount += 1;
    recordLedger({ type: 'inspection-clear', cause, previous, trustedOrigin });
    syncInterface();
    requestDraw(cause);
    return true;
  }

  function toggleInspection(cause) {
    stopInertia(`${cause}-stop`, false);
    if (state.inspectedIndex === state.activeIndex) {
      clearInspection(cause);
      return;
    }
    state.inspectedIndex = state.activeIndex;
    state.resultState = 'inspecting';
    state.inspectionCount += 1;
    recordLedger({ type: 'inspection-result', cause, resultIndex: state.inspectedIndex });
    syncInterface();
    requestDraw(cause);
  }

  function resetArchive(cause) {
    const changed = state.position !== DEFAULT_POSITION
      || state.bendSetting !== DEFAULT_BEND
      || state.inspectedIndex !== null
      || state.inertiaActive;
    state.velocity = 0;
    state.inertiaActive = false;
    state.position = DEFAULT_POSITION;
    state.bendSetting = DEFAULT_BEND;
    state.dynamicBend = DEFAULT_BEND;
    state.activeIndex = DEFAULT_POSITION;
    state.inspectedIndex = null;
    state.resultState = 'browsing';
    state.lastBoundary = null;
    if (changed) {
      state.resetCount += 1;
      state.positionMutationCount += 1;
      recordLedger({ type: 'reset-result', cause });
    }
    syncInterface();
    requestDraw(cause);
  }

  function syncInterface() {
    const frame = frames[state.activeIndex];
    const number = String(state.activeIndex + 1).padStart(2, '0');
    const speed = Math.abs(state.velocity);
    const direction = state.velocity > .02 ? 'Forward' : state.velocity < -.02 ? 'Reverse' : 'Still';
    const source = state.lastBoundary
      ? `${state.lastBoundary} boundary released`
      : state.pointerCaptured
        ? `${state.activePointerType} capture drag`
        : state.inputKind === 'none'
          ? 'Wheel / capture drag / arrows'
          : `${state.inputKind} input · ${state.reversalCount} reversals`;

    stage.dataset.inspecting = String(state.inspectedIndex !== null);
    stage.dataset.frame = String(state.activeIndex + 1);
    stage.dataset.result = state.resultState;
    host.dataset.dragging = String(state.pointerCaptured);
    host.setAttribute('aria-valuenow', String(state.activeIndex + 1));
    host.setAttribute('aria-valuetext', `Frame ${state.activeIndex + 1}, ${frame.title}${state.inspectedIndex === state.activeIndex ? ', inspecting' : ''}`);
    frameNumber.textContent = `${number} / 05`;
    frameLight.textContent = frame.light;
    frameTitle.textContent = frame.title;
    frameSequence.innerHTML = `${number} <span>/ 05</span>`;
    motionState.textContent = `${direction} · bend ${Math.round(state.dynamicBend * 100)}`;
    motionSource.textContent = source;
    archiveState.textContent = state.inspectedIndex === state.activeIndex
      ? `Inspecting · Frame ${number}`
      : state.inertiaActive
        ? `Browse · ${direction} ${speed.toFixed(2)}`
        : 'Browse · Ribbon at rest';
    inspectionBadge.hidden = state.inspectedIndex === null;
    if (state.inspectedIndex !== null) inspectionBadge.textContent = `Inspecting frame ${String(state.inspectedIndex + 1).padStart(2, '0')}`;
    inspectButton.textContent = state.inspectedIndex === state.activeIndex ? 'Close inspection' : 'Inspect frame';
    inspectButton.setAttribute('aria-pressed', String(state.inspectedIndex === state.activeIndex));
    resetButton.disabled = state.position === DEFAULT_POSITION
      && state.bendSetting === DEFAULT_BEND
      && state.inspectedIndex === null
      && !state.inertiaActive;
  }

  function sampleChecksum(image) {
    const sample = document.createElement('canvas');
    sample.width = 36;
    sample.height = 45;
    const context = sample.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, sample.width, sample.height);
    const sampledPixels = context.getImageData(0, 0, sample.width, sample.height).data;
    let hash = 2166136261;
    for (let index = 0; index < sampledPixels.length; index += 17) {
      hash ^= sampledPixels[index];
      hash = Math.imul(hash, 16777619);
    }
    state.sampledPixelCount += sampledPixels.length;
    return hash >>> 0;
  }

  async function decodeFrame(frame) {
    const image = new Image();
    image.decoding = 'async';
    image.src = frame.url;
    await image.decode();
    if (!image.complete || image.naturalWidth !== EXPECTED_WIDTH || image.naturalHeight !== EXPECTED_HEIGHT) {
      throw new Error(`Archive texture failed strict decode: ${frame.file} (${image.naturalWidth}×${image.naturalHeight}).`);
    }
    state.assetDecodedCount += 1;
    return image;
  }

  function drawCurvedMesh(p, panel, image, arc, height, depthOffset, alpha = 255) {
    const { centerAngle, radius, y } = panel;
    p.push();
    p.translate(0, y, depthOffset);
    if (image) {
      p.noStroke();
      p.tint(255, alpha);
      p.texture(image);
    } else {
      p.fill(panel.backing);
      p.noStroke();
    }
    p.beginShape(p.QUADS);
    for (let segment = 0; segment < SEGMENTS; segment += 1) {
      const u0 = segment / SEGMENTS;
      const u1 = (segment + 1) / SEGMENTS;
      const angle0 = centerAngle + (u0 - .5) * arc;
      const angle1 = centerAngle + (u1 - .5) * arc;
      const x0 = Math.sin(angle0) * radius;
      const z0 = Math.cos(angle0) * radius - radius;
      const x1 = Math.sin(angle1) * radius;
      const z1 = Math.cos(angle1) * radius - radius;
      p.vertex(x0, -height / 2, z0, u0, 0);
      p.vertex(x1, -height / 2, z1, u1, 0);
      p.vertex(x1, height / 2, z1, u1, 1);
      p.vertex(x0, height / 2, z0, u0, 1);
      if (image) state.meshVertexCount += 4;
    }
    p.endShape();
    p.pop();
  }

  function drawRibbon(p) {
    const radius = 400 - state.dynamicBend * 126;
    const imageHeight = 286;
    const imageWidth = imageHeight * (EXPECTED_WIDTH / EXPECTED_HEIGHT);
    const imageArc = imageWidth / radius;
    const stepArc = imageArc + .082;
    const panels = frames.map((frame, index) => {
      const centerAngle = (index - state.position) * stepArc;
      return {
        index,
        centerAngle,
        radius,
        depth: Math.cos(centerAngle) * radius - radius,
        y: Math.abs(Math.sin(centerAngle)) * 7,
        backing: index === state.inspectedIndex ? '#caff70' : index === state.activeIndex ? '#ece8df' : '#182126',
      };
    }).sort((a, b) => a.depth - b.depth);

    state.texturedPanelCount = 0;
    state.meshVertexCount = 0;
    p.clear();
    p.background('#080b0d');
    p.perspective(Math.PI / 3.2, Math.max(.1, p.width / p.height), 10, 1800);
    p.camera(0, 0, 410, 0, 0, -16, 0, 1, 0);
    p.textureMode(p.NORMAL);
    p.push();
    p.translate(10, -2, 0);
    panels.forEach(panel => {
      const active = panel.index === state.activeIndex;
      const inspected = panel.index === state.inspectedIndex;
      const angularDistance = Math.abs(panel.centerAngle);
      const alpha = inspected ? 255 : active ? 255 : Math.max(92, 230 - angularDistance * 76);
      const lift = inspected ? 22 : active ? 5 : 0;
      drawCurvedMesh(p, panel, null, imageArc + .055, imageHeight + 18, lift - 3);
      drawCurvedMesh(p, panel, images[panel.index], imageArc, imageHeight, lift, alpha);
      state.texturedPanelCount += 1;
    });
    p.pop();
    p.noTint();

    state.drawCount += 1;
    state.lastDrawnPosition = state.position;
    state.lastDrawnBend = state.dynamicBend;
    state.drawnRevision = state.revision;
  }

  function applyWheel(event) {
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX) || Math.abs(event.deltaY) < .2) return;
    if (!recordInput('wheel', event, 'wheel')) return;
    const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? Math.max(80, host.clientWidth)
        : 1;
    const delta = event.deltaY * scale;
    const direction = Math.sign(delta);
    registerDirection(direction, 'wheel');
    const atStart = state.position <= .000001 && direction < 0;
    const atEnd = state.position >= frames.length - 1 - .000001 && direction > 0;
    state.lastWheelDefaultPrevented = false;
    if (atStart || atEnd) {
      noteBoundary(atStart ? 'start' : 'end', 'wheel-outward', true);
      return;
    }
    event.preventDefault();
    state.lastWheelDefaultPrevented = true;
    const normalized = clamp(delta / 210, -.72, .72);
    if (reducedMotion.matches) {
      setPosition(Math.round(state.position) + direction, 'wheel-discrete');
      state.dynamicBend = state.bendSetting;
    } else {
      setPosition(state.position + normalized * .26, 'wheel-direct');
      startInertia(normalized * 3.2, 'wheel-inertia');
    }
  }

  document.addEventListener('pointerdown', event => {
    latestPointerType = event.pointerType || 'mouse';
  }, { capture: true });

  host.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || dragSession) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    const pointerType = event.pointerType || latestPointerType || 'mouse';
    if (!recordInput(pointerType, event, `${pointerType}-down`)) return;
    stopInertia(`${pointerType}-grab`, false);
    dragSession = {
      pointerId: event.pointerId,
      pointerType,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      startPosition: state.position,
      distance: 0,
      releaseVelocity: 0,
    };
    host.setPointerCapture(event.pointerId);
    state.pointerCaptured = true;
    state.activePointerId = event.pointerId;
    state.activePointerType = pointerType;
    state.pointerCaptureCount += 1;
    syncInterface();
  });

  host.addEventListener('pointermove', event => {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    event.preventDefault();
    if (!recordInput(dragSession.pointerType, event, `${dragSession.pointerType}-move`)) return;
    const deltaX = event.clientX - dragSession.lastX;
    const totalX = event.clientX - dragSession.startX;
    const deltaTime = Math.max(8, event.timeStamp - dragSession.lastTime) / 1000;
    const direction = Math.sign(-deltaX);
    if (Math.abs(deltaX) > .15) registerDirection(direction, `${dragSession.pointerType}-drag`);
    dragSession.distance = Math.max(dragSession.distance, Math.abs(totalX));
    dragSession.releaseVelocity = clamp((-deltaX / Math.max(80, host.clientWidth * .34)) / deltaTime, -3.2, 3.2);
    dragSession.lastX = event.clientX;
    dragSession.lastTime = event.timeStamp;
    state.dragUpdateCount += 1;
    const raw = dragSession.startPosition - totalX / Math.max(96, host.clientWidth * .42);
    const target = reducedMotion.matches ? Math.round(raw) : raw;
    const changed = setPosition(target, `${dragSession.pointerType}-drag`);
    if (!changed && direction && (target < 0 || target > frames.length - 1)) {
      noteBoundary(target < 0 ? 'start' : 'end', `${dragSession.pointerType}-drag-boundary`);
    }
    state.dynamicBend = reducedMotion.matches
      ? state.bendSetting
      : clamp(state.bendSetting + Math.abs(dragSession.releaseVelocity) * .055, .34, .98);
    syncInterface();
    requestDraw(`${dragSession.pointerType}-drag-bend`);
  });

  function finishPointer(event, cancelled = false) {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    const session = dragSession;
    const shouldRelease = host.hasPointerCapture?.(event.pointerId);
    dragSession = null;
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.activePointerType = null;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (shouldRelease) host.releasePointerCapture(event.pointerId);
    if (!cancelled && session.distance < 5 && recordInput(session.pointerType, event, `${session.pointerType}-tap`)) {
      toggleInspection(`${session.pointerType}-tap`);
    } else if (!cancelled && !reducedMotion.matches) {
      startInertia(session.releaseVelocity, `${session.pointerType}-release`);
    } else {
      state.dynamicBend = state.bendSetting;
      syncInterface();
      requestDraw(`${session.pointerType}-release-direct`);
    }
  }

  host.addEventListener('pointerup', event => finishPointer(event));
  host.addEventListener('pointercancel', event => finishPointer(event, true));
  host.addEventListener('lostpointercapture', event => {
    if (dragSession?.pointerId === event.pointerId) finishPointer(event, true);
  });
  stage.addEventListener('wheel', applyWheel, { passive: false });

  stage.addEventListener('keydown', event => {
    if (event.repeat) return;
    if (event.target instanceof HTMLButtonElement && (event.key === 'Enter' || event.key === ' ')) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ', 'Escape', 'r', 'R'].includes(event.key)) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, `keyboard-${event.key}`)) return;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      registerDirection(direction, `keyboard-${event.key}`);
      const target = reducedMotion.matches ? Math.round(state.position) + direction : state.position + direction * .18;
      const changed = setPosition(target, `keyboard-${event.key}`);
      if (!changed && (target < 0 || target > frames.length - 1)) noteBoundary(target < 0 ? 'start' : 'end', `keyboard-${event.key}`);
      if (!reducedMotion.matches && changed) startInertia(direction * 1.55, `keyboard-${event.key}-inertia`);
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      setBend(state.bendSetting + (event.key === 'ArrowUp' ? .08 : -.08), `keyboard-${event.key}`);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      stopInertia(`keyboard-${event.key}-stop`, false);
      setPosition(event.key === 'Home' ? 0 : frames.length - 1, `keyboard-${event.key}`);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      toggleInspection(`keyboard-${event.key === ' ' ? 'Space' : 'Enter'}`);
      return;
    }
    if (event.key === 'Escape') {
      clearInspection('keyboard-Escape');
      return;
    }
    resetArchive('keyboard-reset');
  });

  inspectButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'control';
    if (!recordInput(kind, event, `${kind}-inspect`)) return;
    toggleInspection(`${kind}-inspect`);
  });

  resetButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'control';
    if (!recordInput(kind, event, `${kind}-reset`)) return;
    resetArchive(`${kind}-reset`);
  });

  function stepInertia(nextTime) {
    if (!state.inertiaActive || reducedMotion.matches) {
      lastRealtime = nextTime;
      return false;
    }
    if (lastRealtime === null) {
      lastRealtime = nextTime;
      return false;
    }
    const delta = clamp(nextTime - lastRealtime, 0, .05);
    lastRealtime = nextTime;
    if (delta <= 0) return false;
    const before = state.position;
    const next = state.position + state.velocity * delta;
    const clamped = clamp(next, 0, frames.length - 1);
    state.position = round(clamped);
    state.activeIndex = Math.min(frames.length - 1, Math.max(0, Math.round(state.position)));
    state.positionMutationCount += Math.abs(state.position - before) > .000001 ? 1 : 0;
    state.velocity *= Math.exp(-4.9 * delta);
    state.dynamicBend = clamp(state.bendSetting + Math.abs(state.velocity) * .055, .34, .98);
    state.inertiaStepCount += 1;
    if (next !== clamped) {
      state.inertiaBoundaryCount += 1;
      noteBoundary(next < 0 ? 'start' : 'end', 'inertia-boundary');
      stopInertia('inertia-boundary');
    } else if (Math.abs(state.velocity) < .025) {
      stopInertia('inertia-decay');
    } else {
      syncInterface();
      requestDraw('inertia-step');
    }
    return true;
  }

  function scheduleResize() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (!sketch || !state.p5Ready) return;
      const width = Math.max(1, Math.round(host.clientWidth));
      const height = Math.max(1, Math.round(host.clientHeight));
      sketch.resizeCanvas(width, height, true);
      state.resizeCount += 1;
      requestDraw('resize');
    });
  }
  addEventListener('resize', scheduleResize);
  new ResizeObserver(scheduleResize).observe(host);

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches) {
      state.position = Math.round(state.position);
      state.activeIndex = state.position;
      stopInertia('reduced-motion-change', false);
    } else {
      syncInterface();
      requestDraw('reduced-motion-change');
    }
  });

  const assetsReady = Promise.all(frames.map(decodeFrame)).then(decoded => {
    decodedImages = decoded;
    state.assetDimensionsValid = decoded.every(image => image.naturalWidth === EXPECTED_WIDTH && image.naturalHeight === EXPECTED_HEIGHT);
    state.assetChecksums = decoded.map(sampleChecksum);
    state.assetChecksumsUnique = new Set(state.assetChecksums).size === decoded.length;
    const decodedAssetsValid = state.assetDecodedCount === frames.length
      && state.assetDimensionsValid
      && state.assetChecksumsUnique;
    if (!decodedAssetsValid) throw new Error('Archive textures failed decode, dimension, or uniqueness evidence.');
    return decoded;
  });

  const p5Ready = assetsReady.then(() => new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = async () => {
        try {
          p.pixelDensity(1);
          canvas = p.createCanvas(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), p.WEBGL).parent(host).elt;
          p.noLoop();
          images = await Promise.all(frames.map(frame => p.loadImage(frame.url)));
          state.textureImagesReady = images.length === frames.length
            && images.every(image => image instanceof p5.Image
              && image.width === EXPECTED_WIDTH
              && image.height === EXPECTED_HEIGHT);
          if (!state.textureImagesReady) throw new Error('p5 texture images failed strict load or dimension evidence.');
          gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          state.webglReady = Boolean(gl);
          state.webglVersion = gl instanceof WebGL2RenderingContext ? 'webgl2' : gl ? 'webgl1' : 'none';
          state.p5Ready = true;
          p.draw = () => drawRibbon(p);
          p.redraw();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
    }, host);
  }));

  const nextFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.all([p5Ready, document.fonts.ready])
    .then(nextFrames)
    .then(() => {
      syncInterface();
      const before = `${state.position}|${state.velocity}|${state.dynamicBend}|${state.activeIndex}|${state.inspectedIndex}|${state.positionMutationCount}|${state.inertiaStepCount}`;
      return nextFrames().then(() => {
        const after = `${state.position}|${state.velocity}|${state.dynamicBend}|${state.activeIndex}|${state.inspectedIndex}|${state.positionMutationCount}|${state.inertiaStepCount}`;
        state.initialStaticVerified = before === after
          && state.inputCount === 0
          && state.position === DEFAULT_POSITION
          && state.velocity === 0
          && state.inertiaStepCount === 0
          && state.drawCount >= 1;
        if (!state.initialStaticVerified) throw new Error(`Tidal Archive first frame changed without trusted input: ${before} -> ${after}.`);
      });
    });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    const stageRect = stage.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const activeFrame = frames[state.activeIndex];
    const allCounters = [
      state.inputCount, state.trustedInputCount, state.rejectedUntrustedCount, state.wheelInputCount,
      state.pointerInputCount, state.keyboardInputCount, state.touchInputCount, state.penInputCount,
      state.controlInputCount, state.positionMutationCount, state.bendMutationCount, state.inspectionCount,
      state.inspectionClearCount, state.resetCount, state.positiveInputCount, state.negativeInputCount,
      state.reversalCount, state.boundaryAttemptCount, state.startBoundaryCount, state.endBoundaryCount,
      state.wheelBoundaryReleaseCount, state.pointerCaptureCount, state.pointerReleaseCount,
      state.pointerCancelCount, state.dragUpdateCount, state.inertiaStartCount, state.inertiaStepCount,
      state.inertiaSettleCount, state.inertiaBoundaryCount, state.drawCount, state.redrawRequestCount,
      state.previewRenderCount, state.resizeCount,
    ];
    const inputEvidence = state.inputCount === state.trustedInputCount
      && state.inputCount === state.wheelInputCount + state.pointerInputCount + state.keyboardInputCount + state.controlInputCount
      && state.touchInputCount + state.penInputCount <= state.pointerInputCount
      && state.pointerReleaseCount + state.pointerCancelCount <= state.pointerCaptureCount
      && state.boundaryAttemptCount === state.startBoundaryCount + state.endBoundaryCount
      && state.wheelBoundaryReleaseCount <= state.boundaryAttemptCount
      && state.ledger.every(entry => entry.trusted === true && entry.inputCountAtEntry >= 0);
    const boundaryEvidence = state.lastBoundary === null
      || state.lastBoundary === 'start' && state.position === 0
      || state.lastBoundary === 'end' && state.position === frames.length - 1;
    const resultEvidence = state.inspectedIndex === null
      ? state.resultState === 'browsing' && inspectionBadge.hidden && inspectButton.getAttribute('aria-pressed') === 'false'
      : state.resultState === 'inspecting'
        && state.inspectedIndex === state.activeIndex
        && !inspectionBadge.hidden
        && inspectButton.getAttribute('aria-pressed') === 'true';
    const assetEvidence = decodedImages.length === frames.length
      && decodedImages.every(image => image instanceof HTMLImageElement
        && image.naturalWidth === EXPECTED_WIDTH
        && image.naturalHeight === EXPECTED_HEIGHT)
      && images.length === frames.length
      && images.every(image => image instanceof p5.Image
        && image.width === EXPECTED_WIDTH
        && image.height === EXPECTED_HEIGHT)
      && state.assetDecodedCount === frames.length
      && state.assetDimensionsValid
      && state.assetChecksums.length === frames.length
      && state.assetChecksums.every(checksum => Number.isInteger(checksum) && checksum > 0)
      && state.assetChecksumsUnique
      && state.sampledPixelCount === frames.length * 36 * 45 * 4
      && state.textureImagesReady;
    const mechanismEvidence = sketch instanceof p5
      && state.p5Ready
      && state.webglReady
      && (state.webglVersion === 'webgl2' || state.webglVersion === 'webgl1')
      && canvas instanceof HTMLCanvasElement
      && Boolean(gl)
      && state.texturedPanelCount === frames.length
      && state.meshVertexCount === state.expectedMeshVertexCount
      && state.drawnRevision === state.revision
      && Math.abs(state.lastDrawnPosition - state.position) <= .00001
      && Math.abs(state.lastDrawnBend - state.dynamicBend) <= .00001;
    const uiEvidence = host.getAttribute('aria-valuenow') === String(state.activeIndex + 1)
      && host.getAttribute('aria-valuetext').includes(activeFrame.title)
      && frameTitle.textContent === activeFrame.title
      && frameNumber.textContent.startsWith(String(state.activeIndex + 1).padStart(2, '0'))
      && resetButton.disabled === (state.position === DEFAULT_POSITION
        && state.bendSetting === DEFAULT_BEND
        && state.inspectedIndex === null
        && !state.inertiaActive);
    const viewportEvidence = stageRect.left >= -.5
      && stageRect.top >= -.5
      && stageRect.right <= innerWidth + .5
      && stageRect.bottom <= innerHeight + .5
      && hostRect.left >= stageRect.left
      && hostRect.top >= stageRect.top
      && hostRect.right <= stageRect.right
      && hostRect.bottom <= stageRect.bottom
      && canvas.getBoundingClientRect().width === hostRect.width
      && canvas.getBoundingClientRect().height === hostRect.height
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;
    const reducedEvidence = !state.reducedMotion
      || (!state.inertiaActive && state.velocity === 0 && Number.isInteger(state.position));

    return window.__PREVIEW_INTERACTION_STATE__ === state
      && window.__PREVIEW_META__?.capture === 'real-demo'
      && window.__PREVIEW_META__?.library === 'p5@2.3.0'
      && stage.dataset.previewMechanism === 'p5-textured-cylindrical-film-ribbon'
      && allCounters.every(counter => Number.isInteger(counter) && counter >= 0)
      && inputEvidence
      && boundaryEvidence
      && resultEvidence
      && assetEvidence
      && mechanismEvidence
      && uiEvidence
      && viewportEvidence
      && reducedEvidence
      && state.position >= 0
      && state.position <= frames.length - 1
      && state.activeIndex === Math.round(state.position)
      && state.pointerCaptured === (dragSession !== null)
      && state.firstFrameStatic
      && state.initialStaticVerified
      && state.task === 'tidal-archive-film-review'
      && state.userInputRequired === true
      && state.automaticCruise === false
      && state.automaticPlayback === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.previewClockDriven === false
      && state.syntheticInputDispatch === false
      && state.userOwnedPosition === true
      && state.finiteInputInertiaOnly === true
      && state.boundaryPolicy === 'release-outward-wheel-at-first-and-last-frame'
      && state.acceptedInputs.join('|') === 'wheel|mouse|touch|pen|keyboard|control'
      && state.reducedMotionDiscreteNavigation;
  };

  function render(nextTime, manual) {
    state.previewRenderCount += 1;
    if (manual) return;
    stepInertia(nextTime);
  }

  syncInterface();
  ready.catch(markPreviewFailure);
  installPreviewController({
    id: 'bending-webgl-gallery-ribbon',
    library: 'p5@2.3.0',
    renderer: 'webgl',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
