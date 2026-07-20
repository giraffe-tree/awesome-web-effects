import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, loopTime, smoothstep } from './batch-c-utils.js';

const CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';
const PHOTO_URL = new URL('../assets/aesthetic-collection/coastal-retreat.jpg', import.meta.url).href;
const HASH_WIDTH = 32;
const HASH_HEIGHT = 18;
const COMPONENT_X = 4;
const COMPONENT_Y = 3;
const PHOTO_FRAME = { x: 100, y: 22, width: 209, height: 144, radius: 13 };

const decode83 = value => [...value].reduce((number, character) => number * 83 + CHARACTERS.indexOf(character), 0);

function encode83(value, length) {
  let result = '';
  for (let index = 1; index <= length; index += 1) {
    const divisor = 83 ** (length - index);
    result += CHARACTERS[Math.floor(value / divisor) % 83];
  }
  return result;
}

const sRGBToLinear = value => {
  const normalized = value / 255;
  return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
};

const linearToSRGB = value => Math.round(clamp(
  value <= .0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - .055
) * 255);

const signPow = (value, exponent) => Math.sign(value) * Math.abs(value) ** exponent;

function multiplyBasis(pixels, width, height, componentX, componentY) {
  const normalization = componentX === 0 && componentY === 0 ? 1 : 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const basis = Math.cos(Math.PI * componentX * x / width) * Math.cos(Math.PI * componentY * y / height);
      const offset = (x + y * width) * 4;
      red += basis * sRGBToLinear(pixels[offset]);
      green += basis * sRGBToLinear(pixels[offset + 1]);
      blue += basis * sRGBToLinear(pixels[offset + 2]);
    }
  }

  const scale = normalization / (width * height);
  return [red * scale, green * scale, blue * scale];
}

function encodeBlurHash(pixels, width, height, componentsX = COMPONENT_X, componentsY = COMPONENT_Y) {
  const factors = [];
  for (let y = 0; y < componentsY; y += 1) {
    for (let x = 0; x < componentsX; x += 1) factors.push(multiplyBasis(pixels, width, height, x, y));
  }

  const maximum = Math.max(...factors.slice(1).flatMap(color => color.map(Math.abs)));
  const quantizedMaximum = Math.floor(clamp(Math.floor(maximum * 166 - .5), 0, 82));
  const maximumValue = (quantizedMaximum + 1) / 166;
  const dc = factors[0].map(linearToSRGB);
  const dcValue = (dc[0] << 16) + (dc[1] << 8) + dc[2];
  let hash = encode83((componentsX - 1) + (componentsY - 1) * 9, 1);
  hash += encode83(quantizedMaximum, 1);
  hash += encode83(dcValue, 4);

  for (const color of factors.slice(1)) {
    const quantized = color.map(channel => Math.floor(clamp(signPow(channel / maximumValue, .5) * 9 + 9.5, 0, 18)));
    hash += encode83(quantized[0] * 19 * 19 + quantized[1] * 19 + quantized[2], 2);
  }
  return hash;
}

function decodeBlurHash(hash, width, height) {
  const size = decode83(hash[0]);
  const nx = size % 9 + 1;
  const ny = Math.floor(size / 9) + 1;
  const maximum = (decode83(hash[1]) + 1) / 166;
  const colors = [];

  for (let index = 0; index < nx * ny; index += 1) {
    if (index === 0) {
      const value = decode83(hash.slice(2, 6));
      colors.push([sRGBToLinear(value >> 16), sRGBToLinear((value >> 8) & 255), sRGBToLinear(value & 255)]);
    } else {
      const value = decode83(hash.slice(4 + index * 2, 6 + index * 2));
      const red = Math.floor(value / (19 * 19));
      const green = Math.floor(value / 19) % 19;
      const blue = value % 19;
      colors.push([
        signPow((red - 9) / 9, 2) * maximum,
        signPow((green - 9) / 9, 2) * maximum,
        signPow((blue - 9) / 9, 2) * maximum,
      ]);
    }
  }

  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let red = 0;
      let green = 0;
      let blue = 0;
      for (let componentY = 0; componentY < ny; componentY += 1) {
        for (let componentX = 0; componentX < nx; componentX += 1) {
          const basis = Math.cos(Math.PI * x * componentX / width) * Math.cos(Math.PI * y * componentY / height);
          const color = colors[componentX + componentY * nx];
          red += color[0] * basis;
          green += color[1] * basis;
          blue += color[2] * basis;
        }
      }
      const offset = (x + y * width) * 4;
      pixels[offset] = linearToSRGB(red);
      pixels[offset + 1] = linearToSRGB(green);
      pixels[offset + 2] = linearToSRGB(blue);
      pixels[offset + 3] = 255;
    }
  }
  return { pixels, nx, ny };
}

function drawCover(context, image, frame) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const sourceRatio = imageWidth / imageHeight;
  const targetRatio = frame.width / frame.height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = imageWidth;
  let sourceHeight = imageHeight;
  if (sourceRatio > targetRatio) {
    sourceWidth = imageHeight * targetRatio;
    sourceX = (imageWidth - sourceWidth) / 2;
  } else {
    sourceHeight = imageWidth / targetRatio;
    sourceY = (imageHeight - sourceHeight) / 2;
  }
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
  );
}

try {
  const host = document.querySelector('#blurhash-host');
  const state = document.querySelector('#decode-state');
  let time = 0;
  let draws = 0;
  let lastRealtime = -Infinity;
  let sketch;
  const photo = new Image();
  let placeholder;
  let blurHash = '';
  let decoded;
  let imageLoaded = false;
  let resolveSketchReady;
  const sketchReady = new Promise(resolve => { resolveSketchReady = resolve; });
  photo.decoding = 'async';
  photo.src = PHOTO_URL;
  const imageReady = photo.decode().then(() => { imageLoaded = true; });
  const ready = Promise.all([document.fonts.ready, sketchReady, imageReady]).then(() => {
    const sample = document.createElement('canvas');
    sample.width = 48;
    sample.height = 27;
    const sampleContext = sample.getContext('2d', { willReadFrequently: true });
    sampleContext.drawImage(photo, 0, 0, sample.width, sample.height);
    const samplePixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
    blurHash = encodeBlurHash(samplePixels, sample.width, sample.height);
    decoded = decodeBlurHash(blurHash, HASH_WIDTH, HASH_HEIGHT);
    placeholder = sketch.createImage(HASH_WIDTH, HASH_HEIGHT);
    placeholder.loadPixels();
    placeholder.pixels.set(decoded.pixels);
    placeholder.updatePixels();
  }).catch(error => {
    markPreviewFailure(error);
    throw error;
  });

  host.addEventListener('keydown', event => {
    if (event.key === ' ') {
      event.preventDefault();
      time = 0;
    }
  });

  sketch = new p5(p => {
    p.setup = () => {
      try {
        p.pixelDensity(1);
        p.createCanvas(innerWidth, innerHeight).parent(host);
        p.noLoop();
        resolveSketchReady();
      } catch (error) {
        markPreviewFailure(error);
      }
    };

    p.draw = () => {
      if (!placeholder || !photo) return;
      draws += 1;
      const phase = loopTime(time) / 3;
      const reveal = phase < .18
        ? 0
        : phase < .5
          ? smoothstep((phase - .18) / .32)
          : phase < .82
            ? 1
            : 1 - smoothstep((phase - .82) / .18);
      const context = p.drawingContext;

      p.background('#e9e4da');
      context.save();
      context.beginPath();
      context.roundRect(PHOTO_FRAME.x, PHOTO_FRAME.y, PHOTO_FRAME.width, PHOTO_FRAME.height, PHOTO_FRAME.radius);
      context.clip();
      context.imageSmoothingEnabled = true;
      p.image(placeholder, PHOTO_FRAME.x, PHOTO_FRAME.y, PHOTO_FRAME.width, PHOTO_FRAME.height);
      if (reveal > 0) {
        context.save();
        context.globalAlpha = reveal;
        context.filter = `blur(${(1 - reveal) * 9}px) saturate(${.88 + reveal * .12})`;
        drawCover(context, photo, PHOTO_FRAME);
        context.restore();
      }
      if (reveal < .96) {
        const shimmerX = PHOTO_FRAME.x - 55 + (PHOTO_FRAME.width + 110) * clamp((phase - .03) / .47);
        const shimmer = context.createLinearGradient(shimmerX - 38, 0, shimmerX + 38, 0);
        shimmer.addColorStop(0, 'rgba(255,255,255,0)');
        shimmer.addColorStop(.5, `rgba(255,255,255,${.1 * (1 - reveal)})`);
        shimmer.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = shimmer;
        context.fillRect(PHOTO_FRAME.x, PHOTO_FRAME.y, PHOTO_FRAME.width, PHOTO_FRAME.height);
      }
      context.restore();

      const percentage = Math.round(reveal * 100);
      state.dataset.ready = String(percentage === 100);
      state.textContent = percentage === 0 ? 'HASH · WAITING' : percentage === 100 ? 'PHOTO · READY' : `DETAIL · ${String(percentage).padStart(2, '0')}%`;
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    sketch instanceof p5
    && imageLoaded
    && photo?.width === 960
    && photo?.height === 540
    && blurHash.length === 28
    && decoded?.pixels.length === HASH_WIDTH * HASH_HEIGHT * 4
    && decoded?.nx === COMPONENT_X
    && decoded?.ny === COMPONENT_Y
    && draws > 0
  );

  installPreviewController({
    id: 'blurhash-to-photo-progressive-reveal',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: (seconds, manual) => {
      if (!manual && seconds - lastRealtime < 1 / 24) return;
      lastRealtime = seconds;
      time = seconds;
      sketch.redraw();
    },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
