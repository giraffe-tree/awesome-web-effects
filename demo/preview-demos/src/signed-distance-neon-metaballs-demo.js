import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-06/signed-distance-neon-metaballs/coastal-emergency-relay-survey.jpg',
  import.meta.url
).href;
const EXPECTED_ASSET_SHA256 = '72e39808792fd76a19c3f7afeee7e874f30cd15a62fe60e2a8637832d81df07a';
const EXPECTED_ASSET_BYTE_LENGTH = 256210;
const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_CROP = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
const SAMPLE_WIDTH = 160;
const SAMPLE_HEIGHT = 90;
const SAMPLE_PIXEL_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const FIELD_THRESHOLD = .78;
const FIELD_SOFT_EDGE = .27;
const NODE_DEFINITIONS = Object.freeze([
  {
    id: 'quay', code: 'A', name: 'Quay crew', color: [72, 247, 225],
    zone: { left: .05, right: .49, top: .16, bottom: .84 }, evidence: 'cyan'
  },
  {
    id: 'command', code: 'B', name: 'Command', color: [255, 190, 74],
    zone: { left: .46, right: .94, top: .04, bottom: .61 }, evidence: 'amber'
  },
  {
    id: 'medical', code: 'C', name: 'Medical', color: [255, 92, 114],
    zone: { left: .48, right: .97, top: .43, bottom: .96 }, evidence: 'red'
  }
]);

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 5) => Number(value.toFixed(digits));

try {
  const stage = document.querySelector('#relay-stage');
  const canvasHost = document.querySelector('#relay-canvas-host');
  const coverageScore = document.querySelector('#coverage-score');
  const meshStatus = document.querySelector('#mesh-status');
  const meshDetail = document.querySelector('#mesh-detail');
  const selectionName = document.querySelector('#relay-selection-name');
  const selectionGain = document.querySelector('#relay-selection-gain');
  const actionButtons = [...document.querySelectorAll('[data-relay-action]')];
  const ledger = document.querySelector('#runtime-ledger');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'signed-distance-neon-metaballs',
    task: 'human-operated-coastal-emergency-radio-relay-coverage-planning',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'committed-photo-pixels-seed-three-evidence-bound-relays-whose-human-positioned-inverse-square-fields-form-a-thresholded-metaball-mesh',
    assetMechanismRole: 'sampled-cyan-amber-red-light-evidence-determines-each-relay-centroid-base-radius-gain-and-live-mesh-decision',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: [
      'mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag',
      'keyboard', 'visible-buttons'
    ],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticOrbit: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    reducedMotion: reducedMotionQuery.matches,
    previewClockCallCount: 0,
    previewClockIgnoredCount: 0,
    previewClockMutationCount: 0,
    nonInputVisualMutationCountAfterReady: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    ignoredInputCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    hoverSelectionCount: 0,
    dragMutationCount: 0,
    keyboardInputCount: 0,
    keyboardMutationCount: 0,
    buttonActivationCount: 0,
    buttonMutationCount: 0,
    nodeSelectionCount: 0,
    gainAdjustmentCount: 0,
    resetCount: 0,
    humanVisualMutationCount: 0,
    humanInputCausalityCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    activePointerId: null,
    pointerCaptured: false,
    dragging: false,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    firstHumanStateBefore: null,
    firstHumanStateAfter: null,
    selectedNodeIndex: 0,
    selectedNodeId: NODE_DEFINITIONS[0].id,
    selectedNodeName: NODE_DEFINITIONS[0].name,
    nodeCount: NODE_DEFINITIONS.length,
    nodePositions: [],
    nodeGains: [],
    nodeRadii: [],
    nodeEvidence: [],
    initialNodePositions: [],
    initialNodeGains: [],
    initialNodeRadii: [],
    currentCoveragePercent: 0,
    minimumCoveragePercent: 100,
    maximumCoveragePercent: 0,
    currentConnectedPairCount: 0,
    maximumConnectedPairCount: 0,
    currentMeshDecision: 'Reading survey',
    meshDecisionMutationCount: 0,
    currentFieldChecksum: 0,
    currentVisualStateChecksum: 0,
    initialVisualStateChecksum: 0,
    initialVisualStateRepeatChecksum: 0,
    initialStillVerified: false,
    animationSettled: true,
    maximumNodeTravel: 0,
    minimumHumanGain: 10,
    maximumHumanGain: 0,
    dragStartU: 0,
    dragStartV: 0,
    dragDistance: 0,
    assetUrl: ASSET_URL,
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    expectedAssetByteLength: EXPECTED_ASSET_BYTE_LENGTH,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetMimeType: '',
    assetSameOrigin: false,
    assetByteLength: 0,
    assetSha256: '',
    assetShaMatchesExpected: false,
    assetByteLengthMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    p5ImageDecoded: false,
    p5ImageClass: '',
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    sourceCrop: { ...SOURCE_CROP },
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sampledPixelSha256: '',
    nonzeroSampleByteCount: 0,
    opaqueSamplePixelCount: 0,
    distinctQuantizedColorCount: 0,
    minimumSampleLuma: 1,
    maximumSampleLuma: 0,
    sampleLumaRange: 0,
    minimumSampleEdge: 1,
    maximumSampleEdge: 0,
    sampleEdgeRange: 0,
    cyanEvidencePixelCount: 0,
    amberEvidencePixelCount: 0,
    redEvidencePixelCount: 0,
    evidenceClassCount: 0,
    evidenceBindingChecksum: 0,
    pixelEvidenceReady: false,
    assetEvidenceReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    fieldEvaluationCount: 0,
    fieldCellCount: SAMPLE_PIXEL_COUNT,
    thresholdedFieldCellCount: 0,
    minimumFieldValue: 0,
    maximumFieldValue: 0,
    signedDistanceContourCellCount: 0,
    stageCoverageRatio: 0,
    canvasCoverageRatio: 0,
    resizeCount: 0,
    renderCount: 0,
    ready: false,
    runtimeAssertionPassed: false,
    inputRecords: []
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__RELAY_METABALL_STATE__ = state;

  let sketch;
  let surveyImage;
  let fieldImage;
  let samplePixels = new Uint8ClampedArray(SAMPLE_PIXEL_COUNT * 4);
  let lumaField = new Float32Array(SAMPLE_PIXEL_COUNT);
  let edgeField = new Float32Array(SAMPLE_PIXEL_COUNT);
  let relays = [];
  let initialRelays = [];
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`signed-distance-neon-metaballs: ${message}`);
  }

  function fnvMix(checksum, value) {
    return Math.imul(checksum ^ (value >>> 0), 16777619) >>> 0;
  }

  async function digestHex(buffer) {
    const exactBuffer = buffer instanceof ArrayBuffer
      ? buffer
      : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const digest = await crypto.subtle.digest('SHA-256', exactBuffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function recordInput(kind, source, before, after) {
    const changed = before !== after;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (changed) {
      state.humanVisualMutationCount += 1;
      state.humanInputCausalityCount += 1;
      if (state.firstHumanStateBefore === null) {
        state.firstHumanStateBefore = before;
        state.firstHumanStateAfter = after;
      }
    }
    state.inputRecords.push({ kind, source, before, after, changed });
    if (state.inputRecords.length > 48) state.inputRecords.shift();
    return changed;
  }

  function notePointerType(pointerType) {
    const type = pointerType || 'mouse';
    state.lastPointerType = type;
    if (type === 'touch') state.touchInputCount += 1;
    else if (type === 'pen') state.penInputCount += 1;
    else state.mouseInputCount += 1;
  }

  function trustedEvent(event) {
    if (event.isTrusted) return true;
    state.rejectedUntrustedInputCount += 1;
    state.lastInputTrusted = false;
    return false;
  }

  function visualStateChecksum() {
    let checksum = 2166136261;
    relays.forEach(node => {
      checksum = fnvMix(checksum, Math.round(node.u * 10000));
      checksum = fnvMix(checksum, Math.round(node.v * 10000));
      checksum = fnvMix(checksum, Math.round(node.gain * 1000));
      checksum = fnvMix(checksum, Math.round(node.radius * 10000));
    });
    checksum = fnvMix(checksum, state.selectedNodeIndex + 1);
    checksum = fnvMix(checksum, state.currentConnectedPairCount + 7);
    checksum = fnvMix(checksum, state.currentCoveragePercent + 11);
    return checksum >>> 0;
  }

  function updateNodeState() {
    const selected = relays[state.selectedNodeIndex];
    state.selectedNodeId = selected?.id ?? '';
    state.selectedNodeName = selected?.name ?? '';
    state.nodePositions = relays.map(node => ({ u: rounded(node.u), v: rounded(node.v) }));
    state.nodeGains = relays.map(node => rounded(node.gain));
    state.nodeRadii = relays.map(node => rounded(node.radius));
    state.currentVisualStateChecksum = visualStateChecksum();
  }

  function updateViewportEvidence() {
    const stageRect = stage.getBoundingClientRect();
    const canvas = canvasHost.querySelector('canvas');
    const canvasRect = canvas?.getBoundingClientRect();
    const viewportArea = Math.max(1, innerWidth * innerHeight);
    state.stageCoverageRatio = rounded(stageRect.width * stageRect.height / viewportArea);
    state.canvasCoverageRatio = canvasRect
      ? rounded(canvasRect.width * canvasRect.height / Math.max(1, stageRect.width * stageRect.height))
      : 0;
    state.p5CanvasWidth = sketch?.width ?? 0;
    state.p5CanvasHeight = sketch?.height ?? 0;
  }

  function updateInterface() {
    const selected = relays[state.selectedNodeIndex];
    coverageScore.textContent = `${state.currentCoveragePercent}%`;
    meshStatus.textContent = state.currentMeshDecision;
    meshDetail.textContent = `${state.currentConnectedPairCount}/3 links · ${state.thresholdedFieldCellCount.toLocaleString()} field cells`;
    selectionName.textContent = selected ? `Relay ${selected.code}` : 'Relay --';
    selectionGain.textContent = selected ? `${selected.name} · ${Math.round(selected.gain * 100)}%` : 'Gain --';
    stage.dataset.dragging = String(state.dragging);
    stage.dataset.meshDecision = state.currentMeshDecision;
    stage.dataset.selectedNode = selected?.id ?? '';
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    ledger.value = JSON.stringify({
      decision: state.currentMeshDecision,
      coverage: state.currentCoveragePercent,
      links: state.currentConnectedPairCount,
      selected: state.selectedNodeId,
      positions: state.nodePositions,
      gains: state.nodeGains,
      inputs: state.inputCount
    });
  }

  async function fetchAndDecodeAsset() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `survey asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    state.assetByteLengthMatchesExpected = state.assetByteLength === EXPECTED_ASSET_BYTE_LENGTH;
    invariant(state.assetSameOrigin, 'survey image did not come from the preview origin');
    invariant(state.assetShaMatchesExpected, 'survey image SHA-256 differs from the committed asset');
    invariant(state.assetByteLengthMatchesExpected, 'survey image byte length differs from the committed asset');

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
    invariant(
      state.sourceNaturalWidth === SOURCE_WIDTH && state.sourceNaturalHeight === SOURCE_HEIGHT,
      'browser-decoded survey dimensions are not 960x640'
    );
    state.assetEvidenceReady = true;
  }

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(
            Math.max(1, Math.round(stage.clientWidth)),
            Math.max(1, Math.round(stage.clientHeight))
          );
          canvas.parent(canvasHost);
          canvas.elt.setAttribute('aria-hidden', 'true');
          p.noLoop();
          p.textFont('ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
          p.strokeCap(p.ROUND);
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement
            && p.drawingContext instanceof CanvasRenderingContext2D;
          updateViewportEvidence();
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.p5DrawCount += 1;
        if (!state.pixelEvidenceReady || !surveyImage || !fieldImage) {
          p.background('#030712');
          return;
        }
        drawRelayField(p);
        state.p5CompletedDrawCount += 1;
      };
    }, canvasHost);
  });

  function loadP5Image() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(
        ASSET_URL,
        image => resolve(image),
        error => reject(new Error(`p5 image decode failed: ${error}`))
      );
    });
  }

  function sampleOffset(x, y) {
    const safeX = Math.max(0, Math.min(SAMPLE_WIDTH - 1, x));
    const safeY = Math.max(0, Math.min(SAMPLE_HEIGHT - 1, y));
    return (safeY * SAMPLE_WIDTH + safeX) * 4;
  }

  function evidenceWeight(kind, red, green, blue, luma, edge) {
    const color = kind === 'cyan'
      ? (green * .46 + blue * .54 - red * .72) / 255
      : kind === 'amber'
        ? (red * .5 + green * .42 - blue * .52) / 255
        : (red * .83 - green * .31 - blue * .22) / 255;
    return Math.max(0, color - .04) ** 1.8 * (.36 + luma * .64) * (.74 + edge * 1.4);
  }

  function deriveRelay(definition, index) {
    const zone = definition.zone;
    const left = Math.round(zone.left * (SAMPLE_WIDTH - 1));
    const right = Math.round(zone.right * (SAMPLE_WIDTH - 1));
    const top = Math.round(zone.top * (SAMPLE_HEIGHT - 1));
    const bottom = Math.round(zone.bottom * (SAMPLE_HEIGHT - 1));
    let weightedX = 0;
    let weightedY = 0;
    let weightTotal = 0;
    let luminanceTotal = 0;
    let edgeTotal = 0;
    let evidencePixels = 0;
    let maximumWeight = 0;

    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const offset = sampleOffset(x, y);
        const pixelIndex = offset / 4;
        const red = samplePixels[offset];
        const green = samplePixels[offset + 1];
        const blue = samplePixels[offset + 2];
        const weight = evidenceWeight(definition.evidence, red, green, blue, lumaField[pixelIndex], edgeField[pixelIndex]);
        if (weight <= .008) continue;
        const focusedWeight = weight ** 1.32;
        weightedX += x * focusedWeight;
        weightedY += y * focusedWeight;
        weightTotal += focusedWeight;
        luminanceTotal += lumaField[pixelIndex];
        edgeTotal += edgeField[pixelIndex];
        evidencePixels += 1;
        maximumWeight = Math.max(maximumWeight, weight);
      }
    }

    invariant(evidencePixels > 20 && weightTotal > 0, `${definition.evidence} evidence is insufficient`);
    const meanLuma = luminanceTotal / evidencePixels;
    const meanEdge = edgeTotal / evidencePixels;
    const u = clamp(weightedX / weightTotal / (SAMPLE_WIDTH - 1), zone.left + .025, zone.right - .025);
    const v = clamp(weightedY / weightTotal / (SAMPLE_HEIGHT - 1), zone.top + .025, zone.bottom - .025);
    const density = evidencePixels / Math.max(1, (right - left + 1) * (bottom - top + 1));
    const radius = clamp(.135 + meanLuma * .055 + Math.sqrt(density) * .055 + meanEdge * .025, .145, .225);
    const gain = clamp(.82 + meanLuma * .33 + maximumWeight * .22 + meanEdge * .18, .84, 1.34);

    return {
      ...definition,
      index,
      u,
      v,
      radius,
      baseRadius: radius,
      gain,
      baseGain: gain,
      evidencePixels,
      meanLuma,
      meanEdge,
      maximumWeight,
      density
    };
  }

  async function sampleAndBindImage() {
    const samplingCanvas = sketch.createGraphics(SAMPLE_WIDTH, SAMPLE_HEIGHT);
    samplingCanvas.pixelDensity(1);
    samplingCanvas.image(
      surveyImage,
      0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT,
      SOURCE_CROP.x, SOURCE_CROP.y, SOURCE_CROP.width, SOURCE_CROP.height
    );
    samplingCanvas.loadPixels();
    samplePixels = new Uint8ClampedArray(samplingCanvas.pixels);
    samplingCanvas.remove();

    state.sampledPixelCount = samplePixels.length / 4;
    state.sampledByteLength = samplePixels.byteLength;
    state.sampledPixelSha256 = await digestHex(samplePixels);
    const colors = new Set();

    for (let index = 0; index < SAMPLE_PIXEL_COUNT; index += 1) {
      const offset = index * 4;
      const red = samplePixels[offset];
      const green = samplePixels[offset + 1];
      const blue = samplePixels[offset + 2];
      const alpha = samplePixels[offset + 3];
      const luma = (red * .2126 + green * .7152 + blue * .0722) / 255;
      lumaField[index] = luma;
      state.nonzeroSampleByteCount += Number(red > 0) + Number(green > 0) + Number(blue > 0) + Number(alpha > 0);
      if (alpha === 255) state.opaqueSamplePixelCount += 1;
      colors.add(`${red >> 4}:${green >> 4}:${blue >> 4}`);
      state.minimumSampleLuma = Math.min(state.minimumSampleLuma, luma);
      state.maximumSampleLuma = Math.max(state.maximumSampleLuma, luma);
    }

    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const index = y * SAMPLE_WIDTH + x;
        const left = lumaField[y * SAMPLE_WIDTH + Math.max(0, x - 1)];
        const right = lumaField[y * SAMPLE_WIDTH + Math.min(SAMPLE_WIDTH - 1, x + 1)];
        const top = lumaField[Math.max(0, y - 1) * SAMPLE_WIDTH + x];
        const bottom = lumaField[Math.min(SAMPLE_HEIGHT - 1, y + 1) * SAMPLE_WIDTH + x];
        const edge = Math.min(1, Math.hypot(right - left, bottom - top));
        edgeField[index] = edge;
        state.minimumSampleEdge = Math.min(state.minimumSampleEdge, edge);
        state.maximumSampleEdge = Math.max(state.maximumSampleEdge, edge);
      }
    }

    state.distinctQuantizedColorCount = colors.size;
    state.sampleLumaRange = rounded(state.maximumSampleLuma - state.minimumSampleLuma);
    state.sampleEdgeRange = rounded(state.maximumSampleEdge - state.minimumSampleEdge);

    relays = NODE_DEFINITIONS.map(deriveRelay);
    initialRelays = relays.map(node => ({ ...node, color: [...node.color], zone: { ...node.zone } }));
    state.initialNodePositions = relays.map(node => ({ u: rounded(node.u), v: rounded(node.v) }));
    state.initialNodeGains = relays.map(node => rounded(node.gain));
    state.initialNodeRadii = relays.map(node => rounded(node.radius));
    state.nodeEvidence = relays.map(node => ({
      id: node.id,
      evidenceClass: node.evidence,
      evidencePixels: node.evidencePixels,
      centroidU: rounded(node.u),
      centroidV: rounded(node.v),
      meanLuma: rounded(node.meanLuma),
      meanEdge: rounded(node.meanEdge),
      maximumWeight: rounded(node.maximumWeight),
      density: rounded(node.density),
      derivedRadius: rounded(node.radius),
      derivedGain: rounded(node.gain)
    }));
    state.cyanEvidencePixelCount = relays[0].evidencePixels;
    state.amberEvidencePixelCount = relays[1].evidencePixels;
    state.redEvidencePixelCount = relays[2].evidencePixels;
    state.evidenceClassCount = new Set(relays.map(node => node.evidence)).size;
    let evidenceChecksum = 2166136261;
    relays.forEach(node => {
      evidenceChecksum = fnvMix(evidenceChecksum, node.evidencePixels);
      evidenceChecksum = fnvMix(evidenceChecksum, Math.round(node.u * 10000));
      evidenceChecksum = fnvMix(evidenceChecksum, Math.round(node.v * 10000));
      evidenceChecksum = fnvMix(evidenceChecksum, Math.round(node.radius * 10000));
      evidenceChecksum = fnvMix(evidenceChecksum, Math.round(node.gain * 1000));
    });
    state.evidenceBindingChecksum = evidenceChecksum >>> 0;
    state.pixelEvidenceReady = true;
    updateNodeState();
  }

  function fieldAt(u, v) {
    let total = 0;
    for (const node of relays) {
      const dx = (u - node.u) * 1.58;
      const dy = v - node.v;
      total += node.gain * node.radius * node.radius / (dx * dx + dy * dy + .0016);
    }
    return total;
  }

  function pairField(first, second) {
    const u = (first.u + second.u) / 2;
    const v = (first.v + second.v) / 2;
    let total = 0;
    for (const node of [first, second]) {
      const dx = (u - node.u) * 1.58;
      const dy = v - node.v;
      total += node.gain * node.radius * node.radius / (dx * dx + dy * dy + .0016);
    }
    return total;
  }

  function recomputeFieldImage() {
    fieldImage.loadPixels();
    let thresholded = 0;
    let contourCells = 0;
    let minimum = Number.POSITIVE_INFINITY;
    let maximum = 0;
    let checksum = 2166136261;

    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      const v = (y + .5) / SAMPLE_HEIGHT;
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const u = (x + .5) / SAMPLE_WIDTH;
        let total = 0;
        let redMix = 0;
        let greenMix = 0;
        let blueMix = 0;
        let componentTotal = 0;
        relays.forEach(node => {
          const dx = (u - node.u) * 1.58;
          const dy = v - node.v;
          const component = node.gain * node.radius * node.radius / (dx * dx + dy * dy + .0016);
          total += component;
          componentTotal += component;
          redMix += node.color[0] * component;
          greenMix += node.color[1] * component;
          blueMix += node.color[2] * component;
        });
        minimum = Math.min(minimum, total);
        maximum = Math.max(maximum, total);
        if (total >= FIELD_THRESHOLD) thresholded += 1;
        if (Math.abs(total - FIELD_THRESHOLD) <= .055) contourCells += 1;

        const progress = clamp((total - (FIELD_THRESHOLD - FIELD_SOFT_EDGE)) / FIELD_SOFT_EDGE);
        const core = clamp((total - FIELD_THRESHOLD) / .84);
        const edge = 1 - clamp(Math.abs(total - FIELD_THRESHOLD) / .18);
        const offset = (y * SAMPLE_WIDTH + x) * 4;
        const divisor = Math.max(.0001, componentTotal);
        fieldImage.pixels[offset] = clamp(redMix / divisor + edge * 94, 0, 255);
        fieldImage.pixels[offset + 1] = clamp(greenMix / divisor + edge * 92, 0, 255);
        fieldImage.pixels[offset + 2] = clamp(blueMix / divisor + edge * 100, 0, 255);
        fieldImage.pixels[offset + 3] = Math.round(progress * (70 + core * 82 + edge * 92));
        if ((x + y * 3) % 11 === 0) checksum = fnvMix(checksum, Math.round(total * 1000));
      }
    }
    fieldImage.updatePixels();

    let connectedPairs = 0;
    for (let first = 0; first < relays.length; first += 1) {
      for (let second = first + 1; second < relays.length; second += 1) {
        if (pairField(relays[first], relays[second]) >= FIELD_THRESHOLD) connectedPairs += 1;
      }
    }

    const previousDecision = state.currentMeshDecision;
    state.fieldEvaluationCount += SAMPLE_PIXEL_COUNT;
    state.thresholdedFieldCellCount = thresholded;
    state.signedDistanceContourCellCount = contourCells;
    state.minimumFieldValue = rounded(minimum);
    state.maximumFieldValue = rounded(maximum);
    state.currentFieldChecksum = checksum >>> 0;
    state.currentCoveragePercent = Math.round(thresholded / SAMPLE_PIXEL_COUNT * 100);
    state.minimumCoveragePercent = Math.min(state.minimumCoveragePercent, state.currentCoveragePercent);
    state.maximumCoveragePercent = Math.max(state.maximumCoveragePercent, state.currentCoveragePercent);
    state.currentConnectedPairCount = connectedPairs;
    state.maximumConnectedPairCount = Math.max(state.maximumConnectedPairCount, connectedPairs);
    state.currentMeshDecision = connectedPairs >= 2
      ? 'Mesh route ready'
      : connectedPairs === 1
        ? 'One corridor linked'
        : 'Crews isolated';
    if (previousDecision !== 'Reading survey' && previousDecision !== state.currentMeshDecision) {
      state.meshDecisionMutationCount += 1;
    }
    updateNodeState();
    state.minimumHumanGain = Math.min(state.minimumHumanGain, ...relays.map(node => node.gain));
    state.maximumHumanGain = Math.max(state.maximumHumanGain, ...relays.map(node => node.gain));
  }

  function drawPairLinks(p) {
    p.push();
    p.noFill();
    for (let first = 0; first < relays.length; first += 1) {
      for (let second = first + 1; second < relays.length; second += 1) {
        const nodeA = relays[first];
        const nodeB = relays[second];
        const strength = pairField(nodeA, nodeB);
        const connected = strength >= FIELD_THRESHOLD;
        p.stroke(connected ? 'rgba(226,255,247,.66)' : 'rgba(225,237,235,.15)');
        p.strokeWeight(connected ? Math.max(1, p.width / 560) : Math.max(.55, p.width / 1100));
        p.drawingContext.setLineDash(connected ? [] : [Math.max(2, p.width / 150), Math.max(3, p.width / 110)]);
        p.line(nodeA.u * p.width, nodeA.v * p.height, nodeB.u * p.width, nodeB.v * p.height);
      }
    }
    p.drawingContext.setLineDash([]);
    p.pop();
  }

  function drawRelayNodes(p) {
    const compact = p.width < 220 || p.height < 110;
    relays.forEach((node, index) => {
      const x = node.u * p.width;
      const y = node.v * p.height;
      const scale = clamp(Math.min(p.width / 720, p.height / 405), .32, 1.25);
      const selected = index === state.selectedNodeIndex;
      const ring = (selected ? 15 : 10) * scale;
      p.push();
      p.noFill();
      p.stroke(...node.color, selected ? 235 : 140);
      p.strokeWeight(selected ? Math.max(1, 1.35 * scale) : Math.max(.7, .9 * scale));
      p.circle(x, y, ring * 2);
      if (selected) {
        p.stroke(...node.color, 70);
        p.circle(x, y, ring * 3.3);
      }
      p.noStroke();
      p.fill(...node.color, 245);
      p.circle(x, y, Math.max(3, 5.5 * scale));
      if (!compact) {
        const labelX = x + 13 * scale;
        const labelY = y - 11 * scale;
        p.fill(2, 8, 16, 188);
        p.rect(labelX - 4 * scale, labelY - 8 * scale, 52 * scale, 15 * scale, 7 * scale);
        p.fill(245, 255, 251, 232);
        p.textStyle(p.BOLD);
        p.textSize(Math.max(5, 6.3 * scale));
        p.text(`R${node.code} · ${Math.round(node.gain * 100)}`, labelX, labelY + 1 * scale);
      }
      p.pop();
    });
  }

  function drawRelayField(p) {
    recomputeFieldImage();
    p.background('#030712');
    p.image(
      surveyImage,
      0, 0, p.width, p.height,
      SOURCE_CROP.x, SOURCE_CROP.y, SOURCE_CROP.width, SOURCE_CROP.height
    );
    p.noStroke();
    p.fill(2, 7, 16, 96);
    p.rect(0, 0, p.width, p.height);

    p.push();
    p.drawingContext.save();
    p.drawingContext.globalCompositeOperation = 'screen';
    p.drawingContext.filter = `blur(${Math.max(2, p.width / 155)}px)`;
    p.image(fieldImage, 0, 0, p.width, p.height);
    p.drawingContext.restore();
    p.drawingContext.save();
    p.drawingContext.globalCompositeOperation = 'screen';
    p.image(fieldImage, 0, 0, p.width, p.height);
    p.drawingContext.restore();
    p.pop();

    drawPairLinks(p);
    drawRelayNodes(p);
    updateViewportEvidence();
    updateInterface();
    state.currentVisualStateChecksum = visualStateChecksum();
    state.renderCount += 1;
  }

  function requestDraw(cause = 'human-input') {
    if (!sketch || !state.pixelEvidenceReady) return;
    state.lastDrawCause = cause;
    sketch.redraw();
  }

  function pointerPosition(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      u: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), .035, .965),
      v: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), .055, .945)
    };
  }

  function nearestRelay(position) {
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    relays.forEach((node, index) => {
      const dx = (position.u - node.u) * 1.58;
      const dy = position.v - node.v;
      const candidate = Math.hypot(dx, dy);
      if (candidate < distance) {
        distance = candidate;
        nearest = index;
      }
    });
    return { index: nearest, distance };
  }

  function selectNode(index) {
    const next = (index + relays.length) % relays.length;
    if (next === state.selectedNodeIndex) return false;
    state.selectedNodeIndex = next;
    state.nodeSelectionCount += 1;
    updateNodeState();
    return true;
  }

  function moveSelected(u, v) {
    const selected = relays[state.selectedNodeIndex];
    const nextU = clamp(u, .045, .955);
    const nextV = clamp(v, .07, .93);
    if (Math.abs(selected.u - nextU) < .00001 && Math.abs(selected.v - nextV) < .00001) return false;
    selected.u = nextU;
    selected.v = nextV;
    const initial = initialRelays[state.selectedNodeIndex];
    state.maximumNodeTravel = Math.max(
      state.maximumNodeTravel,
      Math.hypot((selected.u - initial.u) * 1.58, selected.v - initial.v)
    );
    updateNodeState();
    return true;
  }

  function adjustSelectedGain(delta) {
    const selected = relays[state.selectedNodeIndex];
    const next = clamp(selected.gain + delta, .62, 1.58);
    if (Math.abs(next - selected.gain) < .00001) return false;
    selected.gain = next;
    selected.radius = clamp(selected.baseRadius * (.78 + selected.gain * .22), .12, .26);
    state.gainAdjustmentCount += 1;
    updateNodeState();
    return true;
  }

  function resetPlan() {
    const before = visualStateChecksum();
    relays = initialRelays.map(node => ({ ...node, color: [...node.color], zone: { ...node.zone } }));
    state.selectedNodeIndex = 0;
    state.resetCount += 1;
    updateNodeState();
    return before !== visualStateChecksum();
  }

  stage.addEventListener('pointerenter', event => {
    if (!trustedEvent(event)) return;
    state.pointerEnterCount += 1;
    notePointerType(event.pointerType);
    const signature = visualStateChecksum();
    recordInput('pointer-enter', event.pointerType || 'mouse', signature, signature);
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest?.('button')) return;
    if (!trustedEvent(event)) return;
    const position = pointerPosition(event);
    notePointerType(event.pointerType);
    state.pointerMoveCount += 1;
    const before = visualStateChecksum();
    let changed = false;
    if (state.dragging && state.activePointerId === event.pointerId) {
      changed = moveSelected(position.u, position.v);
      if (changed) {
        state.dragMutationCount += 1;
        state.dragDistance = Math.max(
          state.dragDistance,
          Math.hypot((position.u - state.dragStartU) * 1.58, position.v - state.dragStartV)
        );
      }
    } else {
      const nearest = nearestRelay(position);
      if (nearest.distance < .14) {
        changed = selectNode(nearest.index);
        if (changed) state.hoverSelectionCount += 1;
      }
    }
    updateNodeState();
    const after = visualStateChecksum();
    recordInput(changed ? (state.dragging ? 'pointer-drag' : 'pointer-hover-select') : 'pointer-move', event.pointerType || 'mouse', before, after);
    if (changed) requestDraw(state.dragging ? 'pointer-drag' : 'pointer-hover-select');
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest?.('button')) return;
    if (!trustedEvent(event)) return;
    event.preventDefault();
    const position = pointerPosition(event);
    notePointerType(event.pointerType);
    state.pointerDownCount += 1;
    const before = visualStateChecksum();
    const nearest = nearestRelay(position);
    if (nearest.distance < .24) selectNode(nearest.index);
    state.dragging = true;
    state.activePointerId = event.pointerId;
    state.dragStartU = position.u;
    state.dragStartV = position.v;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    stage.focus({ preventScroll: true });
    updateNodeState();
    const after = visualStateChecksum();
    recordInput('pointer-down', event.pointerType || 'mouse', before, after);
    requestDraw('pointer-down');
  });

  function releasePointer(event, cancelled = false) {
    if (state.activePointerId !== event.pointerId) return;
    if (!trustedEvent(event)) return;
    notePointerType(event.pointerType);
    const signature = visualStateChecksum();
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.dragging = false;
    state.pointerCaptured = false;
    state.activePointerId = null;
    recordInput(cancelled ? 'pointer-cancel' : 'pointer-release', event.pointerType || 'mouse', signature, signature);
    updateInterface();
  }

  stage.addEventListener('pointerup', event => releasePointer(event));
  stage.addEventListener('pointercancel', event => releasePointer(event, true));

  stage.addEventListener('keydown', event => {
    if (!trustedEvent(event)) return;
    const key = event.key;
    const step = event.shiftKey ? .062 : .025;
    const selected = relays[state.selectedNodeIndex];
    const before = visualStateChecksum();
    let changed = false;
    if (key === 'ArrowLeft') changed = moveSelected(selected.u - step, selected.v);
    else if (key === 'ArrowRight') changed = moveSelected(selected.u + step, selected.v);
    else if (key === 'ArrowUp') changed = moveSelected(selected.u, selected.v - step);
    else if (key === 'ArrowDown') changed = moveSelected(selected.u, selected.v + step);
    else if (key === '[' || key === '-' || key === '_') changed = adjustSelectedGain(-.08);
    else if (key === ']' || key === '+' || key === '=') changed = adjustSelectedGain(.08);
    else if (key === 'Enter' || key === ' ') changed = selectNode(state.selectedNodeIndex + 1);
    else if (key === '1' || key === '2' || key === '3') changed = selectNode(Number(key) - 1);
    else if (key === 'Home' || key.toLowerCase() === 'r') changed = resetPlan();
    else return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (changed) state.keyboardMutationCount += 1;
    updateNodeState();
    const after = visualStateChecksum();
    recordInput('keyboard', key, before, after);
    if (changed) requestDraw('keyboard');
  });

  actionButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (!trustedEvent(event)) return;
      event.stopPropagation();
      const action = button.dataset.relayAction;
      const before = visualStateChecksum();
      let changed = false;
      if (action === 'previous') changed = selectNode(state.selectedNodeIndex - 1);
      else if (action === 'next') changed = selectNode(state.selectedNodeIndex + 1);
      else if (action === 'decrease') changed = adjustSelectedGain(-.08);
      else if (action === 'increase') changed = adjustSelectedGain(.08);
      else if (action === 'reset') changed = resetPlan();
      state.buttonActivationCount += 1;
      if (changed) state.buttonMutationCount += 1;
      updateNodeState();
      const after = visualStateChecksum();
      recordInput('button', action, before, after);
      if (changed) requestDraw(`button-${action}`);
    });
  });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch) return;
      const width = Math.max(1, Math.round(stage.clientWidth));
      const height = Math.max(1, Math.round(stage.clientHeight));
      if (sketch.width !== width || sketch.height !== height) {
        sketch.resizeCanvas(width, height, false);
        state.resizeCount += 1;
        requestDraw('viewport-resize');
      }
      updateViewportEvidence();
    });
  });
  resizeObserver.observe(stage);

  const bootReady = Promise.all([fetchAndDecodeAsset(), p5Ready]).then(async () => {
    surveyImage = await loadP5Image();
    surveyImage.loadPixels();
    state.p5ImageDecoded = true;
    state.p5ImageClass = surveyImage instanceof p5.Image ? 'p5.Image' : 'unknown';
    state.p5ImageWidth = surveyImage.width;
    state.p5ImageHeight = surveyImage.height;
    state.p5ImagePixelLength = surveyImage.pixels.length;
    invariant(
      state.p5ImageWidth === SOURCE_WIDTH && state.p5ImageHeight === SOURCE_HEIGHT,
      'p5-decoded survey dimensions are not 960x640'
    );
    await sampleAndBindImage();
    fieldImage = sketch.createImage(SAMPLE_WIDTH, SAMPLE_HEIGHT);
    requestDraw('initial-frame');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialVisualStateChecksum = visualStateChecksum();
    requestDraw('initial-static-check');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialVisualStateRepeatChecksum = visualStateChecksum();
    state.initialStillVerified = state.initialVisualStateChecksum === state.initialVisualStateRepeatChecksum;
    state.ready = true;
    updateInterface();
  });

  async function renderPreviewClock(time) {
    state.previewClockCallCount += 1;
    state.previewClockIgnoredCount += 1;
    state.lastPreviewClockSeconds = rounded(Number(time) || 0);
    return undefined;
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await bootReady;
    updateViewportEvidence();
    const canvas = canvasHost.querySelector('canvas');
    const positionsInside = relays.every(node => node.u >= .04 && node.u <= .96 && node.v >= .06 && node.v <= .94);
    const inputEvidenceValid = state.inputCount === 0
      || (state.trustedInputCount === state.inputCount
        && state.rejectedUntrustedInputCount === 0
        && state.lastInputTrusted === true);
    state.runtimeAssertionPassed = Boolean(
      state.ready
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticOrbit
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.renderIgnoresPreviewClock
      && state.previewClockMutationCount === 0
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetByteLengthMatchesExpected
      && state.assetShaMatchesExpected
      && state.browserImageDecoded
      && state.sourceNaturalWidth === SOURCE_WIDTH
      && state.sourceNaturalHeight === SOURCE_HEIGHT
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === SOURCE_WIDTH
      && state.p5ImageHeight === SOURCE_HEIGHT
      && state.p5ImagePixelLength === SOURCE_WIDTH * SOURCE_HEIGHT * 4
      && state.sampledPixelCount === SAMPLE_PIXEL_COUNT
      && state.sampledByteLength === SAMPLE_PIXEL_COUNT * 4
      && state.sampledPixelSha256.length === 64
      && state.nonzeroSampleByteCount > SAMPLE_PIXEL_COUNT * 2
      && state.opaqueSamplePixelCount === SAMPLE_PIXEL_COUNT
      && state.distinctQuantizedColorCount > 90
      && state.sampleLumaRange > .45
      && state.sampleEdgeRange > .12
      && state.evidenceClassCount === 3
      && state.nodeEvidence.length === 3
      && state.nodeEvidence.every(evidence => evidence.evidencePixels > 20)
      && state.evidenceBindingChecksum > 0
      && state.pixelEvidenceReady
      && state.p5InstanceReady
      && state.p5CanvasReady
      && canvas instanceof HTMLCanvasElement
      && state.p5CanvasWidth > 0
      && state.p5CanvasHeight > 0
      && state.p5CompletedDrawCount >= 2
      && state.fieldEvaluationCount >= SAMPLE_PIXEL_COUNT * 2
      && state.thresholdedFieldCellCount > 100
      && state.signedDistanceContourCellCount > 20
      && state.maximumFieldValue > FIELD_THRESHOLD
      && state.currentFieldChecksum > 0
      && state.stageCoverageRatio > .96
      && state.canvasCoverageRatio > .96
      && state.initialStillVerified
      && state.initialVisualStateChecksum > 0
      && state.animationSettled
      && positionsInside
      && inputEvidenceValid
    );
    return state.runtimeAssertionPassed;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render: renderPreviewClock,
    ready: bootReady
  });
} catch (error) {
  markPreviewFailure(error);
}
