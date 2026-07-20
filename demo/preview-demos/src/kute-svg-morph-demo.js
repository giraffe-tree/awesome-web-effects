import KUTE from 'kute.js';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#shortlist-stage');
  const stayCard = document.querySelector('#stay-card');
  const control = document.querySelector('#save-control');
  const morphPath = document.querySelector('#morph-path');
  const saveLabel = document.querySelector('#save-label');
  const saveDetail = document.querySelector('#save-detail');
  const countReadout = document.querySelector('#count-readout');
  const stateNote = document.querySelector('#state-note');
  const availability = document.querySelector('#availability');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const addPath = 'M26 8 H34 V26 H52 V34 H34 V52 H26 V34 H8 V26 H26 Z';
  const savedPath = 'M7 30 L15 22 L25 32 L45 11 L53 19 L25 47 Z';
  const duration = 680;

  if (!stage || !stayCard || !control || !morphPath) {
    throw new Error('Shortlist morph DOM is incomplete.');
  }

  const state = {
    saved: false,
    targetSaved: false,
    phase: 'idle-unsaved',
    motionActive: false,
    morphProgress: 0,
    activeDirection: 'idle',
    renderedShape: 'add',
    shortlistCount: 0,
    lastInput: 'none',
    inputCount: 0,
    clickCount: 0,
    keyboardCount: 0,
    pointerActivationCount: 0,
    forwardMorphCount: 0,
    reverseMorphCount: 0,
    reducedMotion: reducedMotionQuery.matches,
    stageFocused: false,
    pointerInside: false,
    controlFocused: false,
    initialStaticConfirmed: false,
    automaticPlayback: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    inputAdapters: ['click', 'keyboard', 'pointer'],
    kuteVersion: KUTE.Version,
    durationMs: duration,
    sourcePath: addPath,
    targetPath: savedPath,
    normalizedPointCount: 0,
    renderCount: 0
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  const prototypeTween = KUTE.fromTo(morphPath, { path: addPath }, { path: savedPath }, {
    duration,
    easing: 'easingCubicInOut',
    morphPrecision: 4
  });
  prototypeTween.start(0);
  prototypeTween.pause();
  prototypeTween.update(0);
  state.normalizedPointCount = prototypeTween.valuesStart.path.polygon.length;

  let activeTween = null;
  let startedAt = 0;

  const syncInterface = saved => {
    state.saved = saved;
    state.targetSaved = saved;
    state.phase = saved ? 'idle-saved' : 'idle-unsaved';
    state.motionActive = false;
    state.morphProgress = saved ? 1 : 0;
    state.activeDirection = 'idle';
    state.renderedShape = saved ? 'check' : 'add';
    state.shortlistCount = saved ? 1 : 0;
    activeTween = null;

    stayCard.dataset.saved = String(saved);
    control.disabled = false;
    control.setAttribute('aria-pressed', String(saved));
    control.removeAttribute('aria-busy');
    saveLabel.textContent = saved ? 'Saved to shortlist' : 'Add to shortlist';
    saveDetail.textContent = saved ? 'Field House · Autumn list' : 'Easy to undo before booking';
    countReadout.textContent = `${saved ? '01' : '00'} / 04 saved`;
    stateNote.textContent = saved ? 'Shortlisted' : 'Not saved';
    availability.innerHTML = saved
      ? '<b>SHORTLISTED</b> · dates and rate retained'
      : '<b>AVAILABLE</b> · held for another 12 minutes';
  };

  const createTween = targetSaved => KUTE.fromTo(
    morphPath,
    { path: targetSaved ? addPath : savedPath },
    { path: targetSaved ? savedPath : addPath },
    {
      duration,
      easing: 'easingCubicInOut',
      morphPrecision: 4,
      onUpdate() {
        const linearProgress = Math.min(1, Math.max(0, (performance.now() - startedAt) / duration));
        state.morphProgress = targetSaved ? linearProgress : 1 - linearProgress;
      },
      onComplete() {
        syncInterface(targetSaved);
      }
    }
  );

  const recordInput = source => {
    state.inputCount += 1;
    state.lastInput = source;
    if (source.startsWith('keyboard')) state.keyboardCount += 1;
    if (source.startsWith('click')) state.clickCount += 1;
    if (source.startsWith('pointer')) state.pointerActivationCount += 1;
  };

  const setSaved = (nextSaved, source) => {
    if (state.motionActive || nextSaved === state.saved) return;
    recordInput(source);
    state.targetSaved = nextSaved;
    state.phase = nextSaved ? 'saving' : 'removing';
    state.motionActive = !state.reducedMotion;
    state.activeDirection = nextSaved ? 'forward' : 'reverse';
    if (nextSaved) state.forwardMorphCount += 1;
    else state.reverseMorphCount += 1;

    control.disabled = !state.reducedMotion;
    control.setAttribute('aria-busy', 'true');
    saveLabel.textContent = nextSaved ? 'Adding to shortlist…' : 'Removing from list…';
    saveDetail.textContent = nextSaved ? 'Preserving this stay and rate' : 'Your other options stay unchanged';
    stateNote.textContent = nextSaved ? 'Saving' : 'Removing';

    activeTween?.stop();
    activeTween = createTween(nextSaved);
    startedAt = performance.now();

    if (state.reducedMotion) {
      activeTween.start(0);
      activeTween.pause();
      activeTween.update(duration);
    } else {
      activeTween.start();
    }
  };

  const toggleSaved = source => setSaved(!state.saved, source);

  control.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') state.pointerActivationCount += 1;
  });

  control.addEventListener('click', event => {
    const source = event.detail === 0
      ? 'keyboard:control'
      : event.pointerType ? `pointer:${event.pointerType}` : 'click:control';
    toggleSaved(source);
  });

  control.addEventListener('focus', () => { state.controlFocused = true; });
  control.addEventListener('blur', () => { state.controlFocused = false; });
  stage.addEventListener('focus', () => { state.stageFocused = true; });
  stage.addEventListener('blur', event => {
    if (!stage.contains(event.relatedTarget)) state.stageFocused = false;
  });
  stage.addEventListener('pointerenter', () => { state.pointerInside = true; });
  stage.addEventListener('pointerleave', () => { state.pointerInside = false; });

  stage.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target === stage) {
      event.preventDefault();
      toggleSaved(`keyboard:${event.key === ' ' ? 'Space' : 'Enter'}`);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setSaved(true, 'keyboard:ArrowRight');
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'Escape') {
      if (!state.saved && !state.motionActive) return;
      event.preventDefault();
      if (state.motionActive) {
        activeTween?.stop();
        morphPath.setAttribute('d', addPath);
        state.reverseMorphCount += 1;
        recordInput(`keyboard:${event.key}`);
        syncInterface(false);
      } else {
        setSaved(false, `keyboard:${event.key}`);
      }
    }
  });

  const handleReducedMotionChange = event => {
    state.reducedMotion = event.matches;
    if (!event.matches || !state.motionActive || !activeTween) return;
    activeTween.pause();
    activeTween.update(duration);
  };

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  } else {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`compact-svg-shape-tween: ${message}`);
    };
    const iconRect = morphPath.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();
    const stayRect = stayCard.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const normalizedStart = prototypeTween.valuesStart.path.polygon;
    const normalizedEnd = prototypeTween.valuesEnd.path.polygon;

    invariant(KUTE.Version === '2.2.6' && state.kuteVersion === KUTE.Version, 'KUTE.js version contract changed');
    invariant(prototypeTween instanceof KUTE.Tween && prototypeTween._duration === duration, 'real KUTE tween is missing');
    invariant(normalizedStart.length === normalizedEnd.length && normalizedStart.length === state.normalizedPointCount, 'KUTE path normalization diverged');
    invariant(prototypeTween.valuesEnd.path.original === savedPath && addPath !== savedPath, 'morph target is not the saved-state path');
    invariant(state.automaticPlayback === false && state.automaticFallback === false, 'automatic progression must remain disabled');
    invariant(state.syntheticInputDispatch === false, 'synthetic input dispatch must remain disabled');
    invariant(state.inputAdapters.join('|') === 'click|keyboard|pointer', 'input adapter contract changed');
    invariant(control.getAttribute('aria-pressed') === String(state.saved), 'accessible saved state is stale');
    invariant(stayCard.dataset.saved === String(state.saved), 'card saved state is stale');
    invariant(state.shortlistCount === (state.saved ? 1 : 0), 'shortlist count is stale');
    invariant(state.motionActive || state.renderedShape === (state.saved ? 'check' : 'add'), 'stable shape semantics are stale');
    invariant(iconRect.width > 0 && iconRect.height > 0 && controlRect.width > 0 && controlRect.height > 0, 'morph control must remain visible');
    invariant(stayRect.left >= stageRect.left && stayRect.right <= stageRect.right + .5 && stayRect.top >= stageRect.top && stayRect.bottom <= stageRect.bottom + .5, 'stay card escaped the preview');
    invariant(control.type === 'button' && stage.tabIndex === 0, 'click and keyboard paths must remain accessible');
    invariant(state.inputCount > 0 || (state.initialStaticConfirmed && state.phase === 'idle-unsaved' && state.morphProgress === 0), 'initial frame must remain strictly static');
    return true;
  };

  syncInterface(false);

  const doubleFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.resolve(document.fonts?.ready)
    .then(doubleFrame)
    .then(() => {
      const before = `${morphPath.getAttribute('d')}|${saveLabel.textContent}|${state.phase}`;
      return doubleFrame().then(() => {
        const after = `${morphPath.getAttribute('d')}|${saveLabel.textContent}|${state.phase}`;
        state.initialStaticConfirmed = before === after
          && state.phase === 'idle-unsaved'
          && state.morphProgress === 0
          && !state.motionActive;
        if (!state.initialStaticConfirmed) throw new Error('Initial shortlist decision changed without user input.');
        if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial SVG morph assertion failed.');
      });
    });

  ready.catch(markPreviewFailure);

  installPreviewController({
    id: 'compact-svg-shape-tween',
    library: 'kute.js@2.2.6',
    renderer: 'svg',
    render: () => { state.renderCount += 1; },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
