import{a as e}from"./rolldown-runtime-CNC7AqOf.js";import{n as t,t as n}from"./shared-DJbJzhDe.js";import{t as r}from"./regl-B2Y2V2F1.js";var i=e(r(),1);try{let e=document.querySelector(`#regl-canvas`),t=Math.min(devicePixelRatio,2),r=(0,i.default)({canvas:e,pixelRatio:t,attributes:{antialias:!0,alpha:!1}}),a=1100,o=Array.from({length:a},(e,t)=>[Math.sqrt((t+.5)/a),t*2.399963229728653%(Math.PI*2),t%29/29]),s=r({vert:`
      precision mediump float;
      attribute vec3 seed;
      uniform float time;
      varying float glow;
      varying float colorMix;
      void main() {
        float radius = seed.x;
        float angle = seed.y + time * (.35 + (1.0 - radius) * .75) + sin(time * .7 + radius * 11.0) * .22;
        float fold = sin(angle * 3.0 + time + radius * 9.0) * .18;
        vec2 point = vec2(cos(angle), sin(angle)) * (radius * .92 + fold);
        point.x *= 1.55;
        point += vec2(sin(time * .8) * .08, cos(time * .55) * .04);
        gl_Position = vec4(point, 0.0, 1.0);
        gl_PointSize = (2.2 + (1.0 - radius) * 3.8) * ${t.toFixed(1)};
        glow = 1.0 - radius;
        colorMix = seed.z;
      }
    `,frag:`
      precision mediump float;
      varying float glow;
      varying float colorMix;
      void main() {
        vec2 centered = gl_PointCoord - .5;
        float alpha = smoothstep(.5, .08, length(centered));
        vec3 cyan = vec3(.12, .93, 1.0);
        vec3 violet = vec3(.64, .26, 1.0);
        vec3 color = mix(cyan, violet, colorMix) + glow * vec3(.35, .18, .5);
        gl_FragColor = vec4(color, alpha * .9);
      }
    `,attributes:{seed:o},uniforms:{time:r.prop(`time`)},primitive:`points`,count:a,blend:{enable:!0,func:{srcRGB:`src alpha`,dstRGB:`one`,srcAlpha:`one`,dstAlpha:`one`}},depth:{enable:!1}}),c=r({vert:`
      precision mediump float;
      attribute vec2 position;
      uniform float time;
      varying vec2 uv;
      void main() {
        uv = position;
        float pulse = .72 + sin(time * 2.1) * .06;
        gl_Position = vec4(position * vec2(.34, .58) * pulse, 0.0, 1.0);
      }
    `,frag:`
      precision mediump float;
      uniform float time;
      varying vec2 uv;
      void main() {
        float radius = length(uv);
        float ring = smoothstep(.8, .22, radius) - smoothstep(.33, .0, radius);
        float spokes = pow(abs(sin(atan(uv.y, uv.x) * 7.0 - time * 2.0)), 18.0);
        vec3 color = mix(vec3(.1, .9, 1.), vec3(.72, .25, 1.), radius);
        gl_FragColor = vec4(color, (ring * .46 + spokes * .12) * smoothstep(1., .4, radius));
      }
    `,attributes:{position:[[-1,-1],[1,-1],[0,1]]},uniforms:{time:r.prop(`time`)},count:3,blend:{enable:!0,func:{srcRGB:`src alpha`,dstRGB:`one`,srcAlpha:`one`,dstAlpha:`one`}},depth:{enable:!1}});function l(){let n=Math.round(innerWidth*t),i=Math.round(innerHeight*t);(e.width!==n||e.height!==i)&&(e.width=n,e.height=i,e.style.width=`${innerWidth}px`,e.style.height=`${innerHeight}px`,r.poll())}function u(e){l(),r.clear({color:[.018,.03,.07,1],depth:1}),c({time:e}),s({time:e})}n({id:`functional-webgl-draw-commands`,library:`regl@2.1.1`,render:u,ready:Promise.resolve()})}catch(e){t(e)}