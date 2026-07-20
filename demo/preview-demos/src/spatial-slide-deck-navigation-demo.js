import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#deck-stage');
  const shell = document.querySelector('#deck-shell');
  const spatialStage = document.querySelector('#spatial-stage');
  const slides = [...document.querySelectorAll('.slide')];
  const mapNodes = [...document.querySelectorAll('.map-node')];
  const directionButtons = [...document.querySelectorAll('.control-button[data-direction]')];
  const overviewButton = document.querySelector('#overview-button');
  const headerState = document.querySelector('#header-state');
  const viewportLabel = document.querySelector('#viewport-label');
  const routeCoordinate = document.querySelector('#route-coordinate');
  const footerCoordinate = document.querySelector('#footer-coordinate');
  const assetImages = [...document.querySelectorAll('img[src*="harbor-edge-field-study"]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const slideRecords = slides.map((element, order) => ({
    element,
    id: element.dataset.slideId,
    x: Number(element.dataset.x),
    y: Number(element.dataset.y),
    order,
  }));
  const slideById = new Map(slideRecords.map(record => [record.id, record]));
  const coordinateIndex = new Map(slideRecords.map(record => [`${record.x},${record.y}`, record]));
  const expectedCoordinates = ['0,0', '1,0', '1,1', '1,2', '2,0', '3,0'];
  const shortLabels = {
    brief: 'Brief',
    site: 'Site',
    risk: 'Tidal risk',
    access: 'Public access',
    proposal: 'Proposal',
    decision: 'Decision',
  };
  const displayIndex = {
    brief: '01',
    site: '02',
    risk: '2A',
    access: '2B',
    proposal: '03',
    decision: '04',
  };
  const counterKeys = [
    'inputCount',
    'pointerInputCount',
    'keyboardInputCount',
    'touchInputCount',
    'swipeCount',
    'buttonNavigationCount',
    'mapSelectionCount',
    'slideSelectionCount',
    'overviewToggleCount',
    'transitionCount',
    'motionStartCount',
    'motionCompleteCount',
    'motionCancelCount',
    'reducedMotionDirectCount',
    'resizeLayoutCount',
    'renderCount',
  ];

  const state = {
    id: 'spatial-slide-deck-navigation',
    automaticNavigation: false,
    automaticOverview: false,
    automaticRehearsal: false,
    previewClockDriven: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    firstFrameStatic: true,
    mode: 'present',
    currentId: 'brief',
    position: { x: 0, y: 0 },
    visitedIds: ['brief'],
    activeInput: false,
    activeInputKind: null,
    pointerCaptured: false,
    dragDistance: { x: 0, y: 0 },
    lastDirection: 'none',
    lastTransition: null,
    transitionHistory: [],
    animationActive: false,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    touchInputCount: 0,
    swipeCount: 0,
    buttonNavigationCount: 0,
    mapSelectionCount: 0,
    slideSelectionCount: 0,
    overviewToggleCount: 0,
    transitionCount: 0,
    motionStartCount: 0,
    motionCompleteCount: 0,
    motionCancelCount: 0,
    reducedMotionDirectCount: 0,
    resizeLayoutCount: 0,
    renderCount: 0,
    motionRevision: 0,
    assetLoaded: false,
    initialStaticVerified: false,
    reducedMotion: reducedMotion.matches,
    lastTrustedEvent: 'none',
    lastLayoutCause: 'initial-static-layout',
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let motions = [];
  let layoutPromise = Promise.resolve();
  let activePointer = null;
  let lastPointerType = 'mouse';
  let suppressSlideClick = false;
  let resizeQueued = false;

  const nextFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const currentRecord = () => slideById.get(state.currentId);
  const coordinateToken = record => `${record.x},${record.y}`;
  const stateToken = () => `${state.currentId}:${state.mode}`;

  const classifyPointer = (event, fallback = lastPointerType) => event.pointerType || fallback || 'mouse';

  const recordInput = (kind, event, cause, pointerType = null) => {
    if (!event || event.isTrusted !== true) return false;
    state.inputKind = kind;
    state.inputCount += 1;
    state.lastTrustedEvent = cause;
    if (kind === 'keyboard') {
      state.keyboardInputCount += 1;
    } else {
      state.pointerInputCount += 1;
      if ((pointerType || classifyPointer(event)) === 'touch') state.touchInputCount += 1;
    }
    return true;
  };

  const targetForDirection = (record, direction) => {
    if (direction === 'up') return coordinateIndex.get(`${record.x},${record.y - 1}`) || null;
    if (direction === 'down') return coordinateIndex.get(`${record.x},${record.y + 1}`) || null;
    if (direction === 'left') return coordinateIndex.get(`${record.x - 1},0`) || null;
    if (direction === 'right') return coordinateIndex.get(`${record.x + 1},0`) || null;
    return null;
  };

  const layoutFor = (record, rect) => {
    const current = currentRecord();
    if (state.mode === 'overview') {
      return {
        x: (record.x - 1.5) * rect.width * .215,
        y: (record.y - .67) * rect.height * .275,
        scale: .235,
        rotateZ: 0,
        opacity: 1,
        zIndex: record.id === state.currentId ? 8 : 4,
      };
    }

    const dx = record.x - current.x;
    const dy = record.y - current.y;
    const distance = Math.abs(dx) + Math.abs(dy);
    return {
      x: dx * rect.width * .76,
      y: dy * rect.height * .78,
      scale: distance === 0 ? 1 : distance === 1 ? .79 : .68,
      rotateZ: dx * 3.4 - dy * 2.2,
      opacity: distance === 0 ? 1 : distance === 1 ? .54 : distance === 2 ? .2 : 0,
      zIndex: distance === 0 ? 10 : Math.max(1, 7 - distance),
    };
  };

  const clearMotionStyles = () => {
    for (const record of slideRecords) {
      record.element.style.removeProperty('translate');
      record.element.style.removeProperty('scale');
      record.element.style.removeProperty('rotate');
    }
  };

  const stopMotions = () => {
    if (state.animationActive) state.motionCancelCount += 1;
    state.motionRevision += 1;
    for (const motion of motions) motion.stop();
    motions = [];
    state.animationActive = false;
    clearMotionStyles();
  };

  const setDirectLayout = layouts => {
    slideRecords.forEach((record, index) => {
      const layout = layouts[index];
      record.element.style.transform = `translate3d(${layout.x.toFixed(3)}px, ${layout.y.toFixed(3)}px, 0) scale(${layout.scale}) rotate(${layout.rotateZ}deg)`;
      record.element.style.opacity = String(layout.opacity);
      record.element.style.zIndex = String(layout.zIndex);
    });
  };

  const syncDom = () => {
    const current = currentRecord();
    state.position = { x: current.x, y: current.y };
    spatialStage.dataset.mode = state.mode;
    headerState.textContent = state.mode === 'overview'
      ? `Overview · ${shortLabels[state.currentId]} selected`
      : `Presenting · ${shortLabels[state.currentId]}`;
    viewportLabel.textContent = state.mode === 'overview'
      ? 'Overview · select a card'
      : `Present · ${displayIndex[state.currentId]} ${shortLabels[state.currentId]}`;
    routeCoordinate.textContent = `${String(current.x).padStart(2, '0')} / ${String(current.y).padStart(2, '0')}`;
    footerCoordinate.textContent = `${displayIndex[state.currentId]} · ${String(current.x).padStart(2, '0')}/${String(current.y).padStart(2, '0')}`;
    overviewButton.setAttribute('aria-pressed', String(state.mode === 'overview'));
    overviewButton.textContent = state.mode === 'overview' ? 'Return' : 'Overview';

    for (const record of slideRecords) {
      const isCurrent = record.id === state.currentId;
      const isOverview = state.mode === 'overview';
      record.element.dataset.current = String(isCurrent);
      record.element.setAttribute('aria-current', String(isCurrent));
      record.element.setAttribute('aria-hidden', String(!isOverview && !isCurrent));
      record.element.tabIndex = isOverview || isCurrent ? 0 : -1;
    }

    for (const node of mapNodes) {
      node.dataset.current = String(node.dataset.slideId === state.currentId);
      node.dataset.visited = String(state.visitedIds.includes(node.dataset.slideId));
      node.setAttribute('aria-current', String(node.dataset.slideId === state.currentId));
    }

    for (const button of directionButtons) {
      button.disabled = !targetForDirection(current, button.dataset.direction);
    }
  };

  const applyLayout = (animateLayout, cause = 'layout') => {
    stopMotions();
    const rect = spatialStage.getBoundingClientRect();
    const layouts = slideRecords.map(record => layoutFor(record, rect));
    state.lastLayoutCause = cause;

    if (!animateLayout || reducedMotion.matches) {
      setDirectLayout(layouts);
      if (animateLayout && reducedMotion.matches) state.reducedMotionDirectCount += 1;
      layoutPromise = Promise.resolve();
      return layoutPromise;
    }

    const revision = state.motionRevision;
    state.animationActive = true;
    state.motionStartCount += 1;
    motions = slideRecords.map((record, index) => {
      const layout = layouts[index];
      record.element.style.zIndex = String(layout.zIndex);
      return animate(record.element, {
        x: layout.x,
        y: layout.y,
        scale: layout.scale,
        rotateZ: layout.rotateZ,
        opacity: layout.opacity,
      }, {
        duration: .48,
        ease: [.2, .72, .16, 1],
      });
    });

    layoutPromise = Promise.allSettled(motions.map(motion => motion.finished)).then(() => {
      if (revision !== state.motionRevision) return;
      state.animationActive = false;
      state.motionCompleteCount += 1;
      motions = [];
    });
    return layoutPromise;
  };

  const recordTransition = (from, cause) => {
    const transition = {
      from,
      to: stateToken(),
      cause,
      inputCountAtTransition: state.inputCount,
      trusted: state.lastTrustedEvent !== 'none',
    };
    state.lastTransition = transition;
    state.transitionHistory.push(transition);
    if (state.transitionHistory.length > 12) state.transitionHistory.shift();
    state.transitionCount += 1;
  };

  const presentSlide = (record, cause, selectionKind = 'navigation') => {
    if (!record) return false;
    const from = stateToken();
    const changed = record.id !== state.currentId || state.mode !== 'present';
    if (!changed) return false;
    state.currentId = record.id;
    state.mode = 'present';
    state.lastDirection = cause;
    if (!state.visitedIds.includes(record.id)) state.visitedIds.push(record.id);
    if (selectionKind === 'map') state.mapSelectionCount += 1;
    if (selectionKind === 'slide') state.slideSelectionCount += 1;
    recordTransition(from, cause);
    syncDom();
    applyLayout(true, cause);
    return true;
  };

  const toggleOverview = cause => {
    const from = stateToken();
    state.mode = state.mode === 'overview' ? 'present' : 'overview';
    state.overviewToggleCount += 1;
    state.lastDirection = 'overview';
    recordTransition(from, cause);
    syncDom();
    applyLayout(true, cause);
  };

  const navigate = (direction, cause) => {
    const target = targetForDirection(currentRecord(), direction);
    if (!target) return false;
    state.lastDirection = direction;
    return presentSlide(target, cause, 'navigation');
  };

  document.addEventListener('pointerdown', event => {
    lastPointerType = classifyPointer(event);
  }, { capture: true });

  for (const button of directionButtons) {
    button.addEventListener('click', event => {
      const kind = event.detail === 0 ? 'keyboard' : 'pointer';
      const pointerType = kind === 'pointer' ? lastPointerType : null;
      if (!recordInput(kind, event, `${kind}-${button.dataset.direction}-control`, pointerType)) return;
      state.buttonNavigationCount += 1;
      navigate(button.dataset.direction, `${button.dataset.direction}-control`);
    });
  }

  overviewButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    const pointerType = kind === 'pointer' ? lastPointerType : null;
    if (!recordInput(kind, event, `${kind}-overview-control`, pointerType)) return;
    toggleOverview('overview-control');
  });

  mapNodes.forEach(node => {
    node.addEventListener('click', event => {
      const kind = event.detail === 0 ? 'keyboard' : 'pointer';
      const pointerType = kind === 'pointer' ? lastPointerType : null;
      if (!recordInput(kind, event, `${kind}-map-select-${node.dataset.slideId}`, pointerType)) return;
      presentSlide(slideById.get(node.dataset.slideId), `map-select-${node.dataset.slideId}`, 'map');
    });
  });

  slideRecords.forEach(record => {
    record.element.addEventListener('click', event => {
      if (state.mode !== 'overview' || suppressSlideClick) return;
      const kind = event.detail === 0 ? 'keyboard' : 'pointer';
      const pointerType = kind === 'pointer' ? lastPointerType : null;
      if (!recordInput(kind, event, `${kind}-overview-slide-${record.id}`, pointerType)) return;
      presentSlide(record, `overview-slide-${record.id}`, 'slide');
    });
    record.element.addEventListener('keydown', event => {
      if (state.mode !== 'overview' || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      event.stopPropagation();
      if (!recordInput('keyboard', event, `keyboard-overview-slide-${record.id}`)) return;
      presentSlide(record, `overview-slide-${record.id}`, 'slide');
    });
  });

  spatialStage.addEventListener('keydown', event => {
    const direction = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    }[event.key];
    if (direction) {
      event.preventDefault();
      if (event.repeat || !recordInput('keyboard', event, `keyboard-${direction}`)) return;
      navigate(direction, `keyboard-${direction}`);
      return;
    }
    if ((event.key === 'o' || event.key === 'O' || event.key === 'Escape') && !event.repeat) {
      event.preventDefault();
      if (!recordInput('keyboard', event, `keyboard-${event.key === 'Escape' ? 'escape' : 'overview'}`)) return;
      toggleOverview(event.key === 'Escape' ? 'keyboard-escape' : 'keyboard-overview');
    }
  });

  spatialStage.addEventListener('pointerdown', event => {
    if (event.button !== 0 || activePointer) return;
    event.preventDefault();
    spatialStage.focus({ preventScroll: true });
    const pointerType = classifyPointer(event);
    if (!recordInput('pointer', event, `${pointerType}-swipe-start`, pointerType)) return;
    activePointer = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      targetSlide: event.target.closest('.slide')?.dataset.slideId || null,
    };
    state.activeInput = true;
    state.activeInputKind = pointerType;
    state.pointerCaptured = true;
    state.dragDistance = { x: 0, y: 0 };
    spatialStage.setPointerCapture(event.pointerId);
  });

  spatialStage.addEventListener('pointermove', event => {
    if (!activePointer || activePointer.id !== event.pointerId) return;
    state.dragDistance = {
      x: event.clientX - activePointer.startX,
      y: event.clientY - activePointer.startY,
    };
  });

  const finishPointer = (event, cancelled = false) => {
    if (!activePointer || activePointer.id !== event.pointerId) return;
    const pointer = activePointer;
    const pointerType = classifyPointer(event, state.activeInputKind);
    const dx = event.clientX - pointer.startX;
    const dy = event.clientY - pointer.startY;
    if (spatialStage.hasPointerCapture(event.pointerId)) spatialStage.releasePointerCapture(event.pointerId);
    activePointer = null;
    state.activeInput = false;
    state.activeInputKind = null;
    state.pointerCaptured = false;
    state.dragDistance = { x: dx, y: dy };
    if (!recordInput('pointer', event, `${pointerType}-${cancelled ? 'swipe-cancel' : 'swipe-end'}`, pointerType)) return;
    if (cancelled) return;

    const threshold = Math.max(16, Math.min(34, spatialStage.clientWidth * .075));
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= threshold) {
      const direction = Math.abs(dx) >= Math.abs(dy)
        ? (dx < 0 ? 'right' : 'left')
        : (dy < 0 ? 'down' : 'up');
      state.swipeCount += 1;
      suppressSlideClick = true;
      navigate(direction, `${pointerType}-swipe-${direction}`);
      requestAnimationFrame(() => { suppressSlideClick = false; });
      return;
    }

    if (state.mode === 'overview' && pointer.targetSlide) {
      suppressSlideClick = true;
      presentSlide(slideById.get(pointer.targetSlide), `${pointerType}-overview-tap`, 'slide');
      requestAnimationFrame(() => { suppressSlideClick = false; });
    }
  };

  spatialStage.addEventListener('pointerup', event => finishPointer(event));
  spatialStage.addEventListener('pointercancel', event => finishPointer(event, true));
  spatialStage.addEventListener('lostpointercapture', event => {
    if (activePointer?.id === event.pointerId) finishPointer(event, true);
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    stopMotions();
    applyLayout(false, 'reduced-motion-change');
  });

  const assetsReady = Promise.all(assetImages.map(image => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', () => reject(new Error(`Unable to load ${image.src}`)), { once: true });
    });
  })).then(() => {
    state.assetLoaded = assetImages.length === 3
      && assetImages.every(image => image.naturalWidth >= 1200 && image.naturalHeight >= 800);
  });

  syncDom();
  applyLayout(false, 'initial-static-layout');

  const ready = (async () => {
    await Promise.all([document.fonts.ready, assetsReady]);
    await nextFrames();
    applyLayout(false, 'ready-static-layout');
    await nextFrames();
    state.initialStaticVerified = state.mode === 'present'
      && state.currentId === 'brief'
      && state.transitionCount === 0
      && state.inputCount === 0
      && state.motionStartCount === 0
      && state.motionCompleteCount === 0
      && state.visitedIds.join(',') === 'brief'
      && state.assetLoaded;
  })();

  const resizeObserver = new ResizeObserver(() => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      state.resizeLayoutCount += 1;
      applyLayout(false, 'viewport-resize');
    });
  });
  resizeObserver.observe(spatialStage);

  const render = () => {
    state.renderCount += 1;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await layoutPromise;
    await nextFrames();

    const current = currentRecord();
    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const spatialRect = spatialStage.getBoundingClientRect();
    const currentRect = current.element.getBoundingClientRect();
    const visibleSlides = slideRecords.filter(record => Number.parseFloat(getComputedStyle(record.element).opacity) > .92);
    const currentNodes = mapNodes.filter(node => node.dataset.current === 'true');
    const enabledDirections = Object.fromEntries(directionButtons.map(button => [button.dataset.direction, !button.disabled]));
    const expectedDirections = Object.fromEntries(['up', 'down', 'left', 'right'].map(direction => [direction, Boolean(targetForDirection(current, direction))]));
    const historyValid = state.transitionHistory.length <= 12
      && state.transitionHistory.every(transition => transition.from !== transition.to
        && transition.inputCountAtTransition > 0
        && transition.trusted === true)
      && state.transitionCount >= state.transitionHistory.length
      && (!state.lastTransition || state.lastTransition.to === stateToken());
    const countersValid = counterKeys.every(key => Number.isInteger(state[key]) && state[key] >= 0)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.touchInputCount <= state.pointerInputCount
      && state.motionCompleteCount <= state.motionStartCount
      && state.motionCancelCount <= state.motionStartCount;
    const semanticStateValid = coordinateIndex.get(`${state.position.x},${state.position.y}`)?.id === state.currentId
      && current.element.dataset.current === 'true'
      && current.element.getAttribute('aria-current') === 'true'
      && currentNodes.length === 1
      && currentNodes[0].dataset.slideId === state.currentId
      && overviewButton.getAttribute('aria-pressed') === String(state.mode === 'overview')
      && spatialStage.dataset.mode === state.mode
      && Object.keys(expectedDirections).every(direction => enabledDirections[direction] === expectedDirections[direction])
      && state.visitedIds.includes(state.currentId)
      && new Set(state.visitedIds).size === state.visitedIds.length
      && state.visitedIds.every(id => slideById.has(id))
      && (state.mode === 'overview'
        ? visibleSlides.length === slideRecords.length && slideRecords.every(record => record.element.tabIndex === 0)
        : visibleSlides.length === 1 && visibleSlides[0].id === state.currentId
          && slideRecords.every(record => record.element.tabIndex === (record.id === state.currentId ? 0 : -1)));
    const rectInside = (inner, outer, tolerance = 1) => inner.left >= outer.left - tolerance
      && inner.top >= outer.top - tolerance
      && inner.right <= outer.right + tolerance
      && inner.bottom <= outer.bottom + tolerance;
    const viewportValid = rectInside(shellRect, stageRect)
      && rectInside(currentRect, spatialRect)
      && (state.mode !== 'overview' || slideRecords.every(record => rectInside(record.element.getBoundingClientRect(), spatialRect, 2)))
      && stageRect.width <= innerWidth + 1
      && stageRect.height <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;
    const assetValid = state.assetLoaded
      && assetImages.length === 3
      && assetImages.every(image => image.complete
        && image.naturalWidth === 1440
        && image.naturalHeight === 960
        && image.currentSrc.includes('harbor-edge-field-study'));

    return typeof animate === 'function'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && slideRecords.length === 6
      && mapNodes.length === 6
      && expectedCoordinates.every(coordinate => coordinateIndex.has(coordinate))
      && new Set(slideRecords.map(record => coordinateToken(record))).size === 6
      && state.automaticNavigation === false
      && state.automaticOverview === false
      && state.automaticRehearsal === false
      && state.previewClockDriven === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.firstFrameStatic === true
      && state.initialStaticVerified
      && semanticStateValid
      && historyValid
      && countersValid
      && viewportValid
      && assetValid
      && state.renderCount > 0;
  };

  window.addEventListener('beforeunload', () => {
    resizeObserver.disconnect();
    stopMotions();
  }, { once: true });

  installPreviewController({
    id: 'spatial-slide-deck-navigation',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
