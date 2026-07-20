import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-c-utils.js';

try {
  const shutters = document.querySelector('#shutters');
  const slices = [...document.querySelectorAll('.slice')];
  const images = slices.map(slice => slice.querySelector('img'));
  const meter = document.querySelector('#shutter-meter');
  const profile = [-.94, .62, -.74, .34, -.34, .74, -.62, .94];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    automaticFallback: false,
    mode: 'idle',
    open: 0,
    inputKind: 'none',
    inputCount: 0,
    releaseCount: 0,
    pointerCaptured: false,
    keyboardActive: false,
    springActive: false,
    reducedMotion: reducedMotion.matches,
    imageReady: false,
    initialRegistration: false,
    sourceCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let activePointerId = null;
  let dragStartX = 0;
  let dragStartOpen = 0;
  let keyboardKey = null;
  let springControl = null;
  let renders = 0;

  function stopSpring() {
    springControl?.stop?.();
    springControl = null;
    state.springActive = false;
  }

  function setOpen(value, mode, inputKind, countInput = true) {
    state.open = clamp(value, -1, 1);
    state.mode = mode;
    state.inputKind = inputKind;
    if (countInput) state.inputCount += 1;
  }

  function applySlices() {
    const amplitude = shutters.clientHeight * .23;
    slices.forEach((slice, index) => {
      const signed = state.open * profile[index];
      const shift = signed * amplitude;
      const skew = signed * -4.2;
      slice.style.transform = `translate3d(0, ${shift.toFixed(3)}px, 0) skewY(${skew.toFixed(3)}deg)`;
    });
    shutters.dataset.mode = state.mode;
    meter.textContent = Math.abs(state.open) < .001
      ? '8 slices / aligned'
      : `8 slices / ${Math.round(Math.abs(state.open) * 100)}% open`;
    renders += 1;
  }

  function returnHome(inputKind, countRelease = true) {
    stopSpring();
    state.keyboardActive = false;
    keyboardKey = null;
    if (countRelease) state.releaseCount += 1;
    if (reducedMotion.matches || Math.abs(state.open) < .001) {
      setOpen(0, 'idle', inputKind, false);
      return;
    }
    state.mode = 'returning';
    state.inputKind = inputKind;
    state.springActive = true;
    springControl = animate(state.open, 0, {
      type: 'spring',
      stiffness: 285,
      damping: 24,
      mass: .68,
      restDelta: .002,
      restSpeed: .002,
      onUpdate: value => {
        state.open = value;
      },
      onComplete: () => {
        state.open = 0;
        state.mode = 'idle';
        state.springActive = false;
        springControl = null;
      }
    });
  }

  function finishPointer(event, inputKind) {
    if (activePointerId === null) return;
    const pointerId = activePointerId;
    if (event && event.pointerId !== pointerId) return;
    activePointerId = null;
    state.pointerCaptured = false;
    if (shutters.hasPointerCapture?.(pointerId)) shutters.releasePointerCapture(pointerId);
    returnHome(inputKind);
  }

  shutters.addEventListener('pointerdown', event => {
    event.preventDefault();
    stopSpring();
    shutters.focus({ preventScroll: true });
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartOpen = state.open;
    shutters.setPointerCapture?.(event.pointerId);
    state.pointerCaptured = true;
    setOpen(state.open, 'dragging', event.pointerType || 'pointer');
  });
  shutters.addEventListener('pointermove', event => {
    if (!state.pointerCaptured || event.pointerId !== activePointerId) return;
    event.preventDefault();
    const distance = (event.clientX - dragStartX) / Math.max(1, shutters.clientWidth * .42);
    setOpen(dragStartOpen + distance, 'dragging', event.pointerType || 'pointer');
  });
  shutters.addEventListener('pointerup', event => finishPointer(event, event.pointerType || 'pointer'));
  shutters.addEventListener('pointercancel', event => finishPointer(event, event.pointerType || 'pointer'));
  shutters.addEventListener('lostpointercapture', event => finishPointer(event, 'pointer'));

  shutters.addEventListener('keydown', event => {
    if (event.key === 'Home' || event.key === 'Escape') {
      event.preventDefault();
      if (activePointerId !== null) finishPointer(null, 'keyboard');
      returnHome('keyboard');
      return;
    }
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    stopSpring();
    keyboardKey = event.key;
    state.keyboardActive = true;
    setOpen(event.key === 'ArrowLeft' ? -.72 : .72, 'keyboard', 'keyboard');
  });
  shutters.addEventListener('keyup', event => {
    if (event.key !== keyboardKey) return;
    event.preventDefault();
    returnHome('keyboard');
  });
  shutters.addEventListener('blur', () => {
    if (activePointerId !== null) finishPointer(null, 'focus');
    else returnHome('focus', false);
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (!event.matches) return;
    stopSpring();
    setOpen(0, 'idle', 'system', false);
  });

  function measureInitialRegistration() {
    const shutterBounds = shutters.getBoundingClientRect();
    const sliceBounds = slices.map(slice => slice.getBoundingClientRect());
    const imageBounds = images.map(image => image.getBoundingClientRect());
    const contiguous = sliceBounds.every((bounds, index) => (
      index === 0 || Math.abs(bounds.left - sliceBounds[index - 1].right) < .75
    ));
    const contentWidth = sliceBounds.at(-1).right - sliceBounds[0].left;
    const oneImageLeft = Math.max(...imageBounds.map(bounds => bounds.left))
      - Math.min(...imageBounds.map(bounds => bounds.left)) < .75;
    const oneImageWidth = imageBounds.every(bounds => Math.abs(bounds.width - contentWidth) < 1.25);
    const filled = Math.abs(sliceBounds[0].left - shutterBounds.left) < 1.25
      && Math.abs(sliceBounds.at(-1).right - shutterBounds.right) < 1.25;
    state.initialRegistration = contiguous && oneImageLeft && oneImageWidth && filled;
  }

  const imageReady = Promise.all(images.map(image => image.decode())).then(async () => {
    state.sourceCount = new Set(images.map(image => image.currentSrc)).size;
    state.imageReady = true;
    applySlices();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    measureInitialRegistration();
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const shutterBounds = shutters.getBoundingClientRect();
    const stageBounds = document.querySelector('.shutter-stage').getBoundingClientRect();
    return slices.length === 8
      && images.length === 8
      && images.every(image => image.complete && image.naturalWidth === 1280 && image.naturalHeight === 960)
      && state.imageReady
      && state.sourceCount === 1
      && state.initialRegistration
      && state.automaticFallback === false
      && ['idle', 'dragging', 'keyboard', 'returning'].includes(state.mode)
      && state.open >= -1 && state.open <= 1
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.releaseCount)
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && shutters.tabIndex === 0
      && shutterBounds.width >= stageBounds.width * .9
      && shutterBounds.height >= stageBounds.height * .58
      && slices.every(slice => slice.style.transform.includes('skewY'))
      && renders > 0;
  };

  installPreviewController({
    id: 'gesture-sliced-image-shutters',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => applySlices(),
    ready: Promise.all([imageReady, document.fonts.ready])
  });
} catch (error) {
  markPreviewFailure(error);
}
