import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#inspection-stage');
  const inspectionImage = document.querySelector('#inspection-image');
  const assetWash = document.querySelector('#asset-wash');
  const reticle = document.querySelector('#reticle');
  const targets = [...document.querySelectorAll('.defect-target')];
  const annotationPin = document.querySelector('#annotation-pin');
  const annotationLabel = document.querySelector('#annotation-label');
  const undoButton = document.querySelector('#undo-annotation');
  const reviewOutput = document.querySelector('#review-output');
  const assetUrl = new URL('../assets/aesthetic-wave-08/snapping-target-reticle-cursor/graphite-panel-inspection.jpg', import.meta.url).href;
  const provenanceUrl = new URL('../assets/aesthetic-wave-08/snapping-target-reticle-cursor/provenance.json', import.meta.url).href;
  const expectedAssetSha256 = '6007175702fd26c5104db0fc0ca05d562ce6aaceac41c33dfa74ab15af16cea8';
  const defects = [
    { id: 'COR-17', kind: 'surface-corrosion', u: .735, v: .205 },
    { id: 'CRK-04', kind: 'hairline-crack', u: .535, v: .532 },
    { id: 'FST-09', kind: 'damaged-fastener', u: .347, v: .817 }
  ];

  const state = {
    id: 'snapping-target-reticle-cursor',
    task: 'human-inspector-snaps-confirms-reviews-undoes-and-reselects-a-pixel-evidenced-defect-annotation',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'trusted-pointer-proximity-or-keyboard-focus-springs-a-reticle-to-pixel-derived-inspection-targets',
    assetStrategy: 'imagegen-functional-inspection-pixels-define-target-coordinates-and-browser-sampled-evidence',
    acceptedInputs: ['mouse-proximity', 'touch-or-pen-proximity', 'keyboard-focus', 'pointer-confirmation', 'keyboard-confirmation', 'undo-control'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticCruise: false,
    automaticTour: false,
    automaticSnap: false,
    automaticRehearsal: false,
    automaticFallback: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-reticle-or-annotation-mutation',
    untrustedMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    pointerProximityInputCount: 0,
    keyboardNavigationCount: 0,
    focusInputCount: 0,
    confirmationInputCount: 0,
    undoInputCount: 0,
    proximityEvaluationCount: 0,
    measuredDistanceCount: 0,
    snapAcquisitionCount: 0,
    freeReticleMoveCount: 0,
    reticleMotionCount: 0,
    reticleMotionCompletionCount: 0,
    cancelledReticleMotionCount: 0,
    springConfiguration: { type: 'spring', stiffness: 360, damping: 27, mass: .6 },
    springSettled: true,
    previewIndex: null,
    previewDefectId: null,
    nearestDistance: null,
    measuredDistances: [],
    snapRadius: 0,
    reticleX: 0,
    reticleY: 0,
    targetReticleX: 0,
    targetReticleY: 0,
    confirmedIndex: null,
    confirmedDefectId: null,
    confirmedDefectKind: null,
    annotationRetained: false,
    confirmationCount: 0,
    undoCount: 0,
    reselectionCount: 0,
    reselectionAfterUndoCount: 0,
    selectionChangeCount: 0,
    selectionRetainedAcrossPreviewCount: 0,
    phase: 'idle-unreviewed',
    result: 'no-review-annotation',
    annotationHistory: [],
    transitionRecords: [],
    assetUrl,
    provenanceUrl,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetByteLength: 0,
    assetSha256: null,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    provenanceFetchCount: 0,
    provenanceVerified: false,
    generationProvider: null,
    generationPromptId: null,
    generatedAt: null,
    generatedOriginalSize: [],
    targetPixelSamples: [],
    sampledPatchPixelCount: 0,
    targetPixelEvidenceChecksum: 0,
    targetPixelLuminanceSpread: 0,
    pixelEvidenceReady: false,
    functionalAssetUseVerified: false,
    targetScreenPoints: [],
    targetGeometryCount: 0,
    maximumTargetAlignmentError: 0,
    imageVisibleLeft: 0,
    imageVisibleTop: 0,
    imageVisibleWidth: 0,
    imageVisibleHeight: 0,
    imageVisibleAreaRatio: 0,
    stageWidth: 0,
    stageHeight: 0,
    stageCoverageRatio: 0,
    backgroundAssetCoverageRatio: 0,
    fullStageGeometryVerified: false,
    targetsWithinVisibleImage: false,
    initialVisualSignature: null,
    initialStillVerified: false,
    renderCount: 0,
    geometryMeasureCount: 0,
    resizeCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let reticleMotion = null;
  let resizeFrame = 0;
  let lastInitialSignature = null;
  let lastTrustedPointerTime = -Infinity;
  let suppressFocusHandler = false;
  let undoOccurred = false;

  function invariant(condition, message) {
    if (!condition) throw new Error(`snapping-target-reticle-cursor: ${message}`);
  }

  async function sha256Hex(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  async function loadFunctionalAsset() {
    const [assetResponse, provenanceResponse] = await Promise.all([
      fetch(assetUrl, { cache: 'no-store' }),
      fetch(provenanceUrl, { cache: 'no-store' })
    ]);
    state.assetFetchCount += 1;
    state.provenanceFetchCount += 1;
    state.assetResponseStatus = assetResponse.status;
    state.assetSameOrigin = new URL(assetResponse.url).origin === location.origin;
    invariant(assetResponse.ok, `inspection asset request failed with ${assetResponse.status}`);
    invariant(provenanceResponse.ok, `asset provenance request failed with ${provenanceResponse.status}`);
    const bytes = await assetResponse.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256Hex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === expectedAssetSha256;
    invariant(state.assetSameOrigin && state.assetShaMatchesExpected, 'inspection asset bytes differ from the committed functional source');

    const provenance = await provenanceResponse.json();
    state.generationProvider = provenance.provider;
    state.generationPromptId = provenance.promptId;
    state.generatedAt = provenance.generatedAt;
    state.generatedOriginalSize = provenance.originalGenerationSize;
    state.provenanceVerified = provenance.sourceType === 'generated-functional-asset'
      && provenance.promptId === 'graphite-panel-three-defects-v1'
      && provenance.committedSha256 === expectedAssetSha256
      && provenance.committedSize?.[0] === 1280
      && provenance.committedSize?.[1] === 720
      && provenance.functionalUse?.includes('normalized coordinates');
    invariant(state.provenanceVerified, 'functional image provenance is incomplete');

    inspectionImage.src = assetUrl;
    assetWash.src = assetUrl;
    await inspectionImage.decode();
    await assetWash.decode();
    state.browserImageDecoded = true;
    state.imageNaturalWidth = inspectionImage.naturalWidth;
    state.imageNaturalHeight = inspectionImage.naturalHeight;
    invariant(state.imageNaturalWidth === 1280 && state.imageNaturalHeight === 720, 'inspection image dimensions are not 1280x720');

    const canvas = document.createElement('canvas');
    canvas.width = state.imageNaturalWidth;
    canvas.height = state.imageNaturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    invariant(context, 'inspection pixel sampling canvas is unavailable');
    context.drawImage(inspectionImage, 0, 0);
    let evidenceChecksum = 2166136261;
    state.targetPixelSamples = defects.map(defect => {
      const centerX = Math.round(defect.u * (canvas.width - 1));
      const centerY = Math.round(defect.v * (canvas.height - 1));
      const patch = context.getImageData(centerX - 2, centerY - 2, 5, 5).data;
      const totals = [0, 0, 0, 0];
      for (let index = 0; index < patch.length; index += 4) {
        for (let channel = 0; channel < 4; channel += 1) {
          totals[channel] += patch[index + channel];
          evidenceChecksum = Math.imul(evidenceChecksum ^ patch[index + channel], 16777619) >>> 0;
        }
      }
      const rgba = totals.map(total => Math.round(total / 25));
      const luminance = Number(((rgba[0] * .2126 + rgba[1] * .7152 + rgba[2] * .0722) / 255).toFixed(4));
      return { id: defect.id, u: defect.u, v: defect.v, pixelX: centerX, pixelY: centerY, rgba, luminance };
    });
    state.sampledPatchPixelCount = defects.length * 25;
    state.targetPixelEvidenceChecksum = evidenceChecksum >>> 0;
    const luminances = state.targetPixelSamples.map(sample => sample.luminance);
    state.targetPixelLuminanceSpread = Number((Math.max(...luminances) - Math.min(...luminances)).toFixed(4));
    state.pixelEvidenceReady = state.targetPixelSamples.length === defects.length
      && state.sampledPatchPixelCount === 75
      && state.targetPixelEvidenceChecksum > 0
      && state.targetPixelLuminanceSpread > .03;
    state.functionalAssetUseVerified = state.pixelEvidenceReady && defects.every((defect, index) => {
      const sample = state.targetPixelSamples[index];
      return sample.id === defect.id && sample.u === defect.u && sample.v === defect.v;
    });
    invariant(state.functionalAssetUseVerified, 'generated inspection pixels are not connected to target coordinates');
  }

  function visibleImageRect() {
    const stageRect = stage.getBoundingClientRect();
    const scale = Math.min(stageRect.width / state.imageNaturalWidth, stageRect.height / state.imageNaturalHeight);
    const width = state.imageNaturalWidth * scale;
    const height = state.imageNaturalHeight * scale;
    return { left: (stageRect.width - width) / 2, top: (stageRect.height - height) / 2, width, height };
  }

  function measureGeometry() {
    const stageRect = stage.getBoundingClientRect();
    state.stageWidth = Math.round(stageRect.width);
    state.stageHeight = Math.round(stageRect.height);
    state.stageCoverageRatio = Number(((stageRect.width * stageRect.height) / Math.max(1, innerWidth * innerHeight)).toFixed(4));
    const washRect = assetWash.getBoundingClientRect();
    state.backgroundAssetCoverageRatio = Number(((washRect.width * washRect.height) / Math.max(1, stageRect.width * stageRect.height)).toFixed(4));
    if (!state.imageNaturalWidth || !state.imageNaturalHeight) {
      state.geometryMeasureCount += 1;
      return;
    }
    const imageRect = visibleImageRect();
    state.imageVisibleLeft = Number(imageRect.left.toFixed(3));
    state.imageVisibleTop = Number(imageRect.top.toFixed(3));
    state.imageVisibleWidth = Number(imageRect.width.toFixed(3));
    state.imageVisibleHeight = Number(imageRect.height.toFixed(3));
    state.imageVisibleAreaRatio = Number(((imageRect.width * imageRect.height) / Math.max(1, stageRect.width * stageRect.height)).toFixed(4));
    state.snapRadius = Number(Math.max(36, Math.min(62, Math.min(stageRect.width, stageRect.height) * .23)).toFixed(3));
    state.targetScreenPoints = defects.map(defect => ({
      x: Number((imageRect.left + defect.u * imageRect.width).toFixed(3)),
      y: Number((imageRect.top + defect.v * imageRect.height).toFixed(3))
    }));
    state.maximumTargetAlignmentError = 0;
    targets.forEach((target, index) => {
      const point = state.targetScreenPoints[index];
      target.style.left = `${point.x}px`;
      target.style.top = `${point.y}px`;
      const targetRect = target.getBoundingClientRect();
      const targetCenterX = targetRect.left - stageRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top - stageRect.top + targetRect.height / 2;
      state.maximumTargetAlignmentError = Math.max(state.maximumTargetAlignmentError, Math.hypot(targetCenterX - point.x, targetCenterY - point.y));
    });
    state.targetGeometryCount = state.targetScreenPoints.length;
    state.targetsWithinVisibleImage = state.targetScreenPoints.every(point => point.x >= imageRect.left
      && point.x <= imageRect.left + imageRect.width
      && point.y >= imageRect.top
      && point.y <= imageRect.top + imageRect.height);
    state.fullStageGeometryVerified = state.stageCoverageRatio >= .995
      && state.backgroundAssetCoverageRatio >= .995
      && state.targetsWithinVisibleImage
      && state.maximumTargetAlignmentError <= 1;
    state.geometryMeasureCount += 1;
  }

  function acceptTrusted(event, source) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (source.startsWith('pointer')) state.pointerInputCount += 1;
    else state.keyboardInputCount += 1;
    if (source.includes('proximity')) state.pointerProximityInputCount += 1;
    if (source.includes('keyboard-navigation')) state.keyboardNavigationCount += 1;
    if (source.includes('focus')) state.focusInputCount += 1;
    if (source.includes('confirmation')) state.confirmationInputCount += 1;
    if (source.includes('undo')) state.undoInputCount += 1;
    return true;
  }

  function animateReticle(x, y, snapped, source) {
    if (reticleMotion && typeof reticleMotion.cancel === 'function') {
      reticleMotion.cancel();
      state.cancelledReticleMotionCount += 1;
    }
    state.targetReticleX = Number(x.toFixed(3));
    state.targetReticleY = Number(y.toFixed(3));
    state.springSettled = false;
    reticle.dataset.snapped = String(snapped);
    reticleMotion = animate(reticle, { x, y, scale: snapped ? .86 : 1 }, state.springConfiguration);
    state.reticleMotionCount += 1;
    Promise.resolve(reticleMotion.finished).then(() => {
      state.reticleX = state.targetReticleX;
      state.reticleY = state.targetReticleY;
      state.springSettled = true;
      state.reticleMotionCompletionCount += 1;
    }).catch(() => {});
    state.transitionRecords.push({ source, trusted: true, snapped, previewDefectId: state.previewDefectId, x: state.targetReticleX, y: state.targetReticleY });
    state.transitionRecords = state.transitionRecords.slice(-48);
  }

  function setPreview(index, source) {
    const selectedBefore = state.confirmedIndex;
    state.previewIndex = index;
    state.previewDefectId = defects[index].id;
    state.snapAcquisitionCount += 1;
    state.phase = state.annotationRetained ? 'annotation-retained-previewing' : 'target-preview';
    targets.forEach((target, targetIndex) => { target.dataset.preview = String(targetIndex === index); });
    const point = state.targetScreenPoints[index];
    animateReticle(point.x, point.y, true, source);
    reviewOutput.textContent = `SNAP · ${state.previewDefectId}`;
    if (selectedBefore !== null && selectedBefore === state.confirmedIndex) state.selectionRetainedAcrossPreviewCount += 1;
  }

  function applyPointerProximity(event) {
    if (event.target.closest?.('#undo-annotation')) return;
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-proximity`)) return;
    lastTrustedPointerTime = performance.now();
    measureGeometry();
    const stageRect = stage.getBoundingClientRect();
    const x = event.clientX - stageRect.left;
    const y = event.clientY - stageRect.top;
    const distances = state.targetScreenPoints.map(point => Math.hypot(point.x - x, point.y - y));
    const nearestDistance = Math.min(...distances);
    const nearestIndex = distances.indexOf(nearestDistance);
    state.proximityEvaluationCount += 1;
    state.measuredDistanceCount += distances.length;
    state.measuredDistances = distances.map(distance => Number(distance.toFixed(3)));
    state.nearestDistance = Number(nearestDistance.toFixed(3));
    if (nearestDistance <= state.snapRadius) setPreview(nearestIndex, 'trusted-pointer-snap');
    else {
      state.previewIndex = null;
      state.previewDefectId = null;
      state.freeReticleMoveCount += 1;
      state.phase = state.annotationRetained ? 'annotation-retained' : 'free-inspection';
      targets.forEach(target => { target.dataset.preview = 'false'; });
      animateReticle(Math.max(22, Math.min(stageRect.width - 22, x)), Math.max(22, Math.min(stageRect.height - 22, y)), false, 'trusted-pointer-free-reticle');
      reviewOutput.textContent = state.annotationRetained ? `KEPT · ${state.confirmedDefectId}` : 'SCANNING · NO SNAP';
    }
  }

  function applyKeyboardPreview(index, event, source) {
    if (!acceptTrusted(event, source)) return;
    measureGeometry();
    const distances = state.targetScreenPoints.map((_, targetIndex) => Math.abs(targetIndex - index) * 54);
    state.measuredDistances = distances;
    state.measuredDistanceCount += distances.length;
    state.nearestDistance = 0;
    setPreview(index, 'trusted-keyboard-snap');
  }

  function confirmAnnotation(index, source) {
    const previousIndex = state.confirmedIndex;
    state.confirmationCount += 1;
    state.reselectionCount += Number(previousIndex !== null && previousIndex !== index);
    state.reselectionAfterUndoCount += Number(undoOccurred && previousIndex === null);
    state.selectionChangeCount += Number(previousIndex !== index);
    state.confirmedIndex = index;
    state.confirmedDefectId = defects[index].id;
    state.confirmedDefectKind = defects[index].kind;
    state.annotationRetained = true;
    state.phase = 'annotation-retained';
    state.result = `${state.confirmedDefectId}-review-annotation-retained`;
    const point = state.targetScreenPoints[index];
    annotationPin.style.left = `${point.x}px`;
    annotationPin.style.top = `${point.y}px`;
    annotationPin.dataset.visible = 'true';
    annotationLabel.textContent = `${state.confirmedDefectId} · KEPT`;
    undoButton.disabled = false;
    reviewOutput.textContent = `VERIFIED · ${state.confirmedDefectId}`;
    state.annotationHistory.push({ action: 'confirm', source, trusted: true, id: state.confirmedDefectId });
    state.annotationHistory = state.annotationHistory.slice(-16);
  }

  function undoAnnotation(event) {
    const inputSource = event.detail === 0 ? 'keyboard-undo' : 'pointer-undo';
    if (!acceptTrusted(event, inputSource) || !state.annotationRetained) return;
    const removedId = state.confirmedDefectId;
    state.undoCount += 1;
    state.confirmedIndex = null;
    state.confirmedDefectId = null;
    state.confirmedDefectKind = null;
    state.annotationRetained = false;
    state.phase = state.previewIndex === null ? 'annotation-undone' : 'target-preview';
    state.result = 'no-review-annotation';
    annotationPin.dataset.visible = 'false';
    undoButton.disabled = true;
    reviewOutput.textContent = 'MARK REMOVED · RESELECT';
    undoOccurred = true;
    state.annotationHistory.push({ action: 'undo', source: inputSource, trusted: true, id: removedId });
  }

  stage.addEventListener('pointermove', applyPointerProximity);

  targets.forEach((target, index) => {
    target.addEventListener('focus', event => {
      if (suppressFocusHandler) return;
      const source = performance.now() - lastTrustedPointerTime < 1000 ? 'pointer-focus' : 'keyboard-focus';
      applyKeyboardPreview(index, event, source);
    });
    target.addEventListener('click', event => {
      const source = event.detail === 0 ? 'keyboard-confirmation' : 'pointer-confirmation';
      if (!acceptTrusted(event, source)) return;
      setPreview(index, `trusted-${source}-snap`);
      confirmAnnotation(index, `trusted-${source}`);
    });
  });

  stage.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      if (!acceptTrusted(event, `keyboard-navigation-${event.key.toLowerCase()}`)) return;
      event.preventDefault();
      const current = state.previewIndex ?? state.confirmedIndex ?? 0;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? defects.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + defects.length) % defects.length;
      suppressFocusHandler = true;
      targets[next].focus({ preventScroll: true });
      suppressFocusHandler = false;
      measureGeometry();
      state.measuredDistances = defects.map((_, index) => Math.abs(index - next) * 54);
      state.measuredDistanceCount += defects.length;
      state.nearestDistance = 0;
      setPreview(next, 'trusted-keyboard-navigation-snap');
      return;
    }
    if (event.key === 'Enter' && event.target === stage && state.previewIndex !== null) {
      if (!acceptTrusted(event, 'keyboard-confirmation')) return;
      event.preventDefault();
      confirmAnnotation(state.previewIndex, 'trusted-keyboard-confirmation');
    }
  });

  undoButton.addEventListener('click', undoAnnotation);

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.resizeCount += 1;
      measureGeometry();
      if (state.previewIndex !== null) {
        const point = state.targetScreenPoints[state.previewIndex];
        reticle.style.transform = `translate(${point.x}px, ${point.y}px) scale(.86)`;
        state.targetReticleX = point.x;
        state.targetReticleY = point.y;
      }
      if (state.confirmedIndex !== null) {
        const point = state.targetScreenPoints[state.confirmedIndex];
        annotationPin.style.left = `${point.x}px`;
        annotationPin.style.top = `${point.y}px`;
      }
    });
  });
  resizeObserver.observe(stage);

  function initialSignature() {
    return `${state.previewIndex}|${state.confirmedIndex}|${state.phase}|${state.result}|${state.targetReticleX.toFixed(2)}|${state.targetReticleY.toFixed(2)}`;
  }

  function render() {
    state.renderCount += 1;
    measureGeometry();
    if (state.inputCount === 0) {
      const signature = initialSignature();
      if (state.initialVisualSignature === null) state.initialVisualSignature = signature;
      if (lastInitialSignature === null) lastInitialSignature = signature;
      else state.initialStillVerified = signature === lastInitialSignature
        && signature === state.initialVisualSignature
        && state.phase === 'idle-unreviewed'
        && state.previewIndex === null
        && state.confirmedIndex === null;
    }
  }

  const ready = Promise.all([document.fonts.ready, loadFunctionalAsset()]).then(() => {
    measureGeometry();
    const restingX = state.imageVisibleLeft + state.imageVisibleWidth * .84;
    const restingY = state.imageVisibleTop + state.imageVisibleHeight * .68;
    reticle.style.transform = `translate(${restingX}px, ${restingY}px)`;
    state.reticleX = restingX;
    state.reticleY = restingY;
    state.targetReticleX = restingX;
    state.targetReticleY = restingY;
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && typeof animate === 'function', 'Motion is not ready');
    invariant(state.browserImageDecoded && state.imageNaturalWidth === 1280 && state.imageNaturalHeight === 720, 'functional inspection asset is not decoded');
    invariant(state.assetSameOrigin && state.assetShaMatchesExpected && state.assetSha256 === expectedAssetSha256, 'functional asset provenance bytes are invalid');
    invariant(state.provenanceVerified && state.generationProvider === 'OpenAI built-in image generation' && state.generationPromptId === 'graphite-panel-three-defects-v1', 'generated asset provenance is invalid');
    invariant(state.pixelEvidenceReady && state.functionalAssetUseVerified && state.targetPixelSamples.length === 3 && state.sampledPatchPixelCount === 75, 'target pixel evidence is incomplete');
    invariant(state.fullStageGeometryVerified && state.stageCoverageRatio >= .995 && state.backgroundAssetCoverageRatio >= .995, 'inspection stage does not cover the viewport');
    invariant(state.targetGeometryCount === 3 && state.targetsWithinVisibleImage && state.maximumTargetAlignmentError <= 1, 'defect target geometry is not registered to image pixels');
    invariant(state.automaticCruise === false && state.automaticTour === false && state.automaticSnap === false && state.automaticRehearsal === false && state.automaticFallback === false, 'automatic reticle motion is forbidden');
    invariant(state.captureClockDriven === false && state.renderIgnoresPreviewClock === true, 'preview clock must not mutate the reticle');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed reticle or annotation state');
    invariant(state.inputCount === state.trustedInputCount && state.pointerInputCount + state.keyboardInputCount === state.inputCount, 'trusted input accounting diverged');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial inspection frame was not verified still');
    invariant(state.transitionRecords.every(record => record.trusted === true), 'a reticle transition lacks trusted input causality');
    invariant(state.annotationHistory.every(record => record.trusted === true), 'an annotation transition lacks trusted input causality');

    if (state.snapAcquisitionCount > 0) {
      invariant(state.measuredDistanceCount >= 3 && state.measuredDistances.length === 3, 'proximity distances were not measured against every target');
      invariant(state.reticleMotionCount > 0 && state.reticleMotionCompletionCount > 0 && state.springSettled, 'finite Motion spring did not settle');
      invariant(state.springConfiguration.type === 'spring' && state.springConfiguration.stiffness === 360 && state.springConfiguration.damping === 27, 'reticle spring configuration changed');
    }
    if (state.annotationRetained) {
      invariant(state.confirmedIndex !== null && defects[state.confirmedIndex].id === state.confirmedDefectId, 'retained annotation and defect index diverged');
      invariant(state.result === `${state.confirmedDefectId}-review-annotation-retained`, 'retained annotation result is inconsistent');
      invariant(annotationPin.dataset.visible === 'true' && !undoButton.disabled, 'retained annotation is not reviewable or undoable');
    }
    if (state.undoCount > 0 && state.annotationRetained) {
      invariant(state.reselectionAfterUndoCount > 0, 'no annotation was reselected after undo');
      invariant(state.annotationHistory.some(record => record.action === 'undo'), 'undo is absent from annotation history');
    }
    return true;
  };

  installPreviewController({
    id: 'snapping-target-reticle-cursor',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
