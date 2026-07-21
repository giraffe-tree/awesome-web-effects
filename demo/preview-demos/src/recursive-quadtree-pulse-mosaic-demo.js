import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#survey-stage');
  const canvasHost = document.querySelector('[data-canvas-host]');
  const tileReading = document.querySelector('[data-reading="tiles"]');
  const depthReading = document.querySelector('[data-reading="depth"]');
  const signalReading = document.querySelector('[data-reading="signal"]');
  const runtimeLedger = document.querySelector('[data-runtime-ledger]');
  const controls = [...document.querySelectorAll('[data-lod-action]')];
  if (!stage || !canvasHost || !tileReading || !depthReading || !signalReading || !runtimeLedger || controls.length !== 3) {
    throw new Error('recursive-quadtree-pulse-mosaic: required DOM is incomplete');
  }

  const assetUrl = new URL('../assets/aesthetic-wave-06/recursive-quadtree-pulse-mosaic/coastal-watershed-orthomosaic.jpg', import.meta.url).href;
  const expectedAssetSha256 = 'c75158904bebaf28e77b7217e3b4bda5b40be4ba10e28c1879b04e98f2620151';
  const sourceWidth = 960;
  const sourceHeight = 640;
  const crop = { x: 0, y: 50, width: 960, height: 540 };
  const sampleWidth = 96;
  const sampleHeight = 54;
  const samplePixelCount = sampleWidth * sampleHeight;
  const initialFocus = Object.freeze({ u: .5, v: .295 });
  const initialDetail = 2;
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));

  const state = {
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'p5-pixel-sampled-quadtree-lod-inspection',
    focusU: initialFocus.u,
    focusV: initialFocus.v,
    detailLevel: initialDetail,
    hoverMoveCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    dragMoveCount: 0,
    keyboardCount: 0,
    controlCount: 0,
    resetCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    lastInputTrusted: null,
    lastInputKind: 'none',
    lastPointerType: 'none',
    causality: 'trusted-human-input-only',
    automaticPlayback: false,
    automaticCycle: false,
    automaticRehearsal: false,
    automaticFallback: false,
    activePointerId: null,
    pointerCaptured: false,
    visualRevision: 0,
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
    sampledWidth: sampleWidth,
    sampledHeight: sampleHeight,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sourcePixelSha256: null,
    distinctSampleColorCount: 0,
    minimumLuma: 255,
    maximumLuma: 0,
    averageLuma: 0,
    averageTexture: 0,
    maximumTexture: 0,
    textureCellCount: 0,
    waterPixelCount: 0,
    vegetationPixelCount: 0,
    dryPixelCount: 0,
    brightPixelCount: 0,
    classificationChecksum: 0,
    rootCount: 0,
    internalNodeCount: 0,
    leafCount: 0,
    totalNodeCount: 0,
    maximumTreeDepth: 0,
    childLinkCount: 0,
    pixelDrivenSplitCount: 0,
    focusDrivenSplitCount: 0,
    leafCoveragePixels: 0,
    leafCoverageRatio: 0,
    overlapOrGapCount: 0,
    depthHistogram: [],
    topologyChecksum: 0,
    initialTopologyChecksum: 0,
    initialLeafCount: 0,
    initialVisualSignature: 0,
    initialStaticConfirmed: false,
    topologyChangedByHuman: false,
    lastProbeSignal: '—',
    lastProbeRiskScore: 0,
    lastProbeTextureScore: 0,
    lastProbeMeanRgb: [0, 0, 0],
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    renderRequestCount: 0,
    completedDrawCount: 0,
    resizeCount: 0,
    ready: false,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let sourceImage;
  let pixels;
  let lumaIntegral;
  let lumaSquaredIntegral;
  let redIntegral;
  let greenIntegral;
  let blueIntegral;
  let dryIntegral;
  let waterIntegral;
  let textureIntegral;
  let leaves = [];
  let dirty = true;
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`recursive-quadtree-pulse-mosaic: ${message}`);
  }

  async function digestHex(bytes) {
    const buffer = bytes instanceof ArrayBuffer ? bytes : bytes.buffer;
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  async function fetchAndDecodeAsset() {
    const response = await fetch(assetUrl, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `orthomosaic request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === expectedAssetSha256;
    invariant(state.assetSameOrigin, 'orthomosaic was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'orthomosaic SHA-256 differs from the committed asset');

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
    invariant(state.browserImageDecoded && state.sourceNaturalWidth === sourceWidth && state.sourceNaturalHeight === sourceHeight,
      'browser-decoded orthomosaic dimensions are not 960x640');
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
    }, canvasHost);
  });

  function loadP5Source() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(assetUrl, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  function makeIntegral(values) {
    const stride = sampleWidth + 1;
    const integral = new Float64Array((sampleWidth + 1) * (sampleHeight + 1));
    for (let y = 0; y < sampleHeight; y += 1) {
      let rowSum = 0;
      for (let x = 0; x < sampleWidth; x += 1) {
        rowSum += values[y * sampleWidth + x];
        integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + rowSum;
      }
    }
    return integral;
  }

  function regionSum(integral, x0, y0, x1, y1) {
    const stride = sampleWidth + 1;
    return integral[y1 * stride + x1] - integral[y0 * stride + x1]
      - integral[y1 * stride + x0] + integral[y0 * stride + x0];
  }

  function nodeEvidence(x0, y0, x1, y1) {
    const area = Math.max(1, (x1 - x0) * (y1 - y0));
    const meanLuma = regionSum(lumaIntegral, x0, y0, x1, y1) / area;
    const variance = Math.max(0, regionSum(lumaSquaredIntegral, x0, y0, x1, y1) / area - meanLuma * meanLuma);
    const meanTexture = regionSum(textureIntegral, x0, y0, x1, y1) / area;
    const meanRed = regionSum(redIntegral, x0, y0, x1, y1) / area;
    const meanGreen = regionSum(greenIntegral, x0, y0, x1, y1) / area;
    const meanBlue = regionSum(blueIntegral, x0, y0, x1, y1) / area;
    const dryShare = regionSum(dryIntegral, x0, y0, x1, y1) / area;
    const waterShare = regionSum(waterIntegral, x0, y0, x1, y1) / area;
    const textureScore = clamp(Math.sqrt(variance) / 58 * .58 + meanTexture / 76 * .42);
    const drySignal = clamp(dryShare * 1.85 + textureScore * .24 + Math.max(0, meanRed - meanBlue) / 255 * .42);
    const waterSignal = clamp(waterShare * 1.7 + Math.max(0, meanBlue - meanRed) / 255 * .42);
    let signal = 'TERRAIN';
    let risk = textureScore * .62;
    if (waterSignal > .46) {
      signal = 'WATER';
      risk = waterSignal * .68 + textureScore * .2;
    } else if (drySignal > .48) {
      signal = 'DRY';
      risk = drySignal * .78 + textureScore * .22;
    } else if (textureScore > .49) {
      signal = 'RELIEF';
      risk = textureScore * .75;
    }
    return {
      meanLuma,
      meanRgb: [meanRed, meanGreen, meanBlue],
      textureScore,
      drySignal,
      waterSignal,
      risk: clamp(risk),
      signal,
    };
  }

  async function preparePixelEvidence() {
    await Promise.all([assetReady, p5Ready]);
    const decoded = await loadP5Source();
    state.p5ImageDecoded = decoded instanceof p5.Image;
    state.p5ImageClass = decoded instanceof p5.Image ? 'p5.Image' : decoded?.constructor?.name ?? null;
    state.p5ImageWidth = decoded.width;
    state.p5ImageHeight = decoded.height;
    decoded.loadPixels();
    state.p5ImagePixelLength = decoded.pixels.length;
    invariant(state.p5ImageDecoded && decoded.width === sourceWidth && decoded.height === sourceHeight
      && decoded.pixels.length === sourceWidth * sourceHeight * 4, 'p5 did not decode the committed 960x640 orthomosaic');
    sourceImage = decoded;

    const sample = decoded.get(crop.x, crop.y, crop.width, crop.height);
    sample.resize(sampleWidth, sampleHeight);
    sample.loadPixels();
    pixels = new Uint8ClampedArray(sample.pixels);
    state.sampledPixelCount = samplePixelCount;
    state.sampledByteLength = pixels.byteLength;
    state.sourcePixelSha256 = await digestHex(pixels);

    const lumaValues = new Float64Array(samplePixelCount);
    const lumaSquaredValues = new Float64Array(samplePixelCount);
    const redValues = new Float64Array(samplePixelCount);
    const greenValues = new Float64Array(samplePixelCount);
    const blueValues = new Float64Array(samplePixelCount);
    const dryValues = new Float64Array(samplePixelCount);
    const waterValues = new Float64Array(samplePixelCount);
    const textureValues = new Float64Array(samplePixelCount);
    const colors = new Set();
    let lumaTotal = 0;
    let classificationChecksum = 2166136261;

    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const index = y * sampleWidth + x;
        const offset = index * 4;
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const luma = red * .2126 + green * .7152 + blue * .0722;
        const neighbourX = Math.min(sampleWidth - 1, x + 1);
        const neighbourY = Math.min(sampleHeight - 1, y + 1);
        const horizontalOffset = (y * sampleWidth + neighbourX) * 4;
        const verticalOffset = (neighbourY * sampleWidth + x) * 4;
        const horizontalDelta = Math.abs(red - pixels[horizontalOffset]) + Math.abs(green - pixels[horizontalOffset + 1]) + Math.abs(blue - pixels[horizontalOffset + 2]);
        const verticalDelta = Math.abs(red - pixels[verticalOffset]) + Math.abs(green - pixels[verticalOffset + 1]) + Math.abs(blue - pixels[verticalOffset + 2]);
        const texture = (horizontalDelta + verticalDelta) / 6;
        const maximum = Math.max(red, green, blue);
        const minimum = Math.min(red, green, blue);
        const saturation = maximum === 0 ? 0 : (maximum - minimum) / maximum;
        const dry = red > 91 && red > green * 1.1 && red > blue * 1.27 && saturation > .25 ? 1 : 0;
        const water = blue > red * 1.12 && blue > green * .86 && luma < 116 ? 1 : 0;
        const vegetation = green > red * 1.06 && green > blue * .94 && luma < 150;
        const bright = luma > 170;

        lumaValues[index] = luma;
        lumaSquaredValues[index] = luma * luma;
        redValues[index] = red;
        greenValues[index] = green;
        blueValues[index] = blue;
        dryValues[index] = dry;
        waterValues[index] = water;
        textureValues[index] = texture;
        state.minimumLuma = Math.min(state.minimumLuma, luma);
        state.maximumLuma = Math.max(state.maximumLuma, luma);
        state.maximumTexture = Math.max(state.maximumTexture, texture);
        if (texture > 24) state.textureCellCount += 1;
        if (dry) state.dryPixelCount += 1;
        if (water) state.waterPixelCount += 1;
        if (vegetation) state.vegetationPixelCount += 1;
        if (bright) state.brightPixelCount += 1;
        lumaTotal += luma;
        state.averageTexture += texture;
        colors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
        classificationChecksum = Math.imul(classificationChecksum ^ (dry + water * 3 + Number(vegetation) * 7 + Math.round(texture) * 11), 16777619) >>> 0;
      }
    }

    state.distinctSampleColorCount = colors.size;
    state.averageLuma = lumaTotal / samplePixelCount;
    state.averageTexture /= samplePixelCount;
    state.classificationChecksum = classificationChecksum;
    lumaIntegral = makeIntegral(lumaValues);
    lumaSquaredIntegral = makeIntegral(lumaSquaredValues);
    redIntegral = makeIntegral(redValues);
    greenIntegral = makeIntegral(greenValues);
    blueIntegral = makeIntegral(blueValues);
    dryIntegral = makeIntegral(dryValues);
    waterIntegral = makeIntegral(waterValues);
    textureIntegral = makeIntegral(textureValues);
  }

  function focusDistanceToNode(x0, y0, x1, y1) {
    const focusX = state.focusU * sampleWidth;
    const focusY = state.focusV * sampleHeight;
    const dx = Math.max(x0 - focusX, 0, focusX - x1);
    const dy = Math.max(y0 - focusY, 0, focusY - y1);
    return Math.hypot(dx / sampleWidth, dy / sampleHeight);
  }

  function buildTree() {
    leaves = [];
    state.rootCount = 1;
    state.internalNodeCount = 0;
    state.leafCount = 0;
    state.totalNodeCount = 0;
    state.maximumTreeDepth = 0;
    state.childLinkCount = 0;
    state.pixelDrivenSplitCount = 0;
    state.focusDrivenSplitCount = 0;
    state.leafCoveragePixels = 0;
    state.overlapOrGapCount = 0;
    state.depthHistogram = Array(7).fill(0);
    let topologyChecksum = 2166136261;

    const visit = (x0, y0, x1, y1, depth, parentIndex) => {
      const nodeIndex = state.totalNodeCount;
      state.totalNodeCount += 1;
      state.maximumTreeDepth = Math.max(state.maximumTreeDepth, depth);
      const evidence = nodeEvidence(x0, y0, x1, y1);
      const distance = focusDistanceToNode(x0, y0, x1, y1);
      const focusRadius = .19 + state.detailLevel * .035;
      const nearFocus = distance < focusRadius;
      const focusDepth = 2 + state.detailLevel;
      const evidenceDepth = evidence.textureScore > .56 ? 5 : evidence.textureScore > .34 ? 4 : evidence.textureScore > .19 ? 3 : 2;
      const maxAllowedDepth = Math.min(6, nearFocus ? Math.max(focusDepth, evidenceDepth) : Math.min(3, evidenceDepth));
      const canSplit = x1 - x0 > 2 && y1 - y0 > 2;
      const baseSplit = depth < 2;
      const evidenceSplit = depth < evidenceDepth && evidence.textureScore > (.13 + depth * .035);
      const focusSplit = nearFocus && depth < maxAllowedDepth && evidence.textureScore > (.07 + depth * .022);
      const shouldSplit = canSplit && depth < maxAllowedDepth && (baseSplit || evidenceSplit || focusSplit);

      topologyChecksum = Math.imul(topologyChecksum ^ (x0 + y0 * 101 + x1 * 307 + y1 * 911 + depth * 3571 + Number(shouldSplit) * 8191), 16777619) >>> 0;
      if (shouldSplit) {
        state.internalNodeCount += 1;
        state.childLinkCount += 4;
        if (evidenceSplit && depth >= 2) state.pixelDrivenSplitCount += 1;
        if (focusSplit && depth >= 2) state.focusDrivenSplitCount += 1;
        const middleX = Math.floor((x0 + x1) / 2);
        const middleY = Math.floor((y0 + y1) / 2);
        visit(x0, y0, middleX, middleY, depth + 1, nodeIndex);
        visit(middleX, y0, x1, middleY, depth + 1, nodeIndex);
        visit(x0, middleY, middleX, y1, depth + 1, nodeIndex);
        visit(middleX, middleY, x1, y1, depth + 1, nodeIndex);
        return;
      }

      const leaf = { x0, y0, x1, y1, depth, parentIndex, evidence };
      leaves.push(leaf);
      state.leafCount += 1;
      state.leafCoveragePixels += (x1 - x0) * (y1 - y0);
      state.depthHistogram[depth] += 1;
    };

    visit(0, 0, sampleWidth, sampleHeight, 0, -1);
    state.leafCoverageRatio = state.leafCoveragePixels / samplePixelCount;
    state.topologyChecksum = topologyChecksum;

    const coverage = new Uint8Array(samplePixelCount);
    for (const leaf of leaves) {
      for (let y = leaf.y0; y < leaf.y1; y += 1) {
        for (let x = leaf.x0; x < leaf.x1; x += 1) coverage[y * sampleWidth + x] += 1;
      }
    }
    state.overlapOrGapCount = coverage.reduce((count, value) => count + Number(value !== 1), 0);
    const probeX = Math.min(sampleWidth - 1, Math.floor(state.focusU * sampleWidth));
    const probeY = Math.min(sampleHeight - 1, Math.floor(state.focusV * sampleHeight));
    const probeLeaf = leaves.find(leaf => probeX >= leaf.x0 && probeX < leaf.x1 && probeY >= leaf.y0 && probeY < leaf.y1) ?? leaves[0];
    state.lastProbeSignal = probeLeaf.evidence.signal;
    state.lastProbeRiskScore = probeLeaf.evidence.risk;
    state.lastProbeTextureScore = probeLeaf.evidence.textureScore;
    state.lastProbeMeanRgb = probeLeaf.evidence.meanRgb.map(value => Math.round(value));
  }

  function canvasSignature() {
    const context = sketch.drawingContext;
    const imageData = context.getImageData(0, 0, sketch.width, sketch.height).data;
    let signature = 2166136261;
    const stride = Math.max(4, Math.floor(imageData.length / 12000 / 4) * 4);
    for (let index = 0; index < imageData.length; index += stride) {
      signature = Math.imul(signature ^ (imageData[index] + imageData[index + 1] * 3 + imageData[index + 2] * 7), 16777619) >>> 0;
    }
    return signature >>> 0;
  }

  function draw() {
    if (!sourceImage || !pixels) return;
    const p = sketch;
    const width = p.width;
    const height = p.height;
    p.background('#061213');
    p.image(sourceImage, 0, 0, width, height, crop.x, crop.y, crop.width, crop.height);
    p.noStroke();
    p.fill(3, 16, 17, 34);
    p.rect(0, 0, width, height);

    buildTree();
    for (const leaf of leaves) {
      const x = leaf.x0 / sampleWidth * width;
      const y = leaf.y0 / sampleHeight * height;
      const tileWidth = (leaf.x1 - leaf.x0) / sampleWidth * width;
      const tileHeight = (leaf.y1 - leaf.y0) / sampleHeight * height;
      const [red, green, blue] = leaf.evidence.meanRgb;
      const coarseAlpha = Math.max(6, 76 - leaf.depth * 13);
      p.noStroke();
      p.fill(red, green, blue, coarseAlpha);
      p.rect(x, y, tileWidth, tileHeight);

      const risk = leaf.evidence.risk;
      const isRisk = leaf.evidence.signal === 'DRY' && risk > .56;
      p.noFill();
      if (isRisk) p.stroke(244, 188, 92, 115 + risk * 95);
      else if (leaf.evidence.signal === 'WATER') p.stroke(125, 213, 220, 45 + leaf.depth * 15);
      else p.stroke(224, 238, 215, 42 + leaf.depth * 16);
      p.strokeWeight(Math.max(.45, width / 820));
      p.rect(x + .35, y + .35, Math.max(0, tileWidth - .7), Math.max(0, tileHeight - .7));

    }

    const focusX = state.focusU * width;
    const focusY = state.focusV * height;
    const baseRadius = Math.max(10, Math.min(width, height) * (.082 + state.detailLevel * .011));
    p.noFill();
    for (let ring = 0; ring < 3; ring += 1) {
      p.stroke(246, 218, 151, 142 - ring * 34);
      p.strokeWeight(Math.max(.6, width / 760));
      p.circle(focusX, focusY, (baseRadius + ring * Math.max(5, width / 75)) * 2);
    }
    p.stroke(255, 246, 213, 225);
    p.strokeWeight(Math.max(.75, width / 670));
    const crosshair = Math.max(4, width / 70);
    p.line(focusX - crosshair, focusY, focusX - crosshair * .36, focusY);
    p.line(focusX + crosshair * .36, focusY, focusX + crosshair, focusY);
    p.line(focusX, focusY - crosshair, focusX, focusY - crosshair * .36);
    p.line(focusX, focusY + crosshair * .36, focusX, focusY + crosshair);

    tileReading.textContent = String(state.leafCount);
    depthReading.textContent = `L${state.maximumTreeDepth}`;
    signalReading.textContent = `${state.lastProbeSignal} ${Math.round(state.lastProbeRiskScore * 100)}`;
    runtimeLedger.value = JSON.stringify({
      leaves: state.leafCount,
      nodes: state.totalNodeCount,
      maxDepth: state.maximumTreeDepth,
      coverage: state.leafCoveragePixels,
      topology: state.topologyChecksum,
      signal: state.lastProbeSignal,
      risk: Number(state.lastProbeRiskScore.toFixed(4)),
    });
    state.completedDrawCount += 1;
  }

  function render() {
    state.renderRequestCount += 1;
    if (!dirty) return;
    dirty = false;
    draw();
  }

  function markHumanInput(event, kind) {
    state.lastInputTrusted = event.isTrusted;
    state.lastInputKind = kind;
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.trustedInputCount += 1;
    return true;
  }

  function requestVisualUpdate() {
    state.visualRevision += 1;
    dirty = true;
    render();
    if (state.initialTopologyChecksum && state.topologyChecksum !== state.initialTopologyChecksum) state.topologyChangedByHuman = true;
  }

  function locatePointer(event) {
    const bounds = stage.getBoundingClientRect();
    state.focusU = clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), .02, .98);
    state.focusV = clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), .03, .97);
    state.lastPointerType = event.pointerType || 'mouse';
  }

  stage.addEventListener('pointermove', event => {
    if (event.target.closest?.('[data-lod-action]')) return;
    if (event.pointerType !== 'mouse' && event.pointerId !== state.activePointerId) return;
    if (!markHumanInput(event, state.pointerCaptured ? 'pointer-drag' : 'pointer-hover')) return;
    locatePointer(event);
    state.pointerMoveCount += 1;
    if (state.pointerCaptured) state.dragMoveCount += 1;
    else state.hoverMoveCount += 1;
    requestVisualUpdate();
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest?.('[data-lod-action]')) return;
    if (!markHumanInput(event, 'pointer-down')) return;
    locatePointer(event);
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    stage.focus({ preventScroll: true });
    requestVisualUpdate();
  });

  function releasePointer(event) {
    if (event.pointerId !== state.activePointerId) return;
    if (!markHumanInput(event, 'pointer-up')) return;
    state.pointerUpCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerReleaseCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    requestVisualUpdate();
  }

  stage.addEventListener('pointerup', releasePointer);
  stage.addEventListener('pointercancel', releasePointer);

  function changeDetail(delta) {
    const next = clamp(state.detailLevel + delta, 0, 4);
    if (next === state.detailLevel) return;
    state.detailLevel = next;
    requestVisualUpdate();
  }

  function resetView() {
    state.focusU = initialFocus.u;
    state.focusV = initialFocus.v;
    state.detailLevel = initialDetail;
    state.resetCount += 1;
    requestVisualUpdate();
  }

  stage.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft: [-.045, 0],
      ArrowRight: [.045, 0],
      ArrowUp: [0, -.07],
      ArrowDown: [0, .07],
    }[event.key];
    if (movement) {
      event.preventDefault();
      if (!markHumanInput(event, 'keyboard-move')) return;
      state.keyboardCount += 1;
      state.focusU = clamp(state.focusU + movement[0], .02, .98);
      state.focusV = clamp(state.focusV + movement[1], .03, .97);
      requestVisualUpdate();
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      if (!markHumanInput(event, 'keyboard-detail-more')) return;
      state.keyboardCount += 1;
      changeDetail(1);
      return;
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      if (!markHumanInput(event, 'keyboard-detail-less')) return;
      state.keyboardCount += 1;
      changeDetail(-1);
      return;
    }
    if (event.key === 'Home' || event.key.toLowerCase() === 'r') {
      event.preventDefault();
      if (!markHumanInput(event, 'keyboard-reset')) return;
      state.keyboardCount += 1;
      resetView();
    }
  });

  controls.forEach(control => {
    control.addEventListener('click', event => {
      const action = control.dataset.lodAction;
      if (!markHumanInput(event, `control-${action}`)) return;
      state.controlCount += 1;
      if (action === 'more') changeDetail(1);
      if (action === 'less') changeDetail(-1);
      if (action === 'reset') resetView();
      stage.focus({ preventScroll: true });
    });
  });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch || stage.clientWidth < 1 || stage.clientHeight < 1) return;
      sketch.resizeCanvas(stage.clientWidth, stage.clientHeight);
      state.p5CanvasWidth = sketch.width;
      state.p5CanvasHeight = sketch.height;
      state.resizeCount += 1;
      dirty = true;
      render();
    });
  });
  resizeObserver.observe(stage);

  const ready = (async () => {
    await preparePixelEvidence();
    dirty = true;
    render();
    state.initialTopologyChecksum = state.topologyChecksum;
    state.initialLeafCount = state.leafCount;
    state.initialVisualSignature = canvasSignature();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    render();
    state.initialStaticConfirmed = canvasSignature() === state.initialVisualSignature && state.visualRevision === 0;
    state.ready = true;
  })();

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    const topologyCoherent = state.rootCount === 1
      && state.leafCount === leaves.length
      && state.totalNodeCount === state.internalNodeCount + state.leafCount
      && state.childLinkCount === state.internalNodeCount * 4
      && state.leafCount === state.internalNodeCount * 3 + 1
      && state.depthHistogram.reduce((sum, count) => sum + count, 0) === state.leafCount
      && state.leafCoveragePixels === samplePixelCount
      && state.leafCoverageRatio === 1
      && state.overlapOrGapCount === 0
      && state.maximumTreeDepth >= 3
      && state.pixelDrivenSplitCount > 0
      && state.focusDrivenSplitCount > 0
      && state.topologyChecksum !== 0;
    const pixelEvidenceCoherent = state.sampledPixelCount === samplePixelCount
      && state.sampledByteLength === samplePixelCount * 4
      && /^[a-f0-9]{64}$/.test(state.sourcePixelSha256)
      && state.distinctSampleColorCount > 500
      && state.maximumLuma - state.minimumLuma > 140
      && state.averageTexture > 10
      && state.maximumTexture > 60
      && state.textureCellCount > 500
      && state.waterPixelCount > 300
      && state.vegetationPixelCount > 500
      && state.dryPixelCount > 100
      && state.brightPixelCount > 30
      && state.classificationChecksum !== 0;
    const humanCausality = state.trustedInputCount === 0
      ? state.initialStaticConfirmed && state.topologyChecksum === state.initialTopologyChecksum
      : state.lastInputTrusted === true && state.visualRevision > 0 && state.topologyChangedByHuman;
    return state.claimedLibrary === 'p5@2.3.0'
      && window.__PREVIEW_META__?.library === 'p5@2.3.0'
      && state.p5InstanceReady
      && sketch instanceof p5
      && state.p5CanvasReady
      && state.p5CanvasWidth === stage.clientWidth
      && state.p5CanvasHeight === stage.clientHeight
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetShaMatchesExpected
      && state.assetByteLength === 372834
      && state.browserImageDecoded
      && state.sourceNaturalWidth === sourceWidth
      && state.sourceNaturalHeight === sourceHeight
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === sourceWidth
      && state.p5ImageHeight === sourceHeight
      && state.p5ImagePixelLength === sourceWidth * sourceHeight * 4
      && state.causality === 'trusted-human-input-only'
      && state.automaticPlayback === false
      && state.automaticCycle === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && topologyCoherent
      && pixelEvidenceCoherent
      && humanCausality
      && state.initialStaticConfirmed
      && state.completedDrawCount >= 1
      && tileReading.textContent === String(state.leafCount)
      && depthReading.textContent === `L${state.maximumTreeDepth}`
      && signalReading.textContent === `${state.lastProbeSignal} ${Math.round(state.lastProbeRiskScore * 100)}`;
  };

  installPreviewController({
    id: 'recursive-quadtree-pulse-mosaic',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready,
  });

  window.addEventListener('beforeunload', () => resizeObserver.disconnect(), { once: true });
} catch (error) {
  markPreviewFailure(error);
}
