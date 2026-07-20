import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, loopTime, smoothstep } from './batch-c-utils.js';

try {
  const stage = document.querySelector('#palette-stage');
  const host = document.querySelector('#palette-host');
  const name = document.querySelector('#stay-name');
  const location = document.querySelector('#stay-location');
  const kicker = document.querySelector('#stay-kicker');
  const price = document.querySelector('#stay-price');
  const chip = document.querySelector('#palette-chip');
  const chipValue = document.querySelector('#palette-value');
  const swatches = [...chip.querySelectorAll('i')];
  const buttons = [...document.querySelectorAll('[data-stay]')];

  const stays = [
    {
      imageUrl: new URL('../assets/aesthetic-collection/coastal-retreat.jpg', import.meta.url).href,
      name: 'AEGEAN<br>HUSH',
      location: 'Amorgos · Greece',
      kicker: 'Coast · sea-level calm',
      price: '$240'
    },
    {
      imageUrl: new URL('../assets/aesthetic-collection/courtyard-pool.jpg', import.meta.url).href,
      name: 'OLIVE<br>COURT',
      location: 'Alentejo · Portugal',
      kicker: 'Courtyard · slow mornings',
      price: '$310'
    },
    {
      imageUrl: new URL('../assets/aesthetic-collection/desert-observatory.jpg', import.meta.url).href,
      name: 'NIGHT<br>ORBIT',
      location: 'Atacama · Chile',
      kicker: 'Desert · dark-sky stay',
      price: '$280'
    }
  ];

  let images = [];
  let palettes = [];
  let selected = null;
  let activeIndex = -1;
  let time = 0;
  let draws = 0;
  let sampledPixelCount = 0;
  let lastRealtime = -Infinity;
  let sketch;
  let resolveCanvas;

  const canvasReady = new Promise(resolve => { resolveCanvas = resolve; });
  const imagesReady = Promise.all(stays.map(stay => {
    const image = new Image();
    image.decoding = 'async';
    image.src = stay.imageUrl;
    return image.decode().then(() => image);
  }));

  const luminance = color => color[0] * .2126 + color[1] * .7152 + color[2] * .0722;
  const mixColor = (from, to, amount) => from.map((value, index) => value + (to[index] - value) * amount);
  const rgb = (color, alpha = 1) => `rgba(${color.map(value => Math.round(value)).join(',')},${alpha})`;
  const hex = color => `#${color.map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

  function weightedMean(samples, weightFor) {
    const total = [0, 0, 0];
    let weightTotal = 0;
    samples.forEach(sample => {
      const weight = weightFor(sample);
      total[0] += sample.color[0] * weight;
      total[1] += sample.color[1] * weight;
      total[2] += sample.color[2] * weight;
      weightTotal += weight;
    });
    return total.map(value => value / Math.max(1, weightTotal));
  }

  function sampleImagePalette(image) {
    const sampler = document.createElement('canvas');
    sampler.width = 64;
    sampler.height = 36;
    const context = sampler.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, sampler.width, sampler.height);
    const data = context.getImageData(0, 0, sampler.width, sampler.height).data;
    const samples = [];
    let checksum = 2166136261;

    for (let offset = 0; offset < data.length; offset += 4) {
      const color = [data[offset], data[offset + 1], data[offset + 2]];
      const high = Math.max(...color);
      const low = Math.min(...color);
      const saturation = high ? (high - low) / high : 0;
      samples.push({ color, light: luminance(color), saturation });
      checksum = Math.imul(checksum ^ data[offset], 16777619);
      checksum = Math.imul(checksum ^ data[offset + 1], 16777619);
      checksum = Math.imul(checksum ^ data[offset + 2], 16777619);
    }

    sampledPixelCount += samples.length;
    samples.sort((left, right) => left.light - right.light);
    const shadowSamples = samples.slice(0, Math.ceil(samples.length * .28));
    const highlightSamples = samples.slice(Math.floor(samples.length * .76));
    const ambient = weightedMean(samples, sample => .55 + sample.saturation * 1.7);
    const shadow = weightedMean(shadowSamples, sample => .7 + sample.saturation);
    const highlight = weightedMean(highlightSamples, () => 1);

    return { shadow, ambient, highlight, checksum: checksum >>> 0 };
  }

  function drawCover(context, image, x, y, width, height, radius, alpha, zoom, drift) {
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const targetRatio = width / height;
    let sourceWidth;
    let sourceHeight;
    if (sourceRatio > targetRatio) {
      sourceHeight = image.naturalHeight / zoom;
      sourceWidth = sourceHeight * targetRatio;
    } else {
      sourceWidth = image.naturalWidth / zoom;
      sourceHeight = sourceWidth / targetRatio;
    }
    const travel = Math.max(0, image.naturalWidth - sourceWidth);
    const sourceX = clamp((image.naturalWidth - sourceWidth) / 2 + drift * travel * .18, 0, image.naturalWidth - sourceWidth);
    const sourceY = Math.max(0, (image.naturalHeight - sourceHeight) / 2);

    context.save();
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.clip();
    context.globalAlpha = alpha;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    context.restore();
  }

  function updateInterface(index, palette) {
    if (index !== activeIndex) {
      activeIndex = index;
      const stay = stays[index];
      name.innerHTML = stay.name;
      location.textContent = stay.location;
      kicker.textContent = stay.kicker;
      price.textContent = stay.price;
      buttons.forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(buttonIndex === index)));
    }

    const readableInk = mixColor(palette.highlight, [255, 252, 244], .62);
    const quietInk = mixColor(readableInk, palette.ambient, .26);
    const active = mixColor(palette.ambient, palette.highlight, .28);
    stage.style.setProperty('--palette-ink', rgb(readableInk));
    stage.style.setProperty('--palette-muted', rgb(quietInk, .76));
    stage.style.setProperty('--palette-line', rgb(readableInk, .22));
    stage.style.setProperty('--palette-panel', rgb(mixColor(palette.shadow, [4, 7, 8], .48), .72));
    stage.style.setProperty('--palette-active', rgb(active));
    swatches[0].style.background = rgb(palette.shadow);
    swatches[1].style.background = rgb(palette.ambient);
    swatches[2].style.background = rgb(palette.highlight);
    chipValue.textContent = hex(palette.ambient);
  }

  function selectStay(index, focus = false) {
    selected = (index + stays.length) % stays.length;
    if (focus) buttons[selected].focus();
    sketch.redraw();
  }

  buttons.forEach((button, index) => button.addEventListener('click', () => selectStay(index)));
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') {
      selected = null;
      sketch.redraw();
      return;
    }
    if (event.key === 'Home') return selectStay(0, true);
    if (event.key === 'End') return selectStay(stays.length - 1, true);
    const origin = selected ?? activeIndex;
    selectStay(origin + (event.key === 'ArrowRight' ? 1 : -1), true);
  });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(host);
      p.noLoop();
      resolveCanvas();
    };

    p.draw = () => {
      if (!images.length || !palettes.length) {
        p.background('#142028');
        return;
      }
      draws++;
      const raw = selected === null ? loopTime(time) : selected;
      const current = Math.floor(raw) % stays.length;
      const next = selected === null ? (current + 1) % stays.length : current;
      const local = selected === null ? raw - Math.floor(raw) : 0;
      const transition = selected === null ? smoothstep(clamp((local - .58) / .42)) : 0;
      const palette = {
        shadow: mixColor(palettes[current].shadow, palettes[next].shadow, transition),
        ambient: mixColor(palettes[current].ambient, palettes[next].ambient, transition),
        highlight: mixColor(palettes[current].highlight, palettes[next].highlight, transition)
      };
      const shown = transition >= .5 ? next : current;
      updateInterface(shown, palette);

      const context = p.drawingContext;
      const scaleX = p.width / 320;
      const scaleY = p.height / 180;
      context.save();
      context.scale(scaleX, scaleY);

      const background = context.createLinearGradient(0, 0, 320, 180);
      background.addColorStop(0, rgb(mixColor(palette.shadow, [4, 8, 10], .35)));
      background.addColorStop(.55, rgb(mixColor(palette.ambient, palette.shadow, .32)));
      background.addColorStop(1, rgb(mixColor(palette.highlight, palette.ambient, .52)));
      context.fillStyle = background;
      context.fillRect(0, 0, 320, 180);

      const glow = context.createRadialGradient(238, 74, 4, 238, 74, 128);
      glow.addColorStop(0, rgb(palette.highlight, .18));
      glow.addColorStop(1, rgb(palette.shadow, 0));
      context.fillStyle = glow;
      context.fillRect(104, 0, 216, 150);

      context.fillStyle = 'rgba(4,8,9,.2)';
      context.fillRect(0, 0, 121, 180);

      context.shadowBlur = 24;
      context.shadowColor = 'rgba(0,0,0,.34)';
      drawCover(context, images[current], 122, 20, 188, 116, 13, 1 - transition, 1.035, local - .5);
      if (next !== current) drawCover(context, images[next], 122, 20, 188, 116, 13, transition, 1.035, local - .5);
      context.shadowBlur = 0;

      const imageShade = context.createLinearGradient(122, 60, 122, 136);
      imageShade.addColorStop(0, 'rgba(0,0,0,0)');
      imageShade.addColorStop(1, 'rgba(0,0,0,.34)');
      context.fillStyle = imageShade;
      context.beginPath();
      context.roundRect(122, 20, 188, 116, 13);
      context.fill();

      context.fillStyle = 'rgba(255,255,255,.88)';
      context.font = '800 5px ui-monospace, monospace';
      context.letterSpacing = '0.6px';
      context.fillText(`0${shown + 1} / 03  ·  PALETTE FROM IMAGE PIXELS`, 136, 126);
      context.restore();
    };
  }, host);

  const ready = Promise.all([imagesReady, canvasReady, document.fonts.ready]).then(([loadedImages]) => {
    images = loadedImages;
    palettes = images.map(sampleImagePalette);
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const uniqueChecksums = new Set(palettes.map(palette => palette.checksum));
    return sketch instanceof p5
      && images.length === 3
      && images.every(image => image.complete && image.naturalWidth >= 900 && image.naturalHeight >= 500)
      && palettes.length === 3
      && sampledPixelCount === 64 * 36 * 3
      && uniqueChecksums.size === 3
      && palettes.every(palette => [palette.shadow, palette.ambient, palette.highlight]
        .every(color => color.length === 3 && color.every(Number.isFinite)))
      && buttons.length === 3
      && draws > 0;
  };

  installPreviewController({
    id: 'image-palette-ambient-color-transition',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: (previewTime, manual) => {
      if (!manual && previewTime - lastRealtime < 1 / 24) return;
      lastRealtime = previewTime;
      time = previewTime;
      sketch.redraw();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
