import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#lens-stage');
  const surface = document.querySelector('#lens-surface');
  const scoreOutput = document.querySelector('#lens-score');
  const statusOutput = document.querySelector('#lens-status');
  const conclusionOutput = document.querySelector('#lens-conclusion');
  const evidenceOutput = document.querySelector('#lens-evidence');
  const strengthOutput = document.querySelector('#lens-strength');
  const ledger = document.querySelector('#runtime-ledger');
  const actionButtons = [...document.querySelectorAll('[data-lens-action]')];
  const assetUrl = new URL('../assets/aesthetic-wave-07/gravity-well-icon-field/deep-field-lensing-survey.jpg', import.meta.url).href;
  const expectedAssetSha256 = 'aa5095130a0a1424c6d43d95229728fd06a703beda30c5cb93b501f5be0c7c6a';
  const sourceCrop = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
  const sampleWidth = 160;
  const sampleHeight = 90;
  const samplePixelCount = sampleWidth * sampleHeight;
  const candidateGoal = 7;
  const initialLens = Object.freeze({ u: .655, v: .50 });
  const initialMass = 1.35;
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));

  const state = {
    id: 'gravity-well-icon-field',
    task: 'human-operated-deep-field-gravitational-lens-candidate-inspection',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'same-origin-image-pixels-drive-p5-gravity-lens-magnification-local-evidence-and-candidate-conclusion',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'visible-buttons'],
    userInputRequired: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    reducedMotion: reducedMotionQuery.matches,
    inputCount: 0,
    humanInputCausalityCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    lensMoveCount: 0,
    massAdjustmentCount: 0,
    lockCount: 0,
    resetCount: 0,
    rejectedUntrustedInputCount: 0,
    ignoredInputCount: 0,
    activePointerId: null,
    pointerCaptured: false,
    dragging: false,
    lastInputTrusted: null,
    lastInputKind: 'none',
    lastPointerType: 'none',
    lensU: initialLens.u,
    lensV: initialLens.v,
    lensMass: initialMass,
    initialLensU: initialLens.u,
    initialLensV: initialLens.v,
    initialLensMass: initialMass,
    maximumLensMass: initialMass,
    minimumLensMass: initialMass,
    dragStartU: 0,
    dragStartV: 0,
    dragDistance: 0,
    locked: false,
    lockedCandidateIndex: -1,
    nearestCandidateIndex: -1,
    currentScore: 0,
    maximumScore: 0,
    minimumScore: 100,
    currentEdgeEnergy: 0,
    currentBlueExcess: 0,
    currentStructure: 0,
    currentBrightDensity: 0,
    currentConclusion: 'Calibrating field',
    conclusionMutationCount: 0,
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
    p5ImageDecoded: false,
    p5ImageClass: null,
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    sourceCrop: { ...sourceCrop },
    sampledWidth: sampleWidth,
    sampledHeight: sampleHeight,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sampledPixelSha256: null,
    distinctSampleColorCount: 0,
    nonzeroSampleByteCount: 0,
    globalMeanLuma: 0,
    globalEdgeMean: 0,
    globalEdgeMaximum: 0,
    globalBlueMean: 0,
    candidateCount: 0,
    candidateCoordinateChecksum: 0,
    minimumCandidateScore: 0,
    maximumCandidateScore: 0,
    candidateEvidence: [],
    assetEvidenceReady: false,
    pixelEvidenceReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    renderCount: 0,
    resizeCount: 0,
    previewClockCallCount: 0,
    previewClockIgnoredCount: 0,
    previewClockMutationCount: 0,
    initialVisualStateChecksum: null,
    currentVisualStateChecksum: null,
    initialStaticConfirmationCount: 0,
    initialStaticConfirmed: false,
    animationSettled: true,
    runtimeAssertionPassed: false,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let surveyImage;
  let samplePixels;
  let luminance;
  let edgeEnergy;
  let blueExcess;
  let candidates = [];
  let currentEvidence = null;
  let resizeFrame = 0;
  let dirty = true;

  function invariant(condition, message) {
    if (!condition) throw new Error(`gravity-well-icon-field: ${message}`);
  }

  function fnvMix(checksum, value) {
    return Math.imul(checksum ^ (value >>> 0), 16777619) >>> 0;
  }

  function visualStateChecksum() {
    let checksum = 2166136261;
    checksum = fnvMix(checksum, Math.round(state.lensU * 10000));
    checksum = fnvMix(checksum, Math.round(state.lensV * 10000));
    checksum = fnvMix(checksum, Math.round(state.lensMass * 1000));
    checksum = fnvMix(checksum, state.locked ? 1 : 0);
    checksum = fnvMix(checksum, state.lockedCandidateIndex + 3);
    checksum = fnvMix(checksum, state.currentScore);
    return checksum >>> 0;
  }

  async function digestHex(bytes) {
    const exactBuffer = bytes instanceof ArrayBuffer
      ? bytes
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', exactBuffer))]
      .map(value => value.toString(16).padStart(2, '0')).join('');
  }

  async function fetchAndDecodeAsset() {
    const response = await fetch(assetUrl, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `survey asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === expectedAssetSha256;
    invariant(state.assetSameOrigin, 'survey image was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'survey image SHA-256 differs from the committed asset');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const browserImage = new Image();
    browserImage.src = objectUrl;
    try {
      await browserImage.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = browserImage.naturalWidth;
      state.sourceNaturalHeight = browserImage.naturalHeight;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    invariant(state.browserImageDecoded && state.sourceNaturalWidth === 960 && state.sourceNaturalHeight === 640,
      'browser-decoded survey image dimensions are not 960x640');
    state.assetEvidenceReady = true;
  }

  const assetReady = fetchAndDecodeAsset();

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(surface);
          canvas.elt.setAttribute('aria-hidden', 'true');
          p.noLoop();
          p.textFont('ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement
            && p.drawingContext instanceof CanvasRenderingContext2D;
          state.p5CanvasWidth = p.width;
          state.p5CanvasHeight = p.height;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.p5DrawCount += 1;
        if (!state.pixelEvidenceReady || !surveyImage) {
          p.background('#020307');
          return;
        }
        drawField(p);
        state.p5CompletedDrawCount += 1;
        dirty = false;
      };
    }, surface);
  });

  function loadP5Image() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(assetUrl, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  function sampleIndex(x, y) {
    const column = clamp(Math.round(x), 0, sampleWidth - 1);
    const row = clamp(Math.round(y), 0, sampleHeight - 1);
    return row * sampleWidth + column;
  }

  function analyseAt(u, v, radius = 8) {
    const centerX = u * (sampleWidth - 1);
    const centerY = v * (sampleHeight - 1);
    let edgeTotal = 0;
    let blueTotal = 0;
    let lumaTotal = 0;
    let lumaSquaredTotal = 0;
    let brightCount = 0;
    let count = 0;
    const radiusSquared = radius * radius;
    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        if (offsetX * offsetX + offsetY * offsetY > radiusSquared) continue;
        const index = sampleIndex(centerX + offsetX, centerY + offsetY);
        const pixelLuma = luminance[index];
        edgeTotal += edgeEnergy[index];
        blueTotal += blueExcess[index];
        lumaTotal += pixelLuma;
        lumaSquaredTotal += pixelLuma * pixelLuma;
        if (pixelLuma > .38) brightCount += 1;
        count += 1;
      }
    }
    const meanLuma = lumaTotal / count;
    const structure = Math.sqrt(Math.max(0, lumaSquaredTotal / count - meanLuma ** 2));
    const meanEdge = edgeTotal / count;
    const meanBlue = blueTotal / count;
    const brightDensity = brightCount / count;
    const edgeSignal = clamp(meanEdge / Math.max(.015, state.globalEdgeMean * 2.8));
    const blueSignal = clamp(meanBlue / Math.max(.008, state.globalBlueMean * 4.5));
    const structureSignal = clamp(structure / .19);
    const densitySignal = clamp(brightDensity / .18);
    const score = Math.round(clamp(edgeSignal * .43 + blueSignal * .27 + structureSignal * .2 + densitySignal * .1) * 100);
    let conclusion = 'Quiet reference field';
    if (score >= 62) conclusion = 'Probable lensing arc';
    else if (score >= 48) conclusion = 'Review clustered source';
    else if (score >= 34) conclusion = 'Weak shear signature';
    return {
      score,
      edge: edgeSignal,
      blue: blueSignal,
      structure: structureSignal,
      brightDensity: densitySignal,
      meanLuma,
      conclusion
    };
  }

  function buildCandidates() {
    const proposals = [];
    for (let y = 14; y < sampleHeight - 12; y += 3) {
      for (let x = 16; x < sampleWidth - 15; x += 3) {
        const evidence = analyseAt(x / (sampleWidth - 1), y / (sampleHeight - 1), 6);
        proposals.push({
          u: x / (sampleWidth - 1),
          v: y / (sampleHeight - 1),
          ...evidence
        });
      }
    }
    proposals.sort((a, b) => b.score - a.score || b.blue - a.blue || a.u - b.u);
    candidates = [];
    for (const proposal of proposals) {
      if (candidates.every(candidate => Math.hypot(candidate.u - proposal.u, candidate.v - proposal.v) > .145)) {
        candidates.push({ ...proposal, index: candidates.length });
      }
      if (candidates.length === candidateGoal) break;
    }
    invariant(candidates.length === candidateGoal, `expected ${candidateGoal} separated pixel-derived candidates`);
    let coordinateChecksum = 2166136261;
    candidates.forEach(candidate => {
      coordinateChecksum = fnvMix(coordinateChecksum, Math.round(candidate.u * 10000));
      coordinateChecksum = fnvMix(coordinateChecksum, Math.round(candidate.v * 10000));
      coordinateChecksum = fnvMix(coordinateChecksum, candidate.score);
    });
    state.candidateCount = candidates.length;
    state.candidateCoordinateChecksum = coordinateChecksum;
    state.minimumCandidateScore = Math.min(...candidates.map(candidate => candidate.score));
    state.maximumCandidateScore = Math.max(...candidates.map(candidate => candidate.score));
    state.candidateEvidence = candidates.map(candidate => ({
      index: candidate.index,
      u: Number(candidate.u.toFixed(4)),
      v: Number(candidate.v.toFixed(4)),
      score: candidate.score,
      edge: Number(candidate.edge.toFixed(4)),
      blue: Number(candidate.blue.toFixed(4)),
      conclusion: candidate.conclusion
    }));
  }

  async function preparePixelEvidence() {
    await Promise.all([assetReady, p5Ready]);
    surveyImage = await loadP5Image();
    state.p5ImageDecoded = surveyImage instanceof p5.Image;
    state.p5ImageClass = state.p5ImageDecoded ? 'p5.Image' : null;
    state.p5ImageWidth = surveyImage.width;
    state.p5ImageHeight = surveyImage.height;
    surveyImage.loadPixels();
    state.p5ImagePixelLength = surveyImage.pixels.length;
    invariant(state.p5ImageDecoded && surveyImage.width === 960 && surveyImage.height === 640
      && surveyImage.pixels.length === 960 * 640 * 4, 'p5 did not decode the committed 960x640 survey image');

    samplePixels = new Uint8Array(samplePixelCount * 4);
    luminance = new Float32Array(samplePixelCount);
    edgeEnergy = new Float32Array(samplePixelCount);
    blueExcess = new Float32Array(samplePixelCount);
    const distinctColors = new Set();
    let lumaTotal = 0;
    let blueTotal = 0;
    let nonzeroBytes = 0;
    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const sourceX = Math.min(959, Math.floor((x + .5) / sampleWidth * sourceCrop.width));
        const sourceY = Math.min(639, Math.floor(sourceCrop.y + (y + .5) / sampleHeight * sourceCrop.height));
        const sourceOffset = (sourceY * surveyImage.width + sourceX) * 4;
        const targetIndex = y * sampleWidth + x;
        const targetOffset = targetIndex * 4;
        const red = surveyImage.pixels[sourceOffset];
        const green = surveyImage.pixels[sourceOffset + 1];
        const blue = surveyImage.pixels[sourceOffset + 2];
        samplePixels[targetOffset] = red;
        samplePixels[targetOffset + 1] = green;
        samplePixels[targetOffset + 2] = blue;
        samplePixels[targetOffset + 3] = surveyImage.pixels[sourceOffset + 3];
        for (let channel = 0; channel < 4; channel += 1) {
          if (samplePixels[targetOffset + channel] !== 0) nonzeroBytes += 1;
        }
        const pixelLuma = (red * .2126 + green * .7152 + blue * .0722) / 255;
        const pixelBlue = Math.max(0, blue - (red + green) * .5) / 255;
        luminance[targetIndex] = pixelLuma;
        blueExcess[targetIndex] = pixelBlue;
        lumaTotal += pixelLuma;
        blueTotal += pixelBlue;
        distinctColors.add(`${red >> 3},${green >> 3},${blue >> 3}`);
      }
    }

    let edgeTotal = 0;
    let edgeMaximum = 0;
    for (let y = 1; y < sampleHeight - 1; y += 1) {
      for (let x = 1; x < sampleWidth - 1; x += 1) {
        const index = y * sampleWidth + x;
        const gradientX = luminance[index + 1] - luminance[index - 1];
        const gradientY = luminance[index + sampleWidth] - luminance[index - sampleWidth];
        const energy = Math.hypot(gradientX, gradientY) * .5;
        edgeEnergy[index] = energy;
        edgeTotal += energy;
        edgeMaximum = Math.max(edgeMaximum, energy);
      }
    }
    state.sampledPixelCount = samplePixelCount;
    state.sampledByteLength = samplePixels.byteLength;
    state.sampledPixelSha256 = await digestHex(samplePixels);
    state.distinctSampleColorCount = distinctColors.size;
    state.nonzeroSampleByteCount = nonzeroBytes;
    state.globalMeanLuma = lumaTotal / samplePixelCount;
    state.globalEdgeMean = edgeTotal / ((sampleWidth - 2) * (sampleHeight - 2));
    state.globalEdgeMaximum = edgeMaximum;
    state.globalBlueMean = blueTotal / samplePixelCount;
    invariant(state.sampledPixelCount === 14400 && state.sampledByteLength === 57600,
      'the visible survey crop was not sampled at 160x90 RGBA');
    invariant(state.nonzeroSampleByteCount > samplePixelCount && state.distinctSampleColorCount > 120,
      'sampled survey pixels do not contain useful image evidence');
    invariant(/^[a-f0-9]{64}$/.test(state.sampledPixelSha256), 'sampled pixel evidence hash is missing');

    state.pixelEvidenceReady = true;
    buildCandidates();
    updateEvidence(false);
    state.initialVisualStateChecksum = visualStateChecksum();
    state.currentVisualStateChecksum = state.initialVisualStateChecksum;
    state.initialStaticConfirmationCount += 1;
    state.initialStaticConfirmed = true;
  }

  function nearestCandidateIndex() {
    let nearest = -1;
    let nearestDistance = Infinity;
    candidates.forEach((candidate, index) => {
      const distance = Math.hypot(candidate.u - state.lensU, candidate.v - state.lensV);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });
    return nearest;
  }

  function updateEvidence(countMutation = true) {
    if (!state.pixelEvidenceReady) return;
    const previousConclusion = state.currentConclusion;
    const radius = Math.round(7 + (state.lensMass - 1.05) * 5.5);
    currentEvidence = analyseAt(state.lensU, state.lensV, radius);
    state.nearestCandidateIndex = nearestCandidateIndex();
    state.currentScore = currentEvidence.score;
    state.maximumScore = Math.max(state.maximumScore, currentEvidence.score);
    state.minimumScore = Math.min(state.minimumScore, currentEvidence.score);
    state.currentEdgeEnergy = currentEvidence.edge;
    state.currentBlueExcess = currentEvidence.blue;
    state.currentStructure = currentEvidence.structure;
    state.currentBrightDensity = currentEvidence.brightDensity;
    state.currentConclusion = currentEvidence.conclusion;
    if (countMutation && previousConclusion !== state.currentConclusion) state.conclusionMutationCount += 1;
    state.currentVisualStateChecksum = visualStateChecksum();
    syncInterface();
    dirty = true;
  }

  function syncInterface() {
    if (!currentEvidence) return;
    const compactConclusions = {
      'Probable lensing arc': stage.clientWidth < 210 ? 'Arc' : 'Probable arc',
      'Review clustered source': stage.clientWidth < 210 ? 'Cluster' : 'Clustered source',
      'Weak shear signature': stage.clientWidth < 210 ? 'Shear' : 'Weak shear',
      'Quiet reference field': stage.clientWidth < 210 ? 'Quiet' : 'Quiet field'
    };
    scoreOutput.textContent = String(currentEvidence.score).padStart(2, '0');
    statusOutput.textContent = state.locked ? `Candidate ${String(state.lockedCandidateIndex + 1).padStart(2, '0')} locked` : 'Live aperture sample';
    conclusionOutput.textContent = stage.clientWidth < 420
      ? compactConclusions[currentEvidence.conclusion]
      : currentEvidence.conclusion;
    evidenceOutput.textContent = `${currentEvidence.edge.toFixed(2)} edge · ${currentEvidence.blue.toFixed(2)} blue`;
    strengthOutput.textContent = `${state.lensMass.toFixed(2)}× mass`;
    surface.setAttribute('aria-label', `${currentEvidence.conclusion}, score ${currentEvidence.score}. Lens mass ${state.lensMass.toFixed(2)}. Move or drag to inspect; release or press Enter to lock.`);
    ledger.value = JSON.stringify({
      u: Number(state.lensU.toFixed(4)),
      v: Number(state.lensV.toFixed(4)),
      score: state.currentScore,
      edge: Number(state.currentEdgeEnergy.toFixed(4)),
      blue: Number(state.currentBlueExcess.toFixed(4)),
      locked: state.locked,
      candidate: state.lockedCandidateIndex,
      input: state.lastInputKind
    });
  }

  function drawCandidateMarker(p, candidate, index, scale) {
    const x = candidate.u * p.width;
    const y = candidate.v * p.height;
    const nearest = index === state.nearestCandidateIndex;
    const locked = state.locked && index === state.lockedCandidateIndex;
    const diameter = (locked ? 12 : nearest ? 9 : 6) * scale;
    p.push();
    p.translate(x, y);
    p.noFill();
    p.stroke(locked ? '#f9d489' : nearest ? '#bff4ff' : '#dcecff80');
    p.strokeWeight((locked ? 1.2 : .65) * scale);
    p.circle(0, 0, diameter);
    p.line(-diameter * .72, 0, -diameter * .42, 0);
    p.line(diameter * .42, 0, diameter * .72, 0);
    p.line(0, -diameter * .72, 0, -diameter * .42);
    p.line(0, diameter * .42, 0, diameter * .72);
    if (scale > .56) {
      p.noStroke();
      p.fill(locked ? '#f9d489' : '#d9f7ff');
      p.textAlign(p.LEFT, p.CENTER);
      p.textStyle(p.BOLD);
      p.textSize(3.3 * scale);
      p.text(`C${index + 1} · ${candidate.score}`, diameter * .62, -diameter * .5);
    }
    p.pop();
  }

  function drawGravityLens(p, scale) {
    const x = state.lensU * p.width;
    const y = state.lensV * p.height;
    const radius = (25 + (state.lensMass - 1.05) * 15) * scale;
    const sourceCenterX = sourceCrop.x + state.lensU * sourceCrop.width;
    const sourceCenterY = sourceCrop.y + state.lensV * sourceCrop.height;
    const sourceHalfWidth = radius / p.width * sourceCrop.width / state.lensMass;
    const sourceHalfHeight = radius / p.height * sourceCrop.height / state.lensMass;
    const context = p.drawingContext;

    context.save();
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.clip();
    p.image(
      surveyImage,
      x - radius,
      y - radius,
      radius * 2,
      radius * 2,
      sourceCenterX - sourceHalfWidth,
      sourceCenterY - sourceHalfHeight,
      sourceHalfWidth * 2,
      sourceHalfHeight * 2
    );
    p.noStroke();
    p.fill(112, 211, 255, 8 + currentEvidence.blue * 20);
    p.circle(x, y, radius * 2);
    context.restore();

    p.noFill();
    for (let ring = 0; ring < 4; ring += 1) {
      const orbit = radius + (ring + 1) * 4.2 * scale;
      const alpha = Math.round(92 - ring * 17 + currentEvidence.edge * 45);
      p.stroke(ring === 0 ? `rgba(191,244,255,${alpha / 255})` : `rgba(122,178,210,${alpha / 255})`);
      p.strokeWeight((ring === 0 ? 1.1 : .45) * scale);
      p.arc(x, y, orbit * 2, orbit * (1.74 + ring * .04), -.94 + ring * .36, 1.18 + ring * .28);
      p.arc(x, y, orbit * 2, orbit * (1.74 + ring * .04), 2.12 + ring * .27, 4.20 + ring * .24);
    }

    p.stroke(state.locked ? '#f9d489' : '#d9f8ff');
    p.strokeWeight(.75 * scale);
    const cross = 5.5 * scale;
    p.line(x - cross, y, x + cross, y);
    p.line(x, y - cross, x, y + cross);
    p.noStroke();
    p.fill(state.locked ? '#f9d489' : '#d9f8ff');
    p.circle(x, y, 2.3 * scale);

    const arcAlpha = 80 + currentEvidence.blue * 150;
    p.noFill();
    p.stroke(`rgba(118,226,255,${arcAlpha / 255})`);
    p.strokeWeight((1 + currentEvidence.edge * 1.1) * scale);
    p.arc(x, y, radius * 1.58, radius * 1.58, -.8, -.8 + .5 + currentEvidence.blue * 1.25);
    p.stroke('#f4c87a9c');
    p.arc(x, y, radius * 1.42, radius * 1.42, 2.02, 2.22 + currentEvidence.structure * .95);
  }

  function drawField(p) {
    p.clear();
    p.image(surveyImage, 0, 0, p.width, p.height, sourceCrop.x, sourceCrop.y, sourceCrop.width, sourceCrop.height);
    p.noStroke();
    p.fill(1, 5, 15, 20);
    p.rect(0, 0, p.width, p.height);
    const scale = Math.max(.35, Math.min(p.width / 320, p.height / 180));
    candidates.forEach((candidate, index) => drawCandidateMarker(p, candidate, index, scale));
    drawGravityLens(p, scale);
  }

  function recordTrustedInput(event, kind) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = kind;
    if ('pointerType' in event && event.pointerType) state.lastPointerType = event.pointerType;
    return true;
  }

  function pointerCoordinates(event) {
    const bounds = surface.getBoundingClientRect();
    return {
      u: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), .09, .91),
      v: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), .13, .87)
    };
  }

  function moveLens(u, v, inputKind) {
    if (!state.pixelEvidenceReady) {
      state.ignoredInputCount += 1;
      return;
    }
    const changed = Math.abs(state.lensU - u) > .0001 || Math.abs(state.lensV - v) > .0001;
    state.lensU = u;
    state.lensV = v;
    state.locked = false;
    state.lockedCandidateIndex = -1;
    if (changed) {
      state.lensMoveCount += 1;
      state.humanInputCausalityCount += 1;
      if (inputKind === 'drag') state.dragMutationCount += 1;
      if (inputKind === 'hover') state.hoverMutationCount += 1;
    }
    updateEvidence();
  }

  function lockCurrentCandidate() {
    if (!state.pixelEvidenceReady) return;
    const index = nearestCandidateIndex();
    const candidate = candidates[index];
    state.lensU = candidate.u;
    state.lensV = candidate.v;
    state.locked = true;
    state.lockedCandidateIndex = index;
    state.lockCount += 1;
    state.humanInputCausalityCount += 1;
    updateEvidence();
  }

  function adjustMass(delta) {
    const next = clamp(state.lensMass + delta, 1.05, 1.85);
    if (Math.abs(next - state.lensMass) < .001) return;
    state.lensMass = Number(next.toFixed(2));
    state.maximumLensMass = Math.max(state.maximumLensMass, state.lensMass);
    state.minimumLensMass = Math.min(state.minimumLensMass, state.lensMass);
    state.massAdjustmentCount += 1;
    state.humanInputCausalityCount += 1;
    updateEvidence();
  }

  function resetLens() {
    state.lensU = initialLens.u;
    state.lensV = initialLens.v;
    state.lensMass = initialMass;
    state.locked = false;
    state.lockedCandidateIndex = -1;
    state.resetCount += 1;
    state.humanInputCausalityCount += 1;
    updateEvidence();
  }

  surface.addEventListener('pointerenter', event => {
    if (!recordTrustedInput(event, 'pointer-hover')) return;
    state.pointerEnterCount += 1;
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      const point = pointerCoordinates(event);
      moveLens(point.u, point.v, 'hover');
    }
  });

  surface.addEventListener('pointerdown', event => {
    if (!recordTrustedInput(event, 'pointer-drag-start')) return;
    event.preventDefault();
    surface.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    state.dragging = true;
    state.pointerCaptured = true;
    state.pointerCaptureCount += 1;
    surface.setPointerCapture(event.pointerId);
    const point = pointerCoordinates(event);
    state.dragStartU = point.u;
    state.dragStartV = point.v;
    state.dragDistance = 0;
    moveLens(point.u, point.v, 'drag');
  });

  surface.addEventListener('pointermove', event => {
    const isActiveDrag = state.dragging && state.activePointerId === event.pointerId;
    const isMouseHover = !state.dragging && event.pointerType === 'mouse' && event.buttons === 0;
    if (!isActiveDrag && !isMouseHover) return;
    if (!recordTrustedInput(event, isActiveDrag ? 'pointer-drag' : 'pointer-hover')) return;
    state.pointerMoveCount += 1;
    const point = pointerCoordinates(event);
    if (isActiveDrag) {
      state.dragDistance = Math.max(state.dragDistance, Math.hypot(point.u - state.dragStartU, point.v - state.dragStartV));
    }
    moveLens(point.u, point.v, isActiveDrag ? 'drag' : 'hover');
  });

  function releasePointer(event, cancelled = false) {
    if (state.activePointerId !== event.pointerId) return;
    if (!recordTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-release-lock')) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (state.pointerCaptured && surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.pointerCaptured = false;
    state.dragging = false;
    state.activePointerId = null;
    if (!cancelled) lockCurrentCandidate();
  }

  surface.addEventListener('pointerup', event => releasePointer(event));
  surface.addEventListener('pointercancel', event => releasePointer(event, true));

  surface.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft: [-.045, 0],
      ArrowRight: [.045, 0],
      ArrowUp: [0, -.06],
      ArrowDown: [0, .06]
    }[event.key];
    const action = {
      Enter: 'lock',
      ' ': 'lock',
      '[': 'weaker',
      '-': 'weaker',
      ']': 'stronger',
      '+': 'stronger',
      '=': 'stronger',
      Escape: 'reset',
      Home: 'reset'
    }[event.key];
    if (!movement && !action) return;
    if (!recordTrustedInput(event, movement ? 'keyboard-move' : `keyboard-${action}`)) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (movement) {
      moveLens(
        clamp(state.lensU + movement[0], .09, .91),
        clamp(state.lensV + movement[1], .13, .87),
        'keyboard'
      );
    } else if (action === 'lock') lockCurrentCandidate();
    else if (action === 'weaker') adjustMass(-.1);
    else if (action === 'stronger') adjustMass(.1);
    else resetLens();
  });

  actionButtons.forEach(button => {
    button.addEventListener('click', event => {
      const action = button.dataset.lensAction;
      if (!recordTrustedInput(event, `button-${action}`)) return;
      state.buttonActivationCount += 1;
      if (action === 'lock') lockCurrentCandidate();
      else if (action === 'weaker') adjustMass(-.1);
      else if (action === 'stronger') adjustMass(.1);
      else resetLens();
    });
  });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch || sketch.width === stage.clientWidth && sketch.height === stage.clientHeight) return;
      sketch.resizeCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight), true);
      state.p5CanvasWidth = sketch.width;
      state.p5CanvasHeight = sketch.height;
      state.resizeCount += 1;
      dirty = true;
      syncInterface();
      sketch.redraw();
    });
  });
  resizeObserver.observe(stage);

  const ready = preparePixelEvidence().then(() => {
    state.ready = true;
    dirty = true;
    sketch.redraw();
  });

  function runtimeAssertion() {
    state.runtimeAssertionPassed = Boolean(
      sketch instanceof p5
      && state.p5CanvasReady
      && state.assetEvidenceReady
      && state.pixelEvidenceReady
      && state.assetShaMatchesExpected
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImagePixelLength === 960 * 640 * 4
      && state.sampledPixelCount === samplePixelCount
      && state.sampledByteLength === samplePixelCount * 4
      && state.distinctSampleColorCount > 120
      && state.candidateCount === candidateGoal
      && state.candidateCoordinateChecksum > 0
      && state.initialStaticConfirmed
      && state.previewClockMutationCount === 0
      && state.automaticPlayback === false
      && state.syntheticInputDispatch === false
      && state.p5CompletedDrawCount > 0
    );
    return state.runtimeAssertionPassed;
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = runtimeAssertion;

  installPreviewController({
    id: 'gravity-well-icon-field',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    ready,
    render: (_time, manualClock = false) => {
      state.renderCount += 1;
      if (manualClock) state.previewClockCallCount += 1;
      state.previewClockIgnoredCount += 1;
      if (dirty && state.pixelEvidenceReady) sketch.redraw();
    }
  });
} catch (error) {
  markPreviewFailure(error);
}
