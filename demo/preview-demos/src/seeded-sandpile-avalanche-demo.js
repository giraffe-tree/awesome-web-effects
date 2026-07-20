import { canvasDemo, wave } from './expansion-b-utils.js';

const columns = 45, rows = 31, label = document.querySelector('#grain-count'), palette = ['#21170d', '#a44325', '#e58132', '#ffc866'];
canvasDemo({
  id: 'seeded-sandpile-avalanche',
  draw(context, time, state) {
    const grains = Math.floor((state.pointer ? state.pointer.x / 320 : wave(time)) * 4200), field = new Uint16Array(columns * rows); field[Math.floor(rows / 2) * columns + Math.floor(columns / 2)] = grains;
    let unstable = true, passes = 0; while (unstable && passes < 9000) { unstable = false; passes += 1; for (let y = 1; y < rows - 1; y += 1) for (let x = 1; x < columns - 1; x += 1) { const i = y * columns + x, topple = Math.floor(field[i] / 4); if (topple) { field[i] -= topple * 4; field[i - 1] += topple; field[i + 1] += topple; field[i - columns] += topple; field[i + columns] += topple; unstable = true; } } }
    context.fillStyle = '#100c08'; context.fillRect(0, 0, 320, 180); for (let y = 0; y < rows; y += 1) for (let x = 0; x < columns; x += 1) { context.fillStyle = palette[Math.min(3, field[y * columns + x])]; context.fillRect(128 + x * 4, 27 + y * 4, 4, 4); } label.textContent = `GRAINS ${String(grains).padStart(4, '0')}`;
  },
  assert: () => /^GRAINS \d{4}$/.test(label.textContent)
});
