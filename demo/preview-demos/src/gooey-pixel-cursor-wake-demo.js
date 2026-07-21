import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#pixel-route-stage');
  const host = document.querySelector('#pixel-wake-host');
  const status = document.querySelector('#route-status');
  const taskReadout = document.querySelector('#task-readout');
  const coverageReadout = document.querySelector('#coverage-readout');
  const coverageFill = document.querySelector('#coverage-fill');
  const columns = 24;
  const rows = 14;
  const targetCellCount = 12;
  const cellCount = columns * rows;
  const heat = new Float32Array(cellCount);
  const retained = new Uint8Array(cellCount);
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  const state = {
    id: 'gooey-pixel-cursor-wake',
    task: 'human-routed-signal-matrix-safety-path',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'trusted-pointer-touch-or-keyboard-hits-quantized-cells-with-gooey-neighbor-fusion-and-finite-decay',
    assetStrategy: 'code-native-quantized-signal-grid-no-functional-raster-input-required',
    gridDefinition: '24-columns-by-14-rows',
    targetCellCount,
    acceptedInputs: ['mouse-drag', 'touch-drag', 'pen-drag', 'keyboard-arrows', 'keyboard-home'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticPlayback: false,
    automaticTrajectory: false,
    automaticFallback: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-mutation',
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    untrustedMutationCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    gridHitCount: 0,
    uniqueGridHitCount: 0,
    duplicateGridHitCount: 0,
    bridgeRenderCount: 0,
    maximumBridgeCount: 0,
    decayFrameCount: 0,
    decayedCellCount: 0,
    settleCompletionCount: 0,
    retainedCellCount: 0,
    resetCount: 0,
    phase: 'idle-unrouted',
    result: 'awaiting-human-route',
    resultRetained: false,
    routeComplete: false,
    activePointerId: null,
    pointerCaptured: false,
    keyboardColumn: 15,
    keyboardRow: 7,
    lastHitColumn: null,
    lastHitRow: null,
    lastInputKind: 'none',
    lastInputTrusted: null,
    initialGridChecksum: null,
    currentGridChecksum: null,
    initialStillVerified: false,
    firstInputChecksumBefore: null,
    firstInputChecksumAfter: null,
    transitionRecords: [],
    canvasWidth: 0,
    canvasHeight: 0,
    stageWidth: 0,
    stageHeight: 0,
    canvasCoverageRatio: 0,
    fullStageGeometryVerified: false,
    p5InstanceReady: false,
    canvas2dReady: false,
    renderCount: 0,
    drawCount: 0,
    completedDrawCount: 0,
    resizeCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let dirty = true;
  let settleFrame = 0;
  let resizeFrame = 0;
  let lastInitialChecksum = null;

  function invariant(condition, message) {
    if (!condition) throw new Error(`gooey-pixel-cursor-wake: ${message}`);
  }

  function gridChecksum() {
    let checksum = 2166136261;
    for (let index = 0; index < cellCount; index += 1) {
      checksum = Math.imul(checksum ^ retained[index], 16777619) >>> 0;
      checksum = Math.imul(checksum ^ Math.round(heat[index] * 100), 16777619) >>> 0;
    }
    return checksum >>> 0;
  }

  function requestDraw() {
    dirty = true;
    sketch?.redraw();
  }

  function updateGeometry() {
    const canvas = host.querySelector('canvas');
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas?.getBoundingClientRect();
    state.stageWidth = Math.round(stageRect.width);
    state.stageHeight = Math.round(stageRect.height);
    state.canvasWidth = Math.round(canvasRect?.width || 0);
    state.canvasHeight = Math.round(canvasRect?.height || 0);
    const stageArea = Math.max(1, stageRect.width * stageRect.height);
    state.canvasCoverageRatio = Number((((canvasRect?.width || 0) * (canvasRect?.height || 0)) / stageArea).toFixed(4));
    state.fullStageGeometryVerified = Boolean(canvasRect
      && Math.abs(canvasRect.left - stageRect.left) <= 1
      && Math.abs(canvasRect.top - stageRect.top) <= 1
      && state.canvasCoverageRatio >= .995);
  }

  function updateInterface() {
    const count = state.retainedCellCount;
    coverageReadout.textContent = `${String(Math.min(count, targetCellCount)).padStart(2, '0')} / ${targetCellCount}`;
    coverageFill.style.width = `${Math.min(100, count / targetCellCount * 100)}%`;
    status.dataset.complete = String(state.routeComplete);
    if (state.routeComplete) {
      status.textContent = 'ROUTE 04 · LOCKED';
      taskReadout.textContent = 'PATH VERIFIED';
    } else if (state.inputCount > 0) {
      status.textContent = 'SAMPLING GRID';
      taskReadout.textContent = `${Math.max(0, targetCellCount - count)} CELLS TO LOCK`;
    } else {
      status.textContent = 'AWAITING INPUT';
      taskReadout.textContent = 'MARK 12 CELLS';
    }
  }

  function acceptTrusted(event, source) {
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
    return true;
  }

  function hitCell(column, row, source) {
    const x = clamp(Math.round(column), 0, columns - 1);
    const y = clamp(Math.round(row), 0, rows - 1);
    const index = y * columns + x;
    const checksumBefore = gridChecksum();
    if (state.firstInputChecksumBefore === null) state.firstInputChecksumBefore = checksumBefore;
    state.gridHitCount += 1;
    state.lastHitColumn = x;
    state.lastHitRow = y;
    state.keyboardColumn = x;
    state.keyboardRow = y;
    if (retained[index] === 0) {
      retained[index] = 1;
      state.uniqueGridHitCount += 1;
      state.retainedCellCount += 1;
    } else state.duplicateGridHitCount += 1;

    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const neighborX = x + offsetX;
        const neighborY = y + offsetY;
        if (neighborX < 0 || neighborX >= columns || neighborY < 0 || neighborY >= rows) continue;
        const distance = Math.hypot(offsetX, offsetY);
        heat[neighborY * columns + neighborX] = Math.max(heat[neighborY * columns + neighborX], distance === 0 ? 1 : .52);
      }
    }

    state.routeComplete = state.retainedCellCount >= targetCellCount;
    state.resultRetained = state.retainedCellCount > 0;
    state.phase = state.routeComplete ? 'complete-retained' : 'routing';
    state.result = state.routeComplete ? 'route-04-locked' : 'human-route-in-progress';
    state.currentGridChecksum = gridChecksum();
    if (state.firstInputChecksumAfter === null) state.firstInputChecksumAfter = state.currentGridChecksum;
    state.transitionRecords.push({
      source,
      trusted: true,
      column: x,
      row: y,
      checksumBefore,
      checksumAfter: state.currentGridChecksum,
      mutated: checksumBefore !== state.currentGridChecksum
    });
    state.transitionRecords = state.transitionRecords.slice(-48);
    updateInterface();
    startFiniteSettle();
  }

  function pointToCell(clientX, clientY) {
    const bounds = host.getBoundingClientRect();
    return {
      column: Math.floor(clamp((clientX - bounds.left) / Math.max(1, bounds.width), 0, .9999) * columns),
      row: Math.floor(clamp((clientY - bounds.top) / Math.max(1, bounds.height), 0, .9999) * rows)
    };
  }

  function startFiniteSettle() {
    if (settleFrame) cancelAnimationFrame(settleFrame);
    let localDecayFrames = 0;
    const settle = () => {
      let activeCells = 0;
      for (let index = 0; index < cellCount; index += 1) {
        if (heat[index] > .018) {
          heat[index] *= .72;
          activeCells += 1;
        } else if (heat[index] !== 0) {
          heat[index] = 0;
          state.decayedCellCount += 1;
        }
      }
      state.decayFrameCount += 1;
      localDecayFrames += 1;
      state.currentGridChecksum = gridChecksum();
      requestDraw();
      if (activeCells > 0 && localDecayFrames < 240) settleFrame = requestAnimationFrame(settle);
      else {
        settleFrame = 0;
        state.settleCompletionCount += 1;
        state.currentGridChecksum = gridChecksum();
        requestDraw();
      }
    };
    settleFrame = requestAnimationFrame(settle);
  }

  function resetRoute(event) {
    if (!acceptTrusted(event, 'keyboard-home')) return;
    retained.fill(0);
    heat.fill(0);
    state.resetCount += 1;
    state.retainedCellCount = 0;
    state.routeComplete = false;
    state.resultRetained = false;
    state.phase = 'idle-reset';
    state.result = 'awaiting-human-route';
    state.currentGridChecksum = gridChecksum();
    updateInterface();
    requestDraw();
  }

  host.addEventListener('pointerdown', event => {
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-down`)) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    host.setPointerCapture(event.pointerId);
    state.pointerCaptured = host.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    const cell = pointToCell(event.clientX, event.clientY);
    hitCell(cell.column, cell.row, 'pointer-down');
  });

  host.addEventListener('pointermove', event => {
    if (state.activePointerId !== event.pointerId || (event.buttons === 0 && event.pointerType === 'mouse')) return;
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-drag`)) return;
    state.pointerMoveCount += 1;
    const cell = pointToCell(event.clientX, event.clientY);
    if (cell.column !== state.lastHitColumn || cell.row !== state.lastHitRow) hitCell(cell.column, cell.row, 'pointer-drag');
  });

  const releasePointer = event => {
    if (state.activePointerId !== event.pointerId) return;
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-up`)) return;
    state.pointerUpCount += 1;
    if (host.hasPointerCapture(event.pointerId)) {
      host.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
  };
  host.addEventListener('pointerup', releasePointer);
  host.addEventListener('pointercancel', releasePointer);

  host.addEventListener('keydown', event => {
    if (event.key === 'Home') {
      event.preventDefault();
      resetRoute(event);
      return;
    }
    const movement = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
      ' ': [0, 0], Enter: [0, 0]
    }[event.key];
    if (!movement) return;
    if (!acceptTrusted(event, `keyboard-${event.key === ' ' ? 'space' : event.key.toLowerCase()}`)) return;
    event.preventDefault();
    state.keyboardColumn = clamp(state.keyboardColumn + movement[0], 0, columns - 1);
    state.keyboardRow = clamp(state.keyboardRow + movement[1], 0, rows - 1);
    hitCell(state.keyboardColumn, state.keyboardRow, 'keyboard-grid-hit');
  });

  const ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(host);
          p.noLoop();
          p5Ready();
          function p5Ready() {
            state.p5InstanceReady = p instanceof p5;
            state.canvas2dReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
            updateGeometry();
            updateInterface();
            state.ready = true;
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.drawCount += 1;
        const width = p.width;
        const height = p.height;
        const cellWidth = width / columns;
        const cellHeight = height / rows;
        const context = p.drawingContext;
        p.background('#070a10');

        p.noStroke();
        for (let y = 0; y < rows; y += 1) {
          for (let x = 0; x < columns; x += 1) {
            const index = y * columns + x;
            const checker = (x + y) % 2;
            p.fill(checker ? '#0d131d' : '#0a1018');
            p.rect(x * cellWidth + 1, y * cellHeight + 1, Math.max(1, cellWidth - 2), Math.max(1, cellHeight - 2), 2);
          }
        }

        let bridges = 0;
        context.save();
        context.globalCompositeOperation = 'lighter';
        context.shadowBlur = Math.max(7, Math.min(cellWidth, cellHeight) * 1.5);
        context.shadowColor = '#72e7ff';
        for (let y = 0; y < rows; y += 1) {
          for (let x = 0; x < columns; x += 1) {
            const index = y * columns + x;
            const level = Math.max(heat[index], retained[index] ? .34 : 0);
            if (level <= .01) continue;
            const centerX = (x + .5) * cellWidth;
            const centerY = (y + .5) * cellHeight;
            const diameter = Math.max(3, Math.min(cellWidth, cellHeight) * (.42 + level * .42));
            p.noStroke();
            p.fill(level > .62 ? 'rgba(215,255,82,.92)' : `rgba(101,230,255,${.28 + level * .48})`);
            p.rect(centerX - diameter / 2, centerY - diameter / 2, diameter, diameter, Math.max(2, diameter * .32));

            const right = x + 1 < columns ? index + 1 : -1;
            const below = y + 1 < rows ? index + columns : -1;
            if (right >= 0 && (retained[right] || heat[right] > .08)) {
              p.fill('rgba(101,230,255,.46)');
              p.rect(centerX, centerY - diameter * .19, cellWidth, diameter * .38, diameter);
              bridges += 1;
            }
            if (below >= 0 && (retained[below] || heat[below] > .08)) {
              p.fill('rgba(101,230,255,.38)');
              p.rect(centerX - diameter * .19, centerY, diameter * .38, cellHeight, diameter);
              bridges += 1;
            }
          }
        }
        context.restore();
        state.bridgeRenderCount += bridges;
        state.maximumBridgeCount = Math.max(state.maximumBridgeCount, bridges);

        if (state.inputCount > 0) {
          const x = (state.lastHitColumn + .5) * cellWidth;
          const y = (state.lastHitRow + .5) * cellHeight;
          p.noFill();
          p.stroke('#eef2e8');
          p.strokeWeight(1);
          p.rect(x - cellWidth * .39, y - cellHeight * .39, cellWidth * .78, cellHeight * .78, 3);
        }
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
      updateGeometry();
      requestDraw();
    });
  });
  resizeObserver.observe(stage);

  function render() {
    state.renderCount += 1;
    updateGeometry();
    state.currentGridChecksum = gridChecksum();
    if (state.inputCount === 0) {
      if (state.initialGridChecksum === null) state.initialGridChecksum = state.currentGridChecksum;
      if (lastInitialChecksum === null) lastInitialChecksum = state.currentGridChecksum;
      else state.initialStillVerified = lastInitialChecksum === state.currentGridChecksum
        && state.currentGridChecksum === state.initialGridChecksum
        && state.retainedCellCount === 0;
    }
    if (dirty) sketch?.redraw();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.p5InstanceReady && state.canvas2dReady, 'p5 canvas is not ready');
    invariant(state.fullStageGeometryVerified && state.canvasCoverageRatio >= .995, 'canvas does not cover the full stage');
    invariant(state.automaticPlayback === false && state.automaticTrajectory === false && state.automaticFallback === false, 'automatic motion is forbidden');
    invariant(state.captureClockDriven === false && state.renderIgnoresPreviewClock === true, 'preview clock must not mutate the task');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed the route');
    invariant(state.inputCount === state.trustedInputCount, 'trusted input accounting diverged');
    invariant(state.pointerInputCount + state.keyboardInputCount === state.inputCount, 'input modality accounting diverged');
    invariant(state.touchInputCount + state.penInputCount <= state.pointerInputCount, 'pointer subtype accounting diverged');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial frame was not verified still');
    invariant(state.gridHitCount === state.uniqueGridHitCount + state.duplicateGridHitCount, 'grid-hit accounting diverged');
    invariant(state.retainedCellCount <= state.uniqueGridHitCount, 'retained result exceeds cumulative unique hit count');
    invariant(state.transitionRecords.every(record => record.trusted === true), 'transition did not follow trusted input');

    const clearedAfterHumanReset = state.resetCount > 0 && state.retainedCellCount === 0;
    if (state.inputCount > 0 && !clearedAfterHumanReset) {
      invariant(state.gridHitCount > 0 && state.firstInputChecksumBefore !== state.firstInputChecksumAfter, 'human input did not mutate a quantized grid cell');
      invariant(state.transitionRecords.some(record => record.mutated === true), 'no trusted input produced a grid mutation');
      invariant(state.decayFrameCount > 0 && state.decayedCellCount > 0 && state.settleCompletionCount > 0, 'finite glow decay did not settle');
      invariant(state.maximumBridgeCount > 0, 'adjacent quantized cells never formed a gooey bridge');
      invariant(state.resultRetained && state.retainedCellCount > 0, 'route result was not retained');
      if (state.routeComplete) invariant(state.phase === 'complete-retained' && state.result === 'route-04-locked' && state.retainedCellCount >= targetCellCount, 'completed route result is inconsistent');
    }
    if (clearedAfterHumanReset) invariant(state.phase === 'idle-reset' && state.result === 'awaiting-human-route' && state.resultRetained === false, 'human reset did not clear the retained result');
    return true;
  };

  installPreviewController({
    id: 'gooey-pixel-cursor-wake',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
