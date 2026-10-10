import { pageLoaderFor } from "../page-loaders";
import { CRITICAL_FRAMES, frameUrl, rememberWalkingFrame } from "./walk-assets";

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

function loadImage(src: string, signal: AbortSignal): Promise<HTMLImageElement> {
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
      else resolve(image);
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
  pathname: string;
  signal: AbortSignal;
  waitForPage: Promise<void>;
  onRoutesReady: () => void;
  onProgress: (settled: number, total: number) => void;
}) {
  const { signal, waitForPage, onRoutesReady, onProgress } = options;
  onProgress(0, 1);
  // Only load the module for this entry route; other routes remain code-split.
  await pageLoaderFor(options.pathname)();
  signal.throwIfAborted();
  onRoutesReady();
  await waitForPage;
  await nextPaint();
  signal.throwIfAborted();
  const mobile = matchMedia("(max-width: 767px)").matches;
  const animatedHome = options.pathname === "/" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frames = animatedHome ? CRITICAL_FRAMES : [];
  // Never turn all below-fold lazy photos into eager downloads.
  const images = [...document.querySelectorAll<HTMLImageElement>(".app-shell img")].filter(image => {
    const box = image.getBoundingClientRect();
    return image.loading !== "lazy" || (box.top < window.innerHeight && box.bottom > 0);
  });
  images.forEach(image => { image.loading = "eager"; });
  await nextPaint();
  const total = frames.length + images.length + 4;
  let settled = 2; // The entry module and mounted page are already prepared.
  const advance = () => { signal.throwIfAborted(); onProgress(++settled, total); };
  onProgress(settled, total);
  const fallback = loadImage("/reference.svg", signal);
  // Attach a handler immediately even when other tasks fail first.
  fallback.catch(() => {});
  const pageImages = images.map(image => async () => {
    try { await image.decode(); }
    catch (error) {
      signal.throwIfAborted();
      if ((image.currentSrc || image.src).includes("/animations/awm-walk/")) throw error;
      await fallback;
      image.removeAttribute("srcset");
      image.src = "/reference.svg";
      await image.decode();
    }
  });
  await runLoadQueue([
    ...frames.map(index => async () => {
      const image = await loadImage(frameUrl(index, mobile), signal);
      rememberWalkingFrame(index, mobile, image);
    }),
    ...pageImages,
    () => fallback,
    async () => { await document.fonts.ready; signal.throwIfAborted(); },
  ], signal, advance);
  await nextPaint();
  signal.throwIfAborted();
}
