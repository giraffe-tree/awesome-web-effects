#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { categories, projects } from '../demo/data/projects.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const duplicates = values => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

assert(projects.length >= 120, `Expected at least 120 total projects; received ${projects.length}.`);
assert(projects.filter(project => project.isNew).length >= 100, 'Expected at least 100 projects marked as new.');
assert(categories.length >= 8, 'Expected a useful category taxonomy.');

const categoryIds = categories.map(category => category.id);
for (const duplicate of duplicates(categoryIds)) errors.push(`Duplicate category id: ${duplicate}`);
for (const duplicate of duplicates(projects.map(project => project.repo.toLowerCase()))) errors.push(`Duplicate repository: ${duplicate}`);
for (const duplicate of duplicates(projects.map(project => project.slug))) errors.push(`Duplicate slug: ${duplicate}`);
for (const duplicate of duplicates(projects.map(project => `${project.category}:${project.effect.toLowerCase()}`))) errors.push(`Duplicate visible-effect label: ${duplicate}`);

for (const project of projects) {
  assert(categoryIds.includes(project.category), `${project.repo}: unknown category ${project.category}.`);
  assert(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(project.url), `${project.repo}: invalid GitHub URL.`);
  assert(project.url.toLowerCase().endsWith(project.repo.toLowerCase()), `${project.repo}: URL/repo mismatch.`);
  assert(Number.isInteger(project.stars) && project.stars >= 0, `${project.repo}: invalid stars snapshot.`);
  assert(project.effect.length >= 4 && project.effectZh.length >= 2, `${project.repo}: missing bilingual effect name.`);
  assert(project.snippet.trim().length >= 12 && !/TODO|placeholder/i.test(project.snippet), `${project.repo}: incomplete minimal snippet.`);
  assert(typeof project.legacy === 'boolean', `${project.repo}: invalid legacy flag.`);
  if (project.preview) {
    try {
      await access(resolve(root, 'demo', 'gifs', `${project.preview}.gif`));
    } catch {
      errors.push(`${project.repo}: missing GIF demo/gifs/${project.preview}.gif.`);
    }
  }
}

for (const category of categories) {
  const count = projects.filter(project => project.category === category.id).length;
  assert(count > 0, `Empty category: ${category.id}.`);
}

const html = await readFile(resolve(root, 'demo', 'index.html'), 'utf8');
assert(html.includes("./data/projects.js"), 'Demo does not load the canonical project catalog.');
assert(html.includes('type="module"'), 'Demo catalog must load as an ES module.');

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  const newCount = projects.filter(project => project.isNew).length;
  const previewCount = projects.filter(project => project.preview).length;
  console.log(`Validated ${projects.length} unique projects (${newCount} new), ${categories.length} categories, and ${previewCount} GIF previews.`);
}
