import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#voronoi-stage');
  const surface = document.querySelector('#mosaic-surface');
  const focusIndexOutput = document.querySelector('#focus-index');
  const focusStatusOutput = document.querySelector('#focus-status');
  const focusLabelOutput = document.querySelector('#focus-label');
  const focusConfidenceOutput = document.querySelector('#focus-confidence');
  const focusAreaOutput = document.querySelector('#focus-area');
  const ledger = document.querySelector('#runtime-ledger');
  const controls = [...document.querySelectorAll('[data-focus-action]')];
  const assetUrl = new URL('../assets/aesthetic-wave-07/elastic-voronoi-focus-mosaic/coastal-restoration-survey.jpg', import.meta.url).href;
  const expectedAssetSha256 = '45a73a7734337e154e4bb3a28a2ee86833228661d2a4b385791fb2af798f2a9a';
  const logicalWidth = 320;
  const logicalHeight = 180;
  const cropSourceY = 50;
  const cropSourceHeight = 540;
  const sampleRadius = 7;
  const samplesPerSite = (sampleRadius * 2 + 1) ** 2;
  const focusPower = 2500;
  const initialIndex = 6;
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const boundValue = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const unitValue = value => boundValue(value, 0, 1);

  const sites = [
    { u: .09, v: .13 }, { u: .29, v: .12 }, { u: .51, v: .13 }, { u: .73, v: .12 }, { u: .92, v: .23 },
    { u: .13, v: .42 }, { u: .36, v: .42 }, { u: .58, v: .40 }, { u: .80, v: .47 },
    { u: .09, v: .76 }, { u: .32, v: .76 }, { u: .58, v: .76 }, { u: .84, v: .76 }
  ].map((site, index) => ({
    ...site,
    index,
    x: site.u * logicalWidth,
    y: site.v * logicalHeight,
    evidence: null,
    baseArea: 0
  }));

  const state = {
    id: 'elastic-voronoi-focus-mosaic',
    task: 'human-operated-coastal-image-evidence-focus-and-classification',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'p5-image-pixels-drive-power-diagram-site-evidence-classification-and-elastic-focus-area',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'visible-buttons'],
    userInputRequired: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    previewClockMutationCount: 0,
    renderIgnoresPreviewClock: true,
    reducedMotion: reducedMotionQuery.matches,
    inputCount: 0,
    humanInputCausalityCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    hoverFocusCount: 0,
    dragFocusCount: 0,
    lockCount: 0,
    resetCount: 0,
    rejectedUntrustedInputCount: 0,
    lastInputTrusted: null,
    lastInputKind: 'none',
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    dragStartU: 0,
    dragStartV: 0,
    dragDistance: 0,
    selectedIndex: initialIndex,
    focusIndex: initialIndex,
    focusPower,
    focusAnimationCount: 0,
    focusAnimationFrameCount: 0,
    focusAnimationSettledCount: 0,
    animationSettled: true,
    initialGeometryChecksum: 0,
    currentGeometryChecksum: 0,
    initialStaticConfirmed: false,
    focusExpansionRatio: 1,
    maximumFocusExpansionRatio: 1,
    currentPartitionArea: 0,
    partitionCoverageCellCount: 0,
    partitionExpectedCellCount: 80 * 45,
    partitionRegionCount: 0,
    adjacencyEdgeCount: 0,
    minimumNeighborCount: 0,
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
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sampledPixelSha256: null,
    distinctSampleColorCount: 0,
    evidenceSiteCount: 0,
    evidenceClassCount: 0,
    evidenceClasses: [],
    evidenceChecksum: 0,
    evidenceReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    renderCount: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    resizeCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let habitatImage;
  let dirty = true;
  let resizeFrame = 0;
  let focusAnimationFrame = 0;
  let pointerStart = null;

  function invariant(condition, message) {
    if (!condition) throw new Error(`elastic-voronoi-focus-mosaic: ${message}`);
  }

  async function digestHex(bytes) {
    const buffer = bytes instanceof ArrayBuffer ? bytes : bytes.buffer;
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))]
      .map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function polygonArea(polygon) {
    let doubleArea = 0;
    for (let index = 0; index < polygon.length; index += 1) {
      const current = polygon[index];
      const next = polygon[(index + 1) % polygon.length];
      doubleArea += current.x * next.y - next.x * current.y;
    }
    return Math.abs(doubleArea) / 2;
  }

  function clipHalfPlane(polygon, a, b, c) {
    const clipped = [];
    if (!polygon.length) return clipped;
    const inside = coordinate => a * coordinate.x + b * coordinate.y <= c + 1e-7;
    const intersection = (from, to) => {
      const denominator = a * (to.x - from.x) + b * (to.y - from.y);
      const amount = Math.abs(denominator) < 1e-9 ? 0 : (c - a * from.x - b * from.y) / denominator;
      return {
        x: from.x + (to.x - from.x) * amount,
        y: from.y + (to.y - from.y) * amount
      };
    };

    for (let index = 0; index < polygon.length; index += 1) {
      const current = polygon[index];
      const next = polygon[(index + 1) % polygon.length];
      const currentInside = inside(current);
      const nextInside = inside(next);
      if (currentInside) clipped.push(current);
      if (currentInside !== nextInside) clipped.push(intersection(current, next));
    }
    return clipped;
  }

  function createPartition(focusedIndex, power) {
    return sites.map((site, index) => {
      let polygon = [
        { x: 0, y: 0 }, { x: logicalWidth, y: 0 },
        { x: logicalWidth, y: logicalHeight }, { x: 0, y: logicalHeight }
      ];
      const ownWeight = index === focusedIndex ? power : 0;
      for (const other of sites) {
        if (other.index === index || !polygon.length) continue;
        const otherWeight = other.index === focusedIndex ? power : 0;
        const a = 2 * (other.x - site.x);
        const b = 2 * (other.y - site.y);
        const c = other.x ** 2 + other.y ** 2 - otherWeight - site.x ** 2 - site.y ** 2 + ownWeight;
        polygon = clipHalfPlane(polygon, a, b, c);
      }
      return polygon;
    });
  }

  function geometryChecksum(polygons) {
    let checksum = 2166136261;
    polygons.forEach((polygon, regionIndex) => {
      checksum = Math.imul(checksum ^ regionIndex ^ polygon.length, 16777619) >>> 0;
      polygon.forEach(coordinate => {
        checksum = Math.imul(checksum ^ Math.round(coordinate.x * 100), 16777619) >>> 0;
        checksum = Math.imul(checksum ^ Math.round(coordinate.y * 100), 16777619) >>> 0;
      });
    });
    return checksum >>> 0;
  }

  function nearestSite(x, y, focusedIndex = -1, power = 0) {
    let bestIndex = 0;
    let bestScore = Infinity;
    sites.forEach((site, index) => {
      const weight = index === focusedIndex ? power : 0;
      const score = (site.x - x) ** 2 + (site.y - y) ** 2 - weight;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    return bestIndex;
  }

  function auditPartition() {
    const columns = 80;
    const rows = 45;
    const assignments = new Uint8Array(columns * rows);
    const regionCounts = new Uint16Array(sites.length);
    const adjacency = new Set();
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        const owner = nearestSite((column + .5) / columns * logicalWidth, (row + .5) / rows * logicalHeight);
        assignments[index] = owner;
        regionCounts[owner] += 1;
        if (column > 0 && assignments[index - 1] !== owner) {
          adjacency.add([assignments[index - 1], owner].sort((a, b) => a - b).join(':'));
        }
        if (row > 0 && assignments[index - columns] !== owner) {
          adjacency.add([assignments[index - columns], owner].sort((a, b) => a - b).join(':'));
        }
      }
    }
    const neighborCounts = new Uint8Array(sites.length);
    adjacency.forEach(pair => {
      const [a, b] = pair.split(':').map(Number);
      neighborCounts[a] += 1;
      neighborCounts[b] += 1;
    });
    state.partitionCoverageCellCount = regionCounts.reduce((sum, count) => sum + count, 0);
    state.partitionRegionCount = regionCounts.filter(count => count > 0).length;
    state.adjacencyEdgeCount = adjacency.size;
    state.minimumNeighborCount = Math.min(...neighborCounts);
  }

  function classifyEvidence(channelRed, channelGreen, channelBlue) {
    const luma = (channelRed * .2126 + channelGreen * .7152 + channelBlue * .0722) / 255;
    const maximum = Math.max(channelRed, channelGreen, channelBlue);
    const minimum = Math.min(channelRed, channelGreen, channelBlue);
    const colorfulness = maximum === 0 ? 0 : (maximum - minimum) / maximum;
    let label = 'Dune sediment';
    if (luma < .31) label = 'Basalt shelf';
    else if (channelBlue > channelRed * 1.07 && channelGreen > channelRed * 1.12) label = 'Tidal water';
    else if (channelGreen > channelRed * 1.03 && channelGreen > channelBlue * .96 && channelRed > channelBlue * .76) label = 'Salt marsh';
    else if (channelRed > channelBlue * 1.12 && luma < .58) label = 'Wrack line';
    const confidence = Math.round(boundValue(.67 + colorfulness * .21 + Math.abs(luma - .52) * .18, .7, .97) * 100);
    return { label, confidence, luma, colorfulness };
  }

  function updateCurrentGeometry() {
    const polygons = createPartition(state.focusIndex, state.focusPower);
    const totalArea = polygons.reduce((sum, polygon) => sum + polygonArea(polygon), 0);
    const focusArea = polygonArea(polygons[state.focusIndex]);
    const baseArea = sites[state.focusIndex].baseArea || focusArea;
    state.currentPartitionArea = totalArea;
    state.focusExpansionRatio = focusArea / baseArea;
    state.maximumFocusExpansionRatio = Math.max(state.maximumFocusExpansionRatio, state.focusExpansionRatio);
    state.currentGeometryChecksum = geometryChecksum(polygons);
    return polygons;
  }

  function syncInterface() {
    const site = sites[state.focusIndex];
    const evidence = site.evidence;
    if (!evidence) return;
    focusIndexOutput.textContent = String(site.index + 1).padStart(2, '0');
    focusStatusOutput.textContent = state.focusIndex === state.selectedIndex ? 'Evidence locked' : 'Focused evidence';
    focusLabelOutput.textContent = evidence.label;
    focusConfidenceOutput.textContent = `${evidence.confidence}% match`;
    focusAreaOutput.textContent = `${state.focusExpansionRatio.toFixed(2)}× area`;
    surface.setAttribute('aria-label', `${evidence.label}, region ${site.index + 1} of ${sites.length}, ${evidence.confidence} percent match. Move or drag to enlarge the nearest region; arrow keys move, Enter locks, Home resets.`);
    stage.dataset.focusClass = evidence.label.toLowerCase().replaceAll(' ', '-');
    stage.dataset.focusIndex = String(state.focusIndex);
    stage.dataset.selectedIndex = String(state.selectedIndex);
    ledger.value = JSON.stringify({
      selectedIndex: state.selectedIndex,
      focusIndex: state.focusIndex,
      focusClass: evidence.label,
      focusConfidence: evidence.confidence,
      focusExpansionRatio: Number(state.focusExpansionRatio.toFixed(4)),
      inputCount: state.inputCount,
      pointerMoves: state.pointerMoveCount,
      captures: state.pointerCaptureCount,
      releases: state.pointerReleaseCount,
      keyboardInputs: state.keyboardInputCount,
      buttonActivations: state.buttonActivationCount,
      assetSha256: state.assetSha256,
      sampledPixelSha256: state.sampledPixelSha256,
      adjacencyEdges: state.adjacencyEdgeCount,
      runtimeAssert: stage.dataset.runtimeAssert === 'true'
    });
  }

  function syncCanvasSize() {
    if (!sketch || !state.p5InstanceReady) return;
    const canvasWidth = Math.max(1, stage.clientWidth);
    const canvasHeight = Math.max(1, stage.clientHeight);
    if (sketch.width === canvasWidth && sketch.height === canvasHeight) return;
    sketch.resizeCanvas(canvasWidth, canvasHeight, true);
    state.resizeCount += 1;
    dirty = true;
  }

  function requestDraw() {
    dirty = true;
    if (sketch && state.evidenceReady) sketch.redraw();
  }

  function drawPolygonPath(context, polygon) {
    context.beginPath();
    polygon.forEach((coordinate, index) => {
      if (index === 0) context.moveTo(coordinate.x, coordinate.y);
      else context.lineTo(coordinate.x, coordinate.y);
    });
    context.closePath();
  }

  function drawMosaic(p) {
    if (!habitatImage || !state.evidenceReady) return;
    const polygons = updateCurrentGeometry();
    const scaleX = p.width / logicalWidth;
    const scaleY = p.height / logicalHeight;
    p.push();
    p.scale(scaleX, scaleY);
    const context = p.drawingContext;
    polygons.forEach((polygon, index) => {
      if (!polygon.length) return;
      const site = sites[index];
      const evidence = site.evidence;
      context.save();
      drawPolygonPath(context, polygon);
      context.clip();
      context.globalAlpha = index === state.focusIndex ? 1 : .77;
      p.image(habitatImage, 0, 0, logicalWidth, logicalHeight, 0, cropSourceY, 960, cropSourceHeight);
      context.globalAlpha = 1;
      const overlayAlpha = index === state.focusIndex ? 9 : index === state.selectedIndex ? 32 : 66;
      p.noStroke();
      p.fill(evidence.red, evidence.green, evidence.blue, overlayAlpha);
      p.rect(0, 0, logicalWidth, logicalHeight);
      if (index !== state.focusIndex) {
        p.fill(2, 14, 12, 22);
        p.rect(0, 0, logicalWidth, logicalHeight);
      }
      context.restore();
    });

    p.noFill();
    polygons.forEach((polygon, index) => {
      if (!polygon.length) return;
      p.stroke(index === state.focusIndex ? '#efffb2' : '#eef2df8c');
      p.strokeWeight(index === state.focusIndex ? 1.45 : .62);
      p.beginShape();
      polygon.forEach(coordinate => p.vertex(coordinate.x, coordinate.y));
      p.endShape(p.CLOSE);
    });

    sites.forEach((site, index) => {
      const isFocused = index === state.focusIndex;
      p.noStroke();
      p.fill(isFocused ? '#efffb2' : '#07100fc7');
      p.circle(site.x, site.y, isFocused ? 10 : 6);
      p.fill(isFocused ? '#132018' : '#f5f4e8');
      p.textAlign(p.CENTER, p.CENTER);
      p.textFont('ui-monospace, SFMono-Regular, Menlo, monospace');
      p.textStyle(p.BOLD);
      p.textSize(isFocused ? 4.2 : 3.3);
      p.text(String(index + 1).padStart(2, '0'), site.x, site.y + .2);
    });
    p.pop();
    state.p5CompletedDrawCount += 1;
    dirty = false;
    syncInterface();
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
  }

  const assetReady = fetchAndDecodeAsset();
  let resolveP5Ready;
  let rejectP5Ready;
  const p5Ready = new Promise((resolve, reject) => {
    resolveP5Ready = resolve;
    rejectP5Ready = reject;
  });

  sketch = new p5(p => {
    p.setup = () => {
      try {
        p.pixelDensity(1);
        const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
        canvas.parent(surface);
        p.noLoop();
        state.p5InstanceReady = p instanceof p5;
        state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
        resolveP5Ready();
      } catch (error) {
        rejectP5Ready(error);
      }
    };

    p.draw = () => {
      state.p5DrawCount += 1;
      p.background('#07100f');
      drawMosaic(p);
    };
  }, surface);

  function loadP5Image() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(assetUrl, loadedImage => resolve(loadedImage), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  async function prepareEvidence() {
    await Promise.all([assetReady, p5Ready]);
    habitatImage = await loadP5Image();
    state.p5ImageDecoded = habitatImage instanceof p5.Image;
    state.p5ImageClass = state.p5ImageDecoded ? 'p5.Image' : null;
    state.p5ImageWidth = habitatImage.width;
    state.p5ImageHeight = habitatImage.height;
    habitatImage.loadPixels();
    state.p5ImagePixelLength = habitatImage.pixels.length;
    invariant(state.p5ImageDecoded && habitatImage.width === 960 && habitatImage.height === 640
      && habitatImage.pixels.length === 960 * 640 * 4, 'p5 did not decode the committed 960x640 survey image');

    const sampledBytes = new Uint8Array(sites.length * samplesPerSite * 4);
    const distinctColors = new Set();
    let sampleOffset = 0;
    let evidenceChecksum = 2166136261;
    for (const site of sites) {
      const centerX = Math.round(site.u * 959);
      const centerY = Math.round(cropSourceY + site.v * (cropSourceHeight - 1));
      let redChannelTotal = 0;
      let greenChannelTotal = 0;
      let blueChannelTotal = 0;
      for (let y = centerY - sampleRadius; y <= centerY + sampleRadius; y += 1) {
        for (let x = centerX - sampleRadius; x <= centerX + sampleRadius; x += 1) {
          const sourceX = boundValue(x, 0, 959);
          const sourceY = boundValue(y, 0, 639);
          const pixelOffset = (sourceY * 960 + sourceX) * 4;
          const channelRed = habitatImage.pixels[pixelOffset];
          const channelGreen = habitatImage.pixels[pixelOffset + 1];
          const channelBlue = habitatImage.pixels[pixelOffset + 2];
          const channelAlpha = habitatImage.pixels[pixelOffset + 3];
          sampledBytes[sampleOffset] = channelRed;
          sampledBytes[sampleOffset + 1] = channelGreen;
          sampledBytes[sampleOffset + 2] = channelBlue;
          sampledBytes[sampleOffset + 3] = channelAlpha;
          sampleOffset += 4;
          redChannelTotal += channelRed;
          greenChannelTotal += channelGreen;
          blueChannelTotal += channelBlue;
          distinctColors.add(`${channelRed >> 3}:${channelGreen >> 3}:${channelBlue >> 3}`);
        }
      }
      const averageRed = Math.round(redChannelTotal / samplesPerSite);
      const averageGreen = Math.round(greenChannelTotal / samplesPerSite);
      const averageBlue = Math.round(blueChannelTotal / samplesPerSite);
      site.evidence = {
        red: averageRed,
        green: averageGreen,
        blue: averageBlue,
        ...classifyEvidence(averageRed, averageGreen, averageBlue)
      };
      evidenceChecksum = Math.imul(evidenceChecksum ^ averageRed ^ (averageGreen << 8)
        ^ (averageBlue << 16) ^ site.evidence.confidence, 16777619) >>> 0;
    }
    state.sampledPixelCount = sites.length * samplesPerSite;
    state.sampledByteLength = sampledBytes.byteLength;
    state.sampledPixelSha256 = await digestHex(sampledBytes);
    state.distinctSampleColorCount = distinctColors.size;
    state.evidenceSiteCount = sites.length;
    state.evidenceClasses = [...new Set(sites.map(site => site.evidence.label))].sort();
    state.evidenceClassCount = state.evidenceClasses.length;
    state.evidenceChecksum = evidenceChecksum >>> 0;

    const baseline = createPartition(-1, 0);
    baseline.forEach((polygon, index) => { sites[index].baseArea = polygonArea(polygon); });
    state.initialGeometryChecksum = geometryChecksum(createPartition(initialIndex, focusPower));
    state.currentGeometryChecksum = state.initialGeometryChecksum;
    auditPartition();
    state.evidenceReady = true;
    updateCurrentGeometry();
    state.initialStaticConfirmed = state.currentGeometryChecksum === state.initialGeometryChecksum
      && state.focusIndex === initialIndex
      && state.selectedIndex === initialIndex
      && state.focusPower === focusPower;
    dirty = true;
    requestDraw();
  }

  const evidenceReady = prepareEvidence();

  function recordTrustedInput(event, kind) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.humanInputCausalityCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = kind;
    return true;
  }

  function animateFocus(nextIndex) {
    const targetIndex = (nextIndex + sites.length) % sites.length;
    const previousIndex = state.focusIndex;
    const startPower = previousIndex === targetIndex ? state.focusPower : 0;
    state.focusIndex = targetIndex;
    cancelAnimationFrame(focusAnimationFrame);
    if (reducedMotionQuery.matches) {
      state.focusPower = focusPower;
      state.animationSettled = true;
      state.focusAnimationSettledCount += 1;
      requestDraw();
      return;
    }
    const start = performance.now();
    const duration = 320;
    state.focusAnimationCount += 1;
    state.animationSettled = false;
    const tick = now => {
      const progress = unitValue((now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      state.focusPower = startPower + (focusPower - startPower) * eased;
      state.focusAnimationFrameCount += 1;
      requestDraw();
      if (progress < 1) focusAnimationFrame = requestAnimationFrame(tick);
      else {
        state.focusPower = focusPower;
        state.animationSettled = true;
        state.focusAnimationSettledCount += 1;
        requestDraw();
      }
    };
    focusAnimationFrame = requestAnimationFrame(tick);
  }

  function lockFocus() {
    state.selectedIndex = state.focusIndex;
    state.lockCount += 1;
    syncInterface();
  }

  function resetFocus() {
    state.selectedIndex = initialIndex;
    state.resetCount += 1;
    animateFocus(initialIndex);
  }

  function pointerPosition(event) {
    const bounds = surface.getBoundingClientRect();
    return {
      u: unitValue((event.clientX - bounds.left) / bounds.width),
      v: unitValue((event.clientY - bounds.top) / bounds.height)
    };
  }

  function focusAt(coordinate, kind) {
    const nextIndex = nearestSite(coordinate.u * logicalWidth, coordinate.v * logicalHeight);
    if (nextIndex !== state.focusIndex) {
      if (kind === 'drag') state.dragFocusCount += 1;
      else state.hoverFocusCount += 1;
      animateFocus(nextIndex);
    }
  }

  surface.addEventListener('pointerenter', event => {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return;
    }
    state.pointerEnterCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
  });

  surface.addEventListener('pointerdown', event => {
    if (!recordTrustedInput(event, `${event.pointerType || 'mouse'}-down`)) return;
    const coordinate = pointerPosition(event);
    state.pointerDownCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    state.activePointerId = event.pointerId;
    state.dragStartU = coordinate.u;
    state.dragStartV = coordinate.v;
    state.dragDistance = 0;
    pointerStart = coordinate;
    surface.setPointerCapture(event.pointerId);
    state.pointerCaptured = surface.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    focusAt(coordinate, 'drag');
    event.preventDefault();
  });

  surface.addEventListener('pointermove', event => {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return;
    }
    const coordinate = pointerPosition(event);
    state.pointerMoveCount += 1;
    state.inputCount += 1;
    state.humanInputCausalityCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = state.activePointerId === event.pointerId ? `${event.pointerType || 'mouse'}-drag` : 'mouse-hover';
    state.lastPointerType = event.pointerType || 'mouse';
    if (pointerStart && state.activePointerId === event.pointerId) {
      state.dragDistance = Math.max(state.dragDistance, Math.hypot(coordinate.u - pointerStart.u, coordinate.v - pointerStart.v));
      focusAt(coordinate, 'drag');
    } else {
      focusAt(coordinate, 'hover');
    }
  });

  function releasePointer(event) {
    if (state.activePointerId !== event.pointerId) return;
    if (!recordTrustedInput(event, `${event.pointerType || 'mouse'}-release`)) return;
    state.pointerReleaseCount += 1;
    if (surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    pointerStart = null;
    lockFocus();
    event.preventDefault();
  }

  surface.addEventListener('pointerup', releasePointer);
  surface.addEventListener('pointercancel', event => {
    if (state.activePointerId !== event.pointerId) return;
    if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
    state.pointerCaptured = false;
    state.activePointerId = null;
    pointerStart = null;
    animateFocus(state.selectedIndex);
  });

  surface.addEventListener('pointerleave', () => {
    if (state.activePointerId === null) animateFocus(state.selectedIndex);
  });

  surface.addEventListener('keydown', event => {
    const keyActions = {
      ArrowLeft: () => animateFocus(state.focusIndex - 1),
      ArrowUp: () => animateFocus(state.focusIndex - 1),
      ArrowRight: () => animateFocus(state.focusIndex + 1),
      ArrowDown: () => animateFocus(state.focusIndex + 1),
      Enter: lockFocus,
      ' ': lockFocus,
      Home: resetFocus,
      Escape: resetFocus
    };
    const action = keyActions[event.key];
    if (!action || !recordTrustedInput(event, `keyboard-${event.key}`)) return;
    state.keyboardInputCount += 1;
    action();
    event.preventDefault();
  });

  controls.forEach(button => {
    button.addEventListener('click', event => {
      if (!recordTrustedInput(event, `button-${button.dataset.focusAction}`)) return;
      state.buttonActivationCount += 1;
      const action = button.dataset.focusAction;
      if (action === 'previous') animateFocus(state.focusIndex - 1);
      else if (action === 'next') animateFocus(state.focusIndex + 1);
      else if (action === 'lock') lockFocus();
      else if (action === 'reset') resetFocus();
      surface.focus({ preventScroll: true });
    });
  });

  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      syncCanvasSize();
      requestDraw();
    });
  }).observe(stage);

  function render() {
    state.renderCount += 1;
    syncCanvasSize();
    if (dirty && state.evidenceReady && sketch) sketch.redraw();
  }

  const ready = Promise.all([evidenceReady, document.fonts.ready]).then(() => {
    state.ready = true;
    render();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = surface.querySelector('canvas');
    const realP5 = sketch instanceof p5
      && state.p5InstanceReady
      && state.p5CanvasReady
      && canvas instanceof HTMLCanvasElement
      && sketch.drawingContext === canvas.getContext('2d')
      && sketch.width === stage.clientWidth
      && sketch.height === stage.clientHeight
      && state.p5CompletedDrawCount > 0;
    const honestInteraction = state.task === 'human-operated-coastal-image-evidence-focus-and-classification'
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
      && state.humanInputCausalityCount === state.inputCount
      && state.pointerReleaseCaptureCount <= state.pointerCaptureCount
      && state.lastInputTrusted !== false;
    const realAsset = state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetByteLength === 360838
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
    const pixelEvidence = state.evidenceReady
      && state.evidenceSiteCount === sites.length
      && state.sampledPixelCount === sites.length * samplesPerSite
      && state.sampledByteLength === state.sampledPixelCount * 4
      && typeof state.sampledPixelSha256 === 'string'
      && state.sampledPixelSha256.length === 64
      && state.distinctSampleColorCount > 200
      && state.evidenceClassCount >= 3
      && state.evidenceClassCount <= 5
      && state.evidenceClasses.length === state.evidenceClassCount
      && state.evidenceChecksum > 0
      && sites.every(site => site.evidence && site.evidence.confidence >= 70 && site.evidence.confidence <= 97);
    const validPartition = state.partitionCoverageCellCount === state.partitionExpectedCellCount
      && state.partitionRegionCount === sites.length
      && state.adjacencyEdgeCount >= 16
      && state.minimumNeighborCount >= 2
      && Math.abs(state.currentPartitionArea - logicalWidth * logicalHeight) < .05
      && state.focusExpansionRatio > 1.18
      && state.currentGeometryChecksum > 0;
    const humanResult = state.inputCount === 0
      ? state.selectedIndex === initialIndex
        && state.focusIndex === initialIndex
        && state.currentGeometryChecksum === state.initialGeometryChecksum
      : state.humanInputCausalityCount > 0
        && (state.pointerMoveCount > 0 || state.keyboardInputCount > 0 || state.buttonActivationCount > 0)
        && state.maximumFocusExpansionRatio > 1.18;
    const result = Boolean(state.ready
      && realP5
      && honestInteraction
      && realAsset
      && pixelEvidence
      && validPartition
      && humanResult
      && window.__PREVIEW_META__?.id === state.id
      && window.__PREVIEW_META__?.library === state.claimedLibrary
      && window.__PREVIEW_META__?.renderer === 'canvas2d'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.dataset.previewMechanism === 'p5-pixel-evidence-weighted-voronoi-focus');
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
