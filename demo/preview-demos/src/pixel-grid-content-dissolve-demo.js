import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#dissolve-stage');
  const waveHost = document.querySelector('#pixel-wave-host');
  const trees = [document.querySelector('#tidal-tree'), document.querySelector('#dune-tree')];
  const imageElements = trees.map(tree => tree.querySelector('img'));
  const toggleButton = document.querySelector('#tree-toggle');
  const progressBar = document.querySelector('#dissolve-progress');
  const readout = document.querySelector('#dissolve-readout');
  const ledger = document.querySelector('#runtime-ledger');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const assets = [
    {
      id: 'tidal',
      url: new URL('../assets/aesthetic-wave-01/pixel-grid-content-dissolve/tidal-lab.jpg', import.meta.url).href
    },
    {
      id: 'dune',
      url: new URL('../assets/aesthetic-wave-01/pixel-grid-content-dissolve/dune-array.jpg', import.meta.url).href
    }
  ];

  assets.forEach((asset, index) => {
    imageElements[index].src = asset.url;
  });

  const clamp = value => Math.max(0, Math.min(1, value));
  const treeNames = ['Tidal lab', 'Dune array'];
  const treeIds = trees.map(tree => tree.dataset.treeId);
  const state = {
    id: 'pixel-grid-content-dissolve',
    task: 'human-operated-semantic-content-tree-replacement',
    automaticCycle: false,
    automaticPlayback: false,
    automaticFallback: false,
    captureClockDriven: false,
    syntheticInputDispatch: false,
    userRequestRequired: true,
    initialFrameStatic: true,
    renderIgnoresPreviewClock: true,
    fullStagePointerSurface: true,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'button-control'],
    semanticTreeCount: trees.length,
    semanticTreeIds: treeIds,
    semanticNodeCounts: trees.map(tree => tree.querySelectorAll('header, article, h1, p, dl, aside, footer, img').length),
    treeEvidence: trees.map(tree => ({
      id: tree.dataset.treeId,
      theme: tree.dataset.theme,
      layout: tree.dataset.layout,
      subject: tree.dataset.subject,
      heading: tree.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(),
      observationCount: tree.querySelectorAll('dl div').length
    })),
    initialTreeIndex: 0,
    currentTreeIndex: 0,
    activeTreeId: treeIds[0],
    sourceTreeIndex: 0,
    sourceTreeId: treeIds[0],
    targetTreeIndex: null,
    targetTreeId: null,
    transitionActive: false,
    phase: 'idle',
    waveProgress: 0,
    lastSettledWaveProgress: 0,
    transitionRequestCount: 0,
    completedSwapCount: 0,
    cancelledSwapCount: 0,
    completionBoundaryReachedCount: 0,
    interruptedAnimationCount: 0,
    inputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    pointerCaptured: false,
    buttonActivationCount: 0,
    keyboardInputCount: 0,
    rejectedUntrustedInputCount: 0,
    ignoredInputCount: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastRequestSource: 'initial',
    animationActive: false,
    animationGeneration: 0,
    inputOwnedAnimationCount: 0,
    inputOwnedAnimationFrameCount: 0,
    inputOwnedAnimationActive: false,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionAppliedCount: 0,
    gridColumns: 0,
    gridRows: 0,
    gridCellCount: 0,
    clipPolygonPointCount: 0,
    pixelBandCellCount: 0,
    pixelSampleCount: 0,
    p5DecodedAssetCount: 0,
    p5AssetFailureCount: 0,
    p5DrawCount: 0,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    assetEvidenceReady: false,
    assetEvidence: [],
    distinctAssetChecksumCount: 0,
    distinctPixelSampleCount: 0,
    resizeCount: 0,
    previewRenderCallCount: 0
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let p5Ready = false;
  const assetPixels = [];
  let animationFrame = 0;
  let resizeFrame = 0;
  let activePointer = null;
  let latestControlPointerKind = 'mouse';
  let resolveSketchReady;
  const sketchReady = new Promise(resolve => {
    resolveSketchReady = resolve;
  });

  function chooseGrid() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    if (width <= 180 || height <= 100) {
      state.gridColumns = 12;
      state.gridRows = 7;
    } else if (width <= 380 || height <= 220) {
      state.gridColumns = 18;
      state.gridRows = 10;
    } else {
      state.gridColumns = 28;
      state.gridRows = 16;
    }
    state.gridCellCount = state.gridColumns * state.gridRows;
  }

  function seeded(index, salt = 0) {
    const value = Math.sin((index + 1) * 127.1 + (salt + 1) * 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function boundaryUnits(row, progress) {
    const envelope = Math.sin(progress * Math.PI);
    const firstWave = Math.sin(row * 1.41 + progress * 5.4) * .72;
    const secondWave = Math.sin(row * .57 - progress * 3.1) * .38;
    return clamp((progress * state.gridColumns + (firstWave + secondWave) * envelope * 1.65) / state.gridColumns) * state.gridColumns;
  }

  function buildClipPath(progress) {
    const rows = state.gridRows;
    const columns = state.gridColumns;
    const quantizedBoundary = row => {
      const halfCellUnits = Math.round(boundaryUnits(row, progress) * 2) / 2;
      return Number((halfCellUnits / columns * 100).toFixed(4));
    };
    const points = ['0% 0%'];
    let boundary = quantizedBoundary(0);
    points.push(`${boundary}% 0%`);
    for (let row = 0; row < rows; row += 1) {
      const bottom = Number(((row + 1) / rows * 100).toFixed(4));
      points.push(`${boundary}% ${bottom}%`);
      if (row < rows - 1) {
        boundary = quantizedBoundary(row + 1);
        points.push(`${boundary}% ${bottom}%`);
      }
    }
    points.push('0% 100%');
    state.clipPolygonPointCount = points.length;
    return `polygon(${points.join(', ')})`;
  }

  function setSemanticExposure() {
    const exposedIndex = state.transitionActive ? state.targetTreeIndex : state.currentTreeIndex;
    trees.forEach((tree, index) => {
      const exposed = index === exposedIndex;
      tree.setAttribute('aria-hidden', String(!exposed));
      tree.inert = !exposed;
    });
  }

  function syncLayers() {
    if (state.transitionActive) {
      trees[state.sourceTreeIndex].style.zIndex = '2';
      trees[state.sourceTreeIndex].style.clipPath = 'inset(0)';
      trees[state.targetTreeIndex].style.zIndex = '3';
      trees[state.targetTreeIndex].style.clipPath = buildClipPath(state.waveProgress);
    } else {
      trees.forEach((tree, index) => {
        tree.style.zIndex = index === state.currentTreeIndex ? '2' : '1';
        tree.style.clipPath = 'inset(0)';
      });
    }
  }

  function syncInterface() {
    const currentName = treeNames[state.currentTreeIndex];
    const targetName = state.targetTreeIndex === null ? null : treeNames[state.targetTreeIndex];
    stage.dataset.activeTree = state.activeTreeId;
    stage.dataset.phase = state.phase;
    stage.dataset.progress = state.waveProgress.toFixed(4);
    stage.dataset.targetTree = state.targetTreeId ?? 'none';
    stage.dataset.completedSwaps = String(state.completedSwapCount);
    stage.dataset.lastSource = state.lastRequestSource;
    progressBar.style.transform = `scaleX(${state.transitionActive ? state.waveProgress : 0})`;
    toggleButton.textContent = state.transitionActive ? 'Keep this field' : state.currentTreeIndex === 0 ? 'Dune array' : 'Tidal lab';
    toggleButton.setAttribute('aria-label', state.transitionActive
      ? `Cancel the switch and keep the ${currentName} dispatch`
      : `Open the ${treeNames[1 - state.currentTreeIndex]} dispatch`);
    readout.textContent = state.transitionActive
      ? `${currentName} → ${targetName} · ${Math.round(state.waveProgress * 100)}%`
      : `${currentName} · ready`;
    ledger.value = JSON.stringify({
      activeTreeId: state.activeTreeId,
      targetTreeId: state.targetTreeId,
      phase: state.phase,
      waveProgress: state.waveProgress,
      grid: `${state.gridColumns}x${state.gridRows}`,
      completedSwapCount: state.completedSwapCount,
      inputCount: state.inputCount,
      lastInputKind: state.lastInputKind,
      lastInputTrusted: state.lastInputTrusted,
      pointerDownCount: state.pointerDownCount,
      pointerMoveCount: state.pointerMoveCount,
      pointerReleaseCount: state.pointerReleaseCount,
      pointerCaptureCount: state.pointerCaptureCount,
      pointerReleaseCaptureCount: state.pointerReleaseCaptureCount,
      buttonActivationCount: state.buttonActivationCount,
      keyboardInputCount: state.keyboardInputCount,
      rejectedUntrustedInputCount: state.rejectedUntrustedInputCount,
      p5DrawCount: state.p5DrawCount,
      p5DecodedAssetCount: state.p5DecodedAssetCount,
      distinctAssetChecksumCount: state.distinctAssetChecksumCount,
      distinctPixelSampleCount: state.distinctPixelSampleCount,
      runtimeAssert: stage.dataset.runtimeAssert === 'true'
    });
  }

  function drawWave() {
    if (p5Ready) sketch.redraw();
  }

  function applyProgress(value) {
    state.waveProgress = Number(clamp(value).toFixed(5));
    if (state.transitionActive) trees[state.targetTreeIndex].style.clipPath = buildClipPath(state.waveProgress);
    syncInterface();
    drawWave();
  }

  function cancelAnimation() {
    if (!state.animationActive) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    state.animationGeneration += 1;
    state.animationActive = false;
    state.inputOwnedAnimationActive = false;
    state.interruptedAnimationCount += 1;
  }

  function prepareTransition(targetIndex, source) {
    if (targetIndex === state.currentTreeIndex) return false;
    cancelAnimation();
    state.sourceTreeIndex = state.currentTreeIndex;
    state.sourceTreeId = treeIds[state.sourceTreeIndex];
    state.targetTreeIndex = targetIndex;
    state.targetTreeId = treeIds[targetIndex];
    state.transitionActive = true;
    state.transitionRequestCount += 1;
    state.phase = 'prepared';
    state.lastRequestSource = source;
    state.waveProgress = 0;
    setSemanticExposure();
    syncLayers();
    syncInterface();
    drawWave();
    return true;
  }

  function finishSwap() {
    if (!state.transitionActive) return;
    state.completionBoundaryReachedCount += 1;
    state.lastSettledWaveProgress = 1;
    state.currentTreeIndex = state.targetTreeIndex;
    state.activeTreeId = treeIds[state.currentTreeIndex];
    state.sourceTreeIndex = state.currentTreeIndex;
    state.sourceTreeId = state.activeTreeId;
    state.targetTreeIndex = null;
    state.targetTreeId = null;
    state.transitionActive = false;
    state.waveProgress = 0;
    state.phase = 'settled';
    state.completedSwapCount += 1;
    state.animationActive = false;
    state.inputOwnedAnimationActive = false;
    setSemanticExposure();
    syncLayers();
    syncInterface();
    drawWave();
  }

  function cancelSwap() {
    if (!state.transitionActive) return;
    state.lastSettledWaveProgress = 0;
    state.targetTreeIndex = null;
    state.targetTreeId = null;
    state.transitionActive = false;
    state.waveProgress = 0;
    state.phase = 'settled';
    state.cancelledSwapCount += 1;
    state.animationActive = false;
    state.inputOwnedAnimationActive = false;
    setSemanticExposure();
    syncLayers();
    syncInterface();
    drawWave();
  }

  function settleImmediately(destination) {
    applyProgress(destination);
    if (destination === 1) finishSwap();
    else cancelSwap();
  }

  function animateProgress(destination, source) {
    if (!state.transitionActive) return;
    cancelAnimation();
    state.lastRequestSource = source;
    if (reducedMotionQuery.matches) {
      state.reducedMotionAppliedCount += 1;
      settleImmediately(destination);
      return;
    }
    const from = state.waveProgress;
    const distance = Math.abs(destination - from);
    if (distance < .0001) {
      settleImmediately(destination);
      return;
    }
    const generation = state.animationGeneration + 1;
    state.animationGeneration = generation;
    state.animationActive = true;
    state.inputOwnedAnimationActive = true;
    state.inputOwnedAnimationCount += 1;
    state.phase = destination === 1 ? 'settling-to-target' : 'settling-to-source';
    const duration = Math.max(180, 680 * distance);
    const startedAt = performance.now();
    const ease = value => value < .5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;
    const frame = now => {
      if (generation !== state.animationGeneration || !state.animationActive) return;
      const elapsed = clamp((now - startedAt) / duration);
      state.inputOwnedAnimationFrameCount += 1;
      applyProgress(from + (destination - from) * ease(elapsed));
      if (elapsed < 1) {
        animationFrame = requestAnimationFrame(frame);
      } else if (destination === 1) {
        finishSwap();
      } else {
        cancelSwap();
      }
    };
    animationFrame = requestAnimationFrame(frame);
    syncInterface();
  }

  function recordTrustedInput(event, kind, source) {
    if (!event.isTrusted) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    state.inputCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = true;
    state.lastRequestSource = source;
    return true;
  }

  function requestToggle(source) {
    if (state.transitionActive) {
      animateProgress(0, source);
      return;
    }
    if (prepareTransition(1 - state.currentTreeIndex, source)) animateProgress(1, source);
  }

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('[data-control]')) return;
    const pointerKind = event.pointerType || 'mouse';
    if (!recordTrustedInput(event, pointerKind, 'full-stage-pointer-drag')) return;
    event.preventDefault();
    state.pointerDownCount += 1;
    cancelAnimation();
    if (!state.transitionActive) prepareTransition(1 - state.currentTreeIndex, 'full-stage-pointer-drag');
    activePointer = {
      id: event.pointerId,
      startX: event.clientX,
      startProgress: state.waveProgress,
      direction: state.currentTreeIndex === 0 ? 1 : -1
    };
    state.phase = 'dragging';
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    syncInterface();
  });

  stage.addEventListener('pointermove', event => {
    if (!activePointer || event.pointerId !== activePointer.id || !event.isTrusted) return;
    event.preventDefault();
    state.pointerMoveCount += 1;
    const travel = Math.max(60, stage.clientWidth * .68);
    const delta = (event.clientX - activePointer.startX) * activePointer.direction / travel;
    applyProgress(activePointer.startProgress + delta);
  });

  function finishPointer(event, cancelled = false) {
    if (!activePointer || event.pointerId !== activePointer.id) return;
    event.preventDefault();
    state.pointerReleaseCount += 1;
    const pointerId = activePointer.id;
    activePointer = null;
    if (stage.hasPointerCapture(pointerId)) {
      stage.releasePointerCapture(pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.pointerCaptured = false;
    animateProgress(cancelled ? 0 : state.waveProgress >= .34 ? 1 : 0, cancelled ? 'pointer-cancel' : 'pointer-release');
  }

  stage.addEventListener('pointerup', event => finishPointer(event));
  stage.addEventListener('pointercancel', event => finishPointer(event, true));
  stage.addEventListener('lostpointercapture', event => {
    if (activePointer && event.pointerId === activePointer.id) finishPointer(event);
  });

  toggleButton.addEventListener('pointerdown', event => {
    if (event.isTrusted) latestControlPointerKind = event.pointerType || 'mouse';
  });

  toggleButton.addEventListener('click', event => {
    const kind = event.detail === 0 ? 'keyboard-control' : `${latestControlPointerKind}-control`;
    if (!recordTrustedInput(event, kind, 'tree-toggle-button')) return;
    state.buttonActivationCount += 1;
    requestToggle('tree-toggle-button');
  });

  stage.addEventListener('keydown', event => {
    if (event.target === toggleButton || event.repeat) return;
    const supported = ['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!supported.includes(event.key)) return;
    if (!recordTrustedInput(event, 'keyboard', `keyboard-${event.key === ' ' ? 'Space' : event.key}`)) return;
    event.preventDefault();
    state.keyboardInputCount += 1;

    if (['Enter', ' '].includes(event.key)) {
      requestToggle(`keyboard-${event.key === ' ' ? 'Space' : event.key}`);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      const requestedIndex = event.key === 'Home' ? 0 : 1;
      if (requestedIndex === state.currentTreeIndex) {
        if (state.transitionActive) animateProgress(0, `keyboard-${event.key}`);
        else state.ignoredInputCount += 1;
      } else {
        if (!state.transitionActive) prepareTransition(requestedIndex, `keyboard-${event.key}`);
        animateProgress(1, `keyboard-${event.key}`);
      }
      return;
    }

    const forwardKey = state.currentTreeIndex === 0 ? 'ArrowRight' : 'ArrowLeft';
    if (!state.transitionActive && event.key !== forwardKey) {
      state.ignoredInputCount += 1;
      syncInterface();
      return;
    }
    if (!state.transitionActive) prepareTransition(1 - state.currentTreeIndex, `keyboard-${event.key}`);
    const delta = event.key === forwardKey ? .12 : -.12;
    applyProgress(state.waveProgress + delta);
    state.phase = 'keyboard-scrub';
    if (state.waveProgress >= 1) finishSwap();
    else if (state.waveProgress <= 0) cancelSwap();
    else syncInterface();
  });

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.animationActive) {
      const destination = state.phase === 'settling-to-target' ? 1 : 0;
      cancelAnimation();
      state.reducedMotionAppliedCount += 1;
      settleImmediately(destination);
    }
    syncInterface();
  });

  function buildPixelSource(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      width: canvas.width,
      height: canvas.height,
      pixels: context.getImageData(0, 0, canvas.width, canvas.height).data
    };
  }

  function imageSampleChecksum(pixelSource) {
    const horizontalStep = Math.max(1, Math.floor(pixelSource.width / 24));
    const verticalStep = Math.max(1, Math.floor(pixelSource.height / 16));
    let hash = 2166136261;
    for (let y = 0; y < pixelSource.height; y += verticalStep) {
      for (let x = 0; x < pixelSource.width; x += horizontalStep) {
        const offset = (y * pixelSource.width + x) * 4;
        for (let channel = 0; channel < 4; channel += 1) {
          hash ^= pixelSource.pixels[offset + channel];
          hash = Math.imul(hash, 16777619);
        }
      }
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  async function sha256(buffer) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  const assetEvidenceReady = Promise.all(assets.map(async (asset, index) => {
    const image = imageElements[index];
    await image.decode();
    const pixelSource = buildPixelSource(image);
    assetPixels[index] = pixelSource;
    const response = await fetch(asset.url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Asset request failed for ${asset.id}: ${response.status}`);
    const bytes = await response.arrayBuffer();
    return {
      id: asset.id,
      source: new URL(asset.url).pathname,
      width: image.naturalWidth,
      height: image.naturalHeight,
      byteLength: bytes.byteLength,
      sha256: await sha256(bytes),
      pixelSampleChecksum: imageSampleChecksum(pixelSource)
    };
  })).then(evidence => {
    state.assetEvidence = evidence;
    state.assetEvidenceReady = true;
    state.distinctAssetChecksumCount = new Set(evidence.map(item => item.sha256)).size;
    state.distinctPixelSampleCount = new Set(evidence.map(item => item.pixelSampleChecksum)).size;
    state.p5DecodedAssetCount = assetPixels.length;
    syncInterface();
    return evidence;
  });

  function sampleImage(pixelSource, displayX, displayY, displayWidth, displayHeight) {
    if (!pixelSource?.pixels?.length || !pixelSource.width || !pixelSource.height) return [240, 240, 232];
    const scale = Math.max(displayWidth / pixelSource.width, displayHeight / pixelSource.height);
    const visibleWidth = displayWidth / scale;
    const visibleHeight = displayHeight / scale;
    const cropX = (pixelSource.width - visibleWidth) * .5;
    const cropY = (pixelSource.height - visibleHeight) * .5;
    const sourceX = Math.max(0, Math.min(pixelSource.width - 1, Math.floor(cropX + displayX / displayWidth * visibleWidth)));
    const sourceY = Math.max(0, Math.min(pixelSource.height - 1, Math.floor(cropY + displayY / displayHeight * visibleHeight)));
    const offset = (sourceY * pixelSource.width + sourceX) * 4;
    return [pixelSource.pixels[offset], pixelSource.pixels[offset + 1], pixelSource.pixels[offset + 2]];
  }

  chooseGrid();
  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(stage.clientWidth, stage.clientHeight).parent(waveHost);
      p.noLoop();
      p.noStroke();
      p5Ready = true;
      state.p5CanvasWidth = p.width;
      state.p5CanvasHeight = p.height;
      resolveSketchReady();
    };

    p.draw = () => {
      state.p5DrawCount += 1;
      state.pixelBandCellCount = 0;
      p.clear();
      if (!state.transitionActive || state.waveProgress <= 0 || state.waveProgress >= 1) return;
      const columns = state.gridColumns;
      const rows = state.gridRows;
      const cellWidth = p.width / columns;
      const cellHeight = p.height / rows;
      const sourceImage = assetPixels[state.sourceTreeIndex];
      const targetImage = assetPixels[state.targetTreeIndex];
      for (let row = 0; row < rows; row += 1) {
        const boundary = boundaryUnits(row, state.waveProgress);
        for (let column = 0; column < columns; column += 1) {
          const index = row * columns + column;
          const jitter = seeded(index, 7) * .8 - .4;
          const distance = column + .5 + jitter - boundary;
          if (Math.abs(distance) > 2.15) continue;
          const centerX = (column + .5) * cellWidth;
          const centerY = (row + .5) * cellHeight;
          const sourceColor = sampleImage(sourceImage, centerX, centerY, p.width, p.height);
          const targetColor = sampleImage(targetImage, centerX, centerY, p.width, p.height);
          const blend = clamp(.5 - distance / 4.3);
          const light = seeded(index, 19) > .9 ? 26 : 0;
          const red = sourceColor[0] + (targetColor[0] - sourceColor[0]) * blend + light;
          const green = sourceColor[1] + (targetColor[1] - sourceColor[1]) * blend + light;
          const blue = sourceColor[2] + (targetColor[2] - sourceColor[2]) * blend + light;
          const alpha = 118 + (1 - Math.abs(distance) / 2.15) * 112;
          const inset = seeded(index, 29) > .78 ? Math.min(cellWidth, cellHeight) * .14 : 0;
          p.fill(red, green, blue, alpha);
          p.rect(column * cellWidth + inset, row * cellHeight + inset, cellWidth - inset * 2 + .65, cellHeight - inset * 2 + .65);
          state.pixelBandCellCount += 1;
          state.pixelSampleCount += 2;
          if (seeded(index, 41) > .94) {
            p.fill(244, 241, 228, 220);
            p.rect(centerX - cellWidth * .11, centerY - cellHeight * .11, cellWidth * .22, cellHeight * .22);
          }
        }
      }
    };
  }, waveHost);

  addEventListener('resize', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      chooseGrid();
      sketch.resizeCanvas(stage.clientWidth, stage.clientHeight, false);
      state.p5CanvasWidth = sketch.width;
      state.p5CanvasHeight = sketch.height;
      state.resizeCount += 1;
      if (state.transitionActive) trees[state.targetTreeIndex].style.clipPath = buildClipPath(state.waveProgress);
      drawWave();
      syncInterface();
    });
  });

  addEventListener('beforeunload', () => {
    cancelAnimation();
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    sketch.remove();
  }, { once: true });

  setSemanticExposure();
  syncLayers();
  syncInterface();

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const semanticEvidence = trees.length === 2
      && state.semanticNodeCounts.every(count => count >= 8)
      && state.treeEvidence.every(tree => tree.id && tree.theme && tree.layout && tree.subject && tree.heading && tree.observationCount === 3)
      && state.treeEvidence[0].heading !== state.treeEvidence[1].heading
      && state.treeEvidence[0].theme !== state.treeEvidence[1].theme
      && state.treeEvidence[0].layout !== state.treeEvidence[1].layout
      && trees.every(tree => tree instanceof HTMLElement
        && tree.querySelector('header')
        && tree.querySelector('article > h1')
        && tree.querySelector('article > p')
        && tree.querySelector('article > dl')
        && tree.querySelector('aside')
        && tree.querySelector('footer')
        && tree.querySelector('img'));
    const assetEvidence = state.assetEvidenceReady
      && state.assetEvidence.length === 2
      && state.assetEvidence.every(asset => asset.width === 960
        && asset.height === 640
        && asset.byteLength > 20000
        && /^[a-f0-9]{64}$/.test(asset.sha256)
        && /^[a-f0-9]{8}$/.test(asset.pixelSampleChecksum))
      && state.distinctAssetChecksumCount === 2
      && state.distinctPixelSampleCount === 2
      && imageElements.every(image => image.complete && image.naturalWidth === 960 && image.naturalHeight === 640)
      && state.p5DecodedAssetCount === 2
      && state.p5AssetFailureCount === 0;
    const exposedTreeIndex = state.transitionActive ? state.targetTreeIndex : state.currentTreeIndex;
    const exposureEvidence = trees.every((tree, index) => tree.getAttribute('aria-hidden') === String(index !== exposedTreeIndex)
      && tree.inert === (index !== exposedTreeIndex));
    const transitionEvidence = !state.transitionActive
      ? state.targetTreeIndex === null
        && state.targetTreeId === null
        && state.waveProgress === 0
        && trees[state.currentTreeIndex].style.zIndex === '2'
      : state.targetTreeIndex !== null
        && state.targetTreeId === treeIds[state.targetTreeIndex]
        && trees[state.targetTreeIndex].style.zIndex === '3'
        && trees[state.targetTreeIndex].style.clipPath.startsWith('polygon(')
        && state.clipPolygonPointCount === state.gridRows * 2 + 3
        && (!state.animationActive || state.inputOwnedAnimationActive);
    const initialEvidence = state.inputCount > 0 || (
      state.currentTreeIndex === state.initialTreeIndex
      && state.activeTreeId === treeIds[0]
      && state.transitionActive === false
      && state.completedSwapCount === 0
      && state.waveProgress === 0
      && state.phase === 'idle'
      && state.lastInputKind === 'none'
      && state.lastInputTrusted === null
    );
    return sketch instanceof p5
      && p5Ready
      && waveHost.querySelector('canvas')?.getContext('2d')
      && state.p5DrawCount > 0
      && state.p5CanvasWidth === stage.clientWidth
      && state.p5CanvasHeight === stage.clientHeight
      && state.gridColumns * state.gridRows === state.gridCellCount
      && state.gridCellCount >= 84
      && semanticEvidence
      && assetEvidence
      && exposureEvidence
      && transitionEvidence
      && initialEvidence
      && stage.dataset.previewMechanism === 'p5-semantic-content-tree-pixel-wave'
      && stage.getAttribute('role') === 'group'
      && stage.tabIndex === 0
      && getComputedStyle(stage).touchAction === 'none'
      && typeof stage.setPointerCapture === 'function'
      && toggleButton instanceof HTMLButtonElement
      && toggleButton.type === 'button'
      && state.semanticTreeCount === 2
      && state.currentTreeIndex >= 0
      && state.currentTreeIndex < 2
      && state.inputCount === state.pointerDownCount + state.buttonActivationCount + state.keyboardInputCount
      && state.pointerReleaseCaptureCount <= state.pointerCaptureCount
      && state.automaticCycle === false
      && state.automaticPlayback === false
      && state.automaticFallback === false
      && state.captureClockDriven === false
      && state.syntheticInputDispatch === false
      && state.userRequestRequired === true
      && state.initialFrameStatic === true
      && state.renderIgnoresPreviewClock === true
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && window.__PREVIEW_META__?.capture === 'real-demo';
  };

  installPreviewController({
    id: 'pixel-grid-content-dissolve',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {
      state.previewRenderCallCount += 1;
      if (!stage.dataset.runtimeAssert && typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
        stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__());
        syncInterface();
      }
    },
    ready: Promise.all([sketchReady, document.fonts.ready, assetEvidenceReady])
  });
} catch (error) {
  markPreviewFailure(error);
}
