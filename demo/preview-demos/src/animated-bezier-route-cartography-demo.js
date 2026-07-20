import { domDemo, wave } from './expansion-b-utils.js';

const route = document.querySelector('#route'), vehicle = document.querySelector('#vehicle');
domDemo({
  id: 'animated-bezier-route-cartography', renderer: 'svg', motionTarget: () => route,
  render(time, state) {
    const progress = state.pointer?.x ?? wave(time), length = route.getTotalLength(), point = route.getPointAtLength(progress * length), next = route.getPointAtLength(Math.min(length, progress * length + 2));
    vehicle.setAttribute('cx', point.x); vehicle.setAttribute('cy', point.y); vehicle.setAttribute('transform', `rotate(${Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI} ${point.x} ${point.y})`);
    route.style.strokeDasharray = `${length}`; route.style.strokeDashoffset = `${length * (1 - progress)}`;
  },
  assert: ({ state }) => route.getTotalLength() > 180 && state.motion.duration === 3 && vehicle.hasAttribute('cx')
});
