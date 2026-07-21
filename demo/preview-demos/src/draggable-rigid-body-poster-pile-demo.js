import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#poster-stage');
  const host = document.querySelector('#poster-host');
  const canvas = document.querySelector('#poster-canvas');
  const selectionOutput = document.querySelector('#selection-output');
  const motionOutput = document.querySelector('#motion-output');
  const previousButton = document.querySelector('#previous-poster');
  const nextButton = document.querySelector('#next-poster');
  const placeButton = document.querySelector('#place-poster');
  const resetButton = document.querySelector('#reset-posters');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !host || !canvas || !selectionOutput || !motionOutput || !previousButton || !nextButton || !placeButton || !resetButton) {
    throw new Error('Poster table DOM is incomplete.');
  }

  const posterSpecs = [
    {
      id: 'orbit',
      file: 'orbit-screenprint.jpg',
      url: new URL('../assets/aesthetic-wave-01/draggable-rigid-body-poster-pile/orbit-screenprint.jpg', import.meta.url).href,
      index: '01',
      title: ['ORBITAL', 'ASSEMBLY'],
      venue: 'MAIN HALL',
      date: '18 OCT',
      ink: '#fff8df',
      accent: '#1b31b8'
    },
    {
      id: 'ribbon',
      file: 'acid-ribbon.jpg',
      url: new URL('../assets/aesthetic-wave-01/draggable-rigid-body-poster-pile/acid-ribbon.jpg', import.meta.url).href,
      index: '02',
      title: ['SOFT', 'CIRCUIT'],
      venue: 'SCREENING',
      date: '19 OCT',
      ink: '#f5ffd2',
      accent: '#dfff46'
    },
    {
      id: 'paper',
      file: 'paper-signal.jpg',
      url: new URL('../assets/aesthetic-wave-01/draggable-rigid-body-poster-pile/paper-signal.jpg', import.meta.url).href,
      index: '03',
      title: ['PAPER', 'WEATHER'],
      venue: 'STUDIO B',
      date: '20 OCT',
      ink: '#fff8ee',
      accent: '#ff5b4d'
    },
    {
      id: 'resin',
      file: 'resin-bloom.jpg',
      url: new URL('../assets/aesthetic-wave-01/draggable-rigid-body-poster-pile/resin-bloom.jpg', import.meta.url).href,
      index: '04',
      title: ['LIQUID', 'TYPE'],
      venue: 'NIGHT LAB',
      date: '21 OCT',
      ink: '#17110f',
      accent: '#a1001f'
    }
  ];

  function loadImage(spec) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = async () => {
        try {
          if (typeof image.decode === 'function') await image.decode();
          resolve({ ...spec, image });
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(new Error(`Unable to load generated poster asset: ${spec.file}`));
      image.src = spec.url;
    });
  }

  const posters = await Promise.all(posterSpecs.map(loadImage));
  const physics = {
    solver: 'oriented-rectangle-sat',
    impulseResponse: true,
    angularImpulse: true,
    wallCollisions: true,
    restitution: .32,
    friction: .3,
    collisionCount: 0,
    integrationSteps: 0
  };
  const state = {
    phase: 'idle',
    selectedIndex: 3,
    shortlistId: null,
    inputCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    throwCount: 0,
    resetCount: 0,
    lastSource: 'none',
    lastPointerType: 'none',
    pointerCaptured: false,
    motionActive: false,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionDirect: reducedMotionQuery.matches,
    automaticPath: false,
    captureClockDriven: false,
    syntheticEvents: false,
    initialStill: true,
    imagesReady: posters.length === posterSpecs.length,
    imageDimensions: posters.map(poster => [poster.image.naturalWidth, poster.image.naturalHeight]),
    renderCount: 0,
    resizeCount: 0,
    activeBodyId: null
  };

  const bodies = posters.map((poster, index) => ({
    id: poster.id,
    poster,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    angle: 0,
    vx: 0,
    vy: 0,
    angularVelocity: 0,
    mass: 1 + index * .06,
    inverseMass: 1 / (1 + index * .06),
    inverseInertia: 0,
    z: index,
    collisionHits: 0
  }));

  const initialLayout = [
    { x: .61, y: .47, angle: -.16 },
    { x: .69, y: .54, angle: .12 },
    { x: .77, y: .46, angle: -.065 },
    { x: .735, y: .57, angle: .17 }
  ];

  let sketch;
  let resolveSketchReady;
  let canvasWidth = 1;
  let canvasHeight = 1;
  let dirty = true;
  let activePointerId = null;
  let dragState = null;
  let highestZ = bodies.length;
  let lastFrameAt = 0;
  const sketchReady = new Promise(resolve => { resolveSketchReady = resolve; });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const cross = (a, b) => a.x * b.y - a.y * b.x;
  const magnitude = vector => Math.hypot(vector.x, vector.y);

  function updateBodySize(body) {
    const cardWidth = clamp(canvasWidth * .21, 30, 154);
    body.w = cardWidth;
    body.h = cardWidth * 1.47;
    body.inverseInertia = 12 / (body.mass * (body.w * body.w + body.h * body.h));
  }

  function resetBodyLayout() {
    bodies.forEach((body, index) => {
      updateBodySize(body);
      body.x = canvasWidth * initialLayout[index].x;
      body.y = canvasHeight * initialLayout[index].y;
      body.angle = initialLayout[index].angle;
      body.vx = 0;
      body.vy = 0;
      body.angularVelocity = 0;
      body.z = index;
      body.collisionHits = 0;
    });
    highestZ = bodies.length;
    state.phase = 'idle';
    state.motionActive = false;
    state.activeBodyId = null;
    state.selectedIndex = 3;
    state.shortlistId = null;
    state.initialStill = state.inputCount === 0;
    dragState = null;
    activePointerId = null;
    dirty = true;
  }

  function resizeBodies(width, height) {
    const previousWidth = canvasWidth;
    const previousHeight = canvasHeight;
    canvasWidth = Math.max(1, width);
    canvasHeight = Math.max(1, height);
    if (previousWidth <= 1 || previousHeight <= 1) {
      resetBodyLayout();
      return;
    }
    bodies.forEach(body => {
      body.x *= canvasWidth / previousWidth;
      body.y *= canvasHeight / previousHeight;
      updateBodySize(body);
      constrainToTable(body, false);
    });
    state.resizeCount += 1;
    dirty = true;
  }

  function axesFor(body) {
    const cosine = Math.cos(body.angle);
    const sine = Math.sin(body.angle);
    return [
      { x: cosine, y: sine },
      { x: -sine, y: cosine }
    ];
  }

  function cornersFor(body) {
    const [axisX, axisY] = axesFor(body);
    const halfWidth = body.w / 2;
    const halfHeight = body.h / 2;
    return [
      { x: body.x + axisX.x * halfWidth + axisY.x * halfHeight, y: body.y + axisX.y * halfWidth + axisY.y * halfHeight },
      { x: body.x - axisX.x * halfWidth + axisY.x * halfHeight, y: body.y - axisX.y * halfWidth + axisY.y * halfHeight },
      { x: body.x - axisX.x * halfWidth - axisY.x * halfHeight, y: body.y - axisX.y * halfWidth - axisY.y * halfHeight },
      { x: body.x + axisX.x * halfWidth - axisY.x * halfHeight, y: body.y + axisX.y * halfWidth - axisY.y * halfHeight }
    ];
  }

  function project(corners, axis) {
    let min = Infinity;
    let max = -Infinity;
    corners.forEach(corner => {
      const value = dot(corner, axis);
      min = Math.min(min, value);
      max = Math.max(max, value);
    });
    return { min, max };
  }

  function collisionBetween(a, b) {
    const cornersA = cornersFor(a);
    const cornersB = cornersFor(b);
    const axes = [...axesFor(a), ...axesFor(b)];
    let minimumOverlap = Infinity;
    let normal = null;

    for (const axis of axes) {
      const projectionA = project(cornersA, axis);
      const projectionB = project(cornersB, axis);
      const overlap = Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min);
      if (overlap <= 0) return null;
      if (overlap < minimumOverlap) {
        minimumOverlap = overlap;
        normal = axis;
      }
    }

    const centerDelta = { x: b.x - a.x, y: b.y - a.y };
    if (dot(centerDelta, normal) < 0) normal = { x: -normal.x, y: -normal.y };
    return { normal, overlap: minimumOverlap };
  }

  function resolveCollision(a, b, draggedBody = null) {
    const collision = collisionBetween(a, b);
    if (!collision) return false;

    const speedEvidence = Math.hypot(a.vx, a.vy) + Math.hypot(b.vx, b.vy) + Math.abs(a.angularVelocity * a.w) + Math.abs(b.angularVelocity * b.w);
    if (speedEvidence < .6 && draggedBody !== a && draggedBody !== b) return false;

    const inverseMassA = draggedBody === a ? 0 : a.inverseMass;
    const inverseMassB = draggedBody === b ? 0 : b.inverseMass;
    const inverseMassSum = inverseMassA + inverseMassB;
    if (inverseMassSum <= 0) return false;

    const correctionMagnitude = Math.min(collision.overlap + .2, Math.min(a.w, b.w) * .2) / inverseMassSum;
    const correction = { x: collision.normal.x * correctionMagnitude, y: collision.normal.y * correctionMagnitude };
    a.x -= correction.x * inverseMassA;
    a.y -= correction.y * inverseMassA;
    b.x += correction.x * inverseMassB;
    b.y += correction.y * inverseMassB;

    const relativeVelocity = { x: b.vx - a.vx, y: b.vy - a.vy };
    const velocityAlongNormal = dot(relativeVelocity, collision.normal);
    if (velocityAlongNormal < 0) {
      const impulseMagnitude = -(1 + physics.restitution) * velocityAlongNormal / inverseMassSum;
      const impulse = { x: collision.normal.x * impulseMagnitude, y: collision.normal.y * impulseMagnitude };
      a.vx -= impulse.x * inverseMassA;
      a.vy -= impulse.y * inverseMassA;
      b.vx += impulse.x * inverseMassB;
      b.vy += impulse.y * inverseMassB;

      const tangentRaw = {
        x: relativeVelocity.x - collision.normal.x * velocityAlongNormal,
        y: relativeVelocity.y - collision.normal.y * velocityAlongNormal
      };
      const tangentLength = magnitude(tangentRaw);
      if (tangentLength > .001) {
        const tangent = { x: tangentRaw.x / tangentLength, y: tangentRaw.y / tangentLength };
        const tangentImpulseMagnitude = clamp(-dot(relativeVelocity, tangent) / inverseMassSum, -impulseMagnitude * physics.friction, impulseMagnitude * physics.friction);
        a.vx -= tangent.x * tangentImpulseMagnitude * inverseMassA;
        a.vy -= tangent.y * tangentImpulseMagnitude * inverseMassA;
        b.vx += tangent.x * tangentImpulseMagnitude * inverseMassB;
        b.vy += tangent.y * tangentImpulseMagnitude * inverseMassB;
      }

      const contact = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const armA = { x: contact.x - a.x, y: contact.y - a.y };
      const armB = { x: contact.x - b.x, y: contact.y - b.y };
      a.angularVelocity -= cross(armA, impulse) * a.inverseInertia * .26;
      b.angularVelocity += cross(armB, impulse) * b.inverseInertia * .26;
    }

    a.collisionHits += 1;
    b.collisionHits += 1;
    physics.collisionCount += 1;
    return true;
  }

  function constrainToTable(body, bounce = true) {
    const cosine = Math.abs(Math.cos(body.angle));
    const sine = Math.abs(Math.sin(body.angle));
    const extentX = cosine * body.w / 2 + sine * body.h / 2;
    const extentY = sine * body.w / 2 + cosine * body.h / 2;
    let collided = false;

    if (body.x - extentX < 2) {
      body.x = extentX + 2;
      if (bounce && body.vx < 0) body.vx *= -physics.restitution;
      collided = true;
    } else if (body.x + extentX > canvasWidth - 2) {
      body.x = canvasWidth - extentX - 2;
      if (bounce && body.vx > 0) body.vx *= -physics.restitution;
      collided = true;
    }

    if (body.y - extentY < 2) {
      body.y = extentY + 2;
      if (bounce && body.vy < 0) body.vy *= -physics.restitution;
      collided = true;
    } else if (body.y + extentY > canvasHeight - 2) {
      body.y = canvasHeight - extentY - 2;
      if (bounce && body.vy > 0) body.vy *= -physics.restitution;
      collided = true;
    }

    if (collided) {
      body.angularVelocity *= .78;
      physics.collisionCount += 1;
    }
  }

  function reviewZone() {
    return {
      x: canvasWidth * .055,
      y: canvasHeight * .15,
      w: canvasWidth * .355,
      h: canvasHeight * .69
    };
  }

  function isInReviewZone(body) {
    const zone = reviewZone();
    return body.x > zone.x && body.x < zone.x + zone.w && body.y > zone.y && body.y < zone.y + zone.h;
  }

  function pointInsideBody(point, body) {
    const cosine = Math.cos(-body.angle);
    const sine = Math.sin(-body.angle);
    const dx = point.x - body.x;
    const dy = point.y - body.y;
    const localX = dx * cosine - dy * sine;
    const localY = dx * sine + dy * cosine;
    return Math.abs(localX) <= body.w / 2 && Math.abs(localY) <= body.h / 2;
  }

  function pointerPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / Math.max(1, bounds.width) * canvasWidth,
      y: (event.clientY - bounds.top) / Math.max(1, bounds.height) * canvasHeight
    };
  }

  function topBodyAt(point) {
    return [...bodies].sort((a, b) => b.z - a.z).find(body => pointInsideBody(point, body)) || null;
  }

  function selectedBody() {
    return bodies[state.selectedIndex];
  }

  function bringToFront(body) {
    highestZ += 1;
    body.z = highestZ;
    state.selectedIndex = bodies.indexOf(body);
    dirty = true;
  }

  function markInput(source, kind = 'control', pointerType = 'none') {
    state.inputCount += 1;
    state.initialStill = false;
    state.lastSource = source;
    if (kind === 'pointer') {
      state.pointerInputCount += 1;
      state.lastPointerType = pointerType;
      if (pointerType === 'touch') state.touchInputCount += 1;
      if (pointerType === 'pen') state.penInputCount += 1;
    } else if (kind === 'keyboard') {
      state.keyboardInputCount += 1;
    } else {
      state.controlInputCount += 1;
    }
  }

  function startMotion(source) {
    if (state.reducedMotion) {
      bodies.forEach(body => {
        body.vx = 0;
        body.vy = 0;
        body.angularVelocity = 0;
      });
      state.motionActive = false;
      state.phase = 'idle';
      dirty = true;
      return;
    }
    state.motionActive = true;
    state.phase = 'throwing';
    state.lastSource = source;
    lastFrameAt = performance.now();
    dirty = true;
  }

  function settleAll() {
    bodies.forEach(body => {
      body.vx = 0;
      body.vy = 0;
      body.angularVelocity = 0;
      constrainToTable(body, false);
    });
    state.motionActive = false;
    if (!dragState) state.phase = 'idle';
    dirty = true;
  }

  function simulate(now) {
    if (!state.motionActive || dragState || state.reducedMotion) return;
    const elapsed = clamp((now - lastFrameAt) / 1000, 0, 1 / 20);
    lastFrameAt = now;
    const steps = 3;
    const dt = elapsed / steps;

    for (let step = 0; step < steps; step += 1) {
      bodies.forEach(body => {
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        body.angle += body.angularVelocity * dt;
        body.vx *= Math.exp(-2.7 * dt);
        body.vy *= Math.exp(-2.7 * dt);
        body.angularVelocity *= Math.exp(-3.2 * dt);
        constrainToTable(body, true);
      });

      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) resolveCollision(bodies[i], bodies[j]);
      }
      physics.integrationSteps += 1;
    }

    const motionLevel = Math.max(...bodies.map(body => Math.hypot(body.vx, body.vy) + Math.abs(body.angularVelocity) * 24));
    if (motionLevel < 6) {
      settleAll();
    } else {
      state.phase = motionLevel > 85 ? 'throwing' : 'settling';
      dirty = true;
    }
  }

  function resolveDraggedCollisions(body) {
    bodies.forEach(other => {
      if (other !== body) resolveCollision(body, other, body);
    });
    bodies.forEach(other => constrainToTable(other, !state.reducedMotion));
  }

  function selectIndex(index, source, kind = 'control') {
    const wrapped = (index + bodies.length) % bodies.length;
    markInput(source, kind);
    bringToFront(bodies[wrapped]);
    state.phase = 'idle';
    dirty = true;
  }

  function placeSelected(source, kind = 'control') {
    markInput(source, kind);
    settleAll();
    const body = selectedBody();
    const zone = reviewZone();
    body.x = zone.x + zone.w * .59;
    body.y = zone.y + zone.h * .58;
    body.angle = -.055;
    body.vx = 0;
    body.vy = 0;
    body.angularVelocity = 0;
    bringToFront(body);
    state.shortlistId = body.id;
    state.motionActive = false;
    state.phase = 'idle';
    dirty = true;
  }

  function resetFromInput(source, kind = 'control') {
    markInput(source, kind);
    state.resetCount += 1;
    if (state.pointerCaptured && activePointerId !== null && canvas.hasPointerCapture(activePointerId)) {
      canvas.releasePointerCapture(activePointerId);
    }
    state.pointerCaptured = false;
    resetBodyLayout();
  }

  function roundRectPath(context, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
  }

  function drawPoster(instance, body) {
    const context = instance.drawingContext;
    const isSelected = body === selectedBody();
    const isShortlisted = body.id === state.shortlistId;
    const width = body.w;
    const height = body.h;
    const radius = Math.max(2, width * .035);
    context.save();
    context.translate(body.x, body.y);
    context.rotate(body.angle);
    context.shadowColor = isSelected ? 'rgba(31, 35, 26, .28)' : 'rgba(31, 35, 26, .19)';
    context.shadowBlur = isSelected ? width * .14 : width * .08;
    context.shadowOffsetX = width * .018;
    context.shadowOffsetY = width * .045;
    roundRectPath(context, -width / 2, -height / 2, width, height, radius);
    context.fillStyle = '#eeeadd';
    context.fill();
    context.clip();

    const image = body.poster.image;
    const imageScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * imageScale;
    const drawHeight = image.naturalHeight * imageScale;
    context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    const gradient = context.createLinearGradient(0, -height * .12, 0, height / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(.62, 'rgba(0,0,0,.08)');
    gradient.addColorStop(1, body.id === 'resin' ? 'rgba(255,239,230,.84)' : 'rgba(10,12,10,.72)');
    context.fillStyle = gradient;
    context.fillRect(-width / 2, -height * .12, width, height * .63);

    const padding = width * .075;
    const tiny = Math.max(3.2, width * .052);
    const title = Math.max(6, width * .145);
    context.shadowColor = 'transparent';
    context.fillStyle = body.poster.ink;
    context.textBaseline = 'top';
    context.font = `800 ${tiny}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    context.letterSpacing = `${tiny * .06}px`;
    context.fillText(`${body.poster.index} / FIELD NOTES`, -width / 2 + padding, -height / 2 + padding, width * .77);
    context.font = `900 ${title}px system-ui, -apple-system, sans-serif`;
    context.letterSpacing = `${-title * .055}px`;
    context.fillText(body.poster.title[0], -width / 2 + padding, height / 2 - title * 2.75, width * .86);
    context.fillText(body.poster.title[1], -width / 2 + padding, height / 2 - title * 1.8, width * .86);
    context.font = `780 ${tiny}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    context.letterSpacing = `${tiny * .045}px`;
    context.fillText(`${body.poster.date}  ·  ${body.poster.venue}`, -width / 2 + padding, height / 2 - title * .53, width * .86);

    context.fillStyle = body.poster.accent;
    context.fillRect(width / 2 - padding - tiny * 1.9, -height / 2 + padding, tiny * 1.9, tiny * .36);

    if (isShortlisted) {
      context.fillStyle = '#dfff46';
      context.strokeStyle = '#171a17';
      context.lineWidth = Math.max(.6, width * .008);
      context.beginPath();
      context.arc(width / 2 - padding - tiny, height / 2 - padding - tiny, tiny * 1.05, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = '#171a17';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `900 ${tiny * .9}px system-ui, sans-serif`;
      context.fillText('✓', width / 2 - padding - tiny, height / 2 - padding - tiny * .92);
    }

    context.restore();

    if (isSelected) {
      context.save();
      context.translate(body.x, body.y);
      context.rotate(body.angle);
      roundRectPath(context, -width / 2 - 2, -height / 2 - 2, width + 4, height + 4, radius + 2);
      context.strokeStyle = '#dfff46';
      context.lineWidth = Math.max(1.2, width * .016);
      context.stroke();
      context.restore();
    }
  }

  function drawTable(instance) {
    instance.background('#d6d0c2');
    const context = instance.drawingContext;
    context.save();
    const wash = context.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    wash.addColorStop(0, 'rgba(245,241,226,.72)');
    wash.addColorStop(.48, 'rgba(214,208,194,.12)');
    wash.addColorStop(1, 'rgba(126,126,111,.16)');
    context.fillStyle = wash;
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = 'rgba(38,42,35,.055)';
    const grainCount = clamp(Math.round(canvasWidth * canvasHeight / 1800), 16, 170);
    for (let index = 0; index < grainCount; index += 1) {
      const x = (index * 71 + 23) % canvasWidth;
      const y = (index * 43 + 17) % canvasHeight;
      context.fillRect(x, y, .7, .7);
    }
    context.restore();

    const zone = reviewZone();
    context.save();
    context.setLineDash([Math.max(4, canvasWidth * .008), Math.max(4, canvasWidth * .008)]);
    context.strokeStyle = state.shortlistId ? 'rgba(40,54,31,.65)' : 'rgba(46,51,43,.34)';
    context.lineWidth = Math.max(.7, canvasWidth * .0012);
    roundRectPath(context, zone.x, zone.y, zone.w, zone.h, Math.max(6, canvasWidth * .015));
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = 'rgba(240,237,224,.23)';
    roundRectPath(context, zone.x, zone.y, zone.w, zone.h, Math.max(6, canvasWidth * .015));
    context.fill();
    if (canvasWidth > 180) {
      context.fillStyle = 'rgba(30,34,28,.58)';
      context.textBaseline = 'bottom';
      context.font = `800 ${clamp(canvasWidth * .011, 3.5, 9)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      context.fillText('REVIEW LANE / RELEASE HERE', zone.x + Math.max(5, canvasWidth * .014), zone.y + zone.h - Math.max(5, canvasHeight * .022));
    }
    context.restore();

    const sorted = [...bodies].sort((a, b) => a.z - b.z);
    sorted.forEach(body => drawPoster(instance, body));
  }

  function syncInterface() {
    const active = selectedBody();
    const shortlisted = bodies.find(body => body.id === state.shortlistId);
    selectionOutput.textContent = shortlisted ? `${shortlisted.poster.title.join(' ')}` : `${active.poster.index} selected`;
    motionOutput.textContent = state.phase === 'dragging'
      ? 'Poster in hand'
      : state.phase === 'throwing'
        ? 'Throw in motion'
        : state.phase === 'settling'
          ? 'Paper settling'
          : shortlisted
            ? 'Review lane set'
            : 'Table still';
    stage.dataset.phase = state.phase;
    stage.dataset.selected = String(state.selectedIndex);
    stage.dataset.shortlist = state.shortlistId || 'none';
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.pointerInputCount = String(state.pointerInputCount);
    stage.dataset.touchInputCount = String(state.touchInputCount);
    stage.dataset.penInputCount = String(state.penInputCount);
    stage.dataset.keyboardInputCount = String(state.keyboardInputCount);
    stage.dataset.controlInputCount = String(state.controlInputCount);
    stage.dataset.lastSource = state.lastSource;
    stage.dataset.lastPointerType = state.lastPointerType;
    stage.dataset.motionActive = String(state.motionActive);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    stage.dataset.imagesReady = String(state.imagesReady);
    stage.dataset.reducedMotion = String(state.reducedMotion);
    if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
      stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__());
    }
  }

  function endPointer(event, cancelled = false) {
    if (!dragState || event.pointerId !== activePointerId) return;
    const body = dragState.body;
    const shouldReleaseCapture = state.pointerCaptured && canvas.hasPointerCapture(event.pointerId);
    state.pointerCaptured = false;
    state.activeBodyId = null;
    activePointerId = null;
    dragState = null;
    if (shouldReleaseCapture) canvas.releasePointerCapture(event.pointerId);

    if (cancelled || state.reducedMotion) {
      body.vx = 0;
      body.vy = 0;
      body.angularVelocity = 0;
      state.motionActive = false;
      state.phase = 'idle';
    } else {
      body.vx = clamp(body.vx, -900, 900);
      body.vy = clamp(body.vy, -900, 900);
      body.angularVelocity = clamp(body.angularVelocity, -6, 6);
      state.throwCount += 1;
      startMotion(`pointer-${event.pointerType || 'mouse'}-throw`);
    }

    if (isInReviewZone(body)) state.shortlistId = body.id;
    dirty = true;
  }

  canvas.addEventListener('pointerdown', event => {
    const point = pointerPoint(event);
    const body = topBodyAt(point);
    if (!body) return;
    event.preventDefault();
    markInput(`pointer-${event.pointerType || 'mouse'}-drag`, 'pointer', event.pointerType || 'mouse');
    settleAll();
    bringToFront(body);
    activePointerId = event.pointerId;
    state.pointerCaptured = typeof canvas.setPointerCapture === 'function';
    if (state.pointerCaptured) canvas.setPointerCapture(event.pointerId);
    state.phase = 'dragging';
    state.activeBodyId = body.id;
    dragState = {
      body,
      offsetX: point.x - body.x,
      offsetY: point.y - body.y,
      previousX: body.x,
      previousY: body.y,
      previousAngle: body.angle,
      previousTime: performance.now()
    };
    dirty = true;
  });

  canvas.addEventListener('pointermove', event => {
    if (!dragState || event.pointerId !== activePointerId) return;
    event.preventDefault();
    const point = pointerPoint(event);
    const body = dragState.body;
    const now = performance.now();
    const elapsed = clamp((now - dragState.previousTime) / 1000, 1 / 240, .08);
    const nextX = point.x - dragState.offsetX;
    const nextY = point.y - dragState.offsetY;
    const deltaX = nextX - body.x;
    const deltaY = nextY - body.y;
    body.x = nextX;
    body.y = nextY;
    body.angle += clamp(deltaX * .0018, -.08, .08);
    body.vx = deltaX / elapsed;
    body.vy = deltaY / elapsed;
    body.angularVelocity = (body.angle - dragState.previousAngle) / elapsed;
    dragState.previousX = body.x;
    dragState.previousY = body.y;
    dragState.previousAngle = body.angle;
    dragState.previousTime = now;
    resolveDraggedCollisions(body);
    dirty = true;
  });

  canvas.addEventListener('pointerup', event => endPointer(event));
  canvas.addEventListener('pointercancel', event => endPointer(event, true));
  canvas.addEventListener('lostpointercapture', event => {
    if (dragState && event.pointerId === activePointerId) endPointer(event, true);
  });

  canvas.addEventListener('keydown', event => {
    const digit = Number(event.key);
    if (digit >= 1 && digit <= bodies.length) {
      event.preventDefault();
      selectIndex(digit - 1, `keyboard-${digit}`, 'keyboard');
      return;
    }

    if (event.key === '[' || event.key === ']') {
      event.preventDefault();
      selectIndex(state.selectedIndex + (event.key === ']' ? 1 : -1), `keyboard-${event.key === ']' ? 'next' : 'previous'}`, 'keyboard');
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      placeSelected('keyboard-Enter', 'keyboard');
      return;
    }

    if (event.key === 'Escape' || event.key === 'Home') {
      event.preventDefault();
      resetFromInput(`keyboard-${event.key}`, 'keyboard');
      return;
    }

    const direction = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }
    }[event.key];
    if (!direction) return;
    event.preventDefault();
    markInput(`keyboard-${event.shiftKey ? 'rotate-' : ''}${event.key}`, 'keyboard');
    const body = selectedBody();
    bringToFront(body);

    if (event.shiftKey) {
      if (state.reducedMotion) {
        body.angle += direction.x * .09 + direction.y * .055;
        body.angularVelocity = 0;
      } else {
        body.angularVelocity += direction.x * 2.1 + direction.y * 1.2;
      }
    } else if (state.reducedMotion) {
      const distance = clamp(canvasWidth * .035, 5, 18);
      body.x += direction.x * distance;
      body.y += direction.y * distance;
      body.vx = 0;
      body.vy = 0;
      resolveDraggedCollisions(body);
      constrainToTable(body, false);
    } else {
      const impulse = clamp(canvasWidth * .48, 78, 290);
      body.vx += direction.x * impulse;
      body.vy += direction.y * impulse;
      body.angularVelocity += direction.x * .35;
    }

    startMotion(`keyboard-${event.key}`);
  });

  previousButton.addEventListener('click', () => selectIndex(state.selectedIndex - 1, 'control-previous'));
  nextButton.addEventListener('click', () => selectIndex(state.selectedIndex + 1, 'control-next'));
  placeButton.addEventListener('click', () => placeSelected('control-review'));
  resetButton.addEventListener('click', () => resetFromInput('control-reset'));

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    state.reducedMotionDirect = event.matches;
    if (event.matches) settleAll();
    dirty = true;
  });

  sketch = new p5(instance => {
    instance.setup = () => {
      instance.pixelDensity(1);
      const width = Math.max(1, Math.round(host.clientWidth || innerWidth));
      const height = Math.max(1, Math.round(host.clientHeight || innerHeight));
      instance.createCanvas(width, height, instance.P2D, canvas);
      instance.noLoop();
      resizeBodies(width, height);
      resolveSketchReady();
    };

    instance.draw = () => {
      state.renderCount += 1;
      drawTable(instance);
      syncInterface();
    };

    instance.windowResized = () => {
      const width = Math.max(1, Math.round(host.clientWidth || innerWidth));
      const height = Math.max(1, Math.round(host.clientHeight || innerHeight));
      instance.resizeCanvas(width, height, true);
      resizeBodies(width, height);
    };
  }, host);

  window.__POSTER_TABLE_STATE__ = state;
  window.__POSTER_TABLE_BODIES__ = bodies;
  window.__POSTER_TABLE_PHYSICS__ = physics;
  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvasContext = canvas.getContext('2d');
    const dimensionsValid = state.imageDimensions.every(([width, height]) => width >= 600 && height >= 900);
    const finiteBodies = bodies.every(body => [body.x, body.y, body.w, body.h, body.angle, body.vx, body.vy, body.angularVelocity].every(Number.isFinite));
    const bodiesBounded = bodies.every(body => body.x >= -body.w && body.x <= canvasWidth + body.w && body.y >= -body.h && body.y <= canvasHeight + body.h);
    const stillContract = state.inputCount > 0 || (
      state.phase === 'idle'
      && !state.motionActive
      && bodies.every(body => body.vx === 0 && body.vy === 0 && body.angularVelocity === 0)
    );
    const reducedMotionContract = !state.reducedMotion || dragState !== null || (
      !state.motionActive
      && bodies.every(body => body.vx === 0 && body.vy === 0 && body.angularVelocity === 0)
    );
    return sketch instanceof p5
      && posters.length === 4
      && bodies.length === 4
      && new Set(bodies.map(body => body.id)).size === 4
      && posters.every(poster => poster.image instanceof HTMLImageElement && poster.image.complete)
      && state.imagesReady
      && dimensionsValid
      && canvasContext instanceof CanvasRenderingContext2D
      && canvas.width === canvasWidth
      && canvas.height === canvasHeight
      && state.renderCount > 0
      && physics.solver === 'oriented-rectangle-sat'
      && physics.impulseResponse
      && physics.angularImpulse
      && physics.wallCollisions
      && state.automaticPath === false
      && state.captureClockDriven === false
      && state.syntheticEvents === false
      && typeof canvas.setPointerCapture === 'function'
      && finiteBodies
      && bodiesBounded
      && stillContract
      && reducedMotionContract
      && window.__POSTER_TABLE_STATE__ === state
      && window.__POSTER_TABLE_BODIES__ === bodies
      && window.__POSTER_TABLE_PHYSICS__ === physics;
  };

  const ready = Promise.all([document.fonts.ready, sketchReady]);
  installPreviewController({
    id: 'draggable-rigid-body-poster-pile',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {
      simulate(performance.now());
      if (dirty || state.motionActive) {
        dirty = false;
        sketch.redraw();
      }
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
