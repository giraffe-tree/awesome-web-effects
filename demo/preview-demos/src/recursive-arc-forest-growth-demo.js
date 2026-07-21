import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL('../assets/aesthetic-wave-08/recursive-arc-forest-growth/coastal-forest-canopy-transect.jpg', import.meta.url).href;
const EXPECTED_ASSET = Object.freeze({ bytes: 409376, width: 960, height: 640, sha256: 'e577e2a16d3f28702dad076941c461211eab638f16cc92fa7c5883ea710e9878' });
const SAMPLE_WIDTH = 90;
const SAMPLE_HEIGHT = 60;
const SAMPLE_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const PLOT_COUNT = 5;
const INITIAL_PROGRESS = .26;
const INITIAL_WIND = .04;
const INITIAL_DEPTH_BUDGET = 8;
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 4) => Number(value.toFixed(digits));

try {
  const stage = document.querySelector('#forest-stage');
  const canvasHost = document.querySelector('#forest-canvas-host');
  const depthReadout = document.querySelector('#depth-readout');
  const branchReadout = document.querySelector('#branch-readout');
  const verdictReadout = document.querySelector('#verdict-readout');
  const progressInput = document.querySelector('#growth-progress');
  const progressReadout = document.querySelector('#progress-readout');
  const actionButtons = [...document.querySelectorAll('[data-action]')];
  const ledger = document.querySelector('#runtime-ledger');

  let sketch;
  let canopyImage;
  let samplePixels;
  let resizeFrame = 0;
  let dirty = true;
  let dragOrigin = null;

  const state = {
    id: 'recursive-arc-forest-growth', task: 'human-operated-pixel-seeded-recursive-forest-regeneration-transect', claimedLibrary: 'p5@2.3.0', renderer: 'canvas2d',
    mechanism: 'verified-canopy-raster-pixels-drive-five-recursive-tree-depth-spread-bend-color-and-regeneration-verdict',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-control', 'visible-buttons'],
    userInputRequired: true, strictTrustedInputGuard: true, initialFrameStatic: true, initialStillVerified: false,
    automaticCycle: false, automaticPlayback: false, automaticRehearsal: false, automaticFallback: false, syntheticInputDispatch: false,
    captureClockDriven: false, previewClockMutationCount: 0, renderIgnoresPreviewClock: true, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    ready: false, inputCount: 0, trustedInputCount: 0, rejectedUntrustedInputCount: 0, hoverInputCount: 0, pointerDownCount: 0, pointerDragCount: 0,
    pointerReleaseCount: 0, pointerCancelCount: 0, pointerCaptureCount: 0, pointerCaptureReleaseCount: 0, mouseInputCount: 0, touchInputCount: 0,
    penInputCount: 0, keyboardInputCount: 0, rangeInputCount: 0, buttonInputCount: 0, humanMutationCount: 0, progressMutationCount: 0,
    windMutationCount: 0, depthMutationCount: 0, growCount: 0, pruneCount: 0, resetCount: 0, activePointerId: null, activePointerType: 'none', pointerCaptured: false,
    lastInputKind: 'none', lastInputTrusted: null, progress: INITIAL_PROGRESS, initialProgress: INITIAL_PROGRESS, wind: INITIAL_WIND, initialWind: INITIAL_WIND,
    depthBudget: INITIAL_DEPTH_BUDGET, initialDepthBudget: INITIAL_DEPTH_BUDGET, activePlot: 2, hoverU: .5, hoverV: .5, transitionRecords: [],
    assetUrl: ASSET_URL, assetFetchCount: 0, assetResponseStatus: 0, assetMimeType: '', assetSameOrigin: false, assetByteLength: 0, assetSha256: '', assetShaMatchesExpected: false,
    browserImageDecoded: false, sourceNaturalWidth: 0, sourceNaturalHeight: 0, p5ImageDecoded: false, p5ImageClass: '', p5ImageWidth: 0, p5ImageHeight: 0, p5ImagePixelLength: 0,
    sampledWidth: SAMPLE_WIDTH, sampledHeight: SAMPLE_HEIGHT, sampledPixelCount: 0, sampledPixelByteLength: 0, sampledPixelSha256: '', sampledPixelChecksum: 0,
    distinctSampleColorCount: 0, sampledLumaMinimum: 255, sampledLumaMaximum: 0, sampledLumaRange: 0, sampledEdgeMean: 0, opaqueSamplePixelCount: 0,
    habitatProfiles: [], habitatProfileCount: 0, profilePixelCount: 0, pixelEvidenceReady: false, maximumHabitatDepth: 0, minimumHabitatDepth: 0,
    visibleBranchCount: 0, potentialBranchCount: 0, visibleDepth: 0, totalDrawnPathLength: 0, regenerationCoverage: 0, regenerationVerdict: 'WAITING',
    p5InstanceReady: false, p5CanvasReady: false, p5CanvasWidth: 0, p5CanvasHeight: 0, p5DrawCount: 0, p5CompletedDrawCount: 0, p5ImageDrawCount: 0,
    redrawRequestCount: 0, resizeCount: 0, previewRenderCount: 0, initialCanvasSignature: 0, currentCanvasSignature: 0,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__RECURSIVE_ARC_FOREST_STATE__ = state;

  function invariant(condition, message) { if (!condition) throw new Error(`recursive-arc-forest-growth: ${message}`); }
  function fnv(bytes, stride = 1) { let checksum = 2166136261; for (let index = 0; index < bytes.length; index += stride) checksum = Math.imul(checksum ^ bytes[index], 16777619) >>> 0; return checksum >>> 0; }
  async function digestHex(buffer) { const digest = await crypto.subtle.digest('SHA-256', buffer); return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join(''); }

  function analyzePixels() {
    const profiles = Array.from({ length: PLOT_COUNT }, (_, index) => ({ index, count: 0, red: 0, green: 0, blue: 0, luma: 0, edge: 0, edgeCount: 0 }));
    const colors = new Set();
    let edgeTotal = 0;
    let edgeCount = 0;
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const offset = (y * SAMPLE_WIDTH + x) * 4;
        const red = samplePixels[offset]; const green = samplePixels[offset + 1]; const blue = samplePixels[offset + 2]; const alpha = samplePixels[offset + 3];
        const luma = red * .2126 + green * .7152 + blue * .0722;
        const profile = profiles[Math.min(PLOT_COUNT - 1, Math.floor(x / SAMPLE_WIDTH * PLOT_COUNT))];
        profile.count += 1; profile.red += red; profile.green += green; profile.blue += blue; profile.luma += luma;
        if (alpha === 255) state.opaqueSamplePixelCount += 1;
        state.sampledLumaMinimum = Math.min(state.sampledLumaMinimum, luma); state.sampledLumaMaximum = Math.max(state.sampledLumaMaximum, luma);
        colors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
        if (x > 0) {
          const prior = offset - 4;
          const edge = (Math.abs(red - samplePixels[prior]) + Math.abs(green - samplePixels[prior + 1]) + Math.abs(blue - samplePixels[prior + 2])) / 3;
          profile.edge += edge; profile.edgeCount += 1; edgeTotal += edge; edgeCount += 1;
        }
      }
    }
    state.sampledPixelCount = SAMPLE_COUNT; state.sampledPixelByteLength = samplePixels.byteLength; state.sampledPixelChecksum = fnv(samplePixels);
    state.distinctSampleColorCount = colors.size; state.sampledLumaRange = rounded(state.sampledLumaMaximum - state.sampledLumaMinimum, 2); state.sampledEdgeMean = rounded(edgeTotal / edgeCount, 4);
    state.habitatProfiles = profiles.map(profile => {
      const rgb = [profile.red, profile.green, profile.blue].map(value => Math.round(value / profile.count));
      const meanLuma = profile.luma / profile.count; const edgeMean = profile.edge / profile.edgeCount;
      const greenness = clamp((rgb[1] * 1.18 - rgb[0] * .55 - rgb[2] * .28) / 128);
      const moisture = clamp((rgb[1] + rgb[2] * .72 - rgb[0] * .58) / 220);
      const texture = clamp(edgeMean / 34);
      const depth = 5 + Math.round(clamp(greenness * .64 + texture * .36) * 5);
      const spread = .34 + texture * .2 + moisture * .08;
      const bend = (meanLuma / 255 - .38) * .22 + (profile.index - 2) * .012;
      const suitability = clamp(greenness * .48 + moisture * .3 + texture * .22);
      return { index: profile.index, pixelCount: profile.count, rgb, meanLuma: rounded(meanLuma, 2), edgeMean: rounded(edgeMean, 4), greenness: rounded(greenness), moisture: rounded(moisture), texture: rounded(texture), depth, spread: rounded(spread), bend: rounded(bend), suitability: rounded(suitability), checksum: fnv(Uint8Array.from([...rgb, profile.count & 255, Math.round(edgeMean) & 255])) };
    });
    state.habitatProfileCount = state.habitatProfiles.length; state.profilePixelCount = state.habitatProfiles.reduce((sum, profile) => sum + profile.pixelCount, 0);
    state.minimumHabitatDepth = Math.min(...state.habitatProfiles.map(profile => profile.depth)); state.maximumHabitatDepth = Math.max(...state.habitatProfiles.map(profile => profile.depth));
    state.pixelEvidenceReady = state.habitatProfileCount === PLOT_COUNT && state.profilePixelCount === SAMPLE_COUNT && state.distinctSampleColorCount > 250 && state.sampledLumaRange > 100 && state.sampledEdgeMean > 4;
  }

  async function fetchDecodeAndSample() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' }); state.assetFetchCount += 1; state.assetResponseStatus = response.status; state.assetMimeType = response.headers.get('content-type') || ''; state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `asset request failed ${response.status}`); const buffer = await response.arrayBuffer(); state.assetByteLength = buffer.byteLength; state.assetSha256 = await digestHex(buffer); state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;
    invariant(state.assetSameOrigin && state.assetByteLength === EXPECTED_ASSET.bytes && state.assetShaMatchesExpected, 'committed canopy source changed');
    const url = URL.createObjectURL(new Blob([buffer], { type: state.assetMimeType || 'image/jpeg' })); const image = new Image(); image.src = url;
    try { await image.decode(); state.browserImageDecoded = true; state.sourceNaturalWidth = image.naturalWidth; state.sourceNaturalHeight = image.naturalHeight; invariant(image.naturalWidth === EXPECTED_ASSET.width && image.naturalHeight === EXPECTED_ASSET.height, 'source dimensions changed');
      const sampleCanvas = document.createElement('canvas'); sampleCanvas.width = SAMPLE_WIDTH; sampleCanvas.height = SAMPLE_HEIGHT; const context = sampleCanvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT); samplePixels = new Uint8ClampedArray(context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data); state.sampledPixelSha256 = await digestHex(samplePixels.buffer); analyzePixels();
    } finally { URL.revokeObjectURL(url); }
    invariant(state.pixelEvidenceReady, 'canopy pixels did not produce varied habitat evidence');
  }

  function loadP5Image() { return new Promise((resolve, reject) => sketch.loadImage(ASSET_URL, image => { image.loadPixels(); state.p5ImageDecoded = image instanceof p5.Image; state.p5ImageClass = state.p5ImageDecoded ? 'p5.Image' : image?.constructor?.name || ''; state.p5ImageWidth = image.width; state.p5ImageHeight = image.height; state.p5ImagePixelLength = image.pixels.length; resolve(image); }, reject)); }

  function drawBranch(p, x, y, length, angle, profile, level, growthBudget) {
    const local = clamp(growthBudget - level); if (local <= 0 || level >= Math.min(profile.depth, state.depthBudget)) return;
    const wind = state.wind * (level + 1) * .16; const curve = profile.bend + wind; const endX = x + Math.cos(angle) * length * local; const endY = y + Math.sin(angle) * length * local;
    const controlX = x + Math.cos(angle + curve) * length * .54 * local; const controlY = y + Math.sin(angle + curve) * length * .54 * local;
    const active = profile.index === state.activePlot;
    const context = p.drawingContext;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(controlX, controlY, endX, endY);
    context.lineWidth = Math.max(.45, (Math.min(profile.depth, state.depthBudget) - level) * .58);
    context.lineCap = 'round';
    context.strokeStyle = `rgba(${Math.min(255, profile.rgb[0] + (active ? 72 : 34))},${Math.min(255, profile.rgb[1] + (active ? 96 : 55))},${Math.min(255, profile.rgb[2] + 28)},${(135 + local * 100) / 255})`;
    context.stroke();
    state.visibleBranchCount += 1; state.totalDrawnPathLength += Math.hypot(endX - x, endY - y); state.visibleDepth = Math.max(state.visibleDepth, level + 1);
    if (local >= .995) { const spread = profile.spread; drawBranch(p, endX, endY, length * (.68 + profile.suitability * .05), angle - spread + wind, profile, level + 1, growthBudget); drawBranch(p, endX, endY, length * (.65 + profile.moisture * .07), angle + spread + wind, profile, level + 1, growthBudget); }
  }

  function canvasSignature() { const canvas = canvasHost.querySelector('canvas'); if (!canvas) return 0; const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data; return fnv(pixels, Math.max(4, Math.floor(pixels.length / 4096 / 4) * 4)); }
  function updateEvidence() {
    state.potentialBranchCount = state.habitatProfiles.reduce((sum, profile) => sum + (2 ** Math.min(profile.depth, state.depthBudget) - 1), 0);
    state.regenerationCoverage = rounded(state.visibleBranchCount / Math.max(1, state.potentialBranchCount));
    const habitatMean = state.habitatProfiles.reduce((sum, profile) => sum + profile.suitability, 0) / PLOT_COUNT;
    state.regenerationVerdict = state.progress >= .78 && state.regenerationCoverage >= .52 && habitatMean >= .28 ? 'ESTABLISHED' : state.progress >= .48 ? 'REGENERATING' : 'EARLY STAGE';
    depthReadout.textContent = `${state.visibleDepth} / ${Math.min(state.depthBudget, state.maximumHabitatDepth)}`; branchReadout.textContent = String(state.visibleBranchCount); verdictReadout.textContent = state.regenerationVerdict; progressReadout.textContent = `${Math.round(state.progress * 100)}%`; progressInput.value = String(Math.round(state.progress * 100));
    stage.dataset.progress = state.progress.toFixed(4); stage.dataset.wind = state.wind.toFixed(4); stage.dataset.depth = String(state.depthBudget); stage.dataset.branchCount = String(state.visibleBranchCount); stage.dataset.verdict = state.regenerationVerdict; stage.dataset.inputCount = String(state.inputCount);
    ledger.value = JSON.stringify({ progress: state.progress, wind: state.wind, depthBudget: state.depthBudget, activePlot: state.activePlot, branches: state.visibleBranchCount, verdict: state.regenerationVerdict, assetSha256: state.assetSha256, sampledPixelSha256: state.sampledPixelSha256 });
  }

  function drawScene(p) {
    state.p5DrawCount += 1; if (!state.ready || !canopyImage) { p.background('#07110d'); return; }
    const width = p.width; const height = p.height; const imageRatio = canopyImage.width / canopyImage.height; const stageRatio = width / height; let sx = 0; let sy = 0; let sw = canopyImage.width; let sh = canopyImage.height;
    if (stageRatio > imageRatio) { sh = canopyImage.width / stageRatio; sy = (canopyImage.height - sh) / 2; } else { sw = canopyImage.height * stageRatio; sx = (canopyImage.width - sw) / 2; }
    p.image(canopyImage, 0, 0, width, height, sx, sy, sw, sh); state.p5ImageDrawCount += 1; p.noStroke(); p.fill(3, 11, 7, 128); p.rect(0, 0, width, height);
    state.visibleBranchCount = 0; state.visibleDepth = 0; state.totalDrawnPathLength = 0;
    const positions = [.31, .43, .56, .69, .82]; state.habitatProfiles.forEach((profile, index) => { const maxDepth = Math.min(profile.depth, state.depthBudget); const growthBudget = state.progress * maxDepth; const baseX = positions[index] * width; const baseY = height * (.91 + (index % 2) * .015); const length = height * (.18 + profile.suitability * .035); drawBranch(p, baseX, baseY, length, -Math.PI / 2 + (index - 2) * .025, profile, 0, growthBudget); });
    const probeX = state.hoverU * width; const probeY = state.hoverV * height; p.noFill(); p.stroke(201, 245, 125, 170); p.strokeWeight(1); p.circle(probeX, probeY, 13); p.line(probeX - 8, probeY, probeX + 8, probeY); p.line(probeX, probeY - 8, probeX, probeY + 8);
    updateEvidence(); state.p5CompletedDrawCount += 1; if (!state.initialStillVerified) state.initialStillVerified = state.inputCount === 0 && state.humanMutationCount === 0 && state.automaticPlayback === false && state.previewClockMutationCount === 0; dirty = false;
  }

  const canvasReady = new Promise((resolve, reject) => { sketch = new p5(p => { p.setup = () => { try { p.pixelDensity(1); const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight)); canvas.parent(canvasHost); p.noLoop(); state.p5InstanceReady = p instanceof p5; state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D; state.p5CanvasWidth = p.width; state.p5CanvasHeight = p.height; resolve(); } catch (error) { reject(error); } }; p.draw = () => drawScene(p); }, canvasHost); });

  function requestDraw(reason) { dirty = true; state.redrawRequestCount += 1; state.lastRedrawReason = reason; if (!state.ready || !sketch) return; sketch.redraw(); dirty = false; state.currentCanvasSignature = canvasSignature(); }
  function acceptTrusted(event, kind) { if (event?.isTrusted !== true) { state.rejectedUntrustedInputCount += 1; state.lastInputTrusted = false; return false; } state.inputCount += 1; state.trustedInputCount += 1; state.lastInputKind = kind; state.lastInputTrusted = true; if (kind === 'hover') state.hoverInputCount += 1; if (kind === 'keyboard') state.keyboardInputCount += 1; if (kind === 'range') state.rangeInputCount += 1; if (kind === 'button') state.buttonInputCount += 1; if (event.pointerType === 'mouse') state.mouseInputCount += 1; if (event.pointerType === 'touch') state.touchInputCount += 1; if (event.pointerType === 'pen') state.penInputCount += 1; return true; }
  function recordMutation(source, before) { const after = `${state.progress.toFixed(4)}:${state.wind.toFixed(4)}:${state.depthBudget}:${state.activePlot}`; if (after === before) return false; state.humanMutationCount += 1; state.transitionRecords.push({ source, trusted: true, before, after }); if (state.transitionRecords.length > 64) state.transitionRecords.shift(); requestDraw(source); return true; }
  function mutate(patch, source) { const before = `${state.progress.toFixed(4)}:${state.wind.toFixed(4)}:${state.depthBudget}:${state.activePlot}`; const priorProgress = state.progress; const priorWind = state.wind; const priorDepth = state.depthBudget; state.progress = clamp(patch.progress ?? state.progress); state.wind = clamp(patch.wind ?? state.wind, -.48, .48); state.depthBudget = Math.max(4, Math.min(8, Math.round(patch.depthBudget ?? state.depthBudget))); state.activePlot = Math.max(0, Math.min(PLOT_COUNT - 1, Math.round(patch.activePlot ?? state.activePlot))); if (state.progress !== priorProgress) state.progressMutationCount += 1; if (state.wind !== priorWind) state.windMutationCount += 1; if (state.depthBudget !== priorDepth) state.depthMutationCount += 1; recordMutation(source, before); updateEvidence(); }
  function pointerPoint(event) { const rect = stage.getBoundingClientRect(); return { u: clamp((event.clientX - rect.left) / rect.width), v: clamp((event.clientY - rect.top) / rect.height) }; }
  function isControl(event) { return event.target instanceof Element && Boolean(event.target.closest('button,input')); }

  stage.addEventListener('pointermove', event => { if (!state.ready || isControl(event)) return; const point = pointerPoint(event); const dragging = state.activePointerId === event.pointerId; if (!dragging && event.pointerType !== 'mouse') return; if (!acceptTrusted(event, dragging ? event.pointerType || 'mouse' : 'hover')) return; state.hoverU = point.u; state.hoverV = point.v; const activePlot = Math.max(0, Math.min(PLOT_COUNT - 1, Math.floor(point.u * PLOT_COUNT))); if (!dragging) { mutate({ activePlot }, 'mouse-hover-plot'); return; } event.preventDefault(); state.pointerDragCount += 1; const rect = stage.getBoundingClientRect(); mutate({ progress: dragOrigin.progress + (event.clientX - dragOrigin.x) / rect.width * 1.2, wind: dragOrigin.wind + (event.clientY - dragOrigin.y) / rect.height * 1.15, activePlot }, `pointer-${event.pointerType || 'mouse'}-drag`); });
  stage.addEventListener('pointerdown', event => { if (!state.ready || isControl(event) || event.isPrimary === false || (event.button !== undefined && event.button !== 0) || !acceptTrusted(event, event.pointerType || 'mouse')) return; event.preventDefault(); stage.focus({ preventScroll: true }); state.pointerDownCount += 1; state.activePointerId = event.pointerId; state.activePointerType = event.pointerType || 'mouse'; dragOrigin = { x: event.clientX, y: event.clientY, progress: state.progress, wind: state.wind }; stage.setPointerCapture(event.pointerId); state.pointerCaptured = stage.hasPointerCapture(event.pointerId); if (state.pointerCaptured) state.pointerCaptureCount += 1; const point = pointerPoint(event); state.hoverU = point.u; state.hoverV = point.v; mutate({ activePlot: Math.floor(point.u * PLOT_COUNT) }, `pointer-${state.activePointerType}-down`); });
  function finishPointer(event, cancelled = false) { if (event.pointerId !== state.activePointerId || !acceptTrusted(event, event.pointerType || state.activePointerType)) return; event.preventDefault(); if (state.pointerCaptured) { try { if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId); } catch {} state.pointerCaptureReleaseCount += 1; } state.pointerCaptured = false; state.activePointerId = null; state.activePointerType = 'none'; dragOrigin = null; if (cancelled) state.pointerCancelCount += 1; else state.pointerReleaseCount += 1; }
  stage.addEventListener('pointerup', event => finishPointer(event)); stage.addEventListener('pointercancel', event => finishPointer(event, true));
  stage.addEventListener('keydown', event => { if (event.target === progressInput) return; const key = event.key; const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '[', ']', 'r', 'R', 'Home', 'End'].includes(key); if (!handled || !acceptTrusted(event, 'keyboard')) return; event.preventDefault(); if (key === 'r' || key === 'R' || key === 'Home') { state.resetCount += 1; mutate({ progress: INITIAL_PROGRESS, wind: INITIAL_WIND, depthBudget: INITIAL_DEPTH_BUDGET, activePlot: 2 }, `keyboard-${key}`); } else if (key === 'End') mutate({ progress: 1 }, 'keyboard-End'); else if (key === '[' || key === ']') mutate({ depthBudget: state.depthBudget + (key === ']' ? 1 : -1) }, `keyboard-${key}`); else if (key === 'ArrowLeft' || key === 'ArrowRight') mutate({ progress: state.progress + (key === 'ArrowRight' ? .06 : -.06) }, `keyboard-${key}`); else mutate({ wind: state.wind + (key === 'ArrowDown' ? .055 : -.055) }, `keyboard-${key}`); });
  progressInput.addEventListener('input', event => { if (!acceptTrusted(event, 'range')) return; mutate({ progress: Number(progressInput.value) / 100 }, 'range-growth-progress'); });
  actionButtons.forEach(button => button.addEventListener('click', event => { if (!acceptTrusted(event, 'button')) return; const action = button.dataset.action; if (action === 'grow') { state.growCount += 1; mutate({ progress: state.progress + .16 }, 'button-grow'); } else if (action === 'prune') { state.pruneCount += 1; mutate({ progress: state.progress - .14 }, 'button-prune'); } else { state.resetCount += 1; mutate({ progress: INITIAL_PROGRESS, wind: INITIAL_WIND, depthBudget: INITIAL_DEPTH_BUDGET, activePlot: 2 }, 'button-reset'); } }));

  const ready = Promise.all([canvasReady, fetchDecodeAndSample(), document.fonts.ready]).then(async () => { canopyImage = await loadP5Image(); invariant(state.p5ImageDecoded && state.p5ImageWidth === EXPECTED_ASSET.width && state.p5ImageHeight === EXPECTED_ASSET.height && state.p5ImagePixelLength === EXPECTED_ASSET.width * EXPECTED_ASSET.height * 4, 'p5 canopy evidence incomplete'); state.ready = true; requestDraw('resources-ready'); state.initialCanvasSignature = state.currentCanvasSignature; requestDraw('initial-still-check'); invariant(state.currentCanvasSignature === state.initialCanvasSignature, 'initial canvas mutated without human input'); });
  new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { if (!sketch) return; const width = Math.max(1, stage.clientWidth); const height = Math.max(1, stage.clientHeight); if (sketch.width === width && sketch.height === height) return; sketch.resizeCanvas(width, height, false); state.p5CanvasWidth = width; state.p5CanvasHeight = height; state.resizeCount += 1; requestDraw('resize'); }); }).observe(stage);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const assetEvidence = state.assetFetchCount === 1 && state.assetResponseStatus === 200 && state.assetMimeType.includes('image/jpeg') && state.assetSameOrigin && state.assetByteLength === EXPECTED_ASSET.bytes && state.assetSha256 === EXPECTED_ASSET.sha256 && state.assetShaMatchesExpected && state.browserImageDecoded && state.sourceNaturalWidth === EXPECTED_ASSET.width && state.sourceNaturalHeight === EXPECTED_ASSET.height && state.p5ImageDecoded && state.p5ImageClass === 'p5.Image' && state.p5ImageWidth === EXPECTED_ASSET.width && state.p5ImageHeight === EXPECTED_ASSET.height && state.p5ImagePixelLength === EXPECTED_ASSET.width * EXPECTED_ASSET.height * 4;
    const pixels = state.sampledPixelCount === SAMPLE_COUNT && state.sampledPixelByteLength === SAMPLE_COUNT * 4 && /^[0-9a-f]{64}$/.test(state.sampledPixelSha256) && state.sampledPixelChecksum > 0 && state.opaqueSamplePixelCount === SAMPLE_COUNT && state.distinctSampleColorCount > 250 && state.sampledLumaRange > 100 && state.sampledEdgeMean > 4 && state.habitatProfileCount === PLOT_COUNT && state.profilePixelCount === SAMPLE_COUNT && state.habitatProfiles.every(profile => profile.pixelCount > 900 && profile.depth >= 5 && profile.depth <= 8 && profile.spread >= .34 && profile.spread <= .62 && profile.suitability >= 0 && profile.suitability <= 1 && profile.checksum > 0) && state.pixelEvidenceReady;
    const rendering = sketch instanceof p5 && state.p5InstanceReady && state.p5CanvasReady && sketch.width === stage.clientWidth && sketch.height === stage.clientHeight && state.p5CompletedDrawCount > 0 && state.p5ImageDrawCount > 0 && state.visibleBranchCount > 0 && state.visibleDepth >= 1 && state.potentialBranchCount >= state.visibleBranchCount && state.totalDrawnPathLength > 0 && state.regenerationCoverage > 0 && state.regenerationCoverage <= 1 && ['EARLY STAGE', 'REGENERATING', 'ESTABLISHED'].includes(state.regenerationVerdict) && state.currentCanvasSignature > 0;
    const interaction = state.inputCount === state.trustedInputCount && state.rejectedUntrustedInputCount === 0 && state.pointerCaptureReleaseCount <= state.pointerCaptureCount && state.pointerCaptureCount - state.pointerCaptureReleaseCount <= Number(state.pointerCaptured) && state.transitionRecords.every(record => record.trusted && record.before !== record.after) && (state.inputCount === 0 ? state.humanMutationCount === 0 && state.progress === INITIAL_PROGRESS && state.wind === INITIAL_WIND : state.lastInputTrusted === true && state.humanMutationCount > 0);
    return window.__PREVIEW_INTERACTION_STATE__ === state && stage.dataset.previewMechanism === 'p5-pixel-derived-recursive-forest-transect' && state.ready && state.userInputRequired && state.strictTrustedInputGuard && state.initialFrameStatic && state.initialStillVerified && state.initialCanvasSignature > 0 && !state.automaticCycle && !state.automaticPlayback && !state.automaticRehearsal && !state.automaticFallback && !state.syntheticInputDispatch && !state.captureClockDriven && state.previewClockMutationCount === 0 && state.renderIgnoresPreviewClock && assetEvidence && pixels && rendering && interaction;
  };
  installPreviewController({ id: state.id, library: state.claimedLibrary, renderer: 'canvas2d', render: () => { state.previewRenderCount += 1; if (dirty && state.ready) requestDraw('preview-manual-render'); }, ready });
  ready.catch(markPreviewFailure);
} catch (error) { markPreviewFailure(error); }
