import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const SOURCE_REVISION = Object.freeze({
  id: 'source-v03',
  copy: 'without the noise.',
  label: 'V.03 source',
});

const TRANSITION_DURATION = 0.95;
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));

try {
  const stage = document.querySelector('#rewrite-stage');
  const workspace = document.querySelector('#review-workspace');
  const slot = document.querySelector('#rewrite-slot');
  const oldLine = document.querySelector('#rewrite-old');
  const newLine = document.querySelector('#rewrite-new');
  const marker = document.querySelector('#traveling-marker');
  const trail = document.querySelector('#marker-trail');
  const phaseCopy = document.querySelector('#phase-copy');
  const stateCopy = document.querySelector('#review-state-copy');
  const revisionCount = document.querySelector('#revision-count');
  const undoButton = document.querySelector('#undo-revision');
  const revisionButtons = [...document.querySelectorAll('[data-revision]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !workspace || !slot || !oldLine || !newLine || !marker || !trail || !phaseCopy || !stateCopy || !revisionCount || !undoButton || revisionButtons.length !== 3) {
    throw new Error('Headline revision workspace DOM is incomplete');
  }

  const revisions = new Map(revisionButtons.map(button => [button.dataset.revision, {
    id: button.dataset.revision,
    copy: button.dataset.copy,
    label: button.textContent.trim(),
    button,
  }]));

  const state = {
    id: 'traveling-dot-headline-rewriter',
    task: 'human-approved-headline-revision-with-finite-spatial-marker',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'measured-spatial-marker-erases-current-copy-visits-the-selected-revision-and-writes-the-approved-copy',
    assetStrategy: 'code-native-editorial-typography-no-functional-raster-input-required',
    captureType: 'hybrid',
    acceptedInputs: ['trusted-pointer-click', 'trusted-keyboard-activation', 'escape-undo', 'visible-revision-buttons', 'visible-undo-button'],
    causality: 'trusted-human-selection-starts-one-finite-seekable-transition',
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticLoop: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    previewClockMutationBeforeInput: false,
    previewClockDrivesFiniteTransitionAfterInput: true,
    transitionDuration: TRANSITION_DURATION,
    currentRevisionId: SOURCE_REVISION.id,
    currentCopy: SOURCE_REVISION.copy,
    targetRevisionId: SOURCE_REVISION.id,
    targetCopy: SOURCE_REVISION.copy,
    phase: 'draft',
    transitionActive: false,
    transitionProgress: 0,
    latestPreviewTime: 0,
    transitionStartTime: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    revisionSelectionCount: 0,
    undoCount: 0,
    transitionStartCount: 0,
    transitionCompleteCount: 0,
    reducedMotionDirectCount: 0,
    finiteTransitionStepCount: 0,
    motionControlCreateCount: 0,
    markerSeekCount: 0,
    textMutationCount: 0,
    resizeCount: 0,
    renderCount: 0,
    nonInputVisualMutationCountAfterReady: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    initialCopyChecksum: 0,
    currentCopyChecksum: 0,
    initialStaticVerified: false,
    geometryValidated: false,
    markerWithinWorkspace: false,
    motionControlReady: false,
    reducedMotion: reducedMotion.matches,
    ready: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__TRAVELING_DOT_REWRITER_STATE__ = state;

  let oldLetters = [];
  let newLetters = [];
  let markerMotion = null;
  let trailMotion = null;
  let activeRevision = SOURCE_REVISION;
  let pendingRevision = SOURCE_REVISION;
  let resizeFrame = 0;

  const nextFrames = (count = 2) => new Promise(resolve => {
    const advance = remaining => {
      if (remaining <= 0) resolve();
      else requestAnimationFrame(() => advance(remaining - 1));
    };
    advance(count);
  });

  const checksum = value => [...value].reduce((total, character, index) => (
    (Math.imul(total ^ character.codePointAt(0), 16777619) + index) >>> 0
  ), 2166136261) >>> 0;

  const splitLine = (element, copy) => {
    element.replaceChildren(...[...copy].map(character => {
      const span = document.createElement('span');
      span.className = 'rewrite-letter';
      span.textContent = character === ' ' ? '\u00a0' : character;
      return span;
    }));
    return [...element.children];
  };

  const setLetterReveal = (letters, progress, direction = 'forward') => {
    const count = letters.length;
    const edge = clamp(progress) * count;
    letters.forEach((letter, index) => {
      const orderedIndex = direction === 'forward' ? index : count - index - 1;
      const amount = clamp(edge - orderedIndex);
      letter.style.opacity = String(amount);
      letter.style.transform = `translateY(${(1 - amount) * -0.13}em)`;
    });
  };

  const setLineSemantics = (oldHidden, newHidden) => {
    oldLine.setAttribute('aria-hidden', String(oldHidden));
    newLine.setAttribute('aria-hidden', String(newHidden));
  };

  const localPoint = (rect, workspaceRect, xRatio, yRatio) => ({
    x: rect.left - workspaceRect.left + rect.width * xRatio - marker.offsetWidth / 2,
    y: rect.top - workspaceRect.top + rect.height * yRatio - marker.offsetHeight / 2,
  });

  const measuredPath = revision => {
    const workspaceRect = workspace.getBoundingClientRect();
    const oldRect = oldLine.getBoundingClientRect();
    const newRect = newLine.getBoundingClientRect();
    const choiceRect = revision.button?.getBoundingClientRect() || undoButton.getBoundingClientRect();
    const oldStart = localPoint(oldRect, workspaceRect, 0, .72);
    const oldEnd = localPoint(oldRect, workspaceRect, 1, .72);
    const choice = localPoint(choiceRect, workspaceRect, .14, .5);
    const newStart = localPoint(newRect, workspaceRect, 0, .72);
    const newEnd = localPoint(newRect, workspaceRect, 1, .72);
    return { oldStart, oldEnd, choice, newStart, newEnd };
  };

  const stopControls = () => {
    markerMotion?.stop();
    trailMotion?.stop();
    markerMotion = null;
    trailMotion = null;
    state.motionControlReady = false;
  };

  const createControls = revision => {
    stopControls();
    const path = measuredPath(revision);
    markerMotion = animate(marker, {
      x: [path.oldEnd.x, path.oldEnd.x, path.oldStart.x, path.choice.x, path.choice.x, path.newStart.x, path.newEnd.x, path.newEnd.x],
      y: [path.oldEnd.y, path.oldEnd.y, path.oldStart.y, path.choice.y, path.choice.y, path.newStart.y, path.newEnd.y, path.newEnd.y],
      scale: [1, 1.04, .82, 1.08, 1.08, .86, 1.02, 1],
    }, {
      duration: TRANSITION_DURATION,
      times: [0, .04, .25, .43, .5, .61, .92, 1],
      ease: 'linear',
    });
    trailMotion = animate(trail, {
      x: [path.oldEnd.x, path.oldEnd.x, path.oldStart.x, path.choice.x, path.choice.x, path.newStart.x, path.newEnd.x, path.newEnd.x],
      y: [path.oldEnd.y, path.oldEnd.y, path.oldStart.y, path.choice.y, path.choice.y, path.newStart.y, path.newEnd.y, path.newEnd.y],
      opacity: [0, .55, .4, .75, .2, .55, .35, 0],
      scaleX: [.25, .8, .55, 1, .3, .7, .5, .2],
    }, {
      duration: TRANSITION_DURATION,
      times: [0, .04, .25, .43, .5, .61, .92, 1],
      ease: 'linear',
    });
    markerMotion.pause();
    trailMotion.pause();
    markerMotion.time = 0;
    trailMotion.time = 0;
    state.motionControlCreateCount += 2;
    state.motionControlReady = true;
  };

  const updateControls = () => {
    revisionButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.revision === state.currentRevisionId));
      button.disabled = state.transitionActive;
    });
    undoButton.disabled = state.transitionActive || state.currentRevisionId === SOURCE_REVISION.id;
    revisionCount.textContent = `${state.revisionSelectionCount} ${state.revisionSelectionCount === 1 ? 'edit' : 'edits'}`;
  };

  const updatePhase = phase => {
    state.phase = phase;
    stage.dataset.phase = phase;
    const copy = {
      draft: ['Choose a revision', 'Draft awaiting decision'],
      erasing: ['Erasing current line', 'Applying approved edit'],
      collecting: ['Collecting revision', 'Marker traveling to selection'],
      writing: ['Writing approved line', 'Applying approved edit'],
      resolved: ['Revision applied', 'Headline approved'],
    }[phase];
    phaseCopy.textContent = copy[0];
    stateCopy.textContent = copy[1];
  };

  const applyStableState = revision => {
    activeRevision = revision;
    state.currentRevisionId = revision.id;
    state.currentCopy = revision.copy;
    state.currentCopyChecksum = checksum(revision.copy);
    state.targetRevisionId = revision.id;
    state.targetCopy = revision.copy;
    state.transitionActive = false;
    state.transitionProgress = 1;
    oldLetters = splitLine(oldLine, revision.copy);
    newLetters = splitLine(newLine, revision.copy);
    setLetterReveal(oldLetters, 1);
    setLetterReveal(newLetters, 0);
    setLineSemantics(false, true);
    createControls(revision);
    markerMotion.time = TRANSITION_DURATION;
    trailMotion.time = TRANSITION_DURATION;
    updatePhase(revision.id === SOURCE_REVISION.id ? 'draft' : 'resolved');
    updateControls();
  };

  const renderTransition = progress => {
    const p = clamp(progress);
    state.transitionProgress = p;
    state.finiteTransitionStepCount += 1;
    markerMotion.time = p * TRANSITION_DURATION;
    trailMotion.time = p * TRANSITION_DURATION;
    state.markerSeekCount += 2;

    const eraseProgress = clamp(p / .25);
    const writeProgress = clamp((p - .61) / .31);
    setLetterReveal(oldLetters, 1 - eraseProgress, 'forward');
    setLetterReveal(newLetters, writeProgress, 'forward');
    setLineSemantics(eraseProgress >= 1, writeProgress <= 0);

    if (p < .25) updatePhase('erasing');
    else if (p < .61) updatePhase('collecting');
    else updatePhase('writing');

    if (p >= 1) {
      state.transitionCompleteCount += 1;
      state.textMutationCount += 1;
      applyStableState(pendingRevision);
    }
  };

  const completeReducedTransition = () => {
    if (!state.transitionActive) return;
    state.reducedMotionDirectCount += 1;
    state.transitionCompleteCount += 1;
    state.textMutationCount += 1;
    applyStableState(pendingRevision);
  };

  const recordTrustedInput = (event, source) => {
    if (event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    const kind = event.detail === 0 || event.type === 'keydown' ? 'keyboard' : 'pointer';
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
    return true;
  };

  const beginTransition = (revision, source) => {
    if (state.transitionActive || revision.id === state.currentRevisionId) return false;
    pendingRevision = revision;
    state.targetRevisionId = revision.id;
    state.targetCopy = revision.copy;
    oldLetters = splitLine(oldLine, activeRevision.copy);
    newLetters = splitLine(newLine, revision.copy);
    setLetterReveal(oldLetters, 1);
    setLetterReveal(newLetters, 0);
    setLineSemantics(false, true);
    createControls(revision);
    state.transitionActive = true;
    state.transitionProgress = 0;
    state.transitionStartTime = state.latestPreviewTime;
    state.transitionStartCount += 1;
    state.lastTransitionSource = source;
    updateControls();
    renderTransition(0);
    return true;
  };

  revisionButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (!recordTrustedInput(event, `revision-${button.dataset.revision}`)) return;
      const revision = revisions.get(button.dataset.revision);
      if (revision.id === state.currentRevisionId || state.transitionActive) return;
      state.revisionSelectionCount += 1;
      beginTransition(revision, `revision-${revision.id}`);
    });
  });

  const requestUndo = (event, source) => {
    if (!recordTrustedInput(event, source)) return;
    if (state.transitionActive || state.currentRevisionId === SOURCE_REVISION.id) return;
    state.undoCount += 1;
    beginTransition(SOURCE_REVISION, source);
  };

  undoButton.addEventListener('click', event => requestUndo(event, 'undo-button'));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || state.currentRevisionId === SOURCE_REVISION.id || state.transitionActive) return;
    event.preventDefault();
    requestUndo(event, 'escape-undo');
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches) completeReducedTransition();
  });

  const updateGeometry = () => {
    const workspaceRect = workspace.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    state.geometryValidated = workspaceRect.width > innerWidth * .8
      && workspaceRect.height > innerHeight * .68
      && slotRect.width > workspaceRect.width * .35
      && slotRect.height > 0;
    if (state.transitionActive) createControls(pendingRevision);
    else createControls(activeRevision);
    markerMotion.time = state.transitionActive ? state.transitionProgress * TRANSITION_DURATION : TRANSITION_DURATION;
    trailMotion.time = state.transitionActive ? state.transitionProgress * TRANSITION_DURATION : TRANSITION_DURATION;
    const markerRect = marker.getBoundingClientRect();
    state.markerWithinWorkspace = markerRect.left >= workspaceRect.left - 1
      && markerRect.top >= workspaceRect.top - 1
      && markerRect.right <= workspaceRect.right + 1
      && markerRect.bottom <= workspaceRect.bottom + 1;
  };

  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.resizeCount += 1;
      updateGeometry();
    });
  });

  state.initialCopyChecksum = checksum(SOURCE_REVISION.copy);
  state.currentCopyChecksum = state.initialCopyChecksum;
  oldLetters = splitLine(oldLine, SOURCE_REVISION.copy);
  newLetters = splitLine(newLine, SOURCE_REVISION.copy);
  setLetterReveal(oldLetters, 1);
  setLetterReveal(newLetters, 0);
  setLineSemantics(false, true);
  updatePhase('draft');
  updateControls();

  const ready = (async () => {
    await document.fonts.ready;
    await nextFrames();
    updateGeometry();
    state.initialStaticVerified = state.currentCopy === SOURCE_REVISION.copy
      && state.currentCopyChecksum === state.initialCopyChecksum
      && state.inputCount === 0
      && state.transitionStartCount === 0
      && state.transitionCompleteCount === 0
      && state.phase === 'draft'
      && !state.transitionActive;
    state.ready = true;
  })();

  const render = time => {
    state.latestPreviewTime = Number.isFinite(time) ? time : state.latestPreviewTime;
    state.renderCount += 1;
    if (!state.transitionActive) return;
    if (state.reducedMotion) {
      completeReducedTransition();
      return;
    }
    const elapsed = Math.max(0, state.latestPreviewTime - state.transitionStartTime);
    renderTransition(elapsed / TRANSITION_DURATION);
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();
    updateGeometry();

    const workspaceRect = workspace.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const buttonsWithinWorkspace = revisionButtons.every(button => {
      const rect = button.getBoundingClientRect();
      return rect.left >= workspaceRect.left - 1
        && rect.top >= workspaceRect.top - 1
        && rect.right <= workspaceRect.right + 1
        && rect.bottom <= workspaceRect.bottom + 1;
    });
    const stateCountersValid = [
      'inputCount', 'trustedInputCount', 'rejectedUntrustedInputCount', 'pointerInputCount', 'keyboardInputCount',
      'revisionSelectionCount', 'undoCount', 'transitionStartCount', 'transitionCompleteCount',
      'reducedMotionDirectCount', 'finiteTransitionStepCount', 'motionControlCreateCount', 'markerSeekCount', 'textMutationCount', 'renderCount',
    ].every(key => Number.isInteger(state[key]) && state[key] >= 0);
    const transitionCountsValid = state.transitionCompleteCount <= state.transitionStartCount
      && state.trustedInputCount === state.inputCount
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.textMutationCount === state.transitionCompleteCount;
    const noOverflow = document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1
      && stageRect.width <= innerWidth + 1
      && stageRect.height <= innerHeight + 1;
    const stableCopyValid = state.transitionActive || (
      oldLine.textContent.replaceAll('\u00a0', ' ') === state.currentCopy
      && state.currentCopyChecksum === checksum(state.currentCopy)
      && oldLine.getAttribute('aria-hidden') === 'false'
      && newLine.getAttribute('aria-hidden') === 'true'
    );

    return typeof animate === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && state.claimedLibrary === 'motion@12.42.2'
      && state.assetStrategy === 'code-native-editorial-typography-no-functional-raster-input-required'
      && state.userInputRequired === true
      && state.strictTrustedInputGuard === true
      && state.initialFrameStatic === true
      && state.automaticCycle === false
      && state.automaticPlayback === false
      && state.automaticLoop === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.syntheticInputDispatch === false
      && state.previewClockMutationBeforeInput === false
      && state.initialStaticVerified
      && state.geometryValidated
      && state.markerWithinWorkspace
      && state.motionControlReady
      && state.motionControlCreateCount >= 2
      && state.renderCount > 0
      && stateCountersValid
      && transitionCountsValid
      && stableCopyValid
      && buttonsWithinWorkspace
      && noOverflow;
  };

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(resizeFrame);
    stopControls();
  }, { once: true });

  installPreviewController({
    id: 'traveling-dot-headline-rewriter',
    library: state.claimedLibrary,
    renderer: 'dom',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
