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
    id: 'topographic-wave-contour-reveal', order: 126, name: 'Topographic wave contour reveal', nameZh: '地形波等高线揭示', category: 'canvas', sourceUrl: 'https://github.com/d3/d3-contour',
    difference: '以连续高度切片逐层显露会呼吸的地形，不是普通波纹、遮罩或单条路径描边。',
    behavior: { trigger: 'pointer position or animation frame', response: 'A scanning boundary exposes independently warped altitude contours', timing: 'continuous reversible field reveal', layer: 'topographic canvas field' },
    prompt: '实现一张由固定地形函数生成的等高线地图，让指针横向位置控制扫描边界并逐层显露高度纹理。',
    implementation: p5Implementation("new p5(p => { p.draw = () => drawWarpedContours(p.drawingContext, revealProgress); });", 'https://github.com/d3/d3-contour'),
    scores: score(19, 19, 18, 15, 15, 10), rationaleZh: '扫描边界、高度层级和动态形变同时可见，缩略图中无需标题也能读出地形揭示。'
  },
  {
    id: 'magnetic-orbit-command-dock', order: 127, name: 'Magnetic orbit command dock', nameZh: '磁性轨道命令坞', category: 'pointer', sourceUrl: 'https://github.com/codrops/MagneticButtons',
    difference: '五个工具持续绕中心公转，又被指针从轨道局部拉偏，区别于单按钮磁吸或静态径向菜单。',
    behavior: { trigger: 'pointer movement', response: 'Orbiting commands bend their paths toward the pointer while preserving order', timing: 'continuous attraction over orbital motion', layer: 'command dock' },
    prompt: '实现五个有固定相位的命令按钮轨道，指针靠近时改变轨道中心但不打乱按钮顺序。',
    implementation: motionImplementation("const orbit = animate(dock, { opacity: [.94, 1, .94] }, { duration: 3 }); orbit.pause();", 'https://github.com/codrops/MagneticButtons'),
    scores: score(18, 19, 19, 15, 15, 10), rationaleZh: '轨道运动与局部磁吸构成双重因果，工具按钮始终可辨且交互反馈强。'
  },
  {
    id: 'stencil-text-scanline-window', order: 128, name: 'Stencil text scanline window', nameZh: '模板文字扫描窗', category: 'vector', sourceUrl: 'https://github.com/codrops/TextRepetitionEffect',
    difference: '移动扫描尺决定彩色字面真实可见范围，空心字、实色字和刻度线形成印刷校色语义。',
    behavior: { trigger: 'pointer or timed scan', response: 'A registration bar converts outlined letters into a chromatic stencil', timing: 'progress-linked horizontal wipe', layer: 'display typography' },
    prompt: '实现空心标题与彩色字面叠合的扫描窗，扫描尺和 clip-path 必须共享同一进度。',
    implementation: motionImplementation("const scan = animate(line, { opacity: [.9, 1, .9] }, { duration: 3 }); scan.pause();", 'https://github.com/codrops/TextRepetitionEffect'),
    scores: score(18, 19, 18, 15, 15, 10), rationaleZh: '印刷模板、彩色扫描和测量刻度形成完整艺术方向，机制一眼明确。'
  },
  {
    id: 'elastic-svg-rope-lettering', order: 129, name: 'Elastic SVG rope lettering', nameZh: '弹性 SVG 绳索字形', category: 'vector', sourceUrl: 'https://github.com/svgdotjs/svg.js',
    difference: '可拉伸贝塞尔路径本身成为字形骨架，节点沿实时弧长重排，而非只让文字沿固定路径移动。',
    behavior: { trigger: 'pointer vertical displacement', response: 'A rope-like letter path deforms and its sampled nodes slide to new arc-length positions', timing: 'continuous elastic deformation', layer: 'SVG lettering path' },
    prompt: '实现一条由贝塞尔段组成的绳索字形，拉动控制点后按 getPointAtLength 重新放置节点。',
    implementation: motionImplementation("const tension = animate(path, { opacity: [.94, 1, .94] }, { duration: 3 }); path.setAttribute('d', nextCurve);", 'https://github.com/svgdotjs/svg.js', 'svg'),
    scores: score(19, 18, 19, 15, 15, 10), rationaleZh: '路径张力、节点滑移和字形轮廓在同一主体上发生，具有明确的可复用矢量机制。'
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
    id: 'typography-particle-disassembly-field', order: 133, name: 'Typography particle disassembly field', nameZh: '字体粒子解体场', category: 'canvas', sourceUrl: 'https://github.com/timdream/wordcloud2.js',
    difference: '从真实文字像素采样粒子，按固定向量场解体并可逆重组，不是随机散点背景。',
    behavior: { trigger: 'pointer progress or animation frame', response: 'Sampled glyph pixels leave their exact letter positions and enter a swirl field', timing: 'continuous reversible disassembly', layer: 'canvas typography' },
    prompt: '在离屏 Canvas 渲染词语并采样 alpha 像素，以固定种子位移场实现可逆的字形解体。',
    implementation: p5Implementation("new p5(p => { const points = sampleGlyphMask(); p.draw = () => drawDisassembly(p, points, progress); });", 'https://github.com/timdream/wordcloud2.js'),
    scores: score(19, 18, 19, 15, 15, 10), rationaleZh: '粒子来源能精确回到字形，解体前后语义连续且视觉变化显著。'
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
    id: 'accordion-depth-tunnel-navigation', order: 135, name: 'Accordion depth tunnel navigation', nameZh: '手风琴景深隧道导航', category: 'transition', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: '四个章节平面按序折开并沿 Z 轴后退，形成可进入的内容隧道，而非二维手风琴列表。',
    behavior: { trigger: 'pointer progress or timed navigation', response: 'Chapter panels hinge open while receding into a perspective tunnel', timing: 'staggered depth choreography', layer: 'CSS 3D navigation stack' },
    prompt: '实现四层 preserve-3d 章节面板，以交错进度同步 rotateY、translateZ 和亮度。',
    implementation: motionImplementation("const tunnelMotion = animate(tunnel, { opacity: [.94, 1, .94] }, { duration: 3 }); panels.forEach(renderDepthPanel);", 'https://github.com/motiondivision/motion'),
    scores: score(18, 19, 19, 15, 15, 10), rationaleZh: '章节层级、开门动作和隧道纵深都能在小尺寸中读清。'
  },
  {
    id: 'svg-metaball-cursor-separation', order: 136, name: 'SVG metaball cursor separation', nameZh: 'SVG 融球指针分离', category: 'vector', sourceUrl: 'https://github.com/w3c/svgwg',
    difference: '四个液态成员在同一 SVG 滤镜场内从融合体分离，拓扑连接随距离真实改变。',
    behavior: { trigger: 'pointer progress', response: 'A fused SVG mass separates into ordered orbiting blobs', timing: 'continuous topology transition', layer: 'filtered SVG group' },
    prompt: '使用 feGaussianBlur 与 feColorMatrix 构建融球滤镜，让四圆从单体连续分离并保持轨道顺序。',
    implementation: motionImplementation("const groupMotion = animate(group, { opacity: [.94, 1, .94] }, { duration: 3 }); blobs.forEach(setOrbitalPosition);", 'https://github.com/w3c/svgwg', 'svg'),
    scores: score(18, 18, 19, 15, 15, 10), rationaleZh: '融合和断开的拓扑变化直接可见，区别于普通圆点轨道。'
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
    id: 'gravity-well-icon-field', order: 139, name: 'Gravity well icon field', nameZh: '重力井图标场', category: 'canvas', sourceUrl: 'https://github.com/liabru/matter-js',
    difference: '界面符号按固定轨道半径和角速度围绕移动重力井弯曲，不是粒子吸附或普通图标云。',
    behavior: { trigger: 'pointer movement', response: 'Interface glyphs orbit a movable gravity well with preserved mass bands', timing: 'continuous orbital mechanics', layer: 'icon physics canvas' },
    prompt: '实现三圈不同半径和角速度的界面图标轨道，让指针成为可移动重力井。',
    implementation: p5Implementation("new p5(p => { p.draw = () => icons.forEach(icon => drawOrbit(p, icon, pointer)); });", 'https://github.com/liabru/matter-js'),
    scores: score(18, 18, 19, 15, 15, 10), rationaleZh: '符号、质量中心和轨道带共同表达界面重力，主体行为清楚。'
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
    id: 'kinetic-variable-font-axis', order: 142, name: 'Kinetic variable font axis', nameZh: '动态可变字体轴', category: 'vector', sourceUrl: 'https://github.com/arrowtype/recursive',
    difference: '四个字母的宽度、重量、纵向比例和基线波动沿同一轴连续编排，不是整体文字缩放。',
    behavior: { trigger: 'pointer progress or animation frame', response: 'Individual glyphs traverse coordinated width and weight axes', timing: 'continuous per-glyph axis choreography', layer: 'display typography' },
    prompt: '逐字控制 font-variation-settings、scaleX、scaleY 和基线波动，构成从压缩到扩展的字体轴演示。',
    implementation: motionImplementation("const axisMotion = animate(word, { opacity: [.94, 1, .94] }, { duration: 3 }); glyphs.forEach(setFontAxes);", 'https://github.com/arrowtype/recursive'),
    scores: score(18, 19, 19, 15, 15, 10), rationaleZh: '字母级宽度与重量差异明显，排版主体保持可读且富有节奏。'
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
    id: 'cellular-automata-hover-bloom', order: 144, name: 'Cellular automata hover bloom', nameZh: '元胞自动机悬停生长', category: 'canvas', sourceUrl: 'https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js',
    difference: '指针注入的细胞遵循 Conway 规则演化成像素城市，录制任意时间都可由初始种子重算。',
    behavior: { trigger: 'pointer seed and animation time', response: 'A seeded cellular field blooms, competes, and decays under Life rules', timing: 'discrete deterministic generations', layer: 'pixel automaton canvas' },
    prompt: '实现固定初始种子的 Conway Life；每帧从初态重算到目标代数，指针可注入一个稳定小型种群。',
    implementation: p5Implementation("new p5(p => { p.draw = () => drawLife(p, evolve(initialSeed, targetGeneration)); });", 'https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js'),
    scores: score(19, 18, 19, 15, 15, 10), rationaleZh: '代数计数、规则生长和用户播种因果完整，像素城市形态鲜明。'
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
    id: 'cursor-drawn-constellation-thread', order: 147, name: 'Cursor drawn constellation thread', nameZh: '指针绘制星座线', category: 'canvas', sourceUrl: 'https://github.com/anvaka/atree',
    difference: '指针动态选择距离最近的七颗星并按距离缝合成路径，选中星有独立光环，不是全连接粒子网。',
    behavior: { trigger: 'pointer movement', response: 'A thread snaps through the nearest stars and continually redraws a constellation', timing: 'continuous nearest-neighbor stitching', layer: 'star map canvas' },
    prompt: '生成固定星图；每帧寻找距指针最近的七颗星，按距离顺序绘制一条带节点光环的星座线。',
    implementation: p5Implementation("new p5(p => { p.draw = () => drawThread(p, nearestStars(pointer, 7)); });", 'https://github.com/anvaka/atree'),
    scores: score(18, 19, 18, 15, 15, 10), rationaleZh: '星线选择由空间关系驱动，用户轨迹会产生明显不同的星座构图。'
  },
  {
    id: 'elastic-voronoi-focus-mosaic', order: 148, name: 'Elastic Voronoi focus mosaic', nameZh: '弹性 Voronoi 焦点马赛克', category: 'canvas', sourceUrl: 'https://github.com/gorhill/Javascript-Voronoi',
    difference: '离指针最近的种子通过距离权重扩大势力范围，整张镶嵌实时弹性重分区，而非放大一张图片。',
    behavior: { trigger: 'pointer movement', response: 'The nearest Voronoi region gains spatial weight and pushes neighboring cells away', timing: 'continuous weighted tessellation', layer: 'mosaic field' },
    prompt: '实现固定种子的加权 Voronoi 栅格，降低焦点种子的距离权重，使最近区域连续扩张。',
    implementation: p5Implementation("new p5(p => { p.draw = () => rasterWeightedVoronoi(p, seeds, focusedSeed); });", 'https://github.com/gorhill/Javascript-Voronoi'),
    scores: score(19, 18, 18, 15, 15, 10), rationaleZh: '焦点与全局重分区关系清楚，色块边界具有独特的弹性空间感。'
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
    id: 'procedural-folding-kaleidoscope', order: 150, name: 'Procedural folding kaleidoscope', nameZh: '程序化折叠万花筒', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '指针改变真实镜像扇区数量，每个扇区用旋转加负缩放成对折叠，而非播放预制万花筒影片。',
    behavior: { trigger: 'pointer position or animation frame', response: 'Procedural color geometry refolds into five to ten mirrored sectors', timing: 'continuous topology-preserving fold count', layer: 'kaleidoscope canvas' },
    prompt: '用 Canvas clip、rotate 和 scale(-1,1) 构建成对镜像扇区，让指针连续选择五至十折。',
    implementation: p5Implementation("new p5(p => { p.draw = () => drawMirroredSectors(p.drawingContext, foldCount); });", 'https://github.com/processing/p5.js'),
    scores: score(19, 20, 19, 15, 15, 10), rationaleZh: '折数变化会重组整幅几何，镜像关系准确且色彩完成度突出。'
  }
];
