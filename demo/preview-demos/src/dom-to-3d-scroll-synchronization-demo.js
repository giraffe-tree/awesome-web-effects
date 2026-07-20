import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, cosineLoop } from './batch-b-utils.js';
try {
  const stage=document.querySelector('#sync-stage'),card=document.querySelector('#document-card'),plane=document.querySelector('#world-plane'),beam=document.querySelector('#sync-beam');
  const cardMotion=animate(card,{y:[0,-23],scale:[1,.9],rotate:[0,-2]},{duration:1,ease:'linear'});
  const planeMotion=animate(plane,{rotateX:[58,18],rotateY:[-34,38],z:[-18,26],scale:[.82,1.08]},{duration:1,ease:'linear'});
  const beamMotion=animate(beam,{scaleX:[.25,1],opacity:[.25,1]},{duration:1,ease:'linear'});
  [cardMotion,planeMotion,beamMotion].forEach(control=>control.pause());
  let offset=0;
  const seek=(control,p)=>{control.time=control.duration*clamp(p)};
  stage.addEventListener('wheel',event=>{event.preventDefault();offset=clamp(offset+event.deltaY*.0015,-.8,.8)},{passive:false});
  stage.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();offset=clamp(offset+(event.key==='ArrowDown'?.12:-.12),-.8,.8)});
  window.__PREVIEW_RUNTIME_ASSERT__=()=>[cardMotion,planeMotion,beamMotion].every(control=>typeof control.pause==='function'&&control.duration===1)&&stage.dataset.previewMechanism==='motion-dom-3d-sync';
  installPreviewController({id:'dom-to-3d-scroll-synchronization',library:'motion@12.42.2',renderer:'dom',render:time=>{const p=clamp(cosineLoop(time)+offset);seek(cardMotion,p);seek(planeMotion,p);seek(beamMotion,p)},ready:document.fonts.ready});
}catch(error){markPreviewFailure(error)}
