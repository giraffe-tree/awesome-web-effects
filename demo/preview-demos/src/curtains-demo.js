import { Curtains, Plane } from 'curtainsjs';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const vertexShader = `
  precision mediump float;
  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;
  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;
  varying vec2 vUv;
  void main() {
    vUv = aTextureCoord;
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vec2 p = vUv - .5;
    float wave = sin((p.x + p.y) * 11.0 - uTime * 2.4) * .5 + .5;
    float ring = sin(length(p - vec2(sin(uTime) * .08, cos(uTime * .8) * .08)) * 35.0 - uTime * 4.0);
    vec3 deep = vec3(.08, .17, .42);
    vec3 cyan = vec3(.10, .91, 1.0);
    vec3 magenta = vec3(.92, .21, .76);
    vec3 color = mix(deep, cyan, smoothstep(.08, .94, vUv.x + wave * .28));
    color = mix(color, magenta, smoothstep(.3, 1.0, ring * .5 + .5) * .42);
    float vignette = smoothstep(.8, .25, length(p));
    gl_FragColor = vec4(color * (.72 + vignette * .5), 1.0);
  }
`;

try {
  const element = document.querySelector('#shader-card');
  const curtains = new Curtains({
    container: 'curtains-canvas',
    pixelRatio: Math.min(1.5, devicePixelRatio),
    premultipliedAlpha: true,
    autoRender: true,
    watchScroll: true
  });

  const ready = new Promise((resolve, reject) => {
    curtains.onError(() => reject(new Error('Curtains.js could not create a WebGL context')));
    const plane = new Plane(curtains, element, {
      vertexShader,
      fragmentShader,
      widthSegments: 18,
      heightSegments: 12,
      uniforms: {
        time: { name: 'uTime', type: '1f', value: 0 }
      }
    });

    plane.onReady(() => {
      const render = time => {
        const x = 72 + Math.sin(time * 1.18) * 56;
        const y = Math.cos(time * .86) * 10;
        element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${Math.sin(time * .7) * 2.5}deg)`;
        plane.uniforms.time.value = time;
        plane.updatePosition();
        curtains.needRender();
      };

      installPreviewController({
        id: 'dom-synced-shader-planes',
        library: 'curtainsjs@8.1.6',
        render,
        ready: Promise.resolve()
      });
      resolve();
    });
  });

  ready.catch(markPreviewFailure);
} catch (error) {
  markPreviewFailure(error);
}
