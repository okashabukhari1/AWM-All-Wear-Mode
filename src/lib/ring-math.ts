export const ringIndex = (rotation: number, count: number) =>
  count ? ((Math.round(-rotation / (360 / count)) % count) + count) % count : 0;

export const rotationForIndex = (index: number, rotation: number, count: number) => {
  if (!count) return 0;
  const desired = -index * 360 / count;
  return rotation + ((desired - rotation) % 360 + 540) % 360 - 180;
};
