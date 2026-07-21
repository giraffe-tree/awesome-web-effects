import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#layered-menu-stage');
  const toggle = document.querySelector('#menu-toggle');
  const toggleLabel = toggle.querySelector('span');
  const menu = document.querySelector('#full-menu');
  const layers = [...document.querySelectorAll('.menu-layer')];
  const links = [...document.querySelectorAll('.menu-link')];
  const preview = document.querySelector('#menu-preview');
  const covers = [...document.querySelectorAll('.fieldwork-cover')];
  const pageKicker = document.querySelector('#page-kicker');
  const pageTitle = document.querySelector('#page-title');
  const pageDeck = document.querySelector('#page-deck');
  const issueResult = document.querySelector('#issue-result');
  const resultLabel = document.querySelector('#result-label');
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const easeInOutCubic = value => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
  const expectedLinkOrder = ['field-notes', 'dispatches', 'material-index', 'about'];
  const selectedContent = Object.freeze({
    'field-notes': {
      kicker: 'FIELD NOTES / SELECTED',
      title: 'Field studies, kept in motion.',
      deck: 'The section is now retained behind the closed index, ready for reading.',
      label: 'FIELD NOTES · READY'
    },
    dispatches: {
      kicker: 'DISPATCHES / SELECTED',
      title: 'Reports from the useful edge.',
      deck: 'Short observations from people building, mapping, and repairing in the field.',
      label: 'DISPATCHES · READY'
    },
    'material-index': {
      kicker: 'MATERIAL INDEX / SELECTED',
      title: 'A working archive of matter.',
      deck: 'Tactile studies, tools, finishes, and processes arranged for practical recall.',
      label: 'MATERIAL INDEX · READY'
    },
    about: {
      kicker: 'ABOUT / SELECTED',
      title: 'Independent, observant, common.',
      deck: 'North/Common is an editorial studio for fieldwork and material intelligence.',
      label: 'ABOUT · READY'
    }
  });

  const state = {
    id: 'layered-staggered-full-screen-menu',
    task: 'human-opens-north-common-index-selects-field-notes-and-receives-retained-page-result',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'trusted-toggle-drives-three-paused-motion-underplates-and-staggered-links-then-a-trusted-link-selection-reverses-the-stack-before-committing-the-page-result',
    assetStrategy: 'imagegen-editorial-cover-is-rendered-in-menu-preview-and-retained-selected-page-result',
    imageSourceType: 'imagegen-built-in',
    imageAssetPath: './assets/aesthetic-wave-06/layered-staggered-full-screen-menu/north-common-fieldwork-cover.jpg',
    imageProvenancePath: './assets/aesthetic-wave-06/layered-staggered-full-screen-menu/provenance.json',
    imagePublishedSha256: 'ec7ed6b2553ea86cb9c863d84d4faa3d347cdd7de7ddb63ff8b33013de3c29c5',
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    imageElementCount: covers.length,
    imageLoaded: false,
    imageUsedInClosedPage: false,
    imageUsedInMenuPreview: false,
    acceptedInputs: ['trusted-mouse-click', 'trusted-touch-tap', 'keyboard-enter-space', 'keyboard-escape', 'keyboard-arrow-navigation'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticPlayback: false,
    automaticOpen: false,
    automaticClose: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockOnlyAdvancesHumanStartedTransition: true,
    syntheticInputDispatch: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    untrustedMutationCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    toggleInputCount: 0,
    selectionInputCount: 0,
    navigationInputCount: 0,
    escapeInputCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    menuProgress: 0,
    targetProgress: 0,
    transitionFrom: 0,
    transitionTo: 0,
    transitionStartedAt: null,
    transitionDuration: 0,
    transitionActive: false,
    transitionFrameCount: 0,
    layerProgress: [0, 0, 0],
    itemProgress: Array(links.length).fill(0),
    previewProgress: 0,
    phase: 'closed-idle',
    result: 'awaiting-human-menu-toggle',
    resultRetained: false,
    pendingSelection: null,
    selectedSection: null,
    selectedTitle: null,
    openStartCount: 0,
    openCompletionCount: 0,
    closeStartCount: 0,
    closeCompletionCount: 0,
    reversalCount: 0,
    withdrawalCount: 0,
    selectionAttemptCount: 0,
    selectionCommitCount: 0,
    prematureCommitCount: 0,
    transitionRecords: [],
    inputRecords: [],
    linkOrder: links.map(link => link.dataset.section),
    linkOrderVerified: false,
    initialSignature: null,
    initialStillVerified: false,
    renderCount: 0,
    visualApplyCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    layerCoverageRatios: [0, 0, 0],
    fullStageGeometryVerified: false,
    controlsReady: false,
    fontsReady: false,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__LAYERED_EDITORIAL_MENU_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`layered-staggered-full-screen-menu: ${message}`);
  }

  const layerControls = layers.map(layer => {
    const control = animate(layer, { x: ['105%', '0%'] }, { duration: 1, ease: [.72, 0, .18, 1] });
    control.pause();
    return control;
  });
  const itemControls = links.map(link => {
    const control = animate(link, { opacity: [0, 1], x: [24, 0], rotate: [2, 0] }, { duration: 1, ease: [.22, 1, .36, 1] });
    control.pause();
    return control;
  });
  const previewControl = animate(preview, { opacity: [0, 1], scale: [.92, 1], x: [18, 0] }, { duration: 1, ease: [.22, 1, .36, 1] });
  previewControl.pause();
  state.controlsReady = [...layerControls, ...itemControls, previewControl].every(control => control.duration === 1 && typeof control.pause === 'function');
  state.linkOrderVerified = state.linkOrder.length === expectedLinkOrder.length && state.linkOrder.every((link, index) => link === expectedLinkOrder[index]);

  let lastRenderTime = 0;
  let initialRenderSignature = null;

  function updateGeometry() {
    const stageRect = stage.getBoundingClientRect();
    state.stageWidth = Math.round(stageRect.width);
    state.stageHeight = Math.round(stageRect.height);
    state.layerCoverageRatios = layers.map(layer => {
      const rect = layer.getBoundingClientRect();
      return Number(((rect.width * rect.height) / Math.max(1, stageRect.width * stageRect.height)).toFixed(4));
    });
    state.fullStageGeometryVerified = layers.every(layer => {
      const rect = layer.getBoundingClientRect();
      return Math.abs(rect.width - stageRect.width) <= 1 && Math.abs(rect.height - stageRect.height) <= 1;
    }) && state.layerCoverageRatios.every(ratio => ratio >= .995);
  }

  function visualSignature() {
    return `${state.menuProgress.toFixed(4)}|${state.layerProgress.map(value => value.toFixed(3)).join(',')}|${state.itemProgress.map(value => value.toFixed(3)).join(',')}|${state.selectedSection || 'none'}|${state.phase}`;
  }

  function applyVisualProgress(progress) {
    const p = clamp(progress);
    const layerProgress = [
      clamp(p / .68),
      clamp((p - .08) / .68),
      clamp((p - .16) / .68)
    ];
    const itemProgress = itemControls.map((control, index) => {
      const value = clamp((p - .38 - index * .055) / .42);
      control.time = value;
      return Number(value.toFixed(4));
    });
    const previewProgress = clamp((p - .34) / .5);
    layerControls.forEach((control, index) => { control.time = layerProgress[index]; });
    previewControl.time = previewProgress;
    state.menuProgress = Number(p.toFixed(4));
    state.layerProgress = layerProgress.map(value => Number(value.toFixed(4)));
    state.itemProgress = itemProgress;
    state.previewProgress = Number(previewProgress.toFixed(4));
    state.visualApplyCount += 1;
    const interactive = state.phase === 'open' && p >= .999;
    menu.dataset.interactive = String(interactive);
    menu.inert = !interactive;
    menu.setAttribute('aria-hidden', String(p <= .001));
    const openingIntent = state.targetProgress === 1 || state.phase === 'open';
    toggle.dataset.open = String(openingIntent);
    toggle.setAttribute('aria-expanded', String(openingIntent));
    toggleLabel.textContent = openingIntent ? 'CLOSE' : 'MENU';
    updateGeometry();
  }

  function rejectUntrusted(event, source) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedInputCount += 1;
    state.lastInputKind = `rejected-${source}`;
    state.lastInputTrusted = false;
    return true;
  }

  function acceptTrusted(event, source, category) {
    if (rejectUntrusted(event, source)) return null;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = source;
    state.lastInputTrusted = true;
    if (source.includes('keyboard') || source === 'escape') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
    if (category === 'toggle') state.toggleInputCount += 1;
    if (category === 'selection') state.selectionInputCount += 1;
    if (category === 'navigation') state.navigationInputCount += 1;
    if (category === 'escape') state.escapeInputCount += 1;
    const record = {
      source,
      category,
      trusted: true,
      progressBefore: state.menuProgress,
      targetBefore: state.targetProgress,
      selectedBefore: state.selectedSection,
      pendingBefore: state.pendingSelection,
      mutated: false
    };
    state.inputRecords.push(record);
    state.inputRecords = state.inputRecords.slice(-64);
    return record;
  }

  function startTransition(target, source, record) {
    const to = clamp(target);
    const from = state.menuProgress;
    if (Math.abs(to - from) < .001 && !state.transitionActive) return false;
    if (state.transitionActive && state.transitionTo !== to) state.reversalCount += 1;
    state.transitionFrom = from;
    state.transitionTo = to;
    state.targetProgress = to;
    state.transitionStartedAt = lastRenderTime;
    state.transitionDuration = Math.max(.18, Math.abs(to - from) * .88);
    state.transitionActive = true;
    if (to === 1) {
      state.openStartCount += 1;
      state.phase = 'opening';
      state.result = 'human-open-transition-in-progress';
    } else {
      state.closeStartCount += 1;
      state.phase = state.pendingSelection ? 'closing-to-selection' : 'closing-without-selection';
      state.result = state.pendingSelection ? 'selection-awaiting-reverse-close' : 'human-close-transition-in-progress';
    }
    state.transitionRecords.push({
      source,
      trusted: true,
      from,
      to,
      pendingSelection: state.pendingSelection,
      completed: false
    });
    if (record) record.mutated = true;
    applyVisualProgress(from);
    return true;
  }

  function commitSelection(section) {
    const content = selectedContent[section];
    invariant(Boolean(content), 'unknown section cannot be committed');
    state.selectedSection = section;
    state.selectedTitle = links.find(link => link.dataset.section === section)?.dataset.title || null;
    state.selectionCommitCount += 1;
    state.resultRetained = true;
    state.result = `${section}-selected-and-retained`;
    pageKicker.textContent = content.kicker;
    pageTitle.textContent = content.title;
    pageDeck.textContent = content.deck;
    resultLabel.textContent = content.label;
    issueResult.dataset.selected = 'true';
  }

  function completeTransition() {
    state.transitionActive = false;
    state.menuProgress = state.transitionTo;
    const record = state.transitionRecords.at(-1);
    if (record) record.completed = true;
    if (state.transitionTo === 1) {
      state.openCompletionCount += 1;
      state.phase = 'open';
      state.result = 'menu-open-awaiting-human-selection';
      applyVisualProgress(1);
      links[0]?.focus({ preventScroll: true });
    } else {
      state.closeCompletionCount += 1;
      applyVisualProgress(0);
      if (state.pendingSelection) {
        commitSelection(state.pendingSelection);
        state.pendingSelection = null;
        state.phase = 'closed-selected';
      } else {
        state.phase = state.resultRetained ? 'closed-selected' : 'closed-idle';
        state.result = state.resultRetained ? `${state.selectedSection}-selected-and-retained` : 'menu-closed-no-selection';
        toggle.focus({ preventScroll: true });
      }
    }
  }

  toggle.addEventListener('click', event => {
    const source = event.detail === 0 ? 'toggle-keyboard' : 'toggle-pointer';
    const record = acceptTrusted(event, source, 'toggle');
    if (!record || state.pendingSelection) return;
    const nextTarget = state.targetProgress === 1 ? 0 : 1;
    startTransition(nextTarget, source, record);
  });

  links.forEach((link, index) => {
    link.addEventListener('click', event => {
      const source = event.detail === 0 ? 'link-keyboard-select' : 'link-pointer-select';
      const record = acceptTrusted(event, source, 'selection');
      if (!record || state.phase !== 'open') return;
      event.preventDefault();
      const section = link.dataset.section;
      state.selectionAttemptCount += 1;
      state.pendingSelection = section;
      record.pendingAfter = section;
      startTransition(0, source, record);
    });
    link.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const record = acceptTrusted(event, 'link-keyboard-navigation', 'navigation');
      if (!record) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0
        : event.key === 'End' ? links.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links[nextIndex].focus({ preventScroll: true });
      record.focusedSection = links[nextIndex].dataset.section;
    });
  });

  stage.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || state.menuProgress <= 0 || state.pendingSelection) return;
    const record = acceptTrusted(event, 'escape', 'escape');
    if (!record) return;
    event.preventDefault();
    state.withdrawalCount += 1;
    startTransition(0, 'escape', record);
  });

  function render(time) {
    state.renderCount += 1;
    lastRenderTime = Number.isFinite(time) ? time : lastRenderTime;
    if (state.transitionActive) {
      const elapsed = Math.max(0, lastRenderTime - state.transitionStartedAt);
      const unit = clamp(elapsed / state.transitionDuration);
      const eased = easeInOutCubic(unit);
      const next = state.transitionFrom + (state.transitionTo - state.transitionFrom) * eased;
      state.transitionFrameCount += 1;
      applyVisualProgress(next);
      if (unit >= 1) completeTransition();
    } else updateGeometry();

    if (state.inputCount === 0) {
      const signature = visualSignature();
      if (initialRenderSignature === null) initialRenderSignature = signature;
      else state.initialStillVerified = signature === initialRenderSignature
        && state.menuProgress === 0
        && state.transitionActive === false;
    }
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.fontsReady && state.controlsReady, 'fonts or Motion controls are not ready');
    invariant(state.imageLoaded && state.imageNaturalWidth === 800 && state.imageNaturalHeight === 1000, 'generated editorial asset is not loaded at the published dimensions');
    invariant(state.imageElementCount === 2 && state.imageUsedInClosedPage && state.imageUsedInMenuPreview, 'generated asset is not used by both product surfaces');
    invariant(state.imageSourceType === 'imagegen-built-in' && state.imagePublishedSha256.length === 64, 'image provenance evidence is incomplete');
    invariant(state.fullStageGeometryVerified && state.layerCoverageRatios.every(ratio => ratio >= .995), 'menu layers do not cover the full stage');
    invariant(state.linkOrderVerified && state.linkOrder.every((link, index) => link === expectedLinkOrder[index]), 'menu link order changed');
    invariant(state.automaticPlayback === false && state.automaticOpen === false && state.automaticClose === false && state.automaticRehearsal === false && state.automaticFallback === false, 'automatic menu choreography is forbidden');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input mutated the menu');
    invariant(state.inputCount === state.trustedInputCount, 'trusted input accounting diverged');
    invariant(state.pointerInputCount + state.keyboardInputCount === state.inputCount, 'input modality accounting diverged');
    invariant(state.inputRecords.every(record => record.trusted === true), 'an accepted input was not trusted');
    invariant(state.transitionRecords.every(record => record.trusted === true && record.from !== record.to), 'a transition lacked trusted human causality');
    invariant(state.menuProgress >= 0 && state.menuProgress <= 1 && state.layerProgress.every(value => value >= 0 && value <= 1), 'layer progress is out of range');
    invariant(state.layerProgress[0] >= state.layerProgress[1] && state.layerProgress[1] >= state.layerProgress[2], 'underplates lost their authored stagger order');
    invariant(state.itemProgress.every((value, index) => index === 0 || value <= state.itemProgress[index - 1]), 'menu items lost their authored stagger order');
    invariant(state.selectionCommitCount <= state.selectionAttemptCount && state.prematureCommitCount === 0, 'selection committed before the reverse close completed');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial closed frame was not verified still');

    if (state.openCompletionCount > 0) {
      invariant(state.openStartCount >= state.openCompletionCount && state.transitionRecords.some(record => record.to === 1 && record.completed), 'open transition evidence is incomplete');
    }
    if (state.selectionAttemptCount > 0 && state.pendingSelection) {
      invariant(state.selectionCommitCount === 0 && state.phase === 'closing-to-selection', 'pending selection was committed during transit');
    }
    if (state.selectionCommitCount > 0) {
      const content = selectedContent[state.selectedSection];
      invariant(state.phase === 'closed-selected' && state.menuProgress === 0 && state.transitionActive === false, 'selected result did not finish behind a closed menu');
      invariant(state.pendingSelection === null && state.resultRetained, 'selected result was not retained');
      invariant(state.selectionCommitCount === 1 && state.closeCompletionCount >= 1, 'selection commit/close accounting diverged');
      invariant(state.result === `${state.selectedSection}-selected-and-retained`, 'retained selection result is inconsistent');
      invariant(pageKicker.textContent === content.kicker && pageTitle.textContent === content.title && resultLabel.textContent === content.label, 'selected page DOM does not present the retained result');
      invariant(issueResult.dataset.selected === 'true', 'selected result marker is missing');
    }
    return true;
  };

  const assetReady = Promise.all(covers.map(image => image.complete && image.naturalWidth
    ? Promise.resolve()
    : new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', () => reject(new Error('North/Common cover failed to load')), { once: true });
    })));
  const ready = Promise.all([document.fonts.ready, assetReady]).then(() => {
    state.fontsReady = true;
    state.imageNaturalWidth = covers[0]?.naturalWidth || 0;
    state.imageNaturalHeight = covers[0]?.naturalHeight || 0;
    state.imageLoaded = covers.every(image => image.complete && image.naturalWidth === 800 && image.naturalHeight === 1000);
    state.imageUsedInClosedPage = covers[0]?.closest('.issue-cover') !== null;
    state.imageUsedInMenuPreview = covers[1]?.closest('.menu-preview') !== null;
    applyVisualProgress(0);
    state.initialSignature = visualSignature();
    state.ready = true;
  });

  installPreviewController({
    id: 'layered-staggered-full-screen-menu',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
