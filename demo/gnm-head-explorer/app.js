const ASSET_MANIFEST_URL = './assets/gnm-head-v3-demo.json';

const canvas = document.querySelector('#gnm-canvas');
const loadingScreen = document.querySelector('#loading-screen');
const loadingStatus = document.querySelector('#loading-status');
const renderStatus = document.querySelector('#render-status');
const payloadProof = document.querySelector('#payload-proof');
const componentLegend = document.querySelector('#component-legend');
const identityStrength = document.querySelector('#identity-strength');
const identityOutput = document.querySelector('#identity-output');
const identityButtons = [...document.querySelectorAll('[data-identity]')];
const expressionInputs = [...document.querySelectorAll('[data-expression]')];
const presetButtons = [...document.querySelectorAll('[data-preset]')];
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const topologyToggle = document.querySelector('#topology-toggle');
const resetViewButton = document.querySelector('#reset-view');

const state = {
  identityIndex: 1,
  identityStrength: Number(identityStrength.value),
  expressions: expressionInputs.map(input => Number(input.value)),
  mode: 'surface',
  topology: false,
  yaw: -0.3,
  pitch: -0.025,
  distance: 3.45,
  pointerId: null,
  lastPointerX: 0,
  lastPointerY: 0,
  dragging: false,
  ready: false,
  assetVerified: false,
  renderCount: 0,
  morphUpdateCount: 0,
  interactionCount: 0,
  manifest: null,
};

window.__GNM_HEAD_EXPLORER__ = state;

const VERTEX_SHADER = `
  precision highp float;
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec3 aColor;
  uniform mat4 uMvp;
  uniform mat4 uModel;
  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vPosition;

  void main() {
    vec4 worldPosition = uModel * vec4(aPosition, 1.0);
    vPosition = worldPosition.xyz;
    vNormal = normalize(mat3(uModel) * aNormal);
    vColor = aColor;
    gl_Position = uMvp * vec4(aPosition, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform float uAnatomy;
  uniform float uAlpha;
  uniform float uWire;
  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing) normal *= -1.0;
    vec3 lightDirection = normalize(vec3(-0.42, 0.68, 0.88));
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float fill = max(dot(normal, normalize(vec3(0.55, -0.25, 0.45))), 0.0);
    float rim = pow(1.0 - abs(normal.z), 2.4);
    float floorShade = smoothstep(-0.9, 0.45, vPosition.y);
    vec3 neutral = mix(vec3(0.38, 0.37, 0.34), vec3(0.76, 0.70, 0.62), floorShade);
    vec3 base = mix(neutral, vColor, uAnatomy);
    float stipple = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    vec3 shaded = base * (0.34 + diffuse * 0.63 + fill * 0.13);
    shaded += vec3(0.36, 0.46, 0.37) * rim * 0.32;
    shaded += (stipple - 0.5) * 0.012;
    vec3 wireColor = mix(vec3(0.79, 1.0, 0.26), vec3(0.92, 0.89, 0.82), uAnatomy);
    gl_FragColor = vec4(mix(shaded, wireColor, uWire), uAlpha);
  }
`;

const PRESETS = {
  neutral: { identity: 0, expressions: [0, 0, 0, 0] },
  portrait: { identity: 0.68, expressions: [0.35, 0, 0, 0] },
  surprised: { identity: 0.56, expressions: [0, 0.9, 0, 0.08] },
  character: { identity: 0.84, expressions: [0.3, 0, 0.82, 0.2] },
};

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function matrixMultiply(a, b) {
  const output = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      let value = 0;
      for (let index = 0; index < 4; index += 1) {
        value += a[index * 4 + row] * b[column * 4 + index];
      }
      output[column * 4 + row] = value;
    }
  }
  return output;
}

function perspective(fieldOfView, aspect, near, far) {
  const focalLength = 1 / Math.tan(fieldOfView / 2);
  const range = 1 / (near - far);
  return new Float32Array([
    focalLength / aspect, 0, 0, 0,
    0, focalLength, 0, 0,
    0, 0, (near + far) * range, -1,
    0, 0, near * far * 2 * range, 0,
  ]);
}

function translation(x, y, z) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ]);
}

function rotationX(angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return new Float32Array([
    1, 0, 0, 0,
    0, cosine, sine, 0,
    0, -sine, cosine, 0,
    0, 0, 0, 1,
  ]);
}

function rotationY(angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return new Float32Array([
    cosine, 0, -sine, 0,
    0, 1, 0, 0,
    sine, 0, cosine, 0,
    0, 0, 0, 1,
  ]);
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${message}`);
  }
  return shader;
}

function createProgram(gl) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program linking failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}

function typedArray(buffer, descriptor) {
  const constructors = {
    float32: Float32Array,
    uint8: Uint8Array,
    uint16: Uint16Array,
  };
  const Constructor = constructors[descriptor.dtype];
  if (!Constructor) throw new Error(`Unsupported model dtype: ${descriptor.dtype}`);
  return new Constructor(buffer, descriptor.byteOffset, descriptor.length);
}

async function loadAsset() {
  loadingStatus.textContent = '读取模型描述';
  const manifestResponse = await fetch(ASSET_MANIFEST_URL, { cache: 'no-store' });
  if (!manifestResponse.ok) throw new Error(`Manifest request failed: ${manifestResponse.status}`);
  const manifest = await manifestResponse.json();
  if (manifest.format !== 'gnm-head-explorer-v1') throw new Error('Unknown GNM demo asset format');

  loadingStatus.textContent = '载入 17,821 个顶点';
  const binaryUrl = new URL(`./assets/${manifest.binary}`, location.href);
  const binaryResponse = await fetch(binaryUrl, { cache: 'no-store' });
  if (!binaryResponse.ok) throw new Error(`Model request failed: ${binaryResponse.status}`);
  const buffer = await binaryResponse.arrayBuffer();
  if (buffer.byteLength !== manifest.binaryByteLength) throw new Error('Model payload length mismatch');

  loadingStatus.textContent = '校验官方数据派生包';
  if (crypto?.subtle) {
    const digest = hex(await crypto.subtle.digest('SHA-256', buffer));
    if (digest !== manifest.binarySha256) throw new Error('Model payload checksum mismatch');
    state.assetVerified = true;
  }

  const arrays = Object.fromEntries(
    Object.entries(manifest.arrays).map(([name, descriptor]) => [name, typedArray(buffer, descriptor)])
  );
  return { manifest, arrays };
}

class GNMRenderer {
  constructor(targetCanvas, manifest, arrays) {
    this.canvas = targetCanvas;
    this.manifest = manifest;
    this.arrays = arrays;
    this.gl = targetCanvas.getContext('webgl', {
      antialias: true,
      alpha: false,
      depth: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!this.gl) throw new Error('WebGL is unavailable');

    const gl = this.gl;
    this.program = createProgram(gl);
    this.locations = {
      position: gl.getAttribLocation(this.program, 'aPosition'),
      normal: gl.getAttribLocation(this.program, 'aNormal'),
      color: gl.getAttribLocation(this.program, 'aColor'),
      mvp: gl.getUniformLocation(this.program, 'uMvp'),
      model: gl.getUniformLocation(this.program, 'uModel'),
      anatomy: gl.getUniformLocation(this.program, 'uAnatomy'),
      alpha: gl.getUniformLocation(this.program, 'uAlpha'),
      wire: gl.getUniformLocation(this.program, 'uWire'),
    };

    this.currentPositions = new Float32Array(arrays.templatePositions);
    this.positionBuffer = this.createArrayBuffer(this.currentPositions, gl.DYNAMIC_DRAW);
    this.normalBuffer = this.createArrayBuffer(arrays.templateNormals, gl.STATIC_DRAW);
    this.colorBuffer = this.createArrayBuffer(arrays.componentColors, gl.STATIC_DRAW);
    this.triangleBuffer = this.createElementBuffer(arrays.triangleIndices);
    this.edgeBuffer = this.createElementBuffer(arrays.edgeIndices);
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      requestRender();
    });
    this.resizeObserver.observe(targetCanvas);

    gl.useProgram(this.program);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0.073, 0.086, 0.076, 1);
    this.bindAttributes();
    this.resize();
  }

  createArrayBuffer(data, usage) {
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, usage);
    return buffer;
  }

  createElementBuffer(data) {
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    return buffer;
  }

  bindAttribute(buffer, location) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
  }

  bindAttributes() {
    this.bindAttribute(this.positionBuffer, this.locations.position);
    this.bindAttribute(this.normalBuffer, this.locations.normal);
    this.bindAttribute(this.colorBuffer, this.locations.color);
  }

  resize() {
    const width = Math.max(1, Math.round(this.canvas.clientWidth * Math.min(devicePixelRatio, 2)));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * Math.min(devicePixelRatio, 2)));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  updateMorphs(identityIndex, strength, expressions) {
    const template = this.arrays.templatePositions;
    const identityDeltas = this.arrays.identityDeltas;
    const expressionDeltas = this.arrays.expressionDeltas;
    const stride = template.length;
    const identityOffset = identityIndex * stride;
    for (let index = 0; index < stride; index += 1) {
      let value = template[index] + identityDeltas[identityOffset + index] * strength;
      for (let expression = 0; expression < expressions.length; expression += 1) {
        value += expressionDeltas[expression * stride + index] * expressions[expression];
      }
      this.currentPositions[index] = value;
    }
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.currentPositions);
    state.morphUpdateCount += 1;
  }

  setUniforms(alpha, anatomy, wire) {
    const gl = this.gl;
    gl.uniform1f(this.locations.alpha, alpha);
    gl.uniform1f(this.locations.anatomy, anatomy);
    gl.uniform1f(this.locations.wire, wire);
  }

  drawTriangles(offset, count, alpha, anatomy) {
    const gl = this.gl;
    this.setUniforms(alpha, anatomy, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, offset * 2);
  }

  drawEdges(alpha, anatomy, depthTest = true) {
    const gl = this.gl;
    this.setUniforms(alpha, anatomy, 1);
    if (depthTest) gl.enable(gl.DEPTH_TEST);
    else gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeBuffer);
    gl.drawElements(gl.LINES, this.arrays.edgeIndices.length, gl.UNSIGNED_SHORT, 0);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
  }

  render(viewState) {
    const gl = this.gl;
    this.resize();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    this.bindAttributes();

    const aspect = this.canvas.width / this.canvas.height;
    const projection = perspective((34 * Math.PI) / 180, aspect, 0.1, 20);
    const view = translation(0, -0.01, -viewState.distance);
    const model = matrixMultiply(rotationY(viewState.yaw), rotationX(viewState.pitch));
    const mvp = matrixMultiply(matrixMultiply(projection, view), model);
    gl.uniformMatrix4fv(this.locations.model, false, model);
    gl.uniformMatrix4fv(this.locations.mvp, false, mvp);

    const totalTriangleIndices = this.manifest.triangleCount * 3;
    if (viewState.mode === 'surface') {
      gl.depthMask(true);
      this.drawTriangles(0, totalTriangleIndices, 1, 0);
      if (viewState.topology) this.drawEdges(0.24, 0, true);
    } else {
      const skinRange = this.manifest.componentRanges.skin;
      gl.depthMask(false);
      this.drawTriangles(skinRange.indexOffset, skinRange.indexCount, 0.13, 1);
      gl.depthMask(true);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      for (const name of this.manifest.componentNames.slice(1)) {
        const range = this.manifest.componentRanges[name];
        this.drawTriangles(range.indexOffset, range.indexCount, 1, 1);
      }
      this.drawEdges(viewState.topology ? 0.32 : 0.09, 1, !viewState.topology);
    }
    state.renderCount += 1;
  }
}

let renderer = null;
let renderFrame = null;

function requestRender() {
  if (!renderer || renderFrame !== null) return;
  renderFrame = requestAnimationFrame(() => {
    renderFrame = null;
    renderer.render(state);
  });
}

function clearActivePreset() {
  presetButtons.forEach(button => {
    button.classList.remove('is-active');
    button.setAttribute('aria-pressed', 'false');
  });
}

function syncControls() {
  identityStrength.value = String(state.identityStrength);
  identityOutput.textContent = `${Math.round(state.identityStrength * 100)}%`;
  identityButtons.forEach((button, index) => {
    const active = index === state.identityIndex;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  expressionInputs.forEach((input, index) => {
    input.value = String(state.expressions[index]);
    const output = input.parentElement.querySelector('output');
    output.textContent = String(Math.round(state.expressions[index] * 100)).padStart(2, '0');
  });
}

function updateMorphs() {
  if (!renderer) return;
  renderer.updateMorphs(state.identityIndex, state.identityStrength, state.expressions);
  requestRender();
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  state.identityStrength = preset.identity;
  state.expressions = [...preset.expressions];
  presetButtons.forEach(button => {
    const active = button.dataset.preset === name;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  syncControls();
  updateMorphs();
}

function resetView(animate = true) {
  const from = { yaw: state.yaw, pitch: state.pitch, distance: state.distance };
  const target = { yaw: 0.08, pitch: -0.025, distance: 3.45 };
  if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Object.assign(state, target);
    requestRender();
    return;
  }
  const startedAt = performance.now();
  const tick = now => {
    const progress = clamp((now - startedAt) / 520, 0, 1);
    const eased = easeOutCubic(progress);
    state.yaw = from.yaw + (target.yaw - from.yaw) * eased;
    state.pitch = from.pitch + (target.pitch - from.pitch) * eased;
    state.distance = from.distance + (target.distance - from.distance) * eased;
    requestRender();
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function bindControls() {
  identityStrength.addEventListener('input', () => {
    state.identityStrength = Number(identityStrength.value);
    identityOutput.textContent = `${Math.round(state.identityStrength * 100)}%`;
    state.interactionCount += 1;
    clearActivePreset();
    updateMorphs();
  });

  identityButtons.forEach(button => {
    button.addEventListener('click', () => {
      state.identityIndex = Number(button.dataset.identity);
      state.interactionCount += 1;
      clearActivePreset();
      syncControls();
      updateMorphs();
    });
  });

  expressionInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      state.expressions[index] = Number(input.value);
      input.parentElement.querySelector('output').textContent = String(
        Math.round(state.expressions[index] * 100)
      ).padStart(2, '0');
      state.interactionCount += 1;
      clearActivePreset();
      updateMorphs();
    });
  });

  presetButtons.forEach(button => {
    button.addEventListener('click', () => {
      state.interactionCount += 1;
      applyPreset(button.dataset.preset);
    });
  });

  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      state.mode = button.dataset.mode;
      modeButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      componentLegend.classList.toggle('is-visible', state.mode === 'anatomy');
      state.interactionCount += 1;
      requestRender();
    });
  });

  topologyToggle.addEventListener('click', () => {
    state.topology = !state.topology;
    topologyToggle.setAttribute('aria-pressed', String(state.topology));
    state.interactionCount += 1;
    requestRender();
  });

  resetViewButton.addEventListener('click', () => resetView());
  canvas.addEventListener('dblclick', () => resetView());

  canvas.addEventListener('pointerdown', event => {
    state.pointerId = event.pointerId;
    state.lastPointerX = event.clientX;
    state.lastPointerY = event.clientY;
    state.dragging = true;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', event => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    const deltaX = event.clientX - state.lastPointerX;
    const deltaY = event.clientY - state.lastPointerY;
    state.lastPointerX = event.clientX;
    state.lastPointerY = event.clientY;
    state.yaw += deltaX * 0.008;
    state.pitch = clamp(state.pitch + deltaY * 0.007, -0.72, 0.72);
    state.interactionCount += 1;
    requestRender();
  });

  const releasePointer = event => {
    if (event.pointerId !== state.pointerId) return;
    state.dragging = false;
    state.pointerId = null;
  };
  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);

  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    state.distance = clamp(state.distance + event.deltaY * 0.0022, 2.4, 5.1);
    state.interactionCount += 1;
    requestRender();
  }, { passive: false });

  canvas.addEventListener('keydown', event => {
    const keyActions = {
      ArrowLeft: () => { state.yaw -= 0.08; },
      ArrowRight: () => { state.yaw += 0.08; },
      ArrowUp: () => { state.pitch = clamp(state.pitch - 0.06, -0.72, 0.72); },
      ArrowDown: () => { state.pitch = clamp(state.pitch + 0.06, -0.72, 0.72); },
      '+': () => { state.distance = clamp(state.distance - 0.16, 2.4, 5.1); },
      '-': () => { state.distance = clamp(state.distance + 0.16, 2.4, 5.1); },
      '0': () => resetView(),
    };
    const action = keyActions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
    state.interactionCount += 1;
    requestRender();
  });
}

function showFailure(error) {
  console.error(error);
  loadingStatus.textContent = `加载失败 / ${error.message}`;
  loadingScreen.classList.add('has-error');
  renderStatus.textContent = 'MODEL / ERROR';
  renderStatus.style.color = '#ff604c';
}

async function start() {
  try {
    const { manifest, arrays } = await loadAsset();
    state.manifest = manifest;
    document.querySelector('#vertex-count').textContent = manifest.vertexCount.toLocaleString('en-US');
    document.querySelector('#triangle-count').textContent = manifest.triangleCount.toLocaleString('en-US');
    payloadProof.textContent = state.assetVerified
      ? `SHA-256 ${manifest.binarySha256.slice(0, 12).toUpperCase()}`
      : `${(manifest.binaryByteLength / 1024 / 1024).toFixed(2)} MB / LOCAL`;

    loadingStatus.textContent = '建立 WebGL 参数曲面';
    renderer = new GNMRenderer(canvas, manifest, arrays);
    renderer.updateMorphs(state.identityIndex, state.identityStrength, state.expressions);
    bindControls();
    syncControls();
    renderer.render(state);
    state.ready = true;
    renderStatus.textContent = `WEBGL / ${state.assetVerified ? 'VERIFIED' : 'LOCAL'} / READY`;
    loadingScreen.classList.add('is-hidden');

    const introStart = performance.now();
    const introFrom = state.yaw;
    const intro = now => {
      const progress = clamp((now - introStart) / 900, 0, 1);
      state.yaw = introFrom + (0.08 - introFrom) * easeOutCubic(progress);
      requestRender();
      if (progress < 1) requestAnimationFrame(intro);
    };
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(intro);
    else resetView(false);
  } catch (error) {
    showFailure(error);
  }
}

start();
