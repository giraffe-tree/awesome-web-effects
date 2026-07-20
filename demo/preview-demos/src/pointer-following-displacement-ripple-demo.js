import createREGL from 'regl';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-b-utils.js';

try {
  const stage = document.querySelector('#ripple-stage');
  const canvas = document.querySelector('#ripple-canvas');
  const ring = document.querySelector('#probe-ring');
  const ringLabel = document.querySelector('#probe-label');
  const status = document.querySelector('#ripple-status');
  const sampleOutput = document.querySelector('#sample-output');
  const deviationOutput = document.querySelector('#deviation-output');
  const sampleControls = [...document.querySelectorAll('.sample-control')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
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
    data: [23, 37, 34, 255],
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

  const samples = {
    facade: { x: .31, y: .59, label: 'Facade mullions' },
    pool: { x: .61, y: .27, label: 'Pool tile grid' },
    horizon: { x: .79, y: .55, label: 'Ocean horizon' }
  };

  const interaction = {
    id: 'pointer-following-displacement-ripple',
    task: 'architectural-straight-line-refraction-qa',
    automaticFallback: false,
    automaticPath: false,
    automaticPlayback: false,
    captureClockDriven: false,
    syntheticInputDispatch: false,
    userInputRequired: true,
    inputDrivenRecovery: true,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'sample-control'],
    initialFrameStatic: true,
    initialOrigin: { x: .56, y: .48 },
    initialInputCount: 0,
    engaged: false,
    mode: 'idle',
    phase: 'idle',
    origin: { x: .56, y: .48 },
    strength: 0,
    currentAge: 0,
    inputStartedAt: null,
    inputCount: 0,
    activationCount: 0,
    resetInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    touchInputCount: 0,
    pointerActivationCount: 0,
    keyboardActivationCount: 0,
    presetActivationCount: 0,
    recoveryCompletionCount: 0,
    impulseRequestId: 0,
    activeImpulseRequestId: null,
    pointerCaptured: false,
    activePointerId: null,
    inputKind: 'none',
    lastInputSource: 'initial',
    lastInputTrusted: null,
    selectedSample: 'none',
    previousSample: 'none',
    pointerVelocity: 0,
    estimatedPeakDisplacementPx: 0,
    estimatedCurrentDisplacementPx: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionHold: reducedMotionQuery.matches,
    preferenceChangeCount: 0,
    sourceTextureReady: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    shaderDisplacementScale: .058,
    shaderFrontFrequency: 34,
    shaderElasticFrequency: 96,
    drawCount: 0,
    resizeCount: 0,
    renderCount: 0,
    previewClockMutationCount: 0,
    renderIgnoresPreviewClock: true
  };
  window.__PREVIEW_INTERACTION_STATE__ = interaction;

  let previousInputTime = 0;
  let previousOrigin = { ...interaction.origin };
  let activePointerId = null;
  let latestPointerKind = 'mouse';

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
    const width = Math.max(1, Math.round(stage.clientWidth * dpr));
    const height = Math.max(1, Math.round(stage.clientHeight * dpr));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    regl.poll();
    interaction.resizeCount += 1;
  }

  function normalizedPoint(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: clamp((clientX - bounds.left) / Math.max(1, bounds.width), .03, .97),
      y: 1 - clamp((clientY - bounds.top) / Math.max(1, bounds.height), .05, .95)
    };
  }

  function nearestSample(origin) {
    const [key, distance] = Object.entries(samples).reduce((best, [sampleKey, sample]) => {
      const nextDistance = Math.hypot(sample.x - origin.x, sample.y - origin.y);
      return nextDistance < best[1] ? [sampleKey, nextDistance] : best;
    }, ['none', Infinity]);
    return distance <= .028 ? key : 'pointer';
  }

  function recordInput(kind, source, trusted) {
    interaction.inputCount += 1;
    interaction.inputKind = kind;
    interaction.lastInputSource = source;
    interaction.lastInputTrusted = trusted;
    if (kind === 'keyboard') interaction.keyboardInputCount += 1;
    else {
      interaction.pointerInputCount += 1;
      if (kind === 'touch') interaction.touchInputCount += 1;
    }
  }

  function activate(nextOrigin, kind, source, trusted, operation, eventTimestamp = performance.now()) {
    if (trusted !== true) return;
    const now = performance.now();
    const distance = Math.hypot(nextOrigin.x - previousOrigin.x, nextOrigin.y - previousOrigin.y);
    const elapsedInput = Math.max(16, eventTimestamp - previousInputTime);
    const velocity = distance / elapsedInput * 1000;
    const strengthScale = interaction.reducedMotion ? .34 : 1;
    interaction.origin = {
      x: Number(clamp(nextOrigin.x, .03, .97).toFixed(5)),
      y: Number(clamp(nextOrigin.y, .05, .95).toFixed(5))
    };
    interaction.inputStartedAt = now;
    interaction.activationCount += 1;
    interaction.impulseRequestId += 1;
    interaction.activeImpulseRequestId = interaction.impulseRequestId;
    interaction.pointerVelocity = Number(velocity.toFixed(4));
    interaction.strength = Number((clamp(.64 + velocity * .16, .64, 1) * strengthScale).toFixed(5));
    interaction.currentAge = interaction.reducedMotion ? .18 : 0;
    interaction.engaged = true;
    interaction.mode = interaction.reducedMotion ? 'reduced-hold' : 'refracting';
    interaction.phase = interaction.mode;
    interaction.previousSample = interaction.selectedSample;
    interaction.selectedSample = operation === 'preset' ? source.replace('preset-', '') : nearestSample(interaction.origin);
    interaction.estimatedPeakDisplacementPx = Number((interaction.strength * interaction.shaderDisplacementScale * stage.clientWidth * .76).toFixed(2));
    if (operation === 'pointer') interaction.pointerActivationCount += 1;
    else if (operation === 'keyboard') interaction.keyboardActivationCount += 1;
    else if (operation === 'preset') interaction.presetActivationCount += 1;
    recordInput(kind, source, trusted);
    previousOrigin = { ...interaction.origin };
    previousInputTime = eventTimestamp;
    syncInterface();
    drawFrame();
  }

  function finishRecovery(countCompletion = true) {
    interaction.engaged = false;
    interaction.mode = 'idle';
    interaction.phase = 'idle';
    interaction.strength = 0;
    interaction.currentAge = 0;
    interaction.inputStartedAt = null;
    interaction.activeImpulseRequestId = null;
    interaction.estimatedCurrentDisplacementPx = 0;
    if (countCompletion) interaction.recoveryCompletionCount += 1;
    syncInterface();
  }

  function resetFromInput(kind, source, trusted) {
    if (trusted !== true) return;
    releasePointer();
    interaction.resetInputCount += 1;
    recordInput(kind, source, trusted);
    interaction.previousSample = interaction.selectedSample;
    interaction.selectedSample = 'none';
    finishRecovery(false);
    drawFrame();
  }

  function releasePointer(event) {
    if (activePointerId !== null && canvas.hasPointerCapture?.(activePointerId)) canvas.releasePointerCapture(activePointerId);
    if (!event || event.pointerId === activePointerId) activePointerId = null;
    interaction.pointerCaptured = false;
    interaction.activePointerId = null;
  }

  function syncInterface() {
    stage.dataset.phase = interaction.phase;
    stage.dataset.sample = interaction.selectedSample;
    stage.dataset.inputCount = String(interaction.inputCount);
    stage.dataset.lastSource = interaction.lastInputSource;
    stage.dataset.engaged = String(interaction.engaged);
    ring.style.left = `${interaction.origin.x * 100}%`;
    ring.style.top = `${(1 - interaction.origin.y) * 100}%`;
    const selected = samples[interaction.selectedSample];
    ringLabel.textContent = selected?.label || 'Pointer sample';
    sampleControls.forEach(control => {
      const active = control.dataset.sample === interaction.selectedSample;
      control.classList.toggle('is-active', active);
      if (control.dataset.sample !== 'reset') control.setAttribute('aria-pressed', String(active));
    });
    if (!interaction.engaged) {
      sampleOutput.textContent = 'Reference stable';
      deviationOutput.textContent = '0.0 px';
      status.textContent = 'Source texture · still';
      return;
    }
    sampleOutput.textContent = selected?.label || 'Pointer sample';
    deviationOutput.textContent = `${interaction.estimatedCurrentDisplacementPx.toFixed(1)} px`;
    status.textContent = interaction.mode === 'refracting'
      ? 'regl displacement · refracting'
      : interaction.mode === 'recovering'
        ? 'Input-derived recovery · settling'
        : 'Reduced motion · held sample';
  }

  function drawFrame() {
    resize();
    let age = 0;
    let impulse = 0;
    if (interaction.engaged) {
      if (interaction.reducedMotion) {
        age = .18;
        impulse = interaction.strength;
        interaction.mode = 'reduced-hold';
        interaction.phase = 'reduced-hold';
      } else {
        age = Math.max(0, (performance.now() - interaction.inputStartedAt) / 1000);
        impulse = interaction.strength;
        interaction.currentAge = Number(age.toFixed(4));
        interaction.mode = age > .22 ? 'recovering' : 'refracting';
        interaction.phase = interaction.mode;
        if (age > 1.65) {
          finishRecovery();
          age = 0;
          impulse = 0;
        }
      }
    }
    const decay = Math.exp(-age * 2.15) * impulse;
    interaction.estimatedCurrentDisplacementPx = Number((interaction.shaderDisplacementScale * decay * canvas.clientWidth * .76).toFixed(2));
    regl.clear({ color: [.09, .14, .12, 1] });
    draw({
      origin: [interaction.origin.x, interaction.origin.y],
      age,
      impulse,
      aspect: Math.max(1, canvas.clientWidth) / Math.max(1, canvas.clientHeight)
    });
    interaction.drawCount += 1;
    syncInterface();
    if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
      stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__());
    }
  }

  function inputKindFromClick(event) {
    return event.detail === 0 ? 'keyboard' : latestPointerKind;
  }

  canvas.addEventListener('pointerdown', event => {
    event.preventDefault();
    latestPointerKind = event.pointerType || 'mouse';
    canvas.focus({ preventScroll: true });
    activePointerId = event.pointerId;
    interaction.activePointerId = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);
    interaction.pointerCaptured = true;
    activate(normalizedPoint(event.clientX, event.clientY), latestPointerKind, 'pointer-drag', event.isTrusted, 'pointer', event.timeStamp);
  });

  canvas.addEventListener('pointermove', event => {
    latestPointerKind = event.pointerType || 'mouse';
    if (event.pointerType === 'touch' && !interaction.pointerCaptured) return;
    if (interaction.pointerCaptured && event.pointerId !== activePointerId) return;
    activate(normalizedPoint(event.clientX, event.clientY), latestPointerKind, interaction.pointerCaptured ? 'pointer-drag' : 'pointer-hover', event.isTrusted, 'pointer', event.timeStamp);
  });

  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', event => resetFromInput(event.pointerType || 'pointer', 'pointer-cancel-reset', event.isTrusted));
  canvas.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !interaction.pointerCaptured) resetFromInput('mouse', 'pointer-leave-reset', event.isTrusted);
  });

  canvas.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft: [-.055, 0],
      ArrowRight: [.055, 0],
      ArrowUp: [0, .055],
      ArrowDown: [0, -.055]
    }[event.key];
    const sampleKey = { f: 'facade', F: 'facade', p: 'pool', P: 'pool', h: 'horizon', H: 'horizon' }[event.key];
    if (!movement && !sampleKey && !['Enter', ' ', 'Escape', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat) return;
    if (['Escape', 'Home'].includes(event.key)) {
      resetFromInput('keyboard', `keyboard-${event.key}`, event.isTrusted);
      return;
    }
    if (sampleKey) {
      activate(samples[sampleKey], 'keyboard', `keyboard-${sampleKey}`, event.isTrusted, 'preset', event.timeStamp);
      return;
    }
    const nextOrigin = movement ? {
      x: clamp(interaction.origin.x + movement[0], .03, .97),
      y: clamp(interaction.origin.y + movement[1], .05, .95)
    } : interaction.origin;
    activate(nextOrigin, 'keyboard', movement ? `keyboard-${event.key}` : 'keyboard-pulse', event.isTrusted, 'keyboard', event.timeStamp);
  });

  sampleControls.forEach(control => {
    control.addEventListener('pointerdown', event => {
      latestPointerKind = event.pointerType || 'mouse';
    });
    control.addEventListener('click', event => {
      const kind = inputKindFromClick(event);
      if (control.dataset.sample === 'reset') {
        resetFromInput(kind, 'reset-control', event.isTrusted);
        return;
      }
      activate(samples[control.dataset.sample], kind, `preset-${control.dataset.sample}`, event.isTrusted, 'preset', event.timeStamp || performance.now());
    });
  });

  reducedMotionQuery.addEventListener('change', event => {
    interaction.reducedMotion = event.matches;
    interaction.reducedMotionHold = event.matches;
    interaction.preferenceChangeCount += 1;
    if (interaction.engaged) {
      interaction.inputStartedAt = performance.now();
      interaction.currentAge = event.matches ? .18 : 0;
    }
    drawFrame();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const bounds = canvas.getBoundingClientRect();
    const inputEvidence = interaction.inputCount === interaction.pointerInputCount + interaction.keyboardInputCount
      && interaction.inputCount === interaction.activationCount + interaction.resetInputCount
      && interaction.activationCount === interaction.pointerActivationCount + interaction.keyboardActivationCount + interaction.presetActivationCount;
    const textureEvidence = textureReady
      && interaction.sourceTextureReady
      && sourceImage.complete
      && sourceImage.naturalWidth === 1280
      && sourceImage.naturalHeight === 720
      && interaction.sourceNaturalWidth === sourceImage.naturalWidth
      && interaction.sourceNaturalHeight === sourceImage.naturalHeight
      && typeof sourceTexture.destroy === 'function';
    const activeEvidence = interaction.mode === 'idle'
      ? interaction.engaged === false
        && interaction.strength === 0
        && interaction.activeImpulseRequestId === null
      : interaction.engaged === true
        && interaction.strength > 0
        && interaction.activeImpulseRequestId === interaction.impulseRequestId
        && ['refracting', 'recovering', 'reduced-hold'].includes(interaction.mode);
    const initialEvidence = interaction.inputCount > 0 || (
      interaction.initialFrameStatic
      && interaction.origin.x === interaction.initialOrigin.x
      && interaction.origin.y === interaction.initialOrigin.y
      && interaction.initialInputCount === 0
      && interaction.mode === 'idle'
    );
    return typeof createREGL === 'function'
      && typeof draw === 'function'
      && !regl._gl.isContextLost()
      && stage.dataset.previewMechanism === 'regl-human-texture-displacement-inspection'
      && canvas.tabIndex === 0
      && bounds.width >= innerWidth * .99
      && bounds.height >= innerHeight * .99
      && canvas.width === Math.round(stage.clientWidth * dpr)
      && canvas.height === Math.round(stage.clientHeight * dpr)
      && sampleControls.length === 4
      && sampleControls.every(control => control instanceof HTMLButtonElement && control.type === 'button')
      && textureEvidence
      && inputEvidence
      && activeEvidence
      && initialEvidence
      && interaction.origin.x >= .03 && interaction.origin.x <= .97
      && interaction.origin.y >= .05 && interaction.origin.y <= .95
      && interaction.shaderDisplacementScale === .058
      && interaction.shaderFrontFrequency === 34
      && interaction.shaderElasticFrequency === 96
      && interaction.pointerCaptured === (activePointerId !== null)
      && interaction.activePointerId === activePointerId
      && interaction.automaticFallback === false
      && interaction.automaticPath === false
      && interaction.automaticPlayback === false
      && interaction.captureClockDriven === false
      && interaction.syntheticInputDispatch === false
      && interaction.userInputRequired === true
      && interaction.inputDrivenRecovery === true
      && interaction.previewClockMutationCount === 0
      && interaction.renderIgnoresPreviewClock === true
      && interaction.reducedMotionHold === interaction.reducedMotion
      && Number.isInteger(interaction.inputCount)
      && Number.isInteger(interaction.impulseRequestId)
      && interaction.drawCount > 0
      && interaction.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === interaction;
  };

  installPreviewController({
    id: 'pointer-following-displacement-ripple',
    library: 'regl@2.1.1',
    renderer: 'webgl',
    render: () => {
      interaction.renderCount += 1;
      interaction.sourceTextureReady = textureReady;
      interaction.sourceNaturalWidth = sourceImage.naturalWidth;
      interaction.sourceNaturalHeight = sourceImage.naturalHeight;
      drawFrame();
    },
    ready: Promise.all([document.fonts.ready, imageReady]).catch(error => {
      markPreviewFailure(error);
      throw error;
    })
  });

  addEventListener('beforeunload', () => {
    sourceTexture.destroy();
    regl.destroy();
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
