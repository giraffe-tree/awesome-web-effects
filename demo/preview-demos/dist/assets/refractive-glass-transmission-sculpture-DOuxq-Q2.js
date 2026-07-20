import{n as e,t}from"./shared-DJbJzhDe.js";import{t as n}from"./app-Dj3RhBXi.js";import{a as r,o as i,t as a}from"./batch-c-utils-g_3IBZ2b.js";var o=`
precision highp float;
attribute vec3 aPosition;
void main(){gl_Position=vec4(aPosition.xy,0.0,1.0);}
`,s=`
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_yaw;

mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float sdSphere(vec3 p,float r){return length(p)-r;}
float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
float scene(vec3 p){
  p.xz*=rot(u_yaw);
  vec3 q=p;
  q.xy*=rot(.55);
  float orb=sdSphere(q, .74);
  float ring=sdTorus(p+vec3(.12,.03,0.),vec2(.72,.22));
  float bite=-sdSphere(p-vec3(.40,.22,.28),.41);
  return max(min(orb,ring),bite);
}
vec3 normalAt(vec3 p){
  vec2 e=vec2(.002,0.0);
  return normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));
}
vec3 environment(vec3 d){
  float stripe=.5+.5*sin(15.0*atan(d.x,d.z)+u_time*1.6+5.0*d.y);
  vec3 coral=vec3(1.0,.22,.34), cyan=vec3(.08,.92,.77), violet=vec3(.38,.24,.96);
  vec3 color=mix(coral,cyan,smoothstep(.2,.8,stripe));
  color=mix(color,violet,.5+.5*sin(d.y*12.0-u_time));
  return color*(.62+.38*max(d.y,0.0));
}
void main(){
  vec2 uv=(gl_FragCoord.xy*2.0-u_resolution.xy)/u_resolution.y;
  vec3 ro=vec3(0.,0.,3.15),rd=normalize(vec3(uv,-1.9));
  float distanceTravelled=0.0;bool hit=false;vec3 p;
  for(int i=0;i<74;i++){
    p=ro+rd*distanceTravelled;
    float d=scene(p);
    if(abs(d)<.0015){hit=true;break;}
    distanceTravelled+=d*.72;
    if(distanceTravelled>6.0)break;
  }
  vec3 color=environment(rd);
  if(hit){
    vec3 n=normalAt(p);
    float fres=pow(1.0-max(0.0,dot(-rd,n)),3.0);
    vec3 rr=refract(rd,n,1.0/1.45);
    vec3 rR=refract(rd,n,1.0/1.41),rB=refract(rd,n,1.0/1.50);
    vec3 transmitted=vec3(environment(rR).r,environment(rr).g,environment(rB).b);
    vec3 reflected=environment(reflect(rd,n));
    color=mix(transmitted,reflected,.12+fres*.72);
    color+=pow(max(0.0,dot(n,normalize(vec3(-.4,.7,1.)))),22.0)*1.3;
  }
  float vignette=1.0-.24*dot(uv,uv);
  color*=vignette;
  color=pow(max(color,0.0),vec3(.82));
  gl_FragColor=vec4(color,1.0);
}
`;try{let e=document.querySelector(`#glass-host`),c=0,l=null,u=0,d=-1/0,f,p,m,h=new Promise(e=>{m=e});e.addEventListener(`pointermove`,t=>{l=(i(t,e).x-.5)*2.8}),e.addEventListener(`pointerleave`,()=>{l=null}),e.addEventListener(`keydown`,e=>{[`ArrowLeft`,`ArrowRight`].includes(e.key)&&(e.preventDefault(),l=a((l??0)+(e.key===`ArrowRight`?.16:-.16),-1.4,1.4))}),p=new n(t=>{t.setup=()=>{t.pixelDensity(1),t.createCanvas(innerWidth,innerHeight,t.WEBGL).parent(e),f=t.createShader(o,s),t.noStroke(),t.noLoop(),m()},t.draw=()=>{u+=1;let e=l??Math.sin(r(c)/3*Math.PI*2)*.85;t.shader(f),f.setUniform(`u_resolution`,[t.width,t.height]),f.setUniform(`u_time`,r(c)),f.setUniform(`u_yaw`,e),t.rect(-t.width/2,-t.height/2,t.width,t.height)}},e),window.__PREVIEW_RUNTIME_ASSERT__=()=>p instanceof n&&!!f?._glProgram&&u>0&&!!(e.querySelector(`canvas`)?.getContext(`webgl2`)||e.querySelector(`canvas`)?.getContext(`webgl`)),t({id:`refractive-glass-transmission-sculpture`,library:`p5@2.3.0`,renderer:`webgl`,render:(e,t)=>{!t&&e-d<1/12||(c=e,d=e,p.redraw())},ready:h})}catch(t){e(t)}