import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL('../assets/aesthetic-wave-07/magnetic-pixel-sort-field/archive-spectrum-scan.jpg', import.meta.url).href;
const EXPECTED_ASSET_SHA256 = 'b8b8d852b997df2fca2fb6d0dda7b561c3eca97599d55c09195e6723062c5275';
const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_PIXEL_COUNT = SOURCE_WIDTH * SOURCE_HEIGHT;
const SOURCE_CROP = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
const SAMPLE_WIDTH = 160;
const SAMPLE_HEIGHT = 90;
const SAMPLE_PIXEL_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const SAMPLE_PIXEL_BYTE_LENGTH = SAMPLE_PIXEL_COUNT * 4;
const INITIAL_FIELD_STRENGTH = 23;
const MAX_FIELDS = 12;
const HUE_BIN_COUNT = 12;
const CLUSTER_COUNT = 5;
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 4) => Number(value.toFixed(digits));

try {
  const stage = document.querySelector('#sort-stage');
  const surface = document.querySelector('#sort-surface');
  const statusOutput = document.querySelector('[data-sort-status]');
  const conclusionOutput = document.querySelector('[data-sort-conclusion]');
  const axisOutput = document.querySelector('[data-reading="axis"]');
  const clusterOutput = document.querySelector('[data-reading="clusters"]');
  const qualityOutput = document.querySelector('[data-reading="quality"]');
  const strengthInput = document.querySelector('#field-strength');
  const strengthOutput = document.querySelector('[data-strength-output]');
  const clusterSwatches = [...document.querySelectorAll('[data-cluster]')];
  const actionButtons = [...document.querySelectorAll('[data-sort-action]')];
  const ledger = document.querySelector('#runtime-ledger');

  if (!stage || !surface || !statusOutput || !conclusionOutput || !axisOutput || !clusterOutput
    || !qualityOutput || !strengthInput || !strengthOutput || !ledger
    || clusterSwatches.length !== CLUSTER_COUNT || actionButtons.length !== 3) {
    throw new Error('magnetic-pixel-sort-field: required DOM is incomplete');
  }

  const state = {
    id: 'magnetic-pixel-sort-field',
    task: 'human-operated-image-pixel-magnetic-media-recovery',
    claimedLibrary: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'same-origin-decoded-image-rgb-drives-p5-local-magnetic-pixel-sorting-axis-clusters-and-media-quality',
    assetMechanismRole: 'source-pixels-directly-determine-visible-media-color-spectrum-sort-key-sort-axis-and-quality-conclusion',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-control', 'visible-buttons'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockCallCount: 0,
    previewClockIgnoredCount: 0,
    previewClockMutationCount: 0,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    ready: false,
    runtimeAssertionPassed: false,
    runtimeAssertCount: 0,
    initialStaticConfirmed: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    humanInputCausalityCount: 0,
    humanMutationCount: 0,
    pointerEnterCount: 0,
    pointerLeaveCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    keyboardInputCount: 0,
    rangeInputCount: 0,
    buttonActivationCount: 0,
    commitCount: 0,
    undoCount: 0,
    restoreCount: 0,
    sortPassCount: 0,
    fieldMutationCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    unknownPointerInputCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    dragging: false,
    pointerInside: false,
    magnetVisible: false,
    magnetU: .5,
    magnetV: .5,
    initialMagnetU: .5,
    initialMagnetV: .5,
    fieldStrength: INITIAL_FIELD_STRENGTH,
    initialFieldStrength: INITIAL_FIELD_STRENGTH,
    minimumFieldStrength: INITIAL_FIELD_STRENGTH,
    maximumFieldStrength: INITIAL_FIELD_STRENGTH,
    activeSortFieldCount: 0,
    maximumSortFieldCount: 0,
    magnetTravelDistance: 0,
    visitedFieldCount: 0,
    sortedPixelCount: 0,
    sortedPixelRatio: 0,
    sourceAssetUrl: ASSET_URL,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetMimeType: '',
    assetSameOrigin: false,
    assetByteLength: 0,
    assetSha256: '',
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    sourcePixelCount: 0,
    sourceCrop: { ...SOURCE_CROP },
    browserCanvasReadback: false,
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sampledPixelSha256: '',
    distinctSampleColorCount: 0,
    nonzeroSampleByteCount: 0,
    sampledLumaMinimum: 255,
    sampledLumaMaximum: 0,
    sampledLumaMean: 0,
    sampledLumaStdDev: 0,
    sampledSaturationMean: 0,
    chromaticPixelCount: 0,
    chromaticPixelRatio: 0,
    horizontalEdgeSampleCount: 0,
    verticalEdgeSampleCount: 0,
    horizontalEdgeMean: 0,
    verticalEdgeMean: 0,
    edgeEnergyMean: 0,
    recommendedSortAxis: '',
    recommendedSortKey: '',
    hueClusterCount: 0,
    hueClusterCenters: [],
    hueClusterPixelCounts: [],
    hueClusterColors: [],
    dominantHueCluster: 0,
    mediaQualityScore: 0,
    mediaQualityConclusion: '',
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5ImageDecoded: false,
    p5ImageClass: '',
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    p5SourcePixelCount: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    renderRequestCount: 0,
    renderCount: 0,
    resizeCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    stageCoverageRatio: 0,
    canvasCoverageRatio: 0,
    initialVisualStateChecksum: '',
    currentVisualStateChecksum: '',
    sourcePixelChecksum: '',
    interactionRecords: [],
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__MAGNETIC_PIXEL_SORT_STATE__ = state;

  let sketch;
  let sourceImage;
  let sampledPixels;
  let displayImage;
  let persistentFields = [];
  let dirty = true;
  let resizeFrame = 0;
  let lastDragPoint = null;
  const visitedFields = new Set();

  function invariant(condition, message) {
    if (!condition) throw new Error(`magnetic-pixel-sort-field: ${message}`);
  }

  async function sha256(bytes) {
    const buffer = bytes instanceof ArrayBuffer
      ? bytes
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function fnvChecksum(bytes) {
    let checksum = 2166136261;
    for (let index = 0; index < bytes.length; index += 4) {
      checksum ^= bytes[index] + bytes[index + 1] * 3 + bytes[index + 2] * 7 + index;
      checksum = Math.imul(checksum, 16777619) >>> 0;
    }
    return checksum.toString(16).padStart(8, '0');
  }

  function rgbEvidence(red, green, blue) {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const maximum = Math.max(r, g, b);
    const minimum = Math.min(r, g, b);
    const chroma = maximum - minimum;
    const luma = (.2126 * red + .7152 * green + .0722 * blue) / 255;
    let hue = 0;
    if (chroma > 0) {
      if (maximum === r) hue = ((g - b) / chroma) % 6;
      else if (maximum === g) hue = (b - r) / chroma + 2;
      else hue = (r - g) / chroma + 4;
      hue = ((hue * 60) + 360) % 360;
    }
    const saturation = maximum === 0 ? 0 : chroma / maximum;
    return { hue, saturation, luma };
  }

  function circularHueDistance(a, b) {
    const distance = Math.abs(a - b) % 360;
    return Math.min(distance, 360 - distance);
  }

  function analyzePixels(pixels) {
    const hueBins = Array.from({ length: HUE_BIN_COUNT }, (_, index) => ({
      index,
      count: 0,
      red: 0,
      green: 0,
      blue: 0,
      hueTotal: 0,
    }));
    const distinctColors = new Set();
    let nonzero = 0;
    let lumaTotal = 0;
    let lumaSquaredTotal = 0;
    let saturationTotal = 0;
    let lumaMinimum = 255;
    let lumaMaximum = 0;
    let chromaticPixelCount = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      nonzero += Number(red !== 0) + Number(green !== 0) + Number(blue !== 0) + Number(alpha !== 0);
      distinctColors.add(`${red},${green},${blue}`);
      const evidence = rgbEvidence(red, green, blue);
      const luma255 = evidence.luma * 255;
      lumaTotal += luma255;
      lumaSquaredTotal += luma255 * luma255;
      saturationTotal += evidence.saturation;
      lumaMinimum = Math.min(lumaMinimum, luma255);
      lumaMaximum = Math.max(lumaMaximum, luma255);
      if (evidence.saturation >= .22 && evidence.luma >= .05 && evidence.luma <= .96) {
        const bin = hueBins[Math.min(HUE_BIN_COUNT - 1, Math.floor(evidence.hue / 360 * HUE_BIN_COUNT))];
        bin.count += 1;
        bin.red += red;
        bin.green += green;
        bin.blue += blue;
        bin.hueTotal += evidence.hue;
        chromaticPixelCount += 1;
      }
    }

    const lumaMean = lumaTotal / SAMPLE_PIXEL_COUNT;
    const lumaStdDev = Math.sqrt(Math.max(0, lumaSquaredTotal / SAMPLE_PIXEL_COUNT - lumaMean ** 2));
    let horizontalEdgeTotal = 0;
    let verticalEdgeTotal = 0;
    let horizontalEdgeSampleCount = 0;
    let verticalEdgeSampleCount = 0;
    const pixelDifference = (first, second) => {
      const red = pixels[first] - pixels[second];
      const green = pixels[first + 1] - pixels[second + 1];
      const blue = pixels[first + 2] - pixels[second + 2];
      return Math.sqrt(red * red + green * green + blue * blue) / 441.6729559;
    };
    for (let row = 0; row < SAMPLE_HEIGHT; row += 1) {
      for (let column = 0; column < SAMPLE_WIDTH; column += 1) {
        const pixelIndex = (row * SAMPLE_WIDTH + column) * 4;
        if (column < SAMPLE_WIDTH - 1) {
          horizontalEdgeTotal += pixelDifference(pixelIndex, pixelIndex + 4);
          horizontalEdgeSampleCount += 1;
        }
        if (row < SAMPLE_HEIGHT - 1) {
          verticalEdgeTotal += pixelDifference(pixelIndex, pixelIndex + SAMPLE_WIDTH * 4);
          verticalEdgeSampleCount += 1;
        }
      }
    }

    const rankedBins = [...hueBins].sort((a, b) => b.count - a.count || a.index - b.index);
    const selectedBins = [];
    for (const bin of rankedBins) {
      if (bin.count === 0) continue;
      if (selectedBins.every(selected => Math.min(Math.abs(selected.index - bin.index), HUE_BIN_COUNT - Math.abs(selected.index - bin.index)) >= 1)) {
        selectedBins.push(bin);
      }
      if (selectedBins.length === CLUSTER_COUNT) break;
    }
    for (const bin of rankedBins) {
      if (selectedBins.length === CLUSTER_COUNT) break;
      if (!selectedBins.includes(bin) && bin.count > 0) selectedBins.push(bin);
    }
    invariant(selectedBins.length === CLUSTER_COUNT, `expected ${CLUSTER_COUNT} non-empty hue clusters`);

    const clusterCenters = selectedBins.map(bin => bin.hueTotal / bin.count);
    const clusterPixelCounts = new Array(CLUSTER_COUNT).fill(0);
    const clusterColorTotals = Array.from({ length: CLUSTER_COUNT }, () => ({ red: 0, green: 0, blue: 0 }));
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const evidence = rgbEvidence(red, green, blue);
      if (evidence.saturation < .22 || evidence.luma < .05 || evidence.luma > .96) continue;
      let nearest = 0;
      for (let candidate = 1; candidate < clusterCenters.length; candidate += 1) {
        if (circularHueDistance(evidence.hue, clusterCenters[candidate])
          < circularHueDistance(evidence.hue, clusterCenters[nearest])) nearest = candidate;
      }
      clusterPixelCounts[nearest] += 1;
      clusterColorTotals[nearest].red += red;
      clusterColorTotals[nearest].green += green;
      clusterColorTotals[nearest].blue += blue;
    }
    const clusterColors = clusterColorTotals.map((total, index) => {
      const count = Math.max(1, clusterPixelCounts[index]);
      return `rgb(${Math.round(total.red / count)} ${Math.round(total.green / count)} ${Math.round(total.blue / count)})`;
    });
    const dominantHueCluster = clusterPixelCounts.indexOf(Math.max(...clusterPixelCounts));
    const horizontalEdgeMean = horizontalEdgeTotal / horizontalEdgeSampleCount;
    const verticalEdgeMean = verticalEdgeTotal / verticalEdgeSampleCount;
    const edgeEnergyMean = (horizontalEdgeMean + verticalEdgeMean) / 2;
    const chromaticPixelRatio = chromaticPixelCount / SAMPLE_PIXEL_COUNT;
    const recommendedSortAxis = horizontalEdgeMean >= verticalEdgeMean ? 'vertical' : 'horizontal';
    const recommendedSortKey = chromaticPixelRatio >= .42 ? 'hue' : 'luma';
    const qualityScore = Math.round(clamp(
      clamp(distinctColors.size / 6500) * .22
      + clamp(lumaStdDev / 72) * .27
      + clamp(chromaticPixelRatio / .64) * .28
      + clamp(edgeEnergyMean / .095) * .23,
    ) * 100);
    const mediaQualityConclusion = qualityScore >= 82
      ? 'Spectrum stable · magnetic recovery approved'
      : qualityScore >= 68
        ? 'Spectrum viable · inspect the weaker band'
        : 'Low separation · increase field sampling';

    Object.assign(state, {
      sampledPixelCount: SAMPLE_PIXEL_COUNT,
      sampledPixelByteLength: pixels.byteLength,
      distinctSampleColorCount: distinctColors.size,
      nonzeroSampleByteCount: nonzero,
      sampledLumaMinimum: rounded(lumaMinimum, 3),
      sampledLumaMaximum: rounded(lumaMaximum, 3),
      sampledLumaMean: rounded(lumaMean, 3),
      sampledLumaStdDev: rounded(lumaStdDev, 3),
      sampledSaturationMean: rounded(saturationTotal / SAMPLE_PIXEL_COUNT),
      chromaticPixelCount,
      chromaticPixelRatio: rounded(chromaticPixelRatio),
      horizontalEdgeSampleCount,
      verticalEdgeSampleCount,
      horizontalEdgeMean: rounded(horizontalEdgeMean),
      verticalEdgeMean: rounded(verticalEdgeMean),
      edgeEnergyMean: rounded(edgeEnergyMean),
      recommendedSortAxis,
      recommendedSortKey,
      hueClusterCount: clusterCenters.length,
      hueClusterCenters: clusterCenters.map(value => rounded(value, 2)),
      hueClusterPixelCounts: clusterPixelCounts,
      hueClusterColors: clusterColors,
      dominantHueCluster,
      mediaQualityScore: qualityScore,
      mediaQualityConclusion,
    });
  }

  async function fetchDecodeAndSampleAsset() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `archive source request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    invariant(state.assetSameOrigin, 'archive source was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'archive source SHA-256 differs from the committed asset');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const browserImage = new Image();
    browserImage.src = objectUrl;
    try {
      await browserImage.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = browserImage.naturalWidth;
      state.sourceNaturalHeight = browserImage.naturalHeight;
      state.sourcePixelCount = browserImage.naturalWidth * browserImage.naturalHeight;
      invariant(state.sourceNaturalWidth === SOURCE_WIDTH && state.sourceNaturalHeight === SOURCE_HEIGHT,
        `archive source must decode to ${SOURCE_WIDTH}x${SOURCE_HEIGHT}`);

      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = SAMPLE_WIDTH;
      sampleCanvas.height = SAMPLE_HEIGHT;
      const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
      invariant(context instanceof CanvasRenderingContext2D, '2D browser sample canvas is unavailable');
      context.drawImage(
        browserImage,
        SOURCE_CROP.x, SOURCE_CROP.y, SOURCE_CROP.width, SOURCE_CROP.height,
        0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT,
      );
      const imageData = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      sampledPixels = new Uint8ClampedArray(imageData.data);
      state.browserCanvasReadback = true;
      state.sampledPixelSha256 = await sha256(sampledPixels);
      state.sourcePixelChecksum = fnvChecksum(sampledPixels);
      analyzePixels(sampledPixels);
      invariant(sampledPixels.byteLength === SAMPLE_PIXEL_BYTE_LENGTH, 'sampled RGBA byte length is incorrect');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(surface);
          canvas.elt.setAttribute('aria-hidden', 'true');
          p.noLoop();
          p.noSmooth();
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement
            && p.drawingContext instanceof CanvasRenderingContext2D;
          updateLayoutEvidence();
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.p5DrawCount += 1;
        if (!sampledPixels || !displayImage) {
          p.background('#0b0c0e');
          return;
        }
        drawSortField(p);
        state.p5CompletedDrawCount += 1;
        dirty = false;
      };
    }, surface);
  });

  function loadP5Image() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(ASSET_URL, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  function imageIndex(column, row) {
    return (row * SAMPLE_WIDTH + column) * 4;
  }

  function pixelSortKey(pixels, index) {
    const evidence = rgbEvidence(pixels[index], pixels[index + 1], pixels[index + 2]);
    if (state.recommendedSortKey === 'hue') return evidence.hue / 360 * .76 + evidence.luma * .24;
    return evidence.luma * .82 + evidence.saturation * .18;
  }

  function sortIndices(pixels, indices) {
    const colors = indices.map(index => ({
      red: pixels[index],
      green: pixels[index + 1],
      blue: pixels[index + 2],
      alpha: pixels[index + 3],
      key: pixelSortKey(pixels, index),
    })).sort((a, b) => a.key - b.key || a.red - b.red || a.green - b.green || a.blue - b.blue);
    indices.forEach((index, position) => {
      const color = colors[position];
      pixels[index] = color.red;
      pixels[index + 1] = color.green;
      pixels[index + 2] = color.blue;
      pixels[index + 3] = color.alpha;
    });
  }

  function applyMagneticField(pixels, field) {
    const centerX = Math.round(field.u * (SAMPLE_WIDTH - 1));
    const centerY = Math.round(field.v * (SAMPLE_HEIGHT - 1));
    const radius = Math.max(4, Math.round(field.radius));
    if (state.recommendedSortAxis === 'vertical') {
      for (let column = Math.max(0, centerX - radius); column <= Math.min(SAMPLE_WIDTH - 1, centerX + radius); column += 1) {
        const offset = column - centerX;
        const halfSpan = Math.max(2, Math.round(Math.sqrt(Math.max(0, radius * radius - offset * offset))));
        const indices = [];
        for (let row = Math.max(0, centerY - halfSpan); row <= Math.min(SAMPLE_HEIGHT - 1, centerY + halfSpan); row += 1) {
          indices.push(imageIndex(column, row));
        }
        if (indices.length > 3) sortIndices(pixels, indices);
      }
    } else {
      for (let row = Math.max(0, centerY - radius); row <= Math.min(SAMPLE_HEIGHT - 1, centerY + radius); row += 1) {
        const offset = row - centerY;
        const halfSpan = Math.max(2, Math.round(Math.sqrt(Math.max(0, radius * radius - offset * offset))));
        const indices = [];
        for (let column = Math.max(0, centerX - halfSpan); column <= Math.min(SAMPLE_WIDTH - 1, centerX + halfSpan); column += 1) {
          indices.push(imageIndex(column, row));
        }
        if (indices.length > 3) sortIndices(pixels, indices);
      }
    }
  }

  function buildRenderedPixels() {
    const rendered = sampledPixels.slice();
    persistentFields.forEach(field => applyMagneticField(rendered, field));
    if (state.magnetVisible && !state.dragging) {
      applyMagneticField(rendered, { u: state.magnetU, v: state.magnetV, radius: state.fieldStrength * .82 });
    }
    let sortedPixelCount = 0;
    for (let index = 0; index < rendered.length; index += 4) {
      if (rendered[index] !== sampledPixels[index]
        || rendered[index + 1] !== sampledPixels[index + 1]
        || rendered[index + 2] !== sampledPixels[index + 2]) sortedPixelCount += 1;
    }
    state.sortedPixelCount = sortedPixelCount;
    state.sortedPixelRatio = rounded(sortedPixelCount / SAMPLE_PIXEL_COUNT);
    state.currentVisualStateChecksum = fnvChecksum(rendered);
    return rendered;
  }

  function drawMagnet(p) {
    if (!state.magnetVisible) return;
    const x = state.magnetU * p.width;
    const y = state.magnetV * p.height;
    const scaleX = p.width / SAMPLE_WIDTH;
    const scaleY = p.height / SAMPLE_HEIGHT;
    const radius = state.fieldStrength * Math.min(scaleX, scaleY);
    p.push();
    p.noFill();
    p.strokeWeight(Math.max(1, p.width / 520));
    p.stroke(255, 212, 106, 220);
    p.circle(x, y, radius * 2);
    p.stroke(255, 250, 235, 165);
    p.circle(x, y, radius * 1.3);
    p.stroke(255, 212, 106, 110);
    if (state.recommendedSortAxis === 'vertical') {
      p.line(x, Math.max(0, y - radius * 1.45), x, Math.min(p.height, y + radius * 1.45));
      p.line(x - 4, y - radius, x + 4, y - radius);
      p.line(x - 4, y + radius, x + 4, y + radius);
    } else {
      p.line(Math.max(0, x - radius * 1.45), y, Math.min(p.width, x + radius * 1.45), y);
      p.line(x - radius, y - 4, x - radius, y + 4);
      p.line(x + radius, y - 4, x + radius, y + 4);
    }
    p.noStroke();
    p.fill(255, 212, 106, 235);
    p.circle(x, y, Math.max(3, p.width / 150));
    p.pop();
  }

  function drawTrail(p) {
    if (persistentFields.length < 2) return;
    p.push();
    p.noFill();
    p.stroke(255, 212, 106, 82);
    p.strokeWeight(Math.max(1, p.width / 700));
    p.beginShape();
    persistentFields.forEach(field => p.vertex(field.u * p.width, field.v * p.height));
    p.endShape();
    p.pop();
  }

  function drawSortField(p) {
    const rendered = buildRenderedPixels();
    displayImage.loadPixels();
    displayImage.pixels.set(rendered);
    displayImage.updatePixels();
    p.background('#0b0c0e');
    p.image(displayImage, 0, 0, p.width, p.height);
    drawTrail(p);
    drawMagnet(p);
    state.renderCount += 1;
    updateLayoutEvidence();
  }

  function visualStateSignature() {
    return [
      state.sourcePixelChecksum,
      state.currentVisualStateChecksum,
      state.magnetVisible ? 1 : 0,
      state.fieldStrength,
      persistentFields.length,
      rounded(state.magnetU, 3),
      rounded(state.magnetV, 3),
    ].join(':');
  }

  function updateLayoutEvidence() {
    const stageBounds = stage.getBoundingClientRect();
    const canvasBounds = sketch?.canvas?.getBoundingClientRect();
    state.stageWidth = rounded(stageBounds.width, 2);
    state.stageHeight = rounded(stageBounds.height, 2);
    state.canvasWidth = rounded(canvasBounds?.width || 0, 2);
    state.canvasHeight = rounded(canvasBounds?.height || 0, 2);
    state.stageCoverageRatio = rounded(stageBounds.width * stageBounds.height / Math.max(1, innerWidth * innerHeight));
    state.canvasCoverageRatio = rounded((canvasBounds?.width || 0) * (canvasBounds?.height || 0)
      / Math.max(1, stageBounds.width * stageBounds.height));
  }

  function acceptTrustedInput(event, kind) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      syncDataset();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.humanInputCausalityCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = true;
    return true;
  }

  function observePointerType(pointerType) {
    state.lastPointerType = pointerType || 'unknown';
    if (state.lastPointerType === 'mouse') state.mouseInputCount += 1;
    else if (state.lastPointerType === 'touch') state.touchInputCount += 1;
    else if (state.lastPointerType === 'pen') state.penInputCount += 1;
    else state.unknownPointerInputCount += 1;
  }

  function recordInteraction(kind, detail = {}) {
    state.interactionRecords.push({ kind, ...detail });
    if (state.interactionRecords.length > 80) state.interactionRecords.shift();
  }

  function syncDataset() {
    stage.dataset.sortAxis = state.recommendedSortAxis || 'pending';
    stage.dataset.sortKey = state.recommendedSortKey || 'pending';
    stage.dataset.fieldCount = String(persistentFields.length);
    stage.dataset.fieldStrength = String(state.fieldStrength);
    stage.dataset.dragging = String(state.dragging);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.humanMutationCount = String(state.humanMutationCount);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
  }

  function syncUI() {
    axisOutput.textContent = state.recommendedSortAxis ? state.recommendedSortAxis.slice(0, 4).toUpperCase() : '—';
    clusterOutput.textContent = state.hueClusterCount ? String(state.hueClusterCount).padStart(2, '0') : '—';
    qualityOutput.textContent = state.mediaQualityScore ? `${state.mediaQualityScore}%` : '—';
    strengthInput.value = String(state.fieldStrength);
    strengthOutput.textContent = String(state.fieldStrength);
    conclusionOutput.textContent = state.mediaQualityConclusion || 'Pixel evidence is being decoded';
    statusOutput.textContent = state.dragging
      ? `Captured ${state.recommendedSortAxis} field`
      : persistentFields.length > 0
        ? `${persistentFields.length} magnetic passes preserved`
        : state.magnetVisible
          ? 'Live field preview'
          : 'Source field ready';
    clusterSwatches.forEach((swatch, index) => {
      swatch.style.setProperty('--cluster-color', state.hueClusterColors[index] || '#f3c54f');
    });
    const undoButton = actionButtons.find(button => button.dataset.sortAction === 'undo');
    if (undoButton) undoButton.disabled = persistentFields.length === 0;
    state.activeSortFieldCount = persistentFields.length;
    state.maximumSortFieldCount = Math.max(state.maximumSortFieldCount, persistentFields.length);
    ledger.value = `${state.recommendedSortAxis}/${state.recommendedSortKey}; ${state.hueClusterCount} clusters; ${state.mediaQualityScore}% quality; ${persistentFields.length} committed fields`;
    syncDataset();
  }

  function requestRender() {
    dirty = true;
    state.renderRequestCount += 1;
    sketch?.redraw();
  }

  function coordinatesFromPointer(event) {
    const bounds = surface.getBoundingClientRect();
    return {
      u: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width)),
      v: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height)),
    };
  }

  function markVisited(u, v) {
    visitedFields.add(`${Math.round(u * 24)}:${Math.round(v * 14)}`);
    state.visitedFieldCount = visitedFields.size;
  }

  function moveMagnet(u, v, kind) {
    const nextU = clamp(u);
    const nextV = clamp(v);
    const distance = Math.hypot(nextU - state.magnetU, nextV - state.magnetV);
    state.magnetTravelDistance = rounded(state.magnetTravelDistance + distance);
    state.magnetU = nextU;
    state.magnetV = nextV;
    state.magnetVisible = true;
    markVisited(nextU, nextV);
    recordInteraction(kind, { u: rounded(nextU, 3), v: rounded(nextV, 3) });
  }

  function addPersistentField(kind) {
    const field = { u: state.magnetU, v: state.magnetV, radius: state.fieldStrength, kind };
    persistentFields.push(field);
    if (persistentFields.length > MAX_FIELDS) persistentFields.shift();
    state.sortPassCount += 1;
    state.fieldMutationCount += 1;
    state.humanMutationCount += 1;
    state.activeSortFieldCount = persistentFields.length;
    state.maximumSortFieldCount = Math.max(state.maximumSortFieldCount, persistentFields.length);
    recordInteraction(kind, { u: rounded(field.u, 3), v: rounded(field.v, 3), radius: field.radius });
    syncUI();
    requestRender();
  }

  function undoField(kind) {
    if (persistentFields.length === 0) return false;
    const removed = persistentFields.pop();
    state.undoCount += 1;
    state.fieldMutationCount += 1;
    state.humanMutationCount += 1;
    recordInteraction(kind, { remaining: persistentFields.length, removed: { u: rounded(removed.u, 3), v: rounded(removed.v, 3) } });
    syncUI();
    requestRender();
    return true;
  }

  function restoreSource(kind) {
    persistentFields = [];
    state.fieldStrength = INITIAL_FIELD_STRENGTH;
    state.magnetVisible = false;
    state.restoreCount += 1;
    state.fieldMutationCount += 1;
    state.humanMutationCount += 1;
    recordInteraction(kind, { fieldStrength: state.fieldStrength });
    syncUI();
    requestRender();
  }

  surface.addEventListener('pointerenter', event => {
    if (!acceptTrustedInput(event, 'pointer-enter')) return;
    observePointerType(event.pointerType);
    state.pointerEnterCount += 1;
    state.pointerInside = true;
    const { u, v } = coordinatesFromPointer(event);
    moveMagnet(u, v, 'pointer-enter');
    state.hoverMutationCount += 1;
    state.humanMutationCount += 1;
    syncUI();
    requestRender();
  });

  surface.addEventListener('pointermove', event => {
    if (!acceptTrustedInput(event, state.dragging ? 'captured-pointer-drag' : 'pointer-hover')) return;
    observePointerType(event.pointerType);
    state.pointerMoveCount += 1;
    const previousU = state.magnetU;
    const previousV = state.magnetV;
    const { u, v } = coordinatesFromPointer(event);
    moveMagnet(u, v, state.dragging ? 'captured-pointer-drag' : 'pointer-hover');
    if (state.dragging) {
      const distance = Math.hypot(u - (lastDragPoint?.u ?? previousU), v - (lastDragPoint?.v ?? previousV));
      if (distance >= .035) {
        addPersistentField('captured-pointer-drag');
        lastDragPoint = { u, v };
        state.dragMutationCount += 1;
      }
    } else {
      state.hoverMutationCount += 1;
      state.humanMutationCount += 1;
      syncUI();
      requestRender();
    }
  });

  surface.addEventListener('pointerdown', event => {
    if (!acceptTrustedInput(event, 'captured-pointer-down')) return;
    observePointerType(event.pointerType);
    event.preventDefault();
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    state.dragging = true;
    state.pointerInside = true;
    surface.setPointerCapture(event.pointerId);
    state.pointerCaptured = surface.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    const { u, v } = coordinatesFromPointer(event);
    moveMagnet(u, v, 'captured-pointer-down');
    lastDragPoint = { u, v };
    addPersistentField('captured-pointer-down');
    state.dragMutationCount += 1;
    syncUI();
    requestRender();
  });

  function releasePointer(event, cancelled = false) {
    if (!acceptTrustedInput(event, cancelled ? 'captured-pointer-cancel' : 'captured-pointer-up')) return;
    observePointerType(event.pointerType);
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerUpCount += 1;
    if (state.activePointerId === event.pointerId && surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.activePointerId = null;
    state.pointerCaptured = false;
    state.dragging = false;
    lastDragPoint = null;
    if (event.pointerType !== 'mouse') state.magnetVisible = false;
    syncUI();
    requestRender();
  }

  surface.addEventListener('pointerup', event => releasePointer(event));
  surface.addEventListener('pointercancel', event => releasePointer(event, true));

  surface.addEventListener('pointerleave', event => {
    if (state.dragging || !acceptTrustedInput(event, 'pointer-leave')) return;
    observePointerType(event.pointerType);
    state.pointerLeaveCount += 1;
    state.pointerInside = false;
    state.magnetVisible = false;
    state.hoverMutationCount += 1;
    state.humanMutationCount += 1;
    syncUI();
    requestRender();
  });

  surface.addEventListener('keydown', event => {
    const handledKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', '[', ']', 'Backspace', 'Escape', 'r', 'R', 'z', 'Z']);
    if (!handledKeys.has(event.key) || !acceptTrustedInput(event, `keyboard-${event.key}`)) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    const step = event.shiftKey ? .11 : .055;
    if (event.key === 'ArrowLeft') moveMagnet(state.magnetU - step, state.magnetV, 'keyboard-move');
    else if (event.key === 'ArrowRight') moveMagnet(state.magnetU + step, state.magnetV, 'keyboard-move');
    else if (event.key === 'ArrowUp') moveMagnet(state.magnetU, state.magnetV - step, 'keyboard-move');
    else if (event.key === 'ArrowDown') moveMagnet(state.magnetU, state.magnetV + step, 'keyboard-move');
    else if (event.key === 'Enter' || event.key === ' ') {
      state.commitCount += 1;
      addPersistentField('keyboard-commit');
      return;
    } else if (event.key === '[' || event.key === ']') {
      const delta = event.key === '[' ? -2 : 2;
      state.fieldStrength = Math.max(12, Math.min(34, state.fieldStrength + delta));
      state.minimumFieldStrength = Math.min(state.minimumFieldStrength, state.fieldStrength);
      state.maximumFieldStrength = Math.max(state.maximumFieldStrength, state.fieldStrength);
      state.fieldMutationCount += 1;
      state.humanMutationCount += 1;
    } else if (event.key === 'Backspace' || event.key.toLowerCase() === 'z') {
      undoField('keyboard-undo');
      return;
    } else if (event.key === 'Escape' || event.key.toLowerCase() === 'r') {
      restoreSource('keyboard-restore');
      return;
    }
    state.fieldMutationCount += 1;
    state.humanMutationCount += 1;
    syncUI();
    requestRender();
  });

  strengthInput.addEventListener('input', event => {
    if (!acceptTrustedInput(event, 'range-field-strength')) return;
    state.rangeInputCount += 1;
    state.fieldStrength = Number(strengthInput.value);
    state.minimumFieldStrength = Math.min(state.minimumFieldStrength, state.fieldStrength);
    state.maximumFieldStrength = Math.max(state.maximumFieldStrength, state.fieldStrength);
    state.fieldMutationCount += 1;
    state.humanMutationCount += 1;
    recordInteraction('range-field-strength', { value: state.fieldStrength });
    syncUI();
    requestRender();
  });

  actionButtons.forEach(button => {
    button.addEventListener('click', event => {
      const action = button.dataset.sortAction;
      if (!acceptTrustedInput(event, `button-${action}`)) return;
      state.buttonActivationCount += 1;
      if (action === 'commit') {
        state.magnetVisible = true;
        state.commitCount += 1;
        addPersistentField('button-commit');
      } else if (action === 'undo') {
        undoField('button-undo');
      } else if (action === 'restore') {
        restoreSource('button-restore');
      }
    });
  });

  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      sketch.resizeCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
      state.resizeCount += 1;
      updateLayoutEvidence();
      requestRender();
    });
  });

  const ready = (async () => {
    await Promise.all([fetchDecodeAndSampleAsset(), p5Ready]);
    sourceImage = await loadP5Image();
    sourceImage.loadPixels();
    state.p5ImageDecoded = sourceImage instanceof p5.Image;
    state.p5ImageClass = state.p5ImageDecoded ? 'p5.Image' : sourceImage?.constructor?.name || '';
    state.p5ImageWidth = sourceImage.width;
    state.p5ImageHeight = sourceImage.height;
    state.p5ImagePixelLength = sourceImage.pixels.length;
    state.p5SourcePixelCount = sourceImage.width * sourceImage.height;
    displayImage = sketch.createImage(SAMPLE_WIDTH, SAMPLE_HEIGHT);
    requestRender();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialVisualStateChecksum = visualStateSignature();
    const initialDrawCount = state.p5CompletedDrawCount;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const repeatedSignature = visualStateSignature();
    state.initialStaticConfirmed = state.initialVisualStateChecksum === repeatedSignature
      && state.inputCount === 0
      && persistentFields.length === 0
      && state.sortedPixelCount === 0
      && state.p5CompletedDrawCount === initialDrawCount;

    invariant(state.assetFetchCount === 1 && state.assetResponseStatus === 200, 'exactly one successful evidence fetch is required');
    invariant(state.assetByteLength > 100000 && state.assetShaMatchesExpected, 'asset bytes and exact SHA evidence are required');
    invariant(state.browserImageDecoded && state.sourcePixelCount === SOURCE_PIXEL_COUNT, 'browser-decoded source dimensions are invalid');
    invariant(state.browserCanvasReadback && state.sampledPixelCount === SAMPLE_PIXEL_COUNT, 'browser pixel sample is incomplete');
    invariant(state.sampledPixelByteLength === SAMPLE_PIXEL_BYTE_LENGTH && state.sampledPixelSha256.length === 64, 'sample byte/hash evidence is invalid');
    invariant(state.distinctSampleColorCount > 1000 && state.nonzeroSampleByteCount > SAMPLE_PIXEL_COUNT * 3, 'sample diversity is too low');
    invariant(state.sampledLumaStdDev > 30 && state.chromaticPixelRatio > .25, 'source lacks useful luminance or chromatic separation');
    invariant(state.horizontalEdgeSampleCount === 14310 && state.verticalEdgeSampleCount === 14240, 'edge evidence sample counts are wrong');
    invariant(['vertical', 'horizontal'].includes(state.recommendedSortAxis), 'pixel-derived sorting axis is missing');
    invariant(['hue', 'luma'].includes(state.recommendedSortKey), 'pixel-derived sorting key is missing');
    invariant(state.hueClusterCount === CLUSTER_COUNT
      && state.hueClusterPixelCounts.reduce((total, value) => total + value, 0) === state.chromaticPixelCount,
    'five pixel-derived hue clusters are required');
    invariant(state.mediaQualityScore >= 55 && state.mediaQualityConclusion.length > 12, 'pixel-derived media quality evidence is weak');
    invariant(state.p5InstanceReady && state.p5CanvasReady && state.p5ImageDecoded && state.p5ImageClass === 'p5.Image', 'p5 runtime evidence is incomplete');
    invariant(state.p5ImageWidth === SOURCE_WIDTH && state.p5ImageHeight === SOURCE_HEIGHT
      && state.p5ImagePixelLength === SOURCE_PIXEL_COUNT * 4, 'p5 source image evidence is incomplete');
    invariant(state.initialStaticConfirmed, 'initial frame changed without human input');
    invariant(state.automaticCycle === false && state.automaticPlayback === false
      && state.automaticRehearsal === false && state.automaticFallback === false
      && state.syntheticInputDispatch === false && state.captureClockDriven === false,
    'human-operated demo cannot contain automatic behavior');
    updateLayoutEvidence();
    invariant(state.stageCoverageRatio > .98 && state.canvasCoverageRatio > .98, 'canvas must cover the full live stage');
    state.runtimeAssertionPassed = true;
    state.ready = true;
    syncUI();
  })();

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    invariant(state.ready && state.runtimeAssertionPassed, 'runtime must be ready before assertion');
    invariant(state.task === 'human-operated-image-pixel-magnetic-media-recovery', 'task identity changed');
    invariant(state.claimedLibrary === 'p5@2.3.0' && state.renderer === 'canvas2d', 'runtime identity changed');
    invariant(state.userInputRequired && state.strictTrustedInputGuard && state.initialFrameStatic
      && state.initialStaticConfirmed, 'human ownership or static initial state changed');
    invariant(!state.automaticCycle && !state.automaticPlayback && !state.automaticRehearsal
      && !state.automaticFallback && !state.syntheticInputDispatch && !state.captureClockDriven
      && state.previewClockMutationCount === 0 && state.renderIgnoresPreviewClock,
    'automatic behavior is forbidden');
    invariant(state.assetFetchCount === 1 && state.assetResponseStatus === 200 && state.assetSameOrigin,
      'same-origin source fetch evidence changed');
    invariant(state.assetByteLength === 269655 && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.assetShaMatchesExpected, 'exact committed asset evidence changed');
    invariant(state.browserImageDecoded && state.sourceNaturalWidth === SOURCE_WIDTH
      && state.sourceNaturalHeight === SOURCE_HEIGHT && state.sourcePixelCount === SOURCE_PIXEL_COUNT,
    'browser-decoded source evidence changed');
    invariant(state.sampledPixelCount === SAMPLE_PIXEL_COUNT
      && state.sampledPixelByteLength === SAMPLE_PIXEL_BYTE_LENGTH
      && state.sampledPixelSha256.length === 64 && /[1-9a-f]/.test(state.sampledPixelSha256),
    'sample evidence is incomplete');
    invariant(state.distinctSampleColorCount > 5000 && state.distinctSampleColorCount < SAMPLE_PIXEL_COUNT,
      'sample color diversity left its robust range');
    invariant(state.nonzeroSampleByteCount > SAMPLE_PIXEL_COUNT * 3
      && state.sampledLumaMinimum >= 0 && state.sampledLumaMinimum < 15
      && state.sampledLumaMaximum > 180 && state.sampledLumaMaximum <= 255
      && state.sampledLumaMean > 60 && state.sampledLumaMean < 110
      && state.sampledLumaStdDev > 45 && state.sampledLumaStdDev < 75,
    'luminance evidence left its robust range');
    invariant(state.sampledSaturationMean > .35 && state.sampledSaturationMean < .7
      && state.chromaticPixelCount > 7000 && state.chromaticPixelCount < 10000
      && state.chromaticPixelRatio > .45 && state.chromaticPixelRatio < .72,
    'chromatic evidence left its robust range');
    invariant(state.horizontalEdgeSampleCount === 14310 && state.verticalEdgeSampleCount === 14240
      && state.horizontalEdgeMean > .02 && state.horizontalEdgeMean < .08
      && state.verticalEdgeMean > .01 && state.verticalEdgeMean < .06
      && state.edgeEnergyMean > .02 && state.edgeEnergyMean < .07,
    'directional edge evidence left its robust range');
    invariant(state.recommendedSortAxis === 'vertical' && state.recommendedSortKey === 'hue',
      'pixel-derived sorting recommendation changed');
    invariant(state.hueClusterCount === CLUSTER_COUNT
      && state.hueClusterCenters.length === CLUSTER_COUNT
      && state.hueClusterPixelCounts.length === CLUSTER_COUNT
      && state.hueClusterColors.length === CLUSTER_COUNT
      && state.hueClusterPixelCounts.reduce((total, count) => total + count, 0) === state.chromaticPixelCount,
    'pixel-derived hue clusters changed');
    invariant(state.mediaQualityScore >= 65 && state.mediaQualityScore <= 90
      && state.mediaQualityConclusion.length > 12, 'media-quality evidence changed');
    invariant(state.p5InstanceReady && state.p5CanvasReady && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image' && state.p5ImageWidth === SOURCE_WIDTH
      && state.p5ImageHeight === SOURCE_HEIGHT && state.p5ImagePixelLength === SOURCE_PIXEL_COUNT * 4,
    'p5 source evidence changed');
    updateLayoutEvidence();
    invariant(state.stageCoverageRatio > .98 && state.canvasCoverageRatio > .98,
      'live canvas no longer covers the full stage');
    return true;
  };

  installPreviewController({
    id: 'magnetic-pixel-sort-field',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    ready,
    render: async () => {
      state.previewClockCallCount += 1;
      state.previewClockIgnoredCount += 1;
      if (dirty) sketch?.redraw();
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
