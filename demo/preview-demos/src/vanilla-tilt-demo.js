import VanillaTilt from 'vanilla-tilt';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const clamp = value => Math.max(0, Math.min(1, value));
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

try {
  const stage = document.querySelector('.preview-stage');
  const card = document.querySelector('#tilt-card');
  const artwork = document.querySelector('#card-art');
  const readout = document.querySelector('#tilt-readout');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let tilt;
  let touchBounds = null;
  let resizeObserver;

  const state = {
    ready: false,
    inputMode: 'idle',
    activePointerId: null,
    point: { x: .5, y: .5 },
    tiltX: 0,
    tiltY: 0,
    glareAngle: 180,
    glareOpacity: 0,
    imageDecoded: false,
    imageWidth: 0,
    imageHeight: 0,
    mouseMoves: 0,
    touchDrags: 0,
    keyboardSteps: 0,
    resets: 0,
    renders: 0,
    inputUpdates: 0,
    automaticPointerDispatches: 0,
    listenersBound: false,
    pointerCaptureSupported: typeof card.setPointerCapture === 'function',
    reducedMotion: reducedMotionQuery.matches,
    visualTiltSuppressed: reducedMotionQuery.matches,
    libraryInstance: false,
    layout: { width: 0, height: 0, cardWidth: 0, cardHeight: 0 },
    destroyed: false,
  };

  window.__TILT_GLARE_STATE__ = state;

  function updateLayout() {
    const stageBounds = stage.getBoundingClientRect();
    const cardBounds = card.getBoundingClientRect();
    state.layout = {
      width: Math.round(stageBounds.width),
      height: Math.round(stageBounds.height),
      cardWidth: Math.round(cardBounds.width),
      cardHeight: Math.round(cardBounds.height),
    };
  }

  function updateAccessibility() {
    const horizontal = state.point.x < .38 ? 'left' : state.point.x > .62 ? 'right' : 'center';
    const vertical = state.point.y < .38 ? 'upper' : state.point.y > .62 ? 'lower' : 'middle';
    const registered = state.inputMode === 'idle' && Math.abs(state.tiltX) < .1 && Math.abs(state.tiltY) < .1;
    const value = state.reducedMotion
      ? `Reduced motion, laminate light ${vertical} ${horizontal}`
      : registered
        ? 'Registered and facing forward'
        : `Light ${vertical} ${horizontal}, horizontal tilt ${Math.round(state.tiltX)} degrees, vertical tilt ${Math.round(state.tiltY)} degrees`;
    card.setAttribute('aria-label', `Nocturne Observatory field pass. ${value}`);
    readout.textContent = registered
      ? 'REGISTERED · MOVE TO INSPECT'
      : `LIGHT ${String(Math.round(state.point.x * 100)).padStart(2, '0')} / ${String(Math.round(state.point.y * 100)).padStart(2, '0')}`;
    stage.dataset.inputMode = state.inputMode;
  }

  function configureMotionPreference(matches) {
    state.reducedMotion = matches;
    state.visualTiltSuppressed = matches;
    stage.dataset.reducedMotion = String(matches);
    if (!tilt) return;
    tilt.settings.max = matches ? .01 : 12;
    tilt.settings.scale = matches ? 1 : 1.018;
    tilt.settings.speed = matches ? 0 : 380;
    tilt.settings.transition = !matches;
    tilt.settings['max-glare'] = matches ? .14 : .38;
    resetTilt('preference');
  }

  function driveTilt(x, y, mode) {
    const normalizedX = clamp(x);
    const normalizedY = clamp(y);
    tilt.updateElementPosition();
    tilt.onMouseEnter();
    tilt.event = {
      clientX: tilt.left + normalizedX * tilt.width,
      clientY: tilt.top + normalizedY * tilt.height,
    };
    tilt.update();
    state.point = { x: normalizedX, y: normalizedY };
    state.inputMode = mode;
    state.inputUpdates += 1;
    updateAccessibility();
  }

  function resetTilt(reason = 'input') {
    if (!tilt) return;
    tilt.onMouseLeave();
    state.point = { x: .5, y: .5 };
    state.inputMode = 'idle';
    state.activePointerId = null;
    state.resets += reason === 'initial' ? 0 : 1;
    updateAccessibility();
  }

  card.addEventListener('tiltChange', event => {
    state.tiltX = Number(event.detail.tiltX);
    state.tiltY = Number(event.detail.tiltY);
    state.glareAngle = Number(event.detail.angle.toFixed(2));
    state.glareOpacity = Number.parseFloat(tilt?.glareElement?.style.opacity || '0') || 0;
    updateAccessibility();
  });

  VanillaTilt.init(card, {
    max: state.reducedMotion ? .01 : 12,
    perspective: 900,
    scale: state.reducedMotion ? 1 : 1.018,
    glare: true,
    'max-glare': state.reducedMotion ? .14 : .38,
    speed: state.reducedMotion ? 0 : 380,
    easing: 'cubic-bezier(.2,.75,.2,1)',
    transition: !state.reducedMotion,
    reset: true,
    'reset-to-start': true,
    gyroscope: false,
  });
  tilt = card.vanillaTilt;
  state.libraryInstance = tilt instanceof VanillaTilt;
  stage.dataset.reducedMotion = String(state.reducedMotion);

  function normalizedPoint(event, bounds = card.getBoundingClientRect()) {
    return {
      x: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width)),
      y: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height)),
    };
  }

  function pointerEnter(event) {
    if (event.pointerType !== 'mouse') return;
    state.inputMode = 'mouse';
    state.point = normalizedPoint(event);
    updateAccessibility();
  }

  function pointerMove(event) {
    if (event.pointerType === 'mouse') {
      state.mouseMoves += 1;
      state.inputMode = 'mouse';
      state.point = normalizedPoint(event);
      updateAccessibility();
      return;
    }
    if (event.pointerId !== state.activePointerId) return;
    event.preventDefault();
    const point = normalizedPoint(event, touchBounds);
    state.touchDrags += 1;
    driveTilt(point.x, point.y, event.pointerType === 'pen' ? 'pen' : 'touch');
  }

  function pointerDown(event) {
    if (event.pointerType === 'mouse' || event.isPrimary === false || event.button !== 0) return;
    event.preventDefault();
    card.focus({ preventScroll: true });
    state.activePointerId = event.pointerId;
    touchBounds = card.getBoundingClientRect();
    if (state.pointerCaptureSupported) {
      try { card.setPointerCapture(event.pointerId); } catch { /* Synthetic QA events cannot own capture. */ }
    }
    const point = normalizedPoint(event, touchBounds);
    driveTilt(point.x, point.y, event.pointerType === 'pen' ? 'pen' : 'touch');
  }

  function pointerEnd(event) {
    if (event.pointerId !== state.activePointerId) return;
    state.activePointerId = null;
    if (card.hasPointerCapture?.(event.pointerId)) card.releasePointerCapture(event.pointerId);
    touchBounds = null;
    resetTilt('release');
  }

  function pointerLeave(event) {
    if (event.pointerType !== 'mouse') return;
    state.point = { x: .5, y: .5 };
    state.inputMode = 'idle';
    state.resets += 1;
    updateAccessibility();
  }

  function keyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'Escape') {
      resetTilt('keyboard');
      return;
    }
    const point = state.inputMode === 'keyboard' ? { ...state.point } : { x: .5, y: .5 };
    if (event.key === 'ArrowLeft') point.x -= .16;
    if (event.key === 'ArrowRight') point.x += .16;
    if (event.key === 'ArrowUp') point.y -= .16;
    if (event.key === 'ArrowDown') point.y += .16;
    state.keyboardSteps += 1;
    driveTilt(point.x, point.y, 'keyboard');
  }

  function blur() {
    if (state.activePointerId !== null) return;
    resetTilt('blur');
  }

  card.addEventListener('pointerenter', pointerEnter);
  card.addEventListener('pointerdown', pointerDown);
  card.addEventListener('pointermove', pointerMove);
  card.addEventListener('pointerup', pointerEnd);
  card.addEventListener('pointercancel', pointerEnd);
  card.addEventListener('lostpointercapture', pointerEnd);
  card.addEventListener('pointerleave', pointerLeave);
  card.addEventListener('keydown', keyDown);
  card.addEventListener('blur', blur);
  reducedMotionQuery.addEventListener('change', event => configureMotionPreference(event.matches));
  state.listenersBound = true;

  resizeObserver = new ResizeObserver(() => {
    updateLayout();
    tilt?.onWindowResize();
  });
  resizeObserver.observe(stage);

  const resourcesReady = Promise.all([document.fonts.ready, artwork.decode()]).then(() => {
    state.imageDecoded = artwork.complete && artwork.naturalWidth === 1280 && artwork.naturalHeight === 800;
    state.imageWidth = artwork.naturalWidth;
    state.imageHeight = artwork.naturalHeight;
    state.ready = true;
    updateLayout();
    resetTilt('initial');
  }, error => {
    markPreviewFailure(error);
    return new Promise(() => {});
  });

  function render() {
    state.renders += 1;
    updateLayout();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await resourcesReady;
    const artworkUrl = new URL(artwork.currentSrc || artwork.src, location.href);
    const artworkFile = artworkUrl.pathname.split('/').at(-1) || '';
    const sourceArtwork = artworkUrl.pathname.includes('/assets/aesthetic-wave-02/perspective-tilt-and-glare/')
      && artworkFile === 'observatory-field-pass-artwork.jpg';
    const builtArtwork = artworkUrl.pathname.includes('/preview-demos/dist/assets/')
      && artworkFile.startsWith('observatory-field-pass-artwork-')
      && artworkFile.endsWith('.jpg');
    const oneLocalArtwork = artworkUrl.origin === location.origin
      && (sourceArtwork || builtArtwork)
      && document.querySelectorAll('#card-art').length === 1;
    resetTilt('assert-start');
    await nextFrame();
    await nextFrame();
    const neutralTransform = card.style.transform;
    const neutralGlare = tilt.glareElement.style.opacity;
    render(0);
    render(2);
    const noAutomaticInput = state.automaticPointerDispatches === 0
      && card.style.transform === neutralTransform
      && tilt.glareElement.style.opacity === neutralGlare;

    driveTilt(.14, .2, 'assert');
    const upperLeft = { tiltX: state.tiltX, tiltY: state.tiltY, glare: state.glareOpacity };
    driveTilt(.86, .8, 'assert');
    const lowerRight = { tiltX: state.tiltX, tiltY: state.tiltY, glare: state.glareOpacity };
    const oppositePose = upperLeft.tiltX > 0 && lowerRight.tiltX < 0
      && upperLeft.tiltY < 0 && lowerRight.tiltY > 0
      && upperLeft.glare > 0 && lowerRight.glare > 0;

    const keyboardBefore = state.keyboardSteps;
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const keyboardWorks = state.keyboardSteps === keyboardBefore + 1 && state.inputMode === 'keyboard';
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await nextFrame();
    await nextFrame();

    return state.ready
      && oneLocalArtwork
      && state.imageDecoded
      && state.imageWidth === 1280
      && state.imageHeight === 800
      && state.libraryInstance
      && card.vanillaTilt instanceof VanillaTilt
      && Boolean(card.querySelector('.js-tilt-glare-inner'))
      && state.listenersBound
      && state.pointerCaptureSupported
      && noAutomaticInput
      && oppositePose
      && keyboardWorks
      && state.inputMode === 'idle'
      && state.point.x === .5
      && state.point.y === .5
      && state.layout.cardWidth > 0
      && state.layout.cardHeight > 0;
  };

  window.addEventListener('beforeunload', () => {
    resizeObserver?.disconnect();
    tilt?.destroy();
    state.destroyed = true;
  }, { once: true });

  installPreviewController({
    id: 'perspective-tilt-and-glare',
    library: 'vanilla-tilt@1.8.1',
    renderer: 'dom',
    render,
    ready: resourcesReady,
  });
} catch (error) {
  markPreviewFailure(error);
}
