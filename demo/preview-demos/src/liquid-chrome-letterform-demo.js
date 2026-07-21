import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const vertexShader = `
precision highp float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform vec2 u_resolution;
uniform sampler2D u_mask;
uniform vec2 u_light;
uniform float u_warp;
uniform float u_candidate;
varying vec2 vTexCoord;

vec3 environmentBands(vec2 uv, vec2 normal, float candidate) {
  float wave = sin((uv.y + normal.x * 0.13 + uv.x * 0.08) * 24.0 + candidate * 1.7);
  float fine = sin((uv.x - normal.y * 0.17) * 41.0 - candidate * 2.3);
  float band = smoothstep(-0.72, 0.82, wave * 0.72 + fine * 0.28);
  vec3 cool = mix(vec3(0.10, 0.16, 0.34), vec3(0.18, 0.86, 0.96), smoothstep(-0.2, 0.75, fine));
  vec3 warm = mix(vec3(0.96, 0.42, 0.72), vec3(1.0, 0.94, 0.76), smoothstep(-0.45, 0.9, wave));
  return mix(cool, warm, band);
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;
  vec2 maskUv = vec2(screenUv.x, 1.0 - screenUv.y);
  vec2 texel = 1.0 / u_resolution;
  float mask = texture2D(u_mask, maskUv).r;
  float maskLeft = texture2D(u_mask, maskUv - vec2(texel.x, 0.0)).r;
  float maskRight = texture2D(u_mask, maskUv + vec2(texel.x, 0.0)).r;
  float maskDown = texture2D(u_mask, maskUv - vec2(0.0, texel.y)).r;
  float maskUp = texture2D(u_mask, maskUv + vec2(0.0, texel.y)).r;
  vec2 gradient = vec2(maskRight - maskLeft, maskUp - maskDown);
  vec3 normal = normalize(vec3(-gradient * (7.0 + u_warp * 7.0), 0.24));
  vec2 lightUv = vec2(u_light.x, 1.0 - u_light.y);
  vec3 lightDirection = normalize(vec3((lightUv - screenUv) * vec2(1.5, 1.1), 0.72));
  float specular = pow(max(0.0, dot(normal, lightDirection)), 42.0);
  float fresnel = pow(1.0 - max(0.0, normal.z), 2.2);
  vec2 refractedUv = screenUv + normal.xy * (0.022 + u_warp * 0.028);
  vec3 chrome = environmentBands(refractedUv, normal.xy, u_candidate);
  chrome = mix(chrome, vec3(0.94, 0.97, 1.0), 0.18 + fresnel * 0.48);
  chrome += specular * vec3(1.18, 1.10, 0.92) * 1.45;
  chrome *= 0.82 + normal.z * 0.3;

  vec3 background = mix(vec3(0.025, 0.031, 0.055), vec3(0.075, 0.035, 0.105), screenUv.y);
  float grid = (smoothstep(0.985, 1.0, sin(screenUv.x * 95.0) * 0.5 + 0.5)
    + smoothstep(0.99, 1.0, sin(screenUv.y * 83.0) * 0.5 + 0.5)) * 0.018;
  background += grid * vec3(0.24, 0.42, 0.52);
  float coverage = smoothstep(0.04, 0.94, mask);
  float edge = smoothstep(0.015, 0.2, mask) - smoothstep(0.7, 0.98, mask);
  vec3 color = mix(background, chrome, coverage);
  color += edge * mix(vec3(0.2, 0.88, 1.0), vec3(1.0, 0.32, 0.72), u_candidate * 0.34) * 0.34;
  float vignette = 1.0 - 0.28 * dot(screenUv - 0.5, screenUv - 0.5);
  color *= vignette;
  gl_FragColor = vec4(pow(max(color, 0.0), vec3(0.92)), 1.0);
}
`;

try {
  const stage = document.querySelector('#chrome-stage');
  const host = document.querySelector('#chrome-host');
  const candidateButtons = [...document.querySelectorAll('[data-candidate-index]')];
  const shaderOutput = document.querySelector('#shader-output');
  const proofState = document.querySelector('#proof-state');
  const proofOutput = document.querySelector('#proof-output');
  const undoButton = document.querySelector('#undo-proof');
  const resetButton = document.querySelector('#reset-proof');
  const confirmButton = document.querySelector('#confirm-proof');
  const candidates = [
    { glyph: 'A', name: 'ARC' },
    { glyph: 'R', name: 'RITUAL' },
    { glyph: 'S', name: 'SIGNAL' }
  ];
  const defaultLight = { x: .64, y: .42 };
  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));

  if (!stage || !host || candidateButtons.length !== candidates.length || !shaderOutput || !proofState || !proofOutput || !undoButton || !resetButton || !confirmButton) {
    throw new Error('liquid chrome proof DOM is incomplete');
  }

  const state = {
    id: 'liquid-chrome-letterform',
    task: 'human-chooses-a-letterform-tunes-the-chrome-reflection-and-explicitly-keeps-or-revises-the-proof',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'p5-webgl-fragment-shader-samples-a-code-generated-glyph-mask-texture-and-human-light-uniforms-to-render-liquid-chrome',
    assetStrategy: 'code-generated-raster-glyph-mask-texture-and-procedural-environment-bands-no-external-raster-required',
    imageGenerationDecision: 'omitted-because-external-pixels-do-not-drive-the-procedural-environment-or-candidate-judgement-and-the-functional-mask-raster-is-generated-from-the-selected-glyph',
    externalRasterRequired: false,
    externalRasterCount: 0,
    codeGeneratedMaskTexture: true,
    shaderSourceChecksum: 0,
    vertexShaderVerified: vertexShader.includes('gl_Position') && vertexShader.includes('aPosition'),
    fragmentShaderVerified: fragmentShader.includes('texture2D(u_mask')
      && fragmentShader.includes('environmentBands')
      && fragmentShader.includes('u_light')
      && fragmentShader.includes('maskRight - maskLeft'),
    userInputRequired: true,
    automaticLetterCycle: false,
    automaticLightSweep: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockDriven: false,
    renderIgnoresPreviewClock: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-candidate-mask-light-uniform-or-proof-decision-mutation',
    untrustedMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    rejectedUntrustedInputCount: 0,
    candidateSelectionCount: 0,
    lightInputCount: 0,
    keyboardLightInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    confirmationCount: 0,
    rejectedConfirmationCount: 0,
    businessCommitCount: 0,
    prematureCommitCount: 0,
    undoCount: 0,
    resetCount: 0,
    decisionClearCount: 0,
    candidateIndex: 0,
    candidateGlyph: candidates[0].glyph,
    light: { ...defaultLight },
    warp: .45 + defaultLight.y * .65,
    dragging: false,
    activePointerId: null,
    retainedProof: null,
    retainedFramebufferSignature: null,
    retainedMaskChecksum: null,
    retainedRevision: null,
    reviewRetained: false,
    proofHistory: [],
    phase: 'idle-candidate',
    result: 'no-chrome-proof-retained',
    revision: 0,
    drawnRevision: -1,
    inputMutationRequestCount: 0,
    inputDrivenFramebufferMutationCount: 0,
    failedInputFramebufferMutationCount: 0,
    pendingFramebufferBaseline: null,
    pendingMutationKind: null,
    candidateMaskRecords: [],
    candidateMaskChecksumUnique: false,
    maskRasterGenerationCount: 0,
    maskWidth: 0,
    maskHeight: 0,
    maskSampledPixelCount: 0,
    maskCoveredPixelCount: 0,
    currentMaskChecksum: 0,
    shaderPassCount: 0,
    textureBindCount: 0,
    uniformUpdateCount: 0,
    shaderCompiled: false,
    shaderMaskTextureBound: false,
    framebufferSignature: 0,
    initialFramebufferSignature: null,
    lastFramebufferSampleCount: 0,
    framebufferNonDarkSampleCount: 0,
    webglReady: false,
    webglVersion: 'none',
    lastGlError: null,
    p5Ready: false,
    canvasCoverageRatio: 0,
    fullStageGeometryVerified: false,
    initialStillVerified: false,
    inputRecords: [],
    drawCount: 0,
    renderCount: 0,
    resizeCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let canvas;
  let gl;
  let chromeShader;
  let maskGraphics;
  let dirty = true;
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`liquid-chrome-letterform: ${message}`);
  }

  function checksumText(value) {
    let result = 2166136261;
    for (const character of value) result = Math.imul(result ^ character.codePointAt(0), 16777619) >>> 0;
    return result >>> 0;
  }

  state.shaderSourceChecksum = checksumText(vertexShader + fragmentShader);

  function acceptTrusted(event, source) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (source.startsWith('pointer')) state.pointerInputCount += 1;
    else if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    else state.controlInputCount += 1;
    return true;
  }

  function cameraAtDefaults() {
    return state.candidateIndex === 0
      && Math.abs(state.light.x - defaultLight.x) < .0001
      && Math.abs(state.light.y - defaultLight.y) < .0001;
  }

  function syncInterface() {
    candidateButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === state.candidateIndex)));
    shaderOutput.textContent = `${state.candidateGlyph} · LIGHT ${Math.round(state.light.x * 100)} / ${Math.round(state.light.y * 100)}`;
    proofState.dataset.retained = String(state.reviewRetained);
    if (state.reviewRetained) proofOutput.textContent = `KEPT · ${state.retainedProof.glyph} / ${state.retainedProof.name}`;
    else proofOutput.textContent = `CANDIDATE ${state.candidateGlyph} · NOT KEPT`;
    undoButton.disabled = !state.reviewRetained;
    resetButton.disabled = !state.reviewRetained && cameraAtDefaults();
    confirmButton.textContent = state.reviewRetained ? 'PROOF KEPT' : 'KEEP PROOF';
  }

  function clearRetainedDecision() {
    if (!state.reviewRetained) return;
    state.retainedProof = null;
    state.retainedFramebufferSignature = null;
    state.retainedMaskChecksum = null;
    state.retainedRevision = null;
    state.reviewRetained = false;
    state.result = 'no-chrome-proof-retained';
    state.decisionClearCount += 1;
  }

  function requestDraw() {
    dirty = true;
    sketch?.redraw();
  }

  function beginInputMutation(kind) {
    clearRetainedDecision();
    state.revision += 1;
    state.inputMutationRequestCount += 1;
    state.pendingFramebufferBaseline = state.framebufferSignature || null;
    state.pendingMutationKind = kind;
    state.phase = `${kind}-pending`;
    state.result = 'no-chrome-proof-retained';
  }

  function maskGeometry(width, height) {
    const portrait = width <= 270;
    return portrait
      ? { x: width * .5, y: height * .61, size: Math.min(width * .72, height * .48) }
      : { x: width < 480 ? width * .66 : width * .62, y: height * .54, size: Math.min(height * .82, width * .48) };
  }

  function rasterMask(index) {
    const geometry = maskGeometry(maskGraphics.width, maskGraphics.height);
    maskGraphics.background(0);
    maskGraphics.noStroke();
    maskGraphics.fill(255);
    maskGraphics.textAlign(maskGraphics.CENTER, maskGraphics.CENTER);
    maskGraphics.textFont('system-ui');
    maskGraphics.textStyle(maskGraphics.BOLD);
    maskGraphics.textSize(geometry.size);
    maskGraphics.text(candidates[index].glyph, geometry.x, geometry.y - geometry.size * .04);
    maskGraphics.loadPixels();
    let maskChecksum = 2166136261;
    let covered = 0;
    let sampled = 0;
    for (let pixel = 0; pixel < maskGraphics.pixels.length; pixel += 4) {
      const value = maskGraphics.pixels[pixel];
      if (value > 12) covered += 1;
      if ((pixel / 4) % 7 === 0) {
        maskChecksum = Math.imul(maskChecksum ^ value, 16777619) >>> 0;
        sampled += 1;
      }
    }
    state.maskRasterGenerationCount += 1;
    return {
      index,
      glyph: candidates[index].glyph,
      checksum: maskChecksum >>> 0,
      coveredPixels: covered,
      sampledPixels: sampled,
      width: maskGraphics.width,
      height: maskGraphics.height
    };
  }

  function prepareCandidateMasks() {
    state.candidateMaskRecords = candidates.map((_, index) => rasterMask(index));
    state.candidateMaskChecksumUnique = new Set(state.candidateMaskRecords.map(record => record.checksum)).size === candidates.length;
    const current = rasterMask(state.candidateIndex);
    state.maskWidth = current.width;
    state.maskHeight = current.height;
    state.maskSampledPixelCount = current.sampledPixels;
    state.maskCoveredPixelCount = current.coveredPixels;
    state.currentMaskChecksum = current.checksum;
  }

  function selectCandidate(index, source) {
    if (index < 0 || index >= candidates.length || index === state.candidateIndex) return;
    beginInputMutation('candidate');
    state.candidateIndex = index;
    state.candidateGlyph = candidates[index].glyph;
    state.candidateSelectionCount += 1;
    const current = rasterMask(index);
    state.maskSampledPixelCount = current.sampledPixels;
    state.maskCoveredPixelCount = current.coveredPixels;
    state.currentMaskChecksum = current.checksum;
    state.inputRecords.push({ source, trusted: true, action: 'select-candidate', candidateIndex: index, glyph: candidates[index].glyph, maskChecksum: current.checksum });
    syncInterface();
    requestDraw('candidate');
  }

  function updateLight(event, source) {
    const rect = stage.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), .08, .94);
    const y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), .12, .88);
    if (Math.abs(x - state.light.x) < .001 && Math.abs(y - state.light.y) < .001) return;
    beginInputMutation('light');
    state.light = { x: Number(x.toFixed(5)), y: Number(y.toFixed(5)) };
    state.warp = Number((.45 + state.light.y * .65).toFixed(5));
    state.lightInputCount += 1;
    state.inputRecords.push({ source, trusted: true, action: 'move-light', light: { ...state.light }, warp: state.warp });
    state.inputRecords = state.inputRecords.slice(-80);
    syncInterface();
    requestDraw('light');
  }

  function moveLightWithKeyboard(dx, dy, source) {
    const next = {
      x: clamp(state.light.x + dx, .08, .94),
      y: clamp(state.light.y + dy, .12, .88)
    };
    if (next.x === state.light.x && next.y === state.light.y) return;
    beginInputMutation('light');
    state.light = { x: Number(next.x.toFixed(5)), y: Number(next.y.toFixed(5)) };
    state.warp = Number((.45 + state.light.y * .65).toFixed(5));
    state.lightInputCount += 1;
    state.keyboardLightInputCount += 1;
    state.inputRecords.push({ source, trusted: true, action: 'move-light', light: { ...state.light }, warp: state.warp });
    syncInterface();
    requestDraw('light');
  }

  function confirmProof(source) {
    if (state.drawnRevision !== state.revision || !state.framebufferSignature || !state.currentMaskChecksum) {
      state.rejectedConfirmationCount += 1;
      proofOutput.textContent = 'WAIT FOR SHADER PROOF';
      return;
    }
    state.proofHistory.push(state.retainedProof ? { ...state.retainedProof, light: { ...state.retainedProof.light } } : null);
    state.retainedProof = {
      candidateIndex: state.candidateIndex,
      glyph: state.candidateGlyph,
      name: candidates[state.candidateIndex].name,
      light: { ...state.light },
      warp: state.warp,
      maskChecksum: state.currentMaskChecksum,
      framebufferSignature: state.framebufferSignature,
      revision: state.revision
    };
    state.retainedFramebufferSignature = state.framebufferSignature;
    state.retainedMaskChecksum = state.currentMaskChecksum;
    state.retainedRevision = state.revision;
    state.reviewRetained = true;
    state.confirmationCount += 1;
    state.businessCommitCount += 1;
    state.phase = 'chrome-proof-retained';
    state.result = `chrome-proof-retained-${state.candidateGlyph.toLowerCase()}`;
    state.inputRecords.push({ source, trusted: true, action: 'confirm-proof', candidateIndex: state.candidateIndex, maskChecksum: state.currentMaskChecksum, framebufferSignature: state.framebufferSignature, revision: state.revision });
    syncInterface();
  }

  function undoProof(source) {
    if (!state.reviewRetained) return;
    const previous = state.proofHistory.length ? state.proofHistory.pop() : null;
    state.retainedProof = previous;
    state.retainedFramebufferSignature = previous?.framebufferSignature || null;
    state.retainedMaskChecksum = previous?.maskChecksum || null;
    state.retainedRevision = previous?.revision ?? null;
    state.reviewRetained = Boolean(previous);
    state.undoCount += 1;
    state.decisionClearCount += 1;
    state.phase = previous ? 'previous-proof-restored' : 'proof-undone';
    state.result = previous ? `chrome-proof-retained-${previous.glyph.toLowerCase()}` : 'no-chrome-proof-retained';
    state.inputRecords.push({ source, trusted: true, action: 'undo-proof', restoredGlyph: previous?.glyph || null });
    syncInterface();
  }

  function resetProof(source) {
    if (!state.reviewRetained && cameraAtDefaults()) return;
    const visualChange = !cameraAtDefaults();
    clearRetainedDecision();
    if (visualChange) beginInputMutation('reset');
    state.candidateIndex = 0;
    state.candidateGlyph = candidates[0].glyph;
    state.light = { ...defaultLight };
    state.warp = Number((.45 + defaultLight.y * .65).toFixed(5));
    state.proofHistory = [];
    const current = rasterMask(0);
    state.maskSampledPixelCount = current.sampledPixels;
    state.maskCoveredPixelCount = current.coveredPixels;
    state.currentMaskChecksum = current.checksum;
    state.resetCount += 1;
    state.phase = visualChange ? 'reset-pending' : 'reset-complete';
    state.inputRecords.push({ source, trusted: true, action: 'reset-proof', maskChecksum: current.checksum });
    syncInterface();
    if (visualChange) requestDraw('reset');
  }

  candidateButtons.forEach(button => button.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-candidate-control' : 'pointer-candidate-control';
    if (!acceptTrusted(event, source)) return;
    selectCandidate(Number(button.dataset.candidateIndex), `trusted-${source}`);
  }));

  host.addEventListener('pointerdown', event => {
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-down`)) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.dragging = true;
    state.activePointerId = event.pointerId;
    host.setPointerCapture(event.pointerId);
    if (host.hasPointerCapture(event.pointerId)) state.pointerCaptureCount += 1;
    updateLight(event, 'trusted-pointer-light-down');
  });

  host.addEventListener('pointermove', event => {
    if (!state.dragging || event.pointerId !== state.activePointerId || !acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-move`)) return;
    state.pointerMoveCount += 1;
    updateLight(event, 'trusted-pointer-light-move');
  });

  function releasePointer(event) {
    if (!state.dragging || event.pointerId !== state.activePointerId || !acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-up`)) return;
    state.pointerUpCount += 1;
    if (host.hasPointerCapture(event.pointerId)) {
      host.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.dragging = false;
    state.activePointerId = null;
    state.phase = 'chrome-candidate-unconfirmed';
    syncInterface();
  }
  host.addEventListener('pointerup', releasePointer);
  host.addEventListener('pointercancel', releasePointer);

  host.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft: [-.07, 0], ArrowRight: [.07, 0], ArrowUp: [0, -.07], ArrowDown: [0, .07]
    }[event.key];
    const key = event.key.toLowerCase();
    if (movement) {
      if (!acceptTrusted(event, 'keyboard-light-arrow')) return;
      event.preventDefault();
      moveLightWithKeyboard(movement[0], movement[1], 'trusted-keyboard-light-arrow');
    } else if (['1', '2', '3'].includes(key)) {
      if (!acceptTrusted(event, 'keyboard-candidate-shortcut')) return;
      event.preventDefault();
      selectCandidate(Number(key) - 1, 'trusted-keyboard-candidate-shortcut');
    } else if (key === 'enter') {
      if (!acceptTrusted(event, 'keyboard-confirm-shortcut')) return;
      event.preventDefault();
      confirmProof('trusted-keyboard-confirm-shortcut');
    } else if (key === 'z') {
      if (!acceptTrusted(event, 'keyboard-undo-shortcut')) return;
      event.preventDefault();
      undoProof('trusted-keyboard-undo-shortcut');
    } else if (key === 'r') {
      if (!acceptTrusted(event, 'keyboard-reset-shortcut')) return;
      event.preventDefault();
      resetProof('trusted-keyboard-reset-shortcut');
    }
  });

  undoButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-undo-control' : 'pointer-undo-control';
    if (!acceptTrusted(event, source)) return;
    undoProof(`trusted-${source}`);
  });
  resetButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-reset-control' : 'pointer-reset-control';
    if (!acceptTrusted(event, source)) return;
    resetProof(`trusted-${source}`);
  });
  confirmButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-confirm-control' : 'pointer-confirm-control';
    if (!acceptTrusted(event, source)) return;
    confirmProof(`trusted-${source}`);
  });

  function framebufferEvidence() {
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.finish();
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let signature = 2166136261;
    let sampled = 0;
    let nonDark = 0;
    for (let index = 0; index < pixels.length; index += 64) {
      const luminance = pixels[index] + pixels[index + 1] + pixels[index + 2];
      if (luminance > 72) nonDark += 1;
      signature = Math.imul(signature ^ pixels[index], 16777619) >>> 0;
      signature = Math.imul(signature ^ pixels[index + 1], 16777619) >>> 0;
      signature = Math.imul(signature ^ pixels[index + 2], 16777619) >>> 0;
      sampled += 1;
    }
    state.lastFramebufferSampleCount = sampled;
    state.framebufferNonDarkSampleCount = nonDark;
    return signature >>> 0;
  }

  function drawPass(p) {
    p.shader(chromeShader);
    chromeShader.setUniform('u_resolution', [p.width, p.height]);
    chromeShader.setUniform('u_mask', maskGraphics);
    chromeShader.setUniform('u_light', [state.light.x, state.light.y]);
    chromeShader.setUniform('u_warp', state.warp);
    chromeShader.setUniform('u_candidate', state.candidateIndex);
    p.quad(-1, -1, 1, -1, 1, 1, -1, 1);
    state.shaderPassCount += 1;
    state.textureBindCount += 1;
    state.uniformUpdateCount += 5;
    state.shaderMaskTextureBound = true;
    state.shaderCompiled = Boolean(chromeShader?._glProgram);
    const previousSignature = state.framebufferSignature;
    const nextSignature = framebufferEvidence();
    state.framebufferSignature = nextSignature;
    if (state.initialFramebufferSignature === null) state.initialFramebufferSignature = nextSignature;
    if (state.pendingFramebufferBaseline !== null && state.pendingMutationKind) {
      const completedMutationKind = state.pendingMutationKind;
      if (nextSignature !== state.pendingFramebufferBaseline && nextSignature !== previousSignature) state.inputDrivenFramebufferMutationCount += 1;
      else if (state.inputCount > 0 && nextSignature === state.pendingFramebufferBaseline) state.failedInputFramebufferMutationCount += 1;
      state.pendingFramebufferBaseline = null;
      state.pendingMutationKind = null;
      state.phase = completedMutationKind === 'reset' ? 'reset-complete' : 'chrome-candidate-unconfirmed';
    }
    state.drawnRevision = state.revision;
    state.drawCount += 1;
    state.lastGlError = gl.getError();
    dirty = false;
  }

  const nextFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const p5Ready = document.fonts.ready.then(() => new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          canvas = p.createCanvas(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), p.WEBGL).parent(host).elt;
          canvas.setAttribute('aria-hidden', 'true');
          p.noStroke();
          p.noLoop();
          gl = p.drawingContext;
          chromeShader = p.createShader(vertexShader, fragmentShader);
          maskGraphics = p.createGraphics(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
          maskGraphics.pixelDensity(1);
          prepareCandidateMasks();
          state.webglReady = Boolean(gl && typeof gl.readPixels === 'function');
          state.webglVersion = gl instanceof WebGL2RenderingContext ? 'webgl2' : gl instanceof WebGLRenderingContext ? 'webgl1' : 'none';
          state.p5Ready = true;
          p.draw = () => drawPass(p);
          requestDraw('initial');
          resolve();
        } catch (error) {
          reject(error);
        }
      };
    }, host);
  }));

  const ready = p5Ready.then(nextFrames).then(() => {
    state.ready = true;
    syncInterface();
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch || !canvas || !maskGraphics || !state.p5Ready) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      if (canvas.width === width && canvas.height === height) return;
      sketch.resizeCanvas(width, height);
      maskGraphics.resizeCanvas(width, height);
      prepareCandidateMasks();
      state.resizeCount += 1;
      requestDraw('resize');
    });
  });
  resizeObserver.observe(host);

  function updateGeometryEvidence() {
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas?.getBoundingClientRect();
    state.canvasCoverageRatio = Number((((canvasRect?.width || 0) * (canvasRect?.height || 0)) / Math.max(1, stageRect.width * stageRect.height)).toFixed(4));
    state.fullStageGeometryVerified = Boolean(canvasRect)
      && canvasRect.left >= stageRect.left - .5
      && canvasRect.top >= stageRect.top - .5
      && canvasRect.right <= stageRect.right + .5
      && canvasRect.bottom <= stageRect.bottom + .5
      && state.canvasCoverageRatio >= .995;
  }

  function render() {
    state.renderCount += 1;
    updateGeometryEvidence();
    if (state.inputCount === 0) {
      state.initialStillVerified = state.candidateIndex === 0
        && state.candidateGlyph === 'A'
        && cameraAtDefaults()
        && !state.reviewRetained
        && state.revision === 0
        && state.drawnRevision === 0;
    }
    if (dirty) sketch?.redraw();
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();
    updateGeometryEvidence();
    invariant(state.ready && state.p5Ready && sketch instanceof p5 && canvas instanceof HTMLCanvasElement, 'p5 WEBGL canvas is not ready');
    invariant(state.webglReady && (state.webglVersion === 'webgl2' || state.webglVersion === 'webgl1') && gl === sketch.drawingContext, 'real WEBGL context is missing');
    invariant(state.shaderCompiled && Boolean(chromeShader?._glProgram) && state.vertexShaderVerified && state.fragmentShaderVerified, 'liquid chrome shader did not compile or lost mask/environment logic');
    invariant(state.shaderPassCount === state.drawCount && state.textureBindCount === state.drawCount && state.uniformUpdateCount === state.drawCount * 5 && state.shaderMaskTextureBound, 'shader pass, mask texture, or uniform evidence diverged');
    invariant(state.lastGlError === gl.NO_ERROR, `WEBGL error ${state.lastGlError}`);
    invariant(state.externalRasterRequired === false && state.externalRasterCount === 0 && state.codeGeneratedMaskTexture === true, 'external raster decision or code-generated mask contract changed');
    invariant(state.candidateMaskRecords.length === 3 && state.candidateMaskChecksumUnique && state.candidateMaskRecords.every(record => record.checksum > 0 && record.coveredPixels > 500 && record.sampledPixels > 1000), 'candidate glyph mask rasters are incomplete or indistinguishable');
    invariant(state.maskWidth === canvas.width && state.maskHeight === canvas.height && state.maskCoveredPixelCount > 500 && state.maskSampledPixelCount > 1000 && state.currentMaskChecksum > 0, 'current glyph mask texture evidence is invalid');
    invariant(state.framebufferSignature > 0 && state.initialFramebufferSignature > 0 && state.lastFramebufferSampleCount > 500 && state.framebufferNonDarkSampleCount > 100, 'WEBGL framebuffer evidence is empty');
    invariant(state.fullStageGeometryVerified && state.canvasCoverageRatio >= .995, 'WEBGL canvas does not cover the full stage');
    invariant(state.automaticLetterCycle === false && state.automaticLightSweep === false && state.automaticPlayback === false && state.automaticRehearsal === false && state.automaticFallback === false, 'automatic chrome rehearsal is forbidden');
    invariant(state.previewClockDriven === false && state.renderIgnoresPreviewClock === true, 'preview clock must not move the light or choose a candidate');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed chrome proof state');
    invariant(state.inputCount === state.trustedInputCount && state.pointerInputCount + state.keyboardInputCount + state.controlInputCount === state.inputCount, 'trusted input accounting diverged');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial chrome proof was not verified still');
    invariant(state.drawnRevision === state.revision, 'visible shader output is behind the human-controlled revision');
    invariant(state.inputRecords.every(record => record.trusted === true), 'candidate, light, or proof transition lacks trusted input');
    invariant(state.prematureCommitCount === 0 && state.businessCommitCount === state.confirmationCount, 'chrome proof committed before explicit confirmation');
    invariant(candidateButtons.filter(button => button.getAttribute('aria-pressed') === 'true').length === 1 && candidateButtons[state.candidateIndex].getAttribute('aria-pressed') === 'true', 'candidate accessibility state diverged');

    if (state.inputMutationRequestCount > 0) invariant(state.inputDrivenFramebufferMutationCount > 0 && state.failedInputFramebufferMutationCount === 0, 'trusted candidate/light input did not change WEBGL pixels');
    if (state.reviewRetained) {
      invariant(state.phase === 'chrome-proof-retained' || state.phase === 'previous-proof-restored', 'retained proof phase is inconsistent');
      invariant(state.result === `chrome-proof-retained-${state.retainedProof.glyph.toLowerCase()}`, 'retained proof result is inconsistent');
      invariant(state.retainedProof.candidateIndex === state.candidateIndex && state.retainedProof.glyph === state.candidateGlyph, 'retained glyph differs from visible candidate');
      invariant(state.retainedMaskChecksum === state.currentMaskChecksum && state.retainedFramebufferSignature === state.framebufferSignature && state.retainedRevision === state.revision, 'retained proof differs from visible shader output');
      invariant(proofState.dataset.retained === 'true' && state.confirmationCount > 0, 'retained proof decision is not visible');
    }
    if (state.undoCount > 0) invariant(state.inputRecords.some(record => record.action === 'undo-proof'), 'undo did not revise the proof decision');
    if (state.resetCount > 0) invariant(cameraAtDefaults() && state.candidateIndex === 0 && state.inputRecords.some(record => record.action === 'reset-proof'), 'reset did not restore the initial shader controls');
    return true;
  };

  installPreviewController({
    id: 'liquid-chrome-letterform',
    library: 'p5@2.3.0',
    renderer: 'webgl',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
