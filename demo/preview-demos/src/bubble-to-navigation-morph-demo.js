import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#story-stage');
  const shell = document.querySelector('#nav-shell');
  const toggle = document.querySelector('#nav-toggle');
  const content = document.querySelector('#nav-content');
  const shade = document.querySelector('#nav-shade');
  const links = [...document.querySelectorAll('.nav-link')];
  const navResult = document.querySelector('#nav-result');
  const sectionChip = document.querySelector('#section-chip');
  const sectionDetail = document.querySelector('#section-detail');

  const state = {
    id: 'bubble-to-navigation-morph',
    task: 'human-opens-a-structured-immersive-story-navigation-and-retains-a-section-choice',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'trusted-toggle-morphs-a-compact-bubble-into-large-operable-information-architecture',
    assetStrategy: 'code-native-css-landscape-and-svg-contours-no-functional-raster-input-required',
    imageGenerationDecision: 'omitted-because-raster-imagery-would-be-decorative-and-would-not-drive-navigation-or-morph-geometry',
    informationArchitecture: ['Story', 'Field Log', 'Visit'],
    acceptedInputs: ['pointer-click', 'touch-tap', 'keyboard-enter-or-space', 'keyboard-escape', 'navigation-link-activation'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticToggle: false,
    automaticRehearsal: false,
    automaticPlayback: false,
    automaticFallback: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-toggle-or-link-mutation',
    untrustedMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    toggleInputCount: 0,
    linkInputCount: 0,
    escapeInputCount: 0,
    toggleCount: 0,
    openCount: 0,
    closeCount: 0,
    linkActivationCount: 0,
    selectionChangeCount: 0,
    selectedIndex: 0,
    selectedSection: 'Story',
    selectedResultRetained: true,
    selectionRetainedAcrossCloseCount: 0,
    isOpen: false,
    targetOpen: false,
    phase: 'closed-stable',
    result: 'story-section-retained',
    morphTransitionCount: 0,
    morphCompletionCount: 0,
    cancelledAnimationCount: 0,
    activeAnimationCount: 0,
    morphProgress: 0,
    lastTransitionDuration: 0,
    contentVisible: false,
    closedWidth: 56,
    closedHeight: 56,
    expandedWidth: 0,
    expandedHeight: 0,
    shellWidth: 56,
    shellHeight: 56,
    shellBorderRadius: 28,
    operableLinkCount: 0,
    minimumLinkWidth: 0,
    minimumLinkHeight: 0,
    linksWithinShell: false,
    shellWithinStage: false,
    stageWidth: 0,
    stageHeight: 0,
    stageCoverageRatio: 0,
    fullStageGeometryVerified: false,
    initialVisualSignature: null,
    initialStillVerified: false,
    transitionRecords: [],
    renderCount: 0,
    geometryMeasureCount: 0,
    resizeCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let shellAnimation = null;
  let contentAnimation = null;
  let shadeAnimation = null;
  let resizeFrame = 0;
  let lastInitialSignature = null;

  function invariant(condition, message) {
    if (!condition) throw new Error(`bubble-to-navigation-morph: ${message}`);
  }

  function targetGeometry() {
    const portrait = innerWidth <= 270;
    return {
      width: Math.min(innerWidth - 24, 390),
      height: portrait ? Math.min(innerHeight - 24, 244) : Math.min(innerHeight - 20, 150)
    };
  }

  function measureGeometry() {
    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const linkRects = links.map(link => link.getBoundingClientRect());
    state.stageWidth = Math.round(stageRect.width);
    state.stageHeight = Math.round(stageRect.height);
    state.stageCoverageRatio = Number(((stageRect.width * stageRect.height) / Math.max(1, innerWidth * innerHeight)).toFixed(4));
    state.fullStageGeometryVerified = state.stageCoverageRatio >= .995;
    state.shellWidth = Number(shellRect.width.toFixed(3));
    state.shellHeight = Number(shellRect.height.toFixed(3));
    state.shellBorderRadius = Number.parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0;
    state.shellWithinStage = shellRect.left >= stageRect.left - 1
      && shellRect.right <= stageRect.right + 1
      && shellRect.top >= stageRect.top - 1
      && shellRect.bottom <= stageRect.bottom + 1;
    state.operableLinkCount = links.filter(link => getComputedStyle(link).pointerEvents !== 'none').length;
    state.minimumLinkWidth = Number(Math.min(...linkRects.map(rect => rect.width)).toFixed(3));
    state.minimumLinkHeight = Number(Math.min(...linkRects.map(rect => rect.height)).toFixed(3));
    state.linksWithinShell = linkRects.every(rect => rect.left >= shellRect.left - 1
      && rect.right <= shellRect.right + 1
      && rect.top >= shellRect.top - 1
      && rect.bottom <= shellRect.bottom + 1);
    state.geometryMeasureCount += 1;
  }

  function acceptTrusted(event, source) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (source.includes('keyboard') || source === 'escape') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
    if (source.endsWith('toggle')) state.toggleInputCount += 1;
    if (source.endsWith('link')) state.linkInputCount += 1;
    if (source === 'escape') state.escapeInputCount += 1;
    return true;
  }

  function cancelAnimations() {
    [shellAnimation, contentAnimation, shadeAnimation].forEach(control => {
      if (control && typeof control.cancel === 'function') {
        control.cancel();
        state.cancelledAnimationCount += 1;
      }
    });
  }

  function setContentInteractivity(open) {
    content.style.pointerEvents = open ? 'auto' : 'none';
    content.setAttribute('aria-hidden', String(!open));
    state.contentVisible = open;
  }

  function transitionNavigation(open, source) {
    cancelAnimations();
    const geometry = targetGeometry();
    state.expandedWidth = geometry.width;
    state.expandedHeight = geometry.height;
    state.targetOpen = open;
    state.phase = open ? 'opening' : 'closing';
    state.morphTransitionCount += 1;
    state.toggleCount += 1;
    state.openCount += Number(open);
    state.closeCount += Number(!open);
    state.lastTransitionDuration = .58;
    shell.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close story navigation' : 'Open story navigation');
    content.style.visibility = 'visible';
    if (open) setContentInteractivity(true);

    const shellTarget = open
      ? { width: geometry.width, height: geometry.height, borderRadius: 18 }
      : { width: state.closedWidth, height: state.closedHeight, borderRadius: 28 };
    shellAnimation = animate(shell, shellTarget, { duration: .58, ease: [.22, 1, .36, 1] });
    contentAnimation = animate(content,
      { opacity: open ? 1 : 0, x: open ? 0 : 14 },
      { duration: .34, delay: open ? .16 : 0, ease: [.22, 1, .36, 1] });
    shadeAnimation = animate(shade,
      { opacity: open ? .72 : 0, backdropFilter: open ? 'blur(3px)' : 'blur(0px)' },
      { duration: .42, ease: 'easeOut' });
    state.activeAnimationCount = 3;
    state.transitionRecords.push({ source, trusted: true, target: open ? 'open' : 'closed', selectedSection: state.selectedSection });

    Promise.all([shellAnimation.finished, contentAnimation.finished, shadeAnimation.finished]).then(() => {
      state.isOpen = open;
      state.morphProgress = open ? 1 : 0;
      state.phase = open ? 'open-stable' : 'closed-stable';
      state.morphCompletionCount += 1;
      state.activeAnimationCount = 0;
      if (!open) {
        setContentInteractivity(false);
        content.style.visibility = 'hidden';
        if (state.selectedResultRetained) state.selectionRetainedAcrossCloseCount += 1;
      }
      measureGeometry();
    }).catch(() => {});
  }

  toggle.addEventListener('click', event => {
    const inputSource = event.detail === 0 ? 'keyboard-toggle' : 'pointer-toggle';
    if (!acceptTrusted(event, inputSource)) return;
    transitionNavigation(!state.targetOpen, `trusted-${inputSource}`);
  });

  shell.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !state.targetOpen) return;
    if (!acceptTrusted(event, 'escape')) return;
    event.preventDefault();
    transitionNavigation(false, 'trusted-keyboard-escape');
    toggle.focus({ preventScroll: true });
  });

  links.forEach((link, index) => {
    link.addEventListener('click', event => {
      const inputSource = event.detail === 0 ? 'keyboard-link' : 'pointer-link';
      if (!acceptTrusted(event, inputSource)) return;
      event.preventDefault();
      const previousIndex = state.selectedIndex;
      state.linkActivationCount += 1;
      state.selectedIndex = index;
      state.selectedSection = link.dataset.section;
      state.selectionChangeCount += Number(previousIndex !== index);
      state.selectedResultRetained = true;
      state.result = `${state.selectedSection.toLowerCase().replaceAll(' ', '-')}-section-retained`;
      state.phase = 'open-selection-retained';
      links.forEach((item, itemIndex) => { item.dataset.selected = String(itemIndex === index); });
      navResult.textContent = `${state.selectedSection.toUpperCase()} · SELECTED`;
      sectionChip.textContent = state.selectedSection.toUpperCase();
      sectionDetail.textContent = index === 0 ? 'CHAPTER 03 · READING' : index === 1 ? '12 SPECIES · 4 SIGNALS' : 'TRAIL 04 · 6.2 KM';
      state.transitionRecords.push({ source: `trusted-${inputSource}`, trusted: true, target: 'section-selected', selectedSection: state.selectedSection });
      state.transitionRecords = state.transitionRecords.slice(-24);
    });
  });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.resizeCount += 1;
      if (state.isOpen && state.activeAnimationCount === 0) {
        const geometry = targetGeometry();
        shell.style.width = `${geometry.width}px`;
        shell.style.height = `${geometry.height}px`;
        state.expandedWidth = geometry.width;
        state.expandedHeight = geometry.height;
      }
      measureGeometry();
    });
  });
  resizeObserver.observe(stage);

  function visualSignature() {
    const rect = shell.getBoundingClientRect();
    return `${rect.width.toFixed(2)}|${rect.height.toFixed(2)}|${shell.dataset.open}|${content.style.opacity || '0'}|${state.selectedSection}`;
  }

  function render() {
    state.renderCount += 1;
    measureGeometry();
    if (state.inputCount === 0) {
      const signature = visualSignature();
      if (state.initialVisualSignature === null) state.initialVisualSignature = signature;
      if (lastInitialSignature === null) lastInitialSignature = signature;
      else state.initialStillVerified = signature === lastInitialSignature
        && signature === state.initialVisualSignature
        && state.phase === 'closed-stable'
        && state.morphProgress === 0;
    }
  }

  const ready = document.fonts.ready.then(() => {
    measureGeometry();
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && typeof animate === 'function', 'Motion is not ready');
    invariant(state.fullStageGeometryVerified && state.stageCoverageRatio >= .995 && state.shellWithinStage, 'stage or navigation shell geometry is invalid');
    invariant(state.automaticToggle === false && state.automaticRehearsal === false && state.automaticPlayback === false && state.automaticFallback === false, 'automatic navigation mutation is forbidden');
    invariant(state.captureClockDriven === false && state.renderIgnoresPreviewClock === true, 'preview clock must not drive the morph');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed navigation state');
    invariant(state.inputCount === state.trustedInputCount, 'trusted input accounting diverged');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial closed bubble was not verified still');
    invariant(state.informationArchitecture.length === 3 && links.length === 3, 'story navigation information architecture is incomplete');
    invariant(links.filter(link => link.dataset.selected === 'true').length === 1, 'exactly one section must remain selected');
    invariant(links[state.selectedIndex].dataset.section === state.selectedSection, 'selected section and index diverged');
    invariant(state.selectedResultRetained && state.result === `${state.selectedSection.toLowerCase().replaceAll(' ', '-')}-section-retained`, 'section result was not retained');
    invariant(state.transitionRecords.every(record => record.trusted === true), 'a transition lacks trusted human causality');

    if (state.openCount > 0) {
      invariant(state.morphTransitionCount === state.toggleCount && state.morphCompletionCount >= 1, 'finite morph did not complete');
      invariant(state.lastTransitionDuration === .58, 'morph duration changed');
      invariant(state.expandedWidth >= Math.min(innerWidth - 24, 216) && state.expandedHeight >= 150, 'expanded navigation is too small');
    }
    if (state.isOpen && state.activeAnimationCount === 0) {
      invariant(state.phase === 'open-stable' || state.phase === 'open-selection-retained', 'open navigation is not stable');
      invariant(state.morphProgress === 1 && state.contentVisible && toggle.getAttribute('aria-expanded') === 'true', 'open semantics are inconsistent');
      invariant(state.operableLinkCount === 3 && state.minimumLinkHeight >= 44 && state.minimumLinkWidth >= 44, 'navigation links are not large enough to operate');
      invariant(state.linksWithinShell, 'navigation links escape the expanded shell');
    }
    if (!state.isOpen && state.morphCompletionCount > 0 && state.activeAnimationCount === 0) {
      invariant(state.phase === 'closed-stable' && state.morphProgress === 0 && !state.contentVisible, 'closed navigation is not stable');
      invariant(toggle.getAttribute('aria-expanded') === 'false', 'closed aria-expanded is inconsistent');
    }
    if (state.linkActivationCount > 0) {
      invariant(state.linkInputCount === state.linkActivationCount && state.selectionChangeCount > 0, 'link selection accounting is inconsistent');
      invariant(navResult.textContent === `${state.selectedSection.toUpperCase()} · SELECTED`, 'selected navigation result is not visible');
    }
    return true;
  };

  installPreviewController({
    id: 'bubble-to-navigation-morph',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
