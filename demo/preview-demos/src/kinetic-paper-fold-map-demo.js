import { TAU, mix, mountP5Demo } from './expansion-a-utils.js';

mountP5Demo({
  id: 'kinetic-paper-fold-map',
  pointerPhase: 0.8,
  draw(p, time, state, pointer) {
    p.background('#ed5944');
    const fold = state.active ? 0.92 : 0.18 + pointer.x * 0.72;
    const cx = 196;
    const cy = 92;
    const half = 70;
    const apex = { x: mix(cx + half, cx + 10, fold), y: mix(cy - half, cy - 4, fold) };
    p.noStroke();
    p.fill('#401f77aa');
    p.ellipse(cx + 5, cy + 58, 150 - fold * 45, 22);
    const faces = [
      { color: '#fff0c7', points: [[cx-half,cy-half],[cx,cy],[cx-half,cy+half]] },
      { color: '#ffcf4f', points: [[cx-half,cy-half],[apex.x,apex.y],[cx,cy]] },
      { color: '#6b5fff', points: [[apex.x,apex.y],[cx+half,cy+half],[cx,cy]] },
      { color: '#d8ff67', points: [[cx,cy],[cx+half,cy+half],[cx-half,cy+half]] },
    ];
    faces.forEach((face, index) => {
      p.fill(face.color);
      p.stroke('#24170f');
      p.strokeWeight(1);
      p.beginShape();
      face.points.forEach(([x, y]) => p.vertex(x, y));
      p.endShape(p.CLOSE);
      if (index === 1) {
        p.noStroke();
        p.fill('#24170f');
        p.circle(mix(cx - 18, apex.x - 7, fold), mix(cy - 20, apex.y + 13, fold), 5);
      }
    });
    p.noStroke();
    p.fill('#24170f');
    p.textStyle(p.BOLD);
    p.textSize(22);
    p.textLeading(19);
    p.text('FOLD A\nNEW ROUTE.', 16, 76);
    p.textSize(7);
    p.text(`CREASE / ${(fold * 100).toFixed(0)}`, 17, 48);
    p.stroke('#24170f');
    p.line(17, 143, 115, 143);
    p.noFill();
    p.arc(66, 143, 42, 42, Math.PI, Math.PI + (time / 3) * TAU);
  },
});
