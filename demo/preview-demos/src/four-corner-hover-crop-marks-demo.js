import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const card = document.querySelector('#crop-card');
  const image = document.querySelector('#crop-image');
  const coordinate = document.querySelector('#crop-coordinate');
  const meta = document.querySelector('.crop-meta');
  const cta = document.querySelector('.crop-cta');
  const marks = [...document.querySelectorAll('.crop-mark')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const assetUrl = new URL(
    '../assets/aesthetic-wave-01/four-corner-hover-crop-marks/coastal-retreat-editorial-source.jpg',
    import.meta.url,
  ).href;

  const interactionState = {
    id: 'four-corner-hover-crop-marks',
    phase: 'idle',
    engaged: false,
    input: 'none',
    point: { x: 0.5, y: 0.5 },
    revision: 0,
    assetReady: false,
    automaticFallback: false,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard'],
  };
  window.__PREVIEW_INTERACTION_STATE__ = interactionState;

  image.src = assetUrl;
  const ready = Promise.all([
    image.decode(),
    document.fonts.ready,
  ]).then(() => {
    interactionState.assetReady = true;
  });

  const markMotions = marks.map(mark => animate(
    mark,
    {
      opacity: [0, 1],
      x: [Number(mark.dataset.dx), 0],
      y: [Number(mark.dataset.dy), 0],
    },
    { duration: 0.34, ease: [0.22, 1, 0.36, 1], autoplay: false },
  ));
  const metaMotion = animate(
    meta,
    { opacity: [1, 0], y: [0, -5] },
    { duration: 0.22, ease: 'easeOut', autoplay: false },
  );
  const ctaMotion = animate(
    cta,
    { opacity: [0, 1], y: [7, 0] },
    { duration: 0.3, ease: [0.22, 1, 0.36, 1], autoplay: false },
  );
  const motions = [...markMotions, metaMotion, ctaMotion];
  motions.forEach(motion => {
    motion.pause();
    motion.time = 0;
  });

  const updateCoordinate = (x, y) => {
    interactionState.point.x = Math.min(1, Math.max(0, x));
    interactionState.point.y = Math.min(1, Math.max(0, y));
    coordinate.textContent = `X ${String(Math.round(interactionState.point.x * 100)).padStart(3, '0')} / Y ${String(Math.round(interactionState.point.y * 100)).padStart(3, '0')}`;
  };

  const updatePointFromEvent = event => {
    const bounds = card.getBoundingClientRect();
    updateCoordinate(
      (event.clientX - bounds.left) / bounds.width,
      (event.clientY - bounds.top) / bounds.height,
    );
  };

  const driveMotions = engaged => {
    motions.forEach(motion => {
      if (reducedMotion) {
        motion.pause();
        motion.time = engaged ? motion.duration : 0;
        return;
      }
      motion.speed = engaged ? 1 : -1;
      motion.play();
    });
  };

  const setEngaged = (engaged, input) => {
    if (interactionState.engaged === engaged && interactionState.input === input) return;
    interactionState.engaged = engaged;
    interactionState.phase = engaged ? 'engaged' : 'idle';
    interactionState.input = input;
    interactionState.revision += 1;
    card.dataset.state = interactionState.phase;
    card.setAttribute('aria-pressed', String(engaged));
    driveMotions(engaged);
  };

  card.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    updatePointFromEvent(event);
    setEngaged(true, 'mouse');
  });

  card.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' && interactionState.engaged) updatePointFromEvent(event);
  });

  card.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') setEngaged(false, 'mouse');
  });

  card.addEventListener('pointerup', event => {
    if (event.pointerType === 'mouse') return;
    event.preventDefault();
    updatePointFromEvent(event);
    setEngaged(!interactionState.engaged, event.pointerType === 'pen' ? 'pen' : 'touch');
  });

  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setEngaged(!interactionState.engaged, 'keyboard');
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setEngaged(false, 'keyboard');
      return;
    }
    const steps = {
      ArrowLeft: [-0.08, 0],
      ArrowRight: [0.08, 0],
      ArrowUp: [0, -0.08],
      ArrowDown: [0, 0.08],
    };
    if (!steps[event.key]) return;
    event.preventDefault();
    updateCoordinate(
      interactionState.point.x + steps[event.key][0],
      interactionState.point.y + steps[event.key][1],
    );
    setEngaged(true, 'keyboard');
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await new Promise(resolve => requestAnimationFrame(resolve));
    const initialOpacity = Number.parseFloat(getComputedStyle(marks[0]).opacity);
    const initialStateStayedStatic = interactionState.revision > 0
      || (interactionState.phase === 'idle' && initialOpacity <= 0.02 && motions.every(motion => motion.time === 0));
    return Boolean(
      interactionState.assetReady
      && interactionState.automaticFallback === false
      && image.complete
      && image.naturalWidth === 1280
      && image.naturalHeight === 720
      && marks.length === 4
      && initialStateStayedStatic
      && card.getAttribute('aria-pressed') === String(interactionState.engaged)
      && coordinate.textContent.startsWith('X ')
      && motions.every(motion => motion.duration >= 0.2 && motion.duration <= 0.35)
    );
  };

  installPreviewController({
    id: 'four-corner-hover-crop-marks',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: () => {},
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
