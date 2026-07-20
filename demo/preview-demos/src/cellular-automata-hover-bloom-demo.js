import { canvasDemo, seeded } from './expansion-b-utils.js';

const columns = 48, rows = 28, initial = new Uint8Array(columns * rows), generationLabel = document.querySelector('#generation');
for (let index = 0; index < initial.length; index += 1) initial[index] = seeded(index, 7) > .77 ? 1 : 0;
const step = field => { const next = new Uint8Array(field.length); for (let y = 0; y < rows; y += 1) for (let x = 0; x < columns; x += 1) { let count = 0; for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) if (dx || dy) count += field[(((y + dy + rows) % rows) * columns + (x + dx + columns) % columns)]; const i = y * columns + x; next[i] = count === 3 || (field[i] && count === 2) ? 1 : 0; } return next; };
canvasDemo({
  id: 'cellular-automata-hover-bloom',
  draw(context, time, state) {
    const generation = Math.floor((((time % 3) + 3) % 3) / 3 * 20), field = new Uint8Array(initial);
    if (state.pointer) { const gx = Math.floor((state.pointer.x - 124) / 4), gy = Math.floor((state.pointer.y - 26) / 4); for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) if (gx + dx >= 0 && gx + dx < columns && gy + dy >= 0 && gy + dy < rows) field[(gy + dy) * columns + gx + dx] = (dx * dx + dy * dy < 5) ? 1 : field[(gy + dy) * columns + gx + dx]; }
    let evolved = field; for (let i = 0; i < generation; i += 1) evolved = step(evolved);
    context.fillStyle = '#06100a'; context.fillRect(0, 0, 320, 180); for (let y = 0; y < rows; y += 1) for (let x = 0; x < columns; x += 1) if (evolved[y * columns + x]) { context.fillStyle = (x + y + generation) % 5 ? '#79e66e' : '#d7ff75'; context.fillRect(124 + x * 4, 26 + y * 4, 3, 3); }
    generationLabel.textContent = `GEN ${String(generation).padStart(3, '0')}`;
  },
  assert: () => initial.length === columns * rows
});
