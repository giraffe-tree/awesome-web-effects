import { canvasDemo, wave } from './expansion-b-utils.js';

const width = 182, height = 130;
const source = new Uint8ClampedArray(width * height * 4);
for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
  const ridge = 70 + Math.sin(x * .047) * 18 + Math.cos(x * .091) * 9, sky = y < ridge;
  const index = (y * width + x) * 4, light = sky ? 150 + y * .7 : 42 + (height - y) * .8;
  source[index] = sky ? light + 55 : light + 20; source[index + 1] = sky ? light + 15 : light + 35; source[index + 2] = sky ? light - 35 : light + 22; source[index + 3] = 255;
}
canvasDemo({
  id: 'pixel-sort-hover-wipe',
  draw(context, time, state) {
    const progress = state.pointer ? state.pointer.x / 320 : wave(time), data = new Uint8ClampedArray(source), cutoff = Math.floor(progress * width);
    for (let x = 0; x < cutoff; x += 1) {
      const column = Array.from({ length: height }, (_, y) => { const i = (y * width + x) * 4; return [source[i], source[i + 1], source[i + 2]]; }).sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
      column.forEach((pixel, y) => { const i = (y * width + x) * 4; data[i] = pixel[0]; data[i + 1] = pixel[1]; data[i + 2] = pixel[2]; });
    }
    context.fillStyle = '#0c0f12'; context.fillRect(0, 0, 320, 180); context.putImageData(new ImageData(data, width, height), 128, 25); context.fillStyle = '#ffbf45'; context.fillRect(128 + cutoff, 25, 2, 130);
  },
  assert: () => source.length === width * height * 4
});
