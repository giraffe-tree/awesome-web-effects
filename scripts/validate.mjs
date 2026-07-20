#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { categories, effects, projects, snapshotDate } from '../demo/data/effects.js';
import { admissionAuditSummary, admissionPolicy, reviewedDemoScores } from '../demo/data/demo-admission.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const duplicates = values => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const execFileAsync = promisify(execFile);
const realPreviewKinds = new Set(['official-capture', 'local-demo-capture']);

assert(effects.length > 0, 'The admitted demo catalog must not be empty.');
assert(effects.length === admissionAuditSummary.admittedCount, 'Published effect count does not match the dated admission audit.');
assert(admissionAuditSummary.candidateCount === admissionAuditSummary.admittedCount + admissionAuditSummary.rejectedCount, 'Admission audit totals are inconsistent.');
assert(projects.length > 0, 'The admitted demo catalog must retain source projects.');
assert(categories.length > 0, 'The admitted demo catalog must retain active categories.');

const scoreTotal = scores => admissionPolicy.dimensions.reduce((total, dimension) => total + scores[dimension.id], 0);
const scorePasses = scores => scoreTotal(scores) >= admissionPolicy.threshold
  && Object.entries(admissionPolicy.minimums).every(([dimension, minimum]) => scores[dimension] >= minimum);
const expectedAdmittedIds = Object.entries(reviewedDemoScores).filter(([, scores]) => scorePasses(scores)).map(([id]) => id).sort();
assert(JSON.stringify(effects.map(effect => effect.id).sort()) === JSON.stringify(expectedAdmittedIds), 'Published effects do not exactly match the reviewed demos that passed the admission policy.');

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
  assert(effect.admission?.decision === 'admit', `${effect.id}: published effect did not pass admission.`);
  assert(effect.admission?.policyVersion === admissionPolicy.version, `${effect.id}: stale admission policy version.`);
  assert(effect.admission?.total >= admissionPolicy.threshold, `${effect.id}: admission score is below ${admissionPolicy.threshold}.`);
  assert(admissionPolicy.dimensions.reduce((total, dimension) => total + effect.admission.scores[dimension.id], 0) === effect.admission.total, `${effect.id}: admission score total is inconsistent.`);
  for (const [dimension, minimum] of Object.entries(admissionPolicy.minimums)) {
    assert(effect.admission.scores[dimension] >= minimum, `${effect.id}: ${dimension} score is below the hard minimum.`);
  }
  assert(Array.isArray(effect.relatedParties), `${effect.id}: related parties must be an array.`);
  assert(effect.relatedParties.length <= 3, `${effect.id}: at most three related parties may be shown.`);
  for (const duplicate of duplicates(effect.relatedParties.map(party => party.name.toLowerCase()))) errors.push(`${effect.id}: duplicate related party ${duplicate}.`);
  for (const party of effect.relatedParties) {
    assert(party.name?.length >= 2, `${effect.id}: related party is missing a name.`);
    assert(/^https:\/\//.test(party.url), `${effect.id}/${party.name}: related party requires an HTTPS homepage.`);
    assert(party.observedAs?.length >= 6, `${effect.id}/${party.name}: related party requires an observed behavior label.`);
  }
  if (['2026-effect-expansion', '2026-ai-native-expansion'].includes(effect.addedIn)) {
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
    assert(['official-capture', 'local-demo-capture', 'unavailable'].includes(source.previewKind), `${effect.id}/${source.projectId}: invalid preview kind.`);
    assert(source.referenceUrl === null || /^https?:\/\//.test(source.referenceUrl), `${effect.id}/${source.projectId}: invalid implementation reference URL.`);
    if (source.previewKind === 'official-capture') {
      assert(Boolean(source.preview), `${effect.id}/${source.projectId}: official preview requires a GIF reference.`);
      assert(/^https?:\/\//.test(source.originUrl), `${effect.id}/${source.projectId}: official preview requires an origin URL.`);
      assert(source.demoPath === null, `${effect.id}/${source.projectId}: official preview must not claim a local demo.`);
      assert(source.demoSourcePath === null, `${effect.id}/${source.projectId}: official preview must not claim local demo source code.`);
      assert(source.previewRecipe === null, `${effect.id}/${source.projectId}: official preview must not use an editorial recipe.`);
    }
    if (source.previewKind === 'local-demo-capture') {
      assert(Boolean(source.preview), `${effect.id}/${source.projectId}: local demo requires a GIF reference.`);
      assert(source.preview === `captured/${effect.id}`, `${effect.id}/${source.projectId}: local demo preview must be captured/${effect.id}.`);
      assert(/^preview-demos\/dist\/[a-z0-9-]+\.html$/.test(source.demoPath || ''), `${effect.id}/${source.projectId}: local demo requires a safe preview-demos/dist/*.html publish path.`);
      assert(source.demoPath === `preview-demos/dist/${effect.id}.html`, `${effect.id}/${source.projectId}: published local demo filename must match the effect id.`);
      assert(/^preview-demos\/[a-z0-9-]+\.html$/.test(source.demoSourcePath || ''), `${effect.id}/${source.projectId}: local demo requires a safe preview-demos/*.html source path.`);
      assert(source.demoSourcePath === `preview-demos/${effect.id}.html`, `${effect.id}/${source.projectId}: local demo source filename must match the effect id.`);
      assert(source.originUrl === project?.url, `${effect.id}/${source.projectId}: local demo origin must point to the recommended project URL.`);
      assert(source.previewRecipe === null, `${effect.id}/${source.projectId}: local demo preview must not use an editorial recipe.`);
      try {
        await access(resolve(root, 'demo', source.demoPath || ''));
      } catch {
        errors.push(`${effect.id}/${source.projectId}: missing published demo/${source.demoPath || '(unset)'}.`);
      }
      try {
        await access(resolve(root, 'demo', source.demoSourcePath || ''));
      } catch {
        errors.push(`${effect.id}/${source.projectId}: missing reusable demo source demo/${source.demoSourcePath || '(unset)'}.`);
      }
    }
    if (source.previewKind === 'unavailable') {
      assert(source.preview === null, `${effect.id}/${source.projectId}: unavailable preview must not reference a GIF.`);
      assert(source.demoPath === null, `${effect.id}/${source.projectId}: unavailable preview must not claim a local demo.`);
      assert(source.demoSourcePath === null, `${effect.id}/${source.projectId}: unavailable preview must not claim local demo source code.`);
      assert(source.previewRecipe === null, `${effect.id}/${source.projectId}: unavailable preview must not retain an editorial recipe.`);
      assert(source.originUrl === null, `${effect.id}/${source.projectId}: unavailable preview must not claim a preview origin.`);
    }
    if (realPreviewKinds.has(source.previewKind)) {
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

const [html, readme, readmeZh, admissionAudit] = await Promise.all([
  readFile(resolve(root, 'demo', 'index.html'), 'utf8'),
  readFile(resolve(root, 'README.md'), 'utf8'),
  readFile(resolve(root, 'README.zh-CN.md'), 'utf8'),
  readFile(resolve(root, 'research', `demo-admission-audit-${admissionAuditSummary.auditedAt}.md`), 'utf8')
]);
assert(html.includes("./data/effects.js"), 'Demo does not load the canonical effect catalog.');
assert(html.includes('type="module"'), 'Demo catalog must load as an ES module.');
assert(html.includes('prompt-button') && html.includes('copyPrompt'), 'Demo does not expose one-click agent prompts.');
assert(html.includes('copy-code') && html.includes('source.snippet'), 'Demo does not expose copyable minimal code.');

const modalRendererStart = html.indexOf('function openEffectModal');
const modalRendererEnd = modalRendererStart < 0 ? -1 : html.indexOf('async function copyText', modalRendererStart);
const modalRenderer = modalRendererStart >= 0 && modalRendererEnd > modalRendererStart
  ? html.slice(modalRendererStart, modalRendererEnd)
  : '';
assert(Boolean(modalRenderer), 'Demo is missing the effect-detail modal renderer.');
assert(/class="effect-modal-dialog"[^>]*role="dialog"[^>]*aria-modal="true"/.test(html), 'Effect details must use an accessible dialog container.');
assert(/row\.setAttribute\(\s*['"]aria-haspopup['"]\s*,\s*['"]dialog['"]\s*\)/.test(html), 'Effect cards must expose dialog-opening semantics.');
assert((html.match(/openEffectModal\(\s*effect\s*,\s*row\s*\)/g) || []).length >= 2, 'Effect cards must open details from both pointer and keyboard handlers.');
assert(modalRenderer.includes('source.snippet'), 'Effect-detail modal must render the selected source snippet.');
assert(/<pre[^>]*>\s*<code[^>]*>\$\{escapeHTML\(source\.snippet\)\}<\/code>\s*<\/pre>/.test(modalRenderer), 'Effect-detail modal must display source.snippet in a code block.');
assert(/(?:class="[^"]*modal-copy-code|data-modal-copy-code)/.test(modalRenderer), 'Effect-detail modal must expose a dedicated copy-code button.');
assert(/copyText\(\s*[^,]+\s*,\s*source\.snippet\s*,/.test(modalRenderer), 'Effect-detail copy-code button must copy source.snippet independently.');
assert(modalRenderer.includes('hasRealPreview(source)') && /realPreview\s*\?/.test(modalRenderer), 'Effect-detail modal must branch on verified preview availability.');
assert(/<img[^>]*source\.preview[^>]*\.gif/.test(modalRenderer), 'Effect-detail modal must render the selected real GIF when available.');
assert(modalRenderer.includes('modal-preview-unavailable'), 'Effect-detail modal must render an explicit unavailable-preview state.');
assert(html.includes('effect.admission.total') && html.includes('score-breakdown'), 'Demo must display each admitted effect score and its dimension breakdown.');

assert(readme.includes('| Effect | Recommended implementation | Curatorial score | AI homepage references (max 3) |'), 'English README is not effect-first or lacks scores and integrated homepage references.');
assert(readmeZh.includes('| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） |'), 'Chinese README is not effect-first or lacks scores and integrated homepage references.');
assert(readme.includes(`research/demo-admission-audit-${admissionAuditSummary.auditedAt}.md`), 'English README does not link to the demo admission policy and audit.');
assert(readmeZh.includes(`research/demo-admission-audit-${admissionAuditSummary.auditedAt}.md`), 'Chinese README does not link to the demo admission policy and audit.');
assert(admissionAudit.includes(`共审计 **${admissionAuditSummary.candidateCount}** 个候选`)
  && admissionAudit.includes(`最终 **${admissionAuditSummary.admittedCount} 个入选**`)
  && admissionAudit.includes(`**${admissionAuditSummary.rejectedCount} 个拒绝**`), 'Demo admission audit is missing the complete candidate accounting.');
const liveDemo = 'https://giraffe-tree.github.io/awesome-web-effects/';
assert(readme.includes(liveDemo), 'English README does not link to the current GitHub Pages site.');
assert(readmeZh.includes(liveDemo), 'Chinese README does not link to the current GitHub Pages site.');
assert(readme.includes('research/ai-native-homepages-100.md'), 'English README does not link to the homepage research summary.');
assert(readmeZh.includes('research/ai-native-homepages-100.md'), 'Chinese README does not link to the homepage research summary.');
assert(!`${html}\n${readme}\n${readmeZh}`.includes('giraffe-tree/awesome-interaction'), 'Stale awesome-interaction repository or Pages link detected.');

try {
  const { stdout } = await execFileAsync(
    process.execPath,
    [resolve(root, 'scripts', 'audit-preview-authenticity.mjs'), '--json'],
    { maxBuffer: 10 * 1024 * 1024 }
  );
  const authenticityAudit = JSON.parse(stdout);
  assert(authenticityAudit.summary?.blockingIssues === 0, 'Preview authenticity audit reported blocking issues.');
} catch (error) {
  errors.push(`Preview authenticity audit failed (${error.message}).`);
}

const previewRecords = [];
for (const effect of effects) {
  for (const source of effect.sources) {
    if (!realPreviewKinds.has(source.previewKind)) continue;
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
