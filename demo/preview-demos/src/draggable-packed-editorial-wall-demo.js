import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#editorial-stage');
  const shell = document.querySelector('#editorial-shell');
  const wall = document.querySelector('#editorial-wall');
  const field = document.querySelector('#packing-field');
  const wallStatus = document.querySelector('#wall-status');
  const repackButton = document.querySelector('#repack-button');
  const resetButton = document.querySelector('#reset-button');
  const tiles = [...document.querySelectorAll('.story-tile')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !shell || !wall || !field || !wallStatus || !repackButton || !resetButton || tiles.length !== 6) {
    throw new Error('Editorial wall DOM is incomplete');
  }

  const tileById = new Map(tiles.map(tile => [tile.dataset.tileId, tile]));
  const initialOrder = tiles.map(tile => tile.dataset.tileId);
  const tileLabels = {
    'night-market': 'Night Market',
    'neon-memory': 'Neon Memory',
    'field-notes': 'Taipei Field Notes',
    'return-rate': 'Return Rate',
    maker: 'Mina Profile',
    'route-credits': 'Route Credits',
  };

  const initialSlots = [
    { x: 0, y: 0, w: .34, h: .49 },
    { x: .36, y: 0, w: .40, h: .23 },
    { x: .36, y: .26, w: .23, h: .23 },
    { x: .61, y: .26, w: .15, h: .23 },
    { x: 0, y: .52, w: .20, h: .33 },
    { x: .22, y: .52, w: .54, h: .33 },
  ];
  const packedSlots = [
    { x: 0, y: 0, w: .32, h: .42 },
    { x: .34, y: 0, w: .42, h: .42 },
    { x: 0, y: .45, w: .22, h: .40 },
    { x: .24, y: .45, w: .25, h: .40 },
    { x: .51, y: .45, w: .25, h: .40 },
  ];
  const holdingSlot = { x: .80, y: .17, w: .18, h: .62 };

  const counterKeys = [
    'inputCount',
    'pointerInputCount',
    'keyboardInputCount',
    'dragStartCount',
    'pointerMoveCount',
    'dragReleaseCount',
    'dragCancelCount',
    'snapBackCount',
    'extractCount',
    'repackCount',
    'keyboardMoveCount',
    'keyboardRepackCount',
    'buttonRepackCount',
    'buttonResetCount',
    'escapeResetCount',
    'resetCount',
    'layoutStartCount',
    'layoutCompleteCount',
    'layoutCancelCount',
    'reducedMotionDirectCount',
    'layoutRevision',
    'renderCount',
  ];

  const state = {
    id: 'draggable-packed-editorial-wall',
    automaticPacking: false,
    automaticRehearsal: false,
    previewClockDriven: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    phase: 'initial',
    selectedTileId: initialOrder[0],
    extractedTileId: null,
    activeDragTileId: null,
    order: [...initialOrder],
    layoutAnimationActive: false,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    dragStartCount: 0,
    pointerMoveCount: 0,
    dragReleaseCount: 0,
    dragCancelCount: 0,
    snapBackCount: 0,
    extractCount: 0,
    repackCount: 0,
    keyboardMoveCount: 0,
    keyboardRepackCount: 0,
    buttonRepackCount: 0,
    buttonResetCount: 0,
    escapeResetCount: 0,
    resetCount: 0,
    layoutStartCount: 0,
    layoutCompleteCount: 0,
    layoutCancelCount: 0,
    reducedMotionDirectCount: 0,
    layoutRevision: 0,
    renderCount: 0,
    initialPositionsValidated: false,
    initialStaticVerified: false,
    reducedMotion: reducedMotion.matches,
    lastTrustedEvent: 'none',
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let layoutMotions = [];
  let activeDrag = null;
  let lastPointerType = 'mouse';

  const nextFrames = (count = 2) => new Promise(resolve => {
    const advance = remaining => {
      if (remaining <= 0) resolve();
      else requestAnimationFrame(() => advance(remaining - 1));
    };
    advance(count);
  });

  const recordInput = (kind, event, label) => {
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return false;
    }
    state.inputCount += 1;
    state.inputKind = kind;
    state.lastTrustedEvent = label;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
    return true;
  };

  const slotToPixels = slot => ({
    left: slot.x * field.clientWidth,
    top: slot.y * field.clientHeight,
    width: slot.w * field.clientWidth,
    height: slot.h * field.clientHeight,
  });

  const assignments = () => {
    const result = new Map();
    if (state.extractedTileId) {
      const remaining = state.order.filter(id => id !== state.extractedTileId);
      remaining.forEach((id, index) => result.set(id, slotToPixels(packedSlots[index])));
      result.set(state.extractedTileId, slotToPixels(holdingSlot));
    } else {
      state.order.forEach((id, index) => result.set(id, slotToPixels(initialSlots[index])));
    }
    return result;
  };

  const updateSemantics = () => {
    const extracted = state.extractedTileId;
    wall.dataset.layout = extracted ? 'repaired' : (state.order.join('|') === initialOrder.join('|') ? 'original' : 'reordered');
    for (const tile of tiles) {
      const isExtracted = tile.dataset.tileId === extracted;
      tile.classList.toggle('extracted', isExtracted);
      tile.setAttribute('aria-pressed', String(isExtracted));
      if (!activeDrag || activeDrag.tile !== tile) tile.setAttribute('aria-grabbed', 'false');
    }
    repackButton.textContent = extracted ? 'Return / Enter' : 'Repack / Enter';
  };

  const updateStatus = cause => {
    if (state.extractedTileId) {
      wallStatus.textContent = `${tileLabels[state.extractedTileId]} held · 5 stories repaired`;
    } else if (state.order.join('|') !== initialOrder.join('|')) {
      wallStatus.textContent = 'Editorial order updated';
    } else {
      wallStatus.textContent = 'Original rhythm';
    }
    if (cause === 'dragging') wallStatus.textContent = `Moving ${tileLabels[state.selectedTileId]}`;
  };

  const applyPosition = (tile, position) => {
    tile.style.left = `${position.left}px`;
    tile.style.top = `${position.top}px`;
    tile.style.width = `${position.width}px`;
    tile.style.height = `${position.height}px`;
    tile.style.transform = 'translate3d(0px, 0px, 0px) rotate(0deg) scale(1)';
  };

  const stopLayoutMotions = () => {
    if (state.layoutAnimationActive) state.layoutCancelCount += 1;
    for (const motion of layoutMotions) motion.stop();
    layoutMotions = [];
    state.layoutAnimationActive = false;
  };

  const settlePhase = () => {
    if (state.extractedTileId) state.phase = 'repaired';
    else if (state.order.join('|') === initialOrder.join('|')) state.phase = 'initial';
    else state.phase = 'reordered';
    state.activeDragTileId = null;
    state.layoutAnimationActive = false;
    updateSemantics();
    updateStatus();
  };

  const layoutTiles = async (animated, cause) => {
    if (state.layoutAnimationActive) stopLayoutMotions();
    const revision = ++state.layoutRevision;
    const targetPositions = assignments();
    updateSemantics();

    if (!animated || state.reducedMotion) {
      for (const [id, position] of targetPositions) applyPosition(tileById.get(id), position);
      if (animated && state.reducedMotion) state.reducedMotionDirectCount += 1;
      settlePhase();
      return;
    }

    state.layoutStartCount += 1;
    state.layoutAnimationActive = true;
    state.phase = cause;
    updateStatus();
    const options = { duration: .38, ease: [.22, 1, .36, 1] };
    layoutMotions = [...targetPositions].map(([id, position]) => animate(tileById.get(id), {
      left: `${position.left}px`,
      top: `${position.top}px`,
      width: `${position.width}px`,
      height: `${position.height}px`,
      transform: 'translate3d(0px, 0px, 0px) rotate(0deg) scale(1)',
    }, options));

    await Promise.allSettled(layoutMotions.map(motion => motion.finished));
    if (revision !== state.layoutRevision) return;
    layoutMotions = [];
    state.layoutCompleteCount += 1;
    settlePhase();
  };

  const toggleExtraction = (id, cause) => {
    if (state.extractedTileId === id || (cause === 'button-repack' && state.extractedTileId)) {
      state.extractedTileId = null;
      state.repackCount += 1;
    } else {
      state.extractedTileId = id;
      state.extractCount += 1;
    }
    void layoutTiles(true, cause);
  };

  const reorderTile = (id, direction) => {
    const currentIndex = state.order.indexOf(id);
    if (currentIndex < 0) return;
    const nextIndex = (currentIndex + direction + state.order.length) % state.order.length;
    [state.order[currentIndex], state.order[nextIndex]] = [state.order[nextIndex], state.order[currentIndex]];
    state.keyboardMoveCount += 1;
    void layoutTiles(true, 'keyboard-reorder');
  };

  const clearActiveDrag = () => {
    if (!activeDrag) return;
    activeDrag.tile.classList.remove('dragging');
    activeDrag.tile.setAttribute('aria-grabbed', 'false');
    activeDrag = null;
    state.activeDragTileId = null;
  };

  const resetWall = cause => {
    clearActiveDrag();
    state.extractedTileId = null;
    state.order.splice(0, state.order.length, ...initialOrder);
    state.resetCount += 1;
    void layoutTiles(true, cause);
  };

  document.addEventListener('pointerdown', event => {
    lastPointerType = event.pointerType || 'mouse';
  }, { capture: true });

  for (const tile of tiles) {
    tile.setAttribute('aria-grabbed', 'false');

    tile.addEventListener('focus', event => {
      if (!event.isTrusted) {
        state.syntheticInput = true;
        return;
      }
      state.selectedTileId = tile.dataset.tileId;
    });

    tile.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !recordInput('pointer', event, `${event.pointerType}-drag-start`)) return;
      if (state.layoutAnimationActive) stopLayoutMotions();
      if (event.pointerType === 'touch' || event.pointerType === 'pen') event.preventDefault();
      state.selectedTileId = tile.dataset.tileId;
      state.dragStartCount += 1;
      state.phase = 'dragging';
      state.activeDragTileId = tile.dataset.tileId;
      const rect = tile.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      activeDrag = {
        tile,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dx: 0,
        dy: 0,
        baseRect: rect,
        fieldRect,
      };
      tile.setPointerCapture(event.pointerId);
      tile.classList.add('dragging');
      tile.setAttribute('aria-grabbed', 'true');
      updateStatus('dragging');
    });

    tile.addEventListener('pointermove', event => {
      if (!activeDrag || activeDrag.tile !== tile || activeDrag.pointerId !== event.pointerId) return;
      if (!event.isTrusted) {
        state.syntheticInput = true;
        return;
      }
      const minDx = activeDrag.fieldRect.left - activeDrag.baseRect.left;
      const maxDx = activeDrag.fieldRect.right - activeDrag.baseRect.right;
      const minDy = activeDrag.fieldRect.top - activeDrag.baseRect.top;
      const maxDy = activeDrag.fieldRect.bottom - activeDrag.baseRect.bottom;
      activeDrag.dx = Math.max(minDx, Math.min(maxDx, event.clientX - activeDrag.startX));
      activeDrag.dy = Math.max(minDy, Math.min(maxDy, event.clientY - activeDrag.startY));
      state.pointerMoveCount += 1;
      tile.style.transform = `translate3d(${activeDrag.dx}px, ${activeDrag.dy}px, 0px) rotate(${activeDrag.dx * .018}deg) scale(1.025)`;
    });

    tile.addEventListener('pointerup', event => {
      if (!activeDrag || activeDrag.tile !== tile || activeDrag.pointerId !== event.pointerId) return;
      if (!recordInput('pointer', event, `${event.pointerType}-drag-release`)) return;
      const { dx, dy } = activeDrag;
      const distance = Math.hypot(dx, dy);
      const threshold = Math.max(5, Math.min(field.clientWidth, field.clientHeight) * .07);
      state.dragReleaseCount += 1;
      clearActiveDrag();
      if (distance >= threshold) {
        toggleExtraction(tile.dataset.tileId, 'pointer-extract');
      } else {
        state.snapBackCount += 1;
        void layoutTiles(true, 'pointer-snap-back');
      }
    });

    tile.addEventListener('pointercancel', event => {
      if (!activeDrag || activeDrag.tile !== tile || activeDrag.pointerId !== event.pointerId) return;
      if (!recordInput('pointer', event, `${event.pointerType}-drag-cancel`)) return;
      state.dragCancelCount += 1;
      clearActiveDrag();
      void layoutTiles(true, 'pointer-cancel');
    });

    tile.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (!recordInput('keyboard', event, `keyboard-${event.key.toLowerCase()}`)) return;
        state.selectedTileId = tile.dataset.tileId;
        reorderTile(tile.dataset.tileId, event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1);
        return;
      }

      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!recordInput('keyboard', event, event.key === 'Enter' ? 'keyboard-enter-repack' : 'keyboard-space-repack')) return;
      state.selectedTileId = tile.dataset.tileId;
      state.keyboardRepackCount += 1;
      toggleExtraction(tile.dataset.tileId, 'keyboard-repack');
    });
  }

  wall.addEventListener('keydown', event => {
    if (event.target !== wall || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, event.key === 'Enter' ? 'wall-enter-repack' : 'wall-space-repack')) return;
    state.keyboardRepackCount += 1;
    toggleExtraction(state.selectedTileId, 'keyboard-repack');
  });

  repackButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!recordInput(kind, event, `${lastPointerType}-repack-button`)) return;
    state.buttonRepackCount += 1;
    toggleExtraction(state.selectedTileId, 'button-repack');
  });

  resetButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!recordInput(kind, event, `${lastPointerType}-reset-button`)) return;
    state.buttonResetCount += 1;
    resetWall('button-reset');
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const isChanged = state.extractedTileId
      || state.order.join('|') !== initialOrder.join('|')
      || state.activeDragTileId
      || state.layoutAnimationActive;
    if (!isChanged) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, 'escape-reset')) return;
    state.escapeResetCount += 1;
    resetWall('escape-reset');
    if (tiles.includes(document.activeElement)) document.activeElement.blur();
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (state.layoutAnimationActive) stopLayoutMotions();
    void layoutTiles(false, 'motion-preference-change');
  });

  const positionMatches = (tile, expected, tolerance = .8) => {
    const fieldRect = field.getBoundingClientRect();
    const rect = tile.getBoundingClientRect();
    return Math.abs(rect.left - (fieldRect.left + expected.left)) <= tolerance
      && Math.abs(rect.top - (fieldRect.top + expected.top)) <= tolerance
      && Math.abs(rect.width - expected.width) <= tolerance
      && Math.abs(rect.height - expected.height) <= tolerance;
  };

  const currentPositionsValid = () => {
    const expected = assignments();
    return [...expected].every(([id, position]) => positionMatches(tileById.get(id), position));
  };

  const ready = (async () => {
    await document.fonts.ready;
    await nextFrames();
    await layoutTiles(false, 'initial-layout');
    await nextFrames();
    state.initialPositionsValidated = currentPositionsValid();
    state.initialStaticVerified = state.initialPositionsValidated
      && state.inputCount === 0
      && state.layoutStartCount === 0
      && state.layoutCompleteCount === 0
      && state.extractedTileId === null
      && state.phase === 'initial'
      && state.order.join('|') === initialOrder.join('|');
  })();

  const render = () => {
    state.renderCount += 1;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();

    const fieldRect = field.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const tileRects = tiles.map(tile => ({ tile, rect: tile.getBoundingClientRect() }));
    const allWithinField = tileRects.every(({ rect }) => rect.left >= fieldRect.left - 1
      && rect.top >= fieldRect.top - 1
      && rect.right <= fieldRect.right + 1
      && rect.bottom <= fieldRect.bottom + 1);
    const nonOverlapping = state.layoutAnimationActive || state.activeDragTileId || tileRects.every((a, index) => tileRects.slice(index + 1).every(b => {
      const overlapWidth = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left));
      const overlapHeight = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top));
      return overlapWidth * overlapHeight < .5;
    }));
    const pressedMatch = tiles.every(tile => tile.getAttribute('aria-pressed') === String(tile.dataset.tileId === state.extractedTileId));
    const classMatch = tiles.every(tile => tile.classList.contains('extracted') === (tile.dataset.tileId === state.extractedTileId));
    const permutationValid = state.order.length === initialOrder.length
      && new Set(state.order).size === initialOrder.length
      && initialOrder.every(id => state.order.includes(id));
    const countersValid = counterKeys.every(key => Number.isInteger(state[key]) && state[key] >= 0)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.layoutCompleteCount <= state.layoutStartCount;
    const expectedPositionValid = state.layoutAnimationActive || state.activeDragTileId || currentPositionsValid();
    const viewportValid = shellRect.left >= -1
      && shellRect.top >= -1
      && shellRect.right <= innerWidth + 1
      && shellRect.bottom <= innerHeight + 1
      && stageRect.width <= innerWidth + 1
      && stageRect.height <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;

    return typeof animate === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && document.querySelectorAll('.story-tile').length === 6
      && state.automaticPacking === false
      && state.automaticRehearsal === false
      && state.previewClockDriven === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.initialPositionsValidated
      && state.initialStaticVerified
      && permutationValid
      && countersValid
      && pressedMatch
      && classMatch
      && expectedPositionValid
      && allWithinField
      && nonOverlapping
      && viewportValid
      && state.renderCount > 0;
  };

  window.addEventListener('beforeunload', () => {
    for (const motion of layoutMotions) motion.stop();
  }, { once: true });

  installPreviewController({
    id: 'draggable-packed-editorial-wall',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
