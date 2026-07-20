import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-c-utils.js';

try {
  const stage = document.querySelector('#film-stage');
  const stack = document.querySelector('#film-stack');
  const videos = [...document.querySelectorAll('.film-media')];
  const sceneButtons = [...document.querySelectorAll('.film-segment')];
  const durationLabels = [...document.querySelectorAll('.film-duration')];
  const playButton = document.querySelector('#film-play');
  const timeline = document.querySelector('#film-timeline');
  const status = document.querySelector('#film-status');
  const sceneNames = ['Arrival', 'Water', 'Material', 'Afterglow'];
  const expectedFiles = ['01-arrival.mp4', '02-water.mp4', '03-material.mp4', '04-afterglow.mp4'];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const preloadWindow = .72;
  const fadeDuration = .48;
  const state = {
    automaticFallback: false,
    mediaDriven: true,
    userInitiated: false,
    playIntent: false,
    playing: false,
    phase: 'paused',
    activeIndex: 0,
    incomingIndex: null,
    nextIndex: 1,
    activeCurrentTime: 0,
    activeDuration: 0,
    measuredDurations: [0, 0, 0, 0],
    metadataReady: [false, false, false, false],
    canPlayReady: [false, false, false, false],
    preloadRequested: [false, false, false, false],
    metadataReadyCount: 0,
    canPlayCount: 0,
    handoffCount: 0,
    realSeekCount: 0,
    lastHandoffFrom: null,
    lastHandoffTo: null,
    wrappedFourToOne: false,
    handoffLayerCount: 2,
    inputKind: 'none',
    inputCount: 0,
    selectionCount: 0,
    playbackToggleCount: 0,
    crossfadeDuration: fadeDuration,
    preloadWindow,
    reducedMotion: reducedMotion.matches,
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let transitionActive = false;
  let preloadTask = null;
  let fadeControl = null;
  let latestPointerKind = 'mouse';

  function recordInput(inputKind) {
    state.inputKind = inputKind;
    state.inputCount += 1;
    state.userInitiated = true;
  }

  function noteMetadata(index) {
    const video = videos[index];
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    state.metadataReady[index] = true;
    state.measuredDurations[index] = video.duration;
    state.metadataReadyCount = state.metadataReady.filter(Boolean).length;
    durationLabels[index].textContent = `${video.duration.toFixed(1)}s`;
    if (state.metadataReadyCount === videos.length) {
      timeline.style.gridTemplateColumns = state.measuredDurations.map(duration => `${duration}fr`).join(' ');
    }
  }

  function noteCanPlay(index) {
    state.canPlayReady[index] = true;
    state.canPlayCount = state.canPlayReady.filter(Boolean).length;
  }

  videos.forEach((video, index) => {
    video.pause();
    video.addEventListener('loadedmetadata', () => noteMetadata(index));
    video.addEventListener('durationchange', () => noteMetadata(index));
    video.addEventListener('canplay', () => noteCanPlay(index));
    video.addEventListener('play', () => syncMediaState());
    video.addEventListener('pause', () => syncMediaState());
    video.addEventListener('ended', () => {
      syncMediaState();
      if (state.playIntent && index === state.activeIndex) requestNextHandoff(index);
    });
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) noteMetadata(index);
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) noteCanPlay(index);
  });

  function waitForMedia(video, eventName, readyState) {
    if (video.readyState >= readyState) return Promise.resolve(video);
    return new Promise((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve(video);
      };
      const onError = () => {
        cleanup();
        reject(video.error || new Error(`Unable to load ${video.currentSrc || video.src}`));
      };
      const cleanup = () => {
        video.removeEventListener(eventName, onReady);
        video.removeEventListener('error', onError);
      };
      video.addEventListener(eventName, onReady, { once: true });
      video.addEventListener('error', onError, { once: true });
    });
  }

  const metadataPromises = videos.map((video, index) => (
    waitForMedia(video, 'loadedmetadata', HTMLMediaElement.HAVE_METADATA).then(() => {
      noteMetadata(index);
      return video;
    })
  ));

  async function ensureCanPlay(index) {
    const video = videos[index];
    state.preloadRequested[index] = true;
    video.preload = 'auto';
    if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) video.load();
    await waitForMedia(video, 'canplay', HTMLMediaElement.HAVE_FUTURE_DATA);
    noteMetadata(index);
    noteCanPlay(index);
    return video;
  }

  async function seekToRealStart(video) {
    if (!Number.isFinite(video.duration) || video.currentTime <= .025) return;
    const seeked = waitForMedia(video, 'seeked', HTMLMediaElement.HAVE_METADATA);
    video.currentTime = 0;
    state.realSeekCount += 1;
    await seeked;
  }

  async function prepareIncoming(index) {
    const video = await ensureCanPlay(index);
    await seekToRealStart(video);
    return video;
  }

  function syncMediaState() {
    const active = videos[state.activeIndex];
    const duration = Number.isFinite(active.duration) ? active.duration : 0;
    state.activeCurrentTime = Number.isFinite(active.currentTime) ? active.currentTime : 0;
    state.activeDuration = duration;
    state.playing = state.playIntent && !active.paused && !active.ended;
    state.nextIndex = (state.activeIndex + 1) % videos.length;
  }

  function updateInterface() {
    syncMediaState();
    const progress = state.activeDuration > 0
      ? clamp(state.activeCurrentTime / state.activeDuration, 0, 1)
      : 0;
    sceneButtons.forEach((button, index) => {
      const fill = index < state.activeIndex ? 1 : index === state.activeIndex ? progress : 0;
      button.style.setProperty('--fill', String(fill));
      button.setAttribute('aria-current', String(index === state.activeIndex));
    });
    playButton.textContent = state.playIntent ? 'Pause' : 'Play';
    playButton.setAttribute('aria-pressed', String(state.playIntent));
    const number = String(state.activeIndex + 1).padStart(2, '0');
    const label = state.phase === 'handoff'
      ? `handoff to ${String((state.incomingIndex ?? 0) + 1).padStart(2, '0')}`
      : state.phase === 'preloading'
        ? `preloading ${String(state.nextIndex + 1).padStart(2, '0')}`
        : state.playIntent ? (state.playing ? 'playing' : 'buffering') : 'paused';
    const text = `${number} ${sceneNames[state.activeIndex]} · ${label}`;
    if (status.textContent !== text) status.textContent = text;
  }

  function setVisiblePair(outgoingIndex, incomingIndex) {
    videos.forEach((video, index) => {
      video.classList.toggle('is-active', index === outgoingIndex);
      video.classList.toggle('is-incoming', index === incomingIndex);
      if (index !== outgoingIndex && index !== incomingIndex) video.style.opacity = '0';
    });
    videos[outgoingIndex].style.opacity = '1';
    videos[incomingIndex].style.opacity = '0';
  }

  function finishHandoff(fromIndex, toIndex) {
    if (!transitionActive || state.activeIndex !== fromIndex || state.incomingIndex !== toIndex) return;
    const outgoing = videos[fromIndex];
    const incoming = videos[toIndex];
    outgoing.pause();
    outgoing.classList.remove('is-active', 'is-incoming');
    outgoing.style.opacity = '0';
    incoming.classList.remove('is-incoming');
    incoming.classList.add('is-active');
    incoming.style.opacity = '1';
    state.activeIndex = toIndex;
    state.incomingIndex = null;
    state.handoffCount += 1;
    state.lastHandoffFrom = fromIndex;
    state.lastHandoffTo = toIndex;
    if (fromIndex === 3 && toIndex === 0) state.wrappedFourToOne = true;
    state.phase = state.playIntent ? 'playing' : 'paused';
    transitionActive = false;
    fadeControl = null;
    preloadTask = null;
    syncMediaState();
  }

  async function crossfadeTo(toIndex, reason = 'manual') {
    const fromIndex = state.activeIndex;
    if (toIndex === fromIndex || transitionActive) return;
    transitionActive = true;
    state.incomingIndex = toIndex;
    state.phase = 'preloading';
    const incoming = await prepareIncoming(toIndex);
    if (reason === 'duration' && !state.playIntent) {
      transitionActive = false;
      state.incomingIndex = null;
      state.phase = 'paused';
      return;
    }
    const outgoing = videos[fromIndex];
    if (state.playIntent) {
      try {
        await incoming.play();
      } catch (error) {
        state.playIntent = false;
        incoming.pause();
      }
    }
    setVisiblePair(fromIndex, toIndex);
    state.phase = 'handoff';
    const complete = () => finishHandoff(fromIndex, toIndex);
    if (reducedMotion.matches) {
      complete();
      return;
    }
    fadeControl = animate(0, 1, {
      duration: fadeDuration,
      ease: [.22, .7, .25, 1],
      onUpdate: progress => {
        outgoing.style.opacity = String(1 - progress);
        incoming.style.opacity = String(progress);
      },
      onComplete: complete
    });
  }

  function requestNextHandoff(fromIndex) {
    if (transitionActive || fromIndex !== state.activeIndex || !state.playIntent) return;
    const toIndex = (fromIndex + 1) % videos.length;
    if (preloadTask?.fromIndex === fromIndex && preloadTask?.toIndex === toIndex) return;
    state.phase = 'preloading';
    state.nextIndex = toIndex;
    const task = prepareIncoming(toIndex).then(() => {
      if (state.playIntent && state.activeIndex === fromIndex && !transitionActive) {
        return crossfadeTo(toIndex, 'duration');
      }
      preloadTask = null;
      return undefined;
    }).catch(error => markPreviewFailure(error));
    preloadTask = { fromIndex, toIndex, task };
  }

  async function startPlayback() {
    state.userInitiated = true;
    state.playIntent = true;
    state.phase = 'preloading';
    const active = await ensureCanPlay(state.activeIndex);
    if (active.ended || active.currentTime >= active.duration - .025) await seekToRealStart(active);
    try {
      await active.play();
      state.phase = 'playing';
    } catch (error) {
      state.playIntent = false;
      state.phase = 'paused';
    }
    updateInterface();
  }

  function pausePlayback() {
    state.userInitiated = true;
    state.playIntent = false;
    videos.forEach(video => video.pause());
    state.phase = transitionActive ? 'handoff' : 'paused';
    updateInterface();
  }

  function togglePlayback(inputKind) {
    recordInput(inputKind);
    state.playbackToggleCount += 1;
    if (state.playIntent) pausePlayback();
    else startPlayback().catch(error => markPreviewFailure(error));
  }

  function selectScene(index, inputKind) {
    recordInput(inputKind);
    state.selectionCount += 1;
    if (index === state.activeIndex || transitionActive) return;
    crossfadeTo(index, 'manual').catch(error => markPreviewFailure(error));
  }

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });
  playButton.addEventListener('click', event => {
    togglePlayback(event.detail === 0 ? 'keyboard' : latestPointerKind);
  });
  sceneButtons.forEach((button, index) => {
    button.addEventListener('click', event => {
      selectScene(index, event.detail === 0 ? 'keyboard' : latestPointerKind);
    });
  });

  stage.addEventListener('keydown', event => {
    const actionKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (actionKeys.includes(event.key)) {
      event.preventDefault();
      const targetIndex = event.key === 'Home' ? 0
        : event.key === 'End' ? videos.length - 1
          : event.key === 'ArrowLeft'
            ? (state.activeIndex - 1 + videos.length) % videos.length
            : (state.activeIndex + 1) % videos.length;
      selectScene(targetIndex, 'keyboard');
      sceneButtons[targetIndex].focus({ preventScroll: true });
      return;
    }
    if (![' ', 'Enter'].includes(event.key) || event.target.closest('button')) return;
    event.preventDefault();
    if (!event.repeat) togglePlayback('keyboard');
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (!event.matches || !transitionActive || state.incomingIndex === null) return;
    fadeControl?.stop?.();
    finishHandoff(state.activeIndex, state.incomingIndex);
  });

  function render() {
    state.renderCount += 1;
    updateInterface();
    if (!state.playIntent || transitionActive) return;
    const active = videos[state.activeIndex];
    if (!Number.isFinite(active.duration) || active.duration <= 0) return;
    const remaining = active.duration - active.currentTime;
    if (remaining <= preloadWindow) requestNextHandoff(state.activeIndex);
  }

  const firstCanPlay = Promise.all(metadataPromises).then(async () => {
    await ensureCanPlay(0);
    videos[0].pause();
    videos[0].style.opacity = '1';
    noteMetadata(0);
    updateInterface();
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    updateInterface();
    const localPrefix = '/assets/aesthetic-wave-02/duration-aware-hero-film-handoff/';
    const measured = state.measuredDurations.filter(duration => Number.isFinite(duration) && duration > 0);
    const distinctDurations = new Set(measured.map(duration => duration.toFixed(2))).size;
    const mediaSourcesAreLocal = videos.every((video, index) => {
      const source = new URL(video.currentSrc || video.src, location.href);
      const expectedFile = expectedFiles[index];
      const expectedStem = expectedFile.slice(0, -4);
      const emittedFile = source.pathname.split('/').at(-1) || '';
      const sourceAsset = source.pathname.includes(localPrefix) && emittedFile === expectedFile;
      const builtAsset = source.pathname.includes('/preview-demos/dist/assets/')
        && emittedFile.startsWith(`${expectedStem}-`)
        && emittedFile.endsWith('.mp4');
      return source.origin === location.origin
        && (sourceAsset || builtAsset);
    });
    const trueMedia = videos.every(video => (
      video instanceof HTMLVideoElement
      && video.videoWidth === 1280
      && video.videoHeight === 720
      && Number.isFinite(video.duration)
      && video.duration > 0
      && video.muted
      && video.playsInline
      && !video.autoplay
      && Boolean(video.poster)
      && ['metadata', 'auto'].includes(video.preload)
    ));
    const dualLayerStack = stack.contains(videos[0])
      && stack.contains(videos[1])
      && getComputedStyle(videos[0]).position === 'absolute'
      && state.handoffLayerCount === 2;
    const currentTimeIsReal = Math.abs(state.activeCurrentTime - videos[state.activeIndex].currentTime) < .02;
    const pausedUntilUser = state.userInitiated || videos.every(video => video.paused);
    return videos.length === 4
      && sceneButtons.length === 4
      && state.metadataReadyCount === 4
      && measured.length === 4
      && distinctDurations >= 3
      && state.canPlayCount >= 1
      && mediaSourcesAreLocal
      && trueMedia
      && dualLayerStack
      && currentTimeIsReal
      && pausedUntilUser
      && state.mediaDriven === true
      && state.automaticFallback === false
      && state.crossfadeDuration === fadeDuration
      && state.preloadWindow === preloadWindow
      && state.renderCount > 0
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.selectionCount)
      && Number.isInteger(state.playbackToggleCount)
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'duration-aware-hero-film-handoff',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: Promise.all([firstCanPlay, document.fonts.ready])
  });
} catch (error) {
  markPreviewFailure(error);
}
