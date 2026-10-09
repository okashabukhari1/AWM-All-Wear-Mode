import { Image } from "../Image";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, Check, User, Package, LogOut } from "lucide-react";
import { useStore } from "../store";
import { money, statuses } from "../data";
import type { Order } from "../data";
import { Empty } from "../components";
export function OrderView({ order }: { order: Order }) {
  return (
    <div className="order-view">
      <div className="order-heading">
        <div>
          <p className="eyebrow">DEMO ORDER</p>
          <h2>{order.id}</h2>
          <p>
            {new Date(order.date).toLocaleDateString("en-PK")} · {order.status}
          </p>
        </div>
        <strong>{money(order.total)}</strong>
      </div>
      <ol className="tracking">
        {statuses.map((s, i) => (
          <li
            key={s}
            className={i <= statuses.indexOf(order.status) ? "complete" : ""}
          >
            <span>
              {i <= statuses.indexOf(order.status) ? (
                <Check size={15} />
              ) : (
                i + 1
              )}
            </span>
            {s}
          </li>
        ))}
      </ol>
      <p className="fine-print">
        Illustrative order tracking. Status is controlled in the demo admin.
      </p>
      {order.items.map((i, index) => (
        <div className="order-item" key={index}>
          <Image src={i.image} alt={i.name} />
          <div>
            <h3>{i.name}</h3>
            <p>
              {i.color} / {i.size} · Qty {i.quantity}
            </p>
          </div>
          <span>{money(i.price * i.quantity)}</span>
        </div>
      ))}
      <div className="confirmation-details">
        <div>
          <small>DELIVERY ADDRESS</small>
          <p>
            {order.customer.name}
            <br />
            {order.address}, {order.city}
            <br />
            {order.province} {order.postal}
          </p>
        </div>
        <div>
          <small>PAYMENT & DELIVERY</small>
          <p>
            {order.payment}
            <br />
            Delivery {money(order.shipping)}
          </p>
        </div>
      </div>
    </div>
  );
}
export default function Account() {
  const { id } = useParams(),
    location = useLocation(),
    navigate = useNavigate();
  const state = useStore();
  const [error, setError] = useState("");
  const path = location.pathname;
  const register = path === "/register";
  if (path === "/login" || register)
    return (
      <main id="main" className="auth-page">
        <div className="auth-story">
          <p className="eyebrow">EVERY VERSION OF YOU.</p>
          <h2>
            Your world.
            <br />
            <em>Your mode.</em>
          </h2>
          <p>
            Save your favourites, revisit your orders, and find what feels like
            you.
          </p>
          <span className="mini-wordmark">awm</span>
        </div>
        <div className="auth-form">
          <p className="eyebrow">AWM / YOUR ACCOUNT</p>
          <h1>{register ? "Come on in." : "Welcome back."}</h1>
          <p className="demo-banner">
            Demo session only. No password is requested or stored.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const email = String(data.get("email")).trim().toLowerCase();
              const name = String(data.get("name") || "").trim();
              const profile = state.profiles.find((p) => p.email === email);
              if (register && !name) {
                setError("Please enter your name.");
                return;
              }
              state.signIn(profile || { name: name || "Demo Guest", email });
              navigate("/account");
            }}
          >
            {register && (
              <label>
                Your name
                <input name="name" autoComplete="name" required minLength={2} />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={register ? "" : "customer.one@example.test"}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <button className="button dark">
              {register ? "Create demo profile" : "Enter demo account"}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p>
            {register ? "Already have a profile?" : "New to the mode?"}{" "}
            <Link className="text-link" to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create a demo profile"}
            </Link>
          </p>
        </div>
      </main>
    );
  const order = state.orders.find((o) => o.id === id);
  const orders = state.session
    ? state.orders.filter(
        (o) =>
          o.customer.email.toLowerCase() === state.session?.email.toLowerCase(),
      )
    : state.orders;
  return (
    <main id="main" className="section-padding account-page">
      <p className="eyebrow">YOUR AWM</p>
      <h1>
        {id
          ? "The journey."
          : path.endsWith("/orders")
            ? "Your orders."
            : `Hello, ${state.session?.name.split(" ")[0] || "you"}.`}
      </h1>
      <div className="account-layout">
        <nav className="account-nav" aria-label="Account navigation">
          <Link to="/account">
            <User size={16} /> Your profile
          </Link>
          <Link to="/account/orders">
            <Package size={16} /> Demo orders
          </Link>
          <Link to="/wishlist">
            Saved pieces
            <ArrowUpRight size={16} />
          </Link>
          {state.session ? (
            <button
              onClick={() => {
                state.signOut();
                navigate("/login");
              }}
            >
              <LogOut size={16} /> Sign out
            </button>
          ) : (
            <Link to="/login">
              Demo sign in
              <ArrowUpRight size={16} />
            </Link>
          )}
        </nav>
        <div>
          {id ? (
            order ? (
              <OrderView order={order} />
            ) : (
              <Empty
                title="This order isn’t on this device."
                text="Demo orders only exist in the browser where they were placed."
                to="/account/orders"
                action="All demo orders"
              />
            )
          ) : path.endsWith("/orders") ? (
            <>
              {!state.session && (
                <p className="demo-banner">
                  Guest mode: showing orders placed on this device. Sign in to
                  filter by your demo email.
                </p>
              )}
              {orders.length ? (
                <div className="orders-list">
                  {orders.map((o) => (
                    <Link key={o.id} to={`/account/orders/${o.id}`}>
                      <div>
                        <strong>{o.id}</strong>
                        <small>
                          {new Date(o.date).toLocaleDateString("en-PK")} ·{" "}
                          {o.items.reduce((n, i) => n + i.quantity, 0)} pieces
                        </small>
                      </div>
                      <span>{o.status}</span>
                      <strong>{money(o.total)}</strong>
                      <ArrowUpRight size={18} />
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty
                  title="Your story starts here."
                  text="Place a demo order to see its journey."
                  to="/new-arrivals"
                  action="Explore the collection"
                />
              )}
            </>
          ) : (
            <>
              <h2>Your corner of the mode.</h2>
              <p>
                Keep your favourites close and follow your demo orders, all in
                one place.
              </p>
              {state.session ? (
                <div className="profile-card">
                  <p>
                    <small>NAME</small>
                    {state.session.name}
                  </p>
                  <p>
                    <small>EMAIL</small>
                    {state.session.email}
                  </p>
                  <p>
                    <small>SESSION</small>Browser-local demo profile
                  </p>
                </div>
              ) : (
                <Empty
                  title="Make yourself at home."
                  text="A demo profile keeps your selection together. No password needed."
                  to="/login"
                  action="Enter demo account"
                />
              )}
              <div className="account-cards">
                <Link to="/wishlist">
                  <HeartOutline />
                  <h3>Your personal edit</h3>
                  <p>{state.wishlist.length} saved pieces</p>
                  <ArrowUpRight />
                </Link>
                <Link to="/account/orders">
                  <Package />
                  <h3>Follow the journey</h3>
                  <p>{orders.length} demo orders</p>
                  <ArrowUpRight />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
function HeartOutline() {
  return <span className="heart-outline">♡</span>;
}
