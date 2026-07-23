import{a as e}from"./rolldown-runtime-CNC7AqOf.js";import"./shared-DRJThx9H.js";import{n as t,t as n}from"./shared-CArD_xX8.js";import{t as r}from"./regl-B2Y2V2F1.js";var i=e(r(),1);try{let e=document.querySelector(`#analysis-stage`),r=document.querySelector(`#regl-canvas`),a=document.querySelector(`#analyze-button`),o=document.querySelector(`#phase-readout`),s=document.querySelector(`#rare-readout`),c=window.matchMedia(`(prefers-reduced-motion: reduce)`);if(!e||!r||!a||!o||!s)throw Error(`Cell analysis DOM is incomplete.`);let l=Math.min(window.devicePixelRatio||1,2),u=(0,i.default)({canvas:r,pixelRatio:l,attributes:{antialias:!0,alpha:!1,preserveDrawingBuffer:!0}}),d=u._gl,f=1100,p=[],m=[],h=[],g=[],_=[0,0,0],v=[[-.24,.06],[.27,-.23],[.29,.33]],y=[[.35,.27],[.23,.18],[.15,.12]],b=e=>e-Math.floor(e);for(let e=0;e<f;e+=1){let t=e%100,n=t<8?2:+(t<31),r=b(Math.sin((e+1)*12.9898)*43758.5453),i=b(Math.sin((e+3)*78.233)*12515.873),a=b(Math.sin((e+7)*37.719)*23421.631),o=.08+.9*Math.sqrt((e+.5)/f),s=e*2.399963229728653+(i-.5)*.52,c=Math.sqrt(r),l=i*Math.PI*2;p.push([Math.cos(s)*o+(a-.5)*.07,Math.sin(s)*o+(r-.5)*.05]),m.push([v[n][0]+Math.cos(l)*c*y[n][0],v[n][1]+Math.sin(l)*c*y[n][1]]),h.push(n),g.push(1.45+a*1.45+(n===2?.7:0)),_[n]+=1}let x=2166136261;for(let e=0;e<f;e+=1){let t=[...p[e],...m[e],h[e],g[e]];for(let e of t)x=Math.imul(x^Math.round((e+3)*1e5),16777619)>>>0}let S={progress:0,targetProgress:0,phase:`mixed`,motionActive:!1,activeDirection:`idle`,dragActive:!1,pointerInside:!1,stageFocused:!1,controlFocused:!1,reducedMotion:c.matches,lastInput:`none`,inputCount:0,pointerInputCount:0,touchInputCount:0,keyboardInputCount:0,clickInputCount:0,pointerMoveCount:0,transitionCount:0,renderCount:0,drawCommandCount:4,drawCommandIds:[`field`,`density`,`cells`,`response-gate`],drawCommandExecutions:{field:0,density:0,cells:0,gate:0},particleCount:f,populationCounts:_,rarePopulationRatio:_[2]/f,dataChecksum:x,deterministicData:!0,randomSourceUsed:!1,claimedLibrary:`regl@2.1.1`,realReglContext:d instanceof WebGLRenderingContext,inputAdapters:[`pointer`,`touch`,`click`,`keyboard`],pointerCaptureSupported:typeof e.setPointerCapture==`function`,automaticPlayback:!1,automaticFallback:!1,syntheticInputDispatch:!1,initialFrameChecksum:0,initialStaticConfirmed:!1,canvasWidth:0,canvasHeight:0};window.__PREVIEW_INTERACTION_STATE__=S;let C=u({vert:`
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = .5 * (position + 1.0);
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,frag:`
      precision highp float;
      uniform vec2 resolution;
      uniform float progress;
      uniform float compact;
      varying vec2 uv;
      void main() {
        vec2 frag = gl_FragCoord.xy / resolution;
        float left = mix(.37, .035, compact);
        float right = .965;
        float bottom = mix(.16, .08, compact);
        float top = mix(.87, .91, compact);
        vec2 local = vec2((frag.x - left) / (right - left), (frag.y - bottom) / (top - bottom));
        float inside = step(0.0, local.x) * step(local.x, 1.0) * step(0.0, local.y) * step(local.y, 1.0);
        vec2 cell = abs(fract(local * vec2(9.0, 6.0)) - .5);
        float grid = (1.0 - smoothstep(.475, .5, max(cell.x, cell.y))) * inside;
        float axes = (1.0 - smoothstep(.0, .006, min(abs(local.x), abs(local.y)))) * inside;
        float scan = exp(-pow((local.x - progress) * 32.0, 2.0)) * inside;
        vec3 color = vec3(.027, .09, .074);
        color += grid * vec3(.045, .085, .074);
        color += axes * vec3(.09, .16, .13);
        color += scan * mix(vec3(.02, .11, .10), vec3(.09, .17, .08), progress) * .58;
        float vignette = smoothstep(.96, .3, distance(frag, vec2(.63, .52)));
        color *= .76 + vignette * .24;
        gl_FragColor = vec4(color, 1.0);
      }
    `,attributes:{position:[[-1,-1],[3,-1],[-1,3]]},uniforms:{resolution:u.prop(`resolution`),progress:u.prop(`progress`),compact:u.prop(`compact`)},depth:{enable:!1},count:3}),w=u({vert:`
      precision mediump float;
      attribute vec2 center;
      attribute float size;
      attribute float group;
      uniform float progress;
      uniform float compact;
      varying float groupId;
      varying float opacity;
      void main() {
        vec2 plotScale = mix(vec2(.47, .66), vec2(.73, .7), compact);
        vec2 plotOffset = mix(vec2(.43, .0), vec2(.13, .0), compact);
        gl_Position = vec4(center * plotScale + plotOffset, 0.0, 1.0);
        gl_PointSize = size * ${l.toFixed(2)} * mix(1.0, .55, compact);
        groupId = group;
        opacity = progress;
      }
    `,frag:`
      precision mediump float;
      varying float groupId;
      varying float opacity;
      void main() {
        float radius = length(gl_PointCoord - .5) * 2.0;
        float alpha = (1.0 - smoothstep(.04, 1.0, radius)) * opacity * .19;
        vec3 color = groupId < .5 ? vec3(.40, .91, .83) : groupId < 1.5 ? vec3(1.0, .52, .41) : vec3(.85, .96, .39);
        gl_FragColor = vec4(color, alpha);
      }
    `,attributes:{center:v,size:[178,132,94],group:[0,1,2]},uniforms:{progress:u.prop(`progress`),compact:u.prop(`compact`)},primitive:`points`,count:3,blend:{enable:!0,func:{srcRGB:`src alpha`,dstRGB:`one`,srcAlpha:`one`,dstAlpha:`one`}},depth:{enable:!1}}),T=u({vert:`
      precision mediump float;
      attribute vec2 basePosition;
      attribute vec2 resolvedPosition;
      attribute float group;
      attribute float size;
      uniform float progress;
      uniform float compact;
      varying float groupId;
      varying float reveal;
      void main() {
        float eased = progress * progress * (3.0 - 2.0 * progress);
        vec2 point = mix(basePosition, resolvedPosition, eased);
        vec2 plotScale = mix(vec2(.47, .66), vec2(.73, .7), compact);
        vec2 plotOffset = mix(vec2(.43, .0), vec2(.13, .0), compact);
        gl_Position = vec4(point * plotScale + plotOffset, 0.0, 1.0);
        gl_PointSize = size * ${l.toFixed(2)} * mix(1.0, .82, compact);
        groupId = group;
        reveal = eased;
      }
    `,frag:`
      precision mediump float;
      varying float groupId;
      varying float reveal;
      void main() {
        float radius = length(gl_PointCoord - .5);
        float alpha = smoothstep(.5, .08, radius);
        vec3 neutral = vec3(.55, .82, .74);
        vec3 classified = groupId < .5 ? vec3(.40, .91, .83) : groupId < 1.5 ? vec3(1.0, .52, .41) : vec3(.85, .96, .39);
        vec3 color = mix(neutral, classified, reveal);
        float emphasis = mix(.72, groupId > 1.5 ? 1.15 : .92, reveal);
        gl_FragColor = vec4(color * emphasis, alpha * .86);
      }
    `,attributes:{basePosition:p,resolvedPosition:m,group:h,size:g},uniforms:{progress:u.prop(`progress`),compact:u.prop(`compact`)},primitive:`points`,count:f,blend:{enable:!0,func:{srcRGB:`src alpha`,dstRGB:`one`,srcAlpha:`one`,dstAlpha:`one`}},depth:{enable:!1}}),E=Array.from({length:72},(e,t)=>{let n=t/72*Math.PI*2;return[Math.cos(n),Math.sin(n)]}),D=u({vert:`
      precision mediump float;
      attribute vec2 position;
      uniform float progress;
      uniform float compact;
      varying float opacity;
      void main() {
        vec2 plotScale = mix(vec2(.47, .66), vec2(.73, .7), compact);
        vec2 plotOffset = mix(vec2(.43, .0), vec2(.13, .0), compact);
        vec2 gate = vec2(.29, .33) + position * vec2(.19, .155) * (.72 + progress * .28);
        gl_Position = vec4(gate * plotScale + plotOffset, 0.0, 1.0);
        opacity = smoothstep(.18, .72, progress);
      }
    `,frag:`
      precision mediump float;
      varying float opacity;
      void main() {
        gl_FragColor = vec4(.85, .96, .39, opacity * .9);
      }
    `,attributes:{position:E},uniforms:{progress:u.prop(`progress`),compact:u.prop(`compact`)},primitive:`line loop`,lineWidth:1,count:E.length,blend:{enable:!0,func:{srcRGB:`src alpha`,dstRGB:`one minus src alpha`,srcAlpha:`one`,dstAlpha:`one minus src alpha`}},depth:{enable:!1}}),O=[C,w,T,D],k=null,A=0,j=0,M=0,N=e=>Math.min(1,Math.max(0,e)),P=e=>e<=.015?`mixed`:e>=.985?`resolved`:`partial`,F=e=>{S.lastInput=e,S.inputCount+=1,e.startsWith(`pointer`)&&(S.pointerInputCount+=1),e.startsWith(`touch`)&&(S.touchInputCount+=1),e.startsWith(`keyboard`)&&(S.keyboardInputCount+=1),e.startsWith(`click`)&&(S.clickInputCount+=1)},I=()=>{let t=S.progress,n=Math.round(t*100);S.phase=S.motionActive?`resolving`:P(t),e.dataset.phase=S.phase,e.dataset.progress=t.toFixed(3),e.style.setProperty(`--analysis-progress`,t.toFixed(4)),a.setAttribute(`aria-pressed`,String(S.targetProgress>=.5));let i=e.clientWidth<=180||e.clientHeight<=105;a.textContent=i?S.targetProgress>=.5?`Reset`:`Analyze`:S.targetProgress>=.5?`Mix observations`:`Separate populations`,S.phase===`mixed`?o.textContent=`MIXED SAMPLE · READY`:S.phase===`resolved`?o.textContent=`03 POPULATIONS · COHERENT`:o.textContent=`RESOLVING · ${String(n).padStart(2,`0`)}%`,s.textContent=t<.34?`—`:`${(S.rarePopulationRatio*t*100).toFixed(1)}%`,r.setAttribute(`aria-label`,S.phase===`resolved`?`One thousand one hundred cell measurements separated into three populations with an eight percent rare response`:S.phase===`mixed`?`One thousand one hundred mixed cell measurements awaiting population analysis`:`Cell measurements ${n} percent separated into coherent populations`)},L=e=>{S.progress=N(e),S.targetProgress=S.progress,S.motionActive=!1,S.activeDirection=`idle`,A=0,j=S.progress,M=S.progress,I()},R=(e,t)=>{let n=N(e);Math.abs(n-S.progress)<.001&&!S.motionActive||(F(t),S.targetProgress=n,S.transitionCount+=1,S.activeDirection=n>S.progress?`separating`:`mixing`,j=S.progress,M=n,A=0,S.reducedMotion?L(n):S.motionActive=!0,I())},z=(e,t,n=!1)=>{n&&F(t),S.progress=N(e),S.targetProgress=S.progress,S.motionActive=!1,S.activeDirection=`scrubbing`,A=0,I()},B=()=>{let t=e.getBoundingClientRect(),n=Math.max(1,Math.round(t.width*l)),i=Math.max(1,Math.round(t.height*l));return(r.width!==n||r.height!==i)&&(r.width=n,r.height=i,u.poll()),S.canvasWidth=n,S.canvasHeight=i,{width:n,height:i,compact:+(t.width<=180||t.height<=105)}},V=e=>{(k===null||e<k)&&(k=e);let t=Math.min(.12,Math.max(0,e-k));if(k=e,!S.motionActive)return;A+=t;let n=Math.min(1,A/.78),r=n<.5?4*n*n*n:1-(-2*n+2)**3/2;S.progress=j+(M-j)*r,n>=1&&L(M)},H=e=>{let t=B();V(Number(e)||0);let n={progress:S.progress,compact:t.compact,resolution:[t.width,t.height]};C(n),S.drawCommandExecutions.field+=1,w(n),S.drawCommandExecutions.density+=1,T(n),S.drawCommandExecutions.cells+=1,D(n),S.drawCommandExecutions.gate+=1,S.renderCount+=1,I()},U=t=>{let n=e.getBoundingClientRect();return N((t.clientX-n.left)/Math.max(1,n.width))};a.addEventListener(`pointerdown`,e=>e.stopPropagation()),a.addEventListener(`click`,e=>{e.stopPropagation();let t=e.detail===0?`keyboard:button`:e.pointerType?`pointer:${e.pointerType}:button`:`click:button`;R(S.targetProgress>=.5?0:1,t)}),a.addEventListener(`focus`,()=>{S.controlFocused=!0}),a.addEventListener(`blur`,()=>{S.controlFocused=!1}),e.addEventListener(`pointerenter`,()=>{S.pointerInside=!0}),e.addEventListener(`pointerleave`,()=>{S.pointerInside=!1}),e.addEventListener(`pointerdown`,t=>{if(t.target===a)return;let n=t.pointerType===`touch`;S.dragActive=!0,S.pointerCaptureSupported&&e.setPointerCapture(t.pointerId),z(U(t),`${n?`touch`:`pointer`}:${t.pointerType}:drag`,!0)}),e.addEventListener(`pointermove`,e=>{S.dragActive&&(S.pointerMoveCount+=1,z(U(e),S.lastInput))});let W=t=>{S.dragActive&&(z(U(t),S.lastInput),S.dragActive=!1,S.activeDirection=`idle`,S.pointerCaptureSupported&&e.hasPointerCapture(t.pointerId)&&e.releasePointerCapture(t.pointerId),I())};e.addEventListener(`pointerup`,W),e.addEventListener(`pointercancel`,W),e.addEventListener(`focus`,()=>{S.stageFocused=!0}),e.addEventListener(`blur`,t=>{e.contains(t.relatedTarget)||(S.stageFocused=!1)}),e.addEventListener(`keydown`,e=>{if(e.target===a)return;let t=null;(e.key===`ArrowRight`||e.key===`ArrowUp`)&&(t=Math.min(1,S.targetProgress+.25)),(e.key===`ArrowLeft`||e.key===`ArrowDown`)&&(t=Math.max(0,S.targetProgress-.25)),(e.key===`Home`||e.key===`Escape`)&&(t=0),e.key===`End`&&(t=1),(e.key===`Enter`||e.key===` `)&&(t=S.targetProgress>=.5?0:1),t!==null&&(e.preventDefault(),R(t,`keyboard:${e.key===` `?`Space`:e.key}`))});let G=e=>{S.reducedMotion=e.matches,e.matches&&S.motionActive&&L(S.targetProgress)};typeof c.addEventListener==`function`?c.addEventListener(`change`,G):c.addListener(G);let K=()=>{let e=u.read(),t=Math.max(1,Math.floor(e.length/2048)),n=2166136261;for(let r=0;r<e.length;r+=t)n=Math.imul(n^e[r],16777619)>>>0;return n};window.__PREVIEW_RUNTIME_ASSERT__=()=>{let t=(e,t)=>{if(!e)throw Error(`functional-webgl-draw-commands: ${t}`)},n=e.getBoundingClientRect(),i=r.getBoundingClientRect(),o=a.getBoundingClientRect();return t(S.claimedLibrary===`regl@2.1.1`&&typeof u==`function`&&u._gl===d,`real regl context is missing`),t(d instanceof WebGLRenderingContext&&S.realReglContext,`WebGL rendering context is unavailable`),t(O.length===4&&O.every(e=>typeof e==`function`),`four regl draw commands are required`),t(S.drawCommandCount===4&&S.drawCommandIds.join(`|`)===`field|density|cells|response-gate`,`draw-command composition contract changed`),t(S.renderCount>0&&Object.values(S.drawCommandExecutions).every(e=>e===S.renderCount),`draw commands did not execute coherently`),t(p.length===f&&m.length===f&&h.length===f&&g.length===f,`cell attribute buffers diverged`),t(S.particleCount===1100&&S.populationCounts.join(`|`)===`759|253|88`,`cell population counts changed`),t(S.dataChecksum===x&&S.deterministicData&&!S.randomSourceUsed,`cell data must remain deterministic`),t(S.automaticPlayback===!1&&S.automaticFallback===!1&&S.syntheticInputDispatch===!1,`automatic or synthetic progression is forbidden`),t(S.inputAdapters.join(`|`)===`pointer|touch|click|keyboard`,`input adapter contract changed`),t(Math.abs(Number(e.dataset.progress)-S.progress)<.0011&&e.dataset.phase===S.phase,`DOM analysis state is stale`),t(a.getAttribute(`aria-pressed`)===String(S.targetProgress>=.5),`analysis control state is stale`),t(S.progress>=0&&S.progress<=1&&S.targetProgress>=0&&S.targetProgress<=1,`analysis progress escaped its bounds`),t(!S.reducedMotion||!S.motionActive,`reduced motion must settle directly`),t(r.width===S.canvasWidth&&r.height===S.canvasHeight&&d.drawingBufferWidth===r.width,`WebGL drawing buffer is stale`),t(i.width>0&&i.height>0&&o.width>0&&o.height>0,`analysis surface or control is not visible`),t(i.left>=n.left-.5&&i.right<=n.right+.5&&i.top>=n.top-.5&&i.bottom<=n.bottom+.5,`WebGL surface escaped the preview`),t(a.type===`button`&&e.tabIndex===0&&getComputedStyle(e).touchAction===`none`,`pointer and keyboard access changed`),t(S.inputCount>0||S.initialStaticConfirmed&&S.progress===0&&S.targetProgress===0&&S.phase===`mixed`,`initial frame must remain static until real input`),!0},I();let q=()=>new Promise(e=>requestAnimationFrame(()=>requestAnimationFrame(e))),J=Promise.resolve(document.fonts?.ready).then(()=>{H(0);let e=`${S.progress}|${S.targetProgress}|${S.phase}|${S.inputCount}`,t=K();return q().then(()=>{H(0);let n=`${S.progress}|${S.targetProgress}|${S.phase}|${S.inputCount}`,r=K();if(S.initialFrameChecksum=t,S.initialStaticConfirmed=e===n&&t===r&&S.progress===0&&S.targetProgress===0&&!S.motionActive,!S.initialStaticConfirmed)throw Error(`Initial cell-analysis frame changed without user input.`);if(window.__PREVIEW_RUNTIME_ASSERT__()!==!0)throw Error(`Initial regl draw-command assertion failed.`)})});J.catch(t),n({id:`functional-webgl-draw-commands`,library:`regl@2.1.1`,renderer:`webgl`,render:H,ready:J})}catch(e){t(e)}