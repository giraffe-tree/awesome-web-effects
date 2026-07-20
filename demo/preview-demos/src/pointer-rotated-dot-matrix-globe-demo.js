import './batch-a-qa.js';
import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('.globe-stage');
  const host = document.querySelector('#globe-host');
  const focusButton = document.querySelector('#focus-button');
  const resetButton = document.querySelector('#reset-button');
  const focusLabel = document.querySelector('#focus-label');
  const focusPlace = document.querySelector('#focus-place');
  const latencyValue = document.querySelector('#latency-value');
  const coverageValue = document.querySelector('#coverage-value');
  const instruction = document.querySelector('#instruction');
  const orientationValue = document.querySelector('#orientation-value');

  const latitudeCount = 18;
  const longitudeCount = 36;
  const initialYaw = -Math.PI / 2;
  const initialPitch = -0.35;
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const sites = [
    { id: 'sfo', code: 'SFO', city: 'San Francisco', lat: 37.7749, lon: -122.4194, latency: 18, coverage: '99.99%', peers: ['lhr', 'hnd'] },
    { id: 'gru', code: 'GRU', city: 'São Paulo', lat: -23.5505, lon: -46.6333, latency: 31, coverage: '99.97%', peers: ['sfo', 'lhr'] },
    { id: 'lhr', code: 'LHR', city: 'London', lat: 51.5074, lon: -0.1278, latency: 22, coverage: '99.99%', peers: ['sfo', 'fra', 'gru'] },
    { id: 'fra', code: 'FRA', city: 'Frankfurt', lat: 50.1109, lon: 8.6821, latency: 19, coverage: '99.99%', peers: ['lhr', 'bom'] },
    { id: 'bom', code: 'BOM', city: 'Mumbai', lat: 19.076, lon: 72.8777, latency: 29, coverage: '99.96%', peers: ['fra', 'sin'] },
    { id: 'sin', code: 'SIN', city: 'Singapore', lat: 1.3521, lon: 103.8198, latency: 17, coverage: '99.99%', peers: ['bom', 'hnd', 'syd'] },
    { id: 'hnd', code: 'HND', city: 'Tokyo', lat: 35.6762, lon: 139.6503, latency: 21, coverage: '99.98%', peers: ['sin', 'sfo'] },
    { id: 'syd', code: 'SYD', city: 'Sydney', lat: -33.8688, lon: 151.2093, latency: 26, coverage: '99.97%', peers: ['sin', 'sfo'] },
  ];

  const pointField = Array.from({ length: latitudeCount }, (_, latIndex) => {
    const lat = -85 + ((latIndex + 0.5) / latitudeCount) * 170;
    return Array.from({ length: longitudeCount }, (_, lonIndex) => ({
      lat,
      lon: -180 + (lonIndex / longitudeCount) * 360,
      id: `g-${latIndex}-${lonIndex}`,
    }));
  }).flat();

  const spatialChecksum = pointField.reduce((checksum, point, index) => (
    Math.imul(checksum ^ Math.round((point.lat + 90) * 100) ^ Math.round((point.lon + 180) * 10) ^ index, 16777619) >>> 0
  ), 2166136261);
  const siteChecksum = sites.reduce((checksum, site, index) => (
    Math.imul(checksum ^ Math.round((site.lat + 90) * 1000) ^ Math.round((site.lon + 180) * 1000) ^ site.latency ^ index, 16777619) >>> 0
  ), 2166136261);

  const state = {
    claimedLibrary: 'p5@2.3.0',
    p5Instance: false,
    renderer: 'canvas2d',
    projection: 'orthographic',
    inputAdapters: ['pointer', 'touch', 'click', 'keyboard'],
    automaticPlayback: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    previewClockDrivesRotation: false,
    yaw: initialYaw,
    pitch: initialPitch,
    dragging: false,
    dragDistance: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    selectedSiteId: null,
    nearestSiteId: null,
    pointerRotations: 0,
    keyboardRotations: 0,
    focusCount: 0,
    resetCount: 0,
    inputCount: 0,
    lastInput: 'idle',
    renderCount: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    pointCount: pointField.length,
    siteCount: sites.length,
    routeCount: 0,
    visibleSiteCount: 0,
    projectedFrontCount: 0,
    spatialChecksum,
    siteChecksum,
    initialFrameChecksum: 0,
    initialStaticConfirmed: false,
    reducedMotion: reducedMotionQuery.matches,
    revision: 0,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let resolveReady;
  let draws = 0;
  let lastRenderedRevision = -1;
  let projectedFrontCount = 0;
  let lastLayout = null;
  const setupReady = new Promise((resolve) => { resolveReady = resolve; });

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const radians = (degrees) => degrees * Math.PI / 180;
  const degrees = (angle) => angle * 180 / Math.PI;
  const normalizeAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));

  const vectorForGeo = (lat, lon) => {
    const phi = radians(lat);
    const lambda = radians(lon);
    return {
      x: Math.cos(phi) * Math.cos(lambda),
      y: -Math.sin(phi),
      z: Math.cos(phi) * Math.sin(lambda),
    };
  };

  const projectVector = (vector, yaw = state.yaw, pitch = state.pitch) => {
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const x = vector.x * cosYaw + vector.z * sinYaw;
    const yawZ = -vector.x * sinYaw + vector.z * cosYaw;
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    return {
      x,
      y: vector.y * cosPitch - yawZ * sinPitch,
      z: vector.y * sinPitch + yawZ * cosPitch,
    };
  };

  const projectGeo = (lat, lon, yaw = state.yaw, pitch = state.pitch) => (
    projectVector(vectorForGeo(lat, lon), yaw, pitch)
  );

  const siteById = (id) => sites.find((site) => site.id === id) ?? null;

  const layoutFor = (width, height) => {
    const tiny = width <= 190 || height <= 110;
    const compact = width <= 420;
    const radius = tiny
      ? Math.min(width * 0.285, height * 0.37)
      : compact
        ? Math.min(width * 0.255, height * 0.355)
        : Math.min(width * 0.255, height * 0.365);
    return {
      tiny,
      compact,
      cx: tiny ? width * 0.51 : compact ? width * 0.71 : width * 0.695,
      cy: tiny ? height * 0.49 : height * 0.50,
      radius,
    };
  };

  const viewCenter = () => {
    // Invert the yaw-then-pitch transform for the camera's forward vector.
    const centerVector = {
      x: -Math.sin(state.yaw) * Math.cos(state.pitch),
      y: Math.sin(state.pitch),
      z: Math.cos(state.yaw) * Math.cos(state.pitch),
    };
    const lat = -Math.asin(clamp(centerVector.y, -1, 1));
    const lon = Math.atan2(centerVector.z, centerVector.x);
    return { lat: degrees(lat), lon: degrees(lon) };
  };

  const formatCoordinate = (value, positive, negative, width) => {
    const hemisphere = value >= 0 ? positive : negative;
    return `${String(Math.round(Math.abs(value))).padStart(width, '0')}°${hemisphere}`;
  };

  const updateOrientation = () => {
    const center = viewCenter();
    orientationValue.textContent = `${formatCoordinate(center.lat, 'N', 'S', 2)} · ${formatCoordinate(center.lon, 'E', 'W', 3)}`;
  };

  const nearestVisibleSite = () => {
    const projected = sites
      .map((site) => ({ site, point: projectGeo(site.lat, site.lon) }))
      .filter(({ point }) => point.z > 0.03)
      .sort((a, b) => {
        const distanceA = a.point.x ** 2 + a.point.y ** 2;
        const distanceB = b.point.x ** 2 + b.point.y ** 2;
        return distanceA - distanceB;
      });
    return projected[0]?.site ?? null;
  };

  const updateNearestSite = () => {
    state.nearestSiteId = nearestVisibleSite()?.id ?? null;
  };

  const updateCopy = () => {
    const site = siteById(state.selectedSiteId);
    if (!site) {
      focusLabel.textContent = 'Awaiting focus';
      focusPlace.textContent = 'No region selected';
      latencyValue.textContent = '—';
      coverageValue.textContent = 'Global';
      instruction.textContent = 'Rotate the network, then focus the node nearest the crosshair.';
      focusButton.textContent = 'Focus nearest';
      return;
    }

    focusLabel.textContent = 'Region in focus';
    focusPlace.innerHTML = `<span class="site-code">${site.code}</span> · ${site.city}`;
    latencyValue.textContent = `${site.latency} ms`;
    coverageValue.textContent = site.coverage;
    instruction.textContent = `${site.peers.length} live routes from this edge. Rotate again to inspect another region.`;
    focusButton.textContent = 'Refocus';
  };

  const syncDomState = () => {
    host.dataset.selectedSite = state.selectedSiteId ?? 'none';
    host.dataset.nearestSite = state.nearestSiteId ?? 'none';
    host.dataset.lastInput = state.lastInput;
    host.dataset.dragging = String(state.dragging);
    host.dataset.yaw = state.yaw.toFixed(5);
    host.dataset.pitch = state.pitch.toFixed(5);
    stage.dataset.focused = String(Boolean(state.selectedSiteId));
    focusButton.setAttribute('aria-pressed', String(Boolean(state.selectedSiteId)));
  };

  const recordInput = (source) => {
    state.inputCount += 1;
    state.lastInput = source;
  };

  const markDirty = () => {
    state.revision += 1;
    updateNearestSite();
    updateOrientation();
    syncDomState();
    if (sketch) sketch.redraw();
  };

  const clearFocus = () => {
    state.selectedSiteId = null;
    updateCopy();
  };

  const rotateBy = (yawDelta, pitchDelta, source) => {
    state.yaw = normalizeAngle(state.yaw + yawDelta);
    state.pitch = clamp(state.pitch + pitchDelta, -0.84, 0.84);
    clearFocus();
    if (source === 'pointer') state.pointerRotations += 1;
    if (source === 'keyboard') state.keyboardRotations += 1;
    markDirty();
  };

  const focusNearest = () => {
    const site = nearestVisibleSite();
    if (!site) return;
    state.selectedSiteId = site.id;
    state.nearestSiteId = site.id;
    state.focusCount += 1;
    updateCopy();
    markDirty();
  };

  const resetView = () => {
    state.yaw = initialYaw;
    state.pitch = initialPitch;
    state.selectedSiteId = null;
    state.resetCount += 1;
    updateCopy();
    markDirty();
  };

  const endPointerInteraction = (event) => {
    if (!state.dragging) return;
    state.dragging = false;
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
    focusNearest();
  };

  host.addEventListener('pointerdown', (event) => {
    recordInput(event.pointerType === 'touch' ? 'touch' : 'pointer');
    state.dragging = true;
    state.dragDistance = 0;
    state.lastPointerX = event.clientX;
    state.lastPointerY = event.clientY;
    host.setPointerCapture(event.pointerId);
  });

  host.addEventListener('pointermove', (event) => {
    if (!state.dragging) return;
    const deltaX = event.clientX - state.lastPointerX;
    const deltaY = event.clientY - state.lastPointerY;
    state.dragDistance += Math.hypot(deltaX, deltaY);
    state.lastPointerX = event.clientX;
    state.lastPointerY = event.clientY;
    rotateBy(deltaX * 0.011, deltaY * 0.009, 'pointer');
  });

  host.addEventListener('pointerup', endPointerInteraction);
  host.addEventListener('pointercancel', endPointerInteraction);

  host.addEventListener('keydown', (event) => {
    const keyRotations = {
      ArrowLeft: [-0.16, 0],
      ArrowRight: [0.16, 0],
      ArrowUp: [0, -0.13],
      ArrowDown: [0, 0.13],
    };
    const delta = keyRotations[event.key];
    if (delta) {
      event.preventDefault();
      recordInput(`keyboard:${event.key}`);
      rotateBy(delta[0], delta[1], 'keyboard');
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      recordInput(`keyboard:${event.key === ' ' ? 'Space' : 'Enter'}`);
      focusNearest();
      return;
    }
    if (event.key === 'Escape' || event.key === 'Home') {
      event.preventDefault();
      recordInput(`keyboard:${event.key}`);
      resetView();
    }
  });

  focusButton.addEventListener('click', () => {
    recordInput('click:focus');
    focusNearest();
  });
  resetButton.addEventListener('click', () => {
    recordInput('click:reset');
    resetView();
  });
  const handleReducedMotionChange = (event) => {
    state.reducedMotion = event.matches;
    markDirty();
  };
  if (typeof reducedMotionQuery.addEventListener === 'function') reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  else reducedMotionQuery.addListener(handleReducedMotionChange);

  const greatCirclePoint = (from, to, amount) => {
    const a = vectorForGeo(from.lat, from.lon);
    const b = vectorForGeo(to.lat, to.lon);
    const dot = clamp(a.x * b.x + a.y * b.y + a.z * b.z, -1, 1);
    const omega = Math.acos(dot);
    if (omega < 0.0001) return a;
    const sine = Math.sin(omega);
    const weightA = Math.sin((1 - amount) * omega) / sine;
    const weightB = Math.sin(amount * omega) / sine;
    const lift = 1 + Math.sin(amount * Math.PI) * 0.075;
    return {
      x: (a.x * weightA + b.x * weightB) * lift,
      y: (a.y * weightA + b.y * weightB) * lift,
      z: (a.z * weightA + b.z * weightB) * lift,
    };
  };

  const drawRoute = (p, from, to, layout) => {
    const samples = 30;
    let activeSegment = false;
    p.noFill();
    p.stroke(198, 243, 106, 112);
    p.strokeWeight(layout.tiny ? 0.65 : 1.05);
    for (let index = 0; index <= samples; index += 1) {
      const projected = projectVector(greatCirclePoint(from, to, index / samples));
      if (projected.z > 0) {
        if (!activeSegment) {
          p.beginShape();
          activeSegment = true;
        }
        p.vertex(layout.cx + projected.x * layout.radius, layout.cy + projected.y * layout.radius);
      } else if (activeSegment) {
        p.endShape();
        activeSegment = false;
      }
    }
    if (activeSegment) p.endShape();
  };

  sketch = new p5((p) => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(host);
      p.noLoop();
      p.textFont('ui-monospace, SFMono-Regular, Menlo, monospace');
      state.p5Instance = true;
      state.canvasWidth = p.width;
      state.canvasHeight = p.height;
      updateNearestSite();
      updateOrientation();
      updateCopy();
      syncDomState();
      resolveReady();
    };

    p.windowResized = () => {
      p.resizeCanvas(innerWidth, innerHeight);
      markDirty();
    };

    p.draw = () => {
      draws += 1;
      state.renderCount = draws;
      state.canvasWidth = p.width;
      state.canvasHeight = p.height;
      lastRenderedRevision = state.revision;
      p.clear();
      const layout = layoutFor(p.width, p.height);
      lastLayout = layout;
      const points = pointField.map((point) => {
        const projected = projectGeo(point.lat, point.lon);
        return { ...projected, id: point.id };
      }).sort((a, b) => a.z - b.z);

      projectedFrontCount = points.filter((point) => point.z > 0).length;
      state.projectedFrontCount = projectedFrontCount;

      p.noFill();
      p.stroke(103, 215, 179, 32);
      p.strokeWeight(1);
      p.circle(layout.cx, layout.cy, layout.radius * 2.04);

      p.noStroke();
      for (const point of points) {
        if (point.z < -0.1) continue;
        const depth = clamp((point.z + 0.08) / 1.08, 0, 1);
        const size = (layout.tiny ? 0.7 : 1.05) + depth * (layout.tiny ? 1.05 : 2.05);
        p.fill(90 + depth * 52, 153 + depth * 72, 137 + depth * 58, 22 + depth * 170);
        p.circle(layout.cx + point.x * layout.radius, layout.cy + point.y * layout.radius, size);
      }

      const selected = siteById(state.selectedSiteId);
      state.routeCount = selected?.peers.length ?? 0;
      if (selected) {
        for (const peerId of selected.peers) {
          const peer = siteById(peerId);
          if (peer) drawRoute(p, selected, peer, layout);
        }
      }

      const projectedSites = sites
        .map((site) => ({ site, point: projectGeo(site.lat, site.lon) }))
        .sort((a, b) => a.point.z - b.point.z);
      state.visibleSiteCount = projectedSites.filter(({ point }) => point.z > 0).length;

      for (const { site, point } of projectedSites) {
        if (point.z <= 0) continue;
        const x = layout.cx + point.x * layout.radius;
        const y = layout.cy + point.y * layout.radius;
        const isSelected = site.id === state.selectedSiteId;
        const isNearest = site.id === state.nearestSiteId;
        const alpha = 105 + point.z * 145;

        if (isSelected) {
          p.noFill();
          p.stroke(198, 243, 106, 205);
          p.strokeWeight(1);
          p.circle(x, y, layout.tiny ? 8 : 13);
        }

        p.noStroke();
        if (isSelected) p.fill(198, 243, 106, 255);
        else if (isNearest) p.fill(103, 215, 179, alpha);
        else p.fill(208, 229, 218, alpha * 0.72);
        p.circle(x, y, isSelected ? (layout.tiny ? 3.5 : 5) : (layout.tiny ? 2 : 3.2));

        if ((isSelected || (isNearest && !layout.tiny)) && point.z > 0.18) {
          p.noStroke();
          p.fill(isSelected ? 224 : 140, isSelected ? 246 : 181, isSelected ? 170 : 164, 220);
          p.textSize(layout.compact ? 5.5 : 6.5);
          p.textStyle(p.BOLD);
          p.text(site.code, x + 7, y - 5);
        }
      }

      p.noFill();
      p.stroke(198, 243, 106, 70);
      p.strokeWeight(layout.tiny ? 0.7 : 1);
      const crosshair = layout.tiny ? 3 : 5;
      p.line(layout.cx - crosshair, layout.cy, layout.cx + crosshair, layout.cy);
      p.line(layout.cx, layout.cy - crosshair, layout.cx, layout.cy + crosshair);
    };
  }, host);

  const framebufferChecksum = () => {
    const canvas = host.querySelector('canvas');
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return 0;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const stride = Math.max(4, Math.floor(pixels.length / 2048 / 4) * 4);
    let checksum = 2166136261;
    for (let index = 0; index < pixels.length; index += stride) {
      checksum = Math.imul(checksum ^ pixels[index] ^ pixels[index + 1] ^ pixels[index + 3], 16777619) >>> 0;
    }
    return checksum;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`pointer-rotated-dot-matrix-globe: ${message}`);
    };
    const canvas = host.querySelector('canvas');
    const context = canvas?.getContext('2d');
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas?.getBoundingClientRect();
    const focusRect = focusButton.getBoundingClientRect();
    const resetRect = resetButton.getBoundingClientRect();
    const initialProjection = projectGeo(51.5074, -0.1278, initialYaw, initialPitch);
    const oppositeProjection = projectGeo(0, 179.8, initialYaw, initialPitch);
    const vectorLengthsValid = pointField.every((point) => {
      const vector = vectorForGeo(point.lat, point.lon);
      return Math.abs(Math.hypot(vector.x, vector.y, vector.z) - 1) < 0.000001;
    });
    const uniqueSiteIds = new Set(sites.map((site) => site.id)).size === sites.length;
    const validSites = sites.every((site) => (
      site.lat >= -90 && site.lat <= 90 && site.lon >= -180 && site.lon <= 180
      && site.peers.every((peerId) => Boolean(siteById(peerId)))
    ));
    const center = viewCenter();
    const orientationSynced = orientationValue.textContent.includes(formatCoordinate(center.lon, 'E', 'W', 3));
    const selectedSite = siteById(state.selectedSiteId);
    const copySynced = selectedSite
      ? focusPlace.textContent.includes(selectedSite.code)
      : focusPlace.textContent === 'No region selected';
    const layoutValid = lastLayout
      && lastLayout.radius > 20
      && lastLayout.cx > 0
      && lastLayout.cy > 0;

    invariant(state.claimedLibrary === 'p5@2.3.0' && sketch instanceof p5 && state.p5Instance, 'real p5 instance is missing');
    invariant(context instanceof CanvasRenderingContext2D && sketch.drawingContext === context && state.renderer === 'canvas2d', 'real p5 Canvas2D renderer is missing');
    invariant(state.projection === 'orthographic' && initialProjection.z > .55 && oppositeProjection.z < -.9, 'orthographic projection contract changed');
    invariant(pointField.length === latitudeCount * longitudeCount && state.pointCount === 648, '648-point latitude/longitude matrix changed');
    invariant(vectorLengthsValid && state.spatialChecksum === spatialChecksum && spatialChecksum !== 0, 'deterministic sphere geometry is invalid');
    invariant(sites.length === 8 && state.siteCount === 8 && uniqueSiteIds && validSites && state.siteChecksum === siteChecksum, 'edge-site geodata is invalid');
    invariant(projectedFrontCount > 280 && projectedFrontCount < 370 && state.projectedFrontCount === projectedFrontCount, 'visible hemisphere projection is invalid');
    invariant(state.visibleSiteCount >= 1 && state.visibleSiteCount <= sites.length, 'visible edge-site count is invalid');
    invariant(state.routeCount === (selectedSite?.peers.length ?? 0), 'focused network routes are stale');
    invariant(state.automaticPlayback === false && state.automaticFallback === false && state.syntheticInputDispatch === false && state.previewClockDrivesRotation === false, 'automatic or synthetic rotation is forbidden');
    invariant(state.inputAdapters.join('|') === 'pointer|touch|click|keyboard', 'input adapter contract changed');
    invariant(Math.abs(state.pitch) <= .84 && Number.isFinite(state.yaw), 'rotation escaped its bounds');
    invariant(host.dataset.selectedSite === (state.selectedSiteId ?? 'none') && host.dataset.nearestSite === (state.nearestSiteId ?? 'none'), 'spatial focus DOM state is stale');
    invariant(Number(host.dataset.yaw) === Number(state.yaw.toFixed(5)) && Number(host.dataset.pitch) === Number(state.pitch.toFixed(5)), 'orientation DOM state is stale');
    invariant(stage.dataset.focused === String(Boolean(state.selectedSiteId)) && focusButton.getAttribute('aria-pressed') === String(Boolean(state.selectedSiteId)), 'focus control state is stale');
    invariant(orientationSynced && copySynced, 'network readout is stale');
    invariant(reducedMotionQuery.matches === state.reducedMotion, 'reduced-motion preference is stale');
    invariant(lastRenderedRevision === state.revision && state.renderCount === draws && draws > 1, 'p5 render state is stale');
    invariant(canvas.width === state.canvasWidth && canvas.height === state.canvasHeight && layoutValid, 'responsive projection layout is invalid');
    invariant(canvasRect.width > 0 && canvasRect.height > 0 && focusRect.width > 0 && resetRect.width > 0, 'globe surface or controls are not visible');
    invariant(canvasRect.left >= stageRect.left - .5 && canvasRect.right <= stageRect.right + .5 && canvasRect.top >= stageRect.top - .5 && canvasRect.bottom <= stageRect.bottom + .5, 'globe canvas escaped the preview');
    invariant(host.tabIndex === 0 && getComputedStyle(host).touchAction === 'none' && typeof host.setPointerCapture === 'function', 'direct manipulation or keyboard access changed');
    invariant(state.inputCount > 0 || (state.initialStaticConfirmed && state.yaw === initialYaw && state.pitch === initialPitch && state.selectedSiteId === null), 'initial frame must remain static until real input');
    invariant(window.__PREVIEW_INTERACTION_STATE__ === state && window.__PREVIEW_META__?.capture === 'real-demo', 'preview state export is missing');
    return true;
  };

  const doubleFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.all([setupReady, Promise.resolve(document.fonts?.ready)])
    .then(async () => {
      sketch.redraw();
      await doubleFrame();
      const before = `${state.yaw}|${state.pitch}|${state.selectedSiteId}|${state.inputCount}|${state.revision}`;
      const checksum = framebufferChecksum();
      sketch.redraw();
      await doubleFrame();
      const after = `${state.yaw}|${state.pitch}|${state.selectedSiteId}|${state.inputCount}|${state.revision}`;
      const nextChecksum = framebufferChecksum();
      state.initialFrameChecksum = checksum;
      state.initialStaticConfirmed = before === after
        && checksum === nextChecksum
        && state.yaw === initialYaw
        && state.pitch === initialPitch
        && state.selectedSiteId === null
        && state.inputCount === 0;
      if (!state.initialStaticConfirmed) throw new Error('Initial globe frame changed without user input.');
      if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial globe assertion failed.');
    });

  ready.catch(markPreviewFailure);

  installPreviewController({
    id: 'pointer-rotated-dot-matrix-globe',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {
      if (state.revision !== lastRenderedRevision) sketch.redraw();
    },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
