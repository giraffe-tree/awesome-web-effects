import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const vertexShader = `
precision highp float;
attribute vec3 aPosition;
void main() {
  gl_Position = vec4(aPosition, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform vec2 u_resolution;
uniform sampler2D u_environment;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_ior;
uniform float u_dispersion;
uniform float u_inspection;

mat2 rot(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float sdSphere(vec3 point, float radius) {
  return length(point) - radius;
}

float sdTorus(vec3 point, vec2 radii) {
  vec2 q = vec2(length(point.xz) - radii.x, point.y);
  return length(q) - radii.y;
}

float sdEllipsoid(vec3 point, vec3 radii) {
  float k0 = length(point / radii);
  float k1 = length(point / (radii * radii));
  return k0 * (k0 - 1.0) / max(k1, 0.0001);
}

float smoothMin(float a, float b, float radius) {
  float h = clamp(0.5 + 0.5 * (b - a) / radius, 0.0, 1.0);
  return mix(b, a, h) - radius * h * (1.0 - h);
}

float scene(vec3 point) {
  point.xz *= rot(u_yaw);
  point.yz *= rot(u_pitch);
  vec3 tilted = point;
  tilted.xy *= rot(0.34);
  float lens = sdEllipsoid(tilted, vec3(0.72, 0.94, 0.42));
  float collar = sdTorus(point + vec3(0.0, 0.17, 0.02), vec2(0.58, 0.17));
  float body = smoothMin(lens, collar, 0.13);
  float carvedEdge = -sdSphere(point - vec3(0.52, 0.31, 0.16), 0.34);
  return max(body, carvedEdge);
}

vec3 normalAt(vec3 point) {
  vec2 epsilon = vec2(0.0018, 0.0);
  return normalize(vec3(
    scene(point + epsilon.xyy) - scene(point - epsilon.xyy),
    scene(point + epsilon.yxy) - scene(point - epsilon.yxy),
    scene(point + epsilon.yyx) - scene(point - epsilon.yyx)
  ));
}

vec3 studioSample(vec2 uv) {
  vec2 safeUv = clamp(vec2(uv.x, 1.0 - uv.y), vec2(0.002), vec2(0.998));
  return texture2D(u_environment, safeUv).rgb;
}

vec2 refractedOffset(vec3 incident, vec3 normal, float index) {
  vec3 bent = refract(incident, normal, 1.0 / index);
  return (bent.xy - incident.xy) * 1.18 + normal.xy * 0.045;
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
  vec3 rayOrigin = vec3(0.0, 0.0, 3.2);
  vec3 rayDirection = normalize(vec3(uv, -2.05));
  float travelled = 0.0;
  bool hit = false;
  vec3 point = vec3(0.0);

  for (int step = 0; step < 86; step += 1) {
    point = rayOrigin + rayDirection * travelled;
    float distanceToSurface = scene(point);
    if (abs(distanceToSurface) < 0.0014) {
      hit = true;
      break;
    }
    travelled += distanceToSurface * 0.68;
    if (travelled > 6.2) break;
  }

  vec3 color = studioSample(screenUv) * mix(0.7, 0.82, u_inspection);
  float floorShadow = smoothstep(0.42, 0.0, length(vec2(uv.x * 0.82, uv.y + 0.93)));
  color *= 1.0 - floorShadow * 0.3;

  if (hit) {
    vec3 normal = normalAt(point);
    float facing = max(0.0, dot(-rayDirection, normal));
    float fresnel = pow(1.0 - facing, 3.2);
    vec2 redOffset = refractedOffset(rayDirection, normal, max(1.01, u_ior - u_dispersion));
    vec2 greenOffset = refractedOffset(rayDirection, normal, u_ior);
    vec2 blueOffset = refractedOffset(rayDirection, normal, u_ior + u_dispersion);
    float thickness = 0.76 + 0.38 * (1.0 - facing);
    vec3 transmitted = vec3(
      studioSample(screenUv + redOffset * thickness).r,
      studioSample(screenUv + greenOffset * thickness).g,
      studioSample(screenUv + blueOffset * thickness).b
    );
    vec3 reflectedDirection = reflect(rayDirection, normal);
    vec3 reflected = studioSample(screenUv + reflectedDirection.xy * 0.12);
    vec3 absorption = mix(vec3(0.72, 0.91, 0.98), vec3(0.86, 0.96, 0.99), facing);
    color = mix(transmitted * absorption, reflected, 0.08 + fresnel * 0.76);
    float keyLight = pow(max(0.0, dot(normal, normalize(vec3(-0.42, 0.72, 1.0)))), 30.0);
    float rim = pow(1.0 - facing, 5.0);
    color += keyLight * vec3(1.1, 1.04, 0.88) * 1.25;
    color += rim * mix(vec3(0.08, 0.42, 0.74), vec3(0.42, 0.68, 0.92), u_inspection) * 0.7;
    color *= mix(1.0, 0.78, u_inspection);
  }

  float vignette = 1.0 - 0.18 * dot(uv * vec2(0.7, 0.62), uv * vec2(0.7, 0.62));
  color *= vignette;
  color = pow(max(color, 0.0), vec3(0.9));
  gl_FragColor = vec4(color, 1.0);
}
`;

try {
  const stage = document.querySelector('#glass-stage');
  const host = document.querySelector('#glass-host');
  const archiveState = document.querySelector('#archive-state');
  const environmentOutput = document.querySelector('#environment-output');
  const iorOutput = document.querySelector('#ior-output');
  const dispersionOutput = document.querySelector('#dispersion-output');
  const rotationOutput = document.querySelector('#rotation-output');
  const motionOutput = document.querySelector('#motion-output');
  const sourceOutput = document.querySelector('#source-output');
  const inspectionFlag = document.querySelector('#inspection-flag');
  const studioButton = document.querySelector('#studio-button');
  const gridButton = document.querySelector('#grid-button');
  const iorDownButton = document.querySelector('#ior-down-button');
  const iorUpButton = document.querySelector('#ior-up-button');
  const iorControlOutput = document.querySelector('#ior-control-output');
  const resetButton = document.querySelector('#reset-button');
  const inspectButton = document.querySelector('#inspect-button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !host || !studioButton || !gridButton || !iorDownButton || !iorUpButton || !resetButton || !inspectButton) {
    throw new Error('Glass material inspector DOM is incomplete.');
  }

  const environments = [
    {
      name: 'Cobalt / amber',
      shortName: 'Studio',
      file: '01-cobalt-amber-calibration-bay.jpg',
    },
    {
      name: 'Cyan / red grid',
      shortName: 'Grid',
      file: '02-cyan-red-grid-bay.jpg',
    },
  ].map(environment => ({
    ...environment,
    url: new URL(`../assets/refractive-glass-transmission-sculpture/${environment.file}`, import.meta.url).href,
  }));

  const DEFAULT_YAW = -0.18;
  const DEFAULT_PITCH = 0.04;
  const DEFAULT_IOR = 1.45;
  const DISPERSION = 0.035;
  const MIN_IOR = 1.33;
  const MAX_IOR = 1.7;
  const EXPECTED_WIDTH = 960;
  const EXPECTED_HEIGHT = 540;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value, digits = 5) => Number(value.toFixed(digits));
  const degrees = radians => Math.round(radians * 180 / Math.PI);

  const state = {
    id: 'refractive-glass-transmission-sculpture',
    task: 'glass-material-refraction-review',
    userInputRequired: true,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'control'],
    automaticCruise: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockDriven: false,
    previewClockMutationCount: 0,
    syntheticInputDispatch: false,
    userOwnedOrientation: true,
    firstFrameStatic: true,
    initialStaticVerified: false,
    reducedMotion: reducedMotion.matches,
    reducedMotionDiscreteControls: true,
    yaw: DEFAULT_YAW,
    pitch: DEFAULT_PITCH,
    ior: DEFAULT_IOR,
    dispersion: DISPERSION,
    minIor: MIN_IOR,
    maxIor: MAX_IOR,
    environmentIndex: 0,
    inspectionActive: false,
    resultState: 'material-review',
    inputKind: 'none',
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedCount: 0,
    pointerInputCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    positiveInputCount: 0,
    negativeInputCount: 0,
    reversalCount: 0,
    lastDirection: 0,
    orientationMutationCount: 0,
    iorMutationCount: 0,
    environmentSwitchCount: 0,
    inspectionCount: 0,
    inspectionClearCount: 0,
    resetCount: 0,
    boundaryAttemptCount: 0,
    minBoundaryCount: 0,
    maxBoundaryCount: 0,
    lastBoundary: null,
    pointerCaptured: false,
    activePointerId: null,
    activePointerType: null,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    dragUpdateCount: 0,
    assetCount: environments.length,
    assetDecodedCount: 0,
    assetDimensionsValid: false,
    assetChecksums: [],
    assetChecksumsUnique: false,
    sampledPixelCount: 0,
    textureImagesReady: false,
    textureBindCount: 0,
    lastTextureIndex: 0,
    p5Ready: false,
    webglReady: false,
    webglVersion: 'none',
    shaderCompiled: false,
    shaderPasses: 0,
    transmissionShaderVerified: fragmentShader.includes('refract(') && fragmentShader.includes('texture2D('),
    drawCount: 0,
    resizeCount: 0,
    revision: 0,
    drawnRevision: -1,
    lastDrawnYaw: DEFAULT_YAW,
    lastDrawnPitch: DEFAULT_PITCH,
    lastDrawnIor: DEFAULT_IOR,
    ledger: [],
    lastLedgerEntry: null,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let decodedImages = [];
  let textureImages = [];
  let sketch;
  let canvas;
  let gl;
  let glassShader;
  let dragSession = null;
  let resizeFrame = 0;

  function recordLedger(entry) {
    const next = {
      ...entry,
      trusted: true,
      inputCountAtEntry: state.inputCount,
      yaw: round(state.yaw),
      pitch: round(state.pitch),
      ior: round(state.ior),
      environmentIndex: state.environmentIndex,
    };
    state.ledger.push(next);
    if (state.ledger.length > 64) state.ledger.shift();
    state.lastLedgerEntry = next;
  }

  function recordInput(kind, event, cause) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedCount += 1;
      return false;
    }
    state.inputKind = kind;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else if (kind === 'control') state.controlInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (kind === 'mouse') state.mouseInputCount += 1;
      if (kind === 'touch') state.touchInputCount += 1;
      if (kind === 'pen') state.penInputCount += 1;
    }
    recordLedger({ type: 'input', cause, kind });
    return true;
  }

  function registerDirection(amount, cause) {
    const direction = Math.sign(amount);
    if (!direction) return;
    if (direction > 0) state.positiveInputCount += 1;
    else state.negativeInputCount += 1;
    if (state.lastDirection && direction !== state.lastDirection) state.reversalCount += 1;
    state.lastDirection = direction;
    recordLedger({ type: 'direction', cause, direction });
  }

  function atDefaults() {
    return state.yaw === DEFAULT_YAW
      && state.pitch === DEFAULT_PITCH
      && state.ior === DEFAULT_IOR
      && state.environmentIndex === 0
      && !state.inspectionActive;
  }

  function syncInterface() {
    const environment = environments[state.environmentIndex];
    environmentOutput.textContent = environment.name;
    iorOutput.textContent = state.ior.toFixed(2);
    iorControlOutput.textContent = state.ior.toFixed(2);
    dispersionOutput.textContent = state.dispersion.toFixed(3);
    rotationOutput.textContent = `${degrees(state.yaw)}° / ${degrees(state.pitch)}°`;
    motionOutput.textContent = state.inputCount ? `Sample · ${degrees(state.yaw)}°` : 'Sample at rest';
    sourceOutput.textContent = state.inputCount ? `Last input · ${state.inputKind}` : 'Awaiting trusted input';
    archiveState.textContent = state.inspectionActive
      ? 'Inspecting · grid distortion'
      : state.inputCount
        ? `Reviewing · ${state.inputKind}`
        : 'Ready · input required';
    inspectionFlag.hidden = !state.inspectionActive;
    studioButton.setAttribute('aria-pressed', String(state.environmentIndex === 0));
    gridButton.setAttribute('aria-pressed', String(state.environmentIndex === 1));
    inspectButton.setAttribute('aria-pressed', String(state.inspectionActive));
    inspectButton.textContent = state.inspectionActive ? 'Close check' : 'Inspect grid';
    resetButton.disabled = atDefaults();
    iorDownButton.disabled = state.ior <= MIN_IOR;
    iorUpButton.disabled = state.ior >= MAX_IOR;
    host.setAttribute('aria-label', `Glass material inspector. Environment ${environment.name}. Refractive index ${state.ior.toFixed(2)}. Rotation ${degrees(state.yaw)} by ${degrees(state.pitch)} degrees. Drag to rotate; arrows rotate; brackets change index; G changes environment; Enter inspects; R resets.`);
  }

  function requestDraw(cause) {
    syncInterface();
    if (!sketch || !state.p5Ready) return;
    state.revision += 1;
    state.lastDrawCause = cause;
    sketch.redraw();
  }

  function setOrientation(nextYaw, nextPitch, cause) {
    const yaw = round(clamp(nextYaw, -1.25, 1.25));
    const pitch = round(clamp(nextPitch, -0.58, 0.58));
    if (yaw === state.yaw && pitch === state.pitch) return false;
    registerDirection(yaw !== state.yaw ? yaw - state.yaw : pitch - state.pitch, cause);
    state.yaw = yaw;
    state.pitch = pitch;
    state.orientationMutationCount += 1;
    recordLedger({ type: 'orientation', cause });
    requestDraw(cause);
    return true;
  }

  function changeIor(amount, cause) {
    const next = round(clamp(state.ior + amount, MIN_IOR, MAX_IOR), 2);
    if (next === state.ior) {
      state.boundaryAttemptCount += 1;
      state.lastBoundary = amount < 0 ? 'min-ior' : 'max-ior';
      if (amount < 0) state.minBoundaryCount += 1;
      else state.maxBoundaryCount += 1;
      recordLedger({ type: 'boundary', cause, boundary: state.lastBoundary });
      syncInterface();
      return false;
    }
    registerDirection(amount, cause);
    state.ior = next;
    state.lastBoundary = null;
    state.iorMutationCount += 1;
    recordLedger({ type: 'ior', cause });
    requestDraw(cause);
    return true;
  }

  function setEnvironment(index, cause, inspection = index === 1) {
    const nextIndex = clamp(index, 0, environments.length - 1);
    const changed = nextIndex !== state.environmentIndex || inspection !== state.inspectionActive;
    if (!changed) return false;
    if (nextIndex !== state.environmentIndex) state.environmentSwitchCount += 1;
    if (inspection && !state.inspectionActive) state.inspectionCount += 1;
    if (!inspection && state.inspectionActive) state.inspectionClearCount += 1;
    state.environmentIndex = nextIndex;
    state.inspectionActive = inspection;
    state.resultState = inspection ? 'grid-inspection' : 'material-review';
    recordLedger({ type: inspection ? 'inspection' : 'environment', cause });
    requestDraw(cause);
    return true;
  }

  function reset(cause) {
    state.yaw = DEFAULT_YAW;
    state.pitch = DEFAULT_PITCH;
    state.ior = DEFAULT_IOR;
    state.environmentIndex = 0;
    state.inspectionActive = false;
    state.resultState = 'material-review';
    state.lastBoundary = null;
    state.resetCount += 1;
    recordLedger({ type: 'reset', cause });
    requestDraw(cause);
  }

  function pointerKind(event) {
    return ['mouse', 'touch', 'pen'].includes(event.pointerType) ? event.pointerType : 'mouse';
  }

  host.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const kind = pointerKind(event);
    if (!recordInput(kind, event, 'pointer-down')) return;
    host.setPointerCapture(event.pointerId);
    dragSession = {
      pointerId: event.pointerId,
      pointerType: kind,
      startX: event.clientX,
      startY: event.clientY,
      startYaw: state.yaw,
      startPitch: state.pitch,
    };
    state.pointerCaptured = true;
    state.activePointerId = event.pointerId;
    state.activePointerType = kind;
    state.pointerCaptureCount += 1;
    recordLedger({ type: 'capture', cause: 'pointer-down', kind });
    host.focus({ preventScroll: true });
    event.preventDefault();
  });

  host.addEventListener('pointermove', event => {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    const kind = pointerKind(event);
    if (!recordInput(kind, event, 'pointer-drag')) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const nextYaw = dragSession.startYaw + (event.clientX - dragSession.startX) / width * 2.55;
    const nextPitch = dragSession.startPitch - (event.clientY - dragSession.startY) / height * 1.25;
    if (setOrientation(nextYaw, nextPitch, 'pointer-drag')) state.dragUpdateCount += 1;
    event.preventDefault();
  });

  function finishPointer(event, cancelled) {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    const kind = pointerKind(event);
    if (!recordInput(kind, event, cancelled ? 'pointer-cancel' : 'pointer-up')) return;
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.activePointerType = null;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    recordLedger({ type: cancelled ? 'cancel' : 'release', cause: cancelled ? 'pointer-cancel' : 'pointer-up', kind });
    dragSession = null;
    syncInterface();
  }

  host.addEventListener('pointerup', event => finishPointer(event, false));
  host.addEventListener('pointercancel', event => finishPointer(event, true));

  host.addEventListener('keydown', event => {
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '[', ']', '-', '=', '+', 'g', 'G', 'Enter', ' ', 'r', 'R', 'Home'];
    if (!handled.includes(event.key)) return;
    if (!recordInput('keyboard', event, `key-${event.key}`)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') setOrientation(state.yaw - 0.13, state.pitch, 'key-left');
    else if (event.key === 'ArrowRight') setOrientation(state.yaw + 0.13, state.pitch, 'key-right');
    else if (event.key === 'ArrowUp') setOrientation(state.yaw, state.pitch + 0.09, 'key-up');
    else if (event.key === 'ArrowDown') setOrientation(state.yaw, state.pitch - 0.09, 'key-down');
    else if (event.key === '[' || event.key === '-') changeIor(-0.02, 'key-ior-down');
    else if (event.key === ']' || event.key === '=' || event.key === '+') changeIor(0.02, 'key-ior-up');
    else if (event.key === 'g' || event.key === 'G') setEnvironment(state.environmentIndex ? 0 : 1, 'key-environment', state.environmentIndex === 0);
    else if (event.key === 'Enter' || event.key === ' ') setEnvironment(state.inspectionActive ? 0 : 1, 'key-inspection', !state.inspectionActive);
    else if (event.key === 'r' || event.key === 'R' || event.key === 'Home') reset(`key-${event.key}`);
  });

  function handleControl(button, cause, action) {
    button.addEventListener('click', event => {
      if (!recordInput('control', event, cause)) return;
      action();
    });
  }

  handleControl(studioButton, 'control-studio', () => setEnvironment(0, 'control-studio', false));
  handleControl(gridButton, 'control-grid', () => setEnvironment(1, 'control-grid', true));
  handleControl(iorDownButton, 'control-ior-down', () => changeIor(-0.02, 'control-ior-down'));
  handleControl(iorUpButton, 'control-ior-up', () => changeIor(0.02, 'control-ior-up'));
  handleControl(inspectButton, 'control-inspection', () => setEnvironment(state.inspectionActive ? 0 : 1, 'control-inspection', !state.inspectionActive));
  handleControl(resetButton, 'control-reset', () => reset('control-reset'));

  function sampleChecksum(image) {
    const sample = document.createElement('canvas');
    sample.width = 48;
    sample.height = 27;
    const context = sample.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, sample.width, sample.height);
    const sampledPixels = context.getImageData(0, 0, sample.width, sample.height).data;
    let hash = 2166136261;
    for (let index = 0; index < sampledPixels.length; index += 13) {
      hash ^= sampledPixels[index];
      hash = Math.imul(hash, 16777619);
    }
    state.sampledPixelCount += sampledPixels.length;
    return hash >>> 0;
  }

  async function decodeEnvironment(environment) {
    const image = new Image();
    image.decoding = 'async';
    image.src = environment.url;
    await image.decode();
    if (!image.complete || image.naturalWidth !== EXPECTED_WIDTH || image.naturalHeight !== EXPECTED_HEIGHT) {
      throw new Error(`Glass environment failed strict decode: ${environment.file} (${image.naturalWidth}×${image.naturalHeight}).`);
    }
    state.assetDecodedCount += 1;
    return image;
  }

  function drawPass(p) {
    state.textureBindCount += 1;
    state.lastTextureIndex = state.environmentIndex;
    p.shader(glassShader);
    glassShader.setUniform('u_resolution', [p.width, p.height]);
    glassShader.setUniform('u_environment', textureImages[state.environmentIndex]);
    glassShader.setUniform('u_yaw', state.yaw);
    glassShader.setUniform('u_pitch', state.pitch);
    glassShader.setUniform('u_ior', state.ior);
    glassShader.setUniform('u_dispersion', state.dispersion);
    glassShader.setUniform('u_inspection', state.inspectionActive ? 1 : 0);
    p.quad(-1, -1, 1, -1, 1, 1, -1, 1);
    state.shaderPasses += 1;
    state.drawCount += 1;
    state.shaderCompiled = Boolean(glassShader?._glProgram);
    state.drawnRevision = state.revision;
    state.lastDrawnYaw = state.yaw;
    state.lastDrawnPitch = state.pitch;
    state.lastDrawnIor = state.ior;
  }

  const assetsReady = Promise.all(environments.map(decodeEnvironment)).then(decoded => {
    decodedImages = decoded;
    state.assetDimensionsValid = decoded.every(image => image.naturalWidth === EXPECTED_WIDTH && image.naturalHeight === EXPECTED_HEIGHT);
    state.assetChecksums = decoded.map(sampleChecksum);
    state.assetChecksumsUnique = new Set(state.assetChecksums).size === decoded.length;
    if (state.assetDecodedCount !== environments.length || !state.assetDimensionsValid || !state.assetChecksumsUnique) {
      throw new Error('Glass environments failed decode, dimensions, or uniqueness evidence.');
    }
    return decoded;
  });

  const p5Ready = assetsReady.then(() => new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = async () => {
        try {
          p.pixelDensity(1);
          canvas = p.createCanvas(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), p.WEBGL).parent(host).elt;
          p.noStroke();
          p.noLoop();
          textureImages = await Promise.all(environments.map(environment => p.loadImage(environment.url)));
          state.textureImagesReady = textureImages.length === environments.length
            && textureImages.every(image => image instanceof p5.Image
              && image.width === EXPECTED_WIDTH
              && image.height === EXPECTED_HEIGHT);
          if (!state.textureImagesReady) throw new Error('p5 glass environment textures failed strict loading.');
          glassShader = p.createShader(vertexShader, fragmentShader);
          gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          state.webglReady = Boolean(gl);
          state.webglVersion = gl instanceof WebGL2RenderingContext ? 'webgl2' : gl ? 'webgl1' : 'none';
          state.p5Ready = true;
          p.draw = () => drawPass(p);
          p.redraw();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
    }, host);
  }));

  const nextFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.all([p5Ready, document.fonts.ready])
    .then(nextFrames)
    .then(() => {
      syncInterface();
      const before = `${state.yaw}|${state.pitch}|${state.ior}|${state.environmentIndex}|${state.inspectionActive}|${state.orientationMutationCount}|${state.iorMutationCount}|${state.drawCount}`;
      return nextFrames().then(() => {
        const after = `${state.yaw}|${state.pitch}|${state.ior}|${state.environmentIndex}|${state.inspectionActive}|${state.orientationMutationCount}|${state.iorMutationCount}|${state.drawCount}`;
        state.initialStaticVerified = before === after
          && state.inputCount === 0
          && state.yaw === DEFAULT_YAW
          && state.pitch === DEFAULT_PITCH
          && state.ior === DEFAULT_IOR
          && state.environmentIndex === 0
          && !state.inspectionActive
          && state.drawCount === 1;
        if (!state.initialStaticVerified) throw new Error(`Glass inspector first frame changed without trusted input: ${before} -> ${after}.`);
      });
    });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch || !canvas || !state.p5Ready) return;
      const canvasWidth = Math.max(1, host.clientWidth);
      const canvasHeight = Math.max(1, host.clientHeight);
      if (canvas.width === canvasWidth && canvas.height === canvasHeight) return;
      sketch.resizeCanvas(canvasWidth, canvasHeight);
      state.resizeCount += 1;
      requestDraw('viewport-resize');
    });
  });
  resizeObserver.observe(host);

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();
    const stageRect = stage.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const currentEnvironment = environments[state.environmentIndex];
    const allCounters = [
      state.previewClockMutationCount,
      state.inputCount,
      state.trustedInputCount,
      state.rejectedUntrustedCount,
      state.pointerInputCount,
      state.mouseInputCount,
      state.touchInputCount,
      state.penInputCount,
      state.keyboardInputCount,
      state.controlInputCount,
      state.positiveInputCount,
      state.negativeInputCount,
      state.reversalCount,
      state.orientationMutationCount,
      state.iorMutationCount,
      state.environmentSwitchCount,
      state.inspectionCount,
      state.inspectionClearCount,
      state.resetCount,
      state.boundaryAttemptCount,
      state.minBoundaryCount,
      state.maxBoundaryCount,
      state.pointerCaptureCount,
      state.pointerReleaseCount,
      state.pointerCancelCount,
      state.dragUpdateCount,
      state.assetDecodedCount,
      state.sampledPixelCount,
      state.textureBindCount,
      state.shaderPasses,
      state.drawCount,
      state.resizeCount,
      state.revision,
    ];
    const inputEvidence = state.trustedInputCount === state.inputCount
      && state.pointerInputCount === state.mouseInputCount + state.touchInputCount + state.penInputCount
      && state.inputCount === state.pointerInputCount + state.keyboardInputCount + state.controlInputCount
      && state.ledger.every(entry => entry.trusted === true && Number.isInteger(entry.inputCountAtEntry));
    const resetEvidence = state.resetCount === 0 || state.ledger.some(entry => entry.type === 'reset');
    const boundaryEvidence = state.lastBoundary === null
      || state.lastBoundary === 'min-ior' && state.ior === MIN_IOR
      || state.lastBoundary === 'max-ior' && state.ior === MAX_IOR;
    const resultEvidence = state.inspectionActive
      ? state.environmentIndex === 1
        && state.resultState === 'grid-inspection'
        && !inspectionFlag.hidden
        && gridButton.getAttribute('aria-pressed') === 'true'
        && inspectButton.getAttribute('aria-pressed') === 'true'
      : state.resultState === 'material-review'
        && inspectionFlag.hidden
        && inspectButton.getAttribute('aria-pressed') === 'false';
    const assetEvidence = decodedImages.length === environments.length
      && decodedImages.every(image => image instanceof HTMLImageElement
        && image.complete
        && image.naturalWidth === EXPECTED_WIDTH
        && image.naturalHeight === EXPECTED_HEIGHT)
      && textureImages.length === environments.length
      && textureImages.every(image => image instanceof p5.Image
        && image.width === EXPECTED_WIDTH
        && image.height === EXPECTED_HEIGHT)
      && state.assetDecodedCount === environments.length
      && state.assetDimensionsValid
      && state.assetChecksums.length === environments.length
      && state.assetChecksums.every(checksum => Number.isInteger(checksum) && checksum > 0)
      && state.assetChecksumsUnique
      && state.sampledPixelCount === environments.length * 48 * 27 * 4
      && state.textureImagesReady;
    const mechanismEvidence = sketch instanceof p5
      && canvas instanceof HTMLCanvasElement
      && Boolean(gl)
      && state.p5Ready
      && state.webglReady
      && (state.webglVersion === 'webgl2' || state.webglVersion === 'webgl1')
      && state.shaderCompiled
      && Boolean(glassShader?._glProgram)
      && state.transmissionShaderVerified
      && state.shaderPasses === state.drawCount
      && state.textureBindCount === state.drawCount
      && state.lastTextureIndex === state.environmentIndex
      && state.drawnRevision === state.revision
      && Math.abs(state.lastDrawnYaw - state.yaw) < 0.00001
      && Math.abs(state.lastDrawnPitch - state.pitch) < 0.00001
      && Math.abs(state.lastDrawnIor - state.ior) < 0.00001;
    const uiEvidence = environmentOutput.textContent === currentEnvironment.name
      && iorOutput.textContent === state.ior.toFixed(2)
      && iorControlOutput.textContent === state.ior.toFixed(2)
      && resetButton.disabled === atDefaults()
      && studioButton.getAttribute('aria-pressed') === String(state.environmentIndex === 0)
      && gridButton.getAttribute('aria-pressed') === String(state.environmentIndex === 1)
      && host.getAttribute('aria-label').includes(state.ior.toFixed(2));
    const viewportEvidence = stageRect.left >= -0.5
      && stageRect.top >= -0.5
      && stageRect.right <= innerWidth + 0.5
      && stageRect.bottom <= innerHeight + 0.5
      && hostRect.left >= stageRect.left
      && hostRect.top >= stageRect.top
      && hostRect.right <= stageRect.right
      && hostRect.bottom <= stageRect.bottom
      && Math.abs(canvasRect.width - hostRect.width) <= 0.5
      && Math.abs(canvasRect.height - hostRect.height) <= 0.5
      && document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;

    return window.__PREVIEW_INTERACTION_STATE__ === state
      && window.__PREVIEW_META__?.capture === 'real-demo'
      && window.__PREVIEW_META__?.library === 'p5@2.3.0'
      && stage.dataset.previewMechanism === 'p5-raymarched-texture-refraction-inspector'
      && state.task === 'glass-material-refraction-review'
      && state.userInputRequired === true
      && state.acceptedInputs.join('|') === 'mouse|touch|pen|keyboard|control'
      && state.automaticCruise === false
      && state.automaticPlayback === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.previewClockDriven === false
      && state.previewClockMutationCount === 0
      && state.syntheticInputDispatch === false
      && state.userOwnedOrientation === true
      && state.firstFrameStatic
      && state.initialStaticVerified
      && state.reducedMotionDiscreteControls
      && state.yaw >= -1.25
      && state.yaw <= 1.25
      && state.pitch >= -0.58
      && state.pitch <= 0.58
      && state.ior >= MIN_IOR
      && state.ior <= MAX_IOR
      && state.pointerCaptured === (dragSession !== null)
      && allCounters.every(counter => Number.isInteger(counter) && counter >= 0)
      && inputEvidence
      && resetEvidence
      && boundaryEvidence
      && resultEvidence
      && assetEvidence
      && mechanismEvidence
      && uiEvidence
      && viewportEvidence;
  };

  syncInterface();
  ready.catch(markPreviewFailure);
  installPreviewController({
    id: 'refractive-glass-transmission-sculpture',
    library: 'p5@2.3.0',
    renderer: 'webgl',
    render: () => {},
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
