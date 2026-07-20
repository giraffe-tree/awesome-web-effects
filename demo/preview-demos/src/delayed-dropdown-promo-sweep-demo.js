import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('.dropdown-stage');
  const trigger = document.querySelector('#products-trigger');
  const menu = document.querySelector('#product-menu');
  const menuLinks = [...menu.querySelectorAll('a')];
  const productLinks = [...menu.querySelectorAll('.menu-item')];
  const promoCard = document.querySelector('#promo-card');
  const promoPhoto = document.querySelector('#promo-photo');
  const sweep = document.querySelector('#promo-sweep');
  const chip = document.querySelector('#promo-chip');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const normalSweepDelay = 680;
  const reducedSweepDelay = 70;

  const counts = {
    input: 0,
    toggle: 0,
    open: 0,
    close: 0,
    escape: 0,
    outside: 0,
    focusOut: 0,
    linkActivation: 0,
    delayScheduled: 0,
    delayCancelled: 0,
    sweepStarted: 0,
    sweepCompleted: 0,
    sweepCancelled: 0,
    render: 0,
    automaticOpen: 0,
  };

  const state = {
    id: 'delayed-dropdown-promo-sweep',
    open: false,
    phase: 'closed',
    sweep: 'idle',
    delayPending: false,
    inputKind: 'none',
    reducedMotion: reducedMotion.matches,
    revision: 0,
    assetReady: false,
    initialClosedVerified: false,
    automaticFallback: false,
    counts,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__PREVIEW_INTERACTION_COUNTS__ = counts;

  let latestPointerKind = 'mouse';
  let sweepTimer = null;
  let sweepEndTimer = null;
  let closeTimer = null;

  const menuMotion = animate(menu, {
    opacity: [0, 1],
    y: [-10, 0],
    scale: [.968, 1],
  }, {
    duration: .34,
    ease: [.22, 1, .36, 1],
    autoplay: false,
  });
  const linkMotion = animate(productLinks, {
    opacity: [0, 1],
    x: [-6, 0],
  }, {
    duration: .24,
    delay: .06,
    ease: [.22, 1, .36, 1],
    autoplay: false,
  });
  const sweepMotion = animate(sweep, {
    x: ['-110%', '610%'],
  }, {
    duration: .78,
    ease: [.2, .72, .3, 1],
    autoplay: false,
  });
  const chipMotion = animate(chip, {
    opacity: [0, 1],
    scale: [.86, 1],
    y: [3, 0],
  }, {
    duration: .28,
    ease: [.22, 1, .36, 1],
    autoplay: false,
  });
  const motions = [menuMotion, linkMotion, sweepMotion, chipMotion];
  motions.forEach(motion => {
    motion.pause();
    motion.time = 0;
  });

  function clearTimer(timer) {
    if (timer !== null) window.clearTimeout(timer);
    return null;
  }

  function setMenuFocusable(focusable) {
    menu.inert = !focusable;
    if (focusable) menu.removeAttribute('inert');
    else menu.setAttribute('inert', '');
    menuLinks.forEach(link => {
      if (focusable) link.removeAttribute('tabindex');
      else link.tabIndex = -1;
    });
  }

  function resetSweepPresentation() {
    sweepMotion.pause();
    sweepMotion.time = 0;
    chipMotion.pause();
    chipMotion.time = 0;
    promoCard.dataset.sweep = 'idle';
    state.sweep = 'idle';
  }

  function cancelSweep() {
    const hadPendingDelay = sweepTimer !== null;
    const hadRunningSweep = sweepEndTimer !== null || state.sweep === 'running';
    if (hadPendingDelay) counts.delayCancelled += 1;
    if (hadRunningSweep) counts.sweepCancelled += 1;
    sweepTimer = clearTimer(sweepTimer);
    sweepEndTimer = clearTimer(sweepEndTimer);
    state.delayPending = false;
    resetSweepPresentation();
  }

  function finishSweep(revision) {
    if (!state.open || revision !== state.revision || state.sweep !== 'running') return;
    sweepEndTimer = null;
    promoCard.dataset.sweep = 'complete';
    state.sweep = 'complete';
    state.phase = 'open';
    counts.sweepCompleted += 1;
  }

  function runSweep(revision) {
    if (!state.open || revision !== state.revision || !state.delayPending) return;
    sweepTimer = null;
    state.delayPending = false;
    state.sweep = 'running';
    state.phase = 'sweeping';
    promoCard.dataset.sweep = 'running';
    counts.sweepStarted += 1;

    if (state.reducedMotion) {
      chipMotion.pause();
      chipMotion.time = chipMotion.duration;
      sweepMotion.pause();
      sweepMotion.time = 0;
      finishSweep(revision);
      return;
    }

    sweepMotion.pause();
    sweepMotion.time = 0;
    sweepMotion.speed = 1;
    sweepMotion.play();
    chipMotion.pause();
    chipMotion.time = 0;
    chipMotion.speed = 1;
    chipMotion.play();
    sweepEndTimer = window.setTimeout(() => finishSweep(revision), 820);
  }

  function scheduleSweep(revision) {
    state.delayPending = true;
    state.sweep = 'waiting';
    state.phase = 'awaiting-sweep';
    promoCard.dataset.sweep = 'waiting';
    counts.delayScheduled += 1;
    const delay = state.reducedMotion ? reducedSweepDelay : normalSweepDelay;
    sweepTimer = window.setTimeout(() => runSweep(revision), delay);
  }

  function recordInput(inputKind) {
    state.inputKind = inputKind;
    counts.input += 1;
  }

  function playOpenMotion(wasHidden) {
    if (state.reducedMotion) {
      menuMotion.pause();
      menuMotion.time = menuMotion.duration;
      linkMotion.pause();
      linkMotion.time = linkMotion.duration;
      return;
    }
    if (wasHidden) {
      menuMotion.time = 0;
      linkMotion.time = 0;
    }
    menuMotion.speed = 1;
    linkMotion.speed = 1;
    menuMotion.play();
    linkMotion.play();
  }

  function openMenu(inputKind) {
    if (state.open) return;
    recordInput(inputKind);
    counts.open += 1;
    state.revision += 1;
    const revision = state.revision;
    const wasHidden = menu.hidden;
    closeTimer = clearTimer(closeTimer);
    cancelSweep();
    menu.hidden = false;
    setMenuFocusable(true);
    trigger.setAttribute('aria-expanded', 'true');
    state.open = true;
    playOpenMotion(wasHidden);
    scheduleSweep(revision);
  }

  function finishClose(revision) {
    if (state.open || revision !== state.revision) return;
    closeTimer = null;
    menuMotion.pause();
    menuMotion.time = 0;
    linkMotion.pause();
    linkMotion.time = 0;
    menu.hidden = true;
    state.phase = 'closed';
  }

  function closeMenu(inputKind, { restoreFocus = false } = {}) {
    if (!state.open) return;
    const focusWasInside = menu.contains(document.activeElement);
    recordInput(inputKind);
    counts.close += 1;
    state.revision += 1;
    const revision = state.revision;
    state.open = false;
    state.phase = 'closing';
    trigger.setAttribute('aria-expanded', 'false');
    setMenuFocusable(false);
    cancelSweep();

    if (restoreFocus || focusWasInside) trigger.focus({ preventScroll: true });
    if (state.reducedMotion) {
      finishClose(revision);
      return;
    }

    menuMotion.speed = -1;
    linkMotion.speed = -1;
    menuMotion.play();
    linkMotion.play();
    const remaining = Math.max(80, Math.round((Number(menuMotion.time) || menuMotion.duration) * 1000) + 35);
    closeTimer = window.setTimeout(() => finishClose(revision), remaining);
  }

  trigger.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });

  trigger.addEventListener('click', event => {
    counts.toggle += 1;
    const inputKind = event.detail === 0 ? 'keyboard' : latestPointerKind;
    if (state.open) closeMenu(inputKind);
    else openMenu(inputKind);
  });

  trigger.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    if (!state.open) {
      counts.toggle += 1;
      openMenu('keyboard');
    }
    requestAnimationFrame(() => productLinks[0].focus({ preventScroll: true }));
  });

  menuLinks.forEach(link => {
    link.addEventListener('click', event => {
      if (!state.open) return;
      counts.linkActivation += 1;
      closeMenu(event.detail === 0 ? 'keyboard' : 'pointer', { restoreFocus: true });
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !state.open) return;
    event.preventDefault();
    counts.escape += 1;
    closeMenu('keyboard', { restoreFocus: true });
  });

  document.addEventListener('pointerdown', event => {
    if (!state.open || trigger.contains(event.target) || menu.contains(event.target)) return;
    counts.outside += 1;
    closeMenu(event.pointerType || 'pointer');
  });

  document.addEventListener('focusin', event => {
    if (!state.open || trigger.contains(event.target) || menu.contains(event.target)) return;
    counts.focusOut += 1;
    closeMenu('keyboard');
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (!state.open) return;
    menuMotion.pause();
    menuMotion.time = menuMotion.duration;
    linkMotion.pause();
    linkMotion.time = linkMotion.duration;

    if (state.delayPending) {
      sweepTimer = clearTimer(sweepTimer);
      counts.delayCancelled += 1;
      state.delayPending = false;
      resetSweepPresentation();
      scheduleSweep(state.revision);
      return;
    }

    if (event.matches && state.sweep === 'running') {
      sweepEndTimer = clearTimer(sweepEndTimer);
      sweepMotion.pause();
      sweepMotion.time = 0;
      chipMotion.pause();
      chipMotion.time = chipMotion.duration;
      finishSweep(state.revision);
    }
  });

  window.addEventListener('beforeunload', () => {
    sweepTimer = clearTimer(sweepTimer);
    sweepEndTimer = clearTimer(sweepEndTimer);
    closeTimer = clearTimer(closeTimer);
  }, { once: true });

  const assetReady = Promise.all([promoPhoto.decode(), document.fonts.ready]).then(() => {
    state.assetReady = true;
    state.initialClosedVerified = menu.hidden
      && menu.inert
      && trigger.getAttribute('aria-expanded') === 'false'
      && menuLinks.every(link => link.tabIndex === -1)
      && counts.open === 0
      && counts.automaticOpen === 0;
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await assetReady;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const promoUrl = new URL(promoPhoto.currentSrc || promoPhoto.src, location.href);
    const promoFile = promoUrl.pathname.split('/').at(-1) || '';
    const sourcePromo = promoUrl.pathname.includes('/assets/aesthetic-wave-02/delayed-dropdown-promo-sweep/')
      && promoFile === 'burnt-orange-technical-daypack.jpg';
    const builtPromo = promoUrl.pathname.includes('/preview-demos/dist/assets/')
      && promoFile.startsWith('burnt-orange-technical-daypack-')
      && promoFile.endsWith('.jpg');
    const oneLocalPromo = promoUrl.origin === location.origin
      && (sourcePromo || builtPromo)
      && document.querySelectorAll('#promo-photo').length === 1;
    const stageBounds = stage.getBoundingClientRect();
    const triggerBounds = trigger.getBoundingClientRect();
    const menuBounds = menu.hidden ? null : menu.getBoundingClientRect();
    const menuFits = !menuBounds || (
      menuBounds.left >= -1
      && menuBounds.top >= -1
      && menuBounds.right <= innerWidth + 1
      && menuBounds.bottom <= innerHeight + 1
      && menuBounds.width > 0
      && menuBounds.height > 0
    );
    const focusContract = state.open
      ? !menu.hidden && !menu.inert && menuLinks.every(link => link.tabIndex >= 0)
      : menu.inert && menuLinks.every(link => link.tabIndex === -1);
    const hiddenContract = state.phase === 'closed' ? menu.hidden : true;
    const validPhase = ['closed', 'awaiting-sweep', 'sweeping', 'open', 'closing'].includes(state.phase);
    const validSweep = ['idle', 'waiting', 'running', 'complete'].includes(state.sweep);
    return Boolean(
      state.assetReady
      && state.initialClosedVerified
      && oneLocalPromo
      && state.automaticFallback === false
      && counts.automaticOpen === 0
      && promoPhoto.complete
      && promoPhoto.naturalWidth === 1280
      && promoPhoto.naturalHeight === 960
      && trigger.getAttribute('aria-expanded') === String(state.open)
      && focusContract
      && hiddenContract
      && menuFits
      && validPhase
      && validSweep
      && state.delayPending === (sweepTimer !== null)
      && counts.delayScheduled >= counts.sweepStarted
      && counts.sweepStarted >= counts.sweepCompleted
      && counts.open >= counts.sweepStarted
      && Object.values(counts).every(Number.isInteger)
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && window.__PREVIEW_INTERACTION_COUNTS__ === counts
      && motions.every(motion => typeof motion.play === 'function' && typeof motion.pause === 'function')
      && stageBounds.width >= innerWidth * .99
      && stageBounds.height >= innerHeight * .99
      && triggerBounds.width > 0
      && triggerBounds.height > 0
      && counts.render > 0
    );
  };

  installPreviewController({
    id: 'delayed-dropdown-promo-sweep',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => { counts.render += 1; },
    ready: assetReady,
  });
} catch (error) {
  markPreviewFailure(error);
}
