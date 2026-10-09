import { Image } from "../Image";
import { useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { SlidersHorizontal, X, ArrowUpRight } from "lucide-react";
import { useStore } from "../store";
import { categories, imagery, money } from "../data";
import { ProductCard, Empty, Modal } from "../components";
import { useMediaQuery } from "../hooks";
import type { ReactNode } from "react";
export default function Catalog() {
  const location = useLocation(),
    { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const route = location.pathname;
  const women = route === "/women",
    men = route === "/men",
    isSearch = route === "/search",
    isNew = route === "/new-arrivals",
    trending = route === "/trending";
  const [category, setCategory] = useState("All"),
    [gender, setGender] = useState("All"),
    [size, setSize] = useState("All"),
    [color, setColor] = useState("All"),
    [max, setMax] = useState(15000),
    [available, setAvailable] = useState(false),
    [sort, setSort] = useState("featured"),
    [filters, setFilters] = useState(false);
  const all = useStore((s) => s.products);
  const base = useMemo(
    () =>
      all.filter(
        (p) =>
          p.active &&
          (!men || p.gender === "Men") &&
          (!women || p.gender === "Women") &&
          (!isNew || p.isNew) &&
          (!trending || p.trending) &&
          (!slug ||
            p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug) &&
          (!isSearch ||
            `${p.name} ${p.category} ${p.description} ${p.gender}`
              .toLowerCase()
              .includes(q.toLowerCase())),
      ),
    [all, route, slug, q],
  );
  const products = base
    .filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (gender === "All" || p.gender === gender) &&
        (size === "All" || p.sizes.includes(size)) &&
        (color === "All" || p.colors.includes(color)) &&
        p.price <= max &&
        (!available ||
          Object.entries(p.stock).some(
            ([key, n]) =>
              n > 0 &&
              (size === "All" || key.endsWith(`|${size}`)) &&
              (color === "All" || key.startsWith(`${color}|`)),
          )),
    )
    .sort((a, b) =>
      sort === "price-up"
        ? a.price - b.price
        : sort === "price-down"
          ? b.price - a.price
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : sort === "newest"
              ? Number(b.id.replace(/\D/g, "")) -
                Number(a.id.replace(/\D/g, ""))
              : Number(b.featured) - Number(a.featured),
    );
  const title = isSearch
    ? "Find your mode."
    : men
      ? "The men’s edit."
      : women
        ? "The women’s edit."
        : isNew
          ? "New in. Now you."
          : trending
            ? "In good company."
            : `${slug?.replaceAll("-", " ") || "The collection"}.`;
  const reset = () => {
    setCategory("All");
    setGender("All");
    setSize("All");
    setColor("All");
    setMax(15000);
    setAvailable(false);
  };
  return (
    <main id="main" className="catalog">
      <section className={`catalog-hero ${isSearch ? "search-hero" : ""}`}>
        <div>
          <p className="eyebrow">
            <Link to="/">AWM</Link> /{" "}
            {isSearch
              ? "SEARCH"
              : men
                ? "MENSWEAR"
                : women
                  ? "WOMENSWEAR"
                  : "THE COLLECTIONS"}
          </p>
          <h1>{title}</h1>
          <p>
            {isSearch
              ? "Your next favourite is a search away."
              : men
                ? "Considered essentials. A little attitude. All you."
                : women
                  ? "Fresh silhouettes for every version of you."
                  : "Fresh perspectives and everyday icons, ready for your rotation."}
          </p>
          {isSearch && (
            <form
              className="search-form"
              onSubmit={(e) => {
                e.preventDefault();
                setParams({
                  q: new FormData(e.currentTarget).get("q") as string,
                });
              }}
            >
              <input
                key={q}
                name="q"
                defaultValue={q}
                aria-label="Search products"
                placeholder="Search pieces, categories, styles…"
              />
              <button aria-label="Search">
                <ArrowUpRight />
              </button>
            </form>
          )}
        </div>
        {!isSearch && (
          <Image
            src={women ? imagery.women : imagery.men}
            alt={`${women ? "Women" : "Men"} collection editorial`}
            loading="eager"
          />
        )}
      </section>
      <div className="category-tabs">
        <button
          className={category === "All" ? "active" : ""}
          onClick={() => setCategory("All")}
        >
          All pieces
        </button>
        {categories.map((c) => (
          <button
            className={category === c ? "active" : ""}
            key={c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <section className="catalog-body">
        <div className="catalog-toolbar">
          <button
            className="filter-toggle"
            onClick={() => setFilters(!filters)}
          >
            <SlidersHorizontal size={16} /> Filters {filters ? "−" : "+"}
          </button>
          <span>
            {products.length} pieces{q && ` for “${q}”`}
          </span>
          <label className="sort-label">
            Sort by{" "}
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-up">Price: Low to High</option>
              <option value="price-down">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
        </div>
        <div className={`catalog-layout ${filters ? "has-filters" : ""}`}>
          {filters && (
            <FilterContainer onClose={() => setFilters(false)}>
              <aside className="filters">
                <div className="filter-heading">
                  <h2>Refine your mode</h2>
                  <button
                    aria-label="Close filters"
                    onClick={() => setFilters(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
                {!men && !women && (
                  <label>
                    Gender
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      {["All", "Men", "Women"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {["All", ...categories].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Size
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  >
                    {["All", "XS", "S", "M", "L", "XL"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Colour
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  >
                    {["All", ...new Set(base.flatMap((p) => p.colors))].map(
                      (v) => (
                        <option key={v}>{v}</option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Price up to {money(max)}
                  <input
                    type="range"
                    min="1000"
                    max="15000"
                    step="100"
                    value={max}
                    onChange={(e) => setMax(+e.target.value)}
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                  />{" "}
                  In stock only
                </label>
                <button className="text-link" onClick={reset}>
                  Clear all filters
                </button>
              </aside>
            </FilterContainer>
          )}
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
        {!products.length && (
          <Empty
            title="Nothing in this mode. Yet."
            text="Try a broader search or adjust your filters."
            to="/new-arrivals"
            action="Explore new arrivals"
          />
        )}
      </section>
    </main>
  );
}
function FilterContainer({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const mobile = useMediaQuery("(max-width: 560px)");
  return mobile ? (
    <Modal title="Refine your mode" onClose={onClose} drawer>
      {children}
      <button className="button dark filter-apply" onClick={onClose}>
        Show matching pieces
        <ArrowUpRight size={16} />
      </button>
    </Modal>
  ) : (
    <>{children}</>
  );
}
