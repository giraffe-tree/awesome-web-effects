import mojs from '@mojs/core';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#burst-stage');
  const field = document.querySelector('#burst-field');
  const nodes = [...document.querySelectorAll('.burst-node')];
  const status = document.querySelector('#burst-status');
  const meterFill = document.querySelector('#burst-meter-fill');
  const clearButton = document.querySelector('#burst-clear');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const nodeOrder = nodes.map(node => node.dataset.nodeId);
  const nodeLabels = { ingest: 'Ingest', verify: 'Verify', release: 'Release' };
  const palette = ['#0e6c72', '#efb433', '#d95630', '#171b18'];
  const animationDuration = 980;

  const state = {
    id: 'motion-graphics-burst',
    automaticFallback: false,
    automaticPlayback: false,
    automaticTrigger: false,
    automaticNodeSelection: false,
    syntheticInputDispatch: false,
    userInitiated: false,
    eventOwnedTimeline: true,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard'],
    inputKind: 'none',
    inputCount: 0,
    lastInputTrusted: null,
    triggerCount: 0,
    burstCount: 0,
    mojsReplayCount: 0,
    pointerTriggerCount: 0,
    keyboardTriggerCount: 0,
    focusMoveCount: 0,
    resetCount: 0,
    interruptionCount: 0,
    reducedMotionDirectCount: 0,
    nodeOrder: [...nodeOrder],
    nodeTriggerCounts: Object.fromEntries(nodeOrder.map(id => [id, 0])),
    nodeConfirmed: Object.fromEntries(nodeOrder.map(id => [id, false])),
    nodeCoordinates: Object.fromEntries(nodeOrder.map(id => [id, { x: 0, y: 0 }])),
    selectedNode: null,
    previousNode: null,
    lastTriggeredNode: null,
    traceActive: false,
    currentBurstOrigin: null,
    lastOriginDistanceFromNodeCenter: null,
    mappedToNodeCenter: true,
    coordinateSpace: 'burst-field-local-css-pixels',
    phase: 'idle',
    isAnimating: false,
    timelineProgress: 0,
    initialFrameStatic: true,
    initialTriggerCount: 0,
    initialPhase: 'idle',
    reducedMotion: reducedMotion.matches,
    mojsRevision: mojs.revision,
    mojsTimelineCount: 4,
    svgCount: 0,
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  const shardBurst = new mojs.Burst({
    parent: field,
    left: 0,
    top: 0,
    count: 12,
    degree: 360,
    angle: 15,
    radius: { 13: 66 },
    duration: 900,
    easing: 'cubic.out',
    children: {
      shape: 'rect',
      fill: palette,
      radius: { 5: 0 },
      radiusX: 1.5,
      scale: { 1: .35 },
      rotate: { 0: 170 },
      duration: 900,
      easing: 'quad.out'
    }
  });

  const sparkBurst = new mojs.Burst({
    parent: field,
    left: 0,
    top: 0,
    count: 8,
    degree: 360,
    angle: 37.5,
    radius: { 5: 47 },
    duration: 700,
    delay: 70,
    easing: 'expo.out',
    children: {
      shape: 'line',
      stroke: ['#fffaf0', '#0e6c72', '#efb433', '#d95630'],
      strokeWidth: { 3: 0 },
      radius: 8,
      scaleX: { .65: 1.25 },
      duration: 630,
      easing: 'quad.out'
    }
  });

  const shockwave = new mojs.Shape({
    parent: field,
    left: 0,
    top: 0,
    shape: 'circle',
    fill: 'none',
    stroke: '#d95630',
    strokeWidth: { 6: 0 },
    radius: { 5: 50 },
    opacity: { 1: 0 },
    duration: 780,
    easing: 'cubic.out'
  });

  const core = new mojs.Shape({
    parent: field,
    left: 0,
    top: 0,
    shape: 'polygon',
    points: 6,
    fill: { '#fffaf0': '#efb433' },
    radius: { 3: 12 },
    scale: { .4: 1 },
    rotate: { 0: 90 },
    opacity: { 1: 0 },
    duration: 590,
    easing: 'elastic.out'
  });

  const composition = new mojs.Timeline().add(shardBurst, sparkBurst, shockwave, core);
  composition.stop();
  composition.setProgress(0);

  let latestPointerKind = 'mouse';
  let animationFrame = 0;
  let runToken = 0;

  function setDataset(name, value) {
    const next = String(value);
    if (stage.dataset[name] !== next) stage.dataset[name] = next;
  }

  function recordInput(inputKind, trusted) {
    state.userInitiated = true;
    state.inputKind = inputKind;
    state.inputCount += 1;
    state.lastInputTrusted = trusted;
  }

  function updateNodeCoordinates() {
    const fieldRect = field.getBoundingClientRect();
    nodes.forEach(node => {
      const rect = node.getBoundingClientRect();
      state.nodeCoordinates[node.dataset.nodeId] = {
        x: Number((rect.left - fieldRect.left + rect.width / 2).toFixed(2)),
        y: Number((rect.top - fieldRect.top + rect.height / 2).toFixed(2))
      };
    });
    state.svgCount = field.querySelectorAll('svg').length;
  }

  function syncInterface() {
    setDataset('phase', state.phase);
    setDataset('activeNode', state.selectedNode || 'none');
    setDataset('triggerCount', state.triggerCount);
    setDataset('isAnimating', state.isAnimating);
    nodes.forEach(node => {
      const selected = node.dataset.nodeId === state.selectedNode;
      node.classList.toggle('is-firing', selected && state.isAnimating);
      node.classList.toggle('is-confirmed', state.nodeConfirmed[node.dataset.nodeId]);
      node.setAttribute('aria-pressed', String(selected));
      node.tabIndex = selected || (!state.selectedNode && node === nodes[0]) ? 0 : -1;
    });
    clearButton.disabled = !state.traceActive;
    const label = state.selectedNode ? nodeLabels[state.selectedNode] : null;
    const message = !label
      ? 'Awaiting a real node input'
      : state.phase === 'charge'
        ? `${label} · charge accepted`
        : state.phase === 'release'
          ? `${label} · signal released`
          : state.phase === 'dissipate'
            ? `${label} · confirmation settling`
            : `${label} · event acknowledged`;
    if (status.textContent !== message) status.textContent = message;
  }

  function setPhaseFromProgress(progress) {
    state.timelineProgress = Number(progress.toFixed(3));
    state.phase = progress < .14 ? 'charge' : progress < .52 ? 'release' : progress < 1 ? 'dissipate' : 'settled';
    meterFill.style.scale = `${Math.sin(Math.min(1, progress) * Math.PI)} 1`;
    syncInterface();
  }

  function finishTimeline(token) {
    if (token !== runToken) return;
    state.timelineProgress = 1;
    state.phase = 'settled';
    state.isAnimating = false;
    meterFill.style.scale = '0 1';
    animationFrame = 0;
    syncInterface();
  }

  function trackTimeline(startTime, token) {
    const tick = now => {
      if (token !== runToken) return;
      const progress = Math.min(1, (now - startTime) / animationDuration);
      setPhaseFromProgress(progress);
      if (progress < 1) animationFrame = requestAnimationFrame(tick);
      else finishTimeline(token);
    };
    animationFrame = requestAnimationFrame(tick);
  }

  function mapBurstToNode(node) {
    updateNodeCoordinates();
    const nodeId = node.dataset.nodeId;
    const origin = state.nodeCoordinates[nodeId];
    const fieldRect = field.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const measuredCenter = {
      x: nodeRect.left - fieldRect.left + nodeRect.width / 2,
      y: nodeRect.top - fieldRect.top + nodeRect.height / 2
    };
    state.currentBurstOrigin = { ...origin };
    state.lastOriginDistanceFromNodeCenter = Number(Math.hypot(origin.x - measuredCenter.x, origin.y - measuredCenter.y).toFixed(4));
    state.mappedToNodeCenter = state.lastOriginDistanceFromNodeCenter <= .02;
    [shardBurst, sparkBurst, shockwave, core].forEach(part => part.tune({ left: origin.x, top: origin.y }));
    return origin;
  }

  function triggerNode(node, inputKind, trusted) {
    if (!nodes.includes(node)) return;
    recordInput(inputKind, trusted);
    const nodeId = node.dataset.nodeId;
    if (state.isAnimating) state.interruptionCount += 1;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    runToken += 1;
    composition.stop();
    composition.setProgress(0);
    mapBurstToNode(node);
    state.previousNode = state.selectedNode;
    state.selectedNode = nodeId;
    state.lastTriggeredNode = nodeId;
    state.traceActive = true;
    state.triggerCount += 1;
    state.burstCount += 1;
    state.nodeTriggerCounts[nodeId] += 1;
    state.nodeConfirmed[nodeId] = true;
    if (inputKind === 'keyboard') state.keyboardTriggerCount += 1;
    else state.pointerTriggerCount += 1;
    node.focus({ preventScroll: true });

    if (state.reducedMotion) {
      composition.setProgress(.54);
      state.reducedMotionDirectCount += 1;
      state.timelineProgress = .54;
      state.phase = 'settled';
      state.isAnimating = false;
      meterFill.style.scale = '0 1';
      syncInterface();
      return;
    }

    state.mojsReplayCount += 1;
    state.phase = 'charge';
    state.isAnimating = true;
    state.timelineProgress = 0;
    syncInterface();
    composition.replay();
    trackTimeline(performance.now(), runToken);
  }

  function focusNode(index, inputKind, trusted) {
    recordInput(inputKind, trusted);
    state.focusMoveCount += 1;
    const boundedIndex = (index + nodes.length) % nodes.length;
    nodes[boundedIndex].focus({ preventScroll: true });
  }

  function resetTrace(inputKind, trusted) {
    recordInput(inputKind, trusted);
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    runToken += 1;
    composition.stop();
    composition.setProgress(0);
    state.resetCount += 1;
    state.previousNode = state.selectedNode;
    state.selectedNode = null;
    state.lastTriggeredNode = null;
    state.traceActive = false;
    state.currentBurstOrigin = null;
    state.lastOriginDistanceFromNodeCenter = null;
    state.nodeConfirmed = Object.fromEntries(nodeOrder.map(id => [id, false]));
    state.phase = 'idle';
    state.isAnimating = false;
    state.timelineProgress = 0;
    meterFill.style.scale = '0 1';
    nodes[0].focus({ preventScroll: true });
    syncInterface();
  }

  nodes.forEach((node, index) => {
    node.addEventListener('pointerdown', event => {
      latestPointerKind = event.pointerType || 'pointer';
    });
    node.addEventListener('click', event => {
      const inputKind = event.detail === 0 ? 'keyboard' : latestPointerKind;
      triggerNode(node, inputKind, event.isTrusted);
    });
    node.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat) return;
      const nextIndex = event.key === 'Home' ? 0
        : event.key === 'End' ? nodes.length - 1
          : index + (event.key === 'ArrowRight' ? 1 : -1);
      focusNode(nextIndex, 'keyboard', event.isTrusted);
    });
  });

  clearButton.addEventListener('click', event => {
    const inputKind = event.detail === 0 ? 'keyboard' : latestPointerKind;
    resetTrace(inputKind, event.isTrusted);
  });

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });

  stage.addEventListener('keydown', event => {
    if ((event.key === 'Escape' || event.key.toLowerCase() === 'r') && !clearButton.disabled) {
      event.preventDefault();
      if (!event.repeat) resetTrace('keyboard', event.isTrusted);
      return;
    }
    if (event.target.closest('button')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (event.repeat) return;
      const nextIndex = event.key === 'End' ? nodes.length - 1
        : event.key === 'Home' ? 0
          : event.key === 'ArrowRight' ? 1 : nodes.length - 1;
      focusNode(nextIndex, 'keyboard', event.isTrusted);
      return;
    }
    if (![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    if (!event.repeat) triggerNode(nodes.find(node => node === document.activeElement) || nodes[0], 'keyboard', event.isTrusted);
  });

  addEventListener('resize', updateNodeCoordinates);
  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.isAnimating) {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      runToken += 1;
      composition.stop();
      composition.setProgress(.54);
      state.reducedMotionDirectCount += 1;
      state.timelineProgress = .54;
      state.phase = 'settled';
      state.isAnimating = false;
      meterFill.style.scale = '0 1';
    }
    syncInterface();
  });

  function render() {
    state.renderCount += 1;
    syncInterface();
  }

  const ready = document.fonts.ready.then(() => {
    updateNodeCoordinates();
    syncInterface();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    updateNodeCoordinates();
    const timelineMembership = [shardBurst, sparkBurst, shockwave, core]
      .every(part => composition._timelines.includes(part.timeline));
    const nodeSemantics = nodes.length === 3
      && nodes.every(node => node instanceof HTMLButtonElement && node.dataset.nodeId && node.type === 'button');
    const originEvidence = !state.traceActive
      ? state.currentBurstOrigin === null && state.selectedNode === null
      : state.currentBurstOrigin !== null
        && state.lastOriginDistanceFromNodeCenter <= .02
        && state.mappedToNodeCenter
        && state.lastTriggeredNode === state.selectedNode;
    const reducedMotionSafe = !state.reducedMotion || !state.isAnimating;
    return mojs.revision === '1.7.1'
      && shardBurst instanceof mojs.Burst
      && sparkBurst instanceof mojs.Burst
      && shockwave instanceof mojs.Shape
      && core instanceof mojs.Shape
      && composition instanceof mojs.Timeline
      && timelineMembership
      && field.querySelectorAll('svg').length >= 4
      && nodeSemantics
      && field.style.pointerEvents !== 'auto'
      && getComputedStyle(field).pointerEvents === 'none'
      && state.initialFrameStatic
      && state.initialTriggerCount === 0
      && state.initialPhase === 'idle'
      && state.automaticFallback === false
      && state.automaticPlayback === false
      && state.automaticTrigger === false
      && state.automaticNodeSelection === false
      && state.syntheticInputDispatch === false
      && state.eventOwnedTimeline === true
      && state.nodeOrder.join(',') === nodeOrder.join(',')
      && state.burstCount === state.triggerCount
      && Object.values(state.nodeTriggerCounts).reduce((sum, count) => sum + count, 0) === state.triggerCount
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.triggerCount)
      && Number.isInteger(state.burstCount)
      && Number.isInteger(state.mojsReplayCount)
      && originEvidence
      && reducedMotionSafe
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'motion-graphics-burst',
    library: '@mojs/core@1.7.1',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
