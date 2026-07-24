#!/usr/bin/env node

import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { effectExpansion150BatchA1 } from '../demo/data/effect-expansion-a1-2026-07-20.js';
import { effectExpansion150BatchA2 } from '../demo/data/effect-expansion-a2-2026-07-20.js';
import { effectExpansion150BatchA3 } from '../demo/data/effect-expansion-a3-2026-07-20.js';
import { effectExpansion150BatchB } from '../demo/data/effect-expansion-b-2026-07-20.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const previewRoot = resolve(root, 'demo/preview-demos');
const manifestPath = resolve(previewRoot, 'preview-manifest.json');
const provenancePath = resolve(root, 'demo/videos/provenance.json');
const researchJsonPath = resolve(root, 'research/effect-expansion-150-plan-2026-07-20.json');
const researchMarkdownPath = resolve(root, 'research/effect-expansion-150-plan-2026-07-20.md');
const categoryIds = new Set(['animation', 'scroll', 'transition', 'pointer', 'vector', 'canvas', 'webgl']);
const rendererIds = new Set(['dom', 'svg', 'canvas2d', 'webgl']);

const projectMetadata = {
  'greensock-gsap': {
    url: 'https://github.com/greensock/GSAP',
    license: 'https://github.com/greensock/GSAP/blob/HEAD/LICENSE.md'
  },
  'juliangarnier-anime': {
    url: 'https://github.com/juliangarnier/anime',
    license: 'https://github.com/juliangarnier/anime/blob/HEAD/LICENSE.md'
  },
  'motiondivision-motion': {
    url: 'https://github.com/motiondivision/motion',
    license: 'https://github.com/motiondivision/motion/blob/HEAD/LICENSE.md'
  },
  'processing-p5-js': {
    url: 'https://github.com/processing/p5.js',
    license: 'https://github.com/processing/p5.js/blob/HEAD/license.txt'
  },
  'regl-project-regl': {
    url: 'https://github.com/regl-project/regl',
    license: 'https://github.com/regl-project/regl/blob/HEAD/LICENSE'
  }
};

const fail = message => { throw new Error(message); };
const totalScores = scores => ['creativity', 'artDirection', 'motion', 'clarity', 'inspiration', 'evidence']
  .reduce((total, key) => total + Number(scores?.[key] || 0), 0);

const effectExpansion150BatchA = [...effectExpansion150BatchA1, ...effectExpansion150BatchA2, ...effectExpansion150BatchA3]
  .sort((left, right) => left.order - right.order);
if (effectExpansion150BatchA1.length !== 10) fail(`Batch A1 must contain 10 effects; received ${effectExpansion150BatchA1.length}.`);
if (effectExpansion150BatchA2.length !== 8) fail(`Batch A2 must contain 8 effects; received ${effectExpansion150BatchA2.length}.`);
if (effectExpansion150BatchA3.length !== 7) fail(`Batch A3 must contain 7 effects; received ${effectExpansion150BatchA3.length}.`);
if (effectExpansion150BatchA.length !== 25) fail(`Combined Batch A must contain 25 effects; received ${effectExpansion150BatchA.length}.`);
if (effectExpansion150BatchB.length !== 25) fail(`Batch B must contain 25 effects; received ${effectExpansion150BatchB.length}.`);

const specs = [...effectExpansion150BatchA, ...effectExpansion150BatchB];
const ids = specs.map(spec => spec.id);
if (new Set(ids).size !== 50) fail('Expansion 150 contains duplicate effect IDs.');

for (const [index, spec] of specs.entries()) {
  const expectedOrder = 101 + index;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.id)) fail(`${spec.id}: invalid stable ID.`);
  if (spec.order !== expectedOrder) fail(`${spec.id}: expected order ${expectedOrder}; received ${spec.order}.`);
  if (!categoryIds.has(spec.category)) fail(`${spec.id}: invalid category ${spec.category}.`);
  if (!spec.name || !spec.nameZh || !spec.sourceUrl || String(spec.difference || '').length < 20) fail(`${spec.id}: incomplete research metadata.`);
  if (!Object.values(spec.behavior || {}).every(value => String(value).length >= 3)) fail(`${spec.id}: incomplete behavior contract.`);
  const implementation = spec.implementation;
  if (!projectMetadata[implementation?.projectId]) fail(`${spec.id}: unsupported implementation project ${implementation?.projectId}.`);
  if (implementation.projectUrl !== projectMetadata[implementation.projectId].url) fail(`${spec.id}: project URL mismatch.`);
  if (!rendererIds.has(implementation.renderer)) fail(`${spec.id}: invalid renderer ${implementation.renderer}.`);
  if (!implementation.library || String(implementation.snippet || '').trim().length < 12) fail(`${spec.id}: incomplete implementation metadata.`);
  if (totalScores(spec.scores) !== spec.scores.total || spec.scores.total < 80) fail(`${spec.id}: invalid or failing admission score.`);
  if (spec.scores.artDirection < 14 || spec.scores.motion < 14 || spec.scores.clarity < 11 || spec.scores.evidence < 8) fail(`${spec.id}: failed a core admission minimum.`);
  await access(resolve(previewRoot, `${spec.id}.html`));
  await access(resolve(previewRoot, `src/${spec.id}-demo.js`));
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const expansionIds = new Set(ids);
manifest.demos = manifest.demos.filter(demo => !expansionIds.has(demo.id));
for (const spec of specs) {
  manifest.demos.push({
    id: spec.id,
    library: spec.implementation.library,
    renderer: spec.implementation.renderer,
    runtimeAssertion: true,
    demoPath: `preview-demos/dist/${spec.id}.html`,
    demoSourcePath: `preview-demos/${spec.id}.html`,
    videoPath: `videos/captured/${spec.id}.mp4`,
    posterPath: `videos/posters/${spec.id}.webp`
  });
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
provenance.records = provenance.records.filter(record => !expansionIds.has(record.effectId));
for (const spec of specs) {
  const project = projectMetadata[spec.implementation.projectId];
  provenance.records.push({
    effectId: spec.id,
    projectId: spec.implementation.projectId,
    sourceType: 'demo',
    originUrl: project.url,
    demoSourcePath: `demo/preview-demos/${spec.id}.html`,
    libraryVersion: spec.implementation.library,
    generatedAt: '2026-07-20',
    outputPath: `demo/videos/captured/${spec.id}.mp4`,
    posterPath: `demo/videos/posters/${spec.id}.webp`,
    usageBasis: `original local mechanism demo using ${spec.implementation.library}; verify license ${project.license}`
  });
}
await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

await writeFile(researchJsonPath, `${JSON.stringify({
  title: 'Awesome Web Effects expansion from 100 to 150',
  auditedAt: '2026-07-20',
  policyThreshold: 80,
  batches: { A: 25, B: 25 },
  effects: specs.map((spec, index) => ({ ...spec, batch: index < 25 ? 'A' : 'B' }))
}, null, 2)}\n`);

const rows = specs.map(spec => `| ${spec.order} | \`${spec.id}\` | ${spec.name} / ${spec.nameZh} | ${spec.category} | ${spec.implementation.library} | ${spec.scores.total}/100 | [research](${spec.sourceUrl}) |`).join('\n');
await writeFile(researchMarkdownPath, `# 100 → 150 effect expansion audit\n\nAll 50 additions below require a runnable deterministic demo, a browser-captured 320×180 GIF, pinned runtime metadata, provenance, a minimal snippet, a bilingual name, and a six-dimension admission score of at least 80. Research URLs are evidence for the interaction idea; the local implementation and capture remain original repository artifacts.\n\n| # | Stable ID | Effect | Category | Runtime | Score | Research source |\n| ---: | --- | --- | --- | --- | ---: | --- |\n${rows}\n`);

console.log(`Synchronized ${specs.length} new demos, capture entries, provenance records, and research audit files.`);
