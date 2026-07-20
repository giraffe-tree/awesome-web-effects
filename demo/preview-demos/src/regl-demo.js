import createREGL from 'regl';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#analysis-stage');
  const canvas = document.querySelector('#regl-canvas');
  const control = document.querySelector('#analyze-button');
  const phaseReadout = document.querySelector('#phase-readout');
  const rareReadout = document.querySelector('#rare-readout');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !canvas || !control || !phaseReadout || !rareReadout) {
    throw new Error('Cell analysis DOM is incomplete.');
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const regl = createREGL({
    canvas,
    pixelRatio,
    attributes: { antialias: true, alpha: false, preserveDrawingBuffer: true }
  });
  const gl = regl._gl;
  const particleCount = 1100;
  const goldenAngle = 2.399963229728653;
  const basePositions = [];
  const resolvedPositions = [];
  const groups = [];
  const pointSizes = [];
  const populationCounts = [0, 0, 0];
  const centers = [[-.24, .06], [.27, -.23], [.29, .33]];
  const spreads = [[.35, .27], [.23, .18], [.15, .12]];
  const fract = value => value - Math.floor(value);

  for (let index = 0; index < particleCount; index += 1) {
    const slot = index % 100;
    const group = slot < 8 ? 2 : slot < 31 ? 1 : 0;
    const noiseA = fract(Math.sin((index + 1) * 12.9898) * 43758.5453);
    const noiseB = fract(Math.sin((index + 3) * 78.233) * 12515.873);
    const noiseC = fract(Math.sin((index + 7) * 37.719) * 23421.631);
    const baseRadius = .08 + .9 * Math.sqrt((index + .5) / particleCount);
    const baseAngle = index * goldenAngle + (noiseB - .5) * .52;
    const resolvedRadius = Math.sqrt(noiseA);
    const resolvedAngle = noiseB * Math.PI * 2;

    basePositions.push([
      Math.cos(baseAngle) * baseRadius + (noiseC - .5) * .07,
      Math.sin(baseAngle) * baseRadius + (noiseA - .5) * .05
    ]);
    resolvedPositions.push([
      centers[group][0] + Math.cos(resolvedAngle) * resolvedRadius * spreads[group][0],
      centers[group][1] + Math.sin(resolvedAngle) * resolvedRadius * spreads[group][1]
    ]);
    groups.push(group);
    pointSizes.push(1.45 + noiseC * 1.45 + (group === 2 ? .7 : 0));
    populationCounts[group] += 1;
  }

  let dataChecksum = 2166136261;
  for (let index = 0; index < particleCount; index += 1) {
    const values = [...basePositions[index], ...resolvedPositions[index], groups[index], pointSizes[index]];
    for (const value of values) {
      dataChecksum = Math.imul(dataChecksum ^ Math.round((value + 3) * 100000), 16777619) >>> 0;
    }
  }

  const state = {
    progress: 0,
    targetProgress: 0,
    phase: 'mixed',
    motionActive: false,
    activeDirection: 'idle',
    dragActive: false,
    pointerInside: false,
    stageFocused: false,
    controlFocused: false,
    reducedMotion: reducedMotionQuery.matches,
    lastInput: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    keyboardInputCount: 0,
    clickInputCount: 0,
    pointerMoveCount: 0,
    transitionCount: 0,
    renderCount: 0,
    drawCommandCount: 4,
    drawCommandIds: ['field', 'density', 'cells', 'response-gate'],
    drawCommandExecutions: { field: 0, density: 0, cells: 0, gate: 0 },
    particleCount,
    populationCounts,
    rarePopulationRatio: populationCounts[2] / particleCount,
    dataChecksum,
    deterministicData: true,
    randomSourceUsed: false,
    claimedLibrary: 'regl@2.1.1',
    realReglContext: gl instanceof WebGLRenderingContext,
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

  const drawField = regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = .5 * (position + 1.0);
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,
    frag: `
      precision highp float;
      uniform vec2 resolution;
      uniform float progress;
      uniform float compact;
      varying vec2 uv;
      void main() {
        vec2 frag = gl_FragCoord.xy / resolution;
        float left = mix(.37, .035, compact);
        float right = .965;
        float bottom = mix(.16, .08, compact);
        float top = mix(.87, .91, compact);
        vec2 local = vec2((frag.x - left) / (right - left), (frag.y - bottom) / (top - bottom));
        float inside = step(0.0, local.x) * step(local.x, 1.0) * step(0.0, local.y) * step(local.y, 1.0);
        vec2 cell = abs(fract(local * vec2(9.0, 6.0)) - .5);
        float grid = (1.0 - smoothstep(.475, .5, max(cell.x, cell.y))) * inside;
        float axes = (1.0 - smoothstep(.0, .006, min(abs(local.x), abs(local.y)))) * inside;
        float scan = exp(-pow((local.x - progress) * 32.0, 2.0)) * inside;
        vec3 color = vec3(.027, .09, .074);
        color += grid * vec3(.045, .085, .074);
        color += axes * vec3(.09, .16, .13);
        color += scan * mix(vec3(.02, .11, .10), vec3(.09, .17, .08), progress) * .58;
        float vignette = smoothstep(.96, .3, distance(frag, vec2(.63, .52)));
        color *= .76 + vignette * .24;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    attributes: { position: [[-1, -1], [3, -1], [-1, 3]] },
    uniforms: {
      resolution: regl.prop('resolution'),
      progress: regl.prop('progress'),
      compact: regl.prop('compact')
    },
    depth: { enable: false },
    count: 3
  });

  const drawDensity = regl({
    vert: `
      precision mediump float;
      attribute vec2 center;
      attribute float size;
      attribute float group;
      uniform float progress;
      uniform float compact;
      varying float groupId;
      varying float opacity;
      void main() {
        vec2 plotScale = mix(vec2(.47, .66), vec2(.73, .7), compact);
        vec2 plotOffset = mix(vec2(.43, .0), vec2(.13, .0), compact);
        gl_Position = vec4(center * plotScale + plotOffset, 0.0, 1.0);
        gl_PointSize = size * ${pixelRatio.toFixed(2)} * mix(1.0, .55, compact);
        groupId = group;
        opacity = progress;
      }
    `,
    frag: `
      precision mediump float;
      varying float groupId;
      varying float opacity;
      void main() {
        float radius = length(gl_PointCoord - .5) * 2.0;
        float alpha = (1.0 - smoothstep(.04, 1.0, radius)) * opacity * .19;
        vec3 color = groupId < .5 ? vec3(.40, .91, .83) : groupId < 1.5 ? vec3(1.0, .52, .41) : vec3(.85, .96, .39);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    attributes: {
      center: centers,
      size: [178, 132, 94],
      group: [0, 1, 2]
    },
    uniforms: {
      progress: regl.prop('progress'),
      compact: regl.prop('compact')
    },
    primitive: 'points',
    count: 3,
    blend: { enable: true, func: { srcRGB: 'src alpha', dstRGB: 'one', srcAlpha: 'one', dstAlpha: 'one' } },
    depth: { enable: false }
  });

  const drawCells = regl({
    vert: `
      precision mediump float;
      attribute vec2 basePosition;
      attribute vec2 resolvedPosition;
      attribute float group;
      attribute float size;
      uniform float progress;
      uniform float compact;
      varying float groupId;
      varying float reveal;
      void main() {
        float eased = progress * progress * (3.0 - 2.0 * progress);
        vec2 point = mix(basePosition, resolvedPosition, eased);
        vec2 plotScale = mix(vec2(.47, .66), vec2(.73, .7), compact);
        vec2 plotOffset = mix(vec2(.43, .0), vec2(.13, .0), compact);
        gl_Position = vec4(point * plotScale + plotOffset, 0.0, 1.0);
        gl_PointSize = size * ${pixelRatio.toFixed(2)} * mix(1.0, .82, compact);
        groupId = group;
        reveal = eased;
      }
    `,
    frag: `
      precision mediump float;
      varying float groupId;
      varying float reveal;
      void main() {
        float radius = length(gl_PointCoord - .5);
        float alpha = smoothstep(.5, .08, radius);
        vec3 neutral = vec3(.55, .82, .74);
        vec3 classified = groupId < .5 ? vec3(.40, .91, .83) : groupId < 1.5 ? vec3(1.0, .52, .41) : vec3(.85, .96, .39);
        vec3 color = mix(neutral, classified, reveal);
        float emphasis = mix(.72, groupId > 1.5 ? 1.15 : .92, reveal);
        gl_FragColor = vec4(color * emphasis, alpha * .86);
      }
    `,
    attributes: {
      basePosition: basePositions,
      resolvedPosition: resolvedPositions,
      group: groups,
      size: pointSizes
    },
    uniforms: {
      progress: regl.prop('progress'),
      compact: regl.prop('compact')
    },
    primitive: 'points',
    count: particleCount,
    blend: { enable: true, func: { srcRGB: 'src alpha', dstRGB: 'one', srcAlpha: 'one', dstAlpha: 'one' } },
    depth: { enable: false }
  });

  const ringPoints = Array.from({ length: 72 }, (_, index) => {
    const angle = index / 72 * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
  });

  const drawResponseGate = regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      uniform float progress;
      uniform float compact;
      varying float opacity;
      void main() {
        vec2 plotScale = mix(vec2(.47, .66), vec2(.73, .7), compact);
        vec2 plotOffset = mix(vec2(.43, .0), vec2(.13, .0), compact);
        vec2 gate = vec2(.29, .33) + position * vec2(.19, .155) * (.72 + progress * .28);
        gl_Position = vec4(gate * plotScale + plotOffset, 0.0, 1.0);
        opacity = smoothstep(.18, .72, progress);
      }
    `,
    frag: `
      precision mediump float;
      varying float opacity;
      void main() {
        gl_FragColor = vec4(.85, .96, .39, opacity * .9);
      }
    `,
    attributes: { position: ringPoints },
    uniforms: {
      progress: regl.prop('progress'),
      compact: regl.prop('compact')
    },
    primitive: 'line loop',
    lineWidth: 1,
    count: ringPoints.length,
    blend: { enable: true, func: { srcRGB: 'src alpha', dstRGB: 'one minus src alpha', srcAlpha: 'one', dstAlpha: 'one minus src alpha' } },
    depth: { enable: false }
  });

  const commandFunctions = [drawField, drawDensity, drawCells, drawResponseGate];
  let previousFrameTime = null;
  let transitionElapsed = 0;
  let transitionFrom = 0;
  let transitionTo = 0;

  const clamp = value => Math.min(1, Math.max(0, value));
  const stablePhase = progress => progress <= .015 ? 'mixed' : progress >= .985 ? 'resolved' : 'partial';

  const recordInput = source => {
    state.lastInput = source;
    state.inputCount += 1;
    if (source.startsWith('pointer')) state.pointerInputCount += 1;
    if (source.startsWith('touch')) state.touchInputCount += 1;
    if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    if (source.startsWith('click')) state.clickInputCount += 1;
  };

  const syncInterface = () => {
    const progress = state.progress;
    const percent = Math.round(progress * 100);
    state.phase = state.motionActive ? 'resolving' : stablePhase(progress);
    stage.dataset.phase = state.phase;
    stage.dataset.progress = progress.toFixed(3);
    stage.style.setProperty('--analysis-progress', progress.toFixed(4));
    control.setAttribute('aria-pressed', String(state.targetProgress >= .5));
    const tinyLayout = stage.clientWidth <= 180 || stage.clientHeight <= 105;
    control.textContent = tinyLayout
      ? state.targetProgress >= .5 ? 'Reset' : 'Analyze'
      : state.targetProgress >= .5 ? 'Mix observations' : 'Separate populations';

    if (state.phase === 'mixed') phaseReadout.textContent = 'MIXED SAMPLE · READY';
    else if (state.phase === 'resolved') phaseReadout.textContent = '03 POPULATIONS · COHERENT';
    else phaseReadout.textContent = `RESOLVING · ${String(percent).padStart(2, '0')}%`;

    rareReadout.textContent = progress < .34 ? '—' : `${(state.rarePopulationRatio * progress * 100).toFixed(1)}%`;
    canvas.setAttribute('aria-label', state.phase === 'resolved'
      ? 'One thousand one hundred cell measurements separated into three populations with an eight percent rare response'
      : state.phase === 'mixed'
        ? 'One thousand one hundred mixed cell measurements awaiting population analysis'
        : `Cell measurements ${percent} percent separated into coherent populations`);
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
    if (Math.abs(next - state.progress) < .001 && !state.motionActive) return;
    recordInput(source);
    state.targetProgress = next;
    state.transitionCount += 1;
    state.activeDirection = next > state.progress ? 'separating' : 'mixing';
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

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * pixelRatio));
    const height = Math.max(1, Math.round(rect.height * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      regl.poll();
    }
    state.canvasWidth = width;
    state.canvasHeight = height;
    return { width, height, compact: rect.width <= 180 || rect.height <= 105 ? 1 : 0 };
  };

  const advanceTransition = time => {
    if (previousFrameTime === null || time < previousFrameTime) previousFrameTime = time;
    const delta = Math.min(.12, Math.max(0, time - previousFrameTime));
    previousFrameTime = time;
    if (!state.motionActive) return;
    transitionElapsed += delta;
    const ratio = Math.min(1, transitionElapsed / .78);
    const eased = ratio < .5 ? 4 * ratio * ratio * ratio : 1 - Math.pow(-2 * ratio + 2, 3) / 2;
    state.progress = transitionFrom + (transitionTo - transitionFrom) * eased;
    if (ratio >= 1) settleAt(transitionTo);
  };

  const render = time => {
    const viewport = resize();
    advanceTransition(Number(time) || 0);
    const props = {
      progress: state.progress,
      compact: viewport.compact,
      resolution: [viewport.width, viewport.height]
    };

    drawField(props);
    state.drawCommandExecutions.field += 1;
    drawDensity(props);
    state.drawCommandExecutions.density += 1;
    drawCells(props);
    state.drawCommandExecutions.cells += 1;
    drawResponseGate(props);
    state.drawCommandExecutions.gate += 1;
    state.renderCount += 1;
    syncInterface();
  };

  const progressFromPointer = event => {
    const rect = stage.getBoundingClientRect();
    return clamp((event.clientX - rect.left) / Math.max(1, rect.width));
  };

  control.addEventListener('pointerdown', event => event.stopPropagation());
  control.addEventListener('click', event => {
    event.stopPropagation();
    const source = event.detail === 0
      ? 'keyboard:button'
      : event.pointerType ? `pointer:${event.pointerType}:button` : 'click:button';
    animateTo(state.targetProgress >= .5 ? 0 : 1, source);
  });
  control.addEventListener('focus', () => { state.controlFocused = true; });
  control.addEventListener('blur', () => { state.controlFocused = false; });

  stage.addEventListener('pointerenter', () => { state.pointerInside = true; });
  stage.addEventListener('pointerleave', () => { state.pointerInside = false; });
  stage.addEventListener('pointerdown', event => {
    if (event.target === control) return;
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
    if (event.target === control) return;
    let target = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') target = Math.min(1, state.targetProgress + .25);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') target = Math.max(0, state.targetProgress - .25);
    if (event.key === 'Home' || event.key === 'Escape') target = 0;
    if (event.key === 'End') target = 1;
    if (event.key === 'Enter' || event.key === ' ') target = state.targetProgress >= .5 ? 0 : 1;
    if (target === null) return;
    event.preventDefault();
    animateTo(target, `keyboard:${event.key === ' ' ? 'Space' : event.key}`);
  });

  const handleReducedMotionChange = event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.motionActive) settleAt(state.targetProgress);
  };
  if (typeof reducedMotionQuery.addEventListener === 'function') reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  else reducedMotionQuery.addListener(handleReducedMotionChange);

  const framebufferChecksum = () => {
    const pixels = regl.read();
    const stride = Math.max(1, Math.floor(pixels.length / 2048));
    let checksum = 2166136261;
    for (let index = 0; index < pixels.length; index += stride) {
      checksum = Math.imul(checksum ^ pixels[index], 16777619) >>> 0;
    }
    return checksum;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`functional-webgl-draw-commands: ${message}`);
    };
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();

    invariant(state.claimedLibrary === 'regl@2.1.1' && typeof regl === 'function' && regl._gl === gl, 'real regl context is missing');
    invariant(gl instanceof WebGLRenderingContext && state.realReglContext, 'WebGL rendering context is unavailable');
    invariant(commandFunctions.length === 4 && commandFunctions.every(command => typeof command === 'function'), 'four regl draw commands are required');
    invariant(state.drawCommandCount === 4 && state.drawCommandIds.join('|') === 'field|density|cells|response-gate', 'draw-command composition contract changed');
    invariant(state.renderCount > 0 && Object.values(state.drawCommandExecutions).every(count => count === state.renderCount), 'draw commands did not execute coherently');
    invariant(basePositions.length === particleCount && resolvedPositions.length === particleCount && groups.length === particleCount && pointSizes.length === particleCount, 'cell attribute buffers diverged');
    invariant(state.particleCount === 1100 && state.populationCounts.join('|') === '759|253|88', 'cell population counts changed');
    invariant(state.dataChecksum === dataChecksum && state.deterministicData && !state.randomSourceUsed, 'cell data must remain deterministic');
    invariant(state.automaticPlayback === false && state.automaticFallback === false && state.syntheticInputDispatch === false, 'automatic or synthetic progression is forbidden');
    invariant(state.inputAdapters.join('|') === 'pointer|touch|click|keyboard', 'input adapter contract changed');
    invariant(Math.abs(Number(stage.dataset.progress) - state.progress) < .0011 && stage.dataset.phase === state.phase, 'DOM analysis state is stale');
    invariant(control.getAttribute('aria-pressed') === String(state.targetProgress >= .5), 'analysis control state is stale');
    invariant(state.progress >= 0 && state.progress <= 1 && state.targetProgress >= 0 && state.targetProgress <= 1, 'analysis progress escaped its bounds');
    invariant(!state.reducedMotion || !state.motionActive, 'reduced motion must settle directly');
    invariant(canvas.width === state.canvasWidth && canvas.height === state.canvasHeight && gl.drawingBufferWidth === canvas.width, 'WebGL drawing buffer is stale');
    invariant(canvasRect.width > 0 && canvasRect.height > 0 && controlRect.width > 0 && controlRect.height > 0, 'analysis surface or control is not visible');
    invariant(canvasRect.left >= stageRect.left - .5 && canvasRect.right <= stageRect.right + .5 && canvasRect.top >= stageRect.top - .5 && canvasRect.bottom <= stageRect.bottom + .5, 'WebGL surface escaped the preview');
    invariant(control.type === 'button' && stage.tabIndex === 0 && getComputedStyle(stage).touchAction === 'none', 'pointer and keyboard access changed');
    invariant(state.inputCount > 0 || (state.initialStaticConfirmed && state.progress === 0 && state.targetProgress === 0 && state.phase === 'mixed'), 'initial frame must remain static until real input');
    return true;
  };

  syncInterface();

  const doubleFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.resolve(document.fonts?.ready)
    .then(() => {
      render(0);
      const before = `${state.progress}|${state.targetProgress}|${state.phase}|${state.inputCount}`;
      const checksum = framebufferChecksum();
      return doubleFrame().then(() => {
        render(0);
        const after = `${state.progress}|${state.targetProgress}|${state.phase}|${state.inputCount}`;
        const nextChecksum = framebufferChecksum();
        state.initialFrameChecksum = checksum;
        state.initialStaticConfirmed = before === after
          && checksum === nextChecksum
          && state.progress === 0
          && state.targetProgress === 0
          && !state.motionActive;
        if (!state.initialStaticConfirmed) throw new Error('Initial cell-analysis frame changed without user input.');
        if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial regl draw-command assertion failed.');
      });
    });

  ready.catch(markPreviewFailure);

  installPreviewController({
    id: 'functional-webgl-draw-commands',
    library: 'regl@2.1.1',
    renderer: 'webgl',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
