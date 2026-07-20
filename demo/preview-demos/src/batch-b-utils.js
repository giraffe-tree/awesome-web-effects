export const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
export const loopTime = (time, duration = 3) => ((Number(time) || 0) % duration + duration) % duration;
export const cosineLoop = (time, duration = 3) => .5 - .5 * Math.cos(loopTime(time, duration) / duration * Math.PI * 2);
export const smoothstep = value => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};
export const seeded = (index, salt = 0) => {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};
export function resizeCanvas(canvas, context, pixelRatio = 1) {
  const width = Math.round(innerWidth * pixelRatio);
  const height = Math.round(innerHeight * pixelRatio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }
}
