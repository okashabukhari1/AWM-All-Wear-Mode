import { Image } from "../Image";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Users,
  ArrowUpRight,
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { useStore } from "../store";
import { categories, money, statuses, variantKey } from "../data";
import type { Product, Profile } from "../data";
import { Modal } from "../components";
import { OrderView } from "./Account";
const links = [
  ["Overview", "/admin", LayoutDashboard],
  ["Products", "/admin/products", Package],
  ["Orders", "/admin/orders", ShoppingBag],
  ["Inventory", "/admin/inventory", Boxes],
  ["Customers", "/admin/customers", Users],
] as const;
export default function Admin() {
  const path = useLocation().pathname;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="logo">
          awm<span>DEMO MANAGEMENT</span>
        </Link>
        <p className="eyebrow">WORKSPACE</p>
        <nav>
          {links.map(([label, to, Icon]) => (
            <Link
              className={
                (to === "/admin" ? path === to : path.startsWith(to))
                  ? "active"
                  : ""
              }
              to={to}
              key={to}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <Link to="/" className="admin-store-link">
          View storefront
          <ArrowUpRight size={17} />
        </Link>
        <small>
          Frontend-only demo.
          <br />
          Data lives in this browser.
          <br />
          No secure admin authentication.
        </small>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <span>AWM / DEMO CONTROL ROOM</span>
          <span className="demo-pill">LOCAL DEMO</span>
        </header>
        <main id="main">
          {path.includes("/new") || path.includes("/edit") ? (
            <ProductForm />
          ) : path === "/admin/products" ? (
            <Products />
          ) : path === "/admin/orders" ? (
            <Orders />
          ) : path === "/admin/inventory" ? (
            <Inventory />
          ) : path === "/admin/customers" ? (
            <Customers />
          ) : path === "/admin" ? (
            <Dashboard />
          ) : (
            <div className="admin-title">
              <h1>Page not found</h1>
              <Link to="/admin">Back to overview</Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
function AdminTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-title">
      <div>
        <p className="eyebrow">YOUR BUSINESS, IN DEMO</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function Dashboard() {
  const s = useStore(),
    revenue = s.orders.reduce((n, o) => n + o.total, 0);
  const low = s.products.filter((p) =>
    Object.values(p.stock).some((n) => n < 5),
  );
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      label: d.toLocaleDateString("en", { weekday: "short" }),
      total: s.orders
        .filter((o) => new Date(o.date).toDateString() === d.toDateString())
        .reduce((n, o) => n + o.total, 0),
    };
  });
  const max = Math.max(1, ...days.map((d) => d.total));
  return (
    <>
      <AdminTitle
        title="A good overview."
        subtitle="A real view of your browser-local demo data."
      />
      <div className="kpi-grid">
        {[
          ["Demo revenue", money(revenue)],
          ["Orders", s.orders.length],
          ["Products", s.products.length],
          ["Low-stock products", low.length],
        ].map(([label, value]) => (
          <div className="kpi" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Derived from local demo records</small>
          </div>
        ))}
      </div>
      <div className="admin-charts">
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>The week in demo sales</h2>
            <span>LAST 7 DAYS</span>
          </div>
          <div className="sales-chart">
            {days.map((d, i) => (
              <div key={i}>
                <span>{money(d.total)}</span>
                <div
                  className="chart-bar"
                  style={{ height: `${Math.max(2, (d.total / max) * 160)}px` }}
                />
                <small>{d.label}</small>
              </div>
            ))}
          </div>
          {!revenue && (
            <p className="fine-print">
              Place a demo order to begin building the chart.
            </p>
          )}
        </section>
        <section className="admin-panel">
          <h2>Order journey</h2>
          {statuses.map((status) => (
            <div className="status-stat" key={status}>
              <span>{status}</span>
              <div>
                <i
                  style={{
                    width: `${s.orders.length ? (s.orders.filter((o) => o.status === status).length / s.orders.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <b>{s.orders.filter((o) => o.status === status).length}</b>
            </div>
          ))}
        </section>
      </div>
      <section className="admin-panel">
        <div className="panel-heading">
          <h2>Recent demo orders</h2>
          <Link to="/admin/orders" className="text-link">
            All orders
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <OrdersTable limit={5} />
      </section>
      <section className="admin-panel">
        <div className="panel-heading">
          <h2>Needs a little attention</h2>
          <Link to="/admin/inventory" className="text-link">
            Review inventory
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <p>
          {low.length} products have at least one variant with fewer than 5
          units.
        </p>
        <div className="low-stock-list">
          {low.slice(0, 5).map((p) => (
            <Link to={`/admin/products/${p.id}/edit`} key={p.id}>
              {p.name}
              <span>
                LOW STOCK
                <ArrowUpRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
function Products() {
  const s = useStore(),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All");
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const products = s.products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (category === "All" || p.category === category),
  );
  return (
    <>
      <AdminTitle
        title="The product edit."
        subtitle="Create and manage the pieces in your demo storefront."
        action={
          <Link className="button dark" to="/admin/products/new">
            Add product
            <Plus size={16} />
          </Link>
        }
      />
      <div className="admin-tools">
        <label className="input-icon">
          <Search size={16} />
          <input
            aria-label="Search admin products"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter product category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {["All", ...categories].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span>{products.length} products</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    className="table-product"
                    to={`/admin/products/${p.id}/edit`}
                  >
                    <Image src={p.images[0]} alt="" />
                    <span>
                      {p.name}
                      <small>
                        {p.gender} · {p.id}
                      </small>
                    </span>
                  </Link>
                </td>
                <td>{p.category}</td>
                <td>{money(p.price)}</td>
                <td>{Object.values(p.stock).reduce((n, x) => n + x, 0)}</td>
                <td>
                  <span className="status-badge">
                    {p.active ? "Active" : "Draft"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <Link
                      aria-label={`Edit ${p.name}`}
                      to={`/admin/products/${p.id}/edit`}
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      aria-label={`Delete ${p.name}`}
                      onClick={() => setPendingDelete(p)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!products.length && (
          <p className="table-empty">No products match this search.</p>
        )}
      </div>
      {pendingDelete && (
        <Modal
          title="Remove a demo product"
          onClose={() => setPendingDelete(null)}
        >
          <h2>Remove {pendingDelete.name}?</h2>
          <p>
            This removes the piece from the browser-local catalogue, bag, and
            wishlist. Existing order snapshots stay available.
          </p>
          <div className="button-row">
            <button
              className="button outline"
              onClick={() => setPendingDelete(null)}
            >
              Keep product
            </button>
            <button
              className="button dark"
              onClick={() => {
                s.deleteProduct(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete demo product
              <Trash2 size={16} />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function ProductForm() {
  const path = useLocation().pathname,
    id = path.split("/")[3];
  const s = useStore(),
    navigate = useNavigate();
  const existing = s.products.find((p) => p.id === id);
  const [sizes, setSizes] = useState(existing?.sizes || ["S", "M", "L", "XL"]),
    [colors, setColors] = useState(
      existing?.colors.join(", ") || "Stone, Black",
    );
  const [slugError, setSlugError] = useState("");
  const colorList = [
    ...new Set(
      colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ];
  if (path.endsWith("/edit") && !existing)
    return (
      <div className="admin-title">
        <h1>Product not found</h1>
        <Link to="/admin/products">All products</Link>
      </div>
    );
  return (
    <>
      <Link className="text-link" to="/admin/products">
        <ArrowLeft size={16} /> All products
      </Link>
      <AdminTitle
        title={existing ? "Refine the piece." : "A new perspective."}
        subtitle="Changes are saved to LocalStorage and update the storefront immediately."
      />
      <form
        className="admin-product-form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const name = String(data.get("name")).trim();
          const slug = String(data.get("slug")).trim().toLowerCase();
          if (
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
            s.products.some((p) => p.slug === slug && p.id !== existing?.id)
          ) {
            setSlugError(
              "Use a unique URL slug with lowercase letters, numbers, and hyphens.",
            );
            return;
          }
          if (!colorList.length || !sizes.length) {
            setSlugError("Add at least one colour and one size.");
            return;
          }
          const stock = Object.fromEntries(
            colorList.flatMap((c) =>
              sizes.map((z) => [
                variantKey(c, z),
                Math.max(0, Number(data.get(`stock-${c}-${z}`)) || 0),
              ]),
            ),
          );
          const p: Product = {
            id: existing?.id || `p-${Date.now()}`,
            slug,
            name,
            gender: String(data.get("gender")) as Product["gender"],
            category: String(data.get("category")),
            description: String(data.get("description")),
            price: Number(data.get("price")),
            images: [
              String(data.get("image")),
              String(data.get("image2")),
            ].filter(Boolean),
            sizes,
            colors: colorList,
            stock,
            featured: data.get("featured") === "on",
            isNew: data.get("isNew") === "on",
            trending: data.get("trending") === "on",
            active: data.get("active") === "on",
          };
          s.saveProduct(p);
          navigate("/admin/products");
        }}
      >
        <div className="admin-panel">
          <h2>The essentials</h2>
          <div className="form-grid">
            <label className="full">
              Product name
              <input name="name" required defaultValue={existing?.name} />
            </label>
            <label className="full">
              URL slug
              <input
                name="slug"
                required
                placeholder="relaxed-cotton-tee"
                defaultValue={existing?.slug}
              />
            </label>
            <label>
              Gender
              <select name="gender" defaultValue={existing?.gender || "Men"}>
                <option>Men</option>
                <option>Women</option>
              </select>
            </label>
            <label>
              Category
              <select
                name="category"
                defaultValue={existing?.category || "T-Shirts"}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Price (PKR)
              <input
                type="number"
                min="1"
                step="1"
                name="price"
                required
                defaultValue={existing?.price || 2490}
              />
            </label>
            <label className="full">
              Description
              <textarea
                name="description"
                rows={4}
                required
                defaultValue={existing?.description}
              />
            </label>
            <label className="full">
              Main image URL
              <input
                type="url"
                name="image"
                required
                defaultValue={existing?.images[0]}
                placeholder="https://…"
              />
            </label>
            <label className="full">
              Alternate image URL
              <input
                type="url"
                name="image2"
                defaultValue={existing?.images[1]}
              />
            </label>
          </div>
        </div>
        <div className="admin-panel">
          <h2>Fit, colour & stock</h2>
          <p>Stock is tracked independently for each size and colour.</p>
          <label>
            Colours, separated by commas
            <input value={colors} onChange={(e) => setColors(e.target.value)} />
          </label>
          <p>Available sizes</p>
          <div className="size-options">
            {["XS", "S", "M", "L", "XL", "XXL"].map((z) => (
              <button
                type="button"
                className={sizes.includes(z) ? "selected" : ""}
                key={z}
                onClick={() =>
                  setSizes(
                    sizes.includes(z)
                      ? sizes.filter((x) => x !== z)
                      : [...sizes, z],
                  )
                }
              >
                {z}
              </button>
            ))}
          </div>
          <div className="variant-stock-grid">
            {colorList.flatMap((c) =>
              sizes.map((z) => (
                <label key={`${c}-${z}`}>
                  {c} / {z}
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    name={`stock-${c}-${z}`}
                    defaultValue={existing?.stock[variantKey(c, z)] ?? 10}
                  />
                </label>
              )),
            )}
          </div>
          <h2>Where it belongs</h2>
          {[
            ["active", "Active on storefront", existing?.active ?? true],
            ["featured", "Featured", existing?.featured || false],
            ["isNew", "New arrival", existing?.isNew || false],
            ["trending", "Trending edit", existing?.trending || false],
          ].map(([name, label, checked]) => (
            <label className="checkbox" key={String(name)}>
              <input
                type="checkbox"
                name={String(name)}
                defaultChecked={Boolean(checked)}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="full">
          {slugError && (
            <p className="error" role="alert">
              {slugError}
            </p>
          )}
          <button className="button dark">
            Save demo product
            <ArrowUpRight size={17} />
          </button>
        </div>
      </form>
    </>
  );
}
function Inventory() {
  const s = useStore(),
    [query, setQuery] = useState(""),
    [low, setLow] = useState(false);
  const products = s.products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (!low || Object.values(p.stock).some((n) => n < 5)),
  );
  return (
    <>
      <AdminTitle
        title="Room for more."
        subtitle="Adjust stock per colour and size. Changes apply to cart checks and checkout."
      />
      <div className="admin-tools">
        <input
          aria-label="Search inventory"
          placeholder="Find a piece…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={low}
            onChange={(e) => setLow(e.target.checked)}
          />{" "}
          Low stock only
        </label>
      </div>
      {products.map((p) => (
        <details className="inventory-product" key={p.id}>
          <summary>
            <span>{p.name}</span>
            <span>
              {Object.values(p.stock).reduce((n, x) => n + x, 0)} units
              {Object.values(p.stock).some((n) => n < 5) && (
                <b className="low-badge">LOW STOCK</b>
              )}
            </span>
          </summary>
          <div className="variant-stock-grid">
            {p.colors.flatMap((c) =>
              p.sizes.map((z) => {
                const key = variantKey(c, z),
                  n = p.stock[key] || 0;
                return (
                  <label key={key}>
                    {c} / {z}
                    <input
                      aria-label={`${p.name} ${c} ${z} stock`}
                      type="number"
                      min="0"
                      step="1"
                      value={n}
                      onChange={(e) =>
                        s.adjustStock(p.id, key, Number(e.target.value))
                      }
                    />
                    <small>
                      {!n ? "Out of stock" : n < 5 ? "Low stock" : "In stock"}
                    </small>
                  </label>
                );
              }),
            )}
          </div>
        </details>
      ))}
      {!products.length && <p>No matching inventory.</p>}
    </>
  );
}
function OrdersTable({
  limit,
  query = "",
  status = "All",
}: {
  limit?: number;
  query?: string;
  status?: string;
}) {
  const s = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const orders = s.orders
    .filter(
      (o) =>
        `${o.id} ${o.customer.name} ${o.customer.email}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (status === "All" || status === o.status),
    )
    .slice(0, limit);
  const order = s.orders.find((o) => o.id === selected);
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>
                  {o.customer.name}
                  <small>{o.customer.email}</small>
                </td>
                <td>{new Date(o.date).toLocaleDateString("en-PK")}</td>
                <td>{money(o.total)}</td>
                <td>
                  <select
                    aria-label={`Status for ${o.id}`}
                    value={o.status}
                    onChange={(e) => s.orderStatus(o.id, e.target.value)}
                  >
                    {statuses.map((z) => (
                      <option key={z}>{z}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    className="text-link"
                    onClick={() => setSelected(o.id)}
                  >
                    View
                    <ArrowUpRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && (
          <p className="table-empty">
            No demo orders yet. Place one through the storefront checkout.
          </p>
        )}
      </div>
      {order && (
        <Modal title="Demo order details" onClose={() => setSelected(null)}>
          <OrderView order={order} />
        </Modal>
      )}
    </>
  );
}
function Orders() {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("All");
  return (
    <>
      <AdminTitle
        title="Every order, considered."
        subtitle="Update demo statuses and follow the journey in the customer account."
      />
      <div className="admin-tools">
        <input
          aria-label="Search orders"
          placeholder="Search reference or customer…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter order status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["All", ...statuses].map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
      </div>
      <OrdersTable query={query} status={status} />
    </>
  );
}
function Customers() {
  const s = useStore(),
    [query, setQuery] = useState(""),
    [profile, setProfile] = useState<Profile | null>(null);
  const profiles = s.profiles.filter((p) =>
    `${p.name} ${p.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  const orders = s.orders.filter((o) => o.customer.email === profile?.email);
  return (
    <>
      <AdminTitle
        title="People behind the pieces."
        subtitle="Seeded fictitious profiles and customers created on this device."
      />
      <div className="admin-tools">
        <input
          aria-label="Search customers"
          placeholder="Find a demo profile…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Demo orders</th>
              <th>Spend</th>
              <th>Profile</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const orders = s.orders.filter(
                (o) => o.customer.email === p.email,
              );
              return (
                <tr key={p.email}>
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{orders.length}</td>
                  <td>{money(orders.reduce((n, o) => n + o.total, 0))}</td>
                  <td>
                    <button className="text-link" onClick={() => setProfile(p)}>
                      View
                      <ArrowUpRight size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {profile && (
        <Modal title="Demo customer profile" onClose={() => setProfile(null)}>
          <h2>{profile.name}</h2>
          <p>
            {profile.email}
            <br />
            {profile.phone || "No phone supplied"}
          </p>
          <p className="demo-banner">
            Fictitious/local demo profile. No real customer database.
          </p>
          <h3>Order history</h3>
          {orders.length ? (
            orders.map((o) => (
              <details key={o.id}>
                <summary>
                  {o.id} · {money(o.total)}
                </summary>
                <OrderView order={o} />
              </details>
            ))
          ) : (
            <p>No orders on this device for this profile.</p>
          )}
        </Modal>
      )}
    </>
  );
}
