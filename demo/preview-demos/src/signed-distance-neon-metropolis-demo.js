import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-08/signed-distance-neon-metropolis/night-clearance-occupancy-survey.jpg',
  import.meta.url
).href;
const EXPECTED_ASSET_SHA256 = '8b46933f1b6da5075914f317d723fc3f27c38b853035de6e892004b1c9700263';
const EXPECTED_ASSET_BYTE_LENGTH = 345787;
const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_CROP = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
const SAMPLE_WIDTH = 128;
const SAMPLE_HEIGHT = 72;
const SAMPLE_PIXEL_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const SAMPLE_BYTE_LENGTH = SAMPLE_PIXEL_COUNT * 4;
const OCCUPANCY_LUMA_THRESHOLD = 100;
const METRES_PER_CELL = 1.4;
const INITIAL_BUFFER_METRES = 6;
const SQRT_TWO = Math.sqrt(2);

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 4) => Number(value.toFixed(digits));

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function fnvMix(checksum, value) {
  return Math.imul(checksum ^ (value >>> 0), 16777619) >>> 0;
}

try {
  const stage = document.querySelector('#clearance-stage');
  const canvasHost = document.querySelector('#clearance-canvas-host');
  const readout = document.querySelector('#clearance-readout');
  const probeCode = document.querySelector('#probe-code');
  const verdict = document.querySelector('#clearance-verdict');
  const distanceOutput = document.querySelector('#clearance-distance');
  const detail = document.querySelector('#clearance-detail');
  const bufferInput = document.querySelector('#clearance-buffer');
  const bufferOutput = document.querySelector('#buffer-output');
  const actionButtons = [...document.querySelectorAll('[data-action]')];
  const pinButton = document.querySelector('[data-action="pin"]');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'signed-distance-neon-metropolis',
    task: 'human-operated-night-city-right-of-way-clearance-inspection',
    claimedLibrary: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'committed-image-pixels-form-building-occupancy-mask-and-signed-distance-field-queried-by-trusted-human-input',
    assetMechanismRole: 'warm-rooftop-pixels-become-negative-city-mass-while-dark-street-pixels-become-positive-clearance-and-directly-determine-the-live-verdict',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: [
      'mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag',
      'keyboard', 'native-range', 'visible-buttons'
    ],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    initialStaticConfirmed: false,
    automaticCycle: false,
    automaticPlayback: false,
    automaticOrbit: false,
    automaticTimeline: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockCallCount: 0,
    previewClockIgnoredCount: 0,
    previewClockMutationCount: 0,
    nonInputFieldMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    keyboardInputCount: 0,
    keyboardMutationCount: 0,
    rangeInputCount: 0,
    rangeMutationCount: 0,
    buttonActivationCount: 0,
    buttonMutationCount: 0,
    pinToggleCount: 0,
    resetCount: 0,
    humanVisualMutationCount: 0,
    humanInputCausalityCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    dragging: false,
    probeU: .5,
    probeV: .5,
    initialProbeU: .5,
    initialProbeV: .5,
    probeGridX: 0,
    probeGridY: 0,
    probeSignedDistanceMetres: 0,
    minimumHumanSignedDistanceMetres: 0,
    maximumHumanSignedDistanceMetres: 0,
    maximumProbeTravel: 0,
    requiredBufferMetres: INITIAL_BUFFER_METRES,
    minimumHumanBufferMetres: INITIAL_BUFFER_METRES,
    maximumHumanBufferMetres: INITIAL_BUFFER_METRES,
    verdict: 'READY',
    verdictMutationCount: 0,
    pinned: false,
    pinnedU: 0,
    pinnedV: 0,
    pinCount: 0,
    initialVisualChecksum: 0,
    currentVisualChecksum: 0,
    firstHumanStateBefore: null,
    firstHumanStateAfter: null,
    transitionRecords: [],
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
    sourcePixelCount: 0,
    sourceCrop: { ...SOURCE_CROP },
    browserCanvasReadback: false,
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sampledPixelSha256: '',
    nonzeroSampleByteCount: 0,
    opaqueSamplePixelCount: 0,
    distinctQuantizedColorCount: 0,
    minimumSampleLuma: 255,
    maximumSampleLuma: 0,
    sampleLumaMean: 0,
    sampleLumaStdDev: 0,
    occupancyLumaThreshold: OCCUPANCY_LUMA_THRESHOLD,
    occupiedCellCount: 0,
    streetCellCount: 0,
    occupiedCellRatio: 0,
    connectedBuildingMassCount: 0,
    boundaryCellCount: 0,
    signedDistanceCellCount: 0,
    minimumSignedDistanceMetres: 0,
    maximumSignedDistanceMetres: 0,
    positiveStreetDistanceCellCount: 0,
    negativeBuildingDistanceCellCount: 0,
    clearanceContourCellCount: 0,
    fieldChecksum: 0,
    pixelEvidenceReady: false,
    pixelEvidenceBoundToField: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5ImageDecoded: false,
    p5ImageClass: '',
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    renderCount: 0,
    resizeCount: 0,
    stageCoverageRatio: 0,
    canvasCoverageRatio: 0,
    reducedMotion: reducedMotionQuery.matches,
    ready: false,
    runtimeAssertionPassed: false,
    runtimeAssertCount: 0
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__SIGNED_DISTANCE_METROPOLIS_STATE__ = state;

  let sketch;
  let p5SurveyImage;
  let samplePixels = new Uint8ClampedArray(SAMPLE_BYTE_LENGTH);
  let occupancyMask = new Uint8Array(SAMPLE_PIXEL_COUNT);
  let signedDistanceField = new Float32Array(SAMPLE_PIXEL_COUNT);
  let resizeObserver;

  function invariant(condition, message) {
    if (!condition) throw new Error(`signed-distance-neon-metropolis: ${message}`);
  }

  function updateDataset() {
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.humanVisualMutationCount = String(state.humanVisualMutationCount);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.pixelEvidenceBoundToField = String(state.pixelEvidenceBoundToField);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.syntheticInputDispatch = String(state.syntheticInputDispatch);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
    stage.dataset.verdict = state.verdict;
    stage.dataset.pinned = String(state.pinned);
    stage.dataset.initialStaticConfirmed = String(state.initialStaticConfirmed);
    stage.dataset.sampledPixelSha256 = state.sampledPixelSha256;
    stage.dataset.nonzeroSampleByteCount = String(state.nonzeroSampleByteCount);
    stage.dataset.opaqueSamplePixelCount = String(state.opaqueSamplePixelCount);
    stage.dataset.distinctQuantizedColorCount = String(state.distinctQuantizedColorCount);
    stage.dataset.minimumSampleLuma = String(state.minimumSampleLuma);
    stage.dataset.maximumSampleLuma = String(state.maximumSampleLuma);
    stage.dataset.sampleLumaMean = String(state.sampleLumaMean);
    stage.dataset.sampleLumaStdDev = String(state.sampleLumaStdDev);
    stage.dataset.occupiedCellCount = String(state.occupiedCellCount);
    stage.dataset.streetCellCount = String(state.streetCellCount);
    stage.dataset.occupiedCellRatio = String(state.occupiedCellRatio);
    stage.dataset.connectedBuildingMassCount = String(state.connectedBuildingMassCount);
    stage.dataset.boundaryCellCount = String(state.boundaryCellCount);
    stage.dataset.minimumSignedDistanceMetres = String(state.minimumSignedDistanceMetres);
    stage.dataset.maximumSignedDistanceMetres = String(state.maximumSignedDistanceMetres);
    stage.dataset.positiveStreetDistanceCellCount = String(state.positiveStreetDistanceCellCount);
    stage.dataset.negativeBuildingDistanceCellCount = String(state.negativeBuildingDistanceCellCount);
    stage.dataset.clearanceContourCellCount = String(state.clearanceContourCellCount);
    stage.dataset.fieldChecksum = String(state.fieldChecksum);
    stage.dataset.p5ImageClass = state.p5ImageClass;
    stage.dataset.stageCoverageRatio = String(state.stageCoverageRatio);
    stage.dataset.canvasCoverageRatio = String(state.canvasCoverageRatio);
  }

  function visualChecksum() {
    let checksum = 2166136261;
    checksum = fnvMix(checksum, Math.round(state.probeU * 10000));
    checksum = fnvMix(checksum, Math.round(state.probeV * 10000));
    checksum = fnvMix(checksum, state.requiredBufferMetres * 100);
    checksum = fnvMix(checksum, state.pinned ? 1 : 0);
    checksum = fnvMix(checksum, Math.round(state.pinnedU * 10000));
    checksum = fnvMix(checksum, Math.round(state.pinnedV * 10000));
    checksum = fnvMix(checksum, state.fieldChecksum);
    return checksum >>> 0;
  }

  function queryField(u = state.probeU, v = state.probeV) {
    const x = clamp(Math.round(u * (SAMPLE_WIDTH - 1)), 0, SAMPLE_WIDTH - 1);
    const y = clamp(Math.round(v * (SAMPLE_HEIGHT - 1)), 0, SAMPLE_HEIGHT - 1);
    return { x, y, distance: signedDistanceField[y * SAMPLE_WIDTH + x] };
  }

  function verdictFor(distance, buffer) {
    if (distance <= .35) return 'BLOCKED';
    if (distance < buffer) return 'TIGHT';
    return 'CLEAR';
  }

  function statusColor(currentVerdict) {
    if (currentVerdict === 'BLOCKED') return '#ff4acb';
    if (currentVerdict === 'TIGHT') return '#ffd590';
    return '#60f5ff';
  }

  function syncInterface() {
    const query = queryField();
    const nextVerdict = verdictFor(query.distance, state.requiredBufferMetres);
    if (nextVerdict !== state.verdict && state.ready) state.verdictMutationCount += 1;
    state.probeGridX = query.x;
    state.probeGridY = query.y;
    state.probeSignedDistanceMetres = rounded(query.distance, 2);
    state.verdict = nextVerdict;
    state.currentVisualChecksum = visualChecksum();
    readout.style.setProperty('--status-color', statusColor(nextVerdict));
    probeCode.textContent = `Q-${String(query.x + 1).padStart(2, '0')}`;
    verdict.textContent = nextVerdict;
    distanceOutput.textContent = query.distance < 0
      ? `${Math.abs(query.distance).toFixed(1)} M INSIDE`
      : `${query.distance.toFixed(1)} M EDGE`;
    detail.textContent = nextVerdict === 'BLOCKED'
      ? 'Probe overlaps pixel-derived rooftop mass.'
      : nextVerdict === 'TIGHT'
        ? `${Math.max(0, state.requiredBufferMetres - query.distance).toFixed(1)} m short of the selected buffer.`
        : `${Math.max(0, query.distance - state.requiredBufferMetres).toFixed(1)} m beyond the selected buffer.`;
    bufferInput.value = String(state.requiredBufferMetres);
    bufferOutput.textContent = `${state.requiredBufferMetres} M`;
    pinButton.setAttribute('aria-pressed', String(state.pinned));
    pinButton.textContent = state.pinned ? 'Pinned' : 'Pin';
    updateDataset();
  }

  function redraw() {
    syncInterface();
    if (sketch && state.p5ImageDecoded) sketch.redraw();
  }

  function analysePixels(pixels) {
    let lumaTotal = 0;
    let lumaSquared = 0;
    let nonzeroBytes = 0;
    let opaquePixels = 0;
    const quantizedColors = new Set();

    for (let index = 0; index < SAMPLE_PIXEL_COUNT; index += 1) {
      const offset = index * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const alpha = pixels[offset + 3];
      const luma = .2126 * red + .7152 * green + .0722 * blue;
      lumaTotal += luma;
      lumaSquared += luma * luma;
      state.minimumSampleLuma = Math.min(state.minimumSampleLuma, luma);
      state.maximumSampleLuma = Math.max(state.maximumSampleLuma, luma);
      nonzeroBytes += Number(red > 0) + Number(green > 0) + Number(blue > 0) + Number(alpha > 0);
      opaquePixels += Number(alpha === 255);
      quantizedColors.add(`${red >> 3},${green >> 3},${blue >> 3}`);
      const warmRoof = luma > OCCUPANCY_LUMA_THRESHOLD && red > blue + 12 && red > green * .94;
      occupancyMask[index] = warmRoof ? 1 : 0;
    }

    state.sampleLumaMean = rounded(lumaTotal / SAMPLE_PIXEL_COUNT, 3);
    state.sampleLumaStdDev = rounded(Math.sqrt(Math.max(0, lumaSquared / SAMPLE_PIXEL_COUNT - (lumaTotal / SAMPLE_PIXEL_COUNT) ** 2)), 3);
    state.minimumSampleLuma = rounded(state.minimumSampleLuma, 3);
    state.maximumSampleLuma = rounded(state.maximumSampleLuma, 3);
    state.nonzeroSampleByteCount = nonzeroBytes;
    state.opaqueSamplePixelCount = opaquePixels;
    state.distinctQuantizedColorCount = quantizedColors.size;
    state.occupiedCellCount = occupancyMask.reduce((total, value) => total + value, 0);
    state.streetCellCount = SAMPLE_PIXEL_COUNT - state.occupiedCellCount;
    state.occupiedCellRatio = rounded(state.occupiedCellCount / SAMPLE_PIXEL_COUNT, 5);

    const visited = new Uint8Array(SAMPLE_PIXEL_COUNT);
    let connectedMasses = 0;
    for (let index = 0; index < SAMPLE_PIXEL_COUNT; index += 1) {
      if (!occupancyMask[index] || visited[index]) continue;
      const queue = [index];
      visited[index] = 1;
      let massSize = 0;
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const current = queue[cursor];
        massSize += 1;
        const x = current % SAMPLE_WIDTH;
        const y = Math.floor(current / SAMPLE_WIDTH);
        const neighbours = [
          x > 0 ? current - 1 : -1,
          x < SAMPLE_WIDTH - 1 ? current + 1 : -1,
          y > 0 ? current - SAMPLE_WIDTH : -1,
          y < SAMPLE_HEIGHT - 1 ? current + SAMPLE_WIDTH : -1
        ];
        neighbours.forEach(neighbour => {
          if (neighbour >= 0 && occupancyMask[neighbour] && !visited[neighbour]) {
            visited[neighbour] = 1;
            queue.push(neighbour);
          }
        });
      }
      if (massSize >= 5) connectedMasses += 1;
    }
    state.connectedBuildingMassCount = connectedMasses;
  }

  function calculateSignedDistanceField() {
    const distances = new Float32Array(SAMPLE_PIXEL_COUNT);
    distances.fill(Number.POSITIVE_INFINITY);
    let boundaryCells = 0;
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const index = y * SAMPLE_WIDTH + x;
        const occupied = occupancyMask[index];
        const left = occupancyMask[y * SAMPLE_WIDTH + Math.max(0, x - 1)];
        const right = occupancyMask[y * SAMPLE_WIDTH + Math.min(SAMPLE_WIDTH - 1, x + 1)];
        const above = occupancyMask[Math.max(0, y - 1) * SAMPLE_WIDTH + x];
        const below = occupancyMask[Math.min(SAMPLE_HEIGHT - 1, y + 1) * SAMPLE_WIDTH + x];
        if (left !== occupied || right !== occupied || above !== occupied || below !== occupied) {
          distances[index] = 0;
          boundaryCells += 1;
        }
      }
    }
    state.boundaryCellCount = boundaryCells;

    const visit = (x, y, neighbours) => {
      const index = y * SAMPLE_WIDTH + x;
      let nearest = distances[index];
      neighbours.forEach(([dx, dy, weight]) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= SAMPLE_WIDTH || ny < 0 || ny >= SAMPLE_HEIGHT) return;
        nearest = Math.min(nearest, distances[ny * SAMPLE_WIDTH + nx] + weight);
      });
      distances[index] = nearest;
    };

    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        visit(x, y, [[-1, 0, 1], [0, -1, 1], [-1, -1, SQRT_TWO], [1, -1, SQRT_TWO]]);
      }
    }
    for (let y = SAMPLE_HEIGHT - 1; y >= 0; y -= 1) {
      for (let x = SAMPLE_WIDTH - 1; x >= 0; x -= 1) {
        visit(x, y, [[1, 0, 1], [0, 1, 1], [1, 1, SQRT_TWO], [-1, 1, SQRT_TWO]]);
      }
    }

    let minimum = Number.POSITIVE_INFINITY;
    let maximum = Number.NEGATIVE_INFINITY;
    let positive = 0;
    let negative = 0;
    let contourCells = 0;
    let safestIndex = 0;
    let safestDistance = Number.NEGATIVE_INFINITY;
    let checksum = 2166136261;
    for (let index = 0; index < SAMPLE_PIXEL_COUNT; index += 1) {
      const signed = (occupancyMask[index] ? -distances[index] : distances[index]) * METRES_PER_CELL;
      signedDistanceField[index] = signed;
      minimum = Math.min(minimum, signed);
      maximum = Math.max(maximum, signed);
      positive += Number(signed > 0);
      negative += Number(signed < 0);
      contourCells += Number(Math.abs(signed) <= METRES_PER_CELL * 1.05);
      checksum = fnvMix(checksum, Math.round((signed + 40) * 100));
      if (signed > safestDistance) {
        safestDistance = signed;
        safestIndex = index;
      }
    }

    state.signedDistanceCellCount = SAMPLE_PIXEL_COUNT;
    state.minimumSignedDistanceMetres = rounded(minimum, 3);
    state.maximumSignedDistanceMetres = rounded(maximum, 3);
    state.positiveStreetDistanceCellCount = positive;
    state.negativeBuildingDistanceCellCount = negative;
    state.clearanceContourCellCount = contourCells;
    state.fieldChecksum = checksum >>> 0;
    state.initialProbeU = (safestIndex % SAMPLE_WIDTH) / (SAMPLE_WIDTH - 1);
    state.initialProbeV = Math.floor(safestIndex / SAMPLE_WIDTH) / (SAMPLE_HEIGHT - 1);
    state.probeU = state.initialProbeU;
    state.probeV = state.initialProbeV;
    state.minimumHumanSignedDistanceMetres = rounded(safestDistance, 3);
    state.maximumHumanSignedDistanceMetres = rounded(safestDistance, 3);
    state.pixelEvidenceBoundToField = state.occupiedCellCount > 0
      && state.streetCellCount > 0
      && state.boundaryCellCount > 0
      && state.fieldChecksum > 0;
  }

  async function loadPixelEvidence() {
    state.assetFetchCount += 1;
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `asset fetch failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetByteLengthMatchesExpected = bytes.byteLength === EXPECTED_ASSET_BYTE_LENGTH;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    invariant(state.assetByteLengthMatchesExpected, 'committed asset byte length changed');
    invariant(state.assetShaMatchesExpected, 'committed asset SHA-256 changed');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: state.assetMimeType || 'image/jpeg' }));
    const image = new Image();
    image.src = objectUrl;
    try {
      await image.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = image.naturalWidth;
      state.sourceNaturalHeight = image.naturalHeight;
      state.sourcePixelCount = image.naturalWidth * image.naturalHeight;
      invariant(image.naturalWidth === SOURCE_WIDTH && image.naturalHeight === SOURCE_HEIGHT, 'source dimensions changed');

      const sampler = document.createElement('canvas');
      sampler.width = SAMPLE_WIDTH;
      sampler.height = SAMPLE_HEIGHT;
      const context = sampler.getContext('2d', { willReadFrequently: true });
      invariant(context, '2D sampling context is unavailable');
      context.drawImage(
        image,
        SOURCE_CROP.x, SOURCE_CROP.y, SOURCE_CROP.width, SOURCE_CROP.height,
        0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT
      );
      const imageData = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
      samplePixels = new Uint8ClampedArray(imageData.data);
      state.browserCanvasReadback = true;
      state.sampledPixelCount = SAMPLE_PIXEL_COUNT;
      state.sampledPixelByteLength = samplePixels.byteLength;
      state.sampledPixelSha256 = await sha256(samplePixels.buffer.slice(0));
      analysePixels(samplePixels);
      calculateSignedDistanceField();
      state.pixelEvidenceReady = true;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    stage.style.setProperty('--survey-image', `url("${ASSET_URL}")`);
  }

  function updateCoverageEvidence() {
    const stageRect = stage.getBoundingClientRect();
    const canvas = canvasHost.querySelector('canvas');
    const canvasRect = canvas?.getBoundingClientRect();
    const viewportArea = Math.max(1, innerWidth * innerHeight);
    const stageArea = stageRect.width * stageRect.height;
    const canvasArea = canvasRect ? canvasRect.width * canvasRect.height : 0;
    state.stageCoverageRatio = rounded(stageArea / viewportArea, 4);
    state.canvasCoverageRatio = rounded(canvasArea / Math.max(1, stageArea), 4);
  }

  function drawSurface() {
    if (!p5SurveyImage || !state.pixelEvidenceReady) return;
    state.p5DrawCount += 1;
    const width = sketch.width;
    const height = sketch.height;
    const cellWidth = width / SAMPLE_WIDTH;
    const cellHeight = height / SAMPLE_HEIGHT;

    sketch.clear();
    sketch.background(3, 6, 12);
    sketch.push();
    sketch.tint(255, 108);
    sketch.image(
      p5SurveyImage,
      0, 0, width, height,
      SOURCE_CROP.x, SOURCE_CROP.y, SOURCE_CROP.width, SOURCE_CROP.height
    );
    sketch.pop();

    sketch.noStroke();
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const index = y * SAMPLE_WIDTH + x;
        const distance = signedDistanceField[index];
        const absolute = Math.abs(distance);
        const edge = clamp(1 - absolute / 4.6, 0, 1);
        const safety = distance > 0 ? clamp(1 - distance / state.requiredBufferMetres, 0, 1) : 0;
        const isoline = Math.abs((absolute % 3.5) - 1.75) < .24 ? 1 : 0;
        if (distance <= 0) {
          const alpha = 20 + edge * 122 + isoline * 22;
          sketch.fill(255, 73 + edge * 42, 184 + edge * 47, alpha);
        } else if (safety > 0) {
          sketch.fill(255, 70 + safety * 85, 201, 18 + safety * 115 + isoline * 20);
        } else {
          sketch.fill(61, 218 + edge * 35, 255, 8 + edge * 78 + isoline * 18);
        }
        sketch.rect(x * cellWidth, y * cellHeight, cellWidth + .7, cellHeight + .7);
      }
    }

    sketch.push();
    sketch.noFill();
    sketch.strokeWeight(Math.max(1, Math.min(width, height) / 260));
    sketch.stroke(102, 238, 255, 55);
    for (let x = 0; x <= SAMPLE_WIDTH; x += 16) {
      sketch.line(x * cellWidth, 0, x * cellWidth, height);
    }
    for (let y = 0; y <= SAMPLE_HEIGHT; y += 12) {
      sketch.line(0, y * cellHeight, width, y * cellHeight);
    }
    sketch.pop();

    if (state.pinned) {
      const pinnedX = state.pinnedU * width;
      const pinnedY = state.pinnedV * height;
      sketch.push();
      sketch.noFill();
      sketch.stroke(255, 77, 203, 200);
      sketch.strokeWeight(Math.max(1.2, Math.min(width, height) / 180));
      sketch.circle(pinnedX, pinnedY, Math.max(12, Math.min(width, height) * .075));
      sketch.line(pinnedX - 6, pinnedY, pinnedX + 6, pinnedY);
      sketch.line(pinnedX, pinnedY - 6, pinnedX, pinnedY + 6);
      sketch.pop();
    }

    const probeX = state.probeU * width;
    const probeY = state.probeV * height;
    const probeColor = state.verdict === 'BLOCKED'
      ? [255, 74, 203]
      : state.verdict === 'TIGHT'
        ? [255, 213, 144]
        : [96, 245, 255];
    const haloDiameter = Math.max(20, state.requiredBufferMetres / METRES_PER_CELL * cellWidth * 2);
    sketch.push();
    sketch.noFill();
    sketch.stroke(...probeColor, 78);
    sketch.strokeWeight(Math.max(1, Math.min(width, height) / 260));
    sketch.circle(probeX, probeY, haloDiameter);
    sketch.stroke(...probeColor, 230);
    sketch.strokeWeight(Math.max(1.5, Math.min(width, height) / 145));
    sketch.circle(probeX, probeY, Math.max(9, Math.min(width, height) * .035));
    sketch.line(probeX - 7, probeY, probeX + 7, probeY);
    sketch.line(probeX, probeY - 7, probeX, probeY + 7);
    sketch.fill(...probeColor, 255);
    sketch.noStroke();
    sketch.circle(probeX, probeY, Math.max(3, Math.min(width, height) * .012));
    sketch.pop();
    state.p5CompletedDrawCount += 1;
  }

  function createP5Runtime() {
    return new Promise((resolve, reject) => {
      sketch = new p5(instance => {
        instance.setup = () => {
          try {
            const rect = canvasHost.getBoundingClientRect();
            const canvas = instance.createCanvas(Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)));
            canvas.parent(canvasHost);
            canvas.attribute('aria-hidden', 'true');
            instance.pixelDensity(1);
            instance.noLoop();
            state.p5InstanceReady = true;
            state.p5CanvasReady = true;
            state.p5CanvasWidth = instance.width;
            state.p5CanvasHeight = instance.height;
            instance.loadImage(
              ASSET_URL,
              loaded => {
                try {
                  p5SurveyImage = loaded;
                  loaded.loadPixels();
                  state.p5ImageDecoded = true;
                  state.p5ImageClass = loaded instanceof p5.Image ? 'p5.Image' : loaded.constructor?.name || '';
                  state.p5ImageWidth = loaded.width;
                  state.p5ImageHeight = loaded.height;
                  state.p5ImagePixelLength = loaded.pixels.length;
                  syncInterface();
                  instance.redraw();
                  requestAnimationFrame(() => {
                    updateCoverageEvidence();
                    resolve();
                  });
                } catch (error) {
                  reject(error);
                }
              },
              error => reject(error)
            );
          } catch (error) {
            reject(error);
          }
        };
        instance.draw = drawSurface;
      }, canvasHost);
    });
  }

  function rememberHumanTransition(kind, source, before, after) {
    state.humanVisualMutationCount += 1;
    state.humanInputCausalityCount += 1;
    if (state.firstHumanStateBefore === null) {
      state.firstHumanStateBefore = before;
      state.firstHumanStateAfter = after;
    }
    state.transitionRecords.push({ kind, source, before, after, trusted: true });
    if (state.transitionRecords.length > 48) state.transitionRecords.shift();
  }

  function acceptTrustedInput(event, kind, source) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      updateDataset();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if ('pointerType' in event) {
      const pointerType = event.pointerType || 'mouse';
      state.lastPointerType = pointerType;
      if (pointerType === 'mouse') state.mouseInputCount += 1;
      if (pointerType === 'touch') state.touchInputCount += 1;
      if (pointerType === 'pen') state.penInputCount += 1;
    }
    return true;
  }

  function setProbe(u, v, kind, source) {
    const before = visualChecksum();
    const oldU = state.probeU;
    const oldV = state.probeV;
    state.probeU = clamp(u, 0, 1);
    state.probeV = clamp(v, 0, 1);
    const travel = Math.hypot(state.probeU - oldU, state.probeV - oldV);
    state.maximumProbeTravel = Math.max(state.maximumProbeTravel, rounded(travel, 5));
    const nextDistance = queryField().distance;
    state.minimumHumanSignedDistanceMetres = Math.min(state.minimumHumanSignedDistanceMetres, rounded(nextDistance, 3));
    state.maximumHumanSignedDistanceMetres = Math.max(state.maximumHumanSignedDistanceMetres, rounded(nextDistance, 3));
    const after = visualChecksum();
    if (after !== before) rememberHumanTransition(kind, source, before, after);
    redraw();
    return after !== before;
  }

  function pointerPosition(event) {
    const rect = canvasHost.getBoundingClientRect();
    return {
      u: clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
      v: clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
    };
  }

  function bindInputs() {
    canvasHost.addEventListener('pointerenter', event => {
      if (!event.isTrusted) {
        state.rejectedUntrustedInputCount += 1;
        updateDataset();
        return;
      }
      state.pointerEnterCount += 1;
      state.lastPointerType = event.pointerType || 'mouse';
      updateDataset();
    });

    canvasHost.addEventListener('pointerdown', event => {
      if (!acceptTrustedInput(event, 'pointer-down', 'city-field')) return;
      state.pointerDownCount += 1;
      state.dragging = true;
      state.activePointerId = event.pointerId;
      canvasHost.setPointerCapture(event.pointerId);
      state.pointerCaptured = canvasHost.hasPointerCapture(event.pointerId);
      if (state.pointerCaptured) state.pointerCaptureCount += 1;
      const point = pointerPosition(event);
      setProbe(point.u, point.v, 'pointer-down', 'city-field');
      event.preventDefault();
    });

    canvasHost.addEventListener('pointermove', event => {
      if (!acceptTrustedInput(event, state.dragging ? 'pointer-drag' : 'pointer-hover', 'city-field')) return;
      state.pointerMoveCount += 1;
      const point = pointerPosition(event);
      const changed = setProbe(point.u, point.v, state.dragging ? 'pointer-drag' : 'pointer-hover', 'city-field');
      if (changed && state.dragging) state.dragMutationCount += 1;
      if (changed && !state.dragging) state.hoverMutationCount += 1;
      event.preventDefault();
    });

    const releasePointer = (event, cancelled) => {
      if (!acceptTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-release', 'city-field')) return;
      if (cancelled) state.pointerCancelCount += 1;
      else state.pointerReleaseCount += 1;
      if (state.activePointerId === event.pointerId && canvasHost.hasPointerCapture(event.pointerId)) {
        canvasHost.releasePointerCapture(event.pointerId);
        state.pointerCaptureReleaseCount += 1;
      }
      state.dragging = false;
      state.pointerCaptured = false;
      state.activePointerId = null;
      updateDataset();
    };
    canvasHost.addEventListener('pointerup', event => releasePointer(event, false));
    canvasHost.addEventListener('pointercancel', event => releasePointer(event, true));

    canvasHost.addEventListener('keydown', event => {
      const key = event.key;
      const supported = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'Enter', ' ', 'Escape', '+', '=','-', '_'].includes(key);
      if (!supported || !acceptTrustedInput(event, 'keyboard', 'city-field')) return;
      state.keyboardInputCount += 1;
      const before = visualChecksum();
      const step = event.shiftKey ? .05 : .018;
      if (key === 'ArrowLeft') state.probeU = clamp(state.probeU - step, 0, 1);
      if (key === 'ArrowRight') state.probeU = clamp(state.probeU + step, 0, 1);
      if (key === 'ArrowUp') state.probeV = clamp(state.probeV - step, 0, 1);
      if (key === 'ArrowDown') state.probeV = clamp(state.probeV + step, 0, 1);
      if (key === 'Home' || key === 'Escape') {
        state.probeU = state.initialProbeU;
        state.probeV = state.initialProbeV;
        state.requiredBufferMetres = INITIAL_BUFFER_METRES;
        state.pinned = false;
        state.resetCount += 1;
      }
      if (key === 'Enter' || key === ' ') {
        state.pinned = !state.pinned;
        if (state.pinned) {
          state.pinnedU = state.probeU;
          state.pinnedV = state.probeV;
          state.pinCount += 1;
        }
        state.pinToggleCount += 1;
      }
      if (key === '+' || key === '=') state.requiredBufferMetres = Math.min(12, state.requiredBufferMetres + 1);
      if (key === '-' || key === '_') state.requiredBufferMetres = Math.max(3, state.requiredBufferMetres - 1);
      const query = queryField();
      state.minimumHumanSignedDistanceMetres = Math.min(state.minimumHumanSignedDistanceMetres, rounded(query.distance, 3));
      state.maximumHumanSignedDistanceMetres = Math.max(state.maximumHumanSignedDistanceMetres, rounded(query.distance, 3));
      state.minimumHumanBufferMetres = Math.min(state.minimumHumanBufferMetres, state.requiredBufferMetres);
      state.maximumHumanBufferMetres = Math.max(state.maximumHumanBufferMetres, state.requiredBufferMetres);
      const after = visualChecksum();
      if (after !== before) {
        state.keyboardMutationCount += 1;
        rememberHumanTransition('keyboard', key, before, after);
      }
      redraw();
      event.preventDefault();
    });

    bufferInput.addEventListener('input', event => {
      if (!acceptTrustedInput(event, 'native-range', 'clearance-buffer')) return;
      state.rangeInputCount += 1;
      const before = visualChecksum();
      state.requiredBufferMetres = clamp(Number(bufferInput.value), 3, 12);
      state.minimumHumanBufferMetres = Math.min(state.minimumHumanBufferMetres, state.requiredBufferMetres);
      state.maximumHumanBufferMetres = Math.max(state.maximumHumanBufferMetres, state.requiredBufferMetres);
      const after = visualChecksum();
      if (after !== before) {
        state.rangeMutationCount += 1;
        rememberHumanTransition('native-range', 'clearance-buffer', before, after);
      }
      redraw();
    });

    actionButtons.forEach(button => button.addEventListener('click', event => {
      if (!acceptTrustedInput(event, 'visible-button', button.dataset.action)) return;
      state.buttonActivationCount += 1;
      const before = visualChecksum();
      if (button.dataset.action === 'pin') {
        state.pinned = !state.pinned;
        if (state.pinned) {
          state.pinnedU = state.probeU;
          state.pinnedV = state.probeV;
          state.pinCount += 1;
        }
        state.pinToggleCount += 1;
      }
      if (button.dataset.action === 'reset') {
        state.probeU = state.initialProbeU;
        state.probeV = state.initialProbeV;
        state.requiredBufferMetres = INITIAL_BUFFER_METRES;
        state.pinned = false;
        state.resetCount += 1;
      }
      const after = visualChecksum();
      if (after !== before) {
        state.buttonMutationCount += 1;
        rememberHumanTransition('visible-button', button.dataset.action, before, after);
      }
      redraw();
    }));

    resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry || !sketch || !state.p5CanvasReady) return;
      const width = Math.max(1, Math.round(entry.contentRect.width));
      const height = Math.max(1, Math.round(entry.contentRect.height));
      if (width === sketch.width && height === sketch.height) return;
      sketch.resizeCanvas(width, height, true);
      state.p5CanvasWidth = width;
      state.p5CanvasHeight = height;
      state.resizeCount += 1;
      updateCoverageEvidence();
      sketch.redraw();
    });
    resizeObserver.observe(canvasHost);
  }

  async function initialize() {
    invariant(stage instanceof HTMLElement, 'stage is missing');
    invariant(canvasHost instanceof HTMLElement, 'canvas host is missing');
    invariant(readout instanceof HTMLElement && bufferInput instanceof HTMLInputElement, 'controls are incomplete');
    await loadPixelEvidence();
    invariant(state.assetFetchCount === 1 && state.assetResponseStatus === 200 && state.assetSameOrigin, 'same-origin asset fetch evidence is incomplete');
    invariant(state.assetByteLength === EXPECTED_ASSET_BYTE_LENGTH && state.assetShaMatchesExpected, 'exact asset bytes are not proven');
    invariant(state.browserImageDecoded && state.sourceNaturalWidth === SOURCE_WIDTH && state.sourceNaturalHeight === SOURCE_HEIGHT, 'browser image decode is incomplete');
    invariant(state.sampledPixelCount === SAMPLE_PIXEL_COUNT && state.sampledPixelByteLength === SAMPLE_BYTE_LENGTH, 'pixel sample is incomplete');
    invariant(state.opaqueSamplePixelCount === SAMPLE_PIXEL_COUNT && state.sampledPixelSha256.length === 64, 'pixel sample evidence is malformed');
    invariant(state.distinctQuantizedColorCount >= 400 && state.sampleLumaStdDev >= 45, 'generated survey lacks useful visual evidence');
    invariant(state.occupiedCellRatio >= .25 && state.occupiedCellRatio <= .58, 'pixel-derived occupancy is outside the robust range');
    invariant(state.connectedBuildingMassCount >= 12 && state.connectedBuildingMassCount <= 35, 'pixel-derived building masses are implausible');
    invariant(state.boundaryCellCount >= 1200 && state.boundaryCellCount <= 4200, 'pixel-derived city boundary evidence is implausible');
    invariant(state.minimumSignedDistanceMetres <= -6 && state.maximumSignedDistanceMetres >= 7, 'signed field lacks meaningful positive and negative range');
    invariant(state.pixelEvidenceBoundToField, 'source pixels are not bound to the signed-distance field');
    await createP5Runtime();
    invariant(state.p5InstanceReady && state.p5CanvasReady, 'p5 canvas did not initialize');
    invariant(state.p5ImageDecoded && state.p5ImageClass === 'p5.Image', 'p5 did not decode the committed survey');
    invariant(state.p5ImageWidth === SOURCE_WIDTH && state.p5ImageHeight === SOURCE_HEIGHT, 'p5 image dimensions changed');
    invariant(state.p5ImagePixelLength === SOURCE_WIDTH * SOURCE_HEIGHT * 4, 'p5 image pixel evidence is incomplete');
    bindInputs();
    syncInterface();
    state.initialVisualChecksum = visualChecksum();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialStaticConfirmed = state.initialVisualChecksum === visualChecksum()
      && state.inputCount === 0
      && state.humanVisualMutationCount === 0
      && state.nonInputFieldMutationCount === 0;
    invariant(state.initialStaticConfirmed, 'initial city field changed without human input');
    updateCoverageEvidence();
    invariant(state.stageCoverageRatio > .98 && state.canvasCoverageRatio > .98, 'live field does not cover the full stage');
    state.ready = true;
    syncInterface();
  }

  function renderFromPreviewClock(_seconds, captureClock) {
    state.renderCount += 1;
    if (captureClock) {
      state.previewClockCallCount += 1;
      state.previewClockIgnoredCount += 1;
    }
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    state.runtimeAssertCount += 1;
    const before = visualChecksum();
    renderFromPreviewClock(0, true);
    renderFromPreviewClock(2.75, true);
    const after = visualChecksum();
    updateCoverageEvidence();
    const exactAssetEvidence = state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetMimeType.includes('image/jpeg')
      && state.assetByteLength === EXPECTED_ASSET_BYTE_LENGTH
      && state.assetByteLengthMatchesExpected
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.assetShaMatchesExpected
      && state.browserImageDecoded
      && state.sourceNaturalWidth === SOURCE_WIDTH
      && state.sourceNaturalHeight === SOURCE_HEIGHT;
    const derivedPixelEvidence = state.browserCanvasReadback
      && state.sampledPixelCount === SAMPLE_PIXEL_COUNT
      && state.sampledPixelByteLength === SAMPLE_BYTE_LENGTH
      && state.sampledPixelSha256.length === 64
      && /[1-9a-f]/.test(state.sampledPixelSha256)
      && state.nonzeroSampleByteCount > SAMPLE_PIXEL_COUNT * 3
      && state.opaqueSamplePixelCount === SAMPLE_PIXEL_COUNT
      && state.distinctQuantizedColorCount >= 400
      && state.minimumSampleLuma >= 0
      && state.minimumSampleLuma < 20
      && state.maximumSampleLuma > 210
      && state.maximumSampleLuma <= 255
      && state.sampleLumaMean > 65
      && state.sampleLumaMean < 115
      && state.sampleLumaStdDev > 55
      && state.sampleLumaStdDev < 95;
    const fieldEvidence = state.occupiedCellCount + state.streetCellCount === SAMPLE_PIXEL_COUNT
      && state.occupiedCellRatio >= .25
      && state.occupiedCellRatio <= .58
      && state.connectedBuildingMassCount >= 12
      && state.connectedBuildingMassCount <= 35
      && state.boundaryCellCount >= 1200
      && state.boundaryCellCount <= 4200
      && state.signedDistanceCellCount === SAMPLE_PIXEL_COUNT
      && state.positiveStreetDistanceCellCount > 3200
      && state.negativeBuildingDistanceCellCount > 1800
      && state.minimumSignedDistanceMetres <= -6
      && state.maximumSignedDistanceMetres >= 7
      && state.clearanceContourCellCount > 1000
      && state.fieldChecksum > 0
      && state.pixelEvidenceBoundToField;
    const p5Evidence = state.p5InstanceReady
      && state.p5CanvasReady
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === SOURCE_WIDTH
      && state.p5ImageHeight === SOURCE_HEIGHT
      && state.p5ImagePixelLength === SOURCE_WIDTH * SOURCE_HEIGHT * 4
      && state.p5CompletedDrawCount >= 1;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStaticConfirmed
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticOrbit
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.nonInputFieldMutationCount === 0
      && state.renderIgnoresPreviewClock
      && before === after
      && state.transitionRecords.every(record => record.trusted === true);
    const humanOwned = state.inputCount === 0
      ? state.currentVisualChecksum === state.initialVisualChecksum && state.humanVisualMutationCount === 0
      : state.inputCount === state.trustedInputCount
        && state.lastInputTrusted === true
        && state.humanVisualMutationCount > 0
        && state.humanInputCausalityCount > 0;
    const fullStage = state.stageCoverageRatio > .98 && state.canvasCoverageRatio > .98;
    state.runtimeAssertionPassed = Boolean(
      state.ready && exactAssetEvidence && derivedPixelEvidence && fieldEvidence
      && p5Evidence && honestInteraction && humanOwned && fullStage
    );
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
    return state.runtimeAssertionPassed;
  };

  const ready = initialize();
  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: state.renderer,
    render: renderFromPreviewClock,
    ready
  });

  window.addEventListener('beforeunload', () => resizeObserver?.disconnect(), { once: true });
} catch (error) {
  markPreviewFailure(error);
}
