import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#mine-stage');
  const footer = document.querySelector('#brand-footer');
  const board = document.querySelector('#mine-board');
  const gameStatus = document.querySelector('#game-status');
  const mineCounter = document.querySelector('#mine-counter');
  const flagModeButton = document.querySelector('#flag-mode');
  const resetButton = document.querySelector('#mine-reset');
  const rewardCard = document.querySelector('#reward-card');
  const rewardSeal = document.querySelector('#reward-seal');
  const rewardName = document.querySelector('#reward-name');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !footer || !board || !gameStatus || !mineCounter || !flagModeButton || !resetButton || !rewardCard || !rewardSeal || !rewardName) {
    throw new Error('Minesweeper footer DOM is incomplete');
  }

  const columns = 8;
  const rows = 4;
  const cellCount = columns * rows;
  const bombIndices = [5, 13, 18, 26];
  const bombs = new Set(bombIndices);
  const safeCellCount = cellCount - bombs.size;
  const revealed = new Set();
  const flagged = new Set();

  const counterKeys = [
    'inputCount',
    'pointerInputCount',
    'keyboardInputCount',
    'touchInputCount',
    'cellActionCount',
    'revealActionCount',
    'flagActionCount',
    'contextFlagCount',
    'modeToggleCount',
    'resetButtonCount',
    'escapeResetCount',
    'resetCount',
    'keyboardNavigationCount',
    'keyboardRevealCount',
    'keyboardFlagCount',
    'cascadeCellRevealCount',
    'gameStartCount',
    'winCount',
    'lossCount',
    'invalidActionCount',
    'motionStartCount',
    'motionCompleteCount',
    'motionCancelCount',
    'reducedMotionDirectCount',
    'motionRevision',
    'renderCount',
  ];

  const state = {
    id: 'playable-brand-minesweeper-footer',
    automaticSeededPlay: false,
    automaticRehearsal: false,
    previewClockDriven: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    phase: 'ready',
    mode: 'reveal',
    focusedIndex: 0,
    bombIndices: [...bombIndices],
    revealedIndices: [],
    flaggedIndices: [],
    remainingSafeCount: safeCellCount,
    minesRemaining: bombs.size,
    rewardUnlocked: false,
    animationActive: false,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    touchInputCount: 0,
    cellActionCount: 0,
    revealActionCount: 0,
    flagActionCount: 0,
    contextFlagCount: 0,
    modeToggleCount: 0,
    resetButtonCount: 0,
    escapeResetCount: 0,
    resetCount: 0,
    keyboardNavigationCount: 0,
    keyboardRevealCount: 0,
    keyboardFlagCount: 0,
    cascadeCellRevealCount: 0,
    gameStartCount: 0,
    winCount: 0,
    lossCount: 0,
    invalidActionCount: 0,
    motionStartCount: 0,
    motionCompleteCount: 0,
    motionCancelCount: 0,
    reducedMotionDirectCount: 0,
    motionRevision: 0,
    renderCount: 0,
    semanticGridValidated: false,
    initialStaticVerified: false,
    reducedMotion: reducedMotion.matches,
    lastTrustedEvent: 'none',
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let motions = [];
  let lastPointerType = 'mouse';

  const nextFrames = (count = 2) => new Promise(resolve => {
    const advance = remaining => {
      if (remaining <= 0) resolve();
      else requestAnimationFrame(() => advance(remaining - 1));
    };
    advance(count);
  });

  const cells = Array.from({ length: cellCount }, (_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mine-cell';
    button.dataset.index = String(index);
    button.dataset.state = 'covered';
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-rowindex', String(Math.floor(index / columns) + 1));
    button.setAttribute('aria-colindex', String(index % columns + 1));
    button.tabIndex = index === 0 ? 0 : -1;
    board.append(button);
    return button;
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
    else {
      state.pointerInputCount += 1;
      if (lastPointerType === 'touch') state.touchInputCount += 1;
    }
    return true;
  };

  const neighboringIndices = index => {
    const x = index % columns;
    const y = Math.floor(index / columns);
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < columns && ny >= 0 && ny < rows) neighbors.push(ny * columns + nx);
      }
    }
    return neighbors;
  };

  const nearbyBombs = index => neighboringIndices(index).filter(neighbor => bombs.has(neighbor)).length;

  const stopMotions = () => {
    if (state.animationActive) state.motionCancelCount += 1;
    for (const motion of motions) motion.stop();
    motions = [];
    state.animationActive = false;
    cells.forEach(cell => {
      cell.style.opacity = '1';
      cell.style.transform = 'none';
    });
    board.style.transform = 'none';
    rewardSeal.style.transform = 'none';
  };

  const runMotion = async (changedIndices, eventType) => {
    if (state.animationActive) stopMotions();
    const uniqueIndices = [...new Set(changedIndices)];
    if (uniqueIndices.length === 0) return;
    const revision = ++state.motionRevision;

    if (state.reducedMotion) {
      state.reducedMotionDirectCount += 1;
      return;
    }

    state.motionStartCount += 1;
    state.animationActive = true;
    const options = { duration: .24, ease: [.22, 1, .36, 1] };
    motions = uniqueIndices.map(index => animate(cells[index], {
      opacity: [.55, 1],
      transform: ['scale(.86)', 'scale(1)'],
    }, options));

    if (eventType === 'loss') {
      motions.push(animate(board, {
        transform: ['translateX(0px)', 'translateX(-3px)', 'translateX(3px)', 'translateX(-1px)', 'translateX(0px)'],
      }, { duration: .32, ease: 'easeOut' }));
    }

    if (eventType === 'win') {
      motions.push(animate(rewardSeal, {
        transform: ['rotate(0deg) scale(.78)', 'rotate(9deg) scale(1.12)', 'rotate(0deg) scale(1)'],
      }, { duration: .48, ease: [.22, 1, .36, 1] }));
    }

    await Promise.allSettled(motions.map(motion => motion.finished));
    if (revision !== state.motionRevision) return;
    motions = [];
    state.animationActive = false;
    state.motionCompleteCount += 1;
  };

  const syncStateArrays = () => {
    state.revealedIndices = [...revealed].sort((a, b) => a - b);
    state.flaggedIndices = [...flagged].sort((a, b) => a - b);
    state.remainingSafeCount = safeCellCount - state.revealedIndices.filter(index => !bombs.has(index)).length;
    state.minesRemaining = bombs.size - flagged.size;
    state.rewardUnlocked = state.phase === 'won';
  };

  const cellState = index => {
    if (revealed.has(index)) return bombs.has(index) ? 'bomb' : 'safe';
    if (flagged.has(index)) return state.phase === 'lost' && !bombs.has(index) ? 'wrong' : 'flagged';
    return 'covered';
  };

  const cellLabel = index => {
    const row = Math.floor(index / columns) + 1;
    const column = index % columns + 1;
    const visualState = cellState(index);
    if (visualState === 'safe') {
      const near = nearbyBombs(index);
      return `Row ${row}, column ${column}, revealed, ${near} neighboring mine${near === 1 ? '' : 's'}`;
    }
    if (visualState === 'bomb') return `Row ${row}, column ${column}, mine revealed`;
    if (visualState === 'flagged') return `Row ${row}, column ${column}, flagged`;
    if (visualState === 'wrong') return `Row ${row}, column ${column}, incorrect flag`;
    return `Row ${row}, column ${column}, covered`;
  };

  const syncUi = () => {
    syncStateArrays();
    board.dataset.phase = state.phase;
    flagModeButton.setAttribute('aria-pressed', String(state.mode === 'flag'));
    flagModeButton.textContent = state.mode === 'flag' ? 'Flagging on' : 'Flag mode';
    mineCounter.textContent = `${String(Math.max(0, state.minesRemaining)).padStart(2, '0')} flags left`;
    rewardCard.dataset.unlocked = String(state.rewardUnlocked);
    rewardName.textContent = state.rewardUnlocked
      ? 'Field Notes wallpaper · Unlocked'
      : 'Field Notes wallpaper · Locked';

    if (state.phase === 'won') gameStatus.textContent = 'Field clear · reward unlocked';
    else if (state.phase === 'lost') gameStatus.textContent = 'Mine found · field paused';
    else if (state.mode === 'flag') gameStatus.textContent = 'Flag mode active · mark suspected mines';
    else if (state.phase === 'playing') gameStatus.textContent = `${safeCellCount - state.remainingSafeCount}/${safeCellCount} safe · keep looking`;
    else gameStatus.textContent = 'Field ready · choose a square';

    cells.forEach((cell, index) => {
      const visualState = cellState(index);
      cell.dataset.state = visualState;
      cell.tabIndex = index === state.focusedIndex ? 0 : -1;
      cell.setAttribute('aria-label', cellLabel(index));
      cell.setAttribute('aria-selected', String(index === state.focusedIndex));
      if (visualState === 'safe') {
        const near = nearbyBombs(index);
        cell.dataset.near = String(near);
        cell.textContent = near > 0 ? String(near) : '';
      } else {
        delete cell.dataset.near;
        if (visualState === 'bomb') cell.textContent = '✦';
        else if (visualState === 'flagged') cell.textContent = '◆';
        else if (visualState === 'wrong') cell.textContent = '×';
        else cell.textContent = '';
      }
    });
  };

  const startGameIfNeeded = () => {
    if (state.phase !== 'ready') return;
    state.phase = 'playing';
    state.gameStartCount += 1;
  };

  const revealCell = index => {
    if (state.phase === 'won' || state.phase === 'lost' || revealed.has(index) || flagged.has(index)) {
      state.invalidActionCount += 1;
      return;
    }

    startGameIfNeeded();
    state.revealActionCount += 1;
    const changed = [];

    if (bombs.has(index)) {
      for (const bomb of bombs) {
        flagged.delete(bomb);
        if (!revealed.has(bomb)) changed.push(bomb);
        revealed.add(bomb);
      }
      state.phase = 'lost';
      state.lossCount += 1;
      syncUi();
      void runMotion(changed, 'loss');
      return;
    }

    const queue = [index];
    const queued = new Set(queue);
    while (queue.length > 0) {
      const current = queue.shift();
      if (revealed.has(current) || flagged.has(current) || bombs.has(current)) continue;
      revealed.add(current);
      changed.push(current);
      if (nearbyBombs(current) === 0) {
        for (const neighbor of neighboringIndices(current)) {
          if (!queued.has(neighbor) && !bombs.has(neighbor) && !flagged.has(neighbor)) {
            queued.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }

    state.cascadeCellRevealCount += changed.length;
    const revealedSafeCount = [...revealed].filter(cellIndex => !bombs.has(cellIndex)).length;
    if (revealedSafeCount === safeCellCount) {
      state.phase = 'won';
      state.winCount += 1;
    }
    syncUi();
    void runMotion(changed, state.phase === 'won' ? 'win' : 'reveal');
  };

  const toggleFlag = index => {
    if (state.phase === 'won' || state.phase === 'lost' || revealed.has(index)) {
      state.invalidActionCount += 1;
      return;
    }
    startGameIfNeeded();
    if (flagged.has(index)) flagged.delete(index);
    else if (flagged.size < bombs.size) flagged.add(index);
    else {
      state.invalidActionCount += 1;
      return;
    }
    state.flagActionCount += 1;
    syncUi();
    void runMotion([index], 'flag');
  };

  const focusCell = index => {
    const nextIndex = Math.max(0, Math.min(cellCount - 1, index));
    state.focusedIndex = nextIndex;
    cells.forEach((cell, cellIndex) => {
      cell.tabIndex = cellIndex === nextIndex ? 0 : -1;
      cell.setAttribute('aria-selected', String(cellIndex === nextIndex));
    });
    cells[nextIndex].focus({ preventScroll: true });
  };

  const resetGame = cause => {
    const changed = [...new Set([...revealed, ...flagged])];
    revealed.clear();
    flagged.clear();
    state.phase = 'ready';
    state.mode = 'reveal';
    state.focusedIndex = 0;
    state.resetCount += 1;
    syncUi();
    if (changed.length > 0) void runMotion(changed, cause);
  };

  document.addEventListener('pointerdown', event => {
    lastPointerType = event.pointerType || 'mouse';
  }, { capture: true });

  cells.forEach((cell, index) => {
    cell.addEventListener('focus', () => {
      state.focusedIndex = index;
      cells.forEach((candidate, candidateIndex) => {
        candidate.tabIndex = candidateIndex === index ? 0 : -1;
        candidate.setAttribute('aria-selected', String(candidateIndex === index));
      });
    });

    cell.addEventListener('click', event => {
      if (event.detail === 0) return;
      if (!recordInput('pointer', event, `${lastPointerType}-cell-${state.mode}`)) return;
      state.focusedIndex = index;
      state.cellActionCount += 1;
      if (state.mode === 'flag') toggleFlag(index);
      else revealCell(index);
    });

    cell.addEventListener('contextmenu', event => {
      event.preventDefault();
      if (!recordInput('pointer', event, `${lastPointerType}-context-flag`)) return;
      state.focusedIndex = index;
      state.cellActionCount += 1;
      state.contextFlagCount += 1;
      toggleFlag(index);
    });

    cell.addEventListener('keydown', event => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = row * columns + Math.max(0, column - 1);
      else if (event.key === 'ArrowRight') nextIndex = row * columns + Math.min(columns - 1, column + 1);
      else if (event.key === 'ArrowUp') nextIndex = Math.max(0, row - 1) * columns + column;
      else if (event.key === 'ArrowDown') nextIndex = Math.min(rows - 1, row + 1) * columns + column;
      else if (event.key === 'Home') nextIndex = row * columns;
      else if (event.key === 'End') nextIndex = row * columns + columns - 1;

      if (nextIndex !== index || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        if (!recordInput('keyboard', event, `keyboard-${event.key.toLowerCase()}`)) return;
        state.keyboardNavigationCount += 1;
        focusCell(nextIndex);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!recordInput('keyboard', event, event.key === 'Enter' ? 'keyboard-reveal-enter' : 'keyboard-reveal-space')) return;
        state.cellActionCount += 1;
        state.keyboardRevealCount += 1;
        revealCell(index);
        return;
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        if (!recordInput('keyboard', event, 'keyboard-flag')) return;
        state.cellActionCount += 1;
        state.keyboardFlagCount += 1;
        toggleFlag(index);
      }
    });
  });

  flagModeButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!recordInput(kind, event, `${lastPointerType}-flag-mode`)) return;
    state.mode = state.mode === 'flag' ? 'reveal' : 'flag';
    state.modeToggleCount += 1;
    syncUi();
  });

  resetButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!recordInput(kind, event, `${lastPointerType}-new-field`)) return;
    state.resetButtonCount += 1;
    resetGame('button-reset');
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const changed = state.phase !== 'ready' || flagged.size > 0 || revealed.size > 0 || state.mode !== 'reveal';
    if (!changed) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, 'escape-reset')) return;
    state.escapeResetCount += 1;
    resetGame('escape-reset');
    if (cells.includes(document.activeElement)) document.activeElement.blur();
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (state.animationActive) stopMotions();
    cells.forEach(cell => {
      cell.style.opacity = '1';
      cell.style.transform = 'none';
    });
    rewardSeal.style.transform = 'none';
    board.style.transform = 'none';
  });

  syncUi();

  const ready = (async () => {
    await document.fonts.ready;
    await nextFrames();
    const firstRect = cells[0].getBoundingClientRect();
    state.semanticGridValidated = cells.length === cellCount
      && cells.every((cell, index) => cell.getAttribute('role') === 'gridcell'
        && cell.getAttribute('aria-rowindex') === String(Math.floor(index / columns) + 1)
        && cell.getAttribute('aria-colindex') === String(index % columns + 1))
      && firstRect.width > 0
      && firstRect.height > 0;
    state.initialStaticVerified = state.semanticGridValidated
      && state.phase === 'ready'
      && state.revealedIndices.length === 0
      && state.flaggedIndices.length === 0
      && state.inputCount === 0
      && state.motionStartCount === 0
      && state.motionCompleteCount === 0
      && state.rewardUnlocked === false;
  })();

  const render = () => {
    state.renderCount += 1;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();

    const stageRect = stage.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();
    const revealedSet = new Set(state.revealedIndices);
    const flaggedSet = new Set(state.flaggedIndices);
    const arraysValid = state.revealedIndices.every(index => Number.isInteger(index) && index >= 0 && index < cellCount)
      && state.flaggedIndices.every(index => Number.isInteger(index) && index >= 0 && index < cellCount)
      && revealedSet.size === state.revealedIndices.length
      && flaggedSet.size === state.flaggedIndices.length
      && state.revealedIndices.every(index => !flaggedSet.has(index));
    const safeRevealed = state.revealedIndices.filter(index => !bombs.has(index)).length;
    const countsMatch = state.remainingSafeCount === safeCellCount - safeRevealed
      && state.minesRemaining === bombs.size - state.flaggedIndices.length;
    const phaseValid = ['ready', 'playing', 'won', 'lost'].includes(state.phase)
      && (state.phase !== 'ready' || state.revealedIndices.length === 0 && state.flaggedIndices.length === 0)
      && (state.phase !== 'won' || safeRevealed === safeCellCount && state.rewardUnlocked)
      && (state.phase !== 'lost' || bombIndices.every(index => revealedSet.has(index)) && !state.rewardUnlocked);
    const cellsMatch = cells.every((cell, index) => cell.dataset.state === cellState(index)
      && cell.getAttribute('aria-label') === cellLabel(index)
      && cell.getAttribute('aria-selected') === String(index === state.focusedIndex));
    const rovingFocusValid = cells.filter(cell => cell.tabIndex === 0).length === 1
      && cells[state.focusedIndex]?.tabIndex === 0;
    const cellsWithinBoard = cells.every(cell => {
      const rect = cell.getBoundingClientRect();
      return rect.width > 0
        && rect.height > 0
        && rect.left >= boardRect.left - 1
        && rect.top >= boardRect.top - 1
        && rect.right <= boardRect.right + 1
        && rect.bottom <= boardRect.bottom + 1;
    });
    const countersValid = counterKeys.every(key => Number.isInteger(state[key]) && state[key] >= 0)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.touchInputCount <= state.pointerInputCount
      && state.motionCompleteCount <= state.motionStartCount;
    const viewportValid = footerRect.left >= -1
      && footerRect.top >= -1
      && footerRect.right <= innerWidth + 1
      && footerRect.bottom <= innerHeight + 1
      && stageRect.width <= innerWidth + 1
      && stageRect.height <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;

    return typeof animate === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && document.querySelectorAll('.mine-cell').length === cellCount
      && board.getAttribute('aria-rowcount') === String(rows)
      && board.getAttribute('aria-colcount') === String(columns)
      && state.automaticSeededPlay === false
      && state.automaticRehearsal === false
      && state.previewClockDriven === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.semanticGridValidated
      && state.initialStaticVerified
      && arraysValid
      && countsMatch
      && phaseValid
      && cellsMatch
      && rovingFocusValid
      && cellsWithinBoard
      && rewardCard.dataset.unlocked === String(state.rewardUnlocked)
      && flagModeButton.getAttribute('aria-pressed') === String(state.mode === 'flag')
      && countersValid
      && viewportValid
      && state.renderCount > 0;
  };

  window.addEventListener('beforeunload', () => {
    for (const motion of motions) motion.stop();
  }, { once: true });

  installPreviewController({
    id: 'playable-brand-minesweeper-footer',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
