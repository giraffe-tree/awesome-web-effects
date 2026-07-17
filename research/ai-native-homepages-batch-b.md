# AI-native homepage interaction research — batch B

- `checkedAt`: `2026-07-17`
- Valid samples: **25**
- Distinct, good-looking candidates after comparison with the repository's 221-effect catalog: **6**
- Surfaces checked for every accepted sample: hero/first screen, scroll-linked source markers, pointer/hover state markers, and primary CTA/media controls.

## Method and limitation

The requested in-app Browser path was attempted first, but the shared browser runtime failed during bootstrap with `Cannot redefine property: process`. Per the task coordinator's fallback instruction, this batch uses two complementary sources: the official homepage as opened by the web reader, and the official page's live HTML/CSS/JS/media assets fetched on `2026-07-17` with a desktop browser user agent.

Consequences:

- An effect is marked as observed only when the delivered page contains an explicit state pair, keyframe, media attribute, interaction handler, observer, or named animation module. Search-result descriptions alone were not treated as interaction evidence.
- Hover/scroll behavior whose trigger could not be proven in source is described as `unverified` and is never promoted as a distinct candidate.
- Timing is exact when it appears in CSS/JS; otherwise it is recorded as continuous or unverified.
- This is source-backed interaction research, not pixel-level runtime visual QA. A later visual-browser pass should confirm compositing and subjective appearance before catalog ingestion.

## Replacement audit

Four requested sites could not yield a usable homepage sample through either reader or fetched DOM, so they were replaced with AI-native peers:

| Requested | Reason excluded | Replacement | Category match |
| --- | --- | --- | --- |
| xAI | Official homepage returned Cloudflare `403` and only an interstitial DOM. | Sakana AI | Frontier-model / AI research company |
| AI21 Labs | Official homepage returned Cloudflare `403` and only an interstitial DOM. | Poolside | Foundation-model / agentic coding company |
| Ada | Official homepage returned Cloudflare `403` and only an interstitial DOM. | Factory | AI-native applied-agent platform |
| Dust | Official URL returned a 2.7 KB client shell with zero reader lines and no inspectable homepage interaction DOM. | Augment Code | Enterprise software-agent platform |

## 25 accepted homepage records

### 1. Cohere

- `company`: Cohere
- `homepage URL`: <https://cohere.com/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hover-lift mega-menu / 悬停上浮式大菜单 | Navigation & overlays | Pointer enters a top-level navigation item | The submenu changes from `translate-y-2 opacity-0 pointer-events-none` to an interactive visible panel; nested arrows translate right. | `300ms ease-in-out` | Fixed navigation overlay above the page | Delivered classes include `transition-all duration-300 ease-in-out -translate-y-2 opacity-0 pointer-events-none` and `group-hover/...:pointer-events-auto`; drawer arrows use `group-hover/...:translate-x-1`. | **Yes** → `Nested menu and submenu transition`, `Reusable CSS hover vocabulary` |
| Gradient underline growth / 渐变下划线生长 | Pointer & hover | Link hover | A 1 px coral-violet-blue line grows horizontally from zero width. | CSS width transition; exact duration not encoded on this node | Navigation/link decoration | Homepage DOM contains an absolute `h-[1px] w-0 bg-gradient-to-r` element with `transition-[width] from-coral-500 via-violet-500 to-blue-500`. | **Yes** → `Reusable CSS hover vocabulary` |

### 2. Mistral AI

- `company`: Mistral AI
- `homepage URL`: <https://mistral.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Autoplay Lottie hero field / 自动播放 Lottie 首屏 | Text & SVG | Page load / hero enters initial render | A full-size vector animation fills the hero media plane, while its parent fades in. | Parent: `0.6s`, `0.3s` delay; Lottie loops continuously | Hero background/media | A `<canvas>` sits inside `<mistral-block-richmedia-lottie data-src="...hero-mistral-ai-lottie-2.svg.lottie" data-loop="true" data-autoplay="true">`; its ancestor has `animate-[fade-in_0.6s_0.3s_ease-in-out_both]`. | **Yes** → `After Effects vector playback`, `CSS class entrance animation` |
| Two-position icon handoff / 双位置图标接力 | Pointer & hover | CTA hover | One icon translates into place while the alternate position yields, creating a passing-arrow cue. | `300ms`, incoming icon delayed `100ms` | CTA foreground | CTA spans use `translate-x-(--icon-left-x)`, `group-hover:translate-x-0`, `group-hover:delay-100`, `transition-all duration-300`. | **Yes** → `Reusable CSS hover vocabulary` |

### 3. Sakana AI (replacement for xAI)

- `company`: Sakana AI
- `homepage URL`: <https://sakana.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Drag-spawned DOM-aware fish flock / 拖拽生成且避让 DOM 的鱼群 | Canvas & 2D | Continuous simulation; pointer drag adds fish until the counter reaches 250 | Seventy logo-shaped fish flock using separation, alignment, and cohesion. The newest fish becomes a red independent leader; dragged fish join the school. All fish predict their future path and curve around the breathing Fugu CTA instead of passing through it. | One p5 `draw()` per animation frame; speed cap `3`, steering force `0.05`; obstacle prediction looks about `50` frames ahead | Full-viewport canvas behind the page plus a live DOM CTA obstacle | Official `sketch.js` creates 70 boids, implements `mouseDragged()`, three Reynolds flocking forces, a noise-driven red leader, and `avoid(fuguBounds)`. `refreshFuguBounds()` measures `.fugu-cta` at its peak scale; a hard collision fallback reflects velocity with `0.6` damping. | **No** → candidate 1; closest `Emergent attraction-repulsion swarm` has particle-to-particle rules but not drag-spawned flocking coordinated with predictive avoidance of a breathing DOM control |
| Hover-accelerated breathing Fugu CTA / 悬停加速呼吸河豚 CTA | Pointer & hover | Continuous; hover accelerates | The floating Fugu scales from 1 to 1.10 and back; hover strengthens the red drop shadow and speeds its breathing. | `3.2s ease-in-out infinite`; hover changes duration to `1.4s`; shadow transition `250ms` | Floating bottom-right CTA, also used as the flock's obstacle | Official CSS defines `.fugu-cta img{animation:fugu-breathe 3.2s...}`, hover duration `1.4s`, a stronger drop shadow, focus outline, and a reduced-motion opt-out. | **Yes alone** → CSS breathing/hover vocabulary; its coupling to the flock is what makes candidate 1 distinct |

### 4. Google DeepMind

- `company`: Google DeepMind
- `homepage URL`: <https://deepmind.google/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Theme-switched looping media tiles / 随主题切换的循环媒体卡 | Media & image | Page load plus light/dark theme selection | Poster-backed videos autoplay, mute, loop, and use alternate theme sources where available. | Continuous loop; lazy tiles preload metadata | Card/section media | Homepage contains ten `<video>` elements with `autoplay loop muted playsinline`; hero examples also carry `data-has-alt-videos="true"`, `data-preload="metadata"`, and `light-mode`. | **Yes** → responsive custom media / autoplay-loop presentation, no distinct semantic |
| Outline CTA hover / 描边 CTA 悬停 | Pointer & hover | CTA hover | Navigation CTA changes to its outlined hover state. | Exact duration unverified | Navigation foreground | Primary navigation anchors include the explicit class `button--hover_outline`. | **Yes** → `Reusable CSS hover vocabulary` |

### 5. Poolside (replacement for AI21 Labs)

- `company`: Poolside
- `homepage URL`: <https://poolside.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Visibility-gated agent-terminal replay / 可见性门控 Agent 终端回放 | Motion & choreography | Terminal enters the viewport; `Escape` interrupts while submitted/working | A terminal types a randomly chosen coding prompt, advances thinking/tool/bash/text steps, streams bash output line by line, updates a spinner and elapsed seconds, types `/new`, resets, and rotates to the next script. Offscreen execution pauses; reduced-motion shows the completed transcript. | Prompt typing `40ms/char` in shipped scripts; steps `1600ms`; bash lines `80ms`; spinner `80ms`; done beat `800ms`; loop delay `4s`; `/new` `100ms/char` | Hero terminal window and status bar | Official Svelte node implements states `idle`, `typing`, `submitted`, `working`, `done`, `interrupted`, starts/stops through an in-view observer with bottom margin `-50px`, handles `Escape`, and cycles three complete audit/retry/test scripts. | **Yes** → `Looping typewriter sequence` plus `Staggered transform choreography`; the terminal content is richer, but the interaction primitive is already represented |
| Theme-aware visibility-paused shader plate / 主题感知且离屏暂停的着色器底板 | 3D & WebGL | Canvas enters/leaves viewport or theme changes | A full-canvas fragment shader renders circular, vertical, or Voronoi procedural patterns, swaps light/dark palettes, and fades in after its first frame. Animation pauses offscreen. | `requestAnimationFrame`; preset speeds `1` or `0.3`; canvas opacity transition `1000ms` | Terminal/card background | Official homepage module compiles WebGL vertex/fragment shaders, updates `uTime` and pattern/color/warp/noise uniforms, selects theme presets, and starts/stops rendering through an in-view helper. | **Yes** → `Full-page fragment shader backdrop` / `Drop-in animated WebGL background` |

### 6. Writer

- `company`: Writer
- `homepage URL`: <https://writer.com/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Vertical rotating value rail / 纵向轮换价值文案 | Text & SVG | Swiper initialization; interval unverified | Hero/value phrases occupy a vertical Swiper rail and rotate as slides. | Swiper runtime timing unverified | Headline/text layer | The homepage contains `class="swiper vertical_scroll_text"` and loads `swiper@11/swiper-bundle.min.js`. | **Yes** → `Segmented rotating word slot` / carousel primitives |

### 7. Jasper

- `company`: Jasper
- `homepage URL`: <https://www.jasper.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Visibility-gated Rive hero / 可见性门控 Rive 首屏 | Motion & choreography | IntersectionObserver at 10% visibility, plus tab visibility | The Rive state machine starts rendering/playing in view and pauses plus stops rendering offscreen. Mobile uses a separate artboard. | Observer threshold `0.1`, root margin `50px`; continuous while visible | Hero canvas | Inline JS targets `#rive-hero`, loads `home_hero.riv`, selects `home_hero` or `home_hero_mobile`, sets `autoplay:isVisible`, and explicitly calls `play/pause/startRendering/stopRendering`. | **Yes** → `Interactive vector state machine` |
| Split-text section choreography / 分词段落编舞 | Scroll & reveal | Section animation controller / viewport; exact trigger unverified | Headline fragments animate as split text while sliders coordinate their own transitions. | Runtime timing unverified | Section heading and slider | The official DOM includes named embeds `page_split_text_animation` and `page_slider_animations`. | **Yes** → `Staggered transform choreography`, `Data-attribute viewport reveal` |

### 8. Copy.ai

- `company`: Copy.ai
- `homepage URL`: <https://www.copy.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Reversible Lottie menu icon / 可逆 Lottie 菜单图标 | Navigation & overlays | Burger click | A non-autoplay Lottie icon runs forward/reverse to morph between menu states. | Asset default duration `2.5833s`; Webflow interaction may scrub a subset | Navigation control | `nav_burger-lottie` has `data-animation-type="lottie"`, `data-loop="0"`, `data-autoplay="0"`, `data-direction="1"`, `data-default-duration="2.583333..."`, and `data-ix2-initial-state="0"`. | **Yes** → `Interactive vector state machine`, `Nested off-canvas navigation panels` |
| Continuous CTA illustration / 持续循环 CTA 插画 | Motion & choreography | CTA section load | An SVG-rendered Lottie illustration loops around the conversion CTA. | Continuous loop | CTA background/decoration | `cta--lottie` points to `Copy-ai2.json` and declares `data-loop="1" data-autoplay="1" data-renderer="svg"`. | **Yes** → `After Effects vector playback` |

### 9. Typeface

- `company`: Typeface
- `homepage URL`: <https://www.typeface.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Muted looping product tour / 静音循环产品导览 | Media & image | Page load | A Wistia product-tour player autoplays silently and loops as an explanatory visual. | Continuous playlist loop | Hero/product media | Official homepage emits `<wistia-player autoplay="true" muted="true" playlist-loop="true" class="pointer-events-none">`. | **Yes** → standard autoplay product media |
| Underline-selected solution tabs / 下划线选中方案标签 | Navigation & overlays | Tab click | Selected team tab receives the dark bottom border and swaps the associated copy/visual panel. | Exact panel timing unverified | Mid-page tab navigation | The rendered tab buttons include a selected state with `border-b ... border-[#111013] text-[#111013]`; page text exposes Marketing, IT, and Creative team panels. | **Yes** → `Adaptive-height tab panel slide` |

### 10. Hebbia

- `company`: Hebbia
- `homepage URL`: <https://www.hebbia.com/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Predecoded scroll-scrubbed helix / 预解码滚动擦洗螺旋 | Scroll & reveal | Window scroll across the hero section | A hidden hero video is sampled into up to 120 `ImageBitmap` frames; scroll progress selects and draws one frame to a 2D canvas. | One `requestAnimationFrame` per scroll event; source sampled at about 30 fps, capped at 120 frames | Hero canvas over fallback video | Official `helix-canvas.js` queries `.hero__helix` and `.hero__canvas`, seeks from 20% of the source duration, calls `createImageBitmap`, computes clamped section progress, and `drawImage`s the selected bitmap. Mobile Safari/Firefox receive `hero--helix-fallback`. | **Yes** → `Scroll-controlled video scrubbing` |
| Scroll-aware feature table of contents / 滚动感知功能目录 | Scroll & reveal | Scroll or TOC click | The last feature whose top is at or above 120 px becomes active; clicks smooth-scroll to the section; 70%-visible diagrams play once. | Passive scroll listener; diagram threshold `0.7`; smooth native scroll | Sticky feature navigation and diagram foreground | `featureScroller.module.js` reads item `getBoundingClientRect().top<=120`, toggles `.is-active`, uses `scrollIntoView({behavior:"smooth"})`, and adds `fsDiagram--visible` from an IntersectionObserver. | **Yes** → `Step-based scrollytelling`, `Conditional focus-to-target scroll` |

### 11. Augment Code (replacement for Dust)

- `company`: Augment Code
- `homepage URL`: <https://www.augmentcode.com/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ASCII orchestration signal sweep / ASCII 编排信号扫过 | Canvas & 2D | Cosmos canvas enters/leaves the viewport; theme or reduced-motion changes | A field of small `.`, `+`, `x`, `-`, `*` symbols twinkles while a traveling intensity front reveals a denser, architecture-shaped character band. It pauses offscreen and renders a static frame for reduced motion. | Capped at `45fps`; one sweep takes `11s`; observer threshold `0.08` | Full-width canvas behind the “Meet Cosmos” heading | Official canvas module draws both ambient and structure character arrays, computes the moving front from `(time % 11000) / 11000`, runs only while intersecting, and listens to resize, visibility, and reduced-motion changes. | **Yes** → `Smooth matrix letter-glitch field` / `Generated CSS grid pattern animation`; not promoted as a distinct candidate |
| Inertial vertical enterprise feature rail / 惯性竖向企业能力轨 | Pointer & hover | Pointer drag, release, viewport visibility | Dragging moves a tall feature list directly; release retains clamped velocity and resumes an automatic upward drift. A small drag indicator appears on hover/drag. | Frame-driven velocity decay; automatic target velocity about `-22px/s`; observer threshold `0.08` | Enterprise feature list | Official component captures the pointer, derives velocity from `deltaY / deltaTime` capped to ±900, translates the track with `translate3d`, then resumes a `requestAnimationFrame` loop; it pauses offscreen, hidden-tab, or reduced-motion states. | **Yes** → `Inertial custom scroll container`, `Momentum touch carousel` |
| Visibility-looped demo preview with hover focus / 可见即循环且悬停聚焦的演示预览 | Media & image | Within `320px` root margin; hover changes presentation | The muted Cosmos demo loops while near the viewport, pauses when hidden/offscreen, and on hover grows to 1.02 while opacity rises from 78% to 100%. | Hover `300ms`; IntersectionObserver threshold `0.01` | Demo-card media | Official module controls `play/pause/currentTime`, observes with `rootMargin:"320px 0px"`, and the video classes declare `duration-300 group-hover:scale-[1.02] group-hover:opacity-100`. | **Yes** → viewport media activation plus `Reusable CSS hover vocabulary` |

### 12. Lindy

- `company`: Lindy
- `homepage URL`: <https://www.lindy.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Scripted assistant typing-and-chip sequence / 助手输入与快捷回复编舞 | Motion & choreography | Demo sequence enters a reply state | Three dots bounce with stagger, the typing bubble fades/rises in, and a chip rail expands from height zero; simulated taps compress a chip. | Bubble `180ms`; dots `1.15s` with `160ms` stagger; rail `340ms`; tap `420ms` | Phone/demo UI foreground | Inline CSS defines `.lp-typing.is-in`, three delayed `.lp-typing-dot`s, `@keyframes lp-typing`, `.lp-chips-host` height transition, and `.lp-chip.is-demo-tap` / `lp-demo-tap`. | **Yes** → `Staggered transform choreography`, generic chat-demo choreography |
| Continuous logo marquee / 连续标志跑马灯 | Motion & choreography | Page load | Brand marks traverse a repeated rail. | Continuous; exact duration not captured in accepted evidence | Trust section | Page defines `@keyframes marquee` and `marquee-scroll` and loads `webflow-marquee` handler. | **Yes** → `Seamless logo-loop marquee` |

### 13. Clay

- `company`: Clay
- `homepage URL`: <https://www.clay.com/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Interaction-history hiring badge / 交互历史驱动招聘徽章 | Pointer & hover | Third pointer entry on the Jobs link; fourth entry resets | The yellow “We are hiring!” badge wiggles on every hover, but on the third hover its copy changes to “Stop hovering, come join us!”. | Wiggle `150ms ease`, 2 iterations; label transform transition `120ms` | Footer link pseudo-element | Official JS increments `hoverCount` on `mouseenter`, adds `.third-hover` at 3, removes it at 4; official CSS changes `[data-jobs].third-hover:after` content and runs `@keyframes bouncy`. | **No** → candidate 2; the existing catalog has hover styles but no history/state-count-triggered microcopy |
| Counter-moving vertical CTA columns / 反向移动 CTA 竖列 | Motion & choreography | Continuous | Decorative content columns translate `-400%` and `+400%` in opposite vertical directions. | `40s linear infinite` | CTA background decoration | CSS defines `marquee-up`, `marquee-down`, `.cs-cta_marquee > * { animation-duration:40s }`, and direction classes. | **Yes** → `Counter-moving split-screen panels` / marquee family |

### 14. Decagon

- `company`: Decagon
- `homepage URL`: <https://decagon.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Scroll-speed parallax layer / 滚动速度差视差层 | Scroll & reveal | Scroll | A marked visual layer moves with a speed/ease ratio distinct from document scroll. | `data-scroll-speed="1"`, `data-scroll-ease="1"`; exact runtime curve unverified | Section media/decorative layer | Homepage includes a `parallax-js` embed and explicit `data-scroll-speed` / `data-scroll-ease` attributes. | **Yes** → `Data-driven scroll transforms` |
| Timed tab-carousel progress bar / 定时标签轮播进度条 | Navigation & overlays | Carousel autoplay or tab selection | The active tab's bar advances while the associated customer/product panel occupies the carousel. | Exact duration unverified | Tab navigation and panel | DOM repeats `.carousel_tab_animated-bar`, includes carousel tabs, and loads both Swiper and GSAP. | **Yes** → `Adaptive-height tab panel slide`, carousel primitives |

### 15. Factory (replacement for Ada)

- `company`: Factory
- `homepage URL`: <https://factory.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Staged live-factory dashboard assembly / 分阶段装配实时工厂仪表盘 | Motion & choreography | Initial hero render | The entire dark dashboard grows from 18% scale while fading in; internal SVG regions then appear with individual delay variables, live indicators pulse, and a radar sweep rotates continuously. | Frame `900ms` after `120ms`; segment fades `520ms` with per-segment delays; pulse `1200ms`; radar `3500ms linear infinite` | Hero SVG dashboard, nested telemetry segments | Official inline CSS defines `sfDashboardFrameIn`, `sfDashboardSegmentIn`, `sfDashboardPulse`, and `sfRadarSweep`; the accessible SVG describes live pipelines, automations, throughput, PR validation, and incident telemetry and assigns `--sf-delay` to groups. Reduced-motion leaves all regions fully visible. | **Yes** → `Staggered transform choreography`, `CSS class entrance animation`, `Animated circular gauge fill` |
| Hover-started diagonal CTA conveyor / 悬停启动斜纹 CTA 传送带 | Pointer & hover | CTA hover or focus-visible | A previously paused diagonal stripe pattern fades in and slides continuously beneath inverted button colors. | Fade `100ms`; stripe loop `2000ms linear infinite`; foreground color `150ms` | CTA background beneath text | Primary buttons contain an opacity-zero overlay with `group-hover:animate-[delayedFadeIn_100ms...]`; its child is initially `paused` and becomes `running` on hover/focus while using `slidePattern_2000ms_linear_infinite`. | **Yes** → `Reusable CSS hover vocabulary`, animated background pattern |

### 16. PolyAI

- `company`: PolyAI
- `homepage URL`: <https://poly.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Traveling-dot headline eraser/writer / 旅行圆点擦写标题 | Text & SVG | Page load; infinite timeline | A ball traverses the current word while characters disappear in reverse, waits, moves to the next word's far edge, then reveals its characters forward. | `2s` hold; per-character stagger `30ms`; per-character opacity duration factor `25ms`; `250ms` hidden beat; initial ball fade `300ms` | Headline foreground | Official animated-heading module SplitTexts `.animated-heading-word`, measures word edges, reverses outgoing chars, moves `.animated-heading-ball`, hides outgoing characters, and reveals the next word; timeline repeats infinitely. | **No** → candidate 3; unlike `Segmented rotating word slot`, the moving spatial marker acts as both eraser and writer |
| Autoplay product media tile / 自动播放产品媒体卡 | Media & image | Page load | Muted square video loops inside a cover-fit tile. | Continuous | Section card media | Homepage video carries `autoplay loop muted playsinline` and a responsive poster. | **Yes** → standard looping media tile |

### 17. Bland AI

- `company`: Bland AI
- `homepage URL`: <https://www.bland.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Scroll-activated implementation timeline / 滚动激活实施时间线 | Scroll & reveal | Timeline wrapper receives `.is-active` / mobile items become visible | Milestone dots pop with overshoot, a live dot emits a halo, and milestone labels fade/slide into position with per-item delays. | Pop `380ms` spring-like cubic Bézier; label `360ms`; pulse `2.4s infinite` | Timeline rail, dots, labels | CSS defines `.hpv5-impl-track-wrap.is-active`, `hpv5-impl-dot-pop`, `hpv5-impl-live-pulse`, delay variables, and reduced-motion fallbacks. | **Yes** → `Step-based scrollytelling`, `Data-attribute viewport reveal` |
| Live-call status pulse / 通话中状态脉冲 | Motion & choreography | Live state | A small status dot repeatedly dims or expands a halo to imply an active call. | `2s` or `2.4s` infinite depending component | Product-demo status foreground | Homepage CSS includes `.live-call-dot{animation:2s ... live-call-pulse}` and `.hpv5-live-dot{animation:2.4s ... hpv5-live-pulse}`. | **Yes** → generic status/pulse motion |

### 18. Vapi

- `company`: Vapi
- `homepage URL`: <https://vapi.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Synchronized scenario scene handoff / 场景同步换幕 | Navigation & overlays | Selecting a demo scenario such as Customer Support or Lead Qualification | Two full-bleed hero videos crossfade, the content plane slides, a dimming overlay crossfades, and the scenario label enters as a perspective flap with damped overshoot. | Video/overlay crossfade `420ms`; content slide `520ms`; label keyframe uses 0%, 55%, 80%, 100% overshoot stages | Background videos, overlay, content plane, label foreground | HTML has two absolute looping videos at opacity 1/0, `duration-(--duration-cross)`, content `duration-[var(--duration-slide)]`, and a label with `animate-[var(--animate-fhero-flap-in)]`; CSS tokens resolve to `.42s` / `.52s`, and `fhero-flap-in` starts at `translateY(100%) rotateX(75deg)`. | **No** → candidate 4; existing tab/flip effects do not synchronize a background media handoff, plane slide, and springy 3D label as one state transition |
| Press-and-frost CTA control / 毛玻璃按压 CTA | Pointer & hover | Hover/press on hero controls | Semi-transparent black controls lighten and the main CTA compresses to 95% on active press. | Quick color token; CTA `300ms` | Hero control foreground | Hero buttons use `bg-black/30 backdrop-blur`, `hover:bg-white/[.16]`; primary CTA includes `transition-all duration-300 active:scale-95`. | **Yes** → `Reusable CSS hover vocabulary` |

### 19. Retell AI

- `company`: Retell AI
- `homepage URL`: <https://www.retellai.com/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Looping voice visualizer panels / 循环语音可视化面板 | Media & image | Page/section activation | Muted, autoplaying visualizer videos fill product panels and loop. | Continuous | Product-card media background | Official homepage emits `.lazy.fill-video` and other videos with `autoplay loop muted playsinline`; sources are explicitly named `voice-visualizer`. | **Yes** → standard autoplay-loop product media |
| Feature-icon Lottie loop / 功能图标 Lottie 循环 | Motion & choreography | Runtime mounts the feature list | Small latency, voice, and turn-taking illustrations loop beside feature copy. | Continuous when mounted; exact mount threshold unverified | Feature-list icon | Thirteen `<lottie-player>` elements point to named JSON assets such as `optimized-icon-latency.json` and `optimized-turn-taking.json`, each with `loop`. | **Yes** → `After Effects vector playback` |

### 20. Hume AI

- `company`: Hume AI
- `homepage URL`: <https://www.hume.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Canvas-backed pastel research plate / Canvas 柔彩研究底板 | Canvas & 2D | Canvas runtime / page load; actual drawing motion unverified | A full-bleed canvas sits behind the research/leaderboard content with a pink-peach-lilac gradient fallback. No dynamic claim is made. | Dynamic timing unverified | Section background | Two full-size canvases have `absolute inset-0 h-full w-full` and inline `linear-gradient(135deg,#F0E0F0 ... #EDD8F0)` fallback styling. | **Yes/Unverified** → canvas backdrop; insufficient evidence for a new effect |
| Opacity-shift pill CTA / 透明度变化胶囊 CTA | Pointer & hover | CTA hover | Filled pill reduces opacity slightly while retaining a 300 ms all-property transition. | `300ms` | CTA foreground | Homepage CTA uses `rounded-full ... hover:opacity-90 transition-all duration-300`. | **Yes** → `Reusable CSS hover vocabulary` |

### 21. Tavus

- `company`: Tavus
- `homepage URL`: <https://www.tavus.io/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Playable branded Minesweeper footer / 可玩的品牌扫雷页脚 | Canvas & 2D | Cell hover/click and New Game | Cells reveal, hover-highlight, show bomb/fade-pixel states, and reset as a complete mini-game. | Cell/title CSS includes a `2000ms` pulse; game timing is script driven | Footer interactive surface | Homepage includes `.minesweeper-embed`, cell hover/revealed states, `msTitlePulse 2000ms`, and loads `webflow-minesweeper/minsweeperv2.js`. | **Yes** → `Browser game scene lifecycle` |
| Duration-token logo marquee / 时长参数化标志跑马灯 | Motion & choreography | Page load | Company logos traverse a continuous rail. | `data-marquee-duration="25"` | Trust section | Official DOM marks `.static_logo-wrap` with `data-marquee-duration="25"`. | **Yes** → `Seamless logo-loop marquee` |

### 22. Captions

- `company`: Captions
- `homepage URL`: <https://captions.ai/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hover-rehearsed video style rail / 悬停预演视频风格轨 | Media & image | Pointer enter/leave; click selects a radio option | Entering a style thumbnail lazily plays its looped preview; leaving pauses and resets to frame zero; click selects it and smoothly centers the option in the horizontal rail. | Play starts immediately when media promise resolves; smooth native centering; exit reset immediate | Horizontal style-picker rail, thumbnail media, text overlay | `StudioUpload` props include a `previewVideoUrl` per style. Official React code binds `onMouseEnter:()=>video.play()`, `onMouseLeave: pause(); currentTime=0`, `role="radio"`, and on selection calls `scrollTo` to center the item. | **No** → candidate 5; the catalog lacks hover-to-rehearse video thumbnails with reset plus radio selection semantics |
| Selected style overlay / 已选风格遮罩 | Navigation & overlays | Click style button | The chosen thumbnail receives `_itemSelected`, `aria-checked=true`, and a labeled overlay while the rail remains keyboard-readable. | Selection timing unverified | Style-picker foreground | Homepage renders a `radiogroup` labeled “Select a style” with buttons for Bloom, Prism Pro, Paper II, etc., paired video/image media and `_overlay` names. | **Yes** → accessible tab/radio selection pattern |

### 23. Descript

- `company`: Descript
- `homepage URL`: <https://www.descript.com/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Transparent-poster hero product loop / 透明海报产品循环 | Media & image | Page load | A rounded, contained hero product video autoplays silently and loops, falling back to a transparent poster while loading. | Continuous; `preload="auto"` | Hero product media | Official hero has `<video autoplay loop muted playsinline preload="auto" poster="...home-hero-transparent-poster.webp">`. | **Yes** → standard autoplay-loop media |
| Fast dropdown row tint / 快速下拉行染色 | Pointer & hover | Desktop menu row hover | Menu rows tint to a neutral surface while preserving rounded grouping. | `150ms ease-out` | Navigation overlay foreground | Menu anchors explicitly include `hover:bg-[var(--Neutral-50)]` and inline `transition:background-color 150ms ease-out`. | **Yes** → `Reusable CSS hover vocabulary` |

### 24. OpusClip

- `company`: OpusClip
- `homepage URL`: <https://www.opus.pro/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rive state-machine hero carousel / Rive 状态机首屏轮播 | Motion & choreography | Swiper slide activation / Rive autoplay | Each hero slide owns a Rive canvas and its state machine; the carousel changes the showcased capability. | Rive continuous; carousel interval unverified | Hero slide media | Homepage marks a Swiper with `data-element="home-hero-anim-swiper"`; child canvas wrapper declares `data-animation-type="rive"`, `.riv` URL, artboard, state machine, autoplay, fit, and alignment. | **Yes** → `Interactive vector state machine`, `Momentum touch carousel` |
| Lazy looping feature demo / 懒加载循环功能演示 | Media & image | Lazy-load viewport activation | Poster-backed feature videos load from `data-src`, autoplay muted, and loop. | Continuous once lazy-loaded | Feature-card media | Multiple `.a_visual.lozad` videos carry `data-src`, `data-poster`, `autoplay loop muted playsinline`. | **Yes** → standard product demo media |

### 25. InVideo

- `company`: InVideo
- `homepage URL`: <https://invideo.io/>
- `checkedAt`: `2026-07-17`

| English semantic name / 中文名 | category | trigger | visualResponse | timing | layer | evidence | Existing-221 dedup |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Autonomous agent-cursor constellation / 自主 Agent 光标星座 | Motion & choreography | Page load; autonomous CSS animation | Four labeled pointer glyphs (“You”, “Andrew”, “Anna”, “Agent One”) float at different hero corners with offset phases, evoking live collaborators/agents without following the user's pointer. | `3.2s ease-in-out infinite`; delays `-0.2s`, `-1.4s`, `-2.8s`, `-4.1s`; retire fade `380ms` | Hero foreground above title/CTA | Official HTML places four `aria-hidden` `.v2-cursor` elements; official CSS absolutely positions them, assigns negative delays, runs `v2-cursor-float`, and supports `.is-retiring` opacity transition. | **No** → candidate 6; existing custom-cursor effects respond to the local pointer, whereas these are autonomous narrative actors |
| Agent-shot video grid / Agent 镜头视频网格 | Media & image | Demo sequence / media activation; exact trigger unverified | Numerous muted, looped shot videos fill a generated-video storyboard. | Continuous loops | Product-demo grid | Homepage emits many `.shot-video` elements with individual generated `video.mp4` sources, `muted loop playsinline`. | **Yes** → looping media grid, no new interaction semantic |

## Distinct candidates and minimal dependency-free snippets

### Candidate 1 — Drag-spawned DOM-aware fish flock / 拖拽生成且避让 DOM 的鱼群

Why it survives dedup: `Emergent attraction-repulsion swarm` describes particle-to-particle behavior. Sakana's scene adds a semantic, measured DOM obstacle: the school predicts collisions with a breathing recruitment CTA, curves around its peak-size bounds, and accepts new fish by pointer drag. The canvas and HTML control visibly share one physics world.

```html
<canvas id="school"></canvas>
<a class="fugu" href="#">Join us 🐡</a>

<style>
html,body{margin:0;overflow:hidden}#school{position:fixed;inset:0;width:100%;height:100%}
.fugu{position:fixed;right:3rem;bottom:3rem;z-index:2;padding:1rem 1.3rem;border-radius:50%;
  background:#e10600;color:white;text-decoration:none;animation:breathe 3.2s ease-in-out infinite;
  filter:drop-shadow(0 4px 12px #e1060030)}
.fugu:hover{animation-duration:1.4s;filter:drop-shadow(0 6px 16px #e1060060)}
@keyframes breathe{50%{transform:scale(1.1)}}
@media(prefers-reduced-motion:reduce){.fugu{animation:none}}
</style>

<script>
const canvas=document.querySelector('#school'),ctx=canvas.getContext('2d'),cta=document.querySelector('.fugu');
let fish=[]; const rand=(a,b)=>a+Math.random()*(b-a);
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)} addEventListener('resize',resize);resize();
function add(x=rand(0,innerWidth),y=rand(0,innerHeight)){if(fish.length<250)fish.push({x,y,vx:rand(-1,1),vy:rand(-1,1)})}
for(let i=0;i<70;i++)add(i<35?innerWidth/2:undefined,i<35?innerHeight/2:undefined);
function limit(x,y,max){const m=Math.hypot(x,y)||1;return m>max?[x/m*max,y/m*max]:[x,y]}
function frame(){ctx.clearRect(0,0,innerWidth,innerHeight);const box=cta.getBoundingClientRect();
  fish.forEach((f,index)=>{let sx=0,sy=0,ax=0,ay=0,cx=0,cy=0,sn=0,an=0;
    fish.forEach(o=>{if(o===f)return;const dx=f.x-o.x,dy=f.y-o.y,d=Math.hypot(dx,dy);
      if(d<20&&d){sx+=dx/d/d;sy+=dy/d/d;sn++} if(d<45){ax+=o.vx;ay+=o.vy;cx+=o.x;cy+=o.y;an++}});
    if(sn){sx/=sn;sy/=sn} if(an){ax=ax/an-f.vx;ay=ay/an-f.vy;cx=cx/an-f.x;cy=cy/an-f.y}
    f.vx+=(sx*1.5+ax*.06+cx*.001)*.05;f.vy+=(sy*1.5+ay*.06+cy*.001)*.05;
    const fx=f.x+f.vx*50,fy=f.y+f.vy*50,pad=22;
    if(fx>box.left-pad&&fx<box.right+pad&&fy>box.top-pad&&fy<box.bottom+pad){
      const sign=(-f.vy*(box.left+box.width/2-f.x)+f.vx*(box.top+box.height/2-f.y))>0?-1:1;
      f.vx+=-f.vy*.08*sign;f.vy+=f.vx*.08*sign}
    [f.vx,f.vy]=limit(f.vx,f.vy,3);f.x+=f.vx;f.y+=f.vy;
    if(f.x<0)f.x=innerWidth;if(f.x>innerWidth)f.x=0;if(f.y<0)f.y=innerHeight;if(f.y>innerHeight)f.y=0;
    ctx.save();ctx.translate(f.x,f.y);ctx.rotate(Math.atan2(f.vy,f.vx));ctx.fillStyle=index===fish.length-1?'#e10600':'#aaa9';
    ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,5);ctx.lineTo(-3,0);ctx.lineTo(-6,-5);ctx.closePath();ctx.fill();ctx.restore()});
  requestAnimationFrame(frame)}frame();
canvas.addEventListener('pointermove',e=>{if(e.buttons)add(e.clientX,e.clientY)});
</script>
```

### Candidate 2 — Interaction-history hiring badge / 交互历史驱动招聘徽章

Why it survives dedup: repository hover effects are stateless. Here, interaction history changes the message on a specific visit count, making a tiny hover treatment feel conversational.

```html
<a class="jobs" href="#">Jobs</a>

<style>
.jobs::after { content:"We are hiring!"; display:inline-block; margin-left:.4rem;
  padding:.25rem .4rem; border-radius:.35rem; background:#eaff62; color:#111; }
.jobs:hover::after { animation:badge-wiggle .15s ease 2; }
.jobs.third::after { content:"Stop hovering, come join us!"; }
@keyframes badge-wiggle { 50% { transform:rotate(-4deg); } }
</style>

<script>
const jobs = document.querySelector('.jobs');
let enters = 0;
jobs.addEventListener('pointerenter', () => {
  enters = (enters % 4) + 1;
  jobs.classList.toggle('third', enters === 3);
});
</script>
```

### Candidate 3 — Traveling-dot headline eraser/writer / 旅行圆点擦写标题

Why it survives dedup: `Segmented rotating word slot` swaps a bounded word region. Here a measured spatial marker explains the transition: it erases in one direction and writes in the other.

```html
<h2 class="rewrite">Voice AI that feels <span class="word">natural</span><i class="dot"></i></h2>

<style>
.rewrite { position:relative; display:inline-block; }
.word { display:inline-flex; min-width:7ch; }
.word > span { display:inline-block; transition:opacity .025s ease; }
.dot { position:absolute; bottom:-.25rem; width:.55rem; height:.55rem; border-radius:50%;
  background:#ff5a36; transition:transform .35s ease-in-out; }
@media (prefers-reduced-motion:reduce) { .dot { display:none; } }
</style>

<script>
const words = ['natural', 'helpful', 'human'];
const host = document.querySelector('.word');
const dot = document.querySelector('.dot');
const wait = ms => new Promise(r => setTimeout(r, ms));
const paint = text => host.innerHTML = [...text].map(c => `<span>${c}</span>`).join('');
let index = 0; paint(words[index]);
(async function loop(){
  await wait(2000);
  const oldChars = [...host.children].reverse();
  for (const char of oldChars) { char.style.opacity = 0; await wait(30); }
  index = (index + 1) % words.length; paint(words[index]);
  dot.style.transform = `translateX(${host.offsetWidth}px)`;
  await wait(250);
  for (const char of host.children) { char.style.opacity = 0; }
  for (const char of host.children) { char.style.opacity = 1; await wait(30); }
  dot.style.transform = 'translateX(0)';
  loop();
})();
</script>
```

### Candidate 4 — Synchronized scenario scene handoff / 场景同步换幕

Why it survives dedup: it is not merely a tab panel or a split-flap label. One state change coordinates background media crossfade, content movement, overlay, and a perspective overshoot label.

```html
<section class="scene">
  <video class="bg active" src="support.mp4" muted loop autoplay playsinline></video>
  <video class="bg" src="sales.mp4" muted loop autoplay playsinline></video>
  <div class="shade"></div>
  <div class="copy"><h2>Speak human to every customer</h2><b class="label">Customer Support</b></div>
  <nav><button data-scene="0" data-label="Customer Support">Support</button>
       <button data-scene="1" data-label="Lead Qualification">Sales</button></nav>
</section>

<style>
.scene { position:relative; min-height:32rem; overflow:hidden; color:white; background:#111; }
.bg,.shade { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0;
  transition:opacity .42s ease-out; }
.bg.active { opacity:1; } .shade { opacity:1; background:#0005; }
.copy { position:relative; padding:8rem 8%; transition:transform .52s cubic-bezier(.2,.8,.2,1); }
.label { display:inline-block; transform-origin:50% 0; }
.label.flap { animation:flap .52s ease-out; }
@keyframes flap { 0%{opacity:0;transform:translateY(100%) rotateX(75deg)}
  55%{opacity:1;transform:translateY(-6%) rotateX(-12deg)}
  80%{transform:translateY(2%) rotateX(4deg)} to{transform:none} }
nav { position:absolute; z-index:2; left:8%; bottom:2rem; }
@media (prefers-reduced-motion:reduce) { .bg,.copy { transition:none } .label.flap { animation:none } }
</style>

<script>
const videos = [...document.querySelectorAll('.bg')];
const label = document.querySelector('.label');
document.querySelector('nav').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  videos.forEach((video, i) => video.classList.toggle('active', i == button.dataset.scene));
  label.textContent = button.dataset.label;
  label.classList.remove('flap'); void label.offsetWidth; label.classList.add('flap');
});
</script>
```

### Candidate 5 — Hover-rehearsed video style rail / 悬停预演视频风格轨

Why it survives dedup: the media catalog has playback controls and image hovers, but not a keyboard-readable option rail where hover temporarily rehearses a video, exit rewinds it, and click persists selection plus centers the choice.

```html
<div class="styles" role="radiogroup" aria-label="Select a style">
  <button role="radio" aria-checked="true"><video muted loop playsinline src="bloom.mp4"></video><span>Bloom</span></button>
  <button role="radio" aria-checked="false"><video muted loop playsinline src="paper.mp4"></video><span>Paper</span></button>
  <button role="radio" aria-checked="false"><video muted loop playsinline src="orbit.mp4"></video><span>Orbit</span></button>
</div>

<style>
.styles { display:flex; gap:.75rem; overflow:auto; scroll-snap-type:x mandatory; }
.styles button { position:relative; flex:0 0 10rem; padding:0; border:2px solid transparent;
  border-radius:1rem; overflow:hidden; scroll-snap-align:center; background:#111; color:white; }
.styles button[aria-checked="true"] { border-color:#7c5cff; }
.styles video { width:100%; aspect-ratio:9/16; object-fit:cover; display:block; }
.styles span { position:absolute; inset:auto .6rem .6rem; padding:.25rem .45rem; background:#0008; border-radius:99px; }
</style>

<script>
document.querySelectorAll('.styles button').forEach(button => {
  const video = button.querySelector('video');
  button.addEventListener('pointerenter', () => video.play().catch(() => {}));
  button.addEventListener('pointerleave', () => { video.pause(); video.currentTime = 0; });
  button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('[role="radio"]').forEach(x => x.setAttribute('aria-checked', x === button));
    button.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
  });
});
</script>
```

### Candidate 6 — Autonomous agent-cursor constellation / 自主 Agent 光标星座

Why it survives dedup: existing cursor effects are driven by the visitor's pointer. These cursors are autonomous, named actors used as narrative evidence of parallel collaborators/agents.

```html
<section class="agent-hero">
  <h1>Your creative agent team</h1>
  <div class="agent a" aria-hidden="true">➤<span>You</span></div>
  <div class="agent b" aria-hidden="true">➤<span>Researcher</span></div>
  <div class="agent c" aria-hidden="true">➤<span>Editor</span></div>
  <div class="agent d" aria-hidden="true">➤<span>Agent One</span></div>
</section>

<style>
.agent-hero { position:relative; min-height:30rem; display:grid; place-items:center; overflow:hidden; }
.agent { position:absolute; z-index:2; display:flex; flex-direction:column; align-items:flex-start;
  color:#fff; animation:agent-float 3.2s ease-in-out infinite; filter:drop-shadow(0 2px 2px #0005); }
.agent span { margin:.1rem 0 0 1rem; padding:.25rem .55rem; border-radius:.35rem; background:#6548e8; font:600 .75rem/1 system-ui; }
.a{left:7%;top:12%;animation-delay:-.2s}.b{right:7%;top:10%;animation-delay:-1.4s}
.c{left:9%;bottom:12%;animation-delay:-2.8s}.d{right:9%;bottom:12%;animation-delay:-4.1s}
.b span{background:#087a4a}.c span{background:#bd4b31}.d span{background:#8a55c7}
@keyframes agent-float { 50% { transform:translate(5px,-12px) rotate(2deg); } }
@media (prefers-reduced-motion:reduce) { .agent { animation:none; } }
</style>
```

## Candidate summary

| # | Candidate | Source company | Primary category | Why it is not already in the 221-effect catalog |
| ---: | --- | --- | --- | --- |
| 1 | Drag-spawned DOM-aware fish flock | Sakana AI | Canvas & 2D | Drag-created flock shares a physics world with a measured, breathing DOM CTA obstacle |
| 2 | Interaction-history hiring badge | Clay | Pointer & hover | Behavior depends on the count of prior pointer entries and changes microcopy |
| 3 | Traveling-dot headline eraser/writer | PolyAI | Text & SVG | A measured spatial marker erases/rebuilds characters across rotating words |
| 4 | Synchronized scenario scene handoff | Vapi | Navigation & overlays | One state synchronizes background media, overlay, content plane, and 3D label |
| 5 | Hover-rehearsed video style rail | Captions | Media & image | Hover previews and rewinds, while click persists an accessible choice and centers it |
| 6 | Autonomous agent-cursor constellation | InVideo | Motion & choreography | Named cursors are autonomous narrative actors rather than local pointer followers |
