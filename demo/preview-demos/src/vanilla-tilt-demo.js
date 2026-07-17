import VanillaTilt from 'vanilla-tilt';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const card = document.querySelector('#tilt-card');
  const pointer = document.querySelector('#pointer-dot');
  VanillaTilt.init(card, {
    max: 18,
    perspective: 650,
    scale: 1.045,
    glare: true,
    'max-glare': .62,
    speed: 0,
    transition: false,
    gyroscope: false
  });
  window.__PREVIEW_RUNTIME_ASSERT__ = () => card.vanillaTilt instanceof VanillaTilt && Boolean(card.querySelector('.js-tilt-glare'));

  const render = time => {
    const bounds = card.getBoundingClientRect();
    const clientX = bounds.left + bounds.width * (.5 + Math.sin(time * 1.7) * .43);
    const clientY = bounds.top + bounds.height * (.5 + Math.cos(time * 1.23) * .4);
    card.dispatchEvent(new MouseEvent('mouseenter', { clientX, clientY }));
    card.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY }));
    pointer.style.transform = `translate3d(${clientX}px, ${clientY}px, 0)`;
  };

  installPreviewController({
    id: 'perspective-tilt-and-glare',
    library: 'vanilla-tilt@1.8.1',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
