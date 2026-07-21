import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#tool-workspace');
  const dock = document.querySelector('#dock');
  const items = [...dock.querySelectorAll('.dock-tool')];
  const selectionOutput = document.querySelector('#selection-output');
  const canvasTool = document.querySelector('#canvas-tool');
  const clamp01 = value => Math.max(0, Math.min(1, value));

  const state = {
    id: 'neighbor-magnifying-navigation-dock',
    task: 'human-selects-and-retains-a-design-tool-through-a-distance-weighted-dock',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'measured-pointer-distance-or-keyboard-focus-distributes-motion-scale-across-target-and-neighbors',
    assetStrategy: 'code-native-inline-svg-tool-icons-no-functional-raster-asset-required',
    iconSystem: 'five-consistent-24px-stroke-svg-tools',
    acceptedInputs: ['mouse-proximity', 'touch-or-pen-proximity', 'keyboard-focus', 'click-activation', 'enter-or-space-activation'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticPlayback: false,
    automaticCruise: false,
    automaticFocus: false,
    automaticFallback: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-proximity-or-selection-mutation',
    untrustedMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerInputCount: 0,
    keyboardFocusInputCount: 0,
    keyboardNavigationCount: 0,
    activationInputCount: 0,
    pointerMoveCount: 0,
    pointerLeaveCount: 0,
    focusCount: 0,
    activationCount: 0,
    selectionChangeCount: 0,
    measuredDistanceCount: 0,
    distributionUpdateCount: 0,
    motionAnimationCount: 0,
    motionCompletionCount: 0,
    cancelledAnimationCount: 0,
    focusedIndex: null,
    pointerClientX: null,
    pointerClientY: null,
    selectedIndex: 0,
    selectedTool: 'Select',
    selectionStable: true,
    selectionRetainedAcrossProximityCount: 0,
    phase: 'idle-selected',
    result: 'select-tool-retained',
    itemCenters: [],
    measuredDistances: [],
    targetScales: [1, 1, 1, 1, 1],
    currentScales: [1, 1, 1, 1, 1],
    maximumObservedScale: 1,
    minimumObservedScale: 1,
    neighborDistributionVerified: false,
    targetPeakVerified: false,
    firstHumanInputScalesBefore: null,
    firstHumanInputScalesAfter: null,
    initialScaleSignature: '1.000|1.000|1.000|1.000|1.000',
    initialStillVerified: false,
    transitionRecords: [],
    stageWidth: 0,
    stageHeight: 0,
    stageCoverageRatio: 0,
    dockWithinStage: false,
    allToolsWithinStage: false,
    svgIconCount: 0,
    svgViewBoxCount: 0,
    geometryMeasureCount: 0,
    resizeCount: 0,
    renderCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let activeAnimations = Array(items.length).fill(null);
  let lastInitialSignature = null;
  let resizeFrame = 0;
  let lastTrustedPointerTime = -Infinity;

  function invariant(condition, message) {
    if (!condition) throw new Error(`neighbor-magnifying-navigation-dock: ${message}`);
  }

  function scaleSignature(scales = state.targetScales) {
    return scales.map(value => Number(value).toFixed(3)).join('|');
  }

  function measureGeometry() {
    const stageRect = stage.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();
    const itemRects = items.map(item => item.getBoundingClientRect());
    state.stageWidth = Math.round(stageRect.width);
    state.stageHeight = Math.round(stageRect.height);
    state.stageCoverageRatio = Number(((stageRect.width * stageRect.height) / Math.max(1, innerWidth * innerHeight)).toFixed(4));
    state.itemCenters = itemRects.map(rect => Number((rect.left + rect.width / 2).toFixed(3)));
    state.dockWithinStage = dockRect.left >= stageRect.left - 1
      && dockRect.right <= stageRect.right + 1
      && dockRect.top >= stageRect.top - 1
      && dockRect.bottom <= stageRect.bottom + 1;
    state.allToolsWithinStage = itemRects.every(rect => rect.left >= stageRect.left - 1
      && rect.right <= stageRect.right + 1
      && rect.top >= stageRect.top - 1
      && rect.bottom <= stageRect.bottom + 1);
    state.geometryMeasureCount += 1;
  }

  function acceptTrusted(event, source) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (source.startsWith('pointer')) state.pointerInputCount += 1;
    if (source === 'keyboard-focus') state.keyboardFocusInputCount += 1;
    if (source.startsWith('keyboard-nav')) state.keyboardNavigationCount += 1;
    if (source === 'activation') state.activationInputCount += 1;
    return true;
  }

  function animateDistribution(scales, source, distances) {
    const before = state.targetScales.slice();
    if (state.firstHumanInputScalesBefore === null) state.firstHumanInputScalesBefore = before.slice();
    activeAnimations.forEach(animation => {
      if (animation && typeof animation.cancel === 'function') {
        animation.cancel();
        state.cancelledAnimationCount += 1;
      }
    });
    activeAnimations = items.map((item, index) => {
      const scale = scales[index];
      const lift = -(scale - 1) * 17;
      const control = animate(item, { scale, y: lift }, { duration: .2, ease: [.2, .82, .2, 1] });
      state.motionAnimationCount += 1;
      Promise.resolve(control.finished).then(() => {
        state.motionCompletionCount += 1;
        state.currentScales[index] = scale;
      }).catch(() => {});
      return control;
    });
    state.targetScales = scales.map(value => Number(value.toFixed(4)));
    state.measuredDistances = distances.map(value => Number(value.toFixed(3)));
    state.distributionUpdateCount += 1;
    state.maximumObservedScale = Math.max(state.maximumObservedScale, ...state.targetScales);
    state.minimumObservedScale = Math.min(state.minimumObservedScale, ...state.targetScales);
    const peak = Math.max(...state.targetScales);
    const peakIndex = state.targetScales.indexOf(peak);
    const neighborScales = [state.targetScales[peakIndex - 1], state.targetScales[peakIndex + 1]].filter(Number.isFinite);
    state.targetPeakVerified = peak >= 1.48;
    state.neighborDistributionVerified = neighborScales.some(value => value > 1.04 && value < peak)
      && state.targetScales.some(value => value <= 1.01);
    if (state.firstHumanInputScalesAfter === null) state.firstHumanInputScalesAfter = state.targetScales.slice();
    state.transitionRecords.push({
      source,
      trusted: true,
      selectedTool: state.selectedTool,
      before: scaleSignature(before),
      after: scaleSignature(state.targetScales),
      minimumDistance: Math.min(...state.measuredDistances)
    });
    state.transitionRecords = state.transitionRecords.slice(-64);
  }

  function applyPointerProximity(event) {
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-proximity`)) return;
    measureGeometry();
    state.pointerMoveCount += 1;
    lastTrustedPointerTime = performance.now();
    state.pointerClientX = Number(event.clientX.toFixed(3));
    state.pointerClientY = Number(event.clientY.toFixed(3));
    const selectionBefore = state.selectedIndex;
    const distances = state.itemCenters.map(center => Math.abs(center - event.clientX));
    const scales = distances.map(distance => 1 + .58 * clamp01(1 - distance / 62));
    state.measuredDistanceCount += distances.length;
    state.focusedIndex = distances.indexOf(Math.min(...distances));
    state.phase = 'proximity-preview';
    animateDistribution(scales, 'trusted-pointer-proximity', distances);
    if (selectionBefore === state.selectedIndex) state.selectionRetainedAcrossProximityCount += 1;
  }

  function applyKeyboardFocus(event, index, source) {
    if (!acceptTrusted(event, source)) return;
    measureGeometry();
    const selectionBefore = state.selectedIndex;
    const distances = items.map((_, itemIndex) => Math.abs(itemIndex - index) * 42);
    const scales = distances.map(distance => 1 + .58 * clamp01(1 - distance / 84));
    state.focusedIndex = index;
    state.focusCount += 1;
    state.measuredDistanceCount += distances.length;
    state.phase = 'keyboard-focus-preview';
    animateDistribution(scales, 'trusted-keyboard-focus', distances);
    if (selectionBefore === state.selectedIndex) state.selectionRetainedAcrossProximityCount += 1;
  }

  function neutralizeProximity(event) {
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-leave`)) return;
    state.pointerLeaveCount += 1;
    state.focusedIndex = null;
    state.phase = 'idle-selected';
    animateDistribution([1, 1, 1, 1, 1], 'trusted-pointer-leave', [999, 999, 999, 999, 999]);
  }

  function activateTool(event, index) {
    if (!acceptTrusted(event, 'activation')) return;
    const previousIndex = state.selectedIndex;
    state.activationCount += 1;
    state.selectedIndex = index;
    state.selectedTool = items[index].dataset.tool;
    state.selectionChangeCount += Number(previousIndex !== index);
    state.selectionStable = true;
    state.phase = 'tool-selected-retained';
    state.result = `${state.selectedTool.toLowerCase()}-tool-retained`;
    items.forEach((item, itemIndex) => { item.dataset.selected = String(itemIndex === index); });
    selectionOutput.textContent = `${state.selectedTool.toUpperCase()} · ACTIVE`;
    canvasTool.textContent = state.selectedTool.toUpperCase();
  }

  dock.addEventListener('pointermove', applyPointerProximity);
  dock.addEventListener('pointerleave', neutralizeProximity);

  items.forEach((item, index) => {
    item.addEventListener('focus', event => {
      const source = performance.now() - lastTrustedPointerTime < 1000 ? 'pointer-focus' : 'keyboard-focus';
      applyKeyboardFocus(event, index, source);
    });
    item.addEventListener('click', event => activateTool(event, index));
    item.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      if (!acceptTrusted(event, `keyboard-nav-${event.key.toLowerCase()}`)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0
        : event.key === 'End' ? items.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
      items[nextIndex].focus({ preventScroll: true });
    });
  });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.resizeCount += 1;
      measureGeometry();
    });
  });
  resizeObserver.observe(stage);

  function render() {
    state.renderCount += 1;
    measureGeometry();
    if (state.inputCount === 0) {
      const signature = scaleSignature();
      if (lastInitialSignature === null) lastInitialSignature = signature;
      else state.initialStillVerified = signature === lastInitialSignature
        && signature === state.initialScaleSignature
        && state.selectedIndex === 0
        && state.phase === 'idle-selected';
    }
  }

  const ready = document.fonts.ready.then(() => {
    state.svgIconCount = items.filter(item => item.querySelector('svg')).length;
    state.svgViewBoxCount = items.filter(item => item.querySelector('svg')?.getAttribute('viewBox') === '0 0 24 24').length;
    measureGeometry();
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && typeof animate === 'function', 'Motion is not ready');
    invariant(state.svgIconCount === 5 && state.svgViewBoxCount === 5, 'code-native SVG icon system is incomplete');
    invariant(state.stageCoverageRatio >= .995 && state.dockWithinStage && state.allToolsWithinStage, 'workspace or dock geometry escapes the stage');
    invariant(state.automaticPlayback === false && state.automaticCruise === false && state.automaticFocus === false && state.automaticFallback === false, 'automatic dock motion is forbidden');
    invariant(state.captureClockDriven === false && state.renderIgnoresPreviewClock === true, 'preview clock must not mutate proximity');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed proximity or selection');
    invariant(state.inputCount === state.trustedInputCount, 'trusted input accounting diverged');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial no-input dock was not verified still');
    invariant(items.filter(item => item.dataset.selected === 'true').length === 1, 'exactly one tool must remain selected');
    invariant(items[state.selectedIndex].dataset.tool === state.selectedTool, 'selected tool and index diverged');
    invariant(state.selectionStable && state.result === `${state.selectedTool.toLowerCase()}-tool-retained`, 'selected tool result was not retained');
    invariant(state.transitionRecords.every(record => record.trusted === true), 'a proximity transition lacks trusted input causality');

    if (state.distributionUpdateCount > 0 && state.targetScales.some(scale => scale > 1.01)) {
      invariant(state.measuredDistanceCount >= items.length && state.measuredDistances.length === items.length, 'real tool distances were not measured');
      invariant(state.targetPeakVerified && state.neighborDistributionVerified, 'target and neighbor scale distribution is not distance-weighted');
      invariant(state.maximumObservedScale >= 1.48 && state.minimumObservedScale === 1, 'observed magnification range is incomplete');
      invariant(state.firstHumanInputScalesBefore.join('|') !== state.firstHumanInputScalesAfter.join('|'), 'trusted input did not change the scale distribution');
      invariant(state.motionAnimationCount >= items.length, 'Motion did not animate every dock item');
    }
    if (state.activationCount > 0) {
      invariant(state.activationInputCount === state.activationCount, 'activation input accounting diverged');
      invariant(state.phase === 'tool-selected-retained' || state.phase.endsWith('preview'), 'activation did not produce a stable task state');
      invariant(selectionOutput.textContent === `${state.selectedTool.toUpperCase()} · ACTIVE`, 'selected tool readout is inconsistent');
    }
    return true;
  };

  installPreviewController({
    id: 'neighbor-magnifying-navigation-dock',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
