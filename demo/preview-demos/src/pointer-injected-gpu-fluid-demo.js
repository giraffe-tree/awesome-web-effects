import createREGL from 'regl';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const canvas = document.querySelector('#fluid-canvas');
  const reticle = document.querySelector('#inject-reticle');
  const meter = document.querySelector('#fluid-meter');
  const pixelRatio = Math.min(devicePixelRatio || 1, 2);
  const regl = createREGL({ canvas, pixelRatio, attributes: { antialias: false, alpha: false } });
  const pointer = [.72, .52];
  let pointerDriven = false;
  let drawCount = 0;

  const drawFluid = regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = position * .5 + .5;
        gl_Position = vec4(position, 0., 1.);
      }
    `,
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform float time;
      uniform float aspect;
      uniform vec2 pointer;

      mat2 rotate2d(float angle) {
        float c = cos(angle), s = sin(angle);
        return mat2(c, -s, s, c);
      }

      void main() {
        vec2 p = uv - .5;
        p.x *= aspect;
        vec2 source = pointer - .5;
        source.x *= aspect;
        vec2 advected = p;
        float dye = 0.;
        float curl = 0.;
        for (int i = 0; i < 7; i++) {
          float fi = float(i);
          float age = fi * .105;
          vec2 trail = source - vec2(.34 * age, sin(time * 2.3 - fi * .72) * .075);
          vec2 delta = advected - trail;
          float radius = dot(delta, delta) + .008;
          float vortex = exp(-radius * (22. + fi * 2.));
          advected += vec2(-delta.y, delta.x) * vortex * (.46 - age * .32);
          advected = rotate2d(sin(time * .9 + fi) * .012) * advected;
          dye += vortex * (1. - age * .55);
          curl += vortex * sin(fi * 1.7 + time * 2.);
        }
        float filaments = sin(advected.x * 31. - time * 2.4 + sin(advected.y * 18.))
          * cos(advected.y * 24. + time * 1.5);
        float body = smoothstep(.42, -.08, length(advected - source * .18));
        vec3 navy = vec3(.008, .016, .05);
        vec3 cyan = vec3(.02, .92, .95);
        vec3 violet = vec3(.55, .14, 1.);
        vec3 coral = vec3(1., .22, .36);
        vec3 color = navy;
        color += mix(cyan, violet, .5 + .5 * sin(filaments + time)) * dye * .82;
        color += coral * max(0., curl) * .34;
        color += mix(violet, cyan, uv.y) * body * (.08 + filaments * .025);
        color *= .78 + .22 * smoothstep(1.1, .1, length(p));
        gl_FragColor = vec4(pow(max(color, 0.), vec3(.82)), 1.);
      }
    `,
    attributes: { position: [[-1, -1], [3, -1], [-1, 3]] },
    uniforms: {
      time: regl.prop('time'),
      aspect: regl.prop('aspect'),
      pointer: regl.prop('pointer')
    },
    count: 3,
    depth: { enable: false }
  });

  function resize() {
    const width = Math.round(innerWidth * pixelRatio);
    const height = Math.round(innerHeight * pixelRatio);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    regl.poll();
  }

  function updatePointer(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    pointer[0] = Math.max(.08, Math.min(.94, (clientX - bounds.left) / bounds.width));
    pointer[1] = 1 - Math.max(.08, Math.min(.92, (clientY - bounds.top) / bounds.height));
    pointerDriven = true;
  }
  canvas.addEventListener('pointermove', event => updatePointer(event.clientX, event.clientY));
  canvas.addEventListener('pointerdown', event => updatePointer(event.clientX, event.clientY));
  canvas.addEventListener('keydown', event => {
    const movement = { ArrowLeft: [-.06, 0], ArrowRight: [.06, 0], ArrowUp: [0, .06], ArrowDown: [0, -.06] }[event.key];
    if (!movement) return;
    event.preventDefault();
    pointer[0] = Math.max(.08, Math.min(.94, pointer[0] + movement[0]));
    pointer[1] = Math.max(.08, Math.min(.92, pointer[1] + movement[1]));
    pointerDriven = true;
  });

  function render(time) {
    resize();
    const phase = ((time % 3) + 3) % 3;
    const activePointer = pointerDriven
      ? pointer
      : [.68 + Math.cos(phase / 3 * Math.PI * 2) * .18, .5 + Math.sin(phase / 3 * Math.PI * 2) * .2];
    regl.clear({ color: [.003, .006, .02, 1] });
    drawFluid({ time: phase, aspect: innerWidth / innerHeight, pointer: activePointer });
    drawCount += 1;
    reticle.style.left = `${activePointer[0] * 100}%`;
    reticle.style.top = `${(1 - activePointer[1]) * 100}%`;
    meter.textContent = `CURL ${(Math.sin(phase * 2.1) * .5 + .5).toFixed(2)}`;
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    typeof regl === 'function'
    && typeof drawFluid === 'function'
    && Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    && !regl._gl.isContextLost()
    && drawCount > 0
  );

  installPreviewController({
    id: 'pointer-injected-gpu-fluid',
    library: 'regl@2.1.1',
    renderer: 'webgl',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
