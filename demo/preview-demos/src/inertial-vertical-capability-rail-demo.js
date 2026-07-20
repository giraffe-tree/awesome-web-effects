import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const windowElement = document.querySelector('#rail-window');
  const rail = document.querySelector('#capability-rail');
  const gesture = document.querySelector('#rail-gesture');
  const mode = document.querySelector('#rail-mode');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const railMotion = animate(rail, {
    y: [0, -16, -82, -108, -94, -58, 0],
    rotate: [0, 0, -.8, .35, 0, 0, 0]
  }, { duration:3, times:[0,.16,.34,.48,.62,.82,1], ease:'linear' });
  const gestureMotion = animate(gesture, {
    opacity:[.3,.3,1,.65,.35,.3],
    scaleY:[.3,.3,1,.72,.4,.3]
  }, { duration:3, times:[0,.16,.34,.52,.8,1], ease:'linear' });
  railMotion.pause();
  gestureMotion.pause();

  let latestTime = 0;
  let dragging = false;
  let pointerStart = 0;
  let dragStart = 0;
  let dragOffset = 0;
  let lastMove = 0;
  let velocity = 0;

  const seek = time => {
    railMotion.time = time;
    gestureMotion.time = time;
    rail.style.translate = `0 ${dragOffset}px`;
    gesture.style.setProperty('--velocity', String(Math.min(1, .25 + Math.abs(velocity) / 700)));
  };

  const render = time => {
    latestTime = time;
    const cycle = reducedMotion.matches ? 0 : ((time % 3) + 3) % 3;
    if (!dragging && Math.abs(velocity) > .4) {
      dragOffset = Math.max(-48, Math.min(48, dragOffset + velocity * .016));
      velocity *= .9;
    }
    seek(cycle);
    mode.textContent = dragging ? 'direct manipulation' : Math.abs(velocity) > 8 ? 'inertial decay' : cycle < .48 ? 'scripted throw' : 'automatic drift';
  };

  windowElement.addEventListener('pointerdown', event => {
    dragging = true;
    velocity = 0;
    pointerStart = event.clientY;
    dragStart = dragOffset;
    lastMove = performance.now();
    windowElement.setPointerCapture(event.pointerId);
  });
  windowElement.addEventListener('pointermove', event => {
    if (!dragging) return;
    const now = performance.now();
    const next = Math.max(-48, Math.min(48, dragStart + event.clientY - pointerStart));
    velocity = (next - dragOffset) / Math.max(.001, (now - lastMove) / 1000);
    dragOffset = next;
    lastMove = now;
    render(latestTime);
  });
  const release = event => {
    if (!dragging) return;
    dragging = false;
    if (windowElement.hasPointerCapture(event.pointerId)) windowElement.releasePointerCapture(event.pointerId);
  };
  windowElement.addEventListener('pointerup', release);
  windowElement.addEventListener('pointercancel', release);
  windowElement.addEventListener('keydown', event => {
    if (!['ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    velocity = event.key === 'ArrowUp' ? -260 : 260;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    seek(0);
    await new Promise(resolve => requestAnimationFrame(resolve));
    const before = getComputedStyle(rail).transform;
    seek(1.2);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const after = getComputedStyle(rail).transform;
    seek(0);
    return railMotion.duration >= 2.9 && typeof windowElement.setPointerCapture === 'function' && before !== after;
  };

  installPreviewController({
    id:'inertial-vertical-capability-rail',
    library:'motion@12.42.2',
    renderer:'dom',
    render,
    ready:Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
