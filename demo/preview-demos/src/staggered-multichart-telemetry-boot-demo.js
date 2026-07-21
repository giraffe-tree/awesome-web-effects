import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const RUN_DURATION = 1.72;
const STAGE_WINDOWS = Object.freeze([
  { start: .05, end: .48 },
  { start: .31, end: .76 },
  { start: .59, end: 1 },
]);
const SIGNAL_VALUES = Object.freeze([31, 38, 35, 46, 43, 57, 54, 66, 63, 75, 72, 84]);
const LOAD_VALUES = Object.freeze([41, 58, 46, 67, 53]);
const LINK_INTEGRITY = 94;

const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
const easeOut = value => 1 - (1 - clamp(value)) ** 3;
const checksum = values => values.reduce((sum, value, index) => sum + value * (index + 11), 0);

try {
  const stage = document.querySelector('#telemetry-stage');
  const shell = document.querySelector('#telemetry-shell');
  const workspace = document.querySelector('#telemetry-workspace');
  const container = document.querySelector('#telemetry-canvas');
  const systemState = document.querySelector('#system-state');
  const recordCopy = document.querySelector('#record-copy');
  const runButton = document.querySelector('#run-preflight');
  const sequenceSteps = [...document.querySelectorAll('[data-step]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !shell || !workspace || !container || !systemState || !recordCopy || !runButton || sequenceSteps.length !== 3) {
    throw new Error('Telemetry preflight DOM is incomplete');
  }

  const state = {
    id: 'staggered-multichart-telemetry-boot',
    task: 'operator-started-orbital-relay-telemetry-preflight',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'one-trusted-human-input-reveals-three-deterministic-charts-in-a-finite-stagger',
    assetStrategy: 'code-native-deterministic-telemetry-no-functional-raster-input-required',
    captureType: 'hybrid',
    acceptedInputs: ['trusted-pointer-click', 'trusted-keyboard-button-activation'],
    causality: 'trusted-run-button-starts-one-finite-staggered-diagnostic-pass',
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticLoop: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    previewClockMutationBeforeInput: false,
    previewClockDrivesFiniteTransitionAfterInput: true,
    runDuration: RUN_DURATION,
    phase: 'idle',
    progress: 0,
    stageProgress: [0, 0, 0],
    activeStageIndex: -1,
    latestPreviewTime: 0,
    runStartTime: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    runStartCount: 0,
    runCompleteCount: 0,
    rerunCount: 0,
    stageActivationCount: 0,
    finiteTransitionStepCount: 0,
    reducedMotionDirectCount: 0,
    drawCount: 0,
    renderCount: 0,
    resizeCount: 0,
    initialStaticVerified: false,
    canvasSizeValidated: false,
    geometryValidated: false,
    resultValidated: false,
    reducedMotion: reducedMotion.matches,
    finalRecordId: 'none',
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    dataSignature: `${checksum(SIGNAL_VALUES)}:${checksum(LOAD_VALUES)}:${LINK_INTEGRITY}`,
    latestDrawSignature: 'none',
    ready: false,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__TELEMETRY_PREFLIGHT_STATE__ = state;

  let sketch;
  let resolveFirstDraw;
  const firstDrawReady = new Promise(resolve => { resolveFirstDraw = resolve; });

  const nextFrames = (count = 2) => new Promise(resolve => {
    const advance = remaining => {
      if (remaining <= 0) resolve();
      else requestAnimationFrame(() => advance(remaining - 1));
    };
    advance(count);
  });

  const recordTrustedInput = event => {
    if (event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    const kind = event.detail === 0 ? 'keyboard' : 'pointer';
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = 'run-preflight-button';
    state.lastInputTrusted = true;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
    return true;
  };

  const updateInterface = () => {
    shell.dataset.phase = state.phase;
    if (state.phase === 'idle') {
      systemState.textContent = 'Awaiting operator';
      recordCopy.textContent = 'No run recorded';
      runButton.textContent = 'Run preflight';
      runButton.disabled = false;
    } else if (state.phase === 'running') {
      const labels = ['Ingress trace', 'Load balance', 'Link integrity'];
      systemState.textContent = labels[Math.max(0, state.activeStageIndex)];
      recordCopy.textContent = `Pass 07 · ${String(Math.round(state.progress * 100)).padStart(2, '0')}%`;
      runButton.textContent = 'Checking…';
      runButton.disabled = true;
    } else {
      systemState.textContent = 'Relay nominal';
      recordCopy.textContent = 'Pass 07 · Nominal';
      runButton.textContent = 'Run again';
      runButton.disabled = false;
    }
    sequenceSteps.forEach((step, index) => {
      step.dataset.active = String(state.stageProgress[index] >= .999);
      step.dataset.current = String(state.phase === 'running' && index === state.activeStageIndex);
    });
  };

  const completeRun = () => {
    if (state.phase !== 'running') return;
    state.progress = 1;
    state.stageProgress = [1, 1, 1];
    state.activeStageIndex = 2;
    state.phase = 'complete';
    state.runCompleteCount += 1;
    state.stageActivationCount = Math.max(state.stageActivationCount, state.runStartCount * 3);
    state.finalRecordId = 'pass-07-nominal';
    state.resultValidated = SIGNAL_VALUES.at(-1) >= 80
      && Math.max(...LOAD_VALUES) <= 70
      && LINK_INTEGRITY >= 90;
    updateInterface();
    sketch.redraw();
  };

  const beginRun = event => {
    if (!recordTrustedInput(event) || state.phase === 'running') return;
    if (state.runCompleteCount > 0) state.rerunCount += 1;
    state.phase = 'running';
    state.progress = 0;
    state.stageProgress = [0, 0, 0];
    state.activeStageIndex = 0;
    state.runStartTime = state.latestPreviewTime;
    state.runStartCount += 1;
    state.finalRecordId = 'none';
    state.resultValidated = false;
    updateInterface();
    if (state.reducedMotion) {
      state.reducedMotionDirectCount += 1;
      completeRun();
    } else sketch.redraw();
  };

  runButton.addEventListener('click', beginRun);
  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.phase === 'running') {
      state.reducedMotionDirectCount += 1;
      completeRun();
    }
  });

  sketch = new p5(p => {
    let palette;

    const drawPanel = (bounds, index, label, value, unit) => {
      const active = state.phase === 'running' && state.activeStageIndex === index;
      const compactCard = bounds.w < 125;
      p.noStroke();
      p.fill(active ? palette.panelActive : palette.panel);
      p.rect(bounds.x, bounds.y, bounds.w, bounds.h, Math.max(5, bounds.h * .055));
      p.noFill();
      p.stroke(active ? palette.amber : palette.border);
      p.strokeWeight(active ? 1.15 : .8);
      p.rect(bounds.x, bounds.y, bounds.w, bounds.h, Math.max(5, bounds.h * .055));
      p.noStroke();
      p.fill(palette.muted);
      p.textAlign(p.LEFT, p.TOP);
      p.textStyle(p.BOLD);
      p.textSize(compactCard ? Math.max(4, bounds.h * .047) : Math.max(5, Math.min(8, bounds.h * .085)));
      p.text(label, bounds.x + bounds.w * .07, bounds.y + bounds.h * .09);
      p.textAlign(p.RIGHT, p.TOP);
      p.fill(state.stageProgress[index] > .02 ? palette.ink : palette.muted);
      p.textSize(compactCard ? Math.max(6, bounds.h * .07) : Math.max(7, Math.min(13, bounds.h * .14)));
      p.text(`${value}${unit}`, bounds.x + bounds.w * .93, bounds.y + bounds.h * (compactCard ? .21 : .075));
    };

    const computePanels = width => {
      const gap = Math.max(5, Math.min(11, width * .018));
      const inset = Math.max(7, Math.min(18, width * .035));
      const usableWidth = width - inset * 2;
      const usableHeight = p.height - inset * 2;
      if (width / p.height < 1.15) {
        const panelHeight = (usableHeight - gap * 2) / 3;
        return Array.from({ length: 3 }, (_, index) => ({
          x: inset,
          y: inset + index * (panelHeight + gap),
          w: usableWidth,
          h: panelHeight,
        }));
      }
      const panelWidth = (usableWidth - gap * 2) / 3;
      return Array.from({ length: 3 }, (_, index) => ({
        x: inset + index * (panelWidth + gap),
        y: inset,
        w: panelWidth,
        h: usableHeight,
      }));
    };

    p.setup = () => {
      p.pixelDensity(1);
      palette = {
        panel: p.color('#0d1b18'),
        panelActive: p.color('#10231e'),
        border: p.color('rgba(182, 213, 198, .17)'),
        grid: p.color('rgba(182, 213, 198, .10)'),
        ink: p.color('#edf2e8'),
        muted: p.color('#71857f'),
        mint: p.color('#8ce5ba'),
        amber: p.color('#ffb968'),
      };
      const renderer = p.createCanvas(
        Math.max(1, Math.round(workspace.clientWidth)),
        Math.max(1, Math.round(workspace.clientHeight)),
      );
      renderer.parent(container);
      renderer.elt.setAttribute('aria-hidden', 'true');
      p.noLoop();
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
      p.textFont('ui-monospace, SFMono-Regular, Menlo, monospace');
    };

    p.draw = () => {
      state.drawCount += 1;
      const panels = computePanels(p.width);
      p.clear();

      const signalProgress = state.stageProgress[0];
      drawPanel(panels[0], 0, '01 · INGRESS', Math.round(84 * signalProgress), ' mb/s');
      const a = panels[0];
      const plot = { x: a.x + a.w * .07, y: a.y + a.h * (a.w < 125 ? .43 : .35), w: a.w * .86, h: a.h * (a.w < 125 ? .41 : .49) };
      p.stroke(palette.grid);
      p.strokeWeight(.75);
      for (let row = 0; row < 4; row += 1) p.line(plot.x, plot.y + plot.h * row / 3, plot.x + plot.w, plot.y + plot.h * row / 3);
      p.noFill();
      p.stroke(signalProgress > .01 ? palette.mint : palette.muted);
      p.strokeWeight(Math.max(1, Math.min(2, a.h * .018)));
      p.beginShape();
      const signalEnd = (SIGNAL_VALUES.length - 1) * signalProgress;
      SIGNAL_VALUES.forEach((value, index) => {
        if (index > Math.ceil(signalEnd)) return;
        const revealIndex = Math.min(index, signalEnd);
        const left = Math.floor(revealIndex);
        const mix = revealIndex - left;
        const mixedValue = SIGNAL_VALUES[left] * (1 - mix) + SIGNAL_VALUES[Math.min(left + 1, SIGNAL_VALUES.length - 1)] * mix;
        p.vertex(plot.x + revealIndex / (SIGNAL_VALUES.length - 1) * plot.w, plot.y + plot.h * (1 - mixedValue / 100));
      });
      p.endShape();

      const loadProgress = state.stageProgress[1];
      drawPanel(panels[1], 1, '02 · NODE LOAD', Math.round(Math.max(...LOAD_VALUES) * loadProgress), '% peak');
      const b = panels[1];
      const barArea = { x: b.x + b.w * .08, y: b.y + b.h * (b.w < 125 ? .44 : .36), w: b.w * .84, h: b.h * (b.w < 125 ? .4 : .48) };
      p.stroke(palette.grid);
      p.strokeWeight(.75);
      p.line(barArea.x, barArea.y + barArea.h * .3, barArea.x + barArea.w, barArea.y + barArea.h * .3);
      p.noStroke();
      LOAD_VALUES.forEach((value, index) => {
        const barWidth = barArea.w / LOAD_VALUES.length * .56;
        const barX = barArea.x + (index + .5) * barArea.w / LOAD_VALUES.length - barWidth / 2;
        const barHeight = barArea.h * value / 100 * loadProgress;
        p.fill(index === 3 ? palette.amber : palette.mint);
        p.rect(barX, barArea.y + barArea.h - barHeight, barWidth, barHeight, 2, 2, 0, 0);
      });

      const linkProgress = state.stageProgress[2];
      drawPanel(panels[2], 2, '03 · LINK HEALTH', Math.round(LINK_INTEGRITY * linkProgress), '%');
      const c = panels[2];
      const radius = Math.min(c.w, c.h) * (c.w < 125 ? .22 : .26);
      const centerX = c.x + c.w * .5;
      const centerY = c.y + c.h * (c.w < 125 ? .69 : .63);
      p.noFill();
      p.stroke(palette.grid);
      p.strokeWeight(Math.max(4, radius * .19));
      p.arc(centerX, centerY, radius * 2, radius * 2, -Math.PI * .82, Math.PI * .82);
      p.stroke(palette.mint);
      p.arc(centerX, centerY, radius * 2, radius * 2, -Math.PI * .82, -Math.PI * .82 + Math.PI * 1.64 * LINK_INTEGRITY / 100 * linkProgress);
      p.noStroke();
      p.fill(linkProgress > .02 ? palette.ink : palette.muted);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(Math.max(6, Math.min(10, c.h * .095)));
      p.text(linkProgress >= .999 ? 'LOCKED' : 'STANDBY', centerX, centerY);

      state.latestDrawSignature = `${state.phase}:${state.stageProgress.map(value => value.toFixed(3)).join(':')}:${panels.length}`;
      if (state.drawCount === 1) resolveFirstDraw();
    };
  }, container);

  const updateGeometry = () => {
    const stageBounds = stage.getBoundingClientRect();
    const shellBounds = shell.getBoundingClientRect();
    const workspaceBounds = workspace.getBoundingClientRect();
    const canvas = container.querySelector('canvas');
    state.canvasSizeValidated = Boolean(canvas)
      && Math.abs(canvas.width - Math.round(workspaceBounds.width)) <= 2
      && Math.abs(canvas.height - Math.round(workspaceBounds.height)) <= 2;
    state.geometryValidated = stageBounds.width >= innerWidth * .99
      && stageBounds.height >= innerHeight * .99
      && shellBounds.left >= -1
      && shellBounds.top >= -1
      && shellBounds.right <= innerWidth + 1
      && shellBounds.bottom <= innerHeight + 1
      && workspaceBounds.width >= shellBounds.width * .88
      && workspaceBounds.height >= shellBounds.height * .43;
  };

  const resizeObserver = new ResizeObserver(() => {
    const width = Math.max(1, Math.round(workspace.clientWidth));
    const height = Math.max(1, Math.round(workspace.clientHeight));
    if (!container.querySelector('canvas') || (sketch.width === width && sketch.height === height)) return;
    state.resizeCount += 1;
    sketch.resizeCanvas(width, height, true);
    sketch.redraw();
  });
  resizeObserver.observe(workspace);

  updateInterface();
  sketch.redraw();
  const ready = Promise.all([firstDrawReady, document.fonts.ready]).then(async () => {
    await nextFrames();
    updateGeometry();
    state.initialStaticVerified = state.phase === 'idle'
      && state.progress === 0
      && state.stageProgress.every(value => value === 0)
      && state.inputCount === 0
      && state.runStartCount === 0
      && state.runCompleteCount === 0
      && state.finalRecordId === 'none'
      && state.automaticPlayback === false
      && state.previewClockMutationBeforeInput === false;
    state.ready = true;
  });

  const render = time => {
    state.latestPreviewTime = Number.isFinite(time) ? time : state.latestPreviewTime;
    state.renderCount += 1;
    if (state.phase !== 'running') return;
    if (state.reducedMotion) {
      completeRun();
      return;
    }
    const nextProgress = clamp((state.latestPreviewTime - state.runStartTime) / RUN_DURATION);
    if (Math.abs(nextProgress - state.progress) < .00001) return;
    const previousStages = [...state.stageProgress];
    state.progress = nextProgress;
    state.stageProgress = STAGE_WINDOWS.map(window => easeOut((nextProgress - window.start) / (window.end - window.start)));
    state.activeStageIndex = state.stageProgress.findIndex(value => value < .999);
    if (state.activeStageIndex < 0) state.activeStageIndex = 2;
    state.stageProgress.forEach((value, index) => {
      if (previousStages[index] <= .001 && value > .001) state.stageActivationCount += 1;
    });
    state.finiteTransitionStepCount += 1;
    updateInterface();
    sketch.redraw();
    if (nextProgress >= .999) completeRun();
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await nextFrames();
    updateGeometry();
    const canvas = container.querySelector('canvas');
    const countersValid = [
      'inputCount', 'trustedInputCount', 'rejectedUntrustedInputCount', 'pointerInputCount', 'keyboardInputCount',
      'runStartCount', 'runCompleteCount', 'rerunCount', 'stageActivationCount', 'finiteTransitionStepCount',
      'reducedMotionDirectCount', 'drawCount', 'renderCount', 'resizeCount',
    ].every(key => Number.isInteger(state[key]) && state[key] >= 0);
    const inputCountsValid = state.trustedInputCount === state.inputCount
      && state.pointerInputCount + state.keyboardInputCount === state.inputCount
      && state.runStartCount <= state.inputCount
      && state.runCompleteCount <= state.runStartCount
      && state.rerunCount === Math.max(0, state.runStartCount - 1);
    const stableStateValid = state.phase !== 'complete' || (
      state.progress === 1
      && state.stageProgress.every(value => value === 1)
      && state.finalRecordId === 'pass-07-nominal'
      && state.resultValidated
      && recordCopy.textContent === 'Pass 07 · Nominal'
      && runButton.textContent === 'Run again'
    );
    const noOverflow = document.documentElement.scrollWidth <= innerWidth + 1
      && document.documentElement.scrollHeight <= innerHeight + 1;

    return sketch instanceof p5
      && canvas?.getContext('2d') instanceof CanvasRenderingContext2D
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && state.claimedLibrary === 'p5@2.3.0'
      && state.assetStrategy === 'code-native-deterministic-telemetry-no-functional-raster-input-required'
      && state.userInputRequired === true
      && state.strictTrustedInputGuard === true
      && state.initialFrameStatic === true
      && state.automaticCycle === false
      && state.automaticPlayback === false
      && state.automaticLoop === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.syntheticInputDispatch === false
      && state.previewClockMutationBeforeInput === false
      && state.previewClockDrivesFiniteTransitionAfterInput === true
      && state.initialStaticVerified
      && state.canvasSizeValidated
      && state.geometryValidated
      && state.dataSignature === '11616:3478:94'
      && SIGNAL_VALUES.length === 12
      && LOAD_VALUES.length === 5
      && LINK_INTEGRITY === 94
      && state.stageProgress.length === 3
      && state.stageProgress.every(value => Number.isFinite(value) && value >= 0 && value <= 1)
      && countersValid
      && inputCountsValid
      && stableStateValid
      && state.latestDrawSignature !== 'none'
      && state.drawCount > 0
      && state.renderCount > 0
      && noOverflow;
  };

  installPreviewController({
    id: 'staggered-multichart-telemetry-boot',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready,
  });

  window.addEventListener('beforeunload', () => {
    resizeObserver.disconnect();
    sketch.remove();
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
