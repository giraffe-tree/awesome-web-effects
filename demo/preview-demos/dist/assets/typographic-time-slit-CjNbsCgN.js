import"./shared-DJbJzhDe.js";import{i as e,t}from"./expansion-a-utils-anD0k7Pd.js";e({id:`typographic-time-slit`,pointerPhase:1.5,draw(e,n,r,i){e.background(`#e94b3c`),e.textStyle(e.BOLD),e.textSize(41),e.textLeading(34),e.fill(`#18100e`),e.text(`BEFORE
BECOMES
AFTER`,18,63);let a=i.y*e.height,o=34+Math.sin(n/3*t)*7,s=e.drawingContext;s.save(),s.beginPath(),s.rect(0,a-o/2,e.width,o),s.clip(),e.background(`#161317`),e.fill(`#f8e9cc`),e.text(`NOW
BREAKS
THROUGH`,18+(i.x-.5)*34,63),s.restore(),e.stroke(`#f8e9cc`),e.strokeWeight(1),e.line(0,a-o/2,e.width,a-o/2),e.line(0,a+o/2,e.width,a+o/2),e.noStroke(),e.fill(`#18100e`),e.textSize(7),e.text(`TIME / MOVING APERTURE`,210,165)}});