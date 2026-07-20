import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

export const TAU = Math.PI * 2;
export const clamp = (value, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));
export const mix = (from, to, progress) => from + (to - from) * progress;
export const smooth = (value) => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};
export const loopTime = (time, duration = 3) =>
  ((Number(time) || 0) % duration + duration) % duration;
export const seeded = (index, salt = 0) => {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export function automaticPointer(time, xPhase = 0, yPhase = 1.2) {
  const angle = (loopTime(time) / 3) * TAU;
  return {
    x: 0.5 + Math.cos(angle + xPhase) * 0.34,
    y: 0.5 + Math.sin(angle + yPhase) * 0.3,
  };
}

export function mountP5Demo(config) {
  const stage = document.querySelector('#expansion-stage');
  const state = {
    pointer: { x: 0.5, y: 0.5 },
    pointerDriven: false,
    active: false,
    pulse: 0,
    activationCount: 0,
  };
  let instance;
  let renderer;
  let drawCount = 0;

  const initialized = new Promise((resolve, reject) => {
    try {
      instance = new p5((sketch) => {
        sketch.setup = () => {
          sketch.pixelDensity(1);
          renderer = sketch.createCanvas(innerWidth, innerHeight);
          renderer.elt.setAttribute('aria-hidden', 'true');
          sketch.noLoop();
          sketch.textFont('system-ui');
          resolve(sketch);
        };
      }, stage);
    } catch (error) {
      reject(error);
    }
  });

  initialized
    .then((sketch) => {
      const updatePointer = (event) => {
        const bounds = stage.getBoundingClientRect();
        state.pointer.x = clamp((event.clientX - bounds.left) / bounds.width);
        state.pointer.y = clamp((event.clientY - bounds.top) / bounds.height);
        state.pointerDriven = true;
      };
      stage.addEventListener('pointermove', updatePointer);
      stage.addEventListener('pointerdown', (event) => {
        updatePointer(event);
        state.active = !state.active;
        state.pulse = 1;
        state.activationCount += 1;
        config.activate?.(state, event);
      });
      stage.addEventListener('keydown', (event) => {
        const movement = {
          ArrowLeft: [-0.08, 0],
          ArrowRight: [0.08, 0],
          ArrowUp: [0, -0.08],
          ArrowDown: [0, 0.08],
        }[event.key];
        if (movement) {
          event.preventDefault();
          state.pointerDriven = true;
          state.pointer.x = clamp(state.pointer.x + movement[0]);
          state.pointer.y = clamp(state.pointer.y + movement[1]);
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          state.active = !state.active;
          state.pulse = 1;
          state.activationCount += 1;
          config.activate?.(state, event);
        }
      });

      window.__PREVIEW_RUNTIME_ASSERT__ = () =>
        instance instanceof p5 &&
        renderer?.elt instanceof HTMLCanvasElement &&
        sketch.drawingContext instanceof CanvasRenderingContext2D &&
        drawCount > 0 &&
        (config.assert?.(state, sketch) ?? true);

      installPreviewController({
        id: config.id,
        library: 'p5@2.3.0',
        renderer: 'canvas2d',
        render: (time) => {
          if (sketch.width !== innerWidth || sketch.height !== innerHeight) {
            sketch.resizeCanvas(innerWidth, innerHeight);
          }
          const phase = loopTime(time);
          const pointer = state.pointerDriven
            ? state.pointer
            : automaticPointer(phase, config.pointerPhase ?? 0, config.pointerYPhase ?? 1.2);
          state.pulse = Math.max(0, state.pulse - 0.035);
          sketch.push();
          sketch.resetMatrix();
          config.draw(sketch, phase, state, pointer);
          sketch.pop();
          drawCount += 1;
        },
        ready: Promise.resolve(),
      });
    })
    .catch(markPreviewFailure);
}
