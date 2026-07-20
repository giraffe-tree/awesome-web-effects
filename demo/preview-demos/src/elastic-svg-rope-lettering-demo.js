import { domDemo, TAU } from './expansion-b-utils.js';

const rope = document.querySelector('#rope'), nodes = document.querySelector('#rope-nodes');
nodes.innerHTML = Array.from({ length: 9 }, (_, index) => `<circle r="2" data-i="${index}"/>`).join('');
const dots = [...nodes.children];
domDemo({
  id: 'elastic-svg-rope-lettering',
  library: 'SVG Path API',
  renderer: 'svg',
  render(time, state) {
    const pull = state.pointer ? (state.pointer.y - .5) * 55 : Math.sin(time * 2.1) * 15;
    const path = `M132 111 C149 ${38 + pull},164 ${145 - pull},181 76 S216 ${126 + pull * .45},232 ${63 - pull * .5} S266 ${120 + pull * .2},294 72`;
    rope.setAttribute('d', path);
    const length = rope.getTotalLength();
    dots.forEach((dot, index) => { const point = rope.getPointAtLength(index / (dots.length - 1) * length); dot.setAttribute('cx', point.x); dot.setAttribute('cy', point.y); dot.setAttribute('opacity', .45 + .55 * Math.sin(time * 2 + index / dots.length * TAU) ** 2); });
  },
  assert: () => rope.getTotalLength() > 150 && dots.every(dot => dot.hasAttribute('cx'))
});
