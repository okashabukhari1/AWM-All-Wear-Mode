import { describe, expect, it } from "vitest";
import { ringIndex, rotationForIndex } from "./ring-math";

describe("product ring selection", () => {
  it("wraps previous and next across the first/last product", () => {
    expect(ringIndex(rotationForIndex(-1, 0, 8), 8)).toBe(7);
    expect(ringIndex(rotationForIndex(8, -315, 8), 8)).toBe(0);
  });
  it("snaps a dragged ring to the nearest product after multiple turns", () => {
    expect(ringIndex(748, 8)).toBe(7);
    expect(ringIndex(-812, 8)).toBe(2);
    const target = rotationForIndex(2, 748, 8);
    expect(Math.abs(target - 748)).toBeLessThanOrEqual(180);
    expect(ringIndex(target, 8)).toBe(2);
  });
  it("handles a catalogue with no trending products", () => {
    expect(ringIndex(320, 0)).toBe(0);
    expect(rotationForIndex(1, 320, 0)).toBe(0);
  });
});
