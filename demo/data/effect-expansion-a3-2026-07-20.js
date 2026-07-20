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
    id: 'seeded-sandpile-avalanche', order: 123, name: 'Seeded sandpile avalanche', nameZh: '固定种子沙堆雪崩', category: 'canvas', sourceUrl: 'https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js',
    difference: '中心沙粒按 Abelian sandpile 四邻域规则反复崩塌，最终颜色直接编码每格余数，不是落沙物理。',
    behavior: { trigger: 'pointer grain count or animation frame', response: 'A central heap topples into deterministic four-color avalanche bands', timing: 'discrete relaxation to stable state', layer: 'cellular sandpile canvas' },
    prompt: '实现四邻域 Abelian sandpile；从中心加入确定数量沙粒，迭代到稳定态并按每格 0–3 余数着色。',
    implementation: p5("new p5(p => { p.draw = () => drawSandpile(p, stabilize(centerHeap(grainCount))); });", 'https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js'),
    scores: scores(19, 18, 19, 15, 15, 10), rationaleZh: '雪崩规则、粒数读数和四值色带构成可核验的离散系统，结果稳定。'
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
    id: 'flowfield-paper-marbling', order: 125, name: 'Flowfield paper marbling', nameZh: '流场纸面大理石纹', category: 'canvas', sourceUrl: 'https://github.com/processing/p5.js',
    difference: '七十条固定颜料流线逐步积分正弦向量场，并由指针模拟梳齿改变全局流向，不是 Perlin 噪声背景。',
    behavior: { trigger: 'pointer comb direction or animation frame', response: 'Pigment streams integrate through a combed vector field into marbled paper', timing: 'continuous deterministic streamline advection', layer: 'paper marbling canvas' },
    prompt: '用固定种子生成七十条颜料流线，逐步积分解析向量场；指针横向位置改变梳理项。',
    implementation: p5("new p5(p => { p.draw = () => streams.forEach(stream => integrateAndDraw(p, stream, comb)); });", 'https://github.com/processing/p5.js'),
    scores: scores(19, 20, 18, 15, 15, 10), rationaleZh: '纸张底色、颜料层次和可控梳理共同形成完整的大理石纹艺术效果。'
  }
];
