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
  auditedAt: '2026-07-23',
  candidateCount: 398,
  reviewedPreviewCount: 165,
  missingPreviewCount: 233,
  admittedCount: 152,
  rejectedCount: 246
};

// Human visual review of every catalog entry that had a verifiable preview on
// 2026-07-17. Entries without a real preview receive a release score of zero in
// evaluateDemoAdmission: visual and motion quality cannot be inferred from a
// repository name, code snippet, or star count.
export const reviewedDemoScores = {
  'topographic-relief-expedition-globe': {
    creativity: 19, artDirection: 20, motion: 19, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '4,320×2,160 ETOPO 2022 真实高程与海深、Natural Earth 50m 海岸线、700 座跨七大洲山峰、61,953 顶点球体、分阶段进度加载、顶点位移、等高线与大气层共同构成数据密度和观看完成度都足够的浮雕地球；真人拖拽、缩放和切换八个高峰时，空间标记与语义证据保持配准，且与既有点阵网络地球明显不同。'
  },
  'connected-fragment-story-stage': {
    creativity: 18, artDirection: 19, motion: 18, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '四个语义问题节点、证据碎片、连线与中心命题在同一真人步骤中同步交接；构图、叙事和实现边界清楚，且与普通粒子星座或缩略图拼贴明显不同。'
  },
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
    creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '真人移动、缩放或重排媒体卡后，Curtains.js 平面立即按真实 DOM 边界重算；可验证图片同时作为唯一 GPU 纹理和像素驱动的着色输入，实时误差读数证明同步成立。'
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
    creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '首帧为空且完全静止；真人拖拽释放确定性鱼群，p5 实时读取 HTML 岛的 getBoundingClientRect，有限收束中触发预测避障并以零侵入的稳定结果保留。'
  },
  'synchronized-scenario-scene-handoff': {
    creativity: 19, artDirection: 19, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '背景材质、遮罩、排版与立体标签在同一节拍原子换幕，视觉叙事完整且不同层的职责都能被辨认。'
  },
  'prompt-select-replace-loop': {
    creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '原生文本选区、字段专属替代项、before/after、显式 Apply 与可撤销历史构成完整真人编辑因果链；结果稳定保留，且不存在自动循环。'
  },
  'traveling-dot-headline-rewriter': {
    creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '真人选择候选修订后，圆点沿实测字形与控件位置完成一次有限擦除、取回和写入；保留结果、显式撤销与静止首帧共同证明它是可用的文案审阅交互。'
  },
  'infinite-curved-text-conveyor': {
    creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '真人输入同步 seek 两个暂停 Motion 控制器，场馆导视与末班提示沿两条真实 SVG 曲线反向移动并稳定停留；真实路径、输入计数和无自动循环共同证明机制。'
  },
  'autonomous-agent-cursor-constellation': {
    creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '真人选择检查点后，具名光标携带证据包到达实测插槽才提交内容；中断旧交付不会提前写入，角色、证据、制品与状态形成可信的 Agent 交接因果链。'
  },
  'scroll-linked-multilayer-starfield': {
    creativity: 17, artDirection: 19, motion: 19, clarity: 14, inspiration: 15, evidence: 10,
    rationaleZh: '固定海报标题提供参照，近中远三层星点在密度、尺寸和速度上同时分级，滚动纵深一眼可辨。'
  },
  'staggered-multichart-telemetry-boot': {
    creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '操作员显式启动一次有限预检，Ingress、Node Load、Link Health 按诊断优先级交错上线；确定性数据计算 Nominal 结论并稳定保留，首帧无自动启动。'
  },
  'delayed-dropdown-promo-sweep': {
    creativity: 16, artDirection: 18, motion: 19, clarity: 15, inspiration: 14, evidence: 10,
    rationaleZh: '菜单展开、节奏停顿、重点卡片单次扫光和关闭复位构成明确的导航导视语义，画面层级完整。'
  },
  'self-inverting-fixed-navigation': {
    creativity: 20, artDirection: 20, motion: 20, clarity: 15, inspiration: 15, evidence: 10,
    rationaleZh: '真人导航三段长文时，固定导航读取实际区段背景并比较两种墨色的 WCAG 对比度；可见采样色、比例、选择结果与无输入静止让反色因果完整可查。'
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
