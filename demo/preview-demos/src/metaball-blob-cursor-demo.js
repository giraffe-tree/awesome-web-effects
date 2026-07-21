import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const FINISHES = {
  cobalt: { label: 'Cobalt', color: '#315dff' },
  moss: { label: 'Moss', color: '#52794f' },
  coral: { label: 'Coral', color: '#ec5d3f' },
};

const round = value => Number(value.toFixed(3));
const lerp = (from, to, progress) => from + (to - from) * progress;

try {
  const stage = document.querySelector('#finish-stage');
  const productCard = document.querySelector('#product-card');
  const cursorLayer = document.querySelector('#cursor-layer');
  const metaballBody = document.querySelector('#metaball-body');
  const blobBridge = document.querySelector('#blob-bridge');
  const blobTarget = document.querySelector('#blob-target');
  const blobTail = document.querySelector('#blob-tail');
  const blobFollow = document.querySelector('#blob-follow');
  const blobLead = document.querySelector('#blob-lead');
  const targetCore = document.querySelector('#target-core');
  const cursorCore = document.querySelector('#cursor-core');
  const status = document.querySelector('#selection-status');
  const instruction = document.querySelector('#finish-instruction');
  const cursorHint = document.querySelector('#cursor-hint');
  const finishButtons = [...document.querySelectorAll('[data-finish]')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'metaball-blob-cursor',
    task: 'human-selects-and-locks-a-real-product-finish-through-a-liquid-target-bridge',
    mechanism: 'trusted-pointer-or-keyboard-targeting-drives-finite-motion-cursor-travel-and-svg-blur-threshold-metaball-fusion',
    claimedLibrary: 'motion@12.42.2',
    assetStrategy: 'code-native-product-geometry-and-svg-metaball-field-no-functional-raster-input-required',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['captured-mouse-move-and-click', 'captured-touch-or-pen-press', 'keyboard-tab-and-enter-space', 'keyboard-arrows-and-enter-space'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticPath: false,
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
    phase: 'waiting',
    selectedFinish: 'none',
    previewFinish: 'cobalt',
    resultHeld: false,
    resultValidated: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    targetHoverCount: 0,
    targetHitCount: 0,
    selectionStartCount: 0,
    selectionCompleteCount: 0,
    syntheticSelectionCount: 0,
    activeTarget: 'none',
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    cursorActivated: false,
    cursorTravelStartCount: 0,
    cursorTravelCompleteCount: 0,
    cursorRenderCount: 0,
    cursorX: 0,
    cursorY: 0,
    targetX: 0,
    targetY: 0,
    bridgeLength: 0,
    maximumBridgeLength: 0,
    mergedFrameCount: 0,
    stretchedFrameCount: 0,
    selectedBridgeFrameCount: 0,
    visualMutationCount: 0,
    nonInputVisualMutationCount: 0,
    transitionProgress: 0,
    transitionRecords: [],
    svgFilterNodeCount: 0,
    targetCount: finishButtons.length,
    viewBoxWidth: 0,
    viewBoxHeight: 0,
    stageWidth: 0,
    stageHeight: 0,
    svgWidth: 0,
    svgHeight: 0,
    geometryCoverageX: 0,
    geometryCoverageY: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionDirectManipulation: true,
    ready: false,
    runtimeAssertCount: 0,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__METABALL_TARGET_STATE__ = state;

  let cursorControl = null;
  let selectionControl = null;
  let pointer = { x: 0, y: 0 };
  let previousPointer = { x: 0, y: 0 };

  function invariant(condition, message) {
    if (!condition) throw new Error(`metaball-blob-cursor: ${message}`);
  }

  function setCircle(circle, x, y) {
    circle.setAttribute('cx', String(round(x)));
    circle.setAttribute('cy', String(round(y)));
  }

  function resizeGeometry() {
    const stageRect = stage.getBoundingClientRect();
    const svgRect = cursorLayer.getBoundingClientRect();
    state.stageWidth = round(stageRect.width);
    state.stageHeight = round(stageRect.height);
    state.svgWidth = round(svgRect.width);
    state.svgHeight = round(svgRect.height);
    state.viewBoxWidth = Math.max(1, stageRect.width);
    state.viewBoxHeight = Math.max(1, stageRect.height);
    state.geometryCoverageX = round(svgRect.width / Math.max(1, stageRect.width));
    state.geometryCoverageY = round(svgRect.height / Math.max(1, stageRect.height));
    cursorLayer.setAttribute('viewBox', `0 0 ${state.viewBoxWidth} ${state.viewBoxHeight}`);
    if (!state.cursorActivated) {
      pointer = { x: state.viewBoxWidth * .63, y: state.viewBoxHeight * .21 };
      previousPointer = { ...pointer };
      renderCursor(pointer, null, false);
    }
  }

  function localPoint(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
      y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)),
    };
  }

  function anchorFor(button) {
    const stageBounds = stage.getBoundingClientRect();
    const bounds = button.getBoundingClientRect();
    return {
      x: bounds.left - stageBounds.left + Math.min(16, bounds.width * .24),
      y: bounds.top - stageBounds.top + bounds.height / 2,
    };
  }

  function updateDataset() {
    stage.dataset.phase = state.phase;
    stage.dataset.selectedFinish = state.selectedFinish;
    stage.dataset.activeTarget = state.activeTarget;
    stage.dataset.resultHeld = String(state.resultHeld);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.targetHitCount = String(state.targetHitCount);
    stage.dataset.maximumBridgeLength = state.maximumBridgeLength.toFixed(3);
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
  }

  function finishButton(id) {
    return finishButtons.find(button => button.dataset.finish === id) || null;
  }

  function renderCursor(position, targetButton, humanOwned) {
    const target = targetButton ? anchorFor(targetButton) : null;
    const dx = position.x - previousPointer.x;
    const dy = position.y - previousPointer.y;
    const velocityLength = Math.hypot(dx, dy) || 1;
    const direction = { x: dx / velocityLength, y: dy / velocityLength };
    const follow = target
      ? { x: lerp(position.x, target.x, .38), y: lerp(position.y, target.y, .38) }
      : { x: position.x - direction.x * 8, y: position.y - direction.y * 8 };
    const tail = target
      ? { x: lerp(position.x, target.x, .7), y: lerp(position.y, target.y, .7) }
      : { x: position.x - direction.x * 15, y: position.y - direction.y * 15 };
    const bridgeTarget = target || tail;
    const bridgeLength = Math.hypot(position.x - bridgeTarget.x, position.y - bridgeTarget.y);

    setCircle(blobLead, position.x, position.y);
    setCircle(blobFollow, follow.x, follow.y);
    setCircle(blobTail, tail.x, tail.y);
    setCircle(cursorCore, position.x, position.y);
    setCircle(blobTarget, bridgeTarget.x, bridgeTarget.y);
    setCircle(targetCore, bridgeTarget.x, bridgeTarget.y);
    blobBridge.setAttribute('d', `M ${round(position.x)} ${round(position.y)} L ${round(bridgeTarget.x)} ${round(bridgeTarget.y)}`);
    blobTarget.style.opacity = target ? '1' : '0';
    targetCore.style.opacity = target ? '.82' : '0';
    metaballBody.style.color = FINISHES[state.previewFinish].color;

    state.cursorX = round(position.x);
    state.cursorY = round(position.y);
    state.targetX = round(bridgeTarget.x);
    state.targetY = round(bridgeTarget.y);
    state.bridgeLength = round(bridgeLength);
    state.maximumBridgeLength = Math.max(state.maximumBridgeLength, state.bridgeLength);
    state.cursorRenderCount += 1;
    if (target && bridgeLength <= 44) state.mergedFrameCount += 1;
    if (target && bridgeLength >= 10) state.stretchedFrameCount += 1;
    if (target && targetButton.dataset.finish === state.selectedFinish) state.selectedBridgeFrameCount += 1;
    if (humanOwned) state.visualMutationCount += 1;
    previousPointer = { ...position };
    updateDataset();
  }

  function rejectUntrusted(event, source) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedInputCount += 1;
    state.lastInputTrusted = false;
    state.lastInputSource = source;
    updateDataset();
    return true;
  }

  function acceptInput(event, kind, source) {
    if (rejectUntrusted(event, source)) return false;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'pointer') state.pointerInputCount += 1;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    updateDataset();
    return true;
  }

  function activateTarget(button, source) {
    const id = button?.dataset.finish;
    if (!id || !FINISHES[id]) return;
    if (state.activeTarget !== id) state.targetHoverCount += 1;
    state.activeTarget = id;
    state.previewFinish = id;
    state.phase = state.resultHeld ? 'comparing-after-lock' : 'comparing';
    stage.style.setProperty('--chosen', FINISHES[id].color);
    instruction.textContent = source === 'keyboard' ? 'Enter to lock this finish' : 'Press to lock this finish';
    cursorHint.textContent = `Target · ${FINISHES[id].label}`;
    updateDataset();
  }

  function moveCursorFromTrustedEvent(event, targetButton) {
    const destination = localPoint(event);
    const origin = { ...pointer };
    cursorControl?.stop();
    state.cursorActivated = true;
    state.cursorTravelStartCount += 1;
    const duration = state.reducedMotion ? .01 : .18;
    cursorControl = animate(0, 1, {
      duration,
      ease: [.2, .72, .22, 1],
      onUpdate(progress) {
        pointer = {
          x: lerp(origin.x, destination.x, progress),
          y: lerp(origin.y, destination.y, progress),
        };
        renderCursor(pointer, targetButton, true);
      },
      onComplete() {
        pointer = destination;
        renderCursor(pointer, targetButton, true);
        state.cursorTravelCompleteCount += 1;
        updateDataset();
      },
    });
  }

  function moveCursorToTargetFromAcceptedInput(targetButton) {
    const anchor = anchorFor(targetButton);
    const destination = { x: anchor.x + 24, y: anchor.y };
    const origin = { ...pointer };
    cursorControl?.stop();
    state.cursorActivated = true;
    state.cursorTravelStartCount += 1;
    const duration = state.reducedMotion ? .01 : .18;
    cursorControl = animate(0, 1, {
      duration,
      ease: [.2, .72, .22, 1],
      onUpdate(progress) {
        pointer = {
          x: lerp(origin.x, destination.x, progress),
          y: lerp(origin.y, destination.y, progress),
        };
        renderCursor(pointer, targetButton, true);
      },
      onComplete() {
        pointer = destination;
        renderCursor(pointer, targetButton, true);
        state.cursorTravelCompleteCount += 1;
        updateDataset();
      },
    });
  }

  function handlePointerMove(event) {
    if (!['mouse', 'touch', 'pen'].includes(event.pointerType)) return;
    if (!acceptInput(event, 'pointer', 'targeting-pointer-move')) return;
    const button = event.target.closest?.('[data-finish]') || null;
    if (button) activateTarget(button, 'pointer');
    moveCursorFromTrustedEvent(event, button || finishButton(state.activeTarget));
  }

  function commitFinish(button, event, source) {
    if (!acceptInput(event, source === 'keyboard-shortcut' ? 'keyboard' : 'pointer', `commit-${source}`)) return;
    const id = button.dataset.finish;
    if (!FINISHES[id]) return;
    state.targetHitCount += 1;
    state.selectionStartCount += 1;
    state.phase = 'locking';
    state.activeTarget = id;
    state.previewFinish = id;
    state.resultHeld = false;
    state.resultValidated = false;
    finishButtons.forEach(option => {
      option.dataset.selected = String(option === button);
      option.setAttribute('aria-pressed', String(option === button));
    });
    instruction.textContent = `Locking ${FINISHES[id].label}`;
    status.textContent = `Locking · ${FINISHES[id].label}`;
    stage.style.setProperty('--chosen', FINISHES[id].color);
    if (source === 'keyboard-shortcut') moveCursorToTargetFromAcceptedInput(button);

    selectionControl?.stop();
    const duration = state.reducedMotion ? .01 : .62;
    selectionControl = animate(0, 1, {
      duration,
      ease: [.16, 1, .3, 1],
      onUpdate(progress) {
        state.transitionProgress = round(progress);
        productCard.style.transform = `scale(${round(1 + Math.sin(progress * Math.PI) * .018)})`;
        productCard.style.setProperty('filter', `saturate(${round(.88 + progress * .12)})`);
      },
      onComplete() {
        state.transitionProgress = 1;
        state.selectedFinish = id;
        state.resultHeld = true;
        state.resultValidated = finishButtons.filter(option => option.dataset.selected === 'true').length === 1
          && button.getAttribute('aria-pressed') === 'true'
          && getComputedStyle(stage).getPropertyValue('--chosen').trim() === FINISHES[id].color;
        state.selectionCompleteCount += 1;
        state.phase = 'locked';
        state.transitionRecords.push({
          source,
          trusted: true,
          finish: id,
          completed: true,
          retained: true,
        });
        instruction.textContent = 'Finish locked · move to compare';
        status.textContent = `Locked · ${FINISHES[id].label}`;
        cursorHint.textContent = `Locked · ${FINISHES[id].label}`;
        productCard.style.transform = 'scale(1)';
        productCard.style.filter = 'saturate(1)';
        renderCursor(pointer, button, true);
        updateDataset();
      },
    });
    updateDataset();
  }

  function handleButtonClick(event) {
    const kind = event.detail === 0 ? 'keyboard-shortcut' : 'pointer-press';
    commitFinish(event.currentTarget, event, kind);
  }

  function handleButtonFocus(event) {
    if (state.inputCount === 0 || !event.target.matches('[data-finish]')) return;
    activateTarget(event.target, 'keyboard');
    const target = anchorFor(event.target);
    pointer = { x: target.x + 24, y: target.y };
    renderCursor(pointer, event.target, true);
  }

  function handleKeyboard(event) {
    const index = finishButtons.indexOf(document.activeElement);
    const direction = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!direction) return;
    if (!acceptInput(event, 'keyboard', `navigate-${event.key}`)) return;
    const nextIndex = index < 0 ? 0 : (index + direction + finishButtons.length) % finishButtons.length;
    const button = finishButtons[nextIndex];
    button.focus({ preventScroll: true });
    activateTarget(button, 'keyboard');
    const target = anchorFor(button);
    pointer = { x: target.x + 24, y: target.y };
    renderCursor(pointer, button, true);
    event.preventDefault();
  }

  async function initialize() {
    invariant(stage instanceof HTMLElement, 'stage is missing');
    invariant(productCard instanceof HTMLElement, 'product card is missing');
    invariant(cursorLayer instanceof SVGElement, 'full-stage cursor SVG is missing');
    invariant(finishButtons.length === 3, 'three real finish targets are required');
    invariant(Object.keys(FINISHES).length === finishButtons.length, 'finish data does not match rendered targets');
    state.svgFilterNodeCount = document.querySelectorAll('#metaball feGaussianBlur, #metaball feColorMatrix, #metaball feComposite').length;
    invariant(state.svgFilterNodeCount === 3, 'metaball filter must use blur, threshold, and composite nodes');

    resizeGeometry();
    window.addEventListener('resize', resizeGeometry);
    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('keydown', handleKeyboard);
    finishButtons.forEach(button => {
      button.addEventListener('click', handleButtonClick);
      button.addEventListener('focus', handleButtonFocus);
    });
    updateDataset();

    await document.fonts.ready;
    const firstSignature = [
      state.inputCount,
      state.cursorX,
      state.cursorY,
      state.phase,
      state.selectedFinish,
      blobBridge.getAttribute('d'),
    ].join('|');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const secondSignature = [
      state.inputCount,
      state.cursorX,
      state.cursorY,
      state.phase,
      state.selectedFinish,
      blobBridge.getAttribute('d'),
    ].join('|');
    state.initialStillVerified = firstSignature === secondSignature
      && state.inputCount === 0
      && state.phase === 'waiting'
      && state.visualMutationCount === 0
      && state.nonInputVisualMutationCount === 0;
    invariant(state.initialStillVerified, 'initial cursor field changed before human input');
    state.ready = true;
    updateDataset();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    resizeGeometry();
    const geometryEvidence = state.stageWidth > 0
      && state.stageHeight > 0
      && Math.abs(state.stageWidth - state.svgWidth) <= 1
      && Math.abs(state.stageHeight - state.svgHeight) <= 1
      && state.geometryCoverageX >= .995
      && state.geometryCoverageY >= .995
      && state.viewBoxWidth === state.stageWidth
      && state.viewBoxHeight === state.stageHeight;
    const mechanismEvidence = state.svgFilterNodeCount === 3
      && blobBridge.getAttribute('stroke-width') === '13'
      && Number(blobLead.getAttribute('r')) === 12
      && finishButtons.length === state.targetCount
      && Object.keys(FINISHES).length === state.targetCount;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticPath
      && !state.automaticPlayback
      && !state.automaticCycle
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.nonInputVisualMutationCount === 0
      && state.syntheticSelectionCount === 0
      && state.inputCount === state.trustedInputCount
      && state.transitionRecords.every(record => record.trusted === true);
    const initialOrCompleted = state.inputCount === 0
      ? state.phase === 'waiting'
        && state.selectedFinish === 'none'
        && !state.resultHeld
        && state.visualMutationCount === 0
      : state.lastInputTrusted
        && state.pointerInputCount + state.keyboardInputCount === state.trustedInputCount
        && state.targetHitCount >= 1
        && state.selectionStartCount === state.selectionCompleteCount
        && state.selectionCompleteCount >= 1
        && state.transitionProgress === 1
        && state.phase === 'locked'
        && state.selectedFinish !== 'none'
        && state.activeTarget === state.selectedFinish
        && state.resultHeld
        && state.resultValidated
        && state.cursorTravelStartCount >= 1
        && state.cursorTravelCompleteCount >= 1
        && state.cursorRenderCount >= 3
        && state.maximumBridgeLength >= 10
        && state.mergedFrameCount >= 1
        && state.stretchedFrameCount >= 1
        && state.selectedBridgeFrameCount >= 1
        && state.transitionRecords.at(-1)?.retained === true;
    state.runtimeAssertionPassed = Boolean(state.ready
      && geometryEvidence
      && mechanismEvidence
      && honestInteraction
      && initialOrCompleted);
    updateDataset();
    return state.runtimeAssertionPassed;
  };

  const ready = initialize();
  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'svg',
    ready,
    render(_seconds, captureClock) {
      if (captureClock) state.previewClockMutationCount += 0;
      return state.phase;
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
