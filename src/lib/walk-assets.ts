export const FRAME_COUNT = 180;
export const MOBILE_FRAMES = [...Array.from({ length: 90 }, (_, i) => i * 2 + 1), FRAME_COUNT];
export const walkingFrames = (mobile: boolean) => mobile
  ? MOBILE_FRAMES
  : Array.from({ length: FRAME_COUNT }, (_, i) => i + 1);
export const frameUrl = (index: number, mobile = false) =>
  `/animations/awm-walk/${mobile ? "mobile/" : ""}frame_${String(index).padStart(4, "0")}.webp`;
