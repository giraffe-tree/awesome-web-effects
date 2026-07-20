import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp } from './batch-b-utils.js';

try {
  const stage = document.querySelector('#track-stage');
  const cards = [...document.querySelectorAll('.track-card')];
  const covers = [...document.querySelectorAll('.track-cover img')];
  const transport = document.querySelector('#transport-toggle');
  const transportLabel = transport.querySelector('.transport-label');
  const durations = [9, 12, 8];
  const tones = ['#ff7b9b', '#71e8d1', '#f5d568'];
  const titles = ['Soft Current', 'Night Glass', 'Slow Flare'];
  const state = {
    automaticHandoff: false,
    selected: 0,
    playing: false,
    mode: 'paused',
    progress: [0, 0, 0],
    inputKind: 'none',
    inputCount: 0,
    coversReady: false,
    completedTracks: 0
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let previousTime = null;
  let renders = 0;
  let latestPointerKind = 'mouse';
  const selectionMotions = cards.map(card => {
    const control = animate(card, {
      y: [0, -3, 0],
      scale: [1, 1.018, 1]
    }, {
      duration: .42,
      ease: [.2, .78, .2, 1]
    });
    control.pause();
    control.time = 0;
    return control;
  });

  const coverReady = Promise.all(covers.map(image => image.decode())).then(() => {
    state.coversReady = true;
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  function setSelected(index, inputKind, animateSelection = true) {
    const next = (index + cards.length) % cards.length;
    state.selected = next;
    state.inputKind = inputKind;
    state.inputCount += 1;
    cards.forEach((card, cardIndex) => {
      const selected = cardIndex === next;
      card.setAttribute('aria-selected', String(selected));
      card.setAttribute('aria-pressed', String(selected));
      card.tabIndex = selected ? 0 : -1;
    });
    if (animateSelection) {
      const motion = selectionMotions[next];
      motion.pause();
      motion.time = 0;
      motion.play();
    }
  }

  function togglePlayback(inputKind) {
    if (state.progress[state.selected] >= 1) state.progress[state.selected] = 0;
    state.playing = !state.playing;
    state.mode = state.playing ? 'playing' : 'paused';
    state.inputKind = inputKind;
    state.inputCount += 1;
  }

  cards.forEach((card, index) => {
    card.addEventListener('pointerdown', event => {
      latestPointerKind = event.pointerType || 'pointer';
    });
    card.addEventListener('click', event => {
      const inputKind = event.detail === 0 ? 'keyboard' : latestPointerKind;
      setSelected(index, inputKind);
    });
  });

  transport.addEventListener('pointerdown', event => {
    latestPointerKind = event.pointerType || 'pointer';
  });
  transport.addEventListener('click', event => {
    togglePlayback(event.detail === 0 ? 'keyboard' : latestPointerKind);
  });

  stage.addEventListener('keydown', event => {
    if (event.target === transport && ['Enter', ' '].includes(event.key)) return;
    if (event.target?.classList.contains('track-card') && ['Enter', ' '].includes(event.key)) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      setSelected(state.selected + direction, 'keyboard');
      cards[state.selected].focus({ preventScroll: true });
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setSelected(event.key === 'Home' ? 0 : cards.length - 1, 'keyboard');
      cards[state.selected].focus({ preventScroll: true });
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      state.playing = false;
      state.mode = 'paused';
      state.inputKind = 'keyboard';
      state.inputCount += 1;
      return;
    }
    if (event.key === ' ' && event.target === stage) {
      event.preventDefault();
      togglePlayback('keyboard');
    }
  });

  function updatePresentation() {
    stage.dataset.playing = String(state.playing);
    stage.style.setProperty('--active-tone', tones[state.selected]);
    cards.forEach((card, index) => {
      const selected = index === state.selected;
      card.dataset.playing = String(selected && state.playing);
      card.style.setProperty('--p', clamp(state.progress[index]).toFixed(4));
      card.setAttribute('aria-label', `${titles[index]}, ${selected ? 'selected' : 'not selected'}, ${selected && state.playing ? 'playing' : 'paused'}, ${Math.round(state.progress[index] * 100)} percent`);
    });
    transport.setAttribute('aria-pressed', String(state.playing));
    transport.setAttribute('aria-label', `${state.playing ? 'Pause' : 'Play'} ${titles[state.selected]}`);
    transportLabel.textContent = state.playing ? 'Pause' : 'Play';
  }

  function render(time) {
    const currentTime = Number(time) || 0;
    if (previousTime === null || currentTime < previousTime) previousTime = currentTime;
    const delta = clamp(currentTime - previousTime, 0, .12);
    previousTime = currentTime;
    if (state.playing) {
      const index = state.selected;
      state.progress[index] = clamp(state.progress[index] + delta / durations[index]);
      if (state.progress[index] >= 1) {
        state.progress[index] = 1;
        state.playing = false;
        state.mode = 'ended';
        state.completedTracks += 1;
      }
    }
    updatePresentation();
    renders += 1;
  }

  setSelected(0, 'none', false);
  state.inputCount = 0;

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const bounds = stage.getBoundingClientRect();
    return cards.length === 3
      && covers.length === 3
      && covers.every(image => image.complete && image.naturalWidth === 800 && image.naturalHeight === 800)
      && state.coversReady
      && state.automaticHandoff === false
      && state.selected >= 0 && state.selected < cards.length
      && ['paused', 'playing', 'ended'].includes(state.mode)
      && state.progress.length === cards.length
      && state.progress.every(value => value >= 0 && value <= 1)
      && cards.filter(card => card.getAttribute('aria-selected') === 'true').length === 1
      && cards[state.selected].getAttribute('aria-pressed') === 'true'
      && selectionMotions.every(control => typeof control.pause === 'function')
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && bounds.width >= innerWidth * .99
      && bounds.height >= innerHeight * .99
      && Number.isInteger(state.inputCount)
      && renders > 0;
  };

  installPreviewController({
    id: 'track-card-play-state-handoff',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: Promise.all([coverReady, document.fonts.ready])
  });
} catch (error) {
  markPreviewFailure(error);
}
