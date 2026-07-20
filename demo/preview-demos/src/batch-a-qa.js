const expectedById = new Map([
  ['scroll-scrubbed-document-generation-playback', 'motion@12.42.2', 'dom'],
  ['duration-aware-hero-film-handoff', 'motion@12.42.2', 'canvas2d'],
  ['hover-rehearsed-video-style-rail', 'motion@12.42.2', 'canvas2d'],
  ['device-silhouette-masked-video', 'motion@12.42.2', 'canvas2d'],
  ['four-corner-hover-crop-marks', 'motion@12.42.2', 'dom'],
  ['interaction-history-hiring-badge', 'motion@12.42.2', 'dom'],
  ['card-metadata-to-cta-role-swap', 'motion@12.42.2', 'dom'],
  ['opposed-diagonal-offset-cta', 'motion@12.42.2', 'dom'],
  ['blurred-autoplay-video-ambience', 'motion@12.42.2', 'canvas2d'],
  ['ascii-orchestration-signal-sweep', 'p5@2.3.0', 'canvas2d'],
  ['inertial-vertical-capability-rail', 'motion@12.42.2', 'dom'],
  ['visibility-gated-agent-terminal-replay', 'motion@12.42.2', 'dom'],
  ['clip-path-menu-curtain', 'motion@12.42.2', 'dom'],
  ['playable-brand-minesweeper-footer', 'motion@12.42.2', 'dom'],
  ['noise-cancellation-audio-comparison', 'motion@12.42.2', 'canvas2d'],
  ['track-card-play-state-handoff', 'motion@12.42.2', 'dom'],
  ['audio-equalizer-typography', 'p5@2.3.0', 'canvas2d'],
  ['animated-hand-drawn-semantic-annotation', 'motion@12.42.2', 'svg'],
  ['mechanical-split-flap-character-change', 'motion@12.42.2', 'dom'],
  ['pointer-rotated-dot-matrix-globe', 'p5@2.3.0', 'canvas2d']
].map(([id, library, renderer]) => [id, { id, library, renderer }]));

const qaEnabled = new URLSearchParams(location.search).get('batch-a-qa') === '1';

if (qaEnabled) {
  const root = document.documentElement;
  const errors = [];
  const originalConsoleError = console.error.bind(console);
  const recordError = value => {
    const message = String(value?.stack || value?.message || value);
    if (!errors.includes(message)) errors.push(message);
  };
  root.dataset.batchAQaState = 'running';
  window.addEventListener('error', event => recordError(event.error || event.message));
  window.addEventListener('unhandledrejection', event => recordError(event.reason));
  console.error = (...values) => {
    recordError(values.map(value => String(value?.message || value)).join(' '));
    originalConsoleError(...values);
  };

  const waitFor = async (predicate, timeoutMs = 10000) => {
    const deadline = performance.now() + timeoutMs;
    while (!predicate()) {
      if (performance.now() >= deadline) throw new Error('Timed out waiting for preview readiness');
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  };

  const withTimeout = (promise, label, timeoutMs = 5000) => Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs))
  ]);

  queueMicrotask(async () => {
    const id = location.pathname.split('/').pop().replace(/\.html$/, '');
    const expected = expectedById.get(id);
    const result = {
      id,
      expected,
      meta: null,
      ready: false,
      runtimeAssertion: false,
      seekTimes: [],
      errors,
      previewError: null,
      surface: null
    };
    try {
      if (!expected) throw new Error(`Unknown Batch A id: ${id}`);
      await waitFor(() => window.__PREVIEW_READY__ || window.__PREVIEW_ERROR__);
      result.ready = window.__PREVIEW_READY__ === true;
      result.previewError = window.__PREVIEW_ERROR__ || null;
      result.meta = window.__PREVIEW_META__ || null;
      if (result.previewError) throw new Error(result.previewError);
      if (!result.ready) throw new Error('Preview did not set __PREVIEW_READY__');
      if (typeof window.__PREVIEW_RUNTIME_ASSERT__ !== 'function') throw new Error('Runtime assertion is missing');
      if (typeof window.__setPreviewTime !== 'function') throw new Error('Deterministic seek controller is missing');

      await withTimeout(window.__setPreviewTime(0), 'Pre-assert seek');
      result.runtimeAssertion = await withTimeout(window.__PREVIEW_RUNTIME_ASSERT__(), 'Runtime assertion');
      for (const seconds of [0, .75, 1.5, 2.25, 2.99]) {
        await withTimeout(window.__setPreviewTime(seconds), `Seek ${seconds}`);
        result.seekTimes.push(seconds);
      }

      const canvasCount = document.querySelectorAll('canvas').length;
      const svgCount = document.querySelectorAll('svg').length;
      const liveCanvas2dCount = [...document.querySelectorAll('canvas')]
        .filter(canvas => Boolean(canvas.getContext('2d'))).length;
      result.surface = { canvasCount, svgCount, liveCanvas2dCount, mainCount: document.querySelectorAll('main').length };
      const metaOk = result.meta?.id === expected.id
        && result.meta?.library === expected.library
        && result.meta?.renderer === expected.renderer
        && result.meta?.capture === 'real-demo';
      const surfaceOk = expected.renderer === 'canvas2d' ? liveCanvas2dCount > 0
        : expected.renderer === 'svg' ? svgCount > 0
          : result.surface.mainCount > 0;
      const passed = metaOk
        && result.runtimeAssertion === true
        && result.seekTimes.length === 5
        && !result.previewError
        && errors.length === 0
        && surfaceOk;
      root.dataset.batchAQa = JSON.stringify({ ...result, metaOk, surfaceOk, passed });
      root.dataset.batchAQaState = passed ? 'pass' : 'fail';
    } catch (error) {
      recordError(error);
      root.dataset.batchAQa = JSON.stringify({ ...result, passed: false });
      root.dataset.batchAQaState = 'fail';
    } finally {
      console.error = originalConsoleError;
    }
  });
}
