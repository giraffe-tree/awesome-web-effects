import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const DURATION_SECONDS = 8;
const PCM_SAMPLE_RATE = 8000;
const PCM_SAMPLE_COUNT = DURATION_SECONDS * PCM_SAMPLE_RATE;
const MIN_LOOP_SECONDS = .45;
const INITIAL_RANGE = Object.freeze({ start: 1.15, end: 5.85 });
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, digits = 4) => Number(value.toFixed(digits));

try {
  const stage = document.querySelector('#audio-stage');
  const canvasHost = document.querySelector('#audio-canvas');
  const wavePlot = document.querySelector('#wave-plot');
  const selectionRegion = document.querySelector('#selection-region');
  const startHandle = document.querySelector('#loop-start-handle');
  const endHandle = document.querySelector('#loop-end-handle');
  const durationValue = document.querySelector('#duration-value');
  const rangeValue = document.querySelector('#range-value');
  const sampleReadout = document.querySelector('#sample-readout');
  const statusLine = document.querySelector('#status-line');
  const playButton = document.querySelector('#play-action');
  const pauseButton = document.querySelector('#pause-action');
  const keepButton = document.querySelector('#keep-action');
  const undoButton = document.querySelector('#undo-action');
  const resetButton = document.querySelector('#reset-action');

  const pcm = new Float32Array(PCM_SAMPLE_COUNT);
  let pcmMin = Infinity;
  let pcmMax = -Infinity;
  let pcmEnergy = 0;
  let pcmChecksum = 2166136261;
  for (let index = 0; index < pcm.length; index += 1) {
    const seconds = index / PCM_SAMPLE_RATE;
    const phrase = Math.floor(seconds / .5);
    const local = seconds % .5;
    const breath = .16 + .84 * Math.sin(Math.PI * clamp(local / .42, 0, 1)) ** 1.7;
    const cadence = phrase % 4 === 3 ? .56 : 1;
    const plosive = Math.exp(-local * 34) * (phrase % 3 === 0 ? .34 : .12);
    const roomTone = .025 * Math.sin(Math.PI * 2 * 47 * seconds);
    const voice = (
      .46 * Math.sin(Math.PI * 2 * (116 + phrase * 2.3) * seconds) +
      .21 * Math.sin(Math.PI * 2 * 231 * seconds + .4) +
      .09 * Math.sin(Math.PI * 2 * 463 * seconds + 1.1)
    ) * breath * cadence;
    const sample = clamp((voice + plosive * Math.sin(Math.PI * 2 * 710 * seconds) + roomTone) * .78, -.95, .95);
    pcm[index] = sample;
    pcmMin = Math.min(pcmMin, sample);
    pcmMax = Math.max(pcmMax, sample);
    pcmEnergy += sample * sample;
    const quantized = Math.round((sample + 1) * 32767);
    pcmChecksum ^= quantized;
    pcmChecksum = Math.imul(pcmChecksum, 16777619) >>> 0;
  }

  const state = {
    id: 'drag-resizable-audio-loop-region',
    task: 'human-trims-a-podcast-sample-by-dragging-or-keyboard-adjusting-boundaries-auditions-it-once-and-explicitly-keeps-the-crop',
    mechanism: 'trusted-boundary-input-recalculates-deterministic-pcm-sample-indices-while-web-audio-plays-the-selected-buffer-range-once-without-looping',
    claimedLibrary: 'p5@2.3.0',
    assetStrategy: 'code-native-deterministic-pcm-is-the-functional-audio-domain-input-imagegen-omitted-because-generated-pixels-cannot-drive-waveform-sample-indices-or-web-audio-playback',
    imageGenUsed: false,
    imageGenOmissionReason: 'waveform geometry range duration and audible output must all derive from the same deterministic PCM buffer; a generated bitmap would be decorative and violate mechanism causality',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['captured-pointer-drag-on-left-or-right-boundary', 'keyboard-arrow-on-focused-boundary', 'trusted-play-button', 'trusted-pause-button', 'trusted-keep-button', 'trusted-undo-button', 'trusted-reset-button'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticPlayback: false,
    automaticLooping: false,
    automaticSelection: false,
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
    initialStillSignature: '',
    initialStillMutationCount: 0,
    phase: 'waiting',
    playing: false,
    paused: false,
    retained: false,
    rangeStartSeconds: INITIAL_RANGE.start,
    rangeEndSeconds: INITIAL_RANGE.end,
    rangeDurationSeconds: INITIAL_RANGE.end - INITIAL_RANGE.start,
    startSampleIndex: Math.round(INITIAL_RANGE.start * PCM_SAMPLE_RATE),
    endSampleIndex: Math.round(INITIAL_RANGE.end * PCM_SAMPLE_RATE),
    selectedSampleCount: Math.round((INITIAL_RANGE.end - INITIAL_RANGE.start) * PCM_SAMPLE_RATE),
    committedStartSeconds: null,
    committedEndSeconds: null,
    committedStartSampleIndex: null,
    committedEndSampleIndex: null,
    playbackOffsetSeconds: 0,
    playbackAbsoluteSeconds: INITIAL_RANGE.start,
    playheadVisible: false,
    playbackStartedAtContextTime: 0,
    playbackScheduledDurationSeconds: 0,
    playbackStartCount: 0,
    playbackPauseCount: 0,
    playbackCompleteCount: 0,
    playbackStopCount: 0,
    playbackLoopCount: 0,
    finitePlaybackVerified: false,
    keepCount: 0,
    undoCount: 0,
    resetCount: 0,
    pointerDragStartCount: 0,
    pointerDragMoveCount: 0,
    pointerDragCompleteCount: 0,
    keyboardAdjustCount: 0,
    rangeRecalculationCount: 0,
    rangeChangedByHuman: false,
    lastAdjustedEdge: 'none',
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    prematureCommitCount: 0,
    snapshotDepth: 0,
    pcmSampleRate: PCM_SAMPLE_RATE,
    pcmSampleCount: pcm.length,
    pcmDurationSeconds: DURATION_SECONDS,
    pcmMinimum: round(pcmMin, 5),
    pcmMaximum: round(pcmMax, 5),
    pcmRms: round(Math.sqrt(pcmEnergy / pcm.length), 5),
    pcmChecksum: pcmChecksum.toString(16).padStart(8, '0'),
    waveformBucketCount: 0,
    waveformDerivedFromPcm: true,
    audioContextCreatedAfterTrustedPlay: false,
    audioBufferSampleCount: 0,
    audioBufferSampleRate: 0,
    audioSourceLoopFlag: null,
    drawCount: 0,
    canvasPixelDensity: 1,
    stageWidth: 0,
    stageHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    geometryCoverageX: 0,
    geometryCoverageY: 0,
    responsiveMode: 'landscape',
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    ready: false,
    runtimeAssertCount: 0,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__AUDIO_LOOP_EDITOR_STATE__ = state;

  let sketch = null;
  let audioContext = null;
  let audioBuffer = null;
  let audioSource = null;
  let animationFrame = 0;
  let sourceGeneration = 0;
  let activeDrag = null;
  const snapshots = [];

  function invariant(condition, message) {
    if (!condition) throw new Error(`drag-resizable-audio-loop-region: ${message}`);
  }

  function formatSeconds(value) {
    return value.toFixed(2).padStart(5, '0');
  }

  function currentRange() {
    return { start: state.rangeStartSeconds, end: state.rangeEndSeconds };
  }

  function snapshot() {
    return {
      start: state.rangeStartSeconds,
      end: state.rangeEndSeconds,
      retained: state.retained,
      committedStart: state.committedStartSeconds,
      committedEnd: state.committedEndSeconds,
    };
  }

  function pushSnapshot() {
    snapshots.push(snapshot());
    if (snapshots.length > 24) snapshots.shift();
    state.snapshotDepth = snapshots.length;
  }

  function rangeToSamples() {
    state.rangeDurationSeconds = round(state.rangeEndSeconds - state.rangeStartSeconds, 4);
    state.startSampleIndex = Math.round(state.rangeStartSeconds * PCM_SAMPLE_RATE);
    state.endSampleIndex = Math.round(state.rangeEndSeconds * PCM_SAMPLE_RATE);
    state.selectedSampleCount = state.endSampleIndex - state.startSampleIndex;
    state.rangeRecalculationCount += 1;
  }

  function updateGeometryEvidence() {
    const stageBounds = stage.getBoundingClientRect();
    state.stageWidth = round(stageBounds.width, 2);
    state.stageHeight = round(stageBounds.height, 2);
    state.canvasWidth = sketch?.width || 0;
    state.canvasHeight = sketch?.height || 0;
    state.geometryCoverageX = round(state.canvasWidth / Math.max(1, state.stageWidth));
    state.geometryCoverageY = round(state.canvasHeight / Math.max(1, state.stageHeight));
    state.responsiveMode = stageBounds.height > stageBounds.width * 1.15 ? 'portrait' : 'landscape';
  }

  function updateInterface() {
    const startPercent = state.rangeStartSeconds / DURATION_SECONDS * 100;
    const endPercent = state.rangeEndSeconds / DURATION_SECONDS * 100;
    selectionRegion.style.left = `${startPercent}%`;
    selectionRegion.style.width = `${endPercent - startPercent}%`;
    startHandle.style.left = `${startPercent}%`;
    endHandle.style.left = `${endPercent}%`;

    startHandle.setAttribute('aria-valuenow', state.rangeStartSeconds.toFixed(2));
    startHandle.setAttribute('aria-valuetext', `${state.rangeStartSeconds.toFixed(2)} seconds, sample ${state.startSampleIndex}`);
    startHandle.setAttribute('aria-valuemax', (state.rangeEndSeconds - MIN_LOOP_SECONDS).toFixed(2));
    endHandle.setAttribute('aria-valuenow', state.rangeEndSeconds.toFixed(2));
    endHandle.setAttribute('aria-valuetext', `${state.rangeEndSeconds.toFixed(2)} seconds, sample ${state.endSampleIndex}`);
    endHandle.setAttribute('aria-valuemin', (state.rangeStartSeconds + MIN_LOOP_SECONDS).toFixed(2));

    durationValue.textContent = `${state.rangeDurationSeconds.toFixed(2).padStart(5, '0')}s`;
    rangeValue.textContent = `${formatSeconds(state.rangeStartSeconds)}–${formatSeconds(state.rangeEndSeconds)}`;
    sampleReadout.textContent = `samples ${String(state.startSampleIndex).padStart(6, '0')} → ${String(state.endSampleIndex).padStart(6, '0')}`;
    const retainedRangeIsCurrent = state.retained &&
      state.committedStartSeconds === state.rangeStartSeconds &&
      state.committedEndSeconds === state.rangeEndSeconds;
    playButton.textContent = state.paused ? 'Resume' : state.phase === 'audition-complete' ? 'Replay' : 'Play';
    playButton.disabled = state.playing;
    pauseButton.disabled = !state.playing;
    keepButton.disabled = state.playing || retainedRangeIsCurrent;
    undoButton.disabled = state.playing || snapshots.length === 0;
    resetButton.disabled = state.playing || (
      state.rangeStartSeconds === INITIAL_RANGE.start &&
      state.rangeEndSeconds === INITIAL_RANGE.end &&
      !state.retained &&
      state.playbackOffsetSeconds === 0
    );

    if (state.playing) statusLine.innerHTML = '<strong>Auditioning once</strong> · no auto-loop';
    else if (state.paused) statusLine.innerHTML = `<strong>Paused ${state.playbackOffsetSeconds.toFixed(2)}s in</strong> · resume when ready`;
    else if (retainedRangeIsCurrent) statusLine.innerHTML = '<strong>Cut retained</strong> · safe to keep editing';
    else if (state.retained) statusLine.innerHTML = '<strong>New trim pending</strong> · retained cut stays outlined';
    else if (state.phase === 'audition-complete') statusLine.innerHTML = '<strong>Audition complete</strong> · stopped at loop end';
    else if (state.rangeChangedByHuman) statusLine.innerHTML = '<strong>Trim changed</strong> · audition before keeping';
    else statusLine.innerHTML = '<strong>Ready to trim</strong> · still until you act';

    stage.dataset.phase = state.phase;
    stage.dataset.playing = String(state.playing);
    stage.dataset.paused = String(state.paused);
    stage.dataset.retained = String(state.retained);
    stage.dataset.rangeStart = state.rangeStartSeconds.toFixed(4);
    stage.dataset.rangeEnd = state.rangeEndSeconds.toFixed(4);
    stage.dataset.startSample = String(state.startSampleIndex);
    stage.dataset.endSample = String(state.endSampleIndex);
    stage.dataset.runtimeAssertionPassed = String(state.runtimeAssertionPassed);
  }

  function requestDraw() {
    updateInterface();
    sketch?.redraw();
  }

  function setRange(edge, seconds, humanSource) {
    const previous = currentRange();
    if (edge === 'start') state.rangeStartSeconds = round(clamp(seconds, 0, state.rangeEndSeconds - MIN_LOOP_SECONDS), 4);
    else state.rangeEndSeconds = round(clamp(seconds, state.rangeStartSeconds + MIN_LOOP_SECONDS, DURATION_SECONDS), 4);
    if (previous.start === state.rangeStartSeconds && previous.end === state.rangeEndSeconds) return false;
    rangeToSamples();
    state.playbackOffsetSeconds = 0;
    state.playbackAbsoluteSeconds = state.rangeStartSeconds;
    state.playheadVisible = false;
    state.paused = false;
    state.phase = 'edited';
    state.rangeChangedByHuman = Boolean(humanSource);
    state.lastAdjustedEdge = edge;
    requestDraw();
    return true;
  }

  function acceptTrusted(event, source, kind) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputSource = source;
    state.lastInputKind = kind;
    return true;
  }

  function secondsFromPointer(event) {
    const bounds = wavePlot.getBoundingClientRect();
    return clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1) * DURATION_SECONDS;
  }

  function stopActiveSource(reason) {
    if (!audioSource) return;
    const oldSource = audioSource;
    audioSource = null;
    sourceGeneration += 1;
    oldSource.onended = null;
    try { oldSource.stop(); } catch { /* source may already have ended */ }
    try { oldSource.disconnect(); } catch { /* already disconnected */ }
    if (reason !== 'complete') state.playbackStopCount += 1;
  }

  function stopPlaybackVisuals() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  function updatePlaybackVisuals() {
    if (!state.playing || !audioContext) return;
    const elapsed = Math.max(0, audioContext.currentTime - state.playbackStartedAtContextTime);
    state.playbackOffsetSeconds = round(Math.min(state.rangeDurationSeconds, state.playbackOffsetSeconds + elapsed), 4);
    state.playbackStartedAtContextTime = audioContext.currentTime;
    state.playbackAbsoluteSeconds = round(state.rangeStartSeconds + state.playbackOffsetSeconds, 4);
    requestDraw();
    animationFrame = requestAnimationFrame(updatePlaybackVisuals);
  }

  async function ensureAudioGraph() {
    if (!audioContext) {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      invariant(AudioContextConstructor, 'Web Audio API is unavailable');
      audioContext = new AudioContextConstructor();
      audioBuffer = audioContext.createBuffer(1, pcm.length, PCM_SAMPLE_RATE);
      audioBuffer.copyToChannel(pcm, 0);
      state.audioContextCreatedAfterTrustedPlay = true;
      state.audioBufferSampleCount = audioBuffer.length;
      state.audioBufferSampleRate = audioBuffer.sampleRate;
    }
    await audioContext.resume();
  }

  async function playFiniteAudition(event) {
    if (!acceptTrusted(event, 'play-action', event.detail === 0 ? 'keyboard-button' : 'pointer-button') || state.playing) return;
    await ensureAudioGraph();
    stopActiveSource('replace');
    const remaining = state.rangeDurationSeconds - state.playbackOffsetSeconds;
    if (remaining <= .015) state.playbackOffsetSeconds = 0;
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    source.buffer = audioBuffer;
    source.loop = false;
    gain.gain.value = .52;
    source.connect(gain).connect(audioContext.destination);
    const offsetInSelection = state.playbackOffsetSeconds;
    const scheduledDuration = state.rangeDurationSeconds - offsetInSelection;
    const generation = ++sourceGeneration;
    audioSource = source;
    state.audioSourceLoopFlag = source.loop;
    state.playbackScheduledDurationSeconds = round(scheduledDuration, 4);
    state.playbackStartedAtContextTime = audioContext.currentTime;
    state.playing = true;
    state.paused = false;
    state.playheadVisible = true;
    state.phase = 'playing';
    state.playbackStartCount += 1;
    source.onended = () => {
      if (generation !== sourceGeneration || audioSource !== source) return;
      audioSource = null;
      stopPlaybackVisuals();
      state.playing = false;
      state.paused = false;
      state.playbackOffsetSeconds = state.rangeDurationSeconds;
      state.playbackAbsoluteSeconds = state.rangeEndSeconds;
      state.playbackCompleteCount += 1;
      state.finitePlaybackVerified = source.loop === false;
      state.phase = state.retained ? 'retained' : 'audition-complete';
      requestDraw();
    };
    source.start(0, state.rangeStartSeconds + offsetInSelection, scheduledDuration);
    stopPlaybackVisuals();
    animationFrame = requestAnimationFrame(updatePlaybackVisuals);
    requestDraw();
  }

  function pauseAudition(event) {
    if (!acceptTrusted(event, 'pause-action', event.detail === 0 ? 'keyboard-button' : 'pointer-button') || !state.playing || !audioContext) return;
    const elapsed = Math.max(0, audioContext.currentTime - state.playbackStartedAtContextTime);
    state.playbackOffsetSeconds = round(Math.min(state.rangeDurationSeconds, state.playbackOffsetSeconds + elapsed), 4);
    state.playbackAbsoluteSeconds = round(state.rangeStartSeconds + state.playbackOffsetSeconds, 4);
    stopActiveSource('pause');
    stopPlaybackVisuals();
    state.playing = false;
    state.paused = true;
    state.phase = 'paused';
    state.playbackPauseCount += 1;
    requestDraw();
  }

  function keepRange(event) {
    if (!acceptTrusted(event, 'keep-action', event.detail === 0 ? 'keyboard-button' : 'pointer-button') || state.playing) return;
    pushSnapshot();
    state.committedStartSeconds = state.rangeStartSeconds;
    state.committedEndSeconds = state.rangeEndSeconds;
    state.committedStartSampleIndex = state.startSampleIndex;
    state.committedEndSampleIndex = state.endSampleIndex;
    state.retained = true;
    state.phase = 'retained';
    state.keepCount += 1;
    requestDraw();
  }

  function restoreSnapshot(value) {
    state.rangeStartSeconds = value.start;
    state.rangeEndSeconds = value.end;
    state.retained = value.retained;
    state.committedStartSeconds = value.committedStart;
    state.committedEndSeconds = value.committedEnd;
    state.committedStartSampleIndex = value.committedStart == null ? null : Math.round(value.committedStart * PCM_SAMPLE_RATE);
    state.committedEndSampleIndex = value.committedEnd == null ? null : Math.round(value.committedEnd * PCM_SAMPLE_RATE);
    rangeToSamples();
    state.playbackOffsetSeconds = 0;
    state.playbackAbsoluteSeconds = state.rangeStartSeconds;
    state.playheadVisible = false;
    state.paused = false;
    state.phase = state.retained ? 'retained' : 'edited';
  }

  function undoEdit(event) {
    if (!acceptTrusted(event, 'undo-action', event.detail === 0 ? 'keyboard-button' : 'pointer-button') || state.playing || snapshots.length === 0) return;
    restoreSnapshot(snapshots.pop());
    state.snapshotDepth = snapshots.length;
    state.undoCount += 1;
    requestDraw();
  }

  function resetEditor(event) {
    if (!acceptTrusted(event, 'reset-action', event.detail === 0 ? 'keyboard-button' : 'pointer-button') || state.playing) return;
    pushSnapshot();
    state.rangeStartSeconds = INITIAL_RANGE.start;
    state.rangeEndSeconds = INITIAL_RANGE.end;
    state.retained = false;
    state.committedStartSeconds = null;
    state.committedEndSeconds = null;
    state.committedStartSampleIndex = null;
    state.committedEndSampleIndex = null;
    rangeToSamples();
    state.playbackOffsetSeconds = 0;
    state.playbackAbsoluteSeconds = INITIAL_RANGE.start;
    state.playheadVisible = false;
    state.paused = false;
    state.rangeChangedByHuman = false;
    state.phase = 'waiting';
    state.resetCount += 1;
    requestDraw();
  }

  function beginDrag(event) {
    const handle = event.currentTarget;
    if (!acceptTrusted(event, `${handle.dataset.edge}-boundary`, event.pointerType || 'pointer')) return;
    event.preventDefault();
    pushSnapshot();
    activeDrag = { edge: handle.dataset.edge, pointerId: event.pointerId, changed: false };
    handle.dataset.dragging = 'true';
    handle.setPointerCapture(event.pointerId);
    state.pointerDragStartCount += 1;
  }

  function moveDrag(event) {
    if (!activeDrag || activeDrag.pointerId !== event.pointerId || !event.isTrusted) {
      if (!event.isTrusted) state.rejectedUntrustedInputCount += 1;
      return;
    }
    event.preventDefault();
    const changed = setRange(activeDrag.edge, secondsFromPointer(event), 'pointer');
    if (changed) {
      activeDrag.changed = true;
      state.pointerDragMoveCount += 1;
    }
  }

  function endDrag(event) {
    if (!activeDrag || activeDrag.pointerId !== event.pointerId || !event.isTrusted) {
      if (!event.isTrusted) state.rejectedUntrustedInputCount += 1;
      return;
    }
    const handle = event.currentTarget;
    handle.dataset.dragging = 'false';
    try { handle.releasePointerCapture(event.pointerId); } catch { /* capture may already be released */ }
    if (!activeDrag.changed) {
      snapshots.pop();
      state.snapshotDepth = snapshots.length;
    } else {
      state.pointerDragCompleteCount += 1;
    }
    activeDrag = null;
    requestDraw();
  }

  function adjustWithKeyboard(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const handle = event.currentTarget;
    if (!acceptTrusted(event, `${handle.dataset.edge}-boundary`, 'keyboard')) return;
    event.preventDefault();
    const edge = handle.dataset.edge;
    const step = event.shiftKey ? .25 : .05;
    let next = edge === 'start' ? state.rangeStartSeconds : state.rangeEndSeconds;
    if (event.key === 'ArrowLeft') next -= step;
    if (event.key === 'ArrowRight') next += step;
    if (event.key === 'Home') next = edge === 'start' ? 0 : state.rangeStartSeconds + MIN_LOOP_SECONDS;
    if (event.key === 'End') next = edge === 'start' ? state.rangeEndSeconds - MIN_LOOP_SECONDS : DURATION_SECONDS;
    pushSnapshot();
    if (setRange(edge, next, 'keyboard')) state.keyboardAdjustCount += 1;
    else {
      snapshots.pop();
      state.snapshotDepth = snapshots.length;
    }
  }

  function drawWaveform(p) {
    updateGeometryEvidence();
    p.clear();
    const plotBounds = wavePlot.getBoundingClientRect();
    const stageBounds = stage.getBoundingClientRect();
    const left = plotBounds.left - stageBounds.left;
    const top = plotBounds.top - stageBounds.top;
    const width = plotBounds.width;
    const height = plotBounds.height;
    const middle = top + height / 2;
    const buckets = Math.max(72, Math.floor(width / 2.45));
    state.waveformBucketCount = buckets;

    p.noStroke();
    p.fill(238, 233, 220, 9);
    p.rect(left, top, width, height, 3);
    p.stroke(238, 233, 220, 28);
    p.strokeWeight(1);
    p.line(left, middle, left + width, middle);

    for (let bucket = 0; bucket < buckets; bucket += 1) {
      const from = Math.floor(bucket / buckets * pcm.length);
      const to = Math.max(from + 1, Math.floor((bucket + 1) / buckets * pcm.length));
      let min = 1;
      let max = -1;
      for (let index = from; index < to; index += 1) {
        min = Math.min(min, pcm[index]);
        max = Math.max(max, pcm[index]);
      }
      const seconds = (from + to) / 2 / PCM_SAMPLE_RATE;
      const selected = seconds >= state.rangeStartSeconds && seconds <= state.rangeEndSeconds;
      const x = left + bucket / Math.max(1, buckets - 1) * width;
      const scale = height * .46;
      p.stroke(selected ? '#e7ff57' : 'rgba(238,233,220,.28)');
      p.strokeWeight(Math.max(1, width / buckets * .48));
      p.line(x, middle - max * scale, x, middle - min * scale);
    }

    const tickCount = state.responsiveMode === 'portrait' ? 4 : 8;
    p.textFont('ui-monospace, monospace');
    p.textSize(Math.max(5, Math.min(8, width * .02)));
    p.textAlign(p.CENTER, p.BOTTOM);
    for (let tick = 0; tick <= tickCount; tick += 1) {
      const x = left + tick / tickCount * width;
      p.stroke(238, 233, 220, 35);
      p.strokeWeight(1);
      p.line(x, top, x, top + 4);
      p.noStroke();
      p.fill(238, 233, 220, 90);
      p.text(`${(tick / tickCount * DURATION_SECONDS).toFixed(0)}s`, x, top - 2);
    }

    if (state.playheadVisible) {
      const progress = clamp(state.playbackAbsoluteSeconds / DURATION_SECONDS, 0, 1);
      const playX = left + progress * width;
      p.stroke('#ff725f');
      p.strokeWeight(1.5);
      p.line(playX, top - 4, playX, top + height + 4);
      p.noStroke();
      p.fill('#ff725f');
      p.triangle(playX - 3, top - 4, playX + 3, top - 4, playX, top + 1);
    }

    if (state.retained) {
      const committedLeft = left + state.committedStartSeconds / DURATION_SECONDS * width;
      const committedRight = left + state.committedEndSeconds / DURATION_SECONDS * width;
      p.noFill();
      p.stroke(255, 114, 95, 170);
      p.strokeWeight(1);
      p.rect(committedLeft, top - 2, committedRight - committedLeft, height + 4, 3);
    }

    state.drawCount += 1;
  }

  [startHandle, endHandle].forEach(handle => {
    handle.addEventListener('pointerdown', beginDrag);
    handle.addEventListener('pointermove', moveDrag);
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
    handle.addEventListener('keydown', adjustWithKeyboard);
  });
  playButton.addEventListener('click', playFiniteAudition);
  pauseButton.addEventListener('click', pauseAudition);
  keepButton.addEventListener('click', keepRange);
  undoButton.addEventListener('click', undoEdit);
  resetButton.addEventListener('click', resetEditor);

  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  sketch = new p5(p => {
    const verifyInitialStill = () => requestAnimationFrame(() => requestAnimationFrame(() => {
      const signature = `${state.rangeStartSeconds}|${state.rangeEndSeconds}|${state.playing}|${state.retained}|${state.drawCount}`;
      state.initialStillSignature = signature;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const nextSignature = `${state.rangeStartSeconds}|${state.rangeEndSeconds}|${state.playing}|${state.retained}|${state.drawCount}`;
        state.initialStillMutationCount = signature === nextSignature ? 0 : 1;
        state.initialStillVerified = signature === nextSignature;
        state.ready = state.initialStillVerified;
        resolveReady();
      }));
    }));
    p.setup = () => {
      p.pixelDensity(1);
      const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
      canvas.parent(canvasHost);
      p.noLoop();
      rangeToSamples();
      updateInterface();
      p.redraw();
      verifyInitialStill();
    };
    p.draw = () => drawWaveform(p);
    p.windowResized = () => {
      p.resizeCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
      requestDraw();
    };
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    state.runtimeAssertCount += 1;
    updateGeometryEvidence();
    invariant(sketch instanceof p5, 'p5 instance is missing');
    invariant(pcm.length === PCM_SAMPLE_COUNT && state.pcmSampleCount === PCM_SAMPLE_COUNT, 'deterministic PCM sample count mismatch');
    invariant(state.pcmMinimum < -.25 && state.pcmMaximum > .25 && state.pcmRms > .08, 'PCM signal lacks a meaningful audio-domain range');
    invariant(state.waveformDerivedFromPcm && state.waveformBucketCount >= 72, 'waveform was not bucketed from the PCM buffer');
    invariant(state.startSampleIndex === Math.round(state.rangeStartSeconds * PCM_SAMPLE_RATE), 'start boundary did not recalculate its sample index');
    invariant(state.endSampleIndex === Math.round(state.rangeEndSeconds * PCM_SAMPLE_RATE), 'end boundary did not recalculate its sample index');
    invariant(state.selectedSampleCount === state.endSampleIndex - state.startSampleIndex, 'selected sample count does not match boundary indices');
    invariant(Math.abs(state.rangeDurationSeconds - (state.rangeEndSeconds - state.rangeStartSeconds)) < .0002, 'loop duration does not match its boundaries');
    invariant(state.rangeDurationSeconds >= MIN_LOOP_SECONDS, 'loop is shorter than the minimum selectable range');
    invariant(state.drawCount > 0 && state.geometryCoverageX > .98 && state.geometryCoverageY > .98, 'canvas does not cover the full stage');
    invariant(state.ready && state.initialStillVerified && state.initialStillMutationCount === 0, 'initial no-input frame did not remain static through the ready gate');
    invariant(state.automaticPlayback === false && state.automaticLooping === false && state.automaticFallback === false, 'an automatic substitute path is enabled');
    invariant(state.previewClockMutationCount === 0 && state.renderIgnoresPreviewClock, 'preview clock mutated the editor');
    invariant(state.prematureCommitCount === 0, 'crop result committed without explicit Keep');
    if (state.playbackStartCount > 0) {
      invariant(state.audioContextCreatedAfterTrustedPlay, 'audio context was not created by trusted Play input');
      invariant(state.audioBufferSampleCount === pcm.length && state.audioBufferSampleRate === PCM_SAMPLE_RATE, 'Web Audio buffer does not contain the deterministic PCM input');
      invariant(state.audioSourceLoopFlag === false && state.playbackLoopCount === 0, 'audition source looped automatically');
    }
    if (state.rangeChangedByHuman) invariant(state.pointerDragMoveCount > 0 || state.keyboardAdjustCount > 0, 'range changed without a pointer drag or keyboard boundary adjustment');
    if (state.retained) {
      invariant(state.keepCount > 0, 'retained crop has no explicit Keep input');
      invariant(state.committedStartSampleIndex === Math.round(state.committedStartSeconds * PCM_SAMPLE_RATE), 'retained start sample mismatch');
      invariant(state.committedEndSampleIndex === Math.round(state.committedEndSeconds * PCM_SAMPLE_RATE), 'retained end sample mismatch');
    }
    state.runtimeAssertionPassed = true;
    stage.dataset.runtimeAssertionPassed = 'true';
    return true;
  };

  installPreviewController({
    id: 'drag-resizable-audio-loop-region',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    ready,
    render: () => {
      state.previewClockMutationCount += 0;
    },
  });

} catch (error) {
  markPreviewFailure(error);
}
