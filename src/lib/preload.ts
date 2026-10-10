import { imagery } from "../data";
import type { Product } from "../data";
import { pageLoaders } from "../page-loaders";
import { uniqueImageSources } from "./image-assets";
import { frameUrl, walkingFrames } from "./walk-assets";

export type LoadTask = () => Promise<unknown>;

/** Completion means every task succeeded. Abort/failure never reports readiness. */
export async function runLoadQueue(tasks: LoadTask[], signal: AbortSignal, onSettled: () => void, concurrency = 6) {
  let next = 0;
  let failed = false;
  const worker = async () => {
    while (!failed && next < tasks.length) {
      signal.throwIfAborted();
      const task = tasks[next++];
      try {
        await task();
        signal.throwIfAborted();
        if (!failed) onSettled();
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  signal.throwIfAborted();
}

function loadImage(src: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const image = new Image();
    let done = false;
    const finish = (error?: unknown) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      image.onload = image.onerror = null;
      if (error) { image.removeAttribute("src"); reject(error); }
      else resolve();
    };
    const abort = () => finish(signal.reason);
    // A stalled asset offers Retry; a timeout never reveals an unfinished site.
    const timer = setTimeout(() => finish(new Error(`Asset timed out: ${src}`)), 30000);
    signal.addEventListener("abort", abort, { once: true });
    image.onload = async () => {
      try { await image.decode(); finish(); }
      catch (error) { finish(error); }
    };
    image.onerror = () => finish(new Error(`Asset unavailable: ${src}`));
    image.decoding = "async";
    image.src = src;
  });
}

const nextPaint = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

export async function prepareWebsite(options: {
  products: Product[];
  signal: AbortSignal;
  waitForPage: Promise<void>;
  onRoutesReady: () => void;
  onProgress: (settled: number, total: number) => void;
}) {
  const { signal, waitForPage, onRoutesReady, onProgress } = options;
  const mobile = matchMedia("(max-width: 767px)").matches;
  const sources = uniqueImageSources([
    ...Object.values(imagery),
    ...options.products.flatMap(product => product.images),
  ]);
  const frames = walkingFrames(mobile).map(index => frameUrl(index, mobile));
  const routes = Object.values(pageLoaders);
  const total = routes.length + sources.length + frames.length + 3;
  let settled = 0;
  const advance = () => { signal.throwIfAborted(); onProgress(++settled, total); };
  onProgress(0, total);
  const fallback = loadImage("/reference.svg", signal);
  // Attach a handler immediately even when other tasks fail first.
  fallback.catch(() => {});
  const photoTasks = sources.map(src => async () => {
    try { await loadImage(src, signal); }
    catch {
      signal.throwIfAborted();
      await fallback;
    }
  });
  const routesReady = Promise.all(routes.map(async load => { await load(); advance(); }))
    .then(() => { signal.throwIfAborted(); onRoutesReady(); });
  const pageImages = async () => {
    await waitForPage;
    signal.throwIfAborted();
    // Include below-fold lazy images and the current route's exact responsive sizes.
    const images = [...document.querySelectorAll<HTMLImageElement>(".app-shell img")];
    images.forEach(image => { image.loading = "eager"; });
    await nextPaint();
    await runLoadQueue(images.map(image => async () => {
      const src = image.currentSrc || image.src;
      try { await loadImage(src, signal); }
      catch (error) {
        signal.throwIfAborted();
        if (src.includes("/animations/awm-walk/")) throw error;
        await fallback;
        image.removeAttribute("srcset");
        image.src = "/reference.svg";
      }
      await image.decode();
    }), signal, () => {});
  };
  await Promise.all([
    routesReady,
    runLoadQueue([...photoTasks, ...frames.map(src => () => loadImage(src, signal)),
      () => fallback,
      async () => { await waitForPage; await nextPaint(); await document.fonts.ready; signal.throwIfAborted(); },
      pageImages,
    ], signal, advance),
  ]);
  await nextPaint();
  signal.throwIfAborted();
}
