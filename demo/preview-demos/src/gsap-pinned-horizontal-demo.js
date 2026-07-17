import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  gsap.registerPlugin(ScrollTrigger);
  const scrollport = document.querySelector('#horizontal-scrollport');
  const scene = document.querySelector('#horizontal-scene');
  const stage = document.querySelector('#horizontal-stage');
  const track = document.querySelector('#horizontal-track');
  const progressFill = document.querySelector('#scene-progress');
  const panelCounter = document.querySelector('#panel-counter');

  const updateIndicators = progress => {
    progressFill.style.transform = `scaleX(${progress})`;
    panelCounter.textContent = `${String(Math.min(4, Math.floor(progress * 3.999) + 1)).padStart(2, '0')} / 04`;
  };

  const horizontalTween = gsap.to(track, {
    xPercent: -75,
    ease: 'none',
    scrollTrigger: {
      trigger: scene,
      scroller: scrollport,
      start: 'top top',
      end: '+=960',
      scrub: true,
      pin: stage,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: self => updateIndicators(self.progress)
    }
  });
  const horizontalTrigger = horizontalTween.scrollTrigger;
  ScrollTrigger.refresh();

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    horizontalTrigger.animation === horizontalTween
    && horizontalTrigger.pin === stage
    && horizontalTrigger.vars.scrub === true
    && horizontalTrigger.end > horizontalTrigger.start
  );

  const render = time => {
    const cycle = (time % 3) / 3;
    const progress = (1 - Math.cos(cycle * Math.PI * 2)) / 2;
    scrollport.scrollTop = horizontalTrigger.start + progress * (horizontalTrigger.end - horizontalTrigger.start);
    ScrollTrigger.update(true);
    updateIndicators(progress);
  };

  installPreviewController({
    id: 'pinned-horizontal-scroll-scene',
    library: 'gsap@3.15.0',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
