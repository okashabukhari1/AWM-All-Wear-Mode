import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ArrowLink, ProductCard } from "../../components";
import { useStore } from "../../store";
import { ThreeDImageRing } from "../lightswind/3d-image-ring";
import type { ImageRingHandle } from "../lightswind/3d-image-ring";
import { useReducedMotion } from "../../lib/use-reduced-motion";

export default function TrendingRing() {
  const catalogue = useStore(state => state.products);
  const products = useMemo(() => {
    const pieces = catalogue.filter(product => product.active && product.trending);
    const count = Math.min(8, pieces.length);
    return Array.from({ length: count }, (_, i) => pieces[Math.floor(i * pieces.length / count)]);
  }, [catalogue]);
  const ring = useRef<ImageRingHandle>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  if (!products.length) return null;
  return <section className="trending section-padding" aria-labelledby="trending-heading">
    <div className="section-heading reveal">
      <div><p className="eyebrow">THE PIECES IN ROTATION</p><h2 id="trending-heading">Current <em>obsessions.</em></h2></div>
      <ArrowLink to="/trending">Shop the edit</ArrowLink>
    </div>
    <ThreeDImageRing ref={ring} images={products.map(product => product.images[0])} labels={products.map(product => product.name)} links={products.map(product => `/product/${product.slug}`)}
      onActiveChange={setActive} renderItem={index => <ProductCard product={products[index]} />} renderStaticItem={index => <ProductCard product={products[index]} />} />
    {!reduced && <div className="trending-ring-footer">
      <span className="ring-instruction">DRAG TO FIND YOUR MODE</span>
      <div className="ring-controls">
        <button aria-label="Previous trending product" onClick={() => ring.current?.step(-1)}><ChevronLeft size={18} /></button>
        <span aria-live="polite" aria-atomic="true"><span className="sr-only">Trending product </span>{String(Math.min(active, products.length - 1) + 1).padStart(2, "0")}<i>/</i>{String(products.length).padStart(2, "0")}</span>
        <button aria-label="Next trending product" onClick={() => ring.current?.step(1)}><ChevronRight size={18} /></button>
      </div>
      <span className="ring-edition">THE AWM EDIT / 2026</span>
    </div>}
  </section>;
}
