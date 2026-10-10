import { describe, expect, it } from "vitest";
import { imageVariants } from "./image-assets";
describe("responsive local assets", () => {
  it("resolves previously saved stock URLs to local WebP variants", () => {
    const variants = imageVariants("https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=85");
    expect(variants.map(image => image.width)).toEqual([480, 900, 1600]);
    expect(variants.every(image => image.src.startsWith("/images/editorial/") && image.src.endsWith(".webp"))).toBe(true);
  });
  it("does not upscale the featured reference photographs", () => {
    expect(imageVariants("/images/modest-fashion/8422463.jpg").map(image => image.width)).toEqual([480, 900, 1000]);
  });
  it("preserves arbitrary admin uploads", () => {
    expect(imageVariants("https://example.test/custom-garment.jpg")).toEqual([{src:"https://example.test/custom-garment.jpg",width:0}]);
  });
});
