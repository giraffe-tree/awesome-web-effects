import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { loopPhase, pointerUnit } from './batch-c-utils.js';

try {
  const stage = document.querySelector('#beam-stage');
  const a = document.querySelector('#beam-a');
  const b = document.querySelector('#beam-b');
  const hub = document.querySelector('#beam-hub');
  const paths = [document.querySelector('#beam-left'), document.querySelector('#beam-right')];
  let drag = null;

  const controls = paths.map(path => {
    const control = animate(path, { strokeDashoffset: [0, -32] }, { duration: 1, ease: 'linear', repeat: Infinity });
    control.pause();
    return control;
  });
  const center = element => {
    const bounds = element.getBoundingClientRect();
    const container = stage.getBoundingClientRect();
    return { x: bounds.left - container.left + bounds.width / 2, y: bounds.top - container.top + bounds.height / 2 };
  };
  const curve = (from, to, bend) => `M${from.x},${from.y} C${from.x + bend},${from.y} ${to.x - bend},${to.y} ${to.x},${to.y}`;
  function route() {
    const ca = center(a);
    const cb = center(b);
    const ch = center(hub);
    paths[0].setAttribute('d', curve(ca, ch, 55));
    paths[1].setAttribute('d', curve(ch, cb, 55));
  }

  a.addEventListener('pointerdown', event => {
    drag = pointerUnit(event, stage);
    a.setPointerCapture(event.pointerId);
  });
  a.addEventListener('pointermove', event => {
    if (!drag) return;
    const point = pointerUnit(event, stage);
    a.style.left = `${22 + point.x * 82}px`;
    a.style.top = `${76 + point.y * 66}px`;
    route();
  });
  a.addEventListener('pointerup', () => { drag = null; });
  new ResizeObserver(route).observe(stage);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    controls.every(control => typeof control.pause === 'function' && control.duration > 0) &&
    paths.every(path => path.getAttribute('d')?.includes('C'))
  );
  installPreviewController({
    id: 'animated-dom-node-connection-beam',
    library: 'motion@12.42.2',
    renderer: 'svg',
    render: time => {
      const phase = loopPhase(time);
      hub.style.transform = `translate(${Math.sin(phase) * 10}px,${Math.cos(phase) * 5}px)`;
      b.style.transform = `translateY(${Math.sin(phase + 1.2) * 10}px)`;
      route();
      controls.forEach((control, index) => { control.time = (time + index * .4) % 1; });
    },
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
