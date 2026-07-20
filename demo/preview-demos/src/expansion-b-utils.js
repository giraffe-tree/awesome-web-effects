import p5 from 'p5';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

export const TAU = Math.PI * 2;
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const wave = time => (1 - Math.cos(((time % 3) + 3) % 3 / 3 * TAU)) / 2;
export const seeded = (index, salt = 0) => {
  const value = Math.sin(index * 91.731 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
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

export function canvasDemo({ id, draw, bind, assert, ready: extraReady = Promise.resolve() }) {
  try {
    const canvas = document.querySelector('canvas');
    const state = { pointer: null, draws: 0 };
    const locate = event => {
      const bounds = canvas.getBoundingClientRect();
      state.pointer = {
        x: (event.clientX - bounds.left) / bounds.width * 320,
        y: (event.clientY - bounds.top) / bounds.height * 180
      };
    };
    let context;
    let resolveReady;
    const ready = new Promise(resolve => { resolveReady = resolve; });
    const sketch = new p5(instance => {
      instance.setup = () => {
        instance.pixelDensity(1);
        instance.createCanvas(320, 180, instance.P2D, canvas);
        instance.noLoop();
        context = instance.drawingContext;
        canvas.addEventListener('pointermove', locate);
        canvas.addEventListener('pointerdown', locate);
        bind?.(canvas, state);
        resolveReady();
      };
    }, canvas.parentElement);
    const render = time => {
      draw(context, Number(time) || 0, state);
      state.draws += 1;
    };
    window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
      render(0);
      const first = canvasSignature(context);
      render(1.35);
      const second = canvasSignature(context);
      return sketch instanceof p5 && state.draws >= 2 && canvas.width === 320 && canvas.height === 180 && (assert ? await assert({ canvas, context, state, first, second, render }) : first !== second);
    };
    installPreviewController({ id, library: 'p5@2.3.0', renderer: 'canvas2d', render, ready: Promise.all([ready, extraReady]) });
  } catch (error) {
    markPreviewFailure(error);
  }
}

export function domDemo({ id, render, bind, assert, renderer = 'dom', motionTarget }) {
  try {
    const stage = document.querySelector('.preview-stage');
    const subject = motionTarget?.() ?? stage;
    const motion = animate(subject, { opacity: [.94, 1, .94] }, { duration: 3, ease: 'linear' });
    motion.pause();
    const state = { pointer: null, renders: 0, motion };
    const locate = event => {
      const bounds = stage.getBoundingClientRect();
      state.pointer = {
        x: clamp((event.clientX - bounds.left) / bounds.width),
        y: clamp((event.clientY - bounds.top) / bounds.height)
      };
    };
    stage.addEventListener('pointermove', locate);
    stage.addEventListener('pointerdown', locate);
    bind?.(stage, state);
    const controlledRender = time => {
      motion.time = ((Number(time) || 0) % 3 + 3) % 3;
      render(Number(time) || 0, state);
      state.renders += 1;
    };
    window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
      controlledRender(0);
      const before = stage.innerHTML;
      controlledRender(1.35);
      const after = stage.innerHTML;
      return motion.duration === 3 && state.renders >= 2 && (assert ? await assert({ stage, state, before, after, render: controlledRender }) : before !== after);
    };
    installPreviewController({ id, library: 'motion@12.42.2', renderer, render: controlledRender, ready: document.fonts.ready });
  } catch (error) {
    markPreviewFailure(error);
  }
}
