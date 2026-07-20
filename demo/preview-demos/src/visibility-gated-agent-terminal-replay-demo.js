import './batch-a-qa.js';
import{animate}from'motion';import{installPreviewController,markPreviewFailure}from'../shared.js';
try {
  const terminal = document.querySelector('#terminal');
  const prompt = document.querySelector('#terminal-prompt');
  const log = document.querySelector('#terminal-log');
  const status = document.querySelector('#terminal-status');
  const task = 'Audit the color system and repair contrast';
  const outputs = ['thinking: map semantic tokens', 'tool: inspect 12 surfaces', 'bash: contrast-check --strict', '✓ 11 surfaces repaired'];
  let visible = true;
  let interrupted = false;
  let last = 0;
  const pulse = animate(status, { opacity: [.55, 1, .55], x: [0, 2, 0] }, { duration: 3, ease: 'linear' });
  pulse.pause();
  const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; }, { threshold: .1 });
  observer.observe(terminal);
  const render = time => {
    if (!visible) return;
    last = time;
    const t = ((time % 3) + 3) % 3;
    const progress = t / 3;
    pulse.time = t;
    if (interrupted) {
      status.textContent = 'interrupted';
      log.textContent = '■ execution stopped by operator';
      return;
    }
    const chars = Math.floor(Math.min(1, progress / .3) * task.length);
    prompt.textContent = task.slice(0, chars) + (progress < .3 ? '▌' : '');
    const count = Math.max(0, Math.min(outputs.length, Math.floor((progress - .28) / .15) + 1));
    log.textContent = outputs.slice(0, count).join('\n');
    status.textContent = progress < .3 ? `typing · ${t.toFixed(1)}s` : progress < .86 ? `working · ${t.toFixed(1)}s` : 'done · 2.6s';
  };
  terminal.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    interrupted = !interrupted;
    render(last);
  });
  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    pulse.time = 0;
    await new Promise(resolve => requestAnimationFrame(resolve));
    const before = getComputedStyle(status).opacity;
    pulse.time = 1.5;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const after = getComputedStyle(status).opacity;
    return pulse.duration >= 2.9 && observer instanceof IntersectionObserver && before !== after;
  };
  installPreviewController({ id: 'visibility-gated-agent-terminal-replay', library: 'motion@12.42.2', renderer: 'dom', render, ready: Promise.resolve() });
} catch (error) {
  markPreviewFailure(error);
}
