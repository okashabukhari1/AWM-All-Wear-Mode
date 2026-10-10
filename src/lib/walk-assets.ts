export const FRAME_COUNT = 180;
export const CRITICAL_FRAMES = [1, 31, 61, 91, 121, 151, FRAME_COUNT];
const prepared = new Map<string, HTMLImageElement>();
const key = (index: number, mobile: boolean) => `${mobile}:${index}`;
export function rememberWalkingFrame(index: number, mobile: boolean, image: HTMLImageElement) {
  prepared.set(key(index, mobile), image);
}
export function takePreparedWalkingFrame(index: number, mobile: boolean) {
  const id = key(index, mobile), image = prepared.get(id);
  prepared.delete(id);
  return image;
}
export const MOBILE_FRAMES = [...Array.from({ length: 90 }, (_, i) => i * 2 + 1), FRAME_COUNT];
export const walkingFrames = (mobile: boolean) => mobile
  ? MOBILE_FRAMES
  : Array.from({ length: FRAME_COUNT }, (_, i) => i + 1);
export const frameUrl = (index: number, mobile = false) =>
  `/animations/awm-walk/${mobile ? "mobile/" : ""}frame_${String(index).padStart(4, "0")}.webp`;
