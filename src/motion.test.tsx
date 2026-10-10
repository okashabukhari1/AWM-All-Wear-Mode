import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import Home from "./pages/Home";

describe("static reduced-motion experience", () => {
  it("keeps all campaign content and collection actions without an intro overlay", () => {
    Object.defineProperty(globalThis, "sessionStorage", {
      value: { getItem: () => null },
      configurable: true,
    });
    Object.defineProperty(globalThis, "matchMedia", {
      value: () => ({ matches: true }),
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
    });
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(html).not.toContain('class="preloader"');
    expect(html).toContain('id="perspective"');
    expect(html).toContain('href="/men"');
    expect(html).toContain('href="/women"');
    expect(html).toContain("OUTFIT EXPLORER");
    expect(html).toContain("Current");
    expect(html).toContain('class="trending-static-grid"');
    expect(html).not.toContain('class="image-ring-stage"');
    expect(html).toContain("YOUR STYLE.");
    expect(html).not.toContain("scroll-dissolve");
    expect(html).toContain('class="cinema-hero is-static"');
    expect(html).not.toContain("<canvas");
    expect(html).not.toContain("cinema-frame");
    expect(html).toContain("frame_0180.webp");
    expect(html).toContain("SHOP THE EDIT");
    expect(html).toContain("COLLECTION");
    expect(html).toContain('href="/collections/streetwear"');
    delete (globalThis as { window?: unknown }).window;
  });
});
