import { getProject } from '@theatre/core';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const duration = 3;
const positions = [0, .7, 1.5, 2.25, 3];
const handles = [
  [.5, .5, .24, .06],
  [.74, .94, .28, .12],
  [.72, .9, .24, .08],
  [.76, .96, .3, .1],
  [.72, .94, .5, .5],
];

const poses = [
  { id: 'arrival', name: 'Arrival', note: 'Arrival holds low so the campaign title owns the opening frame.' },
  { id: 'lift', name: 'Lift', note: 'The lockup lifts into the title rhythm without crossing the safe area.' },
  { id: 'cross', name: 'Cross', note: 'A restrained counter-rotation keeps the middle pass feeling intentional.' },
  { id: 'peak', name: 'Peak', note: 'Peak scale lands beside the wordmark before the final resolve.' },
  { id: 'resolve', name: 'Resolve', note: 'The lockup settles on the campaign signature for the approval hold.' },
];

const makeTrack = (id, debugName, values) => ({
  type: 'BasicKeyframedTrack',
  __debugName: debugName,
  keyframes: values.map((value, index) => ({
    id: `${id}-${index}`,
    value,
    position: positions[index],
    handles: handles[index],
    connectedRight: index < values.length - 1,
  })),
});

const projectState = {
  sheetsById: {
    Scene: {
      staticOverrides: { byObject: {} },
      sequence: {
        type: 'PositionalSequence',
        length: duration,
        subUnitsPerUnit: 30,
        tracksByObject: {
          'Campaign Lockup': {
            trackIdByPropPath: {
              '["x"]': 'lockup-x',
              '["y"]': 'lockup-y',
              '["rotation"]': 'lockup-rotation',
              '["scale"]': 'lockup-scale',
              '["roundness"]': 'lockup-roundness',
              '["tone"]': 'lockup-tone',
            },
            trackData: {
              'lockup-x': makeTrack('x', 'Campaign Lockup.x', [18, 38, 58, 76, 48]),
              'lockup-y': makeTrack('y', 'Campaign Lockup.y', [70, 33, 52, 26, 64]),
              'lockup-rotation': makeTrack('rotation', 'Campaign Lockup.rotation', [-8, 4, -4, 8, 0]),
              'lockup-scale': makeTrack('scale', 'Campaign Lockup.scale', [.72, 1.05, .88, 1.14, .92]),
              'lockup-roundness': makeTrack('roundness', 'Campaign Lockup.roundness', [10, 18, 5, 24, 12]),
              'lockup-tone': makeTrack('tone', 'Campaign Lockup.tone', [28, 38, 51, 18, 34]),
            },
          },
        },
      },
    },
  },
  definitionVersion: '0.4.0',
  revisionHistory: ['campaign-motion-review-v12'],
};

try {
  const stage = document.querySelector('#review-stage');
  const shell = document.querySelector('#review-shell');
  const viewport = document.querySelector('#sequence-viewport');
  const actorElement = document.querySelector('#theatre-actor');
  const playButton = document.querySelector('#play-button');
  const scrubber = document.querySelector('#sequence-scrubber');
  const timeReadout = document.querySelector('#time-readout');
  const poseIndex = document.querySelector('#pose-index');
  const poseName = document.querySelector('#pose-name');
  const reviewNote = document.querySelector('#review-note');
  const timelineKeyframes = [...document.querySelectorAll('.keyframe-button')];
  const poseGhosts = [...document.querySelectorAll('.pose-ghost')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const project = getProject('Campaign Motion Review', { state: projectState });
  const sheet = project.sheet('Scene');
  const actor = sheet.object('Campaign Lockup', {
    x: 18,
    y: 70,
    rotation: -8,
    scale: .72,
    roundness: 10,
    tone: 28,
  });

  const state = {
    id: 'visually-authored-keyframe-sequence',
    automaticPlayback: false,
    automaticPositionChanges: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    currentTime: 0,
    progress: 0,
    activePoseIndex: 0,
    activePoseId: poses[0].id,
    phase: 'idle',
    isPlaying: false,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    scrubInputCount: 0,
    markerClickCount: 0,
    playClickCount: 0,
    pauseClickCount: 0,
    playbackStartCount: 0,
    playbackCompleteCount: 0,
    playbackCancelCount: 0,
    frameAdvanceCount: 0,
    reducedMotionDirectCount: 0,
    positionSetCount: 0,
    resizeCount: 0,
    renderCount: 0,
    theatreUpdateCount: 0,
    sequencePositionValidated: false,
    actorValuesValidated: false,
    initialStaticVerified: false,
    reducedMotion: reducedMotionQuery.matches,
    lastTrustedEvent: 'none',
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let animationFrame = 0;
  let playbackClock = null;
  let latestPointerKind = 'mouse';
  let scrubInputKind = 'keyboard';
  let lastValues = null;

  const clampPosition = value => Math.min(duration, Math.max(0, Number(value) || 0));

  function closestPoseIndex(position) {
    return positions.reduce((closest, value, index) => (
      Math.abs(value - position) < Math.abs(positions[closest] - position) ? index : closest
    ), 0);
  }

  function applyValues({ x, y, rotation, scale, roundness, tone }) {
    actorElement.style.left = `${x}%`;
    actorElement.style.top = `${y}%`;
    actorElement.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
    actorElement.style.borderRadius = `${roundness}px`;
    actorElement.style.backgroundColor = `hsl(${tone} 82% 66%)`;
    actorElement.style.setProperty('--tone', tone);
    lastValues = { x, y, rotation, scale, roundness, tone };
    state.theatreUpdateCount += 1;
  }
  actor.onValuesChange(applyValues);

  function updateInterface(position) {
    const progress = position / duration;
    const index = closestPoseIndex(position);
    const pose = poses[index];
    state.currentTime = position;
    state.progress = progress;
    state.activePoseIndex = index;
    state.activePoseId = pose.id;
    timeReadout.textContent = `${position.toFixed(2)} / ${duration.toFixed(2)} s`;
    poseIndex.textContent = String(index + 1).padStart(2, '0');
    poseName.textContent = `${String(index + 1).padStart(2, '0')} · ${pose.name}`;
    reviewNote.textContent = pose.note;
    scrubber.value = position.toFixed(2);
    scrubber.style.setProperty('--scrub-progress', `${progress * 100}%`);
    scrubber.setAttribute('aria-valuetext', `${position.toFixed(2)} seconds, ${pose.name}`);
    timelineKeyframes.forEach((marker, markerIndex) => {
      const current = markerIndex === index;
      marker.classList.toggle('is-current', current);
      marker.setAttribute('aria-current', current ? 'step' : 'false');
    });
    poseGhosts.forEach((ghost, ghostIndex) => ghost.classList.toggle('is-current', ghostIndex === index));
  }

  function setPosition(value, source) {
    const position = clampPosition(value);
    sheet.sequence.position = position;
    applyValues(actor.value);
    updateInterface(position);
    state.positionSetCount += 1;
    state.sequencePositionValidated = Math.abs(sheet.sequence.position - position) < .001;
    state.lastPositionSource = source;
  }

  function recordInput(kind, event, label) {
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return false;
    }
    state.inputKind = kind;
    state.lastTrustedEvent = label;
    state.inputCount += 1;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
    return true;
  }

  function setTransportState(isPlaying) {
    state.isPlaying = isPlaying;
    actorElement.setAttribute('aria-pressed', String(isPlaying));
    actorElement.setAttribute('aria-label', `${isPlaying ? 'Pause' : 'Play'} the campaign lockup review`);
    playButton.setAttribute('aria-pressed', String(isPlaying));
    playButton.textContent = isPlaying ? 'Pause review' : 'Play review';
  }

  function stopPlayback(reason, countCancellation = true) {
    if (!state.isPlaying) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    playbackClock = null;
    setTransportState(false);
    if (countCancellation) state.playbackCancelCount += 1;
    state.phase = reason;
  }

  function completePlayback() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    playbackClock = null;
    setTransportState(false);
    state.playbackCompleteCount += 1;
    state.phase = 'complete';
  }

  function playbackStep(timestamp) {
    if (!state.isPlaying) return;
    if (playbackClock === null) playbackClock = timestamp;
    const delta = Math.min(.05, Math.max(0, (timestamp - playbackClock) / 1000));
    playbackClock = timestamp;
    const next = Math.min(duration, state.currentTime + delta);
    state.frameAdvanceCount += 1;
    setPosition(next, 'trusted-playback');
    if (next >= duration - .0001) {
      completePlayback();
      return;
    }
    animationFrame = requestAnimationFrame(playbackStep);
  }

  function startPlayback() {
    if (state.reducedMotion) {
      const nextIndex = state.activePoseIndex >= positions.length - 1 ? 0 : state.activePoseIndex + 1;
      state.reducedMotionDirectCount += 1;
      state.phase = 'reduced-step';
      setPosition(positions[nextIndex], 'trusted-reduced-step');
      return;
    }
    if (state.currentTime >= duration - .0001) setPosition(0, 'trusted-restart');
    state.playbackStartCount += 1;
    state.phase = 'playing';
    playbackClock = null;
    setTransportState(true);
    animationFrame = requestAnimationFrame(playbackStep);
  }

  function handleTransportClick(event, label) {
    const inputKind = event.detail === 0 ? 'keyboard' : latestPointerKind;
    if (!recordInput(inputKind, event, label)) return;
    if (state.isPlaying) {
      state.pauseClickCount += 1;
      stopPlayback('paused', false);
      return;
    }
    state.playClickCount += 1;
    startPlayback();
  }

  [actorElement, playButton].forEach(control => {
    control.addEventListener('pointerdown', event => {
      if (event.isTrusted) latestPointerKind = event.pointerType || 'pointer';
    });
  });
  actorElement.addEventListener('click', event => handleTransportClick(event, 'actor-toggle'));
  playButton.addEventListener('click', event => handleTransportClick(event, 'transport-toggle'));

  timelineKeyframes.forEach((marker, index) => {
    marker.addEventListener('pointerdown', event => {
      if (event.isTrusted) latestPointerKind = event.pointerType || 'pointer';
    });
    marker.addEventListener('click', event => {
      const inputKind = event.detail === 0 ? 'keyboard' : latestPointerKind;
      if (!recordInput(inputKind, event, `marker-${index + 1}`)) return;
      stopPlayback('paused');
      state.markerClickCount += 1;
      state.phase = 'pose-selected';
      setPosition(Number(marker.dataset.position), 'trusted-marker');
    });
  });

  scrubber.addEventListener('pointerdown', event => {
    if (!event.isTrusted) return;
    scrubInputKind = event.pointerType || 'pointer';
    latestPointerKind = scrubInputKind;
  });
  scrubber.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
      scrubInputKind = 'keyboard';
    }
  });
  scrubber.addEventListener('input', event => {
    if (!recordInput(scrubInputKind, event, 'timeline-scrub')) return;
    stopPlayback('paused');
    state.scrubInputCount += 1;
    state.phase = 'scrubbing';
    setPosition(event.currentTarget.value, 'trusted-scrub');
  });
  scrubber.addEventListener('change', event => {
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return;
    }
    state.phase = 'paused';
  });

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (!event.matches || !state.isPlaying) return;
    stopPlayback('reduced-step');
    const nearestIndex = closestPoseIndex(state.currentTime);
    state.reducedMotionDirectCount += 1;
    setPosition(positions[nearestIndex], 'reduced-motion-change');
  });

  const resizeObserver = new ResizeObserver(() => {
    state.resizeCount += 1;
  });
  resizeObserver.observe(shell);

  const trackedProps = [actor.props.x, actor.props.y, actor.props.rotation, actor.props.scale, actor.props.roundness, actor.props.tone];
  const trackedKeyframes = trackedProps.map(prop => sheet.sequence.__experimental_getKeyframes(prop));

  setPosition(0, 'initial');
  const ready = Promise.all([project.ready, document.fonts.ready]).then(async () => {
    setPosition(0, 'initial-ready');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const value = actor.value;
    state.actorValuesValidated = lastValues
      && ['x', 'y', 'rotation', 'scale', 'roundness', 'tone'].every(key => Math.abs(lastValues[key] - value[key]) < .001);
    state.initialStaticVerified = state.currentTime === 0
      && state.phase === 'idle'
      && state.inputCount === 0
      && state.playbackStartCount === 0
      && state.frameAdvanceCount === 0
      && state.automaticPlayback === false
      && state.automaticPositionChanges === false
      && state.syntheticInput === false;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const stageRect = stage.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const actorRect = actorElement.getBoundingClientRect();
    const currentMarkers = timelineKeyframes.filter(marker => marker.classList.contains('is-current'));
    const currentGhosts = poseGhosts.filter(ghost => ghost.classList.contains('is-current'));
    const value = actor.value;
    state.sequencePositionValidated = Math.abs(sheet.sequence.position - state.currentTime) < .001;
    state.actorValuesValidated = lastValues
      && ['x', 'y', 'rotation', 'scale', 'roundness', 'tone'].every(key => Math.abs(lastValues[key] - value[key]) < .001);
    return Boolean(
      project.address.projectId === 'Campaign Motion Review'
      && sheet.address.sheetId === 'Scene'
      && actor.address.objectKey === 'Campaign Lockup'
      && sheet.sequence.type === 'Theatre_Sequence_PublicAPI'
      && trackedKeyframes.length === 6
      && trackedKeyframes.every(track => track.length === 5)
      && trackedKeyframes.every(track => track[2].position === 1.5)
      && state.automaticPlayback === false
      && state.automaticPositionChanges === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.initialStaticVerified
      && state.currentTime >= 0
      && state.currentTime <= duration
      && Math.abs(state.progress - state.currentTime / duration) < .001
      && state.activePoseIndex === closestPoseIndex(state.currentTime)
      && state.activePoseId === poses[state.activePoseIndex].id
      && state.sequencePositionValidated
      && state.actorValuesValidated
      && Math.abs(Number(scrubber.value) - state.currentTime) <= .011
      && currentMarkers.length === 1
      && Number(currentMarkers[0].dataset.index) === state.activePoseIndex
      && currentGhosts.length === 1
      && Number(currentGhosts[0].dataset.pose) === state.activePoseIndex
      && actorElement.getAttribute('aria-pressed') === String(state.isPlaying)
      && playButton.getAttribute('aria-pressed') === String(state.isPlaying)
      && (!state.isPlaying || state.phase === 'playing')
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.pointerInputCount)
      && Number.isInteger(state.keyboardInputCount)
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && Number.isInteger(state.scrubInputCount)
      && Number.isInteger(state.markerClickCount)
      && Number.isInteger(state.playClickCount)
      && Number.isInteger(state.pauseClickCount)
      && Number.isInteger(state.playbackStartCount)
      && Number.isInteger(state.playbackCompleteCount)
      && Number.isInteger(state.playbackCancelCount)
      && Number.isInteger(state.frameAdvanceCount)
      && Number.isInteger(state.reducedMotionDirectCount)
      && Number.isInteger(state.positionSetCount)
      && Number.isInteger(state.renderCount)
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stageRect.width >= innerWidth * .99
      && stageRect.height >= innerHeight * .99
      && shellRect.left >= -1
      && shellRect.top >= -1
      && shellRect.right <= innerWidth + 1
      && shellRect.bottom <= innerHeight + 1
      && actorRect.left >= viewportRect.left - 1
      && actorRect.top >= viewportRect.top - 1
      && actorRect.right <= viewportRect.right + 1
      && actorRect.bottom <= viewportRect.bottom + 1
      && state.renderCount > 0
    );
  };

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrame);
    resizeObserver.disconnect();
  }, { once: true });

  installPreviewController({
    id: 'visually-authored-keyframe-sequence',
    library: '@theatre/core@0.7.2',
    renderer: 'dom',
    render: () => { state.renderCount += 1; },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
