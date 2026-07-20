import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  gsap.registerPlugin(ScrollTrigger);

  const stage = document.querySelector('#timeline-stage');
  const board = document.querySelector('#release-board');
  const cards = [...document.querySelectorAll('.timeline-card')];
  const progressBar = document.querySelector('#timeline-progress');
  const progressCursor = document.querySelector('#timeline-cursor');
  const phaseReadout = document.querySelector('#phase-readout');
  const scrubPercent = document.querySelector('#scrub-percent');
  const nodes = [...document.querySelectorAll('.rail-node')];
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = gsap.utils.clamp(0, 1);
  const phaseKeys = ['brief', 'prototype', 'release'];

  if (!stage || !board || cards.length !== 3) throw new Error('Release timeline DOM is incomplete.');

  const state = {
    timelineProgress: 0,
    phase: 'enter',
    phaseIndex: 0,
    phaseProgress: 0,
    cardStates: { brief: 'queued', prototype: 'blocked', release: 'waiting' },
    evidence: {
      brief: '12 interviews · 3 risk signals',
      prototype: 'Waiting for locked scope',
      release: 'Waiting for replayable flows'
    },
    owners: {
      brief: 'Research Operations',
      prototype: 'Design Engineering',
      release: 'Release Quality'
    },
    lastInput: 'none',
    inputCount: 0,
    wheelCount: 0,
    dragMoveCount: 0,
    keyboardCount: 0,
    boundaryReleaseCount: 0,
    lastWheelConsumed: false,
    pointerInside: false,
    stageFocused: false,
    pointerCaptured: false,
    motionActive: false,
    reducedMotion: reducedMotionQuery.matches,
    automaticFallback: false,
    automaticPlayback: false,
    syntheticInputDispatch: false,
    wheelBoundaryPolicy: 'release-at-bounds',
    inputAdapters: ['wheel', 'vertical-drag', 'keyboard'],
    masterTimelinePaused: true,
    renderCount: 0,
    initialStaticConfirmed: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  const masterTimeline = gsap.timeline({
    paused: true,
    defaults: { ease: 'power2.out' }
  });

  masterTimeline
    .set(cards, { transformOrigin: '50% 100%' }, 0)
    .set(cards[0], { y: 10, scale: .975, opacity: .76 }, 0)
    .set(cards[1], { y: 18, scale: .955, opacity: .45 }, 0)
    .set(cards[2], { y: 22, scale: .94, opacity: .34 }, 0)
    .to(cards[0], { y: 0, scale: 1, opacity: 1, duration: .82 }, 0)
    .to(cards[1], { y: 0, scale: 1, opacity: 1, duration: .88 }, .82)
    .to(cards[0], { y: -3, scale: .99, duration: .42 }, .98)
    .to(cards[2], { y: 0, scale: 1, opacity: 1, duration: .9 }, 1.68)
    .to(cards[1], { y: -3, scale: .99, duration: .42 }, 1.85)
    .to(cards, { y: 0, scale: 1, opacity: 1, stagger: .04, duration: .38, ease: 'power1.out' }, 2.58);

  const progressDriver = { value: 0 };
  let dragSession = null;

  const snapshotFor = progress => {
    if (progress < .17) {
      return {
        phase: 'enter', label: 'ENTER · BRIEF QUEUED',
        states: ['queued', 'blocked', 'waiting'],
        status: ['QUEUED', 'BLOCKED', 'WAITING'],
        evidence: ['12 interviews · 3 risk signals', 'Waiting for locked scope', 'Waiting for replayable flows'],
        mini: ['CLAIM QUEUED', 'NEEDS BRIEF', 'NEEDS TRACE'],
        cardProgress: [progress / .17 * .45, 0, 0]
      };
    }
    if (progress < .33) {
      const local = (progress - .17) / .16;
      return {
        phase: 'enter', label: local < .76 ? 'ENTER · CLAIM REVIEW' : 'ENTER · BRIEF ACCEPTED',
        states: [local < .76 ? 'review' : 'accepted', 'blocked', 'waiting'],
        status: [local < .76 ? 'IN REVIEW' : 'ACCEPTED', 'BLOCKED', 'WAITING'],
        evidence: [local < .76 ? '3 risk signals under review' : 'Claim + exclusions locked', 'Waiting for locked scope', 'Waiting for replayable flows'],
        mini: [local < .76 ? 'CLAIM REVIEW' : 'BRIEF ACCEPTED', 'NEEDS BRIEF', 'NEEDS TRACE'],
        cardProgress: [.45 + local * .55, 0, 0]
      };
    }
    if (progress < .55) {
      const local = (progress - .33) / .22;
      return {
        phase: 'shift', label: 'SHIFT · PROTOTYPE BUILD',
        states: ['accepted', 'building', 'waiting'],
        status: ['ACCEPTED', 'IN BUILD', 'WAITING'],
        evidence: ['Claim + exclusions locked', `${Math.max(1, Math.round(local * 7))}/7 flows linked to claims`, 'Waiting for replayable flows'],
        mini: ['BRIEF ACCEPTED', `${Math.max(1, Math.round(local * 7))}/7 FLOWS`, 'NEEDS TRACE'],
        cardProgress: [1, local * .72, 0]
      };
    }
    if (progress < .67) {
      const local = (progress - .55) / .12;
      return {
        phase: 'shift', label: local < .7 ? 'SHIFT · RISK REPLAY' : 'SHIFT · TRACE VERIFIED',
        states: ['accepted', local < .7 ? 'replay' : 'verified', 'waiting'],
        status: ['ACCEPTED', local < .7 ? 'RISK REPLAY' : 'VERIFIED', 'WAITING'],
        evidence: ['Claim + exclusions locked', local < .7 ? '2 high-risk paths replaying' : '7/7 flows · 2 risk paths', 'Waiting for replayable flows'],
        mini: ['BRIEF ACCEPTED', local < .7 ? 'RISK REPLAY' : 'TRACE VERIFIED', 'NEEDS TRACE'],
        cardProgress: [1, .72 + local * .28, 0]
      };
    }
    if (progress < .84) {
      const local = (progress - .67) / .17;
      const checks = Math.max(1, Math.round(local * 18));
      return {
        phase: 'settle', label: 'SETTLE · RELEASE GATES',
        states: ['accepted', 'verified', 'gating'],
        status: ['ACCEPTED', 'VERIFIED', 'GATE REVIEW'],
        evidence: ['Claim + exclusions locked', '7/7 flows · 2 risk paths', `${checks}/18 access + proof checks`],
        mini: ['BRIEF ACCEPTED', 'TRACE VERIFIED', `${checks}/18 CHECKS`],
        cardProgress: [1, 1, local * .72]
      };
    }
    if (progress < .98) {
      const local = (progress - .84) / .14;
      return {
        phase: 'settle', label: 'SETTLE · ROLLBACK PROOF',
        states: ['accepted', 'verified', 'proving'],
        status: ['ACCEPTED', 'VERIFIED', 'ROLLBACK TEST'],
        evidence: ['Claim + exclusions locked', '7/7 flows · 2 risk paths', local < .72 ? '18/18 checks · rollback replay' : '18/18 checks · rollback 41s'],
        mini: ['BRIEF ACCEPTED', 'TRACE VERIFIED', local < .72 ? 'ROLLBACK TEST' : 'ROLLBACK 41S'],
        cardProgress: [1, 1, .72 + local * .28]
      };
    }
    return {
      phase: 'settle', label: 'SETTLE · VERIFIED RELEASE',
      states: ['accepted', 'verified', 'ready'],
      status: ['ACCEPTED', 'VERIFIED', 'READY TO SHIP'],
      evidence: ['Claim + exclusions locked', '7/7 flows · 2 risk paths', '18/18 checks · rollback 41s'],
      mini: ['BRIEF ACCEPTED', 'TRACE VERIFIED', 'READY TO SHIP'],
      cardProgress: [1, 1, 1]
    };
  };

  const syncInterface = progress => {
    const snapshot = snapshotFor(progress);
    const ownerSnapshot = [
      progress < .17 ? 'Research Operations' : 'Product Strategy',
      progress >= .33 && progress < .41 ? 'Product Strategy → Design Eng' : 'Design Engineering',
      progress >= .67 && progress < .76
        ? 'Design Eng → Release Quality'
        : progress >= .98 ? 'Release Captain' : 'Release Quality'
    ];
    const ownerMarks = [progress < .17 ? 'RO' : 'PS', 'DE', progress >= .98 ? 'RC' : 'RQ'];
    const phaseIndex = snapshot.phase === 'enter' ? 0 : snapshot.phase === 'shift' ? 1 : 2;
    const phaseStart = phaseIndex / 3;
    const phaseEnd = (phaseIndex + 1) / 3;

    state.timelineProgress = progress;
    state.phase = snapshot.phase;
    state.phaseIndex = phaseIndex;
    state.phaseProgress = clamp((progress - phaseStart) / (phaseEnd - phaseStart));
    phaseReadout.textContent = snapshot.label;
    scrubPercent.textContent = `${String(Math.round(progress * 100)).padStart(3, '0')}%`;
    progressBar.style.transform = `scaleX(${progress})`;
    progressCursor.style.left = `calc(${progress * 100}% - ${progress * 10}px)`;

    cards.forEach((card, index) => {
      const key = phaseKeys[index];
      const cardState = snapshot.states[index];
      card.dataset.state = cardState;
      card.style.setProperty('--card-progress', snapshot.cardProgress[index].toFixed(3));
      card.querySelector('[data-status]').textContent = snapshot.status[index];
      card.querySelector('[data-evidence]').textContent = snapshot.evidence[index];
      card.querySelector('[data-mini]').textContent = snapshot.mini[index];
      card.querySelector('[data-owner]').textContent = ownerSnapshot[index];
      card.querySelector('[data-owner-mark]').textContent = ownerMarks[index];
      state.cardStates[key] = cardState;
      state.evidence[key] = snapshot.evidence[index];
      state.owners[key] = ownerSnapshot[index];
    });

    nodes.forEach((node, index) => {
      node.dataset.state = index < phaseIndex ? 'done' : index === phaseIndex ? 'active' : 'pending';
    });
  };

  const applyProgress = rawProgress => {
    const progress = clamp(Number.isFinite(rawProgress) ? rawProgress : 0);
    progressDriver.value = progress;
    masterTimeline.progress(progress, true);
    syncInterface(progress);
    state.renderCount += 1;
  };

  const setProgress = (target, source, animate = false) => {
    const next = clamp(target);
    gsap.killTweensOf(progressDriver);
    state.motionActive = false;
    state.lastInput = source;

    if (animate && !state.reducedMotion && Math.abs(next - state.timelineProgress) > .001) {
      state.motionActive = true;
      gsap.to(progressDriver, {
        value: next,
        duration: .32,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => applyProgress(progressDriver.value),
        onComplete: () => {
          state.motionActive = false;
          applyProgress(next);
        }
      });
      return;
    }

    applyProgress(next);
  };

  const recordInput = kind => {
    state.inputCount += 1;
    state.lastInput = kind;
  };

  const wheelScale = event => {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return 16;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return Math.max(80, stage.clientHeight);
    return 1;
  };

  stage.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX) || Math.abs(event.deltaY) < .25) return;
    const deltaY = event.deltaY * wheelScale(event);
    const direction = Math.sign(deltaY);
    const atBoundary = (direction < 0 && state.timelineProgress <= .0001)
      || (direction > 0 && state.timelineProgress >= .9999);

    state.wheelCount += 1;
    state.lastWheelConsumed = false;

    if (atBoundary) {
      state.boundaryReleaseCount += 1;
      state.lastInput = 'wheel-boundary-release';
      return;
    }

    event.preventDefault();
    recordInput('wheel');
    state.lastWheelConsumed = true;
    const amount = deltaY / Math.max(280, stage.clientHeight * 3.2);
    setProgress(state.timelineProgress + amount, 'wheel');
  }, { passive: false });

  board.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    gsap.killTweensOf(progressDriver);
    state.motionActive = false;
    stage.focus({ preventScroll: true });
    board.setPointerCapture(event.pointerId);
    dragSession = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startProgress: state.timelineProgress
    };
    state.pointerCaptured = true;
    state.lastInput = 'vertical-drag-start';
  });

  board.addEventListener('pointermove', event => {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;
    event.preventDefault();
    const distance = dragSession.startY - event.clientY;
    const next = dragSession.startProgress + distance / Math.max(90, board.clientHeight * 1.35);
    state.dragMoveCount += 1;
    recordInput('vertical-drag');
    setProgress(next, 'vertical-drag');
  });

  const endDrag = event => {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;
    if (board.hasPointerCapture?.(event.pointerId)) board.releasePointerCapture(event.pointerId);
    dragSession = null;
    state.pointerCaptured = false;
    state.lastInput = 'vertical-drag-end';
  };

  board.addEventListener('pointerup', endDrag);
  board.addEventListener('pointercancel', endDrag);
  board.addEventListener('lostpointercapture', event => {
    if (dragSession?.pointerId === event.pointerId) dragSession = null;
    state.pointerCaptured = false;
  });

  stage.addEventListener('keydown', event => {
    const increments = {
      ArrowDown: .09,
      ArrowRight: .09,
      ArrowUp: -.09,
      ArrowLeft: -.09,
      PageDown: 1 / 3,
      PageUp: -1 / 3
    };
    let target = null;

    if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = 1;
    else if (event.key in increments) target = state.timelineProgress + increments[event.key];
    if (target === null) return;

    event.preventDefault();
    state.keyboardCount += 1;
    recordInput(`keyboard:${event.key}`);
    setProgress(target, `keyboard:${event.key}`, true);
  });

  stage.addEventListener('pointerenter', () => { state.pointerInside = true; });
  stage.addEventListener('pointerleave', () => { state.pointerInside = false; });
  stage.addEventListener('focus', () => { state.stageFocused = true; });
  stage.addEventListener('blur', () => { state.stageFocused = false; });

  const handleReducedMotionChange = event => {
    state.reducedMotion = event.matches;
    if (event.matches) {
      gsap.killTweensOf(progressDriver);
      state.motionActive = false;
      applyProgress(progressDriver.value);
    }
  };

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  } else {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const tolerance = .012;
    const stageRect = stage.getBoundingClientRect();
    const expected = snapshotFor(state.timelineProgress);
    const ownerValues = cards.map(card => card.querySelector('[data-owner]').textContent.trim());
    const uniqueTasks = new Set(cards.map(card => card.querySelector('.card-task').textContent.trim()));
    const uniqueDependencies = new Set(cards.map(card => card.dataset.dependsOn));
    const intersectsStage = card => {
      const rect = card.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0
        && rect.right > stageRect.left && rect.left < stageRect.right
        && rect.bottom > stageRect.top && rect.top < stageRect.bottom;
    };
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`scroll-scrubbed-master-timeline: ${message}`);
    };

    invariant(state.automaticFallback === false && state.automaticPlayback === false, 'automatic progression must remain disabled');
    invariant(state.syntheticInputDispatch === false, 'synthetic input dispatch must remain disabled');
    invariant(state.wheelBoundaryPolicy === 'release-at-bounds', 'wheel boundary policy changed');
    invariant(state.inputAdapters.join('|') === 'wheel|vertical-drag|keyboard', 'input adapter contract changed');
    invariant(masterTimeline.paused() && state.masterTimelinePaused, 'GSAP master timeline must stay paused');
    invariant(Math.abs(masterTimeline.progress() - state.timelineProgress) <= tolerance, 'timeline and interaction progress diverged');
    invariant(state.timelineProgress >= 0 && state.timelineProgress <= 1, 'progress escaped normalized range');
    invariant(cards.length === 3 && cards.every(intersectsStage), 'all release cards must remain visible');
    invariant(uniqueTasks.size === 3 && uniqueDependencies.size === 3, 'tasks and causal dependencies must be distinct');
    invariant(new Set(ownerValues).size === 3, 'each task must retain a distinct accountable owner');
    invariant(getComputedStyle(board).touchAction === 'none', 'vertical drag surface must disable browser touch gestures');
    invariant(typeof board.setPointerCapture === 'function', 'drag must use pointer capture');
    invariant(phaseKeys.every((key, index) => cards[index].dataset.state === state.cardStates[key]), 'card state export is stale');
    invariant(phaseKeys.every((key, index) => cards[index].querySelector('[data-evidence]').textContent === state.evidence[key]), 'evidence export is stale');
    invariant(expected.phase === state.phase && expected.states.every((value, index) => value === cards[index].dataset.state), 'phase snapshot is inconsistent');
    invariant(state.inputCount > 0 || (state.initialStaticConfirmed && state.timelineProgress === 0 && state.motionActive === false), 'initial frame must remain strictly static');
    return true;
  };

  applyProgress(0);

  const doubleFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.resolve(document.fonts?.ready)
    .then(doubleFrame)
    .then(() => {
      const before = `${state.timelineProgress}|${state.phase}|${Object.values(state.cardStates).join('|')}`;
      return doubleFrame().then(() => {
        const after = `${state.timelineProgress}|${state.phase}|${Object.values(state.cardStates).join('|')}`;
        state.initialStaticConfirmed = before === after && state.timelineProgress === 0 && state.motionActive === false;
        if (!state.initialStaticConfirmed) throw new Error('Initial release timeline changed without user input.');
        if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial release timeline runtime assertion failed.');
      });
    });

  ready.catch(markPreviewFailure);

  installPreviewController({
    id: 'scroll-scrubbed-master-timeline',
    library: 'gsap@3.15.0',
    renderer: 'dom',
    render: () => {
      if (!state.motionActive) masterTimeline.progress(state.timelineProgress, true);
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
