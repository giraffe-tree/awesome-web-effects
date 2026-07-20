import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-c-utils.js';

try {
  const stage = document.querySelector('#handoff-stage');
  const scenes = [...document.querySelectorAll('.scene-plane')];
  const tabs = [...document.querySelectorAll('.scenario-tab')];
  const overlay = document.querySelector('#handoff-overlay');
  const summary = document.querySelector('#case-summary');
  const kicker = document.querySelector('#case-kicker');
  const title = document.querySelector('#case-title');
  const detail = document.querySelector('#case-detail');
  const route = document.querySelector('#route-strip');
  const queue = document.querySelector('#route-value');
  const priority = document.querySelector('#priority-value');
  const action = document.querySelector('#case-action');
  const perspective = document.querySelector('#perspective-label');
  const perspectiveTitle = document.querySelector('#perspective-title');
  const perspectiveStatus = document.querySelector('#perspective-status');
  const workbenchStatus = document.querySelector('#workbench-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scenarios = [
    {
      id: 'billing-dispute',
      backgroundKey: 'billing-ledger',
      summaryKey: 'duplicate-renewal-variance',
      routeKey: 'billing-resolutions-p1',
      actionKey: 'ledger-credit-draft',
      perspectiveKey: 'ledger-evidence',
      kicker: 'CS–48291 · Billing dispute',
      title: 'Duplicate renewal after seat reduction',
      detail: 'Harbor Studio reduced 84 → 61 seats, but the annual invoice renewed the old count and added a $2,400 variance.',
      queue: 'Billing resolutions',
      priority: 'P1 · 18m',
      action: 'Open ledger + draft credit',
      actionOutcome: 'Credit draft staged',
      perspective: 'Ledger view',
      status: 'Evidence ready'
    },
    {
      id: 'account-risk',
      backgroundKey: 'identity-anomaly-radar',
      summaryKey: 'mfa-reset-payout-change',
      routeKey: 'account-integrity-p0',
      actionKey: 'freeze-verify-owner',
      perspectiveKey: 'risk-timeline',
      kicker: 'TR–19307 · Account takeover risk',
      title: 'MFA reset followed by payout-bank change',
      detail: 'The workspace owner is locked out after a new-device MFA reset; the payout destination changed eleven minutes later.',
      queue: 'Account integrity',
      priority: 'P0 · critical',
      action: 'Freeze access + verify owner',
      actionOutcome: 'Access freeze staged',
      perspective: 'Risk timeline',
      status: '2 signals confirmed'
    },
    {
      id: 'enterprise-migration',
      backgroundKey: 'migration-dependency-map',
      summaryKey: 'scim-mapping-cutover-block',
      routeKey: 'enterprise-migration-p2',
      actionKey: 'open-cutover-plan',
      perspectiveKey: 'dependency-map',
      kicker: 'EM–77102 · Enterprise migration',
      title: 'SCIM mapping blocks 14k-user cutover',
      detail: 'Three department codes resolve to duplicate groups, blocking the scheduled identity cutover for 14,200 managed users.',
      queue: 'Enterprise migration',
      priority: 'P2 · T–6h',
      action: 'Open cutover plan',
      actionOutcome: 'Cutover plan opened',
      perspective: 'Dependency map',
      status: '3 blockers · T–6h'
    }
  ];
  const state = {
    automaticFallback: false,
    automaticPlayback: false,
    syntheticInputDispatch: false,
    activeIndex: 0,
    displayedIndex: 0,
    requestedIndex: 0,
    pendingIndex: null,
    phase: 'idle',
    transitionProgress: 0,
    synchronizedLayers: {},
    inputKind: 'none',
    inputCount: 0,
    clickCount: 0,
    keyboardCount: 0,
    switchCount: 0,
    animatedTransitionCount: 0,
    directSwitchCount: 0,
    primaryActionCount: 0,
    lastAction: null,
    actionFeedback: '',
    reducedMotion: reducedMotion.matches,
    initialStaticConfirmed: false,
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let latestPointerKind = 'mouse';
  let transitionControl = null;
  let transitionSerial = 0;
  let contentSwapped = false;

  function recordInput(inputKind) {
    state.inputKind = inputKind;
    state.inputCount += 1;
  }

  function layerStateFor(index) {
    const scenario = scenarios[index];
    return {
      background: scenario.backgroundKey,
      summary: scenario.summaryKey,
      route: scenario.routeKey,
      action: scenario.actionKey,
      perspective: scenario.perspectiveKey
    };
  }

  function updateStatus() {
    const number = String(state.displayedIndex + 1).padStart(2, '0');
    const phaseLabel = state.phase === 'transitioning' ? 'Routing handoff'
      : state.actionFeedback ? state.actionFeedback : 'Case synchronized';
    workbenchStatus.textContent = `${phaseLabel} · ${number} / ${String(scenarios.length).padStart(2, '0')}`;
  }

  function writeContent(index) {
    const scenario = scenarios[index];
    state.displayedIndex = index;
    state.synchronizedLayers = layerStateFor(index);
    kicker.textContent = scenario.kicker;
    title.textContent = scenario.title;
    detail.textContent = scenario.detail;
    queue.textContent = scenario.queue;
    priority.textContent = scenario.priority;
    action.textContent = scenario.action;
    action.setAttribute('aria-label', `${scenario.action} for ${scenario.kicker}`);
    perspectiveTitle.textContent = scenario.perspective;
    perspectiveStatus.textContent = scenario.status;
    updateStatus();
  }

  function updateTabs(index) {
    tabs.forEach((tab, tabIndex) => tab.setAttribute('aria-current', String(tabIndex === index)));
  }

  function setStableVisuals(index) {
    scenes.forEach((scene, sceneIndex) => {
      const active = sceneIndex === index;
      scene.classList.toggle('is-active', active);
      scene.style.opacity = active ? '1' : '0';
      scene.style.transform = active ? 'scale(1)' : 'scale(1.045)';
    });
    summary.style.opacity = '1';
    summary.style.transform = 'translate3d(0, 0, 0)';
    route.style.opacity = '1';
    route.style.transform = 'translate3d(0, 0, 0)';
    action.style.opacity = '1';
    action.style.transform = 'scale(1)';
    perspective.style.opacity = '1';
    perspective.style.transform = 'translate3d(0, 0, 0) rotateX(0deg)';
    overlay.style.opacity = '1';
  }

  function stopTransition() {
    transitionSerial += 1;
    transitionControl?.stop?.();
    transitionControl = null;
  }

  function applyScenarioDirect(index, countSwitch = true) {
    stopTransition();
    const previous = state.activeIndex;
    state.activeIndex = index;
    state.requestedIndex = index;
    state.pendingIndex = null;
    state.phase = 'idle';
    state.transitionProgress = 0;
    state.actionFeedback = '';
    writeContent(index);
    updateTabs(index);
    setStableVisuals(index);
    if (countSwitch && previous !== index) {
      state.switchCount += 1;
      state.directSwitchCount += 1;
    }
  }

  function completeTransition(serial, fromIndex, toIndex) {
    if (serial !== transitionSerial) return;
    state.activeIndex = toIndex;
    state.displayedIndex = toIndex;
    state.phase = 'idle';
    state.transitionProgress = 1;
    state.switchCount += 1;
    transitionControl = null;
    writeContent(toIndex);
    setStableVisuals(toIndex);
    const pendingIndex = state.pendingIndex;
    state.pendingIndex = null;
    if (pendingIndex !== null && pendingIndex !== toIndex) startTransition(pendingIndex);
  }

  function updateTransition(progress, fromIndex, toIndex) {
    state.transitionProgress = progress;
    scenes.forEach((scene, index) => {
      if (index === fromIndex) {
        scene.style.opacity = String(1 - progress);
        scene.style.transform = `scale(${(1 + progress * .045).toFixed(4)})`;
      } else if (index === toIndex) {
        scene.style.opacity = String(progress);
        scene.style.transform = `scale(${(1.045 - progress * .045).toFixed(4)})`;
      } else {
        scene.style.opacity = '0';
        scene.style.transform = 'scale(1.045)';
      }
    });
    if (!contentSwapped && progress >= .5) {
      contentSwapped = true;
      writeContent(toIndex);
    }
    const fold = progress < .5 ? progress * 2 : (1 - progress) * 2;
    const contentOpacity = clamp(1 - fold, 0, 1);
    const direction = progress < .5 ? -1 : 1;
    summary.style.opacity = String(contentOpacity);
    summary.style.transform = `translate3d(${(direction * fold * 13).toFixed(3)}px, 0, 0)`;
    route.style.opacity = String(contentOpacity);
    route.style.transform = `translate3d(0, ${(fold * 7).toFixed(3)}px, 0)`;
    action.style.opacity = String(contentOpacity);
    action.style.transform = `scale(${(1 - fold * .08).toFixed(4)})`;
    perspective.style.opacity = String(clamp(1 - fold * .72, 0, 1));
    perspective.style.transform = `translate3d(0, ${(fold * 6).toFixed(3)}px, 0) rotateX(${(-fold * 84).toFixed(3)}deg)`;
    overlay.style.opacity = String(.84 + fold * .16);
    updateStatus();
  }

  function startTransition(toIndex) {
    const fromIndex = state.activeIndex;
    if (toIndex === fromIndex) return;
    stopTransition();
    const serial = ++transitionSerial;
    state.requestedIndex = toIndex;
    state.phase = 'transitioning';
    state.transitionProgress = 0;
    state.actionFeedback = '';
    state.animatedTransitionCount += 1;
    contentSwapped = false;
    updateTabs(toIndex);
    transitionControl = animate(0, 1, {
      duration: .54,
      ease: [.22, .7, .25, 1],
      onUpdate: progress => {
        if (serial !== transitionSerial) return;
        updateTransition(progress, fromIndex, toIndex);
      },
      onComplete: () => completeTransition(serial, fromIndex, toIndex)
    });
  }

  function requestScenario(index, inputKind, inputType) {
    const targetIndex = clamp(index, 0, scenarios.length - 1);
    recordInput(inputKind);
    if (inputType === 'keyboard') state.keyboardCount += 1;
    else state.clickCount += 1;
    if (state.phase === 'transitioning') {
      state.pendingIndex = targetIndex;
      state.requestedIndex = targetIndex;
      updateTabs(targetIndex);
      return;
    }
    if (targetIndex === state.activeIndex) return;
    if (reducedMotion.matches) applyScenarioDirect(targetIndex);
    else startTransition(targetIndex);
  }

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
    if (!event.target.closest('button')) stage.focus({ preventScroll: true });
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => {
      requestScenario(index, event.detail === 0 ? 'keyboard' : latestPointerKind, event.detail === 0 ? 'keyboard' : 'click');
    });
  });
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat) return;
    const baseIndex = state.phase === 'transitioning' ? state.requestedIndex : state.activeIndex;
    const targetIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? scenarios.length - 1
        : event.key === 'ArrowLeft'
          ? (baseIndex - 1 + scenarios.length) % scenarios.length
          : (baseIndex + 1) % scenarios.length;
    requestScenario(targetIndex, 'keyboard', 'keyboard');
    tabs[targetIndex].focus({ preventScroll: true });
  });
  action.addEventListener('click', event => {
    recordInput(event.detail === 0 ? 'keyboard' : latestPointerKind);
    state.primaryActionCount += 1;
    state.lastAction = scenarios[state.displayedIndex].actionKey;
    state.actionFeedback = scenarios[state.displayedIndex].actionOutcome;
    updateStatus();
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.phase === 'transitioning') {
      const targetIndex = state.requestedIndex;
      applyScenarioDirect(targetIndex);
    }
  });

  function render() {
    state.renderCount += 1;
    if (state.phase === 'idle') {
      writeContent(state.activeIndex);
      updateTabs(state.activeIndex);
      setStableVisuals(state.activeIndex);
    }
  }

  const ready = document.fonts.ready.then(async () => {
    applyScenarioDirect(0, false);
    const initialIndex = state.activeIndex;
    const initialSceneOpacity = scenes.map(scene => scene.style.opacity).join(',');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialStaticConfirmed = state.activeIndex === initialIndex
      && scenes.map(scene => scene.style.opacity).join(',') === initialSceneOpacity
      && state.inputCount === 0
      && state.phase === 'idle';
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    if (state.phase === 'idle') render();
    const displayed = scenarios[state.displayedIndex];
    const stageBounds = stage.getBoundingClientRect();
    const workbenchBounds = document.querySelector('.workbench').getBoundingClientRect();
    const credibleScenarios = scenarios.length === 3
      && new Set(scenarios.map(scenario => scenario.queue)).size === 3
      && new Set(scenarios.map(scenario => scenario.backgroundKey)).size === 3
      && scenarios.every(scenario => (
        scenario.title.length > 24
        && scenario.detail.length > 75
        && scenario.action.length > 15
        && scenario.priority.startsWith('P')
      ));
    const domMatchesState = kicker.textContent === displayed.kicker
      && title.textContent === displayed.title
      && detail.textContent === displayed.detail
      && queue.textContent === displayed.queue
      && priority.textContent === displayed.priority
      && action.textContent === displayed.action
      && perspectiveTitle.textContent === displayed.perspective
      && perspectiveStatus.textContent === displayed.status;
    const layersMatch = JSON.stringify(state.synchronizedLayers) === JSON.stringify(layerStateFor(state.displayedIndex));
    const noUnpromptedSwitch = state.inputCount > 0 || (
      state.activeIndex === 0
      && state.displayedIndex === 0
      && state.phase === 'idle'
      && state.switchCount === 0
    );
    return credibleScenarios
      && scenes.length === 3
      && tabs.length === 3
      && domMatchesState
      && layersMatch
      && state.initialStaticConfirmed
      && noUnpromptedSwitch
      && state.automaticPlayback === false
      && state.syntheticInputDispatch === false
      && state.automaticFallback === false
      && state.activeIndex >= 0
      && state.activeIndex < scenarios.length
      && state.displayedIndex >= 0
      && state.displayedIndex < scenarios.length
      && ['idle', 'transitioning'].includes(state.phase)
      && state.transitionProgress >= 0
      && state.transitionProgress <= 1
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.clickCount)
      && Number.isInteger(state.keyboardCount)
      && Number.isInteger(state.switchCount)
      && Number.isInteger(state.primaryActionCount)
      && stage.tabIndex === 0
      && stage.getAttribute('aria-label').includes('Home')
      && scenes.every(scene => scene.style.opacity !== '' && scene.style.transform !== '')
      && summary.style.transform.includes('translate3d')
      && route.style.transform.includes('translate3d')
      && perspective.style.transform.includes('rotateX')
      && workbenchBounds.width >= stageBounds.width * .9
      && workbenchBounds.height >= stageBounds.height * .8
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'synchronized-scenario-scene-handoff',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
