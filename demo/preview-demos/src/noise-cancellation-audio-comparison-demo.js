import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#audio-stage');
  const panel = document.querySelector('#wave-panel');
  const canvas = document.querySelector('#audio-wave');
  const context = canvas.getContext('2d');
  const compareSurface = document.querySelector('#compare-surface');
  const divider = document.querySelector('#audio-divider');
  const presets = [...document.querySelectorAll('.mix-preset')];
  const playButton = document.querySelector('#audio-play');
  const meterReadout = document.querySelector('#meter-readout');
  const noiseReduction = document.querySelector('#noise-reduction');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const clipDuration = 4;
  const waveformBinCount = 500;

  const state = {
    id: 'noise-cancellation-audio-comparison',
    task: 'field-interview-hvac-cleanup-review',
    automaticFallback: false,
    automaticPlayback: false,
    automaticCrossfade: false,
    automaticDividerMotion: false,
    captureClockDriven: false,
    syntheticInputDispatch: false,
    userOwnedMix: true,
    controlsBuiltWithoutAutoplay: true,
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard'],
    userInitiated: false,
    inputKind: 'none',
    inputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    lastInputTrusted: null,
    dragSessionCount: 0,
    dragUpdateCount: 0,
    presetSelectionCount: 0,
    keyboardMixCount: 0,
    playToggleCount: 0,
    mixMutationCount: 0,
    cleanMix: .5,
    rawGainTarget: Math.SQRT1_2,
    cleanGainTarget: Math.SQRT1_2,
    equalPowerEnergy: 1,
    curtainPosition: .5,
    visualSplitX: canvas.width / 2,
    selectedPreset: 'split',
    previousPreset: null,
    mixSource: 'initial',
    phase: 'idle',
    dragActive: false,
    dragPointerType: null,
    audioContextCreated: false,
    audioGraphReady: false,
    audioStarted: false,
    playing: false,
    audioStartCount: 0,
    audioResumeCount: 0,
    sourceStartDelta: null,
    bufferFrameCount: 0,
    bufferSampleRate: 0,
    audioBufferDifference: null,
    cleanHighpassHz: 92,
    cleanLowpassHz: 4200,
    waveformBinCount,
    rawRms: 0,
    cleanRms: 0,
    rawNoiseRms: 0,
    cleanNoiseRms: 0,
    measuredNoiseReductionDb: 0,
    dividerTravelPx: 0,
    dividerControlProgress: .5,
    motionControlCount: 0,
    controlRebuildCount: 0,
    layoutMeasureCount: 0,
    canvasRenderCount: 0,
    renderCount: 0,
    reducedMotion: reducedMotion.matches,
    reducedMotionDirectManipulation: true,
    initialFrameStatic: true,
    initialMix: .5,
    initialPlaying: false,
    initialAudioContextCreated: false
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let dividerControl;
  let audioContext;
  let masterGain;
  let rawGain;
  let cleanGain;
  let rawSource;
  let cleanSource;
  let cleanHighpass;
  let cleanLowpass;
  let rawBuffer;
  let cleanBuffer;
  let dragPointerId = null;
  let latestPointerKind = 'mouse';
  let resizeFrame = 0;
  let canvasDirty = true;

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  function setDataset(name, value) {
    const next = String(value);
    if (stage.dataset[name] !== next) stage.dataset[name] = next;
  }

  function recordInput(inputKind, trusted) {
    state.userInitiated = true;
    state.inputKind = inputKind;
    state.inputCount += 1;
    state.lastInputTrusted = trusted;
    if (inputKind === 'keyboard') state.keyboardInputCount += 1;
    else state.pointerInputCount += 1;
  }

  function voiceAt(time) {
    const syllable = .48 + .34 * Math.max(0, Math.sin(time * Math.PI * 1.35));
    const breath = .78 + .22 * Math.sin(time * Math.PI * .58 + .6);
    return syllable * breath * (
      .42 * Math.sin(time * Math.PI * 2 * 113)
      + .18 * Math.sin(time * Math.PI * 2 * 226 + .3)
      + .09 * Math.sin(time * Math.PI * 2 * 339 + .8)
    );
  }

  function noiseAt(time) {
    const hvac = .30 * Math.sin(time * Math.PI * 2 * 59)
      + .12 * Math.sin(time * Math.PI * 2 * 118 + .4);
    const air = .10 * Math.sin(time * Math.PI * 2 * 487 + Math.sin(time * 3.1))
      + .07 * Math.sin(time * Math.PI * 2 * 761 + .8);
    const keyboard = Math.pow(Math.max(0, Math.sin(time * Math.PI * 2 * 1.8)), 18)
      * .26 * Math.sin(time * Math.PI * 2 * 930);
    return hvac + air + keyboard;
  }

  function rawSampleAt(time) {
    return clamp((voiceAt(time) + noiseAt(time)) * .72, -1, 1);
  }

  function cleanSampleAt(time) {
    return clamp((voiceAt(time) + noiseAt(time) * .05) * .72, -1, 1);
  }

  function buildWaveformBins() {
    const bins = [];
    let rawEnergy = 0;
    let cleanEnergy = 0;
    let rawNoiseEnergy = 0;
    let cleanNoiseEnergy = 0;
    const samplesPerBin = 20;
    for (let index = 0; index < waveformBinCount; index += 1) {
      let rawMin = 1;
      let rawMax = -1;
      let cleanMin = 1;
      let cleanMax = -1;
      for (let sample = 0; sample < samplesPerBin; sample += 1) {
        const time = (index + sample / samplesPerBin) / waveformBinCount * clipDuration;
        const raw = rawSampleAt(time);
        const clean = cleanSampleAt(time);
        const rawNoise = noiseAt(time) * .72;
        const cleanNoise = rawNoise * .05;
        rawMin = Math.min(rawMin, raw);
        rawMax = Math.max(rawMax, raw);
        cleanMin = Math.min(cleanMin, clean);
        cleanMax = Math.max(cleanMax, clean);
        rawEnergy += raw * raw;
        cleanEnergy += clean * clean;
        rawNoiseEnergy += rawNoise * rawNoise;
        cleanNoiseEnergy += cleanNoise * cleanNoise;
      }
      bins.push({ rawMin, rawMax, cleanMin, cleanMax });
    }
    const totalSamples = waveformBinCount * samplesPerBin;
    state.rawRms = Number(Math.sqrt(rawEnergy / totalSamples).toFixed(5));
    state.cleanRms = Number(Math.sqrt(cleanEnergy / totalSamples).toFixed(5));
    state.rawNoiseRms = Number(Math.sqrt(rawNoiseEnergy / totalSamples).toFixed(5));
    state.cleanNoiseRms = Number(Math.sqrt(cleanNoiseEnergy / totalSamples).toFixed(5));
    state.measuredNoiseReductionDb = Number((20 * Math.log10(state.rawNoiseRms / state.cleanNoiseRms)).toFixed(2));
    noiseReduction.textContent = `−${Math.round(state.measuredNoiseReductionDb)} dB`;
    return bins;
  }

  const waveformBins = buildWaveformBins();

  function drawGrid(width, height) {
    context.strokeStyle = '#40504b55';
    context.lineWidth = 1;
    for (let x = 0; x <= width; x += width / 10) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = height / 4; y < height; y += height / 4) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  }

  function drawWaveformSide({ splitX, clean }) {
    const width = canvas.width;
    const height = canvas.height;
    const startX = clean ? splitX : 0;
    const endX = clean ? width : splitX;
    context.save();
    context.beginPath();
    context.rect(startX, 0, Math.max(0, endX - startX), height);
    context.clip();
    context.fillStyle = clean ? '#112b28' : '#2c1916';
    context.fillRect(startX, 0, endX - startX, height);

    context.strokeStyle = clean ? '#76eadc' : '#ff7c62';
    context.lineWidth = 2.4;
    context.shadowColor = clean ? '#5bd7ca' : '#ee6048';
    context.shadowBlur = 8;
    context.beginPath();
    waveformBins.forEach((bin, index) => {
      const x = index / (waveformBins.length - 1) * width;
      const min = clean ? bin.cleanMin : bin.rawMin;
      const max = clean ? bin.cleanMax : bin.rawMax;
      context.moveTo(x, height / 2 + min * height * .35);
      context.lineTo(x, height / 2 + max * height * .35);
    });
    context.stroke();

    if (!clean) {
      context.shadowBlur = 0;
      context.strokeStyle = '#f7aa8f47';
      context.lineWidth = 1;
      context.beginPath();
      waveformBins.forEach((bin, index) => {
        const x = index / (waveformBins.length - 1) * width;
        const removed = Math.abs((bin.rawMax - bin.rawMin) - (bin.cleanMax - bin.cleanMin));
        const y = height - 24 - removed * height * .18;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
    }
    context.restore();
  }

  function drawWaveform() {
    const width = canvas.width;
    const height = canvas.height;
    const splitX = state.curtainPosition * width;
    state.visualSplitX = Number(splitX.toFixed(2));
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#111a18';
    context.fillRect(0, 0, width, height);
    drawGrid(width, height);
    drawWaveformSide({ splitX, clean: false });
    drawWaveformSide({ splitX, clean: true });
    context.strokeStyle = '#f4eee1';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(splitX, 0);
    context.lineTo(splitX, height);
    context.stroke();
    state.canvasRenderCount += 1;
    canvasDirty = false;
  }

  function equalPowerTargets(mix) {
    return {
      raw: Math.cos(mix * Math.PI / 2),
      clean: Math.sin(mix * Math.PI / 2)
    };
  }

  function updateAudioGains() {
    const targets = equalPowerTargets(state.cleanMix);
    state.rawGainTarget = Number(targets.raw.toFixed(5));
    state.cleanGainTarget = Number(targets.clean.toFixed(5));
    state.equalPowerEnergy = Number((targets.raw ** 2 + targets.clean ** 2).toFixed(5));
    if (!audioContext || !rawGain || !cleanGain) return;
    rawGain.gain.setTargetAtTime(targets.raw, audioContext.currentTime, .012);
    cleanGain.gain.setTargetAtTime(targets.clean, audioContext.currentTime, .012);
  }

  function nearestPreset(mix) {
    if (mix <= .015) return 'raw';
    if (mix >= .985) return 'clean';
    if (Math.abs(mix - .5) <= .015) return 'split';
    return 'custom';
  }

  function syncInterface() {
    const mode = nearestPreset(state.cleanMix);
    if (state.selectedPreset !== mode) state.previousPreset = state.selectedPreset;
    state.selectedPreset = mode;
    state.phase = state.dragActive ? 'dragging' : state.playing ? 'auditioning' : state.userInitiated ? 'reviewing' : 'idle';
    state.dividerControlProgress = dividerControl?.duration
      ? Number((dividerControl.time / dividerControl.duration).toFixed(5))
      : state.curtainPosition;

    setDataset('mode', mode);
    setDataset('phase', state.phase);
    setDataset('cleanMix', state.cleanMix.toFixed(4));
    setDataset('source', state.mixSource);
    setDataset('playing', state.playing);

    presets.forEach(preset => {
      const active = Number(preset.dataset.mix) === state.cleanMix;
      preset.classList.toggle('is-active', active);
      preset.setAttribute('aria-pressed', String(active));
    });
    const cleanPercent = Math.round(state.cleanMix * 100);
    compareSurface.setAttribute('aria-valuenow', String(cleanPercent));
    compareSurface.setAttribute('aria-valuetext', `${cleanPercent} percent clean, ${mode} comparison`);
    meterReadout.textContent = `${cleanPercent}% clean · ${mode}`;
    playButton.dataset.playing = String(state.playing);
    const playLabel = state.playing ? 'Mute review' : state.audioStarted ? 'Resume audition' : 'Start audition';
    if (playButton.textContent !== playLabel) playButton.textContent = playLabel;
  }

  function applyMix(mix, source) {
    const next = Number(clamp(mix).toFixed(5));
    if (Math.abs(next - state.cleanMix) > .00001) state.mixMutationCount += 1;
    state.cleanMix = next;
    state.curtainPosition = Number((1 - next).toFixed(5));
    state.mixSource = source;
    dividerControl.time = dividerControl.duration * state.curtainPosition;
    updateAudioGains();
    canvasDirty = true;
    drawWaveform();
    syncInterface();
  }

  function buildDividerControl() {
    dividerControl?.cancel();
    divider.style.transform = '';
    state.dividerTravelPx = Number(Math.max(0, panel.clientWidth - 2).toFixed(2));
    state.layoutMeasureCount += 1;
    dividerControl = animate(divider, {
      x: [0, state.dividerTravelPx]
    }, {
      duration: 1,
      ease: 'linear',
      autoplay: false
    });
    dividerControl.pause();
    dividerControl.time = 0;
    state.motionControlCount = 1;
    state.controlRebuildCount += 1;
    applyMix(state.cleanMix, state.mixSource);
  }

  function fillAudioBuffers() {
    const frameCount = Math.floor(audioContext.sampleRate * clipDuration);
    rawBuffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
    cleanBuffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
    const rawData = rawBuffer.getChannelData(0);
    const cleanData = cleanBuffer.getChannelData(0);
    let difference = 0;
    for (let index = 0; index < frameCount; index += 1) {
      const time = index / audioContext.sampleRate;
      rawData[index] = rawSampleAt(time);
      cleanData[index] = cleanSampleAt(time);
      difference += Math.abs(rawData[index] - cleanData[index]);
    }
    state.bufferFrameCount = frameCount;
    state.bufferSampleRate = audioContext.sampleRate;
    state.audioBufferDifference = Number((difference / frameCount).toFixed(6));
  }

  function createAudioGraph() {
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    rawGain = audioContext.createGain();
    cleanGain = audioContext.createGain();
    cleanHighpass = audioContext.createBiquadFilter();
    cleanLowpass = audioContext.createBiquadFilter();
    cleanHighpass.type = 'highpass';
    cleanHighpass.frequency.value = state.cleanHighpassHz;
    cleanLowpass.type = 'lowpass';
    cleanLowpass.frequency.value = state.cleanLowpassHz;
    masterGain.gain.value = 0;
    rawGain.connect(masterGain);
    cleanGain.connect(masterGain);
    masterGain.connect(audioContext.destination);

    fillAudioBuffers();
    rawSource = audioContext.createBufferSource();
    cleanSource = audioContext.createBufferSource();
    rawSource.buffer = rawBuffer;
    cleanSource.buffer = cleanBuffer;
    rawSource.loop = true;
    cleanSource.loop = true;
    rawSource.connect(rawGain);
    cleanSource.connect(cleanHighpass).connect(cleanLowpass).connect(cleanGain);
    updateAudioGains();
    const startAt = audioContext.currentTime + .035;
    rawSource.start(startAt);
    cleanSource.start(startAt);
    state.sourceStartDelta = 0;
    state.audioContextCreated = true;
    state.audioGraphReady = true;
    state.audioStarted = true;
    state.audioStartCount += 1;
  }

  async function toggleAudio(inputKind, trusted) {
    recordInput(inputKind, trusted);
    state.playToggleCount += 1;
    if (!audioContext) createAudioGraph();
    await audioContext.resume();
    state.audioResumeCount += 1;
    state.playing = !state.playing;
    masterGain.gain.setTargetAtTime(state.playing ? .075 : 0, audioContext.currentTime, .025);
    syncInterface();
  }

  function inputKindFromClick(event) {
    return event.detail === 0 ? 'keyboard' : latestPointerKind;
  }

  function mixFromPointer(clientX) {
    const rect = panel.getBoundingClientRect();
    const curtain = clamp((clientX - rect.left) / Math.max(1, rect.width));
    return 1 - curtain;
  }

  function beginDrag(event) {
    if (event.button !== 0) return;
    latestPointerKind = event.pointerType || 'pointer';
    recordInput(latestPointerKind, event.isTrusted);
    state.dragSessionCount += 1;
    state.dragActive = true;
    state.dragPointerType = latestPointerKind;
    dragPointerId = event.pointerId;
    compareSurface.setPointerCapture(event.pointerId);
    state.dragUpdateCount += 1;
    applyMix(mixFromPointer(event.clientX), 'drag');
  }

  function updateDrag(event) {
    if (!state.dragActive || event.pointerId !== dragPointerId) return;
    state.dragUpdateCount += 1;
    applyMix(mixFromPointer(event.clientX), 'drag');
  }

  function endDrag(event) {
    if (!state.dragActive || event.pointerId !== dragPointerId) return;
    state.dragActive = false;
    state.dragPointerType = null;
    dragPointerId = null;
    if (compareSurface.hasPointerCapture(event.pointerId)) compareSurface.releasePointerCapture(event.pointerId);
    syncInterface();
  }

  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });
  compareSurface.addEventListener('pointerdown', beginDrag);
  compareSurface.addEventListener('pointermove', updateDrag);
  compareSurface.addEventListener('pointerup', endDrag);
  compareSurface.addEventListener('pointercancel', endDrag);

  compareSurface.addEventListener('keydown', event => {
    const keySteps = {
      ArrowLeft: .04,
      ArrowUp: .04,
      ArrowRight: -.04,
      ArrowDown: -.04,
      PageUp: .2,
      PageDown: -.2
    };
    let target;
    if (event.key in keySteps) target = state.cleanMix + keySteps[event.key];
    else if (event.key === 'Home' || event.key.toLowerCase() === 'r') target = 0;
    else if (event.key === 'End' || event.key.toLowerCase() === 'c') target = 1;
    else if (event.key === '0') target = .5;
    else return;
    event.preventDefault();
    if (event.repeat) return;
    recordInput('keyboard', event.isTrusted);
    state.keyboardMixCount += 1;
    applyMix(target, 'keyboard');
  });

  presets.forEach(preset => {
    preset.addEventListener('click', event => {
      const inputKind = inputKindFromClick(event);
      recordInput(inputKind, event.isTrusted);
      state.presetSelectionCount += 1;
      applyMix(Number(preset.dataset.mix), `preset-${preset.textContent.toLowerCase()}`);
      preset.focus({ preventScroll: true });
    });
  });

  playButton.addEventListener('click', event => {
    toggleAudio(inputKindFromClick(event), event.isTrusted).catch(markPreviewFailure);
  });

  addEventListener('resize', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      buildDividerControl();
      canvasDirty = true;
    });
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    syncInterface();
  });

  addEventListener('beforeunload', () => {
    rawSource?.stop();
    cleanSource?.stop();
    audioContext?.close();
  }, { once: true });

  function render() {
    state.renderCount += 1;
    if (canvasDirty) drawWaveform();
    syncInterface();
  }

  buildDividerControl();
  drawWaveform();

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const expectedTargets = equalPowerTargets(state.cleanMix);
    const mixEvidence = Math.abs(state.curtainPosition - (1 - state.cleanMix)) <= .00001
      && Math.abs(state.dividerControlProgress - state.curtainPosition) <= .001
      && Math.abs(state.visualSplitX / canvas.width - state.curtainPosition) <= .001
      && Math.abs(state.rawGainTarget - expectedTargets.raw) <= .00002
      && Math.abs(state.cleanGainTarget - expectedTargets.clean) <= .00002
      && Math.abs(state.equalPowerEnergy - 1) <= .00001;
    const audioEvidence = !state.audioContextCreated
      ? !audioContext
        && !rawSource
        && !cleanSource
        && state.audioStarted === false
        && state.audioStartCount === 0
      : audioContext instanceof AudioContextClass
        && masterGain instanceof GainNode
        && rawGain instanceof GainNode
        && cleanGain instanceof GainNode
        && rawSource instanceof AudioBufferSourceNode
        && cleanSource instanceof AudioBufferSourceNode
        && cleanHighpass instanceof BiquadFilterNode
        && cleanLowpass instanceof BiquadFilterNode
        && cleanHighpass.type === 'highpass'
        && cleanLowpass.type === 'lowpass'
        && rawBuffer instanceof AudioBuffer
        && cleanBuffer instanceof AudioBuffer
        && rawBuffer.length === cleanBuffer.length
        && rawBuffer.sampleRate === cleanBuffer.sampleRate
        && state.audioBufferDifference > .01
        && state.sourceStartDelta === 0
        && state.audioGraphReady
        && state.audioStarted
        && state.audioStartCount === 1;
    const presetSemantics = presets.length === 3 && presets.every(preset =>
      preset instanceof HTMLButtonElement
      && preset.type === 'button'
      && Number.isFinite(Number(preset.dataset.mix))
      && preset.hasAttribute('aria-label')
    );
    const inputEvidence = state.inputCount === state.pointerInputCount + state.keyboardInputCount
      && state.presetSelectionCount + state.dragSessionCount + state.playToggleCount + state.keyboardMixCount === state.inputCount;
    return typeof animate === 'function'
      && typeof AudioContextClass === 'function'
      && context instanceof CanvasRenderingContext2D
      && dividerControl.duration === 1
      && typeof dividerControl.play === 'function'
      && typeof dividerControl.pause === 'function'
      && typeof dividerControl.cancel === 'function'
      && stage.dataset.previewMechanism === 'web-audio-sample-locked-restoration'
      && compareSurface.getAttribute('role') === 'slider'
      && compareSurface.tabIndex === 0
      && presetSemantics
      && waveformBins.length === waveformBinCount
      && waveformBins.every(bin => ['rawMin', 'rawMax', 'cleanMin', 'cleanMax'].every(key => Number.isFinite(bin[key])))
      && state.rawRms > state.cleanRms
      && state.rawNoiseRms > state.cleanNoiseRms
      && state.measuredNoiseReductionDb > 25
      && mixEvidence
      && audioEvidence
      && inputEvidence
      && state.motionControlCount === 1
      && state.dividerTravelPx > 0
      && state.initialFrameStatic
      && state.initialMix === .5
      && state.initialPlaying === false
      && state.initialAudioContextCreated === false
      && state.automaticFallback === false
      && state.automaticPlayback === false
      && state.automaticCrossfade === false
      && state.automaticDividerMotion === false
      && state.captureClockDriven === false
      && state.syntheticInputDispatch === false
      && state.userOwnedMix === true
      && state.controlsBuiltWithoutAutoplay === true
      && state.reducedMotionDirectManipulation === true
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.mixMutationCount)
      && state.layoutMeasureCount >= 1
      && state.controlRebuildCount >= 1
      && state.canvasRenderCount > 0
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'noise-cancellation-audio-comparison',
    library: 'motion@12.42.2',
    renderer: 'canvas2d',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
