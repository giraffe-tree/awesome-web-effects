#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { categories, effects, projects } from '../demo/data/effects.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const duplicates = values => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

assert(effects.length >= 120, `Expected at least 120 effects; received ${effects.length}.`);
assert(projects.length >= 120, `Expected at least 120 source projects; received ${projects.length}.`);
assert(projects.filter(project => project.addedIn === '2026-expansion').length >= 100, 'Expected at least 100 source projects from the 2026 expansion.');
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
  assert(['baseline', '2026-expansion'].includes(project.addedIn), `${project.repo}: invalid provenance.`);
  assert(typeof project.legacy === 'boolean', `${project.repo}: invalid legacy flag.`);
}

for (const effect of effects) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(effect.id), `${effect.id}: effect id must be stable kebab-case.`);
  assert(categoryIds.includes(effect.category), `${effect.id}: unknown category ${effect.category}.`);
  assert(effect.name.length >= 4 && effect.nameZh.length >= 2, `${effect.id}: missing bilingual effect name.`);
  assert(Number.isInteger(effect.order) && effect.order > 0, `${effect.id}: invalid curated order.`);
  assert(Array.isArray(effect.sources) && effect.sources.length > 0, `${effect.id}: effect requires at least one source.`);
  assert(effect.sources.filter(source => source.recommended).length === 1, `${effect.id}: effect requires exactly one recommended source.`);

  const sourceProjectIds = effect.sources.map(source => source.projectId);
  for (const duplicate of duplicates(sourceProjectIds)) errors.push(`${effect.id}: duplicate source ${duplicate}.`);

  for (const source of effect.sources) {
    const project = projectById.get(source.projectId);
    assert(project, `${effect.id}: unknown source project ${source.projectId}.`);
    assert(source.snippet?.trim().length >= 12 && !/TODO|placeholder/i.test(source.snippet), `${effect.id}/${source.projectId}: incomplete minimal snippet.`);
    if (source.preview) {
      try {
        await access(resolve(root, 'demo', 'gifs', `${source.preview}.gif`));
      } catch {
        errors.push(`${effect.id}/${source.projectId}: missing GIF demo/gifs/${source.preview}.gif.`);
      }
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
assert(readme.includes('| Effect | Recommended source |'), 'English README is not effect-first.');
assert(readmeZh.includes('| 效果 | 推荐来源 |'), 'Chinese README is not effect-first.');

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  const previewCount = effects.flatMap(effect => effect.sources).filter(source => source.preview).length;
  const repeatedProjectCount = projects.filter(project => effects.filter(effect => effect.sources.some(source => source.projectId === project.id)).length > 1).length;
  console.log(`Validated ${effects.length} unique effects, ${projects.length} source projects, ${categories.length} categories, ${previewCount} GIF previews, and ${repeatedProjectCount} multi-effect projects.`);
}
