import { effectExpansion100Specs } from './effect-expansion-2026-07-20.js';
import { effectExpansion150BatchA1 } from './effect-expansion-a1-2026-07-20.js';
import { effectExpansion150BatchA2 } from './effect-expansion-a2-2026-07-20.js';
import { effectExpansion150BatchA3 } from './effect-expansion-a3-2026-07-20.js';
import { effectExpansion150BatchB } from './effect-expansion-b-2026-07-20.js';

export const admissionPolicy = {
  version: '2026-07-17',
  threshold: 80,
  dimensions: [
    { id: 'creativity', label: 'Creativity', labelZh: '创意与差异性', maximum: 20 },
    { id: 'artDirection', label: 'Art direction', labelZh: '艺术与视觉完成度', maximum: 20 },
    { id: 'motion', label: 'Motion craft', labelZh: '动效与交互编排', maximum: 20 },
    { id: 'clarity', label: 'Effect legibility', labelZh: '效果辨识与可描述性', maximum: 15 },
    { id: 'inspiration', label: 'Creative transfer', labelZh: '创作启发与迁移价值', maximum: 15 },
    { id: 'evidence', label: 'Evidence quality', labelZh: '证据与可复现性', maximum: 10 }
  ],
  minimums: {
    artDirection: 14,
    motion: 14,
    clarity: 11,
    evidence: 8
  }
};

export const admissionAuditSummary = {
  auditedAt: '2026-07-20',
  candidateCount: 396,
  reviewedPreviewCount: 163,
  missingPreviewCount: 233,
  admittedCount: 150,
  rejectedCount: 246
};

// Human visual review of every catalog entry that had a verifiable preview on
// 2026-07-17. Entries without a real preview receive a release score of zero in
// evaluateDemoAdmission: visual and motion quality cannot be inferred from a
// repository name, code snippet, or star count.
export const reviewedDemoScores = {
  'scroll-scrubbed-master-timeline': {
    creativity: 13, artDirection: 16, motion: 17, clarity: 15, inspiration: 14, evidence: 10,
    rationaleZh: '滚动进度、三段卡片状态与时间线关系清楚，视觉完成度足以作为编排参考。'
  },
  'pinned-horizontal-scroll-scene': {
    creativity: 18, artDirection: 19, motion: 19, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '编辑式构图、固定视口与横向叙事形成完整创作语言，动作和空间关系一眼可辨。'
  },
  'shared-layout-spring-morph': {
    creativity: 16, artDirection: 19, motion: 19, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '共享元素在紧凑与展开布局间连续变形，弹簧质感、层级和视觉焦点都很完整。'
  },
  'staggered-transform-choreography': {
    creativity: 16, artDirection: 18, motion: 19, clarity: 15, inspiration: 14, evidence: 10,
    rationaleZh: '多元素错峰、轨迹和聚散关系明确，能直接转译为“交错编排”创作描述。'
  },
  'render-agnostic-value-tween': {
    creativity: 8, artDirection: 14, motion: 15, clarity: 11, inspiration: 11, evidence: 10,
    rationaleZh: '实现证据完整，但画面更像数值补间测试台，艺术表达和创作启发不足。'
  },
  'motion-graphics-burst': {
    creativity: 16, artDirection: 18, motion: 19, clarity: 15, inspiration: 14, evidence: 10,
    rationaleZh: '径向爆发、层次、节奏和循环复位完整，是可直接命名和迁移的动态图形事件。'
  },
  'visually-authored-keyframe-sequence': {
    creativity: 13, artDirection: 16, motion: 18, clarity: 13, inspiration: 14, evidence: 10,
    rationaleZh: '五个关键姿态、路径和时间游标同时可见，既有表现力也能解释关键帧编排。'
  },
  'functional-value-pipeline': {
    creativity: 13, artDirection: 15, motion: 16, clarity: 12, inspiration: 13, evidence: 10,
    rationaleZh: '数值管线的解释性很好，但主体仍偏技术仪表，艺术完成度未达到严格准入线。'
  },
  'compact-svg-shape-tween': {
    creativity: 14, artDirection: 18, motion: 18, clarity: 15, inspiration: 14, evidence: 10,
    rationaleZh: '星形与心形的拓扑变形干净、连贯、辨识度高，适合作为形状补间的视觉词汇。'
  },
  'native-friendly-inertial-scrolling': {
    creativity: 11, artDirection: 17, motion: 14, clarity: 10, inspiration: 13, evidence: 8,
    rationaleZh: '官方画面具有强烈品牌艺术指导，但短预览难以清楚传达惯性滚动本身。'
  },
  'step-based-scrollytelling': {
    creativity: 10, artDirection: 10, motion: 13, clarity: 12, inspiration: 11, evidence: 8,
    rationaleZh: '滚动步骤关系可见，但示例构图接近教学占位，缺少足够艺术完成度。'
  },
  'filterable-grid-reflow': {
    creativity: 12, artDirection: 17, motion: 17, clarity: 15, inspiration: 14, evidence: 10,
    rationaleZh: '筛选、排序、补位和卡片层级在同一画面中清楚发生，编排完整且可复用。'
  },
  'anchored-popover-flip-and-shift': {
    creativity: 7, artDirection: 14, motion: 15, clarity: 15, inspiration: 11, evidence: 10,
    rationaleZh: '浮层避碰行为表达准确，但属于功能验证界面，创意性和艺术表达不足。'
  },
  'perspective-tilt-and-glare': {
    creativity: 14, artDirection: 18, motion: 18, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '透视、景深与移动高光共同形成清楚的材质感，完成度和迁移价值都很高。'
  },
  'context-aware-custom-cursor': {
    creativity: 17, artDirection: 17, motion: 17, clarity: 13, inspiration: 14, evidence: 8,
    rationaleZh: '光标随内容语境切换媒体和文字角色，具备鲜明的互动叙事和品牌启发价值。'
  },
  'displacement-map-image-hover': {
    creativity: 18, artDirection: 18, motion: 18, clarity: 14, inspiration: 14, evidence: 8,
    rationaleZh: '图像通过位移纹理发生具有材质感的变形过渡，视觉签名鲜明且具有艺术张力。'
  },
  'svg-stroke-drawing': {
    creativity: 13, artDirection: 16, motion: 18, clarity: 15, inspiration: 14, evidence: 10,
    rationaleZh: '路径逐笔显现并完成纸飞机图形，动作含义、时序和缩略图辨识度都可靠。'
  },
  'after-effects-vector-playback': {
    creativity: 9, artDirection: 12, motion: 13, clarity: 13, inspiration: 12, evidence: 8,
    rationaleZh: '矢量播放真实可见，但示例是通用图标集合，缺少独立艺术概念和视觉叙事。'
  },
  'sketch-style-creative-coding-loop': {
    creativity: 17, artDirection: 18, motion: 17, clarity: 14, inspiration: 15, evidence: 10,
    rationaleZh: '多层波形、粒子与色彩构成稳定的生成艺术循环，既有风格也便于继续创作。'
  },
  'declarative-react-3d-scene': {
    creativity: 7, artDirection: 11, motion: 10, clarity: 7, inspiration: 9, evidence: 8,
    rationaleZh: '旋转方块能证明渲染能力，但它是框架入门示例，不是独特、可描述的艺术效果。'
  },
  'functional-webgl-draw-commands': {
    creativity: 19, artDirection: 19, motion: 19, clarity: 14, inspiration: 15, evidence: 10,
    rationaleZh: '实例化粒子形成持续演化的涡旋流场，空间、节奏与色彩均达到完整生成艺术水准。'
  },
  'dom-synced-shader-planes': {
    creativity: 18, artDirection: 19, motion: 18, clarity: 14, inspiration: 15, evidence: 10,
    rationaleZh: 'DOM 边界内的虹彩着色器形变具有清晰材质签名，技术机制与视觉结果高度一致。'
  },
  'accessible-interactive-3d-product-view': {
    creativity: 9, artDirection: 14, motion: 15, clarity: 15, inspiration: 13, evidence: 10,
    rationaleZh: '三维查看行为清晰且实现可靠，但更接近标准商品查看器，创意和艺术差异不足。'
  },
  'declarative-html-3d-scene': {
    creativity: 10, artDirection: 16, motion: 14, clarity: 9, inspiration: 12, evidence: 10,
    rationaleZh: '霓虹空间构图完整，但“声明式 HTML 3D”描述的是实现方式，视觉效果本身不够独特。'
  },
  'vue-declarative-three-js': {
    creativity: 11, artDirection: 18, motion: 16, clarity: 8, inspiration: 12, evidence: 10,
    rationaleZh: '结形雕塑有较好视觉质感，但条目仍以框架而非独特效果命名，与同类 3D 场景区分不足。'
  },
  'svelte-declarative-three-js': {
    creativity: 10, artDirection: 17, motion: 15, clarity: 8, inspiration: 12, evidence: 10,
    rationaleZh: '低多边形行星画面美观，但核心是框架演示，作为独立特效的概念辨识度不足。'
  },
  'configurable-reactive-particle-field': {
    creativity: 10, artDirection: 13, motion: 14, clarity: 13, inspiration: 11, evidence: 8,
    rationaleZh: '粒子响应清楚但形态常见，官方控制面板也削弱了艺术画面的完整性。'
  },
  'drag-to-reveal-image-comparison': {
    creativity: 10, artDirection: 12, motion: 14, clarity: 15, inspiration: 12, evidence: 8,
    rationaleZh: '拖拽前后对比非常清楚，但属于常规功能控件，创意和艺术性未达到策展门槛。'
  },
  'depth-layer-blur-dissolve': {
    creativity: 19, artDirection: 19, motion: 19, clarity: 14, inspiration: 15, evidence: 10,
    rationaleZh: '原创近中远景观以真实分层次序交接，模糊峰值和色彩换幕清楚显示了“深度决定消失顺序”的核心机制。'
  },
  'dom-aware-drag-spawned-fish-flock': {
    creativity: 20, artDirection: 18, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '鱼群轨迹、拖拽指示和会呼吸的真实 DOM 障碍形成同一空间，分流再汇合的物理意图在缩略图中仍然清楚。'
  },
  'synchronized-scenario-scene-handoff': {
    creativity: 19, artDirection: 19, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '背景材质、遮罩、排版与立体标签在同一节拍原子换幕，视觉叙事完整且不同层的职责都能被辨认。'
  },
  'prompt-select-replace-loop': {
    creativity: 19, artDirection: 18, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '输入、真实选择态、覆盖替换和光标落位构成完整编辑语义，区别于普通打字机，短循环也能读懂行为。'
  },
  'traveling-dot-headline-rewriter': {
    creativity: 19, artDirection: 18, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '圆点是擦除与写入的可见因果主体，字符级方向、停顿和新词着色形成鲜明的标题级视觉签名。'
  },
  'infinite-curved-text-conveyor': {
    creativity: 18, artDirection: 19, motion: 19, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '两条真实曲线路径承载反向流动的排版，并通过交汇遮挡建立前后关系，和直线跑马灯有明确视觉差异。'
  },
  'autonomous-agent-cursor-constellation': {
    creativity: 18, artDirection: 18, motion: 19, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '多名具名光标拥有不同轨迹、停靠目标和批注角色，清楚表达并行 Agent 协作而不是用户指针跟随。'
  },
  'scroll-linked-multilayer-starfield': {
    creativity: 17, artDirection: 19, motion: 19, clarity: 14, inspiration: 15, evidence: 10,
    rationaleZh: '固定海报标题提供参照，近中远三层星点在密度、尺寸和速度上同时分级，滚动纵深一眼可辨。'
  },
  'staggered-multichart-telemetry-boot': {
    creativity: 18, artDirection: 18, motion: 19, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '多种图表经历加载、刻度、曲线和实时光点四段上线，序列关系明确，避免退化成普通卡片错峰入场。'
  },
  'delayed-dropdown-promo-sweep': {
    creativity: 16, artDirection: 18, motion: 19, clarity: 15, inspiration: 14, evidence: 10,
    rationaleZh: '菜单展开、节奏停顿、重点卡片单次扫光和关闭复位构成明确的导航导视语义，画面层级完整。'
  },
  'self-inverting-fixed-navigation': {
    creativity: 18, artDirection: 17, motion: 17, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '同一固定导航穿越明暗、荧光和网格区域时由真实混合模式连续反相，无需主题类，机制纯粹且构图清楚。'
  }
};

for (const spec of effectExpansion100Specs) {
  reviewedDemoScores[spec.id] = {
    creativity: spec.scores.creativity,
    artDirection: spec.scores.artDirection,
    motion: spec.scores.motion,
    clarity: spec.scores.clarity,
    inspiration: spec.scores.inspiration,
    evidence: spec.scores.evidence,
    rationaleZh: spec.rationaleZh
  };
}

for (const spec of [...effectExpansion150BatchA1, ...effectExpansion150BatchA2, ...effectExpansion150BatchA3, ...effectExpansion150BatchB]) {
  reviewedDemoScores[spec.id] = {
    creativity: spec.scores.creativity,
    artDirection: spec.scores.artDirection,
    motion: spec.scores.motion,
    clarity: spec.scores.clarity,
    inspiration: spec.scores.inspiration,
    evidence: spec.scores.evidence,
    rationaleZh: spec.rationaleZh
  };
}

const scoreTotal = scores => admissionPolicy.dimensions.reduce((total, dimension) => total + scores[dimension.id], 0);

export function evaluateDemoAdmission(effect) {
  const review = reviewedDemoScores[effect.id];
  const hasRealPreview = effect.sources.some(source =>
    ['official-capture', 'local-demo-capture'].includes(source.previewKind) && Boolean(source.preview)
  );

  if (!hasRealPreview || !review) {
    return {
      policyVersion: admissionPolicy.version,
      scores: Object.fromEntries(admissionPolicy.dimensions.map(dimension => [dimension.id, 0])),
      total: 0,
      decision: 'reject',
      reasonCode: 'missing-real-preview',
      rationaleZh: '缺少可核验的真实预览，无法诚实评估艺术完成度、动效质感和第一眼辨识度。'
    };
  }

  const scores = Object.fromEntries(admissionPolicy.dimensions.map(dimension => [dimension.id, review[dimension.id]]));
  const total = scoreTotal(scores);
  const passesMinimums = Object.entries(admissionPolicy.minimums).every(([dimension, minimum]) => scores[dimension] >= minimum);
  const decision = total >= admissionPolicy.threshold && passesMinimums ? 'admit' : 'reject';

  return {
    policyVersion: admissionPolicy.version,
    scores,
    total,
    decision,
    reasonCode: decision === 'admit' ? 'passed' : total < admissionPolicy.threshold ? 'below-threshold' : 'failed-core-dimension',
    rationaleZh: review.rationaleZh
  };
}
