import { installPreviewController, markPreviewFailure } from '../shared.js';
import aframeRuntimeUrl from '../vendor/aframe-v1.8.0.min.js?url';

await new Promise((resolve, reject) => {
  if (window.AFRAME) return resolve();
  const runtime = document.createElement('script');
  runtime.src = aframeRuntimeUrl;
  runtime.onload = resolve;
  runtime.onerror = () => reject(new Error('Unable to load the pinned A-Frame runtime'));
  document.head.append(runtime);
});

try {
  const scene = document.querySelector('#aframe-scene');
  const ready = scene.hasLoaded
    ? Promise.resolve()
    : new Promise(resolve => scene.addEventListener('loaded', resolve, { once: true }));

  await ready;
  const city = document.querySelector('#city').object3D;
  const holo = document.querySelector('#holo').object3D;
  const cameraRig = document.querySelector('#camera-rig').object3D;

  const render = time => {
    city.rotation.y = time * .13;
    holo.rotation.y = -time * .8;
    holo.rotation.x = Math.sin(time * .7) * .16;
    holo.position.y = 1.05 + Math.sin(time * 1.7) * .12;
    cameraRig.rotation.y = Math.sin(time * .32) * .12;
    scene.renderer?.render(scene.object3D, scene.camera);
  };

  installPreviewController({
    id: 'declarative-html-3d-scene',
    library: 'aframe@1.8.0',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
