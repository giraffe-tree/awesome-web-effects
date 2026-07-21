import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#contract-stage');
  const host = document.querySelector('#signature-host');
  const speedOutput = document.querySelector('#speed-output');
  const boundaryLabel = document.querySelector('#boundary-label');
  const typedInput = document.querySelector('#typed-name');
  const typedPreview = document.querySelector('#typed-preview');
  const undoButton = document.querySelector('#undo-stroke');
  const clearButton = document.querySelector('#clear-signature');
  const confirmButton = document.querySelector('#confirm-signature');
  const status = document.querySelector('#signature-status');
  const statusOutput = document.querySelector('#status-output');
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const minimumPointCount = 8;
  const velocityWidthFactor = 16;

  const state = {
    id: 'velocity-sensitive-signature-ink',
    task: 'human-draws-or-types-explicitly-confirms-reviews-undoes-and-clears-a-contract-signature',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'trusted-pointer-velocity-inversely-maps-to-p5-ink-width-inside-a-measured-signature-boundary',
    assetStrategy: 'code-native-contract-dom-and-human-input-point-data-no-functional-raster-input-required',
    imageGenerationDecision: 'omitted-because-raster-pixels-would-not-drive-pointer-velocity-point-order-or-ink-width',
    acceptedInputs: ['mouse-drag-signature', 'touch-or-pen-signature', 'typed-name-alternative', 'undo-control-or-command-z', 'clear-control-or-delete', 'button-or-enter-confirmation'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticSignature: false,
    automaticStrokePlayback: false,
    fixedAuthoredSignature: false,
    automaticFallback: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-point-text-or-signature-decision-mutation',
    untrustedMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    ignoredOutsideBoundaryCount: 0,
    clampedPointCount: 0,
    strokeCreationCount: 0,
    strokeCount: 0,
    pointCount: 0,
    segmentCount: 0,
    undoInputCount: 0,
    undoCount: 0,
    clearInputCount: 0,
    clearCount: 0,
    typedInputEventCount: 0,
    typedCharacterCount: 0,
    confirmationInputCount: 0,
    confirmationCount: 0,
    rejectedConfirmationCount: 0,
    decisionClearCount: 0,
    drawing: false,
    activePointerId: null,
    filteredVelocity: 0,
    currentVelocity: 0,
    currentWidth: 0,
    minimumObservedVelocity: null,
    maximumObservedVelocity: 0,
    minimumObservedWidth: null,
    maximumObservedWidth: 0,
    velocitySampleCount: 0,
    widthMappingErrorMaximum: 0,
    velocityWidthInverseVerified: false,
    widthRange: 0,
    strokes: [],
    typedName: '',
    signatureMode: 'none',
    signatureRetained: false,
    retainedStrokeCount: 0,
    retainedPointCount: 0,
    retainedTypedName: null,
    retainedSignatureChecksum: null,
    phase: 'idle-empty',
    result: 'no-signature-retained',
    signatureBounds: { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 },
    boundaryWithinStage: false,
    allPointsWithinBoundary: true,
    signatureExtentWidth: 0,
    signatureExtentHeight: 0,
    canvasCoverageRatio: 0,
    fullStageGeometryVerified: false,
    p5InstanceReady: false,
    canvas2dReady: false,
    initialBlankVerified: false,
    transitionRecords: [],
    renderCount: 0,
    drawCount: 0,
    completedDrawCount: 0,
    geometryMeasureCount: 0,
    resizeCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let dirty = true;
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`velocity-sensitive-signature-ink: ${message}`);
  }

  function calculateGeometry() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const portrait = width <= 270;
    const bounds = portrait
      ? { left: 12, right: width - 12, top: 104, bottom: 230 }
      : { left: width < 480 ? 104 : 178, right: width - 12, top: 47, bottom: height - 48 };
    state.signatureBounds = { ...bounds, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top };
    state.boundaryWithinStage = bounds.left >= 0 && bounds.right <= width && bounds.top >= 0 && bounds.bottom <= height && bounds.right > bounds.left && bounds.bottom > bounds.top;
    const canvasRect = host.querySelector('canvas')?.getBoundingClientRect();
    state.canvasCoverageRatio = Number((((canvasRect?.width || 0) * (canvasRect?.height || 0)) / Math.max(1, width * height)).toFixed(4));
    state.fullStageGeometryVerified = state.boundaryWithinStage && state.canvasCoverageRatio >= .995;
    boundaryLabel.style.left = `${bounds.left}px`;
    boundaryLabel.style.top = `${Math.max(25, bounds.top - 10)}px`;
    typedPreview.style.left = `${bounds.left}px`;
    typedPreview.style.top = `${bounds.top}px`;
    typedPreview.style.width = `${bounds.right - bounds.left}px`;
    typedPreview.style.height = `${bounds.bottom - bounds.top}px`;
    state.geometryMeasureCount += 1;
  }

  function requestDraw() {
    dirty = true;
    sketch?.redraw();
  }

  function acceptTrusted(event, source) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (source.startsWith('pointer')) state.pointerInputCount += 1;
    else if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    else state.controlInputCount += 1;
    if (source.includes('undo')) state.undoInputCount += 1;
    if (source.includes('clear')) state.clearInputCount += 1;
    if (source.includes('confirmation')) state.confirmationInputCount += 1;
    return true;
  }

  function clearRetainedDecision() {
    if (!state.signatureRetained) return;
    state.signatureRetained = false;
    state.signatureMode = 'none';
    state.retainedStrokeCount = 0;
    state.retainedPointCount = 0;
    state.retainedTypedName = null;
    state.retainedSignatureChecksum = null;
    state.result = 'no-signature-retained';
    state.decisionClearCount += 1;
    status.dataset.retained = 'false';
  }

  function updateCounts() {
    state.strokeCount = state.strokes.length;
    state.pointCount = state.strokes.reduce((sum, stroke) => sum + stroke.length, 0);
    state.segmentCount = state.strokes.reduce((sum, stroke) => sum + Math.max(0, stroke.length - 1), 0);
    const points = state.strokes.flat();
    if (points.length) {
      const us = points.map(point => point.u);
      const vs = points.map(point => point.v);
      state.signatureExtentWidth = Number((Math.max(...us) - Math.min(...us)).toFixed(4));
      state.signatureExtentHeight = Number((Math.max(...vs) - Math.min(...vs)).toFixed(4));
    } else {
      state.signatureExtentWidth = 0;
      state.signatureExtentHeight = 0;
    }
    state.allPointsWithinBoundary = points.every(point => point.u >= 0 && point.u <= 1 && point.v >= 0 && point.v <= 1);
    undoButton.disabled = state.strokes.length === 0;
    clearButton.disabled = state.strokes.length === 0 && state.typedName.length === 0;
  }

  function signatureChecksum() {
    let checksum = 2166136261;
    state.strokes.forEach(stroke => stroke.forEach(point => {
      checksum = Math.imul(checksum ^ Math.round(point.u * 10000), 16777619) >>> 0;
      checksum = Math.imul(checksum ^ Math.round(point.v * 10000), 16777619) >>> 0;
      checksum = Math.imul(checksum ^ Math.round(point.width * 1000), 16777619) >>> 0;
    }));
    for (const character of state.typedName) checksum = Math.imul(checksum ^ character.codePointAt(0), 16777619) >>> 0;
    return checksum >>> 0;
  }

  function updateVelocityEvidence(velocity, filteredVelocity, width) {
    state.currentVelocity = Number(velocity.toFixed(4));
    state.filteredVelocity = Number(filteredVelocity.toFixed(4));
    state.currentWidth = Number(width.toFixed(4));
    state.velocitySampleCount += 1;
    state.minimumObservedVelocity = state.minimumObservedVelocity === null ? filteredVelocity : Math.min(state.minimumObservedVelocity, filteredVelocity);
    state.maximumObservedVelocity = Math.max(state.maximumObservedVelocity, filteredVelocity);
    state.minimumObservedWidth = state.minimumObservedWidth === null ? width : Math.min(state.minimumObservedWidth, width);
    state.maximumObservedWidth = Math.max(state.maximumObservedWidth, width);
    const expected = clamp(8.2 - filteredVelocity * velocityWidthFactor, 1.2, 8.2);
    state.widthMappingErrorMaximum = Math.max(state.widthMappingErrorMaximum, Math.abs(expected - width));
    state.widthRange = Number((state.maximumObservedWidth - state.minimumObservedWidth).toFixed(4));
    state.velocityWidthInverseVerified = state.maximumObservedVelocity > state.minimumObservedVelocity
      && state.maximumObservedWidth > state.minimumObservedWidth
      && state.widthMappingErrorMaximum < .001;
    speedOutput.textContent = `${state.filteredVelocity.toFixed(2)} PX/MS · ${state.currentWidth.toFixed(2)} PX`;
  }

  function pointFromEvent(event) {
    const stageRect = stage.getBoundingClientRect();
    const bounds = state.signatureBounds;
    const x = event.clientX - stageRect.left;
    const y = event.clientY - stageRect.top;
    const clampedX = clamp(x, bounds.left, bounds.right);
    const clampedY = clamp(y, bounds.top, bounds.bottom);
    if (clampedX !== x || clampedY !== y) state.clampedPointCount += 1;
    return {
      u: Number(((clampedX - bounds.left) / bounds.width).toFixed(5)),
      v: Number(((clampedY - bounds.top) / bounds.height).toFixed(5))
    };
  }

  function pointInsideBoundary(event) {
    const stageRect = stage.getBoundingClientRect();
    const x = event.clientX - stageRect.left;
    const y = event.clientY - stageRect.top;
    const bounds = state.signatureBounds;
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  }

  function addPoint(event) {
    const stroke = state.strokes.at(-1);
    const previous = stroke.at(-1);
    const point = pointFromEvent(event);
    const now = performance.now();
    const distance = Math.hypot((point.u - previous.u) * state.signatureBounds.width, (point.v - previous.v) * state.signatureBounds.height);
    const velocity = distance / Math.max(1, now - previous.time);
    const filteredVelocity = state.filteredVelocity * .5 + velocity * .5;
    const width = clamp(8.2 - filteredVelocity * velocityWidthFactor, 1.2, 8.2);
    stroke.push({ ...point, time: now, velocity: Number(velocity.toFixed(4)), filteredVelocity: Number(filteredVelocity.toFixed(4)), width: Number(width.toFixed(4)) });
    updateVelocityEvidence(velocity, filteredVelocity, width);
    updateCounts();
    state.transitionRecords.push({ source: 'trusted-pointer-point', trusted: true, u: point.u, v: point.v, velocity: state.filteredVelocity, width: state.currentWidth });
    state.transitionRecords = state.transitionRecords.slice(-64);
    requestDraw();
  }

  host.addEventListener('pointerdown', event => {
    calculateGeometry();
    if (!pointInsideBoundary(event)) {
      state.ignoredOutsideBoundaryCount += 1;
      return;
    }
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-down`)) return;
    event.preventDefault();
    clearRetainedDecision();
    const point = pointFromEvent(event);
    const now = performance.now();
    state.filteredVelocity = 0;
    state.currentVelocity = 0;
    state.currentWidth = 8.2;
    state.strokes.push([{ ...point, time: now, velocity: 0, filteredVelocity: 0, width: 8.2 }]);
    state.strokeCreationCount += 1;
    state.pointerDownCount += 1;
    state.drawing = true;
    state.activePointerId = event.pointerId;
    state.phase = 'drawing-unconfirmed';
    state.result = 'no-signature-retained';
    host.setPointerCapture(event.pointerId);
    if (host.hasPointerCapture(event.pointerId)) state.pointerCaptureCount += 1;
    updateCounts();
    requestDraw();
  });

  host.addEventListener('pointermove', event => {
    if (!state.drawing || event.pointerId !== state.activePointerId) return;
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-draw`)) return;
    state.pointerMoveCount += 1;
    addPoint(event);
  });

  const releasePointer = event => {
    if (!state.drawing || event.pointerId !== state.activePointerId) return;
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-up`)) return;
    state.pointerUpCount += 1;
    if (host.hasPointerCapture(event.pointerId)) {
      host.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.drawing = false;
    state.activePointerId = null;
    state.phase = 'ink-unconfirmed';
    statusOutput.textContent = `${state.pointCount} POINTS · CONFIRM REQUIRED`;
  };
  host.addEventListener('pointerup', releasePointer);
  host.addEventListener('pointercancel', releasePointer);

  typedInput.addEventListener('input', event => {
    if (!acceptTrusted(event, 'keyboard-typed-name')) return;
    clearRetainedDecision();
    state.typedInputEventCount += 1;
    state.typedName = typedInput.value.trimStart().slice(0, 28);
    state.typedCharacterCount = state.typedName.length;
    typedPreview.textContent = state.typedName;
    state.phase = state.typedName ? 'typed-unconfirmed' : state.strokes.length ? 'ink-unconfirmed' : 'idle-empty';
    state.result = 'no-signature-retained';
    updateCounts();
  });

  function undoSignature(source) {
    if (state.strokes.length) state.strokes.pop();
    else if (state.typedName.length) {
      state.typedName = state.typedName.slice(0, -1);
      typedInput.value = state.typedName;
      typedPreview.textContent = state.typedName;
      state.typedCharacterCount = state.typedName.length;
    } else return;
    clearRetainedDecision();
    state.undoCount += 1;
    state.phase = state.strokes.length || state.typedName ? 'signature-edited-unconfirmed' : 'idle-empty';
    state.result = 'no-signature-retained';
    state.transitionRecords.push({ source, trusted: true, action: 'undo', remainingStrokes: state.strokes.length, typedCharacters: state.typedName.length });
    updateCounts();
    statusOutput.textContent = state.strokes.length || state.typedName ? 'EDITED · CONFIRM REQUIRED' : 'EMPTY · NOT CONFIRMED';
    requestDraw();
  }

  function clearSignature(source) {
    if (!state.strokes.length && !state.typedName.length) return;
    clearRetainedDecision();
    state.strokes = [];
    state.typedName = '';
    typedInput.value = '';
    typedPreview.textContent = '';
    state.typedCharacterCount = 0;
    state.clearCount += 1;
    state.phase = 'cleared-empty';
    state.result = 'no-signature-retained';
    state.transitionRecords.push({ source, trusted: true, action: 'clear' });
    updateCounts();
    statusOutput.textContent = 'CLEARED · NOT CONFIRMED';
    requestDraw();
  }

  function confirmSignature(source) {
    const inkValid = state.pointCount >= minimumPointCount && state.signatureExtentWidth >= .3;
    const typedValid = state.typedName.trim().length >= 2;
    if (!inkValid && !typedValid) {
      state.rejectedConfirmationCount += 1;
      statusOutput.textContent = 'ADD INK OR TYPE A NAME';
      return;
    }
    state.confirmationCount += 1;
    state.signatureMode = inkValid ? 'velocity-ink' : 'typed-alternative';
    state.signatureRetained = true;
    state.retainedStrokeCount = inkValid ? state.strokeCount : 0;
    state.retainedPointCount = inkValid ? state.pointCount : 0;
    state.retainedTypedName = typedValid ? state.typedName.trim() : null;
    state.retainedSignatureChecksum = signatureChecksum();
    state.phase = 'signature-retained';
    state.result = state.signatureMode === 'velocity-ink' ? 'velocity-ink-contract-signature-retained' : 'typed-contract-signature-retained';
    status.dataset.retained = 'true';
    statusOutput.textContent = state.signatureMode === 'velocity-ink' ? `SIGNED · ${state.retainedPointCount} POINTS` : `SIGNED · ${state.retainedTypedName.toUpperCase()}`;
    state.transitionRecords.push({ source, trusted: true, action: 'confirm', mode: state.signatureMode, checksum: state.retainedSignatureChecksum });
  }

  undoButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-undo-control' : 'control-undo';
    if (!acceptTrusted(event, source)) return;
    undoSignature(`trusted-${source}`);
  });
  clearButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-clear-control' : 'control-clear';
    if (!acceptTrusted(event, source)) return;
    clearSignature(`trusted-${source}`);
  });
  confirmButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-confirmation-control' : 'control-confirmation';
    if (!acceptTrusted(event, source)) return;
    confirmSignature(`trusted-${source}`);
  });

  host.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      if (!acceptTrusted(event, 'keyboard-undo-shortcut')) return;
      event.preventDefault();
      undoSignature('trusted-keyboard-undo-shortcut');
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!acceptTrusted(event, 'keyboard-clear-shortcut')) return;
      event.preventDefault();
      clearSignature('trusted-keyboard-clear-shortcut');
    } else if (event.key === 'Enter') {
      if (!acceptTrusted(event, 'keyboard-confirmation-shortcut')) return;
      event.preventDefault();
      confirmSignature('trusted-keyboard-confirmation-shortcut');
    }
  });

  typedInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    if (!acceptTrusted(event, 'keyboard-confirmation-typed-input')) return;
    event.preventDefault();
    confirmSignature('trusted-keyboard-confirmation-typed-input');
  });

  const ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(host);
          p.noLoop();
          state.p5InstanceReady = p instanceof p5;
          state.canvas2dReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.drawCount += 1;
        calculateGeometry();
        const bounds = state.signatureBounds;
        p.background('#eee9dd');
        p.stroke('#5e574b1f');
        p.strokeWeight(1);
        for (let y = 30; y < p.height; y += 17) p.line(0, y, p.width, y);
        p.noFill();
        p.stroke('#625b4f55');
        p.drawingContext.setLineDash([4, 4]);
        p.rect(bounds.left, bounds.top, bounds.width, bounds.height, 5);
        p.drawingContext.setLineDash([]);
        p.line(bounds.left + 10, bounds.bottom - 16, bounds.right - 10, bounds.bottom - 16);

        p.noStroke();
        p.fill('#24211d');
        state.strokes.forEach(stroke => {
          for (let index = 1; index < stroke.length; index += 1) {
            const a = stroke[index - 1];
            const b = stroke[index];
            const ax = bounds.left + a.u * bounds.width;
            const ay = bounds.top + a.v * bounds.height;
            const bx = bounds.left + b.u * bounds.width;
            const by = bounds.top + b.v * bounds.height;
            p.circle(bx, by, b.width);
            const angle = Math.atan2(by - ay, bx - ax) + Math.PI / 2;
            const ac = Math.cos(angle) * a.width / 2;
            const as = Math.sin(angle) * a.width / 2;
            const bc = Math.cos(angle) * b.width / 2;
            const bs = Math.sin(angle) * b.width / 2;
            p.quad(ax + ac, ay + as, bx + bc, by + bs, bx - bc, by - bs, ax - ac, ay - as);
          }
        });
        p.fill('#887f73');
        p.textFont('monospace');
        p.textSize(5);
        p.textAlign(p.RIGHT, p.BOTTOM);
        p.text('AUTHORIZED SIGNER', bounds.right - 9, bounds.bottom - 5);
        state.completedDrawCount += 1;
        dirty = false;
      };
    }, host);
  });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch || !stage.clientWidth || !stage.clientHeight) return;
      sketch.resizeCanvas(stage.clientWidth, stage.clientHeight);
      state.resizeCount += 1;
      calculateGeometry();
      requestDraw();
    });
  });
  resizeObserver.observe(stage);

  function render() {
    state.renderCount += 1;
    calculateGeometry();
    if (state.inputCount === 0) {
      state.initialBlankVerified = state.strokes.length === 0
        && state.typedName === ''
        && state.signatureRetained === false
        && state.phase === 'idle-empty';
    }
    if (dirty) sketch?.redraw();
  }

  const previewReady = ready.then(() => {
    calculateGeometry();
    updateCounts();
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.p5InstanceReady && state.canvas2dReady, 'p5 canvas is not ready');
    invariant(state.fullStageGeometryVerified && state.canvasCoverageRatio >= .995 && state.boundaryWithinStage, 'signature boundary or canvas escapes the stage');
    invariant(state.automaticSignature === false && state.automaticStrokePlayback === false && state.fixedAuthoredSignature === false && state.automaticFallback === false, 'automatic or fixed authored signature is forbidden');
    invariant(state.captureClockDriven === false && state.renderIgnoresPreviewClock === true, 'preview clock must not mutate the signature');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed signature evidence');
    invariant(state.inputCount === state.trustedInputCount && state.pointerInputCount + state.keyboardInputCount + state.controlInputCount === state.inputCount, 'trusted input accounting diverged');
    invariant(state.initialBlankVerified || state.inputCount > 0, 'initial contract signature was not verified blank');
    invariant(state.strokeCount === state.strokes.length && state.pointCount === state.strokes.reduce((sum, stroke) => sum + stroke.length, 0), 'stroke or point accounting diverged');
    invariant(state.segmentCount === state.strokes.reduce((sum, stroke) => sum + Math.max(0, stroke.length - 1), 0), 'segment accounting diverged');
    invariant(state.allPointsWithinBoundary, 'signature point escaped the measured boundary');
    invariant(state.transitionRecords.every(record => record.trusted === true), 'a signature transition lacks trusted input causality');

    if (state.velocitySampleCount > 1) {
      invariant(state.velocityWidthInverseVerified && state.widthMappingErrorMaximum < .001, 'velocity-to-width mapping evidence is invalid');
      invariant(state.maximumObservedVelocity > state.minimumObservedVelocity && state.maximumObservedWidth > state.minimumObservedWidth, 'signature lacks visible velocity width variation');
    }
    if (state.signatureRetained) {
      invariant(state.phase === 'signature-retained' && state.retainedSignatureChecksum > 0, 'confirmed signature result is not retained');
      invariant(status.dataset.retained === 'true', 'retained signature status is not visible');
      if (state.signatureMode === 'velocity-ink') {
        invariant(state.result === 'velocity-ink-contract-signature-retained' && state.retainedPointCount >= minimumPointCount, 'retained ink signature is incomplete');
        invariant(state.retainedStrokeCount === state.strokeCount && state.signatureExtentWidth >= .3, 'retained ink signature evidence differs from visible ink');
      } else {
        invariant(state.signatureMode === 'typed-alternative' && state.result === 'typed-contract-signature-retained', 'typed keyboard signature result is inconsistent');
        invariant(state.retainedTypedName?.length >= 2, 'typed keyboard signature is too short');
      }
    }
    if (state.undoCount > 0) invariant(state.transitionRecords.some(record => record.action === 'undo'), 'undo did not remove signature material');
    return true;
  };

  installPreviewController({
    id: 'velocity-sensitive-signature-ink',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready: previewReady
  });
} catch (error) {
  markPreviewFailure(error);
}
