import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#blend-stage');
  const shell = document.querySelector('#blend-shell');
  const action = document.querySelector('#blend-action');
  const visual = document.querySelector('#goo-visual');
  const filteredMaterial = document.querySelector('#filtered-material');
  const fluidWord = document.querySelector('#fluid-word');
  const crispWord = document.querySelector('#crisp-word');
  const blobs = ['a', 'b', 'c', 'd'].map(id => document.querySelector(`#blob-${id}`));
  const actionState = document.querySelector('#action-state');
  const formulaPanel = document.querySelector('#formula-panel');
  const formulaStatus = document.querySelector('#formula-status');
  const bagCount = document.querySelector('#bag-count');
  const blurPrimitive = document.querySelector('#formula-goo feGaussianBlur');
  const thresholdPrimitive = document.querySelector('#formula-goo feColorMatrix');
  const blendPrimitive = document.querySelector('#formula-goo feBlend');
  const filter = document.querySelector('#formula-goo');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const visualStops = {
    idle: [
      { cx: 55, cy: 58, r: 16 },
      { cx: 305, cy: 118, r: 20 },
      { cx: 229, cy: 37, r: 12 },
      { cx: 132, cy: 145, r: 11 },
    ],
    engaged: [
      { cx: 88, cy: 91, r: 11 },
      { cx: 256, cy: 101, r: 13 },
      { cx: 219, cy: 85, r: 8 },
      { cx: 147, cy: 111, r: 8 },
    ],
    added: [
      { cx: 101, cy: 94, r: 9 },
      { cx: 241, cy: 98, r: 10 },
      { cx: 205, cy: 91, r: 7 },
      { cx: 157, cy: 101, r: 7 },
    ],
  };
  const progressForPhase = { idle: 0, engaged: 1, added: 2 };
  const counterKeys = [
    'inputCount',
    'pointerInputCount',
    'keyboardInputCount',
    'touchInputCount',
    'hoverEnterCount',
    'hoverLeaveCount',
    'focusCount',
    'blurCount',
    'pressCount',
    'releaseCount',
    'activationCount',
    'removalCount',
    'escapeRemovalCount',
    'cancelCount',
    'transitionCount',
    'filterEngagementCount',
    'motionStartCount',
    'motionCompleteCount',
    'motionCancelCount',
    'reducedMotionDirectCount',
    'renderCount',
  ];

  const state = {
    id: 'svg-filter-gooey-text-hover',
    automaticMorph: false,
    automaticHover: false,
    automaticRehearsal: false,
    previewClockDriven: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    firstFrameStatic: true,
    phase: 'idle',
    added: false,
    hoverInside: false,
    focusInside: false,
    pressed: false,
    activeInputKind: null,
    pointerCaptured: false,
    activePointerType: null,
    mergeProgress: 0,
    targetProgress: 0,
    visualSettled: true,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    touchInputCount: 0,
    hoverEnterCount: 0,
    hoverLeaveCount: 0,
    focusCount: 0,
    blurCount: 0,
    pressCount: 0,
    releaseCount: 0,
    activationCount: 0,
    removalCount: 0,
    escapeRemovalCount: 0,
    cancelCount: 0,
    transitionCount: 0,
    filterEngagementCount: 0,
    motionStartCount: 0,
    motionCompleteCount: 0,
    motionCancelCount: 0,
    reducedMotionDirectCount: 0,
    renderCount: 0,
    motionRevision: 0,
    animationActive: false,
    transitionHistory: [],
    lastTransition: null,
    lastTrustedEvent: 'none',
    initialStaticVerified: false,
    reducedMotion: reducedMotion.matches,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let motionControl = null;
  let motionPromise = Promise.resolve();
  let activePointerId = null;
  let lastPointerType = 'mouse';
  let lastInputModality = 'keyboard';

  const nextFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const stateToken = () => `${state.phase}:${state.added ? 'added' : 'empty'}`;
  const mix = (from, to, progress) => from + (to - from) * progress;

  const configAt = progress => {
    const fromKey = progress <= 1 ? 'idle' : 'engaged';
    const toKey = progress <= 1 ? 'engaged' : 'added';
    const localProgress = progress <= 1 ? progress : progress - 1;
    return visualStops[fromKey].map((from, index) => {
      const to = visualStops[toKey][index];
      return {
        cx: mix(from.cx, to.cx, localProgress),
        cy: mix(from.cy, to.cy, localProgress),
        r: mix(from.r, to.r, localProgress),
      };
    });
  };

  const applyProgress = progress => {
    state.mergeProgress = progress;
    const config = configAt(progress);
    blobs.forEach((blob, index) => {
      blob.setAttribute('cx', config[index].cx.toFixed(3));
      blob.setAttribute('cy', config[index].cy.toFixed(3));
      blob.setAttribute('r', config[index].r.toFixed(3));
    });
    const crispOpacity = progress <= 1 ? mix(1, .28, progress) : mix(.28, 1, progress - 1);
    crispWord.setAttribute('opacity', crispOpacity.toFixed(3));
    fluidWord.setAttribute('opacity', String(mix(.88, 1, Math.min(progress, 1)).toFixed(3)));
  };

  const recordInput = (kind, event, cause, pointerType = null) => {
    if (!event || event.isTrusted !== true) return false;
    state.inputKind = kind;
    state.inputCount += 1;
    state.lastTrustedEvent = cause;
    if (kind === 'keyboard') {
      state.keyboardInputCount += 1;
    } else {
      state.pointerInputCount += 1;
      if ((pointerType || event.pointerType || lastPointerType) === 'touch') state.touchInputCount += 1;
    }
    return true;
  };

  const stopMotion = () => {
    if (state.animationActive) state.motionCancelCount += 1;
    state.motionRevision += 1;
    motionControl?.stop();
    motionControl = null;
    state.animationActive = false;
  };

  const syncDom = () => {
    action.dataset.phase = state.phase;
    action.setAttribute('aria-pressed', String(state.added));
    formulaPanel.dataset.added = String(state.added);
    fluidWord.textContent = state.added ? 'ADDED' : 'BLEND';
    crispWord.textContent = state.added ? 'ADDED' : 'BLEND';
    bagCount.textContent = state.added ? '1' : '0';
    formulaStatus.textContent = state.added ? 'Added to regimen' : 'Not yet added';
    actionState.textContent = state.added
      ? 'Added · click to remove'
      : state.phase === 'engaged' ? 'Click to add formula' : 'Ready to blend';
    action.setAttribute('aria-label', state.added
      ? 'Remove Hydra 02 from your regimen'
      : 'Blend Hydra 02 into your regimen');
  };

  const animateToPhase = phase => {
    const target = progressForPhase[phase];
    state.targetProgress = target;
    stopMotion();

    if (reducedMotion.matches) {
      state.reducedMotionDirectCount += 1;
      state.visualSettled = true;
      applyProgress(target);
      motionPromise = Promise.resolve();
      return motionPromise;
    }

    const revision = state.motionRevision;
    const distance = Math.abs(target - state.mergeProgress);
    state.animationActive = true;
    state.visualSettled = false;
    state.motionStartCount += 1;
    motionControl = animate(state.mergeProgress, target, {
      duration: Math.max(.28, distance * .46),
      ease: [.2, .72, .16, 1],
      onUpdate: value => {
        if (revision !== state.motionRevision) return;
        applyProgress(value);
      },
      onComplete: () => {
        if (revision !== state.motionRevision) return;
        applyProgress(target);
        state.animationActive = false;
        state.visualSettled = true;
        state.motionCompleteCount += 1;
        motionControl = null;
      },
    });
    motionPromise = motionControl.finished.catch(() => undefined);
    return motionPromise;
  };

  const recordTransition = (from, cause) => {
    const transition = {
      from,
      to: stateToken(),
      cause,
      inputCountAtTransition: state.inputCount,
      trusted: state.lastTrustedEvent !== 'none',
    };
    state.lastTransition = transition;
    state.transitionHistory.push(transition);
    if (state.transitionHistory.length > 14) state.transitionHistory.shift();
    state.transitionCount += 1;
  };

  const transitionTo = (next, cause, from = stateToken()) => {
    if (next === state.phase && from === stateToken()) return false;
    state.phase = next;
    if (next === 'engaged' || next === 'added') state.filterEngagementCount += 1;
    recordTransition(from, cause);
    syncDom();
    animateToPhase(next);
    return true;
  };

  const derivedPhase = () => state.added
    ? 'added'
    : state.hoverInside || state.focusInside || state.pressed ? 'engaged' : 'idle';

  const reconcilePhase = (cause, from = stateToken()) => transitionTo(derivedPhase(), cause, from);

  document.addEventListener('pointerdown', event => {
    lastPointerType = event.pointerType || 'mouse';
    lastInputModality = 'pointer';
  }, { capture: true });
  document.addEventListener('keydown', () => {
    lastInputModality = 'keyboard';
  }, { capture: true });

  action.addEventListener('pointerenter', event => {
    const pointerType = event.pointerType || lastPointerType;
    if (!recordInput('pointer', event, `${pointerType}-hover-enter`, pointerType)) return;
    state.hoverEnterCount += 1;
    state.hoverInside = true;
    reconcilePhase(`${pointerType}-hover-enter`);
  });

  action.addEventListener('pointerleave', event => {
    const pointerType = event.pointerType || lastPointerType;
    if (!recordInput('pointer', event, `${pointerType}-hover-leave`, pointerType)) return;
    state.hoverLeaveCount += 1;
    state.hoverInside = false;
    if (!state.pointerCaptured) state.pressed = false;
    reconcilePhase(`${pointerType}-hover-leave`);
  });

  action.addEventListener('focus', event => {
    const kind = lastInputModality === 'keyboard' ? 'keyboard' : 'pointer';
    const pointerType = kind === 'pointer' ? lastPointerType : null;
    if (!recordInput(kind, event, `${kind}-focus`, pointerType)) return;
    state.focusCount += 1;
    state.focusInside = true;
    reconcilePhase(`${kind}-focus`);
  });

  action.addEventListener('blur', event => {
    const kind = lastInputModality === 'keyboard' ? 'keyboard' : 'pointer';
    const pointerType = kind === 'pointer' ? lastPointerType : null;
    if (!recordInput(kind, event, `${kind}-blur`, pointerType)) return;
    state.blurCount += 1;
    state.focusInside = false;
    reconcilePhase(`${kind}-blur`);
  });

  action.addEventListener('pointerdown', event => {
    if (event.button !== 0 || activePointerId !== null) return;
    event.preventDefault();
    const pointerType = event.pointerType || lastPointerType;
    if (!recordInput('pointer', event, `${pointerType}-press`, pointerType)) return;
    state.pressCount += 1;
    state.pressed = true;
    state.activeInputKind = pointerType;
    state.activePointerType = pointerType;
    state.pointerCaptured = true;
    activePointerId = event.pointerId;
    action.setPointerCapture(event.pointerId);
    reconcilePhase(`${pointerType}-press`);
  });

  const finishPointer = (event, cancelled = false) => {
    if (activePointerId === null || event.pointerId !== activePointerId) return;
    const pointerType = event.pointerType || state.activePointerType || lastPointerType;
    if (action.hasPointerCapture(event.pointerId)) action.releasePointerCapture(event.pointerId);
    activePointerId = null;
    state.pointerCaptured = false;
    state.pressed = false;
    state.activeInputKind = null;
    state.activePointerType = null;
    if (!recordInput('pointer', event, `${pointerType}-${cancelled ? 'press-cancel' : 'release'}`, pointerType)) return;
    if (cancelled) {
      state.cancelCount += 1;
      reconcilePhase(`${pointerType}-press-cancel`);
    } else {
      state.releaseCount += 1;
    }
  };

  action.addEventListener('pointerup', event => finishPointer(event));
  action.addEventListener('pointercancel', event => finishPointer(event, true));
  action.addEventListener('lostpointercapture', event => {
    if (activePointerId === event.pointerId) finishPointer(event, true);
  });

  action.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    const pointerType = kind === 'pointer' ? lastPointerType : null;
    if (!recordInput(kind, event, `${kind}-${state.added ? 'remove' : 'add'}-formula`, pointerType)) return;
    const from = stateToken();
    state.added = !state.added;
    if (state.added) state.activationCount += 1;
    else state.removalCount += 1;
    reconcilePhase(state.added ? 'formula-added' : 'formula-removed', from);
  });

  action.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !state.added || event.repeat) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, 'keyboard-escape-remove')) return;
    const from = stateToken();
    state.added = false;
    state.removalCount += 1;
    state.escapeRemovalCount += 1;
    reconcilePhase('keyboard-escape-remove', from);
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    stopMotion();
    state.targetProgress = progressForPhase[state.phase];
    state.visualSettled = true;
    applyProgress(state.targetProgress);
  });

  syncDom();
  applyProgress(0);

  const ready = (async () => {
    await document.fonts.ready;
    await nextFrames();
    state.initialStaticVerified = state.phase === 'idle'
      && state.added === false
      && state.mergeProgress === 0
      && state.transitionCount === 0
      && state.inputCount === 0
      && state.motionStartCount === 0
      && state.motionCompleteCount === 0
      && fluidWord.textContent === 'BLEND'
      && blobs.every((blob, index) => Number(blob.getAttribute('cx')) === visualStops.idle[index].cx);
  })();

  const render = () => {
    state.renderCount += 1;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await motionPromise;
    await nextFrames();

    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const actionRect = action.getBoundingClientRect();
    const visualRect = visual.getBoundingClientRect();
    const panelRect = formulaPanel.getBoundingClientRect();
    const expectedProgress = progressForPhase[state.phase];
    const expectedConfig = visualStops[state.phase];
    const geometryValid = Math.abs(state.mergeProgress - expectedProgress) < .001
      && Math.abs(state.targetProgress - expectedProgress) < .001
      && state.visualSettled
      && blobs.every((blob, index) => ['cx', 'cy', 'r'].every(attribute => Math.abs(Number(blob.getAttribute(attribute)) - expectedConfig[index][attribute]) < .01));
    const filterValid = filter.getAttribute('filterUnits') === 'userSpaceOnUse'
      && filter.getAttribute('x') === '8'
      && filter.getAttribute('y') === '8'
      && filter.getAttribute('width') === '344'
      && filter.getAttribute('height') === '154'
      && blurPrimitive.getAttribute('in') === 'SourceGraphic'
      && blurPrimitive.getAttribute('stdDeviation') === '5.5'
      && thresholdPrimitive.getAttribute('in') === 'blur'
      && thresholdPrimitive.getAttribute('values').trim().endsWith('24 -10')
      && blendPrimitive.getAttribute('in2') === 'threshold'
      && filteredMaterial.getAttribute('filter') === 'url(#formula-goo)';
    const historyValid = state.transitionHistory.length <= 14
      && state.transitionHistory.every(transition => transition.from !== transition.to
        && transition.inputCountAtTransition > 0
        && transition.trusted === true)
      && state.transitionCount >= state.transitionHistory.length
      && (!state.lastTransition || state.lastTransition.to === stateToken());
    const countersValid = counterKeys.every(key => Number.isInteger(state[key]) && state[key] >= 0)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.touchInputCount <= state.pointerInputCount
      && state.motionCompleteCount <= state.motionStartCount
      && state.motionCancelCount <= state.motionStartCount
      && state.removalCount <= state.activationCount;
    const semanticStateValid = action.dataset.phase === state.phase
      && action.getAttribute('aria-pressed') === String(state.added)
      && formulaPanel.dataset.added === String(state.added)
      && fluidWord.textContent === (state.added ? 'ADDED' : 'BLEND')
      && crispWord.textContent === fluidWord.textContent
      && bagCount.textContent === (state.added ? '1' : '0')
      && formulaStatus.textContent === (state.added ? 'Added to regimen' : 'Not yet added')
      && state.phase === derivedPhase()
      && state.pointerCaptured === (activePointerId !== null)
      && state.pressed === state.pointerCaptured;
    const rectInside = (inner, outer, tolerance = 1) => inner.left >= outer.left - tolerance
      && inner.top >= outer.top - tolerance
      && inner.right <= outer.right + tolerance
      && inner.bottom <= outer.bottom + tolerance;
    const viewportValid = rectInside(shellRect, stageRect)
      && rectInside(actionRect, shellRect)
      && rectInside(visualRect, shellRect)
      && rectInside(panelRect, shellRect)
      && stageRect.width <= innerWidth + 1
      && stageRect.height <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;

    return typeof animate === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && blobs.length === 4
      && state.automaticMorph === false
      && state.automaticHover === false
      && state.automaticRehearsal === false
      && state.previewClockDriven === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.firstFrameStatic === true
      && state.initialStaticVerified
      && filterValid
      && geometryValid
      && semanticStateValid
      && historyValid
      && countersValid
      && viewportValid
      && state.renderCount > 0;
  };

  window.addEventListener('beforeunload', () => stopMotion(), { once: true });

  installPreviewController({
    id: 'svg-filter-gooey-text-hover',
    library: 'motion@12.42.2',
    renderer: 'svg',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
