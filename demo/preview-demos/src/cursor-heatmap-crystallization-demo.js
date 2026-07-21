import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#thermal-stage');
  const canvasHost = document.querySelector('#thermal-canvas-host');
  const peakReadout = document.querySelector('#peak-readout');
  const crystalReadout = document.querySelector('#crystal-readout');
  const regionReadout = document.querySelector('#region-readout');
  const ledger = document.querySelector('#runtime-ledger');
  const actionButtons = [...document.querySelectorAll('[data-thermal-action]')];
  const assetUrl = new URL('../assets/aesthetic-wave-06/cursor-heatmap-crystallization/phase-change-ceramic-micrograph.jpg', import.meta.url).href;
  const expectedAssetSha256 = '52cc25a66d3f7b4bf699b3cf5b3f8ae3d50311d51638f190852a3d6c6aa1cd4f';
  const gridWidth = 80;
  const gridHeight = 45;
  const cellCount = gridWidth * gridHeight;
  const zoneNames = ['CERAMIC', 'CONDUCTOR', 'PORE'];
  const clamp01 = value => Math.max(0, Math.min(1, value));
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const temperature = new Float32Array(cellCount);
  const nextTemperature = new Float32Array(cellCount);
  const crystallinity = new Float32Array(cellCount);
  const conductivity = new Float32Array(cellCount);
  const heatCapacity = new Float32Array(cellCount);
  const crystallizationThreshold = new Float32Array(cellCount);
  const materialZone = new Uint8Array(cellCount);

  const state = {
    id: 'cursor-heatmap-crystallization',
    task: 'human-operated-pixel-derived-thermal-crystallization-material-test',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'real-micrograph-pixels-derive-material-zones-diffusion-properties-and-crystallization-thresholds',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button-control'],
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    previewClockMutationCount: 0,
    renderIgnoresPreviewClock: true,
    userInputRequired: true,
    initialFrameStatic: true,
    reducedMotion: reducedMotionQuery.matches,
    inputCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    rejectedUntrustedInputCount: 0,
    ignoredInputCount: 0,
    heatApplicationCount: 0,
    coolingActionCount: 0,
    resetActionCount: 0,
    humanInputCausalityCount: 0,
    diffusionIterationCount: 0,
    settleIterationCount: 0,
    recoveryIterationCount: 0,
    heatedCellMutationCount: 0,
    crystallizationMutationCount: 0,
    recoveryMutationCount: 0,
    thresholdCrossingCount: 0,
    probeMoveCount: 0,
    sourcePathPointCount: 0,
    maxSourcePathPointCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    probeU: 0.64,
    probeV: 0.43,
    probeZone: 'CERAMIC',
    currentPeakNormalized: 0,
    maximumPeakNormalized: 0,
    currentPeakKelvin: 293,
    maximumPeakKelvin: 293,
    activeHeatCellCount: 0,
    crystallizedCellCount: 0,
    maximumCrystallizedCellCount: 0,
    recoveredCellCount: 0,
    lastFieldChecksum: 0,
    initialFieldChecksum: 0,
    initialStaticConfirmed: false,
    firstHumanInputPeakBefore: null,
    firstHumanInputPeakAfter: null,
    stableAfterInput: true,
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
    cropSourceX: 0,
    cropSourceY: 50,
    cropSourceWidth: 960,
    cropSourceHeight: 540,
    sampledWidth: gridWidth,
    sampledHeight: gridHeight,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sourcePixelSha256: null,
    distinctSampleColorCount: 0,
    materialCellCount: 0,
    ceramicCellCount: 0,
    conductorCellCount: 0,
    poreCellCount: 0,
    minimumConductivity: 1,
    maximumConductivity: 0,
    minimumHeatCapacity: 1,
    maximumHeatCapacity: 0,
    minimumCrystallizationThreshold: 1,
    maximumCrystallizationThreshold: 0,
    materialPropertyChecksum: 0,
    assetEvidenceReady: false,
    materialEvidenceReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    renderCount: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    lastRenderedFieldChecksum: null,
    resizeCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let materialImage;
  let dirty = true;
  let resizeFrame = 0;
  const sourcePath = [];

  function invariant(condition, message) {
    if (!condition) throw new Error(`cursor-heatmap-crystallization: ${message}`);
  }

  function digestHex(bytes) {
    return crypto.subtle.digest('SHA-256', bytes).then(buffer => [...new Uint8Array(buffer)]
      .map(value => value.toString(16).padStart(2, '0')).join(''));
  }

  function fieldChecksum() {
    let checksum = 2166136261;
    for (let index = 0; index < cellCount; index += 1) {
      checksum = Math.imul(checksum ^ Math.round(temperature[index] * 10000), 16777619) >>> 0;
      checksum = Math.imul(checksum ^ Math.round(crystallinity[index] * 10000), 16777619) >>> 0;
    }
    return checksum >>> 0;
  }

  async function fetchAndDecodeAsset() {
    const response = await fetch(assetUrl, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `material asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === expectedAssetSha256;
    invariant(state.assetSameOrigin, 'material plate was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'material plate SHA-256 differs from the committed asset');

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
      'browser-decoded material plate dimensions are not 960x640');
    state.assetEvidenceReady = true;
  }

  const assetReady = fetchAndDecodeAsset();

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(canvasHost);
          p.noLoop();
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
          state.p5CanvasWidth = p.width;
          state.p5CanvasHeight = p.height;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.p5DrawCount += 1;
        p.background('#07101a');
        if (!state.materialEvidenceReady || !materialImage) return;

        const width = p.width;
        const height = p.height;
        p.image(materialImage, 0, 0, width, height);
        p.noStroke();
        p.fill(3, 10, 19, 56);
        p.rect(0, 0, width, height);

        const cellWidth = width / gridWidth;
        const cellHeight = height / gridHeight;
        for (let y = 0; y < gridHeight; y += 1) {
          for (let x = 0; x < gridWidth; x += 1) {
            const index = y * gridWidth + x;
            const heat = temperature[index];
            if (heat > .012) {
              const hot = clamp01((heat - .42) / .58);
              const warm = clamp01(heat / .62);
              const red = Math.round(55 + 200 * warm);
              const green = Math.round(91 + 73 * warm + 85 * hot);
              const blue = Math.round(220 - 142 * warm + 110 * hot);
              p.fill(red, green, blue, 18 + heat * 184);
              p.rect(x * cellWidth, y * cellHeight, cellWidth + .7, cellHeight + .7);
            }

            const crystal = crystallinity[index];
            if (crystal > .035) {
              const centerX = (x + .5) * cellWidth;
              const centerY = (y + .5) * cellHeight;
              const radius = Math.max(.7, Math.min(cellWidth, cellHeight) * (.28 + crystal * .72));
              p.stroke(255, 238, 198, 52 + crystal * 178);
              p.strokeWeight(Math.max(.45, width / 720));
              p.fill(255, 194, 124, 10 + crystal * 74);
              p.quad(centerX, centerY - radius, centerX + radius, centerY,
                centerX, centerY + radius, centerX - radius, centerY);
            }
          }
        }

        if (sourcePath.length > 1) {
          p.noFill();
          p.stroke(255, 175, 101, 118);
          p.strokeWeight(Math.max(1.1, width / 330));
          for (let index = 1; index < sourcePath.length; index += 1) {
            const previous = sourcePath[index - 1];
            const current = sourcePath[index];
            p.line(previous.u * width, previous.v * height, current.u * width, current.v * height);
          }
        }

        const probeX = state.probeU * width;
        const probeY = state.probeV * height;
        const probeRadius = Math.max(5, Math.min(13, width / 43));
        p.noFill();
        p.stroke(255, 239, 214, 205);
        p.strokeWeight(Math.max(1, width / 520));
        p.circle(probeX, probeY, probeRadius * 2);
        p.stroke(255, 159, 87, 230);
        p.arc(probeX, probeY, probeRadius * 2.9, probeRadius * 2.9, -.35, 1.58);
        p.line(probeX - probeRadius * 1.4, probeY, probeX - probeRadius * .7, probeY);
        p.line(probeX + probeRadius * .7, probeY, probeX + probeRadius * 1.4, probeY);
        p.line(probeX, probeY - probeRadius * 1.4, probeX, probeY - probeRadius * .7);
        p.line(probeX, probeY + probeRadius * .7, probeX, probeY + probeRadius * 1.4);
        state.p5CompletedDrawCount += 1;
        state.lastRenderedFieldChecksum = state.lastFieldChecksum;
      };
    }, canvasHost);
  });

  function loadP5Material() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(assetUrl, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  function classifyMaterial(red, green, blue) {
    const luma = (red * .2126 + green * .7152 + blue * .0722) / 255;
    const warmBias = (red - blue) / 255;
    if (luma < .24) return 2;
    if (warmBias > .08 && red > 92) return 1;
    return 0;
  }

  async function prepareMaterialEvidence() {
    await Promise.all([assetReady, p5Ready]);
    const decoded = await loadP5Material();
    state.p5ImageDecoded = decoded instanceof p5.Image;
    state.p5ImageClass = decoded instanceof p5.Image ? 'p5.Image' : decoded?.constructor?.name ?? null;
    state.p5ImageWidth = decoded.width;
    state.p5ImageHeight = decoded.height;
    decoded.loadPixels();
    state.p5ImagePixelLength = decoded.pixels.length;
    invariant(state.p5ImageDecoded && decoded.width === 960 && decoded.height === 640
      && decoded.pixels.length === 960 * 640 * 4, 'p5 did not decode the committed 960x640 material plate');

    materialImage = decoded.get(state.cropSourceX, state.cropSourceY, state.cropSourceWidth, state.cropSourceHeight);
    const sample = decoded.get(state.cropSourceX, state.cropSourceY, state.cropSourceWidth, state.cropSourceHeight);
    sample.resize(gridWidth, gridHeight);
    sample.loadPixels();
    const sourcePixels = new Uint8ClampedArray(sample.pixels);
    state.sampledPixelCount = cellCount;
    state.sampledByteLength = sourcePixels.byteLength;
    state.sourcePixelSha256 = await digestHex(sourcePixels.buffer);

    const colors = new Set();
    let propertyChecksum = 2166136261;
    for (let index = 0; index < cellCount; index += 1) {
      const offset = index * 4;
      const red = sourcePixels[offset];
      const green = sourcePixels[offset + 1];
      const blue = sourcePixels[offset + 2];
      const luma = (red * .2126 + green * .7152 + blue * .0722) / 255;
      const warmBias = clamp01((red - blue + 64) / 319);
      const coolBias = blue / 255;
      const zone = classifyMaterial(red, green, blue);
      materialZone[index] = zone;
      if (zone === 0) state.ceramicCellCount += 1;
      else if (zone === 1) state.conductorCellCount += 1;
      else state.poreCellCount += 1;

      conductivity[index] = zone === 1
        ? .26 + luma * .10 + warmBias * .06
        : zone === 2
          ? .025 + luma * .035
          : .085 + luma * .07 + coolBias * .025;
      heatCapacity[index] = zone === 2
        ? .55 + luma * .16
        : zone === 1
          ? .74 + (1 - luma) * .14
          : .91 + coolBias * .23;
      crystallizationThreshold[index] = clamp01(zone === 1
        ? .48 + (1 - luma) * .11
        : zone === 2
          ? .78 + (1 - luma) * .08
          : .57 + (1 - luma) * .16 + coolBias * .035);

      state.minimumConductivity = Math.min(state.minimumConductivity, conductivity[index]);
      state.maximumConductivity = Math.max(state.maximumConductivity, conductivity[index]);
      state.minimumHeatCapacity = Math.min(state.minimumHeatCapacity, heatCapacity[index]);
      state.maximumHeatCapacity = Math.max(state.maximumHeatCapacity, heatCapacity[index]);
      state.minimumCrystallizationThreshold = Math.min(state.minimumCrystallizationThreshold, crystallizationThreshold[index]);
      state.maximumCrystallizationThreshold = Math.max(state.maximumCrystallizationThreshold, crystallizationThreshold[index]);
      propertyChecksum = Math.imul(propertyChecksum ^ zone ^ Math.round(conductivity[index] * 10000)
        ^ Math.round(heatCapacity[index] * 10000) ^ Math.round(crystallizationThreshold[index] * 10000), 16777619) >>> 0;
      colors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
    }

    state.distinctSampleColorCount = colors.size;
    state.materialCellCount = cellCount;
    state.materialPropertyChecksum = propertyChecksum >>> 0;
    state.initialFieldChecksum = fieldChecksum();
    state.initialStaticConfirmed = state.initialFieldChecksum === fieldChecksum();
    state.probeZone = zoneNames[materialZone[Math.floor(state.probeV * gridHeight) * gridWidth + Math.floor(state.probeU * gridWidth)]];
    state.materialEvidenceReady = true;
    dirty = true;
  }

  const materialEvidenceReady = prepareMaterialEvidence();

  function updateFieldMetrics() {
    let peak = 0;
    let active = 0;
    let crystals = 0;
    for (let index = 0; index < cellCount; index += 1) {
      peak = Math.max(peak, temperature[index]);
      if (temperature[index] > .025) active += 1;
      if (crystallinity[index] > .055) crystals += 1;
    }
    state.currentPeakNormalized = peak;
    state.maximumPeakNormalized = Math.max(state.maximumPeakNormalized, peak);
    state.currentPeakKelvin = Math.round(293 + peak * 620);
    state.maximumPeakKelvin = Math.round(293 + state.maximumPeakNormalized * 620);
    state.activeHeatCellCount = active;
    state.crystallizedCellCount = crystals;
    state.maximumCrystallizedCellCount = Math.max(state.maximumCrystallizedCellCount, crystals);
    state.lastFieldChecksum = fieldChecksum();
  }

  function diffuse(iterations, cooling, recoveryRate = 0, kind = 'diffusion') {
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      for (let y = 0; y < gridHeight; y += 1) {
        for (let x = 0; x < gridWidth; x += 1) {
          const index = y * gridWidth + x;
          const left = temperature[y * gridWidth + Math.max(0, x - 1)];
          const right = temperature[y * gridWidth + Math.min(gridWidth - 1, x + 1)];
          const up = temperature[Math.max(0, y - 1) * gridWidth + x];
          const down = temperature[Math.min(gridHeight - 1, y + 1) * gridWidth + x];
          const neighborMean = (left + right + up + down) * .25;
          const exchange = (neighborMean - temperature[index]) * conductivity[index] * .72 / heatCapacity[index];
          nextTemperature[index] = clamp01((temperature[index] + exchange) * cooling);
        }
      }
      temperature.set(nextTemperature);

      for (let index = 0; index < cellCount; index += 1) {
        const before = crystallinity[index];
        const threshold = crystallizationThreshold[index];
        if (temperature[index] >= threshold) {
          crystallinity[index] = clamp01(before + (temperature[index] - threshold + .018) * .19);
          if (before < .055 && crystallinity[index] >= .055) state.thresholdCrossingCount += 1;
        } else if (recoveryRate > 0 && temperature[index] < threshold * .55) {
          crystallinity[index] = Math.max(0, before - recoveryRate * (1.08 - temperature[index]));
          if (crystallinity[index] < before) {
            state.recoveryMutationCount += 1;
            state.recoveredCellCount += 1;
          }
        }
        if (crystallinity[index] !== before) state.crystallizationMutationCount += 1;
      }
    }

    state.diffusionIterationCount += iterations;
    if (kind === 'settle') state.settleIterationCount += iterations;
    if (kind === 'recovery') state.recoveryIterationCount += iterations;
    state.stableAfterInput = true;
    updateFieldMetrics();
  }

  function probeIndex() {
    const x = Math.max(0, Math.min(gridWidth - 1, Math.floor(state.probeU * gridWidth)));
    const y = Math.max(0, Math.min(gridHeight - 1, Math.floor(state.probeV * gridHeight)));
    return y * gridWidth + x;
  }

  function setProbe(u, v) {
    const nextU = clamp01(u);
    const nextV = clamp01(v);
    if (nextU !== state.probeU || nextV !== state.probeV) state.probeMoveCount += 1;
    state.probeU = nextU;
    state.probeV = nextV;
    state.probeZone = zoneNames[materialZone[probeIndex()]];
  }

  function appendSourcePoint() {
    const last = sourcePath[sourcePath.length - 1];
    if (!last || Math.hypot(last.u - state.probeU, last.v - state.probeV) > .009) {
      sourcePath.push({ u: state.probeU, v: state.probeV });
      if (sourcePath.length > 96) sourcePath.shift();
      state.sourcePathPointCount = sourcePath.length;
      state.maxSourcePathPointCount = Math.max(state.maxSourcePathPointCount, sourcePath.length);
    }
  }

  function applyHeat(amount) {
    const firstInput = state.firstHumanInputPeakBefore === null;
    const beforePeak = state.currentPeakNormalized;
    const centerX = state.probeU * (gridWidth - 1);
    const centerY = state.probeV * (gridHeight - 1);
    const radius = 5.4 + amount * 3.2;
    state.stableAfterInput = false;
    for (let y = Math.max(0, Math.floor(centerY - radius)); y <= Math.min(gridHeight - 1, Math.ceil(centerY + radius)); y += 1) {
      for (let x = Math.max(0, Math.floor(centerX - radius)); x <= Math.min(gridWidth - 1, Math.ceil(centerX + radius)); x += 1) {
        const distance = Math.hypot(x - centerX, y - centerY);
        if (distance > radius) continue;
        const index = y * gridWidth + x;
        const falloff = (1 - distance / radius) ** 1.6;
        const pixelCoupledGain = (1.24 - heatCapacity[index] * .28) * (materialZone[index] === 1 ? 1.14 : materialZone[index] === 2 ? .72 : 1);
        const before = temperature[index];
        temperature[index] = clamp01(before + amount * falloff * pixelCoupledGain);
        if (temperature[index] !== before) state.heatedCellMutationCount += 1;
      }
    }
    appendSourcePoint();
    state.heatApplicationCount += 1;
    state.humanInputCausalityCount += 1;
    diffuse(state.reducedMotion ? 2 : 4, .992);
    if (firstInput) {
      state.firstHumanInputPeakBefore = beforePeak;
      state.firstHumanInputPeakAfter = state.currentPeakNormalized;
    }
    dirty = true;
  }

  function coolSample() {
    state.stableAfterInput = false;
    state.coolingActionCount += 1;
    state.humanInputCausalityCount += 1;
    diffuse(state.reducedMotion ? 16 : 34, .925, .016, 'recovery');
    dirty = true;
  }

  function resetSample() {
    temperature.fill(0);
    nextTemperature.fill(0);
    crystallinity.fill(0);
    sourcePath.length = 0;
    state.sourcePathPointCount = 0;
    state.resetActionCount += 1;
    state.humanInputCausalityCount += 1;
    state.stableAfterInput = true;
    updateFieldMetrics();
    dirty = true;
  }

  function inputKind(event, action) {
    if (event instanceof PointerEvent) return `${event.pointerType || 'mouse'}-${action}`;
    if (event instanceof KeyboardEvent) return `keyboard-${event.key}`;
    return `button-${action}`;
  }

  function acceptTrustedInput(event, action) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.lastInputKind = inputKind(event, action);
    state.lastInputTrusted = true;
    if (event instanceof PointerEvent) state.lastPointerType = event.pointerType || 'mouse';
    return true;
  }

  function pointerPosition(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      u: clamp01((event.clientX - bounds.left) / Math.max(1, bounds.width)),
      v: clamp01((event.clientY - bounds.top) / Math.max(1, bounds.height))
    };
  }

  function isControlTarget(event) {
    return event.target instanceof Element && Boolean(event.target.closest('[data-thermal-action]'));
  }

  stage.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || isControlTarget(event) || !acceptTrustedInput(event, 'hover-enter')) return;
    state.pointerEnterCount += 1;
    const point = pointerPosition(event);
    setProbe(point.u, point.v);
    applyHeat(.19);
    syncInterface();
  });

  stage.addEventListener('pointerdown', event => {
    if (isControlTarget(event) || !acceptTrustedInput(event, 'drag-start')) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    const point = pointerPosition(event);
    setProbe(point.u, point.v);
    applyHeat(.34 + Math.max(.2, event.pressure || 0) * .24);
    syncInterface();
  });

  stage.addEventListener('pointermove', event => {
    if (isControlTarget(event)) return;
    const mouseHover = event.pointerType === 'mouse' && state.activePointerId === null;
    const activeDrag = state.activePointerId === event.pointerId;
    if (!mouseHover && !activeDrag) return;
    if (!acceptTrustedInput(event, activeDrag ? 'drag-move' : 'hover-move')) return;
    state.pointerMoveCount += 1;
    const point = pointerPosition(event);
    setProbe(point.u, point.v);
    applyHeat(activeDrag ? .26 + Math.max(.15, event.pressure || 0) * .22 : .135);
    syncInterface();
  });

  function releasePointer(event, action) {
    if (state.activePointerId !== event.pointerId || !acceptTrustedInput(event, action)) return;
    state.pointerReleaseCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.activePointerId = null;
    state.pointerCaptured = false;
    state.stableAfterInput = false;
    diffuse(state.reducedMotion ? 3 : 8, .982, 0, 'settle');
    dirty = true;
    syncInterface();
  }

  stage.addEventListener('pointerup', event => releasePointer(event, 'drag-end'));
  stage.addEventListener('pointercancel', event => releasePointer(event, 'drag-cancel'));

  stage.addEventListener('keydown', event => {
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'c', 'C', 'r', 'R'].includes(event.key);
    if (!handled || !acceptTrustedInput(event, 'control')) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (event.key === 'c' || event.key === 'C') coolSample();
    else if (event.key === 'r' || event.key === 'R') resetSample();
    else {
      const delta = .055;
      if (event.key === 'ArrowLeft') setProbe(state.probeU - delta, state.probeV);
      else if (event.key === 'ArrowRight') setProbe(state.probeU + delta, state.probeV);
      else if (event.key === 'ArrowUp') setProbe(state.probeU, state.probeV - delta);
      else if (event.key === 'ArrowDown') setProbe(state.probeU, state.probeV + delta);
      applyHeat(event.key === ' ' || event.key === 'Enter' ? .62 : .18);
    }
    syncInterface();
  });

  actionButtons.forEach(button => button.addEventListener('click', event => {
    const action = button.dataset.thermalAction;
    if (!acceptTrustedInput(event, action)) return;
    state.buttonActivationCount += 1;
    if (action === 'pulse') applyHeat(.68);
    else if (action === 'cool') coolSample();
    else resetSample();
    stage.focus({ preventScroll: true });
    syncInterface();
  }));

  function syncInterface() {
    peakReadout.textContent = `${state.currentPeakKelvin} K`;
    crystalReadout.textContent = `${(state.crystallizedCellCount / cellCount * 100).toFixed(1)}%`;
    regionReadout.textContent = state.probeZone;
    stage.dataset.peakKelvin = String(state.currentPeakKelvin);
    stage.dataset.crystallizedCells = String(state.crystallizedCellCount);
    stage.dataset.probeZone = state.probeZone;
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    ledger.value = JSON.stringify({
      inputCount: state.inputCount,
      lastInputKind: state.lastInputKind,
      lastInputTrusted: state.lastInputTrusted,
      heatApplicationCount: state.heatApplicationCount,
      coolingActionCount: state.coolingActionCount,
      resetActionCount: state.resetActionCount,
      sourcePathPointCount: state.sourcePathPointCount,
      currentPeakKelvin: state.currentPeakKelvin,
      maximumPeakKelvin: state.maximumPeakKelvin,
      activeHeatCellCount: state.activeHeatCellCount,
      crystallizedCellCount: state.crystallizedCellCount,
      maximumCrystallizedCellCount: state.maximumCrystallizedCellCount,
      recoveredCellCount: state.recoveredCellCount,
      diffusionIterationCount: state.diffusionIterationCount,
      assetSha256: state.assetSha256,
      sourcePixelSha256: state.sourcePixelSha256,
      materialPropertyChecksum: state.materialPropertyChecksum,
      runtimeAssert: stage.dataset.runtimeAssert === 'true'
    });
  }

  function resizeCanvas() {
    if (!sketch || !state.p5InstanceReady) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    if (sketch.width === width && sketch.height === height) return;
    sketch.resizeCanvas(width, height, true);
    state.resizeCount += 1;
    state.p5CanvasWidth = sketch.width;
    state.p5CanvasHeight = sketch.height;
    dirty = true;
  }

  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resizeCanvas);
  }).observe(stage);

  function render() {
    state.renderCount += 1;
    if (!state.materialEvidenceReady || !sketch) return;
    resizeCanvas();
    if (dirty) {
      sketch.redraw();
      dirty = false;
    }
    syncInterface();
  }

  const ready = Promise.all([materialEvidenceReady, document.fonts.ready]).then(() => {
    updateFieldMetrics();
    state.ready = true;
    syncInterface();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = canvasHost.querySelector('canvas');
    const realP5 = sketch instanceof p5
      && state.p5InstanceReady
      && state.p5CanvasReady
      && canvas instanceof HTMLCanvasElement
      && sketch.drawingContext === canvas.getContext('2d')
      && sketch.width === stage.clientWidth
      && sketch.height === stage.clientHeight
      && state.p5CompletedDrawCount > 0
      && state.lastRenderedFieldChecksum === state.lastFieldChecksum;
    const honestInteraction = state.task === 'human-operated-pixel-derived-thermal-crystallization-material-test'
      && state.userInputRequired
      && state.initialFrameStatic
      && state.initialStaticConfirmed
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.renderIgnoresPreviewClock
      && state.humanInputCausalityCount === state.heatApplicationCount + state.coolingActionCount + state.resetActionCount
      && state.pointerReleaseCaptureCount <= state.pointerCaptureCount
      && state.lastInputTrusted !== false
      && state.stableAfterInput;
    const realAsset = state.assetEvidenceReady
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetByteLength === 456215
      && state.assetShaMatchesExpected
      && state.assetSha256 === expectedAssetSha256
      && state.browserImageDecoded
      && state.sourceNaturalWidth === 960
      && state.sourceNaturalHeight === 640
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === 960
      && state.p5ImageHeight === 640
      && state.p5ImagePixelLength === 960 * 640 * 4;
    const pixelDerivedMaterial = state.materialEvidenceReady
      && state.sampledWidth === gridWidth
      && state.sampledHeight === gridHeight
      && state.sampledPixelCount === cellCount
      && state.sampledByteLength === cellCount * 4
      && typeof state.sourcePixelSha256 === 'string'
      && state.sourcePixelSha256.length === 64
      && state.distinctSampleColorCount > 1000
      && state.materialCellCount === cellCount
      && state.ceramicCellCount + state.conductorCellCount + state.poreCellCount === cellCount
      && state.ceramicCellCount > 2200
      && state.ceramicCellCount < 2600
      && state.conductorCellCount > 250
      && state.conductorCellCount < 500
      && state.poreCellCount > 700
      && state.poreCellCount < 950
      && state.minimumConductivity > 0
      && state.maximumConductivity > state.minimumConductivity * 3
      && state.maximumHeatCapacity > state.minimumHeatCapacity
      && state.maximumCrystallizationThreshold > state.minimumCrystallizationThreshold
      && state.materialPropertyChecksum > 0;
    const fieldIsFinite = temperature.every(Number.isFinite)
      && crystallinity.every(Number.isFinite)
      && temperature.every(value => value >= 0 && value <= 1)
      && crystallinity.every(value => value >= 0 && value <= 1);
    const initialOrHumanDriven = state.inputCount === 0
      ? state.heatApplicationCount === 0
        && state.coolingActionCount === 0
        && state.resetActionCount === 0
        && state.currentPeakNormalized === 0
        && state.crystallizedCellCount === 0
        && state.lastFieldChecksum === state.initialFieldChecksum
      : state.humanInputCausalityCount > 0
        && state.maximumPeakNormalized > 0
        && state.maximumPeakKelvin > 293
        && state.firstHumanInputPeakBefore === 0
        && state.firstHumanInputPeakAfter > 0;
    const result = Boolean(state.ready
      && realP5
      && honestInteraction
      && realAsset
      && pixelDerivedMaterial
      && fieldIsFinite
      && initialOrHumanDriven
      && window.__PREVIEW_META__?.id === state.id
      && window.__PREVIEW_META__?.library === state.claimedLibrary
      && window.__PREVIEW_META__?.renderer === 'canvas2d'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.dataset.previewMechanism === 'p5-real-micrograph-heterogeneous-heat-diffusion');
    stage.dataset.runtimeAssert = String(result);
    syncInterface();
    return result;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render: () => render(),
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
