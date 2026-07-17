#!/usr/bin/env node

import { rename, stat, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { effects } from '../demo/data/effects.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sources = effects
  .flatMap(effect => effect.sources)
  .filter(source => source.previewKind === 'official-capture' && source.preview);
let beforeBytes = 0;
let afterBytes = 0;
let changed = 0;

async function normalize(source) {
  const path = resolve(root, 'demo', 'gifs', `${source.preview}.gif`);
  const candidate = `${path}.normalized.gif`;
  const before = (await stat(path)).size;
  beforeBytes += before;
  const ffmpeg = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', path, '-t', '3',
    '-filter_complex', '[0:v]fps=12,scale=320:180:force_original_aspect_ratio=decrease:flags=lanczos,pad=320:180:(ow-iw)/2:(oh-ih)/2:color=white,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
    '-loop', '0', '-y', candidate
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  ffmpeg.stderr.on('data', chunk => { stderr += chunk; });
  const [exitCode] = await once(ffmpeg, 'close');
  if (exitCode !== 0) throw new Error(`${source.preview}: ffmpeg failed (${exitCode}) ${stderr}`);
  const candidateSize = (await stat(candidate)).size;
  if (candidateSize < before) {
    await rename(candidate, path);
    afterBytes += candidateSize;
    changed += 1;
  } else {
    await unlink(candidate);
    afterBytes += before;
  }
}

for (const source of sources) await normalize(source);

console.log(`Normalized ${changed}/${sources.length} source previews: ${(beforeBytes / 1024 / 1024).toFixed(2)} MiB → ${(afterBytes / 1024 / 1024).toFixed(2)} MiB.`);
