import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useLocation } from "react-router-dom";
import { prepareWebsite } from "../lib/preload";

export function BrandPreloader(props: {
  waitForPage: Promise<void>;
  onRoutesReady: () => void;
  onReveal: () => void;
  onReady: () => void;
}) {
  const { pathname } = useLocation();
  const root = useRef<HTMLDivElement>(null);
  const callbacks = useRef(props);
  callbacks.current = props;
  const [progress, setProgress] = useState({ settled: 0, total: 1 });
  const [prepared, setPrepared] = useState(false);
  const [failed, setFailed] = useState(false);
  const percent = Math.floor(progress.settled / progress.total * 100);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.fromTo(".loader-letter", { yPercent: 115 }, { yPercent: 0, stagger: .07, duration: .55, ease: "power3.out" });
        gsap.fromTo(".loader-stitch", { strokeDashoffset: 440 }, { strokeDashoffset: 0, duration: .75, ease: "power2.out" });
      }, root);
      return () => context.revert();
    });
    prepareWebsite({
      pathname,
      signal: controller.signal,
      waitForPage: callbacks.current.waitForPage,
      onRoutesReady: () => callbacks.current.onRoutesReady(),
      onProgress: (settled, total) => { if (alive) setProgress({ settled, total }); },
    }).then(() => { if (alive) setPrepared(true); }).catch(() => {
      if (!alive || controller.signal.aborted) return;
      setFailed(true);
      controller.abort();
      requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>("button")?.focus());
    });
    return () => {
      alive = false;
      controller.abort();
      document.body.style.overflow = previous;
      media.revert();
      if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    const line = root.current?.querySelector(".loader-progress-line");
    if (!line) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(line, { scaleX: percent / 100 });
      return;
    }
    const tween = gsap.to(line, { scaleX: percent / 100, duration: .2, ease: "power1.out" });
    return () => { tween.kill(); };
  }, [percent]);

  useEffect(() => {
    if (!prepared) return;
    performance.mark("awm:prepared");
    document.documentElement.dataset.awmPreparedMs = String(Math.round(performance.now()));
    callbacks.current.onReveal();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      callbacks.current.onReady();
      return;
    }
    const tween = gsap.to(root.current, { yPercent: -100, duration: .32, ease: "power3.inOut", onComplete: () => callbacks.current.onReady() });
    return () => { tween.kill(); };
  }, [prepared]);

  return <div ref={root} tabIndex={-1} className="brand-loader" role="dialog" aria-modal="true" aria-label="Preparing your AWM experience" onKeyDown={event => {
    if (event.key === "Tab") { event.preventDefault(); (root.current?.querySelector<HTMLButtonElement>("button") || root.current)?.focus(); }
  }}>
    <div className="loader-top"><span>AWM STUDIO / ALL WEAR MODE</span><span>PLEASE WAIT</span></div>
    <div className="loader-brand">
      <div className="loader-wordmark" aria-label="AWM">{"AWM".split("").map(letter => <span key={letter}><i className="loader-letter">{letter}</i></span>)}</div><p>ALL WEAR MODE</p><svg viewBox="0 0 440 28" aria-hidden="true"><path className="loader-stitch" d="M0 14 H170 C185 14 185 1 200 1 S215 27 230 27 S245 14 260 14 H440" /></svg>
      {failed && <div className="loader-error" role="alert"><p>We couldn’t finish loading your experience.</p><button onClick={() => window.location.reload()}>RETRY ↗</button></div>}
    </div>
    <div className="loader-bottom"><span>{failed ? "CHECK YOUR CONNECTION AND TRY AGAIN." : "PREPARING YOUR WARDROBE."}</span><div role="progressbar" aria-label="Website loaded" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><div className="loader-progress-track"><i className="loader-progress-line" /></div><span>{String(percent).padStart(2,"0")}%</span></div></div>
  </div>;
}
