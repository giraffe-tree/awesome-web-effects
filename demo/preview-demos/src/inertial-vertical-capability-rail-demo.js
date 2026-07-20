import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-c-utils.js';

try {
  const windowElement = document.querySelector('#rail-window');
  const rail = document.querySelector('#capability-rail');
  const cards = [...document.querySelectorAll('.capability-card')];
  const scrollbar = document.querySelector('.rail-scrollbar');
  const thumb = document.querySelector('#rail-thumb');
  const mode = document.querySelector('#rail-mode');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    automaticFallback: false,
    automaticDrift: false,
    syntheticInputDispatch: false,
    phase: 'idle',
    offset: 0,
    velocity: 0,
    minOffset: 0,
    maxOffset: 0,
    activeIndex: 0,
    selectedIndex: 0,
    pointerCaptured: false,
    motionActive: false,
    inputKind: 'none',
    inputCount: 0,
    dragMoveCount: 0,
    releaseCount: 0,
    keyboardCount: 0,
    inertiaCount: 0,
    bounceCount: 0,
    initialStaticConfirmed: false,
    reducedMotion: reducedMotion.matches,
    renderCount: 0,
    lastUpdateOrigin: 'initial'
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let activePointerId = null;
  let pointerStartY = 0;
  let pointerStartOffset = 0;
  let lastPointerY = 0;
  let lastPointerAt = 0;
  let motionControl = null;
  let motionSerial = 0;

  function recordInput(inputKind) {
    state.inputKind = inputKind;
    state.inputCount += 1;
  }

  function updateBounds(clampAtRest = true) {
    const previousMin = state.minOffset;
    state.maxOffset = 0;
    state.minOffset = Math.min(0, windowElement.clientHeight - rail.scrollHeight);
    if (clampAtRest && !state.pointerCaptured && !state.motionActive) {
      state.offset = clamp(state.offset, state.minOffset, state.maxOffset);
    } else if (previousMin !== state.minOffset && state.offset < state.minOffset - windowElement.clientHeight) {
      state.offset = state.minOffset;
    }
  }

  function nearestCardIndex() {
    if (state.offset >= state.maxOffset - .5) return 0;
    if (state.offset <= state.minOffset + .5) return cards.length - 1;
    const viewportCenter = windowElement.clientHeight / 2;
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetTop + state.offset + card.offsetHeight / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    });
    return nearestIndex;
  }

  function applyRail() {
    const safeOffset = Number.isFinite(state.offset) ? state.offset : 0;
    rail.style.transform = `translate3d(0, ${safeOffset.toFixed(3)}px, 0)`;
    const scrollRange = Math.abs(state.minOffset);
    const scrollProgress = scrollRange > 0 ? clamp(-safeOffset / scrollRange, 0, 1) : 0;
    const thumbTravel = Math.max(0, scrollbar.clientHeight - thumb.clientHeight);
    thumb.style.transform = `translate3d(0, ${(scrollProgress * thumbTravel).toFixed(3)}px, 0)`;
    state.activeIndex = nearestCardIndex();
    cards.forEach((card, index) => card.setAttribute('aria-current', String(index === state.activeIndex)));
    windowElement.setAttribute('aria-activedescendant', cards[state.activeIndex].id);
    windowElement.dataset.phase = state.phase;
    const phaseLabel = state.phase === 'dragging' ? 'Dragging'
      : state.phase === 'inertia' ? 'Coasting'
        : state.phase === 'rebounding' ? 'Boundary return'
          : state.phase === 'keyboard' ? 'Keyboard move'
            : state.reducedMotion ? 'Direct mode' : 'Ready';
    mode.textContent = `${phaseLabel} · ${String(state.activeIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  }

  function stopMotion() {
    motionSerial += 1;
    motionControl?.stop?.();
    motionControl = null;
    state.motionActive = false;
  }

  function completeMotion(serial) {
    if (serial !== motionSerial) return;
    state.offset = clamp(state.offset, state.minOffset, state.maxOffset);
    state.velocity = 0;
    state.phase = 'idle';
    state.motionActive = false;
    motionControl = null;
    applyRail();
  }

  function animateOffset(target, options, phase) {
    stopMotion();
    const serial = ++motionSerial;
    let previousValue = state.offset;
    let previousAt = performance.now();
    state.phase = phase;
    state.motionActive = true;
    motionControl = animate(state.offset, target, {
      ...options,
      onUpdate: value => {
        if (serial !== motionSerial) return;
        const now = performance.now();
        const elapsed = Math.max(.001, (now - previousAt) / 1000);
        state.velocity = (value - previousValue) / elapsed;
        state.offset = value;
        state.lastUpdateOrigin = phase;
        if (value < state.minOffset || value > state.maxOffset) state.phase = 'rebounding';
        previousValue = value;
        previousAt = now;
        applyRail();
      },
      onComplete: () => completeMotion(serial)
    });
  }

  function releaseWithPhysics(releaseVelocity) {
    updateBounds(false);
    if (reducedMotion.matches) {
      stopMotion();
      state.offset = clamp(state.offset, state.minOffset, state.maxOffset);
      state.velocity = 0;
      state.phase = 'idle';
      state.lastUpdateOrigin = 'reduced-direct';
      applyRail();
      return;
    }
    if (state.offset < state.minOffset || state.offset > state.maxOffset) {
      state.bounceCount += 1;
      animateOffset(clamp(state.offset, state.minOffset, state.maxOffset), {
        type: 'spring',
        velocity: releaseVelocity,
        stiffness: 340,
        damping: 28,
        mass: .72,
        restDelta: .25,
        restSpeed: 5
      }, 'rebounding');
      return;
    }
    if (Math.abs(releaseVelocity) < 18) {
      state.velocity = 0;
      state.phase = 'idle';
      applyRail();
      return;
    }
    const projected = clamp(state.offset + releaseVelocity * .24, state.minOffset, state.maxOffset);
    state.inertiaCount += 1;
    animateOffset(projected, {
      type: 'inertia',
      velocity: releaseVelocity,
      power: .24,
      timeConstant: 430,
      min: state.minOffset,
      max: state.maxOffset,
      bounceStiffness: 330,
      bounceDamping: 30,
      restDelta: .25,
      restSpeed: 5
    }, 'inertia');
  }

  function finishPointer(event, cancelled = false) {
    if (activePointerId === null) return;
    const pointerId = activePointerId;
    if (event && event.pointerId !== pointerId) return;
    const now = performance.now();
    const releaseVelocity = cancelled || now - lastPointerAt > 90 ? 0 : clamp(state.velocity, -1800, 1800);
    activePointerId = null;
    state.pointerCaptured = false;
    state.releaseCount += 1;
    if (windowElement.hasPointerCapture?.(pointerId)) windowElement.releasePointerCapture(pointerId);
    releaseWithPhysics(releaseVelocity);
  }

  function targetForIndex(index) {
    const card = cards[index];
    const centered = windowElement.clientHeight / 2 - (card.offsetTop + card.offsetHeight / 2);
    return clamp(centered, state.minOffset, state.maxOffset);
  }

  function moveToIndex(index) {
    updateBounds();
    const nextIndex = clamp(index, 0, cards.length - 1);
    const target = targetForIndex(nextIndex);
    state.selectedIndex = nextIndex;
    if (reducedMotion.matches) {
      stopMotion();
      state.offset = target;
      state.velocity = 0;
      state.phase = 'idle';
      state.lastUpdateOrigin = 'keyboard-direct';
      applyRail();
      return;
    }
    animateOffset(target, {
      type: 'spring',
      stiffness: 360,
      damping: 32,
      mass: .72,
      restDelta: .2,
      restSpeed: 4
    }, 'keyboard');
  }

  windowElement.addEventListener('pointerdown', event => {
    if (activePointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    stopMotion();
    updateBounds();
    windowElement.focus({ preventScroll: true });
    activePointerId = event.pointerId;
    pointerStartY = event.clientY;
    pointerStartOffset = state.offset;
    lastPointerY = event.clientY;
    lastPointerAt = performance.now();
    state.velocity = 0;
    state.phase = 'dragging';
    state.pointerCaptured = true;
    state.lastUpdateOrigin = 'pointer';
    recordInput(event.pointerType || 'pointer');
    windowElement.setPointerCapture?.(event.pointerId);
    applyRail();
  });

  windowElement.addEventListener('pointermove', event => {
    if (!state.pointerCaptured || event.pointerId !== activePointerId) return;
    event.preventDefault();
    const now = performance.now();
    const elapsed = Math.max(.001, (now - lastPointerAt) / 1000);
    const rawOffset = pointerStartOffset + event.clientY - pointerStartY;
    const nextOffset = rawOffset > state.maxOffset
      ? state.maxOffset + (rawOffset - state.maxOffset) * .2
      : rawOffset < state.minOffset
        ? state.minOffset + (rawOffset - state.minOffset) * .2
        : rawOffset;
    const instantaneousVelocity = (event.clientY - lastPointerY) / elapsed;
    state.velocity = clamp(state.velocity * .28 + instantaneousVelocity * .72, -1800, 1800);
    state.offset = nextOffset;
    state.dragMoveCount += 1;
    lastPointerY = event.clientY;
    lastPointerAt = now;
    applyRail();
  });

  windowElement.addEventListener('pointerup', event => finishPointer(event));
  windowElement.addEventListener('pointercancel', event => finishPointer(event, true));
  windowElement.addEventListener('lostpointercapture', event => finishPointer(event, true));
  window.addEventListener('blur', () => finishPointer(null, true));

  windowElement.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    recordInput('keyboard');
    state.keyboardCount += 1;
    const targetIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? cards.length - 1
        : event.key === 'ArrowUp' ? state.activeIndex - 1 : state.activeIndex + 1;
    moveToIndex(targetIndex);
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches) {
      stopMotion();
      updateBounds();
      state.offset = clamp(state.offset, state.minOffset, state.maxOffset);
      state.velocity = 0;
      state.phase = 'idle';
      state.lastUpdateOrigin = 'reduced-direct';
    }
    applyRail();
  });

  const resizeObserver = new ResizeObserver(() => {
    updateBounds();
    applyRail();
  });
  resizeObserver.observe(windowElement);
  resizeObserver.observe(rail);

  function render() {
    state.renderCount += 1;
    applyRail();
  }

  const ready = document.fonts.ready.then(async () => {
    updateBounds();
    state.offset = 0;
    state.velocity = 0;
    state.phase = 'idle';
    applyRail();
    const initialOffset = state.offset;
    const initialTransform = rail.style.transform;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialStaticConfirmed = state.offset === initialOffset
      && rail.style.transform === initialTransform
      && !state.motionActive
      && state.inputCount === 0;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    updateBounds();
    applyRail();
    const stageBounds = document.querySelector('.rail-stage').getBoundingClientRect();
    const windowBounds = windowElement.getBoundingClientRect();
    const credibleContent = cards.length === 6 && cards.every(card => (
      Boolean(card.dataset.kind)
      && card.querySelector('h2')?.textContent.trim().length > 8
      && card.querySelector('p')?.textContent.trim().length > 35
      && card.querySelectorAll('.capability-meta span').length === 2
    ));
    const noUnpromptedMotion = state.inputCount > 0 || (
      Math.abs(state.offset) < .001
      && Math.abs(state.velocity) < .001
      && state.phase === 'idle'
      && state.inertiaCount === 0
    );
    const boundedAtRest = state.pointerCaptured || state.motionActive
      || (state.offset >= state.minOffset - .01 && state.offset <= state.maxOffset + .01);
    return credibleContent
      && rail.scrollHeight > windowElement.clientHeight
      && state.initialStaticConfirmed
      && noUnpromptedMotion
      && boundedAtRest
      && state.automaticDrift === false
      && state.syntheticInputDispatch === false
      && state.automaticFallback === false
      && ['idle', 'dragging', 'inertia', 'rebounding', 'keyboard'].includes(state.phase)
      && state.activeIndex >= 0
      && state.activeIndex < cards.length
      && Number.isFinite(state.offset)
      && Number.isFinite(state.velocity)
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.dragMoveCount)
      && Number.isInteger(state.releaseCount)
      && Number.isInteger(state.keyboardCount)
      && getComputedStyle(windowElement).touchAction === 'none'
      && typeof windowElement.setPointerCapture === 'function'
      && windowElement.getAttribute('aria-label').includes('Arrow Up')
      && rail.style.transform.includes('translate3d')
      && windowBounds.width >= stageBounds.width * .5
      && windowBounds.height >= stageBounds.height * .7
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'inertial-vertical-capability-rail',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
