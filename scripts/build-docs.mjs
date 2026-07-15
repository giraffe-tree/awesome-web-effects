#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { categories, projects, snapshotDate } from '../demo/data/projects.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const liveDemo = 'https://giraffe-tree.github.io/awesome-interaction/';
const newCount = projects.filter(project => project.isNew).length;
const previewCount = projects.filter(project => project.preview).length;
const legacyCount = projects.filter(project => project.legacy).length;
const formatStars = value => value.toLocaleString('en-US');

function categorySummary(language) {
  const isZh = language === 'zh';
  const headers = isZh ? '| 分类 | 项目数 | 关注结果 |\n| --- | ---: | --- |' : '| Category | Projects | Visible result |\n| --- | ---: | --- |';
  const rows = categories.map(category => {
    const count = projects.filter(project => project.category === category.id).length;
    return `| [${isZh ? category.labelZh : category.label}](#${category.id}) | ${count} | ${isZh ? category.descriptionZh : category.description} |`;
  });
  return [headers, ...rows].join('\n');
}

function projectTables(language) {
  const isZh = language === 'zh';
  return categories.map(category => {
    const rows = projects.filter(project => project.category === category.id).map(project => {
      const status = project.legacy
        ? (isZh ? '经典旧版' : 'Legacy')
        : (project.isNew ? (isZh ? '新增' : 'New') : (isZh ? '原有' : 'Original'));
      const effect = isZh ? project.effectZh : project.effect;
      return `| [${project.name}](${project.url}) | ${effect} | ${formatStars(project.stars)} | ${status} | [${isZh ? '打开' : 'Open'}](${liveDemo}#${project.slug}) |`;
    });
    const heading = isZh ? category.labelZh : category.label;
    const description = isZh ? category.descriptionZh : category.description;
    const headers = isZh
      ? '| 项目 | 可见效果 | Stars | 状态 | 最小代码 |\n| --- | --- | ---: | --- | --- |'
      : '| Project | Visible effect | Stars | Status | Minimal code |\n| --- | --- | ---: | --- | --- |';
    return `<a id="${category.id}"></a>\n\n### ${heading}\n\n${description}\n\n${headers}\n${rows.join('\n')}`;
  }).join('\n\n');
}

const english = `# Awesome Web Effects

[中文文档](README.zh-CN.md) · [Live demo](${liveDemo})

A deduplicated, code-first atlas of open-source visual effects for the web. It contains **${projects.length} projects across ${categories.length} categories**, including **${newCount} additions** beyond the original 20. Every project has a copyable minimal example in the demo; English is the default interface and documentation language.

## What changed

- Added ${newCount} verified GitHub projects without counting the original 20.
- Deduplicated twice: first by repository, then by the visible-effect signature: **trigger + visual change + time relationship + page layer**.
- Preferred maintained projects with strong ecosystems and clear official examples. ${legacyCount} useful older implementations are explicitly marked **Legacy**; no archived repository is included.
- Kept ${previewCount} project-specific GIF previews. Code-first entries use labeled abstract placeholders instead of unrelated footage.
- Compressed the GIF set from **27.28 MiB to 15.81 MiB** (42.03% smaller) without changing 720×450 dimensions, frame counts, frame rates, or durations.
- Added a static GitHub Pages workflow for the live demo.

## Selection rules

1. The result must be visible in a normal web page: motion, transition, drawing, 2D/3D rendering, pointer response, or media presentation.
2. A repository must be public and verifiable. Stars are a snapshot from **${snapshotDate}**, not a live counter.
3. Similar libraries remain only when their best-known visible result or integration model is materially different.
4. Newer, maintained, well-documented choices win a duplicate comparison. Older but unarchived projects may remain only when their interaction pattern is still distinctive, and are marked Legacy.
5. A minimal example should expose the smallest useful API call, not reproduce an entire starter application.

## Categories

${categorySummary('en')}

## Project catalog

${projectTables('en')}

## Demo

The demo is dependency-free static HTML, CSS, JavaScript modules, and GIF assets. It supports search, category filtering, sorting, English/Chinese UI, direct project anchors, and copyable code.

\`\`\`bash
python3 -m http.server 4173 --directory demo
\`\`\`

Open [http://localhost:4173](http://localhost:4173). A local HTTP server is required because the catalog is loaded as an ES module.

## GIF optimization

Run the reproducible optimizer from original source GIFs:

\`\`\`bash
./scripts/optimize-gifs.sh
\`\`\`

It uses an adaptive 128-color palette, Bayer dithering, and difference-rectangle encoding. A candidate only replaces the source when it is smaller, and dimensions, duration, frame rate, and frame count are validated. Palette reduction is perceptual compression, so keep original source material outside the optimized output when future re-encoding is expected.

## GitHub Pages

Yes—this project can run on GitHub Pages because the demo is fully static and uses only relative paths. The included workflow publishes \`demo/\` on pushes to \`main\` and supports manual runs. Before the first deployment, set **Settings → Pages → Source** to **GitHub Actions**. See [the deployment notes](docs/GITHUB_PAGES.md).

Expected project URL: [${liveDemo}](${liveDemo})

## Maintaining the catalog

- Edit \`demo/data/projects.js\`, the single source of truth.
- Run \`node scripts/build-docs.mjs\` to regenerate both README files.
- Run \`node scripts/validate.mjs\` before committing.
- Preserve the distinction between a real project GIF and a code-first placeholder.

GIFs and project names are used for research, indexing, and comparison. Rights remain with their respective authors.
`;

const chinese = `# Awesome Web Effects

[English (default)](README.md) · [在线 Demo](${liveDemo})

一个经过双重去重、以代码为先的开源 Web 视觉效果图鉴。共收录 **${categories.length} 类 ${projects.length} 个项目**，其中在原有 20 个基础上**新增 ${newCount} 个**。Demo 为每个项目提供可复制的最小代码；英文是默认界面和默认文档语言，同时提供完整中文文档与中文界面。

## 本次更新

- 新增 ${newCount} 个经 GitHub 核验的项目，不把原有 20 个计入新增数量。
- 做两层去重：先按仓库去重，再按可见效果签名 **触发方式 + 视觉变化 + 时间关系 + 页面层级** 去重。
- 同类优先保留维护更活跃、生态更强、官方示例更清楚的项目。${legacyCount} 个技术栈较旧但仍有参考价值的项目明确标注为“经典旧版”；最终目录不包含已归档仓库。
- 保留 ${previewCount} 个项目专属 GIF；其余代码优先条目使用有明确标签的抽象占位图，不拿无关素材冒充项目效果。
- GIF 总体积从 **27.28 MiB 压缩到 15.81 MiB**，减少 42.03%；720×450 尺寸、帧数、帧率和时长保持不变。
- 新增 GitHub Pages 静态发布工作流。

## 收录与去重规则

1. 效果必须能出现在普通网页中：动画、转场、绘制、2D/3D 渲染、指针响应或媒体展示。
2. 仓库必须公开且可以核验。Stars 是 **${snapshotDate}** 的快照，不是实时计数器。
3. 相似库只有在代表性可见结果或集成模型存在实质差异时才同时保留。
4. 重复候选中优先较新、持续维护、文档清楚的方案；只有交互范式仍然独特时才保留较旧但未归档的项目，并标注“经典旧版”。
5. 最小代码只展示最小而有用的 API 调用，不复制完整脚手架应用。

## 分类概览

${categorySummary('zh')}

## 项目目录

${projectTables('zh')}

## Demo

Demo 只使用静态 HTML、CSS、JavaScript 模块和 GIF，无第三方运行依赖。它支持搜索、分类筛选、排序、中英文切换、项目直达锚点和代码复制。

\`\`\`bash
python3 -m http.server 4173 --directory demo
\`\`\`

打开 [http://localhost:4173](http://localhost:4173)。目录使用 ES Module，因此需要本地 HTTP 服务，不能直接双击文件运行。

## GIF 压缩

从原始 GIF 运行可复现的压缩脚本：

\`\`\`bash
./scripts/optimize-gifs.sh
\`\`\`

脚本使用自适应 128 色调色板、Bayer 抖动与差异矩形编码。只有候选文件更小时才替换源文件，并强制核验尺寸、时长、帧率与帧数。调色板缩减属于感知压缩；如果以后需要重新编码，应在优化输出之外保留原始素材。

## GitHub Pages

可以。Demo 完全静态且只使用相对路径，适合 GitHub Pages。仓库内工作流会在推送到 \`main\` 后发布 \`demo/\`，也支持手动运行。首次部署前需要在 **Settings → Pages → Source** 选择 **GitHub Actions**。详见 [中文部署说明](docs/GITHUB_PAGES.zh-CN.md)。

预计地址：[${liveDemo}](${liveDemo})

## 维护目录

- 修改唯一数据源 \`demo/data/projects.js\`。
- 运行 \`node scripts/build-docs.mjs\` 同步生成两份 README。
- 提交前运行 \`node scripts/validate.mjs\`。
- 始终区分真实项目 GIF 与代码优先占位图。

GIF 与项目名称仅用于研究、索引和比较，权利归各自作者所有。
`;

await Promise.all([
  writeFile(resolve(root, 'README.md'), english),
  writeFile(resolve(root, 'README.zh-CN.md'), chinese)
]);

console.log(`Generated bilingual docs for ${projects.length} projects (${newCount} new).`);
