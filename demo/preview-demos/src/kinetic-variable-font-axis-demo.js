import { domDemo, TAU } from './expansion-b-utils.js';

const glyphs = [...document.querySelectorAll('.glyph')];
domDemo({
  id: 'kinetic-variable-font-axis', motionTarget: () => document.querySelector('#axis-word'),
  render(time, state) {
    const progress = state.pointer?.x ?? (1 - Math.cos((time % 3) / 3 * TAU)) / 2;
    glyphs.forEach((glyph, index) => { const local = Math.max(.25, .45 + progress * 1.05 + Math.sin(time * 2 + index) * .16); glyph.style.transform = `scaleX(${local}) scaleY(${1.38 - local * .24}) translateY(${Math.sin(time * 2.4 + index) * 7}px) skewY(${(progress - .5) * (index % 2 ? -8 : 8)}deg)`; glyph.style.fontVariationSettings = `'wght' ${350 + progress * 550}, 'wdth' ${70 + progress * 50}`; });
  },
  assert: ({ state }) => glyphs.length === 4 && state.motion.duration === 3 && glyphs.every(glyph => glyph.style.fontVariationSettings.includes('wght'))
});
