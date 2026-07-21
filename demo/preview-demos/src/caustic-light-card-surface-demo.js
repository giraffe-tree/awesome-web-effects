import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL('../assets/aesthetic-wave-07/caustic-light-card-surface/aquatic-material-calibration.jpg', import.meta.url).href;
const EXPECTED_ASSET_SHA256 = '72850e8dad0c1c0f34b2f2b3eafef430c24cbe5bddc5aa88434a0e2371ed967c';
const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_CROP_Y = 50;
const SOURCE_CROP_HEIGHT = 540;
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 54;
const SAMPLE_COUNT = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const MATERIAL_NAMES = ['Water', 'Glass', 'Stone', 'Ceramic', 'Rubber', 'Metal'];
const INITIAL = Object.freeze({ u: .52, v: .47, depth: .52, focus: .42, phase: .24 });
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = value => Number(value.toFixed(5));

try {
  const stage = document.querySelector('#caustic-stage');
  const canvasHost = document.querySelector('#caustic-canvas-host');
  const sourceProof = document.querySelector('#source-proof');
  const materialReadout = document.querySelector('#material-readout');
  const iorReadout = document.querySelector('#ior-readout');
  const scatterReadout = document.querySelector('#scatter-readout');
  const probeReadout = document.querySelector('#probe-readout');
  const depthRange = document.querySelector('#depth-range');
  const actionButtons = [...document.querySelectorAll('[data-light-action]')];
  const ledger = document.querySelector('#runtime-ledger');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const samplePixels = new Uint8ClampedArray(SAMPLE_COUNT * 4);
  const lumaField = new Float32Array(SAMPLE_COUNT);
  const roughnessField = new Float32Array(SAMPLE_COUNT);
  const materialField = new Uint8Array(SAMPLE_COUNT);
  const responseField = new Float32Array(SAMPLE_COUNT);
  const categoryCounts = new Uint32Array(MATERIAL_NAMES.length);
  const visitedMaterials = new Set();

  const state = {
    id: 'caustic-light-card-surface',
    task: 'human-operated-pixel-derived-aquatic-material-optical-inspection',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'committed-photo-pixels-drive-human-positioned-refraction-caustic-geometry-and-material-readout',
    assetMechanismRole: 'every-sampled-pixel-binds-local-luminance-gradient-material-class-refraction-index-and-caustic-gain',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button-control', 'range-control'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    nonInputVisualMutationCountAfterReady: 0,
    reducedMotion: reducedMotionQuery.matches,
    initialProbeU: INITIAL.u,
    initialProbeV: INITIAL.v,
    initialDepth: INITIAL.depth,
    initialFocus: INITIAL.focus,
    probeU: INITIAL.u,
    probeV: INITIAL.v,
    depth: INITIAL.depth,
    focus: INITIAL.focus,
    phase: INITIAL.phase,
    materialIndex: 0,
    materialName: MATERIAL_NAMES[0],
    localLuma: 0,
    localRoughness: 0,
    localResponse: 0,
    refractiveIndex: 1.333,
    scatterPercent: 0,
    sourceSampleReadCount: 0,
    visitedMaterialIds: [],
    distinctMaterialVisitedCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    keyboardInputCount: 0,
    keyboardMutationCount: 0,
    buttonActivationCount: 0,
    buttonMutationCount: 0,
    rangeInputCount: 0,
    rangeMutationCount: 0,
    resetActionCount: 0,
    humanVisualMutationCount: 0,
    humanInputCausalityCount: 0,
    activePointerId: null,
    pointerCaptured: false,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    firstHumanStateBefore: null,
    firstHumanStateAfter: null,
    minimumHumanDepth: INITIAL.depth,
    maximumHumanDepth: INITIAL.depth,
    maximumProbeTravel: 0,
    initialFrameSignature: '',
    initialFrameRepeatSignature: '',
    initialStillVerified: false,
    lastVisualSignature: '',
    assetUrl: ASSET_URL,
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetMimeType: '',
    assetSameOrigin: false,
    assetByteLength: 0,
    assetSha256: '',
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    p5ImageDecoded: false,
    p5ImageClass: '',
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    cropSourceY: SOURCE_CROP_Y,
    cropSourceHeight: SOURCE_CROP_HEIGHT,
    sampleWidth: SAMPLE_WIDTH,
    sampleHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sampledPixelSha256: '',
    distinctQuantizedColorCount: 0,
    opaquePixelCount: 0,
    minimumLuma: 1,
    maximumLuma: 0,
    lumaRange: 0,
    minimumRoughness: 1,
    maximumRoughness: 0,
    roughnessRange: 0,
    minimumResponse: 1,
    maximumResponse: 0,
    responseRange: 0,
    materialCategoryCounts: [],
    nonEmptyMaterialCategoryCount: 0,
    materialBindingChecksum: 0,
    assetEvidenceReady: false,
    materialEvidenceReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    renderCount: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    causticBandCount: 0,
    causticVertexCount: 0,
    refractionSampleCount: 0,
    lastRenderedBindingChecksum: 0,
    stageWidth: 0,
    stageHeight: 0,
    stageCoverageRatio: 0,
    canvasCoverageRatio: 0,
    resizeCount: 0,
    runtimeAssertionPassed: false,
    ready: false,
    inputRecords: []
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__CAUSTIC_MATERIAL_STATE__ = state;

  let sketch;
  let materialImage;
  let dirty = true;
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`caustic-light-card-surface: ${message}`);
  }

  async function digestHex(buffer) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function classifyMaterial(red, green, blue, luma) {
    if (red > 112 && red > green * 1.28 && red > blue * 1.2) return 3;
    if (luma < .235 && blue > red * .92) return 4;
    if (red > 156 && green > 142 && blue > 112 && red > blue * 1.035) return 2;
    if (luma > .48 && Math.abs(red - green) < 34 && Math.abs(green - blue) < 48 && blue > 104) return 5;
    if (green > red * 1.08 && blue > red * .96) return 1;
    return 0;
  }

  function sourceIndex(x, y) {
    return Math.max(0, Math.min(SAMPLE_COUNT - 1,
      Math.max(0, Math.min(SAMPLE_HEIGHT - 1, y)) * SAMPLE_WIDTH
      + Math.max(0, Math.min(SAMPLE_WIDTH - 1, x))));
  }

  function sampleAt(u, v) {
    const x = Math.max(0, Math.min(SAMPLE_WIDTH - 1, Math.round(clamp(u) * (SAMPLE_WIDTH - 1))));
    const y = Math.max(0, Math.min(SAMPLE_HEIGHT - 1, Math.round(clamp(v) * (SAMPLE_HEIGHT - 1))));
    const index = y * SAMPLE_WIDTH + x;
    const offset = index * 4;
    return {
      index,
      red: samplePixels[offset],
      green: samplePixels[offset + 1],
      blue: samplePixels[offset + 2],
      luma: lumaField[index],
      roughness: roughnessField[index],
      material: materialField[index],
      response: responseField[index]
    };
  }

  function refractiveIndexFor(sample) {
    const bases = [1.333, 1.472, 1.538, 1.508, 1.482, 1.615];
    return bases[sample.material] + (sample.luma - .5) * .024 + sample.roughness * .018;
  }

  function visualSignature() {
    return [
      state.probeU.toFixed(5),
      state.probeV.toFixed(5),
      state.depth.toFixed(5),
      state.focus.toFixed(5),
      state.phase.toFixed(5),
      state.materialIndex,
      state.localLuma.toFixed(5),
      state.localRoughness.toFixed(5),
      state.localResponse.toFixed(5)
    ].join('|');
  }

  async function fetchAndDecodeAsset() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `material asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    invariant(state.assetSameOrigin, 'material plate was not fetched from this preview origin');
    invariant(state.assetShaMatchesExpected, 'material plate SHA-256 differs from the committed asset');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const browserImage = new Image();
    browserImage.src = objectUrl;
    try {
      await browserImage.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = browserImage.naturalWidth;
      state.sourceNaturalHeight = browserImage.naturalHeight;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    invariant(state.browserImageDecoded && state.sourceNaturalWidth === SOURCE_WIDTH
      && state.sourceNaturalHeight === SOURCE_HEIGHT, 'browser-decoded material plate dimensions are not 960x640');
    state.assetEvidenceReady = true;
  }

  const assetReady = fetchAndDecodeAsset();

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(canvasHost);
          p.noLoop();
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement
            && p.drawingContext instanceof CanvasRenderingContext2D;
          state.p5CanvasWidth = p.width;
          state.p5CanvasHeight = p.height;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.p5DrawCount += 1;
        if (!state.materialEvidenceReady || !materialImage) {
          p.background('#062b34');
          return;
        }

        const width = p.width;
        const height = p.height;
        p.image(materialImage, 0, 0, width, height, 0, SOURCE_CROP_Y, SOURCE_WIDTH, SOURCE_CROP_HEIGHT);

        const context = p.drawingContext;
        const grade = context.createLinearGradient(0, 0, width, height);
        grade.addColorStop(0, 'rgba(0,31,38,.48)');
        grade.addColorStop(.37, 'rgba(0,31,38,.04)');
        grade.addColorStop(.72, 'rgba(0,21,27,.02)');
        grade.addColorStop(1, 'rgba(0,20,27,.31)');
        context.fillStyle = grade;
        context.fillRect(0, 0, width, height);

        const probeX = state.probeU * width;
        const probeY = state.probeV * height;
        const radius = Math.max(19, Math.min(width, height) * (.17 + state.depth * .09));
        const sample = sampleAt(state.probeU, state.probeV);
        const displacement = (state.refractiveIndex - 1.3) * (3.5 + state.depth * 5.5) * state.focus;

        context.save();
        context.beginPath();
        context.arc(probeX, probeY, radius, 0, Math.PI * 2);
        context.clip();
        context.translate(probeX, probeY);
        const stretch = 1 + .016 + state.focus * .024 + sample.roughness * .018;
        context.scale(stretch + displacement * .0014, stretch - displacement * .0006);
        context.translate(-probeX + Math.cos(state.phase * Math.PI * 2) * displacement,
          -probeY + Math.sin(state.phase * Math.PI * 2) * displacement * .72);
        context.globalAlpha = .94;
        p.image(materialImage, 0, 0, width, height, 0, SOURCE_CROP_Y, SOURCE_WIDTH, SOURCE_CROP_HEIGHT);
        context.restore();
        state.refractionSampleCount += 1;

        context.save();
        context.beginPath();
        context.arc(probeX, probeY, radius * 1.03, 0, Math.PI * 2);
        context.clip();
        context.globalCompositeOperation = 'screen';
        const bandCount = state.reducedMotion ? 8 : 12;
        let vertexCount = 0;
        for (let band = 0; band < bandCount; band += 1) {
          const bandT = band / Math.max(1, bandCount - 1);
          const baseY = probeY - radius * .78 + bandT * radius * 1.56;
          context.beginPath();
          for (let step = 0; step <= 42; step += 1) {
            const t = step / 42;
            const localX = probeX - radius + t * radius * 2;
            const normalizedX = localX / Math.max(1, width);
            const normalizedY = baseY / Math.max(1, height);
            const local = sampleAt(normalizedX, normalizedY);
            const edgeLift = (local.roughness - .12) * radius * .12;
            const wave = Math.sin(t * Math.PI * (3.7 + state.depth * 2.5)
              + state.phase * Math.PI * 2 + band * .73) * radius * (.035 + local.response * .045);
            const crossWave = Math.cos(t * Math.PI * 8.2 - band * .51 + state.phase * 4.1)
              * radius * .017 * state.focus;
            const y = baseY + wave + crossWave + edgeLift;
            if (step === 0) context.moveTo(localX, y);
            else context.lineTo(localX, y);
            vertexCount += 1;
          }
          const alpha = .12 + state.focus * .18 + sample.response * .13 + (band % 3) * .025;
          context.strokeStyle = `rgba(${194 + Math.round(sample.red * .2)},${220 + Math.round(sample.green * .12)},${225 + Math.round(sample.blue * .1)},${alpha.toFixed(3)})`;
          context.lineWidth = Math.max(.7, width / 720) * (1.05 + sample.roughness * 1.8 + (band % 2) * .32);
          context.stroke();
        }

        const ringCount = state.reducedMotion ? 4 : 6;
        for (let ring = 0; ring < ringCount; ring += 1) {
          context.beginPath();
          for (let step = 0; step <= 56; step += 1) {
            const angle = step / 56 * Math.PI * 2;
            const ringScale = .26 + ring / Math.max(1, ringCount - 1) * .67;
            const sourceU = state.probeU + Math.cos(angle) * ringScale * radius / Math.max(1, width);
            const sourceV = state.probeV + Math.sin(angle) * ringScale * radius / Math.max(1, height);
            const local = sampleAt(sourceU, sourceV);
            const wobble = 1 + Math.sin(angle * (4 + ring % 3) + state.phase * Math.PI * 2 + ring) * .055
              + (local.luma - .5) * .045 + local.roughness * .075;
            const x = probeX + Math.cos(angle) * radius * ringScale * wobble;
            const y = probeY + Math.sin(angle) * radius * ringScale * wobble;
            if (step === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
            vertexCount += 1;
          }
          context.closePath();
          context.strokeStyle = `rgba(230,255,241,${(.07 + state.focus * .1 + ring * .012).toFixed(3)})`;
          context.lineWidth = Math.max(.55, width / 900) * (1 + ring % 2 * .6);
          context.stroke();
        }
        context.restore();

        const halo = context.createRadialGradient(probeX - radius * .22, probeY - radius * .25, 0,
          probeX, probeY, radius * 1.08);
        halo.addColorStop(0, `rgba(255,250,205,${(.07 + state.focus * .10).toFixed(3)})`);
        halo.addColorStop(.62, 'rgba(150,244,239,.025)');
        halo.addColorStop(1, 'rgba(3,31,39,0)');
        context.fillStyle = halo;
        context.beginPath();
        context.arc(probeX, probeY, radius * 1.08, 0, Math.PI * 2);
        context.fill();

        const lineWidth = Math.max(1, width / 560);
        context.save();
        context.strokeStyle = 'rgba(255,244,201,.88)';
        context.lineWidth = lineWidth;
        context.beginPath();
        context.arc(probeX, probeY, Math.max(5, radius * .13), -.45, 4.65);
        context.stroke();
        context.strokeStyle = 'rgba(188,247,231,.78)';
        context.beginPath();
        context.arc(probeX, probeY, radius, .18, 2.45);
        context.stroke();
        context.beginPath();
        context.moveTo(probeX - radius * .18, probeY);
        context.lineTo(probeX - radius * .06, probeY);
        context.moveTo(probeX + radius * .06, probeY);
        context.lineTo(probeX + radius * .18, probeY);
        context.moveTo(probeX, probeY - radius * .18);
        context.lineTo(probeX, probeY - radius * .06);
        context.moveTo(probeX, probeY + radius * .06);
        context.lineTo(probeX, probeY + radius * .18);
        context.stroke();
        context.restore();

        state.causticBandCount = bandCount + ringCount;
        state.causticVertexCount = vertexCount;
        state.lastRenderedBindingChecksum = state.materialBindingChecksum;
        state.p5CompletedDrawCount += 1;
        state.lastVisualSignature = visualSignature();
      };
    }, canvasHost);
  });

  function loadP5Material() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(ASSET_URL, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  async function prepareMaterialEvidence() {
    await Promise.all([assetReady, p5Ready]);
    const decoded = await loadP5Material();
    state.p5ImageDecoded = decoded instanceof p5.Image;
    state.p5ImageClass = decoded instanceof p5.Image ? 'p5.Image' : String(decoded?.constructor?.name || 'unknown');
    state.p5ImageWidth = decoded.width;
    state.p5ImageHeight = decoded.height;
    decoded.loadPixels();
    state.p5ImagePixelLength = decoded.pixels.length;
    invariant(state.p5ImageDecoded && decoded.width === SOURCE_WIDTH && decoded.height === SOURCE_HEIGHT
      && decoded.pixels.length === SOURCE_WIDTH * SOURCE_HEIGHT * 4,
    'p5 did not decode the committed 960x640 material plate');
    materialImage = decoded;

    const sample = decoded.get(0, SOURCE_CROP_Y, SOURCE_WIDTH, SOURCE_CROP_HEIGHT);
    sample.resize(SAMPLE_WIDTH, SAMPLE_HEIGHT);
    sample.loadPixels();
    samplePixels.set(sample.pixels);
    state.sampledPixelCount = SAMPLE_COUNT;
    state.sampledByteLength = samplePixels.byteLength;
    state.sampledPixelSha256 = await digestHex(samplePixels.buffer);

    const colors = new Set();
    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const offset = index * 4;
      const red = samplePixels[offset];
      const green = samplePixels[offset + 1];
      const blue = samplePixels[offset + 2];
      const alpha = samplePixels[offset + 3];
      const luma = (red * .2126 + green * .7152 + blue * .0722) / 255;
      lumaField[index] = luma;
      if (alpha === 255) state.opaquePixelCount += 1;
      state.minimumLuma = Math.min(state.minimumLuma, luma);
      state.maximumLuma = Math.max(state.maximumLuma, luma);
      colors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
    }

    let bindingChecksum = 2166136261;
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const index = y * SAMPLE_WIDTH + x;
        const offset = index * 4;
        const red = samplePixels[offset];
        const green = samplePixels[offset + 1];
        const blue = samplePixels[offset + 2];
        const left = lumaField[sourceIndex(x - 1, y)];
        const right = lumaField[sourceIndex(x + 1, y)];
        const up = lumaField[sourceIndex(x, y - 1)];
        const down = lumaField[sourceIndex(x, y + 1)];
        const roughness = clamp(Math.hypot(right - left, down - up) * 1.75);
        const material = classifyMaterial(red, green, blue, lumaField[index]);
        const chroma = (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;
        const response = clamp(.18 + roughness * .48 + chroma * .31 + lumaField[index] * .16);
        roughnessField[index] = roughness;
        materialField[index] = material;
        responseField[index] = response;
        categoryCounts[material] += 1;
        state.minimumRoughness = Math.min(state.minimumRoughness, roughness);
        state.maximumRoughness = Math.max(state.maximumRoughness, roughness);
        state.minimumResponse = Math.min(state.minimumResponse, response);
        state.maximumResponse = Math.max(state.maximumResponse, response);
        bindingChecksum = Math.imul(bindingChecksum ^ material ^ Math.round(roughness * 10000)
          ^ Math.round(response * 10000) ^ Math.round(lumaField[index] * 10000), 16777619) >>> 0;
      }
    }

    state.lumaRange = state.maximumLuma - state.minimumLuma;
    state.roughnessRange = state.maximumRoughness - state.minimumRoughness;
    state.responseRange = state.maximumResponse - state.minimumResponse;
    state.distinctQuantizedColorCount = colors.size;
    state.materialCategoryCounts = [...categoryCounts];
    state.nonEmptyMaterialCategoryCount = state.materialCategoryCounts.filter(count => count > 0).length;
    state.materialBindingChecksum = bindingChecksum >>> 0;
    state.materialEvidenceReady = true;
  }

  const materialEvidenceReady = prepareMaterialEvidence();

  function snapshot() {
    return {
      u: state.probeU,
      v: state.probeV,
      depth: state.depth,
      focus: state.focus,
      phase: state.phase,
      material: state.materialIndex
    };
  }

  function updateMaterialBinding() {
    const sample = sampleAt(state.probeU, state.probeV);
    state.materialIndex = sample.material;
    state.materialName = MATERIAL_NAMES[sample.material];
    state.localLuma = sample.luma;
    state.localRoughness = sample.roughness;
    state.localResponse = sample.response;
    state.refractiveIndex = refractiveIndexFor(sample);
    state.scatterPercent = Math.round(clamp(sample.roughness * .71 + (1 - sample.luma) * .21 + sample.response * .17) * 100);
    state.sourceSampleReadCount += 1;
    visitedMaterials.add(sample.material);
    state.visitedMaterialIds = [...visitedMaterials].sort((a, b) => a - b);
    state.distinctMaterialVisitedCount = visitedMaterials.size;
  }

  function updateLayoutEvidence() {
    const stageBounds = stage.getBoundingClientRect();
    const canvas = canvasHost.querySelector('canvas');
    const canvasBounds = canvas?.getBoundingClientRect();
    state.stageWidth = rounded(stageBounds.width);
    state.stageHeight = rounded(stageBounds.height);
    state.stageCoverageRatio = rounded(stageBounds.width * stageBounds.height / Math.max(1, innerWidth * innerHeight));
    state.canvasCoverageRatio = canvasBounds
      ? rounded(canvasBounds.width * canvasBounds.height / Math.max(1, stageBounds.width * stageBounds.height))
      : 0;
  }

  function syncInterface() {
    materialReadout.textContent = state.materialName;
    iorReadout.textContent = state.refractiveIndex.toFixed(3);
    scatterReadout.textContent = `${state.scatterPercent}%`;
    probeReadout.textContent = `Focus ${Math.round(state.focus * 100)} · depth ${Math.round(state.depth * 100)}`;
    probeReadout.style.setProperty('--probe-x', `${(state.probeU * 100).toFixed(3)}%`);
    probeReadout.style.setProperty('--probe-y', `${(state.probeV * 100).toFixed(3)}%`);
    depthRange.value = String(Math.round(state.depth * 100));
    sourceProof.textContent = state.materialEvidenceReady ? 'Source pixels / ready' : 'Source pixels / loading';
    stage.dataset.material = state.materialName.toLowerCase();
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    stage.dataset.depth = state.depth.toFixed(3);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
    updateLayoutEvidence();
    ledger.value = JSON.stringify({
      inputCount: state.inputCount,
      lastInputKind: state.lastInputKind,
      lastInputTrusted: state.lastInputTrusted,
      lastPointerType: state.lastPointerType,
      hoverMutationCount: state.hoverMutationCount,
      dragMutationCount: state.dragMutationCount,
      keyboardMutationCount: state.keyboardMutationCount,
      buttonMutationCount: state.buttonMutationCount,
      rangeMutationCount: state.rangeMutationCount,
      pointerCaptureCount: state.pointerCaptureCount,
      pointerCaptureReleaseCount: state.pointerCaptureReleaseCount,
      sourceSampleReadCount: state.sourceSampleReadCount,
      distinctMaterialVisitedCount: state.distinctMaterialVisitedCount,
      materialName: state.materialName,
      refractiveIndex: rounded(state.refractiveIndex),
      scatterPercent: state.scatterPercent,
      depth: rounded(state.depth),
      focus: rounded(state.focus),
      assetSha256: state.assetSha256,
      sampledPixelSha256: state.sampledPixelSha256,
      materialBindingChecksum: state.materialBindingChecksum,
      runtimeAssert: stage.dataset.runtimeAssert === 'true'
    });
  }

  function resizeCanvas() {
    if (!sketch || !state.p5InstanceReady) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    if (sketch.width === width && sketch.height === height) return;
    sketch.resizeCanvas(width, height, true);
    state.resizeCount += 1;
    state.p5CanvasWidth = sketch.width;
    state.p5CanvasHeight = sketch.height;
    dirty = true;
  }

  function render() {
    state.renderCount += 1;
    if (!state.materialEvidenceReady || !sketch) return;
    resizeCanvas();
    if (dirty) {
      sketch.redraw();
      dirty = false;
    }
    syncInterface();
  }

  function acceptTrustedInput(event, kind) {
    if (!state.ready) return false;
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      syncInterface();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = true;
    if (event instanceof PointerEvent) state.lastPointerType = event.pointerType || 'mouse';
    return true;
  }

  function pointerPosition(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      u: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), .025, .975),
      v: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), .04, .96)
    };
  }

  function isControlTarget(event) {
    return event.target instanceof Element && Boolean(event.target.closest('[data-light-action], #depth-range'));
  }

  function recordHumanMutation(kind, before, after) {
    state.humanVisualMutationCount += 1;
    state.humanInputCausalityCount += 1;
    state.minimumHumanDepth = Math.min(state.minimumHumanDepth, after.depth);
    state.maximumHumanDepth = Math.max(state.maximumHumanDepth, after.depth);
    state.maximumProbeTravel = Math.max(state.maximumProbeTravel,
      Math.hypot(after.u - INITIAL.u, after.v - INITIAL.v));
    if (!state.firstHumanStateBefore) {
      state.firstHumanStateBefore = { ...before };
      state.firstHumanStateAfter = { ...after };
    }
    state.inputRecords.push({
      kind,
      trusted: true,
      before: Object.fromEntries(Object.entries(before).map(([key, value]) => [key, typeof value === 'number' ? rounded(value) : value])),
      after: Object.fromEntries(Object.entries(after).map(([key, value]) => [key, typeof value === 'number' ? rounded(value) : value]))
    });
    if (state.inputRecords.length > 64) state.inputRecords.shift();
  }

  function mutateFromInput(event, kind, mutate) {
    if (!acceptTrustedInput(event, kind)) return false;
    const before = snapshot();
    mutate();
    updateMaterialBinding();
    const after = snapshot();
    const changed = before.u !== after.u || before.v !== after.v || before.depth !== after.depth
      || before.focus !== after.focus || before.phase !== after.phase || before.material !== after.material;
    if (changed) {
      recordHumanMutation(kind, before, after);
      dirty = true;
      render();
    } else {
      syncInterface();
    }
    return changed;
  }

  function resetState() {
    state.probeU = INITIAL.u;
    state.probeV = INITIAL.v;
    state.depth = INITIAL.depth;
    state.focus = INITIAL.focus;
    state.phase = INITIAL.phase;
  }

  stage.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || isControlTarget(event)) return;
    const point = pointerPosition(event);
    const changed = mutateFromInput(event, 'mouse-hover-enter', () => {
      state.probeU = point.u;
      state.probeV = point.v;
      state.focus = .46;
      state.phase = clamp(point.u * .64 + point.v * .36);
    });
    if (changed) {
      state.pointerEnterCount += 1;
      state.hoverMutationCount += 1;
    }
  });

  stage.addEventListener('pointerdown', event => {
    if (isControlTarget(event)) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    const point = pointerPosition(event);
    const changed = mutateFromInput(event, `${event.pointerType || 'mouse'}-drag-start`, () => {
      state.probeU = point.u;
      state.probeV = point.v;
      state.focus = clamp(.78 + Math.max(.1, event.pressure || 0) * .18);
      state.phase = clamp(point.u * .72 + point.v * .28);
    });
    if (!changed && state.lastInputTrusted !== true) return;
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    if (changed) state.dragMutationCount += 1;
    syncInterface();
  });

  stage.addEventListener('pointermove', event => {
    if (isControlTarget(event) && state.activePointerId === null) return;
    const activeDrag = state.activePointerId === event.pointerId;
    const mouseHover = event.pointerType === 'mouse' && state.activePointerId === null;
    if (!activeDrag && !mouseHover) return;
    const point = pointerPosition(event);
    const changed = mutateFromInput(event, activeDrag ? `${event.pointerType || 'mouse'}-drag-move` : 'mouse-hover-move', () => {
      state.probeU = point.u;
      state.probeV = point.v;
      state.focus = activeDrag
        ? clamp(.77 + Math.max(.1, event.pressure || 0) * .2)
        : .46;
      state.phase = clamp(point.u * .62 + point.v * .38);
    });
    if (changed) {
      state.pointerMoveCount += 1;
      if (activeDrag) state.dragMutationCount += 1;
      else state.hoverMutationCount += 1;
    }
  });

  function releasePointer(event, kind) {
    if (state.activePointerId !== event.pointerId) return;
    const changed = mutateFromInput(event, kind, () => {
      state.focus = .64;
    });
    state.pointerReleaseCount += 1;
    if (kind.includes('cancel')) state.pointerCancelCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.activePointerId = null;
    state.pointerCaptured = false;
    if (changed) state.dragMutationCount += 1;
    syncInterface();
  }

  stage.addEventListener('pointerup', event => releasePointer(event, `${event.pointerType || 'mouse'}-drag-end`));
  stage.addEventListener('pointercancel', event => releasePointer(event, `${event.pointerType || 'mouse'}-drag-cancel`));

  stage.addEventListener('keydown', event => {
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '[', ']', '-', '+', '=', 'Enter', ' ', 'Home', 'r', 'R'].includes(event.key);
    if (!handled) return;
    event.preventDefault();
    const changed = mutateFromInput(event, `keyboard-${event.key}`, () => {
      const step = event.shiftKey ? .095 : .052;
      if (event.key === 'ArrowLeft') state.probeU = clamp(state.probeU - step, .025, .975);
      else if (event.key === 'ArrowRight') state.probeU = clamp(state.probeU + step, .025, .975);
      else if (event.key === 'ArrowUp') state.probeV = clamp(state.probeV - step, .04, .96);
      else if (event.key === 'ArrowDown') state.probeV = clamp(state.probeV + step, .04, .96);
      else if (event.key === '[' || event.key === '-') state.depth = clamp(state.depth - .09, .18, .88);
      else if (event.key === ']' || event.key === '+' || event.key === '=') state.depth = clamp(state.depth + .09, .18, .88);
      else if (event.key === 'Enter' || event.key === ' ') state.focus = state.focus > .75 ? .42 : .92;
      else resetState();
      state.phase = clamp(state.probeU * .62 + state.probeV * .38);
    });
    state.keyboardInputCount += 1;
    if (changed) state.keyboardMutationCount += 1;
  });

  actionButtons.forEach(button => button.addEventListener('click', event => {
    const action = button.dataset.lightAction;
    const changed = mutateFromInput(event, `button-${action}`, () => {
      if (action === 'shallower') state.depth = clamp(state.depth - .14, .18, .88);
      else if (action === 'deeper') state.depth = clamp(state.depth + .14, .18, .88);
      else {
        resetState();
        state.resetActionCount += 1;
      }
    });
    state.buttonActivationCount += 1;
    if (changed) state.buttonMutationCount += 1;
    stage.focus({ preventScroll: true });
  }));

  depthRange.addEventListener('input', event => {
    const changed = mutateFromInput(event, 'range-depth', () => {
      state.depth = clamp(Number(depthRange.value) / 100, .18, .88);
    });
    state.rangeInputCount += 1;
    if (changed) state.rangeMutationCount += 1;
  });

  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeCanvas();
      render();
    });
  }).observe(stage);

  const ready = Promise.all([materialEvidenceReady, document.fonts.ready]).then(() => {
    updateMaterialBinding();
    dirty = true;
    render();
    state.initialFrameSignature = visualSignature();
    dirty = true;
    render();
    state.initialFrameRepeatSignature = visualSignature();
    state.initialStillVerified = state.initialFrameSignature === state.initialFrameRepeatSignature;
    state.ready = true;
    syncInterface();
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = canvasHost.querySelector('canvas');
    const realP5 = sketch instanceof p5
      && state.p5InstanceReady
      && state.p5CanvasReady
      && canvas instanceof HTMLCanvasElement
      && sketch.drawingContext === canvas.getContext('2d')
      && sketch.width === stage.clientWidth
      && sketch.height === stage.clientHeight
      && state.p5CompletedDrawCount > 0
      && state.causticBandCount >= 12
      && state.causticVertexCount > 600
      && state.refractionSampleCount > 0
      && state.lastRenderedBindingChecksum === state.materialBindingChecksum;
    const honestInteraction = state.task === 'human-operated-pixel-derived-aquatic-material-optical-inspection'
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.nonInputVisualMutationCountAfterReady === 0
      && state.renderIgnoresPreviewClock
      && state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && state.lastInputTrusted !== false;
    const realAsset = state.assetEvidenceReady
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetMimeType.includes('image/jpeg')
      && state.assetSameOrigin
      && state.assetByteLength === 277104
      && state.assetShaMatchesExpected
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.browserImageDecoded
      && state.sourceNaturalWidth === SOURCE_WIDTH
      && state.sourceNaturalHeight === SOURCE_HEIGHT
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === SOURCE_WIDTH
      && state.p5ImageHeight === SOURCE_HEIGHT
      && state.p5ImagePixelLength === SOURCE_WIDTH * SOURCE_HEIGHT * 4;
    const pixelDerivedMaterial = state.materialEvidenceReady
      && state.sampleWidth === SAMPLE_WIDTH
      && state.sampleHeight === SAMPLE_HEIGHT
      && state.sampledPixelCount === SAMPLE_COUNT
      && state.sampledByteLength === SAMPLE_COUNT * 4
      && typeof state.sampledPixelSha256 === 'string'
      && state.sampledPixelSha256.length === 64
      && !/^0+$/.test(state.sampledPixelSha256)
      && state.opaquePixelCount === SAMPLE_COUNT
      && state.distinctQuantizedColorCount > 450
      && state.lumaRange > .42
      && state.roughnessRange > .2
      && state.responseRange > .2
      && state.materialCategoryCounts.length === MATERIAL_NAMES.length
      && state.materialCategoryCounts.reduce((sum, count) => sum + count, 0) === SAMPLE_COUNT
      && state.nonEmptyMaterialCategoryCount >= 5
      && state.materialBindingChecksum > 0
      && Number.isFinite(state.refractiveIndex)
      && state.refractiveIndex > 1.3
      && state.refractiveIndex < 1.7
      && state.scatterPercent >= 0
      && state.scatterPercent <= 100;
    const responsiveStage = state.stageCoverageRatio > .99
      && state.canvasCoverageRatio > .99
      && state.stageWidth === innerWidth
      && state.stageHeight === innerHeight;
    const initialOrHumanDriven = state.inputCount === 0
      ? state.humanVisualMutationCount === 0
        && state.probeU === INITIAL.u
        && state.probeV === INITIAL.v
        && state.depth === INITIAL.depth
        && state.focus === INITIAL.focus
        && state.lastVisualSignature === state.initialFrameSignature
      : state.trustedInputCount === state.inputCount
        && state.humanVisualMutationCount > 0
        && state.humanInputCausalityCount === state.humanVisualMutationCount
        && state.sourceSampleReadCount > 1
        && (state.maximumProbeTravel > .01
          || state.minimumHumanDepth < INITIAL.depth
          || state.maximumHumanDepth > INITIAL.depth);
    const result = Boolean(state.ready
      && realP5
      && honestInteraction
      && realAsset
      && pixelDerivedMaterial
      && responsiveStage
      && initialOrHumanDriven
      && window.__PREVIEW_META__?.id === state.id
      && window.__PREVIEW_META__?.library === state.claimedLibrary
      && window.__PREVIEW_META__?.renderer === 'canvas2d'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.dataset.previewMechanism === 'p5-pixel-derived-human-light-refraction');
    state.runtimeAssertionPassed = result;
    stage.dataset.runtimeAssert = String(result);
    syncInterface();
    return result;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render: () => render(),
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
