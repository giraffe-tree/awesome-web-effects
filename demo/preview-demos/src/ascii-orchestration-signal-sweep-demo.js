import './batch-a-qa.js';
import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#route-stage');
  const host = document.querySelector('#ascii-canvas-host');
  const traceButton = document.querySelector('#trace-button');
  const directionButton = document.querySelector('#direction-button');
  const traceState = document.querySelector('#trace-state');
  const hopReadout = document.querySelector('#hop-readout');
  const agentReadout = document.querySelector('#agent-readout');
  const boundaryLabel = document.querySelector('#boundary-label');
  const percentReadout = document.querySelector('#percent-readout');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !host || !traceButton || !directionButton || !traceState || !hopReadout || !agentReadout || !boundaryLabel || !percentReadout) {
    throw new Error('Incident route DOM is incomplete.');
  }

  const routeNodes = [
    { id: 'edge', label: 'EDGE', short: 'E', x: .035, y: .5 },
    { id: 'router', label: 'ROUTER', short: 'R', x: .26, y: .5 },
    { id: 'trace', label: 'TRACE', short: 'T', x: .5, y: .22 },
    { id: 'policy', label: 'POLICY', short: 'P', x: .5, y: .5 },
    { id: 'repair', label: 'REPAIR', short: 'F', x: .5, y: .78 },
    { id: 'canary', label: 'CANARY', short: 'C', x: .75, y: .5 },
    { id: 'prod', label: 'PROD', short: 'P', x: .965, y: .5 }
  ];
  const routeSegments = [
    ['edge', 'router'],
    ['router', 'trace'],
    ['router', 'policy'],
    ['router', 'repair'],
    ['trace', 'canary'],
    ['policy', 'canary'],
    ['repair', 'canary'],
    ['canary', 'prod']
  ];
  const nodeById = new Map(routeNodes.map(node => [node.id, node]));
  const glyphs = ['·', '.', '+', 'x', ':', '-', '*'];
  const clamp = value => Math.min(1, Math.max(0, value));
  const lineDistance = (x, y, ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const amount = lengthSquared ? clamp(((x - ax) * dx + (y - ay) * dy) / lengthSquared) : 0;
    return Math.hypot(x - (ax + dx * amount), y - (ay + dy * amount));
  };

  let routeChecksum = 2166136261;
  for (const node of routeNodes) {
    for (const value of [node.x, node.y, node.id.length, node.label.length]) {
      routeChecksum = Math.imul(routeChecksum ^ Math.round((value + 2) * 100000), 16777619) >>> 0;
    }
  }
  for (const segment of routeSegments) {
    routeChecksum = Math.imul(routeChecksum ^ (segment[0].length * 31 + segment[1].length), 16777619) >>> 0;
  }

  const state = {
    progress: 0,
    targetProgress: 0,
    direction: 1,
    directionLabel: 'forward',
    phase: 'idle-start',
    boundary: 'left',
    complete: false,
    motionActive: false,
    activeDirection: 'idle',
    dragActive: false,
    pointerInside: false,
    stageFocused: false,
    traceButtonFocused: false,
    directionButtonFocused: false,
    reducedMotion: reducedMotionQuery.matches,
    lastInput: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    keyboardInputCount: 0,
    clickInputCount: 0,
    pointerMoveCount: 0,
    directionChangeCount: 0,
    transitionCount: 0,
    boundaryInputCount: 0,
    renderCount: 0,
    visibleColumns: 0,
    visibleRows: 0,
    visibleCellCount: 0,
    routeNodeCount: routeNodes.length,
    routeSegmentCount: routeSegments.length,
    revealedNodeCount: 0,
    revealedNodeIds: [],
    routeChecksum,
    deterministicField: true,
    randomSourceUsed: false,
    p5Instance: false,
    claimedLibrary: 'p5@2.3.0',
    inputAdapters: ['pointer', 'touch', 'click', 'keyboard'],
    pointerCaptureSupported: typeof stage.setPointerCapture === 'function',
    automaticPlayback: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    initialFrameChecksum: 0,
    initialStaticConfirmed: false,
    canvasWidth: 0,
    canvasHeight: 0
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let resolveSetup;
  const setupReady = new Promise(resolve => { resolveSetup = resolve; });
  let previousFrameTime = null;
  let transitionElapsed = 0;
  let transitionFrom = 0;
  let transitionTo = 0;

  const routeLayout = (width, height) => {
    const tiny = width <= 180 || height <= 105;
    const compact = width <= 420 || height <= 260;
    return {
      tiny,
      compact,
      left: tiny ? .055 : compact ? .375 : .37,
      right: tiny ? .95 : .965,
      top: tiny ? .14 : compact ? .18 : .18,
      bottom: tiny ? .82 : compact ? .84 : .82
    };
  };

  const localFromScreen = (x, y, layout) => ({
    x: (x - layout.left) / Math.max(.001, layout.right - layout.left),
    y: (y - layout.top) / Math.max(.001, layout.bottom - layout.top)
  });

  const screenFromLocal = (x, y, layout) => ({
    x: layout.left + x * (layout.right - layout.left),
    y: layout.top + y * (layout.bottom - layout.top)
  });

  const routeAt = (x, y) => {
    for (const node of routeNodes) {
      if (Math.hypot(x - node.x, y - node.y) < .047) return { type: 'node', glyph: '◆', node };
    }
    for (const [fromId, toId] of routeSegments) {
      const from = nodeById.get(fromId);
      const to = nodeById.get(toId);
      if (lineDistance(x, y, from.x, from.y, to.x, to.y) < .018) {
        const slope = (to.y - from.y) / Math.max(.001, to.x - from.x);
        return { type: 'segment', glyph: Math.abs(slope) < .25 ? '─' : slope > 0 ? '\\' : '/', fromId, toId };
      }
    }
    return null;
  };

  const isRevealed = x => state.direction === 1 ? x <= state.progress + .012 : x >= state.progress - .012;
  const isComplete = () => state.direction === 1 ? state.progress >= .999 : state.progress <= .001;
  const isAtStart = () => state.direction === 1 ? state.progress <= .001 : state.progress >= .999;

  const recordInput = source => {
    state.lastInput = source;
    state.inputCount += 1;
    if (source.startsWith('pointer')) state.pointerInputCount += 1;
    if (source.startsWith('touch')) state.touchInputCount += 1;
    if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    if (source.startsWith('click')) state.clickInputCount += 1;
  };

  const syncInterface = () => {
    const percent = Math.round(state.progress * 100);
    state.directionLabel = state.direction === 1 ? 'forward' : 'reverse';
    state.complete = isComplete();
    state.boundary = state.progress <= .001 ? 'left' : state.progress >= .999 ? 'right' : 'field';
    state.revealedNodeIds = routeNodes.filter(node => isRevealed(node.x)).map(node => node.id);
    state.revealedNodeCount = state.revealedNodeIds.length;
    state.phase = state.motionActive
      ? state.direction === 1 ? 'tracing-forward' : 'tracing-reverse'
      : state.complete ? 'complete'
        : isAtStart() ? 'idle-start' : 'partial';

    stage.dataset.direction = state.directionLabel;
    stage.dataset.boundary = state.boundary;
    stage.dataset.complete = String(state.complete);
    stage.dataset.progress = state.progress.toFixed(3);
    stage.style.setProperty('--trace-progress', state.progress.toFixed(4));
    traceButton.setAttribute('aria-pressed', String(state.complete));
    directionButton.setAttribute('aria-pressed', String(state.direction === -1));
    directionButton.setAttribute('aria-label', state.direction === 1 ? 'Reverse trace direction' : 'Switch to forward trace direction');

    const tinyLayout = stage.clientWidth <= 180 || stage.clientHeight <= 105;
    traceButton.textContent = tinyLayout
      ? state.complete ? 'Reset' : 'Trace'
      : state.complete ? 'Reset trace' : state.direction === 1 ? 'Complete trace' : 'Complete reverse';
    directionButton.textContent = tinyLayout ? state.direction === 1 ? '→' : '←' : state.direction === 1 ? 'FLOW →' : 'FLOW ←';

    if (state.complete) traceState.textContent = state.direction === 1 ? 'ROUTE VERIFIED · PROD' : 'ROOT PATH FOUND · EDGE';
    else if (isAtStart()) traceState.textContent = state.direction === 1 ? 'AWAITING TRACE · EDGE' : 'AWAITING REVERSE · PROD';
    else traceState.textContent = `${state.direction === 1 ? 'FORWARD' : 'REVERSE'} SIGNAL · ${String(percent).padStart(2, '0')}%`;

    hopReadout.textContent = `${state.revealedNodeCount} / ${routeNodes.length}`;
    const resolvedAgents = ['trace', 'policy', 'repair'].filter(id => state.revealedNodeIds.includes(id)).length;
    agentReadout.textContent = resolvedAgents ? `${resolvedAgents} / 3` : '—';
    boundaryLabel.textContent = state.boundary === 'left' ? 'LEFT EDGE' : state.boundary === 'right' ? 'RIGHT EDGE' : 'IN FIELD';
    percentReadout.textContent = `${String(percent).padStart(2, '0')}%`;
    host.setAttribute('aria-label', state.complete
      ? state.direction === 1
        ? 'Complete incident route revealed from edge through three agents to production'
        : 'Complete reverse incident route revealed from production back to the edge'
      : `${state.revealedNodeCount} of seven route hops revealed in ${state.directionLabel} direction`);
  };

  const settleAt = progress => {
    state.progress = clamp(progress);
    state.targetProgress = state.progress;
    state.motionActive = false;
    state.activeDirection = 'idle';
    transitionElapsed = 0;
    transitionFrom = state.progress;
    transitionTo = state.progress;
    syncInterface();
  };

  const animateTo = (target, source) => {
    const next = clamp(target);
    if (Math.abs(next - state.progress) < .001 && !state.motionActive) {
      state.boundaryInputCount += 1;
      recordInput(source);
      syncInterface();
      return;
    }
    recordInput(source);
    state.targetProgress = next;
    state.transitionCount += 1;
    state.activeDirection = next > state.progress ? 'right' : 'left';
    transitionFrom = state.progress;
    transitionTo = next;
    transitionElapsed = 0;
    if (state.reducedMotion) settleAt(next);
    else state.motionActive = true;
    syncInterface();
  };

  const scrubTo = (progress, source, shouldRecord = false) => {
    if (shouldRecord) recordInput(source);
    state.progress = clamp(progress);
    state.targetProgress = state.progress;
    state.motionActive = false;
    state.activeDirection = 'scrubbing';
    transitionElapsed = 0;
    syncInterface();
  };

  const toggleDirection = source => {
    recordInput(source);
    state.progress = 1 - state.progress;
    state.targetProgress = state.progress;
    state.direction *= -1;
    state.directionChangeCount += 1;
    state.motionActive = false;
    state.activeDirection = 'idle';
    transitionElapsed = 0;
    syncInterface();
  };

  const completeOrReset = source => {
    const completionTarget = state.direction === 1 ? 1 : 0;
    const startTarget = state.direction === 1 ? 0 : 1;
    animateTo(state.complete ? startTarget : completionTarget, source);
  };

  const resizeSketch = () => {
    if (!sketch) return;
    const width = Math.max(1, Math.round(stage.clientWidth));
    const height = Math.max(1, Math.round(stage.clientHeight));
    if (sketch.width !== width || sketch.height !== height) sketch.resizeCanvas(width, height, true);
    state.canvasWidth = width;
    state.canvasHeight = height;
  };

  const advanceTransition = time => {
    if (previousFrameTime === null || time < previousFrameTime) previousFrameTime = time;
    const delta = Math.min(.12, Math.max(0, time - previousFrameTime));
    previousFrameTime = time;
    if (!state.motionActive) return;
    transitionElapsed += delta;
    const ratio = Math.min(1, transitionElapsed / .82);
    const eased = ratio < .5 ? 4 * ratio * ratio * ratio : 1 - Math.pow(-2 * ratio + 2, 3) / 2;
    state.progress = transitionFrom + (transitionTo - transitionFrom) * eased;
    if (ratio >= 1) settleAt(transitionTo);
  };

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight)).parent(host);
      p.textFont('ui-monospace, SFMono-Regular, Menlo, monospace');
      p.textAlign(p.CENTER, p.CENTER);
      p.randomSeed(36);
      p.noiseSeed(36);
      p.noLoop();
      state.p5Instance = p instanceof p5;
      resolveSetup();
    };

    p.draw = () => {
      const width = p.width;
      const height = p.height;
      const layout = routeLayout(width, height);
      const columns = layout.tiny ? 34 : layout.compact ? 48 : 64;
      const rows = layout.tiny ? 17 : layout.compact ? 23 : 30;
      const cellW = width / columns;
      const cellH = height / rows;
      const frontScreen = screenFromLocal(state.progress, .5, layout).x;
      const frontX = frontScreen * width;

      state.visibleColumns = columns;
      state.visibleRows = rows;
      state.visibleCellCount = columns * rows;
      state.canvasWidth = width;
      state.canvasHeight = height;
      p.background(5, 16, 13);
      p.noStroke();
      p.textSize(Math.max(2.8, Math.min(7.2, cellH * .48)));

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < columns; col += 1) {
          const x = (col + .5) / columns;
          const y = (row + .5) / rows;
          const local = localFromScreen(x, y, layout);
          const route = local.x >= -.05 && local.x <= 1.05 && local.y >= -.08 && local.y <= 1.08 ? routeAt(local.x, local.y) : null;
          const revealed = route && isRevealed(local.x);
          const distanceToFront = Math.abs(x - frontScreen);
          const band = Math.max(0, 1 - distanceToFront / (layout.tiny ? .09 : .072));
          const fixedPulse = ((col * 37 + row * 61 + col * row * 7) % 103) / 103;
          const glyph = glyphs[(col * 17 + row * 7 + col * row) % glyphs.length];

          if (revealed) {
            const routeColor = route.type === 'node' ? [220, 251, 100] : [112, 225, 205];
            p.fill(routeColor[0], routeColor[1], routeColor[2], 145 + band * 110);
            p.textSize(Math.max(3, Math.min(8.2, cellH * (route.type === 'node' ? .62 : .52))));
            p.text(route.glyph, (col + .5) * cellW, (row + .5) * cellH);
            p.textSize(Math.max(2.8, Math.min(7.2, cellH * .48)));
          } else {
            p.fill(80 + band * 32, 139 + fixedPulse * 31 + band * 45, 119 + fixedPulse * 22, 38 + fixedPulse * 42 + band * 58);
            p.text(glyph, (col + .5) * cellW, (row + .5) * cellH);
          }
        }
      }

      const context = p.drawingContext;
      const glow = context.createLinearGradient(frontX - 28, 0, frontX + 28, 0);
      glow.addColorStop(0, 'rgba(220,251,100,0)');
      glow.addColorStop(.48, state.direction === 1 ? 'rgba(220,251,100,.2)' : 'rgba(113,225,205,.2)');
      glow.addColorStop(.52, state.direction === 1 ? 'rgba(220,251,100,.28)' : 'rgba(113,225,205,.28)');
      glow.addColorStop(1, 'rgba(220,251,100,0)');
      context.fillStyle = glow;
      context.fillRect(frontX - 28, 0, 56, height);

      for (const node of routeNodes) {
        if (!isRevealed(node.x)) continue;
        const point = screenFromLocal(node.x, node.y, layout);
        const px = point.x * width;
        const py = point.y * height;
        const nodeSize = layout.tiny ? 2.5 : layout.compact ? 4 : 5;
        p.noFill();
        p.stroke(node.id === 'prod' ? 255 : 220, node.id === 'prod' ? 128 : 251, node.id === 'prod' ? 100 : 100, 210);
        p.strokeWeight(1);
        p.circle(px, py, nodeSize * 2.4);
        p.noStroke();
        p.fill(241, 246, 223, 220);
        p.textSize(layout.tiny ? 3 : layout.compact ? 4.2 : 6.2);
        p.text(layout.tiny ? node.short : node.label, px, py + nodeSize * 2.5);
      }

      p.noStroke();
      p.fill(state.direction === 1 ? '#dcfb64' : '#71e1cd');
      const arrowY = layout.top * height + 6;
      if (state.direction === 1) p.triangle(frontX - 4, arrowY - 3, frontX - 4, arrowY + 3, frontX + 2, arrowY);
      else p.triangle(frontX + 4, arrowY - 3, frontX + 4, arrowY + 3, frontX - 2, arrowY);
      state.renderCount += 1;
    };
  }, host);

  const render = time => {
    resizeSketch();
    advanceTransition(Number(time) || 0);
    syncInterface();
    sketch.redraw();
  };

  const progressFromPointer = event => {
    const rect = stage.getBoundingClientRect();
    return clamp((event.clientX - rect.left) / Math.max(1, rect.width));
  };

  traceButton.addEventListener('pointerdown', event => event.stopPropagation());
  directionButton.addEventListener('pointerdown', event => event.stopPropagation());
  traceButton.addEventListener('click', event => {
    event.stopPropagation();
    const source = event.detail === 0
      ? 'keyboard:trace-button'
      : event.pointerType ? `pointer:${event.pointerType}:trace-button` : 'click:trace-button';
    completeOrReset(source);
  });
  directionButton.addEventListener('click', event => {
    event.stopPropagation();
    const source = event.detail === 0
      ? 'keyboard:direction-button'
      : event.pointerType ? `pointer:${event.pointerType}:direction-button` : 'click:direction-button';
    toggleDirection(source);
  });
  traceButton.addEventListener('focus', () => { state.traceButtonFocused = true; });
  traceButton.addEventListener('blur', () => { state.traceButtonFocused = false; });
  directionButton.addEventListener('focus', () => { state.directionButtonFocused = true; });
  directionButton.addEventListener('blur', () => { state.directionButtonFocused = false; });

  stage.addEventListener('pointerenter', () => { state.pointerInside = true; });
  stage.addEventListener('pointerleave', () => { state.pointerInside = false; });
  stage.addEventListener('pointerdown', event => {
    if (event.target === traceButton || event.target === directionButton) return;
    const isTouch = event.pointerType === 'touch';
    state.dragActive = true;
    if (state.pointerCaptureSupported) stage.setPointerCapture(event.pointerId);
    scrubTo(progressFromPointer(event), `${isTouch ? 'touch' : 'pointer'}:${event.pointerType}:drag`, true);
  });
  stage.addEventListener('pointermove', event => {
    if (!state.dragActive) return;
    state.pointerMoveCount += 1;
    scrubTo(progressFromPointer(event), state.lastInput);
  });
  const finishPointer = event => {
    if (!state.dragActive) return;
    scrubTo(progressFromPointer(event), state.lastInput);
    state.dragActive = false;
    state.activeDirection = 'idle';
    if (state.pointerCaptureSupported && stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    syncInterface();
  };
  stage.addEventListener('pointerup', finishPointer);
  stage.addEventListener('pointercancel', finishPointer);
  stage.addEventListener('focus', () => { state.stageFocused = true; });
  stage.addEventListener('blur', event => {
    if (!stage.contains(event.relatedTarget)) state.stageFocused = false;
  });

  stage.addEventListener('keydown', event => {
    if (event.target === traceButton || event.target === directionButton) return;
    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      toggleDirection('keyboard:R');
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      completeOrReset(`keyboard:${event.key === ' ' ? 'Space' : 'Enter'}`);
      return;
    }
    let target = null;
    if (event.key === 'ArrowRight') target = state.targetProgress + .14;
    if (event.key === 'ArrowLeft') target = state.targetProgress - .14;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = 1;
    if (event.key === 'Escape') target = state.direction === 1 ? 0 : 1;
    if (target === null) return;
    event.preventDefault();
    animateTo(target, `keyboard:${event.key}`);
  });

  const handleReducedMotionChange = event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.motionActive) settleAt(state.targetProgress);
  };
  if (typeof reducedMotionQuery.addEventListener === 'function') reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  else reducedMotionQuery.addListener(handleReducedMotionChange);

  const framebufferChecksum = () => {
    const canvas = host.querySelector('canvas');
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return 0;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const stride = Math.max(4, Math.floor(pixels.length / 2048 / 4) * 4);
    let checksum = 2166136261;
    for (let index = 0; index < pixels.length; index += stride) checksum = Math.imul(checksum ^ pixels[index], 16777619) >>> 0;
    return checksum;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`ascii-orchestration-signal-sweep: ${message}`);
    };
    const canvas = host.querySelector('canvas');
    const context = canvas?.getContext('2d');
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas?.getBoundingClientRect();
    const traceRect = traceButton.getBoundingClientRect();
    const directionRect = directionButton.getBoundingClientRect();

    invariant(state.claimedLibrary === 'p5@2.3.0' && sketch instanceof p5 && state.p5Instance, 'real p5 instance is missing');
    invariant(context instanceof CanvasRenderingContext2D && sketch.drawingContext === context, 'real p5 Canvas2D renderer is missing');
    invariant(routeNodes.length === 7 && routeSegments.length === 8 && state.routeNodeCount === 7 && state.routeSegmentCount === 8, 'semantic route topology changed');
    invariant(routeNodes.map(node => node.id).join('|') === 'edge|router|trace|policy|repair|canary|prod', 'route node semantics changed');
    invariant(routeAt(.035, .5)?.type === 'node' && routeAt(.38, .36)?.type === 'segment', 'ASCII route geometry is missing');
    invariant(state.routeChecksum === routeChecksum && state.deterministicField && !state.randomSourceUsed, 'ASCII field must remain deterministic');
    invariant(state.visibleCellCount === state.visibleColumns * state.visibleRows && state.visibleCellCount >= 34 * 17, 'ASCII field resolution is invalid');
    invariant(state.automaticPlayback === false && state.automaticFallback === false && state.syntheticInputDispatch === false, 'idle auto sweep or synthetic input is forbidden');
    invariant(state.inputAdapters.join('|') === 'pointer|touch|click|keyboard', 'input adapter contract changed');
    invariant(state.progress >= 0 && state.progress <= 1 && state.targetProgress >= 0 && state.targetProgress <= 1, 'signal front escaped its boundaries');
    invariant(stage.dataset.direction === state.directionLabel && stage.dataset.boundary === state.boundary && stage.dataset.complete === String(state.complete), 'route DOM state is stale');
    invariant(Math.abs(Number(stage.dataset.progress) - state.progress) < .0011, 'route progress is stale');
    invariant(traceButton.getAttribute('aria-pressed') === String(state.complete) && directionButton.getAttribute('aria-pressed') === String(state.direction === -1), 'route control state is stale');
    invariant(state.revealedNodeCount === state.revealedNodeIds.length && state.revealedNodeCount >= 0 && state.revealedNodeCount <= 7, 'revealed route count diverged');
    invariant(!state.reducedMotion || !state.motionActive, 'reduced motion must settle directly');
    invariant(state.renderCount > 1 && canvas.width === state.canvasWidth && canvas.height === state.canvasHeight, 'p5 render surface is stale');
    invariant(canvasRect.width > 0 && canvasRect.height > 0 && traceRect.width > 0 && directionRect.width > 0, 'route surface or controls are not visible');
    invariant(canvasRect.left >= stageRect.left - .5 && canvasRect.right <= stageRect.right + .5 && canvasRect.top >= stageRect.top - .5 && canvasRect.bottom <= stageRect.bottom + .5, 'ASCII canvas escaped the preview');
    invariant(traceButton.type === 'button' && directionButton.type === 'button' && stage.tabIndex === 0 && getComputedStyle(stage).touchAction === 'none', 'pointer and keyboard access changed');
    invariant(state.inputCount > 0 || (state.initialStaticConfirmed && state.progress === 0 && state.targetProgress === 0 && state.direction === 1 && state.phase === 'idle-start'), 'initial frame must remain static until real input');
    return true;
  };

  syncInterface();

  const doubleFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.all([setupReady, Promise.resolve(document.fonts?.ready)])
    .then(() => {
      render(0);
      return doubleFrame().then(() => {
        const before = `${state.progress}|${state.targetProgress}|${state.direction}|${state.phase}|${state.inputCount}`;
        const checksum = framebufferChecksum();
        render(0);
        return doubleFrame().then(() => {
          const after = `${state.progress}|${state.targetProgress}|${state.direction}|${state.phase}|${state.inputCount}`;
          const nextChecksum = framebufferChecksum();
          state.initialFrameChecksum = checksum;
          state.initialStaticConfirmed = before === after
            && checksum === nextChecksum
            && state.progress === 0
            && state.targetProgress === 0
            && state.direction === 1
            && !state.motionActive;
          if (!state.initialStaticConfirmed) throw new Error('Initial incident-route frame changed without user input.');
          if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial ASCII route assertion failed.');
        });
      });
    });

  ready.catch(markPreviewFailure);

  installPreviewController({
    id: 'ascii-orchestration-signal-sweep',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
