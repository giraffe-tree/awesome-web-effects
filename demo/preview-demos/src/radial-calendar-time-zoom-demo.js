import { domDemo, TAU, wave } from './expansion-b-utils.js';

const arcs = document.querySelector('#calendar-arcs'), needle = document.querySelector('#calendar-needle'), date = document.querySelector('#calendar-date');
const colors = ['#ef5c41', '#e8b44f', '#4ca58f', '#526db0', '#a8649b'];
arcs.innerHTML = Array.from({ length: 12 }, (_, index) => `<circle class="arc" data-i="${index}" r="${31 + index % 3 * 18}" stroke="${colors[index % colors.length]}" stroke-dasharray="${12 + index * 2} ${210}"/>`).join('');
const rings = [...arcs.children];
domDemo({
  id: 'radial-calendar-time-zoom', library: 'SVG Geometry API', renderer: 'svg',
  render(time, state) {
    const progress = state.pointer?.x ?? wave(time), day = 1 + Math.floor(progress * 29);
    needle.setAttribute('transform', `rotate(${progress * 360})`);
    rings.forEach((ring, index) => ring.setAttribute('transform', `rotate(${index * 30 - progress * (18 + index)})`));
    date.textContent = `JUL · ${String(day).padStart(2, '0')}`;
  },
  assert: () => rings.length === 12 && needle.hasAttribute('transform') && /JUL/.test(date.textContent)
});
