import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WalkingOutfitSequence } from "./WalkingOutfitSequence";
import { FRAME_COUNT, frameUrl } from "../../lib/walk-assets";
import { useWebsiteReady } from "../../lib/website-readiness";
import type { WalkingSequenceHandle } from "./WalkingOutfitSequence";
import "../../styles/cinematic-hero.css";

gsap.registerPlugin(ScrollTrigger);

export default function AWMCinematicHero() {
  const root = useRef<HTMLElement>(null);
  const sequence = useRef<WalkingSequenceHandle>(null);
  const ready = useWebsiteReady();
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    const element = root.current!;
    const header = document.querySelector<HTMLElement>(".header");
    const announcement = document.querySelector<HTMLElement>(".announcement");
    const headerHeight = () => header?.getBoundingClientRect().height || 72;
    const size = () => {
      element.style.setProperty("--cinema-header", `${headerHeight()}px`);
      element.style.setProperty("--cinema-announcement", `${announcement?.getBoundingClientRect().height || 0}px`);
    };
    size();
    const observer = new ResizeObserver(size);
    if (header) observer.observe(header);
    if (announcement) observer.observe(announcement);
    if (reduced) return () => observer.disconnect();
    const media = gsap.matchMedia();
    media.add({ mobile: "(max-width: 767px)", desktop: "(min-width: 768px)" }, context => {
      const mobile = !!context.conditions?.mobile;
      // Keep the model fixed in the reference composition; scroll changes only its pose.
      const sync = (progress: number) => {
        element.dataset.progress = progress.toFixed(3);
        sequence.current?.setProgress(progress);
      };
      gsap.to({}, {
        duration: 1,
        scrollTrigger: {
          id: "awm-cinematic-hero", trigger: element,
          start: () => `top top+=${headerHeight()}`,
          end: () => `+=${Math.round(window.innerHeight * (mobile ? 1.15 : 1.65))}`,
          pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: self => sync(self.progress), onRefresh: self => sync(self.progress),
        },
      });
      return () => { sequence.current?.setProgress(0); };
    }, root);
    return () => { observer.disconnect(); media.revert(); };
  }, [reduced]);

  useLayoutEffect(() => {
    if (!ready || reduced) return;
    const context = gsap.context(() => {
      const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
      entrance
        .from(".cinema-circle", { opacity: 0, scale: .92, duration: 1 }, 0)
        .from(".cinema-heading-word", { yPercent: 110, duration: .85, stagger: .08 }, .12)
        .from(".cinema-script", { opacity: 0, y: 12, rotation: -3, duration: .75 }, .4)
        .from(".cinema-left > .eyebrow, .cinema-button, .cinema-right > *, .cinema-bottom > *", { opacity: 0, y: 10, duration: .65, stagger: .04 }, .3);
    }, root);
    return () => context.revert();
  }, [ready, reduced]);

  return <section ref={root} className={`cinema-hero ${reduced ? "is-static" : ""}`} aria-label="AWM new season campaign">
    <div className="cinema-circle" aria-hidden="true" />
    <div className="cinema-accent" aria-hidden="true" />
    <div className="cinema-ground" aria-hidden="true" />
    <div className="cinema-outfit" role="img" aria-label="Transforming streetwear outfit followed by a walking ghost mannequin in changing shirt and trouser colors">
      <picture>
        <source media="(max-width: 767px)" srcSet={frameUrl(reduced ? FRAME_COUNT : 1, true)} />
        <img src={frameUrl(reduced ? FRAME_COUNT : 1)} alt="" fetchPriority="high" />
      </picture>
      {!reduced && <WalkingOutfitSequence ref={sequence} />}
    </div>
    <div className="cinema-editorial">
      <div className="cinema-left">
        <p className="eyebrow">NEW ARRIVALS</p>
        <h1>
          <span className="cinema-heading-line"><span className="cinema-heading-word">YOUR</span></span>
          <span className="cinema-heading-line"><span className="cinema-heading-word">MODE</span></span>
        </h1>
        <p className="cinema-script">your way.</p>
        <Link className="cinema-button" to="/new-arrivals">SHOP THE EDIT <ArrowUpRight size={18} /></Link>
      </div>
      <div className="cinema-right">
        <p className="eyebrow">ALL WEAR MODE<br />THE NEW EDIT</p>
        <p className="cinema-season">NEW<br />SEASON</p>
        <Link className="cinema-text-link" to="/collections/streetwear">COLLECTION <ArrowUpRight size={17} /></Link>
      </div>
    </div>
    <div className="cinema-bottom">
      <span>EVERY STYLE.<br />EVERY MOOD. EVERY MODE.</span>
      <a href="#perspective">DISCOVER <ArrowDown size={13} /></a>
      <span>THE AWM EDIT / 2026</span>
    </div>
  </section>;
}
