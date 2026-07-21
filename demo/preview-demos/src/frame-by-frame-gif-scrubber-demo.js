import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const GIF_ASSET_URL = new URL('../assets/aesthetic-wave-01/frame-by-frame-gif-scrubber/occlusion-check.gif', import.meta.url).href;
const EXPECTED_GIF_SHA256 = 'd9541344f4edc43a137a0e68a856183173463adca25d7cc59aeac33e3c0e2b77';
const EXPECTED_FRAME_COUNT = 12;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

function uint16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function skipSubBlocks(bytes, startOffset) {
  let offset = startOffset;
  while (offset < bytes.length) {
    const blockLength = bytes[offset];
    offset += 1;
    if (blockLength === 0) return offset;
    offset += blockLength;
  }
  throw new Error('GIF sub-block runs past the end of the file');
}

function parseGifMetadata(bytes) {
  const signature = String.fromCharCode(...bytes.slice(0, 6));
  if (signature !== 'GIF89a' && signature !== 'GIF87a') throw new Error('Required asset is not a GIF file');
  const width = uint16(bytes, 6);
  const height = uint16(bytes, 8);
  const packedFields = bytes[10];
  const hasGlobalColorTable = (packedFields & 0x80) !== 0;
  const globalColorTableSize = hasGlobalColorTable ? 3 * (2 ** ((packedFields & 0x07) + 1)) : 0;
  let offset = 13 + globalColorTableSize;
  let pendingControl = null;
  const frames = [];

  while (offset < bytes.length) {
    const marker = bytes[offset];
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const label = bytes[offset + 1];
      if (label === 0xf9) {
        const blockSize = bytes[offset + 2];
        if (blockSize !== 4) throw new Error('Unexpected GIF Graphics Control Extension size');
        const controlPacked = bytes[offset + 3];
        pendingControl = {
          disposal: (controlPacked >> 2) & 0x07,
          transparent: (controlPacked & 0x01) === 1,
          delayMs: uint16(bytes, offset + 4) * 10,
          transparentColorIndex: bytes[offset + 6],
        };
        offset += 8;
      } else {
        offset = skipSubBlocks(bytes, offset + 2);
      }
      continue;
    }
    if (marker === 0x2c) {
      const left = uint16(bytes, offset + 1);
      const top = uint16(bytes, offset + 3);
      const frameWidth = uint16(bytes, offset + 5);
      const frameHeight = uint16(bytes, offset + 7);
      const descriptorPacked = bytes[offset + 9];
      const hasLocalColorTable = (descriptorPacked & 0x80) !== 0;
      const isInterlaced = (descriptorPacked & 0x40) !== 0;
      const localColorTableSize = hasLocalColorTable ? 3 * (2 ** ((descriptorPacked & 0x07) + 1)) : 0;
      offset += 10 + localColorTableSize;
      const lzwMinimumCodeSize = bytes[offset];
      offset = skipSubBlocks(bytes, offset + 1);
      const control = pendingControl || {
        disposal: 0,
        transparent: false,
        delayMs: 0,
        transparentColorIndex: 0,
      };
      frames.push({
        index: frames.length,
        left,
        top,
        width: frameWidth,
        height: frameHeight,
        isInterlaced,
        lzwMinimumCodeSize,
        ...control,
      });
      pendingControl = null;
      continue;
    }
    throw new Error(`Unexpected GIF block marker 0x${marker.toString(16)}`);
  }

  return {
    signature,
    width,
    height,
    hasGlobalColorTable,
    trailerFound: bytes[offset] === 0x3b,
    frames,
  };
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function decodedFrameChecksum(bitmap) {
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 80;
  sampleCanvas.height = 54;
  const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0, sampleCanvas.width, sampleCanvas.height);
  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  let hash = 2166136261;
  for (let index = 0; index < pixels.length; index += 13) {
    hash ^= pixels[index];
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function loadGifAsset(state) {
  if (typeof ImageDecoder !== 'function') throw new Error('Native ImageDecoder GIF support is required');
  const response = await fetch(GIF_ASSET_URL);
  if (!response.ok) throw new Error(`GIF asset request failed with status ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const metadata = parseGifMetadata(bytes);
  const rawChecksum = await sha256Hex(bytes);
  if (rawChecksum !== EXPECTED_GIF_SHA256) throw new Error('GIF byte checksum does not match the committed QA asset');

  const decoder = new ImageDecoder({ data: bytes, type: 'image/gif' });
  await decoder.tracks.ready;
  const track = decoder.tracks.selectedTrack;
  if (!track || track.frameCount !== metadata.frames.length) throw new Error('Native decoder frame count differs from parsed GIF metadata');

  const decodedFrames = [];
  for (let frameIndex = 0; frameIndex < track.frameCount; frameIndex += 1) {
    const result = await decoder.decode({ frameIndex, completeFramesOnly: true });
    const videoFrame = result.image;
    const nativeDurationMs = Number(videoFrame.duration) / 1000;
    const nativeTimestampMs = Number(videoFrame.timestamp) / 1000;
    const bitmap = await createImageBitmap(videoFrame);
    videoFrame.close();
    decodedFrames.push({
      ...metadata.frames[frameIndex],
      nativeDurationMs,
      nativeTimestampMs,
      complete: result.complete === true,
      bitmap,
      pixelChecksum: decodedFrameChecksum(bitmap),
    });
  }
  decoder.close();

  state.gifAssetDecoded = true;
  state.gifByteLength = bytes.byteLength;
  state.gifRawChecksum = rawChecksum;
  state.gifSignature = metadata.signature;
  state.gifWidth = metadata.width;
  state.gifHeight = metadata.height;
  state.gifTrailerFound = metadata.trailerFound;
  state.parsedFrameCount = metadata.frames.length;
  state.decodedFrameCount = decodedFrames.length;
  state.completeFrameCount = decodedFrames.filter(frame => frame.complete).length;
  state.uniqueFrameChecksumCount = new Set(decodedFrames.map(frame => frame.pixelChecksum)).size;
  state.frameChecksums = decodedFrames.map(frame => frame.pixelChecksum);
  state.frameDurationsMs = decodedFrames.map(frame => frame.delayMs);
  state.nativeFrameDurationsMs = decodedFrames.map(frame => frame.nativeDurationMs);
  state.frameTimestampsMs = decodedFrames.map(frame => frame.nativeTimestampMs);
  state.disposalMethods = decodedFrames.map(frame => frame.disposal);
  state.frameRects = decodedFrames.map(frame => [frame.left, frame.top, frame.width, frame.height]);
  state.totalDurationMs = decodedFrames.reduce((total, frame) => total + frame.delayMs, 0);
  return decodedFrames;
}

try {
  const stage = document.querySelector('#gif-stage');
  const host = document.querySelector('#gif-host');
  const slider = document.querySelector('#gif-slider');
  const frameOutput = document.querySelector('#frame-output');
  const delayOutput = document.querySelector('#delay-output');
  const disposalOutput = document.querySelector('#disposal-output');
  const frameTicks = document.querySelector('#frame-ticks');
  const resetControl = document.querySelector('#reset-control');
  const playControl = document.querySelector('[data-action="play"]');
  const previousControl = document.querySelector('[data-action="previous"]');
  const nextControl = document.querySelector('[data-action="next"]');
  const runtimeLedger = document.querySelector('#runtime-ledger');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'frame-by-frame-gif-scrubber',
    task: 'human-operated-animation-asset-frame-inspection',
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'control'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockDriven: false,
    previewClockMutation: false,
    syntheticInputDispatch: false,
    decoder: 'native-ImageDecoder-completeFramesOnly',
    gifAssetDecoded: false,
    gifAssetUrl: GIF_ASSET_URL,
    gifByteLength: 0,
    gifRawChecksum: '',
    gifSignature: '',
    gifWidth: 0,
    gifHeight: 0,
    gifTrailerFound: false,
    parsedFrameCount: 0,
    decodedFrameCount: 0,
    completeFrameCount: 0,
    uniqueFrameChecksumCount: 0,
    frameChecksums: [],
    frameDurationsMs: [],
    nativeFrameDurationsMs: [],
    frameTimestampsMs: [],
    disposalMethods: [],
    frameRects: [],
    totalDurationMs: 0,
    currentFrameIndex: 0,
    firstFramePaused: true,
    initialStillVerified: false,
    playbackActive: false,
    playbackStartedByTrustedInput: false,
    playbackStartCount: 0,
    playbackPauseCount: 0,
    playbackFrameAdvanceCount: 0,
    reducedMotion: reducedMotionQuery.matches,
    reducedMotionStepCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedCount: 0,
    pointerInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    rangeInputCount: 0,
    rangeDragCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    stepCount: 0,
    resetCount: 0,
    drawCount: 0,
    resizeCount: 0,
    redrawRequestCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    lastRejectedSource: 'none',
    activeRangePointerId: null,
    activeRangePointerType: 'none',
    pointerCaptured: false,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  const decodedFrames = await loadGifAsset(state);
  const tickNodes = decodedFrames.map((_, frameIndex) => {
    const tick = document.createElement('i');
    tick.dataset.frame = String(frameIndex);
    frameTicks.append(tick);
    return tick;
  });

  let sketch;
  let resolveFirstDraw;
  let playbackRequest = 0;
  let playbackTimestamp = null;
  let playbackRemainderMs = 0;
  let latestControlPointerKind = 'mouse';
  const firstDrawReady = new Promise(resolve => { resolveFirstDraw = resolve; });

  function disposalLabel(method) {
    if (method === 1) return 'KEEP';
    if (method === 2) return 'BG';
    if (method === 3) return 'PREV';
    return 'NONE';
  }

  function rejectUntrusted(event, source) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedCount += 1;
    state.lastRejectedSource = source;
    state.lastInputTrusted = false;
    syncLedger();
    return true;
  }

  function recordTrustedInput(event, kind, source) {
    if (rejectUntrusted(event, source)) return false;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    else if (kind === 'control') state.controlInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (kind === 'touch') state.touchInputCount += 1;
      if (kind === 'pen') state.penInputCount += 1;
    }
    return true;
  }

  function syncLedger() {
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedCount = String(state.rejectedUntrustedCount);
    stage.dataset.decodedFrameCount = String(state.decodedFrameCount);
    stage.dataset.uniqueFrameChecksumCount = String(state.uniqueFrameChecksumCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerReleaseCount = String(state.pointerReleaseCount);
    stage.dataset.rangeInputCount = String(state.rangeInputCount);
    stage.dataset.keyboardInputCount = String(state.keyboardInputCount);
    stage.dataset.resetCount = String(state.resetCount);
    stage.dataset.currentFrameIndex = String(state.currentFrameIndex);
    stage.dataset.playbackActive = String(state.playbackActive);
    stage.dataset.strictTrustedInputGuard = String(state.strictTrustedInputGuard);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.previewClockMutation = String(state.previewClockMutation);
    if (typeof window.__PREVIEW_RUNTIME_ASSERT__ === 'function') {
      stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__());
    }
    runtimeLedger.textContent = [
      `runtime ${stage.dataset.runtimeAssert || 'pending'}`,
      `frame ${state.currentFrameIndex + 1} of ${state.decodedFrameCount}`,
      `decoded ${state.decodedFrameCount}`,
      `unique checksums ${state.uniqueFrameChecksumCount}`,
      `GIF checksum ${state.gifRawChecksum.slice(0, 12)}`,
      `trusted inputs ${state.trustedInputCount}`,
      `rejected untrusted ${state.rejectedUntrustedCount}`,
      `range inputs ${state.rangeInputCount}`,
      `captures ${state.pointerCaptureCount}`,
      `releases ${state.pointerReleaseCount}`,
      `keyboard inputs ${state.keyboardInputCount}`,
      `resets ${state.resetCount}`,
      `automatic playback ${state.automaticPlayback}`,
      `preview clock mutation ${state.previewClockMutation}`,
    ].join('; ');
  }

  function updateInterface() {
    const current = decodedFrames[state.currentFrameIndex];
    frameOutput.textContent = `${String(state.currentFrameIndex + 1).padStart(2, '0')} / ${decodedFrames.length}`;
    delayOutput.textContent = `${current.delayMs} ms`;
    disposalOutput.textContent = `${current.disposal} · ${disposalLabel(current.disposal)}`;
    slider.value = String(state.currentFrameIndex);
    slider.setAttribute(
      'aria-valuetext',
      `Frame ${state.currentFrameIndex + 1} of ${decodedFrames.length}, ${current.delayMs} milliseconds, disposal ${disposalLabel(current.disposal).toLowerCase()}`,
    );
    playControl.setAttribute('aria-pressed', String(state.playbackActive));
    playControl.setAttribute('aria-label', state.reducedMotion
      ? 'Advance one frame'
      : state.playbackActive ? 'Pause animation' : 'Play animation');
    playControl.textContent = state.reducedMotion
      ? 'STEP'
      : state.playbackActive ? 'PAUSE' : 'PLAY';
    tickNodes.forEach((tick, frameIndex) => {
      tick.dataset.active = String(frameIndex === state.currentFrameIndex);
      tick.dataset.passed = String(frameIndex < state.currentFrameIndex);
    });
    syncLedger();
  }

  function requestRedraw(reason) {
    state.redrawRequestCount += 1;
    state.lastRedrawReason = reason;
    sketch?.redraw();
  }

  function setFrame(frameIndex, source) {
    state.currentFrameIndex = ((Math.round(frameIndex) % decodedFrames.length) + decodedFrames.length) % decodedFrames.length;
    state.lastFrameChangeSource = source;
    updateInterface();
    requestRedraw(source);
  }

  function pausePlayback(reason) {
    if (!state.playbackActive) return;
    cancelAnimationFrame(playbackRequest);
    playbackRequest = 0;
    playbackTimestamp = null;
    playbackRemainderMs = 0;
    state.playbackActive = false;
    state.playbackPauseCount += 1;
    state.lastPlaybackStopReason = reason;
    updateInterface();
  }

  function playbackTick(timestamp) {
    if (!state.playbackActive) return;
    if (playbackTimestamp === null) playbackTimestamp = timestamp;
    const elapsed = clamp(timestamp - playbackTimestamp, 0, 80);
    playbackTimestamp = timestamp;
    playbackRemainderMs += elapsed;
    let advanced = false;
    while (playbackRemainderMs >= decodedFrames[state.currentFrameIndex].delayMs) {
      playbackRemainderMs -= decodedFrames[state.currentFrameIndex].delayMs;
      state.currentFrameIndex = (state.currentFrameIndex + 1) % decodedFrames.length;
      state.playbackFrameAdvanceCount += 1;
      advanced = true;
    }
    if (advanced) {
      state.lastFrameChangeSource = 'trusted-playback-timing';
      updateInterface();
      requestRedraw('trusted-playback-timing');
    }
    playbackRequest = requestAnimationFrame(playbackTick);
  }

  function startPlayback() {
    state.playbackActive = true;
    state.playbackStartedByTrustedInput = true;
    state.playbackStartCount += 1;
    playbackTimestamp = null;
    playbackRemainderMs = 0;
    updateInterface();
    playbackRequest = requestAnimationFrame(playbackTick);
  }

  function togglePlaybackFromInput(event, kind, source) {
    if (!recordTrustedInput(event, kind, source)) return;
    if (state.reducedMotion) {
      state.reducedMotionStepCount += 1;
      state.stepCount += 1;
      setFrame(state.currentFrameIndex + 1, `${source}-reduced-step`);
      return;
    }
    if (state.playbackActive) pausePlayback(source);
    else startPlayback();
  }

  function stepFromInput(event, direction, kind, source) {
    if (!recordTrustedInput(event, kind, source)) return;
    pausePlayback(`${source}-step`);
    state.stepCount += 1;
    setFrame(state.currentFrameIndex + direction, source);
  }

  function resetFromInput(event, kind, source) {
    if (!recordTrustedInput(event, kind, source)) return;
    pausePlayback(`${source}-reset`);
    state.resetCount += 1;
    state.playbackStartedByTrustedInput = false;
    setFrame(0, source);
  }

  slider.addEventListener('pointerdown', event => {
    const kind = event.pointerType || 'mouse';
    if (!recordTrustedInput(event, kind, `range-${kind}-down`)) return;
    latestControlPointerKind = kind;
    state.activeRangePointerId = event.pointerId;
    state.activeRangePointerType = kind;
    state.rangeDragCount += 1;
    try {
      slider.setPointerCapture(event.pointerId);
      state.pointerCaptured = slider.hasPointerCapture(event.pointerId);
      if (state.pointerCaptured) state.pointerCaptureCount += 1;
    } catch {
      state.pointerCaptured = false;
    }
    syncLedger();
  });

  slider.addEventListener('input', event => {
    const kind = state.activeRangePointerId === null ? 'keyboard' : state.activeRangePointerType;
    const source = kind === 'keyboard' ? 'range-keyboard-input' : `range-${kind}-input`;
    if (!recordTrustedInput(event, kind, source)) return;
    pausePlayback(`${source}-seek`);
    state.rangeInputCount += 1;
    setFrame(Number(slider.value), source);
  });

  function finishRangePointer(event, cancelled = false) {
    if (event.pointerId !== state.activeRangePointerId) return;
    const kind = event.pointerType || state.activeRangePointerType || 'mouse';
    const source = cancelled ? `range-${kind}-cancel` : `range-${kind}-up`;
    if (!recordTrustedInput(event, kind, source)) return;
    if (state.pointerCaptured) {
      try {
        if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture can be released by the browser immediately before pointerup.
      }
      state.pointerReleaseCount += 1;
    }
    if (cancelled) state.pointerCancelCount += 1;
    state.activeRangePointerId = null;
    state.activeRangePointerType = 'none';
    state.pointerCaptured = false;
    syncLedger();
  }

  slider.addEventListener('pointerup', event => finishRangePointer(event, false));
  slider.addEventListener('pointercancel', event => finishRangePointer(event, true));

  [playControl, previousControl, nextControl, resetControl].forEach(control => {
    control.addEventListener('pointerdown', event => {
      if (event.isTrusted === true) latestControlPointerKind = event.pointerType || 'mouse';
    });
  });

  playControl.addEventListener('click', event => {
    togglePlaybackFromInput(event, 'control', `play-control-${event.detail === 0 ? 'keyboard' : latestControlPointerKind}`);
  });
  previousControl.addEventListener('click', event => {
    stepFromInput(event, -1, 'control', `previous-control-${event.detail === 0 ? 'keyboard' : latestControlPointerKind}`);
  });
  nextControl.addEventListener('click', event => {
    stepFromInput(event, 1, 'control', `next-control-${event.detail === 0 ? 'keyboard' : latestControlPointerKind}`);
  });
  resetControl.addEventListener('click', event => {
    resetFromInput(event, 'control', `reset-control-${event.detail === 0 ? 'keyboard' : latestControlPointerKind}`);
  });

  stage.addEventListener('keydown', event => {
    if (event.target instanceof HTMLButtonElement && [' ', 'Enter'].includes(event.key)) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      stepFromInput(event, event.key === 'ArrowLeft' ? -1 : 1, 'keyboard', `keyboard-${event.key}`);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!recordTrustedInput(event, 'keyboard', `keyboard-${event.key}`)) return;
      pausePlayback(`keyboard-${event.key}`);
      state.stepCount += 1;
      setFrame(event.key === 'Home' ? 0 : decodedFrames.length - 1, `keyboard-${event.key}`);
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      togglePlaybackFromInput(event, 'keyboard', 'keyboard-Space');
      return;
    }
    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      resetFromInput(event, 'keyboard', `keyboard-${event.key}`);
    }
  });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      const renderer = p.createCanvas(
        Math.max(1, Math.round(host.clientWidth)),
        Math.max(1, Math.round(host.clientHeight)),
      );
      renderer.parent(host);
      renderer.elt.setAttribute('aria-hidden', 'true');
      p.noLoop();
      p.textFont('ui-monospace, SFMono-Regular, monospace');
      updateInterface();
    };

    p.draw = () => {
      state.drawCount += 1;
      const width = p.width;
      const height = p.height;
      const isMicro = width < 190 || height < 100;
      const sidebarWidth = isMicro ? 39 : clamp(width * .3, 62, 220);
      const toolbarHeight = isMicro ? 18 : clamp(height * .14, 27, 58);
      const availableX = sidebarWidth + (isMicro ? 4 : 8);
      const availableY = isMicro ? 4 : 9;
      const availableWidth = Math.max(1, width - availableX - (isMicro ? 4 : 9));
      const availableHeight = Math.max(1, height - availableY - toolbarHeight - (isMicro ? 4 : 10));
      const fitScale = Math.min(availableWidth / state.gifWidth, availableHeight / state.gifHeight);
      const frameWidth = Math.max(1, state.gifWidth * fitScale);
      const frameHeight = Math.max(1, state.gifHeight * fitScale);
      const frameX = availableX + (availableWidth - frameWidth) / 2;
      const frameY = availableY + (availableHeight - frameHeight) / 2;
      const current = decodedFrames[state.currentFrameIndex];
      const context = p.drawingContext;

      p.background('#0d1111');
      p.noStroke();
      p.fill('#111716');
      p.rect(0, 0, sidebarWidth, height);
      p.fill('#070a0a');
      p.rect(sidebarWidth, 0, width - sidebarWidth, height);

      context.save();
      context.shadowColor = 'rgba(0, 0, 0, .42)';
      context.shadowBlur = isMicro ? 4 : 18;
      context.shadowOffsetY = isMicro ? 1 : 7;
      context.imageSmoothingEnabled = true;
      context.drawImage(current.bitmap, frameX, frameY, frameWidth, frameHeight);
      context.restore();

      p.noFill();
      p.stroke(207, 225, 218, 72);
      p.strokeWeight(1);
      p.rect(frameX - .5, frameY - .5, frameWidth + 1, frameHeight + 1, isMicro ? 1 : 3);

      const corner = clamp(Math.min(frameWidth, frameHeight) * .08, 3, 14);
      p.stroke('#58d4d9');
      p.line(frameX, frameY, frameX + corner, frameY);
      p.line(frameX, frameY, frameX, frameY + corner);
      p.stroke('#f36b49');
      p.line(frameX + frameWidth, frameY + frameHeight, frameX + frameWidth - corner, frameY + frameHeight);
      p.line(frameX + frameWidth, frameY + frameHeight, frameX + frameWidth, frameY + frameHeight - corner);

      p.noStroke();
      p.fill(7, 11, 11, 185);
      p.rect(frameX + (isMicro ? 3 : 7), frameY + (isMicro ? 3 : 7), isMicro ? 15 : 32, isMicro ? 9 : 17, 2);
      p.fill(state.playbackActive ? '#58d4d9' : '#f3eee4');
      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.textSize(isMicro ? 4 : 7);
      p.text(state.playbackActive ? 'PLAY' : 'II', frameX + (isMicro ? 10.5 : 23), frameY + (isMicro ? 7.5 : 15.5));

      if (state.drawCount === 1) {
        state.initialStillVerified = (
          state.currentFrameIndex === 0
          && state.playbackActive === false
          && state.inputCount === 0
          && state.playbackFrameAdvanceCount === 0
        );
        syncLedger();
        resolveFirstDraw();
      }
    };
  }, host);

  const resizeObserver = new ResizeObserver(entries => {
    const entry = entries[0];
    if (!sketch || !entry) return;
    const width = Math.max(1, Math.round(entry.contentRect.width));
    const height = Math.max(1, Math.round(entry.contentRect.height));
    if (width === sketch.width && height === sketch.height) return;
    state.resizeCount += 1;
    sketch.resizeCanvas(width, height, false);
    requestRedraw('resize');
  });
  resizeObserver.observe(host);

  reducedMotionQuery.addEventListener?.('change', () => {
    state.reducedMotion = reducedMotionQuery.matches;
    if (state.reducedMotion) pausePlayback('reduced-motion-change');
    updateInterface();
    requestRedraw('reduced-motion-change');
  });

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(playbackRequest);
    decodedFrames.forEach(decodedFrame => decodedFrame.bitmap.close());
  }, { once: true });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = host.querySelector('canvas');
    const durationAgreement = decodedFrames.every(decodedFrame => (
      Number.isFinite(decodedFrame.nativeDurationMs)
      && Math.abs(decodedFrame.nativeDurationMs - decodedFrame.delayMs) <= 10
    ));
    const timestampsValid = decodedFrames.every((decodedFrame, frameIndex) => (
      Number.isFinite(decodedFrame.nativeTimestampMs)
      && (frameIndex === 0 || decodedFrame.nativeTimestampMs >= decodedFrames[frameIndex - 1].nativeTimestampMs)
    ));
    const framesValid = decodedFrames.every((decodedFrame, frameIndex) => (
      decodedFrame.complete === true
      && decodedFrame.index === frameIndex
      && decodedFrame.bitmap.width === state.gifWidth
      && decodedFrame.bitmap.height === state.gifHeight
      && decodedFrame.delayMs >= 60
      && [1, 2].includes(decodedFrame.disposal)
      && /^[0-9a-f]{8}$/.test(decodedFrame.pixelChecksum)
    ));
    return (
      sketch instanceof p5
      && Boolean(canvas?.getContext('2d'))
      && typeof ImageDecoder === 'function'
      && stage.dataset.previewMechanism === 'native-disposal-aware-gif-inspector'
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && state.task === 'human-operated-animation-asset-frame-inspection'
      && state.acceptedInputs.join('|') === 'mouse|touch|pen|keyboard|control'
      && state.userInputRequired === true
      && state.strictTrustedInputGuard === true
      && state.automaticPlayback === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.previewClockDriven === false
      && state.previewClockMutation === false
      && state.syntheticInputDispatch === false
      && state.decoder === 'native-ImageDecoder-completeFramesOnly'
      && state.gifAssetDecoded === true
      && new URL(state.gifAssetUrl).origin === location.origin
      && new URL(state.gifAssetUrl).pathname.endsWith('.gif')
      && state.gifRawChecksum === EXPECTED_GIF_SHA256
      && state.gifSignature === 'GIF89a'
      && state.gifWidth === 480
      && state.gifHeight === 320
      && state.gifTrailerFound === true
      && state.gifByteLength === 767684
      && state.parsedFrameCount === EXPECTED_FRAME_COUNT
      && state.decodedFrameCount === EXPECTED_FRAME_COUNT
      && state.completeFrameCount === EXPECTED_FRAME_COUNT
      && state.uniqueFrameChecksumCount === EXPECTED_FRAME_COUNT
      && new Set(state.disposalMethods).size === 2
      && state.disposalMethods.includes(1)
      && state.disposalMethods.includes(2)
      && state.totalDurationMs === 1210
      && durationAgreement
      && timestampsValid
      && framesValid
      && state.firstFramePaused === true
      && state.initialStillVerified === true
      && state.inputCount === state.trustedInputCount
      && state.touchInputCount + state.penInputCount <= state.pointerInputCount
      && state.pointerReleaseCount <= state.pointerCaptureCount
      && state.pointerCaptured === (state.activeRangePointerId !== null && state.pointerCaptureCount > state.pointerReleaseCount)
      && (!state.playbackActive || state.playbackStartedByTrustedInput)
      && state.currentFrameIndex >= 0
      && state.currentFrameIndex < state.decodedFrameCount
      && Number(slider.max) === state.decodedFrameCount - 1
      && tickNodes.length === state.decodedFrameCount
      && state.drawCount > 0
    );
  };
  syncLedger();

  installPreviewController({
    id: 'frame-by-frame-gif-scrubber',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {},
    ready: Promise.all([document.fonts.ready, firstDrawReady]),
  });
} catch (error) {
  markPreviewFailure(error);
}
