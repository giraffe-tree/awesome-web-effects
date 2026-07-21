import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 540;
const VIDEO_DURATION = 3;
const VIDEO_FPS = 15;
const FRAME_COUNT = 45;
const ROTATION_AMPLITUDE = 0.1;

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

// Hand-labeled against hand-open-calibration-source.jpg. This is a deterministic
// local calibration sample, not a claim of live camera inference.
const BASE_LANDMARKS = [
  [482, 419],
  [436, 362], [388, 324], [350, 287], [310, 244],
  [413, 247], [408, 189], [408, 141], [413, 66],
  [471, 235], [471, 172], [477, 112], [482, 43],
  [525, 244], [531, 187], [540, 141], [546, 63],
  [568, 261], [589, 221], [600, 184], [614, 121],
].map(([x, y]) => ({ x, y }));

try {
  const stage = document.querySelector('#hand-stage');
  const frame = document.querySelector('#hand-frame');
  const video = document.querySelector('#hand-video');
  const overlayHost = document.querySelector('#hand-overlay-host');
  const sessionStatus = document.querySelector('#session-status');
  const exerciseNumber = document.querySelector('#exercise-number');
  const exerciseTitle = document.querySelector('#exercise-title');
  const exerciseCopy = document.querySelector('#exercise-copy');
  const landmarkOutput = document.querySelector('#landmark-output');
  const angleOutput = document.querySelector('#angle-output');
  const frameOutput = document.querySelector('#frame-output');
  const calibrationOutput = document.querySelector('#calibration-output');
  const playButton = document.querySelector('#play-button');
  const seekInput = document.querySelector('#seek-input');
  const timeOutput = document.querySelector('#time-output');
  const sweepButton = document.querySelector('#sweep-button');
  const holdButton = document.querySelector('#hold-button');
  const inputOutput = document.querySelector('#input-output');
  const resetButton = document.querySelector('#reset-button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !frame || !video || !overlayHost || !playButton || !seekInput || !sweepButton || !holdButton || !resetButton) {
    throw new Error('Hand rehabilitation calibration DOM is incomplete.');
  }

  const posterUrl = new URL('../assets/live-hand-landmark-video-overlay/hand-open-calibration-source.jpg', import.meta.url).href;
  const videoUrl = new URL('../assets/live-hand-landmark-video-overlay/wrist-sweep-calibration.mp4', import.meta.url).href;
  const exercises = [
    {
      id: 'wrist-sweep',
      number: 'Exercise 01 · mobility',
      title: 'Wrist <em>sweep.</em>',
      copy: 'Review lateral wrist control while the local calibration skeleton stays registered to the recorded hand.',
    },
    {
      id: 'stability-hold',
      number: 'Exercise 02 · control',
      title: 'Stability <em>hold.</em>',
      copy: 'Pause on a frame and check fingertip stability against the compact target ring.',
    },
  ];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value, digits = 5) => Number(value.toFixed(digits));

  const state = {
    id: 'live-hand-landmark-video-overlay',
    task: 'hand-rehabilitation-landmark-calibration',
    userInputRequired: true,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'control'],
    sampleDisclosure: 'fictional-local-calibration-sample-not-live-camera',
    landmarkSource: 'hand-labeled-coordinates-deterministically-aligned-to-local-video-frames',
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockDriven: false,
    previewClockMutationCount: 0,
    syntheticInputDispatch: false,
    userOwnedPlayback: true,
    firstFrameStatic: true,
    initialStaticVerified: false,
    reducedMotion: reducedMotion.matches,
    reducedMotionUserControlledPlayback: true,
    playing: false,
    ended: false,
    currentTime: 0,
    mediaTime: 0,
    duration: VIDEO_DURATION,
    currentFrameIndex: 0,
    exerciseIndex: 0,
    resultState: 'paused-review',
    calibrationOffsetX: 0,
    calibrationOffsetY: 0,
    inputKind: 'none',
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedCount: 0,
    pointerInputCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    playAuthorizationCount: 0,
    playCount: 0,
    pauseCount: 0,
    seekCount: 0,
    exerciseChangeCount: 0,
    calibrationMutationCount: 0,
    resetCount: 0,
    pointerCaptured: false,
    activePointerId: null,
    activePointerType: null,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    dragUpdateCount: 0,
    sourceImageDecodedCount: 0,
    sourceImageDimensionsValid: false,
    sourceImageChecksum: 0,
    sourceImageSampledPixelCount: 0,
    videoSourceVerified: false,
    videoByteLength: 0,
    videoByteChecksum: 0,
    videoMetadataReady: false,
    videoDataReady: false,
    videoWidth: 0,
    videoHeight: 0,
    videoReadyState: 0,
    videoFrameCallbackCount: 0,
    videoProgressMutationCount: 0,
    videoFrameChecksum: 0,
    videoFrameChannelSum: 0,
    initialVideoFrameChecksum: 0,
    videoFrameChecksumChangeCount: 0,
    videoFrameChecksums: [],
    p5Ready: false,
    overlayReady: false,
    overlayDrawCount: 0,
    overlayPointCount: 0,
    overlaySegmentCount: 0,
    landmarkCount: BASE_LANDMARKS.length,
    currentLandmarkCount: BASE_LANDMARKS.length,
    coordinateBoundsValid: true,
    currentAngleRadians: 0,
    revision: 0,
    drawnRevision: -1,
    resizeCount: 0,
    ledger: [],
    lastLedgerEntry: null,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let overlayCanvas;
  let currentLandmarks = BASE_LANDMARKS.map(point => ({ ...point }));
  let dragSession = null;
  let videoFrameCallbackId = 0;
  let lastPresentedMediaTime = 0;
  let seekRevision = 0;
  const videoAnalysis = document.createElement('canvas');
  videoAnalysis.width = 96;
  videoAnalysis.height = 54;
  const videoAnalysisContext = videoAnalysis.getContext('2d', { willReadFrequently: true });

  function recordLedger(entry) {
    const next = {
      ...entry,
      trusted: true,
      inputCountAtEntry: state.inputCount,
      currentTime: round(state.currentTime),
      mediaTime: round(state.mediaTime),
      frameIndex: state.currentFrameIndex,
      exerciseIndex: state.exerciseIndex,
      offsetX: round(state.calibrationOffsetX),
      offsetY: round(state.calibrationOffsetY),
    };
    state.ledger.push(next);
    if (state.ledger.length > 72) state.ledger.shift();
    state.lastLedgerEntry = next;
  }

  function recordInput(kind, event, cause) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedCount += 1;
      return false;
    }
    state.inputKind = kind;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else if (kind === 'control') state.controlInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (kind === 'mouse') state.mouseInputCount += 1;
      if (kind === 'touch') state.touchInputCount += 1;
      if (kind === 'pen') state.penInputCount += 1;
    }
    recordLedger({ type: 'input', cause, kind });
    return true;
  }

  function angleForFrame(frameIndex) {
    const frameTime = clamp(frameIndex, 0, FRAME_COUNT - 1) / VIDEO_FPS;
    return ROTATION_AMPLITUDE * Math.sin(Math.PI * 2 * frameTime / VIDEO_DURATION);
  }

  function landmarksForFrame(frameIndex, includeCalibration = true) {
    const angle = angleForFrame(frameIndex);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const offsetX = includeCalibration ? state.calibrationOffsetX : 0;
    const offsetY = includeCalibration ? state.calibrationOffsetY : 0;
    return BASE_LANDMARKS.map(point => {
      const x = point.x - SOURCE_WIDTH / 2;
      const y = point.y - SOURCE_HEIGHT / 2;
      return {
        x: SOURCE_WIDTH / 2 + x * cosine - y * sine + offsetX,
        y: SOURCE_HEIGHT / 2 + x * sine + y * cosine + offsetY,
      };
    });
  }

  function atDefaults() {
    return state.currentTime === 0
      && !state.playing
      && !state.ended
      && state.exerciseIndex === 0
      && state.calibrationOffsetX === 0
      && state.calibrationOffsetY === 0;
  }

  function syncInterface() {
    const exercise = exercises[state.exerciseIndex];
    const angleDegrees = state.currentAngleRadians * 180 / Math.PI;
    sessionStatus.dataset.playing = String(state.playing);
    sessionStatus.textContent = state.playing
      ? 'Playing · user initiated'
      : state.ended
        ? 'Complete · awaiting input'
        : state.inputCount
          ? `Paused · ${state.inputKind}`
          : 'Paused · input required';
    exerciseNumber.textContent = exercise.number;
    exerciseTitle.innerHTML = exercise.title;
    exerciseCopy.textContent = exercise.copy;
    landmarkOutput.textContent = `${String(state.currentLandmarkCount).padStart(2, '0')} / 21`;
    angleOutput.textContent = `${angleDegrees >= 0 ? '+' : ''}${angleDegrees.toFixed(1)}°`;
    frameOutput.textContent = `${String(state.currentFrameIndex + 1).padStart(2, '0')} / ${FRAME_COUNT}`;
    calibrationOutput.textContent = `${Math.round(state.calibrationOffsetX)} / ${Math.round(state.calibrationOffsetY)} px`;
    playButton.textContent = state.playing ? 'Pause sample' : state.ended ? 'Replay sample' : 'Play sample';
    playButton.setAttribute('aria-pressed', String(state.playing));
    seekInput.value = String(round(state.currentTime, 4));
    seekInput.style.setProperty('--seek-progress', `${clamp(state.currentTime / VIDEO_DURATION * 100, 0, 100)}%`);
    timeOutput.textContent = `${state.currentTime.toFixed(2)} / ${VIDEO_DURATION.toFixed(2)}`;
    sweepButton.setAttribute('aria-pressed', String(state.exerciseIndex === 0));
    holdButton.setAttribute('aria-pressed', String(state.exerciseIndex === 1));
    inputOutput.textContent = state.inputCount ? `Input · ${state.inputKind}` : 'Awaiting input';
    resetButton.disabled = atDefaults();
    frame.setAttribute('aria-label', `${state.playing ? 'Playing' : 'Paused'} fictional local hand rehabilitation sample at ${state.currentTime.toFixed(2)} seconds. ${state.currentLandmarkCount} landmarks. Space plays or pauses, arrows seek, E changes exercise, R resets, and dragging calibrates the overlay.`);
  }

  function requestOverlayDraw(cause) {
    syncInterface();
    if (!sketch || !state.p5Ready) return;
    state.revision += 1;
    state.lastDrawCause = cause;
    sketch.redraw();
  }

  function updateLandmarks(frameIndex, cause, incrementRevision = true) {
    const nextFrame = clamp(frameIndex, 0, FRAME_COUNT - 1);
    currentLandmarks = landmarksForFrame(nextFrame, true);
    state.currentFrameIndex = nextFrame;
    state.currentAngleRadians = angleForFrame(nextFrame);
    state.currentLandmarkCount = currentLandmarks.length;
    state.coordinateBoundsValid = currentLandmarks.every(point => (
      Number.isFinite(point.x)
      && Number.isFinite(point.y)
      && point.x >= 0
      && point.x <= SOURCE_WIDTH
      && point.y >= 0
      && point.y <= SOURCE_HEIGHT
    ));
    if (incrementRevision) requestOverlayDraw(cause);
    else syncInterface();
  }

  function sampleVideoFrame() {
    if (video.readyState < video.HAVE_CURRENT_DATA) return 0;
    videoAnalysisContext.drawImage(video, 0, 0, videoAnalysis.width, videoAnalysis.height);
    const sampledPixels = videoAnalysisContext.getImageData(0, 0, videoAnalysis.width, videoAnalysis.height).data;
    let hash = 2166136261;
    let channelSum = 0;
    for (let index = 0; index < sampledPixels.length; index += 19) {
      hash ^= sampledPixels[index];
      hash = Math.imul(hash, 16777619);
      channelSum += sampledPixels[index];
    }
    const checksum = (hash >>> 0) || channelSum;
    state.videoFrameChannelSum = channelSum;
    if (state.videoFrameChecksum && checksum !== state.videoFrameChecksum) state.videoFrameChecksumChangeCount += 1;
    state.videoFrameChecksum = checksum;
    if (!state.initialVideoFrameChecksum) state.initialVideoFrameChecksum = checksum;
    if (!state.videoFrameChecksums.includes(checksum)) {
      state.videoFrameChecksums.push(checksum);
      if (state.videoFrameChecksums.length > 12) state.videoFrameChecksums.shift();
    }
    return checksum;
  }

  function acceptPresentedFrame(mediaTime, cause) {
    const safeMediaTime = clamp(Number.isFinite(mediaTime) ? mediaTime : video.currentTime, 0, VIDEO_DURATION);
    const frameIndex = clamp(Math.round(safeMediaTime * VIDEO_FPS), 0, FRAME_COUNT - 1);
    if (Math.abs(safeMediaTime - lastPresentedMediaTime) > 0.0001) state.videoProgressMutationCount += 1;
    lastPresentedMediaTime = safeMediaTime;
    state.mediaTime = safeMediaTime;
    state.currentTime = clamp(video.currentTime, 0, VIDEO_DURATION);
    state.videoReadyState = video.readyState;
    state.videoFrameCallbackCount += 1;
    sampleVideoFrame();
    updateLandmarks(frameIndex, cause, true);
  }

  function scheduleVideoFrame() {
    if (videoFrameCallbackId || video.paused || video.ended) return;
    if (typeof video.requestVideoFrameCallback === 'function') {
      videoFrameCallbackId = video.requestVideoFrameCallback((_, metadata) => {
        videoFrameCallbackId = 0;
        acceptPresentedFrame(metadata.mediaTime, 'authorized-video-frame');
        if (!video.paused && !video.ended) scheduleVideoFrame();
      });
    }
  }

  function waitForEvent(target, eventName) {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        target.removeEventListener(eventName, onEvent);
        target.removeEventListener('error', onError);
      };
      const onEvent = event => { cleanup(); resolve(event); };
      const onError = () => { cleanup(); reject(new Error(`Local hand video failed while waiting for ${eventName}.`)); };
      target.addEventListener(eventName, onEvent, { once: true });
      target.addEventListener('error', onError, { once: true });
    });
  }

  async function seekTo(nextTime, cause, countSeek = true) {
    if (!video.paused) {
      video.pause();
      state.pauseCount += 1;
    }
    state.playing = false;
    state.ended = false;
    const revision = ++seekRevision;
    const targetTime = round(clamp(nextTime, 0, VIDEO_DURATION), 6);
    if (countSeek) state.seekCount += 1;
    if (Math.abs(video.currentTime - targetTime) > 0.0001) {
      const seeked = waitForEvent(video, 'seeked');
      video.currentTime = targetTime;
      await seeked;
    }
    if (revision !== seekRevision) return;
    state.currentTime = video.currentTime;
    state.mediaTime = video.currentTime;
    state.resultState = 'paused-review';
    sampleVideoFrame();
    updateLandmarks(clamp(Math.round(video.currentTime * VIDEO_FPS), 0, FRAME_COUNT - 1), cause, true);
    recordLedger({ type: 'seek', cause });
  }

  async function togglePlayback(cause) {
    if (video.paused || video.ended) {
      if (video.ended || video.currentTime >= VIDEO_DURATION - 0.001) await seekTo(0, `${cause}-restart`, true);
      state.playAuthorizationCount += 1;
      await video.play();
      state.playCount += 1;
      state.playing = true;
      state.ended = false;
      state.resultState = 'playing-review';
      recordLedger({ type: 'play', cause });
      scheduleVideoFrame();
      syncInterface();
    } else {
      video.pause();
      state.playing = false;
      state.pauseCount += 1;
      state.resultState = 'paused-review';
      state.currentTime = video.currentTime;
      recordLedger({ type: 'pause', cause });
      syncInterface();
    }
  }

  function setExercise(index, cause) {
    const nextIndex = clamp(index, 0, exercises.length - 1);
    if (nextIndex === state.exerciseIndex) return false;
    state.exerciseIndex = nextIndex;
    state.exerciseChangeCount += 1;
    recordLedger({ type: 'exercise', cause });
    requestOverlayDraw(cause);
    return true;
  }

  function setCalibration(offsetX, offsetY, cause) {
    const nextX = round(clamp(offsetX, -48, 48), 2);
    const nextY = round(clamp(offsetY, -48, 48), 2);
    if (nextX === state.calibrationOffsetX && nextY === state.calibrationOffsetY) return false;
    state.calibrationOffsetX = nextX;
    state.calibrationOffsetY = nextY;
    state.calibrationMutationCount += 1;
    updateLandmarks(state.currentFrameIndex, cause, true);
    recordLedger({ type: 'calibration', cause });
    return true;
  }

  async function reset(cause) {
    video.pause();
    state.playing = false;
    state.ended = false;
    state.exerciseIndex = 0;
    state.calibrationOffsetX = 0;
    state.calibrationOffsetY = 0;
    state.resultState = 'paused-review';
    state.resetCount += 1;
    await seekTo(0, cause, false);
    recordLedger({ type: 'reset', cause });
  }

  function pointerKind(event) {
    return ['mouse', 'touch', 'pen'].includes(event.pointerType) ? event.pointerType : 'mouse';
  }

  frame.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const kind = pointerKind(event);
    if (!recordInput(kind, event, 'pointer-calibration-start')) return;
    frame.setPointerCapture(event.pointerId);
    dragSession = {
      pointerId: event.pointerId,
      pointerType: kind,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: state.calibrationOffsetX,
      startOffsetY: state.calibrationOffsetY,
    };
    state.pointerCaptured = true;
    state.activePointerId = event.pointerId;
    state.activePointerType = kind;
    state.pointerCaptureCount += 1;
    recordLedger({ type: 'capture', cause: 'pointer-calibration-start', kind });
    frame.focus({ preventScroll: true });
    event.preventDefault();
  });

  frame.addEventListener('pointermove', event => {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    const kind = pointerKind(event);
    if (!recordInput(kind, event, 'pointer-calibration-drag')) return;
    const frameRect = frame.getBoundingClientRect();
    const scaleX = SOURCE_WIDTH / Math.max(1, frameRect.width);
    const scaleY = SOURCE_HEIGHT / Math.max(1, frameRect.height);
    const offsetX = dragSession.startOffsetX + (event.clientX - dragSession.startX) * scaleX;
    const offsetY = dragSession.startOffsetY + (event.clientY - dragSession.startY) * scaleY;
    if (setCalibration(offsetX, offsetY, 'pointer-calibration-drag')) state.dragUpdateCount += 1;
    event.preventDefault();
  });

  function finishPointer(event, cancelled) {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    const kind = pointerKind(event);
    if (!recordInput(kind, event, cancelled ? 'pointer-calibration-cancel' : 'pointer-calibration-end')) return;
    if (frame.hasPointerCapture(event.pointerId)) frame.releasePointerCapture(event.pointerId);
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.activePointerType = null;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    recordLedger({ type: cancelled ? 'cancel' : 'release', cause: cancelled ? 'pointer-calibration-cancel' : 'pointer-calibration-end', kind });
    dragSession = null;
    syncInterface();
  }

  frame.addEventListener('pointerup', event => finishPointer(event, false));
  frame.addEventListener('pointercancel', event => finishPointer(event, true));

  frame.addEventListener('keydown', event => {
    const handled = [' ', 'ArrowLeft', 'ArrowRight', 'e', 'E', 'r', 'R', 'Home'];
    if (!handled.includes(event.key)) return;
    if (!recordInput('keyboard', event, `key-${event.key}`)) return;
    event.preventDefault();
    if (event.key === ' ') void togglePlayback('key-space');
    else if (event.key === 'ArrowLeft') void seekTo(video.currentTime - 1 / VIDEO_FPS, 'key-seek-back');
    else if (event.key === 'ArrowRight') void seekTo(video.currentTime + 1 / VIDEO_FPS, 'key-seek-forward');
    else if (event.key === 'e' || event.key === 'E') setExercise(state.exerciseIndex ? 0 : 1, 'key-exercise');
    else if (event.key === 'r' || event.key === 'R' || event.key === 'Home') void reset(`key-${event.key}`);
  });

  function handleControl(control, cause, action) {
    control.addEventListener('click', event => {
      if (!recordInput('control', event, cause)) return;
      void action();
    });
  }

  handleControl(playButton, 'control-playback', () => togglePlayback('control-playback'));
  handleControl(sweepButton, 'control-exercise-sweep', () => setExercise(0, 'control-exercise-sweep'));
  handleControl(holdButton, 'control-exercise-hold', () => setExercise(1, 'control-exercise-hold'));
  handleControl(resetButton, 'control-reset', () => reset('control-reset'));

  seekInput.addEventListener('input', event => {
    if (!recordInput('control', event, 'control-seek')) return;
    void seekTo(Number(seekInput.value), 'control-seek');
  });

  video.addEventListener('timeupdate', () => {
    state.currentTime = clamp(video.currentTime, 0, VIDEO_DURATION);
    state.videoReadyState = video.readyState;
    syncInterface();
  });

  video.addEventListener('ended', () => {
    state.playing = false;
    state.ended = true;
    state.currentTime = VIDEO_DURATION;
    state.resultState = 'completed-review';
    syncInterface();
  });

  function drawOverlay(p) {
    p.clear();
    p.noFill();
    if (state.exerciseIndex === 0) {
      p.stroke(255, 140, 114, 88);
      p.strokeWeight(2.4);
      for (let index = 0; index < FRAME_COUNT; index += 3) {
        const tip = landmarksForFrame(index, false)[12];
        p.circle(tip.x, tip.y, index === state.currentFrameIndex ? 11 : 4.5);
      }
    } else {
      const target = landmarksForFrame(0, false)[12];
      p.stroke(255, 140, 114, 126);
      p.strokeWeight(2.5);
      p.circle(target.x, target.y, 34);
      p.circle(target.x, target.y, 9);
    }

    p.stroke(148, 255, 212, 226);
    p.strokeWeight(4.2);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    CONNECTIONS.forEach(([start, end]) => {
      const a = currentLandmarks[start];
      const b = currentLandmarks[end];
      p.line(a.x, a.y, b.x, b.y);
    });

    p.noStroke();
    currentLandmarks.forEach((point, index) => {
      const isAnchor = index === 0 || index % 4 === 0;
      p.fill(isAnchor ? '#ff9b7e' : '#9bffda');
      p.circle(point.x, point.y, isAnchor ? 11 : 7);
      if (isAnchor) {
        p.noFill();
        p.stroke(244, 241, 232, 210);
        p.strokeWeight(1.8);
        p.circle(point.x, point.y, 17);
        p.noStroke();
      }
    });

    state.overlayDrawCount += 1;
    state.overlayPointCount = currentLandmarks.length;
    state.overlaySegmentCount = CONNECTIONS.length;
    state.drawnRevision = state.revision;
    state.overlayReady = state.overlayPointCount === 21 && state.overlaySegmentCount === 23;
  }

  const p5Ready = new Promise(resolve => {
    sketch = new p5(p => {
      p.setup = () => {
        p.pixelDensity(1);
        overlayCanvas = p.createCanvas(SOURCE_WIDTH, SOURCE_HEIGHT).parent(overlayHost).elt;
        p.noLoop();
        state.p5Ready = true;
        resolve();
      };
      p.draw = () => drawOverlay(p);
    }, overlayHost);
  });

  async function decodePoster() {
    const sourceImage = new Image();
    sourceImage.decoding = 'async';
    sourceImage.src = posterUrl;
    await sourceImage.decode();
    state.sourceImageDecodedCount = 1;
    state.sourceImageDimensionsValid = sourceImage.complete
      && sourceImage.naturalWidth === SOURCE_WIDTH
      && sourceImage.naturalHeight === SOURCE_HEIGHT;
    if (!state.sourceImageDimensionsValid) throw new Error(`Hand source image failed strict decode (${sourceImage.naturalWidth}×${sourceImage.naturalHeight}).`);
    const sample = document.createElement('canvas');
    sample.width = 48;
    sample.height = 27;
    const context = sample.getContext('2d', { willReadFrequently: true });
    context.drawImage(sourceImage, 0, 0, sample.width, sample.height);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    let hash = 2166136261;
    for (let index = 0; index < pixels.length; index += 13) {
      hash ^= pixels[index];
      hash = Math.imul(hash, 16777619);
    }
    state.sourceImageSampledPixelCount = pixels.length;
    state.sourceImageChecksum = hash >>> 0;
  }

  async function verifyVideoBytes() {
    const response = await fetch(videoUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Local hand video request failed (${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    let hash = 2166136261;
    for (let index = 0; index < bytes.length; index += 97) {
      hash ^= bytes[index];
      hash = Math.imul(hash, 16777619);
    }
    state.videoByteLength = bytes.length;
    state.videoByteChecksum = hash >>> 0;
    state.videoSourceVerified = bytes.length > 10000 && state.videoByteChecksum > 0;
    if (!state.videoSourceVerified) throw new Error('Local hand video bytes failed checksum evidence.');
  }

  async function prepareVideo() {
    video.autoplay = false;
    video.loop = false;
    video.muted = true;
    video.pause();
    if (video.readyState < video.HAVE_METADATA) await waitForEvent(video, 'loadedmetadata');
    state.videoMetadataReady = Math.abs(video.duration - VIDEO_DURATION) < 0.02
      && video.videoWidth === SOURCE_WIDTH
      && video.videoHeight === SOURCE_HEIGHT;
    state.videoWidth = video.videoWidth;
    state.videoHeight = video.videoHeight;
    if (!state.videoMetadataReady) throw new Error(`Local hand video metadata is invalid (${video.videoWidth}×${video.videoHeight}, ${video.duration}s).`);
    if (video.readyState < video.HAVE_CURRENT_DATA) await waitForEvent(video, 'loadeddata');
    state.videoDataReady = video.readyState >= video.HAVE_CURRENT_DATA;
    state.videoReadyState = video.readyState;
    video.currentTime = 0;
    video.pause();
    state.currentTime = 0;
    state.mediaTime = 0;
    sampleVideoFrame();
  }

  const nextFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.all([decodePoster(), verifyVideoBytes(), prepareVideo(), p5Ready, document.fonts.ready])
    .then(nextFrames)
    .then(() => {
      updateLandmarks(0, 'initial-local-frame', false);
      syncInterface();
      const before = `${video.currentTime}|${video.paused}|${state.currentFrameIndex}|${state.calibrationOffsetX}|${state.calibrationOffsetY}|${state.exerciseIndex}|${state.videoProgressMutationCount}|${state.overlayDrawCount}`;
      return nextFrames().then(() => {
        const after = `${video.currentTime}|${video.paused}|${state.currentFrameIndex}|${state.calibrationOffsetX}|${state.calibrationOffsetY}|${state.exerciseIndex}|${state.videoProgressMutationCount}|${state.overlayDrawCount}`;
        state.initialStaticVerified = before === after
          && video.paused
          && video.currentTime === 0
          && state.inputCount === 0
          && state.currentFrameIndex === 0
          && state.videoProgressMutationCount === 0
          && state.overlayDrawCount === 1;
        if (!state.initialStaticVerified) throw new Error(`Hand calibration first frame changed without trusted input: ${before} -> ${after}.`);
      });
    });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();
    const frameRect = frame.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();
    const overlayRect = overlayCanvas.getBoundingClientRect();
    const allCounters = [
      state.previewClockMutationCount,
      state.inputCount,
      state.trustedInputCount,
      state.rejectedUntrustedCount,
      state.pointerInputCount,
      state.mouseInputCount,
      state.touchInputCount,
      state.penInputCount,
      state.keyboardInputCount,
      state.controlInputCount,
      state.playAuthorizationCount,
      state.playCount,
      state.pauseCount,
      state.seekCount,
      state.exerciseChangeCount,
      state.calibrationMutationCount,
      state.resetCount,
      state.pointerCaptureCount,
      state.pointerReleaseCount,
      state.pointerCancelCount,
      state.dragUpdateCount,
      state.sourceImageDecodedCount,
      state.sourceImageSampledPixelCount,
      state.videoByteLength,
      state.videoByteChecksum,
      state.videoFrameCallbackCount,
      state.videoProgressMutationCount,
      state.videoFrameChecksum,
      state.videoFrameChannelSum,
      state.initialVideoFrameChecksum,
      state.videoFrameChecksumChangeCount,
      state.overlayDrawCount,
      state.overlayPointCount,
      state.overlaySegmentCount,
      state.landmarkCount,
      state.currentLandmarkCount,
      state.revision,
      state.resizeCount,
    ];
    const inputEvidence = state.trustedInputCount === state.inputCount
      && state.pointerInputCount === state.mouseInputCount + state.touchInputCount + state.penInputCount
      && state.inputCount === state.pointerInputCount + state.keyboardInputCount + state.controlInputCount
      && state.ledger.every(entry => entry.trusted === true && Number.isInteger(entry.inputCountAtEntry));
    const playbackEvidence = state.playCount <= state.playAuthorizationCount
      && (state.videoProgressMutationCount === 0 || state.trustedInputCount > 0)
      && (state.playing ? !video.paused && !video.ended : video.paused || video.ended)
      && Math.abs(state.currentTime - video.currentTime) < 0.08
      && state.currentTime >= 0
      && state.currentTime <= VIDEO_DURATION;
    const resetEvidence = state.resetCount === 0 || state.ledger.some(entry => entry.type === 'reset');
    const decodedFrameEvidence = state.playCount + state.seekCount === 0
      ? video.readyState >= video.HAVE_CURRENT_DATA
      : state.videoFrameChecksum > 0
        && state.videoFrameChannelSum > 0
        && state.initialVideoFrameChecksum > 0;
    const sourceEvidence = state.sourceImageDecodedCount === 1
      && state.sourceImageDimensionsValid
      && state.sourceImageChecksum > 0
      && state.sourceImageSampledPixelCount === 48 * 27 * 4
      && state.videoSourceVerified
      && state.videoByteLength > 10000
      && state.videoByteChecksum > 0
      && state.videoMetadataReady
      && state.videoDataReady
      && new URL(video.currentSrc).origin === location.origin
      && new URL(video.currentSrc).pathname.includes('wrist-sweep-calibration')
      && new URL(video.currentSrc).pathname.endsWith('.mp4')
      && Math.abs(video.duration - VIDEO_DURATION) < 0.02
      && video.videoWidth === SOURCE_WIDTH
      && video.videoHeight === SOURCE_HEIGHT
      && video.readyState >= video.HAVE_CURRENT_DATA
      && video.autoplay === false
      && video.loop === false
      && video.muted === true
      && decodedFrameEvidence;
    const landmarkEvidence = BASE_LANDMARKS.length === 21
      && CONNECTIONS.length === 23
      && BASE_LANDMARKS.every(point => point.x >= 0 && point.x <= SOURCE_WIDTH && point.y >= 0 && point.y <= SOURCE_HEIGHT)
      && currentLandmarks.length === 21
      && state.landmarkCount === 21
      && state.currentLandmarkCount === 21
      && state.coordinateBoundsValid
      && state.currentFrameIndex >= 0
      && state.currentFrameIndex < FRAME_COUNT
      && Math.abs(state.currentAngleRadians - angleForFrame(state.currentFrameIndex)) < 0.00001;
    const overlayEvidence = sketch instanceof p5
      && overlayCanvas instanceof HTMLCanvasElement
      && overlayCanvas.width === SOURCE_WIDTH
      && overlayCanvas.height === SOURCE_HEIGHT
      && state.p5Ready
      && state.overlayReady
      && state.overlayDrawCount >= 1
      && state.overlayPointCount === 21
      && state.overlaySegmentCount === 23
      && (state.playing ? state.revision - state.drawnRevision <= 1 : state.drawnRevision === state.revision);
    const resultEvidence = state.playing
      ? state.resultState === 'playing-review' && playButton.getAttribute('aria-pressed') === 'true'
      : state.ended
        ? state.resultState === 'completed-review'
        : state.resultState === 'paused-review' && playButton.getAttribute('aria-pressed') === 'false';
    const uiEvidence = landmarkOutput.textContent === '21 / 21'
      && frameOutput.textContent === `${String(state.currentFrameIndex + 1).padStart(2, '0')} / ${FRAME_COUNT}`
      && sweepButton.getAttribute('aria-pressed') === String(state.exerciseIndex === 0)
      && holdButton.getAttribute('aria-pressed') === String(state.exerciseIndex === 1)
      && resetButton.disabled === atDefaults()
      && frame.getAttribute('aria-label').includes('21 landmarks');
    const viewportEvidence = frameRect.left >= -0.5
      && frameRect.top >= -0.5
      && frameRect.right <= innerWidth + 0.5
      && frameRect.bottom <= innerHeight + 0.5
      && Math.abs(videoRect.width - frameRect.width) <= 0.5
      && Math.abs(videoRect.height - frameRect.height) <= 0.5
      && Math.abs(overlayRect.width - frameRect.width) <= 0.5
      && Math.abs(overlayRect.height - frameRect.height) <= 0.5
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;

    return window.__PREVIEW_INTERACTION_STATE__ === state
      && window.__PREVIEW_META__?.capture === 'real-demo'
      && window.__PREVIEW_META__?.library === 'p5@2.3.0'
      && stage.dataset.previewMechanism === 'local-video-deterministic-landmark-calibration'
      && state.task === 'hand-rehabilitation-landmark-calibration'
      && state.userInputRequired === true
      && state.acceptedInputs.join('|') === 'mouse|touch|pen|keyboard|control'
      && state.sampleDisclosure === 'fictional-local-calibration-sample-not-live-camera'
      && state.landmarkSource === 'hand-labeled-coordinates-deterministically-aligned-to-local-video-frames'
      && state.automaticPlayback === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.previewClockDriven === false
      && state.previewClockMutationCount === 0
      && state.syntheticInputDispatch === false
      && state.userOwnedPlayback === true
      && state.firstFrameStatic
      && state.initialStaticVerified
      && state.reducedMotionUserControlledPlayback
      && state.pointerCaptured === (dragSession !== null)
      && allCounters.every(counter => Number.isInteger(counter) && counter >= 0)
      && inputEvidence
      && playbackEvidence
      && resetEvidence
      && sourceEvidence
      && landmarkEvidence
      && overlayEvidence
      && resultEvidence
      && uiEvidence
      && viewportEvidence;
  };

  syncInterface();
  ready.catch(markPreviewFailure);
  installPreviewController({
    id: 'live-hand-landmark-video-overlay',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {},
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
