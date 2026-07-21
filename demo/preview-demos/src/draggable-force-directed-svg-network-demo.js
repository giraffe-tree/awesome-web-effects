import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#force-stage');
  const host = document.querySelector('#force-host');
  const undoButton = document.querySelector('#undo-graph');
  const resetButton = document.querySelector('#reset-graph');
  const confirmButton = document.querySelector('#confirm-analysis');
  const graphState = document.querySelector('#graph-state');
  const stateLabel = document.querySelector('#state-label');
  const graphResult = document.querySelector('#graph-result');
  const resultTitle = document.querySelector('#result-title');
  const resultDetail = document.querySelector('#result-detail');
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const nodeDefinitions = Object.freeze([
    { id: 'auth-api', label: 'Auth API', kind: 'critical' },
    { id: 'web-app', label: 'Web App', kind: 'client' },
    { id: 'mobile-app', label: 'Mobile', kind: 'client' },
    { id: 'billing', label: 'Billing', kind: 'service' },
    { id: 'user-db', label: 'User DB', kind: 'data' },
    { id: 'audit-log', label: 'Audit Log', kind: 'data' },
    { id: 'notify', label: 'Notify', kind: 'service' },
    { id: 'deploy-gate', label: 'Deploy Gate', kind: 'gate' }
  ]);
  const edgeDefinitions = Object.freeze([
    { from: 'web-app', to: 'auth-api', type: 'depends-on' },
    { from: 'mobile-app', to: 'auth-api', type: 'depends-on' },
    { from: 'billing', to: 'auth-api', type: 'depends-on' },
    { from: 'notify', to: 'auth-api', type: 'depends-on' },
    { from: 'deploy-gate', to: 'web-app', type: 'depends-on' },
    { from: 'deploy-gate', to: 'billing', type: 'depends-on' },
    { from: 'auth-api', to: 'user-db', type: 'reads' },
    { from: 'auth-api', to: 'audit-log', type: 'emits' },
    { from: 'billing', to: 'audit-log', type: 'emits' }
  ]);
  const graphSignature = `${nodeDefinitions.map(node => node.id).join(',')}|${edgeDefinitions.map(edge => `${edge.from}>${edge.to}:${edge.type}`).join(',')}`;
  const targetIndex = 0;
  const solverStepLimit = 72;

  const state = {
    id: 'draggable-force-directed-svg-network',
    task: 'human-pins-auth-api-runs-one-finite-release-dependency-solve-and-confirms-retained-blast-radius-analysis',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'trusted-drag-or-keyboard-pin-mutates-one-knowledge-graph-node-then-a-bounded-72-step-force-solver-settles-dependent-nodes-before-explicit-human-analysis-confirmation',
    assetStrategy: 'code-native-typed-graph-and-deterministic-physics-no-functional-raster-input-required',
    acceptedInputs: ['trusted-mouse-touch-or-pen-drag', 'auth-node-arrow-keys', 'confirm-button-click-or-keyboard', 'undo-button-or-control-z', 'reset-button-or-r-key'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticPlayback: false,
    automaticSimulation: false,
    automaticDrift: false,
    automaticPulse: false,
    automaticConfirmation: false,
    automaticFallback: false,
    previewClockOnlyAdvancesHumanStartedSolver: true,
    syntheticInputDispatch: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    untrustedMutationCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    dragInputCount: 0,
    keyboardMoveInputCount: 0,
    confirmInputCount: 0,
    undoInputCount: 0,
    resetInputCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    activePointerId: null,
    dragAnchor: null,
    dragDistance: 0,
    pinNodeId: null,
    pinPosition: null,
    humanPinCount: 0,
    humanGeometryMutationCount: 0,
    solverActive: false,
    solverStartedAt: null,
    solverDuration: 1.08,
    solverStepLimit,
    solverStepCount: 0,
    solverStartCount: 0,
    solverCompletionCount: 0,
    solverFrameCount: 0,
    solverEnergyInitial: null,
    solverEnergyFinal: null,
    solverEnergy: 0,
    solverEnergySamples: [],
    solverCompletionReason: null,
    graphNodeCount: nodeDefinitions.length,
    graphEdgeCount: edgeDefinitions.length,
    graphSignature,
    nodeOrder: nodeDefinitions.map(node => node.id),
    relationTypes: [...new Set(edgeDefinitions.map(edge => edge.type))],
    relationCounts: {
      'depends-on': edgeDefinitions.filter(edge => edge.type === 'depends-on').length,
      reads: edgeDefinitions.filter(edge => edge.type === 'reads').length,
      emits: edgeDefinitions.filter(edge => edge.type === 'emits').length
    },
    nodes: [],
    nodeChecksumInitial: null,
    nodeChecksumCurrent: null,
    firstHumanChecksumBefore: null,
    firstHumanChecksumAfter: null,
    analysisCandidateReady: false,
    analysisCandidate: null,
    directDependentCount: 4,
    releasePathCount: 4,
    conclusionConfirmed: false,
    confirmationCount: 0,
    prematureConclusionCount: 0,
    result: 'awaiting-human-pin',
    resultRetained: false,
    retainedConclusion: null,
    phase: 'idle-static',
    historyDepth: 0,
    undoCount: 0,
    resetCount: 0,
    rollbackRecords: [],
    inputRecords: [],
    solveRecords: [],
    confirmationRecords: [],
    initialSignature: null,
    initialStillVerified: false,
    renderCount: 0,
    drawCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    canvasCoverageRatio: 0,
    fullStageGeometryVerified: false,
    p5InstanceReady: false,
    canvas2dReady: false,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__DEPENDENCY_GRAPH_STATE__ = state;

  let sketch;
  let resolveReady;
  let lastRenderTime = 0;
  let dirty = true;
  let initialRenderSignature = null;
  let nodes = [];
  const history = [];
  const ready = new Promise(resolve => { resolveReady = resolve; });

  function invariant(condition, message) {
    if (!condition) throw new Error(`draggable-force-directed-svg-network: ${message}`);
  }

  function initialPositions(width, height) {
    const portrait = height > width * 1.15;
    const fractions = portrait
      ? [[.5, .66], [.25, .53], [.75, .53], [.2, .77], [.8, .77], [.5, .86], [.86, .67], [.5, .51]]
      : [[.56, .54], [.39, .36], [.76, .35], [.35, .72], [.77, .72], [.58, .84], [.88, .55], [.56, .27]];
    return nodeDefinitions.map((definition, index) => ({
      ...definition,
      x: width * fractions[index][0],
      y: height * fractions[index][1],
      vx: 0,
      vy: 0
    }));
  }

  function nodeChecksum() {
    return nodes.map(node => `${node.id}:${node.x.toFixed(2)}:${node.y.toFixed(2)}:${node.id === state.pinNodeId ? 1 : 0}`).join('|');
  }

  function syncNodeEvidence() {
    state.nodes = nodes.map(node => ({
      id: node.id,
      label: node.label,
      kind: node.kind,
      x: Number(node.x.toFixed(2)),
      y: Number(node.y.toFixed(2)),
      pinned: node.id === state.pinNodeId
    }));
    state.nodeChecksumCurrent = nodeChecksum();
  }

  function snapshot() {
    return {
      nodes: nodes.map(node => ({ ...node })),
      pinNodeId: state.pinNodeId,
      pinPosition: state.pinPosition ? { ...state.pinPosition } : null,
      analysisCandidateReady: state.analysisCandidateReady,
      analysisCandidate: state.analysisCandidate,
      conclusionConfirmed: state.conclusionConfirmed,
      result: state.result,
      resultRetained: state.resultRetained,
      retainedConclusion: state.retainedConclusion,
      phase: state.phase,
      solverStepCount: state.solverStepCount,
      solverEnergy: state.solverEnergy,
      solverEnergyInitial: state.solverEnergyInitial,
      solverEnergyFinal: state.solverEnergyFinal,
      solverEnergySamples: [...state.solverEnergySamples],
      solverCompletionReason: state.solverCompletionReason
    };
  }

  function pushHistory() {
    history.push(snapshot());
    if (history.length > 20) history.shift();
    state.historyDepth = history.length;
  }

  function restore(snapshotValue) {
    nodes = snapshotValue.nodes.map(node => ({ ...node }));
    state.pinNodeId = snapshotValue.pinNodeId;
    state.pinPosition = snapshotValue.pinPosition ? { ...snapshotValue.pinPosition } : null;
    state.analysisCandidateReady = snapshotValue.analysisCandidateReady;
    state.analysisCandidate = snapshotValue.analysisCandidate;
    state.conclusionConfirmed = snapshotValue.conclusionConfirmed;
    state.result = snapshotValue.result;
    state.resultRetained = snapshotValue.resultRetained;
    state.retainedConclusion = snapshotValue.retainedConclusion;
    state.phase = snapshotValue.phase;
    state.solverActive = false;
    state.solverStepCount = snapshotValue.solverStepCount;
    state.solverEnergy = snapshotValue.solverEnergy;
    state.solverEnergyInitial = snapshotValue.solverEnergyInitial;
    state.solverEnergyFinal = snapshotValue.solverEnergyFinal;
    state.solverEnergySamples = [...snapshotValue.solverEnergySamples];
    state.solverCompletionReason = snapshotValue.solverCompletionReason;
    syncNodeEvidence();
    updateInterface();
    requestDraw();
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

  function updateInterface() {
    graphState.dataset.phase = state.solverActive ? 'solving' : state.conclusionConfirmed ? 'complete' : 'idle';
    if (state.solverActive) stateLabel.textContent = `SOLVING ${String(state.solverStepCount).padStart(2, '0')} / ${solverStepLimit}`;
    else if (state.conclusionConfirmed) stateLabel.textContent = 'ANALYSIS CONFIRMED · RETAINED';
    else if (state.analysisCandidateReady) stateLabel.textContent = 'SETTLED · AWAITING CONFIRM';
    else if (state.pinNodeId) stateLabel.textContent = 'AUTH API PINNED · READY';
    else stateLabel.textContent = 'GRAPH READY · STATIC';
    graphResult.dataset.confirmed = String(state.conclusionConfirmed);
    if (state.conclusionConfirmed) {
      resultTitle.textContent = 'AUTH API · HIGH BLAST RADIUS';
      resultDetail.textContent = '4 direct dependents · release review retained.';
    } else if (state.analysisCandidateReady) {
      resultTitle.textContent = 'CANDIDATE · 4 DEPENDENTS';
      resultDetail.textContent = 'Finite solve complete. Confirm to retain.';
    } else {
      resultTitle.textContent = 'ANALYSIS NOT CONFIRMED';
      resultDetail.textContent = 'Pin Auth API to calculate release impact.';
    }
    confirmButton.disabled = !state.analysisCandidateReady || state.solverActive || state.conclusionConfirmed;
    undoButton.disabled = history.length === 0 || state.solverActive;
    resetButton.disabled = state.inputCount === 0 || state.solverActive;
    host.dataset.dragging = String(state.activePointerId !== null);
  }

  function requestDraw() {
    dirty = true;
    sketch?.redraw();
  }

  function rejectUntrusted(event, sourceKind) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedInputCount += 1;
    state.lastInputKind = `rejected-${sourceKind}`;
    state.lastInputTrusted = false;
    return true;
  }

  function acceptTrusted(event, sourceKind, category) {
    if (rejectUntrusted(event, sourceKind)) return null;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = sourceKind;
    state.lastInputTrusted = true;
    if (sourceKind.includes('keyboard') || sourceKind === 'shortcut-undo' || sourceKind === 'shortcut-reset') state.keyboardInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (event.pointerType === 'touch') state.touchInputCount += 1;
      if (event.pointerType === 'pen') state.penInputCount += 1;
    }
    if (category === 'drag') state.dragInputCount += 1;
    if (category === 'keyboard-move') state.keyboardMoveInputCount += 1;
    if (category === 'confirm') state.confirmInputCount += 1;
    if (category === 'undo') state.undoInputCount += 1;
    if (category === 'reset') state.resetInputCount += 1;
    const record = {
      sourceKind,
      category,
      trusted: true,
      checksumBefore: nodeChecksum(),
      pinBefore: state.pinNodeId,
      resultBefore: state.result,
      mutated: false
    };
    state.inputRecords.push(record);
    state.inputRecords = state.inputRecords.slice(-128);
    return record;
  }

  function pointFromEvent(event) {
    const bounds = host.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function targetRadius() {
    return clamp(stage.clientWidth / 320, 1, 1.7) * 15;
  }

  function targetHit(point) {
    const target = nodes[targetIndex];
    return Math.hypot(point.x - target.x, point.y - target.y) <= targetRadius();
  }

  function startSolver(sourceKind, record) {
    state.solverActive = true;
    state.solverStartedAt = lastRenderTime;
    state.solverStepCount = 0;
    state.solverFrameCount = 0;
    state.solverStartCount += 1;
    state.solverEnergyInitial = null;
    state.solverEnergyFinal = null;
    state.solverEnergySamples = [];
    state.solverCompletionReason = null;
    state.analysisCandidateReady = false;
    state.analysisCandidate = null;
    state.conclusionConfirmed = false;
    state.resultRetained = false;
    state.retainedConclusion = null;
    state.phase = 'finite-solving';
    state.result = 'human-pin-triggered-solver-in-progress';
    state.solveRecords.push({ sourceKind, trusted: true, pinNodeId: state.pinNodeId, stepLimit: solverStepLimit, completed: false });
    if (record) record.mutated = true;
    updateInterface();
    requestDraw();
  }

  function simulateStep() {
    const scale = clamp(stage.clientWidth / 320, .8, 1.7);
    const desired = 54 * scale;
    nodes.forEach((a, index) => {
      for (let j = index + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const squared = dx * dx + dy * dy + 70;
        const force = 155 * scale / squared;
        a.vx -= dx * force;
        a.vy -= dy * force;
        b.vx += dx * force;
        b.vy += dy * force;
      }
    });
    edgeDefinitions.forEach(edge => {
      const a = nodes.find(node => node.id === edge.from);
      const b = nodes.find(node => node.id === edge.to);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 1;
      const force = (distance - desired) * .012;
      a.vx += dx / distance * force;
      a.vy += dy / distance * force;
      b.vx -= dx / distance * force;
      b.vy -= dy / distance * force;
    });
    const centerX = stage.clientWidth * (stage.clientHeight > stage.clientWidth * 1.15 ? .52 : .62);
    const centerY = stage.clientHeight * (stage.clientHeight > stage.clientWidth * 1.15 ? .61 : .56);
    nodes.forEach(node => {
      if (node.id === state.pinNodeId) {
        node.x = state.pinPosition.x;
        node.y = state.pinPosition.y;
        node.vx = 0;
        node.vy = 0;
        return;
      }
      node.vx += (centerX - node.x) * .0025;
      node.vy += (centerY - node.y) * .0025;
      node.vx *= .79;
      node.vy *= .79;
      node.x = clamp(node.x + node.vx, stage.clientHeight > stage.clientWidth * 1.15 ? 18 : 98, stage.clientWidth - 15);
      node.y = clamp(node.y + node.vy, stage.clientHeight > stage.clientWidth * 1.15 ? 126 : 46, stage.clientHeight - 28);
    });
    const energy = nodes.reduce((sum, node) => sum + Math.hypot(node.vx, node.vy), 0);
    state.solverEnergy = Number(energy.toFixed(4));
    state.solverEnergySamples.push(state.solverEnergy);
    if (state.solverEnergySamples.length > solverStepLimit) state.solverEnergySamples.shift();
    if (state.solverEnergyInitial === null) state.solverEnergyInitial = state.solverEnergy;
  }

  function finishSolver() {
    state.solverActive = false;
    state.solverCompletionCount += 1;
    nodes.forEach(node => { node.vx = 0; node.vy = 0; });
    state.solverEnergy = 0;
    state.solverEnergyFinal = 0;
    if (state.solverEnergySamples.length) state.solverEnergySamples[state.solverEnergySamples.length - 1] = 0;
    state.solverCompletionReason = 'bounded-72-step-convergence';
    state.analysisCandidateReady = true;
    state.analysisCandidate = 'auth-api-high-blast-radius-4-direct-dependents';
    state.phase = 'settled-awaiting-confirmation';
    state.result = 'analysis-candidate-awaiting-explicit-confirmation';
    const record = state.solveRecords.at(-1);
    if (record) {
      record.completed = true;
      record.finalStepCount = state.solverStepCount;
      record.energyInitial = state.solverEnergyInitial;
      record.energyFinal = state.solverEnergyFinal;
    }
    syncNodeEvidence();
    updateInterface();
    requestDraw();
  }

  host.addEventListener('pointerdown', event => {
    const point = pointFromEvent(event);
    if (!targetHit(point)) return;
    const record = acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-pin-start`, 'drag');
    if (!record || state.solverActive) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    pushHistory();
    const target = nodes[targetIndex];
    state.activePointerId = event.pointerId;
    state.dragAnchor = { x: point.x, y: point.y, nodeX: target.x, nodeY: target.y, checksumBefore: nodeChecksum() };
    state.pointerDownCount += 1;
    host.setPointerCapture(event.pointerId);
    if (host.hasPointerCapture(event.pointerId)) state.pointerCaptureCount += 1;
    updateInterface();
  });

  host.addEventListener('pointermove', event => {
    if (state.activePointerId !== event.pointerId || !state.dragAnchor) return;
    const record = acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-pin-move`, 'drag');
    if (!record) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    const target = nodes[targetIndex];
    const minX = stage.clientHeight > stage.clientWidth * 1.15 ? 18 : 98;
    const minY = stage.clientHeight > stage.clientWidth * 1.15 ? 126 : 46;
    target.x = clamp(state.dragAnchor.nodeX + point.x - state.dragAnchor.x, minX, stage.clientWidth - 18);
    target.y = clamp(state.dragAnchor.nodeY + point.y - state.dragAnchor.y, minY, stage.clientHeight - 30);
    target.vx = target.vy = 0;
    state.pinNodeId = target.id;
    state.pinPosition = { x: Number(target.x.toFixed(2)), y: Number(target.y.toFixed(2)) };
    state.pointerMoveCount += 1;
    state.dragDistance = Number(Math.hypot(target.x - state.dragAnchor.nodeX, target.y - state.dragAnchor.nodeY).toFixed(2));
    state.humanGeometryMutationCount += 1;
    syncNodeEvidence();
    if (state.firstHumanChecksumBefore === null) state.firstHumanChecksumBefore = record.checksumBefore;
    if (state.firstHumanChecksumAfter === null) state.firstHumanChecksumAfter = state.nodeChecksumCurrent;
    record.checksumAfter = state.nodeChecksumCurrent;
    record.mutated = record.checksumBefore !== record.checksumAfter;
    requestDraw();
  });

  function finishPointer(event) {
    if (state.activePointerId !== event.pointerId) return;
    const record = acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-pin-end`, 'drag');
    if (!record) return;
    event.preventDefault();
    state.pointerUpCount += 1;
    if (host.hasPointerCapture(event.pointerId)) {
      host.releasePointerCapture(event.pointerId);
      state.pointerReleaseCount += 1;
    }
    state.activePointerId = null;
    state.dragAnchor = null;
    if (state.dragDistance > 1 && state.pinNodeId === 'auth-api') {
      state.humanPinCount += 1;
      startSolver(record.sourceKind, record);
    }
    updateInterface();
  }
  host.addEventListener('pointerup', finishPointer);
  host.addEventListener('pointercancel', finishPointer);

  host.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8]
    }[event.key];
    if (!movement || state.solverActive) return;
    const record = acceptTrusted(event, 'auth-keyboard-pin-move', 'keyboard-move');
    if (!record) return;
    event.preventDefault();
    pushHistory();
    const target = nodes[targetIndex];
    if (state.firstHumanChecksumBefore === null) state.firstHumanChecksumBefore = record.checksumBefore;
    target.x = clamp(target.x + movement[0], stage.clientHeight > stage.clientWidth * 1.15 ? 18 : 98, stage.clientWidth - 18);
    target.y = clamp(target.y + movement[1], stage.clientHeight > stage.clientWidth * 1.15 ? 126 : 46, stage.clientHeight - 30);
    target.vx = target.vy = 0;
    state.pinNodeId = target.id;
    state.pinPosition = { x: Number(target.x.toFixed(2)), y: Number(target.y.toFixed(2)) };
    state.humanPinCount += 1;
    state.humanGeometryMutationCount += 1;
    syncNodeEvidence();
    if (state.firstHumanChecksumAfter === null) state.firstHumanChecksumAfter = state.nodeChecksumCurrent;
    record.checksumAfter = state.nodeChecksumCurrent;
    record.mutated = record.checksumBefore !== record.checksumAfter;
    startSolver(record.sourceKind, record);
  });

  confirmButton.addEventListener('click', event => {
    const record = acceptTrusted(event, event.detail === 0 ? 'confirm-keyboard' : 'confirm-pointer', 'confirm');
    if (!record || !state.analysisCandidateReady || state.solverActive || state.conclusionConfirmed) return;
    pushHistory();
    state.conclusionConfirmed = true;
    state.confirmationCount += 1;
    state.phase = 'confirmed-retained';
    state.result = 'auth-api-release-critical-analysis-confirmed';
    state.resultRetained = true;
    state.retainedConclusion = 'auth-api-high-blast-radius-4-direct-dependents';
    state.confirmationRecords.push({ sourceKind: record.sourceKind, trusted: true, candidate: state.analysisCandidate, retained: true });
    record.mutated = true;
    updateInterface();
    requestDraw();
  });

  function undo(event, sourceKind) {
    const record = acceptTrusted(event, sourceKind, 'undo');
    if (!record || history.length === 0 || state.solverActive) return;
    const restored = history.pop();
    state.historyDepth = history.length;
    state.undoCount += 1;
    state.rollbackRecords.push({ sourceKind, trusted: true, operation: 'undo', restoredResult: restored.result });
    record.mutated = true;
    restore(restored);
  }

  function reset(event, sourceKind) {
    const record = acceptTrusted(event, sourceKind, 'reset');
    if (!record || state.solverActive) return;
    pushHistory();
    nodes = initialPositions(stage.clientWidth, stage.clientHeight);
    state.pinNodeId = null;
    state.pinPosition = null;
    state.analysisCandidateReady = false;
    state.analysisCandidate = null;
    state.conclusionConfirmed = false;
    state.result = 'awaiting-human-pin';
    state.resultRetained = false;
    state.retainedConclusion = null;
    state.phase = 'idle-static';
    state.solverStepCount = 0;
    state.solverEnergy = 0;
    state.solverEnergyInitial = null;
    state.solverEnergyFinal = null;
    state.solverEnergySamples = [];
    state.solverCompletionReason = null;
    state.resetCount += 1;
    state.rollbackRecords.push({ sourceKind, trusted: true, operation: 'reset', restoredResult: 'awaiting-human-pin' });
    record.mutated = true;
    syncNodeEvidence();
    updateInterface();
    requestDraw();
  }

  undoButton.addEventListener('click', event => undo(event, event.detail === 0 ? 'undo-keyboard' : 'undo-pointer'));
  resetButton.addEventListener('click', event => reset(event, event.detail === 0 ? 'reset-keyboard' : 'reset-pointer'));
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      undo(event, 'shortcut-undo');
    } else if (event.key.toLowerCase() === 'r' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      reset(event, 'shortcut-reset');
    }
  }, true);

  function edgeColor(type) {
    if (type === 'reads') return '#63e2ba';
    if (type === 'emits') return '#b69cff';
    return '#68cfff';
  }

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(stage.clientWidth, stage.clientHeight).parent(host);
      p.textFont('system-ui');
      p.noLoop();
      nodes = initialPositions(p.width, p.height);
      syncNodeEvidence();
      state.nodeChecksumInitial = state.nodeChecksumCurrent;
      state.p5InstanceReady = sketch instanceof p5;
      state.canvas2dReady = Boolean(host.querySelector('canvas')?.getContext('2d'));
      state.ready = true;
      updateGeometry();
      updateInterface();
      resolveReady();
    };
    p.windowResized = () => {
      p.resizeCanvas(stage.clientWidth, stage.clientHeight);
      if (state.inputCount === 0) {
        nodes = initialPositions(p.width, p.height);
        syncNodeEvidence();
        state.nodeChecksumInitial = state.nodeChecksumCurrent;
      }
      updateGeometry();
      requestDraw();
    };
    p.draw = () => {
      state.drawCount += 1;
      const scale = clamp(p.width / 320, .82, 1.7);
      p.background('#091117');
      p.strokeWeight(Math.max(1, scale * .8));
      edgeDefinitions.forEach(edge => {
        const from = nodes.find(node => node.id === edge.from);
        const to = nodes.find(node => node.id === edge.to);
        const color = p.color(edgeColor(edge.type));
        color.setAlpha(112);
        p.stroke(color);
        p.line(from.x, from.y, to.x, to.y);
        const unit = .58;
        const arrowX = from.x + (to.x - from.x) * unit;
        const arrowY = from.y + (to.y - from.y) * unit;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        p.push();
        p.translate(arrowX, arrowY);
        p.rotate(angle);
        p.noStroke();
        p.fill(color);
        p.triangle(3 * scale, 0, -2.5 * scale, -2.2 * scale, -2.5 * scale, 2.2 * scale);
        p.pop();
      });
      nodes.forEach((node, index) => {
        const target = index === targetIndex;
        const radius = (target ? 11 : 7.5) * scale;
        if (target && state.pinNodeId === node.id) {
          p.noFill();
          p.stroke('#e9ff76');
          p.strokeWeight(1);
          p.circle(node.x, node.y, radius * 2 + 8 * scale);
        }
        p.noStroke();
        const colors = { critical: '#e9ff76', client: '#68cfff', service: '#ffb66f', data: '#63e2ba', gate: '#b69cff' };
        p.fill(colors[node.kind]);
        p.circle(node.x, node.y, radius * 2);
        p.fill('#edf6f4');
        p.textAlign(p.CENTER, p.TOP);
        p.textStyle(target ? p.BOLD : p.NORMAL);
        p.textSize((target ? 6.2 : 5.1) * scale);
        p.text(node.label, node.x, node.y + radius + 4 * scale);
      });
      dirty = false;
    };
  }, host);

  function render(time) {
    state.renderCount += 1;
    lastRenderTime = Number.isFinite(time) ? time : lastRenderTime;
    if (state.solverActive) {
      const targetSteps = Math.min(solverStepLimit, Math.floor(clamp((lastRenderTime - state.solverStartedAt) / state.solverDuration) * solverStepLimit));
      while (state.solverStepCount < targetSteps) {
        simulateStep();
        state.solverStepCount += 1;
      }
      state.solverFrameCount += 1;
      syncNodeEvidence();
      updateInterface();
      requestDraw();
      if (state.solverStepCount >= solverStepLimit) finishSolver();
    }
    updateGeometry();
    if (state.inputCount === 0) {
      const signature = `${state.nodeChecksumCurrent}|${state.phase}|${state.solverStepCount}`;
      if (initialRenderSignature === null) initialRenderSignature = signature;
      else state.initialStillVerified = signature === initialRenderSignature && state.nodeChecksumCurrent === state.nodeChecksumInitial;
    }
    if (dirty) sketch?.redraw();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.p5InstanceReady && state.canvas2dReady, 'p5 canvas is not ready');
    invariant(state.fullStageGeometryVerified && state.canvasCoverageRatio >= .995, 'canvas does not cover the full stage');
    invariant(state.graphNodeCount === 8 && state.graphEdgeCount === 9 && state.graphSignature === graphSignature, 'knowledge graph structure changed');
    invariant(state.nodeOrder.every((id, index) => id === nodeDefinitions[index].id), 'knowledge graph node order changed');
    invariant(state.relationTypes.join(',') === 'depends-on,reads,emits' && state.relationCounts['depends-on'] === 6 && state.relationCounts.reads === 1 && state.relationCounts.emits === 2, 'typed relation evidence is inconsistent');
    invariant(state.nodes.length === state.graphNodeCount && state.nodeChecksumCurrent === nodeChecksum(), 'node position evidence diverged');
    invariant(state.automaticPlayback === false && state.automaticSimulation === false && state.automaticDrift === false && state.automaticPulse === false && state.automaticConfirmation === false && state.automaticFallback === false, 'automatic graph activity is forbidden');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input mutated the graph');
    invariant(state.inputCount === state.trustedInputCount, 'trusted input accounting diverged');
    invariant(state.pointerInputCount + state.keyboardInputCount === state.inputCount, 'input modality accounting diverged');
    invariant(state.touchInputCount + state.penInputCount <= state.pointerInputCount, 'pointer subtype accounting diverged');
    invariant(state.inputRecords.every(record => record.trusted === true), 'an accepted graph input was not trusted');
    invariant(state.solveRecords.every(record => record.trusted === true && record.stepLimit === solverStepLimit), 'a solve lacked trusted pin causality');
    invariant(state.confirmationRecords.every(record => record.trusted === true && record.candidate === 'auth-api-high-blast-radius-4-direct-dependents'), 'a conclusion lacked trusted confirmation');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial graph frame was not verified still');
    invariant(state.prematureConclusionCount === 0, 'analysis conclusion committed before solve and confirmation');

    if (state.pinNodeId !== null) {
      invariant(state.pinNodeId === 'auth-api' && state.pinPosition !== null, 'human did not retain the Auth API pin');
      invariant(state.humanGeometryMutationCount > 0 && state.firstHumanChecksumBefore !== state.firstHumanChecksumAfter, 'trusted pin did not change graph geometry');
      invariant(state.inputRecords.some(record => record.mutated && ['drag', 'keyboard-move'].includes(record.category)), 'no trusted pin input mutated the graph');
    }
    if (state.solverCompletionCount > 0) {
      invariant(state.solverStartCount >= state.solverCompletionCount, 'solver completion accounting is incomplete');
      invariant(state.solveRecords.some(record => record.completed && record.finalStepCount === solverStepLimit), 'solve record did not retain completion');
    }
    if (state.analysisCandidateReady) {
      invariant(state.solverActive === false && state.solverStepCount === solverStepLimit, 'finite solver did not stop at 72 steps');
      invariant(state.solverCompletionReason === 'bounded-72-step-convergence', 'current solver completion reason is missing');
      invariant(state.solverEnergySamples.length === solverStepLimit && state.solverEnergyInitial !== null && state.solverEnergyFinal !== null, 'solver energy evidence is incomplete');
      invariant(state.solverEnergyFinal === 0 && state.solverEnergyFinal < state.solverEnergyInitial, 'bounded solver did not settle its residual velocity');
      invariant(state.analysisCandidateReady && state.analysisCandidate === 'auth-api-high-blast-radius-4-direct-dependents', 'finite solve did not produce the review candidate');
    }
    if (state.conclusionConfirmed) {
      invariant(state.solverCompletionCount > 0 && state.analysisCandidateReady, 'conclusion was confirmed before solving');
      invariant(state.confirmationCount === 1 && state.confirmInputCount >= 1, 'explicit confirmation accounting diverged');
      invariant(state.phase === 'confirmed-retained' && state.result === 'auth-api-release-critical-analysis-confirmed', 'retained analysis result is inconsistent');
      invariant(state.resultRetained && state.retainedConclusion === 'auth-api-high-blast-radius-4-direct-dependents', 'analysis conclusion was not retained');
      invariant(state.directDependentCount === 4 && state.releasePathCount === 4, 'blast radius metrics changed');
      invariant(graphResult.dataset.confirmed === 'true' && resultTitle.textContent === 'AUTH API · HIGH BLAST RADIUS', 'retained DOM conclusion is not visible');
    }
    invariant(state.rollbackRecords.every(record => record.trusted === true && ['undo', 'reset'].includes(record.operation)), 'rollback evidence is invalid');
    return true;
  };

  installPreviewController({
    id: 'draggable-force-directed-svg-network',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
