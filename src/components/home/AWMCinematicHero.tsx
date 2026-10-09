import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WalkingOutfitSequence, frameUrl } from "./WalkingOutfitSequence";
import type { WalkingSequenceHandle } from "./WalkingOutfitSequence";
import "../../styles/cinematic-hero.css";

gsap.registerPlugin(ScrollTrigger);

export default function AWMCinematicHero() {
  const root = useRef<HTMLElement>(null);
  const sequence = useRef<WalkingSequenceHandle>(null);
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    if (reduced) return;
    const element = root.current!;
    const media = gsap.matchMedia();
    media.add(
      { mobile: "(max-width: 767px)", desktop: "(min-width: 768px)" },
      (context) => {
        const mobile = !!context.conditions?.mobile;
        const select = gsap.utils.selector(element);
        const editorial =
          element.querySelector<HTMLElement>(".cinema-editorial")!;
        const header = document.querySelector<HTMLElement>(".header");
        const headerHeight = () => header?.getBoundingClientRect().height || 72;
        const size = () =>
          element.style.setProperty("--cinema-header", `${headerHeight()}px`);
        size();
        const observer = new ResizeObserver(size);
        if (header) observer.observe(header);
        element.classList.add("is-animated");
        gsap.set(select(".cinema-opening"), { autoAlpha: 1 });
        gsap.set(
          select(
            ".cinema-circle, .cinema-editorial",
          ),
          { autoAlpha: 0 },
        );
        gsap.set(select(".cinema-circle"), {
          scale: .82,
          x: 0,
          y: 0,
          xPercent: -50,
          yPercent: -50,
        });
        // The canvas keeps one fixed composition; only the source pose changes.
        gsap.set(select(".cinema-outfit"), { x: 0, y: 0, scale: 1 });
        gsap.set(select(".cinema-heading-word"), { yPercent: 110 });
        gsap.set(select(".cinema-left > .eyebrow, .cinema-button, .cinema-right > *"), { autoAlpha: 0, y: 12 });
        const syncProgress = (progress: number) => {
          editorial.inert = progress < 0.18;
          editorial.setAttribute("aria-hidden", String(progress < 0.18));
          element.dataset.progress = progress.toFixed(3);
          sequence.current?.setProgress(progress);
        };
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: "awm-cinematic-hero",
            trigger: element,
            start: () => `top top+=${headerHeight()}`,
            end: () =>
              `+=${Math.round(window.innerHeight * (mobile ? 1.15 : 1.65))}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: self => syncProgress(self.progress),
            onRefresh: self => syncProgress(self.progress),
          },
        });
        editorial.inert = true;
        editorial.setAttribute("aria-hidden", "true");
        timeline
          .to({}, { duration: 1 }, 0)
          .fromTo(
            select(".cinema-opening"),
            { autoAlpha: 1, yPercent: 0 },
            { autoAlpha: 0, yPercent: -8, duration: .28, immediateRender: false },
            .04,
          )
          .fromTo(element, { backgroundColor: "#F7F3ED" }, { backgroundColor: "#F3E1D4", duration: .46, immediateRender: false }, .08)
          .fromTo(
            select(".cinema-circle"),
            { autoAlpha: 0, scale: .82 },
            { autoAlpha: 1, scale: 1, duration: .38, immediateRender: false },
            .08,
          )
          .fromTo(
            select(".cinema-editorial"),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: .1, immediateRender: false },
            .18,
          )
          .fromTo(
            select(".cinema-heading-word"),
            { yPercent: 110 },
            { yPercent: 0, duration: .24, stagger: .035, ease: "power3.out", immediateRender: false },
            .18,
          )
          .fromTo(
            select(".cinema-left > .eyebrow, .cinema-button, .cinema-right > *"),
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: .18, stagger: .018, ease: "power2.out", immediateRender: false },
            .28,
          );
        const initialProgress = timeline.scrollTrigger?.progress ?? 0;
        timeline.progress(initialProgress);
        syncProgress(initialProgress);
        const refresh = () => {
          if (element.isConnected) {
            ScrollTrigger.refresh();
            syncProgress(timeline.scrollTrigger?.progress ?? 0);
          }
        };
        document.fonts?.ready.then(refresh);
        return () => {
          observer.disconnect();
          element.classList.remove("is-animated");
          editorial.inert = false;
          editorial.removeAttribute("aria-hidden");
          sequence.current?.setProgress(0);
        };
      },
      root,
    );
    return () => media.revert();
  }, [reduced]);

  return (
    <section
      ref={root}
      className={`cinema-hero ${reduced ? "is-static" : ""}`}
      aria-label="AWM new season campaign"
    >
      <div className="cinema-opening" aria-hidden="true">
        <span className="cinema-wordmark">AWM</span>
      </div>
      <div className="cinema-circle" aria-hidden="true" />
      <div
        className="cinema-outfit"
        role="img"
        aria-label="Walking black oversized T-shirt, beige cargo trousers and white sneakers"
      >
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet={frameUrl(reduced ? 180 : 1, true)}
          />
          <img src={frameUrl(reduced ? 180 : 1)} alt="" fetchPriority="high" />
        </picture>
        {!reduced && <WalkingOutfitSequence ref={sequence} />}
      </div>
      <div className="cinema-editorial">
        <div className="cinema-left">
          <p className="eyebrow">THE NEW EDIT</p>
          <h1>
            <span className="cinema-heading-line"><span className="cinema-heading-word">YOUR</span></span>
            <span className="cinema-heading-line"><span className="cinema-heading-word">MODE<i>.</i></span></span>
          </h1>
          <Link className="cinema-button" to="/new-arrivals">
            SHOP THE EDIT <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="cinema-right">
          <span className="cinema-index" aria-hidden="true">01</span>
          <p className="eyebrow">NEW SEASON</p>
          <Link className="cinema-text-link" to="/collections/streetwear">
            COLLECTION <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <div className="cinema-bottom">
        <a href="#perspective">
          DISCOVER <ArrowDown size={13} />
        </a>
      </div>
    </section>
  );
}
