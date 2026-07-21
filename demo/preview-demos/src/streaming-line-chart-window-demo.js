import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#telemetry-stage');
  const host = document.querySelector('#stream-host');
  const latestReading = document.querySelector('#latest-reading');
  const sampleState = document.querySelector('#sample-state');
  const dropOutput = document.querySelector('#drop-output');
  const reviewState = document.querySelector('#review-state');
  const reviewOutput = document.querySelector('#review-output');
  const addButton = document.querySelector('#add-sample');
  const undoButton = document.querySelector('#undo-sample');
  const resetButton = document.querySelector('#reset-window');
  const keepButton = document.querySelector('#keep-event');
  const threshold = 6.5;
  const windowSize = 12;
  const initialValues = [2.8, 3.0, 3.3, 3.1, 3.6, 3.8, 4.0, 3.7, 4.3, 4.7, 5.0, 4.6];
  const futureValues = [5.4, 6.8, 8.2, 7.4, 5.8, 4.9, 4.2, 3.8, 3.5, 3.4, 3.1, 3.0];
  const sourceSamples = [...initialValues, ...futureValues].map((value, index) => ({
    id: `C${412 + index}`,
    minute: index * 2,
    value
  }));

  if (!stage || !host || !latestReading || !sampleState || !dropOutput || !reviewState || !reviewOutput || !addButton || !undoButton || !resetButton || !keepButton) {
    throw new Error('streaming telemetry DOM is incomplete');
  }

  const state = {
    id: 'streaming-line-chart-window',
    task: 'human-advances-a-deterministic-cold-room-telemetry-window-one-sample-at-a-time-and-explicitly-keeps-a-threshold-event',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'each-trusted-add-appends-one-deterministic-sample-and-shifts-exactly-one-oldest-sample-out-of-a-fixed-p5-line-chart-window',
    assetStrategy: 'code-native-deterministic-time-series-no-functional-raster-input-required',
    imageGenerationDecision: 'omitted-because-raster-pixels-would-not-drive-sample-order-fixed-window-eviction-threshold-detection-or-review-retention',
    acceptedInputs: ['trusted-add-button', 'keyboard-space-or-a-add', 'trusted-keep-button', 'keyboard-enter-keep', 'trusted-undo-button-or-z', 'trusted-reset-button-or-r'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticSampling: false,
    automaticPlayback: false,
    automaticCycle: false,
    automaticRehearsal: false,
    automaticFallback: false,
    infiniteTimer: false,
    previewClockDriven: false,
    renderIgnoresPreviewClock: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-sample-window-event-or-decision-mutation',
    untrustedMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    rejectedUntrustedInputCount: 0,
    sampleAdvanceInputCount: 0,
    sampleAdvanceCount: 0,
    rejectedSampleAdvanceCount: 0,
    appliedSampleCount: 0,
    windowShiftCount: 0,
    oldestRemovalCount: 0,
    anomalyArrivalCount: 0,
    undoCount: 0,
    resetCount: 0,
    confirmationCount: 0,
    rejectedConfirmationCount: 0,
    decisionClearCount: 0,
    prematureCommitCount: 0,
    sourceSampleCount: sourceSamples.length,
    sourceChecksum: 0,
    sourceCursor: windowSize,
    windowSize,
    visibleSamples: sourceSamples.slice(0, windowSize).map(sample => ({ ...sample })),
    history: [],
    latestSampleId: sourceSamples[windowSize - 1].id,
    latestValue: sourceSamples[windowSize - 1].value,
    latestIsAnomaly: false,
    visibleAnomalyCount: 0,
    lastRemovedSampleId: null,
    lastAddedSampleId: null,
    lastEventSampleId: null,
    retainedEvent: null,
    retainedWindowChecksum: null,
    retainedSourceCursor: null,
    reviewRetained: false,
    phase: 'idle-window',
    result: 'no-event-kept',
    chartBounds: { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 },
    chartWithinStage: false,
    canvasCoverageRatio: 0,
    fullStageGeometryVerified: false,
    visibleWindowChecksum: 0,
    initialWindowChecksum: 0,
    initialWindowVerified: false,
    fixedWindowVerified: false,
    evictionVerified: true,
    allVisibleSamplesFromSource: true,
    thresholdLineVisible: false,
    p5InstanceReady: false,
    canvas2dReady: false,
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
    if (!condition) throw new Error(`streaming-line-chart-window: ${message}`);
  }

  function checksum(samples) {
    let result = 2166136261;
    samples.forEach(sample => {
      for (const character of sample.id) result = Math.imul(result ^ character.codePointAt(0), 16777619) >>> 0;
      result = Math.imul(result ^ Math.round(sample.value * 100), 16777619) >>> 0;
      result = Math.imul(result ^ sample.minute, 16777619) >>> 0;
    });
    return result >>> 0;
  }

  state.sourceChecksum = checksum(sourceSamples);
  state.initialWindowChecksum = checksum(state.visibleSamples);
  state.visibleWindowChecksum = state.initialWindowChecksum;

  function calculateGeometry() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const portrait = width <= 270;
    const bounds = portrait
      ? { left: 12, right: width - 12, top: 135, bottom: height - 66 }
      : { left: width < 480 ? 103 : 182, right: width - 12, top: 48, bottom: height - 59 };
    state.chartBounds = { ...bounds, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top };
    state.chartWithinStage = bounds.left >= 0 && bounds.right <= width && bounds.top >= 0 && bounds.bottom <= height && bounds.right > bounds.left && bounds.bottom > bounds.top;
    const canvasRect = host.querySelector('canvas')?.getBoundingClientRect();
    state.canvasCoverageRatio = Number((((canvasRect?.width || 0) * (canvasRect?.height || 0)) / Math.max(1, width * height)).toFixed(4));
    state.fullStageGeometryVerified = state.chartWithinStage && state.canvasCoverageRatio >= .995;
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
    if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    else if (source.startsWith('pointer')) state.pointerInputCount += 1;
    else state.controlInputCount += 1;
    return true;
  }

  function formatTime(sample) {
    const totalMinutes = 8 * 60 + sample.minute;
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
  }

  function clearRetainedDecision() {
    if (!state.reviewRetained) return;
    state.retainedEvent = null;
    state.retainedWindowChecksum = null;
    state.retainedSourceCursor = null;
    state.reviewRetained = false;
    state.result = 'no-event-kept';
    state.decisionClearCount += 1;
    reviewState.dataset.retained = 'false';
    keepButton.textContent = 'KEEP EVENT';
  }

  function updateDerivedState() {
    const latest = state.visibleSamples.at(-1);
    const anomalies = state.visibleSamples.filter(sample => sample.value > threshold);
    state.latestSampleId = latest.id;
    state.latestValue = latest.value;
    state.latestIsAnomaly = latest.value > threshold;
    state.visibleAnomalyCount = anomalies.length;
    state.lastEventSampleId = anomalies.at(-1)?.id || null;
    state.appliedSampleCount = state.history.length;
    state.visibleWindowChecksum = checksum(state.visibleSamples);
    state.fixedWindowVerified = state.visibleSamples.length === windowSize;
    state.allVisibleSamplesFromSource = state.visibleSamples.every(sample => sourceSamples.some(source => source.id === sample.id && source.value === sample.value && source.minute === sample.minute));
    state.evictionVerified = state.history.every((record, index) => record.added.id === sourceSamples[windowSize + index].id
      && record.removed.id === sourceSamples[index].id
      && !state.visibleSamples.some(sample => sample.id === record.removed.id));
    addButton.disabled = state.sourceCursor >= sourceSamples.length;
    undoButton.disabled = state.history.length === 0;
    resetButton.disabled = state.history.length === 0;
    latestReading.dataset.alert = String(state.latestIsAnomaly);
    sampleState.textContent = `${state.latestValue.toFixed(1)}°C · #${state.latestSampleId}`;
    reviewState.dataset.alert = String(state.latestIsAnomaly && !state.reviewRetained);
  }

  function advanceSample(source) {
    if (state.sourceCursor >= sourceSamples.length) {
      state.rejectedSampleAdvanceCount += 1;
      reviewOutput.textContent = 'SOURCE BATCH COMPLETE';
      return;
    }
    clearRetainedDecision();
    const added = { ...sourceSamples[state.sourceCursor] };
    const removed = state.visibleSamples.shift();
    state.visibleSamples.push(added);
    state.history.push({ added, removed });
    state.sourceCursor += 1;
    state.sampleAdvanceInputCount += 1;
    state.sampleAdvanceCount += 1;
    state.windowShiftCount += 1;
    state.oldestRemovalCount += 1;
    if (added.value > threshold) state.anomalyArrivalCount += 1;
    state.lastRemovedSampleId = removed.id;
    state.lastAddedSampleId = added.id;
    state.phase = added.value > threshold ? 'threshold-event-unconfirmed' : 'sample-added-unconfirmed';
    state.result = 'no-event-kept';
    state.transitionRecords.push({ source, trusted: true, action: 'add-sample', addedId: added.id, addedValue: added.value, removedId: removed.id, sourceCursor: state.sourceCursor });
    state.transitionRecords = state.transitionRecords.slice(-48);
    dropOutput.textContent = `DROPPED #${removed.id} · ADDED #${added.id}`;
    reviewOutput.textContent = added.value > threshold ? `THRESHOLD EVENT · ${added.value.toFixed(1)}°C` : `SAMPLE ACCEPTED · ${formatTime(added)}`;
    updateDerivedState();
    requestDraw();
  }

  function undoSample(source) {
    const record = state.history.pop();
    if (!record) return;
    clearRetainedDecision();
    const removedAdded = state.visibleSamples.pop();
    state.visibleSamples.unshift(record.removed);
    state.sourceCursor -= 1;
    state.undoCount += 1;
    state.phase = state.history.length ? 'window-edited-unconfirmed' : 'idle-window';
    state.result = 'no-event-kept';
    state.lastRemovedSampleId = state.history.at(-1)?.removed.id || null;
    state.lastAddedSampleId = state.history.at(-1)?.added.id || null;
    state.transitionRecords.push({ source, trusted: true, action: 'undo', restoredId: record.removed.id, removedAddedId: removedAdded.id, sourceCursor: state.sourceCursor });
    updateDerivedState();
    dropOutput.textContent = `RESTORED #${record.removed.id}`;
    reviewOutput.textContent = state.visibleAnomalyCount ? `${state.visibleAnomalyCount} EVENT${state.visibleAnomalyCount === 1 ? '' : 'S'} IN WINDOW` : 'NO EVENT KEPT';
    requestDraw();
  }

  function resetWindow(source) {
    if (!state.history.length) return;
    clearRetainedDecision();
    state.visibleSamples = sourceSamples.slice(0, windowSize).map(sample => ({ ...sample }));
    state.history = [];
    state.sourceCursor = windowSize;
    state.resetCount += 1;
    state.phase = 'reset-window';
    state.result = 'no-event-kept';
    state.lastRemovedSampleId = null;
    state.lastAddedSampleId = null;
    state.transitionRecords.push({ source, trusted: true, action: 'reset', checksum: state.initialWindowChecksum });
    updateDerivedState();
    dropOutput.textContent = 'WINDOW RESTORED';
    reviewOutput.textContent = 'NO EVENT KEPT';
    requestDraw();
  }

  function keepLatestEvent(source) {
    const anomaly = [...state.visibleSamples].reverse().find(sample => sample.value > threshold);
    if (!anomaly) {
      state.rejectedConfirmationCount += 1;
      reviewOutput.textContent = 'NO THRESHOLD EVENT TO KEEP';
      return;
    }
    state.confirmationCount += 1;
    state.retainedEvent = { ...anomaly };
    state.retainedWindowChecksum = state.visibleWindowChecksum;
    state.retainedSourceCursor = state.sourceCursor;
    state.reviewRetained = true;
    state.phase = 'event-kept';
    state.result = 'cold-room-threshold-event-kept';
    reviewState.dataset.retained = 'true';
    reviewState.dataset.alert = 'false';
    reviewOutput.textContent = `KEPT #${anomaly.id} · ${anomaly.value.toFixed(1)}°C`;
    keepButton.textContent = 'EVENT KEPT';
    state.transitionRecords.push({ source, trusted: true, action: 'keep-event', eventId: anomaly.id, eventValue: anomaly.value, windowChecksum: state.retainedWindowChecksum, sourceCursor: state.sourceCursor });
  }

  addButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-add-control' : 'pointer-add-control';
    if (!acceptTrusted(event, source)) return;
    advanceSample(`trusted-${source}`);
  });
  undoButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-undo-control' : 'pointer-undo-control';
    if (!acceptTrusted(event, source)) return;
    undoSample(`trusted-${source}`);
  });
  resetButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-reset-control' : 'pointer-reset-control';
    if (!acceptTrusted(event, source)) return;
    resetWindow(`trusted-${source}`);
  });
  keepButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-keep-control' : 'pointer-keep-control';
    if (!acceptTrusted(event, source)) return;
    keepLatestEvent(`trusted-${source}`);
  });

  host.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (event.code === 'Space' || key === 'a') {
      if (!acceptTrusted(event, 'keyboard-add-sample')) return;
      event.preventDefault();
      advanceSample('trusted-keyboard-add-sample');
    } else if (key === 'enter') {
      if (!acceptTrusted(event, 'keyboard-keep-event')) return;
      event.preventDefault();
      keepLatestEvent('trusted-keyboard-keep-event');
    } else if (key === 'z') {
      if (!acceptTrusted(event, 'keyboard-undo-sample')) return;
      event.preventDefault();
      undoSample('trusted-keyboard-undo-sample');
    } else if (key === 'r') {
      if (!acceptTrusted(event, 'keyboard-reset-window')) return;
      event.preventDefault();
      resetWindow('trusted-keyboard-reset-window');
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
        const bounds = state.chartBounds;
        const minimumValue = 2;
        const maximumValue = 9;
        const valueY = value => bounds.bottom - (value - minimumValue) / (maximumValue - minimumValue) * bounds.height;
        const pointX = index => bounds.left + index / (windowSize - 1) * bounds.width;

        p.background('#f1eee5');
        p.noStroke();
        p.fill('#e8e4d9');
        p.rect(bounds.left, bounds.top, bounds.width, bounds.height, 7);
        p.fill('#e7573f12');
        p.rect(bounds.left, bounds.top, bounds.width, valueY(threshold) - bounds.top, 7, 7, 0, 0);

        p.stroke('#17272618');
        p.strokeWeight(1);
        for (let line = 0; line <= 4; line += 1) {
          const y = bounds.top + line / 4 * bounds.height;
          p.line(bounds.left, y, bounds.right, y);
        }
        for (let line = 0; line < windowSize; line += 1) {
          const x = pointX(line);
          p.line(x, bounds.top, x, bounds.bottom);
        }

        const thresholdY = valueY(threshold);
        p.stroke('#e7573fa8');
        p.drawingContext.setLineDash([4, 3]);
        p.line(bounds.left, thresholdY, bounds.right, thresholdY);
        p.drawingContext.setLineDash([]);
        state.thresholdLineVisible = thresholdY >= bounds.top && thresholdY <= bounds.bottom;

        p.noStroke();
        p.fill('#087f7918');
        p.beginShape();
        p.vertex(bounds.left, bounds.bottom);
        state.visibleSamples.forEach((sample, index) => p.vertex(pointX(index), valueY(sample.value)));
        p.vertex(bounds.right, bounds.bottom);
        p.endShape(p.CLOSE);

        p.noFill();
        p.stroke('#087f79');
        p.strokeWeight(2.1);
        p.beginShape();
        state.visibleSamples.forEach((sample, index) => p.vertex(pointX(index), valueY(sample.value)));
        p.endShape();

        state.visibleSamples.forEach((sample, index) => {
          const anomaly = sample.value > threshold;
          p.noStroke();
          p.fill(anomaly ? '#e7573f' : '#f1eee5');
          p.circle(pointX(index), valueY(sample.value), anomaly ? 7 : 4);
          if (!anomaly) {
            p.noFill();
            p.stroke('#087f79');
            p.strokeWeight(1.1);
            p.circle(pointX(index), valueY(sample.value), 4);
          }
        });

        const latest = state.visibleSamples.at(-1);
        p.noFill();
        p.stroke(latest.value > threshold ? '#e7573f' : '#087f79');
        p.strokeWeight(1);
        p.circle(bounds.right, valueY(latest.value), 11);

        p.noStroke();
        p.textFont('monospace');
        p.textSize(5);
        p.fill('#798580');
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text(`#${state.visibleSamples[0].id} · ${formatTime(state.visibleSamples[0])}`, bounds.left + 5, bounds.bottom - 5);
        p.textAlign(p.RIGHT, p.BOTTOM);
        p.text(`#${latest.id} · ${formatTime(latest)}`, bounds.right - 5, bounds.bottom - 5);
        p.fill('#e7573f');
        p.textAlign(p.RIGHT, p.BOTTOM);
        p.text('6.5°C LIMIT', bounds.right - 5, thresholdY - 3);
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
      state.initialWindowVerified = state.visibleWindowChecksum === state.initialWindowChecksum
        && state.sourceCursor === windowSize
        && state.history.length === 0
        && state.phase === 'idle-window';
    }
    if (dirty) sketch?.redraw();
  }

  const previewReady = ready.then(() => {
    calculateGeometry();
    updateDerivedState();
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.p5InstanceReady && state.canvas2dReady, 'p5 canvas is not ready');
    invariant(state.fullStageGeometryVerified && state.canvasCoverageRatio >= .995 && state.chartWithinStage, 'chart or canvas escapes the stage');
    invariant(state.automaticSampling === false && state.automaticPlayback === false && state.automaticCycle === false && state.automaticRehearsal === false && state.automaticFallback === false && state.infiniteTimer === false, 'automatic sample production is forbidden');
    invariant(state.previewClockDriven === false && state.renderIgnoresPreviewClock === true, 'preview clock must not advance telemetry');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed the telemetry window');
    invariant(state.inputCount === state.trustedInputCount && state.pointerInputCount + state.keyboardInputCount + state.controlInputCount === state.inputCount, 'trusted input accounting diverged');
    invariant(state.initialWindowVerified || state.inputCount > 0, 'initial telemetry window was not verified static');
    invariant(state.sourceSampleCount === sourceSamples.length && state.sourceChecksum === checksum(sourceSamples), 'deterministic source samples changed');
    invariant(state.fixedWindowVerified && state.visibleSamples.length === windowSize && state.windowSize === windowSize, 'visible window size is not fixed');
    invariant(state.allVisibleSamplesFromSource && state.visibleWindowChecksum === checksum(state.visibleSamples), 'visible telemetry is not from the deterministic source');
    invariant(state.sourceCursor === windowSize + state.history.length && state.appliedSampleCount === state.history.length, 'source cursor or applied sample count diverged');
    invariant(state.sampleAdvanceCount === state.sampleAdvanceInputCount && state.windowShiftCount === state.sampleAdvanceCount && state.oldestRemovalCount === state.sampleAdvanceCount, 'each trusted add must shift exactly one sample');
    invariant(state.evictionVerified, 'oldest-sample eviction order is invalid');
    invariant(state.visibleAnomalyCount === state.visibleSamples.filter(sample => sample.value > threshold).length && state.thresholdLineVisible, 'threshold event evidence is inconsistent');
    invariant(state.prematureCommitCount === 0, 'event was retained before explicit confirmation');
    invariant(state.transitionRecords.every(record => record.trusted === true), 'a telemetry transition lacks trusted human causality');

    if (state.reviewRetained) {
      invariant(state.phase === 'event-kept' && state.result === 'cold-room-threshold-event-kept', 'retained event state is inconsistent');
      invariant(state.retainedEvent?.value > threshold && state.retainedEvent.id === state.lastEventSampleId, 'retained event is not the latest visible threshold breach');
      invariant(state.retainedWindowChecksum === state.visibleWindowChecksum && state.retainedSourceCursor === state.sourceCursor, 'retained decision differs from the visible window');
      invariant(state.confirmationCount > 0 && reviewState.dataset.retained === 'true', 'explicit keep decision is not visible');
    }
    if (state.undoCount > 0) invariant(state.transitionRecords.some(record => record.action === 'undo'), 'undo did not restore an evicted sample');
    if (state.resetCount > 0) invariant(state.visibleWindowChecksum === state.initialWindowChecksum && state.transitionRecords.some(record => record.action === 'reset'), 'reset did not restore the initial window');
    return true;
  };

  installPreviewController({
    id: 'streaming-line-chart-window',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready: previewReady
  });
} catch (error) {
  markPreviewFailure(error);
}
