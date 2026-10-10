import { useMemo, useState } from "react";
import { Heart, ArrowUpRight } from "lucide-react";
import { ArrowLink, ProductCard, Modal, QuickProduct } from "../../components";
import { money } from "../../data";
import type { Product } from "../../data";
import { useStore } from "../../store";
import ThreeDHoverGallery from "../lightswind/3d-hover-gallery";
import { useReducedMotion } from "../../lib/use-reduced-motion";

export default function TrendingGallery() {
  const catalogue = useStore(state => state.products);
  const wishlist = useStore(state => state.wishlist);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [quick, setQuick] = useState<{ product: Product; color: string } | null>(null);
  const reduced = useReducedMotion();
  const products = useMemo(() => {
    const pieces = catalogue.filter(product => product.active && product.trending);
    const count = Math.min(8, pieces.length);
    return Array.from({ length: count }, (_, i) => pieces[Math.floor(i * pieces.length / count)]);
  }, [catalogue]);
  const items = useMemo(() => products.map(product => {
    const color = product.colors.includes(colors[product.id]) ? colors[product.id] : product.colors[0];
    return { url: product.images[product.colors.indexOf(color)] || product.images[0], title: product.name,
      category: `${product.category} / ${product.gender}`, description: money(product.price), href: `/product/${product.slug}`, color };
  }), [products, colors]);
  if (!products.length) return null;
  return <section className="trending section-padding" aria-labelledby="trending-heading">
    <div className="section-heading reveal">
      <div><p className="eyebrow">THE AWM EDIT</p><h2 id="trending-heading">Current <em>obsessions.</em></h2></div>
      <ArrowLink to="/trending">Shop the edit</ArrowLink>
    </div>
    <ThreeDHoverGallery items={items} renderStaticItem={index => <ProductCard product={products[index]} />}
      renderActions={(index, item) => {
        const product = products[index];
        return <div className="hover-product-actions">
          <div className="hover-product-colors" role="group" aria-label={`Choose colour for ${product.name}`}>
            {product.colors.map(color => <button key={color} aria-label={`${color} colour for ${product.name}`} aria-pressed={item.color === color}
              onClick={() => setColors(previous => ({ ...previous, [product.id]: color }))}><span style={{ background: color === "Black" ? "#252525" : "#c9bbaa" }} /></button>)}
            <span>{item.color}</span>
          </div>
          <div className="hover-product-purchase"><button className={wishlist.includes(product.id) ? "is-saved" : ""} aria-label={`Save ${product.name}`} aria-pressed={wishlist.includes(product.id)} onClick={() => useStore.getState().wish(product.id)}><Heart size={17} /></button>
            <button onClick={() => setQuick({ product, color: item.color || product.colors[0] })}>Choose size <ArrowUpRight size={15} /></button></div>
        </div>;
      }} />
    {!reduced && <div className="trending-gallery-footer"><span className="gallery-desktop-hint">HOVER OR FOCUS TO EXPLORE</span><span className="gallery-mobile-hint">SWIPE & TAP TO EXPLORE</span><span>THE AWM EDIT / 2026</span></div>}
    {quick && <Modal title="A closer look" onClose={() => setQuick(null)}><QuickProduct product={quick.product} initialColor={quick.color} onAdd={() => setQuick(null)} /></Modal>}
  </section>;
}
