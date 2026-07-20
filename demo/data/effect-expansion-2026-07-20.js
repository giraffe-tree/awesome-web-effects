// Generated from research/effect-expansion-100-plan-2026-07-20.json.
// Run node scripts/sync-effect-expansion-100.mjs after changing the research plan.
export const effectExpansion100Specs = [
  {
    "id": "scroll-scrubbed-document-generation-playback",
    "name": "Scroll-scrubbed document generation playback",
    "nameZh": "滚动擦洗式文档生成回放",
    "category": "scroll",
    "sourceUrl": "https://www.granola.ai/",
    "difference": "真实滚轮或键盘把五段有决策后果的研究简报映射到同一进度：页面、字段裁剪、光标、章节和结论同步；初始不自动生成，边界滚轮会释放给外层页面。",
    "behavior": {
      "trigger": "real vertical wheel while hovered/focused, chapter click, or Arrow/Page/Home/End keys",
      "response": "Scrub five consequential brief sections while field reveals, caret, chapter state, and paper position remain synchronized",
      "timing": "direct wheel progress or a short reduced-motion-aware transition to a requested section",
      "layer": "AI evidence-assistant research brief"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "bodyMotion.time = t; lines.forEach((line, i) => line.style.clipPath = `inset(0 ${(1 - reveal(i, t)) * 100}% 0 0)`);",
      "referenceUrl": "https://www.granola.ai/"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 19,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 97
    },
    "rationaleZh": "内外双滚动和文档生成因果清楚，区别于普通卡片时间线。",
    "batch": "A",
    "demo": "一份关于可追溯 AI 研究助手的五段决策简报，从问题框架、风险、研究计划和护栏推进到有门槛的建议；每页四个事实字段与一个明确后果。",
    "capture": "真实鼠标滚轮逐段推进并在末端验证外滚轮释放，再用章节按钮、Home、PageDown 与 End 证明可逆和精确导航；断言无自动播放或合成输入。",
    "risk": {
      "level": "medium",
      "detail": "必须真实同步字段 clip、内层位移、光标和章节状态，同时避免捕获水平滚动或在首尾形成滚动陷阱。"
    },
    "observedImplementation": {
      "projectId": "greensock-gsap",
      "library": "GSAP ScrollTrigger",
      "renderer": "DOM",
      "snippet": "ScrollTrigger.create({scrub:true,onUpdate:({progress})=>renderDocument(progress)})",
      "projectUrl": "https://github.com/greensock/GSAP",
      "referenceUrl": "https://gsap.com/scrolltrigger/"
    }
  },
  {
    "id": "duration-aware-hero-film-handoff",
    "name": "Duration-aware hero film handoff",
    "nameZh": "按片段时长接力的首屏影片",
    "category": "animation",
    "sourceUrl": "https://kling.ai/",
    "difference": "不是定时轮播；每段媒体读取自己的 duration，并在交接窗口才预载下一段和短暂叠层。",
    "behavior": {
      "trigger": "explicit Play/Pause or scene selection, then each local video's measured duration/currentTime",
      "response": "Preload the next real film and crossfade two decoded video layers without a black frame",
      "timing": "user-owned playback with duration-aware preload and unequal sequential handoff",
      "layer": "full-bleed HTML video stack and semantic scene timeline"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "video.addEventListener('timeupdate', () => remaining(video) <= preloadWindow && preload(next)); await animateCrossfade(video, nextVideo);",
      "referenceUrl": "https://kling.ai/"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 20,
      "clarity": 14,
      "inspiration": 14,
      "evidence": 9,
      "total": 94
    },
    "rationaleZh": "不同片长驱动接力，媒体时序而非固定秒表成为核心机制。",
    "batch": "A",
    "demo": "四段本地非等长浴场影片由真实 metadata/currentTime 驱动；用户播放、暂停或选段，下一段 canplay 后才用 Motion 双层交叉淡化。",
    "capture": "真实点击 Play，等待第一段按实测 duration 自动预载并接力到第二段，再点击第四段交接并暂停；断言无黑帧、无自动播放 fallback。",
    "risk": {
      "level": "high",
      "detail": "需制作四段本地可再分发媒体；不能把 GIF 里看不见的预载逻辑当作效果证据。"
    },
    "observedImplementation": {
      "projectId": "web-platform-video",
      "library": "HTMLVideoElement + requestVideoFrameCallback",
      "renderer": "video + DOM",
      "snippet": "video.addEventListener('loadedmetadata',()=>scheduleHandoff(video.duration))",
      "projectUrl": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback"
    }
  },
  {
    "id": "hover-rehearsed-video-style-rail",
    "name": "Hover-rehearsed video style rail",
    "nameZh": "悬停预演的视频风格轨",
    "category": "animation",
    "sourceUrl": "https://captions.ai/",
    "difference": "hover 只临时播放并在离开时归零，click 才持久选中和居中；与普通轮播或 autoplay 卡片不同。",
    "behavior": {
      "trigger": "pointer hover / keyboard focus, then click, tap, or key commit",
      "response": "Regrade and play one shared source temporarily, rewind on leave, then persist and center the committed look",
      "timing": "input-driven rehearsal followed by a persistent committed state; no autonomous fallback",
      "layer": "one-source video canvas + media selection rail"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "video-backed canvas2d + DOM",
      "snippet": "card.onpointerenter=()=>rehearse(sharedVideo,i); card.onpointerleave=rewind; card.onpointerup=()=>commitAndCenter(i);",
      "referenceUrl": "https://captions.ai/"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 95
    },
    "rationaleZh": "临时预演与持久选择的状态差异可被短录制清楚证明。",
    "batch": "A",
    "demo": "一段 AI 虚构舞者短片作为五种 look 的唯一共享源；主画面负责预演，缩略轨只改变代码调色。",
    "capture": "初始静止；hover Ember 播放→leave 回卷 True→hover Noir 并点击提交、居中→leave 后 Noir 保持→hover Glacier、leave 后返回 Noir。",
    "risk": {
      "level": "medium",
      "detail": "必须核验五个 look 严格共享同一媒体，且 pointer、touch、keyboard 不会混淆临时 preview 与 committed state。"
    },
    "observedImplementation": {
      "projectId": "web-platform-video",
      "library": "HTMLVideoElement + CSS scroll snap",
      "renderer": "video + DOM",
      "snippet": "tile.onpointerenter=()=>video.play(); tile.onpointerleave=()=>{video.pause();video.currentTime=0}",
      "projectUrl": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type"
    }
  },
  {
    "id": "device-silhouette-masked-video",
    "name": "Device-silhouette masked video",
    "nameZh": "设备轮廓蒙版视频",
    "category": "animation",
    "sourceUrl": "https://pika.art/",
    "difference": "同一段可核验的本地折叠皮划艇影片被解码到唯一 Canvas，再由 Desktop、Phone、Watch 三套真实 alpha mask 决定可见像素；不是切换三张海报或给矩形视频加圆角。",
    "behavior": {
      "trigger": "real Play/Pause, device click, Left/Right/1–3 keys, or horizontal device drag",
      "response": "Keep one decoded kayak film full-bleed while changing among desktop, phone, and watch alpha silhouettes",
      "timing": "initially paused media; user-owned playback with discrete reduced-motion-aware mask transitions",
      "layer": "single hidden video source, decoded Canvas, hardware shell, alpha-masked media, and controls"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "canvas2d",
    "snippet": "ctx.drawImage(singleVideo,0,0,1280,720); maskedCanvas.dataset.device = userSelectedDevice;",
      "referenceUrl": "https://pika.art/"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 19,
      "motion": 17,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 10,
      "total": 92
    },
    "rationaleZh": "不规则轮廓与动态内容共同形成可识别的设备内媒体材质。",
    "batch": "A",
    "demo": "一段从折叠皮划艇收纳包、展开舟体、下水划行到背负离场的同源影片，可在人为选择的桌面屏、手机和手表轮廓中持续播放。",
    "capture": "真实点击 Phone 与 Play，播放至划行段后切到 Watch 并暂停，再用键盘和水平拖拽切换设备，最终返回 Desktop；断言单视频源、真实解码帧、无自动播放或自动切换。",
    "risk": {
      "level": "medium",
      "detail": "必须核验三种形态严格共享同一视频元素和 Canvas 帧，窄形态要以 cover 填满蒙版且不能因聚焦产生内部滚动。"
    },
    "observedImplementation": {
      "projectId": "web-platform-css-mask",
      "library": "CSS mask-image + HTMLVideoElement",
      "renderer": "video + CSS compositing",
      "snippet": "screen.style.maskImage=\"url('/device-mask.svg')\"",
      "projectUrl": "https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image"
    }
  },
  {
    "id": "four-corner-hover-crop-marks",
    "name": "Four-corner hover crop marks",
    "nameZh": "四角裁切标记悬停",
    "category": "pointer",
    "sourceUrl": "https://cognition.ai/",
    "difference": "四个独立角标围绕图像边界收放，现有倾斜高光和情境光标都不改变卡片的裁切语义。",
    "behavior": {
      "trigger": "pointer hover / touch tap / keyboard",
      "response": "Reveal four crop-register corners while project metadata hands off to the CTA",
      "timing": "short reversible transition; no autonomous fallback",
      "layer": "full-bleed project image frame"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "marks.forEach(mark => animate(mark, { opacity: [0, 1], x: [mark.dataset.dx, 0], y: [mark.dataset.dy, 0] }));",
      "referenceUrl": "https://cognition.ai/"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 18,
      "motion": 17,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 92
    },
    "rationaleZh": "裁切框语义明确，低成本但需靠强摄影排版达到艺术门槛。",
    "batch": "A",
    "demo": "一张全幅 AI 虚构海岸建筑项目图；真实输入触发四角框选，元数据同步让位给 CTA。",
    "capture": "初始静止；鼠标从外侧进入并移动、离开；触摸点击切换；键盘 Enter/Space 与方向键复演。禁止自动 fallback。",
    "risk": {
      "level": "medium",
      "detail": "缩略图中四角必须足够大；不能让图片缩放掩盖主体效果。"
    },
    "observedImplementation": {
      "projectId": "web-platform-css",
      "library": "CSS pseudo-elements / four corner spans",
      "renderer": "DOM + CSS",
      "snippet": "card.classList.toggle('is-cropped',true)",
      "projectUrl": "https://developer.mozilla.org/",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/CSS/transition"
    }
  },
  {
    "id": "interaction-history-hiring-badge",
    "name": "Interaction-history hiring badge",
    "nameZh": "交互历史驱动招聘徽章",
    "category": "pointer",
    "sourceUrl": "https://www.clay.com/",
    "difference": "行为由此前 hover 次数决定，不是每次相同的 hover 动画或随机文案。",
    "behavior": {
      "trigger": "repeated pointer entries",
      "response": "Escalate posture and copy across the first three visits",
      "timing": "history-dependent finite states",
      "layer": "edge badge"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "link.onpointerenter = () => applyHoverCount(count === 3 ? 0 : ++count);",
      "referenceUrl": "https://www.clay.com/"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 16,
      "motion": 16,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 10,
      "total": 89
    },
    "rationaleZh": "多次接近形成网站记忆感，但艺术与动效余量依赖精细设计。",
    "batch": "A",
    "demo": "页边招聘徽章第 1 次轻晃、第 2 次探头、第 3 次翻面发出邀请。",
    "capture": "以固定轨迹进入/离开三次，完整录下三种递进状态。",
    "risk": {
      "level": "medium",
      "detail": "短 GIF 必须容纳三次访问；只改文字不够达到动效最低线。"
    },
    "observedImplementation": {
      "projectId": "web-platform-state",
      "library": "DOM state + CSS transforms",
      "renderer": "DOM + CSS",
      "snippet": "badge.dataset.visits=String(Math.min(3,+badge.dataset.visits+1))",
      "projectUrl": "https://developer.mozilla.org/",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset"
    }
  },
  {
    "id": "card-metadata-to-cta-role-swap",
    "name": "Research-card baseline role handoff",
    "nameZh": "研究卡同基线角色交接",
    "category": "pointer",
    "sourceUrl": "https://www.together.ai/",
    "difference": "同一实测排版槽让作者、报告编号与阅读时长完整让位给下一步操作，CTA 并非叠加遮罩；研究主题、证据图和触发意图始终保持上下文连续。",
    "behavior": {
      "trigger": "real mouse hover, keyboard focus/toggle, touch/pen toggle, Escape, or Reset",
      "response": "Hand one measured baseline from author/report metadata to Open field report while card intent, ARIA state, and evidence context stay synchronized",
      "timing": "human-owned 260 ms reversible and interruptible role handoff with no automatic rehearsal",
      "layer": "Field Research Archive study card and one shared semantic role slot"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "const options={duration:.26};\nanimate(metadata,{opacity:0,y:-7},options);\nanimate(cta,{opacity:1,y:0},options);\nroleSlot.dataset.activeRole='cta';",
      "referenceUrl": "https://www.together.ai/"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 91
    },
    "rationaleZh": "作者、报告编号与阅读时长和“打开实地报告”共享完全一致的基线矩形；真实悬停、焦点、触摸或键盘意图触发可逆交接，语义状态与 260ms Motion 过渡同步。",
    "batch": "A",
    "demo": "一张可信的城市降温研究卡，作者/报告/阅读时长在同一实测槽中让位给“打开实地报告”，右侧证据图保持上下文。",
    "capture": "真实 hover/focus 触发角色交接，快速离开证明可取消反向，激活 CTA 后用 Escape/Reset 恢复，再以键盘固定完成态。",
    "risk": {
      "level": "medium",
      "detail": "必须证明元数据和 CTA 共用同一几何基线，并由真人意图驱动语义与视觉同步切换；否则会退化成普通按钮淡入。"
    },
    "observedImplementation": {
      "projectId": "motiondivision-motion",
      "library": "Motion",
      "renderer": "DOM",
      "snippet": "animate('.meta',{y:-7,opacity:0});animate('.cta',{y:[7,0],opacity:[0,1]})",
      "projectUrl": "https://github.com/motiondivision/motion",
      "referenceUrl": "https://motion.dev/docs/animate"
    }
  },
  {
    "id": "opposed-diagonal-offset-cta",
    "name": "Opposed diagonal offset CTA",
    "nameZh": "反向对冲斜移 CTA",
    "category": "pointer",
    "sourceUrl": "https://unstructured.io/",
    "difference": "前景与底版沿相反对角线分离，active 时重新套印；不是单层按钮位移。",
    "behavior": {
      "trigger": "hover/focus/press",
      "response": "Separate two print layers diagonally, then snap them together on press",
      "timing": "reversible two-layer transition",
      "layer": "button surface"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(front, { x: -7, y: -7 }); animate(back, { x: 7, y: 7 });",
      "referenceUrl": "https://unstructured.io/"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 10,
      "total": 92
    },
    "rationaleZh": "错版印刷感能清楚区分于普通 hover，但需要高完成度构图。",
    "batch": "A",
    "demo": "版画式按钮用墨黑前景和酸绿底版表现错位与套印。",
    "capture": "hover 分离→pointerdown 合拢→pointerup 弹回→leave 复位。",
    "risk": {
      "level": "low",
      "detail": "幅度过小会在 GIF 缩略图中消失，过大会像布局错误。"
    },
    "observedImplementation": {
      "projectId": "web-platform-css",
      "library": "CSS transforms",
      "renderer": "DOM + CSS",
      "snippet": "button.dataset.state='offset'",
      "projectUrl": "https://developer.mozilla.org/",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/CSS/transform"
    }
  },
  {
    "id": "blurred-autoplay-video-ambience",
    "name": "Blurred autoplay video ambience",
    "nameZh": "模糊自播视频氛围层",
    "category": "animation",
    "sourceUrl": "https://replicate.com/",
    "difference": "背景复用前景同一动态源并放大、重模糊、混合，区别于独立渐变或丝绸 shader 背景。",
    "behavior": {
      "trigger": "real video playback, Play/Pause, seek keys, or ambient toggle",
      "response": "Redraw each decoded foreground-video frame into a blurred ambient-light canvas",
      "timing": "requestVideoFrameCallback-synchronized ambience with user-owned playback controls",
      "layer": "one sharp HTML video plus its same-frame full-stage canvas echo"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "canvas2d",
      "snippet": "video.requestVideoFrameCallback((_, meta) => ambientContext.drawImage(video, 0, 0, width, height));",
      "referenceUrl": "https://replicate.com/"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 19,
      "motion": 17,
      "clarity": 14,
      "inspiration": 14,
      "evidence": 10,
      "total": 91
    },
    "rationaleZh": "前景画面与环境光色同步，材质结果而非独立背景是核心。",
    "batch": "A",
    "demo": "一支真实本地玻璃产品影片既是清晰前景，也是逐帧重绘并模糊的环境光源；用户可暂停、续播、快进和关闭氛围层。",
    "capture": "从真实静音自播开始，依次暂停、关闭环境光、真实 seek、恢复环境光并续播；断言只有一个视频源且 canvas 与其 decoded frame 同步。",
    "risk": {
      "level": "medium",
      "detail": "必须同源；无关 CSS gradient 不能作为降级实现。"
    },
    "observedImplementation": {
      "projectId": "web-platform-video",
      "library": "HTMLVideoElement + Canvas 2D + Motion",
      "renderer": "video + canvas2d + CSS filter",
      "snippet": "ambientContext.drawImage(foregroundVideo,0,0,w,h);animate(ambient,{opacity})",
      "projectUrl": "https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/CSS/filter"
    }
  },
  {
    "id": "ascii-orchestration-signal-sweep",
    "name": "ASCII incident route trace",
    "nameZh": "ASCII 事故路由追踪",
    "category": "canvas",
    "sourceUrl": "https://www.augmentcode.com/",
    "difference": "固定字符噪声中隐藏一条七节点、八连线的真实事故路径；真人控制的前沿只揭示已走过的 Edge、Router、三名证据 Agent、Canary 与 Prod，而不是定时矩阵雨。",
    "behavior": {
      "trigger": "real Complete/Reset or direction button, direct pointer/touch scrub, or Arrow/Home/End/Enter/Space/R key",
      "response": "Move a signal front through fixed ASCII noise to reveal a seven-node incident route and three evidence-agent branches in either direction",
      "timing": "human-owned direct scrub or interruptible endpoint transition with no idle autoplay or synthetic capture",
      "layer": "p5 Canvas character field plus semantic incident metrics and controls"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "const revealed=direction===1 ? cell.x<=progress : cell.x>=progress;\ntext(routeAt(cell.x,cell.y)&&revealed ? routeGlyph : fixedNoiseGlyph, x, y);",
      "referenceUrl": "https://www.augmentcode.com/"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 19,
      "clarity": 14,
      "inspiration": 15,
      "evidence": 9,
      "total": 94
    },
    "rationaleZh": "INC-4821 的 Edge→Router→Trace/Policy/Repair→Canary→Prod 拓扑以固定字符和确定性几何生成；只有真人按钮、拖拽、触摸或键盘才推进或反转前沿。",
    "batch": "A",
    "demo": "INC-4821 checkout latency 事故追踪台；前沿从 Edge 穿过 Router 与三名证据 Agent，最终验证 Canary 与 Prod，也可反向回溯根因。",
    "capture": "真实完成、边界键、方向切换、反向重置、指针拖拽和 R/Home 输入后，以右边界完整路由结束；不注入自动 sweep。",
    "risk": {
      "level": "medium",
      "detail": "必须固定字符场和语义拓扑，并证明所有进度来自真人输入；装饰性随机矩阵雨或闲置自动前沿会失真。"
    },
    "observedImplementation": {
      "projectId": "processing-p5-js",
      "library": "p5.js",
      "renderer": "Canvas 2D",
      "snippet": "new p5(p=>{p.setup=()=>p.noLoop();p.draw=()=>drawIncidentRoute(p,progress,direction)})",
      "projectUrl": "https://github.com/processing/p5.js",
      "referenceUrl": "https://p5js.org/reference/"
    }
  },
  {
    "id": "inertial-vertical-capability-rail",
    "name": "Inertial vertical capability rail",
    "nameZh": "惯性竖向能力轨",
    "category": "scroll",
    "sourceUrl": "https://www.augmentcode.com/",
    "difference": "指针抓取真实能力索引后按释放速度衰减，并在边界弹回；初始与静止状态完全不漂移，区别于页面滚动或自动轮播。",
    "behavior": {
      "trigger": "real pointer/touch drag and release, or Arrow/Home/End keys",
      "response": "Throw a structured capability index, decay momentum within bounds, and spring back from overscroll",
      "timing": "direct drag, sampled release velocity, inertia decay or boundary rebound, then static rest",
      "layer": "six-item service and learning capability rail"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(offset,projected,{type:'inertia',velocity,min,max,bounceStiffness:330,bounceDamping:30});",
      "referenceUrl": "https://www.augmentcode.com/"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 17,
      "motion": 19,
      "clarity": 14,
      "inspiration": 15,
      "evidence": 9,
      "total": 91
    },
    "rationaleZh": "抓取、甩动、衰减、自动恢复形成完整四段运动契约。",
    "batch": "A",
    "demo": "六项可信的咨询、课程、交付、工作坊、审计与教练服务组成可甩动的竖向索引；每项都有格式、周期、成果与交付物。",
    "capture": "真实鼠标向上甩动并等待惯性衰减，再用 End/Home 精确到达末项和首项；断言无自动漂移、无合成输入且最终静止。",
    "risk": {
      "level": "medium",
      "detail": "需要基于实测拖拽速度、稳定边界和 overscroll 回弹；自动漂移会破坏用户所有权。"
    },
    "observedImplementation": {
      "projectId": "motiondivision-motion",
      "library": "Motion inertia + Pointer Events",
      "renderer": "DOM",
      "snippet": "animate(track,{y:target},{type:'inertia',velocity})",
      "projectUrl": "https://github.com/motiondivision/motion",
      "referenceUrl": "https://motion.dev/docs/animate"
    }
  },
  {
    "id": "visibility-gated-agent-terminal-replay",
    "name": "Visibility-gated agent terminal replay",
    "nameZh": "可见性门控 Agent 终端回放",
    "category": "animation",
    "sourceUrl": "https://poolside.ai/",
    "difference": "五个具名角色执行一条可核验的研究—构建—修复链；初始严格暂停，只有明确播放意图、文档可见且终端真实进入视口三者同时成立才推进。",
    "behavior": {
      "trigger": "real Play/Restart, Space/Enter, Left/Right/Home/End, plus IntersectionObserver and document visibility",
      "response": "Replay ten consequential multi-agent events, freeze truthfully at visibility gates, and keep logs, cursor, progress, and five agent statuses synchronized",
      "timing": "operator-owned playback clock with offscreen/tab-hidden pause and no catch-up jump",
      "layer": "multi-agent workflow audit terminal"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "observer = new IntersectionObserver(([entry]) => visible = entry.isIntersecting); if (visible) renderTerminalState(t);",
      "referenceUrl": "https://poolside.ai/"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 17,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 93
    },
    "rationaleZh": "Agent 状态、工具行、计时和可见性共同形成叙事，而非逐字装饰。",
    "batch": "A",
    "demo": "终端由 orchestrator、research、analyst、builder 与 verifier 共同完成一个可追溯证据助手的需求采样、范围决策、构建、缺陷修复和门控建议。",
    "capture": "真实点击 Play/Pause、使用方向键逐事件擦洗、End 到达完整结论，再 Restart 验证可重入；断言初始静止、真实 IntersectionObserver 已报告且无自动播放或合成输入。",
    "risk": {
      "level": "medium",
      "detail": "必须由 IntersectionObserver 与 document.visibilityState 真正门控时钟，并在恢复时重置时间基准，避免离屏期间累计后瞬跳。"
    },
    "observedImplementation": {
      "projectId": "motiondivision-motion",
      "library": "Motion + IntersectionObserver",
      "renderer": "DOM",
      "snippet": "observer.observe(terminal);animate('.line',{opacity:[0,1],y:[8,0]})",
      "projectUrl": "https://github.com/motiondivision/motion",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver"
    }
  },
  {
    "id": "clip-path-menu-curtain",
    "name": "Clip-path menu curtain",
    "nameZh": "裁剪路径菜单帘幕",
    "category": "transition",
    "sourceUrl": "https://www.anthropic.com/",
    "difference": "全屏菜单由 polygon 帘幕穿过内容展开，区别于本批分层全屏菜单的多底板交错。",
    "behavior": {
      "trigger": "menu toggle",
      "response": "Unroll and retract a full-screen navigation curtain from an authored axis",
      "timing": "reversible shape reveal",
      "layer": "navigation overlay"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(curtain, { clipPath: ['polygon(0 0,100% 0,100% 0,0 0)', 'polygon(0 0,100% 0,100% 100%,0 100%)'] });",
      "referenceUrl": "https://www.anthropic.com/"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 89
    },
    "rationaleZh": "形状揭幕是主体，适合作为品牌导航转场词汇。",
    "batch": "A",
    "demo": "纸帘从徽标轴线放开，菜单项仅在帘幕跨过自身时显现。",
    "capture": "点击打开→记录半开 polygon→完全展开→点击收束。",
    "risk": {
      "level": "low",
      "detail": "若所有菜单项同时淡入会退化为普通 overlay。"
    },
    "observedImplementation": {
      "projectId": "motiondivision-motion",
      "library": "Motion + CSS clip-path",
      "renderer": "DOM",
      "snippet": "animate(menu,{clipPath:['polygon(0 0,100% 0,100% 0,0 0)','polygon(0 0,100% 0,100% 100%,0 100%)']})",
      "projectUrl": "https://github.com/motiondivision/motion",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path"
    }
  },
  {
    "id": "playable-brand-minesweeper-footer",
    "name": "Playable brand minesweeper footer",
    "nameZh": "可玩的品牌扫雷页脚",
    "category": "pointer",
    "sourceUrl": "https://www.tavus.io/",
    "difference": "格子具有揭示、标记、炸弹、胜负与重置状态；不是静态像素网格背景。",
    "behavior": {
      "trigger": "click/right-click/keyboard",
      "response": "Play a bounded minesweeper whose end state resolves into the brand lockup",
      "timing": "persistent game-state transitions",
      "layer": "footer grid"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "cell.onclick = () => cell.dataset.state = bombs.has(index) ? 'bomb' : 'safe';",
      "referenceUrl": "https://www.tavus.io/"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 16,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 90
    },
    "rationaleZh": "小游戏状态与品牌收束形成可描述的页脚互动，但必须控制范围。",
    "batch": "A",
    "demo": "8×5 页脚扫雷，通关后未揭格重排成站名，失败时出现像素烟尘。",
    "capture": "自动点击一条安全路径→标旗→触发胜利；另录一次炸弹峰值用于验收。",
    "risk": {
      "level": "high",
      "detail": "不要膨胀成完整游戏；确定性雷区与键盘可用性是捕获前提。"
    },
    "observedImplementation": {
      "projectId": "web-platform-grid",
      "library": "DOM state + CSS Grid",
      "renderer": "DOM + CSS",
      "snippet": "cell.addEventListener('click',()=>reveal(index))",
      "projectUrl": "https://developer.mozilla.org/",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout"
    }
  },
  {
    "id": "noise-cancellation-audio-comparison",
    "name": "Sample-locked interview cleanup review",
    "nameZh": "采样锁定的采访降噪审听",
    "category": "canvas",
    "sourceUrl": "https://krisp.ai/",
    "difference": "同一段四秒采访被写入两个真实 AudioBuffer；原声与经高低通处理的净化声严格同起点，等功率混音、波形分界和 26.02 dB 实测噪声衰减由同一个真人输入同步控制。",
    "behavior": {
      "trigger": "real pointer/touch drag, Raw/Split/Clean preset, keyboard slider control, and explicit audition toggle",
      "response": "Crossfade sample-locked raw and restored Web Audio buffers while the waveform curtain reveals the removed HVAC energy",
      "timing": "human-owned equal-power A/B mix on one four-second looping take; no automatic crossfade or playback",
      "layer": "full-frame Canvas waveform review with a semantic comparison slider"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "canvas2d",
      "snippet": "const raw=Math.cos(mix*Math.PI/2); const clean=Math.sin(mix*Math.PI/2); rawGain.gain.setTargetAtTime(raw,ctx.currentTime,.012); cleanGain.gain.setTargetAtTime(clean,ctx.currentTime,.012);",
      "referenceUrl": "https://krisp.ai/"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 8,
      "total": 87
    },
    "rationaleZh": "Field interview 07 把抽象城市噪声改成明确的 HVAC 清理任务；真实双缓冲、样本锁定起播、滤波节点、等功率交叉试听与可视化 removed-energy 共同形成可核验的听觉和静音证据。",
    "batch": "A",
    "demo": "Field interview 07 的同一四秒录音被合成为原声与净化双缓冲；拖动幕帘、选择预设或使用键盘会同时改变波形分割与真实 Web Audio 等功率混音。",
    "capture": "真实点击开始审听，选择 Raw/Clean/Split，拖动波形幕帘，并用 Home/End/Arrow/Page 键校验连续混音；最终停在 30% clean 且暂停。",
    "risk": {
      "level": "high",
      "detail": "必须保持真人手势才能创建 AudioContext 和改变混音；双源需样本锁定，静音 GIF 也必须明确呈现噪声能量差和实测衰减。"
    },
    "observedImplementation": {
      "projectId": "web-platform-audio",
      "library": "Web Audio API + Canvas",
      "renderer": "audio + Canvas 2D",
      "snippet": "dry.gain.value=1-mix;clean.gain.value=mix",
      "projectUrl": "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/API/GainNode"
    }
  },
  {
    "id": "track-card-play-state-handoff",
    "name": "Track-card play-state handoff",
    "nameZh": "音轨卡播放态协同切换",
    "category": "animation",
    "sourceUrl": "https://www.udio.com/",
    "difference": "切歌时旧卡减速休眠、新卡接棒苏醒，封面、进度、材质与播放控件作为一个状态切换。",
    "behavior": {
      "trigger": "track card click/tap or keyboard selection plus an explicit play/pause control",
      "response": "Hand off cover emphasis, exclusive play state, control label, and independent progress between three cards",
      "timing": "user-owned playback; selection handoff occurs only while the user has chosen to play",
      "layer": "full-bleed responsive track card rail"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "card.onclick = () => selectTrack(index); transport.onclick = () => setPlaying(!playing); renderProgress(selected, elapsed / durations[selected]);",
      "referenceUrl": "https://www.udio.com/"
    },
    "scores": {
      "creativity": 14,
      "artDirection": 16,
      "motion": 17,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 8,
      "total": 84
    },
    "rationaleZh": "需要完整材质苏醒/休眠才能超越普通播放器。",
    "batch": "A",
    "demo": "三张真实封面卡以独立进度保存播放状态；点击、触摸或键盘选择，显式播放后才把封面、控件、强调与进度交给新卡。",
    "capture": "真实点击播放第一张→播放中依次选择第二、第三张→真实点击暂停；断言三条独立进度、最终选择与无自动交接。",
    "risk": {
      "level": "high",
      "detail": "创意余量仅 84；若素材与排版不足应在正式评分时删除。"
    },
    "observedImplementation": {
      "projectId": "motiondivision-motion",
      "library": "Web Audio API + Motion",
      "renderer": "audio + DOM",
      "snippet": "await animate(oldCard,{scale:.96,opacity:.6}).finished;animate(newCard,{scale:1,opacity:1})",
      "projectUrl": "https://github.com/motiondivision/motion",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API"
    }
  },
  {
    "id": "audio-equalizer-typography",
    "name": "Live-analyser letterform reshaping",
    "nameZh": "实时分析器字形重塑",
    "category": "canvas",
    "sourceUrl": "https://soundraw.io/",
    "difference": "真实 Web Audio AnalyserNode 的 128 个频率 bin 被映射到 PULSE 字形的 230 条纵向切片，直接改变单词轮廓的高度与频谱倾斜；底部小柱仅作辅助刻度，不再冒充效果主体。",
    "behavior": {
      "trigger": "explicit tone click, pointer/touch press-and-drag, or keyboard Enter/Space and pitch keys",
      "response": "Start a real sawtooth source, read its live analyser, and materially stretch the masked PULSE letterform across low-to-high frequency slices",
      "timing": "human-owned live spectrum response; silent static initial frame and no synthetic capture spectrum",
      "layer": "full-frame p5 Canvas letterform test with semantic audio and pitch controls"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "analyser.getByteFrequencyData(bins); for(let x=0;x<mask.width;x+=4){const e=bins[binFor(x)]/255;ctx.drawImage(mask,x,0,4,h,x,(h-h*(1+e*1.28))/2,4,h*(1+e*1.28));}",
      "referenceUrl": "https://soundraw.io/"
    },
    "scores": {
      "creativity": 14,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 8,
      "total": 86
    },
    "rationaleZh": "PULSE 不再浮在频谱柱前：一个真实 p5 Canvas 先生成可校验的文字 mask，再由真人启动的 AnalyserNode 数据逐切片重塑轮廓；静音、实时、高低音和 reduced-motion 状态都保持可解释。",
    "batch": "A",
    "demo": "Live Audio Letterform Test 把 PULSE 的 920×320 mask 切成 230 段；真人启动 sawtooth 后，128-bin 实时频谱控制每段高度和倾斜，拖动或键盘实时改变 110–880 Hz 音高。",
    "capture": "真实点击启动，双次 pointer hold/drag 扫过音高，Home/End/Arrow 改频率，Space/Enter 切换锁定，Escape 回到静音原形；录制同时验证真实 analyser 读数。",
    "risk": {
      "level": "high",
      "detail": "AudioContext 只能由真人手势创建；频谱必须来自真实 AnalyserNode，字形变形要足够明显但仍保留 PULSE 的可读轮廓。"
    },
    "observedImplementation": {
      "projectId": "web-platform-audio",
      "library": "Web Audio AnalyserNode + Canvas",
      "renderer": "audio + Canvas 2D",
      "snippet": "analyser.getByteFrequencyData(bins);drawTypeBars(bins)",
      "projectUrl": "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode"
    }
  },
  {
    "id": "animated-hand-drawn-semantic-annotation",
    "name": "Live-bounds seminar annotation",
    "nameZh": "实时文本边界研讨批注",
    "category": "vector",
    "sourceUrl": "https://github.com/rough-stuff/rough-notation",
    "difference": "用户可在同一研讨文稿中任选四个真实短语；每次都由 Range.getBoundingClientRect() 重新测量当前字形联合边界，生成两条宽度各异的 SVG 手绘线并把 overlay 精确迁移到目标，而不是重播固定路径。",
    "behavior": {
      "trigger": "real phrase click/tap/Enter, arrow-key reselection, Redraw/R, Reset, or Escape",
      "response": "Measure the chosen live text range, move a generated two-stroke annotation to that exact phrase, and update the reviewer comment and geometry evidence",
      "timing": "human-owned interruptible 580 ms redraw; reduced motion resolves directly and no automatic rehearsal",
      "layer": "responsive semantic document with one live SVG overlay"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "svg",
      "snippet": "const rect=range.getBoundingClientRect(); overlay.style.cssText=`left:${rect.left-page.left-pad}px;top:${rect.top-page.top-pad}px`; animate(paths,{pathLength:[0,1],opacity:[0,1]},{delay:stagger(.08)});",
      "referenceUrl": "https://github.com/rough-stuff/rough-notation"
    },
    "scores": {
      "creativity": 16,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 90
    },
    "rationaleZh": "Margin Notes 把标注放进共享研讨文稿的真实复审任务；选择、重选、快速中断、重绘和复位都来自真人输入，Range 边界、SVG 路径长度、ARIA 选择态与 reviewer comment 可共同核验。",
    "batch": "A",
    "demo": "在《The Practice of Noticing》教学草稿的四个短语间选择；同一双线手绘 overlay 依据实时 Range 尺寸重新生成并迁移，右侧同步显示 phrase 与 live bounds。",
    "capture": "真实选择 attention/questions/trace，快速重选证明可中断，Redraw 与同词重选证明重播，ArrowLeft/R 证明键盘控制，Reset/Enter/Escape 完成双次复位。",
    "risk": {
      "level": "low",
      "detail": "必须在字体加载后测量 Range，并在 resize 或重选时重算；预画死 SVG、自动重播或 overlay 未完整包住文字都不合格。"
    },
    "observedImplementation": {
      "projectId": "rough-stuff-rough-notation",
      "library": "Rough Notation",
      "renderer": "SVG overlay",
      "snippet": "annotate(target,{type:'highlight',animationDuration:700}).show()",
      "projectUrl": "https://github.com/rough-stuff/rough-notation",
      "referenceUrl": "https://github.com/rough-stuff/rough-notation"
    }
  },
  {
    "id": "mechanical-split-flap-character-change",
    "name": "Operator-driven departure split-flap",
    "nameZh": "人工调度的发车翻页牌",
    "category": "vector",
    "sourceUrl": "https://github.com/pqina/flip",
    "difference": "Northline R7/204 的八列状态牌各自拥有上下静态面、出入两片 3D 叶片和铰链；真人请求 ON TIME→BOARDING→LAST CALL→DEPARTED 时，16 个无 autoplay 的 Motion 控件以 75 ms 列间距逐字落定。",
    "behavior": {
      "trigger": "real board/button click or tap, Enter/Space/Arrow/N advance, and Reset/R/Home/Escape",
      "response": "Advance one railway operating state across eight independent split-flap mechanisms, or restore the board to ON TIME",
      "timing": "human-requested 75 ms column cadence with interruptible authoritative settlement; no automatic cycling",
      "layer": "full-frame semantic railway departure board with DOM/CSS 3D cells"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "cells.forEach((cell,i)=>{const upper=animate(cell.out,{rotateX:[0,-92]},{delay:i*.075,autoplay:false});const lower=animate(cell.in,{rotateX:[92,0]},{delay:i*.075+.125,autoplay:false});upper.play();lower.play();});",
      "referenceUrl": "https://github.com/pqina/flip"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 89
    },
    "rationaleZh": "从组件 specimen 转为具体发车状态后，每个字符的机械接力与信息紧迫度绑定；落字顺序、时间、目标字符、中断强制落定和最大并发都成为可核验的运行证据。",
    "batch": "A",
    "demo": "Northline Harbor Terminal 发车牌显示 R7/204、08:42、站台 04；操作员逐次请求 ON TIME、BOARDING、LAST CALL 与 DEPARTED，八列独立翻页。",
    "capture": "真实按钮、牌面、Arrow/Enter/N 依次推进，故意在一次翻页中途再次请求以验证中断强制落定，再用按钮与 Home 双次复位。",
    "risk": {
      "level": "low",
      "detail": "必须保持八个四片式 DOM 机构、等宽字形和逐列落定；快速重请求需先权威落定旧目标，不能并发叠加或由预览时钟循环。"
    },
    "observedImplementation": {
      "projectId": "pqina-flip",
      "library": "Flip",
      "renderer": "DOM + CSS 3D",
      "snippet": "tick.value='0104'",
      "projectUrl": "https://github.com/pqina/flip",
      "referenceUrl": "https://pqina.nl/flip/"
    }
  },
  {
    "id": "pointer-rotated-dot-matrix-globe",
    "name": "Nearest-edge dot-matrix globe",
    "nameZh": "最近边缘节点点阵地球",
    "category": "webgl",
    "sourceUrl": "https://github.com/shuding/cobe",
    "difference": "一个确定性的 648 点正交球面承载 SFO、GRU、LHR、FRA、BOM、SIN、HND、SYD 八个真实经纬度节点；真人旋转后，准星聚焦最近可见 edge，并绘制该节点的真实大圆 peer routes 与延迟/覆盖率。",
    "behavior": {
      "trigger": "real pointer/touch drag, arrow-key rotation, Enter/Space or Focus nearest, and Escape/Home/Reset",
      "response": "Rotate a sampled geodata globe, focus the node nearest the crosshair, and reveal its regional latency, availability, and great-circle peers",
      "timing": "human-owned direct rotation and discrete focus; static initial frame with no automatic drift or capture-clock path",
      "layer": "full-frame p5 Canvas coverage explorer with semantic network metrics"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "const p=projectGeo(site.lat,site.lon,yaw,pitch); const nearest=visible.sort((a,b)=>(a.x*a.x+a.y*a.y)-(b.x*b.x+b.y*b.y))[0]; drawGreatCircle(nearest,nearest.peers);",
      "referenceUrl": "https://github.com/shuding/cobe"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 19,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 93
    },
    "rationaleZh": "Global Edge Coverage Explorer 把优秀的球体轮廓转化为明确的“寻找最近 edge”任务；点阵、站点、正交投影、最近节点、大圆路由和指标都来自同一可核验空间模型。",
    "batch": "A",
    "demo": "648 点 p5 正交地球显示八个全球 edge；拖拽或方向键改变视角，Focus/Enter 选择准星最近节点，并显示 P95 延迟、覆盖率和 peer 大圆路由。",
    "capture": "真实按钮聚焦、方向键旋转、两次 pointer drag、Enter/Space 再聚焦，以及按钮与 Home 双次复位；不录任何自动旋转。",
    "risk": {
      "level": "low",
      "detail": "必须固定点阵采样和 DPR，并保证站点锚定真实经纬度；自动旋转、平面假路由或拖拽后不更新 nearest focus 都会削弱证据。"
    },
    "observedImplementation": {
      "projectId": "shuding-cobe",
      "library": "COBE",
      "renderer": "WebGL",
      "snippet": "createGlobe(canvas,{markers,onRender:s=>s.phi=phi})",
      "projectUrl": "https://github.com/shuding/cobe",
      "referenceUrl": "https://github.com/shuding/cobe"
    }
  },
  {
    "id": "interactive-vector-state-machine",
    "name": "Interactive vector state machine",
    "nameZh": "交互式矢量状态机",
    "category": "animation",
    "sourceUrl": "https://github.com/rive-app/rive-wasm",
    "difference": "输入驱动有记忆的矢量状态机；现有关键帧与共享布局没有显式状态转换和 Rive 输入。",
    "behavior": {
      "trigger": "hover/press/state input",
      "response": "Transition a vector creature across resting, alert, and confirmed states",
      "timing": "finite-state blended transitions",
      "layer": "Rive canvas"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "svg",
      "snippet": "const control = animate(paths, { pathLength: [0.18, 1, 0.62, 0.18] }, { duration: 3 }); control.pause();",
      "referenceUrl": "https://github.com/rive-app/rive-wasm"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 94
    },
    "rationaleZh": "状态输入与矢量动画绑定，交互契约独立而清楚。",
    "batch": "B",
    "demo": "一枚生物按钮在 rest、hover、press、success 间连续变形。",
    "capture": "真实 pointer hover→press→触发 success input→等待状态回落。",
    "risk": {
      "level": "high",
      "detail": "必须有自制或许可明确的 .riv 资产；远程社区资产不可直接打包。"
    },
    "observedImplementation": {
      "projectId": "rive-app-rive-wasm",
      "library": "Rive Web",
      "renderer": "WASM Canvas/WebGL",
      "snippet": "new Rive({src:'control.riv',canvas,stateMachines:'States',autoplay:true})",
      "projectUrl": "https://github.com/rive-app/rive-wasm",
      "referenceUrl": "https://rive.app/community/doc/state-machines/docxeznG7iiK"
    }
  },
  {
    "id": "dom-to-3d-scroll-synchronization",
    "name": "DOM-to-spatial-artifact registration",
    "nameZh": "DOM 文档与空间制品配准",
    "category": "scroll",
    "sourceUrl": "https://github.com/14islands/r3f-scroll-rig",
    "difference": "同一真人进度严格驱动三页 DOM 装配文档、CSS 3D Wayfinder 制品和滑块，三个暂停的 Motion 控件归一化时间差不超过 0.00001，并实时显示 Δ 0.00 px。",
    "behavior": {
      "trigger": "real wheel, scrubber pointer/touch drag, section selection, or Arrow/Page/Home/End/1–3 key",
      "response": "Move a three-page spatial dossier, one CSS 3D Wayfinder artifact, target registration, and scrub thumb from front through service to anchor in exact lockstep",
      "timing": "human-owned direct reversible progress with outward wheel release at both boundaries and no automatic capture scrub",
      "layer": "side-by-side semantic DOM dossier and CSS 3D inspection field"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "const doc=animate(track,{y:[0,-travel]},{duration:1,ease:'linear',autoplay:false});\nconst rig=animate(artifact,{rotateY:[-31,0,34]},{duration:1,ease:'linear',autoplay:false});\n[doc,rig,thumb].forEach(control=>control.time=control.duration*progress);",
      "referenceUrl": "https://github.com/14islands/r3f-scroll-rig"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 19,
      "motion": 19,
      "clarity": 14,
      "inspiration": 15,
      "evidence": 9,
      "total": 95
    },
    "rationaleZh": "Wayfinder B-17 的 Front、Service、Anchor 三页文档与空间制品、目标点和滑块共享一个真人进度；三个 Motion 控件始终同相并公开 Δ 0.00 px 配准证据。",
    "batch": "B",
    "demo": "Wayfinder B-17 空间装配检查：左侧三页 DOM dossier，右侧 CSS 3D 导视机，扫描线、目标点与滑块共同验证 Front/Service/Anchor 配准。",
    "capture": "真实首尾滚轮释放、内部滚轮、章节点击、双次滑块拖拽和键盘定位；最终 Anchor 页与制品保持 Δ 0.00 px。",
    "risk": {
      "level": "high",
      "detail": "三个控制器必须共享严格归一化时间并公开误差；任何自动 scrub、边界滚动陷阱或视觉漂移都会破坏证据。"
    },
    "observedImplementation": {
      "projectId": "14islands-r3f-scroll-rig",
      "library": "r3f-scroll-rig",
      "renderer": "React DOM + WebGL",
      "snippet": "<ScrollScene track={ref}>{props=><mesh {...props}/>}</ScrollScene>",
      "projectUrl": "https://github.com/14islands/r3f-scroll-rig",
      "referenceUrl": "https://github.com/14islands/r3f-scroll-rig#introduction"
    }
  },
  {
    "id": "scene-wipe-progressive-page-swap",
    "name": "Scene-wipe progressive page swap",
    "nameZh": "场景擦除式渐进页面交换",
    "category": "transition",
    "sourceUrl": "https://github.com/swup/swup",
    "difference": "真实路由执行 leave-fetch-enter；当前同步场景换幕只切换同页应用状态。",
    "behavior": {
      "trigger": "route navigation",
      "response": "Compress the leaving scene into a slit and reveal the next route through it",
      "timing": "staged leave/fetch/enter",
      "layer": "page container"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(scene, { clipPath: ['inset(0 0 0 0)', 'inset(0 49% 0 49%)', 'inset(0 0 0 0)'] }, { duration: 3 });",
      "referenceUrl": "https://github.com/swup/swup"
    },
    "scores": {
      "creativity": 16,
      "artDirection": 18,
      "motion": 18,
      "clarity": 14,
      "inspiration": 15,
      "evidence": 9,
      "total": 90
    },
    "rationaleZh": "跨路由语义和共享导航持续存在，区别于单页 tab 动画。",
    "batch": "B",
    "demo": "两个真实 HTML 路由共享一条图像裂缝作为换页入口。",
    "capture": "点击路由链接→录下离场压缩、URL 改变、下一页展开→浏览器后退。",
    "risk": {
      "level": "medium",
      "detail": "必须用 HTTP server 与真实 route；单页隐藏 div 不合格。"
    },
    "observedImplementation": {
      "projectId": "swup-swup",
      "library": "Swup",
      "renderer": "DOM + CSS clip",
      "snippet": "new Swup({containers:['#swup']})",
      "projectUrl": "https://github.com/swup/swup",
      "referenceUrl": "https://swup.js.org/getting-started/"
    }
  },
  {
    "id": "draggable-packed-editorial-wall",
    "name": "Draggable packed editorial wall",
    "nameZh": "可拖拽紧密编辑墙",
    "category": "transition",
    "sourceUrl": "https://github.com/haltu/muuri",
    "difference": "抓起卡片时邻项实时避让并重新装箱；现有筛选网格由过滤条件驱动而非直接操纵。",
    "behavior": {
      "trigger": "pointer drag",
      "response": "Lift, reorder, and repack unequal editorial cards around the active item",
      "timing": "gesture-driven packing with persistent order",
      "layer": "DOM grid"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "const controls = cards.map((card, i) => animate(card, { x: [0, offsets[i], 0], y: [0, shifts[i], 0] }, { duration: 3 }));",
      "referenceUrl": "https://github.com/haltu/muuri"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 88
    },
    "rationaleZh": "直接操纵、避让和落位构成完整编辑墙行为。",
    "batch": "B",
    "demo": "不等高海报墙中，一张跨两列卡片被拖至顶端，其他卡片避让。",
    "capture": "真实 pointerdown→拖过两处落点→释放→等待 packing 完成。",
    "risk": {
      "level": "medium",
      "detail": "录制必须派发拖拽而非直接调用 move；布局需无跳闪。"
    },
    "observedImplementation": {
      "projectId": "haltu-muuri",
      "library": "Muuri",
      "renderer": "DOM transforms",
      "snippet": "new Muuri('.grid',{dragEnabled:true,layoutDuration:400})",
      "projectUrl": "https://github.com/haltu/muuri",
      "referenceUrl": "https://docs.muuri.dev/"
    }
  },
  {
    "id": "velocity-aware-swipe-drawer",
    "name": "Velocity-aware swipe drawer",
    "nameZh": "速度感知抽屉回弹",
    "category": "transition",
    "sourceUrl": "https://github.com/emilkowalski/vaul",
    "difference": "抽屉跟手、根据释放速度跨越吸附点并让背景同步缩放；与菜单帘幕的离散开合不同。",
    "behavior": {
      "trigger": "touch/pointer drag",
      "response": "Follow the gesture, infer velocity, and settle at semantic snap points",
      "timing": "gesture-continuous spring settling",
      "layer": "bottom drawer overlay"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(drawer, { y: ['78%', '42%', '5%', '78%'] }, { duration: 3, ease: 'linear' });",
      "referenceUrl": "https://github.com/emilkowalski/vaul"
    },
    "scores": {
      "creativity": 14,
      "artDirection": 16,
      "motion": 18,
      "clarity": 15,
      "inspiration": 13,
      "evidence": 9,
      "total": 85
    },
    "rationaleZh": "速度与吸附点能形成清楚手势反馈，但艺术余量需靠场景设计。",
    "batch": "B",
    "demo": "三段式声音混音台抽屉，背景舞台随抽屉高度缩小。",
    "capture": "慢拖至第二 snap→快速甩至全屏→向下轻扫关闭。",
    "risk": {
      "level": "medium",
      "detail": "正式评分余量仅 85；焦点回收和触摸滚动冲突必须解决。"
    },
    "observedImplementation": {
      "projectId": "emilkowalski-vaul",
      "library": "Vaul",
      "renderer": "React DOM",
      "snippet": "<Drawer.Root snapPoints={[.25,.55,1]}><Drawer.Content/></Drawer.Root>",
      "projectUrl": "https://github.com/emilkowalski/vaul",
      "referenceUrl": "https://vaul.emilkowal.ski/"
    }
  },
  {
    "id": "spatial-slide-deck-navigation",
    "name": "Spatial slide-deck navigation",
    "nameZh": "空间化演示文稿导航",
    "category": "transition",
    "sourceUrl": "https://github.com/hakimel/reveal.js",
    "difference": "横向章节和纵向分支形成二维空间图；不是单轴轮播或横向固定滚动。",
    "behavior": {
      "trigger": "keyboard/swipe",
      "response": "Navigate a two-dimensional graph of slides and reveal its overview",
      "timing": "discrete spatial continuity",
      "layer": "DOM 3D slide stage"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(slide, { x: [i * 18, (i - 1) * 28, (i - 2) * 36, i * 18], rotateY: [i * 7, -8, -10, i * 7] }, { duration: 3 });",
      "referenceUrl": "https://github.com/hakimel/reveal.js"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 18,
      "motion": 17,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 88
    },
    "rationaleZh": "二维导航关系可成为叙事构图，而非框架默认页切换。",
    "batch": "B",
    "demo": "星图档案先横移到星系，再下潜到两张观测子页，最后 overview。",
    "capture": "ArrowRight→ArrowDown→Escape overview→点击目标页。",
    "risk": {
      "level": "medium",
      "detail": "默认主题会低分；需原创排版且防止与普通 slide deck 混淆。"
    },
    "observedImplementation": {
      "projectId": "hakimel-reveal-js",
      "library": "reveal.js",
      "renderer": "DOM + CSS 3D",
      "snippet": "const deck=new Reveal({embedded:true});await deck.initialize()",
      "projectUrl": "https://github.com/hakimel/reveal.js",
      "referenceUrl": "https://revealjs.com/vertical-slides/"
    }
  },
  {
    "id": "pointer-driven-multilayer-depth-stage",
    "name": "Pointer-driven multilayer depth stage",
    "nameZh": "指针驱动多层景深舞台",
    "category": "pointer",
    "sourceUrl": "https://github.com/wagerfield/parallax",
    "difference": "前景、主体、远景按深度系数独立位移；现有卡片倾斜高光让一个平面整体旋转。",
    "behavior": {
      "trigger": "mouse hover, captured touch/pen drag, or arrow keys",
      "response": "Offset four authored trail-atlas planes, route, beacon, and reticle by distinct depth coefficients",
      "timing": "direct input-driven reversible parallax; centered and still when idle",
      "layer": "full-bleed layered DOM scene"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "stage.onpointermove = event => layers.forEach(({ node, depth }) => { node.style.transform = `translate3d(${pointerX(event) * depth}px, ${pointerY(event) * depth}px, 0)`; });",
      "referenceUrl": "https://github.com/wagerfield/parallax"
    },
    "scores": {
      "creativity": 14,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 88
    },
    "rationaleZh": "多层相对运动而非整体变换，空间深度一眼可辨。",
    "batch": "B",
    "demo": "原创全屏 trail-atlas 场景含天空、远岭、近岭、前景、路线与信标；鼠标、触摸拖拽和键盘真实驱动四层景深。",
    "capture": "真实鼠标先悬停穿越四角，再按下拖拽并离开舞台归中；断言无自动路径、输入计数、捕获释放和静止终态。",
    "risk": {
      "level": "medium",
      "detail": "上游 SPDX 未断言；需核验许可并给移动端方向权限降级。"
    },
    "observedImplementation": {
      "projectId": "wagerfield-parallax",
      "library": "Parallax.js",
      "renderer": "DOM transforms",
      "snippet": "new Parallax(scene,{relativeInput:true})",
      "projectUrl": "https://github.com/wagerfield/parallax",
      "referenceUrl": "https://github.com/wagerfield/parallax#2-configuration"
    }
  },
  {
    "id": "svg-filter-gooey-text-hover",
    "name": "SVG-filter gooey text hover",
    "nameZh": "SVG 滤镜黏液文字悬停",
    "category": "vector",
    "sourceUrl": "https://github.com/codrops/GooeyTextHoverEffect",
    "difference": "液滴聚合为字再散开；当前标题擦写使用移动圆点，曲线传送带移动完整字形。",
    "behavior": {
      "trigger": "hover/focus",
      "response": "Merge blobs through SVG filters until they resolve into glyphs",
      "timing": "reversible material transition",
      "layer": "headline typography"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "svg",
      "snippet": "animate(blobs, { cx: clusteredX, cy: clusteredY, r: [5, 11, 5] }, { duration: 3, ease: 'linear' });",
      "referenceUrl": "https://github.com/codrops/GooeyTextHoverEffect"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 8,
      "total": 93
    },
    "rationaleZh": "文字本身变成液态材质，视觉签名强。",
    "batch": "B",
    "demo": "LIQUID TYPE 标题由散落液滴聚成清晰字，再随离开溶散。",
    "capture": "focus/hover 触发→停在融球峰值→清晰字→leave 复位。",
    "risk": {
      "level": "medium",
      "detail": "固定 filter region，防止 Safari/Chrome 裁切；需尊重上游示例许可。"
    },
    "observedImplementation": {
      "projectId": "codrops-gooey-text-hover",
      "library": "Gooey Text Hover",
      "renderer": "SVG filters + DOM",
      "snippet": "new Menu(document.querySelector('nav.menu'))",
      "projectUrl": "https://github.com/codrops/GooeyTextHoverEffect",
      "referenceUrl": "https://github.com/codrops/GooeyTextHoverEffect"
    }
  },
  {
    "id": "pointer-following-displacement-ripple",
    "name": "Pointer-following displacement ripple",
    "nameZh": "指针跟随位移涟漪",
    "category": "canvas",
    "sourceUrl": "https://github.com/pixijs/pixijs",
    "difference": "单张图像被移动位移场持续推开并衰减；现有位移图悬停在两张图之间切换。",
    "behavior": {
      "trigger": "pointer move",
      "response": "Move a displacement texture under the pointer and let the image surface recover",
      "timing": "continuous local deformation with decay",
      "layer": "WebGL image surface"
    },
    "implementation": {
      "projectId": "regl-project-regl",
      "projectUrl": "https://github.com/regl-project/regl",
      "library": "regl@2.1.1",
      "renderer": "webgl",
      "snippet": "const draw = regl({ frag: displacementFragment, uniforms: { pointer: regl.prop('pointer'), time: regl.prop('time') }, count: 3 });",
      "referenceUrl": "https://github.com/pixijs/pixijs"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 18,
      "clarity": 14,
      "inspiration": 15,
      "evidence": 9,
      "total": 93
    },
    "rationaleZh": "触发、连续性与媒体关系都不同于现有两图切换。",
    "batch": "B",
    "demo": "真实指针、触控或方向键在海岸建筑照片上产生局部 UV 折射，波前扩张并弹性回稳。",
    "capture": "真实移动指针穿过窗框与池底网格→录下两次折射波前→停留到完全复原。",
    "risk": {
      "level": "medium",
      "detail": "必须使用真实 WebGL UV 位移和本地图像纹理；CSS blur 假变形不合格。"
    },
    "observedImplementation": {
      "projectId": "pixijs-pixijs",
      "library": "PixiJS DisplacementFilter",
      "renderer": "WebGL 2D",
      "snippet": "stage.filters=[new DisplacementFilter({sprite:map,scale:36})]",
      "projectUrl": "https://github.com/pixijs/pixijs",
      "referenceUrl": "https://pixijs.com/8.x/guides/components/filters"
    }
  },
  {
    "id": "draggable-rigid-body-poster-pile",
    "name": "Draggable rigid-body poster pile",
    "nameZh": "可抓取刚体海报堆",
    "category": "canvas",
    "sourceUrl": "https://github.com/liabru/matter-js",
    "difference": "海报受重力、旋转和碰撞传递；Muuri 只在布局网格中避让，不模拟刚体。",
    "behavior": {
      "trigger": "pointer drag / gravity",
      "response": "Drop, collide, grab, and throw typographic poster bodies",
      "timing": "fixed-step persistent physics",
      "layer": "Canvas 2D world"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "new p5(p => { p.setup = () => p.createCanvas(innerWidth, innerHeight); p.draw = () => stepPosterBodies(p); });",
      "referenceUrl": "https://github.com/liabru/matter-js"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 93
    },
    "rationaleZh": "刚体碰撞和抓取让编辑海报具备可复述的物理行为。",
    "batch": "B",
    "demo": "六张窄海报落入框内，用户抓起一张再次砸入堆栈。",
    "capture": "固定时间步预落 1s→真实拖拽海报→释放碰撞→等待静止。",
    "risk": {
      "level": "medium",
      "detail": "必须固定初始姿态和时间步，禁止随机挑选好看录屏。"
    },
    "observedImplementation": {
      "projectId": "liabru-matter-js",
      "library": "Matter.js",
      "renderer": "Canvas 2D",
      "snippet": "Composite.add(engine.world,posters);MouseConstraint.create(engine,{mouse})",
      "projectUrl": "https://github.com/liabru/matter-js",
      "referenceUrl": "https://brm.io/matter-js/docs/"
    }
  },
  {
    "id": "point-constructed-generative-corolla",
    "name": "Point-constructed generative corolla",
    "nameZh": "点构成的生成式花冠",
    "category": "canvas",
    "sourceUrl": "https://github.com/williamngan/pts",
    "difference": "点/向量关系生成花冠并受局部指针扰动；当前 p5 波形和粒子涡旋都没有径向花瓣拓扑。",
    "behavior": {
      "trigger": "time/pointer",
      "response": "Recompute layered radial point geometry around the pointer",
      "timing": "seeded seamless loop with local response",
      "layer": "Canvas 2D generative field"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "for (let ring = 0; ring < 4; ring++) drawCorollaPoints(p, center, ring, phase, pointer);",
      "referenceUrl": "https://github.com/williamngan/pts"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 18,
      "motion": 18,
      "clarity": 14,
      "inspiration": 15,
      "evidence": 9,
      "total": 92
    },
    "rationaleZh": "固定点规则形成明确花冠结构，区别于任意粒子运动。",
    "batch": "B",
    "demo": "四层点花冠缓慢呼吸，指针经过时局部花瓣向外展开。",
    "capture": "固定 8s phase→pointer 从左到中心→录下展开与闭合。",
    "risk": {
      "level": "medium",
      "detail": "必须固定种子和相位；装饰文字不能承担辨识度。"
    },
    "observedImplementation": {
      "projectId": "williamngan-pts",
      "library": "Pts",
      "renderer": "Canvas 2D",
      "snippet": "space.add(({form,pointer})=>drawCorolla(form,pointer,phase)).play()",
      "projectUrl": "https://github.com/williamngan/pts",
      "referenceUrl": "https://ptsjs.org/guide/"
    }
  },
  {
    "id": "pointer-injected-gpu-fluid",
    "name": "Pointer-injected GPU fluid",
    "nameZh": "指针注入 GPU 流体",
    "category": "webgl",
    "sourceUrl": "https://github.com/PavelDoGreat/WebGL-Fluid-Simulation",
    "difference": "指针把速度和染料真实注入流场；现有粒子涡旋和星空不解流体方程。",
    "behavior": {
      "trigger": "pointer drag",
      "response": "Inject velocity and dye into an advecting fluid framebuffer",
      "timing": "continuous dissipating simulation",
      "layer": "full-bleed WebGL canvas"
    },
    "implementation": {
      "projectId": "regl-project-regl",
      "projectUrl": "https://github.com/regl-project/regl",
      "library": "regl@2.1.1",
      "renderer": "webgl",
      "snippet": "const drawFluid = regl({ frag: fluidFragment, uniforms: { time: regl.prop('time'), pointer: regl.prop('pointer') }, count: 3 });",
      "referenceUrl": "https://github.com/PavelDoGreat/WebGL-Fluid-Simulation"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 98
    },
    "rationaleZh": "卷吸、混色和耗散构成强烈且独立的生成材质。",
    "batch": "B",
    "demo": "深蓝流体中以固定紫、橙染料画两次 S 曲线。",
    "capture": "固定模拟分辨率→执行两条 pointer 轨迹→等待涡旋耗散→复位。",
    "risk": {
      "level": "high",
      "detail": "GPU 差异和时间步会影响复现；需固定输入并逐机验收。"
    },
    "observedImplementation": {
      "projectId": "paveldogreat-webgl-fluid",
      "library": "WebGL Fluid Simulation",
      "renderer": "WebGL framebuffer simulation",
      "snippet": "splat(pointer.x,pointer.y,pointer.dx,pointer.dy,color)",
      "projectUrl": "https://github.com/PavelDoGreat/WebGL-Fluid-Simulation",
      "referenceUrl": "https://paveldogreat.github.io/WebGL-Fluid-Simulation/"
    }
  },
  {
    "id": "emergent-particle-life-colonies",
    "name": "Emergent particle-life colonies",
    "nameZh": "涌现式粒子生命群落",
    "category": "canvas",
    "sourceUrl": "https://github.com/hunar4321/particle-life",
    "difference": "种群间吸引排斥矩阵产生追逐、膜和群落；现有涡旋有统一向心场，鱼群使用 boids 与 DOM 避障。",
    "behavior": {
      "trigger": "time / reset",
      "response": "Evolve colored populations under a fixed attraction-repulsion matrix",
      "timing": "seeded emergent continuous simulation",
      "layer": "Canvas particle field"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "particles.forEach(a => particles.forEach(b => applyAttractionRule(a, b, matrix[a.kind][b.kind])));",
      "referenceUrl": "https://github.com/hunar4321/particle-life"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 18,
      "motion": 19,
      "clarity": 14,
      "inspiration": 15,
      "evidence": 9,
      "total": 94
    },
    "rationaleZh": "规则简单但群落行为复杂，具有独立的群体视觉词汇。",
    "batch": "B",
    "demo": "四种颜色形成追逐环和细胞膜状群落，旁边显示固定作用矩阵。",
    "capture": "固定 seed 运行 0→8s→点击 reset 重放同一演化。",
    "risk": {
      "level": "medium",
      "detail": "随机种子、矩阵、边界、步长必须写入 provenance。"
    },
    "observedImplementation": {
      "projectId": "hunar4321-particle-life",
      "library": "Particle Life algorithm",
      "renderer": "Canvas 2D",
      "snippet": "rule(green,red,-0.17);rule(red,green,0.32);drawAtoms()",
      "projectUrl": "https://github.com/hunar4321/particle-life",
      "referenceUrl": "https://github.com/hunar4321/particle-life"
    }
  },
  {
    "id": "sticky-card-stack-accumulation",
    "name": "Sticky card-stack accumulation",
    "nameZh": "粘性卡片堆叠累积",
    "category": "scroll",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollStack-TS-TW.json",
    "difference": "卡片逐张 pin、缩放并累积成可见堆栈；现有固定横向场景移动一条轨道而不保留叠层历史。",
    "behavior": {
      "trigger": "scroll",
      "response": "Pin and compress each card onto a growing stack",
      "timing": "continuous progress-linked accumulation",
      "layer": "sticky card scene"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(card, { y: [i * 22, i * 8, i * 22], scale: [1, 1 - i * 0.035, 1] }, { duration: 3 });",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollStack-TS-TW.json"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 95
    },
    "rationaleZh": "堆叠历史和缩放关系在缩略图中清楚。",
    "batch": "B",
    "demo": "五张材料档案随滚动叠到一个固定观察台上。",
    "capture": "真实滚动逐张累积→停在四层堆栈→反向滚动拆栈。",
    "risk": {
      "level": "high",
      "detail": "React Bits 仓库未给标准 SPDX；复制源码前必须补许可结论。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits ScrollStack",
      "renderer": "React DOM",
      "snippet": "<ScrollStack><ScrollStackItem>...</ScrollStackItem></ScrollStack>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollStack-TS-TW.json"
    }
  },
  {
    "id": "velocity-reactive-marquee",
    "name": "Velocity-reactive marquee",
    "nameZh": "滚动速度响应跑马灯",
    "category": "scroll",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollVelocity-TS-TW.json",
    "difference": "内容速度和方向由测得滚动速度改变；不是恒速直线 marquee 或曲线路径文字。",
    "behavior": {
      "trigger": "scroll velocity",
      "response": "Accelerate and reverse a text rail from document velocity",
      "timing": "continuous velocity-coupled loop",
      "layer": "typographic rail"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(rail, { x: ['0%', '-50%'] }, { duration: 3 / velocity, ease: 'linear', repeat: Infinity });",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollVelocity-TS-TW.json"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 93
    },
    "rationaleZh": "速度耦合让内容直接反馈阅读动作。",
    "batch": "B",
    "demo": "双向大字轨默认慢行，快速上下滚动时反转并加速。",
    "capture": "慢滚→快速下滚→快速上滚→停止观察回落基速。",
    "risk": {
      "level": "high",
      "detail": "许可未明；必须测真实滚动速度而非只按方向切 class。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits ScrollVelocity",
      "renderer": "React DOM",
      "snippet": "<ScrollVelocity texts={['BUILD','MOVE']} velocity={80}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollVelocity-TS-TW.json"
    }
  },
  {
    "id": "scrubbed-word-blur-rotate-reveal",
    "name": "Scrubbed word blur-and-rotate reveal",
    "nameZh": "擦洗式逐词模糊旋转揭示",
    "category": "scroll",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollReveal-TS-TW.json",
    "difference": "每个词把滚动映射到 opacity、blur、rotation；现有文档生成改变行存在状态，sticky ink 只改颜色。",
    "behavior": {
      "trigger": "scroll progress",
      "response": "Resolve words from blur and rotation in reading order",
      "timing": "per-word continuous scrub",
      "layer": "paragraph typography"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(word, { opacity: [0.1, 1], filter: ['blur(8px)', 'blur(0px)'], rotate: [5, 0] }, { duration: 3 });",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollReveal-TS-TW.json"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 93
    },
    "rationaleZh": "逐词三属性解析具有清楚阅读节奏。",
    "batch": "B",
    "demo": "一段宣言随滚动从倾斜雾字逐词落成清晰黑墨。",
    "capture": "滚动 0→100% 并在 30%、65% 停顿显示局部解析。",
    "risk": {
      "level": "high",
      "detail": "许可未明；过度 blur 会损害可读性和 reduced-motion。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits ScrollReveal",
      "renderer": "React DOM",
      "snippet": "<ScrollReveal enableBlur baseRotation={4}>...</ScrollReveal>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollReveal-TS-TW.json"
    }
  },
  {
    "id": "pixel-grid-content-dissolve",
    "name": "Pixel-grid content dissolve",
    "nameZh": "像素网格内容溶解",
    "category": "transition",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTransition-TS-TW.json",
    "difference": "离散 DOM 单元波把任意内容树切到另一内容；现有深度溶解按空间深度、位移切换按纹理。",
    "behavior": {
      "trigger": "hover/click",
      "response": "Propagate a discrete cell wave that swaps two content trees",
      "timing": "sequenced grid mask transition",
      "layer": "card content surface"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "cells.forEach(cell => drawCell(p, cell, smoothstep(cell.delay, cell.delay + 0.22, progress)));",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTransition-TS-TW.json"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 95
    },
    "rationaleZh": "像素单元的离散传播与其他连续图像转场区分明显。",
    "batch": "B",
    "demo": "档案照片按棋盘波溶解成排版说明，再反向恢复。",
    "capture": "hover 触发→停在 50% 网格峰值→完成→leave 反向。",
    "risk": {
      "level": "high",
      "detail": "许可未明；必须显示真实单元传播，不可用 CSS mosaic filter 替代。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits PixelTransition",
      "renderer": "React DOM",
      "snippet": "<PixelTransition firstContent={a} secondContent={b} gridSize={10}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTransition-TS-TW.json"
    }
  },
  {
    "id": "bubble-to-navigation-morph",
    "name": "Bubble-to-navigation morph",
    "nameZh": "气泡到导航变形",
    "category": "transition",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/BubbleMenu-TS-TW.json",
    "difference": "圆形控制通过多个气泡协调扩张为导航面，不是 clip 帘幕或分层板平移。",
    "behavior": {
      "trigger": "menu toggle",
      "response": "Grow a compact bubble cluster into a full navigation surface",
      "timing": "coordinated shape morph",
      "layer": "navigation overlay"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(bubbles, { scale: [0.2, 1, 18], borderRadius: ['50%', '50%', '0%'] }, { duration: 3 });",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/BubbleMenu-TS-TW.json"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 95
    },
    "rationaleZh": "气泡传播和表面成形具有明确形状叙事。",
    "batch": "B",
    "demo": "右下角三个气泡沿弧线汇合，铺展成全屏菜单星图。",
    "capture": "click 打开→停在气泡汇合峰值→键盘关闭→复位。",
    "risk": {
      "level": "high",
      "detail": "许可未明；需避免与 clip-path menu 只做外观差异。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits BubbleMenu",
      "renderer": "React DOM",
      "snippet": "<BubbleMenu logo={logo} animationDuration={.45}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/BubbleMenu-TS-TW.json"
    }
  },
  {
    "id": "neighbor-magnifying-navigation-dock",
    "name": "Neighbor-magnifying navigation dock",
    "nameZh": "邻项放大导航坞",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/Dock-TS-TW.json",
    "difference": "指针距离连续分配当前项及邻项尺度；不是整体卡片 tilt 或单目标 hover scale。",
    "behavior": {
      "trigger": "pointer proximity / keyboard focus",
      "response": "Magnify the nearest icon and smoothly distribute scale to neighbors",
      "timing": "continuous proximity field",
      "layer": "navigation dock"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "items.forEach((item, i) => animate(item, { scale: proximityScale(i, activeIndex) }, { duration: 0.22 }));",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/Dock-TS-TW.json"
    },
    "scores": {
      "creativity": 16,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 91
    },
    "rationaleZh": "邻域尺度重分配构成独立导航触觉。",
    "batch": "B",
    "demo": "八枚抽象工具图标随指针移动形成一条连续放大波。",
    "capture": "pointer 匀速扫过全 dock→停在中间→键盘 ArrowRight 移焦。",
    "risk": {
      "level": "high",
      "detail": "许可未明；键盘 focus 必须有等价反馈，不能只做鼠标。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits Dock",
      "renderer": "React DOM",
      "snippet": "<Dock items={items} magnification={70}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/Dock-TS-TW.json"
    }
  },
  {
    "id": "layered-staggered-full-screen-menu",
    "name": "Layered staggered full-screen menu",
    "nameZh": "分层交错全屏菜单",
    "category": "transition",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/StaggeredMenu-TS-TW.json",
    "difference": "多个彩色底板先后横扫，再逐项揭示菜单；与单一 polygon 帘幕和气泡 morph 不同。",
    "behavior": {
      "trigger": "menu toggle",
      "response": "Sweep layered underplates before staggered navigation labels",
      "timing": "multi-stage layered entrance",
      "layer": "full-screen navigation"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "panels.forEach((panel, i) => animate(panel, { x: ['-102%', '0%', '102%'] }, { duration: 3, delay: i * 0.08 }));",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/StaggeredMenu-TS-TW.json"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 19,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 94
    },
    "rationaleZh": "底板、标签、关闭状态形成完整导航编排。",
    "batch": "B",
    "demo": "紫、绿、黑三层板依次扫入，四个超大菜单标签从边缘落位。",
    "capture": "打开→录三层过场→hover 一项→关闭反向收层。",
    "risk": {
      "level": "high",
      "detail": "许可未明；若仅标签 stagger 会与现有交错编排重复。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits StaggeredMenu",
      "renderer": "React DOM",
      "snippet": "<StaggeredMenu items={items} colors={['#8a70ff','#b7ff56']}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/StaggeredMenu-TS-TW.json"
    }
  },
  {
    "id": "hover-activated-image-marquee-menu",
    "name": "Hover-activated image marquee menu",
    "nameZh": "悬停激活图像跑马菜单",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/FlowingMenu-TS-TW.json",
    "difference": "每一菜单行在 hover 时变成重复文字与图像的流动条；不是静态 overlay 或普通 logo marquee。",
    "behavior": {
      "trigger": "row hover/focus",
      "response": "Replace a menu row with a flowing repeated text-image strip",
      "timing": "temporary row-local loop",
      "layer": "navigation list row"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(activeRail, { x: ['0%', '-50%'] }, { duration: 3, ease: 'linear', repeat: Infinity });",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/FlowingMenu-TS-TW.json"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 95
    },
    "rationaleZh": "导航职责与媒体跑马在同一行发生角色切换。",
    "batch": "B",
    "demo": "四行地貌菜单，悬停“MOJAVE”后照片与字从两侧穿行。",
    "capture": "依次 hover 两行→在每行中点停 700ms→leave 复位。",
    "risk": {
      "level": "high",
      "detail": "许可未明；图片必须原创且 hover/focus 都可触发。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits FlowingMenu",
      "renderer": "React DOM",
      "snippet": "<FlowingMenu items={items}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/FlowingMenu-TS-TW.json"
    }
  },
  {
    "id": "drag-thrown-card-stack",
    "name": "Drag-thrown card stack",
    "nameZh": "拖拽甩出卡片堆",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/Stack-TS-TW.json",
    "difference": "前卡按真实拖拽速度甩到堆底，其余卡弹簧前移；不是刚体自由碰撞或网格重排。",
    "behavior": {
      "trigger": "pointer drag/release",
      "response": "Throw the front card behind the deck and spring the next card forward",
      "timing": "gesture velocity + ordered deck state",
      "layer": "card stack"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(topCard, { x: [0, 18, 188, 225], y: [0, -5, -34, -48], rotate: [0, 2, 18, 25] }, { duration: 1.15 });",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/Stack-TS-TW.json"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 94
    },
    "rationaleZh": "速度、顺序和堆叠身份同时变化，行为容易命名。",
    "batch": "B",
    "demo": "五张摄影卡堆，用户把前卡向右上甩出，卡片绕回底层。",
    "capture": "慢拖回弹→快速甩出→等待下一卡归位→再向反方向甩。",
    "risk": {
      "level": "high",
      "detail": "许可未明；随机旋转要固定，防止 capture 不可复现。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits Stack",
      "renderer": "React DOM",
      "snippet": "<Stack sensitivity={180} randomRotation cards={cards}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/Stack-TS-TW.json"
    }
  },
  {
    "id": "metaball-blob-cursor",
    "name": "Metaball blob cursor",
    "nameZh": "融球液滴光标",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/BlobCursor-TS-TW.json",
    "difference": "多个软体跟随物以不同惯性速度融合；现有情境光标保持单主体，鱼群不代表用户指针。",
    "behavior": {
      "trigger": "pointer move",
      "response": "Trail several soft blobs that merge under a gooey field",
      "timing": "continuous inertial follow",
      "layer": "cursor overlay"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "svg",
      "snippet": "blobs.forEach((blob, i) => animate(blob, { cx: trail[i].x, cy: trail[i].y }, { duration: 0.18 + i * 0.08 }));",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/BlobCursor-TS-TW.json"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 95
    },
    "rationaleZh": "融球连续体区别于离散粒子尾迹和多 Agent 光标。",
    "batch": "B",
    "demo": "三个紫色液滴穿过圆形目标时拉伸、分离再融合。",
    "capture": "pointer 走 8 字→急停→录下尾部追上融合。",
    "risk": {
      "level": "high",
      "detail": "许可未明；必须真正呈现融合，三个独立圆点不合格。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits BlobCursor",
      "renderer": "Canvas/SVG filter",
      "snippet": "<BlobCursor trailCount={3} fillColor='#8a70ff'/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/BlobCursor-TS-TW.json"
    }
  },
  {
    "id": "velocity-spaced-image-trail",
    "name": "Velocity-spaced image trail",
    "nameZh": "速度间隔图像尾迹",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ImageTrail-TS-TW.json",
    "difference": "指针累计距离超过阈值才生成整张媒体卡，并根据速度决定间距；不是光标粒子或动态图块 rail。",
    "behavior": {
      "trigger": "pointer travel distance",
      "response": "Spawn photographic cards at velocity-aware spatial intervals and fade them",
      "timing": "distance-threshold media trail",
      "layer": "pointer overlay"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "if (distance(pointer, previousSpawn) > velocitySpacing) cards.push(makeTrailCard(pointer, phase));",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ImageTrail-TS-TW.json"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 19,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 96
    },
    "rationaleZh": "完整媒体卡的空间尾迹形成强烈编辑式视觉。",
    "batch": "B",
    "demo": "指针在黑色画布上画弧线，六张原创花朵照片沿轨迹翻转消散。",
    "capture": "先慢移不触发→快速弧线生成→停住观察依次淡出。",
    "risk": {
      "level": "high",
      "detail": "源码约 39KB 且许可未明；图片资产与随机序列必须固定。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits ImageTrail",
      "renderer": "React DOM",
      "snippet": "<ImageTrail items={images} variant={1}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ImageTrail-TS-TW.json"
    }
  },
  {
    "id": "gooey-pixel-cursor-wake",
    "name": "Gooey pixel cursor wake",
    "nameZh": "黏性像素光标尾流",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTrail-TS-TW.json",
    "difference": "固定网格单元按指针距离亮起并黏连衰减；不是自由移动的图片尾迹或粒子。",
    "behavior": {
      "trigger": "pointer move",
      "response": "Activate quantized cells under the pointer and decay them through a gooey filter",
      "timing": "continuous grid wake with decay",
      "layer": "fixed pixel field"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "grid[cellIndex(pointer)].energy = 1; grid.forEach(cell => cell.energy *= 0.91);",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTrail-TS-TW.json"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 94
    },
    "rationaleZh": "量化固定网格与黏性尾流构成独立指针材质。",
    "batch": "B",
    "demo": "酸绿色像素墙被指针书写成临时符号，随后逐格熄灭。",
    "capture": "画圆和直线→停住→录下网格逐步衰减到空。",
    "risk": {
      "level": "high",
      "detail": "许可未明；网格尺寸需在缩略图可见并固定 DPR。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits PixelTrail",
      "renderer": "Canvas/SVG filter",
      "snippet": "<PixelTrail gridSize={36} trailSize={.12}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTrail-TS-TW.json"
    }
  },
  {
    "id": "snapping-target-reticle-cursor",
    "name": "Snapping target-reticle cursor",
    "nameZh": "吸附目标准星光标",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/TargetCursor-TS-TW.json",
    "difference": "四角准星移动并按目标边界重设尺寸；现有情境光标只换媒体/文字角色，不几何锁定元素。",
    "behavior": {
      "trigger": "pointer proximity/focus",
      "response": "Travel and resize a reticle to lock onto marked targets",
      "timing": "spring target acquisition",
      "layer": "cursor overlay around DOM targets"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "animate(reticle, boundsToReticle(target.getBoundingClientRect()), { type: 'spring', stiffness: 420, damping: 32 });",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/TargetCursor-TS-TW.json"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 94
    },
    "rationaleZh": "元素边界吸附把光标变成明确的目标获取系统。",
    "batch": "B",
    "demo": "准星在三种尺寸的仪器按钮之间锁定，角标旋转后停止。",
    "capture": "pointer 依次接近三个目标→记录 resize/snap→离开回自由态。",
    "risk": {
      "level": "high",
      "detail": "许可未明；必须从 getBoundingClientRect 计算目标，不可写死坐标。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits TargetCursor",
      "renderer": "React DOM",
      "snippet": "<TargetCursor targetSelector='.cursor-target'/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/TargetCursor-TS-TW.json"
    }
  },
  {
    "id": "pointer-reactive-cell-grid",
    "name": "Pointer-reactive cell grid",
    "nameZh": "指针响应单元格网格",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/CursorGrid-TS-TW.json",
    "difference": "持久几何网格按指针距离调制每格描边/填充并产生点击波；不是像素尾流的二值亮灭。",
    "behavior": {
      "trigger": "pointer move/click",
      "response": "Modulate cell geometry by pointer distance and emit a radial click pulse",
      "timing": "continuous distance field plus impulse",
      "layer": "Canvas/WebGL cell grid"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "cells.forEach(cell => drawReactiveCell(p, cell, pointerDistance(cell, pointer), clickPulse));",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/CursorGrid-TS-TW.json"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 91
    },
    "rationaleZh": "连续距离场和点击冲击与其他 cursor trail 明确不同。",
    "batch": "B",
    "demo": "一面等距方格随指针弯曲成浅坑，点击时脉冲扩散。",
    "capture": "pointer 横穿→停中心→click→等待脉冲越过四周。",
    "risk": {
      "level": "high",
      "detail": "许可未明；需验证网格主体而非文字说明承担辨识度。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits CursorGrid",
      "renderer": "Canvas/WebGL",
      "snippet": "<CursorGrid cellSize={28} radius={180} clickPulse/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/CursorGrid-TS-TW.json"
    }
  },
  {
    "id": "slider-controlled-exploded-3d-assembly",
    "name": "Slider-controlled exploded 3D assembly",
    "nameZh": "滑杆控制 3D 爆炸装配",
    "category": "webgl",
    "sourceUrl": "https://github.com/mrdoob/three.js",
    "difference": "滑杆改变零件相对结构而非相机；现有 3D/Shader Demo 没有装配轴和可逆拆解。",
    "behavior": {
      "trigger": "range drag",
      "response": "Separate and recombine authored parts along assembly vectors",
      "timing": "continuous reversible structural mapping",
      "layer": "Three.js mesh assembly"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "webgl",
      "snippet": "parts.forEach(part => translate(...part.axis.map(v => v * progress)))",
      "referenceUrl": "https://github.com/mrdoob/three.js"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 19,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 94
    },
    "rationaleZh": "结构变化直接可见且无需外部模型资产。",
    "batch": "C",
    "demo": "原创轨道相机由六个程序化几何零件沿轴爆炸分解。",
    "capture": "拖 range 0→1→.45→0；同时轻微 orbit 验证真实 3D。",
    "risk": {
      "level": "medium",
      "detail": "各部件轴必须有设计逻辑；单纯把方块散开会低分。"
    },
    "observedImplementation": {
      "projectId": "mrdoob-three-js",
      "library": "three.js",
      "renderer": "WebGL",
      "snippet": "parts.forEach(p=>p.position.copy(p.userData.axis).multiplyScalar(progress))",
      "projectUrl": "https://github.com/mrdoob/three.js",
      "referenceUrl": "https://threejs.org/docs/"
    }
  },
  {
    "id": "collision-reactive-3d-physics-stack",
    "name": "Collision-reactive 3D physics stack",
    "nameZh": "碰撞响应 3D 物理堆栈",
    "category": "webgl",
    "sourceUrl": "https://github.com/pmndrs/react-three-rapier",
    "difference": "3D 刚体碰撞按冲量改变可见状态；Matter 海报堆是二维且没有事件材质反馈。",
    "behavior": {
      "trigger": "spawn/physics collision",
      "response": "Drop rigid bodies and flash materials from real collision impulses",
      "timing": "fixed-step persistent 3D physics",
      "layer": "React Three Fiber scene"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "webgl",
      "snippet": "body.vy += gravity * dt; resolveContact(body, floor, collisionImpulse)",
      "referenceUrl": "https://github.com/pmndrs/react-three-rapier"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 96
    },
    "rationaleZh": "碰撞事件与发光波环建立清楚物理因果。",
    "batch": "C",
    "demo": "半透明方块落在黑色基座，强碰撞激发不同亮度的波环。",
    "capture": "点击生成三块→录第一次强碰撞→拖动一块砸入堆栈。",
    "risk": {
      "level": "high",
      "detail": "WASM、固定时间步与无声可读反馈都需验证。"
    },
    "observedImplementation": {
      "projectId": "pmndrs-react-three-rapier",
      "library": "React Three Rapier",
      "renderer": "WebGL + Rapier WASM",
      "snippet": "<RigidBody onCollisionEnter={({totalForceMagnitude})=>flash(totalForceMagnitude)}/>",
      "projectUrl": "https://github.com/pmndrs/react-three-rapier",
      "referenceUrl": "https://pmndrs.github.io/react-three-rapier/"
    }
  },
  {
    "id": "refractive-glass-transmission-sculpture",
    "name": "Refractive glass transmission sculpture",
    "nameZh": "折射玻璃透射雕塑",
    "category": "webgl",
    "sourceUrl": "https://github.com/pmndrs/drei",
    "difference": "物体以厚度、色散和畸变折射实时背景；现有虹彩 shader 平面不模拟透射光学。",
    "behavior": {
      "trigger": "pointer/time",
      "response": "Rotate a transmissive sculpture and refract a live striped environment",
      "timing": "continuous optical response",
      "layer": "3D mesh material"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "webgl",
      "snippet": "vec3 transmitted = environment(refract(ray, normal, 1.0 / 1.45));",
      "referenceUrl": "https://github.com/pmndrs/drei"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 20,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 95
    },
    "rationaleZh": "玻璃厚度和色散带来独立材质签名。",
    "batch": "C",
    "demo": "玻璃结体前后穿过程序化彩色条纹，拖动时折射方向改变。",
    "capture": "自动转一圈→pointer drag 改视角→停在高色散峰值。",
    "risk": {
      "level": "high",
      "detail": "禁止依赖无许可 HDRI；低端 GPU 需清楚降级。"
    },
    "observedImplementation": {
      "projectId": "pmndrs-drei",
      "library": "Drei MeshTransmissionMaterial",
      "renderer": "WebGL",
      "snippet": "<MeshTransmissionMaterial thickness={.55} chromaticAberration={.07}/>",
      "projectUrl": "https://github.com/pmndrs/drei",
      "referenceUrl": "https://drei.docs.pmnd.rs/shaders/mesh-transmission-material"
    }
  },
  {
    "id": "cinematic-map-camera-fly-to",
    "name": "Cinematic map camera fly-to",
    "nameZh": "电影式地图相机飞行",
    "category": "webgl",
    "sourceUrl": "https://github.com/maplibre/maplibre-gl-js",
    "difference": "同时插值中心、缩放、俯仰与方位角；点阵地球只旋转球体，其他 3D 场景不含地理投影。",
    "behavior": {
      "trigger": "click/timer",
      "response": "Fly a projected map camera through center, zoom, pitch, and bearing",
      "timing": "eased continuous geographic camera",
      "layer": "MapLibre WebGL map"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "context.translate(center); context.scale(zoom, zoom * (1 - pitch)); context.rotate(bearing)",
      "referenceUrl": "https://github.com/maplibre/maplibre-gl-js"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 89
    },
    "rationaleZh": "地理相机运动可成为电影式位置叙事。",
    "batch": "C",
    "demo": "无标签的本地矢量地图从全球视角飞入一枚发光城市节点。",
    "capture": "点击城市→完整 flyTo→停 500ms→reset 回全球。",
    "risk": {
      "level": "high",
      "detail": "GitHub SPDX 未断言；必须使用本地 style/GeoJSON，不能依赖远程瓦片。"
    },
    "observedImplementation": {
      "projectId": "maplibre-maplibre-gl-js",
      "library": "MapLibre GL JS",
      "renderer": "WebGL vector map",
      "snippet": "map.flyTo({center,zoom:13,pitch:58,bearing:-24,duration:3200})",
      "projectUrl": "https://github.com/maplibre/maplibre-gl-js",
      "referenceUrl": "https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#flyto"
    }
  },
  {
    "id": "pickable-extruded-data-columns",
    "name": "Pickable extruded data columns",
    "nameZh": "可拾取挤出数据柱",
    "category": "webgl",
    "sourceUrl": "https://github.com/visgl/deck.gl",
    "difference": "GPU 实例柱以数据高度编码并通过真实 picking 返回对象；多图表启动是二维时序。",
    "behavior": {
      "trigger": "hover/drag",
      "response": "Pick instanced data columns, elevate the active mark, and update a tooltip",
      "timing": "continuous camera plus discrete GPU picking",
      "layer": "deck.gl WebGL layer"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "active = columnPolygons.findIndex(polygon => pointInPolygon(pointer, polygon))",
      "referenceUrl": "https://github.com/visgl/deck.gl"
    },
    "scores": {
      "creativity": 16,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 90
    },
    "rationaleZh": "数据高度、相机和 GPU 拾取构成独立三维可视化交互。",
    "batch": "C",
    "demo": "36 根城市信号柱在深色平面上生长，悬停单柱升起并显示名称。",
    "capture": "orbit 20°→hover 三柱→停在最高柱→leave 清除。",
    "risk": {
      "level": "medium",
      "detail": "必须是真实 picking；用 DOM 热区模拟命中不合格。"
    },
    "observedImplementation": {
      "projectId": "visgl-deck-gl",
      "library": "deck.gl ColumnLayer",
      "renderer": "WebGL2",
      "snippet": "new ColumnLayer({data,extruded:true,pickable:true,onHover})",
      "projectUrl": "https://github.com/visgl/deck.gl",
      "referenceUrl": "https://deck.gl/docs/api-reference/layers/column-layer"
    }
  },
  {
    "id": "curved-3d-text-orbit",
    "name": "Curved 3D text orbit",
    "nameZh": "弯曲三维文字环绕",
    "category": "webgl",
    "sourceUrl": "https://github.com/protectwise/troika",
    "difference": "SDF 字体沿深度半径弯曲并在三维空间环绕；SVG 曲线传送带仍是平面路径排字。",
    "behavior": {
      "trigger": "pointer/time",
      "response": "Bend crisp SDF glyphs around a radius and orbit them in depth",
      "timing": "continuous 3D typographic motion",
      "layer": "Three.js SDF text"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "glyph.x = centerX + sin(angle) * radius; glyph.scale = depthToScale(cos(angle))",
      "referenceUrl": "https://github.com/protectwise/troika"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 94
    },
    "rationaleZh": "真实深度遮挡与清晰 SDF 字形使其区别于平面文字动画。",
    "batch": "C",
    "demo": "DEPTH/ORBIT 两行字在圆柱内外相反方向转动并穿过镜头。",
    "capture": "等待 sync→自动 orbit→pointer drag 相机→停在前后遮挡峰值。",
    "risk": {
      "level": "high",
      "detail": "字体文件必须本地且许可明确；未等待 sync 会录到空白首帧。"
    },
    "observedImplementation": {
      "projectId": "protectwise-troika",
      "library": "troika-three-text",
      "renderer": "WebGL",
      "snippet": "label.curveRadius=-3;label.sync()",
      "projectUrl": "https://github.com/protectwise/troika",
      "referenceUrl": "https://protectwise.github.io/troika/troika-three-text/"
    }
  },
  {
    "id": "cursor-projected-3d-surface-marker",
    "name": "Cursor-projected 3D surface marker",
    "nameZh": "光标投射三维表面标记",
    "category": "webgl",
    "sourceUrl": "https://github.com/mrdoob/three.js",
    "difference": "Raycaster 把二维光标投到起伏网格并让标记沿面法线贴合；现有光标都停留在屏幕平面。",
    "behavior": {
      "trigger": "pointer move/click",
      "response": "Raycast onto a mesh, align a marker to the face normal, and leave fading stamps",
      "timing": "continuous surface tracking plus click imprint",
      "layer": "Three.js mesh surface"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "normal = normalize([-dHeightDu, -dHeightDv, 1]); stamp(project(u, v, height(u,v)))",
      "referenceUrl": "https://github.com/mrdoob/three.js"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 94
    },
    "rationaleZh": "二维输入与三维表面法线的关系清楚且无需外部资产。",
    "batch": "C",
    "demo": "波浪状纸面上准星贴着坡度移动，点击留下会褪色的印章。",
    "capture": "pointer 横跨峰谷→三次 click→orbit 证明印章贴在表面。",
    "risk": {
      "level": "medium",
      "detail": "必须真实 raycast 和 face normal；屏幕坐标直接移动属于伪造。"
    },
    "observedImplementation": {
      "projectId": "mrdoob-three-js",
      "library": "three.js Raycaster",
      "renderer": "WebGL",
      "snippet": "const hit=raycaster.intersectObject(surface)[0];marker.position.copy(hit.point)",
      "projectUrl": "https://github.com/mrdoob/three.js",
      "referenceUrl": "https://threejs.org/docs/#api/en/core/Raycaster"
    }
  },
  {
    "id": "drag-resizable-audio-loop-region",
    "name": "Drag-resizable audio loop region",
    "nameZh": "可拖拽缩放音频循环区",
    "category": "canvas",
    "sourceUrl": "https://github.com/katspaugh/wavesurfer.js",
    "difference": "用户编辑时间区间两端并循环播放；A/B 音频比较改变混合比例而不改变时间范围。",
    "behavior": {
      "trigger": "drag/resize/click",
      "response": "Edit both boundaries of an audio region and loop its playback",
      "timing": "persistent temporal selection with looping playhead",
      "layer": "waveform canvas"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "loopTime = region.start + phase * (region.end - region.start)",
      "referenceUrl": "https://github.com/katspaugh/wavesurfer.js"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 91
    },
    "rationaleZh": "可编辑区间与播放头回环在静音 GIF 中也能清楚呈现。",
    "batch": "C",
    "demo": "本地 8 秒节奏波形上，紫色循环区可拖动与缩放。",
    "capture": "拖左边界→拖右边界→点击 region 播放→录下 playhead 回环。",
    "risk": {
      "level": "medium",
      "detail": "需本地生成音频；视觉必须独立于声音可读。"
    },
    "observedImplementation": {
      "projectId": "katspaugh-wavesurfer-js",
      "library": "WaveSurfer Regions plugin",
      "renderer": "Canvas + audio",
      "snippet": "regions.addRegion({start:1,end:4,drag:true,resize:true})",
      "projectUrl": "https://github.com/katspaugh/wavesurfer.js",
      "referenceUrl": "https://wavesurfer.xyz/docs/classes/plugins_regions.RegionsPlugin"
    }
  },
  {
    "id": "streaming-line-chart-window",
    "name": "Streaming line-chart window",
    "nameZh": "流式折线图窗口推进",
    "category": "canvas",
    "sourceUrl": "https://github.com/apache/echarts",
    "difference": "新数据从右进入、旧数据滑出且整窗连续插值；多图表启动只展示一次上线序列。",
    "behavior": {
      "trigger": "data timer/event",
      "response": "Advance a fixed data window and interpolate each incoming telemetry sample",
      "timing": "continuous recent-history stream",
      "layer": "Canvas chart"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "window = samples.slice(start, start + 60).map(interpolateIncomingSample)",
      "referenceUrl": "https://github.com/apache/echarts"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 89
    },
    "rationaleZh": "推进窗口和阈值变色能形成持续遥测叙事。",
    "batch": "C",
    "demo": "一条固定 60 样本心跳曲线不断前移，越过阈值时整段短暂变色。",
    "capture": "固定数据序列运行 6 次更新→停在阈值峰值→继续恢复。",
    "risk": {
      "level": "medium",
      "detail": "禁止 Math.random；默认图表主题会降低艺术分。"
    },
    "observedImplementation": {
      "projectId": "apache-echarts",
      "library": "Apache ECharts",
      "renderer": "Canvas",
      "snippet": "chart.setOption({series:[{type:'line',data:nextWindow}]})",
      "projectUrl": "https://github.com/apache/echarts",
      "referenceUrl": "https://echarts.apache.org/en/option.html#series-line"
    }
  },
  {
    "id": "handle-connected-animated-node-editor",
    "name": "Handle-connected animated node editor",
    "nameZh": "手柄连线动画节点编辑器",
    "category": "vector",
    "sourceUrl": "https://github.com/xyflow/xyflow",
    "difference": "用户从 source handle 建立真实拓扑，成功后流光沿边运行；DOM beam 只连接预先存在的节点。",
    "behavior": {
      "trigger": "node drag / handle connect",
      "response": "Create topology from handles and animate data flow through the new edge",
      "timing": "direct manipulation with persistent graph state",
      "layer": "DOM/SVG node canvas"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "svg",
      "snippet": "edge.setAttribute('d', cubicBetween(measuredOutputHandle, measuredInputHandle))",
      "referenceUrl": "https://github.com/xyflow/xyflow"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 89
    },
    "rationaleZh": "拓扑编辑与流动反馈结合，区别于被动力网络和装饰连线。",
    "batch": "C",
    "demo": "输入、模型、输出三节点，用户拖线成功后下游节点逐步点亮。",
    "capture": "从 Input handle 拖到 Model→再连 Output→移动中间节点观察边更新。",
    "risk": {
      "level": "medium",
      "detail": "必须真实 handle-to-handle pointer；预写 SVG 连线不合格。"
    },
    "observedImplementation": {
      "projectId": "xyflow-xyflow",
      "library": "React Flow",
      "renderer": "DOM + SVG",
      "snippet": "<ReactFlow nodes={nodes} edges={edges} onConnect={addConnection}/>",
      "projectUrl": "https://github.com/xyflow/xyflow",
      "referenceUrl": "https://reactflow.dev/learn"
    }
  },
  {
    "id": "bending-webgl-gallery-ribbon",
    "name": "Bending WebGL gallery ribbon",
    "nameZh": "弯曲 WebGL 图库丝带",
    "category": "webgl",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/CircularGallery-TS-TW.json",
    "difference": "媒体平面整体弯成连续圆柱丝带；拖拽穹顶在半球表面分布，现有轮播没有几何弯曲。",
    "behavior": {
      "trigger": "wheel/drag",
      "response": "Scroll media planes along a continuously bent cylindrical ribbon",
      "timing": "inertial looping gallery motion",
      "layer": "WebGL media strip"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "webgl",
      "snippet": "card.position = [sin(angle) * radius, 0, -cos(angle) * radius]",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/CircularGallery-TS-TW.json"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 97
    },
    "rationaleZh": "整条图库几何弯曲提供强烈空间签名。",
    "batch": "C",
    "demo": "九张抽象纹理沿弧形胶片带循环，中心项最清晰。",
    "capture": "wheel 加速→反向 drag→释放惯性→停中心卡。",
    "risk": {
      "level": "high",
      "detail": "React Bits 许可未明，源码约 26KB；图片资产和 WebGL 性能需控制。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits CircularGallery",
      "renderer": "WebGL",
      "snippet": "<CircularGallery bend={3} scrollSpeed={2}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/CircularGallery-TS-TW.json"
    }
  },
  {
    "id": "draggable-dome-gallery",
    "name": "Draggable dome gallery",
    "nameZh": "可拖拽穹顶图库",
    "category": "webgl",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/DomeGallery-TS-TW.json",
    "difference": "图片分布在半球内壁并随拖拽改变观察方向；弯曲丝带是一维连续轨道。",
    "behavior": {
      "trigger": "pointer drag",
      "response": "Rotate a hemispherical image field and expand a selected tile from its surface",
      "timing": "continuous spherical navigation plus discrete focus",
      "layer": "WebGL dome"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "webgl",
      "snippet": "tile.position = spherical(azimuth + yaw, elevation + pitch, radius)",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/DomeGallery-TS-TW.json"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 19,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 96
    },
    "rationaleZh": "二维拖拽映射到穹顶视野，空间关系与 ribbon 明确不同。",
    "batch": "C",
    "demo": "星空档案照片铺在穹顶内壁，点击一张沿径向展开。",
    "capture": "drag 横向 100px→纵向 80px→点击目标→Esc 收回。",
    "risk": {
      "level": "high",
      "detail": "许可未明，源码约 35KB；需防止和 360 全景混淆并固定相机。"
    },
    "observedImplementation": {
      "projectId": "davidhdev-react-bits",
      "library": "React Bits DomeGallery",
      "renderer": "WebGL",
      "snippet": "<DomeGallery fit={.8} segments={32}/>",
      "projectUrl": "https://github.com/DavidHDev/react-bits",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/DomeGallery-TS-TW.json"
    }
  },
  {
    "id": "animated-dom-node-connection-beam",
    "name": "Animated DOM-node connection beam",
    "nameZh": "DOM 节点连接光束",
    "category": "vector",
    "sourceUrl": "https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/animated-beam.mdx",
    "difference": "根据真实 DOM 节点边界实时路由光束；节点编辑器由用户创建边，现有 SVG 描边沿固定路径。",
    "behavior": {
      "trigger": "layout/time",
      "response": "Route a light pulse between measured DOM anchors and update when they move",
      "timing": "continuous geometry-bound beam",
      "layer": "SVG overlay between DOM nodes"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "svg",
      "snippet": "path.setAttribute('d', bezier(center(from.getBoundingClientRect()), center(to.getBoundingClientRect())))",
      "referenceUrl": "https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/animated-beam.mdx"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 93
    },
    "rationaleZh": "真实 DOM 几何和流动光脉冲绑定，适合解释系统连接。",
    "batch": "C",
    "demo": "三枚工具节点围绕模型节点移动，光束始终重新弯曲连接。",
    "capture": "开始流动→拖动一个节点→resize 容器→录下路径持续对齐。",
    "risk": {
      "level": "medium",
      "detail": "不可画死 SVG；字体/布局稳定后才能计算节点中心。"
    },
    "observedImplementation": {
      "projectId": "magicuidesign-magicui",
      "library": "Magic UI AnimatedBeam",
      "renderer": "DOM + SVG",
      "snippet": "<AnimatedBeam containerRef={box} fromRef={a} toRef={b}/>",
      "projectUrl": "https://github.com/magicuidesign/magicui",
      "referenceUrl": "https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/animated-beam.mdx"
    }
  },
  {
    "id": "clip-shape-theme-reveal",
    "name": "Clip-shape theme reveal",
    "nameZh": "裁剪形状主题揭示",
    "category": "transition",
    "sourceUrl": "https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/animated-theme-toggler.mdx",
    "difference": "新主题通过点击原点的圆形 View Transition 扩散；场景换幕改变内容，菜单帘幕只揭示 overlay。",
    "behavior": {
      "trigger": "theme toggle",
      "response": "Reveal the next global color theme from the invocation point through an expanding clip",
      "timing": "one-shot reversible view transition",
      "layer": "whole document"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "layer.style.clipPath = `circle(${radius}% at ${origin.x}% ${origin.y}%)`",
      "referenceUrl": "https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/animated-theme-toggler.mdx"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 93
    },
    "rationaleZh": "点击原点与全局主题扩散建立明确空间因果。",
    "batch": "C",
    "demo": "太阳按钮位于海报角落，白昼主题从按钮圆心扩张覆盖夜景。",
    "capture": "click 切到 light→录圆半径穿过主体→再次点击从新原点回 dark。",
    "risk": {
      "level": "medium",
      "detail": "Safari/旧浏览器需要非动画降级；不能用固定中心 clip 冒充点击原点。"
    },
    "observedImplementation": {
      "projectId": "magicuidesign-magicui",
      "library": "View Transitions API / Magic UI",
      "renderer": "document compositor",
      "snippet": "document.startViewTransition(()=>toggleTheme())",
      "projectUrl": "https://github.com/magicuidesign/magicui",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition"
    }
  },
  {
    "id": "sticky-paragraph-ink-reveal",
    "name": "Sticky paragraph ink reveal",
    "nameZh": "粘性段落逐词着色",
    "category": "scroll",
    "sourceUrl": "https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/text-reveal.mdx",
    "difference": "段落固定不动，滚动只逐词改变墨色；blur-rotate reveal 同时改变模糊和姿态。",
    "behavior": {
      "trigger": "scroll progress",
      "response": "Fill the ink of a sticky paragraph word by word",
      "timing": "continuous per-word color scrub",
      "layer": "sticky typography block"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "wordControls.forEach((control,i) => control.time = clamp(progress * count - i))",
      "referenceUrl": "https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/text-reveal.mdx"
    },
    "scores": {
      "creativity": 16,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 91
    },
    "rationaleZh": "最小运动下仍能清楚表达阅读进度和语言节奏。",
    "batch": "C",
    "demo": "一段宣言固定在纸面中央，滚动让灰字逐词变为浓墨和单个强调色。",
    "capture": "scroll 0→100%，在句号与强调词处停顿，再反向擦淡。",
    "risk": {
      "level": "low",
      "detail": "必须依靠排版达到艺术门槛；单纯 opacity 映射可能分数不足。"
    },
    "observedImplementation": {
      "projectId": "magicuidesign-magicui",
      "library": "Magic UI TextReveal",
      "renderer": "React DOM",
      "snippet": "<TextReveal>Products should explain themselves...</TextReveal>",
      "projectUrl": "https://github.com/magicuidesign/magicui",
      "referenceUrl": "https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/text-reveal.mdx"
    }
  },
  {
    "id": "draggable-force-directed-svg-network",
    "name": "Draggable force-directed SVG network",
    "nameZh": "可拖拽力导向 SVG 网络",
    "category": "vector",
    "sourceUrl": "https://d3js.org/d3-force",
    "difference": "节点持续受图力约束且可被拖拽暂时钉住；节点编辑器修改拓扑，DOM beam 无物理模拟。",
    "behavior": {
      "trigger": "simulation / pointer drag",
      "response": "Settle graph nodes under forces and temporarily pin a node through dragging",
      "timing": "continuous physics with interactive constraint",
      "layer": "SVG graph"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "force = linkSpring + inverseSquareCharge + centering; node.fixed = dragPoint",
      "referenceUrl": "https://d3js.org/d3-force"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 17,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 92
    },
    "rationaleZh": "图拓扑和力学反馈共同决定布局，区别于任意粒子场。",
    "batch": "C",
    "demo": "九个创作角色节点自动成簇，拖动“Director”会牵动全部关联者。",
    "capture": "等待 settle→拖中心节点越过画面→释放→录下网络重新稳定。",
    "risk": {
      "level": "medium",
      "detail": "需固定初始坐标，减少随机 simulation 差异。"
    },
    "observedImplementation": {
      "projectId": "d3-d3",
      "library": "D3 force",
      "renderer": "SVG",
      "snippet": "d3.forceSimulation(nodes).force('link',d3.forceLink(links)).force('charge',d3.forceManyBody())",
      "projectUrl": "https://github.com/d3/d3",
      "referenceUrl": "https://d3js.org/d3-force"
    }
  },
  {
    "id": "voronoi-nearest-point-hover-focus",
    "name": "Voronoi nearest-point hover focus",
    "nameZh": "Voronoi 最近点悬停聚焦",
    "category": "vector",
    "sourceUrl": "https://d3js.org/d3-delaunay",
    "difference": "不可见 Voronoi 索引让稀疏数据按数学最近点吸附焦点；不是按元素边界的光标准星。",
    "behavior": {
      "trigger": "pointer move",
      "response": "Snap a chart focus marker to the mathematically nearest datum",
      "timing": "continuous nearest-neighbor selection",
      "layer": "SVG data plot"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "cell = sites.reduce((polygon, site) => clipByBisector(polygon, focus, site), bounds)",
      "referenceUrl": "https://d3js.org/d3-delaunay"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 91
    },
    "rationaleZh": "数学最近点命中使数据探索具有独立指针行为。",
    "batch": "C",
    "demo": "稀疏星图散点中，焦点圆和信息标签连续吸附最近星体。",
    "capture": "pointer 沿无点区域移动→跨越三个 Voronoi 边界→停在孤立点。",
    "risk": {
      "level": "low",
      "detail": "必须由 Delaunay.find 计算，不能只监听 circle hover。"
    },
    "observedImplementation": {
      "projectId": "d3-d3",
      "library": "D3 Delaunay",
      "renderer": "SVG",
      "snippet": "const i=delaunay.find(mx,my);focus.attr('cx',x(data[i].x))",
      "projectUrl": "https://github.com/d3/d3",
      "referenceUrl": "https://d3js.org/d3-delaunay"
    }
  },
  {
    "id": "linked-brush-to-zoom-chart",
    "name": "Linked brush-to-zoom chart",
    "nameZh": "联动框选缩放图表",
    "category": "vector",
    "sourceUrl": "https://d3js.org/d3-brush",
    "difference": "下方概览 brush 的选择区间重设上方主图 domain；普通媒体 pan/zoom 没有双图联动。",
    "behavior": {
      "trigger": "drag brush handles",
      "response": "Select a time interval in an overview and rescale a linked focus chart",
      "timing": "continuous linked-domain manipulation",
      "layer": "paired SVG charts"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "focusDomain = brushSelection.map(value => value * (samples.length - 1))",
      "referenceUrl": "https://d3js.org/d3-brush"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 89
    },
    "rationaleZh": "双视图的范围选择和缩放因果清楚。",
    "batch": "C",
    "demo": "一条气候曲线主图与迷你概览，下方选择窗拖动时上图重绘。",
    "capture": "拖左 handle 缩小范围→整体平移 brush→双击 reset。",
    "risk": {
      "level": "low",
      "detail": "交互偏功能性，需编辑式色彩和清晰过渡达到艺术线。"
    },
    "observedImplementation": {
      "projectId": "d3-d3",
      "library": "D3 brush",
      "renderer": "SVG",
      "snippet": "brush.on('brush end',({selection})=>x.domain(selection.map(x2.invert)))",
      "projectUrl": "https://github.com/d3/d3",
      "referenceUrl": "https://d3js.org/d3-brush"
    }
  },
  {
    "id": "click-to-collapse-hierarchy-branches",
    "name": "Click-to-collapse hierarchy branches",
    "nameZh": "点击折叠层级分支",
    "category": "vector",
    "sourceUrl": "https://d3js.org/d3-hierarchy/tree",
    "difference": "点击节点移除/恢复后代并重新计算树布局；节点编辑器新建任意边，力网络没有层级深度。",
    "behavior": {
      "trigger": "node click / keyboard activation",
      "response": "Collapse and restore descendant branches with animated tree reflow",
      "timing": "discrete hierarchy state with layout transition",
      "layer": "SVG tree"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "svg",
      "snippet": "nodeControl.time = collapseProgress; edge.d = interpolateTreeLayout(expanded, collapsed)",
      "referenceUrl": "https://d3js.org/d3-hierarchy/tree"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 88
    },
    "rationaleZh": "信息深度通过直接折叠改变，树形拓扑稳定可读。",
    "batch": "C",
    "demo": "创作流程树从“Concept”展开到文字、光线、声音，再折叠分支。",
    "capture": "click 折叠最大分支→观察 sibling 重排→键盘重新展开。",
    "risk": {
      "level": "medium",
      "detail": "动画 reflow 必须保持对象身份；瞬间重画会像普通图表。"
    },
    "observedImplementation": {
      "projectId": "d3-d3",
      "library": "D3 hierarchy/tree",
      "renderer": "SVG",
      "snippet": "node.children?collapse(node):expand(node);render(tree(root))",
      "projectUrl": "https://github.com/d3/d3",
      "referenceUrl": "https://d3js.org/d3-hierarchy/tree"
    }
  },
  {
    "id": "velocity-sensitive-signature-ink",
    "name": "Velocity-sensitive signature ink",
    "nameZh": "速度感应签名墨迹",
    "category": "canvas",
    "sourceUrl": "https://github.com/szimek/signature_pad",
    "difference": "笔宽根据签署速度平滑变化并可导出；perfect-freehand 更强调压力输入和填充轮廓。",
    "behavior": {
      "trigger": "pointer draw",
      "response": "Vary smoothed ink width from signing velocity and preserve the completed signature",
      "timing": "continuous stroke with velocity filtering",
      "layer": "Canvas ink surface"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "width = clamp(maxWidth - filteredPointerVelocity * weight, minWidth, maxWidth)",
      "referenceUrl": "https://github.com/szimek/signature_pad"
    },
    "scores": {
      "creativity": 16,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 90
    },
    "rationaleZh": "速度—笔宽关系带来明确手写质感和可迁移交互。",
    "batch": "C",
    "demo": "在米白纸张上先慢写宽线，再快速甩出细尾，完成一枚抽象签名。",
    "capture": "自动 pointer 以慢/快两段轨迹绘制→停在完成态→clear 重播。",
    "risk": {
      "level": "low",
      "detail": "capture 要使用真实 pointer 输入；预烘焙 SVG 路径不合格。"
    },
    "observedImplementation": {
      "projectId": "szimek-signature-pad",
      "library": "Signature Pad",
      "renderer": "Canvas 2D",
      "snippet": "new SignaturePad(canvas,{minWidth:.6,maxWidth:3.2,velocityFilterWeight:.75})",
      "projectUrl": "https://github.com/szimek/signature_pad",
      "referenceUrl": "https://github.com/szimek/signature_pad#options"
    }
  },
  {
    "id": "pressure-shaped-freehand-stroke",
    "name": "Pressure-shaped freehand stroke",
    "nameZh": "压力塑形自由笔触",
    "category": "canvas",
    "sourceUrl": "https://github.com/steveruizok/perfect-freehand",
    "difference": "raw pressure 样本被转换为可填充变宽轮廓；签名墨迹以速度滤波为主。",
    "behavior": {
      "trigger": "pointer pressure / drag",
      "response": "Convert raw pressure points into a smooth filled outline",
      "timing": "continuous pressure-aware geometry",
      "layer": "Canvas/SVG freehand surface"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "outline = points.flatMap(point => offsetAlongNormal(point, 2 + point.pressure * 18))",
      "referenceUrl": "https://github.com/steveruizok/perfect-freehand"
    },
    "scores": {
      "creativity": 17,
      "artDirection": 17,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 92
    },
    "rationaleZh": "压力与轮廓几何直接对应，适合笔刷和批注创作。",
    "batch": "C",
    "demo": "同一条蛇形线随模拟 pressure 从针尖逐渐变成宽阔色带。",
    "capture": "派发固定 pressure 0.1→0.9→0.2 的 pointer 轨迹→undo→重播。",
    "risk": {
      "level": "medium",
      "detail": "鼠标 pressure 常固定，capture 必须合成真实 PointerEvent pressure 并记录。"
    },
    "observedImplementation": {
      "projectId": "steveruizok-perfect-freehand",
      "library": "perfect-freehand",
      "renderer": "Canvas 2D",
      "snippet": "const outline=getStroke(points,{size:18,thinning:.65,smoothing:.55})",
      "projectUrl": "https://github.com/steveruizok/perfect-freehand",
      "referenceUrl": "https://github.com/steveruizok/perfect-freehand#usage"
    }
  },
  {
    "id": "drag-editable-bezier-curve-handles",
    "name": "Drag-editable Bézier curve handles",
    "nameZh": "可拖拽编辑贝塞尔曲线手柄",
    "category": "canvas",
    "sourceUrl": "https://github.com/paperjs/paper.js",
    "difference": "拖动可见控制点实时重算曲线与切线；曲线文字只沿既定路径运输。",
    "behavior": {
      "trigger": "pointer drag",
      "response": "Move curve handles and continuously recompute path geometry and tangents",
      "timing": "direct reversible geometry editing",
      "layer": "Paper.js Canvas vector surface"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "bezier(p0.x,p0.y,c1.x,c1.y,c2.x,c2.y,p3.x,p3.y)",
      "referenceUrl": "https://github.com/paperjs/paper.js"
    },
    "scores": {
      "creativity": 16,
      "artDirection": 18,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 91
    },
    "rationaleZh": "控制点、切线和曲线因果一眼可辨，是独立编辑器交互。",
    "batch": "C",
    "demo": "三点霓虹曲线带两个可见手柄，拖动中点让光带从拱形变成 S 形。",
    "capture": "drag 中点→drag 切线端→double click reset。",
    "risk": {
      "level": "medium",
      "detail": "GitHub SPDX 未断言；需核验许可并避免退化为普通 draggable dot。"
    },
    "observedImplementation": {
      "projectId": "paperjs-paper-js",
      "library": "Paper.js",
      "renderer": "Canvas 2D",
      "snippet": "handle.onMouseDrag=e=>{segment.point=e.point;path.smooth()}",
      "projectUrl": "https://github.com/paperjs/paper.js",
      "referenceUrl": "https://paperjs.org/reference/path/"
    }
  },
  {
    "id": "image-palette-ambient-color-transition",
    "name": "Image-palette ambient color transition",
    "nameZh": "图像取色环境色转场",
    "category": "animation",
    "sourceUrl": "https://github.com/lokesh/color-thief",
    "difference": "界面背景色从当前图片像素提取并动画匹配；模糊视频 ambience 复用动态画面而非提取静态主色。",
    "behavior": {
      "trigger": "image load / slide selection",
      "response": "Extract the dominant palette and transition the surrounding interface to match",
      "timing": "discrete source-driven color handoff",
      "layer": "background around media"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "dominant = samplePixels(offscreenImage); background(lerpColor(dominantA, dominantB, t))",
      "referenceUrl": "https://github.com/lokesh/color-thief"
    },
    "scores": {
      "creativity": 16,
      "artDirection": 19,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 92
    },
    "rationaleZh": "内容像素决定环境色，媒介与界面形成可解释关系。",
    "batch": "C",
    "demo": "三张原创静物照片切换时，整页环境色从靛蓝过渡到赭石再到薄荷。",
    "capture": "点击三张缩略图→等待 image load→录下两次主色 transition。",
    "risk": {
      "level": "medium",
      "detail": "需本地同源图片避免 Canvas taint；必须真实调用取色 API。"
    },
    "observedImplementation": {
      "projectId": "lokesh-color-thief",
      "library": "Color Thief + Web Animations API",
      "renderer": "DOM + Canvas sampling",
      "snippet": "const [r,g,b]=thief.getColor(image);hero.animate([{backgroundColor:old},{backgroundColor:`rgb(${r} ${g} ${b})`}])",
      "projectUrl": "https://github.com/lokesh/color-thief",
      "referenceUrl": "https://lokeshdhakar.com/projects/color-thief/"
    }
  },
  {
    "id": "blurhash-to-photo-progressive-reveal",
    "name": "BlurHash-to-photo progressive reveal",
    "nameZh": "BlurHash 到照片渐进揭示",
    "category": "animation",
    "sourceUrl": "https://github.com/woltapp/blurhash",
    "difference": "紧凑编码色场先出现再交接高清图；普通 skeleton 没有内容相关色彩，图像 ambience 不表达加载。",
    "behavior": {
      "trigger": "image-card hover, click, touch, or keyboard request",
      "response": "Decode a tiny content-aware color field and crossfade into the full image",
      "timing": "progressive two-stage media load",
      "layer": "image card"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "pixel += basisColor[i,j] * cos(pi*x*i/w) * cos(pi*y*j/h)",
      "referenceUrl": "https://github.com/woltapp/blurhash"
    },
    "scores": {
      "creativity": 15,
      "artDirection": 18,
      "motion": 17,
      "clarity": 15,
      "inspiration": 14,
      "evidence": 9,
      "total": 88
    },
    "rationaleZh": "加载占位与最终图共享色彩结构，进度语义清楚。",
    "batch": "C",
    "demo": "悬停图片卡加载清晰图；移开恢复 BlurHash，点击、触控或键盘可锁定切换。",
    "capture": "真实移动指针进入图片→录下 Hash 到照片揭示→移出图片恢复占位图。",
    "risk": {
      "level": "low",
      "detail": "必须使用真实 hash decode；模糊同一图片不等于 BlurHash。"
    },
    "observedImplementation": {
      "projectId": "woltapp-blurhash",
      "library": "BlurHash",
      "renderer": "Canvas + image",
      "snippet": "const pixels=decode(hash,32,32);photo.onload=()=>crossfade()",
      "projectUrl": "https://github.com/woltapp/blurhash",
      "referenceUrl": "https://github.com/woltapp/blurhash#how-do-i-use-it"
    }
  },
  {
    "id": "live-hand-landmark-video-overlay",
    "name": "Live hand-landmark video overlay",
    "nameZh": "视频手部关键点叠加",
    "category": "canvas",
    "sourceUrl": "https://github.com/google-ai-edge/mediapipe",
    "difference": "模型从视频帧推导关节几何并保持手指身份；现有交互均不从媒体内容实时推理结构。",
    "behavior": {
      "trigger": "video frame inference",
      "response": "Track articulated hand landmarks and draw a live skeleton and fingertip trails",
      "timing": "continuous model-driven tracking",
      "layer": "video + Canvas overlay"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "analysis.drawImage(video); landmarks = connectedColorComponents(analysis.getImageData(...))",
      "referenceUrl": "https://github.com/google-ai-edge/mediapipe"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 18,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 8,
      "total": 94
    },
    "rationaleZh": "视觉模型推理直接产生动态骨架，机制独特且可验证。",
    "batch": "C",
    "demo": "许可明确的本地手势短片上绘制 21 点骨架，指尖留下三色轨迹。",
    "capture": "播放固定 5s 视频→录制张手/捏合/指向三姿态→循环。",
    "risk": {
      "level": "high",
      "detail": "模型/WASM 大，必须打包许可明确视频；预标注 JSON 不能冒充推理。"
    },
    "observedImplementation": {
      "projectId": "google-ai-edge-mediapipe",
      "library": "MediaPipe Hand Landmarker",
      "renderer": "video + Canvas 2D",
      "snippet": "const result=handLandmarker.detectForVideo(video,performance.now())",
      "projectUrl": "https://github.com/google-ai-edge/mediapipe",
      "referenceUrl": "https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js"
    }
  },
  {
    "id": "frame-by-frame-gif-scrubber",
    "name": "Frame-by-frame GIF scrubber",
    "nameZh": "逐帧 GIF 擦洗器",
    "category": "canvas",
    "sourceUrl": "https://github.com/matt-way/gifuct-js",
    "difference": "range 非线性选择解码后的合成帧；目录中的 GIF 只是播放预览，视频 scrub 使用媒体 timecode。",
    "behavior": {
      "trigger": "range drag",
      "response": "Decode disposal-aware GIF frames and scrub them nonlinearly",
      "timing": "direct discrete frame selection",
      "layer": "Canvas media inspector"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "frames = await Promise.all([...Array(frameCount)].map((_,i) => decoder.decode({frameIndex:i})))",
      "referenceUrl": "https://github.com/matt-way/gifuct-js"
    },
    "scores": {
      "creativity": 16,
      "artDirection": 17,
      "motion": 18,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 90
    },
    "rationaleZh": "逐帧检查把 GIF 从被动媒体变成时间直接操纵界面。",
    "batch": "C",
    "demo": "原创 24 帧墨滴 GIF 旁带时间刻度，拖动可正放、倒放、跳帧。",
    "capture": "drag slider 0→23→8→17，展示 disposal 后画面仍正确。",
    "risk": {
      "level": "medium",
      "detail": "必须正确合成 disposal frames；逐帧 PNG 列表不算真实 GIF 解码。"
    },
    "observedImplementation": {
      "projectId": "matt-way-gifuct-js",
      "library": "gifuct-js",
      "renderer": "Canvas 2D",
      "snippet": "const frames=decompressFrames(parseGIF(buffer),true);slider.oninput=()=>draw(frames[slider.value])",
      "projectUrl": "https://github.com/matt-way/gifuct-js",
      "referenceUrl": "https://github.com/matt-way/gifuct-js#usage"
    }
  },
  {
    "id": "scroll-controlled-video-scrubbing",
    "name": "Scroll-controlled video scrubbing",
    "nameZh": "滚动控制视频擦洗",
    "category": "scroll",
    "sourceUrl": "https://motion.dev/docs/react-use-scroll",
    "difference": "规范化滚动进度直接设置视频 timecode；首屏影片按自身 duration 自动播放交接，文档回放改变 DOM 内容。",
    "behavior": {
      "trigger": "scroll progress",
      "response": "Map section progress directly to the current time of one video",
      "timing": "continuous reversible media scrub",
      "layer": "video timeline"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "video.currentTime = scrollProgress * (video.duration - 0.04)",
      "referenceUrl": "https://motion.dev/docs/react-use-scroll"
    },
    "scores": {
      "creativity": 18,
      "artDirection": 19,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 9,
      "total": 95
    },
    "rationaleZh": "滚动作为可逆媒体播放头，和自动视频/DOM 滚动机制都不同。",
    "batch": "C",
    "demo": "一段原创花朵开合影片被固定在纸面窗口，滚动逐帧控制开放程度。",
    "capture": "真实 scroll 0→65%→20%→100%，证明正向与反向 scrub。",
    "risk": {
      "level": "medium",
      "detail": "视频需关键帧密集且本地；不能通过切换预导出静帧模拟 currentTime。"
    },
    "observedImplementation": {
      "projectId": "motiondivision-motion",
      "library": "Motion useScroll + HTMLVideoElement",
      "renderer": "video",
      "snippet": "useMotionValueEvent(scrollYProgress,'change',p=>video.currentTime=p*video.duration)",
      "projectUrl": "https://github.com/motiondivision/motion",
      "referenceUrl": "https://motion.dev/docs/react-use-scroll"
    }
  }
];
