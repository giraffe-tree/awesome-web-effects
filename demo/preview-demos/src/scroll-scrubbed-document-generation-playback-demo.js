import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-c-utils.js';

try {
  const stage = document.querySelector('#doc-stage');
  const paper = document.querySelector('#paper');
  const viewport = document.querySelector('#paper-viewport');
  const track = document.querySelector('#paper-track');
  const pages = [...document.querySelectorAll('.doc-page')];
  const chapterButtons = [...document.querySelectorAll('.chapter-button')];
  const cursor = document.querySelector('#doc-cursor');
  const pageLabel = document.querySelector('#paper-page');
  const status = document.querySelector('#doc-status');
  const progressBar = document.querySelector('#doc-progress');
  const progressLabel = document.querySelector('#doc-progress-label');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const chapterNames = ['Decision frame', 'Risk hypothesis', 'Research plan', 'Guardrail proposal', 'Recommendation'];
  const state = {
    automaticFallback: false,
    automaticPlayback: false,
    syntheticInputDispatch: false,
    progress: 0,
    sectionPosition: 0,
    sectionIndex: 0,
    sectionProgress: 0,
    cursorLine: 0,
    activeConsequence: pages[0].dataset.consequence,
    phase: 'idle',
    motionActive: false,
    pointerInside: false,
    stageFocused: false,
    inputKind: 'none',
    inputCount: 0,
    wheelCount: 0,
    keyboardCount: 0,
    chapterClickCount: 0,
    boundaryReleaseCount: 0,
    lastWheelConsumed: false,
    wheelPolicy: 'hover-or-focus / vertical-only / release-at-bounds',
    reducedMotion: reducedMotion.matches,
    initialStaticConfirmed: false,
    renderCount: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let motionControl = null;
  let motionSerial = 0;
  let latestPointerKind = 'mouse';

  function recordInput(inputKind) {
    state.inputKind = inputKind;
    state.inputCount += 1;
  }

  function stopMotion() {
    motionSerial += 1;
    motionControl?.stop?.();
    motionControl = null;
    state.motionActive = false;
  }

  function sectionCompletion(position, pageIndex) {
    return clamp(position - pageIndex + .72, 0, 1);
  }

  function updateCursor(position, sectionIndex) {
    const page = pages[sectionIndex];
    const fields = [...page.querySelectorAll('.doc-field')];
    const completion = sectionCompletion(position, sectionIndex);
    const lineIndex = clamp(Math.floor(completion * fields.length), 0, fields.length - 1);
    const field = fields[lineIndex];
    const pageVisualTop = (sectionIndex - position) * viewport.clientHeight;
    const top = pageVisualTop + field.offsetTop + field.offsetHeight / 2 - cursor.offsetHeight / 2;
    const left = Math.min(
      viewport.clientWidth - cursor.offsetWidth - 8,
      field.offsetLeft + Math.min(field.scrollWidth, viewport.clientWidth * .7) + 5
    );
    cursor.style.transform = `translate3d(${left.toFixed(3)}px, ${top.toFixed(3)}px, 0)`;
    cursor.style.opacity = String(top > 4 && top < viewport.clientHeight - 10 ? 1 : .18);
    state.cursorLine = lineIndex;
  }

  function applyProgress() {
    state.progress = clamp(state.progress, 0, 1);
    const position = state.progress * (pages.length - 1);
    const sectionIndex = clamp(Math.round(position), 0, pages.length - 1);
    state.sectionPosition = position;
    state.sectionIndex = sectionIndex;
    state.sectionProgress = sectionCompletion(position, sectionIndex);
    state.activeConsequence = pages[sectionIndex].dataset.consequence;
    track.style.transform = `translate3d(0, ${(-position * viewport.clientHeight).toFixed(3)}px, 0)`;

    pages.forEach((page, pageIndex) => {
      const completion = sectionCompletion(position, pageIndex);
      const fields = [...page.querySelectorAll('.doc-field')];
      fields.forEach((field, fieldIndex) => {
        const reveal = clamp(completion * fields.length - fieldIndex, 0, 1);
        field.style.setProperty('--reveal', String(reveal));
        field.style.setProperty('--conceal', `${((1 - reveal) * 100).toFixed(2)}%`);
      });
      const decision = page.querySelector('.doc-decision');
      decision.style.opacity = String(clamp((completion - .72) / .28, 0, 1));
      page.setAttribute('aria-hidden', String(pageIndex !== sectionIndex));
    });

    chapterButtons.forEach((button, index) => {
      const fill = clamp(position - index + 1, 0, 1);
      button.style.setProperty('--fill', String(fill));
      button.setAttribute('aria-current', String(index === sectionIndex));
    });
    updateCursor(position, sectionIndex);
    const number = String(sectionIndex + 1).padStart(2, '0');
    pageLabel.textContent = `${number} / ${String(pages.length).padStart(2, '0')}`;
    status.textContent = `${chapterNames[sectionIndex]} · ${state.sectionProgress >= .95 ? 'reviewed' : 'drafting'}`;
    progressBar.style.setProperty('--progress', String(state.progress));
    progressLabel.textContent = `Section ${number} / ${String(pages.length).padStart(2, '0')} · ${Math.round(state.progress * 100)}%`;
    paper.dataset.section = String(sectionIndex + 1);
  }

  function setProgressDirect(progress, origin) {
    stopMotion();
    state.progress = clamp(progress, 0, 1);
    state.phase = origin;
    applyProgress();
  }

  function animateToProgress(progress, origin) {
    const target = clamp(progress, 0, 1);
    stopMotion();
    if (reducedMotion.matches || Math.abs(target - state.progress) < .0005) {
      state.progress = target;
      state.phase = 'idle';
      applyProgress();
      return;
    }
    const serial = ++motionSerial;
    state.phase = origin;
    state.motionActive = true;
    motionControl = animate(state.progress, target, {
      duration: .38,
      ease: [.22, .7, .25, 1],
      onUpdate: value => {
        if (serial !== motionSerial) return;
        state.progress = value;
        applyProgress();
      },
      onComplete: () => {
        if (serial !== motionSerial) return;
        state.progress = target;
        state.phase = 'idle';
        state.motionActive = false;
        motionControl = null;
        applyProgress();
      }
    });
  }

  function moveToSection(index, inputKind) {
    recordInput(inputKind);
    const nextIndex = clamp(index, 0, pages.length - 1);
    animateToProgress(nextIndex / (pages.length - 1), inputKind === 'keyboard' ? 'keyboard' : 'chapter');
  }

  stage.addEventListener('pointerenter', () => {
    state.pointerInside = true;
  });
  stage.addEventListener('pointerleave', () => {
    state.pointerInside = false;
  });
  stage.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
    if (!event.target.closest('button')) stage.focus({ preventScroll: true });
  });
  stage.addEventListener('focusin', () => {
    state.stageFocused = true;
  });
  stage.addEventListener('focusout', event => {
    if (!stage.contains(event.relatedTarget)) state.stageFocused = false;
  });

  stage.addEventListener('wheel', event => {
    state.lastWheelConsumed = false;
    const engaged = state.pointerInside || state.stageFocused || stage.matches(':hover');
    if (!engaged || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || event.deltaY === 0) return;
    const direction = Math.sign(event.deltaY);
    const atStart = state.progress <= .0005;
    const atEnd = state.progress >= .9995;
    if ((direction < 0 && atStart) || (direction > 0 && atEnd)) {
      state.boundaryReleaseCount += 1;
      return;
    }
    event.preventDefault();
    stopMotion();
    recordInput('wheel');
    state.wheelCount += 1;
    state.lastWheelConsumed = true;
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? stage.clientHeight
        : 1;
    const change = event.deltaY * unit / Math.max(520, stage.clientHeight * 2.25);
    state.progress = clamp(state.progress + change, 0, 1);
    state.phase = 'wheel';
    applyProgress();
  }, { passive: false });

  stage.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    state.keyboardCount += 1;
    const targetIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? pages.length - 1
        : event.key === 'ArrowUp' || event.key === 'PageUp'
          ? state.sectionIndex - 1
          : state.sectionIndex + 1;
    moveToSection(targetIndex, 'keyboard');
  });

  chapterButtons.forEach((button, index) => {
    button.addEventListener('click', event => {
      state.chapterClickCount += 1;
      moveToSection(index, event.detail === 0 ? 'keyboard' : latestPointerKind);
    });
  });

  reducedMotion.addEventListener('change', event => {
    state.reducedMotion = event.matches;
    if (event.matches && state.motionActive) {
      const targetIndex = state.sectionIndex;
      stopMotion();
      state.progress = targetIndex / (pages.length - 1);
      state.phase = 'idle';
    }
    applyProgress();
  });

  const resizeObserver = new ResizeObserver(() => applyProgress());
  resizeObserver.observe(viewport);

  function render() {
    state.renderCount += 1;
    applyProgress();
  }

  const ready = document.fonts.ready.then(async () => {
    state.progress = 0;
    state.phase = 'idle';
    applyProgress();
    const initialProgress = state.progress;
    const initialTransform = track.style.transform;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialStaticConfirmed = state.progress === initialProgress
      && track.style.transform === initialTransform
      && state.inputCount === 0
      && !state.motionActive;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    applyProgress();
    const stageBounds = stage.getBoundingClientRect();
    const paperBounds = paper.getBoundingClientRect();
    const credibleBrief = pages.length === 5 && pages.every(page => (
      page.dataset.consequence?.length > 35
      && page.querySelector('h2')?.textContent.trim().length > 24
      && page.querySelectorAll('.doc-field').length === 4
      && page.querySelector('.doc-decision')?.textContent.includes('Consequence')
    ));
    const noUnpromptedPlayback = state.inputCount > 0 || (
      state.progress === 0
      && state.sectionIndex === 0
      && state.phase === 'idle'
      && !state.motionActive
    );
    return credibleBrief
      && chapterButtons.length === pages.length
      && track.scrollHeight >= viewport.clientHeight * 4.9
      && state.initialStaticConfirmed
      && noUnpromptedPlayback
      && state.automaticPlayback === false
      && state.syntheticInputDispatch === false
      && state.automaticFallback === false
      && state.progress >= 0
      && state.progress <= 1
      && state.sectionIndex >= 0
      && state.sectionIndex < pages.length
      && Number.isFinite(state.sectionPosition)
      && Number.isInteger(state.inputCount)
      && Number.isInteger(state.wheelCount)
      && Number.isInteger(state.keyboardCount)
      && Number.isInteger(state.boundaryReleaseCount)
      && ['idle', 'wheel', 'keyboard', 'chapter'].includes(state.phase)
      && stage.tabIndex === 0
      && stage.getAttribute('aria-label').includes('Page Down')
      && state.wheelPolicy.includes('release-at-bounds')
      && track.style.transform.includes('translate3d')
      && cursor.style.transform.includes('translate3d')
      && paperBounds.width >= stageBounds.width * .55
      && paperBounds.height >= stageBounds.height * .7
      && state.renderCount > 0
      && window.__PREVIEW_INTERACTION_STATE__ === state;
  };

  installPreviewController({
    id: 'scroll-scrubbed-document-generation-playback',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
