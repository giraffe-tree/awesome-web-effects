const scores = (creativity, artDirection, motion, clarity, inspiration, evidence) => ({ creativity, artDirection, motion, clarity, inspiration, evidence, total: creativity + artDirection + motion + clarity + inspiration + evidence });
const p5 = (snippet, referenceUrl) => ({ projectId: 'processing-p5-js', projectUrl: 'https://github.com/processing/p5.js', library: 'p5@2.3.0', renderer: 'canvas2d', snippet, referenceUrl });

export const effectExpansion150BatchA3 = [
  {
    id: 'kinetic-rain-letterpress', order: 111, name: 'Kinetic rain letterpress', nameZh: '动态字雨活版压印', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '字模受确定性重力下落并在纸面碰撞瞬间留下被压扁的墨迹，不是字符雨或普通打字动画。',
    behavior: { trigger: 'pointer pressure or animation frame', response: 'Falling type blocks stamp widening ink impressions when they strike paper', timing: 'continuous gravity cycles with discrete impacts', layer: 'letterpress canvas' },
    prompt: '使用固定字模数组实现下落、碰撞和压印；指针纵向位置控制重力强度，墨迹只在接触纸面时出现。',
    implementation: p5("new p5(p => { p.draw = () => typeBlocks.forEach(block => drawFallAndImpression(p, block, gravity)); });", 'https://github.com/processing/p5.js'),
    scores: scores(18, 19, 19, 15, 15, 10), rationaleZh: '下落字模、纸面基线与碰撞墨迹形成明确的活版因果，材质与动作均可辨。'
  },
  {
    id: 'recursive-arc-forest-growth', order: 112, name: 'Recursive arc forest growth', nameZh: '递归弧线森林生长', category: 'canvas', sourceUrl: 'https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js',
    difference: '五棵树使用弯曲二次贝塞尔分枝并按递归深度逐层生长，区别于直线 L-system 或粒子枝条。',
    behavior: { trigger: 'pointer progress or animation frame', response: 'Curved branches recursively bifurcate from trunks to fine canopy arcs', timing: 'depth-staged deterministic growth', layer: 'generative forest canvas' },
    prompt: '实现固定种子的七层递归树，使用 quadraticCurveTo 绘制弯曲分枝，并让进度按深度依次解锁。',
    implementation: p5("new p5(p => { p.draw = () => trees.forEach(tree => branch(p.drawingContext, tree, depth, progress)); });", 'https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js'),
    scores: scores(19, 19, 18, 15, 15, 10), rationaleZh: '递归层级、弧线姿态和多树构图在小画面中仍清楚，生成逻辑可复现。'
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
    id: 'polar-waveform-sundial', order: 122, name: 'Polar waveform sundial', nameZh: '极坐标波形日晷', category: 'canvas', sourceUrl: 'https://github.com/d3/d3-shape',
    difference: '双频波形被映射为闭合极坐标轮廓，同时由相位决定日晷阴影方向与长度，不是圆形音频均衡器。',
    behavior: { trigger: 'pointer phase or animation frame', response: 'A radial waveform reshapes while a central gnomon casts a phase-linked shadow', timing: 'continuous polar signal rotation', layer: 'signal sundial canvas' },
    prompt: '将两组正弦采样叠加到极坐标半径，并用同一相位驱动中央日晷阴影的角度和长度。',
    implementation: p5("new p5(p => { p.draw = () => drawPolarWaveAndShadow(p.drawingContext, phase); });", 'https://github.com/d3/d3-shape'),
    scores: scores(19, 19, 18, 15, 15, 10), rationaleZh: '声纹轮廓与日晷指针共享相位，科学仪器般的视觉语言完整。'
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
    id: 'signed-distance-neon-metropolis', order: 124, name: 'Signed distance neon metropolis', nameZh: '有符号距离霓虹都市', category: 'canvas', sourceUrl: 'https://github.com/terkelg/awesome-creative-coding',
    difference: '每个像素计算到六座矩形建筑并集的有符号距离，以边界距离产生霓虹光晕，而非预画线框城市。',
    behavior: { trigger: 'pointer height or animation frame', response: 'Signed distance contours illuminate building unions as the skyline shifts', timing: 'continuous analytical distance shading', layer: 'SDF city canvas' },
    prompt: '为六个矩形建筑实现 box SDF 与 min-union，在低分辨率栅格中按距离绝对值绘制霓虹边缘。',
    implementation: p5("new p5(p => { p.draw = () => rasterSdfUnion(p.drawingContext, buildings, skylineShift); });", 'https://github.com/terkelg/awesome-creative-coding'),
    scores: scores(19, 19, 18, 15, 15, 10), rationaleZh: '分析距离场直接形成建筑轮廓与光晕，机制与画面高度一致。'
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
