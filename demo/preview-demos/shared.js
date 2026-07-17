export function installPreviewController({ id, library, render, ready }) {
  let manualTime = false;
  let start = performance.now();
  let animationFrame = 0;

  window.__PREVIEW_META__ = { id, library, capture: 'real-demo' };
  window.__setPreviewTime = async seconds => {
    manualTime = true;
    await render(Number(seconds) || 0, true);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  };

  const tick = now => {
    if (!manualTime) render((now - start) / 1000, false);
    animationFrame = requestAnimationFrame(tick);
  };

  Promise.resolve(ready).then(async () => {
    await render(0, false);
    window.__PREVIEW_READY__ = true;
    document.documentElement.dataset.previewReady = 'true';
    animationFrame = requestAnimationFrame(tick);
  });

  window.addEventListener('beforeunload', () => cancelAnimationFrame(animationFrame), { once: true });
}

export function markPreviewFailure(error) {
  window.__PREVIEW_ERROR__ = String(error?.stack || error);
  document.documentElement.dataset.previewError = String(error?.message || error);
  console.error(error);
}
