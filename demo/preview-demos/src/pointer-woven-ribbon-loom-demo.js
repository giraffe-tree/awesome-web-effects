import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const SOURCE_URL = new URL('../assets/aesthetic-wave-09/pointer-woven-ribbon-loom/loom-material-calibration.jpg', import.meta.url);
const SOURCE_BYTES = 469833;
const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_SHA256 = '4086ae488153382f68c8697c4de0f53625ea10d39cf8b8df9a06cf8e25843159';
const MATERIAL_NAMES = ['TWILL', 'PLAIN', 'SATIN', 'CROSS'];
const REGIONS = [[.03, .255], [.255, .5], [.5, .745], [.745, .97]];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const round = (value, precision = 3) => Number(value.toFixed(precision));
const luma = (r, g, b) => .2126 * r + .7152 * g + .0722 * b;

const sha256 = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
  .map(byte => byte.toString(16).padStart(2, '0')).join('');

const average = values => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

function colorStats(data, width, height, x0, x1) {
  const left = Math.floor(width * x0);
  const right = Math.ceil(width * x1);
  const luminance = [];
  const saturation = [];
  const colors = [];
  let edgeX = 0;
  let edgeY = 0;
  let edges = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = Math.max(1, left); x < Math.min(width - 1, right); x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const high = Math.max(r, g, b);
      const low = Math.min(r, g, b);
      luminance.push(luma(r, g, b));
      saturation.push(high ? (high - low) / high : 0);
      colors.push([r, g, b]);
      edgeX += Math.abs(luma(data[index + 4], data[index + 5], data[index + 6]) - luma(r, g, b));
      const below = index + width * 4;
      edgeY += Math.abs(luma(data[below], data[below + 1], data[below + 2]) - luma(r, g, b));
      edges += 1;
    }
  }
  const mean = average(luminance);
  const stddev = Math.sqrt(average(luminance.map(value => (value - mean) ** 2)));
  colors.sort((a, b) => luma(...a) - luma(...b));
  const base = colors[Math.floor(colors.length * .42)] || [110, 90, 70];
  const accent = colors[Math.floor(colors.length * .78)] || [220, 190, 140];
  return {
    lumaMean: round(mean),
    lumaStddev: round(stddev),
    saturation: round(average(saturation)),
    edgeX: round(edgeX / Math.max(1, edges)),
    edgeY: round(edgeY / Math.max(1, edges)),
    base,
    accent
  };
}

function deriveProfiles(pixels, width, height) {
  const samples = REGIONS.map((region, index) => ({ index, ...colorStats(pixels, width, height, ...region) }));
  const densities = samples.map(sample => sample.edgeX + sample.edgeY + sample.lumaStddev * .08);
  const sorted = [...densities].sort((a, b) => a - b);
  return samples.map((sample, index) => {
    const rank = sorted.indexOf(densities[index]);
    const axis = sample.edgeY / Math.max(.01, sample.edgeX + sample.edgeY);
    const warp = Math.round(11 + rank * 3 + axis * 4);
    const weft = Math.round(8 + (3 - rank) * 2 + (1 - axis) * 4);
    const tension = clamp(.34 + rank * .12 + sample.saturation * .16, .28, .88);
    const friction = clamp(.78 - rank * .1 + sample.lumaStddev / 300, .3, .86);
    const conclusion = rank <= 0 ? 'OPEN' : rank >= 3 ? 'TIGHT' : 'BALANCED';
    return {
      ...sample,
      name: MATERIAL_NAMES[index],
      rank,
      density: round(densities[index]),
      warp,
      weft,
      angle: Math.round((Math.atan2(sample.edgeY, sample.edgeX) * 180 / Math.PI - 45) * .8),
      tension: round(tension),
      friction: round(friction),
      conclusion,
      baseCss: `rgb(${sample.base.join(' ')})`,
      accentCss: `rgb(${sample.accent.join(' ')})`
    };
  });
}

function containPoint(event, element) {
  const bounds = element.getBoundingClientRect();
  return {
    u: clamp((event.clientX - bounds.left) / bounds.width),
    v: clamp((event.clientY - bounds.top) / bounds.height)
  };
}

try {
  const stage = document.querySelector('#loom-stage');
  const host = document.querySelector('#loom-surface');
  const sourceImage = document.querySelector('#source-image');
  const evidenceCanvas = document.querySelector('#source-evidence');
  const sourceStatus = document.querySelector('[data-source-status]');
  const materialButtons = [...document.querySelectorAll('[data-material]')];
  const actionButtons = [...document.querySelectorAll('[data-action]')];
  const tensionInput = document.querySelector('#loom-tension');
  const tensionOutput = document.querySelector('[data-tension-output]');
  const outputStatus = document.querySelector('[data-output-status]');
  const outputName = document.querySelector('[data-output-name]');
  const readings = Object.fromEntries([...document.querySelectorAll('[data-reading]')].map(node => [node.dataset.reading, node]));
  let sketch;
  let sourceBitmap;
  let profiles = [];
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const state = {
    id: 'pointer-woven-ribbon-loom',
    task: 'human-operated-pixel-derived-textile-structure-proof',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'verified-material-master-pixels-drive-warp-weft-angle-tension-friction-color-and-weave-conclusion',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-control', 'material-buttons', 'visible-action-buttons'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    initialStillVerified: false,
    automaticCycle: false,
    automaticPlayback: false,
    automaticTimeline: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockIgnored: 0,
    previewClockMutationCount: 0,
    selected: 0,
    shuttleU: .58,
    shuttleV: .52,
    bendStrength: 0,
    pull: 0,
    tensionBias: 50,
    dragging: false,
    activePointerId: null,
    committed: [],
    history: [],
    trustedInputs: 0,
    rejectedInputs: 0,
    humanMutationCount: 0,
    hoverInputs: 0,
    dragInputs: 0,
    keyboardInputs: 0,
    touchInputs: 0,
    penInputs: 0,
    mouseInputs: 0,
    rangeInputs: 0,
    materialInputs: 0,
    actionInputs: 0,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    p5DrawCount: 0,
    setupDrawCount: 0,
    eventRedrawCount: 0,
    resizeRedrawCount: 0,
    source: null,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetMimeType: '',
    assetSameOrigin: false,
    browserImageDecoded: false,
    profiles: [],
    canvasCoverage: null,
    lastInput: 'none',
    initialVisualChecksum: null,
    currentVisualChecksum: null
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__POINTER_WOVEN_LOOM_STATE__ = state;

  function visualChecksum() {
    return [state.selected, round(state.shuttleU), round(state.shuttleV), round(state.bendStrength), round(state.pull), state.tensionBias, state.committed.length].join(':');
  }

  function publishEvidence() {
    const profile = profiles[state.selected];
    stage.dataset.qa = JSON.stringify({
      assert: window.__PREVIEW_RUNTIME_ASSERT__?.() ?? false,
      selected: state.selected,
      output: profile ? `${profile.name}/${profile.conclusion}` : null,
      source: state.source,
      profiles: profiles.map(item => ({ name: item.name, conclusion: item.conclusion, warp: item.warp, weft: item.weft, angle: item.angle, density: item.density, edgeX: item.edgeX, edgeY: item.edgeY })),
      initialFrameStatic: state.initialFrameStatic,
      automaticPlayback: state.automaticPlayback,
      previewClockMutationCount: state.previewClockMutationCount,
      bendStrength: round(state.bendStrength),
      trustedInputs: state.trustedInputs,
      rejectedInputs: state.rejectedInputs,
      humanMutationCount: state.humanMutationCount,
      hoverInputs: state.hoverInputs,
      dragInputs: state.dragInputs,
      keyboardInputs: state.keyboardInputs,
      touchInputs: state.touchInputs,
      penInputs: state.penInputs,
      mouseInputs: state.mouseInputs,
      rangeInputs: state.rangeInputs,
      materialInputs: state.materialInputs,
      actionInputs: state.actionInputs,
      pointerCaptureCount: state.pointerCaptureCount,
      pointerReleaseCount: state.pointerReleaseCount,
      committed: state.committed.length,
      historyLength: state.history.length,
      lastInput: state.lastInput,
      p5DrawCount: state.p5DrawCount,
      setupDrawCount: state.setupDrawCount,
      eventRedrawCount: state.eventRedrawCount,
      canvasCoverage: state.canvasCoverage,
      initialVisualChecksum: state.initialVisualChecksum,
      currentVisualChecksum: state.currentVisualChecksum
    });
  }

  function updateInterface() {
    const profile = profiles[state.selected];
    if (!profile) return;
    document.documentElement.style.setProperty('--accent', profile.accentCss);
    materialButtons.forEach((button, index) => button.dataset.selected = String(index === state.selected));
    outputStatus.textContent = state.committed.length ? `${state.committed.length} pick${state.committed.length === 1 ? '' : 's'} committed` : `${profile.conclusion.toLowerCase()} proof`;
    outputName.textContent = `${profile.name} / ${profile.conclusion}`;
    readings.warp.textContent = `Warp ${profile.warp}`;
    readings.weft.textContent = `Weft ${profile.weft}`;
    readings.angle.textContent = `Angle ${profile.angle}°`;
    readings.tension.textContent = `Tension ${Math.round((profile.tension * .68 + state.tensionBias / 100 * .32) * 100)}`;
    tensionOutput.value = String(state.tensionBias);
    tensionOutput.textContent = String(state.tensionBias);
  }

  function record(kind, detail = {}) {
    state.trustedInputs += 1;
    state.humanMutationCount += 1;
    state.lastInput = kind;
    state.history.push({ kind, selected: state.selected, u: round(state.shuttleU), v: round(state.shuttleV), ...detail });
    if (state.history.length > 40) state.history.shift();
    state.currentVisualChecksum = visualChecksum();
    updateInterface();
    if (sketch) {
      state.eventRedrawCount += 1;
      sketch.redraw();
    }
    publishEvidence();
  }

  function accept(event, kind) {
    if (!event.isTrusted) {
      state.rejectedInputs += 1;
      return false;
    }
    if (event.pointerType === 'touch') state.touchInputs += 1;
    else if (event.pointerType === 'pen') state.penInputs += 1;
    else if (event.pointerType === 'mouse') state.mouseInputs += 1;
    if (kind === 'keyboard') state.keyboardInputs += 1;
    return true;
  }

  function setShuttle(event, strength) {
    const point = containPoint(event, stage);
    const oldU = state.shuttleU;
    const oldV = state.shuttleV;
    state.shuttleU = point.u;
    state.shuttleV = point.v;
    state.selected = clamp(Math.floor(point.u * 4), 0, 3);
    state.bendStrength = Math.max(state.bendStrength, strength);
    state.pull = clamp(Math.hypot(point.u - oldU, point.v - oldV) * 5 + (state.dragging ? .24 : .08), 0, 1);
  }

  const isControlTarget = event => Boolean(event.target.closest('button, input'));

  stage.addEventListener('pointermove', event => {
    if (isControlTarget(event)) return;
    if (!accept(event, state.dragging ? 'drag' : 'hover')) return;
    setShuttle(event, state.dragging ? .9 : .48);
    if (state.dragging) state.dragInputs += 1;
    else state.hoverInputs += 1;
    record(state.dragging ? 'drag' : 'hover', { pointerType: event.pointerType });
  });

  stage.addEventListener('pointerdown', event => {
    if (isControlTarget(event)) return;
    if (!accept(event, 'pointerdown')) return;
    event.preventDefault();
    state.dragging = true;
    state.activePointerId = event.pointerId;
    setShuttle(event, .82);
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptureCount += 1;
    record('pointerdown', { pointerType: event.pointerType });
  });

  const endPointer = event => {
    if (!accept(event, 'pointerup')) return;
    if (state.activePointerId === event.pointerId && stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerReleaseCount += 1;
    }
    state.dragging = false;
    state.activePointerId = null;
    state.bendStrength = Math.max(.4, state.bendStrength * .72);
    record('pointerup', { pointerType: event.pointerType });
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);

  stage.addEventListener('keydown', event => {
    if (event.target !== stage) return;
    if (!accept(event, 'keyboard')) return;
    const delta = event.shiftKey ? .08 : .035;
    let handled = true;
    if (event.key === 'ArrowLeft') state.shuttleU = clamp(state.shuttleU - delta);
    else if (event.key === 'ArrowRight') state.shuttleU = clamp(state.shuttleU + delta);
    else if (event.key === 'ArrowUp') state.shuttleV = clamp(state.shuttleV - delta);
    else if (event.key === 'ArrowDown') state.shuttleV = clamp(state.shuttleV + delta);
    else if (/^[1-4]$/.test(event.key)) state.selected = Number(event.key) - 1;
    else if (event.key === '+' || event.key === '=') state.tensionBias = clamp(state.tensionBias + 4, 0, 100);
    else if (event.key === '-' || event.key === '_') state.tensionBias = clamp(state.tensionBias - 4, 0, 100);
    else if (event.key === 'Enter') state.committed.push({ selected: state.selected, profile: profiles[state.selected].name, u: round(state.shuttleU), v: round(state.shuttleV) });
    else if (event.key === 'Home') resetLoom();
    else if (event.key === 'Backspace' || event.key.toLowerCase() === 'u') state.committed.pop();
    else handled = false;
    if (!handled) return;
    event.preventDefault();
    state.bendStrength = Math.max(.5, state.bendStrength);
    record('keyboard', { key: event.key });
  });

  function resetLoom() {
    state.selected = 0;
    state.shuttleU = .58;
    state.shuttleV = .52;
    state.bendStrength = 0;
    state.pull = 0;
    state.tensionBias = 50;
    state.committed = [];
    tensionInput.value = '50';
  }

  materialButtons.forEach((button, index) => button.addEventListener('click', event => {
    if (!accept(event, 'material')) return;
    state.materialInputs += 1;
    state.selected = index;
    state.bendStrength = Math.max(.38, state.bendStrength);
    record('material', { index });
  }));

  tensionInput.addEventListener('input', event => {
    if (!accept(event, 'range')) return;
    state.rangeInputs += 1;
    state.tensionBias = Number(tensionInput.value);
    state.bendStrength = Math.max(.34, state.bendStrength);
    record('range', { value: state.tensionBias });
  });

  actionButtons.forEach(button => button.addEventListener('click', event => {
    if (!accept(event, 'action')) return;
    state.actionInputs += 1;
    const action = button.dataset.action;
    if (action === 'previous') state.selected = (state.selected + 3) % 4;
    if (action === 'next') state.selected = (state.selected + 1) % 4;
    if (action === 'commit') state.committed.push({ selected: state.selected, profile: profiles[state.selected].name, u: round(state.shuttleU), v: round(state.shuttleV) });
    if (action === 'undo') state.committed.pop();
    if (action === 'reset') resetLoom();
    if (action !== 'reset') state.bendStrength = Math.max(.34, state.bendStrength);
    record(`action:${action}`);
  }));

  function drawCover(p, image, alpha = 255) {
    const imageRatio = image.width / image.height;
    const canvasRatio = p.width / p.height;
    let sx = 0; let sy = 0; let sw = image.width; let sh = image.height;
    if (imageRatio > canvasRatio) {
      sw = image.height * canvasRatio;
      sx = (image.width - sw) / 2;
    } else {
      sh = image.width / canvasRatio;
      sy = (image.height - sh) / 2;
    }
    p.drawingContext.save();
    p.drawingContext.globalAlpha = alpha / 255;
    p.drawingContext.drawImage(image, sx, sy, sw, sh, 0, 0, p.width, p.height);
    p.drawingContext.restore();
  }

  function drawThread(p, vertical, position, index, profile, tension) {
    const start = vertical ? -10 : -10;
    const end = vertical ? p.height + 10 : p.width + 10;
    const focusX = state.shuttleU * p.width;
    const focusY = state.shuttleV * p.height;
    const spread = (vertical ? p.width : p.height) * (.17 + profile.friction * .08);
    p.beginShape();
    for (let cursor = start; cursor <= end; cursor += Math.max(4, (vertical ? p.height : p.width) / 34)) {
      const x = vertical ? position : cursor;
      const y = vertical ? cursor : position;
      const distance = Math.hypot((x - focusX) * .74, (y - focusY) * 1.1);
      const local = Math.exp(-(distance * distance) / (2 * spread * spread));
      const direction = ((index % 2) * 2 - 1);
      const bend = local * state.bendStrength * (vertical ? p.width : p.height) * .085 * direction * (1 - tension * .36);
      const pull = local * state.pull * (vertical ? p.width : p.height) * .035;
      p.vertex(vertical ? x + bend : x + pull, vertical ? y + pull : y + bend);
    }
    p.endShape();
  }

  const sourcePromise = (async () => {
    const response = await fetch(SOURCE_URL);
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    if (!response.ok) throw new Error(`Material source HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    const digest = await sha256(buffer);
    if (buffer.byteLength !== SOURCE_BYTES || digest !== SOURCE_SHA256) throw new Error('Material source identity mismatch');
    sourceBitmap = await createImageBitmap(new Blob([buffer], { type: 'image/jpeg' }));
    state.browserImageDecoded = sourceBitmap instanceof ImageBitmap;
    if (sourceBitmap.width !== SOURCE_WIDTH || sourceBitmap.height !== SOURCE_HEIGHT) throw new Error('Material source dimensions mismatch');
    sourceImage.src = URL.createObjectURL(new Blob([buffer], { type: 'image/jpeg' }));
    const context = evidenceCanvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(sourceBitmap, 0, 50, 960, 540, 0, 0, 96, 54);
    const pixels = context.getImageData(0, 0, 96, 54).data;
    profiles = deriveProfiles(pixels, 96, 54);
    const sampledDigest = await sha256(pixels.buffer);
    state.source = { url: SOURCE_URL.pathname, bytes: buffer.byteLength, width: sourceBitmap.width, height: sourceBitmap.height, sha256: digest, sampledSha256: sampledDigest };
    state.profiles = profiles.map(profile => ({ ...profile, base: [...profile.base], accent: [...profile.accent] }));
    sourceStatus.textContent = 'Pixel master verified · 4 live structures';
    updateInterface();
    publishEvidence();
  })();

  sourcePromise.then(() => {
    sketch = new p5(p => {
      p.setup = () => {
        p.pixelDensity(1);
        const canvas = p.createCanvas(stage.clientWidth, stage.clientHeight);
        canvas.parent(host);
        p.noLoop();
        requestAnimationFrame(() => p.redraw());
      };
      p.draw = () => {
        state.p5DrawCount += 1;
        if (!sourceBitmap?.width) return;
        const profile = profiles[state.selected];
        drawCover(p, sourceBitmap, 235);
        p.noStroke();
        p.fill(11, 10, 8, 112);
        p.rect(0, 0, p.width, p.height);
        const bias = state.tensionBias / 100;
        const tension = clamp(profile.tension * .68 + bias * .32);
        const warpCount = profile.warp;
        const weftCount = profile.weft;
        p.push();
        p.translate(p.width * .015, 0);
        p.rotate(profile.angle * Math.PI / 180 * .16);
        p.noFill();
        p.strokeCap(p.ROUND);
        for (let i = 0; i < warpCount; i += 1) {
          const mix = i / Math.max(1, warpCount - 1);
          const color = p.lerpColor(p.color(...profile.base, 215), p.color(...profile.accent, 238), (i % 4) / 4);
          p.stroke(color);
          p.strokeWeight(Math.max(1.4, p.width / warpCount * (.24 + tension * .14)));
          drawThread(p, true, mix * p.width, i, profile, tension);
        }
        for (let i = 0; i < weftCount; i += 1) {
          const mix = i / Math.max(1, weftCount - 1);
          const color = p.lerpColor(p.color(...profile.accent, 205), p.color(...profile.base, 232), (i % 3) / 3);
          p.stroke(color);
          p.strokeWeight(Math.max(1.2, p.height / weftCount * (.22 + profile.friction * .12)));
          if (i % 2) p.drawingContext.setLineDash([Math.max(3, p.width / warpCount * .56), Math.max(3, p.width / warpCount * .42)]);
          else p.drawingContext.setLineDash([]);
          drawThread(p, false, mix * p.height, i, profile, tension);
        }
        p.drawingContext.setLineDash([]);
        p.pop();
        if (state.bendStrength > 0) {
          const x = state.shuttleU * p.width;
          const y = state.shuttleV * p.height;
          p.noFill();
          p.stroke(...profile.accent, 220);
          p.strokeWeight(Math.max(1, p.width / 420));
          p.circle(x, y, Math.max(12, p.width * .055));
          p.line(x - p.width * .035, y, x + p.width * .035, y);
          p.line(x, y - p.height * .04, x, y + p.height * .04);
        }
        state.canvasCoverage = { width: p.width, height: p.height, stageWidth: stage.clientWidth, stageHeight: stage.clientHeight, ratio: round((p.width * p.height) / Math.max(1, stage.clientWidth * stage.clientHeight)) };
        state.currentVisualChecksum = visualChecksum();
        if (state.initialVisualChecksum === null) {
          state.initialVisualChecksum = state.currentVisualChecksum;
          state.initialStillVerified = state.trustedInputs === 0 && state.eventRedrawCount === 0;
          state.setupDrawCount += 1;
          resolveReady();
        }
        publishEvidence();
      };
      p.windowResized = () => {
        p.resizeCanvas(stage.clientWidth, stage.clientHeight);
        state.resizeRedrawCount += 1;
        p.redraw();
      };
    }, host);
  }).catch(markPreviewFailure);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    if (!sketch || !(sketch instanceof p5) || !sourceBitmap || profiles.length !== 4) return false;
    const warpCounts = new Set(profiles.map(profile => profile.warp));
    const weftCounts = new Set(profiles.map(profile => profile.weft));
    const conclusions = new Set(profiles.map(profile => profile.conclusion));
    const densities = profiles.map(profile => profile.density);
    const densityDelta = Math.max(...densities) - Math.min(...densities);
    const axisSpan = Math.max(...profiles.map(profile => profile.edgeY / profile.edgeX)) - Math.min(...profiles.map(profile => profile.edgeY / profile.edgeX));
    const initialInvariant = state.trustedInputs > 0 || (
      state.bendStrength === 0
      && state.committed.length === 0
      && state.initialVisualChecksum === state.currentVisualChecksum
      && state.eventRedrawCount === 0
    );
    const humanInvariant = state.trustedInputs === 0 || (
      state.humanMutationCount > 0
      && (state.currentVisualChecksum !== state.initialVisualChecksum || state.lastInput === 'action:reset')
      && state.history.length > 0
    );
    return state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticTimeline
      && !state.automaticRehearsal
      && !state.automaticFallback
      && state.previewClockMutationCount === 0
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetMimeType.includes('image/jpeg')
      && state.assetSameOrigin
      && state.browserImageDecoded
      && state.source.bytes === SOURCE_BYTES
      && state.source.width === SOURCE_WIDTH
      && state.source.height === SOURCE_HEIGHT
      && state.source.sha256 === SOURCE_SHA256
      && state.source.sampledSha256.length === 64
      && densityDelta > 3
      && axisSpan > .05
      && warpCounts.size >= 3
      && weftCounts.size >= 2
      && conclusions.size >= 3
      && state.canvasCoverage?.ratio > .98
      && initialInvariant
      && humanInvariant;
  };

  installPreviewController({
    id: 'pointer-woven-ribbon-loom',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => { state.previewClockIgnored += 1; },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
