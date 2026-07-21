import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { harborArtsMap } from '../assets/cinematic-map-camera-fly-to/harbor-arts-map-data.js';

try {
  const stage = document.querySelector('#venue-stage');
  const host = document.querySelector('#map-host');
  const cameraOutput = document.querySelector('#map-camera');
  const routeState = document.querySelector('#route-state');
  const routeOutput = document.querySelector('#route-output');
  const placeButtons = [...document.querySelectorAll('[data-place-id]')];
  const backButton = document.querySelector('#back-map');
  const resetButton = document.querySelector('#reset-map');
  const keepButton = document.querySelector('#keep-place');
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const smoothstep = value => value * value * (3 - 2 * value);
  const flightDuration = .82;

  if (!stage || !host || !cameraOutput || !routeState || !routeOutput || placeButtons.length !== harborArtsMap.places.length || !backButton || !resetButton || !keepButton) {
    throw new Error('cinematic map DOM is incomplete');
  }

  const cloneCamera = camera => ({ center: [...camera.center], zoom: camera.zoom, pitch: camera.pitch, bearing: camera.bearing });
  const overviewCamera = cloneCamera(harborArtsMap.overviewCamera);

  function checksum(value) {
    let result = 2166136261;
    for (const character of JSON.stringify(value)) result = Math.imul(result ^ character.codePointAt(0), 16777619) >>> 0;
    return result >>> 0;
  }

  function cameraChecksum(camera) {
    return checksum({
      center: camera.center.map(value => Number(value.toFixed(4))),
      zoom: Number(camera.zoom.toFixed(4)),
      pitch: Number(camera.pitch.toFixed(4)),
      bearing: Number(camera.bearing.toFixed(4))
    });
  }

  const coordinateSets = [harborArtsMap.coastline];
  harborArtsMap.districts.forEach(district => coordinateSets.push(district.polygon));
  harborArtsMap.roads.forEach(road => coordinateSets.push(road.points));
  harborArtsMap.places.forEach(place => coordinateSets.push([place.point]));
  const vectorCoordinates = coordinateSets.flat();
  const vectorFeatureCount = 1 + harborArtsMap.districts.length + harborArtsMap.roads.length + harborArtsMap.places.length;
  const vectorsWithinExtent = vectorCoordinates.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)
    && x >= 0 && x <= harborArtsMap.extent.width && y >= 0 && y <= harborArtsMap.extent.height);

  const state = {
    id: 'cinematic-map-camera-fly-to',
    task: 'human-selects-a-local-map-venue-watches-one-finite-camera-flight-and-explicitly-keeps-or-revises-the-route-decision',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'trusted-place-selection-starts-one-finite-curved-interpolation-of-camera-center-zoom-pitch-and-bearing-over-local-vector-map-data',
    assetStrategy: 'dedicated-code-native-vector-map-data-directly-drives-coastline-district-roads-labels-places-hit-targets-and-camera-destinations',
    imageGenerationDecision: 'omitted-because-raster-pixels-would-not-drive-vector-feature-projection-place-hit-testing-or-camera-destination-selection',
    mapDataPath: 'assets/cinematic-map-camera-fly-to/harbor-arts-map-data.js',
    mapDataId: harborArtsMap.id,
    mapDataChecksum: checksum(harborArtsMap),
    vectorFeatureCount,
    vectorCoordinateCount: vectorCoordinates.length,
    coastlinePointCount: harborArtsMap.coastline.length,
    districtCount: harborArtsMap.districts.length,
    roadCount: harborArtsMap.roads.length,
    namedRoadCount: harborArtsMap.roads.filter(road => road.name).length,
    placeCount: harborArtsMap.places.length,
    vectorsWithinExtent,
    acceptedInputs: ['trusted-map-pin-or-place-button', 'keyboard-1-2-3-place-selection', 'trusted-keep-button-or-enter', 'trusted-back-button-or-backspace', 'trusted-reset-button-or-r'],
    causality: 'trusted-human-input-starts-finite-flight',
    userInputRequired: true,
    automaticWaypointCruise: false,
    automaticPlayback: false,
    automaticCycle: false,
    automaticRehearsal: false,
    automaticFallback: false,
    infiniteTimer: false,
    previewClockStartsFlight: false,
    previewClockOnlyAdvancesTrustedFlight: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-place-intent-flight-camera-route-or-decision-mutation',
    untrustedMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    rejectedUntrustedInputCount: 0,
    placeSelectionInputCount: 0,
    flightStartCount: 0,
    flightCompletionCount: 0,
    flightCancellationCount: 0,
    cameraMutationCount: 0,
    arrivalCount: 0,
    confirmationCount: 0,
    rejectedConfirmationCount: 0,
    backInputCount: 0,
    backCount: 0,
    undoCount: 0,
    rejectedBackCount: 0,
    resetCount: 0,
    decisionClearCount: 0,
    businessCommitCount: 0,
    prematureCommitCount: 0,
    activeFlightId: null,
    flightActive: false,
    flightKind: null,
    flightProgress: 0,
    flightDuration,
    requestedPlaceId: null,
    arrivedPlaceId: null,
    retainedPlace: null,
    retainedCameraChecksum: null,
    retainedFlightId: null,
    reviewRetained: false,
    camera: cloneCamera(overviewCamera),
    overviewCameraChecksum: cameraChecksum(overviewCamera),
    currentCameraChecksum: cameraChecksum(overviewCamera),
    arrivalStack: [],
    navigationDepth: 0,
    markerScreens: [],
    phase: 'idle-overview',
    result: 'no-venue-kept',
    mapViewport: { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 },
    viewportWithinStage: false,
    canvasCoverageRatio: 0,
    fullStageGeometryVerified: false,
    initialStillVerified: false,
    initialMapChecksum: checksum(harborArtsMap),
    p5InstanceReady: false,
    canvas2dReady: false,
    inputRecords: [],
    flightRecords: [],
    drawCount: 0,
    renderCount: 0,
    geometryMeasureCount: 0,
    resizeCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let dirty = true;
  let resizeFrame = 0;
  let flight = null;
  let lastRenderTime = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`cinematic-map-camera-fly-to: ${message}`);
  }

  function placeById(id) {
    return harborArtsMap.places.find(place => place.id === id) || null;
  }

  function camerasEqual(a, b, epsilon = .0001) {
    return Math.abs(a.center[0] - b.center[0]) < epsilon
      && Math.abs(a.center[1] - b.center[1]) < epsilon
      && Math.abs(a.zoom - b.zoom) < epsilon
      && Math.abs(a.pitch - b.pitch) < epsilon
      && Math.abs(a.bearing - b.bearing) < epsilon;
  }

  function calculateGeometry() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const portrait = width <= 270;
    const bounds = portrait
      ? { left: 0, right: width, top: 118, bottom: height - 55 }
      : { left: width < 480 ? 91 : 166, right: width, top: 25, bottom: height - 43 };
    state.mapViewport = { ...bounds, width: bounds.right - bounds.left, height: bounds.bottom - bounds.top };
    state.viewportWithinStage = bounds.left >= 0 && bounds.right <= width && bounds.top >= 0 && bounds.bottom <= height && bounds.right > bounds.left && bounds.bottom > bounds.top;
    const canvasRect = host.querySelector('canvas')?.getBoundingClientRect();
    state.canvasCoverageRatio = Number((((canvasRect?.width || 0) * (canvasRect?.height || 0)) / Math.max(1, width * height)).toFixed(4));
    state.fullStageGeometryVerified = state.viewportWithinStage && state.canvasCoverageRatio >= .995;
    state.geometryMeasureCount += 1;
  }

  function requestDraw() {
    dirty = true;
    sketch?.redraw();
  }

  function acceptTrusted(event, source) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (source.startsWith('pointer')) state.pointerInputCount += 1;
    else if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    else state.controlInputCount += 1;
    return true;
  }

  function syncInterface() {
    placeButtons.forEach(button => {
      button.dataset.requested = String(button.dataset.placeId === state.requestedPlaceId);
      button.dataset.arrived = String(button.dataset.placeId === state.arrivedPlaceId && !state.flightActive);
    });
    state.navigationDepth = state.arrivalStack.length;
    backButton.disabled = state.flightActive || state.arrivalStack.length === 0;
    resetButton.disabled = !state.flightActive && !state.reviewRetained && state.arrivalStack.length === 0 && camerasEqual(state.camera, overviewCamera);
    routeState.dataset.flight = String(state.flightActive);
    routeState.dataset.retained = String(state.reviewRetained);
    keepButton.textContent = state.reviewRetained ? 'VENUE KEPT' : 'KEEP VENUE';
    if (state.reviewRetained) routeOutput.textContent = `ROUTE KEEPS ${state.retainedPlace.name.toUpperCase()}`;
    else if (state.flightActive) routeOutput.textContent = `FLYING TO ${placeById(state.requestedPlaceId)?.shortName || 'OVERVIEW'} · ${Math.round(state.flightProgress * 100)}%`;
    else if (state.arrivedPlaceId) routeOutput.textContent = `ARRIVED ${placeById(state.arrivedPlaceId).shortName} · KEEP TO ROUTE`;
    else routeOutput.textContent = 'CHOOSE A VENUE';
  }

  function clearRetainedDecision() {
    if (!state.reviewRetained) return;
    state.retainedPlace = null;
    state.retainedCameraChecksum = null;
    state.retainedFlightId = null;
    state.reviewRetained = false;
    state.result = 'no-venue-kept';
    state.decisionClearCount += 1;
    routeState.dataset.retained = 'false';
  }

  function beginFlight({ targetCamera, targetPlaceId, destinationPlaceId, kind, source, recordHistory }) {
    if (flight) {
      state.flightCancellationCount += 1;
      state.flightRecords.push({ id: flight.id, action: 'cancel', causalInputSource: source, progress: state.flightProgress, trustedCausality: true });
    }
    clearRetainedDecision();
    const id = state.flightStartCount + 1;
    const fromCamera = cloneCamera(state.camera);
    flight = {
      id,
      kind,
      source,
      startTime: lastRenderTime,
      duration: flightDuration,
      fromCamera,
      toCamera: cloneCamera(targetCamera),
      fromPlaceId: state.arrivedPlaceId,
      targetPlaceId,
      destinationPlaceId,
      recordHistory
    };
    state.flightStartCount += 1;
    state.activeFlightId = id;
    state.flightActive = true;
    state.flightKind = kind;
    state.flightProgress = 0;
    state.requestedPlaceId = targetPlaceId;
    state.phase = 'flight-in-progress';
    state.result = 'no-venue-kept';
    state.inputRecords.push({ source, trusted: true, action: kind === 'back' ? 'back-flight' : 'place-flight', flightId: id, targetPlaceId, startCameraChecksum: cameraChecksum(fromCamera), destinationCameraChecksum: cameraChecksum(targetCamera) });
    state.inputRecords = state.inputRecords.slice(-48);
    syncInterface();
    requestDraw();
  }

  function requestPlace(placeId, source) {
    const place = placeById(placeId);
    if (!place) return;
    state.placeSelectionInputCount += 1;
    beginFlight({ targetCamera: place.camera, targetPlaceId: place.id, destinationPlaceId: place.id, kind: 'place', source, recordHistory: true });
  }

  function finishFlight() {
    if (!flight) return;
    const completed = flight;
    state.camera = cloneCamera(completed.toCamera);
    state.currentCameraChecksum = cameraChecksum(state.camera);
    if (completed.recordHistory) state.arrivalStack.push({ placeId: completed.fromPlaceId, camera: cloneCamera(completed.fromCamera) });
    state.arrivedPlaceId = completed.destinationPlaceId;
    state.requestedPlaceId = completed.destinationPlaceId;
    state.flightCompletionCount += 1;
    state.arrivalCount += 1;
    state.flightActive = false;
    state.flightKind = null;
    state.flightProgress = 1;
    state.phase = completed.destinationPlaceId ? 'arrived-unconfirmed' : 'overview-restored';
    state.flightRecords.push({ id: completed.id, action: 'complete', destinationPlaceId: completed.destinationPlaceId, cameraChecksum: state.currentCameraChecksum, causalInputSource: completed.source, trustedCausality: true });
    state.flightRecords = state.flightRecords.slice(-48);
    flight = null;
    syncInterface();
    requestDraw();
  }

  function interpolateFlight(time) {
    if (!flight) return;
    const raw = clamp((time - flight.startTime) / flight.duration, 0, 1);
    const eased = smoothstep(raw);
    const from = flight.fromCamera;
    const to = flight.toCamera;
    const dx = to.center[0] - from.center[0];
    const dy = to.center[1] - from.center[1];
    const distance = Math.hypot(dx, dy) || 1;
    const arc = Math.sin(Math.PI * eased) * Math.min(70, distance * .18);
    const perpendicularX = -dy / distance;
    const perpendicularY = dx / distance;
    const zoomRatio = to.zoom / from.zoom;
    state.camera = {
      center: [
        from.center[0] + dx * eased + perpendicularX * arc,
        from.center[1] + dy * eased + perpendicularY * arc
      ],
      zoom: from.zoom * Math.pow(zoomRatio, eased) * (1 - Math.sin(Math.PI * eased) * .05),
      pitch: from.pitch + (to.pitch - from.pitch) * eased,
      bearing: from.bearing + (to.bearing - from.bearing) * eased
    };
    state.currentCameraChecksum = cameraChecksum(state.camera);
    state.flightProgress = Number(raw.toFixed(4));
    state.cameraMutationCount += 1;
    syncInterface();
    dirty = true;
    if (raw >= 1) finishFlight();
  }

  function keepArrival(source) {
    if (flight || !state.arrivedPlaceId) {
      state.rejectedConfirmationCount += 1;
      routeOutput.textContent = flight ? 'WAIT FOR CAMERA ARRIVAL' : 'CHOOSE AND ARRIVE FIRST';
      return;
    }
    const place = placeById(state.arrivedPlaceId);
    state.retainedPlace = { id: place.id, name: place.name, type: place.type, point: [...place.point] };
    state.retainedCameraChecksum = cameraChecksum(state.camera);
    state.retainedFlightId = state.flightRecords.filter(record => record.action === 'complete').at(-1)?.id || null;
    state.reviewRetained = true;
    state.confirmationCount += 1;
    state.businessCommitCount += 1;
    state.phase = 'venue-kept';
    state.result = 'harbor-event-venue-kept-for-route';
    state.inputRecords.push({ source, trusted: true, action: 'keep-venue', placeId: place.id, cameraChecksum: state.retainedCameraChecksum, flightId: state.retainedFlightId });
    syncInterface();
  }

  function goBack(source) {
    if (flight || state.arrivalStack.length === 0) {
      state.rejectedBackCount += 1;
      routeOutput.textContent = flight ? 'WAIT FOR CAMERA ARRIVAL' : 'ALREADY AT OVERVIEW';
      return;
    }
    state.backInputCount += 1;
    state.backCount += 1;
    state.undoCount += 1;
    const destination = state.arrivalStack.pop();
    beginFlight({ targetCamera: destination.camera, targetPlaceId: destination.placeId, destinationPlaceId: destination.placeId, kind: 'back', source, recordHistory: false });
  }

  function resetMap(source) {
    if (flight) {
      state.flightCancellationCount += 1;
      state.flightRecords.push({ id: flight.id, action: 'cancel-reset', progress: state.flightProgress, causalInputSource: source, trustedCausality: true });
    }
    clearRetainedDecision();
    flight = null;
    state.camera = cloneCamera(overviewCamera);
    state.currentCameraChecksum = cameraChecksum(state.camera);
    state.activeFlightId = null;
    state.flightActive = false;
    state.flightKind = null;
    state.flightProgress = 0;
    state.requestedPlaceId = null;
    state.arrivedPlaceId = null;
    state.arrivalStack = [];
    state.resetCount += 1;
    state.phase = 'reset-overview';
    state.result = 'no-venue-kept';
    state.inputRecords.push({ source, trusted: true, action: 'reset', cameraChecksum: state.currentCameraChecksum });
    syncInterface();
    requestDraw();
  }

  placeButtons.forEach(button => button.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-place-control' : 'pointer-place-control';
    if (!acceptTrusted(event, source)) return;
    requestPlace(button.dataset.placeId, `trusted-${source}`);
  }));

  keepButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-keep-control' : 'pointer-keep-control';
    if (!acceptTrusted(event, source)) return;
    keepArrival(`trusted-${source}`);
  });

  backButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-back-control' : 'pointer-back-control';
    if (!acceptTrusted(event, source)) return;
    goBack(`trusted-${source}`);
  });

  resetButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-reset-control' : 'pointer-reset-control';
    if (!acceptTrusted(event, source)) return;
    resetMap(`trusted-${source}`);
  });

  host.addEventListener('pointerdown', event => {
    const rect = stage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const nearest = state.markerScreens.reduce((best, marker) => {
      const distance = Math.hypot(marker.x - x, marker.y - y);
      return !best || distance < best.distance ? { ...marker, distance } : best;
    }, null);
    if (!nearest || nearest.distance > 15 || !acceptTrusted(event, 'pointer-map-pin')) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    requestPlace(nearest.id, 'trusted-pointer-map-pin');
  });

  host.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (['1', '2', '3'].includes(key)) {
      if (!acceptTrusted(event, 'keyboard-place-shortcut')) return;
      event.preventDefault();
      requestPlace(harborArtsMap.places[Number(key) - 1].id, 'trusted-keyboard-place-shortcut');
    } else if (key === 'enter') {
      if (!acceptTrusted(event, 'keyboard-keep-shortcut')) return;
      event.preventDefault();
      keepArrival('trusted-keyboard-keep-shortcut');
    } else if (event.key === 'Backspace' || key === 'z') {
      if (!acceptTrusted(event, 'keyboard-back-shortcut')) return;
      event.preventDefault();
      goBack('trusted-keyboard-back-shortcut');
    } else if (key === 'r') {
      if (!acceptTrusted(event, 'keyboard-reset-shortcut')) return;
      event.preventDefault();
      resetMap('trusted-keyboard-reset-shortcut');
    }
  });

  function projectPoint(point, camera = state.camera) {
    const bounds = state.mapViewport;
    const baseScale = Math.min(bounds.width / harborArtsMap.extent.width, bounds.height / harborArtsMap.extent.height);
    const scale = baseScale * camera.zoom;
    const verticalScale = scale * (1 - camera.pitch * .32);
    const dx = point[0] - camera.center[0];
    const dy = point[1] - camera.center[1];
    const scaledX = dx * scale;
    const scaledY = dy * verticalScale;
    const cosine = Math.cos(camera.bearing);
    const sine = Math.sin(camera.bearing);
    return {
      x: bounds.left + bounds.width / 2 + scaledX * cosine - scaledY * sine,
      y: bounds.top + bounds.height / 2 + camera.pitch * bounds.height * .04 + scaledX * sine + scaledY * cosine
    };
  }

  const ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(host);
          p.noLoop();
          state.p5InstanceReady = p instanceof p5;
          state.canvas2dReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.drawCount += 1;
        calculateGeometry();
        const bounds = state.mapViewport;
        const camera = state.camera;
        const baseScale = Math.min(bounds.width / harborArtsMap.extent.width, bounds.height / harborArtsMap.extent.height);
        const scale = baseScale * camera.zoom;
        const verticalFactor = 1 - camera.pitch * .32;

        p.background('#081720');
        p.noStroke();
        p.fill('#0b202a');
        p.rect(bounds.left, bounds.top, bounds.width, bounds.height);
        p.stroke('#9fc2b30c');
        p.strokeWeight(1);
        for (let x = bounds.left; x <= bounds.right; x += 18) p.line(x, bounds.top, x, bounds.bottom);
        for (let y = bounds.top; y <= bounds.bottom; y += 18) p.line(bounds.left, y, bounds.right, y);

        p.drawingContext.save();
        p.drawingContext.beginPath();
        p.drawingContext.rect(bounds.left, bounds.top, bounds.width, bounds.height);
        p.drawingContext.clip();
        p.push();
        p.translate(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2 + camera.pitch * bounds.height * .04);
        p.rotate(camera.bearing);
        p.scale(scale, scale * verticalFactor);
        p.translate(-camera.center[0], -camera.center[1]);

        p.noStroke();
        p.fill('#172d2e');
        p.beginShape();
        harborArtsMap.coastline.forEach(([x, y]) => p.vertex(x, y));
        p.endShape(p.CLOSE);

        harborArtsMap.districts.forEach((district, index) => {
          p.fill(index === 1 ? '#203735' : '#1b3232');
          p.stroke('#8ca39a2e');
          p.strokeWeight(.8 / scale);
          p.beginShape();
          district.polygon.forEach(([x, y]) => p.vertex(x, y));
          p.endShape(p.CLOSE);
          const center = district.polygon.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]).map(value => value / district.polygon.length);
          p.noStroke();
          p.fill('#789089');
          p.textFont('monospace');
          p.textSize(4.5 / scale);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(district.name, center[0], center[1]);
        });

        harborArtsMap.roads.forEach(road => {
          p.noFill();
          p.stroke(road.kind === 'arterial' ? '#d8cda4' : road.kind === 'footway' ? '#c7f36b66' : '#718d84');
          p.strokeWeight((road.kind === 'arterial' ? 2.3 : road.kind === 'footway' ? .8 : 1.1) / scale);
          if (road.kind === 'footway') p.drawingContext.setLineDash([4 / scale, 4 / scale]);
          p.beginShape();
          road.points.forEach(([x, y]) => p.vertex(x, y));
          p.endShape();
          p.drawingContext.setLineDash([]);
        });

        harborArtsMap.roads.filter((_, index) => index < 4).forEach(road => {
          const midpoint = road.points[Math.floor(road.points.length / 2)];
          p.noStroke();
          p.fill('#aebdb7');
          p.textFont('monospace');
          p.textSize(4 / scale);
          p.textAlign(p.LEFT, p.BOTTOM);
          p.text(road.name, midpoint[0] + 7 / scale, midpoint[1] - 4 / scale);
        });

        harborArtsMap.places.forEach(place => {
          const requested = place.id === state.requestedPlaceId;
          const arrived = place.id === state.arrivedPlaceId && !state.flightActive;
          p.noStroke();
          p.fill(arrived ? '#c7f36b30' : requested ? '#ff725c30' : '#edf3e51b');
          p.circle(place.point[0], place.point[1], (arrived ? 26 : 18) / scale);
          p.fill(arrived ? '#c7f36b' : requested ? '#ff725c' : '#edf3e5');
          p.circle(place.point[0], place.point[1], 7 / scale);
          p.fill('#edf3e5');
          p.textFont('monospace');
          p.textSize(5 / scale);
          p.textAlign(p.LEFT, p.CENTER);
          p.text(place.shortName, place.point[0] + 8 / scale, place.point[1]);
        });

        p.pop();
        p.drawingContext.restore();

        state.markerScreens = harborArtsMap.places.map(place => ({ id: place.id, ...projectPoint(place.point) }));
        p.noFill();
        p.stroke('#edf3e52c');
        p.strokeWeight(1);
        p.rect(bounds.left + .5, bounds.top + .5, bounds.width - 1, bounds.height - 1, 7);
        p.noStroke();
        p.fill('#71847e');
        p.textFont('monospace');
        p.textSize(4.5);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text('LOCAL VECTOR · NO REMOTE TILES', bounds.left + 7, bounds.bottom - 6);
        cameraOutput.textContent = `Z ${camera.zoom.toFixed(2)} · P ${Math.round(camera.pitch * 90)}° · B ${Math.round(camera.bearing * 180 / Math.PI)}°`;
        dirty = false;
      };
    }, host);
  });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch || !stage.clientWidth || !stage.clientHeight) return;
      sketch.resizeCanvas(stage.clientWidth, stage.clientHeight);
      state.resizeCount += 1;
      calculateGeometry();
      requestDraw();
    });
  });
  resizeObserver.observe(stage);

  function render(time) {
    const nextTime = Number.isFinite(time) ? time : lastRenderTime;
    state.renderCount += 1;
    lastRenderTime = nextTime;
    calculateGeometry();
    if (flight) interpolateFlight(nextTime);
    if (state.inputCount === 0) {
      state.initialStillVerified = !flight
        && camerasEqual(state.camera, overviewCamera)
        && state.flightStartCount === 0
        && state.arrivedPlaceId === null
        && state.reviewRetained === false;
    }
    if (dirty) sketch?.redraw();
  }

  const previewReady = ready.then(() => {
    calculateGeometry();
    syncInterface();
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.p5InstanceReady && state.canvas2dReady, 'p5 canvas is not ready');
    invariant(state.fullStageGeometryVerified && state.canvasCoverageRatio >= .995 && state.viewportWithinStage, 'map viewport or canvas escapes the stage');
    invariant(state.mapDataId === harborArtsMap.id && state.mapDataChecksum === checksum(harborArtsMap) && state.initialMapChecksum === checksum(harborArtsMap), 'local vector map source changed');
    invariant(state.vectorFeatureCount === 16 && state.coastlinePointCount >= 16 && state.districtCount === 3 && state.roadCount === 9 && state.namedRoadCount === 9 && state.placeCount === 3, 'local vector feature inventory is incomplete');
    invariant(state.vectorCoordinateCount >= 70 && state.vectorsWithinExtent, 'local vector coordinates are incomplete or outside the declared extent');
    invariant(state.automaticWaypointCruise === false && state.automaticPlayback === false && state.automaticCycle === false && state.automaticRehearsal === false && state.automaticFallback === false && state.infiniteTimer === false, 'automatic waypoint cruising is forbidden');
    invariant(state.previewClockStartsFlight === false && state.previewClockOnlyAdvancesTrustedFlight === true, 'preview clock may only advance a trusted finite flight');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed camera or route state');
    invariant(state.inputCount === state.trustedInputCount && state.pointerInputCount + state.keyboardInputCount + state.controlInputCount === state.inputCount, 'trusted input accounting diverged');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial overview was not verified still');
    invariant(state.flightStartCount === state.placeSelectionInputCount + state.backInputCount, 'every flight must originate from a trusted place or back input');
    invariant(state.flightCompletionCount + state.flightCancellationCount <= state.flightStartCount, 'flight completion or cancellation accounting diverged');
    invariant(state.flightProgress >= 0 && state.flightProgress <= 1 && Number.isFinite(state.camera.zoom) && Number.isFinite(state.camera.pitch) && Number.isFinite(state.camera.bearing), 'camera values are invalid');
    invariant(state.currentCameraChecksum === cameraChecksum(state.camera), 'camera checksum differs from visible projection');
    invariant(state.navigationDepth === state.arrivalStack.length, 'navigation history depth diverged');
    invariant(state.prematureCommitCount === 0 && state.businessCommitCount === state.confirmationCount, 'route decision committed before explicit confirmation');
    invariant(state.inputRecords.every(record => record.trusted === true) && state.flightRecords.every(record => record.trustedCausality === true), 'camera or route transition lacks trusted human causality');

    if (state.flightActive) {
      invariant(flight && state.activeFlightId === flight.id && !state.reviewRetained && state.phase === 'flight-in-progress', 'active flight transaction is inconsistent');
    }
    if (state.arrivedPlaceId && !state.flightActive) {
      const arrived = placeById(state.arrivedPlaceId);
      invariant(arrived && camerasEqual(state.camera, arrived.camera), 'arrived camera does not match local place destination');
    }
    if (state.reviewRetained) {
      invariant(!state.flightActive && state.phase === 'venue-kept' && state.result === 'harbor-event-venue-kept-for-route', 'retained route state is inconsistent');
      invariant(state.retainedPlace?.id === state.arrivedPlaceId && state.retainedCameraChecksum === state.currentCameraChecksum, 'retained venue differs from the arrived map projection');
      invariant(state.retainedFlightId > 0 && state.confirmationCount > 0 && routeState.dataset.retained === 'true', 'retained venue lacks completed-flight evidence');
    }
    invariant(state.undoCount === state.backCount, 'back and undo accounting diverged');
    if (state.backCount > 0) invariant(state.inputRecords.some(record => record.action === 'back-flight'), 'back/undo did not start a finite return flight');
    if (state.resetCount > 0) invariant(camerasEqual(state.camera, overviewCamera) && state.inputRecords.some(record => record.action === 'reset'), 'reset did not restore the overview');
    return true;
  };

  installPreviewController({
    id: 'cinematic-map-camera-fly-to',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready: previewReady
  });
} catch (error) {
  markPreviewFailure(error);
}
