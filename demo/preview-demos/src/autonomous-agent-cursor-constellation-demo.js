import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const cursors = [...document.querySelectorAll('.agent-cursor')];
  const shuffle = document.querySelector('#agent-shuffle');
  const status = document.querySelector('#agent-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const paths = [
    { x: [20, 84, 157, 226, 178, 20], y: [24, 48, 18, 50, 91, 24], r: [-8, 4, -4, 8, 0, -8] },
    { x: [229, 190, 112, 48, 92, 229], y: [20, 78, 96, 68, 22, 20], r: [5, -6, 6, -3, 3, 5] },
    { x: [34, 68, 144, 214, 204, 34], y: [93, 18, 45, 88, 28, 93], r: [2, -4, 5, -7, 4, 2] },
    { x: [210, 148, 56, 22, 120, 210], y: [90, 64, 88, 34, 16, 90], r: [-5, 7, -2, 6, -4, -5] },
    { x: [126, 218, 206, 112, 42, 126], y: [16, 38, 94, 76, 45, 16], r: [3, -5, 8, -3, 5, 3] }
  ];
  const times = [0, .19, .42, .63, .82, 1];

  const motions = cursors.map((cursor, index) => {
    const path = paths[index];
    const motion = animate(cursor, {
      x: path.x,
      y: path.y,
      rotate: path.r,
      opacity: [.84, 1, .88, 1, .9, .84],
      scale: [.96, 1.06, 1, 1.08, .98, .96]
    }, {
      duration: 3,
      times,
      ease: 'linear'
    });
    motion.pause();
    return motion;
  });

  let phaseShift = 0;
  let latestTime = 0;
  const seek = time => motions.forEach((motion, index) => {
    motion.time = (time + (index * .31)) % 3;
  });

  const render = time => {
    const cycle = reducedMotion.matches ? 1.5 : (time + phaseShift) % 3;
    latestTime = time;
    seek(cycle);
    const active = Math.min(cursors.length - 1, Math.max(0, Math.floor((cycle / 3) * cursors.length)));
    status.textContent = `${cursors[active]?.dataset.agent || 'parallel'} agent · handing off context`;
  };

  shuffle.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    phaseShift = (phaseShift + .6) % 3;
    render(latestTime);
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => motions.every(control =>
    typeof control.play === 'function' && typeof control.pause === 'function'
  ) && cursors.every(cursor => cursor.style.transform !== '');

  installPreviewController({
    id: 'autonomous-agent-cursor-constellation',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
