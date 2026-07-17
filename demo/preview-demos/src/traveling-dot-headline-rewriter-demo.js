import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const oldWord = document.querySelector('#word-old');
  const newWord = document.querySelector('#word-new');
  const dot = document.querySelector('#traveling-dot');
  const trace = document.querySelector('#motion-trace');
  const button = document.querySelector('#rewrite-button');
  const readout = document.querySelector('#rewrite-readout');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const splitWord = element => {
    const letters = [...element.textContent];
    element.replaceChildren(...letters.map(letter => {
      const span = document.createElement('span');
      span.textContent = letter;
      return span;
    }));
    return [...element.children];
  };

  const oldLetters = splitWord(oldWord);
  const newLetters = splitWord(newWord);
  const travelDistance = 168;

  const dotMotion = animate(dot, {
    x: [0, 0, travelDistance, travelDistance, 0, 0, travelDistance, travelDistance, 0],
    y: [0, 0, 0, -16, -16, 0, 0, 0, 0],
    scale: [1, 1, 1.15, .72, .72, 1, 1.15, 1, 1]
  }, {
    duration: 3,
    times: [0, .1, .4, .44, .49, .52, .79, .9, 1],
    ease: 'linear'
  });
  const traceMotion = animate(trace, {
    scaleX: [0, 0, 1, 0, 0, 1, 0, 0],
    opacity: [0, 0, .8, 0, 0, .55, 0, 0]
  }, {
    duration: 3,
    times: [0, .1, .4, .48, .52, .79, .9, 1],
    ease: 'linear'
  });
  dotMotion.pause();
  traceMotion.pause();

  const setOpacity = (letters, predicate, fade = 1) => {
    letters.forEach((letter, index) => {
      const visible = predicate(index, letters.length) ? fade : 0;
      letter.style.opacity = String(visible);
      letter.style.transform = `translateY(${(1 - visible) * -4}px)`;
    });
  };

  let phaseOffset = 0;
  let latestTime = 0;
  const seek = time => {
    dotMotion.time = time;
    traceMotion.time = time;
  };

  const render = time => {
    const cycle = reducedMotion.matches ? 2.48 : (time + phaseOffset) % 3;
    latestTime = time;
    seek(cycle);

    const eraseProgress = cycle < .3 ? 0 : cycle < 1.2 ? (cycle - .3) / .9 : 1;
    const writeProgress = cycle < 1.56 ? 0 : cycle < 2.37 ? (cycle - 1.56) / .81 : 1;
    const resetProgress = cycle < 2.7 ? 0 : (cycle - 2.7) / .3;

    if (cycle < .3) {
      setOpacity(oldLetters, () => true, 1);
    } else if (cycle < 1.2) {
      setOpacity(oldLetters, (index, count) => index / count >= eraseProgress, 1);
    } else if (cycle < 2.7) {
      setOpacity(oldLetters, () => false, 0);
    } else {
      setOpacity(oldLetters, () => true, resetProgress);
    }
    setOpacity(newLetters, (index, count) => index / count < writeProgress, Math.max(0, 1 - resetProgress));

    readout.textContent = cycle < .3 ? 'holding source word'
      : cycle < 1.2 ? 'dot is erasing'
        : cycle < 1.56 ? 'traveling to start'
          : cycle < 2.37 ? 'dot is writing'
            : 'new word resolved';
  };

  button.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    phaseOffset = (3 - (latestTime % 3)) % 3;
    render(latestTime);
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => [dotMotion, traceMotion].every(control =>
    typeof control.play === 'function' && typeof control.pause === 'function'
  ) && dot.style.transform !== '';

  installPreviewController({
    id: 'traveling-dot-headline-rewriter',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
