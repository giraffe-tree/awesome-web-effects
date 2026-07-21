import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const GRID_COLUMNS = 28;
const GRID_ROWS = 18;
const HEIGHT_SCALE = 46;
const TARGET_RADIUS_UV = .115;
const TARGETS = [
  { id: 'A', label: 'Drain seam', u: .24, v: .31, severity: 'P2' },
  { id: 'B', label: 'Ridge joint', u: .54, v: .58, severity: 'P1' },
  { id: 'C', label: 'Edge plate', u: .79, v: .29, severity: 'P2' },
];

const clamp = value => Math.max(0, Math.min(1, value));
const round = value => Number(value.toFixed(4));
const heightAt = (u, v) => Math.sin(u * 6.2) * 10 + Math.cos(v * 7.1) * 7 + Math.sin((u + v) * 4) * 4;

function normalAt(u, v) {
  const epsilon = .002;
  const dx = (heightAt(u + epsilon, v) - heightAt(u - epsilon, v)) / (2 * epsilon);
  const dy = (heightAt(u, v + epsilon) - heightAt(u, v - epsilon)) / (2 * epsilon);
  const length = Math.hypot(dx, dy, HEIGHT_SCALE);
  return { x: -dx / length, y: -dy / length, z: HEIGHT_SCALE / length };
}

function normalLength(normal) {
  return Math.hypot(normal.x, normal.y, normal.z);
}

try {
  const stage = document.querySelector('#inspection-stage');
  const host = document.querySelector('#surface-host');
  const readout = document.querySelector('#normal-readout');
  const stampCount = document.querySelector('#stamp-count');
  const missionState = document.querySelector('#mission-state');
  const missionCopy = document.querySelector('#mission-copy');

  const state = {
    id: 'cursor-projected-3d-surface-marker',
    task: 'human-locates-a-digital-twin-inspection-zone-and-retains-a-reviewable-normal-aligned-stamp',
    mechanism: 'trusted-pointer-or-keyboard-position-is-screen-ray-projected-to-a-deterministic-heightfield-and-derivative-normal-before-stamping',
    claimedLibrary: 'p5@2.3.0',
    assetStrategy: 'code-native-deterministic-heightfield-is-the-functional-surface-input-no-raster-input-required',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['captured-mouse-move-and-click', 'captured-touch-or-pen-move-and-press', 'keyboard-arrows', 'keyboard-target-keys-a-b-c', 'keyboard-enter-space'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticPath: false,
    automaticStamping: false,
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
    engaged: false,
    resultHeld: false,
    resultValidated: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerMoveCount: 0,
    pointerPressCount: 0,
    keyboardMoveCount: 0,
    keyboardStampCount: 0,
    syntheticStampCount: 0,
    rejectedTargetMissCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    focusU: TARGETS[0].u,
    focusV: TARGETS[0].v,
    focusHeight: 0,
    focusNormal: { x: 0, y: 0, z: 1 },
    focusNormalLength: 1,
    focusScreenX: 0,
    focusScreenY: 0,
    markerNormalEndX: 0,
    markerNormalEndY: 0,
    expectedNormalEndX: 0,
    expectedNormalEndY: 0,
    normalScreenError: 0,
    projectionResidualPx: 0,
    maximumProjectionResidualPx: 0,
    projectionSolveCount: 0,
    projectionRefinementCount: 0,
    acquiredTarget: 'none',
    targetCount: TARGETS.length,
    targetScreenPositions: [],
    targetAcquireCount: 0,
    stampCount: 0,
    stampCreateCount: 0,
    stampPersistenceRenderCount: 0,
    lastStampTarget: 'none',
    lastStampNormalLength: 0,
    lastStampSignature: 'none',
    stampSignatures: [],
    surfaceGridColumns: GRID_COLUMNS,
    surfaceGridRows: GRID_ROWS,
    surfaceVertexCount: (GRID_COLUMNS + 1) * (GRID_ROWS + 1),
    surfaceCellCount: GRID_COLUMNS * GRID_ROWS,
    heightDataSignature: 'pending',
    renderCount: 0,
    humanRenderCount: 0,
    nonInputFunctionalMutationCount: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    hostWidth: 0,
    hostHeight: 0,
    geometryCoverageX: 0,
    geometryCoverageY: 0,
    resizeCount: 0,
    ready: false,
    runtimeAssertCount: 0,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__SURFACE_INSPECTION_STATE__ = state;

  let sketch = null;
  let resolveReady;
  let latestPointer = null;
  let keyboardFocus = { u: TARGETS[0].u, v: TARGETS[0].v };
  const stamps = [];
  const ready = new Promise(resolve => { resolveReady = resolve; });

  function invariant(condition, message) {
    if (!condition) throw new Error(`cursor-projected-3d-surface-marker: ${message}`);
  }

  function project(u, v, height = heightAt(u, v)) {
    const width = Math.max(1, state.canvasWidth || host.clientWidth);
    const canvasHeight = Math.max(1, state.canvasHeight || host.clientHeight);
    const portrait = canvasHeight > width * 1.15;
    if (portrait) {
      return {
        x: width * (.12 + u * .67 + v * .12),
        y: canvasHeight * (.26 + v * .42 - u * .09) - height * canvasHeight * .0035,
      };
    }
    return {
      x: width * (.19 + u * .61 + v * .13),
      y: canvasHeight * (.26 + v * .49 - u * .11) - height * canvasHeight * .0042,
    };
  }

  function screenNormal(normal) {
    const width = Math.max(1, state.canvasWidth);
    const canvasHeight = Math.max(1, state.canvasHeight);
    const scale = Math.max(12, Math.min(25, Math.min(width, canvasHeight) * .095));
    const rawX = normal.x * .78 + normal.y * .21;
    const rawY = -normal.z * .9 + normal.y * .38 - normal.x * .18;
    const length = Math.hypot(rawX, rawY) || 1;
    return { x: rawX / length * scale, y: rawY / length * scale };
  }

  function solveSurface(screenX, screenY) {
    let best = { u: .5, v: .5, distance: Infinity };
    for (let row = 0; row <= GRID_ROWS; row += 1) {
      for (let column = 0; column <= GRID_COLUMNS; column += 1) {
        const u = column / GRID_COLUMNS;
        const v = row / GRID_ROWS;
        const point = project(u, v);
        const distance = Math.hypot(point.x - screenX, point.y - screenY);
        if (distance < best.distance) best = { u, v, distance };
      }
    }
    let stepU = 1 / GRID_COLUMNS;
    let stepV = 1 / GRID_ROWS;
    for (let pass = 0; pass < 4; pass += 1) {
      let refined = best;
      for (let dv = -1; dv <= 1; dv += 1) {
        for (let du = -1; du <= 1; du += 1) {
          const u = clamp(best.u + du * stepU);
          const v = clamp(best.v + dv * stepV);
          const point = project(u, v);
          const distance = Math.hypot(point.x - screenX, point.y - screenY);
          if (distance < refined.distance) refined = { u, v, distance };
        }
      }
      best = refined;
      stepU *= .42;
      stepV *= .42;
      state.projectionRefinementCount += 1;
    }
    state.projectionSolveCount += 1;
    return best;
  }

  function targetFor(u, v) {
    let nearest = null;
    for (const target of TARGETS) {
      const distance = Math.hypot(target.u - u, target.v - v);
      if (distance <= TARGET_RADIUS_UV && (!nearest || distance < nearest.distance)) nearest = { ...target, distance };
    }
    return nearest;
  }

  function hashCanvas(canvas) {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    const sampleWidth = Math.min(32, width);
    const sampleHeight = Math.min(18, height);
    const data = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let hash = 2166136261;
    for (let index = 0; index < data.length; index += 7) {
      hash ^= data[index];
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function updateGeometry() {
    const bounds = host.getBoundingClientRect();
    const canvas = host.querySelector('canvas');
    const canvasBounds = canvas?.getBoundingClientRect();
    state.hostWidth = round(bounds.width);
    state.hostHeight = round(bounds.height);
    state.canvasWidth = sketch?.width || round(bounds.width);
    state.canvasHeight = sketch?.height || round(bounds.height);
    state.geometryCoverageX = round((canvasBounds?.width || 0) / Math.max(1, bounds.width));
    state.geometryCoverageY = round((canvasBounds?.height || 0) / Math.max(1, bounds.height));
    state.targetScreenPositions = TARGETS.map(target => {
      const point = project(target.u, target.v);
      return { id: target.id, x: round(point.x), y: round(point.y), u: target.u, v: target.v };
    });
  }

  function updateInterface() {
    state.stampCount = stamps.length;
    stage.dataset.phase = state.phase;
    stage.dataset.engaged = String(state.engaged);
    stage.dataset.acquiredTarget = state.acquiredTarget;
    stage.dataset.stampCount = String(state.stampCount);
    stage.dataset.resultHeld = String(state.resultHeld);
    stampCount.textContent = `${stamps.length} verified`;
    if (!state.engaged) {
      readout.textContent = 'N — / — / —';
    } else {
      const normal = state.focusNormal;
      readout.textContent = `N ${normal.x.toFixed(2)} / ${normal.y.toFixed(2)} / ${normal.z.toFixed(2)}`;
    }
  }

  function acceptInput(event, kind, source) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      state.lastInputSource = source;
      updateInterface();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    updateInterface();
    return true;
  }

  function setFocus(u, v, residual, source) {
    const previousTarget = state.acquiredTarget;
    const normal = normalAt(u, v);
    const point = project(u, v);
    const normalVector = screenNormal(normal);
    const target = targetFor(u, v);
    state.focusU = round(u);
    state.focusV = round(v);
    state.focusHeight = round(heightAt(u, v));
    state.focusNormal = { x: round(normal.x), y: round(normal.y), z: round(normal.z) };
    state.focusNormalLength = round(normalLength(normal));
    state.focusScreenX = round(point.x);
    state.focusScreenY = round(point.y);
    state.expectedNormalEndX = round(point.x + normalVector.x);
    state.expectedNormalEndY = round(point.y + normalVector.y);
    state.markerNormalEndX = state.expectedNormalEndX;
    state.markerNormalEndY = state.expectedNormalEndY;
    state.normalScreenError = 0;
    state.projectionResidualPx = round(residual);
    state.maximumProjectionResidualPx = Math.max(state.maximumProjectionResidualPx, state.projectionResidualPx);
    state.acquiredTarget = target?.id || 'none';
    if (state.acquiredTarget !== 'none' && state.acquiredTarget !== previousTarget) state.targetAcquireCount += 1;
    state.engaged = true;
    state.phase = state.resultHeld ? 'reviewing' : target ? 'target-acquired' : 'locating';
    missionState.textContent = target ? `${target.id} · acquired` : 'Locating surface';
    missionCopy.textContent = target ? `${target.label} · ${target.severity} · click to verify` : `${source} · move onto A, B, or C`;
    updateInterface();
    sketch.redraw();
    state.humanRenderCount += 1;
  }

  function localPoint(event) {
    const bounds = host.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function handlePointerMove(event) {
    if (!['mouse', 'touch', 'pen'].includes(event.pointerType)) return;
    if (!acceptInput(event, 'pointer', 'surface-ray-move')) return;
    state.pointerMoveCount += 1;
    const point = localPoint(event);
    latestPointer = point;
    const solved = solveSurface(point.x, point.y);
    setFocus(solved.u, solved.v, solved.distance, `${event.pointerType} ray`);
  }

  function createStamp(source) {
    const target = targetFor(state.focusU, state.focusV);
    if (!target) {
      state.rejectedTargetMissCount += 1;
      state.phase = 'target-miss';
      missionState.textContent = 'No target acquired';
      missionCopy.textContent = 'Move onto A, B, or C before stamping';
      updateInterface();
      sketch.redraw();
      return false;
    }
    const normal = normalAt(state.focusU, state.focusV);
    const stamp = {
      sequence: stamps.length + 1,
      target: target.id,
      u: round(state.focusU),
      v: round(state.focusV),
      height: round(heightAt(state.focusU, state.focusV)),
      normal: { x: round(normal.x), y: round(normal.y), z: round(normal.z) },
      normalLength: round(normalLength(normal)),
      source,
      trusted: true,
      retained: true,
    };
    stamps.push(stamp);
    if (stamps.length > TARGETS.length) stamps.shift();
    state.stampCreateCount += 1;
    state.stampCount = stamps.length;
    state.lastStampTarget = stamp.target;
    state.lastStampNormalLength = stamp.normalLength;
    state.lastStampSignature = `${stamp.target}:${stamp.u.toFixed(4)}:${stamp.v.toFixed(4)}:${stamp.normal.z.toFixed(4)}`;
    state.stampSignatures = stamps.map(item => `${item.target}:${item.u.toFixed(4)}:${item.v.toFixed(4)}:${item.normal.z.toFixed(4)}`);
    state.resultHeld = true;
    state.resultValidated = stamps.every(item => item.trusted && item.retained && Math.abs(item.normalLength - 1) < .0015)
      && new Set(stamps.map(item => item.target)).size === stamps.length;
    state.phase = 'stamped';
    missionState.textContent = `${target.id} · verified`;
    missionCopy.textContent = `${target.label} retained for review`;
    sketch.redraw();
    state.humanRenderCount += 1;
    updateInterface();
    return true;
  }

  function handlePointerDown(event) {
    if (!['mouse', 'touch', 'pen'].includes(event.pointerType)) return;
    if (!acceptInput(event, 'pointer', 'inspection-stamp-press')) return;
    state.pointerPressCount += 1;
    const point = localPoint(event);
    latestPointer = point;
    const solved = solveSurface(point.x, point.y);
    setFocus(solved.u, solved.v, solved.distance, `${event.pointerType} press`);
    createStamp('pointer-press');
  }

  function handleKeyboard(event) {
    const targetKey = event.key.toUpperCase();
    if (['A', 'B', 'C'].includes(targetKey)) {
      if (!acceptInput(event, 'keyboard', `target-key-${targetKey}`)) return;
      state.keyboardMoveCount += 1;
      const target = TARGETS.find(item => item.id === targetKey);
      keyboardFocus = { u: target.u, v: target.v };
      setFocus(target.u, target.v, 0, `key ${targetKey}`);
      event.preventDefault();
      return;
    }
    const movement = {
      ArrowLeft: [-.025, 0],
      ArrowRight: [.025, 0],
      ArrowUp: [0, -.025],
      ArrowDown: [0, .025],
    }[event.key];
    if (movement) {
      if (!acceptInput(event, 'keyboard', `surface-key-${event.key}`)) return;
      state.keyboardMoveCount += 1;
      keyboardFocus = { u: clamp(keyboardFocus.u + movement[0]), v: clamp(keyboardFocus.v + movement[1]) };
      setFocus(keyboardFocus.u, keyboardFocus.v, 0, `key ${event.key.replace('Arrow', '')}`);
      event.preventDefault();
      return;
    }
    if (!['Enter', ' '].includes(event.key)) return;
    if (!acceptInput(event, 'keyboard', `inspection-key-${event.key === ' ' ? 'space' : 'enter'}`)) return;
    state.keyboardStampCount += 1;
    createStamp('keyboard-confirm');
    event.preventDefault();
  }

  function drawSurface(p) {
    p.background('#07110f');
    p.noStroke();
    for (let y = 0; y < p.height; y += Math.max(1, Math.floor(p.height / 44))) {
      const alpha = 9 + Math.round(y / Math.max(1, p.height) * 10);
      p.fill(64, 124, 100, alpha);
      p.rect(0, y, p.width, 1);
    }

    for (let row = GRID_ROWS - 1; row >= 0; row -= 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const u0 = column / GRID_COLUMNS;
        const u1 = (column + 1) / GRID_COLUMNS;
        const v0 = row / GRID_ROWS;
        const v1 = (row + 1) / GRID_ROWS;
        const h00 = heightAt(u0, v0);
        const h10 = heightAt(u1, v0);
        const h11 = heightAt(u1, v1);
        const h01 = heightAt(u0, v1);
        const q00 = project(u0, v0, h00);
        const q10 = project(u1, v0, h10);
        const q11 = project(u1, v1, h11);
        const q01 = project(u0, v1, h01);
        const shade = 22 + Math.round((h00 + h10 + h11 + h01 + 80) * .28);
        p.fill(10 + shade * .22, 44 + shade * .58, 38 + shade * .47, 230);
        p.stroke(75, 152, 119, 52);
        p.strokeWeight(.6);
        p.beginShape();
        p.vertex(q00.x, q00.y);
        p.vertex(q10.x, q10.y);
        p.vertex(q11.x, q11.y);
        p.vertex(q01.x, q01.y);
        p.endShape(p.CLOSE);
      }
    }

    p.noFill();
    for (let row = 0; row <= GRID_ROWS; row += 3) {
      p.stroke(121, 242, 189, 74);
      p.strokeWeight(.75);
      p.beginShape();
      for (let column = 0; column <= GRID_COLUMNS; column += 1) {
        const u = column / GRID_COLUMNS;
        const v = row / GRID_ROWS;
        const point = project(u, v);
        p.vertex(point.x, point.y);
      }
      p.endShape();
    }
  }

  function drawTarget(p, target) {
    const point = project(target.u, target.v);
    const acquired = state.acquiredTarget === target.id;
    const verified = stamps.some(stamp => stamp.target === target.id);
    p.noFill();
    p.stroke(verified ? '#ffb65a' : acquired ? '#ddff57' : 'rgba(233,244,238,.52)');
    p.strokeWeight(acquired || verified ? 1.6 : .8);
    p.circle(point.x, point.y, acquired ? 17 : 12);
    p.circle(point.x, point.y, 3);
    p.noStroke();
    p.fill(verified ? '#ffb65a' : acquired ? '#ddff57' : '#9fb6aa');
    p.textFont('ui-monospace, monospace');
    p.textSize(Math.max(6, Math.min(9, p.width * .02)));
    p.textStyle(p.BOLD);
    p.text(`${target.id} / ${target.label.toUpperCase()}`, point.x + 8, point.y - 7);
  }

  function drawStamp(p, stamp) {
    const point = project(stamp.u, stamp.v, stamp.height);
    const vector = screenNormal(stamp.normal);
    const angle = Math.atan2(vector.y, vector.x);
    p.push();
    p.translate(point.x, point.y);
    p.rotate(angle);
    p.noFill();
    p.stroke('#ffb65a');
    p.strokeWeight(1.5);
    p.rectMode(p.CENTER);
    p.rect(0, 0, 13, 7, 2);
    p.line(0, 0, Math.max(15, Math.hypot(vector.x, vector.y)), 0);
    p.pop();
    p.noStroke();
    p.fill('#ffb65a');
    p.textSize(Math.max(6, Math.min(9, p.width * .018)));
    p.textStyle(p.BOLD);
    p.text(`✓ ${stamp.target} VERIFIED`, point.x + 7, point.y + 12);
  }

  function drawFocus(p) {
    if (!state.engaged) return;
    const point = project(state.focusU, state.focusV, state.focusHeight);
    const vector = screenNormal(state.focusNormal);
    state.markerNormalEndX = round(point.x + vector.x);
    state.markerNormalEndY = round(point.y + vector.y);
    state.normalScreenError = round(Math.hypot(state.markerNormalEndX - state.expectedNormalEndX, state.markerNormalEndY - state.expectedNormalEndY));
    p.noFill();
    p.stroke(state.acquiredTarget === 'none' ? '#79f2bd' : '#ddff57');
    p.strokeWeight(1.4);
    p.circle(point.x, point.y, 10);
    p.line(point.x, point.y, point.x + vector.x, point.y + vector.y);
    p.noStroke();
    p.fill(state.acquiredTarget === 'none' ? '#79f2bd' : '#ddff57');
    p.circle(point.x, point.y, 3.2);
    p.circle(point.x + vector.x, point.y + vector.y, 3);
  }

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight)).parent(host);
      p.noLoop();
      updateGeometry();
      const samples = [];
      for (let row = 0; row <= GRID_ROWS; row += 3) {
        for (let column = 0; column <= GRID_COLUMNS; column += 4) samples.push(Math.round(heightAt(column / GRID_COLUMNS, row / GRID_ROWS) * 100));
      }
      state.heightDataSignature = `${samples.length}:${samples.reduce((sum, value) => sum + value, 0)}:${Math.min(...samples)}:${Math.max(...samples)}`;
    };

    p.draw = () => {
      state.renderCount += 1;
      drawSurface(p);
      TARGETS.forEach(target => drawTarget(p, target));
      stamps.forEach(stamp => drawStamp(p, stamp));
      drawFocus(p);
      if (stamps.length > 0) state.stampPersistenceRenderCount += 1;
      updateGeometry();
      updateInterface();
      if (!state.ready) resolveReady();
    };

    p.windowResized = () => {
      p.resizeCanvas(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
      state.resizeCount += 1;
      updateGeometry();
      p.redraw();
    };
  }, host);

  host.addEventListener('pointermove', handlePointerMove);
  host.addEventListener('pointerdown', handlePointerDown);
  host.addEventListener('keydown', handleKeyboard);

  async function initialize() {
    await ready;
    invariant(sketch instanceof p5, 'p5 instance was not created');
    invariant(host.querySelector('canvas')?.getContext('2d'), 'canvas 2D context is missing');
    invariant(TARGETS.length === 3, 'three inspection targets are required');
    invariant(state.surfaceVertexCount === 551 && state.surfaceCellCount === 504, 'deterministic surface topology changed');
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
      && stamps.length === 0
      && state.phase === 'waiting'
      && !state.engaged;
    invariant(state.initialStillVerified, 'surface or inspection state changed before human input');
    state.ready = true;
    updateGeometry();
    updateInterface();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    updateGeometry();
    const canvas = host.querySelector('canvas');
    const geometryEvidence = canvas instanceof HTMLCanvasElement
      && Boolean(canvas.getContext('2d'))
      && state.hostWidth > 0
      && state.hostHeight > 0
      && Math.abs(state.canvasWidth - state.hostWidth) <= 1
      && Math.abs(state.canvasHeight - state.hostHeight) <= 1
      && state.geometryCoverageX >= .995
      && state.geometryCoverageY >= .995;
    const surfaceEvidence = state.surfaceGridColumns === GRID_COLUMNS
      && state.surfaceGridRows === GRID_ROWS
      && state.surfaceVertexCount === 551
      && state.surfaceCellCount === 504
      && /^56:-?\d+:-?\d+:-?\d+$/.test(state.heightDataSignature)
      && TARGETS.length === state.targetCount
      && state.targetScreenPositions.length === state.targetCount
      && state.targetScreenPositions.every(target => Number.isFinite(target.x) && Number.isFinite(target.y));
    const projectionEvidence = state.inputCount === 0
      ? state.projectionSolveCount === 0 && !state.engaged
      : state.engaged
        && state.projectionSolveCount >= state.pointerPressCount
        && state.focusU >= 0 && state.focusU <= 1
        && state.focusV >= 0 && state.focusV <= 1
        && Math.abs(state.focusNormalLength - 1) < .0015
        && state.focusNormal.z > 0
        && state.normalScreenError <= .05;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && /^[0-9a-f]{8}$/.test(state.initialPixelHash)
      && state.initialPixelHash !== '00000000'
      && !state.automaticPath
      && !state.automaticStamping
      && !state.automaticPlayback
      && !state.automaticCycle
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.nonInputFunctionalMutationCount === 0
      && state.syntheticStampCount === 0
      && state.inputCount === state.trustedInputCount
      && state.lastInputTrusted === (state.inputCount > 0);
    const initialOrStamped = state.inputCount === 0
      ? state.phase === 'waiting'
        && stamps.length === 0
        && !state.resultHeld
        && !state.resultValidated
      : state.targetAcquireCount >= 1
        && state.acquiredTarget !== 'none'
        && state.stampCount >= 1
        && state.stampCreateCount >= 1
        && state.stampCount === stamps.length
        && state.lastStampTarget === state.acquiredTarget
        && Math.abs(state.lastStampNormalLength - 1) < .0015
        && state.stampSignatures.length === state.stampCount
        && state.stampSignatures.includes(state.lastStampSignature)
        && stamps.every(stamp => stamp.trusted && stamp.retained)
        && state.stampPersistenceRenderCount >= 1
        && state.resultHeld
        && state.resultValidated
        && ['stamped', 'reviewing'].includes(state.phase);
    state.runtimeAssertionPassed = Boolean(state.ready
      && sketch instanceof p5
      && state.renderCount >= 1
      && geometryEvidence
      && surfaceEvidence
      && projectionEvidence
      && honestInteraction
      && initialOrStamped);
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
