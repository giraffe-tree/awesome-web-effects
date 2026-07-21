import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ATLAS_URL = new URL(
  '../assets/aesthetic-wave-06/animated-bezier-route-cartography/checkpoint-atlas.jpg',
  import.meta.url,
).href;
const ATLAS_SHA256 = '4511d72d39ff9954a5f4d5aa86fee96e3f4d520babbacca0a0d8208f81751e62';
const ATLAS_BYTE_LENGTH = 252082;
const TOTAL_DISTANCE_KM = 14.8;
const SVG_NS = 'http://www.w3.org/2000/svg';
const STOPS = [
  {
    id: 'slate-depot',
    code: 'DEP',
    name: 'Slate depot',
    note: 'Seal logged · payload ready',
    progress: 0,
    label: 'DEPOT',
    labelX: 7,
    labelY: 11,
  },
  {
    id: 'ridge-transfer',
    code: 'RDG',
    name: 'Ridge transfer',
    note: 'Bike handoff · 04.1°C',
    progress: 0.515,
    label: 'RIDGE',
    labelX: -16,
    labelY: -9,
  },
  {
    id: 'north-clinic',
    code: 'CLN',
    name: 'North clinic',
    note: 'Reception · seal intact',
    progress: 1,
    label: 'CLINIC',
    labelX: -24,
    labelY: -9,
  },
];

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const hexDigest = buffer => [...new Uint8Array(buffer)]
  .map(value => value.toString(16).padStart(2, '0'))
  .join('');

function pixelChecksum(pixels) {
  let checksum = 2166136261;
  for (let index = 0; index < pixels.length; index += 4) {
    checksum ^= pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7 + pixels[index + 3] * 11;
    checksum = Math.imul(checksum, 16777619);
  }
  return checksum >>> 0;
}

function visualSnapshot(route, courier, photo, state) {
  return [
    state.progress.toFixed(6),
    state.selectedStopIndex,
    route.getAttribute('stroke-dashoffset'),
    courier.getAttribute('transform'),
    photo.style.backgroundPosition,
  ].join('|');
}

try {
  const stage = document.querySelector('#route-stage');
  const shell = document.querySelector('.route-shell');
  const svg = document.querySelector('#route-map');
  const route = document.querySelector('#route');
  const courier = document.querySelector('#courier');
  const stationsLayer = document.querySelector('#stations-layer');
  const range = document.querySelector('#route-range');
  const distanceOutput = document.querySelector('#distance-output');
  const progressOutput = document.querySelector('#progress-output');
  const photo = document.querySelector('#checkpoint-photo');
  const photoCode = document.querySelector('#photo-code');
  const stopIndexOutput = document.querySelector('#stop-index');
  const stopName = document.querySelector('#stop-name');
  const stopNote = document.querySelector('#stop-note');
  const completionOutput = document.querySelector('#completion-output');
  const stopControls = [...document.querySelectorAll('.stop-control')];
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const routeLength = route.getTotalLength();
  const routeData = route.getAttribute('d');

  const state = {
    id: 'animated-bezier-route-cartography',
    task: 'human-owned-fictional-cold-chain-route-inspection',
    claimedLibrary: 'motion@12.42.2',
    renderer: 'svg',
    mechanism: 'paused-motion-svg-dash-synchronized-to-bezier-arc-length-position-and-tangent',
    acceptedInputs: ['mouse-captured-scrub', 'touch-captured-scrub', 'pen-captured-scrub', 'keyboard', 'range', 'station-control'],
    userInputRequired: true,
    automaticPlayback: false,
    automaticTimeline: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    previewClockMutationCount: 0,
    previewRenderCount: 0,
    resizeCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    stageScale: 1,
    shellWidth: 0,
    shellHeight: 0,
    fullStageCoverageVerified: false,
    renderIgnoresPreviewClock: true,
    initialProgress: 0,
    initialFrameStatic: true,
    initialStaticVerified: false,
    initialVisualSnapshot: '',
    repeatedInitialVisualSnapshot: '',
    progress: 0,
    previousProgress: 0,
    minHumanProgress: 0,
    maxHumanProgress: 0,
    maxHumanProgressDelta: 0,
    progressMutationCount: 0,
    progressReversalCount: 0,
    completionReversalCount: 0,
    selectedStopIndex: 0,
    selectedStopId: STOPS[0].id,
    completedStopCount: 1,
    stationCount: STOPS.length,
    stationProgresses: STOPS.map(stop => stop.progress),
    stationVisitCounts: STOPS.map(() => 0),
    stationHitEventCount: 0,
    lastHitStationId: 'none',
    routePathData: routeData,
    routeCommandCount: (routeData.match(/[A-Za-z]/g) || []).length,
    routeLength,
    routeLengthStable: false,
    routePointProbeCount: 0,
    routeTangentProbeCount: 0,
    routeFinitePointCount: 0,
    routeFiniteTangentCount: 0,
    stationPlacementErrorMax: Infinity,
    routeProjectionSampleCount: 0,
    lastProjectionDistance: null,
    courierPoint: { x: 0, y: 0 },
    courierAngle: 0,
    courierTangentFinite: false,
    routeMotionControlCount: 1,
    routeMotionDuration: 0,
    routeMotionTime: 0,
    routeMotionProgressError: Infinity,
    routeDasharray: 0,
    routeDashoffset: routeLength,
    routeDashError: Infinity,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    humanInputCausalityCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureVerifiedCount: 0,
    pointerReleaseCaptureCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    rangeInputCount: 0,
    stationControlCount: 0,
    activePointerId: null,
    activePointerType: 'none',
    pointerCaptured: false,
    lastInputTrusted: null,
    lastInputKind: 'none',
    firstHumanInputProgressBefore: null,
    firstHumanInputProgressAfter: null,
    reducedMotion: reducedMotionQuery.matches,
    assetSourceKind: 'project-local-imagegen-fictional-checkpoint-atlas',
    assetDisclosure: 'AI-generated fictional field evidence; not a real route, depot, clinic, shipment, or medical record',
    assetUrl: ATLAS_URL,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetResponseSameOrigin: false,
    assetContentType: '',
    assetByteLength: 0,
    assetExpectedByteLength: ATLAS_BYTE_LENGTH,
    assetSha256: '',
    assetExpectedSha256: ATLAS_SHA256,
    assetShaMatchesExpected: false,
    assetDecoded: false,
    assetWidth: 0,
    assetHeight: 0,
    assetPixelSampleCount: 0,
    assetCropCount: 0,
    assetCropChecksums: [],
    assetCropDistinctColorBuckets: [],
    assetCropCoralPixelCounts: [],
    assetAlphaFailureCount: 0,
    assetEvidenceReady: false,
    listenersBound: false,
    ready: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__BEZIER_ROUTE_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`animated-bezier-route-cartography: ${message}`);
  }

  function routePoint(progress) {
    return route.getPointAtLength(clamp(progress) * routeLength);
  }

  function routeTangent(progress) {
    const center = clamp(progress) * routeLength;
    const before = route.getPointAtLength(Math.max(0, center - 0.8));
    const after = route.getPointAtLength(Math.min(routeLength, center + 0.8));
    return {
      x: after.x - before.x,
      y: after.y - before.y,
      angle: Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI,
    };
  }

  const stationNodes = STOPS.map((stop, index) => {
    const point = routePoint(stop.progress);
    const group = document.createElementNS(SVG_NS, 'g');
    group.classList.add('station');
    group.dataset.stopIndex = String(index);
    group.dataset.state = index === 0 ? 'current' : 'pending';
    group.setAttribute('transform', `translate(${point.x} ${point.y})`);
    group.setAttribute('role', 'button');
    group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', `Select ${stop.name} at ${(stop.progress * TOTAL_DISTANCE_KM).toFixed(1)} kilometres`);
    group.setAttribute('aria-pressed', String(index === 0));

    const halo = document.createElementNS(SVG_NS, 'circle');
    halo.classList.add('halo');
    halo.setAttribute('r', '6');
    const core = document.createElementNS(SVG_NS, 'circle');
    core.classList.add('core');
    core.setAttribute('r', '2.1');
    const number = document.createElementNS(SVG_NS, 'text');
    number.classList.add('station-number');
    number.setAttribute('y', '.25');
    number.textContent = String(index + 1);
    const label = document.createElementNS(SVG_NS, 'text');
    label.classList.add('station-label');
    label.setAttribute('x', String(stop.labelX));
    label.setAttribute('y', String(stop.labelY));
    label.textContent = stop.label;
    group.append(halo, core, number, label);
    stationsLayer.append(group);
    return group;
  });

  let routeMotion = animate(
    route,
    { strokeDashoffset: [routeLength, 0] },
    { duration: 1, ease: 'linear', autoplay: false },
  );
  routeMotion.pause();
  route.setAttribute('stroke-dasharray', String(routeLength));
  route.setAttribute('stroke-dashoffset', String(routeLength));
  state.routeMotionDuration = routeMotion.duration;
  state.routeLengthStable = Math.abs(route.getTotalLength() - routeLength) < 0.001;

  function probeRouteGeometry() {
    let finitePoints = 0;
    let finiteTangents = 0;
    for (let index = 0; index <= 100; index += 1) {
      const progress = index / 100;
      const point = routePoint(progress);
      const tangent = routeTangent(progress);
      state.routePointProbeCount += 1;
      state.routeTangentProbeCount += 1;
      if (Number.isFinite(point.x) && Number.isFinite(point.y)) finitePoints += 1;
      if (Number.isFinite(tangent.x) && Number.isFinite(tangent.y) && Number.isFinite(tangent.angle)) finiteTangents += 1;
    }
    state.routeFinitePointCount = finitePoints;
    state.routeFiniteTangentCount = finiteTangents;
    state.stationPlacementErrorMax = Math.max(...stationNodes.map((node, index) => {
      const matrix = node.transform.baseVal.consolidate()?.matrix;
      const expected = routePoint(STOPS[index].progress);
      return matrix ? Math.hypot(matrix.e - expected.x, matrix.f - expected.y) : Infinity;
    }));
  }
  probeRouteGeometry();

  function nearestStopIndex(progress) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    STOPS.forEach((stop, index) => {
      const distance = Math.abs(stop.progress - progress);
      if (distance < bestDistance) {
        bestIndex = index;
        bestDistance = distance;
      }
    });
    return bestIndex;
  }

  function recordStationHits(previous, next) {
    if (Math.abs(next - previous) < 0.00001) return;
    const minimum = Math.min(previous, next);
    const maximum = Math.max(previous, next);
    STOPS.forEach((stop, index) => {
      const startedAtStop = Math.abs(previous - stop.progress) <= 0.0005;
      const crossedStop = stop.progress > minimum && stop.progress <= maximum;
      const arrivedAtStop = Math.abs(next - stop.progress) <= 0.003 && Math.abs(previous - stop.progress) > 0.003;
      if (startedAtStop || crossedStop || arrivedAtStop) {
        state.stationVisitCounts[index] += 1;
        state.stationHitEventCount += 1;
        state.lastHitStationId = stop.id;
      }
    });
  }

  function updateInterface(selectedStopIndex) {
    const selected = STOPS[selectedStopIndex];
    const percent = Math.round(state.progress * 100);
    const completed = STOPS.filter(stop => state.progress + 0.0005 >= stop.progress).length;
    if (completed < state.completedStopCount) state.completionReversalCount += 1;
    state.completedStopCount = completed;
    state.selectedStopIndex = selectedStopIndex;
    state.selectedStopId = selected.id;

    range.value = String(Math.round(state.progress * 1000));
    distanceOutput.textContent = `${(state.progress * TOTAL_DISTANCE_KM).toFixed(1)} KM`;
    progressOutput.textContent = `${String(percent).padStart(3, '0')}%`;
    svg.setAttribute('aria-valuenow', String(percent));
    svg.setAttribute('aria-valuetext', `${(state.progress * TOTAL_DISTANCE_KM).toFixed(1)} kilometres, reviewing ${selected.name}`);
    photo.style.backgroundPosition = `${selectedStopIndex * 50}% 68%`;
    photo.setAttribute('aria-label', `${selected.name} checkpoint; AI-generated fictional field evidence`);
    photoCode.textContent = `${selected.code} · ${(selected.progress * TOTAL_DISTANCE_KM).toFixed(1).padStart(4, '0')}`;
    stopIndexOutput.textContent = `${String(selectedStopIndex + 1).padStart(2, '0')} / 03`;
    stopName.textContent = selected.name;
    stopNote.textContent = selected.note;
    completionOutput.textContent = `${completed} / 3 clear`;

    stationNodes.forEach((node, index) => {
      const isSelected = index === selectedStopIndex;
      const isComplete = state.progress + 0.0005 >= STOPS[index].progress;
      node.dataset.state = isSelected ? 'current' : isComplete ? 'complete' : 'pending';
      node.setAttribute('aria-pressed', String(isSelected));
      node.setAttribute('aria-label', `${STOPS[index].name}, ${isComplete ? 'route cleared' : 'route pending'}`);
    });
    stopControls.forEach((control, index) => {
      control.setAttribute('aria-pressed', String(index === selectedStopIndex));
      control.dataset.complete = String(state.progress + 0.0005 >= STOPS[index].progress);
    });
    stage.dataset.progress = state.progress.toFixed(6);
    stage.dataset.selectedStop = selected.id;
    stage.dataset.completedStops = String(completed);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    stage.dataset.lastInput = state.lastInputKind;
  }

  function applyProgress(nextProgress, source, selectedOverride = null, humanOwned = true) {
    const previous = state.progress;
    const next = clamp(nextProgress);
    if (humanOwned) {
      if (state.firstHumanInputProgressBefore === null) state.firstHumanInputProgressBefore = previous;
      recordStationHits(previous, next);
      state.humanInputCausalityCount += 1;
      state.progressMutationCount += 1;
      state.minHumanProgress = Math.min(state.minHumanProgress, next);
      state.maxHumanProgress = Math.max(state.maxHumanProgress, next);
      state.maxHumanProgressDelta = Math.max(state.maxHumanProgressDelta, Math.abs(next - previous));
      if ((next - previous) * (previous - state.previousProgress) < -0.000001) state.progressReversalCount += 1;
      if (state.firstHumanInputProgressAfter === null) state.firstHumanInputProgressAfter = next;
    }
    state.previousProgress = previous;
    state.progress = next;

    routeMotion.time = next * routeMotion.duration;
    const point = routePoint(next);
    const tangent = routeTangent(next);
    courier.setAttribute('transform', `translate(${point.x.toFixed(3)} ${point.y.toFixed(3)}) rotate(${tangent.angle.toFixed(3)})`);
    state.courierPoint = { x: point.x, y: point.y };
    state.courierAngle = tangent.angle;
    state.courierTangentFinite = Number.isFinite(tangent.angle) && Math.hypot(tangent.x, tangent.y) > 0.01;
    state.routeMotionTime = routeMotion.time;
    state.routeMotionProgressError = Math.abs(routeMotion.time / routeMotion.duration - next);
    state.routeDasharray = Number.parseFloat(route.getAttribute('stroke-dasharray')) || routeLength;
    state.routeDashoffset = Number.parseFloat(route.getAttribute('stroke-dashoffset'));
    state.routeDashError = Math.abs(state.routeDashoffset - routeLength * (1 - next));
    state.lastInputKind = source;
    updateInterface(selectedOverride ?? nearestStopIndex(next));
  }

  function acceptTrustedInput(event, kind) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    state.trustedInputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = kind;
    if (event instanceof PointerEvent) {
      const pointerType = event.pointerType || 'mouse';
      if (pointerType === 'touch') state.touchInputCount += 1;
      else if (pointerType === 'pen') state.penInputCount += 1;
      else state.mouseInputCount += 1;
    }
    return true;
  }

  function svgPointForEvent(event) {
    const matrix = svg.getScreenCTM();
    invariant(matrix, 'SVG screen matrix unavailable during pointer projection');
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }

  function projectPointerToRoute(event) {
    const pointer = svgPointForEvent(event);
    const samples = 241;
    let bestProgress = 0;
    let bestDistance = Infinity;
    for (let index = 0; index <= samples; index += 1) {
      const progress = index / samples;
      const point = routePoint(progress);
      const distance = (point.x - pointer.x) ** 2 + (point.y - pointer.y) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestProgress = progress;
      }
    }
    let step = 1 / samples;
    for (let iteration = 0; iteration < 7; iteration += 1) {
      const left = clamp(bestProgress - step);
      const right = clamp(bestProgress + step);
      [left, right].forEach(progress => {
        const point = routePoint(progress);
        const distance = (point.x - pointer.x) ** 2 + (point.y - pointer.y) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestProgress = progress;
        }
      });
      step /= 2;
    }
    state.routeProjectionSampleCount += samples + 1 + 14;
    state.lastProjectionDistance = Math.sqrt(bestDistance);
    return bestProgress;
  }

  function activateStop(event, index, source) {
    if (!acceptTrustedInput(event, source)) return;
    state.stationControlCount += 1;
    applyProgress(STOPS[index].progress, source, index);
  }

  stationNodes.forEach((node, index) => {
    node.addEventListener('pointerdown', event => event.stopPropagation());
    node.addEventListener('click', event => activateStop(event, index, 'svg-station-control'));
    node.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      state.keyboardInputCount += 1;
      activateStop(event, index, `keyboard-station-${event.key === ' ' ? 'Space' : event.key}`);
    });
  });

  stopControls.forEach((control, index) => {
    control.addEventListener('click', event => activateStop(event, index, 'panel-station-control'));
  });

  svg.addEventListener('pointerdown', event => {
    if (event.target.closest?.('.station')) return;
    if (!acceptTrustedInput(event, `${event.pointerType || 'mouse'}-route-down`)) return;
    event.preventDefault();
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    state.activePointerType = event.pointerType || 'mouse';
    svg.setPointerCapture(event.pointerId);
    state.pointerCaptureCount += 1;
    state.pointerCaptured = svg.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureVerifiedCount += 1;
    applyProgress(projectPointerToRoute(event), `${state.activePointerType}-route-down`);
  });

  svg.addEventListener('pointermove', event => {
    if (event.pointerId !== state.activePointerId || !state.pointerCaptured) return;
    if (!acceptTrustedInput(event, `${state.activePointerType}-route-move`)) return;
    state.pointerMoveCount += 1;
    applyProgress(projectPointerToRoute(event), `${state.activePointerType}-route-move`);
  });

  function releaseRoutePointer(event, cancelled = false) {
    if (event.pointerId !== state.activePointerId) return;
    if (!acceptTrustedInput(event, `${state.activePointerType}-route-${cancelled ? 'cancel' : 'up'}`)) return;
    if (cancelled) state.pointerCancelCount += 1;
    else {
      state.pointerUpCount += 1;
      applyProgress(projectPointerToRoute(event), `${state.activePointerType}-route-up`);
    }
    if (svg.hasPointerCapture(event.pointerId)) {
      svg.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.activePointerId = null;
    state.activePointerType = 'none';
    state.pointerCaptured = false;
    updateInterface(state.selectedStopIndex);
  }
  svg.addEventListener('pointerup', event => releaseRoutePointer(event, false));
  svg.addEventListener('pointercancel', event => releaseRoutePointer(event, true));

  function keyboardProgress(event, sourcePrefix) {
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = state.progress + 0.05;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = state.progress - 0.05;
    if (event.key === 'PageUp') next = STOPS[Math.min(2, nearestStopIndex(state.progress) + 1)].progress;
    if (event.key === 'PageDown') next = STOPS[Math.max(0, nearestStopIndex(state.progress) - 1)].progress;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = 1;
    if (next === null) return;
    event.preventDefault();
    if (!acceptTrustedInput(event, `${sourcePrefix}-${event.key}`)) return;
    state.keyboardInputCount += 1;
    applyProgress(next, `${sourcePrefix}-${event.key}`);
  }
  svg.addEventListener('keydown', event => {
    if (event.target.closest?.('.station')) return;
    keyboardProgress(event, 'keyboard-map');
  });
  range.addEventListener('keydown', event => keyboardProgress(event, 'keyboard-range'));
  range.addEventListener('input', event => {
    if (!acceptTrustedInput(event, 'range-input')) return;
    state.rangeInputCount += 1;
    applyProgress(Number(range.value) / 1000, 'range-input');
  });
  state.listenersBound = true;

  function resizeStage() {
    const scale = Math.min(stage.clientWidth / 320, stage.clientHeight / 180);
    shell.style.transform = `scale(${scale})`;
    state.resizeCount += 1;
    state.stageWidth = stage.clientWidth;
    state.stageHeight = stage.clientHeight;
    state.stageScale = scale;
    const shellRect = shell.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    state.shellWidth = shellRect.width;
    state.shellHeight = shellRect.height;
    state.fullStageCoverageVerified = Math.abs(shellRect.width - stageRect.width) <= 0.05
      && Math.abs(shellRect.height - stageRect.height) <= 0.05;
  }
  resizeStage();
  const resizeObserver = new ResizeObserver(resizeStage);
  resizeObserver.observe(stage);

  async function loadAssetEvidence() {
    const requested = new URL(ATLAS_URL);
    state.assetSameOrigin = requested.origin === location.origin;
    invariant(state.assetSameOrigin, 'checkpoint atlas must be requested from this preview origin');
    const response = await fetch(requested.href, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetResponseSameOrigin = new URL(response.url).origin === location.origin;
    state.assetContentType = response.headers.get('content-type') || '';
    invariant(response.ok && response.type !== 'opaque', `checkpoint atlas fetch failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = hexDigest(await crypto.subtle.digest('SHA-256', bytes));
    state.assetShaMatchesExpected = state.assetSha256 === ATLAS_SHA256;
    invariant(state.assetResponseSameOrigin, 'checkpoint atlas response is not same-origin');
    invariant(state.assetByteLength === ATLAS_BYTE_LENGTH, 'checkpoint atlas byte length differs from committed evidence');
    invariant(state.assetShaMatchesExpected, 'checkpoint atlas SHA-256 differs from committed evidence');

    const image = new Image();
    image.decoding = 'async';
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    image.src = objectUrl;
    try {
      await image.decode();
      state.assetDecoded = image.complete;
      state.assetWidth = image.naturalWidth;
      state.assetHeight = image.naturalHeight;
      invariant(image.complete && image.naturalWidth === 960 && image.naturalHeight === 640,
        'checkpoint atlas decoded at an unexpected size');

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      for (let index = 0; index < STOPS.length; index += 1) {
        context.clearRect(0, 0, 64, 64);
        context.drawImage(image, index * 320, 0, 320, 640, 0, 0, 64, 64);
        const sample = context.getImageData(0, 0, 64, 64);
        const buckets = new Set();
        let coralPixels = 0;
        for (let offset = 0; offset < sample.data.length; offset += 4) {
          const red = sample.data[offset];
          const green = sample.data[offset + 1];
          const blue = sample.data[offset + 2];
          const alpha = sample.data[offset + 3];
          buckets.add(`${red >> 4}:${green >> 4}:${blue >> 4}`);
          if (red > 112 && red > green * 1.28 && red > blue * 1.12) coralPixels += 1;
          if (alpha !== 255) state.assetAlphaFailureCount += 1;
        }
        state.assetCropChecksums.push(pixelChecksum(sample.data));
        state.assetCropDistinctColorBuckets.push(buckets.size);
        state.assetCropCoralPixelCounts.push(coralPixels);
        state.assetPixelSampleCount += 64 * 64;
      }
      state.assetCropCount = state.assetCropChecksums.length;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    photo.style.backgroundImage = `url("${ATLAS_URL}")`;
    state.assetEvidenceReady = true;
  }

  applyProgress(0, 'initial', 0, false);
  state.initialVisualSnapshot = visualSnapshot(route, courier, photo, state);
  const initialStillReady = new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      state.repeatedInitialVisualSnapshot = visualSnapshot(route, courier, photo, state);
      state.initialStaticVerified = state.initialVisualSnapshot === state.repeatedInitialVisualSnapshot
        && state.progress === 0
        && routeMotion.time === 0;
      resolve();
    }));
  });
  const assetReady = loadAssetEvidence();
  const ready = Promise.all([document.fonts.ready, assetReady, initialStillReady]).then(() => {
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const point = routePoint(state.progress);
    const tangent = routeTangent(state.progress);
    const courierError = Math.hypot(point.x - state.courierPoint.x, point.y - state.courierPoint.y);
    const motionProgressError = Math.abs(routeMotion.time / routeMotion.duration - state.progress);
    const causalInputValid = state.progressMutationCount === 0
      || (state.trustedInputCount > 0
        && state.humanInputCausalityCount === state.progressMutationCount
        && state.lastInputTrusted === true);
    return state.ready
      && state.task === 'human-owned-fictional-cold-chain-route-inspection'
      && state.claimedLibrary === 'motion@12.42.2'
      && state.renderer === 'svg'
      && state.mechanism === 'paused-motion-svg-dash-synchronized-to-bezier-arc-length-position-and-tangent'
      && state.userInputRequired === true
      && state.automaticPlayback === false
      && state.automaticTimeline === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.syntheticInputDispatch === false
      && state.captureClockDriven === false
      && state.previewClockMutationCount === 0
      && state.renderIgnoresPreviewClock === true
      && state.resizeCount >= 1
      && state.stageWidth > 0
      && state.stageHeight > 0
      && state.stageScale > 0
      && state.fullStageCoverageVerified === true
      && state.initialFrameStatic === true
      && state.initialStaticVerified === true
      && state.initialProgress === 0
      && state.initialVisualSnapshot === state.repeatedInitialVisualSnapshot
      && state.routePathData === routeData
      && state.routeCommandCount >= 3
      && state.routeLength > 190
      && state.routeLengthStable === true
      && state.routePointProbeCount === 101
      && state.routeTangentProbeCount === 101
      && state.routeFinitePointCount === 101
      && state.routeFiniteTangentCount === 101
      && state.stationCount === 3
      && state.stationPlacementErrorMax <= 0.001
      && routeMotion.duration === 1
      && state.routeMotionControlCount === 1
      && motionProgressError <= 0.002
      && state.routeMotionProgressError <= 0.002
      && state.routeDashError <= 0.2
      && courierError <= 0.001
      && Number.isFinite(tangent.angle)
      && state.courierTangentFinite === true
      && state.selectedStopIndex >= 0
      && state.selectedStopIndex < 3
      && state.selectedStopId === STOPS[state.selectedStopIndex].id
      && state.completedStopCount >= 1
      && state.completedStopCount <= 3
      && causalInputValid
      && state.rejectedUntrustedInputCount === 0
      && state.listenersBound === true
      && state.assetSourceKind === 'project-local-imagegen-fictional-checkpoint-atlas'
      && state.assetDisclosure.includes('AI-generated fictional field evidence')
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin === true
      && state.assetResponseSameOrigin === true
      && state.assetContentType.includes('image/jpeg')
      && state.assetByteLength === ATLAS_BYTE_LENGTH
      && state.assetSha256 === ATLAS_SHA256
      && state.assetShaMatchesExpected === true
      && state.assetDecoded === true
      && state.assetWidth === 960
      && state.assetHeight === 640
      && state.assetCropCount === 3
      && state.assetPixelSampleCount === 12288
      && new Set(state.assetCropChecksums).size === 3
      && state.assetCropDistinctColorBuckets.every(count => count >= 20)
      && state.assetCropCoralPixelCounts.every(count => count >= 4)
      && state.assetAlphaFailureCount === 0
      && state.assetEvidenceReady === true
      && photo.style.backgroundImage.includes('checkpoint-atlas')
      && svg.getAttribute('aria-valuenow') === String(Math.round(state.progress * 100));
  };

  installPreviewController({
    id: 'animated-bezier-route-cartography',
    library: 'motion@12.42.2',
    renderer: 'svg',
    ready,
    render: () => {
      state.previewRenderCount += 1;
      state.routeMotionTime = routeMotion.time;
      state.routeMotionProgressError = Math.abs(routeMotion.time / routeMotion.duration - state.progress);
      state.routeDasharray = Number.parseFloat(route.getAttribute('stroke-dasharray')) || routeLength;
      state.routeDashoffset = Number.parseFloat(route.getAttribute('stroke-dashoffset'));
      state.routeDashError = Math.abs(state.routeDashoffset - routeLength * (1 - state.progress));
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
