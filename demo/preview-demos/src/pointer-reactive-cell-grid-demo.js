import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#cell-grid-stage');
  const host = document.querySelector('#cell-host');
  const status = document.querySelector('#grid-status');
  const statusLabel = document.querySelector('#status-label');
  const resultLabel = document.querySelector('#result-label');
  const proximityLabel = document.querySelector('#proximity-label');
  const columns = 12;
  const rows = 7;
  const target = Object.freeze({ column: 7, row: 3, code: 'H4' });
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const easeOutCubic = value => 1 - (1 - value) ** 3;

  const state = {
    id: 'pointer-reactive-cell-grid',
    task: 'operator-locates-and-confirms-density-drift-cell-h4',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'trusted-human-proximity-continuously-modulates-a-distance-field-while-an-explicit-confirmation-creates-one-finite-cell-pulse-and-retained-diagnostic-result',
    assetStrategy: 'code-native-deterministic-cell-matrix-no-functional-raster-input-required',
    acceptedInputs: ['trusted-mouse-move', 'trusted-touch-or-pen-move', 'trusted-pointer-confirmation', 'keyboard-arrows', 'keyboard-enter-or-space'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticPlayback: false,
    automaticTrajectory: false,
    automaticPulse: false,
    automaticFallback: false,
    captureClockOnlyAdvancesHumanStartedPulse: true,
    syntheticInputDispatch: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    untrustedMutationCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    proximityInputCount: 0,
    confirmationInputCount: 0,
    correctConfirmationCount: 0,
    incorrectConfirmationCount: 0,
    pulseStartCount: 0,
    pulseCompletionCount: 0,
    activePulseCount: 0,
    proximity: null,
    keyboardCell: null,
    hoveredCell: null,
    minimumTargetDistance: null,
    maximumDistanceInfluence: 0,
    influencedCellCount: 0,
    distanceFieldSampleCount: 0,
    distanceFieldSignature: 'idle',
    pulseOrigin: null,
    pulseKind: 'none',
    pulseProgress: 0,
    pulseStartedAt: null,
    pulseDuration: .72,
    phase: 'idle',
    result: 'awaiting-human-scan',
    resultRetained: false,
    confirmedCell: null,
    lastInputKind: 'none',
    lastInputTrusted: null,
    inputRecords: [],
    confirmationRecords: [],
    transitionFrameCount: 0,
    initialModelSignature: null,
    initialStillVerified: false,
    initialStaticDrawCount: 0,
    renderCount: 0,
    drawCount: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    stageWidth: 0,
    stageHeight: 0,
    canvasCoverageRatio: 0,
    fullStageGeometryVerified: false,
    p5InstanceReady: false,
    canvas2dReady: false,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__POINTER_REACTIVE_CELL_GRID_STATE__ = state;

  let sketch;
  let resolveReady;
  let dirty = true;
  let lastRenderTime = 0;
  let lastDrawSignature = null;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  function invariant(condition, message) {
    if (!condition) throw new Error(`pointer-reactive-cell-grid: ${message}`);
  }

  function layoutFor(width, height) {
    const portrait = height > width * 1.15;
    const left = portrait ? 16 : Math.max(94, width * .29);
    const right = width - (portrait ? 16 : 15);
    const top = portrait ? 108 : width < 400 ? 42 : 31;
    const bottom = height - (portrait ? 38 : 22);
    const cellWidth = (right - left) / columns;
    const cellHeight = (bottom - top) / rows;
    return {
      portrait,
      left,
      right,
      top,
      bottom,
      cellWidth,
      cellHeight,
      radius: Math.max(36, Math.min(76, Math.min(right - left, bottom - top) * .38))
    };
  }

  function cellCenter(column, row, layout) {
    return {
      x: layout.left + (column + .5) * layout.cellWidth,
      y: layout.top + (row + .5) * layout.cellHeight
    };
  }

  function pointToCell(clientX, clientY) {
    const bounds = host.getBoundingClientRect();
    const layout = layoutFor(bounds.width, bounds.height);
    const x = clamp(clientX - bounds.left, layout.left, layout.right - .001);
    const y = clamp(clientY - bounds.top, layout.top, layout.bottom - .001);
    return {
      column: clamp(Math.floor((x - layout.left) / layout.cellWidth), 0, columns - 1),
      row: clamp(Math.floor((y - layout.top) / layout.cellHeight), 0, rows - 1),
      x,
      y
    };
  }

  function updateGeometry() {
    const canvas = host.querySelector('canvas');
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas?.getBoundingClientRect();
    state.stageWidth = Math.round(stageRect.width);
    state.stageHeight = Math.round(stageRect.height);
    state.canvasWidth = Math.round(canvasRect?.width || 0);
    state.canvasHeight = Math.round(canvasRect?.height || 0);
    state.canvasCoverageRatio = Number((((canvasRect?.width || 0) * (canvasRect?.height || 0)) / Math.max(1, stageRect.width * stageRect.height)).toFixed(4));
    state.fullStageGeometryVerified = Boolean(canvasRect
      && Math.abs(canvasRect.left - stageRect.left) <= 1
      && Math.abs(canvasRect.top - stageRect.top) <= 1
      && Math.abs(canvasRect.right - stageRect.right) <= 1
      && Math.abs(canvasRect.bottom - stageRect.bottom) <= 1
      && state.canvasCoverageRatio >= .995);
  }

  function modelSignature() {
    const pointerPart = state.proximity
      ? `${state.proximity.x.toFixed(2)}:${state.proximity.y.toFixed(2)}`
      : 'none';
    return [pointerPart, state.pulseKind, state.pulseProgress.toFixed(3), state.confirmedCell || 'none', state.phase].join('|');
  }

  function requestDraw() {
    dirty = true;
    sketch?.redraw();
  }

  function updateInterface() {
    status.dataset.phase = state.phase;
    if (state.phase === 'confirmed') {
      statusLabel.textContent = 'Drift isolated';
      resultLabel.textContent = `CELL ${state.confirmedCell} · CONFIRMED`;
    } else if (state.phase === 'confirming') {
      statusLabel.textContent = 'Confirming sample';
      resultLabel.textContent = `PULSE ${state.pulseOrigin?.code || '—'}`;
    } else if (state.phase === 'miss-retained') {
      statusLabel.textContent = 'Sample mismatch';
      resultLabel.textContent = 'MISS · CONTINUE SCAN';
    } else if (state.proximity) {
      statusLabel.textContent = 'Live proximity';
      resultLabel.textContent = 'CLICK CELL H4';
    } else {
      statusLabel.textContent = 'Awaiting scan';
      resultLabel.textContent = 'NO CELL CONFIRMED';
    }
    proximityLabel.textContent = state.proximity
      ? `PROXIMITY ${String(Math.round(state.maximumDistanceInfluence * 100)).padStart(2, '0')}% · ${state.hoveredCell || '—'}`
      : 'PROXIMITY —';
  }

  function acceptTrusted(event, source, category) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = source;
    if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (event.pointerType === 'touch') state.touchInputCount += 1;
      if (event.pointerType === 'pen') state.penInputCount += 1;
    }
    if (category === 'proximity') state.proximityInputCount += 1;
    if (category === 'confirmation') state.confirmationInputCount += 1;
    state.inputRecords.push({
      source,
      category,
      trusted: true,
      phaseBefore: state.phase,
      pulseStartsBefore: state.pulseStartCount,
      resultBefore: state.result
    });
    state.inputRecords = state.inputRecords.slice(-64);
    return true;
  }

  function setProximity(point, source) {
    const bounds = host.getBoundingClientRect();
    const layout = layoutFor(bounds.width, bounds.height);
    const targetCenter = cellCenter(target.column, target.row, layout);
    const distance = Math.hypot(point.x - targetCenter.x, point.y - targetCenter.y);
    const influence = clamp(1 - distance / layout.radius);
    state.proximity = { x: point.x, y: point.y, source };
    state.hoveredCell = `${String.fromCharCode(65 + point.column)}${point.row + 1}`;
    state.minimumTargetDistance = state.minimumTargetDistance === null ? distance : Math.min(state.minimumTargetDistance, distance);
    state.maximumDistanceInfluence = Math.max(state.maximumDistanceInfluence, influence);
    state.distanceFieldSampleCount += 1;
    state.distanceFieldSignature = `${state.hoveredCell}:${Math.round(distance)}:${Math.round(influence * 100)}`;
    if (!state.resultRetained && state.phase !== 'confirming') {
      state.phase = 'scanning';
      state.result = 'human-proximity-scan-active';
    }
    updateInterface();
    requestDraw();
  }

  function beginPulse(point, source) {
    if (state.activePulseCount > 0 || state.resultRetained) return;
    const code = `${String.fromCharCode(65 + point.column)}${point.row + 1}`;
    const correct = point.column === target.column && point.row === target.row;
    state.pulseOrigin = { column: point.column, row: point.row, code };
    state.pulseKind = correct ? 'confirm' : 'miss';
    state.pulseProgress = 0;
    state.pulseStartedAt = lastRenderTime;
    state.activePulseCount = 1;
    state.pulseStartCount += 1;
    state.phase = 'confirming';
    state.result = correct ? 'confirmation-pulse-in-transit' : 'rejection-pulse-in-transit';
    if (correct) state.correctConfirmationCount += 1;
    else state.incorrectConfirmationCount += 1;
    state.confirmationRecords.push({ source, trusted: true, code, correct, committed: false });
    updateInterface();
    requestDraw();
  }

  function finishPulse() {
    const record = state.confirmationRecords.at(-1);
    state.activePulseCount = 0;
    state.pulseProgress = 1;
    state.pulseCompletionCount += 1;
    if (state.pulseKind === 'confirm') {
      state.phase = 'confirmed';
      state.result = 'cell-h4-density-drift-confirmed';
      state.resultRetained = true;
      state.confirmedCell = target.code;
      if (record) record.committed = true;
    } else {
      state.phase = 'miss-retained';
      state.result = 'incorrect-cell-rejected-continue-scan';
      state.resultRetained = false;
    }
    updateInterface();
    requestDraw();
  }

  function handlePointerMove(event) {
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-move`, 'proximity')) return;
    setProximity(pointToCell(event.clientX, event.clientY), 'pointer');
  }

  function handlePointerDown(event) {
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-confirm`, 'confirmation')) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    const point = pointToCell(event.clientX, event.clientY);
    setProximity(point, 'pointer-confirm');
    beginPulse(point, 'pointer');
  }

  function handleKeyDown(event) {
    const movement = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    }[event.key];
    const isConfirm = event.key === 'Enter' || event.key === ' ';
    if (!movement && !isConfirm) return;
    if (!acceptTrusted(event, isConfirm ? 'keyboard-confirm' : 'keyboard-proximity', isConfirm ? 'confirmation' : 'proximity')) return;
    event.preventDefault();
    if (!state.keyboardCell) state.keyboardCell = { column: 6, row: 3 };
    if (movement) {
      state.keyboardCell = {
        column: clamp(state.keyboardCell.column + movement[0], 0, columns - 1),
        row: clamp(state.keyboardCell.row + movement[1], 0, rows - 1)
      };
    }
    const layout = layoutFor(host.clientWidth, host.clientHeight);
    const center = cellCenter(state.keyboardCell.column, state.keyboardCell.row, layout);
    const point = { ...state.keyboardCell, ...center };
    setProximity(point, 'keyboard');
    if (isConfirm) beginPulse(point, 'keyboard');
  }

  host.addEventListener('pointermove', handlePointerMove);
  host.addEventListener('pointerdown', handlePointerDown);
  host.addEventListener('keydown', handleKeyDown);

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(stage.clientWidth, stage.clientHeight).parent(host);
      p.noLoop();
      state.p5InstanceReady = sketch instanceof p5;
      state.canvas2dReady = Boolean(host.querySelector('canvas')?.getContext('2d'));
      state.ready = true;
      updateGeometry();
      resolveReady();
    };

    p.windowResized = () => {
      p.resizeCanvas(stage.clientWidth, stage.clientHeight);
      updateGeometry();
      requestDraw();
    };

    p.draw = () => {
      state.drawCount += 1;
      const width = p.width;
      const height = p.height;
      const layout = layoutFor(width, height);
      const focus = state.proximity;
      let influenced = 0;

      p.background('#0b1116');
      p.noStroke();
      const wash = p.drawingContext.createRadialGradient(width * .68, height * .44, 0, width * .68, height * .44, Math.max(width, height) * .68);
      wash.addColorStop(0, '#17272b');
      wash.addColorStop(.55, '#0f191d');
      wash.addColorStop(1, '#0b1116');
      p.drawingContext.fillStyle = wash;
      p.rect(0, 0, width, height);

      p.textFont('ui-monospace, monospace');
      p.textAlign(p.CENTER, p.CENTER);
      for (let column = 0; column < columns; column += 1) {
        p.noStroke();
        p.fill(139, 155, 156, 125);
        p.textSize(Math.max(4.5, Math.min(7, layout.cellWidth * .3)));
        p.text(String.fromCharCode(65 + column), layout.left + (column + .5) * layout.cellWidth, layout.top - 7);
      }

      for (let row = 0; row < rows; row += 1) {
        p.fill(139, 155, 156, 125);
        p.textSize(Math.max(4.5, Math.min(7, layout.cellHeight * .28)));
        p.text(String(row + 1), layout.left - 7, layout.top + (row + .5) * layout.cellHeight);
        for (let column = 0; column < columns; column += 1) {
          const center = cellCenter(column, row, layout);
          const distance = focus ? Math.hypot(center.x - focus.x, center.y - focus.y) : Infinity;
          const influence = focus ? clamp(1 - distance / layout.radius) : 0;
          if (influence > .02) influenced += 1;
          const isTarget = column === target.column && row === target.row;
          const isConfirmed = state.confirmedCell === target.code && isTarget;
          const gap = Math.max(2.3, Math.min(layout.cellWidth, layout.cellHeight) * .16);
          const baseWidth = Math.max(5, layout.cellWidth - gap);
          const baseHeight = Math.max(5, layout.cellHeight - gap);
          const lift = influence * Math.min(4, Math.min(layout.cellWidth, layout.cellHeight) * .25);

          p.push();
          p.translate(center.x, center.y);
          p.noStroke();
          if (isConfirmed) p.fill('#70f0d0');
          else if (isTarget) p.fill(185 + influence * 20, 196 + influence * 42, 111 + influence * 15, 220);
          else p.fill(45 + influence * 58, 60 + influence * 83, 64 + influence * 75, 205 + influence * 40);
          p.rectMode(p.CENTER);
          p.rect(0, 0, baseWidth + lift, baseHeight + lift, Math.max(1.5, baseWidth * .15));

          if (isTarget && !isConfirmed) {
            p.fill('#d8ff7a');
            const notch = Math.max(1.5, Math.min(3, baseWidth * .18));
            p.circle(baseWidth * .28, -baseHeight * .28, notch);
          }
          if (isConfirmed) {
            p.stroke('#0b2825');
            p.strokeWeight(Math.max(1, baseWidth * .08));
            p.noFill();
            p.line(-baseWidth * .2, 0, -baseWidth * .04, baseHeight * .17);
            p.line(-baseWidth * .04, baseHeight * .17, baseWidth * .24, -baseHeight * .2);
          }
          p.pop();
        }
      }

      state.influencedCellCount = influenced;
      if (focus) {
        p.noFill();
        p.stroke(216, 255, 122, 35);
        p.strokeWeight(1);
        p.circle(focus.x, focus.y, layout.radius * 2);
        p.fill('#d8ff7a');
        p.noStroke();
        p.circle(focus.x, focus.y, 3);
      }

      if (state.pulseOrigin && (state.activePulseCount > 0 || state.pulseProgress === 1)) {
        const origin = cellCenter(state.pulseOrigin.column, state.pulseOrigin.row, layout);
        const progress = easeOutCubic(state.pulseProgress);
        const correct = state.pulseKind === 'confirm';
        p.noFill();
        p.stroke(correct ? `rgba(112,240,208,${.85 * (1 - state.pulseProgress)})` : `rgba(255,126,105,${.8 * (1 - state.pulseProgress)})`);
        p.strokeWeight(Math.max(1, 2.4 * (1 - state.pulseProgress)));
        p.circle(origin.x, origin.y, 8 + progress * layout.radius * 1.7);
        if (state.activePulseCount > 0) {
          p.noStroke();
          p.fill(correct ? '#70f0d0' : '#ff7e69');
          p.circle(origin.x, origin.y, 4 + Math.sin(progress * Math.PI) * 7);
        }
      }

      state.distanceFieldSignature = focus
        ? `${state.hoveredCell}:${state.influencedCellCount}:${Math.round(state.maximumDistanceInfluence * 100)}`
        : 'idle';
      const signature = modelSignature();
      if (state.inputCount === 0) {
        state.initialStaticDrawCount += 1;
        if (state.initialModelSignature === null) state.initialModelSignature = signature;
        if (lastDrawSignature !== null) state.initialStillVerified = signature === lastDrawSignature && signature === state.initialModelSignature;
      }
      lastDrawSignature = signature;
      dirty = false;
    };
  }, host);

  const resizeObserver = new ResizeObserver(() => {
    if (!sketch || stage.clientWidth === sketch.width && stage.clientHeight === sketch.height) return;
    sketch.resizeCanvas(stage.clientWidth, stage.clientHeight);
    updateGeometry();
    requestDraw();
  });
  resizeObserver.observe(stage);

  function render(time) {
    state.renderCount += 1;
    lastRenderTime = Number.isFinite(time) ? time : lastRenderTime;
    updateGeometry();
    if (state.inputCount === 0 && state.initialModelSignature !== null) {
      state.initialStillVerified = modelSignature() === state.initialModelSignature;
    }
    if (state.activePulseCount > 0) {
      const nextProgress = clamp((lastRenderTime - state.pulseStartedAt) / state.pulseDuration);
      if (nextProgress > state.pulseProgress) {
        state.pulseProgress = nextProgress;
        state.transitionFrameCount += 1;
        dirty = true;
      }
      if (state.pulseProgress >= 1) finishPulse();
    }
    if (dirty) sketch?.redraw();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.p5InstanceReady && state.canvas2dReady, 'p5 canvas is not ready');
    invariant(state.fullStageGeometryVerified && state.canvasCoverageRatio >= .995, 'canvas does not cover the full stage');
    invariant(state.automaticPlayback === false && state.automaticTrajectory === false && state.automaticPulse === false && state.automaticFallback === false, 'automatic interaction is forbidden');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed the diagnostic');
    invariant(state.inputCount === state.trustedInputCount, 'trusted input accounting diverged');
    invariant(state.pointerInputCount + state.keyboardInputCount === state.inputCount, 'input modality accounting diverged');
    invariant(state.touchInputCount + state.penInputCount <= state.pointerInputCount, 'pointer subtype accounting diverged');
    invariant(state.inputRecords.every(record => record.trusted === true), 'an accepted record was not trusted');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial frame was not verified still');
    invariant(state.pulseStartCount === state.correctConfirmationCount + state.incorrectConfirmationCount, 'pulse/confirmation accounting diverged');
    invariant(state.pulseCompletionCount <= state.pulseStartCount && state.activePulseCount <= 1, 'finite pulse accounting diverged');
    invariant(state.confirmationRecords.every(record => record.trusted === true), 'a pulse lacked trusted human causality');

    if (state.proximityInputCount > 0) {
      invariant(state.proximity !== null && state.hoveredCell !== null, 'trusted proximity did not locate a cell');
      invariant(state.distanceFieldSampleCount > 0 && state.distanceFieldSignature !== 'idle', 'distance field was not sampled');
      invariant(state.influencedCellCount > 0 && state.maximumDistanceInfluence > 0, 'proximity did not influence the cell field');
      invariant(state.minimumTargetDistance !== null, 'target distance was not measured');
    }
    if (state.confirmationInputCount > 0) {
      invariant(state.pulseStartCount > 0 && state.pulseOrigin !== null, 'trusted confirmation did not start a pulse');
      invariant(state.confirmationRecords.length === state.pulseStartCount, 'pulse records diverged from starts');
    }
    if (state.pulseCompletionCount > 0) {
      invariant(state.pulseProgress === 1 && state.activePulseCount === 0 && state.transitionFrameCount > 1, 'pulse did not finish as a finite transition');
    }
    if (state.resultRetained) {
      invariant(state.phase === 'confirmed' && state.result === 'cell-h4-density-drift-confirmed', 'retained diagnostic conclusion is inconsistent');
      invariant(state.confirmedCell === target.code && state.correctConfirmationCount > 0, 'the requested target was not confirmed');
      invariant(state.confirmationRecords.some(record => record.correct && record.committed), 'no trusted correct pulse committed the result');
    }
    return true;
  };

  installPreviewController({
    id: 'pointer-reactive-cell-grid',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
