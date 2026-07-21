import { effectExpansion100Specs } from './effect-expansion-2026-07-20.js';
import { effectExpansion150BatchA1 } from './effect-expansion-a1-2026-07-20.js';
import { effectExpansion150BatchA2 } from './effect-expansion-a2-2026-07-20.js';
import { effectExpansion150BatchA3 } from './effect-expansion-a3-2026-07-20.js';
import { effectExpansion150BatchB } from './effect-expansion-b-2026-07-20.js';

// Curator-approved release catalog. Rejected candidates remain documented in the current dated admission audit.
export const snapshotDate = "2026-07-20";

export const categories = [
  {
    "id": "animation",
    "label": "Motion & choreography",
    "labelZh": "动画与编排",
    "description": "Timelines, springs, tweens, class animation, and framework-native motion.",
    "descriptionZh": "时间线、弹簧、补间、类动画与框架原生动效。"
  },
  {
    "id": "scroll",
    "label": "Scroll & reveal",
    "labelZh": "滚动与揭示",
    "description": "Smooth scrolling, scroll-linked scenes, reveals, parallax, and snap navigation.",
    "descriptionZh": "平滑滚动、滚动关联场景、进入揭示、视差与整屏吸附。"
  },
  {
    "id": "transition",
    "label": "Page & layout",
    "labelZh": "页面与布局",
    "description": "Page transitions, FLIP motion, filtering, packing, and animated reflow.",
    "descriptionZh": "页面转场、FLIP 动画、筛选、紧密排布与布局重排。"
  },
  {
    "id": "pointer",
    "label": "Pointer & hover",
    "labelZh": "指针与悬停",
    "description": "Tilt, depth, custom cursors, magnetic motion, and image distortion.",
    "descriptionZh": "倾斜、景深、自定义光标、磁性运动与图像扭曲。"
  },
  {
    "id": "vector",
    "label": "Text & SVG",
    "labelZh": "文本与 SVG",
    "description": "Typing, text splitting, vector drawing, handwriting, and SVG morphing.",
    "descriptionZh": "打字、文字拆分、矢量绘制、手写与 SVG 变形。"
  },
  {
    "id": "canvas",
    "label": "Canvas & 2D",
    "labelZh": "Canvas 与 2D",
    "description": "Scene graphs, creative coding, physics, drawing tools, and 2D renderers.",
    "descriptionZh": "场景图、创意编程、物理、绘图工具与 2D 渲染器。"
  },
  {
    "id": "webgl",
    "label": "3D & WebGL",
    "labelZh": "3D 与 WebGL",
    "description": "3D engines, declarative renderers, shader layers, and post-processing.",
    "descriptionZh": "3D 引擎、声明式渲染器、着色器图层与后期处理。"
  }
];

const existingEffects = [
  {
    "id": "scroll-scrubbed-master-timeline",
    "category": "animation",
    "name": "Scroll-scrubbed master timeline",
    "nameZh": "滚动擦洗主时间线",
    "addedIn": "baseline",
    "research": null,
    "behavior": {
      "trigger": "real vertical wheel, captured vertical pointer drag, or Arrow/Page/Home/End keys",
      "response": "Scrub one release-readiness board from decision brief through trace prototype to verified release",
      "timing": "human-owned normalized progress; initially static with outward wheel release at both boundaries",
      "layer": "causal task cards, accountability handoffs, evidence, gate states, and one paused GSAP master timeline"
    },
    "prompt": "Implement the \"Scroll-scrubbed master timeline\" (滚动擦洗主时间线) as a release-readiness workflow, not an abstract card sequence.\n\nUse GSAP (greensock/GSAP) and register ScrollTrigger for the project integration, while keeping one paused master timeline whose normalized progress is owned only by real user input. Model three causally linked tasks: decision brief, trace prototype, and verified release. As progress advances, keep task state, evidence, accountable owner, handoff, and release gates synchronized.\n\nInteraction contract:\n- Trigger: vertical wheel while the stage can advance, captured vertical pointer/touch drag, or Arrow/Page/Home/End keys\n- Visual response: progress one credible release candidate from queued research through verified trace evidence to rollback-proven readiness\n- Timing relationship: continuous human-owned normalized progress; no autoplay, capture-clock fallback, or synthetic events\n- Boundary behavior: outward wheel input at 0% and 100% must remain available to the surrounding page\n- Page layer: semantic task cards, evidence, ownership, gate status, and a single paused GSAP timeline\n\nRequirements:\n- Start strictly static at 0%; do not mutate progress without a trusted user action.\n- Use one source of truth for every visual and semantic state.\n- Support pointer capture, keyboard operation, responsive 320×180 and 144×81 previews, and prefers-reduced-motion.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, synthetic dispatch, and autonomous loops.\n- Export enough interaction state to verify input counts, boundary release, paused-timeline parity, causal card states, and the final release outcome.\n\nStart from this minimal API shape:\n\n```js\nimport { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\ngsap.registerPlugin(ScrollTrigger);\nconst driver = { value: 0 };\nconst timeline = gsap.timeline({ paused: true });\ntimeline.to('.brief', { opacity: 1 }).to('.prototype', { opacity: 1 }).to('.release', { opacity: 1 });\nconst applyProgress = value => timeline.progress(gsap.utils.clamp(0, 1, value), true);\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune progress thresholds, input sensitivity, easing, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "greensock-gsap",
        "recommended": true,
        "snippet": "import { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\ngsap.registerPlugin(ScrollTrigger);\nconst driver = { value: 0 };\nconst timeline = gsap.timeline({ paused: true });\ntimeline.to('.brief', { opacity: 1 }).to('.prototype', { opacity: 1 }).to('.release', { opacity: 1 });\nconst applyProgress = value => timeline.progress(gsap.utils.clamp(0, 1, value), true);",
        "preview": "captured/scroll-scrubbed-master-timeline",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/scroll-scrubbed-master-timeline.html",
        "demoSourcePath": "preview-demos/scroll-scrubbed-master-timeline.html",
        "originUrl": "https://github.com/greensock/GSAP",
        "referenceUrl": "https://gsap.com/scrolltrigger/",
        "previewRecipe": null
      }
    ],
    "order": 1,
    "relatedParties": [
      {
        "name": "Hebbia",
        "url": "https://www.hebbia.com/",
        "observedAs": "Predecoded scroll-scrubbed helix"
      },
      {
        "name": "Decagon",
        "url": "https://decagon.ai/",
        "observedAs": "Scroll-speed parallax layer"
      }
    ],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 13,
        "artDirection": 16,
        "motion": 17,
        "clarity": 15,
        "inspiration": 14,
        "evidence": 10
      },
      "total": 85,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "真实滚轮、拖拽与键盘共同控制同一暂停主时间线；三阶段任务、责任交接、证据和发布门禁形成可核验的因果链。"
    }
  },
  {
    "id": "pinned-horizontal-scroll-scene",
    "category": "scroll",
    "name": "Pinned horizontal scroll scene",
    "nameZh": "固定式横向滚动场景",
    "addedIn": "baseline",
    "research": null,
    "behavior": {
      "trigger": "real vertical wheel, captured vertical drag, or Arrow/Page/Home/End keys",
      "response": "Advance a Ridge 12 route dossier horizontally from scoped question to approved operational handoff",
      "timing": "one-way human-owned continuous progress with outward wheel release at both boundaries",
      "layer": "one pinned viewport, four semantic evidence panels, progress rail, and operational outcome"
    },
    "prompt": "Implement the \"Pinned horizontal scroll scene\" (固定式横向滚动场景) as a one-way evidence story, not a looping poster carousel.\n\nUse GSAP ScrollTrigger to pin one viewport while a four-panel operational dossier moves horizontally. Give every panel a distinct causal role—for example question, observation, comparison, and approval—and keep the final panel as a completed outcome rather than automatically returning to the beginning.\n\nInteraction contract:\n- Trigger: real vertical wheel, captured vertical pointer/touch drag, or Arrow/Page/Home/End keys\n- Visual response: move one semantic four-panel story horizontally while the viewport remains pinned\n- Timing relationship: continuous human-owned normalized progress; no cosine path, autoplay, synthetic events, or capture-clock mutation\n- Boundary behavior: outward wheel input at 0% and 100% must remain available to the surrounding page\n- Page layer: pinned viewport, evidence panels, progress rail, panel status, and final handoff\n\nRequirements:\n- Start strictly static on panel one and finish on panel four until another real input occurs.\n- Keep the native scroll position, ScrollTrigger progress, horizontal transform, status, and panel counter synchronized.\n- Support pointer capture, keyboard input, responsive 320×180 and 144×81 previews, and prefers-reduced-motion.\n- Avoid text selection while dragging, layout shift, scroll traps, inaccessible focus behavior, and autonomous replay.\n- Export interaction state that proves trusted input counts, pin ownership, normalized progress, boundary release, and the final semantic step.\n\nStart from this minimal API shape:\n\n```js\nimport { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\ngsap.registerPlugin(ScrollTrigger);\ngsap.to('.track', { xPercent: -75, ease: 'none', scrollTrigger: { trigger: '.story', scroller: '.scrollport', pin: '.stage', scrub: true, end: '+=960' } });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune scroll distance, input sensitivity, panel thresholds, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "greensock-gsap",
        "recommended": true,
        "snippet": "import { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\ngsap.registerPlugin(ScrollTrigger);\ngsap.to('.track', { xPercent: -75, ease: 'none', scrollTrigger: { trigger: '.story', scroller: '.scrollport', pin: '.stage', scrub: true, end: '+=960' } });",
        "preview": "captured/pinned-horizontal-scroll-scene",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/pinned-horizontal-scroll-scene.html",
        "demoSourcePath": "preview-demos/pinned-horizontal-scroll-scene.html",
        "originUrl": "https://github.com/greensock/GSAP",
        "referenceUrl": null,
        "previewRecipe": null
      }
    ],
    "order": 2,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 18,
        "artDirection": 19,
        "motion": 19,
        "clarity": 15,
        "inspiration": 15,
        "evidence": 10
      },
      "total": 96,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "真实纵向滚轮、拖拽与键盘共同驱动固定视口中的单向证据故事；四个语义阶段、进度和最终安全路线保持同步且不自动回卷。"
    }
  },
  {
    "id": "shared-layout-spring-morph",
    "category": "animation",
    "name": "Shared-layout spring morph",
    "nameZh": "共享布局弹簧变形",
    "addedIn": "baseline",
    "research": null,
    "behavior": {
      "trigger": "real queue-item click/tap, native Enter/Space activation, or Escape to return",
      "response": "Move one stable release-review card between its compact queue role and a full decision workspace",
      "timing": "human-owned interruptible Motion spring; direct placement under reduced motion",
      "layer": "one shared DOM node, review queue, decision workspace, and semantic detail metrics"
    },
    "prompt": "Implement the \"Shared-layout spring morph\" (共享布局弹簧变形) as a credible master-detail decision workflow, not a component playground.\n\nUse Motion (motiondivision/motion) to keep one real DOM node visually continuous as it moves from a compact queue slot into a detailed workspace and back. The shared object must retain identity, selected record, status, and ownership while its measured geometry changes.\n\nInteraction contract:\n- Trigger: real queue-item click/tap or native Enter/Space; Escape or activation of the expanded card returns it\n- Visual response: the selected release-review item springs from its queue role into a full decision brief, then returns to the correct slot\n- Timing relationship: human-owned, interruptible spring; no autoplay, capture-clock loop, or synthetic input\n- Page layer: one stable shared DOM node above semantic queue and workspace slots\n\nRequirements:\n- Start strictly static in the queue with no spring started.\n- Use measured source and destination rectangles; preserve exactly one connected shared node instead of cloning the card.\n- Support Arrow/Home/End focus movement, pointer and keyboard activation, interruption, resize reconciliation, 320×180 and 144×81 previews, and prefers-reduced-motion direct placement.\n- Keep ARIA expanded/selected state, record content, target geometry, and animation phase synchronized.\n- Export runtime state that proves shared-node identity, input ownership, spring lifecycle, geometry parity, initial stillness, and final layout completion.\n\nStart from this minimal API shape:\n\n```js\nimport { animate } from 'motion';\nconst shared = document.querySelector('#shared-card');\nconst moveSharedNode = targetRect => animate(shared, { left: targetRect.left, top: targetRect.top, width: targetRect.width, height: targetRect.height }, { type: 'spring', stiffness: 235, damping: 24 });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune spring stiffness, damping, geometry tolerance, interruption, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "motiondivision-motion",
        "recommended": true,
        "snippet": "import { animate } from 'motion';\nconst shared = document.querySelector('#shared-card');\nconst moveSharedNode = targetRect => animate(shared, { left: targetRect.left, top: targetRect.top, width: targetRect.width, height: targetRect.height }, { type: 'spring', stiffness: 235, damping: 24 });",
        "preview": "captured/shared-layout-spring-morph",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/shared-layout-spring-morph.html",
        "demoSourcePath": "preview-demos/shared-layout-spring-morph.html",
        "originUrl": "https://github.com/motiondivision/motion",
        "referenceUrl": "https://motion.dev/docs",
        "previewRecipe": null
      }
    ],
    "order": 3,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 16,
        "artDirection": 19,
        "motion": 19,
        "clarity": 15,
        "inspiration": 15,
        "evidence": 10
      },
      "total": 94,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "同一个发布审核 DOM 节点在人类选择后从队列弹簧展开到决策工作区，并能中断、返回和响应缩放；身份、内容与几何连续性均可核验。"
    }
  },
  {
    "id": "staggered-transform-choreography",
    "category": "animation",
    "name": "Staggered transform choreography",
    "nameZh": "交错变换编排",
    "addedIn": "2026-expansion",
    "research": null,
    "behavior": {
      "trigger": "real Assemble/Clear click, stage Enter/Space, Escape, or human inspection of a ready action",
      "response": "Order eight incident-response actions by operational impact and keep every accountable result inspectable",
      "timing": "human-owned forward/reverse Anime.js sequence with a real 64ms priority stagger",
      "layer": "incident command header, P0/P1/P2 action grid, owners, outcomes, selection readout, and controls"
    },
    "prompt": "Implement the \"Staggered transform choreography\" (交错变换编排) as a credible incident-response plan, not a grid of numbered tiles.\n\nUse Anime.js (juliangarnier/anime) so operational priority owns the sequence: P0 command actions must arrive before P1 mitigation and P2 evidence/comms. Give every item a distinct task, owner, priority band, and terminal outcome that remains readable after motion stops.\n\nInteraction contract:\n- Trigger: real Assemble/Clear button click, stage Enter/Space, Escape reset, or human hover/focus/click inspection after assembly\n- Visual response: eight actions arrive in impact order under one 64ms Anime.js stagger, remain inspectable, and can reverse cleanly\n- Timing relationship: human-owned forward or reverse sequence; no autoplay, preview-clock seek, or synthetic input\n- Page layer: incident command header, accountable action grid, ready count, and selection explanation\n\nRequirements:\n- Start strictly static with all actions queued and no running animation.\n- Use one real Anime.js target set and a monotonic delay sequence; keep animation time, per-card state, ready count, selected task, and controls synchronized.\n- Support click/touch, Enter/Space, Escape, Arrow/Home/End inspection, 320×180 and 144×81 previews, and prefers-reduced-motion direct terminal states.\n- Preserve hierarchy during motion; the most consequential actions must lead visually and semantically.\n- Export runtime state that proves input ownership, stagger delays, forward/reverse lifecycle, task accountability, selection, and initial stillness.\n\nStart from this minimal API shape:\n\n```js\nimport { animate, stagger } from 'animejs';\nconst choreography = animate('.incident-action', { y: { from: 14, to: 0 }, opacity: { from: .28, to: 1 }, delay: stagger(64), autoplay: false });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune priority order, stagger interval, duration, easing, reverse behavior, and reduced motion.",
    "sources": [
      {
        "projectId": "juliangarnier-anime",
        "recommended": true,
        "snippet": "import { animate, stagger } from 'animejs';\nconst choreography = animate('.incident-action', { y: { from: 14, to: 0 }, opacity: { from: .28, to: 1 }, delay: stagger(64), autoplay: false });",
        "preview": "captured/staggered-transform-choreography",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/staggered-transform-choreography.html",
        "demoSourcePath": "preview-demos/staggered-transform-choreography.html",
        "originUrl": "https://github.com/juliangarnier/anime",
        "referenceUrl": null,
        "previewRecipe": null
      }
    ],
    "order": 4,
    "relatedParties": [
      {
        "name": "Factory",
        "url": "https://factory.ai/",
        "observedAs": "Staged live-factory dashboard assembly"
      },
      {
        "name": "Read AI",
        "url": "https://www.read.ai/",
        "observedAs": "Meeting-score dashboard reveal"
      },
      {
        "name": "Cursor (Anysphere)",
        "url": "https://cursor.com/",
        "observedAs": "Micro-timed IDE state build"
      }
    ],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 16,
        "artDirection": 18,
        "motion": 19,
        "clarity": 15,
        "inspiration": 14,
        "evidence": 10
      },
      "total": 92,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "八项真实事故响应动作按 P0→P1→P2 的业务优先级以 64ms 交错到达；用户负责组装、反向清理和检查负责人，首帧无自动播放。"
    }
  },
  {
    "id": "motion-graphics-burst",
    "category": "animation",
    "name": "Motion-graphics burst",
    "nameZh": "动态图形爆发",
    "addedIn": "2026-expansion",
    "research": null,
    "behavior": {
      "trigger": "real pipeline-node click/tap or focused Enter/Space, with arrows for focus and Escape/R/Clear to reset",
      "response": "Map one four-layer Mo.js confirmation burst to the exact center of the acknowledged release node",
      "timing": "human-owned charge, release, dissipation, and settled phases; interruptible and never automatic",
      "layer": "semantic release pipeline, local coordinate field, layered Mo.js composition, status, meter, and reset"
    },
    "prompt": "Implement the \"Motion-graphics burst\" (动态图形爆发) as feedback for a consequential user event, not an automatic explosion in empty space.\n\nUse Mo.js (mojs/mojs) to build one layered confirmation composition—for example shards, sparks, shockwave, and core—and tune every layer to the exact local center of the semantic object the user acknowledges. The burst must explain which pipeline event fired and preserve a visible confirmed state after dissipation.\n\nInteraction contract:\n- Trigger: real node click/tap or focused Enter/Space; Arrow/Home/End moves focus; Escape, R, or a Clear control resets the trace\n- Visual response: charge, release, and dissipate a layered Mo.js burst at the selected pipeline node, then retain an acknowledged result\n- Timing relationship: human-owned and interruptible; no autoplay, automatic node selection, preview-clock trigger, or synthetic event\n- Page layer: semantic event nodes beneath a pointer-transparent local Mo.js field, plus status and reset\n\nRequirements:\n- Start strictly idle with no selected node, no confirmed trace, and zero played timelines.\n- Measure node centers in field-local CSS pixels and tune every Mo.js part to the same origin.\n- Support pointer, touch, pen, keyboard, interruption, repeat acknowledgement, 320×180 and 144×81 previews, and prefers-reduced-motion static confirmation.\n- Keep node selection, cumulative trigger counts, current visible trace, phase, meter, and reset state distinct and synchronized.\n- Export runtime state that proves real input, Mo.js timeline membership, source-node mapping error, interruption, reset, and initial stillness.\n\nStart from this minimal API shape:\n\n```js\nimport mojs from '@mojs/core';\nconst burst = new mojs.Burst({ parent: '#field', left: 0, top: 0, radius: { 13: 66 }, count: 12 });\nconst playAt = ({ x, y }) => burst.tune({ left: x, top: y }).replay();\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune local coordinates, layer timing, particle count, easing, interruption, and reduced motion.",
    "sources": [
      {
        "projectId": "mojs-mojs",
        "recommended": true,
        "snippet": "import mojs from '@mojs/core';\nconst burst = new mojs.Burst({ parent: '#field', left: 0, top: 0, radius: { 13: 66 }, count: 12 });\nconst playAt = ({ x, y }) => burst.tune({ left: x, top: y }).replay();",
        "preview": "captured/motion-graphics-burst",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/motion-graphics-burst.html",
        "demoSourcePath": "preview-demos/motion-graphics-burst.html",
        "originUrl": "https://github.com/mojs/mojs",
        "referenceUrl": null,
        "previewRecipe": null
      }
    ],
    "order": 5,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 16,
        "artDirection": 18,
        "motion": 19,
        "clarity": 15,
        "inspiration": 14,
        "evidence": 10
      },
      "total": 92,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "真实发布节点触发唯一四层 Mo.js 合成，所有粒子精确映射到节点中心；点击、键盘、打断与清理均有可核验状态，首帧不自动爆发。"
    }
  },
  {
    "id": "visually-authored-keyframe-sequence",
    "category": "animation",
    "name": "Visually authored keyframe sequence",
    "nameZh": "可视化编排关键帧序列",
    "addedIn": "2026-expansion",
    "research": null,
    "behavior": {
      "trigger": "real timeline scrub, authored-pose selection, or explicit Play/Pause from pointer, touch, or keyboard",
      "response": "Move one campaign lockup through five saved Theatre.js poses while the actor, path, markers, note, and time readout stay synchronized",
      "timing": "human-owned direct scrub or one-shot playback across six authored property tracks; never automatic",
      "layer": "motion-review workspace, live campaign lockup, safe frame, review note, and semantic timeline controls"
    },
    "prompt": "Implement the \"Visually authored keyframe sequence\" (可视化编排关键帧序列) as a compact motion-review workspace, not an autoplaying badge.\n\nUse Theatre.js (theatre-js/theatre) with a saved project state containing five deliberately authored poses across multiple property tracks. Keep one recognisable production deliverable—for example a campaign lockup—inside a safe frame, and synchronize its live transform with a path, pose ghosts, marker selection, time readout, and pose-specific review note.\n\nInteraction contract:\n- Trigger: real range scrub, authored-pose marker click/tap, or explicit Play/Pause on the transport or actor; native range keys must work\n- Visual response: the same live actor traverses five authored positions, rotations, scales, corner shapes, and tones while all review evidence stays synchronized\n- Timing relationship: direct manipulation or interruptible one-shot playback; no autoplay, looping, preview-clock position changes, or synthetic input\n- Page layer: motion-review viewport, saved Theatre.js sequence, decision note, and accessible timeline\n\nRequirements:\n- Start strictly at time 0 in the first pose and remain unchanged until trusted human input.\n- Author at least five keyframes on each of several Theatre.js tracks and validate that the live object values match the sequence position.\n- Support pointer, touch, keyboard range input, marker selection, play, pause, cancellation, completion, 320×180 and 144×81 previews, and prefers-reduced-motion direct pose stepping.\n- Keep the actor inside the measured viewport at every authored pose and expose exactly one current marker and ghost.\n- Export runtime state that proves initial stillness, saved keyframes, trusted input counts, position/value synchronization, playback lifecycle, and absence of automatic changes.\n\nStart from this minimal API shape:\n\n```js\nimport { getProject } from '@theatre/core';\nconst project = getProject('Campaign Motion Review', { state: savedState });\nconst sheet = project.sheet('Scene');\nconst actor = sheet.object('Campaign Lockup', { x: 18, y: 70, rotation: -8, scale: .72 });\nactor.onValuesChange(values => applyLockup(values));\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune keyframe positions, bezier handles, pose spacing, playback, scrubbing, and reduced motion.",
    "sources": [
      {
        "projectId": "theatre-js-theatre",
        "recommended": true,
        "snippet": "import { getProject } from '@theatre/core';\nconst project = getProject('Campaign Motion Review', { state: savedState });\nconst sheet = project.sheet('Scene');\nconst actor = sheet.object('Campaign Lockup', { x: 18, y: 70, rotation: -8, scale: .72 });\nactor.onValuesChange(values => applyLockup(values));",
        "preview": "captured/visually-authored-keyframe-sequence",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/visually-authored-keyframe-sequence.html",
        "demoSourcePath": "preview-demos/visually-authored-keyframe-sequence.html",
        "originUrl": "https://github.com/theatre-js/theatre",
        "referenceUrl": null,
        "previewRecipe": null
      }
    ],
    "order": 6,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 13,
        "artDirection": 16,
        "motion": 18,
        "clarity": 13,
        "inspiration": 14,
        "evidence": 10
      },
      "total": 84,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "真实 Theatre.js 保存状态包含六条属性轨与五个关键姿态；用户可拖动、点选或显式播放，并从路径、幽灵姿态、评审批注和时间读数核验每次变化。"
    }
  },
  {
    "id": "compact-svg-shape-tween",
    "category": "animation",
    "name": "Compact SVG shape tween",
    "nameZh": "轻量 SVG 形状补间",
    "addedIn": "2026-expansion",
    "research": null,
    "behavior": {
      "trigger": "real shortlist click/tap or Enter/Space/Arrow keys, with Escape or ArrowLeft to remove",
      "response": "Morph the same live SVG path from add to check while card treatment, saved count, availability, and decision copy resolve together",
      "timing": "680ms human-owned KUTE.js path tween in either direction; no autoplay or synthetic toggle",
      "layer": "credible stay-comparison card, semantic shortlist control, live SVG icon, and synchronized decision state"
    },
    "prompt": "Implement the \"Compact SVG shape tween\" (轻量 SVG 形状补间) as a meaningful product-state decision, not a looping star-to-heart specimen.\n\nUse KUTE.js (thednp/kute.js) to morph one visible SVG path between two semantic states—for example an Add icon and a confirmation check—inside a real control. The same decision must update the surrounding card treatment, label, saved count, availability, and accessible pressed state so the morph preserves identity instead of decorating an unrelated UI.\n\nInteraction contract:\n- Trigger: real control click/tap or native Enter/Space; ArrowRight saves, while ArrowLeft or Escape removes/resets\n- Visual response: one live SVG path morphs add→check or check→add while every dependent decision signal resolves in the same direction\n- Timing relationship: human-owned 680ms eased KUTE.js tween; no autoplay, looping, preview-clock changes, or synthetic event dispatch\n- Page layer: credible comparison card, shortlist decision control, live SVG path, and synchronized count/status copy\n\nRequirements:\n- Start strictly unsaved with the source path visible and remain unchanged until trusted input.\n- Use a real `KUTE.Tween`, validate path normalization/topology, and keep exactly one DOM path throughout both states.\n- Support pointer, touch, keyboard save/remove/reset, repeated forward and reverse decisions, 320×180 and 144×81 previews, and prefers-reduced-motion direct completion.\n- Keep `aria-pressed`, card state, copy, count, availability, rendered shape, tween direction, and motion state synchronized.\n- Export runtime state that proves initial stillness, KUTE version/tween/path evidence, input adapters, direction counts, and absence of automatic playback.\n\nStart from this minimal API shape:\n\n```js\nimport KUTE from 'kute.js';\nconst tween = KUTE.fromTo('#decision-path', { path: addPath }, { path: checkPath }, { duration: 680, easing: 'easingCubicInOut', morphPrecision: 4 });\ntween.start();\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune path topology, morph precision, easing, direction reversal, state synchronization, and reduced motion.",
    "sources": [
      {
        "projectId": "thednp-kute-js",
        "recommended": true,
        "snippet": "import KUTE from 'kute.js';\nconst tween = KUTE.fromTo('#decision-path', { path: addPath }, { path: checkPath }, { duration: 680, easing: 'easingCubicInOut', morphPrecision: 4 });\ntween.start();",
        "preview": "captured/compact-svg-shape-tween",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/compact-svg-shape-tween.html",
        "demoSourcePath": "preview-demos/compact-svg-shape-tween.html",
        "originUrl": "https://github.com/thednp/kute.js",
        "referenceUrl": null,
        "previewRecipe": null
      }
    ],
    "order": 7,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 14,
        "artDirection": 18,
        "motion": 18,
        "clarity": 15,
        "inspiration": 14,
        "evidence": 10
      },
      "total": 89,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "同一 live SVG 路径在真实收藏决策中由加号变为确认勾，卡片、文案、计数、可用性与 ARIA 状态同步；正反向输入均由用户触发且首帧静止。"
    }
  },
  {
    "id": "filterable-grid-reflow",
    "category": "transition",
    "name": "Filterable grid reflow",
    "nameZh": "可筛选网格重排",
    "addedIn": "baseline",
    "research": null,
    "behavior": {
      "trigger": "real filter/sort button click or Arrow/Home/End key within a control group",
      "response": "Filter six identifiable field objects into three balanced categories or sort them by curated rank/name while Isotope closes every gap",
      "timing": "operator-owned Isotope fitRows transition; reduced motion arranges immediately",
      "layer": "field-kit collection, object imagery, metadata, filters, sort controls, and live result count"
    },
    "prompt": "Implement the \"Filterable grid reflow\" (可筛选网格重排) web interaction effect in the current project.\n\nUse Isotope (metafizzy/isotope) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific transition interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: state change or animation frame\n- Visual response: Filterable grid reflow\n- Timing relationship: eased transition\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport Isotope from 'isotope-layout';\nconst grid = new Isotope('.grid', { itemSelector: '.item' });\ngrid.arrange({ filter: '.featured' });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "metafizzy-isotope",
        "recommended": true,
        "snippet": "const grid = new Isotope('.grid',{layoutMode:'fitRows',getSortData:{name:'[data-name]'}});\ngrid.arrange({filter: selectedCategory, sortBy: selectedSort});",
        "preview": "captured/filterable-grid-reflow",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/filterable-grid-reflow.html",
        "demoSourcePath": "preview-demos/filterable-grid-reflow.html",
        "originUrl": "https://github.com/metafizzy/isotope",
        "referenceUrl": "https://isotope.metafizzy.co/",
        "previewRecipe": null
      }
    ],
    "order": 8,
    "relatedParties": [
      {
        "name": "Ideogram",
        "url": "https://ideogram.ai/",
        "observedAs": "Category-filtered practice gallery"
      }
    ],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 12,
        "artDirection": 17,
        "motion": 17,
        "clarity": 15,
        "inspiration": 14,
        "evidence": 10
      },
      "total": 85,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "筛选、排序、补位和卡片层级在同一画面中清楚发生，编排完整且可复用。"
    }
  },
  {
    "id": "perspective-tilt-and-glare",
    "category": "pointer",
    "name": "Perspective tilt and glare",
    "nameZh": "透视倾斜与高光",
    "addedIn": "baseline",
    "research": null,
    "behavior": {
      "trigger": "real mouse movement, captured touch/pen drag, or arrow keys",
      "response": "Tilt a fictional observatory field pass and move its laminate glare across distinct materials",
      "timing": "direct input mapping with eased pointer response and explicit reset",
      "layer": "responsive product-pass card, artwork, raised type, foil, and glare"
    },
    "prompt": "Implement the \"Perspective tilt and glare\" (透视倾斜与高光) web interaction effect in the current project.\n\nUse vanilla-tilt.js (micku7zu/vanilla-tilt.js) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific pointer interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: pointer or touch\n- Visual response: Perspective tilt and glare\n- Timing relationship: eased transition\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport VanillaTilt from 'vanilla-tilt';\nVanillaTilt.init(document.querySelector('.card'), { max: 12, glare: true });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "micku7zu-vanilla-tilt-js",
        "recommended": true,
        "snippet": "import VanillaTilt from 'vanilla-tilt';\nVanillaTilt.init(document.querySelector('.card'), { max: 12, glare: true });",
        "preview": "captured/perspective-tilt-and-glare",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/perspective-tilt-and-glare.html",
        "demoSourcePath": "preview-demos/perspective-tilt-and-glare.html",
        "originUrl": "https://github.com/micku7zu/vanilla-tilt.js",
        "referenceUrl": "https://micku7zu.github.io/vanilla-tilt.js/",
        "previewRecipe": null
      }
    ],
    "order": 9,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 14,
        "artDirection": 18,
        "motion": 18,
        "clarity": 15,
        "inspiration": 15,
        "evidence": 10
      },
      "total": 90,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "透视、景深与移动高光共同形成清楚的材质感，完成度和迁移价值都很高。"
    }
  },
  {
    "id": "context-aware-custom-cursor",
    "category": "pointer",
    "name": "Context-aware custom cursor",
    "nameZh": "情境感知自定义光标",
    "addedIn": "baseline",
    "research": null,
    "behavior": {
      "trigger": "pointer or touch",
      "response": "Context-aware custom cursor",
      "timing": "eased transition",
      "layer": "content"
    },
    "prompt": "Implement the \"Context-aware custom cursor\" (情境感知自定义光标) web interaction effect in the current project.\n\nUse mouse-follower (Cuberto/mouse-follower) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific pointer interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: pointer or touch\n- Visual response: Context-aware custom cursor\n- Timing relationship: eased transition\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport MouseFollower from 'mouse-follower';\nnew MouseFollower({ speed: 0.35 });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "cuberto-mouse-follower",
        "recommended": true,
        "snippet": "import MouseFollower from 'mouse-follower';\nnew MouseFollower({ speed: 0.35 });",
        "preview": "mouse-follower",
        "previewKind": "official-capture",
        "demoPath": null,
        "demoSourcePath": null,
        "originUrl": "https://user-images.githubusercontent.com/11841379/162477170-5dd33ecd-0e72-4fe4-9053-53d7b5557637.gif",
        "referenceUrl": null,
        "previewRecipe": null
      }
    ],
    "order": 10,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 17,
        "artDirection": 17,
        "motion": 17,
        "clarity": 13,
        "inspiration": 14,
        "evidence": 8
      },
      "total": 86,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "光标随内容语境切换媒体和文字角色，具备鲜明的互动叙事和品牌启发价值。"
    }
  },
  {
    "id": "displacement-map-image-hover",
    "category": "pointer",
    "name": "Displacement-map image hover",
    "nameZh": "位移贴图图像悬停",
    "addedIn": "baseline",
    "research": null,
    "behavior": {
      "trigger": "pointer or touch",
      "response": "Displacement-map image hover",
      "timing": "eased transition",
      "layer": "content"
    },
    "prompt": "Implement the \"Displacement-map image hover\" (位移贴图图像悬停) web interaction effect in the current project.\n\nUse hover-effect (robin-dela/hover-effect) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific pointer interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: pointer or touch\n- Visual response: Displacement-map image hover\n- Timing relationship: eased transition\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport hoverEffect from 'hover-effect';\nnew hoverEffect({ parent: document.querySelector('.tile'), image1: 'a.jpg', image2: 'b.jpg', displacementImage: 'disp.png' });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "robin-dela-hover-effect",
        "recommended": true,
        "snippet": "import hoverEffect from 'hover-effect';\nnew hoverEffect({ parent: document.querySelector('.tile'), image1: 'a.jpg', image2: 'b.jpg', displacementImage: 'disp.png' });",
        "preview": "hover-effect",
        "previewKind": "official-capture",
        "demoPath": null,
        "demoSourcePath": null,
        "originUrl": "https://github.com/robin-dela/hover-effect/blob/master/gifs/alex_brown.gif",
        "referenceUrl": null,
        "previewRecipe": null
      }
    ],
    "order": 11,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 18,
        "artDirection": 18,
        "motion": 18,
        "clarity": 14,
        "inspiration": 14,
        "evidence": 8
      },
      "total": 90,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "图像通过位移纹理发生具有材质感的变形过渡，视觉签名鲜明且具有艺术张力。"
    }
  },
  {
    "id": "svg-stroke-drawing",
    "category": "vector",
    "name": "SVG stroke drawing",
    "nameZh": "SVG 描边绘制",
    "addedIn": "baseline",
    "research": null,
    "behavior": {
      "trigger": "real Draw route/map click or focused Enter/Space, with Escape/R/Clear to reset",
      "response": "Draw a six-part field itinerary from depot to headland in semantic route order and retain an approved result",
      "timing": "human-owned oneByOne Vivus trace; restartable, interruptible, and never automatic on mount or preview time",
      "layer": "field itinerary brief, real SVG map geometry, ordered route paths, approval state, and accessible controls"
    },
    "prompt": "Implement the \"SVG stroke drawing\" (SVG 描边绘制) as a user-approved semantic route, not an autoplaying paper-plane outline.\n\nUse Vivus (maxwellito/vivus) in manual `oneByOne` mode to draw a real itinerary whose DOM path order has meaning: origin, first leg, waypoint, second leg, destination, then approval. Keep the base map visible before interaction, hide the active route at time zero, and preserve a legible approved result after drawing completes.\n\nInteraction contract:\n- Trigger: real Draw route button or map click/tap; focused Enter/Space draws; Escape, R, or Clear resets\n- Visual response: trace six SVG geometry paths in semantic travel order, update progress/status during drawing, and retain destination plus approval evidence\n- Timing relationship: human-owned manual Vivus playback, restartable and interruptible; no mount autoplay, automatic replay, preview-clock trigger, or synthetic event\n- Page layer: field itinerary brief, live SVG map, ordered route paths, status, and reset controls\n\nRequirements:\n- Start strictly idle with the route layer hidden, zero Vivus progress, and no trigger or completion.\n- Use real `SVGGeometryElement` paths with measurable length and validate both DOM and Vivus map order.\n- Support pointer, touch, pen, keyboard drawing, retracing, interruption, reset, 320×180 and 144×81 previews, and prefers-reduced-motion direct completion.\n- Keep route visibility, phase, progress, current frame, trigger target, status, and accessible pressed/disabled state synchronized.\n- Export runtime state that proves semantic path order, geometry evidence, real input counts, interruption/reset, initial stillness, and absence of automatic playback.\n\nStart from this minimal API shape:\n\n```js\nimport Vivus from 'vivus';\nconst drawing = new Vivus('route-svg', { start: 'manual', type: 'oneByOne', duration: 108 });\ndrawing.stop().reset();\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune path order, duration allocation, easing, interruption, route visibility, and reduced motion.",
    "sources": [
      {
        "projectId": "maxwellito-vivus",
        "recommended": true,
        "snippet": "import Vivus from 'vivus';\nconst drawing = new Vivus('route-svg', { start: 'manual', type: 'oneByOne', duration: 108 });\ndrawing.stop().reset();",
        "preview": "captured/svg-stroke-drawing",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/svg-stroke-drawing.html",
        "demoSourcePath": "preview-demos/svg-stroke-drawing.html",
        "originUrl": "https://github.com/maxwellito/vivus",
        "referenceUrl": "https://github.com/maxwellito/vivus#principles",
        "previewRecipe": null
      }
    ],
    "order": 12,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 13,
        "artDirection": 16,
        "motion": 18,
        "clarity": 15,
        "inspiration": 14,
        "evidence": 10
      },
      "total": 86,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "真实行程由起点、两段路线、途经点、目的地和审批勾按语义顺序绘制；点击、键盘、打断与清理均可核验，首帧不会自动描边。"
    }
  },
  {
    "id": "sketch-style-creative-coding-loop",
    "category": "canvas",
    "name": "Sketch-style creative coding loop",
    "nameZh": "草图式创意编程循环",
    "addedIn": "2026-expansion",
    "research": null,
    "behavior": {
      "trigger": "real field-source drag, preset or density edit, keyboard adjustment, or explicit Run/Pause",
      "response": "Recompose a p5 generative event poster around one movable signal source and chosen field rhythm",
      "timing": "static-by-default direct editing plus a human-started, pausable live phase; no automatic draw loop or preview-clock mutation",
      "layer": "credible poster canvas, typography-safe signal field, art-direction brief, presets, density control, and transport"
    },
    "prompt": "Implement the \"Sketch-style creative coding loop\" (草图式创意编程循环) as a useful generative-poster editor, not a self-running decorative waveform.\n\nUse p5.js (processing/p5.js) in instance mode to render a deterministic line field around a recognisable event-poster composition. Give the user a concrete art-direction task: move the field source away from critical type, choose a field rhythm, adjust line density, and optionally run or pause the live phase.\n\nInteraction contract:\n- Trigger: real pointer/touch drag on the poster, preset selection, native range input, Canvas arrow/Home keys, or explicit Run/Pause/Space\n- Visual response: redraw the same poster field from source X/Y, density, amplitude, frequency, curvature, and loop phase while typography and event details remain legible\n- Timing relationship: static direct editing by default; a live loop starts only after user intent and remains pausable; no automatic loop, preview-clock update, or synthetic event\n- Page layer: p5 Canvas poster, code-authored typography, art-direction brief, parameter evidence, presets, density, and transport\n\nRequirements:\n- Call `noLoop()` and render one verified static first frame without changing parameters or phase.\n- Use deterministic field math and expose a checksum/signature tied to the exact drawn parameters.\n- Support mouse/touch/pen drag, keyboard field movement, native range keys, presets, explicit start/pause, 320×180 and 144×81 previews, and prefers-reduced-motion discrete stepping.\n- Keep Canvas dimensions matched to its responsive surface and keep every control/readout/ARIA state synchronized.\n- Export runtime state that proves initial stillness, trusted input mix, redraw causes, loop lifecycle, field parameters/checksum, real p5 2D context, and absence of automatic changes.\n\nStart from this minimal API shape:\n\n```js\nimport p5 from 'p5';\nconst sketch = new p5(p => {\n  p.setup = () => { p.createCanvas(width, height); p.noLoop(); };\n  p.draw = () => drawPosterField(p, parameters);\n});\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune density, source influence, wave frequency, curvature, loop speed, legibility, and reduced motion.",
    "sources": [
      {
        "projectId": "processing-p5-js",
        "recommended": true,
        "snippet": "import p5 from 'p5';\nconst sketch = new p5(p => {\n  p.setup = () => { p.createCanvas(width, height); p.noLoop(); };\n  p.draw = () => drawPosterField(p, parameters);\n});",
        "preview": "captured/sketch-style-creative-coding-loop",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/sketch-style-creative-coding-loop.html",
        "demoSourcePath": "preview-demos/sketch-style-creative-coding-loop.html",
        "originUrl": "https://github.com/processing/p5.js",
        "referenceUrl": null,
        "previewRecipe": null
      }
    ],
    "order": 13,
    "relatedParties": [
      {
        "name": "Hume AI",
        "url": "https://www.hume.ai/",
        "observedAs": "Canvas-backed pastel research plate"
      }
    ],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 17,
        "artDirection": 18,
        "motion": 17,
        "clarity": 14,
        "inspiration": 15,
        "evidence": 10
      },
      "total": 91,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "真实 p5 画布成为可编辑的活动海报信号场；用户拖动场源、切换节奏、调整密度并显式运行/暂停，首帧静止且每次绘制参数都有校验签名。"
    }
  },
  {
    "id": "functional-webgl-draw-commands",
    "category": "webgl",
    "name": "Functional WebGL draw commands",
    "nameZh": "函数式 WebGL 绘制命令",
    "addedIn": "2026-expansion",
    "research": null,
    "behavior": {
      "trigger": "real Analyze/Mix click, direct field drag, or stage keyboard input",
      "response": "Recompose the same 1,100 cell observations from one mixed sample into three coherent populations and reveal an 8% rare-response gate",
      "timing": "human-owned direct scrub or interruptible endpoint transition; no automatic GPU loop or synthetic input",
      "layer": "one WebGL assay surface composed from four visible regl commands: field, density, cells, and response gate"
    },
    "prompt": "Implement the \"Functional WebGL draw commands\" (函数式 WebGL 绘制命令) as a comprehensible analysis task, not a generic autoplaying particle vortex.\n\nUse regl (regl-project/regl) to compose several reusable draw commands whose purposes are visible to a non-developer. For example, keep one deterministic set of scientific observations and use four commands—field, density, cells, and response gate—to transform a mixed sample into meaningful populations without losing any point.\n\nInteraction contract:\n- Trigger: real Analyze/Mix click or tap, direct pointer/touch scrub across the surface, or Arrow/Home/End/Enter/Space keyboard input\n- Visual response: the same 1,100 GPU points separate into three labelled populations while a rare-response gate and metrics become visible\n- Timing relationship: human-owned direct scrub or interruptible endpoint transition; no autoplay, continuous vortex, preview-clock-only motion, or synthetic event\n- Page layer: single WebGL assay surface plus semantic analysis copy, metrics, command stack, progress, and controls\n\nRequirements:\n- Start strictly at one stable mixed sample and prove the initial framebuffer remains unchanged without input.\n- Create multiple real regl command functions and execute each exactly once per render with visible responsibility.\n- Generate deterministic observation data with auditable particle/population counts and a checksum; do not use `Math.random`.\n- Support pointer, touch, click, keyboard endpoint/scrub control, 320×180 and 144×81 previews, and prefers-reduced-motion direct settling.\n- Keep progress, target, phase, motion, metrics, button state, Canvas label, draw counts, dimensions, and GPU result synchronized.\n- Export runtime state that proves real WebGL/regl context, command composition, data retention, input counts, initial stillness, and absence of automatic playback.\n\nStart from this minimal API shape:\n\n```js\nimport createREGL from 'regl';\nconst regl = createREGL({ canvas });\nconst drawField = regl(fieldCommand);\nconst drawCells = regl(cellCommand);\nconst drawGate = regl(gateCommand);\nconst render = props => { drawField(props); drawCells(props); drawGate(props); };\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune draw-command boundaries, point count, deterministic data, interpolation, gate visibility, and reduced motion.",
    "sources": [
      {
        "projectId": "regl-project-regl",
        "recommended": true,
        "snippet": "import createREGL from 'regl';\nconst regl = createREGL({ canvas });\nconst drawField = regl(fieldCommand);\nconst drawCells = regl(cellCommand);\nconst drawGate = regl(gateCommand);\nconst render = props => { drawField(props); drawCells(props); drawGate(props); };",
        "preview": "captured/functional-webgl-draw-commands",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/functional-webgl-draw-commands.html",
        "demoSourcePath": "preview-demos/functional-webgl-draw-commands.html",
        "originUrl": "https://github.com/regl-project/regl",
        "referenceUrl": null,
        "previewRecipe": null
      }
    ],
    "order": 14,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 19,
        "artDirection": 19,
        "motion": 19,
        "clarity": 14,
        "inspiration": 15,
        "evidence": 10
      },
      "total": 96,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "四个真实 regl draw command 分别承担 field、density、cells 与 response gate；用户把 1,100 个确定性样本分成 759/253/88 三群并显出 8% 稀有响应，首帧静止且数据不丢失。"
    }
  },
  {
    "id": "dom-synced-shader-planes",
    "category": "webgl",
    "name": "Human-calibrated DOM / GPU media registration",
    "nameZh": "人工校准的 DOM / GPU 媒体配准",
    "addedIn": "2026-expansion",
    "research": null,
    "behavior": {
      "trigger": "trusted drag, scale, layout, or keyboard adjustment",
      "response": "The Curtains.js image plane recomputes from the moved DOM card and reports the live registration error",
      "timing": "one immediate synchronization after each human adjustment",
      "layer": "Full-stage museum media registration workbench"
    },
    "prompt": "Implement the \"Human-calibrated DOM / GPU media registration\" (人工校准的 DOM / GPU 媒体配准) interaction in the current project.\n\nUse Curtains.js and one original local image as the actual plane texture. The browser-decoded pixels must determine a visible shader parameter, and the exact texture provenance must be verifiable.\n\nInteraction contract:\n- Trigger: trusted drag, scale, layout, or keyboard adjustment\n- Visual response: recompute the Curtains.js plane from the real DOM card bounds and report the registration error\n- Timing relationship: one immediate synchronization after each human adjustment\n- Page layer: full-stage media registration workbench\n\nRequirements:\n- Keep the initial frame and every between-input state still.\n- Support pointer capture, touch, pen, keyboard, a native scale range, layout controls, and reset.\n- Compare DOM, Curtains plane, and WebGL rectangles after every mutation.\n- Do not add automatic playback, rehearsal, fallback, or preview-clock mutation.\n- Keep the implementation responsive and clean up listeners and WebGL resources.\n\nStart from this minimal API shape:\n\n```js\nimport { Curtains, Plane } from 'curtainsjs';\nconst curtains = new Curtains({ container: 'canvas', autoRender: false });\nconst plane = new Plane(curtains, document.querySelector('.plane'), options);\nplane.updatePosition();\n```\n\nReturn working code, changed files, asset provenance, pixel evidence, and registration assertions.",
    "sources": [
      {
        "projectId": "martinlaxenaire-curtainsjs",
        "recommended": true,
        "snippet": "import { Curtains, Plane } from 'curtainsjs';\nconst curtains = new Curtains({ container: 'canvas' });\nnew Plane(curtains, document.querySelector('.plane'), { vertexShader, fragmentShader });",
        "preview": "captured/dom-synced-shader-planes",
        "previewKind": "local-demo-capture",
        "demoPath": "preview-demos/dist/dom-synced-shader-planes.html",
        "demoSourcePath": "preview-demos/dom-synced-shader-planes.html",
        "originUrl": "https://github.com/martinlaxenaire/curtainsjs",
        "referenceUrl": null,
        "previewRecipe": null
      }
    ],
    "order": 15,
    "relatedParties": [],
    "admission": {
      "policyVersion": "2026-07-17",
      "scores": {
        "creativity": 20,
        "artDirection": 20,
        "motion": 20,
        "clarity": 15,
        "inspiration": 15,
        "evidence": 10
      },
      "total": 100,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "真人移动、缩放或重排媒体卡后，Curtains.js 平面立即按真实 DOM 边界重新配准；同一张可验证图片既是唯一 GPU 纹理，又以像素能量控制检查着色器，三套矩形误差与可见读数共同证明同步成立。"
    }
  }
];

const expansionScore = (scores, rationaleZh) => ({
  policyVersion: '2026-07-17',
  scores,
  total: Object.values(scores).reduce((total, score) => total + score, 0),
  decision: 'admit',
  reasonCode: 'passed',
  rationaleZh
});

const expansionPrompt = effect => `Implement the "${effect.name}" (${effect.nameZh}) web interaction effect in the current project.

Use ${effect.implementationName} as the recommended implementation. Recreate this specific observed mechanism with original visual assets; do not copy the source website's branding or reduce it to a generic transition.

Interaction contract:
- Trigger: ${effect.behavior.trigger}
- Visual response: ${effect.behavior.response}
- Timing relationship: ${effect.behavior.timing}
- Page layer: ${effect.behavior.layer}

Requirements:
- Preserve the defining effect signature and make its state change legible without explanatory labels.
- Integrate with the existing design system and component structure.
- Support keyboard and touch input whenever the interaction is actionable.
- Respect prefers-reduced-motion with a clear non-animated fallback.
- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.
- Keep the implementation responsive and clean up listeners, timers, media, and animation instances.

Start from this minimal API shape:

\`\`\`js
${effect.snippet}
\`\`\`

Return the working code, the files changed, and a short explanation of how to tune timing, easing, geometry, and reduced-motion behavior.`;

const makeExpansionEffect = spec => ({
  id: spec.id,
  category: spec.category,
  name: spec.name,
  nameZh: spec.nameZh,
  addedIn: '2026-ai-native-expansion',
  research: {
    sourceUrl: spec.homepage,
    difference: spec.difference,
    verifiedAt: '2026-07-18'
  },
  behavior: spec.behavior,
  prompt: expansionPrompt(spec),
  sources: [{
    projectId: spec.projectId,
    recommended: true,
    snippet: spec.snippet,
    preview: `captured/${spec.id}`,
    previewKind: 'local-demo-capture',
    demoPath: `preview-demos/dist/${spec.id}.html`,
    demoSourcePath: `preview-demos/${spec.id}.html`,
    originUrl: spec.projectUrl,
    referenceUrl: spec.referenceUrl,
    previewRecipe: null
  }],
  order: spec.order,
  relatedParties: [{ name: spec.company, url: spec.homepage, observedAs: spec.observedAs }],
  admission: expansionScore(spec.scores, spec.rationaleZh)
});

const expansionEffects = [
  {
    id: 'depth-layer-blur-dissolve', category: 'canvas', name: 'Depth-layer ordered blur dissolve', nameZh: '景深分层顺序模糊溶解', order: 16,
    company: 'Black Forest Labs', homepage: 'https://bfl.ai/', observedAs: 'Depth-map ordered blur dissolve',
    difference: 'Depth values sequence near, middle, and far regions through separate blur and opacity handoffs instead of applying one displacement or crossfade to the whole image.',
    behavior: { trigger: 'pointer/touch drag or keyboard progress control', response: 'Near, middle, far, and sky raster bands blur and dissolve in depth order', timing: 'input-driven depth-staggered handoff; no autonomous fallback', layer: 'Canvas raster compositor + shared ordinal depth mask' },
    implementationName: 'p5.js', projectId: 'processing-p5-js', projectUrl: 'https://github.com/processing/p5.js', referenceUrl: 'https://p5js.org/reference/',
    snippet: "const bands = rasterizeOrdinalMask(depthSvg);\ncanvas.onpointermove = event => drawDepthOrderedRasterBands(sceneA, sceneB, bands, progressFrom(event));",
    scores: { creativity: 19, artDirection: 19, motion: 19, clarity: 14, inspiration: 15, evidence: 10 },
    rationaleZh: '原创近中远景观以真实分层次序交接，模糊峰值和色彩换幕清楚显示了“深度决定消失顺序”的核心机制。'
  },
  {
    id: 'dom-aware-drag-spawned-fish-flock', category: 'canvas', name: 'DOM-aware drag-spawned fish flock', nameZh: '拖拽生成且避让 DOM 的鱼群', order: 17,
    company: 'Sakana AI', homepage: 'https://sakana.ai/', observedAs: 'Drag-spawned DOM-aware fish flock',
    difference: 'The flock shares a measured physics space with a live HTML obstacle and accepts drag-spawned members, unlike a decorative particle swarm or pointer trail.',
    behavior: { trigger: 'pointer drag or animation frame', response: 'New fish join a flock that predicts and curves around a live DOM obstacle', timing: 'continuous flocking with anticipatory avoidance', layer: 'Canvas around interactive DOM' },
    implementationName: 'p5.js', projectId: 'processing-p5-js', projectUrl: 'https://github.com/processing/p5.js', referenceUrl: 'https://p5js.org/reference/',
    snippet: "import p5 from 'p5';\nnew p5(p => { p.mouseDragged = () => flock.add(p.mouseX, p.mouseY); p.draw = () => flock.avoid(button.getBoundingClientRect()).step(p); });",
    scores: { creativity: 20, artDirection: 18, motion: 20, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '鱼群轨迹、拖拽指示和会呼吸的真实 DOM 障碍形成同一空间，分流再汇合的物理意图在缩略图中仍然清楚。'
  },
  {
    id: 'synchronized-scenario-scene-handoff', category: 'transition', name: 'Synchronized scenario scene handoff', nameZh: '多层同步场景换幕', order: 18,
    company: 'Vapi', homepage: 'https://vapi.ai/', observedAs: 'Synchronized scenario scene handoff',
    difference: 'One operator-owned state atomically coordinates a case-specific background, issue summary, queue and priority, primary action, and perspective status across three operational support scenarios; there is no timed carousel.',
    behavior: { trigger: 'real scenario click or Left/Right/Home/End key', response: 'Handoff billing, account-risk, or migration context across five synchronized semantic layers', timing: 'content folds through a hidden midpoint while scene planes crossfade; reduced motion switches directly', layer: 'Customer-support routing workbench' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "animate(0,1,{onUpdate:p=>syncSceneSummaryRouteActionPerspective(p,from,to)});",
    scores: { creativity: 19, artDirection: 19, motion: 20, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '背景材质、遮罩、排版与立体标签在同一节拍原子换幕，视觉叙事完整且不同层的职责都能被辨认。'
  },
  {
    id: 'prompt-select-replace-loop', category: 'vector', name: 'Semantic prompt revision workspace', nameZh: '语义提示词修订工作台', order: 19,
    company: 'Granola', homepage: 'https://www.granola.ai/', observedAs: 'Type-select-replace prompt loop',
    difference: 'A real DOM Range selects one meaningful prompt field, offers field-specific alternatives, previews the before/after diff, and retains the replacement only after explicit approval.',
    behavior: { trigger: 'trusted text selection, replacement choice, and explicit Apply', response: 'The selected semantic span is staged, compared, and replaced while native selection and revision history remain available', timing: 'finite feedback after each human decision only', layer: 'Full-stage prompt revision workspace' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate } from 'motion';\nconst selection = animate('.selection', { scaleX: [0, 1] });\nselection.finished.then(() => replacePromptText());",
    scores: { creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '真人先用原生 DOM Range 选中一个语义字段，再选择字段专属替代项并显式 Apply；before/after、保留结果、Undo/Reset 与无输入静止共同把脚本化循环变成可信的 Prompt 修订流程。'
  },
  {
    id: 'traveling-dot-headline-rewriter', category: 'vector', name: 'Human-approved headline revision marker', nameZh: '人工确认的标题修订标记', order: 20,
    company: 'PolyAI', homepage: 'https://poly.ai/', observedAs: 'Traveling-dot headline eraser-writer',
    difference: 'A trusted revision choice sends one spatial marker across measured glyph and control positions to erase the current copy, collect the selected edit, and write the approved line.',
    behavior: { trigger: 'trusted revision choice or explicit undo', response: 'The marker performs one finite erase, collect, and write pass before retaining the approved copy', timing: '950ms seekable transition after input only', layer: 'Editorial headline review workspace' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate, stagger } from 'motion';\nanimate('.travel-dot', { x: [0, wordWidth] });\nanimate('.glyph', { opacity: [1, 0] }, { delay: stagger(.04) });",
    scores: { creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '它把抽象的标题特效改造成可决策的文案审阅台：真人选择一个候选修订后，圆点沿实测字形与按钮位置完成一次有限的擦除、取回与写入，结果会保留并可显式撤销；首帧和无输入时完全静止。'
  },
  {
    id: 'infinite-curved-text-conveyor', category: 'vector', name: 'Human-routed curved wayfinding ribbons', nameZh: '人工调校的曲线导视文字带', order: 21,
    company: 'Wispr Flow', homepage: 'https://wisprflow.ai/', observedAs: 'Infinite curved text-path conveyor',
    difference: 'A trusted captured drag seeks two paused Motion controls together, moving repeated venue messages in opposing directions along two authored crossing SVG paths.',
    behavior: { trigger: 'trusted captured drag, direction button, or keyboard route command', response: 'Two repeated wayfinding ribbons move in opposing directions and retain the chosen route offset', timing: 'direct finite seek after human input only', layer: 'Full-stage arena wayfinding calibration field' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate } from 'motion';\nanimate('#curve-a textPath', { attr: { startOffset: ['0%', '100%'] } }, { duration: 8, repeat: Infinity, ease: 'linear' });",
    scores: { creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '真人拖拽、按钮或键盘同步 seek 两个暂停的 Motion 控制器，让场馆导视与末班提示沿两条真实 SVG 曲线反向移动并稳定停留；首帧和输入间完全静止，不再是自动跑马灯。'
  },
  {
    id: 'autonomous-agent-cursor-constellation', category: 'animation', name: 'Named-agent artifact handoff', nameZh: '具名 Agent 制品交接', order: 22,
    company: 'InVideo', homepage: 'https://invideo.io/', observedAs: 'Autonomous agent-cursor constellation',
    difference: 'One human-selected checkpoint gives a named Scout, Maker, or Critic visible ownership of the same artifact, carrying stage-specific evidence along a measured cursor path instead of filling the workspace with autonomous cursor confetti.',
    behavior: { trigger: 'real checkpoint click/tap or keyboard activation', response: 'The selected named cursor carries its matching evidence to one shared artifact while owner, copy, receipt, socket, and status update together', timing: 'human-owned, interruptible one-shot handoff with no autoplay or capture-clock selection', layer: 'Collaborative workspace and shared artifact' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate } from 'motion';\nconst control = animate(selectedCursor, { x: [0, midX, socketX], y: [0, arcY, socketY] }, { duration: .76, autoplay: false });\ncheckpoint.addEventListener('click', () => control.play());",
    scores: { creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '真人指派 Scout、Maker 或 Critic 后，具名光标携带可见证据包沿实测路径前往制品插槽；只有到达后才提交内容，中途改选会取消旧交付且绝不提前写入，结果可保留、复位并支持键盘。'
  },
  {
    id: 'scroll-linked-multilayer-starfield', category: 'scroll', name: 'Scroll-linked observatory field guide', nameZh: '滚动联动天文台观测导览', order: 23,
    company: 'Fathom', homepage: 'https://fathom.video/', observedAs: 'Scroll-linked multilayer starfield drift',
    difference: 'One human-owned observation progress signal moves 54 far, 34 middle, and 20 near stars at auditable 0.17/0.48/1.00 rates while four scientific chapters keep the depth change anchored to a real sky-reading task.',
    behavior: { trigger: 'real wheel, captured vertical drag, chapter selection, or Arrow/Page/Home/End key', response: 'Far, middle, and near seeded star layers separate at distinct rates as the field guide advances from horizon lock to a logged near pass', timing: 'direct progress-linked parallax with outward wheel release at both boundaries and no automatic drift', layer: 'p5 Canvas sky below a semantic observatory guide and chapter rail' },
    implementationName: 'p5.js', projectId: 'processing-p5-js', projectUrl: 'https://github.com/processing/p5.js', referenceUrl: 'https://p5js.org/reference/',
    snippet: "import p5 from 'p5';\nnew p5(p => { p.setup=()=>p.noLoop(); p.draw=()=>layers.forEach((stars, depth)=>drawStars(p, stars, progress*speeds[depth])); });\nviewport.addEventListener('wheel', event => { progress=clamp(progress+event.deltaY*.0011); sketch.redraw(); });",
    scores: { creativity: 17, artDirection: 19, motion: 19, clarity: 14, inspiration: 15, evidence: 10 },
    rationaleZh: '54/34/20 颗确定性星点以 0.17/0.48/1.00 的可核验速率响应同一真人进度；四个观测章节、目标标注和纵深读数让视差服务于真实夜空判读。'
  },
  {
    id: 'staggered-multichart-telemetry-boot', category: 'canvas', name: 'Staggered multi-chart telemetry boot', nameZh: '交错多图表遥测启动', order: 24,
    company: 'Pinecone', homepage: 'https://www.pinecone.io/', observedAs: 'Staggered multi-chart telemetry boot',
    difference: 'Independent chart loaders resolve in sequence and each real data trace progressively draws online, rather than moving generic DOM elements through a staggered entrance.',
    behavior: { trigger: 'dashboard mount or restart', response: 'Loaders resolve and distinct telemetry charts progressively draw online in sequence', timing: 'staggered multi-stage boot', layer: 'Canvas dashboard panels' },
    implementationName: 'p5.js', projectId: 'processing-p5-js', projectUrl: 'https://github.com/processing/p5.js', referenceUrl: 'https://p5js.org/reference/',
    snippet: "import p5 from 'p5';\nnew p5(p => { p.draw = () => charts.forEach((chart, i) => chart.draw(p, clamp(progress * 4 - i * .45, 0, 1))); });",
    scores: { creativity: 18, artDirection: 18, motion: 19, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '多种图表经历加载、刻度、曲线和实时光点四段上线，序列关系明确，避免退化成普通卡片错峰入场。'
  },
  {
    id: 'delayed-dropdown-promo-sweep', category: 'transition', name: 'Delayed dropdown promo sweep', nameZh: '延迟触发的下拉推广扫光', order: 25,
    company: 'Glean', homepage: 'https://www.glean.com/', observedAs: 'Delayed dropdown promo sweep',
    difference: 'The accessible product navigation opens first, then a one-shot light sweep introduces one concrete featured daypack after a semantic delay and fully cancels or resets when the disclosure closes.',
    behavior: { trigger: 'real disclosure click, ArrowDown, Escape, outside click, or focus exit', response: 'Expose useful category links immediately, then reveal one featured daypack with a delayed one-shot sweep', timing: 'open, useful pause, single sweep, cancellable close, restart on reopen', layer: 'Focusable navigation overlay and raster promo card' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate } from 'motion';\nopenMenu(); const timer=setTimeout(() => animate('.promo-beam',{x:['-110%','610%']}),680);\ncloseMenu=()=>{clearTimeout(timer);menu.inert=true;};",
    scores: { creativity: 16, artDirection: 18, motion: 19, clarity: 15, inspiration: 14, evidence: 10 },
    rationaleZh: '菜单展开、节奏停顿、重点卡片单次扫光和关闭复位构成明确的导航导视语义，画面层级完整。'
  },
  {
    id: 'self-inverting-fixed-navigation', category: 'scroll', name: 'Contrast-aware fixed navigation reader', nameZh: '对比度感知固定导航阅读器', order: 26,
    company: 'Luma AI', homepage: 'https://lumalabs.ai/', observedAs: 'Self-inverting fixed navigation',
    difference: 'A paused Motion track moves only from trusted reader input while one fixed navigation samples the actual section background underneath and selects the higher WCAG-contrast ink.',
    behavior: { trigger: 'trusted wheel, captured drag, keyboard navigation, or chapter button', response: 'The article moves to the requested position and the fixed navigation reports the sampled color, chosen ink, and measured contrast', timing: 'direct seek after each human input', layer: 'Full-stage three-chapter editorial reader' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate } from 'motion';\ndocument.querySelector('nav').style.mixBlendMode = 'difference';\nanimate('.section-track', { y: [0, -360] }, { duration: 4, repeat: Infinity });",
    scores: { creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '真人拖拽、滚轮、键盘或章节按钮驱动三段长文；固定导航读取实际 computed background，比较深浅两种墨色的 WCAG 对比度并即时显示采样色、比例与选择结果，无输入时页面完全静止。'
  }
].map(makeExpansionEffect);

const projectNameById = {
  'greensock-gsap': 'GSAP',
  'juliangarnier-anime': 'Anime.js',
  'motiondivision-motion': 'Motion',
  'processing-p5-js': 'p5.js',
  'regl-project-regl': 'regl'
};

const scoreDimensions = scores => ({
  creativity: scores.creativity,
  artDirection: scores.artDirection,
  motion: scores.motion,
  clarity: scores.clarity,
  inspiration: scores.inspiration,
  evidence: scores.evidence
});

const researchParty = spec => {
  const url = new URL(spec.sourceUrl);
  if (url.hostname === 'github.com') return [];
  const hostLabel = url.hostname.replace(/^www\./, '').split('.')[0].replace(/[-_]+/g, ' ');
  const name = hostLabel.replace(/\b\w/g, letter => letter.toUpperCase());
  return [{ name, url: spec.sourceUrl, observedAs: spec.name }];
};

const expansion100Prompt = spec => `Implement the "${spec.name}" (${spec.nameZh}) web interaction effect in the current project.

Use ${projectNameById[spec.implementation.projectId]} with the same real browser rendering mechanism used by the verified local demo. The observed source is ${spec.sourceUrl}; treat it as interaction research, not as permission to copy branding, proprietary assets, or source code.

Interaction contract:
- Trigger: ${spec.behavior.trigger}
- Visual response: ${spec.behavior.response}
- Timing relationship: ${spec.behavior.timing}
- Page layer: ${spec.behavior.layer}

Requirements:
- Preserve the defining trigger, progression, rendering, and continuity signature instead of substituting a generic fade or entrance.
- Integrate with the existing design system and component structure.
- Support keyboard and touch input whenever the interaction is actionable.
- Respect prefers-reduced-motion with a legible non-animated fallback.
- Avoid layout shift, scroll traps, inaccessible focus behavior, unstable randomness, and remote runtime assets.
- Keep capture inputs deterministic and clean up listeners, timers, media, audio, animation frames, and graphics contexts.

Start from this minimal mechanism:

\`\`\`js
${spec.implementation.snippet}
\`\`\`

Return the working code, the files changed, and a short explanation of how to tune timing, geometry, interaction strength, and reduced-motion behavior.`;

const expansion100Effects = effectExpansion100Specs.map((spec, index) => {
  const scores = scoreDimensions(spec.scores);
  return {
    id: spec.id,
    category: spec.category,
    name: spec.name,
    nameZh: spec.nameZh,
    addedIn: '2026-effect-expansion',
    research: {
      sourceUrl: spec.sourceUrl,
      difference: `${spec.difference} 本项的触发、推进、渲染与连续性签名均与现有目录不同。`,
      verifiedAt: '2026-07-20'
    },
    behavior: spec.behavior,
    prompt: expansion100Prompt(spec),
    sources: [{
      projectId: spec.implementation.projectId,
      recommended: true,
      snippet: spec.implementation.snippet,
      preview: `captured/${spec.id}`,
      previewKind: 'local-demo-capture',
      demoPath: `preview-demos/dist/${spec.id}.html`,
      demoSourcePath: `preview-demos/${spec.id}.html`,
      originUrl: spec.implementation.projectUrl,
      referenceUrl: spec.sourceUrl,
      previewRecipe: null
    }],
    order: 27 + index,
    relatedParties: researchParty(spec),
    admission: {
      policyVersion: '2026-07-17',
      scores,
      total: Object.values(scores).reduce((total, score) => total + score, 0),
      decision: 'admit',
      reasonCode: 'passed',
      rationaleZh: spec.rationaleZh
    }
  };
});

const expansion150Prompt = spec => `Implement the "${spec.name}" (${spec.nameZh}) web interaction effect in the current project.

Use ${projectNameById[spec.implementation.projectId]} with the same real browser rendering mechanism used by the verified local demo. The research source is ${spec.sourceUrl}; use it only to understand the interaction idea, not to copy branding, assets, or proprietary source code.

Interaction contract:
- Trigger: ${spec.behavior.trigger}
- Visual response: ${spec.behavior.response}
- Timing relationship: ${spec.behavior.timing}
- Page layer: ${spec.behavior.layer}

Requirements:
- Preserve the defining trigger, progression, rendering, and continuity signature instead of substituting a generic fade or entrance.
- Integrate with the existing design system and component structure.
- Support keyboard, pointer, and touch input whenever the interaction is actionable.
- Respect prefers-reduced-motion with a clear, legible non-animated fallback.
- Avoid layout shift, scroll traps, inaccessible focus behavior, unstable randomness, and remote runtime assets.
- Wait for essential visual resources before revealing the scene, show an intentional loading transition, and clean up listeners, timers, animation frames, and graphics contexts.

Start from this minimal mechanism:

\`\`\`js
${spec.implementation.snippet}
\`\`\`

Return the working code, the files changed, and a short explanation of how to tune timing, geometry, interaction strength, loading behavior, and reduced-motion behavior.`;

const expansion150Effects = [...effectExpansion150BatchA1, ...effectExpansion150BatchA2, ...effectExpansion150BatchA3, ...effectExpansion150BatchB]
  .sort((left, right) => left.order - right.order)
  .map(spec => {
  const scores = scoreDimensions(spec.scores);
  return {
    id: spec.id,
    category: spec.category,
    name: spec.name,
    nameZh: spec.nameZh,
    addedIn: '2026-effect-expansion',
    research: {
      sourceUrl: spec.sourceUrl,
      difference: `${spec.difference} Its trigger, progression, renderer, and continuity signature are distinct from the existing catalog.`,
      verifiedAt: '2026-07-20'
    },
    behavior: spec.behavior,
    prompt: expansion150Prompt(spec),
    sources: [{
      projectId: spec.implementation.projectId,
      recommended: true,
      snippet: spec.implementation.snippet,
      preview: `captured/${spec.id}`,
      previewKind: 'local-demo-capture',
      demoPath: `preview-demos/dist/${spec.id}.html`,
      demoSourcePath: `preview-demos/${spec.id}.html`,
      originUrl: spec.implementation.projectUrl,
      referenceUrl: spec.implementation.referenceUrl || spec.sourceUrl,
      previewRecipe: null
    }],
    order: spec.order,
    relatedParties: researchParty(spec),
    admission: {
      policyVersion: '2026-07-17',
      scores,
      total: Object.values(scores).reduce((total, score) => total + score, 0),
      decision: 'admit',
      reasonCode: 'passed',
      rationaleZh: spec.rationaleZh
    }
  };
  });

export const effects = [...existingEffects, ...expansionEffects, ...expansion100Effects, ...expansion150Effects];

export const projects = [
  {
    "id": "greensock-gsap",
    "name": "GSAP",
    "repo": "greensock/GSAP",
    "url": "https://github.com/greensock/GSAP",
    "stars": 26600,
    "addedIn": "baseline",
    "legacy": false
  },
  {
    "id": "motiondivision-motion",
    "name": "Motion",
    "repo": "motiondivision/motion",
    "url": "https://github.com/motiondivision/motion",
    "stars": 32819,
    "addedIn": "baseline",
    "legacy": false
  },
  {
    "id": "juliangarnier-anime",
    "name": "Anime.js",
    "repo": "juliangarnier/anime",
    "url": "https://github.com/juliangarnier/anime",
    "stars": 71056,
    "addedIn": "2026-expansion",
    "legacy": false
  },
  {
    "id": "mojs-mojs",
    "name": "Mo.js",
    "repo": "mojs/mojs",
    "url": "https://github.com/mojs/mojs",
    "stars": 18728,
    "addedIn": "2026-expansion",
    "legacy": false
  },
  {
    "id": "theatre-js-theatre",
    "name": "Theatre.js",
    "repo": "theatre-js/theatre",
    "url": "https://github.com/theatre-js/theatre",
    "stars": 12541,
    "addedIn": "2026-expansion",
    "legacy": false
  },
  {
    "id": "thednp-kute-js",
    "name": "KUTE.js",
    "repo": "thednp/kute.js",
    "url": "https://github.com/thednp/kute.js",
    "stars": 2639,
    "addedIn": "2026-expansion",
    "legacy": false
  },
  {
    "id": "metafizzy-isotope",
    "name": "Isotope",
    "repo": "metafizzy/isotope",
    "url": "https://github.com/metafizzy/isotope",
    "stars": 11103,
    "addedIn": "baseline",
    "legacy": true
  },
  {
    "id": "micku7zu-vanilla-tilt-js",
    "name": "vanilla-tilt.js",
    "repo": "micku7zu/vanilla-tilt.js",
    "url": "https://github.com/micku7zu/vanilla-tilt.js",
    "stars": 4019,
    "addedIn": "baseline",
    "legacy": false
  },
  {
    "id": "cuberto-mouse-follower",
    "name": "mouse-follower",
    "repo": "Cuberto/mouse-follower",
    "url": "https://github.com/Cuberto/mouse-follower",
    "stars": 818,
    "addedIn": "baseline",
    "legacy": false
  },
  {
    "id": "robin-dela-hover-effect",
    "name": "hover-effect",
    "repo": "robin-dela/hover-effect",
    "url": "https://github.com/robin-dela/hover-effect",
    "stars": 1874,
    "addedIn": "baseline",
    "legacy": false
  },
  {
    "id": "maxwellito-vivus",
    "name": "Vivus",
    "repo": "maxwellito/vivus",
    "url": "https://github.com/maxwellito/vivus",
    "stars": 15479,
    "addedIn": "baseline",
    "legacy": true
  },
  {
    "id": "processing-p5-js",
    "name": "p5.js",
    "repo": "processing/p5.js",
    "url": "https://github.com/processing/p5.js",
    "stars": 23797,
    "addedIn": "2026-expansion",
    "legacy": false
  },
  {
    "id": "regl-project-regl",
    "name": "regl",
    "repo": "regl-project/regl",
    "url": "https://github.com/regl-project/regl",
    "stars": 5557,
    "addedIn": "2026-expansion",
    "legacy": false
  },
  {
    "id": "martinlaxenaire-curtainsjs",
    "name": "Curtains.js",
    "repo": "martinlaxenaire/curtainsjs",
    "url": "https://github.com/martinlaxenaire/curtainsjs",
    "stars": 1823,
    "addedIn": "2026-expansion",
    "legacy": false
  }
];
