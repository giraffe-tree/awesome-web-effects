import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#voice-stage');
  const shell = document.querySelector('#voice-shell');
  const panel = document.querySelector('#assistant-panel');
  const vector = document.querySelector('#agent-vector');
  const core = document.querySelector('#machine-core');
  const orbit = document.querySelector('#machine-orbit');
  const waves = document.querySelector('#listening-waves');
  const rays = document.querySelector('#response-rays');
  const shape = document.querySelector('#core-shape');
  const stateName = document.querySelector('#state-name');
  const stateIndex = document.querySelector('#state-index');
  const inputState = document.querySelector('#input-state');
  const stateDescription = document.querySelector('#state-description');
  const stateSegments = [...document.querySelectorAll('.state-segment')];
  const transcriptCard = document.querySelector('#transcript-card');
  const transcriptLabel = document.querySelector('#transcript-label');
  const transcriptText = document.querySelector('#transcript-text');
  const transcriptMeta = document.querySelector('#transcript-meta');
  const talkButton = document.querySelector('#talk-button');
  const confirmButton = document.querySelector('#confirm-button');
  const resetButton = document.querySelector('#reset-button');
  const privacyState = document.querySelector('.privacy-state');
  const scenePanel = document.querySelector('#scene-panel');
  const sceneGlow = document.querySelector('#scene-glow');
  const sceneStatus = document.querySelector('#scene-status');
  const sceneReadingValue = document.querySelector('#scene-reading-value');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !shell || !panel || !vector || !core || !orbit || !waves || !rays || !shape || !stateName || !stateIndex || !inputState || !stateDescription || stateSegments.length !== 4 || !transcriptCard || !transcriptLabel || !transcriptText || !transcriptMeta || !talkButton || !confirmButton || !resetButton || !privacyState || !scenePanel || !sceneGlow || !sceneStatus || !sceneReadingValue) {
    throw new Error('Voice assistant state-machine DOM is incomplete');
  }

  const command = 'Set reading lights to focus.';
  const stateOrder = ['ready', 'listening', 'review', 'applied'];
  const stateConfig = {
    ready: {
      color: '#5268e8',
      label: 'Ready',
      description: 'The room agent is available, but no microphone or scene action is active.',
      path: 'M60 27C80 27 95 42 95 60S80 93 60 93 25 78 25 60 40 27 60 27Z',
    },
    listening: {
      color: '#2d9d7b',
      label: 'Listening',
      description: 'Audio stays local and is captured only while the control is held.',
      path: 'M60 20C84 20 102 38 102 60S84 100 60 100 18 82 18 60 36 20 60 20Z',
    },
    review: {
      color: '#6b5bc2',
      label: 'Review',
      description: 'The command is transcribed, but the room remains unchanged until confirmation.',
      path: 'M60 32C83 32 98 44 98 60S83 87 60 87 22 76 22 60 37 32 60 32Z',
    },
    applied: {
      color: '#ef7058',
      label: 'Applied',
      description: 'The reading fixture resolves to a warm 40% scene after explicit approval.',
      path: 'M60 24C83 24 98 41 98 60S83 96 60 96 22 79 22 60 37 24 60 24Z',
    },
  };

  const legalTransitions = new Set([
    'ready>listening',
    'listening>review',
    'listening>ready',
    'review>listening',
    'review>applied',
    'review>ready',
    'applied>listening',
    'applied>ready',
  ]);

  const counterKeys = [
    'inputCount',
    'pointerInputCount',
    'keyboardInputCount',
    'touchInputCount',
    'pressStartCount',
    'captureCompleteCount',
    'captureCancelCount',
    'confirmCount',
    'resetButtonCount',
    'escapeResetCount',
    'resetCount',
    'transitionCount',
    'motionStartCount',
    'motionCompleteCount',
    'motionCancelCount',
    'reducedMotionDirectCount',
    'motionRevision',
    'renderCount',
  ];

  const state = {
    id: 'interactive-vector-state-machine',
    automaticStateCycle: false,
    automaticRehearsal: false,
    previewClockDriven: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    phase: 'ready',
    stateIndex: 0,
    transcript: null,
    appliedScene: false,
    activeInput: false,
    activeInputKind: null,
    holdDurationMs: 0,
    lastTransition: null,
    transitionHistory: [],
    animationActive: false,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    touchInputCount: 0,
    pressStartCount: 0,
    captureCompleteCount: 0,
    captureCancelCount: 0,
    confirmCount: 0,
    resetButtonCount: 0,
    escapeResetCount: 0,
    resetCount: 0,
    transitionCount: 0,
    motionStartCount: 0,
    motionCompleteCount: 0,
    motionCancelCount: 0,
    reducedMotionDirectCount: 0,
    motionRevision: 0,
    renderCount: 0,
    initialStaticVerified: false,
    reducedMotion: reducedMotion.matches,
    lastTrustedEvent: 'none',
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let motions = [];
  let activePress = null;
  let activeKeyboardKey = null;
  let activeKeyboardStartedAt = 0;
  let lastPointerType = 'mouse';

  const nextFrames = (count = 2) => new Promise(resolve => {
    const advance = remaining => {
      if (remaining <= 0) resolve();
      else requestAnimationFrame(() => advance(remaining - 1));
    };
    advance(count);
  });

  const recordInput = (kind, event, label) => {
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return false;
    }
    state.inputCount += 1;
    state.inputKind = kind;
    state.lastTrustedEvent = label;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (lastPointerType === 'touch') state.touchInputCount += 1;
    }
    return true;
  };

  const clearMotionStyles = () => {
    [core, orbit, waves, rays].forEach(element => {
      element.style.transform = '';
      element.style.opacity = '';
    });
    sceneGlow.style.opacity = '';
  };

  const stopMotions = () => {
    if (state.animationActive) state.motionCancelCount += 1;
    for (const motion of motions) motion.stop();
    motions = [];
    state.animationActive = false;
    clearMotionStyles();
  };

  const syncDom = () => {
    const config = stateConfig[state.phase];
    panel.dataset.state = state.phase;
    panel.style.setProperty('--state-color', config.color);
    stateName.textContent = config.label;
    stateIndex.textContent = `State 0${state.stateIndex + 1} / 04`;
    stateDescription.textContent = config.description;
    shape.setAttribute('d', config.path);
    vector.setAttribute('aria-label', `Voice assistant ${config.label.toLowerCase()}`);
    stateSegments.forEach(segment => segment.classList.toggle('active', segment.dataset.stateSegment === state.phase));
    talkButton.setAttribute('aria-pressed', String(state.activeInput));
    confirmButton.disabled = state.phase !== 'review';
    resetButton.disabled = state.phase === 'ready';
    scenePanel.dataset.scene = state.appliedScene ? 'focus' : 'neutral';

    if (state.phase === 'ready') {
      inputState.textContent = 'Awaiting input';
      privacyState.textContent = 'Local audio · mic off';
      transcriptCard.dataset.visible = 'false';
      transcriptLabel.textContent = 'Prompt';
      transcriptText.textContent = 'Hold to say “Set reading lights to focus.”';
      transcriptMeta.textContent = 'No audio captured · local only';
      talkButton.textContent = 'Hold to speak';
      sceneStatus.textContent = 'Waiting';
      sceneReadingValue.textContent = 'Not applied';
    } else if (state.phase === 'listening') {
      inputState.textContent = `${state.activeInputKind || 'input'} live`;
      privacyState.textContent = 'Local audio · mic on';
      transcriptCard.dataset.visible = 'true';
      transcriptLabel.textContent = 'Live input';
      transcriptText.textContent = 'Listening…';
      transcriptMeta.textContent = 'Release to finish · audio stays on device';
      talkButton.textContent = 'Release to finish';
      sceneStatus.textContent = 'Listening';
      sceneReadingValue.textContent = 'Unchanged';
    } else if (state.phase === 'review') {
      inputState.textContent = 'Approval needed';
      privacyState.textContent = 'Local audio · mic off';
      transcriptCard.dataset.visible = 'true';
      transcriptLabel.textContent = 'Heard locally';
      transcriptText.textContent = `“${command}”`;
      transcriptMeta.textContent = `${state.holdDurationMs} ms hold · no scene change yet`;
      talkButton.textContent = 'Record again';
      sceneStatus.textContent = 'Review command';
      sceneReadingValue.textContent = 'Awaiting approval';
    } else {
      inputState.textContent = 'Task resolved';
      privacyState.textContent = 'Local audio · mic off';
      transcriptCard.dataset.visible = 'true';
      transcriptLabel.textContent = 'Applied command';
      transcriptText.textContent = `“${command}”`;
      transcriptMeta.textContent = 'Living room · fixture 02 · confirmed';
      talkButton.textContent = 'New command';
      sceneStatus.textContent = 'Applied';
      sceneReadingValue.textContent = '40% warm';
    }
  };

  const runTransitionMotion = async (nextState, previousState) => {
    if (state.animationActive) stopMotions();
    const revision = ++state.motionRevision;
    if (state.reducedMotion) {
      state.reducedMotionDirectCount += 1;
      return;
    }

    state.motionStartCount += 1;
    state.animationActive = true;
    motions = [
      animate(core, {
        transform: ['scale(.88) rotate(-4deg)', 'scale(1.08) rotate(3deg)', 'scale(1) rotate(0deg)'],
      }, { duration: .4, ease: [.22, 1, .36, 1] }),
      animate(orbit, {
        transform: ['rotate(-14deg)', 'rotate(7deg)', 'rotate(0deg)'],
      }, { duration: .46, ease: [.22, 1, .36, 1] }),
    ];

    if (nextState === 'listening') {
      motions.push(animate(waves, {
        opacity: [0, 1],
        transform: ['scale(.82)', 'scale(1.05)', 'scale(1)'],
      }, { duration: .38, ease: [.22, 1, .36, 1] }));
    }
    if (nextState === 'applied') {
      motions.push(animate(rays, {
        opacity: [0, 1],
        transform: ['scale(.7)', 'scale(1.12)', 'scale(1)'],
      }, { duration: .48, ease: [.22, 1, .36, 1] }));
      motions.push(animate(sceneGlow, { opacity: [.08, 1] }, { duration: .5, ease: 'easeOut' }));
    } else if (previousState === 'applied') {
      motions.push(animate(sceneGlow, { opacity: [1, .08] }, { duration: .3, ease: 'easeOut' }));
    }

    await Promise.allSettled(motions.map(motion => motion.finished));
    if (revision !== state.motionRevision) return;
    motions = [];
    state.animationActive = false;
    state.motionCompleteCount += 1;
    clearMotionStyles();
  };

  const transitionTo = (nextState, cause) => {
    const previousState = state.phase;
    if (previousState === nextState) return;
    state.phase = nextState;
    state.stateIndex = stateOrder.indexOf(nextState);
    state.appliedScene = nextState === 'applied';
    const transition = {
      from: previousState,
      to: nextState,
      cause,
      inputCountAtTransition: state.inputCount,
      trusted: state.syntheticInput === false,
    };
    state.transitionCount += 1;
    state.lastTransition = transition;
    state.transitionHistory.push(transition);
    if (state.transitionHistory.length > 12) state.transitionHistory.shift();
    syncDom();
    void runTransitionMotion(nextState, previousState);
  };

  const beginListening = (kind, cause, startedAt) => {
    state.activeInput = true;
    state.activeInputKind = kind;
    state.holdDurationMs = 0;
    state.transcript = null;
    state.pressStartCount += 1;
    if (kind === 'keyboard') {
      activeKeyboardKey = cause.includes('space') ? ' ' : 'Enter';
      activeKeyboardStartedAt = startedAt;
    }
    transitionTo('listening', cause);
    return startedAt;
  };

  const completeCapture = (startedAt, cause) => {
    state.activeInput = false;
    state.activeInputKind = null;
    state.holdDurationMs = Math.max(0, Math.round(performance.now() - startedAt));
    state.transcript = command;
    state.captureCompleteCount += 1;
    activePress = null;
    activeKeyboardKey = null;
    activeKeyboardStartedAt = 0;
    transitionTo('review', cause);
  };

  const cancelCapture = cause => {
    if (!state.activeInput) return;
    state.activeInput = false;
    state.activeInputKind = null;
    state.transcript = null;
    state.captureCancelCount += 1;
    activePress = null;
    activeKeyboardKey = null;
    activeKeyboardStartedAt = 0;
    transitionTo('ready', cause);
  };

  const resetAssistant = cause => {
    activePress = null;
    activeKeyboardKey = null;
    activeKeyboardStartedAt = 0;
    state.activeInput = false;
    state.activeInputKind = null;
    state.transcript = null;
    state.holdDurationMs = 0;
    state.resetCount += 1;
    if (state.phase !== 'ready') transitionTo('ready', cause);
    else syncDom();
  };

  document.addEventListener('pointerdown', event => {
    lastPointerType = event.pointerType || 'mouse';
  }, { capture: true });

  talkButton.addEventListener('pointerdown', event => {
    if (event.button !== 0 || activePress || state.activeInput) return;
    if (event.pointerType === 'touch' || event.pointerType === 'pen') event.preventDefault();
    if (!recordInput('pointer', event, `${event.pointerType}-listen-start`)) return;
    const startedAt = beginListening(event.pointerType || 'pointer', `${event.pointerType}-press-start`, performance.now());
    activePress = { pointerId: event.pointerId, startedAt };
    talkButton.setPointerCapture(event.pointerId);
  });

  talkButton.addEventListener('pointerup', event => {
    if (!activePress || activePress.pointerId !== event.pointerId) return;
    if (!recordInput('pointer', event, `${event.pointerType}-capture-complete`)) return;
    completeCapture(activePress.startedAt, `${event.pointerType}-press-release`);
  });

  talkButton.addEventListener('pointercancel', event => {
    if (!activePress || activePress.pointerId !== event.pointerId) return;
    if (!recordInput('pointer', event, `${event.pointerType}-capture-cancel`)) return;
    cancelCapture(`${event.pointerType}-pointer-cancel`);
  });

  talkButton.addEventListener('click', event => event.preventDefault());

  talkButton.addEventListener('keydown', event => {
    if ((event.key !== 'Enter' && event.key !== ' ') || event.repeat || state.activeInput) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, event.key === ' ' ? 'keyboard-space-listen-start' : 'keyboard-enter-listen-start')) return;
    beginListening('keyboard', event.key === ' ' ? 'keyboard-space-start' : 'keyboard-enter-start', performance.now());
  });

  talkButton.addEventListener('keyup', event => {
    if (!state.activeInput || state.activeInputKind !== 'keyboard' || event.key !== activeKeyboardKey) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, event.key === ' ' ? 'keyboard-space-capture-complete' : 'keyboard-enter-capture-complete')) return;
    completeCapture(activeKeyboardStartedAt, event.key === ' ' ? 'keyboard-space-release' : 'keyboard-enter-release');
  });

  confirmButton.addEventListener('click', event => {
    if (state.phase !== 'review') return;
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!recordInput(kind, event, `${kind === 'keyboard' ? 'keyboard' : lastPointerType}-confirm-scene`)) return;
    state.confirmCount += 1;
    transitionTo('applied', 'explicit-confirmation');
  });

  resetButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!recordInput(kind, event, `${kind === 'keyboard' ? 'keyboard' : lastPointerType}-reset-agent`)) return;
    state.resetButtonCount += 1;
    resetAssistant('reset-button');
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || state.phase === 'ready') return;
    event.preventDefault();
    if (!recordInput('keyboard', event, 'escape-reset-agent')) return;
    state.escapeResetCount += 1;
    resetAssistant('escape-reset');
    if (talkButton === document.activeElement) talkButton.blur();
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (state.animationActive) stopMotions();
    clearMotionStyles();
  });

  syncDom();

  const ready = (async () => {
    await document.fonts.ready;
    await nextFrames();
    state.initialStaticVerified = shape.getTotalLength() > 150
      && state.phase === 'ready'
      && state.transitionCount === 0
      && state.inputCount === 0
      && state.motionStartCount === 0
      && state.motionCompleteCount === 0
      && state.transcript === null
      && state.appliedScene === false;
  })();

  const render = () => {
    state.renderCount += 1;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();

    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const vectorRect = vector.getBoundingClientRect();
    const sceneRect = scenePanel.getBoundingClientRect();
    const talkRect = talkButton.getBoundingClientRect();
    const confirmRect = confirmButton.getBoundingClientRect();
    const resetRect = resetButton.getBoundingClientRect();
    const currentConfig = stateConfig[state.phase];
    const visibleGlyphs = [...document.querySelectorAll('.state-glyph')]
      .filter(glyph => Number.parseFloat(getComputedStyle(glyph).opacity) > .95);
    const activeSegments = stateSegments.filter(segment => segment.classList.contains('active'));
    const historyValid = state.transitionHistory.length <= 12
      && state.transitionHistory.every(transition => legalTransitions.has(`${transition.from}>${transition.to}`)
        && transition.inputCountAtTransition > 0
        && transition.trusted === true)
      && state.transitionCount >= state.transitionHistory.length
      && (!state.lastTransition || state.lastTransition.to === state.phase);
    const semanticStateValid = panel.dataset.state === state.phase
      && state.stateIndex === stateOrder.indexOf(state.phase)
      && stateName.textContent === currentConfig.label
      && stateIndex.textContent === `State 0${state.stateIndex + 1} / 04`
      && shape.getAttribute('d') === currentConfig.path
      && activeSegments.length === 1
      && activeSegments[0].dataset.stateSegment === state.phase
      && visibleGlyphs.length === 1
      && visibleGlyphs[0].classList.contains(`glyph-${state.phase}`)
      && talkButton.getAttribute('aria-pressed') === String(state.activeInput)
      && confirmButton.disabled === (state.phase !== 'review')
      && resetButton.disabled === (state.phase === 'ready')
      && scenePanel.dataset.scene === (state.appliedScene ? 'focus' : 'neutral')
      && state.appliedScene === (state.phase === 'applied')
      && state.activeInput === (state.phase === 'listening')
      && (state.phase !== 'review' && state.phase !== 'applied' || state.transcript === command)
      && (state.phase === 'review' || state.phase === 'applied' || state.transcript === null);
    const countersValid = counterKeys.every(key => Number.isInteger(state[key]) && state[key] >= 0)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.touchInputCount <= state.pointerInputCount
      && state.captureCompleteCount <= state.pressStartCount
      && state.motionCompleteCount <= state.motionStartCount;
    const viewportValid = shellRect.left >= -1
      && shellRect.top >= -1
      && shellRect.right <= innerWidth + 1
      && shellRect.bottom <= innerHeight + 1
      && vectorRect.left >= shellRect.left - 1
      && vectorRect.top >= shellRect.top - 1
      && vectorRect.right <= shellRect.right + 1
      && vectorRect.bottom <= shellRect.bottom + 1
      && sceneRect.left >= shellRect.left - 1
      && sceneRect.top >= shellRect.top - 1
      && sceneRect.right <= shellRect.right + 1
      && sceneRect.bottom <= shellRect.bottom + 1
      && [talkRect, confirmRect, resetRect].every(rect => rect.left >= shellRect.left - 1
        && rect.top >= shellRect.top - 1
        && rect.right <= shellRect.right + 1
        && rect.bottom <= shellRect.bottom + 1)
      && stageRect.width <= innerWidth + 1
      && stageRect.height <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;

    return typeof animate === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stateOrder.length === 4
      && stateSegments.length === 4
      && document.querySelectorAll('.state-glyph').length === 4
      && shape.getTotalLength() > 150
      && state.automaticStateCycle === false
      && state.automaticRehearsal === false
      && state.previewClockDriven === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.initialStaticVerified
      && semanticStateValid
      && historyValid
      && countersValid
      && viewportValid
      && state.renderCount > 0;
  };

  window.addEventListener('beforeunload', () => {
    for (const motion of motions) motion.stop();
  }, { once: true });

  installPreviewController({
    id: 'interactive-vector-state-machine',
    library: 'motion@12.42.2',
    renderer: 'svg',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
