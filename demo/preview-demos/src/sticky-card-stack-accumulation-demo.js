import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#sticky-stage');
  const shell = document.querySelector('#case-shell');
  const caseDocument = document.querySelector('#case-document');
  const cards = [...document.querySelectorAll('.case-card')];
  const cardBodies = [...document.querySelectorAll('.card-body')];
  const chapterControls = [...document.querySelectorAll('.chapter-control')];
  const reviewStatus = document.querySelector('#review-status');
  const chapterCount = document.querySelector('#chapter-count');
  const progressLabel = document.querySelector('#progress-label');
  const findingLabel = document.querySelector('#finding-label');
  const findingValue = document.querySelector('#finding-value');
  const restartButton = document.querySelector('#restart-button');
  const progressRail = document.querySelector('.progress-rail');
  const progressFill = document.querySelector('#progress-fill');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !shell || !caseDocument || cards.length !== 4 || cardBodies.length !== 4 || chapterControls.length !== 4) {
    throw new Error('Sticky incident review DOM is incomplete.');
  }

  const chapterIds = ['signal', 'scope', 'cause', 'response'];
  const chapterNames = ['Signal', 'Scope', 'Cause', 'Response'];
  const findings = [
    'Queue pressure isolated',
    'Blast radius bounded',
    'Capacity regression confirmed',
    '3 safeguards shipped',
  ];
  const clamp = value => Math.min(1, Math.max(0, value));
  const rounded = value => Number(clamp(value).toFixed(6));

  const state = {
    id: 'sticky-card-stack-accumulation',
    task: 'incident-review-card-stack',
    userInputRequired: true,
    automaticProgress: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockDriven: false,
    syntheticInputDispatch: false,
    userOwnedProgress: true,
    controlsBuiltWithoutAutoplay: true,
    initialFrameStatic: true,
    initialStaticVerified: false,
    acceptedInputs: ['wheel', 'mouse', 'touch', 'pen', 'keyboard', 'chapter-control'],
    boundaryPolicy: 'release-outward-wheel-at-0-and-1',
    progress: 0,
    activeIndex: 0,
    activeChapter: 'signal',
    taskComplete: false,
    finding: findings[0],
    progressSource: 'none',
    inputKind: 'none',
    inputCount: 0,
    wheelInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    wheelConsumedCount: 0,
    wheelBoundaryReleaseCount: 0,
    startBoundaryReleaseCount: 0,
    endBoundaryReleaseCount: 0,
    lastWheelDefaultPrevented: null,
    lastBoundary: null,
    pointerCaptured: false,
    activePointerId: null,
    activePointerType: null,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    dragUpdateCount: 0,
    keyboardSeekCount: 0,
    keyboardBoundaryCount: 0,
    chapterSelectionCount: 0,
    restartCount: 0,
    progressMutationCount: 0,
    layoutMeasureCount: 0,
    controlRebuildCount: 0,
    renderCount: 0,
    scrollSpan: 0,
    scrollTop: 0,
    scrollRegistrationError: 0,
    motionControlCount: 0,
    cardStickyCount: 0,
    compressionTimes: [0, 0, 0, 0],
    detailTimes: [0, 0, 0, 0],
    progressControlTime: 0,
    reducedMotion: reducedMotion.matches,
    reducedMotionDiscreteNavigation: true,
    lastInputTrusted: null,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let cardMotion = [];
  let detailMotion = [];
  let progressMotion;
  let dragSession = null;
  let latestPointerType = 'mouse';
  let resizeFrame = 0;

  function recordInput(kind, event) {
    if (!event || event.isTrusted !== true) return false;
    state.inputKind = kind;
    state.inputCount += 1;
    state.lastInputTrusted = true;
    if (kind === 'wheel') state.wheelInputCount += 1;
    else if (kind === 'keyboard') state.keyboardInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (kind === 'touch') state.touchInputCount += 1;
      if (kind === 'pen') state.penInputCount += 1;
    }
    return true;
  }

  function activeIndexFor(progress) {
    return Math.min(3, Math.max(0, Math.round(progress * 3)));
  }

  function normalizedTime(control) {
    return control?.duration ? control.time / control.duration : 0;
  }

  function syncMotion() {
    const sectionPosition = state.progress * 3;
    cards.forEach((card, index) => {
      const compression = clamp(sectionPosition - index);
      const detailFade = clamp(compression * 2.4);
      cardMotion[index].time = compression * cardMotion[index].duration;
      detailMotion[index].time = detailFade * detailMotion[index].duration;
      state.compressionTimes[index] = Number(normalizedTime(cardMotion[index]).toFixed(4));
      state.detailTimes[index] = Number(normalizedTime(detailMotion[index]).toFixed(4));
    });
    progressMotion.time = state.progress * progressMotion.duration;
    if (progressMotion.duration === 0) progressFill.style.transform = `scaleX(${state.progress})`;
    state.progressControlTime = progressMotion.duration === 0
      ? state.progress
      : Number(normalizedTime(progressMotion).toFixed(4));
    shell.scrollTop = state.progress * state.scrollSpan;
    state.scrollTop = Number(shell.scrollTop.toFixed(3));
    state.scrollRegistrationError = Number(Math.abs(shell.scrollTop - state.progress * state.scrollSpan).toFixed(3));
  }

  function syncInterface() {
    const index = activeIndexFor(state.progress);
    state.activeIndex = index;
    state.activeChapter = chapterIds[index];
    state.taskComplete = state.progress === 1;
    state.finding = findings[index];

    stage.dataset.progress = state.progress.toFixed(4);
    stage.dataset.chapter = state.activeChapter;
    stage.dataset.complete = String(state.taskComplete);
    stage.dataset.source = state.progressSource;
    shell.setAttribute('aria-label', `Incident case file. ${chapterNames[index]} chapter, ${Math.round(state.progress * 100)} percent read. Wheel, drag vertically, or use arrow keys.`);
    chapterControls.forEach((control, controlIndex) => {
      const active = controlIndex === index;
      control.classList.toggle('is-active', active);
      control.setAttribute('aria-pressed', String(active));
    });
    cards.forEach((card, cardIndex) => {
      const active = cardIndex === index;
      card.classList.toggle('is-active', active);
      if (active) card.setAttribute('aria-current', 'step');
      else card.removeAttribute('aria-current');
      card.dataset.readState = cardIndex < index ? 'read' : active ? 'current' : 'ahead';
    });

    reviewStatus.textContent = state.taskComplete ? 'Resolved · Review complete' : `Reading · 0${index + 1} ${chapterNames[index]}`;
    chapterCount.textContent = `0${index + 1} / 04`;
    progressLabel.textContent = `${String(Math.round(state.progress * 100)).padStart(2, '0')}% read`;
    findingLabel.textContent = state.taskComplete ? 'Final result' : 'Current finding';
    findingValue.textContent = findings[index];
    restartButton.disabled = state.progress === 0;
    progressRail.setAttribute('aria-valuenow', String(Math.round(state.progress * 100)));
  }

  function setProgress(rawProgress, source) {
    const next = rounded(rawProgress);
    const changed = Math.abs(next - state.progress) > .000001;
    if (changed) state.progressMutationCount += 1;
    state.progress = next;
    state.progressSource = source;
    state.lastBoundary = null;
    syncMotion();
    syncInterface();
    return changed;
  }

  function rebuildControls() {
    [...cardMotion, ...detailMotion, progressMotion].filter(Boolean).forEach(control => control.cancel());
    cards.forEach(card => { card.style.transform = ''; });
    cardBodies.forEach(body => {
      body.style.transform = '';
      body.style.opacity = '';
    });
    progressFill.style.transform = '';

    cardMotion = cards.map((card, index) => animate(card, {
      scaleX: [1, .975 - index * .004],
      filter: ['saturate(1)', 'saturate(.82) brightness(.82)'],
    }, {
      duration: 1,
      ease: 'linear',
      autoplay: false,
    }));
    detailMotion = cardBodies.map(body => animate(body, {
      opacity: [1, .08],
      y: [0, -7],
    }, {
      duration: 1,
      ease: 'linear',
      autoplay: false,
    }));
    progressMotion = animate(progressFill, { scaleX: [0, 1] }, {
      duration: 1,
      ease: 'linear',
      autoplay: false,
    });
    [...cardMotion, ...detailMotion, progressMotion].forEach(control => control.pause());

    state.scrollSpan = Math.max(0, shell.scrollHeight - shell.clientHeight);
    state.layoutMeasureCount += 1;
    state.controlRebuildCount += 1;
    state.motionControlCount = cardMotion.length + detailMotion.length + 1;
    state.motionDurations = [...cardMotion, ...detailMotion, progressMotion].map(control => control.duration);
    state.cardStickyCount = cards.filter(card => getComputedStyle(card).position === 'sticky').length;
    syncMotion();
    syncInterface();
  }

  function normalizedWheelDelta(event) {
    const scale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? Math.max(80, shell.clientHeight)
        : 1;
    return event.deltaY * scale;
  }

  stage.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX) || Math.abs(event.deltaY) < .2) return;
    if (!recordInput('wheel', event)) return;
    const delta = normalizedWheelDelta(event);
    const direction = Math.sign(delta);
    const atStart = state.progress <= .000001 && direction < 0;
    const atEnd = state.progress >= .999999 && direction > 0;
    state.lastWheelDefaultPrevented = false;

    if (atStart || atEnd) {
      state.wheelBoundaryReleaseCount += 1;
      state.lastBoundary = atStart ? 'start' : 'end';
      if (atStart) state.startBoundaryReleaseCount += 1;
      else state.endBoundaryReleaseCount += 1;
      syncInterface();
      return;
    }

    event.preventDefault();
    state.lastWheelDefaultPrevented = true;
    state.wheelConsumedCount += 1;
    const target = reducedMotion.matches
      ? (activeIndexFor(state.progress) + direction) / 3
      : state.progress + Math.max(-.18, Math.min(.18, delta / Math.max(420, state.scrollSpan * 1.25)));
    setProgress(target, 'wheel');
  }, { passive: false });

  document.addEventListener('pointerdown', event => {
    latestPointerType = event.pointerType || 'mouse';
  }, { capture: true });

  shell.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || dragSession) return;
    event.preventDefault();
    shell.focus({ preventScroll: true });
    const pointerType = event.pointerType || latestPointerType || 'mouse';
    if (!recordInput(pointerType, event)) return;
    dragSession = {
      pointerId: event.pointerId,
      pointerType,
      startY: event.clientY,
      startProgress: state.progress,
    };
    shell.setPointerCapture(event.pointerId);
    state.pointerCaptured = true;
    state.activePointerId = event.pointerId;
    state.activePointerType = pointerType;
    state.pointerCaptureCount += 1;
  });

  shell.addEventListener('pointermove', event => {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    event.preventDefault();
    if (!recordInput(dragSession.pointerType, event)) return;
    state.dragUpdateCount += 1;
    const distance = dragSession.startY - event.clientY;
    let target = dragSession.startProgress + distance / Math.max(90, shell.clientHeight * 1.45);
    if (reducedMotion.matches) target = Math.round(clamp(target) * 3) / 3;
    setProgress(target, `${dragSession.pointerType}-drag`);
  });

  function finishPointer(event, cancelled = false) {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    const shouldRelease = shell.hasPointerCapture?.(event.pointerId);
    dragSession = null;
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.activePointerType = null;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (shouldRelease) shell.releasePointerCapture(event.pointerId);
    syncInterface();
  }

  shell.addEventListener('pointerup', event => finishPointer(event));
  shell.addEventListener('pointercancel', event => finishPointer(event, true));
  shell.addEventListener('lostpointercapture', event => {
    if (dragSession?.pointerId === event.pointerId) finishPointer(event, true);
  });

  chapterControls.forEach((control, index) => {
    control.addEventListener('click', event => {
      const kind = event.detail === 0 ? 'keyboard' : latestPointerType;
      if (!recordInput(kind, event)) return;
      state.chapterSelectionCount += 1;
      setProgress(Number(control.dataset.progress), `${kind}-chapter-${chapterIds[index]}`);
      control.focus({ preventScroll: true });
    });
  });

  restartButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : latestPointerType;
    if (!recordInput(kind, event)) return;
    state.restartCount += 1;
    setProgress(0, `${kind}-restart`);
    shell.focus({ preventScroll: true });
  });

  stage.addEventListener('keydown', event => {
    if (event.repeat) return;
    const chapterStep = 1 / 3;
    const keySteps = reducedMotion.matches
      ? { ArrowUp: -chapterStep, ArrowLeft: -chapterStep, ArrowDown: chapterStep, ArrowRight: chapterStep, PageUp: -chapterStep, PageDown: chapterStep }
      : { ArrowUp: -.08, ArrowLeft: -.08, ArrowDown: .08, ArrowRight: .08, PageUp: -chapterStep, PageDown: chapterStep };
    let target = null;
    if (event.key in keySteps) target = state.progress + keySteps[event.key];
    else if (event.key === 'Home' || event.key === 'r' || event.key === 'R') target = 0;
    else if (event.key === 'End') target = 1;
    else if (['1', '2', '3', '4'].includes(event.key)) target = (Number(event.key) - 1) / 3;
    if (target === null) return;
    event.preventDefault();
    if (!recordInput('keyboard', event)) return;
    state.keyboardSeekCount += 1;
    if (reducedMotion.matches && event.key in keySteps) {
      target = (activeIndexFor(state.progress) + Math.sign(keySteps[event.key])) / 3;
    }
    const changed = setProgress(target, `keyboard-${event.key}`);
    if (!changed && (target <= 0 || target >= 1)) state.keyboardBoundaryCount += 1;
  });

  const scheduleRebuild = () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      rebuildControls();
    });
  };
  addEventListener('resize', scheduleRebuild);
  new ResizeObserver(scheduleRebuild).observe(shell);

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches) setProgress(activeIndexFor(state.progress) / 3, 'reduced-motion-snap');
    else syncInterface();
  });

  function render() {
    state.renderCount += 1;
    syncInterface();
  }

  rebuildControls();
  const nextFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.resolve(document.fonts?.ready)
    .then(nextFrames)
    .then(() => {
      rebuildControls();
      const before = `${state.progress}|${state.activeIndex}|${state.progressMutationCount}|${state.compressionTimes.join(',')}|${shell.scrollTop}`;
      return nextFrames().then(() => {
        const after = `${state.progress}|${state.activeIndex}|${state.progressMutationCount}|${state.compressionTimes.join(',')}|${shell.scrollTop}`;
        state.initialStaticVerified = before === after
          && state.progress === 0
          && state.progressMutationCount === 0
          && state.inputCount === 0
          && state.compressionTimes.every(time => time === 0);
        if (!state.initialStaticVerified) throw new Error(`Sticky review initial frame changed without human input: ${before} -> ${after}.`);
      });
    });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    const controls = [...cardMotion, ...detailMotion, progressMotion];
    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const activeRect = cards[state.activeIndex].getBoundingClientRect();
    const computedCards = cards.map(card => getComputedStyle(card));
    const motionEvidence = controls.length === 9 && controls.every(control =>
      typeof control.play === 'function'
      && typeof control.pause === 'function'
      && typeof control.cancel === 'function'
      && control.duration >= 0
      && control.duration <= 1
    );
    const registrationEvidence = state.scrollRegistrationError <= 1
      && Math.abs(state.progressControlTime - state.progress) <= .001
      && state.compressionTimes.every((time, index) => Math.abs(time - clamp(state.progress * 3 - index)) <= .001)
      && state.detailTimes.every((time, index) => Math.abs(time - clamp(clamp(state.progress * 3 - index) * 2.4)) <= .001);
    const inputEvidence = state.inputCount === state.wheelInputCount + state.pointerInputCount + state.keyboardInputCount
      && state.touchInputCount + state.penInputCount <= state.pointerInputCount
      && state.wheelConsumedCount + state.wheelBoundaryReleaseCount === state.wheelInputCount
      && state.wheelBoundaryReleaseCount === state.startBoundaryReleaseCount + state.endBoundaryReleaseCount
      && state.pointerReleaseCount + state.pointerCancelCount <= state.pointerCaptureCount;
    const boundaryEvidence = state.lastBoundary === null
      || state.lastBoundary === 'start' && state.progress === 0 && state.lastWheelDefaultPrevented === false
      || state.lastBoundary === 'end' && state.progress === 1 && state.lastWheelDefaultPrevented === false;
    const uiEvidence = chapterControls.filter(control => control.getAttribute('aria-pressed') === 'true').length === 1
      && chapterControls[state.activeIndex].dataset.chapter === state.activeChapter
      && cards.filter(card => card.getAttribute('aria-current') === 'step').length === 1
      && cards[state.activeIndex].dataset.chapter === state.activeChapter
      && progressRail.getAttribute('aria-valuenow') === String(Math.round(state.progress * 100))
      && restartButton.disabled === (state.progress === 0)
      && findingValue.textContent === state.finding
      && stage.dataset.complete === String(state.taskComplete);
    const viewportEvidence = stageRect.left >= -.5
      && stageRect.top >= -.5
      && stageRect.right <= innerWidth + .5
      && stageRect.bottom <= innerHeight + .5
      && shellRect.left >= stageRect.left
      && shellRect.top >= stageRect.top
      && shellRect.right <= stageRect.right
      && shellRect.bottom <= stageRect.bottom
      && activeRect.left >= shellRect.left - 1
      && activeRect.right <= shellRect.right + 1
      && activeRect.top < shellRect.bottom
      && activeRect.bottom > shellRect.top
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;
    const stickyEvidence = computedCards.every(style => style.position === 'sticky')
      && cards.every((card, index) => card.style.getPropertyValue('--index') === String(index));
    const reducedEvidence = !state.reducedMotion || Math.abs(state.progress * 3 - Math.round(state.progress * 3)) <= .00001;

    return typeof animate === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && window.__PREVIEW_META__?.capture === 'real-demo'
      && stage.dataset.previewMechanism === 'motion-user-scrubbed-sticky-incident-review'
      && state.task === 'incident-review-card-stack'
      && state.userInputRequired === true
      && state.scrollSpan > 0
      && state.cardStickyCount === 4
      && state.motionControlCount === 9
      && motionEvidence
      && registrationEvidence
      && inputEvidence
      && boundaryEvidence
      && uiEvidence
      && viewportEvidence
      && stickyEvidence
      && reducedEvidence
      && state.progress >= 0
      && state.progress <= 1
      && state.activeIndex === activeIndexFor(state.progress)
      && state.activeChapter === chapterIds[state.activeIndex]
      && state.taskComplete === (state.progress === 1)
      && state.pointerCaptured === (dragSession !== null)
      && state.initialFrameStatic
      && state.initialStaticVerified
      && state.automaticProgress === false
      && state.automaticPlayback === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.previewClockDriven === false
      && state.syntheticInputDispatch === false
      && state.userOwnedProgress === true
      && state.controlsBuiltWithoutAutoplay === true
      && state.boundaryPolicy === 'release-outward-wheel-at-0-and-1'
      && state.acceptedInputs.join('|') === 'wheel|mouse|touch|pen|keyboard|chapter-control'
      && state.reducedMotionDiscreteNavigation
      && state.layoutMeasureCount >= 2
      && state.controlRebuildCount >= 2
      && state.renderCount > 0;
  };

  ready.catch(markPreviewFailure);
  installPreviewController({
    id: 'sticky-card-stack-accumulation',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
