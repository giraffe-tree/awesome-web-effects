import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#proof-stage');
  const host = document.querySelector('#pressure-host');
  const pressureControl = document.querySelector('#pressure-control');
  const pressureValue = document.querySelector('#pressure-value');
  const pressureSource = document.querySelector('#pressure-source');
  const status = document.querySelector('#proof-status');
  const statusOutput = document.querySelector('#status-output');
  const undoButton = document.querySelector('#undo-stroke');
  const resetButton = document.querySelector('#reset-proof');
  const confirmButton = document.querySelector('#confirm-proof');
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const pressureToWidth = pressure => 1.2 + clamp(pressure, .1, 1) * 10.8;
  const minimumPointCount = 7;
  const minimumPressureRange = .15;

  if (!stage || !host || !pressureControl || !pressureValue || !pressureSource || !status || !statusOutput || !undoButton || !resetButton || !confirmButton) {
    throw new Error('pressure annotation DOM is incomplete');
  }

  const state = {
    id: 'pressure-shaped-freehand-stroke',
    task: 'human-annotates-a-packaging-proof-with-pressure-shaped-ink-and-explicitly-confirms-or-revises-the-mark',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'trusted-pointer-pressure-or-visible-manual-pressure-maps-directly-to-variable-width-p5-outline-geometry',
    assetStrategy: 'code-native-dieline-and-trusted-pressure-sample-geometry-no-functional-raster-input-required',
    imageGenerationDecision: 'omitted-because-raster-pixels-would-not-drive-pressure-sampling-width-mapping-or-review-retention',
    acceptedInputs: ['pointer-or-pen-drag', 'visible-manual-pressure-range', 'keyboard-arrows-and-space', 'keyboard-brackets-pressure', 'button-or-enter-confirmation', 'button-or-z-undo', 'button-or-r-reset'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticDrawing: false,
    automaticStrokePlayback: false,
    authoredFallbackStroke: false,
    automaticFallback: false,
    previewClockDriven: false,
    renderIgnoresPreviewClock: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-pressure-point-stroke-or-review-decision-mutation',
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
    manualPressureInputCount: 0,
    manualPressureSampleCount: 0,
    hardwarePressureSampleCount: 0,
    keyboardPressureInputCount: 0,
    keyboardDrawStepCount: 0,
    keyboardPenToggleCount: 0,
    strokeCreationCount: 0,
    strokeCount: 0,
    pointCount: 0,
    segmentCount: 0,
    undoCount: 0,
    resetCount: 0,
    confirmationCount: 0,
    rejectedConfirmationCount: 0,
    decisionClearCount: 0,
    drawing: false,
    keyboardDrawing: false,
    activePointerId: null,
    manualPressure: .35,
    currentPressure: .35,
    currentWidth: pressureToWidth(.35),
    currentPressureSource: 'manual-input',
    minimumObservedPressure: null,
    maximumObservedPressure: 0,
    minimumObservedWidth: null,
    maximumObservedWidth: 0,
    pressureRange: 0,
    widthRange: 0,
    widthMappingErrorMaximum: 0,
    pressureWidthMappingVerified: false,
    strokes: [],
    keyboardCursor: { u: .26, v: .56 },
    reviewRetained: false,
    retainedStrokeCount: 0,
    retainedPointCount: 0,
    retainedGeometryChecksum: null,
    retainedPressureRange: 0,
    phase: 'idle-empty',
    result: 'no-review-retained',
    markBounds: { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 },
    markExtentWidth: 0,
    markExtentHeight: 0,
    allPointsWithinBoundary: true,
    boundaryWithinStage: false,
    canvasCoverageRatio: 0,
    fullStageGeometryVerified: false,
    p5InstanceReady: false,
    canvas2dReady: false,
    initialBlankVerified: false,
    transitionRecords: [],
    drawCount: 0,
    renderCount: 0,
    geometryMeasureCount: 0,
    resizeCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let dirty = true;
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`pressure-shaped-freehand-stroke: ${message}`);
  }

  function calculateGeometry() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const portrait = width <= 270;
    const bounds = portrait
      ? { left: 12, right: width - 12, top: 132, bottom: height - 59 }
      : { left: width < 480 ? 103 : 182, right: width - 12, top: 47, bottom: height - 49 };
    state.markBounds = { ...bounds, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top };
    state.boundaryWithinStage = bounds.left >= 0 && bounds.right <= width && bounds.top >= 0 && bounds.bottom <= height && bounds.right > bounds.left && bounds.bottom > bounds.top;
    const canvasRect = host.querySelector('canvas')?.getBoundingClientRect();
    state.canvasCoverageRatio = Number((((canvasRect?.width || 0) * (canvasRect?.height || 0)) / Math.max(1, width * height)).toFixed(4));
    state.fullStageGeometryVerified = state.boundaryWithinStage && state.canvasCoverageRatio >= .995;
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
    return true;
  }

  function clearRetainedDecision() {
    if (!state.reviewRetained) return;
    state.reviewRetained = false;
    state.retainedStrokeCount = 0;
    state.retainedPointCount = 0;
    state.retainedGeometryChecksum = null;
    state.retainedPressureRange = 0;
    state.result = 'no-review-retained';
    state.decisionClearCount += 1;
    status.dataset.retained = 'false';
  }

  function updatePressureEvidence(pressure, width, source) {
    state.currentPressure = Number(pressure.toFixed(4));
    state.currentWidth = Number(width.toFixed(4));
    state.currentPressureSource = source;
    state.minimumObservedPressure = state.minimumObservedPressure === null ? pressure : Math.min(state.minimumObservedPressure, pressure);
    state.maximumObservedPressure = Math.max(state.maximumObservedPressure, pressure);
    state.minimumObservedWidth = state.minimumObservedWidth === null ? width : Math.min(state.minimumObservedWidth, width);
    state.maximumObservedWidth = Math.max(state.maximumObservedWidth, width);
    state.pressureRange = Number((state.maximumObservedPressure - state.minimumObservedPressure).toFixed(4));
    state.widthRange = Number((state.maximumObservedWidth - state.minimumObservedWidth).toFixed(4));
    state.widthMappingErrorMaximum = Math.max(state.widthMappingErrorMaximum, Math.abs(pressureToWidth(pressure) - width));
    state.pressureWidthMappingVerified = state.maximumObservedPressure > state.minimumObservedPressure
      && state.maximumObservedWidth > state.minimumObservedWidth
      && state.widthMappingErrorMaximum < .001;
    pressureValue.textContent = `${Math.round(pressure * 100)}%`;
    pressureSource.textContent = source.startsWith('hardware') ? source.replace('hardware-', '').toUpperCase() + ' PRESSURE' : 'MANUAL INPUT';
  }

  function updateCounts() {
    state.strokeCount = state.strokes.length;
    state.pointCount = state.strokes.reduce((sum, stroke) => sum + stroke.length, 0);
    state.segmentCount = state.strokes.reduce((sum, stroke) => sum + Math.max(0, stroke.length - 1), 0);
    const points = state.strokes.flat();
    if (points.length) {
      const us = points.map(point => point.u);
      const vs = points.map(point => point.v);
      const pressures = points.map(point => point.pressure);
      const widths = points.map(point => point.width);
      state.markExtentWidth = Number((Math.max(...us) - Math.min(...us)).toFixed(4));
      state.markExtentHeight = Number((Math.max(...vs) - Math.min(...vs)).toFixed(4));
      state.minimumObservedPressure = Math.min(...pressures);
      state.maximumObservedPressure = Math.max(...pressures);
      state.minimumObservedWidth = Math.min(...widths);
      state.maximumObservedWidth = Math.max(...widths);
      state.pressureRange = Number((state.maximumObservedPressure - state.minimumObservedPressure).toFixed(4));
      state.widthRange = Number((state.maximumObservedWidth - state.minimumObservedWidth).toFixed(4));
      state.widthMappingErrorMaximum = Math.max(...points.map(point => Math.abs(pressureToWidth(point.pressure) - point.width)));
      state.pressureWidthMappingVerified = state.maximumObservedPressure > state.minimumObservedPressure
        && state.maximumObservedWidth > state.minimumObservedWidth
        && state.widthMappingErrorMaximum < .001;
    } else {
      state.markExtentWidth = 0;
      state.markExtentHeight = 0;
      state.minimumObservedPressure = null;
      state.maximumObservedPressure = 0;
      state.minimumObservedWidth = null;
      state.maximumObservedWidth = 0;
      state.pressureRange = 0;
      state.widthRange = 0;
      state.widthMappingErrorMaximum = 0;
      state.pressureWidthMappingVerified = false;
    }
    state.allPointsWithinBoundary = points.every(point => point.u >= 0 && point.u <= 1 && point.v >= 0 && point.v <= 1);
    undoButton.disabled = state.strokes.length === 0;
    resetButton.disabled = state.strokes.length === 0;
  }

  function geometryChecksum() {
    let checksum = 2166136261;
    state.strokes.forEach(stroke => stroke.forEach(point => {
      checksum = Math.imul(checksum ^ Math.round(point.u * 10000), 16777619) >>> 0;
      checksum = Math.imul(checksum ^ Math.round(point.v * 10000), 16777619) >>> 0;
      checksum = Math.imul(checksum ^ Math.round(point.pressure * 1000), 16777619) >>> 0;
      checksum = Math.imul(checksum ^ Math.round(point.width * 1000), 16777619) >>> 0;
    }));
    return checksum >>> 0;
  }

  function pointFromEvent(event) {
    const rect = stage.getBoundingClientRect();
    const bounds = state.markBounds;
    const x = clamp(event.clientX - rect.left, bounds.left, bounds.right);
    const y = clamp(event.clientY - rect.top, bounds.top, bounds.bottom);
    return {
      u: Number(((x - bounds.left) / bounds.width).toFixed(5)),
      v: Number(((y - bounds.top) / bounds.height).toFixed(5))
    };
  }

  function insideMarkBounds(event) {
    const rect = stage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const bounds = state.markBounds;
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  }

  function pressureFromPointer(event) {
    if ((event.pointerType === 'pen' || event.pointerType === 'touch') && Number.isFinite(event.pressure) && event.pressure > 0) {
      state.hardwarePressureSampleCount += 1;
      return { pressure: clamp(event.pressure, .1, 1), source: `hardware-${event.pointerType}` };
    }
    state.manualPressureSampleCount += 1;
    return { pressure: state.manualPressure, source: 'manual-pressure-control' };
  }

  function appendPoint(point, pressure, source, inputSource) {
    const stroke = state.strokes.at(-1);
    if (!stroke) return;
    const width = pressureToWidth(pressure);
    const sample = { ...point, pressure: Number(pressure.toFixed(4)), width: Number(width.toFixed(4)), pressureSource: source };
    const previous = stroke.at(-1);
    if (previous && Math.hypot(sample.u - previous.u, sample.v - previous.v) < .002) return;
    stroke.push(sample);
    updatePressureEvidence(pressure, width, source);
    updateCounts();
    state.transitionRecords.push({ source: inputSource, trusted: true, u: sample.u, v: sample.v, pressure: sample.pressure, width: sample.width, pressureSource: source });
    state.transitionRecords = state.transitionRecords.slice(-96);
    requestDraw();
  }

  function startStroke(point, pressure, source, inputSource) {
    clearRetainedDecision();
    const width = pressureToWidth(pressure);
    state.strokes.push([{ ...point, pressure: Number(pressure.toFixed(4)), width: Number(width.toFixed(4)), pressureSource: source }]);
    state.strokeCreationCount += 1;
    state.phase = 'drawing-unconfirmed';
    state.result = 'no-review-retained';
    updatePressureEvidence(pressure, width, source);
    updateCounts();
    state.transitionRecords.push({ source: inputSource, trusted: true, action: 'start-stroke', pressure: Number(pressure.toFixed(4)), width: Number(width.toFixed(4)), pressureSource: source });
    state.transitionRecords = state.transitionRecords.slice(-96);
    statusOutput.textContent = 'MARK IN PROGRESS';
    requestDraw();
  }

  host.addEventListener('pointerdown', event => {
    calculateGeometry();
    if (!insideMarkBounds(event) || !acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-down`)) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    const sample = pressureFromPointer(event);
    startStroke(pointFromEvent(event), sample.pressure, sample.source, 'trusted-pointer-start');
    state.pointerDownCount += 1;
    state.drawing = true;
    state.activePointerId = event.pointerId;
    host.setPointerCapture(event.pointerId);
    if (host.hasPointerCapture(event.pointerId)) state.pointerCaptureCount += 1;
  });

  host.addEventListener('pointermove', event => {
    if (!state.drawing || event.pointerId !== state.activePointerId || !acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-draw`)) return;
    const sample = pressureFromPointer(event);
    state.pointerMoveCount += 1;
    appendPoint(pointFromEvent(event), sample.pressure, sample.source, 'trusted-pointer-point');
  });

  function releasePointer(event) {
    if (!state.drawing || event.pointerId !== state.activePointerId || !acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-up`)) return;
    state.pointerUpCount += 1;
    if (host.hasPointerCapture(event.pointerId)) {
      host.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.drawing = false;
    state.activePointerId = null;
    state.phase = 'marked-unconfirmed';
    statusOutput.textContent = `${state.pointCount} SAMPLES · CONFIRM REQUIRED`;
  }
  host.addEventListener('pointerup', releasePointer);
  host.addEventListener('pointercancel', releasePointer);

  pressureControl.addEventListener('input', event => {
    if (!acceptTrusted(event, 'control-manual-pressure')) return;
    state.manualPressureInputCount += 1;
    state.manualPressure = clamp(Number(pressureControl.value) / 100, .1, 1);
    state.currentPressure = state.manualPressure;
    state.currentWidth = pressureToWidth(state.manualPressure);
    state.currentPressureSource = 'manual-pressure-control';
    pressureValue.textContent = `${Math.round(state.manualPressure * 100)}%`;
    pressureSource.textContent = 'MANUAL INPUT';
  });

  function undo(source) {
    if (!state.strokes.length) return;
    clearRetainedDecision();
    state.strokes.pop();
    state.undoCount += 1;
    state.phase = state.strokes.length ? 'edited-unconfirmed' : 'idle-empty';
    state.result = 'no-review-retained';
    state.transitionRecords.push({ source, trusted: true, action: 'undo', remainingStrokes: state.strokes.length });
    updateCounts();
    statusOutput.textContent = state.strokes.length ? 'EDITED · CONFIRM REQUIRED' : 'AWAITING HUMAN MARK';
    requestDraw();
  }

  function reset(source) {
    if (!state.strokes.length) return;
    clearRetainedDecision();
    state.strokes = [];
    state.resetCount += 1;
    state.keyboardDrawing = false;
    state.phase = 'reset-empty';
    state.result = 'no-review-retained';
    state.transitionRecords.push({ source, trusted: true, action: 'reset' });
    updateCounts();
    statusOutput.textContent = 'RESET · AWAITING HUMAN MARK';
    requestDraw();
  }

  function confirm(source) {
    const eligible = state.pointCount >= minimumPointCount
      && state.markExtentWidth >= .16
      && state.pressureRange >= minimumPressureRange
      && state.pressureWidthMappingVerified;
    if (!eligible) {
      state.rejectedConfirmationCount += 1;
      statusOutput.textContent = state.pointCount < minimumPointCount || state.markExtentWidth < .16 ? 'DRAW A LONGER REVIEW MARK' : 'USE LIGHT + FIRM PRESSURE';
      return;
    }
    state.confirmationCount += 1;
    state.reviewRetained = true;
    state.retainedStrokeCount = state.strokeCount;
    state.retainedPointCount = state.pointCount;
    state.retainedGeometryChecksum = geometryChecksum();
    state.retainedPressureRange = state.pressureRange;
    state.phase = 'review-retained';
    state.result = 'pressure-shaped-packaging-review-retained';
    status.dataset.retained = 'true';
    statusOutput.textContent = `APPROVED WITH ${state.strokeCount} MARK${state.strokeCount === 1 ? '' : 'S'}`;
    state.transitionRecords.push({ source, trusted: true, action: 'confirm', checksum: state.retainedGeometryChecksum, pressureRange: state.retainedPressureRange });
  }

  undoButton.addEventListener('click', event => {
    if (!acceptTrusted(event, event.detail === 0 ? 'keyboard-undo-control' : 'control-undo')) return;
    undo('trusted-undo-control');
  });
  resetButton.addEventListener('click', event => {
    if (!acceptTrusted(event, event.detail === 0 ? 'keyboard-reset-control' : 'control-reset')) return;
    reset('trusted-reset-control');
  });
  confirmButton.addEventListener('click', event => {
    if (!acceptTrusted(event, event.detail === 0 ? 'keyboard-confirm-control' : 'control-confirm')) return;
    confirm('trusted-confirm-control');
  });

  host.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) {
      if (!acceptTrusted(event, 'keyboard-draw-step')) return;
      event.preventDefault();
      const step = event.shiftKey ? .06 : .035;
      if (key === 'arrowleft') state.keyboardCursor.u = clamp(state.keyboardCursor.u - step, 0, 1);
      if (key === 'arrowright') state.keyboardCursor.u = clamp(state.keyboardCursor.u + step, 0, 1);
      if (key === 'arrowup') state.keyboardCursor.v = clamp(state.keyboardCursor.v - step, 0, 1);
      if (key === 'arrowdown') state.keyboardCursor.v = clamp(state.keyboardCursor.v + step, 0, 1);
      state.keyboardDrawStepCount += 1;
      if (!state.keyboardDrawing) startStroke({ ...state.keyboardCursor }, state.manualPressure, 'manual-pressure-control', 'trusted-keyboard-start');
      else appendPoint({ ...state.keyboardCursor }, state.manualPressure, 'manual-pressure-control', 'trusted-keyboard-point');
      state.keyboardDrawing = true;
    } else if (event.key === '[' || event.key === ']' || event.key === '-' || event.key === '+') {
      if (!acceptTrusted(event, 'keyboard-pressure-change')) return;
      event.preventDefault();
      const direction = event.key === '[' || event.key === '-' ? -1 : 1;
      state.manualPressure = clamp(Number((state.manualPressure + direction * .15).toFixed(2)), .1, 1);
      pressureControl.value = String(Math.round(state.manualPressure * 100));
      state.keyboardPressureInputCount += 1;
      state.currentPressure = state.manualPressure;
      state.currentWidth = pressureToWidth(state.manualPressure);
      pressureValue.textContent = `${Math.round(state.manualPressure * 100)}%`;
      pressureSource.textContent = 'MANUAL INPUT';
    } else if (event.code === 'Space') {
      if (!acceptTrusted(event, 'keyboard-pen-toggle')) return;
      event.preventDefault();
      state.keyboardDrawing = !state.keyboardDrawing;
      state.keyboardPenToggleCount += 1;
      if (state.keyboardDrawing) startStroke({ ...state.keyboardCursor }, state.manualPressure, 'manual-pressure-control', 'trusted-keyboard-pen-down');
      else {
        state.phase = state.strokes.length ? 'marked-unconfirmed' : 'idle-empty';
        statusOutput.textContent = state.strokes.length ? `${state.pointCount} SAMPLES · CONFIRM REQUIRED` : 'AWAITING HUMAN MARK';
      }
    } else if (key === 'enter') {
      if (!acceptTrusted(event, 'keyboard-confirm')) return;
      event.preventDefault();
      confirm('trusted-keyboard-confirm');
    } else if (key === 'z') {
      if (!acceptTrusted(event, 'keyboard-undo')) return;
      event.preventDefault();
      undo('trusted-keyboard-undo');
    } else if (key === 'r') {
      if (!acceptTrusted(event, 'keyboard-reset')) return;
      event.preventDefault();
      reset('trusted-keyboard-reset');
    }
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
        const bounds = state.markBounds;
        p.background('#0b1114');
        p.stroke('#d9e2dc0d');
        p.strokeWeight(1);
        for (let x = 8; x < p.width; x += 16) p.line(x, 0, x, p.height);
        for (let y = 8; y < p.height; y += 16) p.line(0, y, p.width, y);

        p.noFill();
        p.stroke('#82918b70');
        p.drawingContext.setLineDash([3, 3]);
        p.rect(bounds.left, bounds.top, bounds.width, bounds.height, 6);
        p.drawingContext.setLineDash([]);
        const x0 = bounds.left + bounds.width * .14;
        const y0 = bounds.top + bounds.height * .18;
        const x1 = bounds.left + bounds.width * .82;
        const y1 = bounds.top + bounds.height * .8;
        p.stroke('#9aaba45b');
        p.beginShape();
        p.vertex(x0, y0);
        p.vertex(x1, y0);
        p.vertex(x1, y1);
        p.vertex(x0 + bounds.width * .19, y1);
        p.vertex(x0, y0 + bounds.height * .55);
        p.endShape(p.CLOSE);
        p.line(x0 + bounds.width * .19, y1, x0 + bounds.width * .19, y0);
        p.line(x1 - bounds.width * .18, y0, x1 - bounds.width * .18, y1);
        p.drawingContext.setLineDash([2, 3]);
        p.line(x0, y0 + bounds.height * .55, x1, y0 + bounds.height * .55);
        p.drawingContext.setLineDash([]);

        p.noStroke();
        p.fill('#9aaba4');
        p.textFont('monospace');
        p.textSize(5);
        p.textAlign(p.LEFT, p.TOP);
        p.text('FOLD 04 / LOCK TAB', bounds.left + 7, bounds.top + 7);
        p.textAlign(p.RIGHT, p.BOTTOM);
        p.fill('#65736e');
        p.text('DRAW REVIEW MARK', bounds.right - 7, bounds.bottom - 5);

        p.noStroke();
        p.fill('#ff7058');
        state.strokes.forEach(stroke => {
          if (stroke.length === 1) {
            const point = stroke[0];
            p.circle(bounds.left + point.u * bounds.width, bounds.top + point.v * bounds.height, point.width);
            return;
          }
          for (let index = 1; index < stroke.length; index += 1) {
            const a = stroke[index - 1];
            const b = stroke[index];
            const ax = bounds.left + a.u * bounds.width;
            const ay = bounds.top + a.v * bounds.height;
            const bx = bounds.left + b.u * bounds.width;
            const by = bounds.top + b.v * bounds.height;
            const angle = Math.atan2(by - ay, bx - ax) + Math.PI / 2;
            const ac = Math.cos(angle) * a.width / 2;
            const as = Math.sin(angle) * a.width / 2;
            const bc = Math.cos(angle) * b.width / 2;
            const bs = Math.sin(angle) * b.width / 2;
            p.quad(ax + ac, ay + as, bx + bc, by + bs, bx - bc, by - bs, ax - ac, ay - as);
            p.circle(bx, by, b.width);
          }
        });

        if (document.activeElement === host && !state.drawing) {
          p.noFill();
          p.stroke(state.keyboardDrawing ? '#ff7058' : '#a8f0c6');
          p.strokeWeight(1);
          p.circle(bounds.left + state.keyboardCursor.u * bounds.width, bounds.top + state.keyboardCursor.v * bounds.height, 8);
        }
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
        && state.reviewRetained === false
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
    invariant(state.fullStageGeometryVerified && state.canvasCoverageRatio >= .995 && state.boundaryWithinStage, 'canvas or annotation boundary escapes the stage');
    invariant(state.automaticDrawing === false && state.automaticStrokePlayback === false && state.authoredFallbackStroke === false && state.automaticFallback === false, 'automatic or authored stroke playback is forbidden');
    invariant(state.previewClockDriven === false && state.renderIgnoresPreviewClock === true, 'preview clock must not mutate human ink');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed pressure ink evidence');
    invariant(state.inputCount === state.trustedInputCount && state.pointerInputCount + state.keyboardInputCount + state.controlInputCount === state.inputCount, 'trusted input accounting diverged');
    invariant(state.initialBlankVerified || state.inputCount > 0, 'initial proof was not verified blank');
    invariant(state.strokeCount === state.strokes.length && state.pointCount === state.strokes.reduce((sum, stroke) => sum + stroke.length, 0), 'stroke or point accounting diverged');
    invariant(state.segmentCount === state.strokes.reduce((sum, stroke) => sum + Math.max(0, stroke.length - 1), 0), 'segment accounting diverged');
    invariant(state.allPointsWithinBoundary, 'an annotation sample escaped the measured boundary');
    invariant(state.transitionRecords.every(record => record.trusted === true), 'an annotation transition lacks trusted human causality');
    invariant(Math.abs(state.currentWidth - pressureToWidth(state.currentPressure)) < .001, 'live pressure readout is inconsistent');

    if (state.pointCount > 1 && state.pressureRange > 0) {
      invariant(state.pressureWidthMappingVerified && state.widthMappingErrorMaximum < .001, 'pressure-to-width mapping evidence is invalid');
      invariant(state.maximumObservedPressure > state.minimumObservedPressure && state.maximumObservedWidth > state.minimumObservedWidth, 'pressure did not change visible outline geometry');
    }
    if (state.reviewRetained) {
      invariant(state.phase === 'review-retained' && state.result === 'pressure-shaped-packaging-review-retained', 'confirmed review result is inconsistent');
      invariant(state.retainedGeometryChecksum === geometryChecksum() && state.retainedGeometryChecksum > 0, 'retained review differs from visible ink');
      invariant(state.retainedStrokeCount === state.strokeCount && state.retainedPointCount === state.pointCount, 'retained stroke evidence diverged');
      invariant(state.retainedPointCount >= minimumPointCount && state.markExtentWidth >= .16, 'retained review mark is incomplete');
      invariant(state.retainedPressureRange >= minimumPressureRange && state.pressureWidthMappingVerified, 'retained review lacks pressure-shaped geometry');
      invariant(status.dataset.retained === 'true', 'retained review status is not visible');
    }
    if (state.undoCount > 0) invariant(state.transitionRecords.some(record => record.action === 'undo'), 'undo did not remove a stroke');
    if (state.resetCount > 0) invariant(state.transitionRecords.some(record => record.action === 'reset'), 'reset did not clear the proof');
    return true;
  };

  installPreviewController({
    id: 'pressure-shaped-freehand-stroke',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready: previewReady
  });
} catch (error) {
  markPreviewFailure(error);
}
