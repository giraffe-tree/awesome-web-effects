import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('.curtain-stage');
  const curtain = document.querySelector('#curtain');
  const toggle = document.querySelector('#menu-toggle');
  const toggleLabel = document.querySelector('#toggle-label');
  const links = [...curtain.querySelectorAll('.menu-link')];
  const featureKicker = document.querySelector('#feature-kicker');
  const featureTitle = document.querySelector('#feature-title');
  const featureDeck = document.querySelector('#feature-deck');
  const featureDate = document.querySelector('#feature-date');
  const featureRoom = document.querySelector('#feature-room');
  const featureAccess = document.querySelector('#feature-access');
  const plateCode = document.querySelector('#plate-code');
  const pageMarker = document.querySelector('#page-marker');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const closedClip = 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)';
  const edgeClip = 'polygon(38% 0%, 100% 0%, 100% 54%, 68% 38%)';
  const almostOpenClip = 'polygon(0% 0%, 100% 0%, 100% 100%, 18% 82%)';
  const openClip = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
  const linkThresholds = [.34, .44, .54, .64];

  const sections = {
    exhibitions: {
      kicker: 'Current exhibition · Coast archive',
      title: 'After the<br /> wild tide.',
      deck: 'Field recordings, salt maps and moving images from six changing shorelines.',
      date: '18 Sep',
      room: 'North 02',
      access: 'Free',
      code: 'A/07',
      marker: 'Exhibitions',
    },
    essays: {
      kicker: 'New essay · Urban listening',
      title: 'Notes on a<br /> listening city.',
      deck: 'Six field recordings trace the quiet infrastructure beneath the everyday street.',
      date: 'Issue 07',
      room: 'Read 12 min',
      access: 'Essay',
      code: 'E/28',
      marker: 'Essays',
    },
    artists: {
      kicker: 'Living index · 42 practices',
      title: 'An index that<br /> keeps moving.',
      deck: 'Meet the artists, researchers and sound makers shaping this season’s programme.',
      date: '42 entries',
      room: 'A—Z',
      access: 'Index',
      code: 'I/42',
      marker: 'Artists',
    },
    visit: {
      kicker: 'Plan a visit · Moss Lane',
      title: 'Come for the<br /> long looking.',
      deck: 'Four rooms, a listening library and a late Friday programme by the river.',
      date: 'Thu—Sun',
      room: '11—18',
      access: 'Step-free',
      code: 'V/04',
      marker: 'Visit',
    },
  };

  const state = {
    claimedLibrary: 'motion@12.42.2',
    renderer: 'dom',
    mechanism: 'css-clip-path-polygon',
    phase: 'closed',
    progress: 0,
    targetProgress: 0,
    motionActive: false,
    selectedSection: 'exhibitions',
    focusedIndex: -1,
    focusTrapActive: false,
    inputCount: 0,
    openCount: 0,
    closeCount: 0,
    selectionCount: 0,
    lastInput: 'idle',
    inputAdapters: ['pointer', 'touch', 'click', 'keyboard'],
    automaticPlayback: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    previewClockDrivesMenu: false,
    reducedMotion: reducedMotionQuery.matches,
    motionControlsCreated: false,
    syncCount: 0,
    initialStaticConfirmed: false,
    initialSignature: '',
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  const revealMotion = animate(
    curtain,
    { clipPath: [closedClip, edgeClip, almostOpenClip, openClip] },
    { duration: 1, times: [0, .43, .78, 1], ease: [0.22, 1, 0.36, 1], autoplay: false },
  );
  const linkMotions = links.map((link) => animate(
    link,
    { opacity: [0, 1], y: [12, 0] },
    { duration: 1, ease: [0.22, 1, 0.36, 1], autoplay: false },
  ));
  const motionControls = [revealMotion, ...linkMotions];
  motionControls.forEach((control) => {
    control.pause();
    control.time = 0;
  });
  state.motionControlsCreated = true;

  let animationFrame = 0;
  let animationToken = 0;
  let returnFocusOnClose = false;

  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const easeOutQuart = (value) => 1 - ((1 - value) ** 4);

  const recordInput = (source) => {
    state.inputCount += 1;
    state.lastInput = source;
  };

  const activeFocusables = () => [toggle, ...links];

  const syncInterface = () => {
    const menuActive = state.phase !== 'closed' || state.progress > 0;
    stage.dataset.menuActive = String(menuActive);
    stage.dataset.menuPhase = state.phase;
    stage.dataset.selectedSection = state.selectedSection;
    curtain.dataset.progress = state.progress.toFixed(4);
    curtain.dataset.phase = state.phase;
    curtain.dataset.lastInput = state.lastInput;
    toggle.setAttribute('aria-expanded', String(menuActive));
    toggle.setAttribute('aria-label', menuActive ? 'Close publication index' : 'Open publication index');
    toggleLabel.textContent = menuActive ? 'Close' : 'Index';
    curtain.setAttribute('aria-hidden', String(!menuActive));
    curtain.inert = !menuActive;
    curtain.style.pointerEvents = menuActive ? 'auto' : 'none';
    state.focusTrapActive = menuActive;
    state.focusedIndex = activeFocusables().indexOf(document.activeElement);
    state.syncCount += 1;
  };

  const applyProgress = (progress) => {
    state.progress = clamp(progress);
    revealMotion.time = state.progress * revealMotion.duration;
    linkMotions.forEach((motion, index) => {
      const localProgress = clamp((state.progress - linkThresholds[index]) / .18);
      motion.time = localProgress * motion.duration;
    });
    syncInterface();
  };

  const settleAt = (progress) => {
    cancelAnimationFrame(animationFrame);
    state.progress = progress;
    state.targetProgress = progress;
    state.motionActive = false;
    state.phase = progress === 1 ? 'open' : 'closed';
    applyProgress(progress);

    if (progress === 1 && state.lastInput.startsWith('keyboard')) {
      links[0].focus({ preventScroll: true });
      state.focusedIndex = 1;
    }
    if (progress === 0 && returnFocusOnClose) {
      toggle.focus({ preventScroll: true });
      state.focusedIndex = 0;
      returnFocusOnClose = false;
    }
  };

  const animateTo = (targetProgress, source, shouldReturnFocus = false) => {
    const target = clamp(targetProgress);
    animationToken += 1;
    const token = animationToken;
    cancelAnimationFrame(animationFrame);
    state.targetProgress = target;
    state.phase = target === 1 ? 'opening' : 'closing';
    state.motionActive = true;
    if (target === 1) state.openCount += 1;
    else state.closeCount += 1;
    returnFocusOnClose = shouldReturnFocus;
    syncInterface();

    if (state.reducedMotion || Math.abs(target - state.progress) < .001) {
      settleAt(target);
      return;
    }

    const from = state.progress;
    const startedAt = performance.now();
    const duration = 760 * Math.abs(target - from);
    const tick = (now) => {
      if (token !== animationToken) return;
      const linearProgress = clamp((now - startedAt) / duration);
      const easedProgress = easeOutQuart(linearProgress);
      applyProgress(from + (target - from) * easedProgress);
      if (linearProgress < 1) animationFrame = requestAnimationFrame(tick);
      else settleAt(target);
    };
    animationFrame = requestAnimationFrame(tick);
  };

  const openMenu = (source) => animateTo(1, source, false);
  const closeMenu = (source, shouldReturnFocus = true) => animateTo(0, source, shouldReturnFocus);

  const toggleMenu = (source) => {
    recordInput(source);
    if (state.targetProgress === 1 && state.phase !== 'closed') closeMenu(source, true);
    else openMenu(source);
  };

  const selectSection = (sectionId) => {
    const section = sections[sectionId];
    if (!section) return;
    state.selectedSection = sectionId;
    state.selectionCount += 1;
    featureKicker.textContent = section.kicker;
    featureTitle.innerHTML = section.title;
    featureDeck.textContent = section.deck;
    featureDate.textContent = section.date;
    featureRoom.textContent = section.room;
    featureAccess.textContent = section.access;
    plateCode.textContent = section.code;
    pageMarker.textContent = section.marker;
    links.forEach((link) => {
      if (link.dataset.section === sectionId) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    syncInterface();
  };

  toggle.addEventListener('click', (event) => {
    const source = event.detail === 0 ? 'keyboard:toggle' : 'click:toggle';
    toggleMenu(source);
  });

  toggle.addEventListener('pointerdown', (event) => {
    state.lastInput = event.pointerType === 'touch' ? 'touch:toggle' : 'pointer:toggle';
  });

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const source = event.detail === 0 ? `keyboard:link:${link.dataset.section}` : `click:link:${link.dataset.section}`;
      recordInput(source);
      selectSection(link.dataset.section);
      closeMenu(source, true);
    });
    link.addEventListener('focus', () => {
      state.focusedIndex = activeFocusables().indexOf(link);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (!state.focusTrapActive) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      recordInput('keyboard:Escape');
      closeMenu('keyboard:Escape', true);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = activeFocusables();
    const currentIndex = focusables.indexOf(document.activeElement);
    const direction = event.shiftKey ? -1 : 1;
    const fallbackIndex = event.shiftKey ? 0 : -1;
    const nextIndex = (currentIndex === -1 ? fallbackIndex : currentIndex) + direction;
    const wrappedIndex = (nextIndex + focusables.length) % focusables.length;
    event.preventDefault();
    recordInput(event.shiftKey ? 'keyboard:Shift+Tab' : 'keyboard:Tab');
    focusables[wrappedIndex].focus({ preventScroll: true });
    state.focusedIndex = wrappedIndex;
  }, true);

  const handleReducedMotionChange = (event) => {
    state.reducedMotion = event.matches;
    if (event.matches && state.motionActive) settleAt(state.targetProgress);
    else syncInterface();
  };
  if (typeof reducedMotionQuery.addEventListener === 'function') reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  else reducedMotionQuery.addListener(handleReducedMotionChange);

  const interactionSignature = () => [
    state.phase,
    state.progress.toFixed(4),
    state.targetProgress.toFixed(4),
    state.motionActive,
    state.selectedSection,
    state.inputCount,
    getComputedStyle(curtain).clipPath,
    ...links.map((link) => getComputedStyle(link).opacity),
  ].join('|');

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`clip-path-menu-curtain: ${message}`);
    };
    const stageRect = stage.getBoundingClientRect();
    const curtainRect = curtain.getBoundingClientRect();
    const toggleRect = toggle.getBoundingClientRect();
    const selectedLink = links.find((link) => link.dataset.section === state.selectedSection);
    const currentLinks = links.filter((link) => link.getAttribute('aria-current') === 'page');
    const menuActive = state.phase !== 'closed' || state.progress > 0;
    const thresholdsOrdered = linkThresholds.every((value, index) => index === 0 || value > linkThresholds[index - 1]);

    invariant(state.claimedLibrary === 'motion@12.42.2' && typeof animate === 'function' && state.motionControlsCreated, 'real Motion controls are missing');
    invariant(state.renderer === 'dom' && state.mechanism === 'css-clip-path-polygon', 'DOM clip-path mechanism changed');
    invariant(revealMotion.duration === 1 && linkMotions.length === 4 && motionControls.every((control) => control.duration === 1), 'Motion timelines are invalid');
    invariant(new Set([closedClip, edgeClip, almostOpenClip, openClip]).size === 4 && closedClip.startsWith('polygon(') && openClip.startsWith('polygon('), 'authored polygon geometry is invalid');
    invariant(links.length === 4 && thresholdsOrdered && linkThresholds[0] >= .3 && linkThresholds[3] <= .7, 'content reveal no longer follows the moving edge');
    invariant(state.progress >= 0 && state.progress <= 1 && state.targetProgress >= 0 && state.targetProgress <= 1, 'menu progress escaped its boundaries');
    invariant(state.automaticPlayback === false && state.automaticFallback === false && state.syntheticInputDispatch === false && state.previewClockDrivesMenu === false, 'automatic or synthetic menu input is forbidden');
    invariant(state.inputAdapters.join('|') === 'pointer|touch|click|keyboard', 'input adapter contract changed');
    invariant(stage.dataset.menuActive === String(menuActive) && stage.dataset.menuPhase === state.phase && stage.dataset.selectedSection === state.selectedSection, 'stage menu state is stale');
    invariant(Number(curtain.dataset.progress) === Number(state.progress.toFixed(4)) && curtain.dataset.phase === state.phase, 'curtain progress state is stale');
    invariant(toggle.getAttribute('aria-expanded') === String(menuActive) && toggle.getAttribute('aria-controls') === 'curtain', 'menu toggle accessibility state is stale');
    invariant(curtain.getAttribute('aria-hidden') === String(!menuActive) && curtain.inert === !menuActive && state.focusTrapActive === menuActive, 'dialog or focus-trap state is stale');
    invariant(currentLinks.length === 1 && currentLinks[0] === selectedLink && Boolean(sections[state.selectedSection]), 'selected publication section is stale');
    invariant(featureTitle.textContent.replace(/\s+/g, ' ').trim().length > 8 && pageMarker.textContent === sections[state.selectedSection].marker, 'selected section content is stale');
    invariant(!state.reducedMotion || !state.motionActive, 'reduced motion must settle the curtain directly');
    invariant(curtainRect.width === stageRect.width && curtainRect.height === stageRect.height && toggleRect.width > 30 && toggleRect.height > 15, 'curtain or toggle geometry is invalid');
    invariant(curtainRect.left >= stageRect.left - .5 && curtainRect.right <= stageRect.right + .5 && curtainRect.top >= stageRect.top - .5 && curtainRect.bottom <= stageRect.bottom + .5, 'curtain escaped the preview');
    invariant((state.syncCount > 1 && state.inputCount > 0) || state.initialStaticConfirmed, 'initial frame must remain static until real input');
    invariant(window.__PREVIEW_INTERACTION_STATE__ === state && window.__PREVIEW_META__?.capture === 'real-demo', 'interaction state export is missing');
    return true;
  };

  applyProgress(0);
  const doubleFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.resolve(document.fonts?.ready).then(async () => {
    await doubleFrame();
    const before = interactionSignature();
    await doubleFrame();
    const after = interactionSignature();
    state.initialSignature = before;
    state.initialStaticConfirmed = before === after
      && state.phase === 'closed'
      && state.progress === 0
      && state.targetProgress === 0
      && state.inputCount === 0
      && !state.motionActive;
    if (!state.initialStaticConfirmed) throw new Error('Initial menu frame changed without user input.');
    if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial menu assertion failed.');
  });

  ready.catch(markPreviewFailure);

  installPreviewController({
    id: 'clip-path-menu-curtain',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => {},
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
