#!/usr/bin/env node

import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const planPath = resolve(root, 'research/effect-expansion-100-plan-2026-07-20.json');
const generatedModulePath = resolve(root, 'demo/data/effect-expansion-2026-07-20.js');
const manifestPath = resolve(root, 'demo/preview-demos/preview-manifest.json');
const provenancePath = resolve(root, 'demo/videos/provenance.json');
const expectedBatches = { A: 20, B: 27, C: 27 };

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

const fail = message => {
  throw new Error(message);
};

const plan = JSON.parse(await readFile(planPath, 'utf8'));
const plannedSpecs = plan.effects;
if (!Array.isArray(plannedSpecs) || plannedSpecs.length !== 74) fail(`Expansion plan must contain exactly 74 effects; received ${plannedSpecs?.length ?? 'none'}.`);

const runtimeRecords = (await Promise.all(Object.keys(expectedBatches).map(async batch => {
  const path = resolve(root, `research/batch-${batch.toLowerCase()}-runtime-2026-07-20.json`);
  const document = JSON.parse(await readFile(path, 'utf8'));
  return Array.isArray(document) ? document : document.effects;
}))).flat();
if (runtimeRecords.length !== 74) fail(`Runtime manifests must contain exactly 74 effects; received ${runtimeRecords.length}.`);
const runtimeById = new Map(runtimeRecords.map(runtime => [runtime.id, runtime]));
if (runtimeById.size !== runtimeRecords.length) fail('Runtime manifests contain duplicate effect IDs.');

const specs = plannedSpecs.map(spec => {
  const runtime = runtimeById.get(spec.id);
  if (!runtime) fail(`${spec.id}: missing actual runtime metadata.`);
  const project = projectMetadata[runtime.projectId];
  if (!project) fail(`${spec.id}: missing project metadata for ${runtime.projectId}.`);
  return {
    ...spec,
    observedImplementation: spec.implementation,
    implementation: {
      projectId: runtime.projectId,
      projectUrl: project.url,
      library: runtime.library,
      renderer: runtime.renderer,
      snippet: runtime.snippet,
      referenceUrl: spec.sourceUrl
    }
  };
});

const ids = specs.map(spec => spec.id);
if (new Set(ids).size !== ids.length) fail('Expansion plan contains duplicate effect IDs.');
for (const [batch, expected] of Object.entries(expectedBatches)) {
  const actual = specs.filter(spec => spec.batch === batch).length;
  if (actual !== expected) fail(`Batch ${batch} must contain ${expected} effects; received ${actual}.`);
}

for (const spec of specs) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.id)) fail(`${spec.id}: invalid stable ID.`);
  if (!['animation', 'scroll', 'transition', 'pointer', 'vector', 'canvas', 'webgl'].includes(spec.category)) fail(`${spec.id}: invalid category.`);
  if (!spec.name || !spec.nameZh || !spec.sourceUrl || !spec.difference) fail(`${spec.id}: incomplete research metadata.`);
  if (!spec.implementation?.projectId || !spec.implementation?.library || !spec.implementation?.renderer) fail(`${spec.id}: incomplete implementation metadata.`);
  if (!projectMetadata[spec.implementation.projectId]) fail(`${spec.id}: missing license mapping for ${spec.implementation.projectId}.`);
  if (!['dom', 'svg', 'canvas2d', 'webgl'].includes(spec.implementation.renderer)) fail(`${spec.id}: invalid renderer.`);
  for (const path of [
    resolve(root, `demo/preview-demos/${spec.id}.html`),
    resolve(root, `demo/preview-demos/src/${spec.id}-demo.js`)
  ]) await access(path);
}

const generatedHeader = `// Generated from research/effect-expansion-100-plan-2026-07-20.json.\n// Run node scripts/sync-effect-expansion-100.mjs after changing the research plan.\n`;
await writeFile(generatedModulePath, `${generatedHeader}export const effectExpansion100Specs = ${JSON.stringify(specs, null, 2)};\n`);

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
  const projectId = spec.implementation.projectId;
  provenance.records.push({
    effectId: spec.id,
    projectId,
    sourceType: 'demo',
    originUrl: spec.implementation.projectUrl,
    demoSourcePath: `demo/preview-demos/${spec.id}.html`,
    libraryVersion: spec.implementation.library,
    generatedAt: '2026-07-20',
    outputPath: `demo/videos/captured/${spec.id}.mp4`,
    posterPath: `demo/videos/posters/${spec.id}.webp`,
    usageBasis: `original local mechanism demo using ${spec.implementation.library}; verify license ${projectMetadata[projectId].license}`
  });
}
await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

console.log(`Synchronized ${specs.length} expansion specs, capture entries, and provenance records.`);
