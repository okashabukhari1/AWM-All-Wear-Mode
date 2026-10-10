import { Image } from "../Image";
import AWMCinematicHero from "../components/home/AWMCinematicHero";
import Testimonials from "../components/home/Testimonials";
import TrendingRing from "../components/home/TrendingRing";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { imagery, money } from "../data";
import { useStore } from "../store";
import { ArrowLink, ProductCard } from "../components";
export default function Home() {
  const root = useRef<HTMLElement>(null);
  const products = useStore((s) => s.products).filter((p) => p.active);
  const [look, setLook] = useState(0);
  const lookProducts = [
    products.find((p) => p.category === "Shirts")!,
    products.find((p) => p.category === "Trousers")!,
    products.find((p) => p.category === "Casualwear")!,
  ].filter(Boolean);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
    const ctx = gsap.context(() => {
      gsap.from(".manifesto-line", {
        yPercent: 50,
        opacity: 0.2,
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".manifesto",
          start: "top 80%",
          end: "bottom 50%",
          scrub: 1,
        },
      });
    }, root);
    const refresh = () => ScrollTrigger.refresh();
    const images = root.current?.querySelectorAll("img");
    images?.forEach((img) => img.addEventListener("load", refresh));
    return () => {
      images?.forEach((img) => img.removeEventListener("load", refresh));
      ctx.revert();
    };
    });
    return () => media.revert();
  }, []);
  const featured = products.find((p) => p.category === "Streetwear");
  return (
    <main id="main" ref={root}>
      <AWMCinematicHero />
      <div className="ticker">
        <span>EVERY STYLE.</span>
        <i>✳</i>
        <span>EVERY MOOD.</span>
        <i>✳</i>
        <span>EVERY MODE.</span>
        <i>✳</i>
        <span>ALL WEAR MODE.</span>
        <i>✳</i>
      </div>
      <section id="perspective" className="intro section-padding">
        <p className="eyebrow reveal">01 / A DIFFERENT PERSPECTIVE</p>
        <div className="intro-grid">
          <h2 className="reveal">
            Less rules.
            <br />
            More <em>you.</em>
          </h2>
          <div className="reveal">
            <p>
              Some days, understated. Some days, unapologetic. We make pieces
              that move between both.
            </p>
            <p>
              Considered essentials. Expressive silhouettes. A wardrobe that
              keeps up with every version of you.
            </p>
            <ArrowLink to="/about">Meet All Wear Mode</ArrowLink>
          </div>
        </div>
      </section>
      <section className="collection-panels">
        <Link to="/men" className="collection-panel">
          <Image
            src={imagery.men}
            alt="Menswear editorial in tailored neutral layers"
            loading="lazy"
          />
          <span className="panel-overline">01 / MENSWEAR</span>
          <div>
            <h2>His mode.</h2>
            <p>Everyday essentials. Individual expression.</p>
            <span>
              Explore men <ArrowUpRight />
            </span>
          </div>
        </Link>
        <Link to="/women" className="collection-panel">
          <Image
            src={imagery.women}
            alt="Womenswear editorial in a relaxed silhouette"
            loading="lazy"
          />
          <span className="panel-overline">02 / WOMENSWEAR</span>
          <div>
            <h2>Her mode.</h2>
            <p>Confident silhouettes. Endless possibilities.</p>
            <span>
              Explore women <ArrowUpRight />
            </span>
          </div>
        </Link>
      </section>
      <section className="manifesto section-padding">
        <p className="eyebrow">02 / MORE THAN WHAT YOU WEAR</p>
        <div className="manifesto-line">NOT JUST</div>
        <div className="manifesto-line">
          CLOTHING<span>®</span>
        </div>
        <div className="manifesto-line serif">a way to show up.</div>
        <div className="manifesto-bottom">
          <span>NO DRESS CODE. JUST YOU.</span>
          <p>
            For the off-duty days. The big moments.
            <br />
            And everything in between.
          </p>
        </div>
      </section>
      {featured && (
        <section className="signature">
          <div className="signature-image">
            <Image
              className="signature-photo"
              src={imagery.drop}
              alt="Signature heavyweight hoodie editorial reference"
              loading="lazy"
            />
            <span>THE SIGNATURE SERIES / 001</span>
          </div>
          <div className="signature-copy">
            <p className="eyebrow">03 / YOUR EVERYDAY ICON</p>
            <h2>
              Off duty.
              <br />
              <em>On point.</em>
            </h2>
            <p>
              An oversized silhouette. An understated attitude. Meet the layer
              you’ll reach for, again and again.
            </p>
            <div className="signature-product">
              <span>{featured.name}</span>
              <span>{money(featured.price)}</span>
            </div>
            <ArrowLink to={`/product/${featured.slug}`}>
              Make it yours
            </ArrowLink>
          </div>
        </section>
      )}
      <TrendingRing />
      <section className="lookbook">
        <div className="lookbook-image">
          <Image
            src={imagery.men}
            alt="Model in a layered shirt, jacket and trousers look"
            loading="lazy"
          />
          {lookProducts.map((p, i) => (
            <button
              key={p.id}
              aria-label={`Explore ${p.name}`}
              className={`hotspot hotspot-${i} ${look === i ? "active" : ""}`}
              onClick={() => setLook(i)}
            >
              <Plus size={18} />
            </button>
          ))}
          <span className="look-caption">A LOOK. A FEELING. A WHOLE MODE.</span>
        </div>
        <div className="lookbook-copy">
          <p className="eyebrow">04 / THE OUTFIT EXPLORER</p>
          <h2>
            Good together.
            <br />
            <em>Great on you.</em>
          </h2>
          <p>
            The art of getting dressed. Explore the pieces, then make the look
            your own.
          </p>
          <div className="look-tabs">
            {lookProducts.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setLook(i)}
                className={look === i ? "selected" : ""}
              >
                {String(i + 1).padStart(2, "0")} / {p.category}
              </button>
            ))}
          </div>
          {lookProducts[look] && (
            <div className="look-product">
              <Image
                src={lookProducts[look].images[0]}
                alt={lookProducts[look].name}
                loading="lazy"
              />
              <div>
                <h3>{lookProducts[look].name}</h3>
                <p>{money(lookProducts[look].price)}</p>
                <small>Sizes {lookProducts[look].sizes.join(" / ")}</small>
                <ArrowLink to={`/product/${lookProducts[look].slug}`}>
                  View piece
                </ArrowLink>
              </div>
            </div>
          )}
          <small className="asset-note">
            Illustrative styling. Product imagery is a demo reference.
          </small>
        </div>
      </section>
      <section className="new-drop section-padding">
        <div className="section-heading reveal">
          <div>
            <p className="eyebrow">FRESH PERSPECTIVES, JUST LANDED</p>
            <h2>
              New in. <em>Now you.</em>
            </h2>
          </div>
          <ArrowLink to="/new-arrivals">Explore the new drop</ArrowLink>
        </div>
        <div className="new-drop-grid">
          <Link to="/new-arrivals" className="editorial-card">
            <Image
              src={imagery.lookbook}
              alt="A considered edit of contemporary clothing"
              loading="lazy"
            />
            <span>
              THE NEW DROP
              <br />
              <strong>
                A fresh
                <br />
                state of mind.
              </strong>
              <ArrowUpRight />
            </span>
          </Link>
          {products
            .filter((p) => p.isNew)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      <section className="campaign">
        <Image className="campaign-photo" src={imagery.campaign} alt="Expressive campaign portrait in warm natural light" loading="lazy" />
        <div><p className="eyebrow">AWM / A WARDROBE WITHOUT LIMITS</p><h2>YOUR STYLE.<br /><em>Your rules.</em></h2><ArrowLink to="/collections/streetwear" light>Find your expression</ArrowLink></div>
        <span>EVERY VERSION OF YOU IS WELCOME.</span>
      </section>
      <section className="brand-story section-padding">
        <p className="eyebrow reveal">ROOTED IN SELF-EXPRESSION.</p>
        <h2 className="reveal">
          One wardrobe.
          <br />
          <em>Infinite possibilities.</em>
        </h2>
        <div className="brand-bottom">
          <p>
            All Wear Mode is a perspective on everyday dressing. We believe the
            best style is the kind that feels like you — comfortable, confident,
            and always evolving.
          </p>
          <ArrowLink to="/about">Our perspective</ArrowLink>
          <span className="mini-wordmark">
            awm
            <ArrowRight size={40} />
          </span>
        </div>
      </section>
      <Testimonials />
    </main>
  );
}
