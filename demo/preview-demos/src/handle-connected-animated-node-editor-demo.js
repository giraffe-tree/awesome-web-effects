import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, loopTime, pointerUnit } from './batch-c-utils.js';

try {
  const canvas = document.querySelector('#node-canvas');
  const paths = [document.querySelector('#edge-a'), document.querySelector('#edge-b')];
  const dot = document.querySelector('#flow-dot');
  const nodes = [...document.querySelectorAll('.node')];
  let temporary = null;
  let drag = null;
  let edgeCount = 2;

  const center = element => {
    const bounds = element.getBoundingClientRect();
    const stage = canvas.getBoundingClientRect();
    return { x: bounds.left - stage.left + bounds.width / 2, y: bounds.top - stage.top + bounds.height / 2 };
  };
  const handlePoint = (node, side) => center(node.querySelector(`.handle.${side}`));
  const curve = (a, b) => `M${a.x},${a.y} C${a.x + 48},${a.y} ${b.x - 48},${b.y} ${b.x},${b.y}`;
  function layout() {
    paths[0].setAttribute('d', curve(handlePoint(nodes[0], 'out'), handlePoint(nodes[1], 'in')));
    paths[1].setAttribute('d', curve(handlePoint(nodes[1], 'out'), handlePoint(nodes[2], 'in')));
  }

  nodes.forEach(node => node.addEventListener('pointerdown', event => {
    if (event.target.classList.contains('handle')) return;
    const point = pointerUnit(event, canvas);
    const bounds = node.getBoundingClientRect();
    drag = {
      node,
      point,
      left: bounds.left - canvas.getBoundingClientRect().left,
      top: bounds.top - canvas.getBoundingClientRect().top
    };
    node.setPointerCapture(event.pointerId);
  }));
  canvas.addEventListener('pointermove', event => {
    if (!drag) return;
    const point = pointerUnit(event, canvas);
    drag.node.style.left = `${clamp(drag.left + (point.x - drag.point.x) * 320, 8, 244)}px`;
    drag.node.style.top = `${clamp(drag.top + (point.y - drag.point.y) * 180, 38, 136)}px`;
    drag.node.style.right = 'auto';
    layout();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  document.querySelectorAll('.handle.out').forEach(handle => handle.addEventListener('pointerdown', event => {
    event.stopPropagation();
    temporary = handle.dataset.from;
    handle.setPointerCapture(event.pointerId);
  }));
  document.querySelectorAll('.handle.in').forEach(handle => handle.addEventListener('pointerup', () => {
    if (temporary) edgeCount = Math.min(2, edgeCount + 1);
    temporary = null;
  }));

  const dashControls = paths.map(path => {
    const control = animate(path, { strokeDashoffset: [0, -24] }, { duration: 1, ease: 'linear', repeat: Infinity });
    control.pause();
    return control;
  });
  const dotControl = animate(dot, { opacity: [.2, 1, .2] }, { duration: 1, ease: 'linear', repeat: Infinity });
  dotControl.pause();

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    dashControls.every(control => typeof control.pause === 'function' && control.duration > 0) &&
    typeof dotControl.pause === 'function' &&
    paths.every(path => path.getAttribute('d')?.startsWith('M')) &&
    edgeCount === 2
  );
  installPreviewController({
    id: 'handle-connected-animated-node-editor',
    library: 'motion@12.42.2',
    renderer: 'svg',
    render: time => {
      layout();
      const phase = loopTime(time) / 3;
      dashControls.forEach((control, index) => { control.time = (phase * 3 + index * .3) % 1; });
      dotControl.time = phase;
      const path = paths[phase < .5 ? 0 : 1];
      const length = path.getTotalLength();
      const point = path.getPointAtLength(length * ((phase * 2) % 1));
      dot.setAttribute('cx', point.x);
      dot.setAttribute('cy', point.y);
      nodes.forEach((node, index) => { node.style.borderColor = index <= Math.floor(phase * 3) ? '#6ee7c7' : '#3c4c58'; });
    },
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
