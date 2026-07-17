#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { effects } from '../demo/data/effects.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demoRoot = resolve(root, 'demo');
const args = new Set(process.argv.slice(2));
const allowedArgs = new Set(['--help', '--json', '--report']);
const unknownArgs = [...args].filter(argument => !allowedArgs.has(argument));

if (unknownArgs.length) {
  console.error(`Unknown argument${unknownArgs.length === 1 ? '' : 's'}: ${unknownArgs.join(', ')}`);
  process.exit(2);
}

if (args.has('--help')) {
  console.log(`Usage: node scripts/audit-preview-authenticity.mjs [--report] [--json]

Audits preview metadata and local files without network access.

  --report  Print findings but do not fail when unauthentic previews are found.
  --json    Emit machine-readable JSON instead of the text report.
  --help    Show this help.`);
  process.exit(0);
}

const reportOnly = args.has('--report');
const json = args.has('--json');
const allowedPreviewKinds = new Set(['official-capture', 'local-demo-capture', 'unavailable']);
const execFileAsync = promisify(execFile);
const perceptualDuplicateThreshold = 0.02;
const signatureWidth = 24;
const signatureHeight = 14;
const signatureFrameCount = 8;

function isPublicUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function resolveInside(base, value) {
  if (typeof value !== 'string' || !value.trim() || isAbsolute(value)) return null;
  const path = resolve(base, value);
  const pathFromBase = relative(base, path);
  if (pathFromBase === '..' || pathFromBase.startsWith(`..${sep}`) || isAbsolute(pathFromBase)) return null;
  return path;
}

async function inspectGif(preview) {
  if (typeof preview !== 'string' || !preview.trim()) {
    return { path: null, problem: 'missing preview path' };
  }
  const relativePath = `gifs/${preview}.gif`;
  const path = resolveInside(demoRoot, relativePath);
  if (!path) return { path: null, problem: `preview escapes demo/: ${relativePath}` };
  try {
    const [metadata, bytes] = await Promise.all([stat(path), readFile(path)]);
    if (!metadata.isFile()) return { path, problem: `GIF is not a file: demo/${relativePath}` };
    if (bytes.length < 6 || !['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) {
      return { path, problem: `not a decodable GIF container: demo/${relativePath}` };
    }
    return { path, problem: null };
  } catch (error) {
    if (error?.code === 'ENOENT') return { path, problem: `missing GIF: demo/${relativePath}` };
    return { path, problem: `cannot read GIF demo/${relativePath}: ${error.message}` };
  }
}

async function inspectDemo(demoPath, fieldName = 'demoPath') {
  const path = resolveInside(demoRoot, demoPath);
  if (!path) return { path: null, problem: `${fieldName} must be a relative path inside demo/` };
  if (extname(path).toLowerCase() !== '.html') {
    return { path, problem: `${fieldName} must point to an HTML entry: demo/${demoPath}` };
  }
  try {
    const [metadata, html] = await Promise.all([stat(path), readFile(path, 'utf8')]);
    if (!metadata.isFile()) return { path, problem: `${fieldName} is not a file: demo/${demoPath}` };
    if (!/<(?:!doctype\s+html|html)(?:\s|>)/i.test(html)) {
      return { path, problem: `demoPath is not a complete HTML document: demo/${demoPath}` };
    }
    return { path, problem: null };
  } catch (error) {
    if (error?.code === 'ENOENT') return { path, problem: `missing runnable demo: demo/${demoPath}` };
    return { path, problem: `cannot read demo/${demoPath}: ${error.message}` };
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
}

async function loadJson(path, label, problems) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    problems.push(`cannot read ${label}: ${error.message}`);
    return null;
  }
}

const provenancePath = resolve(demoRoot, 'gifs', 'provenance.json');
const provenanceManifestProblems = [];
const provenanceManifest = await loadJson(provenancePath, 'demo/gifs/provenance.json', provenanceManifestProblems);
const provenanceRecords = Array.isArray(provenanceManifest?.records) ? provenanceManifest.records : [];
if (provenanceManifest && provenanceManifest.schemaVersion !== 1) {
  provenanceManifestProblems.push('demo/gifs/provenance.json must use schemaVersion 1');
}
if (provenanceManifest && !Array.isArray(provenanceManifest.records)) {
  provenanceManifestProblems.push('demo/gifs/provenance.json must contain a records array');
}

const previewPackagePath = resolve(demoRoot, 'preview-demos', 'package.json');
const previewPackageProblems = [];
const previewPackage = await loadJson(previewPackagePath, 'demo/preview-demos/package.json', previewPackageProblems);
const previewDependencies = { ...previewPackage?.dependencies, ...previewPackage?.devDependencies };
const previewCaptureManifestProblems = [];
const previewCaptureManifest = await loadJson(
  resolve(demoRoot, 'preview-demos', 'preview-manifest.json'),
  'demo/preview-demos/preview-manifest.json',
  previewCaptureManifestProblems
);
const previewCaptureDemos = Array.isArray(previewCaptureManifest?.demos) ? previewCaptureManifest.demos : [];
if (previewCaptureManifest && !Array.isArray(previewCaptureManifest.demos)) {
  previewCaptureManifestProblems.push('demo/preview-demos/preview-manifest.json must contain a demos array');
}
const previewCaptureById = new Map();
for (const demo of previewCaptureDemos) {
  if (!demo?.id || previewCaptureById.has(demo.id)) {
    previewCaptureManifestProblems.push(`${demo?.id || '(missing id)'}: invalid or duplicate capture manifest demo`);
  } else {
    previewCaptureById.set(demo.id, demo);
  }
}
let previewVendorFiles = [];
try {
  previewVendorFiles = await readdir(resolve(demoRoot, 'preview-demos', 'vendor'));
} catch (error) {
  previewCaptureManifestProblems.push(`cannot inspect demo/preview-demos/vendor: ${error.message}`);
}

function expectedLibraryVersion(effectId) {
  const captureDemo = previewCaptureById.get(effectId);
  if (!captureDemo || typeof captureDemo.library !== 'string' || !captureDemo.library.trim()) {
    previewCaptureManifestProblems.push(`${effectId}: capture manifest is missing a pinned library version`);
    return null;
  }
  const specs = captureDemo.library.split(' + ').map(spec => spec.trim());
  for (const spec of specs) {
    const match = spec.match(/^(.+)@([^@]+)$/);
    if (!match) {
      previewCaptureManifestProblems.push(`${effectId}: invalid capture manifest library spec ${spec}`);
      continue;
    }
    const [, packageName, version] = match;
    if (packageName === 'aframe') {
      if (!previewVendorFiles.includes(`aframe-v${version}.min.js`)) {
        previewCaptureManifestProblems.push(`${effectId}: missing pinned vendor/aframe-v${version}.min.js`);
      }
    } else if (previewDependencies[packageName] !== version) {
      previewPackageProblems.push(`${effectId}: ${spec} does not match demo/preview-demos/package.json`);
    }
  }
  return specs.join('; ');
}

function provenanceProblemsFor(catalogRecord, provenance) {
  const problems = [];
  const requiredFields = [
    'effectId', 'projectId', 'sourceType', 'originUrl', 'demoSourcePath', 'libraryVersion',
    'generatedAt', 'outputPath', 'usageBasis'
  ];
  for (const field of requiredFields) {
    if (!Object.hasOwn(provenance, field)) problems.push(`provenance is missing ${field}`);
  }

  const expectedSourceType = catalogRecord.official ? 'official' : 'demo';
  const expectedDemoPath = catalogRecord.localDemo ? `demo/${catalogRecord.demoSourcePath}` : null;
  const expectedOutputPath = `demo/gifs/${catalogRecord.preview}.gif`;
  if (provenance.effectId !== catalogRecord.effectId) problems.push('provenance effectId does not match catalog effectId');
  if (provenance.projectId !== catalogRecord.projectId) problems.push('provenance projectId does not match catalog projectId');
  if (provenance.sourceType !== expectedSourceType) problems.push(`provenance sourceType must be ${expectedSourceType}`);
  if (provenance.originUrl !== catalogRecord.originUrl) problems.push('provenance originUrl does not match catalog originUrl');
  if (provenance.demoSourcePath !== expectedDemoPath) problems.push(`provenance demoSourcePath must be ${expectedDemoPath ?? 'null'}`);
  if (provenance.outputPath !== expectedOutputPath) problems.push(`provenance outputPath must be ${expectedOutputPath}`);
  if (typeof provenance.libraryVersion !== 'string' || !provenance.libraryVersion.trim()) {
    problems.push('provenance libraryVersion must be explicit');
  }
  if (catalogRecord.localDemo) {
    const expectedVersion = expectedLibraryVersion(catalogRecord.effectId);
    if (expectedVersion && provenance.libraryVersion !== expectedVersion) {
      problems.push(`provenance libraryVersion must match package.json: ${expectedVersion}`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(provenance.generatedAt || '')) {
    problems.push('provenance generatedAt must use YYYY-MM-DD');
  }
  if (typeof provenance.usageBasis !== 'string' || !/verify license https:\/\/github\.com\//i.test(provenance.usageBasis)) {
    problems.push('provenance usageBasis must point to the upstream repository license without asserting unverified permission');
  }
  return problems;
}

async function inspectSource(effect, source, sourceIndex) {
  const key = `${effect.id}/${source.projectId || `source-${sourceIndex + 1}`}`;
  const kind = source.previewKind || 'missing';
  const official = kind === 'official-capture';
  const localDemo = kind === 'local-demo-capture';
  const unavailable = kind === 'unavailable';
  const editorial = kind === 'editorial-recreation';
  const legacyGenerated = editorial && (
    Boolean(source.previewRecipe)
    || typeof source.preview === 'string' && source.preview.split('/').includes('generated')
  );
  const otherEditorial = editorial && !legacyGenerated;
  const problems = [];
  const gif = unavailable ? { path: null, problem: null } : await inspectGif(source.preview);
  if (!unavailable && gif.problem) problems.push(gif.problem);

  if (!allowedPreviewKinds.has(kind)) {
    problems.push(`unsupported published previewKind: ${kind}`);
  }

  if ((official || localDemo) && !isPublicUrl(source.originUrl)) {
    problems.push(`${kind} requires an HTTP(S) originUrl`);
  }

  if (unavailable) {
    if (source.preview !== null && source.preview !== undefined) problems.push('unavailable preview must set preview to null');
    if (source.demoPath !== null && source.demoPath !== undefined) problems.push('unavailable preview must not retain a demoPath');
    if (source.demoSourcePath !== null && source.demoSourcePath !== undefined) problems.push('unavailable preview must not retain a demoSourcePath');
    if (source.previewRecipe !== null && source.previewRecipe !== undefined) problems.push('unavailable preview must not retain a previewRecipe');
  }

  let demo = { path: null, problem: null };
  let demoSource = { path: null, problem: null };
  if (localDemo) {
    demo = await inspectDemo(source.demoPath);
    if (demo.problem) problems.push(demo.problem);
    demoSource = await inspectDemo(source.demoSourcePath, 'demoSourcePath');
    if (demoSource.problem) problems.push(demoSource.problem);
  } else if (!official && !unavailable) {
    demo.problem = 'no runnable local demo is associated with this non-official preview';
    problems.push(demo.problem);
  }

  if ((official || localDemo) && (source.previewRecipe || source.preview?.split('/').includes('generated'))) {
    problems.push('authentic preview retains a legacy generated-template marker');
  }

  return {
    key,
    order: effect.order,
    effectId: effect.id,
    effectName: effect.name,
    projectId: source.projectId || null,
    preview: source.preview || null,
    previewKind: kind,
    originUrl: source.originUrl || null,
    demoPath: source.demoPath || null,
    demoSourcePath: source.demoSourcePath || null,
    official,
    localDemo,
    unavailable,
    legacyGenerated,
    otherEditorial,
    provenancePresent: isPublicUrl(source.originUrl),
    runnableDemoPresent: localDemo && !demo.problem,
    demoSourcePresent: localDemo && !demoSource.problem,
    gifPresent: unavailable ? false : !gif.problem,
    compliant: problems.length === 0,
    authentic: (official || localDemo) && problems.length === 0,
    problems
  };
}

const records = [];
for (const effect of effects) {
  for (const [sourceIndex, source] of effect.sources.entries()) {
    records.push(await inspectSource(effect, source, sourceIndex));
  }
}

records.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));

const provenanceByEffectId = new Map();
for (const provenance of provenanceRecords) {
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    provenanceManifestProblems.push('provenance records must be objects');
    continue;
  }
  if (typeof provenance.effectId !== 'string' || !provenance.effectId) {
    provenanceManifestProblems.push('provenance record is missing effectId');
    continue;
  }
  const matches = provenanceByEffectId.get(provenance.effectId) || [];
  matches.push(provenance);
  provenanceByEffectId.set(provenance.effectId, matches);
}

for (const [effectId, matches] of provenanceByEffectId) {
  if (matches.length > 1) provenanceManifestProblems.push(`${effectId}: duplicate provenance records (${matches.length})`);
  if (!records.some(record => record.effectId === effectId)) provenanceManifestProblems.push(`${effectId}: provenance references an unknown effect`);
}

for (const record of records) {
  const matches = provenanceByEffectId.get(record.effectId) || [];
  record.provenance = matches.length === 1 ? matches[0] : null;
  record.provenanceProblems = [];
  if (record.official || record.localDemo) {
    if (matches.length !== 1) {
      record.provenanceProblems.push(`expected exactly one provenance record; found ${matches.length}`);
    } else {
      record.provenanceProblems.push(...provenanceProblemsFor(record, matches[0]));
    }
  } else if (matches.length) {
    record.provenanceProblems.push(`${record.previewKind} must not have a provenance record`);
  }
  record.problems.push(...record.provenanceProblems);
  record.compliant = record.problems.length === 0;
  record.authentic = (record.official || record.localDemo) && record.compliant;
}

const gifFiles = (await listFiles(resolve(demoRoot, 'gifs')))
  .filter(path => extname(path).toLowerCase() === '.gif')
  .map(path => relative(demoRoot, path).split(sep).join('/'))
  .sort();
const referencedGifFiles = new Set(records
  .filter(record => record.preview)
  .map(record => `gifs/${record.preview}.gif`));
const orphanedGifFiles = gifFiles.filter(path => !referencedGifFiles.has(path));
const legacyGeneratedGifFiles = gifFiles.filter(path => path.startsWith('gifs/generated/'));
const orphanedLegacyGeneratedGifFiles = orphanedGifFiles.filter(path => path.startsWith('gifs/generated/'));

async function extractPerceptualSignature(record) {
  const path = resolve(demoRoot, 'gifs', `${record.preview}.gif`);
  const { stdout } = await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', path,
    '-vf', `fps=6,scale=${signatureWidth}:${signatureHeight}:flags=area,format=gray`,
    '-t', '3', '-an', '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'
  ], { encoding: 'buffer', maxBuffer: 4 * 1024 * 1024 });
  const frameSize = signatureWidth * signatureHeight;
  const availableFrames = Math.floor(stdout.length / frameSize);
  if (!availableFrames) throw new Error('ffmpeg returned no frames');
  const signature = Buffer.alloc(frameSize * signatureFrameCount);
  for (let index = 0; index < signatureFrameCount; index += 1) {
    const sourceIndex = signatureFrameCount === 1
      ? 0
      : Math.round(index * (availableFrames - 1) / (signatureFrameCount - 1));
    const sourceOffset = sourceIndex * frameSize;
    let mean = 0;
    for (let pixelIndex = 0; pixelIndex < frameSize; pixelIndex += 1) mean += stdout[sourceOffset + pixelIndex];
    mean /= frameSize;
    let variance = 0;
    for (let pixelIndex = 0; pixelIndex < frameSize; pixelIndex += 1) {
      variance += (stdout[sourceOffset + pixelIndex] - mean) ** 2;
    }
    const standardDeviation = Math.max(1, Math.sqrt(variance / frameSize));
    for (let pixelIndex = 0; pixelIndex < frameSize; pixelIndex += 1) {
      const normalized = 128 + (stdout[sourceOffset + pixelIndex] - mean) * 48 / standardDeviation;
      signature[index * frameSize + pixelIndex] = Math.max(0, Math.min(255, Math.round(normalized)));
    }
  }
  return signature;
}

function normalizedSignatureDistance(left, right) {
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference += Math.abs(left[index] - right[index]);
  return difference / (left.length * 255);
}

const signatureProblems = [];
const signatureRecords = [];
await Promise.all(records.filter(record => (record.official || record.localDemo) && record.gifPresent).map(async record => {
  try {
    signatureRecords.push({ record, signature: await extractPerceptualSignature(record) });
  } catch (error) {
    signatureProblems.push(`${record.key}: cannot create perceptual signature (${error.message})`);
  }
}));
signatureRecords.sort((a, b) => a.record.order - b.record.order || a.record.key.localeCompare(b.record.key));
const perceptualDuplicatePairs = [];
for (let leftIndex = 0; leftIndex < signatureRecords.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < signatureRecords.length; rightIndex += 1) {
    const left = signatureRecords[leftIndex];
    const right = signatureRecords[rightIndex];
    const distance = normalizedSignatureDistance(left.signature, right.signature);
    if (distance <= perceptualDuplicateThreshold) {
      perceptualDuplicatePairs.push({
        key: `${left.record.effectId} <> ${right.record.effectId}`,
        leftEffectId: left.record.effectId,
        rightEffectId: right.record.effectId,
        normalizedDistance: Number(distance.toFixed(6))
      });
    }
  }
}
perceptualDuplicatePairs.sort((a, b) => a.normalizedDistance - b.normalizedDistance || a.key.localeCompare(b.key));

const groups = {
  authentic: records.filter(record => record.authentic),
  official: records.filter(record => record.official),
  localDemo: records.filter(record => record.localDemo),
  unavailable: records.filter(record => record.unavailable),
  legacyGenerated: records.filter(record => record.legacyGenerated),
  otherEditorial: records.filter(record => record.otherEditorial),
  unsupported: records.filter(record => !allowedPreviewKinds.has(record.previewKind)),
  missingRunnableDemo: records.filter(record => !record.official && !record.unavailable && !record.runnableDemoPresent),
  missingProvenance: records.filter(record => (record.official || record.localDemo) && !record.provenancePresent),
  missingProvenanceRecord: records.filter(record => (record.official || record.localDemo) && !record.provenance),
  invalidProvenance: records.filter(record => record.provenanceProblems.length),
  missingGif: records.filter(record => !record.unavailable && !record.gifPresent),
  failures: records.filter(record => !record.compliant)
};

const summary = {
  effects: effects.length,
  sources: records.length,
  authentic: groups.authentic.length,
  official: groups.official.length,
  localDemo: groups.localDemo.length,
  unavailable: groups.unavailable.length,
  previewCoveragePercent: Number(((groups.authentic.length / records.length) * 100).toFixed(1)),
  legacyGeneratedEditorial: groups.legacyGenerated.length,
  otherEditorialRecreations: groups.otherEditorial.length,
  unsupportedPreviewKinds: groups.unsupported.length,
  missingRunnableDemo: groups.missingRunnableDemo.length,
  missingOriginProvenance: groups.missingProvenance.length,
  provenanceRecords: provenanceRecords.length,
  missingProvenanceRecords: groups.missingProvenanceRecord.length,
  invalidProvenanceRecords: groups.invalidProvenance.length,
  provenanceManifestProblems: provenanceManifestProblems.length + previewPackageProblems.length + previewCaptureManifestProblems.length,
  missingOrInvalidGif: groups.missingGif.length,
  gifFiles: gifFiles.length,
  legacyGeneratedGifFiles: legacyGeneratedGifFiles.length,
  orphanedGifFiles: orphanedGifFiles.length,
  orphanedLegacyGeneratedGifFiles: orphanedLegacyGeneratedGifFiles.length,
  perceptualDuplicateThreshold,
  perceptualDuplicatePairs: perceptualDuplicatePairs.length,
  perceptualSignatureProblems: signatureProblems.length,
  sourceFailures: groups.failures.length,
  blockingIssues: groups.failures.length + orphanedGifFiles.length + provenanceManifestProblems.length + previewPackageProblems.length + previewCaptureManifestProblems.length + perceptualDuplicatePairs.length + signatureProblems.length
};

function printGroup(title, items, details) {
  console.log(`\n${title} (${items.length})`);
  if (!items.length) {
    console.log('- none');
    return;
  }
  for (const item of items) {
    const key = typeof item === 'string' ? item : item.key;
    console.log(`- ${key} — ${details(item)}`);
  }
}

if (json) {
  console.log(JSON.stringify({
    schemaVersion: 1,
    reportOnly,
    summary,
    artifacts: {
      gifFiles,
      legacyGeneratedGifFiles,
      orphanedGifFiles,
      orphanedLegacyGeneratedGifFiles
    },
    provenance: {
      path: 'demo/gifs/provenance.json',
      records: provenanceRecords,
      problems: [...provenanceManifestProblems, ...previewPackageProblems, ...previewCaptureManifestProblems]
    },
    perceptualDuplicates: {
      method: `${signatureFrameCount} evenly sampled frames from 6 fps, ${signatureWidth}x${signatureHeight} grayscale normalized mean absolute distance`,
      threshold: perceptualDuplicateThreshold,
      pairs: perceptualDuplicatePairs,
      problems: signatureProblems
    },
    records
  }, null, 2));
} else {
  console.log('Preview authenticity audit');
  console.log('Accepted sources: official-capture + originUrl, local-demo-capture + demoPath + originUrl, or an honest unavailable record with no preview artifacts.');
  console.log('This audit is offline: it validates recorded provenance URLs syntactically but does not fetch them.');
  for (const [label, value] of Object.entries(summary)) console.log(`${label}: ${value}`);

  printGroup('Official material', groups.official, item => `${item.preview}; ${item.originUrl || 'missing originUrl'}`);
  printGroup('Declared local demo captures', groups.localDemo, item => `${item.preview}; demo/${item.demoPath || '(missing demoPath)'}${item.problems.length ? `; ${item.problems.join('; ')}` : ''}`);
  printGroup('Honestly unavailable previews', groups.unavailable, item => item.problems.length ? item.problems.join('; ') : 'no published preview');
  printGroup('Legacy generated editorial recreations', groups.legacyGenerated, item => `${item.preview}; ${item.problems.join('; ')}`);
  printGroup('Other editorial recreations', groups.otherEditorial, item => `${item.preview}; ${item.problems.join('; ')}`);
  printGroup('Missing origin provenance', groups.missingProvenance, item => `${item.previewKind}; ${item.preview}`);
  printGroup('Missing or invalid provenance records', groups.invalidProvenance, item => item.provenanceProblems.join('; '));
  printGroup('Missing runnable demo', groups.missingRunnableDemo, item => `${item.previewKind}; ${item.preview}`);
  printGroup('Other authenticity failures', groups.failures.filter(item => !item.legacyGenerated && !item.otherEditorial), item => item.problems.join('; '));
  printGroup('Orphaned GIF files', orphanedGifFiles, () => 'not referenced by the catalog');
  printGroup('Provenance manifest problems', [...provenanceManifestProblems, ...previewPackageProblems, ...previewCaptureManifestProblems], problem => problem);
  printGroup('Perceptually duplicate GIF pairs', perceptualDuplicatePairs, pair => `normalized distance ${pair.normalizedDistance}`);
  printGroup('Perceptual signature problems', signatureProblems, problem => problem);

  console.log(`\nResult: ${summary.blockingIssues ? 'FAIL' : 'PASS'}${reportOnly ? ' (report-only mode)' : ''}`);
}

if (summary.blockingIssues && !reportOnly) process.exitCode = 1;
