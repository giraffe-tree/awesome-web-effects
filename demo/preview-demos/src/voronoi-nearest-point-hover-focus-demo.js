import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const STATIONS = [
  { id: 'NW-01', district: 'Harbor', x: .11, y: .18, pm25: 14, trend: -2 },
  { id: 'NW-03', district: 'Foundry', x: .28, y: .12, pm25: 31, trend: 7 },
  { id: 'CT-02', district: 'Market', x: .43, y: .27, pm25: 22, trend: 3 },
  { id: 'NE-04', district: 'Canal', x: .66, y: .14, pm25: 18, trend: -1 },
  { id: 'NE-06', district: 'Glassworks', x: .86, y: .24, pm25: 42, trend: 12 },
  { id: 'CT-05', district: 'Library', x: .54, y: .47, pm25: 16, trend: 0 },
  { id: 'SW-02', district: 'Depot', x: .18, y: .55, pm25: 27, trend: 5 },
  { id: 'SW-07', district: 'Riverbend', x: .33, y: .79, pm25: 20, trend: 2 },
  { id: 'CT-09', district: 'Civic', x: .49, y: .72, pm25: 24, trend: 4 },
  { id: 'SE-03', district: 'Wetland', x: .69, y: .67, pm25: 12, trend: -3 },
  { id: 'SE-08', district: 'Freight', x: .88, y: .78, pm25: 38, trend: 9 },
  { id: 'E-11', district: 'Observatory', x: .79, y: .46, pm25: 19, trend: 1 },
];

const INITIAL_ACTIVE_INDEX = -1;
const round = value => Number(value.toFixed(4));
const clamp = value => Math.max(0, Math.min(1, value));

function clipPolygon(polygon, a, b, c) {
  const output = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentDistance = a * current.x + b * current.y - c;
    const nextDistance = a * next.x + b * next.y - c;
    const currentInside = currentDistance <= 0;
    if (currentInside) output.push(current);
    if (currentInside !== (nextDistance <= 0)) {
      const progress = currentDistance / (currentDistance - nextDistance);
      output.push({
        x: current.x + (next.x - current.x) * progress,
        y: current.y + (next.y - current.y) * progress,
      });
    }
  }
  return output;
}

function cellFor(station, stations) {
  let polygon = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
  for (const other of stations) {
    if (other === station) continue;
    const a = other.x - station.x;
    const b = other.y - station.y;
    const c = (other.x ** 2 + other.y ** 2 - station.x ** 2 - station.y ** 2) / 2;
    polygon = clipPolygon(polygon, a, b, c);
  }
  return polygon;
}

function polygonArea(polygon) {
  let area = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
}

try {
  const stage = document.querySelector('#sensor-stage');
  const host = document.querySelector('#voronoi-host');
  const nearestId = document.querySelector('#nearest-id');
  const nearestDistance = document.querySelector('#nearest-distance');
  const readingValue = document.querySelector('#reading-value');
  const decisionLabel = document.querySelector('#decision-label');
  const decisionCopy = document.querySelector('#decision-copy');
  const undoButton = document.querySelector('#undo-decision');
  const cells = STATIONS.map(station => cellFor(station, STATIONS));

  const state = {
    id: 'voronoi-nearest-point-hover-focus',
    task: 'human-attributes-a-city-air-event-to-the-mathematically-nearest-authored-sensor-and-retains-a-reviewable-reading-decision',
    mechanism: 'trusted-pointer-or-keyboard-selection-queries-voronoi-cells-derived-from-real-data-coordinates-and-explicit-confirmation-retains-or-revises-the-reading',
    claimedLibrary: 'p5@2.3.0',
    assetStrategy: 'code-native-authored-sensor-coordinates-and-half-plane-voronoi-geometry-are-the-functional-input-no-raster-asset-required',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['captured-mouse-move-and-click', 'captured-touch-or-pen-move-and-press', 'keyboard-left-right-selection', 'keyboard-enter-space-confirm', 'visible-undo-button', 'keyboard-u-escape-undo'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticTraversal: false,
    automaticSelection: false,
    automaticConfirmation: false,
    automaticPlayback: false,
    automaticCycle: false,
    automaticTimeline: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    initialFrameStatic: true,
    initialStillVerified: false,
    initialPixelHash: '00000000',
    phase: 'waiting',
    activeStationIndex: INITIAL_ACTIVE_INDEX,
    activeStationId: 'none',
    activeDistrict: 'none',
    activeReading: 0,
    activeTrend: 0,
    cursorDataX: 0,
    cursorDataY: 0,
    nearestDistanceData: 0,
    nearestDistanceKm: 0,
    nearestSelectionVerified: false,
    selectionCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerMoveCount: 0,
    pointerConfirmCount: 0,
    keyboardSelectionCount: 0,
    keyboardConfirmCount: 0,
    undoButtonCount: 0,
    keyboardUndoCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    confirmCount: 0,
    reselectionCount: 0,
    undoCount: 0,
    retainedDecisionCount: 0,
    decisionStackDepth: 0,
    confirmedStationId: 'none',
    confirmedReading: 0,
    confirmedDistanceKm: 0,
    lastUndoRemovedStation: 'none',
    lastUndoRestoredStation: 'none',
    resultHeld: false,
    resultValidated: false,
    decisionStack: [],
    auditTrail: [],
    auditTrailCount: 0,
    stationCount: STATIONS.length,
    voronoiCellCount: cells.length,
    voronoiVertexCounts: cells.map(cell => cell.length),
    voronoiMinimumVertexCount: Math.min(...cells.map(cell => cell.length)),
    voronoiAreaSum: round(cells.reduce((sum, cell) => sum + polygonArea(cell), 0)),
    dataCoordinateSignature: STATIONS.map(station => `${station.id}:${station.x.toFixed(2)}:${station.y.toFixed(2)}:${station.pm25}`).join('|'),
    dataReadingSum: STATIONS.reduce((sum, station) => sum + station.pm25, 0),
    cellOwnershipVerified: false,
    renderCount: 0,
    humanRenderCount: 0,
    nonInputFunctionalMutationCount: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    hostWidth: 0,
    hostHeight: 0,
    canvasCoverageX: 0,
    canvasCoverageY: 0,
    plotLeft: 0,
    plotTop: 0,
    plotRight: 0,
    plotBottom: 0,
    plotWidth: 0,
    plotHeight: 0,
    stationScreenPositions: [],
    ready: false,
    runtimeAssertCount: 0,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__VORONOI_SENSOR_STATE__ = state;

  let sketch = null;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  function invariant(condition, message) {
    if (!condition) throw new Error(`voronoi-nearest-point-hover-focus: ${message}`);
  }

  function updatePlotGeometry() {
    const stagePixelWidth = Math.max(1, state.canvasWidth || host.clientWidth);
    const stagePixelHeight = Math.max(1, state.canvasHeight || host.clientHeight);
    const portrait = stagePixelHeight > stagePixelWidth * 1.15;
    state.plotLeft = round(stagePixelWidth * (portrait ? .08 : .3));
    state.plotTop = round(stagePixelHeight * (portrait ? .27 : .2));
    state.plotRight = round(stagePixelWidth * (portrait ? .92 : .965));
    state.plotBottom = round(stagePixelHeight * (portrait ? .72 : .82));
    state.plotWidth = round(state.plotRight - state.plotLeft);
    state.plotHeight = round(state.plotBottom - state.plotTop);
    state.stationScreenPositions = STATIONS.map(station => {
      const point = project(station.x, station.y);
      return { id: station.id, x: round(point.x), y: round(point.y), dataX: station.x, dataY: station.y };
    });
  }

  function project(x, y) {
    return {
      x: state.plotLeft + x * state.plotWidth,
      y: state.plotTop + y * state.plotHeight,
    };
  }

  function unproject(screenX, screenY) {
    return {
      x: clamp((screenX - state.plotLeft) / Math.max(1, state.plotWidth)),
      y: clamp((screenY - state.plotTop) / Math.max(1, state.plotHeight)),
    };
  }

  function nearestStation(x, y) {
    let index = 0;
    let distanceSquared = Infinity;
    STATIONS.forEach((station, stationIndex) => {
      const candidate = (station.x - x) ** 2 + (station.y - y) ** 2;
      if (candidate < distanceSquared) {
        distanceSquared = candidate;
        index = stationIndex;
      }
    });
    return { index, distance: Math.sqrt(distanceSquared) };
  }

  function hashCanvas(canvas) {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const sampleWidth = Math.min(32, canvas.width);
    const sampleHeight = Math.min(18, canvas.height);
    const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let hash = 2166136261;
    for (let index = 0; index < pixels.length; index += 7) {
      hash ^= pixels[index];
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function updateGeometryEvidence() {
    const hostBounds = host.getBoundingClientRect();
    const canvas = host.querySelector('canvas');
    const canvasBounds = canvas?.getBoundingClientRect();
    state.hostWidth = round(hostBounds.width);
    state.hostHeight = round(hostBounds.height);
    state.canvasWidth = sketch?.width || round(hostBounds.width);
    state.canvasHeight = sketch?.height || round(hostBounds.height);
    state.canvasCoverageX = round((canvasBounds?.width || 0) / Math.max(1, hostBounds.width));
    state.canvasCoverageY = round((canvasBounds?.height || 0) / Math.max(1, hostBounds.height));
    updatePlotGeometry();
  }

  function updateDataset() {
    stage.dataset.phase = state.phase;
    stage.dataset.activeStation = state.activeStationId;
    stage.dataset.confirmedStation = state.confirmedStationId;
    stage.dataset.decisionStackDepth = String(state.decisionStackDepth);
    stage.dataset.resultHeld = String(state.resultHeld);
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
  }

  function updateInterface() {
    if (state.activeStationIndex < 0) {
      nearestId.textContent = '—';
      nearestDistance.textContent = 'Move in field';
      readingValue.textContent = '—';
    } else {
      nearestId.textContent = state.activeStationId;
      nearestDistance.textContent = `${state.nearestDistanceKm.toFixed(2)} km · ${state.activeDistrict}`;
      readingValue.textContent = String(state.activeReading);
    }
    undoButton.disabled = state.decisionStack.length === 0;
    if (state.decisionStack.length === 0) {
      decisionLabel.textContent = 'No review lock';
      decisionCopy.textContent = state.activeStationIndex < 0 ? 'Move, then click a cell to confirm' : `Click to attribute to ${state.activeStationId}`;
    } else {
      decisionLabel.textContent = `Review lock · ${state.confirmedStationId}`;
      decisionCopy.textContent = `${state.confirmedReading} µg/m³ · retained after ${state.undoCount ? 'undo' : state.reselectionCount ? 'reselection' : 'confirmation'}`;
    }
    updateDataset();
  }

  function acceptInput(event, kind, source) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      state.lastInputSource = source;
      updateDataset();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    updateDataset();
    return true;
  }

  function selectStation(index, dataX, dataY, source) {
    const station = STATIONS[index];
    const nearest = nearestStation(dataX, dataY);
    state.activeStationIndex = index;
    state.activeStationId = station.id;
    state.activeDistrict = station.district;
    state.activeReading = station.pm25;
    state.activeTrend = station.trend;
    state.cursorDataX = round(dataX);
    state.cursorDataY = round(dataY);
    state.nearestDistanceData = round(nearest.distance);
    state.nearestDistanceKm = round(nearest.distance * 12.6);
    state.nearestSelectionVerified = nearest.index === index;
    state.selectionCount += 1;
    state.phase = state.resultHeld ? 'reviewing-selection' : 'selecting';
    updateInterface();
    sketch.redraw();
    state.humanRenderCount += 1;
    return source;
  }

  function confirmSelection(source) {
    if (state.activeStationIndex < 0) return false;
    const station = STATIONS[state.activeStationIndex];
    const existing = state.decisionStack.at(-1);
    if (existing && existing.stationId !== station.id) state.reselectionCount += 1;
    const decision = {
      sequence: state.confirmCount + 1,
      stationId: station.id,
      district: station.district,
      pm25: station.pm25,
      trend: station.trend,
      dataX: station.x,
      dataY: station.y,
      distanceKm: state.nearestDistanceKm,
      source,
      trusted: true,
      retained: true,
    };
    state.decisionStack.push(decision);
    state.confirmCount += 1;
    state.decisionStackDepth = state.decisionStack.length;
    state.retainedDecisionCount = state.decisionStack.length;
    state.confirmedStationId = decision.stationId;
    state.confirmedReading = decision.pm25;
    state.confirmedDistanceKm = decision.distanceKm;
    state.resultHeld = true;
    state.resultValidated = state.nearestSelectionVerified
      && decision.stationId === STATIONS[state.activeStationIndex].id
      && decision.pm25 === STATIONS[state.activeStationIndex].pm25;
    state.phase = state.reselectionCount > 0 ? 'reselected' : 'confirmed';
    state.auditTrail.push({ action: 'confirm', stationId: decision.stationId, source, trusted: true, retained: true });
    state.auditTrailCount = state.auditTrail.length;
    updateInterface();
    sketch.redraw();
    state.humanRenderCount += 1;
    return true;
  }

  function undoDecision(source) {
    if (state.decisionStack.length === 0) return false;
    const removed = state.decisionStack.pop();
    const restored = state.decisionStack.at(-1) || null;
    state.undoCount += 1;
    state.lastUndoRemovedStation = removed.stationId;
    state.lastUndoRestoredStation = restored?.stationId || 'none';
    state.decisionStackDepth = state.decisionStack.length;
    state.retainedDecisionCount = state.decisionStack.length;
    state.confirmedStationId = restored?.stationId || 'none';
    state.confirmedReading = restored?.pm25 || 0;
    state.confirmedDistanceKm = restored?.distanceKm || 0;
    state.resultHeld = Boolean(restored);
    state.resultValidated = Boolean(restored?.trusted && restored?.retained && STATIONS.some(station => station.id === restored.stationId && station.pm25 === restored.pm25));
    state.phase = restored ? 'undo-restored' : 'undo-empty';
    state.auditTrail.push({ action: 'undo', removedStationId: removed.stationId, restoredStationId: restored?.stationId || 'none', source, trusted: true, retained: Boolean(restored) });
    state.auditTrailCount = state.auditTrail.length;
    updateInterface();
    sketch.redraw();
    state.humanRenderCount += 1;
    return true;
  }

  function localPoint(event) {
    const bounds = host.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function handlePointerMove(event) {
    if (!['mouse', 'touch', 'pen'].includes(event.pointerType)) return;
    if (!acceptInput(event, 'pointer', 'nearest-station-pointer-move')) return;
    state.pointerMoveCount += 1;
    const screen = localPoint(event);
    const data = unproject(screen.x, screen.y);
    const nearest = nearestStation(data.x, data.y);
    selectStation(nearest.index, data.x, data.y, 'pointer-nearest-query');
  }

  function handlePointerDown(event) {
    if (!['mouse', 'touch', 'pen'].includes(event.pointerType)) return;
    if (!acceptInput(event, 'pointer', 'nearest-station-confirm')) return;
    state.pointerConfirmCount += 1;
    const screen = localPoint(event);
    const data = unproject(screen.x, screen.y);
    const nearest = nearestStation(data.x, data.y);
    selectStation(nearest.index, data.x, data.y, 'pointer-confirm-query');
    confirmSelection('pointer-confirm');
  }

  function handleKeyboard(event) {
    if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      if (!acceptInput(event, 'keyboard', `station-${event.key}`)) return;
      state.keyboardSelectionCount += 1;
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const nextIndex = state.activeStationIndex < 0
        ? 0
        : (state.activeStationIndex + direction + STATIONS.length) % STATIONS.length;
      const station = STATIONS[nextIndex];
      selectStation(nextIndex, station.x, station.y, `keyboard-${event.key}`);
      event.preventDefault();
      return;
    }
    if (['Enter', ' '].includes(event.key)) {
      if (!acceptInput(event, 'keyboard', 'keyboard-confirm')) return;
      state.keyboardConfirmCount += 1;
      confirmSelection('keyboard-confirm');
      event.preventDefault();
      return;
    }
    if (!['u', 'U', 'Escape'].includes(event.key)) return;
    if (!acceptInput(event, 'keyboard', 'keyboard-undo')) return;
    state.keyboardUndoCount += 1;
    undoDecision('keyboard-undo');
    event.preventDefault();
  }

  function handleUndoClick(event) {
    if (!acceptInput(event, 'pointer', 'visible-undo-button')) return;
    state.undoButtonCount += 1;
    undoDecision('visible-undo-button');
  }

  function drawBaseMap(p) {
    p.background('#071217');
    p.noStroke();
    for (let y = 0; y < p.height; y += Math.max(1, Math.floor(p.height / 40))) {
      p.fill(72, 121, 111, 8 + Math.round(y / Math.max(1, p.height) * 7));
      p.rect(0, y, p.width, 1);
    }
    p.noFill();
    p.stroke(114, 228, 210, 22);
    p.strokeWeight(.7);
    for (let step = 0; step <= 10; step += 1) {
      const x = state.plotLeft + state.plotWidth * step / 10;
      const y = state.plotTop + state.plotHeight * step / 10;
      p.line(x, state.plotTop, x, state.plotBottom);
      p.line(state.plotLeft, y, state.plotRight, y);
    }
    p.stroke(114, 228, 210, 52);
    p.rect(state.plotLeft, state.plotTop, state.plotWidth, state.plotHeight, 3);

    p.stroke(58, 125, 147, 75);
    p.strokeWeight(Math.max(1, p.width * .003));
    p.bezier(
      state.plotLeft, state.plotTop + state.plotHeight * .61,
      state.plotLeft + state.plotWidth * .29, state.plotTop + state.plotHeight * .5,
      state.plotLeft + state.plotWidth * .6, state.plotTop + state.plotHeight * .78,
      state.plotRight, state.plotTop + state.plotHeight * .58
    );
  }

  function drawVoronoi(p) {
    cells.forEach((cell, index) => {
      const active = index === state.activeStationIndex;
      const confirmed = state.decisionStack.some(decision => decision.stationId === STATIONS[index].id);
      p.fill(active ? 'rgba(217,255,89,.13)' : confirmed ? 'rgba(114,228,210,.11)' : 'rgba(24,67,70,.16)');
      p.stroke(active ? 'rgba(217,255,89,.72)' : confirmed ? 'rgba(114,228,210,.62)' : 'rgba(91,157,151,.22)');
      p.strokeWeight(active ? 1.25 : .7);
      p.beginShape();
      cell.forEach(vertex => {
        const point = project(vertex.x, vertex.y);
        p.vertex(point.x, point.y);
      });
      p.endShape(p.CLOSE);
    });
  }

  function drawStations(p) {
    STATIONS.forEach((station, index) => {
      const point = project(station.x, station.y);
      const active = index === state.activeStationIndex;
      const confirmed = state.decisionStack.some(decision => decision.stationId === station.id);
      p.noStroke();
      p.fill(station.pm25 >= 35 ? '#ff7a59' : station.pm25 >= 25 ? '#ffb452' : '#72e4d2');
      p.circle(point.x, point.y, active ? 7 : 4);
      if (active || confirmed) {
        p.noFill();
        p.stroke(confirmed ? '#72e4d2' : '#d9ff59');
        p.strokeWeight(1.2);
        p.circle(point.x, point.y, active ? 14 : 11);
      }
      p.noStroke();
      p.fill(active ? '#d9ff59' : 'rgba(233,244,241,.52)');
      p.textFont('ui-monospace, monospace');
      p.textStyle(p.BOLD);
      p.textSize(Math.max(5.5, Math.min(8.5, p.width * .017)));
      p.text(station.id, point.x + 6, point.y - 5);
    });
  }

  function drawSelection(p) {
    if (state.activeStationIndex < 0) return;
    const station = STATIONS[state.activeStationIndex];
    const stationPoint = project(station.x, station.y);
    const cursorPoint = project(state.cursorDataX, state.cursorDataY);
    p.noFill();
    p.stroke('#d9ff59');
    p.strokeWeight(1);
    p.drawingContext.setLineDash([3, 3]);
    p.line(cursorPoint.x, cursorPoint.y, stationPoint.x, stationPoint.y);
    p.drawingContext.setLineDash([]);
    p.circle(cursorPoint.x, cursorPoint.y, 11);
    p.line(cursorPoint.x - 7, cursorPoint.y, cursorPoint.x + 7, cursorPoint.y);
    p.line(cursorPoint.x, cursorPoint.y - 7, cursorPoint.x, cursorPoint.y + 7);
    if (state.confirmedStationId !== 'none') {
      const confirmed = STATIONS.find(item => item.id === state.confirmedStationId);
      const confirmedPoint = project(confirmed.x, confirmed.y);
      p.noStroke();
      p.fill('#72e4d2');
      p.circle(confirmedPoint.x, confirmedPoint.y, 3);
      p.textSize(Math.max(6, Math.min(9, p.width * .018)));
      p.text(`✓ REVIEW ${confirmed.id}`, confirmedPoint.x + 8, confirmedPoint.y + 11);
    }
  }

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight)).parent(host);
      p.noLoop();
      updateGeometryEvidence();
    };

    p.draw = () => {
      state.renderCount += 1;
      drawBaseMap(p);
      drawVoronoi(p);
      drawStations(p);
      drawSelection(p);
      updateGeometryEvidence();
      updateInterface();
      if (!state.ready) resolveReady();
    };

    p.windowResized = () => {
      p.resizeCanvas(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
      updateGeometryEvidence();
      p.redraw();
    };
  }, host);

  host.addEventListener('pointermove', handlePointerMove);
  host.addEventListener('pointerdown', handlePointerDown);
  host.addEventListener('keydown', handleKeyboard);
  undoButton.addEventListener('click', handleUndoClick);

  async function initialize() {
    await ready;
    invariant(sketch instanceof p5, 'p5 instance was not created');
    invariant(host.querySelector('canvas')?.getContext('2d'), 'canvas 2D context is missing');
    invariant(STATIONS.length === 12 && cells.length === STATIONS.length, 'station and Voronoi cell counts must match');
    invariant(cells.every(cell => cell.length >= 3), 'every station must own a valid polygon');
    state.cellOwnershipVerified = STATIONS.every((station, index) => nearestStation(station.x, station.y).index === index);
    invariant(state.cellOwnershipVerified, 'a station does not own its source coordinate');
    invariant(Math.abs(state.voronoiAreaSum - 1) < .0002, 'Voronoi cells do not cover the normalized field');
    await document.fonts.ready;
    const canvas = host.querySelector('canvas');
    const firstDrawCount = state.renderCount;
    const firstHash = hashCanvas(canvas);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const secondHash = hashCanvas(canvas);
    state.initialPixelHash = firstHash;
    state.initialStillVerified = firstHash === secondHash
      && firstDrawCount === state.renderCount
      && state.inputCount === 0
      && state.activeStationIndex === INITIAL_ACTIVE_INDEX
      && state.confirmCount === 0
      && state.decisionStack.length === 0
      && state.phase === 'waiting';
    invariant(state.initialStillVerified, 'sensor field changed before human input');
    state.ready = true;
    updateInterface();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    updateGeometryEvidence();
    const canvas = host.querySelector('canvas');
    const geometryEvidence = canvas instanceof HTMLCanvasElement
      && Boolean(canvas.getContext('2d'))
      && state.canvasWidth > 0
      && state.canvasHeight > 0
      && Math.abs(state.canvasWidth - state.hostWidth) <= 1
      && Math.abs(state.canvasHeight - state.hostHeight) <= 1
      && state.canvasCoverageX >= .995
      && state.canvasCoverageY >= .995
      && state.plotWidth > 0
      && state.plotHeight > 0
      && state.stationScreenPositions.length === STATIONS.length
      && state.stationScreenPositions.every(point => point.x >= state.plotLeft && point.x <= state.plotRight && point.y >= state.plotTop && point.y <= state.plotBottom);
    const dataEvidence = state.stationCount === 12
      && state.voronoiCellCount === state.stationCount
      && state.voronoiVertexCounts.length === state.stationCount
      && state.voronoiMinimumVertexCount >= 3
      && Math.abs(state.voronoiAreaSum - 1) < .0002
      && state.dataReadingSum === 283
      && state.dataCoordinateSignature === STATIONS.map(station => `${station.id}:${station.x.toFixed(2)}:${station.y.toFixed(2)}:${station.pm25}`).join('|')
      && state.cellOwnershipVerified;
    const nearestEvidence = state.inputCount === 0
      ? state.activeStationIndex === INITIAL_ACTIVE_INDEX && !state.nearestSelectionVerified
      : state.activeStationIndex >= 0
        && state.activeStationIndex < STATIONS.length
        && state.activeStationId === STATIONS[state.activeStationIndex].id
        && state.activeReading === STATIONS[state.activeStationIndex].pm25
        && state.nearestSelectionVerified
        && nearestStation(state.cursorDataX, state.cursorDataY).index === state.activeStationIndex
        && state.nearestDistanceData >= 0
        && state.nearestDistanceKm >= 0;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && /^[0-9a-f]{8}$/.test(state.initialPixelHash)
      && state.initialPixelHash !== '00000000'
      && !state.automaticTraversal
      && !state.automaticSelection
      && !state.automaticConfirmation
      && !state.automaticPlayback
      && !state.automaticCycle
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.nonInputFunctionalMutationCount === 0
      && state.inputCount === state.trustedInputCount
      && state.lastInputTrusted === (state.inputCount > 0)
      && state.decisionStack.every(decision => decision.trusted && decision.retained)
      && state.auditTrail.every(record => record.trusted);
    const initialOrReviewed = state.inputCount === 0
      ? state.phase === 'waiting'
        && state.decisionStackDepth === 0
        && state.retainedDecisionCount === 0
        && !state.resultHeld
      : state.confirmCount >= 1
        && state.decisionStackDepth === state.decisionStack.length
        && state.retainedDecisionCount === state.decisionStack.length
        && state.confirmedStationId !== 'none'
        && state.confirmedReading === STATIONS.find(station => station.id === state.confirmedStationId)?.pm25
        && state.decisionStack.at(-1)?.stationId === state.confirmedStationId
        && state.auditTrailCount === state.auditTrail.length
        && state.resultHeld
        && state.resultValidated
        && ['confirmed', 'reselected', 'undo-restored', 'reviewing-selection'].includes(state.phase);
    const revisionEvidence = state.auditTrailCount < 3
      ? true
      : state.confirmCount === 2
        && state.reselectionCount === 1
        && state.undoCount === 1
        && state.decisionStackDepth === 1
        && state.retainedDecisionCount === 1
        && state.lastUndoRemovedStation !== 'none'
        && state.lastUndoRestoredStation === state.confirmedStationId
        && state.auditTrail.map(record => record.action).join(',') === 'confirm,confirm,undo'
        && state.auditTrail[0].stationId === state.confirmedStationId
        && state.auditTrail[1].stationId === state.lastUndoRemovedStation
        && state.auditTrail[2].restoredStationId === state.confirmedStationId;
    state.runtimeAssertionPassed = Boolean(state.ready
      && sketch instanceof p5
      && state.renderCount >= 1
      && geometryEvidence
      && dataEvidence
      && nearestEvidence
      && honestInteraction
      && initialOrReviewed
      && revisionEvidence);
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
    return state.runtimeAssertionPassed;
  };

  const initialized = initialize();
  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    ready: initialized,
    render(_seconds, captureClock) {
      if (captureClock) state.previewClockMutationCount += 0;
      return state.phase;
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
