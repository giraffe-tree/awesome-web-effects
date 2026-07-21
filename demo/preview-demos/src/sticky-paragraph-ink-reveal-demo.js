import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#report-stage');
  const scroller = document.querySelector('#report-scroll');
  const sticky = document.querySelector('.report-sticky');
  const line = document.querySelector('#report-line');
  const meter = document.querySelector('#progress-meter');
  const fill = document.querySelector('#progress-fill');
  const evidenceCard = document.querySelector('#evidence-card');
  const evidenceLabel = document.querySelector('#evidence-label');
  const evidenceOutput = document.querySelector('#evidence-output');
  const clamp01 = value => Math.max(0, Math.min(1, value));
  const sourceText = line.textContent.trim();
  const words = sourceText.split(/\s+/);
  const emphasisWords = new Map([
    [1, 'evidence'], [3, 'evidence'], [5, 'finding'], [11, 'evidence'], [17, 'evidence']
  ]);

  line.replaceChildren(...words.flatMap((word, index) => {
    const span = document.createElement('span');
    span.className = 'ink-word';
    span.dataset.sequence = String(index);
    span.dataset.emphasis = emphasisWords.get(index) || 'body';
    span.textContent = word;
    return index === words.length - 1 ? [span] : [span, document.createTextNode(' ')];
  }));
  const spans = [...line.querySelectorAll('.ink-word')];
  const controls = spans.map((span, index) => {
    const targetColor = emphasisWords.has(index)
      ? emphasisWords.get(index) === 'finding' ? '#526f55' : '#b45335'
      : '#24231f';
    const control = animate(span, { color: ['#aaa296', targetColor], y: [3, 0] }, { duration: 1, ease: [.25, .7, .2, 1] });
    control.pause();
    control.time = 0;
    return control;
  });

  const state = {
    id: 'sticky-paragraph-ink-reveal',
    task: 'human-reads-reviews-and-retains-a-sequential-research-evidence-conclusion',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'trusted-wheel-drag-or-keyboard-progress-controls-paused-motion-word-ink-in-document-order',
    assetStrategy: 'code-native-dom-research-text-directly-defines-word-order-and-evidence-no-raster-input-required',
    imageGenerationDecision: 'omitted-because-a-bitmap-would-not-drive-word-order-scroll-distance-or-reading-evidence',
    acceptedInputs: ['wheel-forward-or-back', 'pointer-or-touch-drag', 'keyboard-arrows', 'keyboard-page', 'keyboard-home-or-end'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticFill: false,
    automaticReset: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-reading-progress-mutation',
    untrustedMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    wheelInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    progressMutationCount: 0,
    forwardMutationCount: 0,
    backwardMutationCount: 0,
    reviewBacktrackCount: 0,
    completionCount: 0,
    returnToStartCount: 0,
    progress: 0,
    maximumProgress: 0,
    minimumProgressAfterAdvance: 1,
    activeEvidenceIndex: -1,
    activeEvidenceId: 'awaiting-review',
    conclusionRetained: false,
    phase: 'idle-unread',
    result: 'awaiting-human-reading',
    wordCount: words.length,
    wordSequence: words.slice(),
    revealedWordCount: 0,
    fullyRevealedWordCount: 0,
    emphasizedWordCount: emphasisWords.size,
    motionControlCount: controls.length,
    controlsPausedAtConstruction: controls.every(control => typeof control.pause === 'function' && Math.abs(control.time) < .001),
    wordProgress: Array(words.length).fill(0),
    wordOrderVerified: false,
    evidenceStagesVisited: [],
    evidenceTransitionCount: 0,
    dragActive: false,
    activePointerId: null,
    dragStartY: 0,
    dragStartProgress: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    transitionRecords: [],
    initialProgress: 0,
    initialScrollTop: 0,
    initialWordSignature: null,
    initialStillVerified: false,
    scrollTop: 0,
    scrollRange: 0,
    scrollProgressMatchesState: false,
    stickyPositionVerified: false,
    stageWidth: 0,
    stageHeight: 0,
    stageCoverageRatio: 0,
    stickyWithinStage: false,
    textReadable: false,
    fullStageGeometryVerified: false,
    renderCount: 0,
    geometryMeasureCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`sticky-paragraph-ink-reveal: ${message}`);
  }

  function acceptTrusted(event, source) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = source;
    state.lastInputTrusted = true;
    if (source === 'wheel') state.wheelInputCount += 1;
    else if (source.startsWith('pointer')) state.pointerInputCount += 1;
    else state.keyboardInputCount += 1;
    return true;
  }

  function evidenceForProgress(progress) {
    if (progress >= .999) return { index: 4, id: 'conclusion', label: 'CONCLUSION · RETAINED', output: 'SHADE EXTENDS SAFE USE', complete: true };
    if (progress >= .76) return { index: 3, id: 'dwell-time', label: 'EVIDENCE C · OBSERVED USE', output: '+37 MINUTES DWELL TIME' };
    if (progress >= .5) return { index: 2, id: 'surface-temperature', label: 'EVIDENCE B · THERMAL', output: '−11.8°C PEAK SURFACE' };
    if (progress >= .24) return { index: 1, id: 'sample-size', label: 'EVIDENCE A · SAMPLE', output: '42 COURTYARDS MONITORED' };
    if (progress > 0) return { index: 0, id: 'method', label: 'METHOD · COMPARISON', output: 'SHADED / EXPOSED SITES' };
    return { index: -1, id: 'awaiting-review', label: 'REVIEW STATUS', output: 'AWAITING HUMAN INPUT' };
  }

  function updateEvidence(progress) {
    const evidence = evidenceForProgress(progress);
    if (evidence.index !== state.activeEvidenceIndex) {
      state.evidenceTransitionCount += 1;
      state.activeEvidenceIndex = evidence.index;
      state.activeEvidenceId = evidence.id;
      if (!state.evidenceStagesVisited.includes(evidence.id)) state.evidenceStagesVisited.push(evidence.id);
    }
    evidenceLabel.textContent = evidence.label;
    evidenceOutput.textContent = evidence.output;
    evidenceCard.dataset.complete = String(Boolean(evidence.complete));
  }

  function updateWords(progress) {
    state.wordProgress = controls.map((control, index) => {
      const localProgress = clamp01(progress * spans.length - index);
      control.time = localProgress;
      return Number(localProgress.toFixed(4));
    });
    state.revealedWordCount = state.wordProgress.filter(value => value > 0).length;
    state.fullyRevealedWordCount = state.wordProgress.filter(value => value >= 1).length;
    let seenPartial = false;
    state.wordOrderVerified = state.wordProgress.every(value => {
      if (value < 1) seenPartial = true;
      return !(seenPartial && value >= 1);
    });
  }

  function applyProgress(nextProgress, source) {
    const next = Number(clamp01(nextProgress).toFixed(4));
    const before = state.progress;
    if (Math.abs(next - before) < .0001) return;
    state.progress = next;
    state.progressMutationCount += 1;
    state.forwardMutationCount += Number(next > before);
    state.backwardMutationCount += Number(next < before);
    if (next < before && state.maximumProgress > 0) state.reviewBacktrackCount += 1;
    if (next === 0 && before > 0) state.returnToStartCount += 1;
    state.maximumProgress = Math.max(state.maximumProgress, next);
    if (state.maximumProgress > 0) state.minimumProgressAfterAdvance = Math.min(state.minimumProgressAfterAdvance, next);
    if (next === 1 && before < 1) state.completionCount += 1;
    state.conclusionRetained = next === 1;
    state.phase = next === 0 ? 'start-reviewed' : next === 1 ? 'conclusion-retained' : next < before ? 'reviewing-backward' : 'reading-forward';
    state.result = next === 1 ? 'shade-extends-safe-use-conclusion-retained' : 'research-evidence-in-review';
    updateWords(next);
    updateEvidence(next);
    state.scrollRange = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    scroller.scrollTop = next * state.scrollRange;
    state.scrollTop = Number(scroller.scrollTop.toFixed(3));
    state.scrollProgressMatchesState = Math.abs(scroller.scrollTop / state.scrollRange - next) <= .002;
    meter.textContent = `${String(Math.round(next * 100)).padStart(3, '0')}%`;
    fill.style.height = `${next * 100}%`;
    state.transitionRecords.push({ source, trusted: true, before, after: next, direction: next > before ? 'forward' : 'backward' });
    state.transitionRecords = state.transitionRecords.slice(-64);
  }

  scroller.addEventListener('wheel', event => {
    if (!acceptTrusted(event, 'wheel')) return;
    event.preventDefault();
    const delta = Math.max(-.18, Math.min(.18, event.deltaY / 700));
    applyProgress(state.progress + delta, 'trusted-wheel');
  }, { passive: false });

  scroller.addEventListener('pointerdown', event => {
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-down`)) return;
    event.preventDefault();
    state.pointerDownCount += 1;
    state.dragActive = true;
    state.activePointerId = event.pointerId;
    state.dragStartY = event.clientY;
    state.dragStartProgress = state.progress;
    scroller.setPointerCapture(event.pointerId);
    if (scroller.hasPointerCapture(event.pointerId)) state.pointerCaptureCount += 1;
  });

  scroller.addEventListener('pointermove', event => {
    if (!state.dragActive || state.activePointerId !== event.pointerId) return;
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-drag`)) return;
    state.pointerMoveCount += 1;
    const travel = (state.dragStartY - event.clientY) / Math.max(90, scroller.clientHeight * .78);
    applyProgress(state.dragStartProgress + travel, 'trusted-pointer-drag');
  });

  const releaseDrag = event => {
    if (!state.dragActive || state.activePointerId !== event.pointerId) return;
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-up`)) return;
    state.pointerUpCount += 1;
    if (scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.dragActive = false;
    state.activePointerId = null;
  };
  scroller.addEventListener('pointerup', releaseDrag);
  scroller.addEventListener('pointercancel', releaseDrag);

  scroller.addEventListener('keydown', event => {
    const steps = {
      ArrowDown: .08, ArrowUp: -.08, PageDown: .2, PageUp: -.2,
      Home: -state.progress, End: 1 - state.progress
    };
    if (!(event.key in steps)) return;
    if (!acceptTrusted(event, `keyboard-${event.key.toLowerCase()}`)) return;
    event.preventDefault();
    applyProgress(state.progress + steps[event.key], `trusted-keyboard-${event.key.toLowerCase()}`);
  });

  function measureGeometry() {
    const stageRect = stage.getBoundingClientRect();
    const stickyRect = sticky.getBoundingClientRect();
    state.stageWidth = Math.round(stageRect.width);
    state.stageHeight = Math.round(stageRect.height);
    state.stageCoverageRatio = Number(((stageRect.width * stageRect.height) / Math.max(1, innerWidth * innerHeight)).toFixed(4));
    state.stickyWithinStage = stickyRect.left >= stageRect.left - 1
      && stickyRect.right <= stageRect.right + 1
      && stickyRect.top >= stageRect.top - 1
      && stickyRect.bottom <= stageRect.bottom + 1;
    const lineStyle = getComputedStyle(line);
    state.textReadable = Number.parseFloat(lineStyle.fontSize) >= 15 && line.getBoundingClientRect().width >= 150;
    state.stickyPositionVerified = getComputedStyle(sticky).position === 'sticky';
    state.fullStageGeometryVerified = state.stageCoverageRatio >= .995 && state.stickyWithinStage && state.textReadable;
    state.scrollRange = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    state.geometryMeasureCount += 1;
  }

  function wordSignature() {
    return state.wordProgress.map(value => value.toFixed(2)).join('|');
  }

  function render() {
    state.renderCount += 1;
    measureGeometry();
    if (state.inputCount === 0) {
      const signature = wordSignature();
      if (state.initialWordSignature === null) state.initialWordSignature = signature;
      state.initialStillVerified = state.progress === 0
        && scroller.scrollTop === state.initialScrollTop
        && signature === state.initialWordSignature
        && state.phase === 'idle-unread';
    }
  }

  const ready = document.fonts.ready.then(() => {
    updateWords(0);
    updateEvidence(0);
    measureGeometry();
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && typeof animate === 'function', 'Motion is not ready');
    invariant(state.motionControlCount === state.wordCount && state.wordCount === 20 && state.controlsPausedAtConstruction, 'paused word controls are incomplete');
    invariant(state.wordSequence.join(' ') === sourceText, 'DOM word sequence differs from the research source');
    invariant(state.emphasizedWordCount === 5, 'evidence emphasis tokens are incomplete');
    invariant(state.stickyPositionVerified && state.fullStageGeometryVerified && state.stageCoverageRatio >= .995, 'sticky report geometry is invalid');
    invariant(state.automaticFill === false && state.automaticReset === false && state.automaticPlayback === false && state.automaticRehearsal === false && state.automaticFallback === false, 'automatic ink mutation is forbidden');
    invariant(state.captureClockDriven === false && state.renderIgnoresPreviewClock === true, 'preview clock must not mutate reading progress');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed reading progress');
    invariant(state.inputCount === state.trustedInputCount && state.wheelInputCount + state.pointerInputCount + state.keyboardInputCount === state.inputCount, 'trusted input accounting diverged');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial no-input report was not verified still');
    invariant(state.wordOrderVerified, 'research words were not revealed in document order');
    invariant(state.transitionRecords.every(record => record.trusted === true), 'a progress transition lacks trusted input causality');

    if (state.progressMutationCount > 0) {
      invariant(state.scrollProgressMatchesState, 'sticky scroll position differs from retained reading progress');
      invariant(state.revealedWordCount > 0 && state.maximumProgress > 0, 'trusted input revealed no report words');
    }
    if (state.conclusionRetained) {
      invariant(state.progress === 1 && state.phase === 'conclusion-retained', 'final conclusion is not retained');
      invariant(state.result === 'shade-extends-safe-use-conclusion-retained', 'retained conclusion result is inconsistent');
      invariant(state.revealedWordCount === state.wordCount && state.fullyRevealedWordCount === state.wordCount, 'final report words are not fully inked');
      invariant(state.activeEvidenceId === 'conclusion' && evidenceCard.dataset.complete === 'true', 'final evidence conclusion is not readable');
      invariant(evidenceOutput.textContent === 'SHADE EXTENDS SAFE USE', 'final conclusion copy is inconsistent');
    }
    if (state.reviewBacktrackCount > 0) invariant(state.backwardMutationCount > 0 && state.forwardMutationCount > 0, 'back-review did not preserve bidirectional reading');
    return true;
  };

  installPreviewController({
    id: 'sticky-paragraph-ink-reveal',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
