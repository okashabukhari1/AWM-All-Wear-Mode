import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/** The counter measures settled critical asset requests, never elapsed time. */
export function BrandPreloader({ onReady }: { onReady: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onReady);
  close.current = onReady;
  const [settled, setSettled] = useState(0);
  const [failed, setFailed] = useState(false);
  const total = 3;
  const percent = Math.round(settled / total * 100);

  useEffect(() => {
    let alive = true;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const finish = (ok: boolean) => { if (alive) { setSettled(value => value + 1); if (!ok) setFailed(true); } };
    const mobile = matchMedia("(max-width: 767px)").matches;
    const images = [1, 180].map(index => {
      const image = new Image();
      image.onload = () => finish(true);
      image.onerror = () => finish(false);
      image.src = `/animations/awm-walk/${mobile ? "mobile/" : ""}frame_${String(index).padStart(4, "0")}.webp`;
      return image;
    });
    (document.fonts?.ready || Promise.resolve()).then(() => finish(true), () => finish(false));
    // This fallback bypasses a stalled request; it does not invent progress.
    const fallback = setTimeout(() => close.current(), 6000);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close.current(); };
    document.addEventListener("keydown", escape);
    const ctx = gsap.context(() => {
      gsap.fromTo(".loader-letter", { yPercent: 115 }, { yPercent: 0, stagger: .07, duration: .55, ease: "power3.out" });
      gsap.fromTo(".loader-stitch", { strokeDashoffset: 440 }, { strokeDashoffset: 0, duration: .75, ease: "power2.out" });
    }, root);
    return () => {
      alive = false; clearTimeout(fallback); document.removeEventListener("keydown", escape);
      images.forEach(image => { image.onload = null; image.onerror = null; });
      document.body.style.overflow = previous; ctx.revert();
    };
  }, []);

  useEffect(() => {
    const line = root.current?.querySelector(".loader-progress-line");
    if (!line) return;
    const tween = gsap.to(line, { scaleX: percent / 100, duration: .2, ease: "power1.out" });
    return () => { tween.kill(); };
  }, [percent]);

  useEffect(() => {
    if (settled < total) return;
    const tween = gsap.to(root.current, { yPercent: -100, duration: .5, ease: "power3.inOut", onComplete: () => close.current() });
    return () => { tween.kill(); };
  }, [settled]);

  return <div ref={root} className="brand-loader" role="dialog" aria-modal="true" aria-label="Preparing your AWM experience" onKeyDown={event => { if (event.key === "Tab") { event.preventDefault(); root.current?.querySelector<HTMLButtonElement>("button")?.focus(); } }}>
    <div className="loader-top"><span>AWM STUDIO / ALL WEAR MODE</span><button onClick={onReady}>SKIP INTRO ↗</button></div>
    <div className="loader-brand" onPointerMove={event => { if (event.pointerType !== "mouse") return; const box = event.currentTarget.getBoundingClientRect(); gsap.to(event.currentTarget, { x: (event.clientX-box.left-box.width/2)*.035, y: (event.clientY-box.top-box.height/2)*.05, duration: .3, overwrite: true }); }} onPointerLeave={event => gsap.to(event.currentTarget, { x:0, y:0, duration:.4 })}>
      <div className="loader-wordmark" aria-label="AWM">{"AWM".split("").map(letter => <span key={letter}><i className="loader-letter">{letter}</i></span>)}</div><p>ALL WEAR MODE</p><svg viewBox="0 0 440 28" aria-hidden="true"><path className="loader-stitch" d="M0 14 H170 C185 14 185 1 200 1 S215 27 230 27 S245 14 260 14 H440" /></svg>
    </div>
    <div className="loader-bottom"><span>{failed ? "YOUR MODE IS READY. SOME ASSETS WILL USE A FALLBACK." : "FIND YOUR MODE."}</span><div role="progressbar" aria-label="Critical assets prepared" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div className="loader-progress-track"><i className="loader-progress-line" /></div><span>{String(percent).padStart(2,"0")}%</span></div></div>
  </div>;
}
