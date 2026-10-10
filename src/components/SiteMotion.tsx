import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";

const selector = [
  "main h1", "main h2", "main h3", "main p", "main label", "main summary",
  "main a", "main button", "main img", "main .product-card",
  "main .collection-panel", "main .manifesto-bottom", "main .cart-item",
  "main .admin-panel", "main .stat-card", "main tr", "main .order-card",
  ".testimonials-heading > *", ".testimonial-controls", ".newsletter-band h2",
  ".newsletter-band .eyebrow", ".newsletter-signup", ".footer-invitation > *",
  ".awm-footer-links > div", ".awm-footer-mark", ".awm-footer-bottom",
  ".header .logo", ".header nav > a", ".header-actions > *",
  ".admin-sidebar > *", ".admin-sidebar nav > a", ".admin-header > *",
  "main .tracking > li", "main .confirmation-icon", "main .look-tabs > button",
].join(",");
const units = ".product-card,.collection-panel,.admin-panel,.stat-card,.cart-item,.order-card,tr,.newsletter-signup,.awm-footer-links > div";

/** One motion lifecycle covers lazy routes and newly added results or orders. */
export default function SiteMotion({ ready }: { ready: boolean }) {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (!ready) return;
    const shell = document.querySelector<HTMLElement>(".app-shell");
    if (!shell) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const seen = new WeakSet<Element>();
      const prepared = new Set<HTMLElement>();
      let frame = 0;
      const context = gsap.context(() => {}, shell);
      const show = (element: HTMLElement, delay = 0) => {
        prepared.delete(element);
        context.add(() => gsap.to(element, {
          opacity: 1, y: 0, duration: .65, delay, ease: "power3.out",
          overwrite: "auto", clearProps: "opacity,transform",
        }));
      };
      const observer = new IntersectionObserver(entries => {
        entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
          observer.unobserve(entry.target);
          show(entry.target as HTMLElement, Math.min(index * .035, .18));
        });
      }, { threshold: .06 });
      const scan = () => {
        frame = 0;
        shell.querySelectorAll<HTMLElement>(selector).forEach(element => {
          if (seen.has(element) || element.closest(".cinema-hero,.testimonial-stage,.hover-gallery,.trending-static-grid,.modal-backdrop,.manifesto-line,.campaign-photo")) return;
          if (element.parentElement?.closest(units)) return;
          seen.add(element);
          // Closed accordions and inactive controls stay naturally visible when opened.
          if (!element.getClientRects().length) return;
          const box = element.getBoundingClientRect();
          if (box.bottom < 0) return;
          prepared.add(element);
          context.add(() => gsap.set(element, { opacity: 0, y: element.matches("img,.awm-footer-mark") ? 24 : 16 }));
          observer.observe(element);
        });
      };
      scan();
      const mutations = new MutationObserver(() => {
        if (!frame) frame = requestAnimationFrame(scan);
      });
      mutations.observe(shell, { childList: true, subtree: true });
      // Keyboard focus must never wait for an entrance animation.
      const focus = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        prepared.forEach(element => {
          if (element === target || element.contains(target)) { observer.unobserve(element); show(element); }
        });
      };
      const over = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const control = (event.target as Element).closest("a,button");
        if (!control || control.contains(event.relatedTarget as Node | null)) return;
        const icon = control.querySelector("svg");
        if (icon && !control.closest(".cinema-hero,.testimonial-stage")) context.add(() => gsap.to(icon, { x: 2, scale: 1.07, duration: .22, overwrite: true }));
      };
      const out = (event: PointerEvent) => {
        const control = (event.target as Element).closest("a,button");
        if (!control || control.contains(event.relatedTarget as Node | null)) return;
        const icon = control.querySelector("svg");
        if (icon) context.add(() => gsap.to(icon, { x: 0, scale: 1, duration: .28, overwrite: true, clearProps: "transform" }));
      };
      const toggle = (event: Event) => {
        const detail = event.target as HTMLDetailsElement;
        if (!detail.open) return;
        context.add(() => gsap.fromTo(Array.from(detail.children).filter(child => child.tagName !== "SUMMARY"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .35, ease: "power2.out", clearProps: "opacity,transform" }));
      };
      shell.addEventListener("focusin", focus);
      shell.addEventListener("pointerover", over);
      shell.addEventListener("pointerout", out);
      shell.addEventListener("toggle", toggle, true);
      return () => {
        cancelAnimationFrame(frame); mutations.disconnect(); observer.disconnect();
        shell.removeEventListener("focusin", focus);
        shell.removeEventListener("pointerover", over);
        shell.removeEventListener("pointerout", out);
        shell.removeEventListener("toggle", toggle, true);
        context.revert(); prepared.clear();
      };
    });
    return () => media.revert();
  }, [ready, pathname, search]);
  return null;
}
