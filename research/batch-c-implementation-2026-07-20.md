# Batch C 27 个 Web 交互特效实现报告

日期：2026-07-20（Asia/Shanghai）

## 结论

- Batch C 稳定 ID：**27 / 27 已实现**。
- 运行依赖只使用仓库已固定的 `p5@2.3.0` 与 `motion@12.42.2`；计划中的 Three.js、D3、MediaPipe、gifuct-js 等仅保留为研究来源，没有被写成实际 demo runtime。
- 项目计数：`processing-p5-js` 22 项，`motiondivision-motion` 5 项。
- Renderer 计数：DOM 2、SVG 3、Canvas 2D 17、WebGL 5。
- 每项都是 3 秒确定性可 seek 循环，并暴露 `__PREVIEW_READY__`、`__PREVIEW_META__`、`__PREVIEW_RUNTIME_ASSERT__` 与 `__setPreviewTime`。
- JavaScript 静态语法门禁：**27 / 27 通过**。
- 浏览器 ready/META/runtime assertion/seek 门禁：**27 / 27 通过**，页面错误 0，console error 0。
- 代表性真实输入门禁：**27 / 27 通过**；每项在执行 range、pointer、drag、click、wheel 或 keyboard 输入后重新运行 assertion。

## 三个先行高风险样本

1. `slider-controlled-exploded-3d-assembly`：slider 连续映射七个有装配意义的轴，真实 p5 WebGL 几何体可 pointer orbit。
2. `refractive-glass-transmission-sculpture`：p5 WebGL 中运行 ray-marching SDF，GLSL `refract` 对程序化条纹环境做 IOR 与色散采样。
3. `live-hand-landmark-video-overlay`：p5 Canvas 产生 MediaStream，经 HTMLVideoElement 播放，再从视频像素做连通域检测，稳定恢复 21 个关节；没有预标注坐标直绘覆盖层。

手部样本在首次 contact sheet 中曾于约 33% 帧出现同色指节连通合并（20/21）。修复方式是降低卷曲姿态的指节挤压并将源 marker 直径从 5.2px 降为 3.8px。修复后在 `0 / .5 / .75 / 1 / 1.5 / 2 / 2.25 / 2.5 / 2.99s` 九个时刻逐帧验证，均为 **21 / 21** 且 runtime assertion 为真；没有通过复用旧坐标掩盖少检。

## 最终浏览器 QA

- C1–C9：9 / 9 通过。
- C10–C18：9 / 9 通过；修正两个 Motion 控制器的过严 duration 断言和 sticky scroll 的程序化事件误判后复测通过。
- C19–C27：9 / 9 通过；层级 Motion 控制器断言与手部检测合并问题修复后复测通过。
- 逐项核对 `__PREVIEW_META__` 的 ID、固定版本和 renderer；27 项均匹配 runtime JSON。
- 每项执行不少于五个 `__setPreviewTime` 时刻，画面哈希证明不是静态终帧；可逆往返效果允许对称时刻产生相同画面。
- 27 项均执行至少一种代表性真实输入，操作后 assertion 仍为真；累计页面错误 0、console error 0、runtime failure 0。

## 逐项 runtime 映射

| # | ID | 实际 projectId | 固定 library | renderer | 真实机制最小 snippet | 代表性交互 |
|---:|---|---|---|---|---|---|
| 1 | `slider-controlled-exploded-3d-assembly` | `processing-p5-js` | `p5@2.3.0` | `webgl` | parts.forEach(part => translate(...part.axis.map(v => v * progress))) | range drag、pointer orbit、arrow keys |
| 2 | `collision-reactive-3d-physics-stack` | `processing-p5-js` | `p5@2.3.0` | `webgl` | body.vy += gravity * dt; resolveContact(body, floor, collisionImpulse) | click spawn、Space strike |
| 3 | `refractive-glass-transmission-sculpture` | `processing-p5-js` | `p5@2.3.0` | `webgl` | vec3 transmitted = environment(refract(ray, normal, 1.0 / 1.45)); | pointer yaw、arrow keys |
| 4 | `cinematic-map-camera-fly-to` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | context.translate(center); context.scale(zoom, zoom * (1 - pitch)); context.rotate(bearing) | click fly、Enter toggle |
| 5 | `pickable-extruded-data-columns` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | active = columnPolygons.findIndex(polygon => pointInPolygon(pointer, polygon)) | pointer pick、arrow keys |
| 6 | `curved-3d-text-orbit` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | glyph.x = centerX + sin(angle) * radius; glyph.scale = depthToScale(cos(angle)) | pointer orbit、arrow keys |
| 7 | `cursor-projected-3d-surface-marker` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | normal = normalize([-dHeightDu, -dHeightDv, 1]); stamp(project(u, v, height(u,v))) | pointer raycast、click stamp |
| 8 | `drag-resizable-audio-loop-region` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | loopTime = region.start + phase * (region.end - region.start) | drag handles、drag region、Space audio |
| 9 | `streaming-line-chart-window` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | window = samples.slice(start, start + 60).map(interpolateIncomingSample) | Space freeze |
| 10 | `handle-connected-animated-node-editor` | `motiondivision-motion` | `motion@12.42.2` | `svg` | edge.setAttribute('d', cubicBetween(measuredOutputHandle, measuredInputHandle)) | handle drag、node drag |
| 11 | `bending-webgl-gallery-ribbon` | `processing-p5-js` | `p5@2.3.0` | `webgl` | card.position = [sin(angle) * radius, 0, -cos(angle) * radius] | wheel inertia、pointer drag、arrow keys |
| 12 | `draggable-dome-gallery` | `processing-p5-js` | `p5@2.3.0` | `webgl` | tile.position = spherical(azimuth + yaw, elevation + pitch, radius) | pointer drag、click focus、Escape |
| 13 | `animated-dom-node-connection-beam` | `motiondivision-motion` | `motion@12.42.2` | `svg` | path.setAttribute('d', bezier(center(from.getBoundingClientRect()), center(to.getBoundingClientRect()))) | drag anchor、responsive resize |
| 14 | `clip-shape-theme-reveal` | `motiondivision-motion` | `motion@12.42.2` | `dom` | layer.style.clipPath = `circle(${radius}% at ${origin.x}% ${origin.y}%)` | theme click、keyboard toggle |
| 15 | `sticky-paragraph-ink-reveal` | `motiondivision-motion` | `motion@12.42.2` | `dom` | wordControls.forEach((control,i) => control.time = clamp(progress * count - i)) | internal scroll、double-click auto |
| 16 | `draggable-force-directed-svg-network` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | force = linkSpring + inverseSquareCharge + centering; node.fixed = dragPoint | drag director |
| 17 | `voronoi-nearest-point-hover-focus` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | cell = sites.reduce((polygon, site) => clipByBisector(polygon, focus, site), bounds) | pointer nearest |
| 18 | `linked-brush-to-zoom-chart` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | focusDomain = brushSelection.map(value => value * (samples.length - 1)) | drag brush handles、drag selection、double-click reset |
| 19 | `click-to-collapse-hierarchy-branches` | `motiondivision-motion` | `motion@12.42.2` | `svg` | nodeControl.time = collapseProgress; edge.d = interpolateTreeLayout(expanded, collapsed) | click branch、Enter toggle |
| 20 | `velocity-sensitive-signature-ink` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | width = clamp(maxWidth - filteredPointerVelocity * weight, minWidth, maxWidth) | pointer draw、double-click clear |
| 21 | `pressure-shaped-freehand-stroke` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | outline = points.flatMap(point => offsetAlongNormal(point, 2 + point.pressure * 18)) | pressure pointer draw、double-click clear |
| 22 | `drag-editable-bezier-curve-handles` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | bezier(p0.x,p0.y,c1.x,c1.y,c2.x,c2.y,p3.x,p3.y) | drag endpoints、drag controls、double-click reset |
| 23 | `image-palette-ambient-color-transition` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | dominant = samplePixels(offscreenImage); background(lerpColor(dominantA, dominantB, t)) | click image、arrow keys |
| 24 | `blurhash-to-photo-progressive-reveal` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | pixel += basisColor[i,j] * cos(pi*x*i/w) * cos(pi*y*j/h) | Space replay |
| 25 | `live-hand-landmark-video-overlay` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | analysis.drawImage(video); landmarks = connectedColorComponents(analysis.getImageData(...)) | arrow-frame gesture |
| 26 | `frame-by-frame-gif-scrubber` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | frames = await Promise.all([...Array(frameCount)].map((_,i) => decoder.decode({frameIndex:i}))) | range scrub、double-click auto |
| 27 | `scroll-controlled-video-scrubbing` | `processing-p5-js` | `p5@2.3.0` | `canvas2d` | video.currentTime = scrollProgress * (video.duration - 0.04) | wheel scrub、arrow keys、double-click auto |

## 验证方式

- 对 27 个 JS 入口逐个执行 `node --check`。
- 浏览器门禁逐页等待 `__PREVIEW_READY__`，核对 META，运行异步 runtime assertion，并 seek `0 / .75 / 1.5 / 2.25 / 2.99s`。
- 每页收集 page error 与 console error，并对五个 seek 时刻做截图哈希，阻断静态假循环。
- 中央 manifest、catalog、capture 与发布文件由主任务统一集成，本实现没有修改这些文件。
