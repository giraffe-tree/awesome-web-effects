import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#node-canvas');
  const svg = document.querySelector('#edge-layer');
  const seedEdge = document.querySelector('#seed-edge');
  const userEdge = document.querySelector('#user-edge');
  const draftEdge = document.querySelector('#draft-edge');
  const flowDot = document.querySelector('#flow-dot');
  const flowHalo = document.querySelector('#flow-halo');
  const nodes = Object.fromEntries([...document.querySelectorAll('.node')].map(node => [node.dataset.node, node]));
  const modelOutput = document.querySelector('#model-output');
  const reviewInput = document.querySelector('#review-input');
  const statusOutput = document.querySelector('#graph-status');
  const retainedOutput = document.querySelector('#retained-output');
  const candidateOutput = document.querySelector('#candidate-output');
  const resultRail = document.querySelector('#result-rail');
  const undoButton = document.querySelector('#undo-graph');
  const resetButton = document.querySelector('#reset-graph');
  const runButton = document.querySelector('#run-workflow');
  const confirmButton = document.querySelector('#confirm-output');

  const CANDIDATE = '3-step launch plan · JSON valid';
  const state = {
    id: 'handle-connected-animated-node-editor',
    productTask: 'Build, run, and explicitly approve an AI launch-planning workflow.',
    library: 'motion@12.42.2',
    renderer: 'svg',
    mechanism: 'trusted node drag recomputes handle geometry; trusted output-to-input gesture creates a persistent edge; Motion transports one finite payload',
    assetStrategy: 'code-native',
    imageGenDecision: 'omitted: node bounds, SVG handles, edge topology, payload progress, and retained workflow state are the functional evidence; raster pixels would not drive the mechanism',
    captureType: 'interactive',
    automaticPlayback: false,
    automaticConnection: false,
    automaticPulse: false,
    automaticCycle: false,
    automaticFallback: false,
    initialStillVerified: false,
    motionLibraryAvailable: typeof animate === 'function',
    trustedPointerInputCount: 0,
    trustedKeyboardInputCount: 0,
    trustedControlInputCount: 0,
    syntheticRejectedCount: 0,
    nodeDragCount: 0,
    keyboardNodeMoveCount: 0,
    nodeGeometryMutationCount: 0,
    geometryRecomputeCount: 0,
    edgePathChangeCount: 0,
    connectionIntentCount: 0,
    connectionTransitCount: 0,
    connectionCompletionCount: 0,
    connectionCancelCount: 0,
    edgeCreateCount: 0,
    pointerEdgeCreateCount: 0,
    keyboardEdgeCreateCount: 0,
    persistentEdgeCount: 0,
    seedEdgeCount: 1,
    contentIntentCount: 0,
    contentTransitCount: 0,
    payloadRunCount: 0,
    payloadArrivalCount: 0,
    candidateCreateCount: 0,
    confirmCount: 0,
    contentCommitCount: 0,
    contentCancelCount: 0,
    prematureCandidateCount: 0,
    prematureCommitCount: 0,
    retainedChangeOutsideConfirmCount: 0,
    retainedStableDuringTransitCount: 0,
    undoCount: 0,
    resetCount: 0,
    phase: 'ready',
    connectionInputType: 'none',
    lastInputType: 'none',
    payloadProgress: 0,
    edgePathSignature: '',
    nodePositions: {},
    candidate: null,
    retainedResult: null,
    graphTransactionSerial: 0,
    contentTransactionSerial: 0,
    activeContentTransaction: null,
    transactionLog: [],
    svgCoverage: 0,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let positions = null;
  let pointerNodeDrag = null;
  let pointerConnection = null;
  let keyboardConnection = null;
  let edgeExists = false;
  let candidate = null;
  let retainedResult = null;
  let undoStack = [];
  let payloadControl = null;
  let payloadSerial = 0;
  let idlePromise = Promise.resolve();
  let resolveIdle = null;
  let lastEdgeSignature = '';
  let initialGraphSignature = '';
  let stillRenderCount = 0;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const clonePositions = value => Object.fromEntries(Object.entries(value).map(([key, point]) => [key, { ...point }]));
  const retainedSignature = () => retainedResult || null;
  const isPortrait = () => stage.clientWidth / stage.clientHeight < 0.8;
  const setHidden = (element, hidden) => element.toggleAttribute('hidden', hidden);

  function defaultPositions() {
    return isPortrait()
      ? {
          source: { x: .06, y: .18 },
          model: { x: .57, y: .38 },
          review: { x: .18, y: .6 },
        }
      : {
          source: { x: .045, y: .43 },
          model: { x: .39, y: .3 },
          review: { x: .72, y: .46 },
        };
  }

  function record(kind, source, extra = {}) {
    state.transactionLog.push({
      kind,
      source,
      graphTransaction: state.graphTransactionSerial,
      contentTransaction: state.activeContentTransaction,
      edgeExists,
      candidate,
      retainedResult,
      ...extra,
    });
    if (state.transactionLog.length > 24) state.transactionLog.shift();
  }

  function rejectSynthetic(event) {
    if (event.isTrusted) return false;
    state.syntheticRejectedCount += 1;
    return true;
  }

  function stageBounds() {
    return stage.getBoundingClientRect();
  }

  function nodeBounds(node) {
    const nodeRect = node.getBoundingClientRect();
    const stageRect = stageBounds();
    return {
      left: nodeRect.left - stageRect.left,
      top: nodeRect.top - stageRect.top,
      width: nodeRect.width,
      height: nodeRect.height,
    };
  }

  function applyNodePositions() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const topMinimum = isPortrait() ? 49 : (width >= 500 ? 61 : 39);
    const resultHeight = isPortrait() ? 79 : (width >= 500 ? 94 : 49);
    Object.entries(nodes).forEach(([id, node]) => {
      const left = clamp(positions[id].x * width, 7, width - node.offsetWidth - 7);
      const top = clamp(positions[id].y * height, topMinimum, height - resultHeight - node.offsetHeight);
      node.style.left = `${left}px`;
      node.style.top = `${top}px`;
    });
  }

  function center(element) {
    const bounds = element.getBoundingClientRect();
    const stageRect = stageBounds();
    return {
      x: bounds.left - stageRect.left + bounds.width / 2,
      y: bounds.top - stageRect.top + bounds.height / 2,
    };
  }

  function portPoint(node, side) {
    return center(node.querySelector(`.${side}`));
  }

  function curvePath(from, to) {
    const reach = Math.max(26, Math.abs(to.x - from.x) * .46);
    const direction = to.x >= from.x ? 1 : -1;
    return `M${from.x.toFixed(2)},${from.y.toFixed(2)} C${(from.x + reach * direction).toFixed(2)},${from.y.toFixed(2)} ${(to.x - reach * direction).toFixed(2)},${to.y.toFixed(2)} ${to.x.toFixed(2)},${to.y.toFixed(2)}`;
  }

  function layoutGraph() {
    applyNodePositions();
    svg.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
    const seedPath = curvePath(portPoint(nodes.source, 'out'), portPoint(nodes.model, 'in'));
    const persistentPath = edgeExists ? curvePath(portPoint(nodes.model, 'out'), portPoint(nodes.review, 'in')) : '';
    seedEdge.setAttribute('d', seedPath);
    userEdge.setAttribute('d', persistentPath);
    setHidden(userEdge, !edgeExists);
    if (!pointerConnection && !keyboardConnection) {
      draftEdge.setAttribute('d', '');
      setHidden(draftEdge, true);
    }
    const signature = `${seedPath}|${persistentPath}`;
    if (lastEdgeSignature && signature !== lastEdgeSignature) state.edgePathChangeCount += 1;
    lastEdgeSignature = signature;
    state.edgePathSignature = signature;
    state.geometryRecomputeCount += 1;
    state.persistentEdgeCount = edgeExists ? 1 : 0;
    state.nodePositions = clonePositions(positions);
    state.svgCoverage = Math.round((svg.clientWidth * svg.clientHeight) / Math.max(1, stage.clientWidth * stage.clientHeight) * 100) / 100;
    refreshUi();
    return signature;
  }

  function refreshUi() {
    const transmitting = state.phase === 'transmitting';
    runButton.disabled = !edgeExists || transmitting;
    confirmButton.disabled = !candidate || transmitting;
    undoButton.disabled = undoStack.length === 0 || transmitting;
    modelOutput.dataset.armed = String(Boolean(pointerConnection || keyboardConnection));
    resultRail.dataset.active = String(Boolean(candidate));
    retainedOutput.textContent = retainedResult || 'No approved result';
    candidateOutput.textContent = transmitting
      ? `Payload ${Math.round(state.payloadProgress * 100)}% · previous result stays live`
      : candidate || (edgeExists ? 'Ready to send one payload' : 'Run after connecting a real edge');
    candidateOutput.dataset.ready = String(Boolean(candidate));

    if (transmitting) {
      statusOutput.dataset.state = 'transmitting';
      statusOutput.textContent = `Payload ${Math.round(state.payloadProgress * 100)}%`;
    } else if (candidate) {
      statusOutput.dataset.state = 'candidate';
      statusOutput.textContent = 'Candidate arrived · confirm';
    } else if (retainedResult) {
      statusOutput.dataset.state = 'confirmed';
      statusOutput.textContent = 'Approved output retained';
    } else if (edgeExists) {
      statusOutput.dataset.state = 'ready';
      statusOutput.textContent = 'Edge ready · send payload';
    } else {
      statusOutput.dataset.state = 'ready';
      statusOutput.textContent = 'Connect model → review';
    }

    state.candidate = candidate;
    state.retainedResult = retainedResult;
    state.undoDepth = undoStack.length;
  }

  function pushUndo(action) {
    undoStack.push(action);
    if (undoStack.length > 18) undoStack.shift();
    refreshUi();
  }

  function createPersistentEdge(source) {
    if (edgeExists) return false;
    state.graphTransactionSerial += 1;
    edgeExists = true;
    state.edgeCreateCount += 1;
    state.connectionCompletionCount += 1;
    if (source === 'pointer') state.pointerEdgeCreateCount += 1;
    else state.keyboardEdgeCreateCount += 1;
    state.connectionInputType = source;
    state.lastInputType = source;
    pushUndo({ type: 'edge-create' });
    record('edge-commit', source);
    layoutGraph();
    return true;
  }

  function cancelPayload(reason) {
    if (state.phase !== 'transmitting') return;
    payloadSerial += 1;
    payloadControl?.stop();
    payloadControl = null;
    setHidden(flowDot, true);
    setHidden(flowHalo, true);
    state.contentCancelCount += 1;
    state.phase = 'cancelled';
    state.activeContentTransaction = null;
    state.payloadProgress = 0;
    record('content-cancel', reason);
    resolveIdle?.();
    resolveIdle = null;
  }

  function updatePayloadPoint(progress) {
    if (!edgeExists || !userEdge.getAttribute('d')) return;
    const length = userEdge.getTotalLength();
    const point = userEdge.getPointAtLength(length * progress);
    flowDot.setAttribute('cx', point.x);
    flowDot.setAttribute('cy', point.y);
    flowHalo.setAttribute('cx', point.x);
    flowHalo.setAttribute('cy', point.y);
    flowHalo.setAttribute('r', String(7 + Math.sin(progress * Math.PI) * 5));
  }

  function runWorkflow(source) {
    if (!edgeExists || state.phase === 'transmitting') return;
    candidate = null;
    state.contentTransactionSerial += 1;
    state.activeContentTransaction = state.contentTransactionSerial;
    state.contentIntentCount += 1;
    state.payloadRunCount += 1;
    state.phase = 'transmitting';
    state.payloadProgress = 0;
    state.lastInputType = source;
    const previousRetained = retainedSignature();
    const serial = ++payloadSerial;
    record('content-intent', source, { previousRetained });
    setHidden(flowDot, false);
    setHidden(flowHalo, false);
    updatePayloadPoint(0);
    idlePromise = new Promise(resolve => { resolveIdle = resolve; });
    refreshUi();

    payloadControl = animate(0, 1, {
      duration: .5,
      ease: [.25, .75, .25, 1],
      onUpdate: progress => {
        if (serial !== payloadSerial) return;
        state.payloadProgress = progress;
        state.contentTransitCount += 1;
        if (retainedSignature() === previousRetained) state.retainedStableDuringTransitCount += 1;
        else state.retainedChangeOutsideConfirmCount += 1;
        updatePayloadPoint(progress);
        refreshUi();
      },
      onComplete: () => {
        if (serial !== payloadSerial) return;
        state.payloadProgress = 1;
        state.payloadArrivalCount += 1;
        if (state.payloadArrivalCount < state.payloadRunCount) state.prematureCandidateCount += 1;
        candidate = CANDIDATE;
        state.candidateCreateCount += 1;
        state.phase = 'candidate';
        setHidden(flowDot, true);
        setHidden(flowHalo, true);
        payloadControl = null;
        record('payload-arrival', source);
        refreshUi();
        resolveIdle?.();
        resolveIdle = null;
      },
    });
  }

  function confirmCandidate(source) {
    if (!candidate) {
      state.prematureCommitCount += 1;
      return;
    }
    const before = retainedSignature();
    retainedResult = candidate;
    candidate = null;
    state.confirmCount += 1;
    state.contentCommitCount += 1;
    state.phase = 'confirmed';
    state.activeContentTransaction = null;
    state.lastInputType = source;
    record('content-commit', source, { retainedBefore: before, retainedAfter: retainedSignature() });
    refreshUi();
  }

  Object.entries(nodes).forEach(([id, node]) => {
    node.addEventListener('pointerdown', event => {
      if (event.target.closest('.handle')) return;
      if (rejectSynthetic(event)) return;
      event.preventDefault();
      const stageRect = stageBounds();
      const bounds = nodeBounds(node);
      state.trustedPointerInputCount += 1;
      state.nodeDragCount += 1;
      state.lastInputType = 'pointer-node';
      pointerNodeDrag = {
        id,
        pointerId: event.pointerId,
        startClient: { x: event.clientX, y: event.clientY },
        startLeft: bounds.left,
        startTop: bounds.top,
        startPositions: clonePositions(positions),
        stageWidth: stageRect.width,
        stageHeight: stageRect.height,
      };
      node.setPointerCapture(event.pointerId);
      record('node-grab', 'pointer', { node: id });
    });

    node.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      if (rejectSynthetic(event)) return;
      event.preventDefault();
      const before = clonePositions(positions);
      const step = event.shiftKey ? .05 : .018;
      if (event.key === 'ArrowLeft') positions[id].x -= step;
      if (event.key === 'ArrowRight') positions[id].x += step;
      if (event.key === 'ArrowUp') positions[id].y -= step;
      if (event.key === 'ArrowDown') positions[id].y += step;
      positions[id].x = clamp(positions[id].x, 0, .96);
      positions[id].y = clamp(positions[id].y, .12, .76);
      state.trustedKeyboardInputCount += 1;
      state.keyboardNodeMoveCount += 1;
      state.nodeGeometryMutationCount += 1;
      state.lastInputType = 'keyboard-node';
      pushUndo({ type: 'node-move', before, after: clonePositions(positions) });
      record('node-keyboard-move', 'keyboard', { node: id, key: event.key });
      layoutGraph();
    });
  });

  stage.addEventListener('pointermove', event => {
    if (pointerNodeDrag && event.pointerId === pointerNodeDrag.pointerId && event.isTrusted) {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const node = nodes[pointerNodeDrag.id];
      const nextLeft = pointerNodeDrag.startLeft + event.clientX - pointerNodeDrag.startClient.x;
      const nextTop = pointerNodeDrag.startTop + event.clientY - pointerNodeDrag.startClient.y;
      positions[pointerNodeDrag.id].x = clamp(nextLeft / width, 0, (width - node.offsetWidth - 7) / width);
      positions[pointerNodeDrag.id].y = clamp(nextTop / height, .12, (height - node.offsetHeight - 47) / height);
      state.nodeGeometryMutationCount += 1;
      layoutGraph();
    }
    if (pointerConnection && event.pointerId === pointerConnection.pointerId && event.isTrusted) {
      const stageRect = stageBounds();
      const from = portPoint(nodes.model, 'out');
      const to = { x: event.clientX - stageRect.left, y: event.clientY - stageRect.top };
      setHidden(draftEdge, false);
      draftEdge.setAttribute('d', curvePath(from, to));
      state.connectionTransitCount += 1;
      record('edge-transit', 'pointer');
    }
  });

  stage.addEventListener('pointerup', event => {
    if (pointerNodeDrag && event.pointerId === pointerNodeDrag.pointerId) {
      const action = pointerNodeDrag;
      pointerNodeDrag = null;
      pushUndo({ type: 'node-move', before: action.startPositions, after: clonePositions(positions) });
      record('node-settle', 'pointer', { node: action.id });
      layoutGraph();
    }
    if (pointerConnection && event.pointerId === pointerConnection.pointerId) {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('#review-input');
      const valid = Boolean(target) && event.isTrusted;
      pointerConnection = null;
      setHidden(draftEdge, true);
      draftEdge.setAttribute('d', '');
      if (valid) createPersistentEdge('pointer');
      else {
        state.connectionCancelCount += 1;
        record('edge-cancel', 'pointer');
        refreshUi();
      }
    }
  });

  modelOutput.addEventListener('pointerdown', event => {
    if (rejectSynthetic(event)) return;
    event.preventDefault();
    event.stopPropagation();
    state.trustedPointerInputCount += 1;
    state.connectionIntentCount += 1;
    state.graphTransactionSerial += 1;
    state.connectionInputType = 'pointer';
    pointerConnection = { pointerId: event.pointerId };
    modelOutput.setPointerCapture(event.pointerId);
    record('edge-intent', 'pointer');
    refreshUi();
  });

  modelOutput.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    if (rejectSynthetic(event)) return;
    event.preventDefault();
    state.trustedKeyboardInputCount += 1;
    state.connectionIntentCount += 1;
    state.graphTransactionSerial += 1;
    state.connectionInputType = 'keyboard';
    keyboardConnection = { from: 'model' };
    setHidden(draftEdge, false);
    draftEdge.setAttribute('d', curvePath(portPoint(nodes.model, 'out'), portPoint(nodes.review, 'in')));
    record('edge-intent', 'keyboard');
    refreshUi();
  });

  reviewInput.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key) || !keyboardConnection) return;
    if (rejectSynthetic(event)) return;
    event.preventDefault();
    state.trustedKeyboardInputCount += 1;
    state.connectionTransitCount += 1;
    keyboardConnection = null;
    setHidden(draftEdge, true);
    draftEdge.setAttribute('d', '');
    createPersistentEdge('keyboard');
  });

  undoButton.addEventListener('click', event => {
    if (rejectSynthetic(event) || undoStack.length === 0 || state.phase === 'transmitting') return;
    state.trustedControlInputCount += 1;
    const action = undoStack.pop();
    if (action.type === 'node-move') positions = clonePositions(action.before);
    if (action.type === 'edge-create') edgeExists = false;
    state.undoCount += 1;
    state.phase = 'undo';
    state.lastInputType = 'undo-button';
    record('undo', 'control', { action: action.type });
    layoutGraph();
  });

  resetButton.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    cancelPayload('reset');
    positions = defaultPositions();
    pointerNodeDrag = null;
    pointerConnection = null;
    keyboardConnection = null;
    edgeExists = false;
    candidate = null;
    retainedResult = null;
    undoStack = [];
    setHidden(draftEdge, true);
    setHidden(flowDot, true);
    setHidden(flowHalo, true);
    state.resetCount += 1;
    state.phase = 'reset';
    state.payloadProgress = 0;
    state.lastInputType = 'reset-button';
    record('reset', 'control');
    layoutGraph();
  });

  runButton.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    runWorkflow('run-button');
  });

  confirmButton.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    confirmCandidate('confirm-button');
  });

  window.addEventListener('resize', () => layoutGraph());
  window.__PREVIEW_WAIT_FOR_IDLE__ = () => idlePromise;
  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const svgBounds = svg.getBoundingClientRect();
    const seedLength = seedEdge.getTotalLength();
    const userLength = edgeExists ? userEdge.getTotalLength() : 0;
    return state.motionLibraryAvailable
      && seedEdge.getAttribute('d')?.startsWith('M')
      && seedLength > 20
      && (!edgeExists || (userEdge.getAttribute('d')?.startsWith('M') && userLength > 20))
      && state.geometryRecomputeCount > 0
      && state.initialStillVerified
      && state.automaticPlayback === false
      && state.automaticConnection === false
      && state.automaticPulse === false
      && state.automaticCycle === false
      && state.automaticFallback === false
      && state.prematureCandidateCount === 0
      && state.prematureCommitCount === 0
      && state.retainedChangeOutsideConfirmCount === 0
      && state.candidateCreateCount === state.payloadArrivalCount
      && state.contentCommitCount === state.confirmCount
      && state.svgCoverage >= .98
      && svgBounds.width >= stage.clientWidth * .98
      && svgBounds.height >= stage.clientHeight * .98
      && [modelOutput, reviewInput].every(handle => handle.getBoundingClientRect().width >= 28);
  };

  positions = defaultPositions();
  requestAnimationFrame(() => {
    initialGraphSignature = layoutGraph();
    requestAnimationFrame(() => resolveReady());
  });

  installPreviewController({
    id: state.id,
    library: state.library,
    renderer: state.renderer,
    render: () => {
      const signature = layoutGraph();
      if (state.trustedPointerInputCount + state.trustedKeyboardInputCount + state.trustedControlInputCount === 0 && signature === initialGraphSignature && !edgeExists && flowDot.hasAttribute('hidden')) {
        stillRenderCount += 1;
        state.initialStillVerified = stillRenderCount >= 2;
      }
    },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
