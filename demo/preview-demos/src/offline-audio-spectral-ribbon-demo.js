import { canvasDemo, TAU } from './expansion-b-utils.js';

let samples = new Float32Array(44100), audioRendered = false;
const audioReady = (async () => {
  const offline = new OfflineAudioContext(1, 44100, 44100);
  const oscillator = offline.createOscillator(), gain = offline.createGain();
  oscillator.type = 'sawtooth'; oscillator.frequency.setValueAtTime(82, 0); oscillator.frequency.exponentialRampToValueAtTime(640, 1);
  gain.gain.setValueAtTime(.7, 0); gain.gain.exponentialRampToValueAtTime(.03, 1); oscillator.connect(gain).connect(offline.destination); oscillator.start(); oscillator.stop(1);
  const buffer = await offline.startRendering(); samples = buffer.getChannelData(0); audioRendered = true;
})();
canvasDemo({
  id: 'offline-audio-spectral-ribbon', ready: audioReady,
  draw(context, time) {
    context.fillStyle = '#07051a'; context.fillRect(0, 0, 320, 180); context.save(); context.translate(130, 90); context.globalCompositeOperation = 'lighter';
    for (let layer = 0; layer < 12; layer += 1) {
      context.beginPath();
      for (let x = 0; x <= 175; x += 3) {
        const index = Math.floor((((time * 11000 + x * 104 + layer * 521) % samples.length) + samples.length) % samples.length);
        const energy = Math.abs(samples[index]); const y = Math.sin(x * .055 + time * 2 + layer * .32) * (8 + energy * 45) + (layer - 5.5) * 3;
        x ? context.lineTo(x, y) : context.moveTo(x, y);
      }
      context.strokeStyle = `hsla(${270 + layer * 9},95%,68%,.28)`; context.lineWidth = 1.4; context.stroke();
    }
    context.restore(); context.globalCompositeOperation = 'source-over';
  },
  assert: () => audioRendered && samples.length === 44100 && samples.some(value => Math.abs(value) > .01)
});
