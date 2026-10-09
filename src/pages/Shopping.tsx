import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, ArrowUpRight } from "lucide-react";
import { useStore } from "../store";
import { money } from "../data";
import {
  BagItems,
  Summary,
  ProductCard,
  Empty,
  cartTotals,
} from "../components";
export default function Shopping() {
  const location = useLocation(),
    navigate = useNavigate(),
    { id } = useParams();
  const state = useStore();
  const [shippingMethod, setShipping] = useState("standard");
  const [error, setError] = useState("");
  const path = location.pathname;
  if (path === "/wishlist") {
    const products = state.products.filter(
      (p) => p.active && state.wishlist.includes(p.id),
    );
    return (
      <main id="main" className="section-padding shopping-page">
        <p className="eyebrow">YOUR PERSONAL EDIT</p>
        <h1>
          Saved for <em>later.</em>
        </h1>
        <p>
          {products.length} pieces you have your eye on. Choose your size
          through quick view to add to your bag.
        </p>
        {products.length ? (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <Empty
            title="A little space for your favourites."
            text="Tap the heart on any piece to keep it here."
            to="/new-arrivals"
            action="Find a favourite"
          />
        )}
      </main>
    );
  }
  if (path.startsWith("/order-confirmation")) {
    const order = state.orders.find((o) => o.id === id);
    if (!order)
      return (
        <main id="main">
          <Empty
            title="Order not found on this device."
            text="Demo orders are stored in your browser."
            to="/account/orders"
            action="View demo orders"
          />
        </main>
      );
    return (
      <main id="main" className="confirmation section-padding">
        <div className="confirmation-icon">
          <Check />
        </div>
        <p className="eyebrow">YOUR NEXT MODE IS ON ITS WAY</p>
        <h1>
          Good choice.
          <br />
          <em>Great mode.</em>
        </h1>
        <p>
          Demo order <strong>{order.id}</strong> has been placed.
          <br />
          No payment has been taken. No items will be shipped.
        </p>
        <div className="confirmation-details">
          <div>
            <small>DELIVER TO</small>
            <p>
              {order.customer.name}
              <br />
              {order.address}, {order.city}
              <br />
              {order.province} {order.postal}
            </p>
          </div>
          <div>
            <small>ORDER TOTAL</small>
            <p>
              {money(order.total)}
              <br />
              {order.payment}
            </p>
          </div>
        </div>
        <div className="button-row">
          <Link className="button dark" to={`/account/orders/${order.id}`}>
            Track demo order
            <ArrowRight size={17} />
          </Link>
          <Link className="button outline" to="/new-arrivals">
            Keep exploring
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </main>
    );
  }
  if (!state.cart.length)
    return (
      <main id="main" className="section-padding shopping-page">
        <p className="eyebrow">YOUR BAG</p>
        <Empty
          title="Your next favourite is waiting."
          text="Start with something that feels like you."
          to="/new-arrivals"
          action="Explore new arrivals"
        />
      </main>
    );
  if (path === "/cart")
    return (
      <main id="main" className="section-padding shopping-page">
        <p className="eyebrow">A GOOD START</p>
        <h1>
          Your <em>bag.</em>
        </h1>
        <div className="checkout-grid">
          <div>
            <BagItems />
            <Link className="text-link" to="/new-arrivals">
              Continue exploring
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <aside className="checkout-summary">
            <h2>The details</h2>
            <Summary />
            <Link className="button dark" to="/checkout">
              Continue to checkout
              <ArrowRight size={17} />
            </Link>
          </aside>
        </div>
      </main>
    );
  const shipping = shippingMethod === "express" ? 450 : cartTotals().shipping;
  return (
    <main id="main" className="section-padding shopping-page">
      <p className="eyebrow">
        <Link to="/cart">YOUR BAG</Link> / CHECKOUT
      </p>
      <h1>
        Make it <em>yours.</em>
      </h1>
      <p className="demo-banner">
        FRONTEND DEMO — No real payment, shipping, or account authentication.
      </p>
      <div className="checkout-grid">
        <form
          className="checkout-form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget));
            if (
              String(data.name).trim().length < 2 ||
              String(data.address).trim().length < 4 ||
              !String(data.city).trim()
            ) {
              setError("Please enter your name, address, and city.");
              return;
            }
            if (
              !/^\+?[\d\s()-]{7,18}$/.test(String(data.phone)) ||
              String(data.phone).replace(/\D/g, "").length < 7
            ) {
              setError("Enter a valid phone number.");
              return;
            }
            const id = state.checkout({
              customer: {
                name: String(data.name).trim(),
                email: String(data.email).trim().toLowerCase(),
                phone: String(data.phone),
              },
              address: String(data.address).trim(),
              city: String(data.city),
              province: String(data.province),
              postal: String(data.postal),
              payment: String(data.payment),
              shipping,
            });
            if (id) navigate(`/order-confirmation/${id}`);
            else
              setError("Unable to place this order. Check stock in your bag.");
          }}
        >
          <h2>01 / Your details</h2>
          <div className="form-grid">
            <label>
              Full name
              <input
                name="name"
                required
                minLength={2}
                defaultValue={state.session?.name}
                autoComplete="name"
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                name="email"
                required
                defaultValue={state.session?.email}
                autoComplete="email"
              />
            </label>
            <label className="full">
              Phone number
              <input
                name="phone"
                type="tel"
                required
                placeholder="03XX XXXXXXX"
                autoComplete="tel"
              />
            </label>
          </div>
          <h2>02 / Where to?</h2>
          <div className="form-grid">
            <label className="full">
              Street address
              <input
                name="address"
                required
                minLength={4}
                autoComplete="street-address"
              />
            </label>
            <label>
              City
              <input name="city" required autoComplete="address-level2" />
            </label>
            <label>
              Province
              <select name="province" required defaultValue="">
                <option value="" disabled>
                  Select province
                </option>
                {[
                  "Punjab",
                  "Sindh",
                  "Khyber Pakhtunkhwa",
                  "Balochistan",
                  "Islamabad Capital Territory",
                  "Gilgit-Baltistan",
                  "Azad Jammu and Kashmir",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              Postal code
              <input
                name="postal"
                required
                pattern="[0-9]{5}"
                title="A five-digit Pakistani postal code"
                autoComplete="postal-code"
              />
            </label>
          </div>
          <h2>03 / Delivery & payment</h2>
          <label className="radio-card">
            <input
              type="radio"
              name="shipping"
              checked={shippingMethod === "standard"}
              onChange={() => setShipping("standard")}
            />{" "}
            <span>
              Standard delivery <small>3–5 working days (demo)</small>
            </span>
            <b>{cartTotals().shipping ? money(250) : "Free"}</b>
          </label>
          <label className="radio-card">
            <input
              type="radio"
              name="shipping"
              checked={shippingMethod === "express"}
              onChange={() => setShipping("express")}
            />
            <span>
              Express delivery <small>1–2 working days (demo)</small>
            </span>
            <b>{money(450)}</b>
          </label>
          <label className="radio-card">
            <input
              type="radio"
              name="payment"
              value="Cash on Delivery (Demo)"
              defaultChecked
            />
            <span>
              Cash on delivery{" "}
              <small>Simulation — no amount is collected</small>
            </span>
          </label>
          <label className="radio-card">
            <input
              type="radio"
              name="payment"
              value="Online Payment (Demo Only)"
            />
            <span>
              Online payment (demo only)
              <small>Simulated payment. No card information required.</small>
            </span>
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button className="button dark" type="submit">
            Place demo order
            <ArrowRight size={17} />
          </button>
          <p className="fine-print">
            By placing a demo order you accept the{" "}
            <Link to="/terms">demo terms</Link>. Data stays on this device.
          </p>
        </form>
        <aside className="checkout-summary">
          <h2>Your selection</h2>
          <BagItems />
          <Summary shippingOverride={shipping} />
        </aside>
      </div>
    </main>
  );
}
