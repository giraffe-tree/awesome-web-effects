# Awesome Web Effects

[English (default)](README.md) · [在线 Demo](https://giraffe-tree.github.io/awesome-web-effects/)

一个**以效果为先、经过策展评分**的开源 Web 交互图鉴。当前发布 **7 个有效分类中的 15 种效果**，背后有 **14 个来源项目**。每个发布条目都有真实预览和不低于 **80/100** 的明确评分，并提供可复制的最小代码与可一键交给 Codex 或 Claude Code 的实现提示词。

## 效果优先模型

- **效果是目录主键。** 锚点、搜索结果、行、分类与代码示例都从用户看得见的交互出发，而不是从仓库出发。
- **项目是实现来源。** 一个项目可以实现多种不同效果；当前种子目录已有 1 个来源项目明确展示这种关系。
- **一种效果可以有多个实现。** 每个来源关系拥有自己的最小代码和预览状态，因此替代方案可以放在同一行中比较，不必复制效果行。
- **去重发生在可见效果层。** 候选按触发方式、视觉变化、时间关系和页面层级比较；更新、维护更好、文档更清楚的实现成为推荐来源。

## 目录快照

- 已审计 242 个候选；**15 个通过**，**227 个已从发布目录移除**。
- 15 行入选效果，其中 8 种为基线效果。
- 最近一次效果级扩展独立调研并新增 0 种效果。
- 14 个唯一 GitHub 来源项目；2026 扩展阶段新增 7 个。
- 15 个与具体来源对应的真实 GIF：2 个官方素材捕获，13 个来自可运行本地 Demo 的录制。
- 发布目录中有 0 个来源关系缺少已核验预览；准入门禁要求该数字始终为零。
- 15 份一键实现提示词，每种效果都有一份。
- 已把 7 条有证据的 AI 官网参考整合进 4 个原有特效行，共覆盖 7 家公司；每种特效最多展示 3 家代表公司。
- 2 个较旧但仍有参考价值的来源标记为“经典旧版”；不包含已归档仓库。
- Stars 是 **2026-07-17** 的快照，不是实时计数器。
- 已核验 GIF 优化后总计 **3.56 MiB**；每个发布预览均为 320×180、最长三秒且小于 1 MiB。

“推荐实现”和“在哪家公司官网观察到”是两种不同关系，现在会在同一个特效行中同时展示。先阅读 [Demo 准入评分体系与 242 个候选的完整审计](research/demo-admission-audit-2026-07-17.md)。完整官网观察记录见 [100 家 AI 公司主页特效调研](research/ai-native-homepages-100.md)。

## 收录与去重规则

1. 每一行必须有可核验的真实预览，并只描述一种能在普通网页中呈现的可见交互效果。
2. 人工评审按创意（20）、艺术完成度（20）、动效编排（20）、效果辨识（15）、创作迁移（15）、证据质量（10）评分。
3. 准入必须达到 80/100，并通过核心维度最低分；项目知名度和分类空缺不能降低门槛。
4. 每种效果必须有稳定的中英文名称、语义化效果 ID、分类和至少一个可核验来源。
5. 每种效果必须且只能有一个推荐来源；替代实现应加入同一行，不能复制效果。
6. 被拒绝的记录只可留在可追溯的候选审计数据中，不得进入网站、README 目录或发布资产集。

## 分类概览

| 分类 | 效果数 | 来源项目 | 关注结果 |
| --- | ---: | ---: | --- |
| [动画与编排](#animation) | 6 | 6 | 时间线、弹簧、补间、类动画与框架原生动效。 |
| [滚动与揭示](#scroll) | 1 | 1 | 平滑滚动、滚动关联场景、进入揭示、视差与整屏吸附。 |
| [页面与布局](#transition) | 1 | 1 | 页面转场、FLIP 动画、筛选、紧密排布与布局重排。 |
| [指针与悬停](#pointer) | 3 | 3 | 倾斜、景深、自定义光标、磁性运动与图像扭曲。 |
| [文本与 SVG](#vector) | 1 | 1 | 打字、文字拆分、矢量绘制、手写与 SVG 变形。 |
| [Canvas 与 2D](#canvas) | 1 | 1 | 场景图、创意编程、物理、绘图工具与 2D 渲染器。 |
| [3D 与 WebGL](#webgl) | 2 | 2 | 3D 引擎、声明式渲染器、着色器图层与后期处理。 |

## 效果目录

<a id="animation"></a>

### 动画与编排

时间线、弹簧、补间、类动画与框架原生动效。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [滚动擦洗主时间线](https://giraffe-tree.github.io/awesome-web-effects/#scroll-scrubbed-master-timeline) | [GSAP](https://github.com/greensock/GSAP) | **85/100** | [Hebbia](https://www.hebbia.com/)<br>[Decagon](https://decagon.ai/) | 26,600 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#scroll-scrubbed-master-timeline) |
| [共享布局弹簧变形](https://giraffe-tree.github.io/awesome-web-effects/#shared-layout-spring-morph) | [Motion](https://github.com/motiondivision/motion) | **94/100** | — | 32,819 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#shared-layout-spring-morph) |
| [交错变换编排](https://giraffe-tree.github.io/awesome-web-effects/#staggered-transform-choreography) | [Anime.js](https://github.com/juliangarnier/anime) | **92/100** | [Factory](https://factory.ai/)<br>[Read AI](https://www.read.ai/)<br>[Cursor (Anysphere)](https://cursor.com/) | 71,056 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#staggered-transform-choreography) |
| [动态图形爆发](https://giraffe-tree.github.io/awesome-web-effects/#motion-graphics-burst) | [Mo.js](https://github.com/mojs/mojs) | **92/100** | — | 18,728 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#motion-graphics-burst) |
| [可视化编排关键帧序列](https://giraffe-tree.github.io/awesome-web-effects/#visually-authored-keyframe-sequence) | [Theatre.js](https://github.com/theatre-js/theatre) | **84/100** | — | 12,541 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#visually-authored-keyframe-sequence) |
| [轻量 SVG 形状补间](https://giraffe-tree.github.io/awesome-web-effects/#compact-svg-shape-tween) | [KUTE.js](https://github.com/thednp/kute.js) | **89/100** | — | 2,639 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#compact-svg-shape-tween) |

<a id="scroll"></a>

### 滚动与揭示

平滑滚动、滚动关联场景、进入揭示、视差与整屏吸附。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [固定式横向滚动场景](https://giraffe-tree.github.io/awesome-web-effects/#pinned-horizontal-scroll-scene) | [GSAP](https://github.com/greensock/GSAP) | **96/100** | — | 26,600 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#pinned-horizontal-scroll-scene) |

<a id="transition"></a>

### 页面与布局

页面转场、FLIP 动画、筛选、紧密排布与布局重排。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [可筛选网格重排](https://giraffe-tree.github.io/awesome-web-effects/#filterable-grid-reflow) | [Isotope](https://github.com/metafizzy/isotope) | **85/100** | [Ideogram](https://ideogram.ai/) | 11,103 | 1 | 经典旧版 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#filterable-grid-reflow) |

<a id="pointer"></a>

### 指针与悬停

倾斜、景深、自定义光标、磁性运动与图像扭曲。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [透视倾斜与高光](https://giraffe-tree.github.io/awesome-web-effects/#perspective-tilt-and-glare) | [vanilla-tilt.js](https://github.com/micku7zu/vanilla-tilt.js) | **90/100** | — | 4,019 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#perspective-tilt-and-glare) |
| [情境感知自定义光标](https://giraffe-tree.github.io/awesome-web-effects/#context-aware-custom-cursor) | [mouse-follower](https://github.com/Cuberto/mouse-follower) | **86/100** | — | 818 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#context-aware-custom-cursor) |
| [位移贴图图像悬停](https://giraffe-tree.github.io/awesome-web-effects/#displacement-map-image-hover) | [hover-effect](https://github.com/robin-dela/hover-effect) | **90/100** | — | 1,874 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#displacement-map-image-hover) |

<a id="vector"></a>

### 文本与 SVG

打字、文字拆分、矢量绘制、手写与 SVG 变形。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [SVG 描边绘制](https://giraffe-tree.github.io/awesome-web-effects/#svg-stroke-drawing) | [Vivus](https://github.com/maxwellito/vivus) | **86/100** | — | 15,479 | 1 | 经典旧版 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#svg-stroke-drawing) |

<a id="canvas"></a>

### Canvas 与 2D

场景图、创意编程、物理、绘图工具与 2D 渲染器。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [草图式创意编程循环](https://giraffe-tree.github.io/awesome-web-effects/#sketch-style-creative-coding-loop) | [p5.js](https://github.com/processing/p5.js) | **91/100** | [Hume AI](https://www.hume.ai/) | 23,797 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#sketch-style-creative-coding-loop) |

<a id="webgl"></a>

### 3D 与 WebGL

3D 引擎、声明式渲染器、着色器图层与后期处理。

| 效果 | 推荐实现 | 策展评分 | AI 官网参考（最多 3 家） | Stars | 实现数 | 状态 | 实现 |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| [GPU 实例化粒子涡旋](https://giraffe-tree.github.io/awesome-web-effects/#functional-webgl-draw-commands) | [regl](https://github.com/regl-project/regl) | **96/100** | — | 5,557 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#functional-webgl-draw-commands) |
| [DOM 绑定虹彩着色器平面](https://giraffe-tree.github.io/awesome-web-effects/#dom-synced-shader-planes) | [Curtains.js](https://github.com/martinlaxenaire/curtainsjs) | **94/100** | — | 1,823 | 1 | 当前推荐 | [评分 + 代码 + 提示词](https://giraffe-tree.github.io/awesome-web-effects/#dom-synced-shader-planes) |

## Demo

Demo 只使用静态 HTML、CSS、JavaScript 模块和已核验 GIF，无第三方运行依赖。它支持效果搜索、分类筛选、按评分排序、中英文切换、稳定效果锚点、评分维度明细、移动端真实预览、展开来源详情、代码复制和 Agent 提示词一键复制。

```bash
python3 -m http.server 4173 --directory demo
```

打开 [http://localhost:4173](http://localhost:4173)。目录使用 ES Module，因此需要本地 HTTP 服务，不能直接双击文件运行。

## 真实 GIF 录制与压缩

先在 `demo/preview-demos/` 编写可运行、可复用且确实使用对应实现的 HTML Demo，核验后录制真实浏览器输出，再规范化来源已核验的官方 GIF：

```bash
npm ci --prefix demo/preview-demos
npm run build --prefix demo/preview-demos
python3 scripts/capture-real-preview-gifs.py --built --skip-install
node scripts/normalize-gif-previews.mjs
```

录制步骤捕获真实本地 Demo，规范化步骤只处理来源已经核验的官方素材。验证器会检查来源状态、Demo 与 GIF 是否存在、内容哈希唯一性、尺寸、时长、帧数、可解码性和单文件大小预算。既没有可靠官方素材、也没有可运行录制 Demo 时，应保持“暂无真实预览”。

参见[预览真实性迁移报告](research/preview-authenticity-migration-2026-07-17.md)与机器可读的[预览来源清单](demo/gifs/provenance.json)。

## GitHub Pages

Demo 完全静态且只使用相对路径。仓库内工作流会在推送到 `main` 后发布 `demo/`，也支持手动运行。首次部署前需要在 **Settings → Pages → Source** 选择 **GitHub Actions**。详见 [中文部署说明](docs/GITHUB_PAGES.zh-CN.md)。

预计地址：[https://giraffe-tree.github.io/awesome-web-effects/](https://giraffe-tree.github.io/awesome-web-effects/)

## 维护目录

- 只有通过策展准入的记录才能加入 `demo/data/effects.js`；被拒候选只保留在带日期的审计文档中，不能进入发布目录。
- 每个发布效果必须保存总分与六个维度分；评分体系变化时同步更新 `demo/data/demo-admission.js`。
- `effect.id` 必须语义化且保持稳定，禁止从仓库名派生。
- 同一项目可被多个效果复用；替代实现加入效果的 `sources` 数组。
- 代码与预览必须放在来源关系上，不能放到项目或效果根节点。
- 运行 `node scripts/build-docs.mjs` 同步生成两份 README。
- 提交前运行 `node scripts/validate.mjs`。

GIF 与项目名称仅用于研究、索引和比较，权利归各自作者所有。
