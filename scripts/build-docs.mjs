#!/usr/bin/env node

import { stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { categories, effects, featuredEffectIds, projects, snapshotDate } from '../demo/data/effects.js';
import { admissionAuditSummary, admissionPolicy } from '../demo/data/demo-admission.js';
import { getOneLineAgentPrompt } from '../demo/data/agent-prompts.js';
import { getMessages, supportedLocales } from '../demo/data/locales.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const liveDemo = 'https://giraffe-tree.github.io/awesome-web-effects/';
const projectById = new Map(projects.map(project => [project.id, project]));
const sources = effects.flatMap(effect => effect.sources);
const officialPreviewCount = sources.filter(source => source.previewKind === 'official-capture' && source.preview).length;
const localDemoPreviewCount = sources.filter(source => source.previewKind === 'local-demo-capture' && source.preview).length;
const verifiedPreviewCount = officialPreviewCount + localDemoPreviewCount;
const unavailablePreviewCount = sources.filter(source => source.previewKind === 'unavailable').length;
const multiEffectProjectCount = projects.filter(project => effects.filter(effect => effect.sources.some(source => source.projectId === project.id)).length > 1).length;
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
  const locale = supportedLocales.find(item => item.code === (isZh ? 'zh-Hans' : 'en'));
  const headers = isZh
    ? '| 分类 | 效果数 | 来源项目 | 关注结果 |\n| --- | ---: | ---: | --- |'
    : '| Category | Effects | Source projects | Visible result |\n| --- | ---: | ---: | --- |';
  const rows = categories.map(category => {
    const categoryEffects = effects.filter(effect => effect.category === category.id);
    const sourceCount = new Set(categoryEffects.flatMap(effect => effect.sources.map(source => source.projectId))).size;
    return `| [${isZh ? category.labelZh : category.label}](${siteUrlFor(locale)}#catalog) | ${categoryEffects.length} | ${sourceCount} | ${isZh ? category.descriptionZh : category.description} |`;
  });
  return [headers, ...rows].join('\n');
}

function effectTables(language) {
  const isZh = language === 'zh';
  const locale = supportedLocales.find(item => item.code === (isZh ? 'zh-Hans' : 'en'));
  return categories.map(category => {
    const rows = effects.filter(effect => effect.category === category.id).map(effect => {
      const source = recommendedSource(effect);
      const project = projectById.get(source.projectId);
      const status = project.legacy ? (isZh ? '经典旧版' : 'Legacy') : (isZh ? '当前推荐' : 'Recommended');
      const name = isZh ? effect.nameZh : effect.name;
      const effectUrl = `${siteUrlFor(locale)}#${encodeURIComponent(effect.id)}`;
      return `| [${name}](${effectUrl}) | [${project.name}](${project.url}) | **${effect.admission.total}/100** | ${relatedPartyLinks(effect)} | ${formatStars(project.stars)} | ${effect.sources.length} | ${status} | [${isZh ? '评分 + 代码 + 提示词' : 'Score + code + prompt'}](${effectUrl}) |`;
    });
    const heading = isZh ? category.labelZh : category.label;
    const description = isZh ? category.descriptionZh : category.description;
    const headers = isZh
      ? '| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |\n| --- | --- | ---: | --- | ---: | ---: | --- | --- |'
      : '| Effect | Recommended implementation | Curatorial score | AI homepage references (max 3) | Stars | Implementations | Status | Implementation |\n| --- | --- | ---: | --- | ---: | ---: | --- | --- |';
    return `<a id="${category.id}"></a>\n\n### ${heading}\n\n${description}\n\n${headers}\n${rows.join('\n')}`;
  }).join('\n\n');
}

const showcaseIds = featuredEffectIds;
const categoryById = new Map(categories.map(category => [category.id, category]));
const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function visualShowcase(language) {
  const isZh = language === 'zh-Hans';
  const locale = supportedLocales.find(item => item.code === language) || supportedLocales[0];
  const cards = showcaseIds.map(id => {
    const effect = effects.find(item => item.id === id);
    if (!effect) throw new Error(`Missing README showcase effect: ${id}`);
    const source = recommendedSource(effect);
    if (!source.preview) throw new Error(`README showcase effect has no preview: ${id}`);
    const category = categoryById.get(effect.category);
    const name = isZh ? effect.nameZh : effect.name;
    const label = isZh ? category.labelZh : category.label;
    return [
      `<td width="33%" align="center">`,
      `<a href="${siteUrlFor(locale)}#${effect.id}"><img src="demo/gifs/${source.preview}.gif" width="270" alt="${escapeHtml(name)}"></a>`,
      `<br>`,
      `<sub><strong>${escapeHtml(name)}</strong><br>${escapeHtml(label)} · ${effect.admission.total}/100</sub>`,
      `</td>`,
    ].join('\n');
  });
  const rows = [];
  for (let index = 0; index < cards.length; index += 3) {
    rows.push(`<tr>\n${cards.slice(index, index + 3).join('\n')}\n</tr>`);
  }
  return `<table>\n${rows.join('\n')}\n</table>`;
}

function metricTable(cells) {
  return `<table>\n<tr>\n${cells.join('\n')}\n</tr>\n</table>`;
}

function metricStrip(language) {
  const isZh = language === 'zh';
  const labels = isZh
    ? ['入选效果', '真实 GIF', '可运行 Demo', '最低准入分']
    : ['admitted effects', 'real GIFs', 'runnable demos', 'minimum score'];
  const values = [effects.length, verifiedPreviewCount, localDemoPreviewCount, `${admissionPolicy.threshold}/100`];
  return metricTable(values.map((value, index) => `<td width="25%" align="center"><strong>${value}</strong><br><sub>${labels[index]}</sub></td>`));
}

const readmeFilename = locale => locale.code === 'en' ? 'README.md' : `README.${locale.code}.md`;
const siteUrlFor = locale => `${liveDemo}?lang=${encodeURIComponent(locale.code)}`;

function languageNavigation(fromDocs = false) {
  const prefix = fromDocs ? '../' : '';
  return supportedLocales.map(locale => `[${locale.nativeName}](${prefix}${readmeFilename(locale)})`).join(' · ');
}

function badgeStrip() {
  const repoUrl = 'https://github.com/giraffe-tree/awesome-web-effects';
  return [
    `[![${effects.length} curated effects](https://img.shields.io/badge/curated_effects-${effects.length}-0969da?style=flat-square)](${liveDemo})`,
    `[![${verifiedPreviewCount} real GIF previews](https://img.shields.io/badge/real_GIF_previews-${verifiedPreviewCount}-0969da?style=flat-square)](${liveDemo})`,
    `[![GitHub stars](https://img.shields.io/github/stars/giraffe-tree/awesome-web-effects?style=flat-square&color=0969da)](${repoUrl}/stargazers)`,
  ].join('\n');
}

function heroBlock({ kicker, tagline, links }) {
  return `<div align="center">

# Awesome Web Effects

**${escapeHtml(kicker)}**

${escapeHtml(tagline)}

${badgeStrip()}

${links}

<sub>${languageNavigation()}</sub>

</div>`;
}

function communityGroupInvite({ label, alt }) {
  return `<p align="center"><strong>${escapeHtml(label)}</strong></p>

<p align="center"><img src="docs/assets/awesome-web-effects-wechat-group.jpg" width="420" alt="${escapeHtml(alt)}"></p>`;
}

function featureStrip(steps, centered = false) {
  const align = centered ? ' align="center"' : '';
  return metricTable(steps.map(([title, copy]) => `<td width="33%"${align}><strong>${escapeHtml(title)}</strong><br><sub>${escapeHtml(copy)}</sub></td>`));
}

const centeredFooter = text => `---\n\n<p align="center"><sub>${escapeHtml(text)}</sub></p>`;

function localizedMetricStrip(locale) {
  const t = getMessages(locale.code);
  const labels = [t.effects, t.gifs, t.previewLocal, t.curatorialScore];
  const values = [effects.length, verifiedPreviewCount, localDemoPreviewCount, `${admissionPolicy.threshold}/100`];
  return metricTable(values.map((value, index) => `<td width="25%" align="center"><strong>${value}</strong><br><sub>${escapeHtml(labels[index])}</sub></td>`));
}

function agentQuickStart(locale) {
  const t = getMessages(locale.code);
  const isEnglish = locale.code === 'en';
  const isChinese = locale.code === 'zh-Hans';
  const title = isEnglish
    ? 'Use with any coding agent in one prompt'
    : isChinese
      ? '一句话交给任意编程 Agent'
      : t.promptTitle;
  const copy = isEnglish
    ? 'No skill or installation is required. Copy this single sentence into Codex, Claude Code, or another coding agent while your target project is open.'
    : isChinese
      ? '无需 Skill 或安装；在目标项目中打开 Codex、Claude Code 或其他编程 Agent，点击代码块右上角复制按钮并粘贴发送。'
      : t.promptCopy;
  const action = isEnglish
    ? 'Copy the one-line prompt on the live site'
    : isChinese
      ? '在在线目录一键复制这句话'
      : t.copyPrompt;

  return `<a id="agent-quick-start"></a>

## ${escapeHtml(title)}

${escapeHtml(copy)}

\`\`\`text
${getOneLineAgentPrompt(locale.code)}
\`\`\`

<p align="center"><a href="${siteUrlFor(locale)}#agent-prompt"><strong>${escapeHtml(action)} →</strong></a></p>`;
}

function localizedReadme(locale) {
  const t = getMessages(locale.code);
  const siteUrl = siteUrlFor(locale);
  return `${heroBlock({
    kicker: t.kicker,
    tagline: t.hero,
    links: `[**${escapeHtml(t.browse)} →**](${siteUrl}) · [Language metadata / 语言资料](docs/LANGUAGES.md)`,
  })}

---

<h3 align="center">${featuredEffectIds.length} ${escapeHtml(t.gifs)} / ${effects.length} ${escapeHtml(t.effects)}</h3>

${visualShowcase(locale.code)}

${agentQuickStart(locale)}

## ${escapeHtml(t.section)}

${escapeHtml(t.catalogTitle)}

${localizedMetricStrip(locale)}

${featureStrip([[t.visualTitle, t.visualCopy], [t.codeTitle, t.codeCopy], [t.promptTitle, t.promptCopy]])}

## ${escapeHtml(t.codeTitle)}

${escapeHtml(t.codeCopy)}

\`\`\`bash
python3 -m http.server 4173 --directory demo
\`\`\`

- [${escapeHtml(t.browse)}](${siteUrl})
- [${escapeHtml(t.repo)}](https://github.com/giraffe-tree/awesome-web-effects)
- [${escapeHtml(t.viewReference)}](README.md)
- [Language metadata / 语言资料](docs/LANGUAGES.md)

${centeredFooter(t.footer)}
`;
}

function languageSupportDocument() {
  const header = '| # | Language / 语言 | Native name / 本地名称 | Total speakers (L1 + L2) | README | Site locale | Direction |\n| ---: | --- | --- | ---: | --- | --- | --- |';
  const rows = supportedLocales.map(locale => `| ${locale.rank} | ${locale.englishName} / ${locale.chineseName} | ${locale.nativeName} | ${formatStars(locale.speakersMillions)}M | [${readmeFilename(locale)}](../${readmeFilename(locale)}) | [\`${locale.code}\`](${siteUrlFor(locale)}) | ${locale.dir.toUpperCase()} |`);
  return `# Supported languages / 支持语言

${languageNavigation(true)}

The website UI and README entry points support the following 20 locales. The 150 effect names, behavior fields, code samples, and agent prompts remain canonical English technical content, with authored Simplified Chinese names shown where available.

网站界面与 README 入口支持以下 20 种 locale。150 个效果的名称、行为字段、代码示例和 Agent Prompt 仍以规范英文技术内容为准，已有简体中文名称时会同时显示。

${header}
${rows.join('\n')}

## Method / 统计口径

The ranking uses the individual-language, total-speaker (L1 + L2) method from [Ethnologue 200 (2026, 29th edition)](https://shop.ethnologue.com/products/2026-ethnologue-200), cross-checked against the [complete total-speaker table](https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers). Counts are estimates; multilingual people appear in more than one language, Mandarin is not all Chinese varieties combined, and Modern Standard Arabic and Egyptian Arabic are counted separately.

排名采用 [Ethnologue 200（2026，第 29 版）](https://shop.ethnologue.com/products/2026-ethnologue-200) 的单一语言总使用者（L1 + L2）口径，并通过[完整总使用者排名](https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers)交叉核对。人数为估计值；多语者会在不同语言中重复计数，普通话不等于全部汉语，现代标准阿拉伯语与埃及阿拉伯语也分开统计。

## Compatibility / 兼容性

- URL: \`?lang=<locale>\`; explicit URL selection overrides local storage and browser language.
- RTL: \`ar\`, \`ur\`, and \`arz\` set \`dir="rtl"\`.
- Code, repository paths, and effect keys remain isolated left-to-right.
- URL：\`?lang=<locale>\`；显式 URL 选择优先于本地存储和浏览器语言。
- RTL：\`ar\`、\`ur\`、\`arz\` 使用 \`dir="rtl"\`。
- 代码、仓库路径和效果 Key 保持从左到右隔离显示。
`;
}

const english = `${heroBlock({
  kicker: 'See the interaction. Learn its name. Copy the code or agent prompt.',
  tagline: 'A visual atlas for the moment when you know the feeling you want, but not the words to describe the effect.',
  links: `[**Open the live visual catalog**](${siteUrlFor(supportedLocales[0])}) · [Language metadata](docs/LANGUAGES.md)`,
})}

${communityGroupInvite({
  label: 'Join the AwesomeWebEffects WeChat user group',
  alt: 'QR code for the AwesomeWebEffects WeChat user group',
})}

---

<h3 align="center">${featuredEffectIds.length} recommended effects — every preview a real capture</h3>

${visualShowcase('en')}

<p align="center"><a href="${siteUrlFor(supportedLocales[0])}"><strong>Explore all ${effects.length} live effects →</strong></a></p>

${agentQuickStart(supportedLocales[0])}

## See it. Name it. Build it.

${metricStrip('en')}

${featureStrip([
  ['① Find by sight', 'Scan real motion instead of guessing library names.'],
  ['② Open the effect', 'Check the score, source, behavior and minimal implementation.'],
  ['③ Ship the idea', 'Copy code or a scoped prompt for Codex / Claude Code.'],
], true)}

This is an **effect-first**, curator-reviewed reference—not another repository list. Every published item has visible evidence, a score of at least **${admissionPolicy.threshold}/100**, provenance, reusable code and a runnable or official preview.

## Browse by visual family

${categorySummary('en')}

<details>
<summary><strong>Open the complete ${effects.length}-effect index</strong> — implementation, score, source and direct link</summary>

${effectTables('en')}

</details>

<details>
<summary><strong>Why the catalog is effect-first</strong></summary>

- **Effect is the catalog key.** Search, anchors, categories and examples begin with what the user sees—not the repository name.
- **Projects are implementation sources.** One project may power several distinct effects; ${multiEffectProjectCount} source projects currently demonstrate this relation.
- **Alternatives stay together.** Multiple implementations belong inside one effect instead of duplicating rows.
- **Deduplication is visual and behavioral.** Candidates are compared by trigger, visible change, timing and page layer.

</details>

<details>
<summary><strong>Curation, provenance and audit numbers</strong></summary>

- ${admissionAuditSummary.candidateCount} candidates audited: **${effects.length} admitted**, **${admissionAuditSummary.rejectedCount} rejected**.
- ${verifiedPreviewCount} verified previews: ${officialPreviewCount} official captures and ${localDemoPreviewCount} captures from runnable local demos; ${unavailablePreviewCount} missing.
- Human review scores creativity, art direction, motion craft, legibility, creative transfer and evidence quality.
- Admission requires ${admissionPolicy.threshold}/100 plus core-dimension minimums. Popularity never overrides the gate.
- The verified GIF set is ${previewMiB} MiB; every preview is 320×180, at most three seconds and below 1 MiB.
- Stars are a ${snapshotDate} snapshot. Recommendation sources and observed AI homepages remain separate relationships.

Read the [current ${admissionAuditSummary.candidateCount}-candidate admission audit](research/demo-admission-audit-${admissionAuditSummary.auditedAt}.md), the [100-company homepage research](research/ai-native-homepages-100.md), and the [preview provenance manifest](demo/gifs/provenance.json).

</details>

## Run the visual catalog locally

The demo is dependency-free static HTML, CSS, JavaScript modules, and verified GIF assets. It supports 20 localized UI locales, effect search, category filtering, score sorting, stable effect anchors, visible score breakdowns, real mobile previews, expandable source details, copyable minimal code, and one-click prompts for coding agents.

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

- Add only curator-approved records to \`demo/data/effects.js\`; rejected candidates belong in the dated admission audit, not the release catalog.
- Store the score and six dimension values on every published effect and update \`demo/data/demo-admission.js\` when the policy changes.
- Keep \`effect.id\` semantic and stable; never derive it from a repository name.
- Reusing a project across effects is valid. Add alternative implementations to an effect's \`sources\` array.
- Keep snippets and previews on the source relation, not on the project or effect root.
- Run \`node scripts/build-docs.mjs\` to regenerate all localized README files and the language metadata document.
- Run \`node scripts/validate.mjs\` before committing.

${centeredFooter('GIFs and project names are used for research, indexing, and comparison. Rights remain with their respective authors.')}
`;

const chinese = `${heroBlock({
  kicker: '先看见效果，再知道它叫什么，最后复制代码或 Agent 提示词。',
  tagline: '当你脑中已经有想要的感觉，却不知道如何描述特效时，这里就是一张可直接观看的 Web 交互图鉴。',
  links: `[**打开在线视觉目录**](${siteUrlFor(supportedLocales[1])}) · [语言资料](docs/LANGUAGES.md)`,
})}

${communityGroupInvite({
  label: '微信扫码加入 AwesomeWebEffects 用户交流群',
  alt: 'AwesomeWebEffects 微信用户交流群二维码',
})}

---

<h3 align="center">${featuredEffectIds.length} 个推荐效果 · 每个预览都是真实录制</h3>

${visualShowcase('zh-Hans')}

<p align="center"><a href="${siteUrlFor(supportedLocales[1])}"><strong>查看全部 ${effects.length} 个实时效果 →</strong></a></p>

${agentQuickStart(supportedLocales[1])}

## 看见它、叫出它、实现它

${metricStrip('zh')}

${featureStrip([
  ['① 用眼睛找', '直接浏览真实动效，不必先猜库名或技术术语。'],
  ['② 点开效果', '查看评分、来源、行为拆解和最小实现。'],
  ['③ 带走方案', '复制代码，或把完整提示词交给 Codex / Claude Code。'],
], true)}

这不是另一份仓库名称列表，而是一个**效果优先、经过人工策展评分**的视觉参考库。每个入选条目都有真实证据、不低于 **${admissionPolicy.threshold}/100** 的评分、可追溯来源、可复用代码，以及本地可运行或官方预览。

## 按视觉类型浏览

${categorySummary('zh')}

<details>
<summary><strong>展开完整 ${effects.length} 项效果索引</strong> — 实现、评分、来源与直达链接</summary>

${effectTables('zh')}

</details>

<details>
<summary><strong>为什么以“效果”而不是仓库为主</strong></summary>

- **效果是目录主键。** 搜索、锚点、分类和示例都从用户真正看见的交互出发。
- **项目只是实现来源。** 一个项目可以实现多种效果；当前有 ${multiEffectProjectCount} 个来源项目明确展示这种关系。
- **替代实现放在一起。** 同一种效果的不同实现进入同一条目，不复制效果行。
- **去重依据视觉和行为。** 候选按触发、可见变化、时间关系与页面层级比较。

</details>

<details>
<summary><strong>评分、来源与审计数据</strong></summary>

- 已审计 ${admissionAuditSummary.candidateCount} 个候选：**${effects.length} 个入选**，**${admissionAuditSummary.rejectedCount} 个拒绝**。
- ${verifiedPreviewCount} 个已核验预览：${officialPreviewCount} 个官方素材、${localDemoPreviewCount} 个可运行本地 Demo 录制；缺失数为 ${unavailablePreviewCount}。
- 人工评审覆盖创意、艺术完成度、动效编排、效果辨识、创作迁移和证据质量。
- 准入要求 ${admissionPolicy.threshold}/100，并同时通过核心维度最低分；流行度不能覆盖质量门槛。
- 已核验 GIF 总计 ${previewMiB} MiB；每个预览为 320×180、最长三秒且小于 1 MiB。
- Stars 是 ${snapshotDate} 快照；“推荐实现”与“在哪家 AI 官网观察到”始终是两种关系。

继续阅读 [${admissionAuditSummary.candidateCount} 个候选的准入审计](research/demo-admission-audit-${admissionAuditSummary.auditedAt}.md)、[100 家 AI 公司主页特效调研](research/ai-native-homepages-100.md)与[预览来源清单](demo/gifs/provenance.json)。

</details>

## 在本地运行视觉目录

Demo 只使用静态 HTML、CSS、JavaScript 模块和已核验 GIF，无第三方运行依赖。它支持 20 种本地化界面、效果搜索、分类筛选、按评分排序、稳定效果锚点、评分维度明细、移动端真实预览、展开来源详情、代码复制和 Agent 提示词一键复制。

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

- 只有通过策展准入的记录才能加入 \`demo/data/effects.js\`；被拒候选只保留在带日期的审计文档中，不能进入发布目录。
- 每个发布效果必须保存总分与六个维度分；评分体系变化时同步更新 \`demo/data/demo-admission.js\`。
- \`effect.id\` 必须语义化且保持稳定，禁止从仓库名派生。
- 同一项目可被多个效果复用；替代实现加入效果的 \`sources\` 数组。
- 代码与预览必须放在来源关系上，不能放到项目或效果根节点。
- 运行 \`node scripts/build-docs.mjs\` 同步生成全部本地化 README 与语言资料文件。
- 提交前运行 \`node scripts/validate.mjs\`。

${centeredFooter('GIF 与项目名称仅用于研究、索引和比较，权利归各自作者所有。')}
`;

const readmeWrites = supportedLocales.map(locale => {
  const content = locale.code === 'en' ? english : locale.code === 'zh-Hans' ? chinese : localizedReadme(locale);
  return writeFile(resolve(root, readmeFilename(locale)), content);
});

await Promise.all([
  ...readmeWrites,
  writeFile(resolve(root, 'docs', 'LANGUAGES.md'), languageSupportDocument()),
  writeFile(resolve(root, 'README.zh-CN.md'), '# 简体中文 README 已迁移\n\n[打开简体中文 README](README.zh-Hans.md)\n')
]);

console.log(`Generated ${supportedLocales.length} localized README files, language metadata, and the zh-CN compatibility pointer for ${effects.length} effects and ${projects.length} source projects.`);
