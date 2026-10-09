import { Image } from "../Image";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useStore } from "../store";
import { imagery } from "../data";
import { ArrowLink, Empty } from "../components";
const faq = [
  [
    "How does this demo work?",
    "AWM is a frontend prototype. Cart, wishlist, products, profiles, and orders are stored in LocalStorage on this device. No payment is taken and no parcel is shipped.",
  ],
  [
    "How do I choose my size?",
    "Open the size guide on any product page for indicative measurements. Pick a size before adding a piece to your bag. Exact production sizing will be supplied with garment specifications.",
  ],
  [
    "Where do you deliver?",
    "The demo checkout supports Pakistani addresses. Proposed standard delivery is 3–5 working days; these estimates are illustrative.",
  ],
  [
    "What is the proposed returns policy?",
    "For this concept, unworn pieces with original labels may be returned within 14 days. The final operational policy must be confirmed before launch.",
  ],
  [
    "Can I change an order?",
    "Demo order items are fixed after checkout. You can change its tracking status in Demo Admin → Orders. Real order amendment and cancellation services are outside this prototype.",
  ],
  [
    "Why don’t the images match every colour?",
    "Stock photography is used as an editorial reference. Exact garment and colour variant photographs are required for a production store.",
  ],
  [
    "How do I reset the demo?",
    "Use your browser’s site-data settings to clear this site’s LocalStorage. This resets products, stock, orders, wishlist, and profile to the initial demo state.",
  ],
];
export default function Information() {
  const location = useLocation();
  const path = location.pathname;
  const platform = new URLSearchParams(location.search).get("platform");
  const social = platform && ["Instagram", "TikTok", "Facebook"].includes(platform) ? platform : null;
  if (path === "/about")
    return (
      <main id="main">
        <section className="about-hero section-padding">
          <p className="eyebrow">THE AWM PERSPECTIVE</p>
          <h1>
            Every style.
            <br />
            Every mood.
            <br />
            <em>Every mode.</em>
          </h1>
          <div>
            <Image src={imagery.women} alt="AWM editorial fashion reference" />
            <p>
              There’s no one way to be you.
              <br />
              There shouldn’t be one way to dress.
            </p>
          </div>
        </section>
        <section className="intro section-padding">
          <div className="intro-grid">
            <h2>
              Style is personal.
              <br />
              <em>Keep it that way.</em>
            </h2>
            <div>
              <p>
                All Wear Mode is a concept built around self-expression. We
                bring considered everyday pieces and expressive streetwear into
                the same wardrobe.
              </p>
              <p>
                For men. For women. For whatever the day feels like. Premium in
                perspective, accessible in spirit.
              </p>
              <p>
                This client-pitch prototype presents a brand direction. It makes
                no claims about company history, manufacturing, or
                certifications.
              </p>
              <ArrowLink to="/new-arrivals">Find your next mode</ArrowLink>
            </div>
          </div>
        </section>
      </main>
    );
  if (path === "/contact")
    return (
      <main id="main" className="section-padding info-page">
        <p className="eyebrow">HERE FOR YOU</p>
        <h1>
          Let’s <em>talk.</em>
        </h1>
        <div className="contact-grid">
          <div>
            <h2>
              A question. An idea.
              <br />A different perspective.
            </h2>
            <p>
              We’d like to hear it. Use this demo form to see the contact
              experience.
            </p>
            <details open>
              <summary>Customer support</summary>
              <p>
                Support email and phone will be supplied before launch. This
                demo does not send messages.
              </p>
            </details>
            <details>
              <summary>Press & collaborations</summary>
              <p>
                We’re open to fresh perspectives. Submit a demo collaboration
                enquiry below.
              </p>
            </details>
            <p className="eyebrow">PROPOSED HOURS: MON–SAT, 10AM–6PM PKT</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              useStore
                .getState()
                .notify(
                  "Demo enquiry received on screen. No message has been sent.",
                );
              e.currentTarget.reset();
            }}
          >
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Email
              <input type="email" name="email" required />
            </label>
            <label>
              What’s on your mind?
              <select name="topic" key={social || "general"} defaultValue={social ? "Social profile links" : "Product & sizing"}>
                <option>Product & sizing</option>
                <option>Demo order</option>
                <option>Collaboration</option>
                <option>Other enquiry</option>
                <option>Social profile links</option>
              </select>
            </label>
            <label>
              Your message
              <textarea required name="message" rows={5} key={social || "message"} defaultValue={social ? `Please share the official AWM ${social} profile link.` : ""} />
            </label>
            <button className="button dark">
              Submit demo enquiry
              <ArrowUpRight size={18} />
            </button>
          </form>
        </div>
      </main>
    );
  if (path === "/faq")
    return (
      <main id="main" className="section-padding info-page narrow">
        <p className="eyebrow">A LITTLE CLARITY</p>
        <h1>
          Good <em>questions.</em>
        </h1>
        <p>Everything you need to find your mode.</p>
        {faq.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
        <ArrowLink to="/contact">Still have a question?</ArrowLink>
      </main>
    );
  if (path === "/shipping-returns")
    return (
      <main id="main" className="section-padding info-page narrow">
        <p className="eyebrow">THE DETAILS, CONSIDERED</p>
        <h1>
          From us.
          <br />
          <em>To you.</em>
        </h1>
        <p className="demo-banner">
          Proposed policies for client review. This prototype does not fulfil
          shipments or returns.
        </p>
        <h2>Delivery across Pakistan</h2>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Estimate</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Standard</td>
              <td>3–5 working days</td>
              <td>PKR 250</td>
            </tr>
            <tr>
              <td>Orders over PKR 8,000</td>
              <td>3–5 working days</td>
              <td>Complimentary</td>
            </tr>
            <tr>
              <td>Express</td>
              <td>1–2 working days</td>
              <td>PKR 450</td>
            </tr>
          </tbody>
        </table>
        <h2>A little room to change your mind</h2>
        <p>
          Proposed returns window: 14 days after delivery. Items should be
          unworn, unwashed, and have original labels attached. For the demo, no
          refund or return request is processed.
        </p>
        <h2>Tracking your pieces</h2>
        <p>
          Visit My Orders to view browser-local demo tracking. Status updates
          are controlled in the demo admin, with stages from Placed to
          Delivered.
        </p>
        <ArrowLink to="/account/orders">View your demo orders</ArrowLink>
      </main>
    );
  if (path === "/privacy-policy" || path === "/terms") {
    const privacy = path === "/privacy-policy";
    return (
      <main id="main" className="section-padding info-page narrow">
        <p className="eyebrow">FRONTEND PROTOTYPE / CLIENT REVIEW</p>
        <h1>{privacy ? "Your data." : "The small print."}</h1>
        <p className="demo-banner">
          Draft prototype information. Final legal terms require review before a
          production launch.
        </p>
        {(privacy
          ? [
              [
                "What this prototype stores",
                "Cart items, saved products, demo profile details, addresses supplied at checkout, orders, and admin changes are stored in your browser’s LocalStorage. No password or card information is requested.",
              ],
              [
                "External content",
                "Stock images are served from Unsplash and fonts from Google Fonts. These external providers receive normal browser requests. Their own policies govern those requests.",
              ],
              [
                "Control of your data",
                "Clear this site’s browser data to delete your stored demo information. Use invented test details in forms. Nothing in this prototype submits your details to a business server.",
              ],
              [
                "Limits of local persistence",
                "LocalStorage is not encrypted or an authentication system. Anyone with access to this browser may see demo information. Do not use real sensitive details.",
              ],
            ]
          : [
              [
                "Using the demo",
                "This website is a pitch prototype. Prices, stock, descriptions, delivery estimates, and policies are illustrative. They are not an offer of goods or a commercial transaction.",
              ],
              [
                "Orders and payments",
                "All orders are simulated. No money is collected, no items are shipped, and demo tracking is manually controlled. Online Payment is explicitly a simulation without card fields.",
              ],
              [
                "Product references",
                "Stock photography is used to communicate an editorial direction. Images do not establish exact product specifications. Replace all illustrative content with verified product assets before launch.",
              ],
              [
                "Availability and changes",
                "Demo data can be changed through the local admin and is specific to this browser. Clearing site data returns the initial sample catalogue. This admin is not secured for production.",
              ],
            ]
        ).map(([heading, body]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{body}</p>
          </section>
        ))}
        <Link className="text-link" to="/contact">
          Contact information
        </Link>
      </main>
    );
  }
  return (
    <main id="main" className="section-padding info-page">
      <p className="eyebrow">404 / OFF THE BEATEN PATH</p>
      <Empty
        title="A different direction."
        text="This page isn’t in the collection. Let’s find your next mode."
        to="/"
        action="Back to AWM"
      />
    </main>
  );
}
