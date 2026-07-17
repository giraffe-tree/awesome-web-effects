# AI-native homepage interaction research — batch C

- `checkedAt`: `2026-07-17`
- Requested companies: 25
- Valid samples: 25
- Unique candidates after comparison with the existing 221 effects: 5
- Existing-catalog reference: `demo/data/effects.js` at the checked commit

## Method and limitation

The in-app Browser workflow was attempted first, after reading the complete `browser:control-in-app-browser` skill. The shared browser runtime failed during initialization with `Cannot redefine property: process`, before any tab could be created. This batch therefore uses a conservative fallback: each official homepage was opened through the web reader, fetched directly as a 2026-07-17 HTML snapshot, and its first-party HTML/CSS/JS was inspected for explicit media attributes, selectors, event listeners, animation timing and state classes.

The four requested surfaces were checked as follows: the hero/first fold from the rendered document structure and hero media; scrolling only from explicit scroll listeners or reveal code; pointer/hover only from explicit `:hover`, `group-hover` or equivalent rules; and primary CTA from its element classes and state rules. A behavior that depended on client runtime but had no explicit trigger-to-response code in the snapshot is marked `unverified` and is not promoted as a unique candidate. This report does not claim pixel-level visual verification.

Humanloop was replaced. `https://humanloop.com/` returned HTTP 200 but its title is **“Humanloop joins Anthropic”**, so it is no longer treated as an active independent AI-native company sample. The same-category AI gateway/observability company **Helicone** replaces it. All 25 retained official homepages returned HTTP 200 and clearly describe an AI-native product or platform.

`duplicateWith221` is evaluated at the visible-effect level using trigger + visual response + timing + page layer, not by implementation library.

## 1. Groq

- `company`: Groq
- `homepage`: https://groq.com/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed from hero; scroll unverified; pointer confirmed from CSS; primary CTA checked.
- `observedEffects`:
  - `name`: **Seamless logo rail**; `nameZh`: **无缝 Logo 轨道**; `category`: `carousel`; `trigger`: page mount; `visualResponse`: duplicated customer logos translate horizontally without a visible seam; `timing`: continuous loop; `layer`: content/logo proof bar; `evidence`: the hero contains `LogoMarquee_logos-wrapper`, repeated Dropbox/Vercel/Chevron/Volkswagen/Canva/Robinhood/Riot/Workday sequences, and two lists with `animated animated--marquee`; `duplicateWith221`: **yes — `seamless-logo-loop-marquee`**.
  - `name`: **Continuous testimonial rail**; `nameZh`: **连续客户证言轨道**; `category`: `carousel`; `trigger`: page mount; `visualResponse`: testimonial cards move as an endless horizontal strip; `timing`: continuous loop; `layer`: customer-proof content; `evidence`: the homepage emits `Testimonials_testimonials__list ... animated animated--marquee-testimonials`; `duplicateWith221`: **yes — same visible marquee family as `seamless-logo-loop-marquee` (content differs, motion does not)**.

## 2. Cerebras

- `company`: Cerebras
- `homepage`: https://www.cerebras.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll unverified; pointer confirmed from Tailwind state rules; primary CTA checked.
- `observedEffects`:
  - `name`: **Active hero media swap**; `nameZh`: **首屏活跃媒体切换**; `category`: `media`; `trigger`: `unverified` (client state); `visualResponse`: one full-bleed Mux video is exposed while sibling videos are hidden; `timing`: `unverified`; `layer`: hero media; `evidence`: three hero `<video>` nodes share full-cover positioning, with one `aria-hidden="false"` and two `aria-hidden="true"`, each using a distinct Mux poster; `duplicateWith221`: **not promoted — trigger/timing could not be verified; visually closest to an ordinary carousel/media swap**.
  - `name`: **CTA color-state transition**; `nameZh`: **CTA 颜色状态过渡**; `category`: `pointer`; `trigger`: pointer hover/active; `visualResponse`: primary/secondary button background changes to explicit hover/active tokens; `timing`: color transition; `layer`: CTA; `evidence`: CTA classes include `transition-colors`, `pointer:hover:bg-primary-hover` and `active:bg-primary-active`; `duplicateWith221`: **yes — `reusable-css-hover-vocabulary`**.

## 3. Together AI

- `company`: Together AI
- `homepage`: https://www.together.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll behavior partly source-confirmed; pointer confirmed from inline CSS; primary CTA checked.
- `observedEffects`:
  - `name`: **Hover card media zoom**; `nameZh`: **悬停卡片媒体放大**; `category`: `pointer`; `trigger`: card/link hover or focus; `visualResponse`: the card image scales to `1.1`; `timing`: eased element transition; `layer`: card media; `evidence`: inline CSS declares `:is(a:hover,a:focus,[data-card]:hover) [data-transition="img-link"] { transform: scale(1.1) }`, and story-card images carry that attribute; `duplicateWith221`: **yes — `inline-image-focus-zoom`**.
  - `name`: **Grid-track accordion disclosure**; `nameZh`: **网格轨道手风琴展开**; `category`: `carousel`; `trigger`: accordion state change; `visualResponse`: content grows from collapsed grid rows to `1fr`, while the icon rotates 180 degrees; `timing`: `0.6s cubic-bezier(0.625,0.05,0,1)`; `layer`: inline content; `evidence`: `[data-accordion-content]` transitions `grid-template-rows`; the active state sets `1fr` and rotates `[data-accordion-icon]`; `duplicateWith221`: **yes — `spring-height-accordion-disclosure` at the visible-effect level**.
  - `name`: **Card metadata-to-CTA role swap**; `nameZh`: **卡片元数据到 CTA 角色互换**; `category`: `pointer`; `trigger`: `.research-card:hover`; `visualResponse`: authors fade out while an action button rises in and a background layer appears; `timing`: coordinated opacity/translate transition; `layer`: card content and background; `evidence`: explicit rules set `research-btn` to `opacity:1; transform:translateY(0%)`, `research-authors` to `opacity:0`, and `research-bg` to `opacity:1` under the same hover selector; `duplicateWith221`: **no — unique candidate C3**.

## 4. Fireworks AI

- `company`: Fireworks AI
- `homepage`: https://fireworks.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll-state header structure checked but runtime trigger unverified; pointer confirmed; primary CTA checked.
- `observedEffects`:
  - `name`: **Hover pulse wash in navigation**; `nameZh`: **导航悬停脉冲光洗**; `category`: `pointer`; `trigger`: navigation group hover; `visualResponse`: a hidden gradient wash fades in and pulses behind the label while the chevron moves right; `timing`: opacity `300ms` plus continuous pulse; `layer`: navigation overlay; `evidence`: dropdown items contain an inset `opacity-0 transition-opacity duration-300 group-hover/button:opacity-100` layer with `animate-pulse bg-gradient-to-r ...`; arrows use `group-hover:translate-x-1`; `duplicateWith221`: **yes — combination of `reusable-css-hover-vocabulary` and `animated-gradient-state-transitions`**.
  - `name`: **Scroll-state header shadow**; `nameZh`: **滚动态页头阴影**; `category`: `scroll`; `trigger`: `unverified` client scroll state; `visualResponse`: sticky header shadow/style changes when `data-scrolled` flips; `timing`: transition-shadow; `layer`: navigation; `evidence`: header is `sticky top-0 ... transition-shadow` with initial `data-scrolled="false"`; no state-changing listener was present in the fetched source; `duplicateWith221`: **not promoted — unverified**.

## 5. Replicate

- `company`: Replicate
- `homepage`: https://replicate.com/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold and autoplay media confirmed; scroll unverified; pointer confirmed; primary CTA checked.
- `observedEffects`:
  - `name`: **Blurred autoplay video ambience**; `nameZh`: **模糊自播视频氛围层**; `category`: `background`; `trigger`: page mount/media autoplay; `visualResponse`: a looping video is enlarged and heavily blurred into a moving color wash, then combined with a translucent multiply layer; `timing`: continuous media loop; `layer`: background behind foreground content; `evidence`: the first-fold source includes `goo-D3l17_Fq.mp4` with `autoPlay loop muted` and classes `absolute ... blur-3xl scale-110`, immediately followed by `mix-blend-multiply opacity-30`; `duplicateWith221`: **no — unique candidate C1**.
  - `name`: **Hover-only copy control reveal**; `nameZh`: **仅悬停显示复制控件**; `category`: `pointer`; `trigger`: code/media group hover; `visualResponse`: the copy button fades from transparent to opaque; `timing`: opacity transition; `layer`: card control overlay; `evidence`: wrapper classes are `absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity`; `duplicateWith221`: **yes — `reusable-css-hover-vocabulary`**.
  - `name`: **Looping model-output tiles**; `nameZh`: **循环模型输出磁贴**; `category`: `media`; `trigger`: page mount; `visualResponse`: multiple output videos continuously play inside cover-fit cards; `timing`: continuous loop; `layer`: model gallery; `evidence`: repeated `<video autoPlay muted loop playsInline slot="image" class="absolute inset-0 ... object-cover">`; `duplicateWith221`: **not catalog-worthy alone — ordinary autoplay media, while the distinctive blurred ambient treatment is separated above**.

## 6. Baseten

- `company`: Baseten
- `homepage`: https://www.baseten.co/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll unverified; pointer and CTA confirmed from class rules.
- `observedEffects`:
  - `name`: **Directional CTA arrow nudge**; `nameZh`: **方向式 CTA 箭头轻推**; `category`: `pointer`; `trigger`: CTA hover; `visualResponse`: arrow shifts right by 5px; `timing`: `150ms linear`; `layer`: CTA icon; `evidence`: announcement CTA arrow uses `transition-all duration-150 ease-linear ... group-hover:translate-x-[5px]`; `duplicateWith221`: **yes — `reusable-css-hover-vocabulary`**.
  - `name`: **Dropdown chevron half-turn**; `nameZh`: **下拉箭头半周旋转**; `category`: `pointer`; `trigger`: navbar-link hover; `visualResponse`: chevron rotates 180 degrees and changes color; `timing`: `236ms cubic-bezier(0.5,0.2,0.4,1)`; `layer`: navigation; `evidence`: classes encode `transition-[transform,color] ... group-hover/navbar-link:rotate-180`; `duplicateWith221`: **yes — `nested-menu-and-submenu-transition`**.

## 7. Modal

- `company`: Modal
- `homepage`: https://modal.com/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll unverified; pointer confirmed; CTA checked.
- `observedEffects`:
  - `name`: **Dual-direction logo ticker**; `nameZh`: **双向 Logo 滚动带**; `category`: `carousel`; `trigger`: page mount; `visualResponse`: duplicated logo rows auto-scroll in normal and reverse directions behind masks; `timing`: continuous; `layer`: social-proof content; `evidence`: page loads `HorizontalAutoScroll...css`; DOM contains `auto-scroll-container`, `content`, and `content-reverse`; `duplicateWith221`: **yes — `seamless-logo-loop-marquee`**.
  - `name`: **Selected-workload glow crossfade**; `nameZh`: **所选工作负载辉光交叉淡变**; `category`: `animation`; `trigger`: `unverified` workload selector state; `visualResponse`: one workload glow is opaque while sibling glows and stacked content panels are transparent; `timing`: `500ms` opacity transition; `layer`: feature selector/content; `evidence`: repeated `workload-glow ... transition-opacity duration-500` nodes have server states `opacity:1`/`0`, and overlapping content grids use the same duration with inactive `opacity-0`; `duplicateWith221`: **not promoted — state trigger unverified; closest to `adaptive-height-tab-panel-slide` plus `animated-gradient-state-transitions`**.
  - `name`: **CTA background wipe**; `nameZh`: **CTA 背景横向擦入**; `category`: `pointer`; `trigger`: group hover; `visualResponse`: a background pill expands from `scale-x-0` to `scale-x-100` while text color flips; `timing`: `150ms ease-out`; `layer`: CTA; `evidence`: CTA contains `origin-right scale-x-0 ... transition-transform ... group-hover:scale-x-100`; `duplicateWith221`: **yes — `approach-direction-overlay-entrance` / `reusable-css-hover-vocabulary`**.

## 8. fal.ai

- `company`: fal.ai
- `homepage`: https://fal.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll unverified; pointer and CTA confirmed; canvas runtime unverified.
- `observedEffects`:
  - `name`: **Delayed multistroke hero drawing**; `nameZh`: **延迟多笔画首屏绘制**; `category`: `vector`; `trigger`: document load; `visualResponse`: thick colored SVG strokes draw from zero to full length in a staggered sequence; `timing`: each `2s`, beginning at `1s` or `2s`; `layer`: hero decoration; `evidence`: inline `<animate attributeName="stroke-dasharray" from="0, 1000" to="1000, 0" dur="2s" begin="1s|2s">` appears on multiple paths; `duplicateWith221`: **yes — `svg-stroke-drawing` plus staggered timing**.
  - `name`: **Pixelated hero canvases**; `nameZh`: **像素化首屏画布**; `category`: `canvas`; `trigger`: `unverified`; `visualResponse`: three differently sized canvases render with intentionally pixelated sampling; `timing`: `unverified`; `layer`: hero decoration; `evidence`: the hero contains three canvases with `image-rendering:pixelated`, arranged as one vertical and two square panels; `duplicateWith221`: **not promoted — the canvas draw/update code was not recoverable from the snapshot**.

## 9. Hugging Face

- `company`: Hugging Face
- `homepage`: https://huggingface.co/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll unverified; pointer/CTA confirmed from classes.
- `observedEffects`:
  - `name`: **CTA beam widen and brighten**; `nameZh`: **CTA 光束扩宽增亮**; `category`: `pointer`; `trigger`: hero CTA group hover; `visualResponse`: a one-pixel light beam grows from width 20 to 24 and opacity 45% to 75%, while its diffuse glow brightens; `timing`: transition; `layer`: CTA decoration; `evidence`: hero CTA owns a gradient line `w-20 ... opacity-45 transition-opacity group-hover:w-24 group-hover:opacity-75` plus a blurred glow with hover color changes; `duplicateWith221`: **yes — `reusable-css-hover-vocabulary`**.
  - `name`: **Category-colored nav icons**; `nameZh`: **分类着色导航图标**; `category`: `pointer`; `trigger`: nav item hover; `visualResponse`: neutral icons turn indigo/red/blue/yellow according to destination; `timing`: immediate CSS state; `layer`: navigation; `evidence`: model/dataset/space links encode `group-hover:text-indigo-500`, `...red-500`, `...blue-500`, and yellow; `duplicateWith221`: **yes — `hover-hit-test-color-highlight` at the visible state-change level**.

## 10. Scale AI

- `company`: Scale AI
- `homepage`: https://scale.com/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; header/scroll runtime partly unverified; pointer and CTA structure checked.
- `observedEffects`:
  - `name`: **Autoplay full-cover decision footage**; `nameZh`: **自播全覆盖决策影像**; `category`: `media`; `trigger`: page mount; `visualResponse`: two full-cover videos loop silently inside feature surfaces; `timing`: continuous; `layer`: feature media; `evidence`: two Sanity MP4 tags carry `loop autoPlay muted playsInline preload="metadata"` and `object-cover w-full h-full`; `duplicateWith221`: **not catalog-worthy alone — ordinary autoplay media**.
  - `name`: **Dismissible announcement collapse**; `nameZh`: **可关闭公告折叠**; `category`: `carousel`; `trigger`: close button; `visualResponse`: announcement region changes maximum height and opacity; `timing`: `300ms ease-out`; `layer`: top overlay; `evidence`: announcement has `transition-all duration-300 ease-out max-h-40 opacity-100` and an explicit dismiss button; closed state code is client-side and was not present; `duplicateWith221`: **closest to `expandable-action-toolbar-reveal`; not promoted because the response endpoint is unverified**.

## 11. Labelbox

- `company`: Labelbox
- `homepage`: https://labelbox.com/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll/glass-header state unverified; pointer and CTA confirmed.
- `observedEffects`:
  - `name`: **Announcement arrow handoff**; `nameZh`: **公告箭头递进**; `category`: `pointer`; `trigger`: announcement hover; `visualResponse`: trailing arrow shifts right by 4px; `timing`: `300ms`; `layer`: announcement CTA; `evidence`: arrow wrapper declares `transition-transform duration-300 group-hover:translate-x-1`; `duplicateWith221`: **yes — `reusable-css-hover-vocabulary`**.
  - `name`: **Glass-header state transition**; `nameZh`: **玻璃页头状态过渡**; `category`: `scroll`; `trigger`: `unverified`; `visualResponse`: `nav-glass-header` changes visual state through `transition-all`; `timing`: `300ms ease-in-out`; `layer`: navigation; `evidence`: both mobile and desktop headers use `nav-glass-header transition-all duration-300 ease-in-out`; no scroll listener/state rule was explicit in the snapshot; `duplicateWith221`: **not promoted — unverified**.

## 12. Snorkel AI

- `company`: Snorkel AI
- `homepage`: https://snorkel.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll provider present but exact entry condition unverified; pointer rules confirmed; CTA checked.
- `observedEffects`:
  - `name`: **Staggered fade-up effect group**; `nameZh`: **交错上浮淡入效果组**; `category`: `animation`; `trigger`: `unverified` effect-provider entry; `visualResponse`: elements move from `translateY(8px)` and opacity 0 to their resting state; `timing`: `300ms`, with `80/160/240ms` delays; `layer`: content; `evidence`: generated effect CSS includes `.x-effect-enter/.x-effect-exit`, `opacity`, `translate(0px,8px)`, and successive 80ms delay classes; `duplicateWith221`: **yes — `staggered-transform-choreography` plus `data-attribute-viewport-reveal`**.
  - `name`: **Hover accessory fade-in**; `nameZh`: **悬停附属元素淡入**; `category`: `pointer`; `trigger`: effect-provider hover; `visualResponse`: hidden accessory opacity rises to 1; `timing`: effect transition; `layer`: card/content overlay; `evidence`: stylesheet sets `.megf-1d{opacity:0}` and provider hover `.megf-1d{opacity:1}`; `duplicateWith221`: **yes — `reusable-css-hover-vocabulary`**.

## 13. Weights & Biases

- `company`: Weights & Biases
- `homepage`: https://wandb.ai/ (redirects to https://wandb.ai/site)
- `checkedAt`: `2026-07-17`
- `coverage`: first fold/text verified through official response; scroll, pointer and CTA motion `unverified` because the fetched shell contains no usable interaction rules.
- `observedEffects`: `[]`
- `notes`: The official page is a valid AI developer platform sample. No effect is inferred from client-only behavior, so this sample contributes no unique candidate.

## 14. Arize AI

- `company`: Arize AI
- `homepage`: https://arize.com/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll listener and viewport observer source-confirmed; pointer/CTA checked.
- `observedEffects`:
  - `name`: **Single-threshold translucent header restyle**; `nameZh`: **单阈值半透明页头改色**; `category`: `scroll`; `trigger`: `window.scrollY >= 100`; `visualResponse`: header switches from translucent `bg-[#121221]/40` to opaque `bg-[#121221]`; `timing`: `300ms` color transition; `layer`: navigation; `evidence`: Alpine state `scrolled` is updated by an explicit scroll listener and drives the two background classes; `duplicateWith221`: **no against the existing 221; same new effect family as candidate C2, whose LlamaIndex implementation is preferred because it adds hysteresis**.
  - `name`: **One-shot viewport Lottie playback**; `nameZh`: **一次性入视口 Lottie 播放**; `category`: `vector`; `trigger`: IntersectionObserver at 10% visibility; `visualResponse`: homepage diagram plays once and is then unobserved; `timing`: asset timeline, non-looping; `layer`: feature diagram; `evidence`: `lottie.loadAnimation({loop:false,autoplay:false,...homepage-diagram.json})`; observer calls `anim.play()` and `unobserve` at threshold `0.1`; `duplicateWith221`: **yes — `after-effects-vector-playback` plus `data-attribute-viewport-reveal`**.
  - `name`: **Logo marquee**; `nameZh`: **Logo 跑马灯**; `category`: `carousel`; `trigger`: page mount; `visualResponse`: customer logos loop horizontally; `timing`: continuous; `layer`: social proof; `evidence`: repeated marquee classes/markup in the official HTML; `duplicateWith221`: **yes — `seamless-logo-loop-marquee`**.

## 15. LangChain

- `company`: LangChain
- `homepage`: https://www.langchain.com/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll helpers present; hover menus and CTA checked.
- `observedEffects`:
  - `name`: **Autoplay hero Lottie lifecycle diagram**; `nameZh`: **自播首屏 Lottie 生命周期图**; `category`: `vector`; `trigger`: page mount; `visualResponse`: a LangChain agent-lifecycle SVG animation plays; `timing`: `7.033333s`, non-looping; `layer`: hero media; `evidence`: `#home-lottie` carries `data-animation-type="lottie"`, `data-autoplay="1"`, `data-loop="0"`, renderer `svg`, and exact duration; `duplicateWith221`: **yes — `after-effects-vector-playback`**.
  - `name`: **Hover-open mega menu**; `nameZh`: **悬停打开巨型菜单**; `category`: `carousel`; `trigger`: hover with `data-delay="100"`; `visualResponse`: dropdown content reveals from the navbar; `timing`: 100ms delay; `layer`: navigation overlay; `evidence`: multiple Webflow dropdowns use `data-hover="true" data-delay="100"`; `duplicateWith221`: **yes — `nested-menu-and-submenu-transition`**.
  - `name`: **Research card slider**; `nameZh`: **研究卡片滑轨**; `category`: `carousel`; `trigger`: swipe/navigation; `visualResponse`: research cards move as Swiper slides; `timing`: slider transition; `layer`: content; `evidence`: homepage source includes repeated `swiper` markup and Swiper assets; `duplicateWith221`: **yes — `momentum-touch-carousel`**.

## 16. LlamaIndex

- `company`: LlamaIndex
- `homepage`: https://www.llamaindex.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll listener fully source-confirmed; pointer/CTA checked.
- `observedEffects`:
  - `name`: **Hysteretic scroll-threshold header restyle**; `nameZh`: **带滞回的滚动阈值页头改色**; `category`: `scroll`; `trigger`: scroll past 60px, reset only below 40px; `visualResponse`: desktop header toggles the `HeaderScrolled` style without flickering around a single boundary; `timing`: discrete state change with CSS transition; `layer`: navigation; `evidence`: inline script tracks a boolean and adds the class at `e>60`, removes at `e<40`, using a passive scroll listener; `duplicateWith221`: **no — unique candidate C2**.
  - `name`: **Autoplay OCR process loops**; `nameZh`: **自播 OCR 流程循环**; `category`: `media`; `trigger`: page mount; `visualResponse`: process/UI videos repeat inside product sections; `timing`: continuous loop; `layer`: feature media; `evidence`: repeated `ocr-engine-step-video` and `Video` tags carry `autoplay loop muted playsinline`; `duplicateWith221`: **not catalog-worthy alone — ordinary autoplay media**.
  - `name`: **Dormant looping pre-footer Lottie**; `nameZh`: **待触发循环页尾 Lottie**; `category`: `vector`; `trigger`: `unverified`; `visualResponse`: configured SVG Lottie would loop in the CTA region; `timing`: looping; `layer`: CTA background; `evidence`: `lottie.loadAnimation` targets `#cta-animation` with `loop:true` but `autoplay:false`; no `.play()` call is present in the fetched page; `duplicateWith221`: **not promoted — trigger unverified; otherwise `after-effects-vector-playback`**.

## 17. Pinecone

- `company`: Pinecone
- `homepage`: https://www.pinecone.io/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll unverified; pointer/CTA checked; first-party canvas chunk inspected.
- `observedEffects`:
  - `name`: **Staggered multi-chart telemetry boot**; `nameZh`: **交错多图表遥测启动**; `category`: `canvas`; `trigger`: component mount; `visualResponse`: six loading spinners turn off in sequence and six Canvas metrics draw progressively from left to right; `timing`: staggered starts around 300ms+, each draw uses `requestAnimationFrame` over `4500ms` with easing; `layer`: simulated product dashboard; `evidence`: first-party chunk `0ir4nc9961bja.js` creates `cpk-c0`…`cpk-c5` canvases and `cpk-ms0`…`cpk-ms5` spinners; functions remove/add spinner `off`, clip by progress, calculate `(performance.now()-start)/4500`, and schedule the next frame; `duplicateWith221`: **no — unique candidate C5**.
  - `name`: **Hero procedural canvas**; `nameZh`: **首屏程序化画布**; `category`: `canvas`; `trigger`: `unverified`; `visualResponse`: full hero canvas renders behind a right-to-left gradient mask; `timing`: `unverified`; `layer`: hero background; `evidence`: desktop hero owns an absolute full-size `<canvas aria-hidden="true">` beneath a gradient veil; draw code was not isolated; `duplicateWith221`: **not promoted — unverified**.
  - `name`: **Border-on-hover navigation cells**; `nameZh`: **悬停显边导航单元**; `category`: `pointer`; `trigger`: nav hover; `visualResponse`: transparent borders become visible; `timing`: color transition; `layer`: navigation; `evidence`: nav spans use `group-hover:border-border border border-transparent`; `duplicateWith221`: **yes — `reusable-css-hover-vocabulary`**.

## 18. Weaviate

- `company`: Weaviate
- `homepage`: https://weaviate.io/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll unverified; pointer/CTA confirmed.
- `observedEffects`:
  - `name`: **CTA lift and brighten**; `nameZh`: **CTA 上浮增亮**; `category`: `pointer`; `trigger`: CTA hover; `visualResponse`: button moves up by 0.5 spacing unit and brightens to white; `timing`: `200ms`; `layer`: hero CTA; `evidence`: classes include `transition-all duration-200 hover:-translate-y-0.5 hover:bg-white`; `duplicateWith221`: **yes — `reusable-css-hover-vocabulary`**.
  - `name`: **Customer logo marquee**; `nameZh`: **客户 Logo 跑马灯**; `category`: `carousel`; `trigger`: page mount; `visualResponse`: repeated brand logos move as a strip; `timing`: continuous; `layer`: content; `evidence`: official HTML includes repeated marquee structures/classes; `duplicateWith221`: **yes — `seamless-logo-loop-marquee`**.

## 19. Qdrant

- `company`: Qdrant
- `homepage`: https://qdrant.tech/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll and slider libraries explicit; pointer/CTA checked.
- `observedEffects`:
  - `name`: **Scroll-revealed homepage sections**; `nameZh`: **滚动揭示首页区块**; `category`: `scroll`; `trigger`: viewport entry while scrolling; `visualResponse`: section content enters via the site reveal routine; `timing`: site animation timing; `layer`: content; `evidence`: homepage loads first-party `home-animations.min...js` and `scroll-reveal.min...js`; `duplicateWith221`: **yes — `data-attribute-viewport-reveal`**.
  - `name`: **Splide content carousel**; `nameZh`: **Splide 内容轮播**; `category`: `carousel`; `trigger`: carousel controls/swipe; `visualResponse`: cards/slides translate through a rail; `timing`: slider transition; `layer`: content; `evidence`: homepage explicitly loads `vendor/splide.min...js`; `duplicateWith221`: **yes — `momentum-touch-carousel`**.

## 20. Chroma

- `company`: Chroma
- `homepage`: https://www.trychroma.com/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll unverified; pointer confirmed; CTA checked; canvas response unverified.
- `observedEffects`:
  - `name`: **Pixelated image-to-canvas separator**; `nameZh`: **像素化图像到画布分隔器**; `category`: `canvas`; `trigger`: `unverified`; `visualResponse`: a pixelated Canvas is layered exactly over a pixelated source image; `timing`: `unverified`; `layer`: section media; `evidence`: `/img/street.jpg` and an absolute `<canvas role="img" aria-label="separator">` share identical aspect ratio and `[image-rendering:pixelated]`; `duplicateWith221`: **not promoted — likely overlaps `pixel-grid-content-dissolve`, but no draw/trigger code was verified**.
  - `name`: **Logo lift with caption reveal**; `nameZh`: **Logo 上浮并揭示说明**; `category`: `pointer`; `trigger`: case-study card hover; `visualResponse`: logo moves upward while bottom caption rises and fades in; `timing`: `300ms`; `layer`: card content; `evidence`: card logo uses `group-hover:-translate-y-1`; caption starts `translate-y-1 opacity-0` and becomes `translate-y-0 opacity-100`; `duplicateWith221`: **yes — `approach-direction-overlay-entrance` / `reusable-css-hover-vocabulary`**.

## 21. Unstructured

- `company`: Unstructured
- `homepage`: https://unstructured.io/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; fixed header structure checked but scroll trigger unverified; pointer and CTA fully encoded.
- `observedEffects`:
  - `name`: **Opposed diagonal offset CTA**; `nameZh`: **反向对冲斜移 CTA**; `category`: `pointer`; `trigger`: button hover, reset on active press; `visualResponse`: the visible CTA shifts 5px up-left while an equal-size pseudo-surface shifts 5px down-right, creating a separated offset/block-print feel; pressing snaps the button back; `timing`: `200ms ease-in-out`; `layer`: CTA; `evidence`: button classes encode `group-hover/button:-translate-x-5`, `-translate-y-5`, an absolute full-size `after` with opposite `translate-x-5 translate-y-5`, and `active:translate-x-0 active:translate-y-0`; `duplicateWith221`: **no — unique candidate C4**.
  - `name`: **Six-frame logo sprite hover**; `nameZh`: **六帧 Logo 精灵悬停**; `category`: `pointer`; `trigger`: `unverified`; `visualResponse`: an overlaid logo sprite could reveal one of six vertical frames; `timing`: `200ms` opacity transition; `layer`: navigation brand; `evidence`: logo overlay uses `/images/logo-hover.webp`, `background-size:100% 600%`, explicit background positions, and initial `opacity-0`; the state that changes opacity/frame is client-side and absent; `duplicateWith221`: **not promoted — unverified**.
  - `name`: **Fixed header translate transition**; `nameZh`: **固定页头位移过渡**; `category`: `scroll`; `trigger`: `unverified`; `visualResponse`: header is prepared to translate in/out; `timing`: `250ms ease-in-out`; `layer`: navigation; `evidence`: `#site-header` is fixed and declares `transition-transform duration-250`; no scroll-direction handler was verified; `duplicateWith221`: **not promoted; likely `scroll-direction-auto-hiding-header`**.

## 22. Langfuse

- `company`: Langfuse
- `homepage`: https://langfuse.com/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll unverified; pointer/dropdowns and CTA checked.
- `observedEffects`:
  - `name`: **Dropdown fade-and-rise**; `nameZh`: **下拉层淡入上移**; `category`: `carousel`; `trigger`: menu open state; `visualResponse`: menu changes from transparent and `-translate-y-1` to visible/resting position; `timing`: opacity/transform transition; `layer`: navigation overlay; `evidence`: dropdown wrapper begins `pointer-events-none opacity-0 -translate-y-1 transition-[opacity,transform]`; `duplicateWith221`: **yes — `nested-menu-and-submenu-transition`**.
  - `name`: **Looping assistant demo**; `nameZh`: **循环助手演示**; `category`: `media`; `trigger`: page mount; `visualResponse`: product assistant workflow loops inside a framed panel; `timing`: continuous loop; `layer`: feature media; `evidence`: `<video ... in-app-agent.mp4 autoPlay muted loop playsInline ...>`; `duplicateWith221`: **not catalog-worthy alone — ordinary autoplay media**.
  - `name`: **Community-stat marquee**; `nameZh`: **社区指标跑马灯**; `category`: `carousel`; `trigger`: page mount; `visualResponse`: repeated usage metrics move as a strip; `timing`: continuous; `layer`: content; `evidence`: duplicated metric phrases and marquee structures in official HTML; `duplicateWith221`: **yes — `seamless-logo-loop-marquee` at the motion level**.

## 23. Helicone (replacement for Humanloop)

- `company`: Helicone
- `homepage`: https://www.helicone.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; sticky header confirmed but no animated scroll response; pointer and CTA checked.
- `observedEffects`:
  - `name`: **CTA arrow nudge**; `nameZh`: **CTA 箭头轻推**; `category`: `pointer`; `trigger`: CTA group hover; `visualResponse`: arrow translates right by 4px; `timing`: transform transition; `layer`: CTA icon; `evidence`: arrow SVG has `transition-transform group-hover:translate-x-1`; `duplicateWith221`: **yes — `reusable-css-hover-vocabulary`**.
  - `name`: **Sticky bordered navigation**; `nameZh`: **粘性描边导航**; `category`: `scroll`; `trigger`: normal document scroll; `visualResponse`: navigation remains pinned at the top; `timing`: position lock, no animation; `layer`: navigation; `evidence`: header wrapper is `top-0 sticky z-30 border-b`; `duplicateWith221`: **not a standalone animated effect**.

## 24. Braintrust

- `company`: Braintrust
- `homepage`: https://www.braintrust.dev/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll unverified; pointer and CTA fully encoded.
- `observedEffects`:
  - `name`: **Pill-to-square inverted CTA**; `nameZh`: **胶囊到直角反色 CTA**; `category`: `pointer`; `trigger`: signup CTA hover; `visualResponse`: a blue pill becomes a square-cornered black button; `timing`: `200ms`; `layer`: navigation CTA; `evidence`: signup classes include `rounded-3xl transition-all duration-200 hover:rounded-none ... hover:bg-black`; `duplicateWith221`: **yes — specific styling within `reusable-css-hover-vocabulary`; not a new interaction contract**.
  - `name`: **Sibling-dimming navigation focus**; `nameZh`: **导航同级弱化聚焦**; `category`: `pointer`; `trigger`: nav group hover; `visualResponse`: all sibling links dim to 60% while the hovered link returns to full opacity; `timing`: opacity transition; `layer`: navigation; `evidence`: links use `transition-opacity group-hover:opacity-60 hover:opacity-100!`; `duplicateWith221`: **yes — `reusable-css-hover-vocabulary`**.
  - `name`: **Loop-ready customer video cards**; `nameZh`: **可循环客户视频卡片**; `category`: `media`; `trigger`: `unverified`; `visualResponse`: customer clips are configured to loop within cover-fit cards; `timing`: looping after activation; `layer`: customer cards; `evidence`: Vercel/Notion/Dropbox/Replit/Navan videos are `muted playsInline loop preload="none"` but have no autoplay attribute; `duplicateWith221`: **not promoted — activation trigger unverified**.

## 25. Galileo

- `company`: Galileo
- `homepage`: https://galileo.ai/
- `checkedAt`: `2026-07-17`
- `coverage`: first fold confirmed; scroll/pointer runtime mostly Framer-client and therefore unverified; CTA checked from static structure.
- `observedEffects`:
  - `name`: **Enterprise logo marquee**; `nameZh`: **企业 Logo 跑马灯**; `category`: `carousel`; `trigger`: page mount; `visualResponse`: customer logos move through a repeated rail; `timing`: continuous; `layer`: social proof; `evidence`: official Framer document contains a section explicitly named `Logo Marquee` with duplicated SSR variants; `duplicateWith221`: **yes — `seamless-logo-loop-marquee`**.
  - `name`: **Framer native-scroll surfaces**; `nameZh`: **Framer 原生滚动表面**; `category`: `scroll`; `trigger`: user scroll; `visualResponse`: client components can scroll while hiding scrollbars; `timing`: native; `layer`: content; `evidence`: framework CSS defines `data-framer-component-type=NativeScroll` vertical/horizontal modes and hidden scrollbars, but no homepage-specific animated response was statically attributable; `duplicateWith221`: **not promoted — framework capability is not evidence of an observed homepage effect**.

## Unique candidates and dependency-free reproductions

### C1. Blurred autoplay video ambience / 模糊自播视频氛围层

- Source: Replicate first fold.
- Dedup rationale: `image-palette-ambient-color-transition` derives and transitions colors from still media; `full-page-fragment-shader-backdrop` renders a shader. This effect instead uses the live pixels of an ordinary looping video as a heavily blurred, oversized ambient light source under a blend wash. The trigger, renderer and visible texture are different.

```html
<div class="ambient-video" aria-hidden="true">
  <video autoplay muted loop playsinline src="demo.mp4"></video>
  <i></i>
</div>
<main class="foreground">Live pixels become ambient light.</main>
<style>
  .ambient-video { position:fixed; inset:0; overflow:hidden; background:#ddd; }
  .ambient-video video {
    width:120%; height:120%; object-fit:cover; transform:scale(1.12);
    filter:blur(48px) saturate(1.35); opacity:.75;
  }
  .ambient-video i { position:absolute; inset:0; background:#b9a6ff; opacity:.28; mix-blend-mode:multiply; }
  .foreground { position:relative; z-index:1; padding:12vh 8vw; font:700 clamp(2rem,7vw,7rem)/.95 system-ui; }
  @media (prefers-reduced-motion:reduce) { .ambient-video video { display:none; } }
</style>
```

### C2. Hysteretic scroll-threshold header restyle / 带滞回的滚动阈值页头改色

- Preferred source: LlamaIndex; Arize provides a simpler single-threshold corroborating implementation.
- Dedup rationale: `scroll-direction-auto-hiding-header` reacts to direction and moves the header out of view. This candidate keeps the header visible, changes its style by absolute scroll depth, and uses separate enter/exit thresholds to prevent boundary flicker.

```html
<header id="site-head">Product <a href="#start">Start</a></header>
<style>
  #site-head { position:fixed; inset:0 0 auto; z-index:10; padding:18px 6vw; background:#fff0;
    border-bottom:1px solid transparent; transition:background .22s,border-color .22s,box-shadow .22s; }
  #site-head.scrolled { background:#ffff; border-color:#ddd; box-shadow:0 8px 28px #0000000d; }
</style>
<script>
  const head = document.querySelector('#site-head');
  let compact = false;
  addEventListener('scroll', () => {
    if (!compact && scrollY > 60) { compact = true; head.classList.add('scrolled'); }
    else if (compact && scrollY < 40) { compact = false; head.classList.remove('scrolled'); }
  }, { passive:true });
</script>
```

### C3. Card metadata-to-CTA role swap / 卡片元数据到 CTA 角色互换

- Source: Together AI research cards.
- Dedup rationale: `approach-direction-overlay-entrance` brings one overlay in according to pointer approach. This candidate performs a semantic role swap inside one card: metadata exits, CTA enters, and the background emphasis appears as one coordinated hover/focus state. It is not direction-sensitive.

```html
<a class="role-card" href="#read">
  <span class="wash"></span><h3>Agent research</h3>
  <span class="authors">Lee · Rao · Chen</span><span class="read">Read paper →</span>
</a>
<style>
  .role-card { position:relative; display:block; width:280px; min-height:180px; padding:24px;
    overflow:hidden; color:#fff; background:#161923; text-decoration:none; }
  .role-card > * { position:relative; z-index:1; }
  .wash { position:absolute; inset:0; z-index:0; opacity:0; background:linear-gradient(135deg,#664cff,#16c7c1); transition:opacity .3s; }
  .authors,.read { position:absolute; left:24px; bottom:22px; transition:opacity .25s,transform .25s; }
  .read { opacity:0; transform:translateY(12px); }
  .role-card:is(:hover,:focus-visible) .wash { opacity:1; }
  .role-card:is(:hover,:focus-visible) .authors { opacity:0; }
  .role-card:is(:hover,:focus-visible) .read { opacity:1; transform:none; }
</style>
```

### C4. Opposed diagonal offset CTA / 反向对冲斜移 CTA

- Source: Unstructured CTAs.
- Dedup rationale: `pointer-attracted-button-motion` continuously follows pointer coordinates; `approach-direction-overlay-entrance` moves an overlay from the approach side. This fixed hover effect separates the face and its pseudo-surface in opposite diagonal directions, with an active-state snap-back that makes the control feel printed/physical.

```html
<button class="offset-cta">Try the pipeline <span>↗</span></button>
<style>
  .offset-cta { position:relative; z-index:0; border:2px solid #111; padding:14px 20px;
    background:#d8ff3e; font:700 16px system-ui; transition:transform .2s ease-in-out; }
  .offset-cta::after { content:""; position:absolute; inset:-2px; z-index:-1; border:2px solid #111;
    background:#ff72b6; transition:transform .2s ease-in-out; }
  .offset-cta:hover { transform:translate(-5px,-5px); }
  .offset-cta:hover::after { transform:translate(10px,10px); }
  .offset-cta:active { transform:none; }
  .offset-cta:active::after { transform:none; }
</style>
```

### C5. Staggered multi-chart telemetry boot / 交错多图表遥测启动

- Source: Pinecone simulated metrics dashboard.
- Dedup rationale: `streaming-line-chart-transition` continuously updates one line chart, while `synchronized-multi-chart-cursor` links pointer position across charts. This is a mount-time boot choreography: independent loaders resolve in sequence and each chart is progressively drawn, creating a coordinated dashboard coming-online effect.

```html
<div class="telemetry">
  <figure><b>Read units</b><i></i><canvas></canvas></figure>
  <figure><b>Latency</b><i></i><canvas></canvas></figure>
  <figure><b>Records</b><i></i><canvas></canvas></figure>
</div>
<style>
  .telemetry { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
  figure { position:relative; margin:0; padding:12px; border:1px solid #bbb; background:#fff; }
  canvas { width:100%; height:90px; }
  figure i { position:absolute; inset:50% auto auto 50%; width:18px; height:18px; border:2px solid #ddd;
    border-top-color:#315cff; border-radius:50%; animation:spin .7s linear infinite; }
  figure.ready i { display:none; } @keyframes spin { to { transform:rotate(1turn); } }
</style>
<script>
  const values = [[.8,.5,.7,.25,.45],[.2,.75,.4,.65,.3],[.1,.25,.35,.7,.9]];
  document.querySelectorAll('.telemetry figure').forEach((box, index) => setTimeout(() => {
    box.classList.add('ready'); const canvas = box.querySelector('canvas');
    canvas.width = canvas.clientWidth * devicePixelRatio; canvas.height = 90 * devicePixelRatio;
    const ctx = canvas.getContext('2d'), start = performance.now(), points = values[index];
    (function draw(now) { const p = Math.min(1,(now-start)/1200); ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.beginPath(); points.forEach((v,i) => { const x=i/(points.length-1)*canvas.width*p;
        const y=(1-v)*canvas.height; i ? ctx.lineTo(x,y) : ctx.moveTo(x,y); });
      ctx.strokeStyle='#315cff'; ctx.lineWidth=2*devicePixelRatio; ctx.stroke(); if(p<1) requestAnimationFrame(draw);
    })(start);
  }, 250 + index * 140));
</script>
```

## Batch summary

- 25 active AI-native official homepages retained.
- 1 requested sample replaced: Humanloop → Helicone.
- 5 unique candidates: blurred autoplay video ambience; hysteretic scroll-threshold header restyle; card metadata-to-CTA role swap; opposed diagonal offset CTA; staggered multi-chart telemetry boot.
- High-frequency duplicates: logo marquees, generic CTA arrow nudges, Lottie playback, viewport reveals, hover image zoom, dropdown transitions and ordinary autoplay video.
- No unverified runtime-only behavior was promoted as unique.
