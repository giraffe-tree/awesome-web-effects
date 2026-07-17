#!/usr/bin/env node

import { stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { categories, effects, projects, snapshotDate } from '../demo/data/effects.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const liveDemo = 'https://giraffe-tree.github.io/awesome-web-effects/';
const projectById = new Map(projects.map(project => [project.id, project]));
const newProjectCount = projects.filter(project => project.addedIn === '2026-expansion').length;
const baselineEffectCount = effects.filter(effect => effect.addedIn === 'baseline').length;
const researchEffectCount = effects.filter(effect => effect.addedIn === '2026-effect-expansion').length;
const sources = effects.flatMap(effect => effect.sources);
const officialPreviewCount = sources.filter(source => source.previewKind === 'official-capture' && source.preview).length;
const localDemoPreviewCount = sources.filter(source => source.previewKind === 'local-demo-capture' && source.preview).length;
const verifiedPreviewCount = officialPreviewCount + localDemoPreviewCount;
const unavailablePreviewCount = sources.filter(source => source.previewKind === 'unavailable').length;
const promptCount = effects.filter(effect => effect.prompt).length;
const legacyProjectCount = projects.filter(project => project.legacy).length;
const multiEffectProjectCount = projects.filter(project => effects.filter(effect => effect.sources.some(source => source.projectId === project.id)).length > 1).length;
const observedEffectCount = effects.filter(effect => effect.relatedParties.length).length;
const relatedPartyLinkCount = effects.reduce((sum, effect) => sum + effect.relatedParties.length, 0);
const observedCompanyCount = new Set(effects.flatMap(effect => effect.relatedParties.map(party => party.name))).size;
const previewPaths = [...new Set(sources
  .filter(source => ['official-capture', 'local-demo-capture'].includes(source.previewKind) && source.preview)
  .map(source => resolve(root, 'demo', 'gifs', `${source.preview}.gif`)))];
const previewBytes = (await Promise.all(previewPaths.map(path => stat(path)))).reduce((sum, item) => sum + item.size, 0);
const previewMiB = (previewBytes / 1024 / 1024).toFixed(2);
const formatStars = value => value.toLocaleString('en-US');
const recommendedSource = effect => effect.sources.find(source => source.recommended) || effect.sources[0];
const relatedPartyLinks = effect => effect.relatedParties.length
  ? effect.relatedParties.map(party => `[${party.name}](${party.url})`).join('<br>')
  : '—';

function categorySummary(language) {
  const isZh = language === 'zh';
  const headers = isZh
    ? '| 分类 | 效果数 | 来源项目 | 关注结果 |\n| --- | ---: | ---: | --- |'
    : '| Category | Effects | Source projects | Visible result |\n| --- | ---: | ---: | --- |';
  const rows = categories.map(category => {
    const categoryEffects = effects.filter(effect => effect.category === category.id);
    const sourceCount = new Set(categoryEffects.flatMap(effect => effect.sources.map(source => source.projectId))).size;
    return `| [${isZh ? category.labelZh : category.label}](#${category.id}) | ${categoryEffects.length} | ${sourceCount} | ${isZh ? category.descriptionZh : category.description} |`;
  });
  return [headers, ...rows].join('\n');
}

function effectTables(language) {
  const isZh = language === 'zh';
  return categories.map(category => {
    const rows = effects.filter(effect => effect.category === category.id).map(effect => {
      const source = recommendedSource(effect);
      const project = projectById.get(source.projectId);
      const status = project.legacy ? (isZh ? '经典旧版' : 'Legacy') : (isZh ? '当前推荐' : 'Recommended');
      const name = isZh ? effect.nameZh : effect.name;
      return `| [${name}](${liveDemo}#${effect.id}) | [${project.name}](${project.url}) | ${relatedPartyLinks(effect)} | ${formatStars(project.stars)} | ${effect.sources.length} | ${status} | [${isZh ? '代码 + 提示词' : 'Code + prompt'}](${liveDemo}#${effect.id}) |`;
    });
    const heading = isZh ? category.labelZh : category.label;
    const description = isZh ? category.descriptionZh : category.description;
    const headers = isZh
      ? '| 效果 | 推荐实现 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |\n| --- | --- | --- | ---: | ---: | --- | --- |'
      : '| Effect | Recommended implementation | AI homepage references (max 3) | Stars | Implementations | Status | Implementation |\n| --- | --- | --- | ---: | ---: | --- | --- |';
    return `<a id="${category.id}"></a>\n\n### ${heading}\n\n${description}\n\n${headers}\n${rows.join('\n')}`;
  }).join('\n\n');
}

const english = `# Awesome Web Effects

[中文文档](README.zh-CN.md) · [Live demo](${liveDemo})

An **effect-first** atlas of open-source interactions for the web. It catalogs **${effects.length} distinct effects across ${categories.length} categories**, backed by **${projects.length} source projects**. Each effect is one row with a stable semantic key, an honest preview status, copyable minimal code, and a one-click implementation prompt for Codex or Claude Code. Verified GIFs appear only when backed by official footage or a runnable local demo. English is the default interface and documentation language.

## Effect-first model

- **Effect is the catalog key.** Anchors, search results, rows, categories, and code examples begin with the visible interaction—not the repository.
- **Projects are implementation sources.** One project may power several distinct effects; ${multiEffectProjectCount} source projects currently demonstrate this relation in the catalog.
- **An effect may have multiple implementations.** Each source relation owns its own minimal snippet and preview status, so alternatives can be compared without duplicating the effect row.
- **Deduplication happens at the visible-effect level.** Candidates are compared by trigger, visual change, time relationship, and page layer; the newer, maintained, better-documented implementation becomes the recommended source.

## Catalog snapshot

- ${effects.length} effect rows, including ${baselineEffectCount} baseline effects.
- ${researchEffectCount} independently researched effects were added in the latest effect-level expansion.
- ${projects.length} unique GitHub source projects; ${newProjectCount} were added during the 2026 expansion.
- ${verifiedPreviewCount} verified source-specific GIF previews: ${officialPreviewCount} official captures and ${localDemoPreviewCount} captures from runnable local demos.
- ${unavailablePreviewCount} source relations currently have no verified preview; the site explicitly displays **No real preview** instead of loading a placeholder.
- ${promptCount} one-click implementation prompts, one for every effect.
- ${relatedPartyLinkCount} source-backed AI homepage references are integrated into ${observedEffectCount} existing effect rows, covering ${observedCompanyCount} companies; each effect shows at most three representative companies.
- ${legacyProjectCount} useful older sources are marked **Legacy**; no archived repository is included.
- Stars are a snapshot from **${snapshotDate}**, not a live counter.
- The verified, optimized GIF set is **${previewMiB} MiB**; each published preview is 320×180, at most three seconds, and below 1 MiB.

The implementation source and the website where an effect was observed are separate relationships. See the [Chinese-first 100-company audit](research/ai-native-homepages-100.md) for all observations, including common patterns that were not duplicated as new effect rows.

## Selection rules

1. Every row must describe one visible interaction effect that can appear in a normal web page.
2. Every effect needs a stable bilingual name, a semantic effect ID, a category, and at least one verifiable source.
3. Repository duplication across different effect rows is valid; duplicate effect IDs or effect names are not.
4. Every effect has exactly one recommended source. Alternatives belong inside the same row instead of creating duplicate effects.
5. Minimal code and preview provenance belong to the effect–source relation, because implementations differ by project. Missing media stays explicitly unavailable until a real preview is captured.

## Categories

${categorySummary('en')}

## Effect catalog

${effectTables('en')}

## Demo

The demo is dependency-free static HTML, CSS, JavaScript modules, and verified GIF assets. It supports effect search, category filtering, effect-first sorting, English/Chinese UI, stable effect anchors, real mobile previews when available, explicit unavailable states, expandable source details, copyable minimal code, and one-click prompts for coding agents.

\`\`\`bash
python3 -m http.server 4173 --directory demo
\`\`\`

Open [http://localhost:4173](http://localhost:4173). A local HTTP server is required because the catalog is loaded as an ES module.

## Real GIF capture and optimization

First build a runnable, reusable HTML demo in \`demo/preview-demos/\` and verify that it uses the named implementation. Capture the running browser output, then normalize verified official GIFs:

\`\`\`bash
npm ci --prefix demo/preview-demos
npm run build --prefix demo/preview-demos
python3 scripts/capture-real-preview-gifs.py --built --skip-install
node scripts/normalize-gif-previews.mjs
\`\`\`

The capture step records the real local demo; normalization only processes source-verified official media. The validator checks provenance state, demo and GIF existence, unique content hashes, dimensions, duration, frame count, decodability, and the per-file size budget. If a source has neither a verified official asset nor a runnable captured demo, leave it unavailable.

See the [preview authenticity migration report](research/preview-authenticity-migration-2026-07-17.md) and the machine-readable [preview provenance manifest](demo/gifs/provenance.json).

## GitHub Pages

The demo is fully static and uses only relative paths. The included workflow publishes \`demo/\` on pushes to \`main\` and supports manual runs. Before the first deployment, set **Settings → Pages → Source** to **GitHub Actions**. See [the deployment notes](docs/GITHUB_PAGES.md).

Expected project URL: [${liveDemo}](${liveDemo})

## Maintaining the catalog

- Edit \`demo/data/effects.js\` for the core catalog and \`demo/data/additional-effects.js\` for researched expansion records.
- Edit \`demo/data/company-observations.js\` to associate source-backed AI homepage sightings with existing effects; keep at most three companies per effect.
- Keep \`effect.id\` semantic and stable; never derive it from a repository name.
- Reusing a project across effects is valid. Add alternative implementations to an effect's \`sources\` array.
- Keep snippets and previews on the source relation, not on the project or effect root.
- Run \`node scripts/build-docs.mjs\` to regenerate both README files.
- Run \`node scripts/validate.mjs\` before committing.

GIFs and project names are used for research, indexing, and comparison. Rights remain with their respective authors.
`;

const chinese = `# Awesome Web Effects

[English (default)](README.md) · [在线 Demo](${liveDemo})

一个**以效果为先**的开源 Web 交互图鉴。当前收录 **${categories.length} 类 ${effects.length} 种不同效果**，背后有 **${projects.length} 个来源项目**。每种效果独占一行，拥有稳定语义 Key、诚实的预览状态、可复制的最小代码，以及可一键交给 Codex 或 Claude Code 的实现提示词。只有存在官方素材或可运行本地 Demo 时才展示真实 GIF。英文是默认界面与默认文档语言，同时提供完整中文文档与中文界面。

## 效果优先模型

- **效果是目录主键。** 锚点、搜索结果、行、分类与代码示例都从用户看得见的交互出发，而不是从仓库出发。
- **项目是实现来源。** 一个项目可以实现多种不同效果；当前种子目录已有 ${multiEffectProjectCount} 个来源项目明确展示这种关系。
- **一种效果可以有多个实现。** 每个来源关系拥有自己的最小代码和预览状态，因此替代方案可以放在同一行中比较，不必复制效果行。
- **去重发生在可见效果层。** 候选按触发方式、视觉变化、时间关系和页面层级比较；更新、维护更好、文档更清楚的实现成为推荐来源。

## 目录快照

- ${effects.length} 行效果，其中 ${baselineEffectCount} 种为基线效果。
- 最近一次效果级扩展独立调研并新增 ${researchEffectCount} 种效果。
- ${projects.length} 个唯一 GitHub 来源项目；2026 扩展阶段新增 ${newProjectCount} 个。
- ${verifiedPreviewCount} 个与具体来源对应的真实 GIF：${officialPreviewCount} 个官方素材捕获，${localDemoPreviewCount} 个来自可运行本地 Demo 的录制。
- ${unavailablePreviewCount} 个来源关系暂无已核验预览；站点会明确显示 **暂无真实预览**，不会加载占位动画。
- ${promptCount} 份一键实现提示词，每种效果都有一份。
- 已把 ${relatedPartyLinkCount} 条有证据的 AI 官网参考整合进 ${observedEffectCount} 个原有特效行，共覆盖 ${observedCompanyCount} 家公司；每种特效最多展示 3 家代表公司。
- ${legacyProjectCount} 个较旧但仍有参考价值的来源标记为“经典旧版”；不包含已归档仓库。
- Stars 是 **${snapshotDate}** 的快照，不是实时计数器。
- 已核验 GIF 优化后总计 **${previewMiB} MiB**；每个发布预览均为 320×180、最长三秒且小于 1 MiB。

“推荐实现”和“在哪家公司官网观察到”是两种不同关系，现在会在同一个特效行中同时展示。完整观察记录见 [100 家 AI 公司主页特效调研](research/ai-native-homepages-100.md)，其中也保留了没有重复加入目录的常见效果。

## 收录与去重规则

1. 每一行只能描述一种能在普通网页中呈现的可见交互效果。
2. 每种效果必须有稳定的中英文名称、语义化效果 ID、分类和至少一个可核验来源。
3. 同一仓库出现在不同效果行中是合法的；重复的效果 ID 或效果名称不合法。
4. 每种效果必须且只能有一个推荐来源；替代实现应加入同一行，不能复制效果。
5. 最小代码与预览来源信息属于“效果 × 来源”关系，因为不同项目的实现方式不同。缺少真实素材时必须保持“暂无真实预览”，直到完成真实录制。

## 分类概览

${categorySummary('zh')}

## 效果目录

${effectTables('zh')}

## Demo

Demo 只使用静态 HTML、CSS、JavaScript 模块和已核验 GIF，无第三方运行依赖。它支持效果搜索、分类筛选、效果优先排序、中英文切换、稳定效果锚点、可用时展示移动端真实预览、明确的缺失状态、展开来源详情、代码复制和 Agent 提示词一键复制。

\`\`\`bash
python3 -m http.server 4173 --directory demo
\`\`\`

打开 [http://localhost:4173](http://localhost:4173)。目录使用 ES Module，因此需要本地 HTTP 服务，不能直接双击文件运行。

## 真实 GIF 录制与压缩

先在 \`demo/preview-demos/\` 编写可运行、可复用且确实使用对应实现的 HTML Demo，核验后录制真实浏览器输出，再规范化来源已核验的官方 GIF：

\`\`\`bash
npm ci --prefix demo/preview-demos
npm run build --prefix demo/preview-demos
python3 scripts/capture-real-preview-gifs.py --built --skip-install
node scripts/normalize-gif-previews.mjs
\`\`\`

录制步骤捕获真实本地 Demo，规范化步骤只处理来源已经核验的官方素材。验证器会检查来源状态、Demo 与 GIF 是否存在、内容哈希唯一性、尺寸、时长、帧数、可解码性和单文件大小预算。既没有可靠官方素材、也没有可运行录制 Demo 时，应保持“暂无真实预览”。

参见[预览真实性迁移报告](research/preview-authenticity-migration-2026-07-17.md)与机器可读的[预览来源清单](demo/gifs/provenance.json)。

## GitHub Pages

Demo 完全静态且只使用相对路径。仓库内工作流会在推送到 \`main\` 后发布 \`demo/\`，也支持手动运行。首次部署前需要在 **Settings → Pages → Source** 选择 **GitHub Actions**。详见 [中文部署说明](docs/GITHUB_PAGES.zh-CN.md)。

预计地址：[${liveDemo}](${liveDemo})

## 维护目录

- 核心目录修改 \`demo/data/effects.js\`，独立调研的扩展记录修改 \`demo/data/additional-effects.js\`。
- 官网观察关系修改 \`demo/data/company-observations.js\`；每种特效最多关联 3 家有证据的公司。
- \`effect.id\` 必须语义化且保持稳定，禁止从仓库名派生。
- 同一项目可被多个效果复用；替代实现加入效果的 \`sources\` 数组。
- 代码与预览必须放在来源关系上，不能放到项目或效果根节点。
- 运行 \`node scripts/build-docs.mjs\` 同步生成两份 README。
- 提交前运行 \`node scripts/validate.mjs\`。

GIF 与项目名称仅用于研究、索引和比较，权利归各自作者所有。
`;

await Promise.all([
  writeFile(resolve(root, 'README.md'), english),
  writeFile(resolve(root, 'README.zh-CN.md'), chinese)
]);

console.log(`Generated bilingual effect-first docs for ${effects.length} effects and ${projects.length} source projects.`);
