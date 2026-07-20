import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-c-utils.js';

try {
  const stage = document.querySelector('#ambience-stage');
  const video = document.querySelector('#sharp-film');
  const ambient = document.querySelector('#ambient-film');
  const context = ambient.getContext('2d', { alpha: false });
  const playToggle = document.querySelector('#play-toggle');
  const ambientToggle = document.querySelector('#ambient-toggle');
  const progress = document.querySelector('#video-progress');
  const status = document.querySelector('#ambience-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const frameCallbackMode = typeof video.requestVideoFrameCallback === 'function'
    ? 'requestVideoFrameCallback'
    : 'media-events';
  const state = {
    automaticFallback: false,
    syntheticInputDispatch: false,
    mediaDriven: true,
    sourceKind: 'local-video',
    sourceUrl: '',
    posterUrl: '',
    metadataReady: false,
    canPlayReady: false,
    firstFrameReady: false,
    videoWidth: 0,
    videoHeight: 0,
    duration: 0,
    currentTime: 0,
    paused: true,
    playing: false,
    ended: false,
    playOrigin: 'none',
    autoplayEligible: !reducedMotion.matches,
    autoplayAttempted: false,
    autoplaySucceeded: false,
    userInitiated: false,
    userInitiatedPlayback: false,
    ambientEnabled: true,
    ambientDrawCount: 0,
    lastDrawMediaTime: 0,
    lastDrawSource: 'none',
    lastDrawSourceUrl: '',
    frameCallbackMode,
    inputKind: 'none',
    inputCount: 0,
    playToggleCount: 0,
    seekCount: 0,
    realSeekCount: 0,
    ambientToggleCount: 0,
    lastSeekDelta: 0,
    reducedMotion: reducedMotion.matches,
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let latestPointerKind = 'mouse';
  let frameCallbackId = null;
  let ambientMotion = null;

  function recordInput(inputKind) {
    state.inputKind = inputKind;
    state.inputCount += 1;
    state.userInitiated = true;
  }

  function noteMetadata() {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    state.metadataReady = true;
    state.sourceUrl = video.currentSrc || video.src;
    state.posterUrl = video.poster;
    state.videoWidth = video.videoWidth;
    state.videoHeight = video.videoHeight;
    state.duration = video.duration;
  }

  function noteCanPlay() {
    state.canPlayReady = video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
  }

  function syncMediaState() {
    noteMetadata();
    noteCanPlay();
    state.currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    state.paused = video.paused;
    state.playing = !video.paused && !video.ended;
    state.ended = video.ended;
  }

  function drawDecodedFrame(mediaTime = video.currentTime) {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) return false;
    context.drawImage(video, 0, 0, ambient.width, ambient.height);
    state.ambientDrawCount += 1;
    state.firstFrameReady = true;
    state.lastDrawMediaTime = Number.isFinite(mediaTime) ? mediaTime : video.currentTime;
    state.lastDrawSource = 'sharp-film-video';
    state.lastDrawSourceUrl = video.currentSrc || video.src;
    return true;
  }

  function onVideoFrame(now, metadata) {
    drawDecodedFrame(metadata.mediaTime);
    frameCallbackId = video.requestVideoFrameCallback(onVideoFrame);
  }

  function startDecodedFrameUpdates() {
    if (frameCallbackMode === 'requestVideoFrameCallback') {
      if (frameCallbackId === null) frameCallbackId = video.requestVideoFrameCallback(onVideoFrame);
      return;
    }
    video.addEventListener('timeupdate', () => drawDecodedFrame(video.currentTime));
    video.addEventListener('seeked', () => drawDecodedFrame(video.currentTime));
    video.addEventListener('play', () => drawDecodedFrame(video.currentTime));
  }

  function updateInterface() {
    syncMediaState();
    const timelineProgress = state.duration > 0 ? clamp(state.currentTime / state.duration, 0, 1) : 0;
    progress.style.setProperty('--progress', String(timelineProgress));
    playToggle.textContent = state.playing ? 'Pause' : 'Play';
    playToggle.setAttribute('aria-pressed', String(state.playing));
    ambientToggle.textContent = state.ambientEnabled ? 'Ambient on' : 'Ambient off';
    ambientToggle.setAttribute('aria-pressed', String(state.ambientEnabled));
    const playbackLabel = state.playing ? 'playing' : state.canPlayReady ? 'paused' : 'loading';
    const reducedLabel = state.reducedMotion && !state.userInitiatedPlayback ? ' · motion reduced' : '';
    const text = `Film ${playbackLabel} · ambience ${state.ambientEnabled ? 'on' : 'off'}${reducedLabel}`;
    if (status.textContent !== text) status.textContent = text;
  }

  function waitForMedia(eventName, readyState) {
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

  async function attemptAutoplay() {
    if (reducedMotion.matches || state.userInitiatedPlayback) return;
    state.autoplayAttempted = true;
    state.playOrigin = 'autoplay';
    try {
      await video.play();
      state.autoplaySucceeded = true;
    } catch (error) {
      state.playOrigin = 'none';
      state.autoplaySucceeded = false;
    }
    updateInterface();
  }

  async function playFromUser(inputKind) {
    recordInput(inputKind);
    state.playToggleCount += 1;
    state.userInitiatedPlayback = true;
    state.playOrigin = 'user';
    if (video.ended || video.currentTime >= video.duration - .025) {
      video.currentTime = 0;
      state.realSeekCount += 1;
    }
    try {
      await video.play();
    } catch (error) {
      state.playOrigin = 'none';
    }
    updateInterface();
  }

  function pauseFromUser(inputKind) {
    recordInput(inputKind);
    state.playToggleCount += 1;
    state.userInitiatedPlayback = true;
    state.playOrigin = 'user';
    video.pause();
    updateInterface();
  }

  function togglePlayback(inputKind) {
    if (video.paused || video.ended) playFromUser(inputKind).catch(error => markPreviewFailure(error));
    else pauseFromUser(inputKind);
  }

  function seekVideo(delta, inputKind) {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    recordInput(inputKind);
    const destination = clamp(video.currentTime + delta, 0, Math.max(0, video.duration - .025));
    state.seekCount += 1;
    state.realSeekCount += 1;
    state.lastSeekDelta = delta;
    video.currentTime = destination;
    updateInterface();
  }

  function setAmbientEnabled(enabled, inputKind) {
    recordInput(inputKind);
    state.ambientToggleCount += 1;
    state.ambientEnabled = enabled;
    ambientMotion?.stop?.();
    const targetOpacity = enabled ? .76 : 0;
    if (reducedMotion.matches) {
      ambient.style.opacity = String(targetOpacity);
    } else {
      ambientMotion = animate(ambient, { opacity: targetOpacity }, {
        duration: .32,
        ease: [.22, .7, .25, 1]
      });
    }
    updateInterface();
  }

  video.addEventListener('loadedmetadata', noteMetadata);
  video.addEventListener('canplay', noteCanPlay);
  video.addEventListener('loadeddata', () => drawDecodedFrame(video.currentTime));
  video.addEventListener('play', updateInterface);
  video.addEventListener('pause', updateInterface);
  video.addEventListener('ended', updateInterface);
  video.addEventListener('seeked', () => {
    drawDecodedFrame(video.currentTime);
    updateInterface();
  });

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });
  playToggle.addEventListener('click', event => {
    togglePlayback(event.detail === 0 ? 'keyboard' : latestPointerKind);
  });
  ambientToggle.addEventListener('click', event => {
    setAmbientEnabled(!state.ambientEnabled, event.detail === 0 ? 'keyboard' : latestPointerKind);
  });
  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      if (!event.repeat) seekVideo(event.key === 'ArrowLeft' ? -1 : 1, 'keyboard');
      return;
    }
    if (event.key.toLowerCase() === 'a') {
      event.preventDefault();
      if (!event.repeat) setAmbientEnabled(!state.ambientEnabled, 'keyboard');
      return;
    }
    if (![' ', 'Enter'].includes(event.key) || event.target.closest('button')) return;
    event.preventDefault();
    if (!event.repeat) togglePlayback('keyboard');
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    state.autoplayEligible = !event.matches;
    if (event.matches && state.playOrigin === 'autoplay') {
      video.pause();
      state.playOrigin = 'none';
    }
    updateInterface();
  });

  function render() {
    state.renderCount += 1;
    updateInterface();
  }

  const mediaReady = Promise.all([
    waitForMedia('loadedmetadata', HTMLMediaElement.HAVE_METADATA),
    waitForMedia('loadeddata', HTMLMediaElement.HAVE_CURRENT_DATA),
    waitForMedia('canplay', HTMLMediaElement.HAVE_FUTURE_DATA)
  ]).then(async () => {
    noteMetadata();
    noteCanPlay();
    drawDecodedFrame(video.currentTime);
    startDecodedFrameUpdates();
    await attemptAutoplay();
    updateInterface();
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    updateInterface();
    const source = new URL(video.currentSrc || video.src, location.href);
    const poster = new URL(video.poster, location.href);
    const localDirectory = '/assets/aesthetic-wave-02/blurred-autoplay-video-ambience/';
    const matchesSourceOrBuild = (url, exactFile, extension) => {
      const emittedFile = url.pathname.split('/').at(-1) || '';
      const expectedStem = exactFile.slice(0, -extension.length);
      const sourceAsset = url.pathname.includes(localDirectory) && emittedFile === exactFile;
      const builtAsset = url.pathname.includes('/preview-demos/dist/assets/')
        && emittedFile.startsWith(`${expectedStem}-`)
        && emittedFile.endsWith(extension);
      return url.origin === location.origin && (sourceAsset || builtAsset);
    };
    const oneLocalSource = document.querySelectorAll('video').length === 1
      && matchesSourceOrBuild(source, 'glass-ambience-loop.mp4', '.mp4');
    const localPoster = matchesSourceOrBuild(poster, 'glass-ambience-poster.jpg', '.jpg');
    const trueMedia = video instanceof HTMLVideoElement
      && video.videoWidth === 1280
      && video.videoHeight === 720
      && Math.abs(video.duration - 6) < .05
      && video.muted
      && video.playsInline
      && video.loop
      && video.preload === 'auto'
      && !video.autoplay;
    const sameDecodedSource = state.ambientDrawCount > 0
      && state.firstFrameReady
      && state.lastDrawSource === 'sharp-film-video'
      && state.lastDrawSourceUrl === (video.currentSrc || video.src)
      && Math.abs(state.lastDrawMediaTime - video.currentTime) < .25;
    const reducedMotionSafe = !state.reducedMotion || state.userInitiatedPlayback || video.paused;
    return oneLocalSource
      && localPoster
      && trueMedia
      && state.metadataReady
      && state.canPlayReady
      && state.sourceKind === 'local-video'
      && state.mediaDriven === true
      && state.syntheticInputDispatch === false
      && state.automaticFallback === false
      && sameDecodedSource
      && context.canvas === ambient
      && getComputedStyle(ambient).filter.includes('blur')
      && reducedMotionSafe
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.playToggleCount)
      && Number.isInteger(state.seekCount)
      && Number.isInteger(state.ambientToggleCount)
      && Math.abs(state.currentTime - video.currentTime) < .05
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'blurred-autoplay-video-ambience',
    library: 'motion@12.42.2',
    renderer: 'canvas2d',
    render,
    ready: Promise.all([mediaReady, document.fonts.ready])
  });
} catch (error) {
  markPreviewFailure(error);
}
