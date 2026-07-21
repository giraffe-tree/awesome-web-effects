import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const insidePolygon = (point, polygon) => {
  let hit = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const a = polygon[index];
    const b = polygon[previous];
    if (((a.y > point.y) !== (b.y > point.y)) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
};

try {
  const stage = document.querySelector('.preview-stage');
  const host = document.querySelector('#column-host');
  const readout = document.querySelector('#candidate-readout');
  const datumName = document.querySelector('#datum-name');
  const datumValue = document.querySelector('#datum-value');
  const keptValue = document.querySelector('#kept-value');
  const orbitValue = document.querySelector('#orbit-value');
  const pitchValue = document.querySelector('#pitch-value');
  const undoButton = document.querySelector('#undo-selection');
  const resetButton = document.querySelector('#reset-view');
  const keepButton = document.querySelector('#keep-datum');

  const rawData = [
    ['north-quay', 'North Quay', 42], ['canal-ward', 'Canal Ward', 55], ['museum-hill', 'Museum Hill', 38], ['civic-core', 'Civic Core', 89], ['east-gate', 'East Gate', 68],
    ['old-port', 'Old Port', 47], ['market-row', 'Market Row', 74], ['station-south', 'Station South', 81], ['garden-loop', 'Garden Loop', 59], ['foundry', 'Foundry', 93],
    ['river-bend', 'River Bend', 36], ['library', 'Library', 52], ['midtown', 'Midtown', 78], ['arts-dock', 'Arts Dock', 64], ['seaport', 'Seaport', 87],
    ['west-yard', 'West Yard', 44], ['university', 'University', 71], ['medical', 'Medical', 96], ['tech-park', 'Tech Park', 84], ['harbor-east', 'Harbor East', 66],
    ['greenway', 'Greenway', 33], ['arena', 'Arena', 58], ['night-market', 'Night Market', 76], ['terminal', 'Terminal', 91], ['southbank', 'Southbank', 62],
  ];
  const minimumValue = Math.min(...rawData.map(([, , value]) => value));
  const maximumValue = Math.max(...rawData.map(([, , value]) => value));
  const heightForValue = value => .45 + (value - minimumValue) / (maximumValue - minimumValue) * 1.55;
  const bandForValue = value => value < 45 ? 'low' : value < 70 ? 'watch' : 'peak';
  const palette = {
    low: { top: '#6fd0ae', left: '#2e725d', right: '#45977b' },
    watch: { top: '#a99aff', left: '#5143a8', right: '#6e5ec8' },
    peak: { top: '#ff9b82', left: '#a84535', right: '#d85f49' },
  };
  const columns = rawData.map(([id, name, value], index) => ({
    id,
    name,
    value,
    row: Math.floor(index / 5),
    col: index % 5,
    height: heightForValue(value),
    band: bandForValue(value),
  }));

  const DEFAULT_CAMERA = Object.freeze({ yaw: -.65, pitch: .54 });
  const state = {
    id: 'pickable-extruded-data-columns',
    productTask: 'Inspect and explicitly retain one district from a deterministic 09:00 city demand matrix.',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'deterministic named data drives 3D column height/color; face polygons drive trusted geometric picking',
    assetStrategy: 'code-native',
    imageGenDecision: 'omitted: named numeric data, 3D projection, face polygons, and hit-testing drive the mechanism; raster pixels would not participate in identity or selection',
    captureType: 'interactive',
    automaticCamera: false,
    automaticRotation: false,
    automaticSelection: false,
    automaticCycle: false,
    automaticFallback: false,
    initialStillVerified: false,
    dataSource: 'CIVIC_GRID_0900_STATIC_V1',
    dataCount: columns.length,
    dataChecksum: columns.reduce((sum, datum, index) => sum + datum.value * (index + 1), 0),
    minimumValue,
    maximumValue,
    heightMappingVerified: columns.every(datum => Math.abs(datum.height - heightForValue(datum.value)) < 1e-9),
    colorMappingVerified: columns.every(datum => datum.band === bandForValue(datum.value) && Boolean(palette[datum.band])),
    uniqueDatumIdentityCount: new Set(columns.map(datum => datum.id)).size,
    trustedPointerInputCount: 0,
    trustedKeyboardInputCount: 0,
    trustedControlInputCount: 0,
    syntheticRejectedCount: 0,
    pointerHoverCount: 0,
    pointerPickCount: 0,
    keyboardCandidateCount: 0,
    cameraDragCount: 0,
    keyboardCameraCount: 0,
    cameraMutationCount: 0,
    pickTestCount: 0,
    pickHitCount: 0,
    pickMissCount: 0,
    pickingMismatchCount: 0,
    datumIdentityMismatchCount: 0,
    candidateChangeCount: 0,
    candidateRetainedSeparationCount: 0,
    keepCount: 0,
    retainVersion: 0,
    prematureCommitCount: 0,
    retainedChangeOutsideKeepCount: 0,
    undoCount: 0,
    resetCount: 0,
    drawCount: 0,
    columnGeometryCount: 0,
    facePolygonCount: 0,
    projectedHeightChecksum: 0,
    canvasCoverage: 0,
    phase: 'ready',
    lastInputType: 'none',
    candidateIndex: null,
    candidateId: null,
    retainedIndex: null,
    retainedId: null,
    camera: { ...DEFAULT_CAMERA },
    pickTargets: [],
    safeOrbitPoint: null,
    transactionLog: [],
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let camera = { ...DEFAULT_CAMERA };
  let candidateIndex = null;
  let retainedIndex = null;
  let undoStack = [];
  let facesForPicking = [];
  let pickTargets = [];
  let pointerGesture = null;
  let sketch;
  let resolveReady;
  let initialSignature = '';
  let stillRenderCount = 0;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const round = value => Math.round(value * 1000) / 1000;
  const retainedSignature = () => retainedIndex === null ? null : columns[retainedIndex].id;
  const cameraSignature = () => `${camera.yaw.toFixed(4)}|${camera.pitch.toFixed(4)}`;

  function record(kind, source, extra = {}) {
    state.transactionLog.push({
      kind,
      source,
      candidateId: candidateIndex === null ? null : columns[candidateIndex].id,
      retainedId: retainedSignature(),
      camera: { ...camera },
      ...extra,
    });
    if (state.transactionLog.length > 22) state.transactionLog.shift();
  }

  function rejectSynthetic(event) {
    if (event.isTrusted) return false;
    state.syntheticRejectedCount += 1;
    return true;
  }

  function updateUi() {
    const candidate = candidateIndex === null ? null : columns[candidateIndex];
    const retained = retainedIndex === null ? null : columns[retainedIndex];
    readout.dataset.empty = String(!candidate);
    datumName.textContent = candidate?.name || 'Move over a column';
    datumValue.textContent = candidate ? String(candidate.value) : '—';
    keptValue.textContent = retained ? `${retained.name} · ${retained.value} MW · kept v${state.retainVersion}` : 'No district kept';
    orbitValue.textContent = `${Math.round(camera.yaw * 180 / Math.PI)}°`;
    pitchValue.textContent = `${Math.round(camera.pitch * 180 / Math.PI)}°`;
    keepButton.disabled = candidateIndex === null;
    undoButton.disabled = undoStack.length === 0;
    state.candidateIndex = candidateIndex;
    state.candidateId = candidate?.id || null;
    state.retainedIndex = retainedIndex;
    state.retainedId = retained?.id || null;
    state.camera = { yaw: round(camera.yaw), pitch: round(camera.pitch) };
    state.pickTargets = pickTargets.map(target => ({ ...target }));
    state.undoDepth = undoStack.length;
  }

  function setCandidate(index, source) {
    if (index === null || index < 0 || index >= columns.length) return;
    const beforeRetained = retainedSignature();
    const target = pickTargets.find(entry => entry.index === index);
    if (target && target.id !== columns[index].id) state.datumIdentityMismatchCount += 1;
    if (candidateIndex !== index) state.candidateChangeCount += 1;
    candidateIndex = index;
    state.phase = 'candidate';
    state.lastInputType = source;
    if (retainedSignature() === beforeRetained) state.candidateRetainedSeparationCount += 1;
    else state.retainedChangeOutsideKeepCount += 1;
    record('candidate', source, { datumId: columns[index].id });
    updateUi();
    sketch?.redraw();
  }

  function keepCandidate(source) {
    if (candidateIndex === null) {
      state.prematureCommitCount += 1;
      return;
    }
    undoStack.push(retainedIndex);
    retainedIndex = candidateIndex;
    state.keepCount += 1;
    state.retainVersion += 1;
    state.phase = 'retained';
    state.lastInputType = source;
    record('keep-commit', source, { datumId: columns[retainedIndex].id });
    updateUi();
    sketch?.redraw();
  }

  function hitTest(point) {
    state.pickTestCount += 1;
    for (let index = facesForPicking.length - 1; index >= 0; index -= 1) {
      const face = facesForPicking[index];
      if (insidePolygon(point, face.polygon)) {
        state.pickHitCount += 1;
        if (columns[face.datumIndex].id !== face.datumId) state.pickingMismatchCount += 1;
        return face.datumIndex;
      }
    }
    state.pickMissCount += 1;
    return null;
  }

  function navigateCandidate(key) {
    const current = candidateIndex ?? 12;
    let row = Math.floor(current / 5);
    let col = current % 5;
    if (key === 'ArrowLeft') col = Math.max(0, col - 1);
    if (key === 'ArrowRight') col = Math.min(4, col + 1);
    if (key === 'ArrowUp') row = Math.max(0, row - 1);
    if (key === 'ArrowDown') row = Math.min(4, row + 1);
    state.keyboardCandidateCount += 1;
    setCandidate(row * 5 + col, 'keyboard-candidate');
  }

  function mutateCamera(deltaYaw, deltaPitch, source) {
    const beforeRetained = retainedSignature();
    camera.yaw = clamp(camera.yaw + deltaYaw, -1.25, .05);
    camera.pitch = clamp(camera.pitch + deltaPitch, .3, .9);
    state.cameraMutationCount += 1;
    state.lastInputType = source;
    if (retainedSignature() !== beforeRetained) state.retainedChangeOutsideKeepCount += 1;
    record('camera-transit', source);
    updateUi();
    sketch?.redraw();
  }

  host.addEventListener('pointerdown', event => {
    if (rejectSynthetic(event)) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    state.trustedPointerInputCount += 1;
    const rect = host.getBoundingClientRect();
    pointerGesture = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      last: { x: event.clientX, y: event.clientY },
      localStart: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      cameraStart: { ...camera },
      dragged: false,
    };
    host.setPointerCapture(event.pointerId);
    record('pointer-intent', 'pointer');
  });

  host.addEventListener('pointermove', event => {
    if (!event.isTrusted) return;
    const rect = host.getBoundingClientRect();
    const local = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (pointerGesture && pointerGesture.pointerId === event.pointerId) {
      const totalDistance = Math.hypot(event.clientX - pointerGesture.start.x, event.clientY - pointerGesture.start.y);
      if (totalDistance > 5) pointerGesture.dragged = true;
      if (pointerGesture.dragged) {
        if (state.cameraDragCount === 0 || !pointerGesture.counted) {
          state.cameraDragCount += 1;
          pointerGesture.counted = true;
        }
        const deltaX = event.clientX - pointerGesture.last.x;
        const deltaY = event.clientY - pointerGesture.last.y;
        mutateCamera(deltaX * .006, -deltaY * .005, 'pointer-camera');
        pointerGesture.last = { x: event.clientX, y: event.clientY };
      }
      return;
    }
    const hit = hitTest(local);
    if (hit !== null) {
      state.pointerHoverCount += 1;
      setCandidate(hit, 'pointer-hover');
    }
  });

  host.addEventListener('pointerup', event => {
    if (!pointerGesture || pointerGesture.pointerId !== event.pointerId) return;
    const gesture = pointerGesture;
    pointerGesture = null;
    if (!gesture.dragged && event.isTrusted) {
      const rect = host.getBoundingClientRect();
      const hit = hitTest({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      if (hit !== null) {
        state.pointerPickCount += 1;
        setCandidate(hit, 'pointer-pick');
      }
    }
    record(gesture.dragged ? 'camera-settle' : 'pick-settle', 'pointer');
    updateUi();
    sketch?.redraw();
  });

  host.addEventListener('pointerleave', () => {
    if (!pointerGesture && state.lastInputType === 'pointer-hover') {
      state.phase = retainedIndex === null ? 'ready' : 'retained';
    }
  });

  host.addEventListener('keydown', event => {
    const selectionKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    const cameraKeys = ['a', 'd', 'w', 's', 'A', 'D', 'W', 'S'];
    if (!selectionKeys.includes(event.key) && !cameraKeys.includes(event.key)) return;
    if (rejectSynthetic(event)) return;
    event.preventDefault();
    state.trustedKeyboardInputCount += 1;
    if (selectionKeys.includes(event.key)) {
      navigateCandidate(event.key);
      return;
    }
    state.keyboardCameraCount += 1;
    const key = event.key.toLowerCase();
    mutateCamera(key === 'a' ? -.08 : key === 'd' ? .08 : 0, key === 'w' ? .055 : key === 's' ? -.055 : 0, 'keyboard-camera');
  });

  keepButton.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    keepCandidate('keep-button');
  });

  undoButton.addEventListener('click', event => {
    if (rejectSynthetic(event) || undoStack.length === 0) return;
    state.trustedControlInputCount += 1;
    retainedIndex = undoStack.pop();
    state.undoCount += 1;
    state.phase = 'undo';
    state.lastInputType = 'undo-button';
    record('undo-retained', 'control');
    updateUi();
    sketch?.redraw();
  });

  resetButton.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    camera = { ...DEFAULT_CAMERA };
    candidateIndex = null;
    retainedIndex = null;
    undoStack = [];
    pointerGesture = null;
    state.resetCount += 1;
    state.phase = 'reset';
    state.lastInputType = 'reset-button';
    record('reset', 'control');
    updateUi();
    sketch?.redraw();
  });

  sketch = new p5(p => {
    const project = (x, y, z, layout) => {
      const cosine = Math.cos(camera.yaw);
      const sine = Math.sin(camera.yaw);
      const rotatedX = x * cosine - z * sine;
      const rotatedZ = x * sine + z * cosine;
      return {
        x: layout.centerX + rotatedX * layout.scale,
        y: layout.centerY + (rotatedZ * Math.sin(camera.pitch) - y * Math.cos(camera.pitch)) * layout.scale,
        depth: rotatedZ,
      };
    };

    const polygonCenter = polygon => ({
      x: polygon.reduce((sum, point) => sum + point.x, 0) / polygon.length,
      y: polygon.reduce((sum, point) => sum + point.y, 0) / polygon.length,
    });

    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(stage.clientWidth, stage.clientHeight).parent(host);
      p.noLoop();
      resolveReady();
    };

    p.windowResized = () => {
      p.resizeCanvas(stage.clientWidth, stage.clientHeight);
      p.redraw();
    };

    p.draw = () => {
      state.drawCount += 1;
      p.clear();
      const width = p.width;
      const height = p.height;
      const portrait = width / height < .8;
      const large = width >= 500;
      const layout = {
        centerX: portrait ? width * .54 : width * (large ? .65 : .64),
        centerY: portrait ? height * .59 : height * (large ? .65 : .64),
        scale: portrait ? Math.min(width, height) * .17 : Math.min(width, height) * .16,
      };
      p.noStroke();
      p.fill(21, 24, 22, 18);
      const ground = [
        project(-2.8, 0, -2.8, layout), project(2.8, 0, -2.8, layout),
        project(2.8, 0, 2.8, layout), project(-2.8, 0, 2.8, layout),
      ];
      p.quad(...ground.flatMap(point => [point.x, point.y]));

      const rendered = columns.map((datum, index) => {
        const centerX = datum.col - 2;
        const centerZ = datum.row - 2;
        const half = .36;
        const bottom = [
          project(centerX - half, 0, centerZ - half, layout),
          project(centerX + half, 0, centerZ - half, layout),
          project(centerX + half, 0, centerZ + half, layout),
          project(centerX - half, 0, centerZ + half, layout),
        ];
        const top = [
          project(centerX - half, datum.height, centerZ - half, layout),
          project(centerX + half, datum.height, centerZ - half, layout),
          project(centerX + half, datum.height, centerZ + half, layout),
          project(centerX - half, datum.height, centerZ + half, layout),
        ];
        const faces = [
          { kind: 'left', polygon: [top[0], top[3], bottom[3], bottom[0]] },
          { kind: 'right', polygon: [top[1], top[2], bottom[2], bottom[1]] },
          { kind: 'front', polygon: [top[2], top[3], bottom[3], bottom[2]] },
          { kind: 'top', polygon: top },
        ];
        return {
          datum,
          index,
          depth: project(centerX, 0, centerZ, layout).depth,
          top,
          faces,
        };
      }).sort((a, b) => a.depth - b.depth);

      const nextFaces = [];
      const nextTargets = [];
      let heightChecksum = 0;
      rendered.forEach(column => {
        const selected = column.index === candidateIndex;
        const retained = column.index === retainedIndex;
        const colors = palette[column.datum.band];
        column.faces.forEach(face => {
          const base = face.kind === 'top' ? colors.top : face.kind === 'left' ? colors.left : colors.right;
          p.fill(base);
          p.stroke(selected ? '#151816' : retained ? '#f5f2e9' : 'rgba(21,24,22,.24)');
          p.strokeWeight(selected ? (large ? 3 : 1.7) : retained ? (large ? 2 : 1.2) : 1);
          p.beginShape();
          face.polygon.forEach(point => p.vertex(point.x, point.y));
          p.endShape(p.CLOSE);
          nextFaces.push({ datumIndex: column.index, datumId: column.datum.id, polygon: face.polygon.map(point => ({ x: point.x, y: point.y })) });
        });
        const target = polygonCenter(column.top);
        nextTargets.push({ index: column.index, id: column.datum.id, x: round(target.x), y: round(target.y) });
        heightChecksum += Math.round(column.datum.height * 1000) * (column.index + 1);
      });

      facesForPicking = nextFaces;
      pickTargets = nextTargets.sort((a, b) => a.index - b.index);
      const safeCandidates = portrait
        ? [
            { x: width * .91, y: height * .72 },
            { x: width * .91, y: height * .49 },
            { x: width * .08, y: height * .71 },
          ]
        : [
            { x: width * .35, y: height * .72 },
            { x: width * .34, y: height * .45 },
            { x: width * .94, y: height * .7 },
          ];
      const safePoint = safeCandidates.find(point => !nextFaces.some(face => insidePolygon(point, face.polygon))) || safeCandidates[0];
      state.safeOrbitPoint = { x: round(safePoint.x), y: round(safePoint.y) };
      state.columnGeometryCount = rendered.length;
      state.facePolygonCount = nextFaces.length;
      state.projectedHeightChecksum = heightChecksum;
      const canvas = host.querySelector('canvas');
      state.canvasCoverage = canvas ? round(canvas.clientWidth * canvas.clientHeight / Math.max(1, width * height)) : 0;
      updateUi();

      const signature = `${cameraSignature()}|${candidateIndex}|${retainedIndex}|${heightChecksum}`;
      if (!initialSignature) initialSignature = signature;
      if (state.trustedPointerInputCount + state.trustedKeyboardInputCount + state.trustedControlInputCount === 0 && signature === initialSignature) {
        stillRenderCount += 1;
        state.initialStillVerified = stillRenderCount >= 2;
      }
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = host.querySelector('canvas');
    const bounds = canvas?.getBoundingClientRect();
    return sketch instanceof p5
      && Boolean(canvas?.getContext('2d'))
      && state.dataCount === 25
      && state.uniqueDatumIdentityCount === 25
      && state.dataChecksum === 22112
      && state.heightMappingVerified
      && state.colorMappingVerified
      && state.columnGeometryCount === 25
      && state.facePolygonCount === 100
      && state.projectedHeightChecksum > 100000
      && state.pickTargets.length === 25
      && state.drawCount > 0
      && state.initialStillVerified
      && state.automaticCamera === false
      && state.automaticRotation === false
      && state.automaticSelection === false
      && state.automaticCycle === false
      && state.automaticFallback === false
      && state.pickingMismatchCount === 0
      && state.datumIdentityMismatchCount === 0
      && state.prematureCommitCount === 0
      && state.retainedChangeOutsideKeepCount === 0
      && state.canvasCoverage >= .98
      && bounds.width >= stage.clientWidth * .98
      && bounds.height >= stage.clientHeight * .98;
  };

  updateUi();
  installPreviewController({
    id: state.id,
    library: state.library,
    renderer: state.renderer,
    render: () => sketch.redraw(),
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
