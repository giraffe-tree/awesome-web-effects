#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { categories, effects, projects, snapshotDate } from '../demo/data/effects.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const duplicates = values => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const execFileAsync = promisify(execFile);

assert(effects.length >= 221, `Expected at least 221 effects; received ${effects.length}.`);
assert(projects.length >= 120, `Expected at least 120 source projects; received ${projects.length}.`);
assert(projects.filter(project => project.addedIn === '2026-expansion').length >= 100, 'Expected at least 100 source projects from the 2026 expansion.');
assert(effects.filter(effect => effect.addedIn === '2026-effect-expansion').length >= 100, 'Expected at least 100 effects from the 2026 effect expansion.');
assert(categories.length >= 8, 'Expected a useful effect taxonomy.');

const categoryIds = categories.map(category => category.id);
for (const duplicate of duplicates(categoryIds)) errors.push(`Duplicate category id: ${duplicate}`);
for (const duplicate of duplicates(effects.map(effect => effect.id))) errors.push(`Duplicate effect id: ${duplicate}`);
for (const duplicate of duplicates(effects.map(effect => effect.name.toLowerCase()))) errors.push(`Duplicate effect name: ${duplicate}`);
for (const duplicate of duplicates(projects.map(project => project.id))) errors.push(`Duplicate project id: ${duplicate}`);
for (const duplicate of duplicates(projects.map(project => project.repo.toLowerCase()))) errors.push(`Duplicate source repository: ${duplicate}`);

const projectById = new Map(projects.map(project => [project.id, project]));

for (const project of projects) {
  assert(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(project.url), `${project.repo}: invalid GitHub URL.`);
  assert(project.url.toLowerCase().endsWith(project.repo.toLowerCase()), `${project.repo}: URL/repo mismatch.`);
  assert(Number.isInteger(project.stars) && project.stars >= 0, `${project.repo}: invalid stars snapshot.`);
  assert(['baseline', '2026-expansion', '2026-effect-expansion'].includes(project.addedIn), `${project.repo}: invalid provenance.`);
  assert(typeof project.legacy === 'boolean', `${project.repo}: invalid legacy flag.`);
}

for (const effect of effects) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(effect.id), `${effect.id}: effect id must be stable kebab-case.`);
  assert(categoryIds.includes(effect.category), `${effect.id}: unknown category ${effect.category}.`);
  assert(effect.name.length >= 4 && effect.nameZh.length >= 2, `${effect.id}: missing bilingual effect name.`);
  assert(Number.isInteger(effect.order) && effect.order > 0, `${effect.id}: invalid curated order.`);
  assert(effect.behavior && ['trigger', 'response', 'timing', 'layer'].every(key => effect.behavior[key]?.length >= 3), `${effect.id}: incomplete interaction behavior.`);
  assert(effect.prompt?.includes(effect.name) && effect.prompt.length >= 400, `${effect.id}: missing implementation prompt.`);
  if (effect.addedIn === '2026-effect-expansion') {
    assert(/^https:\/\//.test(effect.research?.sourceUrl), `${effect.id}: missing official research source URL.`);
    assert(effect.research?.difference?.length >= 40, `${effect.id}: missing effect-level deduplication rationale.`);
    assert(/^2026-\d{2}-\d{2}$/.test(effect.research?.verifiedAt), `${effect.id}: invalid research verification date.`);
    assert(effect.research.verifiedAt <= snapshotDate, `${effect.id}: research verification is newer than the catalog snapshot.`);
  }
  assert(Array.isArray(effect.sources) && effect.sources.length > 0, `${effect.id}: effect requires at least one source.`);
  assert(effect.sources.filter(source => source.recommended).length === 1, `${effect.id}: effect requires exactly one recommended source.`);

  const sourceProjectIds = effect.sources.map(source => source.projectId);
  for (const duplicate of duplicates(sourceProjectIds)) errors.push(`${effect.id}: duplicate source ${duplicate}.`);

  for (const source of effect.sources) {
    const project = projectById.get(source.projectId);
    assert(project, `${effect.id}: unknown source project ${source.projectId}.`);
    assert(source.snippet?.trim().length >= 12 && !/TODO|placeholder/i.test(source.snippet), `${effect.id}/${source.projectId}: incomplete minimal snippet.`);
    assert(source.preview, `${effect.id}/${source.projectId}: missing GIF preview reference.`);
    assert(['official-capture', 'library-local-capture', 'editorial-recreation', 'legacy-unverified'].includes(source.previewKind), `${effect.id}/${source.projectId}: invalid preview kind.`);
    if (source.previewKind === 'official-capture') assert(/^https?:\/\//.test(source.originUrl), `${effect.id}/${source.projectId}: official preview requires an origin URL.`);
    if (source.previewKind === 'editorial-recreation') assert(source.originUrl || source.previewRecipe, `${effect.id}/${source.projectId}: editorial preview requires an origin or recipe.`);
    try {
      await access(resolve(root, 'demo', 'gifs', `${source.preview}.gif`));
    } catch {
      errors.push(`${effect.id}/${source.projectId}: missing GIF demo/gifs/${source.preview}.gif.`);
    }
  }
}

for (const category of categories) {
  const count = effects.filter(effect => effect.category === category.id).length;
  assert(count > 0, `Empty effect category: ${category.id}.`);
}

const [html, readme, readmeZh] = await Promise.all([
  readFile(resolve(root, 'demo', 'index.html'), 'utf8'),
  readFile(resolve(root, 'README.md'), 'utf8'),
  readFile(resolve(root, 'README.zh-CN.md'), 'utf8')
]);
assert(html.includes("./data/effects.js"), 'Demo does not load the canonical effect catalog.');
assert(html.includes('type="module"'), 'Demo catalog must load as an ES module.');
assert(html.includes('prompt-button') && html.includes('copyPrompt'), 'Demo does not expose one-click agent prompts.');
assert(html.includes('copy-code') && html.includes('source.snippet'), 'Demo does not expose copyable minimal code.');
assert(readme.includes('| Effect | Recommended source |'), 'English README is not effect-first.');
assert(readmeZh.includes('| 效果 | 推荐来源 |'), 'Chinese README is not effect-first.');

const previewRecords = [];
for (const effect of effects) {
  for (const source of effect.sources) {
    const path = resolve(root, 'demo', 'gifs', `${source.preview}.gif`);
    try {
      const bytes = await readFile(path);
      previewRecords.push({ effectId: effect.id, path, hash: createHash('sha256').update(bytes).digest('hex'), size: bytes.length });
      assert(bytes.length <= 1024 * 1024, `${effect.id}: GIF exceeds the 1 MiB budget (${bytes.length} bytes).`);
    } catch {}
  }
}

for (const duplicateHash of duplicates(previewRecords.map(record => record.hash))) {
  const ids = previewRecords.filter(record => record.hash === duplicateHash).map(record => record.effectId);
  errors.push(`Duplicate GIF content across effects: ${ids.join(', ')}.`);
}

for (let index = 0; index < previewRecords.length; index += 8) {
  await Promise.all(previewRecords.slice(index, index + 8).map(async record => {
    try {
      const { stdout } = await execFileAsync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,duration', '-of', 'json', record.path]);
      const stream = JSON.parse(stdout).streams?.[0];
      assert(stream?.width === 320 && stream?.height === 180, `${record.effectId}: GIF must be 320×180.`);
      assert(Number(stream?.nb_frames) >= 12, `${record.effectId}: GIF has too few frames.`);
      assert(Number(stream?.duration) > 0 && Number(stream?.duration) <= 3.1, `${record.effectId}: GIF duration must be at most 3 seconds.`);
    } catch (error) {
      errors.push(`${record.effectId}: ffprobe could not decode GIF (${error.message}).`);
    }
  }));
}

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  const sources = effects.flatMap(effect => effect.sources);
  const previewCount = sources.filter(source => source.preview).length;
  const promptCount = effects.filter(effect => effect.prompt).length;
  const repeatedProjectCount = projects.filter(project => effects.filter(effect => effect.sources.some(source => source.projectId === project.id)).length > 1).length;
  console.log(`Validated ${effects.length} unique effects, ${projects.length} source projects, ${categories.length} categories, ${previewCount} GIF previews, ${promptCount} prompts, and ${repeatedProjectCount} multi-effect projects.`);
}
