import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const previewStage = document.querySelector('#word-reader-stage');
  const stage = document.querySelector('#word-stage');
  const wordLine = document.querySelector('#word-line');
  const words = [...document.querySelectorAll('.word-line span')];
  const rail = document.querySelector('#word-progress');
  const progressLabel = document.querySelector('#progress-label');
  const chapterLabel = document.querySelector('#chapter-label');
  const chapterDots = [...document.querySelectorAll('.chapter-dots i')];
  const readerState = document.querySelector('#reader-state');
  const readerStateLabel = document.querySelector('#reader-state-label');
  const expectedWords = ['TEAMS', 'MOVED', 'FASTER', 'WHEN', 'EVERY', 'HANDOFF', 'ENDED', 'WITH', 'ONE', 'VISIBLE,', 'SHARED', 'DECISION.'];
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const round = value => Number(value.toFixed(4));
  const wordStep = .052;
  const revealWindow = .428;

  const state = {
    id: 'scrubbed-word-blur-rotate-reveal',
    task: 'human-scrubs-field-note-conclusion-to-stable-readable-copy',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'paused-motion-word-controls-map-trusted-wheel-drag-or-keyboard-progress-to-ordered-blur-rotate-reveal-and-retain-the-human-selected-reading-position',
    assetStrategy: 'dom-typography-and-motion-filters-no-functional-raster-input-required',
    acceptedInputs: ['trusted-wheel', 'trusted-mouse-touch-or-pen-drag', 'keyboard-arrows', 'keyboard-page-home-end'],
    causality: 'trusted-human-input-directly-controls-progress',
    userInputRequired: true,
    automaticPlayback: false,
    automaticProgress: false,
    automaticReset: false,
    automaticFallback: false,
    previewClockIgnored: true,
    syntheticInputDispatch: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    untrustedMutationCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    wheelInputCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    progressInputCount: 0,
    progressMutationCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    activePointerId: null,
    pointerCaptured: false,
    dragAnchor: null,
    progress: 0,
    progressPercent: 0,
    minimumProgress: 0,
    maximumProgress: 0,
    revealedWordCount: 0,
    completedWordCount: 0,
    currentChapter: 1,
    phase: 'idle-blurred',
    result: 'awaiting-human-reading-input',
    resultRetained: false,
    complete: false,
    completionCount: 0,
    wordCount: words.length,
    wordOrder: words.map(word => word.textContent.trim()),
    expectedWordOrder: expectedWords,
    wordOrderVerified: false,
    wordProgress: Array(words.length).fill(0),
    progressSignature: '0.0000:' + Array(words.length).fill('0.000').join(','),
    firstMutationBefore: null,
    firstMutationAfter: null,
    inputRecords: [],
    initialProgress: 0,
    initialSignature: null,
    initialStillVerified: false,
    renderCount: 0,
    applyCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    surfaceWidth: 0,
    surfaceHeight: 0,
    surfaceCoverageRatio: 0,
    fullStageGeometryVerified: false,
    motionControlsReady: false,
    fontsReady: false,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__SCRUBBED_WORD_REVEAL_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`scrubbed-word-blur-rotate-reveal: ${message}`);
  }

  const controls = words.map(word => {
    const control = animate(word, {
      opacity: [.16, 1],
      y: [10, 0],
      rotate: [6, 0],
      filter: ['blur(5px)', 'blur(0px)']
    }, { duration: 1, ease: [.22, 1, .36, 1] });
    control.pause();
    return control;
  });
  const railMotion = animate(rail, { scaleX: [0, 1] }, { duration: 1, ease: 'linear' });
  railMotion.pause();
  state.motionControlsReady = [...controls, railMotion].every(control => typeof control.pause === 'function' && control.duration === 1);
  state.wordOrderVerified = state.wordOrder.length === expectedWords.length && state.wordOrder.every((word, index) => word === expectedWords[index]);

  function signatureFor(progress, wordProgress) {
    return `${progress.toFixed(4)}:${wordProgress.map(value => value.toFixed(3)).join(',')}`;
  }

  function updateGeometry() {
    const stageRect = previewStage.getBoundingClientRect();
    const surfaceRect = stage.getBoundingClientRect();
    state.stageWidth = Math.round(stageRect.width);
    state.stageHeight = Math.round(stageRect.height);
    state.surfaceWidth = Math.round(surfaceRect.width);
    state.surfaceHeight = Math.round(surfaceRect.height);
    state.surfaceCoverageRatio = Number(((surfaceRect.width * surfaceRect.height) / Math.max(1, stageRect.width * stageRect.height)).toFixed(4));
    state.fullStageGeometryVerified = Math.abs(stageRect.left - surfaceRect.left) <= 1
      && Math.abs(stageRect.top - surfaceRect.top) <= 1
      && Math.abs(stageRect.right - surfaceRect.right) <= 1
      && Math.abs(stageRect.bottom - surfaceRect.bottom) <= 1
      && state.surfaceCoverageRatio >= .995;
  }

  function updateInterface() {
    progressLabel.textContent = `${String(state.progressPercent).padStart(2, '0')}%`;
    if (state.progress < .34) {
      state.currentChapter = 1;
      chapterLabel.textContent = '01 · SIGNAL';
    } else if (state.progress < .68) {
      state.currentChapter = 2;
      chapterLabel.textContent = '02 · ROUTE';
    } else {
      state.currentChapter = 3;
      chapterLabel.textContent = '03 · DECISION';
    }
    chapterDots.forEach((dot, index) => { dot.dataset.active = String(index + 1 <= state.currentChapter); });
    readerState.dataset.complete = String(state.complete);
    if (state.complete) readerStateLabel.textContent = 'Conclusion clear';
    else if (state.progress > 0) readerStateLabel.textContent = `${state.revealedWordCount} / ${state.wordCount} words`;
    else readerStateLabel.textContent = 'Scroll to read';
  }

  function applyProgress(nextProgress, source = 'initial') {
    const progress = round(clamp(nextProgress));
    const before = state.progress;
    const localProgress = controls.map((control, index) => {
      const value = clamp((progress - index * wordStep) / revealWindow);
      control.time = value;
      return round(value);
    });
    railMotion.time = progress;
    state.progress = progress;
    state.progressPercent = Math.round(progress * 100);
    state.minimumProgress = Math.min(state.minimumProgress, progress);
    state.maximumProgress = Math.max(state.maximumProgress, progress);
    state.wordProgress = localProgress;
    state.revealedWordCount = localProgress.filter(value => value >= .12).length;
    state.completedWordCount = localProgress.filter(value => value >= .999).length;
    state.progressSignature = signatureFor(progress, localProgress);
    state.complete = progress >= .999 && state.completedWordCount === words.length;
    if (state.complete) {
      if (state.phase !== 'complete-retained') state.completionCount += 1;
      state.phase = 'complete-retained';
      state.result = 'field-note-conclusion-fully-readable';
      state.resultRetained = true;
    } else if (progress > 0) {
      state.phase = 'human-scrubbing';
      state.result = 'human-selected-reading-progress';
      state.resultRetained = true;
    } else {
      state.phase = 'idle-blurred';
      state.result = 'awaiting-human-reading-input';
      state.resultRetained = false;
    }
    if (source !== 'initial' && before !== progress) {
      state.progressMutationCount += 1;
      if (state.firstMutationBefore === null) state.firstMutationBefore = before;
      if (state.firstMutationAfter === null) state.firstMutationAfter = progress;
    }
    state.applyCount += 1;
    updateInterface();
    updateGeometry();
    return before !== progress;
  }

  function rejectUntrusted(event) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedInputCount += 1;
    state.lastInputKind = `rejected-${event?.type || 'unknown'}`;
    state.lastInputTrusted = false;
    return true;
  }

  function acceptTrusted(event, source, category) {
    if (rejectUntrusted(event)) return null;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = source;
    state.lastInputTrusted = true;
    if (source === 'wheel') state.wheelInputCount += 1;
    else if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (event.pointerType === 'touch') state.touchInputCount += 1;
      if (event.pointerType === 'pen') state.penInputCount += 1;
    }
    if (category === 'progress') {
      state.progressInputCount += 1;
      if (source === 'pointer-drag') state.pointerMoveCount += 1;
    }
    const record = {
      source,
      category,
      trusted: true,
      progressBefore: state.progress,
      progressAfter: state.progress,
      mutated: false
    };
    state.inputRecords.push(record);
    state.inputRecords = state.inputRecords.slice(-96);
    return record;
  }

  function commitInput(record, nextProgress) {
    if (!record) return;
    record.mutated = applyProgress(nextProgress, record.source);
    record.progressAfter = state.progress;
  }

  stage.addEventListener('wheel', event => {
    const record = acceptTrusted(event, 'wheel', 'progress');
    if (!record) return;
    event.preventDefault();
    const delta = clamp(event.deltaY / 560, -.34, .34);
    commitInput(record, state.progress + delta);
  }, { passive: false });

  stage.addEventListener('pointerdown', event => {
    const record = acceptTrusted(event, 'pointer-start', 'gesture');
    if (!record) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    state.dragAnchor = { y: event.clientY, progress: state.progress };
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
  });

  stage.addEventListener('pointermove', event => {
    if (state.activePointerId !== event.pointerId || !state.dragAnchor) return;
    const record = acceptTrusted(event, 'pointer-drag', 'progress');
    if (!record) return;
    event.preventDefault();
    const distance = state.dragAnchor.y - event.clientY;
    commitInput(record, state.dragAnchor.progress + distance / Math.max(90, stage.clientHeight * .72));
  });

  function finishPointer(event) {
    if (state.activePointerId !== event.pointerId) return;
    const record = acceptTrusted(event, 'pointer-end', 'gesture');
    if (!record) return;
    event.preventDefault();
    state.pointerUpCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerReleaseCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.dragAnchor = null;
  }
  stage.addEventListener('pointerup', finishPointer);
  stage.addEventListener('pointercancel', finishPointer);

  stage.addEventListener('keydown', event => {
    const increments = {
      ArrowRight: .12,
      ArrowDown: .12,
      PageDown: .28,
      ' ': .2,
      ArrowLeft: -.12,
      ArrowUp: -.12,
      PageUp: -.28
    };
    const direct = event.key === 'End' ? 1 : event.key === 'Home' ? 0 : null;
    if (!(event.key in increments) && direct === null) return;
    const record = acceptTrusted(event, 'keyboard-progress', 'progress');
    if (!record) return;
    event.preventDefault();
    commitInput(record, direct ?? state.progress + increments[event.key]);
  });

  let initialRenderSignature = null;
  function render() {
    state.renderCount += 1;
    updateGeometry();
    if (state.inputCount === 0) {
      const signature = state.progressSignature;
      if (initialRenderSignature === null) initialRenderSignature = signature;
      else state.initialStillVerified = signature === initialRenderSignature
        && state.progress === state.initialProgress
        && state.progressMutationCount === 0;
    }
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.fontsReady && state.motionControlsReady, 'Motion controls or fonts are not ready');
    invariant(state.wordCount === expectedWords.length && state.wordOrderVerified, 'word order differs from the authored conclusion');
    invariant(state.wordOrder.every((word, index) => word === expectedWords[index]), 'live word order changed');
    invariant(state.fullStageGeometryVerified && state.surfaceCoverageRatio >= .995, 'reader surface does not cover the full stage');
    invariant(state.automaticPlayback === false && state.automaticProgress === false && state.automaticReset === false && state.automaticFallback === false, 'automatic reading progress is forbidden');
    invariant(state.previewClockIgnored === true && state.syntheticInputDispatch === false, 'preview clock or synthetic dispatch controls progress');
    invariant(state.untrustedMutationCount === 0, 'untrusted input mutated reading progress');
    invariant(state.inputCount === state.trustedInputCount, 'trusted input accounting diverged');
    invariant(state.wheelInputCount + state.pointerInputCount + state.keyboardInputCount === state.inputCount, 'input modality accounting diverged');
    invariant(state.touchInputCount + state.penInputCount <= state.pointerInputCount, 'pointer subtype accounting diverged');
    invariant(state.inputRecords.every(record => record.trusted === true), 'an accepted input record is not trusted');
    invariant(state.progress >= 0 && state.progress <= 1 && state.maximumProgress >= state.progress, 'reading progress is out of bounds');
    invariant(state.wordProgress.length === words.length && state.wordProgress.every(value => value >= 0 && value <= 1), 'word progress is out of bounds');
    invariant(state.wordProgress.every((value, index) => index === 0 || value <= state.wordProgress[index - 1]), 'words were not revealed in authored order');
    invariant(state.revealedWordCount <= words.length && state.completedWordCount <= state.revealedWordCount, 'word reveal accounting diverged');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial frame was not verified still');

    if (state.progressInputCount > 0) {
      invariant(state.progressMutationCount > 0 && state.firstMutationBefore !== state.firstMutationAfter, 'trusted progress input did not move the reading position');
      invariant(state.inputRecords.some(record => record.category === 'progress' && record.mutated && record.progressBefore !== record.progressAfter), 'no trusted input directly changed progress');
      invariant(state.resultRetained && state.progress > 0, 'human-selected reading progress was not retained');
    }
    if (state.complete) {
      const finalStyles = words.map(word => getComputedStyle(word));
      invariant(state.progress === 1 && state.progressPercent === 100, 'complete result has incorrect progress');
      invariant(state.phase === 'complete-retained' && state.result === 'field-note-conclusion-fully-readable', 'complete result is inconsistent');
      invariant(state.completedWordCount === words.length && state.wordProgress.every(value => value === 1), 'not every word is fully revealed');
      invariant(state.completionCount >= 1 && state.currentChapter === 3, 'completion/chapter evidence is missing');
      invariant(finalStyles.every(style => Number(style.opacity) >= .99 && style.filter === 'blur(0px)'), 'final DOM words are not fully legible');
      invariant([...wordLine.children].map(word => word.textContent.trim()).join(' ') === expectedWords.join(' '), 'final readable sentence changed');
    }
    return true;
  };

  Promise.resolve(document.fonts.ready).then(() => {
    state.fontsReady = true;
    applyProgress(0, 'initial');
    state.initialSignature = state.progressSignature;
    state.ready = true;
  });

  installPreviewController({
    id: 'scrubbed-word-blur-rotate-reveal',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
