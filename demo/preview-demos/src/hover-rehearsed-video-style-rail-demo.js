import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const looks = [
    { id: 'ember', name: 'EMBER', filter: 'brightness(.92) contrast(1.08) saturate(1.12) sepia(.22) hue-rotate(-8deg)', tint: '#7d3a0e', alpha: 0.17 },
    { id: 'glacier', name: 'GLACIER', filter: 'brightness(.88) contrast(1.12) saturate(.68)', tint: '#144c6c', alpha: 0.23 },
    { id: 'true', name: 'TRUE', filter: 'brightness(.91) contrast(1.03) saturate(.9)', tint: '#000000', alpha: 0 },
    { id: 'dust', name: 'DUST', filter: 'brightness(1.02) contrast(.88) saturate(.52) sepia(.2)', tint: '#d8c29d', alpha: 0.15 },
    { id: 'noir', name: 'NOIR', filter: 'brightness(.84) contrast(1.22) grayscale(1)', tint: '#000000', alpha: 0.08 },
  ];
  const player = document.querySelector('#look-player');
  const canvas = document.querySelector('#look-canvas');
  const context = canvas.getContext('2d');
  const video = document.querySelector('#look-video');
  const rail = document.querySelector('#style-rail');
  const cards = [...document.querySelectorAll('.style-card')];
  const thumbnails = cards.map(card => card.querySelector('img'));
  const stateLabel = document.querySelector('#look-state');
  const timecode = document.querySelector('#look-timecode');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const masterUrl = new URL('../assets/aesthetic-wave-01/hover-rehearsed-video-style-rail/look-master-source.jpg', import.meta.url).href;
  const videoUrl = new URL('../assets/aesthetic-wave-01/hover-rehearsed-video-style-rail/look-master-push-in.mp4', import.meta.url).href;

  const interactionState = {
    id: 'hover-rehearsed-video-style-rail',
    phase: 'idle',
    input: 'none',
    committedIndex: 2,
    committedLook: 'true',
    previewIndex: null,
    effectiveIndex: 2,
    focusedIndex: 2,
    mediaReady: false,
    playing: false,
    mediaTime: 0,
    railOffset: 0,
    revision: 0,
    commits: 0,
    automaticFallback: false,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard'],
  };
  window.__PREVIEW_INTERACTION_STATE__ = interactionState;

  const poster = new Image();
  poster.src = masterUrl;
  thumbnails.forEach(image => { image.src = masterUrl; });
  video.poster = masterUrl;
  video.src = videoUrl;
  video.load();

  const draw = source => {
    const look = looks[interactionState.effectiveIndex];
    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.filter = look.filter;
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    context.filter = 'none';
    if (look.alpha) {
      context.globalCompositeOperation = 'soft-light';
      context.globalAlpha = look.alpha;
      context.fillStyle = look.tint;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.restore();
  };

  let frameRequest = 0;
  const stopFrameLoop = () => {
    if (frameRequest && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameRequest);
    frameRequest = 0;
  };
  const frameLoop = () => {
    draw(video);
    interactionState.mediaTime = Number(video.currentTime.toFixed(3));
    timecode.textContent = `00:00:${String(Math.floor(video.currentTime * 10)).padStart(2, '0')}`;
    if (!video.paused) frameRequest = video.requestVideoFrameCallback(frameLoop);
  };

  const applyLook = index => {
    interactionState.effectiveIndex = index;
    const look = looks[index];
    player.dataset.effectiveLook = look.id;
    player.dataset.phase = interactionState.phase;
    stateLabel.textContent = `${interactionState.phase === 'rehearsing' ? 'REHEARSING' : 'COMMITTED'} · ${look.name}`;
    cards.forEach((card, cardIndex) => { card.dataset.previewing = String(interactionState.previewIndex === cardIndex); });
    draw(video.readyState >= 2 ? video : poster);
  };

  const resetMedia = () => {
    video.pause();
    stopFrameLoop();
    if (video.readyState >= 1) video.currentTime = 0;
    interactionState.playing = false;
    interactionState.mediaTime = 0;
    timecode.textContent = '00:00:00';
  };

  let railMotion;
  const centerCard = (index, animated) => {
    const card = cards[index];
    const target = -(card.offsetLeft + card.offsetWidth / 2);
    railMotion?.pause();
    if (animated && !reducedMotion) railMotion = animate(rail, { x: target }, { duration: 0.38, ease: [0.22, 1, 0.36, 1] });
    else rail.style.transform = `translateX(${target}px)`;
    interactionState.railOffset = target;
  };

  const rehearse = (index, input) => {
    resetMedia();
    interactionState.phase = 'rehearsing';
    interactionState.input = input;
    interactionState.previewIndex = index;
    interactionState.revision += 1;
    applyLook(index);
    video.play().catch(error => { window.__PREVIEW_MEDIA_ERROR__ = String(error); });
  };

  const rewind = input => {
    if (interactionState.previewIndex === null) return;
    resetMedia();
    interactionState.previewIndex = null;
    interactionState.phase = interactionState.commits ? 'committed' : 'idle';
    interactionState.input = input;
    interactionState.revision += 1;
    applyLook(interactionState.committedIndex);
  };

  const commit = (index, input) => {
    resetMedia();
    interactionState.committedIndex = index;
    interactionState.committedLook = looks[index].id;
    interactionState.previewIndex = null;
    interactionState.effectiveIndex = index;
    interactionState.focusedIndex = index;
    interactionState.phase = 'committed';
    interactionState.input = input;
    interactionState.commits += 1;
    interactionState.revision += 1;
    cards.forEach((card, cardIndex) => {
      card.setAttribute('aria-checked', String(index === cardIndex));
      card.tabIndex = index === cardIndex ? 0 : -1;
    });
    applyLook(index);
    centerCard(index, true);
  };

  cards.forEach((card, index) => {
    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') rehearse(index, 'mouse');
    });
    card.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' && interactionState.previewIndex === index) rewind('mouse');
    });
    card.addEventListener('pointerup', event => {
      event.preventDefault();
      commit(index, event.pointerType === 'mouse' ? 'mouse' : event.pointerType === 'pen' ? 'pen' : 'touch');
    });
    card.addEventListener('focus', () => {
      if (card.matches(':focus-visible')) rehearse(index, 'keyboard');
    });
    card.addEventListener('blur', event => {
      if (!rail.contains(event.relatedTarget)) rewind('keyboard');
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        commit(index, 'keyboard');
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        rewind('keyboard');
        return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = (index + direction + cards.length) % cards.length;
      interactionState.focusedIndex = next;
      cards.forEach((item, itemIndex) => { item.tabIndex = itemIndex === next ? 0 : -1; });
      cards[next].focus();
    });
  });

  video.addEventListener('play', () => {
    interactionState.playing = true;
    stopFrameLoop();
    frameRequest = video.requestVideoFrameCallback(frameLoop);
  });
  video.addEventListener('pause', () => { interactionState.playing = false; });
  video.addEventListener('seeked', () => draw(video));

  const mediaReady = new Promise((resolve, reject) => {
    if (video.readyState >= 2) resolve();
    else {
      video.addEventListener('loadeddata', resolve, { once: true });
      video.addEventListener('error', () => reject(new Error('Local look video failed to load')), { once: true });
    }
  });
  const ready = Promise.all([
    mediaReady,
    poster.decode(),
    ...thumbnails.map(image => image.decode()),
    document.fonts.ready,
  ]).then(() => {
    interactionState.mediaReady = true;
    video.pause();
    video.currentTime = 0;
    applyLook(interactionState.committedIndex);
    centerCard(interactionState.committedIndex, false);
  });

  addEventListener('resize', () => centerCard(interactionState.committedIndex, false));

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await new Promise(resolve => requestAnimationFrame(resolve));
    const initialStatic = interactionState.revision > 0 || (
      interactionState.phase === 'idle'
      && interactionState.previewIndex === null
      && video.paused
      && video.currentTime <= 0.02
    );
    const checked = cards.filter(card => card.getAttribute('aria-checked') === 'true');
    return Boolean(
      interactionState.mediaReady
      && interactionState.automaticFallback === false
      && initialStatic
      && cards.length === 5
      && cards.every(card => card.getAttribute('role') === 'radio')
      && checked.length === 1
      && checked[0] === cards[interactionState.committedIndex]
      && interactionState.effectiveIndex === (interactionState.previewIndex ?? interactionState.committedIndex)
      && thumbnails.every(image => image.src === masterUrl)
      && video.currentSrc === videoUrl
      && video.duration >= 2.9
      && context.getImageData(640, 360, 1, 1).data[3] === 255
    );
  };

  installPreviewController({
    id: 'hover-rehearsed-video-style-rail',
    library: 'motion@12.42.2',
    renderer: 'canvas2d',
    render: () => {},
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
