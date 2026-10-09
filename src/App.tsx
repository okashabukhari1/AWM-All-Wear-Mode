import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { Header, Footer, CartDrawer } from "./components";
import { useStore } from "./store";
import Home from "./pages/Home";
import { BrandPreloader } from "./components/BrandPreloader";
import SiteMotion from "./components/SiteMotion";
const Catalog = lazy(() => import("./pages/Catalog"));
const ProductPage = lazy(() => import("./pages/Product"));
const Shopping = lazy(() => import("./pages/Shopping"));
const Account = lazy(() => import("./pages/Account"));
const Information = lazy(() => import("./pages/Information"));
const Admin = lazy(() => import("./pages/Admin"));
gsap.registerPlugin(ScrollTrigger);
export default function App() {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const toast = useStore((s) => s.toast);
  const admin = location.pathname.startsWith("/admin");
  const [loading, setLoading] = useState(() => location.pathname === "/" && !sessionStorage.getItem("awm-critical-ready") && !matchMedia("(prefers-reduced-motion: reduce)").matches);
  const finishLoading = () => { sessionStorage.setItem("awm-critical-ready", "1"); setLoading(false); };
  useEffect(() => {
    if (loading) return;
    let alive = true;
    let frame = 0;
    document.fonts.ready.then(() => {
      if (!alive) return;
      frame = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        if (location.pathname === "/" && window.location.hash === "#perspective") {
          document.getElementById("perspective")?.scrollIntoView();
        }
      });
    });
    return () => { alive = false; cancelAnimationFrame(frame); };
  }, [loading]);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
    const lenis = new Lenis({ duration: 1.05, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
    });
    return () => media.revert();
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    useStore.getState().setCartOpen(false);
    const name =
      location.pathname
        .split("/")
        .filter(Boolean)
        .map((s) => s.replaceAll("-", " "))
        .join(" / ") || "Every style. Every mood.";
    document.title = `${name.charAt(0).toUpperCase() + name.slice(1)} — AWM`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        `Explore ${name} at AWM — All Wear Mode. A frontend fashion shopping demonstration.`,
      );
    if (
      location.pathname !== "/" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const ctx = gsap.context(
        () =>
          gsap.fromTo(
            ref.current,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.35, clearProps: "all" },
          ),
        ref,
      );
      return () => ctx.revert();
    }
  }, [location.pathname]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => useStore.getState().notify(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  return (
    <>
      <SiteMotion ready={!loading} />
      {loading && <BrandPreloader onReady={finishLoading} />}
      <div className="app-shell" inert={loading}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {!admin && <Header />}
      <div ref={ref}>
        <Suspense
          fallback={
            <main className="loading" id="main">
              Setting the mode…
            </main>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            {[
              "/men",
              "/women",
              "/new-arrivals",
              "/trending",
              "/collections/:slug",
              "/search",
            ].map((path) => (
              <Route key={path} path={path} element={<Catalog />} />
            ))}
            <Route path="/product/:slug" element={<ProductPage />} />
            {["/wishlist", "/cart", "/checkout", "/order-confirmation/:id"].map(
              (path) => (
                <Route key={path} path={path} element={<Shopping />} />
              ),
            )}
            {[
              "/login",
              "/register",
              "/account",
              "/account/orders",
              "/account/orders/:id",
            ].map((path) => (
              <Route key={path} path={path} element={<Account />} />
            ))}
            <Route path="/admin/*" element={<Admin />} />
            {[
              "/about",
              "/contact",
              "/faq",
              "/shipping-returns",
              "/privacy-policy",
              "/terms",
              "*",
            ].map((path) => (
              <Route key={path} path={path} element={<Information />} />
            ))}
          </Routes>
        </Suspense>
      </div>
      {!admin && <Footer />}
      <CartDrawer />
      {toast && (
        <div role="status" className="toast">
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => useStore.getState().notify("")}
          >
            ×
          </button>
        </div>
      )}
      </div>
    </>
  );
}
