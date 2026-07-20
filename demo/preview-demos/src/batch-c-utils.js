export const LOOP_SECONDS = 3;

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const loopTime = seconds => ((Number(seconds) || 0) % LOOP_SECONDS + LOOP_SECONDS) % LOOP_SECONDS;
export const loopPhase = seconds => loopTime(seconds) / LOOP_SECONDS * Math.PI * 2;
export const cosineLoop = seconds => .5 - .5 * Math.cos(loopPhase(seconds));
export const smoothstep = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
export const seeded = (index, salt = 0) => {
  const value = Math.sin(index * 91.733 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
};

export function pointerUnit(event, element) {
  const bounds = element.getBoundingClientRect();
  return {
    x: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width)),
    y: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height))
  };
}

export function fitCanvas(canvas, context, width = innerWidth, height = innerHeight) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, dpr };
}

export function waitForAnimationFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}
