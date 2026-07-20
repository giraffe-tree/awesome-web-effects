import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#poster-lab');
  const shell = document.querySelector('#lab-shell');
  const surface = document.querySelector('#poster-surface');
  const container = document.querySelector('#p5-stage');
  const loopButton = document.querySelector('#loop-button');
  const densityControl = document.querySelector('#density-control');
  const densityValue = document.querySelector('#density-value');
  const loopState = document.querySelector('#loop-state');
  const posterMode = document.querySelector('#poster-mode');
  const focusXReadout = document.querySelector('#focus-x');
  const focusYReadout = document.querySelector('#focus-y');
  const amplitudeReadout = document.querySelector('#amplitude');
  const presetButtons = [...document.querySelectorAll('.preset-button')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const initialLoopPhase = .12;
  const presets = {
    drift: { label: 'Drift', amplitude: 34, frequency: 1.45, curvature: .48 },
    surge: { label: 'Surge', amplitude: 52, frequency: 2.2, curvature: .78 },
    ridge: { label: 'Ridge', amplitude: 24, frequency: 3.15, curvature: 1.08 },
  };

  const state = {
    id: 'sketch-style-creative-coding-loop',
    automaticLoop: false,
    automaticFieldChanges: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    focusX: .66,
    focusY: .46,
    density: 14,
    currentPreset: 'drift',
    amplitude: presets.drift.amplitude,
    frequency: presets.drift.frequency,
    curvature: presets.drift.curvature,
    loopPhase: initialLoopPhase,
    phase: 'static',
    isLooping: false,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    pointerDragCount: 0,
    pointerMoveCount: 0,
    keyboardAdjustCount: 0,
    densityInputCount: 0,
    presetClickCount: 0,
    loopToggleCount: 0,
    loopStartCount: 0,
    loopPauseCount: 0,
    loopCancelCount: 0,
    loopFrameCount: 0,
    reducedMotionDirectCount: 0,
    redrawRequestCount: 0,
    drawCount: 0,
    resizeCount: 0,
    renderCount: 0,
    fieldChecksum: 0,
    fieldSignature: '',
    canvasSizeValidated: false,
    parametersValidated: false,
    initialStaticVerified: false,
    reducedMotion: reducedMotionQuery.matches,
    lastTrustedEvent: 'none',
    lastDrawParameters: null,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let animationFrame = 0;
  let loopClock = null;
  let activePointerId = null;
  let latestPointerKind = 'mouse';
  let densityInputKind = 'keyboard';
  let resolveFirstDraw;
  const firstDrawReady = new Promise(resolve => { resolveFirstDraw = resolve; });

  const clampValue = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

  function recordInput(kind, event, label) {
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return false;
    }
    state.inputKind = kind;
    state.lastTrustedEvent = label;
    state.inputCount += 1;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
    return true;
  }

  function updateInterface() {
    const preset = presets[state.currentPreset];
    const densityProgress = (state.density - 8) / (22 - 8) * 100;
    focusXReadout.textContent = `${Math.round(state.focusX * 100)}%`;
    focusYReadout.textContent = `${Math.round(state.focusY * 100)}%`;
    amplitudeReadout.textContent = String(state.amplitude);
    densityControl.value = String(state.density);
    densityControl.style.setProperty('--density-progress', `${densityProgress}%`);
    densityControl.setAttribute('aria-valuetext', `${state.density} contour lines`);
    densityValue.textContent = `${state.density} lines`;
    posterMode.textContent = `${preset.label} field`;
    presetButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.preset === state.currentPreset));
    });
    loopButton.setAttribute('aria-pressed', String(state.isLooping));
    loopButton.textContent = state.reducedMotion
      ? 'Step field'
      : state.isLooping
        ? 'Pause field'
        : 'Run field';
    loopState.textContent = state.isLooping
      ? 'Live loop'
      : state.phase === 'reduced-step'
        ? 'Reduced · stepped'
        : state.phase === 'edited'
          ? 'Edited frame'
          : 'Static frame';
  }

  function requestRedraw(reason) {
    state.redrawRequestCount += 1;
    state.lastRedrawReason = reason;
    sketch?.redraw();
  }

  function setFocus(x, y, reason) {
    state.focusX = clampValue(x, .06, .94);
    state.focusY = clampValue(y, .08, .92);
    if (!state.isLooping) state.phase = 'edited';
    updateInterface();
    requestRedraw(reason);
  }

  function applyPreset(id, reason) {
    const preset = presets[id];
    state.currentPreset = id;
    state.amplitude = preset.amplitude;
    state.frequency = preset.frequency;
    state.curvature = preset.curvature;
    if (!state.isLooping) state.phase = 'edited';
    updateInterface();
    requestRedraw(reason);
  }

  function stopLoop(reason, countCancellation = false) {
    if (!state.isLooping) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    loopClock = null;
    state.isLooping = false;
    if (countCancellation) state.loopCancelCount += 1;
    else state.loopPauseCount += 1;
    state.phase = reason;
    updateInterface();
  }

  function loopStep(timestamp) {
    if (!state.isLooping) return;
    if (loopClock === null) loopClock = timestamp;
    const delta = Math.min(.05, Math.max(0, (timestamp - loopClock) / 1000));
    loopClock = timestamp;
    state.loopPhase = (state.loopPhase + delta * .18) % 1;
    state.loopFrameCount += 1;
    requestRedraw('trusted-loop-frame');
    animationFrame = requestAnimationFrame(loopStep);
  }

  function toggleLoop() {
    state.loopToggleCount += 1;
    if (state.reducedMotion) {
      state.loopPhase = (state.loopPhase + .125) % 1;
      state.reducedMotionDirectCount += 1;
      state.phase = 'reduced-step';
      updateInterface();
      requestRedraw('trusted-reduced-step');
      return;
    }
    if (state.isLooping) {
      stopLoop('paused');
      return;
    }
    state.isLooping = true;
    state.phase = 'looping';
    state.loopStartCount += 1;
    loopClock = null;
    updateInterface();
    animationFrame = requestAnimationFrame(loopStep);
  }

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      const renderer = p.createCanvas(
        Math.max(1, Math.round(surface.clientWidth)),
        Math.max(1, Math.round(surface.clientHeight)),
      );
      renderer.parent(container);
      renderer.elt.tabIndex = 0;
      renderer.elt.setAttribute('role', 'application');
      renderer.elt.setAttribute('aria-label', 'Generated poster field. Drag to move the source, use arrow keys to adjust it, and press Space to run or pause.');
      p.noLoop();
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
      requestAnimationFrame(() => p.redraw());
    };

    p.draw = () => {
      state.drawCount += 1;
      const canvasWidth = p.width;
      const canvasHeight = p.height;
      const focusX = state.focusX * canvasWidth;
      const focusY = state.focusY * canvasHeight;
      const amplitude = Math.min(canvasHeight * .34, state.amplitude * Math.max(.45, canvasHeight / 230));
      const sampleStep = Math.max(3, canvasWidth / 92);
      let checksum = 0;

      p.background('#efeede');
      p.noFill();
      p.blendMode(p.MULTIPLY);
      for (let lineIndex = 0; lineIndex < state.density; lineIndex += 1) {
        const baseY = (lineIndex + .5) / state.density * canvasHeight;
        const palette = lineIndex % 5 === 0
          ? '#ef7047'
          : lineIndex % 3 === 0
            ? '#3b5be6'
            : '#1b1d16';
        p.stroke(palette);
        p.strokeWeight(lineIndex % 5 === 0 ? 1.55 : .72);
        p.beginShape();
        let sampleIndex = 0;
        for (let x = -sampleStep; x <= canvasWidth + sampleStep; x += sampleStep) {
          const unitX = x / Math.max(1, canvasWidth);
          const dx = unitX - state.focusX;
          const influence = Math.exp(-(dx * dx) / (.018 + state.curvature * .042));
          const wave = Math.sin((unitX * state.frequency + state.loopPhase) * p.TWO_PI + lineIndex * .43);
          const fold = Math.cos((unitX * state.frequency * .53 - state.loopPhase * .72) * p.TWO_PI + lineIndex * .67);
          const pull = (focusY - baseY) * influence * (.11 + state.curvature * .12);
          const y = baseY
            + wave * amplitude * (.2 + influence * .8)
            + fold * amplitude * .19
            + pull;
          p.vertex(x, y);
          if (sampleIndex % 11 === 0) checksum += (x + 1) * .013 + (y + 1) * .017 + lineIndex;
          sampleIndex += 1;
        }
        p.endShape();
      }

      p.blendMode(p.BLEND);
      p.noFill();
      p.stroke('#171912');
      p.strokeWeight(1);
      p.circle(focusX, focusY, Math.max(9, amplitude * .5));
      p.circle(focusX, focusY, Math.max(3, amplitude * .12));
      p.line(focusX - 5, focusY, focusX + 5, focusY);
      p.line(focusX, focusY - 5, focusX, focusY + 5);
      p.stroke('#f06f42');
      p.arc(focusX, focusY, Math.max(14, amplitude * .7), Math.max(14, amplitude * .7), -.45, 1.35);

      state.fieldChecksum = Number(checksum.toFixed(3));
      state.fieldSignature = [
        state.currentPreset,
        state.density,
        state.focusX.toFixed(3),
        state.focusY.toFixed(3),
        state.loopPhase.toFixed(3),
        state.amplitude,
        state.frequency.toFixed(2),
      ].join(':');
      state.lastDrawParameters = {
        focusX: state.focusX,
        focusY: state.focusY,
        density: state.density,
        currentPreset: state.currentPreset,
        amplitude: state.amplitude,
        frequency: state.frequency,
        curvature: state.curvature,
        loopPhase: state.loopPhase,
      };
      if (state.drawCount === 1) resolveFirstDraw();
    };
  }, container);

  function pointerPosition(event) {
    const surfaceBounds = surface.getBoundingClientRect();
    return {
      x: (event.clientX - surfaceBounds.left) / Math.max(1, surfaceBounds.width),
      y: (event.clientY - surfaceBounds.top) / Math.max(1, surfaceBounds.height),
    };
  }

  surface.addEventListener('pointerdown', event => {
    const kind = event.pointerType || 'pointer';
    if (!recordInput(kind, event, 'field-drag-start')) return;
    latestPointerKind = kind;
    activePointerId = event.pointerId;
    state.pointerDragCount += 1;
    surface.setPointerCapture(event.pointerId);
    container.querySelector('canvas')?.focus({ preventScroll: true });
    const focusPosition = pointerPosition(event);
    setFocus(focusPosition.x, focusPosition.y, 'trusted-pointer-down');
  });

  surface.addEventListener('pointermove', event => {
    if (event.pointerId !== activePointerId) return;
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return;
    }
    state.pointerMoveCount += 1;
    state.lastTrustedEvent = 'field-drag-move';
    const focusPosition = pointerPosition(event);
    setFocus(focusPosition.x, focusPosition.y, 'trusted-pointer-move');
  });

  const releasePointer = event => {
    if (event.pointerId !== activePointerId) return;
    if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
    activePointerId = null;
  };
  surface.addEventListener('pointerup', releasePointer);
  surface.addEventListener('pointercancel', releasePointer);

  surface.addEventListener('keydown', event => {
    if (event.key === ' ') {
      event.preventDefault();
      if (!recordInput('keyboard', event, 'canvas-loop-toggle')) return;
      toggleLoop();
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, 'field-key-adjust')) return;
    state.keyboardAdjustCount += 1;
    const focusStep = event.shiftKey ? .12 : .035;
    if (event.key === 'Home') setFocus(.5, .5, 'trusted-key-home');
    else setFocus(
      state.focusX + (event.key === 'ArrowRight' ? focusStep : event.key === 'ArrowLeft' ? -focusStep : 0),
      state.focusY + (event.key === 'ArrowDown' ? focusStep : event.key === 'ArrowUp' ? -focusStep : 0),
      'trusted-key-arrow',
    );
  });

  loopButton.addEventListener('pointerdown', event => {
    if (event.isTrusted) latestPointerKind = event.pointerType || 'pointer';
  });
  loopButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : latestPointerKind;
    if (!recordInput(kind, event, 'loop-button')) return;
    toggleLoop();
  });

  presetButtons.forEach(button => {
    button.addEventListener('pointerdown', event => {
      if (event.isTrusted) latestPointerKind = event.pointerType || 'pointer';
    });
    button.addEventListener('click', event => {
      const kind = event.detail === 0 ? 'keyboard' : latestPointerKind;
      if (!recordInput(kind, event, `preset-${button.dataset.preset}`)) return;
      state.presetClickCount += 1;
      applyPreset(button.dataset.preset, 'trusted-preset');
    });
  });

  densityControl.addEventListener('pointerdown', event => {
    if (!event.isTrusted) return;
    densityInputKind = event.pointerType || 'pointer';
    latestPointerKind = densityInputKind;
  });
  densityControl.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
      densityInputKind = 'keyboard';
    }
  });
  densityControl.addEventListener('input', event => {
    if (!recordInput(densityInputKind, event, 'density-input')) return;
    state.density = Math.round(clampValue(Number(event.currentTarget.value), 8, 22));
    state.densityInputCount += 1;
    if (!state.isLooping) state.phase = 'edited';
    updateInterface();
    requestRedraw('trusted-density');
  });

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.isLooping) stopLoop('reduced-static', true);
    updateInterface();
    requestRedraw('reduced-motion-change');
  });

  const resizeObserver = new ResizeObserver(() => {
    const canvasWidth = Math.max(1, Math.round(surface.clientWidth));
    const canvasHeight = Math.max(1, Math.round(surface.clientHeight));
    if (!container.querySelector('canvas') || (sketch.width === canvasWidth && sketch.height === canvasHeight)) return;
    state.resizeCount += 1;
    sketch.resizeCanvas(canvasWidth, canvasHeight, true);
    requestRedraw('resize');
  });
  resizeObserver.observe(surface);

  updateInterface();
  const ready = Promise.all([firstDrawReady, document.fonts.ready]).then(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const canvas = container.querySelector('canvas');
    const surfaceRect = surface.getBoundingClientRect();
    state.canvasSizeValidated = Boolean(canvas)
      && Math.abs(canvas.width - Math.round(surfaceRect.width)) <= 2
      && Math.abs(canvas.height - Math.round(surfaceRect.height)) <= 2;
    state.parametersValidated = state.lastDrawParameters
      && ['focusX', 'focusY', 'density', 'currentPreset', 'amplitude', 'frequency', 'curvature', 'loopPhase']
        .every(key => state.lastDrawParameters[key] === state[key]);
    state.initialStaticVerified = state.loopPhase === initialLoopPhase
      && state.phase === 'static'
      && state.isLooping === false
      && state.inputCount === 0
      && state.loopStartCount === 0
      && state.loopFrameCount === 0
      && state.automaticLoop === false
      && state.automaticFieldChanges === false
      && state.syntheticInput === false;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const canvas = container.querySelector('canvas');
    const context = canvas?.getContext('2d');
    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    const activePresets = presetButtons.filter(button => button.getAttribute('aria-pressed') === 'true');
    const preset = presets[state.currentPreset];
    state.canvasSizeValidated = Boolean(canvas)
      && Math.abs(canvas.width - Math.round(surfaceRect.width)) <= 2
      && Math.abs(canvas.height - Math.round(surfaceRect.height)) <= 2;
    state.parametersValidated = state.lastDrawParameters
      && ['focusX', 'focusY', 'density', 'currentPreset', 'amplitude', 'frequency', 'curvature']
        .every(key => state.lastDrawParameters[key] === state[key])
      && (state.isLooping || Math.abs(state.lastDrawParameters.loopPhase - state.loopPhase) < .001);
    return Boolean(
      sketch instanceof p5
      && context instanceof CanvasRenderingContext2D
      && canvas.tabIndex === 0
      && state.automaticLoop === false
      && state.automaticFieldChanges === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.initialStaticVerified
      && state.focusX >= .06
      && state.focusX <= .94
      && state.focusY >= .08
      && state.focusY <= .92
      && state.density >= 8
      && state.density <= 22
      && Number(densityControl.value) === state.density
      && densityValue.textContent === `${state.density} lines`
      && state.currentPreset in presets
      && state.amplitude === preset.amplitude
      && state.frequency === preset.frequency
      && state.curvature === preset.curvature
      && activePresets.length === 1
      && activePresets[0].dataset.preset === state.currentPreset
      && loopButton.getAttribute('aria-pressed') === String(state.isLooping)
      && (!state.isLooping || state.phase === 'looping')
      && (!state.reducedMotion || !state.isLooping)
      && state.loopPhase >= 0
      && state.loopPhase < 1
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.pointerInputCount)
      && Number.isInteger(state.keyboardInputCount)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && Number.isInteger(state.pointerDragCount)
      && Number.isInteger(state.pointerMoveCount)
      && Number.isInteger(state.keyboardAdjustCount)
      && Number.isInteger(state.densityInputCount)
      && Number.isInteger(state.presetClickCount)
      && Number.isInteger(state.loopToggleCount)
      && Number.isInteger(state.loopStartCount)
      && Number.isInteger(state.loopPauseCount)
      && Number.isInteger(state.loopCancelCount)
      && Number.isInteger(state.loopFrameCount)
      && Number.isInteger(state.reducedMotionDirectCount)
      && Number.isInteger(state.redrawRequestCount)
      && Number.isInteger(state.drawCount)
      && Number.isInteger(state.renderCount)
      && Number.isFinite(state.fieldChecksum)
      && state.fieldChecksum > 1
      && state.fieldSignature.length > 16
      && state.canvasSizeValidated
      && state.parametersValidated
      && state.drawCount > 0
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stageRect.width >= innerWidth * .99
      && stageRect.height >= innerHeight * .99
      && shellRect.left >= -1
      && shellRect.top >= -1
      && shellRect.right <= innerWidth + 1
      && shellRect.bottom <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth
      && document.documentElement.scrollHeight <= innerHeight
    );
  };

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
    sketch.remove();
  }, { once: true });

  installPreviewController({
    id: 'sketch-style-creative-coding-loop',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => { state.renderCount += 1; },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
