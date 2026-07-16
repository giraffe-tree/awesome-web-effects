#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { categories, effects, projects, snapshotDate } from '../demo/data/effects.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const liveDemo = 'https://giraffe-tree.github.io/awesome-interaction/';
const projectById = new Map(projects.map(project => [project.id, project]));
const newProjectCount = projects.filter(project => project.addedIn === '2026-expansion').length;
const baselineEffectCount = effects.filter(effect => effect.addedIn === 'baseline').length;
const previewCount = effects.flatMap(effect => effect.sources).filter(source => source.preview).length;
const legacyProjectCount = projects.filter(project => project.legacy).length;
const multiEffectProjectCount = projects.filter(project => effects.filter(effect => effect.sources.some(source => source.projectId === project.id)).length > 1).length;
const formatStars = value => value.toLocaleString('en-US');
const recommendedSource = effect => effect.sources.find(source => source.recommended) || effect.sources[0];

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
      return `| [${name}](${liveDemo}#${effect.id}) | [${project.name}](${project.url}) | ${formatStars(project.stars)} | ${effect.sources.length} | ${status} | [${isZh ? '打开' : 'Open'}](${liveDemo}#${effect.id}) |`;
    });
    const heading = isZh ? category.labelZh : category.label;
    const description = isZh ? category.descriptionZh : category.description;
    const headers = isZh
      ? '| 效果 | 推荐来源 | Stars | 实现数 | 状态 | 最小代码 |\n| --- | --- | ---: | ---: | --- | --- |'
      : '| Effect | Recommended source | Stars | Implementations | Status | Minimal code |\n| --- | --- | ---: | ---: | --- | --- |';
    return `<a id="${category.id}"></a>\n\n### ${heading}\n\n${description}\n\n${headers}\n${rows.join('\n')}`;
  }).join('\n\n');
}

const english = `# Awesome Web Effects

[中文文档](README.zh-CN.md) · [Live demo](${liveDemo})

An **effect-first**, code-first atlas of open-source interactions for the web. It catalogs **${effects.length} distinct effects across ${categories.length} categories**, backed by **${projects.length} source projects**. Each effect is one row with a stable semantic key, a recommended implementation, and copyable minimal code. English is the default interface and documentation language.

## Effect-first model

- **Effect is the catalog key.** Anchors, search results, rows, categories, and code examples begin with the visible interaction—not the repository.
- **Projects are implementation sources.** One project may power several distinct effects; ${multiEffectProjectCount} source project currently demonstrates this relation in the seed catalog.
- **An effect may have multiple implementations.** Each source relation owns its own minimal snippet and GIF preview, so alternatives can be compared without duplicating the effect row.
- **Deduplication happens at the visible-effect level.** Candidates are compared by trigger, visual change, time relationship, and page layer; the newer, maintained, better-documented implementation becomes the recommended source.

## Catalog snapshot

- ${effects.length} effect rows, including ${baselineEffectCount} baseline effects.
- ${projects.length} unique GitHub source projects; ${newProjectCount} were added during the 2026 expansion.
- ${previewCount} source-specific GIF previews; all other rows are explicitly code-first.
- ${legacyProjectCount} useful older sources are marked **Legacy**; no archived repository is included.
- Stars are a snapshot from **${snapshotDate}**, not a live counter.
- The optimized GIF set remains **15.81 MiB**, down from 27.28 MiB (42.03% smaller).

## Selection rules

1. Every row must describe one visible interaction effect that can appear in a normal web page.
2. Every effect needs a stable bilingual name, a semantic effect ID, a category, and at least one verifiable source.
3. Repository duplication across different effect rows is valid; duplicate effect IDs or effect names are not.
4. Every effect has exactly one recommended source. Alternatives belong inside the same row instead of creating duplicate effects.
5. Minimal code and preview media belong to the effect–source relation, because implementations differ by project.

## Categories

${categorySummary('en')}

## Effect catalog

${effectTables('en')}

## Demo

The demo is dependency-free static HTML, CSS, JavaScript modules, and GIF assets. It supports effect search, category filtering, effect-first sorting, English/Chinese UI, stable effect anchors, expandable source details, and copyable minimal code.

\`\`\`bash
python3 -m http.server 4173 --directory demo
\`\`\`

Open [http://localhost:4173](http://localhost:4173). A local HTTP server is required because the catalog is loaded as an ES module.

## GIF optimization

Run the reproducible optimizer from original source GIFs:

\`\`\`bash
./scripts/optimize-gifs.sh
\`\`\`

It uses an adaptive 128-color palette, Bayer dithering, and difference-rectangle encoding. A candidate only replaces the source when it is smaller, and dimensions, duration, frame rate, and frame count are validated.

## GitHub Pages

The demo is fully static and uses only relative paths. The included workflow publishes \`demo/\` on pushes to \`main\` and supports manual runs. Before the first deployment, set **Settings → Pages → Source** to **GitHub Actions**. See [the deployment notes](docs/GITHUB_PAGES.md).

Expected project URL: [${liveDemo}](${liveDemo})

## Maintaining the catalog

- Edit \`demo/data/effects.js\`, the single source of truth.
- Keep \`effect.id\` semantic and stable; never derive it from a repository name.
- Reusing a project across effects is valid. Add alternative implementations to an effect's \`sources\` array.
- Keep snippets and previews on the source relation, not on the project or effect root.
- Run \`node scripts/build-docs.mjs\` to regenerate both README files.
- Run \`node scripts/validate.mjs\` before committing.

GIFs and project names are used for research, indexing, and comparison. Rights remain with their respective authors.
`;

const chinese = `# Awesome Web Effects

[English (default)](README.md) · [在线 Demo](${liveDemo})

一个**以效果为先**、代码优先的开源 Web 交互图鉴。当前收录 **${categories.length} 类 ${effects.length} 种不同效果**，背后有 **${projects.length} 个来源项目**。每种效果独占一行，拥有稳定语义 Key、推荐实现和可复制的最小代码。英文是默认界面与默认文档语言，同时提供完整中文文档与中文界面。

## 效果优先模型

- **效果是目录主键。** 锚点、搜索结果、行、分类与代码示例都从用户看得见的交互出发，而不是从仓库出发。
- **项目是实现来源。** 一个项目可以实现多种不同效果；当前种子目录已有 ${multiEffectProjectCount} 个来源项目明确展示这种关系。
- **一种效果可以有多个实现。** 每个来源关系拥有自己的最小代码和 GIF，因此替代方案可以放在同一行中比较，不必复制效果行。
- **去重发生在可见效果层。** 候选按触发方式、视觉变化、时间关系和页面层级比较；更新、维护更好、文档更清楚的实现成为推荐来源。

## 目录快照

- ${effects.length} 行效果，其中 ${baselineEffectCount} 种为基线效果。
- ${projects.length} 个唯一 GitHub 来源项目；2026 扩展阶段新增 ${newProjectCount} 个。
- ${previewCount} 个与具体来源对应的 GIF；其余行明确标记为代码优先。
- ${legacyProjectCount} 个较旧但仍有参考价值的来源标记为“经典旧版”；不包含已归档仓库。
- Stars 是 **${snapshotDate}** 的快照，不是实时计数器。
- GIF 优化后总计仍为 **15.81 MiB**，相较 27.28 MiB 减少 42.03%。

## 收录与去重规则

1. 每一行只能描述一种能在普通网页中呈现的可见交互效果。
2. 每种效果必须有稳定的中英文名称、语义化效果 ID、分类和至少一个可核验来源。
3. 同一仓库出现在不同效果行中是合法的；重复的效果 ID 或效果名称不合法。
4. 每种效果必须且只能有一个推荐来源；替代实现应加入同一行，不能复制效果。
5. 最小代码与预览媒体属于“效果 × 来源”关系，因为不同项目的实现方式不同。

## 分类概览

${categorySummary('zh')}

## 效果目录

${effectTables('zh')}

## Demo

Demo 只使用静态 HTML、CSS、JavaScript 模块和 GIF，无第三方运行依赖。它支持效果搜索、分类筛选、效果优先排序、中英文切换、稳定效果锚点、展开来源详情和代码复制。

\`\`\`bash
python3 -m http.server 4173 --directory demo
\`\`\`

打开 [http://localhost:4173](http://localhost:4173)。目录使用 ES Module，因此需要本地 HTTP 服务，不能直接双击文件运行。

## GIF 压缩

从原始 GIF 运行可复现的压缩脚本：

\`\`\`bash
./scripts/optimize-gifs.sh
\`\`\`

脚本使用自适应 128 色调色板、Bayer 抖动与差异矩形编码。只有候选文件更小时才替换源文件，并强制核验尺寸、时长、帧率与帧数。

## GitHub Pages

Demo 完全静态且只使用相对路径。仓库内工作流会在推送到 \`main\` 后发布 \`demo/\`，也支持手动运行。首次部署前需要在 **Settings → Pages → Source** 选择 **GitHub Actions**。详见 [中文部署说明](docs/GITHUB_PAGES.zh-CN.md)。

预计地址：[${liveDemo}](${liveDemo})

## 维护目录

- 修改唯一数据源 \`demo/data/effects.js\`。
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
