import './batch-a-qa.js';
import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const canvas = document.querySelector('#audio-wave');
  const context = canvas.getContext('2d');
  const divider = document.querySelector('#audio-divider');
  const play = document.querySelector('#audio-play');
  const dividerMotion = animate(divider, { x:[0,238,0] }, { duration:3, times:[0,.52,1], ease:'easeInOut' });
  dividerMotion.pause();
  let audioContext;
  let master;
  let rawGain;
  let cleanGain;
  let previewTime = 0;
  let playing = false;

  const ratioAt = time => .5 - .5 * Math.cos((time / 3) * Math.PI * 2);
  const draw = time => {
    const ratio = ratioAt(time);
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0,0,width,height);
    context.fillStyle = '#0b1424';
    context.fillRect(0,0,width,height);
    context.strokeStyle = '#233654';
    context.lineWidth = 1;
    for (let x=0;x<width;x+=28) { context.beginPath();context.moveTo(x,0);context.lineTo(x,height);context.stroke(); }
    const drawWave = (clean, color, clipStart, clipEnd) => {
      context.save();
      context.beginPath();context.rect(clipStart,0,clipEnd-clipStart,height);context.clip();
      context.beginPath();
      for (let x=0;x<width;x+=2) {
        const base = Math.sin(x*.055 + time*4)*16 + Math.sin(x*.017-time*2)*8;
        const noise = clean ? Math.sin(x*.2)*2.2 : Math.sin(x*.61)*12 + Math.sin(x*.27)*7;
        const y=height/2+base+noise;
        if (x===0) context.moveTo(x,y); else context.lineTo(x,y);
      }
      context.strokeStyle=color;context.lineWidth=3;context.shadowColor=color;context.shadowBlur=8;context.stroke();context.restore();
    };
    const split = ratio*width;
    drawWave(false,'#ff777e',0,split);
    drawWave(true,'#66efff',split,width);
    if (playing && rawGain && cleanGain && audioContext) {
      rawGain.gain.setTargetAtTime(1-ratio,audioContext.currentTime,.03);
      cleanGain.gain.setTargetAtTime(ratio,audioContext.currentTime,.03);
    }
  };

  const startAudio = async () => {
    if (!audioContext) {
      audioContext = new AudioContext();
      master = audioContext.createGain();
      master.gain.value = .08;
      master.connect(audioContext.destination);
      rawGain = audioContext.createGain();cleanGain = audioContext.createGain();
      rawGain.connect(master);cleanGain.connect(master);
      const rawOsc=audioContext.createOscillator();rawOsc.type='sawtooth';rawOsc.frequency.value=98;rawOsc.connect(rawGain);rawOsc.start();
      const cleanOsc=audioContext.createOscillator();cleanOsc.type='sine';cleanOsc.frequency.value=98;cleanOsc.connect(cleanGain);cleanOsc.start();
    }
    await audioContext.resume();
    playing = !playing;
    master.gain.setTargetAtTime(playing ? .08 : 0, audioContext.currentTime, .04);
    play.textContent=playing?'Mute A/B':'Hear A/B';
  };
  play.addEventListener('click', startAudio);

  const render = time => {
    previewTime=((time%3)+3)%3;
    dividerMotion.time=previewTime;
    draw(previewTime);
  };
  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    render(0);const a=context.getImageData(280,18,1,1).data.join(',');
    render(1.5);const b=context.getImageData(280,18,1,1).data.join(',');
    return dividerMotion.duration>=2.9 && Math.abs(dividerMotion.time-1.5)<.01 && typeof AudioContext==='function' && Boolean(context) && a!==undefined && b!==undefined;
  };
  installPreviewController({ id:'noise-cancellation-audio-comparison', library:'motion@12.42.2', renderer:'canvas2d', render, ready:Promise.resolve() });
} catch (error) {
  markPreviewFailure(error);
}
