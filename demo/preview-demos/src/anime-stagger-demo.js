import { animate, stagger } from 'animejs';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#incident-board');
  const actionGrid = document.querySelector('#action-grid');
  const trigger = document.querySelector('#assemble-button');
  const cards = [...document.querySelectorAll('.action-card')];
  const planCount = document.querySelector('#plan-count');
  const selectionReadout = document.querySelector('#selection-readout');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const staggerDelay = stagger(64, { from: 'first' });
  const delays = cards.map((card, index) => staggerDelay(card, index, cards));
  const itemDuration = 560;
  const clamp = value => Math.min(1, Math.max(0, value));

  if (!stage || !actionGrid || !trigger || cards.length !== 8) {
    throw new Error('Incident response choreography DOM is incomplete.');
  }

  const tasks = cards.map((card, index) => ({
    index,
    id: card.dataset.action,
    title: card.querySelector('strong').textContent.trim(),
    owner: card.querySelector('.action-owner').textContent.trim(),
    band: card.dataset.band,
    outcome: card.dataset.outcome,
    delayMs: delays[index]
  }));

  const state = {
    mode: 'queued',
    assembled: false,
    motionActive: false,
    animationDirection: 'idle',
    animationProgress: 0,
    settledCount: 0,
    selectedIndex: -1,
    selectedTaskId: null,
    taskStates: Object.fromEntries(tasks.map(task => [task.id, 'queued'])),
    staggerStepMs: 64,
    staggerDelaysMs: [...delays],
    itemDurationMs: itemDuration,
    tasks,
    lastInput: 'none',
    inputCount: 0,
    clickCount: 0,
    keyboardCount: 0,
    pointerSelectionCount: 0,
    focusSelectionCount: 0,
    animationPlayCount: 0,
    resetCount: 0,
    stageFocused: false,
    pointerInside: false,
    reducedMotion: reducedMotionQuery.matches,
    initialStaticConfirmed: false,
    automaticPlayback: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    inputAdapters: ['click', 'keyboard', 'pointer-selection'],
    renderCount: 0
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  const entryOffset = () => {
    if (window.innerWidth <= 180 || window.innerHeight <= 105) return { x: 2, y: 3, opacity: .56 };
    if (window.innerWidth <= 420 || window.innerHeight <= 260) return { x: 5, y: 7, opacity: .4 };
    return { x: 10, y: 14, opacity: .28 };
  };
  const initialEntryOffset = entryOffset();

  const setSelected = (index, source, shouldFocus = false) => {
    if (!state.assembled || index < 0 || index >= cards.length) return;
    state.selectedIndex = index;
    state.selectedTaskId = tasks[index].id;
    state.lastInput = source;
    cards.forEach((card, cardIndex) => {
      card.dataset.selected = String(cardIndex === index);
    });
    const task = tasks[index];
    selectionReadout.innerHTML = `<span>${String(index + 1).padStart(2, '0')} · ${task.outcome}</span> ${task.owner} owns “${task.title}”.`;
    if (shouldFocus) cards[index].focus({ preventScroll: true });
  };

  const syncCardsToTime = time => {
    let readyCount = 0;
    cards.forEach((card, index) => {
      const localProgress = clamp((time - delays[index]) / itemDuration);
      const nextState = localProgress <= .001 ? 'queued' : localProgress < .78 ? 'arriving' : 'ready';
      card.dataset.state = nextState;
      card.querySelector('.action-state').textContent = nextState === 'queued'
        ? 'QUEUED'
        : nextState === 'arriving' ? 'ARRIVING' : tasks[index].outcome;
      card.tabIndex = nextState === 'ready' && state.assembled ? 0 : -1;
      state.taskStates[tasks[index].id] = nextState;
      if (nextState === 'ready') readyCount += 1;
    });
    state.settledCount = readyCount;
    planCount.textContent = `${String(readyCount).padStart(2, '0')} / 08 actions ready`;
  };

  const finishQueued = () => {
    state.mode = 'queued';
    state.assembled = false;
    state.motionActive = false;
    state.animationDirection = 'idle';
    state.animationProgress = 0;
    state.selectedIndex = -1;
    state.selectedTaskId = null;
    trigger.disabled = false;
    trigger.textContent = 'Assemble response';
    trigger.setAttribute('aria-pressed', 'false');
    trigger.removeAttribute('aria-busy');
    cards.forEach(card => { card.dataset.selected = 'false'; });
    syncCardsToTime(0);
    selectionReadout.innerHTML = '<span>Awaiting command.</span> Priority order is already resolved.';
  };

  const finishArmed = () => {
    state.mode = 'armed';
    state.assembled = true;
    state.motionActive = false;
    state.animationDirection = 'idle';
    state.animationProgress = 1;
    state.settledCount = cards.length;
    trigger.disabled = false;
    trigger.textContent = 'Clear response';
    trigger.setAttribute('aria-pressed', 'true');
    trigger.removeAttribute('aria-busy');
    syncCardsToTime(choreography.duration);
    cards.forEach(card => { card.tabIndex = 0; });
    if (state.selectedIndex < 0) setSelected(0, state.lastInput || 'assembled');
  };

  const choreography = animate(cards, {
    x: (_card, index) => ({ from: (index % 2 ? 1 : -1) * initialEntryOffset.x, to: 0 }),
    y: { from: initialEntryOffset.y, to: 0 },
    rotate: (_card, index) => ({ from: `${index % 2 ? 1.5 : -1.5}deg`, to: '0deg' }),
    scale: [
      { from: .965, to: 1.025, duration: 360 },
      { to: 1, duration: 200 }
    ],
    opacity: { from: initialEntryOffset.opacity, to: 1 },
    delay: staggerDelay,
    duration: itemDuration,
    ease: 'out(4)',
    autoplay: false,
    onUpdate: animation => {
      state.animationProgress = animation.progress;
      syncCardsToTime(animation.currentTime);
    },
    onComplete: animation => {
      if (animation.reversed) finishQueued();
      else finishArmed();
    }
  });

  choreography.pause();
  choreography.seek(0, true);
  syncCardsToTime(0);

  const recordInput = source => {
    state.inputCount += 1;
    state.lastInput = source;
    if (source.startsWith('keyboard')) state.keyboardCount += 1;
    else if (source.startsWith('click')) state.clickCount += 1;
  };

  const resetImmediately = source => {
    choreography.pause();
    choreography.seek(0, true);
    state.resetCount += 1;
    state.lastInput = source;
    finishQueued();
  };

  const togglePlan = source => {
    if (state.motionActive) return;
    recordInput(source);

    if (state.assembled) {
      state.mode = 'clearing';
      state.motionActive = !state.reducedMotion;
      state.animationDirection = 'reverse';
      state.resetCount += 1;
      trigger.disabled = !state.reducedMotion;
      trigger.textContent = 'Clearing…';
      trigger.setAttribute('aria-busy', 'true');
      cards.forEach(card => { card.tabIndex = -1; });
      if (state.reducedMotion) {
        choreography.seek(0, true);
        finishQueued();
      } else {
        choreography.reverse();
      }
      return;
    }

    state.mode = 'assembling';
    state.assembled = true;
    state.motionActive = !state.reducedMotion;
    state.animationDirection = 'forward';
    state.animationPlayCount += 1;
    trigger.disabled = !state.reducedMotion;
    trigger.textContent = 'Ordering by impact…';
    trigger.setAttribute('aria-busy', 'true');
    selectionReadout.innerHTML = '<span>Response assembling.</span> Command items arrive before evidence and comms.';

    if (state.reducedMotion) {
      choreography.seek(choreography.duration, true);
      finishArmed();
    } else {
      choreography.play();
    }
  };

  trigger.addEventListener('click', event => {
    togglePlan(event.detail === 0 ? 'keyboard:trigger' : 'click:trigger');
  });

  cards.forEach((card, index) => {
    card.addEventListener('click', event => {
      if (!state.assembled || state.motionActive) return;
      recordInput(event.detail === 0 ? 'keyboard:task' : 'click:task');
      setSelected(index, state.lastInput);
    });
    card.addEventListener('pointerenter', event => {
      if (!state.assembled || state.motionActive || event.pointerType === 'touch') return;
      state.pointerSelectionCount += 1;
      state.inputCount += 1;
      setSelected(index, 'pointer:hover');
    });
    card.addEventListener('focus', () => {
      if (!state.assembled || state.motionActive) return;
      state.focusSelectionCount += 1;
      setSelected(index, 'keyboard:focus');
    });
  });

  stage.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (state.mode !== 'queued') {
        event.preventDefault();
        recordInput('keyboard:Escape');
        resetImmediately('keyboard:Escape');
      }
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && event.target === stage) {
      event.preventDefault();
      togglePlan(`keyboard:${event.key === ' ' ? 'Space' : 'Enter'}`);
      return;
    }

    if (!state.assembled || state.motionActive) return;
    const movement = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 4,
      ArrowUp: -4
    }[event.key];
    let nextIndex = null;
    if (Number.isFinite(movement)) nextIndex = (Math.max(0, state.selectedIndex) + movement + cards.length) % cards.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = cards.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    recordInput(`keyboard:${event.key}`);
    setSelected(nextIndex, state.lastInput, true);
  });

  stage.addEventListener('focus', () => { state.stageFocused = true; });
  stage.addEventListener('blur', event => {
    if (!stage.contains(event.relatedTarget)) state.stageFocused = false;
  });
  stage.addEventListener('pointerenter', () => { state.pointerInside = true; });
  stage.addEventListener('pointerleave', () => { state.pointerInside = false; });

  const handleReducedMotionChange = event => {
    state.reducedMotion = event.matches;
    if (!event.matches || !state.motionActive) return;
    if (state.animationDirection === 'forward') {
      choreography.seek(choreography.duration, true);
      finishArmed();
    } else {
      choreography.seek(0, true);
      finishQueued();
    }
  };

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  } else {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`staggered-transform-choreography: ${message}`);
    };
    const stageRect = stage.getBoundingClientRect();
    const uniqueIds = new Set(tasks.map(task => task.id));
    const uniqueTitles = new Set(tasks.map(task => task.title));
    const uniqueOwners = new Set(tasks.map(task => task.owner));
    const visibleCards = cards.every(card => {
      const rect = card.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0
        && rect.right > stageRect.left && rect.left < stageRect.right
        && rect.bottom > stageRect.top && rect.top < stageRect.bottom;
    });

    invariant(choreography.targets.length === cards.length, 'Anime.js must own all eight response cards');
    invariant(choreography.duration >= itemDuration + delays.at(-1), 'animation duration must include the stagger window');
    invariant(delays.every((delay, index) => index === 0 || delay - delays[index - 1] === 64), 'stagger delays must remain a real 64ms sequence');
    invariant(state.motionActive ? !choreography.paused : choreography.paused, 'animation pause state diverged from interaction state');
    invariant(state.automaticPlayback === false && state.automaticFallback === false, 'automatic progression must remain disabled');
    invariant(state.syntheticInputDispatch === false, 'synthetic input dispatch must remain disabled');
    invariant(state.inputAdapters.join('|') === 'click|keyboard|pointer-selection', 'input adapter contract changed');
    invariant(uniqueIds.size === 8 && uniqueTitles.size === 8 && uniqueOwners.size === 8, 'response tasks must stay distinct and accountable');
    invariant(tasks.slice(0, 2).every(task => task.band === 'P0'), 'highest-impact actions must lead the order');
    invariant(cards.every((card, index) => card.dataset.state === state.taskStates[tasks[index].id]), 'DOM task state export is stale');
    invariant(state.settledCount === cards.filter(card => card.dataset.state === 'ready').length, 'ready count is stale');
    invariant(visibleCards, 'all response cards must remain inside the preview');
    invariant(trigger.type === 'button' && stage.tabIndex === 0, 'click and keyboard triggers must remain accessible');
    invariant(state.inputCount > 0 || (state.initialStaticConfirmed && state.mode === 'queued' && state.animationProgress === 0), 'initial frame must remain strictly static');
    return true;
  };

  const doubleFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.resolve(document.fonts?.ready)
    .then(doubleFrame)
    .then(() => {
      const before = cards.map(card => `${getComputedStyle(card).opacity}|${getComputedStyle(card).transform}`).join(';');
      return doubleFrame().then(() => {
        const after = cards.map(card => `${getComputedStyle(card).opacity}|${getComputedStyle(card).transform}`).join(';');
        state.initialStaticConfirmed = before === after
          && state.mode === 'queued'
          && state.animationProgress === 0
          && choreography.paused;
        if (!state.initialStaticConfirmed) throw new Error('Initial response plan changed without user input.');
        if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial choreography assertion failed.');
      });
    });

  ready.catch(markPreviewFailure);

  installPreviewController({
    id: 'staggered-transform-choreography',
    library: 'animejs@4.5.0',
    renderer: 'dom',
    render: () => { state.renderCount += 1; },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
