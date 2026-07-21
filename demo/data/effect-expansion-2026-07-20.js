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
    "name": "Human-built role-interest hiring memory",
    "nameZh": "真人构建的岗位兴趣招聘记忆",
    "category": "pointer",
    "sourceUrl": "https://www.clay.com/",
    "difference": "三次可信岗位选择建立可见的 session history，并据此逐步重组招聘邀请；不是定时模拟访问、随机改文案或每次相同的 hover。",
    "behavior": {
      "trigger": "trusted pointer or keyboard role selections, Undo, Escape, or Clear",
      "response": "Append visible role-interest history and recompose a retained multidisciplinary hiring invitation",
      "timing": "520ms finite feedback after each human-authored history mutation",
      "layer": "full-stage role board, visible session memory, and hiring badge"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "岗位选择、三格历史和招聘徽章共同解释网站为何“记得”兴趣；3/3 形成跨产品、代码与动效的真实匹配邀请，且每一步都能 Undo、Escape 或 Clear。",
    "batch": "A",
    "demo": "Parallel Practice 岗位兴趣台让真人选择 Product design、Creative code 与 Motion systems，并把选择历史归纳为可逆的跨学科招聘邀请。",
    "capture": "真人依次选择三个岗位，保留 3/3 匹配结果，再用 Undo 恢复到 2/3，证明记忆由输入构建且可撤销。",
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
    "name": "Human-registered edition reservation CTA",
    "nameZh": "真人套印的限量版预留 CTA",
    "category": "pointer",
    "sourceUrl": "https://unstructured.io/",
    "difference": "真实 hover/focus 让前景墨层与底版沿相反对角线分离；可信激活后两层先完成有限套印，随后才提交可撤销的限量版预留状态。",
    "behavior": {
      "trigger": "trusted hover/focus plus pointer or keyboard activation",
      "response": "Separate ink and backing plate, register them during one finite reservation transaction, then retain the committed hold",
      "timing": "220ms intent separation plus 820ms finite commit transition",
      "layer": "full-stage limited-edition product sheet and transactional CTA"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "限量出版物信息让错位套印成为真实购买层级；两层在 hover/focus 时反向分离、激活后有限归位，并严格在过渡完成后才提交或撤销预留结果。",
    "batch": "A",
    "demo": "一张全舞台限量出版物产品页，用前景墨层与酸绿底版的错位、套印和库存文案完成可撤销预留。",
    "capture": "真人 hover 分离→点击完成套印并保留预留→再次点击撤销→移出恢复首帧套印。",
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
    "name": "Publication index curtain",
    "nameZh": "文化刊物索引幕布",
    "category": "transition",
    "sourceUrl": "https://www.anthropic.com/",
    "difference": "Common Ground 的完整文化刊物专题页上，四段 polygon 幕布边缘依次越过 Exhibitions、Essays、Artists、Visit；选择栏目会更新底层标题、导语与访问信息后再收幕。",
    "behavior": {
      "trigger": "real menu click/tap, native link activation, Tab/Shift+Tab focus travel, or Escape",
      "response": "Open a shaped publication index, reveal links only after the moving edge reaches them, then apply the chosen section to the page beneath",
      "timing": "human-owned reversible 760 ms polygon reveal with per-row thresholds and no automatic rehearsal",
      "layer": "full-frame cultural publication page plus accessible modal navigation curtain"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "const reveal=animate(curtain,{clipPath:[closed,edge,almostOpen,open]},{times:[0,.43,.78,1],autoplay:false}); reveal.time=progress;",
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
    "rationaleZh": "幕布不再包围一组稀疏链接：闭合态是可成立的专题页，展开态是有层级的出版索引，栏目选择又会真实改变底页，形状运动与导航任务因此互相解释。",
    "batch": "A",
    "demo": "Common Ground 文化刊物/展览索引；四个栏目按幕布几何阈值出现，焦点被约束在 Close 与链接间，选择 Essays 或 Artists 会更新底页内容再收幕。",
    "capture": "真人打开→Tab/Shift+Tab 验证焦点循环→键盘选择 Essays→再次打开并 Escape→鼠标选择 Artists→最终展开，记录闭合、斜边过渡与完整菜单。",
    "risk": {
      "level": "low",
      "detail": "链接必须随移动边缘逐行出现；closed 时 dialog 应 inert，open 时焦点不可逃逸，选择内容与 aria-current 必须同步。"
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
    "name": "Return-visit reward minesweeper",
    "nameZh": "回访奖励扫雷页脚",
    "category": "pointer",
    "sourceUrl": "https://www.tavus.io/",
    "difference": "Morrow Supply 的真实品牌页脚内嵌一个语义化 4×8 扫雷奖励：揭示、扩散、标旗、失败、通关与奖励解锁都来自真人输入，而非自动播片。",
    "behavior": {
      "trigger": "real click/tap, context flag, touch-friendly flag mode, keyboard grid navigation, or explicit reset",
      "response": "Reveal a deterministic field, flag suspected mines, survive or fail, and unlock a named return-visit reward",
      "timing": "human-owned persistent game state with short interruptible Motion feedback and no seeded autoplay",
      "layer": "full-frame semantic brand footer and 4×8 ARIA grid"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "cell.addEventListener('click',event=>event.isTrusted&&revealCell(index)); board.setAttribute('aria-rowcount','4');",
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
    "rationaleZh": "把小游戏嵌回品牌收束与回访奖励，玩家的判断会真实改变 32 个网格状态并决定奖励是否解锁，因此既保留扫雷机制，也说明它为何出现在页脚。",
    "batch": "A",
    "demo": "Morrow Supply 页脚中的 4×8 扫雷回访奖励；真人揭示会扩散安全区，右键或 Flag mode 标旗，通关解锁 Field Notes wallpaper。",
    "capture": "真人点击安全区→右键与 Flag mode 标旗→完成通关并显示奖励→显式重置→触雷失败→键盘导航、标旗、揭示与 Escape 复位。",
    "risk": {
      "level": "high",
      "detail": "需保持确定性雷区、ARIA 网格、触屏标旗、键盘漫游焦点与静态首帧；禁止把录制脚本变成页面内自动玩家。"
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
    "name": "Held-input room-scene assistant",
    "nameZh": "按住输入的房间场景助手",
    "category": "animation",
    "sourceUrl": "https://github.com/rive-app/rive-wasm",
    "difference": "Hush Home 把 Ready、Listening、Review、Applied 四个 SVG 几何态绑定到真实按住输入、转写审核和显式确认；客厅灯光只有在 Apply scene 后才从中性切到 40% warm。",
    "behavior": {
      "trigger": "real pointer/touch/pen hold-and-release, keyboard Enter/Space hold, explicit Apply, Reset, or Escape",
      "response": "Move a local room command through ready, listening, review, and applied states while withholding the scene consequence until approval",
      "timing": "human-owned finite-state transitions with interruptible Motion feedback and no automatic state cycle",
      "layer": "full-frame SVG state machine, semantic transcript controls, and code-authored room preview"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "svg",
      "snippet": "talk.onpointerdown=e=>e.isTrusted&&transitionTo('listening'); talk.onpointerup=e=>e.isTrusted&&transitionTo('review');",
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
    "rationaleZh": "矢量变形不再自我展示：按住时才监听、松开后只进入审核、确认后房间才变暖，四态几何和真实任务结果形成完整因果链。",
    "batch": "B",
    "demo": "Hush Home 客厅助手：按住说出阅读灯指令，松开得到本地转写，显式 Apply 后才把灯光设置为 40% warm；可随时重录或复位。",
    "capture": "真实鼠标按住/松开→审核→确认→重录与重置；再以 Enter/Space 按住流程完成确认和 Escape 复位，验证中断与键盘等价路径。",
    "risk": {
      "level": "high",
      "detail": "四态转换必须来自受信输入；转写与房间结果不可提前出现，快速重录需取消旧 Motion，且 reduced-motion 仍保持同一语义状态机。"
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
    "name": "Cultural-program full-scene wipe",
    "nameZh": "文化场馆完整场景擦除",
    "category": "transition",
    "sourceUrl": "https://github.com/swup/swup",
    "difference": "Morrow 场馆的日间建筑展与夜间声音演出拥有不同主题、排版方向、文案和 SVG 主视觉；同一条可逆擦除边界按真人请求逐层替换完整页面，而非在相似背景间自动循环。",
    "behavior": {
      "trigger": "real scene-button click/tap or Enter/Space/Arrow/Home/End/L/R keyboard request",
      "response": "Replace day exhibition with tonight's live program through one shared moving boundary, or reverse from the exact interrupted progress",
      "timing": "human-owned reversible 880 ms Motion wipe with four progress-locked controls and no automatic cycle",
      "layer": "full-frame cultural venue pages: theme, typography, content, and code-authored graphic"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "const clip=animate(live,{clipPath:['inset(0 100% 0 0)','inset(0 0% 0 0)']},{autoplay:false}); clip.time=clip.duration*progress;",
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
    "rationaleZh": "机制价值来自一条边界统一替换完整视觉系统：建筑展与现场演出的内容身份足够不同，快速反向又证明它是受真人控制的连续进度，不是两张截图淡入淡出。",
    "batch": "B",
    "demo": "Morrow 文化场馆在 Form & light 日间展览与 Signal in transit 夜间演出之间完整换幕，纸张/午夜主题、左右排版、标题与两套 SVG 图形同步越过边界。",
    "capture": "真人按钮启动并连续反向两次→稳定到夜间页→键盘往返→过渡中两次反向→按钮与键盘各完成一次完整往返，最终回到展览页。",
    "risk": {
      "level": "medium",
      "detail": "两页必须在主题、排版、内容和图形上真实不同；四个 Motion 控件需严格共享同一进度，快速反向不可跳帧，首帧不得自动换幕。"
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
    "name": "Issue-wall extraction and repair",
    "nameZh": "杂志选题墙抽离与修复",
    "category": "transition",
    "sourceUrl": "https://github.com/haltu/muuri",
    "difference": "Afterlight Issue 07 的六张不同层级 story tile 具有真实标题、栏目标记与编辑权重；真人拖出一张后，它进入 holding bay，其余五张依照另一套明确 slot 立即修复版面，返回或键盘重排仍保留语义顺序。",
    "behavior": {
      "trigger": "real pointer/touch drag and release, Arrow-key reorder, Enter/Space extraction, Repack/Reset, or Escape",
      "response": "Extract one editorial story into a holding bay, repair the remaining five-card rhythm, or reorder and return stories while preserving the issue model",
      "timing": "human-owned direct drag followed by interruptible 380 ms measured layout repair; no automatic packing rehearsal",
      "layer": "full-frame semantic magazine issue wall with six unequal DOM tiles"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "const slots=extracted?packedSlots.concat(holdingSlot):initialSlots; cards.map((card,i)=>animate(card,{left:slots[i].left,top:slots[i].top,width:slots[i].width,height:slots[i].height},{duration:.38}));",
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
    "rationaleZh": "不等高卡片不再是编号物理样块，而是一期杂志的真实选题结构；抽离、holding、五卡修复、键盘重排、短拖回弹和复位都通过真人输入与测量位置共同证明。",
    "batch": "B",
    "demo": "Afterlight Magazine Issue 07 的六张 story tile 组成编辑墙；拖出 Night Market 后，五张卡片修复版式，抽出项进入 holding bay，并可返回、重排或复位。",
    "capture": "真实长拖抽离与短拖 snap-back，按钮两次返回，Arrow 键三次重排，Enter/Space 两次键盘抽离，Reset 与 Escape 双次恢复原始节奏。",
    "risk": {
      "level": "medium",
      "detail": "录制必须派发可信 pointer drag；六张语义卡片需始终留在 packing field 内且静止态不重叠，快速复位要取消旧布局动画而不跳闪。"
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
    "name": "Velocity-aware cycle-route drawer",
    "nameZh": "速度感知骑行路线抽屉",
    "category": "transition",
    "sourceUrl": "https://github.com/emilkowalski/vaul",
    "difference": "抽屉跟手、根据释放速度跨越吸附点并让背景同步缩放；与菜单帘幕的离散开合不同。",
    "behavior": {
      "trigger": "trusted mouse/touch drag and release, route-details buttons, or slider keyboard controls",
      "response": "Follow the gesture on a responsive side/bottom axis, resolve real release velocity into route preview, summary, or full-route snaps, and start live guidance from the complete state",
      "timing": "gesture-continuous tracking followed by interruptible 460 ms settling; reduced motion lands directly",
      "layer": "full route map with desktop side drawer, compact bottom drawer, overlay, and live-guidance result"
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
    "rationaleZh": "把抽象吸附演示变成低车流骑行路线：慢拉、快甩和键盘分别到达有意义的预览、摘要、完整路线，只有完整路线才能启动导航。",
    "batch": "B",
    "demo": "Wayfinder 低车流骑行地图包含 6.8 km 路线、ETA、爬升与三步指引；抽屉在宽屏为横向侧栏、紧凑预览为纵向底栏，真实释放速度决定三个语义 snap。",
    "capture": "真实慢拖到路线摘要、键盘 End 到完整路线并启动导航，再快甩关闭、按钮打开、键盘退回摘要、快甩全开并显式关闭；断言可信事件、速度带、目标 snap、指针释放与导航结果。",
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
    "name": "Harbor review spatial deck",
    "nameZh": "港湾评审空间演示文稿",
    "category": "transition",
    "sourceUrl": "https://github.com/hakimel/reveal.js",
    "difference": "Harbor 07 气候适应评审把 Brief→Site→Proposal→Decision 横向主线与 Tidal risk、Public access 纵向证据分支组织成真实二维拓扑；总览、地图和滑动都操作同一六页空间。",
    "behavior": {
      "trigger": "real direction/map/overview click, pointer/touch swipe, Arrow navigation, O/Escape overview, or overview-card activation",
      "response": "Traverse a six-page climate-review graph, descend into tidal/access evidence, or zoom out to select any card from the full topology",
      "timing": "human-owned interruptible 480 ms spatial transitions with static first frame and no automatic path",
      "layer": "full-frame review deck, persistent topology map, and generated site-evidence photograph"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "const target=coordinateIndex.get(`${x},${y}`); animate(slide,{x:dx*w*.76,y:dy*h*.78,scale,rotateZ,opacity},{duration:.48});",
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
    "rationaleZh": "二维关系不再停留在卡片摆放：同一张港湾实地证据图在场地、潮位与公共通行页承担不同分析任务，持续可见的拓扑和总览让用户理解自己为何横移或下潜。",
    "batch": "B",
    "demo": "Harbor 07 港湾适应决策评审：六页横纵拓扑、常驻路线图和 Overview；生成的 1440×960 港湾照片在 Site、Tidal risk、Public access 中分别承载场地、水位与通行证据。",
    "capture": "按钮进入 Site/Risk→键盘下潜 Access 并返回→Overview 选择 Proposal→地图跳转 Access→真实拖拽回 Risk→快速键盘推进 Decision→最终 Overview。",
    "risk": {
      "level": "medium",
      "detail": "六个坐标、方向禁用态与总览焦点必须一致；生成照片需作为分析证据而非装饰，快速导航要取消旧 Motion，且页面不得自动巡航。"
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
    "name": "Apartment view-corridor depth inspection",
    "nameZh": "住宅视廊多层景深审查",
    "category": "pointer",
    "sourceUrl": "https://github.com/wagerfield/parallax",
    "difference": "前景、主体、远景按深度系数独立位移；现有卡片倾斜高光让一个平面整体旋转。",
    "behavior": {
      "trigger": "trusted mouse hover, captured touch/pen drag, Arrow keys, 1/2/3, or explicit viewpoint buttons",
      "response": "Move four ordered apartment-view planes at distinct depth coefficients while the live verdict changes among tower overlap, partial screening, and a clear harbor corridor",
      "timing": "direct human-input response with no automatic path; Home, Escape, R, or pointer exit restores the centered still inspection",
      "layer": "full-bleed apartment balcony, neighboring tower, harbor landmark, and atmosphere planes"
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
    "rationaleZh": "把抽象视差变成可作决策的住宅看房视廊审查：前景、遮挡建筑、港湾地标与天空按真实层差移动，观察位置直接改变可见性结论。",
    "batch": "B",
    "demo": "原创全屏 North Wharf 18C 看房界面含天空、港湾与桥、Tower 07 遮挡层及阳台前景；鼠标、触控/笔拖拽、方向键与视点按钮真实驱动四层景深和视廊判定。",
    "capture": "真实点击左右视点、键盘微调与 1/2/3 选点，再执行鼠标悬停和捕获拖拽，最后用 Home 显式归中；断言所有输入可信、无自动路径、四层系数有序且终态静止。",
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
    "name": "Fresh-formula gooey blend action",
    "nameZh": "鲜配精华黏液融合按钮",
    "category": "vector",
    "sourceUrl": "https://github.com/codrops/GooeyTextHoverEffect",
    "difference": "液滴聚合为字再散开；当前标题擦写使用移动圆点，曲线传送带移动完整字形。",
    "behavior": {
      "trigger": "trusted hover, focus, pointer press, click/tap, Enter/Space, or Escape",
      "response": "Merge four ingredient droplets into the BLEND word through a live SVG goo filter, then persist ADDED and regimen state only after explicit confirmation",
      "timing": "reversible idle-to-engaged material fusion with a persistent added result and interruptible Motion transitions",
      "layer": "full product-formulation CTA and formula-status surface"
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
    "rationaleZh": "把黏液字形从孤立滤镜样例变成鲜配精华的真实操作：成分液滴先因悬停或聚焦汇入 BLEND，再由明确确认转成持久 ADDED 与方案状态。",
    "batch": "B",
    "demo": "Alba Lab Hydra 02 配方界面以真实 SVG blur、alpha threshold 与 blend 让四枚成分液滴汇入 BLEND；点击、触控或键盘确认后同步 ADDED、regimen 数量和配方状态。",
    "capture": "真实 hover 预览融合、鼠标确认并移出证明状态持久，再用键盘 Focus/Enter/Escape 完成增删，最后鼠标再次增删并离开恢复 idle；断言所有转换来自可信输入且没有自动 morph。",
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
    "name": "Architectural refraction QA probe",
    "nameZh": "建筑渲染折射质检探针",
    "category": "canvas",
    "sourceUrl": "https://github.com/pixijs/pixijs",
    "difference": "单张图像被移动位移场持续推开并衰减；现有位移图悬停在两张图之间切换。",
    "behavior": {
      "trigger": "trusted pointer hover, captured touch/pen drag, keyboard movement/pulse, or facade/pool/horizon sample controls",
      "response": "Displace the submitted architectural texture around the chosen straight-line reference, expose the estimated offset, and preserve the exact probe origin while the shader recovers",
      "timing": "input-started expanding front with 1.65 s elastic recovery; reduced motion holds a lower-strength static sample until reset",
      "layer": "full-bleed regl texture, fixed QA frame, live probe ring, deviation readout, and sampling controls"
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
    "rationaleZh": "把图片涟漪变成建筑渲染折射质检：窗框、池底网格和海平线提供可观察的直线证据，真人采样直接生成偏移并回稳。",
    "batch": "B",
    "demo": "海岸建筑提交图被真实 regl fragment shader 采样；Facade、Pool grid、Horizon、鼠标/触控拖拽与键盘探针在对应直线附近产生可读 UV 折射、偏移读数和弹性恢复。",
    "capture": "真实点击 Facade、指针经过池面与海平线并等待完整恢复，再执行捕获拖拽、方向键、P、Horizon、Enter、Pool 和显式 Reset；断言可信输入、真实本地纹理、WebGL 参数、恢复完成与静止终态。",
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
    "name": "Image-backed festival poster review table",
    "nameZh": "图像驱动的艺术节海报评审桌",
    "category": "canvas",
    "sourceUrl": "https://github.com/liabru/matter-js",
    "difference": "四张原创图像海报以定向矩形 SAT 发生位置修正、线性/摩擦/角冲量和墙面反弹，并能被真人甩入评审区。",
    "behavior": {
      "trigger": "trusted pointer drag/release, keyboard impulses, or explicit selection controls",
      "response": "Grab, push, throw, collide, rotate, and shortlist one image-backed festival poster",
      "timing": "static first frame; input-started requestAnimationFrame simulation with capped delta and three collision substeps",
      "layer": "full-bleed p5 Canvas table, four image-textured rigid bodies, review lane, and shortlist controls"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "const hit = collisionBetween(a,b); if (hit) resolveCollision(a,b,draggedBody);",
      "referenceUrl": "https://github.com/liabru/matter-js"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 19,
      "clarity": 16,
      "inspiration": 15,
      "evidence": 9,
      "total": 96
    },
    "rationaleZh": "四种完全不同的原创海报让抓取、层级、碰撞和 shortlist 选择都有可辨对象；真实 SAT 与冲量则让投掷结果来自操作而非预演。",
    "batch": "B",
    "demo": "虚构艺术节的四张 ImageGen 海报在 p5 Canvas 评审桌上形成真实刚体堆；用户可用鼠标/触控/笔抓取甩投并推动其他海报，也可用键盘施加位移/角冲量或直接送入 review lane。",
    "capture": "真实按钮选择与 Review、键盘选片/位移/角冲量/Enter、显式 Reset，再捕获鼠标把顶层海报甩入 review lane，等待碰撞衰减后以控制按钮确认最终 shortlist。",
    "risk": {
      "level": "medium",
      "detail": "必须使用本地解码图片和真实碰撞响应；固定初始姿态，禁止自动路径、合成事件或捕获时钟驱动。"
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
    "name": "Generative corolla sleeve director",
    "nameZh": "生成式花冠唱片封套导演",
    "category": "canvas",
    "sourceUrl": "https://github.com/williamngan/pts",
    "difference": "3,600 个确定性点构成七瓣、四色花冠；用户定向局部生长并锁定唱片封套，而不是观看自动粒子循环。",
    "behavior": {
      "trigger": "trusted pointer, touch, pen, keyboard, parameter, and lock controls",
      "response": "Move a local growth focus, tune point density and petal tension, then explicitly lock the sleeve master",
      "timing": "event-driven redraw with a static first frame; reduced motion quantizes focus to discrete steps",
      "layer": "full-bleed p5 point field, art-direction controls, focus probe, and locked-result stamp"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "p.noLoop(); blueprints.forEach(point => drawDeterministicPetalPoint(point, state.focus, state.density, state.tension));",
      "referenceUrl": "https://github.com/williamngan/pts"
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
    "rationaleZh": "把装饰性自动生长改为唱片封套定稿任务：真人输入直接改变点密度、花瓣张力和局部生长，Lock 产生清楚的完成结果。",
    "batch": "B",
    "demo": "Numa Records 的 3,600 点花冠以七瓣四色确定性几何填满舞台；鼠标、触控、笔或方向键放置局部生长焦点，Density/Tension 调整结构，Lock sleeve 固化封套结果。",
    "capture": "真实鼠标移动与捕获拖拽定位生长焦点，按钮和键盘修改 Density/Tension，执行 Lock→Unlock→Reset 后重新定向并显式 Lock；断言所有变化均由可信输入触发。",
    "risk": {
      "level": "medium",
      "detail": "必须保留固定点蓝图、静止首帧和输入驱动重绘；连续自动 phase 或捕获时钟变更均不合格。"
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
    "name": "Stage haze colour lab",
    "nameZh": "舞台烟雾配色实验室",
    "category": "webgl",
    "sourceUrl": "https://github.com/PavelDoGreat/WebGL-Fluid-Simulation",
    "difference": "真人拖拽把速度、压力和三种灯光 gel 染料注入真实双 FBO 流场，并能暂停评估、保存配色和清场重做。",
    "behavior": {
      "trigger": "trusted mouse/touch/pen drag, keyboard injector, gel controls, and explicit pause/save/clear",
      "response": "Inject velocity and cyan/rose/amber dye, evaluate the dissipating mix, then save or clear the lighting look",
      "timing": "static first frame; simulation advances only for queued human splats and their finite dissipating consequence",
      "layer": "full-bleed regl canvas, velocity/dye/pressure/divergence framebuffers, injector reticle, and colour-review controls"
    },
    "implementation": {
      "projectId": "regl-project-regl",
      "projectUrl": "https://github.com/regl-project/regl",
      "library": "regl@2.1.1",
      "renderer": "webgl",
      "snippet": "advectVelocity(); computeDivergence(); for(let i=0;i<9;i++) solvePressure(); subtractPressure(); advectDye();",
      "referenceUrl": "https://github.com/PavelDoGreat/WebGL-Fluid-Simulation"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 99
    },
    "rationaleZh": "把流体炫技变成舞台烟雾配色任务：拖拽速度与压力进入真实流体管线，混色状态、暂停评估和 Save Look 让结果可使用。",
    "batch": "B",
    "demo": "Stage Haze Colour Lab 使用 regl 的 velocity/dye ping-pong、divergence、九次 pressure Jacobi、pressure-gradient 校正和耗散；真人注入 CYAN/ROSE/AMBER，Pause/Resume 评估并 Save Look。",
    "capture": "真实鼠标双向拖拽注入 CYAN 与 ROSE，显式 Pause/Resume；方向键移动键盘 injector、3 选择 AMBER、Space 注入，随后 Save Look 并以 Clear 返回静止空场，断言全程无自动路径。",
    "risk": {
      "level": "high",
      "detail": "必须保留真实 framebuffer 流体管线和可信输入账本；自动 splat、自动路径、CSS 烟雾或 preview-clock 注入均不合格。"
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
    "name": "Bounded colony relationship sandbox",
    "nameZh": "有界群落关系实验沙盘",
    "category": "canvas",
    "sourceUrl": "https://github.com/hunar4321/particle-life",
    "difference": "把 216 个粒子的群落涌现变成一次可复现的关系实验：真人选择互惠、领地或循环追逐矩阵，指定干预种群与 24/72/144 步预算，再把引导信标放进生态场并读取混合度和凝聚度。",
    "behavior": {
      "trigger": "trusted mouse/touch/pen intervention, keyboard experiment controls, and explicit rule/species/step/run/reset controls",
      "response": "Run a bounded fixed-seed population experiment under one of three real attraction-repulsion matrices and report its outcome",
      "timing": "static first frame; simulation advances only for an explicit 24, 72, or 144-step human-requested run",
      "layer": "full-preview p5 Canvas field, matrix legend, intervention beacon, experiment controls, and outcome metrics"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "for (const a of agents) for (const b of agents) applyMatrixForce(a, b, rules[state.rule].matrix[a.species][b.species]);",
      "referenceUrl": "https://github.com/hunar4321/particle-life"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 98
    },
    "rationaleZh": "把抽象粒子生命改造成有输入、有边界、有结果的系统实验：用户决定关系矩阵、对象、干预位置与运算预算，最后用混合度、凝聚度和观察结论解释涌现，而不是观看无尽屏保。",
    "batch": "B",
    "demo": "Bounded Colony Relationship Sandbox 用 p5 绘制三组各 72 个固定种子粒子；互惠、领地和循环追逐三套矩阵真实进入成对受力计算，真人放置某一种群的引导信标并显式运行有限步数。",
    "capture": "从静止首帧开始，真人选择 Cyclic pursuit、Pollinators 与 24 steps，拖拽信标后运行；再用键盘换规则、移动信标、单步并重置，最后重复一轮有界实验并保留可读观察结果。",
    "risk": {
      "level": "high",
      "detail": "必须保留固定种子、真实关系矩阵、环形边界、可信输入账本和显式有限步数；自动循环、合成事件、预览时钟推进或只画预制轨迹均不合格。"
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
    "name": "Incident review card stack",
    "nameZh": "事故复盘卡片堆栈",
    "category": "scroll",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollStack-TS-TW.json",
    "difference": "把 sticky 堆叠变成一份 47 分钟结账故障的连续复盘：Signal、Scope、Cause、Response 四章会按真实阅读进度压入可见历史，当前发现与最终防护结果同步更新。",
    "behavior": {
      "trigger": "trusted wheel, captured mouse/touch/pen drag, keyboard navigation, chapter controls, or explicit restart",
      "response": "Scrub four incident chapters through a real sticky stack while preserving compressed read-history and updating the current finding",
      "timing": "static first frame; nine paused Motion controls are synchronously scrubbed by one human-owned progress value",
      "layer": "full-preview incident dossier, sticky chapter stack, progress rail, navigation, finding summary, and completion state"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "cardMotion[index].time = clamp(progress * 3 - index) * cardMotion[index].duration;",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollStack-TS-TW.json"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 99
    },
    "rationaleZh": "连续故障叙事给堆叠历史一个必要的产品理由：读过的章节保留为被压缩的证据层，当前章节保持可读，完成态则把四张卡收束为三项已落地防护。",
    "batch": "B",
    "demo": "Incident Review Card Stack 使用四张真实 CSS sticky 章节卡和九个 autoplay:false 的 Motion 控制器；滚轮、拖拽、键盘或章节按钮都写入同一个 progress，再把对应时间同步到压缩、详情淡出与进度条。",
    "capture": "从静止 Signal 开始，先验证起点外滚释放，再用滚轮累积、鼠标捕获拖拽、章节按钮和键盘前后检查；显式 Restart 后跳到 Cause，再以 End 完成 Response 并验证终点外滚释放。",
    "risk": {
      "level": "high",
      "detail": "必须保留真实 sticky 布局、paused Motion scrub、可信输入账本和两端 outward-wheel release；自动进度、合成滚轮或伪造卡片截图均不合格。"
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
    "name": "Metrobrief arrival velocity board",
    "nameZh": "Metrobrief 到站速度浏览板",
    "category": "scroll",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollVelocity-TS-TW.json",
    "difference": "把 marquee 攢成实时到站信息浏览：滚轮距离/时间与捕获拖拽位移/时间被测成带符号 px/s，直接决定 M4 到站卡轨的速度、方向、倾斜与状态读数，并在输入后自然阻尼停下。",
    "behavior": {
      "trigger": "trusted wheel velocity, captured mouse/touch/pen drag velocity, keyboard signed impulse, or explicit reset",
      "response": "Accelerate, reverse, and settle a seamless real-time arrival rail from measured signed human velocity",
      "timing": "static first frame; direct input sets velocity and a finite input-owned exponential decay carries it to rest",
      "layer": "full-preview transit briefing, duplicated seamless arrival-card rail, direction banner, live px/s meter, and speed classification"
    },
    "implementation": {
      "projectId": "motiondivision-motion",
      "projectUrl": "https://github.com/motiondivision/motion",
      "library": "motion@12.42.2",
      "renderer": "dom",
      "snippet": "state.offset += state.velocity * dt; state.velocity *= Math.exp(-DAMPING * dt); motion.time = modulo(-state.offset, segmentWidth) / segmentWidth;",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollVelocity-TS-TW.json"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 99
    },
    "rationaleZh": "到站卡让速度变化承担真实浏览任务：慢动便于逐条扫描，快速输入用于跨越多班次，反向输入立即翻转方向；实时 px/s、输入来源和速度等级把原本隐形的机制公开给用户。",
    "batch": "B",
    "demo": "Metrobrief Arrival Velocity Board 用一个 paused Motion transform 控制无缝双段到站卡轨；滚轮与拖拽真实测量带符号速度，键盘给予固定正负冲量，真人输入后的指数阻尼把轨道带回静止。",
    "capture": "从完全静止的到站板开始，用慢/快滚轮验证速度等级并反向；再用两次相反方向的捕获拖拽和两次键盘冲量制造多次方向反转，最后分别用键盘与按钮 Reset 回到精确原点。",
    "risk": {
      "level": "high",
      "detail": "必须保留真实距离/时间测速、正负样本、pointer capture、输入后有限阻尼与无缝 modulo 边界；恒速自动循环、合成事件或仅按方向切 class 均不合格。"
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
    "name": "Human-scrubbed field-note conclusion",
    "nameZh": "真人擦洗的现场报告结论",
    "category": "scroll",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ScrollReveal-TS-TW.json",
    "difference": "真人滚轮、拖拽或键盘把阅读进度直接映射到 12 个词的 opacity、blur 与 rotation，并保留所选阅读位置；不是自动往返文字滤镜。",
    "behavior": {
      "trigger": "trusted wheel, captured pointer drag, or keyboard reading progress",
      "response": "Resolve a field-note conclusion from blur and rotation in authored reading order",
      "timing": "continuous human-owned scrub with a retained 100% conclusion",
      "layer": "full-stage three-chapter report reader and paragraph typography"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "三章阅读参照、可见百分比、严格逐词顺序和稳定保留的结论，把滤镜演示变成真人控制的报告阅读任务。",
    "batch": "B",
    "demo": "在 Field Note 04 的 Signal、Route、Decision 三章中，真人推进阅读位置，让 12 个词按固定顺序从倾斜雾字落成清晰结论，并在 100% 持续保留。",
    "capture": "首帧静止→八次可信滚轮分段推进至 100%→停留在 03 · DECISION 与 Conclusion clear；拖拽和键盘提供等价路径。",
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
    "name": "Semantic field-dispatch pixel dissolve",
    "nameZh": "语义野外日志像素消解",
    "category": "transition",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTransition-TS-TW.json",
    "difference": "一条量化的 p5 像素边界在两棵完整、可访问的 DOM 内容树之间推进：标题、观测数据、现场说明、图像与主题一起更换；不是在同一张渐变卡上盖 mosaic filter。",
    "behavior": {
      "trigger": "trusted captured mouse/touch/pen drag, toggle button, or keyboard command",
      "response": "Move one stepped pixel boundary between the North Atlantic tidal dispatch and South Basin dune-array dispatch, replacing the complete semantic tree",
      "timing": "direct drag scrub or finite input-owned settle/cancel",
      "layer": "full-stage paired DOM trees + p5 image-sampled pixel band"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "targetTree.style.clipPath = steppedBoundary(progress); drawWave(sample(sourceImage, targetImage, cell, progress));",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTransition-TS-TW.json"
    },
    "scores": {
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "北大西洋潮汐实验室与南部盆地沙丘阵列拥有不同标题、主题、布局、三组观测数据和原创现场图；拖拽时阶梯 clip 边界与 p5 采样像素带共同替换整棵语义树，完成、取消、打断和反向切换都能从可信输入与状态计数核验。首帧静止且无自动循环、播放、fallback、合成输入或录制时钟驱动。",
    "batch": "B",
    "demo": "在 Latitude Journal 的两份野外日志间切换：潮汐站记录海况、盐度与周期，沙丘阵列记录表温、风速与电量；真人可拖住像素边界检查中间态，也可用按钮或键盘完整切换并返回。",
    "capture": "首帧静止→按钮切到 Dune array→键盘 Home 返回→一次短拖取消→一次长拖完成→方向键分步推进→再次按钮切换；断言两棵完整 DOM 语义树、两张 960×640 原创图的字节/SHA/像素采样、真实 pointer capture、p5 像素带、完成/取消/打断和严格可信输入。",
    "risk": {
      "level": "high",
      "detail": "参考源码许可未明；本地实现必须保留真实分格传播与两棵独立语义树，不可退化为 CSS mosaic filter、同内容换色或开屏自动往返。原创现场图是虚构地点，必须保留资产披露。"
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
    "name": "Human-opened field atlas bubble navigation",
    "nameZh": "真人打开的野外图鉴气泡导航",
    "category": "transition",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/BubbleMenu-TS-TW.json",
    "difference": "真人把 56px 紧凑气泡有限扩张为可操作的 Story、Field Log、Visit 信息架构，并让章节选择跨关闭持续保留；不是自动气泡装饰或 clip 帘幕。",
    "behavior": {
      "trigger": "trusted click, tap, Enter/Space, Escape, or link activation",
      "response": "Morph a compact field-atlas bubble into a structured, operable navigation surface and retain the chosen section",
      "timing": "finite 580ms human-owned open/close morph",
      "layer": "full-stage immersive field story and responsive navigation overlay"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "紧凑锚点、响应式信息架构、可操作链接和跨关闭保留的章节选择，让形状变形同时完成真实导航任务。",
    "batch": "B",
    "demo": "在 Field Atlas 沉浸式详情页中，真人把右下 56px 气泡打开为 Story、Field Log、Visit 三栏导航，选择 Field Log 后关闭并重开，选择仍被明确保留。",
    "capture": "首帧静止→点击打开→选择 Field Log→点击关闭→再次打开→停留在 FIELD LOG · SELECTED；键盘 Enter/Space 与 Escape 提供等价路径。",
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
    "name": "Distance-weighted design tool dock",
    "nameZh": "距离加权设计工具坞",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/Dock-TS-TW.json",
    "difference": "真人指针距离或键盘焦点连续分配目标工具与邻项尺度，显式选择后工具状态持续保留；不是自动巡航、整体卡片 tilt 或单目标 hover scale。",
    "behavior": {
      "trigger": "trusted pointer proximity or keyboard focus, followed by explicit activation",
      "response": "Magnify the nearest SVG tool, distribute scale to its neighbors, and retain the chosen tool",
      "timing": "continuous human-owned proximity preview plus finite selection",
      "layer": "full-stage design workspace and five-tool navigation dock"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "真实设计工具、连续距离加权、邻项分布和可留存选择，把抽象放大波转化为可完成的工具切换任务。",
    "batch": "B",
    "demo": "在 Form Studio 画布中扫过 Select、Pen、Shape、Type、Comment 五枚一致的 24px SVG 工具；目标与邻项按实测距离形成连续尺度波，点击 Type 后继续扫过 Shape 也会保留 Type 的工作状态。",
    "capture": "pointer 依次扫过五枚工具→点击 Type→继续靠近 Comment 与 Shape→保留 TYPE · ACTIVE；键盘 focus、方向键与 Enter/Space 提供等价路径。",
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
    "name": "Human-routed NORTH/COMMON editorial index",
    "nameZh": "真人导航的 NORTH/COMMON 编辑索引",
    "category": "transition",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/StaggeredMenu-TS-TW.json",
    "difference": "真人打开 NORTH/COMMON Issue 08 索引，三层底板与四条真实栏目链接依次进入；选择 Field Notes 后，页面结果必须等反向退场完成才提交并保留，不是自动菜单排练。",
    "behavior": {
      "trigger": "trusted click/tap or keyboard toggle, navigation and link selection",
      "response": "Sweep three full-stage underplates and four editorial links in, then reverse the stack before committing the selected section",
      "timing": "human-started 880ms finite open and reverse-close transactions",
      "layer": "full-stage NORTH/COMMON issue page, editorial cover and navigation index"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "明确的独立杂志身份、真实栏目信息架构、三层覆盖和延迟到退场完成后的内容提交，让 stagger 编排同时讲清导航事务。",
    "batch": "B",
    "demo": "在 NORTH/COMMON Issue 08 / Fieldwork 页面中，真人打开三层编辑索引，选择 Field Notes；菜单反向完全退出后才把页面提交为可阅读的 Field Notes 结果。",
    "capture": "首帧静止→点击打开→三层底板与四条链接依次进入→点击 Field Notes→反向退场→停留在 FIELD NOTES · READY；键盘与 Escape 提供等价选择/撤回路径。",
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
    "name": "Release-velocity rental discovery stack",
    "nameZh": "释放速度驱动的房源发现卡组",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/Stack-TS-TW.json",
    "difference": "真人拖拽的真实释放速度决定前卡是慢放回落并记录 HELD，还是快速甩出并让下一房源接管顶层；两个决策都被保留，不是自动投掷或固定演示路径。",
    "behavior": {
      "trigger": "trusted captured pointer drag/release or keyboard hold/pass command",
      "response": "Settle Cedar Cove in place after a slow release or pass it right and transfer focus to Atlas Loft after a fast release",
      "timing": "measured release velocity plus finite 620ms-or-shorter Motion settlement",
      "layer": "full-stage Habitat rental discovery stack and retained decision history"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "慢放与快甩产生可见的不同落点、房源身份与卡序接管结果；原创三联房源图的三个像素裁切也被运行时采样为不同卡片身份。",
    "batch": "B",
    "demo": "在 Habitat 房源发现卡组中，真人先慢放 Cedar Cove 使其回落并记录 HELD，再快速向右甩出，使 Atlas Loft 接管顶层并保留 PASSED 决策。",
    "capture": "首帧静止→慢拖并释放→等待 HELD 回落→再次拖拽并快速甩出→等待 Atlas Loft 接管→保留两条决策历史；键盘提供等价路径。",
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
    "name": "Metaball product-finish target cursor",
    "nameZh": "融球产品材质目标光标",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/BlobCursor-TS-TW.json",
    "difference": "真人在三个真实材质目标间移动时，SVG blur/threshold 液态场按目标距离形成融合与拉伸桥；可信点击或键盘激活再以有限 Motion 过渡锁定并保留产品材质。",
    "behavior": {
      "trigger": "trusted pointer targeting/click or keyboard focus, arrows, Enter and Space",
      "response": "Bridge the liquid cursor to Cobalt, Moss, or Coral and commit the chosen lamp finish",
      "timing": "finite target travel plus 620ms retained selection transition",
      "layer": "full-stage product configurator and SVG metaball target field"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "三个真实材质目标把液态融合变成可用选择反馈；SVG 滤镜、实测目标几何与 Motion 共同证明融合/拉伸，锁定 Coral 后结果稳定保留且不存在自动路径。",
    "batch": "B",
    "demo": "一张灯具材质配置页，液态光标在 Cobalt、Moss、Coral 目标间形成桥接，并由真人锁定最终表面。",
    "capture": "真人依次 hover 三个材质目标，观察融合与拉伸，再点击 Coral 并保留 Locked 结果。",
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
    "name": "Field Edit visual-memory trace",
    "nameZh": "Field Edit 视觉记忆轨迹",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ImageTrail-TS-TW.json",
    "difference": "真人按压拖拽的真实位移与事件时间共同决定采样速度：慢扫形成密集参考，快扫拉开图卡间距；不是自动路径、光标粒子或固定间距 rail。",
    "behavior": {
      "trigger": "trusted captured mouse/touch/pen drag, keyboard trace, frame selection, or explicit reset",
      "response": "Accumulate real travel distance, map measured px/s to a responsive spawn gap, and interpolate decoded photographic cards onto the owned path",
      "timing": "human-paced direct sampling with a static first frame and no automatic path, playback, fallback, synthetic input, or preview-clock mutation",
      "layer": "full-stage p5 editorial image-review canvas"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "sampleMotion(previous, next, event.timeStamp) measures dx/dt, maps speed to a spawn gap, then interpolates decoded frames at each crossed distance threshold.",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/ImageTrail-TS-TW.json"
    },
    "scores": {
      "creativity": 20,
      "artDirection": 20,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 99
    },
    "rationaleZh": "四张统一的海岸勘察影像把速度间距变成可读的视觉记忆采样；实时 px/s、gap 与每卡间距标注让机制无需说明也能被验证。",
    "batch": "B",
    "demo": "在 Field Edit 海岸现场选定起始镜头，按压拖过全幅画面；慢速保留密集参照，快速手势留下更大的视觉间隔，方向键提供等价轨迹输入。",
    "capture": "从零输入静止态开始，真人选择起始镜头，完成一段慢拖与一段快拖并 Reset；再用方向键和第二次捕获拖拽生成最终十帧记忆轨迹，断言速度区间、间距差、素材 decode/checksum 与严格可信输入。",
    "risk": {
      "level": "high",
      "detail": "参考源码许可未明；本地实现必须保留真实速度测量、固定且可追溯的原创图片资产、严格可信输入和无自动路径证据。"
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
    "name": "Human-routed gooey signal matrix",
    "nameZh": "真人绘制的黏性信号矩阵",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/PixelTrail-TS-TW.json",
    "difference": "真人在 24×14 量化矩阵中绘制安全路径，邻近命中形成可核验的黏性桥，瞬态热度有限衰减而命中单元保留；不是自动轨迹或清空后无任务结论的屏保。",
    "behavior": {
      "trigger": "trusted captured mouse/touch/pen drag or keyboard arrows; Home resets",
      "response": "Mark quantized cells, fuse adjacent hits into a gooey bridge, and lock Route 04 after twelve retained cells",
      "timing": "direct human marking plus finite .72-per-frame glow decay; retained route waits for the next input",
      "layer": "full-stage p5 signal-routing matrix with task, coverage, and retained result"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "24×14 代码原生网格将尾流变成可完成的 Route 04 安全路径；真人命中、邻格融合、有限热度衰减与十二格稳定保留均可独立审计，无自动轨迹。",
    "batch": "B",
    "demo": "Lattice Route 04 让操作员在信号矩阵中绘制至少十二格安全路径，瞬态光晕衰减后路径仍锁定可复核。",
    "capture": "真人拖拽横穿矩阵，记录黏性桥和有限衰减，最终保留 12+ 格的 Route 04 Locked 结果。",
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
    "name": "Human-confirmed pixel-evidenced defect reticle",
    "nameZh": "真人确认的像素证据缺陷准星",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/TargetCursor-TS-TW.json",
    "difference": "真人 proximity 或键盘焦点让 Motion 弹簧准星吸附到真实工业面板的三个像素坐标缺陷，显式确认后留下可撤销、可重选的审阅 pin；不是自动巡航圆形 A/B/C。",
    "behavior": {
      "trigger": "trusted pointer proximity, keyboard focus/navigation, explicit confirmation or Undo",
      "response": "Spring the reticle to corrosion, crack or damaged-fastener pixels and retain a reviewable defect annotation",
      "timing": "finite human-owned spring acquisition plus explicit retained confirmation",
      "layer": "full-stage industrial inspection image, DOM targets, reticle and review annotation"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "真实面板像素、三个语义缺陷坐标、实测距离、有限弹簧、确认/撤销/重选历史，共同把准星变成可审阅的工业巡检任务。",
    "batch": "B",
    "demo": "巡检员在石墨复合面板中依次吸附并确认 CRK-04 与 COR-17，撤销后通过键盘选择 FST-09，最后保留 VERIFIED · FST-09 审阅标注。",
    "capture": "首帧静止→hover/确认 CRK-04→hover/确认 COR-17→Undo→键盘 End 定位 FST-09→Enter 确认→停留在可审阅 pin。",
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
    "name": "Human-confirmed cell-distance diagnostic",
    "nameZh": "真人确认的单元格距离诊断",
    "category": "pointer",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/CursorGrid-TS-TW.json",
    "difference": "真人 proximity 连续采样确定性距离场，只有显式点击或键盘确认才产生一次有限脉冲并提交 H4 密度漂移结论；不是自动轨迹、自动 pulse 或无任务的网格形变。",
    "behavior": {
      "trigger": "trusted mouse/touch/pen proximity plus explicit pointer or keyboard confirmation",
      "response": "Continuously sample the distance field, identify H4, and retain one confirmed density-drift diagnostic",
      "timing": "direct proximity modulation plus one 720ms finite confirmation pulse",
      "layer": "full-stage p5 Relay 07 diagnostic matrix and retained conclusion"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "Relay 07 把 proximity 与 click pulse 分成“扫描”和“确认”两种职责；H4 的距离采样、有限脉冲与稳定诊断结论都有可信输入和运行证据。",
    "batch": "B",
    "demo": "一张 Relay 07 密度审计矩阵，操作员先以距离场定位异常，再显式确认 H4 并保留诊断结果。",
    "capture": "真人从远处扫描到 H4，点击确认，录下单次有限脉冲及最终 Cell H4 Confirmed 状态。",
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
    "name": "FBL-06 field beacon exploded inspection",
    "nameZh": "FBL-06 应急灯爆炸装配检查",
    "category": "webgl",
    "sourceUrl": "https://github.com/mrdoob/three.js",
    "difference": "真人进度把一台 FBL-06 便携应急灯的七个有名零件沿严格 X 轴装配顺序分离；玄武岩复合材料像素真实贴到电源壳与维修扣，而不是把无意义方块自动散开或移动相机。",
    "behavior": {
      "trigger": "trusted range, captured mouse/touch/pen scrub, keyboard command, part control, or reset",
      "response": "Separate seven semantic parts along their authored assembly vectors, stop at any service depth, and identify the inspected component",
      "timing": "human-paced direct reversible structural mapping with no automatic rehearsal",
      "layer": "full-stage p5 WebGL service assembly"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "webgl",
      "snippet": "parts.forEach(part => { p.push(); p.translate(part.assembledX + part.explodeX * humanProgress, 0, 0); drawSemanticPart(p, part); p.pop(); });",
      "referenceUrl": "https://github.com/mrdoob/three.js"
    },
    "scores": {
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "七个零件拥有唯一身份、顺序、装配轴、端点和实时位置证据；原创 ImageGen 复合材料纹理同源 fetch、SHA-256、16,384 像素采样后复制为 p5.Image，并真实用于两个语义部件。Range、捕获拖拽、键盘、零件按钮和 Reset 全由可信真人输入拥有，首帧完整装配且无 autoplay、rehearsal、fallback、合成输入或预览时钟变更。",
    "batch": "C",
    "demo": "FBL-06 便携应急灯由七个有名 WebGL 零件构成；真人可在完整装配、任意维修间距和完全拆解之间停留，并选择具体部件检查。",
    "capture": "首帧保持完整装配；真人捕获拖拽至中间态，检查第 06 号电源壳，再用 Range 到达 100%，最后 Reset 回到 0%。",
    "risk": {
      "level": "medium",
      "detail": "七个部件的身份、顺序、X± 轴、端点与纹理映射必须保持一致；纹理不能退化为 UI 背景，进度不能由录制时钟自动驱动。"
    },
    "observedImplementation": {
      "projectId": "processing-p5-js",
      "library": "p5@2.3.0",
      "renderer": "WebGL",
      "snippet": "p.texture(materialTexture); p.box(shellWidth, shellHeight, shellDepth);",
      "projectUrl": "https://github.com/processing/p5.js",
      "referenceUrl": "https://github.com/mrdoob/three.js"
    }
  },
  {
    "id": "collision-reactive-3d-physics-stack",
    "name": "Parcel impact calibration stack",
    "nameZh": "包裹冲击校准堆栈",
    "category": "webgl",
    "sourceUrl": "https://github.com/pmndrs/react-three-rapier",
    "difference": "三类真实纹理包装拥有不同质量、弹性、摩擦与冲击阈值；真人投放或侧撞后，120 Hz 固定步 AABB 碰撞的真实 impulse 同时驱动箱体闪光、冲击波、峰值读数和 SAFE/WATCH/LIMIT 判定。",
    "behavior": {
      "trigger": "trusted bay click, payload/drop/impact/reset control, or keyboard command",
      "response": "Aim and drop a selected parcel or launch a side-impact sled, then expose collision severity against its material-specific handling limit",
      "timing": "human-started finite 120 Hz fixed-step simulation that pauses after settling",
      "layer": "full-stage p5 WebGL parcel calibration bay"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "webgl",
      "snippet": "for (fixedStep) { integrate(body); resolveAabbPair(a, b); recordImpact(rawImpulse, material.threshold); }",
      "referenceUrl": "https://github.com/pmndrs/react-three-rapier"
    },
    "scores": {
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "冷链硬壳、重载木箱与易碎陶瓷箱不再是同质方块：三张原创 ImageGen 包装面由 p5 解码并作为 WebGL texture 实际绘制，材质参数和限值各异。可信真人投放或侧撞才会启动有限物理，实际接触 impulse 同步改变纹理边缘闪光、冲击波、峰值与风险等级；首帧物理步数为零，录制时钟和合成事件不能推进模拟。",
    "batch": "C",
    "demo": "在 North Dock 包装实验室选择冷链、重载或易碎样本，瞄准后投放到现有货垛，观察碰撞峰值是否进入 WATCH/LIMIT，再用侧撞雪橇验证堆栈的横向承受能力并显式复位。",
    "capture": "首帧静止→选择易碎样本并点击 bay 按位置投放→侧撞雪橇制造横向碰撞→Reset 恢复五箱静止货垛→键盘选重载箱、移动瞄点并投放→按钮再投易碎箱并二次侧撞，稳定记录 WATCH；断言真实 WebGL、三张纹理 fetch/decode/checksum/p5.texture、固定步碰撞、可信输入与零自动/零录制时钟驱动。",
    "risk": {
      "level": "high",
      "detail": "参考实现使用 Rapier/WASM，本地证据实现为 p5 WebGL 中可审计的固定步 AABB 刚体近似，不能冒充 Rapier；三个包装样本和处理限值均属虚构，必须保留资产披露与真实纹理集成断言。"
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
    "name": "Glass under light optical material review",
    "nameZh": "光下玻璃光学材质评审",
    "category": "webgl",
    "sourceUrl": "https://github.com/pmndrs/drei",
    "difference": "真人旋转的 SDF 玻璃体以法线、IOR 与 RGB 色散对本地标定环境执行真实 `texture2D()` 和 GLSL `refract()` 采样；不是自动旋转的虹彩表面或装饰背景。",
    "behavior": {
      "trigger": "trusted captured mouse/touch/pen drag, keyboard rotation/IOR/environment/inspection, or explicit controls and reset",
      "response": "Rotate a ray-marched glass specimen, switch between two decoded calibration bays, tune refractive index, and inspect straight-grid distortion through real chromatic transmission",
      "timing": "human-owned direct optical response with a static first frame and no automatic cruise, playback, rehearsal, fallback, synthetic input, or preview-clock mutation",
      "layer": "full-stage p5 WebGL optical material inspector"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "webgl",
      "snippet": "RGB channels sample texture2D(u_environment, refractedOffset(rayDirection, normal, u_ior ± u_dispersion)) and mix with Fresnel on a ray-marched SDF surface.",
      "referenceUrl": "https://github.com/pmndrs/drei"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 99
    },
    "rationaleZh": "钴蓝/琥珀灯箱和青/红正交网格提供可判断的直线证据，实时环境、IOR、色散、旋转与检查状态把折射从诗意视觉变成可完成的材质审批任务。",
    "batch": "C",
    "demo": "在 Glass under light 光学实验台中旋转一枚玻璃样品，切换 Studio/Grid 标定环境、调整 IOR，并用正交网格确认折射与色散是否可接受。",
    "capture": "从零输入静止样品开始，完成两次相反捕获拖拽，切换 Studio/Grid、键盘旋转与 IOR 调节，触达最大 IOR 边界，执行 Inspect/Close 与 Reset，最后停在明确的 Grid inspection 结果；断言本地纹理解码、shader 编译/采样和严格可信输入。",
    "risk": {
      "level": "high",
      "detail": "不得依赖无许可 HDRI 或自动旋转假证据；必须保留本地原创标定环境、WebGL shader 编译、真实纹理绑定、折射采样、边界与输入台账，低端 GPU 失败需显式报告。"
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
    "name": "Aural Forms ordered phrase orbit",
    "nameZh": "Aural Forms 有序短语轨道",
    "category": "webgl",
    "sourceUrl": "https://github.com/protectwise/troika",
    "difference": "完整的 31 字符发行短语按源顺序投影到同一圆柱轨道，前后半环经过真实深度排序并穿过封面遮挡；真人旋转时仍能检查首字形、字符序号和完整 phrase identity，而不是把散落字母当作自动视觉噪声。",
    "behavior": {
      "trigger": "trusted captured mouse/touch/pen drag, wheel, keyboard, depth range, check-order control, or reset",
      "response": "Rotate one ordered release phrase around the decoded artwork, tune cylindrical depth, and explicitly align glyph 01 to verify reading order",
      "timing": "human-owned direct projection that stops immediately when input stops",
      "layer": "full-stage p5 Canvas2D artwork + depth-sorted glyph projection"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "glyphs = phraseGlyphs.map(projectCylinder).sort(byBackThenFrontDepth); drawArtwork(); glyphs.forEach(drawOrderedGlyph);",
      "referenceUrl": "https://github.com/protectwise/troika"
    },
    "scores": {
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "AURAL FORMS · LIVE SESSION 04 · 的每个字符保留源序号与 code point，前后半环各自可计数，封面遮挡与缩放建立深度。原创 ImageGen 发行主视觉被真实解码、校验并由 p5 同时绘为封面与环境光，其像素采样还驱动钴蓝/琥珀界面色；拖拽、滚轮、键盘、深度和 Check order 都要求可信输入，首帧静止且松手即停。",
    "batch": "C",
    "demo": "在虚构的 Aural Forms 发行检查台旋转完整曲面短语，观察字符从封面后方进入镜头前景，调节圆柱深度，并显式 Check order 把 01 / 31 · A 对齐到镜头中心。",
    "capture": "首帧静止→两次反向捕获拖拽→滚轮与方向键微调→range 改变深度→Check order 对齐首字形→Reset→键盘再次验证；断言 31 个字符的源顺序、前后深度计数、真实图片 SHA/像素采样/绘制、pointer capture 与零自动/零预览时钟驱动。",
    "risk": {
      "level": "high",
      "detail": "参考实现使用 Troika SDF/WebGL；本地证据 Demo 是 p5 Canvas2D 的圆柱投影近似，不得冒充 SDF 字体渲染。必须等待本地发行图 decode 与字符证据就绪，并保留虚构 ImageGen 资产披露。"
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
    "name": "Human-stamped digital-twin surface inspection",
    "nameZh": "真人盖章的数字孪生曲面巡检",
    "category": "webgl",
    "sourceUrl": "https://github.com/mrdoob/three.js",
    "difference": "可信二维输入经 screen-ray 反投影到确定性 heightfield，标记由高度导数法线真实对齐；只有命中巡检目标后才能留下带 UV/normal 签名的稳定审阅印章。",
    "behavior": {
      "trigger": "trusted pointer/touch/pen targeting and press, or keyboard target/navigation plus Enter/Space",
      "response": "Project onto the heightfield, align to its derivative normal, acquire A/B/C, and retain a verified inspection stamp",
      "timing": "direct human projection plus immediate retained stamp; no fading or automatic orbit",
      "layer": "full-stage p5 digital-twin inspection surface and evidence readout"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "28×18 确定性高度场、screen-ray 投影残差、单位法线误差和 B 点印章签名共同证明二维输入确实贴合三维曲面，结果稳定保留且无自动路径。",
    "batch": "C",
    "demo": "一张数字孪生复合板巡检台，操作员在 A/B/C 检查区间投影准星并为 Ridge joint 留下可审阅印章。",
    "capture": "真人从 A 过渡到 B，观察法线对齐与目标获取，在 B 点盖章并保留 Verified 结果。",
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
    "name": "Tidal Archive film review",
    "nameZh": "潮汐档案胶片评审",
    "category": "webgl",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/CircularGallery-TS-TW.json",
    "difference": "五张同一潮汐建筑的原创摄影不再是平面占位片，而是被真实分段 UV 网格弯成可审阅的圆柱胶片；真人滚轮、捕获拖拽或键盘改变位置与曲率，并能检查当前镜头。",
    "behavior": {
      "trigger": "trusted wheel, captured mouse/touch/pen drag, keyboard navigation/bend, inspect/clear, or reset",
      "response": "Browse five decoded architectural frames along a real textured cylindrical ribbon, alter its bend, and explicitly inspect the chosen frame",
      "timing": "static first frame; direct input controls position and bend, with finite input-owned inertia only",
      "layer": "full-preview p5 WebGL ribbon, five segmented UV textures, active-frame outline, archive metadata, inspect state, and controls"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "webgl",
      "snippet": "for (let segment=0; segment<18; segment++) vertex(sin(angle)*radius, y, -cos(angle)*radius, u, v);",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/CircularGallery-TS-TW.json"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 99
    },
    "rationaleZh": "一组 dawn→threshold→lightwell→material→blue hour 的连续建筑镜头让胶片弯曲承担真实审阅任务；索引、镜头标题和 Inspect Frame 把空间浏览收束成可确认的结果。",
    "batch": "C",
    "demo": "Tidal Archive Film Review 将五张 720×900 原创 ImageGen 建筑摄影严格解码为 p5.Image，再以每帧 18 段、合计 360 个纹理顶点绘制真实 WebGL 圆柱胶片；位置、bend、检查高亮和元数据共享同一状态。",
    "capture": "从静止 Circular lightwell 开始，真人滚轮正反浏览并验证边界释放，用相反方向的捕获拖拽产生有限惯性，键盘改变位置与 bend，显式 Inspect/Clear，最后 Reset 回到默认镜头。",
    "risk": {
      "level": "high",
      "detail": "必须保留五张唯一位图的真实 decode/checksum、分段 UV WebGL 曲面、可信输入账本、有限惯性与首尾 outward-wheel release；平面 DOM 卡、自动巡航或合成事件均不合格。"
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
    "name": "Bio-Material Futures dome review",
    "nameZh": "生物材料未来穹顶评审",
    "category": "webgl",
    "sourceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/DomeGallery-TS-TW.json",
    "difference": "十八个真实纹理视图分布在可拖拽半球内壁，视角由真人二维输入拥有，选中的材料从曲面径向展开并进入可确认的短名单；不是自动巡航或一维胶片轨道。",
    "behavior": {
      "trigger": "trusted captured mouse/touch/pen drag, keyboard orbit/select, shortlist/close, or reset control",
      "response": "Rotate a real textured spherical field, find the nearest projected specimen, expand it from the dome, and persist an explicit shortlist decision",
      "timing": "human-owned direct orbit with finite input-started inertia, static first frame, and no automatic cruise, playback, rehearsal, fallback, synthetic dispatch, or preview-clock mutation",
      "layer": "full-stage p5 WebGL dome plus material detail sheet"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "webgl",
      "snippet": "rotateSpherical(azimuth, elevation, radius, yaw, pitch) positions 18 textured views; projected hit-testing expands the selected specimen into a real detail panel.",
      "referenceUrl": "https://github.com/DavidHDev/react-bits/blob/main/public/r/DomeGallery-TS-TW.json"
    },
    "scores": {
      "creativity": 20,
      "artDirection": 20,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 99
    },
    "rationaleZh": "六种轮廓与色彩明确的原创材料影像让小瓦片仍可识别；十八视图、实时方位读数、曲面展开和短名单结果共同把穹顶导航变成一项可完成的材料评审任务。",
    "batch": "C",
    "demo": "在 Bio-Material Futures 数字材料库中拖拽环顾六种虚构材料的十八个视图，展开最近标本，阅读工艺说明并明确加入短名单。",
    "capture": "从零输入静止穹顶开始，完成两次相反方向的捕获拖拽与有限惯性，键盘改变方位并两次选片，依次执行 Shortlist、Close、Reset，再以键盘选中最终材料并确认；断言六张纹理 decode/checksum、十八视图与可信输入台账。",
    "risk": {
      "level": "high",
      "detail": "参考源码许可未明；本地实现必须固定相机与十八个球面视图，使用可追溯原创素材并证明纹理、投影命中、展开、短名单与 Reset 都由真人输入驱动。"
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
    "name": "Origin-aware functional reader-mode reveal",
    "nameZh": "调用点驱动的功能阅读模式揭示",
    "category": "transition",
    "sourceUrl": "https://github.com/magicuidesign/magicui/blob/main/apps/www/content/docs/components/animated-theme-toggler.mdx",
    "difference": "真人调用点驱动圆形 Focus 阅读层扩张或反向撤回；Research 与 Focus 不只换色，还切换批注、章节地图、行距、行聚焦工具与独立内容图，最终模式稳定保留。",
    "behavior": {
      "trigger": "trusted pointer/tap or keyboard mode selection, plus focus-line arrows",
      "response": "Reveal Focus mode from the invocation origin or withdraw it to Research while switching functional reading tools",
      "timing": "finite 680ms origin-aware forward reveal and reverse withdrawal",
      "layer": "full-stage Research and Focus reader surfaces with functional mode-specific tools"
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
      "creativity": 20,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 100
    },
    "rationaleZh": "调用点、有限圆形揭示、两套实质阅读工具与可留存模式共同建立空间和功能因果；原创双联图的两半像素裁切也绑定不同内容身份。",
    "batch": "C",
    "demo": "在真实阅读器中从 Research 切到 Focus：隐藏批注与章节地图、启用更宽行距和五行键盘聚焦；随后从新的 Research 按钮调用点反向撤回并保留研究模式。",
    "capture": "首帧 Research 静止→点击 Focus→录圆形扩张→ArrowDown 移动行聚焦→点击 Research→录反向撤回→停留在研究模式。",
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
    "name": "Hand rehabilitation landmark calibration",
    "nameZh": "手部康复关键点校准",
    "category": "canvas",
    "sourceUrl": "https://github.com/google-ai-edge/mediapipe",
    "difference": "明确不是摄像头或模型推理：一段原创本地手腕扫动视频与同公式旋转的 21 个手工校准点逐帧对齐，让使用者检查骨架注册、拖动修正偏移并切换训练任务；不以预标注数据冒充实时检测。",
    "behavior": {
      "trigger": "trusted play, seek, exercise selection, calibration drag, or keyboard input",
      "response": "Keep twenty-one deterministic landmarks registered to a local wrist-sweep video and let the operator correct overlay offset",
      "timing": "user-owned playback or direct frame seeking",
      "layer": "full-stage local video + p5 Canvas overlay"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "angle = 0.10 * Math.sin(2 * Math.PI * frameTime / 3); landmarks = rotate(baseLandmarks, angle, calibrationOffset)",
      "referenceUrl": "https://github.com/google-ai-edge/mediapipe"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 19,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 98
    },
    "rationaleZh": "真实本地视频、逐帧媒体 checksum、21 点与 23 条连线、同源变换公式和人工偏移校准共同把骨架叠加变成可信的康复动作质检；页面显式披露这是虚构本地校准样本而非实时摄像头或模型推理。",
    "batch": "C",
    "demo": "在 3 秒原创手腕扫动样本上检查 21 点骨架注册；明确播放/暂停或拖动 seek，切换 Wrist sweep / Stability hold，并用捕获拖拽修正关键点偏移。",
    "capture": "首帧暂停→Play/Pause→真实 range seek→切换 Hold→两次相反方向校准拖拽→键盘逐帧与切换任务→第二次用户播放/暂停→Reset→再次校准；验证本地 H.264 元数据、视频帧变化、21 点/23 连线和可信输入账本。",
    "risk": {
      "level": "medium",
      "detail": "本 Demo 是被明确披露的确定性校准样本，不声称运行 MediaPipe、摄像头或实时推理；若改成检测产品，必须接入真实模型输出，不能用预标注坐标冒充。"
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
    "name": "Occlusion Check GIF frame inspector",
    "nameZh": "遮挡检查 GIF 逐帧质检器",
    "category": "canvas",
    "sourceUrl": "https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder",
    "difference": "不是把一组 PNG 当成 GIF，也不是开屏自动播放：浏览器逐帧解码同一个本地 GIF，保留真实 delay、frame rect 与 disposal metadata；人类拖动 range、按键步进或明确 Play 后才改变当前帧。",
    "behavior": {
      "trigger": "trusted range drag, transport control, or keyboard",
      "response": "Decode and inspect twelve disposal-composited GIF frames around glass and foreground occlusion edges",
      "timing": "direct discrete seeking plus user-started variable-delay playback",
      "layer": "full-stage p5 Canvas motion-QA workstation"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "const result = await decoder.decode({ frameIndex, completeFramesOnly: true }); setFrame(Number(slider.value), 'range-input')",
      "referenceUrl": "https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder/decode"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 99
    },
    "rationaleZh": "同一原创 GIF 的真实逐帧解码、variable delay、两种 disposal 与十二个像素校验和，把动画从被动播放变成可以停在玻璃、遮挡和透明边缘上的质检工具。首帧静止，只有可信人类输入可以拖动、步进或启动播放。",
    "batch": "C",
    "demo": "在原创 12 帧 Occlusion Check 动效上拖动时间滑杆，停在折纸标记穿过玻璃和双色前景闸门的位置，核对每帧 delay 与 disposal；也可逐帧前后跳转，或明确播放、暂停和重置。",
    "capture": "首帧静止→真实拖动 0→4→8→11→按钮与键盘往返逐帧→Play 后按 GIF delay 推进→Pause→Reset→再次拖到遮挡关键帧；断言 12 个独立像素校验和、1/2 disposal、1,210 ms 总时长与可信输入计数。",
    "risk": {
      "level": "medium",
      "detail": "必须从同一 GIF 字节流解码完整合成帧并核对 timing/disposal/checksum；逐帧 PNG 列表、合成事件或开屏自动播放都不算真实交互演示。"
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
    "name": "Human-scrubbed greenhouse growth study",
    "nameZh": "人控温室生长逐帧研究",
    "category": "scroll",
    "sourceUrl": "https://motion.dev/docs/react-use-scroll",
    "difference": "把滚轮、捕获拖拽、键盘或章节选择直接映射到一段真实本地 H.264 的 currentTime；五个原创生长阶段、逐帧媒体校验与 p5 测量标尺共同证明这是可逆的人工观察，不是自动播放或静帧替换。",
    "behavior": {
      "trigger": "trusted wheel, captured pointer drag, keyboard, chapter selection, or reset",
      "response": "Seek one local greenhouse-growth video and update chapter, study-day, canopy, timecode, and p5 measurement evidence",
      "timing": "direct, reversible, user-owned media scrub",
      "layer": "full-stage local video + DOM study log + p5 measurement overlay"
    },
    "implementation": {
      "projectId": "processing-p5-js",
      "projectUrl": "https://github.com/processing/p5.js",
      "library": "p5@2.3.0",
      "renderer": "canvas2d",
      "snippet": "video.currentTime = clamp(progress, 0, 1) * (video.duration - 1 / 30)",
      "referenceUrl": "https://motion.dev/docs/react-use-scroll"
    },
    "scores": {
      "creativity": 19,
      "artDirection": 20,
      "motion": 20,
      "clarity": 15,
      "inspiration": 15,
      "evidence": 10,
      "total": 99
    },
    "rationaleZh": "真人滚轮、拖拽、键盘和章节按钮拥有同一条六秒本地视频时间轴；五张原创温室关键帧形成可核验的生长连续性，真实 seekable/currentTime、视频进度、p5 标尺、媒体校验和与边界滚动释放共同证明交互成立。首帧暂停且没有自动播放、彩排、fallback、合成输入或预览时钟变更。",
    "batch": "C",
    "demo": "在 Living Systems Unit 的六周温室研究中，用滚轮、横向拖拽、方向键或五个章节直接检查豆苗从出土到首次开花的六秒本地记录；舞台同步显示研究日、冠层百分比、章节说明和 p5 生长位置标尺。",
    "capture": "首帧暂停→真实滚轮前进并验证末端向外滚动释放页面→Reset→两次捕获拖拽正向/反向定位→选择 First bloom→键盘切到 Climbing；断言本地 H.264 为 960×540、180 帧、6 秒且可 seek，五张关键帧均 decode 并拥有独立像素 checksum。",
    "risk": {
      "level": "medium",
      "detail": "视频必须本地、关键帧密集并真实修改 HTMLVideoElement.currentTime；不能用自动播放、预览时钟或五张预导出静帧的 DOM 切换冒充可逆 scrub。原创关键帧与视频记录的是虚构研究，不得表述为真实实验数据。"
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
