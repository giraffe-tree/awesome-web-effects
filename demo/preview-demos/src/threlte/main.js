import { mount } from 'svelte';
import App from './App.svelte';
import { installPreviewController, markPreviewFailure } from '../../shared.js';

try {
  mount(App, { target: document.querySelector('#app') });

  const ready = new Promise((resolve, reject) => {
    const started = performance.now();
    const waitForScene = () => {
      if (window.__applyThrelteTime) resolve();
      else if (performance.now() - started > 12000) reject(new Error('Threlte scene did not mount'));
      else requestAnimationFrame(waitForScene);
    };
    waitForScene();
  });

  installPreviewController({
    id: 'svelte-declarative-three-js',
    library: '@threlte/core@8.5.16 + svelte@5.56.6',
    render: time => window.__applyThrelteTime?.(time),
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
