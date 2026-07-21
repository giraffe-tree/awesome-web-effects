import createREGL from 'regl';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const GEL_LIBRARY = {
  cyan: { label: 'CYAN', color: [0.05, 0.8, 0.94], css: '#31dff3' },
  magenta: { label: 'ROSE', color: [0.95, 0.08, 0.5], css: '#ef3b9b' },
  amber: { label: 'AMBER', color: [1, 0.42, 0.04], css: '#ff9b32' }
};

try {
  const canvas = document.querySelector('#fluid-canvas');
  const stage = document.querySelector('.preview-stage');
  const reticle = document.querySelector('#inject-reticle');
  const pauseControl = document.querySelector('#pause-control');
  const clearControl = document.querySelector('#clear-control');
  const saveControl = document.querySelector('#save-control');
  const statePill = document.querySelector('#state-pill');
  const mixOutput = document.querySelector('#mix-output');
  const modeOutput = document.querySelector('#mode-output');
  const gelControls = [...document.querySelectorAll('[data-gel]')];
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const regl = createREGL({
    canvas,
    pixelRatio,
    attributes: { antialias: false, alpha: false, preserveDrawingBuffer: true }
  });

  const state = {
    task: 'stage-haze-colour-mix-review',
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'control'],
    automaticPath: false,
    automaticInjection: false,
    previewClockDriven: false,
    syntheticEvents: false,
    userInputRequired: true,
    initialFrameStatic: true,
    selectedGel: 'cyan',
    paused: false,
    saved: false,
    pointerDown: false,
    pointerId: null,
    pointer: [0.5, 0.45],
    pointerClient: [0, 0],
    keyboardPointer: [0.5, 0.45],
    lastPointerAt: 0,
    pendingSplats: [],
    injections: 0,
    gelWeights: { cyan: 0, magenta: 0, amber: 0 },
    activeFrames: 0,
    drawCount: 0,
    simulationSteps: 0,
    framebufferPasses: 0,
    displayDirty: true,
    initialChecksum: null,
    initialChecksumStable: false,
    simulationSize: [0, 0],
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    pointerMoveInjectionCount: 0,
    keyboardInjectionCount: 0,
    gelSelectionCount: 0,
    pauseToggleCount: 0,
    clearCount: 0,
    saveCount: 0,
    totalInjections: 0,
    maxInjections: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false
  };

  const vertexShader = `
    precision highp float;
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = position * .5 + .5;
      gl_Position = vec4(position, 0., 1.);
    }
  `;
  const position = [[-1, -1], [3, -1], [-1, 3]];
  const passBase = {
    vert: vertexShader,
    attributes: { position },
    count: 3,
    depth: { enable: false },
    framebuffer: regl.prop('destination')
  };

  const advectVelocity = regl({
    ...passBase,
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D source;
      uniform vec2 texel;
      uniform float timestep;
      vec2 decode(vec2 value) { return value * 2. - 1.; }
      void main() {
        vec2 velocity = decode(texture2D(source, uv).rg);
        vec2 previous = clamp(uv - velocity * timestep, texel, 1. - texel);
        vec2 advected = decode(texture2D(source, previous).rg) * .985;
        gl_FragColor = vec4(advected * .5 + .5, 0., 1.);
      }
    `,
    uniforms: {
      source: regl.prop('source'),
      texel: regl.prop('texel'),
      timestep: regl.prop('timestep')
    }
  });

  const advectDye = regl({
    ...passBase,
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D source;
      uniform sampler2D velocity;
      uniform vec2 texel;
      uniform float timestep;
      void main() {
        vec2 flow = texture2D(velocity, uv).rg * 2. - 1.;
        vec2 previous = clamp(uv - flow * timestep, texel, 1. - texel);
        vec4 dye = texture2D(source, previous);
        gl_FragColor = vec4(dye.rgb * .9985, dye.a * .997);
      }
    `,
    uniforms: {
      source: regl.prop('source'),
      velocity: regl.prop('velocity'),
      texel: regl.prop('texel'),
      timestep: regl.prop('timestep')
    }
  });

  const injectVelocity = regl({
    ...passBase,
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D source;
      uniform vec2 point;
      uniform vec2 impulse;
      uniform float radius;
      uniform float aspect;
      void main() {
        vec2 delta = uv - point;
        delta.x *= aspect;
        float influence = exp(-dot(delta, delta) / max(radius * radius, .00001));
        vec2 velocity = texture2D(source, uv).rg * 2. - 1.;
        velocity = clamp(velocity + impulse * influence, -1., 1.);
        gl_FragColor = vec4(velocity * .5 + .5, 0., 1.);
      }
    `,
    uniforms: {
      source: regl.prop('source'),
      point: regl.prop('point'),
      impulse: regl.prop('impulse'),
      radius: regl.prop('radius'),
      aspect: regl.prop('aspect')
    }
  });

  const injectDye = regl({
    ...passBase,
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D source;
      uniform vec2 point;
      uniform vec3 color;
      uniform float radius;
      uniform float strength;
      uniform float aspect;
      void main() {
        vec2 delta = uv - point;
        delta.x *= aspect;
        float influence = exp(-dot(delta, delta) / max(radius * radius, .00001)) * strength;
        vec4 base = texture2D(source, uv);
        vec3 mixed = 1. - (1. - base.rgb) * (1. - color * influence);
        gl_FragColor = vec4(clamp(mixed, 0., 1.), clamp(base.a + influence * .7, 0., 1.));
      }
    `,
    uniforms: {
      source: regl.prop('source'),
      point: regl.prop('point'),
      color: regl.prop('color'),
      radius: regl.prop('radius'),
      strength: regl.prop('strength'),
      aspect: regl.prop('aspect')
    }
  });

  const computeDivergence = regl({
    ...passBase,
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D velocity;
      uniform vec2 texel;
      vec2 flow(vec2 offset) { return texture2D(velocity, clamp(uv + offset, texel, 1. - texel)).rg * 2. - 1.; }
      void main() {
        float left = flow(vec2(-texel.x, 0.)).x;
        float right = flow(vec2(texel.x, 0.)).x;
        float bottom = flow(vec2(0., -texel.y)).y;
        float top = flow(vec2(0., texel.y)).y;
        float divergence = clamp((right - left + top - bottom) * .5, -1., 1.);
        gl_FragColor = vec4(divergence * .5 + .5, 0., 0., 1.);
      }
    `,
    uniforms: { velocity: regl.prop('velocity'), texel: regl.prop('texel') }
  });

  const solvePressure = regl({
    ...passBase,
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D pressure;
      uniform sampler2D divergence;
      uniform vec2 texel;
      float scalar(vec2 offset) { return texture2D(pressure, clamp(uv + offset, texel, 1. - texel)).r * 2. - 1.; }
      void main() {
        float left = scalar(vec2(-texel.x, 0.));
        float right = scalar(vec2(texel.x, 0.));
        float bottom = scalar(vec2(0., -texel.y));
        float top = scalar(vec2(0., texel.y));
        float div = texture2D(divergence, uv).r * 2. - 1.;
        float nextPressure = clamp((left + right + bottom + top - div) * .25, -1., 1.);
        gl_FragColor = vec4(nextPressure * .5 + .5, 0., 0., 1.);
      }
    `,
    uniforms: {
      pressure: regl.prop('pressure'),
      divergence: regl.prop('divergence'),
      texel: regl.prop('texel')
    }
  });

  const subtractPressure = regl({
    ...passBase,
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D velocity;
      uniform sampler2D pressure;
      uniform vec2 texel;
      float scalar(vec2 offset) { return texture2D(pressure, clamp(uv + offset, texel, 1. - texel)).r * 2. - 1.; }
      void main() {
        float left = scalar(vec2(-texel.x, 0.));
        float right = scalar(vec2(texel.x, 0.));
        float bottom = scalar(vec2(0., -texel.y));
        float top = scalar(vec2(0., texel.y));
        vec2 velocityValue = texture2D(velocity, uv).rg * 2. - 1.;
        velocityValue -= vec2(right - left, top - bottom) * .55;
        gl_FragColor = vec4(clamp(velocityValue, -1., 1.) * .5 + .5, 0., 1.);
      }
    `,
    uniforms: {
      velocity: regl.prop('velocity'),
      pressure: regl.prop('pressure'),
      texel: regl.prop('texel')
    }
  });

  const drawDisplay = regl({
    vert: vertexShader,
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D dye;
      uniform sampler2D velocity;
      uniform float aspect;
      float line(float value, float width) { return 1. - smoothstep(0., width, abs(value)); }
      void main() {
        vec2 p = uv - .5;
        p.x *= aspect;
        vec4 pigment = texture2D(dye, uv);
        vec2 flow = texture2D(velocity, uv).rg * 2. - 1.;
        float radial = length(p * vec2(.82, 1.1));
        vec3 background = mix(vec3(.012, .02, .021), vec3(.003, .006, .008), smoothstep(.08, .72, radial));
        float stageLine = line(p.y + .33, .002) * smoothstep(.72, .18, abs(p.x));
        float centreLine = line(p.x, .0012) * smoothstep(.48, .1, abs(p.y + .16));
        float ring = line(length(vec2(p.x, p.y + .33)) - .19, .0016);
        background += vec3(.11, .16, .16) * (stageLine + centreLine + ring) * .22;
        float density = smoothstep(.008, .9, pigment.a);
        vec3 haze = pow(max(pigment.rgb, 0.), vec3(.74));
        float sheen = dot(normalize(vec3(flow * 1.6, 1.)), normalize(vec3(-.4, .6, 1.))) * .5 + .5;
        vec3 color = background + haze * (1.28 + sheen * .34) * density;
        color += vec3(.04, .06, .06) * density * (1. - pigment.a);
        color *= .88 + .12 * smoothstep(.9, .1, radial);
        gl_FragColor = vec4(pow(max(color, 0.), vec3(.86)), 1.);
      }
    `,
    attributes: { position },
    uniforms: {
      dye: regl.prop('dye'),
      velocity: regl.prop('velocity'),
      aspect: regl.prop('aspect')
    },
    count: 3,
    depth: { enable: false }
  });

  let targets = null;

  function createTarget(width, height, neutral = false) {
    const texture = regl.texture({
      width,
      height,
      format: 'rgba',
      type: 'uint8',
      min: 'linear',
      mag: 'linear',
      wrap: 'clamp'
    });
    const framebuffer = regl.framebuffer({ color: texture, depthStencil: false });
    regl.clear({ framebuffer, color: neutral ? [.5, .5, 0, 1] : [0, 0, 0, 0] });
    return { texture, framebuffer };
  }

  function createPair(width, height, neutral = false) {
    const pair = {
      read: createTarget(width, height, neutral),
      write: createTarget(width, height, neutral),
      swap() { [this.read, this.write] = [this.write, this.read]; }
    };
    return pair;
  }

  function destroyTargets() {
    if (!targets) return;
    const all = [
      targets.velocity.read, targets.velocity.write,
      targets.dye.read, targets.dye.write,
      targets.pressure.read, targets.pressure.write,
      targets.divergence
    ];
    all.forEach(target => {
      target.framebuffer.destroy();
      target.texture.destroy();
    });
  }

  function rebuildTargets() {
    const aspect = Math.max(0.4, innerWidth / Math.max(innerHeight, 1));
    const width = Math.max(88, Math.min(256, Math.round(innerWidth * 0.52)));
    const height = Math.max(50, Math.round(width / aspect));
    if (targets && targets.width === width && targets.height === height) return;
    destroyTargets();
    targets = {
      width,
      height,
      texel: [1 / width, 1 / height],
      velocity: createPair(width, height, true),
      dye: createPair(width, height, false),
      pressure: createPair(width, height, true),
      divergence: createTarget(width, height, true)
    };
    state.simulationSize = [width, height];
    state.pendingSplats.length = 0;
    state.activeFrames = 0;
    state.displayDirty = true;
  }

  function resize() {
    const width = Math.max(1, Math.round(innerWidth * pixelRatio));
    const height = Math.max(1, Math.round(innerHeight * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      regl.poll();
      rebuildTargets();
    } else if (!targets) {
      rebuildTargets();
    }
  }

  function runPass(command, props) {
    command(props);
    state.framebufferPasses += 1;
  }

  function applySplat(splat) {
    const aspect = innerWidth / Math.max(innerHeight, 1);
    const gel = GEL_LIBRARY[splat.gel];
    runPass(injectVelocity, {
      destination: targets.velocity.write.framebuffer,
      source: targets.velocity.read.texture,
      point: splat.point,
      impulse: splat.impulse,
      radius: splat.radius,
      aspect
    });
    targets.velocity.swap();
    runPass(injectDye, {
      destination: targets.dye.write.framebuffer,
      source: targets.dye.read.texture,
      point: splat.point,
      color: gel.color,
      radius: splat.radius * 1.22,
      strength: splat.strength,
      aspect
    });
    targets.dye.swap();
  }

  function simulate() {
    const timestep = reducedMotion.matches ? 0.025 : 0.045;
    const queued = state.pendingSplats.splice(0);
    queued.forEach(applySplat);

    runPass(advectVelocity, {
      destination: targets.velocity.write.framebuffer,
      source: targets.velocity.read.texture,
      texel: targets.texel,
      timestep
    });
    targets.velocity.swap();

    runPass(computeDivergence, {
      destination: targets.divergence.framebuffer,
      velocity: targets.velocity.read.texture,
      texel: targets.texel
    });
    regl.clear({ framebuffer: targets.pressure.read.framebuffer, color: [.5, .5, 0, 1] });
    for (let iteration = 0; iteration < 9; iteration += 1) {
      runPass(solvePressure, {
        destination: targets.pressure.write.framebuffer,
        pressure: targets.pressure.read.texture,
        divergence: targets.divergence.texture,
        texel: targets.texel
      });
      targets.pressure.swap();
    }
    runPass(subtractPressure, {
      destination: targets.velocity.write.framebuffer,
      velocity: targets.velocity.read.texture,
      pressure: targets.pressure.read.texture,
      texel: targets.texel
    });
    targets.velocity.swap();

    runPass(advectDye, {
      destination: targets.dye.write.framebuffer,
      source: targets.dye.read.texture,
      velocity: targets.velocity.read.texture,
      texel: targets.texel,
      timestep
    });
    targets.dye.swap();
    state.simulationSteps += 1;
    state.displayDirty = true;
  }

  function draw() {
    regl.clear({ color: [.003, .006, .008, 1] });
    drawDisplay({
      dye: targets.dye.read.texture,
      velocity: targets.velocity.read.texture,
      aspect: innerWidth / Math.max(innerHeight, 1)
    });
    state.drawCount += 1;
    state.displayDirty = false;
  }

  function updateResult() {
    if (state.injections === 0) {
      mixOutput.textContent = 'No haze yet';
      modeOutput.textContent = reducedMotion.matches ? 'Direct motion' : 'Live advection';
      return;
    }
    const ordered = Object.entries(state.gelWeights).sort((a, b) => b[1] - a[1]);
    const total = ordered.reduce((sum, [, weight]) => sum + weight, 0) || 1;
    const primary = GEL_LIBRARY[ordered[0][0]].label;
    const secondary = GEL_LIBRARY[ordered[1][0]].label;
    const percentage = Math.round(ordered[0][1] / total * 100);
    mixOutput.textContent = percentage < 68 ? `${primary} / ${secondary}` : `${primary} ${percentage}%`;
    modeOutput.textContent = state.saved ? 'Look 03 saved' : reducedMotion.matches ? 'Direct motion' : 'Live advection';
  }

  function setActivity(label, activity) {
    statePill.textContent = label;
    statePill.dataset.state = activity;
    stage.dataset.inputState = activity;
  }

  function recordInput(event, kind, source, pointerType = null) {
    if (!event || event.isTrusted !== true) return false;
    state.inputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'pointer') {
      const resolvedPointerType = pointerType || event.pointerType || 'mouse';
      state.pointerInputCount += 1;
      if (resolvedPointerType === 'touch') state.touchInputCount += 1;
      if (resolvedPointerType === 'pen') state.penInputCount += 1;
    } else if (kind === 'keyboard') {
      state.keyboardInputCount += 1;
    } else {
      state.controlInputCount += 1;
    }
    return true;
  }

  function selectGel(name) {
    if (!GEL_LIBRARY[name]) return;
    state.selectedGel = name;
    gelControls.forEach(control => control.setAttribute('aria-pressed', String(control.dataset.gel === name)));
    reticle.style.setProperty('--reticle-color', GEL_LIBRARY[name].css);
    if (!state.pointerDown && !state.saved) setActivity(`${GEL_LIBRARY[name].label} selected · drag to inject`, 'idle');
  }

  function queueInjection(point, impulse, pressure = 0.5) {
    if (state.paused || state.saved) return;
    const force = Math.max(0.12, Math.min(1, Math.hypot(impulse[0], impulse[1]) * 3.2));
    const radius = 0.042 + Math.max(0, Math.min(1, pressure)) * 0.023;
    state.pendingSplats.push({
      point: [...point],
      impulse: [impulse[0] * 0.84, impulse[1] * 0.84],
      radius,
      strength: 0.46 + force * 0.5,
      gel: state.selectedGel
    });
    state.injections += 1;
    state.totalInjections += 1;
    state.maxInjections = Math.max(state.maxInjections, state.injections);
    state.gelWeights[state.selectedGel] += 0.35 + force;
    state.activeFrames = reducedMotion.matches ? 1 : 150;
    state.displayDirty = true;
    saveControl.disabled = false;
    updateResult();
    setActivity(`${GEL_LIBRARY[state.selectedGel].label} mixing · ${Math.round(force * 100)}% current`, 'mixing');
  }

  function pointFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    return [
      Math.max(0.02, Math.min(0.98, (event.clientX - bounds.left) / bounds.width)),
      1 - Math.max(0.02, Math.min(0.98, (event.clientY - bounds.top) / bounds.height))
    ];
  }

  function placeReticle(point, injecting = false) {
    reticle.style.left = `${point[0] * 100}%`;
    reticle.style.top = `${(1 - point[1]) * 100}%`;
    reticle.dataset.visible = 'true';
    reticle.dataset.injecting = String(injecting);
  }

  function beginPointer(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const pointerType = event.pointerType || 'mouse';
    if (!recordInput(event, 'pointer', `${pointerType}-inject-start`, pointerType)) return;
    state.pointerDown = true;
    state.pointerId = event.pointerId;
    state.pointer = pointFromEvent(event);
    state.pointerClient = [event.clientX, event.clientY];
    state.lastPointerAt = event.timeStamp;
    canvas.setPointerCapture?.(event.pointerId);
    state.pointerCaptureCount += 1;
    placeReticle(state.pointer, true);
    queueInjection(state.pointer, [0, 0], event.pressure || 0.5);
  }

  function movePointer(event) {
    const next = pointFromEvent(event);
    placeReticle(next, state.pointerDown);
    if (!state.pointerDown || event.pointerId !== state.pointerId) {
      state.pointer = next;
      return;
    }
    const pointerType = event.pointerType || 'mouse';
    if (!recordInput(event, 'pointer', `${pointerType}-inject-move`, pointerType)) return;
    state.pointerMoveInjectionCount += 1;
    const elapsed = Math.max(8, event.timeStamp - state.lastPointerAt);
    const raw = [(next[0] - state.pointer[0]) / elapsed * 16, (next[1] - state.pointer[1]) / elapsed * 16];
    const length = Math.hypot(raw[0], raw[1]);
    const scale = length > 0.42 ? 0.42 / length : 1;
    queueInjection(next, [raw[0] * scale, raw[1] * scale], event.pressure || 0.5);
    state.pointer = next;
    state.pointerClient = [event.clientX, event.clientY];
    state.lastPointerAt = event.timeStamp;
  }

  function endPointer(event) {
    if (event.pointerId !== state.pointerId) return;
    const pointerType = event.pointerType || 'mouse';
    if (!recordInput(event, 'pointer', `${pointerType}-inject-release`, pointerType)) return;
    state.pointerDown = false;
    state.pointerId = null;
    reticle.dataset.injecting = 'false';
    canvas.releasePointerCapture?.(event.pointerId);
    state.pointerReleaseCount += 1;
    if (!state.paused && !state.saved) setActivity(reducedMotion.matches ? 'Injected · direct frame held' : 'Current dissipating · drag to add', 'settling');
  }

  function clearField() {
    const neutral = [targets.velocity.read, targets.velocity.write, targets.pressure.read, targets.pressure.write, targets.divergence];
    neutral.forEach(target => regl.clear({ framebuffer: target.framebuffer, color: [.5, .5, 0, 1] }));
    [targets.dye.read, targets.dye.write].forEach(target => regl.clear({ framebuffer: target.framebuffer, color: [0, 0, 0, 0] }));
    state.pendingSplats.length = 0;
    state.injections = 0;
    state.gelWeights = { cyan: 0, magenta: 0, amber: 0 };
    state.activeFrames = 0;
    state.saved = false;
    state.paused = false;
    state.clearCount += 1;
    state.displayDirty = true;
    pauseControl.textContent = 'Pause';
    pauseControl.setAttribute('aria-pressed', 'false');
    saveControl.disabled = true;
    setActivity('Ready · drag to inject', 'idle');
    updateResult();
  }

  function togglePause() {
    if (state.saved) return;
    state.paused = !state.paused;
    state.pauseToggleCount += 1;
    pauseControl.textContent = state.paused ? 'Resume' : 'Pause';
    pauseControl.setAttribute('aria-pressed', String(state.paused));
    setActivity(state.paused ? 'Paused · evaluating blend' : state.injections ? 'Current resumed' : 'Ready · drag to inject', state.paused ? 'paused' : 'idle');
    if (!state.paused && state.injections && !reducedMotion.matches) state.activeFrames = Math.max(state.activeFrames, 70);
  }

  function saveLook() {
    if (!state.injections) return;
    state.saved = true;
    state.saveCount += 1;
    state.paused = true;
    state.activeFrames = 0;
    pauseControl.textContent = 'Saved';
    pauseControl.setAttribute('aria-pressed', 'true');
    setActivity('Look 03 saved · clear to restart', 'saved');
    updateResult();
  }

  canvas.addEventListener('pointerdown', beginPointer);
  canvas.addEventListener('pointermove', movePointer);
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', event => {
    if (!state.pointerDown || event.pointerId !== state.pointerId) reticle.dataset.visible = 'false';
  });
  canvas.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft: [-0.045, 0], ArrowRight: [0.045, 0], ArrowUp: [0, 0.045], ArrowDown: [0, -0.045]
    }[event.key];
    if (movement) {
      event.preventDefault();
      if (!recordInput(event, 'keyboard', `keyboard-${event.key}`)) return;
      state.keyboardPointer[0] = Math.max(0.04, Math.min(0.96, state.keyboardPointer[0] + movement[0]));
      state.keyboardPointer[1] = Math.max(0.04, Math.min(0.96, state.keyboardPointer[1] + movement[1]));
      state.pointer = [...state.keyboardPointer];
      placeReticle(state.pointer, false);
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!recordInput(event, 'keyboard', `keyboard-${event.key === ' ' ? 'Space' : 'Enter'}`)) return;
      state.keyboardInjectionCount += 1;
      placeReticle(state.keyboardPointer, true);
      queueInjection(state.keyboardPointer, [0.025, 0.012], 0.55);
      requestAnimationFrame(() => { reticle.dataset.injecting = 'false'; });
    } else if (/^[123]$/.test(event.key)) {
      if (!recordInput(event, 'keyboard', `keyboard-gel-${event.key}`)) return;
      state.gelSelectionCount += 1;
      selectGel(['cyan', 'magenta', 'amber'][Number(event.key) - 1]);
    } else if (event.key.toLowerCase() === 'p') {
      if (!recordInput(event, 'keyboard', 'keyboard-pause')) return;
      togglePause();
    } else if (event.key.toLowerCase() === 'c') {
      if (!recordInput(event, 'keyboard', 'keyboard-clear')) return;
      clearField();
    } else if (event.key.toLowerCase() === 's') {
      if (!recordInput(event, 'keyboard', 'keyboard-save')) return;
      saveLook();
    }
  });
  gelControls.forEach(control => control.addEventListener('click', event => {
    if (!recordInput(event, 'control', `control-gel-${control.dataset.gel}`)) return;
    state.gelSelectionCount += 1;
    selectGel(control.dataset.gel);
  }));
  pauseControl.addEventListener('click', event => {
    if (!recordInput(event, 'control', 'control-pause')) return;
    togglePause();
  });
  clearControl.addEventListener('click', event => {
    if (!recordInput(event, 'control', 'control-clear')) return;
    clearField();
  });
  saveControl.addEventListener('click', event => {
    if (!recordInput(event, 'control', 'control-save')) return;
    saveLook();
  });
  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) state.activeFrames = Math.min(state.activeFrames, 1);
    updateResult();
  });

  function render() {
    resize();
    const hasInput = state.pendingSplats.length > 0;
    const shouldSimulate = !state.paused && !state.saved && (hasInput || state.activeFrames > 0);
    if (shouldSimulate) {
      simulate();
      state.activeFrames = Math.max(0, state.activeFrames - 1);
    }
    if (state.displayDirty) draw();
  }

  function checksumCanvas() {
    const sampleWidth = Math.min(24, canvas.width);
    const sampleHeight = Math.min(24, canvas.height);
    const pixels = regl.read({ x: 0, y: 0, width: sampleWidth, height: sampleHeight });
    let checksum = 2166136261;
    for (let index = 0; index < pixels.length; index += 7) {
      checksum ^= pixels[index];
      checksum = Math.imul(checksum, 16777619);
    }
    return checksum >>> 0;
  }

  window.__FLUID_INTERACTION_STATE__ = state;
  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvasBounds = canvas.getBoundingClientRect();
    return (
      typeof regl === 'function'
      && Boolean(regl._gl)
      && !regl._gl.isContextLost()
      && Boolean(targets?.velocity?.read?.framebuffer)
      && Boolean(targets?.dye?.read?.framebuffer)
      && Boolean(targets?.pressure?.read?.framebuffer)
      && Boolean(targets?.divergence?.framebuffer)
      && state.simulationSize[0] >= 88
      && state.simulationSize[1] >= 50
      && state.drawCount > 0
      && state.initialChecksumStable
      && state.task === 'stage-haze-colour-mix-review'
      && state.acceptedInputs.join(',') === 'mouse,touch,pen,keyboard,control'
      && state.automaticPath === false
      && state.automaticInjection === false
      && state.previewClockDriven === false
      && state.syntheticEvents === false
      && state.userInputRequired === true
      && state.initialFrameStatic === true
      && stage.dataset.previewMechanism === 'regl-framebuffer-fluid'
      && canvasBounds.width >= innerWidth - 1
      && canvasBounds.height >= innerHeight - 1
      && canvas.width >= Math.round(innerWidth * pixelRatio) - 1
      && canvas.height >= Math.round(innerHeight * pixelRatio) - 1
      && GEL_LIBRARY[state.selectedGel]
      && gelControls.length === 3
      && pauseControl instanceof HTMLButtonElement
      && clearControl instanceof HTMLButtonElement
      && saveControl instanceof HTMLButtonElement
      && state.pendingSplats.length === 0
      && state.injections === 0
      && state.activeFrames === 0
      && state.pointerCaptureCount >= state.pointerReleaseCount
      && state.pointerInputCount + state.keyboardInputCount + state.controlInputCount === state.inputCount
      && state.touchInputCount + state.penInputCount <= state.pointerInputCount
      && window.__FLUID_INTERACTION_STATE__ === state
    );
  };

  const ready = (async () => {
    resize();
    draw();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const firstChecksum = checksumCanvas();
    draw();
    await new Promise(resolve => requestAnimationFrame(resolve));
    const secondChecksum = checksumCanvas();
    state.initialChecksum = firstChecksum;
    state.initialChecksumStable = firstChecksum === secondChecksum;
    if (!window.__PREVIEW_RUNTIME_ASSERT__()) throw new Error('GPU fluid runtime contract failed');
  })();

  installPreviewController({
    id: 'pointer-injected-gpu-fluid',
    library: 'regl@2.1.1',
    renderer: 'webgl',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
