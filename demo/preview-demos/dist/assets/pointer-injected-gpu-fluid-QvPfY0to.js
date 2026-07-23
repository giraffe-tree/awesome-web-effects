import{a as e}from"./rolldown-runtime-CNC7AqOf.js";import"./shared-DRJThx9H.js";import{n as t,t as n}from"./shared-CArD_xX8.js";import{t as r}from"./regl-B2Y2V2F1.js";var i=e(r(),1),a={cyan:{label:`CYAN`,color:[.05,.8,.94],css:`#31dff3`},magenta:{label:`ROSE`,color:[.95,.08,.5],css:`#ef3b9b`},amber:{label:`AMBER`,color:[1,.42,.04],css:`#ff9b32`}};try{let e=document.querySelector(`#fluid-canvas`),t=document.querySelector(`.preview-stage`),r=document.querySelector(`#inject-reticle`),o=document.querySelector(`#pause-control`),s=document.querySelector(`#clear-control`),c=document.querySelector(`#save-control`),l=document.querySelector(`#state-pill`),u=document.querySelector(`#mix-output`),d=document.querySelector(`#mode-output`),f=[...document.querySelectorAll(`[data-gel]`)],p=Math.min(window.devicePixelRatio||1,2),m=window.matchMedia(`(prefers-reduced-motion: reduce)`),h=(0,i.default)({canvas:e,pixelRatio:p,attributes:{antialias:!1,alpha:!1,preserveDrawingBuffer:!0}}),g={task:`stage-haze-colour-mix-review`,acceptedInputs:[`mouse`,`touch`,`pen`,`keyboard`,`control`],automaticPath:!1,automaticInjection:!1,previewClockDriven:!1,syntheticEvents:!1,userInputRequired:!0,initialFrameStatic:!0,selectedGel:`cyan`,paused:!1,saved:!1,pointerDown:!1,pointerId:null,pointer:[.5,.45],pointerClient:[0,0],keyboardPointer:[.5,.45],lastPointerAt:0,pendingSplats:[],injections:0,gelWeights:{cyan:0,magenta:0,amber:0},activeFrames:0,drawCount:0,simulationSteps:0,framebufferPasses:0,displayDirty:!0,initialChecksum:null,initialChecksumStable:!1,simulationSize:[0,0],inputCount:0,pointerInputCount:0,keyboardInputCount:0,controlInputCount:0,touchInputCount:0,penInputCount:0,pointerCaptureCount:0,pointerReleaseCount:0,pointerMoveInjectionCount:0,keyboardInjectionCount:0,gelSelectionCount:0,pauseToggleCount:0,clearCount:0,saveCount:0,totalInjections:0,maxInjections:0,lastInputKind:`none`,lastInputSource:`none`,lastInputTrusted:!1},_=`
    precision highp float;
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = position * .5 + .5;
      gl_Position = vec4(position, 0., 1.);
    }
  `,v=[[-1,-1],[3,-1],[-1,3]],y={vert:_,attributes:{position:v},count:3,depth:{enable:!1},framebuffer:h.prop(`destination`)},b=h({...y,frag:`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D source;
      uniform vec2 texel;
      uniform float timestep;
      vec2 decode(vec2 value) { return value * 2. - 1.; }
      void main() {
        vec2 velocity = decode(texture2D(source, uv).rg);
        vec2 previous = clamp(uv - velocity * timestep, texel, 1. - texel);
        vec2 advected = decode(texture2D(source, previous).rg) * .985;
        gl_FragColor = vec4(advected * .5 + .5, 0., 1.);
      }
    `,uniforms:{source:h.prop(`source`),texel:h.prop(`texel`),timestep:h.prop(`timestep`)}}),x=h({...y,frag:`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D source;
      uniform sampler2D velocity;
      uniform vec2 texel;
      uniform float timestep;
      void main() {
        vec2 flow = texture2D(velocity, uv).rg * 2. - 1.;
        vec2 previous = clamp(uv - flow * timestep, texel, 1. - texel);
        vec4 dye = texture2D(source, previous);
        gl_FragColor = vec4(dye.rgb * .9985, dye.a * .997);
      }
    `,uniforms:{source:h.prop(`source`),velocity:h.prop(`velocity`),texel:h.prop(`texel`),timestep:h.prop(`timestep`)}}),S=h({...y,frag:`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D source;
      uniform vec2 point;
      uniform vec2 impulse;
      uniform float radius;
      uniform float aspect;
      void main() {
        vec2 delta = uv - point;
        delta.x *= aspect;
        float influence = exp(-dot(delta, delta) / max(radius * radius, .00001));
        vec2 velocity = texture2D(source, uv).rg * 2. - 1.;
        velocity = clamp(velocity + impulse * influence, -1., 1.);
        gl_FragColor = vec4(velocity * .5 + .5, 0., 1.);
      }
    `,uniforms:{source:h.prop(`source`),point:h.prop(`point`),impulse:h.prop(`impulse`),radius:h.prop(`radius`),aspect:h.prop(`aspect`)}}),C=h({...y,frag:`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D source;
      uniform vec2 point;
      uniform vec3 color;
      uniform float radius;
      uniform float strength;
      uniform float aspect;
      void main() {
        vec2 delta = uv - point;
        delta.x *= aspect;
        float influence = exp(-dot(delta, delta) / max(radius * radius, .00001)) * strength;
        vec4 base = texture2D(source, uv);
        vec3 mixed = 1. - (1. - base.rgb) * (1. - color * influence);
        gl_FragColor = vec4(clamp(mixed, 0., 1.), clamp(base.a + influence * .7, 0., 1.));
      }
    `,uniforms:{source:h.prop(`source`),point:h.prop(`point`),color:h.prop(`color`),radius:h.prop(`radius`),strength:h.prop(`strength`),aspect:h.prop(`aspect`)}}),w=h({...y,frag:`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D velocity;
      uniform vec2 texel;
      vec2 flow(vec2 offset) { return texture2D(velocity, clamp(uv + offset, texel, 1. - texel)).rg * 2. - 1.; }
      void main() {
        float left = flow(vec2(-texel.x, 0.)).x;
        float right = flow(vec2(texel.x, 0.)).x;
        float bottom = flow(vec2(0., -texel.y)).y;
        float top = flow(vec2(0., texel.y)).y;
        float divergence = clamp((right - left + top - bottom) * .5, -1., 1.);
        gl_FragColor = vec4(divergence * .5 + .5, 0., 0., 1.);
      }
    `,uniforms:{velocity:h.prop(`velocity`),texel:h.prop(`texel`)}}),T=h({...y,frag:`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D pressure;
      uniform sampler2D divergence;
      uniform vec2 texel;
      float scalar(vec2 offset) { return texture2D(pressure, clamp(uv + offset, texel, 1. - texel)).r * 2. - 1.; }
      void main() {
        float left = scalar(vec2(-texel.x, 0.));
        float right = scalar(vec2(texel.x, 0.));
        float bottom = scalar(vec2(0., -texel.y));
        float top = scalar(vec2(0., texel.y));
        float div = texture2D(divergence, uv).r * 2. - 1.;
        float nextPressure = clamp((left + right + bottom + top - div) * .25, -1., 1.);
        gl_FragColor = vec4(nextPressure * .5 + .5, 0., 0., 1.);
      }
    `,uniforms:{pressure:h.prop(`pressure`),divergence:h.prop(`divergence`),texel:h.prop(`texel`)}}),E=h({...y,frag:`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D velocity;
      uniform sampler2D pressure;
      uniform vec2 texel;
      float scalar(vec2 offset) { return texture2D(pressure, clamp(uv + offset, texel, 1. - texel)).r * 2. - 1.; }
      void main() {
        float left = scalar(vec2(-texel.x, 0.));
        float right = scalar(vec2(texel.x, 0.));
        float bottom = scalar(vec2(0., -texel.y));
        float top = scalar(vec2(0., texel.y));
        vec2 velocityValue = texture2D(velocity, uv).rg * 2. - 1.;
        velocityValue -= vec2(right - left, top - bottom) * .55;
        gl_FragColor = vec4(clamp(velocityValue, -1., 1.) * .5 + .5, 0., 1.);
      }
    `,uniforms:{velocity:h.prop(`velocity`),pressure:h.prop(`pressure`),texel:h.prop(`texel`)}}),D=h({vert:_,frag:`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D dye;
      uniform sampler2D velocity;
      uniform float aspect;
      float line(float value, float width) { return 1. - smoothstep(0., width, abs(value)); }
      void main() {
        vec2 p = uv - .5;
        p.x *= aspect;
        vec4 pigment = texture2D(dye, uv);
        vec2 flow = texture2D(velocity, uv).rg * 2. - 1.;
        float radial = length(p * vec2(.82, 1.1));
        vec3 background = mix(vec3(.012, .02, .021), vec3(.003, .006, .008), smoothstep(.08, .72, radial));
        float stageLine = line(p.y + .33, .002) * smoothstep(.72, .18, abs(p.x));
        float centreLine = line(p.x, .0012) * smoothstep(.48, .1, abs(p.y + .16));
        float ring = line(length(vec2(p.x, p.y + .33)) - .19, .0016);
        background += vec3(.11, .16, .16) * (stageLine + centreLine + ring) * .22;
        float density = smoothstep(.008, .9, pigment.a);
        vec3 haze = pow(max(pigment.rgb, 0.), vec3(.74));
        float sheen = dot(normalize(vec3(flow * 1.6, 1.)), normalize(vec3(-.4, .6, 1.))) * .5 + .5;
        vec3 color = background + haze * (1.28 + sheen * .34) * density;
        color += vec3(.04, .06, .06) * density * (1. - pigment.a);
        color *= .88 + .12 * smoothstep(.9, .1, radial);
        gl_FragColor = vec4(pow(max(color, 0.), vec3(.86)), 1.);
      }
    `,attributes:{position:v},uniforms:{dye:h.prop(`dye`),velocity:h.prop(`velocity`),aspect:h.prop(`aspect`)},count:3,depth:{enable:!1}}),O=null;function k(e,t,n=!1){let r=h.texture({width:e,height:t,format:`rgba`,type:`uint8`,min:`linear`,mag:`linear`,wrap:`clamp`}),i=h.framebuffer({color:r,depthStencil:!1});return h.clear({framebuffer:i,color:n?[.5,.5,0,1]:[0,0,0,0]}),{texture:r,framebuffer:i}}function A(e,t,n=!1){return{read:k(e,t,n),write:k(e,t,n),swap(){[this.read,this.write]=[this.write,this.read]}}}function j(){O&&[O.velocity.read,O.velocity.write,O.dye.read,O.dye.write,O.pressure.read,O.pressure.write,O.divergence].forEach(e=>{e.framebuffer.destroy(),e.texture.destroy()})}function M(){let e=Math.max(.4,innerWidth/Math.max(innerHeight,1)),t=Math.max(88,Math.min(256,Math.round(innerWidth*.52))),n=Math.max(50,Math.round(t/e));O&&O.width===t&&O.height===n||(j(),O={width:t,height:n,texel:[1/t,1/n],velocity:A(t,n,!0),dye:A(t,n,!1),pressure:A(t,n,!0),divergence:k(t,n,!0)},g.simulationSize=[t,n],g.pendingSplats.length=0,g.activeFrames=0,g.displayDirty=!0)}function N(){let t=Math.max(1,Math.round(innerWidth*p)),n=Math.max(1,Math.round(innerHeight*p));e.width!==t||e.height!==n?(e.width=t,e.height=n,e.style.width=`${innerWidth}px`,e.style.height=`${innerHeight}px`,h.poll(),M()):O||M()}function P(e,t){e(t),g.framebufferPasses+=1}function F(e){let t=innerWidth/Math.max(innerHeight,1),n=a[e.gel];P(S,{destination:O.velocity.write.framebuffer,source:O.velocity.read.texture,point:e.point,impulse:e.impulse,radius:e.radius,aspect:t}),O.velocity.swap(),P(C,{destination:O.dye.write.framebuffer,source:O.dye.read.texture,point:e.point,color:n.color,radius:e.radius*1.22,strength:e.strength,aspect:t}),O.dye.swap()}function I(){let e=m.matches?.025:.045;g.pendingSplats.splice(0).forEach(F),P(b,{destination:O.velocity.write.framebuffer,source:O.velocity.read.texture,texel:O.texel,timestep:e}),O.velocity.swap(),P(w,{destination:O.divergence.framebuffer,velocity:O.velocity.read.texture,texel:O.texel}),h.clear({framebuffer:O.pressure.read.framebuffer,color:[.5,.5,0,1]});for(let e=0;e<9;e+=1)P(T,{destination:O.pressure.write.framebuffer,pressure:O.pressure.read.texture,divergence:O.divergence.texture,texel:O.texel}),O.pressure.swap();P(E,{destination:O.velocity.write.framebuffer,velocity:O.velocity.read.texture,pressure:O.pressure.read.texture,texel:O.texel}),O.velocity.swap(),P(x,{destination:O.dye.write.framebuffer,source:O.dye.read.texture,velocity:O.velocity.read.texture,texel:O.texel,timestep:e}),O.dye.swap(),g.simulationSteps+=1,g.displayDirty=!0}function L(){h.clear({color:[.003,.006,.008,1]}),D({dye:O.dye.read.texture,velocity:O.velocity.read.texture,aspect:innerWidth/Math.max(innerHeight,1)}),g.drawCount+=1,g.displayDirty=!1}function R(){if(g.injections===0){u.textContent=`No haze yet`,d.textContent=m.matches?`Direct motion`:`Live advection`;return}let e=Object.entries(g.gelWeights).sort((e,t)=>t[1]-e[1]),t=e.reduce((e,[,t])=>e+t,0)||1,n=a[e[0][0]].label,r=a[e[1][0]].label,i=Math.round(e[0][1]/t*100);u.textContent=i<68?`${n} / ${r}`:`${n} ${i}%`,d.textContent=g.saved?`Look 03 saved`:m.matches?`Direct motion`:`Live advection`}function z(e,n){l.textContent=e,l.dataset.state=n,t.dataset.inputState=n}function B(e,t,n,r=null){if(!e||e.isTrusted!==!0)return!1;if(g.inputCount+=1,g.lastInputKind=t,g.lastInputSource=n,g.lastInputTrusted=!0,t===`pointer`){let t=r||e.pointerType||`mouse`;g.pointerInputCount+=1,t===`touch`&&(g.touchInputCount+=1),t===`pen`&&(g.penInputCount+=1)}else t===`keyboard`?g.keyboardInputCount+=1:g.controlInputCount+=1;return!0}function V(e){a[e]&&(g.selectedGel=e,f.forEach(t=>t.setAttribute(`aria-pressed`,String(t.dataset.gel===e))),r.style.setProperty(`--reticle-color`,a[e].css),!g.pointerDown&&!g.saved&&z(`${a[e].label} selected · drag to inject`,`idle`))}function H(e,t,n=.5){if(g.paused||g.saved)return;let r=Math.max(.12,Math.min(1,Math.hypot(t[0],t[1])*3.2)),i=.042+Math.max(0,Math.min(1,n))*.023;g.pendingSplats.push({point:[...e],impulse:[t[0]*.84,t[1]*.84],radius:i,strength:.46+r*.5,gel:g.selectedGel}),g.injections+=1,g.totalInjections+=1,g.maxInjections=Math.max(g.maxInjections,g.injections),g.gelWeights[g.selectedGel]+=.35+r,g.activeFrames=m.matches?1:150,g.displayDirty=!0,c.disabled=!1,R(),z(`${a[g.selectedGel].label} mixing · ${Math.round(r*100)}% current`,`mixing`)}function U(t){let n=e.getBoundingClientRect();return[Math.max(.02,Math.min(.98,(t.clientX-n.left)/n.width)),1-Math.max(.02,Math.min(.98,(t.clientY-n.top)/n.height))]}function W(e,t=!1){r.style.left=`${e[0]*100}%`,r.style.top=`${(1-e[1])*100}%`,r.dataset.visible=`true`,r.dataset.injecting=String(t)}function G(t){if(t.button!==void 0&&t.button!==0)return;let n=t.pointerType||`mouse`;B(t,`pointer`,`${n}-inject-start`,n)&&(g.pointerDown=!0,g.pointerId=t.pointerId,g.pointer=U(t),g.pointerClient=[t.clientX,t.clientY],g.lastPointerAt=t.timeStamp,e.setPointerCapture?.(t.pointerId),g.pointerCaptureCount+=1,W(g.pointer,!0),H(g.pointer,[0,0],t.pressure||.5))}function K(e){let t=U(e);if(W(t,g.pointerDown),!g.pointerDown||e.pointerId!==g.pointerId){g.pointer=t;return}let n=e.pointerType||`mouse`;if(!B(e,`pointer`,`${n}-inject-move`,n))return;g.pointerMoveInjectionCount+=1;let r=Math.max(8,e.timeStamp-g.lastPointerAt),i=[(t[0]-g.pointer[0])/r*16,(t[1]-g.pointer[1])/r*16],a=Math.hypot(i[0],i[1]),o=a>.42?.42/a:1;H(t,[i[0]*o,i[1]*o],e.pressure||.5),g.pointer=t,g.pointerClient=[e.clientX,e.clientY],g.lastPointerAt=e.timeStamp}function q(t){if(t.pointerId!==g.pointerId)return;let n=t.pointerType||`mouse`;B(t,`pointer`,`${n}-inject-release`,n)&&(g.pointerDown=!1,g.pointerId=null,r.dataset.injecting=`false`,e.releasePointerCapture?.(t.pointerId),g.pointerReleaseCount+=1,!g.paused&&!g.saved&&z(m.matches?`Injected · direct frame held`:`Current dissipating · drag to add`,`settling`))}function J(){[O.velocity.read,O.velocity.write,O.pressure.read,O.pressure.write,O.divergence].forEach(e=>h.clear({framebuffer:e.framebuffer,color:[.5,.5,0,1]})),[O.dye.read,O.dye.write].forEach(e=>h.clear({framebuffer:e.framebuffer,color:[0,0,0,0]})),g.pendingSplats.length=0,g.injections=0,g.gelWeights={cyan:0,magenta:0,amber:0},g.activeFrames=0,g.saved=!1,g.paused=!1,g.clearCount+=1,g.displayDirty=!0,o.textContent=`Pause`,o.setAttribute(`aria-pressed`,`false`),c.disabled=!0,z(`Ready · drag to inject`,`idle`),R()}function Y(){g.saved||(g.paused=!g.paused,g.pauseToggleCount+=1,o.textContent=g.paused?`Resume`:`Pause`,o.setAttribute(`aria-pressed`,String(g.paused)),z(g.paused?`Paused · evaluating blend`:g.injections?`Current resumed`:`Ready · drag to inject`,g.paused?`paused`:`idle`),!g.paused&&g.injections&&!m.matches&&(g.activeFrames=Math.max(g.activeFrames,70)))}function X(){g.injections&&(g.saved=!0,g.saveCount+=1,g.paused=!0,g.activeFrames=0,o.textContent=`Saved`,o.setAttribute(`aria-pressed`,`true`),z(`Look 03 saved · clear to restart`,`saved`),R())}e.addEventListener(`pointerdown`,G),e.addEventListener(`pointermove`,K),e.addEventListener(`pointerup`,q),e.addEventListener(`pointercancel`,q),e.addEventListener(`pointerleave`,e=>{(!g.pointerDown||e.pointerId!==g.pointerId)&&(r.dataset.visible=`false`)}),e.addEventListener(`keydown`,e=>{let t={ArrowLeft:[-.045,0],ArrowRight:[.045,0],ArrowUp:[0,.045],ArrowDown:[0,-.045]}[e.key];if(t){if(e.preventDefault(),!B(e,`keyboard`,`keyboard-${e.key}`))return;g.keyboardPointer[0]=Math.max(.04,Math.min(.96,g.keyboardPointer[0]+t[0])),g.keyboardPointer[1]=Math.max(.04,Math.min(.96,g.keyboardPointer[1]+t[1])),g.pointer=[...g.keyboardPointer],W(g.pointer,!1);return}if(e.key===` `||e.key===`Enter`){if(e.preventDefault(),!B(e,`keyboard`,`keyboard-${e.key===` `?`Space`:`Enter`}`))return;g.keyboardInjectionCount+=1,W(g.keyboardPointer,!0),H(g.keyboardPointer,[.025,.012],.55),requestAnimationFrame(()=>{r.dataset.injecting=`false`})}else if(/^[123]$/.test(e.key)){if(!B(e,`keyboard`,`keyboard-gel-${e.key}`))return;g.gelSelectionCount+=1,V([`cyan`,`magenta`,`amber`][Number(e.key)-1])}else if(e.key.toLowerCase()===`p`){if(!B(e,`keyboard`,`keyboard-pause`))return;Y()}else if(e.key.toLowerCase()===`c`){if(!B(e,`keyboard`,`keyboard-clear`))return;J()}else if(e.key.toLowerCase()===`s`){if(!B(e,`keyboard`,`keyboard-save`))return;X()}}),f.forEach(e=>e.addEventListener(`click`,t=>{B(t,`control`,`control-gel-${e.dataset.gel}`)&&(g.gelSelectionCount+=1,V(e.dataset.gel))})),o.addEventListener(`click`,e=>{B(e,`control`,`control-pause`)&&Y()}),s.addEventListener(`click`,e=>{B(e,`control`,`control-clear`)&&J()}),c.addEventListener(`click`,e=>{B(e,`control`,`control-save`)&&X()}),m.addEventListener?.(`change`,()=>{m.matches&&(g.activeFrames=Math.min(g.activeFrames,1)),R()});function Z(){N();let e=g.pendingSplats.length>0;!g.paused&&!g.saved&&(e||g.activeFrames>0)&&(I(),g.activeFrames=Math.max(0,g.activeFrames-1)),g.displayDirty&&L()}function Q(){let t=Math.min(24,e.width),n=Math.min(24,e.height),r=h.read({x:0,y:0,width:t,height:n}),i=2166136261;for(let e=0;e<r.length;e+=7)i^=r[e],i=Math.imul(i,16777619);return i>>>0}window.__FLUID_INTERACTION_STATE__=g,window.__PREVIEW_RUNTIME_ASSERT__=()=>{let n=e.getBoundingClientRect();return typeof h==`function`&&!!h._gl&&!h._gl.isContextLost()&&!!O?.velocity?.read?.framebuffer&&!!O?.dye?.read?.framebuffer&&!!O?.pressure?.read?.framebuffer&&!!O?.divergence?.framebuffer&&g.simulationSize[0]>=88&&g.simulationSize[1]>=50&&g.drawCount>0&&g.initialChecksumStable&&g.task===`stage-haze-colour-mix-review`&&g.acceptedInputs.join(`,`)===`mouse,touch,pen,keyboard,control`&&g.automaticPath===!1&&g.automaticInjection===!1&&g.previewClockDriven===!1&&g.syntheticEvents===!1&&g.userInputRequired===!0&&g.initialFrameStatic===!0&&t.dataset.previewMechanism===`regl-framebuffer-fluid`&&n.width>=innerWidth-1&&n.height>=innerHeight-1&&e.width>=Math.round(innerWidth*p)-1&&e.height>=Math.round(innerHeight*p)-1&&a[g.selectedGel]&&f.length===3&&o instanceof HTMLButtonElement&&s instanceof HTMLButtonElement&&c instanceof HTMLButtonElement&&g.pendingSplats.length===0&&g.injections===0&&g.activeFrames===0&&g.pointerCaptureCount>=g.pointerReleaseCount&&g.pointerInputCount+g.keyboardInputCount+g.controlInputCount===g.inputCount&&g.touchInputCount+g.penInputCount<=g.pointerInputCount&&window.__FLUID_INTERACTION_STATE__===g},n({id:`pointer-injected-gpu-fluid`,library:`regl@2.1.1`,renderer:`webgl`,render:Z,ready:(async()=>{N(),L(),await new Promise(e=>requestAnimationFrame(()=>requestAnimationFrame(e)));let e=Q();L(),await new Promise(e=>requestAnimationFrame(e));let t=Q();if(g.initialChecksum=e,g.initialChecksumStable=e===t,!window.__PREVIEW_RUNTIME_ASSERT__())throw Error(`GPU fluid runtime contract failed`)})()})}catch(e){t(e)}