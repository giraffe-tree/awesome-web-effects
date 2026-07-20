import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#handoff-stage');
  const shell = document.querySelector('.handoff-shell');
  const nodes = [...document.querySelectorAll('.handoff-node')];
  const cursors = nodes.map(node => node.querySelector('.agent-cursor'));
  const sockets = [...document.querySelectorAll('.artifact-socket')];
  const artifactPanel = document.querySelector('#artifact-panel');
  const artifactKicker = document.querySelector('#artifact-kicker');
  const ownerState = document.querySelector('#owner-state');
  const artifactSummary = document.querySelector('#artifact-summary');
  const evidenceReceipt = document.querySelector('#evidence-receipt');
  const evidenceLabel = document.querySelector('#evidence-label');
  const evidenceValue = document.querySelector('#evidence-value');
  const evidenceSource = document.querySelector('#evidence-source');
  const status = document.querySelector('#handoff-status');
  const resetButton = document.querySelector('#reset-handoff');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const stageOrder = nodes.map(node => node.dataset.stage);
  const agentOrder = nodes.map(node => node.dataset.agent);
  const evidenceOrder = nodes.map(node => node.dataset.evidence);
  const handoffDuration = 760;

  const contentByStage = {
    discover: {
      agent: 'scout',
      evidence: 'interview-moments',
      kicker: 'Stage 01 · signal attached',
      owner: 'Scout owns evidence',
      summary: 'Customer language is attached before the team commits to a narrative direction.',
      label: 'Research evidence',
      value: '12 interview moments',
      source: 'Customer calls · 06:40'
    },
    compose: {
      agent: 'maker',
      evidence: 'narrative-v3',
      kicker: 'Stage 02 · artifact revised',
      owner: 'Maker owns draft',
      summary: 'The verified signal becomes one concise product story without losing source context.',
      label: 'Working artifact',
      value: 'Narrative direction · v3',
      source: 'Brief + research notes'
    },
    verify: {
      agent: 'critic',
      evidence: 'claim-checklist',
      kicker: 'Stage 03 · proof attached',
      owner: 'Critic owns release',
      summary: 'Every visible claim is checked against the brief before this artifact can ship.',
      label: 'Release evidence',
      value: '9 / 9 claims checked',
      source: 'QA checklist · passed'
    }
  };

  const state = {
    id: 'autonomous-agent-cursor-constellation',
    automaticFallback: false,
    automaticPlayback: false,
    automaticSelection: false,
    automaticTrigger: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    eventOwnedTimeline: true,
    controlsBuiltWithoutAutoplay: true,
    userInitiated: false,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard'],
    inputKind: 'none',
    inputCount: 0,
    lastInputTrusted: null,
    selectionCount: 0,
    animatedSelectionCount: 0,
    pointerSelectionCount: 0,
    keyboardSelectionCount: 0,
    focusMoveCount: 0,
    resetCount: 0,
    interruptionCount: 0,
    reducedMotionDirectCount: 0,
    reducedMotionSettleCount: 0,
    motionPlayCount: 0,
    motionCompletionCount: 0,
    artifactUpdateCount: 0,
    stageOrder: [...stageOrder],
    agentOrder: [...agentOrder],
    evidenceOrder: [...evidenceOrder],
    stageSelectionCounts: Object.fromEntries(stageOrder.map(id => [id, 0])),
    selectedStage: null,
    selectedAgent: null,
    selectedEvidence: null,
    previousStage: null,
    lastSelectionTarget: null,
    phase: 'idle',
    handoffActive: false,
    handoffProgress: 0,
    cursorTargets: {},
    activeCursorTargetError: null,
    motionControlCount: 0,
    layoutMeasureCount: 0,
    controlRebuildCount: 0,
    initialFrameStatic: true,
    initialSelectionCount: 0,
    initialPhase: 'idle',
    initialOwner: null,
    reducedMotion: reducedMotion.matches,
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let cursorControls = [];
  let panelControl;
  let receiptControl;
  let latestPointerKind = 'mouse';
  let animationFrame = 0;
  let resizeFrame = 0;
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

  function pauseAtStart(control) {
    if (!control) return;
    control.pause();
    control.time = 0;
  }

  function stopControls() {
    cursorControls.forEach(pauseAtStart);
    pauseAtStart(panelControl);
    pauseAtStart(receiptControl);
  }

  function updateActiveTargetError() {
    if (state.phase !== 'settled' || !state.selectedStage) {
      state.activeCursorTargetError = null;
      return;
    }
    if (state.activeCursorTargetError !== null) return;
    const index = stageOrder.indexOf(state.selectedStage);
    const mark = cursors[index]?.querySelector('svg');
    const socket = sockets.find(item => item.dataset.stage === state.selectedStage);
    if (!mark || !socket) {
      state.activeCursorTargetError = null;
      return;
    }
    const markRect = mark.getBoundingClientRect();
    const socketRect = socket.getBoundingClientRect();
    state.activeCursorTargetError = Number(Math.hypot(
      markRect.left + markRect.width / 2 - (socketRect.left + socketRect.width / 2),
      markRect.top + markRect.height / 2 - (socketRect.top + socketRect.height / 2)
    ).toFixed(2));
  }

  function syncInterface() {
    setDataset('phase', state.phase);
    setDataset('activeStage', state.selectedStage || 'none');
    setDataset('selectedAgent', state.selectedAgent || 'none');
    setDataset('selectedEvidence', state.selectedEvidence || 'none');
    setDataset('selectionCount', state.selectionCount);

    nodes.forEach((node, index) => {
      const active = node.dataset.stage === state.selectedStage;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-pressed', String(active));
      node.tabIndex = active || (!state.selectedStage && index === 0) ? 0 : -1;
      cursors[index].dataset.cursorState = active ? state.phase : 'parked';
    });
    resetButton.disabled = !state.selectedStage;
    updateActiveTargetError();

    const statusLabel = !state.selectedStage
      ? 'Awaiting a real owner selection'
      : state.phase === 'handoff'
        ? `${state.selectedAgent} · carrying ${state.selectedEvidence}`
        : `${state.selectedAgent} → ${state.selectedEvidence} attached`;
    if (status.textContent !== statusLabel) status.textContent = statusLabel;
  }

  function applyStageContent(stageId) {
    const content = contentByStage[stageId];
    artifactPanel.dataset.owner = content?.agent || 'none';
    artifactPanel.dataset.evidence = content?.evidence || 'none';
    artifactKicker.textContent = content?.kicker || 'Shared artifact · awaiting handoff';
    ownerState.textContent = content?.owner || 'No owner';
    artifactSummary.textContent = content?.summary || 'Select a checkpoint to attach its owner and evidence to this working brief.';
    evidenceLabel.textContent = content?.label || 'Evidence packet';
    evidenceValue.textContent = content?.value || 'Choose a checkpoint';
    evidenceSource.textContent = content?.source || 'Not attached';
  }

  function buildMotionControls() {
    cursorControls.forEach(control => control.cancel());
    panelControl?.cancel();
    receiptControl?.cancel();
    cursors.forEach(cursor => { cursor.style.transform = ''; });
    artifactPanel.style.transform = '';
    evidenceReceipt.style.transform = '';
    evidenceReceipt.style.opacity = '';

    const arcOffsets = [-15, 12, -11];
    state.cursorTargets = {};
    state.layoutMeasureCount += 1;
    cursorControls = cursors.map((cursor, index) => {
      const mark = cursor.querySelector('svg');
      const socket = sockets.find(item => item.dataset.stage === stageOrder[index]);
      const markRect = mark.getBoundingClientRect();
      const socketRect = socket.getBoundingClientRect();
      const dx = socketRect.left + socketRect.width / 2 - (markRect.left + markRect.width / 2);
      const dy = socketRect.top + socketRect.height / 2 - (markRect.top + markRect.height / 2);
      state.cursorTargets[stageOrder[index]] = {
        x: Number(dx.toFixed(2)),
        y: Number(dy.toFixed(2)),
        arc: arcOffsets[index]
      };
      return animate(cursor, {
        x: [0, dx * .55, dx],
        y: [0, dy + arcOffsets[index], dy],
        rotate: [0, arcOffsets[index] < 0 ? -7 : 7, 0],
        scale: [1, 1.08, 1]
      }, {
        duration: handoffDuration / 1000,
        times: [0, .57, 1],
        ease: [.22, 1, .36, 1],
        autoplay: false
      });
    });

    panelControl = animate(artifactPanel, {
      scale: [1, 1.012, 1],
      y: [0, -2, 0]
    }, {
      duration: .64,
      times: [0, .5, 1],
      ease: [.22, 1, .36, 1],
      autoplay: false
    });
    receiptControl = animate(evidenceReceipt, {
      opacity: [1, .42, 1],
      x: [0, 5, 0]
    }, {
      duration: .58,
      times: [0, .34, 1],
      ease: 'easeOut',
      autoplay: false
    });
    stopControls();
    state.motionControlCount = cursorControls.length + 2;
    state.controlRebuildCount += 1;

    if (state.selectedStage) {
      const index = stageOrder.indexOf(state.selectedStage);
      cursorControls[index].time = cursorControls[index].duration;
      state.phase = 'settled';
      state.handoffActive = false;
      state.handoffProgress = 1;
    }
    syncInterface();
  }

  function finishHandoff(token) {
    if (token !== runToken) return;
    animationFrame = 0;
    const index = stageOrder.indexOf(state.selectedStage);
    cursorControls[index].time = cursorControls[index].duration;
    state.motionCompletionCount += 1;
    state.phase = 'settled';
    state.handoffActive = false;
    state.handoffProgress = 1;
    state.activeCursorTargetError = null;
    syncInterface();
  }

  function trackHandoff(startTime, token) {
    const tick = now => {
      if (token !== runToken) return;
      const progress = Math.min(1, (now - startTime) / handoffDuration);
      state.handoffProgress = Number(progress.toFixed(3));
      syncInterface();
      if (progress < 1) animationFrame = requestAnimationFrame(tick);
      else finishHandoff(token);
    };
    animationFrame = requestAnimationFrame(tick);
  }

  function selectStage(node, inputKind, trusted, selectionTarget) {
    if (!nodes.includes(node)) return;
    recordInput(inputKind, trusted);
    if (state.handoffActive) state.interruptionCount += 1;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    runToken += 1;
    const token = runToken;
    stopControls();

    const stageId = node.dataset.stage;
    const index = stageOrder.indexOf(stageId);
    state.previousStage = state.selectedStage;
    state.selectedStage = stageId;
    state.selectedAgent = node.dataset.agent;
    state.selectedEvidence = node.dataset.evidence;
    state.lastSelectionTarget = selectionTarget;
    state.selectionCount += 1;
    state.artifactUpdateCount += 1;
    state.stageSelectionCounts[stageId] += 1;
    if (inputKind === 'keyboard') state.keyboardSelectionCount += 1;
    else state.pointerSelectionCount += 1;
    applyStageContent(stageId);
    node.focus({ preventScroll: true });

    if (state.reducedMotion) {
      cursorControls[index].time = cursorControls[index].duration;
      state.reducedMotionDirectCount += 1;
      state.phase = 'settled';
      state.handoffActive = false;
      state.handoffProgress = 1;
      syncInterface();
      return;
    }

    state.animatedSelectionCount += 1;
    state.motionPlayCount += 3;
    state.phase = 'handoff';
    state.handoffActive = true;
    state.handoffProgress = 0;
    syncInterface();
    cursorControls[index].play();
    panelControl.play();
    receiptControl.play();
    trackHandoff(performance.now(), token);
  }

  function resetHandoff(inputKind, trusted) {
    recordInput(inputKind, trusted);
    if (state.handoffActive) state.interruptionCount += 1;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    runToken += 1;
    stopControls();
    state.resetCount += 1;
    state.previousStage = state.selectedStage;
    state.selectedStage = null;
    state.selectedAgent = null;
    state.selectedEvidence = null;
    state.lastSelectionTarget = null;
    state.phase = 'idle';
    state.handoffActive = false;
    state.handoffProgress = 0;
    applyStageContent(null);
    nodes[0].focus({ preventScroll: true });
    syncInterface();
  }

  function moveFocus(index, trusted) {
    recordInput('keyboard', trusted);
    state.focusMoveCount += 1;
    nodes[(index + nodes.length) % nodes.length].focus({ preventScroll: true });
  }

  function inputKindFromClick(event) {
    return event.detail === 0 ? 'keyboard' : latestPointerKind;
  }

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });

  nodes.forEach((node, index) => {
    node.addEventListener('click', event => {
      selectStage(node, inputKindFromClick(event), event.isTrusted, `stage-${node.dataset.stage}`);
    });
    node.addEventListener('keydown', event => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat) return;
      const nextIndex = event.key === 'Home' ? 0
        : event.key === 'End' ? nodes.length - 1
          : index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1);
      moveFocus(nextIndex, event.isTrusted);
    });
  });

  resetButton.addEventListener('click', event => {
    resetHandoff(inputKindFromClick(event), event.isTrusted);
  });

  stage.addEventListener('keydown', event => {
    if (!['Escape', 'r', 'R'].includes(event.key) || resetButton.disabled) return;
    event.preventDefault();
    if (!event.repeat) resetHandoff('keyboard', event.isTrusted);
  });

  addEventListener('resize', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      runToken += 1;
      buildMotionControls();
    });
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.handoffActive && state.selectedStage) {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      runToken += 1;
      stopControls();
      const index = stageOrder.indexOf(state.selectedStage);
      cursorControls[index].time = cursorControls[index].duration;
      state.reducedMotionSettleCount += 1;
      state.phase = 'settled';
      state.handoffActive = false;
      state.handoffProgress = 1;
    }
    syncInterface();
  });

  function render() {
    state.renderCount += 1;
    syncInterface();
  }

  buildMotionControls();
  const ready = document.fonts.ready.then(() => buildMotionControls());

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const nodeSemantics = nodes.length === 3 && nodes.every(node =>
      node instanceof HTMLButtonElement
      && node.type === 'button'
      && node.dataset.stage
      && node.dataset.agent
      && node.dataset.evidence
    );
    const controlEvidence = cursorControls.length === 3
      && [panelControl, receiptControl, ...cursorControls].every(control =>
        typeof control.play === 'function'
        && typeof control.pause === 'function'
        && typeof control.cancel === 'function'
        && control.duration >= .5
      );
    const selectedIndex = state.selectedStage ? stageOrder.indexOf(state.selectedStage) : -1;
    const selectionEvidence = selectedIndex < 0
      ? state.selectedAgent === null
        && state.selectedEvidence === null
        && artifactPanel.dataset.owner === 'none'
        && artifactPanel.dataset.evidence === 'none'
        && state.phase === 'idle'
        && state.handoffActive === false
      : selectedIndex >= 0
        && nodes[selectedIndex].dataset.agent === state.selectedAgent
        && nodes[selectedIndex].dataset.evidence === state.selectedEvidence
        && artifactPanel.dataset.owner === state.selectedAgent
        && artifactPanel.dataset.evidence === state.selectedEvidence
        && nodes.filter(node => node.getAttribute('aria-pressed') === 'true').length === 1;
    const countEvidence = state.selectionCount === state.animatedSelectionCount + state.reducedMotionDirectCount
      && state.pointerSelectionCount + state.keyboardSelectionCount === state.selectionCount
      && Object.values(state.stageSelectionCounts).reduce((sum, count) => sum + count, 0) === state.selectionCount
      && state.motionPlayCount === state.animatedSelectionCount * 3
      && state.motionCompletionCount <= state.animatedSelectionCount
      && state.artifactUpdateCount === state.selectionCount
      && state.inputCount === state.selectionCount + state.resetCount + state.focusMoveCount;
    const endpointEvidence = state.phase !== 'settled'
      || Number.isFinite(state.activeCursorTargetError) && state.activeCursorTargetError <= 2.5;
    const reducedMotionSafe = !state.reducedMotion || !state.handoffActive;
    return typeof animate === 'function'
      && nodeSemantics
      && sockets.length === 3
      && controlEvidence
      && shell instanceof HTMLElement
      && artifactPanel instanceof HTMLElement
      && stageOrder.join(',') === 'discover,compose,verify'
      && agentOrder.join(',') === 'scout,maker,critic'
      && evidenceOrder.join(',') === 'interview-moments,narrative-v3,claim-checklist'
      && Object.keys(state.cursorTargets).join(',') === stageOrder.join(',')
      && Object.values(state.cursorTargets).every(target =>
        Number.isFinite(target.x) && Number.isFinite(target.y) && Number.isFinite(target.arc)
      )
      && state.motionControlCount === 5
      && state.initialFrameStatic
      && state.initialSelectionCount === 0
      && state.initialPhase === 'idle'
      && state.initialOwner === null
      && state.automaticFallback === false
      && state.automaticPlayback === false
      && state.automaticSelection === false
      && state.automaticTrigger === false
      && state.syntheticInputDispatch === false
      && state.captureClockDriven === false
      && state.eventOwnedTimeline === true
      && state.controlsBuiltWithoutAutoplay === true
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.selectionCount)
      && Number.isInteger(state.resetCount)
      && countEvidence
      && selectionEvidence
      && endpointEvidence
      && reducedMotionSafe
      && state.layoutMeasureCount >= 1
      && state.controlRebuildCount >= 1
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'autonomous-agent-cursor-constellation',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
