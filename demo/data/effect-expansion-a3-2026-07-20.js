const scores = (creativity, artDirection, motion, clarity, inspiration, evidence) => ({ creativity, artDirection, motion, clarity, inspiration, evidence, total: creativity + artDirection + motion + clarity + inspiration + evidence });
const p5 = (snippet, referenceUrl) => ({ projectId: 'processing-p5-js', projectUrl: 'https://github.com/processing/p5.js', library: 'p5@2.3.0', renderer: 'canvas2d', snippet, referenceUrl });

export const effectExpansion150BatchA3 = [
  {
    id: 'kinetic-rain-letterpress', order: 111, name: 'Make-ready kinetic letterpress', nameZh: 'Make-ready 活版校样台', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '把自动坠落的散字变成可交付的 PROOFING 活版校样：真实棉纸与三种墨样像素决定纸面、墨色、吸墨率、压力目标、增益和最终 PASS/HOLD。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen slug drop, keyboard, native pressure range, sampled ink button, or visible Rain step/Undo/Reset control', response: 'Select and lower a type slug, advance the remaining letters in finite steps, tune impression pressure, switch source-sampled ink, and approve only when all eight impressions meet the pixel-derived stock target', timing: 'human-owned p5 noLoop redraws that remain static and reversible after input', layer: 'full-stage decoded cotton proof, eight live type slugs and impressions, ink rail, pressure control, make-ready evidence, and disposition' },
    prompt: '制作一个全舞台数字活版 Make-ready 工作台：同源加载并精确校验一张 ImageGen 棉纸校样图，读取 96×54 像素中的纸张区与 Navy/Rust/Graphite 三个墨样区，派生纸面纹理、吸墨率、压力目标、墨色、增益和 PASS/HOLD。真人通过 hover、捕获式鼠标/触控/笔向下拖动字模、键盘、原生 pressure range、墨色按钮和 Rain step/Undo/Reset 控件逐字完成 PROOFING；p5 必须 noLoop，只按输入重绘，禁止自动坠落、循环、排练、fallback、合成输入或预览时钟变更。',
    implementation: p5("p.noLoop(); const stock = samplePaperAndThreeInkRegions(sourcePixels); stage.addEventListener('pointermove', dropSlugOnlyFromCapturedTrustedInput); stepButton.addEventListener('click', () => { advanceFiniteMakeReadyStep(); p.redraw(); });", 'https://github.com/processing/p5.js'),
    scores: scores(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 棉纸校样经同源 fetch、精确源 SHA、浏览器 decode 与 96×54 / 5,184 像素读取；中央纸张区和三块墨样真实决定画布基材、墨色、吸墨率、约 68 的压力目标、墨迹增益与结论。可信 hover、捕获拖拽、键盘、range、墨色和 Step/Undo/Reset 使八字母校样有限推进、可逆且输入后保持。'
  },
  {
    id: 'recursive-arc-forest-growth', order: 112, name: 'Coastal canopy regeneration transect', nameZh: '海岸林冠递归再生样带', category: 'canvas', sourceUrl: 'https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js',
    difference: '把自动长出的五棵占位树改为真人操作的海岸林冠再生审阅：真实样带像素生成五个 habitat profile，并决定每棵递归树的深度、spread、bend、颜色、适宜度和 ESTABLISHED 结论。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen drag, keyboard, native growth range, or visible Grow/Prune/Reset controls', response: 'Select a habitat plot, scrub growth and wind, change depth budget, and inspect pixel-derived recursive branch coverage and regeneration verdict', timing: 'human-owned p5 noLoop redraws that remain static between inputs', layer: 'full-stage decoded canopy transect, five recursive trees, habitat probe, depth/branch/verdict evidence, and controls' },
    prompt: '制作一个全舞台海岸林冠再生样带：同源加载并精确校验一张 ImageGen 林冠航拍图，浏览器与 p5 双解码并读取 90×60 像素，按五个连续 plot 计算 RGB、greenness、moisture、texture、depth、spread、bend 和 suitability。真人通过 hover、捕获式鼠标/触控/笔拖拽、键盘、原生 growth range 与 Grow/Prune/Reset 控制 plot、生长、风和递归深度；p5 必须 noLoop，首帧和每个结果保持静止，禁止自动生长、播放、排练、fallback、合成输入或预览时钟变更。',
    implementation: p5("verifiedCanopyPixels -> fiveHabitatProfiles; trustedGrowthWindDepth -> finite recursive quadraticCurveTo forest redraw with p5.noLoop", 'https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js'),
    scores: scores(20, 20, 20, 15, 15, 10), rationaleZh: '原创林冠样带经同源 fetch、精确源 SHA、浏览器与 p5 双解码及 90×60 像素读取；五区的真实色彩与纹理决定递归深度、姿态、颜色和再生适宜度。可信拖拽、range、键盘和按钮拥有 571 枝的完整再生过程与 ESTABLISHED 结论，画面输入后保持静止。'
  },
  {
    id: 'pointer-woven-ribbon-loom', order: 113, name: 'Pointer woven ribbon loom', nameZh: '指针编织彩带织机', category: 'pointer', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '横向经线和纵向纬线以不同相位真实交错，指针改变两组丝带弯曲幅度，而非网格扭曲滤镜。',
    behavior: { trigger: 'pointer horizontal position', response: 'Warp and weft ribbons bend through opposing phase fields while retaining weave order', timing: 'continuous reversible textile deformation', layer: 'woven canvas field' },
    prompt: '绘制十二条经线与八条纬线，使用虚线相位制造上下交织关系，并让指针控制流体弯曲幅度。',
    implementation: p5("new p5(p => { p.draw = () => drawWarpAndWeft(p.drawingContext, pointerBend); });", 'https://github.com/processing/p5.js'),
    scores: scores(19, 20, 19, 15, 15, 10), rationaleZh: '经纬拓扑与纺织色彩形成鲜明主体，交织而非叠线的结构可以直接辨认。'
  },
  {
    id: 'polar-waveform-sundial', order: 122, name: 'Acoustic daylight window finder', nameZh: '声学日光录音窗口', category: 'canvas', sourceUrl: 'https://github.com/d3/d3-shape',
    difference: '把自动旋转的数学波形改为可测量的录音时段选择器：同一块真实声学响应盘的环向像素产生 256 个能量采样、频段结论、安静时刻与影针，而不是装饰性正弦波。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen orbit drag, keyboard, native frequency range, or visible Quiet/Mark/Reset control', response: 'Inspect local energy, move the selected recording phase, resample a frequency-dependent ring, jump to the quietest source-backed time, and explicitly mark the window', timing: 'human-owned finite p5 redraws that remain static between inputs', layer: 'full-stage acoustic response plate, polar waveform, gnomon, time and energy readouts, frequency control, and retained mark' },
    prompt: '制作一个全舞台声学日光录音窗口选择器：同源加载并精确校验一张 ImageGen 同心声学响应盘，读取 120×80 像素，以 256 个角度、每角三层径向采样计算波形能量，并让 frequency range 改变采样半径与低/中/高频结论。真人通过 hover、捕获式鼠标/触控/笔环向拖动、键盘、原生频率 range 和 Quiet/Mark/Reset 控件选择、标记与复位录音时刻；首帧和所有结果保持静止，禁止自动旋转、播放、排练、fallback、合成输入或预览时钟变更。',
    implementation: p5("p.noLoop(); const waveform = Array.from({ length: 256 }, (_, i) => sampleThreeRadialPlatePixels(source, i, frequencyBand)); stage.addEventListener('pointermove', seekPhaseFromTrustedHumanInput); p.redraw();", 'https://github.com/processing/p5.js'),
    scores: scores(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 声学响应盘经同源 fetch、精确源 SHA、浏览器与 p5 双解码，并读取为 120×80 / 9,600 像素；真实环纹在 256 个角度、三层半径上的能量决定低/中/高频响应、安静时刻、波形和影针。可信 hover、捕获拖拽、键盘、range 与 Quiet/Mark/Reset 全部触发有限 p5 重绘，首帧与结果都静止。'
  },
  {
    id: 'seeded-sandpile-avalanche', order: 123, name: 'Ridge 12 slope load cell', nameZh: 'Ridge 12 坡面负载实验场', category: 'canvas', sourceUrl: 'https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js',
    difference: '把居中的自动像素雪崩变成一块可探测、可加载、可单步和可撤销的坡面稳定性实验场；真实航拍像素为每格分类材质、风险与初始沙粒，而不是用一套同质规则填满画布。',
    behavior: { trigger: 'trusted hover, captured pointer deposition, range, keyboard, or visible load/step/undo/reset control', response: 'Probe source-defined terrain, deposit finite packets along a human path, advance one Abelian wave, then undo or restore the evidence field', timing: 'human-stepped finite toppling that stays still between inputs', layer: 'full-stage p5 terrain orthomosaic, 60×36 material/risk grid, retained load cells, probe, counts, and controls' },
    prompt: '制作一个全舞台坡面负载实验场：同源加载并精确校验一张 ImageGen 航拍坡面证据图，用 60×36 真实像素分类玄武岩、湿粉砂、基岩、松散碎石和干砂，派生风险与初始 Abelian 沙堆。真人通过 hover 探测、捕获式鼠标/触控/笔拖动加载、packet range、键盘及 Load/Step/Undo/Reset 控件有限推进四邻域释放；每次结果停住，禁止 autoplay、排练、fallback、合成输入或预览时钟变异。',
    implementation: p5("p.noLoop(); const terrain = sourcePixels.map(classifyMaterialAndRisk); stage.addEventListener('pointermove', depositOnlyFromCapturedTrustedInput); stepButton.addEventListener('click', () => { applyOneAbelianToppleWave(field); p.redraw(); });", 'https://github.com/processing/p5.js'),
    scores: scores(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 坡面图经过同源 fetch、精确源 SHA、浏览器与 p5 双解码，并读取为 60×36 / 2,160 像素；像素明度和色彩关系真实决定五类材质、局部风险、4,207 粒初始场以及之后的释放路径。可信 hover、捕获拖动、range、键盘和可见按钮拥有探测、加载、有限波、撤销与重置，所有状态静止等待下一次输入。'
  },
  {
    id: 'signed-distance-neon-metropolis', order: 124, name: 'Nocturne right-of-way clearance', nameZh: 'Nocturne 夜间通行余量检查', category: 'canvas', sourceUrl: 'https://github.com/terkelg/awesome-creative-coding',
    difference: '把六个假想矩形的自动霓虹轮廓改为真实夜间俯视图的可查询通行余量：暖色屋顶像素形成负距离建筑质量，暗色街道形成正距离开放空间。',
    behavior: { trigger: 'trusted hover, captured mouse/touch/pen drag, keyboard, native safety-buffer range, or visible Pin/Reset control', response: 'Move a probe through the pixel-derived signed-distance field, compare the measured margin with the selected buffer, and retain a CLEAR, TIGHT, or BLOCKED finding', timing: 'human-owned finite redraws that remain static between inputs', layer: 'full-stage p5 source atlas, signed-distance contours, probe, clearance verdict, safety buffer, and pin state' },
    prompt: '制作一个全舞台夜间城市通行余量检查器：同源加载并精确校验一张 ImageGen 俯视城市图，读取 128×72 像素，以暖亮屋顶生成建筑占用掩膜，以暗色街道生成开放空间，再计算带正负号的距离场、建筑连通块和边界。真人通过 hover、捕获式鼠标/触控/笔拖动、键盘、原生 safety-buffer range 与 Pin/Reset 控件移动探针，实时给出 CLEAR/TIGHT/BLOCKED 并保留结果；首帧与每次操作后必须静止，禁止自动 skyline、播放、排练、fallback、合成输入或预览时钟变更。',
    implementation: p5("p.noLoop(); const occupancy = sourcePixels.map(pixel => warmRoofMask(pixel)); const sdf = signedDistanceTransform(occupancy); canvas.addEventListener('pointermove', queryOnlyFromTrustedHumanInput); p.redraw();", 'https://github.com/processing/p5.js'),
    scores: scores(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 夜间俯视城市图经同源 fetch、精确源 SHA、浏览器与 p5 双解码，并读取为 128×72 / 9,216 像素；3,695 个建筑单元、5,521 个街道单元、22 个建筑质量块和正负距离共同生成真实查询场。可信 hover、捕获拖拽、键盘、range 与 Pin/Reset 决定探针、缓冲和结论，Canvas 全舞台覆盖且没有自动动画。'
  },
  {
    id: 'flowfield-paper-marbling', order: 125, name: 'Mizu Press marbling proof', nameZh: 'Mizu Press 纸纹打样台', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '把自动流动的抽象彩线变成一张可检验、可梳理、可批准的纸纹打样：真实颜料扫描像素决定每个流场单元、污染证据和初始质量分，用户的梳齿路径会被保留。',
    behavior: { trigger: 'trusted hover, captured pointer comb, range, keyboard, or visible proof control', response: 'Inspect source pigment, retain a comb path that deforms the pixel-built current, change tine count, then undo, reset, or explicitly approve the proof', timing: 'finite human-owned redraws that remain static between inputs', layer: 'full-stage p5 pigment scan, decoded-pixel flowfield, retained comb guides, evidence metrics, and proof controls' },
    prompt: '制作一个全舞台纸张大理石纹打样台：同源加载并精确校验一张 ImageGen 颜料/棉纸扫描，以 72×48 真实像素的色相、亮度、饱和度和局部梯度建立 3,456 个流场单元，派生颜料类别、污染比例和源质量分。真人通过 hover 探测、捕获式鼠标/触控/笔拖梳、梳齿 range、键盘及 Undo/Reset/Approve 控件留下可逆纹路；首帧和每次操作后静止，禁止 autoplay、排练、fallback、合成输入或预览时钟变异。',
    implementation: p5("p.noLoop(); const field = sourcePixels.map(pixel => pixelGradientAndPigmentVector(pixel)); canvas.addEventListener('pointermove', retainTrustedCombStroke); approveButton.addEventListener('click', decideFromPixelEvidenceAndRetainedStroke);", 'https://github.com/processing/p5.js'),
    scores: scores(20, 20, 20, 15, 15, 10), rationaleZh: '原创 ImageGen 颜料纸扫描经过同源 fetch、精确源 SHA、浏览器与 p5 双解码，并读取为 72×48 / 3,456 像素；真实色相、亮度、饱和度与相邻梯度决定颜料分类、污染证据、流向、流速、线色、线宽和源质量分。可信 hover、捕获拖梳、range、键盘和可见按钮共同拥有探测、保留形变、梳齿数量、撤销、重置与明确批准，没有自动流动。'
  }
];
