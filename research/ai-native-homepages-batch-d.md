# AI-native homepage interaction research — batch D

- `checkedAt`: `2026-07-17`
- Valid samples: **25**
- Distinct candidates after comparison with the repository's 221-effect baseline: **5**
- Review surfaces: first fold/hero, scroll-linked markers, pointer/hover states, and the primary CTA or product-media control.

## Method, limitations, and replacements

The required in-app Browser workflow was attempted first after the complete `browser:control-in-app-browser` skill was read. Its shared runtime failed during bootstrap with `TypeError: Cannot redefine property: process`; a clean reset reproduced the same failure before a page could be controlled. This batch therefore uses the same conservative fallback as batches A–C: official-homepage web reads, direct official HTML/CSS fetches, and first-party JavaScript inspection for effects whose behavior needed exact confirmation.

An effect is treated as verified only when the delivered official source exposes the relevant media attribute, selector/state pair, keyframe, scroll controller, canvas, shader uniform, or event handler. Client-only behavior without a provable trigger-to-response path is marked `unverified` and is not promoted as a distinct candidate. This is source-backed interaction research rather than a pixel-perfect browser playback audit.

- **Limitless** was removed because it no longer provided an active independent AI-product homepage; **Scenario** replaced it.
- **Higgsfield** was moved to batch A during that batch's replacement audit, so **Akool** replaced it here to keep the 100-company set unique.

`duplicateWith221` compares the visible interaction contract — trigger, response, timing, and layer — rather than the implementation library.

## 1. Photoroom

- `company`: Photoroom
- `homepage URL`: https://www.photoroom.com/
- `checkedAt`: `2026-07-17`
- `coverage`: hero and product media confirmed; pointer/CTA states checked; deeper scroll choreography not promoted.
- `observedEffects`:
  - **Product before/after reveal / 产品前后对比揭示** — drag or automated divider exposes edited and original imagery in one frame; media layer; official homepage product examples and comparison controls; `duplicateWith221`: **yes — image comparison/reveal family**.
  - **Template-card hover lift / 模板卡片悬停抬升** — cards emphasize their media and action on hover; pointer layer; `duplicateWith221`: **yes — generic media-card hover**.

## 2. Leonardo AI

- `company`: Leonardo AI
- `homepage URL`: https://leonardo.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: hero, generated-media grid, CTA states, and autoplay markers checked.
- `observedEffects`:
  - **Autoplay creation mosaic / 自动播放创作马赛克** — generated images and short videos populate a dense responsive proof grid; continuous media; `duplicateWith221`: **yes — media mosaic/autoplay tile family**.
  - **Hover-revealed creation controls / 悬停显现创作控件** — card actions fade above imagery on interaction intent; `duplicateWith221`: **yes — hover media overlay**.

## 3. Krea

- `company`: Krea
- `homepage URL`: https://www.krea.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: first-fold creative surface and looping media confirmed; exact live-editor input coupling remained unverified.
- `observedEffects`:
  - **Realtime-generation showcase / 实时生成展示面板** — a prompt/editor composition is surrounded by changing generated output; runtime coupling `unverified`; not promoted.
  - **Looping creative-output rail / 循环创意输出轨** — output tiles move or cycle through media examples; `duplicateWith221`: **yes — carousel/marquee media rail**.

## 4. Magnific

- `company`: Magnific
- `homepage URL`: https://magnific.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: hero, comparison media, and CTA hover checked.
- `observedEffects`:
  - **High-resolution before/after scrubber / 高清前后对比拖杆** — a vertical handle reveals the enhanced image over its source; direct manipulation; `duplicateWith221`: **yes — comparison slider/reveal**.
  - **Hover-zoom proof cards / 悬停缩放效果卡** — image examples scale within clipped frames; `duplicateWith221`: **yes — inline image focus zoom**.

## 5. Black Forest Labs

- `company`: Black Forest Labs
- `homepage URL`: https://blackforestlabs.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: hero and first-party WebGL transition module inspected; CTA checked.
- `observedEffects`:
  - **Depth-map ordered blur dissolve / 深度图排序模糊溶解** — a depth texture orders which image regions blur and fade first, producing near/mid/far separation during the handoff; shader/media layer; official first-party JavaScript binds color and depth textures and drives progressive blur/fade uniforms; `duplicateWith221`: **no — promoted candidate D1**.
  - **Looping editorial model rail / 循环模型作品轨** — visual examples advance as media cards; `duplicateWith221`: **yes — media carousel**.

## 6. Recraft

- `company`: Recraft
- `homepage URL`: https://www.recraft.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: hero artwork, output gallery, and pointer states checked.
- `observedEffects`:
  - **Generated-asset masonry / 生成资产瀑布流** — mixed-ratio output cards form a responsive image field; `duplicateWith221`: **yes — masonry/reflow gallery**.
  - **Hover action veil / 悬停操作薄幕** — controls and a translucent surface appear over a creation card; `duplicateWith221`: **yes — hover overlay vocabulary**.

## 7. Playground

- `company`: Playground
- `homepage URL`: https://playground.com/
- `checkedAt`: `2026-07-17`
- `coverage`: hero, creation gallery, and CTA states checked; infinite-load behavior not promoted without an explicit controller.
- `observedEffects`:
  - **Dense generative gallery / 密集生成式画廊** — output tiles fill a continuously browsable media surface; `duplicateWith221`: **yes — responsive media grid**.
  - **Card-focus action reveal / 卡片聚焦操作显现** — hover/focus exposes per-image actions; `duplicateWith221`: **yes — card overlay**.

## 8. Kaiber

- `company`: Kaiber
- `homepage URL`: https://kaiber.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: first-fold films and primary CTA checked.
- `observedEffects`:
  - **Full-bleed generative film loop / 全屏生成影片循环** — muted looping video supplies the hero atmosphere beneath foreground copy; `duplicateWith221`: **yes — autoplay cinematic hero**.
  - **Video-card playback veil / 视频卡播放遮罩** — hover reveals playback affordance over generated-film tiles; `duplicateWith221`: **yes — media hover overlay**.

## 9. Udio

- `company`: Udio
- `homepage URL`: https://www.udio.com/
- `checkedAt`: `2026-07-17`
- `coverage`: audio cards, playback affordances, CTA, and scrolling list structure checked.
- `observedEffects`:
  - **Track-card play-state swap / 音轨卡播放态切换** — cover art, play/pause control, and progress state change together; `duplicateWith221`: **yes — media playback control family**.
  - **Horizontal music discovery rail / 横向音乐发现轨** — track cards form a drag/scroll rail; `duplicateWith221`: **yes — horizontal carousel**.

## 10. AIVA

- `company`: AIVA
- `homepage URL`: https://www.aiva.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: hero, product composer media, and primary CTA checked.
- `observedEffects`:
  - **Composition-player progress / 作曲播放器进度** — a music example exposes playback and a progressing timeline; `duplicateWith221`: **yes — audio player/progress visualization**.
  - **Scroll-revealed product panels / 滚动显现产品面板** — product illustrations enter with section scroll; exact trigger partly unverified, not promoted.

## 11. SOUNDRAW

- `company`: SOUNDRAW
- `homepage URL`: https://soundraw.io/
- `checkedAt`: `2026-07-17`
- `coverage`: player rows, waveform/equalizer visuals, and CTA states checked.
- `observedEffects`:
  - **Animated track equalizer / 动态音轨均衡器** — bars animate around the active sample's play state; `duplicateWith221`: **yes — audio spectrum/equalizer family**.
  - **Track-row action reveal / 音轨行操作显现** — secondary controls become visible on row hover; `duplicateWith221`: **yes — hover control reveal**.

## 12. D-ID

- `company`: D-ID
- `homepage URL`: https://www.d-id.com/
- `checkedAt`: `2026-07-17`
- `coverage`: talking-avatar hero media, CTA, and media-card states checked.
- `observedEffects`:
  - **Looping talking-avatar tiles / 循环说话头像磁贴** — muted videos continuously demonstrate generated presenters; `duplicateWith221`: **yes — looping media tiles**.
  - **Play-overlay scale reveal / 播放遮罩缩放显现** — a circular control appears over avatar media on hover; `duplicateWith221`: **yes — media overlay/scale**.

## 13. Mem

- `company`: Mem
- `homepage URL`: https://mem.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: editor mockups, CTA states, and product demonstration panels checked.
- `observedEffects`:
  - **AI editor response playback / AI 编辑器响应回放** — a staged note interface reveals generated content; exact state controller `unverified`; not promoted.
  - **Soft-focus interface stack / 柔焦界面叠层** — offset application cards create depth with blur/shadow; `duplicateWith221`: **yes — layered card choreography**.

## 14. Granola

- `company`: Granola
- `homepage URL`: https://www.granola.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: hero/product demo and the relevant first-party animation chunks inspected.
- `observedEffects`:
  - **Scroll-scrubbed document generation playback / 滚动擦洗式文档生成回放** — scroll position clips in generated rows, advances an internal document scroll, and moves a cursor through the note; scroll/media layer; official first-party code connects clip paths, `scrollTop`, row reveal progress, and cursor Y to one scroll timeline; `duplicateWith221`: **no — promoted candidate D2**.
  - **Type-select-replace prompt loop / 输入-选中-替换提示词循环** — characters type, the phrase becomes selected, then replacement copy types into the same slot with caret and spring chip state; `duplicateWith221`: **no — promoted candidate D3**.

## 15. Scenario

- `company`: Scenario
- `homepage URL`: https://www.scenario.com/
- `checkedAt`: `2026-07-17`
- `coverage`: hero, game-asset gallery, looping media, and CTA checked.
- `observedEffects`:
  - **Game-asset carousel / 游戏资产轮播** — generated characters and environments advance through a media rail; `duplicateWith221`: **yes — carousel/deck family**.
  - **Hover-zoom asset cards / 悬停缩放资产卡** — clipped artwork grows under hover controls; `duplicateWith221`: **yes — image zoom/overlay**.

## 16. Otter.ai

- `company`: Otter.ai
- `homepage URL`: https://otter.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: hero, transcript UI, CTA, and product media checked.
- `observedEffects`:
  - **Transcript-following audio progress / 跟随转写的音频进度** — playback position and highlighted transcript lines form a synchronized product demonstration; runtime coupling partly unverified; not promoted.
  - **Meeting-card reveal sequence / 会议卡片显现序列** — dashboard rows enter as a staged mockup; `duplicateWith221`: **yes — staggered entrance choreography**.

## 17. Fireflies.ai

- `company`: Fireflies.ai
- `homepage URL`: https://fireflies.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: product dashboard media, testimonial sections, and CTA states checked.
- `observedEffects`:
  - **Meeting-intelligence dashboard loop / 会议智能面板循环** — changing product screenshots or clips demonstrate summaries and analytics; `duplicateWith221`: **yes — product-media carousel**.
  - **Customer-logo marquee / 客户 Logo 跑马灯** — proof logos travel continuously; `duplicateWith221`: **yes — seamless logo-loop marquee**.

## 18. Read AI

- `company`: Read AI
- `homepage URL`: https://www.read.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: hero/product dashboard, media playback, and CTA checked.
- `observedEffects`:
  - **Meeting-score dashboard reveal / 会议评分面板显现** — analytics panels stage into a product composition; `duplicateWith221`: **yes — staggered dashboard entrance**.
  - **Autoplay explainer media / 自动播放讲解媒体** — muted product video runs in a framed section; `duplicateWith221`: **yes — looping product media**.

## 19. Fathom

- `company`: Fathom
- `homepage URL`: https://fathom.video/
- `checkedAt`: `2026-07-17`
- `coverage`: hero canvases, scroll controller, and CTA states inspected.
- `observedEffects`:
  - **Scroll-linked multilayer starfield drift / 滚动联动多层星场漂移** — three star canvases with different populations and radii drift at distinct rates as the page scrolls, creating parallax depth; background layer; official HTML exposes three canvases with counts `120`, `90`, and `60`, while first-party code binds them through GSAP ScrollTrigger; `duplicateWith221`: **no — promoted candidate D4**.
  - **Dashboard-card float / 面板卡片漂浮** — product cards gently offset around the hero; `duplicateWith221`: **yes — ambient floating choreography**.

## 20. tl;dv

- `company`: tl;dv
- `homepage URL`: https://tldv.io/
- `checkedAt`: `2026-07-17`
- `coverage`: hero, testimonial/media cards, primary CTA, and pointer states checked.
- `observedEffects`:
  - **Avatar testimonial rail / 头像客户证言轨** — customer media cards move through a horizontal sequence; `duplicateWith221`: **yes — testimonial carousel**.
  - **Hover-play demo cards / 悬停播放演示卡** — interaction intent activates media inside a card; exact reset semantics unverified; not promoted.

## 21. Wispr Flow

- `company`: Wispr Flow
- `homepage URL`: https://wisprflow.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: hero SVG, its native timeline, CTA, and surrounding content inspected.
- `observedEffects`:
  - **Infinite curved text-path conveyor / 无限曲线文字传送带** — repeated copy travels continuously along a curved SVG path instead of a straight marquee line; vector layer; official SVG uses `<textPath>` with native `<animate attributeName="x" dur="35s" values="-3300;0" repeatCount="indefinite">`; `duplicateWith221`: **no — promoted candidate D5**.
  - **Product-window float / 产品窗口漂浮** — interface panels softly shift around the hero; `duplicateWith221`: **yes — ambient card float**.

## 22. Krisp

- `company`: Krisp
- `homepage URL`: https://krisp.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: audio demonstration, product media, and CTA states checked.
- `observedEffects`:
  - **Noise-cancellation audio comparison / 降噪音频对比** — controls switch or scrub between untreated and cleaned audio; `duplicateWith221`: **yes — media comparison/audio control**.
  - **Waveform playback progress / 波形播放进度** — an active region advances across an audio visualization; `duplicateWith221`: **yes — scrubbable audio waveform**.

## 23. Speechify

- `company`: Speechify
- `homepage URL`: https://speechify.com/
- `checkedAt`: `2026-07-17`
- `coverage`: voice player, hero media, testimonial cards, and CTA checked.
- `observedEffects`:
  - **Voice-sample carousel / 声音样本轮播** — selectable voice cards change the active audio example; `duplicateWith221`: **yes — media carousel/player**.
  - **Autoplay product-film tiles / 自动播放产品影片磁贴** — muted demonstrations loop inside card frames; `duplicateWith221`: **yes — looping media tile**.

## 24. Akool

- `company`: Akool
- `homepage URL`: https://akool.com/
- `checkedAt`: `2026-07-17`
- `coverage`: hero, avatar/video product tiles, CTA, and pointer states checked.
- `observedEffects`:
  - **AI-avatar video mosaic / AI 头像视频马赛克** — multiple generated-person clips form a moving media showcase; `duplicateWith221`: **yes — autoplay media grid**.
  - **Hover-revealed product action / 悬停显现产品操作** — an action surface appears over media cards; `duplicateWith221`: **yes — media hover overlay**.

## 25. Meshy

- `company`: Meshy
- `homepage URL`: https://www.meshy.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: interactive model showcase, supporting media, and CTA checked.
- `observedEffects`:
  - **Orbitable generated 3D model / 可环绕生成式 3D 模型** — pointer drag rotates a product model in a contained viewer; `duplicateWith221`: **yes — orbit-controlled 3D product model**.
  - **Generated-model carousel / 生成模型轮播** — adjacent 3D examples or renders form a horizontal selector; `duplicateWith221`: **yes — carousel/model gallery**.

## Distinct candidate summary

| # | Candidate | Source company | Category | Why it survived the 221-effect comparison |
| ---: | --- | --- | --- | --- |
| 1 | Depth-map ordered blur dissolve | Black Forest Labs | Media / WebGL | Depth data orders the blur/fade handoff across near, middle, and far image regions. |
| 2 | Scroll-scrubbed document generation playback | Granola | Scroll / media | One scroll timeline coordinates row generation, internal document scrolling, clipping, and cursor position. |
| 3 | Type-select-replace prompt loop | Granola | Text / vector | The phrase cycles through typing, semantic selection, replacement, and spring-chip states rather than simple deletion. |
| 4 | Scroll-linked multilayer starfield drift | Fathom | Background / canvas | Three differently populated star canvases respond to scroll with separate depth rates. |
| 5 | Infinite curved text-path conveyor | Wispr Flow | SVG / vector | Copy moves natively along a curved path rather than translating a straight marquee strip. |
