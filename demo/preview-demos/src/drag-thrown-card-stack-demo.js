import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#throw-stage');
  const topCard = document.querySelector('#top-card');
  const secondCard = document.querySelector('#second-card');
  const vector = document.querySelector('#throw-vector');
  const wipe = document.querySelector('#reset-wipe');
  const topThrow = animate(topCard, {
    x: [0, 18, 188, 225],
    y: [0, -5, -34, -48],
    rotate: [0, 2, 18, 25],
    opacity: [1, 1, .25, 0]
  }, { duration: 1.15, ease: [.2, .75, .28, 1] });
  const nextLift = animate(secondCard, {
    y: [8, 8, 0],
    scale: [.95, .95, 1],
    rotate: [-4, -4, 0]
  }, { duration: 1.15, ease: [.2, .75, .28, 1] });
  [topThrow, nextLift].forEach(control => control.pause());

  let pointerId = null;
  let dragStart = null;
  let dragOffset = { x: 0, y: 0 };
  let lastMove = null;
  let interactionThrow = null;
  let lastTime = 0;

  const seek = (control, progress) => { control.time = control.duration * Math.max(0, Math.min(1, progress)); };
  function pointerPosition(event) { return { x: event.clientX, y: event.clientY, at: performance.now() }; }
  function startThrow(vectorValue = { x: 1, y: -.25, speed: 1 }) {
    interactionThrow = { startedAt: lastTime, ...vectorValue };
    pointerId = null;
    dragStart = null;
    stage.classList.remove('dragging');
  }

  topCard.addEventListener('pointerdown', event => {
    pointerId = event.pointerId;
    dragStart = pointerPosition(event);
    lastMove = dragStart;
    dragOffset = { x: 0, y: 0 };
    interactionThrow = null;
    topCard.setPointerCapture(event.pointerId);
    stage.classList.add('dragging');
  });
  topCard.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId || !dragStart) return;
    lastMove = pointerPosition(event);
    dragOffset = { x: lastMove.x - dragStart.x, y: lastMove.y - dragStart.y };
  });
  topCard.addEventListener('pointerup', event => {
    if (event.pointerId !== pointerId || !dragStart) return;
    const end = pointerPosition(event);
    const elapsed = Math.max(16, end.at - lastMove.at);
    const velocityX = (end.x - lastMove.x) / elapsed;
    const velocityY = (end.y - lastMove.y) / elapsed;
    startThrow({ x: Math.sign(dragOffset.x || velocityX || 1), y: Math.max(-.8, Math.min(.8, velocityY)), speed: Math.max(.7, Math.min(1.4, Math.abs(velocityX) * 5 + .7)) });
  });
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    startThrow({ x: event.key === 'ArrowLeft' ? -1 : 1, y: -.22, speed: 1 });
  });

  function render(time) {
    lastTime = Number(time) || 0;
    if (dragStart) {
      topCard.style.transform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * .08}deg)`;
      vector.style.transform = `scaleX(${Math.min(1.35, Math.abs(dragOffset.x) / 58 + .35)}) rotate(${dragOffset.x < 0 ? 180 : 0}deg)`;
      return;
    }
    let local = ((lastTime % 3) + 3) % 3;
    let direction = 1;
    let speed = 1;
    if (interactionThrow) {
      local = Math.max(0, lastTime - interactionThrow.startedAt) * interactionThrow.speed + .2;
      direction = interactionThrow.x;
      speed = interactionThrow.speed;
    }
    const progress = Math.max(0, Math.min(1, (local - .22) / .95));
    seek(topThrow, progress);
    seek(nextLift, progress);
    const translate = direction < 0 ? -2 * topThrow.time / topThrow.duration : 0;
    topCard.style.setProperty('--throw-direction', direction);
    if (direction < 0) topCard.style.transform += ` scaleX(-1) translateX(${translate}px)`;
    vector.style.transform = `scaleX(${.35 + progress * speed}) rotate(${direction < 0 ? 180 : 0}deg)`;
    wipe.style.opacity = local > 2.58 ? String(Math.min(1, (local - 2.58) / .32)) : '0';
    if (local >= 2.9 && interactionThrow) interactionThrow = null;
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    [topThrow, nextLift].every(control => typeof control.play === 'function' && typeof control.pause === 'function' && control.duration > 1)
    && stage.dataset.previewMechanism === 'motion-drag-throw'
    && document.querySelectorAll('.throw-card').length === 3
  );

  installPreviewController({
    id: 'drag-thrown-card-stack',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
