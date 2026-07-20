import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

export const TAU = Math.PI * 2;
export const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
export const loopTime = (time, duration = 3) => ((Number(time) || 0) % duration + duration) % duration;
export const loopPhase = time => loopTime(time) / 3 * TAU;
export const seeded = (index, salt = 0) => {
  const value = Math.sin((index + 1) * 91.733 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
};
export const lerp = (start, end, amount) => start + (end - start) * amount;
export const smoothstep = value => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};

function canvasSignature(context) {
  const pixels = context.getImageData(0, 0, 320, 180).data;
  let signature = 2166136261;
  for (let index = 0; index < pixels.length; index += 64) {
    signature ^= pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7;
    signature = Math.imul(signature, 16777619);
  }
  return signature >>> 0;
}

export function createP5Demo({ id, draw, bind, assert }) {
  try {
    const host = document.querySelector('[data-p5-host]');
    if (!host) throw new Error(`${id}: missing [data-p5-host]`);

    const state = {
      time: 0,
      pointer: null,
      pressed: false,
      draws: 0,
      mode: 0,
    };
    let sketch;
    let context;
    let resolveReady;
    const ready = new Promise(resolve => { resolveReady = resolve; });

    const locate = event => {
      const bounds = host.getBoundingClientRect();
      state.pointer = {
        x: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 320,
        y: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 180,
      };
      render(state.time);
    };

    const render = time => {
      if (!sketch || !context) return;
      state.time = loopTime(time);
      draw(sketch, state.time, state);
      state.draws += 1;
    };

    sketch = new p5(instance => {
      instance.setup = () => {
        instance.pixelDensity(1);
        instance.createCanvas(320, 180).parent(host);
        instance.noLoop();
        context = instance.drawingContext;
        host.addEventListener('pointermove', locate);
        host.addEventListener('pointerdown', event => {
          state.pressed = true;
          state.mode = (state.mode + 1) % 3;
          locate(event);
        });
        host.addEventListener('pointerup', () => { state.pressed = false; });
        host.addEventListener('pointerleave', () => { state.pressed = false; });
        host.addEventListener('keydown', event => {
          const movement = {
            ArrowLeft: [-14, 0], ArrowRight: [14, 0], ArrowUp: [0, -14], ArrowDown: [0, 14],
          }[event.key];
          if (movement) {
            event.preventDefault();
            state.pointer ??= { x: 160, y: 90 };
            state.pointer.x = clamp(state.pointer.x + movement[0], 0, 320);
            state.pointer.y = clamp(state.pointer.y + movement[1], 0, 180);
            render(state.time);
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            state.mode = (state.mode + 1) % 3;
            render(state.time);
          }
        });
        bind?.({ host, sketch: instance, state, render });
        resolveReady();
      };
    }, host);

    window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
      state.pointer = null;
      render(0);
      const first = canvasSignature(context);
      render(1.137);
      const second = canvasSignature(context);
      const customResult = assert ? await assert({ host, sketch, context, state, render, first, second }) : true;
      return (
        sketch instanceof p5 &&
        host.querySelector('canvas')?.width === 320 &&
        host.querySelector('canvas')?.height === 180 &&
        state.draws >= 2 &&
        first !== second &&
        customResult
      );
    };

    installPreviewController({
      id,
      library: 'p5@2.3.0',
      renderer: 'canvas2d',
      render,
      ready,
    });
  } catch (error) {
    markPreviewFailure(error);
  }
}
