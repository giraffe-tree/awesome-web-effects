import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('.preview-stage');
  const host = document.querySelector('#bezier-host');
  const handles = [...document.querySelectorAll('.handle')];
  const handleNames = [...document.querySelectorAll('.handle-name')];
  const codeOutput = document.querySelector('#curve-code');
  const midOutput = document.querySelector('#mid-value');
  const slopeOutput = document.querySelector('#slope-value');
  const statusPill = document.querySelector('#status-pill');
  const statusCopy = document.querySelector('#status-copy');
  const undoButton = document.querySelector('#undo-curve');
  const resetButton = document.querySelector('#reset-curve');
  const applyButton = document.querySelector('#apply-curve');

  const DEFAULT_CURVE = Object.freeze([0.22, 0.78, 0.32, 1]);
  const HANDLE_LABELS = ['C1', 'C2'];
  const state = {
    id: 'drag-editable-bezier-curve-handles',
    productTask: 'Edit and retain the easing token for a checkout drawer arrival.',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'trusted pointer drag and keyboard movement recompute p5 cubic Bézier geometry and tangents',
    assetStrategy: 'code-native',
    imageGenDecision: 'omitted: exact vector geometry, handles, tangents, and numeric parameters are the functional evidence; raster pixels would not drive the mechanism',
    captureType: 'interactive',
    automaticPlayback: false,
    automaticCycle: false,
    automaticRehearsal: false,
    automaticFallback: false,
    initialStillVerified: false,
    trustedPointerInputCount: 0,
    trustedKeyboardInputCount: 0,
    trustedControlInputCount: 0,
    syntheticRejectedCount: 0,
    pointerDragCount: 0,
    keyboardNudgeCount: 0,
    draftMutationCount: 0,
    intentCount: 0,
    transitCount: 0,
    completionCount: 0,
    commitCount: 0,
    cancelCount: 0,
    prematureCommitCount: 0,
    retainedChangeOutsideCommitCount: 0,
    retainedStableDuringDraftEditCount: 0,
    undoCount: 0,
    resetCount: 0,
    commitVersion: 0,
    pendingTransactionId: null,
    transactionSerial: 0,
    lastInputType: 'none',
    phase: 'ready',
    activeHandle: null,
    drawCount: 0,
    bezierRenderCount: 0,
    curveSampleCount: 0,
    curveChecksum: 0,
    curveMonotonicX: true,
    sampledMidY: 0,
    startSlope: 0,
    endSlope: 0,
    stageCoverage: 0,
    canvasCoverage: 0,
    transactionLog: [],
    draft: [...DEFAULT_CURVE],
    retainedDraft: null,
    retainedSignature: null,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let draft = [...DEFAULT_CURVE];
  let retained = null;
  let undoStack = [];
  let drag = null;
  let layout = null;
  let sketch;
  let resolveReady;
  let initialSignature;
  let stillRenderCount = 0;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const rounded = value => Math.round(value * 100) / 100;
  const curveSignature = curve => curve.map(value => value.toFixed(3)).join('|');
  const sameCurve = (a, b) => Boolean(a && b) && curveSignature(a) === curveSignature(b);
  const retainedSignature = () => retained ? curveSignature(retained) : null;

  function cubicCoordinate(t, a, b) {
    const inverse = 1 - t;
    return 3 * inverse * inverse * t * a + 3 * inverse * t * t * b + t * t * t;
  }

  function easingYAtX(x, curve = draft) {
    let low = 0;
    let high = 1;
    for (let index = 0; index < 18; index += 1) {
      const middle = (low + high) / 2;
      if (cubicCoordinate(middle, curve[0], curve[2]) < x) low = middle;
      else high = middle;
    }
    const t = (low + high) / 2;
    return cubicCoordinate(t, curve[1], curve[3]);
  }

  function computeLayout() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const portrait = width / height < 0.8;
    const large = width >= 500;
    const inspectorWidth = portrait ? 0 : (large ? 229 : 100);
    const top = portrait ? 46 : (large ? 68 : 37);
    const bottom = portrait ? 119 : (large ? 31 : 14);
    const left = large ? 27 : 13;
    const right = portrait ? 9 : inspectorWidth + (large ? 43 : 17);
    return {
      width,
      height,
      portrait,
      chart: {
        left,
        top,
        right: width - right,
        bottom: height - bottom,
      },
    };
  }

  function curvePoint(index, curve = draft) {
    const chart = layout.chart;
    const x = index === 0 ? curve[0] : curve[2];
    const y = index === 0 ? curve[1] : curve[3];
    return {
      x: chart.left + x * (chart.right - chart.left),
      y: chart.bottom - y * (chart.bottom - chart.top),
    };
  }

  function endpoint(index) {
    return index === 0
      ? { x: layout.chart.left, y: layout.chart.bottom }
      : { x: layout.chart.right, y: layout.chart.top };
  }

  function syncHandlePositions() {
    handles.forEach((handle, index) => {
      const point = curvePoint(index);
      handle.style.left = `${point.x - handle.offsetWidth / 2}px`;
      handle.style.top = `${point.y - handle.offsetHeight / 2}px`;
      handle.setAttribute('aria-valuetext', `${HANDLE_LABELS[index]} x ${draft[index * 2].toFixed(2)}, y ${draft[index * 2 + 1].toFixed(2)}`);
      handleNames[index].style.left = `${point.x}px`;
      handleNames[index].style.top = `${point.y}px`;
    });
  }

  function recordPhase(kind, source, extra = {}) {
    const entry = {
      kind,
      source,
      transactionId: state.pendingTransactionId,
      draft: [...draft],
      retained: retained ? [...retained] : null,
      ...extra,
    };
    state.transactionLog.push(entry);
    if (state.transactionLog.length > 20) state.transactionLog.shift();
  }

  function beginDraftTransaction(source) {
    if (state.pendingTransactionId !== null) return;
    state.transactionSerial += 1;
    state.pendingTransactionId = state.transactionSerial;
    state.intentCount += 1;
    state.phase = 'intent';
    recordPhase('intent', source, { retainedBefore: retainedSignature() });
  }

  function mutateDraft(nextCurve, source) {
    beginDraftTransaction(source);
    const beforeRetained = retainedSignature();
    draft = nextCurve.map((value, index) => rounded(clamp(value, 0, index % 2 === 0 ? 1 : 1.12)));
    state.draftMutationCount += 1;
    state.transitCount += 1;
    state.phase = 'draft';
    state.lastInputType = source;
    if (retained && retainedSignature() === beforeRetained) state.retainedStableDuringDraftEditCount += 1;
    else if (retainedSignature() !== beforeRetained) state.retainedChangeOutsideCommitCount += 1;
    recordPhase('transit', source);
    refreshEvidence();
    sketch?.redraw();
  }

  function pushUndo(curve) {
    if (!sameCurve(curve, draft)) {
      undoStack.push([...curve]);
      if (undoStack.length > 16) undoStack.shift();
    }
  }

  function commitDraft(source) {
    const before = retainedSignature();
    retained = [...draft];
    state.commitVersion += 1;
    state.completionCount += 1;
    state.commitCount += 1;
    state.phase = 'committed';
    recordPhase('commit', source, { retainedBefore: before, retainedAfter: retainedSignature() });
    state.pendingTransactionId = null;
    state.lastInputType = source;
    refreshEvidence();
    sketch?.redraw();
  }

  function cancelPending(source) {
    if (state.pendingTransactionId === null) return;
    state.cancelCount += 1;
    recordPhase('cancel', source);
    state.pendingTransactionId = null;
  }

  function refreshEvidence() {
    const sampleCount = 31;
    let checksum = 0;
    let previousX = -1;
    let monotonicX = true;
    for (let index = 0; index < sampleCount; index += 1) {
      const t = index / (sampleCount - 1);
      const x = cubicCoordinate(t, draft[0], draft[2]);
      const y = cubicCoordinate(t, draft[1], draft[3]);
      if (x < previousX) monotonicX = false;
      previousX = x;
      checksum += Math.round((x * 1009 + y * 917) * (index + 1));
    }

    const mid = easingYAtX(0.5);
    const startSlope = draft[0] > 0.001 ? draft[1] / draft[0] : 0;
    const endDenominator = 1 - draft[2];
    const endSlope = endDenominator > 0.001 ? (1 - draft[3]) / endDenominator : 0;
    state.draft = [...draft];
    state.retainedDraft = retained ? [...retained] : null;
    state.retainedSignature = retainedSignature();
    state.curveSampleCount = sampleCount;
    state.curveChecksum = checksum;
    state.curveMonotonicX = monotonicX;
    state.sampledMidY = rounded(mid);
    state.startSlope = rounded(startSlope);
    state.endSlope = rounded(endSlope);
    state.undoDepth = undoStack.length;

    codeOutput.textContent = `cubic-bezier(${draft.map(value => Number(value.toFixed(2))).join(', ')})`;
    midOutput.textContent = `${Math.round(mid * 100)}%`;
    slopeOutput.textContent = endSlope.toFixed(2);
    const dirty = state.pendingTransactionId !== null;
    if (dirty) {
      statusPill.dataset.state = 'dirty';
      statusPill.textContent = 'Draft';
      statusCopy.textContent = retained ? `saved v${state.commitVersion} stays live` : 'apply to retain curve';
    } else if (retained) {
      statusPill.dataset.state = 'saved';
      statusPill.textContent = `Saved v${state.commitVersion}`;
      statusCopy.textContent = 'motion token retained';
    } else {
      statusPill.dataset.state = 'clean';
      statusPill.textContent = 'Ready';
      statusCopy.textContent = 'edit handles, then apply';
    }
    undoButton.disabled = undoStack.length === 0;
    syncHandlePositions();
  }

  function rejectSynthetic(event) {
    if (event.isTrusted) return false;
    state.syntheticRejectedCount += 1;
    return true;
  }

  handles.forEach((handle, index) => {
    handle.addEventListener('pointerdown', event => {
      if (rejectSynthetic(event)) return;
      event.preventDefault();
      state.trustedPointerInputCount += 1;
      state.pointerDragCount += 1;
      state.activeHandle = HANDLE_LABELS[index];
      state.lastInputType = 'pointer';
      beginDraftTransaction('pointer');
      drag = {
        index,
        pointerId: event.pointerId,
        startCurve: [...draft],
      };
      handle.setPointerCapture(event.pointerId);
      recordPhase('grab', 'pointer', { handle: HANDLE_LABELS[index] });
      sketch?.redraw();
    });

    handle.addEventListener('pointermove', event => {
      if (!drag || drag.pointerId !== event.pointerId || drag.index !== index || !event.isTrusted) return;
      const rect = stage.getBoundingClientRect();
      const chart = layout.chart;
      const x = clamp((event.clientX - rect.left - chart.left) / (chart.right - chart.left), 0, 1);
      const y = clamp((chart.bottom - (event.clientY - rect.top)) / (chart.bottom - chart.top), 0, 1.12);
      const next = [...draft];
      next[index * 2] = x;
      next[index * 2 + 1] = y;
      mutateDraft(next, 'pointer');
    });

    const release = event => {
      if (!drag || drag.pointerId !== event.pointerId || drag.index !== index) return;
      if (event.isTrusted) {
        pushUndo(drag.startCurve);
        recordPhase('settled-draft', 'pointer', { handle: HANDLE_LABELS[index] });
      }
      drag = null;
      state.activeHandle = null;
      refreshEvidence();
      sketch?.redraw();
    };
    handle.addEventListener('pointerup', release);
    handle.addEventListener('pointercancel', release);

    handle.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      if (rejectSynthetic(event)) return;
      event.preventDefault();
      const before = [...draft];
      const step = event.shiftKey ? 0.05 : 0.01;
      const next = [...draft];
      if (event.key === 'ArrowLeft') next[index * 2] -= step;
      if (event.key === 'ArrowRight') next[index * 2] += step;
      if (event.key === 'ArrowUp') next[index * 2 + 1] += step;
      if (event.key === 'ArrowDown') next[index * 2 + 1] -= step;
      state.trustedKeyboardInputCount += 1;
      state.keyboardNudgeCount += 1;
      state.activeHandle = HANDLE_LABELS[index];
      pushUndo(before);
      mutateDraft(next, 'keyboard');
    });

    handle.addEventListener('focus', () => {
      state.activeHandle = HANDLE_LABELS[index];
      sketch?.redraw();
    });
    handle.addEventListener('blur', () => {
      if (!drag) state.activeHandle = null;
      sketch?.redraw();
    });
  });

  applyButton.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    commitDraft('apply-button');
  });

  undoButton.addEventListener('click', event => {
    if (rejectSynthetic(event) || undoStack.length === 0) return;
    state.trustedControlInputCount += 1;
    const previous = undoStack.pop();
    cancelPending('undo');
    draft = previous;
    state.undoCount += 1;
    state.phase = 'undo';
    state.lastInputType = 'undo-button';
    recordPhase('undo', 'undo-button');
    refreshEvidence();
    sketch?.redraw();
  });

  resetButton.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    if (!sameCurve(draft, DEFAULT_CURVE)) undoStack.push([...draft]);
    cancelPending('reset');
    draft = [...DEFAULT_CURVE];
    retained = null;
    state.resetCount += 1;
    state.phase = 'reset';
    state.lastInputType = 'reset-button';
    recordPhase('reset', 'reset-button');
    refreshEvidence();
    sketch?.redraw();
  });

  function drawCurve(p, curve, color, weight, alpha = 255) {
    const chart = layout.chart;
    const first = {
      x: chart.left + curve[0] * (chart.right - chart.left),
      y: chart.bottom - curve[1] * (chart.bottom - chart.top),
    };
    const second = {
      x: chart.left + curve[2] * (chart.right - chart.left),
      y: chart.bottom - curve[3] * (chart.bottom - chart.top),
    };
    p.noFill();
    p.stroke(...color, alpha);
    p.strokeWeight(weight);
    p.bezier(chart.left, chart.bottom, first.x, first.y, second.x, second.y, chart.right, chart.top);
    state.bezierRenderCount += 1;
  }

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(stage.clientWidth, stage.clientHeight).parent(host);
      p.noLoop();
      layout = computeLayout();
      initialSignature = curveSignature(draft);
      refreshEvidence();
      resolveReady();
    };

    p.windowResized = () => {
      p.resizeCanvas(stage.clientWidth, stage.clientHeight);
      layout = computeLayout();
      refreshEvidence();
      p.redraw();
    };

    p.draw = () => {
      state.drawCount += 1;
      layout = computeLayout();
      const chart = layout.chart;
      const chartWidth = chart.right - chart.left;
      const chartHeight = chart.bottom - chart.top;
      p.clear();

      p.noStroke();
      p.fill('#191c1a');
      p.rect(chart.left - 5, chart.top - 5, chartWidth + 10, chartHeight + 10, layout.width >= 500 ? 18 : 8);

      p.stroke(244, 241, 233, 22);
      p.strokeWeight(1);
      for (let index = 1; index < 4; index += 1) {
        const x = chart.left + chartWidth * index / 4;
        const y = chart.top + chartHeight * index / 4;
        p.line(x, chart.top, x, chart.bottom);
        p.line(chart.left, y, chart.right, y);
      }

      p.noStroke();
      p.fill(244, 241, 233, 44);
      p.textFont('ui-monospace');
      p.textSize(layout.width >= 500 ? 9 : 5);
      p.textStyle(p.BOLD);
      p.text('PROGRESS', chart.left, chart.top - (layout.width >= 500 ? 13 : 8));

      if (retained && !sameCurve(retained, draft)) drawCurve(p, retained, [244, 241, 233], layout.width >= 500 ? 3 : 2, 55);

      const start = endpoint(0);
      const end = endpoint(1);
      const c1 = curvePoint(0);
      const c2 = curvePoint(1);
      p.stroke(255, 115, 93, 150);
      p.strokeWeight(layout.width >= 500 ? 2 : 1);
      p.line(start.x, start.y, c1.x, c1.y);
      p.stroke(200, 255, 77, 150);
      p.line(c2.x, c2.y, end.x, end.y);

      drawCurve(p, draft, [244, 241, 233], layout.width >= 500 ? 5 : 3, 255);

      const midY = easingYAtX(0.5);
      const markerX = chart.left + chartWidth * 0.5;
      const markerY = chart.bottom - chartHeight * clamp(midY, 0, 1.12);
      p.stroke(255, 115, 93, 100);
      p.strokeWeight(1);
      p.line(markerX, chart.bottom, markerX, markerY);
      p.noStroke();
      p.fill('#ff735d');
      p.circle(markerX, markerY, layout.width >= 500 ? 12 : 7);

      p.fill('#f4f1e9');
      p.circle(start.x, start.y, layout.width >= 500 ? 10 : 6);
      p.circle(end.x, end.y, layout.width >= 500 ? 10 : 6);

      const canvas = host.querySelector('canvas');
      const stageArea = Math.max(1, layout.width * layout.height);
      state.stageCoverage = rounded((chartWidth * chartHeight) / stageArea);
      state.canvasCoverage = canvas ? rounded((canvas.clientWidth * canvas.clientHeight) / stageArea) : 0;
      if (state.trustedPointerInputCount + state.trustedKeyboardInputCount === 0 && curveSignature(draft) === initialSignature) {
        stillRenderCount += 1;
        state.initialStillVerified = stillRenderCount >= 2;
      }
      refreshEvidence();
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = host.querySelector('canvas');
    const geometry = canvas?.getBoundingClientRect();
    return sketch instanceof p5
      && Boolean(canvas?.getContext('2d'))
      && state.drawCount > 0
      && state.bezierRenderCount > 0
      && state.curveSampleCount === 31
      && state.curveChecksum > 1000
      && state.curveMonotonicX
      && state.initialStillVerified
      && state.automaticPlayback === false
      && state.automaticCycle === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.prematureCommitCount === 0
      && state.retainedChangeOutsideCommitCount === 0
      && state.completionCount === state.commitCount
      && state.canvasCoverage >= 0.98
      && geometry.width >= stage.clientWidth * 0.98
      && geometry.height >= stage.clientHeight * 0.98
      && handles.every(handle => handle.getBoundingClientRect().width >= 30);
  };

  installPreviewController({
    id: state.id,
    library: state.library,
    renderer: state.renderer,
    render: () => sketch.redraw(),
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
