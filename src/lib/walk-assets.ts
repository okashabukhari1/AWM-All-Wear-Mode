import sequence from "./walk-sequence.json";
export const FRAME_COUNT = sequence.count;
export const CRITICAL_FRAMES = sequence.criticalFrames;
export const WALK_SEGMENTS = sequence.segments;
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
export const MOBILE_FRAMES = sequence.mobileFrames;
export const walkingFrames = (mobile: boolean) => mobile
  ? MOBILE_FRAMES
  : Array.from({ length: FRAME_COUNT }, (_, i) => i + 1);
export const frameUrl = (index: number, mobile = false) =>
  `${sequence.assetRoot}/${mobile ? "mobile/" : ""}frame_${String(index).padStart(4, "0")}.webp?v=${sequence.revision}`;
