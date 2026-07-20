import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#archive-stage');
  const shell = document.querySelector('#archive-shell');
  const card = document.querySelector('#research-card');
  const roleSlot = document.querySelector('#role-slot');
  const metadataLayer = document.querySelector('#metadata-layer');
  const ctaLayer = document.querySelector('#cta-layer');
  const metadata = document.querySelector('#metadata');
  const cta = document.querySelector('#research-cta');
  const ctaButton = document.querySelector('#cta-button');
  const resetButton = document.querySelector('#reset-button');
  const archiveStatus = document.querySelector('#archive-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !shell || !card || !roleSlot || !metadataLayer || !ctaLayer || !metadata || !cta || !ctaButton || !resetButton || !archiveStatus) {
    throw new Error('Research archive role-swap DOM is incomplete');
  }

  const counters = [
    'inputCount',
    'pointerInputCount',
    'keyboardInputCount',
    'hoverEnterCount',
    'hoverLeaveCount',
    'focusInCount',
    'focusOutCount',
    'keyboardToggleCount',
    'touchToggleCount',
    'escapeResetCount',
    'buttonResetCount',
    'ctaActivationCount',
    'handoffStartCount',
    'handoffCompleteCount',
    'handoffCancelCount',
    'reducedMotionDirectCount',
    'handoffRevision',
    'renderCount',
  ];

  const state = {
    id: 'card-metadata-to-cta-role-swap',
    automaticRehearsal: false,
    previewClockDriven: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    desiredCtaVisible: false,
    activeRole: 'metadata',
    phase: 'metadata',
    hovered: false,
    focusWithin: false,
    touchPinned: false,
    animationActive: false,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    hoverEnterCount: 0,
    hoverLeaveCount: 0,
    focusInCount: 0,
    focusOutCount: 0,
    keyboardToggleCount: 0,
    touchToggleCount: 0,
    escapeResetCount: 0,
    buttonResetCount: 0,
    ctaActivationCount: 0,
    handoffStartCount: 0,
    handoffCompleteCount: 0,
    handoffCancelCount: 0,
    reducedMotionDirectCount: 0,
    handoffRevision: 0,
    renderCount: 0,
    baselineValidated: false,
    metadataVisibleValidated: false,
    ctaVisibleValidated: false,
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

  const closeEnough = (a, b, tolerance = .12) => Math.abs(a - b) <= tolerance;

  const recordInput = (kind, event, label) => {
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return false;
    }

    state.inputCount += 1;
    state.inputKind = kind;
    state.lastTrustedEvent = label;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
    return true;
  };

  const applySemantics = visible => {
    const role = visible ? 'cta' : 'metadata';
    card.dataset.role = role;
    card.setAttribute('aria-expanded', String(visible));
    roleSlot.dataset.activeRole = role;
    metadataLayer.setAttribute('aria-hidden', String(visible));
    ctaLayer.setAttribute('aria-hidden', String(!visible));
    ctaLayer.style.pointerEvents = visible ? 'auto' : 'none';
    ctaButton.tabIndex = visible ? 0 : -1;
    archiveStatus.textContent = visible ? 'Action active' : 'Metadata active';
    card.style.setProperty('--intent', visible ? '1' : '0');
  };

  const applyStableVisuals = visible => {
    metadata.style.opacity = visible ? '0' : '1';
    metadata.style.transform = visible ? 'translateY(-7px)' : 'translateY(0px)';
    cta.style.opacity = visible ? '1' : '0';
    cta.style.transform = visible ? 'translateY(0px)' : 'translateY(7px)';
    state.activeRole = visible ? 'cta' : 'metadata';
    state.phase = state.activeRole;
    state.animationActive = false;
    applySemantics(visible);
  };

  const stopMotions = () => {
    if (state.animationActive) state.handoffCancelCount += 1;
    for (const motion of motions) motion.stop();
    motions = [];
    state.animationActive = false;
  };

  const transitionTo = async (visible, cause) => {
    const alreadyStable = state.desiredCtaVisible === visible
      && !state.animationActive
      && state.activeRole === (visible ? 'cta' : 'metadata');
    if (alreadyStable) {
      applySemantics(visible);
      return;
    }

    if (state.animationActive) stopMotions();
    const revision = ++state.handoffRevision;
    state.desiredCtaVisible = visible;
    state.phase = visible ? 'revealing-cta' : 'restoring-metadata';
    state.activeRole = 'handoff';
    applySemantics(visible);

    if (state.reducedMotion) {
      state.reducedMotionDirectCount += 1;
      applyStableVisuals(visible);
      return;
    }

    state.handoffStartCount += 1;
    state.animationActive = true;
    const options = { duration: .26, ease: [.2, .8, .2, 1] };
    const metadataMotion = animate(metadata, {
      opacity: visible ? 0 : 1,
      transform: visible ? 'translateY(-7px)' : 'translateY(0px)',
    }, options);
    const ctaMotion = animate(cta, {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0px)' : 'translateY(7px)',
    }, options);
    motions = [metadataMotion, ctaMotion];

    await Promise.allSettled(motions.map(motion => motion.finished));
    if (revision !== state.handoffRevision) return;

    motions = [];
    state.handoffCompleteCount += 1;
    applyStableVisuals(visible);
    void cause;
  };

  const updateFromSources = cause => {
    const visible = state.hovered || state.focusWithin || state.touchPinned;
    void transitionTo(visible, cause);
  };

  const resetSources = cause => {
    state.hovered = false;
    state.focusWithin = false;
    state.touchPinned = false;
    if (card.contains(document.activeElement)) document.activeElement.blur();
    void transitionTo(false, cause);
  };

  document.addEventListener('pointerdown', event => {
    lastPointerType = event.pointerType || 'mouse';
  }, { capture: true });

  card.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || !recordInput('pointer', event, 'pointerenter')) return;
    state.hovered = true;
    state.hoverEnterCount += 1;
    updateFromSources('pointerenter');
  });

  card.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse' || !recordInput('pointer', event, 'pointerleave')) return;
    state.hovered = false;
    state.hoverLeaveCount += 1;
    updateFromSources('pointerleave');
  });

  card.addEventListener('pointerdown', event => {
    if ((event.pointerType !== 'touch' && event.pointerType !== 'pen') || event.target === ctaButton) return;
    event.preventDefault();
    if (!recordInput('pointer', event, `${event.pointerType}-toggle`)) return;
    if (card.contains(document.activeElement)) document.activeElement.blur();
    state.hovered = false;
    state.focusWithin = false;
    state.touchPinned = !state.touchPinned;
    state.touchToggleCount += 1;
    updateFromSources(`${event.pointerType}-toggle`);
  });

  card.addEventListener('focusin', event => {
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return;
    }
    state.focusWithin = true;
    state.focusInCount += 1;
    updateFromSources('focusin');
  });

  card.addEventListener('focusout', event => {
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return;
    }
    queueMicrotask(() => {
      if (card.contains(document.activeElement)) return;
      state.focusWithin = false;
      state.focusOutCount += 1;
      updateFromSources('focusout');
    });
  });

  card.addEventListener('keydown', event => {
    if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, event.key === 'Enter' ? 'enter-toggle' : 'space-toggle')) return;
    state.touchPinned = !state.touchPinned;
    state.keyboardToggleCount += 1;
    updateFromSources('keyboard-toggle');
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const hasActiveIntent = state.hovered || state.focusWithin || state.touchPinned || state.desiredCtaVisible;
    if (!hasActiveIntent) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, 'escape-reset')) return;
    state.escapeResetCount += 1;
    resetSources('escape-reset');
  });

  resetButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!recordInput(kind, event, `${lastPointerType}-reset-button`)) return;
    state.buttonResetCount += 1;
    resetSources('reset-button');
  });

  ctaButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!recordInput(kind, event, `${lastPointerType}-cta-activation`)) return;
    state.ctaActivationCount += 1;
    archiveStatus.textContent = 'Report selected';
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (state.animationActive) stopMotions();
    applyStableVisuals(state.desiredCtaVisible);
  });

  applyStableVisuals(false);

  const ready = (async () => {
    await document.fonts.ready;
    await nextFrames();
    const metaRect = metadataLayer.getBoundingClientRect();
    const ctaRect = ctaLayer.getBoundingClientRect();
    state.baselineValidated = closeEnough(metaRect.left, ctaRect.left)
      && closeEnough(metaRect.top, ctaRect.top)
      && closeEnough(metaRect.width, ctaRect.width)
      && closeEnough(metaRect.height, ctaRect.height);
    state.metadataVisibleValidated = Number.parseFloat(getComputedStyle(metadata).opacity) > .96;
    state.ctaVisibleValidated = Number.parseFloat(getComputedStyle(cta).opacity) < .05;
    state.initialStaticVerified = state.baselineValidated
      && state.metadataVisibleValidated
      && state.ctaVisibleValidated
      && state.inputCount === 0
      && state.handoffStartCount === 0
      && state.handoffCompleteCount === 0
      && state.activeRole === 'metadata';
  })();

  const render = () => {
    state.renderCount += 1;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();

    const metaRect = metadataLayer.getBoundingClientRect();
    const ctaRect = ctaLayer.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const desiredRole = state.desiredCtaVisible ? 'cta' : 'metadata';
    const metadataOpacity = Number.parseFloat(getComputedStyle(metadata).opacity);
    const ctaOpacity = Number.parseFloat(getComputedStyle(cta).opacity);
    const stableVisuals = state.animationActive || (
      state.activeRole === desiredRole
      && (state.desiredCtaVisible
        ? metadataOpacity < .05 && ctaOpacity > .96
        : metadataOpacity > .96 && ctaOpacity < .05)
    );
    const semanticsMatch = card.dataset.role === desiredRole
      && card.getAttribute('aria-expanded') === String(state.desiredCtaVisible)
      && roleSlot.dataset.activeRole === desiredRole
      && metadataLayer.getAttribute('aria-hidden') === String(state.desiredCtaVisible)
      && ctaLayer.getAttribute('aria-hidden') === String(!state.desiredCtaVisible)
      && ctaButton.tabIndex === (state.desiredCtaVisible ? 0 : -1);
    const sharedGeometry = closeEnough(metaRect.left, ctaRect.left)
      && closeEnough(metaRect.top, ctaRect.top)
      && closeEnough(metaRect.width, ctaRect.width)
      && closeEnough(metaRect.height, ctaRect.height);
    const withinViewport = cardRect.left >= -1
      && cardRect.top >= -1
      && cardRect.right <= innerWidth + 1
      && cardRect.bottom <= innerHeight + 1
      && shellRect.left >= -1
      && shellRect.top >= -1
      && shellRect.right <= innerWidth + 1
      && shellRect.bottom <= innerHeight + 1
      && stageRect.width <= innerWidth + 1
      && stageRect.height <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;
    const countersValid = counters.every(key => Number.isInteger(state[key]) && state[key] >= 0)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.handoffCompleteCount <= state.handoffStartCount;

    return typeof animate === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && document.querySelectorAll('#role-slot').length === 1
      && document.querySelectorAll('#role-slot > .role-layer').length === 2
      && state.automaticRehearsal === false
      && state.previewClockDriven === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.initialStaticVerified
      && state.baselineValidated
      && sharedGeometry
      && stableVisuals
      && semanticsMatch
      && countersValid
      && withinViewport
      && state.renderCount > 0;
  };

  window.addEventListener('beforeunload', () => {
    for (const motion of motions) motion.stop();
  }, { once: true });

  installPreviewController({
    id: 'card-metadata-to-cta-role-swap',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
