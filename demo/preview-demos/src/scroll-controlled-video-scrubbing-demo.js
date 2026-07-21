import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const VIDEO_SOURCE = new URL('../assets/aesthetic-wave-04/scroll-controlled-video-scrubbing/bean-growth-study.mp4', import.meta.url).href;
const KEYFRAME_SOURCES = [
  new URL('../assets/aesthetic-wave-04/scroll-controlled-video-scrubbing/stage-01-emergence.jpg', import.meta.url).href,
  new URL('../assets/aesthetic-wave-04/scroll-controlled-video-scrubbing/stage-02-seedling.jpg', import.meta.url).href,
  new URL('../assets/aesthetic-wave-04/scroll-controlled-video-scrubbing/stage-03-climbing.jpg', import.meta.url).href,
  new URL('../assets/aesthetic-wave-04/scroll-controlled-video-scrubbing/stage-04-canopy.jpg', import.meta.url).href,
  new URL('../assets/aesthetic-wave-04/scroll-controlled-video-scrubbing/stage-05-first-bloom.jpg', import.meta.url).href
];

const CHAPTERS = [
  { progress: 0, title: 'Emergence', description: 'The first shoot clears the soil line.' },
  { progress: 0.25, title: 'Seedling', description: 'Cotyledons open into the greenhouse light.' },
  { progress: 0.5, title: 'Climbing', description: 'The main vine finds the support arch.' },
  { progress: 0.75, title: 'Canopy', description: 'Leaves trace the full curve of the frame.' },
  { progress: 1, title: 'First bloom', description: 'Seven flowers mark the reproductive stage.' }
];

try {
  const stage = document.querySelector('#video-stage');
  const video = document.querySelector('#scrub-video');
  const overlayHost = document.querySelector('#measurement-canvas');
  const progressFill = document.querySelector('#video-progress');
  const timeReadout = document.querySelector('#video-time');
  const progressOutput = document.querySelector('#progress-output');
  const dayOutput = document.querySelector('#day-output');
  const canopyOutput = document.querySelector('#canopy-output');
  const chapterKicker = document.querySelector('#chapter-kicker');
  const chapterTitle = document.querySelector('#chapter-title');
  const chapterDescription = document.querySelector('#chapter-description');
  const interactionHint = document.querySelector('#interaction-hint');
  const resetControl = document.querySelector('#reset-control');
  const chapterControls = [...document.querySelectorAll('.chapter-button')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    task: 'scrub-local-growth-video-by-human-input',
    acceptedInputs: ['wheel', 'mouse', 'touch', 'pen', 'keyboard', 'control'],
    userInputRequired: true,
    automaticPlayback: false,
    automaticFallback: false,
    automaticRehearsal: false,
    previewClockDriven: false,
    syntheticDispatch: false,
    sourceKind: 'project-local-static-url',
    inputPolicy: 'trusted-only',
    capturePolicy: 'pointer-capture',
    ready: false,
    reducedMotion: reducedMotion.matches,
    progress: 0,
    desiredProgress: 0,
    currentTime: 0,
    duration: 0,
    seekLimit: 0,
    currentChapter: 0,
    pointer: null,
    dragging: false,
    frameAssets: [],
    frameChecksums: [],
    trustedInputCount: 0,
    untrustedInputCount: 0,
    wheelInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    captureCount: 0,
    captureVerifiedCount: 0,
    releaseCount: 0,
    dragMoveCount: 0,
    chapterControlCount: 0,
    resetCount: 0,
    resetControlCount: 0,
    pageReleaseCount: 0,
    seekRequestCount: 0,
    seekSettledCount: 0,
    playAttemptCount: 0,
    resizeCount: 0,
    lastInputTrusted: null,
    lastInputType: null,
    lastBoundaryReleaseTrusted: null,
    lastResetTrusted: null,
    resetSnapshotValid: false,
    seekConsistencyValid: false,
    initialStaticVerified: false,
    chapterMappingVerified: false,
    boundaryReleaseMathVerified: false,
    previewClockMutations: 0,
    overlayDrawCount: 0
  };

  let sketch = null;
  let pInstance = null;
  let resolveSketchReady;
  const sketchReady = new Promise(resolve => { resolveSketchReady = resolve; });

  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const formatTime = value => Number.isFinite(value) ? value.toFixed(2).padStart(5, '0') : '00.00';

  function nearestChapter(progress) {
    return CHAPTERS.reduce((best, chapter, index) => {
      const distance = Math.abs(chapter.progress - progress);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity }).index;
  }

  function wouldReleasePage(progress, deltaY) {
    return (progress <= 0.0005 && deltaY < 0) || (progress >= 0.9995 && deltaY > 0);
  }

  function updateInterface() {
    const progress = state.progress;
    const chapterIndex = nearestChapter(progress);
    const chapter = CHAPTERS[chapterIndex];
    const day = Math.round(1 + progress * 41);
    const canopy = Math.round(2 + progress * 98);
    state.currentChapter = chapterIndex;
    progressFill.style.transform = `scaleX(${progress})`;
    timeReadout.textContent = `${formatTime(state.currentTime)} / ${formatTime(state.duration)}`;
    progressOutput.textContent = `${String(Math.round(progress * 100)).padStart(3, '0')}% · Day ${String(day).padStart(2, '0')}`;
    dayOutput.textContent = String(day).padStart(2, '0');
    canopyOutput.textContent = `${String(canopy).padStart(2, '0')}%`;
    chapterKicker.textContent = `Chapter ${String(chapterIndex + 1).padStart(2, '0')} / 05`;
    chapterTitle.textContent = chapter.title;
    chapterDescription.textContent = chapter.description;
    interactionHint.textContent = state.dragging ? 'Dragging · release to inspect' : 'Wheel · vertical drag · arrows';
    chapterControls.forEach((control, index) => {
      if (index === chapterIndex) control.setAttribute('aria-current', 'step');
      else control.removeAttribute('aria-current');
    });
    if (pInstance) pInstance.redraw();
  }

  function recordRuntimeAssertion() {
    requestAnimationFrame(() => {
      if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
        stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__() === true);
      }
    });
  }

  function acceptTrustedInput(event, inputType) {
    if (!event.isTrusted) {
      state.untrustedInputCount += 1;
      return false;
    }
    state.trustedInputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputType = inputType;
    stage.dataset.lastTrustedInput = inputType;
    return true;
  }

  function syncFromVideo() {
    if (!state.seekLimit) return;
    state.currentTime = video.currentTime;
    state.progress = clamp(video.currentTime / state.seekLimit);
    state.seekSettledCount += 1;
    state.seekConsistencyValid = (
      Math.abs(state.progress - state.currentTime / state.seekLimit) <= 0.002
      && Math.abs(state.currentTime - state.desiredProgress * state.seekLimit) <= 0.08
      && video.paused
    );
    if (state.lastResetTrusted && state.desiredProgress === 0) {
      state.resetSnapshotValid = state.progress <= 0.002 && state.currentTime <= 0.02 && video.paused;
    }
    updateInterface();
    recordRuntimeAssertion();
  }

  function seekToProgress(progress, inputType) {
    if (!state.ready) return;
    const next = clamp(progress);
    state.desiredProgress = next;
    state.seekRequestCount += 1;
    video.pause();
    const target = next * state.seekLimit;
    if (Math.abs(video.currentTime - target) <= 0.008) {
      syncFromVideo();
      return;
    }
    video.currentTime = target;
    interactionHint.textContent = `${inputType} · seeking ${String(Math.round(next * 100)).padStart(3, '0')}%`;
  }

  function resetStudy(trusted) {
    if (!trusted) return;
    state.resetCount += 1;
    state.lastResetTrusted = true;
    state.resetSnapshotValid = false;
    state.pointer = null;
    state.dragging = false;
    stage.dataset.dragging = 'false';
    seekToProgress(0, 'control');
  }

  stage.addEventListener('wheel', event => {
    if (!state.ready || event.deltaY === 0) return;
    if (!acceptTrustedInput(event, 'wheel')) return;
    state.wheelInputCount += 1;
    if (wouldReleasePage(state.desiredProgress, event.deltaY)) {
      state.pageReleaseCount += 1;
      state.lastBoundaryReleaseTrusted = true;
      stage.dataset.boundaryRelease = event.deltaY < 0 ? 'start' : 'end';
      recordRuntimeAssertion();
      return;
    }
    event.preventDefault();
    const magnitude = clamp(Math.abs(event.deltaY) / 700, 0.035, 0.14);
    seekToProgress(state.desiredProgress + Math.sign(event.deltaY) * magnitude, 'wheel');
  }, { passive: false });

  stage.addEventListener('pointerdown', event => {
    if (!state.ready || (event.button !== undefined && event.button !== 0)) return;
    if (event.target.closest('button')) return;
    if (!acceptTrustedInput(event, event.pointerType || 'mouse')) return;
    state.pointer = { id: event.pointerId, y: event.clientY, moved: 0 };
    state.dragging = true;
    state.captureCount += 1;
    stage.dataset.dragging = 'true';
    stage.setPointerCapture?.(event.pointerId);
    if (stage.hasPointerCapture?.(event.pointerId)) state.captureVerifiedCount += 1;
    updateInterface();
  });

  stage.addEventListener('pointermove', event => {
    if (!state.ready || !state.dragging || !state.pointer || event.pointerId !== state.pointer.id) return;
    if (!acceptTrustedInput(event, event.pointerType || 'mouse')) return;
    event.preventDefault();
    const deltaY = event.clientY - state.pointer.y;
    state.pointer.y = event.clientY;
    state.pointer.moved += Math.abs(deltaY);
    if (Math.abs(deltaY) >= 1) {
      state.dragMoveCount += 1;
      seekToProgress(state.desiredProgress + deltaY / Math.max(150, innerHeight * 0.9), event.pointerType || 'mouse');
    }
  });

  function finishPointer(event) {
    if (!state.pointer || event.pointerId !== state.pointer.id) return;
    if (!acceptTrustedInput(event, event.pointerType || 'mouse')) return;
    stage.releasePointerCapture?.(event.pointerId);
    state.releaseCount += 1;
    state.pointer = null;
    state.dragging = false;
    stage.dataset.dragging = 'false';
    updateInterface();
    recordRuntimeAssertion();
  }

  stage.addEventListener('pointerup', finishPointer);
  stage.addEventListener('pointercancel', finishPointer);

  stage.addEventListener('keydown', event => {
    if (!state.ready || event.target.closest('button')) return;
    const supported = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', '1', '2', '3', '4', '5', 'r', 'R'];
    if (!supported.includes(event.key)) return;
    if (!acceptTrustedInput(event, 'keyboard')) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    const step = event.shiftKey ? 0.18 : 0.075;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp') seekToProgress(state.desiredProgress - step, 'keyboard');
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown') seekToProgress(state.desiredProgress + step, 'keyboard');
    if (event.key === 'Home' || event.key.toLowerCase() === 'r') resetStudy(event.isTrusted);
    if (event.key === 'End') seekToProgress(1, 'keyboard');
    if (/^[1-5]$/.test(event.key)) seekToProgress(CHAPTERS[Number(event.key) - 1].progress, 'keyboard');
  });

  chapterControls.forEach((control, index) => {
    control.addEventListener('click', event => {
      if (!state.ready || !acceptTrustedInput(event, 'control')) return;
      state.controlInputCount += 1;
      state.chapterControlCount += 1;
      seekToProgress(CHAPTERS[index].progress, 'control');
    });
  });

  resetControl.addEventListener('click', event => {
    if (!state.ready || !acceptTrustedInput(event, 'control')) return;
    state.controlInputCount += 1;
    state.resetControlCount += 1;
    resetStudy(event.isTrusted);
  });

  reducedMotion.addEventListener?.('change', () => {
    state.reducedMotion = reducedMotion.matches;
    updateInterface();
    recordRuntimeAssertion();
  });

  video.addEventListener('seeked', syncFromVideo);
  video.addEventListener('play', () => {
    state.playAttemptCount += 1;
    video.pause();
    recordRuntimeAssertion();
  });

  sketch = new p5(p => {
    pInstance = p;
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(overlayHost);
      p.noLoop();
      resolveSketchReady();
    };
    p.draw = () => {
      state.overlayDrawCount += 1;
      p.clear();
      const progress = state.progress;
      const lineX = p.width > 430 ? p.width * 0.73 : p.width * 0.7;
      const top = p.height * 0.18;
      const bottom = p.height * 0.76;
      p.stroke(220, 240, 210, p.width < 180 ? 46 : 68);
      p.strokeWeight(0.7);
      p.line(lineX, top, lineX, bottom);
      for (let index = 0; index < 9; index += 1) {
        const y = p.lerp(top, bottom, index / 8);
        const length = index % 2 ? 4 : 8;
        p.line(lineX - length, y, lineX + length, y);
      }
      const markerY = p.lerp(bottom, top, progress);
      p.noStroke();
      p.fill(201, 239, 114, 230);
      p.circle(lineX, markerY, p.width < 180 ? 2.5 : 5);
      p.stroke(201, 239, 114, 82);
      p.line(lineX - 20, markerY, lineX + 20, markerY);
    };
  }, overlayHost);

  window.addEventListener('resize', () => {
    if (!pInstance) return;
    pInstance.resizeCanvas(innerWidth, innerHeight);
    state.resizeCount += 1;
    pInstance.redraw();
    recordRuntimeAssertion();
  });

  async function decodeKeyframe(source) {
    const image = new Image();
    image.decoding = 'async';
    image.src = source;
    await image.decode();
    if (!image.complete || image.naturalWidth !== 960 || image.naturalHeight !== 540) {
      throw new Error(`Unexpected keyframe dimensions for ${source}`);
    }
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 14;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let checksum = 2166136261;
    for (let index = 0; index < pixels.length; index += 7) {
      checksum ^= pixels[index];
      checksum = Math.imul(checksum, 16777619);
    }
    return { image, checksum: checksum >>> 0 };
  }

  function loadVideo() {
    return new Promise((resolve, reject) => {
      const onReady = () => {
        if (!Number.isFinite(video.duration) || video.duration < 5.9) {
          reject(new Error('Local growth video has invalid duration'));
          return;
        }
        video.pause();
        resolve();
      };
      const onError = () => reject(new Error('Failed to load local growth video'));
      video.addEventListener('loadeddata', onReady, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.poster = KEYFRAME_SOURCES[0];
      video.src = VIDEO_SOURCE;
      video.load();
    });
  }

  state.chapterMappingVerified = (
    CHAPTERS.length === 5
    && CHAPTERS.every((chapter, index) => chapter.progress === index / 4)
    && chapterControls.length === 5
  );
  state.boundaryReleaseMathVerified = (
    wouldReleasePage(0, -1)
    && wouldReleasePage(1, 1)
    && !wouldReleasePage(0, 1)
    && !wouldReleasePage(1, -1)
  );

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = overlayHost.querySelector('canvas');
    const bounds = stage.getBoundingClientRect();
    const currentSource = new URL(video.currentSrc || video.src);
    const trustedStateValid = state.trustedInputCount === 0 || state.lastInputTrusted === true;
    const captureStateValid = state.captureCount === 0 || (
      state.captureVerifiedCount === state.captureCount
      && state.releaseCount <= state.captureCount
    );
    const resetStateValid = state.resetCount === 0 || (state.lastResetTrusted === true && state.resetSnapshotValid);
    return (
      window.__PREVIEW_INTERACTION_STATE__ === state
      && state.task === 'scrub-local-growth-video-by-human-input'
      && JSON.stringify(state.acceptedInputs) === JSON.stringify(['wheel', 'mouse', 'touch', 'pen', 'keyboard', 'control'])
      && state.userInputRequired === true
      && state.automaticPlayback === false
      && state.automaticFallback === false
      && state.automaticRehearsal === false
      && state.previewClockDriven === false
      && state.syntheticDispatch === false
      && state.previewClockMutations === 0
      && state.sourceKind === 'project-local-static-url'
      && state.inputPolicy === 'trusted-only'
      && state.capturePolicy === 'pointer-capture'
      && state.ready
      && sketch instanceof p5
      && pInstance instanceof p5
      && canvas instanceof HTMLCanvasElement
      && canvas.width === Math.round(innerWidth)
      && canvas.height === Math.round(innerHeight)
      && state.overlayDrawCount >= 1
      && state.frameAssets.length === 5
      && state.frameAssets.every(asset => asset.image.complete && asset.image.naturalWidth === 960 && asset.image.naturalHeight === 540)
      && state.frameChecksums.length === 5
      && new Set(state.frameChecksums).size === 5
      && currentSource.origin === location.origin
      && currentSource.pathname.includes('bean-growth-study')
      && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      && video.networkState !== HTMLMediaElement.NETWORK_NO_SOURCE
      && video.duration > 5.9 && video.duration < 6.1
      && video.seekable.length > 0
      && video.paused
      && state.duration === video.duration
      && state.seekLimit > 5.8
      && Math.abs(state.currentTime - video.currentTime) <= 0.01
      && Math.abs(state.progress - video.currentTime / state.seekLimit) <= 0.003
      && state.seekConsistencyValid
      && state.initialStaticVerified
      && state.chapterMappingVerified
      && state.boundaryReleaseMathVerified
      && state.controlInputCount >= state.chapterControlCount + state.resetControlCount
      && trustedStateValid
      && captureStateValid
      && resetStateValid
      && (state.pageReleaseCount === 0 || state.lastBoundaryReleaseTrusted === true)
      && stage.dataset.previewMechanism === 'trusted-input-to-local-video-current-time'
      && stage.dataset.inputPolicy === 'trusted-only'
      && bounds.width >= innerWidth - 1
      && bounds.height >= innerHeight - 1
    );
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  const ready = (async () => {
    const [frameAssets] = await Promise.all([
      Promise.all(KEYFRAME_SOURCES.map(decodeKeyframe)),
      document.fonts.ready,
      sketchReady,
      loadVideo()
    ]);
    state.frameAssets = frameAssets;
    state.frameChecksums = frameAssets.map(asset => asset.checksum);
    state.duration = video.duration;
    state.seekLimit = video.duration - 1 / 30;
    state.progress = 0;
    state.desiredProgress = 0;
    state.currentTime = video.currentTime;
    state.ready = true;
    video.pause();
    updateInterface();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const firstTime = video.currentTime;
    await new Promise(resolve => setTimeout(resolve, 80));
    state.initialStaticVerified = (
      firstTime <= 0.01
      && video.currentTime <= 0.01
      && video.paused
      && state.trustedInputCount === 0
      && state.seekRequestCount === 0
    );
    state.seekConsistencyValid = Math.abs(state.progress - video.currentTime / state.seekLimit) <= 0.003;
    if (!window.__PREVIEW_RUNTIME_ASSERT__()) throw new Error('Growth video runtime contract failed');
    stage.dataset.runtimeAssert = 'true';
  })();

  installPreviewController({
    id: 'scroll-controlled-video-scrubbing',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => Promise.resolve(),
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
