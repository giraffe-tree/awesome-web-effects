# Demo 扩容架构审计与实施建议

审计日期：2026-07-18
审计范围：`demo/preview-demos/`、`preview-manifest.json`、真实 GIF 捕获、provenance、准入评分、发布目录、文档构建、真实性审计、静态校验与 UI 自动化测试。
目标：在不降低真实预览门禁的前提下，支持 20–30 个彼此可一眼区分的新增 Demo。

## 结论

现有链路已经具备三个很好的基础：

1. 每个本地 Demo 都通过 `window.__PREVIEW_META__` 声明效果、实现与渲染表面，并可用 `window.__setPreviewTime()` 进入确定性时刻。
2. 捕获器会检查运行错误、实现元数据、真实 DOM/SVG/Canvas/WebGL 表面、帧差异，再生成固定 320×180 GIF。
3. 发布门禁把效果、评分、GIF、Demo、provenance 和 README 连在一起，并对完全重复和感知近重复预览进行阻断。

当前结构可以安全承载约 8 个新增 Demo；直接一次增加 20–30 个时，最容易出问题的不是渲染性能，而是下列人工同步点：

- Demo ID 同时硬编码在 `vite.config.js`、`preview-manifest.json`、`effects.js`、`demo-admission.js`、provenance、UI 测试和审计文档中。
- 捕获宽高、帧率和时长是全局命令参数，无法表达拖拽、第三次悬停、滚动阈值、视频接力等不同交互脚本。
- provenance 只记录 HTML 入口，没有完整列出实际执行的 JS、局部媒体、深度图等资产。
- AI 官网观察、开源实现与本地 Demo 的关系在文本上可理解，但机器可读字段还不足以阻止把“观察网站”误写成“实现来源”。
- `validate.mjs`、`build-docs.mjs` 和 UI 测试包含日期、242/15 等固定数字，下一轮扩容会产生大量脆弱修改。

最稳妥的执行方式是：先做 8 个无新依赖、无外部媒体、可完全确定性驱动的代表 Demo；通过运行态、GIF、并排视觉和评分复核后，再扩到 16 个；最后才处理视频、深度图、鱼群避障等高风险效果。不要一次性生成 20–30 个“同底图换运动”的页面。

## 现有数据流

```text
独立 HTML + 独立 JS + pinned npm dependency
                 │
                 ├─ Vite 多入口构建 → demo/preview-demos/dist/
                 │
preview-manifest ┴─ capture-real-preview-gifs.py
                               │
                               ├─ 运行时元数据/表面/断言/帧变化
                               └─ demo/gifs/captured/<effect-id>.gif

effects.js + demo-admission.js + provenance.json
                 │
                 ├─ audit-preview-authenticity.mjs
                 ├─ validate.mjs
                 ├─ build-docs.mjs → README / README.zh-CN
                 └─ demo/index.html + test-demo-catalog-ui.py
```

发布效果不是一个 HTML 文件，而是一个必须同时完成的原子工作单元：

- 语义化 effect ID 和中英文名称；
- 推荐实现项目与最小代码；
- AI 官网观察证据（如果有），并明确它不是实现归属；
- 独立 HTML、独立 JS、必要的本地资产；
- manifest 捕获配置；
- 真实 GIF；
- provenance；
- 六维评分和审计结论；
- 静态发布页和双语文档。

任何一项缺失，都应留在研究审计中，不得进入 `effects.js`。

## 扩容前应做的架构调整

### 1. 让 preview manifest 成为构建与捕获的唯一 Demo 清单

`vite.config.js` 当前再次硬编码 13 个 ID。建议读取 `preview-manifest.json` 生成 Rollup inputs，并在构建开始前检查：

- ID 唯一且为 kebab-case；
- `demoSourcePath` 与 ID 同名；
- HTML、入口 JS 和声明资产存在；
- GIF 输出路径位于 `demo/gifs/captured/`；
- renderer、runtimeAssertion 和 capture 均显式声明。

这只是统一元数据，不共享或生成视觉场景。每个效果仍必须拥有独立 HTML 与独立 JS。

建议 manifest 升级为 schema 2：

```json
{
  "schemaVersion": 2,
  "defaults": {
    "viewport": { "width": 320, "height": 180, "deviceScaleFactor": 1 },
    "fps": 12,
    "duration": 3,
    "clock": "manual"
  },
  "demos": [
    {
      "id": "type-select-replace-prompt-loop",
      "library": "gsap@3.15.0",
      "renderer": "dom",
      "runtimeAssertion": true,
      "mechanismSelector": "[data-preview-mechanism='type-select-replace']",
      "demoSourcePath": "preview-demos/type-select-replace-prompt-loop.html",
      "sourcePaths": [
        "preview-demos/type-select-replace-prompt-loop.html",
        "preview-demos/src/type-select-replace-prompt-loop.js"
      ],
      "assetPaths": [],
      "gifPath": "gifs/captured/type-select-replace-prompt-loop.gif",
      "capture": { "driver": "manual-time" }
    }
  ]
}
```

新文件约定使用 `src/<effect-id>.js`。现有命名无需立刻全量重命名，避免无价值 churn，但 provenance 应准确记录实际路径。

### 2. 把“时间推进”和“真实输入”拆开

当前 `__setPreviewTime()` 很适合确定性动画，但复杂交互不能全靠 Demo 内部伪造鼠标事件。建议 controller 增加可选协议：

- `__setPreviewTime(seconds)`：控制纯时间、视频 currentTime、滚动进度对应的动画状态；
- `__applyPreviewInput(input)`：接收标准化 pointer、wheel、drag、click、key 输入；
- `__PREVIEW_RUNTIME_ASSERT__()`：必须证明声明的库/API 与核心机制确实在运行；
- `__PREVIEW_STATE__()`：可选返回当前阶段、悬停计数、视频片段索引等，用于捕获断言。

manifest 的 `capture.driver` 建议限定为少量可审计类型：

- `manual-time`：生成艺术、自动场景、文本/布局编排；
- `pointer-path`：高光、裁切角、磁性与光标类；
- `scroll-progress`：滚动擦洗、阈值页头、固定场景；
- `drag-path`：鱼群生成、拖拽卡片；
- `interaction-sequence`：点击、第三次悬停、键盘编辑；
- `media-timeline`：本地视频片段按固定 currentTime 接力。

捕获脚本应执行 Playwright 的真实 `mouse.move/down/up`、`wheel`、`keyboard` 或 DOM scroll，而不是只调 CSS 状态；每帧仍以手动时间固定结果。如此既有真实输入，也有可复现输出。

### 3. 每个 Demo 使用独立 Page，补齐运行失败信号

当前脚本在同一个 page 上循环，并在每个 Demo 追加一个 `pageerror` listener。扩到 30 个时会累积监听器，旧 listener 也会继续接收后续页面错误。建议每个 Demo 新建 page，捕获完立即关闭，并同时阻断：

- `pageerror`；
- `console.error`；
- `requestfailed`；
- 同源关键资源的 HTTP 4xx/5xx；
- readiness 超时；
- 视频未达到 `loadeddata`、字体未 ready、图片未 `decode()`、WebGL context lost。

另外应修正三点：

- manifest 为空时给出明确错误，不能访问 `demos[0]`；
- 实际输出应尊重并校验 `gifPath`，不应总是自行拼接 `<id>.gif`；
- `renderer`、`runtimeAssertion` 对新 Demo 必填；DOM 表面除存在 selector 外，还应检查其尺寸与可见性。

### 4. provenance 升级到完整源码与资产追踪

建议 schema 2 至少增加：

- `sourcePaths`：HTML、执行 JS、局部 CSS；
- `assetRecords`：每个本地图片、深度图、视频、字体的来源、作者/生成方式、许可依据和 hash；
- `captureManifestPath` 与 `captureConfigDigest`；
- `captureCommand`；
- `observationEvidenceRefs`：指向 AI 官网研究记录，而不是把官网写成 Demo origin；
- `reviewedAt` 与视觉复核状态。

关系必须保持：

```text
效果（用户看见的行为）
├─ 推荐实现：GitHub 项目 / pinned 包（source.projectId、originUrl）
├─ 本地证明：独立 Demo + GIF + provenance
└─ 观察证据：AI 官网 + verifiedAt + evidenceRef（related party / research）
```

本地 Demo 的 `originUrl` 继续指向实际使用的开源实现项目；AI 官网只进入 observation/research 字段。不能为了关联灵感来源，把 AI 官网标成开源实现。

### 5. 让观察证据机器可校验

现有 `relatedParties` 只有 name、url、observedAs；建议新增 `evidenceRef`，引用四份 100 站研究包中的稳定段落或一个新的结构化 observation ID。`effect.research` 建议改为：

```js
research: {
  verifiedAt: '2026-07-18',
  difference: '与目录现有主体行为的去重说明……',
  observations: [{
    id: 'granola-type-select-replace',
    siteName: 'Granola',
    siteUrl: 'https://www.granola.ai/',
    evidenceKind: 'site-source',
    evidenceRef: 'research/ai-native-homepages-batch-d.md#...'
  }]
}
```

validator 应检查 `relatedParties` 与 observations 一一对应、每种效果最多 3 家、验证日期不晚于 snapshot；无法定位证据的观察关系不显示。

### 6. 去掉审计日期和数量的硬编码

下列内容应由 `admissionAuditSummary` 或单一 release manifest 驱动：

- `validate.mjs` 中固定读取 `demo-admission-audit-2026-07-17.md`；
- 对“242、214、15”的固定文本断言；
- `build-docs.mjs` 中固定审计链接和文字；
- UI 测试中的 `to_have_count(15)` 和 13 个 ID 清单；
- `addedIn` 的固定枚举及只对 `2026-effect-expansion` 执行 research 校验。

建议 summary 新增 `auditPath`、`sourceSiteCount`、`previousCandidateCount`、`newCandidateCount`、`reviewedPreviewCount`、`admittedCount`、`rejectedCount`。UI 测试可先用 Node 动态 import `effects.js` 输出发布 ID 和本地 Demo ID，再在 Playwright 中逐项断言，避免每扩一次就手改测试。

### 7. 确定性与视觉去重再加一层

现有跨效果 GIF 感知去重值得保留。扩容后再增加：

- `--determinism-check`：同一 Demo 捕获两次，比较 8 帧归一化感知签名；GPU 输出允许极小容差，不要求 GIF 字节完全相同；
- 固定随机种子、像素比、字体、locale、timezone、颜色方案和 reduced-motion；
- 噪声/粒子效果禁止 `Math.random()` 未播种；
- 视频以 `currentTime` seek 驱动并等待 `seeked`，不能依赖实时播放时钟；
- 新旧条目生成 contact sheet，人工并排验收首帧、发展、峰值、复位四个时刻；
- 每个 GIF 继续限制 320×180、≤3 秒、≤1 MiB；高噪声场景可在 manifest 中降低到 64 色，但不能通过过度压缩掩盖缺陷。

## 现有依赖与适用效果

| 依赖 | 最适合的新增效果 | 不应承担的效果 |
| --- | --- | --- |
| GSAP + ScrollTrigger | 文档生成擦洗、阈值页头、场景换幕、片段接力、文字擦写、曲线路径文字 | 高粒子量鱼群、真实 shader 溶解 |
| Motion | 元数据到 CTA 换位、错位按钮、历史悬停徽章、媒体轨选择、Agent 光标 | 深度图转场、复杂 GPU 粒子 |
| Anime.js | 四角裁切标记、延迟扫光、多图表启动、轻量分层 DOM 编排 | 视频时钟、DOM/GPU 同步 |
| p5.js | 多层星空、DOM 避障鱼群、2D 环境氛围、确定性生成图形 | HTML 文本选区语义、视频接力 |
| regl | 大规模星空/鱼群、深度或噪声驱动的 GPU 场 | 普通卡片和按钮微交互 |
| Curtains.js | 深度图溶解、视频氛围、DOM 绑定媒体 shader | 无媒体的普通布局动效 |
| KUTE.js / Vivus | SVG 形状或路径本身确实是主体的效果 | DOM 文本替换、通用按钮动画 |
| Theatre.js | 有多层镜头、明确关键姿态且需要统一 playhead 的场景 | 单一 hover、简单阈值切换 |
| Isotope / VanillaTilt / Mo.js | 仅在新效果的核心机制确实是重排、倾斜材质或粒子爆发时使用 | 为了复用依赖而牵强套用 |

20–30 个扩容不需要先增加新 npm 依赖。先用现有 12 个 pinned runtime，可以降低供应链、版本和构建风险。如果 GitHub 调研最终选中某个实现，其核心 API 无法由现有实现诚实代表，再单独引入，并同时核验版本、维护状态与许可。

## 推荐实施批次

### 批次 A：8 个先行样本（最稳妥）

这些效果不需要新依赖或外部媒体，且能覆盖文字、指针、布局、滚动、Canvas 和多层场景，最适合先验证扩容架构。

| 效果 | 推荐实现 | 捕获驱动 | 选择理由 |
| --- | --- | --- | --- |
| 输入—选中—替换提示词循环 | GSAP | manual-time / interaction-sequence | 文本选择、替换和光标阶段清楚，和现有打字类不重复 |
| 圆点擦除并写入标题 | GSAP | manual-time | 视觉签名很强，缩略图仍可识别 |
| 曲线文字传送带 | GSAP + SVG textPath | manual-time | 曲线路径与循环运动主体明确 |
| 正反方向错位 CTA | Motion | pointer-path | 小体量但交互结果清楚，可做高完成度材质 |
| 卡片元数据到 CTA 角色交换 | Motion | pointer-path | 同位置角色换位区别于普通 hover 放大 |
| 四角悬停裁切标记 | Anime.js | pointer-path | 四角时序和框选语义可一眼辨认 |
| 多层同步场景换幕 | GSAP | interaction-sequence | 背景、遮罩、文案、标签需同一时间线协作 |
| 滚动联动多层星空 | p5.js | scroll-progress | 多层视差可用固定种子完整复现 |

批次 A 的验收点：8 个页面必须在主体构图、触发方式和运动轨迹上互不相似；运行 Demo 与 GIF 逐项比对；评分不足 80 或任一核心维度不达标的条目不进入发布目录。

### 批次 B：再增加 8 个中等复杂度效果

- 滚动控制文档生成（GSAP + ScrollTrigger）；
- 自动反色固定导航（GSAP/ScrollTrigger，真实跨明暗 section）；
- 延迟下拉宣传扫光（Anime.js）；
- 依次启动多图表面板（Anime.js，图表用独立 SVG，不使用假截图）；
- 记忆悬停次数的招聘徽章（Motion，真实第三次 hover 输入）；
- 自主 Agent 光标星座（Motion，固定路径但每个 cursor 独立状态）；
- 防抖动滚动阈值页头（GSAP/ScrollTrigger，断言上下阈值不同）；
- 悬停预演视频风格轨（Motion + 仓库内许可清楚的小型 MP4）。

批次 B 开始前必须完成 manifest schema、动态 Vite inputs、动态 UI 测试和逐 Demo page 隔离，否则人工同步成本会迅速上升。

### 批次 C：5–8 个高风险效果

- 深度图分层模糊溶解（Curtains.js 或 regl，本地原图与深度图必须有资产记录）；
- 模糊自动播放视频氛围（Curtains.js，本地视频与 foreground/background 同源）；
- 设备轮廓蒙版视频（真实 `<video>` + CSS mask，不能拿静态渐变冒充视频）；
- 按片段时长接力的首屏影片（真实多个本地片段、preload 和交叉淡化）；
- 拖拽生成、DOM 避障鱼群（p5.js，真实 drag 输入和障碍碰撞断言）；
- 悬停预演媒体轨的更完整版本（如果批次 B 的小样未达到艺术分则不发布）；
- 经过 GitHub 候选池去重后最强的 2 个 WebGL/Canvas 项目效果。

高风险项必须先单独做一个端到端样本。深度图、视频或鱼群任一首个样本没有通过 GIF 体积、确定性和视觉评分，就不要批量继续同类效果。

## 每个新增 Demo 的独立性规则

- 每个效果必须有自己的主体构图和核心行为代码；共享范围只限 reset、字体、controller、错误协议和捕获基础设施。
- 禁止用同一组卡片仅替换颜色、标题或轨迹参数来制造多个效果。
- 新效果必须写出四元签名：trigger、visual response、timing、page layer，并与全部已入选项比较。
- AI 网站视觉只作为被观察的交互机制，不复制品牌素材、文案或受版权保护的媒体。
- 局部资产放在 `preview-demos/assets/<effect-id>/`；远程 URL 不得成为发布 Demo 的必要运行条件。
- 新 Demo 内置 reduced-motion fallback、可见焦点和键盘/触控等价路径；GIF 捕获 no-preference 状态，但运行页本身仍须可访问。

## 需要更新的文件与测试

架构层：

- `demo/preview-demos/preview-manifest.json`：schema 2、sourcePaths、assets、capture driver；
- `demo/preview-demos/vite.config.js`：由 manifest 派生 inputs；
- `demo/preview-demos/shared.js`：输入协议、状态断言、capture mode；
- `scripts/capture-real-preview-gifs.py`：逐 Demo page、分项配置、真实输入、资源错误、确定性模式；
- `scripts/audit-preview-authenticity.mjs`：schema 2 provenance、源码/资产、manifest 一致性、重复与确定性报告；
- `demo/gifs/provenance.json`：schema 2。

发布与审计层：

- `demo/data/effects.js`：只增加最终入选效果；
- `demo/data/demo-admission.js`：新分数、版本与动态审计摘要；
- 新的带日期候选与准入审计：记录 100 个来源、去重、未实现、未通过和已入选项；
- `scripts/validate.mjs`：动态审计路径、release tag、observation evidence、manifest/目录/GIF 一致性；
- `scripts/build-docs.mjs`：从 summary 生成新数字和审计链接；
- `scripts/test-demo-catalog-ui.py`：动态读取 catalog IDs，随机抽查之外还应逐项检查真实预览链接存在；
- `demo/preview-demos/README.md`：列出所有 Demo 的核心机制、运行时和捕获 driver。

建议增加两个小测试：

1. `scripts/test-preview-manifest.mjs`：不启动浏览器，快速检查 ID、源文件、依赖版本、输出路径和 Vite inputs；
2. `scripts/build-preview-contact-sheet.py`：为人工评审生成起始/发展/峰值/复位四帧 contact sheet，文件仅作为审计产物，不进入目录卡片。

## 完整门禁顺序

1. 调研证据入研究包，建立四元效果签名并与现有发布集去重。
2. 先实现独立 Demo，不写入 `effects.js`。
3. 构建并只捕获当前小批次；检查 runtime assertion、资源错误、真实输入和 GIF 体积。
4. 打开运行 Demo 与 GIF，做四帧和相邻项并排视觉检查。
5. 六维打分；低于 80 或核心维度失败则留在拒绝审计并删除发布资产。
6. 仅对通过项写入 effects、score、provenance 和发布审计。
7. 重建文档，运行 authenticity audit、validate、UI 测试、`git diff --check`。
8. 全量再捕获只用于验证可复现性；不要在最后一步才第一次发现单个 Demo 不稳定。

## 最终建议

本轮承诺“研究 100 个来源”，不应等同于“强行发布 100 个效果”。在当前评分与真实性规则下，最稳妥目标是先发布批次 A 的 8 个；若全部通过，再发布批次 B，使本轮新增达到最多 16 个。批次 C 只纳入真正通过资产、确定性、感知去重和 80 分门槛的条目，因此合理总量是 16–24 个，而不是预先保证 30 个。

若时间只允许一个实现批次，优先做批次 A。它能验证所有关键架构改动，视觉类型分散、没有新供应链依赖，也不会因为视频许可、远程资源或 GPU 差异拖垮整次发布。
