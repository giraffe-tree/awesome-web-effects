import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#morph-stage');
  const shell = document.querySelector('#layout-shell');
  const queueList = document.querySelector('#queue-list');
  const queueOptions = [...document.querySelectorAll('.queue-option')];
  const detailSlot = document.querySelector('#detail-slot');
  const card = document.querySelector('#shared-card');
  const layoutState = document.querySelector('#layout-state');
  const cardCode = document.querySelector('#card-code');
  const cardStatus = document.querySelector('#card-status');
  const cardTitle = document.querySelector('#card-title');
  const cardPurpose = document.querySelector('#card-purpose');
  const detailDescription = document.querySelector('#detail-description');
  const metricOwner = document.querySelector('#metric-owner');
  const metricDue = document.querySelector('#metric-due');
  const metricChecks = document.querySelector('#metric-checks');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const sharedNodeReference = card;
  const springOptions = {
    type: 'spring',
    stiffness: 235,
    damping: 24,
    mass: .82,
    restDelta: .01,
    restSpeed: .01,
  };
  const records = [
    {
      id: 'MAP-248',
      title: 'Offline map sync',
      status: 'Design ready',
      purpose: 'Keep downloaded trails trustworthy after edits.',
      description: 'Resolve how local trail edits merge after a device returns online, without hiding conflicts or losing field notes.',
      owner: 'A. Kim',
      due: 'Tue 16:00',
      checks: '4 / 6',
      accent: '#cb7041',
      progress: '67%',
    },
    {
      id: 'PAY-117',
      title: 'Payment retry copy',
      status: 'Needs review',
      purpose: 'Explain recovery without blaming the customer.',
      description: 'Approve the retry sequence, error language, and escalation path before the new checkout recovery flow reaches production.',
      owner: 'M. Lee',
      due: 'Wed 11:30',
      checks: '3 / 5',
      accent: '#4d7c70',
      progress: '60%',
    },
    {
      id: 'RTE-092',
      title: 'Trail export flow',
      status: 'Ready to ship',
      purpose: 'Make route handoff predictable across devices.',
      description: 'Confirm GPX export, share-sheet order, and offline recovery before the route handoff is included in the next field release.',
      owner: 'S. Park',
      due: 'Thu 09:00',
      checks: '6 / 6',
      accent: '#73714b',
      progress: '100%',
    },
  ];

  const state = {
    id: 'shared-layout-spring-morph',
    automaticLayoutChanges: false,
    syntheticInput: false,
    automaticFallback: false,
    sharedNodeStable: true,
    selectedIndex: 0,
    selectedId: records[0].id,
    expanded: false,
    phase: 'compact',
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    selectionCount: 0,
    openCount: 0,
    closeCount: 0,
    springStartCount: 0,
    springCompleteCount: 0,
    springCancelCount: 0,
    reducedMotionDirectCount: 0,
    resizeCount: 0,
    revision: 0,
    animationActive: false,
    layoutComplete: true,
    compactRectValidated: false,
    expandedRectValidated: false,
    initialStaticVerified: false,
    reducedMotion: reducedMotion.matches,
    renderCount: 0,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let latestPointerKind = 'mouse';
  let geometryMotion = null;

  const mechanismProbeTarget = { value: 0 };
  const mechanismProbe = animate(mechanismProbeTarget, { value: [0, 1] }, { ...springOptions, autoplay: false });
  mechanismProbe.pause();
  mechanismProbe.time = 0;

  function relativeGeometry(target) {
    const shellRect = shell.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    return {
      left: targetRect.left - shellRect.left,
      top: targetRect.top - shellRect.top,
      width: targetRect.width,
      height: targetRect.height,
      borderRadius: Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0,
    };
  }

  function targetForCurrentState() {
    return state.expanded ? detailSlot : queueOptions[state.selectedIndex];
  }

  function applyGeometry(geometry) {
    card.style.left = `${geometry.left}px`;
    card.style.top = `${geometry.top}px`;
    card.style.width = `${geometry.width}px`;
    card.style.height = `${geometry.height}px`;
    card.style.borderRadius = `${geometry.borderRadius}px`;
  }

  function geometryMatches(target, tolerance = 1.5) {
    const cardRect = card.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    return Math.abs(cardRect.left - targetRect.left) <= tolerance
      && Math.abs(cardRect.top - targetRect.top) <= tolerance
      && Math.abs(cardRect.width - targetRect.width) <= tolerance
      && Math.abs(cardRect.height - targetRect.height) <= tolerance;
  }

  function updateRecord(index) {
    const record = records[index];
    state.selectedIndex = index;
    state.selectedId = record.id;
    card.style.setProperty('--accent', record.accent);
    card.style.setProperty('--progress', record.progress);
    cardCode.textContent = record.id;
    cardStatus.textContent = record.status;
    cardTitle.textContent = record.title;
    cardPurpose.textContent = record.purpose;
    detailDescription.textContent = record.description;
    metricOwner.textContent = record.owner;
    metricDue.textContent = record.due;
    metricChecks.textContent = record.checks;
    card.setAttribute('aria-label', `${state.expanded ? 'Return' : 'Open'} ${record.title} ${state.expanded ? 'to the review queue' : 'review'}`);
  }

  function updateQueueState() {
    queueOptions.forEach((option, index) => {
      const selected = index === state.selectedIndex;
      option.setAttribute('aria-pressed', String(selected));
      option.tabIndex = !state.expanded && selected ? -1 : 0;
      option.setAttribute('aria-hidden', String(!state.expanded && selected));
    });
  }

  function recordInput(inputKind) {
    state.inputKind = inputKind;
    state.inputCount += 1;
    if (inputKind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
  }

  function cancelGeometryMotion() {
    if (!state.animationActive) return;
    geometryMotion?.stop?.();
    geometryMotion = null;
    state.animationActive = false;
    state.springCancelCount += 1;
  }

  function finalizeLayout(expanded, revision) {
    if (revision !== state.revision) return;
    geometryMotion = null;
    state.animationActive = false;
    state.layoutComplete = true;
    state.phase = expanded ? 'expanded' : 'compact';
    card.dataset.mode = state.phase;
    card.setAttribute('aria-expanded', String(expanded));
    layoutState.textContent = expanded ? 'workspace' : 'queue';
    updateRecord(state.selectedIndex);
    updateQueueState();
    if (expanded) state.expandedRectValidated = geometryMatches(detailSlot);
    else state.compactRectValidated = geometryMatches(queueOptions[state.selectedIndex]);
  }

  function animateTo(expanded, revision) {
    const target = expanded ? detailSlot : queueOptions[state.selectedIndex];
    const geometry = relativeGeometry(target);
    if (state.reducedMotion) {
      applyGeometry(geometry);
      state.reducedMotionDirectCount += 1;
      finalizeLayout(expanded, revision);
      return;
    }
    state.springStartCount += 1;
    state.animationActive = true;
    geometryMotion = animate(card, {
      left: `${geometry.left}px`,
      top: `${geometry.top}px`,
      width: `${geometry.width}px`,
      height: `${geometry.height}px`,
      borderRadius: `${geometry.borderRadius}px`,
    }, springOptions);
    geometryMotion.finished.then(() => {
      if (revision !== state.revision) return;
      state.springCompleteCount += 1;
      finalizeLayout(expanded, revision);
    }).catch(() => {});
  }

  function openRecord(index, inputKind) {
    recordInput(inputKind);
    const changedSelection = index !== state.selectedIndex;
    cancelGeometryMotion();
    state.revision += 1;
    const revision = state.revision;
    if (changedSelection) state.selectionCount += 1;
    state.expanded = true;
    state.phase = 'expanding';
    state.layoutComplete = false;
    state.openCount += 1;
    updateRecord(index);
    updateQueueState();
    applyGeometry(relativeGeometry(queueOptions[index]));
    card.dataset.mode = 'expanding';
    card.setAttribute('aria-expanded', 'true');
    layoutState.textContent = 'opening';
    if (inputKind === 'keyboard') card.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      if (revision === state.revision) animateTo(true, revision);
    });
  }

  function closeRecord(inputKind) {
    if (!state.expanded) return;
    recordInput(inputKind);
    cancelGeometryMotion();
    state.revision += 1;
    const revision = state.revision;
    state.expanded = false;
    state.phase = 'collapsing';
    state.layoutComplete = false;
    state.closeCount += 1;
    card.dataset.mode = 'collapsing';
    card.setAttribute('aria-expanded', 'false');
    layoutState.textContent = 'returning';
    updateRecord(state.selectedIndex);
    updateQueueState();
    if (inputKind === 'keyboard') card.focus({ preventScroll: true });
    animateTo(false, revision);
  }

  queueOptions.forEach((option, index) => {
    option.addEventListener('pointerdown', event => {
      latestPointerKind = event.pointerType || 'pointer';
    });
    option.addEventListener('click', event => {
      openRecord(index, event.detail === 0 ? 'keyboard' : latestPointerKind);
    });
  });

  queueList.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const focusedIndex = queueOptions.indexOf(document.activeElement);
    if (focusedIndex < 0) return;
    event.preventDefault();
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? queueOptions.length - 1
        : (focusedIndex + (event.key === 'ArrowDown' ? 1 : -1) + queueOptions.length) % queueOptions.length;
    queueOptions[next].focus({ preventScroll: true });
  });

  card.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });
  card.addEventListener('click', event => {
    if (state.expanded) closeRecord(event.detail === 0 ? 'keyboard' : latestPointerKind);
    else openRecord(state.selectedIndex, event.detail === 0 ? 'keyboard' : latestPointerKind);
  });
  card.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (state.expanded) closeRecord('keyboard');
    else openRecord(state.selectedIndex, 'keyboard');
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !state.expanded) return;
    event.preventDefault();
    closeRecord('keyboard');
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (!event.matches || !state.animationActive) return;
    cancelGeometryMotion();
    state.revision += 1;
    const revision = state.revision;
    applyGeometry(relativeGeometry(targetForCurrentState()));
    state.reducedMotionDirectCount += 1;
    finalizeLayout(state.expanded, revision);
  });

  const resizeObserver = new ResizeObserver(() => {
    state.resizeCount += 1;
    if (state.animationActive) {
      cancelGeometryMotion();
      state.revision += 1;
    }
    applyGeometry(relativeGeometry(targetForCurrentState()));
    state.layoutComplete = true;
    if (state.expanded) state.expandedRectValidated = geometryMatches(detailSlot);
    else state.compactRectValidated = geometryMatches(queueOptions[state.selectedIndex]);
  });
  resizeObserver.observe(shell);

  updateRecord(0);
  updateQueueState();
  applyGeometry(relativeGeometry(queueOptions[0]));

  const ready = document.fonts.ready.then(async () => {
    applyGeometry(relativeGeometry(queueOptions[0]));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.compactRectValidated = geometryMatches(queueOptions[0]);
    state.initialStaticVerified = !state.expanded
      && state.phase === 'compact'
      && state.inputCount === 0
      && state.openCount === 0
      && state.closeCount === 0
      && state.springStartCount === 0
      && state.automaticLayoutChanges === false
      && state.syntheticInput === false;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const target = targetForCurrentState();
    const activeOptions = queueOptions.filter(option => option.getAttribute('aria-pressed') === 'true');
    const validPhase = state.expanded
      ? ['expanding', 'expanded'].includes(state.phase)
      : ['collapsing', 'compact'].includes(state.phase);
    return Boolean(
      document.querySelectorAll('#shared-card').length === 1
      && sharedNodeReference === card
      && card.isConnected
      && card.parentElement === shell
      && state.sharedNodeStable
      && state.automaticLayoutChanges === false
      && state.syntheticInput === false
      && state.automaticFallback === false
      && state.initialStaticVerified
      && state.selectedIndex >= 0
      && state.selectedIndex < records.length
      && state.selectedId === records[state.selectedIndex].id
      && validPhase
      && card.getAttribute('aria-expanded') === String(state.expanded)
      && activeOptions.length === 1
      && Number(activeOptions[0].dataset.index) === state.selectedIndex
      && (!state.layoutComplete || geometryMatches(target))
      && (!state.layoutComplete || !state.animationActive)
      && typeof mechanismProbe.play === 'function'
      && typeof mechanismProbe.pause === 'function'
      && mechanismProbe.duration > .2
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.pointerInputCount)
      && Number.isInteger(state.keyboardInputCount)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && Number.isInteger(state.selectionCount)
      && Number.isInteger(state.openCount)
      && Number.isInteger(state.closeCount)
      && Number.isInteger(state.springStartCount)
      && Number.isInteger(state.springCompleteCount)
      && Number.isInteger(state.springCancelCount)
      && Number.isInteger(state.renderCount)
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stageRect.width >= innerWidth * .99
      && stageRect.height >= innerHeight * .99
      && shellRect.left >= -1
      && shellRect.top >= -1
      && shellRect.right <= innerWidth + 1
      && shellRect.bottom <= innerHeight + 1
      && state.renderCount > 0
    );
  };

  window.addEventListener('beforeunload', () => {
    geometryMotion?.stop?.();
    mechanismProbe.stop?.();
    resizeObserver.disconnect();
  }, { once: true });

  installPreviewController({
    id: 'shared-layout-spring-morph',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => { state.renderCount += 1; },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
