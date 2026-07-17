# 100 家 AI 公司主页特效调研

调研日期：2026-07-17

## 先说结论

这次一共检查了 **100 家 AI 原生公司的官方网站**，没有重复公司。

- 原目录已有：221 种网页特效
- 这次发现并加入：21 种真正不同的新特效
- 更新后共有：242 种网页特效
- 每种特效都有：中英文名称、GIF 预览、最小实现代码和可交给编程 Agent 的提示词
- 已把 117 条官网观察关系放回原目录的 68 个特效行，覆盖 94 家公司；一种特效最多列 3 家代表公司

很多网站看起来很炫，但实际使用的是相同套路，例如自动播放视频、Logo 跑马灯、卡片悬停放大、普通轮播和滚动淡入。这些效果已经在目录里存在，所以没有重复加入。

## 现在怎样和原目录放在一起

主目录不再把“100 家公司调研”只当成一篇独立文章。现在每个相关特效行会同时显示两种关系：

- **推荐实现**：真正提供代码的开源项目，例如 GSAP、Motion、D3。
- **AI 官网参考**：我们在哪些公司主页观察到这种效果，例如 Anthropic、Suno、Groq。

README 和在线 Demo 都会把这两种关系放在同一行；每种特效最多展示 3 家代表公司，避免一行被相同套路的网站挤满。完整的 100 家观察仍保留在本报告中。

目前有 6 家没有强行挂到某个特效行：OpenAI、Perplexity、Midjourney 和 Weights & Biases 没有取得足以确认交互行为的运行证据；Kaiber 与 tl;dv 只观察到较宽泛的常见视频/轮播模式，无法在不降低语义准确度的前提下对应到某一个现有特效。它们仍属于已检查的 100 家样本，只是不伪造目录关系。

## 最值得看的 21 种新特效

下面的“看到什么”只讲视觉结果，不使用复杂技术术语。英文名称保留在括号中，方便以后搜索代码。

| # | 中文名称 | 来源网站 | 你会看到什么 |
| ---: | --- | --- | --- |
| 1 | 深度图分层模糊溶解（Depth-map ordered blur dissolve） | Black Forest Labs | 两张图片切换时，不是整张一起淡出，而是根据画面远近，一层一层地模糊、消失，空间感很强。 |
| 2 | 滚动联动多层星空（Scroll-linked multilayer starfield drift） | Fathom | 页面滚动时，近处和远处的星星以不同速度移动，形成有纵深的星空。 |
| 3 | 曲线文字传送带（Infinite curved text-path conveyor） | Wispr Flow | 文字不是沿直线滚动，而是沿一条弯曲的路径不断流动。 |
| 4 | 滚动控制文档生成（Scroll-scrubbed document generation playback） | Granola | 向下滚动时，文档逐行生成，内部页面也会滚动，光标跟着生成位置移动。 |
| 5 | 输入—选中—替换提示词循环（Type-select-replace prompt loop） | Granola | 先自动输入一句话，再像真实编辑一样选中它，然后换成另一句话。 |
| 6 | 设备轮廓蒙版视频（Device-silhouette masked autoplay video） | Pika | 视频只显示在手机或设备的轮廓里面，看起来像产品真的在设备中运行。 |
| 7 | 自动反色的固定导航（Self-inverting fixed navigation） | Luma AI | 导航栏经过深色和浅色区域时，会自动反色，始终保持清楚可见。 |
| 8 | 延迟出现的下拉菜单彩色扫光（Delayed dropdown promo sweep） | Glean | 打开下拉菜单后，宣传卡片不会立刻动，而是稍等一下再出现一条彩色扫光。 |
| 9 | 卡片四角裁切标记（Four-corner hover crop marks） | Cognition | 鼠标移到图片卡片上时，四个角出现像设计软件裁切框一样的标记。 |
| 10 | 按片段时长接力的首屏影片（Duration-aware layered hero film handoff） | Kling AI | 多段首屏视频按照各自时长接力播放，在切换前才加载下一段，并短暂交叉淡化。 |
| 11 | 模糊视频氛围背景（Blurred autoplay video ambience） | Replicate | 把正在播放的视频放大并重度模糊，让视频颜色变成会流动的环境光。 |
| 12 | 防抖动的滚动页头改色（Hysteretic scroll-threshold header restyle） | LlamaIndex | 滚动到一定距离后页头换色；向上滚动时要越过另一个位置才恢复，因此不会在边界来回闪。 |
| 13 | 卡片信息切换成行动按钮（Card metadata-to-CTA role swap） | Together AI | 悬停前显示作者等说明，悬停后说明退出，同一位置换成“阅读更多”按钮。 |
| 14 | 正反方向错位的按钮（Opposed diagonal offset CTA） | Unstructured | 悬停时按钮正面向左上移动，彩色底层向右下移动；按下时两层重新合在一起。 |
| 15 | 依次启动的多图表面板（Staggered multi-chart telemetry boot） | Pinecone | 多个图表不是同时出现，而是加载完成一个就画出一个，像控制台逐步上线。 |
| 16 | 拖拽生成、会绕开按钮的鱼群（Drag-spawned DOM-aware fish flock） | Sakana AI | 拖动鼠标可以增加小鱼；鱼群会预测前方路线，并主动绕开页面上的按钮。 |
| 17 | 记得悬停次数的招聘徽章（Interaction-history hiring badge） | Clay | 前两次悬停只晃动，第三次会改成一句更直接的招聘文案，像网站记住了你的行为。 |
| 18 | 圆点擦除并写入标题（Traveling-dot headline eraser-writer） | PolyAI | 一个圆点经过文字时擦掉旧词，再从另一边经过并写出新词。 |
| 19 | 多层同步场景切换（Synchronized scenario scene handoff） | Vapi | 选择另一个场景后，背景视频、遮罩、正文和立体标签会配合完成一次完整换幕。 |
| 20 | 悬停预演的视频风格轨（Hover-rehearsed video style rail） | Captions | 悬停只临时播放预览，移开就暂停并回到开头；点击才正式选中并把它移到中间。 |
| 21 | 自主移动的 Agent 光标（Autonomous agent-cursor constellation） | InVideo | 多个带名字的光标在首屏不同位置独立漂浮，用来表现多个 Agent 正在同时协作。 |

## 按使用场景快速选择

如果要给自己的产品找灵感，可以先从这里选：

- **想让首屏更有氛围**：深度图分层模糊、模糊视频氛围背景、多层星空、分段影片接力。
- **想把产品演示讲清楚**：滚动控制文档生成、输入—选中—替换、依次启动的多图表、视频风格预演。
- **想让按钮和卡片更精致**：四角裁切标记、信息切换成行动按钮、正反错位按钮、第三次悬停改文案。
- **想表现 AI 或多 Agent 的感觉**：自主 Agent 光标、会绕开页面按钮的鱼群、多层同步场景切换。
- **想做不一样的文字效果**：曲线文字传送带、圆点擦写标题。

## 调研的 100 家公司

| A 组 | B 组 | C 组 | D 组 |
| --- | --- | --- | --- |
| OpenAI | Cohere | Groq | Photoroom |
| Anthropic | Mistral AI | Cerebras | Leonardo AI |
| Perplexity | Sakana AI | Together AI | Krea |
| Midjourney | Google DeepMind | Fireworks AI | Magnific |
| Runway | Poolside | Replicate | Black Forest Labs |
| ElevenLabs | Writer | Baseten | Recraft |
| Suno | Jasper | Modal | Playground |
| Pika | Copy.ai | fal.ai | Kaiber |
| Luma AI | Typeface | Hugging Face | Udio |
| Synthesia | Hebbia | Scale AI | AIVA |
| HeyGen | Augment Code | Labelbox | SOUNDRAW |
| Character.AI | Lindy | Snorkel AI | D-ID |
| Harvey | Clay | Weights & Biases | Mem |
| Glean | Decagon | Arize AI | Granola |
| Sierra | Factory | LangChain | Scenario |
| Cognition | PolyAI | LlamaIndex | Otter.ai |
| Cursor（Anysphere） | Bland AI | Pinecone | Fireflies.ai |
| Replit | Vapi | Weaviate | Read AI |
| Lovable | Retell AI | Qdrant | Fathom |
| Higgsfield | Hume AI | Chroma | tl;dv |
| Manus | Tavus | Unstructured | Wispr Flow |
| Gamma | Captions | Langfuse | Krisp |
| Kling AI | Descript | Helicone | Speechify |
| Ideogram | OpusClip | Braintrust | Akool |
| Stability AI | InVideo | Galileo | Meshy |

## 我们怎样判断“这是一种新特效”

不能只看使用了什么库，也不能只看颜色和文案。我们会同时比较四件事：

1. **什么时候触发**：加载、滚动、悬停、点击，还是第三次悬停才触发。
2. **画面怎样变化**：移动、模糊、替换、逐层出现，还是多部分一起换场。
3. **变化的顺序和速度**：同时发生、依次发生，还是有意延迟。
4. **影响页面的哪一层**：背景、文字、卡片、导航、视频，还是多个层一起变化。

只有这四项组合在原来的 221 种效果中不存在，才会加入新目录。

## 调研限制

这次原计划使用应用内浏览器逐站操作，但共享浏览器运行环境在打开网页前就报错，重置后仍然失败。因此改用较保守的检查办法：

- 阅读官方网站页面内容；
- 检查官网返回的 HTML 和 CSS；
- 必要时检查网站自己的 JavaScript，确认触发方式和动画时间；
- 只有能找到明确证据的效果，才加入 21 种新特效；
- 只凭截图猜测、无法确认怎样触发的效果，一律不加入。

所以这份报告适合用来找**有实现证据的交互灵感**，不等同于对 100 个网站进行逐帧视觉评分。

## 证据明细

下面四份文件保留了每家公司更详细的观察记录、去重理由和部分实现代码。内容较长，并夹有英文技术字段；一般阅读上面的中文总览即可。

| 批次 | 网站数 | 新特效数 | 明细 |
| --- | ---: | ---: | --- |
| A | 25 | 5 | [查看 A 组证据](./ai-native-homepages-batch-a.md) |
| B | 25 | 6 | [查看 B 组证据](./ai-native-homepages-batch-b.md) |
| C | 25 | 5 | [查看 C 组证据](./ai-native-homepages-batch-c.md) |
| D | 25 | 5 | [查看 D 组证据](./ai-native-homepages-batch-d.md) |
| **总计** | **100** | **21** | 已检查公司名称，没有跨批次重复。 |
