# AWM — All Wear Mode

A React + TypeScript client-pitch fashion storefront. The visual direction combines oversized editorial typography, warm monochrome photography, and scroll-controlled fashion scenes with a practical shopping experience.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. Production verification:

```sh
npm test
npm run build
npm run preview
```

Executed checks and their limits are recorded in [docs/QA.md](docs/QA.md). Latest preview captures: [desktop](docs/optimized-home-desktop.png) and [mobile](docs/optimized-home-mobile.png).

## Stack and structure

- React 19, TypeScript, Vite, Tailwind CSS 4
- GSAP / ScrollTrigger, Lenis, React Router, Lucide, Zustand persist
- `src/data.ts`: 48 products, per-size/per-colour stock, centralized imagery
- `src/store.ts`: inventory, cart, wishlist, demo sessions and orders
- `src/components.tsx`: accessible dialogs, navigation, product cards, cart drawer
- `src/pages`: homepage, shopping, account, information, and demo admin
- `src/styles.css`: shared editorial design system and responsive styles

All requested storefront routes are implemented, including the dynamic collection, product, and order routes. The admin has dashboard, product CRUD, variant inventory, order management, and fictitious customer profiles. Open `/admin` directly or use Admin in the desktop navbar, mobile header, mobile menu, or footer. No administrator sign-in is required; the admin is visibly a local demo.

## Demo flows

1. Select a piece, colour, and size; add it to your bag.
2. Change quantities in the drawer or `/cart`. Stock checks apply to each variant.
3. Enter **fictitious** checkout details. Cash on Delivery and Online Payment are both simulations, with no card fields.
4. Place a demo order. The app snapshots product details, reduces variant inventory, clears the bag, and displays an order reference.
5. View `/account/orders`. Guest mode shows orders on this device; demo sign-in filters history by the entered email.
6. Update status in `/admin/orders`; the customer tracking view reflects it.
7. Add or edit products and inventory in admin; the storefront uses the same data immediately.

The cart, wishlist, catalogue edits, profiles, session, and orders persist under `awm-demo-v1` in LocalStorage. Clear site data in the browser to reset the demo. The newsletter and contact form display acknowledgements; they do not submit or send anything. Social links lead to a prefilled contact enquiry for the official profile URL; verified AWM social URLs have not been supplied.

## Motion and accessibility

GSAP is the primary animation engine. The homepage uses one pinned master timeline and a persistent transparent canvas: a quiet opening wordmark and a central walking sequence, then a minimal peach editorial campaign. The outfit has no animated X/Y translation, scale, or top change: scrolling only advances its source pose. Masked “YOUR MODE” lines, a soft circle reveal, and short shopping links provide the surrounding motion. The two outline frame elements and connector have been removed. Scrolling controls the source walking frames in either direction; there is no independent playback.

The brand preloader runs on initial page loads, refreshes, and direct route entry. It prepares the entry route module, visible or explicitly eager page images, fonts and the local fallback. Animated Home also prepares seven spaced walking poses, including the first and last. Other routes and reduced-motion Home skip animated pose downloads. Below-fold photos remain lazy; other routes load when visited. The counter measures completed tasks, and required asset failures keep the loader visible with Retry. Unavailable editorial/product photos use the local fallback. Subsequent in-app navigation does not replay the loader.

The shared SiteMotion component gives routes, newly inserted catalogue results, typography, images, cards, forms, account/admin panels, navigation, newsletter and footer elements GSAP entrances and icon interactions. IntersectionObserver limits entrances to visible content; matchMedia cleanup supports live reduced-motion changes. Accordion answers and dialogs have their own entrances. The homepage retains manifesto motion and a regular editorial campaign image.

`src/components/home/WalkingOutfitSequence.tsx` reuses the seven decoded boot poses, then prepares remaining images with four concurrent requests after readiness. Requested scroll poses get priority, and the component retains at most 48 decoded frames. It draws only when the pose or canvas dimensions change, caps DPR at 2, and cancels requests/observers on unmount. Desktop uses 180 poses; mobile uses 91 sampled poses at 239 × 480. The component responds to viewport changes. Reduced motion shows a static final frame and both shopping links without a pin or canvas loader.

Run `python scripts/process-walk.py` with Pillow and NumPy to reproduce the initial mattes from the supplied JPEGs. It sorts numeric filenames (the source skips 179), creates one shared crop, chroma-keys to genuine alpha and removes green spill. Then run `python scripts/optimize-assets.py --download-editorial` to generate local responsive photo variants and the smaller mobile WebP frames with exact alpha. Without the flag, the optimizer reuses originals cached under `.qa/editorial-originals`. Latest seven-pose light/dark proof: `docs/optimized-walk-proof.jpg`. **The source contains visible forearms and hands, which are preserved; it is not a fully invisible mannequin.**

GSAP contexts and Lenis ticker subscriptions are cleaned up. Dialogs render in a body portal so transformed cards cannot clip them. They handle Escape, focus trapping, focus restoration, and body scrolling. Navigation and forms have labels and visible focus states.

Product cards have rounded surfaces, image gradients, wishlist controls, actual colour selection and a size-selected quick-add flow. The round testimonial carousel adapts the supplied Originkit geometry with perspective, rotation, drag momentum, keyboard navigation, pause controls and a static reduced-motion mode. Its quotes are explicitly labelled fictional samples. The black footer follows the supplied noth.in reference composition using original AWM copy and an oversized AWM wordmark.

Current visual captures: [desktop hero](docs/awm-minimal-hero-desktop.jpg), [mobile hero](docs/awm-minimal-hero-mobile.jpg), [footer](docs/awm-refined-footer-desktop.jpg), and [testimonials](docs/awm-refined-testimonials-desktop.jpg).

## Image and font references

Images are stock/editorial **references**. Sixteen existing Unsplash references and eight local Pexels references now have self-hosted WebP variants at 480, 900 and up to 1600px. The shared `Image` component maps legacy catalogue URLs to these assets, including persisted default imagery, while preserving custom admin uploads. Product photos are grouped by clothing category and are intentionally illustrative; several catalogue entries reuse references. Exact garment identity, material specifications, fit, and colour photography are not asserted. Replace with approved SKU photography for a real inventory catalogue. The outfit explorer is illustrative styling.

Unsplash licence: https://unsplash.com/license

Additional womenswear image references: [white tee, Brian Wangenheim](https://unsplash.com/photos/woman-in-white-t-shirt-zG1c8Q6H9C8), [shirt and trousers, Jennifer mela444](https://unsplash.com/photos/woman-in-white-shirt-and-beige-pants-zRUP4LrIn68), [neutral layer and denim, Juan Ordonez](https://unsplash.com/photos/woman-in-beige-long-sleeve-shirt-and-gray-denim-jeans-leaning-on-glass-wall-NGAwzpvEzXQ). Responsive sources are delivered through the shared `Image` component, with a local editorial-reference fallback on image failure.

Space Grotesk, DM Sans and DM Serif Display are self-hosted Latin WOFF2 fonts from Fontsource packages, with `font-display: swap` and preloads for the two primary families. Their OFL licences are retained in `docs/vendor`. Default imagery and fonts no longer depend on external requests at runtime. Custom admin image URLs may still require network access.

## Performance

| Measured asset scope | Before | After |
| --- | ---: | ---: |
| Startup JavaScript, gzip (Home and required chunks) | ~232 KB, including all boot-preloaded routes | ~160 KB; other routes and gallery deferred |
| 24 photo references, originals versus default 900px variants | 8.10 MB | 1.53 MB (81% less) |
| All 180 mobile frame files | 11.35 MB | 3.25 MB (71% less) |
| Walking bytes required before desktop reveal | 3.75 MB / 180 poses | 0.14 MB / 7 poses |
| Walking bytes required before mobile reveal | 5.71 MB / 91 poses | 0.12 MB / 7 poses |

The 3D gallery and its Framer Motion features load within 600px of the section. A fixed-height placeholder preserves its space. Store selectors reduce unnecessary card renders; image-driven ScrollTrigger refreshes are coalesced into one animation frame. Hashed JavaScript/font bundles support long-lived caching. `public/_headers` supplies caching rules for hosts supporting that format; other hosts need equivalent configuration. These figures measure asset bytes, not a guaranteed connection speed. Local production-preview readiness was observed at approximately 0.6–0.8 seconds; no throttled Lighthouse or deployed-server measurement was performed.

## Vercel

Import this directory as a Vite project. Build command: `npm run build`. Output directory: `dist`. `vercel.json` provides SPA routing for direct deep links. No environment variables or credentials are needed. This task prepares deployment; it does not publish a real shop.

`robots.txt` blocks crawling because this is a demo. Page titles and descriptions update on navigation; Open Graph defaults are included. This client-rendered prototype does not claim full production SEO. For a real launch add a verified canonical domain, SKU metadata, generated sitemap, server-rendered product information, and intentional robots rules.

## Production boundaries

No backend, database, real authentication, email provider, payment processor, shipping integration, or secure admin authorization exists. LocalStorage can be edited and is not protected. Do not enter real private details. Policies and estimates are proposed demo copy requiring operational/legal review. Revenue KPIs derive only from orders created on this device; no real company performance is claimed. A production build needs authoritative inventory, server-side validation, transactional orders, verified product assets, secure identity, and real fulfilment integrations.

## Trending hover gallery

The homepage trending section uses Lightswind's 3D Hover Gallery, installed with `npx lightswind@latest add 3d-hover-gallery` and adapted to the supplied source reference. The gallery is centered with a maximum width of 1,040px; the expanded desktop card is approximately 280px at the maximum gallery width and scales down with its container. Width, tilt, zoom, shade and image filters share a 650ms easing curve, with 80ms pointer intent to prevent flickering across panels. Hover, focus or click expands a product while neighbouring panels tilt. Arrow keys and Home/End select products; Escape collapses the desktop selection. Autoplay is disabled.

Product names, prices, colours, wishlist controls, product links and size-selected quick-add are connected to the existing catalogue and store. On narrow screens a contained horizontal gallery supports scrolling and tapping, and expanded cards fit the gallery's own width. Reduced motion displays the same products in a static grid.

The eight featured products use local modest fashion editorial images, including hijab styling and traditional menswear. The same assets appear in their linked product pages and quick views. [Photo sources and credits](docs/fashion-image-sources.md) document these stock references. Storage version 2 refreshes only their previous default imagery, preserving admin uploads and shopping state.

The previous 3D ring component and its rotation helpers were removed. Scroll Dissolve Reveal remains removed; the editorial campaign uses a regular image and collection link. Framer Motion handles the hover gallery, and the site's existing entrances use GSAP.

Sources: [Lightswind MIT license](docs/vendor/lightswind-LICENSE.txt). Current captures: [desktop hover gallery](docs/optimized-gallery-desktop.png), [mobile hover gallery](docs/optimized-gallery-mobile.png). Earlier ring screenshots in the repository record the prior design.
