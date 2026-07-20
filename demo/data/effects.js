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
      "trigger": "scroll",
      "response": "Pinned horizontal scroll scene",
      "timing": "continuous progress-linked",
      "layer": "content"
    },
    "prompt": "Implement the \"Pinned horizontal scroll scene\" (固定式横向滚动场景) web interaction effect in the current project.\n\nUse GSAP (greensock/GSAP) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific scroll interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: scroll\n- Visual response: Pinned horizontal scroll scene\n- Timing relationship: continuous progress-linked\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\ngsap.registerPlugin(ScrollTrigger);\ngsap.to('.track', { xPercent: -75, ease: 'none', scrollTrigger: { trigger: '.gallery', pin: true, scrub: 1, end: '+=2400' } });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "greensock-gsap",
        "recommended": true,
        "snippet": "import { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\ngsap.registerPlugin(ScrollTrigger);\ngsap.to('.track', { xPercent: -75, ease: 'none', scrollTrigger: { trigger: '.gallery', pin: true, scrub: 1, end: '+=2400' } });",
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
      "rationaleZh": "编辑式构图、固定视口与横向叙事形成完整创作语言，动作和空间关系一眼可辨。"
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
      "trigger": "state change or animation frame",
      "response": "Shared-layout spring morph",
      "timing": "spring or physics-based",
      "layer": "content"
    },
    "prompt": "Implement the \"Shared-layout spring morph\" (共享布局弹簧变形) web interaction effect in the current project.\n\nUse Motion (motiondivision/motion) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific animation interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: state change or animation frame\n- Visual response: Shared-layout spring morph\n- Timing relationship: spring or physics-based\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport { animate } from 'motion';\nanimate('.card', { x: 80, borderRadius: 24 }, { type: 'spring' });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "motiondivision-motion",
        "recommended": true,
        "snippet": "import { animate } from 'motion';\nanimate('.card', { x: 80, borderRadius: 24 }, { type: 'spring' });",
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
      "rationaleZh": "共享元素在紧凑与展开布局间连续变形，弹簧质感、层级和视觉焦点都很完整。"
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
      "trigger": "state change or animation frame",
      "response": "Staggered transform choreography",
      "timing": "sequenced",
      "layer": "content"
    },
    "prompt": "Implement the \"Staggered transform choreography\" (交错变换编排) web interaction effect in the current project.\n\nUse Anime.js (juliangarnier/anime) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific animation interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: state change or animation frame\n- Visual response: Staggered transform choreography\n- Timing relationship: sequenced\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport { animate, stagger } from 'animejs';\nanimate('.dot', { x: 80, delay: stagger(60) });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "juliangarnier-anime",
        "recommended": true,
        "snippet": "import { animate, stagger } from 'animejs';\nanimate('.dot', { x: 80, delay: stagger(60) });",
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
      "rationaleZh": "多元素错峰、轨迹和聚散关系明确，能直接转译为“交错编排”创作描述。"
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
      "trigger": "state change or animation frame",
      "response": "Motion-graphics burst",
      "timing": "eased transition",
      "layer": "content"
    },
    "prompt": "Implement the \"Motion-graphics burst\" (动态图形爆发) web interaction effect in the current project.\n\nUse Mo.js (mojs/mojs) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific animation interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: state change or animation frame\n- Visual response: Motion-graphics burst\n- Timing relationship: eased transition\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport mojs from '@mojs/core';\nnew mojs.Burst({ parent: '#stage', radius: { 0: 80 }, count: 10 }).play();\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "mojs-mojs",
        "recommended": true,
        "snippet": "import mojs from '@mojs/core';\nnew mojs.Burst({ parent: '#stage', radius: { 0: 80 }, count: 10 }).play();",
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
      "rationaleZh": "径向爆发、层次、节奏和循环复位完整，是可直接命名和迁移的动态图形事件。"
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
      "trigger": "state change or animation frame",
      "response": "Visually authored keyframe sequence",
      "timing": "sequenced",
      "layer": "content"
    },
    "prompt": "Implement the \"Visually authored keyframe sequence\" (可视化编排关键帧序列) web interaction effect in the current project.\n\nUse Theatre.js (theatre-js/theatre) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific animation interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: state change or animation frame\n- Visual response: Visually authored keyframe sequence\n- Timing relationship: sequenced\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport { getProject } from '@theatre/core';\nconst sheet = getProject('Demo').sheet('Scene');\nconst card = sheet.object('Card', { x: 0 }); card.onValuesChange(({ x }) => element.style.translate = `${x}px`);\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "theatre-js-theatre",
        "recommended": true,
        "snippet": "import { getProject } from '@theatre/core';\nconst sheet = getProject('Demo').sheet('Scene');\nconst card = sheet.object('Card', { x: 0 }); card.onValuesChange(({ x }) => element.style.translate = `${x}px`);",
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
      "rationaleZh": "五个关键姿态、路径和时间游标同时可见，既有表现力也能解释关键帧编排。"
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
      "trigger": "state change or animation frame",
      "response": "Compact SVG shape tween",
      "timing": "eased transition",
      "layer": "content"
    },
    "prompt": "Implement the \"Compact SVG shape tween\" (轻量 SVG 形状补间) web interaction effect in the current project.\n\nUse KUTE.js (thednp/kute.js) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific animation interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: state change or animation frame\n- Visual response: Compact SVG shape tween\n- Timing relationship: eased transition\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport KUTE from 'kute.js';\nKUTE.to('#shape-a', { path: '#shape-b' }, { duration: 700 }).start();\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "thednp-kute-js",
        "recommended": true,
        "snippet": "import KUTE from 'kute.js';\nKUTE.to('#shape-a', { path: '#shape-b' }, { duration: 700 }).start();",
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
      "rationaleZh": "星形与心形的拓扑变形干净、连贯、辨识度高，适合作为形状补间的视觉词汇。"
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
      "trigger": "mount or viewport entry",
      "response": "SVG stroke drawing",
      "timing": "eased transition",
      "layer": "content"
    },
    "prompt": "Implement the \"SVG stroke drawing\" (SVG 描边绘制) web interaction effect in the current project.\n\nUse Vivus (maxwellito/vivus) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific vector interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: mount or viewport entry\n- Visual response: SVG stroke drawing\n- Timing relationship: eased transition\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport Vivus from 'vivus';\nnew Vivus('logo', { duration: 120, type: 'oneByOne' });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "maxwellito-vivus",
        "recommended": true,
        "snippet": "import Vivus from 'vivus';\nnew Vivus('logo', { duration: 120, type: 'oneByOne' });",
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
      "rationaleZh": "路径逐笔显现并完成纸飞机图形，动作含义、时序和缩略图辨识度都可靠。"
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
      "trigger": "state change or animation frame",
      "response": "Sketch-style creative coding loop",
      "timing": "continuous loop",
      "layer": "canvas or 2D surface"
    },
    "prompt": "Implement the \"Sketch-style creative coding loop\" (草图式创意编程循环) web interaction effect in the current project.\n\nUse p5.js (processing/p5.js) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific canvas interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: state change or animation frame\n- Visual response: Sketch-style creative coding loop\n- Timing relationship: continuous loop\n- Page layer: canvas or 2D surface\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport p5 from 'p5';\nnew p5(p => { p.setup = () => p.createCanvas(320, 180); p.draw = () => p.circle(p.mouseX, p.mouseY, 40); });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "processing-p5-js",
        "recommended": true,
        "snippet": "import p5 from 'p5';\nnew p5(p => { p.setup = () => p.createCanvas(320, 180); p.draw = () => p.circle(p.mouseX, p.mouseY, 40); });",
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
      "rationaleZh": "多层波形、粒子与色彩构成稳定的生成艺术循环，既有风格也便于继续创作。"
    }
  },
  {
    "id": "functional-webgl-draw-commands",
    "category": "webgl",
    "name": "GPU-instanced particle vortex",
    "nameZh": "GPU 实例化粒子涡旋",
    "addedIn": "2026-expansion",
    "research": null,
    "behavior": {
      "trigger": "animation frame",
      "response": "GPU-instanced particle vortex",
      "timing": "continuous loop",
      "layer": "3D or WebGL surface"
    },
    "prompt": "Implement the \"GPU-instanced particle vortex\" (GPU 实例化粒子涡旋) web interaction effect in the current project.\n\nUse regl (regl-project/regl) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific webgl interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: animation frame\n- Visual response: GPU-instanced particle vortex\n- Timing relationship: continuous loop\n- Page layer: 3D or WebGL surface\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport createREGL from 'regl';\nconst regl = createREGL();\nregl({ frag, vert, count: 3 })();\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "regl-project-regl",
        "recommended": true,
        "snippet": "import createREGL from 'regl';\nconst regl = createREGL();\nregl({ frag, vert, count: 3 })();",
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
      "rationaleZh": "实例化粒子形成持续演化的涡旋流场，空间、节奏与色彩均达到完整生成艺术水准。"
    }
  },
  {
    "id": "dom-synced-shader-planes",
    "category": "webgl",
    "name": "DOM-bound iridescent shader plane",
    "nameZh": "DOM 绑定虹彩着色器平面",
    "addedIn": "2026-expansion",
    "research": null,
    "behavior": {
      "trigger": "DOM movement or resize",
      "response": "DOM-bound iridescent shader plane",
      "timing": "continuously synchronized",
      "layer": "DOM-bound WebGL surface"
    },
    "prompt": "Implement the \"DOM-bound iridescent shader plane\" (DOM 绑定虹彩着色器平面) web interaction effect in the current project.\n\nUse Curtains.js (martinlaxenaire/curtainsjs) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific webgl interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: DOM movement or resize\n- Visual response: DOM-bound iridescent shader plane\n- Timing relationship: continuously synchronized\n- Page layer: DOM-bound WebGL surface\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport { Curtains, Plane } from 'curtainsjs';\nconst curtains = new Curtains({ container: 'canvas' });\nnew Plane(curtains, document.querySelector('.plane'), { vertexShader, fragmentShader });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
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
        "creativity": 18,
        "artDirection": 19,
        "motion": 18,
        "clarity": 14,
        "inspiration": 15,
        "evidence": 10
      },
      "total": 94,
      "decision": "admit",
      "reasonCode": "passed",
      "rationaleZh": "DOM 边界内的虹彩着色器形变具有清晰材质签名，技术机制与视觉结果高度一致。"
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
    id: 'prompt-select-replace-loop', category: 'vector', name: 'Type-select-replace prompt loop', nameZh: '输入—选中—替换提示词循环', order: 19,
    company: 'Granola', homepage: 'https://www.granola.ai/', observedAs: 'Type-select-replace prompt loop',
    difference: 'The loop explicitly types, selects a semantic range, and overwrites it with a new phrase, preserving editor selection and caret states instead of deleting a typewriter string.',
    behavior: { trigger: 'animation frame or editor action', response: 'A prompt is typed, semantically selected, and replaced in place', timing: 'phased edit loop', layer: 'Editor text surface' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate } from 'motion';\nconst selection = animate('.selection', { scaleX: [0, 1] });\nselection.finished.then(() => replacePromptText());",
    scores: { creativity: 19, artDirection: 18, motion: 20, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '输入、真实选择态、覆盖替换和光标落位构成完整编辑语义，区别于普通打字机，短循环也能读懂行为。'
  },
  {
    id: 'traveling-dot-headline-rewriter', category: 'vector', name: 'Traveling-dot headline eraser-writer', nameZh: '旅行圆点擦写标题', order: 20,
    company: 'PolyAI', homepage: 'https://poly.ai/', observedAs: 'Traveling-dot headline eraser-writer',
    difference: 'A spatial marker crosses measured glyph positions to erase the old word and write the new word in opposing directions instead of fading or scrambling text in place.',
    behavior: { trigger: 'animation frame', response: 'A traveling dot erases one headline word and writes the next along its measured path', timing: 'bidirectional sequenced rewrite', layer: 'Headline typography' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate, stagger } from 'motion';\nanimate('.travel-dot', { x: [0, wordWidth] });\nanimate('.glyph', { opacity: [1, 0] }, { delay: stagger(.04) });",
    scores: { creativity: 19, artDirection: 18, motion: 20, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '圆点是擦除与写入的可见因果主体，字符级方向、停顿和新词着色形成鲜明的标题级视觉签名。'
  },
  {
    id: 'infinite-curved-text-conveyor', category: 'vector', name: 'Infinite curved text-path conveyor', nameZh: '无限曲线文字传送带', order: 21,
    company: 'Wispr Flow', homepage: 'https://wisprflow.ai/', observedAs: 'Infinite curved text-path conveyor',
    difference: 'Repeated text is laid out by real SVG paths and circulates along intersecting curves with front-back depth, rather than translating a straight marquee rail.',
    behavior: { trigger: 'animation frame', response: 'Repeated phrases travel continuously along crossing curved SVG paths', timing: 'seamless counter-moving loop', layer: 'SVG typography field' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate } from 'motion';\nanimate('#curve-a textPath', { attr: { startOffset: ['0%', '100%'] } }, { duration: 8, repeat: Infinity, ease: 'linear' });",
    scores: { creativity: 18, artDirection: 19, motion: 19, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '两条真实曲线路径承载反向流动的排版，并通过交汇遮挡建立前后关系，和直线跑马灯有明确视觉差异。'
  },
  {
    id: 'autonomous-agent-cursor-constellation', category: 'animation', name: 'Autonomous agent-cursor constellation', nameZh: '自主 Agent 光标星座', order: 22,
    company: 'InVideo', homepage: 'https://invideo.io/', observedAs: 'Autonomous agent-cursor constellation',
    difference: 'Several named cursors act as autonomous narrative collaborators with independent routes and annotations, unlike the single visitor-controlled contextual cursor already published.',
    behavior: { trigger: 'animation frame', response: 'Named agent cursors independently orbit tasks, pause, and leave annotations', timing: 'continuous asynchronous choreography', layer: 'Collaborative workspace overlay' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate, stagger } from 'motion';\nanimate('.agent-cursor', { offsetDistance: ['0%', '100%'] }, { delay: stagger(.3), duration: 5, repeat: Infinity });",
    scores: { creativity: 18, artDirection: 18, motion: 19, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '多名具名光标拥有不同轨迹、停靠目标和批注角色，清楚表达并行 Agent 协作而不是用户指针跟随。'
  },
  {
    id: 'scroll-linked-multilayer-starfield', category: 'scroll', name: 'Scroll-linked multilayer starfield drift', nameZh: '滚动联动多层星空', order: 23,
    company: 'Fathom', homepage: 'https://fathom.video/', observedAs: 'Scroll-linked multilayer starfield drift',
    difference: 'Three independently sampled star layers move at separate progress-linked rates around fixed editorial content, creating measurable depth instead of a single parallax background.',
    behavior: { trigger: 'scroll progress', response: 'Near, middle, and far star layers drift at distinct rates around a fixed title', timing: 'continuous progress-linked parallax', layer: 'Canvas background layers' },
    implementationName: 'p5.js', projectId: 'processing-p5-js', projectUrl: 'https://github.com/processing/p5.js', referenceUrl: 'https://p5js.org/reference/',
    snippet: "import p5 from 'p5';\nnew p5(p => { p.draw = () => layers.forEach((stars, depth) => drawStars(p, stars, progress * speeds[depth])); });",
    scores: { creativity: 17, artDirection: 19, motion: 19, clarity: 14, inspiration: 15, evidence: 10 },
    rationaleZh: '固定海报标题提供参照，近中远三层星点在密度、尺寸和速度上同时分级，滚动纵深一眼可辨。'
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
    id: 'self-inverting-fixed-navigation', category: 'scroll', name: 'Self-inverting fixed navigation', nameZh: '自动反色的固定导航', order: 26,
    company: 'Luma AI', homepage: 'https://lumalabs.ai/', observedAs: 'Self-inverting fixed navigation',
    difference: 'A single fixed navigation surface continuously derives contrast from the actual pixels below it through compositing, instead of listening for sections and switching theme classes.',
    behavior: { trigger: 'scroll or background movement', response: 'One fixed navigation automatically inverts over changing light and dark sections', timing: 'continuous compositing response', layer: 'Fixed navigation over page content' },
    implementationName: 'Motion', projectId: 'motiondivision-motion', projectUrl: 'https://github.com/motiondivision/motion', referenceUrl: 'https://motion.dev/docs',
    snippet: "import { animate } from 'motion';\ndocument.querySelector('nav').style.mixBlendMode = 'difference';\nanimate('.section-track', { y: [0, -360] }, { duration: 4, repeat: Infinity });",
    scores: { creativity: 18, artDirection: 17, motion: 17, clarity: 15, inspiration: 15, evidence: 10 },
    rationaleZh: '同一固定导航穿越明暗、荧光和网格区域时由真实混合模式连续反相，无需主题类，机制纯粹且构图清楚。'
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
