import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const HOVER_DURATION = 0.22;
const TRANSACTION_DURATION = 0.82;
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));

try {
  const stage = document.querySelector('#offset-stage');
  const wrap = document.querySelector('#offset-wrap');
  const button = document.querySelector('#offset-button');
  const shadow = document.querySelector('#offset-shadow');
  const ctaCopy = document.querySelector('#cta-copy');
  const ctaDetail = document.querySelector('#cta-detail');
  const reservationCopy = document.querySelector('#reservation-copy');
  const stockRail = document.querySelector('#stock-rail');

  if (!stage || !wrap || !button || !shadow || !ctaCopy || !ctaDetail || !reservationCopy || !stockRail) {
    throw new Error('Opposed diagonal CTA DOM is incomplete');
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    id: 'opposed-diagonal-offset-cta',
    task: 'human-controlled-limited-edition-cta-registration',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'foreground-ink-and-backing-plate-separate-on-opposed-diagonals-and-register-on-press',
    assetStrategy: 'code-native-print-layers-no-functional-raster-input-required',
    imageGenUsed: false,
    imageGenDecision: 'not-used-because-layer-registration-and-typography-are-the-functional-inputs',
    captureType: 'hybrid',
    acceptedInputs: ['trusted-pointer-hover', 'trusted-pointer-activation', 'trusted-keyboard-activation', 'escape-release'],
    causality: 'trusted-human-activation-starts-one-finite-registration-transaction-before-content-commit',
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticPlayback: false,
    automaticCycle: false,
    automaticLoop: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockMutationBeforeInput: false,
    previewClockDrivesFiniteTransitionAfterInput: true,
    hoverDuration: HOVER_DURATION,
    transactionDuration: TRANSACTION_DURATION,
    hovered: false,
    focused: false,
    pressing: false,
    reserved: false,
    pendingReserved: null,
    transactionActive: false,
    transactionProgress: 0,
    latestPreviewTime: 0,
    hoverStartTime: 0,
    hoverStartProgress: 0,
    hoverTargetProgress: 0,
    hoverProgress: 0,
    transactionStartTime: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerEnterCount: 0,
    pointerActivationCount: 0,
    keyboardActivationCount: 0,
    escapeReleaseCount: 0,
    transactionStartCount: 0,
    transactionCompleteCount: 0,
    reservationCommitCount: 0,
    reservationReleaseCount: 0,
    prematureCommitCount: 0,
    deferredCommitVerified: false,
    opposedSeparationVerified: false,
    registrationContactVerified: false,
    canceledTransactionCount: 0,
    motionControlCreateCount: 0,
    motionSeekCount: 0,
    finiteTransitionStepCount: 0,
    contentMutationCount: 0,
    nonInputVisualMutationCountAfterReady: 0,
    resizeCount: 0,
    renderCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    finalStatus: 'ready-to-reserve',
    geometryValidated: false,
    stageCoverageRatio: 0,
    initialStaticVerified: false,
    motionControlReady: false,
    reducedMotion: reducedMotion.matches,
    ready: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__OPPOSED_DIAGONAL_CTA_STATE__ = state;

  const frontHover = animate(button, {
    x: [0, -6],
    y: [0, -6],
  }, { duration: HOVER_DURATION, ease: 'easeOut' });
  const backHover = animate(shadow, {
    x: [3, 9],
    y: [3, 9],
  }, { duration: HOVER_DURATION, ease: 'easeOut' });
  const frontTransaction = animate(button, {
    x: [-6, 0, 0, 2, -2, -6],
    y: [-6, 0, 0, 2, -2, -6],
    scale: [1, .975, .975, 1.015, .995, 1],
  }, {
    duration: TRANSACTION_DURATION,
    times: [0, .2, .42, .58, .74, 1],
    ease: 'linear',
  });
  const backTransaction = animate(shadow, {
    x: [9, 0, 0, -2, 5, 9],
    y: [9, 0, 0, -2, 5, 9],
    scale: [1, 1.015, 1.015, .98, 1.01, 1],
  }, {
    duration: TRANSACTION_DURATION,
    times: [0, .2, .42, .58, .74, 1],
    ease: 'linear',
  });

  const controls = [frontHover, backHover, frontTransaction, backTransaction];
  controls.forEach(control => {
    control.pause();
    control.time = 0;
  });
  state.motionControlCreateCount = controls.length;
  state.motionControlReady = controls.every(control => control.duration > 0);

  const nextFrames = (count = 2) => new Promise(resolve => {
    const advance = remaining => {
      if (remaining <= 0) resolve();
      else requestAnimationFrame(() => advance(remaining - 1));
    };
    advance(count);
  });

  const acceptInput = (event, kind) => {
    state.inputCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = event.isTrusted;
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.trustedInputCount += 1;
    return true;
  };

  const setHoverTarget = target => {
    state.hoverStartProgress = state.hoverProgress;
    state.hoverTargetProgress = target;
    state.hoverStartTime = state.latestPreviewTime;
  };

  const setContent = reserved => {
    state.reserved = reserved;
    state.finalStatus = reserved ? 'edition-reserved' : 'ready-to-reserve';
    stage.dataset.reserved = String(reserved);
    button.setAttribute('aria-pressed', String(reserved));
    ctaCopy.textContent = reserved ? 'Release this hold' : 'Hold an edition';
    ctaDetail.textContent = reserved ? 'Reserved · undo anytime' : '£24 · no charge today';
    reservationCopy.textContent = reserved ? 'Copy 12 held for you' : 'Ready to reserve';
    stockRail.textContent = reserved ? '11 copies remain' : '12 copies remain';
    state.contentMutationCount += 1;
  };

  const startTransaction = targetReserved => {
    if (state.transactionActive) {
      state.canceledTransactionCount += 1;
    }
    state.pendingReserved = targetReserved;
    state.transactionActive = true;
    state.transactionProgress = 0;
    state.transactionStartTime = state.latestPreviewTime;
    state.transactionStartCount += 1;
    stage.dataset.transaction = 'active';
    button.setAttribute('aria-busy', 'true');
    setHoverTarget(1);
  };

  const completeTransaction = () => {
    if (!state.transactionActive) return;
    const targetReserved = Boolean(state.pendingReserved);
    setContent(targetReserved);
    if (targetReserved) state.reservationCommitCount += 1;
    else state.reservationReleaseCount += 1;
    state.pendingReserved = null;
    state.transactionActive = false;
    state.transactionProgress = 1;
    state.transactionCompleteCount += 1;
    stage.dataset.transaction = 'idle';
    button.removeAttribute('aria-busy');
  };

  const activate = event => {
    const keyboard = event.detail === 0;
    const kind = keyboard ? 'keyboard-activation' : 'pointer-activation';
    if (!acceptInput(event, kind)) return;
    if (keyboard) state.keyboardActivationCount += 1;
    else state.pointerActivationCount += 1;
    startTransaction(!state.reserved);
  };

  wrap.addEventListener('pointerenter', event => {
    if (!acceptInput(event, 'pointer-hover')) return;
    state.pointerEnterCount += 1;
    state.hovered = true;
    setHoverTarget(1);
  });

  wrap.addEventListener('pointerleave', event => {
    if (!acceptInput(event, 'pointer-leave')) return;
    state.hovered = false;
    state.pressing = false;
    if (!state.focused && !state.transactionActive) setHoverTarget(0);
  });

  button.addEventListener('pointerdown', event => {
    if (!acceptInput(event, 'pointer-press')) return;
    state.pressing = true;
  });

  button.addEventListener('pointerup', event => {
    if (!acceptInput(event, 'pointer-release')) return;
    state.pressing = false;
  });

  button.addEventListener('pointercancel', event => {
    if (!event.isTrusted) return;
    state.pressing = false;
  });

  button.addEventListener('focus', event => {
    if (!event.isTrusted) return;
    state.focused = true;
    setHoverTarget(1);
  });

  button.addEventListener('blur', event => {
    if (!event.isTrusted) return;
    state.focused = false;
    if (!state.hovered && !state.transactionActive) setHoverTarget(0);
  });

  button.addEventListener('click', activate);

  button.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state.reserved && !state.transactionActive) {
      if (!acceptInput(event, 'escape-release')) return;
      event.preventDefault();
      state.keyboardActivationCount += 1;
      state.escapeReleaseCount += 1;
      startTransaction(false);
    }
  });

  const renderHover = time => {
    const elapsed = Math.max(0, time - state.hoverStartTime);
    const local = state.reducedMotion ? 1 : clamp(elapsed / HOVER_DURATION);
    const eased = 1 - ((1 - local) ** 3);
    state.hoverProgress = state.hoverStartProgress + (state.hoverTargetProgress - state.hoverStartProgress) * eased;
    frontHover.time = state.hoverProgress * HOVER_DURATION;
    backHover.time = state.hoverProgress * HOVER_DURATION;
    state.motionSeekCount += 2;
    if ((state.pointerEnterCount > 0 || state.focused) && state.hoverProgress >= .9) {
      state.opposedSeparationVerified = true;
    }
  };

  const renderTransaction = time => {
    const elapsed = Math.max(0, time - state.transactionStartTime);
    const progress = state.reducedMotion ? 1 : clamp(elapsed / TRANSACTION_DURATION);
    state.transactionProgress = progress;
    state.finiteTransitionStepCount += 1;
    if (state.reserved === Boolean(state.pendingReserved)) state.prematureCommitCount += 1;
    else state.deferredCommitVerified = true;
    frontTransaction.time = progress * TRANSACTION_DURATION;
    backTransaction.time = progress * TRANSACTION_DURATION;
    state.motionSeekCount += 2;
    if (progress >= .2 && progress <= .5) state.registrationContactVerified = true;
    if (progress >= 1) completeTransaction();
  };

  const renderPress = () => {
    if (!state.pressing || state.transactionActive) return;
    frontHover.time = 0;
    backHover.time = 0;
    state.motionSeekCount += 2;
  };

  const validateGeometry = () => {
    const stageRect = stage.getBoundingClientRect();
    const sheetRect = stage.querySelector('.press-sheet').getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const stageArea = stageRect.width * stageRect.height;
    const sheetArea = sheetRect.width * sheetRect.height;
    state.stageCoverageRatio = stageArea > 0 ? sheetArea / stageArea : 0;
    state.geometryValidated = stageRect.width >= 220
      && stageRect.height >= 160
      && state.stageCoverageRatio >= .75
      && buttonRect.width >= 120
      && buttonRect.height >= 40
      && buttonRect.left >= sheetRect.left
      && buttonRect.right <= sheetRect.right + 12;
  };

  window.addEventListener('resize', () => {
    state.resizeCount += 1;
    validateGeometry();
  });

  const render = time => {
    state.latestPreviewTime = time;
    state.renderCount += 1;
    if (state.transactionActive) renderTransaction(time);
    else {
      renderHover(time);
      renderPress();
    }
  };

  const ready = (async () => {
    await document.fonts.ready;
    await nextFrames(2);
    validateGeometry();
    const beforeFront = getComputedStyle(button).transform;
    const beforeBack = getComputedStyle(shadow).transform;
    await nextFrames(2);
    state.initialStaticVerified = beforeFront === getComputedStyle(button).transform
      && beforeBack === getComputedStyle(shadow).transform
      && state.inputCount === 0
      && state.transactionStartCount === 0
      && state.contentMutationCount === 0;
    state.ready = state.geometryValidated && state.initialStaticVerified && state.motionControlReady;
    if (!state.ready) throw new Error('Opposed diagonal CTA failed its initial readiness contract');
  })();

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await nextFrames(2);
    validateGeometry();
    const buttonRect = button.getBoundingClientRect();
    const sheetRect = stage.querySelector('.press-sheet').getBoundingClientRect();
    const transactionAccountingValid = state.transactionCompleteCount
      === state.reservationCommitCount + state.reservationReleaseCount;
    return state.ready
      && state.claimedLibrary === 'motion@12.42.2'
      && state.motionControlCreateCount === 4
      && state.motionControlReady
      && state.initialStaticVerified
      && state.geometryValidated
      && state.stageCoverageRatio >= .75
      && buttonRect.width >= 120
      && buttonRect.height >= 40
      && buttonRect.left >= sheetRect.left
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.automaticPlayback === false
      && state.automaticCycle === false
      && state.automaticLoop === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.previewClockMutationBeforeInput === false
      && state.prematureCommitCount === 0
      && (state.pointerEnterCount === 0 || state.opposedSeparationVerified)
      && (state.transactionStartCount === 0 || state.deferredCommitVerified)
      && (state.transactionCompleteCount === 0 || state.registrationContactVerified || state.reducedMotion)
      && transactionAccountingValid
      && state.contentMutationCount === state.transactionCompleteCount;
  };

  installPreviewController({
    id: 'opposed-diagonal-offset-cta',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
