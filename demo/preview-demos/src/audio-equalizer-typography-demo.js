import './batch-a-qa.js';
import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#type-stage');
  const host = document.querySelector('#type-canvas-host');
  const toneButton = document.querySelector('#tone-button');
  const audioState = document.querySelector('#audio-state');
  const frequencyReadout = document.querySelector('#frequency-readout');
  const peakReadout = document.querySelector('#peak-readout');
  const deformationReadout = document.querySelector('#deformation-readout');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!stage || !host || !toneButton || !audioState || !frequencyReadout || !peakReadout || !deformationReadout) {
    throw new Error('Audio typography DOM is incomplete.');
  }
  if (typeof AudioContextClass !== 'function') throw new Error('Web Audio is unavailable.');

  const word = 'PULSE';
  const maskWidth = 920;
  const maskHeight = 320;
  const sliceWidth = 4;
  const sliceCount = maskWidth / sliceWidth;
  const maskCanvas = document.createElement('canvas');
  const deformCanvas = document.createElement('canvas');
  const colorCanvas = document.createElement('canvas');
  maskCanvas.width = deformCanvas.width = colorCanvas.width = maskWidth;
  maskCanvas.height = deformCanvas.height = colorCanvas.height = maskHeight;
  const maskContext = maskCanvas.getContext('2d');
  const deformContext = deformCanvas.getContext('2d');
  const colorContext = colorCanvas.getContext('2d');
  const bins = new Uint8Array(128);

  maskContext.clearRect(0, 0, maskWidth, maskHeight);
  maskContext.fillStyle = '#fff';
  maskContext.font = '900 208px Arial Black, Inter, system-ui, sans-serif';
  maskContext.textAlign = 'center';
  maskContext.textBaseline = 'middle';
  maskContext.fillText(word, maskWidth / 2, maskHeight / 2 + 4);
  const maskPixels = maskContext.getImageData(0, 0, maskWidth, maskHeight).data;
  let maskPixelCount = 0;
  let maskChecksum = 2166136261;
  for (let index = 3; index < maskPixels.length; index += 4) {
    if (maskPixels[index] > 20) maskPixelCount += 1;
    if (index % 116 === 3) maskChecksum = Math.imul(maskChecksum ^ maskPixels[index], 16777619) >>> 0;
  }

  const state = {
    audioActive: false,
    latched: false,
    pointerHolding: false,
    pitchNormalized: .38,
    frequencyHz: 260,
    peakBin: 0,
    peakFrequencyHz: 0,
    peakMagnitude: 0,
    meanEnergy: 0,
    deformationAmount: 0,
    deformationMultiplier: reducedMotionQuery.matches ? .28 : 1,
    phase: 'silent',
    reducedMotion: reducedMotionQuery.matches,
    pointerInside: false,
    stageFocused: false,
    buttonFocused: false,
    lastInput: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    keyboardInputCount: 0,
    clickInputCount: 0,
    pointerMoveCount: 0,
    audioToggleCount: 0,
    pitchChangeCount: 0,
    renderCount: 0,
    analyserReadCount: 0,
    audioContextCreated: false,
    audioContextState: 'not-created',
    analyserConnected: false,
    oscillatorStarted: false,
    analyserFftSize: 256,
    frequencyBinCount: bins.length,
    word,
    maskWidth,
    maskHeight,
    maskPixelCount,
    maskChecksum,
    sliceCount,
    canvasWidth: 0,
    canvasHeight: 0,
    p5Instance: false,
    claimedLibrary: 'p5@2.3.0 + Web Audio',
    inputAdapters: ['pointer', 'touch', 'click', 'keyboard'],
    pointerCaptureSupported: typeof stage.setPointerCapture === 'function',
    deterministicSilentFrame: true,
    automaticPlayback: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    previewClockDrivesSpectrum: false,
    initialFrameChecksum: 0,
    initialStaticConfirmed: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let audioContext = null;
  let analyser = null;
  let oscillator = null;
  let gainNode = null;
  let sketch;
  let resolveSetup;
  const setupReady = new Promise(resolve => { resolveSetup = resolve; });

  const clamp = value => Math.min(1, Math.max(0, value));
  const frequencyFromPitch = value => Math.round(110 * Math.pow(8, clamp(value)));

  const recordInput = source => {
    state.lastInput = source;
    state.inputCount += 1;
    if (source.startsWith('pointer')) state.pointerInputCount += 1;
    if (source.startsWith('touch')) state.touchInputCount += 1;
    if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    if (source.startsWith('click')) state.clickInputCount += 1;
  };

  const ensureAudio = async () => {
    if (!audioContext) {
      audioContext = new AudioContextClass();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = state.analyserFftSize;
      analyser.smoothingTimeConstant = state.reducedMotion ? 0 : .68;
      oscillator = audioContext.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = state.frequencyHz;
      gainNode = audioContext.createGain();
      gainNode.gain.value = 0;
      oscillator.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      state.audioContextCreated = true;
      state.analyserConnected = true;
      state.oscillatorStarted = true;
    }
    if (audioContext.state !== 'running') await audioContext.resume();
    state.audioContextState = audioContext.state;
  };

  const setGain = active => {
    if (!gainNode || !audioContext) return;
    const value = active ? .038 : 0;
    gainNode.gain.cancelScheduledValues(audioContext.currentTime);
    if (state.reducedMotion) gainNode.gain.setValueAtTime(value, audioContext.currentTime);
    else gainNode.gain.setTargetAtTime(value, audioContext.currentTime, .018);
  };

  const syncInterface = () => {
    state.phase = state.audioActive ? 'live' : 'silent';
    state.deformationMultiplier = state.reducedMotion ? .28 : 1;
    stage.dataset.audioActive = String(state.audioActive);
    stage.dataset.phase = state.phase;
    stage.dataset.frequency = String(state.frequencyHz);
    stage.style.setProperty('--pitch-progress', state.pitchNormalized.toFixed(4));
    toneButton.setAttribute('aria-pressed', String(state.latched));
    const tinyLayout = stage.clientWidth <= 180 || stage.clientHeight <= 105;
    toneButton.textContent = tinyLayout
      ? state.audioActive ? 'Stop' : 'Tone'
      : state.audioActive ? 'Stop tone' : 'Start tone';
    audioState.textContent = state.audioActive ? `LIVE ANALYSER · ${state.frequencyHz} HZ` : 'SILENT · ORIGINAL FORM';
    frequencyReadout.textContent = `${state.frequencyHz} Hz`;
    peakReadout.textContent = state.audioActive && state.peakFrequencyHz ? `${state.peakFrequencyHz} Hz` : '—';
    deformationReadout.textContent = `${Math.round(state.deformationAmount * 100)}%`;
    host.setAttribute('aria-label', state.audioActive
      ? `The PULSE wordmark reshaped by a live ${state.frequencyHz} hertz Web Audio spectrum`
      : 'The original PULSE wordmark awaiting a human-triggered tone');
  };

  const setPitch = (nextPitch, source, shouldRecord = true) => {
    const next = clamp(nextPitch);
    if (Math.abs(next - state.pitchNormalized) < .0005) return;
    if (shouldRecord) recordInput(source);
    state.pitchNormalized = next;
    state.frequencyHz = frequencyFromPitch(next);
    state.pitchChangeCount += 1;
    if (oscillator && audioContext) {
      oscillator.frequency.cancelScheduledValues(audioContext.currentTime);
      oscillator.frequency.setTargetAtTime(state.frequencyHz, audioContext.currentTime, state.reducedMotion ? .001 : .025);
    }
    syncInterface();
  };

  const setAudioActive = async (active, source, options = {}) => {
    if (active) await ensureAudio();
    if (options.record !== false) recordInput(source);
    state.audioActive = active;
    if (typeof options.latched === 'boolean') state.latched = options.latched;
    state.audioToggleCount += 1;
    setGain(active);
    if (!active) {
      bins.fill(0);
      state.peakBin = 0;
      state.peakFrequencyHz = 0;
      state.peakMagnitude = 0;
      state.meanEnergy = 0;
      state.deformationAmount = 0;
    }
    syncInterface();
  };

  const toggleLatched = source => {
    const next = !state.audioActive || !state.latched;
    return setAudioActive(next, source, { latched: next });
  };

  const resizeSketch = () => {
    if (!sketch) return;
    const width = Math.max(1, Math.round(stage.clientWidth));
    const height = Math.max(1, Math.round(stage.clientHeight));
    if (sketch.width !== width || sketch.height !== height) sketch.resizeCanvas(width, height, true);
    state.canvasWidth = width;
    state.canvasHeight = height;
  };

  const wordLayout = (width, height) => {
    const tiny = width <= 180 || height <= 105;
    const compact = width <= 420 || height <= 260;
    const left = tiny ? .035 : compact ? .35 : .36;
    const right = .975;
    return {
      tiny,
      compact,
      left,
      right,
      top: tiny ? .17 : compact ? .2 : .2,
      bottom: tiny ? .79 : compact ? .8 : .79,
      width: (right - left) * width,
      height: (tiny ? .62 : compact ? .6 : .59) * height
    };
  };

  const updateSpectrum = () => {
    if (!state.audioActive || !analyser || !audioContext) {
      bins.fill(0);
      state.deformationAmount = 0;
      return;
    }
    analyser.getByteFrequencyData(bins);
    state.analyserReadCount += 1;
    let peakBin = 0;
    let peakMagnitude = 0;
    let energySum = 0;
    const limit = Math.min(48, bins.length);
    for (let index = 1; index < limit; index += 1) {
      const magnitude = bins[index];
      energySum += magnitude;
      if (magnitude > peakMagnitude) {
        peakMagnitude = magnitude;
        peakBin = index;
      }
    }
    state.peakBin = peakBin;
    state.peakMagnitude = peakMagnitude;
    state.meanEnergy = energySum / ((limit - 1) * 255);
    state.deformationAmount = Math.min(1, state.meanEnergy * 2.2) * state.deformationMultiplier;
    state.peakFrequencyHz = Math.round(peakBin * audioContext.sampleRate / analyser.fftSize);
    state.audioContextState = audioContext.state;
  };

  const createDeformedWord = () => {
    deformContext.clearRect(0, 0, maskWidth, maskHeight);
    const multiplier = state.deformationMultiplier;
    for (let x = 0; x < maskWidth; x += sliceWidth) {
      const amount = x / maskWidth;
      const bin = 1 + Math.min(46, Math.floor(amount * 46));
      const energy = state.audioActive
        ? (bins[bin - 1] * .22 + bins[bin] * .56 + bins[bin + 1] * .22) / 255
        : 0;
      const previous = bins[Math.max(0, bin - 2)] / 255;
      const next = bins[Math.min(bins.length - 1, bin + 2)] / 255;
      const scale = 1 + energy * 1.28 * multiplier;
      const destinationHeight = maskHeight * scale;
      const spectralTilt = state.audioActive ? (next - previous) * 28 * multiplier : 0;
      deformContext.drawImage(
        maskCanvas,
        x, 0, sliceWidth, maskHeight,
        x, (maskHeight - destinationHeight) / 2 + spectralTilt, sliceWidth + .5, destinationHeight
      );
    }

    colorContext.clearRect(0, 0, maskWidth, maskHeight);
    const gradient = colorContext.createLinearGradient(0, 0, maskWidth, 0);
    gradient.addColorStop(0, '#ff785e');
    gradient.addColorStop(.45, '#f6f0df');
    gradient.addColorStop(1, '#ddf66a');
    colorContext.fillStyle = gradient;
    colorContext.fillRect(0, 0, maskWidth, maskHeight);
    colorContext.globalCompositeOperation = 'destination-in';
    colorContext.drawImage(deformCanvas, 0, 0);
    colorContext.globalCompositeOperation = 'source-over';
  };

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight)).parent(host);
      p.textFont('ui-monospace, SFMono-Regular, Menlo, monospace');
      p.textAlign(p.CENTER, p.CENTER);
      p.noLoop();
      state.p5Instance = p instanceof p5;
      resolveSetup();
    };

    p.draw = () => {
      updateSpectrum();
      createDeformedWord();
      syncInterface();
      const layout = wordLayout(p.width, p.height);
      const x = layout.left * p.width;
      const y = layout.top * p.height;
      const wordWidth = layout.width;
      const wordHeight = layout.height;

      p.background(16, 11, 24);
      p.noStroke();
      for (let index = 0; index < 8; index += 1) {
        const lineX = x + index / 7 * wordWidth;
        p.fill(246, 240, 223, index === 0 || index === 7 ? 24 : 11);
        p.rect(lineX, y, 1, wordHeight);
      }
      p.fill(246, 240, 223, 18);
      p.rect(x, y + wordHeight / 2, wordWidth, 1);

      const context = p.drawingContext;
      context.save();
      context.shadowColor = state.audioActive ? 'rgba(221,246,106,.28)' : 'rgba(255,120,94,.12)';
      context.shadowBlur = state.audioActive && !state.reducedMotion ? 22 : 7;
      context.drawImage(colorCanvas, x, y, wordWidth, wordHeight);
      context.restore();

      const spectrumY = y + wordHeight + (layout.tiny ? 2 : 7);
      const spectrumCount = layout.tiny ? 20 : layout.compact ? 28 : 36;
      for (let index = 0; index < spectrumCount; index += 1) {
        const bin = 1 + Math.floor(index / spectrumCount * 46);
        const energy = state.audioActive ? bins[bin] / 255 : 0;
        const barX = x + index / Math.max(1, spectrumCount - 1) * wordWidth;
        p.fill(116, 223, 208, 54 + energy * 170);
        p.rect(barX, spectrumY, Math.max(1, wordWidth / spectrumCount * .42), 1 + energy * (layout.tiny ? 3 : 8));
      }

      p.fill(246, 240, 223, 72);
      p.textSize(layout.tiny ? 3 : layout.compact ? 4 : 5.5);
      if (!layout.tiny) {
        p.textAlign(p.LEFT, p.TOP);
        p.text('110 HZ', x, spectrumY + 11);
        p.textAlign(p.RIGHT, p.TOP);
        p.text('4 KHZ', x + wordWidth, spectrumY + 11);
        p.textAlign(p.CENTER, p.CENTER);
      }
      state.renderCount += 1;
    };
  }, host);

  const render = () => {
    resizeSketch();
    sketch.redraw();
  };

  const pitchFromPointer = event => {
    const rect = stage.getBoundingClientRect();
    return clamp((event.clientX - rect.left) / Math.max(1, rect.width));
  };

  toneButton.addEventListener('pointerdown', event => event.stopPropagation());
  toneButton.addEventListener('click', event => {
    event.stopPropagation();
    const source = event.detail === 0
      ? 'keyboard:tone-button'
      : event.pointerType ? `pointer:${event.pointerType}:tone-button` : 'click:tone-button';
    toggleLatched(source).catch(markPreviewFailure);
  });
  toneButton.addEventListener('focus', () => { state.buttonFocused = true; });
  toneButton.addEventListener('blur', () => { state.buttonFocused = false; });

  stage.addEventListener('pointerenter', () => { state.pointerInside = true; });
  stage.addEventListener('pointerleave', () => { state.pointerInside = false; });
  stage.addEventListener('pointerdown', event => {
    if (event.target === toneButton) return;
    const isTouch = event.pointerType === 'touch';
    state.pointerHolding = true;
    if (state.pointerCaptureSupported) stage.setPointerCapture(event.pointerId);
    setPitch(pitchFromPointer(event), `${isTouch ? 'touch' : 'pointer'}:${event.pointerType}:pitch`, false);
    setAudioActive(true, `${isTouch ? 'touch' : 'pointer'}:${event.pointerType}:hold`, { latched: state.latched })
      .catch(markPreviewFailure);
  });
  stage.addEventListener('pointermove', event => {
    if (!state.pointerHolding) return;
    state.pointerMoveCount += 1;
    setPitch(pitchFromPointer(event), state.lastInput, false);
  });
  const finishPointer = event => {
    if (!state.pointerHolding) return;
    setPitch(pitchFromPointer(event), state.lastInput, false);
    state.pointerHolding = false;
    if (state.pointerCaptureSupported && stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (!state.latched) setAudioActive(false, state.lastInput, { record: false, latched: false }).catch(markPreviewFailure);
  };
  stage.addEventListener('pointerup', finishPointer);
  stage.addEventListener('pointercancel', finishPointer);
  stage.addEventListener('focus', () => { state.stageFocused = true; });
  stage.addEventListener('blur', event => {
    if (!stage.contains(event.relatedTarget)) state.stageFocused = false;
  });

  stage.addEventListener('keydown', event => {
    if (event.target === toneButton) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleLatched(`keyboard:${event.key === ' ' ? 'Space' : 'Enter'}`).catch(markPreviewFailure);
      return;
    }
    let nextPitch = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') nextPitch = state.pitchNormalized + .08;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') nextPitch = state.pitchNormalized - .08;
    if (event.key === 'Home') nextPitch = 0;
    if (event.key === 'End') nextPitch = 1;
    if (event.key === 'Escape') {
      event.preventDefault();
      state.latched = false;
      setAudioActive(false, 'keyboard:Escape', { latched: false }).catch(markPreviewFailure);
      return;
    }
    if (nextPitch === null) return;
    event.preventDefault();
    setPitch(nextPitch, `keyboard:${event.key}`);
    if (!state.audioActive) setAudioActive(true, `keyboard:${event.key}:activate`, { record: false, latched: true }).catch(markPreviewFailure);
  });

  const handleReducedMotionChange = event => {
    state.reducedMotion = event.matches;
    state.deformationMultiplier = event.matches ? .28 : 1;
    if (analyser) analyser.smoothingTimeConstant = event.matches ? 0 : .68;
    syncInterface();
  };
  if (typeof reducedMotionQuery.addEventListener === 'function') reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  else reducedMotionQuery.addListener(handleReducedMotionChange);

  const silenceForLifecycle = () => {
    state.latched = false;
    if (state.audioActive) setAudioActive(false, 'lifecycle:silence', { record: false, latched: false }).catch(() => {});
  };
  window.addEventListener('pagehide', silenceForLifecycle);
  window.addEventListener('blur', silenceForLifecycle);

  const framebufferChecksum = () => {
    const canvas = host.querySelector('canvas');
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return 0;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const stride = Math.max(4, Math.floor(pixels.length / 2048 / 4) * 4);
    let checksum = 2166136261;
    for (let index = 0; index < pixels.length; index += stride) checksum = Math.imul(checksum ^ pixels[index], 16777619) >>> 0;
    return checksum;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const invariant = (condition, message) => {
      if (!condition) throw new Error(`audio-equalizer-typography: ${message}`);
    };
    const canvas = host.querySelector('canvas');
    const context = canvas?.getContext('2d');
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas?.getBoundingClientRect();
    const controlRect = toneButton.getBoundingClientRect();

    invariant(state.claimedLibrary === 'p5@2.3.0 + Web Audio' && sketch instanceof p5 && state.p5Instance, 'real p5 instance is missing');
    invariant(context instanceof CanvasRenderingContext2D && sketch.drawingContext === context, 'real p5 Canvas2D renderer is missing');
    invariant(typeof AudioContextClass === 'function', 'Web Audio constructor is unavailable');
    invariant(state.word === 'PULSE' && maskCanvas.width === 920 && maskCanvas.height === 320 && state.sliceCount === 230, 'letterform slice geometry changed');
    invariant(state.maskPixelCount === maskPixelCount && maskPixelCount > 40000 && state.maskChecksum === maskChecksum, 'live letterform mask is invalid');
    invariant(bins.length === 128 && state.frequencyBinCount === bins.length && state.analyserFftSize === 256, 'analyser buffer contract changed');
    invariant(!state.audioContextCreated || (audioContext && analyser && oscillator && gainNode && state.analyserConnected && state.oscillatorStarted), 'Web Audio graph is incomplete');
    invariant(!state.audioActive || (audioContext?.state === 'running' && state.analyserReadCount > 0), 'active audio must read the real analyser');
    invariant(state.automaticPlayback === false && state.automaticFallback === false && state.syntheticInputDispatch === false && state.previewClockDrivesSpectrum === false, 'automatic or synthetic spectrum is forbidden');
    invariant(state.inputAdapters.join('|') === 'pointer|touch|click|keyboard', 'input adapter contract changed');
    invariant(state.frequencyHz >= 110 && state.frequencyHz <= 880 && state.pitchNormalized >= 0 && state.pitchNormalized <= 1, 'test-tone pitch escaped its bounds');
    invariant(stage.dataset.audioActive === String(state.audioActive) && stage.dataset.phase === state.phase && Number(stage.dataset.frequency) === state.frequencyHz, 'audio DOM state is stale');
    invariant(toneButton.getAttribute('aria-pressed') === String(state.latched), 'tone control state is stale');
    invariant(state.deformationMultiplier === (state.reducedMotion ? .28 : 1), 'reduced-motion deformation contract changed');
    invariant(!state.audioActive || state.deformationAmount >= 0, 'live deformation state is invalid');
    invariant(!state.audioActive || state.peakMagnitude >= 0, 'live spectrum state is invalid');
    invariant(state.renderCount > 1 && canvas.width === state.canvasWidth && canvas.height === state.canvasHeight, 'p5 render surface is stale');
    invariant(canvasRect.width > 0 && canvasRect.height > 0 && controlRect.width > 0 && controlRect.height > 0, 'audio typography surface or control is not visible');
    invariant(canvasRect.left >= stageRect.left - .5 && canvasRect.right <= stageRect.right + .5 && canvasRect.top >= stageRect.top - .5 && canvasRect.bottom <= stageRect.bottom + .5, 'audio typography canvas escaped the preview');
    invariant(toneButton.type === 'button' && stage.tabIndex === 0 && getComputedStyle(stage).touchAction === 'none', 'pointer and keyboard access changed');
    invariant(state.inputCount > 0 || (state.initialStaticConfirmed && !state.audioActive && state.deformationAmount === 0 && state.phase === 'silent'), 'initial frame must remain static and silent');
    return true;
  };

  syncInterface();

  const doubleFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const ready = Promise.all([setupReady, Promise.resolve(document.fonts?.ready)])
    .then(() => {
      render();
      return doubleFrame().then(() => {
        const before = `${state.audioActive}|${state.pitchNormalized}|${state.frequencyHz}|${state.deformationAmount}|${state.inputCount}`;
        const checksum = framebufferChecksum();
        render();
        return doubleFrame().then(() => {
          const after = `${state.audioActive}|${state.pitchNormalized}|${state.frequencyHz}|${state.deformationAmount}|${state.inputCount}`;
          const nextChecksum = framebufferChecksum();
          state.initialFrameChecksum = checksum;
          state.initialStaticConfirmed = before === after
            && checksum === nextChecksum
            && !state.audioActive
            && state.deformationAmount === 0
            && state.inputCount === 0;
          if (!state.initialStaticConfirmed) throw new Error('Initial audio typography frame changed without user input.');
          if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial audio typography assertion failed.');
        });
      });
    });

  ready.catch(markPreviewFailure);

  installPreviewController({
    id: 'audio-equalizer-typography',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
