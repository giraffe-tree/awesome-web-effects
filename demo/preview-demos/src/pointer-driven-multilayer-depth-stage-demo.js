import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-b-utils.js';

try {
  const stage = document.querySelector('#depth-stage');
  const layers = [...document.querySelectorAll('.depth-layer')];
  const sightline = document.querySelector('.sightline-overlay');
  const reticle = document.querySelector('#depth-reticle');
  const readout = document.querySelector('#depth-readout');
  const decisionOutput = document.querySelector('#decision-output');
  const decisionDetail = document.querySelector('#decision-detail');
  const controls = [...document.querySelectorAll('.view-control')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const depths = layers.map(layer => Number(layer.dataset.depth));
  const viewpoints = {
    left: { x: .18, y: .52 },
    center: { x: .5, y: .5 },
    right: { x: .82, y: .46 }
  };

  const state = {
    id: 'pointer-driven-multilayer-depth-stage',
    task: 'apartment-harbor-view-corridor-inspection',
    automaticFallback: false,
    automaticPath: false,
    automaticPlayback: false,
    captureClockDriven: false,
    syntheticInputDispatch: false,
    userInputRequired: true,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'viewpoint-control'],
    initialFrameStatic: true,
    initialX: .5,
    initialY: .5,
    initialInputCount: 0,
    engaged: false,
    mode: 'idle',
    x: .5,
    y: .5,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    touchInputCount: 0,
    pointerUpdateCount: 0,
    keyboardUpdateCount: 0,
    presetSelectionCount: 0,
    resetCount: 0,
    lastInputTrusted: null,
    lastInputSource: 'initial',
    pointerCaptured: false,
    activePointerId: null,
    selectedPreset: 'center',
    previousPreset: null,
    verdict: 'partial',
    visibilityScore: 46,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionScale: reducedMotionQuery.matches ? .24 : 1,
    preferenceChangeCount: 0,
    motionControlCount: 2,
    controlsBuiltWithoutAutoplay: true,
    layerCount: layers.length,
    depths: [...depths],
    layerEvidence: [],
    depthOrderingValid: false,
    maximumDisplacementPx: 0,
    renderCount: 0,
    viewMutationCount: 0,
    renderIgnoresPreviewClock: true
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let motionX = .5;
  let motionY = .5;
  let activePointerId = null;
  let latestPointerKind = 'mouse';

  const xControl = animate(0, 1, {
    duration: 1,
    ease: 'linear',
    autoplay: false,
    onUpdate: value => { motionX = value; }
  });
  const yControl = animate(0, 1, {
    duration: 1,
    ease: 'linear',
    autoplay: false,
    onUpdate: value => { motionY = value; }
  });
  xControl.pause();
  yControl.pause();
  xControl.time = state.x;
  yControl.time = state.y;

  function recordInput(kind, source, trusted) {
    state.inputCount += 1;
    state.inputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = trusted;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (kind === 'touch') state.touchInputCount += 1;
    }
  }

  function verdictAt(x) {
    if (x >= .66) return {
      key: 'clear',
      score: Math.round(82 + (x - .66) * 50),
      label: 'Corridor clear',
      detail: 'Harbor bridge clears the neighboring tower edge.'
    };
    if (x <= .34) return {
      key: 'blocked',
      score: Math.round(18 + x * 28),
      label: 'Tower overlap',
      detail: 'Tower 07 screens the bridge from this position.'
    };
    return {
      key: 'partial',
      score: Math.round(42 + (x - .34) * 25),
      label: 'Partly screened',
      detail: 'Shift right to clear neighboring Tower 07.'
    };
  }

  function nearestPreset(x, y) {
    const entries = Object.entries(viewpoints);
    const [name, distance] = entries.reduce((best, [key, point]) => {
      const nextDistance = Math.hypot(point.x - x, point.y - y);
      return nextDistance < best[1] ? [key, nextDistance] : best;
    }, ['custom', Infinity]);
    return distance <= .025 ? name : 'custom';
  }

  function syncInterface() {
    const verdict = verdictAt(state.x);
    const preset = nearestPreset(state.x, state.y);
    if (preset !== state.selectedPreset) state.previousPreset = state.selectedPreset;
    state.selectedPreset = preset;
    state.verdict = verdict.key;
    state.visibilityScore = verdict.score;
    stage.dataset.engaged = String(state.engaged);
    stage.dataset.mode = state.mode;
    stage.dataset.x = state.x.toFixed(4);
    stage.dataset.y = state.y.toFixed(4);
    stage.dataset.verdict = verdict.key;
    stage.dataset.view = preset;
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.lastSource = state.lastInputSource;
    decisionOutput.textContent = verdict.label;
    decisionDetail.textContent = verdict.detail;
    controls.forEach(control => {
      const active = control.dataset.view === preset;
      control.classList.toggle('is-active', active);
      control.setAttribute('aria-pressed', String(active));
    });
    const xLabel = Math.round((state.x - .5) * 100);
    const yLabel = Math.round((state.y - .5) * 100);
    readout.textContent = state.engaged
      ? `${xLabel >= 0 ? '+' : ''}${xLabel} X · ${yLabel >= 0 ? '+' : ''}${yLabel} Y · ${state.inputKind}`
      : 'Centered · 4 depth planes';
  }

  function applyView() {
    motionX = state.x;
    motionY = state.y;
    xControl.time = state.x;
    yControl.time = state.y;
    const x = motionX * 2 - 1;
    const y = motionY * 2 - 1;
    const viewportScale = Math.max(.55, Math.min(1.45, stage.clientWidth / 320));
    const amplitudeScale = state.reducedMotionScale;
    state.maximumDisplacementPx = 0;
    state.layerEvidence = layers.map((layer, index) => {
      const depth = depths[index];
      const translateX = x * depth * 25 * viewportScale * amplitudeScale;
      const translateY = y * depth * 12 * viewportScale * amplitudeScale;
      const translateZ = -depth * 34 * amplitudeScale;
      const scale = 1.018 + depth * .055;
      const brightness = 1.02 - y * depth * .07 * amplitudeScale;
      state.maximumDisplacementPx = Math.max(state.maximumDisplacementPx, Math.hypot(translateX, translateY));
      layer.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, ${translateZ.toFixed(2)}px) scale(${scale.toFixed(3)})`;
      layer.style.filter = `brightness(${brightness.toFixed(3)}) saturate(${(.92 + depth * .13).toFixed(3)})`;
      return {
        index,
        key: layer.dataset.layer,
        depth,
        translateX: Number(translateX.toFixed(2)),
        translateY: Number(translateY.toFixed(2)),
        translateZ: Number(translateZ.toFixed(2)),
        scale: Number(scale.toFixed(3))
      };
    });
    const overlayX = x * .42 * 25 * viewportScale * amplitudeScale;
    const overlayY = y * .42 * 12 * viewportScale * amplitudeScale;
    sightline.style.transform = `translate3d(${overlayX.toFixed(2)}px, ${overlayY.toFixed(2)}px, 0)`;
    reticle.style.left = `${(motionX * 100).toFixed(2)}%`;
    reticle.style.top = `${(motionY * 100).toFixed(2)}%`;
    state.depthOrderingValid = state.layerEvidence.every((layer, index, evidence) => index === 0 || layer.depth > evidence[index - 1].depth);
    syncInterface();
    if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
      stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__());
    }
  }

  function commitPoint(x, y, kind, mode, source, trusted, operation) {
    const nextX = Number(clamp(x).toFixed(5));
    const nextY = Number(clamp(y).toFixed(5));
    if (Math.abs(nextX - state.x) > .00001 || Math.abs(nextY - state.y) > .00001) state.viewMutationCount += 1;
    state.x = nextX;
    state.y = nextY;
    state.mode = mode;
    state.engaged = true;
    recordInput(kind, source, trusted);
    if (operation === 'pointer') state.pointerUpdateCount += 1;
    else if (operation === 'keyboard') state.keyboardUpdateCount += 1;
    else if (operation === 'preset') state.presetSelectionCount += 1;
    applyView();
  }

  function updateFromPointer(event, mode) {
    const bounds = stage.getBoundingClientRect();
    commitPoint(
      (event.clientX - bounds.left) / Math.max(1, bounds.width),
      (event.clientY - bounds.top) / Math.max(1, bounds.height),
      event.pointerType || 'pointer',
      mode,
      mode === 'dragging' ? 'pointer-drag' : 'pointer-hover',
      event.isTrusted,
      'pointer'
    );
  }

  function releasePointer(event) {
    if (activePointerId !== null && stage.hasPointerCapture?.(activePointerId)) stage.releasePointerCapture(activePointerId);
    if (!event || event.pointerId === activePointerId) activePointerId = null;
    state.activePointerId = null;
    state.pointerCaptured = false;
    if (state.engaged && state.mode === 'dragging') state.mode = 'pointer';
    syncInterface();
  }

  function resetView(kind, source, trusted) {
    releasePointer();
    state.x = .5;
    state.y = .5;
    state.mode = 'idle';
    state.engaged = false;
    state.resetCount += 1;
    recordInput(kind, source, trusted);
    applyView();
  }

  function inputKindFromClick(event) {
    return event.detail === 0 ? 'keyboard' : latestPointerKind;
  }

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'mouse';
    if (event.target.closest('.view-control')) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    activePointerId = event.pointerId;
    state.activePointerId = event.pointerId;
    stage.setPointerCapture?.(event.pointerId);
    state.pointerCaptured = true;
    updateFromPointer(event, 'dragging');
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest('.view-control')) return;
    latestPointerKind = event.pointerType || 'mouse';
    if (event.pointerType === 'touch' && !state.pointerCaptured) return;
    if (state.pointerCaptured && event.pointerId !== activePointerId) return;
    updateFromPointer(event, state.pointerCaptured ? 'dragging' : 'pointer');
  });

  stage.addEventListener('pointerup', releasePointer);
  stage.addEventListener('pointercancel', releasePointer);
  stage.addEventListener('lostpointercapture', event => {
    if (event.pointerId === activePointerId) releasePointer(event);
  });
  stage.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !state.pointerCaptured) resetView('mouse', 'pointer-leave-reset', event.isTrusted);
  });

  stage.addEventListener('keydown', event => {
    if (event.target.closest('.view-control')) return;
    const movement = {
      ArrowLeft: [-.07, 0],
      ArrowRight: [.07, 0],
      ArrowUp: [0, -.07],
      ArrowDown: [0, .07]
    }[event.key];
    const presetKey = { '1': 'left', '2': 'center', '3': 'right' }[event.key];
    if (!movement && !presetKey && !['Escape', 'Home', 'r', 'R'].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat) return;
    if (['Escape', 'Home', 'r', 'R'].includes(event.key)) {
      resetView('keyboard', `keyboard-${event.key}`, event.isTrusted);
      return;
    }
    if (presetKey) {
      const point = viewpoints[presetKey];
      commitPoint(point.x, point.y, 'keyboard', 'preset', `keyboard-preset-${presetKey}`, event.isTrusted, 'preset');
      return;
    }
    commitPoint(state.x + movement[0], state.y + movement[1], 'keyboard', 'keyboard', `keyboard-${event.key}`, event.isTrusted, 'keyboard');
  });

  controls.forEach(control => {
    control.addEventListener('pointerdown', event => {
      latestPointerKind = event.pointerType || 'mouse';
    });
    control.addEventListener('click', event => {
      const point = viewpoints[control.dataset.view];
      commitPoint(point.x, point.y, inputKindFromClick(event), 'preset', `preset-${control.dataset.view}`, event.isTrusted, 'preset');
    });
  });

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    state.reducedMotionScale = event.matches ? .24 : 1;
    state.preferenceChangeCount += 1;
    applyView();
  });

  function render() {
    state.renderCount += 1;
    applyView();
  }

  syncInterface();

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const bounds = stage.getBoundingClientRect();
    const initialEvidence = state.inputCount > 0 || (
      state.x === state.initialX
      && state.y === state.initialY
      && state.mode === 'idle'
      && state.engaged === false
      && state.initialInputCount === 0
    );
    const inputEvidence = state.inputCount === state.pointerInputCount + state.keyboardInputCount
      && state.inputCount === state.pointerUpdateCount + state.keyboardUpdateCount + state.presetSelectionCount + state.resetCount;
    const controlEvidence = [xControl, yControl].every(control => control.duration === 1
      && typeof control.play === 'function'
      && typeof control.pause === 'function'
      && typeof control.cancel === 'function')
      && Math.abs(xControl.time / xControl.duration - state.x) <= .0001
      && Math.abs(yControl.time / yControl.duration - state.y) <= .0001;
    const layerEvidence = layers.length === 4
      && depths.length === layers.length
      && state.layerEvidence.length === layers.length
      && state.depthOrderingValid
      && layers.every((layer, index) => Number(layer.dataset.depth) === depths[index]
        && layer.dataset.layer === state.layerEvidence[index].key
        && layer.style.transform.includes('translate3d')
        && Number.isFinite(state.layerEvidence[index].translateX)
        && Number.isFinite(state.layerEvidence[index].translateY));
    const directionalEvidence = Math.abs(state.x - .5) <= .01 || state.layerEvidence.every((layer, index, evidence) =>
      index === 0 || Math.abs(layer.translateX) >= Math.abs(evidence[index - 1].translateX)
    );
    const expectedVerdict = verdictAt(state.x);
    return typeof animate === 'function'
      && stage.dataset.previewMechanism === 'motion-human-view-corridor-parallax'
      && stage.tabIndex === 0
      && bounds.width >= innerWidth * .99
      && bounds.height >= innerHeight * .99
      && controls.length === 3
      && controls.every(control => control instanceof HTMLButtonElement && control.type === 'button')
      && state.motionControlCount === 2
      && state.controlsBuiltWithoutAutoplay === true
      && initialEvidence
      && inputEvidence
      && controlEvidence
      && layerEvidence
      && directionalEvidence
      && state.verdict === expectedVerdict.key
      && state.visibilityScore === expectedVerdict.score
      && decisionOutput.textContent === expectedVerdict.label
      && state.x >= 0 && state.x <= 1
      && state.y >= 0 && state.y <= 1
      && ['idle', 'pointer', 'dragging', 'keyboard', 'preset'].includes(state.mode)
      && state.pointerCaptured === (activePointerId !== null)
      && state.activePointerId === activePointerId
      && state.automaticFallback === false
      && state.automaticPath === false
      && state.automaticPlayback === false
      && state.captureClockDriven === false
      && state.syntheticInputDispatch === false
      && state.userInputRequired === true
      && state.initialFrameStatic === true
      && state.renderIgnoresPreviewClock === true
      && state.reducedMotionScale === (state.reducedMotion ? .24 : 1)
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.viewMutationCount)
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'pointer-driven-multilayer-depth-stage',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
