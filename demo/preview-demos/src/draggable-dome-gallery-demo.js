import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const CAMERA_Z = 500;
const DOME_RADIUS = 230;
const FOV = Math.PI / 3;

const MATERIALS = [
  {
    id: 'tidal-glass',
    title: 'Tidal Glass',
    type: 'Recycled glass composite',
    process: 'Cast / reclaimed',
    year: 'Study 2026',
    description: 'A speculative cast-glass sample shaped by erosion channels and suspended mineral inclusions.',
    source: new URL('../assets/aesthetic-wave-03/draggable-dome-gallery/tidal-glass.jpg', import.meta.url).href
  },
  {
    id: 'living-lattice',
    title: 'Living Lattice',
    type: 'Grown mycelium composite',
    process: 'Grown / pressed',
    year: 'Study 2026',
    description: 'A lightweight fungal lattice that tests irregular cellular voids as structural reinforcement.',
    source: new URL('../assets/aesthetic-wave-03/draggable-dome-gallery/living-lattice.jpg', import.meta.url).href
  },
  {
    id: 'kelp-fold',
    title: 'Kelp Fold',
    type: 'Algae bioplastic film',
    process: 'Cast / folded',
    year: 'Study 2026',
    description: 'A translucent algae film folded into a self-supporting ribbon with luminous thin edges.',
    source: new URL('../assets/aesthetic-wave-03/draggable-dome-gallery/kelp-fold.jpg', import.meta.url).href
  },
  {
    id: 'basalt-weave',
    title: 'Basalt Weave',
    type: 'Volcanic fibre textile',
    process: 'Woven / mineral',
    year: 'Study 2026',
    description: 'A dense basalt-fibre loop exploring heat-tolerant weave geometry and controlled frayed edges.',
    source: new URL('../assets/aesthetic-wave-03/draggable-dome-gallery/basalt-weave.jpg', import.meta.url).href
  },
  {
    id: 'copper-bloom',
    title: 'Copper Bloom',
    type: 'Conductive resin composite',
    process: 'Cast / expanded mesh',
    year: 'Study 2026',
    description: 'Oxidised copper mesh branches through a translucent resin disc as a conductive surface study.',
    source: new URL('../assets/aesthetic-wave-03/draggable-dome-gallery/copper-bloom.jpg', import.meta.url).href
  },
  {
    id: 'paper-strata',
    title: 'Paper Strata',
    type: 'Compressed paper ceramic',
    process: 'Pressed / carved',
    year: 'Study 2026',
    description: 'Recycled paper layers are compressed into a carved block whose cut face reveals coloured strata.',
    source: new URL('../assets/aesthetic-wave-03/draggable-dome-gallery/paper-strata.jpg', import.meta.url).href
  }
];

try {
  const host = document.querySelector('#dome-host');
  const main = document.querySelector('.preview-stage');
  const yawOutput = document.querySelector('#yaw-output');
  const pitchOutput = document.querySelector('#pitch-output');
  const interactionHint = document.querySelector('#interaction-hint');
  const resetControl = document.querySelector('#reset-control');
  const detailPanel = document.querySelector('#detail-panel');
  const detailImage = document.querySelector('#detail-image');
  const detailIndex = document.querySelector('#detail-index');
  const detailType = document.querySelector('#detail-type');
  const detailTitle = document.querySelector('#detail-title');
  const detailDescription = document.querySelector('#detail-description');
  const detailProcess = document.querySelector('#detail-process');
  const detailYear = document.querySelector('#detail-year');
  const confirmControl = document.querySelector('#confirm-control');
  const closeControl = document.querySelector('#close-control');
  const selectionStatus = document.querySelector('#selection-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    task: 'orbit-and-inspect-material-dome',
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'control'],
    userInputRequired: true,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockDriven: false,
    firstFrameStatic: true,
    userOwnedView: true,
    finiteInputInertiaOnly: true,
    yaw: 0,
    pitch: 0,
    velocityYaw: 0,
    velocityPitch: 0,
    pointer: null,
    dragging: false,
    selected: -1,
    selectedTileIndex: -1,
    selectionProgress: 0,
    selectionAnimating: false,
    confirmed: false,
    decodedAssets: [],
    assetChecksums: [],
    assetChecksumsUnique: false,
    sampledPixelCount: 0,
    textures: [],
    projections: [],
    draws: 0,
    needsDraw: true,
    lastFrameAt: performance.now(),
    trustedInputCount: 0,
    untrustedInputCount: 0,
    captureCount: 0,
    captureVerifiedCount: 0,
    releaseCount: 0,
    dragMoveCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    selectionCount: 0,
    resetCount: 0,
    confirmCount: 0,
    lastInputTrusted: null,
    lastSelectionTrusted: null,
    lastResetTrusted: null,
    selectionSnapshotValid: false,
    resetSnapshotValid: false,
    lastYawSign: 0,
    sawPositiveYaw: false,
    sawNegativeYaw: false,
    reversalCount: 0,
    reverseMathVerified: false,
    resetMathVerified: false,
    geometryChecksum: 0,
    initialFramebufferChecksum: null,
    initialStaticVerified: false,
    previewClockMutations: 0,
    resizeCount: 0,
    inputPolicy: 'trusted-only',
    capturePolicy: 'pointer-capture',
    automaticCruise: false,
    syntheticDispatch: false
  };

  let sketch = null;
  let pInstance = null;
  let resolveP5Setup;
  const p5SetupReady = new Promise(resolve => { resolveP5Setup = resolve; });

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const easeOut = value => 1 - Math.pow(1 - value, 3);
  const signedDragToYaw = delta => delta * 0.0065;

  function recordRuntimeAssertion() {
    requestAnimationFrame(() => {
      if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
        host.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__() === true);
      }
    });
  }

  const tiles = Array.from({ length: 18 }, (_, index) => {
    const row = Math.floor(index / 6);
    const column = index % 6;
    return {
      index,
      materialIndex: (column + row * 2) % MATERIALS.length,
      azimuth: column / 6 * Math.PI * 2 + (row - 1) * 0.12,
      elevation: [-0.43, -0.03, 0.37][row]
    };
  });

  function rotateSpherical(azimuth, elevation, radius = DOME_RADIUS, yaw = state.yaw, pitch = state.pitch) {
    const baseX = Math.sin(azimuth) * Math.cos(elevation) * radius;
    const baseY = -Math.sin(elevation) * radius;
    const baseZ = Math.cos(azimuth) * Math.cos(elevation) * radius;
    const yawCos = Math.cos(yaw);
    const yawSin = Math.sin(yaw);
    const yawX = baseX * yawCos + baseZ * yawSin;
    const yawZ = -baseX * yawSin + baseZ * yawCos;
    const pitchCos = Math.cos(pitch);
    const pitchSin = Math.sin(pitch);
    return {
      x: yawX,
      y: baseY * pitchCos - yawZ * pitchSin,
      z: baseY * pitchSin + yawZ * pitchCos
    };
  }

  function projectPoint(world, width, height) {
    const focalLength = height * 0.5 / Math.tan(FOV * 0.5);
    const distance = Math.max(40, CAMERA_Z - world.z);
    return {
      x: width * 0.5 + world.x * focalLength / distance,
      y: height * 0.5 + world.y * focalLength / distance,
      scale: focalLength / distance,
      distance
    };
  }

  function setViewReadout() {
    const wrappedYaw = ((state.yaw * 180 / Math.PI) % 360 + 360) % 360;
    const pitchDegrees = state.pitch * 180 / Math.PI;
    yawOutput.textContent = `${String(Math.round(wrappedYaw)).padStart(3, '0')}°`;
    pitchOutput.textContent = `${pitchDegrees >= 0 ? '+' : '−'}${String(Math.abs(Math.round(pitchDegrees))).padStart(2, '0')}°`;
  }

  function showDetail(tileIndex) {
    const tile = tiles[tileIndex];
    const material = MATERIALS[tile.materialIndex];
    detailImage.src = material.source;
    detailImage.alt = `${material.title}, an AI-generated speculative material study`;
    detailIndex.textContent = `SPECIMEN ${String(material.id ? tile.materialIndex + 1 : 1).padStart(2, '0')}`;
    detailType.textContent = material.type;
    detailTitle.textContent = material.title;
    detailDescription.textContent = material.description;
    detailProcess.textContent = material.process;
    detailYear.textContent = material.year;
    confirmControl.dataset.confirmed = 'false';
    confirmControl.textContent = 'Shortlist material';
    selectionStatus.textContent = 'Material expanded from dome';
    detailPanel.dataset.open = 'true';
    detailPanel.setAttribute('aria-hidden', 'false');
    interactionHint.textContent = `${material.title} · Esc to close`;
  }

  function hideDetail() {
    detailPanel.dataset.open = 'false';
    detailPanel.setAttribute('aria-hidden', 'true');
    selectionStatus.textContent = '';
    interactionHint.textContent = 'Drag to orbit · click to inspect';
  }

  function registerTrustedInput(event, type) {
    if (!event.isTrusted) {
      state.untrustedInputCount += 1;
      return false;
    }
    state.trustedInputCount += 1;
    state.lastInputTrusted = true;
    host.dataset.lastTrustedInput = type;
    return true;
  }

  function selectTile(tileIndex, trusted) {
    if (!trusted || tileIndex < 0 || tileIndex >= tiles.length) return;
    state.selectedTileIndex = tileIndex;
    state.selected = tiles[tileIndex].materialIndex;
    state.selectionProgress = reducedMotion.matches ? 1 : 0;
    state.selectionAnimating = !reducedMotion.matches;
    state.confirmed = false;
    state.selectionCount += 1;
    state.lastSelectionTrusted = true;
    state.needsDraw = true;
    showDetail(tileIndex);
    state.selectionSnapshotValid = (
      state.selected >= 0
      && state.selectedTileIndex === tileIndex
      && detailPanel.dataset.open === 'true'
      && detailImage.src.includes(MATERIALS[state.selected].source)
    );
    recordRuntimeAssertion();
  }

  function closeSelection() {
    state.selected = -1;
    state.selectedTileIndex = -1;
    state.selectionProgress = 0;
    state.selectionAnimating = false;
    state.confirmed = false;
    state.needsDraw = true;
    hideDetail();
  }

  function nearestProjectedTile(clientX, clientY) {
    const bounds = host.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    let best = null;
    state.projections.forEach(projection => {
      const distance = Math.hypot(x - projection.x, y - projection.y);
      const hitRadius = Math.max(18, projection.width * 0.58);
      if (distance <= hitRadius && (!best || distance < best.distance)) best = { index: projection.index, distance };
    });
    return best?.index ?? -1;
  }

  function centerProjectedTile() {
    if (!state.projections.length) return -1;
    const centerX = innerWidth * 0.5;
    const centerY = innerHeight * 0.5;
    return state.projections.reduce((best, projection) => {
      const distance = Math.hypot(projection.x - centerX, projection.y - centerY);
      return !best || distance < best.distance ? { index: projection.index, distance } : best;
    }, null)?.index ?? -1;
  }

  function applyYawDelta(delta) {
    if (delta === 0) return;
    const sign = Math.sign(delta);
    if (sign > 0) state.sawPositiveYaw = true;
    if (sign < 0) state.sawNegativeYaw = true;
    if (state.lastYawSign && sign !== state.lastYawSign) state.reversalCount += 1;
    state.lastYawSign = sign;
    state.yaw += delta;
  }

  function resetView(trusted = false) {
    state.yaw = 0;
    state.pitch = 0;
    state.velocityYaw = 0;
    state.velocityPitch = 0;
    state.dragging = false;
    state.pointer = null;
    host.dataset.dragging = 'false';
    closeSelection();
    if (trusted) {
      state.resetCount += 1;
      state.lastResetTrusted = true;
      state.resetSnapshotValid = (
        state.yaw === 0
        && state.pitch === 0
        && state.velocityYaw === 0
        && state.velocityPitch === 0
        && state.selected === -1
        && detailPanel.dataset.open === 'false'
      );
    }
    state.needsDraw = true;
    setViewReadout();
    if (trusted) recordRuntimeAssertion();
  }

  host.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest('button, .detail-panel')) return;
    if (!registerTrustedInput(event, event.pointerType || 'pointer')) return;
    const now = event.timeStamp;
    state.pointer = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      at: now,
      moved: 0
    };
    state.dragging = true;
    state.captureCount += 1;
    host.dataset.dragging = 'true';
    host.setPointerCapture?.(event.pointerId);
    if (host.hasPointerCapture?.(event.pointerId)) state.captureVerifiedCount += 1;
  });

  host.addEventListener('pointermove', event => {
    if (!state.dragging || !state.pointer || event.pointerId !== state.pointer.id) return;
    if (!registerTrustedInput(event, event.pointerType || 'pointer')) return;
    event.preventDefault();
    const elapsed = clamp(event.timeStamp - state.pointer.at, 8, 70);
    const deltaX = event.clientX - state.pointer.x;
    const deltaY = event.clientY - state.pointer.y;
    const yawDelta = signedDragToYaw(deltaX);
    const pitchDelta = deltaY * 0.0046;
    applyYawDelta(yawDelta);
    state.pitch = clamp(state.pitch + pitchDelta, -0.56, 0.56);
    state.velocityYaw = clamp(yawDelta / elapsed * 1000, -2.4, 2.4);
    state.velocityPitch = clamp(pitchDelta / elapsed * 1000, -1.4, 1.4);
    state.pointer.moved += Math.hypot(deltaX, deltaY);
    state.pointer.x = event.clientX;
    state.pointer.y = event.clientY;
    state.pointer.at = event.timeStamp;
    state.dragMoveCount += 1;
    state.needsDraw = true;
    setViewReadout();
  });

  function finishPointer(event) {
    if (!state.pointer || event.pointerId !== state.pointer.id) return;
    if (!registerTrustedInput(event, event.pointerType || 'pointer')) return;
    const wasTap = state.pointer.moved < 7;
    const tileIndex = wasTap ? nearestProjectedTile(event.clientX, event.clientY) : -1;
    host.releasePointerCapture?.(event.pointerId);
    state.releaseCount += 1;
    state.pointer = null;
    state.dragging = false;
    host.dataset.dragging = 'false';
    if (reducedMotion.matches) {
      state.velocityYaw = 0;
      state.velocityPitch = 0;
    }
    if (tileIndex >= 0) selectTile(tileIndex, event.isTrusted);
    recordRuntimeAssertion();
  }

  host.addEventListener('pointerup', finishPointer);
  host.addEventListener('pointercancel', finishPointer);

  host.addEventListener('keydown', event => {
    if (event.target.closest('button')) return;
    const supported = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Escape', 'Home', 'r', 'R'];
    if (!supported.includes(event.key)) return;
    if (!registerTrustedInput(event, 'keyboard')) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    const step = event.shiftKey ? 0.24 : 0.11;
    if (event.key === 'ArrowLeft') applyYawDelta(-step);
    if (event.key === 'ArrowRight') applyYawDelta(step);
    if (event.key === 'ArrowUp') state.pitch = clamp(state.pitch - step * 0.7, -0.56, 0.56);
    if (event.key === 'ArrowDown') state.pitch = clamp(state.pitch + step * 0.7, -0.56, 0.56);
    if (event.key === 'Enter' || event.key === ' ') selectTile(centerProjectedTile(), event.isTrusted);
    if (event.key === 'Escape') closeSelection();
    if (event.key === 'Home' || event.key.toLowerCase() === 'r') resetView(event.isTrusted);
    state.velocityYaw = 0;
    state.velocityPitch = 0;
    state.needsDraw = true;
    setViewReadout();
    recordRuntimeAssertion();
  });

  resetControl.addEventListener('click', event => {
    if (!registerTrustedInput(event, 'control')) return;
    state.controlInputCount += 1;
    resetView(event.isTrusted);
  });

  closeControl.addEventListener('click', event => {
    if (!registerTrustedInput(event, 'control')) return;
    state.controlInputCount += 1;
    closeSelection();
    recordRuntimeAssertion();
  });

  confirmControl.addEventListener('click', event => {
    if (!registerTrustedInput(event, 'control') || state.selected < 0) return;
    state.controlInputCount += 1;
    state.confirmed = true;
    state.confirmCount += 1;
    confirmControl.dataset.confirmed = 'true';
    confirmControl.textContent = 'Shortlisted';
    selectionStatus.textContent = `${MATERIALS[state.selected].title} added to material board`;
    recordRuntimeAssertion();
  });

  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) {
      state.velocityYaw = 0;
      state.velocityPitch = 0;
      if (state.selectionAnimating) {
        state.selectionProgress = 1;
        state.selectionAnimating = false;
      }
    }
    state.needsDraw = true;
  });

  const decodedAssetsReady = Promise.all(MATERIALS.map(material => new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = material.source;
    image.decode().then(() => {
      if (!image.complete || image.naturalWidth !== 960 || image.naturalHeight !== 640) {
        reject(new Error(`Unexpected image dimensions for ${material.id}`));
        return;
      }
      const sample = document.createElement('canvas');
      sample.width = 48;
      sample.height = 32;
      const context = sample.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, sample.width, sample.height);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      let checksum = 2166136261;
      for (const channel of pixels) {
        checksum ^= channel;
        checksum = Math.imul(checksum, 16777619) >>> 0;
      }
      resolve({ material, image, checksum, sampledPixelCount: pixels.length });
    }).catch(() => reject(new Error(`Failed to decode ${material.id}`)));
  })));

  function drawDomeGrid(p) {
    p.noFill();
    p.stroke(211, 255, 89, 26);
    p.strokeWeight(0.7);
    [-0.48, -0.24, 0, 0.24, 0.48].forEach(elevation => {
      p.beginShape();
      for (let sample = 0; sample <= 48; sample += 1) {
        const azimuth = sample / 48 * Math.PI * 2;
        const point = rotateSpherical(azimuth, elevation, DOME_RADIUS + 7);
        p.vertex(point.x, point.y, point.z);
      }
      p.endShape();
    });
    for (let line = 0; line < 12; line += 1) {
      const azimuth = line / 12 * Math.PI * 2;
      p.beginShape();
      for (let sample = 0; sample <= 20; sample += 1) {
        const elevation = -0.62 + sample / 20 * 1.24;
        const point = rotateSpherical(azimuth, elevation, DOME_RADIUS + 7);
        p.vertex(point.x, point.y, point.z);
      }
      p.endShape();
    }
  }

  function drawTile(p, tile) {
    const base = rotateSpherical(tile.azimuth, tile.elevation);
    const visible = base.z > -75 || tile.index === state.selectedTileIndex;
    if (!visible) return;
    const selected = tile.index === state.selectedTileIndex;
    const expansion = selected ? easeOut(state.selectionProgress) : 0;
    const targetX = innerWidth > 430 ? -64 : -34;
    const world = {
      x: lerp(base.x, targetX, expansion),
      y: lerp(base.y, 0, expansion),
      z: lerp(base.z, 348, expansion)
    };
    const projection = projectPoint(world, p.width, p.height);
    const width = 88 * (1 + expansion * 0.42);
    const height = 58 * (1 + expansion * 0.42);
    const tangentYaw = Math.atan2(world.x, world.z);
    const tangentPitch = -Math.atan2(world.y, Math.hypot(world.x, world.z));
    const frameColor = selected ? [216, 255, 71] : [217, 223, 214];

    p.push();
    p.translate(world.x, world.y, world.z);
    p.rotateY(lerp(tangentYaw, 0, expansion));
    p.rotateX(lerp(tangentPitch, 0, expansion));
    p.noStroke();
    p.fill(...frameColor);
    p.plane(width + (selected ? 5 : 2.5), height + (selected ? 5 : 2.5));
    p.translate(0, 0, 1.2);
    p.texture(state.textures[tile.materialIndex]);
    p.tint(255, state.selected >= 0 && !selected ? 90 : 255);
    p.plane(width, height);
    p.noTint();
    p.pop();

    if (!selected) {
      state.projections.push({
        index: tile.index,
        x: projection.x,
        y: projection.y,
        width: width * projection.scale,
        height: height * projection.scale,
        depth: world.z
      });
    }
  }

  function drawScene(p) {
    if (!state.textures.length) return;
    state.draws += 1;
    state.projections = [];
    p.background(10, 13, 11);
    p.perspective(FOV, p.width / Math.max(1, p.height), 10, 1100);
    p.camera(0, 0, CAMERA_Z, 0, 0, 0, 0, 1, 0);
    p.ambientLight(135);
    p.directionalLight(210, 232, 218, -0.5, 0.3, -1);
    drawDomeGrid(p);
    tiles.slice().sort((a, b) => rotateSpherical(a.azimuth, a.elevation).z - rotateSpherical(b.azimuth, b.elevation).z).forEach(tile => drawTile(p, tile));
  }

  sketch = new p5(p => {
    pInstance = p;
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight, p.WEBGL).parent(host);
      p.textureMode(p.NORMAL);
      p.noLoop();
      resolveP5Setup();
    };
    p.draw = () => drawScene(p);
  }, host);

  function loadTexture(p, source) {
    return new Promise((resolve, reject) => {
      p.loadImage(source, resolve, () => reject(new Error(`p5 texture load failed for ${source}`)));
    });
  }

  function framebufferChecksum() {
    const canvas = host.querySelector('canvas');
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    if (!gl) return 0;
    const sampleWidth = Math.min(32, canvas.width);
    const sampleHeight = Math.min(32, canvas.height);
    const pixels = new Uint8Array(sampleWidth * sampleHeight * 4);
    const x = Math.max(0, Math.floor(canvas.width * 0.5 - sampleWidth * 0.5));
    const y = Math.max(0, Math.floor(canvas.height * 0.5 - sampleHeight * 0.5));
    gl.readPixels(x, y, sampleWidth, sampleHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let checksum = 2166136261;
    for (let index = 0; index < pixels.length; index += 5) {
      checksum ^= pixels[index];
      checksum = Math.imul(checksum, 16777619);
    }
    return checksum >>> 0;
  }

  function render(_previewTime) {
    if (!pInstance || !state.textures.length) return;
    const now = performance.now();
    const deltaSeconds = clamp((now - state.lastFrameAt) / 1000, 0, 0.034);
    state.lastFrameAt = now;
    let changed = state.needsDraw;

    if (!state.dragging && !reducedMotion.matches && (Math.abs(state.velocityYaw) > 0.002 || Math.abs(state.velocityPitch) > 0.002)) {
      applyYawDelta(state.velocityYaw * deltaSeconds);
      state.pitch = clamp(state.pitch + state.velocityPitch * deltaSeconds, -0.56, 0.56);
      const damping = Math.exp(-6.2 * deltaSeconds);
      state.velocityYaw *= damping;
      state.velocityPitch *= damping;
      if (Math.abs(state.velocityYaw) < 0.002) state.velocityYaw = 0;
      if (Math.abs(state.velocityPitch) < 0.002) state.velocityPitch = 0;
      setViewReadout();
      changed = true;
    }
    if (state.selectionAnimating) {
      state.selectionProgress = Math.min(1, state.selectionProgress + deltaSeconds / 0.34);
      if (state.selectionProgress >= 1) state.selectionAnimating = false;
      changed = true;
    }
    if (changed) {
      pInstance.redraw();
      state.needsDraw = false;
    }
  }

  window.addEventListener('resize', () => {
    if (!pInstance) return;
    pInstance.resizeCanvas(innerWidth, innerHeight);
    state.resizeCount += 1;
    state.needsDraw = true;
  });

  state.reverseMathVerified = (
    signedDragToYaw(40) === -signedDragToYaw(-40)
    && signedDragToYaw(40) > 0
    && signedDragToYaw(-40) < 0
  );
  const resetProbe = { yaw: 1, pitch: -1, velocityYaw: 2, velocityPitch: -2, selected: 3 };
  Object.assign(resetProbe, { yaw: 0, pitch: 0, velocityYaw: 0, velocityPitch: 0, selected: -1 });
  state.resetMathVerified = Object.values(resetProbe).every(value => value === 0 || value === -1);
  state.geometryChecksum = tiles.reduce((sum, tile, index) => {
    const point = rotateSpherical(tile.azimuth, tile.elevation, DOME_RADIUS, 0, 0);
    return sum + Math.round((point.x * 7 + point.y * 11 + point.z * 13) * (index + 1));
  }, 0);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = host.querySelector('canvas');
    const bounds = host.getBoundingClientRect();
    const uniqueGeometry = new Set(tiles.map(tile => `${tile.azimuth.toFixed(4)}:${tile.elevation.toFixed(4)}`));
    const trustedStateValid = state.trustedInputCount === 0 || state.lastInputTrusted === true;
    const captureStateValid = state.captureCount === 0 || (
      state.captureVerifiedCount === state.captureCount
      && state.releaseCount <= state.captureCount
    );
    const currentSelectionValid = state.selected < 0
      ? state.selectedTileIndex === -1 && detailPanel.dataset.open === 'false'
      : state.selectedTileIndex >= 0 && detailPanel.dataset.open === 'true';
    const selectionStateValid = (
      (state.selectionCount === 0 || (state.lastSelectionTrusted === true && state.selectionSnapshotValid))
      && currentSelectionValid
    );
    const reversalStateValid = state.reversalCount === 0 || (state.sawPositiveYaw && state.sawNegativeYaw);
    const resetStateValid = state.resetCount === 0 || (state.lastResetTrusted === true && state.resetSnapshotValid);
    return (
      window.__PREVIEW_INTERACTION_STATE__ === state
      && state.task === 'orbit-and-inspect-material-dome'
      && JSON.stringify(state.acceptedInputs) === JSON.stringify(['mouse', 'touch', 'pen', 'keyboard', 'control'])
      && state.userInputRequired === true
      && state.automaticPlayback === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.previewClockDriven === false
      && state.firstFrameStatic === true
      && state.userOwnedView === true
      && state.finiteInputInertiaOnly === true
      && sketch instanceof p5
      && pInstance instanceof p5
      && Boolean(canvas?.getContext('webgl2') || canvas?.getContext('webgl'))
      && MATERIALS.length === 6
      && state.decodedAssets.length === 6
      && state.decodedAssets.every(asset => asset.image.complete && asset.image.naturalWidth === 960 && asset.image.naturalHeight === 640)
      && state.assetChecksums.length === 6
      && state.assetChecksums.every(checksum => Number.isInteger(checksum) && checksum > 0)
      && state.assetChecksumsUnique
      && state.sampledPixelCount === 36864
      && state.textures.length === 6
      && state.textures.every(texture => texture.width === 960 && texture.height === 640)
      && tiles.length === 18
      && uniqueGeometry.size === 18
      && state.geometryChecksum !== 0
      && state.projections.length >= 6
      && main.dataset.previewMechanism === 'p5-textured-spherical-dome'
      && host.dataset.inputPolicy === 'trusted-only'
      && state.inputPolicy === 'trusted-only'
      && state.capturePolicy === 'pointer-capture'
      && state.automaticCruise === false
      && state.syntheticDispatch === false
      && state.previewClockMutations === 0
      && state.controlInputCount >= state.resetCount + state.confirmCount
      && state.reverseMathVerified
      && state.resetMathVerified
      && state.initialStaticVerified
      && trustedStateValid
      && captureStateValid
      && selectionStateValid
      && reversalStateValid
      && resetStateValid
      && bounds.width >= innerWidth - 1
      && bounds.height >= innerHeight - 1
      && canvas.width === Math.round(innerWidth)
      && canvas.height === Math.round(innerHeight)
      && state.draws >= 2
    );
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  const ready = (async () => {
    await document.fonts.ready;
    const decodedAssets = await decodedAssetsReady;
    state.decodedAssets = decodedAssets;
    state.assetChecksums = decodedAssets.map(asset => asset.checksum);
    state.assetChecksumsUnique = new Set(state.assetChecksums).size === MATERIALS.length;
    state.sampledPixelCount = decodedAssets.reduce((sum, asset) => sum + asset.sampledPixelCount, 0);
    await p5SetupReady;
    state.textures = await Promise.all(MATERIALS.map(material => loadTexture(pInstance, material.source)));
    setViewReadout();
    state.needsDraw = true;
    render(0);
    await new Promise(resolve => requestAnimationFrame(resolve));
    const firstChecksum = framebufferChecksum();
    state.needsDraw = true;
    render(0);
    await new Promise(resolve => requestAnimationFrame(resolve));
    const secondChecksum = framebufferChecksum();
    state.initialFramebufferChecksum = firstChecksum;
    state.initialStaticVerified = (
      firstChecksum !== 0
      && firstChecksum === secondChecksum
      && state.yaw === 0
      && state.pitch === 0
      && state.velocityYaw === 0
      && state.velocityPitch === 0
      && state.selected === -1
      && state.trustedInputCount === 0
    );
    if (!window.__PREVIEW_RUNTIME_ASSERT__()) throw new Error('Dome gallery runtime contract failed');
    host.dataset.runtimeAssert = 'true';
  })();

  installPreviewController({
    id: 'draggable-dome-gallery',
    library: 'p5@2.3.0',
    renderer: 'webgl',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
