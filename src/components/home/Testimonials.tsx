import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, Pause, Play, Quote } from "lucide-react";
import { useMediaQuery } from "../../hooks";

const stories = [
  { name: "Sara K.", mode: "THE EVERYDAY MODE", initials: "SK", quote: "The kind of pieces that make getting dressed feel easy. Relaxed, considered, and completely me.", color: "#f3e1d4" },
  { name: "Hamza A.", mode: "THE OFF-DUTY MODE", initials: "HA", quote: "A good silhouette changes the whole outfit. The oversized essentials are always the first thing I reach for.", color: "#e9e8de" },
  { name: "Mika R.", mode: "THE CITY MODE", initials: "MR", quote: "One wardrobe, so many ways to wear it. I love pieces that go from a slow morning to a late night.", color: "#e6eaf0" },
  { name: "Nadia S.", mode: "THE PERSONAL MODE", initials: "NS", quote: "Simple enough to wear every day. Interesting enough to feel like my own style. That’s the balance.", color: "#e9ded8" },
  { name: "Ali M.", mode: "THE WEEKEND MODE", initials: "AM", quote: "Nothing complicated. Just comfortable layers, a great fit, and room to make the look my own.", color: "#dedfd3" },
  { name: "Zoya F.", mode: "THE NEW PERSPECTIVE", initials: "ZF", quote: "I want my clothes to work with every version of me. This is the wardrobe I’d build that around.", color: "#efe2cf" },
];
const COUNT = stories.length, ANGLE = 360 / COUNT;
const wrap = (value: number) => ((value % COUNT) + COUNT) % COUNT;

/** The supplied round-carousel geometry, adapted for readable, accessible stories. */
export default function Testimonials() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const stage = useRef<HTMLDivElement>(null), ring = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(290), [active, setActive] = useState(0), [paused, setPaused] = useState(false);
  const rotation = useRef({ value: 0 });
  const current = useRef(0), visible = useRef(false), hovered = useRef(false), manual = useRef(false);
  const dragging = useRef({ active: false, x: 0, y: 0, time: 0, velocity: 0, moved: false });
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const radius = width * 1.3 / (2 * Math.tan(Math.PI / COUNT));
  const apply = () => {
    if (ring.current) ring.current.style.transform = `translateZ(${-radius}px) rotateY(${rotation.current.value}deg)`;
    const index = wrap(Math.round(-rotation.current.value / ANGLE));
    if (current.current !== index) { current.current = index; setActive(index); }
  };

  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.min(290, Math.max(220, entries[0].contentRect.width * .72))));
    observer.observe(stage.current!);
    const intersection = new IntersectionObserver(entries => { visible.current = entries[0].isIntersecting; }, { threshold: .15 });
    intersection.observe(stage.current!);
    return () => { observer.disconnect(); intersection.disconnect(); };
  }, []);

  useEffect(() => {
    apply();
    if (reduced) return;
    const tick = (_time: number, delta: number) => {
      if (!visible.current || pausedRef.current || hovered.current || dragging.current.active || manual.current || document.hidden) return;
      rotation.current.value -= Math.min(delta, 50) / 1000 * 6;
      apply();
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); gsap.killTweensOf(rotation.current); manual.current = false; };
  }, [radius, reduced]);

  const move = (direction: number) => {
    setPaused(true); manual.current = true;
    const target = (Math.round(rotation.current.value / ANGLE) - direction) * ANGLE;
    gsap.to(rotation.current, { value: target, duration: reduced ? 0 : .65, ease: "power3.out", overwrite: true, onUpdate: apply, onComplete: () => { manual.current = false; apply(); } });
    if (reduced) { current.current = wrap(Math.round(-target/ANGLE)); setActive(current.current); }
  };
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || event.button !== 0) return;
    dragging.current = { active: true, x: event.clientX, y: event.clientY, time: event.timeStamp, velocity: 0, moved: false };
    gsap.killTweensOf(rotation.current);
    manual.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const d = dragging.current;
    if (!d.active) return;
    const dx = event.clientX-d.x;
    if (!d.moved && Math.abs(event.clientY-d.y) > Math.abs(dx) + 8) return;
    if (Math.abs(dx) > 2) { d.moved = true; setPaused(true); }
    d.velocity = dx * .25 / Math.max(1, event.timeStamp - d.time);
    rotation.current.value += dx * .25; d.x = event.clientX; d.time = event.timeStamp; apply();
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const d = dragging.current;
    if (!d.active) return;
    d.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (d.moved) {
      const velocity = event.timeStamp - d.time < 100 ? d.velocity : 0;
      const momentum = Math.max(-90, Math.min(90, velocity * 180));
      manual.current = true;
      gsap.to(rotation.current, { value: Math.round((rotation.current.value + momentum) / ANGLE)*ANGLE, duration: .65, ease: "power3.out", overwrite: true, onUpdate: apply, onComplete: () => { manual.current = false; } });
    }
  };
  const card = (index: number) => {
    const story = stories[index];
    return <div className="testimonial-face" style={{ background: story.color }}><span className="eyebrow">{story.mode}</span><Quote size={26} strokeWidth={1.2}/><blockquote>“{story.quote}”</blockquote><div className="testimonial-person"><span>{story.initials}</span><div><strong>{story.name}</strong><small>Sample AWM perspective</small></div></div></div>;
  };

  return <section className="testimonials" aria-label="Community perspectives">
    <div className="testimonials-heading"><p className="eyebrow">GOOD CLOTHES. BETTER COMPANY.</p><h2>A few good <em>perspectives.</em></h2><p>Different lives. A shared sense of style.</p><small>Sample testimonials created for this AWM concept.</small></div>
    <div ref={stage} className={`testimonial-stage ${reduced ? "is-reduced" : ""}`} role="region" aria-roledescription="carousel" aria-label="AWM sample testimonials" tabIndex={0} onPointerEnter={() => { hovered.current = true; }} onPointerLeave={() => { hovered.current = false; }} onFocus={() => { hovered.current = true; }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) hovered.current = false; }} onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }} onPointerDown={down} onPointerMove={drag} onPointerUp={up} onPointerCancel={up}>
      {reduced ? <article className="testimonial-static" aria-live="polite">{card(active)}</article> : <div className="testimonial-tilt"><div ref={ring} className="testimonial-ring" style={{ width, height: 330 }}>
        {stories.map((story,index) => <article className="testimonial-item" key={story.name} aria-hidden={active !== index} aria-label={`Story ${index+1} of ${COUNT}`} style={{transform: `rotateY(${index*ANGLE}deg) translateZ(${radius}px)`} as CSSProperties}>{card(index)}<div className="testimonial-back" style={{ background: story.color }} aria-hidden="true"><span>awm</span><small>EVERY STYLE.<br />EVERY MOOD.<br />EVERY MODE.</small></div></article>)}
      </div></div>}
    </div>
    <div className="testimonial-controls"><span>{reduced ? "EXPLORE THE PERSPECTIVES" : "DRAG TO DISCOVER"}</span><div><button aria-label="Previous testimonial" onClick={() => move(-1)}><ArrowLeft size={18}/></button><span aria-live={paused ? "polite" : "off"}>{String(active+1).padStart(2,"0")} / 06</span><button aria-label="Next testimonial" onClick={() => move(1)}><ArrowRight size={18}/></button>{!reduced && <button aria-label={paused ? "Play testimonial rotation" : "Pause testimonial rotation"} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={16}/> : <Pause size={16}/>}</button>}</div></div>
  </section>;
}
