#!/usr/bin/env node

import { mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { effects } from '../demo/data/effects.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = resolve(root, 'demo', 'gifs');
const force = process.argv.includes('--force');
const width = 320;
const height = 180;
const fps = 12;
const frameCount = 24;

const palettes = {
  animation: [[246, 247, 249], [0, 113, 227], [111, 73, 255]],
  scroll: [[244, 248, 250], [0, 153, 204], [46, 204, 113]],
  transition: [[248, 246, 252], [94, 92, 230], [255, 69, 96]],
  carousel: [[250, 248, 242], [255, 149, 0], [0, 113, 227]],
  pointer: [[250, 246, 244], [255, 59, 48], [255, 149, 0]],
  vector: [[250, 245, 250], [191, 54, 170], [0, 113, 227]],
  canvas: [[243, 249, 246], [36, 138, 61], [0, 113, 227]],
  webgl: [[242, 246, 252], [0, 102, 204], [94, 92, 230]],
  background: [[248, 244, 252], [175, 82, 222], [0, 199, 190]],
  media: [[250, 246, 242], [255, 110, 64], [0, 113, 227]]
};

const hash = value => [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const mix = (a, b, amount) => a.map((value, index) => Math.round(value + (b[index] - value) * amount));
const wave = (time, offset = 0) => (Math.sin((time + offset) * Math.PI * 2) + 1) / 2;
const ease = value => value < .5 ? 2 * value * value : 1 - ((-2 * value + 2) ** 2) / 2;

function pixel(frame, x, y, color, alpha = 1) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const index = (y * width + x) * 3;
  frame[index] = Math.round(frame[index] * (1 - alpha) + color[0] * alpha);
  frame[index + 1] = Math.round(frame[index + 1] * (1 - alpha) + color[1] * alpha);
  frame[index + 2] = Math.round(frame[index + 2] * (1 - alpha) + color[2] * alpha);
}

function rect(frame, x, y, w, h, color, alpha = 1) {
  const left = clamp(Math.floor(x), 0, width);
  const top = clamp(Math.floor(y), 0, height);
  const right = clamp(Math.ceil(x + w), 0, width);
  const bottom = clamp(Math.ceil(y + h), 0, height);
  for (let py = top; py < bottom; py += 1) for (let px = left; px < right; px += 1) pixel(frame, px, py, color, alpha);
}

function circle(frame, cx, cy, radius, color, alpha = 1) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      if (((x - cx) ** 2) + ((y - cy) ** 2) <= r2) pixel(frame, x, y, color, alpha);
    }
  }
}

function line(frame, x1, y1, x2, y2, color, thickness = 2, alpha = 1) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1)));
  for (let step = 0; step <= steps; step += 1) {
    const amount = step / steps;
    circle(frame, x1 + (x2 - x1) * amount, y1 + (y2 - y1) * amount, thickness, color, alpha);
  }
}

function baseFrame(background, accent) {
  const frame = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    const rowColor = mix(background, [255, 255, 255], y / height * .12);
    for (let x = 0; x < width; x += 1) {
      const glow = Math.max(0, 1 - Math.hypot(x - width * .82, y - height * .18) / 150) * .08;
      const color = mix(rowColor, accent, glow);
      const index = (y * width + x) * 3;
      frame[index] = color[0]; frame[index + 1] = color[1]; frame[index + 2] = color[2];
    }
  }
  return frame;
}

function cards(frame, time, accent, secondary, mode) {
  if (mode === 0) {
    const x = 24 + ease(wave(time)) * 190;
    rect(frame, x, 57, 82, 66, [255, 255, 255]); rect(frame, x, 57, 8, 66, accent); circle(frame, x + 24, 82, 8, secondary);
  } else if (mode === 1) {
    for (let index = 0; index < 5; index += 1) {
      const amount = clamp(time * 1.8 - index * .12, 0, 1);
      rect(frame, 38 + index * 52, 80 - ease(amount) * 34, 40, 40, index % 2 ? secondary : accent, .9);
    }
  } else if (mode === 2) {
    const amount = wave(time);
    circle(frame, 160, 90, 18 + amount * 30, accent, 1 - amount * .25);
    rect(frame, 135 - amount * 16, 65 - amount * 10, 50 + amount * 32, 50 + amount * 20, secondary, amount * .55);
  } else if (mode === 3) {
    for (let index = 0; index < 14; index += 1) {
      const angle = index / 14 * Math.PI * 2;
      const radius = 14 + ease(clamp(time * 2, 0, 1)) * 58;
      circle(frame, 160 + Math.cos(angle) * radius, 90 + Math.sin(angle) * radius, 4 + index % 3, index % 2 ? accent : secondary);
    }
  } else if (mode === 4) {
    const y = 38 + Math.abs(Math.sin(time * Math.PI * 2)) * 80;
    circle(frame, 160, y, 20, accent); rect(frame, 80, 132, 160, 6, secondary, .45);
  } else {
    for (let index = 0; index < 4; index += 1) {
      const progress = clamp(time * 1.6 - index * .16, 0, 1);
      rect(frame, 42, 42 + index * 27, 220 * ease(progress), 12, index % 2 ? secondary : accent, .85);
    }
  }
}

function scrollScene(frame, time, accent, secondary, mode) {
  if (mode === 0) {
    for (let index = 0; index < 4; index += 1) rect(frame, 35 + index * 76 - time * 180, 48 + (index % 2) * 22, 64, 84, index % 2 ? secondary : accent, .78);
  } else if (mode === 1) {
    for (let index = 0; index < 5; index += 1) rect(frame, 48, 22 + index * 46 - time * 90, 224, 34, [255, 255, 255]);
    rect(frame, 278, 18 + time * 118, 5, 34, accent);
  } else if (mode === 2) {
    circle(frame, 78 + time * 52, 72, 40, secondary, .35); circle(frame, 210 + time * 92, 110, 54, accent, .3); rect(frame, 86, 73, 148, 58, [255, 255, 255], .85);
  } else if (mode === 3) {
    for (let index = 0; index < 3; index += 1) { const reveal = clamp(time * 2 - index * .22, 0, 1); rect(frame, 42 + index * 84, 116 - reveal * 54, 64, 50, index % 2 ? secondary : accent, reveal); }
  } else if (mode === 4) {
    for (let index = 0; index < 7; index += 1) rect(frame, 56, 18 + ((index * 34 - time * 92 + 210) % 238) - 30, 208, 25, index % 2 ? [255, 255, 255] : mix(accent, [255, 255, 255], .65));
  } else if (mode === 6) {
    rect(frame, 58, 20, 204, 140, [255, 255, 255]);
    const scrollOffset = Math.max(0, time - .48) * 96;
    for (let index = 0; index < 7; index += 1) {
      const y = 38 + index * 20 - scrollOffset;
      const reveal = clamp(time * 8 - index * .72, 0, 1);
      rect(frame, 78, y, (92 + (index % 3) * 22) * reveal, 7, index < 2 ? secondary : accent, .28 + reveal * .62);
    }
    const cursorY = 38 + Math.min(6, Math.floor(time * 8)) * 20 - scrollOffset;
    rect(frame, 76, cursorY, 3, 12, secondary, .95);
    rect(frame, 248, 30 + time * 92, 4, 26, accent, .7);
  } else if (mode === 7) {
    const scrolled = time > .32 && time < .84;
    const pageY = time < .6 ? time * 176 : (1 - time) * 176;
    rect(frame, 0, 0, width, height, scrolled ? [246, 244, 238] : [60, 55, 116]);
    for (let index = 0; index < 5; index += 1) {
      rect(frame, 44, 56 + index * 34 - pageY, 232, 18, index % 2 ? mix(accent, [255, 255, 255], .7) : mix(secondary, [255, 255, 255], .75), .82);
    }
    rect(frame, 0, 0, width, 43, scrolled ? [255, 255, 255] : [60, 55, 116], scrolled ? .98 : .96);
    rect(frame, 22, 17, 68, 8, scrolled ? [33, 36, 44] : [255, 255, 255], .9);
    for (let index = 0; index < 3; index += 1) rect(frame, 208 + index * 29, 18, 18, 6, scrolled ? [33, 36, 44] : [255, 255, 255], .72);
    if (scrolled) rect(frame, 0, 42, width, 2, accent, .16);
  } else {
    for (let index = 0; index < 3; index += 1) rect(frame, 36, 24 + index * 52, 230, 42, index === Math.floor(time * 3) % 3 ? accent : [255, 255, 255], index === Math.floor(time * 3) % 3 ? .85 : 1);
  }
}

function transitionScene(frame, time, accent, secondary, mode) {
  if (mode === 0) {
    rect(frame, 26, 28, 268, 124, [255, 255, 255]); rect(frame, 26, 28, 268 * ease(time), 124, accent, .86);
  } else if (mode === 1 || mode === 5) {
    for (let index = 0; index < 6; index += 1) {
      const column = index % 3; const row = Math.floor(index / 3);
      const shift = wave(time, index * .08) * 22;
      rect(frame, 42 + column * 82 + (mode === 5 && index % 2 ? 34 * time : 0), 42 + row * 62 + (index % 2 ? shift : -shift), 58, 42, index % 2 ? secondary : accent, .82);
    }
  } else if (mode === 2) {
    const amount = ease(wave(time)); rect(frame, 54 + amount * 94, 48 - amount * 18, 66 + amount * 72, 70 + amount * 36, accent, .82);
  } else if (mode === 3) {
    rect(frame, 0, 0, width, height, [20, 25, 35], time * .35); rect(frame, width - ease(time) * 210, 0, 210, height, [255, 255, 255]); rect(frame, width - ease(time) * 188, 30, 150, 12, accent);
  } else if (mode === 6) {
    const boundary = 52 + time * 216;
    rect(frame, 0, 0, boundary, height, [24, 28, 35]);
    rect(frame, boundary, 0, width - boundary, height, [246, 244, 238]);
    const navigation = [[28, 28, 46], [226, 28, 66]];
    navigation.forEach(([x, y, w]) => {
      const leftWidth = clamp(boundary - x, 0, w);
      rect(frame, x, y, leftWidth, 9, [255, 255, 255], .96);
      rect(frame, x + leftWidth, y, w - leftWidth, 9, [18, 21, 26], .96);
    });
    rect(frame, 62, 112, 196, 7, boundary > 160 ? secondary : accent, .62);
  } else if (mode === 7) {
    rect(frame, 52, 28, 216, 128, [255, 255, 255]);
    for (let index = 0; index < 3; index += 1) rect(frame, 72, 48 + index * 24, 92 + index * 18, 7, [173, 178, 188], .5);
    rect(frame, 68, 116, 184, 24, [239, 241, 245]);
    const sweep = clamp((time - .16) / .68, 0, 1);
    const x = 34 + sweep * 252;
    for (let index = -16; index <= 16; index += 1) {
      const amount = 1 - Math.abs(index) / 17;
      rect(frame, x + index * 3, 116, 4, 24, mix(accent, secondary, (index + 16) / 32), amount * .58);
    }
  } else {
    rect(frame, 30, 42, 260 * wave(time), 96, accent, .7); rect(frame, 30 + 260 * wave(time), 42, 260 * (1 - wave(time)), 96, secondary, .65);
  }
}

function overlayScene(frame, time, accent, secondary, mode) {
  if (mode === 0) {
    for (let index = -1; index < 5; index += 1) { const x = 52 + (index - time * 1.4) * 72; rect(frame, x, 48 + Math.abs(index - 1) * 8, 58, 84, index === 1 ? accent : [255, 255, 255], index === 1 ? .9 : .75); }
  } else if (mode === 1) {
    rect(frame, 0, 0, width, height, [15, 18, 24], .25 + time * .35); rect(frame, 82, 98 - ease(time) * 62, 156, 78, [255, 255, 255]); circle(frame, 160, 74 - ease(time) * 24, 14, accent);
  } else if (mode === 2) {
    rect(frame, 66, 26, 188, 128, [255, 255, 255]); for (let index = 0; index < 4; index += 1) rect(frame, 82, 48 + index * 23, 156, 15, index === Math.floor(time * 4) % 4 ? accent : mix(secondary, [255, 255, 255], .75));
  } else if (mode === 3) {
    for (let index = 0; index < 3; index += 1) rect(frame, 162 + index * 8, 126 - index * 34 - ease(clamp(time * 2 - index * .18, 0, 1)) * 26, 118, 26, index % 2 ? secondary : accent, .9);
  } else if (mode === 4) {
    rect(frame, 62, 64, 92, 48, accent, .8); rect(frame, 174, 72, 88, 36, [255, 255, 255]); circle(frame, 152 + Math.sin(time * Math.PI * 2) * 22, 88, 8, secondary);
  } else {
    const x = 48 + ease(wave(time)) * 170; rect(frame, x, 58, 92, 64, accent, .82); rect(frame, 36, 132, 248, 5, secondary, .4);
  }
}

function pointerScene(frame, time, accent, secondary, mode) {
  const cx = 48 + time * 224; const cy = 90 + Math.sin(time * Math.PI * 2) * 42;
  if (mode === 0) for (let index = 0; index < 12; index += 1) circle(frame, cx - index * 12, cy - Math.sin((time - index / 30) * Math.PI * 2) * 4, 8 - index * .45, mix(accent, secondary, index / 12), 1 - index / 14);
  else if (mode === 1) { rect(frame, 82 + (cx - 160) * .08, 42 + (cy - 90) * .08, 156, 96, [255, 255, 255]); line(frame, 84, 44, 236, 136, accent, 3, .6); circle(frame, cx, cy, 6, secondary); }
  else if (mode === 2) { const bx = 104 + (cx - 160) * .16; const by = 67 + (cy - 90) * .16; rect(frame, bx, by, 112, 46, accent, .9); circle(frame, cx, cy, 5, secondary); }
  else if (mode === 3) { rect(frame, 58, 38, 204, 104, secondary, .3); rect(frame, 58, 38, clamp(cx - 58, 0, 204), 104, accent, .78); circle(frame, cx, cy, 5, [255, 255, 255]); }
  else if (mode === 4) { rect(frame, 48, 35, 224, 110, [255, 255, 255]); for (let index = 0; index < 5; index += 1) circle(frame, 78 + index * 42, 64 + (index % 2) * 48, 7 + (Math.abs(cx - (78 + index * 42)) < 30 ? 8 : 0), index % 2 ? accent : secondary); }
  else if (mode === 6) {
    rect(frame, 60, 30, 200, 120, mix(secondary, [255, 255, 255], .68));
    circle(frame, 118, 88, 34, accent, .28);
    rect(frame, 154, 58, 72, 58, secondary, .42);
    const opacity = ease(wave(time));
    const corners = [[56, 26, 1, 1], [264, 26, -1, 1], [56, 154, 1, -1], [264, 154, -1, -1]];
    corners.forEach(([x, y, dx, dy]) => {
      line(frame, x, y, x + dx * 18, y, accent, 2, opacity);
      line(frame, x, y, x, y + dy * 18, accent, 2, opacity);
    });
    circle(frame, cx, cy, 4, [34, 38, 46], .7);
  }
  else if (mode === 7) {
    const active = time > .28 && time < .86;
    const amount = active ? ease(clamp((time - .28) * 5, 0, 1)) : ease(clamp((1 - time) * 7, 0, 1));
    rect(frame, 50, 30, 220, 120, mix([243, 241, 236], accent, amount * .6));
    rect(frame, 72, 58, 156, 10, [32, 35, 44], .9);
    rect(frame, 72, 76, 112, 7, [32, 35, 44], .5);
    rect(frame, 72, 119 - amount * 9, 92, 7, secondary, 1 - amount);
    rect(frame, 72, 110 + (1 - amount) * 9, 110, 8, [32, 35, 44], amount);
    line(frame, 186, 114, 204, 114, [32, 35, 44], 2, amount);
    line(frame, 198, 109, 204, 114, [32, 35, 44], 2, amount);
    line(frame, 198, 119, 204, 114, [32, 35, 44], 2, amount);
    circle(frame, cx, cy, 4, [32, 35, 44], .72);
  }
  else if (mode === 8) {
    const hovering = time > .2 && time < .72;
    const pressed = time >= .72 && time < .84;
    const amount = pressed ? 0 : hovering ? ease(clamp((time - .2) * 6, 0, 1)) : 0;
    const baseX = 94; const baseY = 66;
    rect(frame, baseX + amount * 10, baseY + amount * 10, 132, 48, accent, .88);
    rect(frame, baseX - amount * 5, baseY - amount * 5, 132, 48, [255, 255, 255]);
    rect(frame, baseX - amount * 5, baseY - amount * 5, 132, 3, [28, 31, 38]);
    rect(frame, baseX - amount * 5, baseY + 45 - amount * 5, 132, 3, [28, 31, 38]);
    rect(frame, baseX - amount * 5, baseY - amount * 5, 3, 48, [28, 31, 38]);
    rect(frame, baseX + 129 - amount * 5, baseY - amount * 5, 3, 48, [28, 31, 38]);
    rect(frame, 122 - amount * 5, 86 - amount * 5, 76, 7, [28, 31, 38], .82);
    circle(frame, cx, cy, 4, secondary, .76);
  }
  else if (mode === 9) {
    const visit = Math.min(4, Math.floor(time * 5) + 1);
    const local = (time * 5) % 1;
    const wiggle = local < .45 ? Math.sin(local * Math.PI * 8) * 4 : 0;
    rect(frame, 50, 74, 74, 32, [255, 255, 255]);
    rect(frame, 68, 87, 38, 7, [32, 35, 44], .86);
    const third = visit === 3;
    const badgeX = 126 + wiggle;
    rect(frame, badgeX, third ? 68 : 74, third ? 150 : 112, third ? 44 : 32, accent, .9);
    rect(frame, badgeX + 12, third ? 80 : 87, third ? 126 : 88, 7, [32, 35, 44], .8);
    if (third) rect(frame, badgeX + 12, 94, 92, 6, [32, 35, 44], .56);
    for (let index = 0; index < 4; index += 1) circle(frame, 135 + index * 17, 132, 4, index < visit ? secondary : [190, 194, 202], .9);
    circle(frame, cx, cy, 4, [32, 35, 44], .72);
  }
  else { for (let index = 0; index < 12; index += 1) line(frame, 30 + index * 24, 48, 30 + index * 24 + Math.sin(time * Math.PI * 2 + index) * 18, 132, index % 2 ? accent : secondary, 2, .7); circle(frame, cx, cy, 5, [20, 24, 32]); }
}

function vectorScene(frame, time, accent, secondary, mode) {
  if (mode === 0 || mode === 4) {
    let previous = [38, 118]; const progress = ease(time);
    for (let index = 1; index <= 80 * progress; index += 1) { const x = 38 + index * 3; const y = 96 + Math.sin(index / 9) * 38; line(frame, previous[0], previous[1], x, y, index % 2 ? accent : secondary, mode === 4 ? 2 : 3); previous = [x, y]; }
  } else if (mode === 1) {
    for (let index = 0; index < 9; index += 1) rect(frame, 44 + index * 25, 72, 16, 38 + (index % 3) * 12, index < Math.floor(time * 10) ? accent : [220, 223, 228]);
  } else if (mode === 2 || mode === 5) {
    for (let index = 0; index < 8; index += 1) { const flip = wave(time, index * .11); rect(frame, 48 + index * 29, 64, 21, 48 * Math.max(.12, Math.abs(flip - .5) * 2), index % 2 ? secondary : accent, .86); }
  } else if (mode === 3) {
    const amount = wave(time); circle(frame, 160, 90, 28 + amount * 24, accent, .7); rect(frame, 126 + amount * 16, 56 + amount * 12, 68 - amount * 32, 68 - amount * 24, secondary, .55);
  } else if (mode === 6) {
    let previous = [0, 100];
    for (let x = 0; x <= width; x += 3) {
      const y = 90 + Math.sin((x / width) * Math.PI * 2.2 - .7) * 38;
      line(frame, previous[0], previous[1], x, y, [177, 184, 198], 1, .55);
      previous = [x, y];
    }
    for (let index = 0; index < 14; index += 1) {
      const x = (index * 29 + time * 116) % (width + 36) - 18;
      const y = 90 + Math.sin((x / width) * Math.PI * 2.2 - .7) * 38;
      rect(frame, x - 5, y - 5, 10 + index % 3 * 4, 7, index % 2 ? accent : secondary, .9);
    }
  } else if (mode === 7) {
    const phase = time < .62 ? time / .62 : (time - .62) / .38;
    const visible = time < .62 ? Math.floor(phase * 16) : 16;
    if (time >= .62 && time < .86) rect(frame, 42, 62, 236, 34, mix(accent, [255, 255, 255], .56), .78);
    for (let index = 0; index < visible; index += 1) rect(frame, 48 + index * 13, 72, 8, 14, index % 3 ? [57, 61, 70] : secondary, .92);
    if (time < .62) rect(frame, 48 + visible * 13, 69, 3, 21, accent, .9);
    const chipScale = time < .86 ? 1 : ease(clamp((time - .86) / .14, 0, 1));
    rect(frame, 48, 112, 72 * chipScale, 24, secondary, .78);
  } else if (mode === 8) {
    const erasing = time < .46;
    const pause = time >= .46 && time < .58;
    const writingProgress = clamp((time - .58) / .34, 0, 1);
    const eraseProgress = clamp(time / .46, 0, 1);
    const count = erasing ? 8 - Math.floor(eraseProgress * 8) : pause ? 0 : Math.floor(writingProgress * 7);
    const dotX = erasing ? 228 - eraseProgress * 126 : pause ? 102 : 102 + writingProgress * 110;
    rect(frame, 40, 64, 76, 9, [54, 58, 68], .48);
    rect(frame, 40, 82, 62, 9, [54, 58, 68], .82);
    for (let index = 0; index < count; index += 1) {
      const x = erasing ? 102 + index * 16 : 102 + index * 16;
      rect(frame, x, 82, 10, 18, index % 2 ? accent : secondary, .88);
    }
    circle(frame, dotX, 108, 6, accent, .96);
  }
}

function canvasScene(frame, time, accent, secondary, mode, seed) {
  if (mode === 0 || mode === 4) {
    for (let index = 0; index < 26; index += 1) { const angle = (seed % 17 + index * 13) * .37; const x = 160 + Math.sin(angle + time * 4) * (28 + index * 3.2); const y = 90 + Math.cos(angle * 1.3 + time * 3) * (18 + index * 1.8); circle(frame, x, y, 2 + index % 4, index % 2 ? accent : secondary, .75); }
  } else if (mode === 1) {
    for (let index = 0; index < 7; index += 1) { const y = 34 + Math.abs(Math.sin(time * Math.PI * 2 + index)) * 104; circle(frame, 48 + index * 38, y, 9 + index % 3, index % 2 ? accent : secondary, .85); }
    rect(frame, 30, 148, 260, 5, [130, 135, 145], .4);
  } else if (mode === 2) {
    let previous = [38, 92]; for (let index = 1; index < 80; index += 1) { const x = 38 + index * 3; const y = 90 + Math.sin(index / 7 + time * 7) * 34; line(frame, previous[0], previous[1], x, y, mix(accent, secondary, index / 80), 3); previous = [x, y]; }
  } else if (mode === 3) {
    for (let index = 0; index < 5; index += 1) { const x = 54 + index * 48 + Math.sin(time * 6 + index) * 14; const y = 54 + (index % 2) * 50; rect(frame, x, y, 38, 32, index % 2 ? secondary : accent, .82); }
  } else if (mode === 6) {
    for (let chart = 0; chart < 3; chart += 1) {
      const x0 = 20 + chart * 101; const y0 = 48; const chartWidth = 86; const chartHeight = 82;
      rect(frame, x0, y0, chartWidth, chartHeight, [25, 29, 38], .96);
      const progress = clamp((time - chart * .2) * 2.1, 0, 1);
      if (progress === 0) {
        circle(frame, x0 + chartWidth / 2, y0 + chartHeight / 2, 7, chart % 2 ? accent : secondary, .42);
      } else {
        let previous = [x0 + 8, y0 + chartHeight * .66];
        const points = Math.floor(22 * ease(progress));
        for (let index = 1; index <= points; index += 1) {
          const x = x0 + 8 + index * 3.15;
          const y = y0 + chartHeight * .56 + Math.sin(index * .58 + chart) * (11 + chart * 2);
          line(frame, previous[0], previous[1], x, y, chart % 2 ? accent : secondary, 2, .92);
          previous = [x, y];
        }
        rect(frame, x0 + 8, y0 + 11, 38 * progress, 5, [255, 255, 255], .42);
      }
    }
  } else if (mode === 7) {
    const obstacleRadius = 22 + Math.sin(time * Math.PI * 4) * 3;
    circle(frame, 240, 104, obstacleRadius, accent, .86);
    rect(frame, 225, 100, 30, 7, [255, 255, 255], .72);
    for (let index = 0; index < 24; index += 1) {
      const phase = index * .57 + time * 3.7;
      const lane = 38 + (index % 6) * 20;
      let x = (index * 43 + time * 128) % 360 - 20;
      let y = lane + Math.sin(phase) * 12;
      const distance = Math.hypot(x - 240, y - 104);
      if (distance < 62) y += (y < 104 ? -1 : 1) * (62 - distance);
      const color = index === 23 ? [225, 32, 28] : index % 2 ? secondary : [128, 134, 145];
      line(frame, x - 7, y - 4, x + 7, y, color, 2, .86);
      line(frame, x - 7, y + 4, x + 7, y, color, 2, .86);
      line(frame, x - 7, y - 4, x - 3, y, color, 2, .86);
      line(frame, x - 7, y + 4, x - 3, y, color, 2, .86);
    }
    const dragX = 42 + time * 122; const dragY = 142 - time * 62;
    circle(frame, dragX, dragY, 4, [35, 38, 46], .7);
  } else {
    const offset = time * 42; for (let x = -40; x < width + 40; x += 24) line(frame, x + offset % 24, 0, x + offset % 24, height, accent, 1, .2); for (let y = -40; y < height + 40; y += 24) line(frame, 0, y + offset % 24, width, y + offset % 24, secondary, 1, .2); circle(frame, 160, 90, 18, accent, .85);
  }
}

function webglScene(frame, time, accent, secondary, mode) {
  if (mode === 0 || mode === 4) {
    const angle = time * Math.PI * 2; const points = [[-1,-1], [1,-1], [1,1], [-1,1]].map(([x,y]) => [160 + (x * Math.cos(angle) - y * Math.sin(angle)) * 34, 90 + (x * Math.sin(angle) + y * Math.cos(angle)) * 34]);
    const back = points.map(([x,y]) => [x + 22, y - 18]);
    for (let index = 0; index < 4; index += 1) { line(frame, points[index][0], points[index][1], points[(index + 1) % 4][0], points[(index + 1) % 4][1], accent, 2); line(frame, back[index][0], back[index][1], back[(index + 1) % 4][0], back[(index + 1) % 4][1], secondary, 2); line(frame, points[index][0], points[index][1], back[index][0], back[index][1], mix(accent, secondary, .5), 2); }
  } else if (mode === 1) {
    for (let index = 0; index < 40; index += 1) { const longitude = index * 2.4 + time * 5; const latitude = Math.sin(index * 1.7) * 1.2; circle(frame, 160 + Math.cos(longitude) * Math.cos(latitude) * 64, 90 + Math.sin(latitude) * 48, 3, index % 2 ? accent : secondary, .8); }
  } else if (mode === 2 || mode === 5) {
    for (let row = 0; row < 8; row += 1) { let previous = [24, 30 + row * 18]; for (let x = 25; x < 296; x += 6) { const y = 30 + row * 18 + Math.sin(x / 22 + time * 7 + row) * 9; line(frame, previous[0], previous[1], x, y, row % 2 ? accent : secondary, 1, .55); previous = [x, y]; } }
  } else {
    for (let radius = 48; radius > 10; radius -= 8) circle(frame, 160, 90, radius, radius % 16 ? secondary : accent, .06);
    circle(frame, 160, 90, 26 + wave(time) * 16, accent, .88);
  }
}

function backgroundScene(frame, time, accent, secondary, mode, seed) {
  if (mode === 0 || mode === 3) {
    for (let index = 0; index < 5; index += 1) circle(frame, 58 + index * 58 + Math.sin(time * 5 + index) * 24, 46 + (index % 2) * 68 + Math.cos(time * 4 + index) * 22, 34 + index % 3 * 9, index % 2 ? accent : secondary, .24);
  } else if (mode === 1) {
    const points = Array.from({ length: 18 }, (_, index) => [28 + ((seed + index * 67) % 264), 22 + ((seed * 3 + index * 41) % 136)]);
    points.forEach((point, index) => { const x = point[0] + Math.sin(time * 5 + index) * 9; const y = point[1] + Math.cos(time * 4 + index) * 7; circle(frame, x, y, 3, index % 2 ? accent : secondary); if (index) line(frame, x, y, points[index - 1][0], points[index - 1][1], accent, 1, .12); });
  } else if (mode === 2) {
    for (let index = 0; index < 32; index += 1) { const x = (seed + index * 83) % width; const y = ((index * 29 + time * 210) % 230) - 20; rect(frame, x, y, 4 + index % 7, 8 + index % 10, index % 2 ? accent : secondary, .85); }
  } else if (mode === 4) {
    for (let y = 18; y < height; y += 24) for (let x = 12; x < width; x += 28) { const shift = Math.sin(time * 4 + x + y) * 7; line(frame, x, y, x + 22, y + shift, (x + y) % 3 ? accent : secondary, 1, .35); }
  } else if (mode === 6) {
    rect(frame, 0, 0, width, height, [18, 25, 45], .96);
    [
      { count: 12, speed: 32, radius: 1, color: [125, 151, 190] },
      { count: 18, speed: 58, radius: 2, color: secondary },
      { count: 24, speed: 92, radius: 3, color: accent }
    ].forEach((layer, layerIndex) => {
      for (let index = 0; index < layer.count; index += 1) {
        const x = 12 + ((seed + index * (67 + layerIndex * 12)) % 296);
        const y = ((seed * (layerIndex + 3) + index * 41 + time * layer.speed) % 214) - 17;
        circle(frame, x, y, layer.radius, layer.color, .45 + layerIndex * .2);
      }
    });
  } else if (mode === 7) {
    rect(frame, 0, 0, width, height, mix([225, 219, 238], [198, 220, 235], wave(time)), .94);
    circle(frame, 74 + time * 190, 56 + Math.sin(time * 6) * 18, 72, accent, .18);
    circle(frame, 246 - time * 168, 128 + Math.cos(time * 5) * 16, 86, secondary, .2);
    circle(frame, 160 + Math.sin(time * 4) * 54, 88, 58, mix(accent, secondary, time), .22);
    rect(frame, 48, 62, 224, 56, [255, 255, 255], .38);
    for (let index = 0; index < 3; index += 1) rect(frame, 72, 76 + index * 13, 92 + index * 28, 5, [41, 45, 55], .64);
  } else {
    for (let burst = 0; burst < 3; burst += 1) { const progress = (time * 1.6 + burst * .32) % 1; const cx = 76 + burst * 84; const cy = 58 + (burst % 2) * 34; for (let ray = 0; ray < 12; ray += 1) { const angle = ray / 12 * Math.PI * 2; line(frame, cx + Math.cos(angle) * progress * 12, cy + Math.sin(angle) * progress * 12, cx + Math.cos(angle) * progress * 56, cy + Math.sin(angle) * progress * 56, burst % 2 ? accent : secondary, 2, 1 - progress); } }
  }
}

function mediaScene(frame, time, accent, secondary, mode) {
  rect(frame, 36, 24, 248, 132, [255, 255, 255]);
  if (mode === 0) { rect(frame, 36, 24, 248 * time, 132, accent, .72); rect(frame, 34 + 248 * time, 20, 4, 140, secondary); }
  else if (mode === 1) { const scale = 1 + wave(time) * .8; rect(frame, 160 - 86 * scale, 90 - 48 * scale, 172 * scale, 96 * scale, accent, .35); circle(frame, 160, 90, 22 * scale, secondary, .55); }
  else if (mode === 2) { const x = 56 - time * 72; for (let index = 0; index < 5; index += 1) rect(frame, x + index * 74, 42 + (index % 2) * 28, 62, 74, index % 2 ? accent : secondary, .45); }
  else if (mode === 3) { rect(frame, 80, 45, 160, 90, accent, .24); const inset = 10 + wave(time) * 26; line(frame, 80 + inset, 45 + inset, 240 - inset, 45 + inset, secondary, 2); line(frame, 240 - inset, 45 + inset, 240 - inset, 135 - inset, secondary, 2); line(frame, 240 - inset, 135 - inset, 80 + inset, 135 - inset, secondary, 2); line(frame, 80 + inset, 135 - inset, 80 + inset, 45 + inset, secondary, 2); }
  else if (mode === 4) { rect(frame, 36, 24, 248, 132, mix(accent, secondary, wave(time)), .58); for (let index = 0; index < 4; index += 1) circle(frame, 90 + index * 48, 90, 18, index % 2 ? accent : secondary, .45); }
  else if (mode === 6) {
    rect(frame, 36, 24, 248, 132, [218, 226, 236]);
    circle(frame, 102, 78, 42, [94, 120, 158], .8);
    rect(frame, 150, 48, 104, 76, [235, 145, 105], .78);
    circle(frame, 204, 104, 29, [45, 56, 76], .92);
    const far = ease(clamp(time * 2.1, 0, 1));
    const middle = ease(clamp(time * 2.1 - .42, 0, 1));
    const near = ease(clamp(time * 2.1 - .84, 0, 1));
    rect(frame, 36, 24, 248, 132, mix([218, 226, 236], [249, 225, 214], far), far);
    circle(frame, 102, 78, 42 + (1 - middle) * 7, mix([94, 120, 158], secondary, middle), .8 * middle);
    rect(frame, 150 - (1 - middle) * 5, 48, 104 + (1 - middle) * 10, 76, mix([235, 145, 105], accent, middle), .78 * middle);
    circle(frame, 204, 104, 29 + (1 - near) * 9, mix([45, 56, 76], [255, 255, 255], near), .92 * near);
  } else if (mode === 7) {
    rect(frame, 116, 26, 88, 128, [31, 35, 47]);
    circle(frame, 160, 28, 44, [31, 35, 47]);
    circle(frame, 160, 152, 44, [31, 35, 47]);
    rect(frame, 122, 34, 76, 112, mix(accent, secondary, wave(time)), .82);
    circle(frame, 160, 36, 38, mix(accent, secondary, wave(time)), .82);
    circle(frame, 160, 144, 38, mix(accent, secondary, wave(time)), .82);
    for (let index = 0; index < 4; index += 1) circle(frame, 138 + index * 16, 74 + Math.sin(time * 7 + index) * 24, 7 + index, index % 2 ? [255, 255, 255] : secondary, .72);
    rect(frame, 148, 34, 24, 4, [31, 35, 47], .9);
  } else if (mode === 8) {
    const timeline = time * 3;
    const segment = Math.floor(timeline) % 3;
    const local = timeline - Math.floor(timeline);
    const scenes = [[42, 71, 112], accent, secondary];
    const nextScene = scenes[(segment + 1) % scenes.length];
    const handoff = ease(clamp((local - .72) / .28, 0, 1));
    rect(frame, 36, 24, 248, 132, scenes[segment], .92);
    rect(frame, 36, 24, 248, 132, nextScene, handoff * .92);
    circle(frame, 88 + segment * 68, 86, 34, [255, 255, 255], .12 + handoff * .16);
    rect(frame, 58, 126, 204, 5, [255, 255, 255], .2);
    rect(frame, 58, 126, 204 * local, 5, [255, 255, 255], .86);
    for (let index = 0; index < 3; index += 1) circle(frame, 140 + index * 18, 144, 4, index === segment ? [255, 255, 255] : [120, 125, 135], .9);
  }
  else { circle(frame, 160, 90, 26, accent, .85); line(frame, 152, 76, 178, 90, [255,255,255], 3); line(frame, 178, 90, 152, 104, [255,255,255], 3); rect(frame, 68, 138, 184, 5, secondary, .25); rect(frame, 68, 138, 184 * time, 5, secondary, .9); }
}

const modeRules = {
  animation: [[/stagger/, 1], [/morph|shape/, 2], [/burst/, 3], [/spring|bounce/, 4], [/timeline|sequence|keyframe/, 5]],
  scroll: [[/hysteretic|threshold header/, 7], [/document generation|generation playback/, 6], [/horizontal/, 0], [/scrollbar|container/, 1], [/parallax|3d/, 2], [/reveal|viewport/, 3], [/infinite|million|virtual|append/, 4], [/snap|section|split/, 5]],
  transition: [[/dropdown promo sweep|promo sweep/, 7], [/self-inverting|blend-mode/, 6], [/page|route/, 0], [/grid|masonry|pack|reflow/, 1], [/shared|flip|morph/, 2], [/drawer/, 3], [/split|resize/, 4], [/filter|enter|exit/, 5]],
  carousel: [[/carousel|slide|deck/, 0], [/modal|lightbox|alert/, 1], [/command|menu/, 2], [/toast|notification/, 3], [/popover|tour|spotlight/, 4], [/drag|drop|pinch/, 5]],
  pointer: [[/interaction-history|hiring badge/, 9], [/opposed diagonal|offset cta/, 8], [/metadata-to-cta|role swap/, 7], [/crop marks|four-corner/, 6], [/cursor|trail|particle/, 0], [/tilt|depth|parallax|glare/, 1], [/magnetic|attracted|button/, 2], [/hover|overlay|card/, 3], [/hotspot|region|point/, 4], [/distortion|gooey|displacement/, 5]],
  vector: [[/traveling-dot|eraser-writer/, 8], [/type-select|select-replace/, 7], [/text-path|curved text/, 6], [/draw|stroke|path/, 0], [/type|split|character css/, 1], [/flip|ticker|mechanical/, 2], [/morph|shape/, 3], [/hand|rough|letter/, 4], [/scramble|decode|random/, 5]],
  canvas: [[/fish flock|dom-aware/, 7], [/multi-chart|telemetry boot/, 6], [/generative|particle|sprite/, 0], [/physics|game|rigid/, 1], [/draw|sketch/, 2], [/object|node|drag|layer/, 3], [/geometry|primitive|illustration/, 4], [/infinite|grid|surface/, 5]],
  webgl: [[/mesh|object|react|vue|svelte/, 0], [/particle|sphere/, 1], [/shader|plane|functional|minimal/, 2], [/bloom|post/, 3], [/product|model|orbit|camera/, 4], [/scene|webgl|3d/, 5]],
  background: [[/video ambience|blurred autoplay/, 7], [/starfield/, 6], [/fluid|gradient|vanta/, 0], [/particle|swarm|link/, 1], [/confetti/, 2], [/gradient|backdrop/, 3], [/mesh|poly|grid|surface/, 4], [/firework|ribbon|trail/, 5]],
  media: [[/duration-aware|film handoff|layered hero film/, 8], [/device-silhouette|silhouette masked/, 7], [/comparison|reveal/, 0], [/zoom|magnif|lens/, 1], [/depth|dissolve/, 6], [/pan|deep/, 2], [/crop/, 3], [/filter|editor/, 4], [/media|control|upload|preview/, 5]]
};

function modeFor(effect, seed) {
  const name = effect.name.toLowerCase();
  return modeRules[effect.category]?.find(([pattern]) => pattern.test(name))?.[1] ?? seed % 6;
}

function drawFingerprint(frame, seed, accent, secondary) {
  const colors = [[190, 192, 198], accent, secondary, [35, 36, 40]];
  for (let index = 0; index < 16; index += 1) {
    const state = (seed >>> ((index % 16) * 2)) & 3;
    rect(frame, 12 + index * 7, 168, 4, 4, colors[state], .78);
  }
}

function renderFrame(effect, frameIndex) {
  const [background, accent, secondary] = palettes[effect.category] || palettes.animation;
  const seed = hash(effect.id);
  const mode = modeFor(effect, seed);
  const time = frameIndex / (frameCount - 1);
  const frame = baseFrame(background, accent);
  if (effect.category === 'animation') cards(frame, time, accent, secondary, mode);
  else if (effect.category === 'scroll') scrollScene(frame, time, accent, secondary, mode);
  else if (effect.category === 'transition') transitionScene(frame, time, accent, secondary, mode);
  else if (effect.category === 'carousel') overlayScene(frame, time, accent, secondary, mode);
  else if (effect.category === 'pointer') pointerScene(frame, time, accent, secondary, mode);
  else if (effect.category === 'vector') vectorScene(frame, time, accent, secondary, mode);
  else if (effect.category === 'canvas') canvasScene(frame, time, accent, secondary, mode, seed);
  else if (effect.category === 'webgl') webglScene(frame, time, accent, secondary, mode);
  else if (effect.category === 'background') backgroundScene(frame, time, accent, secondary, mode, seed);
  else mediaScene(frame, time, accent, secondary, mode);
  drawFingerprint(frame, seed, accent, secondary);
  return frame;
}

async function encode(effect, outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  const ffmpeg = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', `${width}x${height}`, '-framerate', String(fps), '-i', '-',
    '-filter_complex', 'split[s0][s1];[s0]palettegen=max_colors=64:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
    '-loop', '0', '-y', outputPath
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let stderr = '';
  ffmpeg.stderr.on('data', chunk => { stderr += chunk; });
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    if (!ffmpeg.stdin.write(renderFrame(effect, frameIndex))) await once(ffmpeg.stdin, 'drain');
  }
  ffmpeg.stdin.end();
  const [exitCode] = await once(ffmpeg, 'close');
  if (exitCode !== 0) throw new Error(`${effect.id}: ffmpeg failed (${exitCode}) ${stderr}`);
}

const generated = [];
const skipped = [];
for (const effect of effects) {
  for (const source of effect.sources.filter(item => item.previewRecipe)) {
    const outputPath = resolve(outputRoot, `${source.preview}.gif`);
    try {
      if (!force && (await stat(outputPath)).size > 0) { skipped.push(outputPath); continue; }
    } catch {}
    await encode(effect, outputPath);
    generated.push(outputPath);
    if (generated.length % 20 === 0) console.log(`Generated ${generated.length} previews…`);
  }
}

const totalBytes = (await Promise.all(generated.map(async path => (await stat(path)).size))).reduce((sum, size) => sum + size, 0);
console.log(`Generated ${generated.length} concept GIFs (${(totalBytes / 1024 / 1024).toFixed(2)} MiB); skipped ${skipped.length} existing files.`);
