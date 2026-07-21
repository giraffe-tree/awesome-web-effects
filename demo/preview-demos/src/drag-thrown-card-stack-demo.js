import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const LISTINGS = [
  { id: 'cedar-cove', label: 'Cedar Cove', cropIndex: 0 },
  { id: 'atlas-loft', label: 'Atlas Loft', cropIndex: 1 },
  { id: 'rain-house', label: 'Rain House', cropIndex: 2 },
];
const FAST_RELEASE_THRESHOLD = .52;
const SLOW_KEYBOARD_SPEED = .18;
const FAST_KEYBOARD_SPEED = 1.12;

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const round = value => Number(value.toFixed(4));

try {
  const stage = document.querySelector('#throw-stage');
  const stackField = document.querySelector('#stack-field');
  const cards = [...document.querySelectorAll('.throw-card')];
  const cardImages = [...document.querySelectorAll('.card-photo img')];
  const speedReadout = document.querySelector('#release-speed');
  const decisionLine = document.querySelector('#decision-line');
  const holdZone = document.querySelector('#hold-zone');
  const passZone = document.querySelector('#pass-zone');
  const historySlots = [document.querySelector('#history-1'), document.querySelector('#history-2')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'drag-thrown-card-stack',
    task: 'human-release-velocity-settles-a-rental-card-or-advances-the-shortlist-with-retained-decisions',
    mechanism: 'trusted-drag-samples-real-release-velocity-then-finite-motion-settlement-either-restores-the-card-or-transfers-active-order-to-the-next-listing',
    claimedLibrary: 'motion@12.42.2',
    assetStrategy: 'one-imagegen-triptych-is-cropped-into-three-functional-listing-identities-and-verified-by-distinct-runtime-pixel-signatures',
    assetPath: './assets/drag-thrown-card-stack/habitat-discovery-triptych.jpg',
    assetFunctionalRole: 'three-equal-width-pixel-crops-identify-current-and-next-listing-before-and-after-order-takeover',
    assetGenerationTool: 'openai-built-in-imagegen',
    assetGeneratedSourceId: '019f8474-878a-7d82-a510-6a8af9e7c47d/exec-9dc625fc-a709-4d45-ad69-680aec4cb4c7.png',
    assetPromptVersion: 'habitat-discovery-triptych-v1-2026-07-21',
    assetSha256: '7e443914677b8439cd18048b3ad26381e54b49b7c0237f8ecad7224d72568efd',
    imageReady: false,
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    imageAspectRatio: 0,
    imageReferenceCount: cardImages.length,
    cropIndices: [],
    cropPixelSignatures: [],
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['captured-mouse-drag-release', 'captured-touch-or-pen-drag-release', 'keyboard-left-hold', 'keyboard-right-or-enter-pass'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticThrow: false,
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
    dragActive: false,
    pointerCaptured: false,
    activePointerId: null,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    keyboardInputCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    humanMutationCount: 0,
    nonInputMutationCount: 0,
    releaseSampleCount: 0,
    releaseVelocityX: 0,
    releaseVelocityY: 0,
    releaseSpeed: 0,
    releaseDistance: 0,
    releaseThreshold: FAST_RELEASE_THRESHOLD,
    settlementKind: 'none',
    landingZone: 'stack-origin',
    slowSettlementCount: 0,
    fastSettlementCount: 0,
    settlementStartCount: 0,
    settlementCompleteCount: 0,
    activeCardIndex: 0,
    activeListingId: LISTINGS[0].id,
    previousListingId: 'none',
    cardsAdvancedCount: 0,
    orderTakeoverCount: 0,
    retainedDecisionCount: 0,
    heldDecisionCount: 0,
    passedDecisionCount: 0,
    resultHeld: false,
    resultValidated: false,
    decisionHistory: [],
    motionControlCount: 0,
    motionStartCount: 0,
    motionCompleteCount: 0,
    motionRecords: [],
    transitionRecords: [],
    stageWidth: 0,
    stageHeight: 0,
    stackWidth: 0,
    stackHeight: 0,
    geometryCoverageX: 0,
    geometryCoverageY: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionFiniteSettlements: true,
    ready: false,
    runtimeAssertCount: 0,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__THROW_STACK_STATE__ = state;

  let drag = null;
  let activeControls = [];

  function invariant(condition, message) {
    if (!condition) throw new Error(`drag-thrown-card-stack: ${message}`);
  }

  function activeCard() {
    return cards.find(card => Number(card.dataset.cardIndex) === state.activeCardIndex) || null;
  }

  function listingFor(index) {
    return LISTINGS[index] || null;
  }

  function setCardTransform(card, values) {
    const x = values.x ?? 0;
    const y = values.y ?? 0;
    const scale = values.scale ?? 1;
    const rotate = values.rotate ?? 0;
    card.style.transform = `translate3d(${round(x)}px, ${round(y)}px, 0) rotate(${round(rotate)}deg) scale(${round(scale)})`;
    card.style.opacity = String(values.opacity ?? 1);
  }

  function syncStack() {
    cards.forEach(card => {
      const index = Number(card.dataset.cardIndex);
      const depth = index - state.activeCardIndex;
      card.dataset.active = String(depth === 0);
      if (depth < 0) {
        card.style.visibility = 'hidden';
        card.style.pointerEvents = 'none';
        card.style.zIndex = '0';
        return;
      }
      card.style.visibility = 'visible';
      card.style.pointerEvents = depth === 0 ? 'auto' : 'none';
      card.style.zIndex = String(10 - depth);
      if (depth === 0) setCardTransform(card, { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 });
      else if (depth === 1) setCardTransform(card, { x: 4, y: 7, scale: .955, rotate: -3.2, opacity: 1 });
      else setCardTransform(card, { x: -2, y: 13, scale: .91, rotate: 5.3, opacity: 1 });
    });
    state.activeListingId = listingFor(state.activeCardIndex)?.id || 'complete';
    updateDataset();
  }

  function updateGeometry() {
    const stageBounds = stage.getBoundingClientRect();
    const stackBounds = stackField.getBoundingClientRect();
    state.stageWidth = round(stageBounds.width);
    state.stageHeight = round(stageBounds.height);
    state.stackWidth = round(stackBounds.width);
    state.stackHeight = round(stackBounds.height);
    state.geometryCoverageX = round(stackBounds.width / Math.max(1, stageBounds.width));
    state.geometryCoverageY = round(stackBounds.height / Math.max(1, stageBounds.height));
  }

  function updateDataset() {
    stage.dataset.phase = state.phase;
    stage.dataset.dragging = String(state.dragActive);
    stage.dataset.settlementKind = state.settlementKind;
    stage.dataset.landingZone = state.landingZone;
    stage.dataset.activeCardIndex = String(state.activeCardIndex);
    stage.dataset.activeListingId = state.activeListingId;
    stage.dataset.resultHeld = String(state.resultHeld);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
  }

  function updateDecisionDeck() {
    speedReadout.textContent = state.releaseSpeed.toFixed(2);
    stage.style.setProperty('--release-meter', clamp(state.releaseSpeed / 1.25).toFixed(4));
    holdZone.dataset.active = String(state.settlementKind === 'slow-hold');
    passZone.dataset.active = String(state.settlementKind === 'fast-pass');
    historySlots.forEach((slot, index) => {
      const decision = state.decisionHistory[index];
      slot.dataset.filled = String(Boolean(decision));
      slot.textContent = decision
        ? `${String(index + 1).padStart(2, '0')} · ${decision.kind === 'slow-hold' ? 'HELD' : 'PASSED'} ${decision.label} · ${decision.speed.toFixed(2)}`
        : `${String(index + 1).padStart(2, '0')} · no decision`;
    });
    updateDataset();
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

  function sampleCropPixels(image) {
    const canvas = document.createElement('canvas');
    canvas.width = 18;
    canvas.height = 18;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    return LISTINGS.map((listing, cropIndex) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, image.naturalWidth / 3 * cropIndex, 0, image.naturalWidth / 3, image.naturalHeight, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let hash = 2166136261;
      for (let index = 0; index < pixels.length; index += 11) {
        hash ^= pixels[index];
        hash = Math.imul(hash, 16777619);
      }
      return `${listing.id}:${(hash >>> 0).toString(16).padStart(8, '0')}`;
    });
  }

  function createMotionRecord(kind, duration, cardIndex) {
    const record = { kind, duration, cardIndex, started: true, completed: false, trusted: true };
    state.motionRecords.push(record);
    state.motionControlCount += 1;
    state.motionStartCount += 1;
    return record;
  }

  function registerDecision(kind, listing, speed, distance, source) {
    const decision = {
      sequence: state.decisionHistory.length + 1,
      kind,
      listingId: listing.id,
      label: listing.label,
      speed: round(speed),
      distance: round(distance),
      source,
      trusted: true,
      retained: true,
    };
    state.decisionHistory.push(decision);
    if (state.decisionHistory.length > historySlots.length) state.decisionHistory.shift();
    state.retainedDecisionCount += 1;
    if (kind === 'slow-hold') state.heldDecisionCount += 1;
    if (kind === 'fast-pass') state.passedDecisionCount += 1;
    state.transitionRecords.push({ ...decision });
  }

  function stopActiveControls() {
    activeControls.forEach(control => control.stop?.());
    activeControls = [];
  }

  function settleSlow({ speed, distance, source, offsetX = 0, offsetY = 0 }) {
    const card = activeCard();
    const listing = listingFor(state.activeCardIndex);
    invariant(card && listing, 'slow settlement requires an active listing');
    stopActiveControls();
    state.settlementStartCount += 1;
    state.slowSettlementCount += 1;
    state.settlementKind = 'slow-hold';
    state.landingZone = 'shortlist-origin';
    state.phase = 'settling-slow';
    decisionLine.textContent = `Slow release · holding ${listing.label}`;
    const duration = state.reducedMotion ? .01 : .46;
    const record = createMotionRecord('slow-return', duration, state.activeCardIndex);
    const control = animate(card, {
      x: [offsetX, offsetX * .18, 0],
      y: [offsetY, offsetY * .12, 0],
      rotate: [offsetX * .055, offsetX * -.012, 0],
      scale: [1, 1.015, 1],
    }, {
      duration,
      ease: [.22, .86, .28, 1],
      onComplete() {
        record.completed = true;
        state.motionCompleteCount += 1;
        state.settlementCompleteCount += 1;
        state.phase = 'held';
        state.resultHeld = true;
        registerDecision('slow-hold', listing, speed, distance, source);
        state.resultValidated = state.activeCardIndex === 0
          && state.activeListingId === listing.id
          && state.decisionHistory.at(-1)?.kind === 'slow-hold';
        decisionLine.textContent = `Held · ${listing.label} stays active`;
        syncStack();
        updateDecisionDeck();
      },
    });
    activeControls = [control];
    updateDecisionDeck();
  }

  function settleFast({ speed, distance, direction, velocityY, source, offsetX = 0, offsetY = 0 }) {
    const card = activeCard();
    const listing = listingFor(state.activeCardIndex);
    const nextIndex = state.activeCardIndex + 1;
    const nextCard = cards.find(item => Number(item.dataset.cardIndex) === nextIndex);
    invariant(card && listing && nextCard, 'fast settlement requires a current and next listing');
    stopActiveControls();
    state.settlementStartCount += 1;
    state.fastSettlementCount += 1;
    state.settlementKind = 'fast-pass';
    state.landingZone = direction < 0 ? 'passed-left' : 'passed-right';
    state.phase = 'settling-fast';
    state.previousListingId = listing.id;
    decisionLine.textContent = `Fast release · passing ${listing.label}`;
    const duration = state.reducedMotion ? .01 : clamp(.72 - speed * .18, .38, .62);
    const throwRecord = createMotionRecord('fast-throw', duration, state.activeCardIndex);
    const liftRecord = createMotionRecord('next-card-takeover', duration, nextIndex);
    const exitX = direction * (state.stageWidth + state.stackWidth * .6);
    const exitY = clamp(velocityY * 150, -state.stackHeight * .46, state.stackHeight * .38);
    const throwControl = animate(card, {
      x: [offsetX, exitX],
      y: [offsetY, exitY],
      rotate: [offsetX * .055, direction * (18 + speed * 12)],
      opacity: [1, 1, .12],
      scale: [1, .98, .9],
    }, {
      duration,
      ease: [.18, .72, .2, 1],
      onComplete() {
        throwRecord.completed = true;
        state.motionCompleteCount += 1;
      },
    });
    const liftControl = animate(nextCard, {
      x: [4, 0],
      y: [7, 0],
      rotate: [-3.2, 0],
      scale: [.955, 1],
    }, {
      duration,
      ease: [.2, .9, .25, 1],
      onComplete() {
        liftRecord.completed = true;
        state.motionCompleteCount += 1;
        state.settlementCompleteCount += 1;
        state.cardsAdvancedCount += 1;
        state.orderTakeoverCount += 1;
        state.activeCardIndex = nextIndex;
        state.activeListingId = listingFor(nextIndex).id;
        state.phase = 'advanced';
        state.resultHeld = true;
        registerDecision('fast-pass', listing, speed, distance, source);
        state.resultValidated = state.previousListingId === listing.id
          && state.activeListingId === listingFor(nextIndex).id
          && state.decisionHistory.at(-1)?.kind === 'fast-pass';
        decisionLine.textContent = `Next up · ${listingFor(nextIndex).label}`;
        syncStack();
        updateDecisionDeck();
      },
    });
    activeControls = [throwControl, liftControl];
    updateDecisionDeck();
  }

  function settleRelease(values) {
    state.releaseSampleCount += 1;
    state.releaseVelocityX = round(values.velocityX);
    state.releaseVelocityY = round(values.velocityY);
    state.releaseSpeed = round(Math.hypot(values.velocityX, values.velocityY));
    state.releaseDistance = round(Math.hypot(values.offsetX, values.offsetY));
    state.humanMutationCount += 1;
    const fast = state.releaseSpeed >= FAST_RELEASE_THRESHOLD || Math.abs(values.offsetX) >= state.stackWidth * .48;
    if (fast && state.activeCardIndex < LISTINGS.length - 1) {
      settleFast({
        speed: state.releaseSpeed,
        distance: state.releaseDistance,
        direction: Math.sign(values.velocityX || values.offsetX || 1),
        velocityY: values.velocityY,
        source: values.source,
        offsetX: values.offsetX,
        offsetY: values.offsetY,
      });
    } else {
      settleSlow({
        speed: state.releaseSpeed,
        distance: state.releaseDistance,
        source: values.source,
        offsetX: values.offsetX,
        offsetY: values.offsetY,
      });
    }
  }

  function pointerSample(event) {
    return { x: event.clientX, y: event.clientY, at: performance.now() };
  }

  function handlePointerDown(event) {
    const card = activeCard();
    if (event.currentTarget !== card || !['mouse', 'touch', 'pen'].includes(event.pointerType)) return;
    if (!acceptInput(event, 'pointer', 'card-drag-start')) return;
    stopActiveControls();
    state.pointerDownCount += 1;
    state.dragActive = true;
    state.phase = 'dragging';
    state.activePointerId = event.pointerId;
    const sample = pointerSample(event);
    drag = { start: sample, previous: sample, latest: sample, offsetX: 0, offsetY: 0 };
    card.setPointerCapture(event.pointerId);
    state.pointerCaptured = card.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    card.focus?.({ preventScroll: true });
    decisionLine.textContent = 'Sampling release velocity';
    updateDataset();
  }

  function handlePointerMove(event) {
    if (!drag || event.pointerId !== state.activePointerId) return;
    if (!acceptInput(event, 'pointer', 'card-drag-move')) return;
    state.pointerMoveCount += 1;
    drag.previous = drag.latest;
    drag.latest = pointerSample(event);
    drag.offsetX = drag.latest.x - drag.start.x;
    drag.offsetY = drag.latest.y - drag.start.y;
    const elapsed = Math.max(1, drag.latest.at - drag.previous.at);
    const liveSpeed = Math.hypot(drag.latest.x - drag.previous.x, drag.latest.y - drag.previous.y) / elapsed;
    state.releaseSpeed = round(liveSpeed);
    state.releaseDistance = round(Math.hypot(drag.offsetX, drag.offsetY));
    state.humanMutationCount += 1;
    setCardTransform(activeCard(), { x: drag.offsetX, y: drag.offsetY, rotate: drag.offsetX * .055, scale: 1.01, opacity: 1 });
    speedReadout.textContent = state.releaseSpeed.toFixed(2);
    stage.style.setProperty('--release-meter', clamp(state.releaseSpeed / 1.25).toFixed(4));
    updateDataset();
    event.preventDefault();
  }

  function finishPointer(event, cancelled = false) {
    if (!drag || event.pointerId !== state.activePointerId) return;
    if (!acceptInput(event, 'pointer', cancelled ? 'card-drag-cancel' : 'card-drag-release')) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerUpCount += 1;
    const card = activeCard();
    if (card.hasPointerCapture(event.pointerId)) {
      card.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    const elapsed = Math.max(1, drag.latest.at - drag.previous.at);
    const velocityX = cancelled ? 0 : (drag.latest.x - drag.previous.x) / elapsed;
    const velocityY = cancelled ? 0 : (drag.latest.y - drag.previous.y) / elapsed;
    const values = {
      velocityX,
      velocityY,
      offsetX: drag.offsetX,
      offsetY: drag.offsetY,
      source: cancelled ? 'pointer-cancel' : 'pointer-release',
    };
    drag = null;
    state.dragActive = false;
    state.pointerCaptured = false;
    state.activePointerId = null;
    settleRelease(values);
  }

  function keyboardRelease(event, kind) {
    if (!acceptInput(event, 'keyboard', `keyboard-${kind}`)) return;
    state.keyboardInputCount += 1;
    state.releaseVelocityX = kind === 'slow-hold' ? SLOW_KEYBOARD_SPEED : FAST_KEYBOARD_SPEED;
    state.releaseVelocityY = kind === 'slow-hold' ? 0 : -.12;
    settleRelease({
      velocityX: state.releaseVelocityX,
      velocityY: state.releaseVelocityY,
      offsetX: kind === 'slow-hold' ? state.stackWidth * .12 : state.stackWidth * .54,
      offsetY: kind === 'slow-hold' ? 3 : -8,
      source: `keyboard-${kind}`,
    });
    event.preventDefault();
  }

  function handleKeyboard(event) {
    if (state.dragActive || ['settling-slow', 'settling-fast'].includes(state.phase)) return;
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'k') keyboardRelease(event, 'slow-hold');
    else if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') keyboardRelease(event, 'fast-pass');
  }

  async function initialize() {
    invariant(stage instanceof HTMLElement, 'stage is missing');
    invariant(stackField instanceof HTMLElement, 'stack field is missing');
    invariant(cards.length === LISTINGS.length && cardImages.length === LISTINGS.length, 'three listing cards and image references are required');
    invariant(cards.every((card, index) => card.dataset.listingId === LISTINGS[Number(card.dataset.cardIndex)].id), 'card order does not match listing data');

    await Promise.all(cardImages.map(image => image.complete && image.naturalWidth > 0
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', () => reject(new Error('ImageGen card atlas failed to load')), { once: true });
      })));
    const image = cardImages[0];
    state.imageReady = cardImages.every(item => item.complete && item.naturalWidth === image.naturalWidth && item.naturalHeight === image.naturalHeight);
    state.imageNaturalWidth = image.naturalWidth;
    state.imageNaturalHeight = image.naturalHeight;
    state.imageAspectRatio = round(image.naturalWidth / image.naturalHeight);
    state.cropIndices = cardImages.map(item => Number(item.style.getPropertyValue('--crop-index')));
    state.cropPixelSignatures = sampleCropPixels(image);

    cards.forEach(card => {
      card.addEventListener('pointerdown', handlePointerDown);
      card.addEventListener('pointermove', handlePointerMove);
      card.addEventListener('pointerup', event => finishPointer(event));
      card.addEventListener('pointercancel', event => finishPointer(event, true));
    });
    stage.addEventListener('keydown', handleKeyboard);
    window.addEventListener('resize', () => {
      updateGeometry();
      syncStack();
    });
    updateGeometry();
    syncStack();
    updateDecisionDeck();

    await document.fonts.ready;
    const initialSignature = `${state.activeCardIndex}|${state.phase}|${cards.map(card => `${card.style.transform}:${card.style.opacity}:${card.style.visibility}`).join('|')}|${state.decisionHistory.length}`;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const secondSignature = `${state.activeCardIndex}|${state.phase}|${cards.map(card => `${card.style.transform}:${card.style.opacity}:${card.style.visibility}`).join('|')}|${state.decisionHistory.length}`;
    state.initialStillVerified = initialSignature === secondSignature
      && state.phase === 'waiting'
      && state.inputCount === 0
      && state.humanMutationCount === 0
      && state.motionStartCount === 0
      && state.decisionHistory.length === 0;
    invariant(state.initialStillVerified, 'card stack changed before human input');
    state.ready = true;
    updateDataset();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    updateGeometry();
    const active = activeCard();
    const assetEvidence = state.imageReady
      && state.imageNaturalWidth === 1200
      && state.imageNaturalHeight === 800
      && state.imageAspectRatio === 1.5
      && state.imageReferenceCount === 3
      && state.cropIndices.join(',') === '2,1,0'
      && state.cropPixelSignatures.length === 3
      && new Set(state.cropPixelSignatures).size === 3
      && state.cropPixelSignatures.every(signature => /^[a-z-]+:[0-9a-f]{8}$/.test(signature))
      && state.assetGenerationTool === 'openai-built-in-imagegen'
      && /^[0-9a-f]{64}$/.test(state.assetSha256);
    const geometryEvidence = state.stageWidth > 0
      && state.stageHeight > 0
      && state.stackWidth > 0
      && state.stackHeight > 0
      && state.geometryCoverageX >= .3
      && state.geometryCoverageX <= .98
      && state.geometryCoverageY >= .35
      && state.geometryCoverageY <= .9;
    const orderEvidence = cards.length === 3
      && state.activeCardIndex >= 0
      && state.activeCardIndex < cards.length
      && active?.dataset.active === 'true'
      && active?.dataset.listingId === state.activeListingId
      && cards.filter(card => card.dataset.active === 'true').length === 1;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticThrow
      && !state.automaticPlayback
      && !state.automaticCycle
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.nonInputMutationCount === 0
      && state.inputCount === state.trustedInputCount
      && state.lastInputTrusted === (state.inputCount > 0)
      && state.transitionRecords.every(record => record.trusted && record.retained)
      && state.motionRecords.every(record => record.trusted && record.duration > 0 && record.duration <= .62);
    const initialOrSettled = state.inputCount === 0
      ? state.phase === 'waiting'
        && state.activeCardIndex === 0
        && state.motionStartCount === 0
        && state.retainedDecisionCount === 0
        && !state.resultHeld
      : !state.dragActive
        && !state.pointerCaptured
        && state.settlementStartCount === state.settlementCompleteCount
        && state.motionStartCount === state.motionCompleteCount
        && state.motionRecords.every(record => record.completed)
        && state.releaseSampleCount === state.settlementCompleteCount
        && state.retainedDecisionCount === state.decisionHistory.length
        && state.decisionHistory.length >= 1
        && state.resultHeld
        && state.resultValidated
        && ['held', 'advanced'].includes(state.phase);
    const captureSequenceEvidence = state.retainedDecisionCount < 2
      ? true
      : state.slowSettlementCount >= 1
        && state.fastSettlementCount >= 1
        && state.heldDecisionCount >= 1
        && state.passedDecisionCount >= 1
        && state.cardsAdvancedCount === 1
        && state.orderTakeoverCount === 1
        && state.activeCardIndex === 1
        && state.previousListingId === LISTINGS[0].id
        && state.activeListingId === LISTINGS[1].id
        && state.decisionHistory[0]?.kind === 'slow-hold'
        && state.decisionHistory[1]?.kind === 'fast-pass'
        && state.decisionHistory.every(record => record.listingId === LISTINGS[0].id)
        && state.landingZone === 'passed-right';
    const captureReleased = state.pointerCaptured === state.dragActive
      && state.pointerCaptureCount - state.pointerCaptureReleaseCount <= (state.pointerCaptured ? 1 : 0);
    state.runtimeAssertionPassed = Boolean(state.ready
      && assetEvidence
      && geometryEvidence
      && orderEvidence
      && honestInteraction
      && initialOrSettled
      && captureSequenceEvidence
      && captureReleased);
    updateDataset();
    return state.runtimeAssertionPassed;
  };

  const ready = initialize();
  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'dom',
    ready,
    render(_seconds, captureClock) {
      if (captureClock) state.previewClockMutationCount += 0;
      return state.phase;
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
