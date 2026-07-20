import { animate, stagger } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#annotation-stage');
  const shell = document.querySelector('#review-shell');
  const page = document.querySelector('#document-page');
  const phrases = [...document.querySelectorAll('.selectable-phrase')];
  const overlay = document.querySelector('#annotation-overlay');
  const strokes = [...document.querySelectorAll('.annotation-stroke')];
  const replayButton = document.querySelector('#replay-button');
  const resetButton = document.querySelector('#reset-button');
  const commentLabel = document.querySelector('#comment-label');
  const commentTitle = document.querySelector('#comment-title');
  const commentCopy = document.querySelector('#comment-copy');
  const geometryValue = document.querySelector('#geometry-value');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !shell || !page || phrases.length !== 4 || !overlay || strokes.length !== 2 || !replayButton || !resetButton || !commentLabel || !commentTitle || !commentCopy || !geometryValue) {
    throw new Error('Live annotation review DOM is incomplete');
  }

  const phraseById = new Map(phrases.map(phrase => [phrase.dataset.phraseId, phrase]));
  const counterKeys = [
    'inputCount',
    'pointerInputCount',
    'keyboardInputCount',
    'touchInputCount',
    'selectionCount',
    'reselectionCount',
    'sameSelectionReplayCount',
    'replayCount',
    'resetButtonCount',
    'escapeResetCount',
    'resetCount',
    'keyboardNavigationCount',
    'keyboardSelectCount',
    'keyboardShortcutReplayCount',
    'geometryMeasureCount',
    'geometryRevision',
    'layoutSyncCount',
    'motionStartCount',
    'motionCompleteCount',
    'motionCancelCount',
    'reducedMotionDirectCount',
    'motionRevision',
    'renderCount',
  ];

  const state = {
    id: 'animated-hand-drawn-semantic-annotation',
    automaticRehearsal: false,
    automaticReplay: false,
    previewClockDriven: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    phase: 'idle',
    selectedPhraseId: null,
    selectedPhraseText: null,
    selectionRect: null,
    overlayRect: null,
    geometrySource: 'none',
    geometryValidated: false,
    annotationVisible: false,
    animationActive: false,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    touchInputCount: 0,
    selectionCount: 0,
    reselectionCount: 0,
    sameSelectionReplayCount: 0,
    replayCount: 0,
    resetButtonCount: 0,
    escapeResetCount: 0,
    resetCount: 0,
    keyboardNavigationCount: 0,
    keyboardSelectCount: 0,
    keyboardShortcutReplayCount: 0,
    geometryMeasureCount: 0,
    geometryRevision: 0,
    layoutSyncCount: 0,
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
  let lastPointerType = 'mouse';

  const nextFrames = (count = 2) => new Promise(resolve => {
    const advance = remaining => {
      if (remaining <= 0) resolve();
      else requestAnimationFrame(() => advance(remaining - 1));
    };
    advance(count);
  });

  const roundRect = rect => ({
    left: Number(rect.left.toFixed(3)),
    top: Number(rect.top.toFixed(3)),
    width: Number(rect.width.toFixed(3)),
    height: Number(rect.height.toFixed(3)),
    right: Number(rect.right.toFixed(3)),
    bottom: Number(rect.bottom.toFixed(3)),
  });

  const closeEnough = (a, b, tolerance = .8) => Math.abs(a - b) <= tolerance;

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

  const phraseRangeRect = phrase => {
    const range = document.createRange();
    range.selectNodeContents(phrase);
    const rect = range.getBoundingClientRect();
    range.detach();
    return rect;
  };

  const stopMotions = () => {
    if (state.animationActive) state.motionCancelCount += 1;
    for (const motion of motions) motion.stop();
    motions = [];
    state.animationActive = false;
    strokes.forEach(stroke => {
      stroke.style.opacity = '1';
      stroke.style.strokeDashoffset = '0';
    });
  };

  const setStrokeGeometry = (width, height, strokeWidth) => {
    const inset = Math.max(.8, strokeWidth * .7);
    const right = width - inset;
    const bottom = height - inset;
    strokes[0].setAttribute('d', [
      `M ${inset} ${height * .53}`,
      `C ${width * .05} ${height * .06}, ${width * .78} ${-height * .02}, ${right} ${height * .38}`,
      `C ${width * 1.03} ${height * .84}, ${width * .24} ${height * 1.05}, ${inset} ${height * .60}`,
    ].join(' '));
    strokes[1].setAttribute('d', [
      `M ${inset * 1.35} ${height * .61}`,
      `C ${width * .10} ${height * .14}, ${width * .86} ${height * .02}, ${right - inset * .2} ${height * .45}`,
      `C ${width * .94} ${bottom}, ${width * .18} ${bottom * 1.02}, ${inset * 1.35} ${height * .61}`,
    ].join(' '));
    strokes.forEach(stroke => {
      stroke.style.strokeWidth = `${strokeWidth}px`;
      stroke.setAttribute('pathLength', '1');
    });
  };

  const measureSelection = () => {
    const phrase = phraseById.get(state.selectedPhraseId);
    if (!phrase) return false;

    const textRect = phraseRangeRect(phrase);
    const pageRect = page.getBoundingClientRect();
    const paddingX = Math.max(2, Math.min(9, textRect.height * .72));
    const paddingY = Math.max(1.5, Math.min(7, textRect.height * .48));
    const left = textRect.left - pageRect.left - paddingX;
    const top = textRect.top - pageRect.top - paddingY;
    const width = textRect.width + paddingX * 2;
    const height = textRect.height + paddingY * 2;
    const strokeWidth = Math.max(.55, Math.min(2.1, textRect.height * .15));

    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
    overlay.setAttribute('width', String(width));
    overlay.setAttribute('height', String(height));
    overlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
    overlay.dataset.targetId = state.selectedPhraseId;
    overlay.dataset.active = 'true';
    setStrokeGeometry(width, height, strokeWidth);

    const overlayRect = overlay.getBoundingClientRect();
    state.selectionRect = roundRect(textRect);
    state.overlayRect = roundRect(overlayRect);
    state.geometrySource = 'Range.getBoundingClientRect';
    state.geometryMeasureCount += 1;
    state.geometryRevision += 1;
    state.geometryValidated = overlayRect.left <= textRect.left + .5
      && overlayRect.top <= textRect.top + .5
      && overlayRect.right >= textRect.right - .5
      && overlayRect.bottom >= textRect.bottom - .5
      && textRect.width > 0
      && textRect.height > 0;
    state.annotationVisible = true;
    geometryValue.textContent = `x ${Math.round(textRect.left)} · y ${Math.round(textRect.top)} · ${textRect.width.toFixed(1)}×${textRect.height.toFixed(1)} px`;
    return state.geometryValidated;
  };

  const runDraw = async cause => {
    if (state.animationActive) stopMotions();
    const revision = ++state.motionRevision;
    state.phase = 'drawing';
    strokes.forEach(stroke => {
      stroke.style.opacity = '0';
      stroke.style.strokeDasharray = '1';
      stroke.style.strokeDashoffset = '1';
    });

    if (state.reducedMotion) {
      strokes.forEach(stroke => {
        stroke.style.opacity = '1';
        stroke.style.strokeDashoffset = '0';
      });
      state.reducedMotionDirectCount += 1;
      state.phase = 'marked';
      return;
    }

    state.motionStartCount += 1;
    state.animationActive = true;
    const drawing = animate(strokes, {
      pathLength: [0, 1],
      opacity: [0, 1],
    }, {
      duration: .58,
      delay: stagger(.08),
      ease: [.22, 1, .36, 1],
    });
    motions = [drawing];
    await Promise.allSettled(motions.map(motion => motion.finished));
    if (revision !== state.motionRevision) return;
    motions = [];
    state.animationActive = false;
    state.motionCompleteCount += 1;
    state.phase = 'marked';
    void cause;
  };

  const updateSelectionUi = () => {
    const phrase = phraseById.get(state.selectedPhraseId);
    phrases.forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === phrase)));
    replayButton.disabled = !phrase;
    resetButton.disabled = !phrase;
    if (!phrase) return;
    const index = phrases.indexOf(phrase) + 1;
    commentLabel.textContent = `Phrase 0${index}`;
    commentTitle.textContent = `“${phrase.dataset.label}”`;
    commentCopy.textContent = 'Marked from this phrase’s current live text bounds. Choose another phrase to move the annotation.';
  };

  const selectPhrase = (id, cause) => {
    const phrase = phraseById.get(id);
    if (!phrase) return;
    const previousId = state.selectedPhraseId;
    if (previousId === id) {
      state.sameSelectionReplayCount += 1;
      state.replayCount += 1;
    } else {
      if (previousId) state.reselectionCount += 1;
      else state.selectionCount += 1;
      state.selectedPhraseId = id;
      state.selectedPhraseText = phrase.dataset.label;
    }
    updateSelectionUi();
    measureSelection();
    void runDraw(cause);
  };

  const replaySelection = cause => {
    if (!state.selectedPhraseId) return;
    state.replayCount += 1;
    measureSelection();
    void runDraw(cause);
  };

  const resetAnnotation = () => {
    if (state.animationActive) stopMotions();
    state.selectedPhraseId = null;
    state.selectedPhraseText = null;
    state.selectionRect = null;
    state.overlayRect = null;
    state.geometrySource = 'none';
    state.geometryValidated = false;
    state.annotationVisible = false;
    state.phase = 'idle';
    state.resetCount += 1;
    overlay.dataset.active = 'false';
    delete overlay.dataset.targetId;
    strokes.forEach(stroke => {
      stroke.style.opacity = '0';
      stroke.style.strokeDashoffset = '1';
    });
    phrases.forEach(phrase => phrase.setAttribute('aria-pressed', 'false'));
    replayButton.disabled = true;
    resetButton.disabled = true;
    commentLabel.textContent = 'No selection';
    commentTitle.textContent = 'Choose a phrase worth returning to.';
    commentCopy.textContent = 'Select highlighted text in the draft. The hand-drawn mark will use that phrase’s live text rectangle.';
    geometryValue.textContent = 'Waiting for selection';
  };

  document.addEventListener('pointerdown', event => {
    lastPointerType = event.pointerType || 'mouse';
  }, { capture: true });

  phrases.forEach((phrase, index) => {
    phrase.addEventListener('click', event => {
      const kind = event.detail === 0 ? 'keyboard' : 'pointer';
      if (!recordInput(kind, event, `${kind === 'keyboard' ? 'keyboard' : lastPointerType}-select-${phrase.dataset.phraseId}`)) return;
      if (kind === 'keyboard') state.keyboardSelectCount += 1;
      selectPhrase(phrase.dataset.phraseId, `${kind}-selection`);
    });

    phrase.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      if (!recordInput('keyboard', event, `keyboard-${event.key.toLowerCase()}-reselect`)) return;
      const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const nextIndex = (index + direction + phrases.length) % phrases.length;
      state.keyboardNavigationCount += 1;
      phrases[nextIndex].focus({ preventScroll: true });
      selectPhrase(phrases[nextIndex].dataset.phraseId, 'keyboard-navigation-selection');
    });
  });

  replayButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!recordInput(kind, event, `${kind === 'keyboard' ? 'keyboard' : lastPointerType}-replay-button`)) return;
    replaySelection('replay-button');
  });

  resetButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!recordInput(kind, event, `${kind === 'keyboard' ? 'keyboard' : lastPointerType}-reset-button`)) return;
    state.resetButtonCount += 1;
    resetAnnotation();
  });

  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'r' && state.selectedPhraseId) {
      event.preventDefault();
      if (!recordInput('keyboard', event, 'keyboard-r-replay')) return;
      state.keyboardShortcutReplayCount += 1;
      replaySelection('keyboard-shortcut');
      return;
    }

    if (event.key !== 'Escape' || !state.selectedPhraseId) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, 'escape-reset')) return;
    state.escapeResetCount += 1;
    resetAnnotation();
    if (phrases.includes(document.activeElement)) document.activeElement.blur();
  });

  window.addEventListener('resize', () => {
    if (!state.selectedPhraseId) return;
    state.layoutSyncCount += 1;
    measureSelection();
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (state.animationActive) stopMotions();
    if (state.selectedPhraseId) {
      strokes.forEach(stroke => {
        stroke.style.opacity = '1';
        stroke.style.strokeDashoffset = '0';
      });
      state.phase = 'marked';
    }
  });

  strokes.forEach(stroke => {
    stroke.style.opacity = '0';
    stroke.style.strokeDasharray = '1';
    stroke.style.strokeDashoffset = '1';
  });

  const ready = (async () => {
    await document.fonts.ready;
    await nextFrames();
    const phraseRectsValid = phrases.every(phrase => {
      const rect = phraseRangeRect(phrase);
      return rect.width > 0 && rect.height > 0;
    });
    state.initialStaticVerified = phraseRectsValid
      && state.selectedPhraseId === null
      && overlay.dataset.active === 'false'
      && state.inputCount === 0
      && state.geometryMeasureCount === 0
      && state.motionStartCount === 0
      && state.motionCompleteCount === 0
      && state.phase === 'idle';
  })();

  const render = () => {
    state.renderCount += 1;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();

    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    const selectedPhrase = phraseById.get(state.selectedPhraseId);
    const selectedCount = phrases.filter(phrase => phrase.getAttribute('aria-pressed') === 'true').length;
    let selectedGeometryValid = true;
    let overlayContainsSelection = true;
    let pathGeometryValid = true;

    if (selectedPhrase) {
      const currentRect = phraseRangeRect(selectedPhrase);
      const currentOverlayRect = overlay.getBoundingClientRect();
      selectedGeometryValid = state.selectionRect
        && closeEnough(state.selectionRect.left, currentRect.left)
        && closeEnough(state.selectionRect.top, currentRect.top)
        && closeEnough(state.selectionRect.width, currentRect.width)
        && closeEnough(state.selectionRect.height, currentRect.height)
        && state.overlayRect
        && closeEnough(state.overlayRect.left, currentOverlayRect.left)
        && closeEnough(state.overlayRect.top, currentOverlayRect.top)
        && closeEnough(state.overlayRect.width, currentOverlayRect.width)
        && closeEnough(state.overlayRect.height, currentOverlayRect.height);
      overlayContainsSelection = currentOverlayRect.left <= currentRect.left + .5
        && currentOverlayRect.top <= currentRect.top + .5
        && currentOverlayRect.right >= currentRect.right - .5
        && currentOverlayRect.bottom >= currentRect.bottom - .5;
      pathGeometryValid = strokes.every(stroke => stroke.getTotalLength() > currentRect.width * 1.3);
    }

    const selectionSemanticsValid = selectedPhrase
      ? selectedCount === 1
        && selectedPhrase.getAttribute('aria-pressed') === 'true'
        && overlay.dataset.active === 'true'
        && overlay.dataset.targetId === state.selectedPhraseId
        && !replayButton.disabled
        && !resetButton.disabled
        && state.geometrySource === 'Range.getBoundingClientRect'
        && state.geometryValidated
        && state.annotationVisible
        && (state.animationActive || state.phase === 'marked')
      : selectedCount === 0
        && overlay.dataset.active === 'false'
        && replayButton.disabled
        && resetButton.disabled
        && state.selectionRect === null
        && state.overlayRect === null
        && state.geometrySource === 'none'
        && !state.annotationVisible
        && state.phase === 'idle';
    const phrasesWithinPage = phrases.every(phrase => {
      const rect = phrase.getBoundingClientRect();
      return rect.left >= pageRect.left - 1
        && rect.top >= pageRect.top - 1
        && rect.right <= pageRect.right + 1
        && rect.bottom <= pageRect.bottom + 1;
    });
    const countersValid = counterKeys.every(key => Number.isInteger(state[key]) && state[key] >= 0)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.touchInputCount <= state.pointerInputCount
      && state.motionCompleteCount <= state.motionStartCount;
    const viewportValid = shellRect.left >= -1
      && shellRect.top >= -1
      && shellRect.right <= innerWidth + 1
      && shellRect.bottom <= innerHeight + 1
      && stageRect.width <= innerWidth + 1
      && stageRect.height <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;

    return typeof animate === 'function'
      && typeof stagger === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && phrases.length === 4
      && strokes.length === 2
      && state.automaticRehearsal === false
      && state.automaticReplay === false
      && state.previewClockDriven === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.initialStaticVerified
      && selectionSemanticsValid
      && selectedGeometryValid
      && overlayContainsSelection
      && pathGeometryValid
      && phrasesWithinPage
      && countersValid
      && viewportValid
      && state.renderCount > 0;
  };

  window.addEventListener('beforeunload', () => {
    for (const motion of motions) motion.stop();
  }, { once: true });

  installPreviewController({
    id: 'animated-hand-drawn-semantic-annotation',
    library: 'motion@12.42.2',
    renderer: 'svg',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
