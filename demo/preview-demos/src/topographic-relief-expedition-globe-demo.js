import * as THREE from 'three';
import { feature } from 'topojson-client';
import atlasSource from 'world-atlas/land-110m.json';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('.relief-stage');
  const host = document.querySelector('#earth-host');
  const nextButton = document.querySelector('#next-summit');
  const resetButton = document.querySelector('#reset-earth');
  const summitName = document.querySelector('#summit-name');
  const summitHeight = document.querySelector('#summit-height');
  const summitPosition = document.querySelector('#summit-position');
  const summitMarker = document.querySelector('#summit-marker');
  const summitMarkerLabel = document.querySelector('#summit-marker-label');
  const cameraRange = document.querySelector('#camera-range');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const textureWidth = 512;
  const textureHeight = 256;
  const terrainExaggeration = 45;
  const initialCameraDistance = 3.55;
  const minimumCameraDistance = 2.75;
  const maximumCameraDistance = 4.7;
  const focusDurationMs = 680;

  const summits = [
    { id: 'everest', name: 'Everest', range: 'Himalaya', label: 'EVEREST', height: 8849, lat: 27.9881, lon: 86.925 },
    { id: 'aconcagua', name: 'Aconcagua', range: 'Andes', label: 'ACONCAGUA', height: 6961, lat: -32.6532, lon: -70.0109 },
    { id: 'denali', name: 'Denali', range: 'Alaska Range', label: 'DENALI', height: 6190, lat: 63.0695, lon: -151.0074 },
    { id: 'kilimanjaro', name: 'Kilimanjaro', range: 'East Africa', label: 'KILIMANJARO', height: 5895, lat: -3.0674, lon: 37.3556 },
  ];

  const mountainChains = [
    { width: 4.8, strength: .92, points: [[67, 35], [76, 34], [86, 29], [96, 30], [104, 27]] },
    { width: 3.9, strength: .88, points: [[-79, 9], [-76, -4], [-73, -18], [-70, -34], [-72, -52]] },
    { width: 5.2, strength: .69, points: [[-151, 62], [-131, 52], [-118, 42], [-106, 31]] },
    { width: 3.2, strength: .62, points: [[-8, 31], [1, 34], [10, 36]] },
    { width: 2.7, strength: .72, points: [[5, 45], [10, 47], [16, 47]] },
    { width: 4.4, strength: .58, points: [[35, 8], [37, -3], [34, -14], [29, -29]] },
    { width: 4.2, strength: .55, points: [[142, -4], [147, -20], [150, -35]] },
  ];

  const state = {
    claimedLibrary: 'three@0.185.1',
    renderer: 'webgl',
    mechanism: 'displaced-shader-earth-from-real-atlas-land-and-authored-relief',
    inputAdapters: ['pointer', 'touch', 'wheel', 'click', 'keyboard'],
    automaticPlayback: false,
    automaticRotation: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    previewClockDrivesMotion: false,
    initialStaticConfirmed: false,
    realAtlasLand: true,
    atlasResolution: `${textureWidth}x${textureHeight}`,
    atlasPixelCount: textureWidth * textureHeight,
    landPixelCount: 0,
    reliefPixelCount: 0,
    reliefChecksum: 0,
    peakCount: summits.length,
    starCount: 620,
    geometrySegments: [160, 96],
    terrainExaggeration,
    selectedPeakIndex: 0,
    selectedPeakId: summits[0].id,
    inputCount: 0,
    pointerInputCount: 0,
    pointerMoveCount: 0,
    keyboardInputCount: 0,
    wheelInputCount: 0,
    buttonInputCount: 0,
    focusCount: 0,
    resetCount: 0,
    zoomCount: 0,
    dragging: false,
    dragDistance: 0,
    motionActive: false,
    motionCompletionCount: 0,
    renderCount: 0,
    cameraDistance: initialCameraDistance,
    lastInput: 'idle',
    reducedMotion: reducedMotionQuery.matches,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
  const radians = degrees => degrees * Math.PI / 180;
  const formatLatitude = latitude => `${Math.abs(latitude).toFixed(2)}° ${latitude >= 0 ? 'N' : 'S'}`;

  const latLonToVector3 = (latitude, longitude, radius = 1) => {
    const lat = radians(latitude);
    const lon = radians(longitude);
    return new THREE.Vector3(
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.cos(lon),
    ).multiplyScalar(radius);
  };

  const pointSegmentDistance = (longitude, latitude, start, end) => {
    const latitudeScale = Math.cos(radians(latitude));
    const ax = start[0] * latitudeScale;
    const ay = start[1];
    const bx = end[0] * latitudeScale;
    const by = end[1];
    const px = longitude * latitudeScale;
    const py = latitude;
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSquared = abx * abx + aby * aby || 1;
    const amount = clamp(((px - ax) * abx + (py - ay) * aby) / lengthSquared, 0, 1);
    return Math.hypot(px - (ax + abx * amount), py - (ay + aby * amount));
  };

  const drawGeoRing = (context, ring, horizontalOffset = 0) => {
    let previousX = null;
    for (let index = 0; index < ring.length; index += 1) {
      const [longitude, latitude] = ring[index];
      let x = (longitude + 180) / 360 * textureWidth;
      const y = (90 - latitude) / 180 * textureHeight;
      if (previousX !== null && Math.abs(x - previousX) > textureWidth / 2) {
        x += x < previousX ? textureWidth : -textureWidth;
      }
      if (index === 0) context.moveTo(x + horizontalOffset, y);
      else context.lineTo(x + horizontalOffset, y);
      previousX = x;
    }
    context.closePath();
  };

  const createReliefTexture = () => {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = textureWidth;
    maskCanvas.height = textureHeight;
    const context = maskCanvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#000';
    context.fillRect(0, 0, textureWidth, textureHeight);
    context.fillStyle = '#fff';
    context.beginPath();

    const land = feature(atlasSource, atlasSource.objects.land);
    const landGeometry = land.type === 'FeatureCollection' ? land.features[0].geometry : land.geometry;
    const polygons = landGeometry.type === 'MultiPolygon'
      ? landGeometry.coordinates
      : [landGeometry.coordinates];
    for (const polygon of polygons) {
      for (const ring of polygon) {
        drawGeoRing(context, ring, -textureWidth);
        drawGeoRing(context, ring);
        drawGeoRing(context, ring, textureWidth);
      }
    }
    context.fill('evenodd');

    const mask = context.getImageData(0, 0, textureWidth, textureHeight).data;
    const data = new Uint8Array(textureWidth * textureHeight * 4);
    let checksum = 2166136261;
    let landPixels = 0;
    let reliefPixels = 0;

    for (let y = 0; y < textureHeight; y += 1) {
      const latitude = 90 - (y + .5) / textureHeight * 180;
      for (let x = 0; x < textureWidth; x += 1) {
        const longitude = -180 + (x + .5) / textureWidth * 360;
        const index = y * textureWidth + x;
        const isLand = mask[index * 4] > 127;
        let height = 0;
        if (isLand) {
          landPixels += 1;
          const broadNoise = (
            Math.sin(radians(longitude * 2.7 + latitude * .7))
            + Math.sin(radians(longitude * .9 - latitude * 3.1)) * .55
            + Math.cos(radians(longitude * 5.3 + latitude * 4.1)) * .28
          ) / 3.66 + .5;
          let ridge = 0;
          for (const chain of mountainChains) {
            for (let pointIndex = 1; pointIndex < chain.points.length; pointIndex += 1) {
              const distance = pointSegmentDistance(
                longitude,
                latitude,
                chain.points[pointIndex - 1],
                chain.points[pointIndex],
              );
              ridge = Math.max(ridge, Math.exp(-(distance * distance) / (2 * chain.width * chain.width)) * chain.strength);
            }
          }
          height = clamp(.07 + broadNoise * .18 + ridge * .82, 0, 1);
          if (height > .36) reliefPixels += 1;
        }
        const encodedHeight = Math.round(height * 255);
        data[index * 4] = encodedHeight;
        data[index * 4 + 1] = isLand ? 255 : 0;
        data[index * 4 + 2] = Math.round(clamp(height * height * 1.25, 0, 1) * 255);
        data[index * 4 + 3] = 255;
        if (index % 17 === 0) {
          checksum = Math.imul(checksum ^ encodedHeight ^ (isLand ? 151 : 29) ^ index, 16777619) >>> 0;
        }
      }
    }

    state.landPixelCount = landPixels;
    state.reliefPixelCount = reliefPixels;
    state.reliefChecksum = checksum;
    const texture = new THREE.DataTexture(data, textureWidth, textureHeight, THREE.RGBAFormat);
    texture.colorSpace = THREE.NoColorSpace;
    texture.flipY = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  };

  const vertexShader = /* glsl */`
    uniform sampler2D uRelief;
    uniform float uDisplacement;

    varying vec2 vMapUv;
    varying float vElevation;
    varying float vLand;
    varying vec3 vWorldPosition;
    varying vec3 vSphereNormal;

    const float PI = 3.141592653589793;

    void main() {
      vMapUv = uv;
      vec4 relief = texture2D(uRelief, uv);
      vElevation = relief.r;
      vLand = relief.g;

      float longitude = (uv.x - 0.5) * PI * 2.0;
      float latitude = (uv.y - 0.5) * PI;
      vec3 sphere = vec3(
        cos(latitude) * sin(longitude),
        sin(latitude),
        cos(latitude) * cos(longitude)
      );
      vec3 displaced = sphere * (1.0 + relief.r * relief.g * uDisplacement);
      vec4 world = modelMatrix * vec4(displaced, 1.0);

      vSphereNormal = normalize(mat3(modelMatrix) * sphere);
      vWorldPosition = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `;

  const fragmentShader = /* glsl */`
    precision highp float;

    uniform vec3 uOceanDeep;
    uniform vec3 uOceanShelf;
    uniform vec3 uLowland;
    uniform vec3 uAlpine;
    uniform vec3 uSummit;
    uniform vec3 uSignal;

    varying vec2 vMapUv;
    varying float vElevation;
    varying float vLand;
    varying vec3 vWorldPosition;
    varying vec3 vSphereNormal;

    float gridLine(float value) {
      float distanceToLine = abs(fract(value - 0.5) - 0.5);
      float width = max(fwidth(value), 0.0002);
      return 1.0 - smoothstep(0.0, width * 1.25, distanceToLine);
    }

    void main() {
      vec3 normal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
      if (!gl_FrontFacing) normal *= -1.0;
      if (dot(normal, normalize(vSphereNormal)) < 0.0) normal *= -1.0;
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      vec3 lightDirection = normalize(viewDirection + vec3(-0.48, 0.62, 0.18));
      float diffuse = max(dot(normal, lightDirection), 0.0);
      float halfLambert = diffuse * 0.64 + 0.36;

      float shelf = smoothstep(-0.72, 0.82, vSphereNormal.y);
      vec3 ocean = mix(uOceanDeep, uOceanShelf, shelf * 0.38);
      vec3 land = mix(uLowland, uAlpine, smoothstep(0.18, 0.72, vElevation));
      land = mix(land, uSummit, smoothstep(0.72, 0.94, vElevation));
      land = mix(land, uSignal, smoothstep(0.84, 0.99, vElevation) * 0.45);

      float contourPhase = abs(fract(vElevation * 13.0) - 0.5);
      float contour = 1.0 - smoothstep(0.0, max(fwidth(vElevation * 13.0) * 1.05, 0.012), contourPhase);
      float longitudeGrid = gridLine(vMapUv.x * 24.0);
      float latitudeGrid = gridLine(vMapUv.y * 12.0);
      float grid = max(longitudeGrid, latitudeGrid);

      vec3 color = mix(ocean, land * halfLambert + vec3(0.035), vLand);
      color = mix(color, color * 0.52, contour * vLand * 0.46);
      color = mix(color, uOceanShelf * 1.35, grid * (0.035 + vLand * 0.025));

      float rim = pow(1.0 - max(dot(normalize(vSphereNormal), viewDirection), 0.0), 3.0);
      color += vec3(0.42, 0.66, 0.7) * rim * 0.34;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 30);
  camera.position.set(0, 0, initialCameraDistance);
  camera.lookAt(0, 0, 0);

  const reliefTexture = createReliefTexture();
  const globeGeometry = new THREE.SphereGeometry(1, state.geometrySegments[0], state.geometrySegments[1]);
  const globeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uRelief: { value: reliefTexture },
      uDisplacement: { value: .074 },
      uOceanDeep: { value: new THREE.Color('#071923') },
      uOceanShelf: { value: new THREE.Color('#1c4d57') },
      uLowland: { value: new THREE.Color('#c9cbc2') },
      uAlpine: { value: new THREE.Color('#f0e5d1') },
      uSummit: { value: new THREE.Color('#fffdf7') },
      uSignal: { value: new THREE.Color('#ec6547') },
    },
    vertexShader,
    fragmentShader,
  });
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  globe.renderOrder = 2;

  const atmosphereMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uGlow: { value: new THREE.Color('#8fd8d2') },
    },
    vertexShader: /* glsl */`
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uGlow;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float intensity = pow(1.0 - abs(dot(vNormal, viewDirection)), 2.25);
        gl_FragColor = vec4(uGlow, intensity * 0.24);
      }
    `,
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.105, 96, 64), atmosphereMaterial);
  atmosphere.renderOrder = 1;

  const earthGroup = new THREE.Group();
  earthGroup.add(atmosphere, globe);
  scene.add(earthGroup);

  const starRandom = (() => {
    let seed = 0x4f524f47;
    return () => {
      seed = Math.imul(seed ^ seed >>> 15, 2246822519);
      seed = Math.imul(seed ^ seed >>> 13, 3266489917);
      return ((seed ^= seed >>> 16) >>> 0) / 4294967296;
    };
  })();
  const starPositions = new Float32Array(state.starCount * 3);
  for (let index = 0; index < state.starCount; index += 1) {
    const z = starRandom() * 2 - 1;
    const angle = starRandom() * Math.PI * 2;
    const radius = 7 + starRandom() * 6;
    const horizontal = Math.sqrt(1 - z * z);
    starPositions[index * 3] = Math.cos(angle) * horizontal * radius;
    starPositions[index * 3 + 1] = z * radius;
    starPositions[index * 3 + 2] = Math.sin(angle) * horizontal * radius;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: 0xaed8dc,
    size: .018,
    transparent: true,
    opacity: .72,
    depthWrite: false,
  });
  scene.add(new THREE.Points(starGeometry, starMaterial));

  const frontDirection = new THREE.Vector3(0, 0, 1);
  const focusTwist = new THREE.Quaternion().setFromAxisAngle(frontDirection, radians(-9));
  const quaternionForPeak = peak => {
    const alignment = new THREE.Quaternion().setFromUnitVectors(
      latLonToVector3(peak.lat, peak.lon).normalize(),
      frontDirection,
    );
    return focusTwist.clone().multiply(alignment).normalize();
  };
  const initialQuaternion = quaternionForPeak(summits[0]);
  earthGroup.quaternion.copy(initialQuaternion);

  let focusStartQuaternion = initialQuaternion.clone();
  let focusTargetQuaternion = initialQuaternion.clone();
  let focusStartTime = 0;
  let pointerId = null;
  let pointerX = 0;
  let pointerY = 0;

  const syncPeakCopy = () => {
    const peak = summits[state.selectedPeakIndex];
    state.selectedPeakId = peak.id;
    summitName.textContent = `${peak.name} · ${peak.range}`;
    summitHeight.textContent = `${peak.height.toLocaleString('en-US')} m`;
    summitPosition.textContent = formatLatitude(peak.lat);
    summitMarkerLabel.textContent = peak.label;
    host.dataset.selectedPeak = peak.id;
  };

  const recordInput = (source) => {
    state.inputCount += 1;
    state.lastInput = source;
  };

  const startFocus = (index, source) => {
    state.selectedPeakIndex = (index + summits.length) % summits.length;
    focusStartQuaternion = earthGroup.quaternion.clone();
    focusTargetQuaternion = quaternionForPeak(summits[state.selectedPeakIndex]);
    focusStartTime = performance.now();
    state.focusCount += 1;
    state.motionActive = !state.reducedMotion;
    if (state.reducedMotion) {
      earthGroup.quaternion.copy(focusTargetQuaternion);
      state.motionCompletionCount += 1;
    }
    state.lastInput = source;
    syncPeakCopy();
  };

  const resetEarth = (source) => {
    state.selectedPeakIndex = 0;
    focusStartQuaternion = earthGroup.quaternion.clone();
    focusTargetQuaternion = initialQuaternion.clone();
    focusStartTime = performance.now();
    state.resetCount += 1;
    state.motionActive = !state.reducedMotion;
    state.cameraDistance = initialCameraDistance;
    camera.position.z = initialCameraDistance;
    cameraRange.textContent = `${initialCameraDistance.toFixed(2)} R`;
    if (state.reducedMotion) {
      earthGroup.quaternion.copy(initialQuaternion);
      state.motionCompletionCount += 1;
    }
    state.lastInput = source;
    syncPeakCopy();
  };

  const rotateEarth = (yaw, pitch, source) => {
    state.motionActive = false;
    const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    earthGroup.quaternion.premultiply(yawQuaternion).premultiply(pitchQuaternion).normalize();
    state.lastInput = source;
  };

  const updateMarker = () => {
    const peak = summits[state.selectedPeakIndex];
    const localPoint = latLonToVector3(peak.lat, peak.lon, 1.095);
    const rotatedPoint = localPoint.clone().applyQuaternion(earthGroup.quaternion);
    const worldPoint = rotatedPoint.clone().add(earthGroup.position);
    const projected = worldPoint.project(camera);
    const visible = rotatedPoint.z > .05
      && projected.x >= -1.1 && projected.x <= 1.1
      && projected.y >= -1.1 && projected.y <= 1.1;
    summitMarker.dataset.visible = String(visible);
    summitMarker.style.setProperty('--marker-x', `${(projected.x * .5 + .5) * 100}%`);
    summitMarker.style.setProperty('--marker-y', `${(-projected.y * .5 + .5) * 100}%`);
  };

  const resize = () => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    earthGroup.position.x = width <= 190 ? .28 : width <= 420 ? .52 : .46;
  };

  host.addEventListener('pointerdown', event => {
    recordInput(event.pointerType === 'touch' ? 'touch:start' : `pointer:${event.pointerType}:start`);
    state.pointerInputCount += 1;
    state.dragging = true;
    pointerId = event.pointerId;
    pointerX = event.clientX;
    pointerY = event.clientY;
    host.setPointerCapture(event.pointerId);
  });

  host.addEventListener('pointermove', event => {
    if (!state.dragging || event.pointerId !== pointerId) return;
    const deltaX = event.clientX - pointerX;
    const deltaY = event.clientY - pointerY;
    pointerX = event.clientX;
    pointerY = event.clientY;
    state.pointerMoveCount += 1;
    state.dragDistance += Math.hypot(deltaX, deltaY);
    rotateEarth(deltaX * .0095, deltaY * .0085, 'pointer:drag');
  });

  const endPointer = event => {
    if (!state.dragging || event.pointerId !== pointerId) return;
    state.dragging = false;
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
    pointerId = null;
  };
  host.addEventListener('pointerup', endPointer);
  host.addEventListener('pointercancel', endPointer);

  host.addEventListener('wheel', event => {
    const nextDistance = clamp(state.cameraDistance + event.deltaY * .0035, minimumCameraDistance, maximumCameraDistance);
    if (nextDistance === state.cameraDistance) return;
    event.preventDefault();
    recordInput('wheel:zoom');
    state.wheelInputCount += 1;
    state.zoomCount += 1;
    state.cameraDistance = nextDistance;
    camera.position.z = nextDistance;
    cameraRange.textContent = `${nextDistance.toFixed(2)} R`;
  }, { passive: false });

  host.addEventListener('keydown', event => {
    const rotations = {
      ArrowLeft: [-.14, 0],
      ArrowRight: [.14, 0],
      ArrowUp: [0, -.12],
      ArrowDown: [0, .12],
    };
    if (rotations[event.key]) {
      event.preventDefault();
      recordInput(`keyboard:${event.key}`);
      state.keyboardInputCount += 1;
      rotateEarth(rotations[event.key][0], rotations[event.key][1], `keyboard:${event.key}`);
      return;
    }
    if (event.key.toLowerCase() === 'n' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      recordInput(`keyboard:${event.key === ' ' ? 'Space' : event.key}`);
      state.keyboardInputCount += 1;
      startFocus(state.selectedPeakIndex + 1, `keyboard:${event.key === ' ' ? 'Space' : event.key}`);
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      recordInput('keyboard:zoom-in');
      state.keyboardInputCount += 1;
      state.zoomCount += 1;
      state.cameraDistance = clamp(state.cameraDistance - .24, minimumCameraDistance, maximumCameraDistance);
      camera.position.z = state.cameraDistance;
      cameraRange.textContent = `${state.cameraDistance.toFixed(2)} R`;
      return;
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      recordInput('keyboard:zoom-out');
      state.keyboardInputCount += 1;
      state.zoomCount += 1;
      state.cameraDistance = clamp(state.cameraDistance + .24, minimumCameraDistance, maximumCameraDistance);
      camera.position.z = state.cameraDistance;
      cameraRange.textContent = `${state.cameraDistance.toFixed(2)} R`;
      return;
    }
    if (event.key === 'Home' || event.key === 'Escape') {
      event.preventDefault();
      recordInput(`keyboard:${event.key}`);
      state.keyboardInputCount += 1;
      resetEarth(`keyboard:${event.key}`);
    }
  });

  nextButton.addEventListener('click', () => {
    recordInput('click:next-summit');
    state.buttonInputCount += 1;
    startFocus(state.selectedPeakIndex + 1, 'click:next-summit');
  });
  resetButton.addEventListener('click', () => {
    recordInput('click:reset');
    state.buttonInputCount += 1;
    resetEarth('click:reset');
  });

  const handleReducedMotionChange = event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.motionActive) {
      earthGroup.quaternion.copy(focusTargetQuaternion);
      state.motionActive = false;
      state.motionCompletionCount += 1;
    }
  };
  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  } else {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }

  resize();
  syncPeakCopy();

  const render = () => {
    if (state.motionActive) {
      const elapsed = performance.now() - focusStartTime;
      const progress = clamp(elapsed / focusDurationMs, 0, 1);
      const eased = 1 - (1 - progress) ** 3;
      earthGroup.quaternion.slerpQuaternions(focusStartQuaternion, focusTargetQuaternion, eased);
      if (progress >= 1) {
        earthGroup.quaternion.copy(focusTargetQuaternion);
        state.motionActive = false;
        state.motionCompletionCount += 1;
      }
    }
    renderer.render(scene, camera);
    updateMarker();
    state.renderCount += 1;
    state.cameraDistance = camera.position.z;
    if (state.inputCount === 0 && earthGroup.quaternion.angleTo(initialQuaternion) < .000001) {
      state.initialStaticConfirmed = true;
    }
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`topographic-relief-expedition-globe: ${message}`);
    };
    const canvas = renderer.domElement;
    const canvasRect = canvas.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const nextRect = nextButton.getBoundingClientRect();
    const resetRect = resetButton.getBoundingClientRect();
    const webgl = renderer.getContext();
    const relief = globeMaterial.uniforms.uRelief.value;
    const currentPeak = summits[state.selectedPeakIndex];

    invariant(canvas instanceof HTMLCanvasElement, 'Three.js did not attach a canvas');
    invariant(Boolean(webgl) && typeof webgl.drawElements === 'function', 'live WebGL context is unavailable');
    invariant(renderer.info.render.calls > 0, 'Three.js has not issued a draw call');
    invariant(canvasRect.width >= 64 && canvasRect.height >= 64, 'canvas is too small');
    invariant(Math.abs(canvasRect.width - stageRect.width) < 2 && Math.abs(canvasRect.height - stageRect.height) < 2, 'canvas does not cover the stage');
    invariant(globeGeometry.attributes.position.count > 10000, 'globe geometry is not sufficiently tessellated for relief');
    invariant(relief instanceof THREE.DataTexture && relief.image.width === textureWidth && relief.image.height === textureHeight, 'relief texture is not the generated atlas texture');
    invariant(state.landPixelCount > 32000 && state.landPixelCount < 48000, 'real atlas land coverage is implausible');
    invariant(state.reliefPixelCount > 5000, 'authored relief field is empty');
    invariant(state.reliefChecksum !== 0, 'relief checksum is missing');
    invariant(state.peakCount === 4 && state.starCount === 620, 'scene evidence counts changed');
    invariant(state.terrainExaggeration === 45 && globeMaterial.uniforms.uDisplacement.value > .05, 'terrain displacement is not active');
    invariant(earthGroup.children.includes(globe) && earthGroup.children.includes(atmosphere), 'Earth layers are incomplete');
    invariant(scene.children.some(child => child instanceof THREE.Points), 'star field is missing');
    invariant(state.initialStaticConfirmed, 'initial view was not static');
    invariant(!state.automaticPlayback && !state.automaticRotation && !state.previewClockDrivesMotion, 'scene motion must remain human-owned');
    invariant(nextRect.width > 24 && resetRect.width > 20, 'controls are not usable');
    invariant(summitName.textContent.includes(currentPeak.name), 'summit copy is out of sync');
    invariant(summitHeight.textContent.includes(currentPeak.height.toLocaleString('en-US')), 'summit height is out of sync');
    invariant(Number.isFinite(earthGroup.quaternion.length()) && Math.abs(earthGroup.quaternion.length() - 1) < .0001, 'Earth quaternion is invalid');
    return true;
  };

  installPreviewController({
    id: 'topographic-relief-expedition-globe',
    library: 'three@0.185.1 + topojson-client@3.1.0 + world-atlas@2.0.2',
    renderer: 'webgl',
    ready: Promise.resolve(),
    render,
  });

  addEventListener('resize', resize);
  addEventListener('beforeunload', () => {
    removeEventListener('resize', resize);
    if (typeof reducedMotionQuery.removeEventListener === 'function') {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    } else {
      reducedMotionQuery.removeListener(handleReducedMotionChange);
    }
    globeGeometry.dispose();
    globeMaterial.dispose();
    atmosphere.geometry.dispose();
    atmosphereMaterial.dispose();
    starGeometry.dispose();
    starMaterial.dispose();
    reliefTexture.dispose();
    renderer.dispose();
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
