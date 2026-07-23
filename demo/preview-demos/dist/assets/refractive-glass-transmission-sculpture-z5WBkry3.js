import"./shared-DRJThx9H.js";import{n as e,t}from"./shared-CArD_xX8.js";import{t as n}from"./app-Dj3RhBXi.js";var r=``+new URL(`01-cobalt-amber-calibration-bay-bx77I1pd.jpg`,import.meta.url).href,i=``+new URL(`02-cyan-red-grid-bay-DIDBiiwe.jpg`,import.meta.url).href,a=``+new URL(`README-CIJaCWY5.md`,import.meta.url).href,o=`
precision highp float;
attribute vec3 aPosition;
void main() {
  gl_Position = vec4(aPosition, 1.0);
}
`,s=`
precision highp float;
uniform vec2 u_resolution;
uniform sampler2D u_environment;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_ior;
uniform float u_dispersion;
uniform float u_inspection;

mat2 rot(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float sdSphere(vec3 point, float radius) {
  return length(point) - radius;
}

float sdTorus(vec3 point, vec2 radii) {
  vec2 q = vec2(length(point.xz) - radii.x, point.y);
  return length(q) - radii.y;
}

float sdEllipsoid(vec3 point, vec3 radii) {
  float k0 = length(point / radii);
  float k1 = length(point / (radii * radii));
  return k0 * (k0 - 1.0) / max(k1, 0.0001);
}

float smoothMin(float a, float b, float radius) {
  float h = clamp(0.5 + 0.5 * (b - a) / radius, 0.0, 1.0);
  return mix(b, a, h) - radius * h * (1.0 - h);
}

float scene(vec3 point) {
  point.xz *= rot(u_yaw);
  point.yz *= rot(u_pitch);
  vec3 tilted = point;
  tilted.xy *= rot(0.34);
  float lens = sdEllipsoid(tilted, vec3(0.72, 0.94, 0.42));
  float collar = sdTorus(point + vec3(0.0, 0.17, 0.02), vec2(0.58, 0.17));
  float body = smoothMin(lens, collar, 0.13);
  float carvedEdge = -sdSphere(point - vec3(0.52, 0.31, 0.16), 0.34);
  return max(body, carvedEdge);
}

vec3 normalAt(vec3 point) {
  vec2 epsilon = vec2(0.0018, 0.0);
  return normalize(vec3(
    scene(point + epsilon.xyy) - scene(point - epsilon.xyy),
    scene(point + epsilon.yxy) - scene(point - epsilon.yxy),
    scene(point + epsilon.yyx) - scene(point - epsilon.yyx)
  ));
}

vec3 studioSample(vec2 uv) {
  vec2 safeUv = clamp(vec2(uv.x, 1.0 - uv.y), vec2(0.002), vec2(0.998));
  return texture2D(u_environment, safeUv).rgb;
}

vec2 refractedOffset(vec3 incident, vec3 normal, float index) {
  vec3 bent = refract(incident, normal, 1.0 / index);
  return (bent.xy - incident.xy) * 1.18 + normal.xy * 0.045;
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / u_resolution.xy;
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
  vec3 rayOrigin = vec3(0.0, 0.0, 3.2);
  vec3 rayDirection = normalize(vec3(uv, -2.05));
  float travelled = 0.0;
  bool hit = false;
  vec3 point = vec3(0.0);

  for (int step = 0; step < 86; step += 1) {
    point = rayOrigin + rayDirection * travelled;
    float distanceToSurface = scene(point);
    if (abs(distanceToSurface) < 0.0014) {
      hit = true;
      break;
    }
    travelled += distanceToSurface * 0.68;
    if (travelled > 6.2) break;
  }

  vec3 color = studioSample(screenUv) * mix(0.7, 0.82, u_inspection);
  float floorShadow = smoothstep(0.42, 0.0, length(vec2(uv.x * 0.82, uv.y + 0.93)));
  color *= 1.0 - floorShadow * 0.3;

  if (hit) {
    vec3 normal = normalAt(point);
    float facing = max(0.0, dot(-rayDirection, normal));
    float fresnel = pow(1.0 - facing, 3.2);
    vec2 redOffset = refractedOffset(rayDirection, normal, max(1.01, u_ior - u_dispersion));
    vec2 greenOffset = refractedOffset(rayDirection, normal, u_ior);
    vec2 blueOffset = refractedOffset(rayDirection, normal, u_ior + u_dispersion);
    float thickness = 0.76 + 0.38 * (1.0 - facing);
    vec3 transmitted = vec3(
      studioSample(screenUv + redOffset * thickness).r,
      studioSample(screenUv + greenOffset * thickness).g,
      studioSample(screenUv + blueOffset * thickness).b
    );
    vec3 reflectedDirection = reflect(rayDirection, normal);
    vec3 reflected = studioSample(screenUv + reflectedDirection.xy * 0.12);
    vec3 absorption = mix(vec3(0.72, 0.91, 0.98), vec3(0.86, 0.96, 0.99), facing);
    color = mix(transmitted * absorption, reflected, 0.08 + fresnel * 0.76);
    float keyLight = pow(max(0.0, dot(normal, normalize(vec3(-0.42, 0.72, 1.0)))), 30.0);
    float rim = pow(1.0 - facing, 5.0);
    color += keyLight * vec3(1.1, 1.04, 0.88) * 1.25;
    color += rim * mix(vec3(0.08, 0.42, 0.74), vec3(0.42, 0.68, 0.92), u_inspection) * 0.7;
    color *= mix(1.0, 0.78, u_inspection);
  }

  float vignette = 1.0 - 0.18 * dot(uv * vec2(0.7, 0.62), uv * vec2(0.7, 0.62));
  color *= vignette;
  color = pow(max(color, 0.0), vec3(0.9));
  gl_FragColor = vec4(color, 1.0);
}
`;try{let c=document.querySelector(`#glass-stage`),l=document.querySelector(`#glass-host`),u=document.querySelector(`#archive-state`),d=document.querySelector(`#environment-output`),f=document.querySelector(`#ior-output`),ee=document.querySelector(`#dispersion-output`),te=document.querySelector(`#rotation-output`),p=document.querySelector(`#motion-output`),m=document.querySelector(`#source-output`),h=document.querySelector(`#inspection-flag`),g=document.querySelector(`#studio-button`),_=document.querySelector(`#grid-button`),v=document.querySelector(`#ior-down-button`),y=document.querySelector(`#ior-up-button`),b=document.querySelector(`#ior-control-output`),x=document.querySelector(`#reset-button`),S=document.querySelector(`#inspect-button`),ne=matchMedia(`(prefers-reduced-motion: reduce)`);if(!c||!l||!g||!_||!v||!y||!x||!S)throw Error(`Glass material inspector DOM is incomplete.`);let C=[{name:`Cobalt / amber`,shortName:`Studio`,file:`01-cobalt-amber-calibration-bay.jpg`},{name:`Cyan / red grid`,shortName:`Grid`,file:`02-cyan-red-grid-bay.jpg`}].map(e=>({...e,url:new URL(Object.assign({"../assets/refractive-glass-transmission-sculpture/01-cobalt-amber-calibration-bay.jpg":r,"../assets/refractive-glass-transmission-sculpture/02-cyan-red-grid-bay.jpg":i,"../assets/refractive-glass-transmission-sculpture/README.md":a})[`../assets/refractive-glass-transmission-sculpture/${e.file}`],import.meta.url).href})),w=-.18,T=.04,E=1.45,D=1.33,O=1.7,k=(e,t,n)=>Math.min(n,Math.max(t,e)),A=(e,t=5)=>Number(e.toFixed(t)),j=e=>Math.round(e*180/Math.PI),M={id:`refractive-glass-transmission-sculpture`,task:`glass-material-refraction-review`,userInputRequired:!0,acceptedInputs:[`mouse`,`touch`,`pen`,`keyboard`,`control`],automaticCruise:!1,automaticPlayback:!1,automaticRehearsal:!1,automaticFallback:!1,previewClockDriven:!1,previewClockMutationCount:0,syntheticInputDispatch:!1,userOwnedOrientation:!0,firstFrameStatic:!0,initialStaticVerified:!1,reducedMotion:ne.matches,reducedMotionDiscreteControls:!0,yaw:w,pitch:T,ior:E,dispersion:.035,minIor:D,maxIor:O,environmentIndex:0,inspectionActive:!1,resultState:`material-review`,inputKind:`none`,inputCount:0,trustedInputCount:0,rejectedUntrustedCount:0,pointerInputCount:0,mouseInputCount:0,touchInputCount:0,penInputCount:0,keyboardInputCount:0,controlInputCount:0,positiveInputCount:0,negativeInputCount:0,reversalCount:0,lastDirection:0,orientationMutationCount:0,iorMutationCount:0,environmentSwitchCount:0,inspectionCount:0,inspectionClearCount:0,resetCount:0,boundaryAttemptCount:0,minBoundaryCount:0,maxBoundaryCount:0,lastBoundary:null,pointerCaptured:!1,activePointerId:null,activePointerType:null,pointerCaptureCount:0,pointerReleaseCount:0,pointerCancelCount:0,dragUpdateCount:0,assetCount:C.length,assetDecodedCount:0,assetDimensionsValid:!1,assetChecksums:[],assetChecksumsUnique:!1,sampledPixelCount:0,textureImagesReady:!1,textureBindCount:0,lastTextureIndex:0,p5Ready:!1,webglReady:!1,webglVersion:`none`,shaderCompiled:!1,shaderPasses:0,transmissionShaderVerified:s.includes(`refract(`)&&s.includes(`texture2D(`),drawCount:0,resizeCount:0,revision:0,drawnRevision:-1,lastDrawnYaw:w,lastDrawnPitch:T,lastDrawnIor:E,ledger:[],lastLedgerEntry:null};window.__PREVIEW_INTERACTION_STATE__=M;let N=[],P=[],F,I,L,R,z=null,re=0;function B(e){let t={...e,trusted:!0,inputCountAtEntry:M.inputCount,yaw:A(M.yaw),pitch:A(M.pitch),ior:A(M.ior),environmentIndex:M.environmentIndex};M.ledger.push(t),M.ledger.length>64&&M.ledger.shift(),M.lastLedgerEntry=t}function V(e,t,n){return!t||t.isTrusted!==!0?(M.rejectedUntrustedCount+=1,!1):(M.inputKind=e,M.inputCount+=1,M.trustedInputCount+=1,e===`keyboard`?M.keyboardInputCount+=1:e===`control`?M.controlInputCount+=1:(M.pointerInputCount+=1,e===`mouse`&&(M.mouseInputCount+=1),e===`touch`&&(M.touchInputCount+=1),e===`pen`&&(M.penInputCount+=1)),B({type:`input`,cause:n,kind:e}),!0)}function H(e,t){let n=Math.sign(e);n&&(n>0?M.positiveInputCount+=1:M.negativeInputCount+=1,M.lastDirection&&n!==M.lastDirection&&(M.reversalCount+=1),M.lastDirection=n,B({type:`direction`,cause:t,direction:n}))}function U(){return M.yaw===w&&M.pitch===T&&M.ior===E&&M.environmentIndex===0&&!M.inspectionActive}function W(){let e=C[M.environmentIndex];d.textContent=e.name,f.textContent=M.ior.toFixed(2),b.textContent=M.ior.toFixed(2),ee.textContent=M.dispersion.toFixed(3),te.textContent=`${j(M.yaw)}° / ${j(M.pitch)}°`,p.textContent=M.inputCount?`Sample · ${j(M.yaw)}°`:`Sample at rest`,m.textContent=M.inputCount?`Last input · ${M.inputKind}`:`Awaiting trusted input`,u.textContent=M.inspectionActive?`Inspecting · grid distortion`:M.inputCount?`Reviewing · ${M.inputKind}`:`Ready · input required`,h.hidden=!M.inspectionActive,g.setAttribute(`aria-pressed`,String(M.environmentIndex===0)),_.setAttribute(`aria-pressed`,String(M.environmentIndex===1)),S.setAttribute(`aria-pressed`,String(M.inspectionActive)),S.textContent=M.inspectionActive?`Close check`:`Inspect grid`,x.disabled=U(),v.disabled=M.ior<=D,y.disabled=M.ior>=O,l.setAttribute(`aria-label`,`Glass material inspector. Environment ${e.name}. Refractive index ${M.ior.toFixed(2)}. Rotation ${j(M.yaw)} by ${j(M.pitch)} degrees. Drag to rotate; arrows rotate; brackets change index; G changes environment; Enter inspects; R resets.`)}function G(e){W(),!(!F||!M.p5Ready)&&(M.revision+=1,M.lastDrawCause=e,F.redraw())}function K(e,t,n){let r=A(k(e,-1.25,1.25)),i=A(k(t,-.58,.58));return r===M.yaw&&i===M.pitch?!1:(H(r===M.yaw?i-M.pitch:r-M.yaw,n),M.yaw=r,M.pitch=i,M.orientationMutationCount+=1,B({type:`orientation`,cause:n}),G(n),!0)}function q(e,t){let n=A(k(M.ior+e,D,O),2);return n===M.ior?(M.boundaryAttemptCount+=1,M.lastBoundary=e<0?`min-ior`:`max-ior`,e<0?M.minBoundaryCount+=1:M.maxBoundaryCount+=1,B({type:`boundary`,cause:t,boundary:M.lastBoundary}),W(),!1):(H(e,t),M.ior=n,M.lastBoundary=null,M.iorMutationCount+=1,B({type:`ior`,cause:t}),G(t),!0)}function J(e,t,n=e===1){let r=k(e,0,C.length-1);return r!==M.environmentIndex||n!==M.inspectionActive?(r!==M.environmentIndex&&(M.environmentSwitchCount+=1),n&&!M.inspectionActive&&(M.inspectionCount+=1),!n&&M.inspectionActive&&(M.inspectionClearCount+=1),M.environmentIndex=r,M.inspectionActive=n,M.resultState=n?`grid-inspection`:`material-review`,B({type:n?`inspection`:`environment`,cause:t}),G(t),!0):!1}function Y(e){M.yaw=w,M.pitch=T,M.ior=E,M.environmentIndex=0,M.inspectionActive=!1,M.resultState=`material-review`,M.lastBoundary=null,M.resetCount+=1,B({type:`reset`,cause:e}),G(e)}function X(e){return[`mouse`,`touch`,`pen`].includes(e.pointerType)?e.pointerType:`mouse`}l.addEventListener(`pointerdown`,e=>{if(e.button!==0)return;let t=X(e);V(t,e,`pointer-down`)&&(l.setPointerCapture(e.pointerId),z={pointerId:e.pointerId,pointerType:t,startX:e.clientX,startY:e.clientY,startYaw:M.yaw,startPitch:M.pitch},M.pointerCaptured=!0,M.activePointerId=e.pointerId,M.activePointerType=t,M.pointerCaptureCount+=1,B({type:`capture`,cause:`pointer-down`,kind:t}),l.focus({preventScroll:!0}),e.preventDefault())}),l.addEventListener(`pointermove`,e=>{if(!z||e.pointerId!==z.pointerId||!V(X(e),e,`pointer-drag`))return;let t=Math.max(1,l.clientWidth),n=Math.max(1,l.clientHeight);K(z.startYaw+(e.clientX-z.startX)/t*2.55,z.startPitch-(e.clientY-z.startY)/n*1.25,`pointer-drag`)&&(M.dragUpdateCount+=1),e.preventDefault()});function ie(e,t){if(!z||e.pointerId!==z.pointerId)return;let n=X(e);V(n,e,t?`pointer-cancel`:`pointer-up`)&&(l.hasPointerCapture(e.pointerId)&&l.releasePointerCapture(e.pointerId),M.pointerCaptured=!1,M.activePointerId=null,M.activePointerType=null,t?M.pointerCancelCount+=1:M.pointerReleaseCount+=1,B({type:t?`cancel`:`release`,cause:t?`pointer-cancel`:`pointer-up`,kind:n}),z=null,W())}l.addEventListener(`pointerup`,e=>ie(e,!1)),l.addEventListener(`pointercancel`,e=>ie(e,!0)),l.addEventListener(`keydown`,e=>{[`ArrowLeft`,`ArrowRight`,`ArrowUp`,`ArrowDown`,`[`,`]`,`-`,`=`,`+`,`g`,`G`,`Enter`,` `,`r`,`R`,`Home`].includes(e.key)&&V(`keyboard`,e,`key-${e.key}`)&&(e.preventDefault(),e.key===`ArrowLeft`?K(M.yaw-.13,M.pitch,`key-left`):e.key===`ArrowRight`?K(M.yaw+.13,M.pitch,`key-right`):e.key===`ArrowUp`?K(M.yaw,M.pitch+.09,`key-up`):e.key===`ArrowDown`?K(M.yaw,M.pitch-.09,`key-down`):e.key===`[`||e.key===`-`?q(-.02,`key-ior-down`):e.key===`]`||e.key===`=`||e.key===`+`?q(.02,`key-ior-up`):e.key===`g`||e.key===`G`?J(+!M.environmentIndex,`key-environment`,M.environmentIndex===0):e.key===`Enter`||e.key===` `?J(+!M.inspectionActive,`key-inspection`,!M.inspectionActive):(e.key===`r`||e.key===`R`||e.key===`Home`)&&Y(`key-${e.key}`))});function Z(e,t,n){e.addEventListener(`click`,e=>{V(`control`,e,t)&&n()})}Z(g,`control-studio`,()=>J(0,`control-studio`,!1)),Z(_,`control-grid`,()=>J(1,`control-grid`,!0)),Z(v,`control-ior-down`,()=>q(-.02,`control-ior-down`)),Z(y,`control-ior-up`,()=>q(.02,`control-ior-up`)),Z(S,`control-inspection`,()=>J(+!M.inspectionActive,`control-inspection`,!M.inspectionActive)),Z(x,`control-reset`,()=>Y(`control-reset`));function ae(e){let t=document.createElement(`canvas`);t.width=48,t.height=27;let n=t.getContext(`2d`,{willReadFrequently:!0});n.drawImage(e,0,0,t.width,t.height);let r=n.getImageData(0,0,t.width,t.height).data,i=2166136261;for(let e=0;e<r.length;e+=13)i^=r[e],i=Math.imul(i,16777619);return M.sampledPixelCount+=r.length,i>>>0}async function oe(e){let t=new Image;if(t.decoding=`async`,t.src=e.url,await t.decode(),!t.complete||t.naturalWidth!==960||t.naturalHeight!==540)throw Error(`Glass environment failed strict decode: ${e.file} (${t.naturalWidth}×${t.naturalHeight}).`);return M.assetDecodedCount+=1,t}function se(e){M.textureBindCount+=1,M.lastTextureIndex=M.environmentIndex,e.shader(R),R.setUniform(`u_resolution`,[e.width,e.height]),R.setUniform(`u_environment`,P[M.environmentIndex]),R.setUniform(`u_yaw`,M.yaw),R.setUniform(`u_pitch`,M.pitch),R.setUniform(`u_ior`,M.ior),R.setUniform(`u_dispersion`,M.dispersion),R.setUniform(`u_inspection`,+!!M.inspectionActive),e.quad(-1,-1,1,-1,1,1,-1,1),M.shaderPasses+=1,M.drawCount+=1,M.shaderCompiled=!!R?._glProgram,M.drawnRevision=M.revision,M.lastDrawnYaw=M.yaw,M.lastDrawnPitch=M.pitch,M.lastDrawnIor=M.ior}let ce=Promise.all(C.map(oe)).then(e=>{if(N=e,M.assetDimensionsValid=e.every(e=>e.naturalWidth===960&&e.naturalHeight===540),M.assetChecksums=e.map(ae),M.assetChecksumsUnique=new Set(M.assetChecksums).size===e.length,M.assetDecodedCount!==C.length||!M.assetDimensionsValid||!M.assetChecksumsUnique)throw Error(`Glass environments failed decode, dimensions, or uniqueness evidence.`);return e}).then(()=>new Promise((e,t)=>{F=new n(r=>{r.setup=async()=>{try{if(r.pixelDensity(1),I=r.createCanvas(Math.max(1,l.clientWidth),Math.max(1,l.clientHeight),r.WEBGL).parent(l).elt,r.noStroke(),r.noLoop(),P=await Promise.all(C.map(e=>r.loadImage(e.url))),M.textureImagesReady=P.length===C.length&&P.every(e=>e instanceof n.Image&&e.width===960&&e.height===540),!M.textureImagesReady)throw Error(`p5 glass environment textures failed strict loading.`);R=r.createShader(o,s),L=I.getContext(`webgl2`)||I.getContext(`webgl`),M.webglReady=!!L,M.webglVersion=L instanceof WebGL2RenderingContext?`webgl2`:L?`webgl1`:`none`,M.p5Ready=!0,r.draw=()=>se(r),r.redraw(),e()}catch(e){t(e)}}},l)})),Q=()=>new Promise(e=>requestAnimationFrame(()=>requestAnimationFrame(e))),$=Promise.all([ce,document.fonts.ready]).then(Q).then(()=>{W();let e=`${M.yaw}|${M.pitch}|${M.ior}|${M.environmentIndex}|${M.inspectionActive}|${M.orientationMutationCount}|${M.iorMutationCount}|${M.drawCount}`;return Q().then(()=>{let t=`${M.yaw}|${M.pitch}|${M.ior}|${M.environmentIndex}|${M.inspectionActive}|${M.orientationMutationCount}|${M.iorMutationCount}|${M.drawCount}`;if(M.initialStaticVerified=e===t&&M.inputCount===0&&M.yaw===w&&M.pitch===T&&M.ior===E&&M.environmentIndex===0&&!M.inspectionActive&&M.drawCount===1,!M.initialStaticVerified)throw Error(`Glass inspector first frame changed without trusted input: ${e} -> ${t}.`)})});new ResizeObserver(()=>{cancelAnimationFrame(re),re=requestAnimationFrame(()=>{if(!F||!I||!M.p5Ready)return;let e=Math.max(1,l.clientWidth),t=Math.max(1,l.clientHeight);I.width===e&&I.height===t||(F.resizeCanvas(e,t),M.resizeCount+=1,G(`viewport-resize`))})}).observe(l),window.__PREVIEW_RUNTIME_ASSERT__=async()=>{await $,await Q();let e=c.getBoundingClientRect(),t=l.getBoundingClientRect(),r=I.getBoundingClientRect(),i=C[M.environmentIndex],a=[M.previewClockMutationCount,M.inputCount,M.trustedInputCount,M.rejectedUntrustedCount,M.pointerInputCount,M.mouseInputCount,M.touchInputCount,M.penInputCount,M.keyboardInputCount,M.controlInputCount,M.positiveInputCount,M.negativeInputCount,M.reversalCount,M.orientationMutationCount,M.iorMutationCount,M.environmentSwitchCount,M.inspectionCount,M.inspectionClearCount,M.resetCount,M.boundaryAttemptCount,M.minBoundaryCount,M.maxBoundaryCount,M.pointerCaptureCount,M.pointerReleaseCount,M.pointerCancelCount,M.dragUpdateCount,M.assetDecodedCount,M.sampledPixelCount,M.textureBindCount,M.shaderPasses,M.drawCount,M.resizeCount,M.revision],o=M.trustedInputCount===M.inputCount&&M.pointerInputCount===M.mouseInputCount+M.touchInputCount+M.penInputCount&&M.inputCount===M.pointerInputCount+M.keyboardInputCount+M.controlInputCount&&M.ledger.every(e=>e.trusted===!0&&Number.isInteger(e.inputCountAtEntry)),s=M.resetCount===0||M.ledger.some(e=>e.type===`reset`),u=M.lastBoundary===null||M.lastBoundary===`min-ior`&&M.ior===D||M.lastBoundary===`max-ior`&&M.ior===O,ee=M.inspectionActive?M.environmentIndex===1&&M.resultState===`grid-inspection`&&!h.hidden&&_.getAttribute(`aria-pressed`)===`true`&&S.getAttribute(`aria-pressed`)===`true`:M.resultState===`material-review`&&h.hidden&&S.getAttribute(`aria-pressed`)===`false`,te=N.length===C.length&&N.every(e=>e instanceof HTMLImageElement&&e.complete&&e.naturalWidth===960&&e.naturalHeight===540)&&P.length===C.length&&P.every(e=>e instanceof n.Image&&e.width===960&&e.height===540)&&M.assetDecodedCount===C.length&&M.assetDimensionsValid&&M.assetChecksums.length===C.length&&M.assetChecksums.every(e=>Number.isInteger(e)&&e>0)&&M.assetChecksumsUnique&&M.sampledPixelCount===C.length*48*27*4&&M.textureImagesReady,p=F instanceof n&&I instanceof HTMLCanvasElement&&!!L&&M.p5Ready&&M.webglReady&&(M.webglVersion===`webgl2`||M.webglVersion===`webgl1`)&&M.shaderCompiled&&!!R?._glProgram&&M.transmissionShaderVerified&&M.shaderPasses===M.drawCount&&M.textureBindCount===M.drawCount&&M.lastTextureIndex===M.environmentIndex&&M.drawnRevision===M.revision&&Math.abs(M.lastDrawnYaw-M.yaw)<1e-5&&Math.abs(M.lastDrawnPitch-M.pitch)<1e-5&&Math.abs(M.lastDrawnIor-M.ior)<1e-5,m=d.textContent===i.name&&f.textContent===M.ior.toFixed(2)&&b.textContent===M.ior.toFixed(2)&&x.disabled===U()&&g.getAttribute(`aria-pressed`)===String(M.environmentIndex===0)&&_.getAttribute(`aria-pressed`)===String(M.environmentIndex===1)&&l.getAttribute(`aria-label`).includes(M.ior.toFixed(2)),v=e.left>=-.5&&e.top>=-.5&&e.right<=innerWidth+.5&&e.bottom<=innerHeight+.5&&t.left>=e.left&&t.top>=e.top&&t.right<=e.right&&t.bottom<=e.bottom&&Math.abs(r.width-t.width)<=.5&&Math.abs(r.height-t.height)<=.5&&document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1;return window.__PREVIEW_INTERACTION_STATE__===M&&window.__PREVIEW_META__?.capture===`real-demo`&&window.__PREVIEW_META__?.library===`p5@2.3.0`&&c.dataset.previewMechanism===`p5-raymarched-texture-refraction-inspector`&&M.task===`glass-material-refraction-review`&&M.userInputRequired===!0&&M.acceptedInputs.join(`|`)===`mouse|touch|pen|keyboard|control`&&M.automaticCruise===!1&&M.automaticPlayback===!1&&M.automaticRehearsal===!1&&M.automaticFallback===!1&&M.previewClockDriven===!1&&M.previewClockMutationCount===0&&M.syntheticInputDispatch===!1&&M.userOwnedOrientation===!0&&M.firstFrameStatic&&M.initialStaticVerified&&M.reducedMotionDiscreteControls&&M.yaw>=-1.25&&M.yaw<=1.25&&M.pitch>=-.58&&M.pitch<=.58&&M.ior>=D&&M.ior<=O&&M.pointerCaptured===(z!==null)&&a.every(e=>Number.isInteger(e)&&e>=0)&&o&&s&&u&&ee&&te&&p&&m&&v},W(),$.catch(e),t({id:`refractive-glass-transmission-sculpture`,library:`p5@2.3.0`,renderer:`webgl`,render:()=>{},ready:$})}catch(t){e(t)}