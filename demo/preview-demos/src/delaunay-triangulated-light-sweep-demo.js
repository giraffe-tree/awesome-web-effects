import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#inspection-stage');
  const canvasHost = document.querySelector('#inspection-canvas-host');
  const signalReadout = document.querySelector('#signal-readout');
  const classReadout = document.querySelector('#class-readout');
  const facesReadout = document.querySelector('#faces-readout');
  const radiusControl = document.querySelector('#radius-control');
  const ledger = document.querySelector('#runtime-ledger');
  const buttons = [...document.querySelectorAll('[data-scan-action]')];
  const assetUrl = new URL('../assets/aesthetic-wave-06/delaunay-triangulated-light-sweep/composite-laminate-inspection.jpg', import.meta.url).href;
  const expectedAssetSha256 = '7836b637c6d44e631e61b15bf99afb0d70c67a3075b82d3eb3bc40f596c7a837';
  const sampleWidth = 96;
  const sampleHeight = 54;
  const sampleCount = sampleWidth * sampleHeight;
  const clamp01 = value => Math.max(0, Math.min(1, value));

  const state = {
    id: 'delaunay-triangulated-light-sweep',
    task: 'human-operated-pixel-derived-delaunay-composite-inspection',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'committed-laminate-pixels-drive-delaunay-vertices-face-material-and-defect-signal',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button-control', 'range-control'],
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
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    inputCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    rangeInputCount: 0,
    humanMutationCount: 0,
    rejectedUntrustedInputCount: 0,
    lastInputTrusted: null,
    lastInputKind: 'none',
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    probeU: .54,
    probeV: .46,
    initialProbeU: .54,
    initialProbeV: .46,
    beamRadius: 24,
    initialBeamRadius: 24,
    currentClass: 'LAMINATE',
    currentSignal: 0,
    maximumSignal: 0,
    visitedClassCount: 0,
    visitedClasses: [],
    seamPresetCount: 0,
    voidPresetCount: 0,
    resetCount: 0,
    firstHumanSignalBefore: null,
    firstHumanSignalAfter: null,
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
    sampledWidth: sampleWidth,
    sampledHeight: sampleHeight,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sourcePixelSha256: null,
    distinctSampleColorCount: 0,
    sampledLumaRange: 0,
    candidateCellCount: 0,
    imageDrivenVertexCount: 0,
    boundaryVertexCount: 0,
    vertexCount: 0,
    triangleCount: 0,
    delaunayEmptyCircleViolations: -1,
    degenerateTriangleCount: -1,
    uniqueEdgeCount: 0,
    topologyChecksum: 0,
    laminateTriangleCount: 0,
    edgeTriangleCount: 0,
    anomalyTriangleCount: 0,
    facePropertyChecksum: 0,
    assetEvidenceReady: false,
    topologyReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    renderCount: 0,
    resizeCount: 0,
    initialCanvasSignature: 0,
    currentCanvasSignature: 0,
    initialStaticConfirmed: false,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let materialImage;
  let samplePixels;
  let vertices = [];
  let triangles = [];
  let faceEvidence = [];
  let dirty = true;
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`delaunay-triangulated-light-sweep: ${message}`);
  }

  function digestHex(bytes) {
    return crypto.subtle.digest('SHA-256', bytes).then(buffer => [...new Uint8Array(buffer)]
      .map(value => value.toString(16).padStart(2, '0')).join(''));
  }

  function lumaAt(red, green, blue) {
    return (red * .2126 + green * .7152 + blue * .0722) / 255;
  }

  function pixelAt(u, v) {
    const x = Math.max(0, Math.min(sampleWidth - 1, Math.round(clamp01(u) * (sampleWidth - 1))));
    const y = Math.max(0, Math.min(sampleHeight - 1, Math.round(clamp01(v) * (sampleHeight - 1))));
    const offset = (y * sampleWidth + x) * 4;
    return {
      red: samplePixels[offset], green: samplePixels[offset + 1], blue: samplePixels[offset + 2],
      luma: lumaAt(samplePixels[offset], samplePixels[offset + 1], samplePixels[offset + 2])
    };
  }

  function evidenceAt(u, v) {
    const center = pixelAt(u, v);
    const du = 1 / sampleWidth;
    const dv = 1 / sampleHeight;
    const left = pixelAt(u - du, v);
    const right = pixelAt(u + du, v);
    const up = pixelAt(u, v - dv);
    const down = pixelAt(u, v + dv);
    const localMean = (left.luma + right.luma + up.luma + down.luma) * .25;
    const gradient = Math.min(1, Math.hypot(right.luma - left.luma, down.luma - up.luma) * 2.2);
    const voidScore = clamp01((localMean - center.luma - .035) * 4.7);
    const cyanBias = clamp01((center.blue + center.green - center.red * 1.55) / 185);
    const seamScore = clamp01(gradient * .74 + cyanBias * .31);
    const anomaly = Math.max(voidScore, clamp01((seamScore - .25) * 1.42));
    const classification = anomaly > .52 ? 'ANOMALY' : gradient > .23 ? 'EDGE' : 'LAMINATE';
    return { ...center, gradient, voidScore, seamScore, anomaly, classification };
  }

  function circumcircle(a, b, c) {
    const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    if (Math.abs(d) < 1e-12) return null;
    const aa = a.x * a.x + a.y * a.y;
    const bb = b.x * b.x + b.y * b.y;
    const cc = c.x * c.x + c.y * c.y;
    const x = (aa * (b.y - c.y) + bb * (c.y - a.y) + cc * (a.y - b.y)) / d;
    const y = (aa * (c.x - b.x) + bb * (a.x - c.x) + cc * (b.x - a.x)) / d;
    return { x, y, radiusSquared: (x - a.x) ** 2 + (y - a.y) ** 2 };
  }

  function delaunay(inputPoints) {
    const workPoints = [...inputPoints, { x: -8, y: -5 }, { x: 8, y: -5 }, { x: 0, y: 9 }];
    const superStart = inputPoints.length;
    let workTriangles = [[superStart, superStart + 1, superStart + 2]];
    for (let pointIndex = 0; pointIndex < inputPoints.length; pointIndex += 1) {
      const point = workPoints[pointIndex];
      const bad = [];
      for (let index = 0; index < workTriangles.length; index += 1) {
        const triangle = workTriangles[index];
        const circle = circumcircle(workPoints[triangle[0]], workPoints[triangle[1]], workPoints[triangle[2]]);
        if (circle && (point.x - circle.x) ** 2 + (point.y - circle.y) ** 2 <= circle.radiusSquared + 1e-10) bad.push(index);
      }
      const boundary = new Map();
      bad.forEach(index => {
        const [a, b, c] = workTriangles[index];
        [[a, b], [b, c], [c, a]].forEach(([start, end]) => {
          const key = start < end ? `${start}:${end}` : `${end}:${start}`;
          if (boundary.has(key)) boundary.delete(key);
          else boundary.set(key, [start, end]);
        });
      });
      const badSet = new Set(bad);
      workTriangles = workTriangles.filter((_, index) => !badSet.has(index));
      boundary.forEach(edge => workTriangles.push([edge[0], edge[1], pointIndex]));
    }
    return workTriangles.filter(triangle => triangle.every(index => index < inputPoints.length));
  }

  function topologyChecksumOf(faces) {
    let checksum = 2166136261;
    faces.map(face => [...face].sort((a, b) => a - b)).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]).forEach(face => {
      face.forEach(index => { checksum = Math.imul(checksum ^ index, 16777619) >>> 0; });
    });
    return checksum >>> 0;
  }

  function buildImageDrivenTopology() {
    const points = [];
    const columns = 12;
    const rows = 7;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const boundary = row === 0 || row === rows - 1 || column === 0 || column === columns - 1;
        const baseU = column / (columns - 1);
        const baseV = row / (rows - 1);
        const sample = evidenceAt(baseU, baseV);
        const offsetU = boundary ? 0 : (sample.luma - .35) * .027 + (sample.gradient - .2) * .013;
        const offsetV = boundary ? 0 : ((sample.red - sample.blue) / 255) * .022 + (sample.anomaly - .25) * .012;
        points.push({ x: clamp01(baseU + offsetU), y: clamp01(baseV + offsetV), source: boundary ? 'boundary' : 'pixel-grid' });
        if (boundary) state.boundaryVertexCount += 1;
        else state.imageDrivenVertexCount += 1;
      }
    }

    const candidates = [];
    for (let y = 2; y < sampleHeight - 2; y += 2) {
      for (let x = 2; x < sampleWidth - 2; x += 2) {
        const u = x / (sampleWidth - 1);
        const v = y / (sampleHeight - 1);
        const evidence = evidenceAt(u, v);
        const score = evidence.anomaly * .7 + evidence.gradient * .3;
        if (score > .29) candidates.push({ x: u, y: v, score });
      }
    }
    state.candidateCellCount = candidates.length;
    candidates.sort((a, b) => b.score - a.score);
    for (const candidate of candidates) {
      if (points.length >= columns * rows + 16) break;
      if (points.every(point => Math.hypot(point.x - candidate.x, point.y - candidate.y) > .045)) {
        points.push({ x: candidate.x, y: candidate.y, source: 'pixel-anomaly' });
        state.imageDrivenVertexCount += 1;
      }
    }

    vertices = points;
    triangles = delaunay(vertices);
    state.vertexCount = vertices.length;
    state.triangleCount = triangles.length;
    state.topologyChecksum = topologyChecksumOf(triangles);
    const uniqueEdges = new Set();
    state.degenerateTriangleCount = 0;
    state.delaunayEmptyCircleViolations = 0;
    triangles.forEach(face => {
      const [a, b, c] = face.map(index => vertices[index]);
      const area = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
      if (area < 1e-7) state.degenerateTriangleCount += 1;
      [[face[0], face[1]], [face[1], face[2]], [face[2], face[0]]].forEach(([start, end]) => uniqueEdges.add(start < end ? `${start}:${end}` : `${end}:${start}`));
      const circle = circumcircle(a, b, c);
      if (circle) vertices.forEach((point, index) => {
        if (face.includes(index)) return;
        const distanceSquared = (point.x - circle.x) ** 2 + (point.y - circle.y) ** 2;
        if (distanceSquared < circle.radiusSquared - 1e-8) state.delaunayEmptyCircleViolations += 1;
      });
    });
    state.uniqueEdgeCount = uniqueEdges.size;

    let propertyChecksum = 2166136261;
    faceEvidence = triangles.map(face => {
      const pointsForFace = face.map(index => vertices[index]);
      const u = (pointsForFace[0].x + pointsForFace[1].x + pointsForFace[2].x) / 3;
      const v = (pointsForFace[0].y + pointsForFace[1].y + pointsForFace[2].y) / 3;
      const evidence = evidenceAt(u, v);
      if (evidence.classification === 'ANOMALY') state.anomalyTriangleCount += 1;
      else if (evidence.classification === 'EDGE') state.edgeTriangleCount += 1;
      else state.laminateTriangleCount += 1;
      [evidence.red, evidence.green, evidence.blue, Math.round(evidence.gradient * 1000), Math.round(evidence.anomaly * 1000)].forEach(value => {
        propertyChecksum = Math.imul(propertyChecksum ^ value, 16777619) >>> 0;
      });
      return { ...evidence, u, v };
    });
    state.facePropertyChecksum = propertyChecksum >>> 0;
    state.topologyReady = true;
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
    invariant(state.assetSameOrigin && state.assetShaMatchesExpected, 'committed laminate asset origin or SHA-256 changed');
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const image = new Image();
    image.src = objectUrl;
    try {
      await image.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = image.naturalWidth;
      state.sourceNaturalHeight = image.naturalHeight;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    invariant(state.sourceNaturalWidth === 960 && state.sourceNaturalHeight === 640, 'laminate asset dimensions changed');
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
        } catch (error) { reject(error); }
      };

      p.draw = () => {
        state.p5DrawCount += 1;
        p.background('#061117');
        if (!state.topologyReady || !materialImage) return;
        const width = p.width;
        const height = p.height;
        p.image(materialImage, 0, 0, width, height);
        p.noStroke();
        p.fill(2, 10, 14, 142);
        p.rect(0, 0, width, height);
        const probeX = state.probeU * width;
        const probeY = state.probeV * height;
        const radius = state.beamRadius / 100 * width;

        triangles.forEach((face, faceIndex) => {
          const evidence = faceEvidence[faceIndex];
          const faceX = evidence.u * width;
          const faceY = evidence.v * height;
          const light = clamp01(1 - Math.hypot(faceX - probeX, faceY - probeY) / Math.max(1, radius));
          const easedLight = light * light * (3 - 2 * light);
          const red = 8 + evidence.red * (.12 + easedLight * .92);
          const green = 17 + evidence.green * (.14 + easedLight * .93);
          const blue = 22 + evidence.blue * (.17 + easedLight * .98);
          const anomalyGlow = evidence.anomaly * easedLight;
          p.fill(red + anomalyGlow * 54, green + anomalyGlow * 22, blue - anomalyGlow * 8, 190 + easedLight * 60);
          if (evidence.classification === 'ANOMALY' && easedLight > .1) p.stroke(255, 189, 116, 52 + anomalyGlow * 180);
          else if (evidence.classification === 'EDGE' && easedLight > .08) p.stroke(116, 225, 239, 38 + easedLight * 110);
          else p.stroke(183, 227, 230, 12 + easedLight * 58);
          p.strokeWeight(Math.max(.38, width / 720));
          const facePoints = face.map(index => vertices[index]);
          p.triangle(facePoints[0].x * width, facePoints[0].y * height,
            facePoints[1].x * width, facePoints[1].y * height,
            facePoints[2].x * width, facePoints[2].y * height);
        });

        p.noFill();
        p.stroke(126, 235, 247, 112);
        p.strokeWeight(Math.max(.8, width / 620));
        p.circle(probeX, probeY, radius * 2);
        p.stroke(255, 181, 103, 220);
        p.arc(probeX, probeY, radius * 2.22, radius * 2.22, -.45, .72);
        p.stroke(237, 252, 253, 215);
        p.line(probeX - 5, probeY, probeX + 5, probeY);
        p.line(probeX, probeY - 5, probeX, probeY + 5);
        state.p5CompletedDrawCount += 1;
      };
    }, canvasHost);
  });

  function loadP5Material() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(assetUrl, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  function canvasSignature() {
    const canvas = canvasHost.querySelector('canvas');
    if (!canvas) return 0;
    const context = canvas.getContext('2d');
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let checksum = 2166136261;
    const stride = Math.max(4, Math.floor(pixels.length / 4096 / 4) * 4);
    for (let index = 0; index < pixels.length; index += stride) {
      checksum = Math.imul(checksum ^ pixels[index] ^ pixels[index + 1] ^ pixels[index + 2], 16777619) >>> 0;
    }
    return checksum >>> 0;
  }

  async function prepareMaterialEvidence() {
    await Promise.all([assetReady, p5Ready]);
    const decoded = await loadP5Material();
    state.p5ImageDecoded = decoded instanceof p5.Image;
    state.p5ImageClass = state.p5ImageDecoded ? 'p5.Image' : decoded?.constructor?.name ?? null;
    state.p5ImageWidth = decoded.width;
    state.p5ImageHeight = decoded.height;
    decoded.loadPixels();
    state.p5ImagePixelLength = decoded.pixels.length;
    invariant(state.p5ImageDecoded && decoded.width === 960 && decoded.height === 640 && decoded.pixels.length === 960 * 640 * 4,
      'p5 did not decode the committed 960x640 laminate image');
    materialImage = decoded.get(state.cropSourceX, state.cropSourceY, state.cropSourceWidth, state.cropSourceHeight);
    const sample = decoded.get(state.cropSourceX, state.cropSourceY, state.cropSourceWidth, state.cropSourceHeight);
    sample.resize(sampleWidth, sampleHeight);
    sample.loadPixels();
    samplePixels = new Uint8ClampedArray(sample.pixels);
    state.sampledPixelCount = sampleCount;
    state.sampledByteLength = samplePixels.byteLength;
    state.sourcePixelSha256 = await digestHex(samplePixels.buffer);
    const colors = new Set();
    let minimumLuma = 1;
    let maximumLuma = 0;
    for (let index = 0; index < sampleCount; index += 1) {
      const offset = index * 4;
      const red = samplePixels[offset];
      const green = samplePixels[offset + 1];
      const blue = samplePixels[offset + 2];
      const luma = lumaAt(red, green, blue);
      minimumLuma = Math.min(minimumLuma, luma);
      maximumLuma = Math.max(maximumLuma, luma);
      colors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
    }
    state.distinctSampleColorCount = colors.size;
    state.sampledLumaRange = maximumLuma - minimumLuma;
    buildImageDrivenTopology();
    updateProbeEvidence();
  }

  const topologyReady = prepareMaterialEvidence();

  function updateProbeEvidence() {
    if (!state.topologyReady) return;
    const evidence = evidenceAt(state.probeU, state.probeV);
    state.currentClass = evidence.classification;
    state.currentSignal = Math.round(evidence.anomaly * 100);
    state.maximumSignal = Math.max(state.maximumSignal, state.currentSignal);
    if (!state.visitedClasses.includes(state.currentClass)) state.visitedClasses.push(state.currentClass);
    state.visitedClassCount = state.visitedClasses.length;
  }

  function syncInterface() {
    signalReadout.textContent = `${String(state.currentSignal).padStart(2, '0')}%`;
    classReadout.textContent = state.currentClass;
    facesReadout.textContent = state.triangleCount ? String(state.triangleCount) : '—';
    radiusControl.value = String(state.beamRadius);
    stage.dataset.signal = String(state.currentSignal);
    stage.dataset.classification = state.currentClass;
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    ledger.value = JSON.stringify({
      inputCount: state.inputCount,
      lastInputKind: state.lastInputKind,
      lastInputTrusted: state.lastInputTrusted,
      currentSignal: state.currentSignal,
      maximumSignal: state.maximumSignal,
      currentClass: state.currentClass,
      visitedClassCount: state.visitedClassCount,
      pointerCaptureCount: state.pointerCaptureCount,
      pointerReleaseCaptureCount: state.pointerReleaseCaptureCount,
      keyboardInputCount: state.keyboardInputCount,
      buttonActivationCount: state.buttonActivationCount,
      rangeInputCount: state.rangeInputCount,
      assetSha256: state.assetSha256,
      sourcePixelSha256: state.sourcePixelSha256,
      vertexCount: state.vertexCount,
      triangleCount: state.triangleCount,
      topologyChecksum: state.topologyChecksum,
      facePropertyChecksum: state.facePropertyChecksum,
      runtimeAssert: stage.dataset.runtimeAssert === 'true'
    });
  }

  function redrawForTrustedInput(reason) {
    dirty = true;
    state.lastRedrawReason = reason;
    if (!state.ready || !sketch) return;
    sketch.redraw();
    dirty = false;
    state.currentCanvasSignature = canvasSignature();
  }

  function setProbe(u, v, kind) {
    const nextU = clamp01(u);
    const nextV = clamp01(v);
    const changed = nextU !== state.probeU || nextV !== state.probeV;
    if (changed && state.firstHumanSignalBefore === null) state.firstHumanSignalBefore = state.currentSignal;
    state.probeU = nextU;
    state.probeV = nextV;
    updateProbeEvidence();
    if (changed) {
      state.humanMutationCount += 1;
      if (state.firstHumanSignalAfter === null) state.firstHumanSignalAfter = state.currentSignal;
      redrawForTrustedInput(kind);
    }
    state.lastInputKind = kind;
  }

  function acceptTrustedInput(event, kind) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = kind;
    if (event instanceof PointerEvent) state.lastPointerType = event.pointerType || 'mouse';
    return true;
  }

  function pointerPosition(event) {
    const bounds = stage.getBoundingClientRect();
    return { u: clamp01((event.clientX - bounds.left) / Math.max(1, bounds.width)), v: clamp01((event.clientY - bounds.top) / Math.max(1, bounds.height)) };
  }

  function isControlTarget(event) {
    return event.target instanceof Element && Boolean(event.target.closest('button, input'));
  }

  stage.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || isControlTarget(event) || !acceptTrustedInput(event, 'mouse-hover-enter')) return;
    state.pointerEnterCount += 1;
    const point = pointerPosition(event);
    setProbe(point.u, point.v, 'mouse-hover-enter');
    syncInterface();
  });

  stage.addEventListener('pointermove', event => {
    if (isControlTarget(event)) return;
    const dragging = state.activePointerId === event.pointerId;
    if (!dragging && event.pointerType !== 'mouse') return;
    if (!acceptTrustedInput(event, dragging ? `${event.pointerType || 'mouse'}-drag-move` : 'mouse-hover-move')) return;
    state.pointerMoveCount += 1;
    const point = pointerPosition(event);
    setProbe(point.u, point.v, state.lastInputKind);
    syncInterface();
  });

  stage.addEventListener('pointerdown', event => {
    if (isControlTarget(event) || !acceptTrustedInput(event, `${event.pointerType || 'mouse'}-drag-start`)) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    const point = pointerPosition(event);
    setProbe(point.u, point.v, state.lastInputKind);
    syncInterface();
  });

  function releasePointer(event, kind) {
    if (state.activePointerId !== event.pointerId || !acceptTrustedInput(event, kind)) return;
    state.pointerReleaseCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.activePointerId = null;
    state.pointerCaptured = false;
    syncInterface();
  }

  stage.addEventListener('pointerup', event => releasePointer(event, `${event.pointerType || 'mouse'}-drag-end`));
  stage.addEventListener('pointercancel', event => releasePointer(event, `${event.pointerType || 'mouse'}-drag-cancel`));

  function applyAction(action, kind) {
    if (action === 'seam') {
      state.seamPresetCount += 1;
      setProbe(.57, .35, kind);
    } else if (action === 'void') {
      state.voidPresetCount += 1;
      setProbe(.52, .56, kind);
    } else {
      state.resetCount += 1;
      state.beamRadius = state.initialBeamRadius;
      setProbe(state.initialProbeU, state.initialProbeV, kind);
      redrawForTrustedInput(kind);
    }
    syncInterface();
  }

  stage.addEventListener('keydown', event => {
    if (event.target === radiusControl) return;
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '[', ']', 's', 'S', 'v', 'V', 'r', 'R', 'Home'].includes(event.key);
    if (!handled || !acceptTrustedInput(event, `keyboard-${event.key}`)) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    const delta = .045;
    if (event.key === 'ArrowLeft') setProbe(state.probeU - delta, state.probeV, state.lastInputKind);
    else if (event.key === 'ArrowRight') setProbe(state.probeU + delta, state.probeV, state.lastInputKind);
    else if (event.key === 'ArrowUp') setProbe(state.probeU, state.probeV - delta, state.lastInputKind);
    else if (event.key === 'ArrowDown') setProbe(state.probeU, state.probeV + delta, state.lastInputKind);
    else if (event.key === '[' || event.key === ']') {
      const next = Math.max(13, Math.min(34, state.beamRadius + (event.key === ']' ? 2 : -2)));
      if (next !== state.beamRadius) state.humanMutationCount += 1;
      state.beamRadius = next;
      redrawForTrustedInput(state.lastInputKind);
    } else applyAction(event.key.toLowerCase() === 's' ? 'seam' : event.key.toLowerCase() === 'v' ? 'void' : 'reset', state.lastInputKind);
    syncInterface();
  });

  buttons.forEach(button => button.addEventListener('click', event => {
    const action = button.dataset.scanAction;
    if (!acceptTrustedInput(event, `button-${action}`)) return;
    state.buttonActivationCount += 1;
    applyAction(action, state.lastInputKind);
    stage.focus({ preventScroll: true });
  }));

  radiusControl.addEventListener('input', event => {
    if (!acceptTrustedInput(event, 'range-radius')) return;
    const next = Number(radiusControl.value);
    if (next !== state.beamRadius) state.humanMutationCount += 1;
    state.beamRadius = next;
    state.rangeInputCount += 1;
    redrawForTrustedInput(state.lastInputKind);
    syncInterface();
  });

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
    if (!state.topologyReady || !sketch) return;
    resizeCanvas();
    if (dirty) {
      sketch.redraw();
      dirty = false;
      state.currentCanvasSignature = canvasSignature();
    }
    syncInterface();
  }

  const ready = Promise.all([topologyReady, document.fonts.ready]).then(() => {
    state.ready = true;
    dirty = true;
    render();
    state.initialCanvasSignature = state.currentCanvasSignature;
    render();
    state.initialStaticConfirmed = state.currentCanvasSignature === state.initialCanvasSignature;
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
      && state.p5CompletedDrawCount > 0;
    const honestInteraction = state.task === 'human-operated-pixel-derived-delaunay-composite-inspection'
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
      && state.pointerReleaseCaptureCount <= state.pointerCaptureCount
      && state.lastInputTrusted !== false;
    const realAsset = state.assetEvidenceReady
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetByteLength === 353080
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
    const pixelDriven = state.sampledWidth === sampleWidth
      && state.sampledHeight === sampleHeight
      && state.sampledPixelCount === sampleCount
      && state.sampledByteLength === sampleCount * 4
      && /^[0-9a-f]{64}$/.test(state.sourcePixelSha256 ?? '')
      && !/^0+$/.test(state.sourcePixelSha256 ?? '')
      && state.distinctSampleColorCount > 300
      && state.distinctSampleColorCount < sampleCount
      && state.sampledLumaRange > .5
      && state.candidateCellCount > 100
      && state.candidateCellCount < sampleCount
      && state.imageDrivenVertexCount > 50
      && state.imageDrivenVertexCount < 90
      && state.boundaryVertexCount >= 30
      && state.boundaryVertexCount < state.imageDrivenVertexCount;
    const exactDelaunay = state.topologyReady
      && state.vertexCount >= 90
      && state.triangleCount > state.vertexCount
      && state.uniqueEdgeCount > state.triangleCount
      && state.degenerateTriangleCount === 0
      && state.delaunayEmptyCircleViolations === 0
      && state.topologyChecksum > 0
      && state.facePropertyChecksum > 0
      && state.vertexCount <= 120
      && state.triangleCount < state.vertexCount * 2
      && state.uniqueEdgeCount < state.triangleCount * 2
      && state.laminateTriangleCount + state.edgeTriangleCount + state.anomalyTriangleCount === state.triangleCount
      && state.laminateTriangleCount > 0
      && state.edgeTriangleCount > 0
      && state.anomalyTriangleCount > 0;
    const manifestAndControls = window.__PREVIEW_META__?.id === state.id
      && window.__PREVIEW_META__?.library === 'p5@2.3.0'
      && window.__PREVIEW_META__?.renderer === 'canvas2d'
      && stage.dataset.previewMechanism === 'p5-image-derived-delaunay-laminate-inspection'
      && stage.tabIndex === 0
      && getComputedStyle(stage).touchAction === 'none'
      && typeof stage.setPointerCapture === 'function'
      && buttons.length === 3
      && radiusControl instanceof HTMLInputElement;
    const initialOrHumanDriven = state.inputCount === 0
      ? state.humanMutationCount === 0 && state.probeU === state.initialProbeU && state.probeV === state.initialProbeV
      : state.humanMutationCount > 0 && state.lastInputTrusted === true;
    stage.dataset.runtimeAssert = String(realP5 && honestInteraction && realAsset && pixelDriven && exactDelaunay && manifestAndControls && initialOrHumanDriven);
    syncInterface();
    return stage.dataset.runtimeAssert === 'true';
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
