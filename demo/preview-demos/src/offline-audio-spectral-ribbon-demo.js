import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('.preview-stage');
  const host = document.querySelector('#spectral-host');
  const statusOutput = document.querySelector('#analysis-status');
  const profileButtons = [...document.querySelectorAll('.profile')];
  const fftSelect = document.querySelector('#fft-size');
  const analyzeButton = document.querySelector('#analyze-audio');
  const keepButton = document.querySelector('#keep-analysis');
  const undoButton = document.querySelector('#undo-result');
  const resetButton = document.querySelector('#reset-analysis');
  const retainedOutput = document.querySelector('#retained-value');
  const peakOutput = document.querySelector('#peak-value');
  const pcmOutput = document.querySelector('#pcm-value');

  const SAMPLE_RATE = 16000;
  const DURATION_SECONDS = .75;
  const SAMPLE_LENGTH = SAMPLE_RATE * DURATION_SECONDS;
  const FRAME_COUNT = 20;
  const BAND_COUNT = 24;
  const MINIMUM_ANALYSIS_STATE_MS = 240;
  const FFT_OPTIONS = [256, 512, 1024];
  const profiles = [
    { id: 'arrival', label: 'Arrival chime', oscillator: 'sine', baseHz: 440, targetHz: 660, overtoneHz: 880, filterHz: 4200 },
    { id: 'warning', label: 'Warning pulse', oscillator: 'sawtooth', baseHz: 220, targetHz: 330, overtoneHz: 660, filterHz: 2700 },
    { id: 'focus', label: 'Focus bloom', oscillator: 'triangle', baseHz: 180, targetHz: 480, overtoneHz: 720, filterHz: 3600 },
  ];

  const state = {
    id: 'offline-audio-spectral-ribbon',
    productTask: 'Generate, inspect, and explicitly retain a notification-sound fingerprint without audible playback.',
    library: 'p5@2.3.0',
    audioApi: 'OfflineAudioContext + deterministic radix-2 FFT',
    renderer: 'canvas2d',
    mechanism: 'trusted controls create a deterministic OfflineAudioContext PCM render; radix-2 FFT frames drive the spectral ribbon',
    assetStrategy: 'code-native-deterministic-audio',
    imageGenDecision: 'omitted: OfflineAudioContext PCM samples and FFT bins are the functional inputs; raster pixels would not affect audio analysis or retention',
    captureType: 'interactive',
    automaticPlayback: false,
    automaticAnalysis: false,
    automaticCycle: false,
    automaticRehearsal: false,
    automaticFallback: false,
    initialStillVerified: false,
    offlineAudioApiAvailable: typeof OfflineAudioContext === 'function',
    trustedPointerInputCount: 0,
    trustedKeyboardInputCount: 0,
    trustedControlInputCount: 0,
    syntheticRejectedCount: 0,
    profileSelectCount: 0,
    parameterChangeCount: 0,
    analysisIntentCount: 0,
    analysisCompletionCount: 0,
    minimumAnalysisStateMs: MINIMUM_ANALYSIS_STATE_MS,
    analysisVisibleDwellCount: 0,
    lastAnalysisVisibleMs: 0,
    offlineContextCreateCount: 0,
    startRenderingCount: 0,
    renderedBufferCount: 0,
    fftCallCount: 0,
    candidateCreateCount: 0,
    keepCount: 0,
    retainVersion: 0,
    prematureCandidateCount: 0,
    prematureCommitCount: 0,
    retainedChangeOutsideKeepCount: 0,
    retainedStableDuringInputEditCount: 0,
    retainedStableDuringAnalysisCount: 0,
    analysisCancelCount: 0,
    undoCount: 0,
    resetCount: 0,
    drawCount: 0,
    ribbonVertexCount: 0,
    canvasCoverage: 0,
    phase: 'idle',
    lastInputType: 'none',
    selectedProfileId: 'arrival',
    selectedFftSize: 512,
    activeAnalysisId: null,
    candidate: null,
    retained: null,
    renderedSampleCount: 0,
    nonZeroSampleCount: 0,
    pcmChecksum: 0,
    pcmRms: 0,
    spectralChecksum: 0,
    spectralFrameCount: 0,
    frequencyBandCount: 0,
    peakHz: 0,
    transactionLog: [],
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let selectedProfileIndex = 0;
  let selectedFftSize = 512;
  let candidate = null;
  let retained = null;
  let undoStack = [];
  let analysisSerial = 0;
  let idlePromise = Promise.resolve();
  let resolveIdle = null;
  let sketch;
  let resolveReady;
  let initialSignature = '';
  let stillRenderCount = 0;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const retainedSignature = () => retained ? `${retained.profileId}|${retained.fftSize}|${retained.spectralChecksum}` : null;

  function record(kind, source, extra = {}) {
    state.transactionLog.push({
      kind,
      source,
      analysisId: state.activeAnalysisId,
      selectedProfileId: profiles[selectedProfileIndex].id,
      selectedFftSize,
      candidateIdentity: candidate ? `${candidate.profileId}|${candidate.fftSize}|${candidate.spectralChecksum}` : null,
      retainedIdentity: retainedSignature(),
      ...extra,
    });
    if (state.transactionLog.length > 24) state.transactionLog.shift();
  }

  function rejectSynthetic(event) {
    if (event.isTrusted) return false;
    state.syntheticRejectedCount += 1;
    return true;
  }

  function refreshUi() {
    const profile = profiles[selectedProfileIndex];
    profileButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === selectedProfileIndex)));
    if (fftSelect.value !== String(selectedFftSize)) fftSelect.value = String(selectedFftSize);
    analyzeButton.disabled = state.phase === 'analyzing';
    keepButton.disabled = !candidate || state.phase === 'analyzing' || Boolean(retained && candidate.analysisId === retained.analysisId);
    undoButton.disabled = undoStack.length === 0 || state.phase === 'analyzing';
    retainedOutput.textContent = retained
      ? `${retained.profileLabel} · ${retained.fftSize} FFT · kept v${state.retainVersion}`
      : 'No analysis kept';
    const metricSource = candidate || retained;
    peakOutput.textContent = metricSource ? `${metricSource.peakHz} Hz` : '— Hz';
    pcmOutput.textContent = metricSource ? `${Math.round(metricSource.pcmRms * 1000)} rms` : 'idle';

    if (state.phase === 'analyzing') {
      statusOutput.dataset.state = 'analyzing';
      statusOutput.textContent = `Rendering ${profile.label} offline`;
    } else if (state.phase === 'retained' && retained) {
      statusOutput.dataset.state = 'retained';
      statusOutput.textContent = `Retained · ${retained.profileLabel}`;
    } else if (candidate) {
      statusOutput.dataset.state = 'candidate';
      statusOutput.textContent = `Candidate · ${profile.label} · Keep to retain`;
    } else if (retained) {
      statusOutput.dataset.state = 'retained';
      statusOutput.textContent = `Retained · ${retained.profileLabel}`;
    } else {
      statusOutput.dataset.state = 'idle';
      statusOutput.textContent = 'Choose sound · analyze offline';
    }

    state.selectedProfileId = profile.id;
    state.selectedFftSize = selectedFftSize;
    state.candidate = candidate ? {
      analysisId: candidate.analysisId,
      profileId: candidate.profileId,
      fftSize: candidate.fftSize,
      spectralChecksum: candidate.spectralChecksum,
      peakHz: candidate.peakHz,
    } : null;
    state.retained = retained ? {
      analysisId: retained.analysisId,
      profileId: retained.profileId,
      fftSize: retained.fftSize,
      spectralChecksum: retained.spectralChecksum,
      peakHz: retained.peakHz,
    } : null;
    state.undoDepth = undoStack.length;
  }

  function clearCandidateForInput(source) {
    const beforeRetained = retainedSignature();
    candidate = null;
    state.phase = retained ? 'retained' : 'idle';
    state.lastInputType = source;
    if (retainedSignature() === beforeRetained) state.retainedStableDuringInputEditCount += 1;
    else state.retainedChangeOutsideKeepCount += 1;
    record('input-edit', source);
    refreshUi();
    sketch?.redraw();
  }

  function selectProfile(index, source) {
    const next = (index + profiles.length) % profiles.length;
    if (next === selectedProfileIndex) return;
    selectedProfileIndex = next;
    state.profileSelectCount += 1;
    clearCandidateForInput(source);
  }

  function selectFftSize(size, source) {
    const next = FFT_OPTIONS.includes(size) ? size : 512;
    if (next === selectedFftSize) return;
    selectedFftSize = next;
    state.parameterChangeCount += 1;
    clearCandidateForInput(source);
  }

  function fftMagnitudes(samples, offset, size) {
    const real = new Float64Array(size);
    const imaginary = new Float64Array(size);
    for (let index = 0; index < size; index += 1) {
      const window = .5 - .5 * Math.cos(2 * Math.PI * index / (size - 1));
      real[index] = samples[offset + index] * window;
    }
    for (let index = 1, reverse = 0; index < size; index += 1) {
      let bit = size >> 1;
      for (; reverse & bit; bit >>= 1) reverse ^= bit;
      reverse ^= bit;
      if (index < reverse) {
        [real[index], real[reverse]] = [real[reverse], real[index]];
        [imaginary[index], imaginary[reverse]] = [imaginary[reverse], imaginary[index]];
      }
    }
    for (let length = 2; length <= size; length <<= 1) {
      const angle = -2 * Math.PI / length;
      const rootReal = Math.cos(angle);
      const rootImaginary = Math.sin(angle);
      for (let start = 0; start < size; start += length) {
        let unitReal = 1;
        let unitImaginary = 0;
        for (let index = 0; index < length / 2; index += 1) {
          const even = start + index;
          const odd = even + length / 2;
          const oddReal = real[odd] * unitReal - imaginary[odd] * unitImaginary;
          const oddImaginary = real[odd] * unitImaginary + imaginary[odd] * unitReal;
          real[odd] = real[even] - oddReal;
          imaginary[odd] = imaginary[even] - oddImaginary;
          real[even] += oddReal;
          imaginary[even] += oddImaginary;
          const nextReal = unitReal * rootReal - unitImaginary * rootImaginary;
          unitImaginary = unitReal * rootImaginary + unitImaginary * rootReal;
          unitReal = nextReal;
        }
      }
    }
    const magnitudes = new Float64Array(size / 2);
    for (let index = 0; index < magnitudes.length; index += 1) magnitudes[index] = Math.hypot(real[index], imaginary[index]) / (size / 2);
    state.fftCallCount += 1;
    return magnitudes;
  }

  function spectrumToBands(magnitudes) {
    const bands = [];
    const maximumBin = magnitudes.length - 1;
    for (let band = 0; band < BAND_COUNT; band += 1) {
      const start = Math.max(1, Math.floor(Math.pow(maximumBin, band / BAND_COUNT)));
      const end = Math.max(start + 1, Math.floor(Math.pow(maximumBin, (band + 1) / BAND_COUNT)));
      let peak = 0;
      for (let bin = start; bin <= Math.min(maximumBin, end); bin += 1) peak = Math.max(peak, magnitudes[bin]);
      const decibels = 20 * Math.log10(Math.max(peak, 1e-6));
      bands.push(clamp((decibels + 78) / 78, 0, 1));
    }
    return bands;
  }

  function analyzePcm(samples, fftSize) {
    const ribbon = [];
    const aggregate = new Float64Array(fftSize / 2);
    for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
      const offset = Math.round(frame * (samples.length - fftSize) / (FRAME_COUNT - 1));
      const magnitudes = fftMagnitudes(samples, offset, fftSize);
      magnitudes.forEach((value, index) => { aggregate[index] += value; });
      ribbon.push(spectrumToBands(magnitudes));
    }
    let peakBin = 1;
    for (let bin = 2; bin < aggregate.length; bin += 1) if (aggregate[bin] > aggregate[peakBin]) peakBin = bin;
    const peakHz = Math.round(peakBin * SAMPLE_RATE / fftSize);
    const spectralChecksum = ribbon.reduce((sum, frame, frameIndex) => sum + frame.reduce((inner, value, bandIndex) => inner + Math.round(value * 1000) * (bandIndex + 1) * (frameIndex + 1), 0), 0);
    return { ribbon, peakHz, spectralChecksum };
  }

  async function renderProfile(profile) {
    const context = new OfflineAudioContext(1, SAMPLE_LENGTH, SAMPLE_RATE);
    state.offlineContextCreateCount += 1;
    const main = context.createOscillator();
    const overtone = context.createOscillator();
    const mainGain = context.createGain();
    const overtoneGain = context.createGain();
    const master = context.createGain();
    const filter = context.createBiquadFilter();
    main.type = profile.oscillator;
    main.frequency.setValueAtTime(profile.baseHz, 0);
    main.frequency.exponentialRampToValueAtTime(profile.targetHz, DURATION_SECONDS * .72);
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(profile.overtoneHz, 0);
    overtone.frequency.exponentialRampToValueAtTime(profile.overtoneHz * 1.06, DURATION_SECONDS);
    mainGain.gain.setValueAtTime(.0001, 0);
    mainGain.gain.exponentialRampToValueAtTime(profile.id === 'warning' ? .58 : .42, .018);
    mainGain.gain.exponentialRampToValueAtTime(.0001, DURATION_SECONDS);
    overtoneGain.gain.setValueAtTime(.0001, 0);
    overtoneGain.gain.exponentialRampToValueAtTime(.16, .025);
    overtoneGain.gain.exponentialRampToValueAtTime(.0001, DURATION_SECONDS * .74);
    if (profile.id === 'warning') {
      mainGain.gain.setValueAtTime(.5, .12);
      mainGain.gain.setValueAtTime(.08, .22);
      mainGain.gain.setValueAtTime(.46, .31);
      mainGain.gain.exponentialRampToValueAtTime(.0001, DURATION_SECONDS);
    }
    filter.type = 'lowpass';
    filter.frequency.value = profile.filterHz;
    filter.Q.value = .8;
    master.gain.value = .86;
    main.connect(mainGain).connect(filter);
    overtone.connect(overtoneGain).connect(filter);
    filter.connect(master).connect(context.destination);
    main.start(0);
    overtone.start(0);
    main.stop(DURATION_SECONDS);
    overtone.stop(DURATION_SECONDS);
    state.startRenderingCount += 1;
    const rendered = await context.startRendering();
    state.renderedBufferCount += 1;
    return new Float32Array(rendered.getChannelData(0));
  }

  async function analyzeSelected(source) {
    if (state.phase === 'analyzing') return;
    const profile = profiles[selectedProfileIndex];
    const fftSize = selectedFftSize;
    const previousRetained = retainedSignature();
    const analysisStartedAt = performance.now();
    const serial = ++analysisSerial;
    state.analysisIntentCount += 1;
    state.activeAnalysisId = serial;
    state.phase = 'analyzing';
    state.lastInputType = source;
    candidate = null;
    record('analysis-intent', source, { profileId: profile.id, fftSize, previousRetained });
    refreshUi();
    sketch?.redraw();
    idlePromise = new Promise(resolve => { resolveIdle = resolve; });
    try {
      const pcm = await renderProfile(profile);
      if (serial !== analysisSerial) {
        state.analysisCancelCount += 1;
        resolveIdle?.();
        return;
      }
      const nonZeroSampleCount = pcm.reduce((count, value) => count + (Math.abs(value) > 1e-5 ? 1 : 0), 0);
      const pcmRms = Math.sqrt(pcm.reduce((sum, value) => sum + value * value, 0) / pcm.length);
      let pcmChecksum = 2166136261;
      for (let index = 0; index < pcm.length; index += 37) {
        pcmChecksum ^= Math.round((pcm[index] + 1) * 32767);
        pcmChecksum = Math.imul(pcmChecksum, 16777619);
      }
      pcmChecksum >>>= 0;
      const spectral = analyzePcm(pcm, fftSize);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const remainingVisibleTime = Math.max(0, MINIMUM_ANALYSIS_STATE_MS - (performance.now() - analysisStartedAt));
      if (remainingVisibleTime > 0) await new Promise(resolve => setTimeout(resolve, remainingVisibleTime));
      if (serial !== analysisSerial) {
        state.analysisCancelCount += 1;
        resolveIdle?.();
        return;
      }
      state.analysisCompletionCount += 1;
      state.analysisVisibleDwellCount += 1;
      state.lastAnalysisVisibleMs = Math.round(performance.now() - analysisStartedAt);
      if (state.analysisCompletionCount < state.analysisIntentCount - state.analysisCancelCount) state.prematureCandidateCount += 1;
      candidate = {
        analysisId: serial,
        profileId: profile.id,
        profileLabel: profile.label,
        fftSize,
        pcmRms,
        pcmChecksum,
        ribbon: spectral.ribbon,
        peakHz: spectral.peakHz,
        spectralChecksum: spectral.spectralChecksum,
      };
      state.candidateCreateCount += 1;
      state.renderedSampleCount = pcm.length;
      state.nonZeroSampleCount = nonZeroSampleCount;
      state.pcmChecksum = pcmChecksum;
      state.pcmRms = Math.round(pcmRms * 1e6) / 1e6;
      state.spectralChecksum = spectral.spectralChecksum;
      state.spectralFrameCount = spectral.ribbon.length;
      state.frequencyBandCount = spectral.ribbon[0]?.length || 0;
      state.peakHz = spectral.peakHz;
      state.ribbonVertexCount = spectral.ribbon.length * (spectral.ribbon[0]?.length || 0);
      if (retainedSignature() === previousRetained) state.retainedStableDuringAnalysisCount += 1;
      else state.retainedChangeOutsideKeepCount += 1;
      state.phase = 'candidate';
      record('analysis-complete', source, { pcmChecksum, spectralChecksum: spectral.spectralChecksum });
      refreshUi();
      sketch?.redraw();
      resolveIdle?.();
      resolveIdle = null;
    } catch (error) {
      resolveIdle?.();
      resolveIdle = null;
      throw error;
    }
  }

  function keepCandidate(source) {
    if (!candidate) {
      state.prematureCommitCount += 1;
      return;
    }
    undoStack.push(retained);
    retained = candidate;
    state.keepCount += 1;
    state.retainVersion += 1;
    state.phase = 'retained';
    state.lastInputType = source;
    record('keep-commit', source);
    refreshUi();
    sketch?.redraw();
  }

  profileButtons.forEach((button, index) => button.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    state.trustedPointerInputCount += 1;
    selectProfile(index, 'pointer-profile');
  }));

  fftSelect.addEventListener('change', event => {
    if (rejectSynthetic(event)) {
      fftSelect.value = String(selectedFftSize);
      return;
    }
    state.trustedControlInputCount += 1;
    selectFftSize(Number(fftSelect.value), 'select-parameter');
  });

  analyzeButton.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    analyzeSelected('analyze-button').catch(markPreviewFailure);
  });

  keepButton.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    keepCandidate('keep-button');
  });

  undoButton.addEventListener('click', event => {
    if (rejectSynthetic(event) || undoStack.length === 0 || state.phase === 'analyzing') return;
    state.trustedControlInputCount += 1;
    retained = undoStack.pop();
    state.undoCount += 1;
    state.phase = candidate ? 'candidate' : retained ? 'retained' : 'idle';
    state.lastInputType = 'undo-button';
    record('undo-retained', 'control');
    refreshUi();
    sketch?.redraw();
  });

  resetButton.addEventListener('click', event => {
    if (rejectSynthetic(event)) return;
    state.trustedControlInputCount += 1;
    if (state.phase === 'analyzing') {
      analysisSerial += 1;
      state.analysisCancelCount += 1;
    }
    selectedProfileIndex = 0;
    selectedFftSize = 512;
    candidate = null;
    retained = null;
    undoStack = [];
    state.resetCount += 1;
    state.phase = 'idle';
    state.activeAnalysisId = null;
    state.lastInputType = 'reset-button';
    record('reset', 'control');
    refreshUi();
    sketch?.redraw();
    resolveIdle?.();
    resolveIdle = null;
  });

  host.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) return;
    if (rejectSynthetic(event)) return;
    event.preventDefault();
    state.trustedKeyboardInputCount += 1;
    if (event.key === 'ArrowLeft') selectProfile(selectedProfileIndex - 1, 'keyboard-profile');
    if (event.key === 'ArrowRight') selectProfile(selectedProfileIndex + 1, 'keyboard-profile');
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const index = FFT_OPTIONS.indexOf(selectedFftSize);
      const direction = event.key === 'ArrowUp' ? 1 : -1;
      selectFftSize(FFT_OPTIONS[(index + direction + FFT_OPTIONS.length) % FFT_OPTIONS.length], 'keyboard-parameter');
    }
    if (event.key === 'Enter') analyzeSelected('keyboard-analyze').catch(markPreviewFailure);
  });

  sketch = new p5(p => {
    function chartBounds() {
      const width = p.width;
      const height = p.height;
      const portrait = width / height < .8;
      const large = width >= 500;
      return portrait
        ? { left: 11, right: width - 11, top: 177, bottom: height - 82 }
        : { left: large ? 239 : 110, right: width - (large ? 21 : 9), top: large ? 84 : 51, bottom: height - (large ? 91 : 48) };
    }

    function drawRibbon(analysis, alpha, highlight) {
      if (!analysis?.ribbon?.length) return;
      const bounds = chartBounds();
      const width = bounds.right - bounds.left;
      const height = bounds.bottom - bounds.top;
      const frames = analysis.ribbon.length;
      const bands = analysis.ribbon[0].length;
      for (let band = bands - 1; band >= 0; band -= 1) {
        const hue = 168 + band / Math.max(1, bands - 1) * 154;
        const baseY = bounds.top + (band + .5) / bands * height;
        p.noFill();
        p.stroke(`hsla(${hue},${highlight ? 88 : 35}%,${highlight ? 68 : 66}%,${alpha})`);
        p.strokeWeight(highlight ? (p.width >= 500 ? 2.2 : 1.35) : 1);
        p.beginShape();
        for (let frame = 0; frame < frames; frame += 1) {
          const x = bounds.left + frame / (frames - 1) * width;
          const energy = analysis.ribbon[frame][band];
          const y = baseY - energy * height * .18;
          p.vertex(x, y);
        }
        p.endShape();
      }
    }

    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(stage.clientWidth, stage.clientHeight).parent(host);
      p.colorMode(p.HSL);
      p.noLoop();
      resolveReady();
    };

    p.windowResized = () => {
      p.resizeCanvas(stage.clientWidth, stage.clientHeight);
      p.redraw();
    };

    p.draw = () => {
      state.drawCount += 1;
      p.clear();
      const bounds = chartBounds();
      const width = bounds.right - bounds.left;
      const height = bounds.bottom - bounds.top;
      p.noStroke();
      p.fill('hsla(215,25%,12%,.64)');
      p.rect(bounds.left - 5, bounds.top - 5, width + 10, height + 10, p.width >= 500 ? 15 : 7);
      p.stroke('hsla(185,24%,74%,.10)');
      p.strokeWeight(1);
      for (let index = 1; index < 6; index += 1) {
        const x = bounds.left + width * index / 6;
        const y = bounds.top + height * index / 6;
        p.line(x, bounds.top, x, bounds.bottom);
        p.line(bounds.left, y, bounds.right, y);
      }
      if (!candidate && !retained) {
        for (let band = 0; band < 12; band += 1) {
          const y = bounds.top + (band + .5) / 12 * height;
          p.stroke('hsla(185,22%,72%,.13)');
          p.line(bounds.left, y, bounds.right, y);
        }
      }
      if (retained && candidate && retained.analysisId !== candidate.analysisId) drawRibbon(retained, .18, false);
      drawRibbon(candidate || retained, candidate ? .72 : .52, true);

      const canvas = host.querySelector('canvas');
      state.canvasCoverage = canvas ? Math.round(canvas.clientWidth * canvas.clientHeight / Math.max(1, p.width * p.height) * 100) / 100 : 0;
      const signature = `${selectedProfileIndex}|${selectedFftSize}|${candidate?.analysisId || 0}|${retained?.analysisId || 0}`;
      if (!initialSignature) initialSignature = signature;
      if (state.trustedPointerInputCount + state.trustedKeyboardInputCount + state.trustedControlInputCount === 0 && signature === initialSignature) {
        stillRenderCount += 1;
        state.initialStillVerified = stillRenderCount >= 2;
      }
      refreshUi();
    };
  }, host);

  window.__PREVIEW_WAIT_FOR_IDLE__ = () => idlePromise;
  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = host.querySelector('canvas');
    const bounds = canvas?.getBoundingClientRect();
    const noAnalysisYet = state.analysisCompletionCount === 0;
    const completedEvidence = state.analysisCompletionCount > 0
      && state.offlineContextCreateCount === state.startRenderingCount
      && state.startRenderingCount === state.renderedBufferCount
      && state.renderedSampleCount === SAMPLE_LENGTH
      && state.nonZeroSampleCount > SAMPLE_LENGTH * .5
      && state.pcmChecksum > 0
      && state.pcmRms > .01
      && state.fftCallCount === state.analysisCompletionCount * FRAME_COUNT
      && state.analysisVisibleDwellCount === state.analysisCompletionCount
      && state.lastAnalysisVisibleMs >= MINIMUM_ANALYSIS_STATE_MS - 16
      && state.spectralFrameCount === FRAME_COUNT
      && state.frequencyBandCount === BAND_COUNT
      && state.spectralChecksum > 1000
      && state.ribbonVertexCount === FRAME_COUNT * BAND_COUNT;
    return sketch instanceof p5
      && state.offlineAudioApiAvailable
      && Boolean(canvas?.getContext('2d'))
      && state.drawCount > 0
      && state.initialStillVerified
      && (noAnalysisYet || completedEvidence)
      && state.candidateCreateCount === state.analysisCompletionCount
      && state.prematureCandidateCount === 0
      && state.prematureCommitCount === 0
      && state.retainedChangeOutsideKeepCount === 0
      && state.automaticPlayback === false
      && state.automaticAnalysis === false
      && state.automaticCycle === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.canvasCoverage >= .98
      && bounds.width >= stage.clientWidth * .98
      && bounds.height >= stage.clientHeight * .98;
  };

  refreshUi();
  installPreviewController({
    id: state.id,
    library: state.library,
    renderer: state.renderer,
    render: () => sketch.redraw(),
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
