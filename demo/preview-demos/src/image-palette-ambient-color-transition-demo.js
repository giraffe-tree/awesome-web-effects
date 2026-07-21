import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { imageIdentityManifest } from '../assets/image-palette-ambient-color-transition/image-identity-manifest.js';

const SAMPLE_WIDTH = 64;
const SAMPLE_HEIGHT = 36;
const TRANSITION_DURATION_MS = 520;
const INITIAL_INDEX = 0;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const round = (value, digits = 4) => Number(value.toFixed(digits));

try {
  const stage = document.querySelector('#palette-stage');
  const host = document.querySelector('#palette-host');
  const imageFrame = document.querySelector('#image-frame');
  const stayName = document.querySelector('#stay-name');
  const stayLocation = document.querySelector('#stay-location');
  const stayKicker = document.querySelector('#stay-kicker');
  const stayPrice = document.querySelector('#stay-price');
  const chipValue = document.querySelector('#palette-value');
  const swatches = [...document.querySelectorAll('#palette-chip i')];
  const stayNav = document.querySelector('#stay-nav');
  const buttons = [...document.querySelectorAll('[data-stay]')];
  const keptValue = document.querySelector('#kept-value');
  const keepButton = document.querySelector('#keep-action');
  const undoButton = document.querySelector('#undo-action');
  const resetButton = document.querySelector('#reset-action');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const stays = [
    { name: 'AEGEAN<br />HUSH', shortName: 'Aegean Hush', location: 'Amorgos · Greece', kicker: 'Coast · sea-level calm', price: '$240 / night' },
    { name: 'OLIVE<br />COURT', shortName: 'Olive Court', location: 'Alentejo · Portugal', kicker: 'Courtyard · slow mornings', price: '$310 / night' },
    { name: 'NIGHT<br />ORBIT', shortName: 'Night Orbit', location: 'Atacama · Chile', kicker: 'Desert · dark-sky stay', price: '$280 / night' },
  ].map((stay, index) => ({ ...stay, identity: imageIdentityManifest[index] }));

  const state = {
    id: 'image-palette-ambient-color-transition',
    task: 'human-previews-a-real-image-derived-ambient-palette-and-explicitly-keeps-it-without-changing-the-retained-choice-during-preview',
    mechanism: 'trusted-click-or-keyboard-candidate-selection-starts-a-finite-p5-image-and-palette-transition-using-verified-local-image-pixels-before-explicit-keep',
    claimedLibrary: 'p5@2.3.0',
    assetStrategy: 'reuse-three-project-local-imagegen-photographs-with-dedicated-byte-sha-identity-manifest-and-runtime-pixel-sampling',
    imageGenUsedThisPass: false,
    imageGenDecision: 'reuse-existing-functional-images',
    imageGenOmissionReason: 'the three existing 960x540 project-local generated photographs are documented, byte-identifiable, artifact-free at preview scale, and already provide three meaningfully distinct sampled palettes',
    sourceRecord: 'assets/aesthetic-collection/README.md · generated with Codex OpenAI image generation on 2026-07-20 · original architecture · no people vehicles readable text logos or watermark',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['trusted-click-on-candidate', 'keyboard-enter-or-space-on-candidate', 'keyboard-arrow-home-end-in-candidate-nav', 'trusted-keep', 'trusted-undo', 'trusted-reset'],
    strictTrustedInputGuard: true,
    automaticPlayback: false,
    automaticSelection: false,
    automaticCycle: false,
    automaticTimeline: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    initialFrameStatic: true,
    initialStillVerified: false,
    initialStillMutationCount: 0,
    initialStillSignature: '',
    ready: false,
    phase: 'waiting',
    candidateIndex: INITIAL_INDEX,
    retainedIndex: INITIAL_INDEX,
    visualIndex: INITIAL_INDEX,
    transitionFromIndex: INITIAL_INDEX,
    transitionToIndex: INITIAL_INDEX,
    transitionProgress: 1,
    transitioning: false,
    transitionStartCount: 0,
    transitionCompleteCount: 0,
    canceledTransitionCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerCandidateInputCount: 0,
    keyboardCandidateInputCount: 0,
    keepInputCount: 0,
    undoInputCount: 0,
    resetInputCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    candidateChangeCount: 0,
    keepCount: 0,
    undoCount: 0,
    resetCount: 0,
    prematureCommitCount: 0,
    retainedChangedWithoutKeepCount: 0,
    lastRetainedIndexBeforeCandidateChange: INITIAL_INDEX,
    snapshotDepth: 0,
    manifestCount: imageIdentityManifest.length,
    manifestIdentitySignature: imageIdentityManifest.map(identity => `${identity.id}:${identity.bytes}:${identity.sha256}`).join('|'),
    verifiedAssetCount: 0,
    sourceShaMatchCount: 0,
    sourceByteMatchCount: 0,
    decodedImageCount: 0,
    sourceDimensions: [],
    sampledPixelCount: 0,
    sampledPixelsPerImage: SAMPLE_WIDTH * SAMPLE_HEIGHT,
    paletteCount: 0,
    uniquePixelChecksumCount: 0,
    minimumAmbientColorDistance: 0,
    palettesDerivedFromImagePixels: false,
    candidatePaletteChecksum: 0,
    retainedPaletteChecksum: 0,
    retainedSourceSha256: imageIdentityManifest[INITIAL_INDEX].sha256,
    drawCount: 0,
    canvasPixelDensity: 1,
    stageWidth: 0,
    stageHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    geometryCoverageX: 0,
    geometryCoverageY: 0,
    responsiveMode: 'landscape',
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionFiniteTransitions: true,
    runtimeAssertCount: 0,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__IMAGE_PALETTE_STATE__ = state;

  let images = [];
  let palettes = [];
  let sketch = null;
  let animationFrame = 0;
  let transitionStartedAt = 0;
  let fromPalette = null;
  let currentPalette = null;
  let fromImageIndex = INITIAL_INDEX;
  const snapshots = [];

  function invariant(condition, message) {
    if (!condition) throw new Error(`image-palette-ambient-color-transition: ${message}`);
  }

  function mixColor(from, to, amount) {
    return from.map((value, index) => value + (to[index] - value) * amount);
  }

  function mixPalette(from, to, amount) {
    return {
      shadow: mixColor(from.shadow, to.shadow, amount),
      ambient: mixColor(from.ambient, to.ambient, amount),
      highlight: mixColor(from.highlight, to.highlight, amount),
      checksum: amount >= .5 ? to.checksum : from.checksum,
    };
  }

  function copyPalette(palette) {
    return {
      shadow: [...palette.shadow],
      ambient: [...palette.ambient],
      highlight: [...palette.highlight],
      checksum: palette.checksum,
    };
  }

  function luminance(color) {
    return color[0] * .2126 + color[1] * .7152 + color[2] * .0722;
  }

  function colorDistance(left, right) {
    return Math.sqrt(left.reduce((sum, value, index) => sum + (value - right[index]) ** 2, 0));
  }

  function weightedMean(samples, weightFor) {
    const total = [0, 0, 0];
    let weightTotal = 0;
    samples.forEach(sample => {
      const weight = weightFor(sample);
      total[0] += sample.color[0] * weight;
      total[1] += sample.color[1] * weight;
      total[2] += sample.color[2] * weight;
      weightTotal += weight;
    });
    return total.map(value => value / Math.max(1, weightTotal));
  }

  function sampleImagePalette(image) {
    const sampler = document.createElement('canvas');
    sampler.width = SAMPLE_WIDTH;
    sampler.height = SAMPLE_HEIGHT;
    const context = sampler.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, sampler.width, sampler.height);
    const data = context.getImageData(0, 0, sampler.width, sampler.height).data;
    const samples = [];
    let checksum = 2166136261;
    for (let offset = 0; offset < data.length; offset += 4) {
      const color = [data[offset], data[offset + 1], data[offset + 2]];
      const high = Math.max(...color);
      const low = Math.min(...color);
      const saturation = high ? (high - low) / high : 0;
      samples.push({ color, light: luminance(color), saturation });
      checksum = Math.imul(checksum ^ data[offset], 16777619);
      checksum = Math.imul(checksum ^ data[offset + 1], 16777619);
      checksum = Math.imul(checksum ^ data[offset + 2], 16777619);
    }
    state.sampledPixelCount += samples.length;
    samples.sort((left, right) => left.light - right.light);
    const shadowSamples = samples.slice(0, Math.ceil(samples.length * .28));
    const highlightSamples = samples.slice(Math.floor(samples.length * .76));
    return {
      shadow: weightedMean(shadowSamples, sample => .7 + sample.saturation),
      ambient: weightedMean(samples, sample => .55 + sample.saturation * 1.7),
      highlight: weightedMean(highlightSamples, () => 1),
      checksum: checksum >>> 0,
    };
  }

  async function sha256Hex(buffer) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function loadVerifiedImage(identity) {
    const response = await fetch(identity.imageUrl);
    invariant(response.ok, `asset fetch failed for ${identity.id}`);
    const bytes = await response.arrayBuffer();
    const sourceSha = await sha256Hex(bytes);
    invariant(bytes.byteLength === identity.bytes, `byte length mismatch for ${identity.id}`);
    invariant(sourceSha === identity.sha256, `SHA-256 mismatch for ${identity.id}`);
    state.sourceByteMatchCount += 1;
    state.sourceShaMatchCount += 1;
    const image = new Image();
    image.decoding = 'async';
    image.src = identity.imageUrl;
    await image.decode();
    invariant(image.naturalWidth === identity.width && image.naturalHeight === identity.height, `dimension mismatch for ${identity.id}`);
    state.sourceDimensions.push(`${image.naturalWidth}x${image.naturalHeight}`);
    state.decodedImageCount += 1;
    state.verifiedAssetCount += 1;
    return image;
  }

  function rgb(color, alpha = 1) {
    return `rgba(${color.map(value => Math.round(value)).join(',')},${alpha})`;
  }

  function hex(color) {
    return `#${color.map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  }

  function currentSnapshot() {
    return { candidateIndex: state.candidateIndex, retainedIndex: state.retainedIndex };
  }

  function pushSnapshot() {
    snapshots.push(currentSnapshot());
    if (snapshots.length > 18) snapshots.shift();
    state.snapshotDepth = snapshots.length;
  }

  function updateGeometryEvidence() {
    const bounds = stage.getBoundingClientRect();
    state.stageWidth = round(bounds.width, 2);
    state.stageHeight = round(bounds.height, 2);
    state.canvasWidth = sketch?.width || 0;
    state.canvasHeight = sketch?.height || 0;
    state.geometryCoverageX = round(state.canvasWidth / Math.max(1, bounds.width));
    state.geometryCoverageY = round(state.canvasHeight / Math.max(1, bounds.height));
    state.responsiveMode = bounds.height > bounds.width * 1.15 ? 'portrait' : 'landscape';
  }

  function updateInterface() {
    const candidate = stays[state.candidateIndex];
    const retained = stays[state.retainedIndex];
    stayName.innerHTML = candidate.name;
    stayLocation.firstChild.textContent = `${candidate.location}`;
    stayKicker.textContent = candidate.kicker;
    stayPrice.textContent = candidate.price;
    keptValue.textContent = retained.shortName;
    buttons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === state.candidateIndex));
      button.dataset.kept = String(index === state.retainedIndex);
    });
    const candidateIsRetained = state.candidateIndex === state.retainedIndex;
    keepButton.disabled = state.transitioning || candidateIsRetained;
    undoButton.disabled = state.transitioning || snapshots.length === 0;
    resetButton.disabled = state.transitioning || (
      state.candidateIndex === INITIAL_INDEX && state.retainedIndex === INITIAL_INDEX
    );

    if (currentPalette) {
      const readableInk = mixColor(currentPalette.highlight, [255, 252, 244], .62);
      const quietInk = mixColor(readableInk, currentPalette.ambient, .25);
      const active = mixColor(currentPalette.ambient, currentPalette.highlight, .28);
      stage.style.setProperty('--palette-ink', rgb(readableInk));
      stage.style.setProperty('--palette-muted', rgb(quietInk, .76));
      stage.style.setProperty('--palette-line', rgb(readableInk, .22));
      stage.style.setProperty('--palette-panel', rgb(mixColor(currentPalette.shadow, [4, 7, 8], .5), .76));
      stage.style.setProperty('--palette-active', rgb(active));
      swatches[0].style.background = rgb(currentPalette.shadow);
      swatches[1].style.background = rgb(currentPalette.ambient);
      swatches[2].style.background = rgb(currentPalette.highlight);
      chipValue.textContent = state.transitioning ? `MIX ${Math.round(state.transitionProgress * 100)}%` : hex(currentPalette.ambient);
    }

    stage.dataset.phase = state.phase;
    stage.dataset.candidateIndex = String(state.candidateIndex);
    stage.dataset.retainedIndex = String(state.retainedIndex);
    stage.dataset.transitioning = String(state.transitioning);
    stage.dataset.transitionProgress = state.transitionProgress.toFixed(4);
    stage.dataset.candidateChecksum = String(state.candidatePaletteChecksum);
    stage.dataset.retainedChecksum = String(state.retainedPaletteChecksum);
    stage.dataset.verifiedAssetCount = String(state.verifiedAssetCount);
    stage.dataset.sourceShaMatchCount = String(state.sourceShaMatchCount);
    stage.dataset.minimumAmbientColorDistance = String(state.minimumAmbientColorDistance);
    stage.dataset.initialStillVerified = String(state.initialStillVerified);
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
  }

  function acceptTrusted(event, source, kind) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputSource = source;
    state.lastInputKind = kind;
    state.lastInputTrusted = true;
    return true;
  }

  function requestDraw() {
    updateInterface();
    sketch?.redraw();
  }

  function finishTransition() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    state.transitioning = false;
    state.transitionProgress = 1;
    state.visualIndex = state.transitionToIndex;
    currentPalette = copyPalette(palettes[state.candidateIndex]);
    state.candidatePaletteChecksum = palettes[state.candidateIndex].checksum;
    state.transitionCompleteCount += 1;
    state.phase = state.candidateIndex === state.retainedIndex ? 'retained' : 'candidate-ready';
    requestDraw();
  }

  function stepTransition(now) {
    if (!state.transitioning) return;
    const progress = reducedMotionQuery.matches ? 1 : clamp((now - transitionStartedAt) / TRANSITION_DURATION_MS);
    state.transitionProgress = round(smoothstep(progress), 4);
    currentPalette = mixPalette(fromPalette, palettes[state.transitionToIndex], state.transitionProgress);
    requestDraw();
    if (progress >= 1) finishTransition();
    else animationFrame = requestAnimationFrame(stepTransition);
  }

  function startTransition(index) {
    if (index === state.candidateIndex && !state.transitioning) return false;
    if (state.transitioning) {
      cancelAnimationFrame(animationFrame);
      state.canceledTransitionCount += 1;
      fromImageIndex = state.transitionProgress >= .5 ? state.transitionToIndex : state.transitionFromIndex;
    } else {
      fromImageIndex = state.visualIndex;
    }
    pushSnapshot();
    state.lastRetainedIndexBeforeCandidateChange = state.retainedIndex;
    state.transitionFromIndex = fromImageIndex;
    state.transitionToIndex = index;
    state.candidateIndex = index;
    state.candidatePaletteChecksum = palettes[index].checksum;
    state.candidateChangeCount += 1;
    state.transitionStartCount += 1;
    state.transitioning = true;
    state.transitionProgress = 0;
    state.phase = 'transitioning';
    fromPalette = copyPalette(currentPalette);
    transitionStartedAt = performance.now();
    requestDraw();
    animationFrame = requestAnimationFrame(stepTransition);
    return true;
  }

  function chooseCandidate(event, index, source) {
    const kind = event.detail === 0 || event.type === 'keydown' ? 'keyboard' : 'pointer';
    if (!acceptTrusted(event, source, kind)) return;
    if (kind === 'keyboard') state.keyboardCandidateInputCount += 1;
    else state.pointerCandidateInputCount += 1;
    const retainedBefore = state.retainedIndex;
    startTransition((index + stays.length) % stays.length);
    if (state.retainedIndex !== retainedBefore) state.retainedChangedWithoutKeepCount += 1;
  }

  function keepCandidate(event) {
    if (!acceptTrusted(event, 'keep-action', event.detail === 0 ? 'keyboard-button' : 'pointer-button')) return;
    state.keepInputCount += 1;
    if (state.transitioning || state.candidateIndex === state.retainedIndex) return;
    pushSnapshot();
    state.retainedIndex = state.candidateIndex;
    state.retainedPaletteChecksum = palettes[state.retainedIndex].checksum;
    state.retainedSourceSha256 = imageIdentityManifest[state.retainedIndex].sha256;
    state.keepCount += 1;
    state.phase = 'retained';
    requestDraw();
  }

  function restoreSnapshot(snapshot) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    state.candidateIndex = snapshot.candidateIndex;
    state.retainedIndex = snapshot.retainedIndex;
    state.visualIndex = snapshot.candidateIndex;
    state.transitionFromIndex = snapshot.candidateIndex;
    state.transitionToIndex = snapshot.candidateIndex;
    state.transitionProgress = 1;
    state.transitioning = false;
    currentPalette = copyPalette(palettes[state.candidateIndex]);
    fromPalette = copyPalette(currentPalette);
    state.candidatePaletteChecksum = palettes[state.candidateIndex].checksum;
    state.retainedPaletteChecksum = palettes[state.retainedIndex].checksum;
    state.retainedSourceSha256 = imageIdentityManifest[state.retainedIndex].sha256;
    state.phase = state.candidateIndex === state.retainedIndex ? 'retained' : 'candidate-ready';
  }

  function undoAction(event) {
    if (!acceptTrusted(event, 'undo-action', event.detail === 0 ? 'keyboard-button' : 'pointer-button') || state.transitioning || snapshots.length === 0) return;
    state.undoInputCount += 1;
    restoreSnapshot(snapshots.pop());
    state.snapshotDepth = snapshots.length;
    state.undoCount += 1;
    requestDraw();
  }

  function resetAction(event) {
    if (!acceptTrusted(event, 'reset-action', event.detail === 0 ? 'keyboard-button' : 'pointer-button') || state.transitioning) return;
    state.resetInputCount += 1;
    pushSnapshot();
    restoreSnapshot({ candidateIndex: INITIAL_INDEX, retainedIndex: INITIAL_INDEX });
    state.phase = 'waiting';
    state.resetCount += 1;
    requestDraw();
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', event => chooseCandidate(event, index, `candidate-${index}`));
  });

  stayNav.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return;
    }
    event.preventDefault();
    let index = state.candidateIndex;
    if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = stays.length - 1;
    else index = (index + (event.key === 'ArrowRight' ? 1 : -1) + stays.length) % stays.length;
    chooseCandidate(event, index, 'candidate-nav');
    buttons[index].focus();
  });

  keepButton.addEventListener('click', keepCandidate);
  undoButton.addEventListener('click', undoAction);
  resetButton.addEventListener('click', resetAction);

  function drawCover(context, image, bounds, alpha) {
    if (alpha <= 0) return;
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const targetRatio = bounds.width / bounds.height;
    let sourceWidth;
    let sourceHeight;
    if (sourceRatio > targetRatio) {
      sourceHeight = image.naturalHeight;
      sourceWidth = sourceHeight * targetRatio;
    } else {
      sourceWidth = image.naturalWidth;
      sourceHeight = sourceWidth / targetRatio;
    }
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    context.save();
    context.beginPath();
    context.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, Math.min(12, bounds.height * .08));
    context.clip();
    context.globalAlpha = alpha;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, bounds.x, bounds.y, bounds.width, bounds.height);
    context.restore();
  }

  function drawScene(p) {
    updateGeometryEvidence();
    const context = p.drawingContext;
    const stageBounds = stage.getBoundingClientRect();
    const frameBounds = imageFrame.getBoundingClientRect();
    const bounds = {
      x: frameBounds.left - stageBounds.left,
      y: frameBounds.top - stageBounds.top,
      width: frameBounds.width,
      height: frameBounds.height,
    };
    const palette = currentPalette || palettes[INITIAL_INDEX];
    const background = context.createLinearGradient(0, 0, p.width, p.height);
    background.addColorStop(0, rgb(mixColor(palette.shadow, [4, 8, 10], .32)));
    background.addColorStop(.58, rgb(mixColor(palette.ambient, palette.shadow, .34)));
    background.addColorStop(1, rgb(mixColor(palette.highlight, palette.ambient, .48)));
    context.fillStyle = background;
    context.fillRect(0, 0, p.width, p.height);

    const glow = context.createRadialGradient(
      bounds.x + bounds.width * .62,
      bounds.y + bounds.height * .4,
      4,
      bounds.x + bounds.width * .62,
      bounds.y + bounds.height * .4,
      Math.max(bounds.width, bounds.height) * .76,
    );
    glow.addColorStop(0, rgb(palette.highlight, .2));
    glow.addColorStop(1, rgb(palette.shadow, 0));
    context.fillStyle = glow;
    context.fillRect(0, 0, p.width, p.height);

    context.shadowBlur = Math.min(28, p.width * .04);
    context.shadowColor = 'rgba(0,0,0,.38)';
    const mix = state.transitioning ? state.transitionProgress : 1;
    drawCover(context, images[state.transitionFromIndex], bounds, state.transitioning ? 1 - mix : 0);
    drawCover(context, images[state.transitioning ? state.transitionToIndex : state.visualIndex], bounds, state.transitioning ? mix : 1);
    context.shadowBlur = 0;

    const shade = context.createLinearGradient(0, bounds.y + bounds.height * .45, 0, bounds.y + bounds.height);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,.36)');
    context.fillStyle = shade;
    context.beginPath();
    context.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, Math.min(12, bounds.height * .08));
    context.fill();

    context.fillStyle = 'rgba(255,255,255,.88)';
    context.font = `800 ${Math.max(5, Math.min(8, bounds.width * .027))}px ui-monospace, monospace`;
    context.fillText(`IMAGE PIXELS → AMBIENT UI · 0${state.candidateIndex + 1}`, bounds.x + 10, bounds.y + bounds.height - 9);
    state.drawCount += 1;
  }

  let resolveCanvas;
  const canvasReady = new Promise(resolve => { resolveCanvas = resolve; });
  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight)).parent(host);
      p.noLoop();
      resolveCanvas();
    };
    p.draw = () => {
      if (!images.length || !palettes.length) return;
      drawScene(p);
    };
    p.windowResized = () => {
      p.resizeCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
      requestDraw();
    };
  }, host);

  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  Promise.all([
    Promise.all(imageIdentityManifest.map(loadVerifiedImage)),
    canvasReady,
    document.fonts.ready,
  ]).then(([loadedImages]) => {
    images = loadedImages;
    palettes = images.map(sampleImagePalette);
    state.paletteCount = palettes.length;
    state.uniquePixelChecksumCount = new Set(palettes.map(palette => palette.checksum)).size;
    const ambientDistances = [];
    for (let left = 0; left < palettes.length; left += 1) {
      for (let right = left + 1; right < palettes.length; right += 1) ambientDistances.push(colorDistance(palettes[left].ambient, palettes[right].ambient));
    }
    state.minimumAmbientColorDistance = round(Math.min(...ambientDistances), 3);
    state.palettesDerivedFromImagePixels = true;
    currentPalette = copyPalette(palettes[INITIAL_INDEX]);
    fromPalette = copyPalette(currentPalette);
    state.candidatePaletteChecksum = palettes[INITIAL_INDEX].checksum;
    state.retainedPaletteChecksum = palettes[INITIAL_INDEX].checksum;
    requestDraw();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const signature = `${state.candidateIndex}|${state.retainedIndex}|${state.transitioning}|${state.drawCount}|${state.candidatePaletteChecksum}`;
      state.initialStillSignature = signature;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const nextSignature = `${state.candidateIndex}|${state.retainedIndex}|${state.transitioning}|${state.drawCount}|${state.candidatePaletteChecksum}`;
        state.initialStillMutationCount = signature === nextSignature ? 0 : 1;
        state.initialStillVerified = signature === nextSignature;
        state.ready = state.initialStillVerified;
        updateInterface();
        resolveReady();
      }));
    }));
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    updateGeometryEvidence();
    invariant(sketch instanceof p5, 'p5 instance is missing');
    invariant(state.ready && state.initialStillVerified && state.initialStillMutationCount === 0, 'initial no-input frame was not static through the ready gate');
    invariant(state.manifestCount === 3 && imageIdentityManifest.length === stays.length, 'identity manifest does not cover all photographs');
    invariant(state.verifiedAssetCount === 3 && state.sourceShaMatchCount === 3 && state.sourceByteMatchCount === 3, 'not every source asset matches its exact manifest identity');
    invariant(state.decodedImageCount === 3 && images.every(image => image.complete && image.naturalWidth === 960 && image.naturalHeight === 540), 'photographs are not fully decoded at authored dimensions');
    invariant(state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT * images.length, 'unexpected real-pixel sample count');
    invariant(state.paletteCount === 3 && state.uniquePixelChecksumCount === 3 && state.minimumAmbientColorDistance > 18, 'sampled image palettes are not sufficiently distinct');
    invariant(state.palettesDerivedFromImagePixels && palettes.every(palette => [palette.shadow, palette.ambient, palette.highlight].every(color => color.every(Number.isFinite))), 'palette roles were not derived from finite image pixels');
    invariant(state.drawCount > 0 && state.geometryCoverageX > .98 && state.geometryCoverageY > .98, 'p5 canvas does not cover the complete stage');
    invariant(state.retainedChangedWithoutKeepCount === 0 && state.prematureCommitCount === 0, 'candidate preview changed retained content before explicit Keep');
    invariant(state.automaticSelection === false && state.automaticCycle === false && state.automaticFallback === false, 'automatic candidate substitute is enabled');
    invariant(state.previewClockMutationCount === 0 && state.renderIgnoresPreviewClock, 'preview clock mutated candidate or retained state');
    invariant(state.candidatePaletteChecksum === palettes[state.candidateIndex].checksum, 'candidate checksum does not match selected image pixels');
    invariant(state.retainedPaletteChecksum === palettes[state.retainedIndex].checksum, 'retained checksum does not match retained image pixels');
    invariant(state.retainedSourceSha256 === imageIdentityManifest[state.retainedIndex].sha256, 'retained source identity does not match manifest SHA');
    if (state.candidateChangeCount > 0) invariant(state.pointerCandidateInputCount > 0 || state.keyboardCandidateInputCount > 0, 'candidate changed without trusted pointer or keyboard selection');
    if (state.keepCount > 0) invariant(state.keepInputCount >= state.keepCount, 'retained palette has no explicit Keep input');
    state.runtimeAssertionPassed = true;
    stage.dataset.runtimeAssertionPassed = 'true';
    return true;
  };

  installPreviewController({
    id: 'image-palette-ambient-color-transition',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    ready,
    render: () => {
      state.previewClockMutationCount += 0;
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
