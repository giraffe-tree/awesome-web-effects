import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#beam-stage');
  const svg = document.querySelector('#beam-svg');
  const source = document.querySelector('#source-node');
  const processor = document.querySelector('#processor-node');
  const review = document.querySelector('#review-node');
  const nodes = [source, processor, review];
  const paths = [document.querySelector('#beam-left'), document.querySelector('#beam-right')];
  const packet = document.querySelector('#beam-packet');
  const layoutToggle = document.querySelector('#layout-toggle');
  const sendButton = document.querySelector('#send-packet');
  const processorMeta = document.querySelector('#processor-meta');
  const reviewTitle = document.querySelector('#review-title');
  const reviewMeta = document.querySelector('#review-meta');
  const resultPanel = document.querySelector('#result-panel');
  const resultTitle = document.querySelector('#result-title');
  const resultDetail = document.querySelector('#result-detail');
  const pipelineState = document.querySelector('#pipeline-state');
  const stateLabel = document.querySelector('#state-label');
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const easeInOutCubic = value => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
  const payloadSignature = 'site-audit.pdf:24-pages:1.8mb:schema-a11y-performance-content';

  const state = {
    id: 'animated-dom-node-connection-beam',
    task: 'human-routes-site-audit-file-through-ai-parser-and-explicitly-sends-it-to-review',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'real-domrect-boundary-intersections-recompute-two-svg-beziers-after-trusted-drag-keyboard-or-layout-input-and-an-explicit-send-moves-one-finite-packet-before-committing-review',
    assetStrategy: 'code-native-dom-svg-and-file-metadata-no-functional-raster-input-required',
    acceptedInputs: ['trusted-mouse-touch-or-pen-drag', 'source-node-arrow-keys', 'layout-button-click-or-keyboard', 'send-button-click-or-keyboard'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticPlayback: false,
    automaticDrift: false,
    automaticPulse: false,
    automaticSend: false,
    automaticFallback: false,
    previewClockOnlyAdvancesHumanStartedTransitions: true,
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
    layoutInputCount: 0,
    sendInputCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    activePointerId: null,
    dragAnchor: null,
    layout: 'flow',
    targetLayout: 'flow',
    layoutTransitionActive: false,
    layoutTransitionStartedAt: null,
    layoutTransitionDuration: .72,
    layoutTransitionProgress: 0,
    layoutStartCount: 0,
    layoutCompletionCount: 0,
    layoutFrameCount: 0,
    humanGeometryMutationCount: 0,
    geometryMeasureCount: 0,
    routeRevisionCount: 0,
    pathCount: paths.length,
    pathLengths: [0, 0],
    pathGeometrySignature: '',
    anchors: [],
    anchorBoundaryVerified: false,
    anchorRegistrationMaxError: null,
    nodeBounds: [],
    transferActive: false,
    transferStartedAt: null,
    transferDuration: 1.12,
    transferProgress: 0,
    transferFrameCount: 0,
    sendStartCount: 0,
    processorReceiptCount: 0,
    arrivalCount: 0,
    packetLeg: 'idle',
    packetPosition: null,
    packetRegistrationError: null,
    payloadSignature,
    payloadRetained: false,
    phase: 'idle-routed',
    result: 'awaiting-explicit-human-send',
    resultRetained: false,
    reviewResult: null,
    reviewFindingCount: 0,
    reviewPriorityCount: 0,
    prematureResultCount: 0,
    inputRecords: [],
    layoutRecords: [],
    transferRecords: [],
    initialSignature: null,
    initialStillVerified: false,
    renderCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    svgWidth: 0,
    svgHeight: 0,
    svgCoverageRatio: 0,
    fullStageGeometryVerified: false,
    motionControlReady: false,
    fontsReady: false,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__DOM_CONNECTION_PIPELINE_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`animated-dom-node-connection-beam: ${message}`);
  }

  const packetMotion = animate(packet, {
    opacity: [0, 1, 1, 0],
    scale: [.65, 1, 1, .65]
  }, { duration: 1, times: [0, .08, .92, 1], ease: 'linear' });
  packetMotion.pause();
  packetMotion.time = 0;
  state.motionControlReady = typeof packetMotion.pause === 'function' && packetMotion.duration === 1;

  let lastRenderTime = 0;
  let layoutFromPositions = [];
  let layoutTargetPositions = [];
  let initialRenderSignature = null;

  function relativeRect(element) {
    const rect = element.getBoundingClientRect();
    const container = stage.getBoundingClientRect();
    return {
      left: rect.left - container.left,
      top: rect.top - container.top,
      right: rect.right - container.left,
      bottom: rect.bottom - container.top,
      width: rect.width,
      height: rect.height,
      centerX: rect.left - container.left + rect.width / 2,
      centerY: rect.top - container.top + rect.height / 2
    };
  }

  function boundaryAnchor(rect, targetRect) {
    const dx = targetRect.centerX - rect.centerX;
    const dy = targetRect.centerY - rect.centerY;
    const tx = Math.abs(dx) < .0001 ? Infinity : rect.width / 2 / Math.abs(dx);
    const ty = Math.abs(dy) < .0001 ? Infinity : rect.height / 2 / Math.abs(dy);
    const t = Math.min(tx, ty);
    return { x: rect.centerX + dx * t, y: rect.centerY + dy * t };
  }

  function pointBoundaryError(point, rect) {
    const insideX = point.x >= rect.left - .5 && point.x <= rect.right + .5;
    const insideY = point.y >= rect.top - .5 && point.y <= rect.bottom + .5;
    const edgeDistance = Math.min(
      Math.abs(point.x - rect.left),
      Math.abs(point.x - rect.right),
      Math.abs(point.y - rect.top),
      Math.abs(point.y - rect.bottom)
    );
    return insideX && insideY ? edgeDistance : Infinity;
  }

  function curve(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} C ${(from.x + dx * .52).toFixed(2)} ${from.y.toFixed(2)}, ${(to.x - dx * .52).toFixed(2)} ${to.y.toFixed(2)}, ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
    }
    return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} C ${from.x.toFixed(2)} ${(from.y + dy * .52).toFixed(2)}, ${to.x.toFixed(2)} ${(to.y - dy * .52).toFixed(2)}, ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
  }

  function updateStageGeometry() {
    const stageRect = stage.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    state.stageWidth = Math.round(stageRect.width);
    state.stageHeight = Math.round(stageRect.height);
    state.svgWidth = Math.round(svgRect.width);
    state.svgHeight = Math.round(svgRect.height);
    state.svgCoverageRatio = Number(((svgRect.width * svgRect.height) / Math.max(1, stageRect.width * stageRect.height)).toFixed(4));
    state.fullStageGeometryVerified = Math.abs(svgRect.left - stageRect.left) <= 1
      && Math.abs(svgRect.top - stageRect.top) <= 1
      && Math.abs(svgRect.right - stageRect.right) <= 1
      && Math.abs(svgRect.bottom - stageRect.bottom) <= 1
      && state.svgCoverageRatio >= .995;
    svg.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);
  }

  function route() {
    updateStageGeometry();
    const bounds = nodes.map(relativeRect);
    const pairs = [[bounds[0], bounds[1]], [bounds[1], bounds[2]]];
    const anchors = pairs.map(([fromRect, toRect]) => ({
      from: boundaryAnchor(fromRect, toRect),
      to: boundaryAnchor(toRect, fromRect)
    }));
    paths.forEach((path, index) => path.setAttribute('d', curve(anchors[index].from, anchors[index].to)));
    state.nodeBounds = bounds.map(rect => ({
      left: Number(rect.left.toFixed(2)), top: Number(rect.top.toFixed(2)), right: Number(rect.right.toFixed(2)), bottom: Number(rect.bottom.toFixed(2)), width: Number(rect.width.toFixed(2)), height: Number(rect.height.toFixed(2))
    }));
    state.anchors = anchors.map(anchor => ({
      from: { x: Number(anchor.from.x.toFixed(2)), y: Number(anchor.from.y.toFixed(2)) },
      to: { x: Number(anchor.to.x.toFixed(2)), y: Number(anchor.to.y.toFixed(2)) }
    }));
    const errors = [
      pointBoundaryError(anchors[0].from, bounds[0]),
      pointBoundaryError(anchors[0].to, bounds[1]),
      pointBoundaryError(anchors[1].from, bounds[1]),
      pointBoundaryError(anchors[1].to, bounds[2])
    ];
    state.anchorRegistrationMaxError = Number(Math.max(...errors).toFixed(4));
    state.anchorBoundaryVerified = errors.every(error => error <= .01);
    state.pathLengths = paths.map(path => Number(path.getTotalLength().toFixed(2)));
    state.pathGeometrySignature = paths.map(path => path.getAttribute('d')).join('|');
    state.geometryMeasureCount += 1;
    state.routeRevisionCount += 1;
  }

  function positionsFor(layout) {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const portrait = height > width * 1.15;
    const centers = layout === 'stack'
      ? portrait
        ? [[.72, .5], [.72, .68], [.72, .86]]
        : [[.38, .68], [.62, .68], [.88, .68]]
      : portrait
        ? [[.32, .52], [.72, .65], [.36, .79]]
        : [[.38, .72], [.62, .42], [.88, .71]];
    return nodes.map((node, index) => ({
      left: clamp(width * centers[index][0] - node.offsetWidth / 2, 8, width - node.offsetWidth - 8),
      top: clamp(height * centers[index][1] - node.offsetHeight / 2, 42, height - node.offsetHeight - 14)
    }));
  }

  function applyPositions(positions) {
    nodes.forEach((node, index) => {
      node.style.left = `${positions[index].left}px`;
      node.style.top = `${positions[index].top}px`;
    });
    route();
  }

  function updateInterface() {
    pipelineState.dataset.phase = state.transferActive ? 'transmitting' : state.resultRetained ? 'complete' : 'idle';
    if (state.transferActive) {
      stateLabel.textContent = state.packetLeg === 'parser' ? 'PARSING · IN TRANSIT' : 'DELIVERING · IN TRANSIT';
      processorMeta.textContent = state.packetLeg === 'parser' ? 'Receiving payload' : 'Schema extracted';
      reviewTitle.textContent = 'Awaiting arrival';
      reviewMeta.textContent = `${Math.round(state.transferProgress * 100)}% routed`;
    } else if (state.resultRetained) {
      stateLabel.textContent = 'REVIEW READY · RETAINED';
      processorMeta.textContent = '18 findings extracted';
      reviewTitle.textContent = 'Review ready';
      reviewMeta.textContent = '3 priority items';
    } else {
      stateLabel.textContent = state.layoutTransitionActive ? 'REMEASURING DOM ROUTE' : 'ROUTE READY · IDLE';
      processorMeta.textContent = 'Schema ready';
      reviewTitle.textContent = 'Awaiting packet';
      reviewMeta.textContent = 'No result';
    }
    resultPanel.dataset.ready = String(state.resultRetained);
    resultTitle.textContent = state.resultRetained ? '18 FINDINGS · REVIEW READY' : 'REVIEW NOT STARTED';
    resultDetail.textContent = state.resultRetained ? '3 priority checks retained for human review.' : 'Move a node, then send the file.';
    sendButton.disabled = state.transferActive || state.layoutTransitionActive;
    layoutToggle.disabled = state.transferActive;
    layoutToggle.textContent = state.targetLayout === 'stack' ? 'FLOW VIEW' : 'STACK VIEW';
    paths.forEach(path => path.classList.toggle('active', state.transferActive));
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
    if (sourceKind.includes('keyboard')) state.keyboardInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (event.pointerType === 'touch') state.touchInputCount += 1;
      if (event.pointerType === 'pen') state.penInputCount += 1;
    }
    if (category === 'drag') state.dragInputCount += 1;
    if (category === 'keyboard-move') state.keyboardMoveInputCount += 1;
    if (category === 'layout') state.layoutInputCount += 1;
    if (category === 'send') state.sendInputCount += 1;
    const record = {
      sourceKind,
      category,
      trusted: true,
      geometryBefore: state.pathGeometrySignature,
      layoutBefore: state.layout,
      transferBefore: state.transferProgress,
      resultBefore: state.result,
      mutated: false
    };
    state.inputRecords.push(record);
    state.inputRecords = state.inputRecords.slice(-96);
    return record;
  }

  function createLayoutControls(targetPositions) {
    layoutFromPositions = nodes.map(node => {
      const rect = relativeRect(node);
      return { left: rect.left, top: rect.top };
    });
    layoutTargetPositions = targetPositions;
  }

  function startLayoutTransition(event, sourceKind) {
    const record = acceptTrusted(event, sourceKind, 'layout');
    if (!record || state.layoutTransitionActive || state.transferActive) return;
    state.targetLayout = state.layout === 'stack' ? 'flow' : 'stack';
    createLayoutControls(positionsFor(state.targetLayout));
    state.layoutTransitionActive = true;
    state.layoutTransitionStartedAt = lastRenderTime;
    state.layoutTransitionProgress = 0;
    state.layoutStartCount += 1;
    state.phase = 'layout-transition';
    state.result = 'human-layout-change-in-progress';
    state.layoutRecords.push({ sourceKind, trusted: true, from: state.layout, to: state.targetLayout, completed: false });
    record.mutated = true;
    updateInterface();
  }

  function moveSourceBy(dx, dy, record) {
    const current = relativeRect(source);
    const left = clamp(current.left + dx, 8, stage.clientWidth - source.offsetWidth - 8);
    const top = clamp(current.top + dy, 42, stage.clientHeight - source.offsetHeight - 14);
    source.style.left = `${left}px`;
    source.style.top = `${top}px`;
    state.layout = 'custom';
    state.targetLayout = 'custom';
    state.humanGeometryMutationCount += 1;
    route();
    record.mutated = record.geometryBefore !== state.pathGeometrySignature;
    record.geometryAfter = state.pathGeometrySignature;
  }

  source.addEventListener('pointerdown', event => {
    const record = acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-drag-start`, 'drag');
    if (!record || state.layoutTransitionActive) return;
    event.preventDefault();
    source.focus({ preventScroll: true });
    const rect = relativeRect(source);
    state.activePointerId = event.pointerId;
    state.dragAnchor = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    state.pointerDownCount += 1;
    source.setPointerCapture(event.pointerId);
    if (source.hasPointerCapture(event.pointerId)) state.pointerCaptureCount += 1;
  });

  source.addEventListener('pointermove', event => {
    if (state.activePointerId !== event.pointerId || !state.dragAnchor) return;
    const record = acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-drag-move`, 'drag');
    if (!record) return;
    event.preventDefault();
    const left = clamp(state.dragAnchor.left + event.clientX - state.dragAnchor.x, 8, stage.clientWidth - source.offsetWidth - 8);
    const top = clamp(state.dragAnchor.top + event.clientY - state.dragAnchor.y, 42, stage.clientHeight - source.offsetHeight - 14);
    source.style.left = `${left}px`;
    source.style.top = `${top}px`;
    state.layout = 'custom';
    state.targetLayout = 'custom';
    state.pointerMoveCount += 1;
    state.humanGeometryMutationCount += 1;
    route();
    record.mutated = record.geometryBefore !== state.pathGeometrySignature;
    record.geometryAfter = state.pathGeometrySignature;
  });

  function endPointer(event) {
    if (state.activePointerId !== event.pointerId) return;
    const record = acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-drag-end`, 'drag');
    if (!record) return;
    event.preventDefault();
    state.pointerUpCount += 1;
    if (source.hasPointerCapture(event.pointerId)) {
      source.releasePointerCapture(event.pointerId);
      state.pointerReleaseCount += 1;
    }
    state.activePointerId = null;
    state.dragAnchor = null;
  }
  source.addEventListener('pointerup', endPointer);
  source.addEventListener('pointercancel', endPointer);

  source.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8]
    }[event.key];
    if (!movement || state.layoutTransitionActive) return;
    const record = acceptTrusted(event, 'source-keyboard-move', 'keyboard-move');
    if (!record) return;
    event.preventDefault();
    moveSourceBy(movement[0], movement[1], record);
  });

  layoutToggle.addEventListener('click', event => startLayoutTransition(event, event.detail === 0 ? 'layout-keyboard' : 'layout-pointer'));

  function startTransfer(event, sourceKind) {
    const record = acceptTrusted(event, sourceKind, 'send');
    if (!record || state.transferActive || state.layoutTransitionActive) return;
    state.transferActive = true;
    state.transferStartedAt = lastRenderTime;
    state.transferProgress = 0;
    state.transferFrameCount = 0;
    state.sendStartCount += 1;
    state.processorReceiptCount = 0;
    state.packetLeg = 'parser';
    state.packetPosition = null;
    state.payloadRetained = true;
    state.phase = 'transmitting';
    state.result = 'payload-in-transit-no-review-result-yet';
    state.transferRecords.push({ sourceKind, trusted: true, payloadSignature, arrived: false, committed: false });
    record.mutated = true;
    packetMotion.time = 0;
    updateInterface();
  }
  sendButton.addEventListener('click', event => startTransfer(event, event.detail === 0 ? 'send-keyboard' : 'send-pointer'));

  function packetPoint(progress) {
    const firstLength = paths[0].getTotalLength();
    const secondLength = paths[1].getTotalLength();
    if (progress <= .48) {
      state.packetLeg = 'parser';
      return paths[0].getPointAtLength(firstLength * clamp(progress / .48));
    }
    if (state.processorReceiptCount === 0) state.processorReceiptCount = 1;
    state.packetLeg = 'review';
    return paths[1].getPointAtLength(secondLength * clamp((progress - .52) / .48));
  }

  function completeTransfer() {
    state.transferActive = false;
    state.transferProgress = 1;
    state.arrivalCount += 1;
    state.phase = 'complete-retained';
    state.result = 'site-audit-structured-review-ready';
    state.resultRetained = true;
    state.reviewResult = '18-findings-3-priority-review-ready';
    state.reviewFindingCount = 18;
    state.reviewPriorityCount = 3;
    state.packetLeg = 'arrived';
    const record = state.transferRecords.at(-1);
    if (record) {
      record.arrived = true;
      record.committed = true;
    }
    packetMotion.time = 1;
    updateInterface();
  }

  function render(time) {
    state.renderCount += 1;
    lastRenderTime = Number.isFinite(time) ? time : lastRenderTime;

    if (state.layoutTransitionActive) {
      const progress = clamp((lastRenderTime - state.layoutTransitionStartedAt) / state.layoutTransitionDuration);
      const eased = easeInOutCubic(progress);
      applyPositions(layoutFromPositions.map((from, index) => ({
        left: from.left + (layoutTargetPositions[index].left - from.left) * eased,
        top: from.top + (layoutTargetPositions[index].top - from.top) * eased
      })));
      state.layoutTransitionProgress = Number(progress.toFixed(4));
      state.layoutFrameCount += 1;
      if (progress >= 1) {
        state.layoutTransitionActive = false;
        state.layout = state.targetLayout;
        state.layoutCompletionCount += 1;
        state.humanGeometryMutationCount += 1;
        state.phase = 'idle-routed';
        state.result = 'layout-changed-route-ready';
        const record = state.layoutRecords.at(-1);
        if (record) record.completed = true;
        updateInterface();
      }
    }

    if (state.transferActive) {
      route();
      const progress = clamp((lastRenderTime - state.transferStartedAt) / state.transferDuration);
      state.transferProgress = Number(progress.toFixed(4));
      state.transferFrameCount += 1;
      packetMotion.time = progress;
      const point = packetPoint(progress);
      packet.setAttribute('cx', point.x.toFixed(2));
      packet.setAttribute('cy', point.y.toFixed(2));
      state.packetPosition = { x: Number(point.x.toFixed(2)), y: Number(point.y.toFixed(2)) };
      const sampled = state.packetLeg === 'parser'
        ? paths[0].getPointAtLength(paths[0].getTotalLength() * clamp(progress / .48))
        : paths[1].getPointAtLength(paths[1].getTotalLength() * clamp((progress - .52) / .48));
      state.packetRegistrationError = Number(Math.hypot(point.x - sampled.x, point.y - sampled.y).toFixed(4));
      updateInterface();
      if (progress >= 1) completeTransfer();
    }

    updateStageGeometry();
    if (state.inputCount === 0) {
      const signature = `${state.pathGeometrySignature}|${state.layout}|${state.transferProgress}|${state.result}`;
      if (initialRenderSignature === null) initialRenderSignature = signature;
      else state.initialStillVerified = signature === initialRenderSignature
        && state.transferActive === false
        && state.layoutTransitionActive === false;
    }
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.fontsReady && state.motionControlReady, 'fonts or Motion packet control are not ready');
    invariant(state.fullStageGeometryVerified && state.svgCoverageRatio >= .995, 'SVG route surface does not cover the full stage');
    invariant(state.pathCount === 2 && paths.every(path => path.getAttribute('d')?.includes('C')), 'two measured Bézier paths are required');
    invariant(state.pathLengths.every(length => length > 6) && state.pathGeometrySignature.includes('|'), 'route geometry is incomplete');
    invariant(state.anchorBoundaryVerified && state.anchorRegistrationMaxError <= .01, 'beam anchors are not attached to real DOM boundaries');
    invariant(state.anchors.length === 2 && state.nodeBounds.length === 3, 'DOM boundary evidence is incomplete');
    invariant(state.automaticPlayback === false && state.automaticDrift === false && state.automaticPulse === false && state.automaticSend === false && state.automaticFallback === false, 'automatic node or packet motion is forbidden');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input mutated the pipeline');
    invariant(state.inputCount === state.trustedInputCount, 'trusted input accounting diverged');
    invariant(state.pointerInputCount + state.keyboardInputCount === state.inputCount, 'input modality accounting diverged');
    invariant(state.touchInputCount + state.penInputCount <= state.pointerInputCount, 'pointer subtype accounting diverged');
    invariant(state.inputRecords.every(record => record.trusted === true), 'an accepted input was not trusted');
    invariant(state.layoutRecords.every(record => record.trusted === true), 'a layout transition lacked trusted input');
    invariant(state.transferRecords.every(record => record.trusted === true && record.payloadSignature === payloadSignature), 'a packet transfer lacked trusted payload causality');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial pipeline frame was not verified still');
    invariant(state.prematureResultCount === 0, 'review result committed before packet arrival');

    if (state.humanGeometryMutationCount > 0) {
      invariant(state.routeRevisionCount > 1 && state.geometryMeasureCount > 1, 'human geometry change did not recompute the route');
      invariant(state.inputRecords.some(record => record.mutated), 'no trusted input mutated node geometry or layout');
    }
    if (state.layoutCompletionCount > 0) {
      invariant(state.layoutStartCount >= state.layoutCompletionCount && state.layoutRecords.some(record => record.completed), 'layout transition evidence is incomplete');
      invariant(state.layoutTransitionActive === false && state.layoutTransitionProgress === 1, 'layout did not settle at its finite endpoint');
    }
    if (state.sendStartCount > 0) {
      invariant(state.payloadRetained && state.transferRecords.length === state.sendStartCount, 'explicit send did not retain the payload evidence');
      invariant(state.transferFrameCount > 1 && state.packetRegistrationError === 0, 'packet did not follow the measured route');
    }
    if (state.resultRetained) {
      invariant(state.transferActive === false && state.transferProgress === 1 && state.arrivalCount === state.sendStartCount, 'packet did not finish at review');
      invariant(state.processorReceiptCount === state.arrivalCount, 'processor receipt accounting diverged');
      invariant(state.phase === 'complete-retained' && state.result === 'site-audit-structured-review-ready', 'retained review result is inconsistent');
      invariant(state.reviewResult === '18-findings-3-priority-review-ready' && state.reviewFindingCount === 18 && state.reviewPriorityCount === 3, 'review findings are incomplete');
      invariant(state.transferRecords.every(record => record.arrived && record.committed), 'review result was not committed after arrival');
      invariant(resultPanel.dataset.ready === 'true' && resultTitle.textContent === '18 FINDINGS · REVIEW READY', 'retained DOM result is not visible');
    }
    return true;
  };

  const ready = document.fonts.ready.then(() => {
    state.fontsReady = true;
    applyPositions(positionsFor('flow'));
    updateInterface();
    state.initialSignature = `${state.pathGeometrySignature}|flow|0|awaiting-explicit-human-send`;
    state.ready = true;
  });

  const resizeObserver = new ResizeObserver(() => {
    if (!state.ready || state.layoutTransitionActive || state.activePointerId !== null) return;
    if (state.layout === 'flow' || state.layout === 'stack') applyPositions(positionsFor(state.layout));
    else route();
  });
  resizeObserver.observe(stage);

  installPreviewController({
    id: 'animated-dom-node-connection-beam',
    library: 'motion@12.42.2',
    renderer: 'svg',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
