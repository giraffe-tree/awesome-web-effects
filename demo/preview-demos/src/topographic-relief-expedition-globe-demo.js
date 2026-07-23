import * as THREE from 'three';
import { feature } from 'topojson-client';
import atlasSource from 'world-atlas/land-50m.json';
import peakCatalogSource from '../assets/topographic-relief-expedition-globe/peaks-global-ui.json';
import elevationTextureUrl from '../assets/topographic-relief-expedition-globe/etopo-2022-relief-rg.webp?url';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ELEVATION_WIDTH = 4320;
const ELEVATION_HEIGHT = 2160;
const ELEVATION_EXPECTED_BYTES = 3429836;
const TOPOLOGY_WIDTH = 1024;
const TOPOLOGY_HEIGHT = 512;
const TERRAIN_EXAGGERATION = 45;
const EARTH_RADIUS_METERS = 6371000;
const GLOBE_SEGMENTS = [320, 192];
const STAR_COUNT = 1800;
const INITIAL_CAMERA_DISTANCE = 3.55;
const MINIMUM_CAMERA_DISTANCE = 2.72;
const MAXIMUM_CAMERA_DISTANCE = 4.65;
const FOCUS_DURATION_MS = 720;

const focusPeakIds = [
  'asia-everest',
  'asia-k2',
  'south-america-aconcagua',
  'north-america-denali',
  'africa-kilimanjaro',
  'europe-elbrus',
  'antarctica-mount-vinson',
  'oceania-puncak-jaya',
];

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const radians = degrees => degrees * Math.PI / 180;
const formatCoordinate = (value, positive, negative) => (
  `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`
);
const formatElevation = value => `${Math.round(value).toLocaleString('en-US')} m`;

const latLonToVector3 = (latitude, longitude, radius = 1) => {
  const lat = radians(latitude);
  const lon = radians(longitude);
  return new THREE.Vector3(
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.cos(lon),
  ).multiplyScalar(radius);
};

const loadImageWithProgress = async (url, onProgress) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ETOPO relief request failed (${response.status})`);
  const declaredBytes = Number(response.headers.get('content-length')) || ELEVATION_EXPECTED_BYTES;
  const chunks = [];
  let loadedBytes = 0;

  if (response.body?.getReader) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loadedBytes += value.byteLength;
      onProgress(clamp(loadedBytes / declaredBytes, 0, 1), loadedBytes);
    }
  } else {
    const buffer = await response.arrayBuffer();
    chunks.push(new Uint8Array(buffer));
    loadedBytes = buffer.byteLength;
    onProgress(1, loadedBytes);
  }

  const objectUrl = URL.createObjectURL(new Blob(chunks, { type: 'image/webp' }));
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();
    return { image, loadedBytes };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const main = async () => {
  const stage = document.querySelector('.relief-stage');
  const host = document.querySelector('#earth-host');
  const nextButton = document.querySelector('#next-summit');
  const resetButton = document.querySelector('#reset-earth');
  const summitName = document.querySelector('#summit-name');
  const summitHeight = document.querySelector('#summit-height');
  const summitPosition = document.querySelector('#summit-position');
  const summitContinent = document.querySelector('#summit-continent');
  const summitIndex = document.querySelector('#summit-index');
  const summitMarker = document.querySelector('#summit-marker');
  const summitMarkerLabel = document.querySelector('#summit-marker-label');
  const cameraRange = document.querySelector('#camera-range');
  const visiblePeakCount = document.querySelector('#visible-peak-count');
  const loadingPercent = document.querySelector('#loading-percent');
  const loadingStage = document.querySelector('#loading-stage');
  const loadingDetail = document.querySelector('#loading-detail');
  const loadingTrack = document.querySelector('#loading-track');
  const loadingBar = document.querySelector('#loading-bar');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const peakCatalog = peakCatalogSource.peaks;
  const peakById = new Map(peakCatalog.map(peak => [peak.id, peak]));
  const focusPeaks = focusPeakIds.map(id => peakById.get(id)).filter(Boolean);
  if (peakCatalog.length !== 700 || focusPeaks.length !== focusPeakIds.length) {
    throw new Error('The complete 700-peak expedition catalog is unavailable');
  }

  const continentCounts = Object.fromEntries(
    [...new Set(peakCatalog.map(peak => peak.continent))]
      .map(continent => [continent, peakCatalog.filter(peak => peak.continent === continent).length]),
  );
  let peakChecksum = 2166136261;
  peakCatalog.forEach((peak, index) => {
    peakChecksum = Math.imul(
      peakChecksum
        ^ Math.round((peak.lat + 90) * 1000)
        ^ Math.round((peak.lon + 180) * 1000)
        ^ Math.round(peak.elevationM)
        ^ index,
      16777619,
    ) >>> 0;
  });

  const state = {
    claimedLibrary: 'three@0.185.1',
    renderer: 'webgl',
    mechanism: 'etopo-2022-displaced-earth-with-50m-coastline-and-700-real-peaks',
    inputAdapters: ['pointer', 'touch', 'wheel', 'click', 'keyboard'],
    automaticPlayback: false,
    automaticRotation: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    previewClockDrivesMotion: false,
    initialStaticConfirmed: false,
    realAtlasLand: true,
    atlasDataset: 'Natural Earth 50m via world-atlas',
    topologyResolution: [TOPOLOGY_WIDTH, TOPOLOGY_HEIGHT],
    topologyPixelCount: TOPOLOGY_WIDTH * TOPOLOGY_HEIGHT,
    landPixelCount: 0,
    topologyChecksum: 0,
    reliefDataset: 'NOAA/NCEI ETOPO 2022 60 arc-second surface elevation',
    reliefResolution: [ELEVATION_WIDTH, ELEVATION_HEIGHT],
    reliefAssetBytes: 0,
    reliefLoaded: false,
    peakCount: peakCatalog.length,
    focusPeakCount: focusPeaks.length,
    continentCounts,
    peakChecksum,
    starCount: STAR_COUNT,
    geometrySegments: GLOBE_SEGMENTS,
    terrainExaggeration: TERRAIN_EXAGGERATION,
    loaderProgress: 0,
    loaderStage: 'BOOTING RELIEF ENGINE',
    loaderStageCount: 0,
    loaderDismissed: false,
    gpuMaxTextureSize: 0,
    selectedPeakIndex: 0,
    selectedPeakId: focusPeaks[0].id,
    visiblePeakCount: 0,
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
    cameraDistance: INITIAL_CAMERA_DISTANCE,
    lastInput: 'idle',
    reducedMotion: reducedMotionQuery.matches,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let previousLoadingStage = '';
  const setLoading = (progress, label, detail) => {
    const nextProgress = Math.max(state.loaderProgress, Math.round(progress));
    state.loaderProgress = nextProgress;
    state.loaderStage = label;
    if (previousLoadingStage !== label) {
      state.loaderStageCount += 1;
      previousLoadingStage = label;
    }
    loadingPercent.textContent = `${String(nextProgress).padStart(3, '0')}%`;
    loadingStage.textContent = label;
    loadingDetail.textContent = detail;
    loadingBar.style.width = `${nextProgress}%`;
    loadingTrack.setAttribute('aria-valuenow', String(nextProgress));
    loadingTrack.setAttribute('aria-valuetext', `${label}, ${nextProgress}%`);
  };

  setLoading(4, 'BOOTING RELIEF ENGINE', 'Preparing deterministic WebGL scene');
  await new Promise(resolve => requestAnimationFrame(resolve));

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x02070b, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const context = renderer.getContext();
  state.gpuMaxTextureSize = renderer.capabilities.maxTextureSize;
  if (state.gpuMaxTextureSize < ELEVATION_WIDTH) {
    throw new Error(`This GPU supports ${state.gpuMaxTextureSize}px textures; ${ELEVATION_WIDTH}px is required`);
  }
  setLoading(12, 'LINKING GRAPHICS CORE', `WebGL · ${state.gpuMaxTextureSize.toLocaleString()} px texture ceiling`);

  const drawGeoRing = (canvasContext, ring, horizontalOffset = 0) => {
    let previousX = null;
    ring.forEach(([longitude, latitude], index) => {
      let x = (longitude + 180) / 360 * TOPOLOGY_WIDTH;
      const y = (90 - latitude) / 180 * TOPOLOGY_HEIGHT;
      if (previousX !== null && Math.abs(x - previousX) > TOPOLOGY_WIDTH / 2) {
        x += x < previousX ? TOPOLOGY_WIDTH : -TOPOLOGY_WIDTH;
      }
      if (index === 0) canvasContext.moveTo(x + horizontalOffset, y);
      else canvasContext.lineTo(x + horizontalOffset, y);
      previousX = x;
    });
    canvasContext.closePath();
  };

  setLoading(18, 'RASTERIZING 50M COASTLINE', 'Natural Earth land topology · 1,024 × 512');
  const topologyCanvas = document.createElement('canvas');
  topologyCanvas.width = TOPOLOGY_WIDTH;
  topologyCanvas.height = TOPOLOGY_HEIGHT;
  const topologyContext = topologyCanvas.getContext('2d', { willReadFrequently: true });
  topologyContext.fillStyle = '#000';
  topologyContext.fillRect(0, 0, TOPOLOGY_WIDTH, TOPOLOGY_HEIGHT);
  topologyContext.fillStyle = '#fff';
  topologyContext.beginPath();
  const land = feature(atlasSource, atlasSource.objects.land);
  const landGeometry = land.type === 'FeatureCollection' ? land.features[0].geometry : land.geometry;
  const polygons = landGeometry.type === 'MultiPolygon'
    ? landGeometry.coordinates
    : [landGeometry.coordinates];
  polygons.forEach(polygon => {
    polygon.forEach(ring => {
      drawGeoRing(topologyContext, ring, -TOPOLOGY_WIDTH);
      drawGeoRing(topologyContext, ring);
      drawGeoRing(topologyContext, ring, TOPOLOGY_WIDTH);
    });
  });
  topologyContext.fill('evenodd');
  const topologyPixels = topologyContext.getImageData(0, 0, TOPOLOGY_WIDTH, TOPOLOGY_HEIGHT).data;
  const topologyData = new Uint8Array(TOPOLOGY_WIDTH * TOPOLOGY_HEIGHT * 4);
  let topologyChecksum = 2166136261;
  for (let index = 0; index < TOPOLOGY_WIDTH * TOPOLOGY_HEIGHT; index += 1) {
    const landValue = topologyPixels[index * 4];
    if (landValue > 127) state.landPixelCount += 1;
    topologyData[index * 4] = landValue;
    topologyData[index * 4 + 1] = landValue;
    topologyData[index * 4 + 2] = landValue;
    topologyData[index * 4 + 3] = 255;
    if (index % 29 === 0) {
      topologyChecksum = Math.imul(topologyChecksum ^ landValue ^ index, 16777619) >>> 0;
    }
  }
  state.topologyChecksum = topologyChecksum;
  const topologyTexture = new THREE.DataTexture(
    topologyData,
    TOPOLOGY_WIDTH,
    TOPOLOGY_HEIGHT,
    THREE.RGBAFormat,
  );
  topologyTexture.colorSpace = THREE.NoColorSpace;
  topologyTexture.flipY = true;
  topologyTexture.wrapS = THREE.RepeatWrapping;
  topologyTexture.wrapT = THREE.ClampToEdgeWrapping;
  topologyTexture.minFilter = THREE.LinearMipmapLinearFilter;
  topologyTexture.magFilter = THREE.LinearFilter;
  topologyTexture.generateMipmaps = true;
  topologyTexture.needsUpdate = true;

  setLoading(24, 'STREAMING ETOPO RELIEF', 'NOAA/NCEI elevation + bathymetry · 3.43 MB');
  const { image: elevationImage, loadedBytes } = await loadImageWithProgress(
    elevationTextureUrl,
    (progress, bytes) => {
      setLoading(
        24 + progress * 50,
        'STREAMING ETOPO RELIEF',
        `${(bytes / 1048576).toFixed(2)} MB / ${(ELEVATION_EXPECTED_BYTES / 1048576).toFixed(2)} MB`,
      );
    },
  );
  if (elevationImage.naturalWidth !== ELEVATION_WIDTH || elevationImage.naturalHeight !== ELEVATION_HEIGHT) {
    throw new Error(
      `Invalid ETOPO texture: expected ${ELEVATION_WIDTH}×${ELEVATION_HEIGHT}, `
      + `received ${elevationImage.naturalWidth}×${elevationImage.naturalHeight}`,
    );
  }
  state.reliefAssetBytes = loadedBytes;
  state.reliefLoaded = true;
  const elevationTexture = new THREE.Texture(elevationImage);
  elevationTexture.colorSpace = THREE.NoColorSpace;
  elevationTexture.flipY = true;
  elevationTexture.wrapS = THREE.RepeatWrapping;
  elevationTexture.wrapT = THREE.ClampToEdgeWrapping;
  elevationTexture.minFilter = THREE.LinearMipmapLinearFilter;
  elevationTexture.magFilter = THREE.LinearFilter;
  elevationTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  elevationTexture.generateMipmaps = true;
  elevationTexture.needsUpdate = true;

  setLoading(78, 'DECODING ELEVATION MODEL', 'R × 9,000 m − G × 11,000 m');

  const vertexShader = /* glsl */`
    uniform sampler2D uTopology;
    uniform sampler2D uElevationMap;
    uniform float uTerrain;

    varying vec2 vMapUv;
    varying float vElevationMeters;
    varying float vLand;
    varying vec3 vWorldPosition;

    const float PI = 3.141592653589793;

    float decodeHeight(vec4 encoded) {
      return encoded.r * 9000.0 - encoded.g * 11000.0;
    }

    void main() {
      vMapUv = uv;
      float longitude = (uv.x - 0.5) * PI * 2.0;
      float latitude = (uv.y - 0.5) * PI;
      vec3 sphere = vec3(
        cos(latitude) * sin(longitude),
        sin(latitude),
        cos(latitude) * cos(longitude)
      );
      vec4 topology = texture2D(uTopology, uv);
      vLand = smoothstep(0.28, 0.72, topology.r);
      vElevationMeters = decodeHeight(texture2D(uElevationMap, uv));
      float reliefRadius = vElevationMeters * uTerrain / ${EARTH_RADIUS_METERS.toFixed(1)};
      vec3 displaced = sphere * (1.0 + reliefRadius);
      vec4 world = modelMatrix * vec4(displaced, 1.0);
      vWorldPosition = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `;

  const fragmentShader = /* glsl */`
    precision highp float;

    uniform sampler2D uTopology;
    uniform sampler2D uElevationMap;
    uniform vec2 uElevationTexel;
    uniform float uTerrain;
    uniform vec3 uSignal;

    varying vec2 vMapUv;
    varying float vElevationMeters;
    varying float vLand;
    varying vec3 vWorldPosition;

    float decodeHeight(vec4 encoded) {
      return encoded.r * 9000.0 - encoded.g * 11000.0;
    }

    float reliefRadius(float meters) {
      return meters * uTerrain / ${EARTH_RADIUS_METERS.toFixed(1)};
    }

    float gridLine(float value) {
      float distanceToLine = abs(fract(value - 0.5) - 0.5);
      float width = max(fwidth(value), 0.0001);
      return 1.0 - smoothstep(0.0, width * 1.05, distanceToLine);
    }

    float contourLine(float meters, float interval) {
      float levels = meters / interval;
      float distanceToLine = abs(fract(levels - 0.5) - 0.5);
      float width = max(fwidth(levels), 0.0001);
      return 1.0 - smoothstep(0.0, width * 1.12, distanceToLine);
    }

    float paperNoise(vec2 point) {
      vec3 p3 = fract(vec3(point.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec4 topology = texture2D(uTopology, vMapUv);
      vec3 radial = normalize(vWorldPosition - vec3(0.34, 0.0, 0.0));
      vec3 east = normalize(vec3(radial.z, 0.0, -radial.x));
      vec3 north = normalize(cross(radial, east));
      float westHeight = reliefRadius(decodeHeight(texture2D(
        uElevationMap, vMapUv - vec2(uElevationTexel.x, 0.0)
      )));
      float eastHeight = reliefRadius(decodeHeight(texture2D(
        uElevationMap, vMapUv + vec2(uElevationTexel.x, 0.0)
      )));
      float southHeight = reliefRadius(decodeHeight(texture2D(
        uElevationMap, vMapUv - vec2(0.0, uElevationTexel.y)
      )));
      float northHeight = reliefRadius(decodeHeight(texture2D(
        uElevationMap, vMapUv + vec2(0.0, uElevationTexel.y)
      )));
      float cosLatitude = max(length(radial.xz), 0.08);
      float eastSlope = (eastHeight - westHeight) / (12.5663706 * uElevationTexel.x * cosLatitude);
      float northSlope = (northHeight - southHeight) / (6.2831853 * uElevationTexel.y);
      vec3 normal = normalize(radial - east * eastSlope * 0.68 - north * northSlope * 0.68);
      vec3 lightDirection = normalize(vec3(-0.40, 1.10, 1.55));
      float diffuse = max(dot(normal, lightDirection), 0.0);
      float slope = 1.0 - clamp(dot(normal, radial), 0.0, 1.0);
      float depthMeters = max(-vElevationMeters, 0.0);
      float elevationMeters = max(vElevationMeters, 0.0);

      vec3 ocean = vec3(0.34, 0.63, 0.67);
      ocean = mix(ocean, vec3(0.08, 0.30, 0.36), smoothstep(180.0, 1400.0, depthMeters));
      ocean = mix(ocean, vec3(0.025, 0.12, 0.18), smoothstep(1600.0, 5000.0, depthMeters));
      ocean = mix(ocean, vec3(0.008, 0.035, 0.065), smoothstep(5200.0, 8800.0, depthMeters));

      vec3 terrain = vec3(0.36, 0.45, 0.36);
      terrain = mix(terrain, vec3(0.57, 0.52, 0.37), smoothstep(260.0, 1100.0, elevationMeters));
      terrain = mix(terrain, vec3(0.74, 0.62, 0.40), smoothstep(1200.0, 3000.0, elevationMeters));
      terrain = mix(terrain, vec3(0.83, 0.76, 0.61), smoothstep(3100.0, 5200.0, elevationMeters));
      terrain = mix(terrain, vec3(0.98, 0.95, 0.87), smoothstep(5300.0, 7700.0, elevationMeters));
      terrain = mix(terrain, vec3(0.22, 0.21, 0.18), clamp(slope * 1.25, 0.0, 0.44));

      vec3 color = mix(ocean, terrain, vLand);
      color *= 0.70 + diffuse * 0.42;
      float coast = 1.0 - smoothstep(
        0.0,
        max(fwidth(topology.r) * 1.65, 0.002),
        abs(topology.r - 0.5)
      );
      float grid = max(gridLine(vMapUv.x * 24.0), gridLine(vMapUv.y * 12.0)) * 0.065;
      float contour = max(
        contourLine(vElevationMeters, 500.0) * 0.15,
        contourLine(vElevationMeters, 250.0) * 0.045
      ) * vLand;
      float depthContour = max(
        contourLine(depthMeters, 2000.0) * 0.095,
        contourLine(depthMeters, 1000.0) * 0.03
      ) * (1.0 - vLand);
      color = mix(color, vec3(0.018, 0.040, 0.047), coast * 0.40 + grid + contour);
      color = mix(color, vec3(0.30, 0.69, 0.69), depthContour);
      color += (paperNoise(vMapUv * vec2(4096.0, 2048.0)) - 0.5) * 0.017;
      float facing = abs(dot(normalize(cameraPosition - vWorldPosition), radial));
      color = mix(color, vec3(0.34, 0.82, 0.80), pow(1.0 - facing, 3.1) * 0.17);
      color = mix(color, uSignal, smoothstep(6900.0, 8500.0, elevationMeters) * 0.12);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  setLoading(84, 'BUILDING 3D TERRAIN', '61,953 vertices · terrain exaggeration ×45');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, INITIAL_CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);

  const earthGroup = new THREE.Group();
  earthGroup.position.x = 0.34;
  scene.add(earthGroup);

  const globeGeometry = new THREE.SphereGeometry(1, ...GLOBE_SEGMENTS);
  const globeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTopology: { value: topologyTexture },
      uElevationMap: { value: elevationTexture },
      uElevationTexel: { value: new THREE.Vector2(1 / ELEVATION_WIDTH, 1 / ELEVATION_HEIGHT) },
      uTerrain: { value: TERRAIN_EXAGGERATION },
      uSignal: { value: new THREE.Color('#ef6b4d') },
    },
    vertexShader,
    fragmentShader,
  });
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  earthGroup.add(globe);

  const peakPositions = new Float32Array(peakCatalog.length * 3);
  const peakSizes = new Float32Array(peakCatalog.length);
  const peakImportance = new Float32Array(peakCatalog.length);
  peakCatalog.forEach((peak, index) => {
    const radius = 1.009 + Math.max(peak.elevationM, 0) * TERRAIN_EXAGGERATION / EARTH_RADIUS_METERS;
    const point = latLonToVector3(peak.lat, peak.lon, radius);
    point.toArray(peakPositions, index * 3);
    peakSizes[index] = peak.highestRank === 1 || peak.famousRank === 1
      ? 0.060
      : peak.elevationM >= 7000
        ? 0.047
        : 0.034;
    peakImportance[index] = peak.highestRank === 1 || peak.famousRank === 1 ? 1 : 0;
  });
  const peakGeometry = new THREE.BufferGeometry();
  peakGeometry.setAttribute('position', new THREE.BufferAttribute(peakPositions, 3));
  peakGeometry.setAttribute('aSize', new THREE.BufferAttribute(peakSizes, 1));
  peakGeometry.setAttribute('aImportance', new THREE.BufferAttribute(peakImportance, 1));
  const peakMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uAccent: { value: new THREE.Color('#ff7657') },
      uMinor: { value: new THREE.Color('#f3d7a7') },
    },
    vertexShader: /* glsl */`
      attribute float aSize;
      attribute float aImportance;
      varying float vImportance;
      void main() {
        vImportance = aImportance;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp(aSize * (230.0 / max(-viewPosition.z, 0.1)), 1.15, 5.2);
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3 uAccent;
      uniform vec3 uMinor;
      varying float vImportance;
      void main() {
        float distanceToCenter = length(gl_PointCoord - 0.5);
        float disc = 1.0 - smoothstep(0.30, 0.49, distanceToCenter);
        float ring = smoothstep(0.34, 0.40, distanceToCenter)
          * (1.0 - smoothstep(0.43, 0.50, distanceToCenter));
        float alpha = disc * (0.52 + vImportance * 0.40) + ring * vImportance * 0.65;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(mix(uMinor, uAccent, 0.42 + vImportance * 0.58), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  });
  const peakPoints = new THREE.Points(peakGeometry, peakMaterial);
  earthGroup.add(peakPoints);

  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uGlow: { value: new THREE.Color('#77d4cf') },
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
        float rim = pow(1.0 - abs(dot(vNormal, viewDirection)), 2.8);
        gl_FragColor = vec4(uGlow, rim * 0.30);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.085, 96, 64), atmosphereMaterial);
  earthGroup.add(atmosphere);

  const createRandom = seed => {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  };
  const random = createRandom(0x45544f50);
  const starPositions = new Float32Array(STAR_COUNT * 3);
  const starColors = new Float32Array(STAR_COUNT * 3);
  for (let index = 0; index < STAR_COUNT; index += 1) {
    const longitude = random() * Math.PI * 2;
    const latitude = Math.asin(random() * 2 - 1);
    const radius = 13 + random() * 15;
    starPositions[index * 3] = Math.cos(latitude) * Math.sin(longitude) * radius;
    starPositions[index * 3 + 1] = Math.sin(latitude) * radius;
    starPositions[index * 3 + 2] = Math.cos(latitude) * Math.cos(longitude) * radius;
    const brightness = 0.34 + random() * 0.62;
    starColors[index * 3] = brightness * (0.82 + random() * 0.18);
    starColors[index * 3 + 1] = brightness * (0.88 + random() * 0.12);
    starColors[index * 3 + 2] = brightness;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMaterial = new THREE.PointsMaterial({
    size: 0.022,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.72,
    vertexColors: true,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  setLoading(91, 'INDEXING GLOBAL SUMMITS', '700 peaks · 100 per continent · eight expedition anchors');

  const focusTarget = new THREE.Vector3(0.24, 0.08, 0.968).normalize();
  const quaternionForPeak = peak => new THREE.Quaternion().setFromUnitVectors(
    latLonToVector3(peak.lat, peak.lon).normalize(),
    focusTarget,
  );
  const initialQuaternion = quaternionForPeak(focusPeaks[0]);
  earthGroup.quaternion.copy(initialQuaternion);
  const focusStartQuaternion = new THREE.Quaternion();
  const focusTargetQuaternion = new THREE.Quaternion();
  let focusStartTime = 0;

  const updateSummitCopy = () => {
    const peak = focusPeaks[state.selectedPeakIndex];
    summitName.textContent = peak.en.replace('Mount ', '');
    summitHeight.textContent = formatElevation(peak.elevationM);
    summitPosition.textContent = `${formatCoordinate(peak.lat, 'N', 'S')} · ${formatCoordinate(peak.lon, 'E', 'W')}`;
    summitContinent.textContent = peak.continent.toUpperCase();
    summitIndex.textContent = `${String(state.selectedPeakIndex + 1).padStart(2, '0')} / ${String(focusPeaks.length).padStart(2, '0')}`;
    summitMarkerLabel.textContent = peak.en
      .replace(/^Mount /, '')
      .replace(/\s*\(.+\)$/, '')
      .toUpperCase();
    state.selectedPeakId = peak.id;
  };

  const updateCameraReadout = () => {
    const altitude = Math.round((camera.position.z - 1) * 6371);
    cameraRange.textContent = `${altitude.toLocaleString('en-US')} km`;
  };

  const countVisiblePeaks = () => {
    let count = 0;
    const normal = new THREE.Vector3();
    for (let index = 0; index < peakCatalog.length; index += 1) {
      normal.fromArray(peakPositions, index * 3).normalize().applyQuaternion(earthGroup.quaternion);
      if (normal.z > 0.09) count += 1;
    }
    state.visiblePeakCount = count;
    visiblePeakCount.textContent = String(count).padStart(3, '0');
  };

  const updateMarker = () => {
    const peak = focusPeaks[state.selectedPeakIndex];
    const radius = 1.024 + Math.max(peak.elevationM, 0) * TERRAIN_EXAGGERATION / EARTH_RADIUS_METERS;
    const surfaceNormal = latLonToVector3(peak.lat, peak.lon).normalize().applyQuaternion(earthGroup.quaternion);
    const worldPosition = latLonToVector3(peak.lat, peak.lon, radius)
      .applyQuaternion(earthGroup.quaternion)
      .add(earthGroup.position);
    const projected = worldPosition.clone().project(camera);
    const visible = surfaceNormal.z > 0.08 && projected.z > -1 && projected.z < 1;
    summitMarker.dataset.visible = String(visible);
    summitMarker.style.setProperty('--marker-x', `${(projected.x * 0.5 + 0.5) * 100}%`);
    summitMarker.style.setProperty('--marker-y', `${(-projected.y * 0.5 + 0.5) * 100}%`);
  };

  let visibleCountFrame = 0;
  const render = () => {
    if (state.motionActive) {
      const progress = clamp((performance.now() - focusStartTime) / FOCUS_DURATION_MS, 0, 1);
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
    if (visibleCountFrame % 8 === 0) countVisiblePeaks();
    visibleCountFrame += 1;
    state.renderCount += 1;
    state.cameraDistance = camera.position.z;
    if (state.inputCount === 0 && earthGroup.quaternion.angleTo(initialQuaternion) < 0.000001) {
      state.initialStaticConfirmed = true;
    }
  };

  const resize = () => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };

  const startOrientation = quaternion => {
    if (state.reducedMotion) {
      earthGroup.quaternion.copy(quaternion);
      state.motionActive = false;
      state.motionCompletionCount += 1;
      render();
      return;
    }
    focusStartQuaternion.copy(earthGroup.quaternion);
    focusTargetQuaternion.copy(quaternion);
    focusStartTime = performance.now();
    state.motionActive = true;
  };

  const focusPeak = index => {
    state.selectedPeakIndex = (index + focusPeaks.length) % focusPeaks.length;
    state.focusCount += 1;
    updateSummitCopy();
    startOrientation(quaternionForPeak(focusPeaks[state.selectedPeakIndex]));
  };

  const setCameraDistance = distance => {
    camera.position.z = clamp(distance, MINIMUM_CAMERA_DISTANCE, MAXIMUM_CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);
    state.zoomCount += 1;
    updateCameraReadout();
    render();
  };

  const resetEarth = inputLabel => {
    state.selectedPeakIndex = 0;
    state.resetCount += 1;
    state.lastInput = inputLabel;
    camera.position.z = INITIAL_CAMERA_DISTANCE;
    camera.lookAt(0, 0, 0);
    updateSummitCopy();
    updateCameraReadout();
    startOrientation(initialQuaternion);
  };

  let pointerId = null;
  let previousPointerX = 0;
  let previousPointerY = 0;
  host.addEventListener('pointerdown', event => {
    if (!event.isTrusted) return;
    pointerId = event.pointerId;
    previousPointerX = event.clientX;
    previousPointerY = event.clientY;
    host.setPointerCapture(pointerId);
    state.inputCount += 1;
    state.pointerInputCount += 1;
    state.dragging = true;
    state.motionActive = false;
    state.lastInput = `pointer:${event.pointerType}`;
  });
  host.addEventListener('pointermove', event => {
    if (pointerId !== event.pointerId || !state.dragging || !event.isTrusted) return;
    const deltaX = event.clientX - previousPointerX;
    const deltaY = event.clientY - previousPointerY;
    previousPointerX = event.clientX;
    previousPointerY = event.clientY;
    state.pointerMoveCount += 1;
    state.dragDistance += Math.hypot(deltaX, deltaY);
    const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * 0.007);
    const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaY * 0.007);
    earthGroup.quaternion.premultiply(yaw).premultiply(pitch).normalize();
    render();
  });
  const releasePointer = event => {
    if (pointerId !== event.pointerId) return;
    if (host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId);
    pointerId = null;
    state.dragging = false;
  };
  host.addEventListener('pointerup', releasePointer);
  host.addEventListener('pointercancel', releasePointer);
  host.addEventListener('wheel', event => {
    if (!event.isTrusted) return;
    event.preventDefault();
    state.inputCount += 1;
    state.wheelInputCount += 1;
    state.lastInput = 'wheel';
    setCameraDistance(camera.position.z + Math.sign(event.deltaY) * 0.18);
  }, { passive: false });

  nextButton.addEventListener('click', event => {
    if (!event.isTrusted) return;
    state.inputCount += 1;
    state.buttonInputCount += 1;
    state.lastInput = 'button:next';
    focusPeak(state.selectedPeakIndex + 1);
  });
  resetButton.addEventListener('click', event => {
    if (!event.isTrusted) return;
    state.inputCount += 1;
    state.buttonInputCount += 1;
    resetEarth('button:reset');
  });

  host.addEventListener('keydown', event => {
    if (!event.isTrusted) return;
    const key = event.key.toLowerCase();
    const recognized = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', '+', '=', '-', '_', 'n', 'home', 'escape'];
    if (!recognized.includes(key)) return;
    event.preventDefault();
    state.inputCount += 1;
    state.keyboardInputCount += 1;
    state.lastInput = `keyboard:${event.key}`;
    if (key === 'n') {
      focusPeak(state.selectedPeakIndex + 1);
      return;
    }
    if (key === 'home' || key === 'escape') {
      resetEarth(`keyboard:${event.key}`);
      return;
    }
    if (key === '+' || key === '=') {
      setCameraDistance(camera.position.z - 0.16);
      return;
    }
    if (key === '-' || key === '_') {
      setCameraDistance(camera.position.z + 0.16);
      return;
    }
    state.motionActive = false;
    const angle = radians(7.5);
    const axis = key === 'arrowleft' || key === 'arrowright'
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    const direction = key === 'arrowleft' || key === 'arrowup' ? 1 : -1;
    earthGroup.quaternion.premultiply(
      new THREE.Quaternion().setFromAxisAngle(axis, angle * direction),
    ).normalize();
    render();
  });

  const handleReducedMotionChange = event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.motionActive) {
      earthGroup.quaternion.copy(focusTargetQuaternion);
      state.motionActive = false;
      state.motionCompletionCount += 1;
      render();
    }
  };
  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  } else {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }

  updateSummitCopy();
  updateCameraReadout();
  resize();
  setLoading(96, 'CALIBRATING TOPOGRAPHY', 'Uploading ETOPO mipmaps and validating draw calls');
  render();
  await new Promise(resolve => requestAnimationFrame(() => {
    render();
    requestAnimationFrame(resolve);
  }));
  if (renderer.info.render.calls < 1 || context.getError() !== context.NO_ERROR) {
    throw new Error('The GPU did not complete the ETOPO terrain calibration');
  }
  setLoading(100, 'ORBITAL VIEW READY', 'ETOPO relief · 50m coastline · 700 peaks indexed');
  stage.dataset.ready = 'true';
  document.documentElement.dataset.earthReady = 'true';
  const readyDelay = state.reducedMotion ? 0 : 620;
  const ready = new Promise(resolve => setTimeout(() => {
    state.loaderDismissed = true;
    resolve();
  }, readyDelay));

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`topographic-relief-expedition-globe: ${message}`);
    };
    const canvas = renderer.domElement;
    const canvasRect = canvas.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const nextRect = nextButton.getBoundingClientRect();
    const resetRect = resetButton.getBoundingClientRect();
    const currentPeak = focusPeaks[state.selectedPeakIndex];
    const elevationImageWidth = elevationTexture.image.naturalWidth || elevationTexture.image.width;
    const elevationImageHeight = elevationTexture.image.naturalHeight || elevationTexture.image.height;

    invariant(canvas instanceof HTMLCanvasElement, 'Three.js did not attach a canvas');
    invariant(Boolean(context) && typeof context.drawElements === 'function', 'live WebGL context is unavailable');
    invariant(renderer.info.render.calls > 0, 'Three.js has not issued a draw call');
    invariant(canvasRect.width >= 64 && canvasRect.height >= 64, 'canvas is too small');
    invariant(Math.abs(canvasRect.width - stageRect.width) < 2 && Math.abs(canvasRect.height - stageRect.height) < 2, 'canvas does not cover the stage');
    invariant(globeGeometry.attributes.position.count > 60000, 'globe geometry is not sufficiently tessellated');
    invariant(elevationTexture instanceof THREE.Texture, 'ETOPO relief is not a GPU texture');
    invariant(elevationImageWidth === ELEVATION_WIDTH && elevationImageHeight === ELEVATION_HEIGHT, 'ETOPO texture dimensions changed');
    invariant(topologyTexture instanceof THREE.DataTexture, '50m topology texture is missing');
    invariant(state.landPixelCount > 110000 && state.landPixelCount < 190000, '50m atlas land coverage is implausible');
    invariant(state.topologyChecksum !== 0 && state.peakChecksum !== 0, 'data checksums are missing');
    invariant(state.reliefLoaded && state.reliefAssetBytes === ELEVATION_EXPECTED_BYTES, 'ETOPO asset did not finish loading');
    invariant(state.peakCount === 700 && Object.values(state.continentCounts).every(count => count === 100), 'global peak coverage changed');
    invariant(peakGeometry.attributes.position.count === 700, 'peak markers are incomplete');
    invariant(state.starCount === STAR_COUNT && starGeometry.attributes.position.count === STAR_COUNT, 'star field is incomplete');
    invariant(state.terrainExaggeration === 45 && globeMaterial.uniforms.uTerrain.value === 45, 'terrain displacement is not active');
    invariant(earthGroup.children.includes(globe) && earthGroup.children.includes(peakPoints) && earthGroup.children.includes(atmosphere), 'Earth layers are incomplete');
    invariant(state.loaderProgress === 100 && state.loaderStageCount >= 7 && state.loaderDismissed, 'loading experience did not complete');
    invariant(state.initialStaticConfirmed, 'initial view was not static after loading');
    invariant(!state.automaticPlayback && !state.automaticRotation && !state.previewClockDrivesMotion, 'scene motion must remain human-owned');
    invariant(nextRect.width > 24 && resetRect.width > 20, 'controls are not usable');
    invariant(summitName.textContent.includes(currentPeak.en.replace('Mount ', '')), 'summit copy is out of sync');
    invariant(summitHeight.textContent.includes(Math.round(currentPeak.elevationM).toLocaleString('en-US')), 'summit height is out of sync');
    invariant(Number.isFinite(earthGroup.quaternion.length()) && Math.abs(earthGroup.quaternion.length() - 1) < 0.0001, 'Earth quaternion is invalid');
    return true;
  };

  installPreviewController({
    id: 'topographic-relief-expedition-globe',
    library: 'three@0.185.1 + topojson-client@3.1.0 + world-atlas@2.0.2',
    renderer: 'webgl',
    ready,
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
    peakGeometry.dispose();
    peakMaterial.dispose();
    atmosphere.geometry.dispose();
    atmosphereMaterial.dispose();
    starGeometry.dispose();
    starMaterial.dispose();
    topologyTexture.dispose();
    elevationTexture.dispose();
    renderer.dispose();
  }, { once: true });
};

main().catch(error => {
  const stage = document.querySelector('.relief-stage');
  const label = document.querySelector('#loading-stage');
  const detail = document.querySelector('#loading-detail');
  if (stage) stage.dataset.failed = 'true';
  if (label) label.textContent = 'RELIEF STREAM INTERRUPTED';
  if (detail) detail.textContent = error.message;
  markPreviewFailure(error);
});
