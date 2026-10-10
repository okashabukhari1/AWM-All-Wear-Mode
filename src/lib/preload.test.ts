import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareWebsite, runLoadQueue } from "./preload";
import { uniqueImageSources } from "./image-assets";
import { CRITICAL_FRAMES, WALK_SEGMENTS, frameUrl, walkingFrames } from "./walk-assets";

vi.mock("../page-loaders", () => ({ pageLoaderFor: vi.fn(() => async () => ({})) }));
afterEach(() => vi.unstubAllGlobals());

function mockBrowser(missingFrame = false, images: unknown[] = []) {
  const fonts = deferred();
  const requests: string[] = [];
  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    decoding = "async";
    set src(value: string) {
      requests.push(value);
      queueMicrotask(() => {
        if (missingFrame && value.includes("frame_0001.webp")) this.onerror?.();
        else this.onload?.();
      });
    }
    decode() { return Promise.resolve(); }
    removeAttribute() {}
  }
  vi.stubGlobal("Image", MockImage);
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("max-width") }));
  vi.stubGlobal("window", { innerHeight: 900 });
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => { queueMicrotask(callback); return 1; });
  vi.stubGlobal("document", { fonts: { ready: fonts.promise }, querySelectorAll: () => images });
  return { fonts, requests };
}

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
};

describe("website readiness", () => {
  it("waits for page rendering and fonts even after every image has loaded", async () => {
    const { fonts, requests } = mockBrowser();
    const page = deferred();
    const routes = vi.fn();
    const ready = vi.fn();
    const progress = vi.fn();
    const loading = prepareWebsite({ pathname: "/", signal: new AbortController().signal,
      waitForPage: page.promise, onRoutesReady: routes, onProgress: progress,
    }).then(ready);
    await vi.waitFor(() => expect(routes).toHaveBeenCalledOnce());
    expect(routes).toHaveBeenCalledOnce();
    expect(ready).not.toHaveBeenCalled();
    page.resolve();
    await vi.waitFor(() => expect(requests.filter(src => src.includes("/animations/"))).toHaveLength(7));
    await vi.waitFor(() => {
      const [settled, total] = progress.mock.lastCall!;
      expect(settled).toBe(total - 1);
    });
    expect(ready).not.toHaveBeenCalled();
    fonts.resolve();
    await loading;
    const [settled, total] = progress.mock.lastCall!;
    expect(settled).toBe(total);
    expect(ready).toHaveBeenCalledOnce();
  });

  it("keeps the boot gate closed if a walking frame is missing", async () => {
    const { fonts } = mockBrowser(true);
    fonts.resolve();
    const ready = vi.fn();
    const controller = new AbortController();
    const loading = prepareWebsite({ pathname: "/", signal: controller.signal,
      waitForPage: Promise.resolve(), onRoutesReady: () => {}, onProgress: () => {},
    }).then(ready);
    await expect(loading).rejects.toThrow("frame_0001.webp");
    controller.abort();
    expect(ready).not.toHaveBeenCalled();
  });

  it("loads only the entry route and visible images, leaving below-fold photos lazy", async () => {
    const visible = { loading: "lazy", decode: vi.fn(async () => {}), getBoundingClientRect: () => ({ top: 150, bottom: 600 }) };
    const below = { loading: "lazy", decode: vi.fn(async () => {}), getBoundingClientRect: () => ({ top: 1500, bottom: 2000 }) };
    const { fonts, requests } = mockBrowser(false, [visible, below]);
    fonts.resolve();
    const { pageLoaderFor } = await import("../page-loaders");
    vi.mocked(pageLoaderFor).mockClear();
    await prepareWebsite({ pathname: "/admin/products", signal: new AbortController().signal,
      waitForPage: Promise.resolve(), onRoutesReady: () => {}, onProgress: () => {},
    });
    expect(pageLoaderFor).toHaveBeenCalledExactlyOnceWith("/admin/products");
    expect(requests.filter(src => src.includes("/animations/"))).toHaveLength(0);
    expect(visible.decode).toHaveBeenCalledOnce();
    expect(visible.loading).toBe("eager");
    expect(below.decode).not.toHaveBeenCalled();
    expect(below.loading).toBe("lazy");
  });

  it("uses the local fallback for a failed critical editorial image", async () => {
    const image = { loading: "eager", src: "/missing.webp", currentSrc: "", removeAttribute: vi.fn(),
      getBoundingClientRect: () => ({ top: 150, bottom: 600 }), decode: vi.fn().mockRejectedValueOnce(new Error("missing")).mockResolvedValue(undefined) };
    const { fonts } = mockBrowser(false, [image]);
    fonts.resolve();
    await prepareWebsite({ pathname: "/women", signal: new AbortController().signal,
      waitForPage: Promise.resolve(), onRoutesReady: () => {}, onProgress: () => {},
    });
    expect(image.src).toBe("/reference.svg");
    expect(image.decode).toHaveBeenCalledTimes(2);
  });

  it("waits for the final asset and limits simultaneous requests", async () => {
    const assets = Array.from({ length: 4 }, deferred);
    const started: number[] = [];
    const settled = vi.fn();
    const ready = vi.fn();
    const loading = runLoadQueue(assets.map((asset, i) => () => {
      started.push(i);
      return asset.promise;
    }), new AbortController().signal, settled, 2).then(ready);
    expect(started).toEqual([0, 1]);
    assets[1].resolve();
    await vi.waitFor(() => expect(started).toEqual([0, 1, 2]));
    expect(ready).not.toHaveBeenCalled();
    assets[0].resolve();
    assets[2].resolve();
    await vi.waitFor(() => expect(started).toEqual([0, 1, 2, 3]));
    expect(settled).toHaveBeenCalledTimes(3);
    expect(ready).not.toHaveBeenCalled();
    assets[3].resolve();
    await loading;
    expect(settled).toHaveBeenCalledTimes(4);
    expect(ready).toHaveBeenCalledOnce();
  });

  it("does not reveal the site or launch more assets after a required asset fails", async () => {
    const next = vi.fn(async () => {});
    const progress = vi.fn();
    const loading = runLoadQueue([
      async () => { throw new Error("Missing walking frame"); }, next,
    ], new AbortController().signal, progress, 1);
    await expect(loading).rejects.toThrow("Missing walking frame");
    expect(next).not.toHaveBeenCalled();
    expect(progress).not.toHaveBeenCalled();
  });

  it("cancels pending work without reporting stale progress", async () => {
    const asset = deferred();
    const controller = new AbortController();
    const next = vi.fn(async () => {});
    const progress = vi.fn();
    const loading = runLoadQueue([() => asset.promise, next], controller.signal, progress, 1);
    controller.abort();
    asset.resolve();
    await expect(loading).rejects.toMatchObject({ name: "AbortError" });
    expect(next).not.toHaveBeenCalled();
    expect(progress).not.toHaveBeenCalled();
  });

  it("deduplicates responsive photos shared by multiple products", () => {
    expect(uniqueImageSources([
      "https://images.unsplash.com/photo-demo?w=1000&q=85",
      "https://images.unsplash.com/photo-demo?w=1400&q=85",
      "/reference.svg", "/reference.svg",
    ])).toHaveLength(4);
  });

  it("retains every pose used by the desktop or mobile canvas", () => {
    expect(walkingFrames(false)).toHaveLength(335);
    expect(walkingFrames(true)).toEqual(walkingFrames(false));
    expect(walkingFrames(true).at(-1)).toBe(335);
    expect(new Set(walkingFrames(true)).size).toBe(walkingFrames(true).length);
    expect(walkingFrames(true)).toEqual(expect.arrayContaining(CRITICAL_FRAMES));
    expect(frameUrl(1, true)).toBe("/animations/awm-outfit-sequence-clean/mobile/frame_0001.webp?v=2");
  });

  it("runs every transformation frame before the walking clip and prepares both boundary poses", () => {
    expect(WALK_SEGMENTS.map(({ name, start, end, count }) => ({ name, start, end, count }))).toEqual([
      { name: "transformation", start: 1, end: 175, count: 175 },
      { name: "walking", start: 176, end: 335, count: 160 },
    ]);
    expect(CRITICAL_FRAMES).toEqual(expect.arrayContaining([1, 175, 176, 335]));
    expect(walkingFrames(true)).toEqual(expect.arrayContaining([175, 176]));
  });
});
