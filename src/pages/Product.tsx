import { Image } from "../Image";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, Plus, ArrowUpRight, Truck, RefreshCcw } from "lucide-react";
import { useStore } from "../store";
import { money, variantKey } from "../data";
import { Modal, ProductCard, Quantity, Empty } from "../components";
export default function ProductPage() {
  const { slug } = useParams();
  const state = useStore();
  const p = state.products.find((p) => p.slug === slug && p.active);
  const [size, setSize] = useState(""),
    [color, setColor] = useState(""),
    [qty, setQty] = useState(1),
    [guide, setGuide] = useState(false),
    [zoom, setZoom] = useState(false);
  if (!p)
    return (
      <main id="main">
        <Empty
          title="This piece has moved on."
          text="Find a new favourite in the latest collection."
          to="/new-arrivals"
          action="Explore pieces"
        />
      </main>
    );
  const selectedColor = p.colors.includes(color) ? color : p.colors[0];
  const index = p.colors.indexOf(selectedColor) % p.images.length;
  const stock = size ? p.stock[variantKey(selectedColor, size)] || 0 : 0;
  return (
    <main id="main" className="product-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link> /{" "}
        <Link to={`/${p.gender.toLowerCase()}`}>{p.gender}</Link> / {p.category}
      </div>
      <section className="product-detail">
        <div className="product-gallery">
          {[p.images[index], ...p.images.filter((_, i) => i !== index)].map(
            (img, i) => (
              <button
                key={`${img}-${i}`}
                onClick={() => setZoom(true)}
                aria-label={`Enlarge ${p.name} image ${i + 1}`}
              >
                <Image
                  src={img}
                  alt={`${p.name}, ${i === 0 ? selectedColor : "alternate"} editorial reference`}
                  loading={i ? "lazy" : "eager"}
                />
                <span>
                  VIEW CLOSER <Plus size={14} />
                </span>
              </button>
            ),
          )}
        </div>
        <div className="product-information">
          <p className="eyebrow">
            {p.isNew ? "JUST LANDED / " : ""}
            {p.gender.toUpperCase()} / {p.category.toUpperCase()}
          </p>
          <h1>{p.name}</h1>
          <p className="product-price">{money(p.price)}</p>
          <p className="product-description">{p.description}</p>
          <div className="variant-label">
            Colour <strong>{selectedColor}</strong>
          </div>
          <div className="color-options">
            {p.colors.map((c) => (
              <button
                key={c}
                className={selectedColor === c ? "selected" : ""}
                onClick={() => {
                  setColor(c);
                  setQty(1);
                }}
              >
                <i
                  style={{ background: c === "Black" ? "#252525" : "#c9bbaa" }}
                />
                {c}
              </button>
            ))}
          </div>
          <div className="variant-label">
            Choose your size{" "}
            <button className="text-link" onClick={() => setGuide(true)}>
              Size guide
              <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="size-options">
            {p.sizes.map((s) => (
              <button
                key={s}
                disabled={!p.stock[variantKey(selectedColor, s)]}
                className={size === s ? "selected" : ""}
                onClick={() => {
                  setSize(s);
                  setQty(1);
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <small className="stock-note">
            {size
              ? stock
                ? `${stock} available in ${selectedColor} / ${size}`
                : "This variant is out of stock"
              : "Select a size to check availability."}
          </small>
          <div className="product-buy">
            <Quantity
              value={qty}
              onChange={(q) => setQty(Math.max(1, Math.min(q, stock || 1)))}
            />
            <button
              className="button dark"
              disabled={!!size && !stock}
              onClick={() => {
                if (!size) state.notify("Choose your size first.");
                else
                  state.add({
                    productId: p.id,
                    size,
                    color: selectedColor,
                    quantity: qty,
                  });
              }}
            >
              Add to bag
              <Plus size={17} />
            </button>
          </div>
          <button className="save-product" onClick={() => state.wish(p.id)}>
            <Heart
              size={16}
              fill={state.wishlist.includes(p.id) ? "currentColor" : "none"}
            />
            {state.wishlist.includes(p.id)
              ? "Saved to your wishlist"
              : "Save for later"}
          </button>
          <div className="product-promises">
            <span>
              <Truck size={17} /> Free delivery over PKR 8,000
            </span>
            <span>
              <RefreshCcw size={17} /> 14-day demo returns policy
            </span>
          </div>
          <details open>
            <summary>Details & care</summary>
            <p>
              Relaxed fit. Soft-touch fabric. Machine wash cold with similar
              colours, dry in shade, and iron on low. Composition is
              illustrative and should be confirmed before production.
            </p>
          </details>
          <details>
            <summary>Delivery & returns</summary>
            <p>
              Demo standard delivery: 3–5 working days. PKR 250, complimentary
              over PKR 8,000. Express demo delivery: PKR 450.{" "}
              <Link to="/shipping-returns">Read the proposed policy.</Link>
            </p>
          </details>
          <details>
            <summary>About these images</summary>
            <p>
              Licensed stock photography illustrates the style and category.
              Exact garment photography and colour-specific assets must be
              supplied before a real launch.
            </p>
          </details>
        </div>
      </section>
      <section className="section-padding">
        <div className="section-heading">
          <h2>
            In good <em>company.</em>
          </h2>
          <Link to={`/${p.gender.toLowerCase()}`} className="text-link">
            Explore more <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="product-grid">
          {state.products
            .filter((x) => x.active && x.gender === p.gender && x.id !== p.id)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      {guide && (
        <Modal title="Find your fit" onClose={() => setGuide(false)}>
          <h2>A little room to be you.</h2>
          <p>
            Indicative body measurements in inches. Fits vary by garment; this
            is a demo guide.
          </p>
          <table>
            <thead>
              <tr>
                <th>Size</th>
                <th>Chest</th>
                <th>Waist</th>
                <th>Hip</th>
              </tr>
            </thead>
            <tbody>
              {p.sizes.map((s, i) => (
                <tr key={s}>
                  <td>{s}</td>
                  <td>
                    {32 + i * 2}–{34 + i * 2}
                  </td>
                  <td>
                    {26 + i * 2}–{28 + i * 2}
                  </td>
                  <td>
                    {34 + i * 2}–{36 + i * 2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Between sizes? Choose the larger for a relaxed silhouette.</p>
        </Modal>
      )}
      {zoom && (
        <Modal title={p.name} onClose={() => setZoom(false)}>
          <Image className="zoom-image" src={p.images[index]} alt={p.name} />
        </Modal>
      )}
    </main>
  );
}
