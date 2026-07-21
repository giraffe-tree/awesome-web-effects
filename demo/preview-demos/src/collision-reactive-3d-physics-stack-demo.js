import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import coldTextureUrl from '../assets/aesthetic-wave-04/collision-reactive-3d-physics-stack/cold-chain-shell.jpg';
import heavyTextureUrl from '../assets/aesthetic-wave-04/collision-reactive-3d-physics-stack/heavy-parts-crate.jpg';
import fragileTextureUrl from '../assets/aesthetic-wave-04/collision-reactive-3d-physics-stack/fragile-ceramic-case.jpg';

const FIXED_STEP = 1 / 120;
const FLOOR_Y = 50;
const WORLD_LEFT = -94;
const WORLD_RIGHT = 72;
const MAX_BODIES = 10;

try {
  const host = document.querySelector('#physics-host');
  const stage = document.querySelector('.preview-stage');
  const impulseReadout = document.querySelector('#impulse-readout');
  const riskReadout = document.querySelector('#risk-readout');
  const impactNote = document.querySelector('#impact-note');
  const simulationStatus = document.querySelector('#simulation-status');
  const payloadButtons = [...document.querySelectorAll('[data-payload]')];
  const dropButton = document.querySelector('#drop-button');
  const joltButton = document.querySelector('#jolt-button');
  const resetButton = document.querySelector('#reset-button');

  const missing = [host, stage, impulseReadout, riskReadout, impactNote, simulationStatus, dropButton, joltButton, resetButton]
    .some(element => !element);
  if (missing || payloadButtons.length !== 3) throw new Error('Parcel impact calibration UI is incomplete.');

  const materialSpecs = {
    cold: {
      key: 'cold',
      label: 'cold-chain shell',
      textureUrl: coldTextureUrl,
      mass: 2.4,
      restitution: .14,
      friction: .78,
      threshold: 84,
      width: 32,
      height: 24,
      depth: 24,
      glow: [116, 219, 255]
    },
    heavy: {
      key: 'heavy',
      label: 'machine-parts crate',
      textureUrl: heavyTextureUrl,
      mass: 5.8,
      restitution: .06,
      friction: .84,
      threshold: 148,
      width: 38,
      height: 26,
      depth: 27,
      glow: [255, 190, 81]
    },
    fragile: {
      key: 'fragile',
      label: 'ceramic-sample case',
      textureUrl: fragileTextureUrl,
      mass: 1.2,
      restitution: .22,
      friction: .72,
      threshold: 28,
      width: 29,
      height: 22,
      depth: 22,
      glow: [255, 112, 88]
    }
  };

  const state = {
    task: 'human-triggered-parcel-impact-calibration',
    mechanism: 'p5-webgl-fixed-step-aabb-rigid-body-collision-impulses',
    inputPolicy: 'trusted-only',
    previewClockDriven: false,
    autoplay: false,
    autoStartAttempted: false,
    rehearsalMode: false,
    fallbackUsed: false,
    syntheticInputUsed: false,
    firstFrameWasPaused: true,
    initialFramePhysicsSteps: null,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    selectedPayload: 'cold',
    aimX: -7,
    isSimulating: false,
    simulationStartedByTrustedInput: false,
    simulationActionCount: 0,
    resetCount: 0,
    dropCount: 0,
    sideImpactCount: 0,
    selectionCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    aimMutationCount: 0,
    lastInputTrusted: null,
    lastInputKind: 'none',
    lastAction: 'ready',
    physicsStepCount: 0,
    bodyCollisionCount: 0,
    floorCollisionCount: 0,
    materialFlashMutationCount: 0,
    peakImpulse: 0,
    peakRiskRatio: 0,
    lastImpactImpulse: 0,
    lastImpactPair: 'none',
    bodyCount: 0,
    draws: 0,
    webglReady: false,
    textureDrawCount: 0,
    integratedTextureKeys: [],
    assetByteLength: 0,
    assetChecksum: 0,
    assetCount: 0,
    assetWidth: 0,
    assetHeight: 0,
    interactionLedger: []
  };
  window.__PREVIEW_STATE__ = state;

  let sketch;
  let bodies = [];
  let pulses = [];
  let nextBodyId = 1;
  let accumulator = 0;
  let lastFrameTime = 0;
  let activeSeconds = 0;
  let quietFrames = 0;
  let resolveReady;
  let readyResolved = false;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  const integratedTextureKeys = new Set();

  function round(value, digits = 2) {
    const scale = 10 ** digits;
    return Math.round(value * scale) / scale;
  }

  function checksumBytes(bytes) {
    let hash = 2166136261;
    for (let index = 0; index < bytes.length; index += 1) {
      hash ^= bytes[index];
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  async function loadTexture(spec) {
    const sourceUrl = new URL(spec.textureUrl, location.href);
    if (sourceUrl.origin !== location.origin || !sourceUrl.pathname.endsWith('.jpg')) {
      throw new Error(`Texture must resolve to a same-origin local JPG: ${spec.key}`);
    }
    const response = await fetch(sourceUrl.href, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Texture request failed (${response.status}): ${spec.key}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const image = new Image();
    image.decoding = 'sync';
    image.alt = '';
    image.src = sourceUrl.href;
    await image.decode();
    if (image.naturalWidth !== 512 || image.naturalHeight !== 512 || bytes.byteLength < 20_000) {
      throw new Error(`Texture evidence is invalid: ${spec.key}`);
    }
    spec.image = image;
    spec.byteLength = bytes.byteLength;
    spec.checksum = checksumBytes(bytes);
    spec.resolvedUrl = sourceUrl.href;
    return spec;
  }

  function recordLedger(entry) {
    state.interactionLedger.push({ sequence: state.interactionLedger.length + 1, ...entry });
    if (state.interactionLedger.length > 24) state.interactionLedger.shift();
  }

  function acceptTrustedInput(event, action, inputKind) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedCount += 1;
      state.lastInputTrusted = false;
      recordLedger({ action, inputKind, trusted: false, accepted: false });
      return false;
    }
    state.trustedInputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = inputKind;
    if (inputKind.startsWith('pointer')) state.pointerInputCount += 1;
    else if (inputKind.startsWith('keyboard')) state.keyboardInputCount += 1;
    else state.controlInputCount += 1;
    recordLedger({ action, inputKind, trusted: true, accepted: true });
    return true;
  }

  function createBody(typeKey, x, y, overrides = {}) {
    const spec = materialSpecs[typeKey];
    const body = {
      id: nextBodyId,
      typeKey,
      x,
      y,
      z: overrides.z ?? ((nextBodyId % 3) - 1) * 2.2,
      vx: overrides.vx ?? 0,
      vy: overrides.vy ?? 0,
      angle: overrides.angle ?? 0,
      angularVelocity: overrides.angularVelocity ?? 0,
      width: overrides.width ?? spec.width,
      height: overrides.height ?? spec.height,
      depth: overrides.depth ?? spec.depth,
      mass: overrides.mass ?? spec.mass,
      restitution: overrides.restitution ?? spec.restitution,
      friction: overrides.friction ?? spec.friction,
      threshold: overrides.threshold ?? spec.threshold,
      flash: 0,
      damage: 0,
      isSled: overrides.isSled === true
    };
    nextBodyId += 1;
    return body;
  }

  function initialStack() {
    nextBodyId = 1;
    return [
      createBody('heavy', -47, FLOOR_Y - materialSpecs.heavy.height / 2, { angle: -.012, z: -2 }),
      createBody('cold', -11, FLOOR_Y - materialSpecs.cold.height / 2, { angle: .008, z: 1 }),
      createBody('heavy', 25, FLOOR_Y - materialSpecs.heavy.height / 2, { angle: -.006, z: -1 }),
      createBody('cold', -30, 12, { angle: -.018, z: 2 }),
      createBody('fragile', 1, 13, { angle: .014, z: 3 })
    ];
  }

  function updateReadouts() {
    impulseReadout.textContent = `${state.peakImpulse.toFixed(1)} N·s`;
    let risk = 'safe';
    let riskLabel = 'SAFE';
    if (state.peakRiskRatio >= 1) {
      risk = 'limit';
      riskLabel = 'LIMIT';
    } else if (state.peakRiskRatio >= .65) {
      risk = 'watch';
      riskLabel = 'WATCH';
    }
    riskReadout.dataset.risk = risk;
    riskReadout.textContent = riskLabel;
    impactNote.dataset.level = risk;
    if (state.lastImpactImpulse > 0) {
      impactNote.textContent = `${state.lastImpactPair} · ${state.lastImpactImpulse.toFixed(1)} N·s`;
    } else {
      impactNote.textContent = 'Ready bay · choose a parcel and drop';
    }
    simulationStatus.dataset.active = String(state.isSimulating);
    simulationStatus.textContent = state.isSimulating ? 'Measuring live collisions' : 'Paused · human input required';
    state.bodyCount = bodies.length;
    stage.dataset.simulating = String(state.isSimulating);
    stage.dataset.selectedPayload = state.selectedPayload;
  }

  function redrawPaused() {
    if (sketch && !state.isSimulating) sketch.redraw();
  }

  function resetBay(cause = 'initial') {
    bodies = initialStack();
    pulses = [];
    state.isSimulating = false;
    state.peakImpulse = 0;
    state.peakRiskRatio = 0;
    state.lastImpactImpulse = 0;
    state.lastImpactPair = 'none';
    accumulator = 0;
    activeSeconds = 0;
    quietFrames = 0;
    if (cause !== 'initial') {
      state.resetCount += 1;
      state.lastAction = cause;
    }
    if (sketch) {
      sketch.noLoop();
      sketch.redraw();
    }
    updateReadouts();
  }

  function beginSimulation(action) {
    state.simulationStartedByTrustedInput = true;
    state.simulationActionCount += 1;
    state.isSimulating = true;
    state.lastAction = action;
    accumulator = 0;
    lastFrameTime = performance.now();
    activeSeconds = 0;
    quietFrames = 0;
    updateReadouts();
    sketch.loop();
  }

  function selectPayload(typeKey, cause) {
    if (!materialSpecs[typeKey]) return;
    state.selectedPayload = typeKey;
    state.selectionCount += 1;
    state.lastAction = cause;
    payloadButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.payload === typeKey));
    });
    updateReadouts();
    redrawPaused();
  }

  function dropPayload(cause, requestedX = state.aimX) {
    const spec = materialSpecs[state.selectedPayload];
    if (bodies.length >= MAX_BODIES) bodies.splice(5, 1);
    const clampedX = Math.max(WORLD_LEFT + spec.width / 2, Math.min(WORLD_RIGHT - spec.width / 2, requestedX));
    bodies.push(createBody(state.selectedPayload, clampedX, -72, {
      vx: (clampedX - state.aimX) * .08,
      vy: 7,
      angle: (state.dropCount % 2 ? -.06 : .06),
      angularVelocity: state.dropCount % 2 ? -.35 : .35,
      z: 4
    }));
    state.aimX = clampedX;
    state.dropCount += 1;
    beginSimulation(cause);
  }

  function launchSideImpact(cause) {
    if (bodies.length >= MAX_BODIES) bodies.splice(5, 1);
    bodies.push(createBody('heavy', WORLD_LEFT - 19, FLOOR_Y - 10, {
      vx: 116,
      vy: -2,
      width: 20,
      height: 20,
      depth: 20,
      mass: 7.2,
      restitution: .04,
      friction: .9,
      threshold: 240,
      angle: .04,
      angularVelocity: .12,
      z: 1,
      isSled: true
    }));
    state.sideImpactCount += 1;
    beginSimulation(cause);
  }

  function recordImpact(bodyA, bodyB, rawImpulse, x, y, collisionKind) {
    const calibratedImpulse = rawImpulse * .18;
    if (calibratedImpulse < 1.2) return;
    const target = bodyB || bodyA;
    const ratioA = calibratedImpulse / bodyA.threshold;
    const ratioB = bodyB ? calibratedImpulse / bodyB.threshold : 0;
    bodyA.flash = Math.max(bodyA.flash, Math.min(1, ratioA * .92 + .1));
    bodyA.damage = Math.max(bodyA.damage, ratioA);
    if (bodyB) {
      bodyB.flash = Math.max(bodyB.flash, Math.min(1, ratioB * .92 + .1));
      bodyB.damage = Math.max(bodyB.damage, ratioB);
    }
    state.materialFlashMutationCount += bodyB ? 2 : 1;
    state.peakImpulse = Math.max(state.peakImpulse, calibratedImpulse);
    state.peakRiskRatio = Math.max(state.peakRiskRatio, ratioA, ratioB);
    state.lastImpactImpulse = calibratedImpulse;
    state.lastImpactPair = bodyB
      ? `${materialSpecs[bodyA.typeKey].label} × ${materialSpecs[bodyB.typeKey].label}`
      : `${materialSpecs[target.typeKey].label} × deck`;
    pulses.push({
      x,
      y,
      life: 1,
      strength: Math.min(1, calibratedImpulse / Math.max(24, target.threshold)),
      color: materialSpecs[target.typeKey].glow,
      collisionKind
    });
    if (pulses.length > 8) pulses.shift();
    updateReadouts();
  }

  function resolveFloor(body) {
    const penetration = body.y + body.height / 2 - FLOOR_Y;
    if (penetration <= 0) return;
    body.y -= penetration;
    if (body.vy <= 0) return;
    const rawImpulse = (1 + body.restitution) * body.vy * body.mass;
    body.vy = -body.vy * body.restitution;
    body.vx *= body.friction;
    body.angularVelocity *= .72;
    if (Math.abs(body.vy) < 2.2) body.vy = 0;
    state.floorCollisionCount += 1;
    recordImpact(body, null, rawImpulse, body.x, FLOOR_Y, 'floor');
  }

  function resolveWalls(body) {
    const halfWidth = body.width / 2;
    if (body.x - halfWidth < WORLD_LEFT) {
      body.x = WORLD_LEFT + halfWidth;
      if (body.vx < 0) body.vx *= -.28;
    }
    if (body.x + halfWidth > WORLD_RIGHT) {
      body.x = WORLD_RIGHT - halfWidth;
      if (body.vx > 0) body.vx *= -.28;
    }
  }

  function resolvePair(bodyA, bodyB) {
    const dx = bodyB.x - bodyA.x;
    const dy = bodyB.y - bodyA.y;
    const overlapX = (bodyA.width + bodyB.width) / 2 - Math.abs(dx);
    const overlapY = (bodyA.height + bodyB.height) / 2 - Math.abs(dy);
    if (overlapX <= 0 || overlapY <= 0) return;

    let nx = 0;
    let ny = 0;
    let penetration = overlapY;
    if (overlapX < overlapY) {
      nx = dx < 0 ? -1 : 1;
      penetration = overlapX;
    } else {
      ny = dy < 0 ? -1 : 1;
    }

    const inverseMassA = 1 / bodyA.mass;
    const inverseMassB = 1 / bodyB.mass;
    const inverseMassTotal = inverseMassA + inverseMassB;
    const correction = Math.max(0, penetration - .015) / inverseMassTotal * .82;
    bodyA.x -= nx * correction * inverseMassA;
    bodyA.y -= ny * correction * inverseMassA;
    bodyB.x += nx * correction * inverseMassB;
    bodyB.y += ny * correction * inverseMassB;

    const relativeVelocity = (bodyB.vx - bodyA.vx) * nx + (bodyB.vy - bodyA.vy) * ny;
    if (relativeVelocity >= 0) return;
    const restitution = Math.min(bodyA.restitution, bodyB.restitution);
    const rawImpulse = -(1 + restitution) * relativeVelocity / inverseMassTotal;
    const impulseX = rawImpulse * nx;
    const impulseY = rawImpulse * ny;
    bodyA.vx -= impulseX * inverseMassA;
    bodyA.vy -= impulseY * inverseMassA;
    bodyB.vx += impulseX * inverseMassB;
    bodyB.vy += impulseY * inverseMassB;
    const spinTransfer = nx * relativeVelocity * .0026;
    bodyA.angularVelocity -= spinTransfer;
    bodyB.angularVelocity += spinTransfer;
    state.bodyCollisionCount += 1;
    recordImpact(bodyA, bodyB, rawImpulse, (bodyA.x + bodyB.x) / 2, (bodyA.y + bodyB.y) / 2, 'body');
  }

  function physicsStep(dt) {
    for (const body of bodies) {
      body.vy += 146 * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.angle += body.angularVelocity * dt;
      body.angularVelocity *= .998;
      body.flash *= state.reducedMotion ? .84 : .93;
      resolveWalls(body);
      resolveFloor(body);
    }

    for (let pass = 0; pass < 3; pass += 1) {
      for (let a = 0; a < bodies.length; a += 1) {
        for (let b = a + 1; b < bodies.length; b += 1) resolvePair(bodies[a], bodies[b]);
      }
      bodies.forEach(resolveFloor);
    }

    pulses.forEach(pulse => { pulse.life -= dt * (state.reducedMotion ? 3.4 : 1.7); });
    pulses = pulses.filter(pulse => pulse.life > 0);
    state.physicsStepCount += 1;
  }

  function stopWhenSettled(deltaSeconds) {
    activeSeconds += deltaSeconds;
    const kinetic = bodies.reduce((sum, body) => sum + Math.abs(body.vx) + Math.abs(body.vy), 0);
    quietFrames = kinetic < 8 ? quietFrames + 1 : 0;
    if (activeSeconds < .7 || (quietFrames < 28 && activeSeconds < 5.4)) return;
    state.isSimulating = false;
    bodies.forEach(body => {
      if (Math.abs(body.vx) < 2) body.vx = 0;
      if (Math.abs(body.vy) < 2) body.vy = 0;
    });
    sketch.noLoop();
    updateReadouts();
  }

  function drawBay(p) {
    const worldScale = Math.min(p.width / 250, p.height / 144);
    const offsetX = p.width < 190 ? -9 : -Math.min(22, p.width * .035);
    p.background('#07100f');
    p.ortho(-p.width / 2, p.width / 2, -p.height / 2, p.height / 2, -900, 900);
    p.ambientLight(61, 72, 67);
    p.directionalLight(220, 240, 224, -.42, .7, -1);
    p.pointLight(124, 226, 188, -p.width * .22, -p.height * .28, 180);

    p.push();
    p.translate(offsetX, 5, 0);
    p.scale(worldScale);
    p.rotateX(-.11);
    p.rotateY(-.19);

    p.push();
    p.noStroke();
    p.translate(-10, FLOOR_Y + 10, -3);
    p.ambientMaterial(25, 42, 37);
    p.box(196, 19, 70, 2, 2);
    p.pop();

    p.push();
    p.stroke(88, 131, 115, 100);
    p.strokeWeight(.45);
    for (let x = WORLD_LEFT; x <= WORLD_RIGHT; x += 18) p.line(x, FLOOR_Y + .2, 34, x, FLOOR_Y + .2, -30);
    for (let z = -30; z <= 34; z += 13) p.line(WORLD_LEFT, FLOOR_Y + .2, z, WORLD_RIGHT, FLOOR_Y + .2, z);
    p.pop();

    p.push();
    p.stroke(159, 228, 200, 105);
    p.strokeWeight(.65);
    p.line(state.aimX, -65, 30, state.aimX, -42, 30);
    p.line(state.aimX - 4, -45, 30, state.aimX, -41, 30);
    p.line(state.aimX + 4, -45, 30, state.aimX, -41, 30);
    p.pop();

    for (const pulse of pulses) {
      const [red, green, blue] = pulse.color;
      const radius = 8 + (1 - pulse.life) * (18 + pulse.strength * 18);
      p.push();
      p.translate(pulse.x, FLOOR_Y - .4, 33);
      p.rotateX(p.HALF_PI);
      p.noFill();
      p.stroke(red, green, blue, 185 * pulse.life);
      p.strokeWeight(.8 + pulse.strength * 1.1);
      p.ellipse(0, 0, radius * 2.2, radius * .75, 40);
      p.pop();
    }

    for (const body of bodies) {
      const spec = materialSpecs[body.typeKey];
      p.push();
      p.translate(body.x, body.y, body.z);
      p.rotateZ(body.angle);
      p.noStroke();
      p.textureMode(p.NORMAL);
      p.texture(spec.p5Image);
      p.box(body.width, body.height, body.depth, 2, 2);
      state.textureDrawCount += 1;
      integratedTextureKeys.add(body.typeKey);

      if (body.flash > .035) {
        const [red, green, blue] = spec.glow;
        p.noFill();
        p.stroke(red, green, blue, Math.min(255, 55 + body.flash * 210));
        p.strokeWeight(.55 + body.flash * 1.1);
        p.box(body.width + 1.5 + body.flash * 2.7, body.height + 1.5 + body.flash * 2.7, body.depth + 1.5);
      }
      p.pop();
    }

    p.pop();
    state.integratedTextureKeys = [...integratedTextureKeys].sort();
  }

  function drawFrame(p) {
    state.draws += 1;
    if (state.initialFramePhysicsSteps === null) state.initialFramePhysicsSteps = state.physicsStepCount;
    if (state.isSimulating) {
      const now = performance.now();
      const deltaSeconds = Math.min(.045, Math.max(0, (now - lastFrameTime) / 1000));
      lastFrameTime = now;
      accumulator += deltaSeconds;
      while (accumulator >= FIXED_STEP) {
        physicsStep(FIXED_STEP);
        accumulator -= FIXED_STEP;
      }
      stopWhenSettled(deltaSeconds);
    }
    drawBay(p);
    if (!readyResolved) {
      readyResolved = true;
      state.webglReady = Boolean(host.querySelector('canvas')?.getContext('webgl2') || host.querySelector('canvas')?.getContext('webgl'));
      updateReadouts();
      resolveReady();
    }
  }

  function pointerToWorldX(event) {
    const bounds = host.getBoundingClientRect();
    const normalized = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    return WORLD_LEFT + normalized * (WORLD_RIGHT - WORLD_LEFT);
  }

  payloadButtons.forEach(button => {
    button.addEventListener('click', event => {
      const inputKind = event.detail === 0 ? 'keyboard-control' : 'pointer-control';
      if (!acceptTrustedInput(event, `select-${button.dataset.payload}`, inputKind)) return;
      selectPayload(button.dataset.payload, `select-${button.dataset.payload}`);
    });
  });

  dropButton.addEventListener('click', event => {
    const inputKind = event.detail === 0 ? 'keyboard-control' : 'pointer-control';
    if (!acceptTrustedInput(event, 'drop-control', inputKind)) return;
    dropPayload('trusted-drop-control');
  });

  joltButton.addEventListener('click', event => {
    const inputKind = event.detail === 0 ? 'keyboard-control' : 'pointer-control';
    if (!acceptTrustedInput(event, 'side-impact-control', inputKind)) return;
    launchSideImpact('trusted-side-impact-control');
  });

  resetButton.addEventListener('click', event => {
    const inputKind = event.detail === 0 ? 'keyboard-control' : 'pointer-control';
    if (!acceptTrustedInput(event, 'reset-control', inputKind)) return;
    resetBay('trusted-reset-control');
  });

  host.addEventListener('pointermove', event => {
    if (!event.isTrusted) return;
    const nextAimX = pointerToWorldX(event);
    if (Math.abs(nextAimX - state.aimX) < .4) return;
    state.aimX = nextAimX;
    state.aimMutationCount += 1;
    redrawPaused();
  });

  host.addEventListener('pointerdown', event => {
    if (!acceptTrustedInput(event, 'aim-drop-bay', `pointer-${event.pointerType || 'mouse'}`)) return;
    state.aimX = pointerToWorldX(event);
    state.aimMutationCount += 1;
    host.focus({ preventScroll: true });
    dropPayload('trusted-pointer-aim-drop', state.aimX);
  });

  host.addEventListener('keydown', event => {
    if (!['1', '2', '3', ' ', 'Enter', 'j', 'J', 'r', 'R', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat || !acceptTrustedInput(event, `key-${event.key}`, 'keyboard')) return;
    if (event.key === '1') selectPayload('cold', 'trusted-key-1');
    if (event.key === '2') selectPayload('heavy', 'trusted-key-2');
    if (event.key === '3') selectPayload('fragile', 'trusted-key-3');
    if (event.key === ' ') dropPayload('trusted-key-space');
    if (event.key === 'Enter' || event.key.toLowerCase() === 'j') launchSideImpact('trusted-key-side-impact');
    if (event.key.toLowerCase() === 'r') resetBay('trusted-key-reset');
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      state.aimX = Math.max(WORLD_LEFT + 15, Math.min(WORLD_RIGHT - 15, state.aimX + (event.key === 'ArrowLeft' ? -9 : 9)));
      state.aimMutationCount += 1;
      state.lastAction = 'trusted-key-aim';
      redrawPaused();
    }
  });

  Promise.all(Object.values(materialSpecs).map(loadTexture)).then(assets => {
    state.assetCount = assets.length;
    state.assetByteLength = assets.reduce((sum, asset) => sum + asset.byteLength, 0);
    state.assetChecksum = assets.reduce((checksum, asset) => checksum ^ asset.checksum, 0) >>> 0;
    state.assetWidth = Math.min(...assets.map(asset => asset.image.naturalWidth));
    state.assetHeight = Math.min(...assets.map(asset => asset.image.naturalHeight));
    bodies = initialStack();
    updateReadouts();

    sketch = new p5(p => {
      p.setup = () => {
        p.pixelDensity(1);
        const canvas = p.createCanvas(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), p.WEBGL);
        canvas.parent(host);
        Object.values(materialSpecs).forEach(spec => {
          const textureImage = p.createImage(spec.image.naturalWidth, spec.image.naturalHeight);
          textureImage.drawingContext.drawImage(spec.image, 0, 0);
          textureImage.setModified(true);
          spec.p5Image = textureImage;
        });
        p.noLoop();
        requestAnimationFrame(() => p.redraw());
      };
      p.draw = () => drawFrame(p);
    }, host);

    const resizeObserver = new ResizeObserver(() => {
      if (!sketch || host.clientWidth < 1 || host.clientHeight < 1) return;
      sketch.resizeCanvas(host.clientWidth, host.clientHeight);
      if (!state.isSimulating) sketch.redraw();
    });
    resizeObserver.observe(host);

    window.__PREVIEW_RUNTIME_ASSERT__ = () => {
      const canvas = host.querySelector('canvas');
      const localAssetsValid = Object.values(materialSpecs).every(spec => {
        const sourceUrl = new URL(spec.resolvedUrl);
        return sourceUrl.origin === location.origin
          && sourceUrl.pathname.endsWith('.jpg')
          && spec.image.complete
          && spec.image.naturalWidth === 512
          && spec.image.naturalHeight === 512
          && spec.p5Image?.width === 512
          && spec.p5Image?.height === 512
          && spec.byteLength > 20_000
          && spec.checksum > 0;
      });
      const initialIntegrityValid = state.simulationActionCount > 0
        || (state.physicsStepCount === 0 && bodies.length === 5 && state.peakImpulse === 0);
      const trustedActionIntegrityValid = state.simulationActionCount === 0
        || (state.simulationStartedByTrustedInput === true && state.trustedInputCount > 0 && state.lastInputTrusted === true);
      return sketch instanceof p5
        && state.task === 'human-triggered-parcel-impact-calibration'
        && state.mechanism === 'p5-webgl-fixed-step-aabb-rigid-body-collision-impulses'
        && state.inputPolicy === 'trusted-only'
        && state.previewClockDriven === false
        && state.autoplay === false
        && state.autoStartAttempted === false
        && state.rehearsalMode === false
        && state.fallbackUsed === false
        && state.syntheticInputUsed === false
        && state.firstFrameWasPaused === true
        && state.initialFramePhysicsSteps === 0
        && state.assetCount === 3
        && state.assetByteLength > 60_000
        && state.assetChecksum > 0
        && state.assetWidth === 512
        && state.assetHeight === 512
        && localAssetsValid
        && state.integratedTextureKeys.length === 3
        && state.textureDrawCount >= 5
        && state.draws > 0
        && state.webglReady === true
        && Boolean(canvas?.getContext('webgl2') || canvas?.getContext('webgl'))
        && initialIntegrityValid
        && trustedActionIntegrityValid
        && host.dataset.inputPolicy === 'trusted-only';
    };

    installPreviewController({
      id: 'collision-reactive-3d-physics-stack',
      library: 'p5@2.3.0',
      renderer: 'webgl',
      render: () => {},
      ready
    });
  }).catch(markPreviewFailure);
} catch (error) {
  markPreviewFailure(error);
}
