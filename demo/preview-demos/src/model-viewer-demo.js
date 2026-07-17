import '@google/model-viewer';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import astronautModelUrl from '../assets/Astronaut.glb?url';

try {
  const viewer = document.querySelector('#product-viewer');
  await customElements.whenDefined('model-viewer');
  viewer.src = astronautModelUrl;

  const ready = viewer.loaded
    ? Promise.resolve()
    : new Promise((resolve, reject) => {
        viewer.addEventListener('load', resolve, { once: true });
        viewer.addEventListener('error', event => reject(new Error(`model-viewer failed to load the GLB: ${event.detail?.type || 'unknown error'}`)), { once: true });
      });

  const render = async time => {
    const orbit = 22 + time * 54;
    const elevation = 70 + Math.sin(time * 1.1) * 5;
    viewer.cameraOrbit = `${orbit}deg ${elevation}deg 156%`;
    viewer.jumpCameraToGoal?.();
    await viewer.updateComplete;
  };

  installPreviewController({
    id: 'accessible-interactive-3d-product-view',
    library: '@google/model-viewer@4.3.1',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
