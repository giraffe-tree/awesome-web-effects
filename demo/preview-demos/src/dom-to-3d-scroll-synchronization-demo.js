import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#sync-stage');
  const documentWindow = document.querySelector('#document-window');
  const documentTrack = document.querySelector('#document-track');
  const artifactRig = document.querySelector('#artifact-rig');
  const artifactTargets = [...document.querySelectorAll('.artifact-target')];
  const sectionControls = [...document.querySelectorAll('.section-control')];
  const scrubTrack = document.querySelector('#scrub-track');
  const scrubThumb = document.querySelector('#scrub-thumb');
  const artifactViewLabel = document.querySelector('#artifact-view-label');
  const registrationReadout = document.querySelector('#registration-readout');
  const syncReadout = document.querySelector('#sync-readout');
  const boundaryReadout = document.querySelector('#boundary-readout');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const sectionOrder = sectionControls.map(control => control.dataset.section);
  const sectionProgress = sectionControls.map(control => Number(control.dataset.progress));
  const viewLabels = ['Front datum', 'Service sweep', 'Anchor plate'];

  const state = {
    id: 'dom-to-3d-scroll-synchronization',
    automaticFallback: false,
    automaticPlayback: false,
    automaticScrub: false,
    automaticSectionAdvance: false,
    captureClockDriven: false,
    syntheticInputDispatch: false,
    userOwnedProgress: true,
    controlsBuiltWithoutAutoplay: true,
    acceptedInputs: ['wheel', 'mouse', 'touch', 'pen', 'keyboard'],
    userInitiated: false,
    inputKind: 'none',
    inputCount: 0,
    lastInputTrusted: null,
    wheelInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    wheelConsumedCount: 0,
    wheelNoChangeCount: 0,
    dragSessionCount: 0,
    dragUpdateCount: 0,
    sectionSelectionCount: 0,
    keyboardSeekCount: 0,
    progressMutationCount: 0,
    boundaryReleaseCount: 0,
    startBoundaryReleaseCount: 0,
    endBoundaryReleaseCount: 0,
    keyboardBoundaryCount: 0,
    lastBoundary: null,
    lastWheelDefaultPrevented: null,
    boundaryPolicy: 'release-outward-wheel-at-0-and-1',
    progress: 0,
    progressSource: 'none',
    selectedSection: 'front',
    selectedSectionIndex: 0,
    previousSection: null,
    documentProgress: 0,
    artifactProgress: 0,
    thumbProgress: 0,
    controlTimeSpread: 0,
    registrationErrorPx: 0,
    documentTravelPx: 0,
    thumbTravelPx: 0,
    motionControlCount: 0,
    controlRebuildCount: 0,
    layoutMeasureCount: 0,
    dragActive: false,
    dragPointerType: null,
    phase: 'idle',
    reducedMotion: reducedMotion.matches,
    reducedMotionDirectManipulation: true,
    initialFrameStatic: true,
    initialProgress: 0,
    initialPhase: 'idle',
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let documentControl;
  let artifactControl;
  let thumbControl;
  let dragPointerId = null;
  let latestPointerKind = 'mouse';
  let resizeFrame = 0;

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  function setDataset(name, value) {
    const next = String(value);
    if (stage.dataset[name] !== next) stage.dataset[name] = next;
  }

  function recordInput(inputKind, trusted) {
    state.userInitiated = true;
    state.inputKind = inputKind;
    state.inputCount += 1;
    state.lastInputTrusted = trusted;
    if (inputKind === 'keyboard') state.keyboardInputCount += 1;
    else if (inputKind === 'wheel') state.wheelInputCount += 1;
    else state.pointerInputCount += 1;
  }

  function normalizedTime(control) {
    return control?.duration ? control.time / control.duration : 0;
  }

  function seekControl(control, progress) {
    control.time = control.duration * progress;
  }

  function nearestSectionIndex(progress) {
    return Math.min(sectionOrder.length - 1, Math.max(0, Math.round(progress * (sectionOrder.length - 1))));
  }

  function syncRegistrationEvidence() {
    const times = [documentControl, artifactControl, thumbControl].map(normalizedTime);
    state.documentProgress = Number(times[0].toFixed(4));
    state.artifactProgress = Number(times[1].toFixed(4));
    state.thumbProgress = Number(times[2].toFixed(4));
    state.controlTimeSpread = Number((Math.max(...times) - Math.min(...times)).toFixed(6));
    state.registrationErrorPx = Number((state.controlTimeSpread * Math.max(1, state.documentTravelPx)).toFixed(4));
  }

  function syncInterface() {
    const index = nearestSectionIndex(state.progress);
    const sectionId = sectionOrder[index];
    if (state.selectedSection !== sectionId) state.previousSection = state.selectedSection;
    state.selectedSection = sectionId;
    state.selectedSectionIndex = index;
    state.phase = state.dragActive ? 'dragging' : state.userInitiated ? 'inspecting' : 'idle';
    syncRegistrationEvidence();

    setDataset('phase', state.phase);
    setDataset('section', sectionId);
    setDataset('progress', state.progress.toFixed(4));
    setDataset('source', state.progressSource);
    setDataset('boundary', state.lastBoundary || 'none');
    setDataset('boundaryReleaseCount', state.boundaryReleaseCount);

    sectionControls.forEach((control, controlIndex) => {
      const active = controlIndex === index;
      control.classList.toggle('is-active', active);
      control.setAttribute('aria-pressed', String(active));
    });
    artifactTargets.forEach(target => target.classList.toggle('is-active', target.dataset.section === sectionId));
    artifactViewLabel.textContent = viewLabels[index];
    registrationReadout.textContent = `Δ ${state.registrationErrorPx.toFixed(2)} px`;
    syncReadout.textContent = `${String(Math.round(state.progress * 100)).padStart(2, '0')}% · ${sectionId}`;
    scrubTrack.setAttribute('aria-valuenow', String(Math.round(state.progress * 100)));
    scrubTrack.setAttribute('aria-valuetext', `${viewLabels[index]}, ${Math.round(state.progress * 100)} percent`);
    boundaryReadout.textContent = state.lastBoundary
      ? `${state.lastBoundary} edge released`
      : state.dragActive
        ? 'Drag owns signal'
        : 'Wheel captured';
  }

  function applyProgress(progress, source) {
    const next = Number(clamp(progress).toFixed(5));
    const changed = Math.abs(next - state.progress) > .00001;
    if (changed) state.progressMutationCount += 1;
    state.progress = next;
    state.progressSource = source;
    state.lastBoundary = null;
    seekControl(documentControl, next);
    seekControl(artifactControl, next);
    seekControl(thumbControl, next);
    syncInterface();
    return changed;
  }

  function rebuildControls() {
    documentControl?.cancel();
    artifactControl?.cancel();
    thumbControl?.cancel();
    documentTrack.style.transform = '';
    artifactRig.style.transform = '';
    scrubThumb.style.transform = '';

    state.documentTravelPx = Number((documentWindow.clientHeight * 2).toFixed(2));
    state.thumbTravelPx = Number(Math.max(0, scrubTrack.clientWidth - scrubThumb.offsetWidth - 6).toFixed(2));
    state.layoutMeasureCount += 1;

    documentControl = animate(documentTrack, {
      y: [0, -state.documentTravelPx]
    }, {
      duration: 1,
      ease: 'linear',
      autoplay: false
    });
    artifactControl = animate(artifactRig, {
      rotateX: [9, -5, 20],
      rotateY: [-31, 0, 34],
      rotateZ: [-1.5, 0, 1.2],
      z: [-10, 18, -8],
      y: [0, 0, 0],
      scale: [.9, 1.04, .93]
    }, {
      duration: 1,
      times: [0, .5, 1],
      ease: 'linear',
      autoplay: false
    });
    thumbControl = animate(scrubThumb, {
      x: [0, state.thumbTravelPx]
    }, {
      duration: 1,
      ease: 'linear',
      autoplay: false
    });
    [documentControl, artifactControl, thumbControl].forEach(control => {
      control.pause();
      control.time = 0;
    });
    state.motionControlCount = 3;
    state.controlRebuildCount += 1;
    applyProgress(state.progress, state.progressSource);
  }

  function applyWheel(event) {
    recordInput('wheel', event.isTrusted);
    const delta = clamp(event.deltaY * .00135, -.16, .16);
    const next = clamp(state.progress + delta);
    const changed = Math.abs(next - state.progress) > .00001;
    if (changed) {
      event.preventDefault();
      state.wheelConsumedCount += 1;
      applyProgress(next, 'wheel');
    } else {
      state.wheelNoChangeCount += 1;
      const outwardAtStart = state.progress === 0 && delta < 0;
      const outwardAtEnd = state.progress === 1 && delta > 0;
      if (outwardAtStart || outwardAtEnd) {
        state.boundaryReleaseCount += 1;
        state.lastBoundary = outwardAtStart ? 'start' : 'end';
        if (outwardAtStart) state.startBoundaryReleaseCount += 1;
        else state.endBoundaryReleaseCount += 1;
      }
      syncInterface();
    }
    state.lastWheelDefaultPrevented = event.defaultPrevented;
  }

  function progressFromPointer(clientX) {
    const rect = scrubTrack.getBoundingClientRect();
    return clamp((clientX - rect.left - 7) / Math.max(1, rect.width - 14));
  }

  function beginDrag(event) {
    if (event.button !== 0) return;
    latestPointerKind = event.pointerType || 'pointer';
    recordInput(latestPointerKind, event.isTrusted);
    state.dragSessionCount += 1;
    state.dragActive = true;
    state.dragPointerType = latestPointerKind;
    dragPointerId = event.pointerId;
    scrubTrack.setPointerCapture(event.pointerId);
    state.dragUpdateCount += 1;
    applyProgress(progressFromPointer(event.clientX), 'drag');
  }

  function updateDrag(event) {
    if (!state.dragActive || event.pointerId !== dragPointerId) return;
    state.dragUpdateCount += 1;
    applyProgress(progressFromPointer(event.clientX), 'drag');
  }

  function endDrag(event) {
    if (!state.dragActive || event.pointerId !== dragPointerId) return;
    state.dragActive = false;
    state.dragPointerType = null;
    dragPointerId = null;
    if (scrubTrack.hasPointerCapture(event.pointerId)) scrubTrack.releasePointerCapture(event.pointerId);
    syncInterface();
  }

  function inputKindFromClick(event) {
    return event.detail === 0 ? 'keyboard' : latestPointerKind;
  }

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });
  stage.addEventListener('wheel', applyWheel, { passive: false });
  scrubTrack.addEventListener('pointerdown', beginDrag);
  scrubTrack.addEventListener('pointermove', updateDrag);
  scrubTrack.addEventListener('pointerup', endDrag);
  scrubTrack.addEventListener('pointercancel', endDrag);

  sectionControls.forEach(control => {
    control.addEventListener('click', event => {
      const inputKind = inputKindFromClick(event);
      recordInput(inputKind, event.isTrusted);
      state.sectionSelectionCount += 1;
      applyProgress(Number(control.dataset.progress), `section-${control.dataset.section}`);
      control.focus({ preventScroll: true });
    });
  });

  stage.addEventListener('keydown', event => {
    const keySteps = {
      ArrowUp: -.08,
      ArrowLeft: -.08,
      ArrowDown: .08,
      ArrowRight: .08,
      PageUp: -.25,
      PageDown: .25
    };
    let target;
    if (event.key in keySteps) target = state.progress + keySteps[event.key];
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = 1;
    else if (['1', '2', '3'].includes(event.key)) target = sectionProgress[Number(event.key) - 1];
    else return;
    event.preventDefault();
    if (event.repeat) return;
    recordInput('keyboard', event.isTrusted);
    state.keyboardSeekCount += 1;
    const changed = applyProgress(target, 'keyboard');
    if (!changed && (target <= 0 || target >= 1)) state.keyboardBoundaryCount += 1;
  });

  addEventListener('resize', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      rebuildControls();
    });
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    syncInterface();
  });

  function render() {
    state.renderCount += 1;
    syncInterface();
  }

  rebuildControls();
  const ready = document.fonts.ready.then(() => rebuildControls());

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const controls = [documentControl, artifactControl, thumbControl];
    syncRegistrationEvidence();
    const controlEvidence = controls.every(control =>
      typeof control.play === 'function'
      && typeof control.pause === 'function'
      && typeof control.cancel === 'function'
      && control.duration === 1
    );
    const sectionSemantics = sectionControls.length === 3 && sectionControls.every(control =>
      control instanceof HTMLButtonElement
      && control.type === 'button'
      && control.dataset.section
      && Number.isFinite(Number(control.dataset.progress))
      && control.hasAttribute('aria-label')
    );
    const activeSectionEvidence = sectionControls.filter(control => control.getAttribute('aria-pressed') === 'true').length === 1
      && sectionControls[state.selectedSectionIndex].dataset.section === state.selectedSection
      && artifactTargets.filter(target => target.classList.contains('is-active')).length === 1
      && artifactTargets[state.selectedSectionIndex].dataset.section === state.selectedSection;
    const inputEvidence = state.inputCount === state.wheelInputCount + state.pointerInputCount + state.keyboardInputCount
      && state.wheelConsumedCount + state.wheelNoChangeCount === state.wheelInputCount
      && state.boundaryReleaseCount === state.startBoundaryReleaseCount + state.endBoundaryReleaseCount
      && state.sectionSelectionCount <= state.pointerInputCount + state.keyboardInputCount;
    const registrationEvidence = Math.abs(state.documentProgress - state.progress) <= .001
      && Math.abs(state.artifactProgress - state.progress) <= .001
      && Math.abs(state.thumbProgress - state.progress) <= .001
      && state.controlTimeSpread <= .00001
      && state.registrationErrorPx <= .01;
    const boundaryEvidence = state.lastBoundary === null
      || state.lastBoundary === 'start' && state.progress === 0 && state.lastWheelDefaultPrevented === false
      || state.lastBoundary === 'end' && state.progress === 1 && state.lastWheelDefaultPrevented === false;
    return typeof animate === 'function'
      && stage.dataset.previewMechanism === 'motion-user-scrubbed-dom-3d-registration'
      && documentWindow instanceof HTMLElement
      && documentTrack instanceof HTMLElement
      && artifactRig instanceof HTMLElement
      && scrubTrack.getAttribute('role') === 'slider'
      && scrubTrack.tabIndex === 0
      && sectionOrder.join(',') === 'front,service,anchor'
      && sectionProgress.join(',') === '0,0.5,1'
      && controlEvidence
      && sectionSemantics
      && activeSectionEvidence
      && registrationEvidence
      && inputEvidence
      && boundaryEvidence
      && state.documentTravelPx > 0
      && state.thumbTravelPx > 0
      && state.motionControlCount === 3
      && state.initialFrameStatic
      && state.initialProgress === 0
      && state.initialPhase === 'idle'
      && state.automaticFallback === false
      && state.automaticPlayback === false
      && state.automaticScrub === false
      && state.automaticSectionAdvance === false
      && state.captureClockDriven === false
      && state.syntheticInputDispatch === false
      && state.userOwnedProgress === true
      && state.controlsBuiltWithoutAutoplay === true
      && state.reducedMotionDirectManipulation === true
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.progressMutationCount)
      && Number.isInteger(state.boundaryReleaseCount)
      && state.layoutMeasureCount >= 1
      && state.controlRebuildCount >= 1
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'dom-to-3d-scroll-synchronization',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
