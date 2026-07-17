import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const editor = document.querySelector('#prompt-editor');
  const oldPhrase = document.querySelector('#old-phrase');
  const newPhrase = document.querySelector('#new-phrase');
  const selection = document.querySelector('#selection-wash');
  const caret = document.querySelector('#prompt-caret');
  const chip = document.querySelector('#model-chip');
  const status = document.querySelector('#prompt-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const splitLetters = element => {
    const letters = [...element.textContent];
    element.replaceChildren(...letters.map(letter => {
      const span = document.createElement('span');
      span.textContent = letter === ' ' ? '\u00a0' : letter;
      return span;
    }));
    return [...element.children];
  };

  const oldLetters = splitLetters(oldPhrase);
  const newLetters = splitLetters(newPhrase);

  const selectionMotion = animate(selection, {
    scaleX: [0, 0, 1, 1, 0, 0],
    opacity: [0, 0, 1, 1, 0, 0]
  }, {
    duration: 3,
    times: [0, .34, .48, .55, .63, 1],
    ease: 'linear'
  });
  const chipMotion = animate(chip, {
    opacity: [.45, .45, .45, 1, 1, .45],
    y: [4, 4, 4, 0, 0, 4],
    scale: [.88, .88, .88, 1.08, 1, .88]
  }, {
    duration: 3,
    times: [0, .46, .56, .67, .88, 1],
    ease: 'linear'
  });
  const caretMotion = animate(caret, {
    opacity: [1, .15, 1, 1, .15, 1]
  }, {
    duration: .52,
    ease: 'linear',
    repeat: 5
  });

  const controls = [selectionMotion, chipMotion, caretMotion];
  controls.forEach(control => control.pause());

  const setLetterProgress = (letters, progress, fade = 1) => {
    const visible = Math.max(0, Math.min(1, progress)) * letters.length;
    letters.forEach((letter, index) => {
      const edge = Math.max(0, Math.min(1, visible - index));
      letter.style.opacity = String(edge * fade);
      letter.style.transform = `translateY(${(1 - edge) * 3}px)`;
    });
  };

  let phaseOffset = 0;
  let latestTime = 0;
  const seekMotions = time => {
    selectionMotion.time = time;
    chipMotion.time = time;
    caretMotion.time = time % caretMotion.duration;
  };

  const render = time => {
    const cycle = reducedMotion.matches ? 2.45 : (time + phaseOffset) % 3;
    latestTime = time;
    seekMotions(cycle);

    const oldTyped = cycle < .85 ? cycle / .85 : 1;
    const oldFade = cycle < 1.58 ? 1 : cycle < 1.82 ? 1 - ((cycle - 1.58) / .24) : 0;
    const newTyped = cycle < 1.62 ? 0 : cycle < 2.28 ? (cycle - 1.62) / .66 : 1;
    const newFade = cycle < 2.72 ? 1 : 1 - ((cycle - 2.72) / .28);
    setLetterProgress(oldLetters, oldTyped, oldFade);
    setLetterProgress(newLetters, newTyped, Math.max(0, newFade));

    const activeLetters = cycle < 1.6 ? oldLetters : newLetters;
    const activeProgress = cycle < .85 ? oldTyped : cycle < 1.58 ? 1 : cycle < 2.28 ? newTyped : 1;
    const activeWidth = activeLetters.reduce((width, letter, index) => width + (index < Math.ceil(activeProgress * activeLetters.length) ? letter.getBoundingClientRect().width : 0), 0);
    caret.style.left = `${Math.min(206, activeWidth + 1)}px`;

    status.textContent = cycle < .92 ? 'typing'
      : cycle < 1.58 ? 'selecting'
        : cycle < 2.34 ? 'replacing'
          : 'composed';
  };

  editor.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    phaseOffset = (phaseOffset + 1.5) % 3;
    render(latestTime);
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => controls.every(control =>
    typeof control.play === 'function' && typeof control.pause === 'function'
  ) && selection.style.transform !== '';

  installPreviewController({
    id: 'prompt-select-replace-loop',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
