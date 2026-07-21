import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, seeded } from './batch-b-utils.js';

try {
  const stage = document.querySelector('#corolla-stage');
  const host = document.querySelector('#corolla-host');
  const studioState = document.querySelector('#studio-state');
  const densityValue = document.querySelector('#density-value');
  const tensionValue = document.querySelector('#tension-value');
  const focusXValue = document.querySelector('#focus-x');
  const focusYValue = document.querySelector('#focus-y');
  const artworkId = document.querySelector('#artwork-id');
  const interactionHint = document.querySelector('#interaction-hint');
  const lockButton = document.querySelector('#lock-button');
  const resetButton = document.querySelector('#reset-button');
  const densityDown = document.querySelector('#density-down');
  const densityUp = document.querySelector('#density-up');
  const tensionDown = document.querySelector('#tension-down');
  const tensionUp = document.querySelector('#tension-up');
  const resultStamp = document.querySelector('#result-stamp');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const defaults = {
    density: .72,
    tension: .54,
    focus: { x: .64, y: .5 },
    focusActive: false,
  };
  const pointCount = 3600;
  const petalCount = 7;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const layerHues = [68, 164, 278, 8];
  const blueprints = Array.from({ length: pointCount }, (_, index) => ({
    index,
    layer: index % 4,
    theta: index * goldenAngle + (seeded(index, 31) - .5) * .16,
    radialNoise: seeded(index, 7) - .5,
    size: seeded(index, 13),
    brightness: seeded(index, 19),
    visibility: seeded(index, 23),
    phase: seeded(index, 29) * Math.PI * 2,
  }));
  const blueprintChecksum = Number(blueprints.slice(0, 96)
    .reduce((sum, point) => sum + point.theta * .013 + point.radialNoise * 1.7 + point.visibility * 2.3, 0)
    .toFixed(6));
  const counterKeys = [
    'inputCount',
    'pointerInputCount',
    'keyboardInputCount',
    'touchInputCount',
    'penInputCount',
    'focusMoveCount',
    'parameterChangeCount',
    'lockCount',
    'unlockCount',
    'resetCount',
    'pointerCaptureCount',
    'pointerReleaseCount',
    'pointerCancelCount',
    'transitionCount',
    'redrawRequestCount',
    'resizeDrawCount',
    'drawCount',
    'renderCount',
    'reducedMotionDiscreteCount',
  ];

  const state = {
    id: 'point-constructed-generative-corolla',
    automaticGrowth: false,
    automaticFocus: false,
    automaticRehearsal: false,
    previewClockDriven: false,
    continuousGrowth: false,
    runEnabled: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    firstFrameStatic: true,
    mode: 'editing',
    density: defaults.density,
    tension: defaults.tension,
    focus: { ...defaults.focus },
    focusActive: defaults.focusActive,
    dirty: false,
    pointerCaptured: false,
    activePointerId: null,
    activePointerType: null,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    focusMoveCount: 0,
    parameterChangeCount: 0,
    lockCount: 0,
    unlockCount: 0,
    resetCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    transitionCount: 0,
    redrawRequestCount: 0,
    resizeDrawCount: 0,
    drawCount: 0,
    renderCount: 0,
    reducedMotionDiscreteCount: 0,
    revision: 0,
    lastDrawnRevision: -1,
    lastDrawCause: 'not-drawn',
    pointCount,
    visiblePointCount: 0,
    influencedPointCount: 0,
    geometryChecksum: 0,
    blueprintChecksum,
    canvasReady: false,
    initialStaticVerified: false,
    reducedMotion: reducedMotion.matches,
    mutationHistory: [],
    lastMutation: null,
    lastTrustedEvent: 'none',
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let activePointerId = null;
  let lastPointerType = 'mouse';
  let lastInputModality = 'keyboard';
  let resizeQueued = false;
  let resolveCanvasReady;
  const canvasReady = new Promise(resolve => { resolveCanvasReady = resolve; });
  const nextFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const formatArtworkId = () => `C7–D${Math.round(state.density * 100)}–T${Math.round(state.tension * 100)}`;
  const stateToken = () => [
    state.mode,
    state.density.toFixed(2),
    state.tension.toFixed(2),
    state.focus.x.toFixed(3),
    state.focus.y.toFixed(3),
    state.focusActive ? 'focus' : 'neutral',
  ].join(':');

  const isDirty = () => state.mode !== 'editing'
    || state.density !== defaults.density
    || state.tension !== defaults.tension
    || state.focus.x !== defaults.focus.x
    || state.focus.y !== defaults.focus.y
    || state.focusActive !== defaults.focusActive;

  const recordInput = (kind, event, cause, pointerType = null) => {
    if (!event || event.isTrusted !== true) return false;
    state.inputKind = kind;
    state.inputCount += 1;
    state.lastTrustedEvent = cause;
    if (kind === 'keyboard') {
      state.keyboardInputCount += 1;
    } else {
      const resolvedPointer = pointerType || event.pointerType || lastPointerType;
      state.pointerInputCount += 1;
      if (resolvedPointer === 'touch') state.touchInputCount += 1;
      if (resolvedPointer === 'pen') state.penInputCount += 1;
    }
    return true;
  };

  const recordMutation = (from, type, cause) => {
    state.dirty = isDirty();
    const mutation = {
      from,
      to: stateToken(),
      type,
      cause,
      inputCountAtMutation: state.inputCount,
      trusted: state.lastTrustedEvent !== 'none',
    };
    state.lastMutation = mutation;
    state.mutationHistory.push(mutation);
    if (state.mutationHistory.length > 20) state.mutationHistory.shift();
    state.transitionCount += 1;
  };

  const syncDom = () => {
    stage.dataset.mode = state.mode;
    densityValue.textContent = `${Math.round(state.density * 100)}%`;
    tensionValue.textContent = `${Math.round(state.tension * 100)}%`;
    focusXValue.textContent = String(Math.round(state.focus.x * 100)).padStart(2, '0');
    focusYValue.textContent = String(Math.round(state.focus.y * 100)).padStart(2, '0');
    artworkId.textContent = formatArtworkId();
    studioState.textContent = state.mode === 'locked' ? 'Locked · Sleeve 06' : state.dirty ? 'Editing · Unsaved changes' : 'Editing · Sleeve 06';
    interactionHint.textContent = state.mode === 'locked'
      ? 'Master fixed · unlock to refine'
      : state.focusActive ? 'Growth focus placed · refine or lock' : 'Pointer / touch / arrows direct local growth';
    lockButton.textContent = state.mode === 'locked' ? 'Unlock sleeve' : 'Lock sleeve';
    lockButton.setAttribute('aria-pressed', String(state.mode === 'locked'));
    resetButton.disabled = !state.dirty;
    const controlsLocked = state.mode === 'locked';
    densityDown.disabled = controlsLocked || state.density <= .48;
    densityUp.disabled = controlsLocked || state.density >= .9;
    tensionDown.disabled = controlsLocked || state.tension <= .3;
    tensionUp.disabled = controlsLocked || state.tension >= .84;
    resultStamp.setAttribute('aria-hidden', String(state.mode !== 'locked'));
  };

  const requestDraw = cause => {
    state.revision += 1;
    state.redrawRequestCount += 1;
    state.lastDrawCause = cause;
    sketch?.redraw();
  };

  const commitMutation = (from, type, cause) => {
    recordMutation(from, type, cause);
    syncDom();
    requestDraw(cause);
  };

  const quantizeFocus = value => reducedMotion.matches ? Math.round(value * 10) / 10 : value;

  const setFocus = (x, y, cause) => {
    if (state.mode === 'locked') return false;
    const next = {
      x: clamp(quantizeFocus(x), .05, .95),
      y: clamp(quantizeFocus(y), .06, .94),
    };
    if (next.x === state.focus.x && next.y === state.focus.y && state.focusActive) return false;
    const from = stateToken();
    state.focus = next;
    state.focusActive = true;
    state.focusMoveCount += 1;
    if (reducedMotion.matches) state.reducedMotionDiscreteCount += 1;
    commitMutation(from, 'focus', cause);
    return true;
  };

  const setFocusFromPointer = (event, cause) => {
    const bounds = host.getBoundingClientRect();
    return setFocus((event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height, cause);
  };

  const changeParameter = (parameter, delta, cause) => {
    if (state.mode === 'locked') return false;
    const limits = parameter === 'density' ? [.48, .9] : [.3, .84];
    const next = Number(clamp(state[parameter] + delta, limits[0], limits[1]).toFixed(2));
    if (next === state[parameter]) return false;
    const from = stateToken();
    state[parameter] = next;
    state.parameterChangeCount += 1;
    if (reducedMotion.matches) state.reducedMotionDiscreteCount += 1;
    commitMutation(from, parameter, cause);
    return true;
  };

  const toggleLock = cause => {
    const from = stateToken();
    if (state.mode === 'locked') {
      state.mode = 'editing';
      state.unlockCount += 1;
    } else {
      state.mode = 'locked';
      state.lockCount += 1;
    }
    commitMutation(from, 'mode', cause);
  };

  const resetArtwork = cause => {
    if (!state.dirty) return false;
    const from = stateToken();
    state.mode = 'editing';
    state.density = defaults.density;
    state.tension = defaults.tension;
    state.focus = { ...defaults.focus };
    state.focusActive = defaults.focusActive;
    state.resetCount += 1;
    commitMutation(from, 'reset', cause);
    return true;
  };

  document.addEventListener('pointerdown', event => {
    lastPointerType = event.pointerType || 'mouse';
    lastInputModality = 'pointer';
  }, { capture: true });
  document.addEventListener('keydown', () => {
    lastInputModality = 'keyboard';
  }, { capture: true });

  host.addEventListener('pointerdown', event => {
    if (event.button !== 0 || activePointerId !== null) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    const pointerType = event.pointerType || lastPointerType;
    if (!recordInput('pointer', event, `${pointerType}-focus-start`, pointerType)) return;
    activePointerId = event.pointerId;
    state.activePointerId = event.pointerId;
    state.activePointerType = pointerType;
    state.pointerCaptured = true;
    state.pointerCaptureCount += 1;
    host.setPointerCapture(event.pointerId);
    setFocusFromPointer(event, `${pointerType}-focus-start`);
  });

  host.addEventListener('pointermove', event => {
    const pointerType = event.pointerType || lastPointerType;
    const freePointer = pointerType === 'mouse' || pointerType === 'pen';
    if (state.mode === 'locked' || !freePointer && event.pointerId !== activePointerId) return;
    if (!recordInput('pointer', event, `${pointerType}-focus-move`, pointerType)) return;
    setFocusFromPointer(event, `${pointerType}-focus-move`);
  });

  const finishPointer = (event, cancelled = false) => {
    if (activePointerId === null || event.pointerId !== activePointerId) return;
    const pointerType = event.pointerType || state.activePointerType || lastPointerType;
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
    activePointerId = null;
    state.activePointerId = null;
    state.activePointerType = null;
    state.pointerCaptured = false;
    if (!recordInput('pointer', event, `${pointerType}-${cancelled ? 'focus-cancel' : 'focus-release'}`, pointerType)) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
  };

  host.addEventListener('pointerup', event => finishPointer(event));
  host.addEventListener('pointercancel', event => finishPointer(event, true));
  host.addEventListener('lostpointercapture', event => {
    if (activePointerId === event.pointerId) finishPointer(event, true);
  });

  host.addEventListener('keydown', event => {
    const horizontalStep = reducedMotion.matches ? .1 : .045;
    const verticalStep = reducedMotion.matches ? .1 : .055;
    const movement = {
      ArrowLeft: [-horizontalStep, 0],
      ArrowRight: [horizontalStep, 0],
      ArrowUp: [0, -verticalStep],
      ArrowDown: [0, verticalStep],
    }[event.key];
    if (movement) {
      event.preventDefault();
      if (event.repeat || !recordInput('keyboard', event, `keyboard-${event.key}`)) return;
      setFocus(state.focus.x + movement[0], state.focus.y + movement[1], `keyboard-${event.key}`);
      return;
    }

    const parameterAction = {
      '[': ['density', -.06],
      ']': ['density', .06],
      '-': ['tension', -.06],
      '=': ['tension', .06],
      '+': ['tension', .06],
    }[event.key];
    if (parameterAction) {
      event.preventDefault();
      if (event.repeat || !recordInput('keyboard', event, `keyboard-${event.key}`)) return;
      changeParameter(parameterAction[0], parameterAction[1], `keyboard-${event.key}`);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.repeat || !recordInput('keyboard', event, 'keyboard-toggle-lock')) return;
      toggleLock('keyboard-toggle-lock');
      return;
    }

    if ((event.key === 'r' || event.key === 'R') && state.dirty) {
      event.preventDefault();
      if (event.repeat || !recordInput('keyboard', event, 'keyboard-reset')) return;
      resetArtwork('keyboard-reset');
    }
  });

  const bindParameterButton = (button, parameter, delta) => {
    button.addEventListener('click', event => {
      const kind = event.detail === 0 ? 'keyboard' : 'pointer';
      const pointerType = kind === 'pointer' ? lastPointerType : null;
      if (!recordInput(kind, event, `${kind}-${parameter}-${delta > 0 ? 'up' : 'down'}`, pointerType)) return;
      changeParameter(parameter, delta, `${kind}-${parameter}-${delta > 0 ? 'up' : 'down'}`);
    });
  };
  bindParameterButton(densityDown, 'density', -.06);
  bindParameterButton(densityUp, 'density', .06);
  bindParameterButton(tensionDown, 'tension', -.06);
  bindParameterButton(tensionUp, 'tension', .06);

  lockButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    const pointerType = kind === 'pointer' ? lastPointerType : null;
    if (!recordInput(kind, event, `${kind}-toggle-lock`, pointerType)) return;
    toggleLock(`${kind}-toggle-lock`);
  });

  resetButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    const pointerType = kind === 'pointer' ? lastPointerType : null;
    if (!recordInput(kind, event, `${kind}-reset`, pointerType)) return;
    resetArtwork(`${kind}-reset`);
  });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(host.clientWidth, host.clientHeight, p.P2D).parent(host);
      p.colorMode(p.HSB, 360, 100, 100, 100);
      p.noLoop();
    };

    p.draw = () => {
      state.drawCount += 1;
      p.background('#10120e');
      const width = p.width;
      const height = p.height;
      const tiny = width <= 220 || height <= 105;
      const compact = width <= 420;
      const centerX = width * (tiny ? .59 : compact ? .6 : .61);
      const centerY = height * .51;
      const radius = Math.min(height * .49, width * .43);
      const focusX = state.focus.x * width;
      const focusY = state.focus.y * height;
      const pointScale = clamp(radius / 95, .48, 1.42);
      const layerScale = [.58, .72, .86, 1.01];

      p.noFill();
      p.stroke(66, 12, 90, 5);
      p.strokeWeight(1);
      p.circle(centerX, centerY, radius * 1.75);
      p.circle(centerX, centerY, radius * 1.18);
      p.line(0, centerY, width, centerY);

      let visible = 0;
      let influenced = 0;
      let checksum = 0;
      p.blendMode(p.ADD);
      p.noStroke();
      for (const point of blueprints) {
        if (point.visibility > state.density) continue;
        visible += 1;
        const layer = point.layer;
        const theta = point.theta
          + Math.sin(point.theta * 3 + point.phase) * (.025 + state.tension * .065)
          + layer * .018;
        const petal = Math.abs(Math.sin(theta * petalCount + layer * .34));
        const petalShape = .2 + Math.pow(petal, 1.28 + state.tension * 1.18) * .8;
        let radial = radius * layerScale[layer] * petalShape
          + point.radialNoise * radius * (.035 + state.tension * .035);
        let x = centerX + Math.cos(theta) * radial;
        let y = centerY + Math.sin(theta) * radial * (.9 + layer * .017);

        let influence = 0;
        if (state.focusActive) {
          const distance = Math.hypot(x - focusX, y - focusY);
          const reach = radius * (.25 + state.density * .12);
          influence = Math.exp(-((distance / reach) ** 2) * 2.1);
          if (influence > .08) influenced += 1;
          const outward = influence * radius * (.11 + state.tension * .22);
          const angle = Math.atan2(y - centerY, x - centerX);
          x += Math.cos(angle) * outward;
          y += Math.sin(angle) * outward * .9;
          x += -Math.sin(angle) * influence * radius * .025;
          y += Math.cos(angle) * influence * radius * .025;
        }

        const hue = (layerHues[layer] + point.brightness * 22 + influence * 16) % 360;
        const saturation = 66 + layer * 4;
        const lightness = 76 + point.brightness * 22;
        const alpha = 18 + petal * 37 + influence * 40;
        const diameter = (.62 + point.size * 1.45 + influence * 2.9) * pointScale;
        p.fill(hue, saturation, lightness, alpha);
        p.circle(x, y, diameter);

        if (point.index % 137 === 0) checksum += x * .011 + y * .017 + diameter * .31;
      }
      p.blendMode(p.BLEND);

      p.noStroke();
      p.fill(70, 20, 5, 92);
      p.circle(centerX, centerY, radius * .17);
      p.fill(68, 86, 98, 95);
      p.circle(centerX, centerY, Math.max(2, radius * .023));

      if (state.focusActive && state.mode === 'editing') {
        p.noFill();
        p.stroke(68, 82, 100, 64);
        p.strokeWeight(Math.max(.7, pointScale));
        const halo = Math.max(10, radius * (.18 + state.tension * .06));
        p.circle(focusX, focusY, halo);
        p.line(focusX - halo * .22, focusY, focusX + halo * .22, focusY);
        p.line(focusX, focusY - halo * .22, focusX, focusY + halo * .22);
        p.noStroke();
        p.fill(68, 82, 100, 92);
        p.circle(focusX, focusY, Math.max(2, pointScale * 2.4));
      }

      state.visiblePointCount = visible;
      state.influencedPointCount = influenced;
      state.geometryChecksum = Number(checksum.toFixed(4));
      state.lastDrawnRevision = state.revision;
      if (!state.canvasReady) {
        state.canvasReady = true;
        resolveCanvasReady();
      }
    };
  }, host);

  const resizeCanvas = () => {
    if (!sketch || sketch.width === host.clientWidth && sketch.height === host.clientHeight) return;
    state.resizeDrawCount += 1;
    state.lastDrawCause = 'viewport-resize';
    sketch.resizeCanvas(host.clientWidth, host.clientHeight, true);
    sketch.redraw();
  };
  const resizeObserver = new ResizeObserver(() => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      resizeCanvas();
    });
  });
  resizeObserver.observe(host);

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    requestDraw('reduced-motion-change');
  });

  syncDom();

  const ready = (async () => {
    await Promise.all([document.fonts.ready, canvasReady]);
    await nextFrames();
    state.initialStaticVerified = state.mode === 'editing'
      && state.density === defaults.density
      && state.tension === defaults.tension
      && state.focus.x === defaults.focus.x
      && state.focus.y === defaults.focus.y
      && state.focusActive === false
      && state.transitionCount === 0
      && state.inputCount === 0
      && state.redrawRequestCount === 0
      && state.drawCount >= 1
      && state.visiblePointCount > 2200
      && state.influencedPointCount === 0
      && state.geometryChecksum > 0;
  })();

  const render = () => {
    state.renderCount += 1;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();

    const canvas = host.querySelector('canvas');
    const stageRect = stage.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const panelRect = document.querySelector('.tool-panel').getBoundingClientRect();
    const dockRect = document.querySelector('.control-dock').getBoundingClientRect();
    const expectedVisible = blueprints.filter(point => point.visibility <= state.density).length;
    const recalculatedBlueprintChecksum = Number(blueprints.slice(0, 96)
      .reduce((sum, point) => sum + point.theta * .013 + point.radialNoise * 1.7 + point.visibility * 2.3, 0)
      .toFixed(6));
    const historyValid = state.mutationHistory.length <= 20
      && state.mutationHistory.every(mutation => mutation.from !== mutation.to
        && mutation.inputCountAtMutation > 0
        && mutation.trusted === true)
      && state.transitionCount >= state.mutationHistory.length
      && (!state.lastMutation || state.lastMutation.to === stateToken());
    const countersValid = counterKeys.every(key => Number.isInteger(state[key]) && state[key] >= 0)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.touchInputCount + state.penInputCount <= state.pointerInputCount
      && state.pointerReleaseCount + state.pointerCancelCount <= state.pointerCaptureCount
      && state.focusMoveCount + state.parameterChangeCount + state.lockCount + state.unlockCount + state.resetCount === state.transitionCount;
    const geometryValid = sketch instanceof p5
      && canvas.getContext('2d')
      && blueprints.length === pointCount
      && state.blueprintChecksum === blueprintChecksum
      && recalculatedBlueprintChecksum === blueprintChecksum
      && state.visiblePointCount === expectedVisible
      && state.visiblePointCount > 1500
      && state.visiblePointCount < pointCount
      && state.influencedPointCount >= 0
      && (!state.focusActive || state.influencedPointCount > 12)
      && Number.isFinite(state.geometryChecksum)
      && state.geometryChecksum > 0
      && state.lastDrawnRevision === state.revision;
    const semanticStateValid = stage.dataset.mode === state.mode
      && state.dirty === isDirty()
      && densityValue.textContent === `${Math.round(state.density * 100)}%`
      && tensionValue.textContent === `${Math.round(state.tension * 100)}%`
      && focusXValue.textContent === String(Math.round(state.focus.x * 100)).padStart(2, '0')
      && focusYValue.textContent === String(Math.round(state.focus.y * 100)).padStart(2, '0')
      && artworkId.textContent === formatArtworkId()
      && lockButton.getAttribute('aria-pressed') === String(state.mode === 'locked')
      && resetButton.disabled === !state.dirty
      && resultStamp.getAttribute('aria-hidden') === String(state.mode !== 'locked')
      && state.pointerCaptured === (activePointerId !== null)
      && state.activePointerId === activePointerId;
    const rectInside = (inner, outer, tolerance = 1) => inner.left >= outer.left - tolerance
      && inner.top >= outer.top - tolerance
      && inner.right <= outer.right + tolerance
      && inner.bottom <= outer.bottom + tolerance;
    const viewportValid = rectInside(hostRect, stageRect)
      && rectInside(canvasRect, stageRect)
      && rectInside(panelRect, stageRect)
      && rectInside(dockRect, stageRect)
      && canvas.width === Math.round(hostRect.width)
      && canvas.height === Math.round(hostRect.height)
      && stageRect.width <= innerWidth + 1
      && stageRect.height <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;

    return window.__PREVIEW_INTERACTION_STATE__ === state
      && pointCount === 3600
      && petalCount === 7
      && state.automaticGrowth === false
      && state.automaticFocus === false
      && state.automaticRehearsal === false
      && state.previewClockDriven === false
      && state.continuousGrowth === false
      && state.runEnabled === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.firstFrameStatic === true
      && state.initialStaticVerified
      && geometryValid
      && semanticStateValid
      && historyValid
      && countersValid
      && viewportValid
      && state.renderCount > 0;
  };

  window.addEventListener('beforeunload', () => {
    resizeObserver.disconnect();
    sketch?.remove();
  }, { once: true });

  installPreviewController({
    id: 'point-constructed-generative-corolla',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
