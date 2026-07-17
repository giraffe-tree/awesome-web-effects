import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  gsap.registerPlugin(ScrollTrigger);
  const scrollport = document.querySelector('#scrollport');
  const scene = document.querySelector('#timeline-scene');
  const cards = gsap.utils.toArray('.timeline-card');
  const progressBar = document.querySelector('#timeline-progress');
  const progressDot = document.querySelector('#timeline-dot');

  const masterTimeline = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } })
    .fromTo(cards[0], { autoAlpha: 0, y: 35, rotate: -8 }, { autoAlpha: 1, y: 0, rotate: 0, duration: .2 })
    .to(cards[0], { x: 28, scale: .9, duration: .18 })
    .fromTo(cards[1], { autoAlpha: 0, y: 35, rotate: 8 }, { autoAlpha: 1, y: 0, rotate: 0, duration: .2 }, '<.03')
    .to(cards[0], { x: 0, y: 10, rotate: -5, duration: .16 })
    .to(cards[1], { x: 0, scale: .92, duration: .16 }, '<')
    .fromTo(cards[2], { autoAlpha: 0, y: 35, rotate: -7 }, { autoAlpha: 1, y: 0, rotate: 0, duration: .2 }, '<.02')
    .to(cards, { y: 0, scale: 1, rotate: 0, stagger: .025, duration: .16 });

  const scrollTrigger = ScrollTrigger.create({
    animation: masterTimeline,
    trigger: scene,
    scroller: scrollport,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true
  });
  window.__PREVIEW_RUNTIME_ASSERT__ = () => scrollTrigger.animation === masterTimeline && scrollTrigger.vars.scrub === true;
  ScrollTrigger.refresh();

  const render = time => {
    const cycle = (time % 4) / 4;
    const progress = cycle < .5 ? cycle * 2 : (1 - cycle) * 2;
    const scrollDistance = scene.scrollHeight - scrollport.clientHeight;
    scrollport.scrollTop = progress * scrollDistance;
    ScrollTrigger.update(true);
    progressBar.style.transform = `scaleX(${progress})`;
    progressDot.style.left = `calc(${progress * 100}% - ${progress * 10}px)`;
  };

  installPreviewController({
    id: 'scroll-scrubbed-master-timeline',
    library: 'gsap@3.15.0',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
