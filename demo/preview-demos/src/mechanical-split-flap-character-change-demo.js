import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#flap-stage');
  const board = document.querySelector('#flap-board');
  const statusOutput = document.querySelector('#status-output');
  const mechanismReadout = document.querySelector('#mechanism-readout');
  const cadenceTrack = document.querySelector('#cadence-track');
  const advanceButton = document.querySelector('#advance-button');
  const resetButton = document.querySelector('#reset-button');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const statuses = [
    { key: 'on-time', label: 'ON TIME', characters: 'ON TIME ' },
    { key: 'boarding', label: 'BOARDING', characters: 'BOARDING' },
    { key: 'last-call', label: 'LAST CALL', characters: 'LASTCALL' },
    { key: 'departed', label: 'DEPARTED', characters: 'DEPARTED' }
  ];
  const characterCount = statuses[0].characters.length;
  const cadenceMs = 75;
  const upperDurationMs = 150;
  const lowerDurationMs = 170;
  const lowerOffsetMs = 125;
  const plannedOrder = Array.from({ length: characterCount }, (_, index) => index);

  const state = {
    id: 'mechanical-split-flap-character-change',
    task: 'railway-operator-departure-status-update',
    automaticFallback: false,
    automaticCycle: false,
    automaticPlayback: false,
    captureClockDriven: false,
    syntheticInputDispatch: false,
    userRequestRequired: true,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard'],
    initialFrameStatic: true,
    initialStatusIndex: 0,
    initialStatus: statuses[0].characters,
    initialInputCount: 0,
    currentIndex: 0,
    targetIndex: null,
    currentStatus: statuses[0].characters,
    requestedStatus: null,
    phase: 'idle',
    transitionActive: false,
    transitionGeneration: 0,
    transitionRequestCount: 0,
    completedTransitionCount: 0,
    interruptedTransitionCount: 0,
    forcedSettlementCount: 0,
    resetRequestCount: 0,
    activeTransitionCount: 0,
    maximumConcurrentTransitions: 0,
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    clickRequestCount: 0,
    boardRequestCount: 0,
    keyboardRequestCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastRequestSource: 'initial',
    cadenceMs,
    upperDurationMs,
    lowerDurationMs,
    lowerOffsetMs,
    plannedLandingOrder: [...plannedOrder],
    landingOrder: [],
    settledCharacterCount: characterCount,
    characterCount,
    motionControlCount: 0,
    activeMotionControlCount: 0,
    motionPlayCallCount: 0,
    controlRebuildCount: 0,
    controlCancellationCount: 0,
    controlsBuiltWithoutAutoplay: true,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionAppliedCount: 0,
    renderCount: 0,
    renderIgnoresPreviewClock: true,
    characterEvidence: []
  };

  let controls = [];
  let phaseTimers = [];
  let latestPointerKind = 'mouse';

  const visibleCharacter = character => character === ' ' ? '\u00a0' : character;
  const normalizedCharacter = character => character === '\u00a0' ? ' ' : character;
  const nextIndexFrom = index => (index + 1) % statuses.length;

  const cells = Array.from({ length: characterCount }, (_, index) => {
    const character = statuses[0].characters[index];
    const cell = document.createElement('div');
    cell.className = 'flap';
    cell.dataset.column = String(index + 1).padStart(2, '0');
    cell.dataset.phase = 'idle';
    cell.dataset.currentChar = character;
    cell.dataset.targetChar = character;
    cell.setAttribute('aria-hidden', 'true');
    cell.innerHTML = `
      <span class="flap-panel flap-panel-top"><b>${visibleCharacter(character)}</b></span>
      <span class="flap-panel flap-panel-bottom"><b>${visibleCharacter(character)}</b></span>
      <span class="flap-leaf flap-leaf-out"><b>${visibleCharacter(character)}</b></span>
      <span class="flap-leaf flap-leaf-in"><b>${visibleCharacter(character)}</b></span>
      <i class="flap-midline"></i>
    `;
    board.append(cell);
    return {
      index,
      cell,
      top: cell.querySelector('.flap-panel-top b'),
      bottom: cell.querySelector('.flap-panel-bottom b'),
      outgoing: cell.querySelector('.flap-leaf-out'),
      outgoingGlyph: cell.querySelector('.flap-leaf-out b'),
      incoming: cell.querySelector('.flap-leaf-in'),
      incomingGlyph: cell.querySelector('.flap-leaf-in b'),
      current: character,
      target: character,
      phase: 'idle',
      settleOrdinal: null
    };
  });

  const cadenceTicks = plannedOrder.map(index => {
    const tick = document.createElement('i');
    tick.dataset.column = String(index + 1);
    cadenceTrack.append(tick);
    return tick;
  });

  function setGlyph(element, character) {
    element.textContent = visibleCharacter(character);
  }

  function setCellPhase(model, phase) {
    model.phase = phase;
    model.cell.dataset.phase = phase;
    state.characterEvidence[model.index].phase = phase;
  }

  function setCellCharacters(model, current, target = current) {
    model.current = current;
    model.target = target;
    model.cell.dataset.currentChar = current;
    model.cell.dataset.targetChar = target;
    setGlyph(model.top, current);
    setGlyph(model.bottom, current);
    setGlyph(model.outgoingGlyph, current);
    setGlyph(model.incomingGlyph, target);
    const evidence = state.characterEvidence[model.index];
    evidence.current = current;
    evidence.target = target;
  }

  state.characterEvidence = cells.map(model => ({
    index: model.index,
    column: model.index + 1,
    current: model.current,
    target: model.target,
    phase: model.phase,
    scheduledDelayMs: model.index * cadenceMs,
    upperDurationMs,
    lowerDurationMs,
    settleOrdinal: null,
    generation: 0
  }));

  function cancelPhaseTimers() {
    phaseTimers.forEach(timer => clearTimeout(timer));
    phaseTimers = [];
  }

  function cancelControls({ countCancellation = true } = {}) {
    if (controls.length && countCancellation) state.controlCancellationCount += controls.length;
    controls.forEach(control => control.cancel());
    controls = [];
    state.motionControlCount = 0;
    state.activeMotionControlCount = 0;
  }

  function buildIdleControls() {
    cancelControls({ countCancellation: false });
    controls = cells.flatMap(model => {
      model.outgoing.style.transform = '';
      model.outgoing.style.opacity = '';
      model.incoming.style.transform = '';
      model.incoming.style.opacity = '';
      const outgoingControl = animate(model.outgoing, {
        rotateX: [0, -92],
        opacity: [1, 1, 0]
      }, {
        duration: upperDurationMs / 1000,
        ease: [.32, 0, .68, 1],
        autoplay: false
      });
      const incomingControl = animate(model.incoming, {
        rotateX: [92, 0],
        opacity: [0, 1, 1]
      }, {
        duration: lowerDurationMs / 1000,
        ease: [.16, .84, .3, 1],
        autoplay: false
      });
      outgoingControl.pause();
      incomingControl.pause();
      outgoingControl.time = 0;
      incomingControl.time = 0;
      return [outgoingControl, incomingControl];
    });
    state.motionControlCount = controls.length;
    state.activeMotionControlCount = 0;
    state.controlRebuildCount += 1;
  }

  function setBoardStatus(statusIndex, phase = 'idle') {
    const status = statuses[statusIndex];
    cells.forEach((model, index) => {
      setCellCharacters(model, status.characters[index]);
      model.settleOrdinal = null;
      state.characterEvidence[index].settleOrdinal = null;
      setCellPhase(model, phase);
    });
    state.currentIndex = statusIndex;
    state.currentStatus = status.characters;
    state.settledCharacterCount = characterCount;
    cadenceTicks.forEach(tick => tick.classList.toggle('is-landed', phase === 'landed'));
  }

  function recordInput(kind, trusted) {
    state.inputCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = trusted;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
  }

  function displayLabel(statusIndex) {
    return statuses[statusIndex].label;
  }

  function syncInterface() {
    const current = statuses[state.currentIndex];
    const nextIndex = nextIndexFrom(state.transitionActive ? state.targetIndex : state.currentIndex);
    const next = statuses[nextIndex];
    stage.dataset.statusKey = current.key;
    stage.dataset.statusIndex = String(state.currentIndex);
    stage.dataset.targetIndex = state.targetIndex === null ? 'none' : String(state.targetIndex);
    stage.dataset.phase = state.phase;
    stage.dataset.requestCount = String(state.transitionRequestCount);
    stage.dataset.interruptCount = String(state.interruptedTransitionCount);
    stage.dataset.settledCharacters = String(state.settledCharacterCount);
    stage.dataset.lastSource = state.lastRequestSource;
    statusOutput.textContent = state.transitionActive
      ? `${displayLabel(state.currentIndex)} → ${displayLabel(state.targetIndex)}`
      : current.label;
    board.setAttribute('aria-label', `Advance departure status from ${displayLabel(state.transitionActive ? state.targetIndex : state.currentIndex)} to ${next.label}`);
    advanceButton.setAttribute('aria-label', `Advance status to ${next.label}`);
    mechanismReadout.textContent = state.transitionActive
      ? `Updating · ${state.settledCharacterCount}/${characterCount} characters landed`
      : state.lastRequestSource === 'initial'
        ? 'Ready · operator controlled'
        : `${current.label} · update settled`;
  }

  function settleCharacter(model, targetCharacter, generation) {
    if (generation !== state.transitionGeneration || !state.transitionActive) return;
    setCellCharacters(model, targetCharacter);
    model.settleOrdinal = state.landingOrder.length;
    state.characterEvidence[model.index].settleOrdinal = model.settleOrdinal;
    state.landingOrder.push(model.index);
    state.settledCharacterCount = state.landingOrder.length;
    setCellPhase(model, 'landed');
    cadenceTicks[model.index].classList.add('is-landed');
    syncInterface();
  }

  function finishTransition(generation) {
    if (generation !== state.transitionGeneration || !state.transitionActive) return;
    const completedTarget = state.targetIndex;
    state.currentIndex = completedTarget;
    state.currentStatus = statuses[completedTarget].characters;
    state.targetIndex = null;
    state.requestedStatus = null;
    state.transitionActive = false;
    state.activeTransitionCount = 0;
    state.activeMotionControlCount = 0;
    state.completedTransitionCount += 1;
    state.phase = 'settled';
    cancelPhaseTimers();
    setBoardStatus(completedTarget, 'landed');
    buildIdleControls();
    syncInterface();
  }

  function forceSettleActive(reason) {
    if (!state.transitionActive) return;
    const interruptedTarget = state.targetIndex;
    state.transitionGeneration += 1;
    state.interruptedTransitionCount += 1;
    state.forcedSettlementCount += 1;
    state.phase = reason === 'reset' ? 'resetting' : 'interrupted';
    cancelPhaseTimers();
    cancelControls();
    setBoardStatus(interruptedTarget, 'landed');
    state.targetIndex = null;
    state.requestedStatus = null;
    state.transitionActive = false;
    state.activeTransitionCount = 0;
  }

  function buildTransitionControls(targetIndex, generation) {
    cancelControls();
    const target = statuses[targetIndex];
    const completionPromises = [];
    controls = cells.flatMap(model => {
      const targetCharacter = target.characters[model.index];
      model.target = targetCharacter;
      model.cell.dataset.targetChar = targetCharacter;
      setGlyph(model.outgoingGlyph, model.current);
      setGlyph(model.incomingGlyph, targetCharacter);
      setGlyph(model.top, targetCharacter);
      setGlyph(model.bottom, model.current);
      model.settleOrdinal = null;
      const evidence = state.characterEvidence[model.index];
      evidence.target = targetCharacter;
      evidence.phase = 'queued';
      evidence.settleOrdinal = null;
      evidence.generation = generation;
      setCellPhase(model, 'queued');
      const delaySeconds = model.index * cadenceMs / 1000;
      const outgoingControl = animate(model.outgoing, {
        rotateX: [0, -92],
        opacity: [1, 1, 0]
      }, {
        duration: upperDurationMs / 1000,
        delay: delaySeconds,
        ease: [.32, 0, .68, 1],
        autoplay: false
      });
      const incomingControl = animate(model.incoming, {
        rotateX: [92, 0],
        opacity: [0, 1, 1]
      }, {
        duration: lowerDurationMs / 1000,
        delay: delaySeconds + lowerOffsetMs / 1000,
        ease: [.16, .84, .3, 1],
        autoplay: false
      });
      outgoingControl.pause();
      incomingControl.pause();
      outgoingControl.time = 0;
      incomingControl.time = 0;
      const upperTimer = setTimeout(() => {
        if (generation === state.transitionGeneration && state.transitionActive) setCellPhase(model, 'upper');
      }, model.index * cadenceMs);
      const lowerTimer = setTimeout(() => {
        if (generation === state.transitionGeneration && state.transitionActive) setCellPhase(model, 'lower');
      }, model.index * cadenceMs + lowerOffsetMs);
      phaseTimers.push(upperTimer, lowerTimer);
      const settled = incomingControl.finished
        .then(() => settleCharacter(model, targetCharacter, generation))
        .catch(() => undefined);
      completionPromises.push(settled);
      return [outgoingControl, incomingControl];
    });
    state.motionControlCount = controls.length;
    state.activeMotionControlCount = controls.length;
    controls.forEach(control => {
      control.play();
      state.motionPlayCallCount += 1;
    });
    Promise.all(completionPromises)
      .then(() => finishTransition(generation))
      .catch(markPreviewFailure);
  }

  function requestNext(source, inputKind, trusted) {
    recordInput(inputKind, trusted);
    state.transitionRequestCount += 1;
    if (source === 'board') state.boardRequestCount += 1;
    else if (inputKind === 'keyboard') state.keyboardRequestCount += 1;
    else state.clickRequestCount += 1;
    if (state.transitionActive) forceSettleActive('interrupt');
    const targetIndex = nextIndexFrom(state.currentIndex);
    state.targetIndex = targetIndex;
    state.requestedStatus = statuses[targetIndex].characters;
    state.transitionActive = true;
    state.activeTransitionCount = 1;
    state.maximumConcurrentTransitions = Math.max(state.maximumConcurrentTransitions, state.activeTransitionCount);
    state.phase = reducedMotionQuery.matches ? 'reduced-motion-settle' : 'flipping';
    state.lastRequestSource = source;
    state.landingOrder = [];
    state.settledCharacterCount = 0;
    cadenceTicks.forEach(tick => tick.classList.remove('is-landed'));
    const generation = state.transitionGeneration + 1;
    state.transitionGeneration = generation;

    if (reducedMotionQuery.matches) {
      state.reducedMotionAppliedCount += 1;
      state.landingOrder = [...plannedOrder];
      state.settledCharacterCount = characterCount;
      state.characterEvidence.forEach((evidence, index) => {
        evidence.target = statuses[targetIndex].characters[index];
        evidence.settleOrdinal = index;
        evidence.generation = generation;
      });
      setBoardStatus(targetIndex, 'landed');
      state.targetIndex = null;
      state.requestedStatus = null;
      state.transitionActive = false;
      state.activeTransitionCount = 0;
      state.completedTransitionCount += 1;
      state.phase = 'settled';
      buildIdleControls();
      syncInterface();
      return;
    }

    buildTransitionControls(targetIndex, generation);
    syncInterface();
  }

  function resetStatus(source, inputKind, trusted) {
    recordInput(inputKind, trusted);
    state.resetRequestCount += 1;
    state.lastRequestSource = source;
    if (state.transitionActive) forceSettleActive('reset');
    state.transitionGeneration += 1;
    cancelPhaseTimers();
    cancelControls();
    state.targetIndex = null;
    state.requestedStatus = null;
    state.transitionActive = false;
    state.activeTransitionCount = 0;
    state.landingOrder = [];
    state.phase = 'reset';
    setBoardStatus(0, 'idle');
    buildIdleControls();
    syncInterface();
  }

  function inputKindFromClick(event) {
    return event.detail === 0 ? 'keyboard' : latestPointerKind;
  }

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'mouse';
  });

  board.addEventListener('click', event => {
    requestNext('board', inputKindFromClick(event), event.isTrusted);
  });

  advanceButton.addEventListener('click', event => {
    requestNext('advance-button', inputKindFromClick(event), event.isTrusted);
  });

  resetButton.addEventListener('click', event => {
    resetStatus('reset-button', inputKindFromClick(event), event.isTrusted);
  });

  board.addEventListener('keydown', event => {
    const advanceKeys = ['Enter', ' ', 'ArrowRight', 'ArrowDown', 'n', 'N'];
    const resetKeys = ['Home', 'Escape', 'r', 'R'];
    if (advanceKeys.includes(event.key)) {
      event.preventDefault();
      if (!event.repeat) requestNext(`keyboard-${event.key === ' ' ? 'Space' : event.key}`, 'keyboard', event.isTrusted);
    } else if (resetKeys.includes(event.key)) {
      event.preventDefault();
      if (!event.repeat) resetStatus(`keyboard-${event.key}`, 'keyboard', event.isTrusted);
    }
  });

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.transitionActive) {
      const targetIndex = state.targetIndex;
      forceSettleActive('reduced-motion');
      state.currentIndex = targetIndex;
      state.currentStatus = statuses[targetIndex].characters;
      state.phase = 'settled';
      state.reducedMotionAppliedCount += 1;
      buildIdleControls();
    }
    syncInterface();
  });

  addEventListener('beforeunload', () => {
    state.transitionGeneration += 1;
    cancelPhaseTimers();
    cancelControls({ countCancellation: false });
  }, { once: true });

  function render() {
    state.renderCount += 1;
    syncInterface();
  }

  setBoardStatus(0, 'idle');
  buildIdleControls();
  syncInterface();

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const statusIntegrity = statuses.every(status => status.characters.length === characterCount)
      && statuses.every(status => /^[A-Z ]{8}$/.test(status.characters));
    const characterIntegrity = cells.every((model, index) => {
      const evidence = state.characterEvidence[index];
      const inFlight = ['queued', 'upper', 'lower'].includes(model.phase);
      const expectedTop = inFlight ? model.target : model.current;
      return model.index === index
        && Number(model.cell.dataset.column) === index + 1
        && model.cell.querySelectorAll('.flap-panel').length === 2
        && model.cell.querySelectorAll('.flap-leaf').length === 2
        && model.cell.querySelector('.flap-midline') instanceof HTMLElement
        && normalizedCharacter(model.top.textContent) === expectedTop
        && normalizedCharacter(model.bottom.textContent) === model.current
        && normalizedCharacter(model.outgoingGlyph.textContent) === model.current
        && normalizedCharacter(model.incomingGlyph.textContent) === model.target
        && model.cell.dataset.currentChar === model.current
        && model.cell.dataset.targetChar === model.target
        && evidence.index === index
        && evidence.column === index + 1
        && evidence.scheduledDelayMs === index * cadenceMs
        && evidence.upperDurationMs === upperDurationMs
        && evidence.lowerDurationMs === lowerDurationMs;
    });
    const idleControlIntegrity = state.transitionActive || controls.every((control, index) => {
      const isOutgoing = index % 2 === 0;
      return control.duration === (isOutgoing ? upperDurationMs : lowerDurationMs) / 1000
        && typeof control.play === 'function'
        && typeof control.pause === 'function'
        && typeof control.cancel === 'function';
    });
    const transitionIntegrity = !state.transitionActive || (
      state.targetIndex !== null
      && state.activeTransitionCount === 1
      && state.activeMotionControlCount === characterCount * 2
      && state.landingOrder.every((value, index, order) => value === plannedOrder[index] && (index === 0 || order[index - 1] < value))
      && state.settledCharacterCount === state.landingOrder.length
    );
    const inputIntegrity = state.inputCount === state.pointerInputCount + state.keyboardInputCount
      && state.inputCount === state.transitionRequestCount + state.resetRequestCount
      && state.transitionRequestCount === state.clickRequestCount + state.boardRequestCount + state.keyboardRequestCount;
    const initialIntegrity = state.transitionRequestCount > 0 || (
      state.currentIndex === state.initialStatusIndex
      && state.currentStatus === state.initialStatus
      && state.phase === 'idle'
      && state.inputCount === state.initialInputCount
      && cells.every((model, index) => model.current === statuses[0].characters[index] && model.phase === 'idle')
    );
    return typeof animate === 'function'
      && stage.dataset.previewMechanism === 'motion-character-split-flap'
      && board.getAttribute('role') === 'button'
      && board.tabIndex === 0
      && advanceButton instanceof HTMLButtonElement
      && resetButton instanceof HTMLButtonElement
      && characterCount === 8
      && cells.length === characterCount
      && cadenceTicks.length === characterCount
      && controls.length === characterCount * 2
      && state.motionControlCount === characterCount * 2
      && state.controlsBuiltWithoutAutoplay
      && statusIntegrity
      && characterIntegrity
      && idleControlIntegrity
      && transitionIntegrity
      && inputIntegrity
      && initialIntegrity
      && state.maximumConcurrentTransitions <= 1
      && state.interruptedTransitionCount === state.forcedSettlementCount
      && state.automaticFallback === false
      && state.automaticCycle === false
      && state.automaticPlayback === false
      && state.captureClockDriven === false
      && state.syntheticInputDispatch === false
      && state.userRequestRequired === true
      && state.initialFrameStatic === true
      && state.renderIgnoresPreviewClock === true
      && Number.isInteger(state.transitionRequestCount)
      && Number.isInteger(state.interruptedTransitionCount)
      && Number.isInteger(state.resetRequestCount)
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'mechanical-split-flap-character-change',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
