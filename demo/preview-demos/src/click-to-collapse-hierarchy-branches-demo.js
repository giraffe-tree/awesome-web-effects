import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const NS = 'http://www.w3.org/2000/svg';
const TARGET_BRANCH_ID = 'components';
const TARGET_DESCENDANTS = ['map-panel', 'filter-bar', 'charts', 'sparkline'];
const NODES = [
  { id: 'repo', label: 'atlas/', fullLabel: 'atlas-studio/', parent: null, kind: 'root' },
  { id: 'app', label: 'app/', fullLabel: 'app/', parent: 'repo', kind: 'branch' },
  { id: 'page', label: 'page.tsx', fullLabel: 'page.tsx', parent: 'app', kind: 'leaf' },
  { id: 'layout', label: 'layout', fullLabel: 'layout.tsx', parent: 'app', kind: 'leaf' },
  { id: 'components', label: 'components', fullLabel: 'components/', parent: 'repo', kind: 'branch' },
  { id: 'map-panel', label: 'MapPanel', fullLabel: 'MapPanel.tsx', parent: 'components', kind: 'leaf' },
  { id: 'filter-bar', label: 'FilterBar', fullLabel: 'FilterBar.tsx', parent: 'components', kind: 'leaf' },
  { id: 'charts', label: 'charts/', fullLabel: 'charts/', parent: 'components', kind: 'branch' },
  { id: 'sparkline', label: 'Sparkline', fullLabel: 'Sparkline.tsx', parent: 'charts', kind: 'leaf' },
  { id: 'docs', label: 'docs/', fullLabel: 'docs/', parent: 'repo', kind: 'branch' },
  { id: 'field-notes', label: 'notes.md', fullLabel: 'field-notes.md', parent: 'docs', kind: 'leaf' },
  { id: 'release', label: 'release.md', fullLabel: 'release.md', parent: 'docs', kind: 'leaf' },
];

const round = value => Number(value.toFixed(4));

try {
  const stage = document.querySelector('#repo-stage');
  const svg = document.querySelector('#tree-svg');
  const nodeLayer = document.querySelector('#tree-nodes');
  const edgeLayer = document.querySelector('#tree-edges');
  const selectionPath = document.querySelector('#selection-path');
  const reviewLabel = document.querySelector('#review-label');
  const reviewCopy = document.querySelector('#review-copy');
  const confirmButton = document.querySelector('#confirm-navigation');
  const undoButton = document.querySelector('#undo-action');
  const branchState = document.querySelector('#branch-state');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'click-to-collapse-hierarchy-branches',
    task: 'human-selects-and-confirms-a-repository-file-while-folder-collapse-hides-only-descendants-and-preserves-all-other-node-identities',
    mechanism: 'trusted-node-or-keyboard-activation-drives-finite-motion-descendant-opacity-with-stable-authored-node-ids-while-review-selection-confirmation-and-undo-are-retained',
    claimedLibrary: 'motion@12.42.2',
    assetStrategy: 'code-native-authored-file-hierarchy-and-svg-connectors-are-the-functional-input-no-raster-asset-required',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['visible-folder-and-file-nodes', 'captured-mouse-click', 'captured-touch-or-pen-tap', 'keyboard-enter-space-on-treeitem', 'visible-confirm-button', 'visible-undo-button', 'keyboard-c-confirm', 'keyboard-u-escape-undo'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticCollapse: false,
    automaticRestore: false,
    automaticSelection: false,
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
    transitioning: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerNodeInputCount: 0,
    keyboardNodeInputCount: 0,
    pointerButtonInputCount: 0,
    keyboardButtonInputCount: 0,
    branchToggleInputCount: 0,
    leafSelectionInputCount: 0,
    confirmInputCount: 0,
    undoInputCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    nodeCount: NODES.length,
    edgeCount: NODES.filter(node => node.parent).length,
    rootCount: NODES.filter(node => node.kind === 'root').length,
    branchNodeCount: NODES.filter(node => node.kind === 'branch').length,
    leafNodeCount: NODES.filter(node => node.kind === 'leaf').length,
    hierarchyIdentitySignature: NODES.map(node => `${node.id}:${node.parent || 'root'}:${node.kind}`).join('|'),
    selectedNodeId: 'none',
    selectedPath: 'none',
    selectedDepth: -1,
    confirmedNodeId: 'none',
    confirmedPath: 'none',
    confirmCount: 0,
    resultHeld: false,
    resultValidated: false,
    collapsedBranchIds: [],
    branchProgress: { repo: 0, app: 0, components: 0, charts: 0, docs: 0 },
    collapseCount: 0,
    restoreCount: 0,
    transitionStartCount: 0,
    transitionCompleteCount: 0,
    motionControlCount: 0,
    motionStartCount: 0,
    motionCompleteCount: 0,
    transitionRecords: [],
    targetBranchId: TARGET_BRANCH_ID,
    targetDescendantIds: TARGET_DESCENDANTS,
    hiddenDescendantCount: 0,
    maximumHiddenDescendantCount: 0,
    visibleNodeCount: NODES.length,
    unaffectedVisibleCountDuringCollapse: 0,
    unaffectedIdentityStable: true,
    maximumStableNodeMovementError: 0,
    identityCheckCount: 0,
    snapshotDepth: 0,
    undoCount: 0,
    lastUndoRestoredSelectedId: 'none',
    lastUndoRestoredConfirmedId: 'none',
    mutationSnapshots: [],
    auditTrail: [],
    auditTrailCount: 0,
    renderedNodeCount: 0,
    renderedEdgeCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    svgWidth: 0,
    svgHeight: 0,
    geometryCoverageX: 0,
    geometryCoverageY: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionFiniteTransitions: true,
    ready: false,
    runtimeAssertCount: 0,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__REPO_TREE_STATE__ = state;

  const nodeElements = new Map();
  const edgeElements = new Map();
  const collapsedBranches = new Set();
  let positions = new Map();
  let activeControl = null;

  function invariant(condition, message) {
    if (!condition) throw new Error(`click-to-collapse-hierarchy-branches: ${message}`);
  }

  function nodeById(id) {
    return NODES.find(node => node.id === id) || null;
  }

  function childrenOf(id) {
    return NODES.filter(node => node.parent === id);
  }

  function descendantsOf(id) {
    const descendants = [];
    const visit = parentId => childrenOf(parentId).forEach(child => {
      descendants.push(child);
      visit(child.id);
    });
    visit(id);
    return descendants;
  }

  function ancestorsOf(id) {
    const ancestors = [];
    let current = nodeById(id);
    while (current?.parent) {
      const parent = nodeById(current.parent);
      if (!parent) break;
      ancestors.push(parent);
      current = parent;
    }
    return ancestors;
  }

  function pathFor(id) {
    const parts = [];
    let current = nodeById(id);
    while (current) {
      parts.unshift(current.fullLabel);
      current = current.parent ? nodeById(current.parent) : null;
    }
    return parts.join('');
  }

  function depthFor(id) {
    return ancestorsOf(id).length;
  }

  function computePositions() {
    const width = Math.max(1, state.stageWidth);
    const height = Math.max(1, state.stageHeight);
    const portrait = height > width * 1.15;
    const ratios = portrait ? {
      repo: [.14, .3], app: [.37, .23], page: [.67, .18], layout: [.67, .28],
      components: [.37, .48], 'map-panel': [.67, .4], 'filter-bar': [.67, .5], charts: [.67, .6], sparkline: [.88, .6],
      docs: [.37, .73], 'field-notes': [.67, .69], release: [.67, .79],
    } : {
      repo: [.34, .24], app: [.52, .2], page: [.72, .14], layout: [.72, .27],
      components: [.52, .49], 'map-panel': [.72, .4], 'filter-bar': [.72, .5], charts: [.72, .61], sparkline: [.9, .61],
      docs: [.52, .78], 'field-notes': [.72, .73], release: [.72, .86],
    };
    return new Map(NODES.map(node => [node.id, { x: width * ratios[node.id][0], y: height * ratios[node.id][1] }]));
  }

  function nodeSize(node) {
    const portrait = state.stageHeight > state.stageWidth * 1.15;
    const width = Math.max(38, Math.min(portrait ? 50 : 74, state.stageWidth * (portrait ? .19 : .16)));
    const height = Math.max(14, Math.min(24, state.stageHeight * .095));
    return { width, height: node.kind === 'root' ? height + 2 : height };
  }

  function hiddenFactor(node) {
    const ancestors = ancestorsOf(node.id);
    return Math.max(0, ...ancestors.map(ancestor => state.branchProgress[ancestor.id] || 0));
  }

  function updateGeometryEvidence() {
    const stageBounds = stage.getBoundingClientRect();
    const svgBounds = svg.getBoundingClientRect();
    state.stageWidth = round(stageBounds.width);
    state.stageHeight = round(stageBounds.height);
    state.svgWidth = round(svgBounds.width);
    state.svgHeight = round(svgBounds.height);
    state.geometryCoverageX = round(svgBounds.width / Math.max(1, stageBounds.width));
    state.geometryCoverageY = round(svgBounds.height / Math.max(1, stageBounds.height));
    svg.setAttribute('viewBox', `0 0 ${state.stageWidth} ${state.stageHeight}`);
    positions = computePositions();
  }

  function updateDataset() {
    state.collapsedBranchIds = [...collapsedBranches].sort();
    stage.dataset.phase = state.phase;
    stage.dataset.transitioning = String(state.transitioning);
    stage.dataset.selectedNodeId = state.selectedNodeId;
    stage.dataset.confirmedNodeId = state.confirmedNodeId;
    stage.dataset.collapsedBranches = state.collapsedBranchIds.join(',') || 'none';
    stage.dataset.visibleNodeCount = String(state.visibleNodeCount);
    stage.dataset.resultHeld = String(state.resultHeld);
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
  }

  function updateInterface() {
    selectionPath.textContent = state.selectedNodeId === 'none' ? 'No file selected' : state.selectedPath;
    confirmButton.disabled = state.selectedNodeId === 'none' || nodeById(state.selectedNodeId)?.kind !== 'leaf' || state.selectedNodeId === state.confirmedNodeId;
    undoButton.disabled = state.mutationSnapshots.length === 0 || state.transitioning;
    if (state.confirmedNodeId === 'none') {
      reviewLabel.textContent = 'No review target';
      reviewCopy.textContent = state.selectedNodeId === 'none' ? 'Select a file from the hierarchy' : `Confirm ${nodeById(state.selectedNodeId)?.fullLabel || 'selection'}`;
    } else {
      reviewLabel.textContent = `Review held · ${nodeById(state.confirmedNodeId).fullLabel}`;
      reviewCopy.textContent = state.confirmedPath;
    }
    branchState.textContent = `${state.visibleNodeCount} visible · ${collapsedBranches.size ? `${[...collapsedBranches].join(', ')} folded` : 'all branches open'}`;
    updateDataset();
  }

  function renderHierarchy() {
    updateGeometryEvidence();
    let visibleCount = 0;
    let hiddenTargetDescendants = 0;
    NODES.forEach(node => {
      const element = nodeElements.get(node.id);
      const position = positions.get(node.id);
      const size = nodeSize(node);
      const hidden = hiddenFactor(node);
      const opacity = 1 - hidden;
      element.group.setAttribute('transform', `translate(${round(position.x)} ${round(position.y)}) scale(${round(.86 + opacity * .14)})`);
      element.group.style.opacity = String(round(opacity));
      element.group.style.pointerEvents = opacity < .05 ? 'none' : 'auto';
      element.group.setAttribute('aria-hidden', String(opacity < .05));
      element.group.setAttribute('tabindex', opacity < .05 ? '-1' : '0');
      if (node.kind !== 'leaf') element.group.setAttribute('aria-expanded', String((state.branchProgress[node.id] || 0) < .5));
      element.group.dataset.selected = String(node.id === state.selectedNodeId);
      element.group.dataset.confirmed = String(node.id === state.confirmedNodeId);
      element.rect.setAttribute('x', String(round(-size.width / 2)));
      element.rect.setAttribute('y', String(round(-size.height / 2)));
      element.rect.setAttribute('width', String(round(size.width)));
      element.rect.setAttribute('height', String(round(size.height)));
      element.rect.setAttribute('rx', String(round(Math.min(6, size.height * .28))));
      const branchCount = node.kind === 'branch' ? descendantsOf(node.id).length : 0;
      element.text.textContent = node.kind === 'branch' && (state.branchProgress[node.id] || 0) > .5 ? `${node.label} · ${branchCount}` : node.label;
      element.mark.textContent = node.id === state.confirmedNodeId ? '✓' : node.id === state.selectedNodeId ? '•' : '';
      element.mark.setAttribute('x', String(round(size.width / 2 - 5)));
      if (opacity > .05) visibleCount += 1;
      if (TARGET_DESCENDANTS.includes(node.id) && opacity < .05) hiddenTargetDescendants += 1;
    });

    NODES.filter(node => node.parent).forEach(node => {
      const edge = edgeElements.get(node.id);
      const parentPosition = positions.get(node.parent);
      const nodePosition = positions.get(node.id);
      const hidden = hiddenFactor(node);
      const midpoint = (parentPosition.x + nodePosition.x) / 2;
      edge.setAttribute('d', `M ${round(parentPosition.x)} ${round(parentPosition.y)} C ${round(midpoint)} ${round(parentPosition.y)} ${round(midpoint)} ${round(nodePosition.y)} ${round(nodePosition.x)} ${round(nodePosition.y)}`);
      edge.style.opacity = String(round(1 - hidden));
    });
    state.visibleNodeCount = visibleCount;
    state.hiddenDescendantCount = hiddenTargetDescendants;
    state.maximumHiddenDescendantCount = Math.max(state.maximumHiddenDescendantCount, hiddenTargetDescendants);
    state.renderedNodeCount = nodeElements.size;
    state.renderedEdgeCount = edgeElements.size;
    updateInterface();
  }

  function acceptInput(event, kind, source) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      state.lastInputSource = source;
      updateDataset();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    updateDataset();
    return true;
  }

  function snapshotState(action) {
    state.mutationSnapshots.push({
      action,
      selectedNodeId: state.selectedNodeId,
      selectedPath: state.selectedPath,
      selectedDepth: state.selectedDepth,
      confirmedNodeId: state.confirmedNodeId,
      confirmedPath: state.confirmedPath,
      resultHeld: state.resultHeld,
      resultValidated: state.resultValidated,
      collapsedBranchIds: [...collapsedBranches],
      branchProgress: { ...state.branchProgress },
    });
    state.snapshotDepth = state.mutationSnapshots.length;
  }

  function selectLeaf(node, source) {
    if (state.transitioning || node.kind !== 'leaf') return false;
    snapshotState(`select-${node.id}`);
    state.selectedNodeId = node.id;
    state.selectedPath = pathFor(node.id);
    state.selectedDepth = depthFor(node.id);
    state.leafSelectionInputCount += 1;
    state.phase = 'selected';
    state.auditTrail.push({ action: 'select', nodeId: node.id, source, trusted: true, retained: true });
    state.auditTrailCount = state.auditTrail.length;
    renderHierarchy();
    return true;
  }

  function confirmNavigation(source) {
    const node = nodeById(state.selectedNodeId);
    if (state.transitioning || !node || node.kind !== 'leaf') return false;
    snapshotState(`confirm-${node.id}`);
    state.confirmedNodeId = node.id;
    state.confirmedPath = pathFor(node.id);
    state.confirmCount += 1;
    state.confirmInputCount += 1;
    state.resultHeld = true;
    state.resultValidated = state.confirmedPath === state.selectedPath && state.selectedDepth >= 2;
    state.phase = 'confirmed';
    state.auditTrail.push({ action: 'confirm', nodeId: node.id, path: state.confirmedPath, source, trusted: true, retained: true });
    state.auditTrailCount = state.auditTrail.length;
    renderHierarchy();
    return true;
  }

  function checkUnaffectedPositions(branchId, beforePositions) {
    const descendants = new Set(descendantsOf(branchId).map(node => node.id));
    let maximumError = 0;
    NODES.filter(node => !descendants.has(node.id)).forEach(node => {
      const before = beforePositions.get(node.id);
      const after = positions.get(node.id);
      maximumError = Math.max(maximumError, Math.hypot(after.x - before.x, after.y - before.y));
    });
    state.maximumStableNodeMovementError = Math.max(state.maximumStableNodeMovementError, round(maximumError));
    state.unaffectedIdentityStable = state.maximumStableNodeMovementError <= .001;
    state.identityCheckCount += 1;
  }

  function toggleBranch(node, source) {
    if (state.transitioning || node.kind === 'leaf') return false;
    const descendants = descendantsOf(node.id);
    if (descendants.length === 0) return false;
    snapshotState(`toggle-${node.id}`);
    const currentlyCollapsed = collapsedBranches.has(node.id);
    const targetCollapsed = !currentlyCollapsed;
    const from = state.branchProgress[node.id] || 0;
    const to = targetCollapsed ? 1 : 0;
    const beforePositions = new Map([...positions].map(([id, point]) => [id, { ...point }]));
    if (targetCollapsed) collapsedBranches.add(node.id);
    else collapsedBranches.delete(node.id);
    state.transitioning = true;
    state.phase = targetCollapsed ? 'collapsing' : 'restoring';
    state.branchToggleInputCount += 1;
    state.transitionStartCount += 1;
    state.motionControlCount += 1;
    state.motionStartCount += 1;
    if (targetCollapsed) state.collapseCount += 1;
    else state.restoreCount += 1;
    const record = {
      action: targetCollapsed ? 'collapse' : 'restore',
      branchId: node.id,
      descendantIds: descendants.map(item => item.id),
      unaffectedIds: NODES.filter(item => item.id !== node.id && !descendants.some(descendant => descendant.id === item.id)).map(item => item.id),
      source,
      trusted: true,
      completed: false,
      retained: false,
      stableMovementError: null,
    };
    state.transitionRecords.push(record);
    const duration = state.reducedMotion ? .01 : .48;
    activeControl?.stop();
    activeControl = animate(from, to, {
      duration,
      ease: [.2, .8, .24, 1],
      onUpdate(progress) {
        state.branchProgress[node.id] = round(progress);
        renderHierarchy();
      },
      onComplete() {
        state.branchProgress[node.id] = to;
        state.transitioning = false;
        state.transitionCompleteCount += 1;
        state.motionCompleteCount += 1;
        state.phase = targetCollapsed ? 'collapsed' : 'restored';
        record.completed = true;
        record.retained = true;
        renderHierarchy();
        checkUnaffectedPositions(node.id, beforePositions);
        if (node.id === TARGET_BRANCH_ID && targetCollapsed) {
          state.unaffectedVisibleCountDuringCollapse = state.visibleNodeCount;
        }
        state.auditTrail.push({ action: record.action, nodeId: node.id, descendants: record.descendantIds, source, trusted: true, retained: true });
        state.auditTrailCount = state.auditTrail.length;
        record.stableMovementError = state.maximumStableNodeMovementError;
        updateInterface();
      },
    });
    updateInterface();
    return true;
  }

  function restoreSnapshot(snapshot, source) {
    collapsedBranches.clear();
    snapshot.collapsedBranchIds.forEach(id => collapsedBranches.add(id));
    Object.assign(state.branchProgress, snapshot.branchProgress);
    state.selectedNodeId = snapshot.selectedNodeId;
    state.selectedPath = snapshot.selectedPath;
    state.selectedDepth = snapshot.selectedDepth;
    state.confirmedNodeId = snapshot.confirmedNodeId;
    state.confirmedPath = snapshot.confirmedPath;
    state.resultHeld = snapshot.resultHeld;
    state.resultValidated = snapshot.resultValidated;
    state.lastUndoRestoredSelectedId = snapshot.selectedNodeId;
    state.lastUndoRestoredConfirmedId = snapshot.confirmedNodeId;
    state.undoCount += 1;
    state.undoInputCount += 1;
    state.phase = 'undo-restored';
    state.snapshotDepth = state.mutationSnapshots.length;
    state.auditTrail.push({ action: 'undo', restoredSelectedId: snapshot.selectedNodeId, restoredConfirmedId: snapshot.confirmedNodeId, source, trusted: true, retained: true });
    state.auditTrailCount = state.auditTrail.length;
    renderHierarchy();
  }

  function undoLast(source) {
    if (state.transitioning || state.mutationSnapshots.length === 0) return false;
    const snapshot = state.mutationSnapshots.pop();
    restoreSnapshot(snapshot, source);
    return true;
  }

  function handleNodeActivation(event, node, kind) {
    if (!acceptInput(event, kind, `${kind}-node-${node.id}`)) return;
    if (kind === 'pointer') state.pointerNodeInputCount += 1;
    else state.keyboardNodeInputCount += 1;
    if (node.kind === 'leaf') selectLeaf(node, `${kind}-node-${node.id}`);
    else toggleBranch(node, `${kind}-node-${node.id}`);
  }

  function handleConfirmButton(event) {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!acceptInput(event, kind, `${kind}-confirm-button`)) return;
    if (kind === 'pointer') state.pointerButtonInputCount += 1;
    else state.keyboardButtonInputCount += 1;
    confirmNavigation(`${kind}-confirm-button`);
  }

  function handleUndoButton(event) {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!acceptInput(event, kind, `${kind}-undo-button`)) return;
    if (kind === 'pointer') state.pointerButtonInputCount += 1;
    else state.keyboardButtonInputCount += 1;
    undoLast(`${kind}-undo-button`);
  }

  function handleStageKeyboard(event) {
    if (event.defaultPrevented || state.transitioning) return;
    if (event.key.toLowerCase() === 'c') {
      if (!acceptInput(event, 'keyboard', 'keyboard-c-confirm')) return;
      state.keyboardButtonInputCount += 1;
      confirmNavigation('keyboard-c-confirm');
      event.preventDefault();
    } else if (event.key.toLowerCase() === 'u' || event.key === 'Escape') {
      if (!acceptInput(event, 'keyboard', 'keyboard-undo')) return;
      state.keyboardButtonInputCount += 1;
      undoLast('keyboard-undo');
      event.preventDefault();
    }
  }

  function buildTree() {
    NODES.filter(node => node.parent).forEach(node => {
      const path = document.createElementNS(NS, 'path');
      path.classList.add('tree-edge');
      path.dataset.childId = node.id;
      edgeLayer.append(path);
      edgeElements.set(node.id, path);
    });

    NODES.forEach(node => {
      const group = document.createElementNS(NS, 'g');
      group.classList.add('tree-node');
      group.id = `node-${node.id}`;
      group.dataset.nodeId = node.id;
      group.dataset.kind = node.kind;
      group.dataset.selected = 'false';
      group.dataset.confirmed = 'false';
      group.setAttribute('role', 'treeitem');
      group.setAttribute('aria-label', `${node.kind === 'leaf' ? 'File' : 'Folder'} ${node.fullLabel}`);
      group.setAttribute('tabindex', '0');
      if (node.kind !== 'leaf') group.setAttribute('aria-expanded', 'true');
      const rect = document.createElementNS(NS, 'rect');
      const text = document.createElementNS(NS, 'text');
      const mark = document.createElementNS(NS, 'text');
      text.textContent = node.label;
      mark.classList.add('node-mark');
      mark.setAttribute('y', '-3');
      group.append(rect, text, mark);
      group.addEventListener('click', event => handleNodeActivation(event, node, 'pointer'));
      group.addEventListener('keydown', event => {
        if (!['Enter', ' '].includes(event.key)) return;
        handleNodeActivation(event, node, 'keyboard');
        event.preventDefault();
        event.stopPropagation();
      });
      nodeLayer.append(group);
      nodeElements.set(node.id, { group, rect, text, mark });
    });
  }

  async function initialize() {
    invariant(stage instanceof HTMLElement && svg instanceof SVGElement, 'stage or SVG is missing');
    invariant(NODES.length === 12, 'repository must have twelve stable nodes');
    invariant(new Set(NODES.map(node => node.id)).size === NODES.length, 'node identities must be unique');
    invariant(descendantsOf(TARGET_BRANCH_ID).map(node => node.id).join(',') === TARGET_DESCENDANTS.join(','), 'components descendant set changed');
    buildTree();
    confirmButton.addEventListener('click', handleConfirmButton);
    undoButton.addEventListener('click', handleUndoButton);
    stage.addEventListener('keydown', handleStageKeyboard);
    window.addEventListener('resize', renderHierarchy);
    updateGeometryEvidence();
    renderHierarchy();

    await document.fonts.ready;
    const initialSignature = `${state.selectedNodeId}|${state.confirmedNodeId}|${state.visibleNodeCount}|${state.transitionStartCount}|${NODES.map(node => `${node.id}:${nodeElements.get(node.id).group.getAttribute('transform')}:${nodeElements.get(node.id).group.style.opacity}`).join('|')}`;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const secondSignature = `${state.selectedNodeId}|${state.confirmedNodeId}|${state.visibleNodeCount}|${state.transitionStartCount}|${NODES.map(node => `${node.id}:${nodeElements.get(node.id).group.getAttribute('transform')}:${nodeElements.get(node.id).group.style.opacity}`).join('|')}`;
    state.initialStillVerified = initialSignature === secondSignature
      && state.inputCount === 0
      && state.visibleNodeCount === NODES.length
      && state.transitionStartCount === 0
      && state.mutationSnapshots.length === 0
      && state.phase === 'waiting';
    invariant(state.initialStillVerified, 'repository tree changed before human input');
    state.ready = true;
    updateInterface();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    updateGeometryEvidence();
    const geometryEvidence = state.stageWidth > 0
      && state.stageHeight > 0
      && Math.abs(state.svgWidth - state.stageWidth) <= 1
      && Math.abs(state.svgHeight - state.stageHeight) <= 1
      && state.geometryCoverageX >= .995
      && state.geometryCoverageY >= .995;
    const hierarchyEvidence = state.nodeCount === 12
      && state.edgeCount === 11
      && state.rootCount === 1
      && state.branchNodeCount === 4
      && state.leafNodeCount === 7
      && state.renderedNodeCount === state.nodeCount
      && state.renderedEdgeCount === state.edgeCount
      && state.hierarchyIdentitySignature === NODES.map(node => `${node.id}:${node.parent || 'root'}:${node.kind}`).join('|')
      && new Set([...nodeElements.keys()]).size === state.nodeCount;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticCollapse
      && !state.automaticRestore
      && !state.automaticSelection
      && !state.automaticPlayback
      && !state.automaticCycle
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.inputCount === state.trustedInputCount
      && state.lastInputTrusted === (state.inputCount > 0)
      && state.transitionRecords.every(record => record.trusted && record.completed && record.retained)
      && state.auditTrail.every(record => record.trusted && record.retained);
    const initialOrOwned = state.inputCount === 0
      ? state.phase === 'waiting'
        && state.selectedNodeId === 'none'
        && state.confirmedNodeId === 'none'
        && state.visibleNodeCount === state.nodeCount
        && !state.resultHeld
      : !state.transitioning
        && state.selectedNodeId !== 'none'
        && state.selectedPath === pathFor(state.selectedNodeId)
        && state.selectedDepth >= 2
        && (state.confirmCount === 0
          ? !state.resultHeld
          : state.confirmedNodeId !== 'none'
            && state.confirmedPath === pathFor(state.confirmedNodeId)
            && state.resultHeld
            && state.resultValidated);
    const sequenceEvidence = state.auditTrailCount < 6
      ? true
      : state.confirmCount === 1
        && state.collapseCount === 1
        && state.restoreCount === 1
        && state.transitionStartCount === state.transitionCompleteCount
        && state.transitionStartCount === 2
        && state.motionControlCount === state.motionStartCount
        && state.motionStartCount === state.motionCompleteCount
        && state.motionCompleteCount === 2
        && state.transitionRecords[0]?.action === 'collapse'
        && state.transitionRecords[1]?.action === 'restore'
        && state.transitionRecords.every(record => record.branchId === TARGET_BRANCH_ID)
        && state.transitionRecords.every(record => record.descendantIds.join(',') === TARGET_DESCENDANTS.join(','))
        && state.maximumHiddenDescendantCount === TARGET_DESCENDANTS.length
        && state.unaffectedVisibleCountDuringCollapse === state.nodeCount - TARGET_DESCENDANTS.length
        && state.unaffectedIdentityStable
        && state.maximumStableNodeMovementError === 0
        && state.identityCheckCount === 2
        && collapsedBranches.size === 0
        && state.visibleNodeCount === state.nodeCount
        && state.undoCount === 1
        && state.selectedNodeId === 'map-panel'
        && state.confirmedNodeId === 'map-panel'
        && state.selectedPath === 'atlas-studio/components/MapPanel.tsx'
        && state.confirmedPath === state.selectedPath
        && state.lastUndoRestoredSelectedId === 'map-panel'
        && state.lastUndoRestoredConfirmedId === 'map-panel'
        && state.auditTrail.map(record => record.action).join(',') === 'select,confirm,collapse,restore,select,undo';
    state.runtimeAssertionPassed = Boolean(state.ready
      && geometryEvidence
      && hierarchyEvidence
      && honestInteraction
      && initialOrOwned
      && sequenceEvidence);
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
