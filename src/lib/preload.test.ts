import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareWebsite, runLoadQueue } from "./preload";
import { uniqueImageSources } from "./image-assets";
import { frameUrl, walkingFrames } from "./walk-assets";

vi.mock("../page-loaders", () => ({ pageLoaders: { demo: async () => ({}) } }));
afterEach(() => vi.unstubAllGlobals());

function mockBrowser(missingFrame = false) {
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
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => { queueMicrotask(callback); return 1; });
  vi.stubGlobal("document", { fonts: { ready: fonts.promise }, querySelectorAll: () => [] });
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
    const loading = prepareWebsite({ products: [], signal: new AbortController().signal,
      waitForPage: page.promise, onRoutesReady: routes, onProgress: progress,
    }).then(ready);
    await vi.waitFor(() => expect(requests.filter(src => src.includes("/animations/"))).toHaveLength(91));
    expect(routes).toHaveBeenCalledOnce();
    expect(ready).not.toHaveBeenCalled();
    page.resolve();
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
    const loading = prepareWebsite({ products: [], signal: controller.signal,
      waitForPage: Promise.resolve(), onRoutesReady: () => {}, onProgress: () => {},
    }).then(ready);
    await expect(loading).rejects.toThrow("frame_0001.webp");
    controller.abort();
    expect(ready).not.toHaveBeenCalled();
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

  it("prepares every pose used by the desktop or mobile canvas", () => {
    expect(walkingFrames(false)).toHaveLength(180);
    expect(walkingFrames(true)).toHaveLength(91);
    expect(walkingFrames(true).at(-1)).toBe(180);
    expect(new Set(walkingFrames(true)).size).toBe(91);
    expect(frameUrl(1, true)).toBe("/animations/awm-walk/mobile/frame_0001.webp");
  });
});
