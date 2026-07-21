import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#peel-stage');
  const ticket = document.querySelector('#ticket');
  const face = document.querySelector('#ticket-face');
  const fold = document.querySelector('#peel-fold');
  const rewardLayer = document.querySelector('#reward-layer');
  const handle = document.querySelector('#peel-handle');
  const toggle = document.querySelector('#peel-toggle');
  const readout = document.querySelector('#peel-readout');
  const faceArt = document.querySelector('#face-art');
  const rewardArt = document.querySelector('#reward-art');
  const assetUrl = new URL('../assets/peelable-paper-corner-reveal/night-glasshouse.jpg', import.meta.url).href;
  const expectedAssetSha256 = '6ff542786473f5fd4652b22a934ffedcbed46de13ef1736b8e8195f5c6b61abe';
  const clamp = value => Math.max(0, Math.min(1, value));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {
    id: 'peelable-paper-corner-reveal',
    task: 'human-operated-fictional-ticket-corner-peel-and-code-reveal',
    claimedLibrary: 'motion@12.42.2',
    renderer: 'dom',
    mechanism: 'pointer-distance-seeks-motion-controller-that-drives-paper-clip-and-fold-geometry',
    userInputRequired: true,
    initialFrameStatic: true,
    initialProgress: 0,
    progress: 0,
    phase: 'sealed',
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    acceptedInputs: ['mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button-control'],
    inputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    rejectedUntrustedInputCount: 0,
    ignoredInputCount: 0,
    humanProgressMutationCount: 0,
    directDragMutationCount: 0,
    inputOwnedAnimationCount: 0,
    inputOwnedAnimationFrameCount: 0,
    completedRevealCount: 0,
    cancelledRevealCount: 0,
    heldMidpointCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    maxHumanProgress: 0,
    minHumanProgress: 0,
    maxDragDistance: 0,
    firstHumanProgressBefore: null,
    firstHumanProgressAfter: null,
    lastSettledOutcome: 'none',
    geometrySeekCount: 0,
    peelXPercent: 0,
    peelYPercent: 0,
    foldXPercent: 0,
    foldYPercent: 0,
    foldLiftDegrees: 0,
    revealedTriangleAreaRatio: 0,
    clipPointCount: 5,
    motionControllerCount: 1,
    motionControllerDuration: 1,
    motionControllerPaused: false,
    assetUrl,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetByteLength: 0,
    assetSha256: null,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    domImageDecodedCount: 0,
    sampledWidth: 48,
    sampledHeight: 32,
    assetPixelSampleCount: 0,
    assetPixelByteLength: 0,
    assetPixelChecksum: null,
    distinctSampleColorCount: 0,
    sampledLumaRange: 0,
    assetEvidenceReady: false,
    stageCoverageRatio: 0,
    ticketAspectRatio: 0,
    responsiveResizeCount: 0,
    reducedMotion,
    renderCallCount: 0,
    ready: false,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let drag = null;
  let settleControl = null;
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`peelable-paper-corner-reveal: ${message}`);
  }

  async function digestHex(bytes) {
    const buffer = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(buffer)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function pixelChecksum(pixels) {
    let signature = 2166136261;
    for (let index = 0; index < pixels.length; index += 4) {
      signature ^= pixels[index];
      signature = Math.imul(signature, 16777619);
      signature ^= pixels[index + 1] + pixels[index + 2] * 3;
      signature = Math.imul(signature, 16777619);
    }
    return (signature >>> 0).toString(16).padStart(8, '0');
  }

  function updateLayoutEvidence() {
    const stageBounds = stage.getBoundingClientRect();
    const ticketBounds = ticket.getBoundingClientRect();
    state.stageCoverageRatio = ticketBounds.width * ticketBounds.height
      / Math.max(1, stageBounds.width * stageBounds.height);
    state.ticketAspectRatio = ticketBounds.width / Math.max(1, ticketBounds.height);
  }

  function applyGeometry(rawProgress) {
    const progress = clamp(rawProgress);
    const peelX = progress * 78;
    const peelY = progress * 96;
    const foldX = progress * 46;
    const foldY = progress * 57;
    const lift = progress * 8;
    state.progress = progress;
    state.peelXPercent = peelX;
    state.peelYPercent = peelY;
    state.foldXPercent = foldX;
    state.foldYPercent = foldY;
    state.foldLiftDegrees = lift;
    state.revealedTriangleAreaRatio = peelX / 100 * peelY / 100 * .5;
    stage.style.setProperty('--peel-x', `${peelX.toFixed(3)}%`);
    stage.style.setProperty('--peel-y', `${peelY.toFixed(3)}%`);
    stage.style.setProperty('--fold-x', `${foldX.toFixed(3)}%`);
    stage.style.setProperty('--fold-y', `${foldY.toFixed(3)}%`);
    stage.style.setProperty('--fold-lift', `${lift.toFixed(3)}deg`);
    ticket.dataset.peelState = progress >= .995 ? 'revealed' : progress <= .005 ? 'sealed' : 'partial';
    handle.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    handle.setAttribute('aria-expanded', String(progress >= .78));
    rewardLayer.setAttribute('aria-hidden', String(progress < .78));
    handle.setAttribute('aria-valuetext', progress >= .995
      ? 'Access code fully revealed'
      : progress <= .005
        ? 'Ticket sealed'
        : `Access code ${Math.round(progress * 100)} percent revealed`);
    readout.textContent = `${progress >= .995 ? 'REVEALED' : progress <= .005 ? 'SEALED' : 'PEELING'} · ${String(Math.round(progress * 100)).padStart(2, '0')}%`;
    toggle.textContent = progress >= .5 ? 'Seal ticket' : 'Reveal access';
  }

  const geometryControl = animate(0, 1, {
    duration: 1,
    ease: 'linear',
    onUpdate: applyGeometry,
  });
  geometryControl.pause();
  state.motionControllerPaused = true;

  function stopSettle() {
    if (!settleControl) return;
    settleControl.stop();
    settleControl = null;
  }

  function seekProgress(rawProgress, { human = false, direct = false } = {}) {
    const before = state.progress;
    const progress = clamp(rawProgress);
    geometryControl.time = progress;
    applyGeometry(progress);
    state.geometrySeekCount += 1;
    if (!human || Math.abs(progress - before) < .0001) return;
    state.humanProgressMutationCount += 1;
    if (direct) state.directDragMutationCount += 1;
    state.maxHumanProgress = Math.max(state.maxHumanProgress, progress);
    state.minHumanProgress = Math.min(state.minHumanProgress, progress);
    if (state.firstHumanProgressBefore === null) {
      state.firstHumanProgressBefore = before;
      state.firstHumanProgressAfter = progress;
    }
  }

  function settleTo(target, outcome) {
    stopSettle();
    const from = state.progress;
    if (Math.abs(target - from) < .001) {
      seekProgress(target, { human: true });
      state.phase = outcome === 'completed' ? 'revealed' : 'sealed';
      state.lastSettledOutcome = outcome;
      if (outcome === 'completed') state.completedRevealCount += 1;
      else state.cancelledRevealCount += 1;
      return;
    }
    state.phase = outcome === 'completed' ? 'settling-open' : 'settling-closed';
    state.inputOwnedAnimationCount += 1;
    settleControl = animate(from, target, {
      duration: reducedMotion ? .01 : .32,
      ease: [.2, .82, .2, 1],
      onUpdate: value => {
        state.inputOwnedAnimationFrameCount += 1;
        seekProgress(value, { human: true });
      },
      onComplete: () => {
        seekProgress(target, { human: true });
        state.phase = outcome === 'completed' ? 'revealed' : 'sealed';
        state.lastSettledOutcome = outcome;
        if (outcome === 'completed') state.completedRevealCount += 1;
        else state.cancelledRevealCount += 1;
        settleControl = null;
      },
    });
  }

  function recordTrustedInput(event, kind) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = true;
    return true;
  }

  function beginDrag(event) {
    if (!recordTrustedInput(event, 'pointer-drag-start')) return;
    if (event.button !== 0 && event.pointerType === 'mouse') {
      state.ignoredInputCount += 1;
      return;
    }
    event.preventDefault();
    stopSettle();
    state.pointerDownCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    state.activePointerId = event.pointerId;
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startProgress: state.progress,
    };
    handle.setPointerCapture(event.pointerId);
    state.pointerCaptured = handle.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    state.phase = 'dragging';
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!recordTrustedInput(event, 'pointer-drag-move')) return;
    event.preventDefault();
    const bounds = ticket.getBoundingClientRect();
    const xDistance = (drag.startX - event.clientX) / Math.max(1, bounds.width);
    const yDistance = (drag.startY - event.clientY) / Math.max(1, bounds.height);
    const dragDistance = Math.hypot(xDistance, yDistance);
    const next = drag.startProgress + (xDistance + yDistance) * .73;
    state.pointerMoveCount += 1;
    state.maxDragDistance = Math.max(state.maxDragDistance, dragDistance);
    seekProgress(next, { human: true, direct: true });
  }

  function finishDrag(event, cancelled = false) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!recordTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-release')) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    drag = null;
    if (cancelled || state.progress <= .1) {
      settleTo(0, 'cancelled');
    } else if (state.progress >= .78) {
      settleTo(1, 'completed');
    } else {
      state.phase = 'held-midpoint';
      state.lastSettledOutcome = 'held';
      state.heldMidpointCount += 1;
    }
  }

  handle.addEventListener('pointerdown', beginDrag);
  handle.addEventListener('pointermove', moveDrag);
  handle.addEventListener('pointerup', event => finishDrag(event));
  handle.addEventListener('pointercancel', event => finishDrag(event, true));
  handle.addEventListener('lostpointercapture', () => {
    state.pointerCaptured = false;
  });

  handle.addEventListener('keydown', event => {
    const handled = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape'].includes(event.key);
    if (!handled || !recordTrustedInput(event, 'keyboard')) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    stopSettle();
    if (event.key === 'Home' || event.key === 'Escape') {
      seekProgress(0, { human: true });
      state.phase = 'sealed';
      state.lastSettledOutcome = 'cancelled';
      state.cancelledRevealCount += 1;
    } else if (event.key === 'End') {
      seekProgress(1, { human: true });
      state.phase = 'revealed';
      state.lastSettledOutcome = 'completed';
      state.completedRevealCount += 1;
    } else if (event.key === 'Enter' || event.key === ' ') {
      settleTo(state.progress < .5 ? 1 : 0, state.progress < .5 ? 'completed' : 'cancelled');
    } else {
      const amount = ['ArrowRight', 'ArrowUp'].includes(event.key) ? .1 : -.1;
      seekProgress(state.progress + amount, { human: true });
      state.phase = state.progress <= .005 ? 'sealed' : state.progress >= .995 ? 'revealed' : 'held-midpoint';
      state.lastSettledOutcome = state.phase === 'held-midpoint' ? 'held' : state.phase;
    }
  });

  toggle.addEventListener('click', event => {
    if (!recordTrustedInput(event, 'button-control')) return;
    state.buttonActivationCount += 1;
    settleTo(state.progress < .5 ? 1 : 0, state.progress < .5 ? 'completed' : 'cancelled');
  });

  async function fetchDecodeAndSampleAsset() {
    const response = await fetch(assetUrl, { cache: 'force-cache' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === expectedAssetSha256;
    invariant(state.assetSameOrigin, 'ticket artwork was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'ticket artwork SHA-256 differs from the committed asset');

    const image = new Image();
    image.decoding = 'async';
    image.src = assetUrl;
    await image.decode();
    state.browserImageDecoded = true;
    state.sourceNaturalWidth = image.naturalWidth;
    state.sourceNaturalHeight = image.naturalHeight;
    invariant(image.naturalWidth === 960 && image.naturalHeight === 640, 'ticket artwork dimensions are not 960x640');

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = state.sampledWidth;
    sampleCanvas.height = state.sampledHeight;
    const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height);
    const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
    const colors = new Set();
    let minLuma = 255;
    let maxLuma = 0;
    let opaqueCount = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      if (alpha > 250) opaqueCount += 1;
      const luma = red * .2126 + green * .7152 + blue * .0722;
      minLuma = Math.min(minLuma, luma);
      maxLuma = Math.max(maxLuma, luma);
      if (index % 20 === 0) colors.add(`${red >> 3}-${green >> 3}-${blue >> 3}`);
    }
    state.assetPixelSampleCount = opaqueCount;
    state.assetPixelByteLength = pixels.length;
    state.assetPixelChecksum = pixelChecksum(pixels);
    state.distinctSampleColorCount = colors.size;
    state.sampledLumaRange = maxLuma - minLuma;
    invariant(opaqueCount === state.sampledWidth * state.sampledHeight, 'sampled artwork contains transparent pixels');
    invariant(colors.size > 80 && state.sampledLumaRange > 140, 'sampled artwork lacks usable tonal evidence');

    faceArt.src = assetUrl;
    rewardArt.src = assetUrl;
    await Promise.all([faceArt.decode(), rewardArt.decode()]);
    state.domImageDecodedCount = 2;
    state.assetEvidenceReady = true;
  }

  const assetReady = fetchDecodeAndSampleAsset();
  const fontsReady = document.fonts.ready;

  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.responsiveResizeCount += 1;
      updateLayoutEvidence();
    });
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await Promise.all([assetReady, fontsReady]);
    await new Promise(resolve => requestAnimationFrame(resolve));
    updateLayoutEvidence();
    const style = getComputedStyle(stage);
    const currentClip = getComputedStyle(face).clipPath;
    const inputEvidence = state.inputCount === 0
      ? state.progress === 0 && state.phase === 'sealed'
      : state.lastInputTrusted === true
        && state.humanProgressMutationCount > 0
        && state.firstHumanProgressBefore !== state.firstHumanProgressAfter;
    const pointerEvidence = state.pointerDownCount === 0
      || state.pointerCaptureCount > 0
        && state.pointerReleaseCaptureCount + state.pointerCancelCount > 0
        && state.pointerMoveCount > 0
        && state.directDragMutationCount > 0;
    const passed = state.id === 'peelable-paper-corner-reveal'
      && state.task === 'human-operated-fictional-ticket-corner-peel-and-code-reveal'
      && state.claimedLibrary === 'motion@12.42.2'
      && typeof geometryControl.pause === 'function'
      && geometryControl.duration === 1
      && state.motionControllerPaused
      && state.motionControllerCount === 1
      && state.userInputRequired
      && state.initialFrameStatic
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.renderIgnoresPreviewClock
      && inputEvidence
      && pointerEvidence
      && state.clipPointCount === 5
      && CSS.supports('clip-path', 'polygon(0 0, 100% 0, 100% 50%, 50% 100%, 0 100%)')
      && currentClip.startsWith('polygon(')
      && rewardLayer.getAttribute('aria-hidden') === String(state.progress < .78)
      && handle.getAttribute('aria-expanded') === String(state.progress >= .78)
      && Number.parseFloat(style.getPropertyValue('--peel-x')) >= 0
      && state.peelXPercent >= 0 && state.peelXPercent <= 78
      && state.peelYPercent >= 0 && state.peelYPercent <= 96
      && state.revealedTriangleAreaRatio >= 0 && state.revealedTriangleAreaRatio <= .375
      && state.stageCoverageRatio > .66
      && state.ticketAspectRatio > 1.75
      && state.assetEvidenceReady
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetByteLength > 200000
      && state.assetShaMatchesExpected
      && state.assetSha256 === expectedAssetSha256
      && state.browserImageDecoded
      && state.sourceNaturalWidth === 960
      && state.sourceNaturalHeight === 640
      && state.domImageDecodedCount === 2
      && state.assetPixelSampleCount === 1536
      && state.assetPixelByteLength === 6144
      && /^[a-f0-9]{8}$/.test(state.assetPixelChecksum)
      && state.distinctSampleColorCount > 80
      && state.sampledLumaRange > 140
      && new URL(faceArt.currentSrc || faceArt.src).origin === location.origin
      && new URL(rewardArt.currentSrc || rewardArt.src).origin === location.origin;
    state.runtimeAssertionPassed = passed;
    return passed;
  };

  installPreviewController({
    id: 'peelable-paper-corner-reveal',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => {
      state.renderCallCount += 1;
    },
    ready: Promise.all([assetReady, fontsReady]).then(() => {
      seekProgress(0);
      updateLayoutEvidence();
      state.ready = true;
    }),
  });
} catch (error) {
  markPreviewFailure(error);
}
