const score = (creativity, artDirection, motion, clarity, inspiration, evidence) => ({
  creativity, artDirection, motion, clarity, inspiration, evidence,
  total: creativity + artDirection + motion + clarity + inspiration + evidence
});

const p5Implementation = (snippet, referenceUrl) => ({
  projectId: 'processing-p5-js',
  projectUrl: 'https://github.com/processing/p5.js',
  library: 'p5@2.3.0',
  renderer: 'canvas2d',
  snippet,
  referenceUrl
});

const motionImplementation = (snippet, referenceUrl, renderer = 'dom') => ({
  projectId: 'motiondivision-motion',
  projectUrl: 'https://github.com/motiondivision/motion',
  library: 'motion@12.42.2',
  renderer,
  snippet,
  referenceUrl
});

export const effectExpansion150BatchB = [
  {
    id: 'topographic-wave-contour-reveal', order: 126, name: 'Alpine watershed flood-contour review', nameZh: '高山流域洪水等高线审阅', category: 'canvas', sourceUrl: 'https://github.com/d3/d3-contour',
    difference: '把自动扫描的程序地形改为真人操作的高山流域安全审阅：真实航拍像素生成高程、坡度、洪水风险、九层 Marching Squares 等高线与一条低风险路线。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen drag, keyboard, native survey range, or visible Dry/Storm/Reset controls', response: 'Move the survey wave, probe real pixel-derived elevation and risk, change flood stage, and reveal the safer high route', timing: 'human-owned finite redraws that hold between inputs', layer: 'full-stage p5 aerial survey, elevation contours, flood field, route, probe, readings, and controls' },
    prompt: '制作一个全舞台高山流域洪水与路线审阅台：同源加载并精确校验一张 ImageGen 航拍图，读取 80×45 像素并平滑成高程场，以真实色彩与坡度生成风险场、九层 Marching Squares 等高线和逐列低风险路线；真人通过 hover、捕获拖拽、键盘、原生 survey range 与 Dry/Storm/Reset 控制揭示、洪水阈值和探针。首帧与每次操作后保持静止，禁止自动扫描、播放、排练、fallback、合成输入或预览时钟驱动。',
    implementation: p5Implementation("decodedPixels -> smoothedElevation + floodRisk -> marchingSquaresContours + safeRoute; trustedInput -> finite redraw", 'https://github.com/d3/d3-contour'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创航拍图经同源 fetch、精确源 SHA、浏览器与 p5 双解码，并读取 80×45 / 3,600 像素；真实像素派生 3,121 条等高线段和安全路线。可信 hover、捕获拖拽、键盘、range 与按钮拥有揭示和洪水阈值，完整舞台在输入之间保持静止。'
  },
  {
    id: 'magnetic-orbit-command-dock', order: 127, name: 'Harbor pixel command dock', nameZh: '港口像素命令坞', category: 'pointer', sourceUrl: 'https://github.com/codrops/MagneticButtons',
    difference: '把持续自转的抽象图标改为静止待命的港口影像复核工具：真实局部像素会重排五项命令的相关度，并把最合适的工具吸向用户采样点。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen drag, keyboard, native pull range, or visible command/undo/reset control', response: 'Sample the verified harbor image, rank Lift/Trace/Grade/Mask/Verify from local luminance, saturation, edge and variance, magnetically seek the five paused Motion controls, and explicitly queue a command', timing: 'human-owned finite reversible Motion seeks that remain still after input', layer: 'full-stage harbor source, pixel probe, recommendation card, five-command orbit, magnetic pull control, and queue state' },
    prompt: '制作一个全舞台港口影像复核命令坞：同源加载并精确校验一张 ImageGen 港口航拍图，读取 96×54 像素，让局部亮度、饱和度、边缘、方差和暖度真实决定 Lift/Trace/Grade/Mask/Verify 的排序、强调色与磁吸几何。真人通过 hover、捕获式鼠标/触控/笔拖动、键盘、原生 pull range 和可见命令/Undo/Reset 操作五个无 autoplay 的暂停 Motion 控制器；首帧和每次操作后必须静止，禁止轨道自转、自动播放、排练、fallback、合成输入或预览时钟驱动。',
    implementation: motionImplementation("const control = animate(tool, { transform: [from, pixelRankedTransform] }, { duration: 1, ease: 'linear', autoplay: false }); control.pause(); control.time = control.duration;", 'https://github.com/motiondivision/motion'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 港口航拍图经同源 fetch、精确源 SHA、浏览器 decode 与 96×54 / 5,184 像素读取；局部亮度、饱和度、边缘、方差和暖度产生至少三种不同命令建议，并同步驱动颜色与五按钮磁吸。可信 hover、捕获拖拽、键盘、range 和按钮控制暂停 Motion seek、排队、撤销与复位，首帧和结果均保持静止。'
  },
  {
    id: 'stencil-text-scanline-window', order: 128, name: 'Make-ready print registration gate', nameZh: 'Make-ready 印刷套准检查台', category: 'vector', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: '把自动横扫的彩色模板字变成印前放行检查：真实四色校样像素决定油墨色板、边缘风险、四个异常靶点和 HOLD/PASS 结论，用户必须亲自扫过证据再评估。',
    behavior: { trigger: 'trusted hover, captured pointer drag, range, keyboard, or visible control', response: 'Seek the clipped REGISTER proof across real ink edges, collect four pixel-derived targets, then evaluate the source-backed press disposition', timing: 'human-owned paused Motion seek with finite reversible steps', layer: 'full-stage proof image, CSS background-clipped stencil, registration gate, targets, metrics, and controls' },
    prompt: '制作一个全舞台印刷套准检查台：同源加载并精确校验一张 ImageGen 四色校样，用 192×128 像素读取派生色板、边缘风险和四个分离靶点；真人通过 hover、捕获式鼠标/触控/笔拖动、range、键盘和按钮移动扫描门，暂停的 Motion 控制器必须与 CSS clip-path 和 background-clip 进度一致。只有扫足证据并显式 Evaluate 后才能给出源像素决定的 HOLD/PASS；禁止 autoplay、排练、fallback、合成输入或预览时钟驱动。',
    implementation: motionImplementation("const scanMotion = animate(probe, { value: [0, 1] }, { duration: 1, ease: 'linear', autoplay: false }); scanMotion.pause(); scanMotion.time = trustedHumanScanU; stage.style.setProperty('--scan-x', `${trustedHumanScanU * 100}%`);", 'https://github.com/motiondivision/motion'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 四色套准校样被同源 fetch、精确源 SHA 与浏览器解码校验，并读取为 192×128 / 24,576 像素；真实颜色生成七类色板，邻域边缘与四色混合筛出四个空间分离靶点并决定风险与 HOLD/PASS。可信 hover、捕获拖拽、range、键盘和可见控件共同驱动暂停的 Motion seek、CSS 字面扫描窗、证据覆盖和显式放行判断，首帧与操作后都保持静止。'
  },
  {
    id: 'elastic-svg-rope-lettering', order: 129, name: 'TIDE rope wayfinding material proof', nameZh: 'TIDE 绳索导视材料校样', category: 'vector', sourceUrl: 'https://github.com/svgdotjs/svg.js',
    difference: '不再用一条无语义波线代表绳索字形；完整 TIDE SVG 路径的颜色、线宽、耦合、刚度、载荷与可读性由真实材料板像素决定，用户亲手编辑节点并锁定材料方案。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen drag, keyboard, material buttons, or visible tension/lock/reset control', response: 'Edit the continuous TIDE rope path, compare four pixel-derived materials, change tension, and retain a wayfinding proof with load, legibility, and PASS/REFINE evidence', timing: 'human-paced direct SVG deformation that remains still between inputs', layer: 'full-stage native SVG rope letterform, material scan, handles, proof evidence, and controls' },
    prompt: '制作一个全舞台 TIDE 绳索导视校样台：同源加载并精确校验一张 ImageGen 材料板，从真实像素生成 GOLD/NAVY/CORAL/FLAX 的颜色、纹理、刚度、耦合、线宽和载荷；真人通过 hover、捕获拖拽、键盘、材料按钮与 FIRM/LOCK/RESET 编辑连续 SVG 字形，首帧与每个结果保持静止。',
    implementation: motionImplementation("materialPixels -> ropeProfiles; trustedNodeEdit -> nativeSvgPathData + legibility + loadDecision;", 'https://github.com/svgdotjs/svg.js', 'svg'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 绳索材料板经过同源 fetch、精确源 SHA、浏览器解码与像素采样；四类真实材料像素决定 SVG 字形的物理和视觉参数。可信 hover、捕获拖拽、键盘和可见控件拥有路径、张力、材料和锁定状态，无自动路径或录制时钟变更。'
  },
  {
    id: 'cursor-heatmap-crystallization', order: 130, name: 'Phase Atlas thermal crystallization probe', nameZh: 'Phase Atlas 热晶化材料探针', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: 'A verified local micrograph is sampled into 3,600 heterogeneous material cells whose real pixels determine ceramic, conductor, and pore zones, conductivity, heat capacity, and phase threshold; this is not a generic radial heatmap overlay.',
    behavior: { trigger: 'trusted mouse hover, captured mouse/touch/pen drag, keyboard command, or Pulse/Cool/Reset control', response: 'Apply a finite heat pulse, diffuse it through pixel-derived properties, crystallize threshold-crossing cells, and explicitly recover or reset the sample', timing: 'human-owned finite solver iterations that remain stable after each input', layer: 'full-stage p5 material micrograph, thermal lattice, source path, and live measurements' },
    prompt: 'Build a human-operated phase-change material test from one verified local micrograph. Decode it into a real p5.Image, sample an 80×45 lattice, derive heterogeneous conductivity, heat capacity, and crystallization thresholds from its pixels, then let trusted hover, captured drag, keyboard, Pulse, Cool, and Reset run only finite solver iterations with no autoplay or preview-clock mutation.',
    implementation: p5Implementation("const zone = classify(pixel); heat[i] += humanPulse * falloff / capacity[i]; diffuseFinite(heat, conductivity); crystallinity[i] += heat[i] > threshold[i] ? growth : 0;", 'https://github.com/processing/p5.js/tree/v2.3.0'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创显微材料图是 p5 的实际机制输入：3,600 个像素格决定三类区域和异质热学参数。真人悬停、捕获拖拽、键盘与 Pulse/Cool/Reset 只触发有限次扩散、晶化或恢复，热源轨迹和测量结果可停留、可逆，首帧无演出。'
  },
  {
    id: 'peelable-paper-corner-reveal', order: 131, name: 'Night Garden ticket access peel', nameZh: 'Night Garden 票券兑换揭角', category: 'pointer', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: 'A human-owned five-point paper clip, lifted fold, and shadow uncover the persistent redemption layer of one credible event ticket; the same verified artwork moves from monochrome face evidence to the full-colour access result, rather than flipping a card or animating an empty corner badge.',
    behavior: { trigger: 'trusted captured mouse/touch/pen peel, keyboard command, or explicit ticket control', response: 'Hold the paper at an intermediate corner or cross the completion threshold to reveal the Night Garden access code beneath', timing: 'direct reversible drag plus finite input-owned completion or cancellation', layer: 'full-stage ticket face, folded paper corner, and redemption layer' },
    prompt: 'Build a live fictional event ticket whose corner is directly peeled by trusted human input. Seek one paused Motion controller from pointer distance, synchronize a five-point clip, fold geometry, shadow, ARIA state, and a meaningful access layer, then settle only after the user crosses an explicit threshold.',
    implementation: motionImplementation("const geometry = animate(0, 1, { duration: 1, onUpdate: applyPeelGeometry }); geometry.pause(); geometry.time = humanProgress;", 'https://github.com/motiondivision/motion'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: 'Night Garden 虚构票券把原创 ImageGen 夜间温室主视觉同时用于黑白票面与全彩兑换层；浏览器真实 fetch、SHA-256、双 DOM decode 与像素采样均可核验。真人捕获拖拽可保持中间揭角，低阈值有限回封、高阈值有限完成，键盘与按钮也能显式控制；首帧封闭，无自动循环、rehearsal、fallback、合成输入或预览时钟变更。'
  },
  {
    id: 'radial-calendar-time-zoom', order: 132, name: 'Northlight studio quiet-hour finder', nameZh: 'Northlight 工作室安静时段查找器', category: 'vector', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: '把装饰性的径向日期换成一项真实预约决策：同一张俯视工作室图的十二个扇区像素生成 08:00–19:00 的开放、有限或维护状态，选针、时段详情与 Hold 操作始终同步。',
    behavior: { trigger: 'trusted mouse hover, captured mouse/touch/pen orbit, keyboard, or visible previous/next/hold control', response: 'Inspect an image-derived one-hour slot, compare capacity and maintenance state, then place or release a reversible hold', timing: 'human-owned discrete seek through one paused Motion controller', layer: 'full-stage booking brief, SVG radial selector, and decoded occupancy atlas' },
    prompt: '制作一个可真人操作的环形工作室预约器。浏览器必须同源加载、精确校验并采样一张本地 ImageGen 俯视占用图，让十二个扇区的真实颜色和亮度决定 12 个小时的可用状态。鼠标悬停、捕获拖拽、触控、笔、键盘和按钮只 seek 一个暂停的 Motion 选针控制器；用户可确认或取消时段，首帧静止且无自动轮播。',
    implementation: motionImplementation("const needle = animate(0, 11, { duration: 1, ease: 'linear', onUpdate: applyNeedle }); needle.pause(); needle.time = selectedIndex / 11;", 'https://github.com/motiondivision/motion', 'svg'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 960×640 圆形工作室俯视图被真实 fetch、SHA-256 校验、浏览器解码并采样为 96×64；十二个径向扇区各贡献 12 个像素样本，直接生成开放、有限和维护时段。真人 hover、捕获 mouse/touch/pen drag、键盘与 Previous/Next/Hold 可往返检查并确认，暂停的 Motion 控制器只响应可信输入；全舞台适配 720、320 和 144 宽度，无自动循环、排练、fallback、合成输入或预览时钟变异。'
  },
  {
    id: 'typography-particle-disassembly-field', order: 133, name: 'Low Tide release particle compositor', nameZh: 'LOW TIDE 发行粒子合成器', category: 'canvas', sourceUrl: 'https://github.com/timdream/wordcloud2.js',
    difference: '不再让字形按时间自动碎成随机背景；2,060 个真实字形粒子由用户拖入同源发行环境图的像素边缘，目标颜色、推荐混合比例、评分和批准门槛都来自最终提交图片。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen drag, keyboard, native range, or visible Balance/Approve/Reset control', response: 'Continuously place the LOW TIDE title between readable glyphs and image-derived environmental particles, inspect the source, balance the mix, and approve a retained release state', timing: 'human-paced direct composition that redraws only after input and remains still between decisions', layer: 'full-stage p5 image compositor with glyph-mask particles, probe, evidence card, range, and release controls' },
    prompt: '制作一个全舞台音乐发行标题合成器：同源加载并精确校验一张 ImageGen 潮汐环境图，把 LOW TIDE 的离屏字形像素映射到真实图片边缘及 RGB，真实像素计算推荐混合比例和批准分数；真人通过 hover、捕获拖拽、键盘、range 与 Balance/Approve/Reset 决定最终状态，首帧与操作后都保持静止。',
    implementation: p5Implementation("glyphMaskParticles.map(p => lerp(p.glyph, imageEdgeTargets[p.index], humanMix));", 'https://github.com/timdream/wordcloud2.js'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 潮汐环境图经过同源 fetch、精确源 SHA、浏览器与 p5 双解码，并读取 120×80 / 9,600 像素；亮度、边缘和色度真实决定 1,645 个独立落点、粒子颜色、推荐 39% 混合和发行评分。可信 hover、捕获拖动、键盘、range 与可见控制拥有连续进度和批准状态，p5 noLoop 且没有自动路径。'
  },
  {
    id: 'liquid-lens-card-refraction', order: 134, name: 'Pressing surface liquid-lens inspection', nameZh: '唱片压片液态镜片检查', category: 'pointer', sourceUrl: 'https://github.com/w3c/fxtf-drafts',
    difference: 'A human moves an irregular optical lens across one verified full-stage pressing photograph; the lens resamples those same committed pixels at a Motion-controlled magnification while a live backdrop filter, internal reflection, border deformation, and exact sample mapping reveal groove detail instead of filtering generic colour stripes.',
    behavior: { trigger: 'trusted mouse hover, captured mouse/touch/pen drag, keyboard command, or visible zoom/reset control', response: 'Move and magnify a liquid lens over the fictional pressing to inspect grooves and material inclusions at any chosen point', timing: 'human-paced direct reversible inspection with a paused Motion zoom controller', layer: 'full-stage source photograph and same-pixel optical lens' },
    prompt: 'Build a live vinyl pressing inspection from one verified local photograph. Use trusted input to position an irregular lens, seek a paused Motion controller for zoom, and map the same source pixels into a magnified sample with real backdrop-filter optics; every state must hold without autoplay.',
    implementation: motionImplementation("const zoom = animate(1.12, 1.95, { duration: 1, onUpdate: syncOptics }); zoom.pause(); zoom.time = humanZoomProgress; lens.style.backdropFilter = 'blur(.65px) saturate(1.3) contrast(1.13)';", 'https://github.com/w3c/fxtf-drafts'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 唱片压片照片既是全舞台底图，也是镜片放大采样源；同源 fetch、SHA-256、DOM decode 与 1,536 像素采样均可核验。真人 hover、捕获拖拽、键盘和可见缩放/复位控件拥有位置与倍率，暂停的 Motion 控制器值与实时镜片倍率一致；首帧静止，无自动循环、rehearsal、fallback、合成输入或预览时钟变更。'
  },
  {
    id: 'accordion-depth-tunnel-navigation', order: 135, name: 'Northline depth clearance', nameZh: 'Northline 地下层位通行检查', category: 'transition', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: '把定时推进的抽象章节隧道变成地下设施层位检查：一张真实切面图的五个像素带计算各层风险与建议目的层，用户再亲手深入、折返或直达目标。',
    behavior: { trigger: 'trusted hover, captured pointer scrub, range, keyboard, or visible depth control', response: 'Seek five hinged evidence panels, compare pixel-derived risk, reverse at any point, or route directly to the recommended inspection stratum', timing: 'paused human-owned Motion controls that hold every intermediate depth', layer: 'full-stage cutaway ambience, five CSS3D panels, sampled evidence card, native depth range, and controls' },
    prompt: '制作一个全舞台地下设施层位通行检查器：同源加载并精确校验一张 ImageGen 五层切面图，以 96×64 像素中的五个水平带计算均色、亮度方差、温暖度、湿度、纹理与深度风险，并把最高风险层设为 TARGET。真人通过 hover、捕获式鼠标/触控/笔拖动、range、键盘及 Up/Down/Target 控件同步 seek 五个无 autoplay 的 Motion/CSS3D 面板；首帧和每次操作后保持静止。',
    implementation: motionImplementation("const controls = panels.map((panel, i) => animate(panel, { transform: levelTransforms(i), opacity: levelOpacity(i), filter: levelFilters(i) }, { duration: 4, ease: 'linear', autoplay: false })); controls.forEach(control => control.time = trustedDepth);", 'https://github.com/motiondivision/motion'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 地下设施切面图经过同源 fetch、精确源 SHA 与浏览器解码，并读取为 96×64 / 6,144 像素；五个水平证据带真实决定每层色调、风险和推荐目的层。可信 hover、捕获拖动、range、键盘及可见按钮同步 seek 五个暂停 Motion 控制器和 CSS3D 折页，可停在任意中间深度且没有自动路径。'
  },
  {
    id: 'svg-metaball-cursor-separation', order: 136, name: 'Reclaim material stream separation', nameZh: '回收材料流分拣', category: 'vector', sourceUrl: 'https://github.com/w3c/svgwg',
    difference: '一张已验证的回收料盘像素识别出玻璃、铜粒、聚合物与纸纤维，并把四个真实源区映射到 Motion 控制的 SVG 融球拓扑；不是无语义圆点轨道。',
    behavior: { trigger: '可信 hover、捕获式鼠标/触控/笔拖拽、键盘或 Merge/Separate/Lock', response: '连续分开四类像素鉴别材料，查看拓扑断开并锁定四条回收流', timing: '真人直接 seek 四个暂停 Motion 控制器，输入后保持', layer: '全舞台 SVG 滤镜拓扑、四个图片像素区和分拣控件' },
    prompt: '制作一个真人操作的回收料分拣台：同源加载并精确校验一张 ImageGen 四分区材料盘，从 96×64 像素中鉴别玻璃、铜粒、聚合物和纸纤维，并将每个源区裁入 feGaussianBlur + feColorMatrix SVG 融球节点。以可信 hover、捕获拖拽、键盘和 Merge/Separate/Lock 直接 seek 四个无 autoplay 的 Motion 控制器，可逆地改变连通分量并锁定分拣计划。',
    implementation: motionImplementation("const controls = nodes.map(node => animate(node, { opacity: [.92, 1] }, { duration: 1, ease: 'linear', autoplay: false })); controls.forEach(control => control.time = trustedSeparation); applySvgMetaballTopology(pixelClassifiedNodes);", 'https://github.com/w3c/svgwg', 'svg'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 回收材料盘经同源 fetch、精确 SHA 与浏览器解码，96×64 像素的四个区域真实决定材料身份、置信度、节点半径和可见纹理。真人 hover、捕获拖拽、键盘与 Merge/Separate/Lock 同步 seek 四个暂停 Motion 控制器和 SVG 连通拓扑；首帧及操作后静止，无 autoplay、rehearsal、fallback、合成输入或预览时钟变更。'
  },
  {
    id: 'gesture-sliced-image-shutters', order: 137, name: 'Gesture sliced image shutters', nameZh: '手势切片图像百叶', category: 'pointer', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: '同一图像被八个垂直切片按正弦相位错开，仍维持可拼回的背景坐标。',
    behavior: { trigger: 'captured horizontal pointer/touch drag or Left/Right Arrow hold', response: 'Eight windows cut from one shared photograph stagger vertically and skew while preserving their registered source coordinates', timing: 'direct signed input with spring registration on release; no autonomous fallback', layer: 'full-bleed sliced travel media card' },
    prompt: '把同一张旅行照片以固定背景坐标裁成八个无缝竖片；按真实水平拖拽或方向键做确定性错峰，释放后用弹簧精确拼回原图。',
    implementation: motionImplementation("shutters.onpointermove = event => dragging && applySignedSliceOffsets(progressFrom(event)); shutters.onpointerup = () => animate(open, 0, { type: 'spring' });", 'https://github.com/motiondivision/motion'),
    scores: score(18, 19, 19, 15, 15, 10), rationaleZh: '切片仍能重组成原图，手势错位具有强烈且可逆的视觉签名。'
  },
  {
    id: 'offline-audio-spectral-ribbon', order: 138, name: 'Offline audio spectral ribbon', nameZh: '离线音频频谱丝带', category: 'canvas', sourceUrl: 'https://github.com/WebAudio/web-audio-api',
    difference: '真实 OfflineAudioContext 生成扫频采样，再由多层曲线读取样本折叠成丝带，不是伪随机均衡器。',
    behavior: { trigger: 'offline audio render and animation frame', response: 'Rendered oscillator samples bend twelve luminous spectral threads', timing: 'sample-accurate deterministic playback', layer: 'audio visualization canvas' },
    prompt: '用 OfflineAudioContext 渲染一秒扫频音频，读取真实 channel data 并绘制十二层频谱丝带。',
    implementation: p5Implementation("const buffer = await offline.startRendering(); new p5(p => { p.draw = () => drawRibbon(p, buffer.getChannelData(0)); });", 'https://github.com/WebAudio/web-audio-api'),
    scores: score(19, 19, 19, 15, 15, 10), rationaleZh: '音频数据来源可核验，丝带层次与扫频变化形成鲜明艺术结果。'
  },
  {
    id: 'gravity-well-icon-field', order: 139, name: 'Deep Field gravity lens inspector', nameZh: 'Deep Field 深空重力透镜检查台', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '把自动绕行的小图标换成一次可解释的深空候选检查：生成巡天底片的真实像素决定七个候选的位置、分数和结论，用户亲手移动、调质量并锁定同一张图上的放大镜。',
    behavior: { trigger: 'trusted hover, captured pointer drag, keyboard, or visible lens control', response: 'Move a same-image gravity lens through pixel-derived candidates, change aperture mass, compare local edge/blue/structure evidence, and lock a review target', timing: 'human-owned finite input with a static initial and settled final state', layer: 'full-stage p5 deep-field image, same-source lens, candidates, evidence readout, and controls' },
    prompt: '制作一个全舞台深空重力透镜候选检查台：同源加载并精确校验一张 ImageGen 巡天底片，以 160×90 真实像素的亮度、边缘、蓝色过量、结构和亮点密度筛出七个候选；真人通过 hover、捕获式鼠标/触控/笔拖动、键盘和可见 −/Lock/+/Reset 控件移动镜片、调节质量并锁定候选。镜片必须放大同一提交图片的真实像素，首帧与每次输入后保持静止，禁止 autoplay、fallback、合成输入或预览时钟变异。',
    implementation: p5Implementation("p.noLoop(); const candidates = deriveCandidates(samplePixels); surface.addEventListener('pointermove', moveLensFromTrustedInput); const lock = () => snapToNearestPixelCandidate(); p.image(source, lensX - r, lensY - r, 2*r, 2*r, sampleX, sampleY, sampleW, sampleH);", 'https://github.com/processing/p5.js'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 深空巡天底片经过同源 fetch、精确源 SHA、浏览器与 p5 双解码，并读取为 160×90 / 14,400 像素证据；局部边缘、蓝色过量、结构变化和亮点密度真实生成七个候选与 Quiet/Weak/Review/Probable 结论。可信 hover、捕获拖拽、键盘和可见控件共同拥有透镜位置、质量与锁定，圆形镜片放大的仍是同一资源像素，没有自动轨道。'
  },
  {
    id: 'scroll-stitched-isometric-blueprint', order: 140, name: 'North Spur field-node commissioning', nameZh: 'North Spur 边缘节点装配验收', category: 'scroll', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: 'Five named hardware modules seek five independent paused Motion controls in dependency order and reveal the same verified as-built acceptance photograph from base to telemetry cap; this is not a generic card entrance or anonymous architecture stack.',
    behavior: { trigger: 'trusted wheel, captured vertical mouse/touch/pen drag, keyboard command, or module checkpoint', response: 'Seat base, power/thermal, compute, network, and telemetry modules in order while the as-built proof advances toward Verified', timing: 'direct reversible human scrub over five paused one-second Motion controls', layer: 'full-stage CSS3D assembly field and acceptance proof card' },
    prompt: 'Build a human-operated remote edge-node commissioning view. Create five paused Motion controls with unique off-grid starts and dependency-ordered local progress; trusted wheel, captured vertical drag, keyboard, and checkpoints must seek them directly. Sample five regions from one verified local completion photograph into the module materials and reveal that same proof only with human progress, without autoplay.',
    implementation: motionImplementation("controls = modules.map((node,i) => { const c = animate(node, { x:[start[i].x,0], y:[start[i].y,0], opacity:[.34,1] }, { duration:1, autoplay:false }); c.pause(); return c; }); controls.forEach((c,i) => c.time = clamp(progress*5-i));", 'https://github.com/motiondivision/motion'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '五个具名硬件层、依赖顺序和验收照片形成完整装配任务；原创节点照片的五个真实像素区域同时驱动 CSS3D 材料色与 proof card。真人滚轮、捕获拖拽、键盘或检查点可停在任意进度并反向拆解，首帧静止。'
  },
  {
    id: 'pixel-sort-hover-wipe', order: 141, name: 'North Relay pixel-sort inspection', nameZh: 'North Relay 照片像素排序检查', category: 'canvas', sourceUrl: 'https://github.com/snorpey/glitch-canvas',
    difference: 'A human-owned wipe compares one verified editorial photograph against two real 480-column pixel buffers sorted in-place by luminance or hue; the left side is transformed image data and the right side remains the same source frame, not a CSS stretch or procedural landscape.',
    behavior: { trigger: 'trusted mouse hover, captured mouse/touch/pen drag, keyboard command, or sort-mode control', response: 'Hold a boundary at any point and compare the original relay-station frame with its actual per-column Luma or Hue ordering', timing: 'human-paced direct reversible inspection with no automatic sweep', layer: 'full-stage p5 source and sorted image buffers' },
    prompt: 'Build a live image-forensics inspection from one decoded 960×640 fictional relay-station photograph. Precompute genuine 480×270 per-column luminance and hue sorts, then let trusted hover, captured drag, keyboard, and mode controls hold the comparison boundary at any position without autoplay.',
    implementation: p5Implementation("const sorted = sortEveryColumn(sourcePixels, mode); p.image(sortedFrame, 0, 0, wipeWidth, h, 0, 0, sortedColumns, sampleH);", 'https://github.com/snorpey/glitch-canvas'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '一张原创 ImageGen 火山海岸中继站照片被真实 fetch、SHA-256 校验并由 p5 解码为 960×640 像素；480×270 采样缓冲的每一列分别按亮度和色相重排，单调性错误为零且各有超过 12.8 万像素发生位置变化。真人 hover、捕获拖拽、键盘与模式按钮直接拥有边界和排序缓冲，首帧保持原图且无自动扫描、fallback、合成输入或预览时钟变更。'
  },
  {
    id: 'kinetic-variable-font-axis', order: 142, name: 'North Quay wayfinding type fit', nameZh: 'North Quay 导视字形适配台', category: 'vector', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: '把自动变化的四字母试样变成真实导视决策：交通站照片的亮度、明暗比例、对比度和边缘密度计算推荐 WDTH/WGHT，用户再逐字调整并获得可解释的场景适配分。',
    behavior: { trigger: 'trusted captured pointer drag, ranges, keyboard, or visible match/reset control', response: 'Tune each NORTH QUAY glyph across width and weight, compare it with the pixel-derived scene recommendation, then explicitly match or reset the proof', timing: 'finite human-owned Motion transitions that settle after every input', layer: 'full-stage concourse image, draggable specimen, per-glyph typography, measured axes, score, ranges, and controls' },
    prompt: '制作一个全舞台公共导视字形适配台：同源加载并精确校验一张 ImageGen 海岸交通站照片，用 96×64 像素的亮度、暗部/亮部比例、方差和边缘密度计算推荐 WDTH/WGHT；真人通过捕获式鼠标/触控/笔拖动、双 range、键盘及 Match Scene/Reset 调整十个字形。每个 glyph 必须写入独立 font-variation-settings，并用有限 Motion 变换落稳；首帧静止，禁止 autoplay、fallback、合成输入或预览时钟变异。',
    implementation: motionImplementation("glyphs.forEach((glyph, i) => { glyph.style.fontVariationSettings = `'wght' ${localWeight(i)}, 'wdth' ${localWidth(i)}`; animate(glyph, { scaleX: axisScale(i), y: baselineLift(i), rotate: tilt(i) }, { duration: .18 }); });", 'https://github.com/motiondivision/motion'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 交通站照片经过同源 fetch、精确源 SHA 与浏览器解码，并读取为 96×64 / 6,144 像素；亮度、方差、暗亮比例和边缘密度真实给出推荐轴值与适配目标。可信捕获拖拽、原生 range、键盘和可见按钮可修改十个 glyph 的独立字重/字宽与 Motion 变换，最终 100% 分数由当前轴和像素建议的距离计算，而非自动时间线。'
  },
  {
    id: 'animated-bezier-route-cartography', order: 143, name: 'Northpass cold-chain route check', nameZh: 'Northpass 冷链路线检查', category: 'vector', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: '把抽象贝塞尔曲线变成一条 14.8 公里的虚构高山冷链交付路线：路线描边、药箱位置与切线朝向共享真实 SVG 弧长，三个检查点还会切换同一张现场图集中的对应像素证据。',
    behavior: { trigger: 'trusted captured pointer scrub, range, keyboard, or station control', response: 'Inspect any route position while depot, ridge, and clinic evidence stay synchronized to the nearest checkpoint', timing: 'human-owned, paused and reversible arc-length seek', layer: 'full-stage SVG map plus decoded checkpoint evidence' },
    prompt: '制作一条可人工检查的冷链配送路线：鼠标、触控笔或手指沿 SVG 路线捕获拖动，也可用滑杆、键盘和站点按钮往返；以 getTotalLength/getPointAtLength 同步描边、药箱切线与里程，并真实加载一张 ImageGen 三联现场图集，把所选站点绑定到对应裁切及像素证据。首帧静止，不自动播放。',
    implementation: motionImplementation("const routeMotion = animate(route, { strokeDashoffset: [routeLength, 0] }, { duration: 1, ease: 'linear', autoplay: false }); routeMotion.pause(); routeMotion.time = progress; courier.setAttribute('transform', tangentTransform(progress));", 'https://github.com/motiondivision/motion', 'svg'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '一张原创 ImageGen 三联现场图被同源 fetch、精确 SHA 校验、浏览器解码并分成三个 64×64 像素证据裁切；虚构仓库、山脊中转与诊所照片随最近站点真实切换。真人捕获拖拽、range、键盘和站点按钮可在路线任意位置停留和反向，暂停的 Motion 控制器同时驱动路线描边，SVG 弧长还统一约束药箱坐标、切线、里程和检查点，没有 autoplay、排练、fallback、合成输入或预览时钟变异。'
  },
  {
    id: 'cellular-automata-hover-bloom', order: 144, name: 'North Roof recovery field lab', nameZh: 'North Roof 屋顶恢复实验场', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '把自动闪烁的抽象元胞变成一座可人工操作的屋顶更新实验场：航拍图的真实像素决定每格的耐受度、湿度、热风险和禁种通道，用户亲手播种、擦除并逐代推进。',
    behavior: { trigger: 'trusted hover, captured pointer paint, range, keyboard, or visible control', response: 'Probe roof evidence, paint only viable plots, adjust tolerance, then advance, undo, or reset one finite generation at a time', timing: 'human-stepped, static between inputs, and reversible', layer: 'full-stage p5 roof image, pixel-classified automaton, probe, and lab controls' },
    prompt: '制作一个全舞台绿色屋顶更新实验台：同源加载并精确校验一张 ImageGen 航拍图，用浏览器像素采样把颜色转成可种植、热胁迫、潮湿通道和检修路，再让真人通过鼠标/触控/笔捕获拖画、键盘、耐受度滑杆和 Step/Undo/Reset 控件有限推进元胞。首帧与每次操作后保持静止，禁止 autoplay、排练、fallback、合成输入或预览时钟驱动。',
    implementation: p5Implementation("p.noLoop(); const evidence = sampleRoofPixels(sourceImage); stage.addEventListener('pointermove', paintOnlyFromTrustedInput); stepButton.addEventListener('click', () => { field = evolveOneGeneration(field, evidence, tolerance); p.redraw(); });", 'https://github.com/processing/p5.js'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 屋顶图经过同源 fetch、精确源 SHA、浏览器与 p5 双解码，并被读取为 96×54 像素证据；每个 2×2 样本块真实决定 48×27 网格中的适生度、湿度、热风险、检修路排除及局部生灭阈值。可信 hover、捕获式鼠标/触控/笔拖画、键盘、range 与可见 Step/Undo/Reset 控件共同拥有探测、播种、擦除、规则和代际，所有结果都停住等待下一次输入。'
  },
  {
    id: 'spring-loaded-split-flap-counter', order: 145, name: 'Harbor Hall seat-release proof', nameZh: 'Harbor Hall 座席放票核验', category: 'animation', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: '四位机械翻牌现在服务于一次真实的放票决策：浏览器从五区座席证据板的像素分类算出 verified ceiling，用户检查分区、拖动草案并显式 Sync，而不是让无来源的数字定时自转。',
    behavior: { trigger: 'trusted proof hover, captured mouse/touch/pen range drag, keyboard, or visible decrement/increment/sync/proof control', response: 'Inspect a pixel-derived seat zone, draft a bounded release count, commit it, or restore the verified ceiling', timing: 'finite human-triggered staggered split-flap transitions with stable rest states', layer: 'full-stage venue proofboard, release planner, and four Motion split flaps' },
    prompt: '制作 Harbor Hall 虚构座席放票核验台。浏览器同源加载并校验一张 ImageGen 五区座席图，在 96×64 像素中分类 teal、mint、amber、coral 与 neutral，使用分类数量计算可放票上限，并让当前检查像素决定翻牌材质。仅允许可信 hover、捕获 range drag、mouse/touch/pen、键盘和可见按钮修改草案、Sync 或恢复证据值；四位 Motion split-flap 只执行有限的人类触发过渡，首帧静止。',
    implementation: motionImplementation("const controls = digits.flatMap((flap, i) => buildPausedFlip(flap, from[i], to[i])); controls.forEach(control => control.play());", 'https://github.com/motiondivision/motion'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 960×640 虚构场馆座席证据板经同源 fetch、精确源 SHA、浏览器解码与 96×64 全像素读取；五类像素数量直接计算 verified ceiling，分区均色与悬停源像素决定翻牌面材质和状态。真人 hover、捕获 mouse/touch/pen range、键盘、±10、Sync 与 Proof 可制定、提交和恢复计划，四位暂停构建的 Motion 翻牌只在输入后有限落位，无 autoplay、排练、fallback、合成输入或预览时钟变异。'
  },
  {
    id: 'caustic-light-card-surface', order: 146, name: 'Hydro optical material reader', nameZh: 'Hydro 水下材质光学检查', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '焦散不再悬浮于样板卡面：一张五材质水下校准板的真实像素同时决定局部材质、IOR、散射、折射位移与波线形态，用户亲自移动探头并改变深度。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen drag, keyboard, depth range, or visible controls', response: 'Move a refractive inspection lens across pixel-derived glass, stone, ceramic, rubber, metal, and water responses', timing: 'human-held, reversible optical states with no autonomous drift', layer: 'full-stage decoded material plate and p5 caustic lens' },
    prompt: '制作 Hydro 虚构水下材质光学检查台。同源加载并精确校验一张 ImageGen 五材质校准板，用浏览器与 p5 解码，读取 96×54 像素的亮度、邻域梯度和色度来分类材质并计算 IOR、散射与焦散响应。仅允许可信 hover、捕获 mouse/touch/pen 拖动、键盘、深度 range 和可见按钮移动探头、聚焦及调深；每个结果可以停留和复位，首帧静止。',
    implementation: p5Implementation("const local = samplePixelField(probe); drawRefractedSource(p, local); drawPixelBoundCausticBands(p, local.roughness, local.response);", 'https://github.com/processing/p5.js'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 960×640 五材质水下校准板经同源 fetch、精确源 SHA、浏览器与 p5 双解码，并读取 5,184 个派生像素；每个像素的亮度、粗糙度与色度真实绑定材质类别、折射率、散射、局部放大位移及 600+ 个焦散顶点。真人 hover、捕获拖拽、键盘、range、深浅按钮与 Reset 拥有完整光学状态，无 autoplay、排练、fallback、合成输入或预览时钟变异。'
  },
  {
    id: 'cursor-drawn-constellation-thread', order: 147, name: 'North Spur night-route calibration', nameZh: 'North Spur 夜间星路校准', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '星线不再追着指针任意连点：一张夜间观测底片的真实局部亮度峰生成 18 颗候选星及严格从西向东的六段校准路线，只有按顺序穿过像素目标才能确认。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen route trace, keyboard, or visible undo/reset/confirm controls', response: 'Acquire six pixel-derived navigation fixes in order, inspect confidence, undo mistakes, and explicitly seal the corridor', timing: 'human-paced retained route construction with no autonomous stitching', layer: 'full-stage p5 observation plate, target rings, route and mission evidence' },
    prompt: '制作 North Spur 虚构夜间导航校准台。同源加载并精确校验一张 ImageGen 北大西洋星空底片，用浏览器与 p5 解码 160×90 像素，提取局部亮度峰、筛出 18 颗空间分离候选星，并按像素坐标构造六个西向东 fix。仅允许可信 hover、捕获 mouse/touch/pen 拖线、键盘与 Undo/Reset/Confirm 操作；错误顺序拒绝，完整路线必须显式确认，首帧静止。',
    implementation: p5Implementation("const candidates = selectSeparatedLocalMaxima(sourcePixels, 18); const route = buildWestToEastFixes(candidates, 6); drawHumanTrace(p, route, acquiredFixCount);", 'https://github.com/processing/p5.js'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 960×640 夜间观测底片经同源 fetch、精确源 SHA、浏览器+p5 双解码与 14,400 像素读取；599 个局部峰筛成 18 颗候选星，像素亮度/对比度决定置信度与六段严格递增路线。真人 hover、捕获拖线、键盘及 Undo/Reset/Confirm 可采集、撤销、复补和封存路线，无 autoplay、排练、fallback、合成输入或预览时钟变异。'
  },
  {
    id: 'elastic-voronoi-focus-mosaic', order: 148, name: 'Coastscan restoration evidence field', nameZh: 'Coastscan 海岸修复证据场', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '弹性分区不再包裹随机色块：一张海岸修复航拍图的真实局部像素为 13 个 power-diagram 区域提供色彩、地貌分类与置信度，焦点扩张用于放大并锁定调查证据。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen drag, keyboard, or previous/next/lock/reset controls', response: 'Elastic power cells reallocate area around dune, basalt, tidal, marsh, and wrack evidence while preserving a lockable selection', timing: 'human-driven finite focus transitions that settle and can reverse', layer: 'full-stage p5 survey image clipped through weighted Voronoi cells' },
    prompt: '制作 Coastscan 虚构海岸修复证据检查台。同源加载并精确校验一张 ImageGen 航拍调查图，用浏览器与 p5 解码；在 13 个固定 site 周围各读取 15×15 像素，把均色、亮度与色度分类为沙丘、玄武岩、潮水、盐沼或漂积线并计算置信度。仅允许可信 hover、捕获 mouse/touch/pen 拖动、键盘与 Prev/Next/Lock/Reset 改变加权 power diagram 焦点和锁定结果；首帧静止。',
    implementation: p5Implementation("const evidence = sites.map(site => classify(samplePixels(site, 15))); const cells = weightedPowerDiagram(sites, focusedIndex, focusPower); drawClippedSurvey(p, image, cells, evidence);", 'https://github.com/processing/p5.js'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 960×640 海岸修复航拍图经同源 fetch、精确源 SHA、浏览器+p5 双解码；13 个 site 各读取 225 个真实像素，派生地貌、置信度与可视叠色。13 区 power diagram 覆盖 3,600 个审计格并保有有效邻接，真人 hover、捕获拖动、键盘和锁定按钮可放大、切换、固定与复位证据，无 autoplay、排练、fallback、合成输入或预览时钟变异。'
  },
  {
    id: 'chromatic-channel-drag-portrait', order: 149, name: 'Chromatic channel drag portrait', nameZh: '色彩通道拖拽肖像', category: 'canvas', sourceUrl: 'https://github.com/akella/fake3d',
    difference: '本地原创肖像的真实像素被拆为 R/G/B 三张通道缓冲，以 screen 模式在固定绿色注册层两侧反向位移；不是 CSS 阴影故障或三张带色复制图。',
    behavior: { trigger: 'pointer drag, touch drag, or arrow-key hold', response: 'Red and blue portrait channels separate around a fixed green registration layer', timing: 'continuous chromatic parallax with spring registration', layer: 'raster portrait canvas' },
    prompt: '加载本地原创肖像并从像素拆出红、绿、蓝通道；拖拽时红蓝层围绕固定绿色层反向分离，释放后用确定性弹簧回到精准套准。',
    implementation: p5Implementation("const { red, green, blue } = extractRgbChannels(imageData); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(red, -shift, 0); ctx.drawImage(green, 0, 0); ctx.drawImage(blue, shift, 0);", 'https://github.com/akella/fake3d'),
    scores: score(18, 19, 18, 15, 15, 10), rationaleZh: '真实肖像的发丝、面部与肩线提供稳定参照，拖拽或键盘输入后的通道分离和弹簧归位都清晰可辨。'
  },
  {
    id: 'procedural-folding-kaleidoscope', order: 150, name: 'Wrapping-print folding sampler', nameZh: '包装印刷万花筒取样器', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '不再自动重组程序色块；一张真实包装印刷母版被局部取样并裁进成对镜像扇区，真人拖拽同时选择母版区域和 4–10 折拓扑，得到可复核的印刷纹样。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen drag, keyboard, or visible fewer/more/reset buttons', response: 'Sample a different source area, change fold count, and rebuild an exact alternating mirror topology with live ink-coverage evidence', timing: 'human-owned immediate p5 redraws that remain still between inputs', layer: 'full-stage p5 print sampler, source preview, mirrored sectors, fold readout, ink verdict, and controls' },
    prompt: '制作一个全舞台包装印刷万花筒取样器：同源加载并精确校验一张 ImageGen 960×960 包装母版，创建真实 p5.Image，读取局部色彩、亮度与墨量，再用 Canvas clip、rotate 和 scale(-1,1) 把同一真实取样区域绘入 4–10 折/8–20 个交替镜像扇区。真人 hover、捕获 mouse/touch/pen 拖拽、键盘与 −/+/Reset 控制取样和折数；首帧及每次结果静止，禁止自动路径、播放、fallback、排练、合成输入或预览时钟变异。',
    implementation: p5Implementation("verifiedPrintmasterPixels -> sampledInkEvidence; trustedSample + foldCount -> clipped alternating mirror sectors with p5.noLoop", 'https://github.com/processing/p5.js'),
    scores: score(20, 20, 20, 15, 15, 10), rationaleZh: '原创 960×960 包装母版经同源 fetch、精确源 SHA 与 p5.Image 解码；当前局部像素真实决定色彩、亮度、墨量和 PRESS READY，折数决定 2× 面板、clip 与交替镜像拓扑。可信 hover、捕获拖拽、键盘和按钮拥有结果，完整舞台保持静止。'
  }
];
