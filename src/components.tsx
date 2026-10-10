import { Image } from "./Image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Plus,
  Minus,
  User,
  Trash2,
} from "lucide-react";
import { useStore } from "./store";
import { money, itemKey } from "./data";
import type { Product } from "./data";
export function ArrowLink({
  to,
  children,
  light = false,
}: {
  to: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <Link to={to} className={`arrow-link ${light ? "light" : ""}`}>
      {children}
      <ArrowUpRight size={19} />
    </Link>
  );
}
export function Modal({
  children,
  title,
  onClose,
  drawer = false,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.fromTo(ref.current, { opacity: 0, x: drawer ? 40 : 0, y: drawer ? 0 : 18 }, { opacity: 1, x: 0, y: 0, duration: .4, ease: "power3.out", clearProps: "opacity,transform" });
        gsap.fromTo(ref.current!.querySelectorAll(".modal-heading, .drawer-nav > a, .quick-product > img, .quick-product h2, .quick-product p, .quick-product label, .quick-product .size-options, .quick-product .button, .search-result, .cart-item, .drawer-totals"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: .025, duration: .4, ease: "power2.out", clearProps: "opacity,transform" });
      }, ref);
      return () => context.revert();
    });
    return () => media.revert();
  }, [drawer]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button,a,input,select,textarea,[tabindex="0"]',
        );
        const els = nodes
          ? [...nodes].filter(
              (element) =>
                !element.hasAttribute("disabled") &&
                element.getClientRects().length > 0,
            )
          : [];
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-backdrop"
      data-lenis-prevent
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${drawer ? "drawer" : ""}`}
      >
        <div className="modal-heading">
          <span>{title}</span>
          <button aria-label="Close dialog" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
export function Header() {
  const [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState("");
  const state = useStore();
  const navigate = useNavigate();
  const closeMenu = () => setMenu(false),
    closeSearch = () => setSearch(false);
  const results = state.products
    .filter(
      (p) =>
        p.active &&
        `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 4);
  return (
    <>
      <div className="announcement">
        <span>EVERY STYLE. EVERY MOOD. EVERY MODE.</span>
        <span>
          Complimentary delivery on orders over PKR 8,000{" "}
          <ArrowUpRight size={11} />
        </span>
      </div>
      <header className="header">
        <Link to="/" className="logo" aria-label="AWM home">
          awm<span>ALL WEAR MODE</span>
        </Link>
        <nav aria-label="Main navigation">
          {[
            ["Men", "/men"],
            ["Women", "/women"],
            ["New arrivals", "/new-arrivals"],
            ["The edit", "/trending"],
            ["Admin", "/admin"],
          ].map(([label, to]) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="mobile-admin-link" to="/admin">Admin</Link>
          <button aria-label="Search products" onClick={() => setSearch(true)}>
            <Search size={20} />
          </button>
          <Link className="desktop-icon" to="/account" aria-label="My account">
            <User size={20} />
          </Link>
          <Link
            to="/wishlist"
            aria-label={`Wishlist, ${state.wishlist.length} items`}
          >
            <Heart size={20} />
            {state.wishlist.length > 0 && (
              <small>{state.wishlist.length}</small>
            )}
          </Link>
          <button
            className="bag-button"
            aria-label="Open shopping bag"
            onClick={() => state.setCartOpen(true)}
          >
            <ShoppingBag size={19} />
            <span>Bag ({state.cart.reduce((n, i) => n + i.quantity, 0)})</span>
            <small className="mobile-bag-count">
              {state.cart.reduce((n, i) => n + i.quantity, 0)}
            </small>
          </button>
          <button
            className="mobile-menu"
            aria-label="Open menu"
            onClick={() => setMenu(true)}
          >
            <Menu />
          </button>
        </div>
      </header>
      {menu && (
        <Modal title="Explore AWM" onClose={closeMenu} drawer>
          <nav className="drawer-nav">
            {[
              ["Home", "/"],
              ["Men", "/men"],
              ["Women", "/women"],
              ["New arrivals", "/new-arrivals"],
              ["The edit", "/trending"],
              ["About AWM", "/about"],
              ["My account", "/account"],
              ["Admin", "/admin"],
            ].map(([label, to]) => (
              <Link key={to} to={to} onClick={closeMenu}>
                {label}
                <ArrowUpRight />
              </Link>
            ))}
          </nav>
        </Modal>
      )}
      {search && (
        <Modal title="Find your next mode" onClose={closeSearch}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              closeSearch();
              navigate(`/search?q=${encodeURIComponent(query)}`);
            }}
            className="search-form"
          >
            <input
              aria-label="Search"
              autoFocus
              placeholder="Try denim, oversized, shirts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button aria-label="Submit search">
              <ArrowRight />
            </button>
          </form>
          <p className="eyebrow">
            {query ? "SUGGESTED PIECES" : "EXPLORE THE ESSENTIALS"}
          </p>
          {results.map((p) => (
            <Link
              onClick={closeSearch}
              to={`/product/${p.slug}`}
              key={p.id}
              className="search-result"
            >
              <Image src={p.images[0]} alt={p.name} />
              <span>
                {p.name}
                <small>{money(p.price)}</small>
              </span>
              <ArrowUpRight />
            </Link>
          ))}
          {!results.length && <p>No pieces found. Try another search.</p>}
        </Modal>
      )}
    </>
  );
}
export { Footer } from "./components/Footer";
export function ProductCard({ product: p }: { product: Product }) {
  const saved = useStore(state => state.wishlist.includes(p.id));
  const wish = useStore(state => state.wish);
  const [quick, setQuick] = useState(false);
  const [color, setColor] = useState(p.colors[0]);
  const selectedColor = p.colors.includes(color) ? color : p.colors[0];
  const imageIndex = p.colors.indexOf(selectedColor);
  const close = () => setQuick(false);
  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={`/product/${p.slug}`}>
          <Image
            src={p.images[imageIndex] || p.images[0]}
            alt={`${p.name}, ${selectedColor} — editorial product reference`}
            loading="lazy"
            sizes="(max-width: 560px) 45vw, (max-width: 1100px) 30vw, 23vw"
          />
        </Link>
        <span className="product-badge">
          {p.isNew ? "NEW IN" : p.trending ? "THE EDIT" : ""}
        </span>
        <button
          className={`wish-button ${saved ? "saved" : ""}`}
          aria-label={`Save ${p.name}`}
          aria-pressed={saved}
          onClick={() => wish(p.id)}
        >
          <Heart
            size={17}
            fill={saved ? "currentColor" : "none"}
          />
        </button>
        <div className="card-swatches" role="group" aria-label={`Choose colour for ${p.name}`}>
          {p.colors.map(c => <button key={c} aria-label={`${c} colour for ${p.name}`} aria-pressed={selectedColor === c} title={c} onClick={() => setColor(c)}><span style={{background: c === "Black" ? "#252525" : "#c9bbaa"}} /></button>)}
        </div>
        <button className="quick-add" aria-label={`Quick view / add ${p.name}`} onClick={() => setQuick(true)}>
          <ShoppingBag size={18} />
        </button>
      </div>
      <div className="product-card-content">
      <div className="product-meta">
        <Link to={`/product/${p.slug}`}>{p.name}</Link>
      </div>
      <div className="product-sub">
        <span>{p.category} · {p.gender}</span>
        <span>{selectedColor}</span>
      </div>
      <div className="card-price-row"><strong>{money(p.price)}</strong><button onClick={() => setQuick(true)}>Choose size <ArrowUpRight size={14}/></button></div>
      </div>
      {quick && (
        <Modal title="A closer look" onClose={close}>
          <QuickProduct product={p} initialColor={selectedColor} onAdd={close} />
        </Modal>
      )}
    </article>
  );
}
export function QuickProduct({
  product: p,
  onAdd,
  initialColor,
}: {
  product: Product;
  onAdd: () => void;
  initialColor?: string;
}) {
  const [size, setSize] = useState(""),
    [color, setColor] = useState(initialColor && p.colors.includes(initialColor) ? initialColor : p.colors[0]);
  const state = useStore();
  return (
    <div className="quick-product">
      <Image
        src={p.images[p.colors.indexOf(color) % p.images.length]}
        alt={p.name}
      />
      <div>
        <p className="eyebrow">{p.category}</p>
        <h2>{p.name}</h2>
        <p>{money(p.price)}</p>
        <p>{p.description}</p>
        <label>
          Colour
          <select value={color} onChange={(e) => setColor(e.target.value)}>
            {p.colors.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <p>Size</p>
        <div className="size-options">
          {p.sizes.map((s) => (
            <button
              key={s}
              disabled={!p.stock[`${color}|${s}`]}
              className={size === s ? "selected" : ""}
              onClick={() => setSize(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          className="button dark"
          onClick={() => {
            if (!size) state.notify("Choose your size first.");
            else if (state.add({ productId: p.id, size, color, quantity: 1 }))
              onAdd();
          }}
        >
          Add to bag <Plus size={17} />
        </button>
        <Link to={`/product/${p.slug}`} className="text-link">
          View full details
        </Link>
      </div>
    </div>
  );
}
export function Quantity({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="quantity">
      <button
        aria-label="Decrease quantity"
        onClick={() => onChange(value - 1)}
      >
        <Minus size={14} />
      </button>
      <span>{value}</span>
      <button
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
export function BagItems() {
  const state = useStore();
  return (
    <div className="bag-items">
      {state.cart.map((i) => {
        const p = state.products.find((p) => p.id === i.productId);
        if (!p) return null;
        return (
          <div className="bag-item" key={itemKey(i)}>
            <Link
              to={`/product/${p.slug}`}
              onClick={() => state.setCartOpen(false)}
            >
              <Image
                src={p.images[p.colors.indexOf(i.color) % p.images.length]}
                alt={p.name}
              />
            </Link>
            <div>
              <Link
                to={`/product/${p.slug}`}
                onClick={() => state.setCartOpen(false)}
              >
                {p.name}
              </Link>
              <small>
                {i.color} / {i.size}
              </small>
              <span>{money(p.price * i.quantity)}</span>
              <Quantity
                value={i.quantity}
                onChange={(q) => state.quantity(itemKey(i), q)}
              />
            </div>
            <button
              aria-label={`Remove ${p.name}`}
              onClick={() => state.remove(itemKey(i))}
            >
              <Trash2 size={17} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
export function cartTotals() {
  const s = useStore.getState();
  const subtotal = s.cart.reduce(
    (n, i) =>
      n +
      (s.products.find((p) => p.id === i.productId)?.price || 0) * i.quantity,
    0,
  );
  return { subtotal, shipping: subtotal >= 8000 || subtotal === 0 ? 0 : 250 };
}
export function Summary({ shippingOverride }: { shippingOverride?: number }) {
  useStore((s) => s.cart);
  useStore((s) => s.products);
  const { subtotal, shipping } = cartTotals();
  const delivery = shippingOverride ?? shipping;
  return (
    <div className="summary">
      <div>
        <span>Subtotal</span>
        <span>{money(subtotal)}</span>
      </div>
      <div>
        <span>Estimated delivery</span>
        <span>{delivery === 0 ? "Complimentary" : money(delivery)}</span>
      </div>
      <div className="total">
        <span>Total</span>
        <span>{money(subtotal + delivery)}</span>
      </div>
      <small>PKR · Demo orders only. No payment is taken.</small>
    </div>
  );
}
export function CartDrawer() {
  const open = useStore((s) => s.cartOpen),
    setOpen = useStore((s) => s.setCartOpen),
    cart = useStore((s) => s.cart);
  const close = () => setOpen(false);
  if (!open) return null;
  return (
    <Modal
      title={`Your bag (${cart.reduce((n, i) => n + i.quantity, 0)})`}
      onClose={close}
      drawer
    >
      {cart.length ? (
        <>
          <BagItems />
          <div className="drawer-summary">
            <Summary />
            <Link className="button dark" to="/checkout" onClick={close}>
              Continue to checkout
              <ArrowRight size={17} />
            </Link>
            <Link className="button outline" to="/cart" onClick={close}>
              View your bag
            </Link>
          </div>
        </>
      ) : (
        <Empty
          title="Your next favourite is waiting."
          text="Explore considered essentials and pieces with personality."
          to="/new-arrivals"
          action="Explore new arrivals"
          onClick={close}
        />
      )}
    </Modal>
  );
}
export function Empty({
  title,
  text,
  to,
  action,
  onClick,
}: {
  title: string;
  text: string;
  to: string;
  action: string;
  onClick?: () => void;
}) {
  return (
    <div className="empty">
      <ShoppingBag size={35} />
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button dark" to={to} onClick={onClick}>
        {action}
        <ArrowUpRight size={17} />
      </Link>
    </div>
  );
}
