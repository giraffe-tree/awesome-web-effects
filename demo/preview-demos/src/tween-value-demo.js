import * as TWEEN from '@tweenjs/tween.js';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const node = document.querySelector('#value-node');
  const progress = document.querySelector('#value-progress');
  const number = document.querySelector('#value-number');
  const state = { x: 0, value: 0, rotation: 0, radius: 10 };
  const group = new TWEEN.Group();

  const applyValues = () => {
    node.style.transform = `translate3d(${state.x}px, 0, 0) rotate(${state.rotation}deg)`;
    node.style.borderRadius = `${state.radius}px`;
    progress.style.transform = `scaleX(${state.value / 100})`;
    number.textContent = String(Math.round(state.value)).padStart(3, '0');
  };

  const tween = new TWEEN.Tween(state, group)
    .to({ x: 206, value: 100, rotation: 270, radius: 16 }, 1200)
    .easing(TWEEN.Easing.Cubic.InOut)
    .repeat(Infinity)
    .yoyo(true)
    .onUpdate(applyValues)
    .start(0);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => tween instanceof TWEEN.Tween && group.getAll().includes(tween);

  installPreviewController({
    id: 'render-agnostic-value-tween',
    library: '@tweenjs/tween.js@25.0.0',
    renderer: 'dom',
    render: time => {
      group.update(time * 1000, true);
      applyValues();
    },
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
