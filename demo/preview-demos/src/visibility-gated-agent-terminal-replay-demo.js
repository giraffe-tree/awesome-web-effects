import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-c-utils.js';

try {
  const stage = document.querySelector('#terminal-stage');
  const terminal = document.querySelector('#terminal');
  const logViewport = document.querySelector('#terminal-log');
  const logLines = document.querySelector('#log-lines');
  const logRows = [...document.querySelectorAll('.log-row')];
  const agentRows = [...document.querySelectorAll('.agent-row')];
  const replayCursor = document.querySelector('#replay-cursor');
  const status = document.querySelector('#terminal-status');
  const progressBar = document.querySelector('#terminal-progress');
  const playToggle = document.querySelector('#play-toggle');
  const restartButton = document.querySelector('#restart');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const totalDuration = 8.4;
  const eventStops = logRows.map(row => Number(row.dataset.at));
  const agentNames = agentRows.map(row => row.dataset.agent);
  const state = {
    automaticFallback: false,
    automaticPlayback: false,
    syntheticInputDispatch: false,
    progress: 0,
    eventIndex: 0,
    runPhase: 'intake',
    phase: 'paused',
    currentOutcome: logRows[0].dataset.outcome,
    agentStatuses: {
      orchestrator: 'ready',
      research: 'queued',
      analyst: 'queued',
      builder: 'queued',
      verifier: 'queued'
    },
    playIntent: false,
    canAdvance: false,
    pageVisible: document.visibilityState === 'visible',
    intersectionKnown: false,
    intersectionVisible: false,
    intersectionRatio: 0,
    visibilityGateReason: 'intersection-pending',
    pauseReason: 'initial',
    visibilityEventCount: 0,
    intersectionEventCount: 0,
    gatePauseCount: 0,
    gateResumeCount: 0,
    inputKind: 'none',
    inputCount: 0,
    playToggleCount: 0,
    restartCount: 0,
    scrubCount: 0,
    motionActive: false,
    reducedMotion: reducedMotion.matches,
    initialStaticConfirmed: false,
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let latestPointerKind = 'mouse';
  let lastTick = performance.now();
  let scrubControl = null;
  let scrubSerial = 0;
  let resolveFirstIntersection;
  const firstIntersection = new Promise(resolve => {
    resolveFirstIntersection = resolve;
  });

  function recordInput(inputKind) {
    state.inputKind = inputKind;
    state.inputCount += 1;
  }

  function stopScrubMotion() {
    scrubSerial += 1;
    scrubControl?.stop?.();
    scrubControl = null;
    state.motionActive = false;
  }

  function statusesAt(progress) {
    return {
      orchestrator: progress >= 1 ? 'done'
        : progress < .09 ? 'ready'
          : progress < .43 ? 'waiting'
            : progress < .55 ? 'running'
              : progress < .9 ? 'waiting' : 'reviewing',
      research: progress < .09 ? 'queued' : progress < .31 ? 'running' : 'done',
      analyst: progress < .19 ? 'queued' : progress < .43 ? 'running' : 'done',
      builder: progress < .43 ? 'queued'
        : progress < .69 ? 'running'
          : progress < .79 ? 'waiting'
            : progress < .9 ? 'repairing' : 'done',
      verifier: progress < .55 ? 'queued'
        : progress < .79 ? 'running'
          : progress < .9 ? 'waiting'
            : progress < 1 ? 'running' : 'done'
    };
  }

  const agentTones = {
    queued: '#59675f',
    ready: '#d5b15d',
    waiting: '#638c7a',
    running: '#69d3a3',
    reviewing: '#7fbad1',
    repairing: '#e0925f',
    done: '#66b895'
  };

  function currentEventIndex(progress) {
    let index = 0;
    eventStops.forEach((stop, eventIndex) => {
      if (progress >= stop) index = eventIndex;
    });
    return index;
  }

  function applyProgress() {
    state.progress = clamp(state.progress, 0, 1);
    const eventIndex = currentEventIndex(state.progress);
    state.eventIndex = eventIndex;
    state.runPhase = logRows[eventIndex].dataset.phase;
    state.currentOutcome = logRows[eventIndex].dataset.outcome;
    state.agentStatuses = statusesAt(state.progress);

    logRows.forEach((row, index) => {
      const start = eventStops[index];
      const end = eventStops[index + 1] ?? 1;
      const reveal = state.progress < start ? 0
        : index < eventIndex ? 1
          : clamp(.46 + ((state.progress - start) / Math.max(.001, end - start)) * .54, 0, 1);
      row.style.setProperty('--reveal', String(reveal));
      row.style.setProperty('--conceal', `${((1 - reveal) * 100).toFixed(2)}%`);
      row.classList.toggle('is-current', index === eventIndex);
    });

    agentRows.forEach(row => {
      const agentState = state.agentStatuses[row.dataset.agent];
      row.querySelector('.agent-state').textContent = agentState;
      row.querySelector('.agent-dot').style.setProperty('--agent-tone', agentTones[agentState]);
    });

    const currentRow = logRows[eventIndex];
    const maxScroll = Math.max(0, logLines.scrollHeight - logViewport.clientHeight + 8);
    const logScroll = clamp(currentRow.offsetTop - logViewport.clientHeight * .6, 0, maxScroll);
    logLines.style.transform = `translate3d(0, ${(-logScroll).toFixed(3)}px, 0)`;
    const cursorX = clamp(logViewport.clientWidth * .72, 42, logViewport.clientWidth - 14);
    const cursorY = currentRow.offsetTop - logScroll + currentRow.offsetHeight / 2 - replayCursor.offsetHeight / 2;
    replayCursor.style.transform = `translate3d(${cursorX.toFixed(3)}px, ${cursorY.toFixed(3)}px, 0)`;
    replayCursor.style.setProperty('--cursor-opacity', state.canAdvance ? '1' : '.4');
    progressBar.style.setProperty('--progress', String(state.progress));
    updateInterface();
  }

  function visibilityReason() {
    if (!state.pageVisible) return 'document-hidden';
    if (!state.intersectionKnown) return 'intersection-pending';
    if (!state.intersectionVisible) return 'offscreen';
    return 'none';
  }

  function updateGate(source) {
    const previousCanAdvance = state.canAdvance;
    const reason = visibilityReason();
    state.visibilityGateReason = reason;
    state.canAdvance = state.playIntent
      && reason === 'none'
      && !state.reducedMotion
      && state.progress < 1;
    if (state.playIntent && reason !== 'none') {
      state.phase = 'gated';
      state.pauseReason = reason;
    } else if (state.canAdvance) {
      state.phase = 'playing';
      state.pauseReason = 'none';
    } else if (state.progress >= 1) {
      state.phase = 'done';
      state.pauseReason = 'complete';
      state.playIntent = false;
    }
    if (previousCanAdvance && !state.canAdvance && state.playIntent) state.gatePauseCount += 1;
    if (!previousCanAdvance && state.canAdvance && source !== 'operator-play') state.gateResumeCount += 1;
    lastTick = performance.now();
    updateInterface();
  }

  function updateInterface() {
    const gateLabel = state.visibilityGateReason === 'document-hidden' ? 'tab hidden'
      : state.visibilityGateReason === 'offscreen' ? 'offscreen'
        : state.visibilityGateReason === 'intersection-pending' ? 'checking view'
          : state.pauseReason === 'complete' ? 'complete'
            : state.phase === 'playing' ? state.runPhase
              : state.pauseReason === 'operator-scrub' ? 'scrubbed'
                : 'operator';
    status.textContent = `${state.phase} · ${gateLabel}`;
    const tone = state.phase === 'playing' ? '#67d2a2'
      : state.phase === 'gated' ? '#dbad5e'
        : state.phase === 'done' ? '#78b8d0' : '#788a80';
    status.style.setProperty('--status-tone', tone);
    playToggle.textContent = state.reducedMotion ? (state.progress >= 1 ? 'Replay step' : 'Play step')
      : state.progress >= 1 ? 'Replay'
        : state.playIntent ? 'Pause' : 'Play';
    playToggle.setAttribute('aria-pressed', String(state.playIntent));
  }

  const observer = new IntersectionObserver(entries => {
    const entry = entries.find(candidate => candidate.target === terminal) || entries[0];
    if (!entry) return;
    state.intersectionEventCount += 1;
    state.intersectionKnown = true;
    state.intersectionRatio = entry.intersectionRatio;
    state.intersectionVisible = entry.isIntersecting && entry.intersectionRatio >= .2;
    updateGate('intersection');
    resolveFirstIntersection?.();
    resolveFirstIntersection = null;
  }, { threshold: [0, .2, .55, .9] });
  observer.observe(terminal);

  document.addEventListener('visibilitychange', () => {
    state.visibilityEventCount += 1;
    state.pageVisible = document.visibilityState === 'visible';
    updateGate('document-visibility');
  });

  function nextEventIndex(direction) {
    if (direction > 0) return clamp(state.eventIndex + 1, 0, logRows.length - 1);
    const currentStop = eventStops[state.eventIndex];
    return state.progress > currentStop + .005
      ? state.eventIndex
      : clamp(state.eventIndex - 1, 0, logRows.length - 1);
  }

  function scrubTo(progress, inputKind) {
    recordInput(inputKind);
    state.scrubCount += 1;
    state.playIntent = false;
    state.canAdvance = false;
    stopScrubMotion();
    const target = clamp(progress, 0, 1);
    state.pauseReason = target >= 1 ? 'complete' : 'operator-scrub';
    if (reducedMotion.matches || Math.abs(target - state.progress) < .0005) {
      state.progress = target;
      state.phase = target >= 1 ? 'done' : 'paused';
      applyProgress();
      return;
    }
    const serial = ++scrubSerial;
    state.phase = 'scrubbing';
    state.motionActive = true;
    scrubControl = animate(state.progress, target, {
      duration: .24,
      ease: [.22, .7, .25, 1],
      onUpdate: value => {
        if (serial !== scrubSerial) return;
        state.progress = value;
        applyProgress();
      },
      onComplete: () => {
        if (serial !== scrubSerial) return;
        state.progress = target;
        state.phase = target >= 1 ? 'done' : 'paused';
        state.motionActive = false;
        scrubControl = null;
        applyProgress();
      }
    });
  }

  function directReducedStep(inputKind) {
    const targetIndex = state.progress >= 1 ? 0 : nextEventIndex(1);
    scrubTo(eventStops[targetIndex], inputKind);
  }

  function togglePlayback(inputKind) {
    if (reducedMotion.matches) {
      state.playToggleCount += 1;
      directReducedStep(inputKind);
      return;
    }
    recordInput(inputKind);
    state.playToggleCount += 1;
    stopScrubMotion();
    if (state.progress >= 1) state.progress = 0;
    state.playIntent = !state.playIntent;
    state.pauseReason = state.playIntent ? 'none' : 'operator-paused';
    state.phase = state.playIntent ? 'playing' : 'paused';
    updateGate('operator-play');
    applyProgress();
  }

  function restartPlayback(inputKind) {
    recordInput(inputKind);
    state.restartCount += 1;
    stopScrubMotion();
    state.progress = 0;
    state.pauseReason = reducedMotion.matches ? 'operator-paused' : 'none';
    state.playIntent = !reducedMotion.matches;
    state.phase = reducedMotion.matches ? 'paused' : 'playing';
    updateGate('operator-restart');
    applyProgress();
  }

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
    if (!event.target.closest('button')) stage.focus({ preventScroll: true });
  });
  playToggle.addEventListener('click', event => {
    togglePlayback(event.detail === 0 ? 'keyboard' : latestPointerKind);
  });
  restartButton.addEventListener('click', event => {
    restartPlayback(event.detail === 0 ? 'keyboard' : latestPointerKind);
  });
  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      if (!event.repeat) {
        const targetIndex = nextEventIndex(event.key === 'ArrowLeft' ? -1 : 1);
        scrubTo(eventStops[targetIndex], 'keyboard');
      }
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!event.repeat) scrubTo(event.key === 'Home' ? 0 : 1, 'keyboard');
      return;
    }
    if (![' ', 'Enter'].includes(event.key) || event.target.closest('button')) return;
    event.preventDefault();
    if (!event.repeat) togglePlayback('keyboard');
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches) {
      state.playIntent = false;
      state.canAdvance = false;
      state.phase = state.progress >= 1 ? 'done' : 'paused';
      state.pauseReason = 'reduced-motion';
      stopScrubMotion();
    }
    updateGate('reduced-motion');
    applyProgress();
  });

  const resizeObserver = new ResizeObserver(() => applyProgress());
  resizeObserver.observe(logViewport);

  function render() {
    const now = performance.now();
    const elapsed = clamp((now - lastTick) / 1000, 0, .06);
    lastTick = now;
    state.renderCount += 1;
    if (state.canAdvance && !state.motionActive) {
      state.progress = clamp(state.progress + elapsed / totalDuration, 0, 1);
      if (state.progress >= 1) {
        state.playIntent = false;
        state.canAdvance = false;
        state.phase = 'done';
        state.pauseReason = 'complete';
      }
    }
    applyProgress();
  }

  const ready = Promise.all([document.fonts.ready, firstIntersection]).then(async () => {
    state.progress = 0;
    state.playIntent = false;
    state.canAdvance = false;
    state.phase = 'paused';
    state.pauseReason = 'initial';
    lastTick = performance.now();
    applyProgress();
    const initialProgress = state.progress;
    const initialTransform = logLines.style.transform;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialStaticConfirmed = state.progress === initialProgress
      && logLines.style.transform === initialTransform
      && state.inputCount === 0
      && !state.playIntent;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    applyProgress();
    const stageBounds = stage.getBoundingClientRect();
    const terminalBounds = terminal.getBoundingClientRect();
    const credibleRun = logRows.length === 10 && logRows.every((row, index) => (
      Number.isFinite(eventStops[index])
      && row.dataset.phase?.length > 3
      && row.dataset.outcome?.length > 35
      && row.querySelector('.log-agent')?.textContent.trim().length > 3
      && row.querySelector('.log-event')?.textContent.trim().length > 22
    ));
    const statusValues = Object.values(state.agentStatuses);
    const truthfulVisibility = state.pageVisible === (document.visibilityState === 'visible')
      && state.intersectionKnown
      && state.intersectionEventCount > 0;
    const gateConsistent = state.canAdvance === (
      state.playIntent
      && state.pageVisible
      && state.intersectionVisible
      && !state.reducedMotion
      && state.progress < 1
    );
    const noUnpromptedPlayback = state.inputCount > 0 || (
      state.progress === 0
      && !state.playIntent
      && !state.canAdvance
      && state.phase === 'paused'
    );
    return credibleRun
      && agentRows.length === 5
      && agentNames.every(name => Object.hasOwn(state.agentStatuses, name))
      && statusValues.every(value => Object.hasOwn(agentTones, value))
      && observer instanceof IntersectionObserver
      && truthfulVisibility
      && gateConsistent
      && state.initialStaticConfirmed
      && noUnpromptedPlayback
      && state.automaticPlayback === false
      && state.syntheticInputDispatch === false
      && state.automaticFallback === false
      && state.progress >= 0
      && state.progress <= 1
      && state.eventIndex >= 0
      && state.eventIndex < logRows.length
      && ['paused', 'playing', 'gated', 'scrubbing', 'done'].includes(state.phase)
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.playToggleCount)
      && Number.isInteger(state.restartCount)
      && Number.isInteger(state.scrubCount)
      && Number.isInteger(state.gatePauseCount)
      && Number.isInteger(state.gateResumeCount)
      && stage.tabIndex === 0
      && stage.getAttribute('aria-label').includes('Home')
      && logLines.style.transform.includes('translate3d')
      && replayCursor.style.transform.includes('translate3d')
      && terminalBounds.width >= stageBounds.width * .9
      && terminalBounds.height >= stageBounds.height * .82
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'visibility-gated-agent-terminal-replay',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
