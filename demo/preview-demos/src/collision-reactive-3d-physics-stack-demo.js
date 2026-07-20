import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { loopTime, seeded } from './batch-c-utils.js';

try {
  const host = document.querySelector('#physics-host');
  const readout = document.querySelector('#impact-readout');
  let time = 0;
  let extraBodies = 0;
  let strike = 0;
  let draws = 0;
  let lastRealtime = -Infinity;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const excite = () => {
    extraBodies = (extraBodies + 1) % 3;
    strike += 1;
  };
  host.addEventListener('pointerdown', excite);
  host.addEventListener('keydown', event => {
    if (![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    excite();
  });

  function simulate(seconds) {
    const count = 5 + extraBodies;
    const bodies = Array.from({ length: count }, (_, index) => ({
      x: (index % 3 - 1) * 26 + (seeded(index, 3) - .5) * 6,
      y: -42 - index * 13,
      z: (index % 2 - .5) * 17,
      vx: (seeded(index, 6) - .5) * 12,
      vy: 0,
      angle: (seeded(index, 8) - .5) * .45,
      spin: (seeded(index, 9) - .5) * 1.2,
      flash: 0,
      size: 20 + (index % 2) * 4
    }));
    let maxImpulse = 0;
    const steps = Math.floor(seconds * 60);
    const dt = 1 / 60;
    for (let step = 0; step < steps; step += 1) {
      bodies.forEach((body, index) => {
        body.vy += 126 * dt;
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        body.angle += body.spin * dt;
        body.flash *= .9;
        const floor = 54 - body.size / 2;
        if (body.y > floor) {
          const impulse = Math.abs(body.vy);
          body.y = floor;
          body.vy = -body.vy * .3;
          body.vx *= .82;
          body.flash = Math.min(1, impulse / 90);
          maxImpulse = Math.max(maxImpulse, impulse);
        }
        if (strike && step === 18 && index === 0) body.vx += strike % 2 ? 34 : -34;
        if (body.x < -55 || body.x > 55) {
          body.x = Math.max(-55, Math.min(55, body.x));
          body.vx *= -.45;
        }
      });
      for (let a = 0; a < bodies.length; a += 1) {
        for (let b = a + 1; b < bodies.length; b += 1) {
          const A = bodies[a];
          const B = bodies[b];
          const dx = B.x - A.x;
          const dy = B.y - A.y;
          const minimum = (A.size + B.size) * .48;
          const distance = Math.hypot(dx, dy);
          if (distance >= minimum || distance < .001) continue;
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = minimum - distance;
          A.x -= nx * overlap * .5;
          A.y -= ny * overlap * .5;
          B.x += nx * overlap * .5;
          B.y += ny * overlap * .5;
          const relative = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (relative < 0) {
            const impulse = -relative * .58;
            A.vx -= nx * impulse;
            A.vy -= ny * impulse;
            B.vx += nx * impulse;
            B.vy += ny * impulse;
            A.flash = B.flash = Math.min(1, impulse / 52);
            maxImpulse = Math.max(maxImpulse, impulse);
          }
        }
      }
    }
    return { bodies, maxImpulse };
  }

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight, p.WEBGL).parent(host);
      p.noLoop();
      resolveReady();
    };
    p.draw = () => {
      draws += 1;
      const state = simulate(loopTime(time));
      p.background('#080b13');
      p.camera(0, -8, 340, 0, 0, 0, 0, 1, 0);
      p.ambientLight(42, 47, 64);
      p.directionalLight(180, 202, 255, -.4, .5, -1);
      p.pointLight(255, 154, 79, 70, -65, 120);
      p.translate(35, -7, 0);
      p.scale(.55);
      p.rotateX(-.12);
      p.rotateY(-.32);
      p.noStroke();
      p.push();
      p.translate(0, 60, 0);
      p.ambientMaterial('#252c3e');
      p.box(164, 16, 92, 4);
      p.pop();
      state.bodies.forEach((body, index) => {
        p.push();
        p.translate(body.x, body.y, body.z);
        p.rotateZ(body.angle);
        const color = ['#617cff', '#f5a95d', '#b37aff', '#56ddb5'][index % 4];
        if (body.flash > .12) p.emissiveMaterial(255, 110 + body.flash * 120, 68);
        else p.ambientMaterial(color);
        p.box(body.size, body.size, body.size, 3);
        if (body.flash > .16) {
          p.noFill();
          p.stroke(255, 164, 91, 125 * body.flash);
          p.strokeWeight(1);
          p.box(body.size + 5 + body.flash * 5);
          p.noStroke();
        }
        p.pop();
      });
      readout.textContent = `IMPULSE ${state.maxImpulse.toFixed(1)}`;
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    sketch instanceof p5 &&
    draws > 0 &&
    Boolean(host.querySelector('canvas')?.getContext('webgl2') || host.querySelector('canvas')?.getContext('webgl'))
  );
  installPreviewController({
    id: 'collision-reactive-3d-physics-stack',
    library: 'p5@2.3.0',
    renderer: 'webgl',
    render: (nextTime, manual) => {
      if (!manual && nextTime - lastRealtime < 1 / 18) return;
      lastRealtime = nextTime;
      time = nextTime;
      sketch.redraw();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
