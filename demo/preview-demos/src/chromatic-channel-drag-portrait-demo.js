import { canvasDemo } from './expansion-b-utils.js';

const drawPortrait = (context, offsetX, color) => {
  context.save(); context.translate(226 + offsetX, 89); context.fillStyle = color; context.beginPath(); context.ellipse(0, 0, 47, 63, -.08, 0, Math.PI * 2); context.fill();
  context.globalCompositeOperation = 'destination-out'; context.beginPath(); context.ellipse(-17, -9, 8, 5, 0, 0, Math.PI * 2); context.ellipse(17, -9, 8, 5, 0, 0, Math.PI * 2); context.fill(); context.fillRect(-20, 31, 40, 5); context.globalCompositeOperation = 'source-over'; context.restore();
};
canvasDemo({
  id: 'chromatic-channel-drag-portrait',
  draw(context, time, state) {
    const amount = state.pointer ? (state.pointer.x / 320 - .5) * 32 : Math.sin(time * 1.8) * 13;
    context.fillStyle = '#0c0a0e'; context.fillRect(0, 0, 320, 180); context.globalCompositeOperation = 'screen'; drawPortrait(context, -amount, '#ff234f'); drawPortrait(context, 0, '#2df4cf'); drawPortrait(context, amount, '#3c55ff'); context.globalCompositeOperation = 'source-over';
    context.strokeStyle = '#ffffff44'; context.strokeRect(170, 18, 112, 145); context.fillStyle = '#fff'; context.font = '800 6px monospace'; context.fillText(`SHIFT ${amount.toFixed(1)}PX`, 175, 157);
  },
  assert: ({ context }) => context.globalCompositeOperation === 'source-over'
});
