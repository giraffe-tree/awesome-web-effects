import createREGL from 'regl';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const canvas = document.querySelector('#regl-canvas');
  const pixelRatio = Math.min(devicePixelRatio, 2);
  const regl = createREGL({ canvas, pixelRatio, attributes: { antialias: true, alpha: false } });

  const particleCount = 1100;
  const seeds = Array.from({ length: particleCount }, (_, index) => {
    const radius = Math.sqrt((index + .5) / particleCount);
    return [radius, (index * 2.399963229728653) % (Math.PI * 2), (index % 29) / 29];
  });

  const drawParticleFlow = regl({
    vert: `
      precision mediump float;
      attribute vec3 seed;
      uniform float time;
      varying float glow;
      varying float colorMix;
      void main() {
        float radius = seed.x;
        float angle = seed.y + time * (.35 + (1.0 - radius) * .75) + sin(time * .7 + radius * 11.0) * .22;
        float fold = sin(angle * 3.0 + time + radius * 9.0) * .18;
        vec2 point = vec2(cos(angle), sin(angle)) * (radius * .92 + fold);
        point.x *= 1.55;
        point += vec2(sin(time * .8) * .08, cos(time * .55) * .04);
        gl_Position = vec4(point, 0.0, 1.0);
        gl_PointSize = (2.2 + (1.0 - radius) * 3.8) * ${pixelRatio.toFixed(1)};
        glow = 1.0 - radius;
        colorMix = seed.z;
      }
    `,
    frag: `
      precision mediump float;
      varying float glow;
      varying float colorMix;
      void main() {
        vec2 centered = gl_PointCoord - .5;
        float alpha = smoothstep(.5, .08, length(centered));
        vec3 cyan = vec3(.12, .93, 1.0);
        vec3 violet = vec3(.64, .26, 1.0);
        vec3 color = mix(cyan, violet, colorMix) + glow * vec3(.35, .18, .5);
        gl_FragColor = vec4(color, alpha * .9);
      }
    `,
    attributes: { seed: seeds },
    uniforms: { time: regl.prop('time') },
    primitive: 'points',
    count: particleCount,
    blend: {
      enable: true,
      func: { srcRGB: 'src alpha', dstRGB: 'one', srcAlpha: 'one', dstAlpha: 'one' }
    },
    depth: { enable: false }
  });

  const drawEnergyCore = regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      uniform float time;
      varying vec2 uv;
      void main() {
        uv = position;
        float pulse = .72 + sin(time * 2.1) * .06;
        gl_Position = vec4(position * vec2(.34, .58) * pulse, 0.0, 1.0);
      }
    `,
    frag: `
      precision mediump float;
      uniform float time;
      varying vec2 uv;
      void main() {
        float radius = length(uv);
        float ring = smoothstep(.8, .22, radius) - smoothstep(.33, .0, radius);
        float spokes = pow(abs(sin(atan(uv.y, uv.x) * 7.0 - time * 2.0)), 18.0);
        vec3 color = mix(vec3(.1, .9, 1.), vec3(.72, .25, 1.), radius);
        gl_FragColor = vec4(color, (ring * .46 + spokes * .12) * smoothstep(1., .4, radius));
      }
    `,
    attributes: { position: [[-1, -1], [1, -1], [0, 1]] },
    uniforms: { time: regl.prop('time') },
    count: 3,
    blend: { enable: true, func: { srcRGB: 'src alpha', dstRGB: 'one', srcAlpha: 'one', dstAlpha: 'one' } },
    depth: { enable: false }
  });

  function resize() {
    const width = Math.round(innerWidth * pixelRatio);
    const height = Math.round(innerHeight * pixelRatio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      regl.poll();
    }
  }

  function render(time) {
    resize();
    regl.clear({ color: [.018, .03, .07, 1], depth: 1 });
    drawEnergyCore({ time });
    drawParticleFlow({ time });
  }

  installPreviewController({
    id: 'functional-webgl-draw-commands',
    library: 'regl@2.1.1',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
