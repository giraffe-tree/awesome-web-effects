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
    id: 'cursor-heatmap-crystallization', order: 130, name: 'Cursor heatmap crystallization', nameZh: '指针热场晶化', category: 'canvas', sourceUrl: 'https://github.com/pa7/heatmap.js',
    difference: '热源距离连续决定三角晶体的尺寸、色相与旋转，不是常见圆形热图叠色。',
    behavior: { trigger: 'pointer movement', response: 'A moving thermal source crystallizes nearby triangles and lets distant cells decay', timing: 'continuous spatial falloff', layer: 'thermal lattice' },
    prompt: '实现固定种子三角晶格，按指针距离计算热量并驱动每片晶体的尺度、透明度和旋转。',
    implementation: p5Implementation("new p5(p => { p.draw = () => crystals.forEach(c => c.draw(p, heatAt(c, pointer))); });", 'https://github.com/pa7/heatmap.js'),
    scores: score(19, 19, 19, 15, 15, 10), rationaleZh: '热场被翻译为清晰的晶体生长语言，颜色和几何反馈均有因果。'
  },
  {
    id: 'peelable-paper-corner-reveal', order: 131, name: 'Peelable paper corner reveal', nameZh: '可剥纸张角揭示', category: 'pointer', sourceUrl: 'https://github.com/motiondivision/motion',
    difference: '纸面裁切、折角尺寸、阴影和下层档案同步变化，区别于卡片翻转或简单角标。',
    behavior: { trigger: 'drag or timed rehearsal', response: 'The lower corner peels back to expose a persistent second layer', timing: 'continuous reversible material gesture', layer: 'paper card surface' },
    prompt: '实现可拖动纸角，使用同一进度同步 clip-path、多边形折角尺寸、投影和下层显露。',
    implementation: motionImplementation("const peel = animate(fold, { opacity: [.94, 1, .94] }, { duration: 3 }); paper.style.clipPath = polygon;", 'https://github.com/motiondivision/motion'),
    scores: score(18, 19, 19, 15, 15, 10), rationaleZh: '材料厚度与下层内容通过几何和光影共同建立，动作有真实触感。'
  },
  {
    id: 'radial-calendar-time-zoom', order: 132, name: 'Radial calendar time zoom', nameZh: '径向日历时间缩放', category: 'vector', sourceUrl: 'https://github.com/d3/d3-shape',
    difference: '月份、周段和日期被编码到三层同心弧，指针沿角度选择一天，而不是线性时间轴。',
    behavior: { trigger: 'pointer progress', response: 'Concentric schedule arcs rotate beneath a needle and resolve one day', timing: 'continuous radial scrub with discrete date readout', layer: 'SVG calendar dial' },
    prompt: '实现三层同心日历弧和固定选针，横向输入映射到 360 度并更新离散日期。',
    implementation: motionImplementation("const dial = animate(svg, { opacity: [.94, 1, .94] }, { duration: 3 }); needle.setAttribute('transform', `rotate(${angle})`);", 'https://github.com/d3/d3-shape', 'svg'),
    scores: score(19, 18, 18, 15, 15, 10), rationaleZh: '径向结构使时间层级可视化，连续角度与离散日期的对应清楚。'
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
    id: 'liquid-lens-card-refraction', order: 134, name: 'Liquid lens card refraction', nameZh: '液态透镜卡片折射', category: 'pointer', sourceUrl: 'https://github.com/w3c/fxtf-drafts',
    difference: '不规则透镜移动时改变下方条纹的模糊、饱和度、色相和内反光，而非单纯玻璃卡。',
    behavior: { trigger: 'pointer movement', response: 'A deforming optical lens refracts the patterned card underneath', timing: 'continuous pointer-linked refraction', layer: 'card optical surface' },
    prompt: '实现可拖动不规则透镜，用 backdrop-filter、内阴影和动态边界共同表现折射。',
    implementation: motionImplementation("const lensMotion = animate(lens, { opacity: [.94, 1, .94] }, { duration: 3 }); lens.style.backdropFilter = filter;", 'https://github.com/w3c/fxtf-drafts'),
    scores: score(18, 19, 18, 15, 15, 10), rationaleZh: '高对比底纹让折射结果可核验，透镜边缘和材质语言完整。'
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
    id: 'scroll-stitched-isometric-blueprint', order: 140, name: 'Scroll stitched isometric blueprint', nameZh: '滚动拼装等轴蓝图', category: 'scroll', sourceUrl: 'https://github.com/jdan/isomer',
    difference: '五个架构模块从视口外按语义次序落入等轴坐标并组成一张蓝图，不是卡片入场。',
    behavior: { trigger: 'scroll progress or pointer vertical progress', response: 'Architecture blocks stitch into fixed isometric destinations', timing: 'staggered progress-linked assembly', layer: 'isometric blueprint' },
    prompt: '实现五个带标签的等轴模块，以滚动进度按序移动到固定网格并更新组装百分比。',
    implementation: motionImplementation("const assembly = animate(iso, { opacity: [.94, 1, .94] }, { duration: 3 }); blocks.forEach(stitchToGrid);", 'https://github.com/jdan/isomer'),
    scores: score(18, 19, 18, 15, 15, 10), rationaleZh: '蓝图网格、组件语义和组装次序共同构成可读的空间建设过程。'
  },
  {
    id: 'pixel-sort-hover-wipe', order: 141, name: 'Pixel sort hover wipe', nameZh: '像素排序悬停擦除', category: 'canvas', sourceUrl: 'https://github.com/snorpey/glitch-canvas',
    difference: '扫描线左侧真实按列重排像素亮度，右侧保持原始程序化图像，不是 CSS 拉伸故障。',
    behavior: { trigger: 'pointer position', response: 'A wipe boundary sorts completed image columns by luminance', timing: 'continuous reversible data transform', layer: 'image pixel buffer' },
    prompt: '生成固定程序化风景，按指针边界逐列读取像素并按亮度排序，再写回 ImageData。',
    implementation: p5Implementation("new p5(p => { p.draw = () => p.drawingContext.putImageData(sortColumns(source, progress), 128, 25); });", 'https://github.com/snorpey/glitch-canvas'),
    scores: score(19, 18, 18, 15, 15, 10), rationaleZh: '原图与排序结果并排可见，数据重排机制能够直接核验。'
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
    id: 'animated-bezier-route-cartography', order: 143, name: 'Animated Bezier route cartography', nameZh: '贝塞尔路线动态制图', category: 'vector', sourceUrl: 'https://github.com/Turfjs/turf',
    difference: '路线按真实 SVG 弧长被绘出，载具同时读取相邻点切线改变朝向，不是圆点沿 CSS 偏移路径。',
    behavior: { trigger: 'pointer progress or animation frame', response: 'A route draws forward while a vehicle follows its exact tangent', timing: 'continuous arc-length traversal', layer: 'SVG map' },
    prompt: '使用 getTotalLength 与 getPointAtLength 同步路线 dashoffset、载具位置和切线朝向。',
    implementation: motionImplementation("const mapMotion = animate(route, { opacity: [.94, 1, .94] }, { duration: 3 }); vehicle.setAttribute('cx', route.getPointAtLength(s).x);", 'https://github.com/Turfjs/turf', 'svg'),
    scores: score(18, 18, 19, 15, 15, 10), rationaleZh: '绘线、定位和朝向由同一弧长参数驱动，地图叙事明确。'
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
    id: 'spring-loaded-split-flap-counter', order: 145, name: 'Spring loaded split flap counter', nameZh: '弹簧加载翻页计数器', category: 'animation', sourceUrl: 'https://github.com/pqina/flip',
    difference: '三位数字各自错峰翻页并带旋转、下沉和亮度冲击，区别于普通数字补间。',
    behavior: { trigger: 'data update or animation frame', response: 'Mechanical digit flaps rotate and settle with phase-offset weight', timing: 'discrete staggered data transitions', layer: 'mechanical counter' },
    prompt: '实现三位 split-flap 数字，每位按相位错开 rotateX、下沉和亮度变化并更新读数。',
    implementation: motionImplementation("const counterMotion = animate(counter, { opacity: [.94, 1, .94] }, { duration: 3 }); flaps.forEach(renderMechanicalDigit);", 'https://github.com/pqina/flip'),
    scores: score(18, 19, 19, 15, 15, 10), rationaleZh: '机械分割线、立体翻页和错峰落位传达清楚的重量感。'
  },
  {
    id: 'caustic-light-card-surface', order: 146, name: 'Caustic light card surface', nameZh: '焦散光卡片表面', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '二十四条相干波线在卡片裁切区域内叠加出水下焦散，而不是通用渐变或噪声闪烁。',
    behavior: { trigger: 'pointer phase or animation frame', response: 'Layered wave fronts focus and drift across a submerged card', timing: 'continuous interference field', layer: 'card lighting surface' },
    prompt: '在圆角卡片裁切区内叠加多组相干正弦曲线，用 lighter 合成表现缓慢漂移的水下焦散。',
    implementation: p5Implementation("new p5(p => { p.draw = () => drawCausticWavefronts(p.drawingContext, phase); });", 'https://github.com/processing/p5.js'),
    scores: score(18, 20, 18, 15, 15, 10), rationaleZh: '水下材质、焦散层次和文字卡片形成完成度很高的光影场景。'
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
