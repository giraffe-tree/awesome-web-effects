import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const TAU = Math.PI * 2;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

const ASSET_DEFINITIONS = [
  {
    id: 'shoreline-scan',
    label: 'Field scan',
    shortLabel: 'SCAN',
    file: 'shoreline-scan.jpg',
    width: 960,
    height: 640,
    sha256: '08c0aef77854afa481b5274c6907f4f8f8bd867fcabd5843388b51c1aa31a699',
    accent: '#ff9a64',
  },
  {
    id: 'eelgrass-array',
    label: 'Habitat array',
    shortLabel: 'HABITAT',
    file: 'eelgrass-array.jpg',
    width: 960,
    height: 540,
    sha256: 'a228f2ea088572a0df3d6cc5f0fcdddf3a5dd86251035285d22d2b49e19a7f5a',
    accent: '#a7e8d8',
  },
  {
    id: 'tidal-flow-model',
    label: 'Flow model',
    shortLabel: 'FLOW',
    file: 'tidal-flow-model.jpg',
    width: 960,
    height: 540,
    sha256: 'fdd6161ac7f4cce819c2d67a6e9b7d481ff271030cd44a26f57a9c3e07960532',
    accent: '#ff7258',
  },
].map(definition => ({
  ...definition,
  src: new URL(`../assets/aesthetic-wave-06/orbital-card-constellation/${definition.file}`, import.meta.url).href,
}));

const NODE_DEFINITIONS = [
  { id: 'shoreline-scan', type: 'evidence', assetIndex: 0, kicker: 'EVIDENCE / 01' },
  { id: 'permit-window', type: 'task', label: 'Permit window', shortLabel: 'PERMIT', kicker: 'TASK / 07', progress: .64, color: '#f3d37a' },
  { id: 'eelgrass-array', type: 'evidence', assetIndex: 1, kicker: 'EVIDENCE / 02' },
  { id: 'field-session', type: 'task', label: 'Field session', shortLabel: 'FIELD', kicker: 'TASK / 12', progress: .82, color: '#a7e8d8' },
  { id: 'tidal-flow-model', type: 'evidence', assetIndex: 2, kicker: 'EVIDENCE / 03' },
];

const EDGE_PAIRS = [
  ...NODE_DEFINITIONS.map(node => ['northline-project', node.id]),
  ...NODE_DEFINITIONS.map((node, index) => [node.id, NODE_DEFINITIONS[(index + 1) % NODE_DEFINITIONS.length].id]),
  ['shoreline-scan', 'eelgrass-array'],
  ['eelgrass-array', 'tidal-flow-model'],
];

try {
  const stage = document.querySelector('#constellation-stage');
  const host = document.querySelector('#constellation-host');
  const modeControl = document.querySelector('#mode-control');
  const evidenceControl = document.querySelector('#evidence-control');
  const selectionReadout = document.querySelector('#selection-readout');
  const runtimeLedger = document.querySelector('#runtime-ledger');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !host || !modeControl || !evidenceControl || !selectionReadout || !runtimeLedger) {
    throw new Error('Orbital project constellation DOM is incomplete.');
  }

  const state = {
    id: 'orbital-card-constellation',
    task: 'human-directed-project-evidence-relationship-board',
    mechanism: 'pointer-owned-gravity-center-with-static-elliptical-orbit-topology',
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'control'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticOrbit: false,
    automaticPlayback: false,
    automaticCruise: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockDriven: false,
    previewClockMutation: false,
    syntheticInputDispatch: false,
    renderIgnoresPreviewClock: true,
    firstFrameStatic: true,
    initialStaticVerified: false,
    reducedMotion: reducedMotionQuery.matches,
    layoutMode: 'expanded',
    initialLayoutMode: 'expanded',
    centerNormalized: { x: .5, y: .54 },
    initialCenterNormalized: { x: .5, y: .54 },
    orbitRotation: -.36,
    initialOrbitRotation: -.36,
    selectedNodeIndex: 0,
    selectedNodeId: NODE_DEFINITIONS[0].id,
    nodeCount: NODE_DEFINITIONS.length,
    evidenceNodeCount: NODE_DEFINITIONS.filter(node => node.type === 'evidence').length,
    taskNodeCount: NODE_DEFINITIONS.filter(node => node.type === 'task').length,
    topologyEdgeCount: EDGE_PAIRS.length,
    topologyEdgePairs: EDGE_PAIRS.map(pair => pair.join('>')),
    topologySignature: EDGE_PAIRS.map(pair => pair.join('>')).join('|'),
    topologyGeometryValid: false,
    orbitRadiusX: 0,
    orbitRadiusY: 0,
    nodePositions: [],
    edgeLengths: [],
    maxEllipseResidual: Infinity,
    minHubDistance: 0,
    geometryRevision: 0,
    relationMutationCount: 0,
    gravityMutationCount: 0,
    orbitMutationCount: 0,
    modeMutationCount: 0,
    selectionMutationCount: 0,
    resetCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedCount: 0,
    pointerInputCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseInputCount: 0,
    pointerCancelCount: 0,
    pointerCaptured: false,
    activePointerId: null,
    activePointerType: 'none',
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    dragUpdateCount: 0,
    nodeHitSelectionCount: 0,
    lastInputKind: 'none',
    lastInputCause: 'initial',
    lastInputTrusted: null,
    lastRejectedCause: 'none',
    inputLedger: [],
    assetCount: ASSET_DEFINITIONS.length,
    sameOriginFetchCount: 0,
    assetFetchFailureCount: 0,
    assetDecodeCount: 0,
    assetDecodeFailureCount: 0,
    assetShaMatchCount: 0,
    assetSha256: [],
    distinctAssetShaCount: 0,
    assetPixelChecksums: [],
    distinctPixelChecksumCount: 0,
    sampledPixelCount: 0,
    sampledChannelCount: 0,
    assetEvidenceReady: false,
    assetEvidence: [],
    assetGravityWeights: [],
    assetInfluenceCount: 0,
    p5ImageCount: 0,
    p5ImagePixelTransferCount: 0,
    p5ImageDrawCount: 0,
    p5Ready: false,
    canvasReady: false,
    drawCount: 0,
    redrawRequestCount: 0,
    resizeCount: 0,
    lastDrawReason: 'initial',
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  const hexDigest = buffer => [...new Uint8Array(buffer)]
    .map(value => value.toString(16).padStart(2, '0'))
    .join('');

  function drawCover(context, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) * .5;
    const sourceY = (image.naturalHeight - sourceHeight) * .5;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  async function loadEvidenceAsset(definition, definitionIndex) {
    const assetUrl = new URL(definition.src);
    if (assetUrl.origin !== location.origin) {
      state.assetFetchFailureCount += 1;
      throw new Error(`Evidence asset ${definition.id} is not same-origin.`);
    }

    try {
      const response = await fetch(assetUrl, { cache: 'no-store' });
      if (!response.ok || new URL(response.url).origin !== location.origin) {
        throw new Error(`Same-origin fetch failed with ${response.status}.`);
      }
      state.sameOriginFetchCount += 1;
      const bytes = await response.arrayBuffer();
      const sha256 = hexDigest(await crypto.subtle.digest('SHA-256', bytes));
      if (sha256 !== definition.sha256) {
        throw new Error(`SHA-256 mismatch for ${definition.file}.`);
      }
      state.assetShaMatchCount += 1;
      state.assetSha256[definitionIndex] = sha256;

      const objectUrl = URL.createObjectURL(new Blob([bytes], { type: response.headers.get('content-type') || 'image/jpeg' }));
      const image = new Image();
      image.decoding = 'async';
      image.alt = '';
      image.src = objectUrl;
      await image.decode();
      if (!image.complete || image.naturalWidth !== definition.width || image.naturalHeight !== definition.height) {
        URL.revokeObjectURL(objectUrl);
        throw new Error(`Unexpected decoded dimensions for ${definition.file}.`);
      }
      state.assetDecodeCount += 1;

      const sample = document.createElement('canvas');
      sample.width = 48;
      sample.height = 32;
      const sampleContext = sample.getContext('2d', { willReadFrequently: true });
      drawCover(sampleContext, image, 0, 0, sample.width, sample.height);
      const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
      let checksum = 2166136261;
      let red = 0;
      let green = 0;
      let blue = 0;
      let luminance = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        red += r;
        green += g;
        blue += b;
        luminance += r * .2126 + g * .7152 + b * .0722;
        checksum ^= r;
        checksum = Math.imul(checksum, 16777619) >>> 0;
        checksum ^= g;
        checksum = Math.imul(checksum, 16777619) >>> 0;
        checksum ^= b;
        checksum = Math.imul(checksum, 16777619) >>> 0;
      }
      const pixelCount = sample.width * sample.height;
      const normalizedLuminance = luminance / pixelCount / 255;
      const gravityWeight = Number(clamp(.79 + normalizedLuminance * .16, .81, .94).toFixed(5));
      const averageColor = {
        r: Math.round(red / pixelCount),
        g: Math.round(green / pixelCount),
        b: Math.round(blue / pixelCount),
      };
      state.sampledPixelCount += pixelCount;
      state.sampledChannelCount += pixels.length;
      state.assetPixelChecksums[definitionIndex] = checksum;
      state.assetGravityWeights[definitionIndex] = gravityWeight;
      state.assetEvidence[definitionIndex] = {
        id: definition.id,
        srcOrigin: assetUrl.origin,
        responseOrigin: new URL(response.url).origin,
        width: image.naturalWidth,
        height: image.naturalHeight,
        sha256,
        expectedSha256: definition.sha256,
        shaVerified: true,
        pixelChecksum: checksum,
        sampleWidth: sample.width,
        sampleHeight: sample.height,
        averageColor,
        gravityWeight,
        p5Transferred: false,
      };
      return { ...definition, image, objectUrl, averageColor, gravityWeight, p5Image: null };
    } catch (error) {
      state.assetFetchFailureCount += 1;
      state.assetDecodeFailureCount += 1;
      throw new Error(`Required evidence asset ${definition.id} failed: ${error.message}`);
    }
  }

  const assets = await Promise.all(ASSET_DEFINITIONS.map(loadEvidenceAsset));
  state.distinctAssetShaCount = new Set(state.assetSha256).size;
  state.distinctPixelChecksumCount = new Set(state.assetPixelChecksums).size;
  state.assetInfluenceCount = new Set(state.assetGravityWeights).size;
  state.assetEvidenceReady = (
    state.sameOriginFetchCount === ASSET_DEFINITIONS.length
    && state.assetShaMatchCount === ASSET_DEFINITIONS.length
    && state.assetDecodeCount === ASSET_DEFINITIONS.length
    && state.assetFetchFailureCount === 0
    && state.assetDecodeFailureCount === 0
    && state.distinctAssetShaCount === ASSET_DEFINITIONS.length
    && state.distinctPixelChecksumCount === ASSET_DEFINITIONS.length
    && state.assetInfluenceCount >= 2
  );

  let sketch;
  let resizeFrame = 0;
  let pointerSession = null;
  let resolveFirstDraw;
  const firstDrawReady = new Promise(resolve => { resolveFirstDraw = resolve; });

  function recordInput(event, kind, cause) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedCount += 1;
      state.lastInputTrusted = false;
      state.lastRejectedCause = cause;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputCause = cause;
    state.lastInputTrusted = true;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else if (kind === 'control') state.controlInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (kind === 'mouse') state.mouseInputCount += 1;
      if (kind === 'touch') state.touchInputCount += 1;
      if (kind === 'pen') state.penInputCount += 1;
    }
    return true;
  }

  function recordMutation(type, cause) {
    state.relationMutationCount += 1;
    if (type === 'gravity') state.gravityMutationCount += 1;
    if (type === 'orbit') state.orbitMutationCount += 1;
    if (type === 'mode') state.modeMutationCount += 1;
    if (type === 'selection') state.selectionMutationCount += 1;
    state.inputLedger.push({
      sequence: state.inputLedger.length + 1,
      inputCount: state.inputCount,
      trustedInputCount: state.trustedInputCount,
      type,
      cause,
      centerX: Number(state.centerNormalized.x.toFixed(5)),
      centerY: Number(state.centerNormalized.y.toFixed(5)),
      orbitRotation: Number(state.orbitRotation.toFixed(5)),
      layoutMode: state.layoutMode,
      selectedNodeId: state.selectedNodeId,
    });
    if (state.inputLedger.length > 64) state.inputLedger.shift();
  }

  function syncInterface() {
    modeControl.textContent = state.layoutMode === 'expanded' ? 'Gather' : 'Expand';
    modeControl.setAttribute('aria-pressed', String(state.layoutMode === 'gathered'));
    const selected = NODE_DEFINITIONS[state.selectedNodeIndex];
    const selectedLabel = selected.type === 'evidence'
      ? assets[selected.assetIndex].label
      : selected.label;
    selectionReadout.textContent = selectedLabel;
    stage.dataset.layoutMode = state.layoutMode;
    stage.dataset.selectedNode = state.selectedNodeId;
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedCount = String(state.rejectedUntrustedCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerReleaseCaptureCount = String(state.pointerReleaseCaptureCount);
    stage.dataset.assetEvidenceReady = String(state.assetEvidenceReady);
    stage.dataset.geometryValid = String(state.topologyGeometryValid);
    if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
      stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__());
    }
    runtimeLedger.value = JSON.stringify({
      task: state.task,
      mode: state.layoutMode,
      selectedNodeId: state.selectedNodeId,
      centerNormalized: state.centerNormalized,
      orbitRotation: state.orbitRotation,
      orbitRadiusX: state.orbitRadiusX,
      orbitRadiusY: state.orbitRadiusY,
      nodeCount: state.nodeCount,
      edgeCount: state.topologyEdgeCount,
      geometryValid: state.topologyGeometryValid,
      maxEllipseResidual: state.maxEllipseResidual,
      inputCount: state.inputCount,
      lastInputKind: state.lastInputKind,
      lastInputTrusted: state.lastInputTrusted,
      relationMutationCount: state.relationMutationCount,
      assetDecodeCount: state.assetDecodeCount,
      assetShaMatchCount: state.assetShaMatchCount,
      distinctAssetShaCount: state.distinctAssetShaCount,
      distinctPixelChecksumCount: state.distinctPixelChecksumCount,
      assetInfluenceCount: state.assetInfluenceCount,
      p5ImageCount: state.p5ImageCount,
      p5ImageDrawCount: state.p5ImageDrawCount,
      drawCount: state.drawCount,
      runtimeAssert: stage.dataset.runtimeAssert === 'true',
    });
  }

  function requestRedraw(reason) {
    state.redrawRequestCount += 1;
    state.lastDrawReason = reason;
    sketch?.redraw();
  }

  function nodeWeight(node) {
    if (node.type === 'evidence') return assets[node.assetIndex].gravityWeight;
    return node.id === 'permit-window' ? .9 : .87;
  }

  function calculateGeometry(width, height) {
    const centerX = state.centerNormalized.x * width;
    const centerY = state.centerNormalized.y * height;
    const cardWidth = clamp(width * .18, 25, 132);
    const cardHeight = cardWidth * .67;
    const gathered = state.layoutMode === 'gathered';
    const desiredRadiusX = width * (gathered ? .245 : .36);
    const desiredRadiusY = height * (gathered ? .225 : .29);
    const sideMargin = cardWidth * .6 + Math.max(2, width * .008);
    const verticalMargin = cardHeight * .6 + Math.max(2, height * .012);
    const radiusX = Math.max(cardWidth * .36, Math.min(desiredRadiusX, centerX - sideMargin, width - centerX - sideMargin));
    const radiusY = Math.max(cardHeight * .36, Math.min(desiredRadiusY, centerY - verticalMargin, height - centerY - verticalMargin));
    const positions = NODE_DEFINITIONS.map((node, index) => {
      const angle = state.orbitRotation + index / NODE_DEFINITIONS.length * TAU;
      const weight = nodeWeight(node);
      return {
        id: node.id,
        index,
        type: node.type,
        angle,
        weight,
        x: centerX + Math.cos(angle) * radiusX * weight,
        y: centerY + Math.sin(angle) * radiusY * weight,
        width: cardWidth,
        height: cardHeight,
      };
    });
    const positionById = new Map(positions.map(position => [position.id, position]));
    positionById.set('northline-project', { x: centerX, y: centerY });
    const residuals = positions.map(position => {
      const nx = (position.x - centerX) / (radiusX * position.weight);
      const ny = (position.y - centerY) / (radiusY * position.weight);
      return Math.abs(Math.hypot(nx, ny) - 1);
    });
    const edgeLengths = EDGE_PAIRS.map(([from, to]) => {
      const a = positionById.get(from);
      const b = positionById.get(to);
      return Math.hypot(b.x - a.x, b.y - a.y);
    });
    const insideBounds = positions.every(position => (
      position.x - cardWidth * .6 >= -1
      && position.x + cardWidth * .6 <= width + 1
      && position.y - cardHeight * .6 >= -1
      && position.y + cardHeight * .6 <= height + 1
    ));
    state.orbitRadiusX = Number(radiusX.toFixed(4));
    state.orbitRadiusY = Number(radiusY.toFixed(4));
    state.nodePositions = positions.map(position => ({
      id: position.id,
      type: position.type,
      x: Number(position.x.toFixed(4)),
      y: Number(position.y.toFixed(4)),
      angle: Number(position.angle.toFixed(5)),
      gravityWeight: position.weight,
    }));
    state.edgeLengths = edgeLengths.map(length => Number(length.toFixed(4)));
    state.maxEllipseResidual = Number(Math.max(...residuals).toFixed(8));
    state.minHubDistance = Number(Math.min(...positions.map(position => Math.hypot(position.x - centerX, position.y - centerY))).toFixed(4));
    state.topologyGeometryValid = (
      positions.length === NODE_DEFINITIONS.length
      && edgeLengths.length === EDGE_PAIRS.length
      && edgeLengths.every(length => Number.isFinite(length) && length > 0)
      && state.maxEllipseResidual < .00001
      && radiusX > 0
      && radiusY > 0
      && insideBounds
    );
    state.geometryRevision += 1;
    return { centerX, centerY, cardWidth, cardHeight, radiusX, radiusY, positions, positionById };
  }

  function rgba(color, alpha) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }

  function roundedClip(context, x, y, width, height, radius) {
    context.beginPath();
    if (typeof context.roundRect === 'function') context.roundRect(x, y, width, height, radius);
    else context.rect(x, y, width, height);
    context.clip();
  }

  function drawP5Cover(p, image, x, y, width, height) {
    const scale = Math.max(width / image.width, height / image.height);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.width - sourceWidth) * .5;
    const sourceY = (image.height - sourceHeight) * .5;
    p.image(image, x, y, width, height, sourceX, sourceY, sourceWidth, sourceHeight);
    state.p5ImageDrawCount += 1;
  }

  function drawEvidenceNode(p, geometry, position, node, selected) {
    const asset = assets[node.assetIndex];
    const scale = selected ? 1.14 : 1;
    const width = geometry.cardWidth * scale;
    const height = geometry.cardHeight * scale;
    const rotation = Math.sin(position.angle) * .045;
    const context = p.drawingContext;
    p.push();
    p.translate(position.x, position.y);
    p.rotate(rotation);
    context.shadowColor = selected ? 'rgba(255,114,88,.32)' : 'rgba(0,0,0,.36)';
    context.shadowBlur = selected ? width * .22 : width * .13;
    context.shadowOffsetY = width * .055;
    p.stroke(selected ? '#ff8068' : '#d9ebe4');
    p.strokeWeight(selected ? Math.max(1.2, width * .018) : Math.max(.7, width * .009));
    p.fill('#0c181d');
    p.rectMode(p.CENTER);
    p.rect(0, 0, width, height, Math.max(3, width * .09));
    context.shadowColor = 'transparent';

    const imageHeight = height * .72;
    context.save();
    roundedClip(context, -width / 2 + 2, -height / 2 + 2, width - 4, imageHeight - 2, Math.max(2, width * .065));
    drawP5Cover(p, asset.p5Image, -width / 2 + 2, -height / 2 + 2, width - 4, imageHeight - 2);
    context.restore();
    p.noStroke();
    p.fill(asset.accent);
    p.rectMode(p.CORNER);
    p.rect(-width / 2 + 2, height / 2 - Math.max(2, height * .07), width - 4, Math.max(1, height * .045));

    if (width >= 34) {
      p.fill('#f3f0e8');
      p.textAlign(p.LEFT, p.CENTER);
      p.textStyle(p.BOLD);
      p.textSize(clamp(width * .075, 4, 8));
      p.text(asset.shortLabel, -width / 2 + width * .09, height * .31);
      p.fill('#8ea1a3');
      p.textAlign(p.RIGHT, p.CENTER);
      p.textSize(clamp(width * .052, 3.5, 6));
      p.text(`0${node.assetIndex + 1}`, width / 2 - width * .09, height * .31);
    }
    p.pop();
  }

  function drawTaskNode(p, geometry, position, node, selected) {
    const scale = selected ? 1.14 : .96;
    const width = geometry.cardWidth * scale;
    const height = geometry.cardHeight * scale;
    p.push();
    p.translate(position.x, position.y);
    p.rotate(Math.sin(position.angle) * .045);
    p.rectMode(p.CENTER);
    p.stroke(selected ? '#ff8068' : '#0d1a1d');
    p.strokeWeight(selected ? Math.max(1.2, width * .018) : Math.max(.7, width * .008));
    p.fill(node.color);
    p.rect(0, 0, width, height, Math.max(3, width * .09));
    p.noStroke();
    p.fill('#0a1518');
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.BOLD);
    p.textSize(clamp(width * .055, 3, 6));
    p.text(node.kicker, -width * .38, -height * .34);
    if (width >= 34) {
      p.textSize(clamp(width * .1, 4.5, 11));
      p.text(node.shortLabel, -width * .38, -height * .07);
    }
    const railX = -width * .38;
    const railY = height * .25;
    const railWidth = width * .76;
    p.fill('rgba(7,17,22,.22)');
    p.rectMode(p.CORNER);
    p.rect(railX, railY, railWidth, Math.max(1.5, height * .06), 999);
    p.fill('#0a1518');
    p.rect(railX, railY, railWidth * node.progress, Math.max(1.5, height * .06), 999);
    p.pop();
  }

  function drawHub(p, geometry) {
    const width = clamp(p.width * .245, 43, 176);
    const height = width * .53;
    const context = p.drawingContext;
    p.push();
    p.translate(geometry.centerX, geometry.centerY);
    context.shadowColor = 'rgba(0,0,0,.42)';
    context.shadowBlur = width * .18;
    context.shadowOffsetY = width * .04;
    p.rectMode(p.CENTER);
    p.stroke('#b7eee0');
    p.strokeWeight(Math.max(1, width * .008));
    p.fill('#0c1c20');
    p.rect(0, 0, width, height, Math.max(5, width * .08));
    context.shadowColor = 'transparent';
    p.noStroke();
    p.fill('#a7e8d8');
    p.rectMode(p.CORNER);
    p.rect(-width / 2, -height / 2, Math.max(3, width * .045), height, Math.max(4, width * .06), 0, 0, Math.max(4, width * .06));
    p.fill('#8ea6a5');
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.BOLD);
    p.textSize(clamp(width * .045, 3, 6));
    p.text('PROJECT / 07', -width * .39, -height * .3);
    p.fill('#f4f0e6');
    p.textSize(clamp(width * .115, 5.5, 18));
    p.text('NORTHLINE', -width * .39, -height * .06);
    if (width >= 54) {
      p.fill('#90a8a7');
      p.textSize(clamp(width * .045, 3.5, 6));
      p.text(`${state.layoutMode.toUpperCase()} · 3 EVIDENCE · 2 TASKS`, -width * .39, height * .24);
    }
    p.pop();
  }

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      const renderer = p.createCanvas(
        Math.max(1, Math.round(host.clientWidth)),
        Math.max(1, Math.round(host.clientHeight)),
      );
      renderer.parent(host);
      renderer.elt.setAttribute('aria-hidden', 'true');
      p.noLoop();
      p.textFont('ui-monospace, SFMono-Regular, Menlo, monospace');

      assets.forEach((asset, index) => {
        const transferCanvas = document.createElement('canvas');
        transferCanvas.width = 240;
        transferCanvas.height = 160;
        const transferContext = transferCanvas.getContext('2d', { willReadFrequently: true });
        drawCover(transferContext, asset.image, 0, 0, transferCanvas.width, transferCanvas.height);
        const transferPixels = transferContext.getImageData(0, 0, transferCanvas.width, transferCanvas.height).data;
        const p5Image = p.createImage(transferCanvas.width, transferCanvas.height);
        p5Image.loadPixels();
        p5Image.pixels.set(transferPixels);
        p5Image.updatePixels();
        asset.p5Image = p5Image;
        state.assetEvidence[index].p5Transferred = true;
        state.p5ImageCount += 1;
        state.p5ImagePixelTransferCount += transferCanvas.width * transferCanvas.height;
        URL.revokeObjectURL(asset.objectUrl);
      });
      state.p5Ready = true;
      state.canvasReady = renderer.elt instanceof HTMLCanvasElement;
      syncInterface();
    };

    p.draw = () => {
      state.drawCount += 1;
      p.background('#071116');
      const geometry = calculateGeometry(p.width, p.height);
      const context = p.drawingContext;

      assets.forEach((asset, index) => {
        const anchor = geometry.positions[index * 2 % geometry.positions.length];
        const radius = Math.max(p.width, p.height) * .48;
        const glow = context.createRadialGradient(anchor.x, anchor.y, 0, anchor.x, anchor.y, radius);
        glow.addColorStop(0, rgba(asset.averageColor, index === 2 ? .115 : .08));
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = glow;
        context.fillRect(0, 0, p.width, p.height);
      });

      const gridStep = clamp(Math.min(p.width, p.height) * .14, 10, 42);
      p.stroke(173, 213, 207, 20);
      p.strokeWeight(1);
      for (let x = gridStep / 2; x < p.width; x += gridStep) p.line(x, 0, x, p.height);
      for (let y = gridStep / 2; y < p.height; y += gridStep) p.line(0, y, p.width, y);
      p.noStroke();
      p.fill(197, 230, 223, 55);
      for (let x = gridStep / 2; x < p.width; x += gridStep) {
        for (let y = gridStep / 2; y < p.height; y += gridStep) p.circle(x, y, Math.max(1, gridStep * .035));
      }

      context.save();
      context.setLineDash([Math.max(2, gridStep * .13), Math.max(3, gridStep * .22)]);
      p.noFill();
      p.stroke(167, 232, 216, 46);
      p.strokeWeight(1);
      p.ellipse(geometry.centerX, geometry.centerY, geometry.radiusX * 1.78, geometry.radiusY * 1.78);
      context.restore();

      const selectedId = state.selectedNodeId;
      EDGE_PAIRS.forEach(([from, to]) => {
        const a = geometry.positionById.get(from);
        const b = geometry.positionById.get(to);
        const active = from === selectedId || to === selectedId;
        p.stroke(active ? '#ff8068' : 'rgba(176,216,208,.3)');
        p.strokeWeight(active ? Math.max(1, Math.min(p.width, p.height) * .007) : 1);
        p.line(a.x, a.y, b.x, b.y);
      });

      geometry.positions.forEach((position, index) => {
        if (index === state.selectedNodeIndex) return;
        const node = NODE_DEFINITIONS[index];
        if (node.type === 'evidence') drawEvidenceNode(p, geometry, position, node, false);
        else drawTaskNode(p, geometry, position, node, false);
      });
      const selectedPosition = geometry.positions[state.selectedNodeIndex];
      const selectedNode = NODE_DEFINITIONS[state.selectedNodeIndex];
      if (selectedNode.type === 'evidence') drawEvidenceNode(p, geometry, selectedPosition, selectedNode, true);
      else drawTaskNode(p, geometry, selectedPosition, selectedNode, true);
      drawHub(p, geometry);

      if (pointerSession) {
        p.noFill();
        p.stroke('#ff8068');
        p.strokeWeight(Math.max(1, Math.min(p.width, p.height) * .008));
        p.circle(pointerSession.x, pointerSession.y, clamp(Math.min(p.width, p.height) * .055, 5, 20));
        p.noStroke();
        p.fill('#ff8068');
        p.circle(pointerSession.x, pointerSession.y, clamp(Math.min(p.width, p.height) * .012, 2, 5));
      }

      if (state.drawCount === 1) {
        state.initialStaticVerified = (
          state.inputCount === 0
          && state.relationMutationCount === 0
          && state.layoutMode === state.initialLayoutMode
          && state.centerNormalized.x === state.initialCenterNormalized.x
          && state.centerNormalized.y === state.initialCenterNormalized.y
          && state.orbitRotation === state.initialOrbitRotation
          && state.selectedNodeIndex === 0
          && pointerSession === null
        );
        resolveFirstDraw();
      }
      syncInterface();
    };
  }, host);

  function localPoint(event) {
    const bounds = host.getBoundingClientRect();
    return {
      x: clamp(event.clientX - bounds.left, 0, bounds.width),
      y: clamp(event.clientY - bounds.top, 0, bounds.height),
      width: bounds.width,
      height: bounds.height,
    };
  }

  function selectNode(index, cause) {
    const next = (index + NODE_DEFINITIONS.length) % NODE_DEFINITIONS.length;
    if (next === state.selectedNodeIndex) return false;
    state.selectedNodeIndex = next;
    state.selectedNodeId = NODE_DEFINITIONS[next].id;
    recordMutation('selection', cause);
    requestRedraw(cause);
    return true;
  }

  function beginPointer(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const kind = ['touch', 'pen'].includes(event.pointerType) ? event.pointerType : 'mouse';
    if (!recordInput(event, kind, `pointer-${kind}-down`)) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    const point = localPoint(event);
    state.activePointerId = event.pointerId;
    state.activePointerType = kind;
    state.pointerDownCount += 1;
    pointerSession = { ...point };
    try {
      host.setPointerCapture(event.pointerId);
      state.pointerCaptured = host.hasPointerCapture(event.pointerId);
      if (state.pointerCaptured) state.pointerCaptureCount += 1;
    } catch {
      state.pointerCaptured = false;
    }

    const geometry = calculateGeometry(point.width, point.height);
    const hitIndex = geometry.positions.findIndex(position => (
      Math.abs(point.x - position.x) <= geometry.cardWidth * .62
      && Math.abs(point.y - position.y) <= geometry.cardHeight * .68
    ));
    if (hitIndex >= 0 && selectNode(hitIndex, `pointer-node-${NODE_DEFINITIONS[hitIndex].id}`)) {
      state.nodeHitSelectionCount += 1;
    }
    requestRedraw('trusted-pointer-down');
  }

  function movePointer(event) {
    if (!pointerSession || event.pointerId !== state.activePointerId) return;
    const kind = state.activePointerType;
    if (!recordInput(event, kind, `pointer-${kind}-move`)) return;
    event.preventDefault();
    const point = localPoint(event);
    const deltaX = point.x - pointerSession.x;
    state.centerNormalized.x = Number(clamp(point.x / point.width, .19, .81).toFixed(6));
    state.centerNormalized.y = Number(clamp(point.y / point.height, .22, .78).toFixed(6));
    state.orbitRotation = Number((state.orbitRotation + deltaX / Math.max(1, point.width) * 2.4).toFixed(6));
    pointerSession = { ...point };
    state.pointerMoveCount += 1;
    state.dragUpdateCount += 1;
    state.orbitMutationCount += 1;
    recordMutation('gravity', `pointer-${kind}-drag`);
    requestRedraw('trusted-pointer-drag');
  }

  function finishPointer(event, cancelled = false) {
    if (event.pointerId !== state.activePointerId) return;
    const kind = state.activePointerType;
    if (!recordInput(event, kind, cancelled ? `pointer-${kind}-cancel` : `pointer-${kind}-up`)) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseInputCount += 1;
    if (state.pointerCaptured) {
      try {
        if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
      } catch {
        // Browsers may release capture just before pointerup; the owned release is still recorded.
      }
      state.pointerReleaseCaptureCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.activePointerType = 'none';
    pointerSession = null;
    requestRedraw(cancelled ? 'trusted-pointer-cancel' : 'trusted-pointer-up');
  }

  function toggleMode(cause) {
    state.layoutMode = state.layoutMode === 'expanded' ? 'gathered' : 'expanded';
    recordMutation('mode', cause);
    requestRedraw(cause);
  }

  host.addEventListener('pointerdown', beginPointer);
  host.addEventListener('pointermove', movePointer);
  host.addEventListener('pointerup', event => finishPointer(event, false));
  host.addEventListener('pointercancel', event => finishPointer(event, true));
  host.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    const movement = {
      arrowleft: [-.035, 0],
      arrowright: [.035, 0],
      arrowup: [0, -.04],
      arrowdown: [0, .04],
    }[key];
    if (movement) {
      if (!recordInput(event, 'keyboard', `keyboard-${key}`)) return;
      event.preventDefault();
      state.centerNormalized.x = Number(clamp(state.centerNormalized.x + movement[0], .19, .81).toFixed(6));
      state.centerNormalized.y = Number(clamp(state.centerNormalized.y + movement[1], .22, .78).toFixed(6));
      recordMutation('gravity', `keyboard-${key}`);
      requestRedraw(`keyboard-${key}`);
      return;
    }
    if (event.key === '[' || event.key === ']') {
      if (!recordInput(event, 'keyboard', `keyboard-${event.key}`)) return;
      event.preventDefault();
      state.orbitRotation = Number((state.orbitRotation + (event.key === '[' ? -.2 : .2)).toFixed(6));
      recordMutation('orbit', `keyboard-${event.key}`);
      requestRedraw(`keyboard-${event.key}`);
      return;
    }
    if (key === 'g') {
      if (!recordInput(event, 'keyboard', 'keyboard-g')) return;
      event.preventDefault();
      toggleMode('keyboard-g');
      return;
    }
    if (key === 'enter' || key === ' ') {
      if (!recordInput(event, 'keyboard', `keyboard-${key === ' ' ? 'space' : key}`)) return;
      event.preventDefault();
      selectNode(state.selectedNodeIndex + 1, `keyboard-${key === ' ' ? 'space' : key}`);
      return;
    }
    if (key === 'home') {
      if (!recordInput(event, 'keyboard', 'keyboard-home')) return;
      event.preventDefault();
      state.centerNormalized = { ...state.initialCenterNormalized };
      state.orbitRotation = state.initialOrbitRotation;
      state.layoutMode = state.initialLayoutMode;
      state.selectedNodeIndex = 0;
      state.selectedNodeId = NODE_DEFINITIONS[0].id;
      state.resetCount += 1;
      recordMutation('gravity', 'keyboard-home');
      requestRedraw('keyboard-home');
    }
  });

  modeControl.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'control';
    if (!recordInput(event, kind, 'mode-control')) return;
    toggleMode('mode-control');
  });

  evidenceControl.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'control';
    if (!recordInput(event, kind, 'evidence-control')) return;
    selectNode(state.selectedNodeIndex + 1, 'evidence-control');
  });

  const resizeObserver = new ResizeObserver(entries => {
    const entry = entries[0];
    if (!entry || !sketch) return;
    const width = Math.max(1, Math.round(entry.contentRect.width));
    const height = Math.max(1, Math.round(entry.contentRect.height));
    if (width === sketch.width && height === sketch.height) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      sketch.resizeCanvas(width, height, false);
      state.resizeCount += 1;
      requestRedraw('resize');
    });
  });
  resizeObserver.observe(host);

  reducedMotionQuery.addEventListener?.('change', () => {
    state.reducedMotion = reducedMotionQuery.matches;
    requestRedraw('reduced-motion-change');
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = host.querySelector('canvas');
    const uniqueTopologyEdges = new Set(state.topologyEdgePairs);
    const assetsValid = (
      state.assetCount === 3
      && state.sameOriginFetchCount === 3
      && state.assetFetchFailureCount === 0
      && state.assetDecodeCount === 3
      && state.assetDecodeFailureCount === 0
      && state.assetShaMatchCount === 3
      && state.assetSha256.length === 3
      && state.distinctAssetShaCount === 3
      && state.assetPixelChecksums.length === 3
      && state.distinctPixelChecksumCount === 3
      && state.sampledPixelCount === 4608
      && state.sampledChannelCount === 18432
      && state.assetInfluenceCount >= 2
      && state.assetEvidenceReady === true
      && state.assetEvidence.length === 3
      && state.assetEvidence.every((evidence, index) => (
        evidence.srcOrigin === location.origin
        && evidence.responseOrigin === location.origin
        && evidence.width === ASSET_DEFINITIONS[index].width
        && evidence.height === ASSET_DEFINITIONS[index].height
        && evidence.sha256 === ASSET_DEFINITIONS[index].sha256
        && evidence.expectedSha256 === ASSET_DEFINITIONS[index].sha256
        && evidence.shaVerified === true
        && Number.isInteger(evidence.pixelChecksum)
        && evidence.pixelChecksum > 0
        && evidence.sampleWidth === 48
        && evidence.sampleHeight === 32
        && evidence.gravityWeight === state.assetGravityWeights[index]
        && evidence.p5Transferred === true
      ))
      && state.p5ImageCount === 3
      && state.p5ImagePixelTransferCount === 115200
      && assets.every(asset => asset.p5Image instanceof p5.Image)
      && state.p5ImageDrawCount >= 3
    );
    const topologyValid = (
      state.nodeCount === 5
      && state.evidenceNodeCount === 3
      && state.taskNodeCount === 2
      && state.topologyEdgeCount === 12
      && state.topologyEdgePairs.length === 12
      && uniqueTopologyEdges.size === 12
      && state.topologySignature === EDGE_PAIRS.map(pair => pair.join('>')).join('|')
      && state.nodePositions.length === 5
      && state.edgeLengths.length === 12
      && state.nodePositions.every((position, index) => (
        position.id === NODE_DEFINITIONS[index].id
        && Number.isFinite(position.x)
        && Number.isFinite(position.y)
        && Number.isFinite(position.angle)
        && Number.isFinite(position.gravityWeight)
        && position.gravityWeight === nodeWeight(NODE_DEFINITIONS[index])
      ))
      && state.edgeLengths.every(length => Number.isFinite(length) && length > 0)
      && state.orbitRadiusX > 0
      && state.orbitRadiusY > 0
      && state.minHubDistance > 0
      && state.maxEllipseResidual < .00001
      && state.topologyGeometryValid === true
    );
    const interactionValid = (
      state.inputCount === state.trustedInputCount
      && state.pointerInputCount + state.keyboardInputCount + state.controlInputCount === state.trustedInputCount
      && state.mouseInputCount + state.touchInputCount + state.penInputCount === state.pointerInputCount
      && state.pointerReleaseCaptureCount <= state.pointerCaptureCount
      && state.pointerCaptured === (state.activePointerId !== null && state.pointerCaptureCount > state.pointerReleaseCaptureCount)
      && state.relationMutationCount <= state.trustedInputCount
      && state.inputLedger.every(entry => (
        Number.isInteger(entry.inputCount)
        && entry.inputCount > 0
        && entry.inputCount === entry.trustedInputCount
        && ['gravity', 'orbit', 'mode', 'selection'].includes(entry.type)
        && NODE_DEFINITIONS.some(node => node.id === entry.selectedNodeId)
      ))
    );
    return (
      sketch instanceof p5
      && p5.VERSION === '2.3.0'
      && state.p5Ready === true
      && state.canvasReady === true
      && canvas instanceof HTMLCanvasElement
      && canvas.getContext('2d') instanceof CanvasRenderingContext2D
      && stage.dataset.previewMechanism === 'p5-human-directed-project-orbital-constellation'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && state.task === 'human-directed-project-evidence-relationship-board'
      && state.mechanism === 'pointer-owned-gravity-center-with-static-elliptical-orbit-topology'
      && state.acceptedInputs.join('|') === 'mouse|touch|pen|keyboard|control'
      && state.userInputRequired === true
      && state.strictTrustedInputGuard === true
      && state.automaticOrbit === false
      && state.automaticPlayback === false
      && state.automaticCruise === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.previewClockDriven === false
      && state.previewClockMutation === false
      && state.syntheticInputDispatch === false
      && state.renderIgnoresPreviewClock === true
      && state.firstFrameStatic === true
      && state.initialStaticVerified === true
      && ['expanded', 'gathered'].includes(state.layoutMode)
      && NODE_DEFINITIONS[state.selectedNodeIndex].id === state.selectedNodeId
      && assetsValid
      && topologyValid
      && interactionValid
      && state.drawCount > 0
    );
  };

  syncInterface();

  installPreviewController({
    id: 'orbital-card-constellation',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {},
    ready: Promise.all([document.fonts.ready, firstDrawReady]),
  });
} catch (error) {
  markPreviewFailure(error);
}
