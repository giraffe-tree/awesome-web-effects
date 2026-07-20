import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#observatory-stage');
  const shell = document.querySelector('#observatory-shell');
  const viewport = document.querySelector('#sky-viewport');
  const container = document.querySelector('#starfield-stage');
  const chapterIndex = document.querySelector('#chapter-index');
  const chapterTitle = document.querySelector('#chapter-title');
  const chapterTask = document.querySelector('#chapter-task');
  const targetLabel = document.querySelector('#target-label');
  const progressTitle = document.querySelector('#progress-title');
  const depthValue = document.querySelector('#depth-value');
  const chapterRail = document.querySelector('#chapter-rail');
  const farDepth = document.querySelector('#far-depth');
  const midDepth = document.querySelector('#mid-depth');
  const nearDepth = document.querySelector('#near-depth');
  const chapterButtons = [...document.querySelectorAll('.chapter-button')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const chapterPositions = [0, 1 / 3, 2 / 3, 1];
  const chapters = [
    {
      id: 'horizon-lock',
      title: 'Set the horizon',
      short: 'Horizon lock',
      task: 'Align Polaris above the north notch before separating the stellar planes.',
      target: 'Polaris reference',
    },
    {
      id: 'milky-way-veil',
      title: 'Clear the veil',
      short: 'Milky Way veil',
      task: 'Move through the far field until the Milky Way haze separates from the guide stars.',
      target: 'Cygnus corridor',
    },
    {
      id: 'double-cluster',
      title: 'Resolve the pair',
      short: 'Double Cluster',
      task: 'Hold the paired cluster inside the reticle while the middle layer crosses the field.',
      target: 'NGC 869 / 884',
    },
    {
      id: 'near-pass',
      title: 'Log the near pass',
      short: 'Near-layer pass',
      task: 'Use the near-layer streaks to distinguish a satellite pass from the fixed sky.',
      target: 'Pass vector 04',
    },
  ];
  const layerDefinitions = [
    { id: 'far', count: 54, speed: .17, radius: .78, alpha: 58, hue: [188, 220] },
    { id: 'mid', count: 34, speed: .48, radius: 1.2, alpha: 76, hue: [200, 255] },
    { id: 'near', count: 20, speed: 1, radius: 1.82, alpha: 92, hue: [12, 36] },
  ];
  const layers = layerDefinitions.map((definition, layerIndex) => ({
    ...definition,
    stars: Array.from({ length: definition.count }, (_, starIndex) => {
      const seedValue = starIndex + layerIndex * 83 + 1;
      return {
        x: ((seedValue * 73) % 997) / 997,
        y: ((seedValue * seedValue * 31 + 17) % 991) / 991,
        brightness: .62 + ((seedValue * 47) % 101) / 101 * .38,
        tint: ((seedValue * 29) % 97) / 97,
      };
    }),
  }));

  const state = {
    id: 'scroll-linked-multilayer-starfield',
    automaticProgress: false,
    previewClockDriven: false,
    automaticFallback: false,
    syntheticInput: false,
    userInitiatedChangesOnly: true,
    progress: 0,
    chapterIndex: 0,
    chapterId: chapters[0].id,
    inputKind: 'none',
    inputCount: 0,
    wheelInputCount: 0,
    wheelPreventCount: 0,
    boundaryReleaseCount: 0,
    pointerInputCount: 0,
    pointerDragCount: 0,
    pointerMoveCount: 0,
    keyboardInputCount: 0,
    keyboardAdjustCount: 0,
    chapterClickCount: 0,
    progressChangeCount: 0,
    reducedMotionDirectCount: 0,
    redrawRequestCount: 0,
    drawCount: 0,
    resizeCount: 0,
    renderCount: 0,
    dragActive: false,
    lastWheelPrevented: false,
    lastTrustedEvent: 'none',
    reducedMotion: reducedMotionQuery.matches,
    layerOffsets: { far: 0, mid: 0, near: 0 },
    layersSeparatedValidated: true,
    canvasSizeValidated: false,
    progressValidated: false,
    initialStaticVerified: false,
    lastDrawProgress: null,
    lastDrawOffsets: null,
    starChecksum: 0,
    seedSignature: layers.map(layer => `${layer.id}:${layer.stars.length}`).join('|'),
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let activePointerId = null;
  let dragStartY = 0;
  let dragStartProgress = 0;
  let latestPointerKind = 'mouse';
  let resolveFirstDraw;
  const firstDrawReady = new Promise(resolve => { resolveFirstDraw = resolve; });

  const clampValue = value => Math.min(1, Math.max(0, Number(value) || 0));
  const positiveModulo = value => ((value % 1) + 1) % 1;

  function closestChapterIndex(progress) {
    return chapterPositions.reduce((closest, position, index) => (
      Math.abs(position - progress) < Math.abs(chapterPositions[closest] - progress) ? index : closest
    ), 0);
  }

  function recordInput(kind, event, label) {
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return false;
    }
    state.inputKind = kind;
    state.lastTrustedEvent = label;
    state.inputCount += 1;
    if (kind === 'wheel') state.wheelInputCount += 1;
    else if (kind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
    return true;
  }

  function updateInterface() {
    const activeIndex = closestChapterIndex(state.progress);
    const chapter = chapters[activeIndex];
    const offsets = {
      far: state.progress * layers[0].speed,
      mid: state.progress * layers[1].speed,
      near: state.progress * layers[2].speed,
    };
    state.chapterIndex = activeIndex;
    state.chapterId = chapter.id;
    state.layerOffsets = offsets;
    state.layersSeparatedValidated = state.progress === 0
      ? offsets.far === 0 && offsets.mid === 0 && offsets.near === 0
      : offsets.far < offsets.mid && offsets.mid < offsets.near;
    chapterIndex.textContent = `${String(activeIndex + 1).padStart(2, '0')} / 04`;
    chapterTitle.textContent = chapter.title;
    chapterTask.textContent = chapter.task;
    targetLabel.textContent = chapter.target;
    targetLabel.style.left = `${68 - state.progress * 12}%`;
    targetLabel.style.top = `${30 + state.progress * 9}%`;
    progressTitle.textContent = `${String(activeIndex + 1).padStart(2, '0')} · ${chapter.short}`;
    depthValue.textContent = `Depth ${String(Math.round(state.progress * 100)).padStart(3, '0')}%`;
    chapterRail.style.setProperty('--progress', state.progress.toFixed(4));
    farDepth.style.setProperty('--layer-progress', offsets.far.toFixed(4));
    midDepth.style.setProperty('--layer-progress', offsets.mid.toFixed(4));
    nearDepth.style.setProperty('--layer-progress', offsets.near.toFixed(4));
    chapterButtons.forEach((button, index) => {
      button.setAttribute('aria-current', index === activeIndex ? 'step' : 'false');
    });
  }

  function requestRedraw(reason) {
    state.redrawRequestCount += 1;
    state.lastRedrawReason = reason;
    sketch?.redraw();
  }

  function setProgress(value, source, countChange = true) {
    const nextProgress = clampValue(value);
    const changed = Math.abs(nextProgress - state.progress) > .00001;
    state.progress = nextProgress;
    if (changed && countChange) state.progressChangeCount += 1;
    state.lastProgressSource = source;
    updateInterface();
    requestRedraw(source);
    return changed;
  }

  function reducedChapterProgress(direction, absolute = null) {
    if (absolute !== null) return chapterPositions[absolute];
    const currentIndex = closestChapterIndex(state.progress);
    return chapterPositions[Math.min(chapterPositions.length - 1, Math.max(0, currentIndex + direction))];
  }

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      const renderer = p.createCanvas(
        Math.max(1, Math.round(viewport.clientWidth)),
        Math.max(1, Math.round(viewport.clientHeight)),
      );
      renderer.parent(container);
      renderer.elt.tabIndex = 0;
      renderer.elt.setAttribute('role', 'application');
      renderer.elt.setAttribute('aria-label', 'Night-sky observation field. Wheel, drag upward, or use Arrow and Page keys to separate the far, middle, and near star layers.');
      p.colorMode(p.HSB, 360, 100, 100, 100);
      p.noLoop();
      p.strokeCap(p.ROUND);
      requestAnimationFrame(() => p.redraw());
    };

    p.draw = () => {
      state.drawCount += 1;
      const canvasWidth = p.width;
      const canvasHeight = p.height;
      const progress = state.progress;
      const scaleFactor = Math.max(.42, Math.min(1, canvasHeight / 260));
      let checksum = 0;

      p.background(218, 72, 5);
      p.noStroke();
      for (let hazeIndex = 7; hazeIndex > 0; hazeIndex -= 1) {
        p.fill(216 + hazeIndex * 3, 58, 21, 2 + hazeIndex * .22);
        p.ellipse(
          canvasWidth * (.72 - progress * .09),
          canvasHeight * (.44 + progress * .05),
          hazeIndex * 38 * scaleFactor,
          hazeIndex * 24 * scaleFactor,
        );
      }

      layers.forEach((layer, layerIndexValue) => {
        const layerOffset = progress * layer.speed;
        layer.stars.forEach((star, starIndex) => {
          const unitX = positiveModulo(star.x - layerOffset * (.24 + layerIndexValue * .08) + Math.sin(star.y * 8.4) * .005);
          const unitY = positiveModulo(star.y + layerOffset * (.028 + layerIndexValue * .026));
          const starX = unitX * canvasWidth;
          const starY = unitY * canvasHeight;
          const starHue = layer.hue[0] + (layer.hue[1] - layer.hue[0]) * star.tint;
          const streakLength = state.reducedMotion
            ? 0
            : progress * (layerIndexValue === 2 ? 12 : layerIndexValue === 1 ? 4 : 1.2) * scaleFactor;
          p.stroke(starHue, 28 + layerIndexValue * 12, 100, layer.alpha * star.brightness);
          p.strokeWeight(layer.radius * scaleFactor);
          p.line(starX - streakLength, starY, starX + layer.radius * scaleFactor, starY);
          if (starIndex % 11 === 0) {
            p.noFill();
            p.stroke(starHue, 36, 100, 12 + progress * 13);
            p.circle(starX, starY, (5 + layerIndexValue * 3 + progress * 4) * scaleFactor);
          }
          if (starIndex % 9 === 0) checksum += (starX + 1) * .017 + (starY + 1) * .013 + layerIndexValue;
        });
      });

      const targetX = canvasWidth * (.68 - progress * .12);
      const targetY = canvasHeight * (.36 + progress * .08);
      p.noFill();
      p.stroke(12, 66, 100, 62);
      p.strokeWeight(.9 * scaleFactor);
      p.circle(targetX, targetY, (24 + progress * 15) * scaleFactor);
      p.arc(targetX, targetY, (35 + progress * 19) * scaleFactor, (35 + progress * 19) * scaleFactor, -.7, 1.18);
      p.stroke(190, 42, 92, 30);
      p.line(canvasWidth * .05, canvasHeight * .88, canvasWidth * .95, canvasHeight * .88);
      p.line(canvasWidth * .5, canvasHeight * .84, canvasWidth * .5, canvasHeight * .92);

      state.starChecksum = Number(checksum.toFixed(3));
      state.lastDrawProgress = progress;
      state.lastDrawOffsets = { ...state.layerOffsets };
      if (state.drawCount === 1) resolveFirstDraw();
    };
  }, container);

  viewport.addEventListener('wheel', event => {
    if (!recordInput('wheel', event, 'depth-wheel')) return;
    const direction = Math.sign(event.deltaY);
    const outward = (state.progress <= .00001 && direction < 0)
      || (state.progress >= .99999 && direction > 0);
    if (outward) {
      state.boundaryReleaseCount += 1;
      state.lastWheelPrevented = false;
      state.lastProgressSource = 'boundary-release';
      return;
    }
    event.preventDefault();
    state.wheelPreventCount += 1;
    state.lastWheelPrevented = true;
    if (state.reducedMotion) {
      state.reducedMotionDirectCount += 1;
      setProgress(reducedChapterProgress(direction), 'trusted-reduced-wheel');
      return;
    }
    const wheelDistance = Math.min(.14, Math.max(.045, Math.abs(event.deltaY) * .0011));
    setProgress(state.progress + direction * wheelDistance, 'trusted-wheel');
  }, { passive: false });

  viewport.addEventListener('pointerdown', event => {
    const kind = event.pointerType || 'pointer';
    if (!recordInput(kind, event, 'depth-drag-start')) return;
    latestPointerKind = kind;
    activePointerId = event.pointerId;
    dragStartY = event.clientY;
    dragStartProgress = state.progress;
    state.dragActive = true;
    state.pointerDragCount += 1;
    viewport.setPointerCapture(event.pointerId);
    container.querySelector('canvas')?.focus({ preventScroll: true });
  });

  viewport.addEventListener('pointermove', event => {
    if (event.pointerId !== activePointerId) return;
    if (!event.isTrusted) {
      state.syntheticInput = true;
      return;
    }
    state.pointerMoveCount += 1;
    state.lastTrustedEvent = 'depth-drag-move';
    const viewportSize = Math.max(1, viewport.getBoundingClientRect().height);
    const rawProgress = clampValue(dragStartProgress + (dragStartY - event.clientY) / viewportSize);
    if (state.reducedMotion) {
      const snappedProgress = chapterPositions[closestChapterIndex(rawProgress)];
      if (Math.abs(snappedProgress - state.progress) > .00001) state.reducedMotionDirectCount += 1;
      setProgress(snappedProgress, 'trusted-reduced-drag');
    } else setProgress(rawProgress, 'trusted-drag');
  });

  const releasePointer = event => {
    if (event.pointerId !== activePointerId) return;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    activePointerId = null;
    state.dragActive = false;
  };
  viewport.addEventListener('pointerup', releasePointer);
  viewport.addEventListener('pointercancel', releasePointer);

  viewport.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (!recordInput('keyboard', event, 'depth-keyboard')) return;
    state.keyboardAdjustCount += 1;
    if (event.key === 'Home') {
      if (state.reducedMotion) state.reducedMotionDirectCount += 1;
      setProgress(0, state.reducedMotion ? 'trusted-reduced-home' : 'trusted-home');
      return;
    }
    if (event.key === 'End') {
      if (state.reducedMotion) state.reducedMotionDirectCount += 1;
      setProgress(1, state.reducedMotion ? 'trusted-reduced-end' : 'trusted-end');
      return;
    }
    const direction = ['ArrowDown', 'ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1;
    if (state.reducedMotion) {
      state.reducedMotionDirectCount += 1;
      setProgress(reducedChapterProgress(direction), 'trusted-reduced-key');
      return;
    }
    const keyDistance = ['PageUp', 'PageDown'].includes(event.key) ? .26 : .1;
    setProgress(state.progress + direction * keyDistance, 'trusted-key');
  });

  chapterButtons.forEach((button, index) => {
    button.addEventListener('pointerdown', event => {
      if (event.isTrusted) latestPointerKind = event.pointerType || 'pointer';
    });
    button.addEventListener('click', event => {
      const kind = event.detail === 0 ? 'keyboard' : latestPointerKind;
      if (!recordInput(kind, event, `chapter-${index + 1}`)) return;
      state.chapterClickCount += 1;
      if (state.reducedMotion) state.reducedMotionDirectCount += 1;
      setProgress(chapterPositions[index], state.reducedMotion ? 'trusted-reduced-chapter' : 'trusted-chapter');
    });
  });

  reducedMotionQuery.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches) {
      const snappedProgress = chapterPositions[closestChapterIndex(state.progress)];
      if (Math.abs(snappedProgress - state.progress) > .00001) {
        state.reducedMotionDirectCount += 1;
        state.progress = snappedProgress;
      }
    }
    updateInterface();
    requestRedraw('reduced-motion-change');
  });

  const resizeObserver = new ResizeObserver(() => {
    const canvasWidth = Math.max(1, Math.round(viewport.clientWidth));
    const canvasHeight = Math.max(1, Math.round(viewport.clientHeight));
    if (!container.querySelector('canvas') || (sketch.width === canvasWidth && sketch.height === canvasHeight)) return;
    state.resizeCount += 1;
    sketch.resizeCanvas(canvasWidth, canvasHeight, true);
    requestRedraw('resize');
  });
  resizeObserver.observe(viewport);

  updateInterface();
  const ready = Promise.all([firstDrawReady, document.fonts.ready]).then(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const canvas = container.querySelector('canvas');
    const viewportBounds = viewport.getBoundingClientRect();
    state.canvasSizeValidated = Boolean(canvas)
      && Math.abs(canvas.width - Math.round(viewportBounds.width)) <= 2
      && Math.abs(canvas.height - Math.round(viewportBounds.height)) <= 2;
    state.progressValidated = state.lastDrawProgress === 0
      && state.lastDrawOffsets
      && state.lastDrawOffsets.far === 0
      && state.lastDrawOffsets.mid === 0
      && state.lastDrawOffsets.near === 0;
    state.initialStaticVerified = state.progress === 0
      && state.chapterIndex === 0
      && state.inputCount === 0
      && state.progressChangeCount === 0
      && state.automaticProgress === false
      && state.previewClockDriven === false
      && state.syntheticInput === false;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const canvas = container.querySelector('canvas');
    const context = canvas?.getContext('2d');
    const stageBounds = stage.getBoundingClientRect();
    const shellBounds = shell.getBoundingClientRect();
    const viewportBounds = viewport.getBoundingClientRect();
    const currentButtons = chapterButtons.filter(button => button.getAttribute('aria-current') === 'step');
    const expectedIndex = closestChapterIndex(state.progress);
    const expectedOffsets = {
      far: state.progress * layers[0].speed,
      mid: state.progress * layers[1].speed,
      near: state.progress * layers[2].speed,
    };
    state.canvasSizeValidated = Boolean(canvas)
      && Math.abs(canvas.width - Math.round(viewportBounds.width)) <= 2
      && Math.abs(canvas.height - Math.round(viewportBounds.height)) <= 2;
    state.progressValidated = Math.abs(state.lastDrawProgress - state.progress) < .00001
      && ['far', 'mid', 'near'].every(id => Math.abs(state.lastDrawOffsets[id] - expectedOffsets[id]) < .00001);
    return Boolean(
      sketch instanceof p5
      && context instanceof CanvasRenderingContext2D
      && canvas.tabIndex === 0
      && layers.length === 3
      && layers.every((layer, index) => layer.stars.length === layerDefinitions[index].count)
      && state.seedSignature === 'far:54|mid:34|near:20'
      && state.automaticProgress === false
      && state.previewClockDriven === false
      && state.automaticFallback === false
      && state.syntheticInput === false
      && state.userInitiatedChangesOnly === true
      && state.initialStaticVerified
      && state.progress >= 0
      && state.progress <= 1
      && state.chapterIndex === expectedIndex
      && state.chapterId === chapters[expectedIndex].id
      && chapterTitle.textContent === chapters[expectedIndex].title
      && currentButtons.length === 1
      && Number(currentButtons[0].dataset.index) === expectedIndex
      && Math.abs(state.layerOffsets.far - expectedOffsets.far) < .00001
      && Math.abs(state.layerOffsets.mid - expectedOffsets.mid) < .00001
      && Math.abs(state.layerOffsets.near - expectedOffsets.near) < .00001
      && state.layersSeparatedValidated
      && state.progressValidated
      && state.canvasSizeValidated
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.wheelInputCount)
      && Number.isInteger(state.pointerInputCount)
      && Number.isInteger(state.keyboardInputCount)
      && state.wheelInputCount + state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && Number.isInteger(state.wheelPreventCount)
      && Number.isInteger(state.boundaryReleaseCount)
      && state.wheelPreventCount + state.boundaryReleaseCount === state.wheelInputCount
      && Number.isInteger(state.pointerDragCount)
      && Number.isInteger(state.pointerMoveCount)
      && Number.isInteger(state.keyboardAdjustCount)
      && Number.isInteger(state.chapterClickCount)
      && Number.isInteger(state.progressChangeCount)
      && Number.isInteger(state.reducedMotionDirectCount)
      && Number.isInteger(state.redrawRequestCount)
      && Number.isInteger(state.drawCount)
      && Number.isInteger(state.renderCount)
      && (!state.reducedMotion || chapterPositions.some(position => Math.abs(position - state.progress) < .00001))
      && Number.isFinite(state.starChecksum)
      && state.starChecksum > 1
      && state.drawCount > 0
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stageBounds.width >= innerWidth * .99
      && stageBounds.height >= innerHeight * .99
      && shellBounds.left >= -1
      && shellBounds.top >= -1
      && shellBounds.right <= innerWidth + 1
      && shellBounds.bottom <= innerHeight + 1
      && document.documentElement.scrollWidth <= innerWidth
      && document.documentElement.scrollHeight <= innerHeight
    );
  };

  window.addEventListener('beforeunload', () => {
    resizeObserver.disconnect();
    sketch.remove();
  }, { once: true });

  installPreviewController({
    id: 'scroll-linked-multilayer-starfield',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => { state.renderCount += 1; },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
