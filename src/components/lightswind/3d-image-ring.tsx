"use client";

// Adapted from Lightswind's 3d-image-ring registry component.
// Keeps its perspective, motion value and drag momentum, with AWM product content.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ReactNode, PointerEvent } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Image } from "../../Image";
import { useReducedMotion } from "../../lib/use-reduced-motion";
import { ringIndex, rotationForIndex } from "../../lib/ring-math";

export type ImageRingHandle = { step: (direction: number) => void; select: (index: number) => void };
export interface ThreeDImageRingProps {
  images: string[];
  labels?: string[];
  links?: string[];
  width?: number;
  height?: number;
  perspective?: number;
  imageDistance?: number;
  containerClassName?: string;
  renderStaticItem?: (index: number) => ReactNode;
  renderItem?: (index: number) => ReactNode;
  onActiveChange?: (index: number) => void;
}

export const ThreeDImageRing = forwardRef<ImageRingHandle, ThreeDImageRingProps>(function ThreeDImageRing({
  images, labels = [], links = [], width = 310, height = 420, perspective = 2000, imageDistance,
  containerClassName, renderStaticItem, renderItem, onActiveChange,
}, ref) {
  const root = useRef<HTMLDivElement>(null);
  const rotation = useMotionValue(0);
  const motionRef = useRef<ReturnType<typeof animate> | null>(null);
  const gesture = useRef({ down: false, x: 0, y: 0, lastX: 0, lastTime: 0, moved: false, velocity: 0, axis: "" });
  const callbacks = useRef(onActiveChange);
  callbacks.current = onActiveChange;
  const [active, setActive] = useState(0);
  const [cardWidth, setCardWidth] = useState(width);
  const [stageWidth, setStageWidth] = useState(1440);
  const reduced = useReducedMotion();
  const count = images.length;
  const angle = count ? 360 / count : 0;
  const radius = imageDistance ?? (count > 2 ? Math.max(cardWidth / (2 * Math.tan(Math.PI / count)) + 40, stageWidth * .435) : cardWidth * .65);

  const select = (index: number) => {
    if (!count || reduced) return;
    motionRef.current?.stop();
    motionRef.current = animate(rotation, rotationForIndex(index, rotation.get(), count), { duration: .65, ease: [.22, 1, .36, 1] });
  };
  useImperativeHandle(ref, () => ({ select, step: direction => select(ringIndex(rotation.get(), count) + direction) }));

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const resize = new ResizeObserver(entries => {
      setCardWidth(Math.min(width, Math.max(240, entries[0].contentRect.width * .3)));
      setStageWidth(entries[0].contentRect.width);
    });
    resize.observe(node);
    return () => resize.disconnect();
  }, [width]);

  useEffect(() => {
    setActive(0);
    rotation.set(0);
    callbacks.current?.(0);
    const unsubscribe = rotation.on("change", value => {
      const index = ringIndex(value, count);
      setActive(index);
      callbacks.current?.(index);
      if (root.current) root.current.dataset.rotation = String(value);
    });
    return () => { unsubscribe(); motionRef.current?.stop(); };
  }, [count, rotation]);

  useEffect(() => {
    if (reduced) { motionRef.current?.stop(); gesture.current.down = false; }
  }, [reduced]);

  const down = (event: PointerEvent<HTMLDivElement>) => {
    gesture.current.moved = false;
    if (reduced || event.button !== 0 || !root.current?.contains(event.target as Node) || (event.target as Element).closest("button,input,select")) return;
    motionRef.current?.stop();
    const time = performance.now();
    gesture.current = { down: true, x: event.clientX, y: event.clientY, lastX: event.clientX, lastTime: time, moved: false, velocity: 0, axis: "" };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (!drag.down) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 6) drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (drag.axis === "y") { drag.down = false; return; }
    if (drag.axis !== "x") return;
    if (!root.current?.hasPointerCapture(event.pointerId)) root.current?.setPointerCapture(event.pointerId);
    drag.moved = true;
    const delta = event.clientX - drag.lastX;
    const now = performance.now();
    drag.velocity = delta / Math.max(8, now - drag.lastTime);
    rotation.set(rotation.get() + delta * .3);
    drag.lastX = event.clientX;
    drag.lastTime = now;
    event.preventDefault();
  };
  const end = (event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (root.current?.hasPointerCapture(event.pointerId)) root.current.releasePointerCapture(event.pointerId);
    if (!drag.down) return;
    drag.down = false;
    if (drag.moved) {
      const projected = rotation.get() + Math.max(-angle * 1.5, Math.min(angle * 1.5, drag.velocity * 70));
      select(ringIndex(projected, count));
    }
  };

  if (!count) return null;
  if (reduced) return <div ref={root} className="trending-static-grid">{images.map((src, index) => <div key={index}>{renderStaticItem ? renderStaticItem(index) : <Image src={src} alt={labels[index] || `Image ${index + 1}`} />}</div>)}</div>;
  return <div ref={root} className={cn("image-ring-stage", containerClassName)} role="region" aria-label="Trending product image ring" tabIndex={0}
    onPointerDown={down} onPointerMove={move} onPointerUp={end}
    onDragStart={event => event.preventDefault()}
    onClickCapture={event => { if (root.current?.contains(event.target as Node) && gesture.current.moved) { event.preventDefault(); event.stopPropagation(); gesture.current.moved = false; } }}
    onPointerCancel={event => { gesture.current.down = false; gesture.current.moved = true; if (root.current?.hasPointerCapture(event.pointerId)) root.current.releasePointerCapture(event.pointerId); select(ringIndex(rotation.get(), count)); }}
    onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        select(event.key === "Home" ? 0 : event.key === "End" ? count - 1 : ringIndex(rotation.get(), count) + (event.key === "ArrowLeft" ? -1 : 1));
      }
    }}>
    <div className="image-ring-perspective" style={{ perspective, width: cardWidth, height }}>
      <motion.div className="image-ring-track" style={{ rotateY: rotation }}>
        {images.map((src, index) => <div key={index} className={`image-ring-item ${active === index ? "is-active" : ""}`} data-index={index}
          style={{ transform: `rotateY(${index * angle}deg) translateZ(${-radius}px)` }} aria-hidden={active !== index}
          onClickCapture={event => {
            if (event.currentTarget.contains(event.target as Node) && active !== index) { event.preventDefault(); event.stopPropagation(); select(index); }
          }}>
          {renderItem ? <><div className="ring-product-content" inert={active !== index}>{renderItem(index)}</div>{active !== index && <span className="ring-select-overlay" />}</> : links[index] ? <Link className="ring-image-panel" to={links[index]} tabIndex={active === index ? 0 : -1}>
            <Image src={src} alt={labels[index] || `Image ${index + 1}`} sizes="(max-width: 800px) 240px, 360px" draggable={false} />
          </Link> : <Image src={src} alt={labels[index] || `Image ${index + 1}`} draggable={false} />}
        </div>)}
      </motion.div>
    </div>
  </div>;
});
export default ThreeDImageRing;
