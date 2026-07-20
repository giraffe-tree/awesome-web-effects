import{a as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shared-DJbJzhDe.js";import{t as r}from"./regl-B2Y2V2F1.js";var i=e(r(),1);try{let e=document.querySelector(`#fluid-canvas`),t=document.querySelector(`#inject-reticle`),r=document.querySelector(`#fluid-meter`),a=Math.min(devicePixelRatio||1,2),o=(0,i.default)({canvas:e,pixelRatio:a,attributes:{antialias:!1,alpha:!1}}),s=[.72,.52],c=!1,l=0,u=o({vert:`
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
      uniform float time;
      uniform float aspect;
      uniform vec2 pointer;

      mat2 rotate2d(float angle) {
        float c = cos(angle), s = sin(angle);
        return mat2(c, -s, s, c);
      }

      void main() {
        vec2 p = uv - .5;
        p.x *= aspect;
        vec2 source = pointer - .5;
        source.x *= aspect;
        vec2 advected = p;
        float dye = 0.;
        float curl = 0.;
        for (int i = 0; i < 7; i++) {
          float fi = float(i);
          float age = fi * .105;
          vec2 trail = source - vec2(.34 * age, sin(time * 2.3 - fi * .72) * .075);
          vec2 delta = advected - trail;
          float radius = dot(delta, delta) + .008;
          float vortex = exp(-radius * (22. + fi * 2.));
          advected += vec2(-delta.y, delta.x) * vortex * (.46 - age * .32);
          advected = rotate2d(sin(time * .9 + fi) * .012) * advected;
          dye += vortex * (1. - age * .55);
          curl += vortex * sin(fi * 1.7 + time * 2.);
        }
        float filaments = sin(advected.x * 31. - time * 2.4 + sin(advected.y * 18.))
          * cos(advected.y * 24. + time * 1.5);
        float body = smoothstep(.42, -.08, length(advected - source * .18));
        vec3 navy = vec3(.008, .016, .05);
        vec3 cyan = vec3(.02, .92, .95);
        vec3 violet = vec3(.55, .14, 1.);
        vec3 coral = vec3(1., .22, .36);
        vec3 color = navy;
        color += mix(cyan, violet, .5 + .5 * sin(filaments + time)) * dye * .82;
        color += coral * max(0., curl) * .34;
        color += mix(violet, cyan, uv.y) * body * (.08 + filaments * .025);
        color *= .78 + .22 * smoothstep(1.1, .1, length(p));
        gl_FragColor = vec4(pow(max(color, 0.), vec3(.82)), 1.);
      }
    `,attributes:{position:[[-1,-1],[3,-1],[-1,3]]},uniforms:{time:o.prop(`time`),aspect:o.prop(`aspect`),pointer:o.prop(`pointer`)},count:3,depth:{enable:!1}});function d(){let t=Math.round(innerWidth*a),n=Math.round(innerHeight*a);e.width===t&&e.height===n||(e.width=t,e.height=n,e.style.width=`${innerWidth}px`,e.style.height=`${innerHeight}px`,o.poll())}function f(t,n){let r=e.getBoundingClientRect();s[0]=Math.max(.08,Math.min(.94,(t-r.left)/r.width)),s[1]=1-Math.max(.08,Math.min(.92,(n-r.top)/r.height)),c=!0}e.addEventListener(`pointermove`,e=>f(e.clientX,e.clientY)),e.addEventListener(`pointerdown`,e=>f(e.clientX,e.clientY)),e.addEventListener(`keydown`,e=>{let t={ArrowLeft:[-.06,0],ArrowRight:[.06,0],ArrowUp:[0,.06],ArrowDown:[0,-.06]}[e.key];t&&(e.preventDefault(),s[0]=Math.max(.08,Math.min(.94,s[0]+t[0])),s[1]=Math.max(.08,Math.min(.92,s[1]+t[1])),c=!0)});function p(e){d();let n=(e%3+3)%3,i=c?s:[.68+Math.cos(n/3*Math.PI*2)*.18,.5+Math.sin(n/3*Math.PI*2)*.2];o.clear({color:[.003,.006,.02,1]}),u({time:n,aspect:innerWidth/innerHeight,pointer:i}),l+=1,t.style.left=`${i[0]*100}%`,t.style.top=`${(1-i[1])*100}%`,r.textContent=`CURL ${(Math.sin(n*2.1)*.5+.5).toFixed(2)}`}window.__PREVIEW_RUNTIME_ASSERT__=()=>typeof o==`function`&&typeof u==`function`&&!!(e.getContext(`webgl`)||e.getContext(`experimental-webgl`))&&!o._gl.isContextLost()&&l>0,n({id:`pointer-injected-gpu-fluid`,library:`regl@2.1.1`,renderer:`webgl`,render:p,ready:Promise.resolve()})}catch(e){t(e)}