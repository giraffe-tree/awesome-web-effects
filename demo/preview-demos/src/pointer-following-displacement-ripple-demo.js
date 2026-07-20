import createREGL from 'regl';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-b-utils.js';

try {
  const stage = document.querySelector('#ripple-stage');
  const canvas = document.querySelector('#ripple-canvas');
  const ring = document.querySelector('#ripple-ring');
  const status = document.querySelector('#ripple-status');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const regl = createREGL({
    canvas,
    pixelRatio: dpr,
    attributes: { antialias: true, alpha: false }
  });

  const sourceUrl = new URL(
    '../assets/aesthetic-wave-01/pointer-following-displacement-ripple/coastal-pavilion-displacement-source.jpg',
    import.meta.url
  ).href;
  const sourceImage = new Image();
  sourceImage.decoding = 'async';
  sourceImage.src = sourceUrl;

  const sourceTexture = regl.texture({
    width: 1,
    height: 1,
    data: [21, 33, 31, 255],
    min: 'linear',
    mag: 'linear',
    wrap: 'clamp'
  });

  let textureReady = false;
  const imageReady = sourceImage.decode().then(() => {
    sourceTexture({
      data: sourceImage,
      flipY: true,
      min: 'linear',
      mag: 'linear',
      wrap: 'clamp'
    });
    textureReady = true;
  });

  const interaction = {
    automaticPath: false,
    engaged: false,
    eventTime: 0,
    inputCount: 0,
    inputKind: 'none',
    mode: 'idle',
    origin: { x: .56, y: .48 },
    strength: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = interaction;

  let controllerTime = 0;
  let previousInputTime = 0;
  let previousOrigin = { ...interaction.origin };
  let draws = 0;

  const draw = regl({
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
      uniform sampler2D source;
      uniform vec2 origin;
      uniform float age;
      uniform float aspect;
      uniform float impulse;

      void main() {
        vec2 delta = uv - origin;
        delta.x *= aspect;
        float radius = length(delta);
        vec2 direction = delta / max(radius, .0001);
        direction.x /= aspect;

        float decay = exp(-age * 2.15) * impulse;
        float expandingRadius = age * .14;
        float front = exp(-pow((radius - expandingRadius) * 34., 2.));
        float elastic = sin((radius - expandingRadius) * 96.) * exp(-radius * 8.5);
        float displacement = (front * .76 + elastic * .24) * .058 * decay;
        vec2 offset = direction * displacement;
        float spectral = front * decay * .0052;

        vec2 redUv = clamp(uv + offset * 1.12 + direction * spectral, 0., 1.);
        vec2 greenUv = clamp(uv + offset, 0., 1.);
        vec2 blueUv = clamp(uv + offset * .88 - direction * spectral, 0., 1.);
        vec3 color = vec3(
          texture2D(source, redUv).r,
          texture2D(source, greenUv).g,
          texture2D(source, blueUv).b
        );

        float highlight = front * decay * .24;
        color += vec3(.72, .9, .94) * highlight;
        color = mix(color, color * vec3(.94, .99, .97), .08);
        gl_FragColor = vec4(color, 1.);
      }
    `,
    attributes: { position: [[-1, -1], [3, -1], [-1, 3]] },
    uniforms: {
      source: sourceTexture,
      origin: regl.prop('origin'),
      age: regl.prop('age'),
      aspect: regl.prop('aspect'),
      impulse: regl.prop('impulse')
    },
    count: 3,
    depth: { enable: false }
  });

  function resize() {
    const width = Math.round(innerWidth * dpr);
    const height = Math.round(innerHeight * dpr);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    regl.poll();
  }

  function normalizedPoint(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: clamp((clientX - bounds.left) / bounds.width, .03, .97),
      y: 1 - clamp((clientY - bounds.top) / bounds.height, .05, .95)
    };
  }

  function activate(nextOrigin, inputKind, eventTimestamp = performance.now()) {
    const distance = Math.hypot(
      nextOrigin.x - previousOrigin.x,
      nextOrigin.y - previousOrigin.y
    );
    const elapsedInput = Math.max(16, eventTimestamp - previousInputTime);
    const velocity = distance / elapsedInput * 1000;

    interaction.origin = nextOrigin;
    interaction.eventTime = controllerTime;
    interaction.inputCount += 1;
    interaction.inputKind = inputKind;
    interaction.strength = clamp(.6 + velocity * .17, .6, 1);
    interaction.engaged = true;
    interaction.mode = 'active';
    previousOrigin = { ...nextOrigin };
    previousInputTime = eventTimestamp;
    stage.dataset.phase = 'active';
  }

  function resetInteraction() {
    interaction.engaged = false;
    interaction.mode = 'idle';
    interaction.strength = 0;
    stage.dataset.phase = 'idle';
    status.textContent = 'Still water / ready';
  }

  canvas.addEventListener('pointerdown', event => {
    canvas.setPointerCapture?.(event.pointerId);
    activate(normalizedPoint(event.clientX, event.clientY), event.pointerType || 'pointer', event.timeStamp);
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' && event.buttons === 0) return;
    activate(normalizedPoint(event.clientX, event.clientY), event.pointerType || 'pointer', event.timeStamp);
  });
  canvas.addEventListener('pointerup', event => {
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  });
  canvas.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') resetInteraction();
  });
  canvas.addEventListener('pointercancel', resetInteraction);
  canvas.addEventListener('blur', resetInteraction);
  canvas.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft: [-.055, 0],
      ArrowRight: [.055, 0],
      ArrowUp: [0, .055],
      ArrowDown: [0, -.055]
    }[event.key];
    if (!movement) {
      if (event.key === 'Escape') resetInteraction();
      return;
    }
    event.preventDefault();
    const nextOrigin = {
      x: clamp(interaction.origin.x + movement[0], .03, .97),
      y: clamp(interaction.origin.y + movement[1], .05, .95)
    };
    activate(nextOrigin, 'keyboard', event.timeStamp);
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () =>
    typeof draw === 'function'
    && textureReady
    && sourceImage.complete
    && sourceImage.naturalWidth === 1280
    && sourceImage.naturalHeight === 720
    && typeof sourceTexture.destroy === 'function'
    && !regl._gl.isContextLost()
    && draws > 0
    && window.__PREVIEW_INTERACTION_STATE__ === interaction
    && interaction.automaticPath === false
    && ['idle', 'active', 'settling'].includes(interaction.mode)
    && typeof interaction.engaged === 'boolean'
    && Number.isFinite(interaction.origin.x)
    && Number.isFinite(interaction.origin.y)
    && interaction.origin.x >= .03
    && interaction.origin.x <= .97
    && interaction.origin.y >= .05
    && interaction.origin.y <= .95
    && Number.isInteger(interaction.inputCount)
    && interaction.inputCount >= 0
    && (interaction.mode === 'idle'
      ? interaction.engaged === false && interaction.strength === 0
      : interaction.engaged === true && interaction.strength > 0);

  installPreviewController({
    id: 'pointer-following-displacement-ripple',
    library: 'regl@2.1.1',
    renderer: 'webgl',
    render: time => {
      controllerTime = Number(time) || 0;
      resize();

      let age = 0;
      let impulse = 0;
      if (interaction.engaged) {
        age = Math.max(0, controllerTime - interaction.eventTime);
        impulse = interaction.strength;
        if (age > .22) interaction.mode = 'settling';
        if (age > 1.65) resetInteraction();
      }

      regl.clear({ color: [.08, .13, .12, 1] });
      draw({
        origin: [interaction.origin.x, interaction.origin.y],
        age,
        impulse,
        aspect: innerWidth / innerHeight
      });
      draws += 1;

      ring.style.left = `${interaction.origin.x * 100}%`;
      ring.style.top = `${(1 - interaction.origin.y) * 100}%`;
      stage.dataset.phase = interaction.mode;
      status.textContent = interaction.mode === 'active'
        ? `${interaction.inputKind} / refracting`
        : interaction.mode === 'settling'
          ? 'Elastic recovery / settling'
          : 'Still water / ready';
    },
    ready: Promise.all([document.fonts.ready, imageReady]).catch(error => {
      markPreviewFailure(error);
      throw error;
    })
  });

  window.addEventListener('beforeunload', () => {
    sourceTexture.destroy();
    regl.destroy();
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
