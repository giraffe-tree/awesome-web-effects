// Curator-approved release catalog. Rejected candidates remain documented in research/demo-admission-audit-2026-07-17.md.
export const snapshotDate = "2026-07-17";

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

export const effects = [
  {
    "id": "scroll-scrubbed-master-timeline",
    "category": "animation",
    "name": "Scroll-scrubbed master timeline",
    "nameZh": "滚动擦洗主时间线",
    "addedIn": "baseline",
    "research": null,
    "behavior": {
      "trigger": "scroll",
      "response": "Scroll-scrubbed master timeline",
      "timing": "continuous progress-linked",
      "layer": "content"
    },
    "prompt": "Implement the \"Scroll-scrubbed master timeline\" (滚动擦洗主时间线) web interaction effect in the current project.\n\nUse GSAP (greensock/GSAP) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific animation interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: scroll\n- Visual response: Scroll-scrubbed master timeline\n- Timing relationship: continuous progress-linked\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\ngsap.registerPlugin(ScrollTrigger);\nconst timeline = gsap.timeline({ scrollTrigger: { trigger: '.scene', scrub: true } });\ntimeline.to('.card', { x: 80 }).to('.card', { rotate: 6 });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "greensock-gsap",
        "recommended": true,
        "snippet": "import { gsap } from 'gsap';\nimport { ScrollTrigger } from 'gsap/ScrollTrigger';\ngsap.registerPlugin(ScrollTrigger);\nconst timeline = gsap.timeline({ scrollTrigger: { trigger: '.scene', scrub: true } });\ntimeline.to('.card', { x: 80 }).to('.card', { rotate: 6 });",
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
      "rationaleZh": "滚动进度、三段卡片状态与时间线关系清楚，视觉完成度足以作为编排参考。"
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
      "trigger": "state change or animation frame",
      "response": "Filterable grid reflow",
      "timing": "eased transition",
      "layer": "content"
    },
    "prompt": "Implement the \"Filterable grid reflow\" (可筛选网格重排) web interaction effect in the current project.\n\nUse Isotope (metafizzy/isotope) as the recommended implementation unless the existing stack makes a dependency-free equivalent more appropriate. Recreate this specific transition interaction, not a generic animation.\n\nInteraction contract:\n- Trigger: state change or animation frame\n- Visual response: Filterable grid reflow\n- Timing relationship: eased transition\n- Page layer: content\n\nRequirements:\n- Integrate with the existing design system and component structure.\n- Support keyboard and touch input whenever the interaction is actionable.\n- Respect prefers-reduced-motion with a clear non-animated fallback.\n- Avoid layout shift, scroll traps, inaccessible focus behavior, and unnecessary dependencies.\n- Keep the implementation responsive and clean up listeners, timers, and animation instances.\n\nStart from this minimal API shape:\n\n```js\nimport Isotope from 'isotope-layout';\nconst grid = new Isotope('.grid', { itemSelector: '.item' });\ngrid.arrange({ filter: '.featured' });\n```\n\nReturn the working code, the files changed, and a short explanation of how to tune timing, easing, distance, and reduced-motion behavior.",
    "sources": [
      {
        "projectId": "metafizzy-isotope",
        "recommended": true,
        "snippet": "import Isotope from 'isotope-layout';\nconst grid = new Isotope('.grid', { itemSelector: '.item' });\ngrid.arrange({ filter: '.featured' });",
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
      "trigger": "pointer or touch",
      "response": "Perspective tilt and glare",
      "timing": "eased transition",
      "layer": "content"
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
