import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#hiring-stage');
  const shell = document.querySelector('#hiring-shell');
  const roleList = document.querySelector('#role-list');
  const roleButtons = [...document.querySelectorAll('[data-role-id]')];
  const historyNodes = [...document.querySelectorAll('.history-node')];
  const memoryStatus = document.querySelector('#memory-status');
  const historyNote = document.querySelector('#history-note');
  const badge = document.querySelector('#interest-badge');
  const badgeKicker = document.querySelector('#interest-kicker');
  const badgeCount = document.querySelector('#interest-count');
  const badgeTitle = document.querySelector('#interest-title');
  const badgeDetail = document.querySelector('#interest-detail');
  const undoButton = document.querySelector('#undo-last');
  const clearButton = document.querySelector('#clear-history');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !shell || !roleList || roleButtons.length !== 3 || historyNodes.length !== 3
    || !memoryStatus || !historyNote || !badge || !badgeKicker || !badgeCount
    || !badgeTitle || !badgeDetail || !undoButton || !clearButton) {
    throw new Error('Hiring-interest memory DOM is incomplete');
  }

  const roleById = new Map(roleButtons.map(button => [button.dataset.roleId, {
    id: button.dataset.roleId,
    name: button.dataset.roleName,
    button,
  }]));
  const counterKeys = [
    'inputCount',
    'pointerInputCount',
    'keyboardInputCount',
    'roleSelectionCount',
    'duplicateSelectionCount',
    'undoCount',
    'clearCount',
    'escapeUndoCount',
    'transitionStartCount',
    'transitionCompleteCount',
    'transitionCancelCount',
    'finiteTransitionStepCount',
    'motionControlCreateCount',
    'renderCount',
  ];

  const state = {
    id: 'interaction-history-hiring-badge',
    task: 'human-built-role-interest-history-shapes-a-persistent-hiring-invitation',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'trusted-role-selections-append-to-session-history-and-recompose-the-hiring-badge',
    assetStrategy: 'code-native-dom-state-no-functional-raster-input-required',
    captureType: 'hybrid',
    acceptedHumanInputs: ['trusted-pointer-click', 'trusted-keyboard-activation', 'escape-undo', 'visible-undo-button', 'visible-clear-button'],
    causality: 'trusted-human-selection-mutates-history-before-one-finite-seekable-motion-response',
    automaticPlayback: false,
    automaticCycle: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockDrivesFiniteTransitionAfterInput: true,
    userInitiatedChangesOnly: true,
    syntheticInput: false,
    history: [],
    historyLength: 0,
    matchedRoleIds: [],
    badgePhase: 'open',
    transitionActive: false,
    transitionDuration: .52,
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    roleSelectionCount: 0,
    duplicateSelectionCount: 0,
    undoCount: 0,
    clearCount: 0,
    escapeUndoCount: 0,
    transitionStartCount: 0,
    transitionCompleteCount: 0,
    transitionCancelCount: 0,
    finiteTransitionStepCount: 0,
    motionControlCreateCount: 0,
    renderCount: 0,
    initialStaticVerified: false,
    geometryValidated: false,
    fullStageValidated: false,
    motionControlReady: false,
    reducedMotion: reducedMotion.matches,
    lastTrustedEvent: 'none',
    lastSelectedRole: 'none',
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let motions = [];
  let transitionStartTime = 0;
  let lastPreviewTime = 0;

  const nextFrames = (count = 2) => new Promise(resolve => {
    const advance = remaining => {
      if (remaining <= 0) resolve();
      else requestAnimationFrame(() => advance(remaining - 1));
    };
    advance(count);
  });

  const recordInput = (event, label) => {
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return false;
    }
    const keyboard = event.type === 'keydown' || (event.type === 'click' && event.detail === 0);
    state.inputCount += 1;
    if (keyboard) state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
    state.lastTrustedEvent = label;
    return true;
  };

  const updateSemanticsAndCopy = () => {
    const count = state.history.length;
    const ready = count === roleButtons.length;
    const lastRole = count ? roleById.get(state.history[count - 1]) : null;
    state.historyLength = count;
    state.matchedRoleIds = [...state.history];
    state.badgePhase = ready ? 'match-ready' : count ? 'remembering' : 'open';
    state.lastSelectedRole = lastRole?.id || 'none';

    for (const [index, node] of historyNodes.entries()) node.dataset.filled = String(index < count);
    for (const role of roleById.values()) {
      const saved = state.history.includes(role.id);
      role.button.dataset.saved = String(saved);
      role.button.setAttribute('aria-pressed', String(saved));
    }

    undoButton.disabled = count === 0;
    clearButton.disabled = count === 0;
    badge.dataset.ready = String(ready);
    badgeCount.textContent = `${count} / 3`;
    memoryStatus.textContent = count ? `Session memory · ${count} saved` : 'Session memory · empty';
    historyNote.textContent = ready ? 'Profile ready' : lastRole ? `${lastRole.name} saved` : 'Choose a role';

    if (ready) {
      badgeKicker.textContent = 'Interest profile ready';
      badgeTitle.textContent = 'You bridge product, code & motion.';
      badgeDetail.textContent = 'Meet the team through one multidisciplinary introduction.';
    } else if (count === 2) {
      badgeKicker.textContent = 'Pattern forming';
      badgeTitle.textContent = 'Your range is coming into focus.';
      badgeDetail.textContent = 'Save one more role to shape the studio introduction.';
    } else if (count === 1) {
      badgeKicker.textContent = 'Interest remembered';
      badgeTitle.textContent = `${lastRole.name} caught your eye.`;
      badgeDetail.textContent = 'Keep exploring — this invitation will remember your route.';
    } else {
      badgeKicker.textContent = 'Open invitation';
      badgeTitle.textContent = 'Tell us what caught your eye.';
      badgeDetail.textContent = 'Three saved roles unlock a tailored studio introduction.';
    }
  };

  const stopMotions = (countCancellation = true) => {
    if (motions.length && countCancellation && state.transitionActive) state.transitionCancelCount += 1;
    for (const motion of motions) motion.stop();
    motions = [];
    state.transitionActive = false;
  };

  const settleMotions = () => {
    for (const motion of motions) motion.stop();
    motions = [];
    badge.style.transform = 'rotate(-4deg) scale(1)';
    state.transitionActive = false;
    state.transitionCompleteCount += 1;
  };

  const startFiniteTransition = targetButton => {
    stopMotions();
    state.transitionStartCount += 1;
    transitionStartTime = lastPreviewTime;

    if (state.reducedMotion) {
      badge.style.transform = 'rotate(-4deg) scale(1)';
      state.transitionCompleteCount += 1;
      return;
    }

    const selectedMotion = targetButton ? animate(targetButton, {
      transform: ['translateX(0px)', 'translateX(5px)', 'translateX(0px)'],
    }, { duration: state.transitionDuration, ease: [.22, .84, .2, 1] }) : null;
    const badgeMotion = animate(badge, {
      transform: ['rotate(-4deg) scale(1)', 'rotate(1.5deg) scale(.92)', 'rotate(-4deg) scale(1)'],
    }, { duration: state.transitionDuration, ease: [.22, .84, .2, 1] });
    const countMotion = animate(badgeCount, {
      opacity: [1, .18, 1],
      transform: ['translateY(0px)', 'translateY(-4px)', 'translateY(0px)'],
    }, { duration: state.transitionDuration, ease: 'ease-out' });
    motions = [badgeMotion, countMotion, ...(selectedMotion ? [selectedMotion] : [])];
    state.motionControlCreateCount += motions.length;
    for (const motion of motions) {
      motion.pause();
      motion.time = 0;
    }
    state.transitionActive = true;
  };

  const addRole = (role, event) => {
    if (!recordInput(event, `${event.detail === 0 ? 'keyboard' : 'pointer'}-role-${role.id}`)) return;
    if (state.history.includes(role.id)) {
      state.duplicateSelectionCount += 1;
      historyNote.textContent = `${role.name} already saved`;
      startFiniteTransition(role.button);
      return;
    }
    state.history.push(role.id);
    state.roleSelectionCount += 1;
    updateSemanticsAndCopy();
    startFiniteTransition(role.button);
  };

  for (const role of roleById.values()) {
    role.button.addEventListener('click', event => addRole(role, event));
  }

  undoButton.addEventListener('click', event => {
    if (!state.history.length || !recordInput(event, `${event.detail === 0 ? 'keyboard' : 'pointer'}-undo`)) return;
    state.history.pop();
    state.undoCount += 1;
    updateSemanticsAndCopy();
    startFiniteTransition(null);
  });

  clearButton.addEventListener('click', event => {
    if (!state.history.length || !recordInput(event, `${event.detail === 0 ? 'keyboard' : 'pointer'}-clear`)) return;
    state.history.splice(0);
    state.clearCount += 1;
    updateSemanticsAndCopy();
    startFiniteTransition(null);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !state.history.length) return;
    event.preventDefault();
    if (!recordInput(event, 'escape-undo')) return;
    state.history.pop();
    state.undoCount += 1;
    state.escapeUndoCount += 1;
    updateSemanticsAndCopy();
    startFiniteTransition(null);
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (state.transitionActive) {
      stopMotions(false);
      badge.style.transform = 'rotate(-4deg) scale(1)';
      state.transitionCompleteCount += 1;
    }
  });

  updateSemanticsAndCopy();

  const ready = (async () => {
    await document.fonts.ready;
    await nextFrames();
    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    const roleRect = roleList.getBoundingClientRect();
    state.geometryValidated = shellRect.width > innerWidth * .86
      && shellRect.height > innerHeight * .82
      && badgeRect.width > 54
      && badgeRect.height > 54
      && roleRect.width > 74
      && roleRect.height > 38;
    state.fullStageValidated = stageRect.width >= innerWidth - 1
      && stageRect.height >= innerHeight - 1
      && shellRect.left >= -1
      && shellRect.top >= -1
      && shellRect.right <= innerWidth + 1
      && shellRect.bottom <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;
    state.motionControlReady = typeof animate === 'function';
    state.initialStaticVerified = state.history.length === 0
      && state.inputCount === 0
      && state.roleSelectionCount === 0
      && state.transitionStartCount === 0
      && state.badgePhase === 'open'
      && roleButtons.every(button => button.dataset.saved === 'false')
      && historyNodes.every(node => node.dataset.filled === 'false')
      && badge.dataset.ready === 'false';
  })();

  const render = time => {
    state.renderCount += 1;
    lastPreviewTime = Number.isFinite(time) ? time : lastPreviewTime;
    if (!state.transitionActive) return;
    const elapsed = Math.max(0, Math.min(state.transitionDuration, lastPreviewTime - transitionStartTime));
    for (const motion of motions) motion.time = elapsed;
    state.finiteTransitionStepCount += 1;
    if (elapsed >= state.transitionDuration) settleMotions();
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();
    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    const historyIsValid = state.history.length <= roleButtons.length
      && new Set(state.history).size === state.history.length
      && state.history.every(id => roleById.has(id))
      && state.historyLength === state.history.length
      && state.matchedRoleIds.join('|') === state.history.join('|');
    const semanticsMatch = roleButtons.every(button => {
      const saved = state.history.includes(button.dataset.roleId);
      return button.dataset.saved === String(saved)
        && button.getAttribute('aria-pressed') === String(saved);
    }) && historyNodes.every((node, index) => node.dataset.filled === String(index < state.history.length))
      && undoButton.disabled === (state.history.length === 0)
      && clearButton.disabled === (state.history.length === 0)
      && badge.dataset.ready === String(state.history.length === roleButtons.length)
      && badgeCount.textContent === `${state.history.length} / 3`;
    const countersValid = counterKeys.every(key => Number.isInteger(state[key]) && state[key] >= 0)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.transitionCompleteCount <= state.transitionStartCount
      && state.roleSelectionCount >= state.history.length
      && state.undoCount <= state.roleSelectionCount
      && state.escapeUndoCount <= state.undoCount;
    const withinViewport = stageRect.width <= innerWidth + 1
      && stageRect.height <= innerHeight + 1
      && shellRect.left >= -1
      && shellRect.top >= -1
      && shellRect.right <= innerWidth + 1
      && shellRect.bottom <= innerHeight + 1
      && badgeRect.left >= -1
      && badgeRect.top >= -1
      && badgeRect.right <= innerWidth + 1
      && badgeRect.bottom <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;

    return typeof animate === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && state.automaticPlayback === false
      && state.automaticCycle === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.previewClockDrivesFiniteTransitionAfterInput === true
      && state.userInitiatedChangesOnly === true
      && state.syntheticInput === false
      && state.initialStaticVerified
      && state.geometryValidated
      && state.fullStageValidated
      && state.motionControlReady
      && state.renderCount > 0
      && historyIsValid
      && semanticsMatch
      && countersValid
      && withinViewport;
  };

  window.addEventListener('beforeunload', () => stopMotions(false), { once: true });

  installPreviewController({
    id: 'interaction-history-hiring-badge',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
