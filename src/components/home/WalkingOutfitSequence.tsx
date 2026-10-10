import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { CRITICAL_FRAMES, frameUrl, walkingFrames, takePreparedWalkingFrame } from "../../lib/walk-assets";
import { useWebsiteReady } from "../../lib/website-readiness";
export type WalkingSequenceHandle = { setProgress: (progress: number) => void };

/** One persistent canvas. Progress comes exclusively from the parent's scroll timeline. */
export const WalkingOutfitSequence = forwardRef<WalkingSequenceHandle>(
  function WalkingOutfitSequence(_, ref) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const ready = useWebsiteReady();
    const request = useRef<(progress: number) => void>(() => {});
    const progress = useRef(0);
    const [mobile, setMobile] = useState(
      () =>
        typeof window !== "undefined" &&
        matchMedia("(max-width: 767px)").matches,
    );
    useImperativeHandle(
      ref,
      () => ({
        setProgress(value) {
          progress.current = value;
          request.current(value);
        },
      }),
      [],
    );

    useEffect(() => {
      const query = matchMedia("(max-width: 767px)");
      const change = () => setMobile(query.matches);
      query.addEventListener("change", change);
      return () => query.removeEventListener("change", change);
    }, []);

    useEffect(() => {
      if (!ready) return;
      const node = canvas.current!;
      const container = node.parentElement!;
      const context = node.getContext("2d", { alpha: true });
      if (!context) return;
      const images = new Map<number, HTMLImageElement>();
      const pending = new Set<number>();
      const frames = walkingFrames(mobile);
      const desiredFrame = (value: number) =>
        frames[
          Math.min(
            frames.length - 1,
            Math.max(0, Math.round(value * (frames.length - 1))),
          )
        ];
      const queue = [
        desiredFrame(progress.current),
        ...CRITICAL_FRAMES,
        ...frames,
      ];
      let alive = true,
        active = 0,
        raf = 0,
        last = -1,
        requested = -1;
      let width = 0,
        height = 0;

      function draw() {
        raf = 0;
        if (!alive || !width || !height || !images.size) return;
        const desired = desiredFrame(progress.current);
        const available = images.has(desired)
          ? desired
          : [...images.keys()].reduce((a, b) =>
              Math.abs(b - desired) < Math.abs(a - desired) ? b : a,
            );
        if (last === available) return;
        const image = images.get(available)!;
        const scale = Math.min(
          width / image.naturalWidth,
          height / image.naturalHeight,
        );
        const w = image.naturalWidth * scale,
          h = image.naturalHeight * scale;
        context!.clearRect(0, 0, width, height);
        context!.imageSmoothingEnabled = true;
        context!.imageSmoothingQuality = "high";
        context!.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
        node.style.opacity = "1";
        container.dataset.ready = "true";
        node.dataset.frame = String(available);
        last = available;
      }
      function schedule() {
        if (!raf && alive) raf = requestAnimationFrame(draw);
      }
      function retain(index: number, image: HTMLImageElement) {
        images.set(index, image);
        // Bound decoded memory; compressed requests remain in the browser cache.
        const desired = desiredFrame(progress.current);
        while (images.size > 48) {
          const farthest = [...images.keys()].reduce((a, b) => Math.abs(b - desired) > Math.abs(a - desired) ? b : a);
          images.delete(farthest);
        }
        schedule();
      }
      function pump() {
        while (alive && active < 4 && queue.length) {
          const index = queue.shift()!;
          if (images.has(index) || pending.has(index)) continue;
          const prepared = takePreparedWalkingFrame(index, mobile);
          if (prepared) { retain(index, prepared); continue; }
          active++;
          pending.add(index);
          const image = new window.Image();
          image.decoding = "async";
          image.onload = async () => {
            try {
              await image.decode();
            } catch {
              /* The loaded image remains drawable. */
            }
            active--;
            pending.delete(index);
            inflight.delete(image);
            if (!alive) {
              image.src = "";
              return;
            }
            retain(index, image);
            pump();
          };
          image.onerror = () => {
            active--;
            pending.delete(index);
            inflight.delete(image);
            if (alive) pump();
          };
          // Track in-flight requests too, so they are cancelled on unmount.
          inflight.add(image);
          image.src = frameUrl(index, mobile);
        }
      }
      const inflight = new Set<HTMLImageElement>();
      request.current = (value) => {
        progress.current = Math.min(1, Math.max(0, value));
        const index = desiredFrame(progress.current);
        if (requested !== index && !images.has(index) && !pending.has(index)) {
          const position = queue.indexOf(index);
          if (position >= 0) queue.splice(position, 1);
          queue.unshift(index);
        }
        requested = index;
        schedule();
        pump();
      };
      const observer = new ResizeObserver(() => {
        const bounds = node.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.round(bounds.width * dpr);
        height = Math.round(bounds.height * dpr);
        if (node.width !== width || node.height !== height) {
          node.width = width;
          node.height = height;
          last = -1;
          schedule();
        }
      });
      observer.observe(node);
      pump();
      return () => {
        alive = false;
        request.current = () => {};
        observer.disconnect();
        cancelAnimationFrame(raf);
        inflight.forEach((image) => {
          image.onload = null;
          image.onerror = null;
          image.src = "";
        });
        images.clear();
        inflight.clear();
        queue.length = 0;
        context.clearRect(0, 0, node.width, node.height);
        node.width = 0;
        node.height = 0;
        delete container.dataset.ready;
      };
    }, [mobile, ready]);

    return <canvas ref={canvas} className="walk-canvas" aria-hidden="true" />;
  },
);
