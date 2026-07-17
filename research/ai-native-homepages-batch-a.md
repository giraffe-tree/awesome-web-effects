# AI-native homepage interaction research — batch A

- `checkedAt`: `2026-07-17`
- Sample count: **25 valid AI-native company homepages**
- Existing-catalog baseline: the 221 effects represented by `demo/data/effects.js` and `demo/data/additional-effects.js` on 2026-07-17.
- Evidence rule: `verified` means the official homepage HTML/CSS/loaded first-party JavaScript contains the stated element, selector, keyframe, media attribute, or behavior. `unverified` means the semantic homepage exposed the UI, but this run could not execute the interaction; unverified observations are never counted as unique candidates.

## Runtime limitation and replacements

The required in-app Browser path was attempted first after reading the complete `browser:control-in-app-browser` skill. The shared browser runtime failed during its mandated bootstrap with `TypeError: Cannot redefine property: process` at `browser-client.mjs:33`; a clean runtime reset reproduced the same error. The parent task confirmed the same shared-runtime failure. The approved fallback was therefore used: official-homepage `web open`, direct official HTML/CSS inspection with `curl`, and inspection of first-party bundles only when a precise runtime behavior had to be established. This means visual timing that was not explicit in source is deliberately marked `unverified`.

- **Tome** was removed: `https://tome.app/` returned HTTP 404 and no longer supplied a usable AI-company homepage. It was replaced by **Kling AI**.
- **Windsurf** was removed as an independent sample: `https://windsurf.com/` redirected to `https://devin.ai/desktop`, making it a duplicate Cognition/Devin surface rather than a separate company homepage. It was replaced by **Higgsfield**.
- `https://cognition.ai/` now redirects to the valid canonical homepage `https://cognition.com/`.

## Scope checklist

For every reachable document the review checked: (1) first-fold DOM/media and primary CTA, (2) later homepage sections represented in the semantic document, (3) source selectors for hover/pointer states, and (4) source markers for scroll, carousel, autoplay, video, canvas, masks, and keyframes. Where Cloudflare or the runtime limitation prevented execution, the corresponding trigger is explicitly unverified below.

## 1. OpenAI

- `company`: OpenAI
- `homepage URL`: https://openai.com/
- `checkedAt`: `2026-07-17`
- `access`: official semantic homepage available through `web open`; direct curl received an OpenAI challenge page, so challenge animation was excluded.
- `observedEffects`:
  - `semanticName`: **Hero prompt-composer affordance**; `中文名`: **首屏提示词输入器**; `category`: `transition / CTA`; `trigger`: focus, typing, or submit (**unverified**); `visualResponse`: the first fold presents “What can I help with?”, a message field, and ChatGPT/Research/API actions as the visual center; `timing`: expected immediate UI state transition, not source-verified; `layer`: content / primary CTA; `evidence`: official semantic homepage lines expose “What can I help with?”, “Message ChatGPT”, “Talk with ChatGPT”, “Research”, and “API Platform”; `existing221Duplicate`: **unverified-excluded**, closest existing patterns are `cmdk` and ordinary state transitions, but no animation response was observable.
  - `semanticName`: **Editorial art-card stream**; `中文名`: **编辑式艺术卡片流**; `category`: `media / scroll`; `trigger`: scrolling and card hover (**unverified**); `visualResponse`: large art cards lead into recent news, stories, research, and business grids; `timing`: unknown; `layer`: content; `evidence`: official page lists consecutive art-card images followed by the named sections; `existing221Duplicate`: **unverified-excluded**, likely ordinary scroll/reveal/card-hover composition.

## 2. Anthropic

- `company`: Anthropic
- `homepage URL`: https://www.anthropic.com/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Hover-paused logo marquee**; `中文名`: **悬停暂停品牌跑马灯**; `category`: `animation`; `trigger`: mount, then pointer hover; `visualResponse`: logo strip translates continuously and freezes while hovered; `timing`: `48s linear infinite`; `layer`: content; `evidence`: official inline CSS defines `.logo_marquee_logo_component { animation: marquee 48s linear infinite }` and `.logo_marquee:hover ... { animation-play-state: paused }`; `existing221Duplicate`: **yes — `Seamless logo-loop marquee`**.
  - `semanticName`: **Clip-path menu curtain**; `中文名`: **裁剪路径菜单帘幕**; `category`: `transition`; `trigger`: opening/closing the navigation menu; `visualResponse`: polygon clip-path expands from zero height to full height and collapses back; `timing`: navigation duration variables with ease-in-out; `layer`: navigation overlay; `evidence`: inline `menuOpen`/`menuClose` keyframes animate `clip-path: polygon(...)`; `existing221Duplicate`: **yes — `Layered staggered full-screen menu` plus `Clip-shape theme reveal`**.
  - `semanticName`: **Linked-card image nudge**; `中文名`: **链接卡片图片轻推**; `category`: `pointer`; `trigger`: card hover; `visualResponse`: the card visual transforms over `0.2s ease`; `timing`: 200 ms; `layer`: media surface; `evidence`: official CSS targets `.article_card:has(a):hover .g_visual_img` and `.card:has(a):hover .g_visual_img`; `existing221Duplicate`: **yes — generic hover transform / Hover.css family**.

## 3. Perplexity

- `company`: Perplexity
- `homepage URL`: https://www.perplexity.ai/
- `checkedAt`: `2026-07-17`
- `access`: the official semantic endpoint returned only the homepage image shell and direct HTML was a Cloudflare challenge.
- `observedEffects`:
  - `semanticName`: **Answer-composer focus state**; `中文名`: **答案输入器聚焦态**; `category`: `transition / CTA`; `trigger`: focus, typing, submit (**unverified**); `visualResponse`: expected composer emphasis and answer-mode state change; `timing`: unknown; `layer`: primary CTA; `evidence`: official homepage endpoint resolved successfully but did not expose executable DOM/CSS beyond the hero image shell; `existing221Duplicate`: **unverified-excluded**.

## 4. Midjourney

- `company`: Midjourney
- `homepage URL`: https://www.midjourney.com/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Project-symbol matrix**; `中文名`: **项目符号矩阵**; `category`: `pointer / media`; `trigger`: project-card hover (**unverified**); `visualResponse`: icon-led cards for Eye, Pen, People, Face, Heart, Brain, Hand, and Lips form the Projects field; `timing`: unknown; `layer`: content; `evidence`: the official semantic homepage exposes the eight named project images/cards; direct HTML was a challenge document, so hover response could not be verified; `existing221Duplicate`: **unverified-excluded**, closest is a generic hover grid.

## 5. Runway

- `company`: Runway
- `homepage URL`: https://runwayml.com/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Autoplay cinematic hero loop**; `中文名`: **首屏电影感自动循环视频**; `category`: `media`; `trigger`: page load; `visualResponse`: full-bleed generated-world footage loops silently behind the hero; `timing`: continuous, native video loop; `layer`: background; `evidence`: official HTML contains multiple hero `<video muted autoplay loop playsinline>` elements and the first-fold `Hero.mp4`; `existing221Duplicate`: **yes — ordinary looping media/background; no new interaction contract**.
  - `semanticName`: **Zoom-and-veil video card**; `中文名`: **缩放加柔焦遮罩视频卡片**; `category`: `pointer`; `trigger`: card hover; `visualResponse`: media scales to `110%` while a black 30% backdrop-blur overlay fades from 0 to 100% opacity and reveals the play affordance; `timing`: `200ms linear`; `layer`: media surface / overlay; `evidence`: official classes include `group-hover:scale-110`, `backdrop-blur-sm`, `opacity-0`, and `group-hover:opacity-100`; `existing221Duplicate`: **yes — generic media hover overlay and scale**.
  - `semanticName`: **Carousel-title emphasis**; `中文名`: **轮播标题悬停强调**; `category`: `carousel`; `trigger`: group hover; `visualResponse`: title opacity rises from 60% to 100%; `timing`: 200 ms; `layer`: content/navigation; `evidence`: `.carousel-title ... opacity-60 group-hover:opacity-100`; `existing221Duplicate`: **yes — Swiper/carousel plus hover opacity**.

## 6. ElevenLabs

- `company`: ElevenLabs
- `homepage URL`: https://elevenlabs.io/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Canvas-over-SVG voice field**; `中文名`: **Canvas 叠加 SVG 声纹场**; `category`: `canvas`; `trigger`: animation frame or audio state (**runtime unverified**); `visualResponse`: a full-size canvas overlays detailed white SVG waveform paths on the purple/blue and green product art; `timing`: controller not visible in initial HTML; `layer`: canvas/media surface; `evidence`: two official `<canvas class="...size-full">` nodes sit directly before SVGs whose paths contain dense waveform-like coordinates; `existing221Duplicate`: **yes — closest `Microphone-reactive spectrum ring` / `Scrubbable audio waveform`; excluded from candidates because runtime coupling was unverified**.
  - `semanticName`: **Play-button scale reveal**; `中文名`: **播放按钮缩放显现**; `category`: `pointer`; `trigger`: linked bento-card hover; `visualResponse`: a circular play control goes from `opacity:0; scale:.95` to visible full scale while a focus ring appears; `timing`: 200 ms transition; `layer`: overlay; `evidence`: official utility classes state `tw-opacity-0 tw-scale-95 ... group-hover`; `existing221Duplicate`: **yes — generic hover overlay / Hover.css**.

## 7. Suno

- `company`: Suno
- `homepage URL`: https://suno.com/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Color-awakening logo marquee**; `中文名`: **悬停焕彩品牌跑马灯**; `category`: `animation / pointer`; `trigger`: continuous strip motion plus individual logo hover; `visualResponse`: logos move as a whitespace-nowrap marquee; each changes from grayscale to full color on hover; `timing`: logo filter transition 300 ms; marquee duration not exposed in the first HTML; `layer`: content; `evidence`: `logo-marquee inline-flex min-w-full whitespace-nowrap` and logo classes `grayscale transition-all duration-300 hover:grayscale-0`; `existing221Duplicate`: **yes — `Seamless logo-loop marquee` plus ordinary CSS filter hover**.
  - `semanticName`: **Soft-lift story tiles**; `中文名`: **轻抬升故事卡片**; `category`: `pointer`; `trigger`: hover; `visualResponse`: rounded media cards scale to 102%; `timing`: 300 ms; `layer`: media surface; `evidence`: repeated `transition-transform duration-300 hover:scale-[102%]`; `existing221Duplicate`: **yes — generic card hover transform**.
  - `semanticName`: **Touch-snap horizontal stories**; `中文名`: **触控吸附横向故事带**; `category`: `carousel`; `trigger`: horizontal scroll/drag; `visualResponse`: cards snap into place in a masked rail; `timing`: direct manipulation; `layer`: content/navigation; `evidence`: official classes `snap-x snap-mandatory overflow-x-auto` with edge gradients; `existing221Duplicate`: **yes — Swiper/native snap carousel**.

## 8. Pika

- `company`: Pika
- `homepage URL`: https://pika.art/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Metallic gradient-wave headline**; `中文名`: **金属渐变波标题**; `category`: `vector`; `trigger`: likely mount loop (**controller unverified**); `visualResponse`: a many-stop gold band is clipped into headline glyphs and positioned by custom property `--gi`; `timing`: unknown; `layer`: content; `evidence`: official heading uses `--gi:-25`, a 135° multistop gradient, `background-clip:text`, and transparent text fill; `existing221Duplicate`: **yes — `Chromatic band text sweep`; excluded because the changing controller was not source-verified**.
  - `semanticName`: **Device-silhouette masked video**; `中文名`: **设备轮廓蒙版视频**; `category`: `media`; `trigger`: page load; `visualResponse`: looping product footage is clipped by a phone-shaped image mask instead of a rectangular border; `timing`: continuous native video loop with 300 ms opacity transition; `layer`: media surface; `evidence`: official `<video autoplay loop muted playsinline>` has `mask-[url('/images/experiments/card3-phone-mockup.webp')] mask-center mask-no-repeat mask-size-[97.8%_97.8%]`; `existing221Duplicate`: **no — unique candidate A**.

## 9. Luma AI

- `company`: Luma AI
- `homepage URL`: https://lumalabs.ai/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Blend-mode self-inverting navigation**; `中文名`: **混合模式自反色导航**; `category`: `transition / background`; `trigger`: underlying page color changes during scroll; `visualResponse`: fixed navigation automatically inverts against light and dark sections without a scripted theme toggle; `timing`: continuous compositor response; `layer`: fixed navigation overlay; `evidence`: official nav class includes `fixed ... dark mix-blend-difference`; `existing221Duplicate`: **no — unique candidate B**.
  - `semanticName`: **Edge-faded content rail**; `中文名`: **边缘渐隐内容轨道**; `category`: `carousel`; `trigger`: horizontal movement; `visualResponse`: both ends of the rail dissolve through a linear mask; `timing`: direct manipulation; `layer`: content; `evidence`: official class contains `mask-[linear-gradient(to_right,transparent_0%,black_var(--mask-size),black_calc(100%-var(--mask-size)),transparent_100%)]`; `existing221Duplicate`: **yes — carousel masking is present in the existing carousel/marquee family**.
  - `semanticName`: **Linked-card media breathe**; `中文名`: **链接卡片媒体呼吸放大**; `category`: `pointer`; `trigger`: parent card hover; `visualResponse`: media scales to 1.02; `timing`: 300 ms ease-out; `layer`: media surface; `evidence`: `[.group:has(.card-link):hover_&]:scale-[1.02]`; `existing221Duplicate`: **yes — generic card hover transform**.

## 10. Synthesia

- `company`: Synthesia
- `homepage URL`: https://www.synthesia.io/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Lazy workflow-video carousel**; `中文名`: **懒加载工作流视频轮播**; `category`: `carousel / media`; `trigger`: carousel selection or viewport entry (**play handoff unverified**); `visualResponse`: Create, Edit, Collaborate, Translate, and Publish panels each have poster-first, `preload=none` video and a shared hero carousel; `timing`: lazy on demand; `layer`: media surface; `evidence`: five official hero videos use distinct `data-streamurl`, poster images, and class `html-video lazy`; the container names `emblaHeroVideo`; `existing221Duplicate`: **yes — Swiper/carousel plus lazy media**.
  - `semanticName`: **Looping circular slide timer**; `中文名`: **循环圆形轮播计时器**; `category`: `animation`; `trigger`: slide activity; `visualResponse`: circular control fills repeatedly; `timing`: `2s ease-in-out infinite forwards`; `layer`: navigation/overlay; `evidence`: official `@keyframes fillCircle` and matching animation rule; `existing221Duplicate`: **yes — `Animated circular gauge fill`**.
  - `semanticName`: **Continuous logo slides**; `中文名`: **连续品牌滑轨**; `category`: `animation`; `trigger`: mount; `visualResponse`: logo track translates in a loop; `timing`: `30s linear infinite`; `layer`: content; `evidence`: official `@keyframes logo-slides`; `existing221Duplicate`: **yes — `Seamless logo-loop marquee`**.

## 11. HeyGen

- `company`: HeyGen
- `homepage URL`: https://www.heygen.com/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Eager ambient orb film**; `中文名`: **首屏环境光球影片**; `category`: `media / background`; `trigger`: page load; `visualResponse`: the HeyGen orb plays continuously as the hero visual; `timing`: native autoplay loop; `layer`: background/media; `evidence`: official `HEYGEN_Orb_home_ios.mp4` video is `autoplay muted loop playsinline preload=eager`; `existing221Duplicate`: **yes — looping hero media**.
  - `semanticName`: **Mask-faded hover-paused logo belt**; `中文名`: **蒙版渐隐且悬停暂停品牌带**; `category`: `animation`; `trigger`: mount then group hover; `visualResponse`: a wide logo row moves continuously, dissolves at both edges, and pauses on hover; `timing`: configured `animate-logo-slide`; `layer`: content; `evidence`: official classes combine `mask-image:linear-gradient(...)`, `animate-logo-slide`, `group-hover:[animation-play-state:paused]`, and `motion-reduce:animate-none`; `existing221Duplicate`: **yes — `Seamless logo-loop marquee`**.
  - `semanticName`: **Brand-filter card focus**; `中文名`: **品牌滤镜卡片聚焦**; `category`: `pointer`; `trigger`: card hover; `visualResponse`: monochrome partner mark recolors and card border switches to brand blue; `timing`: 200 ms; `layer`: content/media; `evidence`: `group-hover:[filter:...]` and `hover:border-heygen-blue-hey`; `existing221Duplicate`: **yes — generic filter/border hover**.

## 12. Character.AI

- `company`: Character.AI
- `homepage URL`: https://character.ai/
- `checkedAt`: `2026-07-17`
- `access`: official domain was valid, but the semantic endpoint exposed zero lines and direct HTML was a Cloudflare challenge.
- `observedEffects`:
  - `semanticName`: **Character-card interaction field**; `中文名`: **角色卡片交互场**; `category`: `pointer / carousel`; `trigger`: hover, scroll, or card activation (**unverified**); `visualResponse`: unavailable in the evidence surface; `timing`: unknown; `layer`: content; `evidence`: no usable official DOM/CSS was exposed in this run; no effect claim is treated as verified; `existing221Duplicate`: **unverified-excluded**.

## 13. Harvey

- `company`: Harvey
- `homepage URL`: https://www.harvey.ai/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Motion-aware hero film fallback**; `中文名`: **尊重减弱动态的首屏影片回退**; `category`: `media`; `trigger`: page/viewport playback (**play start unverified**); `visualResponse`: desktop hero uses looping impact footage, while `prefers-reduced-motion` users receive the poster image; `timing`: continuous when playing; `layer`: background; `evidence`: video class includes `motion-reduce:hidden`, and the matching poster image uses `motion-reduce:block`; four webm/mp4 responsive sources are present; `existing221Duplicate`: **yes — media playback; accessibility implementation is good practice rather than a new visual effect**.
  - `semanticName`: **Reduced-motion-safe announcement ticker**; `中文名`: **减弱动态安全的公告跑马灯**; `category`: `animation`; `trigger`: mount; `visualResponse`: banner copy moves as one whitespace-nowrap strip; `timing`: `20s linear infinite`; `layer`: header; `evidence`: `animate-[scroll_20s_linear_infinite]` plus `motion-reduce:[animation-play-state:paused]`; `existing221Duplicate`: **yes — marquee family**.
  - `semanticName`: **Arrow-on-intent link**; `中文名`: **意图悬停箭头**; `category`: `pointer`; `trigger`: group hover; `visualResponse`: an adjacent arrow shifts right and fades from 0 to 100%; `timing`: 400 ms; `layer`: content; `evidence`: `opacity-0 ... group-hover:ml-1 group-hover:opacity-100`; `existing221Duplicate`: **yes — ordinary hover reveal**.

## 14. Glean

- `company`: Glean
- `homepage URL`: https://www.glean.com/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Delayed dropdown promo sweep**; `中文名`: **延迟触发的下拉菜单推广光扫**; `category`: `transition / navigation`; `trigger`: dropdown open; `visualResponse`: a narrow orange-to-magenta pseudo-element sweeps once from left off-screen to right off-screen behind the resource-center promo; `timing`: starts 200 ms after open, then runs `1.3s ease-in-out forwards`; `layer`: navigation overlay; `evidence`: official inline script declares `SWEEP_DELAY = 200`, adds `.is-sweeping`; CSS defines `nav26-sweep` from `translateX(-100%)` to `translateX(100%)` and disables it for reduced motion; `existing221Duplicate`: **no — unique candidate C**.
  - `semanticName`: **Smoothed decorative parallax**; `中文名`: **平滑装饰图视差**; `category`: `scroll`; `trigger`: page scroll; `visualResponse`: decorative model imagery translates opposite the content flow; `timing`: progress-linked with smoothing `1.5`; `layer`: background/media; `evidence`: official images carry `data-anim="parallax" data-anim-distance="-16" data-anim-smoothing="1.5"`, and the inline controller calls `setupParallax`; `existing221Duplicate`: **yes — Parallax.js / data-driven scroll transforms**.
  - `semanticName`: **Support-card gradient bloom**; `中文名`: **支持卡片渐变绽放**; `category`: `pointer`; `trigger`: hover; `visualResponse`: colored gradient layer becomes visible below card content; `timing`: CSS transition; `layer`: background; `evidence`: `.homeexp_support-card:hover .support-card-hover-gradient`; `existing221Duplicate`: **yes — generic hover background reveal**.

## 15. Sierra

- `company`: Sierra
- `homepage URL`: https://sierra.ai/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Grab-cursor mobile carousel**; `中文名`: **抓取光标移动端轮播**; `category`: `carousel`; `trigger`: pointer/touch drag; `visualResponse`: large cards move horizontally with partial next-card preview; `timing`: direct manipulation; `layer`: content/navigation; `evidence`: official DOM marks the region `aria-label="Carousel"`, wraps it in `cursor-move`, and uses 86%-width flex-basis slides; `existing221Duplicate`: **yes — draggable carousel / Swiper family**.
  - `semanticName`: **Focus-to-full-color brand marks**; `中文名`: **聚焦恢复全彩品牌标志**; `category`: `pointer`; `trigger`: group hover/focus; `visualResponse`: uniformly filtered logos restore full color for the active item; `timing`: CSS transition; `layer`: content; `evidence`: `group-hover:filter-none group-focus-visible:filter-none ... filter-uniform-30`; `existing221Duplicate`: **yes — CSS filter hover**.
  - `semanticName`: **On-demand muted feature films**; `中文名`: **按需静音功能影片**; `category`: `media`; `trigger`: likely card selection or viewport entry (**unverified**); `visualResponse`: three card-sized videos replace their posters; `timing`: unknown; `layer`: media; `evidence`: three official videos are `muted playsinline preload=metadata`, but contain neither autoplay nor source-visible playback handler; `existing221Duplicate`: **unverified-excluded**.

## 16. Cognition

- `company`: Cognition
- `homepage URL`: https://cognition.com/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Four-corner hover crop marks**; `中文名`: **四角裁切标记悬停显现**; `category`: `pointer`; `trigger`: article-card hover; `visualResponse`: four short accent bars appear exactly at the image corners, framing it like an editor crop target; `timing`: CSS opacity transition inherited from the group styling; `layer`: media overlay; `evidence`: every article image is followed by four `aria-hidden` spans positioned `top/left`, `top/right`, `bottom/left`, `bottom/right`, each `opacity-0 group-hover:opacity-100`; `existing221Duplicate`: **no — unique candidate D**.
  - `semanticName`: **Sibling-dimming logo focus**; `中文名`: **同级标志淡出聚焦**; `category`: `pointer`; `trigger`: logo-grid hover; `visualResponse`: non-active logos fade to 10% while the hovered mark gains the accent color; `timing`: 200–400 ms opacity transition; `layer`: content; `evidence`: official classes include `group-hover:opacity-10 duration-200` and active `hover:text-accent ... duration-400`; `existing221Duplicate`: **yes — ordinary group-hover focus/de-emphasis; too close to existing hover-focus patterns**.

## 17. Cursor / Anysphere

- `company`: Cursor (Anysphere)
- `homepage URL`: https://cursor.com/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Direct-manipulation product windows**; `中文名`: **可直接操控的产品演示窗口**; `category`: `pointer`; `trigger`: drag/resize handles (**runtime unverified**); `visualResponse`: IDE and CLI mock windows are presented with eight edge/corner resize zones; `timing`: direct manipulation; `layer`: content; `evidence`: official DOM includes `demo-window-cursor-ide`, `demo-window-cursor-agent-cli`, and `data-resize-handle=true` elements with `cursor-ns-resize`, `ew`, `nwse`, and `nesw`; `existing221Duplicate`: **yes — `Resize-and-rotate transform handles`; excluded because drag behavior could not run**.
  - `semanticName`: **Micro-timed IDE state build**; `中文名`: **微时间轴 IDE 状态搭建**; `category`: `animation`; `trigger`: demo state change; `visualResponse`: text slides by 2 px, bars grow vertically, and tiles pop from 70% scale; `timing`: CSS keyframes, per-step durations not exposed in initial HTML; `layer`: content; `evidence`: official keyframes `fadeSlideUp`, `fadeSlideRight`, `barGrow`, and `tilePopIn`; `existing221Duplicate`: **yes — generic staggered/keyframe choreography**.
  - `semanticName`: **Context tools on row hover**; `中文名`: **行悬停上下文工具显现**; `category`: `pointer`; `trigger`: row hover; `visualResponse`: initially hidden action icons fade in; `timing`: 200 ms; `layer`: overlay; `evidence`: `opacity-0 group-hover:opacity-100 transition-opacity duration-200`; `existing221Duplicate`: **yes — expandable/context toolbar reveal**.

## 18. Replit

- `company`: Replit
- `homepage URL`: https://replit.com/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Orbit-stroke illustration reveal**; `中文名`: **轨道描边插画揭示**; `category`: `vector`; `trigger`: mount/viewport entry (**animation controller unverified**); `visualResponse`: a dotted orbit and its scene can be progressively uncovered by an SVG mask path; `timing`: unknown; `layer`: content/SVG; `evidence`: official SVG defines `mask id="orbit-reveal-mask-v2"`, a path with `stroke-dasharray="0 828.525..."`, and masked orbit content; `existing221Duplicate`: **yes — Vivus / SVG stroke drawing; excluded because controller was not verified**.
  - `semanticName`: **Horizontal bento scroller**; `中文名`: **横向便当卡片滚动区**; `category`: `scroll / carousel`; `trigger`: touch/trackpad scroll; `visualResponse`: design-canvas bento cards travel within a dedicated rail; `timing`: direct manipulation; `layer`: content; `evidence`: `HeroBentoGrid...scrollContainer` and horizontal view classes; `existing221Duplicate`: **yes — native carousel/scroll container**.
  - `semanticName`: **Dot-and-arrow mobile paging**; `中文名`: **圆点与箭头移动端分页**; `category`: `carousel`; `trigger`: swipe or arrow click; `visualResponse`: active pagination dot and slide change; `timing`: carousel transition; `layer`: navigation; `evidence`: official `LoggedOutMobileCarousel...viewport`, `slide`, `dotActive`, and `arrowButton`; `existing221Duplicate`: **yes — Swiper/carousel**.

## 19. Lovable

- `company`: Lovable
- `homepage URL`: https://lovable.dev/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Hover-heartbeat brand mark**; `中文名`: **悬停心跳品牌标志**; `category`: `animation / pointer`; `trigger`: logo hover; `visualResponse`: heart-like logo pulses; `timing`: `1s ease-in-out`; `layer`: navigation/content; `evidence`: official logo link uses `hover:animate-[heartbeat_1s_ease-in-out]`; `existing221Duplicate`: **yes — Hover.css / generic heartbeat**.
  - `semanticName`: **Three-scene build-film stage**; `中文名`: **三幕构建影片舞台**; `category`: `media / transition`; `trigger`: step/scroll activation (**unverified**); `visualResponse`: “Start with an idea”, “Watch it come to life”, and “Refine and ship” videos occupy the same grid cell; inactive scenes are pointer-disabled and opacity 0; `timing`: controller not visible in initial HTML; `layer`: media; `evidence`: three named videos share one grid position, with later wrappers `pointer-events-none opacity-0`; `existing221Duplicate`: **unverified-excluded**, closest is carousel/layout crossfade.
  - `semanticName`: **Layered CTA tint stack**; `中文名`: **分层 CTA 色彩叠栈**; `category`: `pointer`; `trigger`: hover/active/focus; `visualResponse`: several absolute tint layers change opacity with different duration rules; `timing`: 150 ms, hover duration 0 for immediate response; `layer`: button background; `evidence`: repeated absolute `pointer-events-none` layers with `transition-opacity duration-150 group-hover:duration-0`; `existing221Duplicate`: **yes — ordinary layered button hover**.

## 20. Higgsfield (replacement for Windsurf)

- `company`: Higgsfield
- `homepage URL`: https://higgsfield.ai/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Prompt typewriter status**; `中文名`: **提示词打字状态**; `category`: `vector`; `trigger`: mount or prompt example change; `visualResponse`: status text types beside a blinking cursor; `timing`: controller not exposed in initial HTML; `layer`: content/CTA; `evidence`: official classes `hero_typewriterStatus`, `hero_typewriterSizer`, `hero_typewriterText`, and `hero_typingCursor`; `existing221Duplicate`: **yes — Typed.js / segmented text effects**.
  - `semanticName`: **Clipped hover color wash**; `中文名`: **裁剪式悬停色洗**; `category`: `pointer`; `trigger`: card hover; `visualResponse`: an absolute color overlay fades inside the inherited rounded shape without bleeding beyond it; `timing`: 200–300 ms; `layer`: media overlay; `evidence`: official overlay combines `clip-path:inset(0 round .5rem)`, `opacity-0`, and transition-opacity; `existing221Duplicate`: **yes — generic hover overlay plus clip path**.
  - `semanticName`: **Supercomputer status pulse**; `中文名`: **超算状态脉冲点**; `category`: `animation`; `trigger`: mount; `visualResponse`: tiny status dot pulses beside the Supercomputer navigation item; `timing`: configured utility animation; `layer`: navigation; `evidence`: `animate-supercomputer-dot motion-reduce:animate-none`; `existing221Duplicate`: **yes — generic pulse**.

## 21. Manus

- `company`: Manus
- `homepage URL`: https://manus.im/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Contextual scrollbar reveal**; `中文名`: **上下文滚动条显现**; `category`: `scroll / pointer`; `trigger`: scroll-region hover; `visualResponse`: 6 px SimpleBar thumb changes from transparent to visible and brightens while interacting; `timing`: CSS opacity/color transition; `layer`: content/navigation; `evidence`: official wrapper sets `.simplebar-scrollbar` opacity 0, `:hover` opacity 100, and changes `::before` from disabled to tertiary color; `existing221Duplicate`: **yes — SimpleBar / styled native scrollbar surface**.
  - `semanticName`: **Soft-opacity pill CTA**; `中文名`: **柔和透明度胶囊 CTA**; `category`: `pointer`; `trigger`: hover/active; `visualResponse`: pill buttons fade to 90%/80% without layout movement; `timing`: immediate CSS transition; `layer`: primary CTA; `evidence`: official classes `transition-colors hover:opacity-90 active:opacity-80`; `existing221Duplicate`: **yes — generic button hover**.

## 22. Gamma

- `company`: Gamma
- `homepage URL`: https://gamma.app/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Four-card hero carousel**; `中文名`: **四卡首屏轮播**; `category`: `carousel`; `trigger`: autoplay or drag (**unverified**); `visualResponse`: four named hero carousel images rotate or slide near the primary “Start for free” CTA; `timing`: unknown; `layer`: first-fold media; `evidence`: official semantic homepage exposes “Hero Carousel 1” through “Hero Carousel 4”; direct response was a restricted app shell without the carousel controller; `existing221Duplicate`: **unverified-excluded**, closest is Swiper.
  - `semanticName`: **Product-card content relay**; `中文名`: **产品卡内容接力**; `category`: `scroll / transition`; `trigger`: scrolling through product grid (**motion unverified**); `visualResponse`: repeated product tiles lead from Presentations to Documents, API, Social Media, Websites, and Graphics; `timing`: unknown; `layer`: content; `evidence`: the official semantic homepage repeats the six product image/card sequence; `existing221Duplicate`: **unverified-excluded**.

## 23. Kling AI (replacement for Tome)

- `company`: Kling AI
- `homepage URL`: https://kling.ai/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Duration-aware layered hero film handoff**; `中文名`: **按片段时长分层接力的首屏影片**; `category`: `media / transition`; `trigger`: page load and each segment reaching its configured range; `visualResponse`: six absolute hero videos play as a sequence; the current layer fades in while the previous fades out, and the next file is attached just before the handoff; `timing`: per-video `data-range` values 12s/10s/7s/5s/5s/5s, with `0.3s power1.inOut` opacity crossfades and next preload one second before the configured range; `layer`: full-bleed background; `evidence`: official HTML includes `.video-0`…`.video-5`, `preload=auto` only on the first, deferred `data-src` on the rest, and exact `data-range` values; the official first-party bundle reads `dataset.range`, sets the next `src` at `range - 1000`, and crossfades adjacent selectors over 0.3s; `existing221Duplicate`: **no — unique candidate E**.
  - `semanticName`: **Overflow-only announcement marquee**; `中文名`: **仅溢出时启用的公告跑马灯**; `category`: `animation`; `trigger`: text overflow; `visualResponse`: announcement text receives `.is-scrolling` and translates to -50%; `timing`: `10s linear infinite`; `layer`: header; `evidence`: official CSS `.dec.is-scrolling { animation: marquee-443a97d2 10s linear infinite }`; `existing221Duplicate`: **yes — smart ticker / marquee**.
  - `semanticName`: **Expanding mega-menu stage**; `中文名`: **展开式巨型菜单舞台**; `category`: `transition`; `trigger`: nav hover; `visualResponse`: hover container changes from height/opacity zero and activates one panel; `timing`: source state transition; `layer`: navigation overlay; `evidence`: official `.hover-container` and `.panel-wrapper.is-active` states; `existing221Duplicate`: **yes — layered full-screen/menu transition**.

## 24. Ideogram

- `company`: Ideogram
- `homepage URL`: https://ideogram.ai/
- `checkedAt`: `2026-07-17`
- `access`: official semantic homepage was available; direct HTML was a Cloudflare challenge.
- `observedEffects`:
  - `semanticName`: **Duplicated image-gallery belt**; `中文名`: **复制拼接图片画廊带**; `category`: `carousel / media`; `trigger`: likely autoplay or horizontal drag (**unverified**); `visualResponse`: a long “In practice” gallery repeats the same 40 linked images twice, a common seamless-loop construction; `timing`: unknown; `layer`: content; `evidence`: official semantic homepage lists image links 23–62 and immediately repeats links 23–62; no motion CSS was accessible; `existing221Duplicate`: **unverified-excluded**, likely `Seamless logo-loop marquee`/carousel pattern.
  - `semanticName`: **Category-filtered practice gallery**; `中文名`: **分类筛选实践画廊**; `category`: `transition`; `trigger`: selecting General/Poster/Covers/Photography/Logo/Creative/Print-on-demand (**unverified**); `visualResponse`: expected gallery set replacement; `timing`: unknown; `layer`: content/navigation; `evidence`: official semantic homepage exposes those seven category controls immediately before the image field; `existing221Duplicate`: **unverified-excluded**, closest is Isotope/filtering.

## 25. Stability AI

- `company`: Stability AI
- `homepage URL`: https://stability.ai/
- `checkedAt`: `2026-07-17`
- `observedEffects`:
  - `semanticName`: **Three-domain looping video cards**; `中文名`: **三领域循环视频卡片**; `category`: `media`; `trigger`: likely viewport or hover (**start trigger unverified**); `visualResponse`: Marketing, Gaming, and Entertainment cards each contain muted looping footage; `timing`: native video loop; `layer`: media surface; `evidence`: official HTML contains the three named MP4s with `muted playsinline loop` but no autoplay attribute; `existing221Duplicate`: **unverified-excluded**, ordinary media-card playback.
  - `semanticName`: **Before/after media comparator**; `中文名`: **前后对比媒体滑杆**; `category`: `media / pointer`; `trigger`: slider drag; `visualResponse`: reveal boundary compares two visual states; `timing`: direct manipulation; `layer`: media surface; `evidence`: official homepage includes `wm-before-after-slider-css`; `existing221Duplicate`: **yes — exact `img-comparison-slider` entry**.
  - `semanticName`: **Summary-card carousel controls**; `中文名`: **摘要卡片轮播控制**; `category`: `carousel`; `trigger`: previous/next click; `visualResponse`: side-by-side article cards page horizontally; `timing`: carousel transition; `layer`: content/navigation; `evidence`: Squarespace markup includes `summary-carousel-pager-prev`, `summary-carousel-pager-next`, and `sqs-gallery-design-carousel-slide`; `existing221Duplicate`: **yes — carousel family**.

## Unique candidates with dependency-free snippets

Only the following five effects are proposed for addition. Every one has explicit official-source evidence and a visual/interaction contract not represented by the current 221-effect baseline.

### Candidate A — Device-silhouette masked video / 设备轮廓蒙版视频

`source`: Pika — https://pika.art/

`dedup rationale`: the catalog covers image cropping, comparison sliders, zoom, filters, and shader transitions, but not a continuously playing HTML video whose visible pixels are defined by an arbitrary alpha mask. This is a media-surface composition primitive, not another rectangular video card.

```html
<div class="device-film">
  <video autoplay muted loop playsinline poster="poster.webp">
    <source src="demo.webm" type="video/webm">
  </video>
</div>

<style>
.device-film { width:min(72vw, 420px); aspect-ratio:9/19; }
.device-film video {
  width:100%; height:100%; object-fit:cover;
  -webkit-mask:url("phone-silhouette.png") center / 98% 98% no-repeat;
          mask:url("phone-silhouette.png") center / 98% 98% no-repeat;
  opacity:1; transition:opacity .3s ease;
}
@media (prefers-reduced-motion:reduce) { .device-film video { display:none; } }
</style>
```

### Candidate B — Blend-mode self-inverting navigation / 混合模式自反色导航

`source`: Luma AI — https://lumalabs.ai/

`dedup rationale`: no existing entry uses compositor blending to keep a fixed navigation layer legible as it crosses unrelated light/dark sections. It is neither a scripted theme transition nor a scroll-direction header; the underlying pixels continuously determine the result.

```html
<nav class="adaptive-nav"><a href="#top">LUMA</a><a href="#work">Work</a></nav>
<section class="light" id="top"></section><section class="dark" id="work"></section>

<style>
.adaptive-nav {
  position:fixed; inset:18px 20px auto; z-index:10;
  display:flex; justify-content:space-between;
  color:#fff; mix-blend-mode:difference;
}
.light { min-height:100vh; background:#fff; }
.dark  { min-height:100vh; background:#090909; }
</style>
```

### Candidate C — Delayed dropdown promo sweep / 延迟触发的下拉菜单推广光扫

`source`: Glean — https://www.glean.com/

`dedup rationale`: existing shine/text-sweep effects continuously decorate a control or sweep through glyphs. This effect is a one-shot, delayed orientation cue bound to a menu-open event, travels behind a specific promo row, parks off-screen, and explicitly resets for the next open.

```html
<button id="products" aria-expanded="false">Products</button>
<div id="menu" hidden><a class="promo" href="#">Explore the resource center →</a></div>

<style>
.promo { position:relative; isolation:isolate; display:block; overflow:hidden; padding:18px; }
.promo::after {
  content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
  background:linear-gradient(88deg,transparent 34%,#ef601b66 48%,#e16bff66 55%,transparent 68%);
  transform:translateX(-100%);
}
.promo.is-sweeping::after { animation:promo-sweep 1.3s ease-in-out forwards; }
@keyframes promo-sweep { to { transform:translateX(100%); } }
@media (prefers-reduced-motion:reduce) { .promo.is-sweeping::after { animation:none; } }
</style>

<script>
const trigger = document.querySelector('#products');
const menu = document.querySelector('#menu');
const promo = document.querySelector('.promo');
let sweepTimer;
trigger.addEventListener('click', () => {
  const open = trigger.getAttribute('aria-expanded') !== 'true';
  trigger.setAttribute('aria-expanded', open);
  menu.hidden = !open;
  clearTimeout(sweepTimer); promo.classList.remove('is-sweeping');
  if (open) sweepTimer = setTimeout(() => promo.classList.add('is-sweeping'), 200);
});
promo.addEventListener('animationend', () => promo.classList.remove('is-sweeping'));
</script>
```

### Candidate D — Four-corner hover crop marks / 四角裁切标记悬停显现

`source`: Cognition — https://cognition.com/

`dedup rationale`: the existing target-reticle effect moves a cursor-following reticle, and the focus-window headline moves a frame between words. Here four independent editorial crop marks belong to the card media and appear only on intent, giving still imagery a precise tool-like focus state without moving the cursor or content.

```html
<a class="crop-card" href="#"><img src="story.jpg" alt="Story"><i></i><i></i><i></i><i></i></a>

<style>
.crop-card { position:relative; display:block; color:#ff5a36; }
.crop-card img { display:block; width:100%; }
.crop-card i { position:absolute; width:4px; height:14px; background:currentColor; opacity:0; transition:opacity .18s ease; }
.crop-card i:nth-of-type(1) { top:0; left:0; }
.crop-card i:nth-of-type(2) { top:0; right:0; }
.crop-card i:nth-of-type(3) { bottom:0; left:0; }
.crop-card i:nth-of-type(4) { bottom:0; right:0; }
.crop-card:hover i, .crop-card:focus-visible i { opacity:1; }
</style>
```

### Candidate E — Duration-aware layered hero film handoff / 按片段时长分层接力的首屏影片

`source`: Kling AI — https://kling.ai/

`dedup rationale`: `GL Transitions` switches two media frames with shaders and the catalog has scroll-scrubbed video. This is a different operational pattern: a cinematic playlist made from stacked native videos, each with its own editorial range, just-in-time loading of the next clip, and a short opacity handoff. It avoids both a single huge edit and eager loading every segment.

```html
<div class="film-sequence">
  <video class="active" muted playsinline preload="auto" data-range="12" src="part-1.mp4"></video>
  <video muted playsinline preload="none" data-range="10" data-src="part-2.mp4"></video>
  <video muted playsinline preload="none" data-range="7" data-src="part-3.mp4"></video>
</div>

<style>
.film-sequence { position:relative; min-height:100vh; overflow:hidden; background:#000; }
.film-sequence video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0; transition:opacity .3s ease-in-out; }
.film-sequence video.active { opacity:1; }
@media (prefers-reduced-motion:reduce) { .film-sequence video { display:none; } .film-sequence video:first-child { display:block; opacity:1; } }
</style>

<script>
const clips = [...document.querySelectorAll('.film-sequence video')];
let index = 0, armed = false;
function ensureLoaded(video) {
  if (!video.src && video.dataset.src) { video.src = video.dataset.src; video.load(); }
}
function play(indexToPlay) {
  const current = clips[indexToPlay], next = clips[(indexToPlay + 1) % clips.length];
  ensureLoaded(current); armed = false; current.currentTime = 0; current.play();
  current.ontimeupdate = () => {
    const range = Number(current.dataset.range);
    if (!armed && current.currentTime >= range - 1) { armed = true; ensureLoaded(next); }
    if (current.currentTime >= range) {
      current.ontimeupdate = null; current.pause(); current.classList.remove('active');
      next.classList.add('active'); index = (indexToPlay + 1) % clips.length; play(index);
    }
  };
}
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) play(index);
</script>
```

## Batch result

- Valid AI-native homepages: **25**
- Verified unique candidates: **5**
- Unverified observations admitted as candidates: **0**
- Replacements: **Tome → Kling AI**, **Windsurf → Higgsfield**
