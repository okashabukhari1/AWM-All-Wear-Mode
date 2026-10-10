// Adapted from the Lightswind 3d-hover-gallery registry and supplied reference.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode, KeyboardEvent } from "react";
import { m as motion, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Image } from "../../Image";
import { useReducedMotion } from "../../lib/use-reduced-motion";

export interface GalleryItem {
  url: string;
  title: string;
  category: string;
  description: string;
  href?: string;
  color?: string;
  glow?: string;
}
export interface ThreeDHoverGalleryProps {
  images?: string[];
  items?: GalleryItem[];
  itemHeight?: string | number;
  gap?: number;
  perspective?: number;
  hoverScale?: number;
  transitionDuration?: number;
  enableKeyboardNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayDelay?: number;
  className?: string;
  style?: CSSProperties;
  onImageClick?: (index: number, item: GalleryItem) => void;
  onImageHover?: (index: number, item: GalleryItem) => void;
  renderActions?: (index: number, item: GalleryItem) => ReactNode;
  renderStaticItem?: (index: number) => ReactNode;
}

export default function ThreeDHoverGallery({
  images, items, itemHeight = 420, gap = 10, perspective = 1000,
  hoverScale = 1.04, transitionDuration = .65, enableKeyboardNavigation = true,
  autoPlay = false, autoPlayDelay = 4000, className, style,
  onImageClick, onImageHover, renderActions, renderStaticItem,
}: ThreeDHoverGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const hoverIntent = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveIntent = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const reduced = useReducedMotion();
  const id = useId();
  const galleryItems = useMemo<GalleryItem[]>(() => items ?? images?.map((url, index) => ({
    url, title: `Image ${index + 1}`, category: "", description: "",
  })) ?? [], [items, images]);
  const count = galleryItems.length;
  const selected = count ? (narrow ? activeIndex ?? 0 : activeIndex) : null;
  const ease = [.22, 1, .36, 1] as const;

  const cancelHover = () => { if (hoverIntent.current) clearTimeout(hoverIntent.current); hoverIntent.current = null; };
  const cancelLeave = () => { if (leaveIntent.current) clearTimeout(leaveIntent.current); leaveIntent.current = null; };
  useEffect(() => () => { cancelHover(); cancelLeave(); }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(entries => setNarrow(entries[0].contentRect.width < 760));
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);
  useEffect(() => {
    setActiveIndex(previous => previous !== null && previous >= count ? null : previous);
  }, [count]);
  useEffect(() => {
    if (!autoPlay || reduced || interacting || !count) return;
    const timer = setInterval(() => setActiveIndex(previous => previous === null ? 0 : (previous + 1) % count), autoPlayDelay);
    return () => clearInterval(timer);
  }, [autoPlay, autoPlayDelay, count, reduced, interacting]);

  const activate = (index: number) => { cancelHover(); cancelLeave(); setActiveIndex(index); };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!enableKeyboardNavigation) return;
    const next = event.key === "ArrowLeft" ? (index - 1 + count) % count
      : event.key === "ArrowRight" ? (index + 1) % count
      : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : null;
    if (next !== null) {
      event.preventDefault();
      activate(next);
      buttons.current[next]?.focus({ preventScroll: true });
      if (narrow) buttons.current[next]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    } else if (event.key === "Escape" && !narrow) {
      event.preventDefault();
      setActiveIndex(null);
    }
  };

  if (!count) return null;
  if (reduced) return <div ref={containerRef} className="trending-static-grid">{galleryItems.map((item, index) => <div key={item.href || index}>{renderStaticItem ? renderStaticItem(index) : <><Image src={item.url} alt={item.title} />{item.href ? <Link to={item.href}>{item.title}</Link> : <p>{item.title}</p>}</>}</div>)}</div>;

  return <LazyMotion features={domAnimation} strict><div className={cn("hover-gallery", className)} style={style}>
    <div ref={containerRef} className={`hover-gallery-viewport ${narrow ? "is-narrow" : ""}`} role="region" aria-label="Trending 3D hover gallery"
      style={{ "--gallery-duration": `${transitionDuration}s` } as CSSProperties}
      onMouseEnter={cancelLeave}
      onMouseLeave={() => { cancelHover(); cancelLeave(); leaveIntent.current = setTimeout(() => { if (!document.activeElement?.closest('[role="dialog"]') && !containerRef.current?.contains(document.activeElement)) { setInteracting(false); if (!narrow) setActiveIndex(null); } }, 140); }}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={event => { if (event.relatedTarget instanceof Element && event.relatedTarget.closest('[role="dialog"]')) return; if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setInteracting(false); if (!narrow) setActiveIndex(null); } }}>
      <div className="hover-gallery-track" style={{ perspective, gap }}>
        {galleryItems.map((item, index) => {
          const isActive = selected === index;
          return <motion.article key={item.href || index} className={`hover-gallery-card ${isActive ? "is-active" : ""} ${selected !== null ? "has-selection" : ""}`} data-index={index}
            animate={{ rotateY: narrow || selected === null ? 0 : index < selected ? 24 : index > selected ? -24 : 0 }}
            transition={{ rotateY: { duration: transitionDuration, ease } }}
            style={{ height: itemHeight, zIndex: isActive ? 20 : 10, flexGrow: isActive ? 3 : 1 }}
            onTransitionEnd={event => {
              if (narrow && isActive && event.target === event.currentTarget && event.propertyName === "flex-basis") buttons.current[index]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
            }}
            onPointerEnter={event => { cancelLeave(); if (event.pointerType === "mouse" && !narrow) { cancelHover(); setInteracting(true); hoverIntent.current = setTimeout(() => { activate(index); onImageHover?.(index, item); }, 80); } }}
            onPointerLeave={cancelHover}
            onFocusCapture={() => activate(index)}>
            <motion.div className="hover-gallery-photo" animate={{ scale: isActive ? hoverScale : 1 }} transition={{ duration: transitionDuration, ease }}>
              <Image src={item.url} alt={item.title} sizes="(max-width: 800px) 280px, 320px" loading="lazy" draggable={false} />
            </motion.div>
            <div className="hover-gallery-shade" aria-hidden="true" />
            <button ref={node => { buttons.current[index] = node; }} className="hover-gallery-select" aria-label={`Explore ${item.title}`} aria-expanded={isActive} aria-controls={isActive ? `${id}-${index}` : undefined}
              onClick={() => { activate(index); onImageClick?.(index, item); }} onKeyDown={event => keyDown(event, index)} />
            <motion.span className="hover-gallery-strip-title" aria-hidden="true" animate={{ opacity: isActive ? 0 : 1 }} transition={{ duration: .2 }}>{item.title}</motion.span>
            <AnimatePresence initial={false}>
              {isActive && <motion.div id={`${id}-${index}`} className="hover-gallery-details" key="details"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { duration: .35, delay: .12, ease } }} exit={{ opacity: 0, transition: { duration: .12 } }}>
                <p className="hover-gallery-category">{item.category}</p>
                <h3>{item.title}</h3>
                <p className="hover-gallery-description">{item.description}</p>
                {renderActions?.(index, item)}
                {item.href && <Link className="hover-gallery-explore" to={item.href}>View piece <ArrowRight size={15} /></Link>}
              </motion.div>}
            </AnimatePresence>
          </motion.article>;
        })}
      </div>
    </div>
  </div></LazyMotion>;
}
