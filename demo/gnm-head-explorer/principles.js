const ASSET_MANIFEST_URL = './assets/gnm-head-v3-demo.json';

const canvas = document.querySelector('#principle-canvas');
const jointOverlay = document.querySelector('#joint-overlay');
const jointLines = jointOverlay.querySelector('.joint-lines');
const jointPoints = jointOverlay.querySelector('.joint-points');
const stepButtons = [...document.querySelectorAll('[data-step]')];
const formulaTerms = [...document.querySelectorAll('[data-formula]')];
const stageMode = document.querySelector('#stage-mode');
const stageProof = document.querySelector('#stage-proof');
const stepCount = document.querySelector('#step-count');
const stepTitle = document.querySelector('#step-title');
const stepBody = document.querySelector('#step-body');
const stepEquation = document.querySelector('#step-equation');
const stepFacts = document.querySelector('#step-facts');
const stepNote = document.querySelector('#step-note');

const STEPS = [
  {
    formula: 'template',
    mode: 'MEAN TEMPLATE',
    title: '从平均头模开始',
    body: 'GNM 先定义一个所有样本共享的平均网格。它决定了顶点编号、面片连接和 UV 布局，是后续所有变化的共同坐标系。',
    equation: 'V<sub>0</sub> = T̄',
    facts: [['顶点', '17,821'], ['三角面', '35,324']],
    note: '改变步骤时，画面里始终是同一套真实 GNM 拓扑。',
  },
  {
    formula: 'identity',
    mode: 'IDENTITY BASIS',
    title: 'β 选择“是谁”',
    body: '253 个身份基底描述稳定的个体差异。每个 β 系数都会让全部顶点沿一个学习到的方向移动；叠加后，头型、五官比例和软组织轮廓一起改变。',
    equation: 'V<sub>id</sub> = T̄ + B<sub>id</sub>β',
    facts: [['身份维度', '253'], ['本页样本', 'β · 1.0']],
    note: '这里展示的是官方身份采样器生成的一组固定系数，不是手工拉动几个控制点。',
  },
  {
    formula: 'expression',
    mode: 'EXPRESSION BASIS',
    title: 'ψ 驱动“在做什么表情”',
    body: '表情基底独立于身份叠加。嘴角、眼睑、面颊和舌头等区域可以协同变化，同时保留刚刚得到的个体头型。',
    equation: 'V<sub>bind</sub> = V<sub>id</sub> + B<sub>exp</sub>ψ',
    facts: [['表情维度', '383'], ['演示混合', '笑 30% + 惊讶 45%']],
    note: '真实资产同时包含皮肤、双眼、上下牙龈和舌头，因此张嘴时内部结构也能保持一致。',
  },
  {
    formula: 'pose',
    mode: 'POSE + LBS',
    title: 'θ 把形状变成姿态',
    body: 'GNM 先按身份计算关节位置，再施加颈部、头部与眼球旋转。姿态修正补偿关节附近的非刚性形变，线性混合蒙皮把变换传播到全部顶点。',
    equation: 'V = W(V<sub>bind</sub> + P(θ), J(β), θ)',
    facts: [['骨骼关节', '4'], ['头部偏航', '18.3°']],
    note: '荧光线段是模型实际的 neck → head → eyes 关节层级；网格位移由官方姿态修正与蒙皮权重计算。',
  },
  {
    formula: 'result',
    mode: 'COHERENT MESH',
    title: '输出可计算的三维网格',
    body: '最终结果仍然拥有完全相同的顶点序号和面片连接。这个对应关系让动画、纹理、监督信号和神经渲染结果可以在不同身份与表情之间稳定传递。',
    equation: 'V<sub>world</sub> = V + t',
    facts: [['几何组件', '6'], ['拓扑变化', '0']],
    note: '线框显示的不是重建后的近似表面，而是贯穿整个计算流程、从未改变的原始连接关系。',
  },
];

const state = {
  step: 0,
  ready: false,
  verified: false,
  transition: 1,
  transitionId: 0,
  currentPositions: null,
  currentNormals: null,
  currentJoints: null,
  startPositions: null,
  startNormals: null,
  startJoints: null,
  targetPositions: null,
  targetNormals: null,
  targetJoints: null,
  stages: null,
  manifest: null,
  renderer: null,
  animationFrame: null,
};

window.__GNM_PRINCIPLES__ = state;

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
  uniform float uColorMix;
  uniform float uWire;
  uniform float uAlpha;
  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing) normal *= -1.0;
    vec3 keyLight = normalize(vec3(-0.5, 0.72, 0.85));
    vec3 fillLight = normalize(vec3(0.68, -0.18, 0.42));
    float key = max(dot(normal, keyLight), 0.0);
    float fill = max(dot(normal, fillLight), 0.0);
    float rim = pow(1.0 - abs(normal.z), 2.2);
    float vertical = smoothstep(-0.88, 0.45, vPosition.y);
    vec3 neutral = mix(vec3(0.30, 0.31, 0.28), vec3(0.78, 0.72, 0.63), vertical);
    vec3 base = mix(neutral, vColor, uColorMix);
    vec3 shaded = base * (0.31 + key * 0.68 + fill * 0.12);
    shaded += vec3(0.36, 0.50, 0.39) * rim * 0.22;
    vec3 wireColor = vec3(0.79, 1.0, 0.26);
    gl_FragColor = vec4(mix(shaded, wireColor, uWire), uAlpha);
  }
`;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;
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

function computeNormals(positions, indices) {
  const normals = new Float32Array(positions.length);
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index] * 3;
    const b = indices[index + 1] * 3;
    const c = indices[index + 2] * 3;
    const abx = positions[b] - positions[a];
    const aby = positions[b + 1] - positions[a + 1];
    const abz = positions[b + 2] - positions[a + 2];
    const acx = positions[c] - positions[a];
    const acy = positions[c + 1] - positions[a + 1];
    const acz = positions[c + 2] - positions[a + 2];
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    for (const offset of [a, b, c]) {
      normals[offset] += nx;
      normals[offset + 1] += ny;
      normals[offset + 2] += nz;
    }
  }
  for (let index = 0; index < normals.length; index += 3) {
    const length = Math.hypot(normals[index], normals[index + 1], normals[index + 2]) || 1;
    normals[index] /= length;
    normals[index + 1] /= length;
    normals[index + 2] /= length;
  }
  return normals;
}

function addScaled(target, delta, weight, offset = 0) {
  for (let index = 0; index < target.length; index += 1) {
    target[index] += delta[offset + index] * weight;
  }
}

function buildStages(arrays, manifest) {
  const stride = arrays.templatePositions.length;
  const mean = new Float32Array(arrays.templatePositions);
  const identity = new Float32Array(mean);
  const identityIndex = manifest.principlePoseBase.identityIndex;
  addScaled(identity, arrays.identityDeltas, manifest.principlePoseBase.identityStrength, identityIndex * stride);

  const expression = new Float32Array(identity);
  manifest.principlePoseBase.expressionWeights.forEach((weight, index) => {
    addScaled(expression, arrays.expressionDeltas, weight, index * stride);
  });

  const pose = new Float32Array(expression);
  addScaled(pose, arrays.principlePoseDelta, 1);

  const positions = [mean, identity, expression, pose, new Float32Array(pose)];
  const normals = positions.map(stage => computeNormals(stage, arrays.triangleIndices));
  const bindJoints = new Float32Array(arrays.principleBindJoints);
  const posedJoints = new Float32Array(arrays.principlePosedJoints);

  return positions.map((stagePositions, index) => ({
    positions: stagePositions,
    normals: normals[index],
    joints: index >= 3 ? posedJoints : bindJoints,
  }));
}

async function loadAsset() {
  const manifestResponse = await fetch(ASSET_MANIFEST_URL, { cache: 'no-store' });
  if (!manifestResponse.ok) throw new Error(`Manifest request failed: ${manifestResponse.status}`);
  const manifest = await manifestResponse.json();
  if (manifest.format !== 'gnm-head-explorer-v1') throw new Error('Unknown GNM asset format');

  const binaryUrl = new URL(`./assets/${manifest.binary}`, location.href);
  const binaryResponse = await fetch(binaryUrl, { cache: 'no-store' });
  if (!binaryResponse.ok) throw new Error(`Model request failed: ${binaryResponse.status}`);
  const buffer = await binaryResponse.arrayBuffer();
  if (buffer.byteLength !== manifest.binaryByteLength) throw new Error('Model payload length mismatch');

  if (crypto?.subtle) {
    const digest = hex(await crypto.subtle.digest('SHA-256', buffer));
    if (digest !== manifest.binarySha256) throw new Error('Model payload checksum mismatch');
    state.verified = true;
  }

  const arrays = Object.fromEntries(
    Object.entries(manifest.arrays).map(([name, descriptor]) => [name, typedArray(buffer, descriptor)])
  );
  return { manifest, arrays };
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

class PrincipleRenderer {
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
      colorMix: gl.getUniformLocation(this.program, 'uColorMix'),
      wire: gl.getUniformLocation(this.program, 'uWire'),
      alpha: gl.getUniformLocation(this.program, 'uAlpha'),
    };

    this.positionBuffer = this.createArrayBuffer(state.currentPositions, gl.DYNAMIC_DRAW);
    this.normalBuffer = this.createArrayBuffer(state.currentNormals, gl.DYNAMIC_DRAW);
    this.colorBuffer = this.createArrayBuffer(arrays.componentColors, gl.STATIC_DRAW);
    this.triangleBuffer = this.createElementBuffer(arrays.triangleIndices);
    this.edgeBuffer = this.createElementBuffer(arrays.edgeIndices);

    gl.useProgram(this.program);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.073, 0.086, 0.076, 1);
    this.bindAttributes();

    this.resizeObserver = new ResizeObserver(() => requestRender());
    this.resizeObserver.observe(targetCanvas);
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

  uploadGeometry() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, state.currentPositions);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, state.currentNormals);
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  render() {
    const gl = this.gl;
    this.resize();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    this.bindAttributes();

    const aspect = this.canvas.width / this.canvas.height;
    const projection = perspective((34 * Math.PI) / 180, aspect, 0.1, 20);
    const view = translation(0, -0.01, -3.35);
    const model = matrixMultiply(rotationY(-0.08), rotationX(-0.02));
    const mvp = matrixMultiply(matrixMultiply(projection, view), model);
    gl.uniformMatrix4fv(this.locations.mvp, false, mvp);
    gl.uniformMatrix4fv(this.locations.model, false, model);
    gl.uniform1f(this.locations.colorMix, state.step === 4 ? 0.5 : 0.05);
    gl.uniform1f(this.locations.wire, 0);
    gl.uniform1f(this.locations.alpha, 1);
    gl.depthMask(true);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.drawElements(gl.TRIANGLES, this.arrays.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

    if (state.step === 4) {
      gl.uniform1f(this.locations.colorMix, 0);
      gl.uniform1f(this.locations.wire, 1);
      gl.uniform1f(this.locations.alpha, 0.31);
      gl.depthMask(false);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeBuffer);
      gl.drawElements(gl.LINES, this.arrays.edgeIndices.length, gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true);
    }

    updateJointOverlay(mvp);
  }
}

function projectPoint(mvp, x, y, z) {
  const clipX = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
  const clipY = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
  const clipW = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];
  return {
    x: (clipX / clipW * 0.5 + 0.5) * 100,
    y: (1 - (clipY / clipW * 0.5 + 0.5)) * 100,
  };
}

function updateJointOverlay(mvp) {
  if (!state.currentJoints || !state.manifest) return;
  const points = [];
  for (let index = 0; index < state.currentJoints.length; index += 3) {
    points.push(projectPoint(
      mvp,
      state.currentJoints[index],
      state.currentJoints[index + 1],
      state.currentJoints[index + 2]
    ));
  }

  const labels = ['NECK', 'HEAD', 'L·EYE', 'R·EYE'];
  jointLines.replaceChildren();
  jointPoints.replaceChildren();
  state.manifest.jointParentIndices.forEach((parent, index) => {
    if (parent < 0) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', points[parent].x);
    line.setAttribute('y1', points[parent].y);
    line.setAttribute('x2', points[index].x);
    line.setAttribute('y2', points[index].y);
    jointLines.append(line);
  });
  points.forEach((point, index) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', point.x);
    circle.setAttribute('cy', point.y);
    circle.setAttribute('r', index < 2 ? 0.72 : 0.5);
    jointPoints.append(circle);
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', point.x + 1.25);
    label.setAttribute('y', point.y - 0.8);
    label.textContent = labels[index] || state.manifest.jointNames[index];
    jointPoints.append(label);
  });
}

function updateExplanation(stepIndex) {
  const step = STEPS[stepIndex];
  stepButtons.forEach(button => {
    const active = Number(button.dataset.step) === stepIndex;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  formulaTerms.forEach(term => term.classList.toggle('is-active', term.dataset.formula === step.formula));
  stageMode.textContent = step.mode;
  stepCount.textContent = `STEP ${String(stepIndex).padStart(2, '0')} / 04`;
  stepTitle.textContent = step.title;
  stepBody.textContent = step.body;
  stepEquation.innerHTML = step.equation;
  stepFacts.replaceChildren(...step.facts.map(([label, value]) => {
    const wrapper = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value;
    wrapper.append(term, detail);
    return wrapper;
  }));
  stepNote.textContent = step.note;
  jointOverlay.classList.toggle('is-visible', stepIndex === 3);
}

function interpolate(target, from, to, progress) {
  for (let index = 0; index < target.length; index += 1) {
    target[index] = from[index] + (to[index] - from[index]) * progress;
  }
}

function renderFrame() {
  state.animationFrame = null;
  state.renderer.uploadGeometry();
  state.renderer.render();
}

function requestRender() {
  if (!state.renderer || state.animationFrame !== null) return;
  state.animationFrame = requestAnimationFrame(renderFrame);
}

function selectStep(stepIndex, animate = true) {
  if (!state.ready || !state.stages[stepIndex]) return;
  const transitionId = ++state.transitionId;
  state.step = stepIndex;
  updateExplanation(stepIndex);

  state.startPositions = new Float32Array(state.currentPositions);
  state.startNormals = new Float32Array(state.currentNormals);
  state.startJoints = new Float32Array(state.currentJoints);
  state.targetPositions = state.stages[stepIndex].positions;
  state.targetNormals = state.stages[stepIndex].normals;
  state.targetJoints = state.stages[stepIndex].joints;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!animate || reducedMotion) {
    state.currentPositions.set(state.targetPositions);
    state.currentNormals.set(state.targetNormals);
    state.currentJoints.set(state.targetJoints);
    state.transition = 1;
    stageProof.textContent = state.verified ? 'SHA-256 VERIFIED / READY' : 'LOCAL MODEL / READY';
    requestRender();
    return;
  }

  const startedAt = performance.now();
  stageProof.textContent = `COMPUTING STEP ${String(stepIndex).padStart(2, '0')}`;
  const tick = now => {
    if (transitionId !== state.transitionId) return;
    const linearProgress = clamp((now - startedAt) / 620, 0, 1);
    const progress = easeInOutCubic(linearProgress);
    state.transition = progress;
    interpolate(state.currentPositions, state.startPositions, state.targetPositions, progress);
    interpolate(state.currentNormals, state.startNormals, state.targetNormals, progress);
    interpolate(state.currentJoints, state.startJoints, state.targetJoints, progress);
    requestRender();
    if (linearProgress < 1) {
      requestAnimationFrame(tick);
    } else {
      stageProof.textContent = state.verified ? 'SHA-256 VERIFIED / READY' : 'LOCAL MODEL / READY';
    }
  };
  requestAnimationFrame(tick);
}

function bindSteps() {
  stepButtons.forEach(button => {
    button.addEventListener('click', () => selectStep(Number(button.dataset.step)));
  });
}

function showFailure(error) {
  console.error(error);
  stageProof.textContent = `MODEL ERROR / ${error.message}`;
  stageMode.textContent = 'LOAD FAILED';
}

async function start() {
  try {
    const { manifest, arrays } = await loadAsset();
    state.manifest = manifest;
    state.stages = buildStages(arrays, manifest);
    state.currentPositions = new Float32Array(state.stages[0].positions);
    state.currentNormals = new Float32Array(state.stages[0].normals);
    state.currentJoints = new Float32Array(state.stages[0].joints);
    state.renderer = new PrincipleRenderer(canvas, manifest, arrays);
    state.ready = true;
    bindSteps();
    updateExplanation(0);
    stageProof.textContent = state.verified ? 'SHA-256 VERIFIED / READY' : 'LOCAL MODEL / READY';
    state.renderer.uploadGeometry();
    state.renderer.render();
  } catch (error) {
    showFailure(error);
  }
}

start();
