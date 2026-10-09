import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return <>
    <section className="newsletter-band" aria-label="AWM newsletter">
      <div><p className="eyebrow">A LITTLE MORE AWM</p><h2>Good style.<br /><em>Straight to your inbox.</em></h2></div>
      <div className="newsletter-signup">
        <p>New drops, fresh perspectives, and pieces worth knowing.</p>
        <form onSubmit={event => { event.preventDefault(); setDone(true); }}>
          <input required type="email" value={email} onChange={event => { setEmail(event.target.value); setDone(false); }} aria-label="Newsletter email" placeholder="Your email address" autoComplete="email" />
          <button aria-label="Subscribe to demo newsletter"><ArrowUpRight size={22} /></button>
        </form>
        <small aria-live="polite">{done ? "You’re on the demo list. No emails will be sent." : "Newsletter preview. Your details stay on this device."}</small>
      </div>
    </section>
    <footer className="awm-footer">
      <div className="awm-footer-top">
        <div className="footer-invitation"><p className="eyebrow">EVERY VERSION OF YOU.</p><h2>Find your mode.<br /><em>Make it yours.</em></h2><div className="footer-pills"><Link to="/new-arrivals">SHOP THE NEW <ArrowRight size={18}/></Link><Link to="/contact">LET’S TALK <ArrowUpRight size={18}/></Link></div></div>
        <nav className="awm-footer-links" aria-label="Footer navigation">
          <div><p className="eyebrow">THE WARDROBE</p><Link to="/men">Men</Link><Link to="/women">Women</Link><Link to="/new-arrivals">New arrivals</Link><Link to="/trending">The edit</Link><Link to="/about">Our perspective</Link></div>
          <div><p className="eyebrow">HERE FOR YOU</p><Link to="/contact">Contact</Link><Link to="/faq">FAQs</Link><Link to="/shipping-returns">Shipping & returns</Link><Link to="/account/orders">Track your order</Link><Link to="/admin">Demo admin</Link></div>
          <div className="footer-socials"><p className="eyebrow">STAY CONNECTED</p>{["Instagram", "TikTok", "Facebook"].map(name => <Link key={name} to={`/contact?platform=${name}`} aria-label={`Request the official ${name} profile link`}>{name}<ArrowUpRight size={14}/></Link>)}<small>Ask us for official profile links</small></div>
        </nav>
      </div>
      <div className="awm-footer-mark"><svg viewBox="0 0 1000 320" role="img" aria-label="AWM — All Wear Mode"><text x="0" y="280" textLength="1000" lengthAdjust="spacingAndGlyphs">AWM</text></svg><span>ALL WEAR MODE®</span></div>
      <div className="awm-footer-bottom"><span>© {new Date().getFullYear()} AWM. All Wear Mode.</span><span className="footer-signature">DESIGNED TO BE YOU.</span><div><Link to="/privacy-policy">Privacy</Link><Link to="/terms">Terms</Link><button onClick={() => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}>Back to top ↑</button></div></div>
    </footer>
  </>;
}
