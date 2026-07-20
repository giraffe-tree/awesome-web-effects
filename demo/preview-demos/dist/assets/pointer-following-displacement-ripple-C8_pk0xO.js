import{a as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shared-DJbJzhDe.js";import{t as r}from"./regl-B2Y2V2F1.js";import{t as i}from"./batch-b-utils-CmA_lC0Z.js";var a=e(r(),1);try{let e=document.querySelector(`#ripple-stage`),r=document.querySelector(`#ripple-canvas`),o=document.querySelector(`#ripple-ring`),s=document.querySelector(`#ripple-status`),c=Math.min(devicePixelRatio||1,2),l=(0,a.default)({canvas:r,pixelRatio:c,attributes:{antialias:!0,alpha:!1}}),u=new URL(``+new URL(`coastal-pavilion-displacement-source-C96Ow6Fh.jpg`,import.meta.url).href,``+import.meta.url).href,d=new Image;d.decoding=`async`,d.src=u;let f=l.texture({width:1,height:1,data:[21,33,31,255],min:`linear`,mag:`linear`,wrap:`clamp`}),p=!1,m=d.decode().then(()=>{f({data:d,flipY:!0,min:`linear`,mag:`linear`,wrap:`clamp`}),p=!0}),h={automaticPath:!1,engaged:!1,eventTime:0,inputCount:0,inputKind:`none`,mode:`idle`,origin:{x:.56,y:.48},strength:0};window.__PREVIEW_INTERACTION_STATE__=h;let g=0,_=0,v={...h.origin},y=0,b=l({vert:`
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = position * .5 + .5;
        gl_Position = vec4(position, 0., 1.);
      }
    `,frag:`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D source;
      uniform vec2 origin;
      uniform float age;
      uniform float aspect;
      uniform float impulse;

      void main() {
        vec2 delta = uv - origin;
        delta.x *= aspect;
        float radius = length(delta);
        vec2 direction = delta / max(radius, .0001);
        direction.x /= aspect;

        float decay = exp(-age * 2.15) * impulse;
        float expandingRadius = age * .14;
        float front = exp(-pow((radius - expandingRadius) * 34., 2.));
        float elastic = sin((radius - expandingRadius) * 96.) * exp(-radius * 8.5);
        float displacement = (front * .76 + elastic * .24) * .058 * decay;
        vec2 offset = direction * displacement;
        float spectral = front * decay * .0052;

        vec2 redUv = clamp(uv + offset * 1.12 + direction * spectral, 0., 1.);
        vec2 greenUv = clamp(uv + offset, 0., 1.);
        vec2 blueUv = clamp(uv + offset * .88 - direction * spectral, 0., 1.);
        vec3 color = vec3(
          texture2D(source, redUv).r,
          texture2D(source, greenUv).g,
          texture2D(source, blueUv).b
        );

        float highlight = front * decay * .24;
        color += vec3(.72, .9, .94) * highlight;
        color = mix(color, color * vec3(.94, .99, .97), .08);
        gl_FragColor = vec4(color, 1.);
      }
    `,attributes:{position:[[-1,-1],[3,-1],[-1,3]]},uniforms:{source:f,origin:l.prop(`origin`),age:l.prop(`age`),aspect:l.prop(`aspect`),impulse:l.prop(`impulse`)},count:3,depth:{enable:!1}});function x(){let e=Math.round(innerWidth*c),t=Math.round(innerHeight*c);r.width===e&&r.height===t||(r.width=e,r.height=t,r.style.width=`${innerWidth}px`,r.style.height=`${innerHeight}px`,l.poll())}function S(e,t){let n=r.getBoundingClientRect();return{x:i((e-n.left)/n.width,.03,.97),y:1-i((t-n.top)/n.height,.05,.95)}}function C(t,n,r=performance.now()){let a=Math.hypot(t.x-v.x,t.y-v.y)/Math.max(16,r-_)*1e3;h.origin=t,h.eventTime=g,h.inputCount+=1,h.inputKind=n,h.strength=i(.6+a*.17,.6,1),h.engaged=!0,h.mode=`active`,v={...t},_=r,e.dataset.phase=`active`}function w(){h.engaged=!1,h.mode=`idle`,h.strength=0,e.dataset.phase=`idle`,s.textContent=`Still water / ready`}r.addEventListener(`pointerdown`,e=>{r.setPointerCapture?.(e.pointerId),C(S(e.clientX,e.clientY),e.pointerType||`pointer`,e.timeStamp)}),r.addEventListener(`pointermove`,e=>{e.pointerType===`touch`&&e.buttons===0||C(S(e.clientX,e.clientY),e.pointerType||`pointer`,e.timeStamp)}),r.addEventListener(`pointerup`,e=>{r.hasPointerCapture?.(e.pointerId)&&r.releasePointerCapture(e.pointerId)}),r.addEventListener(`pointerleave`,e=>{e.pointerType===`mouse`&&w()}),r.addEventListener(`pointercancel`,w),r.addEventListener(`blur`,w),r.addEventListener(`keydown`,e=>{let t={ArrowLeft:[-.055,0],ArrowRight:[.055,0],ArrowUp:[0,.055],ArrowDown:[0,-.055]}[e.key];if(!t){e.key===`Escape`&&w();return}e.preventDefault(),C({x:i(h.origin.x+t[0],.03,.97),y:i(h.origin.y+t[1],.05,.95)},`keyboard`,e.timeStamp)}),window.__PREVIEW_RUNTIME_ASSERT__=()=>typeof b==`function`&&p&&d.complete&&d.naturalWidth===1280&&d.naturalHeight===720&&typeof f.destroy==`function`&&!l._gl.isContextLost()&&y>0&&window.__PREVIEW_INTERACTION_STATE__===h&&h.automaticPath===!1&&[`idle`,`active`,`settling`].includes(h.mode)&&typeof h.engaged==`boolean`&&Number.isFinite(h.origin.x)&&Number.isFinite(h.origin.y)&&h.origin.x>=.03&&h.origin.x<=.97&&h.origin.y>=.05&&h.origin.y<=.95&&Number.isInteger(h.inputCount)&&h.inputCount>=0&&(h.mode===`idle`?h.engaged===!1&&h.strength===0:h.engaged===!0&&h.strength>0),n({id:`pointer-following-displacement-ripple`,library:`regl@2.1.1`,renderer:`webgl`,render:t=>{g=Number(t)||0,x();let n=0,r=0;h.engaged&&(n=Math.max(0,g-h.eventTime),r=h.strength,n>.22&&(h.mode=`settling`),n>1.65&&w()),l.clear({color:[.08,.13,.12,1]}),b({origin:[h.origin.x,h.origin.y],age:n,impulse:r,aspect:innerWidth/innerHeight}),y+=1,o.style.left=`${h.origin.x*100}%`,o.style.top=`${(1-h.origin.y)*100}%`,e.dataset.phase=h.mode,s.textContent=h.mode===`active`?`${h.inputKind} / refracting`:h.mode===`settling`?`Elastic recovery / settling`:`Still water / ready`},ready:Promise.all([document.fonts.ready,m]).catch(e=>{throw t(e),e})}),window.addEventListener(`beforeunload`,()=>{f.destroy(),l.destroy()},{once:!0})}catch(e){t(e)}