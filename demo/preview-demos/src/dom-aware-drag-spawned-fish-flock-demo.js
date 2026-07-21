import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const SETTLE_DURATION = 1.55;
const MAX_FISH = 42;
const MIN_SPAWN_SPACING = 5;
const SAFE_MARGIN_X = 17;
const SAFE_MARGIN_Y = 14;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = value => Number(value.toFixed(3));

try {
  const stage = document.querySelector('#flock-preview');
  const container = document.querySelector('#flock-stage');
  const obstacleElement = document.querySelector('#flock-obstacle');
  const fieldState = document.querySelector('#field-state');
  const gestureNote = document.querySelector('#gesture-note');
  const fishCount = document.querySelector('#fish-count');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !container || !obstacleElement || !fieldState || !gestureNote || !fishCount) {
    throw new Error('DOM-aware fish field is incomplete');
  }

  const state = {
    id: 'dom-aware-drag-spawned-fish-flock',
    task: 'trusted-human-drag-releases-a-school-that-avoids-a-measured-html-reef',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'trusted-pointer-drag-spawns-deterministic-boids-whose-predicted-path-steers-around-live-dom-bounds',
    assetStrategy: 'code-native-fish-and-measured-dom-obstacle-no-functional-raster-input-required',
    captureType: 'interactive',
    causality: 'only-trusted-pointer-drag-can-create-fish-and-start-one-finite-settle',
    acceptedInputs: ['trusted-mouse-drag', 'trusted-touch-drag', 'trusted-pen-drag'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticPlayback: false,
    automaticCycle: false,
    automaticLoop: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    previewClockMutationBeforeInput: false,
    previewClockDrivesFiniteTransitionAfterInput: true,
    settleDuration: SETTLE_DURATION,
    phase: 'waiting',
    latestPreviewTime: 0,
    settleStartTime: 0,
    settleProgress: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    dragActive: false,
    activePointerId: null,
    lastPointerType: 'none',
    lastInputTrusted: null,
    dragDistance: 0,
    dragSampleCount: 0,
    spawnAttemptCount: 0,
    spawnCount: 0,
    rejectedObstacleSpawnCount: 0,
    rejectedCapacitySpawnCount: 0,
    fishCount: 0,
    maximumFishCount: MAX_FISH,
    simulationStepCount: 0,
    avoidanceActivationCount: 0,
    uniqueAvoidingFishCount: 0,
    hardProjectionCount: 0,
    obstacleIntrusionCount: 0,
    closestNormalizedObstacleDistance: 99,
    measuredObstacleSampleCount: 0,
    obstacleBounds: null,
    obstacleBoundsSource: 'getBoundingClientRect',
    obstacleBoundsValidated: false,
    canvasSizeValidated: false,
    stageCoverageValidated: false,
    initialStillVerified: false,
    finalResultValidated: false,
    finalStableSignature: 'none',
    stableSignatureSampleCount: 0,
    drawCount: 0,
    renderCount: 0,
    resizeCount: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionDirectCount: 0,
    ready: false,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__DOM_AWARE_FISH_STATE__ = state;

  let sketch;
  let fish = [];
  let obstacle = { left: 0, top: 0, right: 0, bottom: 0, cx: 0, cy: 0, rx: 1, ry: 1 };
  let lastPointer = null;
  let previousSettleProgress = 0;
  const avoidingFish = new Set();
  let resolveFirstDraw;
  const firstDrawReady = new Promise(resolve => { resolveFirstDraw = resolve; });

  const nextFrames = (count = 2) => new Promise(resolve => {
    const advance = remaining => {
      if (remaining <= 0) resolve();
      else requestAnimationFrame(() => advance(remaining - 1));
    };
    advance(count);
  });

  function invariant(condition, message) {
    if (!condition) throw new Error(`dom-aware-drag-spawned-fish-flock: ${message}`);
  }

  function updateDataset() {
    stage.dataset.phase = state.phase;
    stage.dataset.hasResult = String(state.fishCount > 0);
    stage.dataset.fishCount = String(state.fishCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.spawnCount = String(state.spawnCount);
    stage.dataset.avoidanceActivationCount = String(state.avoidanceActivationCount);
    stage.dataset.obstacleIntrusionCount = String(state.obstacleIntrusionCount);
  }

  function syncInterface() {
    fishCount.value = String(state.fishCount).padStart(2, '0');
    fishCount.textContent = String(state.fishCount).padStart(2, '0');
    if (state.phase === 'waiting') {
      fieldState.textContent = 'Awaiting gesture';
      gestureNote.textContent = 'Drag open water to release the school';
    } else if (state.phase === 'dragging') {
      fieldState.textContent = 'School entering';
      gestureNote.textContent = 'Keep dragging · the reef is measured live';
    } else if (state.phase === 'settling') {
      fieldState.textContent = 'Routing reef';
      gestureNote.textContent = 'School is reading the DOM boundary';
    } else if (state.phase === 'held') {
      fieldState.textContent = 'Route held';
      gestureNote.textContent = `${state.uniqueAvoidingFishCount} fish sensed the reef · drag again`;
    } else {
      fieldState.textContent = 'Gesture cancelled';
      gestureNote.textContent = 'Drag again to continue the school';
    }
    updateDataset();
  }

  function measureObstacle() {
    const canvasBounds = container.getBoundingClientRect();
    const bounds = obstacleElement.getBoundingClientRect();
    obstacle = {
      left: bounds.left - canvasBounds.left,
      top: bounds.top - canvasBounds.top,
      right: bounds.right - canvasBounds.left,
      bottom: bounds.bottom - canvasBounds.top,
      cx: bounds.left - canvasBounds.left + bounds.width / 2,
      cy: bounds.top - canvasBounds.top + bounds.height / 2,
      rx: bounds.width / 2 + SAFE_MARGIN_X,
      ry: bounds.height / 2 + SAFE_MARGIN_Y,
    };
    state.measuredObstacleSampleCount += 1;
    state.obstacleBounds = Object.fromEntries(Object.entries(obstacle).map(([key, value]) => [key, round(value)]));
    state.obstacleBoundsValidated = bounds.width >= 80
      && bounds.height >= 50
      && obstacle.left >= 0
      && obstacle.top >= 0
      && obstacle.right <= canvasBounds.width + 1
      && obstacle.bottom <= canvasBounds.height + 1;
  }

  const normalizedObstacleDistance = (x, y) => Math.hypot((x - obstacle.cx) / obstacle.rx, (y - obstacle.cy) / obstacle.ry);

  function validateGeometry() {
    const stageBounds = stage.getBoundingClientRect();
    const canvas = container.querySelector('canvas');
    state.canvasSizeValidated = Boolean(canvas)
      && Math.abs(canvas.width - Math.round(stageBounds.width)) <= 2
      && Math.abs(canvas.height - Math.round(stageBounds.height)) <= 2;
    state.stageCoverageValidated = stageBounds.width >= innerWidth * .99
      && stageBounds.height >= innerHeight * .99
      && container.getBoundingClientRect().width >= innerWidth * .99
      && container.getBoundingClientRect().height >= innerHeight * .99;
  }

  function recordTrustedPointer(event, source) {
    if (event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      updateDataset();
      return false;
    }
    if (!['mouse', 'touch', 'pen'].includes(event.pointerType)) return false;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastPointerType = event.pointerType;
    state.lastInputTrusted = true;
    state.lastInputSource = source;
    return true;
  }

  function makeFish(x, y, dx, dy) {
    state.spawnAttemptCount += 1;
    if (fish.length >= MAX_FISH) {
      state.rejectedCapacitySpawnCount += 1;
      return false;
    }
    if (normalizedObstacleDistance(x, y) < 1.08) {
      state.rejectedObstacleSpawnCount += 1;
      return false;
    }
    const id = state.spawnCount;
    const length = Math.hypot(dx, dy) || 1;
    const speed = 1.05 + (id % 5) * .08;
    const fishItem = {
      id,
      x: clamp(x, 10, Math.max(11, sketch.width - 10)),
      y: clamp(y, 10, Math.max(11, sketch.height - 10)),
      vx: dx / length * speed,
      vy: dy / length * speed + ((id % 3) - 1) * .11,
      hue: id % 4,
      size: .78 + (id % 5) * .07,
      avoided: false,
    };
    fish.push(fishItem);
    state.spawnCount += 1;
    state.fishCount = fish.length;
    return true;
  }

  function spawnAlongSegment(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    state.dragDistance += distance;
    state.dragSampleCount += 1;
    const count = Math.max(1, Math.floor(distance / MIN_SPAWN_SPACING));
    for (let index = 1; index <= count; index += 1) {
      const mix = index / count;
      makeFish(from.x + dx * mix, from.y + dy * mix, dx, dy);
    }
    syncInterface();
  }

  function beginDrag(event) {
    if (!recordTrustedPointer(event, 'field-drag-start')) return;
    state.pointerDownCount += 1;
    state.dragActive = true;
    state.activePointerId = event.pointerId;
    state.phase = 'dragging';
    state.settleProgress = 0;
    previousSettleProgress = 0;
    lastPointer = { x: event.clientX, y: event.clientY };
    container.setPointerCapture(event.pointerId);
    if (container.hasPointerCapture(event.pointerId)) state.pointerCaptureCount += 1;
    syncInterface();
    sketch.redraw();
    event.preventDefault();
  }

  function continueDrag(event) {
    if (!state.dragActive || event.pointerId !== state.activePointerId) return;
    if (!recordTrustedPointer(event, 'field-drag-move')) return;
    state.pointerMoveCount += 1;
    const bounds = container.getBoundingClientRect();
    const next = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    spawnAlongSegment(lastPointer, next);
    lastPointer = next;
    sketch.redraw();
    event.preventDefault();
  }

  function finishDrag(event, cancelled = false) {
    if (!state.dragActive || event.pointerId !== state.activePointerId) return;
    if (!recordTrustedPointer(event, cancelled ? 'field-drag-cancel' : 'field-drag-release')) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.dragActive = false;
    state.activePointerId = null;
    container.blur();
    state.phase = fish.length > 0 && !cancelled ? 'settling' : cancelled ? 'cancelled' : 'waiting';
    state.settleStartTime = state.latestPreviewTime;
    state.settleProgress = 0;
    previousSettleProgress = 0;
    syncInterface();
    sketch.redraw();
    event.preventDefault();
  }

  function keepOutsideObstacle(item) {
    const distance = normalizedObstacleDistance(item.x, item.y);
    if (distance >= 1) {
      state.closestNormalizedObstacleDistance = Math.min(state.closestNormalizedObstacleDistance, distance);
      return;
    }
    state.hardProjectionCount += 1;
    const angle = Math.atan2((item.y - obstacle.cy) / obstacle.ry, (item.x - obstacle.cx) / obstacle.rx);
    item.x = obstacle.cx + Math.cos(angle) * obstacle.rx * 1.015;
    item.y = obstacle.cy + Math.sin(angle) * obstacle.ry * 1.015;
    const outwardX = (item.x - obstacle.cx) / (obstacle.rx * obstacle.rx);
    const outwardY = (item.y - obstacle.cy) / (obstacle.ry * obstacle.ry);
    const outwardLength = Math.hypot(outwardX, outwardY) || 1;
    item.vx += outwardX / outwardLength * .4;
    item.vy += outwardY / outwardLength * .4;
    state.closestNormalizedObstacleDistance = Math.min(
      state.closestNormalizedObstacleDistance,
      normalizedObstacleDistance(item.x, item.y),
    );
  }

  function simulateStep(stepScale) {
    if (!fish.length) return;
    const center = fish.reduce((acc, item) => ({ x: acc.x + item.x / fish.length, y: acc.y + item.y / fish.length }), { x: 0, y: 0 });
    fish.forEach((item, index) => {
      let separationX = 0;
      let separationY = 0;
      fish.forEach(other => {
        if (other === item) return;
        const dx = item.x - other.x;
        const dy = item.y - other.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > 1 && distanceSquared < 21 * 21) {
          separationX += dx / distanceSquared;
          separationY += dy / distanceSquared;
        }
      });

      item.vx += (center.x - item.x) * .0007 * stepScale + separationX * .15 * stepScale;
      item.vy += (center.y - item.y) * .0007 * stepScale + separationY * .15 * stepScale;

      const predictedX = item.x + item.vx * 22;
      const predictedY = item.y + item.vy * 22;
      const predictedDistance = normalizedObstacleDistance(predictedX, predictedY);
      if (predictedDistance < 1.48) {
        const nx = (predictedX - obstacle.cx) / obstacle.rx;
        const ny = (predictedY - obstacle.cy) / obstacle.ry;
        const nLength = Math.hypot(nx, ny) || 1;
        const strength = (1.48 - predictedDistance) * .16 * stepScale;
        item.vx += nx / nLength * strength;
        item.vy += ny / nLength * strength;
        const clockwise = index % 2 === 0 ? 1 : -1;
        item.vx += -ny / nLength * strength * .38 * clockwise;
        item.vy += nx / nLength * strength * .38 * clockwise;
        state.avoidanceActivationCount += 1;
        item.avoided = true;
        avoidingFish.add(item.id);
      }

      const speed = Math.hypot(item.vx, item.vy) || 1;
      const limitedSpeed = clamp(speed, .55, 1.75);
      item.vx = item.vx / speed * limitedSpeed;
      item.vy = item.vy / speed * limitedSpeed;
      item.x += item.vx * stepScale;
      item.y += item.vy * stepScale;

      const inset = 8;
      if (item.x < inset || item.x > sketch.width - inset) {
        item.x = clamp(item.x, inset, sketch.width - inset);
        item.vx *= -.72;
      }
      if (item.y < inset || item.y > sketch.height - inset) {
        item.y = clamp(item.y, inset, sketch.height - inset);
        item.vy *= -.72;
      }
      keepOutsideObstacle(item);
      if (normalizedObstacleDistance(item.x, item.y) < .999) state.obstacleIntrusionCount += 1;
    });
    state.simulationStepCount += 1;
    state.uniqueAvoidingFishCount = avoidingFish.size;
  }

  function settleTo(progress) {
    const target = clamp(progress, 0, 1);
    const delta = Math.max(0, target - previousSettleProgress);
    const steps = Math.ceil(delta * 90);
    if (steps > 0) {
      const scale = delta * 90 / steps;
      for (let index = 0; index < steps; index += 1) simulateStep(scale);
      previousSettleProgress = target;
    }
    state.settleProgress = target;
    if (target >= 1 && state.phase === 'settling') {
      state.phase = 'held';
      state.finalStableSignature = fish.map(item => `${item.id}:${round(item.x)}:${round(item.y)}`).join('|');
      state.stableSignatureSampleCount += 1;
      state.finalResultValidated = fish.length >= 8
        && state.uniqueAvoidingFishCount >= 1
        && state.avoidanceActivationCount > 0
        && state.obstacleIntrusionCount === 0
        && fish.every(item => normalizedObstacleDistance(item.x, item.y) >= .999);
      syncInterface();
    }
  }

  sketch = new p5(p => {
    const palette = [
      [124, 240, 201],
      [255, 128, 95],
      [249, 199, 111],
      [129, 201, 232],
    ];

    p.setup = () => {
      p.pixelDensity(1);
      const renderer = p.createCanvas(
        Math.max(1, Math.round(stage.clientWidth)),
        Math.max(1, Math.round(stage.clientHeight)),
      );
      renderer.parent(container);
      renderer.elt.setAttribute('aria-hidden', 'true');
      p.noLoop();
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
    };

    p.draw = () => {
      state.drawCount += 1;
      p.clear();

      p.noFill();
      p.stroke(124, 240, 201, 27);
      p.strokeWeight(.8);
      p.ellipse(obstacle.cx, obstacle.cy, obstacle.rx * 2, obstacle.ry * 2);
      p.stroke(124, 240, 201, 13);
      p.ellipse(obstacle.cx, obstacle.cy, obstacle.rx * 2.24, obstacle.ry * 2.24);

      if (state.dragActive && lastPointer) {
        p.noStroke();
        p.fill(255, 128, 95, 40);
        p.circle(lastPointer.x, lastPointer.y, 22);
        p.fill(255, 128, 95, 230);
        p.circle(lastPointer.x, lastPointer.y, 5);
      }

      fish.forEach(item => {
        const colors = palette[item.hue];
        const angle = Math.atan2(item.vy, item.vx);
        const bodyLength = 11 * item.size;
        const bodyHeight = 6.6 * item.size;
        p.push();
        p.translate(item.x, item.y);
        p.rotate(angle);
        p.noStroke();
        p.fill(colors[0], colors[1], colors[2], 218);
        p.ellipse(0, 0, bodyLength, bodyHeight);
        p.fill(colors[0], colors[1], colors[2], 152);
        p.triangle(-bodyLength * .38, 0, -bodyLength * .85, -bodyHeight * .58, -bodyLength * .85, bodyHeight * .58);
        p.fill(234, 255, 249, 235);
        p.circle(bodyLength * .28, -bodyHeight * .12, Math.max(1.1, 1.6 * item.size));
        p.fill(5, 33, 38, 235);
        p.circle(bodyLength * .32, -bodyHeight * .12, Math.max(.65, .8 * item.size));
        p.pop();
      });

      if (state.drawCount === 1) resolveFirstDraw();
    };
  }, container);

  container.addEventListener('pointerdown', beginDrag);
  container.addEventListener('pointermove', continueDrag);
  container.addEventListener('pointerup', event => finishDrag(event));
  container.addEventListener('pointercancel', event => finishDrag(event, true));

  async function initialize() {
    await firstDrawReady;
    await document.fonts.ready;
    measureObstacle();
    validateGeometry();
    sketch.redraw();
    await nextFrames(2);
    const firstSignature = `${fish.length}:${state.spawnCount}:${state.simulationStepCount}:${state.phase}`;
    await nextFrames(2);
    const secondSignature = `${fish.length}:${state.spawnCount}:${state.simulationStepCount}:${state.phase}`;
    state.initialStillVerified = firstSignature === secondSignature
      && fish.length === 0
      && state.inputCount === 0
      && state.simulationStepCount === 0
      && state.phase === 'waiting';
    invariant(state.initialStillVerified, 'initial frame changed before trusted human input');
    invariant(state.obstacleBoundsValidated, 'live DOM obstacle bounds are invalid');
    invariant(state.canvasSizeValidated && state.stageCoverageValidated, 'canvas does not cover the full preview stage');
    state.ready = true;
    syncInterface();
  }

  const ready = initialize();

  window.addEventListener('resize', () => {
    state.resizeCount += 1;
    sketch.resizeCanvas(Math.max(1, Math.round(stage.clientWidth)), Math.max(1, Math.round(stage.clientHeight)));
    measureObstacle();
    validateGeometry();
    sketch.redraw();
  });

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.phase === 'settling') {
      state.reducedMotionDirectCount += 1;
      settleTo(1);
      sketch.redraw();
    }
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const heldSignature = fish.map(item => `${item.id}:${round(item.x)}:${round(item.y)}`).join('|');
    if (state.phase === 'held' && state.finalStableSignature === heldSignature) state.stableSignatureSampleCount += 1;
    const fishOutsideObstacle = fish.every(item => normalizedObstacleDistance(item.x, item.y) >= .999);
    const staticBeforeInput = state.trustedInputCount > 0 || (
      state.phase === 'waiting'
      && state.fishCount === 0
      && state.spawnCount === 0
      && state.simulationStepCount === 0
    );
    return Boolean(
      sketch instanceof p5
      && container.querySelector('canvas')?.getContext('2d')
      && state.ready
      && state.initialStillVerified
      && staticBeforeInput
      && state.strictTrustedInputGuard
      && !state.automaticPlayback
      && !state.automaticCycle
      && !state.automaticLoop
      && !state.syntheticInputDispatch
      && state.obstacleBoundsSource === 'getBoundingClientRect'
      && state.measuredObstacleSampleCount >= 1
      && state.obstacleBoundsValidated
      && state.canvasSizeValidated
      && state.stageCoverageValidated
      && state.spawnCount === fish.length
      && state.fishCount === fish.length
      && state.obstacleIntrusionCount === 0
      && fishOutsideObstacle
      && (state.phase !== 'held' || (
        state.settleProgress === 1
        && state.finalResultValidated
        && state.finalStableSignature === heldSignature
      ))
    );
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    ready,
    render: (time, manual) => {
      state.renderCount += 1;
      state.latestPreviewTime = Number(time) || 0;
      if (state.phase === 'settling') {
        if (state.reducedMotion) {
          state.reducedMotionDirectCount += 1;
          settleTo(1);
        } else {
          settleTo((state.latestPreviewTime - state.settleStartTime) / SETTLE_DURATION);
        }
        sketch.redraw();
      } else if (manual && state.phase === 'held') {
        sketch.redraw();
      }
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
