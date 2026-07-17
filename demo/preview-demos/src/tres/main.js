import { createApp, nextTick } from 'vue';
import App from './App.vue';
import { installPreviewController, markPreviewFailure } from '../../shared.js';

try {
  createApp(App).mount('#app');

  const ready = new Promise((resolve, reject) => {
    const started = performance.now();
    const waitForScene = () => {
      if (window.__applyTresTime) resolve();
      else if (performance.now() - started > 12000) reject(new Error('TresJS scene did not mount'));
      else requestAnimationFrame(waitForScene);
    };
    waitForScene();
  });

  installPreviewController({
    id: 'vue-declarative-three-js',
    library: '@tresjs/core@5.8.3 + vue@3.5.40',
    render: async time => {
      window.__applyTresTime?.(time);
      await nextTick();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
