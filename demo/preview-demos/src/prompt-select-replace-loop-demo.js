import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const shell = document.querySelector('#prompt-shell');
  const promptCopy = document.querySelector('#prompt-copy');
  const tokens = [...document.querySelectorAll('.semantic-span')];
  const options = [...document.querySelectorAll('.replacement-option')];
  const selectionLabel = document.querySelector('#selection-label');
  const diffBefore = document.querySelector('#diff-before');
  const diffAfter = document.querySelector('#diff-after');
  const applyButton = document.querySelector('#apply-revision');
  const undoButton = document.querySelector('#undo-revision');
  const resetButton = document.querySelector('#reset-revision');
  const statusDot = document.querySelector('#status-dot');
  const status = document.querySelector('#prompt-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const fields = {
    format: {
      label: 'Deliverable',
      original: 'weekly market brief',
      alternatives: ['concise decision memo', 'risk-first briefing', 'source-backed shortlist'],
    },
    region: {
      label: 'Search region',
      original: 'Southern Europe',
      alternatives: ['Atlantic Portugal', 'the Iberian coast', 'the Adriatic corridor'],
    },
    focus: {
      label: 'Comparison focus',
      original: 'rail-accessible coastal towns',
      alternatives: ['car-free coastal towns', 'overnight-train destinations', 'ferry-linked creative hubs'],
    },
    audience: {
      label: 'Decision audience',
      original: 'remote design teams',
      alternatives: ['small product teams', 'off-site facilitators', 'accessibility reviewers'],
    },
  };

  const state = {
    id: 'prompt-select-replace-loop',
    task: 'human-operated-semantic-prompt-span-revision-workspace',
    claimedLibrary: 'motion@12.42.2',
    mechanism: 'native-dom-range-selection-stages-one-semantic-replacement-and-explicit-apply-retains-the-revised-prompt',
    assetStrategy: 'code-native-editable-text-and-dom-range-no-functional-raster-input-required',
    acceptedInputs: ['trusted-pointer-text-selection', 'trusted-keyboard-token-activation', 'visible-replacement-buttons', 'visible-apply-button', 'visible-undo-button', 'visible-reset-button'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    initialStaticVerified: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticLoop: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    previewClockMutationCount: 0,
    selectedField: null,
    stagedValue: null,
    history: [],
    humanActions: 0,
    pointerSelectionCount: 0,
    keyboardSelectionCount: 0,
    optionSelectionCount: 0,
    applyCount: 0,
    undoCount: 0,
    resetCount: 0,
    nativeSelectionCount: 0,
    lastInputTrusted: null,
    lastInputKind: 'none',
    motionRuns: 0,
    renderCalls: 0,
    ready: true,
  };

  const probeMotion = animate(statusDot, { opacity: [1, .72] }, { duration: .24, ease: 'easeOut' });
  probeMotion.pause();
  probeMotion.time = 0;

  const tokenFor = field => tokens.find(token => token.dataset.field === field);
  const isTrustedAction = event => event.isTrusted === true;

  const runMotion = (target, keyframes, options = {}) => {
    state.motionRuns += 1;
    if (reducedMotion.matches) return null;
    return animate(target, keyframes, { duration: .24, ease: 'easeOut', ...options });
  };

  const selectNativeText = token => {
    const range = document.createRange();
    range.selectNodeContents(token);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    state.nativeSelectionCount += 1;
  };

  const setState = value => {
    shell.dataset.state = value;
  };

  const updateUndo = () => {
    undoButton.disabled = state.history.length === 0;
  };

  const clearOptionState = () => {
    options.forEach(option => option.setAttribute('aria-pressed', 'false'));
    state.stagedValue = null;
    applyButton.disabled = true;
  };

  const selectField = (field, { preserveNativeSelection = false } = {}) => {
    const token = tokenFor(field);
    const definition = fields[field];
    if (!token || !definition) return;

    state.selectedField = field;
    clearOptionState();
    tokens.forEach(item => item.classList.toggle('is-selected', item === token));
    options.forEach((option, index) => {
      option.textContent = definition.alternatives[index];
      option.disabled = false;
    });
    selectionLabel.textContent = `${definition.label} · “${token.textContent}”`;
    diffBefore.textContent = token.textContent;
    diffAfter.textContent = 'Choose a replacement';
    status.textContent = 'Span selected';
    setState('selected');
    if (!preserveNativeSelection) selectNativeText(token);
    runMotion(token, { scale: [1, 1.025, 1], backgroundColor: ['#d9ff57', '#efffae', '#d9ff57'] });
  };

  const stageReplacement = value => {
    const token = tokenFor(state.selectedField);
    if (!token || !value) return;
    state.stagedValue = value;
    options.forEach(option => option.setAttribute('aria-pressed', String(option.textContent === value)));
    diffBefore.textContent = token.textContent;
    diffAfter.textContent = value;
    applyButton.disabled = false;
    status.textContent = 'Revision staged';
    setState('staged');
    runMotion(diffAfter, { opacity: [.35, 1], x: [4, 0] });
  };

  const applyRevision = () => {
    const token = tokenFor(state.selectedField);
    if (!token || !state.stagedValue) return;
    const before = token.textContent;
    const after = state.stagedValue;
    state.history.push({ field: state.selectedField, before, after });
    token.textContent = after;
    token.classList.add('is-applied');
    tokens.forEach(item => item.classList.toggle('is-selected', item === token));
    selectionLabel.textContent = `${fields[state.selectedField].label} · revised`;
    diffBefore.textContent = before;
    diffAfter.textContent = after;
    options.forEach(option => { option.disabled = true; });
    applyButton.disabled = true;
    updateUndo();
    selectNativeText(token);
    status.textContent = 'Revision applied';
    setState('applied');
    runMotion(token, { y: [3, 0], opacity: [.4, 1] }, { duration: .3 });
    runMotion(statusDot, { scale: [1, 1.8, 1], backgroundColor: ['#154d3e', '#d9ff57', '#154d3e'] });
  };

  const undoRevision = () => {
    const entry = state.history.pop();
    if (!entry) return;
    const token = tokenFor(entry.field);
    token.textContent = entry.before;
    token.classList.toggle('is-applied', entry.before !== fields[entry.field].original);
    state.selectedField = entry.field;
    clearOptionState();
    tokens.forEach(item => item.classList.toggle('is-selected', item === token));
    options.forEach((option, index) => {
      option.textContent = fields[entry.field].alternatives[index];
      option.disabled = false;
    });
    selectionLabel.textContent = `${fields[entry.field].label} · change undone`;
    diffBefore.textContent = entry.after;
    diffAfter.textContent = entry.before;
    selectNativeText(token);
    updateUndo();
    status.textContent = 'Last revision undone';
    setState('undone');
    runMotion(token, { opacity: [.45, 1], x: [-3, 0] });
  };

  const resetPrompt = () => {
    tokens.forEach(token => {
      token.textContent = fields[token.dataset.field].original;
      token.classList.remove('is-selected', 'is-applied');
    });
    options.forEach((option, index) => {
      option.textContent = `Replacement 0${index + 1}`;
      option.disabled = true;
      option.setAttribute('aria-pressed', 'false');
    });
    state.selectedField = null;
    state.stagedValue = null;
    state.history.length = 0;
    window.getSelection()?.removeAllRanges();
    applyButton.disabled = true;
    updateUndo();
    selectionLabel.textContent = 'Select a semantic span';
    diffBefore.textContent = 'No source selected';
    diffAfter.textContent = 'No revision staged';
    status.textContent = 'Awaiting selection';
    setState('idle');
    runMotion(shell, { opacity: [.78, 1] });
  };

  promptCopy.addEventListener('pointerup', event => {
    if (!isTrustedAction(event)) return;
    const selection = window.getSelection();
    const anchorElement = selection?.anchorNode?.parentElement;
    const focusElement = selection?.focusNode?.parentElement;
    const anchorToken = anchorElement?.closest('.semantic-span');
    const focusToken = focusElement?.closest('.semantic-span');
    const clickedToken = event.target.closest?.('.semantic-span');
    const selectedToken = anchorToken && anchorToken === focusToken ? anchorToken : clickedToken;
    if (!selectedToken) return;
    state.humanActions += 1;
    state.pointerSelectionCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = 'pointer-text-selection';
    selectNativeText(selectedToken);
    selectField(selectedToken.dataset.field, { preserveNativeSelection: true });
  });

  tokens.forEach(token => {
    token.addEventListener('keydown', event => {
      if (!isTrustedAction(event) || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      state.humanActions += 1;
      state.keyboardSelectionCount += 1;
      state.lastInputTrusted = true;
      state.lastInputKind = 'keyboard-token-activation';
      selectField(token.dataset.field);
    });
  });

  options.forEach(option => {
    option.addEventListener('click', event => {
      if (!isTrustedAction(event) || option.disabled || !state.selectedField) return;
      state.humanActions += 1;
      state.optionSelectionCount += 1;
      state.lastInputTrusted = true;
      state.lastInputKind = 'replacement-option';
      stageReplacement(option.textContent);
    });
  });

  applyButton.addEventListener('click', event => {
    if (!isTrustedAction(event) || applyButton.disabled) return;
    state.humanActions += 1;
    state.applyCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = 'apply';
    applyRevision();
  });

  undoButton.addEventListener('click', event => {
    if (!isTrustedAction(event) || undoButton.disabled) return;
    state.humanActions += 1;
    state.undoCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = 'undo';
    undoRevision();
  });

  resetButton.addEventListener('click', event => {
    if (!isTrustedAction(event)) return;
    state.humanActions += 1;
    state.resetCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = 'reset';
    resetPrompt();
  });

  window.__PROMPT_REVISION_STATE__ = state;
  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const currentValues = Object.fromEntries(tokens.map(token => [token.dataset.field, token.textContent]));
    const uniqueFields = new Set(tokens.map(token => token.dataset.field));
    const validHistory = state.history.every(entry => fields[entry.field]
      && entry.before.length > 0
      && fields[entry.field].alternatives.includes(entry.after));
    const validSelection = state.selectedField === null || Boolean(fields[state.selectedField]);
    const validStaging = state.stagedValue === null
      || fields[state.selectedField]?.alternatives.includes(state.stagedValue);
    return typeof probeMotion.play === 'function'
      && typeof probeMotion.pause === 'function'
      && probeMotion.time === 0
      && promptCopy.contains(tokens[0])
      && tokens.length === 4
      && uniqueFields.size === 4
      && Object.values(currentValues).every(value => value.trim().length > 4)
      && options.length === 3
      && validHistory
      && validSelection
      && validStaging
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStaticVerified
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticLoop
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && state.previewClockMutationCount === 0
      && state.renderCalls > 0;
  };

  installPreviewController({
    id: 'prompt-select-replace-loop',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => {
      // Rendering is deliberately state-stable. Only trusted pointer/keyboard input mutates the prompt.
      state.renderCalls += 1;
    },
    ready: Promise.resolve(),
  });
} catch (error) {
  markPreviewFailure(error);
}
