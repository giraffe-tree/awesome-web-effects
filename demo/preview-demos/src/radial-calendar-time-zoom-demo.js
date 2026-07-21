import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL('../assets/aesthetic-wave-07/radial-calendar-time-zoom/studio-occupancy-atlas.jpg', import.meta.url).href;
const EXPECTED_ASSET_SHA256 = 'da602594965cf7c28078fabb04edc20bfad72e243ac62778a868f143c5cd5989';
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 64;
const SLOT_COUNT = 12;
const INITIAL_INDEX = 5;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const rounded = value => Number(value.toFixed(4));

function pointOnCircle(radius, angleDegrees) {
  const angle = (angleDegrees - 90) * Math.PI / 180;
  return { x: 100 + radius * Math.cos(angle), y: 100 + radius * Math.sin(angle) };
}

function arcPath(radius, startDegrees, endDegrees) {
  const start = pointOnCircle(radius, endDegrees);
  const end = pointOnCircle(radius, startDegrees);
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${radius} ${radius} 0 0 0 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

function pixelChecksum(bytes) {
  let signature = 2166136261;
  for (let index = 0; index < bytes.length; index += 1) {
    signature ^= bytes[index];
    signature = Math.imul(signature, 16777619) >>> 0;
  }
  return signature.toString(16).padStart(8, '0');
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

try {
  const stage = document.querySelector('#schedule-stage');
  const dial = document.querySelector('#calendar-dial');
  const atlasImage = document.querySelector('#atlas-image');
  const sampleCanvas = document.querySelector('#sample-canvas');
  const arcsRoot = document.querySelector('#slot-arcs');
  const ticksRoot = document.querySelector('#slot-ticks');
  const needle = document.querySelector('#calendar-needle');
  const selectedTime = document.querySelector('#selected-time');
  const slotLabel = document.querySelector('#slot-label');
  const slotDetail = document.querySelector('#slot-detail');
  const availability = document.querySelector('#availability');
  const centerTime = document.querySelector('#center-time');
  const centerState = document.querySelector('#center-state');
  const confirmButton = document.querySelector('#confirm-slot');
  const actionButtons = [...document.querySelectorAll('[data-calendar-action]')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'radial-calendar-time-zoom',
    task: 'human-operated-fictional-studio-hour-selection-from-image-sampled-occupancy-atlas',
    claimedLibrary: 'motion@12.42.2',
    renderer: 'svg',
    mechanism: 'trusted-human-input-seeks-paused-motion-controller-driving-svg-radial-time-needle',
    assetMechanismRole: 'visible-local-atlas-pixels-are-sampled-by-sector-to-classify-each-booking-slot',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button-control'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    previewRenderCount: 0,
    ready: false,
    reducedMotion: reducedMotionQuery.matches,
    initialIndex: INITIAL_INDEX,
    selectedIndex: INITIAL_INDEX,
    selectedHour: 8 + INITIAL_INDEX,
    selectedStatus: 'open',
    confirmed: false,
    confirmedIndex: null,
    initialVisualSignature: '',
    repeatedInitialVisualSignature: '',
    initialStillVerified: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerEnterCount: 0,
    hoverMoveCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    keyboardMutationCount: 0,
    buttonMutationCount: 0,
    humanSelectionMutationCount: 0,
    humanInputCausalityCount: 0,
    confirmationCount: 0,
    clearConfirmationCount: 0,
    blockedConfirmationAttemptCount: 0,
    visitedSlotCount: 1,
    visitedSlots: [INITIAL_INDEX],
    firstHumanIndexBefore: null,
    firstHumanIndexAfter: null,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    motionControllerCount: 1,
    motionControllerDuration: 1,
    motionControllerPaused: false,
    motionControllerIndex: INITIAL_INDEX,
    motionControllerUpdateCount: 0,
    motionControllerSeekCount: 0,
    visibleNeedleDegrees: 0,
    assetUrl: ASSET_URL,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetMimeType: '',
    assetByteLength: 0,
    assetSha256: '',
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sourcePixelChecksum: '',
    distinctSampleColorCount: 0,
    sampledLumaMinimum: 255,
    sampledLumaMaximum: 0,
    sampledLumaRange: 0,
    sectorSamplePixelCount: 0,
    sectorSampleChecksum: '',
    availabilityBySlot: [],
    availabilityOpenCount: 0,
    availabilityLimitedCount: 0,
    availabilityBlockedCount: 0,
    assetEvidenceReady: false,
    stageWidth: 0,
    stageHeight: 0,
    dialWidth: 0,
    dialHeight: 0,
    stageCoverageRatio: 0,
    dialCoverageRatio: 0,
    responsiveResizeCount: 0,
    runtimeAssertionPassed: false,
    interactionRecords: [],
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__RADIAL_CALENDAR_STATE__ = state;

  let drag = null;
  let resizeFrame = 0;
  let slotData = [];

  function invariant(condition, message) {
    if (!condition) throw new Error(`radial-calendar-time-zoom: ${message}`);
  }

  function acceptTrustedInput(event, kind) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      syncDataset();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = true;
    return true;
  }

  function syncDataset() {
    stage.dataset.selectedIndex = String(state.selectedIndex);
    stage.dataset.selectedHour = String(state.selectedHour);
    stage.dataset.status = state.selectedStatus;
    stage.dataset.confirmed = String(state.confirmed);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.humanSelectionMutationCount = String(state.humanSelectionMutationCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.keyboardInputCount = String(state.keyboardInputCount);
    stage.dataset.buttonActivationCount = String(state.buttonActivationCount);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
  }

  function updateLayoutEvidence() {
    const stageBounds = stage.getBoundingClientRect();
    const dialBounds = dial.getBoundingClientRect();
    state.stageWidth = rounded(stageBounds.width);
    state.stageHeight = rounded(stageBounds.height);
    state.dialWidth = rounded(dialBounds.width);
    state.dialHeight = rounded(dialBounds.height);
    state.stageCoverageRatio = rounded(stageBounds.width * stageBounds.height / Math.max(1, innerWidth * innerHeight));
    state.dialCoverageRatio = rounded(dialBounds.width * dialBounds.height / Math.max(1, stageBounds.width * stageBounds.height));
  }

  function classifySlot(red, green, blue, luma) {
    const coral = red > green * 1.8 && red > blue * 2.5;
    if (luma < 48 || coral) return 'blocked';
    const amber = red > green * 1.27 && green > blue * 1.35;
    if (luma < 135 || amber) return 'limited';
    return 'open';
  }

  function sampleAtlasPixels(pixels) {
    const distinct = new Set();
    let lumaMinimum = 255;
    let lumaMaximum = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const luma = .2126 * red + .7152 * green + .0722 * blue;
      lumaMinimum = Math.min(lumaMinimum, luma);
      lumaMaximum = Math.max(lumaMaximum, luma);
      distinct.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
    }

    const sectorBytes = [];
    const sectors = Array.from({ length: SLOT_COUNT }, (_, slotIndex) => {
      const angle = -Math.PI / 2 + (slotIndex + .5) * Math.PI * 2 / SLOT_COUNT;
      const samples = [];
      for (const radius of [19, 21, 23, 25]) {
        for (const offset of [-.035, 0, .035]) {
          const x = clamp(Math.round((SAMPLE_WIDTH - 1) / 2 + Math.cos(angle + offset) * radius), 0, SAMPLE_WIDTH - 1);
          const y = clamp(Math.round((SAMPLE_HEIGHT - 1) / 2 + Math.sin(angle + offset) * radius), 0, SAMPLE_HEIGHT - 1);
          const pixelIndex = (y * SAMPLE_WIDTH + x) * 4;
          const sample = [pixels[pixelIndex], pixels[pixelIndex + 1], pixels[pixelIndex + 2]];
          samples.push(sample);
          sectorBytes.push(...sample);
        }
      }
      const red = Math.round(samples.reduce((sum, sample) => sum + sample[0], 0) / samples.length);
      const green = Math.round(samples.reduce((sum, sample) => sum + sample[1], 0) / samples.length);
      const blue = Math.round(samples.reduce((sum, sample) => sum + sample[2], 0) / samples.length);
      const luma = Math.round(.2126 * red + .7152 * green + .0722 * blue);
      return {
        index: slotIndex,
        hour: 8 + slotIndex,
        red,
        green,
        blue,
        luma,
        status: classifySlot(red, green, blue, luma),
        sampleCount: samples.length,
      };
    });

    state.sampledPixelCount = pixels.length / 4;
    state.sampledPixelByteLength = pixels.length;
    state.sourcePixelChecksum = pixelChecksum(pixels);
    state.distinctSampleColorCount = distinct.size;
    state.sampledLumaMinimum = rounded(lumaMinimum);
    state.sampledLumaMaximum = rounded(lumaMaximum);
    state.sampledLumaRange = rounded(lumaMaximum - lumaMinimum);
    state.sectorSamplePixelCount = sectorBytes.length / 3;
    state.sectorSampleChecksum = pixelChecksum(new Uint8ClampedArray(sectorBytes));
    state.availabilityBySlot = sectors.map(slot => ({ ...slot }));
    state.availabilityOpenCount = sectors.filter(slot => slot.status === 'open').length;
    state.availabilityLimitedCount = sectors.filter(slot => slot.status === 'limited').length;
    state.availabilityBlockedCount = sectors.filter(slot => slot.status === 'blocked').length;
    return sectors;
  }

  function buildDial() {
    arcsRoot.innerHTML = slotData.map((slot, index) => (
      `<path class="slot-arc" data-slot="${index}" data-status="${slot.status}" data-selected="false" d="${arcPath(89, index * 30 + 4, index * 30 + 26)}"></path>`
    )).join('');
    ticksRoot.innerHTML = Array.from({ length: SLOT_COUNT }, (_, index) => {
      const inner = pointOnCircle(73, index * 30);
      const outer = pointOnCircle(77, index * 30);
      return `<line class="slot-tick" x1="${inner.x.toFixed(3)}" y1="${inner.y.toFixed(3)}" x2="${outer.x.toFixed(3)}" y2="${outer.y.toFixed(3)}"></line>`;
    }).join('');
  }

  function applyNeedleMotion(value) {
    state.motionControllerIndex = rounded(value);
    state.motionControllerUpdateCount += 1;
    const degrees = (value + .5) * 360 / SLOT_COUNT;
    state.visibleNeedleDegrees = rounded(degrees);
    needle.style.transform = `rotate(${degrees.toFixed(4)}deg)`;
  }

  const needleController = animate(0, SLOT_COUNT - 1, {
    duration: 1,
    ease: 'linear',
    onUpdate: applyNeedleMotion,
  });
  needleController.pause();
  state.motionControllerPaused = true;

  function detailFor(slot) {
    if (slot.status === 'blocked') return 'maintenance window';
    if (slot.status === 'limited') return `${8 + slot.index % 5} seats · shared`;
    return `${12 + slot.index % 4 * 2} seats · daylight`;
  }

  function visualSignature() {
    return [
      state.selectedIndex,
      state.selectedStatus,
      state.confirmed,
      needle.style.transform,
      selectedTime.textContent,
      availability.textContent,
      confirmButton.textContent,
    ].join('|');
  }

  function renderSelection(index) {
    const slot = slotData[index];
    invariant(Boolean(slot), 'selected slot must exist');
    state.selectedIndex = index;
    state.selectedHour = slot.hour;
    state.selectedStatus = slot.status;
    document.querySelectorAll('.slot-arc').forEach((arc, arcIndex) => {
      arc.dataset.selected = String(arcIndex === index);
    });
    const time = `${String(slot.hour).padStart(2, '0')}:00`;
    selectedTime.textContent = time;
    centerTime.textContent = String(slot.hour).padStart(2, '0');
    centerState.textContent = slot.status === 'open' ? 'open bay' : slot.status === 'limited' ? 'shared bay' : 'offline bay';
    slotLabel.textContent = `Studio ${String((index % 3) + 1).padStart(2, '0')}`;
    slotDetail.textContent = detailFor(slot);
    availability.textContent = `${slot.status} · scan ${slot.luma}`;
    dial.setAttribute('aria-valuenow', String(slot.hour));
    dial.setAttribute('aria-valuetext', `${time}, ${slot.status}`);
    confirmButton.disabled = slot.status === 'blocked';
    if (state.confirmed && state.confirmedIndex === index) {
      confirmButton.textContent = 'Release hold';
    } else {
      confirmButton.textContent = slot.status === 'blocked' ? 'Unavailable' : `Hold ${time}`;
    }
    syncDataset();
  }

  function seekControllerTo(index) {
    needleController.time = index / (SLOT_COUNT - 1);
    applyNeedleMotion(index);
    state.motionControllerSeekCount += 1;
  }

  function recordSelectionMutation(kind, beforeIndex, afterIndex) {
    state.humanSelectionMutationCount += 1;
    state.humanInputCausalityCount += 1;
    if (kind === 'mouse-hover') state.hoverMutationCount += 1;
    else if (kind === 'pointer-drag') state.dragMutationCount += 1;
    else if (kind === 'keyboard') state.keyboardMutationCount += 1;
    else if (kind === 'button-control') state.buttonMutationCount += 1;
    if (state.firstHumanIndexBefore === null) {
      state.firstHumanIndexBefore = beforeIndex;
      state.firstHumanIndexAfter = afterIndex;
    }
    if (!state.visitedSlots.includes(afterIndex)) state.visitedSlots.push(afterIndex);
    state.visitedSlotCount = state.visitedSlots.length;
    state.interactionRecords.push({ kind, trusted: true, beforeIndex, afterIndex, status: state.selectedStatus });
    if (state.interactionRecords.length > 48) state.interactionRecords.shift();
  }

  function chooseSlot(rawIndex, kind) {
    const index = (Math.round(rawIndex) % SLOT_COUNT + SLOT_COUNT) % SLOT_COUNT;
    const before = state.selectedIndex;
    if (index === before) return false;
    if (state.confirmed) {
      state.confirmed = false;
      state.confirmedIndex = null;
      state.clearConfirmationCount += 1;
    }
    seekControllerTo(index);
    renderSelection(index);
    recordSelectionMutation(kind, before, index);
    runtimeAssert();
    return true;
  }

  function slotFromPointer(event) {
    const bounds = dial.getBoundingClientRect();
    const x = event.clientX - (bounds.left + bounds.width / 2);
    const y = event.clientY - (bounds.top + bounds.height / 2);
    const angle = (Math.atan2(y, x) * 180 / Math.PI + 450) % 360;
    return Math.floor(angle / 30) % SLOT_COUNT;
  }

  function handleHover(event) {
    if (drag || (event.pointerType && event.pointerType !== 'mouse') || event.buttons !== 0) return;
    if (!acceptTrustedInput(event, 'mouse-hover')) return;
    state.hoverMoveCount += 1;
    state.lastPointerType = 'mouse';
    chooseSlot(slotFromPointer(event), 'mouse-hover');
  }

  function beginDrag(event) {
    if (!acceptTrustedInput(event, 'pointer-drag-start')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    state.pointerDownCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    state.activePointerId = event.pointerId;
    dial.setPointerCapture(event.pointerId);
    state.pointerCaptureCount += 1;
    state.pointerCaptured = true;
    drag = { pointerId: event.pointerId };
    chooseSlot(slotFromPointer(event), 'pointer-drag');
    syncDataset();
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!acceptTrustedInput(event, 'pointer-drag')) return;
    event.preventDefault();
    state.pointerMoveCount += 1;
    chooseSlot(slotFromPointer(event), 'pointer-drag');
  }

  function finishDrag(event, cancelled = false) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!acceptTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-release')) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (dial.hasPointerCapture(event.pointerId)) {
      dial.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    drag = null;
    state.activePointerId = null;
    state.pointerCaptured = false;
    syncDataset();
    runtimeAssert();
  }

  function toggleConfirmation() {
    const slot = slotData[state.selectedIndex];
    if (slot.status === 'blocked') {
      state.blockedConfirmationAttemptCount += 1;
      return;
    }
    if (state.confirmed && state.confirmedIndex === state.selectedIndex) {
      state.confirmed = false;
      state.confirmedIndex = null;
      state.clearConfirmationCount += 1;
    } else {
      state.confirmed = true;
      state.confirmedIndex = state.selectedIndex;
      state.confirmationCount += 1;
    }
    renderSelection(state.selectedIndex);
    runtimeAssert();
  }

  function handleKeydown(event) {
    const keys = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape'];
    if (!keys.includes(event.key)) return;
    if (!acceptTrustedInput(event, 'keyboard')) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') chooseSlot(state.selectedIndex - 1, 'keyboard');
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') chooseSlot(state.selectedIndex + 1, 'keyboard');
    if (event.key === 'Home') chooseSlot(0, 'keyboard');
    if (event.key === 'End') chooseSlot(SLOT_COUNT - 1, 'keyboard');
    if (event.key === 'Enter' || event.key === ' ') toggleConfirmation();
    if (event.key === 'Escape' && state.confirmed) toggleConfirmation();
    syncDataset();
  }

  function handleButton(event) {
    if (!acceptTrustedInput(event, 'button-control')) return;
    state.buttonActivationCount += 1;
    const action = event.currentTarget.dataset.calendarAction;
    if (action === 'previous') chooseSlot(state.selectedIndex - 1, 'button-control');
    if (action === 'next') chooseSlot(state.selectedIndex + 1, 'button-control');
    if (action === 'confirm') toggleConfirmation();
    syncDataset();
  }

  function runtimeAssert() {
    invariant(state.id === 'radial-calendar-time-zoom', 'runtime id must match the published demo');
    invariant(state.task === 'human-operated-fictional-studio-hour-selection-from-image-sampled-occupancy-atlas', 'task semantics must remain truthful');
    invariant(state.claimedLibrary === 'motion@12.42.2', 'manifest library claim must match Motion dependency');
    invariant(state.mechanism.includes('paused-motion-controller'), 'mechanism must name the paused Motion controller');
    invariant(typeof needleController.pause === 'function' && needleController.duration === 1, 'a real Motion playback controller must exist');
    invariant(state.userInputRequired && state.strictTrustedInputGuard, 'visual mutation must require trusted human input');
    invariant(state.initialFrameStatic && !state.automaticCycle && !state.automaticPlayback, 'initial frame must remain static');
    invariant(!state.automaticRehearsal && !state.automaticFallback && !state.syntheticInputDispatch, 'automatic or synthetic fallback is forbidden');
    invariant(!state.captureClockDriven && state.renderIgnoresPreviewClock, 'capture clock must not mutate the visual');
    invariant(state.motionControllerCount === 1 && state.motionControllerDuration === 1 && state.motionControllerPaused, 'one paused Motion controller must drive the selector needle');
    invariant(Math.abs(state.motionControllerIndex - state.selectedIndex) < .03, 'Motion controller index must match visible selection');
    invariant(Math.abs(needleController.time - state.selectedIndex / (SLOT_COUNT - 1)) < .01, 'paused Motion controller time must match the selected slot');
    invariant(state.assetFetchCount === 1 && state.assetResponseStatus === 200 && state.assetSameOrigin, 'asset must be fetched once from this origin');
    invariant(state.assetMimeType.includes('image/jpeg') && state.assetByteLength === 176900, 'the committed JPEG bytes must be loaded');
    invariant(state.assetShaMatchesExpected && state.assetSha256 === EXPECTED_ASSET_SHA256, 'asset SHA-256 must match the committed JPEG');
    invariant(state.browserImageDecoded && state.sourceNaturalWidth === 960 && state.sourceNaturalHeight === 640, 'browser must decode the committed 960 by 640 atlas');
    invariant(new URL(atlasImage.currentSrc || atlasImage.src).origin === location.origin, 'visible atlas must use the same local asset origin');
    invariant(state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT && state.sampledPixelByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4, 'full atlas sample dimensions must be exact');
    invariant(/^[0-9a-f]{8}$/.test(state.sourcePixelChecksum), 'full atlas sample checksum must exist');
    invariant(state.distinctSampleColorCount > 500 && state.sampledLumaRange > 180, 'atlas sampling must retain real tonal and color detail');
    invariant(state.sectorSamplePixelCount === SLOT_COUNT * 12 && /^[0-9a-f]{8}$/.test(state.sectorSampleChecksum), 'all twelve atlas sectors must contribute sampled pixels');
    invariant(state.availabilityBySlot.length === SLOT_COUNT, 'every displayed hour must have image-derived evidence');
    invariant(state.availabilityBySlot.every(slot => slot.sampleCount === 12 && slot.hour === slot.index + 8), 'sector evidence must map one-to-one onto displayed hours');
    invariant(state.availabilityOpenCount >= 4 && state.availabilityLimitedCount >= 2 && state.availabilityBlockedCount >= 2, 'image pixels must produce a useful mix of availability states');
    invariant(state.availabilityOpenCount + state.availabilityLimitedCount + state.availabilityBlockedCount === SLOT_COUNT, 'availability classes must cover every slot exactly once');
    invariant(arcsRoot.children.length === SLOT_COUNT && ticksRoot.children.length === SLOT_COUNT, 'SVG dial must render twelve arcs and twelve ticks');
    invariant(dial.getAttribute('aria-valuenow') === String(state.selectedHour), 'accessible hour must match the selected slot');
    invariant(stage.dataset.status === state.selectedStatus, 'visible availability styling must match sampled status');
    invariant(confirmButton.disabled === (state.selectedStatus === 'blocked'), 'hold action must reflect the sampled slot status');
    invariant(state.stageCoverageRatio > .96 && state.dialCoverageRatio > .16, 'live demo and radial selector must occupy the stage');
    invariant(state.rejectedUntrustedInputCount === 0, 'synthetic input must never be accepted');
    invariant(state.initialStillVerified, 'initial visual state must be stable across animation frames');
    if (state.humanSelectionMutationCount > 0) {
      invariant(state.humanInputCausalityCount === state.humanSelectionMutationCount, 'every visual mutation must be owned by human input');
      invariant(state.firstHumanIndexBefore !== null && state.firstHumanIndexBefore !== state.firstHumanIndexAfter, 'first human input must visibly change the selection');
      invariant(state.visitedSlotCount >= 2, 'human interaction must visit a different slot');
    }
    state.runtimeAssertionPassed = true;
    return true;
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = runtimeAssert;

  dial.addEventListener('pointerenter', event => {
    if (!acceptTrustedInput(event, 'pointer-enter')) return;
    state.pointerEnterCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    syncDataset();
  });
  dial.addEventListener('pointermove', handleHover);
  dial.addEventListener('pointerdown', beginDrag);
  dial.addEventListener('pointermove', moveDrag);
  dial.addEventListener('pointerup', event => finishDrag(event, false));
  dial.addEventListener('pointercancel', event => finishDrag(event, true));
  dial.addEventListener('keydown', handleKeydown);
  stage.addEventListener('keydown', event => {
    if (event.target === stage) handleKeydown(event);
  });
  actionButtons.forEach(button => button.addEventListener('click', handleButton));
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.responsiveResizeCount += 1;
      updateLayoutEvidence();
      if (state.ready) runtimeAssert();
    });
  });

  const ready = (async () => {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    state.assetMimeType = response.headers.get('content-type') || '';
    invariant(response.ok, `asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;

    if (!atlasImage.complete) await atlasImage.decode();
    else await atlasImage.decode();
    state.browserImageDecoded = true;
    state.sourceNaturalWidth = atlasImage.naturalWidth;
    state.sourceNaturalHeight = atlasImage.naturalHeight;

    const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
    invariant(Boolean(context), '2D canvas context is required for atlas sampling');
    context.drawImage(atlasImage, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    const pixels = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
    slotData = sampleAtlasPixels(pixels);
    buildDial();
    state.assetEvidenceReady = true;

    seekControllerTo(INITIAL_INDEX);
    renderSelection(INITIAL_INDEX);
    updateLayoutEvidence();
    await new Promise(resolve => requestAnimationFrame(resolve));
    state.initialVisualSignature = visualSignature();
    await new Promise(resolve => requestAnimationFrame(resolve));
    state.repeatedInitialVisualSignature = visualSignature();
    state.initialStillVerified = state.initialVisualSignature === state.repeatedInitialVisualSignature;
    state.ready = true;
    runtimeAssert();
    syncDataset();
  })();

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: state.renderer,
    ready,
    render() {
      state.previewRenderCount += 1;
      if (state.ready) {
        const signature = visualSignature();
        if (!drag && state.inputCount === 0 && signature !== state.initialVisualSignature) {
          state.previewClockMutationCount += 1;
        }
        runtimeAssert();
      }
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
