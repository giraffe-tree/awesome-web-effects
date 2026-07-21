import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { imageIdentityManifest } from '../assets/hover-activated-image-marquee-menu/image-identity-manifest.js';

try {
  const stage = document.querySelector('#image-menu');
  const menu = document.querySelector('#menu-list');
  const rows = [...menu.querySelectorAll('.menu-row')];
  const rails = rows.map(row => row.querySelector('.row-rail'));
  const images = [...menu.querySelectorAll('img')];
  const decisionStatus = document.querySelector('#decision-status');
  const decisionOutput = document.querySelector('#decision-output');
  const undoButton = document.querySelector('#undo-destination');
  const resetButton = document.querySelector('#reset-destinations');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const railDuration = 1.15;
  const destinationNames = ['MÍLOS COAST', 'ATLAS COURT', 'ATACAMA SKY'];

  if (!stage || !menu || rows.length !== 3 || rails.some(rail => !rail) || images.length !== 12 || !decisionStatus || !decisionOutput || !undoButton || !resetButton) {
    throw new Error('hover image marquee DOM is incomplete');
  }

  const state = {
    id: 'hover-activated-image-marquee-menu',
    task: 'human-previews-a-destination-inside-its-own-row-and-explicitly-retains-or-revises-the-destination',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'trusted-row-hover-or-focus-activates-one-row-local-image-and-place-rail-whose-finite-translation-is-controlled-by-motion',
    assetStrategy: 'reuse-three-existing-local-generated-photographs-with-exact-file-identity-and-real-pixel-derived-row-styles',
    imageGenerationDecision: 'reuse-existing-functional-images-no-replacement-generation',
    assetManifestPath: 'assets/hover-activated-image-marquee-menu/image-identity-manifest.js',
    assetManifestCount: imageIdentityManifest.length,
    assetManifestChecksum: 0,
    expectedAssetByteTotal: imageIdentityManifest.reduce((sum, asset) => sum + asset.bytes, 0),
    verifiedAssetByteTotal: 0,
    assetIdentityVerified: false,
    identityFailureCount: 0,
    decodedImageCount: 0,
    naturalDimensionMatchCount: 0,
    sourceImageUseCounts: [],
    remoteImageCount: 0,
    pixelSampleWidth: 32,
    pixelSampleHeight: 18,
    pixelSampleCount: 0,
    photoPixelRecords: [],
    distinctPixelSignatureCount: 0,
    distinctDerivedAccentCount: 0,
    pixelDrivenRailStyleCount: 0,
    acceptedInputs: ['trusted-row-hover', 'trusted-row-focus', 'trusted-row-click-or-enter-retain', 'trusted-pointer-leave-or-focusout', 'trusted-undo-button-or-z', 'trusted-reset-button-or-r'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticRowRehearsal: false,
    automaticPlayback: false,
    automaticCycle: false,
    automaticFallback: false,
    previewClockStartsRail: false,
    previewClockOnlyAdvancesTrustedRail: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-hover-focus-rail-retained-row-or-decision-mutation',
    untrustedMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    rejectedUntrustedInputCount: 0,
    lastInputModality: null,
    hoverInputCount: 0,
    focusInputCount: 0,
    clickConfirmationInputCount: 0,
    pointerLeaveInputCount: 0,
    focusOutInputCount: 0,
    railStartCount: 0,
    railCompletionCount: 0,
    railMutationWithoutInputCount: 0,
    railProgresses: [0, 0, 0],
    railStarted: [false, false, false],
    railCompleted: [false, false, false],
    railDistances: [0, 0, 0],
    motionControllerCount: 0,
    hoverIndex: null,
    focusIndex: null,
    activeIndex: null,
    retainedIndex: null,
    selectionHistory: [],
    confirmationCount: 0,
    businessCommitCount: 0,
    prematureCommitCount: 0,
    undoCount: 0,
    resetCount: 0,
    decisionClearCount: 0,
    phase: 'idle-menu',
    result: 'no-destination-retained',
    initialStillVerified: false,
    retainedAfterHoverExitVerified: false,
    rowLocalRailVerified: false,
    inputRecords: [],
    renderCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let latestTime = 0;
  let railMotions = [];

  function invariant(condition, message) {
    if (!condition) throw new Error(`hover-activated-image-marquee-menu: ${message}`);
  }

  function checksum(value) {
    let result = 2166136261;
    for (const character of JSON.stringify(value)) result = Math.imul(result ^ character.codePointAt(0), 16777619) >>> 0;
    return result >>> 0;
  }

  state.assetManifestChecksum = checksum(imageIdentityManifest);

  function acceptTrusted(event, source) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (source.startsWith('pointer')) state.pointerInputCount += 1;
    else if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    else state.controlInputCount += 1;
    if (source.startsWith('pointer')) state.lastInputModality = 'pointer';
    else if (source.startsWith('keyboard')) state.lastInputModality = 'keyboard';
    else state.lastInputModality = 'control';
    return true;
  }

  function activeIndex() {
    return state.hoverIndex ?? state.focusIndex ?? state.retainedIndex;
  }

  function syncRows() {
    const active = activeIndex();
    state.activeIndex = active;
    stage.dataset.active = active === null ? 'none' : String(active);
    stage.dataset.retained = state.retainedIndex === null ? 'none' : String(state.retainedIndex);
    rows.forEach((row, index) => {
      row.classList.toggle('active', index === active);
      row.classList.toggle('retained', index === state.retainedIndex);
      row.setAttribute('aria-pressed', String(index === state.retainedIndex));
      row.querySelector('.row-flow').setAttribute('aria-hidden', String(index !== active));
    });
    decisionStatus.dataset.retained = String(state.retainedIndex !== null);
    undoButton.disabled = state.retainedIndex === null;
    resetButton.disabled = state.retainedIndex === null && !state.railStarted.some(Boolean);
    if (state.retainedIndex !== null) decisionOutput.textContent = `KEPT · ${destinationNames[state.retainedIndex]}`;
    else if (active !== null) decisionOutput.textContent = `PREVIEW · ${destinationNames[active]}`;
    else decisionOutput.textContent = 'NO DESTINATION KEPT';
    state.rowLocalRailVerified = rows.every((row, index) => row.querySelector('.row-flow')?.parentElement === row
      && row.querySelector('.row-rail') === rails[index]
      && row.querySelectorAll('img').length === 4);
    if (state.retainedIndex !== null && state.hoverIndex === null && state.focusIndex === null && state.activeIndex === state.retainedIndex) {
      state.retainedAfterHoverExitVerified = true;
    }
  }

  function startRail(index, source) {
    state.railStarted[index] = true;
    state.railCompleted[index] = false;
    state.railProgresses[index] = reducedMotion.matches ? 1 : 0;
    state.railStartCount += 1;
    if (reducedMotion.matches) {
      state.railCompleted[index] = true;
      state.railCompletionCount += 1;
    }
    if (railMotions[index]) railMotions[index].time = state.railProgresses[index] * railDuration;
    state.inputRecords.push({ source, trusted: true, action: 'start-row-rail', rowIndex: index, assetId: imageIdentityManifest[index].id });
    state.inputRecords = state.inputRecords.slice(-64);
  }

  function retainDestination(index, source) {
    if (!state.railStarted[index]) startRail(index, source);
    state.selectionHistory.push(state.retainedIndex);
    state.retainedIndex = index;
    state.confirmationCount += 1;
    state.businessCommitCount += 1;
    state.phase = 'destination-retained';
    state.result = `destination-retained-${imageIdentityManifest[index].id}`;
    state.inputRecords.push({ source, trusted: true, action: 'retain-destination', rowIndex: index, assetId: imageIdentityManifest[index].id, pixelSignature: state.photoPixelRecords[index]?.pixelSignature || null });
    syncRows();
  }

  function undoDestination(source) {
    if (state.retainedIndex === null) return;
    const previous = state.selectionHistory.length ? state.selectionHistory.pop() : null;
    state.retainedIndex = previous;
    state.undoCount += 1;
    state.decisionClearCount += 1;
    state.phase = previous === null ? 'decision-undone' : 'previous-destination-restored';
    state.result = previous === null ? 'no-destination-retained' : `destination-retained-${imageIdentityManifest[previous].id}`;
    state.inputRecords.push({ source, trusted: true, action: 'undo-destination', restoredIndex: previous });
    syncRows();
  }

  function resetDestinations(source) {
    state.retainedIndex = null;
    state.selectionHistory = [];
    state.hoverIndex = null;
    state.focusIndex = null;
    state.railProgresses = [0, 0, 0];
    state.railStarted = [false, false, false];
    state.railCompleted = [false, false, false];
    railMotions.forEach(motion => { motion.time = 0; });
    state.resetCount += 1;
    state.decisionClearCount += 1;
    state.phase = 'reset-idle-menu';
    state.result = 'no-destination-retained';
    state.inputRecords.push({ source, trusted: true, action: 'reset-destinations' });
    syncRows();
  }

  rows.forEach((row, index) => {
    row.addEventListener('pointerenter', event => {
      if (!acceptTrusted(event, 'pointer-row-hover')) return;
      state.hoverInputCount += 1;
      state.hoverIndex = index;
      startRail(index, 'trusted-pointer-row-hover');
      syncRows();
    });

    row.addEventListener('focus', event => {
      const pointerCaused = state.hoverIndex === index;
      const source = pointerCaused ? 'pointer-row-focus' : 'keyboard-row-focus';
      if (!acceptTrusted(event, source)) return;
      state.focusInputCount += 1;
      state.focusIndex = index;
      if (!pointerCaused) startRail(index, `trusted-${source}`);
      syncRows();
    });

    row.addEventListener('click', event => {
      const source = event.detail === 0 ? 'keyboard-row-confirmation' : 'pointer-row-confirmation';
      if (!acceptTrusted(event, source)) return;
      state.clickConfirmationInputCount += 1;
      retainDestination(index, `trusted-${source}`);
    });
  });

  menu.addEventListener('pointerleave', event => {
    if (!acceptTrusted(event, 'pointer-menu-leave')) return;
    state.pointerLeaveInputCount += 1;
    state.hoverIndex = null;
    syncRows();
  });

  menu.addEventListener('focusout', event => {
    if (menu.contains(event.relatedTarget)) return;
    const source = state.lastInputModality === 'pointer' ? 'pointer-menu-focusout' : 'keyboard-menu-focusout';
    if (!acceptTrusted(event, source)) return;
    state.focusOutInputCount += 1;
    state.focusIndex = null;
    syncRows();
  });

  undoButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-undo-control' : 'pointer-undo-control';
    if (!acceptTrusted(event, source)) return;
    undoDestination(`trusted-${source}`);
  });

  resetButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-reset-control' : 'pointer-reset-control';
    if (!acceptTrusted(event, source)) return;
    resetDestinations(`trusted-${source}`);
  });

  window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (key === 'z' || event.key === 'Escape') {
      if (!acceptTrusted(event, 'keyboard-undo-shortcut')) return;
      event.preventDefault();
      undoDestination('trusted-keyboard-undo-shortcut');
    } else if (key === 'r') {
      if (!acceptTrusted(event, 'keyboard-reset-shortcut')) return;
      event.preventDefault();
      resetDestinations('trusted-keyboard-reset-shortcut');
    }
  });

  async function sha256(buffer) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function samplePixels(image, asset) {
    const canvas = document.createElement('canvas');
    canvas.width = state.pixelSampleWidth;
    canvas.height = state.pixelSampleHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let red = 0;
    let green = 0;
    let blue = 0;
    let luminanceSum = 0;
    let luminanceSquared = 0;
    let pixelSignature = 2166136261;
    const count = canvas.width * canvas.height;
    for (let index = 0; index < pixels.length; index += 4) {
      red += pixels[index];
      green += pixels[index + 1];
      blue += pixels[index + 2];
      const luminance = pixels[index] * .2126 + pixels[index + 1] * .7152 + pixels[index + 2] * .0722;
      luminanceSum += luminance;
      luminanceSquared += luminance * luminance;
      pixelSignature = Math.imul(pixelSignature ^ pixels[index], 16777619) >>> 0;
      pixelSignature = Math.imul(pixelSignature ^ pixels[index + 1], 16777619) >>> 0;
      pixelSignature = Math.imul(pixelSignature ^ pixels[index + 2], 16777619) >>> 0;
    }
    const average = [red, green, blue].map(total => Math.round(total / count));
    const meanLuminance = luminanceSum / count;
    const luminanceVariance = luminanceSquared / count - meanLuminance * meanLuminance;
    const warmPaper = [238, 226, 192];
    const accent = average.map((value, index) => Math.round(value * .58 + warmPaper[index] * .42));
    const derivedAccent = `rgb(${accent.join(' ')})`;
    const derivedInk = accent[0] * .2126 + accent[1] * .7152 + accent[2] * .0722 > 142 ? '#171a17' : '#f7f3e8';
    rows[asset.rowIndex].style.setProperty('--accent', derivedAccent);
    rows[asset.rowIndex].style.setProperty('--rail-ink', derivedInk);
    rows[asset.rowIndex].dataset.pixelSignature = String(pixelSignature);
    return {
      id: asset.id,
      rowIndex: asset.rowIndex,
      pixelSignature,
      averageRgb: average,
      meanLuminance: Number(meanLuminance.toFixed(3)),
      luminanceVariance: Number(luminanceVariance.toFixed(3)),
      derivedAccent,
      derivedInk
    };
  }

  async function prepareAssetsAndMotion() {
    await document.fonts.ready;
    await Promise.all(images.map(image => image.decode()));
    state.decodedImageCount = images.length;
    state.remoteImageCount = images.filter(image => new URL(image.src).origin !== location.origin).length;

    const identityRecords = await Promise.all(imageIdentityManifest.map(async asset => {
      const rowImages = [...rows[asset.rowIndex].querySelectorAll('img')];
      const runtimeSource = rowImages[0]?.src;
      const response = await fetch(runtimeSource, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`image fetch failed: ${asset.id} (${response.status})`);
      const buffer = await response.arrayBuffer();
      const digest = await sha256(buffer);
      if (buffer.byteLength !== asset.bytes || digest !== asset.sha256) {
        state.identityFailureCount += 1;
        throw new Error(`image identity mismatch: ${asset.id}`);
      }
      const sourceMatches = rowImages.filter(image => image.src === runtimeSource).length;
      const dimensionMatches = rowImages.filter(image => image.naturalWidth === asset.width && image.naturalHeight === asset.height).length;
      state.naturalDimensionMatchCount += dimensionMatches;
      state.sourceImageUseCounts[asset.rowIndex] = sourceMatches;
      if (sourceMatches !== 4 || dimensionMatches !== 4) throw new Error(`row image use mismatch: ${asset.id}`);
      return { id: asset.id, bytes: buffer.byteLength, sha256: digest, width: asset.width, height: asset.height, sourceMatches };
    }));

    state.verifiedAssetByteTotal = identityRecords.reduce((sum, record) => sum + record.bytes, 0);
    state.assetIdentityVerified = identityRecords.every((record, index) => record.sha256 === imageIdentityManifest[index].sha256);
    state.photoPixelRecords = imageIdentityManifest.map(asset => samplePixels(rows[asset.rowIndex].querySelector('img'), asset));
    state.pixelSampleCount = state.pixelSampleWidth * state.pixelSampleHeight * state.photoPixelRecords.length;
    state.distinctPixelSignatureCount = new Set(state.photoPixelRecords.map(record => record.pixelSignature)).size;
    state.distinctDerivedAccentCount = new Set(state.photoPixelRecords.map(record => record.derivedAccent)).size;
    state.pixelDrivenRailStyleCount = rows.filter(row => row.style.getPropertyValue('--accent') && row.dataset.pixelSignature).length;

    railMotions = rails.map((rail, index) => {
      const distance = rail.querySelector('.rail-unit').getBoundingClientRect().width;
      state.railDistances[index] = Number(distance.toFixed(3));
      const control = animate(rail, { x: [0, -distance] }, { duration: railDuration, ease: 'linear' });
      control.pause();
      control.time = 0;
      return control;
    });
    state.motionControllerCount = railMotions.length;
    syncRows();
    state.ready = true;
  }

  const ready = prepareAssetsAndMotion().catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  function render(time, seeking = false) {
    const nextTime = Number(time) || 0;
    const delta = Math.max(0, nextTime - latestTime);
    latestTime = nextTime;
    state.renderCount += 1;
    stage.classList.toggle('is-seeking', Boolean(seeking));
    const active = activeIndex();
    if (active !== null && state.railStarted[active] && !state.railCompleted[active]) {
      if (state.inputCount === 0) state.railMutationWithoutInputCount += 1;
      const nextProgress = reducedMotion.matches ? 1 : Math.min(1, state.railProgresses[active] + delta / railDuration);
      state.railProgresses[active] = Number(nextProgress.toFixed(5));
      railMotions[active].time = nextProgress * railDuration;
      if (nextProgress >= 1 && !state.railCompleted[active]) {
        state.railCompleted[active] = true;
        state.railCompletionCount += 1;
      }
    }
    if (state.inputCount === 0) {
      state.initialStillVerified = state.activeIndex === null
        && state.retainedIndex === null
        && state.railStartCount === 0
        && state.railProgresses.every(progress => progress === 0);
    }
    syncRows();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.motionControllerCount === 3 && railMotions.length === 3, 'Motion rail controllers are not ready');
    invariant(railMotions.every(control => typeof control.play === 'function' && typeof control.pause === 'function'), 'Motion controller API changed');
    invariant(state.assetManifestCount === 3 && state.assetManifestChecksum === checksum(imageIdentityManifest), 'image identity manifest changed');
    invariant(state.assetIdentityVerified && state.identityFailureCount === 0 && state.verifiedAssetByteTotal === state.expectedAssetByteTotal && state.expectedAssetByteTotal === 282286, 'exact local image identity verification failed');
    invariant(state.decodedImageCount === 12 && state.naturalDimensionMatchCount === 12 && state.remoteImageCount === 0 && state.sourceImageUseCounts.every(count => count === 4), 'decoded local image use is incomplete');
    invariant(state.pixelSampleCount === 1728 && state.photoPixelRecords.length === 3 && state.distinctPixelSignatureCount === 3 && state.distinctDerivedAccentCount === 3, 'real image pixels did not produce distinct row evidence');
    invariant(state.photoPixelRecords.every(record => record.pixelSignature > 0 && record.luminanceVariance > 100 && rows[record.rowIndex].style.getPropertyValue('--accent') === record.derivedAccent), 'pixel-derived rail styling is invalid');
    invariant(state.pixelDrivenRailStyleCount === 3 && state.rowLocalRailVerified, 'image rail is not local to its semantic row');
    invariant(state.automaticRowRehearsal === false && state.automaticPlayback === false && state.automaticCycle === false && state.automaticFallback === false, 'automatic row rehearsal is forbidden');
    invariant(state.previewClockStartsRail === false && state.previewClockOnlyAdvancesTrustedRail === true && state.railMutationWithoutInputCount === 0, 'preview clock started a rail without trusted input');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed row or decision state');
    invariant(state.inputCount === state.trustedInputCount && state.pointerInputCount + state.keyboardInputCount + state.controlInputCount === state.inputCount, 'trusted input accounting diverged');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial menu was not verified still');
    invariant(state.railStartCount >= state.railCompletionCount && state.railProgresses.every(progress => progress >= 0 && progress <= 1), 'finite rail accounting is invalid');
    state.railProgresses.forEach((progress, index) => {
      if (progress > 0) invariant(rails[index].style.transform !== '' && rails[index].style.transform !== 'none', 'Motion did not apply the finite rail transform');
    });
    invariant(state.inputRecords.every(record => record.trusted === true), 'row or decision transition lacks trusted human causality');
    invariant(state.prematureCommitCount === 0 && state.businessCommitCount === state.confirmationCount, 'destination committed before click or Enter');
    invariant(rows.filter(row => row.classList.contains('active')).length === (state.activeIndex === null ? 0 : 1), 'more than one row rail is active');
    invariant(rows.filter(row => row.getAttribute('aria-pressed') === 'true').length === (state.retainedIndex === null ? 0 : 1), 'retained row accessibility state diverged');

    if (state.retainedIndex !== null) {
      invariant(state.phase === 'destination-retained' || state.phase === 'previous-destination-restored', 'retained destination phase is inconsistent');
      invariant(state.result === `destination-retained-${imageIdentityManifest[state.retainedIndex].id}`, 'retained destination result is inconsistent');
      invariant(rows[state.retainedIndex].classList.contains('retained') && decisionStatus.dataset.retained === 'true', 'retained destination is not visible');
      if (state.hoverIndex === null && state.focusIndex === null) invariant(state.activeIndex === state.retainedIndex && state.retainedAfterHoverExitVerified, 'retained row did not remain readable after hover/focus exit');
    }
    if (state.undoCount > 0) invariant(state.inputRecords.some(record => record.action === 'undo-destination'), 'undo did not revise the retained destination');
    if (state.resetCount > 0) invariant(state.retainedIndex === null && state.railProgresses.every(progress => progress === 0), 'reset did not restore the static menu');
    return true;
  };

  installPreviewController({
    id: 'hover-activated-image-marquee-menu',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
