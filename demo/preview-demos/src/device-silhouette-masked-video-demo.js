import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#device-stage');
  const rig = document.querySelector('#device-rig');
  const media = document.querySelector('#device-media');
  const canvas = document.querySelector('#device-film');
  const context = canvas.getContext('2d', { alpha: false });
  const video = document.querySelector('#source-video');
  const playButton = document.querySelector('#device-play');
  const deviceButtons = [...document.querySelectorAll('[data-device-option]')];
  const status = document.querySelector('#device-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const devices = ['desktop', 'phone', 'watch'];
  const deviceLabels = { desktop: 'Desktop', phone: 'Phone', watch: 'Watch' };
  const expectedSourceFile = 'folding-kayak-device-film.mp4';
  const expectedPosterFile = 'folding-kayak-device-poster.jpg';

  const state = {
    id: 'device-silhouette-masked-video',
    automaticFallback: false,
    automaticPlayback: false,
    automaticDeviceSwitch: false,
    syntheticInputDispatch: false,
    mediaDriven: true,
    sourceKind: 'local-video',
    sourceFile: expectedSourceFile,
    sourceUrl: '',
    posterUrl: '',
    sourceElementCount: 1,
    sourceConsistency: {
      singleVideoElement: true,
      sameSourceAcrossDevices: true,
      canvasDrawSourceId: 'source-video',
      selectedSourceUrl: ''
    },
    metadataReady: false,
    firstFrameReady: false,
    canPlayReady: false,
    videoWidth: 0,
    videoHeight: 0,
    duration: 0,
    currentTime: 0,
    selectedDevice: 'desktop',
    previousDevice: null,
    availableDevices: [...devices],
    currentMask: 'desktop-alpha-mask',
    mediaObjectFit: 'cover',
    isPlaying: false,
    paused: true,
    initiallyPaused: true,
    autoplayAttempted: false,
    userInitiated: false,
    userInitiatedPlayback: false,
    inputKind: 'none',
    inputCount: 0,
    deviceSwitchCount: 0,
    clickSwitchCount: 0,
    keyboardSwitchCount: 0,
    dragSwitchCount: 0,
    playToggleCount: 0,
    playCount: 0,
    pauseCount: 0,
    frameDrawCount: 0,
    lastDrawMediaTime: 0,
    lastDrawSourceUrl: '',
    lastInputTrusted: null,
    dragDistance: 0,
    reducedMotion: reducedMotion.matches,
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let latestPointerKind = 'mouse';
  let deviceMotion = null;
  let videoFrameRequest = null;
  let drag = null;

  function noteMetadata() {
    const sourceUrl = video.currentSrc || video.src;
    state.sourceUrl = sourceUrl;
    state.posterUrl = video.poster;
    state.sourceConsistency.selectedSourceUrl = sourceUrl;
    state.sourceElementCount = document.querySelectorAll('video').length;
    state.sourceConsistency.singleVideoElement = state.sourceElementCount === 1;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    state.metadataReady = true;
    state.videoWidth = video.videoWidth;
    state.videoHeight = video.videoHeight;
    state.duration = video.duration;
  }

  function syncMediaState() {
    noteMetadata();
    state.currentTime = Number.isFinite(video.currentTime) ? Number(video.currentTime.toFixed(3)) : 0;
    state.paused = video.paused;
    state.isPlaying = !video.paused && !video.ended;
    state.canPlayReady = video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
    state.mediaObjectFit = getComputedStyle(canvas).objectFit;
  }

  function drawDecodedFrame(mediaTime = video.currentTime) {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) return false;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    state.firstFrameReady = true;
    state.frameDrawCount += 1;
    state.lastDrawMediaTime = Number.isFinite(mediaTime) ? Number(mediaTime.toFixed(3)) : state.currentTime;
    state.lastDrawSourceUrl = video.currentSrc || video.src;
    state.sourceConsistency.selectedSourceUrl = state.lastDrawSourceUrl;
    return true;
  }

  function updateInterface() {
    syncMediaState();
    const totalSeconds = Math.max(0, Math.floor(state.currentTime));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    const playbackLabel = state.isPlaying ? 'playing' : state.canPlayReady ? 'paused' : 'loading';
    const text = `${deviceLabels[state.selectedDevice]} · ${playbackLabel} · ${minutes}:${seconds}`;
    if (status.textContent !== text) status.textContent = text;
    playButton.textContent = state.isPlaying ? 'Pause' : 'Play';
    playButton.setAttribute('aria-pressed', String(state.isPlaying));
    deviceButtons.forEach(button => {
      const selected = button.dataset.deviceOption === state.selectedDevice;
      button.setAttribute('aria-pressed', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  }

  function recordInput(inputKind, trusted) {
    state.inputKind = inputKind;
    state.inputCount += 1;
    state.userInitiated = true;
    state.lastInputTrusted = trusted;
  }

  function settleRig(direction = 0) {
    deviceMotion?.stop?.();
    rig.style.translate = '-50% -50%';
    rig.style.transform = '';
    if (state.reducedMotion) return;
    deviceMotion = animate(rig, {
      rotate: direction ? [direction * -3, direction * 1.2, 0] : [0, 0],
      scale: direction ? [.965, 1.018, 1] : [1, 1]
    }, {
      duration: .5,
      ease: [.22, 1, .36, 1]
    });
  }

  function selectDevice(device, inputKind, trusted, interaction = 'click') {
    if (!devices.includes(device)) return false;
    recordInput(inputKind, trusted);
    const previousIndex = devices.indexOf(state.selectedDevice);
    const nextIndex = devices.indexOf(device);
    if (device === state.selectedDevice) {
      settleRig();
      updateInterface();
      return false;
    }
    state.previousDevice = state.selectedDevice;
    state.selectedDevice = device;
    state.currentMask = `${device}-alpha-mask`;
    state.deviceSwitchCount += 1;
    if (interaction === 'drag') state.dragSwitchCount += 1;
    else if (inputKind === 'keyboard') state.keyboardSwitchCount += 1;
    else state.clickSwitchCount += 1;
    stage.dataset.device = device;
    settleRig(Math.sign(nextIndex - previousIndex));
    updateInterface();
    return true;
  }

  function selectRelativeDevice(delta, inputKind, trusted, interaction = 'keyboard') {
    const currentIndex = devices.indexOf(state.selectedDevice);
    const nextIndex = (currentIndex + delta + devices.length) % devices.length;
    return selectDevice(devices[nextIndex], inputKind, trusted, interaction);
  }

  async function playFromUser(inputKind, trusted) {
    recordInput(inputKind, trusted);
    state.playToggleCount += 1;
    state.userInitiatedPlayback = true;
    if (video.ended || (state.duration && video.currentTime >= state.duration - .04)) video.currentTime = 0;
    try {
      await video.play();
      state.playCount += 1;
      startVideoFrameUpdates();
    } catch (error) {
      window.__PREVIEW_MEDIA_ERROR__ = String(error?.message || error);
    }
    updateInterface();
  }

  function pauseFromUser(inputKind, trusted) {
    recordInput(inputKind, trusted);
    state.playToggleCount += 1;
    state.userInitiatedPlayback = true;
    video.pause();
    state.pauseCount += 1;
    drawDecodedFrame(video.currentTime);
    updateInterface();
  }

  function togglePlayback(inputKind, trusted) {
    if (video.paused || video.ended) playFromUser(inputKind, trusted).catch(error => markPreviewFailure(error));
    else pauseFromUser(inputKind, trusted);
  }

  function onVideoFrame(now, metadata) {
    drawDecodedFrame(metadata.mediaTime);
    syncMediaState();
    if (!video.paused && typeof video.requestVideoFrameCallback === 'function') {
      videoFrameRequest = video.requestVideoFrameCallback(onVideoFrame);
    } else {
      videoFrameRequest = null;
    }
  }

  function startVideoFrameUpdates() {
    if (typeof video.requestVideoFrameCallback !== 'function' || videoFrameRequest !== null) return;
    videoFrameRequest = video.requestVideoFrameCallback(onVideoFrame);
  }

  function stopVideoFrameUpdates() {
    if (videoFrameRequest !== null && typeof video.cancelVideoFrameCallback === 'function') {
      video.cancelVideoFrameCallback(videoFrameRequest);
    }
    videoFrameRequest = null;
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

  video.pause();
  video.addEventListener('loadedmetadata', noteMetadata);
  video.addEventListener('loadeddata', () => {
    drawDecodedFrame(video.currentTime);
    updateInterface();
  });
  video.addEventListener('canplay', () => {
    state.canPlayReady = true;
    updateInterface();
  });
  video.addEventListener('play', () => {
    startVideoFrameUpdates();
    updateInterface();
  });
  video.addEventListener('pause', () => {
    stopVideoFrameUpdates();
    drawDecodedFrame(video.currentTime);
    updateInterface();
  });
  video.addEventListener('seeked', () => {
    drawDecodedFrame(video.currentTime);
    updateInterface();
  });
  video.addEventListener('timeupdate', updateInterface);
  video.addEventListener('error', () => markPreviewFailure(video.error || new Error('Kayak film failed to load')));

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });

  playButton.addEventListener('click', event => {
    const inputKind = event.detail === 0 ? 'keyboard' : latestPointerKind;
    togglePlayback(inputKind, event.isTrusted);
  });

  deviceButtons.forEach(button => {
    button.addEventListener('click', event => {
      const inputKind = event.detail === 0 ? 'keyboard' : latestPointerKind;
      selectDevice(button.dataset.deviceOption, inputKind, event.isTrusted, 'click');
    });
  });

  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      if (!event.repeat) {
        selectRelativeDevice(event.key === 'ArrowRight' ? 1 : -1, 'keyboard', event.isTrusted);
        deviceButtons.find(button => button.dataset.deviceOption === state.selectedDevice)?.focus();
      }
      return;
    }
    if (['1', '2', '3'].includes(event.key)) {
      event.preventDefault();
      if (!event.repeat) selectDevice(devices[Number(event.key) - 1], 'keyboard', event.isTrusted, 'keyboard');
      return;
    }
    if (event.target.closest('button') || ![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    if (!event.repeat) togglePlayback('keyboard', event.isTrusted);
  });

  rig.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    latestPointerKind = event.pointerType || 'pointer';
    drag = { id: event.pointerId, startX: event.clientX, currentX: event.clientX, trusted: event.isTrusted };
    rig.setPointerCapture(event.pointerId);
  });

  rig.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    drag.currentX = event.clientX;
    const distance = Math.max(-42, Math.min(42, drag.currentX - drag.startX));
    state.dragDistance = Number(distance.toFixed(1));
    rig.style.translate = `calc(-50% + ${distance}px) -50%`;
    rig.style.transform = `rotate(${distance * .055}deg) scale(.985)`;
  });

  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const distance = drag.currentX - drag.startX;
    const inputKind = event.pointerType || latestPointerKind || 'pointer';
    const trusted = drag.trusted && event.isTrusted;
    drag = null;
    state.dragDistance = Number(distance.toFixed(1));
    if (Math.abs(distance) >= 18) selectRelativeDevice(distance < 0 ? 1 : -1, inputKind, trusted, 'drag');
    else settleRig();
  }

  rig.addEventListener('pointerup', endDrag);
  rig.addEventListener('pointercancel', endDrag);

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches) deviceMotion?.stop?.();
    updateInterface();
  });

  function render() {
    state.renderCount += 1;
    if (state.isPlaying && typeof video.requestVideoFrameCallback !== 'function') drawDecodedFrame(video.currentTime);
    updateInterface();
  }

  const mediaReady = Promise.all([
    waitForMedia('loadedmetadata', HTMLMediaElement.HAVE_METADATA),
    waitForMedia('loadeddata', HTMLMediaElement.HAVE_CURRENT_DATA),
    waitForMedia('canplay', HTMLMediaElement.HAVE_FUTURE_DATA)
  ]).then(() => {
    noteMetadata();
    state.canPlayReady = true;
    drawDecodedFrame(video.currentTime);
    updateInterface();
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    updateInterface();
    const source = new URL(video.currentSrc || video.src, location.href);
    const poster = new URL(video.poster, location.href);
    const localDirectory = '/assets/aesthetic-wave-02/device-silhouette-masked-video/';
    const matchesSourceOrBuild = (url, exactFile, extension) => {
      const emittedFile = url.pathname.split('/').at(-1) || '';
      const expectedStem = exactFile.slice(0, -extension.length);
      const sourceAsset = url.pathname.includes(localDirectory) && emittedFile === exactFile;
      const builtAsset = url.pathname.includes('/preview-demos/dist/assets/')
        && emittedFile.startsWith(`${expectedStem}-`)
        && emittedFile.endsWith(extension);
      return url.origin === location.origin && (sourceAsset || builtAsset);
    };
    const sameSource = matchesSourceOrBuild(source, expectedSourceFile, '.mp4')
      && matchesSourceOrBuild(poster, expectedPosterFile, '.jpg')
      && state.lastDrawSourceUrl === (video.currentSrc || video.src)
      && state.sourceConsistency.selectedSourceUrl === (video.currentSrc || video.src)
      && state.sourceConsistency.canvasDrawSourceId === video.id
      && state.sourceConsistency.sameSourceAcrossDevices;
    const trueMedia = video instanceof HTMLVideoElement
      && video.videoWidth === 1280
      && video.videoHeight === 720
      && Math.abs(video.duration - 5.8) < .05
      && video.muted
      && video.playsInline
      && video.loop
      && video.preload === 'auto'
      && !video.autoplay;
    const maskIsActive = getComputedStyle(media).maskImage !== 'none'
      || getComputedStyle(media).webkitMaskImage !== 'none';
    const reducedMotionSafe = !state.reducedMotion || state.userInitiatedPlayback || video.paused;
    return trueMedia
      && sameSource
      && document.querySelectorAll('video').length === 1
      && document.querySelectorAll('canvas').length === 1
      && canvas.width === 1280
      && canvas.height === 720
      && getComputedStyle(canvas).objectFit === 'cover'
      && maskIsActive
      && deviceButtons.length === 3
      && deviceButtons.every(button => devices.includes(button.dataset.deviceOption))
      && stage.dataset.device === state.selectedDevice
      && state.availableDevices.join(',') === devices.join(',')
      && state.metadataReady
      && state.firstFrameReady
      && state.canPlayReady
      && state.initiallyPaused
      && state.autoplayAttempted === false
      && state.automaticFallback === false
      && state.automaticPlayback === false
      && state.automaticDeviceSwitch === false
      && state.syntheticInputDispatch === false
      && state.mediaDriven === true
      && state.sourceKind === 'local-video'
      && state.mediaObjectFit === 'cover'
      && state.sourceElementCount === 1
      && state.sourceConsistency.singleVideoElement
      && reducedMotionSafe
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.deviceSwitchCount)
      && Number.isInteger(state.playCount)
      && Math.abs(state.currentTime - video.currentTime) < .05
      && state.isPlaying === (!video.paused && !video.ended)
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'device-silhouette-masked-video',
    library: 'motion@12.42.2',
    renderer: 'canvas2d',
    render,
    ready: Promise.all([mediaReady, document.fonts.ready])
  });
} catch (error) {
  markPreviewFailure(error);
}
